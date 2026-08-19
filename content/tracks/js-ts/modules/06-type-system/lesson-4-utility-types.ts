import type { Lesson } from "@/content/types";

export const utilityTypesLesson: Lesson = {
  id: "type-system-utility-types",
  slug: "built-in-utility-types",
  moduleSlug: "type-system",
  title: "Built-in Utility Types",
  summary:
    "Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, NonNullable, Parameters, ReturnType and friends — what each one does, which are shallow, and the one with a hole in its type checking.",
  estimatedMinutes: 30,
  objectives: [
    "Derive related types from a single source of truth instead of duplicating shapes",
    "Choose correctly between Pick and Omit, and know why only one catches typos",
    "Use Record to build key-value types that the compiler can check for completeness",
    "Extract argument, return and instance types from existing functions and classes",
  ],
  sections: [
    {
      id: "why-derive",
      heading: "Derive, don't duplicate",
      body: [
        "Real applications have families of closely related types. There's a `User` as stored in the database, a `User` as returned by the API without the password hash, a `User` as accepted by the create endpoint without an id, and a `User` as accepted by the update endpoint where every field is optional. Written out by hand, that's four shapes that must be kept in sync forever, and they will drift.",
        "**Utility types** are the standard library's answer: generic types that transform an existing type into a related one. Change the source, and every derived type updates. They aren't magic — every one of them is a mapped or conditional type written in ordinary TypeScript, which is exactly what the next lesson shows you how to build. Learning the built-ins first is worthwhile because they cover most of what you'll ever need, and because they establish the vocabulary that libraries use in their own signatures.",
        "One habit to adopt with them: derive from the *most complete* type. Make the database shape the source of truth and subtract from it, rather than defining the API shape and adding. Subtraction fails loudly when you remove a field that no longer exists; addition silently allows the two to diverge.",
      ],
      examples: [
        {
          id: "why-derive-example",
          title: "One source of truth, four derived shapes",
          ts: `interface User {
  id: number;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
}

// What the API returns — never the password hash
type PublicUser = Omit<User, "passwordHash">;

// What the create endpoint accepts — the server assigns id and createdAt
type CreateUserInput = Omit<User, "id" | "createdAt">;

// What the update endpoint accepts — any subset of the editable fields
type UpdateUserInput = Partial<Omit<User, "id" | "createdAt" | "passwordHash">>;

// A read-only snapshot for a render function that must not mutate
type UserView = Readonly<PublicUser>;

const publicUser: PublicUser = {
  id: 1,
  email: "ada@example.com",
  displayName: "Ada",
  createdAt: new Date(),
};

const update: UpdateUserInput = { displayName: "Ada L." }; // email omitted — fine

function render(user: UserView) {
  user.displayName = "nope";
  // Error: Cannot assign to 'displayName' because it is a read-only property.
  return user.displayName;
}

console.log(render(publicUser), JSON.stringify(update));`,
          explanation:
            "Add a `deletedAt` field to `User` and all four derived types learn about it immediately — `PublicUser` gains it, `UpdateUserInput` gains it as optional. Add a field to four hand-written interfaces instead and you find out which one you missed in production.",
        },
      ],
    },
    {
      id: "property-modifiers",
      heading: "Partial, Required, Readonly — and how shallow they are",
      body: [
        "Three utilities change property *modifiers* across a whole type. **`Partial<T>`** makes every property optional, which is the shape of a patch or an options bag. **`Required<T>`** does the reverse, and does slightly more than remove `?` — it also strips `undefined` from the property's type, so `name?: string | undefined` becomes `name: string`. **`Readonly<T>`** marks every property `readonly`.",
        "All three are **shallow**. `Partial<Config>` makes `Config`'s own properties optional but leaves any nested object exactly as it was, so `Partial<{ db: { host: string } }>` still demands a complete `db` object if you supply one at all. This is the single most common surprise with utility types, and it's why deep variants show up in every codebase eventually — you can write one yourself with a recursive mapped type, which Lesson 5 covers.",
        "Be clear-eyed about `readonly` too: it is a **compile-time** marker with no runtime effect whatsoever. It stops your code from assigning through that reference; it does not freeze the object, and any other reference to the same object can still mutate it freely. `Object.freeze` is the runtime tool, and TypeScript types its return as `Readonly<T>` precisely because the two go together.",
      ],
      examples: [
        {
          id: "property-modifiers-example",
          title: "Optional, required, readonly — one level deep",
          ts: `interface Config {
  host: string;
  port?: number;
  db: { url: string; poolSize: number };
}

type PartialConfig = Partial<Config>;
// { host?: string; port?: number; db?: { url: string; poolSize: number } }

const patch: PartialConfig = { host: "localhost" }; // fine

const shallowSurprise: PartialConfig = { db: { url: "postgres://..." } };
// Error: Property 'poolSize' is missing in type '{ url: string; }' but required
//        in type '{ url: string; poolSize: number; }'.

// Required removes '?' AND removes undefined from the property type
type StrictConfig = Required<Config>;
// { host: string; port: number; db: { url: string; poolSize: number } }

const full: StrictConfig = { host: "h", db: { url: "u", poolSize: 1 } };
// Error: Property 'port' is missing in type '{ host: string; db: { url: string;
//        poolSize: number; }; }' but required in type 'Required<Config>'.

// Readonly is compile-time only, and also shallow
const frozen: Readonly<Config> = {
  host: "localhost",
  db: { url: "u", poolSize: 1 },
};

frozen.host = "elsewhere";
// Error: Cannot assign to 'host' because it is a read-only property.

frozen.db.poolSize = 99; // no error at all — Readonly did not reach the nested object
console.log(frozen.db.poolSize);

// The runtime counterpart, whose return type is Readonly<T>
const reallyFrozen = Object.freeze({ host: "localhost" });
console.log(Object.isFrozen(reallyFrozen));`,
          output: `99
true`,
          explanation:
            "`frozen.db.poolSize = 99` compiling is the whole lesson about shallowness in one line. `Readonly<Config>` said 'you may not replace `db`'; it never said anything about `db`'s own properties, because a mapped type only visits the top level unless you write it to recurse.",
        },
      ],
      pitfalls: [
        {
          title: "Partial<T> as a function parameter loses every guarantee",
          body: "It's tempting to type an options object as `Partial<Options>` and merge it with defaults. That works, but note what the signature now permits: `{}`. If some of those options are genuinely required, `Partial` has thrown away the compiler's ability to say so, and the failure moves to runtime. Prefer spelling out which fields are optional — or `Omit<Options, \"a\" | \"b\"> & Partial<Pick<Options, \"a\" | \"b\">>` when you need a precise mix — over blanket `Partial`.",
        },
      ],
    },
    {
      id: "pick-omit-record",
      heading: "Pick, Omit and Record",
      body: [
        "**`Pick<T, K>`** keeps only the listed keys; **`Omit<T, K>`** keeps everything else. They're complements, and the choice between them is a maintenance decision rather than a stylistic one: `Pick` is a whitelist that stays stable when `T` grows, while `Omit` is a blacklist where new fields on `T` are automatically included. For an API response that must never leak a new secret field, `Pick` is the safer default.",
        "There is one genuine wart to know about. **`Omit`'s key parameter is not constrained to `keyof T`** — its signature is `Omit<T, K extends keyof any>` — so `Omit<User, \"pasword\">` compiles happily and silently omits nothing. `Pick<User, \"pasword\">` is an error. This asymmetry exists for backwards compatibility with types that have index signatures, and it has bitten essentially every TypeScript codebase at least once. If it matters, write a stricter alias: `type StrictOmit<T, K extends keyof T> = Omit<T, K>`.",
        "**`Record<K, V>`** builds an object type from a key union and a value type. Its power depends entirely on `K`: `Record<string, User>` is just a dictionary that promises nothing, while `Record<Role, Permission[]>` over a literal union requires every role to be present, turning a forgotten case into a compile error. That's the pattern from Lesson 1, and it's the reason to prefer literal unions over bare `string` wherever a fixed set of keys exists.",
      ],
      examples: [
        {
          id: "pick-omit-record-example",
          title: "Whitelist, blacklist, and the Omit hole",
          ts: `interface User {
  id: number;
  email: string;
  displayName: string;
  passwordHash: string;
}

type Credentials = Pick<User, "email" | "passwordHash">;
type SafeUser = Omit<User, "passwordHash">;

const creds: Credentials = { email: "ada@example.com", passwordHash: "..." };
console.log(Object.keys(creds).join(", "));

// Pick validates its keys...
type Typo = Pick<User, "displayNmae">;
// Error: Type '"displayNmae"' does not satisfy the constraint 'keyof User'.

// ...but Omit does not. This compiles, and removes nothing.
type SilentTypo = Omit<User, "passwordHsah">;
const leaked: SilentTypo = {
  id: 1,
  email: "ada@example.com",
  displayName: "Ada",
  passwordHash: "still here",
};
console.log("passwordHash" in leaked);

// A stricter alias, if you want the typo caught
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type Caught = StrictOmit<User, "passwordHsah">;
// Error: Type '"passwordHsah"' does not satisfy the constraint 'keyof User'.

// Record over a literal union demands every key
type Role = "admin" | "editor" | "viewer";

const permissions: Record<Role, string[]> = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
};
// Error: Property 'viewer' is missing in type '{ admin: string[]; editor:
//        string[]; }' but required in type 'Record<Role, string[]>'.

// Record over string is a dictionary that guarantees nothing about its keys
const cache: Record<string, number> = {};
cache.anything = 1;
console.log(cache.neverSet); // typed number, but undefined at runtime`,
          output: `email, passwordHash
true
undefined`,
          explanation:
            "The last line is worth pausing on. `Record<string, number>` tells the compiler every string key holds a `number`, which is false for every key you haven't set — reading a missing one gives `undefined` with no warning. The `noUncheckedIndexedAccess` compiler flag fixes exactly this by typing such reads as `number | undefined`; it's off by default because it's noisy, and worth turning on anyway.",
        },
      ],
    },
    {
      id: "union-utilities",
      heading: "Exclude, Extract and NonNullable: filtering unions",
      body: [
        "Three utilities operate on unions rather than object shapes. **`Exclude<T, U>`** removes from `T` every member assignable to `U`; **`Extract<T, U>`** keeps only those members; **`NonNullable<T>`** is `Exclude<T, null | undefined>` under a friendlier name.",
        "They're most useful for deriving a narrower union from a wider one you don't control — the subset of event names your handler supports, the non-error states of a status union, the members of a discriminated union with a particular tag. Because they filter by *assignability* rather than by identity, `Extract<Shape, { kind: \"circle\" }>` pulls the whole circle variant out of a discriminated union, which is a genuinely useful trick.",
        "All three are built on conditional types, and they inherit conditional types' *distributive* behaviour: the condition is applied to each union member separately rather than to the union as a whole. That's what makes them work at all, and it's the mechanism the next lesson takes apart.",
      ],
      examples: [
        {
          id: "union-utilities-example",
          title: "Filtering unions, including discriminated ones",
          ts: `type Status = "idle" | "loading" | "success" | "error";

type Settled = Exclude<Status, "idle" | "loading">; // "success" | "error"
type Busy = Extract<Status, "loading" | "pending">; // "loading" — "pending" isn't in Status

function report(status: Settled): string {
  return "settled: " + status;
}
console.log(report("success"));
report("loading");
// Error: Argument of type '"loading"' is not assignable to parameter of type 'Settled'.

// NonNullable is the one you'll use daily
type MaybeName = string | null | undefined;
type Name = NonNullable<MaybeName>; // string

function shout(name: Name) {
  return name.toUpperCase();
}
console.log(shout("ada"));

// Extract pulls a whole variant out of a discriminated union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; width: number; height: number };

type Circle = Extract<Shape, { kind: "circle" }>; // { kind: "circle"; radius: number }
type NotCircle = Exclude<Shape, { kind: "circle" }>; // square | rect

function circleArea(circle: Circle) {
  return Math.PI * circle.radius ** 2;
}
console.log(circleArea({ kind: "circle", radius: 2 }).toFixed(2));

// Deriving the tag union from the shape union, rather than repeating it
type ShapeKind = Shape["kind"]; // "circle" | "square" | "rect"
const kinds: ShapeKind[] = ["circle", "square", "rect"];
console.log(kinds.join(" "));`,
          output: `settled: success
ADA
12.57
circle square rect`,
          explanation:
            "`Shape[\"kind\"]` deserves a mention of its own: indexed access on a union distributes over the members, so it collects each variant's `kind` into a union. That's how you get a list of tags that can never fall out of sync with the union it came from.",
        },
      ],
    },
    {
      id: "function-and-class-utilities",
      heading: "Reading types off functions and classes",
      body: [
        "The last group extracts types from things that already exist. **`ReturnType<typeof fn>`** gives what a function returns, **`Parameters<typeof fn>`** gives its arguments as a *tuple*, and `Awaited<T>` (Module 5) unwraps a promise — the three combine into `Awaited<ReturnType<typeof loadUser>>` for 'whatever that async function resolves to'. For classes, **`InstanceType<typeof Cls>`** and `ConstructorParameters<typeof Cls>` do the same job.",
        "Note the `typeof` in every one of those. These utilities take types, and a function or class name used in an expression position is a value, so `typeof` is what bridges the two. `ReturnType<loadUser>` is an error; `ReturnType<typeof loadUser>` is what you meant.",
        "The best use of `Parameters` is forwarding: a wrapper that logs, retries or memoises another function can declare `(...args: Parameters<typeof original>)` and stay correct when the original's signature changes. It's the difference between a wrapper you have to maintain and one you don't.",
      ],
      examples: [
        {
          id: "function-utilities-example",
          title: "ReturnType, Parameters, InstanceType",
          ts: `async function loadUser(id: number, options: { fresh: boolean }) {
  return { id, name: "Ada", fresh: options.fresh };
}

type LoadUserArgs = Parameters<typeof loadUser>;
// [id: number, options: { fresh: boolean }] — a tuple, with parameter names kept

type LoadUserResult = ReturnType<typeof loadUser>;         // Promise<{...}>
type User = Awaited<ReturnType<typeof loadUser>>;          // the resolved shape

function show(user: User) {
  console.log(user.name, user.fresh);
}

// The payoff: a wrapper that never needs updating when loadUser changes
function withLogging<Args extends unknown[], R>(fn: (...args: Args) => R) {
  return (...args: Args): R => {
    console.log("calling with", args.length, "args");
    return fn(...args);
  };
}

const loggedLoad = withLogging(loadUser);
loggedLoad(1, { fresh: true }).then(show);

// A tuple type means you can spread a stored argument list back in
const savedArgs: LoadUserArgs = [2, { fresh: false }];
loadUser(...savedArgs).then(show);

// typeof is required — these utilities take types, not values
type Wrong = ReturnType<loadUser>;
// Error: 'loadUser' refers to a value, but is being used as a type here.
//        Did you mean 'typeof loadUser'?

// Classes: the instance type and the constructor's argument tuple
class Repository {
  constructor(
    private readonly url: string,
    private readonly retries: number
  ) {}
  describe() {
    return this.url + " x" + this.retries;
  }
}

type Repo = InstanceType<typeof Repository>;           // Repository
type RepoArgs = ConstructorParameters<typeof Repository>; // [url: string, retries: number]

const args: RepoArgs = ["postgres://localhost", 3];
const repo: Repo = new Repository(...args);
console.log(repo.describe());`,
          explanation:
            "`withLogging` is the pattern worth memorising. Capturing the argument list as a generic tuple `Args extends unknown[]` and spreading it back gives a wrapper that is fully typed for any function — the same technique the decorator example in Lesson 6 uses, and the reason `Parameters` exists at all.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why derive types with utility types instead of writing each one out?",
      answer:
        "Because related shapes drift. An application typically has a database entity, a public API version, a create input and an update input; hand-written, all four must be updated together every time a field changes, and eventually one isn't. Deriving them with Omit, Pick and Partial from a single source of truth means adding a field updates every derived type at once. Prefer subtracting from the most complete type over adding to a smaller one, since subtraction fails loudly if the field disappears.",
    },
    {
      question: "What's the difference between Pick and Omit, and is either unsafe?",
      answer:
        "Pick<T, K> is a whitelist and Omit<T, K> is a blacklist, so when T gains a field, Pick's result is unchanged while Omit's automatically includes it — which is why Pick is safer for API response types that must not leak new fields. And yes, Omit has a real hole: its key parameter is constrained to keyof any rather than keyof T, so Omit<User, 'pasword'> compiles and removes nothing, whereas the same typo in Pick is an error. Wrapping it as type StrictOmit<T, K extends keyof T> = Omit<T, K> closes the gap.",
    },
    {
      question: "Are Partial and Readonly deep?",
      answer:
        "No, both are shallow — they map over the top-level properties only. Partial<{ db: { host: string; port: number } }> makes db optional but still requires a complete db object if you provide one, and Readonly stops you replacing db while leaving db.host freely assignable. Deep versions require a recursive mapped type, which you have to write yourself. Also remember readonly is purely compile-time and doesn't freeze anything at runtime; Object.freeze is the runtime counterpart, and its return type is Readonly<T>.",
    },
    {
      question: "What makes Record<K, V> useful, and when is it not?",
      answer:
        "Its usefulness comes entirely from K. Over a literal union, Record<Role, Permission[]> requires an entry for every role, so forgetting one is a compile error — an exhaustiveness check you get for free. Over string, Record<string, number> is just a dictionary: it claims every key holds a number, which is false for keys you never set, so reads of missing keys are typed number but are undefined at runtime. The noUncheckedIndexedAccess flag types those reads as number | undefined and fixes the unsoundness.",
    },
    {
      question: "How do you type a wrapper that forwards to another function?",
      answer:
        "Capture the signature generically: function withLogging<Args extends unknown[], R>(fn: (...args: Args) => R) and return (...args: Args): R. The wrapper then stays correct automatically when the wrapped function's signature changes. When you need the types of a specific existing function rather than a generic one, Parameters<typeof fn> gives its arguments as a labelled tuple and ReturnType<typeof fn> gives its result — combined with Awaited for async functions. The typeof is required because these utilities take types, and a function name in expression position is a value.",
    },
  ],
  takeaways: [
    "Derive related shapes from one source of truth with Omit, Pick and Partial rather than maintaining parallel interfaces that drift apart.",
    "Partial, Required and Readonly change modifiers one level deep only, and readonly is a compile-time marker with no runtime effect.",
    "Pick validates its keys but Omit does not — Omit<T, 'typo'> silently removes nothing, so wrap it when correctness matters.",
    "Record over a literal union enforces that every key is present; Record over string promises something about keys that were never set.",
    "Parameters, ReturnType, InstanceType and ConstructorParameters read types off existing values — all need typeof, since they take types rather than values.",
  ],
  status: "available",
};
