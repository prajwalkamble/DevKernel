import type { Role } from "@/lib/visuals/types";

/**
 * Role colours, written as complete literals so Tailwind's scanner finds them.
 *
 * Colour is never the only signal — every frame also carries a sentence saying
 * what happened, and the roles are distinguishable by lightness as well as hue
 * so that the animation still reads for the ~8% of men with a colour vision
 * deficiency.
 */
export const ROLE_FILL: Record<Role, string> = {
  compare: "bg-amber-400 dark:bg-amber-500",
  swap: "bg-rose-500 dark:bg-rose-400",
  pivot: "bg-violet-500 dark:bg-violet-400",
  sorted: "bg-emerald-500 dark:bg-emerald-400",
  active: "bg-sky-500 dark:bg-sky-400",
  window: "bg-sky-200 dark:bg-sky-900",
  discarded: "bg-border",
  found: "bg-emerald-500 dark:bg-emerald-400",
  mounted: "bg-emerald-500 dark:bg-emerald-400",
  updated: "bg-amber-400 dark:bg-amber-500",
  unchanged: "bg-surface",
  unmounted: "bg-rose-500 dark:bg-rose-400",
  moved: "bg-violet-500 dark:bg-violet-400",
  created: "bg-teal-500 dark:bg-teal-400",
  deleted: "bg-orange-500 dark:bg-orange-400",
};

export const ROLE_TEXT: Record<Role, string> = {
  compare: "text-amber-700 dark:text-amber-300",
  swap: "text-rose-700 dark:text-rose-300",
  pivot: "text-violet-700 dark:text-violet-300",
  sorted: "text-emerald-700 dark:text-emerald-300",
  active: "text-sky-700 dark:text-sky-300",
  window: "text-sky-700 dark:text-sky-300",
  discarded: "text-muted",
  found: "text-emerald-700 dark:text-emerald-300",
  mounted: "text-emerald-700 dark:text-emerald-300",
  updated: "text-amber-700 dark:text-amber-300",
  unchanged: "text-muted",
  unmounted: "text-rose-700 dark:text-rose-300",
  moved: "text-violet-700 dark:text-violet-300",
  created: "text-teal-700 dark:text-teal-300",
  deleted: "text-orange-700 dark:text-orange-300",
};

export const ROLE_RING: Record<Role, string> = {
  compare: "ring-amber-400",
  swap: "ring-rose-500",
  pivot: "ring-violet-500",
  sorted: "ring-emerald-500",
  active: "ring-sky-500",
  window: "ring-sky-300",
  discarded: "ring-border",
  found: "ring-emerald-500",
  mounted: "ring-emerald-500",
  updated: "ring-amber-400",
  unchanged: "ring-border",
  unmounted: "ring-rose-500",
  moved: "ring-violet-500",
  created: "ring-teal-500",
  deleted: "ring-orange-500",
};

/** The legend shown under a player, filtered to the roles a run actually uses. */
export const ROLE_LABEL: Record<Role, string> = {
  compare: "comparing",
  swap: "swapping",
  pivot: "pivot",
  sorted: "in final place",
  active: "current",
  window: "search window",
  discarded: "ruled out",
  found: "found",
  mounted: "mounted",
  updated: "updated in place",
  unchanged: "reused untouched",
  unmounted: "unmounted",
  moved: "moved",
  created: "created",
  deleted: "deleted",
};

/**
 * SVG fills, written out in full.
 *
 * These cannot be derived from `ROLE_FILL` by swapping `bg-` for `fill-` at
 * runtime: Tailwind only emits the classes it can see in the source, so a
 * class name assembled by `String.replace` resolves to nothing and the shape
 * renders with the browser's default black fill.
 */
export const ROLE_SVG_FILL: Record<Role, string> = {
  compare: "fill-amber-400 dark:fill-amber-500",
  swap: "fill-rose-500 dark:fill-rose-400",
  pivot: "fill-violet-500 dark:fill-violet-400",
  sorted: "fill-emerald-500 dark:fill-emerald-400",
  active: "fill-sky-500 dark:fill-sky-400",
  window: "fill-sky-200 dark:fill-sky-900",
  discarded: "fill-border",
  found: "fill-emerald-500 dark:fill-emerald-400",
  mounted: "fill-emerald-500 dark:fill-emerald-400",
  updated: "fill-amber-400 dark:fill-amber-500",
  unchanged: "fill-surface",
  unmounted: "fill-rose-500 dark:fill-rose-400",
  moved: "fill-violet-500 dark:fill-violet-400",
  created: "fill-teal-500 dark:fill-teal-400",
  deleted: "fill-orange-500 dark:fill-orange-400",
};

/** Edge strokes, written out for the same reason `ROLE_SVG_FILL` is. */
export const ROLE_STROKE: Record<Role, string> = {
  compare: "stroke-amber-400 dark:stroke-amber-500",
  swap: "stroke-rose-500 dark:stroke-rose-400",
  pivot: "stroke-violet-500 dark:stroke-violet-400",
  sorted: "stroke-emerald-500 dark:stroke-emerald-400",
  active: "stroke-sky-500 dark:stroke-sky-400",
  window: "stroke-sky-300 dark:stroke-sky-700",
  discarded: "stroke-border",
  found: "stroke-emerald-500 dark:stroke-emerald-400",
  mounted: "stroke-emerald-500 dark:stroke-emerald-400",
  updated: "stroke-amber-400 dark:stroke-amber-500",
  unchanged: "stroke-border",
  unmounted: "stroke-rose-500 dark:stroke-rose-400",
  moved: "stroke-violet-500 dark:stroke-violet-400",
  created: "stroke-teal-500 dark:stroke-teal-400",
  deleted: "stroke-orange-500 dark:stroke-orange-400",
};
