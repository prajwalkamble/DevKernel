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
import { dpFoundationsModule } from "./modules/27-dynamic-programming-foundations";
import { dpPatternsModule } from "./modules/28-dynamic-programming-patterns";
import { graphsModule } from "./modules/29-graphs";
import { graphAlgorithmsModule } from "./modules/30-graph-algorithms";
import { patternAtlasModule } from "./modules/31-pattern-atlas";
import { theSheetModule } from "./modules/32-the-sheet";
import { interviewTechniqueModule } from "./modules/33-interview-technique";
import { algorithmsBehindGenAiModule } from "./modules/34-algorithms-behind-gen-ai";
import { advancedDataStructuresModule } from "./modules/35-advanced-data-structures";
import { advancedAlgorithmsModule } from "./modules/36-advanced-algorithms";

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
    graphsModule,
    graphAlgorithmsModule,
    patternAtlasModule,
    theSheetModule,
    interviewTechniqueModule,
    algorithmsBehindGenAiModule,
    greedyModule,
    dpFoundationsModule,
    dpPatternsModule,
    // ---------------------------------------------------------------------
    // Electives — advanced DSA
    //
    // Off the critical path. None of this is needed to pass a standard
    // interview loop; all of it is needed for competitive programming and for
    // the harder end of a senior one, so it sits beside the grind rather than
    // inside it.
    // ---------------------------------------------------------------------
    advancedDataStructuresModule,
    bitsAndMathModule,
    advancedAlgorithmsModule,
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
  ],
};
