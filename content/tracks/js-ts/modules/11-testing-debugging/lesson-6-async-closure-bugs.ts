import type { Lesson } from "@/content/types";

export const asyncClosureBugsLesson: Lesson = {
  id: "testing-async-bugs",
  slug: "async-and-closure-bugs",
  moduleSlug: "testing-debugging",
  title: "Debugging Async & Closure Bugs",
  summary:
    "The bugs that do not produce a useful stack trace: stale closures, out-of-order responses, forgotten awaits and swallowed rejections — how each one presents, and how to find it.",
  estimatedMinutes: 35,
  objectives: [
    "Recognise a stale closure from its symptoms",
    "Predict execution order across sync code, microtasks and macrotasks",
    "Find and fix a response-ordering race",
    "Spot a forgotten await, including the ones TypeScript cannot catch",
    "Stop rejections being swallowed, and install a global net",
  ],
  sections: [
    {
      id: "stale-closures",
      heading: "Stale closures",
      body: [
        "A closure captures **the variable's binding at the moment the function was created**. If that value has since changed, a callback scheduled earlier still sees the old one.",
        "The classic demonstration is a loop, and it is worth running because the two versions differ by one keyword.",
      ],
      examples: [
        {
          id: "loop-closure",
          title: "var and let, in the same program",
          js: `console.log("var:");
for (var i = 0; i < 3; i++) {
  setTimeout(() => process.stdout.write(i + " "), 0);
}

setTimeout(() => {
  console.log("\\nlet:");
  for (let j = 0; j < 3; j++) {
    setTimeout(() => process.stdout.write(j + " "), 0);
  }
}, 10);`,
          output: `var:
3 3 3
let:
0 1 2 `,
          explanation:
            "`var` is function-scoped, so all three callbacks close over **one** binding — by the time any of them runs, the loop has finished and it holds 3. `let` creates a **new binding per iteration**, so each callback captures its own. This is the entire reason `let` exists in loops, and it generalises: any callback scheduled inside a loop over a `var` sees the final value.",
        },
        {
          id: "stale-in-practice",
          title: "The version you will actually meet",
          js: `// A handler registered once, closing over state that later changes.
let currentUser = null;

function init() {
  loadUser().then((user) => {
    currentUser = user;
  });

  // Registered now, so it captures \`currentUser\` — which is null.
  // Because it reads the outer binding rather than a copy, this one
  // is actually fine...
  button.addEventListener("click", () => save(currentUser));
}

// ...but this is not: the value is read at registration time.
function initBroken() {
  const user = currentUser;                       // null, right now
  button.addEventListener("click", () => save(user));   // always null
}

// Same bug with an interval:
function poll(intervalMs) {
  let paused = false;
  setInterval(() => {
    if (paused) return;      // reads the current value — fine
    fetchUpdates();
  }, intervalMs);
  return () => { paused = true; };
}`,
          explanation:
            "The distinction is **when the value is read**, not when the function was created. A closure over a `let` that is reassigned later sees the new value, because it captures the binding. A closure over a `const` copy taken at registration time is frozen. This is also exactly the React stale-closure problem: a `useEffect` with `[]` captures the first render's props forever, which the React track covers in its effects module.",
        },
      ],
      pitfalls: [
        {
          title: "The symptom is a value that is 'one behind' or stuck at its initial state",
          body: "Stale closures rarely throw. They produce a handler that saves the previous form contents, a counter stuck at 0, or a filter that applies the search term from two keystrokes ago. When a value is wrong in a *consistent* way rather than randomly, suspect a closure before suspecting a race.",
        },
      ],
    },
    {
      id: "ordering",
      heading: "Execution order: sync, microtasks, macrotasks",
      body: [
        "A great many async bugs are really ordering misunderstandings. The rule is short.",
        "**All synchronous code runs first**, to completion. **Then the entire microtask queue drains** — promise callbacks, `queueMicrotask`, `await` continuations — including any microtasks queued by those microtasks. **Then one macrotask runs** — a timer, an I/O callback — and the microtask queue drains again.",
        "The consequence people rely on without knowing it: **a promise callback always runs before a `setTimeout(…, 0)` scheduled at the same moment.**",
      ],
      examples: [
        {
          id: "ordering-demo",
          title: "Predict the output, then check",
          js: `console.log("1 sync");

setTimeout(() => console.log("4 timeout"), 0);

Promise.resolve().then(() => console.log("3 microtask"));
queueMicrotask(() => console.log("3b microtask"));

console.log("2 sync");`,
          output: `1 sync
2 sync
3 microtask
3b microtask
4 timeout`,
          explanation:
            "The timer was scheduled *before* the promise and still ran last. That is the microtask/macrotask split, and it is why a `setTimeout(…, 0)` is not \"run this immediately\" — it is \"run this after everything currently pending, including any promise chains\". A microtask that queues another microtask delays the timer further; an infinite chain of them starves the event loop entirely.",
        },
      ],
    },
    {
      id: "races",
      heading: "Response-ordering races",
      body: [
        "Two requests fired in order can return out of order. Search-as-you-type is the canonical case: the response for `\"ca\"` arrives after the response for `\"cat\"`, and the slower, older result overwrites the newer one.",
        "It is intermittent, it depends on the network, and it almost never reproduces locally — which is why it survives review.",
        "There are two fixes and they are not equivalent.",
      ],
      examples: [
        {
          id: "race-fixes",
          title: "Cancel, or check on arrival",
          js: `// The bug.
async function searchBroken(query) {
  const results = await fetch(\`/search?q=\${query}\`).then((r) => r.json());
  render(results);        // whichever response lands last wins
}

// Fix 1 — cancel the previous request. Best: the work stops too.
let inFlight = null;

async function search(query) {
  inFlight?.abort();
  inFlight = new AbortController();

  try {
    const response = await fetch(\`/search?q=\${query}\`, { signal: inFlight.signal });
    render(await response.json());
  } catch (error) {
    if (error.name === "AbortError") return;   // expected, not a failure
    throw error;
  }
}

// Fix 2 — check on arrival, when the request cannot be cancelled.
let latest = 0;

async function searchSeq(query) {
  const id = ++latest;
  const results = await fetch(\`/search?q=\${query}\`).then((r) => r.json());
  if (id !== latest) return;                   // a newer request superseded us
  render(results);
}`,
          explanation:
            "Fix 1 is better where it applies, because it stops the server doing work nobody wants. Fix 2 is the fallback for APIs with no cancellation, and it generalises to any \"only the newest result counts\" situation. The pattern to notice in both: **the guard is after the await**, because that is where the code resumes in a world that may have moved on.",
        },
      ],
      pitfalls: [
        {
          title: "Everything after an `await` runs in a changed world",
          body: "Between the await and the resumption, other handlers ran, state changed, and the component may have unmounted. Any assumption made before the await — that an element still exists, that this is still the current request, that the user is still on this page — must be rechecked after it. Reading resumption points as \"a different moment in time\" is the single most useful habit for async debugging.",
        },
      ],
    },
    {
      id: "forgotten-await",
      heading: "The forgotten await",
      body: [
        "Omitting `await` gives you a `Promise` where you expected a value. Sometimes that is loud, and sometimes it is silent for months.",
        "It is **loud** when you use the value arithmetically or read a property — `undefined` appears quickly. It is **silent** when the value is only logged, stored, or passed somewhere permissive, and in a `try/catch` it is dangerous: the promise rejects *outside* the block, so the catch never fires.",
      ],
      examples: [
        {
          id: "forgotten-await-demo",
          title: "What you get instead",
          js: `const wrong = (async () => 42)();
console.log("without await:", wrong);
console.log("with await:   ", await wrong);`,
          output: `without await: Promise { 42 }
with await:    42`,
          explanation:
            "`Promise { 42 }` in a log is the giveaway — the value is right there inside it, which is why the log looks *almost* correct. In a browser console it shows as `Promise {<fulfilled>: 42}`.",
        },
        {
          id: "await-in-try",
          title: "The silent version, and how to prevent it",
          ts: `// The catch never runs: \`save\` rejects after this block has exited,
// so the rejection becomes unhandled instead.
async function bad() {
  try {
    save();                     // missing await
  } catch (error) {
    report(error);              // unreachable
  }
}

// Enable these, and the compiler finds them for you:
//
// tsconfig:      "strict": true
// eslint (needs type-aware linting):
//   "@typescript-eslint/no-floating-promises": "error"
//   "@typescript-eslint/await-thenable": "error"
//   "@typescript-eslint/require-await": "error"

// When you deliberately do not want to wait, say so — the lint rule
// accepts \`void\` as an explicit acknowledgement.
void logAnalytics(event);`,
          explanation:
            "`no-floating-promises` is the highest-value lint rule in this module. It catches every unhandled promise, including the `try/catch` case above, and the `void` operator is the sanctioned way to mark the ones you meant. It requires type-aware linting, which is why many projects have never switched it on.",
        },
      ],
    },
    {
      id: "swallowed",
      heading: "Swallowed rejections",
      body: [
        "An error inside a promise that nothing handles does not crash the program — it becomes an *unhandled rejection*, reported separately or, in some setups, not at all.",
        "Three shapes account for almost all of them: an empty `catch`, a `.then` with no `.catch`, and an async function called without `await`. All three produce the same symptom: something silently does not happen.",
      ],
      examples: [
        {
          id: "global-handlers",
          title: "A global net, in both runtimes",
          js: `// Browser
window.addEventListener("unhandledrejection", (event) => {
  report(event.reason);
  event.preventDefault();          // stop the default console error
});

window.addEventListener("error", (event) => {
  report(event.error ?? event.message);
});

// Node — since v15 an unhandled rejection terminates the process,
// which is the right default. Handle it to log first.
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "uncaught exception");
  process.exit(1);
});`,
          explanation:
            "These are a **reporting** net, not a recovery mechanism. After an uncaught exception the process is in an unknown state, so the correct response is to log and exit and let your supervisor restart it. Catching one and continuing is how a service ends up serving wrong answers instead of restarting.",
        },
        {
          id: "async-stacks",
          title: "Getting a usable async stack",
          js: `// Async stack traces are on by default in modern V8, so a trace
// continues across await boundaries rather than stopping at the
// event loop. It works best when errors are constructed at the point
// of failure — which is another argument for \`cause\` (module 10).

async function outer() {
  await middle();
}
async function middle() {
  await inner();
}
async function inner() {
  throw new Error("boom");
}

// Error: boom
//     at inner (/app/x.js:9:9)
//     at async middle (/app/x.js:6:3)
//     at async outer (/app/x.js:3:3)

// Two things that destroy the chain:
//   1. Rethrowing a NEW error without \`cause\` — the original stack is lost.
//   2. \`Promise.all\` — the trace shows where you awaited, not which
//      operation failed. Attach identifying context yourself:
const results = await Promise.all(
  ids.map(async (id) => {
    try {
      return await load(id);
    } catch (error) {
      throw new Error(\`Failed loading \${id}\`, { cause: error });
    }
  })
);`,
          explanation:
            "The `Promise.all` case is worth internalising. With ten concurrent loads, a bare rejection tells you one of them failed and nothing about which — and that is the point at which people add logging to all ten. Wrapping each with an identifying message and a `cause` gives you both the identity and the original stack.",
        },
      ],
      pitfalls: [
        {
          title: "`await` in a loop is sequential, and usually accidental",
          body: "`for (const id of ids) { await load(id); }` runs the loads one after another — a hundred items at 50ms each is five seconds. It is correct when each iteration depends on the last, and a performance bug otherwise. `await Promise.all(ids.map(load))` runs them concurrently; `Promise.allSettled` does the same when partial failure is acceptable. The `no-await-in-loop` lint rule flags them for review.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does a `setTimeout` inside a `var` loop print the final value three times?",
      answer:
        "`var` is function-scoped, so all iterations share one binding. By the time any callback runs the loop has finished and that single variable holds its final value. `let` creates a fresh binding per iteration, so each closure captures its own — which is why the same loop with `let` prints 0, 1, 2.",
    },
    {
      question: "In what order do sync code, promise callbacks and setTimeout run?",
      answer:
        "All synchronous code first, then the entire microtask queue drains — promise callbacks, `queueMicrotask`, `await` continuations, including microtasks queued by microtasks — then one macrotask such as a timer, after which microtasks drain again. So a `Promise.resolve().then(…)` always runs before a `setTimeout(…, 0)` queued at the same moment.",
    },
    {
      question: "How do you fix a search-as-you-type race?",
      answer:
        "Cancel the previous request with an `AbortController` before starting the next, which also stops the server doing unwanted work — and treat `AbortError` as expected rather than a failure. Where cancellation is unavailable, tag each request with an incrementing id and, after the await, discard the result if a newer request has started. The guard must be after the await, because that is where the world may have changed.",
    },
    {
      question: "Why does a missing `await` inside try/catch make the catch unreachable?",
      answer:
        "Without `await`, the call returns a promise immediately and the try block exits. The promise rejects later, outside the block, so the catch never runs and the rejection becomes unhandled. `@typescript-eslint/no-floating-promises` catches exactly this, and `void expr` is the sanctioned way to mark a promise you deliberately do not wait for.",
    },
    {
      question: "What should a global unhandledRejection handler do?",
      answer:
        "Log and exit. It is a reporting net, not recovery — after an unhandled rejection or uncaught exception the process is in an unknown state, so continuing risks serving wrong answers. Log with enough context to diagnose it, then exit and let the supervisor restart. In Node since v15 an unhandled rejection terminates the process by default, which is the correct behaviour.",
    },
  ],
  takeaways: [
    "A closure captures a binding, not a value — a copy taken at registration time is what goes stale",
    "Stale closures present as values that are consistently one behind or stuck at their initial state",
    "Sync code, then all microtasks, then one macrotask — so a promise callback beats `setTimeout(…, 0)`",
    "Responses can arrive out of order; cancel with `AbortController` or discard superseded results after the await",
    "Everything after an `await` runs in a world that may have changed — recheck assumptions there",
    "A missing `await` inside try/catch makes the catch unreachable; `no-floating-promises` finds it",
    "`void expr` marks a deliberately unawaited promise",
    "Global rejection handlers are for reporting and exiting, not for recovery",
    "Wrap each concurrent operation with an identifying error and `cause`, or `Promise.all` will not tell you which one failed",
  ],
  status: "available",
};
