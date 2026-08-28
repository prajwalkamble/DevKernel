import type { ModuleDefinition } from "@/content/types";
import { compoundComponentsLesson } from "./lesson-1-compound-components";
import { containerPresentationalLesson } from "./lesson-2-container-presentational";
import { designingAnApiLesson } from "./lesson-3-designing-an-api";
import { accessibilityLesson } from "./lesson-4-accessibility";
import { portalsAndAnimationLesson } from "./lesson-5-portals-and-animation";
import { readingAndReviewingLesson } from "./lesson-6-reading-and-reviewing";
import { walkthroughLesson } from "./lesson-7-walkthrough";

export const reactPatternsAndMasteryModule: ModuleDefinition = {
  id: "react-mastery",
  slug: "patterns-and-mastery",
  title: "Patterns, Ecosystem & Judgement",
  description:
    "The consolidation pass: the composition patterns that show up in every large codebase, how to design a component API other people enjoy using, accessibility as a set of decisions rather than a checklist, how to get oriented in code you have never seen, and one component designed end to end.",
  order: 14,
  status: "available",
  lessons: [
    compoundComponentsLesson,
    containerPresentationalLesson,
    designingAnApiLesson,
    accessibilityLesson,
    portalsAndAnimationLesson,
    readingAndReviewingLesson,
    walkthroughLesson,
  ],
};
