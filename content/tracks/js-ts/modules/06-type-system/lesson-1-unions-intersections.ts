import type { Lesson } from "@/content/types";

export const unionsIntersectionsLesson: Lesson = {
  id: "type-system-unions-intersections",
  slug: "unions-intersections-literal-types",
  moduleSlug: "type-system",
  title: "Union, Intersection & Literal Types",
  summary:
    "Types as sets of values: unions widen the set, intersections narrow it, and literal types shrink it to a single member. Plus the widening rules that decide whether TypeScript remembers your exact string.",
  estimatedMinutes: 30,
  objectives: [
    "Read a union type as a set of possible values, and know why only shared members are accessible",
    "Use literal types and understand when TypeScript widens them back to string or number",
    "Apply as const to freeze a literal's type all the way down",
    "Combine object types with intersections, and recognise when an intersection produces never",
  ],
  sections: [
    {
      id: "types-as-sets",
      heading: "Types as sets of values",
      body: [
        "The single most useful mental model for everything in this module: **a type is a set of values**. `string` is the set of all strings. `boolean` is the set `{ true, false }` — literally, as you'll see. `never` is the empty set, and `unknown` is the set of everything.",
        "Once you hold that model, the two operators in this lesson stop being syntax and become arithmetic. A **union** (`A | B`) is set *union* — a value belonging to either set qualifies, so the set gets bigger and what you're allowed to do with it gets smaller. An **intersection** (`A & B`) is set *intersection* — a value must belong to both sets at once, so the set gets smaller and what you can do with it gets bigger.",
        "That inversion trips up almost everyone at first, because for object types `&` looks like it's adding properties. It is — but adding a required property makes the type harder to satisfy, so fewer objects qualify. More properties, fewer values. The set model gets this right where 'union means or, intersection means and' gets it backwards.",
      ],
      examples: [
        {
          id: "types-as-sets-example",
          title: "Wider set, narrower capability",
          ts: `// A union is a set of possible values: this variable holds a number OR a string.
type Id = number | string;

let userId: Id = 101;
userId = "u_101"; // also fine — both belong to the set

// But you may only use what EVERY member of the union supports.
function printId(id: number | string) {
  console.log(id.toUpperCase());
  // Error: Property 'toUpperCase' does not exist on type 'string | number'.
  //        Property 'toUpperCase' does not exist on type 'number'.

  console.log(id.toString()); // fine — both numbers and strings have toString
}

// An intersection requires membership in both sets at once.
interface HasId {
  id: number;
}
interface HasName {
  name: string;
}

type Entity = HasId & HasName;

const ok: Entity = { id: 1, name: "Ada" };  // in both sets
const missing: Entity = { id: 1 };
// Error: Type '{ id: number; }' is not assignable to type 'Entity'.
//        Property 'name' is missing in type '{ id: number; }' but required in type 'HasName'.

// Assignability follows the sets: a smaller set flows into a bigger one.
const widened: HasId = ok;      // Entity is a subset of HasId — fine
const narrowed: Entity = { id: 2 } as HasId;
// Error: Type 'HasId' is not assignable to type 'Entity'.
//        Property 'name' is missing in type 'HasId' but required in type 'HasName'.`,
          explanation:
            "Read the two errors together. The union rejects `toUpperCase` because some member of the set lacks it. The intersection rejects `{ id: 1 }` because it isn't a member of both sets. Neither rule is about objects specifically — they're the same set arithmetic applied to whatever types you name.",
        },
      ],
    },
    {
      id: "literal-types",
      heading: "Literal types: a set with exactly one member",
      body: [
        "A **literal type** is a type whose set contains a single value: the type `\"GET\"` accepts only the string `\"GET\"`, and nothing else. On their own they're a curiosity; unioned together they become the most-used tool in TypeScript — `\"GET\" | \"POST\" | \"PUT\"` is a type that documents every legal value and makes anything else a compile error, without needing an `enum`, a class, or a runtime check.",
        "This is also where `boolean` stops being magic. It genuinely is the union `true | false` — two literal types — which is why narrowing an `if` statement works at all: checking the condition removes one member of the union from the set.",
        "Literal types replace stringly-typed code with checked code. Compare `function move(direction: string)`, where `\"lft\"` compiles happily and fails silently at runtime, with `function move(direction: \"left\" | \"right\")`, where the typo is caught at the call site and your editor offers both valid options.",
      ],
      examples: [
        {
          id: "literal-types-example",
          title: "Literal unions instead of loose strings",
          ts: `type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Port = 80 | 443;
type Success = true;

function request(url: string, method: HttpMethod) {
  console.log(method, url);
}

request("/users", "POST");  // fine
request("/users", "post");
// Error: Argument of type '"post"' is not assignable to parameter of type 'HttpMethod'.

// boolean really is the union of two literal types
type Bool = true | false;
const check: Bool = true;   // assignable in both directions — boolean IS this union
const alsoFine: boolean = check;

// Literal types mix freely with wider types in a union
type Status = "loading" | "ready" | number; // an error code, or a known phase

// A literal type can even carry a whole shape's worth of meaning
type Direction = "north" | "south" | "east" | "west";

const moves: Record<Direction, [number, number]> = {
  north: [0, 1],
  south: [0, -1],
  east: [1, 0],
  west: [-1, 0],
};
// Leave out "west" and the object literal fails to compile — the union
// enumerates every key that must be present.
console.log(moves.north);`,
          explanation:
            "That last pattern is worth stealing: pairing a literal union with `Record` turns 'did I handle every case?' from a code-review question into a compile error. `Record` gets its own treatment in the utility types lesson.",
        },
      ],
    },
    {
      id: "widening",
      heading: "Widening: why TypeScript forgets your literal",
      body: [
        "TypeScript infers literal types only where it believes the value can't change. `const method = \"GET\"` is inferred as the literal `\"GET\"`, because a `const` binding to a primitive can never hold anything else. `let method = \"GET\"` is inferred as `string` — the value is expected to change, so the compiler **widens** the literal to its base type.",
        "The trap is that object properties are always mutable, so widening happens inside object literals too. `const config = { method: \"GET\" }` gives `{ method: string }`, not `{ method: \"GET\" }` — and passing it to something expecting `\"GET\" | \"POST\"` fails with an error that reads like nonsense until you know this rule.",
        "There are three fixes, and they're not interchangeable. An annotation (`const config: RequestConfig = ...`) is best when a suitable type already exists. **`as const`** freezes the whole literal — every property becomes `readonly` and every value becomes its literal type, recursively. And `satisfies` (introduced in TypeScript 4.9) checks the value against a type without widening it to that type, which is what you want when you need both the check and the precise inferred type.",
      ],
      examples: [
        {
          id: "widening-example",
          title: "const, let, as const and satisfies",
          ts: `type HttpMethod = "GET" | "POST";

const literal = "GET";        // type: "GET"   — const binding, cannot change
let mutable = "GET";          // type: string  — widened, because it might change

function request(method: HttpMethod) {
  console.log(method);
}

request(literal);   // fine
request(mutable);
// Error: Argument of type 'string' is not assignable to parameter of type 'HttpMethod'.

// The one that surprises people: properties widen even under const
const config = { url: "/users", method: "GET" };
// inferred: { url: string; method: string }

function send(options: { url: string; method: HttpMethod }) {
  console.log(options.method, options.url);
}

send(config);
// Error: Argument of type '{ url: string; method: string; }' is not assignable
//        to parameter of type '{ url: string; method: HttpMethod; }'.
//        Types of property 'method' are incompatible.
//        Type 'string' is not assignable to type 'HttpMethod'.

// Fix 1 — as const: readonly, and literal all the way down
const frozen = { url: "/users", method: "GET" } as const;
// inferred: { readonly url: "/users"; readonly method: "GET" }
send(frozen); // fine

// Fix 2 — satisfies: checked against the type, but NOT widened to it
const checked = { url: "/users", method: "GET" } satisfies {
  url: string;
  method: HttpMethod;
};
send(checked);
console.log(checked.method.toLowerCase()); // still known to be "GET", not just HttpMethod

// Contrast with a plain annotation, which DOES widen the value to the type
const annotated: { url: string; method: HttpMethod } = { url: "/users", method: "GET" };
// annotated.method is HttpMethod here — the exact "GET" is forgotten`,
          explanation:
            "The difference between the last two matters more than it looks. `satisfies` gives you the error checking of an annotation plus the precision of inference — so `checked.method` is still the literal `\"GET\"`, while `annotated.method` has been widened to the whole `HttpMethod` union.",
        },
      ],
      pitfalls: [
        {
          title: "as const makes arrays readonly tuples, which some APIs reject",
          body: "`as const` on an array produces a `readonly` tuple: `[1, 2, 3] as const` is `readonly [1, 2, 3]`, not `number[]`. That's usually what you want, but a `readonly` array is not assignable to a mutable `number[]` parameter, so passing one to a function that could mutate it is a compile error. Either type the parameter as `readonly number[]` (which is the more honest signature anyway, since it promises not to mutate), or copy with `[...values]` at the call site.",
        },
      ],
    },
    {
      id: "intersections",
      heading: "Intersections, and when they collapse to never",
      body: [
        "For object types, `A & B` behaves the way you'd hope: the result has every property of both, and a value must supply all of them. This is how mixin-style composition is typed (Module 3), how a props type is extended, and how a library adds fields to someone else's shape without editing it.",
        "But remember the set model, because it explains the two cases where intersections behave unexpectedly. First, intersecting two primitives gives the empty set: `string & number` is **`never`**, since no value is simultaneously a string and a number. Second, intersecting object types that share a property name intersects the property types too — so `{ id: string } & { id: number }` isn't a conflict error, it's an object whose `id` is `never`. The type is legal, it's just impossible to construct, and you find out at the assignment rather than the declaration.",
        "Where `interface extends` and `&` overlap, prefer `extends`: it errors at the declaration if members are incompatible, produces better error messages, and caches better in the compiler. Reach for `&` when you're combining type aliases, unions or generic parameters — things `extends` can't express.",
      ],
      examples: [
        {
          id: "intersections-example",
          title: "Composing shapes, and the never trap",
          ts: `interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

interface Draft {
  title: string;
  body: string;
}

type Post = Draft & Timestamps;

const post: Post = {
  title: "Types as sets",
  body: "...",
  createdAt: new Date(),
  updatedAt: new Date(),
};
console.log(post.title, post.createdAt instanceof Date);

// Primitives have nothing in common, so the intersection is empty
type Impossible = string & number; // never

// Same rule one level down: the shared property becomes never
type Conflict = { id: string } & { id: number };
// Conflict is { id: never } — a legal type that no value satisfies

const broken: Conflict = { id: 1 };
// Error: Type 'number' is not assignable to type 'never'.

// Distributing over a union: & applies to each member
type Result = ({ ok: true } | { ok: false }) & { at: Date };
// ({ ok: true } & { at: Date }) | ({ ok: false } & { at: Date })
const r: Result = { ok: true, at: new Date() };
console.log(r.ok);

// Intersections are also how you extend a type you don't own
type WithId<T> = T & { id: number };
const identified: WithId<Draft> = { id: 7, title: "Hi", body: "..." };
console.log(identified.id);`,
          output: `Types as sets true
true
7`,
          explanation:
            "The `Conflict` case is the one to remember: TypeScript doesn't reject the type, it rejects the first value you try to assign to it — with a `not assignable to type 'never'` message that gives no hint about where the conflict came from. Seeing `never` on a property is almost always a sign that two intersected shapes disagree.",
        },
      ],
    },
    {
      id: "unions-of-objects",
      heading: "Unions of objects, and the excess property rule",
      body: [
        "Unioning object types is where unions earn their keep — and immediately show their limits. Given `Circle | Square`, TypeScript only lets you access properties present on both, which for two unrelated shapes is often nothing at all. You can't just check `if (shape.radius)`, because reading `radius` is itself the error.",
        "The fix is to give the union members something in common to check — a shared literal-typed field — which turns it into a *discriminated union*. That's important enough to get the whole next lesson; this section is the motivation for it.",
        "One rule specific to unions is worth knowing now: **excess property checking**. Object literals assigned directly to a typed target are checked for unknown properties, and against a union the literal must match at least one member without leftovers. This catches typos, but it only applies to fresh literals — assign through a variable first and the check disappears, which is occasionally a useful escape hatch and more often a way for bugs to slip through.",
      ],
      examples: [
        {
          id: "unions-of-objects-example",
          title: "What you can and cannot reach on a union",
          ts: `interface Circle {
  radius: number;
}
interface Square {
  side: number;
}

type Shape = Circle | Square;

function area(shape: Shape) {
  console.log(shape.radius);
  // Error: Property 'radius' does not exist on type 'Shape'.
  //        Property 'radius' does not exist on type 'Square'.
}

// The 'in' operator is one way out — it narrows the union
function areaWorks(shape: Shape): number {
  if ("radius" in shape) {
    return Math.PI * shape.radius ** 2; // shape: Circle
  }
  return shape.side ** 2;               // shape: Square
}
console.log(areaWorks({ radius: 1 }).toFixed(2), areaWorks({ side: 3 }));

// Excess property checking: a FRESH literal may not carry properties that
// appear on no member of the union
const bad: Shape = { radius: 1, diameter: 2 };
// Error: Object literal may only specify known properties, and 'diameter' does
//        not exist in type 'Shape'.

// ...but the check is skipped when the value arrives via a variable
const loose = { radius: 1, diameter: 2 };
const sneaks: Shape = loose; // no error — structurally it IS a valid Circle
console.log(areaWorks(sneaks).toFixed(2));

// And against a union, "known" means known to ANY member — so this
// impossible hybrid passes, even though it is neither a Circle nor a Square
const hybrid: Shape = { radius: 1, side: 2 };
console.log(areaWorks(hybrid).toFixed(2)); // treated as a Circle by "radius" in shape`,
          output: `3.14 9
3.14
3.14`,
          explanation:
            "Excess property checking is a deliberate exception to structural typing, added purely to catch typos in object literals. Note how weak it gets against a union: it only rejects properties belonging to no member, so an object with both `radius` and `side` sails through. Understanding that it applies to *freshness* rather than to types also explains why you should be suspicious when someone 'fixes' an excess-property error by introducing an intermediate variable.",
        },
      ],
      pitfalls: [
        {
          title: "A union of object types is not the same as an object of unions",
          body: "`{ a: string } | { b: number }` and `{ a?: string; b?: number }` describe very different sets. The union genuinely has exactly one of the two shapes; the optional-property version permits both at once, neither at all, and every combination in between. Reaching for optional properties to model 'one of these' is the single most common cause of `possibly undefined` checks scattered through a codebase — the next lesson shows the discriminated union that replaces them.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Explain union and intersection types in terms of sets.",
      answer:
        "A type is a set of values. A union A | B is the set union — a value from either type qualifies — so the set of allowed values grows, but the operations you can perform shrink to only those every member supports. An intersection A & B is the set intersection — a value must satisfy both types at once — so the set of allowed values shrinks while available members grow. That inversion is why an intersection of object types appears to 'add' properties: more required properties means fewer objects qualify.",
    },
    {
      question: "Why does `const config = { method: 'GET' }` fail to satisfy `{ method: 'GET' | 'POST' }`?",
      answer:
        "Because of literal widening. A const binding to a primitive keeps its literal type, but object properties are mutable, so TypeScript widens the property to string — the inferred type is { method: string }, and string is not assignable to the narrower union. Three fixes: annotate the variable with the target type, use `as const` to freeze every property as readonly and literal, or use `satisfies` to check against the type while keeping the precise inferred literal.",
    },
    {
      question: "What's the difference between `satisfies` and a type annotation?",
      answer:
        "An annotation forces the variable's type to be the annotated type, so inference is discarded — the value is widened to the annotation. `satisfies` checks that the value is assignable to the type but leaves the inferred type alone, so you keep both the error checking and the precision. It's the right tool when you want to validate a config object against a shape but still know its exact keys and literal values afterwards.",
    },
    {
      question: "What is `{ id: string } & { id: number }`?",
      answer:
        "It's the type { id: never }. Intersecting object types intersects any shared property's types, and string & number is the empty set, which is never. TypeScript accepts the type declaration itself — the failure surfaces later as 'Type X is not assignable to type never' on the first value you try to assign. Seeing never on a property is a reliable signal that two intersected shapes disagree about it.",
    },
    {
      question: "What is excess property checking, and when does it not apply?",
      answer:
        "When an object literal is assigned directly to a typed target, TypeScript rejects properties that don't exist on that target, even though structural typing would otherwise allow them. It's a special case aimed at catching typos and misplaced options. It only applies to fresh object literals — assigning the same object through an intermediate variable skips the check entirely, because at that point it's an ordinary structural assignability question.",
    },
  ],
  takeaways: [
    "Think of a type as a set of values: | is set union (more values, fewer usable members) and & is set intersection (fewer values, more usable members).",
    "Literal types are single-value sets; unioned together they replace loose strings with values the compiler can check and your editor can autocomplete.",
    "const keeps a primitive's literal type but object properties widen anyway — fix with an annotation, `as const`, or `satisfies` when you want checking without widening.",
    "Intersecting incompatible primitives yields never, and intersecting object types with a clashing property yields never for that property — a legal type nothing can satisfy.",
    "On a bare union of object types you may only access shared members; excess property checking catches typos in fresh literals but is skipped when the value comes through a variable.",
  ],
  status: "available",
};
