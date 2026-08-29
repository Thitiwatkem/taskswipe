import { useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Task } from "@/lib/types";
import type { TaskStore } from "@/store/useTaskStore";
import { TaskCard, type TaskCardHandle, type SwipeDirection } from "@/components/TaskCard";
import { DetailScreen } from "@/components/DetailScreen";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { computeAutoReminder } from "@/lib/reminders";
import { Check, ChevronUp, X } from "lucide-react";

const VISIBLE_CARDS = 3;

interface SwipeStackProps {
  store: TaskStore;
  onNavigateToCalendar: () => void;
}

export function SwipeStack({ store, onNavigateToCalendar }: SwipeStackProps) {
  const { activeTasks, tasks, settings, markDone, setReminder, updateNotes, sessionArchivedCount } =
    store;
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

  function handleDecided(task: Task, direction: SwipeDirection) {
    // Swipe up is a navigation shortcut to the Calendar tab, not a triage
    // decision — leave the task in the queue untouched.
    if (direction === "up") {
      onNavigateToCalendar();
      return;
    }

    setTriagedIds((prev) => new Set(prev).add(task.id));

    if (direction === "right") {
      markDone(task.id);
      return;
    }

    // Plain "keep" swipe. With the setting on, silently apply the default
    // reminder (if one isn't already set) instead of opening the detail
    // screen — that's reserved for tapping the card. With it off, fall
    // back to the original behavior of opening the detail screen here too,
    // so a manual reminder can still be picked.
    if (settings.autoApplyDefaultOnSwipeLeft) {
      if (!task.reminderAt) {
        const auto = computeAutoReminder(task, settings);
        if (auto) setReminder(task.id, auto);
      }
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
            onUpdateNotes={(notes) => updateNotes(detailTask.id, notes)}
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
            onOpenDetails={() => setDetailTaskId(task.id)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-5">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 border-2 border-rose-200 text-rose-500 hover:bg-rose-50"
          onClick={() => topCardRef.current?.swipeLeft()}
          aria-label="Keep active"
        >
          <X className="h-7 w-7" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 border-2 border-ucla-blue/30 text-ucla-blue hover:bg-ucla-blue/10"
          onClick={() => topCardRef.current?.swipeUp()}
          aria-label="Go to calendar"
        >
          <ChevronUp className="h-5 w-5" />
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
        {queue.length} left in this session &middot; swipe to triage &middot; tap for details
      </p>
    </div>
  );
}
