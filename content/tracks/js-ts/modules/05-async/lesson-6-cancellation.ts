import type { Lesson } from "@/content/types";

export const cancellationLesson: Lesson = {
  id: "async-cancellation",
  slug: "abortcontroller-and-cancellation",
  moduleSlug: "async",
  title: "AbortController & Cancellation Patterns",
  summary:
    "Why a promise can never be cancelled, how AbortController supplies the cancellation that promises deliberately lack, how to make your own async functions abortable, and the stale-response race condition that abort exists to fix.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why cancellation cannot be a feature of promises themselves",
    "Use AbortController, signal.aborted, signal.reason and the abort event",
    "Write your own abortable async function, with correct cleanup",
    "Implement timeouts and fix the stale-response race condition",
  ],
  sections: [
    {
      id: "promises-cannot-be-cancelled",
      heading: "A promise cannot be cancelled — and that's by design",
      body: [
        "There is no `promise.cancel()`, and there never will be. A promise is a **read-only view of a result**, not a handle on the operation producing it. Anyone can hold it, anyone can attach handlers to it, and it can be passed to code that has no idea where it came from — so allowing any holder to cancel it would break every other holder. Its immutability once settled, the very property that made it safer than a callback in lesson 1, is the same property that rules out cancellation.",
        "Cancellation therefore has to be arranged with whoever **starts** the work, since only they can stop it. That needs a channel for saying 'stop' that flows in the opposite direction to the result — and a standard one exists: `AbortController`. You'll recognise the gap it fills from lesson 2: `Promise.all` rejecting on the first failure doesn't stop the other operations, because it has no way to.",
      ],
    },
    {
      id: "abortcontroller-basics",
      heading: "AbortController: a controller you keep, a signal you pass",
      body: [
        "The API is a deliberately asymmetric pair. `new AbortController()` gives you an object with two things: an `abort()` method that **you** keep, and a `controller.signal` that you **pass** to the operation. The operation can observe the signal but cannot abort it; you can abort but cannot observe how the work is going. Each side gets exactly the capability it needs.",
        "A signal exposes three things worth knowing: `signal.aborted` (a boolean, for checking before you start), the `abort` event (for reacting while running), and `signal.reason` — the value the caller passed to `abort(reason)`, defaulting to a `DOMException` whose `name` is `\"AbortError\"`. There's also `signal.throwIfAborted()`, a one-line shorthand for 'if we've been cancelled, throw the reason now'. Aborting is permanent and idempotent: the `abort` event fires at most once, and calling `abort()` again does nothing.",
        "Everything that accepts a signal follows one convention: an aborted operation **rejects** with `signal.reason`. That means cancellation arrives in your `catch` block looking exactly like a failure — so you must distinguish 'the user cancelled this' from 'the server is down', which is what makes checking the error's `name` essential rather than optional.",
      ],
      examples: [
        {
          id: "abort-basics-example",
          title: "The controller/signal pair, and cancelling a fetch",
          js: `const controller = new AbortController();
const signal = controller.signal;

console.log("aborted?", signal.aborted); // false

signal.addEventListener("abort", () => {
  console.log("abort event fired. reason:", signal.reason.name); // "AbortError"
});

controller.abort();
console.log("aborted?", signal.aborted);      // true
console.log("reason:", signal.reason.name);   // "AbortError" (a DOMException)
console.log("message:", signal.reason.message); // "This operation was aborted"

controller.abort(); // idempotent — the event does NOT fire a second time

// You can abort with your own reason instead of the default:
const c2 = new AbortController();
c2.abort(new Error("user navigated away"));
console.log("custom reason:", c2.signal.reason.message);

// The canonical consumer: fetch takes { signal } and rejects when aborted.
async function loadWithCancel(url) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 100); // cancel after 100ms

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Cancelled — not a real failure, so don't show an error");
      return null;
    }
    throw err; // a genuine network error: let it propagate
  }
}`,
          explanation:
            "The `err.name === \"AbortError\"` check in that `catch` is the part people leave out, and it's why cancelled requests so often surface as spurious 'Something went wrong' toasts. Aborting is a deliberate outcome; it arrives on the failure path only because that's the only path a promise has.",
        },
      ],
      pitfalls: [
        {
          title: "Aborting is not undoing",
          body: "`abort()` stops your program from waiting for a result and asks the host to drop the connection — it does not roll anything back. A POST that already reached the server will still be processed, and the row will still be inserted. Cancellation is about *your* interest in the answer, not about the effect on the other end; anything transactional needs a real compensating action, not an abort.",
        },
      ],
    },
    {
      id: "writing-abortable-functions",
      heading: "Making your own async functions abortable",
      body: [
        "Accepting a signal is a three-part contract, and each part matters. **Check first**: if `signal.aborted` is already true when you're called, reject immediately without starting any work — a signal may well have been aborted before it reached you. **Listen while running**: subscribe to the `abort` event and reject with `signal.reason`. **Clean up in every case**: release the underlying resource (clear the timer, close the socket) when aborted, and remove your listener when the work finishes normally.",
        "That last point is the one that's easy to skip and expensive to miss. A signal often outlives a single operation — one controller for a whole page's requests, say — so every listener you leave attached keeps its whole closure alive for as long as the signal exists. It's precisely the leak Module 4's `WeakMap` lesson described, arriving by a different route. `{ once: true }` handles the abort case; an explicit `removeEventListener` handles the success case.",
      ],
      examples: [
        {
          id: "abortable-delay-example",
          title: "An abortable delay, following the full contract",
          js: `function delay(ms, { signal } = {}) {
  return new Promise((resolve, reject) => {
    // 1. Already cancelled before we even started
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timerId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort); // 3b. clean up on success
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timerId); // 3a. release the resource we were holding
      reject(signal.reason); // reject with the reason, by convention
    }

    // 2. React to cancellation while we're running
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// Cancelled part-way through
const controller = new AbortController();
delay(1000, { signal: controller.signal })
  .then(() => console.log("finished — will NOT happen"))
  .catch((err) => console.log("delay cancelled:", err.name)); // "AbortError"
setTimeout(() => controller.abort(), 100);

// Not cancelled — resolves normally, listener removed
delay(200).then(() => console.log("uncancelled delay finished"));

// Long multi-step work should check between steps, since an abort
// mid-step can't interrupt code that's already running:
async function processAll(items, { signal } = {}) {
  const done = [];
  for (const item of items) {
    signal?.throwIfAborted(); // shorthand for: if (aborted) throw reason
    await delay(50, { signal });
    done.push(item);
  }
  return done;
}

const c = new AbortController();
processAll([1, 2, 3, 4, 5], { signal: c.signal })
  .then((done) => console.log("all done:", done))
  .catch((err) => console.log("stopped early:", err.name));
setTimeout(() => c.abort(), 120); // stops after roughly two items`,
          explanation:
            "`throwIfAborted()` between steps matters because aborting cannot interrupt code that is already running — run-to-completion from the event loop lesson applies here too. A signal can only take effect at points where your code chooses to look at it, so long loops need explicit checkpoints.",
        },
      ],
    },
    {
      id: "timeouts-and-composition",
      heading: "Timeouts, and combining signals",
      body: [
        "A timeout is just cancellation on a timer, and there are two ways to build one. The `Promise.race` pattern — racing the real work against a promise that rejects after N milliseconds — works with *any* promise and needs no cooperation, but it only stops you *waiting*: the losing operation keeps running, keeps consuming a connection, and its result is silently discarded. That's a fine trade-off for something you can't otherwise control, and the wrong one when a real cancellation is available.",
        "The better tool is `AbortSignal.timeout(ms)`, which returns a signal that aborts itself after the given time — genuinely stopping the request. One detail worth knowing: it aborts with a `DOMException` named `\"TimeoutError\"`, not `\"AbortError\"`, which is exactly what you want, since it lets a `catch` block tell 'this was too slow' apart from 'the user cancelled'.",
        "Real code usually needs both a timeout and a manual cancel. `AbortSignal.any([...signals])` composes them: it returns a signal that aborts as soon as any of its inputs does, adopting that input's reason. Both helpers are recent additions — `AbortSignal.timeout` landed in browsers in 2022 and Node 17.3, `AbortSignal.any` in 2024 and Node 20.3 — so check your runtime floor before relying on them.",
      ],
      examples: [
        {
          id: "timeouts-example",
          title: "Three ways to give up waiting",
          js: `// The abortable delay from the previous section, standing in for a request
function delay(ms, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(signal.reason);
    }, { once: true });
  });
}

// 1. Promise.race — works on ANY promise, needs no cooperation,
//    but only stops you waiting: the loser runs to completion regardless
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timed out after " + ms + "ms")), ms)
  );
  return Promise.race([promise, timeout]);
}

withTimeout(delay(500), 100).catch((err) => console.log("1:", err.message));
// "1: Timed out after 100ms" — while that 500ms operation quietly continues

// 2. AbortSignal.timeout — genuine cancellation, and a DISTINCT error name
delay(500, { signal: AbortSignal.timeout(100) }).catch((err) =>
  console.log("2:", err.name, "—", err.message)
);
// "2: TimeoutError — The operation was aborted due to timeout"
// Real code looks the same: fetch(url, { signal: AbortSignal.timeout(5000) })

// 3. AbortSignal.any — a timeout AND a manual cancel, whichever fires first
const userCancel = new AbortController();
const combined = AbortSignal.any([userCancel.signal, AbortSignal.timeout(5000)]);

delay(1000, { signal: combined }).catch((err) => {
  // "AbortError" if the user cancelled, "TimeoutError" after 5s — the composed
  // signal adopts the reason of whichever input aborted it
  console.log("3:", err.name); // "3: AbortError"
});
setTimeout(() => userCancel.abort(), 50);`,
          output: "3: AbortError / 1: Timed out after 100ms / 2: TimeoutError — The operation was aborted due to timeout",
          explanation:
            "Compare the first two carefully. Both stop your code waiting after 100ms, but only the second stops the *work* — and only the second gives the `catch` block an error name it can act on. On a page firing a request per keystroke, that's a handful of connections versus dozens of abandoned ones, all still competing for bandwidth.",
        },
      ],
    },
    {
      id: "stale-responses",
      heading: "The bug cancellation exists to fix: stale responses",
      body: [
        "Fire a request per keystroke in a search box and you have a race condition, not just wasted bandwidth. Responses arrive in whatever order the network delivers them, so the reply to `\"ty\"` can easily land after the reply to `\"typescript\"` — and the last one to arrive is the one that overwrites your UI. The user sees results for something they typed three keystrokes ago, intermittently, and only on slow connections. It is a genuinely nasty bug to reproduce.",
        "The fix is to cancel the previous request before starting the next: keep one controller in scope, abort it at the top of every handler, and replace it. Beyond removing the race, this stops piling up connections — browsers cap concurrent requests per host, so abandoned ones actively delay the request you actually care about.",
        "When an API simply can't be cancelled, the fallback is a **sequence guard**: tag each request, and when a response arrives, discard it unless its tag is still the current one. It doesn't save the bandwidth, but it does fix the correctness bug. The same shape shows up throughout Module 9's React work as cleaning up an effect on unmount — a component that has gone away must not write its late-arriving response into state.",
      ],
      examples: [
        {
          id: "stale-response-example",
          title: "Last-response-wins, and two ways to prevent it",
          js: `// A fake API where SHORTER queries happen to be slower — exactly the
// timing that produces the bug, and exactly what you won't see locally.
function search(query, { signal } = {}) {
  const ms = 400 - query.length * 100;
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve(query + " results"), ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(signal.reason);
    }, { once: true });
  });
}

// BROKEN: whichever response lands last wins
let display = "";
["a", "ab", "abc"].forEach((query) => {
  search(query).then((result) => {
    display = result;
    console.log("broken — displaying:", display);
  });
});
// Logs "abc results", then "ab results", then "a results":
// the UI ends up showing results for "a" while the box says "abc"

// FIXED with AbortController: each keystroke cancels the one before it
let inFlight = null;
function onType(query) {
  inFlight?.abort(); // cancel the previous request, if any
  inFlight = new AbortController();

  search(query, { signal: inFlight.signal })
    .then((result) => console.log("fixed — displaying:", result))
    .catch((err) => {
      if (err.name !== "AbortError") throw err; // ignore our own cancellations
    });
}
onType("a");
onType("ab");
onType("abc"); // only this one ever reaches the UI

// FALLBACK when the API can't be cancelled: guard on a sequence number
let latestRequestId = 0;
function onTypeGuarded(query) {
  const requestId = ++latestRequestId;
  search(query).then((result) => {
    if (requestId !== latestRequestId) return; // a newer request has since started
    console.log("guarded — displaying:", result);
  });
}`,
          explanation:
            "Both fixes give the same correct result; only the first also stops the wasted work. Note the `if (err.name !== \"AbortError\") throw err` line — without it, deliberately cancelling a request looks identical to a network failure, and every keystroke would report an error the user should never see.",
        },
      ],
      pitfalls: [
        {
          title: "Never swallow every error just to hide the AbortErrors",
          body: "An empty `.catch(() => {})` on a cancellable operation is tempting and hides real failures along with the cancellations — the server going down then looks exactly like a keystroke. Always check `err.name === \"AbortError\"` (or `\"TimeoutError\"`, or compare against your own reason) and re-throw everything else. If you abort with a custom reason, `err === controller.signal.reason` is an even more precise test.",
        },
      ],
    },
    {
      id: "ts-abortable-signatures",
      heading: "TypeScript: typing an abortable API",
      body: [
        "The platform's own convention is worth copying exactly: take an options object with an **optional** `signal?: AbortSignal`, so callers who don't care about cancellation can ignore it entirely. That's what `fetch` does, and matching it means your functions compose with `AbortSignal.any` and everything else without adaptation.",
        "Typing the *caller* side is the more interesting half. As the TypeScript lesson established, a `catch` variable is `unknown` under strict mode — and here that's genuinely useful rather than an obstacle, because it forces you to narrow before deciding whether a failure was a real error or your own cancellation. Note that `signal.reason` is typed `any`, so narrow it yourself rather than trusting it.",
      ],
      examples: [
        {
          id: "ts-abortable-signatures-example",
          title: "An optional signal in, a narrowed error out",
          ts: `interface AbortableOptions {
  signal?: AbortSignal;
}

// Optional options, optional signal — callers can ignore cancellation entirely
async function loadUser(id: number, { signal }: AbortableOptions = {}): Promise<string> {
  signal?.throwIfAborted();
  const response = await fetch("/api/users/" + id, { signal });
  return response.text();
}

// Cancellation arrives as a rejection, so telling it apart is the caller's job.
// The platform rejects with a DOMException whose .name identifies the cause.
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function main() {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 100);

  try {
    console.log(await loadUser(1, { signal: controller.signal }));
    console.log(await loadUser(2)); // no signal — perfectly valid
  } catch (err) {
    // err: unknown — strict mode makes the narrowing below mandatory,
    // which is exactly the check people forget in plain JavaScript
    if (isAbortError(err)) {
      console.log("cancelled on purpose — nothing to report to the user");
      return;
    }
    throw err; // a genuine failure
  }
}`,
          explanation:
            "`unknown` in the `catch` turns the discipline from the start of this lesson — always distinguish a cancellation from a failure — from a habit you have to remember into something the compiler insists on. It's a small illustration of the general point that `strict` mode tends to catch precisely the cases people skip when writing quickly.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Can you cancel a promise?",
      answer:
        "No, and it isn't an oversight. A promise is a read-only view of a result rather than a handle on the operation producing it, and it can be held by many consumers at once — so letting any one of them cancel it would break the others. Its permanent, one-time settlement is also what makes it safe. Cancellation has to be arranged with whatever starts the work, which is what AbortController provides. This is also why Promise.all rejecting doesn't stop the other operations: it has no channel to stop them with.",
    },
    {
      question: "How does AbortController work?",
      answer:
        "It's an asymmetric pair. You keep the controller, which has an abort(reason) method, and pass controller.signal to the operation. The operation can check signal.aborted, listen for the abort event, read signal.reason, or call signal.throwIfAborted(), but it cannot abort. By convention an aborted operation rejects with signal.reason, which defaults to a DOMException named AbortError. Aborting is permanent and idempotent — the event fires at most once.",
    },
    {
      question: "How do you make your own async function abortable?",
      answer:
        "Accept an optional signal and honour three obligations. Check signal.aborted at the start and reject immediately if it's already set, since the signal may have been aborted before it reached you. Add an abort listener that releases the underlying resource — clearTimeout, close the socket — and rejects with signal.reason. And clean up in both directions: use { once: true } for the abort path and removeEventListener when the work completes normally, or every listener left on a long-lived signal keeps its whole closure alive. For long loops, call signal.throwIfAborted() between steps, since an abort can't interrupt code that's already running.",
    },
    {
      question: "What are the ways to implement a timeout, and how do they differ?",
      answer:
        "Promise.race against a promise that rejects after N ms works on any promise and needs no cooperation, but only stops you waiting — the losing operation keeps running and its result is discarded. AbortSignal.timeout(ms) genuinely cancels the work, and aborts with a DOMException named TimeoutError rather than AbortError, so a catch block can tell a slow response apart from a user cancellation. For both a timeout and a manual cancel, AbortSignal.any([userSignal, AbortSignal.timeout(ms)]) combines them and adopts the reason of whichever fires first.",
    },
    {
      question: "What is the stale-response race condition, and how does aborting fix it?",
      answer:
        "When several requests for the same UI element are in flight — one per keystroke in a search box, say — responses can arrive out of order, so an older reply can land after a newer one and overwrite the display with results for a query the user has already moved past. It shows up only on slow or variable connections, which makes it hard to reproduce. Aborting the previous request at the start of each handler removes the race and frees the connection. When an API can't be cancelled, the fallback is a sequence guard: tag each request and discard any response whose tag is no longer the latest.",
    },
  ],
  takeaways: [
    "Promises can't be cancelled by design — they're a shared, read-only view of a result — so cancellation has to be arranged with whatever starts the work.",
    "AbortController splits the capability: you keep abort(), the operation gets the signal, and an aborted operation rejects with signal.reason (a DOMException named AbortError by default).",
    "An abortable function must check signal.aborted up front, reject on the abort event while releasing its resource, remove its listener on success, and use throwIfAborted() as a checkpoint in long loops.",
    "AbortSignal.timeout(ms) cancels for real and rejects with a TimeoutError, unlike a Promise.race timeout which only stops you waiting; AbortSignal.any composes a timeout with a manual cancel.",
    "Cancelling the previous request per keystroke fixes the stale-response race — and always test err.name rather than swallowing every error, or genuine failures disappear along with the cancellations.",
  ],
  status: "available",
};
