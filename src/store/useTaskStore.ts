import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationSettings, Task } from "@/lib/types";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/types";
import { generateSeedTasks } from "@/lib/seed";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { makeId } from "@/lib/utils";
import { computeAutoReminder } from "@/lib/reminders";
import { categorizeTask, type TaskCategory } from "@/lib/category";

const TASKS_KEY = "tasks";
const SETTINGS_KEY = "settings";
const ONBOARDED_KEY = "hasOnboarded";

// The real Build-a-Thon deadline moved — correct it for accounts that seeded
// before this changed, since seed.ts alone only affects fresh onboarding.
const BUILD_A_THON_TITLE = "Build-A-Thon: Parker-Easton Project Submission Deadline";
const BUILD_A_THON_DUE = "2026-08-30T12:00:00";

interface LastSwipeAction {
  taskId: string;
  prevTask: Task;
  kind: "done" | "keep";
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    // Backfill category for tasks persisted before this field existed —
    // otherwise CATEGORY_META lookups would break on old saved data.
    loadFromStorage<Task[]>(TASKS_KEY, [])
      .map((t) => (t.category ? t : { ...t, category: categorizeTask(t) }))
      .map((t) =>
        t.title === BUILD_A_THON_TITLE && t.dueDate !== BUILD_A_THON_DUE
          ? { ...t, dueDate: BUILD_A_THON_DUE }
          : t,
      ),
  );
  const [settings, setSettings] = useState<NotificationSettings>(() => ({
    // Merge over the defaults so fields added after a user's first visit
    // (like autoApplyDefaultOnSwipeLeft) don't silently come back as
    // undefined for settings saved by an older version of the app.
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...loadFromStorage(SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS),
  }));
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() =>
    loadFromStorage(ONBOARDED_KEY, false),
  );
  const [sessionArchivedCount, setSessionArchivedCount] = useState(0);
  const [lastAction, setLastAction] = useState<LastSwipeAction | null>(null);
  const [lastUndoneTaskId, setLastUndoneTaskId] = useState<string | null>(null);

  useEffect(() => saveToStorage(TASKS_KEY, tasks), [tasks]);
  useEffect(() => saveToStorage(SETTINGS_KEY, settings), [settings]);
  useEffect(() => saveToStorage(ONBOARDED_KEY, hasOnboarded), [hasOnboarded]);

  const beginWithSeedData = useCallback(() => {
    setTasks((prev) => {
      if (prev.length > 0) return prev;
      return generateSeedTasks().map((t) => ({
        ...t,
        reminderAt: computeAutoReminder(t, settings),
      }));
    });
    setHasOnboarded(true);
  }, [settings]);

  const markDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "done", doneAt: new Date().toISOString() } : t,
      ),
    );
    setSessionArchivedCount((c) => c + 1);
  }, []);

  const setReminder = useCallback((id: string, reminderAt: string | null) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, reminderAt } : t)));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
  }, []);

  // Snapshot a task right before a swipe mutates it, so a shake gesture can
  // put it back exactly as it was.
  const recordAction = useCallback((task: Task, kind: "done" | "keep") => {
    setLastAction({ taskId: task.id, prevTask: task, kind });
  }, []);

  const undoLast = useCallback(() => {
    setLastAction((current) => {
      if (!current) return current;
      setTasks((prev) => prev.map((t) => (t.id === current.taskId ? current.prevTask : t)));
      setLastUndoneTaskId(current.taskId);
      if (current.kind === "done") setSessionArchivedCount((c) => Math.max(0, c - 1));
      return null;
    });
  }, []);

  const restoreTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "active", doneAt: null } : t)),
    );
  }, []);

  const importTasks = useCallback(
    (incoming: Task[]) => {
      const withReminders = incoming.map((t) => ({
        ...t,
        reminderAt: computeAutoReminder(t, settings),
      }));
      setTasks((prev) => [...withReminders, ...prev]);
    },
    [settings],
  );

  const addManualTask = useCallback(
    (input: {
      title: string;
      courseOrSender: string;
      dueDate: string | null;
      description: string;
      link?: string | null;
      category?: TaskCategory;
    }) => {
      const task: Task = {
        id: makeId("manual"),
        title: input.title,
        source: "manual",
        courseOrSender: input.courseOrSender || "Manually added",
        dueDate: input.dueDate,
        description: input.description,
        status: "active",
        reminderAt: computeAutoReminder({ source: "manual", dueDate: input.dueDate }, settings),
        createdAt: new Date().toISOString(),
        link: input.link ?? null,
        category: input.category ?? categorizeTask({ title: input.title, description: input.description }),
      };
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [settings],
  );

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const activeTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "active")
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return a.createdAt.localeCompare(b.createdAt);
        }),
    [tasks],
  );

  const doneTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "done")
        .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "")),
    [tasks],
  );

  return {
    tasks,
    activeTasks,
    doneTasks,
    settings,
    hasOnboarded,
    sessionArchivedCount,
    lastAction,
    lastUndoneTaskId,
    beginWithSeedData,
    markDone,
    setReminder,
    updateNotes,
    recordAction,
    undoLast,
    restoreTask,
    importTasks,
    addManualTask,
    updateSettings,
  };
}

export type TaskStore = ReturnType<typeof useTaskStore>;
