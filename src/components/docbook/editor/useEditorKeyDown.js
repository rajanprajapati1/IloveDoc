"use client";

import { useCallback } from "react";
import { richTokenBoundarySelector } from "./constants";
import { createTableCell, getTableRootNode, removeTableAndInsertParagraph } from "./tableUtils";
import { uncheckedIconSvg } from "../shared";

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

      /* ── Slash menu keyboard navigation ── */
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

      /* ── Token menu keyboard navigation ── */
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

      /* ── If selection is active, let browser collapse it natively on arrow keys.
             We just return early so our rich-token boundary code doesn't fire. ── */
      if (!sel.isCollapsed) {
        const key = event.key;
        if (key === "ArrowLeft" || key === "ArrowRight") {
          // Don't preventDefault — let the browser collapse naturally (Left→start, Right→end).
          // Return so our rich-token-boundary logic below doesn't also run.
          return;
        }
        // For any other key with an active selection, let the browser handle it.
        return;
      }

      const node = sel.anchorNode;
      if (!node) return;

      const isEnter = event.key === "Enter";

      /* ── Escape standard lists (ul/ol) on Enter if empty ── */
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

      /* ── Escape Table on Enter ── */
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

      /* ── Escape Todo list on Enter ── */
      if (isEnter) {
        const todoNode = node.nodeType === 3 ? node.parentElement : node;
        const todoDiv = todoNode?.closest?.("[data-todo]");
        if (todoDiv) {
          event.preventDefault();
          const textContainer = todoDiv.querySelector("div[style*='flex: 1']");
          const textContent = textContainer ? textContainer.innerText.trim() : "";

          if (!textContent) {
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

      /* ── Rich token boundary management ── */
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
      slashMenu.selectedIndex,
      slashMenu.visible,
      tokenMenu.selectedIndex,
      tokenMenu.visible,
    ]
  );

  return handleEditorKeyDown;
}
