import type { ModuleDefinition, Lesson } from "@/content/types";

interface ComingSoonModuleInput {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  topics: string[];
  /** Optional stage grouping; see ModuleDefinition.phase. */
  phase?: string;
  /**
   * Mirrors the owning track's flag. Rust and Assembly are here to build with,
   * so their previews must not promise interview questions they will not carry.
   */
  interviewPrep?: boolean;
}

export function createComingSoonModule({
  id,
  slug,
  title,
  description,
  order,
  topics,
  phase,
  interviewPrep = true,
}: ComingSoonModuleInput): ModuleDefinition {
  const lesson: Lesson = {
    id: `${id}-coming-soon`,
    slug: "coming-soon",
    moduleSlug: slug,
    title: `${title} — Coming Soon`,
    summary: description,
    estimatedMinutes: 0,
    sections: [
      {
        id: "preview",
        heading: "What this module will cover",
        body: [
          // The description is already the lesson summary above, so say
          // something useful here rather than repeating it.
          interviewPrep
            ? "The lessons for this module are still being written. The syllabus below is settled, and each topic becomes a full lesson with worked examples, the pitfalls that catch people out, and interview questions — the same depth as the modules that are already live."
            : "The lessons for this module are still being written. The syllabus below is settled, and each topic becomes a full lesson with programs you can build and run, the pitfalls that catch people out, and the reasoning behind them — the same depth as the modules that are already live.",
        ],
      },
    ],
    takeaways: topics,
    status: "coming-soon",
  };

  return {
    id,
    slug,
    title,
    description,
    order,
    status: "coming-soon",
    lessons: [lesson],
    phase,
  };
}
