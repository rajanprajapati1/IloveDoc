"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  FormControl,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { buildId } from "./shared";

const DEFAULT_PEOPLE = [
  { id: "user-1", name: "Aarav Shah", handle: "aarav", role: "Product owner", accent: "#f97316", icon: "Person" },
  { id: "user-2", name: "Nina Kapoor", handle: "nina", role: "Design lead", accent: "#ef4444", icon: "Person" },
  { id: "user-3", name: "Rohan Mehta", handle: "rohan", role: "Frontend engineer", accent: "#2563eb", icon: "Person" },
  { id: "user-4", name: "Sara Iyer", handle: "sara", role: "QA reviewer", accent: "#14b8a6", icon: "Person" },
];

const DEFAULT_FOLDERS = [
  { id: "folder-1", name: "src", path: "src", description: "Main source files", accent: "#8b5cf6", icon: "Folder" },
  { id: "folder-2", name: "src/components/docbook", path: "src/components/docbook", description: "Editor and sidebar UI", accent: "#0f766e", icon: "Folder" },
  { id: "folder-3", name: "src/app", path: "src/app", description: "Routes and app shell", accent: "#b45309", icon: "Folder" },
  { id: "folder-4", name: "docs", path: "docs", description: "Project documentation", accent: "#1d4ed8", icon: "Folder" },
  { id: "folder-5", name: "public", path: "public", description: "Static assets", accent: "#be185d", icon: "Folder" },
];

const ACCENT_COLORS = [
  "#f97316", "#ef4444", "#2563eb", "#14b8a6", "#8b5cf6",
  "#0f766e", "#b45309", "#1d4ed8", "#be185d", "#d97706",
  "#059669", "#7c3aed", "#dc2626", "#0284c7", "#4f46e5",
];

const SELECTION_COLORS = [
  "#b3e5fc", "#c8e6c9", "#ffcc80", "#f8bbd0", "#d1c4e9", "#c4956a", "#e0e0e0"
];

/* ── Full animated emoji pool (using Fluent Emoji Animated from CDN) ── */
const BASE = "https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/main/assets";

const ALL_EMOJIS = [
  { code: "😍", label: "Heart Eyes", animated: `${BASE}/Smiling%20face%20with%20heart-eyes/animated/smiling_face_with_heart-eyes_animated.png` },
  { code: "🔥", label: "Fire", animated: `${BASE}/Fire/animated/fire_animated.png` },
  { code: "💩", label: "Poop", animated: `${BASE}/Pile%20of%20poo/animated/pile_of_poo_animated.png` },
  { code: "🐽", label: "Pig", animated: `${BASE}/Pig%20nose/animated/pig_nose_animated.png` },
  { code: "👀", label: "Eyes", animated: `${BASE}/Eyes/animated/eyes_animated.png` },
  { code: "🎉", label: "Party", animated: `${BASE}/Party%20popper/animated/party_popper_animated.png` },
  { code: "❤️", label: "Red Heart", animated: `${BASE}/Red%20heart/animated/red_heart_animated.png` },
  { code: "👍", label: "Thumbs Up", animated: `${BASE}/Thumbs%20up/Default/animated/thumbs_up_animated_default.png` },
  { code: "👎", label: "Thumbs Down", animated: `${BASE}/Thumbs%20down/Default/animated/thumbs_down_animated_default.png` },
  { code: "😂", label: "Crying Laughing", animated: `${BASE}/Face%20with%20tears%20of%20joy/animated/face_with_tears_of_joy_animated.png` },
  { code: "🤔", label: "Thinking", animated: `${BASE}/Thinking%20face/animated/thinking_face_animated.png` },
  { code: "🚀", label: "Rocket", animated: `${BASE}/Rocket/animated/rocket_animated.png` },
  { code: "⭐", label: "Star", animated: `${BASE}/Star/animated/star_animated.png` },
  { code: "💯", label: "100", animated: `${BASE}/Hundred%20points/animated/hundred_points_animated.png` },
  { code: "🐒", label: "Monkey", animated: `${BASE}/Monkey/animated/monkey_animated.png` },
  { code: "🦊", label: "Fox", animated: `${BASE}/Fox/animated/fox_animated.png` },
  { code: "🦀", label: "Crab", animated: `${BASE}/Crab/animated/crab_animated.png` },
  { code: "🌀", label: "Cyclone", animated: `${BASE}/Cyclone/animated/cyclone_animated.png` },
  { code: "😊", label: "Smiling", animated: `${BASE}/Smiling%20face%20with%20smiling%20eyes/animated/smiling_face_with_smiling_eyes_animated.png` },
  { code: "🥳", label: "Partying", animated: `${BASE}/Partying%20face/animated/partying_face_animated.png` },
];


