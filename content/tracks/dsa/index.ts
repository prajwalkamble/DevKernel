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
 * optimal one, in Java and in Python, because the path from one to the other is
 * the part that generalises. Every complexity claim in the track is measured
 * rather than asserted, and every solution is run against the same tests the
 * in-browser console grades you with.
 */
export const dsaTrack: TrackDefinition = {
  id: "dsa",
  slug: "dsa",
  title: "Data Structures & Algorithms",
  shortTitle: "DSA",
  tagline: "Modules 0 and 1 — from your first for-loop to naming the pattern on sight",
  description:
    "Roadmap Modules 0 and 1, end to end. Built for two people: the one who has never written a for-loop, and the one who has read about every algorithm and still freezes on a blank editor. Module 0 starts at what a program is and does not assume a language — skip it in an afternoon if you already code. Then the framework: an explicit, repeatable method for taking an unseen problem apart, which is the step most courses skip and the reason their graduates still stare at problems. Then Module 1, linear structures then non-linear ones, every structure introduced with the patterns it enables and the problems those patterns solve. Then the grind — recognition drills, company-wise sheets, interview technique. Every problem comes with the brute force as well as the optimal solution, in Java and Python, and you write your own in the browser and have it graded before you see either.",
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
    createComingSoonModule({
      id: "dsa-two-pointers",
      slug: "two-pointers",
      title: "Two Pointers",
      order: 16,
      phase: "Module 1 · Linear DSA",
      description:
        "The first pattern that turns an O(n²) loop into an O(n) one, and the exchange argument that proves it is allowed to.",
      topics: [
        "Opposite ends: the invariant, and why moving a pointer discards nothing you need",
        "Proving a pointer move is safe — the argument interviewers actually ask for",
        "Same direction: fast and slow, and lag by a fixed distance",
        "Sorting first, and what it costs you when indices matter",
        "Handling duplicates without a set",
        "Three pointers, and where k-Sum stops being worth it",
        "Palindromes, container problems, and trapping rain water",
        "The sheet: Two Sum II, 3Sum, Container With Most Water and friends",
      ],
    }),
    createComingSoonModule({
      id: "dsa-sliding-window",
      slug: "sliding-windows",
      title: "Sliding Windows",
      order: 17,
      phase: "Module 1 · Linear DSA",
      description:
        "\"Longest or shortest contiguous stretch such that…\" — one shape, a dozen problems, and one condition that decides whether it applies at all.",
      topics: [
        "Fixed-size windows: one in, one out",
        "Variable-size windows: grow right, shrink left",
        "The monotonicity condition, and how to check it before you commit",
        "Window state: counts, sums, distinct-element tallies",
        "Why negative numbers break the sum-based window, and what replaces it",
        "At most k distinct, and the exactly-k trick built from it",
        "Minimum window substring, and windows that shrink for a different reason",
        "The sheet: the window problems, easiest first",
      ],
    }),
    createComingSoonModule({
      id: "dsa-prefix-sums",
      slug: "prefix-sums-and-range-queries",
      title: "Prefix Sums & Range Queries",
      order: 18,
      phase: "Module 1 · Linear DSA",
      description:
        "Precompute once, answer forever — and the hash-map pairing that finds subarrays a window cannot.",
      topics: [
        "The prefix array, the leading zero, and why it removes an edge case",
        "Range sums in O(1), and range products with their zero problem",
        "Prefix sums with a hash map: subarrays summing to k, with negatives",
        "Difference arrays, and range updates in O(1)",
        "Two-dimensional prefix sums and submatrix queries",
        "Prefix XOR, prefix max, and other invertible aggregates",
        "When the array changes: why prefix sums stop working",
        "The sheet: the prefix problems, including the ones that look like windows",
      ],
    }),
    createComingSoonModule({
      id: "dsa-sorting",
      slug: "sorting",
      title: "Sorting",
      order: 21,
      phase: "Module 1 · Linear DSA",
      description:
        "A tool rather than a topic. You will rarely implement one and constantly rely on one — so this is mostly about what your language's sort really is and when order is the whole solution.",
      topics: [
        "Insertion, merge, quick and heap sort, and what each is good at",
        "The O(n log n) lower bound, and the counting sorts that beat it",
        "Stability, and the moments it silently matters",
        "What Arrays.sort and list.sort actually are, including the quadratic worst case",
        "Custom comparators, sorting by several keys, and comparator contracts",
        "Bucket sort and counting sort, when the key range is small",
        "Sorting as preprocessing: intervals, duplicates, and greedy setups",
        "The sheet: the problems where sorting is the entire idea",
      ],
    }),
    createComingSoonModule({
      id: "dsa-binary-search",
      slug: "binary-search",
      title: "Binary Search & Binary Search on the Answer",
      order: 15,
      phase: "Module 1 · Linear DSA",
      description:
        "The most-failed easy question there is, and then the technique that quietly solves a whole family of hard ones.",
      topics: [
        "Writing it correctly: the two conventions, and never mixing them",
        "The off-by-one, the overflow, and the infinite loop",
        "Lower bound and upper bound, and finding the first or last occurrence",
        "Searching a rotated array, a 2D matrix, and an unbounded stream",
        "Binary search on the answer: recognising \"the minimum X such that…\"",
        "Writing the feasibility check, and proving it is monotone",
        "Choosing the bounds so the answer is definitely inside them",
        "The sheet: Koko, shipping capacity, split array, and the rest of the family",
      ],
    }),
    createComingSoonModule({
      id: "dsa-hashing",
      slug: "hashing",
      title: "Hashing: Maps, Sets & Frequency",
      order: 20,
      phase: "Module 1 · Linear DSA",
      description:
        "The structure that collapses a nested loop into a single pass more often than any other, and the reason its O(1) carries an asterisk.",
      topics: [
        "Hash functions, buckets, collision resolution, and load factor",
        "Why O(1) is average and not worst case — and how judges exploit that",
        "The complement pattern: check before you insert, and why the order matters",
        "Frequency counting, and the problems it collapses to nothing",
        "Grouping by a derived key: canonical forms and anagram classes",
        "Hashing your own types: the equals/hashCode contract",
        "Prefix-sum plus hash map, the combination that beats the window",
        "When a sorted structure beats a hash map outright",
      ],
    }),
    createComingSoonModule({
      id: "dsa-linked-lists",
      slug: "linked-lists",
      title: "Linked Lists",
      order: 22,
      phase: "Module 1 · Linear DSA",
      description:
        "Rarely the right structure in production, permanently popular in interviews — because pointer manipulation is where sloppy reasoning shows up immediately.",
      topics: [
        "Singly, doubly and circular lists, and the cost of each operation",
        "Why a linked list loses to an array in practice, despite O(1) insertion",
        "The dummy head, and why it removes half your edge cases",
        "Reversal, iteratively and recursively",
        "Fast and slow pointers: cycle detection, the middle, the nth from the end",
        "Finding the start of a cycle, and why Floyd's argument works",
        "Merging, partitioning and sorting a list",
        "Building an LRU cache from a list and a map",
      ],
    }),
    createComingSoonModule({
      id: "dsa-stacks-queues",
      slug: "stacks-and-queues",
      title: "Stacks, Queues & Monotonic Structures",
      order: 23,
      phase: "Module 1 · Linear DSA",
      description:
        "Two structures with one rule each — and the monotonic variants that answer \"the next element greater than this one\" for every index in linear time.",
      topics: [
        "Stacks: LIFO, and the problems that are secretly about nesting",
        "Queues, deques and circular buffers",
        "Expression parsing, bracket matching, and infix to postfix",
        "The monotonic stack, and next-greater-element in O(n)",
        "The amortised argument: why a nested while loop is still linear",
        "Largest rectangle in a histogram, and the family around it",
        "The monotonic deque, and sliding-window maximum",
        "Min-stack, and augmenting a structure to answer a new question",
      ],
    }),
    createComingSoonModule({
      id: "dsa-recursion",
      slug: "recursion-and-backtracking",
      title: "Recursion & Backtracking",
      order: 19,
      phase: "Module 1 · Linear DSA",
      description:
        "The mental model everything after this depends on. How to trust a recursive call, how to see the recursion tree, and how to prune it before it explodes.",
      topics: [
        "The base case, the recursive case, and the leap of faith",
        "Drawing the recursion tree, and reading its cost off the drawing",
        "The call stack, stack overflow, and converting to iteration",
        "Divide and conquer as a shape rather than a trick",
        "Backtracking: choose, explore, un-choose",
        "Subsets, permutations and combinations, with duplicates handled",
        "Constraint problems: N-queens, sudoku, word search",
        "Pruning, and the difference it makes to a factorial search",
      ],
    }),
    createComingSoonModule({
      id: "dsa-trees",
      slug: "trees",
      title: "Trees & Binary Search Trees",
      order: 24,
      phase: "Module 1 · Non-linear DSA",
      description:
        "Where recursion stops being a party trick. Traversals, the ordering invariant that makes a BST searchable, and the balancing that stops it degenerating into a linked list.",
      topics: [
        "Terminology, height, depth, and the shapes that matter",
        "Traversals: preorder, inorder, postorder — recursive and iterative",
        "Level-order traversal, and the level-width snapshot",
        "The BST invariant, and search, insert and delete",
        "Why validating a BST is not a local comparison",
        "Balanced trees: AVL and red-black, and what your language's TreeMap is",
        "Lowest common ancestor, diameter, and path problems",
        "Serialising and reconstructing a tree",
      ],
    }),
    createComingSoonModule({
      id: "dsa-heaps",
      slug: "heaps-and-priority-queues",
      title: "Heaps & Priority Queues",
      order: 25,
      phase: "Module 1 · Non-linear DSA",
      description:
        "The structure for \"the smallest thing so far\", and the top-K pattern that turns a sort into a linear scan.",
      topics: [
        "The heap property, and why an array is the right representation",
        "Sift up, sift down, and building a heap in O(n)",
        "Priority queues: the API, and the comparator that decides everything",
        "Top-K, and why the heap must be a min-heap for the k largest",
        "The two-heap pattern: the running median",
        "K-way merge, and merging sorted streams",
        "When bucket sort beats the heap outright",
        "Scheduling and interval problems built on a heap",
      ],
    }),
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
    createComingSoonModule({
      id: "dsa-greedy",
      slug: "greedy-algorithms",
      title: "Greedy Algorithms",
      order: 26,
      phase: "Module 1 · Non-linear DSA",
      description:
        "A strategy that is either optimal or badly wrong with nothing in between — so this module is mostly about proving which one you have.",
      topics: [
        "The greedy choice property and optimal substructure",
        "Proving a greedy algorithm correct by exchange argument",
        "Finding the counterexample that disproves one",
        "Interval scheduling, and the sort key that solves it",
        "Merging intervals, and the family around it",
        "Huffman coding, built from a heap",
        "Coin change: when greedy works and when it fails",
        "Greedy against dynamic programming — the same problems, decided",
      ],
    }),
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
