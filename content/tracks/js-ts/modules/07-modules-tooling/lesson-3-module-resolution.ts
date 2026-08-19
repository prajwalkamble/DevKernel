import type { Lesson } from "@/content/types";

export const moduleResolutionLesson: Lesson = {
  id: "modules-tooling-resolution",
  slug: "module-resolution",
  moduleSlug: "modules-tooling",
  title: "Module Resolution",
  summary:
    "How a string in an import statement becomes a file on disk: the three kinds of specifier, the node_modules walk, the exports field that replaced main, TypeScript's four resolution modes, and where declaration files come from.",
  estimatedMinutes: 35,
  objectives: [
    "Trace how relative, absolute and bare specifiers are each resolved",
    "Read a package.json exports map, including conditions and subpath patterns",
    "Choose between node10, node16/nodenext and bundler, and know why .js appears in TypeScript imports",
    "Diagnose missing types and add declarations for packages that ship none",
  ],
  sections: [
    {
      id: "three-kinds-of-specifier",
      heading: "Three kinds of specifier",
      body: [
        "The string in `import x from \"...\"` is a **module specifier**, and its first character decides everything that follows. A **relative** specifier starts with `./` or `../` and names a path relative to the importing file. An **absolute** specifier starts with `/` and names a filesystem path — almost never used in application code. Everything else is a **bare** specifier: a package name like `react`, a scoped name like `@acme/utils`, a subpath like `lodash/fp`, or a builtin like `node:fs`.",
        "Bare specifiers are the interesting case, because nothing about them says where the code is. Node resolves them by walking `node_modules` directories upward; a bundler usually does the same with extra rules; TypeScript does it for types with rules that mirror whichever runtime you told it to model. The `node:` prefix short-circuits all of that — it's an explicit statement that you mean the builtin, and Node will not fall back to a `node_modules` package of the same name.",
        "Two adjacent details cause a lot of confusion. First, a specifier is not a filename: `./util` may resolve to `util.ts`, `util.js`, `util/index.ts` or nothing, depending on the resolver. Second, resolution is per-consumer, not per-package — the same specifier in two files of the same project can resolve to two different copies of a dependency if `node_modules` is nested that way.",
      ],
      examples: [
        {
          id: "specifier-kinds-example",
          title: "What each kind of specifier means",
          ts: `// src/utils/format.ts
export function title(text: string): string {
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

// src/app.ts
// Relative — resolved against this file's directory
import { title } from "./utils/format.js";

// Bare, builtin — the node: prefix means "the runtime module", never a package
import { readFile } from "node:fs/promises";

// Bare, package — resolved by walking node_modules upward from this file
import * as react from "react";

// Bare, subpath of a package — the package decides whether this is reachable
import { useState } from "react";

// Bare, not installed anywhere
import { nope } from "totally-not-installed";
// Error: Cannot find module 'totally-not-installed' or its corresponding type
//        declarations.

console.log(title("hello"), typeof readFile, typeof react, typeof useState, nope);`,
          explanation:
            "The failure message is worth reading closely: \"or its corresponding type declarations\". TypeScript is telling you it looked for *two* different things — a JavaScript module and a description of its types — and found neither. Those are separate searches with separate failure modes, and the last section of this lesson is about the second one.",
        },
      ],
    },
    {
      id: "the-node-modules-walk",
      heading: "The node_modules walk",
      body: [
        "For a bare specifier `@acme/utils` imported from `/app/src/api/client.ts`, Node looks for `/app/src/api/node_modules/@acme/utils`, then `/app/src/node_modules/@acme/utils`, then `/app/node_modules/@acme/utils`, then `/node_modules/@acme/utils`, stopping at the first hit. That upward walk is the whole algorithm, and it's why a dependency installed at the repo root is visible from every file beneath it.",
        "Having found the directory, the resolver has to pick a file inside it. The legacy rules — TypeScript calls this mode `node10`, after the Node version — read `main` from `package.json`, falling back to `index.js`. For a relative specifier they try the path as written, then with each known extension appended, then as a directory containing a `package.json` with `main`, then as a directory containing `index`. That extension-guessing is why `import \"./util\"` works in CommonJS and why it does not work in real ESM.",
        "This layered guessing was fine when there was one entry point and one module format per package. It stopped being fine when packages needed to ship both an ESM and a CommonJS build, expose several entry points, and hide their internals — which is what the `exports` field was introduced to fix.",
      ],
      examples: [
        {
          id: "node-modules-walk-example",
          title: "A legacy package, resolved by main",
          ts: `// node_modules/legacy-lib/package.json
{
  "name": "legacy-lib",
  "version": "1.0.0",
  "main": "./lib/index.js"
}

// node_modules/legacy-lib/lib/index.d.ts
export declare function hello(): string;

// src/app.ts
// No "exports" field, so the old rules apply:
//   1. node_modules/legacy-lib exists?          yes
//   2. package.json "main" says ./lib/index.js  -> that file
//   3. types? same path with .d.ts              -> lib/index.d.ts
import { hello } from "legacy-lib";

// With no "exports" field there is also nothing stopping a deep import.
// It resolves straight to the file, internal or not.
import { hidden } from "legacy-lib/lib/internal.js";

console.log(hello(), hidden);

// node_modules/legacy-lib/lib/internal.d.ts
export declare const hidden: string;`,
          explanation:
            "Both imports resolve, and that is the problem. Under the legacy rules every file in a published package is public API by accident: consumers reach into `lib/internal.js`, you rename it in a patch release, and their build breaks. Nothing in the package could prevent it.",
        },
      ],
    },
    {
      id: "the-exports-field",
      heading: "The exports field: an allowlist with conditions",
      body: [
        "`exports` replaces `main` and changes the rules in two ways. It is an **allowlist**: once present, only the subpaths it names can be imported, and everything else fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime or `Cannot find module` at compile time. And its values may be **conditional** — an object whose keys select a target based on how the module is being loaded.",
        "The standard conditions are `import` (the importer used ESM), `require` (the importer used CommonJS), `node` and `browser` (which environment), `types` (TypeScript is asking), and `default` (always matches). They are tested **in the order written**, first match wins, so `default` must come last and `types` must come first — a `types` condition placed after `import` will never be reached, which is a mistake real packages ship.",
        "Subpath patterns let one entry cover many files: `\"./features/*\": \"./dist/features/*.js\"` exposes everything under one directory without listing it. And the sibling `imports` field does the same thing inward — specifiers starting with `#` are private to the package and resolved by the runtime itself, which makes it the one aliasing mechanism that works without a bundler.",
      ],
      examples: [
        {
          id: "exports-field-example",
          title: "Conditions, subpaths, and what is now unreachable",
          ts: `// node_modules/@acme/utils/package.json
{
  "name": "@acme/utils",
  "version": "2.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./format": {
      "types": "./dist/format.d.ts",
      "default": "./dist/format.js"
    },
    "./package.json": "./package.json"
  }
}

// node_modules/@acme/utils/dist/index.d.ts
export declare const version: string;

// node_modules/@acme/utils/dist/format.d.ts
export declare function title(text: string): string;

// src/app.ts
import { version } from "@acme/utils";        // the "." entry
import { title } from "@acme/utils/format";   // the "./format" entry

// Not listed in "exports", so it does not exist as far as consumers are concerned —
// even though the file is right there on disk inside the installed package.
import { secret } from "@acme/utils/dist/internal.js";
// Error: Cannot find module '@acme/utils/dist/internal.js' or its corresponding
//        type declarations.

console.log(version, title("hello"), secret);`,
          explanation:
            "Ordering inside a condition object is not cosmetic. `types` is first because TypeScript stops at the first key it matches, and `default` is last because it matches everything. Getting this wrong is the usual cause of \"the package works but has no types\" — the declarations were there, behind a condition that was never reached.",
        },
      ],
      pitfalls: [
        {
          title: "Adding exports to a published package is a breaking change",
          body: "The moment the field appears, every deep import your consumers relied on stops resolving — and since it is an allowlist, you cannot know which ones they were using. Packages that add `exports` in a minor release break builds across the ecosystem. If you own the package, either enumerate the old paths explicitly during a deprecation period, or ship the change as a major version. Note that `\"./package.json\": \"./package.json\"` is worth including regardless, because a surprising number of tools read it.",
        },
      ],
    },
    {
      id: "resolution-modes",
      heading: "TypeScript's resolution modes, and the .js that isn't a typo",
      body: [
        "TypeScript has to model whatever will actually resolve your imports at runtime, so `moduleResolution` picks a strategy. `node10` is the legacy algorithm: extension guessing, `main`, `index`, and **no support for `exports`** — a deep import into a package that forbids it still resolves, so your build passes and the runtime fails. `node16` and `nodenext` model modern Node exactly, including `exports`, conditions, and per-file ESM/CommonJS mode. `bundler` models what Vite, webpack and esbuild do: `exports` is honoured, but extensions stay optional because bundlers guess them.",
        "Under `node16`/`nodenext`, a relative import from a file that is ESM **must include the file extension**, because that is what Node requires. And the extension you write is the one in the *output*: `import { x } from \"./util.js\"` in `util.ts`'s sibling. Writing `.js` when the file on disk is `.ts` looks wrong every single time, and it is correct — TypeScript never rewrites specifiers, so the specifier has to describe the emitted world, not the source one.",
        "Two escape hatches exist. `allowImportingTsExtensions` permits `./util.ts` and is only legal alongside `noEmit` or `emitDeclarationOnly`, since the compiler would otherwise emit a broken import. And TypeScript 5.7's `rewriteRelativeImportExtensions` does rewrite `.ts` to `.js` on the way out, for projects that would rather write the source path.",
      ],
      examples: [
        {
          id: "resolution-modes-example",
          title: "The same imports under moduleResolution: node16",
          ts: `// package.json
{
  "name": "app",
  "type": "module"
}

// src/util.ts
export const helper = "helper";

// src/app.ts
import { helper } from "./util";
// Error: Relative import paths need explicit file extensions in ECMAScript imports
//        when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean
//        './util.js'?

// The correct form. The file on disk is util.ts; the specifier describes the
// file that will exist after compilation.
import { helper as ok } from "./util.js";

console.log(helper, ok);

// Under "moduleResolution": "bundler" the first line is fine, because a bundler
// tries the extensions for you. Under "node10" it is also fine — and so is a
// deep import into a package whose "exports" forbids it, which is exactly the
// combination that compiles cleanly and then crashes at runtime.`,
          explanation:
            "If you are shipping to Node, `nodenext` is the honest setting: it will complain about precisely the things Node will complain about. If a bundler owns resolution, `bundler` matches reality and spares you the extensions. `node10` should be treated as a compatibility mode for old projects, not a choice.",
        },
      ],
    },
    {
      id: "finding-types",
      heading: "Where declaration files come from",
      body: [
        "Resolving the code is only half the job — TypeScript also has to find a description of its types, and it tries several places in order. First the package's own declarations: a `types` condition in `exports`, or a top-level `types`/`typings` field, or a `.d.ts` file sitting beside the resolved `.js`. Then `node_modules/@types/<name>`, walking up the same way, which is where DefinitelyTyped packages land. For a scoped package, the `@types` name mangles the slash: `@acme/utils` becomes `@types/acme__utils`.",
        "When both searches fail you get TS7016 — \"Could not find a declaration file for module 'x'\" — and the message helpfully names the two fixes: install an `@types` package if one exists, or write a declaration yourself. A one-line `declare module \"legacy-lib\";` in any `.d.ts` file included in the program silences it by typing the whole module as `any`, and a slightly longer version types the parts you actually use.",
        "Two options adjust the search. `typeRoots` changes which directories are scanned for `@types` packages. `types` restricts which of them are loaded automatically as globals — setting `\"types\": []` is the standard way to stop `@types/node` from adding Node globals to browser code that shouldn't have them. Neither affects packages you `import` explicitly; both only govern the automatic global inclusion.",
      ],
      examples: [
        {
          id: "finding-types-example",
          title: "An untyped package, and two ways to fix it",
          ts: `// node_modules/untyped-lib/package.json
{
  "name": "untyped-lib",
  "version": "1.0.0",
  "main": "./index.js"
}

// node_modules/untyped-lib/index.js
module.exports.shout = (text) => text.toUpperCase() + "!";

// src/app.ts
import { shout } from "untyped-lib";
// Error: Could not find a declaration file for module 'untyped-lib'.
//        '.../node_modules/untyped-lib/index.js' implicitly has an 'any' type.
//        Try \`npm i --save-dev @types/untyped-lib\` if it exists or add a new
//        declaration (.d.ts) file containing \`declare module 'untyped-lib';\`

console.log(shout("hi"));

// src/typed.ts
// The other fix, written by hand: an ambient module declaration. Placed in any
// declaration file the program includes, it teaches the compiler the shape.
import { greet } from "hand-typed-lib";
console.log(greet("ada").toUpperCase());

// types/hand-typed-lib.d.ts
declare module "hand-typed-lib" {
  export function greet(name: string): string;
}`,
          explanation:
            "`declare module \"x\";` with no body is the blunt version — every import from it becomes `any`, which is a knowing choice rather than an accident. The version with a body is better: you describe only the functions you call, get real checking on them, and the declaration doubles as documentation of your dependency surface. Note that the declaration alone is enough to satisfy the checker: nothing verifies that `hand-typed-lib` is installed, or that it matches.",
        },
      ],
      pitfalls: [
        {
          title: "A package can resolve for the runtime and not for TypeScript",
          body: "Under `node16`/`nodenext`, TypeScript looks for the `types` condition using the same import/require distinction Node uses — so a package that exposes types only under `require` will appear untyped to an ESM importer, and vice versa. This is the \"masquerading as ESM\" class of problem that the `arethetypeswrong` tool exists to detect. When a package's types work in one project and not another, the difference is usually the resolution mode, not the package version.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Node resolve a bare import specifier?",
      answer:
        "It walks node_modules directories upward from the importing file — src/api/node_modules, then src/node_modules, then the project root, then all the way to the filesystem root — and takes the first match. Inside the package it then picks a file: with an exports field, by matching the requested subpath and the active conditions; without one, from the main field, falling back to index.js. Specifiers prefixed with node: are builtins and skip the walk entirely. Because the walk is per-importing-file, two files in the same project can resolve the same specifier to different installed copies.",
    },
    {
      question: "What does the exports field do that main did not?",
      answer:
        "Two things. It is an allowlist, so only the subpaths it names are importable and everything else fails with ERR_PACKAGE_PATH_NOT_EXPORTED — which finally lets a package have private internals. And its values can be conditional objects keyed by how the module is being loaded: import, require, node, browser, types, default. Conditions are tested in written order and the first match wins, so types has to come first and default has to come last. Adding exports to an existing package is a breaking change, because deep imports consumers relied on stop resolving.",
    },
    {
      question: "Why do TypeScript imports sometimes end in .js when the file is .ts?",
      answer:
        "Because TypeScript never rewrites module specifiers — whatever you write is what appears in the emitted JavaScript. Under moduleResolution node16 or nodenext the emitted code is real ESM running in Node, which requires explicit file extensions, so the specifier has to name the file that will exist after compilation: ./util.js, even though the source is util.ts. The compiler maps that back to util.ts when checking. If you would rather write ./util.ts, allowImportingTsExtensions permits it but only with noEmit, and TypeScript 5.7's rewriteRelativeImportExtensions rewrites it during emit.",
    },
    {
      question: "What's the difference between moduleResolution node10, node16 and bundler?",
      answer:
        "node10 is the legacy algorithm: extension guessing, main, index, and no support for the exports field — so a deep import a package forbids will typecheck and then fail at runtime. node16 and nodenext model modern Node exactly: exports and conditions are honoured, and relative imports in ESM files need explicit extensions. bundler models what Vite, webpack and esbuild actually do: exports is honoured, but extensions remain optional because the bundler guesses them. Pick the one that matches whoever resolves your imports in production.",
    },
    {
      question: "Where does TypeScript look for a package's types?",
      answer:
        "First the package itself: a types condition inside exports, then a top-level types or typings field, then a .d.ts sitting next to the resolved JavaScript. Then node_modules/@types/<name>, walking up the directory tree the same way, with scoped names mangled — @acme/utils becomes @types/acme__utils. If both fail you get TS7016, and the fixes are an @types package or your own declare module declaration. typeRoots changes which directories are searched for @types packages and types restricts which are auto-included as globals; neither affects an explicit import.",
    },
  ],
  takeaways: [
    "A specifier is relative, absolute or bare, and only bare specifiers trigger the node_modules walk — which goes upward from the importing file and stops at the first hit.",
    "The exports field turns a package into an allowlist with conditional entry points; conditions are matched in written order, so types goes first and default goes last.",
    "moduleResolution should match whoever resolves imports in production: nodenext for Node, bundler for a bundler, node10 only for legacy compatibility.",
    "TypeScript never rewrites specifiers, which is why .js extensions appear in .ts source under Node-style resolution.",
    "Types are found from the package's own declarations first and @types second; when neither exists, an ambient declare module is the manual fix.",
  ],
  status: "available",
};
