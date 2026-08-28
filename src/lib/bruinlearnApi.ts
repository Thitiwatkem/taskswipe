import type { Task } from "./types";
import { makeId } from "./utils";
import { categorizeTask } from "./category";

const BRUINLEARN_API_URL = "https://taskswipe-api.vercel.app/api/bruinlearn";

interface MappedTask {
  title: string;
  courseOrSender: string;
  dueDate: string | null;
  description: string;
  link: string | null;
}

export interface BruinLearnConnectResult {
  tasks: Task[];
}

/**
 * Real Canvas/BruinLearn integration, gated behind a personal access token
 * (Account > Settings > New Access Token in BruinLearn) — not a live demo
 * feature since we don't have a token to test against yet, but this is a
 * genuine API call, not a mock, and should work as soon as one is entered.
 */
export async function connectBruinLearn(token: string): Promise<BruinLearnConnectResult> {
  const response = await fetch(BRUINLEARN_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `BruinLearn connection failed (${response.status})`);
  }

  const mapped: MappedTask[] = data.tasks ?? [];
  const tasks: Task[] = mapped.map((item) => ({
    id: makeId("bruinlearn"),
    title: item.title,
    source: "bruinlearn",
    courseOrSender: item.courseOrSender,
    dueDate: item.dueDate,
    description: item.description,
    status: "active",
    reminderAt: null,
    createdAt: new Date().toISOString(),
    link: item.link,
    category: categorizeTask({ title: item.title, description: item.description }),
  }));

  return { tasks };
}
