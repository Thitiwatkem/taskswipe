import { useState } from "react";
import type { Task } from "@/lib/types";
import { generateTaskSummary } from "@/lib/ai";
import { Sparkles } from "lucide-react";

export function AiSummaryToggle({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (summary || isLoading) return;
    setIsLoading(true);
    const text = await generateTaskSummary(task);
    setSummary(text);
    setIsLoading(false);
  }

  return (
    <div className="mt-1.5">
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-1 text-xs font-semibold text-ucla-blue hover:underline"
      >
        <Sparkles className="h-3 w-3" />
        {isOpen ? "Hide AI summary" : "AI summary"}
      </button>
      {isOpen && (
        <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-xs leading-relaxed text-slate-600">
          {isLoading ? "Summarizing…" : summary}
        </p>
      )}
    </div>
  );
}
