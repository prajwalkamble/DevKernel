"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Spread onto the divider element. */
export interface SplitHandleProps {
  role: "separator";
  tabIndex: 0;
  "aria-label": string;
  "aria-orientation": "vertical" | "horizontal";
  "aria-valuenow": number;
  "aria-valuemin": number;
  "aria-valuemax": number;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}

/**
 * Destructure this at the call site. The object carries a ref, and reading a
 * property off it during render trips React's refs rule — pulling the pieces
 * out gives the ref its own binding, which is the one legal way to use it.
 */
export interface Split {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Size of the first pane, as a percentage of the container. */
  percent: number;
  dragging: boolean;
  handleProps: SplitHandleProps;
}

export interface SplitOptions {
  /** `x` splits left/right; `y` splits top/bottom. */
  axis: "x" | "y";
  /** Where the size is remembered between visits. */
  storageKey: string;
  initial: number;
  min: number;
  max: number;
  label: string;
}

const KEY_STEP = 2;

/**
 * A draggable divider between two panes.
 *
 * The hook owns the number and the interaction; the caller owns the markup,
 * because the two splits on a problem page sit in different flex contexts and
 * a component that owned its children would have to be told about both.
 *
 * The size is published as a CSS custom property rather than an inline width.
 * That is what lets the same tree be an app-like split on a desktop and an
 * ordinary scrolling page on a phone: the variable is only *consumed* inside a
 * `lg:` utility, so below that breakpoint the panes stack and the divider is
 * not rendered at all. Rendering two layouts instead would mean two Monaco
 * editors, and Monaco is not something to instantiate twice for a media query.
 */
export function useSplit({ axis, storageKey, initial, min, max, label }: SplitOptions): Split {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [percent, setPercent] = useState(initial);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    // localStorage is an external store, so the first read belongs in an effect
    // — rendering it directly would not match what the server sent.
    try {
      const stored = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(stored) && stored >= min && stored <= max) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPercent(stored);
      }
    } catch {
      // A browser with storage disabled still gets a working, unremembered split.
    }
  }, [storageKey, min, max]);

  const clamp = useCallback(
    (value: number) => Math.min(max, Math.max(min, value)),
    [min, max]
  );

  const remember = useCallback(
    (value: number) => {
      try {
        window.localStorage.setItem(storageKey, String(Math.round(value)));
      } catch {
        // Not worth interrupting a drag over.
      }
    },
    [storageKey]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Only the primary button, and never a modified click — a right-click
      // should still open a context menu.
      if (event.button !== 0) return;
      const container = containerRef.current;
      if (!container) return;

      event.preventDefault();
      const handle = event.currentTarget;
      const { pointerId } = event;

      // Capture keeps the pointer reporting to the divider once it is over
      // Monaco, which would otherwise swallow the moves and leave the drag
      // stuck at the editor's edge. It is an enhancement rather than the
      // mechanism: the listeners below are on `window`, so a drag still works
      // if capture is unavailable — and captured events reach `window` too, so
      // this never double-handles a move.
      try {
        handle.setPointerCapture(pointerId);
      } catch {
        // Some pointers cannot be captured. The window listeners cover it.
      }
      setDragging(true);

      const move = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const next =
          axis === "x"
            ? ((moveEvent.clientX - rect.left) / rect.width) * 100
            : ((moveEvent.clientY - rect.top) / rect.height) * 100;
        setPercent(clamp(next));
      };

      const up = () => {
        try {
          handle.releasePointerCapture(pointerId);
        } catch {
          // Already released, or never captured.
        }
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        setDragging(false);
        setPercent((current) => {
          remember(current);
          return current;
        });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [axis, clamp, remember]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const decrease = axis === "x" ? "ArrowLeft" : "ArrowUp";
      const increase = axis === "x" ? "ArrowRight" : "ArrowDown";
      let next: number | null = null;

      if (event.key === decrease) next = percent - KEY_STEP;
      else if (event.key === increase) next = percent + KEY_STEP;
      else if (event.key === "Home") next = min;
      else if (event.key === "End") next = max;
      else if (event.key === "Enter" || event.key === " ") next = initial;

      if (next === null) return;
      event.preventDefault();
      const clamped = clamp(next);
      setPercent(clamped);
      remember(clamped);
    },
    [axis, percent, min, max, initial, clamp, remember]
  );

  const reset = useCallback(() => {
    setPercent(initial);
    remember(initial);
  }, [initial, remember]);

  return {
    containerRef,
    percent,
    dragging,
    handleProps: {
      role: "separator",
      tabIndex: 0,
      "aria-label": label,
      // A divider you drag left and right is itself a vertical line, and that
      // is what the attribute describes.
      "aria-orientation": axis === "x" ? "vertical" : "horizontal",
      "aria-valuenow": Math.round(percent),
      "aria-valuemin": min,
      "aria-valuemax": max,
      onPointerDown,
      onKeyDown,
      onDoubleClick: reset,
    },
  };
}
