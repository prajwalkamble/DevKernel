import type { Lesson } from "@/content/types";

export const hoistingLesson: Lesson = {
  id: "functions-scope-hoisting",
  slug: "hoisting-internals",
  moduleSlug: "functions-scope",
  title: "Hoisting Internals: How the Engine Really Processes Your Code",
  summary:
    "The two-phase process (creation then execution) every scope goes through, why function declarations are fully hoisted but function expressions aren't, and how classes fit in.",
  estimatedMinutes: 25,
  objectives: [
    "Explain hoisting in terms of the creation and execution phases",
    "Predict hoisting behavior for var, let, const, function declarations, function expressions, and classes",
    "Explain why function declarations can be called before their definition but function expressions can't",
    "Know that classes are hoisted but stay in the Temporal Dead Zone, just like let/const",
  ],
  sections: [
    {
      id: "two-phases",
      heading: "Every scope is processed in two phases",
      body: [
        "Before executing a single line of code in a scope (a function body, a block, or the whole file), the JavaScript engine first runs a **creation phase**: it scans the scope for every variable and function declaration and sets up memory for them, *before* any code actually runs. Only after that does it begin the **execution phase**, running your code top to bottom.",
        "'Hoisting' is really just an informal name for the visible effects of this creation phase — it looks as if declarations were 'moved to the top', but nothing actually moves; the engine just already knows about them before execution starts. **What differs between var, let, const, and function declarations is *how much* work the creation phase does for each one.**",
      ],
    },
    {
      id: "hoisting-by-kind",
      heading: "Hoisting behavior, kind by kind",
      body: [
        "**Function declarations** (`function foo() {}`): fully hoisted. During the creation phase, the engine allocates memory *and* assigns the complete function value immediately. That's why you can call a function declaration before its line in the source.",
        "**var**: hoisted and pre-initialized to `undefined`. Reading it before its assignment line gives `undefined`, not an error.",
        "**let / const**: hoisted, but left completely uninitialized — in the **Temporal Dead Zone** — until their declaration line executes. Reading them before that throws a `ReferenceError` (covered in Module 1).",
        "**Function expressions and arrow functions** (`const foo = function() {}` or `const foo = () => {}`): only the *variable* (`const foo`) is hoisted, following whatever rule its declaration keyword uses (var/let/const above). The function *value* isn't assigned to it until that line of code executes — so calling it earlier fails, either with `undefined is not a function` (var) or a TDZ `ReferenceError` (let/const).",
        "**Classes**: hoisted like `let`/`const` — they exist in the Temporal Dead Zone until their declaration line runs. This surprises people who assume classes behave like function declarations (since both use `function`-adjacent keywords) — they don't.",
      ],
      examples: [
        {
          id: "hoisting-comparison-table",
          title: "All five declaration kinds, hoisting behavior compared",
          js: `// Function declaration — fully hoisted, callable early
console.log(declared()); // "works!"
function declared() {
  return "works!";
}

// var function expression — hoisted as undefined
console.log(typeof varExpr); // "undefined"
var varExpr = function () {
  return "hi";
};

// let function expression — TDZ
try {
  console.log(letExpr());
} catch (e) {
  console.log(e instanceof ReferenceError); // true
}
let letExpr = function () {
  return "hi";
};

// class — TDZ, just like let/const
try {
  new EarlyClass();
} catch (e) {
  console.log(e instanceof ReferenceError); // true
}
class EarlyClass {}`,
          explanation:
            "Only the function *declaration* is safe to call before its line. Every other form — var/let/const holding a function value, and classes — follows its own declaration keyword's hoisting rule, not the function's.",
        },
      ],
      pitfalls: [
        {
          title: "\"I'll just declare my helper function below where I use it\" — only works for declarations",
          body: "It's common to see code call a helper function before its definition, relying on hoisting. This only reliably works for `function foo() {}` declarations. The same code written as `const foo = () => {}` (arrow function expression, the more common modern style) will throw if called before its line — a frequent surprise when refactoring old code to arrow functions.",
        },
      ],
    },
    {
      id: "duplicate-declarations",
      heading: "Redeclaration rules during the creation phase",
      body: [
        "The creation phase is also where JavaScript decides whether a redeclaration is legal. `var` can be declared multiple times in the same scope with no error (later declarations just don't reset the value if there's already an assignment). `let` and `const` throw a `SyntaxError` for any redeclaration in the same scope — this is caught even before the engine runs anything, since it's detected during creation-phase scanning.",
      ],
      examples: [
        {
          id: "redeclaration-example",
          title: "var tolerates redeclaration; let/const don't",
          js: `var x = 1;
var x = 2; // fine, no error
console.log(x); // 2

let y = 1;
let y = 2;
// SyntaxError: Identifier 'y' has already been declared
// (this is a parse-time error — the whole script fails to even start running)`,
        },
      ],
    },
    {
      id: "ts-hoisting",
      heading: "TypeScript: identical hoisting, plus a compile-time nudge",
      body: [
        "TypeScript doesn't change any of this runtime behavior — it's pure JavaScript semantics. What TypeScript adds is that using a `let`/`const`/class binding before its declaration is often flagged as a compile-time error (`Block-scoped variable 'x' used before its declaration`) rather than only failing at runtime, because the compiler can statically see the TDZ violation in simple cases.",
      ],
      examples: [
        {
          id: "ts-tdz-compile-error",
          title: "TypeScript catching a TDZ violation before you even run the code",
          ts: `console.log(value);
// Error: Block-scoped variable 'value' used before its declaration.
let value = 10;`,
          explanation:
            "In plain JavaScript, this exact code only fails when you actually run it. TypeScript's static analysis catches the same class of bug at compile time in straightforward cases — though it can't catch every possible TDZ violation (e.g. ones that depend on runtime control flow), so the runtime TDZ check still exists as the real safety net.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What actually happens during JavaScript's 'creation phase' before your code runs?",
      answer:
        "The engine scans the current scope for all declarations and sets up memory for them ahead of time: function declarations get their full value assigned immediately, var declarations get pre-initialized to undefined, and let/const/class declarations get memory reserved but left uninitialized (in the Temporal Dead Zone) until their actual declaration line executes.",
    },
    {
      question: "Why can you call a function declaration before its line in the file, but not a function expression assigned to a const?",
      answer:
        "Function declarations are fully hoisted — the complete function value is available from the start of the scope. A function expression assigned to a const is only hoisted as an uninitialized const binding (in the TDZ); the function value itself isn't attached to that binding until the assignment line actually executes, so calling it earlier throws a ReferenceError.",
    },
    {
      question: "Are classes hoisted in JavaScript?",
      answer:
        "Yes, but like let/const, not like function declarations. A class binding exists from the start of its scope but stays in the Temporal Dead Zone until the class declaration's line executes — trying to instantiate or reference it earlier throws a ReferenceError, not undefined.",
    },
    {
      question: "What's the difference in redeclaration rules between var and let?",
      answer:
        "var can be declared multiple times in the same scope with no error — it's simply treated as one variable. let (and const) throw a SyntaxError immediately if the same identifier is declared twice in the same scope, and because this is detected during parsing/creation-phase scanning, it prevents the entire script from running, not just that one line.",
    },
    {
      question: "Does TypeScript change JavaScript's runtime hoisting behavior?",
      answer:
        "No — hoisting is pure JavaScript/runtime semantics and TypeScript doesn't alter it. TypeScript's static type checker can catch some 'used before declaration' violations at compile time as an extra safety net, but the underlying runtime hoisting and Temporal Dead Zone behavior is identical to plain JavaScript.",
    },
  ],
  takeaways: [
    "Hoisting is the visible effect of a creation phase that runs before execution — nothing physically moves, the engine just already knows what's declared.",
    "Function declarations are fully hoisted (safe to call early); var is hoisted as undefined; let/const/class are hoisted into the Temporal Dead Zone.",
    "A function stored in a let/const/var binding follows that binding's hoisting rule, not a function declaration's — this is the most common source of confusion.",
    "var tolerates redeclaration silently; let/const throw a SyntaxError on redeclaration, caught before any code runs.",
    "TypeScript adds compile-time detection of some TDZ violations but doesn't change the underlying runtime behavior at all.",
  ],
  status: "available",
};
