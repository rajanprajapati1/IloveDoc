export const colorOptions = ["#111827", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

export const defaultNoteContent =
  "<p>Bring your attention to the crown of your head.</p><p>Slowly let your awareness travel down to your forehead, your eyes, and your jaw.</p>";

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
    content: defaultNoteContent,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
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
