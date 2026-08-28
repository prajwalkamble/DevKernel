import type { ModuleDefinition } from "@/content/types";
import { clientRenderingLesson } from "./lesson-1-client-rendering";
import { serverRenderingLesson } from "./lesson-2-server-rendering";
import { hydrationLesson } from "./lesson-3-hydration";
import { hydrationMismatchesLesson } from "./lesson-4-hydration-mismatches";
import { staticGenerationLesson } from "./lesson-5-static-generation";
import { serverComponentsLesson } from "./lesson-6-server-components";
import { useClientBoundaryLesson } from "./lesson-7-the-use-client-boundary";
import { choosingARenderingStrategyLesson } from "./lesson-8-choosing";

export const reactRenderingModelsModule: ModuleDefinition = {
  id: "react-rendering-models",
  slug: "client-and-server-rendering",
  title: "Client, Server & Hydration",
  description:
    "The whole rendering picture in one place: what CSR, SSR, SSG and Server Components each mean, what hydration is, and which problem each one solves.",
  order: 12,
  status: "available",
  lessons: [
    clientRenderingLesson,
    serverRenderingLesson,
    hydrationLesson,
    hydrationMismatchesLesson,
    staticGenerationLesson,
    serverComponentsLesson,
    useClientBoundaryLesson,
    choosingARenderingStrategyLesson,
  ],
};
