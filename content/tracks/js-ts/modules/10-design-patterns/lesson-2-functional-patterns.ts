import type { Lesson } from "@/content/types";

export const functionalPatternsLesson: Lesson = {
  id: "patterns-functional",
  slug: "functional-patterns",
  moduleSlug: "design-patterns",
  title: "Functional Patterns in JavaScript & TypeScript",
  summary:
    "Purity, immutability and composition as practical tools rather than doctrine — including where each one stops paying, and the shallow-copy trap that catches everyone who thinks spreading is enough.",
  estimatedMinutes: 35,
  objectives: [
    "Define a pure function and say what purity buys you",
    "Copy data immutably, and know why spread and freeze are both shallow",
    "Compose functions with pipe, and type the composition",
    "Use currying and partial application where they help",
    "Recognise when point-free style becomes unreadable",
    "Know which functional ideas are worth adopting and which are not",
  ],
  sections: [
    {
      id: "purity",
      heading: "Pure functions",
      body: [
        "A function is **pure** when the same inputs always produce the same output, and calling it changes nothing outside itself. No mutation of arguments, no writing to globals, no I/O, no clock, no randomness.",
        "The reasons to care are practical, not aesthetic. A pure function can be **tested with no setup** — no mocks, no fixtures, no database. It can be **cached**, because the answer never changes. It can be **read in isolation**, because nothing elsewhere can affect it. And it can be moved, reordered or parallelised safely.",
        "The point is not that every function should be pure — a program that changes nothing does nothing. The point is to **push impurity to the edges**: a thin shell that reads input and writes output, wrapped around a core that is pure and therefore trivially testable.",
      ],
      examples: [
        {
          id: "purity-example",
          title: "The same logic, impure and pure",
          js: `// Impure: reads a global, mutates its argument, and writes to a log.
let taxRate = 0.2;

function applyTax(order) {
  order.total = order.subtotal * (1 + taxRate);   // mutates the caller's object
  console.log("taxed", order.id);                 // side effect
  return order;
}

// Pure: everything it needs arrives as an argument; nothing outside changes.
function withTax(order, rate) {
  return { ...order, total: order.subtotal * (1 + rate) };
}

// The impure part becomes a thin shell around it.
function processOrder(order) {
  const taxed = withTax(order, config.taxRate);
  logger.info("taxed", taxed.id);
  return taxed;
}`,
          explanation:
            "`withTax` needs no setup to test: give it an object and a number, check the result. `applyTax` needs a global assigned, a console spy, and a fresh object each time because it damages the one you pass it. That difference in testing cost is the whole argument, and it compounds across a codebase.",
        },
      ],
    },
    {
      id: "immutability",
      heading: "Immutability, and the shallow-copy trap",
      body: [
        "Spread and `Object.assign` copy **one level**. Nested objects and arrays are shared with the original, so changing one changes both. This is the single most common misunderstanding about immutable updates in JavaScript.",
        "`Object.freeze` has the same limitation: it freezes the object you hand it, not what that object points at. And in a module — which is always strict mode — writing to a frozen property **throws** rather than failing silently, which is worth knowing before it surprises you in production.",
      ],
      examples: [
        {
          id: "shallow-copy",
          title: "Spread and freeze are both one level deep",
          js: `const original = { a: 1, nested: { b: 2 } };

const shallow = { ...original, a: 99 };
shallow.nested.b = 999;                 // the SAME object as original.nested

console.log("shallow copy shares nested:", original.nested.b);

const frozen = Object.freeze({ a: 1, nested: { b: 2 } });

try {
  frozen.a = 5;                         // strict mode: throws
} catch (error) {
  console.log("strict write to frozen ->", error.constructor.name);
}

frozen.nested.b = 5;                    // freeze is shallow: this succeeds
console.log("frozen.a:", frozen.a, "| frozen.nested.b:", frozen.nested.b);
console.log("isFrozen(nested):", Object.isFrozen(frozen.nested));`,
          output: `shallow copy shares nested: 999
strict write to frozen -> TypeError
frozen.a: 1 | frozen.nested.b: 5
isFrozen(nested): false`,
          explanation:
            "Read the last two lines together: the top-level write was rejected and the nested write went straight through. If you want a deep copy, `structuredClone` does it properly (module 8). If you want deep freezing, you have to recurse yourself — and usually the better answer is to keep state shallow enough that the question does not arise.",
        },
        {
          id: "immutable-updates",
          title: "Updating nested data without mutating",
          js: `const state = {
  user: { name: "Ada", prefs: { theme: "dark" } },
  items: [{ id: 1, done: false }],
};

// Every level you change must be copied. Levels you do not touch are shared,
// which is the point — it is cheap, and unchanged branches keep their identity.
const next = {
  ...state,
  user: {
    ...state.user,
    prefs: { ...state.user.prefs, theme: "light" },
  },
  items: state.items.map((item) =>
    item.id === 1 ? { ...item, done: true } : item
  ),
};

console.log(state.user.prefs.theme, next.user.prefs.theme);
console.log("untouched branch shared:", state.items[0] === next.items[0]);`,
          output: `dark light
false`,
          explanation:
            "Three levels of spread is already at the edge of readable, and four is past it. That is the signal to either flatten the state shape or adopt Immer, which lets you write `draft.user.prefs.theme = \"light\"` and produces the immutable version for you. Reaching for a library here is not defeat; hand-written spread chains are a genuine source of bugs.",
        },
      ],
      pitfalls: [
        {
          title: "`as const` freezes the type, not the value",
          body: "`const config = { retries: 3 } as const` makes the *type* deeply readonly, so TypeScript rejects assignments. At runtime the object is perfectly mutable, and anything reaching it through an `any` — JSON, a library boundary, a cast — can change it. Use `as const` for the type-level guarantee and `Object.freeze` when you need the runtime one.",
        },
      ],
    },
    {
      id: "composition",
      heading: "Composition: pipe and compose",
      body: [
        "Composition is building a bigger transformation by chaining small ones. Two helpers do it, and they differ only in direction.",
        "**`pipe(f, g, h)`** applies left to right: `h(g(f(x)))`. This reads in the order things happen, which is why most people prefer it.",
        "**`compose(f, g, h)`** applies right to left: `f(g(h(x)))`, matching the mathematical notation.",
        "Both are four lines. The value is that each step is separately named, separately testable, and reusable — and that inserting a step is one line rather than a re-indent.",
      ],
      examples: [
        {
          id: "pipe-compose",
          title: "Both directions, and typing them",
          js: `const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const words = (s) => s.split(/\\s+/);

console.log("pipe:", JSON.stringify(pipe(trim, lower, words)("  Hello   World  ")));
console.log("compose:", JSON.stringify(compose(words, lower, trim)("  Hello   World  ")));`,
          ts: `// Typing variadic composition properly needs one overload per arity —
// which is exactly what every library that ships \`pipe\` does.
function pipe<A, B>(ab: (a: A) => B): (a: A) => B;
function pipe<A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
function pipe<A, B, C, D>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D
): (a: A) => D;
function pipe(...fns: Array<(x: unknown) => unknown>) {
  return (x: unknown) => fns.reduce((acc, fn) => fn(acc), x);
}

const trim = (s: string): string => s.trim();
const lower = (s: string): string => s.toLowerCase();
const words = (s: string): string[] => s.split(/\\s+/);

const normalise = pipe(trim, lower, words);
//    ^? (a: string) => string[]

// A mismatch between steps is caught at the point it happens:
// pipe(trim, words, lower)  ->  Error: string[] is not assignable to string`,
          output: `pipe: ["hello","world"]
compose: ["hello","world"]`,
          explanation:
            "The overloads are the honest cost of typed composition: TypeScript cannot infer through a variadic chain, so libraries write out the arities by hand — usually up to about twenty. It works, and the payoff is that a wrongly-ordered pipeline is a compile error rather than a runtime surprise.",
        },
      ],
    },
    {
      id: "currying",
      heading: "Currying and partial application",
      body: [
        "**Partial application** means fixing some arguments now and supplying the rest later. **Currying** is the stricter version: a function of three arguments becomes three functions of one argument each.",
        "In JavaScript the everyday form is neither — it is just a function that returns a function, written directly. That is usually clearer than a generic `curry` helper, and it types perfectly.",
      ],
      examples: [
        {
          id: "currying-example",
          title: "The generic helper, and the version you should write",
          js: `// A generic curry, for completeness.
const curry = (fn) =>
  function next(...args) {
    return args.length >= fn.length ? fn(...args) : (...rest) => next(...args, ...rest);
  };

const add3 = curry((a, b, c) => a + b + c);
console.log("curried:", add3(1)(2)(3), add3(1, 2)(3), add3(1)(2, 3), add3(1, 2, 3));

// In practice, write the shape you need. It reads better and types itself.
const prop = (key) => (obj) => obj[key];
const byField = (key) => (a, b) => String(a[key]).localeCompare(String(b[key]));

const names = users.map(prop("name"));
const sorted = [...users].sort(byField("name"));`,
          ts: `// The hand-written version keeps full inference, which the generic
// \`curry\` helper cannot: its return type has to be widened.
const prop =
  <K extends string>(key: K) =>
  <T extends Record<K, unknown>>(obj: T): T[K] =>
    obj[key];

const names = users.map(prop("name"));
//    ^? string[]   (given User["name"] is string)

// Partial application of a real dependency — the common, useful case.
const createLogger =
  (level: "info" | "warn" | "error") =>
  (message: string, meta?: Record<string, unknown>): void => {
    console[level](message, meta ?? {});
  };

const warn = createLogger("warn");
warn("cache miss", { key: "user:1" });`,
          output: `curried: 6 6 6 6`,
          explanation:
            "The generic `curry` relies on `fn.length`, which is the count of parameters **before** the first default or rest parameter — so it silently misbehaves on `(a, b = 1, c) => …`. That fragility, plus the loss of type inference, is why hand-written closures beat a curry helper in almost every real codebase.",
        },
      ],
    },
    {
      id: "point-free",
      heading: "Point-free style, and where it stops helping",
      body: [
        "Point-free means defining a function by composition without naming its argument: `const normalise = pipe(trim, lower)` rather than `const normalise = (s) => lower(trim(s))`.",
        "It is pleasant when the steps are already well-named and the data flows straight through. It becomes unreadable the moment you need to reorder arguments, thread two values, or reach for `flip` and `converge` — at which point the named-argument version is shorter *and* clearer.",
        "There is also a concrete hazard: passing a built-in directly to an iteration method that supplies more arguments than you expected.",
      ],
      examples: [
        {
          id: "point-free-hazard",
          title: "The classic map(parseInt)",
          js: `// map calls its callback with (value, index, array).
// parseInt's second parameter is the RADIX.
console.log(["1", "2", "3"].map(parseInt));
//   parseInt("1", 0) -> 1     (radix 0 means "guess")
//   parseInt("2", 1) -> NaN   (radix 1 is invalid)
//   parseInt("3", 2) -> NaN   ("3" is not a binary digit)

// Number takes exactly one argument, so it is safe.
console.log(["1", "2", "3"].map(Number));

// Or be explicit, which never surprises anyone:
console.log(["1", "2", "3"].map((s) => parseInt(s, 10)));`,
          output: `[ 1, NaN, NaN ]
[ 1, 2, 3 ]
[ 1, 2, 3 ]`,
          explanation:
            "This is the standard example, and the general lesson is broader than `parseInt`: **passing a function reference is only safe when you know its full arity.** The same class of bug appears with `arr.map(this.handler)` losing `this`, and with `promise.then(console.log)` in some engines. When in doubt, wrap it in an arrow.",
        },
      ],
      pitfalls: [
        {
          title: "Point-free is not automatically better",
          body: "`const f = compose(map(prop(\"x\")), filter(propEq(\"active\", true)))` reads worse than the four-line version with names, and it debugs far worse — a stack trace through composed anonymous functions tells you almost nothing. Use composition where it clarifies; write the loop where it does not. Nobody has ever regretted a well-named intermediate variable.",
        },
      ],
    },
    {
      id: "what-to-adopt",
      heading: "What to actually adopt",
      body: [
        "**Worth adopting almost always.** Pure functions for business logic. Immutable updates for anything shared. `map`/`filter`/`reduce` over index loops where they read better. Small named functions composed at the call site. Avoiding mutation of arguments — this one is nearly free and prevents a whole category of bug.",
        "**Worth adopting sometimes.** `pipe` when a transformation has three or more genuine stages. Partial application for injecting dependencies. Immer when nested immutable updates get deep.",
        "**Rarely worth it in a normal codebase.** Currying everything. Point-free style as a default. Monads and functors imported to solve problems JavaScript already solves — `Promise` is the async monad you already have, and optional chaining covers most of what `Maybe` is for.",
        "The honest summary: functional programming's *values* — no hidden state, no surprise mutation, small composable pieces — are worth almost unconditionally. Its *vocabulary* is worth importing only where it pays for the reader who arrives next.",
      ],
      examples: [
        {
          id: "reduce-honestly",
          title: "reduce, used well and used badly",
          js: `const people = [
  { name: "Ada", team: "eng" },
  { name: "Grace", team: "eng" },
  { name: "Alan", team: "research" },
];

// Reasonable: reduce is genuinely building one value from many.
const grouped = people.reduce((acc, person) => {
  (acc[person.team] ??= []).push(person.name);
  return acc;
}, {});

console.log("groupBy(reduce):", JSON.stringify(grouped));

// Newer runtimes have this built in — check support before relying on it.
// console.log(Object.groupBy(people, (p) => p.team));

// Unreasonable: reduce doing what filter and map already do, less clearly.
//   const names = people.reduce((acc, p) => p.team === "eng" ? [...acc, p.name] : acc, []);
// Also quadratic, because it copies the accumulator every iteration.
const names = people.filter((p) => p.team === "eng").map((p) => p.name);`,
          output: `groupBy(reduce): {"eng":["Ada","Grace"],"research":["Alan"]}`,
          explanation:
            "The commented-out reduce is a pattern worth recognising: spreading the accumulator on every iteration turns an O(n) loop into O(n²), and it is common precisely because it *looks* more functional. `Object.groupBy` is the built-in for this case, available in current browsers and Node 21 onwards.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes a function pure, and why does it matter?",
      answer:
        "Same inputs always give the same output, and calling it changes nothing outside itself — no mutated arguments, no globals, no I/O, no clock or randomness. It matters because such a function can be tested with no setup, cached, reordered and read in isolation. The practical goal is not total purity but pushing effects to the edges so the core logic is pure.",
    },
    {
      question: "Why is `{ ...obj }` not enough for an immutable update?",
      answer:
        "Spread copies one level. Nested objects and arrays are the same references as in the original, so mutating them mutates both. Every level you intend to change must be copied explicitly. `Object.freeze` has the same limitation, and in strict mode — which every module is — writing to a frozen top-level property throws rather than failing quietly.",
    },
    {
      question: "Why does `[\"1\",\"2\",\"3\"].map(parseInt)` return `[1, NaN, NaN]`?",
      answer:
        "`map` passes `(value, index, array)` and `parseInt`'s second parameter is the radix, so the calls are `parseInt(\"1\",0)`, `parseInt(\"2\",1)` and `parseInt(\"3\",2)`. Radix 0 means guess, radix 1 is invalid, and `\"3\"` is not a valid base-2 digit. `Number` takes one argument and is safe; otherwise wrap the call in an arrow.",
    },
    {
      question: "What is the difference between currying and partial application?",
      answer:
        "Partial application fixes some arguments and returns a function taking the rest, in any grouping. Currying is the strict form where an n-argument function becomes n nested one-argument functions. In JavaScript the useful version is usually neither — just a function returning a function, written by hand, which keeps full type inference that a generic `curry` helper loses.",
    },
    {
      question: "When would you avoid a functional approach?",
      answer:
        "When it costs more than it buys: point-free style that obscures intent, currying applied uniformly, or importing monadic abstractions for problems `Promise` and optional chaining already solve. Also on hot paths where copying large structures per iteration matters — the classic being a `reduce` that spreads its accumulator each pass, turning a linear loop into a quadratic one.",
    },
  ],
  takeaways: [
    "Pure functions are testable with no setup; the goal is a pure core with impurity pushed to the edges",
    "Spread, `Object.assign` and `Object.freeze` are all one level deep — nested data stays shared",
    "In a module (always strict mode), writing to a frozen property throws a `TypeError`",
    "`as const` gives a compile-time readonly type; `Object.freeze` gives the runtime guarantee",
    "`pipe` reads in execution order; typing it properly needs one overload per arity, which is what libraries do",
    "Hand-written closures beat a generic `curry` helper — they keep inference, and `fn.length` is unreliable",
    "Passing a function reference is only safe when you know its arity: `map(parseInt)` is the classic failure",
    "Adopt the values — no hidden state, no surprise mutation, small composable pieces — and import the vocabulary only where it earns its place",
  ],
  status: "available",
};
