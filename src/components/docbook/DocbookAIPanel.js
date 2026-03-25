"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardCommandKeyRoundedIcon from "@mui/icons-material/KeyboardCommandKeyRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import DocbookRedeemModal from "./DocbookRedeemModal";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createTodoHtml, plainTextFromHtml } from "./shared";
import { AiSvg, BrainSvg, ChatSvg, NotesSvg, WriteSvg, ClaudeSvg, GeminiSvg, KImiSvg, GrokSvg } from "@/assets/icon";

const AI_MODELS = [
  { key: 'claude', name: 'Claude', Icon: ClaudeSvg, color: '#ff7043' },
  { key: 'gemini', name: 'Gemini', Icon: GeminiSvg, color: '#4285f4' },
  { key: 'kimi', name: 'Kimi', Icon: KImiSvg, color: '#6a6a6a' },
  { key: 'grok', name: 'Grok', Icon: GrokSvg, color: '#1d1d1f' },
];

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

function buildChatMessages(activeNote, prompt, docbookNotes = [], activeStickyNotes = []) {
  const noteTitle = activeNote?.title?.trim() || "Untitled";
  const noteText = plainTextFromHtml(activeNote?.content || "").trim();

  const noteListText = docbookNotes
    .slice(0, 30)
    .map(n => `- ID: ${n.id} ${n.id === activeNote?.id ? '(ACTIVE)' : ''} | Title: ${n.title || 'Untitled'} | Snippet: ${plainTextFromHtml(n.content || "").slice(0, 80).replace(/\n/g, " ")}`)
    .join("\n");

  const stickyListText = activeStickyNotes
    .map(s => `- ID: ${s.id} | Content: ${s.content?.slice(0, 50)} | Pos: (${Math.round(s.x)}, ${Math.round(s.y)})`)
    .join("\n");

  const systemContent = `You are Dockie. Reply briefly, clearly, and practically.
You are assisting the user inside a rich note-taking app.

Currently Active Note: ${noteTitle}
Text: ${noteText || "(empty)"}

Available Notes in workspace:
${noteListText}

Sticky Notes on this page:
${stickyListText || "(none)"}

**ACTIONS ALLOWED:**
You can perform special actions on behalf of the user by outputting exact HTML action tags IN ADDITION TO your conversational reply.
1. Create Note: <action type="create_note" title="Note Title">Note Content HTML</action>
2. Edit Note: <action type="edit_note" note_id="ID_HERE">New Note Content HTML</action>
3. Change Theme of ACTIVE NOTE: <action type="change_theme" color="#f28b82" />
4. Create Sticky Note: <action type="create_sticky_note" x="150" y="200">Sticky Content</action>
5. Edit Sticky Note: <action type="edit_sticky_note" sticky_id="ID_HERE">New Sticky Content</action>

If the user asks you to create a note/sticky, edit a note/sticky, or change the theme, you MUST output the corresponding action tag. Do NOT ask for permission, just execute the action inside the tag!`;

  return [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}

function buildEditMessages(activeNote, prompt, selectedHtml = "") {
  const noteTitle = activeNote?.title?.trim() || "Untitled";
  const noteHtml = activeNote?.content || "<p></p>";

  let systemContent = `You are Dockie working as an expert document editor. Return ONLY a rich HTML fragment that can be inserted into the current note. DO NOT wrap in markdown fences (no \`\`\`html). DO NOT explain anything.

Preserve existing custom DocBook spans and attributes when possible, including data-highlight, data-img-ref, data-user-mention, data-folder-ref, and data-note-ref.

You have full access to rich text formatting. Use it! 
- Bold: <strong>...</strong>
- Italic: <em>...</em>
- Highlights: <mark data-highlight="true" style="background-color: #ffeb3b;">...</mark>
- Links: <a href="..." target="_blank">...</a>
- Headings: <h1>, <h2>, <h3>
- Lists: <ul><li>...</li></ul> or <ol><li>...</li></ol>

For an unchecked todo, use exactly:
${createTodoHtml({ content: "Task text", trailingParagraph: true })}

For a completed todo, use exactly:
${createTodoHtml({ checked: true, content: "Task text", trailingParagraph: true })}`;

  if (selectedHtml) {
    systemContent += `\n\nCRITICAL INSTRUCTION: The user has SELECTED a specific part of the text. You must rewrite or replace ONLY this selected fragment according to the prompt.

Rules you must follow:
- Return ONLY the replacement HTML fragment for the selected content.
- DO NOT rewrite the whole note.
- DO NOT include content from outside the selection unless the user explicitly asks to insert new nearby content as part of this replacement.
- DO NOT include <html>, <body>, or a full-document wrapper.
- The returned fragment must be valid to paste exactly in place of the selected fragment.

[SELECTED TEXT START]
${selectedHtml}
[SELECTED TEXT END]`;
  } else {
    systemContent += `\n\nCRITICAL INSTRUCTION: The user wants to APPEND to the document. Return ONLY the new HTML to append.`;
  }

  return [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: `Active note title: ${noteTitle}\nCurrent note HTML:\n${noteHtml}\n\nUpdate request:\n${prompt}`,
    },
  ];
}

