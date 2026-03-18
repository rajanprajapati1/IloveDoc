"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CreateNewFolderRoundedIcon from "@mui/icons-material/CreateNewFolderRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EmojiEmotionsRoundedIcon from "@mui/icons-material/EmojiEmotionsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { tooltipSlotProps, buildId } from "./shared";

const DEFAULT_PEOPLE = [
  { id: "user-1", name: "Aarav Shah", handle: "aarav", role: "Product owner", accent: "#f97316" },
  { id: "user-2", name: "Nina Kapoor", handle: "nina", role: "Design lead", accent: "#ef4444" },
  { id: "user-3", name: "Rohan Mehta", handle: "rohan", role: "Frontend engineer", accent: "#2563eb" },
  { id: "user-4", name: "Sara Iyer", handle: "sara", role: "QA reviewer", accent: "#14b8a6" },
];

const DEFAULT_FOLDERS = [
  { id: "folder-1", name: "src", path: "src", description: "Main source files", accent: "#8b5cf6" },
  { id: "folder-2", name: "src/components/docbook", path: "src/components/docbook", description: "Editor and sidebar UI", accent: "#0f766e" },
  { id: "folder-3", name: "src/app", path: "src/app", description: "Routes and app shell", accent: "#b45309" },
  { id: "folder-4", name: "docs", path: "docs", description: "Project documentation", accent: "#1d4ed8" },
  { id: "folder-5", name: "public", path: "public", description: "Static assets", accent: "#be185d" },
];

