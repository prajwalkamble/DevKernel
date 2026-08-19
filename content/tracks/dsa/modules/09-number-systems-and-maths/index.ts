import type { ModuleDefinition } from "@/content/types";

import { numberBasesLesson } from "./lesson-1-number-bases";
import { twosComplementLesson } from "./lesson-2-twos-complement";
import { digitManipulationLesson } from "./lesson-3-digit-manipulation";
import { divisorsAndPrimesLesson } from "./lesson-4-divisors-and-primes";
import { gcdAndLcmLesson } from "./lesson-5-gcd-and-lcm";
import { powersAndFactorialsLesson } from "./lesson-6-powers-and-factorials";
import { modularArithmeticLesson } from "./lesson-7-modular-arithmetic";
import { floatingPointLesson } from "./lesson-8-floating-point";

export const numberSystemsModule: ModuleDefinition = {
  id: "dsa-number-systems",
  slug: "number-systems-and-maths",
  title: "Number Systems & Mathematical Foundations",
  description:
    "How numbers are written, how they are stored, and the handful of number-theory facts that show up constantly in problems — including the two representations that lie to you, fixed-width integers and floating point.",
  order: 9,
  status: "available",
  phase: "Module 0 · Programming Constructs",
  lessons: [
    numberBasesLesson,
    twosComplementLesson,
    digitManipulationLesson,
    divisorsAndPrimesLesson,
    gcdAndLcmLesson,
    powersAndFactorialsLesson,
    modularArithmeticLesson,
    floatingPointLesson,
  ],
};
