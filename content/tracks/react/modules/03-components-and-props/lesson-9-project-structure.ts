import type { Lesson } from "@/content/types";

export const projectStructureLesson: Lesson = {
  id: "react-project-structure",
  slug: "project-structure",
  moduleSlug: "components-and-props",
  title: "Where the Files Go: Project Structure",
  summary:
    "The question the generator refused to answer. The two layouts every React codebase ends up in, the exact point the first one stops working, and the mechanics — barrels, aliases, colocation — that make the second one pleasant.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why grouping by kind of file breaks, using a test you can run on any repo",
    "Regroup a src/ directory by feature, and say what belongs in the shared layer",
    "Apply colocation: a file lives next to its only user",
    "Set up an import alias correctly on a current toolchain",
    "Say what a barrel file buys and what it costs",
  ],
  sections: [
    {
      id: "the-open-question",
      heading: "The question the scaffold left open",
      body: [
        "`create-vite` gives you `src/main.tsx`, `src/App.tsx` and nothing else. No `components/`, no `hooks/`, no `pages/`. That is not an oversight — it is the generator declining to guess, because the right answer depends on what you are building and nobody has yet built anything.",
        "You now know enough to answer it. You can split a page into components, so you are about to have more than two files, and the decision you make in the next ten minutes is one that a codebase lives with for years.",
        "There are exactly two structures worth knowing. Both are shown below by running the rearrangement, so you can watch what happens to the folders rather than compare two drawings.",
        "One thing to settle first: **there is no `src/` layout React requires.** React has no opinion whatsoever — it never reads your directory tree. Every convention here is a convention for humans, and the only test that matters is whether a person can find things.",
      ],
    },
    {
      id: "by-type",
      heading: "Grouping by kind of file",
      body: [
        "This is what almost every tutorial produces: a folder per kind of thing. `components/`, `hooks/`, `api/`, `types/`, `utils/`. It is easy to explain, it is obvious where a new file goes, and for a small app it is genuinely fine.",
        "Then run the test that matters. Pick a feature — the shopping cart — and ask where it is.",
      ],
      examples: [
        {
          id: "by-type-tree",
          title: "src/, grouped by kind",
          lang: "bash",
          code: `src/
├── api/
│   ├── cart.ts
│   ├── client.ts
│   └── products.ts
├── components/
│   ├── Button.tsx
│   ├── CartLine.tsx
│   ├── CartTotal.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── Spinner.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useDebounce.ts
│   └── useProducts.ts
├── types/
│   ├── cart.ts
│   └── product.ts
└── utils/
    └── currency.ts`,
          explanation:
            "The cart is five files in four directories: `components/CartLine.tsx`, `components/CartTotal.tsx`, `hooks/useCart.ts`, `api/cart.ts`, `types/cart.ts`. Nothing in the layout draws a line around them, and nothing stops `ProductGrid` importing `useCart`.",
        },
      ],
      pitfalls: [
        {
          title: "It answers a question nobody asks",
          body: "You have never opened a codebase looking for \"all the hooks\". You open it looking for the cart, or the checkout, or the thing the bug report names. A folder per kind optimises for a lookup that does not happen, at the cost of the one that does — and it degrades smoothly rather than breaking, which is why it survives long past the point it should.",
        },
        {
          title: "The three symptoms that say you have outgrown it",
          body: "A `components/` folder past about fifteen files, where scrolling it is no longer a way to find anything. A pull request that touches five directories to add one feature. And deleting a feature becoming an archaeology exercise, because nothing records which of the fifteen components only it used.",
        },
      ],
    },
    {
      id: "by-feature",
      heading: "Grouping by feature",
      body: [
        "The same fifteen files, with the folders named after what the code is *about* rather than what kind of file it is. Nothing is added or removed in the move — every file simply changes address — and `components/`, `hooks/`, `api/` and `types/` disappear on their own, at the moment their last file leaves.",
        "The rule for the shared layer is the part people get wrong, so state it precisely: **a file moves to `shared/` when it acquires a second caller, and not before.** Not when it looks reusable, not when it is generic, not when somebody might want it later. `Button` is in `shared/` because two features import it. `CartLine` is not, because only the cart does.",
        "Inside `shared/`, the by-kind folders come back — `shared/components/`, `shared/hooks/`, `shared/utils/`. That is not an inconsistency. In the shared layer there is no feature to group by, so \"what kind of thing is this?\" is genuinely the right question again.",
      ],
      examples: [
        {
          id: "by-feature-tree",
          title: "src/, grouped by feature",
          lang: "bash",
          code: `src/
├── features/
│   ├── cart/
│   │   ├── api.ts          <- was api/cart.ts
│   │   ├── CartLine.tsx
│   │   ├── CartTotal.tsx
│   │   ├── types.ts        <- was types/cart.ts
│   │   └── useCart.ts
│   └── catalog/
│       ├── api.ts
│       ├── ProductCard.tsx
│       ├── ProductGrid.tsx
│       ├── types.ts
│       └── useProducts.ts
└── shared/
    ├── api/
    │   └── client.ts
    ├── components/
    │   ├── Button.tsx
    │   └── Spinner.tsx
    ├── hooks/
    │   └── useDebounce.ts
    └── utils/
        └── currency.ts`,
          explanation:
            "Notice the renames. `api/cart.ts` becomes `cart/api.ts`, and `types/cart.ts` becomes `cart/types.ts` — once the folder says which feature it is, the filename no longer has to. `useCart.ts` keeps its name because the `use` prefix is a hook convention rather than a redundant label.",
        },
      ],
      pitfalls: [
        {
          title: "What this buys, in the order you will notice it",
          body: "A feature is one directory, so it can be read as a unit, reviewed as a unit, handed to another person as a unit, and deleted as a unit — `rm -r features/cart` leaves nothing orphaned. And every import that crosses a boundary now has `features/` or `shared/` in its path, which makes coupling between features visible in a diff instead of invisible in a flat folder.",
        },
        {
          title: "`shared/` becoming a second junk drawer",
          body: "The failure mode of this layout is a `shared/` folder that grows until it is the old `components/` under a new name. It happens by promoting things on the *expectation* of reuse. Hold the line: second caller, then promote. A duplicated component that is later deleted costs far less than a shared one with two feature-specific props bolted onto it.",
        },
      ],
    },
    {
      id: "colocation",
      heading: "Colocation, and the folder a component grows into",
      body: [
        "Both layouts rest on the same underlying rule, and it is worth stating on its own because it decides every smaller question too: **a file lives next to the thing that uses it, and moves outward only when a second thing uses it.**",
        "That applies below the feature level as well. A component starts as one file. When it acquires a stylesheet, a test, a set of stories, and a hook that only it calls, those go into a folder named after it — not into four separate top-level folders that happen to contain one file each about `Button`.",
      ],
      examples: [
        {
          id: "colocated-folder",
          title: "A component's own folder",
          lang: "bash",
          code: `src/shared/components/
├── Button/
│   ├── Button.module.css      <- class names scoped to this file
│   ├── Button.stories.tsx
│   ├── Button.test.tsx
│   ├── Button.tsx
│   ├── index.ts               <- the only file outside code imports
│   └── useButtonRipple.ts     <- a hook only Button uses
├── Card.tsx
└── Spinner.tsx`,
          explanation:
            "`Card` and `Spinner` are still single files, and should stay that way until they are not. The folder is what a component grows into, not what every component starts as — creating six files for a component that needs one is ceremony, and ceremony is the thing that makes people stop following a convention.",
        },
      ],
      pitfalls: [
        {
          title: "`Button/index.tsx` versus `Button/Button.tsx`",
          body: "Putting the component itself in `index.tsx` gives you the same short import with one fewer file. It also gives you eleven tabs called `index.tsx` in your editor and a stack trace that names none of them usefully. Name the file after the component and keep `index.ts` as a one-line re-export; the editor tab is worth more than the saved file.",
        },
      ],
    },
    {
      id: "barrels",
      heading: "Barrel files: what they buy and what they cost",
      body: [
        "A **barrel** is an `index.ts` whose only job is to re-export. It gives a folder a front door: everything listed in it is public, everything else is internal, and the import path stops depending on which file inside happens to define what.",
        "That boundary is the real benefit. `import { CartTotal } from \"@/features/cart\"` says the cart chose to expose `CartTotal`. `import { CartTotal } from \"@/features/cart/CartTotal\"` says you went in and took it. The first one survives the file being renamed; the second one does not.",
        "The costs are real and worth knowing before you barrel everything.",
      ],
      examples: [
        {
          id: "barrel-file",
          title: "features/cart/index.js",
          lang: "javascript",
          code: `// The feature's public surface. Everything not listed here is internal,
// and that is enforced by convention rather than by the compiler.
export { CartTotal } from "./CartTotal";
export { CartLine } from "./CartLine";
export { useCart } from "./useCart";

// Deliberately not exported: ./api, which is an implementation detail of
// useCart, and ./types, which callers get through the hook's return type.`,
          explanation:
            "Three lines and one comment. A barrel that re-exports every file in the folder has a front door with no walls around it — it is the *selection* that carries the meaning, so a barrel worth writing is one where something has been left out.",
          alternates: [
            {
              lang: "typescript",
              title: "features/cart/index.ts",
              code: `// The feature's public surface. Everything not listed here is internal.
export { CartTotal } from "./CartTotal";
export { CartLine } from "./CartLine";
export { useCart } from "./useCart";

// In TypeScript the barrel is also where the feature's types come out, and
// \`export type\` is worth using rather than a plain re-export: it tells the
// bundler the binding disappears at build time, so a type never drags its
// module into the graph.
export type { Cart, CartItem } from "./types";

// Deliberately not exported: ./api, which is an implementation detail of
// useCart. The boundary is still a convention — nothing stops a caller
// importing "../cart/api" directly except a lint rule.`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Barrels create circular imports",
          body: "If `cart/CartTotal.tsx` imports from `@/features/cart` — its own barrel — the barrel imports `CartTotal.tsx`, which imports the barrel. Inside a folder, always import the sibling file directly (`./CartLine`), and reserve the barrel for code outside the folder. This is the single most common way a working project starts throwing `Cannot access before initialization` at runtime.",
        },
        {
          title: "One barrel per boundary, not one per folder",
          body: "A barrel in every directory means an import of one function pulls in a chain of index files, and a bundler that cannot prove the rest is unused ships it. Put a barrel where there is a real boundary — a feature, a shared category — and nowhere else. If you cannot say what the barrel is a boundary *around*, delete it and import the file.",
        },
      ],
    },
    {
      id: "aliases",
      heading: "Import aliases, and the one place to configure them",
      body: [
        "Feature folders make paths deeper, and `../../../shared/components/Button` is both unreadable and wrong the moment a file moves. An alias fixes that: `@/` means `src/`, from anywhere.",
        "The configuration has changed recently, and most guides you will find are out of date on both halves of it.",
        "**In TypeScript, `paths` without `baseUrl`.** Older setups pair `\"baseUrl\": \".\"` with `\"paths\"`. On TypeScript 6 that is an error, not a warning — `paths` entries are resolved relative to the config file that declares them, so `baseUrl` has nothing left to do.",
        "**In Vite, usually nothing.** Current Vite reads your tsconfig's `paths` directly. A `resolve.alias` block is still what you need for a non-TypeScript project, or for an alias that has no tsconfig counterpart — but adding one that merely repeats `paths` gives you two sources of truth that can drift apart.",
      ],
      examples: [
        {
          id: "alias-tsconfig",
          title: "tsconfig.app.json — the whole configuration",
          lang: "json",
          code: `{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,

    // Relative to this file. No "baseUrl" — see below.
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}`,
          explanation:
            "Abridged to the lines that matter; the generated file has a dozen more. `paths` goes in `tsconfig.app.json` rather than the root `tsconfig.json`, because the root file has `\"files\": []` and compiles nothing — options set there apply to no source file at all.",
        },
        {
          id: "baseurl-deprecated",
          title: "What adding baseUrl does on TypeScript 6",
          lang: "bash",
          code: `# tsconfig.app.json with the older "baseUrl": "." plus "paths":
npm run build`,
          output: `> my-app@0.0.0 build
> tsc -b && vite build

tsconfig.app.json(25,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
  Visit https://aka.ms/ts6 for migration information.`,
          explanation:
            "The build stops before Vite is even reached. Delete the `baseUrl` line rather than silencing it — the `paths` entry above already works on its own, and `ignoreDeprecations` only buys you until TypeScript 7.",
        },
        {
          id: "alias-in-use",
          title: "The same import, both ways",
          lang: "jsx",
          code: `// From src/features/cart/CartTotal.jsx:

// Fragile. Correct today; wrong the moment this file moves one level.
// import { Button } from "../../shared/components/Button";

// Stable. Says where the module lives, not where you are standing.
import { Button } from "@/shared/components/Button";

// Sibling inside the same feature: keep it relative. It moves *with*
// this file, and going out through the alias would route an import
// through the feature's own barrel and back in.
import { CartLine } from "./CartLine";`,
          explanation:
            "The rule is one line: **alias across boundaries, relative within one.** A path that leaves your feature should say so; a path that stays inside it should stay short and move with the folder when the folder moves.",
          alternates: [
            {
              lang: "tsx",
              code: `// From src/features/cart/CartTotal.tsx:

// Fragile. Correct today; wrong the moment this file moves one level.
// import { Button } from "../../shared/components/Button";

// Stable. Says where the module lives, not where you are standing.
import { Button } from "@/shared/components/Button";

// Sibling inside the same feature: keep it relative. It moves *with*
// this file, and going out through the alias would route an import
// through the feature's own barrel and back in.
import { CartLine } from "./CartLine";`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The alias resolves but the test runner cannot find it",
          body: "Type-checking and bundling are not the only things that read your imports. Vitest reads the Vite config so it inherits the alias for free; Jest does not, and needs its own `moduleNameMapper`. If an import works in `npm run dev` and fails in `npm test`, the alias is configured in one place and not the other — and the error will name the specifier, not the config.",
        },
      ],
    },
    {
      id: "when-to-move",
      heading: "Starting flat, and knowing when to move",
      body: [
        "None of this means starting with `features/`. A four-component app in a flat `src/` is correct, and inventing an architecture for it is a cost with no matching benefit.",
        "The order that works: **flat until it hurts, then by feature.** Concretely — put files directly in `src/` until there are about ten, group by kind when scanning `src/` stops working, and split into features when one folder passes about fifteen files or when a single change starts touching four directories.",
        "Move when the pain is real rather than anticipated. The restructure is a mechanical afternoon at any size — it is moving files and fixing imports, and the compiler finds every one you miss. What is not mechanical is unpicking an architecture invented for an app that never grew into it.",
        "And whichever you pick, **make it the only one.** Half a codebase by feature and half by kind is worse than either, because now nobody can guess where anything is. If you migrate, finish the migration.",
      ],
      pitfalls: [
        {
          title: "`pages/` or `routes/` is a third thing, not a competitor",
          body: "A routed application has a folder mapping URLs to screens, and it sits alongside `features/` rather than replacing it. A route file should be thin — read the params, pick the feature components, arrange them. When routes start holding data fetching and business logic, you have two competing structures and the feature folders will lose.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you structure a React project, and when does it change?",
      answer:
        "Flat while it is small, then by feature. Grouping by kind of file — `components/`, `hooks/`, `api/` — is the common default and answers a question nobody asks: you never look for all the hooks, you look for the cart, and the cart ends up spread across four folders with no boundary around it. Grouping by feature puts each feature in one directory so it can be read, reviewed and deleted as a unit, with a small `shared/` layer for what genuinely has more than one caller. I would move at the point where one folder passes roughly fifteen files, or where adding a feature touches four directories.",
    },
    {
      question: "What goes in the shared folder?",
      answer:
        "Whatever has a second caller, and nothing before that. Promoting on expected reuse is what turns `shared/` into the junk drawer the restructure was meant to remove — you end up with a supposedly generic component carrying two feature-specific props. Duplicating a component and deleting one copy later is cheaper than un-sharing one. Inside `shared/` I group by kind again, because there is no feature to group by there.",
    },
    {
      question: "What is a barrel file, and what is the argument against one?",
      answer:
        "An `index.ts` that re-exports a folder's public surface, so importers depend on the folder rather than on which file defines what — and so the folder can rename its internals freely. The costs are circular imports, which happen as soon as a file inside the folder imports its own barrel, and bundle size when barrels are nested and the bundler cannot prove the untouched re-exports are unused. One barrel per real boundary, imported only from outside that boundary.",
    },
    {
      question: "How do you set up the `@/` import alias?",
      answer:
        "`\"paths\": { \"@/*\": [\"./src/*\"] }` in the tsconfig that actually covers `src/` — in a Vite scaffold that is `tsconfig.app.json`, not the root file, which compiles nothing. No `baseUrl`: it is deprecated in TypeScript 6 and errors the build, and `paths` resolves relative to its own config file without it. Current Vite reads those paths directly, so a `resolve.alias` block is usually redundant. Then use the alias across boundaries and relative paths within one.",
    },
  ],
  takeaways: [
    "React has no opinion on your folder structure — every convention here is for humans",
    "Grouping by kind of file scatters one feature across four folders; run the \"where is the cart?\" test on any repo to see it",
    "Grouping by feature makes a feature one directory: readable, reviewable and deletable as a unit",
    "A file moves to `shared/` on its second caller, never on expected reuse",
    "Inside `shared/`, group by kind again — there is no feature to group by",
    "Colocation is the rule underneath both: a file lives next to its only user",
    "A component grows into a folder when it acquires a second file, and not before",
    "A barrel is a boundary; import it from outside the folder only, or you get circular imports",
    "`paths` without `baseUrl` — `baseUrl` errors on TypeScript 6 — and current Vite needs no second copy",
    "Start flat, move when it hurts, and finish the migration once you start it",
  ],
  status: "available",
};
