import type { Lesson } from "@/content/types";

export const buildToolsLesson: Lesson = {
  id: "modules-tooling-build-tools",
  slug: "build-tools",
  moduleSlug: "modules-tooling",
  title: "Build Tools",
  summary:
    "What actually happens between your source files and the JavaScript that ships: why type checking and transpiling are separate jobs, what a single-file transpiler cannot do, how bundling and tree shaking work, and which tool in the modern landscape does which part.",
  estimatedMinutes: 35,
  objectives: [
    "Separate the four jobs a build does and know which tool performs each",
    "Explain why esbuild and SWC are fast and what they give up for it",
    "Describe tree shaking, code splitting and the conditions each requires",
    "Wire a project so type errors fail CI and the build stays fast",
  ],
  sections: [
    {
      id: "what-a-build-does",
      heading: "Four jobs, not one",
      body: [
        "A modern build does four separable things. **Transpiling** turns TypeScript and new syntax into JavaScript an engine accepts. **Type checking** proves the program is consistent. **Bundling** follows the import graph and combines it into as few files as sensible. **Optimising** minifies, splits, and generates source maps. Different tools do different subsets, and most of the confusion around build configuration comes from assuming one tool is doing all four.",
        "The most important consequence: **stripping types is not the same as checking them**. Erasing `: number` is a purely syntactic operation that needs no knowledge of what `number` means, which is why esbuild can do it at hundreds of megabytes per second. Proving that a value assigned to it really is a number requires building a model of every file in the program, which is why `tsc` will never be that fast.",
        "So a build that only transpiles will happily emit code full of type errors. That is not a bug — it's a deliberate division of labour that keeps development fast — but it means type checking has to be run *somewhere else*: your editor while you write, and `tsc --noEmit` in CI before you merge. A project that skips the second step is running unchecked TypeScript and doesn't know it.",
      ],
      examples: [
        {
          id: "transpile-vs-typecheck-example",
          title: "What a transpiler does with a file full of type errors",
          ts: `// Input — two things \`tsc --noEmit\` rejects immediately
const count: number = "not a number";
// Error: Type 'string' is not assignable to type 'number'.

const user: { id: number } = { id: 1, oops: true };
// Error: Object literal may only specify known properties, and 'oops' does not
//        exist in type '{ id: number; }'.

console.log(count.toFixed(2)); // reads as correct: count is declared number

// Output, from a single-file transpiler, in about a millisecond:
//
//   const count = "not a number";
//   const user = { id: 1, oops: true };
//   console.log(count.toFixed(2));
//
// Diagnostics reported: none. The annotations were deleted without ever being
// consulted, so the last line survives into a runtime where \`count\` is a string:
//
//   TypeError: count.toFixed is not a function`,
          explanation:
            "This is the single most useful thing to understand about modern toolchains. Your dev server is not type checking — the red squiggles come from the TypeScript language server running separately in your editor. If nothing runs `tsc` in CI, a type error that nobody happened to have open in a tab ships to production.",
        },
      ],
      pitfalls: [
        {
          title: "A green build is not a checked build",
          body: "Vite and most esbuild- or SWC-based setups transpile without checking by default, so `npm run build` succeeding tells you nothing about type correctness. Add an explicit `\"typecheck\": \"tsc --noEmit\"` script and run it in CI, or wire a plugin that runs the checker alongside the dev server. Next.js is a partial exception — it runs the checker during `next build` unless `typescript.ignoreBuildErrors` is set — but its dev server does not, so an error you never opened in an editor still waits until build time.",
        },
      ],
    },
    {
      id: "single-file-transpilation",
      heading: "What a single-file transpiler cannot know",
      body: [
        "esbuild, SWC and Babel all work the same way: parse one file, transform it, print it, and never look at anything else. That constraint is where the speed comes from — files are independent, so the work parallelises perfectly and nothing has to be held in memory. It's also where the limitations come from, and they are exactly the ones `isolatedModules` warns about.",
        "The clearest case is `const enum`. TypeScript's own compiler replaces `Direction.Up` with the literal value, because it read the enum's declaration in another file. A single-file transpiler cannot do that, so it has to emit a real object instead — different output, different runtime behaviour, and no error to tell you.",
        "The second case is `emitDecoratorMetadata`, the legacy decorator feature that Angular and NestJS rely on. It emits the *types* of a decorated method's parameters as runtime values, which requires knowing whether each name is a class or an interface — cross-file type information by definition. esbuild does not implement it at all; TypeScript's own single-file mode emits a defensive guard instead of a plain reference.",
        "Everything else follows the same pattern: `.d.ts` output needs the whole program, so only `tsc` can produce it, and re-exported types need to be marked because the transpiler cannot tell a type from a value. None of this makes single-file transpilers the wrong choice — it makes `isolatedModules` and `verbatimModuleSyntax` the right settings.",
      ],
      examples: [
        {
          id: "transpiler-limits-example",
          title: "The same source, two compilers, two outputs",
          ts: `const enum Local {
  A = 1,
  B = 2,
}
console.log(Local.A + Local.B);

// tsc, which has the whole program:
//
//   console.log(1 /* Local.A */ + 2 /* Local.B */);
//
// A single-file transpiler, which does not:
//
//   var Local;
//   (function (Local) {
//       Local[Local["A"] = 1] = "A";
//       Local[Local["B"] = 2] = "B";
//   })(Local || (Local = {}));
//   console.log(Local.A + Local.B);

// And the decorator-metadata case, where the difference is not just size.
// Given \`handle(input: Logger, count: number)\` with Logger imported from
// another file, tsc emits the reference directly:
//
//   __metadata("design:paramtypes", [Logger, Number])
//
// while a transpiler that cannot tell whether \`Logger\` is a class or an
// interface has to hedge:
//
//   __metadata("design:paramtypes", [
//     typeof (_a = typeof Logger !== "undefined" && Logger) === "function" ? _a : Object,
//     Number,
//   ])
//
// esbuild declines the problem entirely and does not support the flag.`,
          explanation:
            "Notice that neither compiler reported anything. Both outputs are valid JavaScript; they simply describe different programs. That silent divergence is the reason `isolatedModules` exists — it turns \"your output depends on which tool ran\" into a compile error you can fix once.",
        },
      ],
    },
    {
      id: "bundling",
      heading: "Bundling, tree shaking, and code splitting",
      body: [
        "A **bundler** starts from an entry point, follows every import, and produces a small number of output files with the module graph flattened into them. Historically this was about HTTP overhead; today it's equally about applying transformations across the graph, and about the two optimisations that need the whole picture.",
        "**Tree shaking** removes exports nobody imports. It only works on ES Modules, because only ESM lets a tool see the complete list of imported names without running anything — and it only works when the bundler can prove that dropping a module doesn't drop a side effect. That proof usually comes from `\"sideEffects\": false` in a package's `package.json`, which is a promise that importing any file in it does nothing observable. Get that promise wrong — a file that registers a polyfill or injects CSS — and the bundler silently removes code you needed.",
        "**Code splitting** does the opposite: it deliberately keeps chunks separate so they can load on demand. The trigger is `import()`, and the specifier usually needs to be statically analysable — a fully computed specifier gives the bundler nothing to split on. Each dynamic import becomes a chunk boundary, which is how route-level and component-level lazy loading work.",
        "Two smaller jobs round it out. **Minification** shortens names and removes whitespace, and modern minifiers also do their own dead-code elimination. **Source maps** record the mapping back to your original files so stack traces and breakpoints stay meaningful; ship them (or upload them to your error tracker) or production stack traces become unreadable.",
      ],
      examples: [
        {
          id: "tree-shaking-example",
          title: "What survives the shake, and what pins a module in place",
          ts: `// utils.ts — three exports, one importer
export function used(): string {
  return "kept";
}
export function unused(): string {
  return "removed — nothing imports this name";
}
export const CONSTANT = 42;

// analytics.ts — a module with a side effect at top level
console.log("analytics installed"); // runs on import, so it cannot be dropped
export function track(event: string): void {
  console.log("track:", event);
}

// app.ts
import { used } from "./utils.js";
import "./analytics.js"; // imported purely for the side effect

console.log(used());

// After bundling: \`unused\` and \`CONSTANT\` are gone, because the import list
// names neither and the module has no side effects. analytics.ts survives whole,
// because its body prints something and dropping it would change behaviour.

// package.json — the promise that makes the first half possible
{
  "name": "@acme/utils",
  "sideEffects": false
}

// ...or, when only some files are pure:
{
  "name": "@acme/utils",
  "sideEffects": ["./src/polyfills.js", "*.css"]
}`,
          explanation:
            "`sideEffects: false` is a claim about your package that the bundler takes at face value. It's what lets an app import one helper from a large library and ship only that helper — and it's also why a library that lies about it produces bug reports that only reproduce in production builds.",
        },
        {
          id: "code-splitting-example",
          title: "A dynamic import is a chunk boundary",
          ts: `// heavy.ts
export function renderChart(points: number[]): string {
  return "chart with " + points.length + " points";
}

// app.ts
// Static: this code is in the main bundle whether or not it ever runs.
// import { renderChart } from "./heavy.js";

// Dynamic: the bundler emits heavy.ts as a separate chunk, fetched on demand.
async function showChart(points: number[]) {
  const { renderChart } = await import("./heavy.js");
  console.log(renderChart(points));
}

document.querySelector("#chart")?.addEventListener("click", () => {
  void showChart([1, 2, 3]);
});

// A computed specifier gives the bundler nothing to work with. Some bundlers
// handle a partially-static pattern like \`./locales/\${lang}.js\` by emitting a
// chunk for every match; a fully computed one usually cannot be bundled at all.
async function loadLocale(lang: string) {
  return import("./locales/" + lang + ".js");
}
void loadLocale("en");`,
          explanation:
            "The rule of thumb is that `import()` marks a boundary you are willing to pay a network round trip for. Route components, rarely-used dialogs and heavy third-party widgets are the usual candidates; splitting something that loads on every page just adds a request.",
        },
      ],
    },
    {
      id: "the-landscape",
      heading: "The landscape",
      body: [
        "**esbuild** (Go) and **SWC** (Rust) are transpilers and minifiers, one to two orders of magnitude faster than the JavaScript tools they replaced. esbuild also bundles. Neither type checks. You rarely configure them directly — they sit inside something else.",
        "**Vite** is the current default for application development. In dev it serves your source as native ES modules with no bundling at all, transforming files on demand and pre-bundling dependencies with esbuild, which is why startup is near-instant regardless of project size. For production it bundles with Rollup, because a real bundle still wins on the network. **Webpack** remains the most configurable option and has the deepest plugin ecosystem, at the cost of speed and configuration weight. **Rollup** is the traditional choice for libraries, where clean ESM output and precise tree shaking matter more than dev-server features. **Turbopack**, which builds this project through Next.js, is the Rust-based successor to webpack's role inside Next.",
        "**tsc** stays in the picture for two jobs nothing else does: checking types, and emitting `.d.ts` declarations. A common and good arrangement is a fast tool for JavaScript output plus `tsc --noEmit` for checking — and for a published library, `tsc --emitDeclarationOnly` for the types.",
      ],
      examples: [
        {
          id: "build-scripts-example",
          title: "The division of labour, as package.json scripts",
          ts: `// package.json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",

    // The checking that the build itself does not do
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",

    "lint": "eslint .",
    "test": "vitest run"
  }
}

// vite.config.ts — small, because the defaults are the point
//
//   import { defineConfig } from "vite";
//   export default defineConfig({
//     build: {
//       sourcemap: true,      // keep production stack traces readable
//       target: "es2022",     // what the OUTPUT must run on
//     },
//   });
//
// Note that vite's \`build.target\` and tsconfig's \`target\` are different knobs
// for the same idea, and only one of them is doing the work: esbuild performs the
// downleveling, so tsconfig's \`target\` mostly just tells the checker which
// syntax it may assume.`,
          explanation:
            "The `build` script is the important line. Chaining `typecheck` in front of `vite build` is what turns a fast, unchecked transpile into a build you can trust, and it costs a few seconds on a codebase where the checker would otherwise never run.",
        },
      ],
    },
    {
      id: "shipping-a-package",
      heading: "Shipping a library",
      body: [
        "Publishing turns every choice in this module into someone else's problem, so it's worth getting the `package.json` right. Modern practice is to ship ESM as the primary format, with `exports` naming the entry points and a `types` condition first so TypeScript finds declarations under every resolution mode. If you also ship CommonJS, the `require` condition points at a `.cjs` build with its own `.d.cts` declarations — the two formats need separate declaration files under `node16` resolution.",
        "Publishing both formats invites the **dual package hazard**: a dependency graph where some consumers `import` you and others `require` you ends up with two copies of your module, two module-level caches, and `instanceof` checks that fail across the boundary. The safe shapes are ESM-only, or CommonJS-only, or dual with no module-level mutable state and no identity-sensitive exports.",
        "The mechanics are unglamorous but finite: `\"files\"` limits what npm packs, `\"sideEffects\": false` unlocks tree shaking for your consumers, `declaration` and `declarationMap` emit the types and let editors jump to your source, and `publint` plus `arethetypeswrong` will tell you what you got wrong before your users do.",
      ],
      examples: [
        {
          id: "dual-package-example",
          title: "A package.json that resolves correctly everywhere",
          ts: `// package.json
{
  "name": "@acme/utils",
  "version": "2.0.0",
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  // Fallbacks for tooling that predates "exports" — harmless, occasionally vital
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs && tsc --emitDeclarationOnly",
    "prepublishOnly": "npm run build && publint"
  }
}

// tsconfig.build.json — tsc is here only for the declarations
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}`,
          explanation:
            "Two details do most of the work. `types` is first in every condition object, so TypeScript never falls through to a JavaScript file and decides the package is untyped. And `declarationMap` ships `.d.ts.map` files alongside the declarations, which is what lets a consumer's editor jump into your original TypeScript instead of a generated `.d.ts`.",
        },
      ],
      pitfalls: [
        {
          title: "A .d.ts is not valid for both formats under nodenext",
          body: "Under `node16`/`nodenext`, TypeScript decides whether a declaration file describes an ES module or a CommonJS one from its extension and the nearest `package.json`. A single `index.d.ts` inside a `\"type\": \"module\"` package is therefore an ESM declaration, and pointing the `require` condition at it tells consumers that `require(\"@acme/utils\")` returns a namespace object when it actually returns `module.exports`. Dual packages need `index.d.ts` next to `index.js` and `index.d.cts` next to `index.cjs`. `arethetypeswrong` exists specifically to catch this.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why are esbuild and SWC so much faster than tsc?",
      answer:
        "Because they do a strictly smaller job. They parse one file at a time, delete the type annotations, transform the syntax and print — no cross-file analysis, so the work parallelises and nothing needs to be held in memory. They are also written in Go and Rust rather than JavaScript. tsc is slow because type checking requires building a model of every file in the program and resolving relationships across all of them. The two are not really comparable: erasing a type annotation never needs to know what the annotation means.",
    },
    {
      question: "What can't a single-file transpiler compile correctly?",
      answer:
        "Anything whose output depends on another file. const enum members are inlined by tsc using the enum's declaration, but a transpiler has to emit a real object instead — different output, no error. emitDecoratorMetadata needs to know whether a parameter's type is a class or an interface, which is cross-file information; esbuild doesn't support it at all. Re-exporting a type can't be distinguished from re-exporting a value. And .d.ts emit needs the whole program. isolatedModules and verbatimModuleSyntax exist to make TypeScript reject exactly these constructs so your output doesn't depend on which tool ran.",
    },
    {
      question: "How does tree shaking work, and what stops it?",
      answer:
        "The bundler builds the import graph, sees which exported names are actually imported — which is only possible because ESM is statically analysable — and drops the rest. It stops when the bundler cannot prove that removing a module is safe: a module whose top level does something observable has to be kept whole. Packages signal that they are safe with \"sideEffects\": false in package.json, or a list of the files that aren't. CommonJS largely defeats tree shaking, because require() can return anything and exports can be assigned dynamically.",
    },
    {
      question: "Why does Vite use two different tools for dev and production?",
      answer:
        "Because the two situations optimise for different things. In development it serves source files as native ES modules with no bundling, transforming each one on demand and pre-bundling dependencies with esbuild, so startup time is independent of project size and a change only invalidates one module. In production a bundle still wins: fewer requests, better compression, and whole-graph optimisations like tree shaking and chunking, which is what Rollup does well. The cost is that dev and production run subtly different code paths, so production-only bugs are possible.",
    },
    {
      question: "What is the dual package hazard?",
      answer:
        "It happens when a package ships both an ESM and a CommonJS build and a dependency graph ends up loading both. The two copies have separate module state — separate caches, separate singletons — and classes from one fail instanceof checks against the other, which produces bugs that look impossible. The safe options are shipping only one format, or shipping both but keeping no module-level mutable state and nothing identity-sensitive in the public API. Under nodenext you also need separate declaration files per format, since a .d.ts is interpreted as ESM or CommonJS from its extension and the package's type field.",
    },
  ],
  takeaways: [
    "Transpiling and type checking are different jobs; a build that only transpiles will emit type errors silently, so tsc --noEmit has to run somewhere.",
    "Single-file transpilers are fast because they never look at another file, which is exactly why const enum, decorator metadata and .d.ts emit are out of reach for them.",
    "Tree shaking needs ESM's static import list plus a promise that modules have no side effects; code splitting needs a statically analysable dynamic import.",
    "Vite serves unbundled ESM in dev and bundles with Rollup for production; esbuild and SWC sit inside other tools; tsc remains the only source of type checking and declarations.",
    "Publishing correctly means an exports map with types first, separate declarations per format, and awareness of the dual package hazard.",
  ],
  status: "available",
};
