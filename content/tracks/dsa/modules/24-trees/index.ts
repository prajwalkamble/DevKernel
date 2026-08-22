import type { ModuleDefinition } from "@/content/types";

import { shapeAndTerminologyLesson } from "./lesson-1-shape-and-terminology";
import { traversalsLesson } from "./lesson-2-traversals";
import { levelOrderLesson } from "./lesson-3-level-order";
import { bstInvariantLesson } from "./lesson-4-the-bst-invariant";
import { validatingBstLesson } from "./lesson-5-validating-a-bst";
import { balancingLesson } from "./lesson-6-balancing";
import { lcaAndPathsLesson } from "./lesson-7-lca-and-paths";
import { serialiseAndSheetLesson } from "./lesson-8-serialise-and-the-sheet";

export const treesModule: ModuleDefinition = {
  id: "dsa-trees",
  slug: "trees",
  title: "Trees & Binary Search Trees",
  description:
    "Where recursion stops being a party trick. Traversals, the ordering invariant that makes a BST searchable, and the balancing that stops it degenerating into a linked list. The three depth-first orders are taught as one function with the visit line moved, because that is what tells you which one a problem needs — context carried down is pre-order, summaries returned up is post-order, and that single question settles most tree problems. A full lesson goes to validating a BST, since the obvious local check returns a wrong answer rather than a slow one. Ends on serialisation, which forces precision about what a traversal actually records and why in-order alone can never rebuild a tree.",
  order: 24,
  status: "available",
  phase: "Module 1 · Non-linear DSA",
  lessons: [
    shapeAndTerminologyLesson,
    traversalsLesson,
    levelOrderLesson,
    bstInvariantLesson,
    validatingBstLesson,
    balancingLesson,
    lcaAndPathsLesson,
    serialiseAndSheetLesson,
  ],
};
