import type { VercelRequest, VercelResponse } from "@vercel/node";

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const MAX_PROMPT_LENGTH = 4000;

const ALLOWED_ORIGINS = [
  "https://thitiwatkem.github.io",
  "http://localhost:5173",
];

// Best-effort in-memory rate limit. Serverless instances are ephemeral and
// this doesn't share state across instances, but it's a reasonable guard
// against a single hot loop or bot hammering this endpoint during the demo.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  const isAllowedOrigin =
    typeof origin === "string" &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"));

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin as string);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  return isAllowedOrigin;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowed = applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(allowed ? 204 : 403).end();
    return;
  }

  if (!allowed) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests, try again shortly." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    return;
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    res.status(400).json({ error: "Prompt too long" });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 150,
        system:
          "You summarize a student's task in exactly one encouraging, plain-English sentence based on the structured facts given. Reply with only that sentence — no preamble, no quotes around it.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Anthropic API error ${response.status}: ${body.slice(0, 300)}`);
      res.status(502).json({ error: "Upstream AI call failed" });
      return;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) {
      res.status(502).json({ error: "Empty response from AI" });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error("Unexpected error calling Anthropic:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
