import type { Lesson } from "@/content/types";

export const functionsBasicsLesson: Lesson = {
  id: "fundamentals-functions-basics",
  slug: "functions-basics",
  moduleSlug: "fundamentals",
  title: "Functions: Declarations, Expressions & Arrow Functions",
  summary:
    "The three ways to write a function, default and rest parameters, a first look at `this`, and how TypeScript types parameters, return values, and optional arguments.",
  estimatedMinutes: 30,
  objectives: [
    "Distinguish function declarations, function expressions, and arrow functions",
    "Use default parameters and rest parameters",
    "Know the basic difference in how `this` behaves in arrow vs regular functions",
    "Type function parameters and return values in TypeScript, including optional parameters",
  ],
  sections: [
    {
      id: "three-function-forms",
      heading: "Three ways to write a function",
      body: [
        "A **function declaration** (`function greet() {}`) is hoisted completely — both the name and the implementation — so you can call it before its line in the file. A **function expression** (`const greet = function() {}`) is only hoisted as a variable (per var/let/const rules); the function itself isn't available until that line executes. An **arrow function** (`const greet = () => {}`, ES2015) is a compact function expression with two key differences from regular functions: it has no own `this` (see below), and it cannot be used as a constructor (`new arrowFn()` throws).",
      ],
      examples: [
        {
          id: "hoisting-comparison",
          title: "Declarations are fully hoisted; expressions are not",
          js: `console.log(sayHi()); // "Hi!" — works, declarations are fully hoisted
function sayHi() {
  return "Hi!";
}

console.log(sayBye()); // TypeError: sayBye is not a function
var sayBye = function () {
  return "Bye!";
};
// (with let/const this would be a ReferenceError from the TDZ instead)`,
        },
      ],
    },
    {
      id: "params",
      heading: "Default and rest parameters",
      body: [
        "Default parameters (`function f(x = 10)`) supply a fallback used only when the argument is `undefined` (not for any other falsy value like `0` or `\"\"`). Rest parameters (`function f(...args)`) collect any number of trailing arguments into a real array — replacing the old, awkward `arguments` object, which isn't a true array and doesn't exist at all in arrow functions.",
      ],
      examples: [
        {
          id: "default-rest-params",
          title: "Defaults and rest parameters in practice",
          js: `function greet(name = "friend") {
  return \`Hello, \${name}!\`;
}
console.log(greet());        // "Hello, friend!"
console.log(greet(undefined)); // "Hello, friend!" — undefined triggers the default
console.log(greet(0));       // TypeError-free: 0 is passed through, default only applies to undefined... wait
console.log(greet(""));      // "Hello, !" — "" is NOT undefined, so default does NOT apply

function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10 — numbers is a real array: [1, 2, 3, 4]`,
          explanation:
            "The default only kicks in for `undefined` specifically — passing `\"\"` or `0` uses that value as-is. This trips people expecting default params to behave like the falsy-guarding `||` pattern.",
        },
      ],
    },
    {
      id: "this-basics",
      heading: "A first look at this",
      body: [
        "In a regular function, `this` is determined by **how the function is called**, not where it's defined (covered fully in Module 2). Called as `obj.method()`, `this` is `obj`. Called as a bare function, `this` is `undefined` in strict mode (or the global object otherwise).",
        "An **arrow function has no `this` of its own** — it captures `this` lexically from the surrounding scope at the point it's defined, permanently. This makes arrow functions the natural choice for callbacks that need to keep referring to an outer `this` (e.g. inside a class method or another function), and a poor choice for object methods that need their own `this`.",
      ],
      examples: [
        {
          id: "this-arrow-vs-regular",
          title: "Regular function vs arrow function this",
          js: `const counter = {
  count: 0,
  incrementRegular: function () {
    setTimeout(function () {
      this.count++; // 'this' here is NOT counter (it's undefined/global in the callback)
      console.log(this.count); // NaN or throws — 'this' is lost
    }, 0);
  },
  incrementArrow: function () {
    setTimeout(() => {
      this.count++; // arrow function 'this' is inherited from incrementArrow's 'this' (counter)
      console.log(this.count); // 1 — works correctly
    }, 0);
  },
};`,
          explanation:
            "This is the single most common real-world reason to reach for an arrow function: it doesn't rebind `this` when passed as a callback, so it keeps referring to whatever `this` meant in the method that created it.",
        },
      ],
      pitfalls: [
        {
          title: "Arrow functions as object methods",
          body: "`const obj = { value: 1, getValue: () => this.value }` — this is a bug. The arrow function captures `this` from the *surrounding* (often module/global) scope, not `obj`, since arrow functions never get their own `this`. Use a regular function or method shorthand (`getValue() { return this.value }`) for object methods.",
        },
      ],
    },
    {
      id: "ts-function-types",
      heading: "TypeScript: typing parameters and return values",
      body: [
        "You annotate each parameter's type after its name, and the return type after the parameter list. TypeScript can usually **infer** the return type from the function body, but annotating it explicitly on exported/public functions is good practice — it documents intent and catches accidental changes.",
        "An optional parameter (`name?: string`) must come after all required parameters, and its type is automatically widened to include `undefined`. This is distinct from a default parameter, which supplies a concrete fallback value.",
      ],
      examples: [
        {
          id: "ts-typed-function",
          title: "Fully typed function signatures",
          ts: `function greet(name: string = "friend"): string {
  return \`Hello, \${name}!\`;
}

function describeUser(name: string, age?: number): string {
  // age has type: number | undefined
  if (age === undefined) {
    return \`\${name}\`;
  }
  return \`\${name}, age \${age}\`;
}

function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

// Arrow function with full typing
const multiply = (a: number, b: number): number => a * b;`,
          explanation:
            "Notice `age?: number` means callers may omit the argument entirely; inside the function its type is `number | undefined`, so TypeScript forces you to handle the missing case (as seen with `describeUser`) before using it as a plain number.",
        },
      ],
      pitfalls: [
        {
          title: "Optional parameter vs default parameter",
          body: "`function f(x?: number)` gives `x` the type `number | undefined` with no runtime value assigned — inside the function `x` really is `undefined` if omitted. `function f(x: number = 5)` gives `x` the concrete type `number` inside the function body, because TypeScript knows the default guarantees a value. Prefer defaults when you have a sensible fallback; use optional only when 'missing' is a meaningfully different state from any concrete value.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What's the difference between a function declaration and a function expression?",
      answer:
        "A function declaration (function foo() {}) is fully hoisted, including its implementation, so it can be called before its line in the source. A function expression (const foo = function() {}) is only hoisted according to the variable declaration rules of var/let/const — the function value itself isn't available until that assignment line executes.",
    },
    {
      question: "How does `this` differ between a regular function and an arrow function?",
      answer:
        "A regular function's `this` is determined dynamically by how it's called (its call-site) — e.g. obj.method() binds `this` to obj. An arrow function has no `this` of its own; it lexically captures `this` from its enclosing scope at definition time and never rebinds it, regardless of how it's later called.",
    },
    {
      question: "Why shouldn't you use an arrow function for an object method that needs `this`?",
      answer:
        "Because the arrow function doesn't get its own `this` bound to the object — it captures `this` from whatever scope the object literal was created in (often the module/global scope), not the object itself, leading to `this` being undefined or wrong inside the method.",
    },
    {
      question: "What's the difference between rest parameters and the arguments object?",
      answer:
        "Rest parameters (...args) produce a real Array with all array methods available (map, reduce, etc.) and can be combined with named parameters. The arguments object is array-like but not a true array (no map/reduce without conversion), captures all arguments regardless of named parameters, and doesn't exist at all inside arrow functions.",
    },
    {
      question: "In TypeScript, what's the difference between an optional parameter (x?: number) and a default parameter (x: number = 5)?",
      answer:
        "An optional parameter's type becomes number | undefined and has no assigned value if omitted — the function body must handle the undefined case. A default parameter has the concrete type number inside the function body, because TypeScript knows omitting it results in the default value being used, not undefined.",
    },
  ],
  takeaways: [
    "Function declarations are fully hoisted; function expressions and arrow functions are not.",
    "Arrow functions don't have their own this — they inherit it lexically from the enclosing scope, which makes them ideal for callbacks but wrong for object methods.",
    "Default parameters only trigger on undefined, not on other falsy values like 0 or \"\".",
    "Rest parameters (...args) give you a real array; the old arguments object does not (and doesn't exist in arrow functions).",
    "TypeScript optional parameters (?) add | undefined to the type; default parameters keep the concrete type inside the function body.",
  ],
  status: "available",
};
