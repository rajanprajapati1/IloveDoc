import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function DocbookEditorSurface({
  activeNote,
  editorRef,
  imageUrlMap = {},
  onTitleChange,
  onEditorInput,
  onEditorBlur,
  onEditorSelectionChange,
  onEditorClick,
  onEditorMouseMove,
  onEditorMouseLeave,
  onEditorDragOver,
  onEditorDragLeave,
  onEditorDrop,
}) {
  const [dropCaret, setDropCaret] = useState({ visible: false, x: 0, y: 0, height: 0 });
  const [showImages, setShowImages] = useState(false);

  const imageEntries = Object.entries(imageUrlMap);

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      /* compute exact caret position for the visual indicator */
      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (range) {
        const rect = range.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) {
          setDropCaret({ visible: true, x: rect.left, y: rect.top, height: rect.height || 24 });
        }
      }

      if (onEditorDragOver) onEditorDragOver(event);
    },
    [onEditorDragOver]
  );

  const handleDragLeave = useCallback(
    (event) => {
      setDropCaret((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      if (onEditorDragLeave) onEditorDragLeave(event);
    },
    [onEditorDragLeave]
  );

  const handleDrop = useCallback(
    (event) => {
      setDropCaret((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      if (onEditorDrop) onEditorDrop(event);
    },
    [onEditorDrop]
  );

  /* Escape highlight/img-ref spans when typing at their boundary */
  const handleEditorKeyDown = useCallback(
    (event) => {
      /* Only handle printable characters and space */
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1 && event.key !== "Enter") return;

      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return;

      const node = sel.anchorNode;
      const offset = sel.anchorOffset;
      if (!node) return;

      /* Check if cursor is inside a highlight or img-ref span */
      const el = node.nodeType === 3 ? node.parentElement : node;
      const span = el?.closest?.("[data-highlight], [data-img-ref]");
      if (!span) return;

      /* Use Range to check if cursor is truly at the very start or end of the span */
      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);

      const cursorRange = sel.getRangeAt(0);

      /* Compare cursor to start of span content */
      const isAtStart = cursorRange.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0;

      /* Compare cursor to end of span content */
      const isAtEnd = cursorRange.compareBoundaryPoints(Range.START_TO_END, spanRange) >= 0;

      if (!isAtEnd && !isAtStart) return;

      event.preventDefault();

      /* Create a text node with the typed character outside the span */
      const textNode = document.createTextNode(event.key === "Enter" ? "\n" : event.key);

      if (isAtEnd) {
        if (span.nextSibling) {
          span.parentNode.insertBefore(textNode, span.nextSibling);
        } else {
          span.parentNode.appendChild(textNode);
        }
      } else {
        span.parentNode.insertBefore(textNode, span);
      }

      /* Move cursor to end of the new text node */
      const newRange = document.createRange();
      newRange.setStart(textNode, textNode.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      /* Sync the change to React state */
      if (onEditorInput) onEditorInput();
    },
    [onEditorInput]
  );

  return (
    <Box
      sx={{
        order: { xs: 1, lg: 2 },
        minWidth: 0,
        width: "100%",
        minHeight: 0,
        p: { xs: 2, md: 3.2 },
        display: "flex",
        flexDirection: "column",
        gap: 2.2,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(255,253,248,0.85) 0%, rgba(248,243,235,0.98) 100%)",
      }}
    >
      {/* Title input */}
      <Box
        component="input"
        value={activeNote?.title ?? ""}
        placeholder="Untitled"
        onChange={onTitleChange}
        sx={{
          width: "100%",
          border: 0,
          borderBottom: "1.5px solid transparent",
          outline: 0,
          bgcolor: "transparent",
          fontFamily: "inherit",
          fontSize: 17,
          lineHeight: 1.35,
          fontWeight: 700,
          color: "#2e261f",
          pb: 0.6,
          transition: "border-color 200ms ease",
          "&::placeholder": { color: alpha("#2e261f", 0.38), fontWeight: 500 },
        }}
      />

      {/* Editor wrapper */}
      <Box sx={{ position: "relative", flex: 1, minHeight: { xs: 360, lg: 0 }, width: "100%", overflow: "hidden", borderRadius: 5 }}>
        {/* Decorative blurs */}
        <Box sx={{ position: "absolute", left: -80, top: 40, width: "100%", height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,253,248,0.95) 0%, rgba(255,253,248,0) 72%)", filter: "blur(8px)" }} />
        <Box sx={{ position: "absolute", right: -60, bottom: 24, width: 260, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,230,215,0.7) 0%, rgba(240,230,215,0) 72%)", filter: "blur(18px)" }} />

        {/* Drop caret indicator */}
        <Box
          sx={{
            position: "fixed",
            left: dropCaret.x,
            top: dropCaret.y,
            width: 2.5,
            height: dropCaret.height,
            bgcolor: "#c4956a",
            borderRadius: 1,
            boxShadow: "0 0 8px rgba(196, 149, 106, 0.6), 0 0 2px rgba(196, 149, 106, 0.9)",
            opacity: dropCaret.visible ? 1 : 0,
            transition: "opacity 100ms ease",
            pointerEvents: "none",
            zIndex: 1500,
          }}
        />

        {/* Content-editable editor */}
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-placeholder="Start writing your note..."
          onKeyDown={handleEditorKeyDown}
          onInput={onEditorInput}
          onBlur={onEditorBlur}
          onMouseUp={onEditorSelectionChange}
          onKeyUp={onEditorSelectionChange}
          onClick={onEditorClick}
          onMouseMove={onEditorMouseMove}
          onMouseLeave={onEditorMouseLeave}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            minHeight: "100%",
            overflowY: "auto",
            outline: 0,
            p: { xs: 1.4, md: 2.4 },
            fontFamily: "inherit",
            fontSize: { xs: 34, md: 52 },
            lineHeight: { xs: 1.18, md: 1.22 },
            fontWeight: 500,
            letterSpacing: "-0.045em",
            color: alpha("#221f1a", 0.34),
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
            "& p, & div": { margin: 0 },

            /* Lists */
            "& ul, & ol": { margin: "0.15em 0", paddingLeft: "1.4em" },
            "& ul": { listStyleType: "disc" },
            "& ol": { listStyleType: "decimal" },
            "& ol[data-list-type='lower-roman']": { listStyleType: "lower-roman" },
            "& ol[data-list-type='upper-roman']": { listStyleType: "upper-roman" },
            "& ol[data-list-type='lower-alpha']": { listStyleType: "lower-alpha" },
            "& ol[data-list-type='upper-alpha']": { listStyleType: "upper-alpha" },
            "& li": { margin: "0.05em 0", lineHeight: "inherit", paddingLeft: "0.15em" },

            /* Highlight (warm gradient pill) */
            "& span[data-highlight]": {
              borderRadius: "10px",
              paddingInline: "0.24em",
              paddingBlock: "0.05em",
              background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
              color: "#fff8f0",
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

            /* Image ref token — same font size as content */
            "& span[data-img-ref]": {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              paddingInline: "0.3em",
              paddingBlock: "0.06em",
              fontSize: "inherit",
              lineHeight: "inherit",
              background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
              color: "#fff8f0",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              cursor: "zoom-in",
              boxShadow: "0 1px 6px rgba(139, 94, 60, 0.25)",
              verticalAlign: "baseline",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            },
            "& span[data-img-ref]:hover": {
              transform: "scale(1.03)",
              boxShadow: "0 2px 10px rgba(139, 94, 60, 0.4)",
            },

            /* Note ref token */
            "& span[data-note-ref]": {
              borderRadius: "10px",
              paddingInline: "0.24em",
              paddingBlock: "0.05em",
              backgroundColor: "#f5e6d0",
              color: "#4a3526",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              cursor: "help",
              borderBottom: "2px dashed #d4a574",
              transition: "background-color 200ms ease",
            },
            "& span[data-note-ref]:hover": {
              backgroundColor: "#eed9be",
            },

            /* Links */
            "& a": { color: "#9b6840", textDecoration: "underline", textDecorationColor: alpha("#9b6840", 0.35), textUnderlineOffset: "3px", transition: "color 150ms ease" },
            "& a:hover": { color: "#7a4e28", textDecorationColor: "#7a4e28" },

            /* Images */
            "& img": { maxWidth: "100%", height: "auto", borderRadius: 10, display: "block", marginTop: 12, marginBottom: 12 },
          }}
        />

        {/* Floating image attachment indicator */}
        {imageEntries.length > 0 && (
          <Box
            onMouseEnter={() => setShowImages(true)}
            onMouseLeave={() => setShowImages(false)}
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 10,
            }}
          >
            {/* Badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.2,
                py: 0.5,
                borderRadius: 999,
                background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
                color: "#fff8f0",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(92, 61, 46, 0.3)",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 16px rgba(92, 61, 46, 0.4)",
                },
              }}
            >
              📷 {imageEntries.length}
            </Box>

            {/* Hover panel with thumbnails */}
            <Box
              sx={{
                position: "absolute",
                bottom: "100%",
                right: 0,
                mb: 1,
                p: 1,
                borderRadius: 3,
                bgcolor: "#fdf8f1",
                border: "1px solid #ddd0c0",
                boxShadow: "0 8px 32px rgba(58, 46, 34, 0.18)",
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                maxWidth: 280,
                opacity: showImages ? 1 : 0,
                transform: showImages ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 180ms ease, transform 180ms ease",
                pointerEvents: showImages ? "auto" : "none",
              }}
            >
              {imageEntries.map(([id, url]) => (
                <Box
                  key={id}
                  component="img"
                  src={url}
                  alt="Attached"
                  onClick={() => window.open(url, "_blank")}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #e6ddd3",
                    cursor: "pointer",
                    transition: "transform 120ms ease",
                    "&:hover": { transform: "scale(1.08)" },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
