import type { ModuleDefinition } from "@/content/types";
import { publicInheritanceLesson } from "./lesson-1-public-inheritance";
import { virtualFunctionsLesson } from "./lesson-2-virtual-functions";
import { vtableVptrLesson } from "./lesson-3-vtable-vptr";
import { abstractClassesLesson } from "./lesson-4-abstract-classes";
import { virtualDestructorsSlicingLesson } from "./lesson-5-virtual-destructors-slicing";
import { overrideFinalLesson } from "./lesson-6-override-final";
import { multipleInheritanceLesson } from "./lesson-7-multiple-inheritance";

export const cppInheritanceModule: ModuleDefinition = {
  id: "cpp-inheritance",
  slug: "inheritance-polymorphism",
  title: "Inheritance & Polymorphism",
  description:
    "One keyword decides whether a call consults the declaration or the object, and the module takes that apart down to the two instructions it compiles to — vtable dumped, vptr read out of a live object, and the call watched devirtualizing when a class is marked final. Then the ways it silently breaks: a destructor missing `virtual` that leaks 32KB, a signature off by one `const` that never overrode anything, a missing `&` that copies half an object. Ends on multiple inheritance and the diamond, and the argument that composition should have been the first choice anyway.",
  order: 6,
  status: "available",
  lessons: [
    publicInheritanceLesson,
    virtualFunctionsLesson,
    vtableVptrLesson,
    abstractClassesLesson,
    virtualDestructorsSlicingLesson,
    overrideFinalLesson,
    multipleInheritanceLesson,
  ],
};
