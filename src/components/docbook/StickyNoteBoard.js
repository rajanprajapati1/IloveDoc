import { memo, useEffect, useRef, useState } from "react";
import { Box, IconButton, InputBase, alpha } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { getStickyColorOption, stickyColorOptions } from "./shared";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSidebarDropTarget(clientX, clientY) {
  return document
    .elementFromPoint(clientX, clientY)
    ?.closest?.("[data-sidebar-note-id]")
    ?.getAttribute("data-sidebar-note-id") || "";
}

function StickyNoteBoard({
  notes,
  activeNoteId,
  activeStickyNoteId,
  editorScrollRef,
  scrollTop = 0,
  viewportHeight = 0,
  contentHeight = 0,
  onSelectLink,
  onUpdateLink,
  onDeleteLink,
  onMoveLinkToNote,
  onDragStateChange,
}) {
  const boardRef = useRef(null);
  const dragStateRef = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);
  const boardNotes = notes.filter((note) => note.noteId === activeNoteId);
  const boardHeight = Math.max(contentHeight || 0, viewportHeight || 0, 360);

  useEffect(() => {
    if (!dragPreview) return undefined;

    const handlePointerMove = (event) => {
      const board = boardRef.current;
      const current = dragStateRef.current;
      if (!board || !current) return;

      const boardRect = board.getBoundingClientRect();
      const scrollElement = editorScrollRef?.current;
      const edgeThreshold = 56;
      const autoScrollStep = 18;

      if (scrollElement) {
        const distanceFromTop = event.clientY - boardRect.top;
        const distanceFromBottom = boardRect.bottom - event.clientY;

        if (distanceFromTop < edgeThreshold) {
          scrollElement.scrollTop = Math.max(0, scrollElement.scrollTop - autoScrollStep);
        } else if (distanceFromBottom < edgeThreshold) {
          const maxScrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
          scrollElement.scrollTop = Math.min(maxScrollTop, scrollElement.scrollTop + autoScrollStep);
        }
      }

      const currentScrollTop = editorScrollRef?.current?.scrollTop ?? scrollTop;
      const hoveredNoteId = getSidebarDropTarget(event.clientX, event.clientY);
      const nextX = clamp(
        event.clientX - boardRect.left - current.pointerOffsetX,
        14,
        Math.max(14, boardRect.width - current.cardWidth - 14)
      );
      const nextY = clamp(
        event.clientY - boardRect.top - current.pointerOffsetY + currentScrollTop,
        14,
        Math.max(14, boardHeight - current.cardHeight - 14)
      );

      const next = { ...current, hoveredNoteId, x: nextX, y: nextY };
      dragStateRef.current = next;
      setDragPreview(next);
      onDragStateChange?.({ stickyId: current.id, targetNoteId: hoveredNoteId });
    };

    const handlePointerUp = () => {
      const current = dragStateRef.current;
      dragStateRef.current = null;
      setDragPreview(null);
      onDragStateChange?.({ stickyId: "", targetNoteId: "" });

      if (!current) return;

      if (current.hoveredNoteId && current.hoveredNoteId !== current.noteId) {
        onMoveLinkToNote?.(current.id, current.hoveredNoteId, {
          x: Math.max(18, current.x),
          y: Math.max(18, current.y),
        });
        return;
      }

      onUpdateLink(current.id, { x: current.x, y: current.y });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [boardHeight, dragPreview, editorScrollRef, onDragStateChange, onMoveLinkToNote, onUpdateLink, scrollTop]);

  useEffect(
    () => () => {
      onDragStateChange?.({ stickyId: "", targetNoteId: "" });
    },
    [onDragStateChange]
  );

  const getCardLeft = (note, index) => {
    if (dragPreview?.id === note.id) return dragPreview.x;
    return note.x ?? 28 + (index % 3) * 138;
  };

  const getCardTop = (note, index) => {
    if (dragPreview?.id === note.id) return dragPreview.y;
    return note.y ?? 30 + Math.floor(index / 3) * 132;
  };

  const handleDragStart = (event, note, index) => {
    if (event.button !== 0) return;

    const board = boardRef.current;
    const card = event.currentTarget.closest("[data-sticky-card]");
    if (!board || !card) return;

    const cardRect = card.getBoundingClientRect();
    const next = {
      id: note.id,
      noteId: note.noteId,
      x: getCardLeft(note, index),
      y: getCardTop(note, index),
      hoveredNoteId: "",
      pointerOffsetX: event.clientX - cardRect.left,
      pointerOffsetY: event.clientY - cardRect.top,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
    };

    dragStateRef.current = next;
    setDragPreview(next);
    onDragStateChange?.({ stickyId: note.id, targetNoteId: "" });
    onSelectLink?.(note.id);
    event.preventDefault();
  };

  if (!activeNoteId || boardNotes.length === 0) return null;

  return (
    <Box
      ref={boardRef}
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: boardHeight,
          transform: `translateY(-${scrollTop}px)`,
          willChange: "transform",
        }}
      >
        {boardNotes.map((note, index) => {
          const palette = getStickyColorOption(note.color);
          const isActive = note.id === activeStickyNoteId;
          const isDragging = dragPreview?.id === note.id;

          return (
            <Box
              key={note.id}
              data-sticky-card={note.id}
              onMouseDown={() => onSelectLink?.(note.id)}
              sx={{
                position: "absolute",
                top: getCardTop(note, index),
                left: getCardLeft(note, index),
                width: { xs: 206, md: 226 },
                maxHeight: 320,
                pointerEvents: "auto",
                color: palette.ink,
                borderRadius: "6px 6px 18px 14px",
                background: `linear-gradient(180deg, ${palette.edge} 0%, ${palette.value} 13%, ${palette.value} 100%)`,
                boxShadow: isActive
                  ? `0 24px 45px ${alpha(palette.shade, 0.38)}, 0 0 0 2px ${alpha("#fffef8", 0.82)}`
                  : `0 14px 28px ${alpha(palette.shade, 0.24)}, 0 2px 8px rgba(61, 43, 18, 0.10)`,
                outline: isDragging ? `2px solid ${alpha("#fffef8", 0.86)}` : "none",
                p: 1.4,
                pt: 1.8,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                transition: "transform 180ms ease, box-shadow 180ms ease",
                transform: isDragging
                  ? "rotate(-1deg) scale(1.03)"
                  : isActive
                    ? "rotate(1deg) scale(1.02)"
                    : `rotate(${index % 2 === 0 ? "-2.2deg" : "1.8deg"})`,
                zIndex: isDragging ? 8 : isActive ? 6 : 2 + index,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "0 0 22px 22px",
                  borderColor: `transparent transparent ${alpha(palette.edge, 0.9)} transparent`,
                  filter: "drop-shadow(-2px -2px 4px rgba(85, 66, 32, 0.14))",
                },
              }}
            >
              <Box
                onPointerDown={(event) => handleDragStart(event, note, index)}
                sx={{
                  position: "absolute",
                  top: -15,
                  left: "2%",
                  transform: "translateX(-50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#fffef9", 0.92),
                  border: `1px solid ${alpha(palette.pin, 0.58)}`,
                  color: palette.pin,
                  boxShadow: "0 4px 10px rgba(64, 46, 18, 0.14)",
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                  zIndex: 1,
                }}
              >
                <GestureRoundedIcon sx={{ fontSize: 17 }} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                <InputBase
                  value={note.title}
                  onFocus={() => onSelectLink?.(note.id)}
                  onChange={(event) => onUpdateLink(note.id, { title: event.target.value })}
                  placeholder="Idea title"
                  sx={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: palette.ink,
                    fontFamily: "\"Bradley Hand\", \"Marker Felt\", \"Comic Sans MS\", cursive",
                    "& input::placeholder": {
                      color: alpha(palette.ink, 0.42),
                      opacity: 1,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => onDeleteLink(note.id)}
                  sx={{
                    color: alpha(palette.ink, 0.62),
                    p: 0.15,
                    mt: -0.15,
                    "&:hover": { bgcolor: alpha("#fffef8", 0.42), color: palette.ink },
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>

              <InputBase
                multiline
                minRows={3}
                maxRows={8}
                value={note.content}
                onFocus={() => onSelectLink?.(note.id)}
                onChange={(event) => onUpdateLink(note.id, { content: event.target.value })}
                placeholder="Write something here..."
                sx={{
                  flex: 1,
                  fontSize: 16,
                  lineHeight: 1.35,
                  color: alpha(palette.ink, 0.92),
                  fontFamily: "\"Bradley Hand\", \"Marker Felt\", \"Comic Sans MS\", cursive",
                  alignItems: "flex-start",
                  "& textarea": {
                    overflowY: "auto",
                  },
                  "& textarea::placeholder": {
                    color: alpha(palette.ink, 0.42),
                    opacity: 1,
                  },
                }}
              />

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 0.55 }}>
                  {stickyColorOptions.map((option) => {
                    const selected = option.value === note.color;

                    return (
                      <Box
                        key={option.value}
                        component="button"
                        type="button"
                        aria-label={`Set sticky color to ${option.label}`}
                        onClick={() => onUpdateLink(note.id, { color: option.value })}
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: selected ? `2px solid ${alpha("#fffef9", 0.95)}` : `1px solid ${alpha("#2f2313", 0.18)}`,
                          bgcolor: option.value,
                          boxShadow: selected ? `0 0 0 1px ${alpha(option.shade, 0.7)}` : "none",
                          cursor: "pointer",
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                          "&:hover": { transform: "scale(1.08)" },
                        }}
                      />
                    );
                  })}
                </Box>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: alpha("#fffef8", 0.32),
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: alpha(palette.ink, 0.64),
                  }}
                >
                  drag me
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default memo(StickyNoteBoard);
