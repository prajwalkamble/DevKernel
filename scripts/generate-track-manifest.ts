/**
 * Derives `content/tracks/manifest.generated.ts` from the real curriculum.
 *
 * The manifest is the curriculum with lesson bodies removed, and it exists so
 * that pages needing only titles, counts and durations do not have to import
 * 621 lesson files to get them. It is generated rather than written because a
 * hand-maintained copy of a 621-file tree drifts on the first busy afternoon,
 * and a drifted manifest is worse than no manifest: the sidebar would list a
 * lesson the lesson route would then 404 on.
 *
 * Run `npm run manifest` after changing any content. `npm run verify` fails if
 * the committed file is not what this script would produce.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { tracks } from "@/content/tracks";
import type { LessonMeta, ModuleMeta, TrackMeta } from "@/content/tracks/meta-types";

const OUT = path.join(process.cwd(), "content/tracks/manifest.generated.ts");

function toMeta(): TrackMeta[] {
  return tracks.map((track) => ({
    id: track.id,
    slug: track.slug,
    title: track.title,
    shortTitle: track.shortTitle,
    tagline: track.tagline,
    description: track.description,
    order: track.order,
    status: track.status,
    accent: track.accent,
    mode: track.mode,
    lessonMinutes: track.lessonMinutes,
    interviewPrep: track.interviewPrep,
    runnable: track.runnable,
    modules: track.modules.map(
      (mod): ModuleMeta => ({
        slug: mod.slug,
        trackSlug: mod.trackSlug,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        status: mod.status,
        ...(mod.phase === undefined ? {} : { phase: mod.phase }),
        lessons: mod.lessons.map(
          (lesson): LessonMeta => ({
            slug: lesson.slug,
            moduleSlug: lesson.moduleSlug,
            title: lesson.title,
            estimatedMinutes: lesson.estimatedMinutes,
            status: lesson.status,
            takeawayCount: lesson.takeaways?.length ?? 0,
          })
        ),
      })
    ),
  }));
}

/**
 * `JSON.stringify` rather than a bespoke printer: the manifest is data, the
 * output is deterministic, and a printer would be one more thing that can be
 * subtly wrong about escaping. The type annotation is what makes it a
 * type-checked module rather than a blob.
 */
function render(metas: TrackMeta[]): string {
  return `/**
 * GENERATED FILE — do not edit.
 *
 * Produced by \`npm run manifest\` from the curriculum in \`content/tracks\`.
 * \`npm run verify\` fails when this file and the tracks disagree.
 *
 * This is the curriculum with lesson bodies removed. Import it — through
 * \`@/content/tracks/meta\` — from anything that needs titles, counts,
 * durations or statuses, and import \`@/content/tracks\` only where a lesson's
 * sections are genuinely needed.
 */
import type { TrackMeta } from "./meta-types";

export const trackMetas: TrackMeta[] = ${JSON.stringify(metas, null, 2)};
`;
}

const rendered = render(toMeta());

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== rendered) {
    console.error(
      "content/tracks/manifest.generated.ts is out of date.\n" +
        "The curriculum changed without the manifest being regenerated, which would\n" +
        "leave the sidebar and the curriculum map describing a tree that no longer\n" +
        "exists. Run `npm run manifest` and commit the result."
    );
    process.exit(1);
  }
  console.log("track manifest is up to date.");
} else {
  writeFileSync(OUT, rendered);
  const lessons = toMeta().reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0
  );
  console.log(
    `wrote content/tracks/manifest.generated.ts — ${toMeta().length} tracks, ${lessons} lessons, ` +
      `${(Buffer.byteLength(rendered) / 1024).toFixed(0)} KB`
  );
}
