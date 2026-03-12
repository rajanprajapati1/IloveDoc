import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "docbook";
const COLLECTION_NOTES = "notes";
const COLLECTION_SETTINGS = "settings";

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/* ─── POST /api/sync  (push local → cloud) ─── */
export async function POST(request) {
  try {
    const { pin, notes, images } = await request.json();
    if (!pin) return NextResponse.json({ error: "PIN is required" }, { status: 400 });

    const db = await getDb();

    /* Verify / create user record by PIN */
    const settingsCol = db.collection(COLLECTION_SETTINGS);
    let userSettings = await settingsCol.findOne({ pin });
    if (!userSettings) {
      /* First-time sync – register the PIN */
      await settingsCol.insertOne({
        pin,
        createdAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      });
    }

    const notesCol = db.collection(COLLECTION_NOTES);

    /* Upsert each note under this PIN */
    if (notes && notes.length > 0) {
      const bulkOps = notes.map((note) => ({
        updateOne: {
          filter: { pin, "note.id": note.id },
          update: {
            $set: { pin, note, updatedAt: new Date().toISOString() },
          },
          upsert: true,
        },
      }));
      await notesCol.bulkWrite(bulkOps);
    }

    /* Update last sync timestamp */
    await settingsCol.updateOne({ pin }, { $set: { lastSyncAt: new Date().toISOString() } });

    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Sync push error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

/* ─── GET /api/sync?pin=XXXX  (pull cloud → local) ─── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");
    if (!pin) return NextResponse.json({ error: "PIN is required" }, { status: 400 });

    const db = await getDb();

    /* Verify PIN exists */
    const settingsCol = db.collection(COLLECTION_SETTINGS);
    const userSettings = await settingsCol.findOne({ pin });
    if (!userSettings) {
      return NextResponse.json({ error: "PIN not found. Please create a sync PIN first." }, { status: 404 });
    }

    const notesCol = db.collection(COLLECTION_NOTES);
    const docs = await notesCol.find({ pin }).toArray();
    const notes = docs.map((d) => d.note);

    return NextResponse.json({
      success: true,
      notes,
      lastSyncAt: userSettings.lastSyncAt,
    });
  } catch (err) {
    console.error("Sync pull error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

/* ─── DELETE /api/sync  (remove a note from cloud) ─── */
export async function DELETE(request) {
  try {
    const { pin, noteId } = await request.json();
    if (!pin || !noteId) return NextResponse.json({ error: "PIN and noteId are required" }, { status: 400 });

    const db = await getDb();
    const notesCol = db.collection(COLLECTION_NOTES);
    await notesCol.deleteOne({ pin, "note.id": noteId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sync delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
