import { useState, type ReactNode } from "react";
import type { NotificationSettings } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getStoredApiKey, setStoredApiKey } from "@/lib/ai";
import { BookOpen, KeyRound, Mail, PenLine, Sparkles } from "lucide-react";

const LEAD_TIME_OPTIONS = [
  { label: "15 minutes before", minutes: 15 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
  { label: "2 hours before", minutes: 120 },
  { label: "1 day before", minutes: 60 * 24 },
];

interface SettingsViewProps {
  settings: NotificationSettings;
  onUpdate: (patch: Partial<NotificationSettings>) => void;
}

export function SettingsView({ settings, onUpdate }: SettingsViewProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <ApiKeySection />

      <h2 className="mb-1 mt-6 text-lg font-bold text-ink">Notifications</h2>
      <p className="mb-4 text-sm text-slate-500">
        Choose which task sources get automatic reminders, and how far ahead.
      </p>

      <div className="space-y-3">
        <SourceToggleRow
          icon={<BookOpen className="h-4 w-4" />}
          label="BruinLearn assignments"
          checked={settings.bruinlearnEnabled}
          onCheckedChange={(v) => onUpdate({ bruinlearnEnabled: v })}
        />
        <SourceToggleRow
          icon={<Mail className="h-4 w-4" />}
          label="Email to-dos"
          checked={settings.emailEnabled}
          onCheckedChange={(v) => onUpdate({ emailEnabled: v })}
        />
        <SourceToggleRow
          icon={<PenLine className="h-4 w-4" />}
          label="Manually added tasks"
          checked={settings.manualEnabled}
          onCheckedChange={(v) => onUpdate({ manualEnabled: v })}
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-ink">Default reminder lead time</p>
        <select
          value={settings.defaultLeadMinutes}
          onChange={(e) => onUpdate({ defaultLeadMinutes: Number(e.target.value) })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-ucla-blue focus:outline-none"
        >
          {LEAD_TIME_OPTIONS.map((option) => (
            <option key={option.minutes} value={option.minutes}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-400">
          Applied automatically to new tasks from enabled sources.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="pr-3 text-sm font-medium text-ink">
            Auto-apply default reminder on swipe left
            <p className="mt-0.5 text-xs font-normal text-slate-400">
              Keep a task active with a quick swipe and it gets the default reminder above
              automatically — swipe up instead to customize it.
            </p>
          </div>
          <Switch
            checked={settings.autoApplyDefaultOnSwipeLeft}
            onCheckedChange={(v) => onUpdate({ autoApplyDefaultOnSwipeLeft: v })}
          />
        </div>
      </div>
    </div>
  );
}

function ApiKeySection() {
  const [keyInput, setKeyInput] = useState(() => getStoredApiKey());
  const [status, setStatus] = useState<string | null>(null);
  const hasKey = Boolean(getStoredApiKey());

  function handleSave() {
    setStoredApiKey(keyInput);
    setStatus(keyInput.trim() ? "Saved — AI summaries now use Claude." : "Key cleared.");
  }

  function handleClear() {
    setKeyInput("");
    setStoredApiKey("");
    setStatus("Key cleared — back to built-in fallback summaries.");
  }

  return (
    <section className="rounded-2xl border border-ucla-blue/30 bg-ucla-blue/5 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ucla-blue-dark">
        <Sparkles className="h-4 w-4" />
        AI summaries
      </div>
      <p className="mb-3 text-xs text-slate-600">
        Add your own Claude API key to generate real AI summaries instead of the built-in
        fallback. Get one at{" "}
        <span className="font-medium">console.anthropic.com</span>.
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="sk-ant-..."
          autoComplete="off"
          className="w-full text-sm text-ink focus:outline-none"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="default" size="sm" onClick={handleSave} className="flex-1">
          Save key
        </Button>
        {hasKey && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
      {status && <p className="mt-2 text-xs font-medium text-emerald-700">{status}</p>}
      <p className="mt-2 text-xs text-slate-500">
        Stored only in this browser's local storage — never sent anywhere but Anthropic's API,
        and never committed to the app's source. Since this is a client-only app with no backend,
        the key is visible in this browser's network requests, so avoid using a key with limits
        you're not comfortable exposing on your own device.
      </p>
    </section>
  );
}

function SourceToggleRow({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        {icon}
        {label}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
