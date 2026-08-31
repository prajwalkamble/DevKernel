import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { introductionToProgrammingModule } from "./modules/01-introduction-to-programming";
import { yourSolvingLanguageModule } from "./modules/02-your-solving-language";
import { inputOutputDataTypesModule } from "./modules/03-input-output-and-data-types";
import { operatorsModule } from "./modules/04-operators-and-expressions";
import { conditionalsAndLoopsModule } from "./modules/05-conditionals-and-loops";
import { patternPrintingModule } from "./modules/06-pattern-printing";
import { functionsModule } from "./modules/07-functions-and-the-call-stack";
import { arraysAndStringsModule } from "./modules/08-arrays-and-strings";
import { numberSystemsModule } from "./modules/09-number-systems-and-maths";
import { introductionToDataStructuresModule } from "./modules/10-introduction-to-data-structures";
import { complexityModule } from "./modules/11-time-and-space-complexity";
import { dsaFrameworkModule } from "./modules/05-framework";
import { arraysStringsInPlaceModule } from "./modules/13-arrays-and-strings";
import { bitsAndMathModule } from "./modules/14-bits-and-math";
import { binarySearchModule } from "./modules/15-binary-search";
import { twoPointersModule } from "./modules/16-two-pointers";
import { slidingWindowsModule } from "./modules/17-sliding-windows";
import { prefixSumsModule } from "./modules/18-prefix-sums";
import { recursionModule } from "./modules/19-recursion";
import { hashingModule } from "./modules/20-hashing";
import { sortingModule } from "./modules/21-sorting";
import { linkedListsModule } from "./modules/22-linked-lists";
import { stacksAndQueuesModule } from "./modules/23-stacks-and-queues";
import { treesModule } from "./modules/24-trees";
import { heapsModule } from "./modules/25-heaps";
import { greedyModule } from "./modules/26-greedy-algorithms";

/**
 * Data structures and algorithms, built around one goal: that you can open a
 * problem you have never seen and know, within a minute, what it is asking, what
 * structure it wants and which algorithm applies — and only then start typing.
 *
 * The track covers Module 0 and Module 1 of the roadmap, and is deliberately
 * usable from two very different starting points.
 *
 * **Module 0 — Programming constructs** assumes nothing at all: not a language,
 * not a loop, not an array. It exists because the usual advice to a beginner —
 * "just start doing problems" — asks them to learn recursion and their first
 * programming language simultaneously, and they reliably conclude they are bad
 * at algorithms when they were only ever bad at for-loops. Anyone who already
 * codes should skim the eleven module titles, confirm there is nothing there
 * they cannot already do, and skip straight to the framework.
 *
 * **The framework** is the bridge, and the stage most courses do not have. Its
 * absence is why people finish a course and still freeze on an unseen problem:
 * they were taught twenty solutions and never taught how to arrive at one. The
 * method is explicit and repeatable — restate, brute force, read the constraints
 * for the target complexity, choose the structure, choose the algorithm, then
 * write — and it is used in every module afterwards, because a method you
 * practise once is not a method.
 *
 * **Module 1 — Linear then non-linear DSA** is the long middle, split the way
 * the roadmap splits it. Each module introduces the structures it needs, then
 * the patterns those structures make possible, and ends by pointing at the
 * problems on the sheet that drill them. The organising unit is the pattern
 * rather than the structure, because a pattern is what transfers: a hash map is
 * a fact, "turn the inner loop into a lookup" is a skill.
 *
 * **The grind** is where recognition is made automatic — drills that ask only
 * which pattern a statement belongs to and refuse to let you code, company-wise
 * and topic-wise sheets, and interview technique. **The electives** are off the
 * critical path: needed for contests and the harder end of a senior loop, not
 * for a standard one.
 *
 * Every problem on the sheet carries a brute-force solution as well as an
 * optimal one, in whichever language the reader has chosen, because the path
 * from one to the other is the part that generalises. Every complexity claim in
 * the track is measured rather than asserted, and every solution is run against
 * the same tests the in-browser console grades you with.
 */