function normalizePrompt(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRequestedTitle(prompt) {
  const quotedTitleMatch = prompt.match(/(?:called|named|title(?:d)?(?:\s+as)?)\s+["']([^"']+)["']/i);
  if (quotedTitleMatch?.[1]?.trim()) return quotedTitleMatch[1].trim();

  const bareTitleMatch = prompt.match(/(?:called|named|title(?:d)?(?:\s+as)?)\s+([a-z0-9][a-z0-9\s\-_:]{1,80})$/i);
  if (bareTitleMatch?.[1]?.trim()) return bareTitleMatch[1].trim();

  return "";
}

function detectLocalDocumentIntent(prompt) {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return null;

  const wantsClear =
    /\b(clear|empty|erase|wipe|reset|remove all)\b/.test(normalized)
    && /\b(note|document|page|content|contents|text)\b/.test(normalized);

  if (wantsClear || /\bclear my note\b/.test(normalized) || /\bempty this note\b/.test(normalized)) {
    return { type: "clear_note" };
  }

  const wantsCreateNote =
    /\b(create|make|start|open)\b/.test(normalized)
    && /\b(new|another|fresh)\b/.test(normalized)
    && /\b(note|document|page)\b/.test(normalized);

  if (wantsCreateNote || /\bcreate new note\b/.test(normalized) || /\bmake a new note\b/.test(normalized)) {
    return {
      type: "create_note",
      title: extractRequestedTitle(prompt) || "New Note",
    };
  }

  return null;
}

function MarkdownMessage({ content, accentColor }) {
  return (
    <Box
      sx={{
        color: "#1c1c1e",
        fontSize: 14.5,
        lineHeight: 1.7,
        wordBreak: "break-word",
        "& p": { my: 0 },
        "& p + p": { mt: 1.2 },
        "& ul, & ol": { my: 1, pl: 3 },
        "& li + li": { mt: 0.45 },
        "& blockquote": {
          my: 1.2,
          pl: 1.5,
          py: 0.25,
          borderLeft: `3px solid ${alpha(accentColor, 0.5)}`,
          color: "rgba(28, 28, 30, 0.78)",
          backgroundColor: alpha(accentColor, 0.05),
          borderRadius: "0 10px 10px 0",
        },
        "& table": {
          width: "100%",
          my: 1.25,
          borderCollapse: "collapse",
          overflow: "hidden",
          borderRadius: "12px",
          border: "1px solid rgba(28, 28, 30, 0.08)",
          display: "block",
          overflowX: "auto",
        },
        "& th, & td": {
          border: "1px solid rgba(28, 28, 30, 0.08)",
          px: 1.2,
          py: 0.85,
          fontSize: 13.5,
          textAlign: "left",
        },
        "& th": {
          backgroundColor: "rgba(20, 18, 16, 0.05)",
          fontWeight: 700,
        },
        "& a": {
          color: accentColor,
          textDecorationColor: alpha(accentColor, 0.4),
        },
        "& hr": {
          border: 0,
          borderTop: "1px solid rgba(28, 28, 30, 0.1)",
          my: 1.5,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");

            if (inline || !match) {
              return (
                <Box
                  component="code"
                  sx={{
                    px: 0.7,
                    py: 0.25,
                    borderRadius: "8px",
                    backgroundColor: "rgba(20, 18, 16, 0.06)",
                    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                    fontSize: "0.9em",
                  }}
                  {...props}
                >
                  {children}
                </Box>
              );
            }

            return (
              <Box sx={{ my: 1.2, overflow: "hidden", borderRadius: "14px" }}>
                <SyntaxHighlighter
                  {...props}
                  language={match[1]}
                  style={oneLight}
                  customStyle={{
                    margin: 0,
                    borderRadius: "14px",
                    padding: "14px 16px",
                    fontSize: "13px",
                    lineHeight: 1.55,
                    background: "#f8f8fb",
                    border: "1px solid rgba(28, 28, 30, 0.08)",
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                    },
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </Box>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

export default function DocbookAIPanel({
  open,
  onClose,
  accentColor,
  activeNote,
  docbookNotes = [],
  activeStickyNotes = [],
  onDirectWriteStart,
  onDirectWriteChunk,
  onApplyDraft,
  onDirectWriteCancel,
  onWorkingChange,
  onStartCircleToEdit,
  onAppendToNote,
  onActionCreateNote,
  onActionEditNote,
  onActionCreateStickyNote,
  onActionUpdateStickyNote,
  onActionChangeTheme,
}) {
  const noteTitle = activeNote?.title || "Untitled";
  const [mode, setMode] = useState("chat");
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const [modelHovered, setModelHovered] = useState(false);
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
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
    if (modelHovered) return;
    const timer = setInterval(() => {
      setActiveModelIndex((prev) => (prev + 1) % AI_MODELS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [modelHovered]);

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

    const requestMode = mode;
    const localIntent = detectLocalDocumentIntent(prompt);

    if (localIntent?.type === "clear_note" && activeNote?.id) {
      if (requestMode === "chat") {
        setChatMessages((prev) => prev.concat(
          { role: "user", content: prompt },
          { role: "assistant", content: "Cleared the active note." }
        ));
      } else {
        setEditStatus("Cleared the active note.");
      }
      await onActionEditNote?.(activeNote.id, "<p></p>");
      return;
    }

    if (localIntent?.type === "create_note") {
      if (requestMode === "chat") {
        setChatMessages((prev) => prev.concat(
          { role: "user", content: prompt },
          { role: "assistant", content: `Created a new note${localIntent.title ? `: ${localIntent.title}` : "."}` }
        ));
      } else {
        setEditStatus(`Created a new note${localIntent.title ? `: ${localIntent.title}` : "."}`);
      }
      await onActionCreateNote?.(localIntent.title || "New Note", "<p></p>");
      return;
    }

    setIsStreaming(true);

    let requestMessages;
    let selectedHtml = "";
    let editScope = "append";

    if (requestMode === "chat") {
      requestMessages = buildChatMessages(activeNote, prompt, docbookNotes, activeStickyNotes);
      setChatMessages((prev) => prev.concat({ role: "user", content: prompt }, { role: "assistant", content: "" }));
    } else {
      setLastEditPrompt(prompt);
      setDraftHtml("");
      setEditStatus("Writing into the note...");
      const startResult = onDirectWriteStart?.();
      if (typeof startResult === "string" && startResult.trim() !== "") {
        selectedHtml = startResult;
        editScope = "selection";
      } else if (startResult && typeof startResult === "object") {
        if (typeof startResult.selectedHtml === "string" && startResult.selectedHtml.trim() !== "") {
          selectedHtml = startResult.selectedHtml;
        }
        if (typeof startResult.scope === "string") {
          editScope = startResult.scope;
        }
      }
      setEditStatus(editScope === "selection" ? "Editing only the selected text..." : "Appending into the note...");
      requestMessages = buildEditMessages(activeNote, prompt, selectedHtml);
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
        let parsed;
        try {
          parsed = JSON.parse(errorText);
        } catch { }
        if (response.status === 429 && parsed?.error?.includes("limit reached")) {
          setShowRedeemModal(true);
          throw new Error("RATE_LIMIT");
        }
        throw new Error(parsed?.error || errorText || "AI request failed.");
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

      if (requestMode === "chat") {
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(accumulated, "text/html");
        const actions = tempDoc.querySelectorAll("action");

        actions.forEach(node => {
          const type = node.getAttribute("type");
          if (type === "create_note") {
            onActionCreateNote?.(node.getAttribute("title") || "New Note", node.innerHTML);
          } else if (type === "edit_note") {
            onActionEditNote?.(node.getAttribute("note_id"), node.innerHTML);
          } else if (type === "change_theme") {
            onActionChangeTheme?.(node.getAttribute("color"));
          } else if (type === "create_sticky_note") {
            onActionCreateStickyNote?.(node.innerHTML, parseFloat(node.getAttribute("x")), parseFloat(node.getAttribute("y")));
          } else if (type === "edit_sticky_note") {
            onActionUpdateStickyNote?.(node.getAttribute("sticky_id"), node.innerHTML);
          }
        });

        const cleanText = accumulated.replace(/<action[\s\S]*?<\/action>/gi, "").replace(/<action[^>]*\/>/gi, "").trim();

        setChatMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
            next[lastIndex] = { ...next[lastIndex], content: cleanText || "Done!" };
          }
          return next;
        });
      }

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

      if (error?.message === "RATE_LIMIT") {
        setErrorMessage("Daily prompt limit reached. Please redeem a code.");
      } else if (error?.name !== "AbortError") {
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
          bottom: { xs: 16, md: 32 },
          transform: open ? "translate(-50%, 0)" : "translate(-50%, calc(100% + 40px))",
          width: "min(680px, calc(100vw - 32px))",
          zIndex: 1200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.5)",
            background: "linear-gradient(145deg, rgba(246, 246, 249, 0.96) 0%, rgba(240, 240, 245, 0.96) 100%)",
            backdropFilter: "blur(40px)",
            boxShadow: `
              0 24px 80px rgba(0, 0, 0, 0.12),
              0 8px 24px rgba(0, 0, 0, 0.04),
              inset 0 1px 1px rgba(255, 255, 255, 0.8)
            `,
            p: 1.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, px: 0.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(accentColor, 0.6)} 0%, ${alpha(accentColor, 0.2)} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.2
              }}
            >
              {/* <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: "#fff" }} /> */}
              <NotesSvg />
            </Box>
            <Typography sx={{ fontSize: 14, color: "#2d241d" }}>
              Working on <Box component="span" sx={{ fontWeight: 700 }}>{noteTitle}</Box>
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={0.5}>
              <IconButton onClick={onClose} sx={{ color: "#777", width: 28, height: 28 }}>
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          {mode === "chat" && chatMessages.length > 0 && (
            <Box
              ref={scrollRef}
              sx={{
                maxHeight: "35vh",
                overflowY: "auto",
                px: 1,
                pb: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 10 },
              }}
            >
              {chatMessages.map((message, index) => (
                <Box key={`${message.role}-${index}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.25,
                      borderRadius: '12px',
                      bgcolor: message.role === "assistant" ? alpha(accentColor, 0.15) : "rgba(20, 18, 16, 0.06)",
                      mb: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      width: '100%',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 'auto' }}>
                      {message.role === "assistant" && <AiSvg fontsize={18} />}
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: message.role === "assistant" ? "orange" : "#555" }}>
                        {message.role === "assistant" ? "Dockie" : "You"}
                      </Typography>
                    </Box>
                    {message.role === "assistant" && !isStreaming && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Copy to clipboard" placement="top" arrow>
                          <IconButton
                            size="small"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            sx={{ width: 22, height: 22, color: accentColor }}
                          >
                            <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Append this response to active note" placement="top" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onAppendToNote?.(message.content)}
                            sx={{ width: 22, height: 22, color: accentColor }}
                          >
                            <PlaylistAddRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {message.role === "assistant" ? (
                        <MarkdownMessage
                          content={message.content || (isStreaming ? "Generating..." : "")}
                          accentColor={accentColor}
                        />
                      ) : (
                        <Typography
                          sx={{
                            whiteSpace: "pre-wrap",
                            fontSize: 14.5,
                            lineHeight: 1.6,
                            color: "#1c1c1e",
                          }}
                        >
                          {message.content}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Box
            sx={{
              background: "#ffffff",
              borderRadius: "20px",
              p: 1.2,
              border: "1px solid rgba(0, 0, 0, 0.04)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)"
            }}
          >
            {errorMessage && (
              <Typography sx={{ mb: 1, px: 1, fontSize: 12, color: "#d93025", fontWeight: 600 }}>
                {errorMessage}
              </Typography>
            )}

            <Box
              component="textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={mode === "edit" ? "If text is selected, AI edits only that selection. Without a selection, it appends." : "Type a note prompt"}
              sx={{
                width: "100%",
                minHeight: 52,
                border: "none",
                outline: "none",
                resize: "none",
                background: "transparent",
                fontSize: 15,
                lineHeight: 1.5,
                color: "#1c1c1e",
                fontFamily: "inherit",
                px: 0.5,
                "&::placeholder": { color: "#aaa" }
              }}
            />

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1}>
                <Tooltip title="AI Context & Memory" placement="top" arrow>
                  <Button
                    size="small"
                    startIcon={<BrainSvg fontsize={24} />}
                    sx={{ color: "#666", textTransform: "none", fontSize: 13, fontWeight: 500, minWidth: 0, px: 1.5, borderRadius: "14px", bgcolor: "rgba(0,0,0,0.04)" }}
                  >
                    Context
                  </Button>
                </Tooltip>

                <Tooltip title={mode === "chat" ? "Switch to Edit Mode" : "Switch to Chat Mode"} placement="top" arrow>
                  <Button
                    size="small"
                    onClick={() => setMode(mode === "chat" ? "edit" : "chat")}
                    startIcon={mode === "chat" ? <ChatSvg fontsize={24} /> : <WriteSvg fontsize={24} />}
                    endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{ color: "#666", textTransform: "none", fontSize: 13, fontWeight: 500, minWidth: 0, px: 1.5, borderRadius: "14px", "&:hover": { bgcolor: "rgba(0,0,0,0.04)" }, bgcolor: "rgba(0,0,0,0.02)" }}
                  >
                    {mode === "chat" ? "Chat Mode" : "Edit Mode"}
                  </Button>
                </Tooltip>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}
                  onMouseEnter={() => setModelHovered(true)}
                  onMouseLeave={() => setModelHovered(false)}
                >
                  <Tooltip title={"Auto Model Default"} placement="top" arrow>
                    <AvatarGroup
                      max={4}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 26,
                          height: 26,
                          border: '2px solid #fff',
                          bgcolor: '#f5f5f5',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                        },
                      }}
                    >
                      {AI_MODELS.map((model, idx) => (
                        <Avatar
                          key={model.name}
                          onMouseEnter={() => setActiveModelIndex(idx)}
                          sx={{
                            bgcolor: idx === activeModelIndex ? alpha(model.color, 0.12) : '#f5f5f5',
                            transform: idx === activeModelIndex ? 'scale(1.15)' : 'scale(1)',
                            zIndex: idx === activeModelIndex ? 10 : 1,
                          }}
                        >
                          <model.Icon fontsize={20} />
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Tooltip>
                </Box>

                {mode === "edit" && (
                  <Tooltip title="Circle any part of the note to edit" placement="top" arrow>
                    <Button
                      size="small"
                      onClick={() => {
                        onStartCircleToEdit?.();
                        onClose?.();
                      }}
                      startIcon={<GestureRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ color: "#666", textTransform: "none", fontSize: 13, fontWeight: 500, minWidth: 0, px: 1.5, borderRadius: "14px", "&:hover": { bgcolor: "rgba(0,0,0,0.04)" } }}
                    >
                      Circle
                    </Button>
                  </Tooltip>
                )}
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Voice Input" placement="top" arrow>
                  <IconButton size="small" sx={{ color: "#666", mr: 0.5 }}>
                    <MicRoundedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                {isStreaming ? (
                  <Tooltip title="Stop AI Generation" placement="top" arrow>
                    <Button
                      onClick={handleStop}
                      sx={{
                        bgcolor: "rgba(0,0,0,0.05)",
                        color: "#111",
                        borderRadius: "16px",
                        px: 2,
                        py: 0.6,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.1)" }
                      }}
                    >
                      Stop
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Send Prompt (Enter)" placement="top" arrow>
                    <Button
                      disabled={!canSend}
                      onClick={() => void handleSubmit()}
                      endIcon={<PlayArrowRoundedIcon />}
                      sx={{
                        bgcolor: canSend ? "rgba(0,0,0,0.05)" : "transparent",
                        color: canSend ? "#111" : "#aaa",
                        borderRadius: "16px",
                        px: 2,
                        py: 0.6,
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": { bgcolor: canSend ? "rgba(0,0,0,0.1)" : "transparent" },
                        transition: "all 0.2s ease"
                      }}
                    >
                      Ask
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Box>

          {!isStreaming && mode === "chat" && chatMessages.length === 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: "auto", px: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
              {["Suggest improvements", "Fix grammar and spelling", "Extract action items"].map(label => (
                <Box
                  key={label}
                  onClick={() => setInput(label)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    bgcolor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "14px",
                    px: 1.5,
                    py: 0.8,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "#f1f1f1" }
                  }}
                >
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 13, color: "#888" }} />
                  <Typography sx={{ fontSize: 12.5, color: "#444", fontWeight: 600 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {mode === "edit" && editStatus && (
            <Typography sx={{ mt: 1.5, px: 1, fontSize: 12.5, color: "#666", fontWeight: 500 }}>
              {editStatus}
            </Typography>
          )}
        </Paper>
      </Box>

      <DocbookRedeemModal
        open={showRedeemModal}
        onClose={(success) => {
          setShowRedeemModal(false);
          if (success) {
            setErrorMessage("");
            setEditStatus("");
          }
        }}
        accentColor={accentColor}
      />
    </>
  );
}
