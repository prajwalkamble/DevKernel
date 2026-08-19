import type { Lesson } from "@/content/types";

export const esmVsCommonJsLesson: Lesson = {
  id: "modules-tooling-esm-cjs",
  slug: "es-modules-vs-commonjs",
  moduleSlug: "modules-tooling",
  title: "ES Modules vs CommonJS",
  summary:
    "The two module systems JavaScript actually runs on: how each one spells import and export, why one is static and the other isn't, what live bindings mean, how circular imports behave in both, and the interop rules you hit the moment they meet.",
  estimatedMinutes: 40,
  objectives: [
    "Write both module systems fluently and know which file extensions select which",
    "Explain why ES Modules are analysable before execution and CommonJS is not",
    "Predict evaluation order, live-binding behaviour, and circular-import outcomes",
    "Navigate ESM/CommonJS interop, including default imports and esModuleInterop",
  ],
  sections: [
    {
      id: "why-two-systems",
      heading: "Why JavaScript has two module systems",
      body: [
        "For its first fifteen years JavaScript had no modules at all. A browser loaded scripts, every top-level `var` landed on `window`, and the only isolation available was the IIFE pattern from Module 2. When Node.js arrived in 2009 it needed something better immediately — server code is thousands of files — so it shipped **CommonJS**: a `require` function, a `module.exports` object, and a resolution algorithm. It worked, it spread, and npm was built on it.",
        "CommonJS was never a language feature. `require` is just a function the runtime injects into every file, and `module.exports` is just an object. That has one enormous consequence: **a CommonJS module's shape is only knowable by running it**. You can `require` inside an `if`, build the specifier from a variable, or reassign `module.exports` in a loop. A tool reading the file cannot know what it exports.",
        "**ES Modules** (ESM) are the standardised answer, syntax added in ES2015 and finally shipping in Node 12 and every browser by 2020. `import` and `export` are declarations, not calls: they may only appear at the top level, their specifiers must be string literals, and the engine reads them before executing a single line. Everything interesting in this module — tree shaking, fast bundling, reliable type resolution — follows from that one property.",
        "Modern code is written in ESM. CommonJS remains everywhere in `node_modules`, in older Node scripts, and as the output format many tools still emit, so you need both.",
      ],
      examples: [
        {
          id: "cjs-syntax-example",
          title: "CommonJS: require, exports, module.exports",
          js: `// geometry.cjs
const PI = 3.14159;

function area(radius) {
  return PI * radius * radius;
}

// Style 1: attach properties to the \`exports\` object one at a time
exports.PI = PI;
exports.area = area;

// logger.cjs
// Style 2: replace \`module.exports\` wholesale — the module IS this function
module.exports = function log(message) {
  console.log("[log] " + message);
};
module.exports.level = "info";

// main.cjs
const geometry = require("./geometry.cjs"); // the whole exports object
const { area } = require("./geometry.cjs"); // destructured after the call returns
const log = require("./logger.cjs");        // here module.exports is a function

log("area at r=2 is " + area(2).toFixed(2));
console.log("logger level:", log.level, "| PI:", geometry.PI);

// \`require\` is an ordinary function call, so the specifier can be computed
// and the call can sit inside an \`if\`. Nothing about this module's shape is
// knowable without executing it.
const which = "./geometry.cjs";
console.log("computed require:", typeof require(which).area);

// Requiring the same module twice returns the very same object: modules are
// cached by resolved path, and the body runs exactly once.
console.log("cached:", require("./geometry.cjs") === geometry);`,
          output: `[log] area at r=2 is 12.57
logger level: info | PI: 3.14159
computed require: function
cached: true`,
          explanation:
            "The two export styles are not interchangeable. `exports` starts out as an alias for `module.exports`, so `exports.area = area` mutates the shared object — but `module.exports = fn` *rebinds* it, and any property you had already set on `exports` is thrown away. That mismatch is the single most common CommonJS bug.",
        },
      ],
      pitfalls: [
        {
          title: "exports = something does nothing at all",
          body: "`exports` is a local variable holding a reference to `module.exports`. Assigning to it (`exports = { area }`) replaces your local variable and leaves `module.exports` as the empty object it started as, so the module exports nothing — with no warning. Only `module.exports = ...` changes what callers receive. The safe habit is to pick one style per file: either `exports.x = ...` throughout, or a single `module.exports = { ... }` at the bottom.",
        },
      ],
    },
    {
      id: "es-modules-syntax",
      heading: "ES Modules: import and export as declarations",
      body: [
        "ESM has more surface area than CommonJS because it distinguishes things CommonJS conflates. There are **named exports** (as many as you like, matched by name), at most one **default export** (matched by position), and **namespace imports** that gather everything into one object. Re-exports forward another module's bindings without creating a local one, which is how a package's entry point stitches its internals into a public API.",
        "The default export exists mostly for ergonomics — one obvious thing per file — and it is worth being sparing with it. A default export has no canonical name, so every importer invents one, and a typo in `import Geomtry from \"./geometry.js\"` is not an error anywhere. Named exports are checked: import a name the module doesn't export and you get a failure before any code runs.",
        "The one dynamic form is `import(\"./thing.js\")`, which is not a function despite the syntax — it's an operator that returns a promise for the module's namespace object. It is how you code-split, and it works in CommonJS files too. Its specifier *may* be computed, which is exactly why bundlers treat a dynamic import with a variable specifier as an opaque boundary.",
      ],
      examples: [
        {
          id: "esm-syntax-example",
          title: "Every import and export form worth knowing",
          js: `// geometry.mjs
export const PI = 3.14159;

export function area(radius) {
  return PI * radius * radius;
}

// At most one default export per module
export default function describe(radius) {
  return "circle r=" + radius + ", area=" + area(radius).toFixed(2);
}

// shapes.mjs
// Re-export: forwards the binding without creating a local one here
export { area as circleArea, PI } from "./geometry.mjs";
export const NAMES = ["circle", "square"];

// main.mjs
import describe, { area, PI as pi } from "./geometry.mjs"; // default + named + rename
import * as geometry from "./geometry.mjs";                // namespace object
import { circleArea, NAMES } from "./shapes.mjs";          // through the re-export

console.log(describe(2));
console.log(area(1) === circleArea(1), pi === geometry.PI, NAMES.length);

// A namespace object is sealed and tagged; the default export sits on \`.default\`
console.log("sealed:", Object.isSealed(geometry), "| tag:", geometry[Symbol.toStringTag]);

// import() is the one dynamic form: a promise for the namespace object
const lazy = await import("./geometry.mjs");
console.log("lazy default is a", typeof lazy.default);`,
          output: `circle r=2, area=12.57
true true 2
sealed: true | tag: Module
lazy default is a function`,
          explanation:
            "Notice that `shapes.mjs` never imports `area` — `export { area } from ...` forwards the binding, so nothing is bound locally and nothing is copied. And the closing `await import()` produces exactly the same namespace object a static `import *` would, just later, which is the whole of the dynamic escape hatch.",
        },
      ],
    },
    {
      id: "static-structure",
      heading: "Static structure: imports are hoisted, not executed in order",
      body: [
        "Loading an ES module happens in three phases. **Construction** parses every file in the graph and finds its imports and exports without running anything. **Instantiation** creates the memory for every exported binding and wires each import to point at the exporter's binding — still without running anything. Only then does **evaluation** run module bodies, depth-first: a module's dependencies are fully evaluated before its own first statement.",
        "This is why `import` declarations are effectively hoisted. Writing an import at the bottom of the file changes nothing, and a `console.log` on line 1 still runs after every dependency has finished. Linters ask you to put imports at the top because it reflects reality, not because the position matters.",
        "The payoff is that tools can read the graph without running it. **Tree shaking** — dropping exports nobody imports — is only sound because the compiler can see every import name in advance. CommonJS defeats it: `require` could return anything, and `module.exports.foo` might be assigned in a loop, so a bundler must keep the whole file. Type checking benefits identically, which is why TypeScript's story around modules is so much better for ESM.",
      ],
      examples: [
        {
          id: "evaluation-order-example",
          title: "The dependency runs first, wherever you write the import",
          js: `// dep.mjs
console.log("1. dep.mjs body");
export const value = "from dep";

// app.mjs
console.log("2. app.mjs body");

// Written here, in the middle of the file — and it still runs before line 1 above,
// because the engine resolves and evaluates the graph before any body executes.
import { value } from "./dep.mjs";

console.log("3. app.mjs sees", value);

// Contrast with CommonJS, where require() genuinely runs where you wrote it:
//   console.log("first");            <- prints first
//   const dep = require("./dep");    <- dep's body runs here, second`,
          output: `1. dep.mjs body
2. app.mjs body
3. app.mjs sees from dep`,
          explanation:
            "The numbering is the whole lesson: `dep.mjs` printed first even though `app.mjs` was the file we ran and its `console.log` is written above the import. An `import` is a declaration processed before evaluation, not a statement executed in place — and that predictability is what makes the whole tooling ecosystem possible.",
        },
      ],
      pitfalls: [
        {
          title: "Side-effect order breaks when you switch a file to ESM",
          body: "Code that relies on `require` running at a specific point — a polyfill loaded conditionally, a config file read before a client is constructed, a mock installed before the module under test — silently reorders when converted to `import`, because every import now runs first. The fix is either `await import(\"...\")` at the point you actually meant, or restructuring so the side effect is an explicit function call rather than a module body.",
        },
      ],
    },
    {
      id: "live-bindings",
      heading: "Live bindings vs copied values",
      body: [
        "An ESM import is not a copy of a value; it is a **live binding** — a read-only view onto the exporter's variable. If the exporting module later reassigns that variable, every importer sees the new value immediately. CommonJS has no such concept: `require` hands you an object, and destructuring it copies whatever was there at that instant.",
        "The distinction is invisible until something mutates. A module that exports a `let` it updates — a cached connection, a counter, a feature flag — behaves completely differently under the two systems, and this is a real source of migration bugs.",
        "Live bindings are read-only from the importer's side. Assigning to an imported name is an error: TypeScript rejects it at compile time, and at runtime the engine throws, because the binding is const-like from the outside. If a module needs to expose mutable state, export a function that changes it — which is better design anyway.",
      ],
      examples: [
        {
          id: "live-bindings-example",
          title: "The same counter under both systems",
          js: `// counter.mjs
export let count = 0;
export function increment() {
  count += 1;
}

// counter.cjs
let count = 0;
function increment() {
  count += 1;
}
// The number is copied into this object once, at export time
module.exports = { count, increment };

// counter-fixed.cjs
let n = 0;
module.exports = {
  get count() {   // a getter re-reads the variable on every access
    return n;
  },
  increment() {
    n += 1;
  },
};

// main.mjs
import { count, increment } from "./counter.mjs";
import cjs from "./counter.cjs";
import fixed from "./counter-fixed.cjs";

increment();
increment();
console.log("ESM live binding:", count);

cjs.increment();
cjs.increment();
console.log("CJS copied value:", cjs.count);

fixed.increment();
fixed.increment();
console.log("CJS with a getter:", fixed.count);`,
          output: `ESM live binding: 2
CJS copied value: 0
CJS with a getter: 2`,
          explanation:
            "`cjs.count` is stuck at zero forever. `module.exports = { count, increment }` evaluated `count` once and copied the number into a property; the closure variable that `increment` bumps has nothing to do with it any more. The ESM version reports 2 without any special effort, because `count` was never copied.",
        },
      ],
      pitfalls: [
        {
          title: "Destructuring a require() freezes the value, exactly like the bug above",
          body: "`const { count } = require(\"./counter\")` copies at the moment of the call even when the module was written correctly with a getter, because destructuring reads the property immediately. Under ESM the equivalent `import { count }` stays live. When you migrate a file from `require` to `import`, values that used to go stale start updating — usually a fix, occasionally a behaviour change you didn't ask for.",
        },
      ],
    },
    {
      id: "circular-dependencies",
      heading: "Circular imports: silent in CommonJS, loud in ESM",
      body: [
        "Two modules that import each other are more common than you'd like — a model importing a service that imports the model back. Neither system forbids it, and both handle it by starting the second module before the first has finished. What differs is what you see when you look too early.",
        "CommonJS gives you whatever `module.exports` happened to contain at that moment, which for the module still executing is usually `{}`. Nothing is reported. You get `undefined is not a function` somewhere unrelated, minutes later.",
        "ESM instantiates all the bindings before evaluating anything, so the names always exist — but a `const` or `let` that hasn't been evaluated yet is in its temporal dead zone, and reading it throws `ReferenceError: Cannot access 'x' before initialization` pointing at the exact line. Function declarations are the exception: they're initialised during instantiation, so a cycle built out of functions genuinely works. That's the practical rule — cycles are survivable if the values you reach across them are functions called later, and fatal if they're values read at module scope.",
      ],
      examples: [
        {
          id: "circular-imports-example",
          title: "The same cycle, two failure modes",
          js: `// a.cjs
const b = require("./b.cjs");
console.log("a.cjs sees b:", Object.keys(b));
module.exports = { a: "A" };

// b.cjs
const a = require("./a.cjs");
console.log("b.cjs sees a:", Object.keys(a)); // {} — a.cjs has not finished yet
module.exports = { b: "B" };

// a.mjs
import { b } from "./b.mjs";
export const a = "A";
console.log("a.mjs sees b:", b);

// b.mjs
import { a } from "./a.mjs";
// ReferenceError: Cannot access 'a' before initialization
// console.log("b.mjs sees a:", a);
export const b = "B";

// safe-a.mjs — the same cycle, but crossing it with function declarations
import { getB } from "./safe-b.mjs";
export function getA() {
  return "A";
}
console.log("safe-a sees getB():", getB());

// safe-b.mjs
import { getA } from "./safe-a.mjs";
console.log("safe-b sees getA():", getA()); // hoisted and initialised — fine
export function getB() {
  return "B";
}

// main.cjs
require("./a.cjs");`,
          output: `b.cjs sees a: []
a.cjs sees b: [ 'b' ]`,
          explanation:
            "The CommonJS run prints an empty key list and carries on — the bug is now somewhere downstream. Uncomment the line in `b.mjs` and the ESM version instead stops immediately with `Cannot access 'a' before initialization` and a stack trace at the offending read. Loud beats silent, but the real fix for a cycle is usually to extract the shared piece into a third module that neither side imports back.",
        },
      ],
    },
    {
      id: "interop-and-extensions",
      heading: "Interop: extensions, default imports, and TypeScript's syntax",
      body: [
        "Node decides a file's module system from its extension and the nearest `package.json`. `.mjs` is always ESM, `.cjs` is always CommonJS, and `.js` follows `\"type\": \"module\"` in the closest `package.json` — defaulting to CommonJS when the field is absent. TypeScript mirrors this with `.mts` and `.cts`.",
        "Importing CommonJS from ESM mostly works: the default import is `module.exports`, and Node additionally tries to offer named exports by *statically scanning* the CommonJS source for assignment patterns it recognises. That scan is a best-effort guess, and when it misses you get a link-time `SyntaxError: Named export 'x' not found` even though the property genuinely exists at runtime. Falling back to a default import and destructuring afterwards always works.",
        "The other direction used to be impossible. Modern Node (20.19+ and 22.12+) can `require()` an ES module, returning its namespace object — unless the module graph uses top-level `await`, which fails with `ERR_REQUIRE_ASYNC_MODULE` because `require` is synchronous and the module isn't. ESM also has no `require`, `__dirname` or `__filename`; use `import.meta.url`, `import.meta.dirname`, or `createRequire` from `node:module`.",
        "TypeScript adds two things. `import type` / `export type` mark imports the compiler should erase, which matters enormously once a single-file transpiler is involved (Lesson 4). And `import x = require(\"y\")` with `export = x` are TypeScript's own syntax for modules whose export *is* a single value — needed when `esModuleInterop` is off, which is why that flag exists: it makes the compiler emit an interop helper so a plain `import x from \"y\"` works against CommonJS.",
      ],
      examples: [
        {
          id: "interop-example",
          title: "What a default import of CommonJS actually gives you",
          js: `// legacy.cjs
function shout(text) {
  return text.toUpperCase() + "!";
}
module.exports = { shout, version: "1.0.0" };

// main.mjs
import legacy from "./legacy.cjs";      // default import IS module.exports
import { shout } from "./legacy.cjs";   // named export, detected by static scan
import * as ns from "./legacy.cjs";

console.log("default keys:", Object.keys(legacy));
console.log("named import:", shout("hi"));
console.log("namespace keys:", Object.keys(ns));

// This one fails at link time, before any code runs:
//   import { version } from "./legacy.cjs";
//   SyntaxError: Named export 'version' not found.
// ...even though legacy.version exists. The scanner recognised the shorthand
// property \`shout\` and not the string-valued \`version\`. Always safe instead:
const { version } = legacy;
console.log("via default:", version);`,
          output: `default keys: [ 'shout', 'version' ]
named import: HI!
namespace keys: [ 'default', 'shout' ]
via default: 1.0.0`,
          explanation:
            "Look at the third line: the namespace has `default` and `shout` but no `version`, which is the guess made visible. Node's scanner is looking at source text, not running the module, so anything computed — a property assigned in a loop, a re-export from another file — is invisible to it. The `import { version }` line is a hard error at link time, not a runtime `undefined`.",
        },
        {
          id: "ts-module-interop-example",
          title: "TypeScript's module syntax",
          ts: `// models.ts
export interface User {
  id: number;
  name: string;
}
export const DEFAULT_USER: User = { id: 0, name: "anonymous" };

// app.ts
// Erased at compile time — no import of models.js survives in the output
import type { User } from "./models.js";
// Mixed: the type is erased, the value is kept
import { DEFAULT_USER, type User as U } from "./models.js";

export function rename(user: User, name: string): U {
  return { ...user, name };
}
console.log(rename(DEFAULT_USER, "Ada").name);

// Imported bindings are read-only views, and the compiler enforces it
import { count } from "./counter.js";
count = 5;
// Error: Cannot assign to 'count' because it is an import.

// counter.ts
export let count = 0;`,
          explanation:
            "Writing `import type` (or the inline `type` modifier) is not a style preference. It tells the compiler this import contributes nothing at runtime, so it can be removed — and it tells a single-file transpiler, which cannot see `models.ts` at all, the same thing. Lesson 4 shows what goes wrong when that information is missing.",
        },
      ],
      pitfalls: [
        {
          title: "\"type\": \"module\" changes every .js file beneath it at once",
          body: "Adding the field to `package.json` is not a per-file opt-in — every `.js` file in that package becomes ESM, so `require`, `__dirname` and CommonJS-style `exports` all stop existing simultaneously. That is why migrations usually rename the handful of files that must stay CommonJS to `.cjs` first, then flip the flag. The same field is what makes a published package's `.js` files resolvable as ESM by consumers, so it is also a breaking change for anyone requiring you.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the fundamental difference between ES Modules and CommonJS?",
      answer:
        "ES Modules are static and CommonJS is dynamic. import and export are declarations: they only appear at the top level, their specifiers must be string literals, and the engine parses the whole graph and wires up every binding before running any code. require is an ordinary function call, so it can be conditional, computed, or in a loop, and module.exports can be reassigned at runtime — which means a CommonJS module's shape is only knowable by executing it. Everything else follows: tree shaking, reliable static analysis, and better type resolution are all consequences of ESM being analysable ahead of time.",
    },
    {
      question: "What are live bindings?",
      answer:
        "An ESM import is a read-only view onto the exporting module's variable, not a copy of its value. If the exporter reassigns a let, every importer sees the new value on the next read. CommonJS has no equivalent: require returns an object and destructuring it copies whatever was there at that moment, so a module exporting a counter as a plain property will report a stale value forever. You can approximate live bindings in CommonJS with a getter on module.exports. Assigning to an imported binding is an error in both TypeScript and at runtime.",
    },
    {
      question: "What happens with circular imports in each system?",
      answer:
        "Both allow cycles and both start the second module before the first has finished. CommonJS hands the partially-populated module.exports object over, which is usually empty, and reports nothing — you get an undefined-is-not-a-function failure somewhere else later. ESM creates all bindings up front, so the names exist, but a const or let read before its module body has run throws ReferenceError: Cannot access 'x' before initialization at the exact line. Function declarations are initialised during instantiation, so cycles that only cross via functions work fine. The real fix is extracting the shared piece into a third module.",
    },
    {
      question: "How do ESM and CommonJS interoperate in Node?",
      answer:
        "Importing CommonJS from ESM gives module.exports as the default import; Node also statically scans the CommonJS source for recognisable export assignments and offers those as named imports, which is a best-effort guess that can fail with a link-time SyntaxError even when the property really exists. Since Node 20.19/22.12, require() of an ES module works and returns the namespace object, unless the graph uses top-level await, which throws ERR_REQUIRE_ASYNC_MODULE. ESM has no require, __dirname or __filename — use import.meta.url, import.meta.dirname, or createRequire from node:module.",
    },
    {
      question: "How does Node decide whether a file is ESM or CommonJS?",
      answer:
        "By extension first: .mjs is always ESM and .cjs is always CommonJS, with .mts and .cts as TypeScript's equivalents. A plain .js file follows the \"type\" field of the nearest package.json — \"module\" makes it ESM, and anything else or a missing field makes it CommonJS. Because the field applies to a whole package subtree, adding it converts every .js file at once, which is why migrations typically rename files that must stay CommonJS to .cjs before flipping the flag.",
    },
  ],
  takeaways: [
    "ESM is static — imports are declarations resolved before execution — and CommonJS is dynamic, because require is just a function call.",
    "Module bodies run depth-first after the whole graph is instantiated, so a dependency always executes before the importer's first line, wherever the import is written.",
    "ESM imports are live read-only bindings; a destructured require is a one-time copy, and that difference shows up whenever exported state mutates.",
    "Circular imports give you a silent empty object in CommonJS and a precise ReferenceError in ESM, unless the cycle only crosses via hoisted function declarations.",
    "Extensions and package.json \"type\" decide the module system; interop works in both directions now, but named imports from CommonJS rely on a static guess that can fail.",
  ],
  status: "available",
};
