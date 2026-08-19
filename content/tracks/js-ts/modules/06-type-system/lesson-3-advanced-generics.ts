import type { Lesson } from "@/content/types";

export const advancedGenericsLesson: Lesson = {
  id: "type-system-advanced-generics",
  slug: "advanced-generics",
  moduleSlug: "type-system",
  title: "Advanced Generics: Constraints, keyof & Inference",
  summary:
    "Constraining a type parameter with extends, reading keys with keyof and indexed access, understanding where inference gets its information — and recognising the generics that are really an any in disguise.",
  estimatedMinutes: 35,
  objectives: [
    "Constrain type parameters with extends, including constraints that refer to other parameters",
    "Use keyof and indexed access types to write property-safe helpers",
    "Predict what TypeScript will infer, and control it with const type parameters and NoInfer",
    "Recognise return-type-only generics and other signatures that provide no safety",
  ],
  sections: [
    {
      id: "constraints",
      heading: "Constraints: what a type parameter is allowed to be",
      body: [
        "Modules 2 and 4 introduced generic functions and classes. An unconstrained `T` is maximally flexible and maximally useless inside the function: since `T` could be anything, you can't access a property, call a method, or index into it. A **constraint** — `<T extends Something>` — narrows what callers may supply, and in exchange tells the body what it's allowed to do.",
        "The subtlety that catches people is that **a constraint is a lower bound, not the type itself**. `T extends { length: number }` means every `T` has at least a `length`, but a particular call might supply a `string`, an `Array`, or a bespoke object with twenty other fields — and `T` is that specific type, not the constraint. So you may *read* `length` from a `T`, but you may not *construct* a `T` from an object that merely satisfies the constraint. The compiler's error message for this spells out the reasoning almost apologetically.",
        "Constraints can also reference other type parameters, which is what makes signatures like `<T, K extends keyof T>` possible. That's the next section, and it's where generics stop being a way to avoid `any` and start being a way to express relationships between arguments.",
      ],
      examples: [
        {
          id: "constraints-example",
          title: "A constraint enables reads, not construction",
          ts: `// Unconstrained: nothing is knowable about T inside the body
function sizeOf<T>(value: T): number {
  return value.length;
  // Error: Property 'length' does not exist on type 'T'.
}

// Constrained: every T is now known to have a length
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

console.log(longest("hello", "hi"));         // T inferred as string
console.log(longest([1, 2, 3], [1]).length); // T inferred as number[]
console.log(longest({ length: 5, unit: "cm" }, { length: 2, unit: "cm" }).unit);

// The key insight: T is the caller's type, not the constraint
function mistaken<T extends { length: number }>(value: T): T {
  return { length: 0 };
  // Error: Type '{ length: number; }' is not assignable to type 'T'.
  //        '{ length: number; }' is assignable to the constraint of type 'T', but
  //        'T' could be instantiated with a different subtype of constraint
  //        '{ length: number; }'.
}
// ...and it's right: mistaken("abc") promises a string back, and { length: 0 }
// is not a string.

// Constraints compose with unions and with other named types
function firstKey<T extends object>(value: T) {
  return Object.keys(value)[0];
}
console.log(firstKey({ a: 1, b: 2 }));

// A constraint of never is occasionally useful for banning a case outright
function onlyArrays<T extends readonly unknown[]>(items: T): number {
  return items.length;
}
console.log(onlyArrays([1, 2, 3]));`,
          explanation:
            "That second error is worth reading twice, because it explains the whole rule: `T` could be instantiated with a *different subtype* of the constraint. Whenever you find yourself wanting to return a freshly-built object from a generic function, the honest signature usually returns the constraint type rather than `T`.",
        },
      ],
    },
    {
      id: "keyof-and-indexed-access",
      heading: "keyof and indexed access: types that follow your data",
      body: [
        "**`keyof T`** produces the union of `T`'s property names as literal types: for `{ id: number; name: string }` it's `\"id\" | \"name\"`. **Indexed access**, `T[K]`, goes the other way and produces the type of a property: `User[\"name\"]` is `string`. Together they let a signature say something no fixed type can — *this argument is a key of that argument, and the return type is whatever that key holds*.",
        "The canonical example is a typed `get`. Written as `get(obj: object, key: string): any` it's worse than useless; written as `<T, K extends keyof T>(obj: T, key: K): T[K]` it rejects misspelled keys at compile time and returns the precisely correct type for each one. The same shape underpins `Object.entries` wrappers, ORM column selectors, form field helpers and every 'pluck these properties' utility you'll ever write.",
        "A few `keyof` behaviours are worth knowing before they surprise you. `keyof` on a type with an index signature includes `string | number`, not a useful union. `keyof any` is `string | number | symbol` — the set of everything usable as a key, which is why you'll see it as a constraint in the standard library. And indexed access accepts a union: `User[\"id\" | \"name\"]` is `number | string`, which is how `T[keyof T]` gives you 'the type of any value in `T`'.",
      ],
      examples: [
        {
          id: "keyof-example",
          title: "A typed get, and the shapes keyof produces",
          ts: `interface User {
  id: number;
  name: string;
  active: boolean;
}

type UserKey = keyof User;        // "id" | "name" | "active"
type NameType = User["name"];     // string
type AnyValue = User[keyof User]; // number | string | boolean

// The relationship a fixed signature cannot express
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "Ada", active: true };

const id = get(user, "id");         // number
const name = get(user, "name");     // string
console.log(id.toFixed(0), name.toUpperCase());

get(user, "nmae");
// Error: Argument of type '"nmae"' is not assignable to parameter of type 'keyof User'.

// Picking several keys at once, still fully typed
function pick<T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = obj[key];
  return out;
}

const summary = pick(user, ["id", "name"]); // { id: number; name: string }
console.log(JSON.stringify(summary));

// Setting is where the type relationship really pays off
function set<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}
set(user, "name", "Lin");
set(user, "name", 42);
// Error: Argument of type 'number' is not assignable to parameter of type 'string'.

// Two keyof results that surprise people
type Loose = keyof { [k: string]: number };  // string | number, not a useful union
type AnyKey = keyof any;                     // string | number | symbol
console.log(user.name);`,
          explanation:
            "`keyof { [k: string]: number }` including `number` isn't a bug: JavaScript coerces numeric keys to strings, so an object with a string index signature really can be indexed by a number. It does mean `keyof` gives you nothing useful on a type that's just a dictionary — reach for `Record` with a literal union of keys instead when you want the compiler to know the actual key set.",
        },
      ],
    },
    {
      id: "inference",
      heading: "Where inference gets its information",
      body: [
        "You almost never write `get<User, \"name\">(user, \"name\")`, because TypeScript infers both parameters from the arguments. It's worth knowing how, because when inference produces something unexpected the fix depends on which step went wrong.",
        "Inference collects candidates from every place a type parameter appears in the parameter list, then picks the best of them — a candidate that all the others are assignable to, if there is one. It does not invent a union: `pair(\"a\", 1)` doesn't infer `string | number`, it picks `string` and reports an error on the `1`. Two more rules follow. A type parameter appearing only in the *return* type has nothing to infer from, so it falls back to its constraint or to `unknown`, and the caller must supply it. And literal widening (Lesson 1) applies here too: inferring `T` from the argument `\"GET\"` gives `string`, unless `T` is constrained to something string-like, in which case the literal survives.",
        "Two tools give you control. TypeScript 5.0's **`const` type parameters** — `function f<const T>(x: T)` — make inference behave as if the caller wrote `as const`, preserving literals and tuple shapes without burdening every call site. And TypeScript 5.4's **`NoInfer<T>`** marks a position as not an inference site, so a parameter can be checked against a type inferred elsewhere rather than contributing its own candidate.",
      ],
      examples: [
        {
          id: "inference-example",
          title: "const type parameters and NoInfer",
          ts: `// Ordinary inference widens the literals away
function route<T extends string[]>(paths: T): T {
  return paths;
}
const widened = route(["/a", "/b"]); // string[] — the specific paths are gone

// A const type parameter infers as if the caller wrote 'as const'
function constRoute<const T extends readonly string[]>(paths: T): T {
  return paths;
}
const precise = constRoute(["/a", "/b"]); // readonly ["/a", "/b"]
console.log(precise[0], precise.length);

// Same idea for object literals — no 'as const' needed at the call site
function defineConfig<const T>(config: T): T {
  return config;
}
const config = defineConfig({ mode: "dark", retries: 3 });
// { readonly mode: "dark"; readonly retries: 3 }
console.log(config.mode);

// Several positions produce several candidates — but no union is invented
function pair<T>(a: T, b: T): T[] {
  return [a, b];
}
console.log(pair("a", "b")); // T: string
pair("a", 1);
// Error: Argument of type 'number' is not assignable to parameter of type 'string'.
console.log(pair<string | number>("a", 1)); // fine once you say so explicitly

// NoInfer: let the FIRST argument decide T, and check the second against it
function createPicker<T extends string>(items: T[], initial: NoInfer<T>) {
  console.log(items.includes(initial));
}
createPicker(["red", "green"], "blue");
// Error: Argument of type '"blue"' is not assignable to parameter of type
//        '"red" | "green"'.

// Without NoInfer the second argument contributes a candidate too, and the
// mistake compiles: T widens to the union that accepts it
function loosePicker<T extends string>(items: T[], initial: T) {
  console.log(items.includes(initial));
}
loosePicker(["red", "green"], "blue"); // T becomes "red" | "green" | "blue" — no error

// A parameter used only in the return position cannot be inferred
function parse<T>(json: string): T {
  return JSON.parse(json);
}
const parsed = parse("{}");             // T falls back to unknown
const asked = parse<User>("{}");        // caller must say what they want
interface User {
  id: number;
}
console.log(asked.id);`,
          explanation:
            "`NoInfer` is small but genuinely fixes a real class of bug: without it, a second argument that should be constrained by the first instead widens the type parameter until anything is acceptable. Any signature of the form `(options: T[], selected: T)` wants `NoInfer` on the second position.",
        },
      ],
      pitfalls: [
        {
          title: "const type parameters only preserve what the caller passes directly",
          body: "`<const T>` affects inference at the call site, so it works on literals written inline. If the caller passes a variable — `const paths = [\"/a\", \"/b\"]; constRoute(paths)` — the widening already happened when `paths` was declared, and there is nothing left to preserve. The parameter also has to permit the result: an inferred `readonly [\"/a\", \"/b\"]` won't satisfy a `T extends string[]` constraint, which is why the example constrains to `readonly string[]`.",
        },
      ],
    },
    {
      id: "generic-antipatterns",
      heading: "Generics that provide no safety",
      body: [
        "Generics are easy to over-apply, and a signature can look sophisticated while checking nothing. The clearest example is the one Module 5 flagged: `function parse<T>(json: string): T`. `T` appears only in the return position, so nothing constrains it — the caller names a type, and the compiler simply believes them. It is `any` with a nicer syntax and worse discoverability, because the assertion is hidden inside a library rather than visible at the call site.",
        "A useful test: **if a type parameter appears exactly once in a signature, it is probably not doing anything.** A parameter earns its place by relating two positions — argument to return type, one argument to another, or a key to the value it retrieves. Appearing once means there is no relationship being expressed, and the signature could use `unknown` (honest) or the constraint itself (simpler) instead.",
        "The other common excess is constraining a parameter and then never using the constrained capability, or introducing a parameter for a function that would be perfectly clear taking the concrete type. Generics have a real readability cost; spend it where it buys a compile-time guarantee.",
      ],
      examples: [
        {
          id: "antipatterns-example",
          title: "Three signatures that look generic and aren't",
          ts: `// 1. Return-position-only: an unchecked assertion in disguise
function parseUnsafe<T>(json: string): T {
  return JSON.parse(json);
}
interface User {
  id: number;
  name: string;
}
const u = parseUnsafe<User>('{"nope": true}'); // compiles; u.name is undefined
console.log(u.name);

// The honest version forces the caller to deal with reality
function parseSafe(json: string): unknown {
  return JSON.parse(json);
}
const raw = parseSafe("{}");
console.log(raw.id);
// Error: 'raw' is of type 'unknown'.

// 2. A parameter used once in an argument position adds nothing
function logIt<T>(value: T): void {
  console.log(value);
}
// ...is exactly equivalent to, and less readable than:
function logItSimpler(value: unknown): void {
  console.log(value);
}
logIt("x");
logItSimpler("x");

// 3. Compare with a parameter that genuinely relates two positions
function firstOrDefault<T>(items: T[], fallback: NoInfer<T>): T {
  return items.length > 0 ? items[0] : fallback;
}
console.log(firstOrDefault([1, 2], 0));
console.log(firstOrDefault<string>([], "none"));

// A common near-miss: constraining, then discarding the constraint
function labelBad<T extends { name: string }>(value: T): string {
  return value.name; // T is never used in the return type, so it buys nothing
}
function labelGood(value: { name: string }): string {
  return value.name; // same guarantees, simpler signature
}
console.log(labelBad({ name: "Ada", extra: 1 }), labelGood({ name: "Lin" }));`,
          explanation:
            "The rule of thumb — a type parameter must appear at least twice to be doing work — is due to Dan Vanderkam's *Effective TypeScript*, and it survives contact with real code remarkably well. Applied to `parse<T>`, it immediately shows why the signature is a lie; applied to `firstOrDefault`, it shows why that one is worth keeping.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a generic constraint actually promise?",
      answer:
        "That every type argument is assignable to the constraint, so inside the function body you may use whatever the constraint guarantees. What it does not promise is that T equals the constraint — a caller can supply any subtype, so you can read a constrained property from a T but you cannot build a new T from an object that merely satisfies the constraint. TypeScript's error says exactly this: T could be instantiated with a different subtype of the constraint.",
    },
    {
      question: "What are keyof and indexed access types, and why are they used together?",
      answer:
        "keyof T is the union of T's property names as literal types; T[K] is the type of the property named K. Used together in <T, K extends keyof T>(obj: T, key: K): T[K], they express a relationship a fixed signature can't: the key must be a real key of that specific object, and the return type is whatever that key holds. A misspelled key is a compile error, and each call gets its own precise return type instead of any.",
    },
    {
      question: "How does TypeScript infer a type parameter, and when can't it?",
      answer:
        "It gathers candidates from every position where the parameter appears in the parameter list and picks a best common type — so pair('a', 1) infers string | number. It can't infer when the parameter appears only in the return type, because no argument provides a candidate; then it falls back to the constraint or unknown, and the caller has to supply it explicitly. Literal widening applies during inference too, which is what const type parameters (5.0) exist to prevent, and NoInfer (5.4) marks a position as not contributing a candidate so another argument decides.",
    },
    {
      question: "Why is `function parse<T>(json: string): T` a bad signature?",
      answer:
        "Because T appears only in the return position, so nothing about the arguments constrains it — the caller names a type and the compiler believes them without any check. It's an unchecked assertion with generic syntax, and worse than a visible `as` because the assertion is hidden inside the callee. Return unknown and let the caller validate, or validate inside with a type predicate or schema library. The general rule: a type parameter appearing only once in a signature isn't relating anything, and probably shouldn't exist.",
    },
    {
      question: "What problem does NoInfer solve?",
      answer:
        "In a signature like (items: T[], selected: T), both parameters contribute inference candidates, so passing ['red','green'] and 'blue' widens T to string and the mistake compiles. Wrapping the second as NoInfer<T> removes it as an inference site: T is decided by the array alone, and the second argument is merely checked against it, so 'blue' is correctly rejected as not assignable to 'red' | 'green'.",
    },
  ],
  takeaways: [
    "A constraint is a lower bound: it tells the body what it may read, but T is still the caller's specific subtype, so you can't construct a T from the constraint.",
    "keyof T gives property names as a literal union and T[K] gives a property's type; together they express key-to-value relationships that fixed signatures can't.",
    "Inference draws candidates only from parameter positions — a parameter used solely in the return type falls back to unknown and must be supplied by the caller.",
    "const type parameters preserve literals and tuples at the call site; NoInfer<T> stops a position from contributing an inference candidate.",
    "A type parameter that appears once in a signature is doing no work — return-position-only generics like parse<T> are unchecked assertions dressed as safety.",
  ],
  status: "available",
};
