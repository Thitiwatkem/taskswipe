import { useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { Onboarding } from "@/components/Onboarding";
import { SwipeStack } from "@/components/SwipeStack";
import { CalendarView } from "@/components/CalendarView";
import { ArchiveView } from "@/components/ArchiveView";
import { SettingsView } from "@/components/SettingsView";
import { ImportView } from "@/components/ImportView";
import { NavBar, type ViewKey } from "@/components/NavBar";
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

  const showOnboarding = !store.hasOnboarded && store.tasks.length === 0;

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-slate-100 p-0 sm:p-6">
      <div className="flex h-full max-h-[880px] w-full max-w-md flex-col overflow-hidden bg-white sm:rounded-[2.5rem] sm:border sm:border-slate-200 sm:shadow-2xl">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 pb-3 [padding-top:max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ucla-blue text-ucla-gold">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-ink">{VIEW_TITLES[view]}</span>
        </header>

        <main className="min-h-0 flex-1 p-5">
          {showOnboarding ? (
            <Onboarding onStart={store.beginWithSeedData} />
          ) : (
            <>
              {view === "swipe" && (
                <SwipeStack store={store} onNavigateToCalendar={() => setView("calendar")} />
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
      </div>
    </div>
  );
}

export default App;
