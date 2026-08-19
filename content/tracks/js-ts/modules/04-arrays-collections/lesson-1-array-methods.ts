import type { Lesson } from "@/content/types";

export const arrayMethodsLesson: Lesson = {
  id: "arrays-collections-array-methods",
  slug: "array-methods-deep-dive",
  moduleSlug: "arrays-collections",
  title: "Array Methods Deep Dive",
  summary:
    "The essential Array.prototype methods every production codebase relies on — which ones mutate the original array and which return a new one, and how TypeScript types every one of them precisely.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish mutating array methods from non-mutating ones, from memory",
    "Use map, filter, reduce, find, some/every, and flatMap correctly",
    "Chain array methods to build readable data-transformation pipelines",
    "Understand how TypeScript infers and narrows types through a method chain",
  ],
  sections: [
    {
      id: "mutating-vs-non-mutating",
      heading: "The most important distinction: mutating vs non-mutating",
      body: [
        "Every `Array.prototype` method falls into one of two camps, and confusing them is one of the most common sources of subtle bugs in real codebases: **mutating** methods change the original array in place (and often return something other than the array itself, like the removed element or the new length); **non-mutating** methods leave the original array untouched and return a brand-new array or value.",
        "**Mutating**: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`. **Non-mutating**: `map`, `filter`, `reduce`, `slice`, `concat`, `find`, `some`, `every`, `flat`, `flatMap`, and the spread operator. Modern JavaScript style strongly favors the non-mutating methods, especially in frameworks (React, Redux) where mutating shared state directly causes bugs that are painful to track down.",
      ],
      examples: [
        {
          id: "mutating-vs-non-mutating-example",
          title: "sort mutates; map does not — a common gotcha",
          js: `const original = [3, 1, 2];

const mapped = original.map((n) => n * 2);
console.log(mapped);   // [6, 2, 4] — new array
console.log(original); // [3, 1, 2] — untouched

const sorted = original.sort(); // sort MUTATES and also returns the same array
console.log(sorted);   // [1, 2, 3]
console.log(original); // [1, 2, 3] — the "original" array itself changed!

console.log(sorted === original); // true — sort() returns a reference to the SAME array

// The safe, non-mutating way to sort a copy:
const originalAgain = [3, 1, 2];
const sortedCopy = [...originalAgain].sort(); // spread first, then sort the copy
console.log(originalAgain); // [3, 1, 2] — untouched this time`,
          explanation:
            "`sort()` (and `reverse()`, `splice()`, etc.) silently mutating the array you called them on is a frequent real-world bug source — especially when that array came from props, state, or was shared elsewhere. Always spread (`[...arr]`) before calling a mutating method if you need to preserve the original.",
        },
      ],
      pitfalls: [
        {
          title: "Array.prototype.sort() defaults to string comparison, even for numbers",
          body: "`[10, 1, 2].sort()` gives `[1, 10, 2]`, not `[1, 2, 10]` — by default, `sort()` converts elements to strings and compares them lexicographically. For numbers, always pass a compare function: `arr.sort((a, b) => a - b)` for ascending order.",
        },
      ],
    },
    {
      id: "map-filter-reduce",
      heading: "map, filter, and reduce: the core transformation trio",
      body: [
        "`map(fn)` transforms every element and returns a new array of the **same length**, one output per input. `filter(fn)` returns a new array containing only the elements where `fn` returned truthy — the length can shrink. `reduce(fn, initialValue)` folds the entire array down into a single accumulated value of *any* shape — a number, a string, an object, even another array — making it the most general and powerful of the three (and often the hardest to read, so use it deliberately, not by default).",
      ],
      examples: [
        {
          id: "map-filter-reduce-example",
          title: "The core trio, chained into a pipeline",
          js: `const orders = [
  { item: "Book", price: 15, quantity: 2 },
  { item: "Pen", price: 2, quantity: 10 },
  { item: "Laptop", price: 900, quantity: 1 },
];

const total = orders
  .filter((order) => order.price < 100)       // exclude the laptop
  .map((order) => order.price * order.quantity) // [30, 20]
  .reduce((sum, subtotal) => sum + subtotal, 0); // 50

console.log(total); // 50

// reduce can build up ANY shape, not just a single number:
const byItem = orders.reduce((acc, order) => {
  acc[order.item] = order.price * order.quantity;
  return acc;
}, {});
console.log(byItem); // { Book: 30, Pen: 20, Laptop: 900 }`,
          explanation:
            "This chain reads almost like a sentence: filter down to what matters, map each to a subtotal, reduce to a final sum. Each step returns a full array (except the final reduce), which is exactly what makes chaining possible — this is the non-mutating, composable style Module 2's function composition lesson was building toward, applied specifically to arrays.",
        },
      ],
    },
    {
      id: "find-some-every",
      heading: "find, findIndex, some, and every: asking questions about an array",
      body: [
        "`find(fn)` returns the **first** element satisfying `fn`, or `undefined` if none does. `findIndex(fn)` does the same but returns the index (or `-1`). `some(fn)` returns `true` if **at least one** element satisfies `fn` (short-circuits on the first match). `every(fn)` returns `true` only if **all** elements satisfy `fn` (short-circuits on the first failure).",
      ],
      examples: [
        {
          id: "find-some-every-example",
          title: "Querying an array without manually writing a loop",
          js: `const users = [
  { name: "Ada", age: 36, active: true },
  { name: "Alan", age: 41, active: false },
  { name: "Grace", age: 85, active: true },
];

console.log(users.find((u) => u.age > 40));        // { name: "Alan", ... }
console.log(users.findIndex((u) => u.name === "Grace")); // 2
console.log(users.some((u) => !u.active));          // true — at least one inactive
console.log(users.every((u) => u.age > 18));         // true — all are adults
console.log(users.every((u) => u.active));           // false — Alan breaks it`,
        },
      ],
    },
    {
      id: "flat-flatmap-slice",
      heading: "flat, flatMap, and slice",
      body: [
        "`flat(depth)` flattens nested arrays by the given depth (default `1`). `flatMap(fn)` is `map` immediately followed by a `flat(1)` — useful when your mapping function itself produces an array per element and you want a single flat result, not an array of arrays. `slice(start, end)` returns a shallow copy of a portion of the array **without mutating** — easy to confuse with the mutating `splice`, which has a very similar name but very different behavior (it removes/inserts elements in place).",
      ],
      examples: [
        {
          id: "flat-flatmap-example",
          title: "flat, flatMap, and the slice-vs-splice trap",
          js: `console.log([1, [2, 3], [4, [5, 6]]].flat());     // [1, 2, 3, 4, [5, 6]] — depth 1
console.log([1, [2, 3], [4, [5, 6]]].flat(2));    // [1, 2, 3, 4, 5, 6] — depth 2

const sentences = ["hello world", "foo bar"];
console.log(sentences.map((s) => s.split(" ")));    // [["hello","world"], ["foo","bar"]]
console.log(sentences.flatMap((s) => s.split(" "))); // ["hello","world","foo","bar"] — flattened

const arr = [1, 2, 3, 4, 5];
console.log(arr.slice(1, 3)); // [2, 3] — new array, arr untouched
console.log(arr);             // [1, 2, 3, 4, 5] — unchanged

console.log(arr.splice(1, 2)); // [2, 3] — removed elements, but MUTATES arr!
console.log(arr);              // [1, 4, 5] — arr itself changed`,
          explanation:
            "`slice` and `splice` are a classic naming trap — one letter apart, opposite mutation behavior. A reliable way to remember: s**l**ice **l**eaves the original alone; **sp**lice can **sp**lice pieces out of the original in place.",
        },
      ],
    },
    {
      id: "ts-array-methods",
      heading: "TypeScript: precise types flow through every method in the chain",
      body: [
        "TypeScript types every array method's return value based on what the callback returns, and this flows correctly through an entire chain — a `.filter()` that never changes element type keeps the array's element type, while a `.map()` that transforms elements produces an array of the new type, all inferred automatically without annotations.",
      ],
      examples: [
        {
          id: "ts-array-chain-example",
          title: "Types tracked automatically through a full chain",
          ts: `interface Order {
  item: string;
  price: number;
  quantity: number;
}

const orders: Order[] = [
  { item: "Book", price: 15, quantity: 2 },
  { item: "Pen", price: 2, quantity: 10 },
];

const total = orders
  .filter((o) => o.price < 100)        // still Order[]
  .map((o) => o.price * o.quantity)    // now number[]
  .reduce((sum, subtotal) => sum + subtotal, 0); // number

// total is correctly inferred as 'number' with zero manual annotations

const found = orders.find((o) => o.item === "Book"); // inferred as: Order | undefined
console.log(found.price);
// Error: 'found' is possibly 'undefined'.
console.log(found?.price); // OK — must handle the undefined case (Module 1's strictNullChecks)`,
          explanation:
            "Notice `find`'s return type correctly includes `| undefined` — TypeScript knows there might be no match, forcing you to handle that case (with `?.` or a guard) exactly the way `strictNullChecks` was designed to, tying directly back to Module 1.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which common array methods mutate the original array, and which don't?",
      answer:
        "Mutating: push, pop, shift, unshift, splice, sort, reverse, fill. Non-mutating (return a new array/value, leave the original untouched): map, filter, reduce, slice, concat, find, some, every, flat, flatMap. Modern style favors non-mutating methods, especially with shared or framework-managed state.",
    },
    {
      question: "What's the difference between map and forEach?",
      answer:
        "map returns a new array built from the callback's return values and is meant for transforming data. forEach returns undefined and is meant purely for side effects (like logging) — using forEach's return value or expecting map not to allocate a new array are both common mistakes.",
    },
    {
      question: "What's the difference between slice and splice?",
      answer:
        "slice(start, end) returns a shallow copy of a portion of the array without modifying the original. splice(start, deleteCount, ...items) mutates the original array in place — removing and/or inserting elements — and returns an array of the removed elements. Despite similar names, one is non-mutating and one is not.",
    },
    {
      question: "Why does `[10, 1, 2].sort()` produce `[1, 10, 2]` instead of `[1, 2, 10]`?",
      answer:
        "By default, Array.prototype.sort() converts elements to strings and compares them lexicographically (dictionary order), not numerically. \"10\" comes before \"2\" as strings. To sort numbers correctly, you must pass an explicit compare function, e.g. arr.sort((a, b) => a - b).",
    },
    {
      question: "What does flatMap do, and how does it differ from calling map followed by flat?",
      answer:
        "flatMap(fn) is equivalent to calling map(fn) followed by flat(1) — it maps each element (often to an array) and then flattens the result by exactly one level into a single array. It's provided as a single method partly for clarity and partly because it can be implemented more efficiently than the two separate calls.",
    },
  ],
  takeaways: [
    "Know which array methods mutate (push/pop/splice/sort/reverse) and which don't (map/filter/reduce/slice) — this distinction prevents a large class of real bugs.",
    "map transforms (same length, new array), filter selects (shrinks or keeps, new array), reduce folds down to any single value — chain them for readable data pipelines.",
    "find/findIndex return the first match (or undefined/-1); some/every ask true/false questions about the whole array, both short-circuiting.",
    "slice copies a portion without mutating; splice removes/inserts in place and does mutate — don't confuse the similar names.",
    "TypeScript infers precise types through an entire method chain automatically, including correctly adding | undefined to find's result.",
  ],
  status: "available",
};
