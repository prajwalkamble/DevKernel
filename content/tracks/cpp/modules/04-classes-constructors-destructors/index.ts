import type { ModuleDefinition } from "@/content/types";
import { structsLesson } from "./lesson-1-structs";
import { classesInvariantsLesson } from "./lesson-2-classes-invariants";
import { constructorsLesson } from "./lesson-3-constructors";
import { memberInitLesson } from "./lesson-4-member-init";
import { destructorsLesson } from "./lesson-5-destructors";
import { thisStaticLesson } from "./lesson-6-this-static";
import { operatorOverloadingLesson } from "./lesson-7-operator-overloading";

export const cppClassesModule: ModuleDefinition = {
  id: "cpp-classes",
  slug: "classes-constructors-destructors",
  title: "Structs, Classes, Constructors & Destructors",
  description:
    "Defining your own types. Start with structs as plain groups of data, then meet the idea that makes a class worth writing — an invariant the type guarantees. Constructors establish it, member initialiser lists build it efficiently, and destructors tie a resource's lifetime to an object's, which is RAII done in your own code. Finishes with `this`, static members, `friend`, and giving your types the syntax of built-in ones.",
  order: 4,
  status: "available",
  lessons: [
    structsLesson,
    classesInvariantsLesson,
    constructorsLesson,
    memberInitLesson,
    destructorsLesson,
    thisStaticLesson,
    operatorOverloadingLesson,
  ],
};
