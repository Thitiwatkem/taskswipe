import { cn } from "@/lib/utils";
import { Archive, CalendarDays, Layers, Settings, Upload } from "lucide-react";

export type ViewKey = "swipe" | "calendar" | "archive" | "import" | "settings";

const NAV_ITEMS: { key: ViewKey; label: string; Icon: typeof Layers }[] = [
  { key: "swipe", label: "Swipe", Icon: Layers },
  { key: "calendar", label: "Calendar", Icon: CalendarDays },
  { key: "archive", label: "Archive", Icon: Archive },
  { key: "import", label: "Import", Icon: Upload },
  { key: "settings", label: "Settings", Icon: Settings },
];

export function NavBar({ active, onChange }: { active: ViewKey; onChange: (key: ViewKey) => void }) {
  return (
    <nav className="flex items-center justify-around border-t border-slate-200 bg-white/90 px-1 py-2 backdrop-blur">
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
              isActive ? "text-ucla-blue" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "fill-ucla-blue/10")} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
