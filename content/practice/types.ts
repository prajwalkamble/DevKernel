/**
 * The practice half of the DSA track: the problems, and the patterns they are
 * instances of.
 *
 * The shape here is opinionated, and the opinion is the whole point. A problem
 * is not a statement plus an answer; it is a statement, the *signals* in it that
 * tell you which pattern it belongs to, and then a chain of approaches that
 * starts at the answer anyone can find and ends at the one the constraints
 * demand. Storing only the optimal solution would teach the thing that cannot be
 * taught — how to have the clever idea — and skip the thing that can be: how to
 * get from a brute force you already believe to a solution you can defend.
 */

export type Difficulty = "easy" | "medium" | "hard";

/**
 * A solving technique, curated rather than free-form. Keeping this a union means
 * a typo in a problem file is a build error instead of a filter chip that
 * silently matches nothing.
 */
export type PatternId =
  | "brute-force-enumeration"
  | "hashing-for-lookup"
  | "frequency-counting"
  | "two-pointers-opposite"
  | "two-pointers-same-direction"
  | "sliding-window-fixed"
  | "sliding-window-variable"
  | "prefix-sum"
  | "sorting-as-preprocessing"
  | "binary-search-on-index"
  | "binary-search-on-answer"
  | "monotonic-stack"
  | "monotonic-deque"
  | "fast-slow-pointers"
  | "in-place-reversal"
  | "top-k-heap"
  | "two-heaps"
  | "merge-intervals"
  | "cyclic-sort"
  | "tree-dfs"
  | "tree-bfs"
  | "graph-traversal"
  | "topological-sort"
  | "union-find"
  | "shortest-path"
  | "backtracking"
  | "greedy-exchange"
  | "dp-one-dimension"
  | "dp-two-dimensions"
  | "dp-on-subsequences"
  | "bit-manipulation"
  | "math-and-number-theory"
  | "design";

/** The structure or subject area a problem is filed under. */
export type TopicId =
  | "arrays"
  | "strings"
  | "hashing"
  | "sorting"
  | "binary-search"
  | "linked-lists"
  | "stacks-queues"
  | "recursion"
  | "trees"
  | "heaps"
  | "graphs"
  | "greedy"
  | "dynamic-programming"
  | "bit-manipulation"
  | "math"
  | "design";

/**
 * Companies known to ask a problem. A curated union, not free text: the value of
 * a company filter is that "Amazon" and "amazon" are the same chip.
 */
export type Company =
  | "Amazon"
  | "Google"
  | "Microsoft"
  | "Meta"
  | "Apple"
  | "Netflix"
  | "Adobe"
  | "Uber"
  | "Bloomberg"
  | "Goldman Sachs"
  | "Atlassian"
  | "Salesforce"
  | "Oracle"
  | "Flipkart"
  | "Zoho"
  | "TCS"
  | "Infosys"
  | "Accenture"
  | "Walmart"
  | "PayPal"
  | "Swiggy"
  | "Zomato";

export interface ProblemExample {
  input: string;
  output: string;
  /** Why that output, in one or two sentences. Optional for the obvious ones. */
  explanation?: string;
}

/**
 * How good a solution is, relative to the ones around it.
 *
 * `brute-force` is the one you should always be able to write inside a minute —
 * it exists to prove you understood the question. `better` is a real improvement
 * that still misses the constraints. `optimal` meets them. Most problems have
 * two of these; a few have all three, and those are the most instructive.
 */
export type ApproachTier = "brute-force" | "better" | "optimal";

export interface Approach {
  id: string;
  tier: ApproachTier;
  title: string;
  /**
   * The thought that produces this approach, in the order you would actually
   * have it — not a description of the finished code. This is the field to read
   * when you are stuck.
   */
  intuition: string[];
  /** The steps, phrased the way you would say them out loud before coding. */
  walkthrough?: string[];
  /** Big-O, with the variable named. */
  time: string;
  space: string;
  java: string;
  python: string;
  /** Why you move on from this approach — or, for the optimal one, why you stop. */
  verdict: string;
}

