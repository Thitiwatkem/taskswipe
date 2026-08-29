import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { requestMotionPermission } from "@/lib/motion";
import { ArrowRight, Layers, RotateCcw, Sparkles, Zap } from "lucide-react";

export function Onboarding({ onStart }: { onStart: () => void }) {
  function handleStart() {
    // Fire-and-forget: this tap is the user gesture iOS requires before it
    // will grant motion access, so ask now while shake-to-undo is still off.
    void requestMotionPermission();
    onStart();
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-ucla-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-ucla-gold/25 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex max-w-sm flex-col items-center gap-6"
      >
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 260 }}
          className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-ucla-blue to-ucla-blue-dark text-ucla-gold shadow-xl shadow-ucla-blue/30"
        >
          <Layers className="h-10 w-10" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Undue</h1>
          <p className="text-balance text-base leading-snug text-slate-600">
            Swipe through your BruinLearn assignments and email to-dos in seconds — built for
            Anderson students juggling too many dashboards.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <FeaturePill icon={<Zap className="h-3 w-3" />} label="Swipe to triage" />
          <FeaturePill icon={<Sparkles className="h-3 w-3" />} label="AI summaries" />
          <FeaturePill icon={<RotateCcw className="h-3 w-3" />} label="Shake to undo" />
        </div>

        <Button
          size="lg"
          variant="gold"
          onClick={handleStart}
          className="w-full shadow-lg shadow-ucla-gold/30"
        >
          Start swiping
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-slate-400">
          Loads your real BruinLearn backlog instantly — no login, no setup.
        </p>
      </motion.div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
      {icon}
      {label}
    </span>
  );
}
