import "server-only";

import { randomBytes } from "crypto";
import clientPromise from "@/lib/mongodb";
import { getShareExpiryHours } from "@/lib/shareConstants";

const DB_NAME = "docbook";
const COLLECTION_SHARED_NOTES = "shared_notes";
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

let indexSetupPromise = null;

function isValidIsoDate(value) {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildShareId() {
  return randomBytes(9).toString("base64url");
}

function buildManageToken() {
  return randomBytes(18).toString("base64url");
}

export function sanitizeSharedHtml(html = "") {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|meta|link)[^>]*?>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|form|meta|link)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}

export function sanitizeNoteSnapshot(note = {}) {
  const now = new Date().toISOString();
  const fontScale = Number(note?.fontScale);

  return {
    id: typeof note?.id === "string" ? note.id : "",
    title: typeof note?.title === "string" && note.title.trim() ? note.title.trim().slice(0, 180) : "Untitled",
    content: sanitizeSharedHtml(typeof note?.content === "string" && note.content.trim() ? note.content : "<p></p>"),
    color: HEX_COLOR_PATTERN.test(note?.color || "") ? note.color : "#F7E36D",
    fontScale: Number.isFinite(fontScale) ? clamp(fontScale, 0.85, 1.8) : 1,
    createdAt: isValidIsoDate(note?.createdAt) ? note.createdAt : now,
    updatedAt: isValidIsoDate(note?.updatedAt) ? note.updatedAt : now,
  };
}

async function getCollection() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_SHARED_NOTES);

  if (!indexSetupPromise) {
    indexSetupPromise = Promise.all([
      collection.createIndex({ shareId: 1 }, { unique: true, name: "shareId_unique" }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" }),
      collection.createIndex({ noteId: 1 }, { name: "noteId_lookup" }),
    ]);
  }

  await indexSetupPromise;
  return collection;
}

export async function createOrUpdateSharedNote({ note, shareId, manageToken, expiresInHours }) {
  const snapshot = sanitizeNoteSnapshot(note);
  if (!snapshot.id) {
    const error = new Error("A valid note is required.");
    error.status = 400;
    throw error;
  }

  const collection = await getCollection();
  const now = new Date();
  const nowIso = now.toISOString();
  const shareHours = getShareExpiryHours(expiresInHours);
  const expiresAt = new Date(now.getTime() + shareHours * 60 * 60 * 1000).toISOString();
  const safeShareId = typeof shareId === "string" && SHARE_ID_PATTERN.test(shareId) ? shareId : "";
  const safeManageToken = typeof manageToken === "string" && TOKEN_PATTERN.test(manageToken) ? manageToken : "";

  if (safeShareId) {
    const existing = await collection.findOne({ shareId: safeShareId });
    if (existing) {
      if (!safeManageToken || existing.manageToken !== safeManageToken) {
        const error = new Error("This share link can't be updated from this device.");
        error.status = 403;
        throw error;
      }

      await collection.updateOne(
        { shareId: safeShareId },
        {
          $set: {
            noteId: snapshot.id,
            note: snapshot,
            expiresAt,
            updatedAt: nowIso,
          },
        }
      );

      return {
        shareId: safeShareId,
        manageToken: safeManageToken,
        note: snapshot,
        expiresAt,
        createdAt: existing.createdAt || nowIso,
        updatedAt: nowIso,
      };
    }
  }

  const newShareId = buildShareId();
  const newManageToken = buildManageToken();
  const document = {
    shareId: newShareId,
    manageToken: newManageToken,
    noteId: snapshot.id,
    note: snapshot,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt,
  };

  await collection.insertOne(document);

  return {
    shareId: newShareId,
    manageToken: newManageToken,
    note: snapshot,
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function revokeSharedNote({ shareId, manageToken }) {
  const safeShareId = typeof shareId === "string" && SHARE_ID_PATTERN.test(shareId) ? shareId : "";
  const safeManageToken = typeof manageToken === "string" && TOKEN_PATTERN.test(manageToken) ? manageToken : "";
  if (!safeShareId || !safeManageToken) {
    const error = new Error("A valid share ID and manage token are required.");
    error.status = 400;
    throw error;
  }

  const collection = await getCollection();
  const result = await collection.deleteOne({ shareId: safeShareId, manageToken: safeManageToken });
  if (result.deletedCount === 0) {
    const error = new Error("This share link can't be revoked from this device.");
    error.status = 404;
    throw error;
  }

  return { success: true };
}

export async function getSharedNoteState(shareId) {
  const safeShareId = typeof shareId === "string" && SHARE_ID_PATTERN.test(shareId) ? shareId : "";
  if (!safeShareId) return { status: "missing", document: null };

  const collection = await getCollection();
  const document = await collection.findOne({ shareId: safeShareId });
  if (!document) return { status: "missing", document: null };

  const expiresAtMs = new Date(document.expiresAt || "").getTime();
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    return { status: "expired", document };
  }

  return { status: "active", document };
}
