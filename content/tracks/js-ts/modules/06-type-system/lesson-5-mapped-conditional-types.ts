import type { Lesson } from "@/content/types";

export const mappedConditionalLesson: Lesson = {
  id: "type-system-mapped-conditional",
  slug: "mapped-and-conditional-types",
  moduleSlug: "type-system",
  title: "Mapped & Conditional Types",
  summary:
    "Building your own utility types: mapping over keys, adding and removing modifiers, remapping and filtering keys, branching with conditional types, distributivity over unions, and pulling types out of other types with infer.",
  estimatedMinutes: 40,
  objectives: [
    "Write mapped types and reimplement Partial, Readonly and Pick from scratch",
    "Add and remove readonly and ? modifiers, and remap or drop keys with as",
    "Use conditional types and control whether they distribute over unions",
    "Extract types from other types with infer, and write a recursive mapped type",
  ],
  sections: [
    {
      id: "mapped-types",
      heading: "Mapped types: a for-loop over keys",
      body: [
        "Every utility type from the previous lesson is written in TypeScript, in a file you can open, using two features. The first is the **mapped type**: `{ [K in keyof T]: T[K] }`, which iterates over each key of `T` and produces a property in the result. Read it as a `for...of` loop that runs in the type system — `K` takes each key in turn, and whatever follows the colon becomes that key's type.",
        "That identity mapping is useless on its own, but every variation is a real utility. Make the value `T[K] | null` and you have a nullable version of the shape. Make it `() => T[K]` and you have a getters object. Put a `?` after the bracket and you've written `Partial` — the actual definition in TypeScript's standard library is one line long.",
        "The source you map over doesn't have to be `keyof T`. Any union of keys works, which is how `Pick` is written: `{ [K in Keys]: T[K] }` where `Keys extends keyof T`. And `Record<K, V>` is the same idea with the value fixed instead of derived. Once you see mapped types, most of the standard library stops being magic.",
      ],
      examples: [
        {
          id: "mapped-types-example",
          title: "Reimplementing the standard library",
          ts: `interface User {
  id: number;
  name: string;
  active: boolean;
}

// The identity mapping — a no-op, but the shape everything else is built from
type Identity<T> = { [K in keyof T]: T[K] };

// Partial, exactly as the standard library defines it
type MyPartial<T> = { [K in keyof T]?: T[K] };
type P = MyPartial<User>; // { id?: number; name?: string; active?: boolean }

// Readonly, likewise
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// Pick maps over a supplied union of keys instead of all of them
type MyPick<T, Keys extends keyof T> = { [K in Keys]: T[K] };
type Creds = MyPick<User, "id" | "name">; // { id: number; name: string }

// Record fixes the value type rather than deriving it
type MyRecord<K extends keyof any, V> = { [P in K]: V };
type Flags = MyRecord<"dark" | "beta", boolean>; // { dark: boolean; beta: boolean }

// Transforming the value type is where mapped types earn their keep
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Getters<T> = { [K in keyof T]: () => T[K] };
type Boxed<T> = { [K in keyof T]: { value: T[K]; dirty: boolean } };

const lazyUser: Getters<User> = {
  id: () => 1,
  name: () => "Ada",
  active: () => true,
};
console.log(lazyUser.name().toUpperCase(), lazyUser.id().toFixed(0));

const form: Boxed<User> = {
  id: { value: 1, dirty: false },
  name: { value: "Ada", dirty: true },
  active: { value: true, dirty: false },
};
console.log(form.name.value, form.name.dirty);

// The mapping is checked: the value type must still make sense
const wrongGetter: Getters<User> = {
  id: () => "1",
  name: () => "Ada",
  active: () => true,
};
// Error: Type 'string' is not assignable to type 'number'.`,
          output: `ADA 1
Ada true`,
          explanation:
            "`Getters<T>` and `Boxed<T>` are the two shapes you'll actually reach for — form state, lazy configuration, change tracking. Each is a single line, stays in sync with `User` automatically, and would be a dozen lines of hand-maintained interface otherwise.",
        },
      ],
    },
    {
      id: "modifiers-and-remapping",
      heading: "Adding, removing and remapping",
      body: [
        "A mapped type can *remove* modifiers as well as add them, using a `-` prefix. `{ -readonly [K in keyof T]-?: T[K] }` strips both `readonly` and `?` — which is precisely how `Required` and the (unnamed, but easy to write) `Mutable` are defined. The `+` prefix exists for symmetry and is the default, so you'll rarely write it.",
        "Since TypeScript 4.1 a mapped type can also **remap the key itself** with an `as` clause: `{ [K in keyof T as NewKey]: T[K] }`. The new key can be computed from `K`, which is how you rename properties wholesale. Template literal types make this genuinely powerful — that's the next lesson — but even without them there's an important trick: **if the computed key is `never`, the property is dropped entirely.** That turns key remapping into key *filtering*.",
        "Filtering by value type is the common case: 'every property of `T` whose type is a function', or 'every property that isn't a function'. Combining a conditional in the `as` clause with `never` gives you that in two lines, and it's the foundation of a lot of library type magic — React's `EventHandler` extraction, Redux selectors, ORM column maps.",
      ],
      examples: [
        {
          id: "mapped-modifiers-example",
          title: "Stripping modifiers, and filtering keys with never",
          ts: `interface Frozen {
  readonly id: number;
  readonly name?: string;
}

// Remove readonly and ? — this is how Required is written
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type Thawed = Mutable<MyRequired<Frozen>>; // { id: number; name: string }

const thawed: Thawed = { id: 1, name: "Ada" };
thawed.id = 2; // fine — readonly was removed
console.log(thawed.id, thawed.name);

// Key remapping: rename every property
type Prefixed<T> = { [K in keyof T as \`data_\${string & K}\`]: T[K] };
type Data = Prefixed<{ id: number }>; // { data_id: number }
const d: Data = { data_id: 7 };
console.log(d.data_id);

// Remapping to never DROPS the property — so 'as' can filter
interface Api {
  url: string;
  timeout: number;
  fetch(): Promise<string>;
  cancel(): void;
}

type MethodsOf<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K];
};
type ApiMethods = MethodsOf<Api>; // { fetch(): Promise<string>; cancel(): void }

type DataOf<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K];
};
type ApiData = DataOf<Api>; // { url: string; timeout: number }

const settings: ApiData = { url: "/v1", timeout: 5000 };
console.log(settings.url, settings.timeout);

const wrong: ApiData = { url: "/v1", timeout: 5000, cancel: () => {} };
// Error: Object literal may only specify known properties, and 'cancel' does not
//        exist in type 'DataOf<Api>'.

// The same trick, but keeping only the KEY names rather than the properties
type MethodNames<T> = keyof MethodsOf<T>; // "fetch" | "cancel"
const names: MethodNames<Api>[] = ["fetch", "cancel"];
console.log(names.join(", "));`,
          output: `2 Ada
7
/v1 5000
fetch, cancel`,
          explanation:
            "`(...args: never[]) => unknown` rather than `Function` is deliberate: it's the safest way to say 'any function' in a conditional, because `never[]` for parameters accepts any parameter list under function-parameter contravariance. `Function` would work here too but carries the same looseness as `any` and is flagged by most lint configurations.",
        },
      ],
      pitfalls: [
        {
          title: "A mapped type over a union distributes, and over an array or tuple it maps elements",
          body: "Mapped types have two special behaviours worth knowing before they surprise you. Applied to a union — `Partial<A | B>` — a *homomorphic* mapped type (one written as `[K in keyof T]`) distributes over the members, giving `Partial<A> | Partial<B>` rather than mapping the union's shared keys. Applied to an array or tuple, it maps the element type and preserves array-ness, so `Readonly<string[]>` is `readonly string[]` rather than an object with numeric keys. Both behaviours are what you want; both are surprising the first time you see them in a hover tooltip.",
        },
      ],
    },
    {
      id: "conditional-types",
      heading: "Conditional types: if-statements for types",
      body: [
        "A **conditional type** is `T extends U ? X : Y`. The `extends` here means *assignable to*, not class inheritance — it's asking 'is every value of `T` also a value of `U`?', which is the subset question from Lesson 1. When the check is on a concrete type it resolves immediately; when it's on an unresolved type parameter it stays *deferred* until the parameter is known.",
        "The behaviour that makes them useful, and confusing, is **distribution**. When the checked type is a bare type parameter and the argument is a union, the conditional is applied to each member separately and the results are unioned back together. So `ToArray<string | number>` is `string[] | number[]`, not `(string | number)[]`. This is exactly how `Exclude<T, U>` works — `T extends U ? never : T` applied member by member, with the `never`s vanishing from the resulting union.",
        "Sometimes distribution is the last thing you want. Wrapping both sides in a one-element tuple — `[T] extends [U] ? X : Y` — makes the checked type no longer a bare parameter, which switches distribution off and compares the union as a whole. That's the standard trick, and it's also the only reliable way to test for `never`: since `never` is the empty union, a distributive conditional over it has no members to distribute to and evaluates to `never` rather than to your branches.",
      ],
      examples: [
        {
          id: "conditional-types-example",
          title: "Distribution, and how to turn it off",
          ts: `// A conditional type asks: is T assignable to U?
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<"hello">; // "yes"
type B = IsString<42>;      // "no"

// Distribution: a bare type parameter applies the check member by member
type ToArray<T> = T extends unknown ? T[] : never;
type Distributed = ToArray<string | number>; // string[] | number[]

// Wrapping in a tuple switches distribution off
type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never;
type NotDistributed = ToArrayWhole<string | number>; // (string | number)[]

const dist: Distributed = ["a", "b"];        // must be all strings OR all numbers
const whole: NotDistributed = ["a", 1];      // may mix
console.log(dist.length, whole.length);

const mixed: Distributed = ["a", 1];
// Error: Type '(string | number)[]' is not assignable to type 'Distributed'.
//        Type '(string | number)[]' is not assignable to type 'number[]'.
//        Type 'string | number' is not assignable to type 'number'.

// Exclude and Extract are just distributive conditionals
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;

type Settled = MyExclude<"idle" | "loading" | "done", "idle" | "loading">; // "done"

// never is the empty union, so a distributive conditional over it produces never
type NaiveIsNever<T> = T extends never ? true : false;
type Surprise = NaiveIsNever<never>; // never — not true!

// The tuple trick is the only reliable never test
type IsNever<T> = [T] extends [never] ? true : false;
type Correct = IsNever<never>;   // true
type AlsoCorrect = IsNever<string>; // false

// Conditionals let a return type depend on an argument type
type Unwrap<T> = T extends (infer Item)[] ? Item : T;
function first<T>(value: T): Unwrap<T> {
  return (Array.isArray(value) ? value[0] : value) as Unwrap<T>;
}
console.log(first([1, 2, 3]).toFixed(0), first("solo").toUpperCase());`,
          output: `2 2
1 SOLO`,
          explanation:
            "`NaiveIsNever<never>` evaluating to `never` rather than `true` is the classic head-scratcher, and it follows directly from the rule: distribution iterates the union's members, and `never` has none, so there is nothing to produce. Any conditional you write should be tested against `never` and against a union before you trust it.",
        },
      ],
    },
    {
      id: "infer",
      heading: "infer: pulling a type out of a type",
      body: [
        "`infer` declares a type variable *inside* the `extends` clause of a conditional type, capturing whatever the compiler had to match there. `T extends Promise<infer Value> ? Value : never` reads as: if `T` is a promise of something, call that something `Value` and return it. It's pattern matching for types, and it's how nearly every extraction utility in the standard library is written.",
        "`ReturnType<T>` is `T extends (...args: never[]) => infer R ? R : never`. `Awaited<T>` is the same idea applied recursively to unwrap nested promises. `Parameters<T>` captures the whole parameter list as a tuple with `infer P`. Reading those four definitions once is the fastest way to make `infer` click.",
        "Two practical notes. `infer` is only legal in the `extends` clause of a conditional type — nowhere else. And when a position could match more than once, the inferences combine: in a covariant position (like a return type) they union, while in a contravariant position (like a parameter) they intersect. You'll meet that most often as the mildly surprising behaviour of inferring from an overloaded function, where TypeScript picks the last overload.",
      ],
      examples: [
        {
          id: "infer-example",
          title: "Writing ReturnType, ElementType and a deep unwrapper",
          ts: `// The standard library's definition, near enough verbatim
type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;

function loadUser(id: number) {
  return { id, name: "Ada" };
}
type User = MyReturnType<typeof loadUser>; // { id: number; name: string }

const user: User = { id: 1, name: "Ada" };
console.log(user.name);

// Capturing the parameter list as a tuple
type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never;
type Args = MyParameters<typeof loadUser>; // [id: number]

// Element type of an array — note infer works inside any structural position
type ElementOf<T> = T extends readonly (infer Item)[] ? Item : never;
type Names = ElementOf<string[]>;              // string
type Mixed = ElementOf<(number | Date)[]>;     // number | Date

// Several infers in one pattern
type Split<T> = T extends [infer Head, ...infer Tail] ? { head: Head; tail: Tail } : never;
type S = Split<[1, "a", true]>; // { head: 1; tail: ["a", true] }

// Recursion: unwrap nested promises the way Awaited does
type DeepAwaited<T> = T extends Promise<infer Inner> ? DeepAwaited<Inner> : T;
type Deep = DeepAwaited<Promise<Promise<Promise<string>>>>; // string

// A constrained infer (TypeScript 4.7+) narrows what may be captured
type FirstString<T> = T extends [infer Head extends string, ...unknown[]] ? Head : never;
type F1 = FirstString<["a", 1]>; // "a"
type F2 = FirstString<[1, "a"]>; // never

// infer is only valid inside a conditional's extends clause
type Illegal<T> = infer U;
// Error: 'infer' declarations are only permitted in the 'extends' clause of a
//        conditional type.

const args: Args = [1];
console.log(loadUser(...args).name);`,
          output: `Ada
Ada`,
          explanation:
            "`Split<T>` is a glimpse of what type-level programming looks like at the deep end: `[infer Head, ...infer Tail]` destructures a tuple type the same way JavaScript destructures an array, and recursing on `Tail` is how libraries implement type-level maps, joins and reverses. Impressive, occasionally necessary, and worth using sparingly.",
        },
      ],
    },
    {
      id: "recursion-and-cost",
      heading: "Recursive types, and knowing when to stop",
      body: [
        "Mapped and conditional types can recurse, which is how you get the deep variants the built-ins don't provide. `DeepReadonly<T>` maps over `T`'s keys and applies itself to any value that is still an object; `DeepPartial<T>` does the same with `?`. Both are about five lines, and both are worth having in a shared types file rather than reinventing per project.",
        "Recursion needs care about what counts as 'still an object'. Arrays, functions, `Date`, `Map` and `Set` are all objects to the type system, so a naïve recursive type will happily map over `Date`'s methods and produce something unusable. A practical implementation checks for functions and primitives first and stops there, and often special-cases arrays so the element type is recursed but the array-ness is kept.",
        "Finally, be aware these types have a **cost**. The compiler evaluates them, caches them, and can be brought to its knees by deeply recursive types over large object graphs — the symptom is a slow editor and, at the limit, the error *Type instantiation is excessively deep and possibly infinite*. TypeScript will recurse about fifty levels for a type alias before giving up. If a type is hard to write, hard to read, and slow to check, that's usually the signal to restructure the data rather than out-clever the compiler.",
      ],
      examples: [
        {
          id: "recursive-types-example",
          title: "DeepReadonly and DeepPartial, done carefully",
          ts: `type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer Item)[]
      ? readonly DeepReadonly<Item>[]
      : { readonly [K in keyof T]: DeepReadonly<T[K]> };

type DeepPartial<T> = T extends Primitive
  ? T
  : T extends readonly (infer Item)[]
    ? DeepPartial<Item>[]
    : { [K in keyof T]?: DeepPartial<T[K]> };

interface AppConfig {
  name: string;
  server: { host: string; ports: number[] };
  features: { flags: { beta: boolean } };
}

const config: DeepReadonly<AppConfig> = {
  name: "app",
  server: { host: "localhost", ports: [80, 443] },
  features: { flags: { beta: true } },
};

console.log(config.server.ports[0], config.features.flags.beta);

config.server.host = "elsewhere";
// Error: Cannot assign to 'host' because it is a read-only property.

config.features.flags.beta = false;
// Error: Cannot assign to 'beta' because it is a read-only property.

// Compare with the shallow built-in, which stops after one level
const shallow: Readonly<AppConfig> = {
  name: "app",
  server: { host: "localhost", ports: [80, 443] },
  features: { flags: { beta: true } },
};
shallow.server.host = "elsewhere"; // allowed — Readonly never reached this far
console.log(shallow.server.host);

// DeepPartial is what a nested-config override actually needs
const override: DeepPartial<AppConfig> = {
  server: { ports: [8080] }, // host omitted, and that's the whole point
};
console.log(JSON.stringify(override));`,
          output: `80 true
elsewhere
{"server":{"ports":[8080]}}`,
          explanation:
            "Note the order of the checks in `DeepReadonly`: primitives first, then functions, then arrays, and only then the object mapping. Get that order wrong — put the object mapping first — and the type will try to map over the internals of every `Date` and function it meets, producing types that are technically valid and practically useless.",
        },
      ],
      pitfalls: [
        {
          title: "Deep utility types make errors much harder to read",
          body: "When a `DeepPartial<AppConfig>` assignment fails, the compiler reports the mismatch in terms of the fully-expanded computed type, which can run to dozens of lines of nested conditionals. That's a genuine cost, not a detail: a team that can't read its own type errors stops trusting them. Reach for a named intermediate type (`type ServerOverride = DeepPartial<AppConfig[\"server\"]>`) at the point of use, which keeps error messages anchored to a name a human wrote.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a mapped type, and how would you write Partial yourself?",
      answer:
        "A mapped type iterates over a union of keys and produces a property for each: { [K in keyof T]: T[K] }. Partial is that with an optional marker — type MyPartial<T> = { [K in keyof T]?: T[K] } — which is essentially the standard library's own definition. The key source doesn't have to be keyof T: Pick maps over a supplied union of keys, and Record maps over a key union with a fixed value type. Transforming the value is where they earn their keep, as in Getters<T> = { [K in keyof T]: () => T[K] }.",
    },
    {
      question: "How do you remove a readonly or optional modifier, and how do you drop a key entirely?",
      answer:
        "Prefix the modifier with a minus: { -readonly [K in keyof T]-?: T[K] } strips both. To drop keys, use the `as` remapping clause added in 4.1 — { [K in keyof T as Condition]: T[K] } — and remap to never for keys you want gone, since a property with key never is omitted from the result. Combining that with a conditional gives you filters like 'only the function-valued properties' in two lines.",
    },
    {
      question: "What does it mean for a conditional type to distribute, and how do you stop it?",
      answer:
        "When the checked type is a bare type parameter and it receives a union, the conditional is applied to each member independently and the results are unioned, so ToArray<string | number> is string[] | number[] rather than (string | number)[]. That's what makes Exclude work: T extends U ? never : T applied member by member, with the nevers disappearing. To compare the union as a whole instead, wrap both sides in a tuple: [T] extends [U] ? X : Y. That's also the only reliable way to test for never, because never is the empty union and a distributive conditional over it has no members to produce.",
    },
    {
      question: "What does infer do?",
      answer:
        "It declares a type variable inside a conditional type's extends clause that captures whatever matched at that position — pattern matching for types. ReturnType is T extends (...args: never[]) => infer R ? R : never, ElementOf is T extends readonly (infer Item)[] ? Item : never, and Awaited recurses on the inferred type to unwrap nested promises. It's only legal inside a conditional's extends clause. Since 4.7 an infer can carry its own constraint, as in infer Head extends string.",
    },
    {
      question: "What are the costs of deeply recursive type utilities?",
      answer:
        "Three. Compile and editor performance — the checker evaluates these types, and deep recursion over a large object graph can make an IDE crawl, with 'Type instantiation is excessively deep and possibly infinite' at the limit. Correctness — a naive recursive type will happily map over the internals of Date, Map or a function, so you need explicit primitive, function and array cases first. And readability — a failed DeepPartial assignment reports the mismatch against the fully expanded type, which can be dozens of lines. Naming intermediate types helps with the last one.",
    },
  ],
  takeaways: [
    "A mapped type { [K in keyof T]: ... } is a loop over keys; Partial, Readonly, Pick and Record are each one line of it.",
    "The - prefix removes readonly and ? modifiers, and an `as` clause remaps keys — remapping to never drops the property, which turns remapping into filtering.",
    "Conditional types distribute over unions when the checked type is a bare parameter; wrap both sides in tuples to compare the union as a whole, which is also the only reliable never test.",
    "infer captures a type from inside an extends clause and is how ReturnType, Parameters, ElementOf and Awaited are all written.",
    "Recursive mapped types give you DeepReadonly and DeepPartial, but need explicit primitive/function/array cases and cost real compile time and error readability.",
  ],
  status: "available",
};
