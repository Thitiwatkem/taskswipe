import { useRef, useState, type FormEvent } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { parseIcsToTasks } from "@/lib/ics";
import { parseCsvToTasks } from "@/lib/csv";
import { parsePastedTasks } from "@/lib/ai";
import { makeId } from "@/lib/utils";
import { CalendarPlus, FileSpreadsheet, Info, PenLine, Sparkles, Upload } from "lucide-react";

interface ImportViewProps {
  onImportTasks: (tasks: Task[]) => void;
  onAddManualTask: (input: {
    title: string;
    courseOrSender: string;
    dueDate: string | null;
    description: string;
    link: string | null;
  }) => void;
}

export function ImportView({ onImportTasks, onAddManualTask }: ImportViewProps) {
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
    });
    setManualTitle("");
    setManualCourse("");
    setManualDue("");
    setManualDescription("");
    setManualLink("");
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
          Export your BruinLearn calendar feed as .ics and drop it here — this is the primary way
          to bring in real assignments and class sessions.
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

      <div className="flex items-start gap-2 rounded-2xl bg-slate-100 p-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          BruinLearn and Gmail live sync are planned for the next version — this MVP uses calendar
          export import.
        </p>
      </div>
    </div>
  );
}
