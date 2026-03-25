export const DEFAULT_SHARE_EXPIRY_HOURS = 24;

export const SHARE_EXPIRY_OPTIONS = [
  { value: 1, label: "1 hour", description: "Quick handoff" },
  { value: 24, label: "24 hours", description: "Default" },
  { value: 24 * 7, label: "7 days", description: "Team review" },
  { value: 24 * 30, label: "30 days", description: "Longer access" },
];

export function getShareExpiryHours(value) {
  const numericValue = Number(value);
  const match = SHARE_EXPIRY_OPTIONS.find((option) => option.value === numericValue);
  return match?.value || DEFAULT_SHARE_EXPIRY_HOURS;
}

export function buildShareUrl(origin, shareId) {
  if (!origin || !shareId) return "";
  return `${origin.replace(/\/$/, "")}/share/${shareId}`;
}

export function isExpiredAt(expiresAt, nowMs = Date.now()) {
  const expiresMs = new Date(expiresAt || "").getTime();
  return !expiresMs || expiresMs <= nowMs;
}

export function formatTimeRemaining(expiresAt, nowMs = Date.now()) {
  const expiresMs = new Date(expiresAt || "").getTime();
  if (!expiresMs || expiresMs <= nowMs) return "Expired";

  const diffMs = expiresMs - nowMs;
  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 1) return `${minutes}m`;
  return "under 1m";
}
