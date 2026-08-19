import type { Lesson } from "@/content/types";

export const tsFunctionTypesGenericsLesson: Lesson = {
  id: "functions-scope-ts-function-types-generics",
  slug: "ts-function-types-overloads-generics-intro",
  moduleSlug: "functions-scope",
  title: "TypeScript: Function Types, Overloads & Generics Introduction",
  summary:
    "Describing the shape of a function as its own reusable type, giving one function multiple valid call signatures with overloads, and writing your first generic functions.",
  estimatedMinutes: 35,
  objectives: [
    "Write a standalone function type and use it to type a callback parameter",
    "Describe a callable value with a call signature in an interface",
    "Write function overloads for a function with genuinely different behavior per input shape",
    "Write and call basic generic functions, and understand type parameter inference",
  ],
  sections: [
    {
      id: "function-type-expressions",
      heading: "Function types as a reusable shape",
      body: [
        "So far you've annotated a function's parameters and return type directly on the function itself. TypeScript also lets you describe **the shape of a function** as its own standalone type — useful anywhere you accept a function as a value: callback parameters, object properties that hold functions, or an array of functions.",
        "The syntax mirrors an arrow function's signature: `(param: Type, param2: Type2) => ReturnType`.",
      ],
      examples: [
        {
          id: "function-type-basic",
          title: "Naming a function type and using it for a callback parameter",
          ts: `type CompareFn = (a: number, b: number) => number;

function sortNumbers(numbers: number[], compare: CompareFn): number[] {
  return [...numbers].sort(compare);
}

const ascending: CompareFn = (a, b) => a - b;
const descending: CompareFn = (a, b) => b - a;

console.log(sortNumbers([3, 1, 2], ascending));  // [1, 2, 3]
console.log(sortNumbers([3, 1, 2], descending)); // [3, 2, 1]

sortNumbers([3, 1, 2], (a, b) => a.toString().localeCompare(b.toString()));
// OK — an inline arrow function is checked against CompareFn too`,
          explanation:
            "Once `CompareFn` is defined, every place that needs 'a function taking two numbers and returning a number' can reference it by name instead of repeating the signature — and TypeScript checks any function value assigned to a `CompareFn`-typed slot against that exact shape, whether it's a named function or an inline arrow function.",
        },
      ],
    },
    {
      id: "call-signatures",
      heading: "Call signatures: describing callable objects",
      body: [
        "An `interface` (or object type) can describe something that's directly callable by including a **call signature** — a function type written without a name, as one of the interface's members. This is how you'd type a function that also carries extra properties on itself (functions are objects in JavaScript, so this is legal and occasionally genuinely useful, e.g. a memoized function exposing a `.cache` property).",
      ],
      examples: [
        {
          id: "call-signature-example",
          title: "A callable interface with an extra property",
          ts: `interface Greeter {
  (name: string): string;   // call signature — how to invoke it
  defaultGreeting: string;  // a regular property, alongside being callable
}

function makeGreeter(): Greeter {
  const greet = ((name: string) => \`\${greet.defaultGreeting}, \${name}!\`) as Greeter;
  greet.defaultGreeting = "Hello";
  return greet;
}

const greeter = makeGreeter();
console.log(greeter("Ada"));              // "Hello, Ada!"
console.log(greeter.defaultGreeting);     // "Hello"
greeter.defaultGreeting = "Hi";
console.log(greeter("Alan"));             // "Hi, Alan!"`,
          explanation:
            "This pattern is uncommon in everyday code — most of the time a plain `type Fn = (...) => ReturnType` is all you need — but it's worth recognizing, since libraries occasionally attach configuration or cache properties directly onto a function value, and this is how you'd type that shape correctly.",
        },
      ],
    },
    {
      id: "overloads",
      heading: "Function overloads: one function, multiple valid signatures",
      body: [
        "Sometimes a function's return type genuinely depends on *which* argument types it was called with — not something a single signature (even with union types) can express precisely. **Function overloads** let you declare several possible call signatures above the implementation, followed by exactly one general implementation signature that must be compatible with all of them.",
        "The overload signatures are what callers see and get checked against; the final implementation signature is only visible inside the function body and is usually written more loosely (often with `any` or broad unions) since it has to accommodate every overload.",
      ],
      examples: [
        {
          id: "overloads-example",
          title: "A function whose return type depends on its input type",
          ts: `function parseValue(input: string): string[];
function parseValue(input: number): number[];
function parseValue(input: string | number): string[] | number[] {
  if (typeof input === "string") {
    return input.split(",");
  }
  return [input, input * 2, input * 3];
}

const words = parseValue("a,b,c"); // inferred type: string[]
const nums = parseValue(5);        // inferred type: number[]

words.map((w) => w.toUpperCase()); // OK — TS knows words is string[]
nums.map((n) => n.toFixed(2));     // OK — TS knows nums is number[]`,
          explanation:
            "Callers never see the combined `string | number` implementation signature — TypeScript matches their actual argument against the two declared overloads above it and picks the correspondingly precise return type. Without overloads, `parseValue`'s return type would have to be the less useful `string[] | number[]` for every call, forcing callers to narrow it manually even when they already know which one they'll get.",
        },
      ],
      pitfalls: [
        {
          title: "Overloads are usually a last resort",
          body: "If a union parameter type and a bit of runtime branching inside a single signature can express what you need, prefer that — it's simpler to read and maintain. Reach for overloads specifically when the *return type* needs to vary precisely based on the *input type* in a way a single signature can't capture, as in the example above.",
        },
      ],
    },
    {
      id: "generics-intro",
      heading: "Generic functions: your first look",
      body: [
        "A **generic function** is written once but works correctly, with full type safety, across many different types — without falling back to `any`. You declare a **type parameter** (conventionally named `T`, or something descriptive) in angle brackets before the parameter list, then use it like any other type inside the signature. TypeScript usually **infers** the type parameter automatically from the arguments you actually pass, so most call sites need no extra syntax at all.",
      ],
      examples: [
        {
          id: "generic-identity",
          title: "A generic identity function — the simplest possible generic",
          ts: `function identity<T>(value: T): T {
  return value;
}

const a = identity("hello"); // T inferred as string; a: string
const b = identity(42);      // T inferred as number; b: number
const c = identity<boolean>(true); // T given explicitly — rarely necessary here`,
          explanation:
            "Compare this to `function identity(value: any): any`, which would also 'work' but loses all type information — calling `identity(42).toUpperCase()` would incorrectly compile. The generic version preserves the *exact* input type through to the return type, so TypeScript still catches that mistake.",
        },
        {
          id: "generic-constraint",
          title: "A more realistic generic, with a constraint",
          ts: `function getFirstElement<T>(items: T[]): T | undefined {
  return items[0];
}

const firstNum = getFirstElement([1, 2, 3]);        // number | undefined
const firstUser = getFirstElement([{ name: "Ada" }]); // { name: string } | undefined

// A constrained generic: T must have a "length" property
function logLength<T extends { length: number }>(item: T): T {
  console.log(item.length);
  return item;
}

logLength("hello");      // OK — strings have .length
logLength([1, 2, 3]);    // OK — arrays have .length
logLength(42);
// Error: Argument of type 'number' is not assignable to parameter
// of type '{ length: number }'.`,
          explanation:
            "`T extends { length: number }` is a **generic constraint**: it doesn't restrict `T` to one specific type, but it does require that whatever `T` ends up being must have a `.length` property — so the function body can safely access `item.length` while still accepting strings, arrays, or any other type that qualifies. Full coverage of constraints, defaults, and multi-parameter generics continues in the Type System Deep Dive module.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you write a standalone, reusable function type in TypeScript, and when would you use one?",
      answer:
        "As a type alias with an arrow-function-style signature, e.g. type CompareFn = (a: number, b: number) => number. It's useful anywhere a function is accepted as a value — callback parameters, object properties holding functions, arrays of functions — so you don't repeat the same signature everywhere and can check multiple function values against one shared shape.",
    },
    {
      question: "What is a call signature in a TypeScript interface?",
      answer:
        "A function signature written without a name as a member of an interface or object type, describing that the value is directly callable. It's used when a value needs to be both callable and carry additional properties, since functions are objects in JavaScript and can legally have extra properties attached.",
    },
    {
      question: "Why would you use function overloads instead of a single signature with a union parameter type?",
      answer:
        "When the return type needs to vary precisely depending on which specific input type was passed, in a way a single signature can't express. Overloads let callers see a precise, input-specific return type for each declared signature, rather than always getting the broader union of all possible return types that a single signature would force.",
    },
    {
      question: "What does `<T extends { length: number }>` mean on a generic function?",
      answer:
        "It declares a generic type parameter T with a constraint: T can be any type, but it must have a length property of type number. This lets the function body safely use item.length while still accepting any type that satisfies the constraint — strings, arrays, or custom objects with a length property — rather than being locked to one concrete type.",
    },
    {
      question: "Why is `function identity<T>(value: T): T` better than `function identity(value: any): any`?",
      answer:
        "The generic version preserves the exact input type all the way through to the return type, so TypeScript can still catch misuse of the result (e.g. calling a string-only method on a number that was passed in). The any version disables type-checking entirely for both the parameter and the return value, silently allowing incorrect usage to compile.",
    },
  ],
  takeaways: [
    "Function types can be named and reused (type Fn = (...) => ReturnType) instead of repeating a signature everywhere a function value is accepted.",
    "A call signature inside an interface types a value that's both callable and carries extra properties.",
    "Function overloads give callers a precise, input-specific return type when a single signature (even with unions) can't express the relationship between input and output types.",
    "Generic functions (<T>) preserve exact type information through a function, unlike any — TypeScript usually infers T automatically from the arguments passed.",
    "Generic constraints (T extends ...) restrict what T can be just enough for the function body to safely use, without locking the function to one concrete type.",
  ],
  status: "available",
};
