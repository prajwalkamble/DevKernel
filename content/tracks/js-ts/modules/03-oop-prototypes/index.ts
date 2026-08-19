import type { ModuleDefinition } from "@/content/types";
import { prototypeChainLesson } from "./lesson-1-prototype-chain";
import { esClassesLesson } from "./lesson-2-es-classes";
import { gettersSettersLesson } from "./lesson-3-getters-setters";
import { tsAccessModifiersLesson } from "./lesson-4-ts-access-modifiers";
import { interfacesAbstractClassesLesson } from "./lesson-5-interfaces-abstract-classes";
import { mixinsCompositionLesson } from "./lesson-6-mixins-composition";

export const oopPrototypesModule: ModuleDefinition = {
  id: "oop-prototypes",
  slug: "oop-prototypes",
  title: "Objects, Prototypes & OOP",
  description:
    "How JavaScript's prototype chain actually works, ES class syntax as sugar over prototypes, inheritance, and TypeScript's access modifiers, interfaces, and abstract classes.",
  order: 3,
  status: "available",
  lessons: [
    prototypeChainLesson,
    esClassesLesson,
    gettersSettersLesson,
    tsAccessModifiersLesson,
    interfacesAbstractClassesLesson,
    mixinsCompositionLesson,
  ],
};
