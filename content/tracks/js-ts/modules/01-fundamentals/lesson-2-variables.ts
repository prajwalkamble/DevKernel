import type { Lesson } from "@/content/types";

export const variablesLesson: Lesson = {
  id: "fundamentals-variables",
  slug: "variables-var-let-const",
  moduleSlug: "fundamentals",
  title: "Variables: var, let & const",
  summary:
    "The three ways to declare a variable in JavaScript, how scope and hoisting actually work under the hood, and how TypeScript layers type annotations and inference on top.",
  estimatedMinutes: 30,
  objectives: [
    "Explain the scoping differences between var, let and const",
    "Explain hoisting and the Temporal Dead Zone",
    "Know when to use let vs const (and why var is avoided today)",
    "Add type annotations to variables in TypeScript and understand type inference",
  ],
  sections: [
    {
      id: "three-keywords",
      heading: "Three keywords, three behaviors",
      body: [
        "JavaScript has three ways to declare a variable: `var` (original, ES1), and `let`/`const` (added in ES2015 / ES6). They differ in **scope**, **hoisting behavior**, and whether **redeclaration** and **reassignment** are allowed.",
        "`var` is **function-scoped** (or globally-scoped if declared outside any function) — it ignores block boundaries like `if {}` or `for {}` entirely. `let` and `const` are **block-scoped** — they only exist inside the nearest enclosing `{}`.",
      ],
      examples: [
        {
          id: "var-vs-let-scope",
          title: "Function scope vs block scope",
          js: `function demo() {
  if (true) {
    var fromVar = "I leak out of the block";
    let fromLet = "I stay inside the block";
  }

  console.log(fromVar); // "I leak out of the block"
  console.log(fromLet); // ReferenceError: fromLet is not defined
}
demo();`,
          explanation:
            "`var` only respects function boundaries, so `fromVar` is visible for the rest of `demo()`. `let` respects the `if` block's `{}`, so `fromLet` never escapes it.",
        },
      ],
      pitfalls: [
        {
          title: "The classic var-in-a-loop bug",
          body: "`for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i)); }` logs `3, 3, 3` — every callback shares the *same* function-scoped `i`, which has already finished the loop by the time the callbacks run. Swapping `var` for `let` fixes it (`0, 1, 2`) because `let` creates a **fresh binding of `i` for every iteration**.",
        },
      ],
    },
    {
      id: "hoisting-tdz",
      heading: "Hoisting and the Temporal Dead Zone",
      body: [
        "All declarations in JavaScript are **hoisted** — conceptually moved to the top of their scope during compilation, before any code runs. But `var`, `let`, and `const` are hoisted differently.",
        "`var` declarations are hoisted *and initialized to `undefined`* immediately, so reading a `var` before its declaration line gives `undefined` instead of an error.",
        "`let` and `const` are hoisted too, but **not initialized**. The span from the top of the scope to the actual declaration line is called the **Temporal Dead Zone (TDZ)** — accessing the variable in that span throws a `ReferenceError`, rather than silently returning `undefined`. This is a deliberate safety feature.",
      ],
      examples: [
        {
          id: "tdz-example",
          title: "var returns undefined, let throws",
          js: `console.log(a); // undefined (hoisted, not yet assigned)
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;`,
          explanation:
            "Both `a` and `b` are hoisted, but only `var`'s hoisting includes an implicit `undefined` initialization. `let`/`const` leave the binding in the TDZ until the line that declares them actually executes.",
        },
      ],
    },
    {
      id: "let-vs-const",
      heading: "let vs const: reassignment, not immutability",
      body: [
        "`const` means the **binding** cannot be reassigned — you cannot point the variable at a new value after declaration. It does **not** make the value itself immutable. An object or array declared with `const` can still have its contents mutated; only the variable name can't be reassigned to a different object/array.",
        "Modern style: default to `const` for everything. Only reach for `let` when you know the variable's value must change (a loop counter, an accumulator). Avoid `var` entirely in new code — its function-scoping and lack of a TDZ are a near-permanent source of bugs, and every reputable style guide (Airbnb, StandardJS, the TypeScript team's own code) bans it.",
      ],
      examples: [
        {
          id: "const-mutability",
          title: "const blocks reassignment, not mutation",
          js: `const user = { name: "Ada" };
user.name = "Grace"; // fine — mutating the object's contents
console.log(user);   // { name: "Grace" }

user = { name: "Alan" }; // TypeError: Assignment to constant variable.`,
          explanation:
            "`user` is a constant *reference* to an object, not a frozen object. To make the object itself immutable you'd need `Object.freeze(user)` (shallow) — a separate concept from `const`.",
        },
      ],
    },
    {
      id: "ts-variables",
      heading: "TypeScript: annotating and inferring variable types",
      body: [
        "`var`, `let`, and `const` all work identically in TypeScript — TypeScript adds nothing new to *scoping*. What it adds is an optional **type annotation** after the variable name, and automatic **type inference** when you omit one.",
        "You rarely need to annotate a variable that's initialized immediately — TypeScript infers the type from the assigned value. Annotate when a variable starts uninitialized, when inference would be too broad, or for clarity in public APIs.",
      ],
      examples: [
        {
          id: "ts-inference",
          title: "Inference vs explicit annotation",
          ts: `let age = 25;        // inferred as: number
let name = "Ada";    // inferred as: string

age = "twenty-five";
// Error: Type 'string' is not assignable to type 'number'.

let score: number;   // no initializer — annotation required to avoid \`any\`
score = 100;

const PI: number = 3.14159; // annotation is optional here since 3.14159 is a literal number`,
          explanation:
            "Once TypeScript infers `age` is a `number`, it enforces that type for the rest of the variable's life — this is why the reassignment to a string fails, even though plain JavaScript would allow it silently.",
        },
        {
          id: "ts-const-narrowing",
          title: "const gets a narrower (literal) inferred type",
          ts: `let mode = "dark";        // inferred type: string
const theme = "dark";     // inferred type: "dark"  (a literal type!)

function setMode(m: "dark" | "light") { /* ... */ }

setMode(theme); // OK — "dark" matches the literal union
setMode(mode);  // Error — plain 'string' is not assignable to "dark" | "light"`,
          explanation:
            "Because `const` can never be reassigned, TypeScript knows its value can never change, so it infers the most precise possible type — the literal `\"dark\"` — instead of the wider `string`. This is one more reason to prefer `const` by default.",
        },
      ],
      pitfalls: [
        {
          title: "TypeScript doesn't stop var's scoping problems",
          body: "TypeScript adds types, not new scoping rules. `var` inside a TypeScript file still leaks out of blocks and still has no TDZ. Use ESLint (`no-var`) alongside TypeScript if you want that specifically flagged — the TypeScript compiler by itself won't complain about `var` usage.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between var, let, and const?",
      answer:
        "var is function-scoped, hoisted and initialized to undefined, and can be redeclared/reassigned. let is block-scoped, hoisted into a Temporal Dead Zone (throws if accessed before declaration), and can be reassigned but not redeclared in the same scope. const behaves like let but cannot be reassigned after initialization (though objects/arrays it holds can still be mutated).",
    },
    {
      question: "What is the Temporal Dead Zone?",
      answer:
        "The period between entering a scope (where let/const are hoisted) and the line where the variable is actually declared. Accessing the variable during this window throws a ReferenceError instead of returning undefined, unlike var.",
    },
    {
      question: "Why does `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i)) }` print 3, 3, 3 instead of 0, 1, 2?",
      answer:
        "var is function-scoped, so there is only one shared `i` across all loop iterations. All three setTimeout callbacks close over that same variable, and by the time any of them run (after the loop finishes), `i` is 3. Using `let` instead creates a new binding of `i` per iteration, so each callback captures its own value.",
    },
    {
      question: "Does const make an object immutable?",
      answer:
        "No. const only prevents reassigning the variable binding itself. The object or array it points to can still have its properties/elements mutated. True immutability requires something like Object.freeze() (shallow) or a library/pattern for deep immutability.",
    },
    {
      question: "Why does TypeScript infer the type \"dark\" (a literal) for `const theme = \"dark\"` but `string` for `let mode = \"dark\"`?",
      answer:
        "Because const can never be reassigned, TypeScript can safely narrow its inferred type to the exact literal value. let can be reassigned to any other string later, so TypeScript widens its inferred type to the general `string` type to stay sound.",
    },
  ],
  takeaways: [
    "Default to const; use let only when a variable's value must change; avoid var in new code.",
    "var is function-scoped and hoisted with an undefined initializer — it can leak out of blocks and cause loop-closure bugs.",
    "let and const are block-scoped and hoisted into a Temporal Dead Zone, so using them before declaration throws instead of silently returning undefined.",
    "const prevents reassignment of the binding, not mutation of the value it holds.",
    "TypeScript infers variable types automatically; const initializations get narrower literal types than let.",
  ],
  status: "available",
};
