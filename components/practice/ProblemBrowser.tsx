"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import {
  buildFacets,
  DIFFICULTY_BADGE_CLASS,
  DIFFICULTY_LABEL,
  EMPTY_FILTER,
  filterProblems,
  patternName,
  problemHref,
  SORT_LABEL,
  sortProblems,
  topicName,
  type Company,
  type Difficulty,
  type FacetOption,
  type PatternId,
  type ProblemFilter,
  type ProblemSort,
  type ProblemSummary,
  type TopicId,
} from "@/content/practice";
import { useSolvedProblems } from "@/lib/usePracticeProgress";

/** One selected facet value, rendered as a removable chip while the panel is folded. */
interface ActiveChip {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * The sheet.
 *
 * Filtering runs in the browser over a list that is already fully present —
 * there are a few dozen problems, not a few thousand, so paginating or querying
 * a server would add latency and a loading state to buy nothing. The whole page
 * is still statically generated; only the filtering is client-side.
 */
export function ProblemBrowser({ problems }: { problems: ProblemSummary[] }) {
  const [filter, setFilter] = useState<ProblemFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<ProblemSort>("recommended");
  const [hideSolved, setHideSolved] = useState(false);
  // Four rows of chips are the right tool once you know what you are looking
  // for and pure noise before that, so they start folded. What is *selected*
  // stays visible either way — a filter you cannot see is a list that lies.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { solved, isSolved } = useSolvedProblems();

  // Facets are computed from the unfiltered list on purpose: counts that
  // changed as you selected would make a chip vanish the moment you used it.
  const facets = useMemo(
    () => buildFacets(problems, { topic: topicName, pattern: patternName }),
    [problems]
  );

  const visible = useMemo(() => {
    const matched = filterProblems(problems, filter);
    const afterSolved = hideSolved ? matched.filter((p) => !solved.has(p.slug)) : matched;
    return sortProblems(afterSolved, sort);
  }, [problems, filter, sort, hideSolved, solved]);

  // The query is counted separately from the facets: it is already visible in
  // the search box, so folding it into the Filters badge would double-report it.
  const facetCount =
    filter.difficulties.length +
    filter.topics.length +
    filter.patterns.length +
    filter.companies.length;
  const activeCount = facetCount + (filter.query.trim() ? 1 : 0);

  const activeChips: ActiveChip[] = [
    ...filter.difficulties.map((value) => ({
      key: `difficulty:${value}`,
      label: DIFFICULTY_LABEL[value],
      clear: () => toggleIn<Difficulty>("difficulties", value),
    })),
    ...filter.topics.map((value) => ({
      key: `topic:${value}`,
      label: topicName(value),
      clear: () => toggleIn<TopicId>("topics", value),
    })),
    ...filter.patterns.map((value) => ({
      key: `pattern:${value}`,
      label: patternName(value),
      clear: () => toggleIn<PatternId>("patterns", value),
    })),
    ...filter.companies.map((value) => ({
      key: `company:${value}`,
      label: value,
      clear: () => toggleIn<Company>("companies", value),
    })),
  ];

  function toggleIn<T>(key: keyof ProblemFilter, value: T) {
    setFilter((current) => {
      const list = current[key] as T[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...current, [key]: next };
    });
  }

  const solvedCount = problems.filter((p) => isSolved(p.slug)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filter.query}
            onChange={(event) => setFilter((c) => ({ ...c, query: event.target.value }))}
            placeholder="Search problems"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <label className="relative">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ProblemSort)}
            aria-label="Sort problems"
            className="appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-8 text-sm font-medium text-foreground focus:border-accent focus:outline-none"
          >
            {(Object.keys(SORT_LABEL) as ProblemSort[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABEL[option]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            filtersOpen || facetCount > 0
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface text-muted hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {facetCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-background">
              {facetCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setHideSolved((v) => !v)}
          aria-pressed={hideSolved}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            hideSolved
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface text-muted hover:text-foreground"
          )}
        >
          Hide solved
        </button>
      </div>

      {filtersOpen && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <FacetRow
            label="Difficulty"
            options={facets.difficulties}
            selected={filter.difficulties}
            onToggle={(value) => toggleIn<Difficulty>("difficulties", value)}
            tone="difficulty"
          />
          <FacetRow
            label="Topic"
            options={facets.topics}
            selected={filter.topics}
            onToggle={(value) => toggleIn<TopicId>("topics", value)}
          />
          <FacetRow
            label="Pattern"
            options={facets.patterns}
            selected={filter.patterns}
            onToggle={(value) => toggleIn<PatternId>("patterns", value)}
            collapsible
          />
          <FacetRow
            label="Company"
            options={facets.companies}
            selected={filter.companies}
            onToggle={(value) => toggleIn<Company>("companies", value)}
            collapsible
          />
        </div>
      )}

      {/* Selections stay on screen when the panel is folded away, so the list is
          never quietly shorter than it looks. */}
      {!filtersOpen && activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted">
        <span>
          {visible.length} of {problems.length} problems
          {solvedCount > 0 && ` · ${solvedCount} solved`}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter(EMPTY_FILTER)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            <X className="h-3.5 w-3.5" />
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Nothing matches those filters. Clear one and try again.
        </p>
      ) : (
        <ul className="grid gap-1.5 2xl:grid-cols-2">
          {visible.map((problem) => (
            <li key={problem.slug}>
              <Link
                href={problemHref(problem.slug)}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <span
                  className={clsx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isSolved(problem.slug)
                      ? "border-success bg-success text-background"
                      : "border-muted/50"
                  )}
                  aria-hidden
                >
                  {isSolved(problem.slug) && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{problem.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${DIFFICULTY_BADGE_CLASS[problem.difficulty]}`}
                    >
                      {DIFFICULTY_LABEL[problem.difficulty]}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{problem.prompt}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {problem.patterns.map((pattern) => (
                      <span
                        key={pattern}
                        className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted"
                      >
                        {patternName(pattern)}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FacetRow<T extends string>({
  label,
  options,
  selected,
  onToggle,
  tone,
  collapsible = false,
}: {
  label: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  tone?: "difficulty";
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  // The pattern and company lists run to a few dozen entries each. Folding them
  // to one line keeps the whole panel scannable in a glance.
  const shown = collapsible && !expanded ? options.slice(0, 8) : options;
  const hidden = options.length - shown.length;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
      {/* Wide enough for "DIFFICULTY", which is the longest of the four and
          wraps mid-word at anything narrower. */}
      <span className="w-[5.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {shown.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            aria-pressed={active}
            className={clsx(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? tone === "difficulty"
                  ? `border-transparent ${DIFFICULTY_BADGE_CLASS[option.value as Difficulty]}`
                  : "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface text-muted hover:border-muted/50 hover:text-foreground"
            )}
          >
            {option.label}
            <span className="ml-1 opacity-60">{option.count}</span>
          </button>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
        >
          +{hidden} more
        </button>
      )}
    </div>
  );
}
