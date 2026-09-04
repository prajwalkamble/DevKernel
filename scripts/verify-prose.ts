/**
 * Checks that every prose string in the content tree renders the way it reads.
 *
 * Lesson prose is markdown-lite: `components/lesson/Prose.tsx` supports
 * `**bold**`, `*italic*` and `` `code` `` and nothing else. That is a small
 * enough grammar to hold in your head and a large enough one to get wrong
 * silently, because a mis-paired delimiter is not a crash and not a type error
 * — the page renders, and one sentence comes out with a stray asterisk in it or
 * with three unrelated words in italics. Nobody reads all 28,000 strings, so
 * the check is machine-made.
 *
 * Five defects were already present when this was written: a trailing backtick
 * inside a bold run, an escaped backtick inside a code span (code spans cannot
 * contain one), two `**bold *italic* bold**` nestings — which the renderer's
 * italic rule cannot express, so they leave a loose asterisk — and a list of
 * Rust method prefixes, `checked_*, saturating_* or wrapping_*`, where the
 * middle two asterisks paired up and italicised ", saturating_".
 *
 * What is deliberately not flagged: a lone literal asterisk. `yield*`, `A*`,
 * `COUNT(*)`, `*ngIf` and `i*i` all render exactly as written, because an
 * emphasis delimiter has to hug non-whitespace at both ends and find a partner.
 * The rules below fire only where the renderer's output differs from the
 * author's evident intent.
 *
 * Usage: npm run verify:prose
 */
import { tracks } from "@/content/tracks";

/** The tokeniser from `Prose.tsx`, which is the thing being predicted. */
const INLINE = /(\*\*(?=\S)[\s\S]*?[^\s*]\*\*|\*(?=\S)[^*]*[^\s*]\*|`[^`]+`)/g;

function faults(text: string): string[] {
  const found: string[] = [];

  // A code span cannot contain a backtick, so an odd count is always a typo.
  if ((text.match(/`/g) ?? []).length % 2 !== 0) {
    found.push("odd number of backticks");
  }

  // `**bold *italic* bold**` and friends: the italic delimiters cannot nest
  // inside the bold, so the run of three closes the bold and orphans one.
  if (/\*{3,}/.test(text)) {
    found.push("a run of three or more asterisks");
  }

  const tokens = text.split(INLINE).filter(Boolean);
  const italics = tokens.some((t) => t.startsWith("*") && !t.startsWith("**") && t.endsWith("*"));
  const leftover = text
    .split(INLINE)
    .filter((_, i) => i % 2 === 0)
    .join("")
    .includes("*");

  // One literal asterisk in a sentence is fine. A literal asterisk in a
  // sentence that also produced italics means two unrelated operators found
  // each other.
  if (italics && leftover) {
    found.push("an asterisk pair that spans unrelated text");
  }

  return found;
}

const problems: string[] = [];
let checked = 0;

for (const track of tracks) {
  for (const mod of track.modules) {
    for (const lesson of mod.lessons) {
      const at = `${track.slug}/${mod.slug}/${lesson.slug}`;
      const strings: [string, string][] = [["summary", lesson.summary]];
      for (const objective of lesson.objectives ?? []) strings.push(["objective", objective]);
      for (const takeaway of lesson.takeaways ?? []) strings.push(["takeaway", takeaway]);
      for (const question of lesson.interviewQuestions ?? []) {
        strings.push(["interview question", question.question]);
        strings.push(["interview answer", question.answer]);
      }
      for (const section of lesson.sections) {
        strings.push([`${section.id} heading`, section.heading]);
        for (const paragraph of section.body ?? []) strings.push([`${section.id} body`, paragraph]);
        for (const pitfall of section.pitfalls ?? []) {
          strings.push([`${section.id} pitfall title`, pitfall.title]);
          strings.push([`${section.id} pitfall body`, pitfall.body]);
        }
        for (const example of section.examples ?? []) {
          if (example.title) strings.push([`${example.id} title`, example.title]);
          if (example.explanation) strings.push([`${example.id} explanation`, example.explanation]);
        }
      }

      for (const [where, text] of strings) {
        checked++;
        for (const fault of faults(text)) {
          problems.push(`${at} (${where}): ${fault}\n      ${text.slice(0, 120)}`);
        }
      }
    }
  }
}

console.log(`${checked} prose strings checked for inline markup that would render wrongly.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("no problems.");
