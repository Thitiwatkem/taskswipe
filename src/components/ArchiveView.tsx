import type { Task } from "@/lib/types";
import { SourceBadge } from "@/components/ui/badge";
import { Archive } from "lucide-react";

export function ArchiveView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
        <Archive className="mb-3 h-8 w-8" />
        <p className="text-sm">Nothing archived yet — swipe right on a few tasks.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <h2 className="mb-3 text-lg font-bold text-ink">Archive</h2>
      <div className="space-y-2 pb-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 opacity-80">
            <div className="mb-1 flex items-center justify-between">
              <SourceBadge source={task.source} />
              {task.doneAt && (
                <span className="text-xs text-slate-400">
                  Done {new Date(task.doneAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-ink line-through decoration-slate-300">
              {task.title}
            </p>
            <p className="text-xs text-slate-500">{task.courseOrSender}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
