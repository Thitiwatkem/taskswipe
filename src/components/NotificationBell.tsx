import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { formatDueDate } from "@/lib/reminders";
import { generateUpcomingBriefing } from "@/lib/ai";
import { Bell, Sparkles } from "lucide-react";

const DUE_SOON_HOURS = 48;

export function NotificationBell({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate)
        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
        .slice(0, 5),
    [tasks],
  );

  const dueSoonCount = useMemo(
    () =>
      upcoming.filter((t) => (new Date(t.dueDate!).getTime() - Date.now()) / 36e5 <= DUE_SOON_HOURS)
        .length,
    [upcoming],
  );

  async function loadBriefing() {
    setLoadingBriefing(true);
    const text = await generateUpcomingBriefing(upcoming);
    setBriefing(text);
    setLoadingBriefing(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Upcoming tasks"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <Bell className="h-4 w-4" />
        {dueSoonCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[80vw] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Coming up
            </p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing on the horizon.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ucla-blue">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI plan
                </div>
                {briefing ? (
                  <p className="text-xs leading-relaxed text-slate-600">{briefing}</p>
                ) : loadingBriefing ? (
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-2.5 w-4/5 animate-pulse rounded bg-slate-200" />
                  </div>
                ) : (
                  <button
                    onClick={loadBriefing}
                    className="text-xs font-semibold text-ucla-blue hover:underline"
                  >
                    Generate a plan for what's next
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
