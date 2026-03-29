"use client";

import { useCallback } from "react";
import { richTokenBoundarySelector } from "./constants";
import { createTableCell, getTableRootNode, removeTableAndInsertParagraph } from "./tableUtils";
import { createTodoHtml } from "../shared";

const editableTextSelector = "div[data-todo-text]";
const meaningfulContentSelector = "img, table, [data-note-ref], [data-user-mention], [data-folder-ref], [data-location-ref], [data-highlight]";
const blockShortcutSelector = "p, div, li, blockquote, h1, h2, h3, h4, h5, h6";

function getEditableTextContainer(block) {
  return block?.querySelector?.(editableTextSelector) || null;
}

function hasMeaningfulFragmentContent(fragment) {
  if (!fragment) return false;

  const textContent = (fragment.textContent || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();

  if (textContent) return true;
  return typeof fragment.querySelector === "function" && Boolean(fragment.querySelector(meaningfulContentSelector));
}

function hasMeaningfulBlockContent(block) {
  const contentRoot = getEditableTextContainer(block) || block;
  if (!contentRoot) return false;
  return hasMeaningfulFragmentContent(contentRoot.cloneNode(true));
}

function placeCaret(selection, container, atEnd = false) {
  if (!selection || !container) return;
  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(!atEnd);
  selection.removeAllRanges();
  selection.addRange(range);
}

function buildEditorMarkerId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function replaceSelectedBlock(selection, block, editor, htmlFactory, markerPrefix) {
  if (!selection || !block || !editor) return null;

  const markerId = buildEditorMarkerId(markerPrefix);
  const html = htmlFactory(markerId);

  if (block === editor) {
    // Replacing entire editor content uses execCommand so undo still works.
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("insertHTML", false, html);
  } else {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const newNode = temp.firstElementChild;

    if (newNode && block.parentNode) {
      block.parentNode.replaceChild(newNode, block);
    }
  }

  const inserted = editor.querySelector(`[data-editor-marker="${markerId}"]`);
  if (inserted) {
    inserted.removeAttribute("data-editor-marker");
  }
  return inserted;
}

function canUseEditorAsShortcutBlock(editor) {
  if (!editor) return false;
  if (editor.querySelector("br")) return false;
  if (editor.querySelector(blockShortcutSelector)) return false;
  if (editor.querySelector("div")) return false;
  for (const child of Array.from(editor.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && /[\r\n]/.test(child.textContent || "")) {
      return false;
    }
  }
  return true;
}

function hasInlineLineBreakText(node) {
  return Array.from(node?.childNodes || []).some(
    (child) => child.nodeType === Node.TEXT_NODE && /[\r\n]/.test(child.textContent || "")
  );
}

function getShortcutBlockElement(node, editor, options = {}) {
  const { allowTodo = false } = options;
  const element = node?.nodeType === 3 ? node.parentElement : node;
  if (!element || !editor) return null;

  const todoBlock = allowTodo ? element.closest?.("[data-todo]") : null;
  if (todoBlock && editor.contains(todoBlock)) return todoBlock;

  if (element.closest?.("[data-todo]")) return null;

  const block = element.closest?.(blockShortcutSelector);
  if (!block) {
    if ((node?.parentNode === editor || element === editor) && canUseEditorAsShortcutBlock(editor)) return editor;
    return null;
  }
  if (block === editor) return canUseEditorAsShortcutBlock(editor) ? editor : null;
  if (!editor.contains(block)) return null;
  if (block.tagName === "DIV" && block.querySelector("br")) return null;
  if (block.tagName === "DIV" && hasInlineLineBreakText(block)) return null;
  return block;
}

function getBlockContentHtml(block) {
  const contentRoot = getEditableTextContainer(block);
  if (contentRoot) {
    return hasMeaningfulFragmentContent(contentRoot.cloneNode(true)) ? contentRoot.innerHTML : "<br>";
  }
  return hasMeaningfulBlockContent(block) ? block.innerHTML : "<br>";
}

function getSuffixShortcutContext(selection, node, block, markerRegex) {
  if (!selection || !node || node.nodeType !== 3 || !block) return null;

  const textBeforeCaret = node.nodeValue.slice(0, selection.anchorOffset);
  const markerMatch = textBeforeCaret.match(markerRegex);
  if (!markerMatch) return null;

  const markerStart = selection.anchorOffset - markerMatch[0].length;

  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(block);
  beforeRange.setEnd(node, markerStart);
  if (!hasMeaningfulFragmentContent(beforeRange.cloneContents())) return null;

  const afterRange = document.createRange();
  afterRange.selectNodeContents(block);
  afterRange.setStart(node, selection.anchorOffset);
  if (hasMeaningfulFragmentContent(afterRange.cloneContents())) return null;

  return { markerStart };
}

/**
 * Hook for the editor's keyDown handler.
 * Handles slash/token menu navigation, list/table/todo escape, and rich-token boundary management.
 *
 * @param {Object} params
 * @param {Object}   params.slashMenu
 * @param {Function} params.setSlashMenu
 * @param {Array}    params.activeSuggestions
 * @param {Function} params.applySlashSuggestion
 * @param {Function} params.closeSlashMenu
 * @param {Object}   params.tokenMenu
 * @param {Function} params.setTokenMenu
 * @param {Array}    params.activeTokenSuggestions
 * @param {Function} params.applyTokenSuggestion
 * @param {Function} params.closeTokenMenu
 * @param {Function} params.onEditorInput
 */
export default function useEditorKeyDown({
  slashMenu,
  setSlashMenu,
  activeSuggestions,
  applySlashSuggestion,
  closeSlashMenu,
  tokenMenu,
  setTokenMenu,
  activeTokenSuggestions,
  applyTokenSuggestion,
  closeTokenMenu,
  onEditorInput,
}) {
  const handleEditorKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      /* -- Slash menu keyboard navigation -- */
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

      /* -- Token menu keyboard navigation -- */
      if (tokenMenu.visible && activeTokenSuggestions.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setTokenMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % activeTokenSuggestions.length }));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setTokenMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + activeTokenSuggestions.length) % activeTokenSuggestions.length }));
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          closeTokenMenu();
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          applyTokenSuggestion(activeTokenSuggestions[tokenMenu.selectedIndex] || activeTokenSuggestions[0]);
          return;
        }
      }

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      /* -- If selection is active, let browser collapse it natively on arrow keys.
             We just return early so our rich-token boundary code doesn't fire. -- */
      if (!sel.isCollapsed) {
        const key = event.key;
        if (key === "ArrowLeft" || key === "ArrowRight") {
          // Don't preventDefault; let the browser collapse naturally (Left=start, Right=end).
          // Return so our rich-token-boundary logic below doesn't also run.
          return;
        }
        // For any other key with an active selection, let the browser handle it.
        return;
      }

      const node = sel.anchorNode;
      if (!node) return;

      const isEnter = event.key === "Enter";

      /* -- Escape standard lists (ul/ol) on Enter if empty -- */
      if (isEnter) {
        const liNode = node.nodeType === 3 ? node.parentElement : node;
        const li = liNode?.closest?.("li");
        if (li) {
          const list = li.closest("ul, ol");
          const isEmpty = !li.textContent.trim() || li.textContent === "\u200B";

          if (isEmpty) {
            event.preventDefault();
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            if (list && list.parentNode) {
              list.parentNode.insertBefore(p, list.nextSibling);
            }
            li.parentNode.removeChild(li);
            if (list && list.children.length === 0 && list.parentNode) {
              list.parentNode.removeChild(list);
            }
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

      /* -- Escape Table on Enter -- */
      if (isEnter) {
        const cellNode = node.nodeType === 3 ? node.parentElement : node;
        const cell = cellNode?.closest?.("td, th");
        if (cell) {
          event.preventDefault();
          const tr = cell.closest("tr");
          const table = cell.closest("table");
          const tbody = tr.parentNode;
          const isRowEmpty = Array.from(tr.cells).every((c) => c.textContent.trim() === "" && !c.querySelector("img"));

          if (isRowEmpty) {
            tr.parentNode.removeChild(tr);
            const tableRoot = getTableRootNode(table);
            const insertAfterNode = tableRoot?.nextSibling || null;
            const parentNode = tableRoot?.parentNode;
            let p = document.createElement("p");
            p.innerHTML = "<br>";

            if (tbody.children.length === 0) {
              p = removeTableAndInsertParagraph(table) || p;
            } else if (parentNode) {
              parentNode.insertBefore(p, insertAfterNode);
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
                const newTd = createTableCell(document);
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

      /* -- Escape Todo list on Enter -- */
      if (isEnter) {
        const todoNode = node.nodeType === 3 ? node.parentElement : node;
        const todoDiv = todoNode?.closest?.("[data-todo]");
        if (todoDiv) {
          event.preventDefault();
          const textContainer = getEditableTextContainer(todoDiv);
          const hasContent = hasMeaningfulBlockContent(todoDiv);

          if (!hasContent) {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            todoDiv.parentNode.insertBefore(p, todoDiv.nextSibling);
            todoDiv.parentNode.removeChild(todoDiv);
            placeCaret(sel, p);
          } else {
            const newTodoHtml = createTodoHtml();
            todoDiv.insertAdjacentHTML("afterend", newTodoHtml);
            const newTodo = todoDiv.nextElementSibling;
            const newTextContainer = getEditableTextContainer(newTodo);
            placeCaret(sel, newTextContainer || textContainer || newTodo);
          }
          if (onEditorInput) onEditorInput();
          return;
        }
      }

      /* -- Auto-format "[] " to Todo Block -- */
      if (event.key === " " && sel.isCollapsed && node.nodeType === 3) {
        const editorEl = node.parentElement?.closest?.("[contenteditable='true']");
        const blockEl = getShortcutBlockElement(node, editorEl);
        const shortcutContext = getSuffixShortcutContext(sel, node, blockEl, /\s\[\]$/);

        if (shortcutContext && editorEl) {
          event.preventDefault();
          node.nodeValue = `${node.nodeValue.slice(0, shortcutContext.markerStart)}${node.nodeValue.slice(sel.anchorOffset)}`;
          const content = hasMeaningfulBlockContent(blockEl) ? blockEl.innerHTML : "<br>";
          const inserted = replaceSelectedBlock(
            sel,
            blockEl,
            editorEl,
            (markerId) => createTodoHtml({ content, rootAttributes: { "data-editor-marker": markerId } }),
            "todo"
          );
          placeCaret(sel, getEditableTextContainer(inserted) || inserted, true);

          if (onEditorInput) onEditorInput();
          return;
        }
      }

      /* -- Rich token boundary management -- */
      const el = node.nodeType === 3 ? node.parentElement : node;
      const span = el?.closest?.(richTokenBoundarySelector);
      if (!span) return;

      const isPrintable = event.key.length === 1;
      const isArrowRight = event.key === "ArrowRight";
      const isArrowLeft = event.key === "ArrowLeft";

      if (!isPrintable && !isEnter && !isArrowRight && !isArrowLeft) return;

      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);
      const cursorRange = sel.getRangeAt(0);

      const isAtStart = cursorRange.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0;
      const isAtEnd = cursorRange.compareBoundaryPoints(Range.START_TO_END, spanRange) >= 0;

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
    [
      activeSuggestions,
      activeTokenSuggestions,
      applySlashSuggestion,
      applyTokenSuggestion,
      closeSlashMenu,
      closeTokenMenu,
      onEditorInput,
      setSlashMenu,
      setTokenMenu,
      slashMenu.selectedIndex,
      slashMenu.visible,
      tokenMenu.selectedIndex,
      tokenMenu.visible,
    ]
  );

  return handleEditorKeyDown;
}

