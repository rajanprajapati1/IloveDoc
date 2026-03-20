import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

const DB_NAME = "docbook";
const COLLECTION_USAGE = "ai_usage";

const PROVIDERS = {
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY,
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "qwen/qwen3.5-122b-a10b",
  },
  cerebras: {
    apiKey: process.env.CEREBRAS_API_KEY,
    url: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "qwen-3-235b-a22b-instruct-2507",
  },
  inception: {
    apiKeys: [
      process.env.INCEPTION_API_KEY_1,
      process.env.INCEPTION_API_KEY_2,
    ].filter(Boolean),
    url: "https://api.inceptionlabs.ai/v1/chat/completions",
    defaultModel: "mercury-2",
  },
};

const MODEL_ALIASES = {
  inception: {
    "Mercury Edit": "mercury-edit",
    "Mercury 2": "mercury-2",
  },
};

const MODEL_ALLOWLIST = {
  inception: new Set([
    "mercury",
    "mercury-2",
    "mercury-coder",
    "mercury-coder-small",
    "mercury-edit",
    "mercury-small",
  ]),
};

const DAILY_PROMPT_LIMIT = Number(process.env.DOCBOOK_AI_DAILY_PROMPT_LIMIT || 10);
const DAILY_TOKEN_LIMIT = Number(process.env.DOCBOOK_AI_DAILY_TOKEN_LIMIT || 120000);
const MAX_INPUT_TOKENS = Number(process.env.DOCBOOK_AI_MAX_INPUT_TOKENS || 24000);
const RESERVED_COMPLETION_TOKENS = Number(process.env.DOCBOOK_AI_RESERVED_COMPLETION_TOKENS || 4000);

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

function getProviderName(model) {
  if (!model || typeof model !== "string") return "nvidia";

  const provider = model.split("/")[0];
  return PROVIDERS[provider] ? provider : "nvidia";
}

function getModelName(model, provider) {
  if (!model) return PROVIDERS[provider].defaultModel;

  const rawModel = model.startsWith(`${provider}/`) ? model.slice(provider.length + 1) : model;
  const normalizedModel = MODEL_ALIASES[provider]?.[rawModel] || rawModel;
  const allowlist = MODEL_ALLOWLIST[provider];

  if (allowlist && !allowlist.has(normalizedModel)) {
    throw new Error(
      `Unsupported ${provider} model "${rawModel}". Allowed models: ${Array.from(allowlist).join(", ")}`
    );
  }

  return normalizedModel;
}

function getApiKey(provider) {
  if (provider === "inception") {
    const keys = PROVIDERS.inception.apiKeys;
    if (keys.length === 0) {
      throw new Error("Missing Inception API key. Set INCEPTION_API_KEY_1 or INCEPTION_API_KEY_2.");
    }

    return keys[Date.now() % keys.length];
  }

  const key = PROVIDERS[provider].apiKey;
  if (!key) throw new Error(`Missing ${provider} API key.`);
  return key;
}

function buildPayload(provider, model, messages) {
  const payload = {
    model,
    messages,
    temperature: 0.7,
    top_p: 0.8,
    stream: true,
  };

  if (provider === "nvidia") {
    return {
      ...payload,
      max_tokens: RESERVED_COMPLETION_TOKENS,
      thinking: true,
      thinking_budget: Math.min(2048, RESERVED_COMPLETION_TOKENS),
      thinking_level: "medium",
      images: true,
    };
  }

  if (provider === "cerebras") {
    return {
      ...payload,
      max_completion_tokens: RESERVED_COMPLETION_TOKENS,
    };
  }

  return {
    ...payload,
    max_tokens: RESERVED_COMPLETION_TOKENS,
  };
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

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}

function estimateMessageTokens(messages) {
  if (!Array.isArray(messages)) return 0;

  return messages.reduce((total, message) => {
    const roleTokens = estimateTokens(message?.role || "");
    const content = message?.content;

    if (typeof content === "string") {
      return total + roleTokens + estimateTokens(content);
    }

    if (Array.isArray(content)) {
      const contentTokens = content.reduce((sum, item) => {
        if (typeof item === "string") return sum + estimateTokens(item);
        if (typeof item?.text === "string") return sum + estimateTokens(item.text);
        if (typeof item?.image_url?.url === "string") return sum + estimateTokens(item.image_url.url);
        return sum;
      }, 0);

      return total + roleTokens + contentTokens;
    }

    return total + roleTokens;
  }, 0);
}

function buildUsageHeaders(usage) {
  const totalPromptLimit = DAILY_PROMPT_LIMIT + (usage.bonusPromptCount || 0);
  return {
    "x-docbook-prompts-limit": String(totalPromptLimit),
    "x-docbook-prompts-remaining": String(Math.max(0, totalPromptLimit - usage.promptCount)),
    "x-docbook-tokens-limit": String(DAILY_TOKEN_LIMIT),
    "x-docbook-tokens-remaining": String(Math.max(0, DAILY_TOKEN_LIMIT - usage.tokenBudgetUsed)),
  };
}

