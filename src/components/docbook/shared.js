export const stickyColorOptions = [
  { value: "#FFFFFF", label: "White", ink: "#2d2d2d", shade: "#e8e8e8", edge: "#ffffff", pin: "#d4d4d4" },
  { value: "#F7E36D", label: "Butter", ink: "#3C2B12", shade: "#DEBF49", edge: "#FFF6B5", pin: "#C98B11" },
  { value: "#FFB56A", label: "Apricot", ink: "#482713", shade: "#E98B43", edge: "#FFD6A8", pin: "#D96A1D" },
  { value: "#FF7E73", label: "Coral", ink: "#4B1F1B", shade: "#E35D52", edge: "#FFC0B7", pin: "#C83F34" },
  { value: "#F5A7D7", label: "Blush", ink: "#4B2142", shade: "#D97DB9", edge: "#FFD6F1", pin: "#C54E98" },
  { value: "#64C8F7", label: "Sky", ink: "#11364B", shade: "#329AD6", edge: "#BFE9FF", pin: "#177DB6" },
  { value: "#73E3A7", label: "Mint", ink: "#123A2B", shade: "#42BC79", edge: "#C5F5D8", pin: "#239D60" },
];

export const noteColors = [
  { name: "sunny-yellow", hex: "#FFD84D" },
  { name: "soft-lemon", hex: "#FFF176" },
  { name: "warm-orange", hex: "#FFB74D" },
  { name: "peach", hex: "#FFAB91" },
  { name: "coral", hex: "#FF8A80" },
  { name: "soft-pink", hex: "#F8BBD0" },
  { name: "bubblegum", hex: "#F48FB1" },
  { name: "lavender", hex: "#E1BEE7" },
  { name: "light-purple", hex: "#CE93D8" },
  { name: "periwinkle", hex: "#B39DDB" },
  { name: "sky-blue", hex: "#81D4FA" },
  { name: "soft-blue", hex: "#90CAF9" },
  { name: "mint", hex: "#A5D6A7" },
  { name: "fresh-green", hex: "#81C784" },
  { name: "lime", hex: "#DCE775" },
  { name: "pale-yellow", hex: "#FFF9C4" },
  { name: "aqua", hex: "#80DEEA" },
  { name: "turquoise", hex: "#4DD0E1" },
  { name: "rose", hex: "#F06292" },
  { name: "apricot", hex: "#FFCC80" },
];

export const noteColorOptions = stickyColorOptions.map(({ value, label }) => ({ value, label }));

export const uncheckedIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>`;
export const checkedIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8.29 13.29a.9959.9959 0 0 1-1.41 0L5.71 12.7a.9959.9959 0 0 1 0-1.41c.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.58 7.59z"></path></svg>`;
export const crossIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
export const importantIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>`;
export const todoRowStyle = "display:flex;align-items:center;gap:8px;margin:4px 0;min-height:24px;";
export const todoCheckboxStyle = "cursor:pointer;color:#8b5e3c;display:flex;align-items:center;justify-content:center;user-select:none;flex:0 0 auto;width:20px;height:20px;line-height:0;";
export const todoTextStyle = "flex:1;outline:none;min-width:50px;line-height:1.5;padding-top:0;";
export const todoTextDoneStyle = `${todoTextStyle}text-decoration:line-through;opacity:0.6;`;
export const importantRowStyle = "display:flex;align-items:center;gap:8px;margin:0px 0;min-height:24px;";
export const importantTextStyle = "flex:1;outline:none;min-width:50px;line-height:1.5;padding-top:0;";
export const importantIconStyle = "color:#d32f2f;display:flex;align-items:center;justify-content:center;user-select:none;flex:0 0 auto;width:20px;height:20px;line-height:0;";

function serializeRootAttributes(rootAttributes = {}) {
  return Object.entries(rootAttributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}="${String(value).replace(/"/g, "&quot;")}"`))
    .join(" ");
}

export function createTodoHtml({ checked = false, content = "<br>", trailingParagraph = false, rootAttributes = {} } = {}) {
  const icon = checked ? checkedIconSvg : uncheckedIconSvg;
  const textStyle = checked ? todoTextDoneStyle : todoTextStyle;
  const rootAttrString = serializeRootAttributes(rootAttributes);
  const todoHtml = `<div data-todo="${checked ? "true" : "false"}"${rootAttrString ? ` ${rootAttrString}` : ""} style="${todoRowStyle}"><span data-todo-checkbox="true" style="${todoCheckboxStyle}" contenteditable="false" spellcheck="false">${icon}</span><div data-todo-text="true" style="${textStyle}">${content}</div></div>`;
  return trailingParagraph ? `${todoHtml}<p><br></p>` : todoHtml;
}

