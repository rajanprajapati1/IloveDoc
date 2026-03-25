"use client";

import { useState, useCallback, useRef } from "react";
import { richTokenBoundarySelector } from "./constants";

/**
 * Hook for editor event handlers (paste, click, input, blur, drag, scroll, etc.)
 *
 * @param {Object} params
 * @param {Object}   params.editorRef
 * @param {Function} params.onEditorInput
 * @param {Function} params.onEditorBlur
 * @param {Function} params.onEditorSelectionChange
 * @param {Function} params.onEditorClick
 * @param {Function} params.onEditorDragOver
 * @param {Function} params.onEditorDragLeave
 * @param {Function} params.onEditorDrop
 * @param {Function} params.refreshSlashMenu
 * @param {Function} params.refreshTokenMenu
 * @param {Function} params.closeSlashMenu
 * @param {Function} params.closeTokenMenu
 * @param {Function} params.refreshEditorScrollState
 * @param {Function} params.setConnectionsDockOpen
 * @param {Function} params.setLinkSearchOpen
 */
export default function useEditorEvents({
  editorRef,
  onEditorInput,
  onEditorBlur,
  onEditorSelectionChange,
  onEditorClick,
  onEditorDragOver,
  onEditorDragLeave,
  onEditorDrop,
  refreshSlashMenu,
  refreshTokenMenu,
  closeSlashMenu,
  closeTokenMenu,
  refreshEditorScrollState,
  setConnectionsDockOpen,
  setLinkSearchOpen,
}) {
  const [dropCaret, setDropCaret] = useState({ visible: false, x: 0, y: 0, height: 0 });
  const menuRefreshTimerRef = useRef(null);

  /* Debounced menu refresh — waits 120ms after last keystroke to prevent flickering */
  const debouncedMenuRefresh = useCallback(() => {
    if (menuRefreshTimerRef.current) clearTimeout(menuRefreshTimerRef.current);
    menuRefreshTimerRef.current = setTimeout(() => {
      refreshSlashMenu();
      refreshTokenMenu();
      menuRefreshTimerRef.current = null;
    }, 120);
  }, [refreshSlashMenu, refreshTokenMenu]);

  const handlePaste = useCallback(
    (event) => {
      /* Browser natively handles text/html paste. Image file pasting is removed */
    },
    []
  );

  const handleClick = useCallback(
    (event) => {
      const editor = editorRef?.current;
      if (!editor) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const clickTarget = event.target;
      const isOnSpecialSpan = clickTarget.closest?.(richTokenBoundarySelector);

      if (!isOnSpecialSpan && sel.isCollapsed) {
        const node = sel.anchorNode;
        const el = node?.nodeType === 3 ? node.parentElement : node;
        const enclosingSpan = el?.closest?.(richTokenBoundarySelector);

        if (enclosingSpan && editor.contains(enclosingSpan)) {
          const newRange = document.createRange();
          if (enclosingSpan.nextSibling) {
            if (enclosingSpan.nextSibling.nodeType === 3) {
              newRange.setStart(enclosingSpan.nextSibling, 0);
            } else {
              newRange.setStartAfter(enclosingSpan);
            }
          } else {
            const zws = document.createTextNode("\u200B");
            enclosingSpan.parentNode.appendChild(zws);
            newRange.setStart(zws, 1);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }

      setConnectionsDockOpen(false);
      setLinkSearchOpen(false);

      if (onEditorClick) onEditorClick(event);
      window.requestAnimationFrame(refreshSlashMenu);
      window.requestAnimationFrame(refreshTokenMenu);
    },
    [editorRef, onEditorClick, refreshSlashMenu, refreshTokenMenu, setConnectionsDockOpen, setLinkSearchOpen]
  );

  const handleInput = useCallback(
    (event) => {
      if (onEditorInput) onEditorInput(event);
      window.requestAnimationFrame(refreshEditorScrollState);
      debouncedMenuRefresh();
    },
    [onEditorInput, refreshEditorScrollState, debouncedMenuRefresh]
  );

  const handleKeyUp = useCallback(
    (event) => {
      if (onEditorSelectionChange) onEditorSelectionChange(event);
      window.requestAnimationFrame(refreshEditorScrollState);
      /* Menu refresh already handled by handleInput — no need to double-fire */
    },
    [onEditorSelectionChange, refreshEditorScrollState]
  );

  const handleMouseUp = useCallback(
    (event) => {
      if (onEditorSelectionChange) onEditorSelectionChange(event);
      window.requestAnimationFrame(refreshEditorScrollState);
      window.requestAnimationFrame(refreshSlashMenu);
    },
    [onEditorSelectionChange, refreshEditorScrollState, refreshSlashMenu]
  );

  const handleBlur = useCallback(
    (event) => {
      closeSlashMenu();
      closeTokenMenu();
      if (onEditorBlur) onEditorBlur(event);
      window.requestAnimationFrame(refreshEditorScrollState);
    },
    [closeSlashMenu, closeTokenMenu, onEditorBlur, refreshEditorScrollState]
  );

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

  const handleEditorScroll = useCallback(() => {
    refreshEditorScrollState();
  }, [refreshEditorScrollState]);

  return {
    dropCaret,
    handlePaste,
    handleClick,
    handleInput,
    handleKeyUp,
    handleMouseUp,
    handleBlur,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleEditorScroll,
  };
}
