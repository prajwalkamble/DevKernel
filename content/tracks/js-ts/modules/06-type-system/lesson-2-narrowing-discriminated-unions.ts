import type { Lesson } from "@/content/types";

export const narrowingLesson: Lesson = {
  id: "type-system-narrowing",
  slug: "type-guards-and-discriminated-unions",
  moduleSlug: "type-system",
  title: "Type Guards & Discriminated Unions",
  summary:
    "How control-flow analysis turns a union into a specific type, the discriminated union pattern that makes it work for objects, exhaustiveness checking with never, and the user-defined guards you write when the built-ins run out.",
  estimatedMinutes: 35,
  objectives: [
    "Narrow unions with typeof, instanceof, in, truthiness and equality checks",
    "Model 'one of these shapes' as a discriminated union instead of optional properties",
    "Prove a switch is exhaustive at compile time using never",
    "Write type predicates and assertion functions, and know what they don't guarantee",
  ],
  sections: [
    {
      id: "control-flow-analysis",
      heading: "Control-flow analysis: the compiler reads your ifs",
      body: [
        "The last lesson ended on a problem: given `string | number` you can't call `toUpperCase`, because the set includes numbers. **Narrowing** is the solution, and it's TypeScript's most quietly impressive feature. The compiler follows the control flow of your code and, inside each branch, removes union members that the branch's condition has ruled out. No syntax required — ordinary JavaScript checks do it.",
        "Five built-in narrowing forms cover almost everything: `typeof x === \"string\"` for primitives, `x instanceof Error` for class instances, `\"radius\" in shape` for object shapes, a plain truthiness check for `null`/`undefined`/empty values, and equality against a literal for discriminants. They compose: an `else` branch gets the complement of the condition, an early `return` narrows everything after it, and `&&` narrows the right-hand side.",
        "It's worth internalising that this is a purely compile-time analysis of the code you wrote. There is no runtime type information involved — `typeof` and `instanceof` are the same JavaScript operators from Module 1, and TypeScript is simply reasoning about what must be true if they returned what they returned.",
      ],
      examples: [
        {
          id: "control-flow-example",
          title: "The five built-in narrowing forms",
          ts: `// 1. typeof — for primitives
function format(value: string | number | boolean) {
  if (typeof value === "string") return value.toUpperCase(); // value: string
  if (typeof value === "number") return value.toFixed(2);    // value: number
  return value ? "yes" : "no";                               // value: boolean
}
console.log(format("hi"), format(3.14159), format(false));

// 2. Truthiness — the everyday null check
function greet(name: string | null | undefined) {
  if (!name) return "Hello, stranger";
  return "Hello, " + name.trim(); // name: string
}
console.log(greet(null), "|", greet("  Ada  "));

// 3. instanceof — for class instances
function describe(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value.trim();
}

// 4. The 'in' operator — for object shapes
function move(animal: { swim(): void } | { fly(): void }) {
  if ("swim" in animal) animal.swim();
  else animal.fly();
}

// 5. Equality against a literal
type Level = "debug" | "info" | "error";
function isSerious(level: Level) {
  if (level === "error") {
    const shouty: "error" = level; // narrowed to the single literal
    return true;
  }
  return false; // level: "debug" | "info"
}

// The classic gotcha: typeof null is "object", so this does NOT exclude null
function badLength(value: string | string[] | null) {
  if (typeof value === "object") {
    return value.length;
    // Error: 'value' is possibly 'null'.
  }
  return value.length;
}

// Narrowing composes with early returns and &&
function firstChar(value: string | null) {
  if (value === null) return "";
  return value[0]; // everything after the return knows value is a string
}
console.log(firstChar("abc"), "|" + firstChar(null) + "|");`,
          explanation:
            "The `typeof null` case is the reason `strictNullChecks` matters so much: TypeScript knows about JavaScript's oldest bug and refuses to let `typeof value === \"object\"` pretend `null` is gone. Adding `value !== null &&` to the condition fixes it — and the compiler will tell you the moment you forget.",
        },
      ],
    },
    {
      id: "discriminated-unions",
      heading: "The discriminated union pattern",
      body: [
        "Narrowing a union of unrelated object types with `in` works, but it's fragile — it depends on the *absence* of a property, so adding a field to one member can silently break the check. The robust version gives every member a shared property whose type is a distinct **literal**, and narrows on that. This is the **discriminated union** (also called a tagged union), and it's the workhorse pattern of practical TypeScript.",
        "The mechanics are simple, but the payoff is large. Because each member's `kind` (or `type`, or `status` — the name is yours) is a single-value literal type, comparing it to a literal eliminates every other member. The compiler then knows exactly which shape you're holding and gives you its specific properties, with an error if you reach for one that belongs to a different variant.",
        "The pattern's real value is in what it makes *impossible to represent*. Compare a discriminated union to the same data modelled with optional fields: the optional version permits `{ status: \"loading\", data: user, error: err }` — loading, with data, and an error, all at once — a state your UI has no idea how to render. The discriminated union simply has no way to spell it. You have already seen this shape twice: `PromiseSettledResult<T>` in Module 5 is exactly this, and so is the `Result<T, E>` type it introduced.",
      ],
      examples: [
        {
          id: "discriminated-unions-example",
          title: "Optional fields vs. a discriminated union",
          ts: `// The version that lets you represent nonsense
interface LooseState {
  status: "loading" | "success" | "error";
  data?: string[];
  error?: Error;
}

const nonsense: LooseState = {
  status: "loading",
  data: ["already here?"],
  error: new Error("and failed too?"), // all three at once — no complaint
};

function renderLoose(state: LooseState) {
  if (state.status === "success") {
    return state.data.join(", ");
    // Error: 'state.data' is possibly 'undefined'.
  }
  return "...";
}

// The version where the impossible state cannot be written down
type State =
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; error: Error };

function render(state: State): string {
  switch (state.status) {
    case "loading":
      return "Loading...";
    case "success":
      return state.data.join(", "); // data is present and NOT optional
    case "error":
      return "Failed: " + state.error.message; // error is present here, data is not
  }
}

console.log(render({ status: "loading" }));
console.log(render({ status: "success", data: ["a", "b"] }));
console.log(render({ status: "error", error: new Error("timeout") }));

// Reaching across variants is a compile error, not a runtime undefined
function wrong(state: State) {
  if (state.status === "loading") {
    console.log(state.data);
    // Error: Property 'data' does not exist on type '{ status: "loading"; }'.
  }
}`,
          explanation:
            "Look at what disappeared: every `?`, and with it every `possibly undefined` check. That's the trade the pattern makes — a little more typing at the declaration in exchange for deleting a whole category of defensive code, plus a compiler that stops you writing states your program can't handle.",
        },
      ],
      pitfalls: [
        {
          title: "The discriminant must be a literal type, not string",
          body: "If a member declares `kind: string` rather than `kind: \"circle\"`, narrowing silently stops working — comparing a `string` to `\"circle\"` rules nothing out, so every branch still sees the full union. This bites most often when the union members are built from object literals whose properties widened (Lesson 1): `const c = { kind: \"circle\", radius: 1 }` has `kind: string`. Annotate the variable, use `as const`, or use `satisfies` so the literal survives.",
        },
      ],
    },
    {
      id: "exhaustiveness",
      heading: "Exhaustiveness checking with never",
      body: [
        "A `switch` over a discriminated union raises an obvious question: what happens when someone adds a fourth variant next year? By default, nothing — the new case falls through, the function returns `undefined`, and you find out from a user. TypeScript can turn that into a compile error instead, using `never`.",
        "Recall from Lesson 1 that `never` is the empty set. Inside the final `default` branch, if every variant has been handled, the narrowed type of the variable is `never` — there's nothing left it could be. So assign it to a `never`-typed parameter: today that compiles, and the day a new member is added, the leftover variant isn't assignable to `never` and the build fails, pointing directly at every `switch` that needs updating.",
        "Two details make this work in practice. Make the function's return type explicit (`: string`), because inference will happily widen to `string | undefined` and hide the missing case. And write the helper to throw as well as fail to compile, so a variant arriving at runtime from unvalidated data — which types can't prevent — fails loudly rather than silently.",
      ],
      examples: [
        {
          id: "exhaustiveness-example",
          title: "assertNever, and what happens when a variant is added",
          ts: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; width: number; height: number };

// Fails to compile if a case is missed, and throws if one slips through at runtime.
function assertNever(value: never): never {
  throw new Error("Unhandled variant: " + JSON.stringify(value));
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "rect":
      return shape.width * shape.height;
    default:
      return assertNever(shape); // shape: never — every variant is handled
  }
}

console.log(area({ kind: "circle", radius: 1 }).toFixed(2));
console.log(area({ kind: "rect", width: 3, height: 4 }));

// Now imagine a colleague adds a variant:
type Shape2 = Shape | { kind: "triangle"; base: number; height: number };

function area2(shape: Shape2): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "rect":
      return shape.width * shape.height;
    default:
      return assertNever(shape);
    // Error: Argument of type '{ kind: "triangle"; base: number; height: number; }'
    //        is not assignable to parameter of type 'never'.
  }
}

// The same trick works outside a switch, via an if/else chain
function label(shape: Shape): string {
  if (shape.kind === "circle") return "circle";
  if (shape.kind === "square") return "square";
  if (shape.kind === "rect") return "rect";
  return assertNever(shape);
}
console.log(label({ kind: "square", side: 2 }));`,
          explanation:
            "The error names the exact variant you forgot — `{ kind: \"triangle\"; ... } is not assignable to 'never'` — which is about as good as a compiler diagnostic gets. Adding a member to a union and letting the build tell you every place that needs attention is the single strongest argument for using discriminated unions over loose objects.",
        },
      ],
      pitfalls: [
        {
          title: "An inferred return type silently defeats the check",
          body: "If you drop the `: number` annotation on `area`, TypeScript infers `number | undefined` for the version with a missing case, the `default` branch never runs, and no error appears until a caller trips over the `undefined` somewhere else. Exhaustiveness checking only works when the function's contract is stated explicitly. The `noImplicitReturns` compiler flag catches a related class of this — a function with some paths returning and some not — and is worth enabling alongside.",
        },
      ],
    },
    {
      id: "type-predicates",
      heading: "Type predicates: teaching the compiler your own checks",
      body: [
        "The built-in narrowing forms only understand built-in operators. Once a check is complex enough to extract into a function, narrowing stops — TypeScript sees a call returning `boolean` and has no idea what that boolean meant. A **type predicate** restores it: annotate the return type as `value is User` instead of `boolean`, and a `true` result now narrows the argument at every call site.",
        "The catch, and it's a big one, is that **a type predicate is a promise, not a proof**. The compiler does not verify that the function body actually checks what the signature claims; `function isUser(v: unknown): v is User { return true; }` compiles perfectly. You are asserting, in exactly the sense `as` asserts, with the same consequences if you're wrong. Keep predicate bodies small and obviously correct, and prefer a schema library at real boundaries — the point Module 5 made about `getJson<T>` applies here too.",
        "TypeScript 5.5 softened this for the simple cases: a function whose body is a single narrowing `return` now gets a predicate inferred, so `const isString = (v: unknown) => typeof v === \"string\"` narrows without you writing the annotation. Explicit predicates are still needed for anything more involved, and remain useful as documentation.",
      ],
      examples: [
        {
          id: "type-predicates-example",
          title: "value is T, and the filter trick",
          ts: `interface User {
  id: number;
  name: string;
}

// Without the predicate, the boolean tells the compiler nothing
function looksLikeUserPlain(value: unknown): boolean {
  return typeof value === "object" && value !== null && "name" in value;
}

function usePlain(value: unknown) {
  if (looksLikeUserPlain(value)) {
    console.log(value.name);
    // Error: 'value' is of type 'unknown'.
  }
}

// With the predicate, the same check narrows at every call site
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string"
  );
}

function use(value: unknown) {
  if (isUser(value)) {
    console.log(value.name.toUpperCase()); // value: User
  }
}
use({ id: 1, name: "Ada" });
use("not a user");

// The most common everyday use: making filter() narrow the array type
const maybeUsers: (User | null)[] = [{ id: 1, name: "Ada" }, null, { id: 2, name: "Lin" }];

const stillNullable = maybeUsers.filter((u) => u !== null);
// Before TypeScript 5.5 this stayed (User | null)[]; a predicate makes it explicit:
const users: User[] = maybeUsers.filter((u): u is User => u !== null);
console.log(users.map((u) => u.name).join(", "));

// Nothing checks that a predicate is honest — this compiles, and lies
function isDefinitelyUser(value: unknown): value is User {
  return true;
}
const lie: unknown = 42;
if (isDefinitelyUser(lie)) {
  // lie: User, according to the compiler
  console.log(typeof lie.name); // undefined at runtime — no error was ever reported
}`,
          explanation:
            "The `filter` line is the predicate you'll write most often. Note the syntax — `(u): u is User => ...` puts the predicate on the *arrow function's* return type, which is what tells `filter`'s overload to produce a `User[]` rather than keeping the nullable element type.",
        },
      ],
    },
    {
      id: "assertion-functions-and-limits",
      heading: "Assertion functions, and where narrowing gives up",
      body: [
        "A type predicate narrows inside an `if`. Sometimes you want the opposite shape: a function that throws if the value is wrong, so everything after the call can assume it's right. That's an **assertion function**, written `asserts value is User`, and it's how `assert`-style helpers and Node's `assert` module are typed.",
        "Assertion functions come with one surprising restriction: the thing you call must have an explicit type annotation. `const assertUser = (v: unknown): asserts v is User => {...}` fails at the call site with 'Assertions require every name in the call target to be declared with an explicit type annotation'. Use a `function` declaration, or annotate the const with a named function type.",
        "Finally, know where narrowing stops. It is an analysis of straight-line code, so it is discarded whenever the compiler can no longer prove the value hasn't changed: a narrowed *property* used inside a callback that might run later, or a `let` that is reassigned somewhere in the function. The fix is almost always the same — copy the narrowed value into a `const` and use that, which gives the compiler something it can reason about.",
      ],
      examples: [
        {
          id: "assertion-functions-example",
          title: "asserts, and rescuing lost narrowing with a const",
          ts: `interface User {
  id: number;
  name: string;
}

function assertIsUser(value: unknown): asserts value is User {
  if (typeof value !== "object" || value === null || !("name" in value)) {
    throw new Error("Not a user");
  }
}

function handle(payload: unknown) {
  assertIsUser(payload);
  console.log(payload.name); // payload: User for the rest of the function — no if needed
}
handle({ id: 1, name: "Ada" });

// The annotation restriction: this arrow function cannot be used as an assertion
const assertIsString = (value: unknown): asserts value is string => {
  if (typeof value !== "string") throw new Error("Not a string");
};

function broken(value: unknown) {
  assertIsString(value);
  // Error: Assertions require every name in the call target to be declared with
  //        an explicit type annotation.
}

// Where narrowing is lost: a property that a later callback could see changed
interface Box {
  label?: string;
}

function schedule(box: Box) {
  if (box.label) {
    setTimeout(() => {
      console.log(box.label.toUpperCase());
      // Error: 'box.label' is possibly 'undefined'.
    }, 0);
  }
}

// The fix: copy the narrowed value into a const the compiler can trust
function scheduleFixed(box: Box) {
  const { label } = box;
  if (label) {
    setTimeout(() => console.log(label.toUpperCase()), 0); // label: string
  }
}
scheduleFixed({ label: "ok" });`,
          explanation:
            "The `setTimeout` error is not the compiler being pedantic — `box.label` genuinely might be reassigned before the callback runs, and TypeScript is refusing to assume otherwise. Destructuring to a `const` snapshots the value, which is both what you meant and what the runtime does.",
        },
      ],
      pitfalls: [
        {
          title: "Narrowing does not survive a reassignment anywhere in scope",
          body: "Control-flow analysis is more conservative for `let` than for `const`. Once a `let` is assigned inside a nested function, TypeScript can no longer prove what it holds at any point where that function could have run, so narrowing on it is discarded — even in branches where you can see it's safe. Preferring `const` (Module 1's advice, for different reasons) pays off here: a `const` binding narrowed once stays narrowed, including inside closures created after the check.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is narrowing, and which checks does TypeScript understand?",
      answer:
        "Narrowing is control-flow analysis: the compiler follows your branches and, inside each one, removes union members the condition has ruled out. It understands typeof for primitives, instanceof for class instances, the in operator for object shapes, truthiness checks for null and undefined, and equality against a literal type. It composes with else branches, early returns and &&. It's entirely compile-time — the operators involved are ordinary JavaScript, and no type information exists at runtime.",
    },
    {
      question: "What is a discriminated union and why prefer it over optional properties?",
      answer:
        "It's a union of object types that all share a property with a distinct literal type — the discriminant — so comparing that property to a literal narrows to exactly one member. Compared with a single type carrying optional fields, it makes impossible states unrepresentable: you cannot write a loading state that also has data and an error. Practically, it removes the possibly-undefined checks that optional fields force on every consumer, and it lets the compiler tell you exactly which properties exist in each branch.",
    },
    {
      question: "How do you get the compiler to tell you when a new union variant is added?",
      answer:
        "Exhaustiveness checking with never. In the default branch of a switch, if every variant has been handled, the narrowed type is never — the empty set. Pass it to a helper declared as function assertNever(value: never): never, which throws. Today it compiles; when someone adds a variant, that variant isn't assignable to never and every unhandled switch fails to build. Two requirements: annotate the function's return type explicitly, since inference would widen to include undefined and hide the gap, and have the helper throw so unvalidated runtime data fails loudly too.",
    },
    {
      question: "What's a type predicate, and what does it guarantee?",
      answer:
        "A function whose return type is written `value is User` instead of boolean, so a true result narrows the argument at the call site — necessary because a plain boolean tells the compiler nothing about what was checked. It guarantees nothing at runtime: TypeScript does not verify the body against the claim, so a predicate that just returns true compiles fine. It's an assertion with better ergonomics, exactly like `as`, so keep the body small and obviously correct, and use a schema validator at real data boundaries. Since 5.5 TypeScript infers predicates for simple single-return narrowing functions.",
    },
    {
      question: "Why does narrowing sometimes disappear inside a callback?",
      answer:
        "Because control-flow analysis can only reason about straight-line code. If you narrow an object property and then use it inside a callback, the compiler can't prove the property hasn't been reassigned before the callback runs, so it discards the narrowing — that's the 'possibly undefined' error inside a setTimeout. The same happens with a let that's assigned inside a nested function. The fix is to copy the narrowed value into a const, usually by destructuring, which snapshots it in a way the compiler can follow.",
    },
  ],
  takeaways: [
    "Narrowing is compile-time control-flow analysis over ordinary JavaScript checks: typeof, instanceof, in, truthiness and literal equality.",
    "A discriminated union — members sharing a literal-typed tag — narrows reliably and makes impossible combinations of state unrepresentable.",
    "Assign the narrowed variable to a never parameter in the default branch to turn a future missing case into a compile error; annotate the return type or the check is defeated.",
    "Type predicates (value is T) and assertion functions (asserts value is T) extend narrowing to your own checks, but neither is verified — they assert, just like as.",
    "Narrowing is discarded when the compiler can't prove the value is unchanged, notably for properties used in callbacks; snapshot into a const to keep it.",
  ],
  status: "available",
};
