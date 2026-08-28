import type { Task } from "./types";
import { makeId } from "./utils";
import { categorizeTask } from "./category";

interface ParsedEvent {
  summary: string;
  description: string;
  dtstart: string | null;
  url: string | null;
}

function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDate(value: string): string | null {
  // Forms: 20260305T083000Z, 20260305T083000, 20260305
  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/,
  );
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00", zulu] = match;

  if (zulu) {
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseEventBlock(lines: string[]): ParsedEvent {
  let summary = "";
  let description = "";
  let dtstart: string | null = null;
  let url: string | null = null;

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const rawKey = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);
    const key = rawKey.split(";")[0].toUpperCase();

    if (key === "SUMMARY") {
      summary = unescapeIcsText(value).trim();
    } else if (key === "DESCRIPTION") {
      description = unescapeIcsText(value).trim();
    } else if (key === "DTSTART") {
      dtstart = parseIcsDate(value.trim());
    } else if (key === "URL") {
      url = unescapeIcsText(value).trim() || null;
    }
  }

  return { summary, description, dtstart, url };
}

// Canvas/BruinLearn calendar exports suffix the event title with the course
// name in brackets, e.g. "Group Problem Set 2 [262-MGMTFT-403-LEC-3]".
function splitCourseSuffix(summary: string): { title: string; courseOrSender: string } {
  const match = summary.match(/^(.*)\s\[(.+)\]$/);
  if (match) {
    return { title: match[1].trim(), courseOrSender: match[2].trim() };
  }
  return { title: summary, courseOrSender: "Imported calendar" };
}

export interface IcsParseResult {
  tasks: Task[];
  skippedCount: number;
}

export function parseIcsToTasks(icsText: string): IcsParseResult {
  const lines = unfoldLines(icsText);
  const tasks: Task[] = [];
  let skippedCount = 0;

  let currentBlock: string[] | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === "BEGIN:VEVENT") {
      currentBlock = [];
      continue;
    }
    if (trimmed.toUpperCase() === "END:VEVENT") {
      if (currentBlock) {
        const parsed = parseEventBlock(currentBlock);
        if (parsed.summary) {
          const { title, courseOrSender } = splitCourseSuffix(parsed.summary);
          tasks.push({
            id: makeId("ics"),
            title,
            source: "bruinlearn",
            courseOrSender,
            dueDate: parsed.dtstart,
            description: parsed.description,
            status: "active",
            reminderAt: null,
            createdAt: new Date().toISOString(),
            link: parsed.url,
            category: categorizeTask({ title, description: parsed.description }),
          });
        } else {
          skippedCount += 1;
        }
      }
      currentBlock = null;
      continue;
    }
    if (currentBlock) currentBlock.push(line);
  }

  return { tasks, skippedCount };
}
