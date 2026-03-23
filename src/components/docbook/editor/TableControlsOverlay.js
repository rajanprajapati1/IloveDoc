"use client";

import { useCallback, useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  applyTableElementStyles,
  createTableCell,
  ensureTableWrapped,
  removeTableAndInsertParagraph,
} from "./tableUtils";

function findActiveTable(editor) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const nodes = [selection.anchorNode, selection.focusNode]
    .map((node) => (node?.nodeType === 3 ? node.parentElement : node))
    .filter(Boolean);

  const table = nodes.find((node) => node.closest?.("table"))?.closest?.("table");
  if (!table || !editor.contains(table)) return null;
  return table;
}

function focusCell(cell) {
  if (!cell) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getActiveCell(table) {
  const selection = window.getSelection();
  const activeNode = selection?.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : selection?.anchorNode;
  const activeCell = activeNode?.closest?.("td, th");
  return activeCell && table.contains(activeCell) ? activeCell : null;
}

const hiddenState = {
  visible: false,
  table: null,
  columnTop: 0,
  columnLeft: 0,
  rowTop: 0,
  rowLeft: 0,
  deleteTop: 0,
  deleteLeft: 0,
};

export default function TableControlsOverlay({ editorRef, onTableChange }) {
  const [overlayState, setOverlayState] = useState(hiddenState);

  const updateOverlay = useCallback(() => {
    const editor = editorRef?.current;
    if (!editor || typeof window === "undefined") {
      setOverlayState(hiddenState);
      return;
    }

    const table = findActiveTable(editor);
    if (!table) {
      setOverlayState((current) => (current.visible ? hiddenState : current));
      return;
    }

    const editorRect = editor.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();

    if (
      tableRect.bottom < editorRect.top ||
      tableRect.top > editorRect.bottom ||
      tableRect.right < editorRect.left ||
      tableRect.left > editorRect.right
    ) {
      setOverlayState((current) => (current.visible ? hiddenState : current));
      return;
    }

    setOverlayState({
      visible: true,
      table,
      columnTop: Math.max(editorRect.top + 18, tableRect.top + 22),
      columnLeft: Math.min(window.innerWidth - 24, tableRect.right + 14),
      rowTop: Math.min(window.innerHeight - 24, tableRect.bottom + 14),
      rowLeft: Math.min(editorRect.right - 24, Math.max(editorRect.left + 24, tableRect.left + (tableRect.width / 2))),
      deleteTop: Math.max(editorRect.top + 18, tableRect.top + 22),
      deleteLeft: Math.max(editorRect.left + 18, tableRect.left - 14),
    });
  }, [editorRef]);

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return undefined;

    const handleSelectionChange = () => {
      window.requestAnimationFrame(updateOverlay);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("resize", handleSelectionChange);
    editor.addEventListener("scroll", handleSelectionChange);
    editor.addEventListener("input", handleSelectionChange);

    window.requestAnimationFrame(updateOverlay);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleSelectionChange);
      editor.removeEventListener("scroll", handleSelectionChange);
      editor.removeEventListener("input", handleSelectionChange);
    };
  }, [editorRef, updateOverlay]);

  const handleAddColumn = useCallback(() => {
    const editor = editorRef?.current;
    const table = overlayState.table;
    if (!editor || !table || !editor.contains(table)) return;

    ensureTableWrapped(table);
    applyTableElementStyles(table);

    const selection = window.getSelection();
    const activeNode = selection?.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : selection?.anchorNode;
    const activeCell = activeNode?.closest?.("td, th");
    const activeRowIndex = activeCell?.parentElement?.rowIndex ?? 1;

    const rows = Array.from(table.rows);
    rows.forEach((row, rowIndex) => {
      const shouldUseHeader = rowIndex === 0 && Array.from(row.cells).some((cell) => cell.tagName === "TH");
      row.appendChild(createTableCell(document, { header: shouldUseHeader }));
    });

    const focusRow = rows[activeRowIndex] || rows[rows.length - 1];
    focusCell(focusRow?.lastElementChild);
    onTableChange?.();
    window.requestAnimationFrame(updateOverlay);
  }, [editorRef, onTableChange, overlayState.table, updateOverlay]);

  const handleAddRow = useCallback(() => {
    const editor = editorRef?.current;
    const table = overlayState.table;
    if (!editor || !table || !editor.contains(table)) return;

    ensureTableWrapped(table);
    applyTableElementStyles(table);

    const newRow = document.createElement("tr");
    const columnCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length), 1);
    for (let index = 0; index < columnCount; index += 1) {
      newRow.appendChild(createTableCell(document));
    }

    const body = table.tBodies[0] || table;
    body.appendChild(newRow);
    focusCell(newRow.firstElementChild);
    onTableChange?.();
    window.requestAnimationFrame(updateOverlay);
  }, [editorRef, onTableChange, overlayState.table, updateOverlay]);

  const handleRemoveColumn = useCallback(() => {
    const editor = editorRef?.current;
    const table = overlayState.table;
    if (!editor || !table || !editor.contains(table)) return;

    const activeCell = getActiveCell(table);
    const fallbackColumnIndex = Math.max((table.rows[0]?.cells.length || 1) - 1, 0);
    const columnIndex = activeCell?.cellIndex ?? fallbackColumnIndex;
    const rows = Array.from(table.rows);
    rows.forEach((row) => {
      const targetCell = row.cells[Math.min(columnIndex, row.cells.length - 1)];
      targetCell?.remove();
    });

    const hasCellsLeft = Array.from(table.rows).some((row) => row.cells.length > 0);
    if (!hasCellsLeft) {
      const paragraph = removeTableAndInsertParagraph(table);
      focusCell(paragraph);
      onTableChange?.();
      window.requestAnimationFrame(updateOverlay);
      return;
    }

    const nextRow = rows[activeCell?.parentElement?.rowIndex ?? 1] || rows[rows.length - 1];
    const nextIndex = Math.max(0, columnIndex - 1);
    focusCell(nextRow?.cells[Math.min(nextIndex, nextRow.cells.length - 1)]);
    onTableChange?.();
    window.requestAnimationFrame(updateOverlay);
  }, [editorRef, onTableChange, overlayState.table, updateOverlay]);

  const handleRemoveRow = useCallback(() => {
    const editor = editorRef?.current;
    const table = overlayState.table;
    if (!editor || !table || !editor.contains(table)) return;

    const activeCell = getActiveCell(table);
    const targetRow = activeCell?.parentElement || table.rows[table.rows.length - 1];
    if (!targetRow) return;

    const rowIndex = targetRow.rowIndex;
    targetRow.remove();

    if (table.rows.length === 0) {
      const paragraph = removeTableAndInsertParagraph(table);
      focusCell(paragraph);
      onTableChange?.();
      window.requestAnimationFrame(updateOverlay);
      return;
    }

    const nextRow = table.rows[Math.min(rowIndex, table.rows.length - 1)] || table.rows[table.rows.length - 1];
    focusCell(nextRow?.cells[Math.min(activeCell?.cellIndex ?? 0, Math.max(nextRow.cells.length - 1, 0))]);
    onTableChange?.();
    window.requestAnimationFrame(updateOverlay);
  }, [editorRef, onTableChange, overlayState.table, updateOverlay]);

  const handleRemoveTable = useCallback(() => {
    const editor = editorRef?.current;
    const table = overlayState.table;
    if (!editor || !table || !editor.contains(table)) return;

    const paragraph = removeTableAndInsertParagraph(table);
    focusCell(paragraph);
    onTableChange?.();
    window.requestAnimationFrame(updateOverlay);
  }, [editorRef, onTableChange, overlayState.table, updateOverlay]);

  const actionButtonSx = {
    width: 32,
    height: 32,
    border: "1px solid rgba(217, 202, 183, 0.96)",
    background: "rgba(249, 243, 233, 0.98)",
    color: "#5c3d2e",
    boxShadow: `0 10px 24px ${alpha("#5c3d2e", 0.18)}`,
    "&:hover": {
      background: "#fff8f0",
    },
  };

  if (!overlayState.visible) return null;

  return (
    <>
      <Tooltip title="Delete table" arrow>
        <Box sx={{ position: "fixed", top: overlayState.deleteTop, left: overlayState.deleteLeft, transform: "translate(-50%, -50%)", zIndex: 1600 }}>
          <IconButton
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleRemoveTable}
            size="small"
            sx={{
              ...actionButtonSx,
              color: "#a0422d",
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Tooltip>

      <Box sx={{ position: "fixed", top: overlayState.columnTop, left: overlayState.columnLeft, transform: "translate(-50%, -50%)", zIndex: 1600, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Tooltip title="Add column" arrow>
          <IconButton
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleAddColumn}
            size="small"
            sx={actionButtonSx}
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove column" arrow>
          <IconButton
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleRemoveColumn}
            size="small"
            sx={actionButtonSx}
          >
            <RemoveRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ position: "fixed", top: overlayState.rowTop, left: overlayState.rowLeft, transform: "translate(-50%, -50%)", zIndex: 1600, display: "flex", gap: 0.75 }}>
        <Tooltip title="Add row" arrow>
          <IconButton
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleAddRow}
            size="small"
            sx={actionButtonSx}
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove row" arrow>
          <IconButton
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleRemoveRow}
            size="small"
            sx={actionButtonSx}
          >
            <RemoveRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}
