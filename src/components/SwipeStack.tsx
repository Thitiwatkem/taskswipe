import { useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Task } from "@/lib/types";
import type { TaskStore } from "@/store/useTaskStore";
import { TaskCard, type TaskCardHandle } from "@/components/TaskCard";
import { DetailScreen } from "@/components/DetailScreen";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const VISIBLE_CARDS = 3;

export function SwipeStack({ store }: { store: TaskStore }) {
  const { activeTasks, tasks, markDone, setReminder, sessionArchivedCount } = store;
  const [triagedIds, setTriagedIds] = useState<Set<string>>(new Set());
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const topCardRef = useRef<TaskCardHandle>(null);

  const queue = useMemo(
    () => activeTasks.filter((t) => !triagedIds.has(t.id)),
    [activeTasks, triagedIds],
  );

  const visible = queue.slice(0, VISIBLE_CARDS);
  const detailTask: Task | undefined = detailTaskId
    ? tasks.find((t) => t.id === detailTaskId)
    : undefined;

  function handleDecided(task: Task, direction: "left" | "right") {
    setTriagedIds((prev) => new Set(prev).add(task.id));
    if (direction === "right") {
      markDone(task.id);
    } else {
      setDetailTaskId(task.id);
    }
  }

  if (detailTask) {
    return (
      <div className="relative h-full">
        <AnimatePresence>
          <DetailScreen
            key={detailTask.id}
            task={detailTask}
            onSetReminder={(reminderAt) => setReminder(detailTask.id, reminderAt)}
            onBack={() => setDetailTaskId(null)}
          />
        </AnimatePresence>
      </div>
    );
  }

  if (visible.length === 0) {
    return <EmptyState archivedCount={sessionArchivedCount} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        {visible.map((task, i) => (
          <TaskCard
            key={task.id}
            ref={i === 0 ? topCardRef : undefined}
            task={task}
            stackPosition={i}
            isTop={i === 0}
            onDecided={(direction) => handleDecided(task, direction)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 border-2 border-rose-200 text-rose-500 hover:bg-rose-50"
          onClick={() => topCardRef.current?.swipeLeft()}
          aria-label="Keep active and set reminder"
        >
          <X className="h-7 w-7" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 border-2 border-emerald-200 text-emerald-500 hover:bg-emerald-50"
          onClick={() => topCardRef.current?.swipeRight()}
          aria-label="Mark done"
        >
          <Check className="h-7 w-7" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        {queue.length} left in this session &middot; swipe or tap to triage
      </p>
    </div>
  );
}
