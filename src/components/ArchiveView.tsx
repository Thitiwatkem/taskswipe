import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import type { TaskCategory } from "@/lib/category";
import { CATEGORY_META } from "@/lib/category";
import { SourceBadge, CategoryBadge } from "@/components/ui/badge";
import { Archive, ExternalLink, RotateCcw, Search } from "lucide-react";
import { AiSummaryToggle } from "@/components/AiSummaryToggle";
import { cn } from "@/lib/utils";

interface ArchiveViewProps {
  tasks: Task[];
  onRestore: (id: string) => void;
}

export function ArchiveView({ tasks, onRestore }: ArchiveViewProps) {
  const [filter, setFilter] = useState<TaskCategory | "all">("all");
  const [search, setSearch] = useState("");

  const presentCategories = useMemo(() => {
    const set = new Set<TaskCategory>();
    tasks.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) || t.courseOrSender.toLowerCase().includes(query),
      );
    }
    return result;
  }, [tasks, filter, search]);

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

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search archived tasks…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-ink focus:border-ucla-blue focus:outline-none"
        />
      </div>

      {presentCategories.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          {presentCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={CATEGORY_META[cat].label}
              active={filter === cat}
              onClick={() => setFilter(cat)}
            />
          ))}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {search.trim() ? "No archived tasks match your search." : "No archived tasks in this category."}
        </p>
      ) : (
        <div className="space-y-2 pb-4">
          {filteredTasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 opacity-80">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SourceBadge source={task.source} />
                <CategoryBadge category={task.category} />
              </div>
              {task.doneAt && (
                <span className="text-xs text-slate-400">
                  Done {new Date(task.doneAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-ink line-through decoration-slate-300">
              {task.title}
            </p>
            {task.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ucla-blue hover:underline"
              >
                Open link
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <AiSummaryToggle task={task} />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500">{task.courseOrSender}</p>
              <button
                onClick={() => onRestore(task.id)}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ucla-blue hover:bg-ucla-blue/10"
              >
                <RotateCcw className="h-3 w-3" />
                Reissue
              </button>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-ucla-blue bg-ucla-blue/10 text-ucla-blue-dark"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}
