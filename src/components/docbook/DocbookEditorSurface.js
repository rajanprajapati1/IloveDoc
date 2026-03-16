import { useState, useCallback, useEffect } from "react";
import { Box, IconButton, Tooltip, Stack, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import TextDecreaseRoundedIcon from "@mui/icons-material/TextDecreaseRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import { noteColorOptions, tooltipSlotProps, uncheckedIconSvg } from "./shared";
import TextIncreaseRoundedIcon from "@mui/icons-material/TextIncreaseRounded";
import StickyNoteBoard from "./StickyNoteBoard";
import ViewCarouselRoundedIcon from '@mui/icons-material/ViewCarouselRounded';
import KeyboardOptionKeyRoundedIcon from '@mui/icons-material/KeyboardOptionKeyRounded';
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function DocbookEditorSurface({
  activeNote,
  editorRef,
  imageUrlMap = {},
  stickyNotes = [],
  activeStickyNoteId,
  onTitleChange,
  onEditorInput,
  onEditorBlur,
  onEditorSelectionChange,
  onEditorClick,
  onEditorDoubleClick,
  onEditorMouseMove,
  onEditorMouseLeave,
  onEditorDragOver,
  onEditorDragLeave,
  onEditorDrop,
  onOpenSelectionPanel,
  onPasteImage,
  onNoteFontSizeDecrease,
  onFontSizeDecrease,
  onAddStickyNote,
  onOpenStickyNote,
  onUpdateStickyNote,
  onMoveStickyNote,
  onStickyDragStateChange,
  onDeleteStickyNote,
  onNoteColorChange,
  onNoteFontSizeIncrease,
  onFontSizeIncrease,
  syncBadgeState,
  collapseSidebar
}) {
  const [dropCaret, setDropCaret] = useState({ visible: false, x: 0, y: 0, height: 0 });
  const [slashMenu, setSlashMenu] = useState({ visible: false, x: 0, y: 0, query: "", selectedIndex: 0, token: "" });
  const [stickyNotesVisible, setStickyNotesVisible] = useState(true);
  const [editorScrollState, setEditorScrollState] = useState({
    scrollTop: 0,
    viewportHeight: 0,
    contentHeight: 0,
  });
  const activeNoteTint = activeNote?.color || noteColorOptions[0].value;
  const editorFontScale = activeNote?.fontScale || 1;

  const imageEntries = Object.entries(imageUrlMap);
  const showSyncBadge = Boolean(syncBadgeState?.enabled && syncBadgeState?.hasPin && syncBadgeState?.interval > 0);
  const lastSyncTime = syncBadgeState?.lastSyncAt ? new Date(syncBadgeState.lastSyncAt).getTime() : 0;
  const lastLocalChangeTime = syncBadgeState?.lastLocalChangeAt ? new Date(syncBadgeState.lastLocalChangeAt).getTime() : 0;
  const syncIsCurrent = showSyncBadge && lastSyncTime > 0 && lastSyncTime >= lastLocalChangeTime;

  const getRelativeSyncLabel = () => {
    if (!showSyncBadge) return "";
    if (!lastSyncTime) return "Not synced";
    if (!syncIsCurrent) return "Not synced";

    const diffMs = Math.max(0, Date.now() - lastSyncTime);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Synced just now";
    if (diffMins < 60) return `Synced ${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Synced ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Synced ${diffDays}d ago`;
  };

  const handleTopFontDecrease = onNoteFontSizeDecrease || onFontSizeDecrease;
  const handleTopFontIncrease = onNoteFontSizeIncrease || onFontSizeIncrease;

  const refreshEditorScrollState = useCallback(() => {
    const editor = editorRef?.current;
    if (!editor) return;

    setEditorScrollState((prev) => {
      const next = {
        scrollTop: editor.scrollTop,
        viewportHeight: editor.clientHeight,
        contentHeight: Math.max(editor.scrollHeight, editor.clientHeight),
      };

      if (
        prev.scrollTop === next.scrollTop &&
        prev.viewportHeight === next.viewportHeight &&
        prev.contentHeight === next.contentHeight
      ) {
        return prev;
      }

      return next;
    });
  }, [editorRef]);
  // -- Date Suggestions Logic --
  const getDateSuggestions = useCallback((query) => {
    const today = new Date();
    
    // Helper to format date in different ways
    const getFormatsForDate = (date) => {
      return [
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // Mar 16, 2026
        date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), // Monday, March 16, 2026
        `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, // 3/16/2026
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` // 2026-03-16
      ];
    };

    let targetDate = new Date(today);
    let dateLabelPrefix = "";
    let isRelativeQuery = false;

    // Handle relative queries or default to today
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('tom')) {
      targetDate.setDate(today.getDate() + 1);
      dateLabelPrefix = "Tomorrow";
      isRelativeQuery = true;
    } else if (lowerQuery.includes('yes')) {
      targetDate.setDate(today.getDate() - 1);
      dateLabelPrefix = "Yesterday";
      isRelativeQuery = true;
    } else {
      // Check for 'X days ago' or 'in X days'
      let match = lowerQuery.match(/(\d+)\s*d(?:ay(?:s)?)?\s*ago/);
      if (match) {
        targetDate.setDate(today.getDate() - parseInt(match[1], 10));
        dateLabelPrefix = `${match[1]} Days Ago`;
        isRelativeQuery = true;
      } else {
        match = lowerQuery.match(/in\s*(\d+)\s*d(?:ay(?:s)?)?/);
        if (match) {
           targetDate.setDate(today.getDate() + parseInt(match[1], 10));
           dateLabelPrefix = `In ${match[1]} Days`;
           isRelativeQuery = true;
        } else if (!lowerQuery.replace(/[\/date\s]/g, "")) {
           dateLabelPrefix = "Today";
        }
      }
    }

    const formats = getFormatsForDate(targetDate);
    return formats.map((format, index) => ({
      id: `date-${index}`,
      kind: "date",
      label: format,
      description: dateLabelPrefix ? `${dateLabelPrefix} (${format})` : format,
      value: format
    }));
  }, []);

  const activeSuggestions = (() => {
    // Determine which suggestions to show based on the token/query
    let results = [];
    const cleanQuery = slashMenu.query.toLowerCase().replace("/", "");
    
    if (slashMenu.query.startsWith("/note") || "note".includes(cleanQuery)) {
      results.push(
        { id: "create-sticky-note", kind: "create", label: "Create sticky note", description: "Open a new sticky note for this page" },
        ...stickyNotes
          .filter((note) => note.noteId === activeNote?.id)
          .map((note) => ({
            id: note.id,
            kind: "existing",
            label: note.title?.trim() || "Untitled sticky note",
            description: "Open existing sticky note",
          }))
      );
    }
    
    if (slashMenu.query.startsWith("/date") || "date".includes(cleanQuery)) {
       results.push(...getDateSuggestions(cleanQuery.replace("date", "").trim()));
    }

    return results;
  })();

  const closeSlashMenu = useCallback(() => {
    setSlashMenu((prev) => (prev.visible ? { ...prev, visible: false, selectedIndex: 0 } : prev));
  }, []);

  const getSlashCommandContext = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;

    const node = sel.anchorNode;
    if (!node || node.nodeType !== 3) return null;

    const beforeText = node.textContent?.slice(0, sel.anchorOffset) || "";
    const match = beforeText.match(/(?:^|\s)(\/[a-z]*)$/i);
    if (!match) return null;

    const caretRange = sel.getRangeAt(0).cloneRange();
    caretRange.collapse(true);
    const rect = caretRange.getBoundingClientRect();
    const token = match[1];
    const startIndex = beforeText.lastIndexOf(token);

    return {
      textNode: node,
      token,
      startIndex,
      endIndex: startIndex + token.length,
      rect,
    };
  }, []);

  const refreshSlashMenu = useCallback(() => {
    const context = getSlashCommandContext();
    if (!context) {
      closeSlashMenu();
      return;
    }

    const query = context.token.toLowerCase();
    const noSlash = query.replace("/", "");
    if (!"note".includes(noSlash) && !"date".includes(noSlash)) {
      closeSlashMenu();
      return;
    }

    setSlashMenu((prev) => ({
      visible: true,
      x: context.rect.left,
      y: context.rect.bottom + 10,
      query,
      token: context.token,
      // Reset selectedIndex if the token changed, otherwise keep it but clamp it to the activeSuggestions length
      selectedIndex: prev.token === context.token ? Math.min(prev.selectedIndex, Math.max(0, 10)) : 0, 
    }));
  }, [closeSlashMenu, getSlashCommandContext]); // NOTE: activeSuggestions length handling moved to render/apply time constraints since it's derived now

  const applySlashSuggestion = useCallback(
    (item) => {
      const context = getSlashCommandContext();
      if (context?.textNode) {
        const currentText = context.textNode.textContent || "";
        let newTextContent = "";

        if (item.kind === "date") {
           newTextContent = `${currentText.slice(0, context.startIndex)}${item.value}${currentText.slice(context.endIndex)}`;
        } else {
           newTextContent = `${currentText.slice(0, context.startIndex)}${currentText.slice(context.endIndex)}`;
        }

        context.textNode.textContent = newTextContent;

        const nextRange = document.createRange();
        const nextSelection = window.getSelection();
        
        let cursorOffset = context.startIndex;
        if (item.kind === "date") {
            cursorOffset += item.value.length;
        }

        nextRange.setStart(context.textNode, Math.min(cursorOffset, context.textNode.textContent.length));
        nextRange.collapse(true);
        nextSelection?.removeAllRanges();
        nextSelection?.addRange(nextRange);
      }

      if (onEditorInput) onEditorInput();
      closeSlashMenu();

      if (item.kind === "create") {
        onAddStickyNote?.();
        return;
      }

      if (item.kind === "existing") {
        onOpenStickyNote?.(item.id);
      }
    },
    [closeSlashMenu, getSlashCommandContext, onAddStickyNote, onEditorInput, onOpenStickyNote]
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

  const toggleStickyNotesVisibility = useCallback(() => {
    setStickyNotesVisible((prev) => {
      const next = !prev;
      if (!next) {
        onStickyDragStateChange?.({ stickyId: "", targetNoteId: "" });
      }
      return next;
    });
  }, [onStickyDragStateChange]);

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
      window.requestAnimationFrame(refreshSlashMenu);
    },
    [editorRef, onEditorClick, refreshSlashMenu]
  );

  const handleInput = useCallback(
    (event) => {
      if (onEditorInput) onEditorInput(event);
      window.requestAnimationFrame(refreshEditorScrollState);
      window.requestAnimationFrame(refreshSlashMenu);
    },
    [onEditorInput, refreshEditorScrollState, refreshSlashMenu]
  );

  const handleKeyUp = useCallback(
    (event) => {
      if (onEditorSelectionChange) onEditorSelectionChange(event);
      window.requestAnimationFrame(refreshEditorScrollState);
      window.requestAnimationFrame(refreshSlashMenu);
    },
    [onEditorSelectionChange, refreshEditorScrollState, refreshSlashMenu]
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
      if (onEditorBlur) onEditorBlur(event);
      window.requestAnimationFrame(refreshEditorScrollState);
    },
    [closeSlashMenu, onEditorBlur, refreshEditorScrollState]
  );

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return undefined;

    refreshEditorScrollState();

    const handleResize = () => refreshEditorScrollState();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeNote?.id, activeNote?.content, editorFontScale, editorRef, refreshEditorScrollState]);

  /* ── Escape highlight/img-ref spans when typing at their boundary ── */
  const handleEditorKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (slashMenu.visible && activeSuggestions.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % activeSuggestions.length }));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + activeSuggestions.length) % activeSuggestions.length }));
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          closeSlashMenu();
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          applySlashSuggestion(activeSuggestions[slashMenu.selectedIndex] || activeSuggestions[0]);
          return;
        }
      }

      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return;

      const node = sel.anchorNode;
      if (!node) return;

      const isEnter = event.key === "Enter";

      /* ── Escape standard lists (ul/ol) on Enter if empty ── */
      if (isEnter) {
        const liNode = node.nodeType === 3 ? node.parentElement : node;
        const li = liNode?.closest?.("li");
        if (li) {
          const list = li.closest("ul, ol");
          // If the list item is effectively empty (just whitespace or zero width space or empty br)
          const isEmpty = !li.textContent.trim() || li.textContent === "\u200B";
          
          if (isEmpty) {
            event.preventDefault();
            
            // Create a new paragraph to place cursor
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            
            // Insert it after the entire list
            if (list && list.parentNode) {
                list.parentNode.insertBefore(p, list.nextSibling);
            }
            
            // Remove the empty list item
            li.parentNode.removeChild(li);
            
            // If the list is now empty, remove the whole list element
            if (list && list.children.length === 0 && list.parentNode) {
                list.parentNode.removeChild(list);
            }
            
            // Move cursor to the new paragraph
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            
            if (onEditorInput) onEditorInput();
            return;
          }
        }
      }

      /* ── Escape Table on Enter or add new line inside td/th ── */
      if (isEnter) {
        const cellNode = node.nodeType === 3 ? node.parentElement : node;
        const cell = cellNode?.closest?.("td, th");
        if (cell) {
          event.preventDefault();
          const tr = cell.closest("tr");
          const table = cell.closest("table");
          const tbody = tr.parentNode;

          // If the row is completely empty, consider it a "double enter" and exit table
          const isRowEmpty = Array.from(tr.cells).every(c => c.textContent.trim() === "" && !c.querySelector('img'));

          if (isRowEmpty) {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            table.parentNode.insertBefore(p, table.nextSibling);

            tr.parentNode.removeChild(tr);
            if (tbody.children.length === 0) {
              table.parentNode.removeChild(table);
            }

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            const isLastColumn = cell === tr.lastElementChild;
            if (isLastColumn) {
              const newTr = document.createElement("tr");
              const numCols = tr.cells.length;
              for (let i = 0; i < numCols; i++) {
                const newTd = document.createElement("td");
                newTd.style.border = "1px solid #d9cab7";
                newTd.style.padding = "6px";
                newTd.style.minWidth = "50px";
                newTd.innerHTML = "<br>";
                newTr.appendChild(newTd);
              }
              tr.parentNode.insertBefore(newTr, tr.nextSibling);

              const newRange = document.createRange();
              newRange.setStart(newTr.firstElementChild, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } else {
              document.execCommand("insertLineBreak", false, null);
            }
          }

          if (onEditorInput) onEditorInput();
          return;
        }
      }

      /* ── Escape Todo list on Enter or add new ── */
      if (isEnter) {
        const todoNode = node.nodeType === 3 ? node.parentElement : node;
        const todoDiv = todoNode?.closest?.("[data-todo]");
        if (todoDiv) {
          event.preventDefault();
          const textContainer = todoDiv.querySelector("div[style*='flex: 1']");
          const textContent = textContainer ? textContainer.innerText.trim() : "";

          if (!textContent) {
            /* Empty todo -> remove it and insert <p><br></p> */
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            todoDiv.parentNode.insertBefore(p, todoDiv.nextSibling);
            todoDiv.parentNode.removeChild(todoDiv);

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            /* Insert new empty todo after the current one */
            const newTodoHtml = `<div data-todo="false" style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span data-todo-checkbox="true" style="cursor: pointer; color: #8b5e3c; display: flex; align-items: center; justify-content: center; user-select: none;" contenteditable="false">${uncheckedIconSvg}</span><div style="flex: 1; outline: none; min-width: 50px;"><br></div></div>`;
            todoDiv.insertAdjacentHTML("afterend", newTodoHtml);
            const newTodo = todoDiv.nextElementSibling;
            const newTextContainer = newTodo.querySelector("div[style*='flex: 1']");

            const newRange = document.createRange();
            newRange.setStart(newTextContainer, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
          if (onEditorInput) onEditorInput();
          return;
        }
      }

      const el = node.nodeType === 3 ? node.parentElement : node;
      const span = el?.closest?.("[data-highlight], [data-img-ref]");
      if (!span) return;

      /* Handle Space, Enter, and all printable characters */
      const isPrintable = event.key.length === 1;
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
            newRange.setStart(span.nextSibling, 0);
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
            newRange.setStart(span.previousSibling, span.previousSibling.length);
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

      if (isEnter) {
        const newRange = document.createRange();
        if (isAtEnd) {
          newRange.setStartAfter(span);
        } else {
          newRange.setStartBefore(span);
        }
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        document.execCommand("insertLineBreak", false, null);
        if (onEditorInput) onEditorInput();
        return;
      }

      /* Create text node outside the span */
      const content = event.key;
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
    [applySlashSuggestion, closeSlashMenu, onEditorInput, slashMenu.selectedIndex, slashMenu.visible, activeSuggestions]
  );

  return (
    <Box
      sx={{
        order: { xs: 1, lg: 2 },
        minWidth: 0,
        width: "100%",
        height: "100%",
        minHeight: 0,
        p: "10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
        background: `linear-gradient(180deg, ${alpha(activeNoteTint, 0.18)} 0%, rgba(255,250,244,0.92) 14%, rgba(248,243,235,0.98) 100%)`,
      }}
    >
      {/* Editor wrapper */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: { xs: 360, lg: 0 },
          width: "100%",
          overflow: "hidden",
          borderRadius: 5,
          background: `linear-gradient(160deg, ${alpha(activeNoteTint, 0.18)} 0%, rgba(255,251,245,0.9) 32%, rgba(246,239,229,0.9) 100%)`,
          border: `1px solid ${alpha(activeNoteTint, 0.16)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 40px ${alpha("#7b5f39", 0.08)}`,
        }}
      >

        <Tooltip
          arrow
          placement="bottom-start"
          slotProps={tooltipSlotProps}
          title={activeNote?.title?.trim() || "Untitled"}
        >
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 22,
              maxWidth: { xs: "calc(100% - 140px)", md: 460 },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <IconButton
              sx={{
                bgcolor: alpha("#fffdf8", 0.78),
                border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
                "&:hover": {
                  bgcolor: alpha("#fffdf8", 0.78),
                }
              }}
              onClick={collapseSidebar}
            >
              <ViewCarouselRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <Box
              sx={{
                borderRadius: 999,
                bgcolor: alpha("#fffdf8", 0.78),
                border: `1px solid ${alpha(activeNoteTint, 0.22)}`,
                boxShadow: `0 10px 24px ${alpha(activeNoteTint, 0.12)}`,
                backdropFilter: "blur(8px)",
                display: 'flex',
                px: 1.1,
                py: 0.65,
              }}
            >
              <Box
                component="input"
                value={activeNote?.title ?? ""}
                placeholder="Untitled"
                onChange={onTitleChange}
                sx={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  bgcolor: "transparent",
                  fontFamily: "inherit",
                  fontSize: 16,
                  lineHeight: 1.25,
                  fontWeight: 800,
                  color: "#2e261f",
                  textOverflow: "ellipsis",
                  "&::placeholder": { color: alpha("#2e261f", 0.4), fontWeight: 600 },
                }}
              />
            </Box>
          </Box>
        </Tooltip>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 22,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: { xs: "calc(100% - 160px)", md: "calc(100% - 520px)" },
            rowGap: 0.75,
          }}
        >
          {showSyncBadge && (
            <Tooltip
              title={syncBadgeState?.lastSyncAt ? `Last synced: ${new Date(syncBadgeState.lastSyncAt).toLocaleString()}` : "Auto-sync is enabled"}
              arrow
              slotProps={tooltipSlotProps}
            >
              <Stack
                direction="row"
                spacing={0.7}
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.55,
                  mr: 0.1,
                  borderRadius: 999,
                  bgcolor: syncIsCurrent ? alpha("#eef9f1", 0.94) : alpha("#fff4e7", 0.96),
                  border: syncIsCurrent ? "1px solid rgba(104, 181, 124, 0.28)" : "1px solid rgba(217, 145, 73, 0.22)",
                  boxShadow: syncIsCurrent
                    ? "0 6px 18px rgba(76, 175, 80, 0.10)"
                    : "0 6px 18px rgba(217, 145, 73, 0.10)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {syncIsCurrent ? (
                  <CloudDoneRoundedIcon sx={{ fontSize: 17, color: "#4b8d5a" }} />
                ) : (
                  <CloudOffRoundedIcon sx={{ fontSize: 17, color: "#c9823c" }} />
                )}
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: syncIsCurrent ? "#2f6d43" : "#9a5a24",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getRelativeSyncLabel()}
                </Typography>
              </Stack>
            </Tooltip>
          )}

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              px: 0.7,
              py: 0.5,
              borderRadius: 999,
              bgcolor: alpha("#fffdf8", 0.78),
              border: `1px solid ${alpha(activeNoteTint, 0.28)}`,
              boxShadow: `0 6px 18px ${alpha(activeNoteTint, 0.12)}`,
              backdropFilter: "blur(8px)",
            }}
          >
            {noteColorOptions.map((option) => {
              const selected = option.value === activeNote?.color;

              return (
                <Box
                  key={option.value}
                  component="button"
                  type="button"
                  aria-label={`Set note color to ${option.label}`}
                  onClick={() => onNoteColorChange?.(option.value)}
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: 0,
                    bgcolor: option.value,
                    boxShadow: selected
                      ? `0 0 0 2px ${alpha("#fffdf8", 0.96)}, 0 0 0 4px ${alpha(option.value, 0.44)}`
                      : `0 0 0 1px ${alpha("#2e261f", 0.08)}`,
                    cursor: "pointer",
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                    "&:hover": { transform: "translateY(-1px) scale(1.05)" },
                  }}
                />
              );
            })}
          </Stack>
          <Tooltip title="Decrease Note Size" arrow slotProps={tooltipSlotProps}>
            <IconButton onMouseDown={(event) => event.preventDefault()} onClick={handleTopFontDecrease} size="small" sx={{ color: "#8b5e3c", bgcolor: alpha("#fffdf8", 0.76), border: "1px solid rgba(139,94,60,0.12)", boxShadow: "0 6px 18px rgba(93,62,40,0.08)", "&:hover": { bgcolor: alpha("#8b5e3c", 0.1) } }}>
              <TextDecreaseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Increase Note Size" arrow slotProps={tooltipSlotProps}>
            <IconButton onMouseDown={(event) => event.preventDefault()} onClick={handleTopFontIncrease} size="small" sx={{ color: "#8b5e3c", bgcolor: alpha("#fffdf8", 0.76), border: "1px solid rgba(139,94,60,0.12)", boxShadow: "0 6px 18px rgba(93,62,40,0.08)", "&:hover": { bgcolor: alpha("#8b5e3c", 0.1) } }}>
              <TextIncreaseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={stickyNotesVisible ? "Hide Sticky Notes" : "Show Sticky Notes"} arrow slotProps={tooltipSlotProps}>
            <IconButton
              onClick={toggleStickyNotesVisibility}
              size="small"
              sx={{
                color: stickyNotesVisible ? "#d97706" : "#9a7653",
                bgcolor: stickyNotesVisible ? alpha("#fff2d8", 0.92) : alpha("#fff8ef", 0.92),
                border: "1px solid rgba(217,119,6,0.12)",
                boxShadow: "0 6px 18px rgba(217,119,6,0.08)",
                "&:hover": { bgcolor: alpha("#f59e0b", 0.2) },
              }}
            >
              <WorkspacesRoundedIcon
                sx={{
                  fontSize: 20,
                  transition: "transform 200ms ease",
                  transform: stickyNotesVisible ? "rotate(0deg)" : "rotate(180deg)",
                }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Sticky Note" arrow slotProps={tooltipSlotProps}>
            <IconButton onClick={onAddStickyNote} size="small" sx={{ color: "#d97706", bgcolor: alpha("#fff2d8", 0.92), border: "1px solid rgba(217,119,6,0.12)", boxShadow: "0 6px 18px rgba(217,119,6,0.08)", "&:hover": { bgcolor: alpha("#f59e0b", 0.2) } }}>
              <StickyNote2RoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          {imageEntries.length > 0 && (
            <Tooltip title="View images & selection" arrow slotProps={tooltipSlotProps}>
              <IconButton
                onMouseDown={(event) => event.preventDefault()}
                onClick={onOpenSelectionPanel}
                size="small"
                sx={{
                  background: "linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 100%)",
                  color: "#fff8f0",
                  width: 32,
                  height: 32,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 6px 18px rgba(92, 61, 46, 0.22)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7a5240 0%, #a87350 100%)",
                    boxShadow: "0 8px 20px rgba(92, 61, 46, 0.26)",
                  },
                }}
              >
                <ViewSidebarRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Decorative blurs */}
        <Box sx={{ position: "absolute", left: -80, top: 40, width: "100%", height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,253,248,0.95) 0%, rgba(255,253,248,0) 72%)", filter: "blur(8px)" }} />
        <Box sx={{ position: "absolute", right: -60, bottom: 24, width: 260, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(activeNoteTint, 0.26)} 0%, rgba(240,230,215,0) 72%)`, filter: "blur(18px)" }} />

        {stickyNotesVisible && (
          <StickyNoteBoard
            notes={stickyNotes}
            activeNoteId={activeNote?.id}
            activeStickyNoteId={activeStickyNoteId}
            editorScrollRef={editorRef}
            scrollTop={editorScrollState.scrollTop}
            viewportHeight={editorScrollState.viewportHeight}
            contentHeight={editorScrollState.contentHeight}
            onSelectLink={onOpenStickyNote}
            onUpdateLink={onUpdateStickyNote}
            onMoveLinkToNote={onMoveStickyNote}
            onDragStateChange={onStickyDragStateChange}
            onDeleteLink={onDeleteStickyNote}
          />
        )}

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
          onInput={handleInput}
          onBlur={handleBlur}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          onDoubleClick={onEditorDoubleClick}
          onMouseMove={onEditorMouseMove}
          onMouseLeave={onEditorMouseLeave}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onScroll={handleEditorScroll}
          onPaste={handlePaste}
          sx={{
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
              xs: `${34 * editorFontScale}px`,
              md: `${52 * editorFontScale}px`,
            },
            lineHeight: {
              xs: clamp(1.18 - (editorFontScale - 1) * 0.08, 1.02, 1.26),
              md: clamp(1.22 - (editorFontScale - 1) * 0.08, 1.06, 1.3),
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
              display: "inline",
              borderRadius: "10px",
              paddingInline: "0.24em",
              paddingBlock: 0,
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
            "& table": { tableLayout: "fixed" },
            "& td, & th": { wordWrap: "break-word", whiteSpace: "normal" }
          }}
        />

        <Box
          sx={{
            position: "fixed",
            left: slashMenu.x,
            top: slashMenu.y,
            opacity: slashMenu.visible && activeSuggestions.length > 0 ? 1 : 0,
            transform: slashMenu.visible && activeSuggestions.length > 0 ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 140ms ease, transform 140ms ease",
            pointerEvents: slashMenu.visible && activeSuggestions.length > 0 ? "auto" : "none",
            zIndex: 1600,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              minWidth: 260,
              maxWidth: 320,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #ddd0c0",
              bgcolor: "#fdf8f1",
              boxShadow: "0 16px 34px rgba(58, 46, 34, 0.18)",
            }}
          >
            <Box sx={{
              px: 1.4, py: 1, borderBottom: "1px solid #ebe1d4", background: "linear-gradient(180deg, #fbf3e8 0%, #f7ecde 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6a5a49", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Commands
              </Typography>
              <KeyboardOptionKeyRoundedIcon sx={{ color: "#6a5a49", fontSize: 16 }} />
            </Box>
            <Stack spacing={0} sx={{ py: 0.5 }}>
              {activeSuggestions.map((item, index) => (
                <Box
                  key={item.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applySlashSuggestion(item);
                  }}
                  sx={{
                    px: 1.4,
                    py: 1,
                    cursor: "pointer",
                    bgcolor: index === slashMenu.selectedIndex ? alpha("#c4956a", 0.12) : "transparent",
                    transition: "background-color 120ms ease",
                    "&:hover": { bgcolor: alpha("#c4956a", 0.12) },
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#352f29" }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#7b6c5c" }}>{item.description}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
