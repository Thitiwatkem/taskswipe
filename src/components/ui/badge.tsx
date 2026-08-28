import { cn } from "@/lib/utils";
import type { TaskSource } from "@/lib/types";
import { BookOpen, Mail, PenLine } from "lucide-react";

const SOURCE_META: Record<TaskSource, { label: string; className: string; Icon: typeof BookOpen }> = {
  bruinlearn: {
    label: "BruinLearn",
    className: "bg-ucla-blue/10 text-ucla-blue-dark",
    Icon: BookOpen,
  },
  email: {
    label: "Email",
    className: "bg-amber-100 text-amber-800",
    Icon: Mail,
  },
  manual: {
    label: "Manual",
    className: "bg-slate-200 text-slate-700",
    Icon: PenLine,
  },
};

export function SourceBadge({ source, className }: { source: TaskSource; className?: string }) {
  const meta = SOURCE_META[source];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
