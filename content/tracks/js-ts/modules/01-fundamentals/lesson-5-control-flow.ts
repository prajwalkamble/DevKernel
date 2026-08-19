import type { Lesson } from "@/content/types";

export const controlFlowLesson: Lesson = {
  id: "fundamentals-control-flow",
  slug: "control-flow",
  moduleSlug: "fundamentals",
  title: "Control Flow: Conditionals & Loops",
  summary:
    "if/else, switch, the ternary operator, every loop type JavaScript offers, and how TypeScript narrows types automatically as you branch through conditions.",
  estimatedMinutes: 25,
  objectives: [
    "Choose between if/else, switch, and ternary appropriately",
    "Understand the difference between for...in and for...of",
    "Know when to reach for while vs do...while",
    "Understand TypeScript's control-flow type narrowing",
  ],
  sections: [
    {
      id: "conditionals",
      heading: "if / else, switch, and the ternary operator",
      body: [
        "`if/else` branches on any truthy/falsy condition. `switch` compares one value against several possibilities using strict equality (`===`) and supports **fall-through** — execution continues into the next case unless you `break`. The ternary `condition ? a : b` is a compact expression form of if/else, useful for simple value selection, not for branching side effects.",
      ],
      examples: [
        {
          id: "switch-fallthrough",
          title: "switch fall-through — intentional and accidental",
          js: `function describe(day) {
  switch (day) {
    case "Sat":
    case "Sun":
      return "Weekend"; // two cases intentionally share one result
    case "Mon":
      console.log("Start of week");
      // no break! falls through into "Tue"
    case "Tue":
      return "Early week";
    default:
      return "Midweek";
  }
}

console.log(describe("Sat")); // "Weekend"
console.log(describe("Mon")); // logs "Start of week", then returns "Early week"`,
          explanation:
            "Stacking `case \"Sat\": case \"Sun\":` with no code between them is a common, intentional pattern for grouping cases. Forgetting `break` when you *don't* want fall-through is one of the most common switch bugs — always check each case ends in `return`, `break`, or `throw`.",
        },
      ],
    },
    {
      id: "loops",
      heading: "Every loop type",
      body: [
        "`for (init; condition; step)` — the classic counted loop. `while (condition)` — repeats while true, checked *before* each iteration (may run zero times). `do...while (condition)` — same as while, but checked *after*, so the body always runs at least once.",
        "`for...in` iterates over an object's **enumerable property keys** (as strings) — including inherited ones, which is a common source of bugs. It works on arrays too (keys become `\"0\"`, `\"1\"`, ...) but that's almost never what you want.",
        "`for...of` iterates over the **values** of any *iterable* — arrays, strings, Maps, Sets, and anything implementing the iterator protocol. For arrays and most collections, `for...of` is what you want; reserve `for...in` for genuinely inspecting an object's own keys (and even then, `Object.keys()` is usually clearer).",
      ],
      examples: [
        {
          id: "for-in-vs-of",
          title: "for...in gives keys, for...of gives values",
          js: `const colors = ["red", "green", "blue"];

for (const index in colors) {
  console.log(index, typeof index); // "0" "string", "1" "string", "2" "string"
}

for (const color of colors) {
  console.log(color); // "red", "green", "blue"
}

const scores = { ada: 95, alan: 88 };
for (const key in scores) {
  console.log(key, scores[key]); // "ada" 95, "alan" 88
}
// for...of would throw here — a plain object is not iterable`,
        },
        {
          id: "while-do-while",
          title: "while vs do...while",
          js: `let n = 5;
while (n < 5) {
  console.log("never runs, condition already false");
  n++;
}

let m = 5;
do {
  console.log("runs once, checked after the body"); // this DOES run
  m++;
} while (m < 5);`,
        },
      ],
      pitfalls: [
        {
          title: "for...in on arrays picks up inherited/extra enumerable properties",
          body: "If any code (or a poorly-written library) adds a property to `Array.prototype`, `for...in` on any array will iterate over it too, alongside the numeric indices. `for...of` and array methods like `.forEach()` don't have this problem — prefer them for arrays.",
        },
      ],
    },
    {
      id: "ts-narrowing",
      heading: "TypeScript: control flow narrows types automatically",
      body: [
        "This is one of TypeScript's most useful everyday features and needs no special syntax: as your code passes through `if`, `switch`, `typeof`, `instanceof`, or truthy checks, TypeScript automatically **narrows** a variable's type within each branch to only what's still possible there.",
      ],
      examples: [
        {
          id: "narrowing-example",
          title: "Type narrowing through an if statement",
          ts: `function formatId(id: string | number) {
  if (typeof id === "string") {
    return id.toUpperCase(); // TS knows id is 'string' here
  }
  return id.toFixed(2);      // TS knows id is 'number' here — the only option left
}

function printLength(value: string | null) {
  if (value) {
    console.log(value.length); // narrowed to 'string' — null is falsy, excluded
  } else {
    console.log("no value");   // narrowed to 'null' here
  }
}`,
          explanation:
            "Inside the `if (typeof id === \"string\")` branch, calling `.toUpperCase()` is safe and autocompletes in your editor — TypeScript has proven `id` cannot be a `number` there. This narrowing works with switch statements and && / || chains too, not just if.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What's the difference between for...in and for...of?",
      answer:
        "for...in iterates over an object's enumerable property keys (as strings), including inherited ones — it's meant for objects. for...of iterates over the values of any iterable (arrays, strings, Maps, Sets) — it's what you almost always want for arrays.",
    },
    {
      question: "What's the difference between while and do...while?",
      answer:
        "while checks its condition before each iteration, so it can run zero times if the condition starts false. do...while checks the condition after the body runs, so the body always executes at least once regardless of the condition.",
    },
    {
      question: "Why does switch fall-through happen, and how do you prevent it?",
      answer:
        "switch executes statements sequentially through matching and subsequent cases unless a break (or return/throw) stops it — there's no implicit break between cases like some other languages have. You prevent unintended fall-through by ending every case with break, return, or throw; intentional fall-through (stacking empty cases) is a valid, common pattern for grouping.",
    },
    {
      question: "How does TypeScript's control-flow narrowing work?",
      answer:
        "TypeScript analyzes conditionals (typeof, instanceof, truthy checks, equality checks, switch cases) and automatically narrows a variable's static type within each branch to exclude possibilities the check has ruled out — no manual type assertions needed in most cases.",
    },
    {
      question: "Is a ternary expression a good replacement for if/else in all cases?",
      answer:
        "Only for choosing between two values to use in an expression (e.g. assigning a variable or returning a value). It shouldn't be used to trigger two different side effects/branches of unrelated statements — that's what if/else is for; nested or side-effecting ternaries quickly become unreadable.",
    },
  ],
  takeaways: [
    "switch compares with strict equality and falls through by default — always terminate cases explicitly.",
    "Use for...of (or array methods) for arrays and other iterables; reserve for...in for inspecting object keys.",
    "do...while guarantees at least one execution of the loop body; while does not.",
    "TypeScript automatically narrows types inside conditional branches based on typeof/instanceof/truthy checks — no extra syntax required.",
  ],
  status: "available",
};
