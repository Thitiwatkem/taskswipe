import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { SourceBadge, CategoryBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDueDate } from "@/lib/reminders";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { AiSummaryToggle } from "@/components/AiSummaryToggle";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tasksWithDueDate = useMemo(() => tasks.filter((t) => t.dueDate), [tasks]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const gridDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      return day;
    });
  }, [cursor]);

  function tasksForDay(day: Date) {
    return tasksWithDueDate.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  }

  const selectedTasks = selectedDate ? tasksForDay(selectedDate) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {gridDays.map((day, i) => {
          const dayTasks = tasksForDay(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex h-12 flex-col items-center justify-start rounded-lg border border-transparent pt-1 text-xs transition-colors",
                inMonth ? "text-ink" : "text-slate-300",
                isToday && "border-ucla-gold",
                isSelected && "bg-ucla-blue text-white",
              )}
            >
              <span>{day.getDate()}</span>
              {dayTasks.length > 0 && (
                <span
                  className={cn(
                    "mt-0.5 h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-white" : "bg-ucla-blue",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
        {selectedDate ? (
          selectedTasks.length > 0 ? (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <SourceBadge source={task.source} />
                      <CategoryBadge category={task.category} />
                    </div>
                    <span className="text-xs text-slate-400">{formatDueDate(task.dueDate)}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.courseOrSender}</p>
                  {task.link && (
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-ucla-blue hover:underline"
                    >
                      Open link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <AiSummaryToggle task={task} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400">Nothing due on this day.</p>
          )
        ) : (
          <p className="text-center text-sm text-slate-400">Tap a day to see what's due.</p>
        )}
      </div>
    </div>
  );
}