export const DEFAULT_SELECTED_EMOJIS = ["😍", "🔥", "👍", "🎉", "🚀", "❤️"];

const AUTO_SAVE_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3600 },
];

export { DEFAULT_PEOPLE, DEFAULT_FOLDERS, ALL_EMOJIS };

export function loadCustomPeople() {
  try {
    const stored = localStorage.getItem("docbook_custom_people");
    if (stored) return JSON.parse(stored);
  } catch { }
  return DEFAULT_PEOPLE;
}

export function loadCustomFolders() {
  try {
    const stored = localStorage.getItem("docbook_custom_folders");
    if (stored) return JSON.parse(stored);
  } catch { }
  return DEFAULT_FOLDERS;
}

export function loadCustomEmojis() {
  try {
    const stored = localStorage.getItem("docbook_custom_emojis");
    if (stored) return JSON.parse(stored);
  } catch { }
  return DEFAULT_SELECTED_EMOJIS;
}

export function loadNoteReactions() {
  try {
    const stored = localStorage.getItem("docbook_note_reactions");
    if (stored) return JSON.parse(stored);
  } catch { }
  return {};
}

export function loadAppearanceSettings() {
  try {
    const stored = localStorage.getItem("docbook_appearance_settings");
    if (stored) return JSON.parse(stored);
  } catch { }
  return {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 16,
    selectionColor: "#b3e5fc",
    iconVariant: "Rounded",
  };
}

function generateRandomPin() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 8; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

