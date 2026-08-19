import type { Company, Difficulty, PatternId, Problem, TopicId } from "./types";
import { arraysHashingProblems } from "./problems/arrays-hashing";
import { twoPointerProblems } from "./problems/two-pointers";
import { slidingWindowProblems } from "./problems/sliding-window";
import { binarySearchProblems } from "./problems/binary-search";
import { stackProblems } from "./problems/stacks";
import { dynamicProgrammingProblems } from "./problems/dynamic-programming";
import { treeGraphProblems } from "./problems/trees-graphs";

export * from "./types";
export { PATTERNS, getPattern, patternName } from "./patterns";
export { TOPICS, getTopic, topicName } from "./topics";

/**
 * The sheet. Order here is the recommended solving order, not alphabetical and
 * not by difficulty: each problem is placed after the one whose idea it builds
 * on, so working straight down the list never asks you to invent a technique
 * you have not met. The filters exist for when you want to break out of that
 * order and drill something specific.
 */
export const PROBLEMS: Problem[] = [
  ...arraysHashingProblems,
  ...twoPointerProblems,
  ...slidingWindowProblems,
  ...binarySearchProblems,
  ...stackProblems,
  ...dynamicProgrammingProblems,
  ...treeGraphProblems,
];

const BY_SLUG = new Map<string, Problem>(PROBLEMS.map((problem) => [problem.slug, problem]));

export function getProblem(slug: string): Problem | undefined {
  return BY_SLUG.get(slug);
}

/** Easy before medium before hard, whatever order the files are in. */
export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export function difficultyRank(difficulty: Difficulty): number {
  return DIFFICULTY_ORDER.indexOf(difficulty);
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * Badge colours for the three difficulties. Written as complete literals so
 * Tailwind's scanner finds them, and contrast-checked against both their own
 * `-soft` background and `--surface`, in light and dark.
 */
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: "bg-easy-soft text-easy",
  medium: "bg-medium-soft text-medium",
  hard: "bg-hard-soft text-hard",
};

export const DIFFICULTY_TEXT_CLASS: Record<Difficulty, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};

/**
 * The part of a problem the sheet needs. Everything filtering, sorting and the
 * table touch lives here — and, more to the point, everything it does *not*
 * touch stays behind: a `Problem` carries several kilobytes of Java, Python and
 * prose per approach, and shipping all of that to the browser to render a table
 * of forty rows would be absurd. The list page projects down to this first.
 */
export type ProblemSummary = Pick<
  Problem,
  "slug" | "title" | "prompt" | "difficulty" | "topics" | "patterns" | "companies"
>;

export function toSummary(problem: Problem): ProblemSummary {
  return {
    slug: problem.slug,
    title: problem.title,
    prompt: problem.prompt,
    difficulty: problem.difficulty,
    topics: problem.topics,
    patterns: problem.patterns,
    companies: problem.companies,
  };
}

export interface FacetOption<T> {
  value: T;
  label: string;
  count: number;
}

/**
 * Filter options, derived from the problems rather than hard-coded — so a
 * company or a pattern can never appear as a chip that matches nothing, and
 * adding a problem updates the filters for free.
 */
export interface Facets {
  difficulties: FacetOption<Difficulty>[];
  topics: FacetOption<TopicId>[];
  patterns: FacetOption<PatternId>[];
  companies: FacetOption<Company>[];
}

function tally<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function buildFacets(
  problems: ProblemSummary[],
  labels: { topic: (id: TopicId) => string; pattern: (id: PatternId) => string }
): Facets {
  const difficulties = tally(problems.map((p) => p.difficulty));
  const topics = tally(problems.flatMap((p) => p.topics));
  const patterns = tally(problems.flatMap((p) => p.patterns));
  const companies = tally(problems.flatMap((p) => p.companies));

  return {
    difficulties: DIFFICULTY_ORDER.filter((d) => difficulties.has(d)).map((d) => ({
      value: d,
      label: DIFFICULTY_LABEL[d],
      count: difficulties.get(d) ?? 0,
    })),
    topics: [...topics.entries()]
      .map(([value, count]) => ({ value, label: labels.topic(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    patterns: [...patterns.entries()]
      .map(([value, count]) => ({ value, label: labels.pattern(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    companies: [...companies.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}

export interface ProblemFilter {
  difficulties: Difficulty[];
  topics: TopicId[];
  patterns: PatternId[];
  companies: Company[];
  /** Free text, matched against the title and the plain-words prompt. */
  query: string;
}

export const EMPTY_FILTER: ProblemFilter = {
  difficulties: [],
  topics: [],
  patterns: [],
  companies: [],
  query: "",
};

/**
 * Within a facet the selections are OR-ed (Easy *or* Medium); across facets they
 * are AND-ed (Easy *and* tagged hashing). That is what every problem site does,
 * and it is what people expect without being told.
 */
export function filterProblems<T extends ProblemSummary>(
  problems: T[],
  filter: ProblemFilter
): T[] {
  const query = filter.query.trim().toLowerCase();

  return problems.filter((problem) => {
    if (filter.difficulties.length > 0 && !filter.difficulties.includes(problem.difficulty)) {
      return false;
    }
    if (filter.topics.length > 0 && !filter.topics.some((t) => problem.topics.includes(t))) {
      return false;
    }
    if (filter.patterns.length > 0 && !filter.patterns.some((p) => problem.patterns.includes(p))) {
      return false;
    }
    if (filter.companies.length > 0 && !filter.companies.some((c) => problem.companies.includes(c))) {
      return false;
    }
    if (query.length > 0) {
      const haystack = `${problem.title} ${problem.prompt}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

export type ProblemSort = "recommended" | "difficulty-asc" | "difficulty-desc" | "title";

export const SORT_LABEL: Record<ProblemSort, string> = {
  recommended: "Recommended order",
  "difficulty-asc": "Easy first",
  "difficulty-desc": "Hard first",
  title: "A–Z",
};

export function sortProblems<T extends ProblemSummary>(problems: T[], sort: ProblemSort): T[] {
  // `recommended` is the order the array is already in, so it needs no work —
  // but the copy keeps every branch non-mutating.
  const copy = [...problems];
  switch (sort) {
    case "difficulty-asc":
      return copy.sort(
        (a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty)
      );
    case "difficulty-desc":
      return copy.sort(
        (a, b) => difficultyRank(b.difficulty) - difficultyRank(a.difficulty)
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy;
  }
}

export function problemHref(slug: string): string {
  return `/practice/${slug}`;
}

export interface PracticeStats {
  total: number;
  byDifficulty: Record<Difficulty, number>;
  patternsCovered: number;
  companiesCovered: number;
}

export function getPracticeStats(): PracticeStats {
  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const problem of PROBLEMS) {
    byDifficulty[problem.difficulty]++;
  }
  return {
    total: PROBLEMS.length,
    byDifficulty,
    patternsCovered: new Set(PROBLEMS.flatMap((p) => p.patterns)).size,
    companiesCovered: new Set(PROBLEMS.flatMap((p) => p.companies)).size,
  };
}
