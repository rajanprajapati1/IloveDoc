import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "docbook";
const COLLECTION_SETTINGS = "settings";

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/* POST /api/sync/check-pin — check if a PIN is already taken */
export async function POST(request) {
  try {
    const { pin } = await request.json();
    if (!pin) return NextResponse.json({ error: "PIN is required" }, { status: 400 });

    const db = await getDb();
    const settingsCol = db.collection(COLLECTION_SETTINGS);
    const existing = await settingsCol.findOne({ pin });

    return NextResponse.json({
      exists: !!existing,
      available: !existing,
    });
  } catch (err) {
    console.error("Check PIN error:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
