import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllLessonRefs, getLesson, getTrackBySlug } from "@/content/tracks";
import { LessonShell } from "@/components/layout/LessonShell";
import { LessonView } from "@/components/lesson/LessonView";

interface LessonPageProps {
  params: Promise<{ trackSlug: string; moduleSlug: string; lessonSlug: string }>;
}

/**
 * Every lesson route is enumerated below, so an unknown one is a 404 refused
 * before rendering starts. Without this, `loading.tsx` streams the response and
 * the 200 is already sent by the time `notFound()` is reached.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessonRefs();
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const track = getTrackBySlug(trackSlug);
  const lesson = getLesson(trackSlug, moduleSlug, lessonSlug);
  if (!track || !lesson) return {};
  return {
    title: `${lesson.title} — ${track.shortTitle} — DevKernel`,
    description: lesson.summary,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const lesson = getLesson(trackSlug, moduleSlug, lessonSlug);

  if (!lesson) {
    notFound();
  }

  return (
    <LessonShell>
      <LessonView lesson={lesson} trackSlug={trackSlug} />
    </LessonShell>
  );
}
