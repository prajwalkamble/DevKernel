"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";
import { SplitHandle } from "./SplitHandle";
import { useSplit } from "./useSplit";

/**
 * The problem page as a workspace rather than an article.
 *
 * Two panes on a desktop: the problem on the left, the editor and its results
 * on the right, with a divider you can drag. Below `lg` the same tree becomes
 * an ordinary scrolling page — the divider disappears and the panes stack —
 * which is why the split size travels as a CSS variable that only `lg:`
 * utilities read.
 *
 * The left pane is tabbed, and the tab order is the order the page wants you to
 * work in: read the statement, name the pattern, and only then look at how it
 * is solved. Splitting the approaches onto their own tab is the same
 * gating the old page achieved by folding them into a `<details>` — an answer
 * you meet before you have tried produces recognition, which feels like
 * understanding and is not.
 */
type Tab = "description" | "signals" | "approaches";

const TABS: { id: Tab; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "signals", label: "Signals" },
  { id: "approaches", label: "Approaches" },
];

export function ProblemWorkspace({
  topBar,
  description,
  signals,
  approaches,
  solve,
}: {
  topBar: ReactNode;
  description: ReactNode;
  signals: ReactNode;
  approaches: ReactNode;
  solve: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("description");
  const { containerRef, percent, dragging, handleProps } = useSplit({
    axis: "x",
    storageKey: "devkernel:problem-split-x",
    initial: 46,
    min: 25,
    max: 70,
    label: "Resize the problem and editor panes",
  });

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      <div className="shrink-0 border-b border-border bg-surface">{topBar}</div>

      <div
        ref={containerRef}
        style={{ "--split-x": `${percent}%` } as CSSProperties}
        className={clsx(
          "flex min-h-0 flex-1 flex-col lg:flex-row",
          // While dragging, stop the panes from selecting text or handing the
          // pointer to Monaco.
          dragging && "cursor-col-resize select-none"
        )}
      >
        <section
          aria-label="Problem"
          // `shrink-0` and the sibling's `min-w-0` are what make the width
          // stick: a flex item defaults to `min-width: auto`, so Monaco's
          // min-content width would otherwise refuse to give ground and squeeze
          // this pane straight back to where it started.
          className="flex min-h-0 flex-col border-b border-border lg:w-[var(--split-x)] lg:shrink-0 lg:border-b-0"
        >
          <div
            role="tablist"
            aria-label="Problem sections"
            className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5"
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={clsx(
                  "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === id
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Every tab stays mounted. Switching back to Description after
              opening an approach should return you to where you were reading,
              and unmounting would scroll it back to the top. */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto lg:overscroll-contain">
            <Panel id="description" active={tab === "description"}>
              {description}
            </Panel>
            <Panel id="signals" active={tab === "signals"}>
              {signals}
            </Panel>
            <Panel id="approaches" active={tab === "approaches"}>
              {approaches}
            </Panel>
          </div>
        </section>

        <SplitHandle handleProps={handleProps} dragging={dragging} axis="x" className="hidden lg:block" />

        <section aria-label="Your solution" className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          {solve}
        </section>
      </div>
    </div>
  );
}

function Panel({
  id,
  active,
  children,
}: {
  id: Tab;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      className="px-4 py-5 sm:px-5"
    >
      {children}
    </div>
  );
}
