import type { Lesson } from "@/content/types";

export const tsAsyncTypesLesson: Lesson = {
  id: "async-ts-types",
  slug: "typing-promises-and-async-functions",
  moduleSlug: "async",
  title: "TypeScript: Typing Promises & Async Functions",
  summary:
    "Promise<T> as just another generic, the Awaited utility that unwraps it, why every caught error is unknown, how to narrow allSettled results — and the honest way to type data arriving from outside your program.",
  estimatedMinutes: 30,
  objectives: [
    "Type async functions and understand what TypeScript infers for you",
    "Use Awaited<T> and ReturnType to derive a resolved type from an existing function",
    "Narrow an unknown catch variable safely, including custom error classes",
    "Type data crossing an API boundary without lying about it",
  ],
  sections: [
    {
      id: "promise-t",
      heading: "Promise<T> is just another generic type",
      body: [
        "There's nothing special about promises in the type system: `Promise<T>` is a generic type exactly like the `Array<T>` and `Map<K, V>` of Module 4, where `T` is the type it eventually fulfills with. `await` unwraps it — `await` on a `Promise<User>` produces a `User` — and TypeScript tracks that automatically.",
        "Async functions have one hard rule: **their annotated return type must be a `Promise<...>`**, because that's what they actually return. Writing `async function getUser(): User` is a compile error with a specific, helpful message. In practice you rarely annotate at all — TypeScript infers `Promise<User>` from the body, which is usually the better choice since the inference stays correct when the body changes.",
        "Worth noticing: `async` is an implementation detail, not part of a function's type. A `Promise<T>`-returning signature can be satisfied either by an `async` function or by an ordinary function that returns a promise — callers cannot tell the difference, and shouldn't need to.",
      ],
      examples: [
        {
          id: "promise-t-example",
          title: "Annotation, inference, and the one error to recognise",
          ts: `interface User {
  id: number;
  name: string;
}

// Explicit — note it must be Promise<User>, never User
async function getUser(id: number): Promise<User> {
  return { id, name: "Ada" }; // the plain object is wrapped automatically
}

async function getUserWrong(id: number): User {
  return { id, name: "Ada" };
}
// Error: The return type of an async function or method must be the global
// Promise<T> type. Did you mean to write 'Promise<User>'?

// Inference is usually enough — no annotation needed
async function getUserInferred(id: number) {
  return { id, name: "Ada" }; // inferred: Promise<{ id: number; name: string }>
}

async function main() {
  const user = await getUser(1);   // user: User — await unwraps the Promise
  console.log(user.name.toUpperCase());

  const notAwaited = getUser(1);   // Promise<User>
  console.log(notAwaited.name);
  // Error: Property 'name' does not exist on type 'Promise<User>'.
  //        Did you forget to use 'await'?
}

// 'async' is not part of the type: both of these satisfy Fetcher
type Fetcher = (id: number) => Promise<User>;

const withAsync: Fetcher = async (id) => ({ id, name: "Ada" });
const withoutAsync: Fetcher = (id) => Promise.resolve({ id, name: "Ada" });`,
          explanation:
            "That second error — 'Did you forget to use await?' — is TypeScript catching the single most common async bug at compile time. It's also why the missing-`await` mistakes from the previous lesson are far rarer in a typed codebase than an untyped one.",
        },
      ],
    },
    {
      id: "awaited-and-inference",
      heading: "Awaited<T>: deriving the resolved type",
      body: [
        "Sometimes you have a promise-returning function and need the type it resolves to — for a variable, a React state hook, or a function that consumes its output. Rather than re-declaring that shape by hand (and letting it drift), derive it: `ReturnType<typeof fn>` gives `Promise<User>`, and **`Awaited<T>`** unwraps it to `User`.",
        "`Awaited` is *recursive*: `Awaited<Promise<Promise<string>>>` is `string`, not `Promise<string>`. That mirrors the runtime, where promises auto-flatten and a genuine promise-of-a-promise cannot exist. It also passes non-promise types straight through, so `Awaited<number>` is just `number` — which makes it safe to apply to anything that might or might not be a promise.",
      ],
      examples: [
        {
          id: "awaited-example",
          title: "Deriving types instead of duplicating them",
          ts: `async function fetchDashboard() {
  return {
    user: { id: 1, name: "Ada" },
    unreadCount: 3,
    lastSeen: new Date(),
  };
}

// The resolved type, derived — it updates automatically when the function does
type Dashboard = Awaited<ReturnType<typeof fetchDashboard>>;
// { user: { id: number; name: string }; unreadCount: number; lastSeen: Date }

function render(dashboard: Dashboard) {
  console.log(dashboard.user.name, dashboard.unreadCount);
}

// Awaited is recursive, and a no-op on non-promises
type A = Awaited<Promise<string>>;                   // string
type B = Awaited<Promise<Promise<number>>>;          // number — not Promise<number>
type C = Awaited<number>;                            // number
type D = Awaited<Promise<string> | number>;          // string | number

// Promise.all preserves a tuple's positions rather than widening to an array
async function loadAll() {
  const results = await Promise.all([
    fetchDashboard(),
    Promise.resolve("a string"),
    Promise.resolve(42),
  ]);
  // results: [Dashboard, string, number] — a TUPLE, so destructuring stays typed
  const [dashboard, text, count] = results;
  console.log(dashboard.user.name, text.toUpperCase(), count.toFixed(0));
}`,
          explanation:
            "`Promise.all` returning a positional tuple rather than a union-typed array is the detail that makes `const [user, orders] = await Promise.all([...])` pleasant to use — each destructured variable keeps its own specific type.",
        },
      ],
    },
    {
      id: "catch-is-unknown",
      heading: "Every caught error is unknown",
      body: [
        "JavaScript lets you `throw` absolutely anything — a string, a number, `undefined`, a plain object. A rejected promise can carry any value too. TypeScript models this honestly: under `strict` (specifically `useUnknownInCatchVariables`, which `strict` turns on and this project enables), a `catch` variable has type **`unknown`**, so `err.message` won't compile until you prove what you're holding.",
        "The idiomatic proof is `err instanceof Error`, which narrows it for the rest of the block. Custom error subclasses — ordinary ES classes from Module 3 — then let you distinguish kinds of failure by `instanceof` rather than by string-matching a message, which is how a `catch` block decides between retrying, showing a 404 page, and giving up.",
      ],
      examples: [
        {
          id: "catch-unknown-example",
          title: "Narrowing unknown, and typed error classes",
          ts: `class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

class TimeoutError extends Error {
  constructor(public readonly ms: number) {
    super("Timed out after " + ms + "ms");
    this.name = "TimeoutError";
  }
}

async function loadUser(id: number): Promise<{ id: number }> {
  if (id < 0) throw new HttpError(404, "User not found");
  if (id === 0) throw new TimeoutError(5000);
  throw "just a string, because JavaScript allows it";
}

async function main() {
  try {
    await loadUser(-1);
  } catch (err) {
    console.log(err.message);
    // Error: 'err' is of type 'unknown'.

    if (err instanceof HttpError) {
      console.log("HTTP", err.status);       // err: HttpError — .status is available
    } else if (err instanceof TimeoutError) {
      console.log("Retry after", err.ms);    // err: TimeoutError
    } else if (err instanceof Error) {
      console.log("Other error:", err.message); // err: Error
    } else {
      console.log("Something non-Error was thrown:", String(err));
    }
  }
}

// A reusable guard for the common case
function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}`,
          explanation:
            "The final `else` branch isn't defensive paranoia — the `throw \"just a string\"` above it is legal JavaScript, and third-party libraries really do reject with plain strings and bare objects. `toError` is the small helper worth keeping around so the rest of your code can assume it has a real `Error`.",
        },
      ],
      pitfalls: [
        {
          title: "instanceof breaks across realms and after transpiling to ES5",
          body: "`instanceof` compares prototype chains, so an `Error` created in a different realm — an iframe, a worker, a Node vm context — fails the check against your realm's constructor. Separately, subclassing built-ins like `Error` was broken when transpiling to ES5 targets, which silently made `err instanceof HttpError` false; modern targets (this project compiles to ES2017) are fine. When either applies, discriminate on a literal property instead — `if (err.name === \"HttpError\")` — or use a discriminated union, as the next section does.",
        },
      ],
    },
    {
      id: "settled-results",
      heading: "Narrowing allSettled with a discriminated union",
      body: [
        "`Promise.allSettled` produces `PromiseSettledResult<T>[]`, and that type is worth reading, because it's a textbook **discriminated union** built into the standard library: `{ status: \"fulfilled\"; value: T } | { status: \"rejected\"; reason: any }`. The `status` property is the discriminant — checking it narrows the object so that `value` is available in one branch and `reason` in the other, with a compile error if you reach for the wrong one.",
        "This pattern generalises. When a function can succeed or fail and you'd rather not use exceptions — because failure is expected rather than exceptional — return a union with a literal discriminant. The compiler then *forces* every caller to check which case they have before touching the payload, which is a guarantee `try`/`catch` can never give you: nothing in a type signature says which exceptions a function might throw.",
      ],
      examples: [
        {
          id: "settled-results-example",
          title: "Built-in narrowing, and your own Result type",
          ts: `interface User {
  id: number;
  name: string;
}

const ok = (u: User): Promise<User> => Promise.resolve(u);
const bad = (): Promise<User> => Promise.reject(new Error("not found"));

async function loadMany() {
  const results = await Promise.allSettled([ok({ id: 1, name: "Ada" }), bad()]);

  for (const result of results) {
    console.log(result.value);
    // Error: Property 'value' does not exist on type 'PromiseSettledResult<User>'.
    //        Property 'value' does not exist on type 'PromiseRejectedResult'.

    if (result.status === "fulfilled") {
      console.log("ok:", result.value.name); // narrowed to PromiseFulfilledResult<User>
    } else {
      console.log("failed:", result.reason); // narrowed to PromiseRejectedResult
      // note: .reason is typed 'any' — the standard library can't know better
    }
  }
}

// The same shape, hand-rolled, for expected failures
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function tryLoadUser(id: number): Promise<Result<User>> {
  try {
    if (id < 0) throw new Error("User not found");
    return { ok: true, value: { id, name: "Ada" } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

async function main() {
  const result = await tryLoadUser(-1);
  if (result.ok) {
    console.log(result.value.name); // only reachable when ok is true
  } else {
    console.log(result.error.message); // only reachable when ok is false
  }
}`,
          explanation:
            "Note that `reason` is typed `any` rather than `unknown` — a rare pragmatic escape hatch in the standard library, and one you should immediately narrow yourself with `instanceof Error`, exactly as in the previous section. Module 6 goes much deeper into discriminated unions and narrowing; this is the async-shaped instance of a pattern used all over TypeScript.",
        },
      ],
    },
    {
      id: "typing-boundaries",
      heading: "The boundary problem: typing data you didn't create",
      body: [
        "Everything so far types values your own code produced. The moment data arrives from outside — an HTTP response, `localStorage`, a message from a worker — the guarantees stop, because **types are erased at compile time and check nothing at runtime**. The DOM's own signature admits this: `response.json()` returns `Promise<any>`, and `any` disables checking on everything it touches.",
        "The tempting fix is a generic wrapper: `async function getJson<T>(url: string): Promise<T>`. Be clear-eyed about what that does — it doesn't validate anything, it just *renames* `any` to whatever `T` the caller asked for. It's an unchecked assertion with better ergonomics, and it will hand you a `User` typed object with `undefined` where `name` should be, failing later and far from the cause.",
        "The honest approach is to type the boundary as `unknown` and pass it through a function that actually inspects the data at runtime, returning the typed value (or throwing). A **type predicate** — `value is User` — is how you connect that runtime check back to the type system. Real projects usually reach for a schema library like Zod, which generates both the check and the type from one declaration, but the principle is identical and worth understanding before adopting the tool.",
      ],
      examples: [
        {
          id: "boundary-example",
          title: "unknown plus a type predicate, instead of a comfortable lie",
          ts: `interface User {
  id: number;
  name: string;
}

// The lie: T is asserted, never verified. Compiles perfectly, fails at runtime.
async function getJsonUnsafe<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}

// The honest version: unknown at the boundary, narrowed by a real check
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "number" &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}

async function getUser(url: string): Promise<User> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status); // fetch does NOT reject on 404 or 500
  }

  const data: unknown = await response.json(); // unknown, not any — nothing is assumed
  if (!isUser(data)) {
    throw new Error("Unexpected response shape from " + url);
  }

  return data; // narrowed to User by the predicate, and genuinely verified
}

async function main() {
  const bad = await getJsonUnsafe<User>("/api/user");
  console.log(bad.name.toUpperCase());
  // Compiles. Throws at runtime if the server sent something else —
  // "Cannot read properties of undefined", far from the real cause.

  const good = await getUser("/api/user"); // fails loudly, at the boundary, if wrong
  console.log(good.name.toUpperCase());
}`,
          explanation:
            "The `response.ok` check deserves its own mention: `fetch` only rejects on a *network* failure, so a 404 or a 500 arrives as a perfectly fulfilled promise whose body is an error page. Combined with `response.json(): Promise<any>`, that's how an HTML error page ends up typed as a `User` — two silent holes closed by four lines of runtime checking.",
        },
      ],
      pitfalls: [
        {
          title: "as is an assertion, not a conversion",
          body: "`data as User` doesn't check, convert or coerce anything — it silences the compiler and produces exactly the same JavaScript. Every `as` on external data is a promise you are making to the compiler, and if the server, the cache or the user disagrees, nothing catches it until something reads a property of undefined several layers away. Reserve assertions for cases where you genuinely know more than the compiler *about your own code*, and validate everything that crosses a boundary.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What return type must an async function have, and what does await do to a type?",
      answer:
        "It must be Promise<T> — annotating an async function as returning a plain User is a compile error, since the function genuinely returns a promise. await performs the inverse: awaiting a Promise<User> gives you a User. In practice you usually let TypeScript infer the return type from the body. Note that async is not part of a function's type, so a Promise<T>-returning signature can be implemented by either an async function or a normal one that returns a promise.",
    },
    {
      question: "What does Awaited<T> do?",
      answer:
        "It recursively unwraps promise types: Awaited<Promise<User>> is User, and Awaited<Promise<Promise<string>>> is string, mirroring the runtime fact that promises auto-flatten. It passes non-promise types through unchanged. It's most useful combined with ReturnType, as Awaited<ReturnType<typeof fetchThing>>, to derive the resolved type of an existing async function instead of hand-writing a duplicate that can drift out of sync.",
    },
    {
      question: "Why is a caught error typed unknown, and how do you work with it?",
      answer:
        "Because JavaScript lets you throw any value at all — strings, numbers, plain objects — so TypeScript can't assume you caught an Error. Under strict mode (useUnknownInCatchVariables) the catch variable is unknown, and accessing .message won't compile. Narrow it with instanceof Error, or with instanceof against your own Error subclasses to distinguish kinds of failure, and keep a final branch for the genuinely non-Error case.",
    },
    {
      question: "How do you get at the values from Promise.allSettled in a type-safe way?",
      answer:
        "By narrowing on the status discriminant. PromiseSettledResult<T> is a built-in discriminated union of { status: 'fulfilled', value: T } and { status: 'rejected', reason: any }, so accessing .value directly is a compile error until you've checked status === 'fulfilled'. It's a good model for your own code: when failure is expected rather than exceptional, return a discriminated union like { ok: true, value } | { ok: false, error } so the compiler forces every caller to handle both cases — something try/catch can never enforce, since exceptions don't appear in type signatures.",
    },
    {
      question: "Is `async function getJson<T>(url: string): Promise<T>` type-safe?",
      answer:
        "No. It performs no validation — it just renames the any that response.json() returns to whatever T the caller requested, which is an unchecked assertion with nicer syntax. If the server returns something else you get a confidently mistyped object that fails later, far from the cause. The honest approach is to type the parsed body as unknown and run it through a real runtime check — a type predicate function, or a schema library like Zod — so the type reflects something that was actually verified. Also remember fetch doesn't reject on 404 or 500, so response.ok needs checking too.",
    },
  ],
  takeaways: [
    "Promise<T> is an ordinary generic; an async function's return type must be Promise<...>, and await unwraps it — usually best left to inference.",
    "Awaited<T> recursively unwraps promise types and, with ReturnType, derives a resolved type from an existing async function instead of duplicating it.",
    "Under strict mode a catch variable is unknown, because anything can be thrown — narrow with instanceof Error or with custom Error subclasses.",
    "PromiseSettledResult is a built-in discriminated union narrowed by its status field; the same shape models expected failure in your own code.",
    "Types vanish at runtime: response.json() is any and fetch doesn't reject on 4xx/5xx, so validate at the boundary with unknown plus a type predicate rather than asserting with as.",
  ],
  status: "available",
};
