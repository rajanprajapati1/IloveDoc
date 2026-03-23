"use client";

import { alpha } from "@mui/material/styles";
import { clamp } from "./constants";

/**
 * Returns the sx style object for the contentEditable editor area.
 * @param {number} editorFontScale - The font scale multiplier (default 1)
 */
export function getEditorSx(editorFontScale = 1) {
  return {
    position: "relative",
    zIndex: 1,
    width: "100%",
    height: "100%",
    minHeight: "100%",
    overflowY: "auto",
    outline: 0,
    p: "10px",
    pt: { xs: "56px", md: "62px" },
    background: "transparent",
    fontFamily: "inherit",
    fontSize: {
      xs: `${18 * editorFontScale}px`,
      md: `${22 * editorFontScale}px`,
    },
    lineHeight: {
      xs: clamp(1.45 - (editorFontScale - 1) * 0.08, 1.2, 1.55),
      md: clamp(1.5 - (editorFontScale - 1) * 0.08, 1.25, 1.6),
    },
    fontWeight: 500,
    letterSpacing: "-0.045em",
    color: alpha("#221f1a", 0.85),
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": { display: "none" },

    /* Warm native selection */
    "& ::selection": {
      backgroundColor: alpha("#c4956a", 0.28),
      color: "inherit",
    },
    "&::selection": {
      backgroundColor: alpha("#c4956a", 0.28),
      color: "inherit",
    },

    /* Placeholder */
    "&:empty::before": { content: "attr(data-placeholder)", color: alpha("#221f1a", 0.22), pointerEvents: "none" },

    /* Block elements */
    "& p, & div": { margin: 0, fontSize: "inherit", lineHeight: "inherit", letterSpacing: "inherit" },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      margin: "0.22em 0 0.12em",
      fontFamily: "inherit",
      color: alpha("#1f1915", 0.94),
      letterSpacing: "-0.04em",
      fontWeight: 800,
    },
    "& h1": { fontSize: "1.34em", lineHeight: 1.02 },
    "& h2": { fontSize: "1.18em", lineHeight: 1.06 },
    "& h3": { fontSize: "1.04em", lineHeight: 1.1 },
    "& h4": { fontSize: "0.94em", lineHeight: 1.14 },
    "& h5": { fontSize: "0.86em", lineHeight: 1.18 },
    "& h6": { fontSize: "0.8em", lineHeight: 1.2, letterSpacing: "-0.02em", textTransform: "uppercase" },

    /* Lists */
    "& ul, & ol": { margin: "0.18em 0", paddingLeft: "1.22em" },
    "& ul": { listStyleType: "disc" },
    "& ol": { listStyleType: "decimal" },
    "& ol[data-list-type='lower-roman']": { listStyleType: "lower-roman" },
    "& ol[data-list-type='upper-roman']": { listStyleType: "upper-roman" },
    "& ol[data-list-type='lower-alpha']": { listStyleType: "lower-alpha" },
    "& ol[data-list-type='upper-alpha']": { listStyleType: "upper-alpha" },
    "& li": { margin: "0.08em 0", lineHeight: 1.24, paddingLeft: "0.12em" },
    "& li > p, & li > div": { display: "inline" },

    /* Highlight (warm gradient pill) */
    "& span[data-highlight]": {
      display: "inline",
      borderRadius: "10px",
      paddingInline: "0.24em",
      paddingBlock: 0,
      marginInline: "0.12em",
      background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
      color: "#fff8f0",
      lineHeight: "inherit",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
      cursor: "pointer",
      transition: "all 200ms ease",
      boxShadow: "0 2px 8px rgba(139, 94, 60, 0.3)",
    },
    "& span[data-highlight]:hover": {
      background: "linear-gradient(135deg, #7a5240 0%, #a87350 100%)",
      boxShadow: "0 3px 14px rgba(139, 94, 60, 0.42)",
    },

    /* Image ref token */
    "& span[data-img-ref]": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      borderRadius: 8,
      paddingInline: "0.3em",
      paddingBlock: "0.06em",
      fontSize: "inherit",
      lineHeight: "inherit",
      background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
      color: "#fff8f0",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
      cursor: "pointer",
      boxShadow: "0 1px 6px rgba(139, 94, 60, 0.25)",
      verticalAlign: "baseline",
      transition: "transform 150ms ease, box-shadow 150ms ease",
    },
    "& span[data-img-ref]::after": {
      content: '""',
      position: "absolute",
      top: "0.08em",
      right: "0.08em",
      width: "0.2em",
      height: "0.2em",
      borderRadius: "50%",
      backgroundColor: "#22c55e",
      boxShadow: "0 0 4px rgba(34, 197, 94, 0.6)",
      pointerEvents: "none",
    },
    "& span[data-img-ref]:hover": {
      transform: "scale(1.03)",
      boxShadow: "0 2px 10px rgba(139, 94, 60, 0.4)",
    },

    /* User mention, folder ref & location chips */
    "& span[data-user-mention], & span[data-folder-ref], & span[data-location-ref]": {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.28em",
      verticalAlign: "middle",
      borderRadius: 999,
      paddingInline: "0.22em 0.34em",
      paddingBlock: "0.08em",
      marginInline: "0.04em",
      background: "rgba(255, 252, 247, 0.92)",
      border: "1px solid rgba(139, 94, 60, 0.16)",
      boxShadow: "0 8px 18px rgba(92, 61, 46, 0.12)",
      color: "#3e2f24",
      lineHeight: 1,
      userSelect: "none",
      WebkitUserSelect: "none",
      transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
    },
    "& span[data-user-mention]:hover, & span[data-folder-ref]:hover, & span[data-location-ref]:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 12px 22px rgba(92, 61, 46, 0.16)",
      borderColor: "rgba(139, 94, 60, 0.28)",
    },
    "& span[data-user-mention]": {
      gap: "0.32em",
      paddingInline: "0.2em 0.38em",
      paddingBlock: "0.12em",
      background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,244,237,0.96) 100%)",
      border: "1px solid rgba(223, 157, 108, 0.28)",
      boxShadow: "0 10px 20px rgba(223, 157, 108, 0.16), inset 0 1px 0 rgba(255,255,255,0.88)",
    },
    "& span[data-user-mention]:hover": {
      borderColor: "rgba(223, 157, 108, 0.42)",
      boxShadow: "0 14px 24px rgba(223, 157, 108, 0.2), inset 0 1px 0 rgba(255,255,255,0.92)",
    },
    "& span[data-chip-avatar='true']": {
      width: "1.8em",
      height: "1.8em",
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fffdf8",
      fontSize: "0.85em",
      fontWeight: 800,
      letterSpacing: "0.02em",
      boxShadow: "0 4px 10px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.26)",
      flexShrink: 0,
    },
    "& span[data-chip-content='true']": {
      display: "inline-flex",
      flexDirection: "column",
      justifyContent: "center",
      minWidth: 0,
      lineHeight: 1,
    },
    "& span[data-chip-primary='true']": {
      fontSize: "0.85em",
      fontWeight: 800,
      color: "#2f251e",
      lineHeight: 1.05,
      whiteSpace: "nowrap",
      letterSpacing: "-0.02em",
    },
    "& span[data-chip-secondary-row='true']": {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.18em",
      minWidth: 0,
    },
    "& span[data-chip-secondary='true']": {
      fontSize: "0.65em",
      fontWeight: 700,
      color: "rgba(106, 84, 67, 0.78)",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      letterSpacing: "0.01em",
    },
    "& span[data-chip-dot='true']": {
      width: "0.24em",
      height: "0.24em",
      borderRadius: "50%",
      background: "#22c55e",
      boxShadow: "0 0 0 0.05em rgba(34, 197, 94, 0.18)",
      flexShrink: 0,
    },
    "& span[data-chip-folder-icon='true']": {
      width: "1.8em",
      height: "1.8em",
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fffdf8",
      background: "linear-gradient(135deg, #6d4c41 0%, #9c6b4c 100%)",
      fontSize: "0.85em",
      fontWeight: 800,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)",
      flexShrink: 0,
    },
    "& span[data-chip-location-icon='true']": {
      width: "1.8em",
      height: "1.8em",
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fffdf8",
      background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
      fontSize: "0.85em",
      fontWeight: 800,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)",
      flexShrink: 0,
    },
    "& span[data-chip-label='true']": {
      fontSize: "0.85em",
      fontWeight: 700,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      letterSpacing: "-0.02em",
    },

    /* Note ref token */
    "& span[data-note-ref]": {
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
      cursor: "help",
      borderBottom: "2px dashed #9fa590",
      transition: "border-color 200ms ease, background-color 200ms ease",
      paddingBottom: "1px",
    },
    "& span[data-note-ref]:hover": {
      borderBottomColor: "#5c6248",
      backgroundColor: alpha("#5c6248", 0.08),
    },

    /* Links */
    "& a": { color: "#9b6840", textDecoration: "underline", textDecorationColor: alpha("#9b6840", 0.35), textUnderlineOffset: "3px", transition: "color 150ms ease" },
    "& a:hover": { color: "#7a4e28", textDecorationColor: "#7a4e28" },

    /* Images */
    "& img": { maxWidth: "100%", height: "auto", borderRadius: 10, display: "block", marginTop: 12, marginBottom: 12 },

    /* Tables */
    "& [data-table-wrap='true']": {
      width: "100%",
      maxWidth: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      my: "12px",
      pb: "6px",
      scrollbarWidth: "thin",
      scrollbarColor: `${alpha("#8b5e3c", 0.34)} transparent`,
    },
    "& [data-table-wrap='true']::-webkit-scrollbar": {
      height: 8,
    },
    "& [data-table-wrap='true']::-webkit-scrollbar-thumb": {
      background: alpha("#8b5e3c", 0.28),
      borderRadius: 999,
    },
    "& table": {
      width: "max-content",
      minWidth: "100%",
      maxWidth: "none",
      tableLayout: "auto",
      borderCollapse: "collapse",
      margin: 0,
    },
    "& td, & th": {
      wordWrap: "break-word",
      whiteSpace: "normal",
    },
  };
}