export default function CustomizationPanel({ open, onClose, notes, onImportNotes, people, folders, selectedEmojis, onPeopleChange, onFoldersChange, onEmojisChange }) {
  /* State */
  const [localPeople, setLocalPeople] = useState(people || DEFAULT_PEOPLE);
  const [localFolders, setLocalFolders] = useState(folders || DEFAULT_FOLDERS);
  const [localEmojis, setLocalEmojis] = useState(selectedEmojis || DEFAULT_SELECTED_EMOJIS);
  const [appearance, setAppearance] = useState(loadAppearanceSettings());
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(300);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [pinMode, setPinMode] = useState("existing");

  useEffect(() => {
    if (open) {
      setLocalPeople(people || loadCustomPeople());
      setLocalFolders(folders || loadCustomFolders());
      setLocalEmojis(selectedEmojis || loadCustomEmojis());
      setAppearance(loadAppearanceSettings());
      try {
        const stored = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}");
        if (stored.pin) { setPin(stored.pin); setPinInput(stored.pin); }
        if (stored.autoSyncEnabled !== undefined) setAutoSyncEnabled(stored.autoSyncEnabled);
        if (stored.autoSyncInterval !== undefined) setAutoSyncInterval(stored.autoSyncInterval);
      } catch { }
    }
  }, [open, people, folders, selectedEmojis]);

  const savePeople = useCallback((next) => { setLocalPeople(next); localStorage.setItem("docbook_custom_people", JSON.stringify(next)); onPeopleChange?.(next); }, [onPeopleChange]);
  const saveFolders = useCallback((next) => { setLocalFolders(next); localStorage.setItem("docbook_custom_folders", JSON.stringify(next)); onFoldersChange?.(next); }, [onFoldersChange]);
  const saveEmojis = useCallback((next) => { setLocalEmojis(next); localStorage.setItem("docbook_custom_emojis", JSON.stringify(next)); onEmojisChange?.(next); }, [onEmojisChange]);
  const saveAppearance = useCallback((updates) => { const next = { ...appearance, ...updates }; setAppearance(next); localStorage.setItem("docbook_appearance_settings", JSON.stringify(next)); window.dispatchEvent(new Event("docbook-appearance-changed")); }, [appearance]);
  const saveSyncSettings = useCallback((updates = {}) => { const current = JSON.parse(localStorage.getItem("docbook_sync_settings") || "{}"); const next = { ...current, ...updates }; localStorage.setItem("docbook_sync_settings", JSON.stringify(next)); window.dispatchEvent(new Event("docbook-sync-settings-changed")); }, []);

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

  const handleCreatePin = () => setPinInput(generateRandomPin());

  const handleSavePin = async () => {
    const trimmed = pinInput.trim();
    if (!trimmed || trimmed.length < 4) {
      setSyncMessage("PIN must be at least 4 chars.");
      setTimeout(() => setSyncMessage(""), 2000);
      return;
    }
    setPin(trimmed);
    saveSyncSettings({ pin: trimmed });
    setSyncMessage("PIN Saved.");
    setTimeout(() => setSyncMessage(""), 2000);
  };

  /* Compact Design Specs */
  const bentoCardSx = {
    p: 2,
    borderRadius: 4,
    bgcolor: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  };

  const fieldSx = {
    flex: 1,
    fontSize: 12,
    px: 1.2,
    py: 0.5,
    borderRadius: 2,
    bgcolor: "#f8fafc",
    border: "1px solid transparent",
    color: "#0f172a",
    transition: "all 150ms ease",
    "&:focus-within": { borderColor: "#0071e3", bgcolor: "#fff", boxShadow: "0 0 0 2px rgba(0,113,227,0.15)" },
    "& input": { p: 0, fontSize: 12 },
    "& input::placeholder": { color: "#94a3b8", fontSize: 11 },
  };

  const cardTitleSx = { fontSize: 14, fontWeight: 700, mb: 0.2, color: "#1d1d1f", letterSpacing: "-0.01em" };
  const cardSubtitleSx = { fontSize: 11.5, color: "#86868b", mb: 2 };

  const labelSx = { fontSize: 11.5, fontWeight: 600, mb: 0.8, color: "#1d1d1f" };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          bgcolor: "#f5f5f7",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          overflow: "hidden",
          my: 3, mx: { xs: 2, md: "auto" },
        },
      }}
    >
      <Box sx={{ flex: 1, p: { xs: 2, md: 2.5 } }}>
        <Grid container spacing={2}>

          {/* Appearance Card */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={bentoCardSx}>
              <Typography sx={cardTitleSx}>Appearance</Typography>
              <Typography sx={cardSubtitleSx}>Themes & fonts</Typography>

              <Stack spacing={2} sx={{ flex: 1 }}>
                <Box>
                  <Typography sx={labelSx}>Font Family</Typography>
                  <FormControl fullWidth size="small">
                    <Select value={appearance.fontFamily} onChange={(e) => saveAppearance({ fontFamily: e.target.value })} sx={{ fontSize: 12, bgcolor: "#f8fafc", borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" }}>
                      <MenuItem sx={{ fontSize: 12 }} value="Inter, system-ui, sans-serif">Inter</MenuItem>
                      <MenuItem sx={{ fontSize: 12 }} value="Roboto, sans-serif">Roboto</MenuItem>
                      <MenuItem sx={{ fontSize: 12 }} value="Merriweather, serif">Serif</MenuItem>
                      <MenuItem sx={{ fontSize: 12 }} value="'Fira Code', monospace">Mono</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Typography sx={labelSx}>Size: {appearance.fontSize}px</Typography>
                  <Slider size="small" value={appearance.fontSize} onChange={(_, val) => saveAppearance({ fontSize: val })} step={1} min={12} max={22} marks sx={{ color: "#0071e3", py: 0.5, "& .MuiSlider-thumb": { width: 16, height: 16 } }} />
                </Box>
                <Box>
                  <Typography sx={labelSx}>Selection Highlight Color</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {SELECTION_COLORS.map((c) => (
                      <Box key={c} component="button" onClick={() => saveAppearance({ selectionColor: c })} sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: c, border: appearance.selectionColor === c ? "none" : "1px solid rgba(0,0,0,0.1)", cursor: "pointer", boxShadow: appearance.selectionColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none" }} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Emojis Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={bentoCardSx}>
              <Typography sx={cardTitleSx}>Reactions</Typography>
              <Typography sx={cardSubtitleSx}>Select up to 6 quick emojis</Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
                <Box>
                  <Stack direction="row" spacing={1} mb={1.5}>
                    {localEmojis.map(code => {
                      const emojiDef = ALL_EMOJIS.find(e => e.code === code);
                      return (
                        <Box key={code} onClick={() => toggleEmoji(code)} sx={{ fontSize: 20, cursor: "pointer", bgcolor: "#eff6ff", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 2, border: "1.5px solid #0071e3" }}>
                          {emojiDef?.animated ? (
                            <Box component="img" src={emojiDef.animated} alt={emojiDef.label || code} sx={{ width: 22, height: 22, objectFit: "contain" }} />
                          ) : (
                            code
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
                  <Typography sx={labelSx}>Library</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {ALL_EMOJIS.map(e => (
                      <Box key={e.code} onClick={() => toggleEmoji(e.code)} sx={{ fontSize: 18, cursor: "pointer", width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: localEmojis.includes(e.code) ? alpha("#0071e3", 0.1) : "transparent", "&:hover": { bgcolor: alpha("#0071e3", 0.05) } }}>
                        {e.animated ? (
                           <Box component="img" src={e.animated} alt={e.label} sx={{ width: 20, height: 20, objectFit: "contain" }} />
                        ) : (
                          e.code
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Sync & Backup SIDE-BY-SIDE */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={bentoCardSx}>
              <Typography sx={cardTitleSx}>Sync & Backup</Typography>
              <Typography sx={cardSubtitleSx}>Data protection and transfers</Typography>

              <Stack direction="row" spacing={2.5} sx={{ mt: 0.5, flex: 1 }}>
                {/* PIN & Sync */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography sx={labelSx}>Access PIN</Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" fullWidth value={pinInput} onChange={(e) => setPinInput(e.target.value.toUpperCase())} placeholder="Set PIN..." InputProps={{ sx: { borderRadius: 2, bgcolor: "#f8fafc", fontSize: 12, height: 32, "& fieldset": { border: "none" }, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" } }} />
                      <Button variant="contained" onClick={handleSavePin} disableElevation sx={{ minWidth: 50, px: 1, bgcolor: "#0071e3", fontSize: 11, borderRadius: 2, height: 32, textTransform: "none", fontWeight: 600 }}>Save</Button>
                    </Stack>
                    {syncMessage && <Typography sx={{ mt: 0.5, fontSize: 11, color: "#10b981", fontWeight: 600 }}>{syncMessage}</Typography>}
                  </Box>
                  <Box sx={{ pt: 1.5, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography sx={labelSx} mb={0}>Auto-Save</Typography>
                      <Switch size="small" checked={autoSyncEnabled} onChange={(e) => { setAutoSyncEnabled(e.target.checked); saveSyncSettings({ autoSyncEnabled: e.target.checked }); }} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#0071e3" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#60a5fa" } }} />
                    </Stack>
                    {autoSyncEnabled && (
                      <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                        <Select value={autoSyncInterval} onChange={(e) => { setAutoSyncInterval(e.target.value); saveSyncSettings({ autoSyncInterval: e.target.value }); }} sx={{ fontSize: 11, bgcolor: "#f8fafc", borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, height: 30, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" }}>
                          {AUTO_SAVE_INTERVALS.map(opt => <MenuItem sx={{ fontSize: 11 }} key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>

                {/* Export / Import */}
                <Box sx={{ flex: 1, borderLeft: "1px solid rgba(0,0,0,0.06)", pl: 2.5, display: "flex", flexDirection: "column", gap: 1.5, justifyContent: "center" }}>
                  <Typography sx={labelSx}>Local Backup</Typography>
                  <Button variant="contained" onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
                    const dNode = document.createElement("a");
                    dNode.setAttribute("href", dataStr);
                    dNode.setAttribute("download", `docbook-backup-${new Date().toISOString().slice(0, 10)}.json`);
                    document.body.appendChild(dNode); dNode.click(); dNode.remove();
                  }} disableElevation sx={{ py: 1, borderRadius: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, textTransform: "none", fontWeight: 600, fontSize: 12 }}>
                    Export JSON
                  </Button>
                  <Button variant="outlined" component="label" sx={{ py: 1, borderRadius: 2, borderColor: "rgba(0,0,0,0.1)", color: "#475569", textTransform: "none", fontWeight: 600, fontSize: 12, "&:hover": { bgcolor: "#f8fafc" } }}>
                    Import JSON
                    <input type="file" hidden accept=".json" onChange={onImportNotes} />
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* People Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={bentoCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                  <Typography sx={{ ...cardTitleSx, mb: 0 }}>People</Typography>
                  <Typography sx={{ ...cardSubtitleSx, mb: 0 }}>For @mentions inside the editor</Typography>
                </Box>
                <Button onClick={addPerson} variant="text" sx={{ borderRadius: 2, color: "#0071e3", fontWeight: 600, fontSize: 12, py: 0.5, px: 1, "&:hover": { bgcolor: "#eff6ff" } }}>
                  + Add Next
                </Button>
              </Stack>
              <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5, mr: -0.5 }}>
                <Stack spacing={1}>
                  {localPeople.map((person) => (
                    <Box key={person.id} sx={{ p: 1.2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid rgba(0,0,0,0.04)" }}>
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={0.8}>
                          <InputBase placeholder="Name" value={person.name} onChange={(e) => updatePerson(person.id, "name", e.target.value)} sx={fieldSx} />
                          <InputBase placeholder="@handle" value={person.handle} onChange={(e) => updatePerson(person.id, "handle", e.target.value)} sx={{ ...fieldSx, flex: 0.5 }} />
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <InputBase placeholder="Role" value={person.role} onChange={(e) => updatePerson(person.id, "role", e.target.value)} sx={fieldSx} />
                          <IconButton size="small" onClick={() => removePerson(person.id)} sx={{ color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, width: 28, height: 28, borderRadius: 1.5 }}>
                            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Stack>
                        <Stack direction="row" spacing={0.8} mt={0.2}>
                          {ACCENT_COLORS.slice(0, 10).map((c) => (
                            <Box key={c} component="button" onClick={() => updatePerson(person.id, "accent", c)} sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: c, border: person.accent === c ? "2px solid #000" : "none", cursor: "pointer", boxShadow: person.accent === c ? "0 0 0 2px #fff" : "none" }} />
                          ))}
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Grid>

          {/* Folders Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={bentoCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                  <Typography sx={{ ...cardTitleSx, mb: 0 }}>Folders</Typography>
                  <Typography sx={{ ...cardSubtitleSx, mb: 0 }}>For #mentions inside the editor</Typography>
                </Box>
                <Button onClick={addFolder} variant="text" sx={{ borderRadius: 2, color: "#0071e3", fontWeight: 600, fontSize: 12, py: 0.5, px: 1, "&:hover": { bgcolor: "#eff6ff" } }}>
                  + Add Next
                </Button>
              </Stack>
              <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5, mr: -0.5 }}>
                <Stack spacing={1}>
                  {localFolders.map((folder) => (
                    <Box key={folder.id} sx={{ p: 1.2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid rgba(0,0,0,0.04)" }}>
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={0.8}>
                          <InputBase placeholder="Name" value={folder.name} onChange={(e) => updateFolder(folder.id, "name", e.target.value)} sx={fieldSx} />
                          <InputBase placeholder="Path" value={folder.path} onChange={(e) => updateFolder(folder.id, "path", e.target.value)} sx={fieldSx} />
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <InputBase placeholder="Description" value={folder.description} onChange={(e) => updateFolder(folder.id, "description", e.target.value)} sx={fieldSx} />
                          <IconButton size="small" onClick={() => removeFolder(folder.id)} sx={{ color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, width: 28, height: 28, borderRadius: 1.5 }}>
                            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Stack>
                        <Stack direction="row" spacing={0.8} mt={0.2}>
                          {ACCENT_COLORS.slice(0, 10).map((c) => (
                            <Box key={c} component="button" onClick={() => updateFolder(folder.id, "accent", c)} sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: c, border: folder.accent === c ? "2px solid #000" : "none", cursor: "pointer", boxShadow: folder.accent === c ? "0 0 0 2px #fff" : "none" }} />
                          ))}
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Grid>

        </Grid>
      </Box>
    </Dialog>
  );
}
