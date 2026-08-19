import type { Lesson } from "@/content/types";

export const generatorsLesson: Lesson = {
  id: "arrays-collections-generators",
  slug: "generator-functions-and-yield",
  moduleSlug: "arrays-collections",
  title: "Generator Functions & yield",
  summary:
    "Functions that can pause and resume themselves, automatically implementing the iterator/iterable protocols from the previous lesson — the easy way to write custom iteration and lazy sequences.",
  estimatedMinutes: 30,
  objectives: [
    "Write a generator function and understand how yield pauses execution",
    "Drive a generator manually with .next() and understand what it returns",
    "Use yield* to delegate to another generator or iterable",
    "Rewrite a manually-built iterable (from the previous lesson) as a much simpler generator",
  ],
  sections: [
    {
      id: "what-is-a-generator",
      heading: "A function that can pause itself",
      body: [
        "A **generator function** — declared with `function*` — behaves completely differently from a normal function. Calling it doesn't run its body immediately; instead, it returns a special **generator object** immediately, without executing a single line. The body only runs when you call `.next()` on that generator object, and it runs **only up to the next `yield` expression**, where it pauses, returns that yielded value, and waits. Calling `.next()` again resumes execution exactly where it left off, continuing until the next `yield` or the function ends.",
        "Crucially, a generator object automatically satisfies **both** the iterator protocol (it has `.next()`) **and** the iterable protocol (its own `Symbol.iterator` just returns itself) — which is precisely why generators are the easy, built-in way to implement what the previous lesson built by hand.",
      ],
      examples: [
        {
          id: "generator-basics-example",
          title: "A generator, paused and resumed step by step",
          js: `function* countUp() {
  console.log("Starting");
  yield 1;
  console.log("Resumed after first yield");
  yield 2;
  console.log("Resumed after second yield");
  yield 3;
  console.log("Finishing");
}

const gen = countUp(); // nothing logs yet — the body hasn't run at all

console.log(gen.next()); // logs "Starting", then returns { value: 1, done: false }
console.log(gen.next()); // logs "Resumed after first yield", returns { value: 2, done: false }
console.log(gen.next()); // logs "Resumed after second yield", returns { value: 3, done: false }
console.log(gen.next()); // logs "Finishing", returns { value: undefined, done: true }`,
          explanation:
            "Notice exactly how execution genuinely pauses mid-function — 'Resumed after first yield' only logs on the *second* call to `.next()`, not the first. This pause-and-resume behavior is unique to generators; no other JavaScript function can suspend itself mid-execution and pick back up later.",
        },
      ],
    },
    {
      id: "generators-are-iterable",
      heading: "Generators satisfy the iterator and iterable protocols automatically",
      body: [
        "Because the object a generator function returns already has both a `.next()` method matching the exact protocol from the previous lesson and its own `Symbol.iterator`, generators work immediately with `for...of`, spread, and destructuring — no manual protocol implementation required.",
      ],
      examples: [
        {
          id: "generator-for-of-example",
          title: "Generators work with for...of and spread out of the box",
          js: `function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

for (const n of range(1, 4)) {
  console.log(n); // 1, 2, 3, 4
}

console.log([...range(1, 4)]); // [1, 2, 3, 4]

// Compare this to the manual createRange from the previous lesson —
// same result, dramatically less code, and no need to hand-write next()/done`,
          explanation:
            "This `range` generator produces the exact same behavior as the hand-written `createRange` iterable from the previous lesson, in about a quarter of the code — you write natural, linear-looking code with `yield` instead of manually tracking `current`/`done` state and returning objects yourself.",
        },
      ],
    },
    {
      id: "yield-delegation",
      heading: "yield*: delegating to another generator or iterable",
      body: [
        "`yield*` hands off iteration to another generator or any iterable, yielding each of *its* values in turn as if they were yielded directly, before continuing. This is the standard way to compose generators together without manually looping over one generator and re-yielding each value.",
      ],
      examples: [
        {
          id: "yield-delegation-example",
          title: "Composing generators with yield*",
          js: `function* evens(limit) {
  for (let i = 0; i <= limit; i += 2) yield i;
}

function* odds(limit) {
  for (let i = 1; i <= limit; i += 2) yield i;
}

function* allNumbers(limit) {
  yield* evens(limit); // delegates — yields every value evens() produces
  yield* odds(limit);  // then delegates to odds()
}

console.log([...allNumbers(6)]); // [0, 2, 4, 6, 1, 3, 5]

// yield* also works directly on any iterable, not just other generators:
function* combined() {
  yield* [1, 2, 3];       // an array is iterable
  yield* "ab";             // a string is iterable too — yields "a", then "b"
}
console.log([...combined()]); // [1, 2, 3, "a", "b"]`,
        },
      ],
    },
    {
      id: "practical-uses",
      heading: "A genuinely practical use: lazy, infinite sequences",
      body: [
        "Because a generator only computes each value **on demand** (when `.next()` is called), generators can represent conceptually **infinite** sequences without ever running out of memory or looping forever up front — something a regular function returning a full array could never safely do. Consumers simply stop asking for more values whenever they're satisfied.",
      ],
      examples: [
        {
          id: "infinite-generator-example",
          title: "An infinite generator, consumed lazily",
          js: `function* naturalNumbers() {
  let n = 1;
  while (true) {
    yield n++; // would be an infinite loop in a normal function — fine here, it's lazy
  }
}

function take(iterable, count) {
  const result = [];
  for (const value of iterable) {
    if (result.length >= count) break; // stop pulling values whenever WE decide to
    result.push(value);
  }
  return result;
}

console.log(take(naturalNumbers(), 5)); // [1, 2, 3, 4, 5]
// naturalNumbers() never actually finishes — we just stopped asking it for more`,
          explanation:
            "`naturalNumbers()` returning immediately (as all generator calls do) combined with values only being computed one `.next()` at a time is what makes this safe — the `while (true)` loop inside never runs to completion in one go; it only advances one step per `.next()` call, and `take` simply stops calling `.next()` once it has enough.",
        },
      ],
    },
    {
      id: "ts-generators",
      heading: "TypeScript: typing generator functions",
      body: [
        "A generator function's return type is `Generator<YieldType, ReturnType, NextType>` — usually you only need to care about `YieldType` (what each `yield` produces); TypeScript can typically infer it automatically from your `yield` statements without any annotation at all.",
      ],
      examples: [
        {
          id: "ts-generator-example",
          title: "A typed generator, inferred and explicit",
          ts: `function* range(start: number, end: number): Generator<number> {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

for (const n of range(1, 3)) {
  console.log(n.toFixed(2)); // OK — n is correctly inferred/typed as 'number'
}

// The explicit Generator<number> annotation above is often unnecessary —
// TypeScript infers it automatically from the yield statements:
function* inferredRange(start: number, end: number) {
  for (let i = start; i <= end; i++) {
    yield i; // TypeScript infers this generator's type as Generator<number, void, unknown>
  }
}`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens when you call a generator function?",
      answer:
        "Nothing in the function body runs immediately — calling a generator function returns a generator object right away, without executing any code. The body only starts running (up to the first yield) once .next() is called on that generator object for the first time.",
    },
    {
      question: "What does the yield keyword do inside a generator function?",
      answer:
        "It pauses the generator's execution at that point, returns the yielded value wrapped as { value, done: false } from the current .next() call, and waits. The next call to .next() resumes execution immediately after that yield, continuing until the next yield or the end of the function.",
    },
    {
      question: "Why do generators work directly with for...of and the spread operator with no extra code?",
      answer:
        "A generator object automatically satisfies both the iterator protocol (it has a .next() method returning { value, done }) and the iterable protocol (its own Symbol.iterator method returns itself) — the exact requirements for-of, spread, and destructuring rely on, covered in the previous lesson.",
    },
    {
      question: "What does yield* do?",
      answer:
        "It delegates iteration to another generator or any iterable, yielding each of that iterable's values in turn as if they had been yielded directly by the outer generator, before execution continues past the yield* line. It's the standard way to compose multiple generators together without manually looping and re-yielding.",
    },
    {
      question: "Why can a generator safely represent an infinite sequence (like all natural numbers) without freezing the program?",
      answer:
        "Because a generator only computes and produces one value per call to .next() — it doesn't run to completion in one go. A while(true) loop inside a generator body only advances one iteration at a time, pausing at each yield, so the sequence is only ever as long as however many times a consumer actually calls .next(), making it safe to represent conceptually infinite data lazily.",
    },
  ],
  takeaways: [
    "A generator function (function*) returns a generator object immediately without running its body; execution only proceeds up to each yield, one .next() call at a time.",
    "Generator objects automatically satisfy both the iterator and iterable protocols, so they work with for...of, spread, and destructuring with zero extra code.",
    "yield* delegates to another generator or iterable, yielding all of its values before continuing — the standard way to compose generators.",
    "Generators can safely represent infinite, lazy sequences since each value is only computed on demand, one at a time, when a consumer calls .next().",
    "TypeScript types a generator's yielded value as Generator<YieldType, ...>, almost always inferred automatically from the function's yield statements.",
  ],
  status: "available",
};
