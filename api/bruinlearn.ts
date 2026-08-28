import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, getClientIp, isRateLimited } from "./_lib/security.js";

const CANVAS_BASE_URL = "https://bruinlearn.ucla.edu";
const RATE_LIMIT_MAX_REQUESTS = 20;

interface CanvasPlannerItem {
  plannable_type: string;
  plannable_date: string | null;
  context_name?: string;
  html_url?: string;
  plannable?: {
    title?: string;
    name?: string;
    description?: string;
    message?: string;
  };
}

interface MappedTask {
  title: string;
  courseOrSender: string;
  dueDate: string | null;
  description: string;
  link: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapPlannerItem(item: CanvasPlannerItem): MappedTask | null {
  const title = item.plannable?.title ?? item.plannable?.name;
  if (!title) return null;

  const rawDescription = item.plannable?.description ?? item.plannable?.message ?? "";
  const description = rawDescription ? stripHtml(rawDescription).slice(0, 500) : "";

  let link: string | null = item.html_url ?? null;
  if (link && !link.startsWith("http")) {
    link = `${CANVAS_BASE_URL}${link}`;
  }

  return {
    title,
    courseOrSender: item.context_name ?? "BruinLearn",
    dueDate: item.plannable_date ?? null,
    description,
    link,
  };
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

  if (isRateLimited("bruinlearn", getClientIp(req), RATE_LIMIT_MAX_REQUESTS)) {
    res.status(429).json({ error: "Too many requests, try again shortly." });
    return;
  }

  const token = req.body?.token;
  if (typeof token !== "string" || !token.trim()) {
    res.status(400).json({ error: "Missing BruinLearn API token" });
    return;
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  try {
    const response = await fetch(
      `${CANVAS_BASE_URL}/api/v1/planner/items?start_date=${todayIso}&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: "application/json",
        },
      },
    );

    if (response.status === 401) {
      res.status(401).json({ error: "That BruinLearn token was rejected — check it's valid." });
      return;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`BruinLearn API error ${response.status}: ${body.slice(0, 300)}`);
      res.status(502).json({ error: "BruinLearn returned an error" });
      return;
    }

    const items: CanvasPlannerItem[] = await response.json();
    const tasks = items.map(mapPlannerItem).filter((t): t is MappedTask => t !== null);

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Unexpected error calling BruinLearn:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
