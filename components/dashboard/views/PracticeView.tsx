"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import clsx from "clsx";
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER } from "@/content/practice";
import type { Difficulty } from "@/content/practice/types";
import { Card, Empty, Meter, StatTile, percent, plural } from "../parts";
import type { DashboardProblem } from "../types";

/**
 * Difficulty is a status-like ordered scale, not an identity, so it uses the
 * three tokens the rest of the site already badges problems with rather than a
 * categorical slot. Those tokens mean easy/medium/hard everywhere on the site,
 * and reusing them for anything else here would break that.
 */
const DIFFICULTY_FILL: Record<Difficulty, string> = {
  easy: "var(--easy-color)",
  medium: "var(--medium-color)",
  hard: "var(--hard-color)",
};

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "bg-easy-soft text-easy",
  medium: "bg-medium-soft text-medium",
  hard: "bg-hard-soft text-hard",
};

export function PracticeView({
  problems,
  solved,
}: {
  problems: DashboardProblem[];
  solved: Set<string>;
}) {
  const byDifficulty = useMemo(
    () =>
      DIFFICULTY_ORDER.map((difficulty) => {
        const all = problems.filter((p) => p.difficulty === difficulty);
        return {
          difficulty,
          total: all.length,
          done: all.filter((p) => solved.has(p.slug)).length,
        };
      }).filter((row) => row.total > 0),
    [problems, solved]
  );

  const byTopic = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>();
    for (const problem of problems) {
      for (const topic of problem.topics) {
        const row = counts.get(topic) ?? { total: 0, done: 0 };
        row.total++;
        if (solved.has(problem.slug)) row.done++;
        counts.set(topic, row);
      }
    }
    return [...counts.entries()]
      .map(([topic, row]) => ({ topic, ...row }))
      .sort((a, b) => b.done - a.done || b.total - a.total || a.topic.localeCompare(b.topic));
  }, [problems, solved]);

  const solvedCount = problems.filter((p) => solved.has(p.slug)).length;
  const runnable = problems.filter((p) => p.runnable).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon={<Check className="h-5 w-5" />}
          label="Solved"
          value={String(solvedCount)}
          detail={`of ${problems.length} problems`}
        />
        {byDifficulty.map((row) => (
          <StatTile
            key={row.difficulty}
            icon={
              <span className="text-sm font-semibold">
                {DIFFICULTY_LABEL[row.difficulty].charAt(0)}
              </span>
            }
            label={DIFFICULTY_LABEL[row.difficulty]}
            value={`${row.done}`}
            detail={`of ${plural(row.total, "problem")}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-2">
        <Card title="By difficulty" subtitle={`${runnable} of ${problems.length} run in the browser`}>
          <div className="space-y-4">
            {byDifficulty.map((row) => (
              <Meter
                key={row.difficulty}
                pct={percent(row.done, row.total)}
                fill={DIFFICULTY_FILL[row.difficulty]}
                label={DIFFICULTY_LABEL[row.difficulty]}
                right={`${row.done} / ${row.total}`}
              />
            ))}
          </div>
        </Card>

        <Card title="By topic" subtitle="A problem counts under every topic it touches">
          {byTopic.length > 0 ? (
            <div className="space-y-3">
              {byTopic.map((row) => (
                <Meter
                  key={row.topic}
                  pct={percent(row.done, row.total)}
                  fill="var(--accent)"
                  label={row.topic}
                  right={`${row.done} / ${row.total}`}
                  size="sm"
                />
              ))}
            </div>
          ) : (
            <Empty>No problems in the set yet.</Empty>
          )}
        </Card>
      </div>

      <Card title="Every problem" subtitle={`${plural(problems.length, "problem")}`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Every practice problem, its difficulty, its topics, and whether you have solved it.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                  Problem
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Level
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Topics
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => {
                const done = solved.has(problem.slug);
                return (
                  <tr
                    key={problem.slug}
                    className="border-b border-border last:border-0 hover:bg-surface-hover"
                  >
                    <th scope="row" className="px-4 py-3 text-left font-normal sm:px-5">
                      <Link
                        href={`/practice/${problem.slug}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {problem.title}
                      </Link>
                      {/* The Level column drops out below sm, so the badge
                          rides along here rather than off the side of a
                          scroller nobody notices is there. */}
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted md:hidden">
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold sm:hidden",
                            DIFFICULTY_BADGE[problem.difficulty]
                          )}
                        >
                          {DIFFICULTY_LABEL[problem.difficulty]}
                        </span>
                        {/* Wraps rather than truncates. `truncate` sets
                            white-space: nowrap, and a nowrap span inside a
                            table cell becomes that column's minimum width —
                            which floored this table at 383px and pushed the
                            Status column off a 360px screen entirely. */}
                        <span className="min-w-0">{problem.topics.join(" · ")}</span>
                      </span>
                    </th>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          DIFFICULTY_BADGE[problem.difficulty]
                        )}
                      >
                        {DIFFICULTY_LABEL[problem.difficulty]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">
                      {problem.topics.join(" · ")}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-5">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="hidden sm:inline">Solved</span>
                          <span className="sr-only sm:hidden">Solved</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted">
                          <span aria-hidden className="sm:hidden">
                            &mdash;
                          </span>
                          <span className="hidden sm:inline">Not solved</span>
                          <span className="sr-only sm:hidden">Not solved</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
