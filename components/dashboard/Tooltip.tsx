"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * A tooltip for the dashboard's charts.
 *
 * Deliberately not the `title` attribute. A native tooltip cannot be styled,
 * cannot hold two lines of structure, waits about a second before appearing,
 * and never appears at all for a keyboard or touch user — which on a page whose
 * numbers live inside bars and squares would mean the numbers are unreachable
 * without a mouse.
 *
 * What this does instead, following the WAI-ARIA tooltip pattern:
 *
 *   - Opens on hover *and* on focus, so tabbing to a bar reads out the same
 *     detail the pointer gets. The trigger is a real `button`, which is what
 *     puts it in the tab order and gives it a focus ring for free.
 *   - Wires `aria-describedby` to the bubble, so a screen reader announces the
 *     detail as the description of the control rather than as loose text.
 *   - Closes on Escape while it is open. WCAG 1.4.13 requires a dismiss that
 *     does not involve moving the pointer, and a bubble covering the next bar
 *     is exactly the case it is written for.
 *   - Renders into `document.body` through a portal and positions itself with
 *     `position: fixed`. Both matter: a card with `overflow-hidden` would clip
 *     an absolutely-positioned bubble, and fixed coordinates come straight from
 *     `getBoundingClientRect`, so no ancestor's transform or scroll offset has
 *     to be accounted for.
 *   - Flips below the trigger when there is not room above, and is clamped to
 *     the viewport horizontally, so a bar at the edge of the screen does not
 *     push a bubble off it.
 *
 * The bubble is `pointer-events-none`: it is describing the thing under the
 * cursor, so it must never become the thing under the cursor.
 */

/** Distance between the trigger and the bubble. */
const GAP = 8;
/** Closest the bubble may come to the edge of the viewport. */
const MARGIN = 8;

interface Position {
  left: number;
  top: number;
}

export function Tooltip({
  label,
  children,
  className,
  style,
}: {
  /** The bubble's contents. Kept out of the DOM entirely until it opens. */
  label: ReactNode;
  /** The thing being described. */
  children: ReactNode;
  className?: string;
  /**
   * Applied to the trigger. The trigger is the real element in the layout —
   * inside a flex row it is the flex item — so anything sizing it has to land
   * here rather than on the content inside it.
   */
  style?: CSSProperties;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  // Portals need a DOM to render into, which the server does not have.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger) return;

    const anchor = trigger.getBoundingClientRect();
    // Before the first measurement the bubble has no size. Estimating would
    // put it in the wrong place for one frame, so it stays invisible until
    // there is something real to measure (see `visibility` below).
    const width = bubble?.offsetWidth ?? 0;
    const height = bubble?.offsetHeight ?? 0;

    // Above by preference, below when there is not room for it above.
    const above = anchor.top - height - GAP;
    const top = above < MARGIN ? anchor.bottom + GAP : above;

    const wanted = anchor.left + anchor.width / 2 - width / 2;
    const furthestLeft = Math.max(MARGIN, window.innerWidth - width - MARGIN);
    const left = Math.min(Math.max(wanted, MARGIN), furthestLeft);

    setPosition({ left, top });
  }, []);

  const show = useCallback(() => {
    setOpen(true);
    place();
  }, [place]);

  const hide = useCallback(() => {
    setOpen(false);
    setPosition(null);
  }, []);

  // Measured after the bubble has rendered, because its size is only knowable
  // once its contents are laid out. `place` runs twice per open — once with no
  // bubble to get it mounted, once with one to put it in the right place.
  useEffect(() => {
    if (!open) return;
    place();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    // A scroll or resize moves the trigger out from under the bubble, and
    // there is no sensible way to re-anchor mid-gesture. Capture, so a scroll
    // inside any container counts, not just the window's.
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open, place, hide]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        // `aria-describedby` only points at the bubble while it exists;
        // referring to an absent id makes some screen readers announce nothing
        // at all rather than skipping it.
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        // Touch has no hover, so the tap that would otherwise do nothing opens
        // the bubble instead.
        onClick={(event) => {
          event.preventDefault();
          if (open) hide();
          else show();
        }}
        className={className}
        style={style}
      >
        {children}
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={bubbleRef}
              id={id}
              role="tooltip"
              style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                // Laid out but not painted until it has been measured, so it
                // never appears at the wrong coordinates first.
                visibility: position ? "visible" : "hidden",
              }}
              className={[
                "pointer-events-none fixed z-50 max-w-xs rounded-lg border border-border",
                "bg-background px-3 py-2 text-left text-xs leading-relaxed text-foreground",
                "shadow-lg",
              ].join(" ")}
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
