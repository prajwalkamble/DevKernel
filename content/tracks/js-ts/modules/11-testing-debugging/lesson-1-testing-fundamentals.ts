import type { Lesson } from "@/content/types";

export const testingFundamentalsLesson: Lesson = {
  id: "testing-fundamentals",
  slug: "testing-fundamentals",
  moduleSlug: "testing-debugging",
  title: "Unit Testing Fundamentals with Vitest",
  summary:
    "Writing tests that are worth having: the structure of a test file, the matchers that matter, reading a failure report properly, and controlling time instead of waiting for it.",
  estimatedMinutes: 35,
  objectives: [
    "Set up Vitest and run a suite",
    "Structure tests with describe, it and the lifecycle hooks",
    "Choose between toBe, toEqual and the other matchers",
    "Read a failure report and find the assertion that produced it",
    "Test code that throws, and code that is asynchronous",
    "Replace real timers with fake ones",
  ],
  sections: [
    {
      id: "setup",
      heading: "Vitest, and why not Jest",
      body: [
        "**Vitest** is the default choice for new JavaScript and TypeScript projects. It shares Jest's API almost exactly — `describe`, `it`, `expect`, `vi` in place of `jest` — so knowledge transfers both ways, and it runs TypeScript and ESM natively with no transform configuration at all.",
        "**Jest** remains extremely common in existing codebases, and everything in this module applies to it with `jest` substituted for `vi`. Its friction with ESM and TypeScript is the main reason new projects have moved.",
        "Setup is one dependency and one script.",
      ],
      examples: [
        {
          id: "vitest-setup",
          title: "Installing and running",
          lang: "bash",
          code: `npm install -D vitest

# package.json
#   "scripts": {
#     "test": "vitest",            # watch mode, for development
#     "test:run": "vitest run",    # single pass, for CI
#     "test:ui": "vitest --ui",
#     "coverage": "vitest run --coverage"
#   }

npm test`,
          explanation:
            "Vitest finds `*.test.ts` and `*.spec.ts` anywhere in the project by default, so no configuration is needed to start. `vitest` alone watches and re-runs only the tests affected by what you changed; `vitest run` does one pass and exits, which is what CI wants.",
        },
      ],
    },
    {
      id: "structure",
      heading: "The shape of a test",
      body: [
        "**`it`** (or `test` — identical) declares one test. **`describe`** groups related ones and can nest. **`expect`** makes an assertion.",
        "The internal shape worth keeping is **arrange, act, assert**: set up the inputs, run the thing, check the result. Tests that interleave the three are hard to read and usually testing several things at once.",
        "The name matters more in tests than almost anywhere else, because it is what a failing CI run shows you. `it(\"returns 0 for an empty cart\")` tells you what broke; `it(\"works\")` does not.",
      ],
      examples: [
        {
          id: "test-structure",
          title: "A file under test, and its tests",
          ts: `// src/cart.ts
export interface Item {
  sku: string;
  price: number;
  qty: number;
}

export function total(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return Math.round(subtotal * (1 + taxRate) * 100) / 100;
}

export function applyDiscount(amount: number, code: string): number {
  if (code === "HALF") return amount / 2;
  if (code === "") throw new Error("Discount code must not be empty");
  return amount;
}`,
        },
        {
          id: "test-file",
          title: "src/cart.test.ts",
          ts: `import { describe, it, expect } from "vitest";
import { total, applyDiscount, type Item } from "./cart";

describe("total", () => {
  it("sums line items and applies tax", () => {
    // arrange
    const items: Item[] = [{ sku: "a", price: 10, qty: 2 }];

    // act + assert
    expect(total(items, 0.2)).toBe(24);
  });

  it("compares objects by value, not identity", () => {
    expect({ a: 1, b: [2] }).toEqual({ a: 1, b: [2] });
    expect({ a: 1 }).not.toBe({ a: 1 });
  });
});

describe("applyDiscount", () => {
  it("throws on an empty code", () => {
    // The function must be wrapped, or it throws before expect sees it.
    expect(() => applyDiscount(10, "")).toThrow("must not be empty");
  });
});`,
          explanation:
            "The wrapping in `expect(() => …)` is not optional: calling `applyDiscount(10, \"\")` directly would throw during argument evaluation and fail the test with the raw error instead of asserting on it. `toThrow` accepts a substring, a regular expression, or an error class.",
        },
      ],
    },
    {
      id: "matchers",
      heading: "The matchers you will actually use",
      body: [
        "There are dozens; about ten cover almost everything.",
        "**`toBe`** — `Object.is`, so reference identity for objects. Right for primitives, wrong for objects unless you mean identity.",
        "**`toEqual`** — deep structural equality. The default for objects and arrays. It ignores `undefined` properties; **`toStrictEqual`** does not, and also checks the prototype.",
        "**`toContain`** for an array member or a substring, **`toMatchObject`** for a subset of properties, **`toHaveLength`**, **`toBeCloseTo`** for floats, **`toThrow`**, and **`toBeNull` / `toBeUndefined` / `toBeDefined`**.",
        "The float one is worth remembering: `expect(0.1 + 0.2).toBe(0.3)` fails for the reason module 1 explains. `toBeCloseTo(0.3)` is what you want.",
      ],
      examples: [
        {
          id: "matcher-choice",
          title: "Choosing correctly",
          ts: `// Primitives: toBe.
expect(total(items, 0)).toBe(20);

// Objects and arrays: toEqual.
expect(parseUser(raw)).toEqual({ id: 1, name: "Ada" });

// toEqual ignores undefined properties; toStrictEqual does not.
expect({ a: 1, b: undefined }).toEqual({ a: 1 });          // passes
expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 });    // fails

// A subset, when the object has fields you do not care about.
expect(response).toMatchObject({ status: 200 });

// Floats.
expect(0.1 + 0.2).toBeCloseTo(0.3);

// Asymmetric matchers, for values you cannot predict.
expect(created).toEqual({
  id: expect.any(String),
  createdAt: expect.any(Date),
  name: "Ada",
});`,
          explanation:
            "`expect.any(String)` is the tool for ids, timestamps and anything else generated at runtime. The alternative — deleting those fields before comparing, or asserting each remaining field separately — is what test files look like when people have not met it.",
        },
      ],
      pitfalls: [
        {
          title: "`toBe` on an object almost always means you wanted `toEqual`",
          body: "`expect({ a: 1 }).toBe({ a: 1 })` fails, because they are two different objects. The failure message says \"expected … to be …\" showing two structurally identical values, which is baffling until you know it is comparing identity. Reach for `toEqual` on anything that is not a primitive.",
        },
      ],
    },
    {
      id: "reading-failures",
      heading: "Reading a failure",
      body: [
        "A test report is only useful if you can go straight from it to the line that broke. Vitest's format has four parts and they are worth naming.",
      ],
      examples: [
        {
          id: "failure-output",
          title: "A real failure report",
          lang: "bash",
          code: `npx vitest run`,
          output: ` RUN  v4.1.10 /project

 ❯ src/cart.test.ts (6 tests | 1 failed) 56ms
     × this one fails on purpose 22ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/cart.test.ts > total > this one fails on purpose
AssertionError: expected 24 to be 25 // Object.is equality

- Expected
+ Received

- 25
+ 24

 ❯ src/cart.test.ts:11:59
      9|
     10|   it("this one fails on purpose", () => {
     11|     expect(total([{ sku: "a", price: 10, qty: 2 }], 0.2)).toBe(25);
       |                                                           ^
     12|   });
     13|

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Duration  752ms`,
          explanation:
            "**The path** — `cart.test.ts > total > this one fails on purpose` — is the describe chain plus the test name, which is why good names pay off here. **The diff** uses `-` for expected and `+` for received, which is the opposite of what most people assume the first time. **The caret** points at the exact assertion, not just the line. And `// Object.is equality` is telling you which comparison was used, which is how you notice you wanted `toEqual`.",
        },
      ],
    },
    {
      id: "async",
      heading: "Testing asynchronous code",
      body: [
        "Return or await the promise. A test function that returns a promise is awaited by the runner; one that does not is finished the moment it returns, and any assertion inside a `.then` runs after the test has already passed.",
        "For rejections, `rejects` mirrors `toThrow`.",
      ],
      examples: [
        {
          id: "async-tests",
          title: "Awaiting properly, and the silent pass",
          ts: `// Correct: the runner awaits the returned promise.
it("loads a user", async () => {
  const user = await loadUser("1");
  expect(user.name).toBe("Ada");
});

// Correct: rejections have their own matchers.
it("rejects for an unknown id", async () => {
  await expect(loadUser("nope")).rejects.toThrow("not found");
});

// Also correct — returning the promise is enough.
it("resolves to the right shape", () => {
  return expect(loadUser("1")).resolves.toMatchObject({ id: "1" });
});

// WRONG: nothing is returned or awaited, so the test passes immediately
// and the assertion runs — and fails — after it is over.
it("passes even when the assertion is false", () => {
  loadUser("1").then((user) => {
    expect(user.name).toBe("definitely not this");
  });
});`,
          explanation:
            "The last one is the most dangerous test failure mode there is: a green test that asserts nothing. Vitest will often report an unhandled rejection afterwards, but the test itself passed. The `await` before `expect(...).rejects` is equally essential — without it the assertion is a floating promise.",
        },
      ],
    },
    {
      id: "lifecycle-timers",
      heading: "Lifecycle hooks and fake timers",
      body: [
        "**`beforeEach` / `afterEach`** run around every test in their scope; **`beforeAll` / `afterAll`** run once. Prefer `beforeEach` — shared state built once and mutated by several tests is the classic source of tests that pass alone and fail together.",
        "**Fake timers** replace `setTimeout`, `setInterval` and `Date` with controllable versions, so a test for a five-second debounce takes microseconds instead of five seconds. A test suite that contains real waiting will be skipped by the team within a month.",
      ],
      examples: [
        {
          id: "fake-timers",
          title: "Controlling time",
          ts: `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("fake timers", () => {
  beforeEach(() => vi.useFakeTimers());
  // Restoring matters: leaked fake timers break every later test file.
  afterEach(() => vi.useRealTimers());

  it("controls time instead of waiting for it", () => {
    const tick = vi.fn();
    setTimeout(tick, 5000);

    expect(tick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(tick).toHaveBeenCalledOnce();
  });

  it("can pin the clock too", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(new Date().getFullYear()).toBe(2026);
  });
});

// The other controls:
//   vi.advanceTimersByTimeAsync(ms)  — also flushes promises
//   vi.runAllTimers()                — run everything pending
//   vi.runOnlyPendingTimers()        — avoids infinite setInterval loops`,
          explanation:
            "`advanceTimersByTimeAsync` is the one people miss. With plain `advanceTimersByTime`, a `setTimeout` whose callback awaits something will fire the callback but not resolve the promise, so the assertion runs too early. The async variant flushes the microtask queue between ticks.",
        },
      ],
      pitfalls: [
        {
          title: "Tests that pass alone and fail in a suite share state",
          body: "Module-level variables, a database seeded in `beforeAll`, a mock that was not reset, or fake timers that were never restored. Vitest isolates test *files* by default but not tests within a file. When a test only fails in the full run, the cause is almost always something left behind by an earlier one — run with `--sequence.shuffle` to surface it deliberately.",
        },
      ],
    },
    {
      id: "what-to-test",
      heading: "What is worth testing",
      body: [
        "Coverage is a poor target. A hundred percent coverage says every line ran, not that any of it was checked — and chasing it produces tests for getters and trivial mappers that cost maintenance and catch nothing.",
        "**Test the things that are hard to get right:** business rules, edge cases and boundaries, error paths, anything with a formula, and any bug you have actually fixed. A test written at the moment a bug is found is the highest-value test there is, because it documents a mistake that was genuinely possible.",
        "**Do not test:** framework behaviour, the language, third-party libraries, or implementation details such as \"this private method was called\". Tests coupled to structure break on every refactor and stop anyone refactoring.",
        "The check that matters more than coverage: **if I broke this on purpose, would a test fail?** Try it occasionally — mutation testing tools such as Stryker automate exactly that question.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between toBe, toEqual and toStrictEqual?",
      answer:
        "`toBe` uses `Object.is`, so for objects it compares identity — right for primitives, almost never what you want otherwise. `toEqual` compares structure recursively and ignores properties whose value is `undefined`. `toStrictEqual` is `toEqual` plus checks for `undefined` properties, array sparseness and matching prototypes, so a class instance does not equal a plain object with the same fields.",
    },
    {
      question: "How do you test that a function throws?",
      answer:
        "Wrap the call: `expect(() => fn()).toThrow(\"message\")`. Passing `fn()` directly would throw while the arguments to `expect` are evaluated, failing the test with the raw error instead of asserting on it. For async code use `await expect(fn()).rejects.toThrow(…)`, and the `await` is essential or the assertion is a floating promise.",
    },
    {
      question: "What happens if you forget to await in an async test?",
      answer:
        "The test function returns before the assertions run, so the runner marks it passed. The assertion executes afterwards and its failure surfaces as an unhandled rejection attributed to nothing in particular — or not at all. It is the worst failure mode in testing, because the suite is green while asserting nothing. Always return or await the promise.",
    },
    {
      question: "Why use fake timers?",
      answer:
        "So a test for a five-second debounce or a polling interval takes microseconds instead of five seconds. `vi.useFakeTimers()` replaces the timer functions and `advanceTimersByTime` moves the clock deliberately. Restore them in `afterEach`, because leaked fake timers break later files, and prefer `advanceTimersByTimeAsync` when the callback awaits anything, since the sync version does not flush promises.",
    },
    {
      question: "Is 100% coverage a good goal?",
      answer:
        "No. Coverage measures which lines executed, not whether anything was asserted about them — a test with no expectations still produces coverage. Chasing the number produces low-value tests for trivial code and couples the suite to implementation details. A better question is whether deliberately breaking a behaviour would fail a test, which is what mutation testing measures.",
    },
  ],
  takeaways: [
    "Vitest shares Jest's API and runs TypeScript and ESM without transform configuration; `vitest run` is the CI form",
    "Arrange, act, assert — and name tests so a CI failure tells you what broke",
    "`toBe` is identity, `toEqual` is structural, `toStrictEqual` also checks undefined properties and prototypes",
    "`expect(() => fn()).toThrow(…)` — the call must be wrapped, or it throws before the assertion",
    "In Vitest's diff, `-` is expected and `+` is received, and the caret points at the exact assertion",
    "Return or await promises in async tests; forgetting produces a green test that asserts nothing",
    "Fake timers make time-dependent tests instant — restore them in `afterEach`, and use the async variants when callbacks await",
    "Coverage measures execution, not verification; test the rules, the edges, the error paths and every bug you fix",
  ],
  status: "available",
};
