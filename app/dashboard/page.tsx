import type { Metadata } from "next";
import { tracks } from "@/content/tracks/meta";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { DashboardTrack } from "@/components/dashboard/types";

export const metadata: Metadata = {
  title: "Your Dashboard — DevKernel",
  description:
    "Which tracks you have started and how far into each one you are, by module, with the time each has taken.",
};

/**
 * Projects the curriculum down to what the charts read.
 *
 * Done here, on the server, for two reasons. The obvious one is size: this
 * sends about a fifth of what `TrackMeta` holds, because taglines and
 * descriptions are not on the page. The less obvious one is that importing
 * `@/content/tracks/meta` from a Client Component pulls the generated manifest
 * into the browser bundle, and nothing on this route needs it there.
 *
 * Only `available` lessons are carried. A preview lesson has no Mark Complete
 * button, so counting one in a denominator would make a finished track read as
 * unfinished forever.
 */
function project(): DashboardTrack[] {
  return tracks.map((track) => {
    const modules = track.modules.map((mod) => {
      const lessons = mod.lessons
        .filter((lesson) => lesson.status === "available")
        .map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          estimatedMinutes: lesson.estimatedMinutes,
        }));

      return {
        slug: mod.slug,
        title: mod.title,
        lessons,
        // A module with lessons has no syllabus to publish; a module without
        // them lists its topics on a single preview lesson.
        plannedTopics:
          lessons.length > 0
            ? 0
            : mod.lessons.reduce((sum, lesson) => sum + lesson.takeawayCount, 0),
      };
    });

    return {
      slug: track.slug,
      title: track.title,
      shortTitle: track.shortTitle,
      accent: track.accent,
      mode: track.mode,
      modules,
      totalLessons: modules.reduce((sum, mod) => sum + mod.lessons.length, 0),
      totalMinutes: modules.reduce(
        (sum, mod) =>
          sum + mod.lessons.reduce((inner, lesson) => inner + lesson.estimatedMinutes, 0),
        0
      ),
      liveModules: modules.filter((mod) => mod.lessons.length > 0).length,
      totalModules: modules.length,
      plannedTopics: modules.reduce((sum, mod) => sum + mod.plannedTopics, 0),
    };
  });
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Your dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Which tracks you have started, how far into each one you are, and where to pick up. Every
          number here comes from the lessons you have marked complete.
        </p>
      </header>

      <DashboardClient tracks={project()} />
    </main>
  );
}
