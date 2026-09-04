"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { Tooltip } from "./Tooltip";

/* ------------------------------------------------------------------ numbers */

/**
 * A percentage that never lies at the ends.
 *
 * Rounding alone reports 100% at 525 of 526 and 0% at 1 of 526 — the two
 * readings a progress display must never get wrong, because they are the two
 * the reader acts on. So the ends are exact and everything between is clamped
 * into 1–99.
 */
export function percent(done: number, total: number): number {
  if (total <= 0 || done <= 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.max(1, Math.round((done / total) * 100)));
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------- colour */

/**
 * A track's own colour, as a CSS value.
 *
 * These are the site's brand colours, one per track, and they are **not** a
 * valid categorical chart palette — the skill's validator scores C++ `#0b6ea8`
 * against React `#0e7490` at ΔE 4.7 for *normal* vision, well under the floor
 * of 15, and Spring against Java at 3.2 under deuteranopia. They are kept
 * anyway, because colour here follows the entity and a reader who learned
 * "Rust is orange" from every badge on the site must not meet a different Rust
 * here. What follows from the measurement is a rule the charts obey instead:
 * **no figure on this page distinguishes tracks by colour alone.** Every bar,
 * segment and cell is either labelled in place or sits in a labelled row, and
 * the colour is reinforcement.
 */
export function trackColor(accent: string): string {
  return `var(--${accent}-color)`;
}

/**
 * The heatmap's ramp: one hue, light to dark, mixed against the card surface.
 *
 * Deliberately a single hue rather than each track's own. Magnitude is the
 * job — how much of a module is done — and a value ramp wants one hue; running
 * twelve brand hues through the same ramp would double-encode identity into a
 * channel already carrying quantity, and the paler steps of the yellow one are
 * invisible. `color-mix` in oklab keeps the steps monotonic in lightness by
 * construction rather than by a hand-picked list.
 */
export const HEAT_STEPS = [22, 42, 64, 86, 100] as const;

export function heatFill(step: number): string {
  return `color-mix(in oklab, var(--accent) ${step}%, var(--surface))`;
}

/* -------------------------------------------------------------------- shell */

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
        className
      )}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * One KPI.
 *
 * A single current value is a stat tile, not a one-bar bar chart — so the
 * number is the figure and nothing is plotted behind it.
 */
export function StatTile({
  icon,
  label,
  value,
  detail,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  /** A track accent name, or undefined for the app accent. */
  tint?: string;
}) {
  const color = tint ? trackColor(tint) : "var(--accent)";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground sm:text-[1.75rem]">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{detail}</p>
        </div>
        <span
          aria-hidden
          // Hidden on the narrowest screens: with two tiles across a 360px
          // phone the icon is what squeezes "10h 55m" onto two lines, and it
          // carries nothing the label does not already say.
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg min-[420px]:grid"
          style={{
            color,
            backgroundColor: `color-mix(in oklab, ${color} 14%, var(--background))`,
          }}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

/** The hero figure a dashboard leads with, over its own meter. */
export function Hero({
  value,
  caption,
  done,
  total,
  meterLabel,
}: {
  value: string;
  caption: string;
  done: number;
  total: number;
  meterLabel: string;
}) {
  const pct = percent(done, total);
  return (
    <div>
      <p className="text-5xl font-semibold leading-none tabular-nums text-foreground sm:text-6xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{caption}</p>
      <Meter
        className="mt-5"
        pct={pct}
        fill="var(--accent)"
        label={meterLabel}
        right={`${pct}%`}
      />
    </div>
  );
}

/**
 * A single ratio against a limit.
 *
 * A meter rather than a two-slice pie, and the track is a step of the same
 * ramp as the fill rather than a grey, so an empty meter still reads as the
 * same object as a full one.
 */
export function Meter({
  pct,
  fill,
  label,
  right,
  className,
  size = "md",
}: {
  pct: number;
  fill: string;
  label?: ReactNode;
  right?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={className}>
      {(label || right) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
          <span className="min-w-0 truncate text-muted">{label}</span>
          <span className="shrink-0 font-medium tabular-nums text-foreground">{right}</span>
        </div>
      )}
      <div
        className={clsx(
          "w-full overflow-hidden rounded-full bg-surface-hover",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        {/* Nothing is drawn at zero. A rounded fill of width 0 still paints a
            cap on some engines, which reads as "a little done". */}
        {pct > 0 && (
          <div
            className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${pct}%`, backgroundColor: fill }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * One labelled row of a horizontal bar chart.
 *
 * The label is part of the row rather than a legend entry, which is what makes
 * the chart legible without relying on the track colours — see `trackColor`.
 */
export function BarRow({
  name,
  badge,
  value,
  detail,
  pct,
  fill,
  href,
  tooltip,
}: {
  name: string;
  badge?: ReactNode;
  value: string;
  detail?: string;
  pct: number;
  fill: string;
  href?: string;
  tooltip: ReactNode;
}) {
  const body = (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {badge}
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          <span className="font-semibold text-foreground">{value}</span>
          {detail && <span className="ml-1.5">{detail}</span>}
        </span>
      </div>
      <Meter pct={pct} fill={fill} size="sm" />
    </>
  );

  return (
    <Tooltip
      className="block w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      label={tooltip}
    >
      {href ? <span className="block">{body}</span> : body}
    </Tooltip>
  );
}

/** The scale that makes a heatmap readable without hovering every cell. */
export function HeatLegend({ max }: { max: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span>none</span>
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-3 w-4 rounded-sm border border-border bg-surface-hover" />
        {HEAT_STEPS.map((step) => (
          <span
            key={step}
            className="h-3 w-4 rounded-sm"
            style={{ backgroundColor: heatFill(step) }}
          />
        ))}
      </span>
      <span>{max}</span>
    </div>
  );
}

/** A short, plain sentence where a figure would otherwise be empty. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}