async function reserveUsage(db, usageIdentity) {
  const collection = db.collection(COLLECTION_USAGE);
  const existing =
    (await collection.findOne({
      dayKey: usageIdentity.dayKey,
      ip: usageIdentity.ip,
      clientId: usageIdentity.clientId,
    })) || {
      dayKey: usageIdentity.dayKey,
      ip: usageIdentity.ip,
      clientId: usageIdentity.clientId,
      promptCount: 0,
      tokenBudgetUsed: 0,
      bonusPromptCount: 0,
    };

  const totalPromptLimit = DAILY_PROMPT_LIMIT + (existing.bonusPromptCount || 0);

  if (existing.promptCount + 1 > totalPromptLimit) {
    const nextUsage = {
      promptCount: existing.promptCount,
      tokenBudgetUsed: existing.tokenBudgetUsed,
      bonusPromptCount: existing.bonusPromptCount || 0,
    };

    return {
      allowed: false,
      usage: nextUsage,
      response: NextResponse.json(
        {
          error: "Daily prompt limit reached for this IP/device.",
        },
        {
          status: 429,
          headers: buildUsageHeaders(nextUsage),
        }
      ),
    };
  }

  if (existing.tokenBudgetUsed + usageIdentity.reservedTokens > DAILY_TOKEN_LIMIT) {
    const nextUsage = {
      promptCount: existing.promptCount,
      tokenBudgetUsed: existing.tokenBudgetUsed,
      bonusPromptCount: existing.bonusPromptCount || 0,
    };

    return {
      allowed: false,
      usage: nextUsage,
      response: NextResponse.json(
        {
          error: "Daily token budget reached for this IP/device.",
        },
        {
          status: 429,
          headers: buildUsageHeaders(nextUsage),
        }
      ),
    };
  }

  const updatedUsage = {
    promptCount: existing.promptCount + 1,
    tokenBudgetUsed: existing.tokenBudgetUsed + usageIdentity.reservedTokens,
    bonusPromptCount: existing.bonusPromptCount || 0,
  };

  await collection.updateOne(
    {
      dayKey: usageIdentity.dayKey,
      ip: usageIdentity.ip,
      clientId: usageIdentity.clientId,
    },
    {
      $setOnInsert: {
        createdAt: new Date().toISOString(),
      },
      $set: {
        updatedAt: new Date().toISOString(),
        userAgent: usageIdentity.userAgent,
      },
      $inc: {
        promptCount: 1,
        tokenBudgetUsed: usageIdentity.reservedTokens,
      },
    },
    { upsert: true }
  );

  return {
    allowed: true,
    usage: updatedUsage,
  };
}

async function refundUsage(db, usageIdentity) {
  await db.collection(COLLECTION_USAGE).updateOne(
    {
      dayKey: usageIdentity.dayKey,
      ip: usageIdentity.ip,
      clientId: usageIdentity.clientId,
    },
    {
      $inc: {
        promptCount: -1,
        tokenBudgetUsed: -usageIdentity.reservedTokens,
      },
      $set: {
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function POST(request) {
  let usageIdentity = null;
  let db = null;

  try {
    const rawBody = await request.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request." }, { status: 400 });
    }

    const { messages, model } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const provider = getProviderName(model);
    const config = PROVIDERS[provider];
    const targetModel = getModelName(model, provider);
    const apiKey = getApiKey(provider);
    const payload = buildPayload(provider, targetModel, messages);

    const inputTokens = estimateMessageTokens(messages);
    if (inputTokens > MAX_INPUT_TOKENS) {
      return NextResponse.json(
        { error: `Prompt too large. Maximum input budget is ${MAX_INPUT_TOKENS} estimated tokens.` },
        { status: 413 }
      );
    }

    db = await getDb();
    usageIdentity = {
      dayKey: new Date().toISOString().slice(0, 10),
      ip: getClientIp(request),
      clientId: getClientId(request, body),
      reservedTokens: inputTokens + RESERVED_COMPLETION_TOKENS,
      userAgent: request.headers.get("user-agent") || "",
    };

    const reservation = await reserveUsage(db, usageIdentity);
    if (!reservation.allowed) {
      return reservation.response;
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await refundUsage(db, usageIdentity);
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          ...buildUsageHeaders({
            promptCount: Math.max(0, reservation.usage.promptCount - 1),
            tokenBudgetUsed: Math.max(0, reservation.usage.tokenBudgetUsed - usageIdentity.reservedTokens),
            bonusPromptCount: reservation.usage.bonusPromptCount || 0,
          }),
        },
      });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...buildUsageHeaders(reservation.usage),
      },
    });
  } catch (error) {
    if (db && usageIdentity) {
      try {
        await refundUsage(db, usageIdentity);
      } catch {
        // Ignore secondary refund failures.
      }
    }

    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
