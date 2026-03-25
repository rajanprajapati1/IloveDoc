"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ShareCountdown from "./ShareCountdown";
import {
  DEFAULT_SHARE_EXPIRY_HOURS,
  SHARE_EXPIRY_OPTIONS,
  isExpiredAt,
} from "@/lib/shareConstants";

export default function ShareNoteModal({
  open,
  onClose,
  note,
  onShareSaved,
  onShareRemoved,
}) {
  const [selectedExpiryHours, setSelectedExpiryHours] = useState(DEFAULT_SHARE_EXPIRY_HOURS);
  const [shareInfo, setShareInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextShareInfo = note?.shareLink || null;
    setShareInfo(nextShareInfo);
    setSelectedExpiryHours(nextShareInfo?.durationHours || DEFAULT_SHARE_EXPIRY_HOURS);
    setError("");
    setCopied(false);
  }, [open, note?.id, note?.shareLink]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const shareIsActive = useMemo(
    () => Boolean(shareInfo?.url && !isExpiredAt(shareInfo.expiresAt)),
    [shareInfo]
  );

  const handleCreateOrUpdateShare = async () => {
    if (!note?.id) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            color: note.color,
            fontScale: note.fontScale,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          },
          shareId: shareInfo?.shareId || "",
          manageToken: shareInfo?.manageToken || "",
          expiresInHours: selectedExpiryHours,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create share link.");

      const nextShareInfo = {
        shareId: data.shareId,
        manageToken: data.manageToken,
        url: data.url,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        durationHours: selectedExpiryHours,
      };

      setShareInfo(nextShareInfo);
      onShareSaved?.(note.id, nextShareInfo);
    } catch (shareError) {
      setError(shareError.message || "Failed to create share link.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareInfo?.url) return;

    try {
      await navigator.clipboard.writeText(shareInfo.url);
      setCopied(true);
    } catch {
      setError("Could not copy the share link. Please copy it manually.");
    }
  };

  const handleRevoke = async () => {
    if (!note?.id || !shareInfo?.shareId || !shareInfo?.manageToken) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareId: shareInfo.shareId,
          manageToken: shareInfo.manageToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to revoke share link.");

      setShareInfo(null);
      onShareRemoved?.(note.id);
    } catch (revokeError) {
      setError(revokeError.message || "Failed to revoke share link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose?.();
      }}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: 5,
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,247,240,0.98) 100%)",
          border: "1px solid rgba(120, 93, 63, 0.12)",
          boxShadow: "0 30px 90px rgba(44, 31, 18, 0.18)",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.4, sm: 3 },
          py: { xs: 2.2, sm: 2.6 },
          borderBottom: "1px solid rgba(120, 93, 63, 0.08)",
          background: `linear-gradient(135deg, ${alpha(note?.color || "#F7E36D", 0.28)} 0%, rgba(255, 251, 245, 0.98) 100%)`,
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(120, 93, 63, 0.12)",
                }}
              >
                <ShareRoundedIcon sx={{ color: "#6f4d37" }} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b6b4f" }}>
                Share Note
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#2d241d", wordBreak: "break-word" }}>
              {note?.title?.trim() || "Untitled"}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.65, color: "#5f5146", maxWidth: 520 }}>
              Create a public read-only link for this note, set an expiry time, and copy it instantly.
            </Typography>
          </Box>

          <IconButton
            onClick={() => {
              if (!busy) onClose?.();
            }}
            sx={{ color: "#6f4d37", bgcolor: "rgba(255,255,255,0.72)" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2.4, sm: 3 }, py: { xs: 2.2, sm: 2.8 } }}>
        <Stack spacing={2.2}>
          {error ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          ) : null}

          <Box
            sx={{
              p: 2,
              borderRadius: 4,
              background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,242,234,0.96) 100%)",
              border: "1px solid rgba(120, 93, 63, 0.1)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b6b4f", mb: 0.6 }}>
                  Access Window
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#4a3b31", lineHeight: 1.6 }}>
                  Choose how long people can open this shared note.
                </Typography>
              </Box>
              {shareInfo?.expiresAt ? <ShareCountdown expiresAt={shareInfo.expiresAt} /> : null}
            </Stack>

            <TextField
              select
              fullWidth
              size="small"
              label="Expires after"
              value={selectedExpiryHours}
              disabled={busy}
              onChange={(event) => setSelectedExpiryHours(Number(event.target.value))}
              sx={{
                mt: 1.8,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.9)",
                },
              }}
            >
              {SHARE_EXPIRY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 4,
              background: shareIsActive
                ? "linear-gradient(180deg, rgba(239,248,255,0.96) 0%, rgba(246,250,255,0.98) 100%)"
                : "linear-gradient(180deg, rgba(255,252,246,0.96) 0%, rgba(249,243,233,0.98) 100%)",
              border: shareIsActive
                ? "1px solid rgba(21, 101, 192, 0.12)"
                : "1px solid rgba(120, 93, 63, 0.1)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <AutoAwesomeRoundedIcon sx={{ color: shareIsActive ? "#1556a8" : "#8b6b4f" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#2d241d" }}>
                {shareIsActive ? "Live share link" : shareInfo?.url ? "Share link expired" : "No live share link yet"}
              </Typography>
            </Stack>

            <TextField
              fullWidth
              size="small"
              value={shareInfo?.url || ""}
              placeholder="Create a share link to copy it here"
              InputProps={{ readOnly: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.9)",
                },
              }}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.4 }}>
              <Button
                variant="contained"
                disabled={busy}
                onClick={handleCreateOrUpdateShare}
                startIcon={<ShareRoundedIcon />}
                sx={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 999,
                  bgcolor: "#2d241d",
                  "&:hover": { bgcolor: "#1f1712" },
                }}
              >
                {shareInfo?.url ? "Refresh Share Link" : "Create Share Link"}
              </Button>

              <Button
                variant="outlined"
                disabled={!shareInfo?.url || busy}
                onClick={handleCopyLink}
                startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                sx={{ minHeight: 44, borderRadius: 999 }}
              >
                {copied ? "Copied" : "Copy Link"}
              </Button>

              <Button
                component="a"
                href={shareInfo?.url || "#"}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                disabled={!shareInfo?.url || busy}
                startIcon={<OpenInNewRoundedIcon />}
                sx={{ minHeight: 44, borderRadius: 999 }}
              >
                Open
              </Button>
            </Stack>

            {shareInfo?.createdAt ? (
              <Typography sx={{ mt: 1.2, fontSize: 12.5, color: "#6d6055" }}>
                Created {new Date(shareInfo.createdAt).toLocaleString()}
              </Typography>
            ) : null}
          </Box>

          {shareInfo?.url ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
              <Typography sx={{ fontSize: 13, color: "#6d6055", lineHeight: 1.6 }}>
                Anyone with the link can read this note until it expires.
              </Typography>
              <Button
                color="error"
                variant="text"
                disabled={busy}
                onClick={handleRevoke}
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{ borderRadius: 999, alignSelf: { xs: "flex-start", sm: "auto" } }}
              >
                Revoke Link
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
