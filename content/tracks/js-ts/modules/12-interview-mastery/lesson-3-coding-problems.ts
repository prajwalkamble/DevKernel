import type { Lesson } from "@/content/types";

export const codingProblemsLesson: Lesson = {
  id: "interview-coding-problems",
  slug: "coding-problems",
  moduleSlug: "interview-mastery",
  title: "The Coding Problems That Actually Come Up",
  summary:
    "Seven implementations that appear in JavaScript interviews far more often than any algorithm — debounce, throttle, memoise, deep equal, flatten, an event emitter and a promise pool — each with the follow-up the interviewer is heading towards.",
  estimatedMinutes: 40,
  objectives: [
    "Implement the standard utility functions from memory",
    "Handle the edge cases the follow-up question is about",
    "Type each one so the generic version is genuinely reusable",
    "Talk through a solution while writing it",
  ],
  sections: [
    {
      id: "framing",
      heading: "What these interviews are testing",
      body: [
        "Front-end interviews lean on utility implementation rather than graph algorithms, because the utilities exercise the things the job actually needs: closures, `this`, timers, promises, recursion and edge cases.",
        "**The first version is rarely the point.** Every problem here has a follow-up, and the follow-up is where the marks are — cancellation, leading edge, cache keys, cycles, concurrency limits. The pattern is to write the simple version quickly, say what it does not handle, and let the interviewer choose which gap to explore.",
        "**Narrate while you write.** \"I'll keep the timer in a closure so each debounced function has its own\" tells the interviewer more than the finished code does, and it lets them redirect you before you have written the wrong thing.",
      ],
    },
    {
      id: "debounce-throttle",
      heading: "Debounce and throttle",
      body: [
        "The most common pair, and the most commonly confused. **Debounce waits for silence; throttle samples at a fixed rate.**",
      ],
      examples: [
        {
          id: "debounce",
          title: "debounce, with cancel",
          js: `function debounce(fn, ms) {
  let timer;

  function debounced(...args) {
    clearTimeout(timer);
    // A normal function, not an arrow, so \`this\` comes from the call site
    // and can be forwarded — otherwise a debounced method loses its object.
    timer = setTimeout(() => fn.apply(this, args), ms);
  }

  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

let calls = 0;
const d = debounce(() => calls++, 20);
d(); d(); d();
await new Promise((r) => setTimeout(r, 50));
console.log("debounce calls:", calls);`,
          ts: `function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };

  return Object.assign(debounced, {
    cancel: () => clearTimeout(timer),
  });
}`,
          output: `debounce calls: 1`,
          explanation:
            "`ReturnType<typeof setTimeout>` rather than `number` is deliberate — in Node it is a `Timeout` object, in the browser a number, and hardcoding either breaks the other. The `this` forwarding matters in the JavaScript version and disappears in the TypeScript one because arrows cannot forward it; if a debounced *method* is required, use a normal function there too.",
        },
        {
          id: "throttle",
          title: "throttle, leading edge",
          js: `function throttle(fn, ms) {
  let last = 0;

  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

let t = 0;
const th = throttle(() => t++, 30);
th(); th(); th();               // only the first runs
await new Promise((r) => setTimeout(r, 40));
th();                           // the window has passed
console.log("throttle calls:", t);`,
          output: `throttle calls: 2`,
          explanation:
            "**The follow-ups, in the order they usually arrive.** \"What about the trailing call?\" — this version drops the final event, so a scroll that stops mid-window never fires a last update; the fix is to store the latest args and schedule a timeout. \"Leading or trailing edge?\" — most libraries offer both as options. \"What is the difference from debounce?\" — debounce resets its timer on every call and fires once after silence; throttle ignores calls inside the window and fires at a steady rate.",
        },
      ],
    },
    {
      id: "memoize",
      heading: "Memoise",
      examples: [
        {
          id: "memoize",
          title: "The simple version, and what it cannot do",
          js: `function memoize(fn) {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
}

let computed = 0;
const square = memoize((n) => { computed++; return n * n; });
square(4); square(4); square(5);
console.log("memoize computed:", computed);`,
          output: `memoize computed: 2`,
          explanation:
            "**The follow-up is always the cache key.** `JSON.stringify` fails on functions, symbols, `undefined` and circular references, and it makes `{a:1,b:2}` and `{b:2,a:1}` different keys. For a single object argument, a `WeakMap` keyed by the object itself is better — no serialisation, and entries are collected when the argument is. The other follow-up is unbounded growth: a memoised function on user input is a memory leak, which is what an LRU with a size cap fixes.",
        },
      ],
      pitfalls: [
        {
          title: "`cache.has` rather than a truthiness check",
          body: "`if (!cache.get(key))` recomputes every time the cached value is `0`, `\"\"`, `null` or `false` — a bug that only shows up for falsy results and therefore survives casual testing. Use `has`, or a sentinel.",
        },
      ],
    },
    {
      id: "deep-equal",
      heading: "Deep equality",
      examples: [
        {
          id: "deep-equal",
          title: "A version that handles the usual cases",
          js: `function deepEqual(a, b) {
  // Object.is gets NaN === NaN right, and distinguishes 0 from -0.
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
}

console.log(
  "deepEqual:",
  deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }),
  deepEqual({ a: 1 }, { a: 1, b: 2 }),
  deepEqual(NaN, NaN)
);`,
          output: `deepEqual: true false true`,
          explanation:
            "`Object.is` at the top does two jobs: it short-circuits identical references, and it makes `NaN` equal to itself, which `===` would not. **The follow-ups:** cycles (this recurses forever — track visited pairs in a `WeakMap`), `Date` and `RegExp` (compared as objects with no own keys, so any two dates are equal), `Map` and `Set` (same problem), and prototypes (a class instance equals a plain object with the same fields). Naming those unprompted is the answer they are looking for.",
        },
      ],
    },
    {
      id: "flatten",
      heading: "Flatten",
      examples: [
        {
          id: "flatten",
          title: "With a depth limit",
          js: `const flatten = (arr, depth = Infinity) =>
  depth < 1
    ? arr.slice()
    : arr.reduce(
        (acc, value) => acc.concat(Array.isArray(value) ? flatten(value, depth - 1) : value),
        []
      );

console.log("flatten:", flatten([1, [2, [3, [4]]]]), flatten([1, [2, [3, [4]]]], 1));`,
          output: `flatten: [ 1, 2, 3, 4 ] [ 1, 2, [ 3, [ 4 ] ] ]`,
          explanation:
            "The real answer in production is `arr.flat(depth)`, which has existed since ES2019 — say so, then write it by hand because that is what was asked. **The follow-up is usually recursion depth:** this blows the stack somewhere around ten thousand levels of nesting, and the iterative version uses an explicit stack. The second follow-up is performance: `concat` allocates a new array per element, so pushing into one accumulator is significantly faster for large inputs.",
        },
      ],
    },
    {
      id: "emitter",
      heading: "An event emitter",
      examples: [
        {
          id: "emitter",
          title: "With unsubscribe returned from `on`",
          js: `class Emitter {
  #listeners = new Map();

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    // Returning the unsubscribe function is the detail interviewers look for.
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.#listeners.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    // Copy before iterating: a listener that unsubscribes during emit
    // would otherwise mutate the set being iterated.
    for (const fn of [...(this.#listeners.get(event) ?? [])]) fn(...args);
  }
}

const em = new Emitter();
const seen = [];
const unsubscribe = em.on("x", (v) => seen.push(v));
em.emit("x", 1);
unsubscribe();
em.emit("x", 2);
console.log("emitter:", seen);`,
          ts: `type Listener<A extends unknown[]> = (...args: A) => void;

class Emitter<Events extends Record<string, unknown[]>> {
  #listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event)!.add(fn as Listener<never>);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    this.#listeners.get(event)?.delete(fn as Listener<never>);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    for (const fn of [...(this.#listeners.get(event) ?? [])]) {
      (fn as Listener<Events[K]>)(...args);
    }
  }
}

// Event names and payloads are both checked:
const bus = new Emitter<{ "cart:add": [sku: string, qty: number] }>();
bus.on("cart:add", (sku, qty) => console.log(sku, qty));`,
          output: `emitter: [ 1 ]`,
          explanation:
            "Three details score here. A `Set` rather than an array, so adding the same listener twice does not double-fire and removal is O(1). Returning an unsubscribe function, which is what every modern API does because it cannot be called with the wrong arguments. And copying before iterating — a listener that removes itself during `emit` mutates the collection being iterated, which is a genuine bug in a surprising number of hand-rolled emitters.",
        },
      ],
    },
    {
      id: "promise-pool",
      heading: "A concurrency-limited promise pool",
      body: [
        "The hardest of the seven, and the one that most clearly separates people who have used promises from people who have read about them.",
      ],
      examples: [
        {
          id: "pool",
          title: "N workers pulling from a shared index",
          js: `async function pool(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    // Each worker takes the next index and runs it, until none are left.
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );

  return results;
}

let concurrent = 0;
let peak = 0;
const tasks = Array.from({ length: 6 }, (_, i) => async () => {
  concurrent++;
  peak = Math.max(peak, concurrent);
  await new Promise((r) => setTimeout(r, 10));
  concurrent--;
  return i * 2;
});

console.log("pool results:", await pool(tasks, 2), "| peak concurrency:", peak);`,
          output: `pool results: [ 0, 2, 4, 6, 8, 10 ] | peak concurrency: 2`,
          explanation:
            "Two things to notice in that output. **The peak concurrency is 2**, so the limit genuinely held across six tasks. And **the results are in index order** even though the tasks completed in whatever order they finished — because each worker writes to `results[i]` rather than pushing, which is the detail that makes the return value usable. Pushing instead would give you the results in completion order, which is almost never what the caller wants.",
        },
      ],
      pitfalls: [
        {
          title: "Tasks must be functions, not promises",
          body: "`pool([fetch(a), fetch(b)], 2)` limits nothing — the promises started the moment the array was built. The pool takes an array of *functions returning promises* so it controls when each one begins. This is the single most common mistake in this problem, and spotting it unprompted is worth more than a perfect implementation.",
        },
      ],
    },
    {
      id: "approach",
      heading: "Working through a problem out loud",
      body: [
        "A structure that works under time pressure, and reads well to an interviewer.",
        "**Clarify first, briefly.** \"Should the debounced function be cancellable? Do I need the trailing edge?\" Two questions, not ten — this shows you think about requirements without stalling.",
        "**State the approach before writing.** \"I'll hold the timer in a closure so each returned function has its own.\" If it is wrong, you find out in ten seconds rather than after ten minutes of typing.",
        "**Write the simple version.** Working and readable beats clever and half-finished. Silence while you type is fine; narrate the decisions, not every keystroke.",
        "**Then name the gaps yourself.** \"This drops the trailing call, and it uses `JSON.stringify` for the cache key which breaks on circular data — want me to fix either?\" This is the highest-value thirty seconds in the whole exercise. It demonstrates that you know what production code needs, and it lets you choose the follow-up rather than being caught by it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between debounce and throttle?",
      answer:
        "Debounce waits for a quiet period — every call resets the timer, and the function runs once after activity stops. Throttle runs at most once per interval regardless of how many calls arrive. Debounce suits search-as-you-type and autosave; throttle suits scroll and resize handlers where you want steady updates rather than one at the end. Both limit call rate, which is why they get confused.",
    },
    {
      question: "Why does a debounce implementation use a normal function rather than an arrow?",
      answer:
        "So `this` can be forwarded. A normal function receives `this` from its call site, and `fn.apply(this, args)` passes it through — which matters when the debounced function is a method. An arrow has no `this` of its own, so a debounced method would lose its receiver. If the utility is only ever used with standalone functions it makes no difference.",
    },
    {
      question: "What is wrong with `JSON.stringify(args)` as a memoisation key?",
      answer:
        "It cannot represent functions, symbols or `undefined`, it throws on circular references, and it is order-sensitive — `{a:1,b:2}` and `{b:2,a:1}` produce different keys for equal objects. For a single object argument a `WeakMap` keyed by the object is better, since it needs no serialisation and lets entries be collected. Also worth raising unprompted: an unbounded cache on user input is a memory leak, so real implementations cap it.",
    },
    {
      question: "What does a naive deep-equal implementation miss?",
      answer:
        "Circular references, which cause infinite recursion — track visited pairs in a `WeakMap`. `Date` and `RegExp`, which have no own enumerable keys so any two compare equal. `Map` and `Set`, for the same reason. And prototypes, so a class instance equals a plain object with identical fields. Naming these before being asked is the point of the question.",
    },
    {
      question: "How would you limit concurrency when running many async tasks?",
      answer:
        "Start N workers that each pull the next index from a shared counter and await that task, then `Promise.all` the workers. The critical detail is that the input must be an array of *functions* returning promises rather than promises — an array of promises has already started, so nothing is limited. Results are written by index so order is preserved regardless of completion order.",
    },
  ],
  takeaways: [
    "Front-end interviews favour utility implementation because it exercises closures, `this`, timers and promises",
    "Write the simple version, then name its gaps yourself — that is where the marks are",
    "Use `ReturnType<typeof setTimeout>` rather than `number` for timer handles",
    "`cache.has(key)`, not a truthiness check, or falsy results are recomputed forever",
    "`Object.is` at the top of deepEqual handles NaN and identical references in one line",
    "An emitter should use a Set, return an unsubscribe function, and copy before iterating",
    "A promise pool must take functions returning promises — an array of promises has already started",
    "Clarify briefly, state the approach, write it simply, then volunteer what it does not handle",
  ],
  status: "available",
};
