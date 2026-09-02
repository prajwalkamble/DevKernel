/**
 * Checks that every id in the content tree is unique within its scope.
 *
 * An id is not a display string — it is the name a thing can be referred to by.
 * Two lessons sharing one is not a rendering bug, which is why it can sit in
 * the tree for a long time without anyone noticing: routing and stored progress
 * are keyed by `trackSlug/moduleSlug/lessonSlug`, so nothing reads a lesson id
 * today. The cost is deferred rather than absent. The first feature that does
 * key on it — a bookmark, a resume-where-you-left-off record, an analytics
 * dimension, a cross-lesson link — silently conflates the two lessons, and the
 * data it wrote is unrecoverable because there is nothing in it that says which
 * one was meant.
 *
 * So the invariant is asserted here instead of discovered later. Five lesson
 * ids were already duplicated when this was written: four pairs in `dsa` and
 * one in `cpp`, each a foundational lesson and its advanced twin, which is
 * exactly how it happens — the second lesson is written by copying the first.
 *
 * Scopes, chosen to match what each id has to be unique against:
 *
 *   - track, module, lesson: globally, since those are the things a future
 *     reference would name without a path.
 *   - section: within its lesson, because `SectionBlock` uses it as a React key
 *     and a lesson page renders one lesson's sections together.
 *   - example: within its section, for the same reason in `ComparisonPanel`.
 *
 * Usage: npm run verify:ids
 */
import { tracks } from "@/content/tracks";

const problems: string[] = [];

/** Records one id and reports the second and later claims on it. */
function unique(scope: Map<string, string>, id: string, where: string, kind: string) {
  const first = scope.get(id);
  if (first === undefined) {
    scope.set(id, where);
    return;
  }
  problems.push(`${kind} id "${id}" is claimed by both ${first} and ${where}`);
}

const trackIds = new Map<string, string>();
const moduleIds = new Map<string, string>();
const lessonIds = new Map<string, string>();

let counted = 0;

for (const track of tracks) {
  unique(trackIds, track.id, track.slug, "track");
  counted++;
  for (const mod of track.modules) {
    unique(moduleIds, mod.id, `${track.slug}/${mod.slug}`, "module");
    counted++;
    for (const lesson of mod.lessons) {
      const at = `${track.slug}/${mod.slug}/${lesson.slug}`;
      unique(lessonIds, lesson.id, at, "lesson");
      counted++;

      const sectionIds = new Map<string, string>();
      for (const section of lesson.sections ?? []) {
        unique(sectionIds, section.id, `${at}#${section.id}`, "section");
        counted++;

        const exampleIds = new Map<string, string>();
        for (const example of section.examples ?? []) {
          unique(exampleIds, example.id, `${at}#${section.id}/${example.id}`, "example");
          counted++;
        }
      }
    }
  }
}

console.log(
  `${counted} ids checked: ${trackIds.size} tracks, ${moduleIds.size} modules, ` +
    `${lessonIds.size} lessons, and their sections and examples.`
);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("no problems.");
