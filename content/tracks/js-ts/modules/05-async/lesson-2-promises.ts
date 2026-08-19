import type { Lesson } from "@/content/types";

export const promisesLesson: Lesson = {
  id: "async-promises",
  slug: "promises-states-and-chaining",
  moduleSlug: "async",
  title: "Promises: States, Chaining & Combinators",
  summary:
    "The object that turns a future result into a value you can hold, pass around and compose — its three states, the chaining rule that flattens the pyramid, how errors propagate, and the four combinators worth knowing cold.",
  estimatedMinutes: 35,
  objectives: [
    "Describe the three promise states and why settling is permanent",
    "Explain why every .then() returns a new promise, and what its callback's return value does",
    "Rewrite a nested callback pyramid as a flat promise chain with one error handler",
    "Choose correctly between Promise.all, allSettled, race and any",
  ],
  sections: [
    {
      id: "promise-states",
      heading: "Three states, settled exactly once",
      body: [
        "A **promise** is an ordinary object that represents a value which isn't available yet. It exists in one of three states: **pending** (the operation is still running), **fulfilled** (it succeeded, and the promise now holds a value), or **rejected** (it failed, and the promise now holds a reason — conventionally an `Error`). A promise that has left the pending state is called **settled**, and settling is a one-way, permanent transition: once fulfilled or rejected, a promise can never change state or value again. That immutability is what solves the inversion-of-control problem from the previous lesson — no matter how badly behaved the code that created it, a promise cannot deliver its result twice.",
        "You usually get promises from APIs that already return them (`fetch`, most modern libraries). When you genuinely need to create one — typically to wrap an older callback-based API — you use the `new Promise` constructor, which takes an **executor** function receiving `resolve` and `reject`. The executor runs **synchronously and immediately**, right there in the constructor call; only the `resolve`/`reject` calls inside it are usually deferred.",
      ],
      examples: [
        {
          id: "promise-construction-example",
          title: "Creating a promise, and 'promisifying' a callback API",
          js: `const promise = new Promise((resolve, reject) => {
  console.log("1: executor runs immediately, synchronously");
  setTimeout(() => {
    const succeeded = true;
    if (succeeded) {
      resolve("the value");   // -> fulfilled with "the value"
    } else {
      reject(new Error("it failed")); // -> rejected with that Error
    }
  }, 100);
});

console.log("2: constructor already returned; promise is", promise); // still pending
promise.then((value) => console.log("3: fulfilled with", value));

// The main legitimate reason to write 'new Promise' yourself:
// wrapping an old-style, error-first callback API exactly once.
function findUser(id, callback) {
  setTimeout(() => {
    if (id <= 0) callback(new Error("Invalid id"));
    else callback(null, { id, name: "Ada" });
  }, 100);
}

function findUserAsync(id) {
  return new Promise((resolve, reject) => {
    findUser(id, (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

findUserAsync(1).then((user) => console.log("4:", user.name)); // "Ada"

// Already have a value? Skip the constructor entirely:
Promise.resolve(42).then((n) => console.log("5:", n));         // 42
Promise.reject(new Error("nope")).catch((e) => console.log("6:", e.message));`,
          explanation:
            "Log `1` appears before log `2`, proving the executor body is not deferred at all — `new Promise` runs it right away and only the eventual `resolve` call is asynchronous. Also note that after settling, calling `resolve` again (or `reject`) is silently ignored: the first settlement wins, permanently.",
        },
      ],
      pitfalls: [
        {
          title: "Don't wrap something that already returns a promise",
          body: "`new Promise((resolve) => fetch(url).then(resolve))` is the explicit promise construction antipattern. It adds a layer that swallows rejections (nothing calls `reject`), duplicates work the inner promise already does, and is longer than the alternative — which is simply `fetch(url)`. Reach for the constructor only at the boundary with a genuinely non-promise API: callbacks, events, or timers.",
        },
      ],
    },
    {
      id: "then-catch-finally",
      heading: "Consuming a promise: .then, .catch, .finally",
      body: [
        "You never read a promise's value directly — you register a callback to receive it. `.then(onFulfilled, onRejected)` takes up to two callbacks and runs whichever matches how the promise settled. `.catch(fn)` is exactly `.then(undefined, fn)` — pure sugar, and almost always the clearer choice, because placing a handler as `.then`'s second argument means it cannot catch errors thrown by the `.then`'s own success callback, while a following `.catch` can.",
        "`.finally(fn)` runs once the promise settles either way. Its callback receives no arguments — it isn't told what happened — and, crucially, it **passes the original outcome through** unchanged, so it's for cleanup (hiding a spinner, closing a connection) rather than for producing a value.",
      ],
      examples: [
        {
          id: "then-catch-finally-example",
          title: "The three consumers, and why .catch beats .then's second argument",
          js: `function fetchScore(shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error("network down"));
      else resolve(95);
    }, 100);
  });
}

fetchScore(false)
  .then((score) => console.log("Score:", score))       // "Score: 95"
  .catch((err) => console.error("Error:", err.message)) // skipped
  .finally(() => console.log("Done either way"));

fetchScore(true)
  .then((score) => console.log("Score:", score))        // skipped
  .catch((err) => console.error("Error:", err.message)) // "Error: network down"
  .finally(() => console.log("Done either way"));

// Why the second argument to .then is the weaker option:
fetchScore(false)
  .then(
    (score) => {
      throw new Error("thrown inside the success handler");
    },
    (err) => console.log("the SIBLING handler cannot see it") // never runs
  )
  .catch((err) => console.log("but a later .catch can:", err.message)); // runs`,
          explanation:
            "The two callbacks passed to a single `.then` are alternatives — at most one of them ever runs — so the rejection handler there only sees failures from *upstream*, never from its own sibling. A `.catch` further down the chain sits after the success handler and therefore catches everything before it, which is why the `.then(...).catch(...)` shape is the one to default to.",
        },
      ],
    },
    {
      id: "chaining",
      heading: "The chaining rule: every .then returns a new promise",
      body: [
        "This is the mechanic that makes promises worth having, and it's a single rule: **`.then()` returns a brand-new promise, fulfilled with whatever its callback returns.** Return `5`, and the next `.then` receives `5`. Return nothing, and the next `.then` receives `undefined`. Chains are therefore pipelines — much like the array method chains from Module 4, but spread across time.",
        "The special case is what makes the pyramid disappear: **if your callback returns a promise, the chain adopts it** — it waits for that inner promise to settle and passes its *resolved value* (not the promise itself) to the next `.then`. Promises never nest into `Promise<Promise<T>>`; they flatten automatically. So each dependent step becomes one more link on the same flat chain rather than one more level of indentation.",
      ],
      examples: [
        {
          id: "chaining-example",
          title: "The previous lesson's pyramid, flattened",
          js: `const db = {
  findUser: (id) => new Promise((r) => setTimeout(() => r({ id, name: "Ada" }), 100)),
  findOrders: (userId) => new Promise((r) => setTimeout(() => r([{ id: 9, total: 42 }]), 100)),
  findItems: (orderId) => new Promise((r) => setTimeout(() => r(["book", "pen"]), 100)),
  findStock: (item) => new Promise((r) => setTimeout(() => r({ item, inStock: true }), 100)),
};

db.findUser(1)
  .then((user) => {
    console.log("User:", user.name);
    return db.findOrders(user.id); // returning a PROMISE — the chain waits for it
  })
  .then((orders) => {
    console.log("Orders:", orders.length);
    return db.findItems(orders[0].id);
  })
  .then((items) => {
    console.log("Items:", items);
    return db.findStock(items[0]);
  })
  .then((stock) => {
    console.log("Stock:", stock); // { item: "book", inStock: true }
  })
  .catch((err) => console.error("Any step failing lands here:", err.message));

// Returning a plain value works exactly the same way, minus the waiting:
Promise.resolve(2)
  .then((n) => n * 3)          // returns 6
  .then((n) => n + 1)          // receives 6, returns 7
  .then((n) => console.log(n)); // 7`,
          explanation:
            "Four sequential steps, four levels of indentation in the callback version — one level here, with a **single** error handler at the end instead of four. The chain stays flat no matter how many steps you add, and steps can be reordered, extracted into named functions, or removed by moving one link.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting to return inside .then breaks the chain silently",
          body: "Writing `.then((user) => { db.findOrders(user.id); })` — no `return` — means that `.then` fulfils with `undefined` immediately, so the **next** step runs before the orders have loaded and receives `undefined` instead of the orders. Nothing throws; you just get a mysterious `undefined` and a race condition. The rule is absolute: if a `.then` callback starts async work, it must return that promise. (Note the trap in arrow syntax — `(user) => db.findOrders(user.id)` returns implicitly, but adding braces `{ }` silently removes that return.)",
        },
      ],
    },
    {
      id: "error-propagation",
      heading: "How errors travel down a chain",
      body: [
        "A rejection **skips every `.then` success callback** until it reaches a handler that can deal with it — the nearest `.catch` (or a `.then` with a second argument) further down the chain. That's what makes a single trailing `.catch` sufficient for the whole chain. A `throw` inside any `.then` callback is equivalent to returning a rejected promise, so ordinary `throw` statements work as expected inside a chain, unlike inside a plain callback.",
        "Less obvious, and worth internalising: a `.catch` also returns a new promise, and unless it re-throws, that promise is **fulfilled**. The chain therefore *recovers* after a handled error and carries on into any following `.then`s — which is precisely how you supply a fallback value. If you want the failure to keep travelling, re-throw it.",
      ],
      examples: [
        {
          id: "error-propagation-example",
          title: "Skipping, recovering, and re-throwing",
          js: `Promise.resolve("start")
  .then((v) => {
    console.log("step 1:", v);
    throw new Error("step 2 blew up"); // same as returning a rejected promise
  })
  .then((v) => {
    console.log("step 3 — SKIPPED, never runs");
  })
  .catch((err) => {
    console.log("caught:", err.message);
    return "fallback value"; // recovering: the chain continues, fulfilled
  })
  .then((v) => {
    console.log("step 4 runs with:", v); // "fallback value"
  });

// Re-throw when the error isn't yours to handle:
Promise.reject(new Error("fatal"))
  .catch((err) => {
    console.log("logging, but not handling:", err.message);
    throw err; // keeps the chain rejected
  })
  .then(() => console.log("SKIPPED"))
  .catch((err) => console.log("still rejected:", err.message));

// A rejection with no handler anywhere is an unhandled rejection —
// reported to the console, and a fatal error in Node by default:
Promise.reject(new Error("nobody is listening"));`,
          explanation:
            "The recovery behaviour catches people out constantly: after a `.catch` that returns normally, the chain is healthy again. If a later step must not run after a failure, either put it before the `.catch` or re-throw from inside it.",
        },
      ],
      pitfalls: [
        {
          title: "A .catch in the middle only guards what comes before it",
          body: "`.catch()` handles rejections from the links **above** it, never below. Attaching one right after the first step and then adding three more steps leaves those three completely unprotected. Unless you're deliberately recovering at that point, put the `.catch` last. And remember that a promise you never attach any handler to — including one you create and drop on the floor — produces an unhandled rejection: a warning in the browser, and by default an immediate crash in Node.",
        },
      ],
    },
    {
      id: "combinators",
      heading: "Combinators: all, allSettled, race, any",
      body: [
        "Because a promise is a value, several of them can be combined — the composition that callbacks made impossible. All four combinators take an iterable of promises and return a single promise. What differs is their settling rule.",
        "**`Promise.all`** fulfills with an array of every value, **in input order** regardless of which finished first, and rejects as soon as *any* input rejects (fail-fast) with that first reason. **`Promise.allSettled`** never rejects: it waits for every input and fulfills with an array of `{ status: \"fulfilled\", value }` / `{ status: \"rejected\", reason }` descriptors. **`Promise.race`** settles the instant the first input settles, whether that's a fulfillment or a rejection. **`Promise.any`** waits for the first *fulfillment*, ignoring rejections, and only rejects — with an `AggregateError` whose `.errors` array holds every reason — if all of them fail.",
        "The one-line rule of thumb: `all` for 'I need all of these and any failure ruins it'; `allSettled` for 'do all of these and report on each'; `race` for 'first outcome wins, good or bad' (usually a timeout); `any` for 'first success wins' (usually redundant mirrors).",
      ],
      examples: [
        {
          id: "combinators-example",
          title: "The same three inputs through all four combinators",
          js: `const ok = (value, ms) => new Promise((r) => setTimeout(() => r(value), ms));
const fail = (msg, ms) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

// all — everything must succeed; results keep INPUT order, not finishing order
Promise.all([ok("slow", 300), ok("fast", 100)])
  .then((values) => console.log("all:", values)); // ["slow", "fast"]

Promise.all([ok("a", 300), fail("boom", 100)])
  .catch((err) => console.log("all rejected at:", err.message)); // "boom", after 100ms

// allSettled — never rejects; you get a report on every input
Promise.allSettled([ok("a", 100), fail("boom", 200)])
  .then((results) => {
    for (const r of results) {
      if (r.status === "fulfilled") console.log("allSettled ok:", r.value);
      else console.log("allSettled failed:", r.reason.message);
    }
  });

// race — first to SETTLE wins, even if it settles by failing
Promise.race([ok("winner", 100), fail("loser", 300)])
  .then((v) => console.log("race:", v)); // "winner"

Promise.race([ok("too slow", 300), fail("quick failure", 100)])
  .catch((e) => console.log("race rejected:", e.message)); // "quick failure"

// any — first to FULFILL wins; rejections are ignored unless they all fail
Promise.any([fail("mirror 1 down", 100), ok("mirror 2", 200)])
  .then((v) => console.log("any:", v)); // "mirror 2"

Promise.any([fail("x", 100), fail("y", 150)])
  .catch((err) => console.log("any rejected:", err.errors.map((e) => e.message)));
  // AggregateError — ["x", "y"]`,
          explanation:
            "Compare the two `race` calls against the two `any` calls on the same shape of input: `race` reports the quick *failure*, while `any` ignores it and waits for the slower success. That difference is the entire reason both exist.",
        },
      ],
      pitfalls: [
        {
          title: "Promise.all does not cancel the promises that are still running",
          body: "When one input rejects, `Promise.all` rejects immediately — but the other operations carry on to completion in the background, and if one of them rejects later with no handler attached, you get an unhandled rejection from work whose result you already discarded. Nothing in the promise API can stop in-flight work; a promise observes an operation, it doesn't control it. Genuine cancellation needs `AbortController`, the subject of this module's last lesson.",
        },
      ],
    },
    {
      id: "ts-promise-chains",
      heading: "TypeScript: types flow along the chain",
      body: [
        "`Promise<T>` is a generic type just like the `Array<T>` and `Map<K, V>` of Module 4, and the chaining rule has an exact counterpart in the type system: each `.then` callback's parameter type comes from the previous link's return type, with promises unwrapped along the way. You annotate the functions that create promises, and every step downstream is inferred.",
        "One asymmetry is worth noticing now and will matter in this module's TypeScript lesson: the `err` parameter of `.catch()` is typed `any`, whereas a `catch (err)` block variable is `unknown` under strict mode. The standard library's signature predates that stricter treatment, so `.catch` hands you an unchecked value — narrow it yourself rather than trusting it to be an `Error`.",
      ],
      examples: [
        {
          id: "ts-promise-chains-example",
          title: "Annotate the sources; the chain infers the rest",
          ts: `interface User {
  id: number;
  name: string;
}

interface Order {
  id: number;
  total: number;
}

const findUser = (id: number): Promise<User> => Promise.resolve({ id, name: "Ada" });
const findOrders = (userId: number): Promise<Order[]> =>
  Promise.resolve([{ id: 9, total: 42 }]);

findUser(1)
  .then((user) => findOrders(user.id)) // user: User — unwrapped from Promise<User>
  .then((orders) => orders.length)     // orders: Order[] — the returned promise
                                       //   was unwrapped too, not passed through
  .then((count) => {
    console.log(count.toFixed(0));     // count: number — a plain return value
  })
  .catch((err) => {
    // err: any — NOT unknown. The library's own signature says 'reason: any'.
    console.error(err instanceof Error ? err.message : String(err));
  });

// Promise.all preserves each position's own type, so destructuring stays typed
Promise.all([findUser(1), findOrders(1)]).then(([user, orders]) => {
  console.log(user.name, orders.length); // user: User, orders: Order[]
});`,
          explanation:
            "Nothing in the middle of that chain is annotated, yet every parameter is precisely typed — including `orders`, which demonstrates the auto-unwrapping in the types as well as at runtime. `Promise.all` returning a positional tuple rather than a widened array is what keeps `user` and `orders` distinct in the destructuring.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the three states of a promise, and what does 'settled' mean?",
      answer:
        "Pending (still running), fulfilled (succeeded, holding a value) and rejected (failed, holding a reason). Settled means it has left the pending state — fulfilled or rejected — and that transition is permanent and one-time: a settled promise can never change state or value again, and any further resolve/reject calls are silently ignored. That guarantee is what removes the inversion-of-control risk of raw callbacks, which could be invoked twice or never.",
    },
    {
      question: "What does .then() return, and what determines the value the next .then receives?",
      answer:
        "It always returns a new promise. That promise fulfills with whatever the callback returns — with one crucial special case: if the callback returns a promise, the chain adopts it, waits for it to settle, and passes its resolved value on instead of the promise itself. That auto-flattening is why promises never nest and why sequential dependent operations become a flat chain rather than a pyramid. If the callback returns nothing, the next .then receives undefined.",
    },
    {
      question: "Where does an error thrown inside a .then callback go?",
      answer:
        "It rejects that .then's returned promise, which then skips every subsequent success callback until it reaches a .catch (or a .then with a second argument). A throw inside a chain is equivalent to returning a rejected promise. This is why a single trailing .catch handles the whole chain — and why a .catch placed in the middle protects only the links above it.",
    },
    {
      question: "Does the chain keep running after a .catch handles an error?",
      answer:
        "Yes. .catch also returns a promise, and unless the handler re-throws (or returns a rejected promise), that promise is fulfilled with whatever the handler returned — so the chain recovers and any following .then callbacks run normally. That's the mechanism for supplying a fallback value. To stop the chain instead, re-throw from inside the catch.",
    },
    {
      question: "Compare Promise.all, allSettled, race and any.",
      answer:
        "all fulfills with every value in input order but rejects the moment any input rejects. allSettled never rejects — it waits for all of them and reports each as {status:'fulfilled',value} or {status:'rejected',reason}. race settles as soon as the first input settles, whichever way that goes, making it the classic timeout tool. any waits for the first fulfillment and ignores rejections, only rejecting with an AggregateError if every input fails. Note that none of them cancel the losing operations — those keep running.",
    },
  ],
  takeaways: [
    "A promise is pending, fulfilled or rejected; settling is permanent and can happen only once, which is what makes it safer than a raw callback.",
    "The new Promise executor runs synchronously and immediately — reserve the constructor for wrapping callback, event or timer APIs.",
    "Every .then returns a new promise fulfilled with the callback's return value; returning a promise makes the chain wait and unwrap it, which is what flattens the pyramid.",
    "Rejections skip success handlers until a .catch; a .catch that returns normally recovers the chain, so re-throw when you only meant to log.",
    "all = every value or first failure; allSettled = a report on all; race = first to settle either way; any = first to succeed — and none of them cancel the losers.",
  ],
  status: "available",
};
