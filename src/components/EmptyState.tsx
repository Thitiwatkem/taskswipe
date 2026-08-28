import { PartyPopper } from "lucide-react";

export function EmptyState({ archivedCount }: { archivedCount: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ucla-gold/30 text-ucla-blue-dark">
        <PartyPopper className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">You're all caught up</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        {archivedCount > 0
          ? `You archived ${archivedCount} task${archivedCount === 1 ? "" : "s"} this session. Nice work.`
          : "Nothing left in your stack right now."}
      </p>
    </div>
  );
}
