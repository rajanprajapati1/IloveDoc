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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { HeartIcon } from "@/assets/icon";
import { formatEditedAt, plainTextFromHtml, timeAgoLabel, tooltipSlotProps } from "./shared";

function SectionLabel({ children }) {
  return (
    <Typography variant="overline" sx={{ color: "#a09689", display: "block", mb: 0.8 }}>
      {children}
    </Typography>
  );
}

function SidebarLink({ icon, label, active = false, onClick, badge }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        gap: 1.1,
        borderRadius: 2.5,
        px: 1,
        py: 0.9,
        color: active ? "#1d1a17" : "#605951",
        bgcolor: active ? "#ece7e0" : "transparent",
        "&:hover": { bgcolor: active ? "#e7e1d8" : alpha("#8f7d66", 0.08) },
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center", color: active ? "#1d1a17" : "#6a645d" }}>{icon}</Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: active ? 800 : 600, lineHeight: 1.2, textAlign: "left", flex: 1 }}>{label}</Typography>
      {badge > 0 && (
        <Badge
          badgeContent={badge}
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: "#c4956a",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
      )}
    </ButtonBase>
  );
}

function NoteTitleLink({ note, active, onOpen, onDelete, disableDelete }) {
  const title = note.title?.trim() || "Untitled";
  const preview = plainTextFromHtml(note.content) || "Empty note";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      <Tooltip
        arrow
        placement="right"
        slotProps={tooltipSlotProps}
        title={
          <Box sx={{ maxWidth: 260 }}>
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
            justifyContent: "flex-start",
            gap: 1.1,
            borderRadius: 4,
            px: 1,
            py: 0.9,
            color: active ? "#1d1a17" : "#605951",
            bgcolor: active ? "#ece7e0" : "transparent",
            "&:hover": { bgcolor: active ? "#e7e1d8" : alpha("#8f7d66", 0.08) },
          }}
        >
          <Box sx={{ display: "grid", placeItems: "center", color: active ? "#1d1a17" : "#6a645d" }}>
            <TextFieldsRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
          <Typography noWrap sx={{ fontSize: 13.5, fontWeight: active ? 800 : 600, lineHeight: 1.2, textAlign: "left" }}>{title}</Typography>
        </ButtonBase>
      </Tooltip>
      <Tooltip arrow placement="right" slotProps={tooltipSlotProps} title={disableDelete ? "At least one note is required" : "Delete note"}>
        <Box component="span">
          <IconButton size="small" disabled={disableDelete} onClick={onDelete} sx={{ width: 24, height: 24, color: "#82796f", "&:hover": { bgcolor: alpha("#8f7d66", 0.12), color: "#5f554b" } }}>
            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}

function DeletedNoteItem({ note, onRestore, onPermanentlyDelete }) {
  const title = note.title?.trim() || "Untitled";
  const deletedLabel = note.deletedAt ? timeAgoLabel(note.deletedAt) : "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.7,
        borderRadius: 3,
        bgcolor: alpha("#e8d5b8", 0.25),
        "&:hover": { bgcolor: alpha("#e8d5b8", 0.45) },
        transition: "background-color 150ms ease",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: "#4a3f36", lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ fontSize: 10, color: "#9a8d7f", lineHeight: 1.3 }}>Deleted {deletedLabel}</Typography>
      </Box>
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
    </Box>
  );
}

export default function DocbookSidebar({
  notes,
  deletedNotes = [],
  activeNoteId,
  showDeleted,
  onToggleDeleted,
  onCreateNote,
  onOpenNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDelete,
  onOpenSettings,
}) {
  return (
    <Box sx={{ order: { xs: 2, lg: 1 }, borderRight: { lg: "1px solid #e6ddd3" }, borderTop: { xs: "1px solid #e6ddd3", lg: 0 }, bgcolor: "#faf7f3", p: 2.2, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Paper sx={{ border: "1px solid #e7dfd5", borderRadius: 3, bgcolor: "#fffdfa", px: 1.2, py: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fffdf8" }}><HeartIcon fontsize={14} /></Box>
          </Stack>
          DocBook
        </Stack>
      </Paper>

      <Stack spacing={0.25}>
        <SidebarLink
          label="Home"
          icon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
          active={!showDeleted}
          onClick={() => { if (showDeleted) onToggleDeleted(); }}
        />
        <SidebarLink
          label="Recently Deleted"
          icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          active={showDeleted}
          onClick={onToggleDeleted}
          badge={deletedNotes.length}
        />
      </Stack>

      {showDeleted ? (
        <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column", flex: 1 }}>
          <SectionLabel>RECENTLY DELETED</SectionLabel>
          <Typography sx={{ fontSize: 11, color: "#9a8d7f", mb: 1, lineHeight: 1.4 }}>
            Notes are kept for 7 days before automatic removal.
          </Typography>
          {deletedNotes.length === 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, opacity: 0.5 }}>
              <Typography sx={{ fontSize: 12.5, color: "#9a8d7f", textAlign: "center" }}>No recently deleted notes</Typography>
            </Box>
          ) : (
            <Stack spacing={0.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 0.2, scrollbarWidth: "thin" }}>
              {deletedNotes.map((note) => (
                <DeletedNoteItem
                  key={note.id}
                  note={note}
                  onRestore={onRestoreNote}
                  onPermanentlyDelete={onPermanentlyDelete}
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <SectionLabel>NOTES</SectionLabel>
            <Tooltip title="Create new note" arrow slotProps={tooltipSlotProps}>
              <IconButton onClick={onCreateNote} size="small" sx={{ bgcolor: "#eee7dd", border: "1px solid #ded4c8", "&:hover": { bgcolor: "#e4dbce" } }}>
                <AddRoundedIcon sx={{ fontSize: 16, color: "#352f29" }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack spacing={0.25} sx={{ maxHeight: 170, overflowY: "auto", pr: 0.2, scrollbarWidth: "thin", mt: 1 }}>
            {notes.map((note) => (
              <NoteTitleLink
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                disableDelete={notes.length <= 1}
                onOpen={() => onOpenNote(note.id)}
                onDelete={(event) => {
                  event.stopPropagation();
                  onDeleteNote(note.id);
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      <Stack spacing={0.2}>
        <SidebarLink
          label="Cloud Sync"
          icon={<CloudSyncRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={onOpenSettings}
        />
        <SidebarLink label="Download App" icon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />} />
        <SidebarLink label="Feedback" icon={<FeedbackOutlinedIcon sx={{ fontSize: 18 }} />} />
      </Stack>
    </Box>
  );
}
