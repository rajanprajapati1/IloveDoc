import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import {
  Badge,
  Box,
  ButtonBase,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { alpha } from "@mui/material/styles";
import { HeartIcon, NotesSvg } from "@/assets/icon";
import { useState, useEffect } from "react";
import { formatEditedAt, plainTextFromHtml, timeAgoLabel, tooltipSlotProps } from "./shared";

function SectionLabel({ children, isDrawer, isCollapsed }) {
  if (isCollapsed) return null;
  return (
    <Typography variant="overline" sx={{ color: "#8f7968", display: isDrawer ? "block" : { xs: "none", lg: "block" }, mb: 0.8, letterSpacing: 1, fontWeight: 800 }}>
      {children}
    </Typography>
  );
}

function SidebarLink({ icon, label, active = false, onClick, badge, isDrawer, isCollapsed, accentColor = "#F7E36D" }) {
  const content = (
    <ButtonBase
      onClick={onClick}
      sx={{
        position: "relative",
        overflow: "visible",
        width: isCollapsed ? 36 : "100%",
        height: isCollapsed ? 36 : "auto",
        justifyContent: isCollapsed ? "center" : (isDrawer ? "flex-start" : { xs: "center", md: "flex-start" }),
        gap: isCollapsed ? 0 : 1.25,
        borderRadius: isCollapsed ? "50%" : 50,
        px: isCollapsed ? 0 : (isDrawer ? 2 : { xs: 0, md: 1.5 }),
        py: 0.8,
        mx: isCollapsed ? "auto" : 0,
        color: active ? "#2a211b" : "#675d53",
        bgcolor: active ? alpha(accentColor, 0.28) : "transparent",
        boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,0.55), 0 6px 14px ${alpha(accentColor, 0.18)}` : "none",
        transition: "background-color 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 180ms ease",
        "&:hover": { bgcolor: active ? alpha(accentColor, 0.34) : alpha(accentColor, 0.12) },
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center", color: active ? "#1d1a17" : "#6a645d", minWidth: 20 }}>{icon}</Box>
      {!isCollapsed && (
        <Typography sx={{
          fontSize: 13.5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis", fontWeight: active ? 800 : 600, lineHeight: 1.2, textAlign: "left", flex: 1, display: isDrawer ? "block" : { xs: "none", md: "block" }
        }}>{label}</Typography>
      )}
      {badge > 0 && (
        <Badge
          badgeContent={badge}
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: "#c4956a",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              px: 0.35,
              borderRadius: 25,
              position: isCollapsed ? "absolute" : "relative",
              top: isCollapsed ? -14 : 0,
              right: isCollapsed ? 0 : 0,
              boxShadow: isCollapsed ? "0 0 0 2px rgba(255, 250, 244, 0.96)" : "none",
            },
          }}
        />
      )}
    </ButtonBase>
  );

  if (isCollapsed) {
    return (
      <Tooltip title={label} placement="right" arrow slotProps={tooltipSlotProps}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

function NoteTitleLink({
  note,
  active,
  onOpen,
  onDelete,
  disableDelete,
  isDrawer,
  isStickyDropTarget = false,
  isStickyDragging = false,
}) {
  const title = note.title?.trim() || "Untitled";
  const preview = plainTextFromHtml(note.content) || "Empty note";
  const noteColor = note.color || "#F7E36D";

  const linkContent = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      <Tooltip
        arrow
        placement="right"
        slotProps={tooltipSlotProps}
        disableFocusListener={isStickyDragging}
        disableHoverListener={isStickyDragging}
        enterDelay={350}
        title={
          <Box sx={{ maxWidth: 260 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.3, mb: 0.5 }}>{title}</Typography>
            <Typography sx={{ fontSize: 12.5, lineHeight: 1.35 }}>{preview.slice(0, 140)}</Typography>
            <Typography sx={{ fontSize: 10.5, mt: 0.6, opacity: 0.8 }}>{formatEditedAt(note.updatedAt)}</Typography>
          </Box>
        }
      >
        <ButtonBase
          onClick={onOpen}
          sx={{
            flex: 1,
            minWidth: 0,
            alignItems: "center",
            justifyContent: isDrawer ? "flex-start" : { xs: "center", lg: "flex-start" },
            gap: 0.9,
            borderRadius: 50,
            px: isDrawer ? 2 : { xs: 0, lg: 1.5 },
            py: 1,
            color: active ? "#1d1a17" : "#605951",
            bgcolor: isStickyDropTarget ? alpha(noteColor, 0.28) : active ? alpha(noteColor, 0.2) : "transparent",
            boxShadow: isStickyDropTarget ? `0 0 0 2px ${alpha(noteColor, 0.55)}` : "none",
            transition: "background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
            "&:hover": { bgcolor: isStickyDropTarget ? alpha(noteColor, 0.32) : active ? alpha(noteColor, 0.24) : alpha("#8f7d66", 0.08) },
          }}
        >
          <Box sx={{ display: "grid", placeItems: "center", color: active ? "#1d1a17" : "#6a645d", minWidth: 20 }}>
            <TextFieldsRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
          <Box
            sx={{
              width: 10,
              height: 10,
              minWidth: 10,
              minHeight: 10,
              flexShrink: 0,
              borderRadius: "50%",
              bgcolor: noteColor,
              boxShadow: `0 0 0 2px ${alpha("#fffdf8", 0.9)}`,
              display: isDrawer ? "block" : { xs: "none", lg: "block" },
            }}
          />
          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: 13.5,
              fontWeight: active ? 800 : 600,
              lineHeight: 1.2,
              textAlign: "left",
              display: isDrawer ? "block" : { xs: "none", lg: "block" },
            }}
          >
            {title}
          </Typography>
        </ButtonBase>
      </Tooltip>
      <Tooltip arrow placement="right" slotProps={tooltipSlotProps} title={disableDelete ? "At least one note is required" : "Delete note"}>
        <Box component="span" sx={{ display: isDrawer ? "block" : { xs: "none", lg: "block" } }}>
          <IconButton size="small" disabled={disableDelete} onClick={onDelete} sx={{ width: 24, height: 24, color: "#82796f", "&:hover": { bgcolor: alpha("#8f7d66", 0.12), color: "#5f554b" } }}>
            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );

  return (
    <Box
      data-sidebar-note-id={note.id}
      sx={{
        transition: "background-color 200ms, transform 180ms ease",
        borderRadius: 8,
        position: "relative",
        "&::after": isStickyDragging
          ? {
            content: '""',
            position: "absolute",
            inset: -2,
            borderRadius: 12,
            border: isStickyDropTarget ? `1px dashed ${alpha(noteColor, 0.9)}` : `1px dashed ${alpha(noteColor, 0.35)}`,
            opacity: 1,
            pointerEvents: "none",
          }
          : undefined,
      }}
    >
      {linkContent}
    </Box>
  );
}

function DeletedNoteItem({ note, onRestore, onPermanentlyDelete, isDrawer }) {
  const title = note.title?.trim() || "Untitled";
  const deletedLabel = note.deletedAt ? timeAgoLabel(note.deletedAt) : "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: isDrawer ? 2 : { xs: 0, lg: 1.5 },
        py: 0.65,
        borderRadius: 50,
        bgcolor: alpha("#e8d5b8", 0.25),
        "&:hover": { bgcolor: alpha("#e8d5b8", 0.45) },
        transition: "background-color 150ms ease",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: isDrawer ? "block" : { xs: "none", lg: "block" } }}>
        <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: "#4a3f36", lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ fontSize: 10, color: "#9a8d7f", lineHeight: 1.3 }}>Deleted {deletedLabel}</Typography>
      </Box>
      <Stack direction={isDrawer ? "row" : { xs: "column", lg: "row" }} spacing={0.5}>
        <Tooltip title="Restore" arrow slotProps={tooltipSlotProps}>
          <IconButton size="small" onClick={() => onRestore(note.id)} sx={{ width: 22, height: 22, color: "#7a6a56", "&:hover": { bgcolor: alpha("#8f7d66", 0.15), color: "#4a3f36" } }}>
            <RestoreRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete forever" arrow slotProps={tooltipSlotProps}>
          <IconButton size="small" onClick={() => onPermanentlyDelete(note.id)} sx={{ width: 22, height: 22, color: "#a08070", "&:hover": { bgcolor: alpha("#c0412b", 0.12), color: "#c0412b" } }}>
            <DeleteForeverRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

export default function DocbookSidebar({
  notes,
  deletedNotes = [],
  activeNoteId,
  sidebarTint = "#F7E36D",
  showDeleted,
  stickyDragState,
  onToggleDeleted,
  onCreateNote,
  onOpenNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDelete,
  onOpenSettings,
  onOpenFeedback,
  onOpenPricing,
  onImportNotes,
  isDrawer = false,
  onExpand,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notesAnchorEl, setNotesAnchorEl] = useState(null);
  const [deletedAnchorEl, setDeletedAnchorEl] = useState(null);

  const handleNotesClick = (event) => {
    if (isCollapsed) setNotesAnchorEl(event.currentTarget);
  };

  const handleDeletedClick = (event) => {
    if (isCollapsed) {
      setDeletedAnchorEl(event.currentTarget);
    } else {
      onToggleDeleted();
    }
  };

  /* PWA Install Logic */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("DocBook is already installed or your browser doesn't support installation.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        p: isCollapsed ? "10px 8px" : "10px",
        bgcolor: 'transparent',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Box sx={{
        flex: 1,
        order: { xs: 2, md: 1 },
        position: "relative",
        borderRight: { md: "1px solid rgba(234, 217, 203, 0.8)" },
        borderTop: { xs: "1px solid #e6ddd3", md: 0 },
        bgcolor: "#fbf5ed",
        background: `
          radial-gradient(circle at 18% 14%, ${alpha(sidebarTint, 0.22)} 0%, ${alpha(sidebarTint, 0)} 24%),
          radial-gradient(circle at 84% 10%, rgba(249, 224, 159, 0.22) 0%, rgba(249, 224, 159, 0) 18%),
          radial-gradient(circle at 42% 82%, rgba(178, 236, 201, 0.14) 0%, rgba(178, 236, 201, 0) 24%),
          linear-gradient(180deg, rgba(255, 252, 248, 0.98) 0%, rgba(249, 239, 228, 0.97) 100%)
        `,
        backdropFilter: "blur(10px)",
        p: isCollapsed ? "4px 6px" : "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: isCollapsed ? "center" : "stretch",
        gap: isCollapsed ? 0.9 : 1.15,
        minHeight: 0,
        width: isCollapsed ? 44 : "100%",
        maxWidth: isCollapsed ? 44 : "none",
        mx: "auto",
        boxShadow: { md: `12px 0 32px ${alpha(sidebarTint, 0.16)}, inset -1px 0 0 rgba(255,255,255,0.42)` },
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, background 180ms ease",
        height: '100%',
        borderRadius: isCollapsed ? "24px" : "20px",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: isCollapsed ? "24px" : "20px",
          border: `1px solid ${alpha(sidebarTint, 0.18)}`,
          pointerEvents: "none",
        }
      }}>
        {/* <Paper
          elevation={0}
          sx={{
            position: "relative",
            border: "1px solid rgba(234, 221, 208, 0.95)",
            borderRadius: 3.5,
            bgcolor: "rgba(255, 252, 248, 0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 22px rgba(140, 96, 69, 0.08)",
            px: isCollapsed ? 0.95 : 1.25,
            py: 1.05,
            minHeight: 44,
            overflow: "hidden",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="flex-start">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ display: "flex", flex: 1, minWidth: 0, justifyContent: isCollapsed ? "center" : "flex-start", pr: 3.75 }}>
              <Box
                component="img"
                src="/favicon.png"
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  objectFit: "contain",
                }}
              />
              {!isCollapsed && <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#3a2d24" }}>DocBook</Typography>}
            </Stack>
          </Stack>
        </Paper> */}

        <Stack spacing={0.35} sx={{ width: "100%", alignItems: isCollapsed ? "center" : "stretch", flexShrink: 0 }}>
          <SidebarLink
            label="Home"
            icon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
            active={!showDeleted}
            onClick={() => { if (showDeleted) onToggleDeleted(); }}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="Recently Deleted"
            icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
            active={showDeleted}
            onClick={handleDeletedClick}
            badge={deletedNotes.length}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          {isCollapsed && (
            <SidebarLink
              label="All Notes"
              icon={<ListAltRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={handleNotesClick}
              isCollapsed={isCollapsed}
              accentColor={sidebarTint}
            />
          )}
        </Stack>

        {showDeleted ? (
          <Box
            sx={{
              minHeight: 0,
              display: isCollapsed ? "none" : "flex",
              flexDirection: "column",
              flex: "1 1 0",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <SectionLabel isDrawer={isDrawer} isCollapsed={isCollapsed}>RECENTLY DELETED</SectionLabel>
            <Typography sx={{ fontSize: 11, color: "#9a8d7f", mb: 1, lineHeight: 1.4, display: isDrawer ? "block" : { xs: "none", lg: "block" }, flexShrink: 0 }}>
              Notes are kept for 7 days before automatic removal.
            </Typography>
            {deletedNotes.length === 0 ? (
              <Box sx={{ display: isDrawer ? "flex" : { xs: "none", lg: "flex" }, alignItems: "center", justifyContent: "center", flex: 1, minHeight: 0, opacity: 0.5 }}>
                <Typography sx={{ fontSize: 12.5, color: "#9a8d7f", textAlign: "center" }}>No recently deleted notes</Typography>
              </Box>
            ) : (
              <Stack
                spacing={0.5}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.5,
                  pb: 0.5,
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": { bgcolor: alpha("#8f7d66", 0.2), borderRadius: 2 },
                }}
              >
                {deletedNotes.map((note) => (
                  <DeletedNoteItem
                    key={note.id}
                    note={note}
                    onRestore={onRestoreNote}
                    onPermanentlyDelete={onPermanentlyDelete}
                    isDrawer={isDrawer}
                  />
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 0,
              display: isCollapsed ? "none" : "flex",
              flexDirection: "column",
              flex: "1 1 0",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent={isDrawer ? "space-between" : { xs: "center", lg: "space-between" }} sx={{ flexShrink: 0 }}>
              <SectionLabel isDrawer={isDrawer} isCollapsed={isCollapsed}>NOTES</SectionLabel>
              {!isCollapsed && (
                <Tooltip title="Create new note" arrow slotProps={tooltipSlotProps}>
                  <IconButton onClick={onCreateNote} size="small" sx={{ bgcolor: "#eee7dd", border: "1px solid #ded4c8", "&:hover": { bgcolor: "#e4dbce" } }}>
                    <AddRoundedIcon sx={{ fontSize: 16, color: "#352f29" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Stack
              spacing={0}
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                mt: 1,
                pr: 0.5,
                pb: 0.5,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: alpha("#8f7d66", 0.2), borderRadius: 2 },
              }}
            >
              {notes.map((note) => (
                <NoteTitleLink
                  key={note.id}
                  note={note}
                  active={note.id === activeNoteId}
                  isStickyDragging={Boolean(stickyDragState?.stickyId)}
                  isStickyDropTarget={stickyDragState?.targetNoteId === note.id}
                  disableDelete={notes.length <= 1}
                  onOpen={() => onOpenNote(note.id)}
                  onDelete={(event) => {
                    event.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  isDrawer={isDrawer}
                />
              ))}
            </Stack>
          </Box>
        )}

        {isCollapsed && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="New Note" placement="right" arrow slotProps={tooltipSlotProps}>
              <IconButton onClick={onCreateNote} size="small" sx={{ bgcolor: alpha("#c4956a", 0.1), border: "1px solid", borderColor: alpha("#c4956a", 0.2), color: "#c4956a", "&:hover": { bgcolor: alpha("#c4956a", 0.2) } }}>
                <AddRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Popover Menus for Collapsed State */}
        <Menu
          anchorEl={notesAnchorEl}
          open={Boolean(notesAnchorEl)}
          onClose={() => setNotesAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          slotProps={{
            paper: {
              sx: {
                ml: 1.5,
                minWidth: 240,
                maxWidth: 320,
                maxHeight: "70vh",
                bgcolor: "rgba(252, 250, 248, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid #e7dfd5",
                borderRadius: 4,
                boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                p: 1,
              }
            }
          }}
        >
          <Typography variant="overline" sx={{ px: 1.5, py: 0.5, color: "#a09689", fontWeight: 800, letterSpacing: 1, display: "block" }}>ALL NOTES</Typography>
          <Stack spacing={0.5} sx={{ mt: 1, maxHeight: "60vh", overflowY: "auto" }}>
            {notes.map((note) => (
              <MenuItem key={note.id} onClick={() => { onOpenNote(note.id); setNotesAnchorEl(null); }} sx={{ borderRadius: 2, py: 1.2, px: 1.5, bgcolor: note.id === activeNoteId ? alpha("#c4956a", 0.1) : "transparent", "&:hover": { bgcolor: alpha("#c4956a", 0.05) } }}>
                <TextFieldsRoundedIcon sx={{ fontSize: 16, mr: 1.5, color: note.id === activeNoteId ? "#c4956a" : "#a09689" }} />
                <Typography noWrap sx={{ fontSize: 13.5, fontWeight: note.id === activeNoteId ? 800 : 500, color: "#4a3f36" }}>
                  {note.title || "Untitled"}
                </Typography>
              </MenuItem>
            ))}
          </Stack>
        </Menu>

        <Menu
          anchorEl={deletedAnchorEl}
          open={Boolean(deletedAnchorEl)}
          onClose={() => setDeletedAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          slotProps={{
            paper: {
              sx: {
                ml: 1.5,
                minWidth: 280,
                maxWidth: 340,
                maxHeight: "70vh",
                bgcolor: "rgba(252, 250, 248, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid #e7dfd5",
                borderRadius: 4,
                boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                p: 1,
              }
            }
          }}
        >
          <Typography variant="overline" sx={{ px: 1.5, py: 0.5, color: "#a09689", fontWeight: 800, letterSpacing: 1, display: "block" }}>RECENTLY DELETED</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {deletedNotes.length === 0 ? (
              <Typography sx={{ px: 1, py: 2, fontSize: 12, color: "#9a8d7f", textAlign: "center" }}>No deleted notes</Typography>
            ) : (
              deletedNotes.map((note) => (
                <Box key={note.id} sx={{ px: 1, py: 0.5 }}>
                  <DeletedNoteItem
                    note={note}
                    onRestore={(id) => { onRestoreNote(id); setDeletedAnchorEl(null); }}
                    onPermanentlyDelete={(id) => { onPermanentlyDelete(id); if (deletedNotes.length === 1) setDeletedAnchorEl(null); }}
                    isDrawer={true}
                  />
                </Box>
              ))
            )}
          </Stack>
          <Divider sx={{ my: 1, borderColor: alpha("#8f7d66", 0.1) }} />
          <MenuItem onClick={() => { onToggleDeleted(); setDeletedAnchorEl(null); }} sx={{ borderRadius: 2, fontSize: 12, fontWeight: 700, color: "#c4956a" }}>
            VIEW FULL HISTORY
          </MenuItem>
        </Menu>

        <Stack
          spacing={0.25}
          sx={{
            mt: "auto",
            pt: isCollapsed ? 0.4 : 1,
            width: "100%",
            alignItems: isCollapsed ? "center" : "stretch",
            flexShrink: 0,
            borderTop: isCollapsed ? "none" : `1px solid ${alpha(sidebarTint, 0.14)}`,
          }}
        >
          <SidebarLink
            label="Cloud Sync"
            icon={<CloudSyncRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={onOpenSettings}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="Download App"
            icon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={handleInstallApp}
            badge={deferredPrompt ? 1 : 0}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="Export Backup"
            icon={<DownloadRoundedIcon sx={{ fontSize: 18, transform: "rotate(180deg)" }} />}
            onClick={() => {
              const data = JSON.stringify(notes);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `docbook-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="Import Backup"
            icon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (re) => {
                  try {
                    const imported = JSON.parse(re.target.result);
                    if (Array.isArray(imported)) {
                      if (confirm(`Import ${imported.length} notes? This will merge with your current notes.`)) {
                        onImportNotes(imported);
                        alert("Notes imported successfully!");
                      }
                    } else {
                      alert("Invalid backup file format.");
                    }
                  } catch (err) {
                    alert("Failed to parse backup file.");
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="Feedback"
            icon={<FeedbackOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={onOpenFeedback}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
          <SidebarLink
            label="DocBook"
            icon={<NotesSvg sx={{ fontSize: 18 }} />}
            onClick={() => { }}
            isDrawer={isDrawer}
            isCollapsed={isCollapsed}
            accentColor={sidebarTint}
          />
        </Stack>
      </Box>
    </Box>
  );
}
