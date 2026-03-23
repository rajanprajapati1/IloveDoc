"use client";

export const TABLE_CELL_MIN_WIDTH = 140;

const TABLE_BORDER_COLOR = "#d9cab7";
const TABLE_HEADER_BG = "#f1ebd8";

export function getTableCellStyleString(header = false) {
  const padding = header ? "10px 8px" : "8px";
  const headerStyles = header
    ? ` background-color: ${TABLE_HEADER_BG}; font-weight: bold; text-align: left;`
    : "";

  return `border: 1px solid ${TABLE_BORDER_COLOR}; padding: ${padding}; min-width: ${TABLE_CELL_MIN_WIDTH}px; vertical-align: top;${headerStyles}`;
}

export function applyTableElementStyles(table) {
  if (!table) return;
  table.style.width = "max-content";
  table.style.minWidth = "100%";
  table.style.maxWidth = "none";
  table.style.borderCollapse = "collapse";
  table.style.margin = "12px 0";
  table.style.tableLayout = "auto";
}

export function ensureTableWrapped(table) {
  if (!table) return null;

  applyTableElementStyles(table);

  const existingWrapper = table.parentElement?.closest?.("[data-table-wrap='true']");
  if (existingWrapper && existingWrapper.firstElementChild === table) {
    return existingWrapper;
  }

  const directParent = table.parentElement;
  if (!directParent) return null;

  const wrapper = table.ownerDocument.createElement("div");
  wrapper.setAttribute("data-table-wrap", "true");
  directParent.insertBefore(wrapper, table);
  wrapper.appendChild(table);
  return wrapper;
}

export function getTableRootNode(table) {
  if (!table) return null;
  return table.parentElement?.matches?.("[data-table-wrap='true']") ? table.parentElement : table;
}

export function insertParagraphAfterTable(table) {
  const tableRoot = getTableRootNode(table);
  const parent = tableRoot?.parentNode;
  if (!tableRoot || !parent) return null;

  const paragraph = table.ownerDocument.createElement("p");
  paragraph.innerHTML = "<br>";
  parent.insertBefore(paragraph, tableRoot.nextSibling);
  return paragraph;
}

export function removeTableAndInsertParagraph(table) {
  const paragraph = insertParagraphAfterTable(table);
  const tableRoot = getTableRootNode(table);
  tableRoot?.parentNode?.removeChild(tableRoot);
  return paragraph;
}

export function createTableCell(doc, { header = false } = {}) {
  const cell = doc.createElement(header ? "th" : "td");
  cell.style.cssText = getTableCellStyleString(header);
  cell.innerHTML = "<br>";
  return cell;
}

export function getDefaultTableHtml() {
  const headerCell = `<th style="${getTableCellStyleString(true)}"><br></th>`;
  const bodyCell = `<td style="${getTableCellStyleString(false)}"><br></td>`;
  const tableStyle = "width: max-content; min-width: 100%; max-width: none; border-collapse: collapse; margin: 12px 0; table-layout: auto;";

  return `<div data-table-wrap="true"><table style="${tableStyle}"><tbody><tr>${headerCell}${headerCell}${headerCell}</tr><tr>${bodyCell}${bodyCell}${bodyCell}</tr></tbody></table></div><p><br></p>`;
}
