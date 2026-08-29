import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useShakeUndo } from "@/hooks/useShakeUndo";
import { Onboarding } from "@/components/Onboarding";
import { SwipeStack } from "@/components/SwipeStack";
import { CalendarView } from "@/components/CalendarView";
import { ArchiveView } from "@/components/ArchiveView";
import { SettingsView } from "@/components/SettingsView";
import { ImportView } from "@/components/ImportView";
import { NavBar, type ViewKey } from "@/components/NavBar";
import { NotificationBell } from "@/components/NotificationBell";
import { DoneCounter } from "@/components/DoneCounter";
import { Layers } from "lucide-react";

const VIEW_TITLES: Record<ViewKey, string> = {
  swipe: "Undue",
  calendar: "Calendar",
  archive: "Archive",
  import: "Import tasks",
  settings: "Settings",
};

function App() {
  const store = useTaskStore();
  const [view, setView] = useState<ViewKey>("swipe");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastIdRef = useRef(0);

  const showOnboarding = !store.hasOnboarded && store.tasks.length === 0;

  const showToast = useCallback((message: string) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
  }, []);

  const handleShake = useCallback(() => {
    if (!store.lastAction) return;
    const title = store.lastAction.prevTask.title;
    store.undoLast();
    showToast(`Brought back "${title}"`);
  }, [store, showToast]);

  useShakeUndo(store.settings.shakeToUndoEnabled, handleShake);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-slate-100 p-0 sm:p-6">
      <div className="relative flex h-full max-h-[880px] w-full max-w-md flex-col overflow-hidden bg-white sm:rounded-[2.5rem] sm:border sm:border-slate-200 sm:shadow-2xl">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 pb-3 [padding-top:max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ucla-blue text-ucla-gold">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-ink">{VIEW_TITLES[view]}</span>
          </div>
          {!showOnboarding && (
            <div className="flex items-center gap-2">
              <DoneCounter count={store.doneTasks.length} />
              <NotificationBell tasks={store.activeTasks} />
            </div>
          )}
        </header>

        <main className="min-h-0 flex-1 p-5">
          {showOnboarding ? (
            <Onboarding onStart={store.beginWithSeedData} />
          ) : (
            <>
              {view === "swipe" && (
                <SwipeStack
                  store={store}
                  onNavigateToCalendar={() => setView("calendar")}
                  onSwipeFeedback={showToast}
                />
              )}
              {view === "calendar" && (
                <CalendarView tasks={store.activeTasks} onUpdateNotes={store.updateNotes} />
              )}
              {view === "archive" && (
                <ArchiveView tasks={store.doneTasks} onRestore={store.restoreTask} />
              )}
              {view === "import" && (
                <ImportView
                  onImportTasks={store.importTasks}
                  onAddManualTask={store.addManualTask}
                />
              )}
              {view === "settings" && (
                <SettingsView settings={store.settings} onUpdate={store.updateSettings} />
              )}
            </>
          )}
        </main>

        {!showOnboarding && <NavBar active={view} onChange={setView} />}

        <div className="pointer-events-none absolute inset-x-4 top-16 z-50 flex justify-center">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ y: -32, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -32, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white shadow-lg"
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
