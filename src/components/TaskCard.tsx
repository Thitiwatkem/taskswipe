import { forwardRef, useImperativeHandle, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { Task } from "@/lib/types";
import { SourceBadge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/reminders";
import { CATEGORY_META } from "@/lib/category";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import { Check, ChevronUp, ExternalLink, X } from "lucide-react";

export type SwipeDirection = "left" | "right" | "up";

export interface TaskCardHandle {
  swipeRight: () => void;
  swipeLeft: () => void;
  swipeUp: () => void;
}

interface TaskCardProps {
  task: Task;
  stackPosition: number;
  isTop: boolean;
  onDecided: (direction: SwipeDirection) => void;
  onOpenDetails: () => void;
}

const SWIPE_THRESHOLD_X = 110;
const SWIPE_THRESHOLD_Y = 100;
const VELOCITY_THRESHOLD = 500;

function urgencyClass(dueDate: string | null): string {
  if (!dueDate) return "text-slate-500";
  const diffHours = (new Date(dueDate).getTime() - Date.now()) / 36e5;
  if (diffHours < 0) return "text-rose-600";
  if (diffHours <= 24) return "text-amber-600";
  return "text-slate-500";
}

export const TaskCard = forwardRef<TaskCardHandle, TaskCardProps>(
  ({ task, stackPosition, isTop, onDecided, onOpenDetails }, ref) => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
    const rightStampOpacity = useTransform(x, [20, 120], [0, 1]);
    const leftStampOpacity = useTransform(x, [-120, -20], [1, 0]);
    const upStampOpacity = useTransform(y, [-120, -20], [1, 0]);
    const [isFlinging, setIsFlinging] = useState(false);

    function fling(direction: SwipeDirection) {
      if (isFlinging) return;
      setIsFlinging(true);
      const FLING_DURATION_MS = 320;
      const target =
        direction === "right"
          ? { x: 700, y: 0, rotate: 30 }
          : direction === "left"
            ? { x: -700, y: 0, rotate: -30 }
            : { x: 0, y: -700, rotate: 0 };
      controls.start({
        ...target,
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
      swipeUp: () => fling("up"),
    }));

    function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
      const isVerticalDrag = Math.abs(info.offset.y) > Math.abs(info.offset.x);

      if (
        isVerticalDrag &&
        (info.offset.y < -SWIPE_THRESHOLD_Y || info.velocity.y < -VELOCITY_THRESHOLD)
      ) {
        fling("up");
      } else if (info.offset.x > SWIPE_THRESHOLD_X || info.velocity.x > VELOCITY_THRESHOLD) {
        fling("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD_X || info.velocity.x < -VELOCITY_THRESHOLD) {
        fling("left");
      } else {
        controls.start({
          x: 0,
          y: 0,
          rotate: 0,
          transition: { type: "spring", stiffness: 420, damping: 32 },
        });
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
          className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
          style={isTop ? { x, y, rotate } : undefined}
          drag={isTop}
          dragElastic={0.9}
          onDragEnd={isTop ? handleDragEnd : undefined}
          onTap={isTop ? onOpenDetails : undefined}
          animate={controls}
        >
          {isTop && (
            <>
              <motion.div
                style={{ opacity: rightStampOpacity }}
                className="pointer-events-none absolute right-6 top-20 z-10 rotate-12 rounded-lg border-4 border-emerald-500 bg-white/90 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-emerald-500"
              >
                Done
              </motion.div>
              <motion.div
                style={{ opacity: leftStampOpacity }}
                className="pointer-events-none absolute left-6 top-20 z-10 -rotate-12 rounded-lg border-4 border-rose-500 bg-white/90 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-rose-500"
              >
                Keep
              </motion.div>
              <motion.div
                style={{ opacity: upStampOpacity }}
                className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-lg border-4 border-ucla-blue bg-white/90 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-ucla-blue"
              >
                Calendar
              </motion.div>

              <CategoryBanner category={task.category} />

              <div className="flex flex-1 flex-col overflow-hidden p-6">
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
                    Open link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-center gap-2.5 text-xs text-slate-400">
                    <X className="h-3.5 w-3.5" /> keep
                    <span className="mx-0.5">·</span>
                    <ChevronUp className="h-3.5 w-3.5" /> calendar
                    <span className="mx-0.5">·</span>
                    done <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-center text-[10px] text-slate-300">Tap card for details</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    );
  },
);
TaskCard.displayName = "TaskCard";

function CategoryBanner({ category }: { category: Task["category"] }) {
  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICONS[category];
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 bg-gradient-to-br px-6 text-white",
        meta.gradient,
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase tracking-wide">{meta.label}</span>
    </div>
  );
}
