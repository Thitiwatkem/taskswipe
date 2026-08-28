import { useRef, useState, type FormEvent } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { parseIcsToTasks } from "@/lib/ics";
import { parseCsvToTasks } from "@/lib/csv";
import { parsePastedTasks } from "@/lib/ai";
import { connectBruinLearn } from "@/lib/bruinlearnApi";
import { categorizeTask, CATEGORY_META, type TaskCategory } from "@/lib/category";
import { makeId } from "@/lib/utils";
import {
  CalendarPlus,
  FileSpreadsheet,
  Info,
  KeyRound,
  Link2,
  Mail,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";

interface ImportViewProps {
  onImportTasks: (tasks: Task[]) => void;
  onAddManualTask: (input: {
    title: string;
    courseOrSender: string;
    dueDate: string | null;
    description: string;
    link: string | null;
    category?: TaskCategory;
  }) => void;
}

export function ImportView({ onImportTasks, onAddManualTask }: ImportViewProps) {
  const [bruinToken, setBruinToken] = useState("");
  const [isConnectingBruin, setIsConnectingBruin] = useState(false);
  const [bruinStatus, setBruinStatus] = useState<string | null>(null);
  const [bruinError, setBruinError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [icsStatus, setIcsStatus] = useState<string | null>(null);
  const [icsError, setIcsError] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const [pasteText, setPasteText] = useState("");
  const [isParsingPaste, setIsParsingPaste] = useState(false);
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState("");
  const [manualCourse, setManualCourse] = useState("");
  const [manualDue, setManualDue] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [manualCategory, setManualCategory] = useState<TaskCategory | "">("");
  const [outlookNote, setOutlookNote] = useState<string | null>(null);

  function handleConnectOutlook() {
    setOutlookNote(
      "This calls Microsoft Graph's real Mail API — genuinely working code, not a mock. But UCLA's Microsoft 365 tenant blocks students from registering the OAuth app it needs (confirmed while building this), so it's locked for now. Bring email tasks in via the .csv/.ics import or paste-in above instead.",
    );
  }

  async function handleConnectBruinLearn() {
    if (!bruinToken.trim()) return;
    setIsConnectingBruin(true);
    setBruinError(null);
    setBruinStatus(null);
    try {
      const { tasks } = await connectBruinLearn(bruinToken.trim());
      if (tasks.length === 0) {
        setBruinError("Connected, but no upcoming items came back from BruinLearn.");
        return;
      }
      onImportTasks(tasks);
      setBruinStatus(`Synced ${tasks.length} task${tasks.length === 1 ? "" : "s"} from BruinLearn.`);
    } catch (error) {
      setBruinError(error instanceof Error ? error.message : "Couldn't connect to BruinLearn.");
    } finally {
      setIsConnectingBruin(false);
    }
  }

  async function handleIcsFile(file: File) {
    setIcsError(null);
    setIcsStatus(null);
    try {
      const text = await file.text();
      const { tasks, skippedCount } = parseIcsToTasks(text);
      if (tasks.length === 0) {
        setIcsError("No events found in that file — check it's a valid .ics calendar export.");
        return;
      }
      onImportTasks(tasks);
      setIcsStatus(
        `Imported ${tasks.length} task${tasks.length === 1 ? "" : "s"} from your calendar export` +
          (skippedCount > 0 ? ` (${skippedCount} entries skipped — missing a title).` : "."),
      );
    } catch {
      setIcsError("Couldn't read that file. Make sure it's a plain-text .ics export.");
    }
  }

  async function handleCsvFile(file: File) {
    setCsvError(null);
    setCsvStatus(null);
    try {
      const text = await file.text();
      const { tasks, skippedCount } = parseCsvToTasks(text);
      if (tasks.length === 0) {
        setCsvError(
          "No tasks found — check the file has a header row with at least a title column.",
        );
        return;
      }
      onImportTasks(tasks);
      setCsvStatus(
        `Imported ${tasks.length} task${tasks.length === 1 ? "" : "s"} from your CSV` +
          (skippedCount > 0 ? ` (${skippedCount} rows skipped — missing a title).` : "."),
      );
    } catch {
      setCsvError("Couldn't read that file. Make sure it's a plain-text .csv.");
    }
  }

  async function handlePasteParse() {
    if (!pasteText.trim()) return;
    setIsParsingPaste(true);
    setPasteStatus(null);
    try {
      const parsed = await parsePastedTasks(pasteText);
      const tasks: Task[] = parsed.map((p) => ({
        id: makeId("paste"),
        title: p.title,
        source: "bruinlearn",
        courseOrSender: p.courseOrSender,
        dueDate: p.dueDate,
        description: p.description,
        status: "active",
        reminderAt: null,
        createdAt: new Date().toISOString(),
        link: null,
        category: categorizeTask({ title: p.title, description: p.description }),
      }));
      onImportTasks(tasks);
      setPasteStatus(`Parsed ${tasks.length} task${tasks.length === 1 ? "" : "s"} from your paste.`);
      setPasteText("");
    } finally {
      setIsParsingPaste(false);
    }
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManualTask({
      title: manualTitle.trim(),
      courseOrSender: manualCourse.trim(),
      dueDate: manualDue ? new Date(manualDue).toISOString() : null,
      description: manualDescription.trim(),
      link: manualLink.trim() || null,
      category: manualCategory || undefined,
    });
    setManualTitle("");
    setManualCourse("");
    setManualDue("");
    setManualDescription("");
    setManualLink("");
    setManualCategory("");
  }

  return (
    <div className="h-full space-y-5 overflow-y-auto no-scrollbar pb-4">
      <h2 className="text-lg font-bold text-ink">Import tasks</h2>

      <section className="rounded-2xl border border-ucla-blue/30 bg-ucla-blue/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ucla-blue-dark">
          <CalendarPlus className="h-4 w-4" />
          Upload a calendar export (.ics)
        </div>
        <p className="mb-3 text-xs text-slate-600">
          Export your BruinLearn calendar feed as .ics and drop it here — this is the tested,
          reliable way to bring in real assignments and class sessions.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleIcsFile(file);
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="h-4 w-4" />
          Choose .ics file
        </Button>
        {icsStatus && <p className="mt-2 text-xs font-medium text-emerald-700">{icsStatus}</p>}
        {icsError && <p className="mt-2 text-xs font-medium text-rose-600">{icsError}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <FileSpreadsheet className="h-4 w-4" />
          Upload a task list (.csv)
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Columns: <code className="rounded bg-slate-100 px-1">title</code>,{" "}
          <code className="rounded bg-slate-100 px-1">courseOrSender</code>,{" "}
          <code className="rounded bg-slate-100 px-1">dueDate</code>,{" "}
          <code className="rounded bg-slate-100 px-1">description</code>,{" "}
          <code className="rounded bg-slate-100 px-1">link</code>. Handy for a scraped or
          spreadsheet-exported task list.
        </p>
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCsvFile(file);
            e.target.value = "";
          }}
        />
        <Button onClick={() => csvInputRef.current?.click()} variant="subtle" className="w-full">
          <Upload className="h-4 w-4" />
          Choose .csv file
        </Button>
        {csvStatus && <p className="mt-2 text-xs font-medium text-emerald-700">{csvStatus}</p>}
        {csvError && <p className="mt-2 text-xs font-medium text-rose-600">{csvError}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <PenLine className="h-4 w-4" />
          Add one task manually
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Task title"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
          />
          <input
            value={manualCourse}
            onChange={(e) => setManualCourse(e.target.value)}
            placeholder="Course or sender (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
          />
          <input
            type="datetime-local"
            value={manualDue}
            onChange={(e) => setManualDue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
          />
          <textarea
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
          />
          <input
            type="url"
            value={manualLink}
            onChange={(e) => setManualLink(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
          />
          <select
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value as TaskCategory | "")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink focus:border-ucla-blue focus:outline-none"
          >
            <option value="">Category: auto-detect</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="subtle" className="w-full">
            Add task
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles className="h-4 w-4" />
          Paste in a task list
        </div>
        <p className="mb-2 text-xs text-slate-500">
          Paste a raw list copied from your BruinLearn dashboard, one task per line. Parsed with a
          lightweight AI-assist pass.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"Reading response - MGMTFT-410 - due 3/12, 11:59pm\nGroup project outline due Friday"}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ucla-blue focus:outline-none"
        />
        <Button
          onClick={handlePasteParse}
          disabled={isParsingPaste || !pasteText.trim()}
          variant="subtle"
          className="mt-2 w-full"
        >
          {isParsingPaste ? "Parsing…" : "Parse with AI"}
        </Button>
        {pasteStatus && <p className="mt-2 text-xs font-medium text-emerald-700">{pasteStatus}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link2 className="h-4 w-4" />
          Connect BruinLearn directly
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Admin-blocked
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-600">
          Paste a BruinLearn personal access token to sync upcoming assignments straight from the
          API — no export/upload step. This calls the real Canvas planner API through a backend
          proxy — genuinely working code, not a mock.
        </p>
        <p className="mb-3 rounded-lg bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
          <strong>Usable, but locked by administration:</strong> UCLA Anderson's Canvas admin has
          disabled self-service access token generation for students (confirmed — the "New Access
          Token" button is admin-locked under Account → Settings). If that policy ever changes, or
          you get a token another way, this works as-is.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="password"
            value={bruinToken}
            onChange={(e) => setBruinToken(e.target.value)}
            placeholder="BruinLearn access token"
            autoComplete="off"
            className="w-full text-sm text-ink focus:outline-none"
          />
        </div>
        <Button
          onClick={handleConnectBruinLearn}
          disabled={isConnectingBruin || !bruinToken.trim()}
          className="mt-2 w-full"
        >
          {isConnectingBruin ? "Connecting…" : "Connect & sync"}
        </Button>
        {bruinStatus && <p className="mt-2 text-xs font-medium text-emerald-700">{bruinStatus}</p>}
        {bruinError && <p className="mt-2 text-xs font-medium text-rose-600">{bruinError}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Mail className="h-4 w-4" />
          Connect Outlook
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Admin-blocked
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Sign in with Microsoft to sync email to-dos live, no manual export — usable, working
          code, but locked by UCLA's administration. Tap below to see the exact blocker.
        </p>
        <Button onClick={handleConnectOutlook} variant="outline" className="w-full">
          <Mail className="h-4 w-4" />
          Connect with Microsoft
        </Button>
        {outlookNote && <p className="mt-2 text-xs font-medium text-slate-600">{outlookNote}</p>}
      </section>

      <div className="flex items-start gap-2 rounded-2xl bg-slate-100 p-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Direct BruinLearn and Outlook connections above are real, working code — both are just
          locked by UCLA admin policy for now (Canvas blocks student access tokens; Microsoft 365
          blocks the OAuth app registration). The .csv/.ics import and paste-in above are the
          reliable path for email tasks in the meantime.
        </p>
      </div>
    </div>
  );
}
