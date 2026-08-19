import type { Lesson } from "@/content/types";

export const callbacksLesson: Lesson = {
  id: "async-callbacks",
  slug: "callbacks-and-callback-hell",
  moduleSlug: "async",
  title: "Callbacks & Callback Hell",
  summary:
    "Why a single-threaded language needs asynchrony at all, how callbacks were the original answer, and the four concrete problems with them that motivated every feature in the rest of this module.",
  estimatedMinutes: 25,
  objectives: [
    "Explain how single-threaded JavaScript does several things at once",
    "Tell a synchronous callback apart from an asynchronous one",
    "Read and write the error-first callback convention",
    "Name the specific problems with nested callbacks that Promises were designed to fix",
  ],
  sections: [
    {
      id: "why-async-exists",
      heading: "Why a single-threaded language needs asynchrony",
      body: [
        "JavaScript runs your code on **one thread**, with **one call stack**. Only one thing happens at a time, and a function runs to completion before anything else gets a turn. That sounds like a crippling limitation for a language whose main job involves waiting on networks, timers, files, and human beings — all of which are thousands of times slower than the CPU.",
        "The resolution is that JavaScript itself never does the waiting. Slow work is handed off to the **host environment** (the browser, or Node.js), which handles it outside your thread — often on real, separate threads written in C++ — and hands you back the result later by calling a function you supplied. That function is a **callback**: not a special language feature, just an ordinary function you pass to someone else so they can call it back when they're ready.",
      ],
      examples: [
        {
          id: "blocking-vs-async-example",
          title: "The difference between waiting and scheduling",
          js: `// Blocking: this occupies the one and only thread for a full second.
// Nothing else in the entire program can run — not a click, not a render.
function blockFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy-waiting: burning CPU doing absolutely nothing useful
  }
}

console.log("A: start");
blockFor(300);
console.log("B: after blocking — 300ms of the program was frozen");

// Non-blocking: hand the waiting to the host, get called back afterwards.
console.log("C: scheduling");
setTimeout(() => {
  console.log("E: the callback ran later");
}, 300);
console.log("D: not waiting — this runs immediately");

// Output order: A, B, C, D, E`,
          output: "A: start / B: after blocking / C: scheduling / D: not waiting / E: the callback ran later",
          explanation:
            "`setTimeout` does not pause anything. It registers your function with the host and returns **immediately**, which is why `D` prints before `E` even though `E` appears earlier in the source. The 300ms wait still happens — it just happens somewhere that isn't your thread, leaving JavaScript free to keep running.",
        },
      ],
    },
    {
      id: "callbacks-as-values",
      heading: "Synchronous callbacks vs asynchronous callbacks",
      body: [
        "Module 2's higher-order functions lesson established the mechanism: functions are values, so a function can take another function as an argument. A callback is exactly that. But there are two very different kinds of callback, and confusing them is the source of an enormous amount of beginner (and non-beginner) frustration.",
        "A **synchronous callback** is invoked immediately, during the call you passed it to — `array.map(fn)` calls `fn` once per element and is completely finished by the time `map` returns. An **asynchronous callback** is merely *registered*; the function you passed it to returns straight away, and your callback is invoked at some later point, after the current code has finished running. The two look identical at the call site; only knowing the API tells you which you're dealing with.",
      ],
      examples: [
        {
          id: "sync-vs-async-callback-example",
          title: "Identical shape, completely different timing",
          js: `const numbers = [1, 2, 3];

// SYNCHRONOUS callback — map calls it three times before moving on
const doubled = numbers.map((n) => {
  console.log("mapping", n);
  return n * 2;
});
console.log("map finished:", doubled); // already has its result

// ASYNCHRONOUS callback — setTimeout registers it and returns instantly
let result = "not set yet";
setTimeout(() => {
  result = "computed!";
  console.log("inside the callback:", result);
}, 0);
console.log("after setTimeout:", result); // "not set yet" — the callback hasn't run

// The classic mistake: trying to return a value out of an async callback
function getValue() {
  setTimeout(() => {
    return 42; // returns from the ARROW FUNCTION, not from getValue
  }, 0);
  // getValue has already returned by now, with nothing
}
console.log(getValue()); // undefined — and no amount of rewriting fixes this`,
          explanation:
            "The last example is the wall every JavaScript developer hits: **you cannot return an asynchronous result**. By the time the value exists, the function that would have returned it finished long ago. Before Promises, the only way out was to pass in a callback and hand the value to it instead of returning — which is exactly what forces the nesting we're about to see.",
        },
      ],
      pitfalls: [
        {
          title: "Even a 0ms timeout never runs immediately",
          body: "`setTimeout(fn, 0)` does not mean 'run now'. The callback cannot run until the currently executing code has completely finished and the call stack is empty — a rule called run-to-completion. The delay you pass is a minimum, not a promise. The event loop lesson later in this module explains precisely why, and how long 'later' really is.",
        },
      ],
    },
    {
      id: "error-first-convention",
      heading: "The error-first callback convention",
      body: [
        "Asynchronous work fails: networks drop, files go missing, databases time out. But a `throw` inside an asynchronous callback is useless to the caller — the caller's stack frame, and any `try`/`catch` around it, disappeared long before the callback ran. Node.js therefore standardised a convention: an async callback receives the error as its **first** parameter, and the result as the second. Exactly one of the two is ever meaningful.",
        "Every callback body then begins the same way — check `err` first, bail out early, and only then trust the result. It's repetitive by design, and that repetition is precisely what becomes painful once operations start nesting.",
      ],
      examples: [
        {
          id: "error-first-example",
          title: "Passing errors sideways instead of throwing them",
          js: `// A fake database lookup — setTimeout stands in for real I/O
function findUser(id, callback) {
  setTimeout(() => {
    if (id <= 0) {
      callback(new Error("Invalid user id: " + id)); // error first, no result
      return;                                        // ALWAYS return after calling back
    }
    callback(null, { id, name: "Ada" }); // null error, then the result
  }, 100);
}

findUser(1, (err, user) => {
  if (err) {
    console.error("Failed:", err.message);
    return;
  }
  console.log("Found:", user.name); // "Found: Ada"
});

findUser(-1, (err, user) => {
  if (err) {
    console.error("Failed:", err.message); // "Failed: Invalid user id: -1"
    return;
  }
  console.log("Found:", user.name);
});`,
          explanation:
            "Note the `return` after each `callback(...)` call. Without it, execution continues and the callback can be invoked a second time with contradictory arguments — a bug this convention makes easy to write and hard to spot.",
        },
      ],
      pitfalls: [
        {
          title: "try/catch cannot catch an error thrown inside an async callback",
          body: "Wrapping `findUser(...)` in a `try`/`catch` catches nothing, because `findUser` returns successfully and immediately; the callback runs much later, on an empty call stack, with no enclosing `try` block anywhere in sight. A `throw` at that point becomes an uncaught exception that crashes the process or hits `window.onerror`. This single limitation is the strongest argument for Promises — as the async/await lesson shows, `try`/`catch` starts working again once `await` is involved.",
        },
      ],
    },
    {
      id: "ts-callback-types",
      heading: "TypeScript: the error-first convention doesn't type well",
      body: [
        "A callback is an ordinary function-typed parameter, so typing one uses exactly the function types from Module 2 — nothing new. What is interesting is that the error-first convention resists being typed accurately. The convention guarantees that exactly one of `err` and `result` is meaningful, but the natural type — `(err: Error | null, user?: User) => void` — can't say that. It describes four combinations, two of which never happen, and TypeScript quite correctly refuses to let you use `user` without checking it first.",
      ],
      examples: [
        {
          id: "ts-callback-types-example",
          title: "A type that admits states the convention forbids",
          ts: `interface User {
  id: number;
  name: string;
}

type UserCallback = (err: Error | null, user?: User) => void;

function findUser(id: number, callback: UserCallback): void {
  setTimeout(() => {
    if (id <= 0) callback(new Error("Invalid user id: " + id));
    else callback(null, { id, name: "Ada" });
  }, 100);
}

findUser(1, (err, user) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log(user.name);
  // Error: 'user' is possibly 'undefined'.
  //
  // TypeScript isn't wrong. The type genuinely permits err === null AND
  // user === undefined; only the *convention* rules that out, and a
  // convention is not something the compiler can check.
});

// A promise-returning signature has no impossible states to describe:
function findUserAsync(id: number): Promise<User> {
  // resolves with a User, or rejects — never both, never neither
  return new Promise((resolve, reject) => {
    findUser(id, (err, user) => {
      if (err) reject(err);
      else resolve(user!); // the '!' is the cost of the callback type, paid once
    });
  });
}

findUserAsync(1).then((user) => console.log(user.name.toUpperCase())); // no '?' needed`,
          explanation:
            "`Promise<User>` carries the same information without the impossible combinations: success means a `User`, failure means a rejection, and there's no third state to guard against. That's a smaller point than the pyramid, but it's the same story — the callback convention encodes in documentation what a promise encodes in the type.",
        },
      ],
    },
    {
      id: "callback-hell",
      heading: "Callback hell: the pyramid of doom",
      body: [
        "One callback is fine. The trouble starts when the *next* operation needs the result of the previous one — you can't line up dependent steps sequentially, because each result only exists inside its own callback. The only place to put step two is inside step one, and step three inside step two. Code that describes a simple linear sequence ends up drifting diagonally across the screen, with error handling duplicated at every single level.",
      ],
      examples: [
        {
          id: "pyramid-of-doom-example",
          title: "Four sequential steps, four levels of nesting",
          js: `const db = {
  findUser: (id, cb) => setTimeout(() => cb(null, { id, name: "Ada" }), 100),
  findOrders: (userId, cb) => setTimeout(() => cb(null, [{ id: 9, total: 42 }]), 100),
  findItems: (orderId, cb) => setTimeout(() => cb(null, ["book", "pen"]), 100),
  findStock: (item, cb) => setTimeout(() => cb(null, { item, inStock: true }), 100),
};

// Read the shape, not the details — this is the "pyramid of doom"
db.findUser(1, (err, user) => {
  if (err) return console.error(err.message);

  db.findOrders(user.id, (err, orders) => {
    if (err) return console.error(err.message);

    db.findItems(orders[0].id, (err, items) => {
      if (err) return console.error(err.message);

      db.findStock(items[0], (err, stock) => {
        if (err) return console.error(err.message);

        console.log("Finally:", user.name, orders.length, items, stock);
        // ...and every further step indents one level deeper still
      });
    });
  });
});`,
          explanation:
            "Four straightforward steps produce four levels of indentation, four near-identical error checks, and a closing sequence of `});` that gives no hint of what it closes. Adding a fifth step, reordering two of them, or running two of them at the same time all require restructuring the whole block.",
        },
      ],
      pitfalls: [
        {
          title: "The deeper problem is inversion of control",
          body: "Nesting is the visible symptom; the real hazard is that you hand your continuation to someone else's function and then trust it completely. Will it call your callback exactly once? Could it call it twice, double-charging a customer? Never at all, leaving your program silently hung? Synchronously in some code paths and asynchronously in others, so the ordering changes unpredictably? With a third-party library you have no way to enforce any of this. A Promise fixes it structurally: it can settle only once, always asynchronously, and it hands you a value rather than taking your function.",
        },
      ],
    },
    {
      id: "what-comes-next",
      heading: "The four problems the rest of this module solves",
      body: [
        "It's worth naming these precisely, because each remaining lesson exists to answer one of them. **First**, nesting: dependent steps can't be written in a flat sequence — Promise chaining and then `await` fix this. **Second**, duplicated error handling: every level needs its own `if (err)`, and `try`/`catch` doesn't work — a single `.catch()` at the end of a chain, or one `try`/`catch` around several `await`s, replaces all of them.",
        "**Third**, no composition: with callbacks there's no value to pass around, so 'run these three operations at the same time and continue when all are done' has to be hand-written with counters and flags — `Promise.all` and friends make it one line. **Fourth**, inversion of control: a promise is a value you hold and inspect, rather than a function you surrender to someone else's control flow.",
        "Callbacks themselves are not deprecated, and never will be — event handlers (`element.addEventListener`), array methods, and the low-level Node APIs all still use them, correctly. What Promises replace is specifically the use of callbacks to deliver a **one-time future result**.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "JavaScript is single-threaded — so how can it do several things at once?",
      answer:
        "It doesn't, strictly speaking. Your JavaScript runs on one thread with one call stack, and each function runs to completion before anything else runs. Genuinely concurrent work (network requests, timers, file I/O, rendering) is performed by the host environment — the browser or Node.js — outside that thread. When the host finishes, it queues the callback you registered, and the event loop runs it once your call stack is empty. Concurrency comes from the environment; JavaScript just schedules and reacts.",
    },
    {
      question: "What is the difference between a synchronous and an asynchronous callback?",
      answer:
        "A synchronous callback is invoked during the call that received it and is finished before that call returns — array.map, array.filter and array.sort all work this way. An asynchronous callback is only registered by that call, which returns immediately; the callback is invoked later, after the current code has run to completion. The two are indistinguishable at the call site, so you have to know the API. The practical consequence is that you can never use a value produced by an async callback on the line after the call.",
    },
    {
      question: "Why can't you return a value from an asynchronous callback?",
      answer:
        "Because the enclosing function has already returned by the time the callback runs. A `return` inside a setTimeout callback returns from that callback into the timer machinery, which discards it — it cannot retroactively become the outer function's return value. Before Promises, the only workaround was to accept a callback and pass the value into it, which is exactly what forces sequential dependent operations to nest.",
    },
    {
      question: "What is the error-first callback convention, and why does it exist?",
      answer:
        "It's Node's standard signature `callback(err, result)`: the error is the first parameter and is null or undefined on success. It exists because throwing from an asynchronous callback is useless — the caller's stack frame and any surrounding try/catch are long gone by the time the callback runs, so the error has to be passed sideways as data rather than thrown up a call stack that no longer exists.",
    },
    {
      question: "Beyond looking ugly, what is actually wrong with callback hell?",
      answer:
        "Four things. Dependent operations can only be sequenced by nesting, so linear logic reads as a pyramid. Error handling is duplicated at every level with no way to handle it once. There's no value to compose, so running operations concurrently means hand-rolling counters and flags. And most importantly there's inversion of control: you hand your continuation to another function and simply trust it to call it exactly once, at the right time, with the right arguments — a promise takes that guarantee out of the callee's hands by being a value you hold, which can settle only once.",
    },
  ],
  takeaways: [
    "JavaScript has one thread and one call stack; slow work is performed by the host environment, which invokes a callback you registered once it's finished.",
    "Synchronous callbacks (array.map) run during the call; asynchronous callbacks (setTimeout) are only registered and run after the current code finishes — you can never return an async result.",
    "The error-first convention, callback(err, result), exists because throwing from an async callback can't be caught: the caller's try/catch is gone by then.",
    "Nesting dependent operations produces the pyramid of doom, with error handling duplicated at every level and no way to compose or reorder steps.",
    "The deepest problem is inversion of control — trusting someone else's function to call yours exactly once, correctly — which is what makes a promise a value rather than a surrendered callback.",
  ],
  status: "available",
};
