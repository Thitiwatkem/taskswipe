import { Button } from "@/components/ui/button";
import { ArrowRight, Layers } from "lucide-react";

export function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ucla-blue text-ucla-gold shadow-lg">
          <Layers className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink">TaskSwipe</h1>
          <p className="text-balance text-base leading-snug text-slate-600">
            Swipe through your BruinLearn assignments and email to-dos in seconds — built for
            Anderson students juggling too many dashboards.
          </p>
        </div>

        <Button size="lg" variant="gold" onClick={onStart} className="w-full">
          Start swiping
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-slate-400">
          Loads your real BruinLearn backlog instantly — no login, no setup.
        </p>
      </div>
    </div>
  );
}
