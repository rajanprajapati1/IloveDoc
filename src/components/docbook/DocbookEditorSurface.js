import { useState, useCallback } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import { tooltipSlotProps } from "./shared";

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
  onOpenSelectionPanel,
  onPasteImage,
}) {
  const [dropCaret, setDropCaret] = useState({ visible: false, x: 0, y: 0, height: 0 });

  const imageEntries = Object.entries(imageUrlMap);

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

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

  /* ── Handle paste: intercept image pastes from clipboard (PrtSc, Ctrl+V) ── */
  const handlePaste = useCallback(
    (event) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      /* Scan ALL items first — check if ANY is an image */
      let imageItem = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          imageItem = items[i];
          break;
        }
      }

      if (!imageItem) return;

      /* IMMEDIATELY prevent browser from embedding the actual image */
      event.preventDefault();
      event.stopPropagation();

      const file = imageItem.getAsFile();
      if (file && onPasteImage) {
        onPasteImage(file);
      }
    },
    [onPasteImage]
  );

  /* ── Click handler: escape cursor from highlight/img-ref spans ── */
  const handleClick = useCallback(
    (event) => {
      const editor = editorRef?.current;
      if (!editor) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      /* If click is NOT on a highlight/img-ref span, but cursor ended up inside one,
         move cursor outside */
      const clickTarget = event.target;
      const isOnSpecialSpan = clickTarget.closest?.("[data-highlight], [data-img-ref]");

      if (!isOnSpecialSpan && sel.isCollapsed) {
        const node = sel.anchorNode;
        const el = node?.nodeType === 3 ? node.parentElement : node;
        const enclosingSpan = el?.closest?.("[data-highlight], [data-img-ref]");

        if (enclosingSpan && editor.contains(enclosingSpan)) {
          /* Move cursor after the span */
          const newRange = document.createRange();
          if (enclosingSpan.nextSibling) {
            /* If there's a text node after, place at its start */
            if (enclosingSpan.nextSibling.nodeType === 3) {
              newRange.setStart(enclosingSpan.nextSibling, 0);
            } else {
              newRange.setStartAfter(enclosingSpan);
            }
          } else {
            /* Create a zero-width space after the span to park the cursor */
            const zws = document.createTextNode("\u200B");
            enclosingSpan.parentNode.appendChild(zws);
            newRange.setStart(zws, 1);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }

      /* Delegate to parent handler */
      if (onEditorClick) onEditorClick(event);
    },
    [editorRef, onEditorClick]
  );

  /* ── Escape highlight/img-ref spans when typing at their boundary ── */
  const handleEditorKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return;

      const node = sel.anchorNode;
      if (!node) return;

      const el = node.nodeType === 3 ? node.parentElement : node;
      const span = el?.closest?.("[data-highlight], [data-img-ref]");
      if (!span) return;

      /* Handle Space, Enter, and all printable characters */
      const isPrintable = event.key.length === 1;
      const isEnter = event.key === "Enter";
      const isSpace = event.key === " ";
      const isArrowRight = event.key === "ArrowRight";
      const isArrowLeft = event.key === "ArrowLeft";

      if (!isPrintable && !isEnter && !isArrowRight && !isArrowLeft) return;

      /* Use Range to check if cursor is at start or end of the span */
      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);
      const cursorRange = sel.getRangeAt(0);

      const isAtStart = cursorRange.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0;
      const isAtEnd = cursorRange.compareBoundaryPoints(Range.START_TO_END, spanRange) >= 0;

      /* Arrow keys: move cursor outside the span boundary */
      if (isArrowRight && isAtEnd) {
        event.preventDefault();
        const newRange = document.createRange();
        if (span.nextSibling) {
          if (span.nextSibling.nodeType === 3) {
            newRange.setStart(span.nextSibling, Math.min(1, span.nextSibling.length));
          } else {
            newRange.setStartAfter(span);
          }
        } else {
          const zws = document.createTextNode("\u200B");
          span.parentNode.appendChild(zws);
          newRange.setStart(zws, 1);
        }
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        return;
      }

      if (isArrowLeft && isAtStart) {
        event.preventDefault();
        const newRange = document.createRange();
        if (span.previousSibling) {
          if (span.previousSibling.nodeType === 3) {
            newRange.setStart(span.previousSibling, Math.max(0, span.previousSibling.length - 1));
          } else {
            newRange.setStartBefore(span);
          }
        } else {
          const zws = document.createTextNode("\u200B");
          span.parentNode.insertBefore(zws, span);
          newRange.setStart(zws, 0);
        }
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        return;
      }

      if (!isAtEnd && !isAtStart) return;
      if (isArrowRight || isArrowLeft) return;

      event.preventDefault();

      /* Create text node outside the span */
      const content = isEnter ? "\n" : event.key;
      const textNode = document.createTextNode(content);

      if (isAtEnd) {
        if (span.nextSibling) {
          span.parentNode.insertBefore(textNode, span.nextSibling);
        } else {
          span.parentNode.appendChild(textNode);
        }
      } else {
        span.parentNode.insertBefore(textNode, span);
      }

      const newRange = document.createRange();
      newRange.setStart(textNode, textNode.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

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
      {/* Title input + panel toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="input"
          value={activeNote?.title ?? ""}
          placeholder="Untitled"
          onChange={onTitleChange}
          sx={{
            flex: 1,
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
        {imageEntries.length > 0 && (
          <Tooltip title="View images & selection" arrow slotProps={tooltipSlotProps}>
            <IconButton
              onClick={onOpenSelectionPanel}
              size="small"
              sx={{
                background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
                color: "#fff8f0",
                width: 32,
                height: 32,
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 2px 10px rgba(92, 61, 46, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #7a5240 0%, #a87350 100%)",
                  boxShadow: "0 4px 16px rgba(92, 61, 46, 0.4)",
                },
              }}
            >
              <ViewSidebarRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

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
          onClick={handleClick}
          onMouseMove={onEditorMouseMove}
          onMouseLeave={onEditorMouseLeave}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
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

            /* Image ref token — with green dot indicator */
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
      </Box>
    </Box>
  );
}
