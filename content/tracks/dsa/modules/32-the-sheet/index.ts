import type { ModuleDefinition } from "@/content/types";

import { orderBeatsVolumeLesson } from "./lesson-1-order-beats-volume";
import { finishAPatternLesson } from "./lesson-2-finish-a-pattern";
import { companySheetsLesson } from "./lesson-3-company-sheets";
import { easyMediumHardLesson } from "./lesson-4-easy-medium-hard";
import { twentyMinuteRuleLesson } from "./lesson-5-twenty-minute-rule";
import { afterYouLookLesson } from "./lesson-6-after-you-look";
import { reSolvingLesson } from "./lesson-7-re-solving";
import { trackingLesson } from "./lesson-8-tracking";

export const theSheetModule: ModuleDefinition = {
  id: "dsa-the-sheet",
  slug: "the-sheet",
  title: "The Sheet: Company-Wise & Topic-Wise Grind Plans",
  description:
    "How to grind so that it compounds. A pattern sheet is a dependency graph wearing a list costume, and the measurement here says what ignoring that costs. Eight lessons: why order beats volume, what finishing a pattern means precisely enough to check, how much signal a company list really carries, the progression inside a single pattern, how long to stare before looking, the step everybody skips after reading a solution, which problems earn a revisit, and the six fields worth logging.",
  order: 32,
  status: "available",
  phase: "Module 1 · The Grind",
  lessons: [
    orderBeatsVolumeLesson,
    finishAPatternLesson,
    companySheetsLesson,
    easyMediumHardLesson,
    twentyMinuteRuleLesson,
    afterYouLookLesson,
    reSolvingLesson,
    trackingLesson,
  ],
};
