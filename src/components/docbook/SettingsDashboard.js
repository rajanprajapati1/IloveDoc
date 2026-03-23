"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

/* Icons */
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import EmojiEmotionsRoundedIcon from "@mui/icons-material/EmojiEmotionsRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";

import { tooltipSlotProps, buildId, noteColors, stickyColorOptions } from "./shared";
import {
  ALL_EMOJIS,
  DEFAULT_SELECTED_EMOJIS,
  DEFAULT_PEOPLE,
  DEFAULT_FOLDERS,
  DEFAULT_LOCATIONS,
  loadCustomPeople,
  loadCustomFolders,
  loadCustomLocations,
  loadCustomEmojis,
  loadAppearanceSettings,
} from "./CustomizationPanel";
import changelogData from "./changelog.json";

/* ─── Constants ─── */
const ACCENT_COLORS = [
  "#f97316", "#ef4444", "#2563eb", "#14b8a6", "#8b5cf6",
  "#0f766e", "#b45309", "#1d4ed8", "#be185d", "#d97706",
  "#059669", "#7c3aed", "#dc2626", "#0284c7", "#4f46e5",
];

const SELECTION_COLORS = [
  "#b3e5fc", "#c8e6c9", "#ffcc80", "#f8bbd0", "#d1c4e9", "#c4956a", "#e0e0e0"
];

const AUTO_SAVE_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3600 },
];

const PIN_LENGTHS = [
  { label: "4 digits", value: 4 },
  { label: "6 digits", value: 6 },
  { label: "8 digits", value: 8 },
];

function generateRandomPin(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

/* ─── Tabs ─── */
const TABS = [
  { id: "sync", label: "Cloud Sync", icon: <CloudSyncRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "appearance", label: "Appearance", icon: <PaletteRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "people", label: "People, Folders & Map", icon: <PeopleRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "reactions", label: "Reactions", icon: <EmojiEmotionsRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "transfer", label: "Import / Export", icon: <SwapHorizRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "changelog", label: "Changelog", icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} /> },
];

/* ─── Shared Styles ─── */
const sectionSx = {
  p: 2.5,
  borderRadius: 4,
  bgcolor: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
};

const labelSx = { fontSize: 12, fontWeight: 700, mb: 0.8, color: "#2e261f", letterSpacing: "-0.01em" };
const captionSx = { fontSize: 11.5, color: "#8a7d70", lineHeight: 1.6 };

const fieldSx = {
  flex: 1,
  fontSize: 12,
  px: 1.2,
  py: 0.5,
  borderRadius: 2,
  bgcolor: "#faf7f3",
  border: "1px solid transparent",
  color: "#0f172a",
  transition: "all 150ms ease",
  "&:focus-within": { borderColor: "#8b5e3c", bgcolor: "#fff", boxShadow: "0 0 0 2px rgba(139,94,60,0.12)" },
  "& input": { p: 0, fontSize: 12 },
  "& input::placeholder": { color: "#94a3b8", fontSize: 11 },
};

