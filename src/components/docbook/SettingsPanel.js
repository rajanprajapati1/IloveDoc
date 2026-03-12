"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import { tooltipSlotProps } from "./shared";

const AUTO_SAVE_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3600 },
];

function generateRandomPin() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 8; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

export default function SettingsPanel({ open, onClose, notes, onImportNotes }) {
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(300);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | success | error
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pinMode, setPinMode] = useState("existing"); // existing | create

  /* Load settings from localStorage */
  useEffect(() => {
    if (!open) return;
    try {
      const stored = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
      if (stored.pin) {
        setPin(stored.pin);
        setPinInput(stored.pin);
      }
      if (stored.autoSyncEnabled !== undefined) setAutoSyncEnabled(stored.autoSyncEnabled);
      if (stored.autoSyncInterval !== undefined) setAutoSyncInterval(stored.autoSyncInterval);
      if (stored.lastSyncAt) setLastSyncAt(stored.lastSyncAt);
    } catch { }
  }, [open]);

  /* Persist settings */
  const saveSettings = useCallback((updates = {}) => {
    const current = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
    const next = { ...current, ...updates };
    localStorage.setItem("docbook_sync_settings", JSON.stringify(next));
  }, []);

  const handleGeneratePin = () => {
    const newPin = generateRandomPin();
    setPinInput(newPin);
  };

  const handleSavePin = async () => {
    const trimmed = pinInput.trim();
    if (!trimmed || trimmed.length < 4) {
      setSyncMessage("PIN must be at least 4 characters.");
      setSyncStatus("error");
      setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
      return;
    }

    /* If PIN hasn't changed, skip uniqueness check */
    if (trimmed === pin) {
      setSyncMessage("PIN is already saved.");
      setSyncStatus("success");
      setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 2000);
      return;
    }

    /* Check PIN uniqueness on the server */
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
        setSyncMessage("This PIN is already taken. Please choose a unique PIN.");
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
      /* If server check fails, allow saving locally but warn */
      setSyncMessage("Could not verify PIN (offline). Saved locally.");
      setSyncStatus("success");
    }

    setPin(trimmed);
    saveSettings({ pin: trimmed });
    setSyncMessage(pinMode === "create" ? "PIN created successfully! Remember it." : "PIN connected successfully!");
    setSyncStatus("success");

    /* Automatically pull if connecting existing PIN */
    if (pinMode === "existing") {
      setTimeout(() => handlePullFromCloud(), 500);
    }

    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinInput);
    setSyncMessage("PIN copied to clipboard!");
    setSyncStatus("success");
    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 2000);
  };

  const handleSyncToCloud = async () => {
    if (!pin) {
      setSyncMessage("Please set a PIN first.");
      setSyncStatus("error");
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Pushing notes to cloud...");

    try {
      const notesToSync = notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        deletedAt: n.deletedAt || null,
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
        saveSettings({ lastSyncAt: now });
        setSyncMessage(`Synced ${notesToSync.length} note(s) to cloud!`);
        setSyncStatus("success");
      } else {
        setSyncMessage(data.error || "Sync failed.");
        setSyncStatus("error");
      }
    } catch (err) {
      setSyncMessage("Network error. Check your connection.");
      setSyncStatus("error");
    }

    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  const handlePullFromCloud = async () => {
    if (!pin) {
      setSyncMessage("Please set a PIN first.");
      setSyncStatus("error");
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Pulling notes from cloud...");

    try {
      const res = await fetch(`/api/sync?pin=${encodeURIComponent(pin)}`);
      const data = await res.json();

      if (data.success && data.notes) {
        onImportNotes(data.notes);
        const now = new Date().toISOString();
        setLastSyncAt(now);
        saveSettings({ lastSyncAt: now });
        setSyncMessage(`Imported ${data.notes.length} note(s) from cloud!`);
        setSyncStatus("success");
      } else {
        setSyncMessage(data.error || "Pull failed.");
        setSyncStatus("error");
      }
    } catch (err) {
      setSyncMessage("Network error. Check your connection.");
      setSyncStatus("error");
    }

    setTimeout(() => { setSyncStatus("idle"); setSyncMessage(""); }, 3000);
  };

  const handleAutoSyncChange = (enabled) => {
    setAutoSyncEnabled(enabled);
    saveSettings({ autoSyncEnabled: enabled });
  };

  const handleIntervalChange = (val) => {
    setAutoSyncInterval(val);
    saveSettings({ autoSyncInterval: val });
  };

  const sectionSx = {
    p: 2.5,
    borderRadius: 4,
    bgcolor: alpha("#f5efe7", 0.6),
    border: "1px solid",
    borderColor: alpha("#d9cab7", 0.5),
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          bgcolor: "#faf7f3",
          border: "1px solid #e7dfd5",
          boxShadow: "0 32px 80px rgba(58, 46, 34, 0.25), 0 0 0 1px rgba(255,255,255,0.1)",
          overflow: "hidden",
          maxHeight: "85vh",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e7dfd5",
          background: "linear-gradient(135deg, #f0e6d8 0%, #f8f0e6 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
              boxShadow: "0 4px 12px rgba(92, 61, 46, 0.3)",
            }}
          >
            <CloudSyncRoundedIcon sx={{ color: "#fff8f0", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#2e261f", letterSpacing: "-0.02em" }}>
              Settings
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#8a7d70", fontWeight: 500 }}>
              Cloud Sync & Auto-Save · Ctrl+H
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6a6054", "&:hover": { bgcolor: alpha("#8f7d66", 0.12) } }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* ─── PIN Section ─── */}
          <Box sx={sectionSx}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <KeyRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>Sync PIN</Typography>
              {pin && (
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    ml: "auto",
                    bgcolor: alpha("#10b981", 0.12),
                    color: "#059669",
                    fontWeight: 700,
                    fontSize: 10.5,
                    height: 22,
                  }}
                />
              )}
            </Stack>

            <Typography sx={{ fontSize: 12, color: "#6a6054", mb: 2, lineHeight: 1.6 }}>
              {pinMode === "create"
                ? "Create a unique PIN to sync your notes across devices. Remember this PIN — it's your only key."
                : "Enter your existing PIN to connect to your cloud data and sync your notes."}
            </Typography>

            <Stack direction="row" spacing={1} mb={2}>
              <Button
                variant={pinMode === "create" ? "contained" : "outlined"}
                size="small"
                onClick={() => setPinMode("create")}
                sx={{
                  flex: 1,
                  fontSize: 11,
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: pinMode === "create" ? "#5c3d2e" : "transparent",
                  borderColor: "#5c3d2e",
                  color: pinMode === "create" ? "#fff" : "#5c3d2e",
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
                  flex: 1,
                  fontSize: 11,
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: pinMode === "existing" ? "#5c3d2e" : "transparent",
                  borderColor: "#5c3d2e",
                  color: pinMode === "existing" ? "#fff" : "#5c3d2e",
                  "&:hover": { bgcolor: pinMode === "existing" ? "#7a5240" : alpha("#5c3d2e", 0.05) },
                }}
              >
                Existing PIN
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="Enter PIN (min 4 chars)..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                type={showPin ? "text" : "password"}
                InputProps={{
                  sx: {
                    borderRadius: 3,
                    fontSize: 14,
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    bgcolor: "#fff",
                  },
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
                <IconButton
                  onClick={handleGeneratePin}
                  sx={{
                    bgcolor: alpha("#8b5e3c", 0.1),
                    "&:hover": { bgcolor: alpha("#8b5e3c", 0.18) },
                  }}
                >
                  <ShuffleRoundedIcon sx={{ fontSize: 18, color: "#8b5e3c" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy PIN" arrow slotProps={tooltipSlotProps}>
                <IconButton
                  onClick={handleCopyPin}
                  sx={{
                    bgcolor: alpha("#8b5e3c", 0.1),
                    "&:hover": { bgcolor: alpha("#8b5e3c", 0.18) },
                  }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 18, color: "#8b5e3c" }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSavePin}
              sx={{
                mt: 1.5,
                borderRadius: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                bgcolor: "#5c3d2e",
                "&:hover": { bgcolor: "#7a5240" },
                boxShadow: "0 4px 14px rgba(92, 61, 46, 0.25)",
              }}
            >
              {pinMode === "create" ? "Create & Save PIN" : "Connect PIN"}
            </Button>
          </Box>

          {/* ─── Auto Save Section ─── */}
          <Box sx={sectionSx}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <TimerRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>Auto-Save to Cloud</Typography>
              <Box sx={{ ml: "auto" }}>
                <Switch
                  checked={autoSyncEnabled}
                  onChange={(e) => handleAutoSyncChange(e.target.checked)}
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#8b5e3c" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#c4956a" },
                  }}
                />
              </Box>
            </Stack>

            <Typography sx={{ fontSize: 12, color: "#6a6054", mb: 2, lineHeight: 1.6 }}>
              Automatically push your notes to the cloud at a fixed interval. Data is always stored locally first, then synced to DB.
            </Typography>

            <FormControl fullWidth size="small" disabled={!autoSyncEnabled}>
              <InputLabel sx={{ fontSize: 13 }}>Sync Interval</InputLabel>
              <Select
                value={autoSyncInterval}
                label="Sync Interval"
                onChange={(e) => handleIntervalChange(e.target.value)}
                sx={{ borderRadius: 3, bgcolor: "#fff", fontSize: 13 }}
              >
                {AUTO_SAVE_INTERVALS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {autoSyncEnabled && autoSyncInterval > 0 && (
              <Typography sx={{ fontSize: 11, color: "#8a7d70", mt: 1.2, fontStyle: "italic" }}>
                Notes will auto-sync every {AUTO_SAVE_INTERVALS.find((i) => i.value === autoSyncInterval)?.label || "—"}.
              </Typography>
            )}
          </Box>

          {/* ─── Manual Sync Section ─── */}
          <Box sx={sectionSx}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <StorageRoundedIcon sx={{ fontSize: 20, color: "#8b5e3c" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e261f" }}>Manual Sync</Typography>
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SyncRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={handleSyncToCloud}
                disabled={syncStatus === "syncing" || !pin}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 12.5,
                  borderColor: "#d9cab7",
                  color: "#5c3d2e",
                  "&:hover": { borderColor: "#c4956a", bgcolor: alpha("#c4956a", 0.06) },
                }}
              >
                Push to Cloud
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={handlePullFromCloud}
                disabled={syncStatus === "syncing" || !pin}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 12.5,
                  borderColor: "#d9cab7",
                  color: "#5c3d2e",
                  "&:hover": { borderColor: "#c4956a", bgcolor: alpha("#c4956a", 0.06) },
                }}
              >
                Pull from Cloud
              </Button>
            </Stack>

            {/* Status message */}
            {syncMessage && (
              <Box
                sx={{
                  mt: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2.5,
                  bgcolor: syncStatus === "error" ? alpha("#ef4444", 0.08) : syncStatus === "success" ? alpha("#10b981", 0.08) : alpha("#3b82f6", 0.08),
                  border: "1px solid",
                  borderColor: syncStatus === "error" ? alpha("#ef4444", 0.2) : syncStatus === "success" ? alpha("#10b981", 0.2) : alpha("#3b82f6", 0.2),
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {syncStatus === "success" && <CloudDoneRoundedIcon sx={{ fontSize: 16, color: "#059669" }} />}
                {syncStatus === "error" && <CloudOffRoundedIcon sx={{ fontSize: 16, color: "#ef4444" }} />}
                {syncStatus === "syncing" && <SyncRoundedIcon sx={{ fontSize: 16, color: "#3b82f6", animation: "spin 1s linear infinite", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />}
                <Typography sx={{ fontSize: 12, color: syncStatus === "error" ? "#dc2626" : syncStatus === "success" ? "#059669" : "#3b82f6", fontWeight: 600 }}>
                  {syncMessage}
                </Typography>
              </Box>
            )}

            {lastSyncAt && (
              <Typography sx={{ fontSize: 11, color: "#8a7d70", mt: 1.2 }}>
                Last synced: {new Date(lastSyncAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          {/* ─── Info ─── */}
          <Box sx={{ px: 1 }}>
            <Typography sx={{ fontSize: 11, color: "#9a8d7f", lineHeight: 1.6 }}>
              📌 <strong>Important:</strong> Your PIN is stored locally. If you lose it, you won't be able to access your cloud data. Images are stored locally only and are not synced to the cloud.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
