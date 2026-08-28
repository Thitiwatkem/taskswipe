import { forwardRef, useImperativeHandle, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { Task } from "@/lib/types";
import { SourceBadge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/reminders";
import { Check, ExternalLink, X } from "lucide-react";

export interface TaskCardHandle {
  swipeRight: () => void;
  swipeLeft: () => void;
}

interface TaskCardProps {
  task: Task;
  stackPosition: number;
  isTop: boolean;
  onDecided: (direction: "left" | "right") => void;
}

const SWIPE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 500;

function urgencyClass(dueDate: string | null): string {
  if (!dueDate) return "text-slate-500";
  const diffHours = (new Date(dueDate).getTime() - Date.now()) / 36e5;
  if (diffHours < 0) return "text-rose-600";
  if (diffHours <= 24) return "text-amber-600";
  return "text-slate-500";
}

export const TaskCard = forwardRef<TaskCardHandle, TaskCardProps>(
  ({ task, stackPosition, isTop, onDecided }, ref) => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
    const rightStampOpacity = useTransform(x, [20, 120], [0, 1]);
    const leftStampOpacity = useTransform(x, [-120, -20], [1, 0]);
    const [isFlinging, setIsFlinging] = useState(false);

    function fling(direction: "left" | "right") {
      if (isFlinging) return;
      setIsFlinging(true);
      const FLING_DURATION_MS = 320;
      controls.start({
        x: direction === "right" ? 700 : -700,
        rotate: direction === "right" ? 30 : -30,
        opacity: 0,
        transition: { duration: FLING_DURATION_MS / 1000, ease: "easeOut" },
      });
      // Timer-driven rather than chained off the animation promise so the
      // decision always lands even if rAF-based playback stalls (e.g. a
      // backgrounded tab).
      window.setTimeout(() => onDecided(direction), FLING_DURATION_MS);
    }

    useImperativeHandle(ref, () => ({
      swipeRight: () => fling("right"),
      swipeLeft: () => fling("left"),
    }));

    function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
      if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
        fling("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
        fling("left");
      } else {
        controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 420, damping: 32 } });
      }
    }

    const depthOffset = stackPosition * 10;
    const depthScale = 1 - stackPosition * 0.04;

    return (
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 10 - stackPosition }}
        initial={false}
        animate={
          isTop
            ? undefined
            : { y: depthOffset, scale: depthScale, opacity: stackPosition > 2 ? 0 : 1 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <motion.div
          className="flex h-full w-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
          style={isTop ? { x, rotate } : undefined}
          drag={isTop ? "x" : false}
          dragElastic={0.9}
          onDragEnd={isTop ? handleDragEnd : undefined}
          animate={controls}
        >
          {isTop && (
            <>
              <motion.div
                style={{ opacity: rightStampOpacity }}
                className="pointer-events-none absolute right-6 top-6 rotate-12 rounded-lg border-4 border-emerald-500 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-emerald-500"
              >
                Done
              </motion.div>
              <motion.div
                style={{ opacity: leftStampOpacity }}
                className="pointer-events-none absolute left-6 top-6 -rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-rose-500"
              >
                Keep
              </motion.div>
            </>
          )}

          <div className="mb-3">
            <SourceBadge source={task.source} />
          </div>

          <p className="text-sm font-medium text-ucla-blue-dark">{task.courseOrSender}</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight text-ink">{task.title}</h2>

          <p className={`mt-3 text-sm font-semibold ${urgencyClass(task.dueDate)}`}>
            {formatDueDate(task.dueDate)}
          </p>

          {task.description && (
            <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-slate-600">
              {task.description}
            </p>
          )}

          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-ucla-blue hover:underline"
            >
              Open in BruinLearn
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <div className="mt-auto flex items-center justify-center gap-3 pt-6 text-xs text-slate-400">
            <X className="h-3.5 w-3.5" /> keep &amp; remind
            <span className="mx-1">·</span>
            done <Check className="h-3.5 w-3.5" />
          </div>
        </motion.div>
      </motion.div>
    );
  },
);
TaskCard.displayName = "TaskCard";
