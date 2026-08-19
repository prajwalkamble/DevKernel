import type { Lesson } from "@/content/types";

export const higherOrderFunctionsLesson: Lesson = {
  id: "functions-scope-higher-order-functions",
  slug: "higher-order-functions",
  moduleSlug: "functions-scope",
  title: "Higher-Order Functions & Composition",
  summary:
    "Functions that take or return other functions — the foundation of array methods, function composition, currying, and practical patterns like debounce, built directly on closures.",
  estimatedMinutes: 30,
  objectives: [
    "Define a higher-order function precisely",
    "Compose multiple functions together to build a data pipeline",
    "Understand currying and how it differs from partial application",
    "Implement a practical closure-based utility like debounce",
  ],
  sections: [
    {
      id: "what-is-hof",
      heading: "What makes a function 'higher-order'",
      body: [
        "A **higher-order function** is any function that does at least one of: (1) accepts another function as an argument, or (2) returns a function as its result. JavaScript treats functions as regular values (they're just objects that happen to be callable) — you already use higher-order functions constantly: `array.map(fn)`, `array.filter(fn)`, `setTimeout(fn, ms)`, and every closure factory from the earlier lessons in this module are all higher-order functions.",
        "The value of thinking in higher-order functions is **composability**: instead of writing one big function that does five things, you write five small functions and combine them, each independently testable and reusable.",
      ],
      examples: [
        {
          id: "hof-both-directions",
          title: "Taking a function in, and returning a function out",
          js: `// Takes a function as an argument
function repeat(n, action) {
  for (let i = 0; i < n; i++) action(i);
}
repeat(3, (i) => console.log("iteration", i));

// Returns a function
function multiplyBy(factor) {
  return function (n) {
    return n * factor;
  };
}
const double = multiplyBy(2);
const triple = multiplyBy(3);
console.log(double(5)); // 10
console.log(triple(5)); // 15`,
          explanation:
            "`multiplyBy` is the same closure-factory shape you saw with `makeCounter` and `createAccount` in the closures lesson — a higher-order function that returns a function is just a closure factory viewed from a different angle.",
        },
      ],
    },
    {
      id: "composition",
      heading: "Function composition",
      body: [
        "**Composition** means combining simple functions into a more complex one by feeding the output of one directly into the input of the next — the same idea as mathematical function composition (f ∘ g)(x) = f(g(x)). Rather than nesting calls manually and awkwardly, you can write a generic `compose` (or `pipe`) helper once and reuse it everywhere.",
      ],
      examples: [
        {
          id: "compose-pipe",
          title: "A reusable pipe helper for chaining transformations",
          js: `const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input);

const trim = (s) => s.trim();
const toLowerCase = (s) => s.toLowerCase();
const removeSpaces = (s) => s.replace(/\\s+/g, "-");

const slugify = pipe(trim, toLowerCase, removeSpaces);

console.log(slugify("  Hello World  ")); // "hello-world"

// Without pipe, the equivalent nested version is much harder to read:
console.log(removeSpaces(toLowerCase(trim("  Hello World  ")))); // same result, reversed order`,
          explanation:
            "`pipe` reads left-to-right in the order the transformations actually happen, which is why it's usually preferred over the mathematical convention `compose` (which reads right-to-left). Both are just `reduce` over an array of functions — `pipe` and `compose` differ only in which direction they iterate.",
        },
      ],
    },
    {
      id: "currying",
      heading: "Currying vs partial application",
      body: [
        "**Currying** transforms a function that takes multiple arguments into a sequence of functions that each take exactly **one** argument, one at a time, until all arguments have been supplied. This is a specific, stricter idea than the *partial application* you saw with `bind` in the previous lesson — partial application pre-fills *some* arguments and still accepts the rest all at once; currying always breaks the call down into single-argument steps.",
      ],
      examples: [
        {
          id: "currying-example",
          title: "A manually curried function vs a generic curry helper",
          js: `// Manually curried: each call takes exactly one argument
function add(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}
console.log(add(1)(2)(3)); // 6

// A generic curry helper using closures, for any fixed-arity function
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

function sum3(a, b, c) {
  return a + b + c;
}
const curriedSum3 = curry(sum3);

console.log(curriedSum3(1)(2)(3));   // 6 — fully step by step
console.log(curriedSum3(1, 2)(3));   // 6 — grouping arguments is fine too
console.log(curriedSum3(1, 2, 3));   // 6 — even calling it all at once works`,
          explanation:
            "`fn.length` gives the number of parameters a function declares (not counting rest/default params), which `curry` uses to know when enough arguments have been collected to actually call the original function. This generic `curry` is a real pattern used in functional-style JavaScript libraries.",
        },
      ],
    },
    {
      id: "practical-hof",
      heading: "A practical closure-based higher-order function: debounce",
      body: [
        "**Debounce** is one of the most commonly used real-world higher-order functions in frontend development: it wraps a function so that rapid, repeated calls (like every keystroke in a search box) only actually trigger the wrapped function once, after a pause in calls. It combines a closure (to remember the pending timer between calls) with returning a new function — the exact two ideas from this module, applied to a genuine production use case.",
      ],
      examples: [
        {
          id: "debounce-example",
          title: "debounce, built from a closure over a timer id",
          js: `function debounce(fn, delayMs) {
  let timeoutId; // closed over — persists between calls to the returned function

  return function debounced(...args) {
    clearTimeout(timeoutId); // cancel any pending call
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

function search(query) {
  console.log("Searching for:", query);
}

const debouncedSearch = debounce(search, 300);

// Simulating fast typing — only the LAST call within 300ms actually runs "search"
debouncedSearch("j");
debouncedSearch("ja");
debouncedSearch("jav");
debouncedSearch("java"); // only this call's "search" will actually fire, ~300ms later`,
          explanation:
            "Every call to `debouncedSearch` shares the *same* `timeoutId` variable via closure — exactly like `count` in `makeCounter` from the closures lesson. Each new call cancels the previous pending timer before starting a new one, so only the last call in a rapid burst survives long enough to fire.",
        },
      ],
    },
    {
      id: "ts-hof",
      heading: "TypeScript: typing higher-order functions with generics (a first look)",
      body: [
        "To type a function like `debounce` or `pipe` generically — one that works for *any* function signature, not just one specific one — you need TypeScript **generics**: a way to write a type that's parameterized over another type, decided per call-site. This is only an introduction; the full generics system (constraints, defaults, inference rules) is covered in depth in the Type System Deep Dive module.",
      ],
      examples: [
        {
          id: "ts-generic-debounce",
          title: "A generically-typed debounce",
          ts: `function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

function search(query: string, page: number) {
  console.log("Searching:", query, "page", page);
}

const debouncedSearch = debounce(search, 300);
debouncedSearch("typescript", 1); // OK — TypeScript infers Args as [string, number]
debouncedSearch("typescript");
// Error: Expected 2 arguments, but got 1.`,
          explanation:
            "`<Args extends unknown[]>` declares a generic type parameter representing 'whatever argument list the wrapped function takes'. TypeScript infers `Args` automatically from whichever function you pass to `debounce`, then enforces that the *returned* function is called with exactly that same argument list — you get full type safety through the wrapper with zero manual re-typing at each call site.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a higher-order function?",
      answer:
        "A function that either accepts another function as an argument, returns a function as its result, or both. Array methods like map/filter, closures factories, and wrapper utilities like debounce are all higher-order functions.",
    },
    {
      question: "What is function composition, and what's the difference between pipe and compose?",
      answer:
        "Composition combines simple functions into a pipeline where each function's output feeds the next function's input. pipe and compose do the same reduce-over-functions operation but in opposite order: pipe applies functions left-to-right (in the order written), compose applies them right-to-left (mathematical convention, f(g(x))).",
    },
    {
      question: "How does currying differ from the partial application you get with bind?",
      answer:
        "Partial application (via bind) pre-fills some arguments and still accepts the remaining ones in one call. Currying transforms a multi-argument function into a strict chain of single-argument functions, called one argument at a time — add(1)(2)(3) rather than add(1)(2, 3) or add(1, 2, 3).",
    },
    {
      question: "How does debounce use closures to work correctly across multiple calls?",
      answer:
        "debounce returns a new function that closes over a single shared timeoutId variable. Every call to the returned function clears whatever timer is currently pending (via that shared closed-over variable) and starts a new one, so only the last call in a rapid burst survives long enough to actually invoke the original function.",
    },
    {
      question: "Why does a generic higher-order function like debounce need TypeScript generics instead of concrete types?",
      answer:
        "Because debounce needs to work with any function signature, not one fixed set of parameter types. A generic type parameter (e.g. Args extends unknown[]) lets TypeScript infer the wrapped function's exact argument types per call-site and enforce that same signature on the returned wrapper function, without writing a separate debounce for every possible function shape.",
    },
  ],
  takeaways: [
    "A higher-order function takes a function as an argument, returns one, or both — array methods, closures factories, and wrappers like debounce all qualify.",
    "Composition (pipe/compose) chains simple functions into a pipeline instead of nesting calls manually.",
    "Currying breaks a function into a strict chain of single-argument calls; partial application (bind) just pre-fills some arguments while still accepting the rest together.",
    "debounce is a practical, real-world closure: a shared timer id variable, closed over by the returned function, lets rapid calls cancel each other out.",
    "TypeScript generics let you type a higher-order function once so it works correctly, with full inference, for any wrapped function's specific signature.",
  ],
  status: "available",
};
