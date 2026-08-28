import type { Lesson } from "@/content/types";

export const referentialEqualityLesson: Lesson = {
  id: "react-referential-equality",
  slug: "referential-equality",
  moduleSlug: "rendering-and-performance",
  title: "Referential Equality: One Rule, Four Places",
  summary:
    "`Object.is` decides memo comparisons, dependency arrays, provider values and store selectors. One rule, printed, with the two cases where it disagrees with `===` — and the five ways to give a value a stable identity.",
  estimatedMinutes: 25,
  objectives: [
    "State the rule and the four places React applies it",
    "Predict which values survive a second render unchanged",
    "Name the two cases where Object.is differs from ===",
    "Choose between the five ways to stabilise an identity",
    "Diagnose an effect that fires on every render",
  ],
  sections: [
    {
      id: "the-rule",
      heading: "One rule, four places",
      body: [
        "React compares values with `Object.is` and nothing else. There is no deep comparison anywhere in React, ever.",
        "The four places, all of which you have now met:",
        "**`memo`**, comparing each prop with the previous render's.",
        "**Dependency arrays** — `useEffect`, `useMemo`, `useCallback`, `useLayoutEffect`.",
        "**Context provider values**, deciding whether consumers re-render.",
        "**Store selectors**, deciding whether a subscriber re-renders.",
        "Learn the rule once and all four stop being separate topics. Every \"why does this keep re-rendering / re-firing / recomputing?\" question is the same question.",
      ],
      visual: {
        id: "prop-comparison-visual",
        kind: "react-rendering",
        algorithm: "prop-comparison",
        title: "Five props, compared one at a time",
      },
      examples: [
        {
          id: "object-is-printed",
          title: "The same source, evaluated twice",
          lang: "tsx",
          code: `/* Everything React compares — props for memo, dependency arrays, provider
   values, store selectors — goes through Object.is. One rule, four places. */

const render1 = () => ({
  title: "Orders",
  count: 3,
  rows: [1, 2],
  filters: { open: true },
  onPick: (id: string) => id,
  nothing: null,
  missing: undefined,
  notANumber: NaN,
});
const a = render1();
const b = render1();   // exactly as a second render would produce them

const keys = Object.keys(a) as (keyof typeof a)[];
const width = Math.max(...keys.map((k) => k.length));
console.log("the same source, evaluated twice:");
for (const key of keys) {
  const same = Object.is(a[key], b[key]);
  console.log(\`  \${key.padEnd(width)}  Object.is -> \${same}\`);
}

console.log("\\nwhere Object.is differs from ===:");
console.log(\`  NaN === NaN            -> \${NaN === NaN}\`);
console.log(\`  Object.is(NaN, NaN)    -> \${Object.is(NaN, NaN)}\`);
console.log(\`  0 === -0               -> \${0 === -0}\`);
console.log(\`  Object.is(0, -0)       -> \${Object.is(0, -0)}\`);

console.log("\\nlooking identical is not being identical:");
const x = { id: 1 };
const y = { id: 1 };
console.log(\`  JSON.stringify(x) === JSON.stringify(y) -> \${JSON.stringify(x) === JSON.stringify(y)}\`);
console.log(\`  Object.is(x, y)                         -> \${Object.is(x, y)}\`);
console.log(\`  Object.is(x, x)                         -> \${Object.is(x, x)}\`);`,
          output: `the same source, evaluated twice:
  title       Object.is -> true
  count       Object.is -> true
  rows        Object.is -> false
  filters     Object.is -> false
  onPick      Object.is -> false
  nothing     Object.is -> true
  missing     Object.is -> true
  notANumber  Object.is -> true

where Object.is differs from ===:
  NaN === NaN            -> false
  Object.is(NaN, NaN)    -> true
  0 === -0               -> true
  Object.is(0, -0)       -> false

looking identical is not being identical:
  JSON.stringify(x) === JSON.stringify(y) -> true
  Object.is(x, y)                         -> false
  Object.is(x, x)                         -> true`,
          explanation:
            "Three of eight fail, and they are the three you write without thinking: an array literal, an object literal, an arrow function. `null` and `undefined` pass because there is only one of each. `NaN` passes because `Object.is` was designed to fix that — which is the practical difference from `===`, and the reason a `NaN` in a dependency array does not fire an effect forever.",
        },
      ],
      pitfalls: [
        {
          title: "The `-0` case is real, if rare",
          body: "`Object.is(0, -0)` is `false`, so a value that flips between `0` and `-0` looks like a change to React. It happens with arithmetic that can produce a negative zero — `Math.round(-0.2)` is `-0` — and shows up as a component that re-renders on a value that reads as `0` in the debugger. `value + 0` normalises it.",
        },
      ],
    },
    {
      id: "why-it-must-be",
      heading: "Why React does not compare deeply",
      body: [
        "It is a fair question, and the answer is not that it would be slow — although for a large object it would be.",
        "**It cannot be correct.** A deep comparison has to decide what counts as equal for functions, `Map`s, class instances, `Date`s, cyclic references and getters that have side effects. Every answer is wrong for somebody, and a wrong \"equal\" means a component that never updates.",
        "**It would be unpredictable.** The cost of a comparison would depend on the size of the data, so a component that was fast with ten rows becomes slow with ten thousand for reasons nothing in the code shows.",
        "**Shallow-by-identity is a rule you can hold in your head.** \"Did somebody build a new object?\" is a question you can answer by reading the source. \"Are these two structures deeply equal?\" is not.",
        "So React's comparison is fast and predictable, and it makes **identity a thing you have to manage**. That is the trade, and the next section is the tools for the managing.",
      ],
    },
    {
      id: "five-ways",
      heading: "Five ways to give a value a stable identity",
      body: [
        "In order of preference — the earlier ones are simpler and cannot go stale.",
        "**1. Move it out of the component.** A value that does not depend on props or state is a module-level constant. Zero cost, zero hooks, permanently stable. This is the fix for `const EMPTY: Item[] = []` and `const noop = () => {}`, and it is skipped astonishingly often.",
        "**2. Do not create it.** Pass primitives instead of objects: `<Row id={row.id} name={row.name} />` rather than `<Row data={{ id, name }} />`. Two stable props beat one unstable one.",
        "**3. `useMemo` / `useCallback`.** For values that genuinely depend on props or state. The dependency array is now yours to keep correct.",
        "**4. `useRef`.** For a mutable box whose identity never changes at all. Right for something that must survive renders without causing them; wrong for anything read during render, because changing it does not re-render.",
        "**5. Let something else own it.** A value from a query cache, a store, or a parent that memoised it, is stable because its owner made it so. Often the best answer: instead of stabilising an object in five components, derive it once where the data lives.",
      ],
      examples: [
        {
          id: "stabilising",
          title: "The default-value trap",
          lang: "tsx",
          code: `// Broken in the most innocent-looking way. \`items ?? []\` builds a new
// empty array on every render where \`items\` is undefined, so the effect
// fires on every render and the memoised child never skips.
function List({ items }: { items?: Item[] }) {
  const rows = items ?? [];
  useEffect(() => { report(rows.length); }, [rows]);
  return <Rows rows={rows} />;
}

// Fixed by rule 1: one empty array, for the life of the module.
const EMPTY: Item[] = [];

function List({ items }: { items?: Item[] }) {
  const rows = items ?? EMPTY;
  useEffect(() => { report(rows.length); }, [rows]);
  return <Rows rows={rows} />;
}`,
          explanation:
            "A default parameter has the same problem: `function List({ items = [] })` creates a new array on every call. This is the single most common cause of an effect that fires on every render, and it is invisible unless you are looking for it — the code reads as a default, not as an allocation.",
        },
      ],
      pitfalls: [
        {
          title: "Diagnosing an effect that fires on every render",
          body: "Log each dependency's identity across two renders and find the one that changed. Nine times in ten it is a default `[]` or `{}`, an inline object, or a function prop the parent did not stabilise. The linter cannot see this: `exhaustive-deps` checks that the array *matches what the effect reads*, and an unstable dependency matches perfectly.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does React decide whether a value changed?",
      answer:
        "`Object.is`, everywhere — memo's prop comparison, every dependency array, context provider values and store selectors. There is no deep comparison anywhere in React. So a primitive with the same value is unchanged, and an object, array or function built during render is always a new value however identical its contents look.",
    },
    {
      question: "Why doesn't React compare deeply?",
      answer:
        "Because it could not be correct and could not be predictable. A deep comparison has to take a position on functions, Maps, class instances, Dates and cycles, and every position is wrong for somebody — and a wrong \"equal\" is a component that never updates. It would also make comparison cost scale with data size, so a component would get slower with more rows for reasons invisible in the code. Identity is fast, predictable, and something you can reason about by reading the source.",
    },
    {
      question: "How do you make a value's identity stable?",
      answer:
        "In order: move it out of the component if it depends on nothing, since a module constant is free and cannot go stale; avoid creating it at all by passing primitives; `useMemo`/`useCallback` when it genuinely depends on props or state; `useRef` for a box that must never change identity; or let a store or query cache own it, so it is derived once rather than stabilised in five places.",
    },
    {
      question: "An effect fires on every render. How do you find out why?",
      answer:
        "One dependency has a new identity each render. Log each one across two renders and find the one that changed — it is almost always a default `[]` or `{}`, an inline object, or an unstabilised function prop. The lint rule will not help: `exhaustive-deps` checks the array against what the effect reads, and an unstable dependency matches it perfectly.",
    },
  ],
  takeaways: [
    "`Object.is` decides everything: memo, dependency arrays, provider values, store selectors",
    "React never compares deeply, anywhere",
    "Objects, arrays and functions built during render are always new values",
    "`Object.is` differs from `===` on `NaN` (equal) and on `0`/`-0` (not equal)",
    "Deep comparison could not be correct or predictable — identity is the trade",
    "Stabilise by: hoisting out, not creating, `useMemo`, `useRef`, or letting an owner do it",
    "A default `[]` or `{}` is a new value every render — the most common cause of a looping effect",
    "`exhaustive-deps` cannot catch an unstable dependency: it matches the array perfectly",
  ],
  status: "available",
};
