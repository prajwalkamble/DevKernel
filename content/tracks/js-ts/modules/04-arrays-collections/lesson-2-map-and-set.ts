import type { Lesson } from "@/content/types";

export const mapAndSetLesson: Lesson = {
  id: "arrays-collections-map-and-set",
  slug: "map-and-set",
  moduleSlug: "arrays-collections",
  title: "Map and Set",
  summary:
    "Two dedicated collection types that solve real problems plain objects and arrays handle awkwardly — Map for genuinely any-typed keys, Set for guaranteed uniqueness — plus how TypeScript generics type both precisely.",
  estimatedMinutes: 25,
  objectives: [
    "Explain what Map offers over a plain object for key-value storage",
    "Explain what Set offers over an array for uniqueness",
    "Convert between Map/Set and arrays/objects fluently",
    "Type Map and Set with the correct generic type arguments",
  ],
  sections: [
    {
      id: "map-vs-object",
      heading: "Map vs plain object",
      body: [
        "A plain object was your only key-value storage option before ES2015's `Map`, and it has real limitations for that job: keys are always coerced to strings (or symbols) — you can't use an object or a number as a distinct key. Objects also have prototype-inherited properties baked in (like `toString`), which can collide with your own keys, and object key order has historically had quirky rules. `Map` was designed specifically to solve all of this: **any value** can be a key (including objects and functions), there's no prototype pollution risk, insertion order is always preserved reliably, and you get a direct `.size` property instead of `Object.keys(obj).length`.",
      ],
      examples: [
        {
          id: "map-vs-object-example",
          title: "Where Map succeeds where a plain object struggles",
          js: `const objKeyed = {};
const keyObj1 = { id: 1 };
const keyObj2 = { id: 2 };
objKeyed[keyObj1] = "first";  // both keys get coerced to the SAME string: "[object Object]"
objKeyed[keyObj2] = "second"; // silently overwrites the first!
console.log(objKeyed); // { "[object Object]": "second" } — data lost

const mapKeyed = new Map();
mapKeyed.set(keyObj1, "first");
mapKeyed.set(keyObj2, "second"); // a genuinely different key — no collision
console.log(mapKeyed.get(keyObj1)); // "first"
console.log(mapKeyed.get(keyObj2)); // "second"
console.log(mapKeyed.size); // 2 — direct property, no Object.keys() needed

// Common Map operations
const scores = new Map([["Ada", 95], ["Alan", 88]]); // initialize from an array of pairs
scores.set("Grace", 92);
console.log(scores.has("Ada"));   // true
scores.delete("Alan");
for (const [name, score] of scores) { // Map is directly iterable
  console.log(name, score);
}
console.log([...scores.keys()]);   // ["Ada", "Grace"]
console.log([...scores.values()]); // [95, 92]
console.log(Object.fromEntries(scores)); // { Ada: 95, Grace: 92 } — Map to plain object`,
          explanation:
            "The `keyObj1`/`keyObj2` example is the clearest illustration: a plain object silently corrupts the data because both object keys get stringified to the identical `\"[object Object]\"`. `Map` uses the actual object reference as the key internally, so this collision simply cannot happen.",
        },
      ],
      pitfalls: [
        {
          title: "Still reach for a plain object when keys are simple, known strings",
          body: "Map's advantages matter most for dynamic keys, non-string keys, or frequent add/remove/size operations. For a fixed, known set of string-keyed properties (like a typical data record — `{ name, age, email }`), a plain object (or better, a typed interface) is still simpler, has better JSON support, and is usually the right choice.",
        },
      ],
    },
    {
      id: "set-vs-array",
      heading: "Set vs array",
      body: [
        "A `Set` stores a collection of **unique values** — attempting to add a value that's already present is a silent no-op. This makes deduplication and membership checks (`.has()`) both far simpler and asymptotically faster than the equivalent array patterns (`array.filter((v, i) => array.indexOf(v) === i)` for dedup, `array.includes()` for membership, both of which are O(n) per check on an array versus O(1) average for a Set).",
      ],
      examples: [
        {
          id: "set-vs-array-example",
          title: "Deduplication and fast membership checks",
          js: `const numbers = [1, 2, 2, 3, 3, 3, 4];

// Set-based deduplication — the standard idiom
const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4]

const visitedIds = new Set();
visitedIds.add("user-1");
visitedIds.add("user-2");
visitedIds.add("user-1"); // no-op, already present
console.log(visitedIds.size); // 2
console.log(visitedIds.has("user-1")); // true — O(1) average lookup

// Sets support the same core operations as Map: add, has, delete, size, and iteration
for (const id of visitedIds) {
  console.log(id);
}`,
          explanation:
            "`[...new Set(numbers)]` — spreading a Set built from an array — is the idiomatic one-line way to deduplicate an array in modern JavaScript, replacing much clunkier manual filtering.",
        },
      ],
    },
    {
      id: "ts-map-set",
      heading: "TypeScript: Map and Set are generic types",
      body: [
        "Both `Map<K, V>` (key type, value type) and `Set<T>` (element type) are generic types — the same generics concept introduced for functions in Module 2 applies directly to built-in collection types. TypeScript infers the type parameters from the initial values if you provide them, or you can specify them explicitly for an empty collection.",
      ],
      examples: [
        {
          id: "ts-map-set-example",
          title: "Typed Map and Set",
          ts: `const scores = new Map<string, number>(); // explicit type arguments for an empty Map
scores.set("Ada", 95);
scores.set("Alan", "88");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.

const inferredScores = new Map([["Ada", 95], ["Alan", 88]]);
// inferred as Map<string, number> — no explicit type arguments needed

const value = scores.get("Ada"); // inferred as: number | undefined
// .get() always includes | undefined, since the key might not exist — same
// strictNullChecks discipline seen with array find() in the previous lesson

const tags = new Set<string>();
tags.add("typescript");
tags.add(42);
// Error: Argument of type 'number' is not assignable to parameter of type 'string'.`,
          explanation:
            "Just like `find()` on an array, `Map.prototype.get()` returns `V | undefined` rather than just `V`, because TypeScript has no way to statically guarantee the key exists — this correctly forces you to handle the missing case before using the value.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are two concrete problems with using a plain object as a key-value store that Map solves?",
      answer:
        "First, object keys are always coerced to strings, so distinct non-string keys (like two different object references) can collide into the same stringified key and silently overwrite each other — Map allows any value, including objects, as a genuinely distinct key. Second, plain objects carry inherited prototype properties that can collide with your own keys, while Map has no such prototype pollution risk.",
    },
    {
      question: "What is the standard idiom for deduplicating an array using Set?",
      answer:
        "[...new Set(array)] — constructing a Set from the array (which automatically drops duplicate values) and then spreading it back into a new array. This is simpler and generally faster than manual filtering approaches like array.filter((v, i) => array.indexOf(v) === i).",
    },
    {
      question: "When would you still prefer a plain object over a Map?",
      answer:
        "When you have a fixed, known set of string keys representing a typical data record (like { name, age, email }) — a plain object (ideally typed with an interface) is simpler, has direct JSON.stringify support, and is the more idiomatic and readable choice for that case. Map's advantages matter most for dynamic keys, non-string keys, or frequent add/remove/size operations.",
    },
    {
      question: "Why does calling .get() on a TypeScript Map<string, number> return type number | undefined instead of just number?",
      answer:
        "Because TypeScript cannot statically guarantee that the requested key actually exists in the Map at that point in the program — the key might be missing at runtime. Including | undefined in the return type forces the caller to handle that possibility, consistent with how array find() and strictNullChecks work elsewhere in the language.",
    },
    {
      question: "Does adding a duplicate value to a Set throw an error?",
      answer:
        "No — it's a silent no-op. Set.prototype.add() simply does nothing if the value being added already exists in the Set (compared using the same-value-zero algorithm, similar to ===), which is exactly what makes Set convenient for deduplication and uniqueness tracking.",
    },
  ],
  takeaways: [
    "Map allows any value as a key (not just strings), has no prototype-collision risk, preserves insertion order reliably, and exposes .size directly.",
    "Set guarantees unique values with fast add/has/delete — [...new Set(array)] is the standard array-deduplication idiom.",
    "Plain objects still win for fixed, known string-keyed data records — reach for Map/Set specifically when their guarantees (arbitrary keys, uniqueness) matter.",
    "Map<K, V> and Set<T> are generic types in TypeScript; .get() on a Map always includes | undefined in its return type since key existence can't be statically guaranteed.",
  ],
  status: "available",
};
