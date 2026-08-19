"use client";

import clsx from "clsx";
import type { SplitHandleProps } from "./useSplit";

/**
 * The draggable line between two panes.
 *
 * Wider than it looks: the visible rule is one pixel, but the hit area is the
 * whole element, because a one-pixel drag target is a cursor-hunting exercise.
 * It is focusable and driven by the arrow keys too — a divider that can only be
 * moved with a pointer is a layout nobody using a keyboard can adjust.
 *
 * Takes the handle's props and its drag state as separate values rather than
 * the whole object `useSplit` returns: that object also carries a ref, and
 * reading a property off it during render is exactly what the refs rule
 * forbids.
 */
export function SplitHandle({
  handleProps,
  dragging,
  axis,
  className,
}: {
  handleProps: SplitHandleProps;
  dragging: boolean;
  axis: "x" | "y";
  className?: string;
}) {
  return (
    <div
      {...handleProps}
      className={clsx(
        "group relative shrink-0 touch-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset focus-visible:outline-none",
        axis === "x" ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize",
        dragging ? "bg-accent/40" : "bg-border hover:bg-accent/30",
        className
      )}
      title="Drag to resize · double-click to reset"
    >
      {/* The grip. Purely a hint that this is draggable, so it is hidden from
          assistive tech — the separator role already says what this is. */}
      <span
        aria-hidden
        className={clsx(
          "absolute rounded-full bg-muted/50 transition-opacity",
          dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          axis === "x"
            ? "top-1/2 left-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2"
            : "top-1/2 left-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2"
        )}
      />
    </div>
  );
}
