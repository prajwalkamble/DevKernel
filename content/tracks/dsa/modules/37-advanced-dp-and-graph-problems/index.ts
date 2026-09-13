import type { ModuleDefinition } from "@/content/types";

import { reroutingLesson } from "./lesson-1-rerooting";
import { dpOverSubsetsLesson } from "./lesson-2-dp-over-subsets";
import { digitDpLesson } from "./lesson-3-digit-dp";
import { shortestPathsAsDpLesson } from "./lesson-4-shortest-paths-as-dp";
import { binaryLiftingLesson } from "./lesson-5-binary-lifting";
import { eulerToursLesson } from "./lesson-6-euler-tours";
import { networkFlowLesson } from "./lesson-7-network-flow";
import { composingTechniquesLesson } from "./lesson-8-composing-techniques";

export const advancedDpAndGraphProblemsModule: ModuleDefinition = {
  id: "dsa-advanced-dp-and-graphs",
  slug: "advanced-dp-and-graph-problems",
  title: "Advanced DP & Graph Problems",
  description:
    "Where the two hardest topics stop being separate. Eight lessons: rerooting when the combine has no inverse, DP over subsets, digit DP, shortest paths as DP with a hop limit, binary lifting, Euler tours, network flow, and composing two techniques into one solution.",
  order: 37,
  status: "available",
  phase: "Electives · Advanced DSA",
  lessons: [
    reroutingLesson,
    dpOverSubsetsLesson,
    digitDpLesson,
    shortestPathsAsDpLesson,
    binaryLiftingLesson,
    eulerToursLesson,
    networkFlowLesson,
    composingTechniquesLesson,
  ],
};
