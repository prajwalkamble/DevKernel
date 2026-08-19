import type { Lesson } from "@/content/types";

export const errorHandlingLesson: Lesson = {
  id: "patterns-errors",
  slug: "error-handling-architecture",
  moduleSlug: "design-patterns",
  title: "Error Handling Architecture",
  summary:
    "Designing failure properly: custom error classes that carry data, the `cause` chain, why TypeScript types a caught value as `unknown`, and Result types for failures that are not exceptional.",
  estimatedMinutes: 40,
  objectives: [
    "Write custom error classes that subclass Error correctly",
    "Chain errors with `cause` without losing the original",
    "Handle `unknown` in a catch block, and narrow it safely",
    "Model expected failures as values with a Result type",
    "Use exhaustiveness checking so a new error case cannot be forgotten",
    "Decide, per case, whether to throw or to return",
  ],
  sections: [
    {
      id: "throw-errors",
      heading: "Throw Errors, not strings",
      body: [
        "JavaScript lets you throw anything — a string, a number, an object. Do not. Only an `Error` carries a **stack trace**, and without one you have a message and no idea where it came from.",
        "This matters more than it sounds. A thrown string produces a log line with no file, no line number, and no call path. Every debugging session that starts with \"where does this message come from?\" starts with a grep, and the answer is often in a dependency.",
      ],
      examples: [
        {
          id: "throw-error",
          title: "What a non-Error loses",
          js: `try {
  throw "just a string";
} catch (error) {
  console.log("caught non-Error:", typeof error, "| has stack?", error.stack !== undefined);
}`,
          output: `caught non-Error: string | has stack? false`,
          explanation:
            "No stack, and `error.message` is `undefined` too — so any handler written the normal way logs `undefined`. Note that rejected promises are the same thing: `Promise.reject(\"nope\")` is a thrown string wearing async clothing, and `reject(new Error(\"nope\"))` is the fix.",
        },
      ],
    },
    {
      id: "custom-errors",
      heading: "Custom error classes",
      body: [
        "A custom error class lets a handler **branch on the kind of failure** without matching on message text, and lets the error **carry structured data** — which resource, which field, which status code.",
        "Two things must be right. Set `this.name` explicitly, because it defaults to `\"Error\"` and is what appears in stack traces and `toString()`. And call `super(message)` first, or `this` is not available.",
      ],
      examples: [
        {
          id: "error-hierarchy",
          title: "A small hierarchy that carries data",
          js: `class AppError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(\`\${resource} \${id} not found\`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
    this.status = 404;
  }
}

class ValidationError extends AppError {
  constructor(fieldErrors) {
    super("Validation failed");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;    // { email: "must be an email" }
    this.status = 422;
  }
}

const error = new NotFoundError("user", 42);

console.log("message:", error.message);
console.log("name:", error.name);
console.log("instanceof:", error instanceof NotFoundError, error instanceof AppError, error instanceof Error);
console.log("toString:", error.toString());
console.log("stack first line:", error.stack.split("\\n")[0]);`,
          ts: `class AppError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  readonly status = 404;

  constructor(
    readonly resource: string,
    readonly id: string | number
  ) {
    super(\`\${resource} \${id} not found\`);
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  readonly status = 422;

  constructor(readonly fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

// A union makes exhaustive handling checkable — see the last section.
type KnownError = NotFoundError | ValidationError;`,
          output: `message: user 42 not found
name: NotFoundError
instanceof: true true true
toString: NotFoundError: user 42 not found
stack first line: NotFoundError: user 42 not found`,
          explanation:
            "`instanceof` works at all three levels, which is what makes a hierarchy useful: a handler can catch every `AppError` while a more specific one catches only `NotFoundError`. And notice the stack's first line uses `name` — which is exactly why setting it matters.",
        },
      ],
      pitfalls: [
        {
          title: "Subclassing Error breaks when targeting ES5",
          body: "If your `tsconfig` has `\"target\": \"ES5\"`, extending a built-in like `Error` silently breaks `instanceof` — the prototype chain is wrong, and `err instanceof NotFoundError` is `false`. The workaround is `Object.setPrototypeOf(this, new.target.prototype)` in the constructor. Targeting ES2015 or later, which any modern project should, removes the problem entirely.",
        },
      ],
    },
    {
      id: "cause",
      heading: "The cause chain",
      body: [
        "Wrapping a low-level error in a domain-level one is good practice — callers should not have to know about socket errors. Done carelessly it destroys the original, and with it the only information that would have identified the problem.",
        "`new Error(message, { cause })` is the standard way to keep both. The wrapper says what failed in your terms; `error.cause` still holds exactly what went wrong underneath.",
      ],
      examples: [
        {
          id: "cause-example",
          title: "Wrapping without losing",
          js: `const low = new Error("ECONNREFUSED");
const high = new AppError("Could not load profile", { cause: low });

console.log("cause message:", high.cause.message);

// Walking the chain when logging.
function describeChain(error) {
  const parts = [];
  let current = error;
  while (current) {
    parts.push(\`\${current.name}: \${current.message}\`);
    current = current.cause;
  }
  return parts.join("\\n  caused by ");
}

// AppError: Could not load profile
//   caused by Error: ECONNREFUSED`,
          output: `cause message: ECONNREFUSED`,
          explanation:
            "The anti-pattern this replaces is `catch (e) { throw new Error(\"Could not load profile\") }`, which throws away the reason and leaves you with a message that is true and useless. Node's `console.error` prints the cause chain automatically; browsers show it in the expanded error object.",
        },
      ],
    },
    {
      id: "unknown-catch",
      heading: "catch gives you `unknown`",
      body: [
        "Because anything can be thrown, TypeScript types a caught value as **`unknown`** when `useUnknownInCatchVariables` is on — which `strict` turns on. So `error.message` does not compile, and that is correct: you genuinely do not know that it has one.",
        "There are two honest ways through it, and one dishonest one.",
      ],
      examples: [
        {
          id: "catch-narrowing",
          title: "Narrowing a caught value",
          ts: `try {
  await loadProfile();
} catch (error) {
  // error is \`unknown\`
  // console.log(error.message);  -> Error: 'error' is of type 'unknown'

  // 1. instanceof — precise, and lets you branch on your own classes.
  if (error instanceof NotFoundError) {
    show404(error.resource);
  } else if (error instanceof ValidationError) {
    showFieldErrors(error.fieldErrors);
  } else if (error instanceof Error) {
    report(error);
  } else {
    // Something threw a non-Error. Normalise it rather than guessing.
    report(new Error(String(error), { cause: error }));
  }
}

// 2. A normaliser, so the rest of the codebase never sees \`unknown\`.
function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error(JSON.stringify(value) ?? "Unknown error", { cause: value });
}

// 3. The dishonest one: \`catch (error: any)\`. It compiles, and it will
//    throw "Cannot read properties of undefined" in production one day.`,
          explanation:
            "The `else` branch matters more than it looks. Rejected promises from third-party code, `throw` in a library, and cross-realm errors all produce values that are not `instanceof Error` in your realm. A normaliser at the boundary means every layer above it can rely on having a real `Error`.",
        },
      ],
    },
    {
      id: "result",
      heading: "Result types: failures that are not exceptional",
      body: [
        "Exceptions are for the unexpected. A great many failures are entirely expected — a form field is invalid, a search finds nothing, a token has expired. Throwing for those has three costs: the failure is invisible in the signature, the compiler cannot tell you to handle it, and control flow jumps somewhere you did not write.",
        "A **Result type** makes the failure part of the return value. It is a discriminated union, and TypeScript's narrowing does the rest.",
      ],
      examples: [
        {
          id: "result-type",
          title: "The union, and the error it makes impossible",
          ts: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type ParseError = "empty" | "not-a-number";

function parseAge(input: string): Result<number, ParseError> {
  if (input.trim() === "") return { ok: false, error: "empty" };
  const n = Number(input);
  if (Number.isNaN(n)) return { ok: false, error: "not-a-number" };
  return { ok: true, value: n };
}

const r = parseAge("42");

console.log(r.value);
// Error: Property 'value' does not exist on type 'Result<number, ParseError>'.
//   Property 'value' does not exist on type '{ ok: false; error: ParseError; }'.

if (r.ok) {
  console.log(r.value);   // narrowed to the success branch
} else {
  console.log(r.error);   // narrowed to ParseError
}`,
          output: `b.ts(13,15): error TS2339: Property 'value' does not exist on type 'Result<number, ParseError>'.
  Property 'value' does not exist on type '{ ok: false; error: ParseError; }'.`,
          explanation:
            "That is the whole value proposition, and the error message spells it out: you cannot reach the value without first establishing that there is one. The failure is in the signature, so a caller reading `parseAge` knows it can fail and knows exactly how — no documentation, no `@throws` comment that drifted out of date.",
        },
        {
          id: "result-helpers",
          title: "Making it pleasant to use",
          ts: `// Constructors, so call sites read well.
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Mapping over the success case, leaving failures untouched.
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

// Unwrapping with a fallback, when you genuinely do not care why.
function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

// Bridging from a throwing API at the boundary.
async function attempt<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(toError(error));
  }
}

const profile = await attempt(() => loadProfile(id));
if (!profile.ok) return renderError(profile.error);
render(profile.value);`,
          explanation:
            "Note `Result<T, never>` and `Result<never, E>` on the constructors: `never` is assignable to everything, so `ok(5)` fits wherever a `Result<number, ParseError>` is expected without you having to annotate. Libraries such as neverthrow ship all of this; for many codebases the twenty lines above are enough.",
        },
      ],
      pitfalls: [
        {
          title: "Result types are contagious, and that is the point",
          body: "Once a function returns a `Result`, every caller must deal with it — which is the benefit and also the reason not to apply it everywhere. The usual rule: use `Result` for *expected domain failures* at module boundaries, and keep throwing for programmer errors and genuinely exceptional conditions. A `Result<T, OutOfMemoryError>` helps nobody.",
        },
      ],
    },
    {
      id: "exhaustive",
      heading: "Exhaustiveness: the case you forget",
      body: [
        "The failure mode of any error taxonomy is adding a new case and missing a handler. TypeScript can make that a compile error, using `never`.",
        "In a `switch` over a union, the `default` branch is reachable only if some case is unhandled. Assigning the value to `never` there fails to compile precisely when that is true.",
      ],
      examples: [
        {
          id: "exhaustive-check",
          title: "The compiler catching a missing case",
          ts: `type ParseError = "empty" | "not-a-number";

// Fully handled: no default needed, and TypeScript knows the function returns.
function describe(e: ParseError): string {
  switch (e) {
    case "empty":
      return "Please enter something";
    case "not-a-number":
      return "That is not a number";
  }
}

// Now someone adds a case to the union...
type Wider = ParseError | "too-large";

function describe2(e: Wider): string {
  switch (e) {
    case "empty":
      return "a";
    case "not-a-number":
      return "b";
    default: {
      const never: never = e;
      // Error: Type '"too-large"' is not assignable to type 'never'.
      return never;
    }
  }
}`,
          output: `b.ts(30,13): error TS2322: Type '"too-large"' is not assignable to type 'never'.`,
          explanation:
            "The error names the exact case you forgot. This works for any discriminated union — error kinds, action types, state machines — and it is the strongest argument for modelling errors as a union rather than as free-form strings or a bare `Error`. Adding a failure mode becomes a compiler-guided task list.",
        },
      ],
    },
    {
      id: "boundaries",
      heading: "Where to handle things",
      body: [
        "The architectural rule: **catch where you can do something about it.** A `try/catch` that logs and rethrows adds a line to the log and nothing else.",
        "In practice that means three or four places, and nowhere in between. **At the boundary** — the fetch wrapper, the database client — normalise foreign errors into your own types. **In the domain** — return `Result` for expected failures, throw for broken invariants. **At the top** — one handler per entry point that decides what the user sees. **Globally** — `window.onunhandledrejection` and `process.on(\"unhandledRejection\")` as a last net that reports rather than silently swallows.",
        "Two habits are worth enforcing. An empty `catch {}` should never survive review: if a failure is genuinely ignorable, say so in a comment. And a bare `await` inside a loop with no handler will reject the whole loop on the first failure — `Promise.allSettled` is usually what was meant.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why should you always throw an Error rather than a string?",
      answer:
        "Only an `Error` carries a stack trace. A thrown string gives you a message with no file, line or call path, and `error.message` is `undefined`, so handlers written normally log nothing useful. The same applies to `Promise.reject(\"nope\")`, which is a thrown string in async form.",
    },
    {
      question: "What is `error.cause` for?",
      answer:
        "It attaches the original error to a wrapping one: `new AppError(\"Could not load profile\", { cause: low })`. It lets you present a domain-level message without destroying the low-level reason, so logs can show the whole chain. It replaces the common anti-pattern of catching an error and throwing a fresh one that discards what actually happened.",
    },
    {
      question: "Why does TypeScript type a caught value as `unknown`?",
      answer:
        "Because JavaScript allows throwing any value, so nothing guarantees a caught value is an `Error`. Under `strict` (via `useUnknownInCatchVariables`) you must narrow before using it — normally with `instanceof`, or by passing it through a normaliser that returns a real `Error`. Writing `catch (e: any)` restores the old behaviour and the old class of runtime failure.",
    },
    {
      question: "When would you use a Result type instead of throwing?",
      answer:
        "For failures that are expected parts of the domain — invalid input, a missing record, an expired token — especially at module boundaries. It puts the failure in the signature, so callers cannot ignore it and the compiler enforces handling. Keep throwing for programmer errors and genuinely exceptional conditions; `Result` is contagious, so applying it everywhere costs more than it returns.",
    },
    {
      question: "How do you make TypeScript catch a missing error case?",
      answer:
        "Model the cases as a discriminated union and switch over it. In the `default` branch assign the value to a `never` variable — that branch is only reachable if a case is unhandled, so the assignment fails to compile and the error names the missing case. It works for any union: error kinds, action types, state machine states.",
    },
  ],
  takeaways: [
    "Throw `Error` instances only — anything else has no stack trace and no message",
    "Set `this.name` in a custom error class; it is what appears in stack traces and `toString()`",
    "`instanceof` works through a hierarchy, which is what makes error classes better than message matching",
    "Use `{ cause }` to wrap without discarding the original failure",
    "A caught value is `unknown` under strict mode — narrow with `instanceof`, or normalise at the boundary",
    "Model expected domain failures as a `Result` union so the compiler enforces handling",
    "Assign to `never` in the default branch to make a forgotten case a compile error",
    "Catch where you can act; a catch that logs and rethrows only adds noise",
  ],
  status: "available",
};
