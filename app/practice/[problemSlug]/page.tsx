import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { ApproachPanel } from "@/components/practice/ApproachPanel";
import { DifficultyBadge } from "@/components/practice/DifficultyBadge";
import { ProblemWorkspace } from "@/components/practice/ProblemWorkspace";
import { SolutionLanguageTabs } from "@/components/practice/SolutionLanguagePane";
import { SolveConsole } from "@/components/practice/SolveConsole";
import { SolvedToggle } from "@/components/practice/SolvedToggle";
import { Prose, ProseInline } from "@/components/lesson/Prose";
import {
  getPattern,
  getProblem,
  problemHref,
  PROBLEMS,
  topicName,
} from "@/content/practice";

interface ProblemPageProps {
  params: Promise<{ problemSlug: string }>;
}

/** Every problem is known at build time, so anything else is genuinely a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return PROBLEMS.map((problem) => ({ problemSlug: problem.slug }));
}

export async function generateMetadata({ params }: ProblemPageProps): Promise<Metadata> {
  const { problemSlug } = await params;
  const problem = getProblem(problemSlug);
  if (!problem) return {};
  return {
    title: `${problem.title} — DevKernel`,
    description: problem.prompt,
  };
}

/**
 * A problem, as a workspace.
 *
 * Everything below is rendered on the server and handed to the client shell as
 * slots. That keeps Shiki's highlighting and the whole content tree out of the
 * browser bundle — the only thing the client half needs to do is decide which
 * pane is how wide and which tab is showing.
 */
export default async function ProblemPage({ params }: ProblemPageProps) {
  const { problemSlug } = await params;
  const problem = getProblem(problemSlug);

  if (!problem) {
    notFound();
  }

  const index = PROBLEMS.findIndex((p) => p.slug === problem.slug);
  const previous = index > 0 ? PROBLEMS[index - 1] : null;
  const next = index < PROBLEMS.length - 1 ? PROBLEMS[index + 1] : null;

  const topBar = (
    <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
      <Link
        href="/practice"
        /* Below sm the label is hidden and only the chevron remains, so the
           link needs a box of its own or it is a 16px target. */
        className="-ml-1.5 flex min-h-9 shrink-0 items-center gap-1 rounded-md px-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:ml-0 sm:min-h-0 sm:px-0 sm:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">All problems</span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
          {problem.title}
        </h1>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      <nav aria-label="Adjacent problems" className="flex shrink-0 items-center gap-1">
        {previous ? (
          <Link
            href={problemHref(previous.slug)}
            title={`Previous: ${previous.title}`}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous problem: {previous.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link
            href={problemHref(next.slug)}
            title={`Next: ${next.title}`}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next problem: {next.title}</span>
          </Link>
        ) : null}
      </nav>
    </div>
  );

  const description = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {problem.topics.map((topic) => (
          <span
            key={topic}
            className="rounded bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted"
          >
            {topicName(topic)}
          </span>
        ))}
      </div>

      <p className="text-base leading-relaxed text-foreground/90">{problem.prompt}</p>

      <Prose paragraphs={problem.statement} />

      <div className="space-y-3">
        {problem.examples.map((example, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Example {i + 1}
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted">Input</dt>
                <dd className="min-w-0 overflow-x-auto font-mono text-foreground/90">
                  {example.input}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted">Output</dt>
                <dd className="min-w-0 overflow-x-auto font-mono text-foreground/90">
                  {example.output}
                </dd>
              </div>
            </dl>
            {example.explanation && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                <ProseInline text={example.explanation} />
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Constraints</p>
        <ul className="space-y-1 font-mono text-sm text-foreground/80">
          {problem.constraints.map((constraint, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted">·</span>
              {constraint}
            </li>
          ))}
        </ul>
      </div>

      {problem.followUps && problem.followUps.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Follow-ups they will ask</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">
            {problem.followUps.map((followUp, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 text-muted">·</span>
                <span>
                  <ProseInline text={followUp} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {problem.related && problem.related.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Same idea, different hat</h2>
          <ul className="mt-2 grid gap-1.5">
            {problem.related.map((slug) => {
              const other = getProblem(slug);
              if (!other) {
                return null;
              }
              return (
                <li key={slug}>
                  <Link
                    href={problemHref(slug)}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                  >
                    <DifficultyBadge difficulty={other.difficulty} />
                    <span className="min-w-0 flex-1 truncate text-foreground/90">
                      {other.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <SolvedToggle slug={problem.slug} />
        <span className="text-xs text-muted">
          Tagged for {problem.companies.slice(0, 4).join(", ")}
          {problem.companies.length > 4 && ` +${problem.companies.length - 4} more`}
        </span>
      </div>
    </div>
  );

  const signals = (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/25 bg-accent-soft/50 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
          Read the signals first
        </h2>
        <p className="mt-1 text-sm text-muted">
          Before opening the approaches: what in the statement tells you which pattern this is?
        </p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/85">
          {problem.signals.map((signal, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 text-accent">→</span>
              <span>
                <ProseInline text={signal} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {problem.patterns.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">The patterns behind it</h2>
          <div className="mt-2 space-y-3">
            {problem.patterns.map((id) => {
              const pattern = getPattern(id);
              if (!pattern) {
                return null;
              }
              return (
                <div key={id} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-medium text-foreground">{pattern.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{pattern.tagline}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    <span className="font-medium text-foreground">The invariant: </span>
                    <ProseInline text={pattern.invariant} />
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );

  const approaches = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            From brute force to optimal
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {problem.approaches.length} approaches — try yours first.
          </p>
        </div>
        <SolutionLanguageTabs />
      </div>
      {problem.approaches.map((approach, i) => (
        <ApproachPanel key={approach.id} approach={approach} index={i} />
      ))}
    </div>
  );

  return (
    <ProblemWorkspace
      topBar={topBar}
      description={description}
      signals={signals}
      approaches={approaches}
      solve={
        <SolveConsole slug={problem.slug} title={problem.title} judge={problem.judge!} />
      }
    />
  );
}