export function createImportantHtml({ content = "<br>", rootAttributes = {} } = {}) {
  const rootAttrString = serializeRootAttributes(rootAttributes);
  return `<div data-important="true"${rootAttrString ? ` ${rootAttrString}` : ""} style="${importantRowStyle}"><span data-important-icon="true" style="${importantIconStyle}" contenteditable="false" spellcheck="false">${importantIconSvg}</span><div data-important-text="true" style="${importantTextStyle}">${content}</div></div>`;
}
export const defaultNoteContent = `
<div style="
  max-width:720px;
  margin:80px auto;
  text-align:center;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  color:#2d2d2d;
  line-height:1.7;
">

  <img 
    src="favicon.png"
    style="
    margin:auto;
      width:150px;
      height:150px;
      margin-bottom:20px;
      transform:rotate(-10deg);
    "
  />

  <h1 style="
    font-size:42px;
    margin:0 0 14px 0;
    font-weight:700;
    letter-spacing:-0.02em;
  ">
    Welcome to DocBook
  </h1>

  <p style="
    color:#555;
    margin-bottom:40px;
    line-height: 53px;
  ">
    Your space for clean notes, quick sticky thoughts, and organized ideas.
  </p>

  <div style="
    background:#f6efe2;
    padding:28px 32px;
    border-radius:16px;
    text-align:left;
    margin-bottom:30px;
  ">

    <h2 style="
      margin-top:0;
      font-size:24px;
      margin-bottom:16px;
    letter-spacing:1px;
    ">
      Start here
    </h2>

    <ul style="
      padding-left:20px;
      margin:0;
      font-size:18px;
    ">
      <li style="margin-bottom:10px;letter-spacing:1px;">Write your first note on this page</li>
      <li style="margin-bottom:10px;letter-spacing:1px;">Pick a page color from the top-right palette</li>
      <li style="margin-bottom:10px;letter-spacing:1px;">Add sticky notes for ideas you want floating nearby</li>
      <li style="margin-bottom:10px;letter-spacing:1px;">Use the sidebar to keep everything sorted</li>
    </ul>

  </div>

  <p style="
    font-size:16px;
    color:#777;
    line-height: 53px;
    letter-spacing:1px;
  ">
    Start typing and make this page yours ✨
  </p>

</div>
`;
export const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#f1e8dc",
      color: "#2f2923",
      border: "1px solid #ded2c3",
      boxShadow: "0 8px 24px rgba(53, 43, 34, 0.16)",
      fontSize: 12,
      fontWeight: 600,
    },
  },
  arrow: { sx: { color: "#f1e8dc" } },
};

export function buildId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createNote(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: buildId(),
    title: "Untitled",
    content: "<p></p>",
    links: [],
    color: noteColorOptions[0].value,
    fontScale: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createStickyNote(noteId, overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: buildId(),
    noteId,
    title: "",
    content: "",
    color: stickyColorOptions[Math.floor(Math.random() * stickyColorOptions.length)].value,
    x: 100,
    y: 100,
    createdAt: now,
    ...overrides,
  };
}

export function getStickyColorOption(value) {
  return stickyColorOptions.find((option) => option.value === value) || stickyColorOptions[0];
}