export const dsaTrack: TrackDefinition = {
  id: "dsa",
  slug: "dsa",
  title: "Data Structures & Algorithms",
  shortTitle: "DSA",
  tagline: "Modules 0 and 1 — from your first for-loop to naming the pattern on sight",
  description:
    "Roadmap Modules 0 and 1, end to end. Built for two people: the one who has never written a for-loop, and the one who has read about every algorithm and still freezes on a blank editor. Module 0 starts at what a program is and does not assume a language — skip it in an afternoon if you already code. Then the framework: an explicit, repeatable method for taking an unseen problem apart, which is the step most courses skip and the reason their graduates still stare at problems. Then Module 1, linear structures then non-linear ones, every structure introduced with the patterns it enables and the problems those patterns solve. Then the grind — recognition drills, company-wise sheets, interview technique. Every problem comes with the brute force as well as the optimal solution, and every example can be read in any of the languages the track supports, so the algorithm is what you are learning rather than a dialect. You write your own in the browser and have it graded before you see either.",
  order: 1,
  status: "available",
  accent: "dsa",
  mode: "learn",
  lessonMinutes: [25, 45],
  interviewPrep: true,
  runnable: false,
  modules: [
    // ---------------------------------------------------------------------
    // Module 0 — Programming constructs
    //
    // The on-ramp, and the stage most DSA courses do not have. It assumes
    // nothing: not a language, not a loop, not an array. Somebody arriving here
    // able to code should skim it and go straight to the framework; somebody
    // arriving unable to should not be asked to learn recursion and Python at
    // the same time, which is what every "start with Two Sum" course asks.
    // ---------------------------------------------------------------------
    introductionToProgrammingModule,
    yourSolvingLanguageModule,
    inputOutputDataTypesModule,
    operatorsModule,
    conditionalsAndLoopsModule,
    patternPrintingModule,
    functionsModule,
    arraysAndStringsModule,
    numberSystemsModule,
    introductionToDataStructuresModule,
    complexityModule,

    // ---------------------------------------------------------------------
    // The framework — the bridge from Module 0 to Module 1
    // ---------------------------------------------------------------------
    dsaFrameworkModule,

    // ---------------------------------------------------------------------
    // Module 1 — Linear DSA, then non-linear DSA
    // ---------------------------------------------------------------------
    arraysStringsInPlaceModule,
    twoPointersModule,
    slidingWindowsModule,
    prefixSumsModule,
    sortingModule,
    binarySearchModule,
    hashingModule,
    linkedListsModule,
    stacksAndQueuesModule,
    recursionModule,
    treesModule,
    heapsModule,
    createComingSoonModule({
      id: "dsa-graphs",
      slug: "graphs",
      title: "Graphs: Modelling, BFS & DFS",
      order: 29,
      phase: "Module 1 · Non-linear DSA",
      description:
        "The most general structure here, and the one most real problems turn out to be. Two traversals cover a surprising share of everything.",
      topics: [
        "Modelling a problem as a graph — the actual hard part",
        "Adjacency list against adjacency matrix, and when each wins",
        "Directed, undirected, weighted, cyclic: the vocabulary",
        "Depth-first search, and what the recursion stack is telling you",
        "Breadth-first search, and why it gives shortest paths on unweighted graphs",
        "Marking visited on enqueue, and what goes wrong if you do not",
        "Connected components, and flood fill on a grid",
        "Cycle detection, in directed and undirected graphs",
      ],
    }),
    createComingSoonModule({
      id: "dsa-graph-algorithms",
      slug: "graph-algorithms",
      title: "Graph Algorithms: Shortest Paths, MST & Ordering",
      order: 30,
      phase: "Module 1 · Non-linear DSA",
      description:
        "The named algorithms, each introduced by the problem that forced its invention — and the conditions under which each one is wrong.",
      topics: [
        "Dijkstra, and why a negative edge breaks it",
        "Bellman-Ford, negative cycles, and detecting them",
        "Floyd-Warshall, and all-pairs shortest paths",
        "0-1 BFS and the deque trick",
        "Topological sort, by DFS and by Kahn's algorithm",
        "Minimum spanning trees: Prim and Kruskal",
        "Union-find with path compression and union by rank",
        "Strongly connected components, and Tarjan's algorithm",
      ],
    }),
    greedyModule,
    createComingSoonModule({
      id: "dsa-dp-foundations",
      slug: "dynamic-programming-foundations",
      title: "Dynamic Programming: Foundations",
      order: 27,
      phase: "Module 1 · Non-linear DSA",
      description:
        "The technique people find hardest, taught the only way that works: start from a recursion you already believe, then make it fast. Memoisation before tabulation, always.",
      topics: [
        "Overlapping subproblems and optimal substructure — the two preconditions",
        "From brute-force recursion to memoisation, mechanically",
        "Defining the state, and saying what dp[i] means in one English sentence",
        "Writing the recurrence, and the base cases that anchor it",
        "Top-down against bottom-up, and converting between them",
        "Space optimisation: dropping a dimension from the table",
        "Reconstructing the answer, not just its value",
        "Fibonacci, climbing stairs and house robber: one problem, three costumes",
      ],
    }),
    createComingSoonModule({
      id: "dsa-dp-patterns",
      slug: "dynamic-programming-patterns",
      title: "Dynamic Programming: The Patterns",
      order: 28,
      phase: "Module 1 · Non-linear DSA",
      description:
        "The catalogue. Nine recognisable shapes covering the overwhelming majority of DP problems — the module that converts \"I understood the solution\" into \"I found the solution\".",
      topics: [
        "0/1 knapsack, and the unbounded and bounded variants",
        "Subset sum, partition, and target-sum problems",
        "Longest common subsequence, edit distance, and the string-pair family",
        "Longest increasing subsequence, in O(n²) and in O(n log n)",
        "Grid and path-counting DP, with obstacles",
        "Interval DP: matrix chain multiplication, burst balloons",
        "DP on trees, and rerooting",
        "Bitmask DP, digit DP, and DP with state machines",
      ],
    }),
    // ---------------------------------------------------------------------
    // Electives — advanced DSA
    //
    // Off the critical path. None of this is needed to pass a standard
    // interview loop; all of it is needed for competitive programming and for
    // the harder end of a senior one, so it sits beside the grind rather than
    // inside it.
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "dsa-advanced-structures",
      slug: "advanced-data-structures",
      title: "Advanced Data Structures",
      order: 35,
      phase: "Electives · Advanced DSA",
      description:
        "The structures that answer a question no simpler structure can answer fast — range queries, prefix queries, and dynamic connectivity.",
      topics: [
        "Tries: prefix search, autocomplete, and the memory trade",
        "Disjoint set union in anger, and the problems it is secretly the answer to",
        "Fenwick trees for prefix sums with updates",
        "Segment trees: range query, point update",
        "Lazy propagation, and range updates",
        "Sparse tables, and O(1) range minimum",
        "Balanced BSTs and order-statistic trees",
        "Choosing between them: the decision the constraints make for you",
      ],
    }),
    bitsAndMathModule,
    createComingSoonModule({
      id: "dsa-advanced-algorithms",
      slug: "advanced-algorithms",
      title: "Advanced Algorithms & String Matching",
      order: 36,
      phase: "Electives · Advanced DSA",
      description:
        "The specialised toolkit: string matching, hashing tricks, and the geometry that shows up just often enough to be worth knowing.",
      topics: [
        "KMP, the failure function, and what it is really computing",
        "The Z-algorithm, and when it is simpler than KMP",
        "Rabin-Karp, rolling hashes, and the collisions you must plan for",
        "Manacher's algorithm for palindromes",
        "Suffix arrays and the problems they trivialise",
        "Matrix exponentiation for linear recurrences",
        "Computational geometry: orientation, convex hull, line intersection",
        "Randomised algorithms, and when approximate is the right answer",
      ],
    }),
    createComingSoonModule({
      id: "dsa-advanced-dp-and-graphs",
      slug: "advanced-dp-and-graph-problems",
      title: "Advanced DP & Graph Problems",
      order: 37,
      phase: "Electives · Advanced DSA",
      description:
        "Where the two hardest topics stop being separate. Problems that need a DP over a graph, a graph built out of a DP state, or a technique from each composed into one solution.",
      topics: [
        "DP on trees, rerooting, and the two-pass technique",
        "Bitmask DP over subsets, and travelling-salesman-shaped problems",
        "Digit DP, and counting the numbers with a property",
        "Shortest paths as dynamic programming, and longest path on a DAG",
        "Binary lifting, and lowest common ancestor in logarithmic time",
        "Euler tours, and flattening a tree into an array you can range-query",
        "Network flow: max-flow, min-cut, and bipartite matching",
        "Composing two techniques, which is what makes a hard problem hard",
      ],
    }),

    // ---------------------------------------------------------------------
    // Module 1 — The grind and the interview
    // ---------------------------------------------------------------------
    createComingSoonModule({
      id: "dsa-pattern-atlas",
      slug: "pattern-atlas-drills",
      title: "The Pattern Atlas: Recognition Drills",
      order: 31,
      phase: "Module 1 · The Grind",
      description:
        "Drills in which you are forbidden to write code. You read a statement and name the pattern, the structure and the target complexity — because that is the step you are actually missing, and practising it separately is the fastest way to fix it.",
      topics: [
        "Timed recognition: sixty seconds, statement to pattern",
        "Reading the constraints backwards to the intended complexity",
        "The phrases that give a pattern away, and the ones that mislead",
        "Distinguishing the near-identical: window against prefix-sum-plus-map",
        "Distinguishing greedy from DP on the same statement",
        "When two patterns both apply, and how to choose",
        "Building your own decision tree, and pruning it as it grows",
        "Spaced repetition over patterns rather than over problems",
      ],
    }),
    createComingSoonModule({
      id: "dsa-the-sheet",
      slug: "the-sheet",
      title: "The Sheet: Company-Wise & Topic-Wise Grind Plans",
      order: 32,
      phase: "Module 1 · The Grind",
      description:
        "How to grind so that it compounds. Ordered sheets by topic, by pattern and by company, with a schedule that revisits rather than accumulates.",
      topics: [
        "The ordered core sheet, and why order beats volume",
        "Topic-wise sheets: finishing a pattern before moving on",
        "Company-wise sheets, and how much signal they really carry",
        "The easy–medium–hard progression within a single pattern",
        "How long to stare before looking: the twenty-minute rule",
        "What to do after you look at the solution — the step everybody skips",
        "Re-solving from scratch, and the spacing that makes it stick",
        "Tracking: what to log about a solved problem so it stays solved",
      ],
    }),
    createComingSoonModule({
      id: "dsa-interview-technique",
      slug: "interview-technique",
      title: "Interview Technique: Thinking Out Loud",
      order: 33,
      phase: "Module 1 · The Grind",
      description:
        "Knowing the algorithm and passing the interview are different skills. How to attack an unseen problem in front of somebody, and how to talk while you do it.",
      topics: [
        "The first two minutes: clarifying questions worth asking",
        "Restating the problem, and confirming it before you solve it",
        "Brute force first, out loud — and why that scores better, not worse",
        "Narrating the optimisation: what changed and why it is safe",
        "Stating your complexity correctly, including the space",
        "Writing tests before they ask, and the edge cases to name",
        "Getting unstuck in public, and what a hint is really telling you",
        "Behavioural framing, and the questions to ask them at the end",
      ],
    }),
    createComingSoonModule({
      id: "dsa-gen-ai",
      slug: "algorithms-behind-gen-ai",
      title: "The Data Structures & Algorithms Behind Gen AI",
      order: 34,
      phase: "Module 1 · The Grind",
      description:
        "Everything in this track, applied to the systems everyone is now building on. A vector database is a graph search, tokenisation is a greedy merge over a frequency map, and sampling a token is a heap.",
      topics: [
        "Tokenisation: byte-pair encoding as a greedy merge over a frequency map",
        "Embeddings and vector space: cosine, dot product and Euclidean distance",
        "Exact k-nearest neighbours with a heap, and where it stops scaling",
        "Approximate nearest neighbours: LSH, inverted file indexes, and HNSW's navigable graph",
        "Vector quantisation, and the memory-against-recall trade every index makes",
        "The KV cache as a growing array, and why context length costs quadratically",
        "Decoding strategies: greedy, beam search and top-k sampling as priority queues",
        "Retrieval pipelines: inverted indexes, BM25, hybrid ranking and reranking",
      ],
    }),
  ],
};
