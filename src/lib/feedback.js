import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.DOCBOOK_DB_NAME || "docbook";
const COLLECTION_FEEDBACK = "feedback";
export const FEEDBACK_ADMIN_KEY = "rajan";

function normalizeString(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function sanitizeFeedbackInput(payload = {}) {
  const rating = Number(payload.rating);
  const comment = normalizeString(payload.comment, 4000);
  const email = normalizeString(payload.email, 320).toLowerCase();
  const category = normalizeString(payload.category, 80) || "general";
  const page = normalizeString(payload.page, 500);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  if (!comment) {
    return { error: "Feedback message is required." };
  }

  return {
    value: {
      rating,
      comment,
      email,
      category,
      page,
    },
  };
}

export async function getFeedbackCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION_FEEDBACK);
}

export function isValidFeedbackAdminKey(value) {
  return normalizeString(value, 80) === FEEDBACK_ADMIN_KEY;
}