/**
 * The types a judged problem's arguments and return value may take.
 *
 * Deliberately small and concrete rather than a general type system: every entry
 * here has an unambiguous JSON encoding, and each one has to be spelled out four
 * times — once per language the console offers — so every addition has a real
 * cost. `tree` is the one indirection: it travels as LeetCode's level-order
 * array with `null` for a missing child, and each runtime rebuilds a real node
 * object from it before calling your function.
 */
export type JudgeType =
  | "int"
  | "double"
  | "boolean"
  | "string"
  | "char"
  | "int[]"
  | "string[]"
  | "char[]"
  | "int[][]"
  | "char[][]"
  // Same JSON as int[] and int[][]; the difference is Java, where LeetCode's own
  // signature for these problems is List<Integer> rather than an array, and
  // making you write the other one would break copy-paste in both directions.
  | "List<int>"
  | "List<List<int>>"
  | "tree";

export interface JudgeParam {
  name: string;
  type: JudgeType;
}

/**
 * How a returned value is checked against the expected one.
 *
 * `exact` is deep equality. `unordered` sorts a flat array first, for problems
 * whose statement says the answer may be in any order. `unordered-nested` sorts
 * both the inner arrays and the outer one, which is what three-sum needs: the
 * triples may come in any order and so may the numbers inside them.
 */
export type JudgeCompare = "exact" | "unordered" | "unordered-nested";

export interface JudgeCase {
  /** Arguments in signature order, JSON-encoded per the parameter types. */
  args: unknown[];
  expected: unknown;
  /** Shown before you run. Keep these the ones already in `examples`. */
  visible?: boolean;
  /** What this case is actually probing — shown when it fails. */
  note?: string;
}

/**
 * Everything the in-browser console needs to run your attempt and mark it.
 *
 * The cases are the point of the field. A problem page can already show you a
 * correct solution; what it cannot otherwise do is tell you whether *yours* is
 * correct, which is the only question that matters while you are practising.
 * Hidden cases exist because a solution that passes only the examples in the
 * statement is the exact failure the framework module warns about.
 */
export interface Judge {
  /** The function your solution must define, named as LeetCode names it. */
  entry: string;
  params: JudgeParam[];
  returns: JudgeType;
  /** Defaults to `exact`. */
  compare?: JudgeCompare;
  cases: JudgeCase[];
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: TopicId[];
  patterns: PatternId[];
  companies: Company[];
  /** One line, in plain words: what is actually being asked. */
  prompt: string;
  statement: string[];
  constraints: string[];
  examples: ProblemExample[];
  /**
   * The reading. Each entry names something in the statement or the constraints
   * and says what it implies — "the array is sorted, so a hash map is one tool
   * too many". This is the field that turns a solved problem into a
   * transferable one.
   */
  signals: string[];
  /** Ordered worst to best. The first entry should always be a brute force. */
  approaches: Approach[];
  /**
   * The signature and test cases the in-browser console runs your attempt
   * against. Optional so a problem can be added before its cases are written,
   * but a problem without one is a problem you can only read.
   */
  judge?: Judge;
  followUps?: string[];
  /** Slugs of problems that are this idea wearing a different hat. */
  related?: string[];
}

export interface Pattern {
  id: PatternId;
  slug: string;
  name: string;
  /** One line: what the pattern buys you. */
  tagline: string;
  /** How a problem statement announces that this is the pattern. */
  triggers: string[];
  /**
   * The property the pattern maintains at every step. Being able to state this
   * is the difference between having memorised a template and understanding it —
   * and it is what an interviewer is listening for.
   */
  invariant: string;
  template: { java: string; python: string };
  time: string;
  space: string;
  /** Where it looks applicable and is not. */
  breaks: string[];
}

export interface Topic {
  id: TopicId;
  name: string;
  /** One line, shown on the filter chip's tooltip and the topic heading. */
  blurb: string;
}
