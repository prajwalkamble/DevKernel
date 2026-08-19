import type { ModuleDefinition } from "@/content/types";
import { whatABeanIsLesson } from "./lesson-1-what-a-bean-is";
import { declaringBeansLesson } from "./lesson-2-declaring-beans";
import { injectionLesson } from "./lesson-3-injection";
import { ambiguityLesson } from "./lesson-4-ambiguity";
import { scopesLifecycleLesson } from "./lesson-5-scopes-lifecycle";
import { eventsLesson } from "./lesson-6-events";
import { configurationPropertiesLesson } from "./lesson-7-configuration-properties";
import { conditionalBeansLesson } from "./lesson-8-conditional-beans";

export const springContainerModule: ModuleDefinition = {
  id: "spring-container",
  slug: "beans-and-configuration",
  title: "The Container: Beans, Injection & Configuration",
  description:
    "The engine under every Spring application. What a bean actually is and how one gets created, the two ways to declare one, why constructor injection is the only style worth using, what to do when two beans could satisfy one dependency, how long each bean lives, and how one part of the application tells another that something happened without holding a reference to it. It closes on configuration as the container sees it: a group of properties bound onto a typed, validated bean, and beans that are only registered when a condition holds.",
  order: 2,
  status: "available",
  lessons: [
    whatABeanIsLesson,
    declaringBeansLesson,
    injectionLesson,
    ambiguityLesson,
    scopesLifecycleLesson,
    eventsLesson,
    configurationPropertiesLesson,
    conditionalBeansLesson,
  ],
};
