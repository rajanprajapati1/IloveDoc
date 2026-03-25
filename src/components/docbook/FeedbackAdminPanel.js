"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputBase,
  LinearProgress,
  Stack,
  Typography,
  Fade,
  Collapse,
  TextField,
  Select,
  MenuItem,
  Tooltip,
  Badge,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DesignServicesRoundedIcon from "@mui/icons-material/DesignServicesRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";

/* ─── Constants ─── */
const CATEGORY_META = {
  all: { label: "All", icon: <InboxRoundedIcon sx={{ fontSize: 18 }} />, color: "#5f6368" },
  bug: { label: "Bug", icon: <BugReportRoundedIcon sx={{ fontSize: 18 }} />, color: "#d93025" },
  feature: { label: "Feature", icon: <LightbulbRoundedIcon sx={{ fontSize: 18 }} />, color: "#1a73e8" },
  general: { label: "General", icon: <ForumRoundedIcon sx={{ fontSize: 18 }} />, color: "#188038" },
  ui: { label: "UI / UX", icon: <DesignServicesRoundedIcon sx={{ fontSize: 18 }} />, color: "#a142f4" },
};

const TIME_FILTERS = {
  all: { label: "All Time", icon: <InboxRoundedIcon sx={{ fontSize: 17 }} /> },
  today: { label: "Today", icon: <TodayRoundedIcon sx={{ fontSize: 17 }} /> },
  yesterday: { label: "Yesterday", icon: <ScheduleRoundedIcon sx={{ fontSize: 17 }} /> },
  week: { label: "This Week", icon: <DashboardRoundedIcon sx={{ fontSize: 17 }} /> },
};

const RATING_LABELS = { 1: "Terrible", 2: "Bad", 3: "Okay", 4: "Good", 5: "Amazing" };

const RATING_COLORS = {
  1: { bg: "#fce8e6", text: "#c5221f", border: "#f5c6c2" },
  2: { bg: "#fef7e0", text: "#e37400", border: "#fde293" },
  3: { bg: "#fef7e0", text: "#e37400", border: "#fde293" },
  4: { bg: "#e6f4ea", text: "#137333", border: "#a8dab5" },
  5: { bg: "#e8f0fe", text: "#1967d2", border: "#a8c7fa" },
};

/* ─── Utilities ─── */
function formatDateTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDateTime(value);
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isYesterday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

