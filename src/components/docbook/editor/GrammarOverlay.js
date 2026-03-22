"use client";

import { useState, useMemo, useRef } from "react";
import { Box, Typography, Button, Fade, Paper, ClickAwayListener } from "@mui/material";

export default function GrammarOverlay({ mappedLints, applySuggestion, editorRef, scrollTop = 0 }) {
  const [activeLint, setActiveLint] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState({ top: 0, left: 0 });
  const overlayRef = useRef(null);

  const handleSquigglyClick = (e, lint) => {
    e.stopPropagation();
    e.preventDefault();
    if (editorRef.current) {
      const parentRect = editorRef.current.getBoundingClientRect();
      setPopoverAnchor({
        top: e.clientY - parentRect.top,
        left: e.clientX - parentRect.left,
      });
    }
    setActiveLint(lint);
  };

  const closePopover = () => setActiveLint(null);

  const renderSquigglies = useMemo(() => {
    if (!mappedLints) return null;
    return mappedLints.map((lint, i) => {
      // Don't render if there are no rects
      if (!lint.rects || lint.rects.length === 0) return null;
      
      const isGrammar = lint.is_grammar_error || lint.lint_kind !== "Spelling";
      const underlineColor = isGrammar ? "#1976d2" : "#d32f2f"; // Blue for grammar, Red for spelling

      return (
        <Box key={`lint-${i}`}>
          {lint.rects.map((rect, j) => (
            <Box
              key={`rect-${i}-${j}`}
              onClick={(e) => handleSquigglyClick(e, lint)}
              sx={{
                position: "absolute",
                top: rect.top + rect.height - 6,
                left: rect.left,
                width: rect.width,
                height: 6,
                cursor: "pointer",
                borderBottom: `2.5px dotted ${underlineColor}`,
                pointerEvents: "auto",
                zIndex: 10,
                // Make the hitbox slightly taller for easier clicking
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: "-2px 0 -4px 0",
                  backgroundColor: "transparent",
                }
              }}
              title={lint.message}
            />
          ))}
        </Box>
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedLints]);

  return (
    <Box
      ref={overlayRef}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1, // ensure it's above the editor background but below toolbars
        overflow: "hidden", // clip squigglies sticking out
        transform: `translateY(-${scrollTop}px)`,
      }}
    >
      {renderSquigglies}

      {/* Suggestion Popover */}
      {activeLint && (
        <ClickAwayListener onClickAway={closePopover}>
          <Fade in={Boolean(activeLint)}>
            <Paper
              elevation={6}
              sx={{
                position: "absolute",
                top: popoverAnchor.top + 20,
                left: Math.min(popoverAnchor.left, overlayRef.current?.offsetWidth - 200 || popoverAnchor.left),
                minWidth: 180,
                maxWidth: 280,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.98)",
                pointerEvents: "auto",
                zIndex: 1500,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", mb: 1, lineHeight: 1.3 }}>
                {activeLint.message}
              </Typography>
              
              {activeLint.suggestions && activeLint.suggestions.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {activeLint.suggestions.map((sug, i) => {
                    const text = sug.replacement_text !== undefined ? sug.replacement_text : (sug.get_replacement_text ? sug.get_replacement_text() : null);
                    if (text === null) return null;
                    return (
                      <Button
                        key={i}
                        variant="contained"
                        size="small"
                        onClick={() => {
                          applySuggestion(activeLint, text);
                          closePopover();
                        }}
                        sx={{
                          justifyContent: "flex-start",
                          textTransform: "none",
                          backgroundColor: "#f0f4f8",
                          color: "#1976d2",
                          boxShadow: "none",
                          "&:hover": { backgroundColor: "#e2ecf5", boxShadow: "none" }
                        }}
                      >
                        {text || "(Remove)"}
                      </Button>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Fade>
        </ClickAwayListener>
      )}
    </Box>
  );
}