const ACCENT_COLORS = [
  "#f97316", "#ef4444", "#2563eb", "#14b8a6", "#8b5cf6",
  "#0f766e", "#b45309", "#1d4ed8", "#be185d", "#d97706",
  "#059669", "#7c3aed", "#dc2626", "#0284c7", "#4f46e5",
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

export default function CustomizationPanel({ open, onClose, people, folders, selectedEmojis, onPeopleChange, onFoldersChange, onEmojisChange }) {
  const [tab, setTab] = useState("people");
  const [localPeople, setLocalPeople] = useState(people || DEFAULT_PEOPLE);
  const [localFolders, setLocalFolders] = useState(folders || DEFAULT_FOLDERS);
  const [localEmojis, setLocalEmojis] = useState(selectedEmojis || DEFAULT_SELECTED_EMOJIS);

  useEffect(() => {
    if (open) {
      setLocalPeople(people || DEFAULT_PEOPLE);
      setLocalFolders(folders || DEFAULT_FOLDERS);
      setLocalEmojis(selectedEmojis || DEFAULT_SELECTED_EMOJIS);
    }
  }, [open, people, folders, selectedEmojis]);

  const savePeople = useCallback((next) => {
    setLocalPeople(next);
    localStorage.setItem("docbook_custom_people", JSON.stringify(next));
    onPeopleChange?.(next);
  }, [onPeopleChange]);

  const saveFolders = useCallback((next) => {
    setLocalFolders(next);
    localStorage.setItem("docbook_custom_folders", JSON.stringify(next));
    onFoldersChange?.(next);
  }, [onFoldersChange]);

  const saveEmojis = useCallback((next) => {
    setLocalEmojis(next);
    localStorage.setItem("docbook_custom_emojis", JSON.stringify(next));
    onEmojisChange?.(next);
  }, [onEmojisChange]);

  const addPerson = () => {
    savePeople([...localPeople, { id: buildId(), name: "", handle: "", role: "", accent: ACCENT_COLORS[localPeople.length % ACCENT_COLORS.length] }]);
  };

  const updatePerson = (id, field, value) => {
    savePeople(localPeople.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePerson = (id) => {
    savePeople(localPeople.filter((p) => p.id !== id));
  };

  const addFolder = () => {
    saveFolders([...localFolders, { id: buildId(), name: "", path: "", description: "", accent: ACCENT_COLORS[localFolders.length % ACCENT_COLORS.length] }]);
  };

  const updateFolder = (id, field, value) => {
    saveFolders(localFolders.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const removeFolder = (id) => {
    saveFolders(localFolders.filter((f) => f.id !== id));
  };

  const toggleEmoji = (code) => {
    if (localEmojis.includes(code)) {
      saveEmojis(localEmojis.filter((e) => e !== code));
    } else if (localEmojis.length < 6) {
      saveEmojis([...localEmojis, code]);
    }
  };

  const sectionSx = {
    p: 2,
    borderRadius: 4,
    bgcolor: alpha("#f5efe7", 0.6),
    border: "1px solid",
    borderColor: alpha("#d9cab7", 0.5),
  };

  const fieldSx = {
    flex: 1,
    fontSize: 13,
    px: 1,
    py: 0.5,
    borderRadius: 2,
    bgcolor: "#fff",
    border: "1px solid",
    borderColor: alpha("#d9cab7", 0.6),
    "& input": { p: 0, fontSize: 13 },
    "& input::placeholder": { color: alpha("#2e261f", 0.35), fontSize: 12 },
  };

  const tabs = [
    { key: "people", label: "People", icon: <PersonAddRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "folders", label: "Folders", icon: <CreateNewFolderRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "emojis", label: "Emojis", icon: <EmojiEmotionsRoundedIcon sx={{ fontSize: 16 }} /> },
  ];

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
            <TuneRoundedIcon sx={{ color: "#fff8f0", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#2e261f", letterSpacing: "-0.02em" }}>
              Customization
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#8a7d70", fontWeight: 500 }}>
              Manage people, folders & emoji reactions
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6a6054", "&:hover": { bgcolor: alpha("#8f7d66", 0.12) } }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Tab Switcher */}
      <Stack direction="row" spacing={0} sx={{ borderBottom: "1px solid #e7dfd5" }}>
        {tabs.map((t) => (
          <Box
            key={t.key}
            component="button"
            onClick={() => setTab(t.key)}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.8,
              py: 1.3,
              border: 0,
              outline: 0,
              cursor: "pointer",
              bgcolor: tab === t.key ? alpha("#c4956a", 0.12) : "transparent",
              borderBottom: tab === t.key ? "2px solid #8b5e3c" : "2px solid transparent",
              color: tab === t.key ? "#5c3d2e" : "#8a7d70",
              fontWeight: tab === t.key ? 800 : 600,
              fontSize: 13,
              transition: "all 180ms ease",
              "&:hover": { bgcolor: alpha("#c4956a", 0.08) },
            }}
          >
            {t.icon}
            {t.label}
          </Box>
        ))}
      </Stack>

      <DialogContent sx={{ px: 3, py: 2.5, overflowY: "auto" }}>
        {/* ─── People Tab ─── */}
        {tab === "people" && (
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: 12, color: "#6a6054", lineHeight: 1.6 }}>
              Add your team members to use with <strong>@mentions</strong> in the editor. Type <code>@</code> to tag them.
            </Typography>
            {localPeople.map((person) => (
              <Box key={person.id} sx={sectionSx}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(135deg, ${person.accent} 0%, ${alpha(person.accent, 0.68)} 100%)`,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {person.name ? person.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "?"}
                    </Box>
                    <InputBase placeholder="Name" value={person.name} onChange={(e) => updatePerson(person.id, "name", e.target.value)} sx={fieldSx} />
                    <InputBase placeholder="@handle" value={person.handle} onChange={(e) => updatePerson(person.id, "handle", e.target.value)} sx={{ ...fieldSx, maxWidth: 110 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InputBase placeholder="Role" value={person.role} onChange={(e) => updatePerson(person.id, "role", e.target.value)} sx={fieldSx} />
                    <Stack direction="row" spacing={0.4} alignItems="center">
                      {ACCENT_COLORS.slice(0, 8).map((c) => (
                        <Box
                          key={c}
                          component="button"
                          onClick={() => updatePerson(person.id, "accent", c)}
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: person.accent === c ? "2px solid #fff" : "1px solid rgba(0,0,0,0.1)",
                            boxShadow: person.accent === c ? `0 0 0 1.5px ${c}` : "none",
                            bgcolor: c,
                            cursor: "pointer",
                            p: 0,
                          }}
                        />
                      ))}
                    </Stack>
                    <IconButton size="small" onClick={() => removePerson(person.id)} sx={{ color: "#c0412b", "&:hover": { bgcolor: alpha("#c0412b", 0.1) } }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
            <Button
              onClick={addPerson}
              startIcon={<PersonAddRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                color: "#5c3d2e",
                border: "1px dashed",
                borderColor: alpha("#c4956a", 0.4),
                "&:hover": { bgcolor: alpha("#c4956a", 0.08), borderColor: "#c4956a" },
              }}
            >
              Add Person
            </Button>
          </Stack>
        )}

        {/* ─── Folders Tab ─── */}
        {tab === "folders" && (
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: 12, color: "#6a6054", lineHeight: 1.6 }}>
              Add folders/paths to reference with <strong>#mentions</strong> in the editor. Type <code>#</code> to link them.
            </Typography>
            {localFolders.map((folder) => (
              <Box key={folder.id} sx={sectionSx}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(135deg, ${folder.accent} 0%, ${alpha(folder.accent, 0.68)} 100%)`,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      #
                    </Box>
                    <InputBase placeholder="Name" value={folder.name} onChange={(e) => updateFolder(folder.id, "name", e.target.value)} sx={fieldSx} />
                    <InputBase placeholder="Path (e.g. src/lib)" value={folder.path} onChange={(e) => updateFolder(folder.id, "path", e.target.value)} sx={fieldSx} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InputBase placeholder="Description" value={folder.description} onChange={(e) => updateFolder(folder.id, "description", e.target.value)} sx={fieldSx} />
                    <IconButton size="small" onClick={() => removeFolder(folder.id)} sx={{ color: "#c0412b", "&:hover": { bgcolor: alpha("#c0412b", 0.1) } }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
            <Button
              onClick={addFolder}
              startIcon={<CreateNewFolderRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                color: "#5c3d2e",
                border: "1px dashed",
                borderColor: alpha("#c4956a", 0.4),
                "&:hover": { bgcolor: alpha("#c4956a", 0.08), borderColor: "#c4956a" },
              }}
            >
              Add Folder
            </Button>
          </Stack>
        )}

        {/* ─── Emojis Tab ─── */}
        {tab === "emojis" && (
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 12, color: "#6a6054", lineHeight: 1.6 }}>
              Pick up to <strong>6 emojis</strong> for note reactions. Click an emoji to toggle it. These appear next to notes in the sidebar.
            </Typography>

            <Box sx={{ ...sectionSx, p: 1.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                Selected ({localEmojis.length}/6)
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {localEmojis.length === 0 && (
                  <Typography sx={{ fontSize: 12, color: "#9a8d7f", fontStyle: "italic" }}>No emojis selected. Pick from below.</Typography>
                )}
                {localEmojis.map((code) => {
                  const emoji = ALL_EMOJIS.find((e) => e.code === code);
                  return (
                    <Tooltip key={code} title={`Remove ${emoji?.label || code}`} arrow slotProps={tooltipSlotProps}>
                      <Box
                        component="button"
                        onClick={() => toggleEmoji(code)}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 3,
                          border: "2px solid",
                          borderColor: "#c4956a",
                          bgcolor: alpha("#c4956a", 0.12),
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          p: 0,
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                          "&:hover": { transform: "scale(1.1)", boxShadow: "0 4px 14px rgba(196, 149, 106, 0.3)" },
                        }}
                      >
                        {emoji?.animated ? (
                          <Box component="img" src={emoji.animated} alt={emoji.label} sx={{ width: 32, height: 32, objectFit: "contain" }} />
                        ) : (
                          <Typography sx={{ fontSize: 24 }}>{code}</Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>

            <Box sx={{ ...sectionSx, p: 1.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                All Emojis
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {ALL_EMOJIS.map((emoji) => {
                  const isSelected = localEmojis.includes(emoji.code);
                  return (
                    <Tooltip key={emoji.code} title={emoji.label} arrow slotProps={tooltipSlotProps}>
                      <Box
                        component="button"
                        onClick={() => toggleEmoji(emoji.code)}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          border: isSelected ? "2px solid #c4956a" : "1px solid rgba(0,0,0,0.08)",
                          bgcolor: isSelected ? alpha("#c4956a", 0.12) : alpha("#fff", 0.8),
                          display: "grid",
                          placeItems: "center",
                          cursor: localEmojis.length >= 6 && !isSelected ? "not-allowed" : "pointer",
                          opacity: localEmojis.length >= 6 && !isSelected ? 0.4 : 1,
                          p: 0,
                          transition: "all 150ms ease",
                          "&:hover": {
                            transform: localEmojis.length >= 6 && !isSelected ? "none" : "scale(1.12)",
                            boxShadow: localEmojis.length >= 6 && !isSelected ? "none" : "0 4px 14px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        {emoji.animated ? (
                          <Box component="img" src={emoji.animated} alt={emoji.label} sx={{ width: 28, height: 28, objectFit: "contain" }} />
                        ) : (
                          <Typography sx={{ fontSize: 22 }}>{emoji.code}</Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
