import type { Task, TaskSource } from "./types";
import { makeId } from "./utils";

const VALID_SOURCES: TaskSource[] = ["bruinlearn", "email", "manual"];

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function findColumn(header: string[], candidates: string[]): number {
  const normalized = header.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index !== -1) return index;
  }
  return -1;
}

export interface CsvParseResult {
  tasks: Task[];
  skippedCount: number;
}

export function parseCsvToTasks(csvText: string): CsvParseResult {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return { tasks: [], skippedCount: 0 };

  const [header, ...dataRows] = rows;
  const titleCol = findColumn(header, ["title", "task", "name"]);
  const courseCol = findColumn(header, ["courseorsender", "course", "sender", "class"]);
  const dueCol = findColumn(header, ["duedate", "due", "deadline"]);
  const descriptionCol = findColumn(header, ["description", "notes", "note"]);
  const linkCol = findColumn(header, ["link", "url"]);
  const sourceCol = findColumn(header, ["source"]);

  if (titleCol === -1) return { tasks: [], skippedCount: rows.length };

  const tasks: Task[] = [];
  let skippedCount = 0;

  for (const row of dataRows) {
    const title = row[titleCol]?.trim();
    if (!title) {
      skippedCount++;
      continue;
    }

    const rawDue = dueCol !== -1 ? row[dueCol]?.trim() : "";
    let dueDate: string | null = null;
    if (rawDue) {
      const parsed = new Date(rawDue);
      dueDate = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    const rawSource = (sourceCol !== -1 ? row[sourceCol]?.trim().toLowerCase() : "") as TaskSource;
    const source: TaskSource = VALID_SOURCES.includes(rawSource) ? rawSource : "bruinlearn";

    tasks.push({
      id: makeId("csv"),
      title,
      source,
      courseOrSender: (courseCol !== -1 ? row[courseCol]?.trim() : "") || "Imported task",
      dueDate,
      description: (descriptionCol !== -1 ? row[descriptionCol]?.trim() : "") || "",
      status: "active",
      reminderAt: null,
      createdAt: new Date().toISOString(),
      link: (linkCol !== -1 ? row[linkCol]?.trim() : "") || null,
    });
  }

  return { tasks, skippedCount };
}
