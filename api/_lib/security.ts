import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://thitiwatkem.github.io",
  "http://localhost:5173",
];

// Best-effort in-memory rate limit, per endpoint. Serverless instances are
// ephemeral and this doesn't share state across instances, but it's a
// reasonable guard against a single hot loop or bot hammering an endpoint
// during the demo.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitLogs = new Map<string, Map<string, number[]>>();

export function isRateLimited(endpoint: string, ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const log = rateLimitLogs.get(endpoint) ?? new Map<string, number[]>();
  rateLimitLogs.set(endpoint, log);

  const timestamps = (log.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  log.set(ip, timestamps);
  return timestamps.length > maxRequests;
}

export function getClientIp(req: VercelRequest): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
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