/* ══════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════ */
export default function SettingsDashboard({
  accentColor = "#F7E36D",
  notes = [],
  onImportNotes,
  people,
  folders,
  locations,
  selectedEmojis,
  onPeopleChange,
  onFoldersChange,
  onLocationsChange,
  onEmojisChange,
}) {
  const [activeTab, setActiveTab] = useState("sync");

  /* ── Cloud Sync State ── */
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(300);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pinMode, setPinMode] = useState("existing");
  const [pinLength, setPinLength] = useState(8);

  /* ── Appearance State ── */
  const [appearance, setAppearance] = useState(loadAppearanceSettings());

  /* ── People / Folders State ── */
  const [localPeople, setLocalPeople] = useState(people || DEFAULT_PEOPLE);
  const [localFolders, setLocalFolders] = useState(folders || DEFAULT_FOLDERS);
  const [localLocations, setLocalLocations] = useState(locations || DEFAULT_LOCATIONS);

  /* ── Emoji State ── */
  const [localEmojis, setLocalEmojis] = useState(selectedEmojis || DEFAULT_SELECTED_EMOJIS);

  /* ── Load settings on mount ── */
  useEffect(() => {
    setLocalPeople(people || loadCustomPeople());
    setLocalFolders(folders || loadCustomFolders());
    setLocalLocations(locations || loadCustomLocations());
    setLocalEmojis(selectedEmojis || loadCustomEmojis());
    setAppearance(loadAppearanceSettings());
    try {
      const stored = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
      if (stored.pin) { setPin(stored.pin); setPinInput(stored.pin); }
      if (stored.autoSyncEnabled !== undefined) setAutoSyncEnabled(stored.autoSyncEnabled);
      if (stored.autoSyncInterval !== undefined) setAutoSyncInterval(stored.autoSyncInterval);
      if (stored.lastSyncAt) setLastSyncAt(stored.lastSyncAt);
    } catch { }
  }, [people, folders, locations, selectedEmojis]);

  /* ── Persistors ── */
  const saveSyncSettings = useCallback((updates = {}) => {
    const current = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
    const next = { ...current, ...updates };
    localStorage.setItem("docbook_sync_settings", JSON.stringify(next));
    window.dispatchEvent(new Event("docbook-sync-settings-changed"));
  }, []);

  const savePeople = useCallback((next) => { setLocalPeople(next); localStorage.setItem("docbook_custom_people", JSON.stringify(next)); onPeopleChange?.(next); }, [onPeopleChange]);
  const saveFolders = useCallback((next) => { setLocalFolders(next); localStorage.setItem("docbook_custom_folders", JSON.stringify(next)); onFoldersChange?.(next); }, [onFoldersChange]);
  const saveLocations = useCallback((next) => { setLocalLocations(next); localStorage.setItem("docbook_custom_locations", JSON.stringify(next)); onLocationsChange?.(next); }, [onLocationsChange]);
  const saveEmojis = useCallback((next) => { setLocalEmojis(next); localStorage.setItem("docbook_custom_emojis", JSON.stringify(next)); onEmojisChange?.(next); }, [onEmojisChange]);
  const saveAppearance = useCallback((updates) => {
    const next = { ...appearance, ...updates };
    setAppearance(next);
    localStorage.setItem("docbook_appearance_settings", JSON.stringify(next));
    window.dispatchEvent(new Event("docbook-appearance-changed"));
  }, [appearance]);

  /* ── Cloud Sync Handlers ── */
  const handleGeneratePin = () => setPinInput(generateRandomPin(pinLength));

  const handleSavePin = async () => {
    const trimmed = pinInput.trim();
    if (!trimmed || trimmed.length < 4) {
      setSyncMessage("PIN must be at least 4 characters.");
      setSyncStatus("error");
      setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
      return;
    }
    if (trimmed === pin) {
      setSyncMessage("PIN is already saved.");
      setSyncStatus("success");
      setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 2000);
      return;
    }
    setSyncStatus("syncing");
    setSyncMessage(pinMode === "create" ? "Checking PIN availability..." : "Verifying PIN...");

    try {
      const res = await fetch("/api/sync/check-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: trimmed }),
      });
      const data = await res.json();
      if (pinMode === "create" && data.exists) {
        setSyncMessage("This PIN is already taken. Choose a unique PIN.");
        setSyncStatus("error");
        setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 4000);
        return;
      }
      if (pinMode === "existing" && !data.exists) {
        setSyncMessage("PIN not found. Check the PIN or create a new one.");
        setSyncStatus("error");
        setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 4000);
        return;
      }
    } catch {
      setSyncMessage("Could not verify PIN (offline). Saved locally.");
      setSyncStatus("success");
    }

    setPin(trimmed);
    saveSyncSettings({ pin: trimmed });
    setSyncMessage(pinMode === "create" ? "PIN created successfully!" : "PIN connected!");
    setSyncStatus("success");
    if (pinMode === "existing") setTimeout(() => handlePullFromCloud(), 500);
    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinInput);
    setSyncMessage("PIN copied!");
    setSyncStatus("success");
    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 2000);
  };

  const handleSyncToCloud = async () => {
    if (!pin) { setSyncMessage("Set a PIN first."); setSyncStatus("error"); return; }
    setSyncStatus("syncing");
    setSyncMessage("Pushing notes to cloud...");
    try {
      const notesToSync = notes.map((n) => ({
        id: n.id, title: n.title, content: n.content,
        createdAt: n.createdAt, updatedAt: n.updatedAt,
        deletedAt: n.deletedAt || null, color: n.color || null, fontScale: n.fontScale || 1,
      }));
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, notes: notesToSync }),
      });
      const data = await res.json();
      if (data.success) {
        const now = new Date().toISOString();
        setLastSyncAt(now);
        saveSyncSettings({ lastSyncAt: now });
        setSyncMessage(`Synced ${notesToSync.length} note(s) to cloud!`);
        setSyncStatus("success");
      } else {
        setSyncMessage(data.error || "Sync failed.");
        setSyncStatus("error");
      }
    } catch {
      setSyncMessage("Network error.");
      setSyncStatus("error");
    }
    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  const handlePullFromCloud = async () => {
    if (!pin) { setSyncMessage("Set a PIN first."); setSyncStatus("error"); return; }
    setSyncStatus("syncing");
    setSyncMessage("Pulling notes from cloud...");
    try {
      const res = await fetch(`/api/sync?pin=${encodeURIComponent(pin)}`);
      const data = await res.json();
      if (data.success && data.notes) {
        onImportNotes?.(data.notes);
        const now = new Date().toISOString();
        setLastSyncAt(now);
        saveSyncSettings({ lastSyncAt: now });
        setSyncMessage(`Imported ${data.notes.length} note(s)!`);
        setSyncStatus("success");
      } else {
        setSyncMessage(data.error || "Pull failed.");
        setSyncStatus("error");
      }
    } catch {
      setSyncMessage("Network error.");
      setSyncStatus("error");
    }
    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  /* ── People / Folders helpers ── */
  const addPerson = () => savePeople([...localPeople, { id: buildId(), name: "", handle: "", role: "", accent: ACCENT_COLORS[localPeople.length % ACCENT_COLORS.length], icon: "Person" }]);
  const updatePerson = (id, field, value) => savePeople(localPeople.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  const removePerson = (id) => savePeople(localPeople.filter((p) => p.id !== id));

  const addFolder = () => saveFolders([...localFolders, { id: buildId(), name: "", path: "", description: "", accent: ACCENT_COLORS[localFolders.length % ACCENT_COLORS.length], icon: "Folder" }]);
  const updateFolder = (id, field, value) => saveFolders(localFolders.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  const removeFolder = (id) => saveFolders(localFolders.filter((f) => f.id !== id));

  const toggleEmoji = (code) => {
    if (localEmojis.includes(code)) saveEmojis(localEmojis.filter((e) => e !== code));
    else if (localEmojis.length < 6) saveEmojis([...localEmojis, code]);
  };

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: Cloud Sync
   * ══════════════════════════════════════════════════════════════════ */
  const renderSyncTab = () => (
    <Stack spacing={3}>
      {/* PIN Section */}
      <Box sx={sectionSx}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <KeyRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>Sync PIN</Typography>
          {pin && (
            <Chip label="Active" size="small" sx={{ ml: "auto", bgcolor: alpha("#10b981", 0.12), color: "#059669", fontWeight: 700, fontSize: 10.5, height: 22 }} />
          )}
        </Stack>

        <Typography sx={captionSx} mb={2}>
          {pinMode === "create"
            ? "Create a unique PIN to sync notes across devices. Remember this PIN — it's your only key."
            : "Enter your existing PIN to connect to your cloud data."}
        </Typography>

        <Stack direction="row" spacing={1} mb={2}>
          <Button
            variant={pinMode === "create" ? "contained" : "outlined"}
            size="small"
            onClick={() => setPinMode("create")}
            sx={{
              flex: 1, fontSize: 11, borderRadius: 2, textTransform: "none",
              bgcolor: pinMode === "create" ? "#5c3d2e" : "transparent",
              borderColor: "#5c3d2e", color: pinMode === "create" ? "#fff" : "#5c3d2e",
              "&:hover": { bgcolor: pinMode === "create" ? "#7a5240" : alpha("#5c3d2e", 0.05) },
            }}
          >
            New PIN
          </Button>
          <Button
            variant={pinMode === "existing" ? "contained" : "outlined"}
            size="small"
            onClick={() => setPinMode("existing")}
            sx={{
              flex: 1, fontSize: 11, borderRadius: 2, textTransform: "none",
              bgcolor: pinMode === "existing" ? "#5c3d2e" : "transparent",
              borderColor: "#5c3d2e", color: pinMode === "existing" ? "#fff" : "#5c3d2e",
              "&:hover": { bgcolor: pinMode === "existing" ? "#7a5240" : alpha("#5c3d2e", 0.05) },
            }}
          >
            Existing PIN
          </Button>
        </Stack>

        {/* PIN Length Selector — only when creating new */}
        {pinMode === "create" && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ ...labelSx, mb: 1 }}>PIN Length</Typography>
            <ToggleButtonGroup
              value={pinLength}
              exclusive
              onChange={(_, v) => v && setPinLength(v)}
              size="small"
              sx={{
                bgcolor: alpha("#f5efe7", 0.8),
                p: 0.5,
                borderRadius: 2.5,
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: 2.5,
                  py: 0.6,
                  borderRadius: "8px !important",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6a6054",
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "#fff",
                    color: "#2e261f",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    "&:hover": { bgcolor: "#fff" },
                  },
                },
              }}
            >
              {PIN_LENGTHS.map((pl) => (
                <ToggleButton key={pl.value} value={pl.value}>{pl.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            fullWidth
            placeholder="Enter PIN (min 4 chars)..."
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.toUpperCase())}
            type={showPin ? "text" : "password"}
            InputProps={{
              sx: { borderRadius: 3, fontSize: 14, fontFamily: "monospace", letterSpacing: "0.15em", bgcolor: "#fff" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPin((p) => !p)}>
                    {showPin ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Generate random PIN" arrow slotProps={tooltipSlotProps}>
            <IconButton onClick={handleGeneratePin} sx={{ bgcolor: alpha("#8b5e3c", 0.1), "&:hover": { bgcolor: alpha("#8b5e3c", 0.18) } }}>
              <ShuffleRoundedIcon sx={{ fontSize: 18, color: "#8b5e3c" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy PIN" arrow slotProps={tooltipSlotProps}>
            <IconButton onClick={handleCopyPin} sx={{ bgcolor: alpha("#8b5e3c", 0.1), "&:hover": { bgcolor: alpha("#8b5e3c", 0.18) } }}>
              <ContentCopyRoundedIcon sx={{ fontSize: 18, color: "#8b5e3c" }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Button
          fullWidth variant="contained" onClick={handleSavePin}
          sx={{
            mt: 1.5, borderRadius: 3, py: 1, textTransform: "none", fontWeight: 700, fontSize: 13,
            bgcolor: "#5c3d2e", "&:hover": { bgcolor: "#7a5240" },
            boxShadow: "0 4px 14px rgba(92, 61, 46, 0.25)",
          }}
        >
          {pinMode === "create" ? "Create & Save PIN" : "Connect PIN"}
        </Button>
      </Box>

      {/* Auto-Save Section */}
      <Box sx={sectionSx}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "#8b5e3c" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>Auto-Save to Cloud</Typography>
          <Box sx={{ ml: "auto" }}>
            <Switch
              checked={autoSyncEnabled}
              onChange={(e) => { setAutoSyncEnabled(e.target.checked); saveSyncSettings({ autoSyncEnabled: e.target.checked }); }}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#8b5e3c" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#c4956a" },
              }}
            />
          </Box>
        </Stack>
        <Typography sx={{ ...captionSx, mb: 1.5 }}>Auto-push notes to the cloud at a fixed interval.</Typography>
        <FormControl fullWidth size="small" disabled={!autoSyncEnabled}>
          <Select
            value={autoSyncInterval}
            onChange={(e) => { setAutoSyncInterval(e.target.value); saveSyncSettings({ autoSyncInterval: e.target.value }); }}
            sx={{ borderRadius: 3, bgcolor: "#fff", fontSize: 13 }}
          >
            {AUTO_SAVE_INTERVALS.map((opt) => <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Manual Sync */}
      <Box sx={sectionSx}>
        <Typography sx={{ ...labelSx, mb: 1.5 }}>Manual Sync</Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth variant="outlined" onClick={handleSyncToCloud} disabled={syncStatus === "syncing" || !pin}
            startIcon={<SyncRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: 3, py: 1.2, textTransform: "none", fontWeight: 700, fontSize: 12.5, borderColor: "#d9cab7", color: "#5c3d2e", "&:hover": { borderColor: "#c4956a", bgcolor: alpha("#c4956a", 0.06) } }}
          >
            Push to Cloud
          </Button>
          <Button
            fullWidth variant="outlined" onClick={handlePullFromCloud} disabled={syncStatus === "syncing" || !pin}
            startIcon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: 3, py: 1.2, textTransform: "none", fontWeight: 700, fontSize: 12.5, borderColor: "#d9cab7", color: "#5c3d2e", "&:hover": { borderColor: "#c4956a", bgcolor: alpha("#c4956a", 0.06) } }}
          >
            Pull from Cloud
          </Button>
        </Stack>

        {syncMessage && (
          <Box sx={{
            mt: 1.5, px: 1.5, py: 1, borderRadius: 2.5,
            bgcolor: syncStatus === "error" ? alpha("#ef4444", 0.08) : syncStatus === "success" ? alpha("#10b981", 0.08) : alpha("#3b82f6", 0.08),
            border: "1px solid",
            borderColor: syncStatus === "error" ? alpha("#ef4444", 0.2) : syncStatus === "success" ? alpha("#10b981", 0.2) : alpha("#3b82f6", 0.2),
            display: "flex", alignItems: "center", gap: 1,
          }}>
            {syncStatus === "success" && <CloudDoneRoundedIcon sx={{ fontSize: 16, color: "#059669" }} />}
            {syncStatus === "error" && <CloudOffRoundedIcon sx={{ fontSize: 16, color: "#ef4444" }} />}
            {syncStatus === "syncing" && <SyncRoundedIcon sx={{ fontSize: 16, color: "#3b82f6", animation: "spin 1s linear infinite", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />}
            <Typography sx={{ fontSize: 12, color: syncStatus === "error" ? "#dc2626" : syncStatus === "success" ? "#059669" : "#3b82f6", fontWeight: 600 }}>{syncMessage}</Typography>
          </Box>
        )}

        {lastSyncAt && (
          <Typography sx={{ fontSize: 11, color: "#8a7d70", mt: 1.2 }}>Last synced: {new Date(lastSyncAt).toLocaleString()}</Typography>
        )}
      </Box>

      <Box sx={{ px: 1 }}>
        <Typography sx={{ fontSize: 11, color: "#9a8d7f", lineHeight: 1.6 }}>
          📌 <strong>Important:</strong> Your PIN is stored locally. If you lose it, you won't be able to access your cloud data. Images are stored locally only.
        </Typography>
      </Box>
    </Stack>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: Appearance
   * ══════════════════════════════════════════════════════════════════ */
  const renderAppearanceTab = () => (
    <Stack spacing={3}>
      {/* Font Family */}
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Font Family</Typography>
        <FormControl fullWidth size="small">
          <Select value={appearance.fontFamily} onChange={(e) => saveAppearance({ fontFamily: e.target.value })} sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: 3 }}>
            <MenuItem sx={{ fontSize: 13 }} value="Inter, system-ui, sans-serif">Inter</MenuItem>
            <MenuItem sx={{ fontSize: 13 }} value="Roboto, sans-serif">Roboto</MenuItem>
            <MenuItem sx={{ fontSize: 13 }} value="Merriweather, serif">Serif</MenuItem>
            <MenuItem sx={{ fontSize: 13 }} value="'Fira Code', monospace">Mono</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Font Size */}
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Font Size: {appearance.fontSize}px</Typography>
        <Slider
          size="small"
          value={appearance.fontSize}
          onChange={(_, val) => saveAppearance({ fontSize: val })}
          step={1} min={12} max={22} marks
          sx={{
            color: "#8b5e3c", py: 0.5,
            "& .MuiSlider-thumb": { width: 16, height: 16 },
          }}
        />
      </Box>

      {/* Default Note Color */}
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Default Note Color</Typography>
        <Typography sx={{ ...captionSx, mb: 1.5 }}>New notes will use this color by default</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {/* Custom Color Input */}
          <Tooltip title="Custom Color" arrow slotProps={tooltipSlotProps}>
            <Box
              component="label"
              sx={{
                position: "relative", width: 32, height: 32, borderRadius: 2, cursor: "pointer",
                border: "2px dashed rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 150ms ease",
                "&:hover": { transform: "scale(1.12)", borderColor: "rgba(0,0,0,0.4)" },
                overflow: "hidden"
              }}
            >
              <Box component="span" sx={{ fontSize: 18, color: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                +
              </Box>
              <input 
                title="Choose custom color"
                type="color"
                value={appearance.defaultNoteColor || "#FFD84D"}
                onChange={(e) => saveAppearance({ defaultNoteColor: e.target.value })}
                style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", border: "none", padding: 0 }}
              />
            </Box>
          </Tooltip>

          {noteColors.map((nc) => {
            const isSelected = (appearance.defaultNoteColor || "#FFD84D") === nc.hex;
            return (
              <Tooltip key={nc.hex} title={nc.name.replace(/-/g, " ")} arrow slotProps={tooltipSlotProps}>
                <Box
                  component="button"
                  onClick={() => saveAppearance({ defaultNoteColor: nc.hex })}
                  sx={{
                    width: 32, height: 32, borderRadius: 2, bgcolor: nc.hex, cursor: "pointer",
                    border: "none",
                    outline: isSelected ? `2.5px solid ${nc.hex}` : "none",
                    outlineOffset: 2,
                    boxShadow: isSelected ? `0 2px 8px ${alpha(nc.hex, 0.4)}` : "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 150ms ease",
                    "&:hover": { transform: "scale(1.12)", boxShadow: `0 3px 10px ${alpha(nc.hex, 0.3)}` },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Default Sticky Note Color */}
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Default Sticky Note Color</Typography>
        <Typography sx={{ ...captionSx, mb: 1.5 }}>New sticky notes will use this color</Typography>
        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
          {stickyColorOptions.map((sc) => {
            const isSelected = (appearance.defaultStickyColor || "#F7E36D") === sc.value;
            return (
              <Tooltip key={sc.value} title={sc.label} arrow slotProps={tooltipSlotProps}>
                <Box
                  component="button"
                  onClick={() => saveAppearance({ defaultStickyColor: sc.value })}
                  sx={{
                    width: 40, height: 40, borderRadius: 2.5, cursor: "pointer",
                    bgcolor: sc.value, border: sc.value === "#FFFFFF" ? "1px solid rgba(0,0,0,0.12)" : "none",
                    outline: isSelected ? `2.5px solid ${sc.shade}` : "none",
                    outlineOffset: 2,
                    boxShadow: isSelected ? `0 3px 12px ${alpha(sc.shade, 0.35)}` : "0 1px 4px rgba(0,0,0,0.06)",
                    transition: "all 150ms ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    "&:hover": { transform: "scale(1.1)", boxShadow: `0 4px 14px ${alpha(sc.shade, 0.3)}` },
                  }}
                >
                  {isSelected && (
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: sc.ink, opacity: 0.5 }} />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>

      {/* Selection Highlight Color */}
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Selection Highlight Color</Typography>
        <Typography sx={{ ...captionSx, mb: 1.5 }}>Color used when you select text in the editor</Typography>
        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
          {SELECTION_COLORS.map((c) => (
            <Box
              key={c}
              component="button"
              onClick={() => saveAppearance({ selectionColor: c })}
              sx={{
                width: 32, height: 32, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                border: appearance.selectionColor === c ? "none" : "1px solid rgba(0,0,0,0.08)",
                outline: appearance.selectionColor === c ? `2.5px solid ${c}` : "none",
                outlineOffset: 2,
                boxShadow: appearance.selectionColor === c ? `0 2px 8px ${alpha(c, 0.4)}` : "none",
                transition: "all 150ms ease",
                "&:hover": { transform: "scale(1.15)" },
              }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: People & Folders — Google-style list
   * ══════════════════════════════════════════════════════════════════ */
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);

  const renderPeopleTab = () => (
    <Stack spacing={3}>
      {/* People */}
      <Box sx={sectionSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Box>
            <Typography sx={{ ...labelSx, mb: 0 }}>People</Typography>
            <Typography sx={captionSx}>For @mentions inside the editor</Typography>
          </Box>
          <Button onClick={addPerson} variant="text" size="small" sx={{ borderRadius: 2, color: "#8b5e3c", fontWeight: 700, fontSize: 12, textTransform: "none", "&:hover": { bgcolor: alpha("#8b5e3c", 0.08) } }}>
            + Add
          </Button>
        </Stack>

        <Box sx={{ maxHeight: 400, overflowY: "auto", mx: -1, px: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: 999 } }}>
          {localPeople.map((person, idx) => {
            const isEditing = editingPersonId === person.id;
            const initial = (person.name || "?")[0].toUpperCase();
            return (
              <Box key={person.id}>
                {/* ── List Row ── */}
                <Box
                  onClick={() => setEditingPersonId(isEditing ? null : person.id)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    py: 1.2, px: 1, borderRadius: 2.5, cursor: "pointer",
                    transition: "background 150ms ease",
                    "&:hover": { bgcolor: alpha("#8b5e3c", 0.04) },
                    "&:hover .delete-btn": { opacity: 1 },
                  }}
                >
                  {/* Avatar */}
                  <Box sx={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    bgcolor: person.accent || "#8b5e3c",
                    display: "grid", placeItems: "center",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    boxShadow: `0 2px 6px ${alpha(person.accent || "#8b5e3c", 0.3)}`,
                  }}>
                    {initial}
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: "#1a1613", lineHeight: 1.3 }}>
                      {person.name || "Unnamed"}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 11.5, color: "#8a7d70", lineHeight: 1.3 }}>
                      {person.role || "No role"}
                    </Typography>
                  </Box>

                  {/* Handle */}
                  <Typography sx={{ fontSize: 12, color: "#a09487", fontFamily: "monospace", flexShrink: 0 }}>
                    @{person.handle || "—"}
                  </Typography>

                  {/* Delete */}
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removePerson(person.id); }}
                    sx={{ opacity: 0, color: "#b0a090", "&:hover": { color: "#ef4444", bgcolor: alpha("#ef4444", 0.06) }, width: 28, height: 28, transition: "all 150ms ease" }}
                  >
                    <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                {/* ── Inline Edit Panel ── */}
                {isEditing && (
                  <Box sx={{ pl: 6.5, pr: 1, pb: 1.5, pt: 0.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <InputBase placeholder="Name" value={person.name} onChange={(e) => updatePerson(person.id, "name", e.target.value)} onClick={(e) => e.stopPropagation()} sx={fieldSx} />
                        <InputBase placeholder="@handle" value={person.handle} onChange={(e) => updatePerson(person.id, "handle", e.target.value)} onClick={(e) => e.stopPropagation()} sx={{ ...fieldSx, flex: 0.5 }} />
                      </Stack>
                      <InputBase placeholder="Role" value={person.role} onChange={(e) => updatePerson(person.id, "role", e.target.value)} onClick={(e) => e.stopPropagation()} sx={fieldSx} />
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Typography sx={{ fontSize: 10.5, color: "#a09487", mr: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</Typography>
                        {ACCENT_COLORS.slice(0, 12).map((c) => (
                          <Box
                            key={c} component="button"
                            onClick={(e) => { e.stopPropagation(); updatePerson(person.id, "accent", c); }}
                            sx={{
                              width: 16, height: 16, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                              border: "none", outline: person.accent === c ? `2px solid ${c}` : "none", outlineOffset: 2,
                              transition: "transform 120ms ease",
                              "&:hover": { transform: "scale(1.25)" },
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Box>
                )}

                 {/* Divider */}
                {idx < localPeople.length - 1 && (
                  <Box sx={{ height: "1px", bgcolor: "rgba(0,0,0,0.05)", ml: 6.5, mr: 1 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Locations */}
      <Box sx={sectionSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Box>
            <Typography sx={{ ...labelSx, mb: 0 }}>Locations</Typography>
            <Typography sx={captionSx}>For !location mentions and map pins</Typography>
          </Box>
          <Button 
            onClick={() => {
              const newLoc = { id: buildId(), name: "", address: "", description: "", accent: ACCENT_COLORS[8], icon: "Map" };
              const next = [newLoc, ...localLocations];
              saveLocations(next);
              setEditingLocationId(newLoc.id);
            }} 
            variant="text" size="small" 
            sx={{ borderRadius: 2, color: "#8b5e3c", fontWeight: 700, fontSize: 12, textTransform: "none", "&:hover": { bgcolor: alpha("#8b5e3c", 0.08) } }}
          >
            + Add
          </Button>
        </Stack>

        <Box sx={{ maxHeight: 400, overflowY: "auto", mx: -1, px: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: 999 } }}>
          {localLocations.map((loc, idx) => {
            const isEditing = editingLocationId === loc.id;
            return (
              <Box key={loc.id}>
                <Box
                  onClick={() => setEditingLocationId(isEditing ? null : loc.id)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    py: 1.2, px: 1, borderRadius: 2.5, cursor: "pointer",
                    transition: "background 150ms ease",
                    "&:hover": { bgcolor: alpha("#8b5e3c", 0.04) },
                    "&:hover .delete-btn": { opacity: 1 },
                  }}
                >
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                    bgcolor: alpha(loc.accent || "#0ea5e9", 0.12),
                    display: "grid", placeItems: "center",
                    color: loc.accent || "#0ea5e9", fontSize: 18,
                  }}>
                    📍
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: "#1a1613", lineHeight: 1.3 }}>
                      {loc.name || "Unnamed Place"}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 11.5, color: "#8a7d70", lineHeight: 1.3 }}>
                      {loc.address || "No address"}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 12, color: "#a09487", flexShrink: 0 }}>
                    !{loc.name.toLowerCase().replace(/\s+/g, "_") || "—"}
                  </Typography>

                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      saveLocations(localLocations.filter(l => l.id !== loc.id));
                    }}
                    sx={{ opacity: 0, color: "#b0a090", "&:hover": { color: "#ef4444", bgcolor: alpha("#ef4444", 0.06) }, width: 28, height: 28, transition: "all 150ms ease" }}
                  >
                    <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                {isEditing && (
                  <Box sx={{ pl: 6.5, pr: 1, pb: 1.5, pt: 0.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <InputBase 
                          placeholder="Place name" 
                          value={loc.name} 
                          onChange={(e) => {
                            const nextLabels = localLocations.map(l => l.id === loc.id ? { ...l, name: e.target.value } : l);
                            saveLocations(nextLabels);
                          }} 
                          onClick={(e) => e.stopPropagation()} sx={fieldSx} 
                        />
                        <InputBase 
                          placeholder="Address" 
                          value={loc.address} 
                          onChange={(e) => {
                            const nextLabels = localLocations.map(l => l.id === loc.id ? { ...l, address: e.target.value } : l);
                            saveLocations(nextLabels);
                          }} 
                          onClick={(e) => e.stopPropagation()} sx={fieldSx} 
                        />
                      </Stack>
                      <InputBase 
                        placeholder="Description" 
                        value={loc.description} 
                        onChange={(e) => {
                          const nextLabels = localLocations.map(l => l.id === loc.id ? { ...l, description: e.target.value } : l);
                          saveLocations(nextLabels);
                        }} 
                        onClick={(e) => e.stopPropagation()} sx={fieldSx} 
                      />
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Typography sx={{ fontSize: 10.5, color: "#a09487", mr: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</Typography>
                        {ACCENT_COLORS.slice(0, 12).map((c) => (
                          <Box
                            key={c} component="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              saveLocations(localLocations.map(l => l.id === loc.id ? { ...l, accent: c } : l));
                            }}
                            sx={{
                              width: 16, height: 16, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                              border: "none", outline: loc.accent === c ? `2px solid ${c}` : "none", outlineOffset: 2,
                              transition: "transform 120ms ease",
                              "&:hover": { transform: "scale(1.25)" },
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {idx < localLocations.length - 1 && (
                  <Box sx={{ height: "1px", bgcolor: "rgba(0,0,0,0.05)", ml: 6.5, mr: 1 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Folders */}
      <Box sx={sectionSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Box>
            <Typography sx={{ ...labelSx, mb: 0 }}>Folders</Typography>
            <Typography sx={captionSx}>For #folder shortcuts in the editor</Typography>
          </Box>
          <Button onClick={addFolder} variant="text" size="small" sx={{ borderRadius: 2, color: "#8b5e3c", fontWeight: 700, fontSize: 12, textTransform: "none", "&:hover": { bgcolor: alpha("#8b5e3c", 0.08) } }}>
            + Add
          </Button>
        </Stack>

        <Box sx={{ maxHeight: 400, overflowY: "auto", mx: -1, px: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: 999 } }}>
          {localFolders.map((folder, idx) => {
            const isEditing = editingFolderId === folder.id;
            return (
              <Box key={folder.id}>
                {/* ── List Row ── */}
                <Box
                  onClick={() => setEditingFolderId(isEditing ? null : folder.id)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    py: 1.2, px: 1, borderRadius: 2.5, cursor: "pointer",
                    transition: "background 150ms ease",
                    "&:hover": { bgcolor: alpha("#8b5e3c", 0.04) },
                    "&:hover .delete-btn": { opacity: 1 },
                  }}
                >
                  {/* Folder Icon */}
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                    bgcolor: alpha(folder.accent || "#8b5cf6", 0.12),
                    display: "grid", placeItems: "center",
                    color: folder.accent || "#8b5cf6", fontSize: 16, fontWeight: 800,
                  }}>
                    #
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: "#1a1613", lineHeight: 1.3 }}>
                      {folder.name || "Unnamed"}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 11.5, color: "#8a7d70", lineHeight: 1.3 }}>
                      {folder.description || "No description"}
                    </Typography>
                  </Box>

                  {/* Path */}
                  <Typography noWrap sx={{ fontSize: 11.5, color: "#a09487", fontFamily: "monospace", flexShrink: 0, maxWidth: 160 }}>
                    {folder.path || "—"}
                  </Typography>

                  {/* Delete */}
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removeFolder(folder.id); }}
                    sx={{ opacity: 0, color: "#b0a090", "&:hover": { color: "#ef4444", bgcolor: alpha("#ef4444", 0.06) }, width: 28, height: 28, transition: "all 150ms ease" }}
                  >
                    <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                {/* ── Inline Edit Panel ── */}
                {isEditing && (
                  <Box sx={{ pl: 6.5, pr: 1, pb: 1.5, pt: 0.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <InputBase placeholder="Folder name" value={folder.name} onChange={(e) => updateFolder(folder.id, "name", e.target.value)} onClick={(e) => e.stopPropagation()} sx={fieldSx} />
                        <InputBase placeholder="Path" value={folder.path} onChange={(e) => updateFolder(folder.id, "path", e.target.value)} onClick={(e) => e.stopPropagation()} sx={fieldSx} />
                      </Stack>
                      <InputBase placeholder="Description" value={folder.description} onChange={(e) => updateFolder(folder.id, "description", e.target.value)} onClick={(e) => e.stopPropagation()} sx={fieldSx} />
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Typography sx={{ fontSize: 10.5, color: "#a09487", mr: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</Typography>
                        {ACCENT_COLORS.slice(0, 12).map((c) => (
                          <Box
                            key={c} component="button"
                            onClick={(e) => { e.stopPropagation(); updateFolder(folder.id, "accent", c); }}
                            sx={{
                              width: 16, height: 16, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                              border: "none", outline: folder.accent === c ? `2px solid ${c}` : "none", outlineOffset: 2,
                              transition: "transform 120ms ease",
                              "&:hover": { transform: "scale(1.25)" },
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {/* Divider */}
                {idx < localFolders.length - 1 && (
                  <Box sx={{ height: "1px", bgcolor: "rgba(0,0,0,0.05)", ml: 6.5, mr: 1 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: Reactions
   * ══════════════════════════════════════════════════════════════════ */
  const renderReactionsTab = () => (
    <Stack spacing={3}>
      <Box sx={sectionSx}>
        <Typography sx={labelSx}>Selected Reactions (up to 6)</Typography>
        <Stack direction="row" spacing={1} mb={2.5}>
          {localEmojis.map((code) => {
            const emojiDef = ALL_EMOJIS.find((e) => e.code === code);
            return (
              <Box
                key={code}
                onClick={() => toggleEmoji(code)}
                sx={{
                  fontSize: 20, cursor: "pointer", bgcolor: alpha("#8b5e3c", 0.08),
                  width: 90, height: 90, display: "grid", placeItems: "center",
                  borderRadius: 5, border: `2px solid ${alpha("#8b5e3c", 0.3)}`,
                  transition: "transform 150ms ease",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              >
                {emojiDef?.animated ? (
                  <Box component="img" src={emojiDef.animated} alt={emojiDef.label || code} sx={{ width: 60, height: 60, objectFit: "contain" }} />
                ) : code}
              </Box>
            );
          })}
        </Stack>

        <Typography sx={labelSx}>Emoji Library</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
          {ALL_EMOJIS.map((e) => (
            <Tooltip key={e.code} title={e.label} arrow slotProps={tooltipSlotProps}>
              <Box
                onClick={() => toggleEmoji(e.code)}
                sx={{
                  fontSize: 18, cursor: "pointer", width: 90, height: 90,
                  display: "grid", placeItems: "center", borderRadius: 5,
                  bgcolor: localEmojis.includes(e.code) ? alpha("#8b5e3c", 0.12) : "transparent",
                  border: localEmojis.includes(e.code) ? `1px solid ${alpha("#8b5e3c", 0.2)}` : "1px solid transparent",
                  "&:hover": { bgcolor: alpha("#8b5e3c", 0.08) },
                  transition: "all 150ms ease",
                }}
              >
                {e.animated ? (
                  <Box component="img" src={e.animated} alt={e.label} sx={{ width: 60, height: 60, objectFit: "contain" }} />
                ) : e.code}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Stack>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: Import / Export
   * ══════════════════════════════════════════════════════════════════ */
  const renderTransferTab = () => (
    <Stack spacing={3}>
      {/* Export */}
      <Box sx={sectionSx}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FileUploadRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
          <Typography sx={{ ...labelSx, mb: 0 }}>Export Backup</Typography>
        </Stack>
        <Typography sx={{ ...captionSx, mb: 2 }}>Download all your notes as a JSON file for safekeeping or transfer.</Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
            const dNode = document.createElement("a");
            dNode.setAttribute("href", dataStr);
            dNode.setAttribute("download", `docbook-backup-${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(dNode); dNode.click(); dNode.remove();
          }}
          startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: 3, py: 1.2, textTransform: "none", fontWeight: 700, fontSize: 13,
            bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" },
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
          }}
        >
          Export as JSON
        </Button>
      </Box>

      {/* Import */}
      <Box sx={sectionSx}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FileDownloadRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
          <Typography sx={{ ...labelSx, mb: 0 }}>Import Backup</Typography>
        </Stack>
        <Typography sx={{ ...captionSx, mb: 2 }}>Merge notes from a previously exported JSON backup file.</Typography>
        <Button
          variant="outlined"
          fullWidth
          component="label"
          startIcon={<FileUploadRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: 3, py: 1.2, textTransform: "none", fontWeight: 700, fontSize: 13,
            borderColor: "#d9cab7", color: "#5c3d2e",
            "&:hover": { borderColor: "#c4956a", bgcolor: alpha("#c4956a", 0.06) },
          }}
        >
          Import JSON File
          <input type="file" hidden accept=".json" onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (re) => {
              try {
                const imported = JSON.parse(re.target.result);
                if (Array.isArray(imported)) {
                  if (confirm(`Import ${imported.length} notes? This will merge with your current notes.`)) {
                    onImportNotes?.(imported);
                  }
                } else {
                  alert("Invalid backup file format.");
                }
              } catch {
                alert("Failed to parse backup file.");
              }
            };
            reader.readAsText(file);
            e.target.value = "";
          }} />
        </Button>
      </Box>

      <Box sx={{ px: 1 }}>
        <Typography sx={{ fontSize: 11, color: "#9a8d7f", lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong> Importing merges notes by ID — existing notes are updated, new ones are added.
        </Typography>
      </Box>
    </Stack>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  TAB: Changelog
   * ══════════════════════════════════════════════════════════════════ */
  const renderChangelogTab = () => (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: alpha("#8bc34a", 0.16), color: "#6b9630" }}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#2d241d" }}>
          {changelogData.title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1, mb: 3 }}>
        <Stack direction="row" spacing={0.6} alignItems="center">
          <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "#8a7767" }} />
          <Typography sx={{ fontSize: 12, color: "#7b6c5c" }}>{changelogData.subtitle}</Typography>
        </Stack>
        <Chip icon={<SellOutlinedIcon />} label={changelogData.status} size="small" sx={{ bgcolor: alpha("#60a5fa", 0.12), color: "#2d6fbf", fontWeight: 700, borderRadius: 999, "& .MuiChip-icon": { color: "inherit", fontSize: 14 } }} />
      </Stack>

      <Stack spacing={3}>
        {changelogData.releases.map((entry, index) => (
          <Box key={entry.date}>
            {index > 0 && <Divider sx={{ mb: 2.5, borderColor: alpha("#8f7d66", 0.12) }} />}
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#342922", mb: 0.5 }}>{entry.date}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#51453b", mb: 0.8 }}>{entry.title}</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "#6a5d52", mb: 1 }}>{entry.summary}</Typography>
            <Stack spacing={0.6}>
              {entry.changes.map((item) => (
                <Typography key={item} sx={{ fontSize: 13, lineHeight: 1.6, color: "#64574b" }}>
                  <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>+</Box>{" "}{item}
                </Typography>
              ))}
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#7b6c5c", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>How To Use</Typography>
              <Stack spacing={0.5}>
                {entry.how_to_use.map((step, i) => (
                  <Typography key={step} sx={{ fontSize: 12.5, lineHeight: 1.5, color: "#64574b" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>{i + 1}.</Box>{" "}{step}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 3, borderColor: alpha("#8f7d66", 0.12) }} />

      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#342922", mb: 1.2 }}>Feature Guide</Typography>
        <Stack spacing={1.5}>
          {changelogData.features.map((feature) => (
            <Box key={feature.name} sx={{ p: 1.4, borderRadius: 3, bgcolor: alpha("#fffdf8", 0.72), border: `1px solid ${alpha(accentColor, 0.14)}` }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#352a22", mb: 0.3 }}>{feature.name}</Typography>
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: "#6a5d52", mb: 0.8 }}>{feature.description}</Typography>
              <Stack spacing={0.4}>
                {feature.how_to_use.map((step) => (
                  <Typography key={step} sx={{ fontSize: 12, lineHeight: 1.5, color: "#64574b" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#2f241d" }}>•</Box>{" "}{step}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  Render
   * ══════════════════════════════════════════════════════════════════ */
  const renderActiveTab = () => {
    switch (activeTab) {
      case "sync": return renderSyncTab();
      case "appearance": return renderAppearanceTab();
      case "people": return renderPeopleTab();
      case "reactions": return renderReactionsTab();
      case "transfer": return renderTransferTab();
      case "changelog": return renderChangelogTab();
      default: return renderSyncTab();
    }
  };

  return (
    <Box sx={{
      order: { xs: 1, lg: 2 },
      minWidth: 0, width: "100%", height: "100%", minHeight: 0,
      p: "10px", display: "flex", flexDirection: "column", overflow: "hidden",
      background: "transparent",
    }}>
      <Box sx={{
        position: "relative", flex: 1, minHeight: { xs: 360, lg: 0 }, width: "100%", overflow: "hidden",
        borderRadius: 5,
        background: `linear-gradient(160deg, ${alpha(accentColor, 0.10)} 0%, rgba(255,251,245,0.92) 28%, rgba(246,239,229,0.92) 100%)`,
        border: `1px solid ${alpha(accentColor, 0.16)}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 40px ${alpha("#7b5f39", 0.08)}`,
      }}>
        <Box sx={{ height: "100%", display: "flex" }}>
          {/* ─── Tab Rail ─── */}
          <Box sx={{
            width: { xs: 56, md: 200 },
            minWidth: { xs: 56, md: 200 },
            borderRight: `1px solid ${alpha("#8f7d66", 0.12)}`,
            display: "flex", flexDirection: "column",
            py: 2, px: { xs: 0.5, md: 1 },
            gap: 0.35,
            overflowY: "auto",
            background: alpha("#f8f3ed", 0.5),
          }}>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ px: 1.5, mb: 2, display: { xs: "none", md: "flex" } }}>
              <SettingsRoundedIcon sx={{ fontSize: 20, color: "#5c3d2e" }} />
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#2e261f", letterSpacing: "-0.02em" }}>Settings</Typography>
            </Stack>

            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Tooltip key={tab.id} title={tab.label} placement="right" arrow slotProps={tooltipSlotProps} disableHoverListener={false}>
                  <ButtonBase
                    onClick={() => setActiveTab(tab.id)}
                    sx={{
                      width: "100%",
                      justifyContent: { xs: "center", md: "flex-start" },
                      gap: 1.2,
                      borderRadius: 8,
                      px: { xs: 0, md: 1.5 },
                      py: 1,
                      color: isActive ? "#2e261f" : "#7a6e62",
                      bgcolor: isActive ? alpha(accentColor, 0.18) : "transparent",
                      boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.4)` : "none",
                      transition: "all 180ms ease",
                      "&:hover": { bgcolor: isActive ? alpha(accentColor, 0.22) : alpha(accentColor, 0.08) },
                    }}
                  >
                    <Box sx={{ display: "grid", placeItems: "center", color: isActive ? "#5c3d2e" : "#8a7d70", minWidth: 20 }}>
                      {tab.icon}
                    </Box>
                    <Typography sx={{
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      whiteSpace: "nowrap",
                      display: { xs: "none", md: "block" },
                    }}>
                      {tab.label}
                    </Typography>
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>

          {/* ─── Tab Content ─── */}
          <Box sx={{
            flex: 1, minWidth: 0, overflowY: "auto",
            px: { xs: 2, md: 5 }, py: { xs: 2, md: 3.5 },
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": { background: alpha("#8f7d66", 0.22), borderRadius: 999 },
          }}>
            <Box sx={{ maxWidth: 660, mx: "auto", pb: 4 }}>
              {/* Tab Header */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: "#2e261f", letterSpacing: "-0.03em" }}>
                  {TABS.find(t => t.id === activeTab)?.label}
                </Typography>
              </Box>
              {renderActiveTab()}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
