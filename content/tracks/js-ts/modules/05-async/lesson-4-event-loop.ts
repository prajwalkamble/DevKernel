import type { Lesson } from "@/content/types";

export const eventLoopLesson: Lesson = {
  id: "async-event-loop",
  slug: "the-event-loop-microtasks-and-macrotasks",
  moduleSlug: "async",
  title: "The Event Loop: Microtasks vs Macrotasks",
  summary:
    "The scheduler underneath everything in this module — the call stack, the two queues, and the one drain rule that lets you predict the exact output order of any mixture of timers, promises and awaits.",
  estimatedMinutes: 30,
  objectives: [
    "Describe the call stack, the host APIs and the queues, and how the event loop connects them",
    "Predict the output order of code mixing setTimeout, promises and await",
    "Explain why await is a microtask boundary and why microtasks can starve timers",
    "Explain why setTimeout's delay is a minimum and what 'blocking the event loop' costs",
  ],
  sections: [
    {
      id: "runtime-anatomy",
      heading: "The parts: call stack, host APIs, queues, loop",
      body: [
        "Four pieces explain all asynchronous behaviour in JavaScript. The **call stack** is where your functions actually execute — one stack, one at a time. The **host APIs** are the capabilities the environment provides outside the language itself: timers, network, file I/O, DOM events. The **queues** hold callbacks whose triggering work has finished and which are now waiting for a turn. And the **event loop** is a simple perpetual loop that does one thing: *when the call stack is empty, take the next queued callback and push it onto the stack*.",
        "The consequence of that one rule is **run-to-completion**: a function, once started, runs to its end without ever being interrupted by a queued callback. No queued callback can begin while anything is still on the stack. This is why JavaScript needs no locks or mutexes — but also why one slow synchronous function freezes the entire page, including rendering and user input.",
      ],
      examples: [
        {
          id: "stack-empty-rule-example",
          title: "The stack-empty rule, in three lines",
          js: `console.log("1");
setTimeout(() => console.log("3"), 0);
console.log("2");

// Output: 1, 2, 3 — even though the delay is zero.
//
// 1. console.log("1") is pushed onto the stack, runs, pops off.
// 2. setTimeout hands the callback + 0ms to the HOST and returns immediately.
//    The host's timer expires essentially at once and queues the callback.
// 3. console.log("2") is pushed, runs, pops off.
// 4. Only NOW is the stack empty, so the event loop takes the queued
//    callback and pushes it. "3" prints last.`,
          output: "1 / 2 / 3",
          explanation:
            "A zero-millisecond delay says 'queue this as soon as possible', never 'run this now'. The callback is guaranteed to wait until the currently executing code — all of it, however long — has finished completely.",
        },
      ],
    },
    {
      id: "two-queues",
      heading: "Two queues, and the rule that orders them",
      body: [
        "There isn't one queue, there are two, with different priorities. The **macrotask queue** (the spec calls these simply tasks) holds `setTimeout` and `setInterval` callbacks, I/O completions, and UI events like clicks. The **microtask queue** holds promise reactions — every `.then`, `.catch` and `.finally` callback, and every resumption of an async function after an `await` — plus anything scheduled with `queueMicrotask()` and `MutationObserver` callbacks.",
        "One rule connects them: **after the currently running script or macrotask finishes, the event loop drains the microtask queue completely — down to empty — before taking the next macrotask.** 'Completely' is literal and important: microtasks added *while* the queue is being drained are also run in the same drain, before any macrotask gets a turn. Microtasks are therefore always faster than a `setTimeout(fn, 0)`, no matter how many of them there are.",
        "The practical translation: **promises always beat timers**. If output order ever surprises you, sort the pending callbacks into these two buckets and apply the drain rule.",
      ],
      examples: [
        {
          id: "microtask-vs-macrotask-example",
          title: "The classic ordering puzzle",
          js: `console.log("script start");

setTimeout(() => console.log("setTimeout"), 0); // macrotask

Promise.resolve()
  .then(() => console.log("promise 1"))          // microtask
  .then(() => console.log("promise 2"));         // queued once "promise 1" runs

console.log("script end");

// Output:
//   script start     <- synchronous
//   script end       <- synchronous
//   promise 1        <- microtask drain begins after the script finishes
//   promise 2        <- queued DURING the drain, still runs before any macrotask
//   setTimeout       <- macrotask, last`,
          output: "script start / script end / promise 1 / promise 2 / setTimeout",
          explanation:
            "`promise 2` is the interesting one. It isn't queued until `promise 1`'s callback returns — i.e. in the middle of the drain — yet it still runs before the timer, because the drain continues until the microtask queue is empty rather than stopping after the callbacks that were pending when it started.",
        },
        {
          id: "drain-between-macrotasks-example",
          title: "The queue is drained between every pair of macrotasks",
          js: `setTimeout(() => {
  console.log("timeout 1");
  queueMicrotask(() => console.log("microtask queued inside timeout 1"));
}, 0);

setTimeout(() => console.log("timeout 2"), 0);

// Output:
//   timeout 1
//   microtask queued inside timeout 1   <- BEFORE timeout 2, not after
//   timeout 2`,
          output: "timeout 1 / microtask queued inside timeout 1 / timeout 2",
          explanation:
            "Both macrotasks were already queued when the first one ran, and still the microtask created inside it jumped ahead of the second. The drain happens between **every** pair of macrotasks — this is also the point at which the browser gets its chance to render, which is why a flood of microtasks delays painting.",
        },
        {
          id: "drain-is-exhaustive-example",
          title: "The drain continues until the queue is genuinely empty",
          js: `setTimeout(() => console.log("macrotask"), 0);

Promise.resolve().then(() => {
  console.log("micro A");
  // queued in the MIDDLE of the drain — still runs before the macrotask
  Promise.resolve().then(() => console.log("micro C"));
});

Promise.resolve().then(() => console.log("micro B"));

// Output:
//   micro A     <- pending when the drain started
//   micro B     <- pending when the drain started
//   micro C     <- added during the drain, and still served by it
//   macrotask   <- only once the microtask queue is completely empty`,
          output: "micro A / micro B / micro C / macrotask",
          explanation:
            "'Drain to empty' is the phrase to remember. The loop doesn't run the microtasks that happened to be pending when it started and then move on — it keeps going until nothing is left, which is what makes an endlessly self-scheduling microtask so dangerous.",
        },
      ],
      pitfalls: [
        {
          title: "An endless microtask chain freezes the page as hard as an infinite loop",
          body: "Because the drain runs until the queue is empty, a microtask that always schedules another microtask means the queue never empties — no timer ever fires, no click is ever handled, nothing is ever rendered. `function loop() { Promise.resolve().then(loop); }` will hang a tab just as effectively as `while (true) {}`, and is much harder to spot. Recursive polling should be scheduled with `setTimeout` so that macrotasks and rendering keep getting their turn.",
        },
      ],
    },
    {
      id: "await-is-a-microtask-boundary",
      heading: "await, in event-loop terms",
      body: [
        "The previous lesson said that everything after an `await` is effectively a `.then` callback. Now that has a precise meaning: **reaching an `await` returns control to the caller immediately, and schedules the remainder of the function as a microtask** once the awaited promise settles. An `async` function body is therefore split at each `await` into pieces, of which only the first runs synchronously.",
        "Two consequences follow. The code before the first `await` in an async function — including the entire body of an async function that's awaited — runs synchronously as part of the caller's turn. And `await` always costs at least one microtask tick, even on a value that is already available: `await 42` still defers the rest of the function.",
      ],
      examples: [
        {
          id: "async-ordering-puzzle-example",
          title: "The interview question — trace it before reading the answer",
          js: `async function async1() {
  console.log("async1 start");
  await async2();               // suspends HERE; the rest becomes a microtask
  console.log("async1 end");
}

async function async2() {
  console.log("async2");        // runs synchronously, inside async1's turn
}

console.log("script start");

setTimeout(() => console.log("setTimeout"), 0);

async1();

new Promise((resolve) => {
  console.log("promise executor"); // executors are synchronous (lesson 2)
  resolve();
}).then(() => console.log("promise then"));

console.log("script end");

// Output:
//   script start        sync
//   async1 start        sync — the part before the first await
//   async2              sync — an awaited async fn's body still runs immediately
//   promise executor    sync — the executor is not deferred
//   script end          sync — the script's turn ends here
//   async1 end          microtask 1 — queued at the await, before .then was called
//   promise then        microtask 2
//   setTimeout          macrotask, last as always`,
          output:
            "script start / async1 start / async2 / promise executor / script end / async1 end / promise then / setTimeout",
          explanation:
            "The two microtasks run in the order they were **queued**, not in source order: `async1()` hit its `await` before the `.then()` was even registered, so its continuation was first in line. Getting this trace right requires only three facts — sync code first, microtasks in queue order, macrotasks last.",
        },
      ],
      pitfalls: [
        {
          title: "Don't memorise tick counts",
          body: "Older articles claim `await p` costs three microtask ticks; engines optimised this to one for native promises back in 2019 (V8 7.2 / Node 12), which changed the output order of some contrived examples. Interviewers occasionally still ask the old version. Reason from the model — sync, then microtasks in queue order, then macrotasks — rather than from tick arithmetic, and never write code whose correctness depends on the exact number of ticks.",
        },
      ],
    },
    {
      id: "timers-are-a-minimum",
      heading: "setTimeout's delay is a minimum, not an appointment",
      body: [
        "`setTimeout(fn, 100)` means 'queue `fn` no *earlier* than 100ms from now'. When it actually runs also depends on the stack being empty, the microtask queue being drained, and every macrotask already ahead of it in the queue having finished. Under load the real delay can be far longer, and it is never shorter.",
        "There are floors, too. Browsers clamp nested timers — once a chain of timers is more than five deep, the minimum delay becomes 4ms — and clamp much harder in background tabs to save power. Node applies a 1ms floor to `setTimeout(fn, 0)`. So a `setTimeout`-based animation or polling loop cannot run faster than roughly 250 iterations a second, which is one reason `requestAnimationFrame` exists for visual work.",
      ],
      examples: [
        {
          id: "blocking-the-loop-example",
          title: "A 0ms timer arriving 200ms late",
          js: `const start = Date.now();

setTimeout(() => {
  console.log("0ms timer actually fired after", Date.now() - start, "ms");
}, 0);

Promise.resolve().then(() => {
  console.log("microtask fired after", Date.now() - start, "ms");
});

// Block the one and only thread for 200ms
const end = Date.now() + 200;
while (Date.now() < end) {
  // In a browser page this is 200ms of frozen UI: no rendering,
  // no scrolling, no clicks, no timers, no promise callbacks.
}

console.log("blocking finished after", Date.now() - start, "ms");

// Output — exact figures vary, but the shape never does:
//   blocking finished after ~200 ms
//   microtask fired after ~200 ms          <- drained first, as always
//   0ms timer actually fired after ~200 ms <- a "0ms" delay, 200ms late`,
          explanation:
            "Both callbacks were ready almost immediately and both waited for the synchronous loop, because neither can run while anything is on the call stack. Note that the microtask still won — the priority rule holds regardless of how long the block lasted.",
        },
      ],
      pitfalls: [
        {
          title: "Long synchronous work is the one thing you truly cannot schedule around",
          body: "Parsing a huge JSON payload, sorting a hundred thousand rows, or hashing a large file blocks rendering and input for its entire duration, and no amount of promises helps — a promise around synchronous work still runs that work synchronously. The real fixes are to break the work into chunks that yield to the event loop between them, or to move it off the main thread entirely with a Web Worker. This site's own playground does exactly that: your code runs in a Worker specifically so that an accidental `while (true)` can be terminated without ever freezing the page you're reading.",
        },
      ],
    },
    {
      id: "node-differences",
      heading: "Node.js: the same model with more macrotask phases",
      body: [
        "Node uses the same two-queue model, so everything above transfers unchanged. Its extra detail is that the macrotask side is split into ordered **phases** that the loop cycles through: timers (expired `setTimeout`/`setInterval`), pending callbacks, poll (I/O), check (`setImmediate`), and close callbacks. The microtask queue is still drained between individual callbacks, not just between phases.",
        "Two Node-only functions are worth knowing. `setImmediate(fn)` queues into the check phase — that is, after the current poll phase rather than after a timer delay. And `process.nextTick(fn)` isn't part of the event loop at all: it has its own queue that is drained *before* the promise microtask queue, giving it the highest priority of anything asynchronous. Overusing it can starve promises the same way runaway microtasks starve timers.",
      ],
      examples: [
        {
          id: "node-queues-example",
          title: "Node's extra priorities",
          js: `// Node.js only — setImmediate and process.nextTick don't exist in browsers
setTimeout(() => console.log("setTimeout"), 0);
setImmediate(() => console.log("setImmediate"));
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));

// Output starts deterministically:
//   nextTick     <- its own queue, drained first
//   promise      <- then the microtask queue
// ...then setTimeout and setImmediate in an order that is NOT guaranteed at
// the top level of the main module: it depends on how long process startup
// took relative to the 1ms timer floor, and can differ between runs.

// Inside an I/O callback, however, the order IS deterministic —
// the check phase always follows the poll phase:
require("fs").readFile(__filename, () => {
  setTimeout(() => console.log("timeout inside I/O"), 0);
  setImmediate(() => console.log("immediate inside I/O")); // ALWAYS first here
});`,
          explanation:
            "The nondeterminism of that top-level pair is a genuine, documented Node behaviour rather than a quirk of any one machine — which is the real lesson: never depend on the relative order of `setTimeout(fn, 0)` and `setImmediate`. If you need 'after the current I/O', use `setImmediate`; if you need 'before anything else', `queueMicrotask` is the portable choice over `process.nextTick`.",
        },
      ],
    },
    {
      id: "ts-timer-types",
      heading: "TypeScript: what setTimeout actually returns",
      body: [
        "The browser and Node disagree about timers, and TypeScript faithfully reports the disagreement. In the DOM library `setTimeout` returns a `number`; in `@types/node` it returns a `NodeJS.Timeout` **object**. Any code that has to compile in both — a shared utility, an isomorphic library, or a Next.js project like this one, which pulls in both sets of types — cannot annotate a timer id as either.",
        "The fix is to derive the type instead of naming it: `ReturnType<typeof setTimeout>` resolves to whichever `setTimeout` is actually in scope. Better still, just let inference do it — `const id = setTimeout(...)` needs no annotation at all and is portable by construction.",
      ],
      examples: [
        {
          id: "ts-timer-types-example",
          title: "Deriving a timer id's type instead of naming it",
          ts: `let timerId: number;
timerId = setTimeout(() => console.log("tick"), 100);
// Error: Type 'Timeout' is not assignable to type 'number'.
// (In a browser-only project this compiles fine — which is exactly
//  what makes it such an annoying error to hit later.)

// Portable: the type follows whichever setTimeout is in scope
let portableId: ReturnType<typeof setTimeout>;
portableId = setTimeout(() => console.log("tick"), 100);
clearTimeout(portableId); // correct in both environments

// Simplest of all — inference is always portable
const inferredId = setTimeout(() => console.log("tick"), 100);
clearTimeout(inferredId);`,
          explanation:
            "This is the most frequently hit typing snag in async code, and it has nothing to do with promises — it's purely the two host environments having different timer APIs. `ReturnType<typeof ...>` is the same utility type the TypeScript lesson later in this module uses to derive an async function's resolved type.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the event loop?",
      answer:
        "A loop that repeatedly checks whether the call stack is empty and, if it is, moves the next queued callback onto the stack to run. Asynchronous work itself is performed by the host environment — the browser or Node — which queues your callback when it completes. The rule that a callback can only start on an empty stack is what gives JavaScript run-to-completion semantics: a function is never interrupted mid-execution, so no locks are needed, but a long synchronous function freezes everything.",
    },
    {
      question: "What's the difference between a microtask and a macrotask, and which runs first?",
      answer:
        "Macrotasks (tasks) are setTimeout/setInterval callbacks, I/O completions and UI events. Microtasks are promise reactions — .then/.catch/.finally callbacks and async function resumptions after await — plus queueMicrotask and MutationObserver. Microtasks always win: after the current script or macrotask finishes, the entire microtask queue is drained to empty, including microtasks added during the drain, before the next macrotask is taken. So a promise callback always runs before a setTimeout(fn, 0) queued at the same moment.",
    },
    {
      question: "Why doesn't setTimeout(fn, 0) run immediately?",
      answer:
        "Because the delay only controls when the callback is queued, not when it runs. It can't start until the current code has run to completion and the stack is empty, the microtask queue has been fully drained, and any macrotasks already ahead of it have finished. The delay is a minimum. There are also floors — browsers clamp timers nested more than five deep to 4ms, and Node applies a 1ms floor to a zero delay.",
    },
    {
      question: "Can asynchronous code freeze the page even though it's asynchronous?",
      answer:
        "Yes, in two ways. A microtask that always schedules another microtask means the queue never empties, so no timer, event or render ever gets a turn — as hard a freeze as while(true) and far harder to spot. And any long synchronous computation blocks the stack for its whole duration, which promises cannot help with since a promise around synchronous work still runs it synchronously. The fixes are to schedule recursion with setTimeout, chunk long work with yields, or move it to a Web Worker.",
    },
    {
      question: "Where does await fit into the event loop?",
      answer:
        "Reaching an await returns control to the caller immediately and schedules the rest of the function as a microtask, to run once the awaited promise settles. So an async function body is split at each await, and only the part before the first one runs synchronously — including the body of an async function that's being awaited, which still executes inside the caller's synchronous turn. Even await on an already-available value costs one microtask tick.",
    },
  ],
  takeaways: [
    "One call stack; the host performs the slow work and queues your callback; the event loop moves it onto the stack only once the stack is empty — hence run-to-completion.",
    "Two queues: macrotasks (timers, I/O, UI events) and microtasks (promise reactions, await resumptions, queueMicrotask).",
    "The whole microtask queue is drained to empty — including microtasks added mid-drain — between every pair of macrotasks, so promises always beat timers.",
    "await splits an async function at each suspension point: everything before the first await is synchronous, everything after is a microtask.",
    "setTimeout's delay is a minimum subject to stack, drain and clamping; long synchronous work blocks everything and belongs in chunks or a Web Worker.",
  ],
  status: "available",
};
