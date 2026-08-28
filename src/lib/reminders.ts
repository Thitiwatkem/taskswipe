import type { NotificationSettings, Task } from "./types";

export interface ReminderOption {
  label: string;
  minutesBefore: number;
}

export const QUICK_REMINDER_OPTIONS: ReminderOption[] = [
  { label: "30 min before", minutesBefore: 30 },
  { label: "1 hour before", minutesBefore: 60 },
  { label: "2 hours before", minutesBefore: 120 },
  { label: "1 day before", minutesBefore: 60 * 24 },
];

export function reminderTimeFor(dueDate: string, minutesBefore: number): string {
  return new Date(new Date(dueDate).getTime() - minutesBefore * 60 * 1000).toISOString();
}

export function computeAutoReminder(
  task: Pick<Task, "source" | "dueDate">,
  settings: NotificationSettings,
): string | null {
  if (!task.dueDate) return null;
  const enabled =
    task.source === "bruinlearn"
      ? settings.bruinlearnEnabled
      : task.source === "email"
        ? settings.emailEnabled
        : settings.manualEnabled;
  if (!enabled) return null;
  return reminderTimeFor(task.dueDate, settings.defaultLeadMinutes);
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";

  const due = new Date(dueDate);
  const now = new Date();
  const time = due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const dayDiff = Math.round(
    (startOfDay(due).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) return `Due today at ${time}`;
  if (dayDiff === 1) return `Due tomorrow at ${time}`;
  if (dayDiff === -1) return `Was due yesterday at ${time}`;
  if (dayDiff < 0) return `Overdue by ${Math.abs(dayDiff)} days — was due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  if (dayDiff <= 6) {
    const weekday = due.toLocaleDateString(undefined, { weekday: "long" });
    return `Due ${weekday} at ${time}`;
  }

  return `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}

export function formatReminderAt(reminderAt: string | null): string {
  if (!reminderAt) return "No reminder set";
  const date = new Date(reminderAt);
  return `Reminder set for ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
