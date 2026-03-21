"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Box, ClickAwayListener, IconButton, Tooltip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { plainTextFromHtml, tooltipSlotProps } from "../shared";

/**
 * Connections sidebar dock — linked notes & backlinks.
 */
function EditorConnectionsDock({
  activeNote,
  activeNoteTint,
  allNotes = [],
  linkedNotes = [],
  backlinkNotes = [],
  onOpenLinkedNote,
  onConnectNote,
  onDisconnectNote,
}) {
  const [connectionsDockOpen, setConnectionsDockOpen] = useState(false);
  const [linkSearchOpen, setLinkSearchOpen] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const linkSearchInputRef = useRef(null);

  const activeNoteLinks = Array.isArray(activeNote?.links) ? activeNote.links : [];
  const availableLinkedSearchResults = allNotes
    .filter((note) => {
      if (!activeNote?.id || note.id === activeNote.id) return false;
      if (activeNoteLinks.includes(note.id)) return false;
      const normalizedQuery = linkSearchQuery.trim().toLowerCase();
      if (!normalizedQuery) return true;
      const title = (note.title || "").toLowerCase();
      const content = plainTextFromHtml(note.content || "").toLowerCase();
      return title.includes(normalizedQuery) || content.includes(normalizedQuery);
    })
    .slice(0, 6);

  useEffect(() => {
    if (!linkSearchOpen) return undefined;
    const timeoutId = window.setTimeout(() => { linkSearchInputRef.current?.focus(); }, 0);
    return () => { window.clearTimeout(timeoutId); };
  }, [linkSearchOpen]);

  useEffect(() => {
    setLinkSearchOpen(false);
    setLinkSearchQuery("");
    setConnectionsDockOpen(false);
  }, [activeNote?.id]);

  useEffect(() => {
    if (!linkSearchOpen) return undefined;
    const handleKeyDown = (event) => { if (event.key === "Escape") setLinkSearchOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  }, [linkSearchOpen]);

  return (
    <ClickAwayListener onClickAway={() => { setLinkSearchOpen(false); setConnectionsDockOpen(false); }}>
      <Box
        onMouseEnter={() => setConnectionsDockOpen(true)}
        onMouseLeave={() => { if (!linkSearchOpen) setConnectionsDockOpen(false); }}
        sx={{
          position: "fixed",
          top: 72,
          right: 0,
          zIndex: 23,
          width: connectionsDockOpen ? { xs: 284, md: 320 } : 44,
          maxWidth: "calc(100% - 12px)",
          borderRadius: "20px 0 0 20px",
          overflow: "hidden",
          border: `1px solid ${alpha(activeNoteTint, 0.2)}`,
          borderRight: 0,
          bgcolor: alpha("#fffdf8", 0.98),
          boxShadow: `0 14px 30px ${alpha(activeNoteTint, 0.12)}`,
          backdropFilter: "blur(10px)",
          transition: "width 220ms ease, box-shadow 180ms ease, background-color 180ms ease",
        }}
      >
        <Box
          onClick={() => setConnectionsDockOpen((prev) => !prev)}
          sx={{
            minHeight: 44,
            px: connectionsDockOpen ? 0.9 : 0.55,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: connectionsDockOpen ? "space-between" : "center",
            gap: 0.75,
            cursor: "pointer",
            background: `linear-gradient(180deg, ${alpha(activeNoteTint, 0.14)} 0%, rgba(255, 251, 245, 0.94) 100%)`,
          }}
        >
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: alpha(activeNoteTint, 0.25), color: "#6d4f36", flexShrink: 0 }}>
              <HubRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
            {connectionsDockOpen && (
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.1 }}>Connections</Typography>
                <Typography sx={{ fontSize: 11.5, color: "#7b6c5c", lineHeight: 1.15 }}>{linkedNotes.length} linked, {backlinkNotes.length} backlinks</Typography>
              </Box>
            )}
          </Stack>
          {connectionsDockOpen && (
            <Tooltip title="Connect note" arrow slotProps={tooltipSlotProps}>
              <IconButton
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); setLinkSearchOpen((prev) => !prev); }}
                size="small"
                sx={{ width: 28, height: 28, color: linkSearchOpen ? "#8b5e3c" : "#9a7653", bgcolor: linkSearchOpen ? alpha("#fff2d8", 0.98) : alpha("#fffdf8", 0.9), border: "1px solid rgba(139,94,60,0.12)", "&:hover": { bgcolor: alpha("#fff4df", 0.98) } }}
              >
                <SearchRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {connectionsDockOpen && (
          <Box sx={{ px: 1, pb: 1, pt: 0.2 }}>
            {linkSearchOpen && (
              <Box sx={{ mb: 0.9, borderRadius: 2.4, overflow: "hidden", border: "1px solid #e2d6c8", bgcolor: "#fffaf4" }}>
                <Box sx={{ px: 1.1, py: 0.85, borderBottom: "1px solid #ebe1d4", display: "flex", alignItems: "center", gap: 0.8 }}>
                  <SearchRoundedIcon sx={{ fontSize: 16, color: "#6a5a49" }} />
                  <Box
                    ref={linkSearchInputRef}
                    component="input"
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    sx={{ flex: 1, minWidth: 0, border: 0, outline: 0, bgcolor: "transparent", fontSize: 13, fontWeight: 600, color: "#352f29", "&::placeholder": { color: "#8a7968", opacity: 1 } }}
                  />
                  <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => { setLinkSearchOpen(false); setLinkSearchQuery(""); }} sx={{ p: 0.25, color: "#8a7968" }}>
                    <CloseRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
                <Stack spacing={0} sx={{ py: 0.35, maxHeight: 220, overflowY: "auto" }}>
                  {availableLinkedSearchResults.length > 0 ? (
                    availableLinkedSearchResults.map((note) => (
                      <Box key={note.id} onMouseDown={(e) => { e.preventDefault(); onConnectNote?.(note.id); setLinkSearchQuery(""); setLinkSearchOpen(false); }} sx={{ px: 1.1, py: 0.9, cursor: "pointer", transition: "background-color 120ms ease", "&:hover": { bgcolor: alpha("#c4956a", 0.12) } }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#352f29" }}>{note.title?.trim() || ""}</Typography>
                        <Typography sx={{ fontSize: 11, color: "#7b6c5c" }}>{(plainTextFromHtml(note.content || "") || "Empty note").slice(0, 82)}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ px: 1.1, py: 1 }}><Typography sx={{ fontSize: 12, color: "#7b6c5c" }}>No notes found to connect.</Typography></Box>
                  )}
                </Stack>
              </Box>
            )}

            <Stack spacing={0.85}>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#7b6c5c", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.45 }}>Connected</Typography>
                {linkedNotes.length > 0 ? (
                  <Stack spacing={0.5}>
                    {linkedNotes.map((note) => (
                      <Stack key={note.id} direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.8, py: 0.55, borderRadius: 999, bgcolor: alpha(note.color || activeNoteTint, 0.16), border: `1px solid ${alpha(note.color || activeNoteTint, 0.18)}` }}>
                        <Typography onClick={() => onOpenLinkedNote?.(note.id)} sx={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "#312821", cursor: "pointer" }} noWrap>{note.title?.trim() || ""}</Typography>
                        <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onDisconnectNote?.(note.id)} sx={{ p: 0.2, color: "#7b6c5c" }}><CloseRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: 11.5, color: "#8a7968" }}>No linked notes yet.</Typography>
                )}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#7b6c5c", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.45 }}>Linked Here</Typography>
                {backlinkNotes.length > 0 ? (
                  <Stack spacing={0.5}>
                    {backlinkNotes.map((note) => (
                      <Stack key={note.id} direction="row" spacing={0.45} alignItems="center" onClick={() => onOpenLinkedNote?.(note.id)} sx={{ px: 0.8, py: 0.55, borderRadius: 999, bgcolor: alpha("#fff8ef", 0.95), border: "1px solid rgba(139,94,60,0.14)", cursor: "pointer" }}>
                        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "#312821" }} noWrap>{note.title?.trim() || "Untitled"}</Typography>
                        <NorthEastRoundedIcon sx={{ fontSize: 14, color: "#8b5e3c" }} />
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: 11.5, color: "#8a7968" }}>No backlinks yet.</Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
}

export default memo(EditorConnectionsDock, (prevProps, nextProps) => (
  prevProps.activeNote?.id === nextProps.activeNote?.id
  && prevProps.activeNote?.links === nextProps.activeNote?.links
  && prevProps.activeNoteTint === nextProps.activeNoteTint
  && prevProps.allNotes === nextProps.allNotes
  && prevProps.linkedNotes === nextProps.linkedNotes
  && prevProps.backlinkNotes === nextProps.backlinkNotes
  && prevProps.onOpenLinkedNote === nextProps.onOpenLinkedNote
  && prevProps.onConnectNote === nextProps.onConnectNote
  && prevProps.onDisconnectNote === nextProps.onDisconnectNote
));