export function plainTextFromHtml(html) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function formatEditedAt(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not saved";
  return parsed.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function normalizeUrl(value) {
  const raw = value.trim();
  if (!raw) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  return `https://${raw}`;
}

export const SOFT_DELETE_DAYS = 7;

export function isExpiredDelete(deletedAt) {
  if (!deletedAt) return false;
  const deleted = new Date(deletedAt);
  const now = new Date();
  const diffMs = now - deleted;
  return diffMs > SOFT_DELETE_DAYS * 24 * 60 * 60 * 1000;
}

export function timeAgoLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
















































// export const stickyColorOptions = [
//   { value: "#F7E36D", label: "Butter", ink: "#3C2B12", shade: "#DEBF49", edge: "#FFF6B5", pin: "#C98B11" },
//   { value: "#FFB56A", label: "Apricot", ink: "#482713", shade: "#E98B43", edge: "#FFD6A8", pin: "#D96A1D" },
//   { value: "#FF7E73", label: "Coral", ink: "#4B1F1B", shade: "#E35D52", edge: "#FFC0B7", pin: "#C83F34" },
//   { value: "#F5A7D7", label: "Blush", ink: "#4B2142", shade: "#D97DB9", edge: "#FFD6F1", pin: "#C54E98" },
//   { value: "#64C8F7", label: "Sky", ink: "#11364B", shade: "#329AD6", edge: "#BFE9FF", pin: "#177DB6" },
//   { value: "#73E3A7", label: "Mint", ink: "#123A2B", shade: "#42BC79", edge: "#C5F5D8", pin: "#239D60" },
// ];

// export const noteColors = [
//   { name: "sunny-yellow", hex: "#FFD84D" },
//   { name: "soft-lemon", hex: "#FFF176" },
//   { name: "warm-orange", hex: "#FFB74D" },
//   { name: "peach", hex: "#FFAB91" },
//   { name: "coral", hex: "#FF8A80" },
//   { name: "soft-pink", hex: "#F8BBD0" },
//   { name: "bubblegum", hex: "#F48FB1" },
//   { name: "lavender", hex: "#E1BEE7" },
//   { name: "light-purple", hex: "#CE93D8" },
//   { name: "periwinkle", hex: "#B39DDB" },
//   { name: "sky-blue", hex: "#81D4FA" },
//   { name: "soft-blue", hex: "#90CAF9" },
//   { name: "mint", hex: "#A5D6A7" },
//   { name: "fresh-green", hex: "#81C784" },
//   { name: "lime", hex: "#DCE775" },
//   { name: "pale-yellow", hex: "#FFF9C4" },
//   { name: "aqua", hex: "#80DEEA" },
//   { name: "turquoise", hex: "#4DD0E1" },
//   { name: "rose", hex: "#F06292" },
//   { name: "apricot", hex: "#FFCC80" }
// ];

// export const noteColorOptions = stickyColorOptions.map(({ value, label }) => ({ value, label }));

// export const uncheckedIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>`;
// export const checkedIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8.29 13.29a.9959.9959 0 0 1-1.41 0L5.71 12.7a.9959.9959 0 0 1 0-1.41c.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.58 7.59z"></path></svg>`;
// export const crossIconSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1.2em; height:1.2em; fill:currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
// export const defaultNoteContent = `
// <p>👋 Welcome to <strong>DocBook</strong>!</p>

// <p>Start writing your thoughts, ideas, or notes here. ✨</p>

// <p>📝 Use this space to capture anything important — tasks, meeting notes, or creative ideas.</p>

// <p>🚀 Your productivity journey starts now. Happy writing!</p>
// `;
// export const tooltipSlotProps = {
//   tooltip: {
//     sx: {
//       bgcolor: "#f1e8dc",
//       color: "#2f2923",
//       border: "1px solid #ded2c3",
//       boxShadow: "0 8px 24px rgba(53, 43, 34, 0.16)",
//       fontSize: 12,
//       fontWeight: 600,
//     },
//   },
//   arrow: { sx: { color: "#f1e8dc" } },
// };

// export function buildId() {
//   if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
//     return crypto.randomUUID();
//   }
//   return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// }

// export function createNote(overrides = {}) {
//   const now = new Date().toISOString();
//   return {
//     id: buildId(),
//     title: "Untitled",
//     content: defaultNoteContent,
//     color: noteColorOptions[0].value,
//     fontScale: 1,
//     createdAt: now,
//     updatedAt: now,
//     ...overrides,
//   };
// }

// export function createStickyNote(noteId, overrides = {}) {
//   const now = new Date().toISOString();
//   return {
//     id: buildId(),
//     noteId,
//     title: "New Idea",
//     content: "Write something here...",
//     color: stickyColorOptions[Math.floor(Math.random() * stickyColorOptions.length)].value,
//     x: 100,
//     y: 100,
//     createdAt: now,
//     ...overrides,
//   };
// }

// export function getStickyColorOption(value) {
//   return stickyColorOptions.find((option) => option.value === value) || stickyColorOptions[0];
// }

// export function plainTextFromHtml(html) {
//   return (html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
// }

// export function formatEditedAt(date) {
//   const parsed = new Date(date);
//   if (Number.isNaN(parsed.getTime())) return "Not saved";
//   return parsed.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// }

// export function normalizeUrl(value) {
//   const raw = value.trim();
//   if (!raw) return "";
//   if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
//   return `https://${raw}`;
// }

// export const SOFT_DELETE_DAYS = 7;

// export function isExpiredDelete(deletedAt) {
//   if (!deletedAt) return false;
//   const deleted = new Date(deletedAt);
//   const now = new Date();
//   const diffMs = now - deleted;
//   return diffMs > SOFT_DELETE_DAYS * 24 * 60 * 60 * 1000;
// }

// export function timeAgoLabel(dateStr) {
//   const date = new Date(dateStr);
//   const now = new Date();
//   const diffMs = now - date;
//   const diffMins = Math.floor(diffMs / 60000);
//   if (diffMins < 1) return "just now";
//   if (diffMins < 60) return `${diffMins}m ago`;
//   const diffHours = Math.floor(diffMins / 60);
//   if (diffHours < 24) return `${diffHours}h ago`;
//   const diffDays = Math.floor(diffHours / 24);
//   if (diffDays === 1) return "1 day ago";
//   return `${diffDays} days ago`;
// }
