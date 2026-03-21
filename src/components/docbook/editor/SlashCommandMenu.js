"use client";

import { useRef, useEffect, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import KeyboardReturnRoundedIcon from "@mui/icons-material/KeyboardReturnRounded";

/* Icon lookup based on item kind or command */
const COMMAND_ICON_MAP = {
  note: StickyNote2RoundedIcon,
  date: CalendarMonthRoundedIcon,
  time: AccessTimeRoundedIcon,
  todo: CheckBoxRoundedIcon,
  map: PlaceRoundedIcon,
};

const COMMAND_ACCENT_MAP = {
  note: "#d97706",
  date: "#7c5cbf",
  time: "#3b82f6",
  todo: "#10b981",
  map: "#ef4444",
};

function getIconForItem(item) {
  if (item.kind === "command") return COMMAND_ICON_MAP[item.command] || null;
  if (item.kind === "date") return CalendarMonthRoundedIcon;
  if (item.kind === "time") return AccessTimeRoundedIcon;
  if (item.kind === "todo") return CheckBoxRoundedIcon;
  if (item.kind === "map") return PlaceRoundedIcon;
  if (item.kind === "create" || item.kind === "existing") return StickyNote2RoundedIcon;
  return null;
}

function getAccentForItem(item) {
  if (item.kind === "command") return COMMAND_ACCENT_MAP[item.command] || "#8b5e3c";
  if (item.kind === "date") return "#7c5cbf";
  if (item.kind === "time") return "#3b82f6";
  if (item.kind === "todo") return "#10b981";
  if (item.kind === "map") return "#ef4444";
  if (item.kind === "create" || item.kind === "existing") return "#d97706";
  return "#8b5e3c";
}

/**
 * Slash command floating dropdown menu with viewport-aware positioning.
 * Production-ready modern design with rounded icons and smooth UI.
 */
export default function SlashCommandMenu({
  slashMenu,
  activeSuggestions,
  applySlashSuggestion,
}) {
  const menuRef = useRef(null);
  const [flipAbove, setFlipAbove] = useState(false);
  const isVisible = slashMenu.visible && activeSuggestions.length > 0;

  useEffect(() => {
    if (!isVisible || !menuRef.current) {
      setFlipAbove(false);
      return;
    }
    const menuHeight = menuRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    setFlipAbove(slashMenu.y + menuHeight + 12 > viewportHeight);
  }, [isVisible, slashMenu.y, slashMenu.x, activeSuggestions.length]);

  const menuHeight = menuRef.current?.offsetHeight || 0;
  const computedY = flipAbove
    ? Math.max(8, slashMenu.y - 10 - 22 - menuHeight - 8)
    : slashMenu.y;
  const computedX = Math.min(slashMenu.x, Math.max(0, (typeof window !== "undefined" ? window.innerWidth : 1200) - 330));

  return (
    <Box
      ref={menuRef}
      sx={{
        position: "fixed",
        left: computedX,
        top: computedY,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(4px)",
        transformOrigin: flipAbove ? "bottom left" : "top left",
        transition: "opacity 160ms cubic-bezier(0.4,0,0.2,1), transform 160ms cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: isVisible ? "auto" : "none",
        zIndex: 1600,
        maxHeight: "calc(100vh - 24px)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          minWidth: 272,
          maxWidth: 340,
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(139, 94, 60, 0.12)",
          bgcolor: "rgba(255, 253, 248, 0.97)",
          backdropFilter: "blur(20px) saturate(1.4)",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -4px rgba(92, 61, 46, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 1.6,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(139, 94, 60, 0.08)",
          }}
        >
          <Typography
            sx={{
              fontSize: 10.5,
              fontWeight: 800,
              color: "#8a7968",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {slashMenu.title || "Commands"}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 0.7,
              py: 0.2,
              borderRadius: "6px",
              bgcolor: "rgba(139, 94, 60, 0.06)",
            }}
          >
            <KeyboardReturnRoundedIcon sx={{ fontSize: 12, color: "#9a8878" }} />
            <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: "#9a8878", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Select
            </Typography>
          </Box>
        </Box>

        {/* Items */}
        <Stack spacing={0} sx={{ py: 0.5, maxHeight: "50vh", overflowY: "auto" }}>
          {activeSuggestions.map((item, index) => {
            const Icon = getIconForItem(item);
            const accent = getAccentForItem(item);
            const isSelected = index === slashMenu.selectedIndex;

            return (
              <Box
                key={item.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySlashSuggestion(item);
                }}
                sx={{
                  px: 1.2,
                  py: 0.7,
                  mx: 0.5,
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.1,
                  bgcolor: isSelected ? alpha(accent, 0.08) : "transparent",
                  transition: "background-color 100ms ease, transform 80ms ease",
                  "&:hover": {
                    bgcolor: alpha(accent, 0.08),
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
              >
                {/* Icon circle */}
                {Icon && (
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "10px",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      bgcolor: alpha(accent, isSelected ? 0.16 : 0.1),
                      color: accent,
                      transition: "background-color 120ms ease",
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>
                )}

                {/* Text */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2a231d",
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                    }}
                    noWrap
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#8a7968",
                      lineHeight: 1.2,
                      mt: 0.1,
                    }}
                    noWrap
                  >
                    {item.description}
                  </Typography>
                </Box>

                {/* Keyboard hint for selected */}
                {isSelected && item.kind === "command" && (
                  <Box
                    sx={{
                      px: 0.6,
                      py: 0.15,
                      borderRadius: "5px",
                      bgcolor: "rgba(139, 94, 60, 0.06)",
                      border: "1px solid rgba(139, 94, 60, 0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9a8878", letterSpacing: "0.04em" }}>
                      TAB
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
