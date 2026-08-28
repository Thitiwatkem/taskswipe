import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationSettings, Task } from "@/lib/types";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/types";
import { generateSeedTasks } from "@/lib/seed";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { makeId } from "@/lib/utils";
import { computeAutoReminder } from "@/lib/reminders";

const TASKS_KEY = "tasks";
const SETTINGS_KEY = "settings";
const ONBOARDED_KEY = "hasOnboarded";

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage<Task[]>(TASKS_KEY, []));
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
    beginWithSeedData,
    markDone,
    setReminder,
    restoreTask,
    importTasks,
    addManualTask,
    updateSettings,
  };
}

export type TaskStore = ReturnType<typeof useTaskStore>;