/* ─── PIN Screen ─── */
function PinScreen({ onVerify }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (pin.trim().toLowerCase() === "rajan") {
      onVerify();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8f9fa",
        animation: "pinFadeIn 400ms ease-out",
        "@keyframes pinFadeIn": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
      }}
    >
      <Box
        sx={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 30% 40%, rgba(26,115,232,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(161,66,244,0.04) 0%, transparent 50%)",
        }}
      />

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: 380,
          width: "100%",
          px: 3,
          animation: shake ? "pinShake 400ms ease-in-out" : "pinSlideUp 500ms cubic-bezier(0.16,1,0.3,1)",
          "@keyframes pinSlideUp": {
            "0%": { opacity: 0, transform: "translateY(24px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          "@keyframes pinShake": {
            "0%, 100%": { transform: "translateX(0)" },
            "20%, 60%": { transform: "translateX(-8px)" },
            "40%, 80%": { transform: "translateX(8px)" },
          },
        }}
      >
        <Box
          sx={{
            width: 56, height: 56, borderRadius: "16px", mx: "auto", mb: 3,
            background: "linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)",
            display: "grid", placeItems: "center",
            boxShadow: "0 8px 32px rgba(26,115,232,0.24)",
          }}
        >
          <LockRoundedIcon sx={{ fontSize: 26, color: "#fff" }} />
        </Box>

        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#202124", letterSpacing: "-0.02em", mb: 0.5 }}>
          Bug Review
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#5f6368", mb: 3, lineHeight: 1.5 }}>
          Enter your admin PIN to access the feedback dashboard
        </Typography>

        <Box
          sx={{
            display: "flex", alignItems: "center",
            bgcolor: "#fff", borderRadius: "12px",
            border: `2px solid ${error ? "#d93025" : "#dadce0"}`,
            px: 2, height: 52,
            transition: "border-color 200ms, box-shadow 200ms",
            "&:focus-within": {
              borderColor: error ? "#d93025" : "#1a73e8",
              boxShadow: error ? "0 0 0 4px rgba(217,48,37,0.1)" : "0 0 0 4px rgba(26,115,232,0.12)",
            },
          }}
        >
          <InputBase
            inputRef={inputRef}
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            sx={{
              flex: 1, fontSize: 16, fontWeight: 500,
              letterSpacing: "0.08em",
              "& input::placeholder": { letterSpacing: "0em", fontWeight: 400, color: "#9aa0a6" },
            }}
          />
        </Box>

        <Collapse in={error}>
          <Typography sx={{ fontSize: 12, color: "#d93025", fontWeight: 500, mt: 1 }}>
            Incorrect PIN. Please try again.
          </Typography>
        </Collapse>

        <Button
          onClick={handleSubmit}
          disabled={!pin.trim()}
          disableElevation
          fullWidth
          sx={{
            mt: 2.5, height: 46, borderRadius: "12px",
            bgcolor: "#1a73e8", color: "#fff",
            fontSize: 14, fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: "#1557b0" },
            "&.Mui-disabled": { bgcolor: "#e8eaed", color: "#9aa0a6" },
          }}
        >
          Unlock Dashboard
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Add Bug Modal ─── */
function AddBugInline({ onAdd, onCancel }) {
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("bug");
  const [rating, setRating] = useState(3);

  return (
    <Box sx={{
      p: 2.5, borderRadius: "16px", bgcolor: "#fff",
      border: "2px solid #1a73e8",
      boxShadow: "0 4px 24px rgba(26,115,232,0.12)",
      mb: 2,
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1a73e8", mb: 1.5, letterSpacing: "0.02em" }}>
        New Feedback Entry
      </Typography>
      <TextField
        multiline rows={3} fullWidth
        placeholder="Describe the bug or suggestion..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        variant="outlined"
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px", fontSize: 13,
            "& fieldset": { borderColor: "#e0e0e0" },
            "&:hover fieldset": { borderColor: "#1a73e8" },
            "&.Mui-focused fieldset": { borderColor: "#1a73e8", borderWidth: 1.5 },
          },
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Select
          size="small" value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{
            minWidth: 110, fontSize: 12, fontWeight: 600, borderRadius: "8px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
          }}
        >
          <MenuItem value="bug">🐛 Bug</MenuItem>
          <MenuItem value="feature">💡 Feature</MenuItem>
          <MenuItem value="general">💬 General</MenuItem>
          <MenuItem value="ui">🎨 UI / UX</MenuItem>
        </Select>

        <Stack direction="row" spacing={0.3} alignItems="center">
          {[1, 2, 3, 4, 5].map((r) => (
            <IconButton
              key={r} size="small"
              onClick={() => setRating(r)}
              sx={{ p: 0.3 }}
            >
              <StarRoundedIcon sx={{ fontSize: 18, color: r <= rating ? "#fbbc04" : "#dadce0" }} />
            </IconButton>
          ))}
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Button
          size="small" onClick={onCancel}
          sx={{
            borderRadius: "8px", fontSize: 12, fontWeight: 600,
            color: "#5f6368", textTransform: "none", minWidth: 60,
          }}
        >
          Cancel
        </Button>
        <Button
          size="small" variant="contained" disableElevation
          disabled={!comment.trim()}
          onClick={() => {
            onAdd({ comment: comment.trim(), category, rating });
            setComment(""); setCategory("bug"); setRating(3);
          }}
          sx={{
            borderRadius: "8px", fontSize: 12, fontWeight: 600,
            bgcolor: "#1a73e8", textTransform: "none", minWidth: 60,
            "&:hover": { bgcolor: "#1557b0" },
          }}
        >
          Add
        </Button>
      </Stack>
    </Box>
  );
}

