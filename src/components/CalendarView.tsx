import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { SourceBadge, CategoryBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDueDate } from "@/lib/reminders";
import { ChevronLeft, ChevronRight, ExternalLink, StickyNote } from "lucide-react";
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

interface CalendarViewProps {
  tasks: Task[];
  onUpdateNotes: (id: string, notes: string) => void;
}

type CalendarMode = "month" | "week" | "day";

export function CalendarView({ tasks, onUpdateNotes }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<CalendarMode>("month");

  const tasksWithDueDate = useMemo(() => tasks.filter((t) => t.dueDate), [tasks]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dayLabel = cursor.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [cursor]);

  const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  function tasksForDay(day: Date) {
    return tasksWithDueDate.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  }

  function switchMode(next: CalendarMode) {
    if (next !== "month") setCursor(selectedDate ?? cursor);
    setMode(next);
  }

  function goPrev() {
    setCursor((prev) => {
      if (mode === "month") return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (mode === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
    });
  }

  function goNext() {
    setCursor((prev) => {
      if (mode === "month") return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (mode === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
    });
  }

  const tasksToShow =
    mode === "day" ? tasksForDay(cursor) : selectedDate ? tasksForDay(selectedDate) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="truncate text-lg font-bold text-ink">
          {mode === "month" ? monthLabel : mode === "week" ? weekLabel : dayLabel}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => switchMode("month")}
              className={cn(
                "rounded-full px-2 py-1 transition-colors",
                mode === "month" ? "bg-white text-ucla-blue shadow-sm" : "text-slate-500",
              )}
            >
              Month
            </button>
            <button
              onClick={() => switchMode("week")}
              className={cn(
                "rounded-full px-2 py-1 transition-colors",
                mode === "week" ? "bg-white text-ucla-blue shadow-sm" : "text-slate-500",
              )}
            >
              Week
            </button>
            <button
              onClick={() => switchMode("day")}
              className={cn(
                "rounded-full px-2 py-1 transition-colors",
                mode === "day" ? "bg-white text-ucla-blue shadow-sm" : "text-slate-500",
              )}
            >
              Day
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(mode === "month" || mode === "week") && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i}>{label}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {(mode === "month" ? gridDays : weekDays).map((day, i) => {
              const dayTasks = tasksForDay(day);
              const inMonth = mode === "month" ? day.getMonth() === cursor.getMonth() : true;
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
        </>
      )}

      <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
        {tasksToShow === null ? (
          <p className="text-center text-sm text-slate-400">Tap a day to see what's due.</p>
        ) : tasksToShow.length > 0 ? (
          <div className="space-y-2">
            {tasksToShow.map((task) => (
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
                <TaskNoteEditor task={task} onUpdateNotes={onUpdateNotes} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">Nothing due on this day.</p>
        )}
      </div>
    </div>
  );
}

function TaskNoteEditor({
  task,
  onUpdateNotes,
}: {
  task: Task;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(!!task.notes);
  const [value, setValue] = useState(task.notes ?? "");

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-ucla-blue"
      >
        <StickyNote className="h-3 w-3" />
        Add note
      </button>
    );
  }

  return (
    <div className="mt-1.5">
      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
        <StickyNote className="h-3 w-3" />
        Note
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onUpdateNotes(task.id, e.target.value);
        }}
        placeholder="Add a note…"
        rows={2}
        className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-ink focus:border-ucla-blue focus:outline-none"
      />
    </div>
  );
}
