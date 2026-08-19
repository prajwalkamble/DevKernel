import type { Lesson } from "@/content/types";

export const tsconfigLesson: Lesson = {
  id: "modules-tooling-tsconfig",
  slug: "tsconfig-in-depth",
  moduleSlug: "modules-tooling",
  title: "tsconfig.json in Depth",
  summary:
    "The compiler options that change how your code is checked and emitted: what target and lib really control, everything strict switches on, the safety flags it leaves off, the emit options a bundler cares about, and how paths and project references scale a codebase.",
  estimatedMinutes: 40,
  objectives: [
    "Read and write a tsconfig.json, including include/exclude and extends",
    "Separate what target controls (emit) from what lib controls (type declarations)",
    "Name the flags strict turns on and the strictness flags it does not",
    "Configure module emit, isolatedModules, paths, and project references deliberately",
  ],
  sections: [
    {
      id: "the-config-file",
      heading: "The file, and what it applies to",
      body: [
        "A `tsconfig.json` marks a **project root**. Running `tsc` with no file arguments makes it search upward for one, read it, and compile exactly the files it describes. That set comes from three fields: `files` (an explicit list), `include` (globs, defaulting to everything under the config's directory), and `exclude` (globs subtracted from `include`, defaulting to `node_modules`, `bower_components`, `jspm_packages` and the `outDir`).",
        "`extends` lets one config inherit another, which is how monorepos share a base and how the `@tsconfig/*` packages on npm ship sensible presets. Inheritance is a shallow merge — an option in the child replaces the parent's value outright, so a child's `lib` array does not append to the parent's — and relative paths resolve relative to the config file they were *written in*, not the one doing the extending.",
        "Two commands are worth knowing. `tsc --showConfig` prints the fully-resolved configuration after `extends` and defaults are applied, which settles most arguments about why a flag isn't taking effect. And `tsc --explainFiles` lists every file in the program together with the reason it was included, which settles the rest.",
      ],
      examples: [
        {
          id: "tsconfig-shape-example",
          title: "A base config and a build config that extends it",
          ts: `// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    "strict": true,
    "noUncheckedIndexedAccess": true,

    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,

    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}

// tsconfig.build.json
{
  // A shallow merge: each option below replaces the base value entirely
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  // Replaces the base "exclude" rather than adding to it
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}`,
          explanation:
            "The split is the common shape: one config the editor and `tsc --noEmit` use for checking everything, and a second that actually emits and skips the tests. Note that `exclude` in the build config had to repeat `node_modules` and `dist` — replacing rather than extending is the single most surprising thing about `extends`.",
        },
      ],
      pitfalls: [
        {
          title: "exclude does not stop a file from being compiled",
          body: "`exclude` only removes files from what `include` gathered. If any included file imports an excluded one, the excluded file is pulled into the program anyway and is fully typechecked — this is why adding `\"exclude\": [\"**/*.test.ts\"]` often fails to speed anything up or silence anything. To genuinely keep code out, it must be unreachable from the entry points, or live in a separate project. `tsc --explainFiles` will tell you exactly which import dragged it in.",
        },
      ],
    },
    {
      id: "target-and-lib",
      heading: "target and lib do different jobs",
      body: [
        "`target` is about **output**: which JavaScript version the compiler emits. Set it low and TypeScript rewrites newer syntax into older equivalents — `class` becomes a function plus an `__extends` helper, `async`/`await` becomes a state machine driven by `__awaiter` and `__generator`, optional chaining becomes nested conditionals. Set it high and the syntax passes through untouched. Downleveling only handles *syntax*, never library functions: nothing TypeScript emits will make `Object.fromEntries` exist on a runtime that lacks it.",
        "`lib` is about **input**: which built-in type declarations the checker loads. `lib: [\"ES2022\", \"DOM\"]` tells the compiler that `Array.prototype.at`, `Promise`, `document` and `fetch` exist. It has no effect on emit whatsoever — it is a claim about the environment your code will run in, and if the claim is wrong you get a runtime crash rather than a compile error.",
        "`target` supplies a default `lib` (setting `target: \"ES2022\"` implies the ES2022 libraries plus DOM), which is why the two are so often confused. Set them independently when the truth is split: transpiling to ES5 for an ancient browser while polyfilling modern methods means a low `target` with a high `lib`. Node code that never touches a browser should drop `\"DOM\"` so `document` and `window` are compile errors instead of runtime ones.",
      ],
      examples: [
        {
          id: "target-lib-example",
          title: "What the checker refuses to believe in with lib: [\"ES5\", \"DOM\"]",
          ts: `// All three of these exist in every runtime you will ever deploy to — but
// with "lib": ["ES5", "DOM"] the checker has not been told about them.
const found = [1, 2, 3].includes(2);
// Error: Property 'includes' does not exist on type 'number[]'. Do you need to
//        change your target library? Try changing the 'lib' compiler option to
//        'es2016' or later.

const pairs = Object.fromEntries([["a", 1]]);
// Error: Property 'fromEntries' does not exist on type 'ObjectConstructor'. Do you
//        need to change your target library? Try changing the 'lib' compiler option
//        to 'es2019' or later.

const pending = Promise.resolve(1);
// Error: 'Promise' only refers to a type, but is being used as a value here. Do you
//        need to change your target library? Try changing the 'lib' compiler option
//        to es2015 or later.

// Meanwhile "target" is rewriting syntax, which is an entirely separate job.
// This class, with "target": "ES5", emits as:
//
//   var Child = (function (_super) {
//       __extends(Child, _super);
//       function Child() { return _super !== null && _super.apply(this, arguments) || this; }
//       ...
//   }(Base));
//
// ...with a 15-line __extends helper prepended to the file. At "target": "ES2015"
// or above the same source emits as itself, byte for byte.
class Base {
  greet(): string {
    return "hi";
  }
}
class Child extends Base {
  greet(): string {
    return super.greet() + "!";
  }
}
console.log(found, pairs, pending, new Child().greet());`,
          explanation:
            "Every one of those errors ends with the compiler telling you which `lib` value would fix it — a nice touch that turns \"does not exist\" from a mystery into an instruction. The class at the bottom compiles cleanly regardless, because syntax downleveling never needs your permission.",
        },
      ],
    },
    {
      id: "the-strict-family",
      heading: "What strict actually turns on",
      body: [
        "`\"strict\": true` is not a single check — it's an umbrella that enables a family of flags, and new ones join it in new TypeScript versions. The members are `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `strictBuiltinIteratorReturn`, `noImplicitThis`, `useUnknownInCatchVariables` and `alwaysStrict`. Each can be switched off individually, which is how a legacy codebase migrates one check at a time.",
        "Two of them carry most of the weight. `noImplicitAny` refuses to silently give up on a parameter it cannot infer, which is what forces annotations to exist at all. `strictNullChecks` removes `null` and `undefined` from every other type and makes them explicit union members — without it, Module 6's entire narrowing story collapses, because every type silently includes `null` already.",
        "`strictFunctionTypes` is the subtle one. It makes function *parameters* checked contravariantly, so a handler expecting a narrower argument cannot stand in for one expecting a wider argument. It deliberately exempts **methods**, which stay bivariant, because `Array<Dog>.push` needing to satisfy `Array<Animal>` is baked into how the built-in types are written. The practical consequence is that the same signature is checked differently depending on whether you wrote it as `handle: (e: Event) => void` or `handle(e: Event): void`.",
      ],
      examples: [
        {
          id: "strict-family-example",
          title: "One error per family member",
          ts: `// noImplicitAny
function greet(name) {
  return "hi " + name;
}
// Error: Parameter 'name' implicitly has an 'any' type.

// strictNullChecks
const maybe: string | null = null;
console.log(maybe.length);
// Error: 'maybe' is possibly 'null'.

// strictPropertyInitialization
class Widget {
  title: string;
}
// Error: Property 'title' has no initializer and is not definitely assigned in
//        the constructor.

// useUnknownInCatchVariables — a thrown value can be anything, so it is unknown
try {
  throw new Error("boom");
} catch (error) {
  console.log(error.message);
  // Error: 'error' is of type 'unknown'.
}

// strictFunctionTypes — a narrower parameter is NOT a safe substitute
type Handler = (e: Event) => void;
const onClick: Handler = (e: MouseEvent) => console.log(e.clientX);
// Error: Type '(e: MouseEvent) => void' is not assignable to type 'Handler'.

// ...but written as a method, the identical signature is accepted, because
// methods are deliberately left bivariant.
interface Target {
  handle(e: Event): void;
}
const target: Target = {
  handle(e: MouseEvent) {
    console.log(e.clientX);
  },
};
console.log(greet("ada"), target);`,
          explanation:
            "The last two are the same substitution, and only one is rejected. If a `Handler` is called with a plain `Event` — which its type says is allowed — the `MouseEvent` version reads `clientX` off something that has none. The method form has exactly the same hole; TypeScript tolerates it because forbidding it would break the standard library.",
        },
      ],
      pitfalls: [
        {
          title: "Turning strict on later is a per-flag migration, not a switch",
          body: "Flipping `\"strict\": true` on an existing codebase usually produces thousands of errors dominated by `strictNullChecks`. The workable path is the opposite: set `\"strict\": true` and then explicitly disable the members you can't satisfy yet (`\"strictNullChecks\": false`), so new flags added to the umbrella in future releases arrive switched on and the list of exceptions is visible in the config. Turning them back on one at a time then gives a finite, reviewable diff per flag.",
        },
      ],
    },
    {
      id: "beyond-strict",
      heading: "The strictness flags strict leaves off",
      body: [
        "Several checks are too disruptive to have been folded into `strict`, but are worth enabling on a new project. `noUncheckedIndexedAccess` adds `undefined` to the result of every index access — `array[0]` becomes `T | undefined`, and so does `record[key]`. This is simply the truth, and it catches the extremely common bug of trusting a lookup that can miss. It's noisy in loops, where the fix is usually `for...of` rather than an index.",
        "`exactOptionalPropertyTypes` makes `{ retries?: number }` mean \"absent or a number\" instead of \"absent, a number, or explicitly `undefined`\". Without it, `{ retries: undefined }` is assignable, and code that distinguishes a missing key from a present-but-undefined one (`\"retries\" in options`) is quietly wrong.",
        "The rest are cheap. `noImplicitOverride` requires the `override` keyword when a subclass replaces a base member, so renaming the base method breaks the build instead of silently orphaning the child's version. `noFallthroughCasesInSwitch` catches a missing `break`. `noUnusedLocals` and `noUnusedParameters` are better handled by a linter, which can autofix them and won't fail your build mid-refactor.",
      ],
      examples: [
        {
          id: "beyond-strict-example",
          title: "Four opt-in flags, four real bugs",
          ts: `// noUncheckedIndexedAccess — an array index can miss
const names = ["ada", "lin"];
const first = names[0];
console.log(first.toUpperCase());
// Error: 'first' is possibly 'undefined'.

// ...and so can a Record lookup, which is where it saves you most often
const scores: Record<string, number> = { ada: 1 };
const score = scores.missing;
console.log(score.toFixed(2));
// Error: 'score' is possibly 'undefined'.

// exactOptionalPropertyTypes — "absent" and "present and undefined" differ
interface Options {
  retries?: number;
}
const options: Options = { retries: undefined };
// Error: Type '{ retries: undefined; }' is not assignable to type 'Options' with
//        'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the
//        types of the target's properties.

// noImplicitOverride — say it on purpose
class Base {
  greet() {
    return "hi";
  }
}
class Child extends Base {
  greet() {
    return "yo";
  }
  // Error: This member must have an 'override' modifier because it overrides a
  //        member in the base class 'Base'.
}

// noFallthroughCasesInSwitch
function label(kind: "a" | "b") {
  switch (kind) {
    case "a":
      console.log("a");
    case "b":
      console.log("b");
  }
}
// Error: Fallthrough case in switch.
console.log(names, options, new Child().greet(), label("a"));`,
          explanation:
            "`noUncheckedIndexedAccess` is the one people argue about, and the `scores.missing` line is the argument settled: `Record<string, number>` claims every string key maps to a number, which is never true. The flag makes the type honest and costs you a `?? 0` or an `if` at each lookup.",
        },
      ],
    },
    {
      id: "module-and-emit",
      heading: "Module format, emit, and being transpiler-friendly",
      body: [
        "`module` chooses the output format — `ESNext` to leave `import`/`export` alone for a bundler, `CommonJS` to emit `require`, `NodeNext` to decide per-file from the extension and `package.json`. `moduleResolution` chooses how specifiers are *found*, and gets its own lesson next. The two are related but separate: you can typecheck against Node's resolution rules while emitting ESM for a bundler.",
        "The emit options are mostly self-describing. `noEmit` typechecks without writing files, which is what you want when another tool does the transpiling (this project sets it, because Next.js compiles the code). `outDir` and `rootDir` place output; `declaration` and `declarationMap` produce the `.d.ts` files a published library needs; `sourceMap` makes stack traces and debuggers point at your source rather than the output.",
        "`isolatedModules` is the important one for modern setups. It makes the compiler reject any construct that cannot be correctly compiled **one file at a time with no knowledge of the others** — which is exactly the constraint esbuild, SWC and Babel work under. Re-exporting a type without `export type` becomes an error, because a single-file transpiler cannot tell whether the name is a type to erase or a value to forward. `verbatimModuleSyntax` goes further and demands that every type-only import be marked, in exchange for emitting your import statements exactly as written.",
      ],
      examples: [
        {
          id: "emit-options-example",
          title: "What a single-file transpiler needs you to spell out",
          ts: `// types.ts
export interface User {
  id: number;
  name: string;
}
export const VERSION = "1.0.0";

// flags.d.ts
declare const enum Feature {
  Beta = "beta",
}

// app.ts
// A transpiler seeing only this file cannot know whether 'User' is a type to
// erase or a value to forward, so it has to be told.
export { User } from "./types.js";
// Error: Re-exporting a type when 'verbatimModuleSyntax' is enabled requires
//        using 'export type'.

import { User as U, VERSION } from "./types.js";
// Error: 'User' is a type and must be imported using a type-only import when
//        'verbatimModuleSyntax' is enabled.

// An ambient const enum has no runtime representation at all: the compiler
// normally inlines its members using information from another file.
console.log(Feature.Beta);
// Error: Cannot access ambient const enums when 'verbatimModuleSyntax' is enabled.

const user: U = { id: 1, name: "Ada" };
console.log(user.name, VERSION);

// The fixes, all mechanical:
//   export type { User } from "./types.js";
//   import { type User as U, VERSION } from "./types.js";
//   ...and a plain enum, or a union of string literals, instead of const enum.`,
          explanation:
            "None of these are arbitrary. Each one is a construct whose correct output depends on a file the transpiler will never open — so TypeScript makes you supply the missing information in the source, and in exchange your code compiles identically under `tsc`, esbuild, SWC and Babel.",
        },
      ],
    },
    {
      id: "scaling-up",
      heading: "paths, project references, and build speed",
      body: [
        "`paths` maps import specifiers to locations, so `@app/utils/format` can mean `src/utils/format`. It is resolved relative to `baseUrl` when that is set, and since TypeScript 4.1 works without one. What it does **not** do is rewrite anything: the emitted JavaScript still contains `@app/utils/format`, and something downstream — a bundler with a matching alias, Node's own `imports` field, or a post-processing step — has to resolve it. Configuring `paths` and then wondering why `node dist/app.js` cannot find the module is a rite of passage.",
        "For large codebases, **project references** split one compilation into several. Each sub-project sets `composite: true` and emits declarations; consumers list it under `references`, and `tsc --build` (`tsc -b`) builds them in dependency order, skipping any whose inputs haven't changed. The effect is incremental type checking across package boundaries, and editors use the emitted `.d.ts` files rather than re-checking a dependency's source.",
        "Two flags buy speed for free. `skipLibCheck` stops the compiler typechecking `.d.ts` files, which removes a large amount of work and the class of errors where two dependencies ship conflicting type definitions — the cost is that a genuinely broken declaration file goes unnoticed. `incremental` writes a `.tsbuildinfo` file so the next run only re-checks what changed. Nearly every real project turns both on.",
      ],
      examples: [
        {
          id: "paths-example",
          title: "An alias that typechecks and an emit that doesn't run",
          ts: `// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/*"]
    }
  }
}

// src/utils/format.ts
export function title(text: string): string {
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

// src/app.ts
import { title } from "@app/utils/format"; // mapped by "paths" — resolves fine

import { helper } from "@shared/helper";
// Error: Cannot find module '@shared/helper' or its corresponding type declarations.

console.log(title("hello"), helper);

// And here is what tsc emits for this file:
//
//   import { title } from "@app/utils/format";
//
// The specifier is untouched. \`node dist/app.js\` will fail with
// ERR_MODULE_NOT_FOUND unless a bundler, a "paths"-aware runtime, or a rewriting
// step turns it back into a relative path.`,
          explanation:
            "The first import resolves because `paths` told the *checker* where to look; the second fails because nothing did. Neither statement changes in the output. If you want an alias that survives to runtime with no bundler, Node's `imports` field in `package.json` (specifiers beginning with `#`) is the standards-based version.",
        },
      ],
      pitfalls: [
        {
          title: "skipLibCheck hides errors in your own .d.ts files too",
          body: "The flag doesn't distinguish between declaration files from `node_modules` and ones you wrote or generated. If you publish a library, a mistake in your emitted `.d.ts` — a type that references something not exported, say — will not be caught by your own build, and your consumers will find it first. The usual answer is `skipLibCheck` for day-to-day work plus a separate CI step that compiles the built package's declarations without it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between target and lib?",
      answer:
        "target controls emit: which JavaScript version the compiler outputs, and therefore how much syntax gets downleveled — classes into functions plus an __extends helper, async/await into a generator state machine. lib controls input: which built-in type declarations the checker loads, so it decides whether Promise, Array.prototype.includes or document are known to exist. lib never affects emit and target never adds polyfills. target implies a default lib, which is why they get conflated; you set them separately when you transpile to old syntax but polyfill modern methods, or when you want a Node project to treat document as a compile error.",
    },
    {
      question: "What does strict enable, and which strictness flags are outside it?",
      answer:
        "strict is an umbrella over noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, strictBuiltinIteratorReturn, noImplicitThis, useUnknownInCatchVariables and alwaysStrict, and new checks get added to it in new releases. Deliberately outside it are noUncheckedIndexedAccess, which adds undefined to every index and Record lookup; exactOptionalPropertyTypes, which stops an optional property accepting an explicit undefined; noImplicitOverride; and noFallthroughCasesInSwitch. They were left out because they are disruptive on existing code, not because they are less valuable — on a new project they are all worth turning on.",
    },
    {
      question: "Why does isolatedModules exist?",
      answer:
        "Because most builds no longer use tsc to produce JavaScript. esbuild, SWC and Babel transpile one file at a time with no cross-file type information, so any construct whose correct output depends on another file cannot be compiled. isolatedModules makes the compiler reject exactly those constructs: re-exporting a type without export type, ambient const enums, and similar. verbatimModuleSyntax goes further and requires every type-only import to be marked, then emits import statements verbatim. Together they guarantee your code compiles identically under tsc and any single-file transpiler.",
    },
    {
      question: "What does the paths option do, and what does it not do?",
      answer:
        "It maps import specifiers to locations for the type checker, so @app/utils resolves to src/utils. It does not rewrite the emitted JavaScript — the alias appears verbatim in the output, so running that output under Node fails with ERR_MODULE_NOT_FOUND unless a bundler with a matching alias, a resolution hook, or a rewriting step handles it. That mismatch is the most common paths problem. For an alias that works at runtime without a bundler, use the imports field in package.json, whose specifiers start with # and which Node resolves natively.",
    },
    {
      question: "How do you keep type checking fast in a large codebase?",
      answer:
        "skipLibCheck stops the compiler checking .d.ts files, which removes a lot of work and avoids conflicts between dependencies' type definitions — at the cost of not catching a genuinely broken declaration file, including your own. incremental caches results in .tsbuildinfo so only changed files are re-checked. Beyond that, project references split the compilation: each sub-project sets composite: true and emits declarations, consumers list it under references, and tsc --build rebuilds only what changed while editors read the emitted .d.ts instead of re-checking dependency source.",
    },
  ],
  takeaways: [
    "tsconfig.json marks the project root; files/include/exclude choose the inputs, and exclude cannot remove a file that an included file imports.",
    "target rewrites syntax on the way out, lib describes what exists on the way in — neither one polyfills anything.",
    "strict is a family of flags, not a check; noUncheckedIndexedAccess and exactOptionalPropertyTypes are deliberately outside it and worth adding.",
    "isolatedModules and verbatimModuleSyntax exist so single-file transpilers can compile your code correctly, at the price of marking type-only imports yourself.",
    "paths is a checker-only alias that emit does not rewrite; project references, skipLibCheck and incremental are what make large projects check quickly.",
  ],
  status: "available",
};
