import type { Task } from "./types";

const SUMMARY_API_URL = "https://taskswipe-api.vercel.app/api/summary";

/**
 * Single entry point for all "AI" text completion in the app.
 *
 * Calls a small serverless proxy (Vercel function, see /api/summary.ts) that
 * holds the real Anthropic API key server-side — a static site like this one
 * can't hold secrets safely, since anything in the client bundle is public.
 * Falls back to a local heuristic if the call fails for any reason, so the
 * app still works even if the backend is unreachable or misconfigured.
 */
async function completeText(prompt: string): Promise<string> {
  try {
    return await callSummaryApi(prompt);
  } catch (error) {
    console.error("AI summary API call failed, falling back to local summary:", error);
    await new Promise((resolve) => setTimeout(resolve, 260 + Math.random() * 220));
    return localHeuristicComplete(prompt);
  }
}

async function callSummaryApi(prompt: string): Promise<string> {
  const response = await fetch(SUMMARY_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Summary API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.text?.trim();
  if (!text) throw new Error("Summary API returned an empty response");
  return text;
}

function localHeuristicComplete(prompt: string): string {
  // Placeholder "model": pulls the structured fields back out of the prompt
  // and stitches together a plausible one-sentence summary. Used only when
  // no API key is configured.
  const get = (label: string) => {
    const match = prompt.match(new RegExp(`${label}: (.*)`));
    return match?.[1]?.trim() ?? "";
  };

  const title = get("Title");
  const course = get("Course or sender");
  const source = get("Source");
  const dueBucket = get("Due bucket");
  const hasDescription = get("Has description") === "yes";

  const verb = source === "email" ? "an email follow-up from" : "coursework for";
  const timing =
    dueBucket === "overdue"
      ? "is already past due, so it's worth clearing first"
      : dueBucket === "soon"
        ? "needs attention very soon"
        : dueBucket === "later"
          ? "has some breathing room before it's due"
          : "doesn't have a fixed deadline yet";

  const detailHint = hasDescription
    ? "based on the notes attached, budget focused time rather than a quick skim."
    : "there's no extra detail attached, so a quick check of the source should confirm scope.";

  return `"${title}" is ${verb} ${course || "your coursework"} that ${timing} — ${detailHint}`;
}

export async function generateTaskSummary(task: Task): Promise<string> {
  const dueBucket = classifyDueBucket(task.dueDate);
  const prompt = [
    "Summarize this student task in one encouraging, plain-English sentence.",
    `Title: ${task.title}`,
    `Source: ${task.source}`,
    `Course or sender: ${task.courseOrSender}`,
    `Due bucket: ${dueBucket}`,
    `Has description: ${task.description ? "yes" : "no"}`,
    task.description ? `Description: ${task.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return completeText(prompt);
}

function classifyDueBucket(dueDate: string | null): "overdue" | "soon" | "later" | "none" {
  if (!dueDate) return "none";
  const diffHours = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours < 0) return "overdue";
  if (diffHours <= 24) return "soon";
  return "later";
}

export interface ParsedPastedTask {
  title: string;
  courseOrSender: string;
  dueDate: string | null;
  description: string;
}

/**
 * Stretch-goal paste-in parser. Heuristic line splitter standing in for an
 * AI extraction call — same isolation principle as completeText above.
 */
export async function parsePastedTasks(raw: string): Promise<ParsedPastedTask[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const lines = raw
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);

  return lines.map((line) => {
    const dueMatch = line.match(
      /due\s+([a-z0-9/,: ]+?)(?:\s*[-–—]\s*|$)/i,
    );
    let dueDate: string | null = null;
    if (dueMatch) {
      const parsed = new Date(dueMatch[1]);
      if (!Number.isNaN(parsed.getTime())) dueDate = parsed.toISOString();
    }

    const withoutDue = line.replace(/due\s+[a-z0-9/,: ]+/i, "").trim();
    const parts = withoutDue.split(/\s*[-–—]\s*/);
    const title = parts[0]?.trim() || withoutDue || "Untitled task";
    const courseOrSender = parts[1]?.trim() || "Pasted import";

    return {
      title,
      courseOrSender,
      dueDate,
      description: "",
    };
  });
}
