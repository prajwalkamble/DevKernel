import type { ModuleDefinition } from "@/content/types";
import { youMightNotNeedAnEffectLesson } from "./lesson-1-you-might-not-need-an-effect";
import { synchronisingLesson } from "./lesson-2-synchronising";
import { fetchingInAnEffectLesson } from "./lesson-3-fetching-in-an-effect";
import { racesAndCleanupLesson } from "./lesson-4-races-and-cleanup";
import { loadingAndErrorStatesLesson } from "./lesson-5-loading-and-error-states";
import { subscriptionsAndTimersLesson } from "./lesson-6-subscriptions-and-timers";
import { useLayoutEffectLesson } from "./lesson-7-uselayouteffect";
import { whyADataLibraryLesson } from "./lesson-8-why-a-data-library";

export const reactEffectsAndDataModule: ModuleDefinition = {
  id: "react-effects",
  slug: "effects-and-data",
  title: "Effects, Lifecycle & Data Fetching",
  description:
    "The module that fixes most React bugs: when you actually need an effect, when you do not, and how to fetch data without race conditions.",
  order: 7,
  status: "available",
  lessons: [
    youMightNotNeedAnEffectLesson,
    synchronisingLesson,
    fetchingInAnEffectLesson,
    racesAndCleanupLesson,
    loadingAndErrorStatesLesson,
    subscriptionsAndTimersLesson,
    useLayoutEffectLesson,
    whyADataLibraryLesson,
  ],
};
