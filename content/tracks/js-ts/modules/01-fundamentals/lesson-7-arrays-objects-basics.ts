import type { Lesson } from "@/content/types";

export const arraysObjectsBasicsLesson: Lesson = {
  id: "fundamentals-arrays-objects-basics",
  slug: "arrays-objects-basics",
  moduleSlug: "fundamentals",
  title: "Arrays, Objects, Destructuring & Spread",
  summary:
    "Creating and reading arrays and objects, destructuring assignment, the spread and rest syntax, and how TypeScript types array shapes, tuples, and object interfaces.",
  estimatedMinutes: 35,
  objectives: [
    "Create and access arrays and objects using literal syntax",
    "Destructure arrays and objects, including defaults and renaming",
    "Use spread syntax to copy and merge arrays/objects immutably",
    "Type arrays, tuples, and object shapes in TypeScript with array types and interfaces",
  ],
  sections: [
    {
      id: "arrays-objects-literals",
      heading: "Array and object literals",
      body: [
        "Arrays (`[]`) are ordered, index-based collections; any JS value can live at any index, including mixed types (though that's rarely good practice). Objects (`{}`) are unordered collections of key-value pairs, where keys are strings or symbols (numbers are coerced to strings).",
        "Both are reference types: assigning an array/object to a new variable copies the **reference**, not the data. Mutating through either variable affects the same underlying data.",
      ],
      examples: [
        {
          id: "reference-semantics",
          title: "Arrays and objects are copied by reference",
          js: `const original = { name: "Ada" };
const alias = original;
alias.name = "Grace";
console.log(original.name); // "Grace" — same object, two variable names

const arr1 = [1, 2, 3];
const arr2 = arr1;
arr2.push(4);
console.log(arr1); // [1, 2, 3, 4] — same array`,
        },
      ],
    },
    {
      id: "destructuring",
      heading: "Destructuring assignment",
      body: [
        "Destructuring pulls values out of arrays or objects into standalone variables in one expression. Array destructuring matches by **position**; object destructuring matches by **key name** (which you can rename). Both support default values for when the source value is `undefined`.",
      ],
      examples: [
        {
          id: "destructuring-examples",
          title: "Array and object destructuring, with defaults and renaming",
          js: `// Array destructuring — position-based
const [first, second, , fourth] = ["a", "b", "c", "d"];
console.log(first, second, fourth); // "a" "b" "d" (third skipped)

const [x = 10, y = 20] = [1];
console.log(x, y); // 1 20 — y falls back to its default since it's missing

// Object destructuring — key-based, with renaming and defaults
const user = { name: "Ada", role: "admin" };
const { name, role: userRole, age = 30 } = user;
console.log(name, userRole, age); // "Ada" "admin" 30

// Common pattern: destructuring function parameters directly
function printUser({ name, age = 18 }) {
  console.log(\`\${name} (\${age})\`);
}
printUser({ name: "Alan" }); // "Alan (18)"`,
        },
      ],
    },
    {
      id: "spread-rest",
      heading: "Spread and rest syntax",
      body: [
        "The `...` syntax means two different things depending on context. As **spread**, it expands an iterable/object into individual elements — used to copy or merge arrays/objects immutably, or pass array elements as individual function arguments. As **rest** (in destructuring or function parameters, seen in the previous lesson), it collects multiple elements back into one array/object.",
        "Spread is the modern, idiomatic way to update state immutably — critical in frameworks like React where you must never mutate state directly.",
      ],
      examples: [
        {
          id: "spread-examples",
          title: "Spread for copying and merging",
          js: `const nums = [1, 2, 3];
const copy = [...nums, 4, 5];       // [1, 2, 3, 4, 5] — original untouched
console.log(nums);                  // [1, 2, 3] — not mutated

const defaults = { theme: "light", fontSize: 14 };
const userPrefs = { fontSize: 18 };
const merged = { ...defaults, ...userPrefs }; // { theme: "light", fontSize: 18 }
// later spreads override earlier ones for the same key

const { fontSize, ...rest } = merged; // rest destructuring: { theme: "light" }
console.log(fontSize, rest);

function max(...values) {           // rest parameters, from the previous lesson
  return Math.max(...values);       // spread to pass array elements as separate args
}
console.log(max(3, 7, 2));           // 7`,
          explanation:
            "`{ ...defaults, ...userPrefs }` is a shallow merge — later spreads win on key conflicts. This is the standard pattern for merging configuration objects and for updating state immutably (e.g. `setState({ ...state, fontSize: 18 })`).",
        },
      ],
      pitfalls: [
        {
          title: "Spread only copies one level deep",
          body: "`const copy = { ...original }` creates a new top-level object, but any nested objects/arrays inside it are still shared references. Mutating `copy.address.city` also mutates `original.address.city`. For deep copies, use `structuredClone(original)` (modern, built-in) rather than hand-rolling recursive copies.",
        },
      ],
    },
    {
      id: "ts-arrays-objects",
      heading: "TypeScript: array types, tuples, and object shapes",
      body: [
        "Array types are written `T[]` or `Array<T>` (equivalent) — every element must match type `T`. A **tuple** (`[string, number]`) is a fixed-length array where each position has its own specific type — useful for things like coordinate pairs or a `[key, value]` entry, where position carries meaning.",
        "Object shapes are typically described with an `interface` or a `type` alias — both let you name the exact set of properties (and their types) an object must have. This is your first real look at describing custom data shapes, expanded fully in the Type System Deep Dive module.",
      ],
      examples: [
        {
          id: "ts-array-tuple",
          title: "Array types vs tuple types",
          ts: `let scores: number[] = [90, 85, 78];
scores.push(100);      // OK
scores.push("100");    // Error: Argument of type 'string' is not assignable to 'number'

let point: [number, number] = [10, 20]; // a tuple: exactly 2 numbers
point = [10, 20, 30];  // Error: Source has 3 element(s) but target allows only 2

let entry: [string, number] = ["age", 36]; // fixed positions, different types allowed`,
        },
        {
          id: "ts-interface",
          title: "Describing object shapes with an interface",
          ts: `interface User {
  name: string;
  age: number;
  role?: "admin" | "member"; // optional property
}

function printUser(user: User): void {
  console.log(\`\${user.name} (\${user.age})\`);
}

printUser({ name: "Ada", age: 36 });               // OK — role is optional
printUser({ name: "Ada", age: "36" as unknown as number }); // would need a real number
printUser({ name: "Ada" });
// Error: Property 'age' is missing in type '{ name: string; }' but required in type 'User'.

// Destructuring with types
function printName({ name }: User): void {
  console.log(name);
}`,
          explanation:
            "The `interface` describes the required contract. Any object passed to `printUser` must have at least `name: string` and `age: number` — TypeScript checks this at every call site, not just where the interface is declared.",
        },
      ],
      pitfalls: [
        {
          title: "Array<T> vs tuple — pick based on whether position has meaning",
          body: "Use `T[]` when you have a variable-length list of same-typed things (a list of users). Use a tuple when a fixed number of positions each mean something different and specific (a [latitude, longitude] pair, or a React useState() return value). Mixing them up loses type precision either way.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Are arrays and objects passed by value or by reference in JavaScript?",
      answer:
        "By reference. Assigning an array or object to a new variable copies the reference, not the underlying data — both variables point to the same object in memory, so mutating through one is visible through the other.",
    },
    {
      question: "What's the difference between spread and rest syntax, given they use the same ... symbol?",
      answer:
        "Spread expands an iterable/object into individual elements (used when building a new array/object or passing arguments), e.g. [...arr, 4]. Rest collects multiple elements into a single array/object, used in destructuring or function parameters, e.g. function f(...args) or const { a, ...rest } = obj. The direction — expanding vs collecting — depends on which side of an assignment or which syntactic position it appears in.",
        },
    {
      question: "Does spreading an object create a deep copy?",
      answer:
        "No, only a shallow copy. Top-level properties are copied, but any nested objects or arrays inside are still shared references with the original. Mutating a nested property affects both the copy and the original. Use structuredClone() for a true deep copy.",
    },
    {
      question: "In `const { a, b: renamed = 5, ...rest } = obj`, explain what each part does.",
      answer:
        "`a` extracts the property `a` into a variable named `a`. `b: renamed = 5` extracts property `b` but binds it to a variable named `renamed`, defaulting to 5 if `b` is undefined. `...rest` collects all remaining own enumerable properties of `obj` (excluding `a` and `b`) into a new object called `rest`.",
    },
    {
      question: "When would you use a TypeScript tuple instead of a regular array type?",
      answer:
        "When a fixed number of positions each carry a distinct, specific meaning and type — like a [latitude, longitude] pair or a key/value entry — rather than an arbitrary-length list of uniformly-typed items. Tuples enforce both the exact length and the type at each position; array types (T[]) only enforce that every element matches one type.",
    },
  ],
  takeaways: [
    "Arrays and objects are reference types — copying the variable copies the reference, not the data.",
    "Array destructuring matches by position; object destructuring matches by key name (renameable, with defaults).",
    "Spread (...) expands values for copying/merging; rest (...) collects values into an array/object — same syntax, opposite direction, distinguished by context.",
    "Object/array spreads are shallow — nested structures remain shared references; use structuredClone() for deep copies.",
    "In TypeScript, use T[] for variable-length uniform lists and tuples ([T, U]) when fixed positions have distinct meanings; use interface/type to describe object shapes.",
  ],
  status: "available",
};
