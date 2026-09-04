import type { Metadata } from "next";
import { PROBLEMS, topicName } from "@/content/practice";
import { tracks } from "@/content/tracks/meta";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardData, DashboardTrack } from "@/components/dashboard/types";

export const metadata: Metadata = {
  title: "Your Dashboard — DevKernel",
  description:
    "Which tracks you have started and how far into each one you are, by module, with the practice problems you have solved and the time each has taken.",
};

/**
 * Projects the curriculum and the practice set down to what the charts read.
 *
 * Done here, on the server, for two reasons. The obvious one is size: this
 * sends a fraction of what `TrackMeta` and `Problem` hold, because taglines,
 * descriptions, statements and worked approaches are not on the page. The less
 * obvious one is that importing `@/content/tracks/meta` from a Client Component
 * pulls the generated manifest into the browser bundle, and nothing on this
 * route needs it there.
 *
 * Only `available` lessons are carried. A preview lesson has no Mark Complete
 * button, so counting one in a denominator would make a finished track read as
 * unfinished forever.
 */
function projectTracks(): DashboardTrack[] {
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

function projectProblems(): DashboardData["problems"] {
  return PROBLEMS.map((problem) => ({
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    // Resolved here so the client needs no topic table to render a label.
    topics: problem.topics.map((id) => topicName(id)),
    runnable: Boolean(problem.judge),
  }));
}

export default function DashboardPage() {
  const data: DashboardData = { tracks: projectTracks(), problems: projectProblems() };

  // A `div`, not a `main`: the root layout already wraps every page in one, and
  // a nested main is invalid and gives a screen reader two document bodies.
  return <div>{<DashboardShell data={data} />}</div>;
}
