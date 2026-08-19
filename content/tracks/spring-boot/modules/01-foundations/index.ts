import type { ModuleDefinition } from "@/content/types";
import { whatIsSpringBootLesson } from "./lesson-1-what-is-spring-boot";
import { firstApplicationLesson } from "./lesson-2-first-application";
import { projectAnatomyLesson } from "./lesson-3-project-anatomy";
import { javaToEndpointLesson } from "./lesson-4-java-to-endpoint";
import { autoConfigurationLesson } from "./lesson-5-auto-configuration";
import { configurationLesson } from "./lesson-6-configuration";
import { failedStartupLesson } from "./lesson-7-failed-startup";

export const springFoundationsModule: ModuleDefinition = {
  id: "spring-foundations",
  slug: "foundations",
  title: "Foundations",
  description:
    "Everything you need before the framework can teach you anything else: what Spring Boot is and what it replaces, a running application, the anatomy of the project it generated, the three-step move from a plain Java class to an HTTP endpoint, where the beans you never wrote come from, how configuration reaches your code, and how to read a startup that fails.",
  order: 1,
  status: "available",
  lessons: [
    whatIsSpringBootLesson,
    firstApplicationLesson,
    projectAnatomyLesson,
    javaToEndpointLesson,
    autoConfigurationLesson,
    configurationLesson,
    failedStartupLesson,
  ],
};
