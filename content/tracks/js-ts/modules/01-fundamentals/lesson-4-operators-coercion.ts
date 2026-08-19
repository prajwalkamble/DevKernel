import type { Lesson } from "@/content/types";

export const operatorsCoercionLesson: Lesson = {
  id: "fundamentals-operators-coercion",
  slug: "operators-and-coercion",
  moduleSlug: "fundamentals",
  title: "Operators, Equality & Type Coercion",
  summary:
    "Arithmetic, comparison and logical operators, the crucial == vs === distinction, truthy/falsy values, and how TypeScript's strictNullChecks prevents whole categories of coercion bugs.",
  estimatedMinutes: 30,
  objectives: [
    "Use arithmetic, comparison, and logical operators correctly",
    "Explain the difference between == and ===",
    "List JavaScript's falsy values from memory",
    "Understand what strictNullChecks changes in TypeScript",
  ],
  sections: [
    {
      id: "operators-overview",
      heading: "Core operators",
      body: [
        "Arithmetic: `+ - * / % **` (exponent). Comparison: `< > <= >= == != === !==`. Logical: `&& || !`, plus the newer `??` (nullish coalescing) and `?.` (optional chaining). Assignment: `= += -= *= /= ??=` and friends.",
        "The `+` operator is special: if **either** operand is a string, `+` performs string concatenation instead of addition. Every other arithmetic operator (`- * / %`) coerces both operands to numbers first, even if that means turning a string into `NaN`.",
      ],
      examples: [
        {
          id: "plus-operator-quirk",
          title: "+ concatenates, other operators coerce to number",
          js: `console.log(1 + 2);       // 3
console.log("1" + 2);     // "12"  — string concatenation
console.log(1 + "2" + 3); // "123" — left to right: 1+"2"="12", "12"+3="123"
console.log(1 + 2 + "3"); // "33"  — left to right: 1+2=3, 3+"3"="33"

console.log("5" - 2);     // 3    — minus coerces "5" to a number
console.log("5" * "2");   // 10   — both coerced to numbers
console.log("abc" - 1);   // NaN  — "abc" can't become a number`,
        },
      ],
    },
    {
      id: "loose-vs-strict",
      heading: "== vs ===: the most important rule in JavaScript",
      body: [
        "`==` (loose equality) compares after attempting to **coerce** both operands to the same type. `===` (strict equality) compares value **and** type with **no coercion** — different types are simply never equal.",
        "The coercion rules behind `==` are famously confusing (there's a widely-shared diagram of all the edge cases). The universal, non-negotiable rule in modern JavaScript and TypeScript: **always use `===` and `!==`**. The one narrow exception some style guides allow is `== null`, which conveniently matches both `null` and `undefined` in one check.",
      ],
      examples: [
        {
          id: "loose-equality-surprises",
          title: "== produces genuinely surprising results",
          js: `console.log(0 == "0");      // true  — "0" coerced to 0
console.log(0 == "");       // true  — "" coerced to 0
console.log(0 == false);    // true  — false coerced to 0
console.log("" == false);   // true  — both coerced to 0
console.log(null == undefined); // true — special-cased, equal only to each other
console.log(null == 0);     // false — null does NOT coerce to 0 with ==

console.log(0 === "0");     // false — different types, no coercion
console.log(0 === false);   // false — different types, no coercion`,
          explanation:
            "Notice `0 == \"0\"`, `0 == \"\"`, and `0 == false` are all true, but `\"\" == false` is also true purely by transitivity of coercion — yet `null == 0` is false because `null` is special-cased to only loosely-equal `undefined`. This inconsistency is exactly why `===` is the rule, not a style preference.",
        },
      ],
      pitfalls: [
        {
          title: "NaN is never equal to anything, including itself",
          body: "`NaN === NaN` is `false`. To check whether a value is `NaN`, use `Number.isNaN(value)` — never `value === NaN`, which always evaluates to false regardless of value.",
        },
      ],
    },
    {
      id: "truthy-falsy",
      heading: "Truthy and falsy values",
      body: [
        "In a boolean context (an `if` condition, `&&`, `||`, `!`), JavaScript coerces any value to `true` or `false`. There are exactly **eight falsy values** — everything else is truthy.",
        "The eight falsy values: `false`, `0`, `-0`, `0n` (BigInt zero), `\"\"` (empty string), `null`, `undefined`, and `NaN`. Notably: `\"0\"` (a string containing zero) is **truthy** — it's a non-empty string. Empty arrays `[]` and empty objects `{}` are also truthy — a frequent source of bugs for developers coming from other languages.",
      ],
      examples: [
        {
          id: "falsy-values-demo",
          title: "The eight falsy values, and two common surprises",
          js: `const falsyValues = [false, 0, -0, 0n, "", null, undefined, NaN];
falsyValues.forEach(v => console.log(Boolean(v))); // all print false

console.log(Boolean("0"));  // true  — non-empty string!
console.log(Boolean([]));   // true  — empty array is an object, objects are always truthy
console.log(Boolean({}));   // true  — same reasoning

if ([]) {
  console.log("this runs, even though [] 'feels' empty");
}`,
        },
      ],
      pitfalls: [
        {
          title: "Guarding against 0 with ||",
          body: "`const count = input.value || 10;` looks like a safe default, but if `input.value` is legitimately `0`, this silently replaces it with `10` — because `0` is falsy. Use the nullish coalescing operator `??` instead: `input.value ?? 10` only falls back when the value is `null` or `undefined`, leaving `0` and `\"\"` untouched.",
        },
      ],
    },
    {
      id: "ts-strict-null",
      heading: "TypeScript: strictNullChecks closes the gap",
      body: [
        "The `??` and `?.` operators exist in plain JavaScript too (ES2020) and work identically in TypeScript. What TypeScript adds is `strictNullChecks` (bundled into `strict: true`): without it, `null` and `undefined` are silently assignable to *every* type, which is exactly how JavaScript's most common runtime crash — 'Cannot read property of undefined' — sneaks past review. With it on, you must explicitly account for `null`/`undefined` wherever they're possible.",
      ],
      examples: [
        {
          id: "strict-null-checks",
          title: "strictNullChecks forces you to handle the empty case",
          ts: `function getLength(text: string | null) {
  return text.length;
  // Error (strictNullChecks on): 'text' is possibly 'null'.
}

function getLengthSafe(text: string | null): number {
  return text?.length ?? 0;
  // OK — optional chaining short-circuits to undefined on null,
  // then ?? falls back to 0
}`,
          explanation:
            "Without `strictNullChecks`, the first version compiles fine and crashes at runtime the first time someone passes `null`. With it on, TypeScript refuses to compile until you handle the null case — exactly the bug class `??`/`?.` exist to solve.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between == and ===?",
      answer:
        "== (loose equality) coerces operands to a common type before comparing, which produces famously inconsistent results (e.g. 0 == '' is true but null == 0 is false). === (strict equality) compares both type and value with no coercion. Best practice is to always use === / !==.",
    },
    {
      question: "List the falsy values in JavaScript.",
      answer:
        "false, 0, -0, 0n, \"\" (empty string), null, undefined, and NaN. Everything else — including \"0\", [], and {} — is truthy.",
    },
    {
      question: "Why is `value || defaultValue` risky for numeric defaults, and what should you use instead?",
      answer:
        "Because || falls back whenever the left side is falsy, including legitimate values like 0 or an empty string — silently overwriting valid data. The nullish coalescing operator ?? only falls back when the left side is specifically null or undefined, which is almost always the intended behavior.",
    },
    {
      question: "Why does 1 + \"2\" produce \"12\" but \"5\" - 2 produce 3?",
      answer:
        "The + operator special-cases string operands: if either side is a string, it performs concatenation. Every other arithmetic operator (-, *, /, %) always coerces both operands to numbers first, so \"5\" is converted to the number 5 before subtraction.",
    },
    {
      question: "What does enabling strictNullChecks in TypeScript actually change?",
      answer:
        "Without it, null and undefined are implicitly assignable to every type, so TypeScript can't catch 'possibly null' bugs. With it enabled, null and undefined are only valid where a type explicitly includes them (e.g. string | null), forcing you to handle those cases before the compiler will accept the code.",
    },
  ],
  takeaways: [
    "Always use === and !== — never rely on =='s coercion rules.",
    "Only + concatenates strings; -, *, /, % always coerce operands to numbers.",
    "Memorize the 8 falsy values: false, 0, -0, 0n, \"\", null, undefined, NaN — everything else is truthy, including [] and {}.",
    "Prefer ?? over || for defaulting values that might legitimately be 0 or \"\".",
    "TypeScript's strictNullChecks forces explicit handling of null/undefined instead of letting them slip through silently.",
  ],
  status: "available",
};
