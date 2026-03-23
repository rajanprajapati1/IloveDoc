"use client";

import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

/* ── Emoji-based satisfaction scale (Google-style) ── */
const MOODS = [
  { emoji: "😡", label: "Terrible", value: 1, color: "#ef4444" },
  { emoji: "😞", label: "Bad", value: 2, color: "#f97316" },
  { emoji: "😐", label: "Okay", value: 3, color: "#eab308" },
  { emoji: "🙂", label: "Good", value: 4, color: "#22c55e" },
  { emoji: "😍", label: "Amazing", value: 5, color: "#3b82f6" },
];

const CATEGORIES = [
  { label: "General", value: "general" },
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "UI / UX", value: "ui" },
];

export default function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [canClose, setCanClose] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setCanClose(true), 100);
      return () => clearTimeout(timer);
    } else {
      setCanClose(false);
      /* Reset after close animation finishes */
      const timer = setTimeout(() => {
        setSubmitted(false);
        setSubmitting(false);
        setError("");
        setComment("");
        setEmail("");
        setCategory("general");
        setRating(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      setError("Please select a mood and add a short message.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          email,
          category,
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit feedback.");

      setSubmitted(true);
      setTimeout(() => onClose(), 2200);
    } catch (submitError) {
      setError(submitError.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMood = MOODS.find((m) => m.value === rating);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1500,
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
        transformOrigin: "bottom right",
        transition: "opacity 220ms cubic-bezier(0.4, 0, 0.2, 1), transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <ClickAwayListener onClickAway={() => { if (open && canClose) onClose(); }}>
        <Box
          ref={panelRef}
          sx={{
            width: 380,
            maxHeight: "calc(100vh - 60px)",
            overflowY: "auto",
            borderRadius: "16px",
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ── Header ── */}
          <Box
            sx={{
              px: 2.5,
              py: 1.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: "#202124",
                letterSpacing: "-0.01em",
              }}
            >
              Send feedback
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                width: 28,
                height: 28,
                color: "#5f6368",
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* ── Body ── */}
          <Box sx={{ px: 2.5, py: 2.5 }}>
            {submitted ? (
              /* ── Success state ── */
              <Stack spacing={1.5} alignItems="center" sx={{ py: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: alpha("#34a853", 0.1),
                    display: "grid",
                    placeItems: "center",
                    animation: "popIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    "@keyframes popIn": {
                      "0%": { transform: "scale(0)" },
                      "100%": { transform: "scale(1)" },
                    },
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 32, color: "#34a853" }} />
                </Box>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#202124",
                  }}
                >
                  Thanks for your feedback!
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#5f6368", textAlign: "center", lineHeight: 1.5 }}>
                  Your input helps us improve DocBook for everyone.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                {error && (
                  <Alert
                    severity="error"
                    onClose={() => setError("")}
                    sx={{
                      borderRadius: 2,
                      fontSize: 13,
                      "& .MuiAlert-icon": { fontSize: 18 },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {/* ── Description ── */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#202124",
                      mb: 0.8,
                    }}
                  >
                    Describe your issue or share your ideas
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Tell us what's on your mind..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: "#fff",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        "& fieldset": {
                          borderColor: "rgba(0,0,0,0.12)",
                          transition: "border-color 150ms ease",
                        },
                        "&:hover fieldset": { borderColor: "rgba(0,0,0,0.24)" },
                        "&.Mui-focused fieldset": {
                          borderColor: "#1a73e8",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Box>

                {/* ── Category chips ── */}
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5f6368", mb: 0.8 }}>
                    Category
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", gap: 0.6 }}>
                    {CATEGORIES.map((cat) => (
                      <Box
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "100px",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "all 150ms ease",
                          border: "1px solid",
                          borderColor: category === cat.value ? "#1a73e8" : "rgba(0,0,0,0.12)",
                          bgcolor: category === cat.value ? alpha("#1a73e8", 0.08) : "transparent",
                          color: category === cat.value ? "#1a73e8" : "#3c4043",
                          "&:hover": {
                            bgcolor: category === cat.value ? alpha("#1a73e8", 0.12) : "rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        {cat.label}
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* ── Mood selector ── */}
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5f6368", mb: 1 }}>
                    How was your experience?
                  </Typography>
                  <Stack direction="row" spacing={0} justifyContent="space-between" sx={{ px: 1 }}>
                    {MOODS.map((mood) => (
                      <Tooltip key={mood.value} title={mood.label} placement="top" arrow>
                        <Box
                          onClick={() => setRating(mood.value)}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            fontSize: rating === mood.value ? 30 : 24,
                            cursor: "pointer",
                            transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
                            bgcolor:
                              rating === mood.value
                                ? alpha(mood.color, 0.12)
                                : "transparent",
                            boxShadow:
                              rating === mood.value
                                ? `0 0 0 2px ${alpha(mood.color, 0.3)}`
                                : "none",
                            transform: rating === mood.value ? "scale(1.01)" : "scale(1)",
                            filter: rating && rating !== mood.value ? "grayscale(0.6) opacity(0.5)" : "none",
                          }}
                        >
                          {mood.emoji}
                        </Box>
                      </Tooltip>
                    ))}
                  </Stack>
                  {selectedMood && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: selectedMood.color,
                        textAlign: "center",
                        mt: 0.8,
                        transition: "color 150ms ease",
                      }}
                    >
                      {selectedMood.label}
                    </Typography>
                  )}
                </Box>

                {/* ── Email ── */}
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      bgcolor: "#fff",
                      fontSize: 13,
                      "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
                      "&:hover fieldset": { borderColor: "rgba(0,0,0,0.24)" },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1a73e8",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Stack>
            )}
          </Box>

          {/* ── Footer ── */}
          {!submitted && (
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#9aa0a6", maxWidth: 200, lineHeight: 1.4 }}>
                Some{" "}
                <Box component="span" sx={{ color: "#1a73e8", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                  account data
                </Box>{" "}
                may be sent with your feedback.
              </Typography>
              <Button
                variant="contained"
                disableElevation
                onClick={handleSubmit}
                disabled={submitting || !rating || !comment.trim()}
                startIcon={
                  submitting ? (
                    <CircularProgress size={14} sx={{ color: "#fff" }} />
                  ) : (
                    <SendRoundedIcon sx={{ fontSize: 15 }} />
                  )
                }
                sx={{
                  borderRadius: "100px",
                  px: 2.5,
                  py: 0.7,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  bgcolor: "#1a73e8",
                  color: "#fff",
                  minWidth: 90,
                  "&:hover": { bgcolor: "#1765cc" },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(0,0,0,0.08)",
                    color: "rgba(0,0,0,0.26)",
                  },
                }}
              >
                {submitting ? "Sending..." : "Send"}
              </Button>
            </Box>
          )}
        </Box>
      </ClickAwayListener>
    </Box>
  );
}
