"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Grid3x3,
  LayoutDashboard,
  Menu,
  Target,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useProgress } from "@/lib/useProgress";
import { useSolvedProblems } from "@/lib/usePracticeProgress";
import { Meter, percent, plural } from "./parts";
import { byProgress, countStale, readTracks, totalsOf } from "./progress";
import { OverviewView } from "./views/OverviewView";
import { TracksView } from "./views/TracksView";
import { ModulesView } from "./views/ModulesView";
import { PracticeView } from "./views/PracticeView";
import type { DashboardData } from "./types";

const VIEWS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tracks", label: "Tracks", icon: BookOpen },
  { id: "modules", label: "Modules", icon: Grid3x3 },
  { id: "practice", label: "Practice", icon: Target },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

const IDS = VIEWS.map((v) => v.id) as readonly string[];
const isViewId = (value: string): value is ViewId => IDS.includes(value);

/**
 * Which view is showing, kept in the URL fragment.
 *
 * The fragment rather than a query parameter on purpose: `useSearchParams`
 * forces the route under a Suspense boundary and opts it out of static
 * generation, and this page has nothing to gain from either. A fragment is
 * readable without a hook, survives a copied link, and gives back and forward
 * for free through `hashchange`.
 */
function useHashView(): [ViewId, (next: ViewId) => void] {
  const [view, setView] = useState<ViewId>("overview");

  useEffect(() => {
    const read = () => {
      const raw = window.location.hash.replace(/^#/, "");
      setView(isViewId(raw) ? raw : "overview");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = useCallback((next: ViewId) => {
    // Assigning the hash pushes a history entry, which is what makes Back
    // return to the previous tab rather than leaving the dashboard.
    window.location.hash = next;
    setView(next);
  }, []);

  return [view, go];
}

/** The rail's contents, shared by the fixed sidebar and the mobile drawer. */
function RailBody({
  view,
  onNavigate,
  done,
  total,
  solved,
  problems,
}: {
  view: ViewId;
  onNavigate: (next: ViewId) => void;
  done: number;
  total: number;
  solved: number;
  problems: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dash-rail-muted">
          Your progress
        </p>
      </div>

      <nav aria-label="Dashboard sections" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    // 44px tall: a touch target you can hit without aiming.
                    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-dash-rail-raised text-dash-rail-fg"
                      : "text-dash-rail-muted hover:bg-dash-rail-raised/60 hover:text-dash-rail-fg"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                  {active && (
                    <span
                      aria-hidden
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* The rail's own summary card, the way the templates this follows put a
          user card at the foot of the sidebar. */}
      <div className="border-t border-dash-rail-line p-3">
        <div className="rounded-lg bg-dash-rail-raised p-3">
          <p className="text-xs text-dash-rail-muted">Curriculum</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-dash-rail-fg">
            {percent(done, total)}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-dash-rail-line">
            {done > 0 && (
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${percent(done, total)}%` }}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-dash-rail-muted">
            {done}/{total} lessons · {solved}/{problems} problems
          </p>
        </div>
        <Link
          href="/curriculum"
          className="mt-2 block rounded-lg px-3 py-2 text-xs font-medium text-dash-rail-muted transition-colors hover:bg-dash-rail-raised hover:text-dash-rail-fg"
        >
          Browse the curriculum →
        </Link>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Loading your progress">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="h-56 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const { completed, hydrated } = useProgress();
  const { solved } = useSolvedProblems();
  const [view, go] = useHashView();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const entries = useMemo(() => readTracks(data.tracks, completed), [data.tracks, completed]);
  const stale = useMemo(() => countStale(data.tracks, completed), [data.tracks, completed]);
  const totals = useMemo(() => totalsOf(data.tracks, entries), [data.tracks, entries]);
  const started = useMemo(
    () => entries.filter((e) => e.done > 0).sort(byProgress(data.tracks)),
    [entries, data.tracks]
  );
  const solvedCount = data.problems.filter((p) => solved.has(p.slug)).length;

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    openerRef.current?.focus();
  }, []);

  // While the drawer is open it owns the screen: the page behind it must not
  // scroll, Escape must close it, and Tab must not walk out of it into content
  // the backdrop is covering.
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = drawerRef.current;
    panel?.querySelector<HTMLElement>("button, a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  const navigate = useCallback(
    (next: ViewId) => {
      go(next);
      setDrawerOpen(false);
    },
    [go]
  );

  const current = VIEWS.find((v) => v.id === view) ?? VIEWS[0];

  const rail = (
    <RailBody
      view={view}
      onNavigate={navigate}
      done={totals.done}
      total={totals.lessons}
      solved={solvedCount}
      problems={data.problems.length}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-[100rem]">
      {/* The fixed rail. `top-14` clears the site header, and the height is
          measured against it so the rail scrolls independently of the page.
          `dvh` rather than `vh`: on iOS `vh` counts the space behind the URL
          bar, which puts the rail's own footer under it. */}
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-dash-rail-line bg-dash-rail lg:block">
        {rail}
      </aside>

      <div className="min-w-0 flex-1 lg:min-h-[calc(100dvh-3.5rem)]">
        {/* The page's own toolbar: the drawer trigger, where it is, and the
            reset. Sticky so the trigger is reachable from anywhere down a long
            table. */}
        <div className="sticky top-14 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              ref={openerRef}
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-surface-hover lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
              <span className="sr-only">Open dashboard sections</span>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {current.label}
              </h1>
              <p className="hidden text-xs text-muted sm:block">
                {totals.done} of {plural(totals.lessons, "lesson")} complete ·{" "}
                {solvedCount} of {plural(data.problems.length, "problem")} solved
              </p>
            </div>

            <div className="hidden w-40 shrink-0 md:block">
              <Meter
                pct={percent(totals.done, totals.lessons)}
                fill="var(--accent)"
                size="sm"
                right={`${percent(totals.done, totals.lessons)}%`}
                label="Overall"
              />
            </div>
          </div>

          {/* Section tabs, mirroring the rail for anyone on a tablet who has
              neither the rail nor a reason to open a drawer. */}
          <div className="-mb-px flex gap-1 overflow-x-auto px-4 sm:px-6 lg:hidden">
            {VIEWS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={view === id ? "page" : undefined}
                className={clsx(
                  "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  view === id
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hydrated ? (
          <div className="p-4 sm:p-6">
            {view === "overview" && (
              <OverviewView
                entries={entries}
                started={started}
                totals={totals}
                problems={data.problems}
                solved={solved}
                onSeeAll={() => navigate("tracks")}
              />
            )}
            {view === "tracks" && <TracksView entries={entries} />}
            {view === "modules" && <ModulesView entries={entries} />}
            {view === "practice" && (
              <PracticeView problems={data.problems} solved={solved} />
            )}

            <footer className="mt-8 space-y-2 border-t border-border pt-5 text-xs text-muted">
              <p>
                Progress is stored in this browser only — it is never sent anywhere, so it does
                not follow you to another device and clearing site data resets it.
              </p>
              {stale > 0 && (
                <p>
                  {plural(stale, "completed lesson")} in storage no longer{" "}
                  {stale === 1 ? "matches a lesson" : "match lessons"} in the curriculum, most
                  likely renamed since. {stale === 1 ? "It is" : "They are"} left alone and not
                  counted above.
                </p>
              )}
            </footer>
          </div>
        ) : (
          <Skeleton />
        )}
      </div>

      {/* The drawer. Rendered only while open, so nothing in it is tabbable
          from the page behind it and no duplicate landmark sits in the tree. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close dashboard sections"
            onClick={closeDrawer}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard sections"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-dash-rail shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-dash-rail-line px-4 py-3">
              <span className="text-sm font-semibold text-dash-rail-fg">Dashboard</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="grid h-9 w-9 place-items-center rounded-lg text-dash-rail-muted transition-colors hover:bg-dash-rail-raised hover:text-dash-rail-fg"
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="min-h-0 flex-1">{rail}</div>
          </div>
        </div>
      )}
    </div>
  );
}
