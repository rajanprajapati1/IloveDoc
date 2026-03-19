"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardCommandKeyRoundedIcon from "@mui/icons-material/KeyboardCommandKeyRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { checkedIconSvg, plainTextFromHtml, uncheckedIconSvg } from "./shared";

const CLIENT_ID_KEY = "docbook_ai_client_id";

function getClientId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `docbook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}

function extractTextDelta(payload) {
  const choice = payload?.choices?.[0];
  const delta = choice?.delta?.content ?? choice?.message?.content ?? "";

  if (typeof delta === "string") return delta;
  if (Array.isArray(delta)) {
    return delta
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text || "";
        return item?.text?.value || "";
      })
      .join("");
  }

  return "";
}

function sanitizeHtmlFragment(value) {
  if (!value) return "<p></p>";

  let cleaned = value.trim();
  cleaned = cleaned.replace(/^```(?:html)?/i, "").replace(/```$/i, "").trim();

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleaned = bodyMatch[1].trim();

  return cleaned || "<p></p>";
}

function usageFromHeaders(headers) {
  const promptsRemaining = Number(headers.get("x-docbook-prompts-remaining"));
  const promptsLimit = Number(headers.get("x-docbook-prompts-limit"));

  return {
    promptsRemaining: Number.isFinite(promptsRemaining) ? promptsRemaining : null,
    promptsLimit: Number.isFinite(promptsLimit) ? promptsLimit : null,
  };
}

async function streamSseResponse(response, onChunk) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Missing response stream.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);

      for (const line of lines) {
        if (line === "[DONE]") return;

        try {
          const parsed = JSON.parse(line);
          const text = extractTextDelta(parsed);
          if (text) onChunk(text);
        } catch {
          continue;
        }
      }
    }
  }
}

function buildChatMessages(activeNote, prompt) {
  const noteTitle = activeNote?.title?.trim() || "Untitled";
  const noteText = plainTextFromHtml(activeNote?.content || "").trim();

  return [
    {
      role: "system",
      content:
        "You are DocBook AI. Reply briefly, clearly, and practically. Help the user work inside a note-taking editor with notes, todos, tables, highlights, links, images, sticky notes, mentions, and folder references. Do not mention models or providers.",
    },
    {
      role: "user",
      content: `Active note title: ${noteTitle}\nActive note text:\n${noteText || "(empty)"}\n\nUser request:\n${prompt}`,
    },
  ];
}

function buildEditMessages(activeNote, prompt) {
  const noteTitle = activeNote?.title?.trim() || "Untitled";
  const noteHtml = activeNote?.content || "<p></p>";

  return [
    {
      role: "system",
      content: `You are DocBook AI working as a document editor. Return only a rich HTML fragment that can be appended into the current note. Do not wrap in markdown fences. Do not explain anything. Preserve existing custom DocBook spans and attributes when possible, including data-highlight, data-img-ref, data-user-mention, data-folder-ref, and data-note-ref.

For an unchecked todo, use exactly:
<div data-todo="false" style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span data-todo-checkbox="true" style="cursor: pointer; color: #8b5e3c; display: flex; align-items: center; justify-content: center; user-select: none;" contenteditable="false">${uncheckedIconSvg}</span><div style="flex: 1; outline: none; min-width: 50px;">Task text</div></div><p><br></p>

For a completed todo, use exactly:
<div data-todo="true" style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span data-todo-checkbox="true" style="cursor: pointer; color: #8b5e3c; display: flex; align-items: center; justify-content: center; user-select: none;" contenteditable="false">${checkedIconSvg}</span><div style="flex: 1; outline: none; min-width: 50px; text-decoration: line-through; opacity: 0.6;">Task text</div></div><p><br></p>

Use normal HTML for headings, paragraphs, lists, tables, and links. The fragment should be ready to append inside a contentEditable editor. Use the current note only as context for what to generate.`,
    },
    {
      role: "user",
      content: `Active note title: ${noteTitle}\nCurrent note HTML:\n${noteHtml}\n\nUpdate request:\n${prompt}`,
    },
  ];
}

export default function DocbookAIPanel({
  open,
  onClose,
  accentColor,
  activeNote,
  onDirectWriteStart,
  onDirectWriteChunk,
  onApplyDraft,
  onDirectWriteCancel,
  onWorkingChange,
}) {
  const [mode, setMode] = useState("edit");
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [draftHtml, setDraftHtml] = useState("");
  const [usage, setUsage] = useState({
    promptsRemaining: null,
    promptsLimit: null,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastEditPrompt, setLastEditPrompt] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const clientId = useMemo(() => getClientId(), []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, draftHtml, open, isStreaming]);

  useEffect(() => {
    onWorkingChange?.(isStreaming);
  }, [isStreaming, onWorkingChange]);

  useEffect(() => {
    if (!open && isStreaming) {
      abortRef.current?.abort();
      abortRef.current = null;
      onDirectWriteCancel?.();
      setIsStreaming(false);
    }
  }, [isStreaming, onDirectWriteCancel, open]);

  const canSend = input.trim().length > 0 && !isStreaming;
  const noteTitle = activeNote?.title?.trim() || "Untitled";

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    onDirectWriteCancel?.();
    setIsStreaming(false);
  };

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt || isStreaming) return;

    setErrorMessage("");
    setInput("");
    setIsStreaming(true);

    const requestMode = mode;
    const requestMessages =
      requestMode === "chat" ? buildChatMessages(activeNote, prompt) : buildEditMessages(activeNote, prompt);

    if (requestMode === "chat") {
      setChatMessages((prev) => prev.concat({ role: "user", content: prompt }, { role: "assistant", content: "" }));
    } else {
      setLastEditPrompt(prompt);
      setDraftHtml("");
      setEditStatus("Writing into the note...");
      onDirectWriteStart?.();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/v1/doc/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-docbook-client-id": clientId,
        },
        body: JSON.stringify({
          messages: requestMessages,
          clientId,
        }),
        signal: controller.signal,
      });

      setUsage(usageFromHeaders(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI request failed.");
      }

      let accumulated = "";
      await streamSseResponse(response, (chunk) => {
        accumulated += chunk;

        if (requestMode === "chat") {
          setChatMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
              next[lastIndex] = { ...next[lastIndex], content: accumulated };
            }
            return next;
          });
          return;
        }

        setDraftHtml(accumulated);
        onDirectWriteChunk?.(sanitizeHtmlFragment(accumulated));
      });

      if (requestMode === "edit" && !accumulated.trim()) {
        throw new Error("The AI returned an empty document.");
      }

      if (requestMode === "edit") {
        const ok = await onApplyDraft?.(sanitizeHtmlFragment(accumulated));
        setDraftHtml("");
        setEditStatus(ok ? "Written into the active note." : "Could not write into the note.");
      }
    } catch (error) {
      if (requestMode === "edit") {
        onDirectWriteCancel?.();
      }

      if (error?.name !== "AbortError") {
        setErrorMessage(error?.message || "AI request failed.");
        if (requestMode === "edit") {
          setEditStatus("Write failed.");
        }
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          left: "50%",
          transform: open ? "translate(-50%, 0)" : "translate(-50%, calc(100% + 18px))",
          width: "min(640px, calc(100vw - 24px))",
          bottom: { xs: 10, md: 18 },
          zIndex: 2450,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid rgba(20, 18, 16, 0.14)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,249,246,0.98) 100%)",
            backdropFilter: "blur(18px)",
            boxShadow: `
              0 22px 70px rgba(18, 16, 12, 0.18),
              0 8px 22px rgba(18, 16, 12, 0.08)
            `,
          }}
        >
          <Box
            sx={{
              px: 1.4,
              py: 0.9,
              borderBottom: "1px solid rgba(20, 18, 16, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                background: alpha(accentColor, 0.1),
                border: `1px solid ${alpha(accentColor, 0.16)}`,
              }}
            >
              <TipsAndUpdatesRoundedIcon sx={{ color: alpha("#2d2119", 0.82), fontSize: 16 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#201915", letterSpacing: "-0.02em" }}>
                DocBook AI
              </Typography>
              <Typography noWrap sx={{ fontSize: 10.5, color: alpha("#2d241d", 0.52), letterSpacing: "-0.01em" }}>
                Working on {noteTitle}
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  px: 0.8,
                  py: 0.4,
                  borderRadius: 1.8,
                  bgcolor: "rgba(20, 18, 16, 0.04)",
                  border: "1px solid rgba(20, 18, 16, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.55,
                }}
              >
                <KeyboardCommandKeyRoundedIcon sx={{ fontSize: 14, color: alpha("#3b2e25", 0.7) }} />
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: alpha("#3b2e25", 0.7) }}>Ctrl+D</Typography>
              </Box>

              <IconButton onClick={onClose} sx={{ color: "#473a31", width: 28, height: 28 }}>
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          <Box
            sx={{
              px: 1.4,
              py: 0.75,
              borderBottom: "1px solid rgba(20, 18, 16, 0.08)",
              display: "flex",
              gap: 0.7,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={0.8}>
              <Button
                size="small"
                onClick={() => setMode("edit")}
                startIcon={<BoltRoundedIcon />}
                sx={{
                  px: 1,
                  minWidth: 0,
                  borderRadius: 1.9,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: mode === "edit" ? alpha(accentColor, 0.12) : "transparent",
                  color: "#2d231c",
                  border: `1px solid ${mode === "edit" ? alpha(accentColor, 0.2) : "rgba(20, 18, 16, 0.08)"}`,
                }}
              >
                Append
              </Button>
              <Button
                size="small"
                onClick={() => setMode("chat")}
                startIcon={<TipsAndUpdatesRoundedIcon />}
                sx={{
                  px: 1,
                  minWidth: 0,
                  borderRadius: 1.9,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: mode === "chat" ? alpha(accentColor, 0.12) : "transparent",
                  color: "#2d231c",
                  border: `1px solid ${mode === "chat" ? alpha(accentColor, 0.2) : "rgba(20, 18, 16, 0.08)"}`,
                }}
              >
                Chat
              </Button>
            </Stack>

            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              {usage.promptsRemaining !== null && usage.promptsLimit !== null ? (
                <Typography sx={{ fontSize: 10.5, color: alpha("#342820", 0.62), fontWeight: 700 }}>
                  Prompts left: {usage.promptsRemaining}/{usage.promptsLimit}
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Box
            ref={scrollRef}
            sx={{
              px: 1.4,
              py: 1.05,
              height: 156,
              overflowY: "auto",
              background: "rgba(255,255,255,0.5)",
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(20, 18, 16, 0.14)",
                borderRadius: 999,
              },
            }}
          >
            {mode === "chat" ? (
              <Stack spacing={1}>
                {chatMessages.length === 0 ? (
                  <Box
                    sx={{
                      p: 1.1,
                      borderRadius: 2,
                      background: "#ffffff",
                      border: "1px solid rgba(20, 18, 16, 0.08)",
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#2e241d" }}>
                      Ask anything about this note.
                    </Typography>
                    <Typography sx={{ mt: 0.45, fontSize: 11.5, color: alpha("#2e241d", 0.62), lineHeight: 1.55 }}>
                      Use append to generate rich note blocks, todos, tables, and formatted sections from your current note context.
                    </Typography>
                  </Box>
                ) : null}

                {chatMessages.map((message, index) => (
                  <Box
                    key={`${message.role}-${index}`}
                    sx={{
                      ml: message.role === "assistant" ? 0 : "auto",
                      maxWidth: "92%",
                      px: 1,
                      py: 0.8,
                      borderRadius: 2,
                      background:
                        message.role === "assistant"
                          ? "#ffffff"
                          : alpha(accentColor, 0.12),
                      border: `1px solid ${message.role === "assistant" ? "rgba(20, 18, 16, 0.08)" : alpha(accentColor, 0.16)}`,
                    }}
                  >
                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        fontSize: 12,
                        lineHeight: 1.55,
                        color: "#261f19",
                      }}
                    >
                      {message.content || (isStreaming && message.role === "assistant" ? "Writing..." : "")}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Box
                  sx={{
                    p: 1.35,
                    borderRadius: 2,
                    background: "#ffffff",
                    border: "1px solid rgba(20, 18, 16, 0.08)",
                  }}
                >
                  <Typography sx={{ fontSize: 11.5, color: alpha("#2d241d", 0.66), lineHeight: 1.5 }}>
                    {lastEditPrompt
                      ? `Request: ${lastEditPrompt}`
                      : "Describe what to generate from this note. AI will write directly into the active note as rich text."}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    minHeight: 84,
                    borderRadius: 2,
                    border: "1px solid rgba(20, 18, 16, 0.08)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ fontSize: 11.5, color: alpha("#2d241d", 0.48), lineHeight: 1.5 }}>
                      {isStreaming ? "AI is writing directly into your note..." : editStatus || "No preview here. Generated content goes straight into the document."}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>

          <Box sx={{ px: 1.4, py: 1, borderTop: "1px solid rgba(20, 18, 16, 0.08)" }}>
            {errorMessage ? (
              <Typography sx={{ mb: 0.8, fontSize: 11.5, color: "#a33d2f", fontWeight: 700 }}>
                {errorMessage}
              </Typography>
            ) : null}

            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(20, 18, 16, 0.12)",
                background: "#ffffff",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
                p: 0.7,
              }}
            >
              <Box
                component="textarea"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder={
                  mode === "edit"
                    ? "Create todos, rewrite this note, complete tasks, build a table, or structure content..."
                    : "Ask about the active note or what to do next..."
                }
                sx={{
                  width: "100%",
                  minHeight: 58,
                  resize: "none",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "#201915",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  px: 0.4,
                  py: 0.35,
                  "&::placeholder": {
                    color: alpha("#2d241d", 0.38),
                  },
                }}
              />

              <Stack direction="row" spacing={0.9} justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                <Typography sx={{ fontSize: 10.5, color: alpha("#2d241d", 0.48), fontWeight: 700, maxWidth: 155, lineHeight: 1.35 }}>
                  {mode === "edit" ? "Direct write into active note." : "Live stream from note context."}
                </Typography>

                <Stack direction="row" spacing={0.8}>
                  {isStreaming ? (
                    <Button
                      onClick={handleStop}
                      variant="outlined"
                      startIcon={<StopRoundedIcon />}
                      sx={{
                        borderRadius: 2.2,
                        textTransform: "none",
                        fontWeight: 800,
                        color: "#2a211b",
                        borderColor: "rgba(20, 18, 16, 0.12)",
                      }}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handleSubmit()}
                      disabled={!canSend}
                      variant="contained"
                      endIcon={<PlayArrowRoundedIcon />}
                      sx={{
                        borderRadius: 2.2,
                        textTransform: "none",
                        fontWeight: 900,
                        color: "#1d1713",
                        background: `linear-gradient(135deg, ${alpha(accentColor, 0.18)} 0%, #fff7ef 100%)`,
                        border: `1px solid ${alpha(accentColor, 0.18)}`,
                        boxShadow: `0 8px 18px ${alpha(accentColor, 0.12)}`,
                      }}
                    >
                      Send
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
