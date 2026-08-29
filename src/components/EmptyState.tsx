import { motion } from "framer-motion";
import { PartyPopper } from "lucide-react";

export function EmptyState({ archivedCount }: { archivedCount: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ucla-gold/30 text-ucla-blue-dark"
      >
        <PartyPopper className="h-8 w-8" />
      </motion.div>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="mt-5 text-xl font-bold text-ink">You're all caught up</h2>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          {archivedCount > 0
            ? `You knocked out ${archivedCount} task${archivedCount === 1 ? "" : "s"} today. Great job!`
            : "Nothing left in your stack right now."}
        </p>
      </motion.div>
    </div>
  );
}
