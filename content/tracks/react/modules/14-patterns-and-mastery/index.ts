import type { ModuleDefinition } from "@/content/types";
import { compoundComponentsLesson } from "./lesson-1-compound-components";
import { containerPresentationalLesson } from "./lesson-2-container-presentational";
import { designingAnApiLesson } from "./lesson-3-designing-an-api";
import { accessibilityLesson } from "./lesson-4-accessibility";
import { portalsAndAnimationLesson } from "./lesson-5-portals-and-animation";
import { readingAndReviewingLesson } from "./lesson-6-reading-and-reviewing";
import { walkthroughLesson } from "./lesson-7-walkthrough";
import { capstoneRequirementsLesson } from "./lesson-8-capstone-requirements";
import { capstoneBackendLesson } from "./lesson-9-capstone-backend";
import { capstoneFrontendLesson } from "./lesson-10-capstone-frontend";

export const reactPatternsAndMasteryModule: ModuleDefinition = {
  id: "react-mastery",
  slug: "patterns-and-mastery",
  title: "Patterns, Ecosystem & the Capstone Project",
  description:
    "The consolidation pass: the patterns that show up in every large codebase, the ecosystem decisions worth having an opinion about, and then a complete project — a small issue tracker in React, TypeScript, a real HTTP API and a real database — specified, structured and written out in full.",
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
    capstoneRequirementsLesson,
    capstoneBackendLesson,
    capstoneFrontendLesson,
  ],
};
