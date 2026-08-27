import type { Lesson } from "@/content/types";

export const useMemoUseCallbackLesson: Lesson = {
  id: "react-usememo-usecallback",
  slug: "usememo-and-usecallback",
  moduleSlug: "rendering-and-performance",
  title: "useMemo and useCallback: What They Cost and When They Pay",
  summary:
    "Both cache a value between renders, and both add work to every render to do it. Counted: what a memo does when its dependency is stable, and what it does when the dependency is an object literal.",
  estimatedMinutes: 28,
  objectives: [
    "State what useMemo and useCallback each cache",
    "Count the work a memo adds per render",
    "Name the two reasons to memoise, and the one that is usually the real one",
    "Recognise a memo that can never hit",
    "Decide when the memoisation is not worth it",
  ],
  sections: [
    {
      id: "what-they-are",
      heading: "What they are",
      body: [
        "`useMemo(fn, deps)` runs `fn` and caches the result. On the next render it compares each dependency with `Object.is`; if all match, it returns the cached value without running `fn`.",
        "`useCallback(fn, deps)` is the same thing for a function. `useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)` — it exists because caching a function is common enough to deserve its own name, and the arrow-returning-an-arrow reads badly.",
        "Both are **caches**, and every cache has three costs: storing the value, storing the key, and checking the key. React pays all three on every render, for every memo you write.",
      ],
    },
    {
      id: "counted",
      heading: "The cost, counted",
      body: [
        "Timings vary by machine; operation counts do not. This is what one `useMemo` does over a hundred renders, with a stable dependency and then with an unstable one.",
      ],
      examples: [
        {
          id: "memo-work",
          title: "What a memo does per render",
          lang: "tsx",
          code: `/* What a useMemo actually does per render, counted rather than timed.
   Timings vary by machine; the operation count does not. */

let comparisons = 0;
let computations = 0;
let allocations = 0;

/* Close to what React does for one useMemo call: hold the previous deps,
   compare each one with Object.is, recompute when any differs. */
function makeMemo<T>(compute: () => T) {
  let deps: unknown[] | null = null;
  let value: T;
  return (next: unknown[]) => {
    if (deps !== null && deps.length === next.length
        && next.every((d, i) => (comparisons++, Object.is(deps![i], d)))) {
      return value;
    }
    deps = next;
    computations++;
    value = compute();
    return value;
  };
}

const memoised = makeMemo(() => (computations, [1, 2, 3]));

console.log("case A — the dependency is stable across 100 renders:");
for (let i = 0; i < 100; i++) { allocations++; memoised([42]); }
console.log(\`  \${comparisons} comparisons, \${computations} computation(s), \${allocations} dep arrays allocated\`);
console.log("  the memo did its job: 99 computations saved.");

comparisons = 0; computations = 0; allocations = 0;
const unstable = makeMemo(() => [1, 2, 3]);
console.log("\\ncase B — the dependency is an object literal, so it is new each render:");
for (let i = 0; i < 100; i++) { allocations++; unstable([{ id: 42 }]); }
console.log(\`  \${comparisons} comparisons, \${computations} computation(s), \${allocations} dep arrays allocated\`);
console.log("  the memo did nothing but add work: every render recomputed anyway.");`,
          output: `case A — the dependency is stable across 100 renders:
  99 comparisons, 1 computation(s), 100 dep arrays allocated
  the memo did its job: 99 computations saved.

case B — the dependency is an object literal, so it is new each render:
  99 comparisons, 100 computation(s), 100 dep arrays allocated
  the memo did nothing but add work: every render recomputed anyway.`,
          explanation:
            "The number that does not change between the two cases is **100 dependency arrays allocated**. That array is written in your JSX and built on every render whether the memo hits or not — so a memo always costs an allocation and a comparison per dependency, and only sometimes saves anything.",
        },
      ],
      pitfalls: [
        {
          title: "Case B is not rare",
          body: "`useMemo(() => filter(rows, opts), [rows, opts])` where `opts` is an object literal in the same component body is exactly case B. The memo never hits, it recomputes every render, and it costs the comparison on top. If a memo's dependency list contains anything built during render, check it before trusting it.",
        },
      ],
    },
    {
      id: "two-reasons",
      heading: "The two reasons to memoise",
      body: [
        "**To avoid an expensive computation.** Genuinely expensive, and measured. Sorting ten thousand rows, running a parser, building a large index. This is the reason `useMemo` is named for, and it is the less common one.",
        "**To keep a value's identity stable**, so that something downstream can compare it: a memoised child's props, a dependency array of an effect, a context's value. This is the reason most memos actually exist, and the one worth being explicit about — because it means **the memo is not for this component, it is for something else**, and it should be deleted when that something else goes away.",
        "The second reason is why `useCallback` exists at all. A function's cost is not in creating it; creating a closure is trivial. It is that a new function is a new identity, and a new identity breaks every comparison downstream.",
      ],
      examples: [
        {
          id: "two-reasons-code",
          title: "The two reasons, side by side",
          lang: "tsx",
          code: `function Report({ rows, from, to }: Props) {
  // Reason 1: this genuinely costs something. 10k rows, sorted and grouped.
  // The memo is for *this component*, and it pays for itself on any render
  // where \`rows\` did not change.
  const summary = useMemo(
    () => groupByMonth(rows.filter((r) => r.date >= from && r.date <= to)),
    [rows, from, to],
  );

  // Reason 2: this costs nothing to create. The memo exists so that
  // <Chart> — which is memo()'d — can skip. Delete the memo() on Chart and
  // this useCallback becomes pure overhead.
  const onSelect = useCallback((id: string) => track("select", id), []);

  return (
    <>
      <Totals summary={summary} />
      <Chart summary={summary} onSelect={onSelect} />
    </>
  );
}`,
          explanation:
            "Write a comment saying which reason it is. A memo with no downstream consumer and no expensive computation is a memo that somebody added out of habit, and without the comment nobody can tell that from one holding a memo boundary together.",
        },
      ],
      pitfalls: [
        {
          title: "Half a stabilisation is none",
          body: "`<Chart summary={summary} onSelect={onSelect} style={{ height: 300 }} />` — the memo and the callback are both stable and the inline `style` is not, so `Chart` re-renders anyway and both memos are wasted. Stabilising props is all-or-nothing per boundary, which is a large part of why the React Compiler exists.",
        },
      ],
    },
    {
      id: "not-worth",
      heading: "When it is not worth it",
      body: [
        "**When the computation is cheap.** `useMemo(() => a + b, [a, b])` costs more than `a + b`. So does `useMemo(() => items.length, [items])`. The threshold is higher than instinct suggests: modern JavaScript engines do a great deal in a microsecond.",
        "**When nothing downstream compares.** A `useCallback` passed to a plain `<button onClick>` stabilises an identity nothing looks at. DOM event handlers are not compared; React updates the listener either way.",
        "**When the dependency is unstable.** Case B. The memo cannot hit, and you have added a comparison to a computation that runs anyway.",
        "**When the memo hides the real fix.** A `useMemo` over an expensive derivation of props is sometimes the derivation living in the wrong component — move it up to where the data is, or into the query's `select`, and it runs once for everyone instead of once per consumer.",
        "**When it makes the code meaningfully harder to read.** A ten-line body wrapped in a memo whose dependency array is six items long is a maintenance liability for a saving you have not measured.",
      ],
      pitfalls: [
        {
          title: "`useMemo` is a hint, not a guarantee",
          body: "React documents that it may throw a cached value away — for instance to free memory for an offscreen component. So a memo must never be the only thing keeping a value correct: no `useMemo` for an id you rely on being stable (that is `useId` or `useRef`), and no side effect inside the compute function. It caches; it does not promise.",
        },
        {
          title: "It is not a substitute for measuring",
          body: "\"It might be slow\" is not a reason. Profile the interaction, find the component that is actually taking time, then memoise that. Memoising on suspicion produces a codebase where every value is wrapped and nobody can tell which wrapper is load-bearing.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between useMemo and useCallback?",
      answer:
        "`useMemo` caches the result of calling a function; `useCallback` caches the function itself. `useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)` — it exists because caching a function is common and the arrow-returning-an-arrow reads badly. Both compare dependencies with `Object.is` and both cost an allocation for the dependency array plus one comparison per dependency, on every render.",
    },
    {
      question: "Why would you memoise a function that is cheap to create?",
      answer:
        "Not for the cost of creating it — that is negligible — but for its identity. A new function is a new value, so it breaks a memoised child's prop comparison, re-triggers an effect that depends on it, and changes a context value. The memo is not for the component that writes it; it is for something downstream, and it should be deleted when that something goes away. That is worth a comment, because otherwise nobody can tell a load-bearing memo from a habitual one.",
    },
    {
      question: "When is useMemo not worth it?",
      answer:
        "When the computation is cheap — the threshold is higher than instinct suggests. When nothing downstream compares the value, such as a `useCallback` handed to a plain DOM `onClick`. When a dependency is itself unstable, so the memo can never hit and only adds a comparison. And when it hides the real fix, such as a derivation that should have happened where the data lives rather than once per consumer.",
    },
    {
      question: "Is useMemo guaranteed to cache?",
      answer:
        "No — React documents it as a hint and may discard the cached value, for example to free memory for an offscreen component. So it must never be load-bearing for correctness: no side effects in the compute function, and never use it to produce a value that has to stay stable, such as an id — that is `useId` or a ref.",
    },
  ],
  takeaways: [
    "Both are caches, and every cache costs storage, a key, and a check on every render",
    "The dependency array is allocated on every render whether the memo hits or not",
    "`useCallback(fn, deps)` is `useMemo(() => fn, deps)`",
    "Two reasons: an expensive computation, or a stable identity for something downstream",
    "The identity reason means the memo belongs to its consumer — say so in a comment",
    "One unstable prop wastes every other memo at the same boundary",
    "An unstable dependency makes a memo that can never hit",
    "`useMemo` is a hint — React may discard the value, so nothing may depend on it for correctness",
  ],
  status: "available",
};
