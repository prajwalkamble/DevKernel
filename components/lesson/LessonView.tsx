import Link from "next/link";
import { Clock, Construction, ChevronLeft, ChevronRight } from "lucide-react";
import type { Lesson } from "@/content/types";
import { getAdjacentLessons, getTrackBySlug, lessonBudgetLabel, lessonHref } from "@/content/tracks";
import { ProseInline } from "./Prose";
import { SectionBlock } from "./SectionBlock";
import { InterviewQA } from "./InterviewQA";
import { MarkCompleteButton } from "./MarkCompleteButton";

export function LessonView({ lesson, trackSlug }: { lesson: Lesson; trackSlug: string }) {
  const { previous, next } = getAdjacentLessons(trackSlug, lesson.moduleSlug, lesson.slug);
  const isComingSoon = lesson.status === "coming-soon";
  const track = getTrackBySlug(trackSlug);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 space-y-3">
        {isComingSoon && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
            <Construction className="h-4 w-4 shrink-0" />
            This module is coming soon — here&apos;s a preview of what it will cover
            {track && `, at ${lessonBudgetLabel(track)}`}.
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="text-base leading-relaxed text-muted">{lesson.summary}</p>
        {lesson.estimatedMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Clock className="h-4 w-4" />
            {lesson.estimatedMinutes} min read
          </div>
        )}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">
              By the end of this lesson you&apos;ll be able to:
            </p>
            <ul className="space-y-1 text-sm text-foreground/80">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-accent">•</span>
                  <span className="min-w-0">
                    <ProseInline text={obj} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="space-y-10">
        {lesson.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>

      {lesson.takeaways && lesson.takeaways.length > 0 && (
        <div className="mt-10 rounded-lg border border-accent/20 bg-accent-soft p-5">
          <p className="mb-2 text-sm font-semibold text-foreground">
            {isComingSoon ? "The topics it will cover" : "Key takeaways"}
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/85">
            {lesson.takeaways.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-accent">✓</span>
                <span className="min-w-0">
                  <ProseInline text={t} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.interviewQuestions && lesson.interviewQuestions.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Interview questions on this topic
          </h2>
          <InterviewQA questions={lesson.interviewQuestions} />
        </div>
      )}

      {!isComingSoon && (
        <div className="mt-10">
          <MarkCompleteButton
            trackSlug={trackSlug}
            moduleSlug={lesson.moduleSlug}
            lessonSlug={lesson.slug}
          />
        </div>
      )}

      {/* Stacked on phones, side by side from `sm` up. The empty cell keeps
          "Next" in the right-hand column when there is no previous lesson. */}
      <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {previous ? (
          <Link
            href={lessonHref(trackSlug, previous.moduleSlug, previous.slug)}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-surface-hover"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="block text-xs text-muted">Previous</span>
              <span className="block truncate font-medium text-foreground">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={lessonHref(trackSlug, next.moduleSlug, next.slug)}
            className="flex min-w-0 items-center justify-end gap-2 rounded-lg border border-border p-3 text-right text-sm transition-colors hover:bg-surface-hover"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted">Next</span>
              <span className="block truncate font-medium text-foreground">{next.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        )}
      </nav>
    </article>
  );
}