/* ─── Feedback Card ─── */
function FeedbackCard({ item, isPinned, onTogglePin }) {
  const ratingInfo = RATING_COLORS[item.rating] || RATING_COLORS[3];
  const catMeta = CATEGORY_META[item.category] || CATEGORY_META.general;

  return (
    <Box sx={{
      p: 2, borderRadius: "14px", bgcolor: "#fff",
      border: isPinned ? "1.5px solid #fbbc04" : "1px solid #e8eaed",
      transition: "all 200ms ease",
      position: "relative",
      "&:hover": {
        borderColor: isPinned ? "#f9a825" : "#dadce0",
        boxShadow: "0 4px 16px rgba(60,64,67,0.08)",
        "& .pin-btn": { opacity: 1 },
      },
    }}>
      {/* Pin indicator */}
      {isPinned && (
        <Box sx={{
          position: "absolute", top: -1, right: 16,
          width: 20, height: 24,
          bgcolor: "#fbbc04",
          borderRadius: "0 0 4px 4px",
          display: "grid", placeItems: "center",
          boxShadow: "0 2px 4px rgba(251,188,4,0.3)",
        }}>
          <PushPinRoundedIcon sx={{ fontSize: 11, color: "#fff", transform: "rotate(45deg)" }} />
        </Box>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
        <Stack direction="row" spacing={0.7} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.7 }}>
          {/* Rating chip */}
          <Chip
            label={`${item.rating}/5 · ${RATING_LABELS[item.rating] || "Feedback"}`}
            size="small"
            sx={{
              height: 24, fontSize: 11, fontWeight: 700,
              bgcolor: ratingInfo.bg, color: ratingInfo.text,
              border: `1px solid ${ratingInfo.border}`,
              borderRadius: "6px",
            }}
          />

          {/* Category chip */}
          <Chip
            icon={<Box sx={{ display: "flex", color: catMeta.color }}>{catMeta.icon}</Box>}
            label={catMeta.label}
            size="small"
            sx={{
              height: 24, fontSize: 11, fontWeight: 600,
              bgcolor: alpha(catMeta.color, 0.08),
              color: catMeta.color,
              borderRadius: "6px",
              "& .MuiChip-icon": { ml: 0.3 },
            }}
          />
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography sx={{ fontSize: 11, color: "#9aa0a6", fontWeight: 500 }}>
            {formatRelativeTime(item.createdAt)}
          </Typography>
          <Tooltip title={isPinned ? "Unpin" : "Pin"} arrow>
            <IconButton
              className="pin-btn"
              onClick={() => onTogglePin(item._id)}
              size="small"
              sx={{
                opacity: isPinned ? 1 : 0,
                transition: "opacity 150ms",
                p: 0.4,
                color: isPinned ? "#fbbc04" : "#9aa0a6",
              }}
            >
              {isPinned
                ? <PushPinRoundedIcon sx={{ fontSize: 15 }} />
                : <PushPinOutlinedIcon sx={{ fontSize: 15 }} />
              }
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography sx={{
        fontSize: 13.5, lineHeight: 1.65, color: "#202124",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {item.comment}
      </Typography>

      {(item.email || item.page) && (
        <Stack direction="row" spacing={0.6} sx={{ mt: 1.2, flexWrap: "wrap", gap: 0.6 }}>
          {item.email && (
            <Chip
              label={item.email} size="small" variant="outlined"
              sx={{ height: 22, fontSize: 10, borderColor: "#e8eaed", color: "#5f6368", borderRadius: "5px" }}
            />
          )}
          {item.page && (
            <Chip
              label={item.page} size="small" variant="outlined"
              sx={{ height: 22, fontSize: 10, borderColor: "#e8eaed", color: "#5f6368", borderRadius: "5px" }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function FeedbackAdminPanel({ open, onClose, adminKey = "" }) {
  const [verified, setVerified] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTime, setActiveTime] = useState("all");
  const [sortNewest, setSortNewest] = useState(true);

  // Pins
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("docbook_pinned_feedback");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);

  const searchRef = useRef(null);

  /* ─── Data fetching ─── */
  const loadFeedback = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/feedback?admin=${encodeURIComponent(adminKey)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load feedback.");
      setFeedback(Array.isArray(data.feedback) ? data.feedback : []);
      setLastLoadedAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (open && verified) void loadFeedback();
  }, [open, verified, loadFeedback]);

  // Auto-verify if already opened from URL
  useEffect(() => {
    if (open && adminKey) setVerified(true);
  }, [open, adminKey]);

  /* ─── Pinning ─── */
  const togglePin = useCallback((id) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("docbook_pinned_feedback", JSON.stringify([...next]));
      return next;
    });
  }, []);

  /* ─── Add feedback ─── */
  const addFeedback = useCallback(async ({ comment, category, rating }) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, category, rating }),
      });
      if (res.ok) {
        setShowAddForm(false);
        void loadFeedback();
      }
    } catch { /* ignore */ }
  }, [loadFeedback]);

  /* ─── Computed data ─── */
  const averageRating = useMemo(() => {
    if (!feedback.length) return 0;
    return feedback.reduce((s, i) => s + (Number(i.rating) || 0), 0) / feedback.length;
  }, [feedback]);

  const categoryCounts = useMemo(() => {
    const c = { all: feedback.length, bug: 0, feature: 0, general: 0, ui: 0 };
    feedback.forEach((i) => { if (c[i.category] !== undefined) c[i.category]++; });
    return c;
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    let items = [...feedback];

    // Category
    if (activeCategory !== "all") items = items.filter((i) => i.category === activeCategory);

    // Time
    if (activeTime === "today") items = items.filter((i) => isToday(i.createdAt));
    else if (activeTime === "yesterday") items = items.filter((i) => isYesterday(i.createdAt));
    else if (activeTime === "week") items = items.filter((i) => isThisWeek(i.createdAt));

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        (i.comment || "").toLowerCase().includes(q) ||
        (i.email || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by date
    items.sort((a, b) => {
      const aPinned = pinnedIds.has(a._id) ? 1 : 0;
      const bPinned = pinnedIds.has(b._id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [feedback, activeCategory, activeTime, searchQuery, sortNewest, pinnedIds]);

  /* ─── Render ─── */
  if (!open) return null;

  if (!verified) return <PinScreen onVerify={() => { setVerified(true); }} />;

  return (
    <Box sx={{
      position: "fixed", inset: 0, zIndex: 1600,
      display: "flex", bgcolor: "#f8f9fa",
      animation: "adminFadeIn 300ms ease-out",
      "@keyframes adminFadeIn": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
    }}>

      {/* ─── SIDEBAR ─── */}
      <Box sx={{
        width: 240, borderRight: "1px solid #e8eaed",
        bgcolor: "#fff", display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Sidebar Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: "8px",
              background: "linear-gradient(135deg, #1a73e8 0%, #8ab4f8 100%)",
              display: "grid", placeItems: "center",
            }}>
              <BugReportRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#202124", letterSpacing: "-0.01em" }}>
              Bug Review
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 11, color: "#9aa0a6", fontWeight: 500, pl: 0.3, mt: 0.5 }}>
            Feedback Dashboard
          </Typography>
        </Box>

        {/* Category Filters */}
        <Box sx={{ px: 1.5, pt: 1, flex: 1, overflowY: "auto" }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 700, color: "#9aa0a6",
            textTransform: "uppercase", letterSpacing: "0.08em",
            px: 1, mb: 0.8,
          }}>
            Category
          </Typography>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const isActive = activeCategory === key;
            const count = categoryCounts[key] || 0;
            return (
              <Box
                key={key}
                onClick={() => setActiveCategory(key)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.2,
                  px: 1.2, py: 0.8, mb: 0.3,
                  borderRadius: 8, cursor: "pointer",
                  bgcolor: isActive ? alpha(meta.color, 0.08) : "transparent",
                  color: isActive ? meta.color : "#5f6368",
                  transition: "all 150ms",
                  "&:hover": { bgcolor: isActive ? alpha(meta.color, 0.12) : "#f1f3f4" },
                }}
              >
                <Box sx={{ display: "flex", color: "inherit" }}>{meta.icon}</Box>
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 500 }}>
                  {meta.label}
                </Typography>
                <Typography sx={{
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? meta.color : "#9aa0a6",
                  bgcolor: isActive ? alpha(meta.color, 0.1) : "#f1f3f4",
                  borderRadius: "6px", px: 0.7, py: 0.1, minWidth: 20,
                  textAlign: "center",
                }}>
                  {count}
                </Typography>
              </Box>
            );
          })}

          {/* Time Filters */}
          <Typography sx={{
            fontSize: 10, fontWeight: 700, color: "#9aa0a6",
            textTransform: "uppercase", letterSpacing: "0.08em",
            px: 1, mt: 2.5, mb: 0.8,
          }}>
            Time Range
          </Typography>
          {Object.entries(TIME_FILTERS).map(([key, meta]) => {
            const isActive = activeTime === key;
            return (
              <Box
                key={key}
                onClick={() => setActiveTime(key)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.2,
                  px: 1.2, py: 0.7, mb: 0.3,
                  borderRadius: 8, cursor: "pointer",
                  bgcolor: isActive ? alpha("#1a73e8", 0.08) : "transparent",
                  color: isActive ? "#1a73e8" : "#5f6368",
                  transition: "all 150ms",
                  "&:hover": { bgcolor: isActive ? alpha("#1a73e8", 0.12) : "#f1f3f4" },
                }}
              >
                <Box sx={{ display: "flex", color: "inherit" }}>{meta.icon}</Box>
                <Typography sx={{ fontSize: 13, fontWeight: isActive ? 600 : 500 }}>
                  {meta.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Sidebar Footer */}
        <Box sx={{ p: 2, borderTop: "1px solid #f1f3f4" }}>
          <Stack spacing={0.8}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: 11, color: "#9aa0a6", fontWeight: 500 }}>Total</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>{feedback.length}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: 11, color: "#9aa0a6", fontWeight: 500 }}>Avg Rating</Typography>
              <Stack direction="row" spacing={0.3} alignItems="center">
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>
                  {feedback.length ? averageRating.toFixed(1) : "—"}
                </Typography>
                <StarRoundedIcon sx={{ fontSize: 13, color: "#fbbc04" }} />
              </Stack>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: 11, color: "#9aa0a6", fontWeight: 500 }}>Pinned</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#fbbc04" }}>{pinnedIds.size}</Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ─── MAIN CONTENT ─── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top Bar */}
        <Box sx={{
          px: 3, py: 1.5,
          bgcolor: "#fff",
          borderBottom: "1px solid #e8eaed",
          display: "flex", alignItems: "center", gap: 2,
        }}>
          {/* Search Bar - Google style */}
          <Box sx={{
            flex: 1, maxWidth: 560,
            display: "flex", alignItems: "center",
            bgcolor: "#f1f3f4", borderRadius: "12px",
            px: 1.5, height: 40,
            transition: "all 200ms",
            border: "1px solid transparent",
            "&:focus-within": {
              bgcolor: "#fff",
              border: "1px solid #1a73e8",
              boxShadow: "0 2px 12px rgba(26,115,232,0.12)",
            },
          }}>
            <SearchRoundedIcon sx={{ fontSize: 20, color: "#9aa0a6", mr: 1 }} />
            <InputBase
              inputRef={searchRef}
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#202124" }}
            />
            {searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.3 }}>
                <CloseRoundedIcon sx={{ fontSize: 16, color: "#9aa0a6" }} />
              </IconButton>
            )}
          </Box>

          {/* Actions */}
          <Tooltip title={sortNewest ? "Newest first" : "Oldest first"} arrow>
            <IconButton
              onClick={() => setSortNewest(!sortNewest)}
              size="small"
              sx={{
                p: 0.8, borderRadius: "8px",
                border: "1px solid #e8eaed",
                "&:hover": { bgcolor: "#f1f3f4" },
              }}
            >
              <SortRoundedIcon sx={{ fontSize: 18, color: "#5f6368", transform: sortNewest ? "none" : "scaleY(-1)" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add feedback" arrow>
            <IconButton
              onClick={() => setShowAddForm(!showAddForm)}
              size="small"
              sx={{
                p: 0.8, borderRadius: "8px",
                bgcolor: showAddForm ? "#1a73e8" : "transparent",
                border: showAddForm ? "1px solid #1a73e8" : "1px solid #e8eaed",
                color: showAddForm ? "#fff" : "#5f6368",
                "&:hover": { bgcolor: showAddForm ? "#1557b0" : "#f1f3f4" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh" arrow>
            <IconButton
              onClick={() => void loadFeedback()}
              size="small"
              disabled={loading}
              sx={{
                p: 0.8, borderRadius: "8px",
                border: "1px solid #e8eaed",
                "&:hover": { bgcolor: "#f1f3f4" },
              }}
            >
              {loading
                ? <CircularProgress size={16} sx={{ color: "#1a73e8" }} />
                : <RefreshRoundedIcon sx={{ fontSize: 18, color: "#5f6368" }} />
              }
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          {/* Close */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              p: 0.8, borderRadius: "8px",
              border: "1px solid #e8eaed",
              "&:hover": { bgcolor: "#fce8e6", borderColor: "#f5c6c2" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18, color: "#5f6368" }} />
          </IconButton>
        </Box>

        {loading && <LinearProgress sx={{ height: 2, bgcolor: "transparent" }} />}

        {/* Content Area */}
        <Box sx={{
          flex: 1, overflowY: "auto", px: 3, py: 2,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#dadce0", borderRadius: 3 },
        }}>

          {/* Filter info bar */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#202124" }}>
              {filteredFeedback.length} result{filteredFeedback.length !== 1 ? "s" : ""}
            </Typography>

            {activeCategory !== "all" && (
              <Chip
                label={CATEGORY_META[activeCategory]?.label}
                size="small"
                onDelete={() => setActiveCategory("all")}
                sx={{
                  height: 24, fontSize: 11, fontWeight: 600,
                  bgcolor: alpha(CATEGORY_META[activeCategory]?.color || "#5f6368", 0.08),
                  color: CATEGORY_META[activeCategory]?.color || "#5f6368",
                  borderRadius: "6px",
                }}
              />
            )}

            {activeTime !== "all" && (
              <Chip
                label={TIME_FILTERS[activeTime]?.label}
                size="small"
                onDelete={() => setActiveTime("all")}
                sx={{
                  height: 24, fontSize: 11, fontWeight: 600,
                  bgcolor: alpha("#1a73e8", 0.08),
                  color: "#1a73e8",
                  borderRadius: "6px",
                }}
              />
            )}

            {searchQuery && (
              <Chip
                label={`"${searchQuery}"`}
                size="small"
                onDelete={() => setSearchQuery("")}
                sx={{
                  height: 24, fontSize: 11, fontWeight: 600,
                  bgcolor: "#f1f3f4", color: "#5f6368",
                  borderRadius: "6px",
                }}
              />
            )}

            {lastLoadedAt && (
              <Typography sx={{ fontSize: 10, color: "#9aa0a6", ml: "auto !important" }}>
                Updated {formatRelativeTime(lastLoadedAt)}
              </Typography>
            )}
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>}

          {/* Add Form */}
          <Collapse in={showAddForm}>
            <AddBugInline
              onAdd={addFeedback}
              onCancel={() => setShowAddForm(false)}
            />
          </Collapse>

          {/* Feedback List */}
          <Stack spacing={1.2}>
            {filteredFeedback.length === 0 && !loading ? (
              <Box sx={{
                py: 8, textAlign: "center",
                borderRadius: "16px",
                bgcolor: "#fff",
                border: "1px dashed #dadce0",
              }}>
                <SearchRoundedIcon sx={{ fontSize: 44, color: "#dadce0", mb: 1.5 }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#5f6368", mb: 0.5 }}>
                  No feedback found
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#9aa0a6" }}>
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Feedback submitted from the app will appear here"
                  }
                </Typography>
              </Box>
            ) : (
              filteredFeedback.map((item) => (
                <FeedbackCard
                  key={item._id}
                  item={item}
                  isPinned={pinnedIds.has(item._id)}
                  onTogglePin={togglePin}
                />
              ))
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
