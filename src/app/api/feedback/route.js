import { NextResponse } from "next/server";
import { sanitizeFeedbackInput, getFeedbackCollection, isValidFeedbackAdminKey } from "@/lib/feedback";

export const runtime = "nodejs";

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

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = sanitizeFeedbackInput(body);

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const collection = await getFeedbackCollection();
    const now = new Date();
    const userAgent = request.headers.get("user-agent") || "";

    const doc = {
      ...parsed.value,
      ip: getClientIp(request),
      userAgent: userAgent.slice(0, 1000),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const result = await collection.insertOne(doc);

    return NextResponse.json({
      success: true,
      feedback: {
        ...doc,
        _id: String(result.insertedId),
      },
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("admin");

    if (!isValidFeedbackAdminKey(adminKey)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const collection = await getFeedbackCollection();
    const feedback = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json({
      success: true,
      feedback: feedback.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
    });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
