import type { Lesson } from "@/content/types";

export const asyncAwaitLesson: Lesson = {
  id: "async-await",
  slug: "async-await-and-error-handling",
  moduleSlug: "async",
  title: "async / await & Error Handling",
  summary:
    "Syntax that lets you write promise-based code as if it were sequential — what async and await actually do underneath, why try/catch works again, and the parallelism mistake that quietly makes async code several times slower than it needs to be.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what an async function returns and what await really does",
    "Handle asynchronous failure with try/catch/finally, and spot a floating promise",
    "Recognise and fix accidentally sequential awaits with Promise.all",
    "Consume an asynchronous stream of values with for await...of",
  ],
  sections: [
    {
      id: "async-functions",
      heading: "An async function always returns a promise",
      body: [
        "`async` in front of a function does exactly two things. First, it forces the function's return value to be wrapped in a promise: `return 42` from an async function gives the caller a promise fulfilled with `42`, and an uncaught `throw` inside it produces a rejected promise rather than a thrown exception. Second, it permits `await` inside the body. That's the whole feature — an async function is a promise-returning function with nicer syntax inside.",
        "Because the return value is always a promise, callers still have to `await` it or attach `.then()`. This is the single most common misreading of `async`: it doesn't make asynchronous code synchronous, and it doesn't let you return a plain value to a synchronous caller. Nothing about the previous lesson has been replaced — promises are still the underlying machinery, and every rule from that lesson still applies.",
      ],
      examples: [
        {
          id: "async-returns-promise-example",
          title: "Return values and throws both become promise settlements",
          js: `async function getNumber() {
  return 42; // wrapped automatically -> a promise fulfilled with 42
}

console.log(getNumber() instanceof Promise); // true — NOT the number 42
getNumber().then((n) => console.log("resolved to:", n)); // 42

async function boom() {
  throw new Error("something went wrong"); // -> a REJECTED promise, not a thrown error
}

// The throw does not propagate to this synchronous caller...
boom().catch((err) => console.log("caught as a rejection:", err.message));

// Returning a promise from an async function is flattened, exactly as in a chain:
async function nested() {
  return Promise.resolve("inner"); // NOT a promise of a promise
}
nested().then((v) => console.log("flattened:", v)); // "inner"`,
          explanation:
            "`getNumber() instanceof Promise` being `true` is the whole lesson in one line. An async function's body may look like it returns a number, but from the outside it returns a promise — so its result is only reachable through `await` or `.then()`.",
        },
      ],
    },
    {
      id: "await-mechanics",
      heading: "await pauses one function, not the program",
      body: [
        "`await promise` suspends the async function it appears in until that promise settles, then evaluates to the fulfilled **value** — the unwrapped result, not the promise. If the promise rejects, the `await` expression *throws* that reason at that point in the function, which is what makes `try`/`catch` work again.",
        "The word 'pause' misleads people, so be precise: only that one function is suspended. The call stack unwinds, control returns to whoever called it, and the rest of the program keeps running normally — timers fire, events are handled, other async functions make progress. Everything written after an `await` is, underneath, the callback of a `.then()` on that promise; `async`/`await` is syntax over the promise machinery from the previous lesson, not a replacement for it.",
        "`await` also accepts non-promises — `await 42` simply yields `42` (after a short delay to the microtask queue, as the event loop lesson explains). That's useful when a value might or might not be a promise.",
      ],
      examples: [
        {
          id: "await-mechanics-example",
          title: "The same chain as a chain and as awaits",
          js: `const db = {
  findUser: (id) => new Promise((r) => setTimeout(() => r({ id, name: "Ada" }), 100)),
  findOrders: (userId) => new Promise((r) => setTimeout(() => r([{ id: 9, total: 42 }]), 100)),
  findItems: (orderId) => new Promise((r) => setTimeout(() => r(["book", "pen"]), 100)),
};

// Previous lesson's flat chain...
db.findUser(1)
  .then((user) => db.findOrders(user.id))
  .then((orders) => db.findItems(orders[0].id))
  .then((items) => console.log("chained:", items));

// ...and the identical logic with await: no callbacks, ordinary local variables
async function loadItems() {
  const user = await db.findUser(1);       // user is the OBJECT, not a promise
  const orders = await db.findOrders(user.id);
  const items = await db.findItems(orders[0].id);
  console.log("awaited:", items);
  return items;
}

console.log("A: before calling");
loadItems();                 // returns immediately at the first await
console.log("B: after calling — the program did NOT wait");

// Top-level await works in ES modules, but not inside a plain script or
// a Function body — wrap it in an async IIFE when you need it here:
(async () => {
  const items = await loadItems();
  console.log("C: inside the IIFE, items are ready:", items);
})();`,
          explanation:
            "`B` prints before any of the awaited work finishes, which is the proof that `await` didn't block anything outside `loadItems`. Inside the function, though, `user` and `orders` are plain local variables usable on the next line — the readability win that makes `await` the default choice over `.then()` chains.",
        },
      ],
      pitfalls: [
        {
          title: "await only works inside an async function (or a module's top level)",
          body: "Using `await` in a normal function is a syntax error, and top-level `await` is only legal in an ES module — not in a classic script, not inside `new Function`, and not in this site's playground, which runs your code as a plain function body. The universal workaround is the async IIFE shown above: `(async () => { ... })();`. Wrap the async examples in this module that way whenever you paste them into the playground.",
        },
      ],
    },
    {
      id: "try-catch",
      heading: "Error handling: try/catch works across await",
      body: [
        "The first lesson's central complaint was that `try`/`catch` is powerless against asynchronous errors, because the callback runs long after the `try` block has been left. `await` repairs this completely. A rejected awaited promise throws at the `await` expression, *inside* the async function, while it is genuinely suspended there — so an enclosing `try` block is still on the stack conceptually and catches it. One `try`/`catch` can therefore cover several sequential steps, replacing the per-level `if (err)` checks of the pyramid.",
        "`finally` behaves as it always has and runs whether the block succeeded or threw, which makes it the natural place for cleanup. And because an async function converts a `throw` into a rejection, a `throw` inside `catch` is how you re-raise a failure to your own caller — usually after wrapping it in a more meaningful error.",
      ],
      examples: [
        {
          id: "try-catch-example",
          title: "One try/catch for a whole sequence, plus wrapping and re-throwing",
          js: `const api = {
  getUser: (id) =>
    new Promise((resolve, reject) =>
      setTimeout(() => (id > 0 ? resolve({ id, name: "Ada" }) : reject(new Error("404 not found"))), 100)
    ),
  getSettings: (userId) =>
    new Promise((resolve) => setTimeout(() => resolve({ theme: "dark" }), 100)),
};

async function loadProfile(id) {
  let loading = true;
  try {
    const user = await api.getUser(id);         // may reject
    const settings = await api.getSettings(id); // may reject
    console.log("Loaded:", user.name, settings.theme);
    return { user, settings };
  } catch (err) {
    // catches a rejection from EITHER await, and any sync throw in between
    console.error("Could not load profile:", err.message);
    throw new Error("Profile unavailable for user " + id, { cause: err }); // re-raise with context
  } finally {
    loading = false;
    console.log("Cleanup always runs. loading =", loading);
  }
}

loadProfile(1);  // "Loaded: Ada dark", then the cleanup line
loadProfile(-1)  // "Could not load profile: 404 not found", cleanup, then rejects
  .catch((err) => console.log("caller saw:", err.message, "| cause:", err.cause.message));`,
          explanation:
            "The `{ cause: err }` option preserves the original error while presenting a clearer one to your caller — far better than either swallowing the failure or letting a raw `404 not found` bubble up with no context about what was being attempted.",
        },
      ],
      pitfalls: [
        {
          title: "A forgotten await escapes your try/catch entirely",
          body: "`try { api.getUser(-1) } catch { }` catches nothing. Without `await`, the call returns a promise that the `try` block discards and moves past; when it rejects moments later, the block is long gone and you get an unhandled rejection instead. These 'floating promises' are the most common bug in async/await code — and the reason TypeScript's `no-floating-promises` lint rule exists. Related and equally subtle: inside a `try`, `return somePromise` hands the promise to the caller before it settles, so a later rejection isn't caught either; write `return await somePromise` when the surrounding `catch` needs to see it.",
        },
      ],
    },
    {
      id: "sequential-vs-parallel",
      heading: "The performance trap: accidentally sequential awaits",
      body: [
        "`await` is a suspension point, so consecutive `await`s run **strictly one after another**. When each step genuinely needs the previous result — as in the profile example — that's correct and unavoidable. When the operations are independent, it's pure waste: three 100ms requests take 300ms instead of the 100ms they should.",
        "The fix follows from what you already know: calling a promise-returning function *starts* the work immediately; `await` only decides when you collect the result. So start everything first, then await. `Promise.all` is the idiomatic way to write that, and it also gives you clean destructuring of the results and fail-fast behaviour.",
      ],
      examples: [
        {
          id: "sequential-vs-parallel-example",
          title: "300ms or 100ms, from one line of difference",
          js: `const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));

async function sequential() {
  const start = Date.now();
  const a = await delay(100, "a"); // waits 100ms...
  const b = await delay(100, "b"); // ...THEN starts, waits another 100ms
  const c = await delay(100, "c"); // ...and again
  console.log("sequential:", [a, b, c], Date.now() - start, "ms"); // ~300ms
}

async function parallel() {
  const start = Date.now();
  const pa = delay(100, "a"); // all three start NOW, before any await
  const pb = delay(100, "b");
  const pc = delay(100, "c");
  const [a, b, c] = await Promise.all([pa, pb, pc]); // one wait for all of them
  console.log("parallel:", [a, b, c], Date.now() - start, "ms"); // ~100ms
}

// Usually written more compactly — the calls still all start before the await:
async function parallelIdiomatic() {
  const [a, b, c] = await Promise.all([delay(100, "a"), delay(100, "b"), delay(100, "c")]);
  console.log("idiomatic:", [a, b, c]);
}

// Awaiting inside a loop has the same problem, times N:
async function inALoop(ids) {
  const results = [];
  for (const id of ids) {
    results.push(await delay(100, id)); // sequential: 100ms PER id
  }
  console.log("loop:", results);
}

async function mappedInParallel(ids) {
  // .map with an async callback returns an array of promises, all already running
  const results = await Promise.all(ids.map((id) => delay(100, id)));
  console.log("mapped:", results); // 100ms total
}

sequential();
parallel();
parallelIdiomatic();
inALoop([1, 2, 3]);
mappedInParallel([1, 2, 3]);`,
          explanation:
            "Nothing is 'more parallel' about the second version — the operations were always capable of overlapping. The only change is when you await: in `sequential`, the second `delay` isn't even called until the first has finished, because the call itself sits after an `await`.",
        },
      ],
      pitfalls: [
        {
          title: "forEach ignores async callbacks completely",
          body: "`items.forEach(async (item) => { await save(item); })` looks like it awaits, but `forEach` was written years before promises existed: it calls your function and throws the returned promise away. The loop finishes instantly, before a single save completes, and any rejection becomes unhandled. Use `for (const item of items) { await save(item) }` when order matters, or `await Promise.all(items.map(save))` when it doesn't — `map` at least collects the promises so `Promise.all` can wait on them.",
        },
      ],
    },
    {
      id: "for-await-of",
      heading: "Async iteration: for await...of",
      body: [
        "Module 4 covered the iterable protocol (`Symbol.iterator`) and generators. There's an asynchronous counterpart to both. An **async iterable** implements `Symbol.asyncIterator`, whose `next()` returns a promise of `{ value, done }`, and `for await...of` consumes it — awaiting each value in turn and stopping when `done`. An **async generator** (`async function*`) is the easy way to produce one: it may both `await` inside its body and `yield` values out of it.",
        "This is the right tool for a sequence that arrives over time rather than all at once: paginated API results, lines from a file, chunks from a streaming response body. `for await...of` is deliberately sequential — it fetches the next value only after you've handled the current one — which is exactly what you want for a stream, and exactly what you don't want for a fixed list of independent requests.",
      ],
      examples: [
        {
          id: "for-await-of-example",
          title: "An async generator paging through results",
          js: `const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));

// Pretend each page costs a network round trip
function fetchPage(pageNumber) {
  const pages = {
    1: { items: ["a", "b"], nextPage: 2 },
    2: { items: ["c", "d"], nextPage: 3 },
    3: { items: ["e"], nextPage: null },
  };
  return delay(100, pages[pageNumber]);
}

// async function* — can await inside AND yield out
async function* allItems() {
  let page = 1;
  while (page !== null) {
    const response = await fetchPage(page); // await inside a generator
    for (const item of response.items) {
      yield item;                            // hand each item to the consumer
    }
    page = response.nextPage;
  }
}

(async () => {
  for await (const item of allItems()) {
    console.log("item:", item); // a, b, c, d, e — pages fetched lazily, on demand
  }
  console.log("stream finished");

  // for await...of also accepts a plain array OF PROMISES, awaiting each in turn:
  for await (const value of [delay(50, "x"), delay(10, "y")]) {
    console.log(value); // "x" then "y" — input order, one at a time
  }
})();`,
          explanation:
            "Only three pages are fetched, and page 2 isn't requested until the consumer has finished with page 1's items — the laziness of generators from Module 4, now spread across time. If the consumer `break`s out of the loop early, the remaining pages are never fetched at all.",
        },
      ],
    },
    {
      id: "ts-async-iteration",
      heading: "TypeScript: AsyncGenerator is the async counterpart of Generator",
      body: [
        "Module 4 typed a generator's output as `Generator<T>`. The asynchronous version is `AsyncGenerator<T>`, and it works the same way — usually inferred from the `yield` statements, so an explicit annotation is optional. `for await...of` then types each item as `T`, exactly as `for...of` does for a synchronous generator.",
      ],
      examples: [
        {
          id: "ts-async-iteration-example",
          title: "A typed async generator, consumed with for await...of",
          ts: `interface Page {
  items: string[];
  nextPage: number | null;
}

async function fetchPage(pageNumber: number): Promise<Page> {
  return { items: ["a", "b"], nextPage: null };
}

// AsyncGenerator<string>: can await inside, yields strings out.
// The annotation is optional — TypeScript infers it from the yields.
async function* allItems(): AsyncGenerator<string> {
  let page: number | null = 1;
  while (page !== null) {
    const response = await fetchPage(page); // response: Page — await unwrapped it
    yield* response.items;                  // yield* accepts any iterable of string
    page = response.nextPage;
  }
}

async function main() {
  for await (const item of allItems()) {
    console.log(item.toUpperCase()); // item: string, fully typed
  }
}`,
          explanation:
            "Note `let page: number | null = 1` — without the annotation TypeScript would infer the narrower `number` from the initialiser and then reject `page = response.nextPage`. That's ordinary inference rather than anything async-specific, but it's the kind of small friction that shows up whenever a loop variable changes type as it goes.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does an async function return?",
      answer:
        "Always a promise, regardless of what the body returns. `return 42` produces a promise fulfilled with 42, returning a promise is flattened rather than nested, and an uncaught throw produces a rejected promise instead of a thrown exception. So callers must still await it or use .then — async doesn't let you hand a plain value back to a synchronous caller.",
    },
    {
      question: "Does await block the thread?",
      answer:
        "No. It suspends only the async function containing it; the call stack unwinds and control returns to the caller, so timers, events and other async functions keep making progress. Everything after an await is effectively the callback of a .then on that promise. Blocking the thread would be something like a busy-wait loop, which genuinely does freeze everything.",
    },
    {
      question: "Why does try/catch work with await when it doesn't work with callbacks?",
      answer:
        "Because a rejected awaited promise throws at the await expression itself, inside the async function, at a point where the enclosing try block is still in scope. With a plain callback the error occurs in a completely different invocation, long after the try block was left, so there's nothing to catch it. The classic exception is a forgotten await: the call is then a floating promise the try block skips past, and its rejection escapes as an unhandled rejection.",
    },
    {
      question: "What's wrong with awaiting several independent operations one after another?",
      answer:
        "They run strictly sequentially, so three 100ms requests take 300ms instead of 100ms — the second isn't even started until the first resolves, because the call sits after an await. Since calling a promise-returning function starts the work immediately, the fix is to start them all first and await afterwards, idiomatically `const [a, b] = await Promise.all([f(), g()])`. Keep sequential awaits only when a step genuinely depends on the previous result.",
    },
    {
      question: "What happens if you pass an async callback to array.forEach?",
      answer:
        "forEach ignores the returned promise entirely — it predates promises — so it calls every callback and returns immediately without waiting for any of them, and any rejection becomes unhandled. Use for...of with await for sequential processing, or Promise.all over array.map when the operations are independent, since map at least collects the promises.",
    },
  ],
  takeaways: [
    "async makes a function return a promise (wrapping returns, converting throws into rejections) and enables await inside it — nothing more.",
    "await unwraps a promise to its value and rethrows its rejection, suspending only that function while the rest of the program continues.",
    "One try/catch/finally now covers a whole sequence of awaits; a missing await turns the call into a floating promise that escapes it.",
    "Consecutive awaits are strictly sequential — start independent operations first and collect them with Promise.all, and never expect forEach to await.",
    "for await...of and async generators (async function*) extend Module 4's iteration protocols to values that arrive over time, consumed lazily one at a time.",
  ],
  status: "available",
};
