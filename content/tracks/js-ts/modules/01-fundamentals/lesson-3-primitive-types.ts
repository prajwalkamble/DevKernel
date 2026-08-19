import type { Lesson } from "@/content/types";

export const primitiveTypesLesson: Lesson = {
  id: "fundamentals-primitive-types",
  slug: "primitive-types-typeof",
  moduleSlug: "fundamentals",
  title: "Primitive Types & typeof",
  summary:
    "JavaScript's seven primitive types and the typeof operator, then TypeScript's static type system built on top: annotations, any, unknown, never, and void.",
  estimatedMinutes: 30,
  objectives: [
    "List and describe JavaScript's seven primitive types",
    "Use typeof correctly and know its quirks",
    "Understand the difference between any, unknown, never and void in TypeScript",
    "Explain why unknown is safer than any",
  ],
  sections: [
    {
      id: "seven-primitives",
      heading: "JavaScript's seven primitive types",
      body: [
        "JavaScript has exactly seven primitive types: `string`, `number`, `boolean`, `undefined`, `null`, `symbol` (ES2015), and `bigint` (ES2020). Everything else — objects, arrays, functions, dates — is an **object** under the hood.",
        "Primitives are **immutable** and compared **by value**. Objects are compared **by reference**. `\"a\" === \"a\"` is `true`; `{} === {}` is `false`, because those are two different object references even though they look identical.",
        "`number` represents both integers and floats using IEEE 754 double-precision floating point — there is no separate integer type. `bigint` exists specifically for integers larger than `Number.MAX_SAFE_INTEGER` (2^53 - 1).",
      ],
      examples: [
        {
          id: "primitives-overview",
          title: "The seven primitive types",
          js: `console.log(typeof "hello");     // "string"
console.log(typeof 42);          // "number"
console.log(typeof 3.14);        // "number" — no separate float type
console.log(typeof true);        // "boolean"
console.log(typeof undefined);   // "undefined"
console.log(typeof null);        // "object"  <-- a famous, ancient bug!
console.log(typeof Symbol("id"));// "symbol"
console.log(typeof 10n);         // "bigint"

console.log("a" === "a");        // true  — compared by value
console.log({} === {});          // false — compared by reference (different objects)`,
        },
      ],
      pitfalls: [
        {
          title: "typeof null is \"object\"",
          body: "This is a bug baked into JavaScript since 1995 that can never be fixed without breaking the web. To reliably check for null, use `value === null` directly, not `typeof value === \"object\"` (which is also true for actual objects, arrays, and — confusingly — not functions, since `typeof` for a function is `\"function\"`).",
        },
      ],
    },
    {
      id: "null-vs-undefined",
      heading: "null vs undefined",
      body: [
        "`undefined` means a variable has been declared but never assigned a value — it's JavaScript's own 'nothing here yet'. It's also what a function returns if it has no explicit `return` statement, and what you get accessing a non-existent object property.",
        "`null` is an intentional, explicit 'no value' that **you** assign — JavaScript never assigns it on its own. Convention: use `null` when you want to deliberately say 'this is empty', and let `undefined` mean 'this was never set'.",
      ],
      examples: [
        {
          id: "null-undefined-demo",
          title: "Where each one shows up",
          js: `let a;
console.log(a); // undefined — declared, not assigned

function noop() {}
console.log(noop()); // undefined — no return statement

const obj = { x: 1 };
console.log(obj.y); // undefined — property doesn't exist

let selectedUser = null; // explicit: "nobody is selected right now"

console.log(null == undefined);  // true  (loose equality treats them as equal)
console.log(null === undefined); // false (different types, strict equality)`,
        },
      ],
    },
    {
      id: "ts-static-types",
      heading: "TypeScript: annotating with the same primitive names",
      body: [
        "TypeScript's basic type annotations mirror the `typeof` results you already know: `string`, `number`, `boolean`, and so on — with lowercase names, since `String`/`Number`/`Boolean` (capitalized) refer to their wrapper object types, which you should avoid in annotations.",
        "TypeScript adds several types that don't exist in JavaScript's runtime type system at all — they only exist to help the compiler reason about your code: `any`, `unknown`, `never`, and `void`.",
      ],
      examples: [
        {
          id: "ts-primitive-annotations",
          title: "Annotating primitives",
          ts: `let username: string = "ada";
let age: number = 36;
let isActive: boolean = true;
let id: bigint = 10n;
let tag: symbol = Symbol("tag");

// Wrong: capitalized wrapper types — avoid these
let wrong: String = "ada"; // works, but is a lint-flagged anti-pattern`,
        },
      ],
    },
    {
      id: "any-unknown-never-void",
      heading: "any, unknown, never & void",
      body: [
        "`any` turns off type-checking entirely for that value — you can call any method, access any property, assign it anywhere, with zero compiler safety. It's an escape hatch, effectively opting back into plain JavaScript behavior for that one variable. Overusing `any` is the single most common way a TypeScript codebase quietly stops being type-safe.",
        "`unknown` is `any`'s safer sibling: you can assign *anything* to an `unknown` variable, but you cannot *use* it — call it, access its properties, pass it somewhere typed — until you narrow it with a type check (`typeof`, `instanceof`, or a custom type guard). Prefer `unknown` over `any` whenever a value's type genuinely isn't known ahead of time (e.g. `JSON.parse()`'s return value, data from an API).",
        "`void` describes the return type of a function that doesn't return a meaningful value (its return is `undefined`, but you're saying 'don't rely on this return value'). `never` describes a function that **never returns at all** — it always throws, or loops forever — or a type representing a value that can logically never occur (like the impossible branch of an exhaustive `switch`).",
      ],
      examples: [
        {
          id: "any-vs-unknown",
          title: "any lets bugs through; unknown forces a check",
          ts: `let dataAny: any = JSON.parse('{"name":"Ada"}');
console.log(dataAny.name.toUpperCase()); // compiles fine — even if .name doesn't exist, TS won't catch it

let dataUnknown: unknown = JSON.parse('{"name":"Ada"}');
console.log(dataUnknown.name);
// Error: Object is of type 'unknown'.

if (typeof dataUnknown === "object" && dataUnknown !== null && "name" in dataUnknown) {
  console.log((dataUnknown as { name: string }).name); // now it's safe
}`,
          explanation:
            "With `any`, `.name.toUpperCase()` compiles even though we have no idea if `.name` exists or is a string — the bug only appears at runtime. `unknown` forces you to prove the shape before TypeScript lets you touch it.",
        },
        {
          id: "void-never",
          title: "void vs never",
          ts: `function logMessage(msg: string): void {
  console.log(msg);
  // implicitly returns undefined — that's fine, caller shouldn't use the result
}

function fail(message: string): never {
  throw new Error(message); // this function can never finish normally
}

function infiniteLoop(): never {
  while (true) { /* ... */ }
}`,
          explanation:
            "`logMessage` returns, just with nothing useful — that's `void`. `fail` and `infiniteLoop` never reach a return at all — that's `never`. Using `never` correctly lets TypeScript verify exhaustiveness, e.g. flagging an unhandled case in a switch over a union type.",
        },
      ],
      pitfalls: [
        {
          title: "\"any is fine, I'll fix the types later\"",
          body: "any is contagious — once a value is typed any, anything derived from it (function returns, property access) also silently becomes any, spreading untyped code through your codebase invisibly. Prefer unknown at boundaries (API responses, JSON.parse) and narrow explicitly.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the seven primitive types in JavaScript?",
      answer:
        "string, number, boolean, undefined, null, symbol, and bigint. Everything else (objects, arrays, functions) is an object.",
    },
    {
      question: "Why does typeof null return \"object\"?",
      answer:
        "It's a long-standing bug from the original 1995 implementation of JavaScript that has been kept for backward compatibility ever since — fixing it would break existing code across the web. Use `value === null` for a reliable null check instead of typeof.",
    },
    {
      question: "What is the difference between null and undefined?",
      answer:
        "undefined means a variable was declared but never assigned, or a function/property doesn't produce a value — JavaScript sets this automatically. null is an explicit, intentional 'no value' that a developer assigns on purpose. null == undefined is true (loose equality), but null === undefined is false.",
    },
    {
      question: "What's the difference between any and unknown in TypeScript?",
      answer:
        "any disables type-checking entirely for that value — you can do anything with it with no compiler errors, and that unsafety spreads to anything derived from it. unknown also accepts any value, but you cannot use it (call it, access properties) until you narrow its type with a check like typeof or instanceof. unknown is the type-safe alternative to any.",
    },
    {
      question: "When would a function's return type be never instead of void?",
      answer:
        "void is for a function that returns normally but produces no useful value (implicitly returns undefined). never is for a function that never returns control to the caller at all — because it always throws an error, or because it loops forever.",
    },
  ],
  takeaways: [
    "JavaScript has 7 primitives: string, number, boolean, undefined, null, symbol, bigint — everything else is an object.",
    "typeof null === \"object\" is a known historic bug; check for null with strict equality instead.",
    "undefined is JavaScript's automatic 'not set yet'; null is your explicit 'intentionally empty'.",
    "any disables type-checking and spreads unsafety; unknown is the safe alternative that forces narrowing before use.",
    "void means 'returns nothing meaningful'; never means 'never returns at all' (throws or loops forever).",
  ],
  status: "available",
};
