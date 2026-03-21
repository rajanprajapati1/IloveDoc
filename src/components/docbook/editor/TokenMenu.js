"use client";

import { useRef, useEffect, useState } from "react";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

/**
 * @mention and #folder floating autocomplete dropdown menu.
 * Viewport-aware: flips above cursor when near bottom of screen.
 */
export default function TokenMenu({
  tokenMenu,
  activeTokenSuggestions,
  applyTokenSuggestion,
  closeTokenMenu,
  onOpenCustomization,
}) {
  const menuRef = useRef(null);
  const [flipAbove, setFlipAbove] = useState(false);

  useEffect(() => {
    if (!tokenMenu.visible || !menuRef.current) {
      setFlipAbove(false);
      return;
    }
    const menuHeight = menuRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const MARGIN = 12;
    setFlipAbove(tokenMenu.y + menuHeight + MARGIN > viewportHeight);
  }, [tokenMenu.visible, tokenMenu.y, tokenMenu.x, activeTokenSuggestions.length]);

  const menuHeight = menuRef.current?.offsetHeight || 0;
  const computedY = flipAbove
    ? Math.max(8, tokenMenu.y - 10 - 22 - menuHeight - 8)
    : tokenMenu.y;
  const computedX = Math.min(tokenMenu.x, Math.max(0, typeof window !== "undefined" ? window.innerWidth - 350 : 1000));

  return (
    <Box
      ref={menuRef}
      sx={{
        position: "fixed",
        left: computedX,
        top: computedY,
        opacity: tokenMenu.visible ? 1 : 0,
        transform: tokenMenu.visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 140ms ease, transform 140ms ease",
        pointerEvents: tokenMenu.visible ? "auto" : "none",
        zIndex: 1600,
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          minWidth: 280,
          maxWidth: 340,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #ddd0c0",
          bgcolor: "#fdf8f1",
          boxShadow: "0 16px 34px rgba(58, 46, 34, 0.18)",
        }}
      >
        <Box
          sx={{
            px: 1.4,
            py: 1,
            borderBottom: "1px solid #ebe1d4",
            background: "linear-gradient(180deg, #fbf3e8 0%, #f7ecde 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {tokenMenu.tokenType === "mention" ? "People" : "Folders"}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {onOpenCustomization && (
              <IconButton
                size="small"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); closeTokenMenu(); onOpenCustomization(); }}
                sx={{ width: 22, height: 22, color: "#6a5a49", "&:hover": { bgcolor: alpha("#c4956a", 0.12) } }}
              >
                <TuneRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
            <Typography sx={{ color: "#6a5a49", fontSize: 14, fontWeight: 800, lineHeight: 1 }}>
              {tokenMenu.tokenType === "mention" ? "@" : "#"}
            </Typography>
          </Stack>
        </Box>
        <Stack spacing={0} sx={{ py: 0.5, maxHeight: "50vh", overflowY: "auto" }}>
          {activeTokenSuggestions.map((item, index) => (
            <Box
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                applyTokenSuggestion(item);
              }}
              sx={{
                px: tokenMenu.tokenType === "mention" ? 1.6 : 1.4,
                py: tokenMenu.tokenType === "mention" ? 1.15 : 1,
                cursor: "pointer",
                bgcolor: index === tokenMenu.selectedIndex ? alpha("#c4956a", 0.12) : "transparent",
                transition: "background-color 120ms ease",
                "&:hover": { bgcolor: alpha("#c4956a", 0.12) },
              }}
            >
              {tokenMenu.tokenType === "mention" ? (
                <Stack direction="row" spacing={1.1} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      position: "relative",
                      background: item.__isCreate
                        ? "transparent"
                        : item.__isHint
                          ? alpha("#c4956a", 0.12)
                          : `linear-gradient(135deg, ${item.accent} 0%, ${alpha(item.accent, 0.68)} 100%)`,
                      border: item.__isCreate ? "2px dashed #c4956a" : item.__isHint ? "1px dashed #c4956a" : "none",
                      color: item.__isCreate || item.__isHint ? "#c4956a" : "#fffdf8",
                      fontSize: item.__isCreate ? 20 : item.__isHint ? 12 : 13,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      boxShadow: item.__isCreate || item.__isHint ? "none" : `0 10px 20px ${alpha(item.accent, 0.26)}, inset 0 1px 0 rgba(255,255,255,0.28)`,
                      flexShrink: 0,
                      "&::after": item.__isCreate || item.__isHint ? {} : {
                        content: '""',
                        position: "absolute",
                        right: 2,
                        bottom: 2,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 0 2px rgba(253, 248, 241, 0.96)",
                      },
                    }}
                  >
                    {item.__isHint
                      ? "@"
                      : item.__isCreate
                        ? "+"
                        : item.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: item.__isCreate || item.__isHint ? "#8b5e3c" : "#2f2721", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                      {item.__isHint ? item.name : item.__isCreate ? `Create @${item.name}` : item.name}
                    </Typography>
                    {!item.__isCreate && !item.__isHint && (
                      <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.25, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: item.accent, px: 0.7, py: 0.22, borderRadius: 999, bgcolor: alpha(item.accent, 0.1), lineHeight: 1, letterSpacing: "0.01em" }}>
                          @{item.handle}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#7b6c5c", lineHeight: 1.2 }}>{item.role}</Typography>
                      </Stack>
                    )}
                    {item.__isCreate && <Typography sx={{ fontSize: 11.5, color: "#7b6c5c", lineHeight: 1.2 }}>Add as new person & insert mention</Typography>}
                    {item.__isHint && <Typography sx={{ fontSize: 11.5, color: "#7b6c5c", lineHeight: 1.2 }}>Start typing after @ to create or search a person</Typography>}
                  </Box>
                </Stack>
              ) : (
                <>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: item.__isCreate || item.__isHint ? "#8b5e3c" : "#352f29" }}>
                    {item.__isHint ? item.name : item.__isCreate ? `+ Create #${item.path}` : item.path}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#7b6c5c" }}>
                    {item.__isHint ? "Start typing after # to create or search a folder" : item.__isCreate ? "Add as new folder & insert reference" : item.description}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
