"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Box, ButtonBase, IconButton, Tooltip, Stack, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ViewCarouselRoundedIcon from "@mui/icons-material/ViewCarouselRounded";
import TextDecreaseRoundedIcon from "@mui/icons-material/TextDecreaseRounded";
import TextIncreaseRoundedIcon from "@mui/icons-material/TextIncreaseRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import SpellcheckRoundedIcon from "@mui/icons-material/SpellcheckRounded";
import KeyboardOptionKeyRoundedIcon from "@mui/icons-material/KeyboardOptionKeyRounded";
import { noteColorOptions, tooltipSlotProps } from "../shared";
import { IOSSwitch } from "./constants";

/**
 * Top toolbar: title, AI badge, auto-save, sync, color dots, font size controls, sticky note controls.
 */
export default function EditorToolbar({
  activeNote,
  activeNoteTint,
  autoSave,
  onAutoSaveChange,
  syncBadgeState,
  collapseSidebar,
  onTitleChange,
  onNoteColorChange,
  onNoteFontSizeDecrease,
  onFontSizeDecrease,
  onNoteFontSizeIncrease,
  onFontSizeIncrease,
  onAddStickyNote,
  stickyNotesVisible,
  onToggleStickyNotes,
  shareInfo,
  onOpenShare,
  aiWorking = false,
  getDateSuggestions,
  grammarEnabled = true,
  onToggleGrammar,
}) {
  const titleInputRef = useRef(null);
  const [titleSlashMenu, setTitleSlashMenu] = useState({ visible: false, query: "", selectedIndex: 0 });
  const [nowMs, setNowMs] = useState(() => Date.now());

  /* ── Local title state for fluid typing ── */
  const [localTitle, setLocalTitle] = useState(activeNote?.title ?? "");
  const debounceRef = useRef(null);
  const noteIdRef = useRef(activeNote?.id);

  // Sync local title when switching notes (different note id) or when title changes externally
  useEffect(() => {
    if (activeNote?.id !== noteIdRef.current) {
      // Note switched — immediately sync
      noteIdRef.current = activeNote?.id;
      setLocalTitle(activeNote?.title ?? "");
    } else if (!titleInputRef.current || document.activeElement !== titleInputRef.current) {
      // Not focused — accept external updates (e.g. slash command from AI)
      setLocalTitle(activeNote?.title ?? "");
    }
  }, [activeNote?.id, activeNote?.title]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const handleTopFontDecrease = onNoteFontSizeDecrease || onFontSizeDecrease;
  const handleTopFontIncrease = onNoteFontSizeIncrease || onFontSizeIncrease;

  const showSyncBadge = Boolean(syncBadgeState?.enabled && syncBadgeState?.hasPin && syncBadgeState?.interval > 0);
  const lastSyncTime = syncBadgeState?.lastSyncAt ? new Date(syncBadgeState.lastSyncAt).getTime() : 0;
  const lastLocalChangeTime = syncBadgeState?.lastLocalChangeAt ? new Date(syncBadgeState.lastLocalChangeAt).getTime() : 0;
  const syncIsCurrent = showSyncBadge && lastSyncTime > 0 && lastSyncTime >= lastLocalChangeTime;
  const shareIsActive = Boolean(shareInfo?.url && new Date(shareInfo.expiresAt || "").getTime() > nowMs);

  const getRelativeSyncLabel = () => {
    if (!showSyncBadge) return "";
    if (!lastSyncTime) return "Not synced";
    if (!syncIsCurrent) return "Not synced";
    const diffMs = Math.max(0, nowMs - lastSyncTime);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Synced just now";
    if (diffMins < 60) return `Synced ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Synced ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Synced ${diffDays}d ago`;
  };

  /* ── Title slash menu ── */
  const titleActiveSuggestions = (() => {
    if (!titleSlashMenu.visible) return [];
    const cleanQuery = titleSlashMenu.query.toLowerCase().replace("/", "");
    if ("date".includes(cleanQuery.split(/\s/)[0] || "")) {
      return getDateSuggestions(cleanQuery.replace(/^date\s*/, "").trim());
    }
    return [];
  })();

  const closeTitleSlashMenu = useCallback(() => {
    setTitleSlashMenu((prev) => (prev.visible ? { visible: false, query: "", selectedIndex: 0 } : prev));
  }, []);

  const flushTitleChange = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (onTitleChange) onTitleChange({ target: { value: localTitle } });
  }, [localTitle, onTitleChange]);

  const handleTitleChange = useCallback(
    (event) => {
      const value = event.target.value;
      // Update local state immediately for fluid typing
      setLocalTitle(value);

      // Debounce the expensive parent update
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (onTitleChange) onTitleChange({ target: { value } });
      }, 300);

      // Slash menu logic (instant, no debounce needed)
      const match = value.match(/(\/[a-z][a-z0-9 ]*)$/i);
      if (match) {
        const token = match[1].toLowerCase();
        const command = token.replace("/", "").split(/\s/)[0];
        if ("date".startsWith(command) || command === "date") {
          setTitleSlashMenu({ visible: true, query: token, selectedIndex: 0 });
          return;
        }
      }
      closeTitleSlashMenu();
    },
    [onTitleChange, closeTitleSlashMenu]
  );

  const applyTitleSlashSuggestion = useCallback(
    (item) => {
      const currentTitle = localTitle;
      const match = currentTitle.match(/(\/[a-z][a-z0-9 ]*)$/i);
      if (!match) return;
      const newTitle = currentTitle.slice(0, match.index) + item.value;
      setLocalTitle(newTitle);
      if (onTitleChange) onTitleChange({ target: { value: newTitle } });
      closeTitleSlashMenu();
      requestAnimationFrame(() => {
        const input = titleInputRef.current;
        if (input) {
          input.focus();
          input.setSelectionRange(newTitle.length, newTitle.length);
        }
      });
    },
    [localTitle, onTitleChange, closeTitleSlashMenu]
  );

  const handleTitleKeyDown = useCallback(
    (event) => {
      if (!titleSlashMenu.visible || titleActiveSuggestions.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setTitleSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % titleActiveSuggestions.length }));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setTitleSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + titleActiveSuggestions.length) % titleActiveSuggestions.length }));
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeTitleSlashMenu();
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        applyTitleSlashSuggestion(titleActiveSuggestions[titleSlashMenu.selectedIndex] || titleActiveSuggestions[0]);
      }
    },
    [titleSlashMenu.visible, titleSlashMenu.selectedIndex, titleActiveSuggestions, closeTitleSlashMenu, applyTitleSlashSuggestion]
  );

  return (
    <>
      {/* ── Title bar (top-left) ── */}
      <Tooltip arrow placement="bottom-start" slotProps={tooltipSlotProps} title={activeNote?.title?.trim() || "Untitled"}>
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 22,
            maxWidth: { xs: "calc(100% - 140px)", md: 460 },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            sx={{
              bgcolor: alpha("#fffdf8", 0.78),
              border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
              "&:hover": { bgcolor: alpha("#fffdf8", 0.78) },
            }}
            onClick={collapseSidebar}
          >
            <ViewCarouselRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
          <Box
            sx={{
              position: "relative",
              borderRadius: 999,
              bgcolor: alpha("#fffdf8", 0.78),
              border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
              boxShadow: `0 10px 24px ${alpha(activeNoteTint, 0.12)}`,
              backdropFilter: "blur(8px)",
              display: "flex",
              px: 1.1,
              py: 0.65,
              zIndex: 1,
            }}
          >
            <Box
              ref={titleInputRef}
              component="input"
              value={localTitle}
              placeholder="Untitled"
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={() => {
                flushTitleChange();
                setTimeout(closeTitleSlashMenu, 150);
              }}
              sx={{
                width: "100%",
                border: 0,
                outline: 0,
                bgcolor: "transparent",
                fontFamily: "inherit",
                fontSize: 16,
                lineHeight: 1.25,
                fontWeight: 800,
                color: "#2e261f",
                textOverflow: "ellipsis",
                "&::placeholder": { color: alpha("#2e261f", 0.4), fontWeight: 600 },
              }}
            />

            {titleSlashMenu.visible && titleActiveSuggestions.length > 0 && (
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  minWidth: 260,
                  maxWidth: 320,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid #ddd0c0",
                  bgcolor: "#fdf8f1",
                  boxShadow: "0 16px 34px rgba(58, 46, 34, 0.18)",
                  zIndex: 1600,
                }}
              >
                <Box sx={{
                  px: 1.4, py: 1, borderBottom: "1px solid #ebe1d4", background: "linear-gradient(180deg, #fbf3e8 0%, #f7ecde 100%)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase" }}>Commands</Typography>
                  <KeyboardOptionKeyRoundedIcon sx={{ color: "#6a5a49", fontSize: 16 }} />
                </Box>
                <Stack spacing={0} sx={{ py: 0.5 }}>
                  {titleActiveSuggestions.map((item, index) => (
                    <Box
                      key={item.id}
                      onMouseDown={(e) => { e.preventDefault(); applyTitleSlashSuggestion(item); }}
                      sx={{
                        px: 1.4, py: 1, cursor: "pointer",
                        bgcolor: index === titleSlashMenu.selectedIndex ? alpha("#c4956a", 0.12) : "transparent",
                        transition: "background-color 120ms ease",
                        "&:hover": { bgcolor: alpha("#c4956a", 0.12) },
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#352f29" }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#7b6c5c" }}>{item.description}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>

          {aiWorking && (
            <Box
              sx={{
                px: 1, py: 0.6, borderRadius: 999,
                bgcolor: alpha(activeNoteTint, 0.14),
                border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
                boxShadow: `0 10px 22px ${alpha(activeNoteTint, 0.16)}`,
                display: "flex", alignItems: "center", gap: 0.65, zIndex: 1,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: activeNoteTint, animation: "docbookAiPulse 1.8s ease-out infinite" }} />
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#2e261f", letterSpacing: "0.04em", textTransform: "uppercase" }}>AI Working</Typography>
            </Box>
          )}
        </Box>
      </Tooltip>

      {/* ── Actions bar (top-right) ── */}
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 22,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          maxWidth: { xs: "calc(100% - 160px)", md: "calc(100% - 520px)" },
          rowGap: 0.75,
        }}
      >
        <Tooltip title={shareIsActive ? "Manage shared link" : "Share this note"} arrow slotProps={tooltipSlotProps}>
          <ButtonBase
            onClick={() => {
              flushTitleChange();
              onOpenShare?.();
            }}
            sx={{
              borderRadius: 999,
              bgcolor: shareIsActive ? alpha("#eef4ff", 0.94) : alpha("#fffdf8", 0.78),
              border: shareIsActive ? "1px solid rgba(83, 127, 196, 0.22)" : `1px solid ${alpha(activeNoteTint, 0.28)}`,
              boxShadow: shareIsActive ? "0 6px 18px rgba(83, 127, 196, 0.10)" : `0 6px 18px ${alpha(activeNoteTint, 0.12)}`,
              backdropFilter: "blur(8px)",
              px: 0.95,
              py: 0.42,
              gap: 0.55,
              display: "flex",
              alignItems: "center",
              "&:hover": {
                bgcolor: shareIsActive ? alpha("#e5efff", 0.98) : alpha("#fff8ef", 0.96),
              },
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: shareIsActive ? alpha("#5b89d7", 0.14) : alpha(activeNoteTint, 0.18),
                color: shareIsActive ? "#476fb2" : "#7a5240",
                flexShrink: 0,
                marginLeft: -0.5
              }}
            >
              <ShareRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: shareIsActive ? "#476fb2" : "#6c594b",
              }}
            >
              {shareIsActive ? "Shared link" : "Share note"}
            </Typography>
          </ButtonBase>
        </Tooltip>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1, py: 0.55, borderRadius: 999, bgcolor: alpha("#fffdf8", 0.78), border: `1px solid ${alpha(activeNoteTint, 0.28)}`, boxShadow: `0 6px 18px ${alpha(activeNoteTint, 0.12)}`, backdropFilter: "blur(8px)" }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#7a5240", ml: 0.4 }}>Auto Save</Typography>
          <IOSSwitch checked={autoSave} onChange={(e) => onAutoSaveChange?.(e.target.checked)} />
        </Stack>

        {showSyncBadge && (
          <Tooltip title={syncBadgeState?.lastSyncAt ? `Last synced: ${new Date(syncBadgeState.lastSyncAt).toLocaleString()}` : "Auto-sync is enabled"} arrow slotProps={tooltipSlotProps}>
            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ px: 1, py: 0.55, mr: 0.1, borderRadius: 999, bgcolor: syncIsCurrent ? alpha("#eef9f1", 0.94) : alpha("#fff4e7", 0.96), border: syncIsCurrent ? "1px solid rgba(104, 181, 124, 0.28)" : "1px solid rgba(217, 145, 73, 0.22)", boxShadow: syncIsCurrent ? "0 6px 18px rgba(76, 175, 80, 0.10)" : "0 6px 18px rgba(217, 145, 73, 0.10)", backdropFilter: "blur(8px)" }}>
              {syncIsCurrent ? <CloudDoneRoundedIcon sx={{ fontSize: 17, color: "#4b8d5a" }} /> : <CloudOffRoundedIcon sx={{ fontSize: 17, color: "#c9823c" }} />}
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1, color: syncIsCurrent ? "#2f6d43" : "#9a5a24", whiteSpace: "nowrap" }}>{getRelativeSyncLabel()}</Typography>
            </Stack>
          </Tooltip>
        )}

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.7, py: 0.5, borderRadius: 999, bgcolor: alpha("#fffdf8", 0.78), border: `1px solid ${alpha(activeNoteTint, 0.28)}`, boxShadow: `0 6px 18px ${alpha(activeNoteTint, 0.12)}`, backdropFilter: "blur(8px)" }}>
          {noteColorOptions.map((option) => {
            const selected = option.value === activeNote?.color;
            return (
              <Box
                key={option.value}
                component="button"
                type="button"
                aria-label={`Set note color to ${option.label}`}
                onClick={() => onNoteColorChange?.(option.value)}
                sx={{
                  width: 16, height: 16, borderRadius: "50%", border: 0, bgcolor: option.value, cursor: "pointer",
                  boxShadow: selected ? `0 0 0 2px ${alpha("#fffdf8", 0.96)}, 0 0 0 4px ${alpha(option.value, 0.44)}` : `0 0 0 1px ${alpha("#2e261f", 0.08)}`,
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                  "&:hover": { transform: "translateY(-1px) scale(1.05)" },
                }}
              />
            );
          })}
        </Stack>

        <Tooltip title="Decrease Note Size" arrow slotProps={tooltipSlotProps}>
          <IconButton onMouseDown={(e) => e.preventDefault()} onClick={handleTopFontDecrease} size="small" sx={{ color: "#8b5e3c", bgcolor: alpha("#fffdf8", 0.76), border: "1px solid rgba(139,94,60,0.12)", boxShadow: "0 6px 18px rgba(93,62,40,0.08)", "&:hover": { bgcolor: alpha("#8b5e3c", 0.1) } }}>
            <TextDecreaseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Increase Note Size" arrow slotProps={tooltipSlotProps}>
          <IconButton onMouseDown={(e) => e.preventDefault()} onClick={handleTopFontIncrease} size="small" sx={{ color: "#8b5e3c", bgcolor: alpha("#fffdf8", 0.76), border: "1px solid rgba(139,94,60,0.12)", boxShadow: "0 6px 18px rgba(93,62,40,0.08)", "&:hover": { bgcolor: alpha("#8b5e3c", 0.1) } }}>
            <TextIncreaseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={grammarEnabled ? "Disable Grammar Check" : "Enable Grammar Check"} arrow slotProps={tooltipSlotProps}>
          <IconButton onClick={onToggleGrammar} size="small" sx={{ color: grammarEnabled ? "#2e7d32" : "#9a7653", bgcolor: grammarEnabled ? alpha("#e8f5e9", 0.92) : alpha("#fff8ef", 0.92), border: grammarEnabled ? "1px solid rgba(46,125,50,0.16)" : "1px solid rgba(139,94,60,0.12)", boxShadow: grammarEnabled ? "0 6px 18px rgba(46,125,50,0.08)" : "0 6px 18px rgba(93,62,40,0.08)", "&:hover": { bgcolor: grammarEnabled ? alpha("#66bb6a", 0.18) : alpha("#8b5e3c", 0.1) } }}>
            <SpellcheckRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={stickyNotesVisible ? "Hide Sticky Notes" : "Show Sticky Notes"} arrow slotProps={tooltipSlotProps}>
          <IconButton onClick={onToggleStickyNotes} size="small" sx={{ color: stickyNotesVisible ? "#d97706" : "#9a7653", bgcolor: stickyNotesVisible ? alpha("#fff2d8", 0.92) : alpha("#fff8ef", 0.92), border: "1px solid rgba(217,119,6,0.12)", boxShadow: "0 6px 18px rgba(217,119,6,0.08)", "&:hover": { bgcolor: alpha("#f59e0b", 0.2) } }}>
            <WorkspacesRoundedIcon sx={{ fontSize: 20, transition: "transform 200ms ease", transform: stickyNotesVisible ? "rotate(0deg)" : "rotate(180deg)" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Sticky Note" arrow slotProps={tooltipSlotProps}>
          <IconButton onClick={onAddStickyNote} size="small" sx={{ color: "#d97706", bgcolor: alpha("#fff2d8", 0.92), border: "1px solid rgba(217,119,6,0.12)", boxShadow: "0 6px 18px rgba(217,119,6,0.08)", "&:hover": { bgcolor: alpha("#f59e0b", 0.2) } }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
}
