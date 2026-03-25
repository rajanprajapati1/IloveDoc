"use client";

import { useEffect, useState } from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Chip } from "@mui/material";
import { formatTimeRemaining, isExpiredAt } from "@/lib/shareConstants";

export default function ShareCountdown({ expiresAt, sx }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalMs = 30000;
    const timer = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, []);

  const expired = isExpiredAt(expiresAt, nowMs);

  return (
    <Chip
      icon={expired ? <ErrorOutlineRoundedIcon /> : <AccessTimeRoundedIcon />}
      label={expired ? "Expired" : `Expires in ${formatTimeRemaining(expiresAt, nowMs)}`}
      size="small"
      sx={{
        height: 30,
        borderRadius: 999,
        fontWeight: 700,
        bgcolor: expired ? "rgba(183, 28, 28, 0.08)" : "rgba(21, 101, 192, 0.08)",
        color: expired ? "#a33131" : "#1556a8",
        "& .MuiChip-icon": {
          color: "inherit",
        },
        ...sx,
      }}
    />
  );
}
