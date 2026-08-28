import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SourceBadge, CategoryBadge } from "@/components/ui/badge";
import { generateTaskSummary } from "@/lib/ai";
import { QUICK_REMINDER_OPTIONS, formatDueDate, formatReminderAt, reminderTimeFor } from "@/lib/reminders";
import { ArrowLeft, BellRing, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailScreenProps {
  task: Task;
  onSetReminder: (reminderAt: string | null) => void;
  onBack: () => void;
}

export function DetailScreen({ task, onSetReminder, onBack }: DetailScreenProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(() => {
    if (!task.dueDate || !task.reminderAt) return null;
    const match = QUICK_REMINDER_OPTIONS.find(
      (option) => reminderTimeFor(task.dueDate!, option.minutesBefore) === task.reminderAt,
    );
    return match?.minutesBefore ?? null;
  });
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    generateTaskSummary(task).then((text) => {
      if (!cancelled) setSummary(text);
    });
    return () => {
      cancelled = true;
    };
  }, [task]);

  function pickQuickOption(minutesBefore: number) {
    setSelectedMinutes(minutesBefore);
    if (!task.dueDate) return;
    onSetReminder(reminderTimeFor(task.dueDate, minutesBefore));
  }

  function applyCustomTime() {
    if (!customValue) return;
    const iso = new Date(customValue).toISOString();
    setSelectedMinutes(null);
    onSetReminder(iso);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="absolute inset-0 z-20 flex flex-col rounded-3xl bg-white p-6 shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SourceBadge source={task.source} />
          <CategoryBadge category={task.category} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Kept active
        </span>
      </div>

      <p className="text-sm font-medium text-ucla-blue-dark">{task.courseOrSender}</p>
      <h2 className="mt-1 text-xl font-bold leading-tight text-ink">{task.title}</h2>

      {task.link && (
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-semibold text-ucla-blue hover:underline"
        >
          Open link
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ucla-blue">
          <Sparkles className="h-3.5 w-3.5" />
          AI summary
        </div>
        {summary ? (
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        ) : (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
          </div>
        )}
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">{formatDueDate(task.dueDate)}</p>

      <div className="mt-5 flex-1 overflow-y-auto no-scrollbar">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <BellRing className="h-3.5 w-3.5" />
          Set a reminder
        </div>

        {task.dueDate ? (
          <div className="grid grid-cols-2 gap-2">
            {QUICK_REMINDER_OPTIONS.map((option) => (
              <button
                key={option.minutesBefore}
                onClick={() => pickQuickOption(option.minutesBefore)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  selectedMinutes === option.minutesBefore
                    ? "border-ucla-blue bg-ucla-blue/10 text-ucla-blue-dark"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            This task has no due date, so quick reminder offsets aren't available — set a custom
            time instead.
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink focus:border-ucla-blue focus:outline-none"
          />
          <Button variant="outline" size="sm" onClick={applyCustomTime}>
            Set
          </Button>
        </div>

        <p className="mt-3 text-xs text-slate-500">{formatReminderAt(task.reminderAt)}</p>
      </div>

      <Button variant="default" size="lg" onClick={onBack} className="mt-4 w-full">
        <ArrowLeft className="h-4 w-4" />
        Back to swiping
      </Button>
    </motion.div>
  );
}
