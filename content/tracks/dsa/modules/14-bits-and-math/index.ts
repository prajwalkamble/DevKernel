import type { ModuleDefinition } from "@/content/types";

import { bitsAsASetLesson } from "./lesson-1-bits-as-a-set";
import { xorLesson } from "./lesson-2-xor";
import { subsetEnumerationLesson } from "./lesson-3-subset-enumeration";
import { gcdAndLcmLesson } from "./lesson-4-gcd-and-lcm";
import { primesLesson } from "./lesson-5-primes";
import { modularArithmeticLesson } from "./lesson-6-modular-arithmetic";
import { combinatoricsLesson } from "./lesson-7-combinatorics";
import { overflowLesson } from "./lesson-8-overflow";

export const bitsAndMathModule: ModuleDefinition = {
  id: "dsa-bits-and-math",
  slug: "bit-manipulation-and-math",
  title: "Bit Manipulation, Math & Number Theory",
  description:
    "The two areas that feel like trivia until the problem in front of you is one of them — and then nothing else will do. Bits reframed as a set, so that `n ≤ 20` stops being a constraint and starts being an instruction; XOR's three identities and the family of problems they collapse into one loop; subset enumeration and the 3^n bound that makes it feasible. Then the number theory an interview actually reaches for: Euclid, sieves and factorisation, modular arithmetic with fast exponentiation and inverses, nCr under a prime modulus — and finally overflow, which is where a correct Python solution goes wrong on the way to Java.",
  order: 14,
  status: "available",
  phase: "Module 1 · Linear DSA",
  lessons: [
    bitsAsASetLesson,
    xorLesson,
    subsetEnumerationLesson,
    gcdAndLcmLesson,
    primesLesson,
    modularArithmeticLesson,
    combinatoricsLesson,
    overflowLesson,
  ],
};
