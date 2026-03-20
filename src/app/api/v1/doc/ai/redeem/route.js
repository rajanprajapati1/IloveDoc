import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

const DB_NAME = "docbook";
const COLLECTION_USAGE = "ai_usage";
const COLLECTION_CODES = "ai_redeem_codes";

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}

function getClientId(request, body) {
  const headerValue = request.headers.get("x-docbook-client-id");
  const bodyValue = typeof body?.clientId === "string" ? body.clientId : "";
  const rawValue = headerValue || bodyValue || "anonymous-device";
  return rawValue.slice(0, 120);
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request." }, { status: 400 });
    }

    const { code } = body;
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Redeem code is required." }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const db = await getDb();
    const codesCollection = db.collection(COLLECTION_CODES);
    const usageCollection = db.collection(COLLECTION_USAGE);

    const ip = getClientIp(request);
    const clientId = getClientId(request, body);
    const dayKey = new Date().toISOString().slice(0, 10);

    // Look up code
    const redeemDoc = await codesCollection.findOne({
      code: normalizedCode,
    });

    if (!redeemDoc) {
      // Let's create a hardcoded fallback for BOOST10 until the user populates their DB
      if (normalizedCode !== "BOOST10") {
        return NextResponse.json({ error: "Invalid or expired redeem code." }, { status: 400 });
      }
    } else {
       if (redeemDoc.usesRemaining !== undefined && redeemDoc.usesRemaining <= 0) {
          return NextResponse.json({ error: "This code has reached its usage limit." }, { status: 400 });
       }
       if (redeemDoc.usedBy && redeemDoc.usedBy.includes(clientId)) {
          return NextResponse.json({ error: "You have already used this code." }, { status: 400 });
       }
    }

    const bonusTokens = redeemDoc?.bonusTokens || 10;

    // Apply the bonus
    await usageCollection.updateOne(
      {
        dayKey,
        ip,
        clientId,
      },
      {
        $setOnInsert: {
          createdAt: new Date().toISOString(),
          promptCount: 0,
          tokenBudgetUsed: 0,
        },
        $set: {
          updatedAt: new Date().toISOString(),
          userAgent: request.headers.get("user-agent") || "",
        },
        $inc: {
          bonusPromptCount: bonusTokens,
        },
      },
      { upsert: true }
    );

    // Deduct usage if from DB
    if (redeemDoc) {
      const updateDoc = {
        $push: { usedBy: clientId }
      };
      if (redeemDoc.usesRemaining !== undefined) {
        updateDoc.$inc = { usesRemaining: -1 };
      }
      await codesCollection.updateOne(
        { _id: redeemDoc._id },
        updateDoc
      );
    }

    return NextResponse.json({ success: true, message: `Redeemed ${bonusTokens} bonus prompts!` });

  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
