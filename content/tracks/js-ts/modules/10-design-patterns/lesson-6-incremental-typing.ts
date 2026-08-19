import type { Lesson } from "@/content/types";

export const incrementalTypingLesson: Lesson = {
  id: "patterns-incremental-typing",
  slug: "incremental-typing-strategies",
  moduleSlug: "design-patterns",
  title: "Incremental Typing Strategies",
  summary:
    "Turning strictness on without stopping the world: what each strict flag actually costs, the order to enable them in, typing JavaScript with JSDoc before converting it, and how to stop `any` spreading.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what allowJs, checkJs and `// @ts-check` each control",
    "Type JavaScript with JSDoc, without renaming a single file",
    "Enable the strict flags in an order that keeps the error count manageable",
    "Explain why `any` is contagious and `unknown` is not",
    "Ratchet strictness per directory rather than all at once",
    "Enforce the ratchet so it cannot slip back",
  ],
  sections: [
    {
      id: "the-three-switches",
      heading: "allowJs, checkJs, and the per-file override",
      body: [
        "Three settings control how much TypeScript pays attention to your JavaScript, and they compose in a way worth being precise about.",
        "**`allowJs`** — include `.js` files in the program at all. Without it, TypeScript ignores them and imports from them fail to resolve. This does not check anything.",
        "**`checkJs`** — type-check every included `.js` file, using inference and any JSDoc annotations it finds.",
        "**`// @ts-check`** — a comment at the top of one file that opts *that file* in, regardless of the `checkJs` setting. There is a matching `// @ts-nocheck` to opt out when `checkJs` is on.",
        "That per-file comment is the tool that makes incremental adoption work: leave `checkJs` off globally and add `// @ts-check` to one file at a time.",
      ],
      examples: [
        {
          id: "checkjs-demo",
          title: "The same file, with and without checking",
          js: `// legacy.js — no @ts-check comment

/**
 * @param {string} name
 * @param {number} [times]
 * @returns {string}
 */
function greet(name, times = 1) {
  return (name + "! ").repeat(times);
}

greet(42);              // wrong type
greet("Ada", "twice");  // wrong type

/** @type {{ id: number, name: string }} */
const user = { id: 1 };   // missing property

const maybe = document.querySelector(".x");
maybe.textContent = "y";  // possibly null`,
          output: `# tsc --allowJs --strict          (no checkJs, no @ts-check comment)
(no output — the file is compiled but not checked)

# tsc --allowJs --checkJs --strict
legacy.js(11,7): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
legacy.js(12,14): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
legacy.js(15,7): error TS2741: Property 'name' is missing in type '{ id: number; }' but required in type '{ id: number; name: string; }'.
legacy.js(18,1): error TS18047: 'maybe' is possibly 'null'.`,
          explanation:
            "Identical file, identical JSDoc, four errors or none depending on one flag. Add `// @ts-check` as the first line and the second result happens **without** the flag — which is the per-file ratchet in one line. Note the last error: `strictNullChecks` applies to checked JavaScript exactly as it does to TypeScript.",
        },
      ],
    },
    {
      id: "jsdoc",
      heading: "JSDoc: real types, no rename",
      body: [
        "TypeScript understands JSDoc annotations as fully as it understands its own syntax. A `.js` file with `// @ts-check` and good JSDoc is genuinely type-checked — same inference, same errors, same editor experience.",
        "This matters in three situations: a codebase where renaming files would produce an unreviewable diff, a repository where a build step is unwelcome, and a team adopting types gradually without a migration project.",
        "The main cost is verbosity. Anything beyond simple shapes is easier in `.ts`, and generics in JSDoc get unpleasant quickly.",
      ],
      examples: [
        {
          id: "jsdoc-syntax",
          title: "The JSDoc you will actually use",
          js: `// @ts-check

/** @typedef {{ id: number, name: string, email?: string }} User */

/**
 * @param {User} user
 * @param {{ upper?: boolean }} [options]
 * @returns {string}
 */
export function displayName(user, options = {}) {
  const name = options.upper ? user.name.toUpperCase() : user.name;
  return \`\${name} <\${user.email ?? "no email"}>\`;
}

/** @type {Map<string, User>} */
const cache = new Map();

/** @type {User[]} */
const users = [];

// Casting needs parentheses around the expression.
const el = /** @type {HTMLInputElement} */ (document.querySelector("#name"));

// Importing a type from a .ts file, or from a dependency:
/** @type {import("./types").Settings} */
let settings;

/**
 * Generics work, and this is where JSDoc starts to hurt.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => boolean} predicate
 * @returns {T | undefined}
 */
export function findFirst(items, predicate) {
  return items.find(predicate);
}`,
          explanation:
            "`/** @type {X} */ (expression)` is the cast form, and the parentheses are mandatory — without them the annotation attaches to nothing and is silently ignored, which is a genuinely annoying half-hour. `import(\"./types\").Settings` is the most useful piece here: it lets JavaScript files share the type definitions your TypeScript files already have.",
        },
      ],
      pitfalls: [
        {
          title: "JSDoc that lies is worse than no JSDoc",
          body: "Without `@ts-check`, JSDoc is a comment — nothing verifies it, and it rots. Codebases full of `@param {Object} options` that has not matched reality since 2019 are common. Either turn checking on so the annotations are enforced, or do not pretend the comments are types.",
        },
      ],
    },
    {
      id: "strict-order",
      heading: "The strict flags, in the order to enable them",
      body: [
        "`strict` is not one setting — it is a shorthand for a family, and you can enable them individually. Doing so one at a time turns an unmanageable error count into a series of small, reviewable changes.",
        "A workable order, cheapest first:",
        "**1. `noImplicitThis`** — usually a handful of errors, all in old callbacks.",
        "**2. `alwaysStrict`** — emits `\"use strict\"`; nearly always already true in modules.",
        "**3. `noImplicitAny`** — the big one for annotation volume, but every error is mechanical: name a type. Do this before `strictNullChecks`, because typing parameters first makes the null errors far more accurate.",
        "**4. `strictNullChecks`** — the highest-value flag and the one that finds real bugs. Expect the largest error count and the most thought per error.",
        "**5. `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`** — small counts, usually confined to classes and event handlers.",
        "**6. `useUnknownInCatchVariables`** — mechanical, and covered in lesson 3.",
        "Then the extras outside `strict` that are worth having: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.",
      ],
      examples: [
        {
          id: "strict-family",
          title: "Enabling them one at a time",
          lang: "javascript",
          code: `{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,

    // \`strict\` stays off while its members are enabled individually.
    "strict": false,

    "noImplicitThis": true,          // step 1  — done
    "alwaysStrict": true,            // step 2  — done
    "noImplicitAny": true,           // step 3  — done
    "strictNullChecks": true,        // step 4  — in progress
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "useUnknownInCatchVariables": true,

    "skipLibCheck": true
  }
}

// When every member is on, replace the list with "strict": true —
// which also opts you in to anything a future TypeScript release adds.`,
          explanation:
            "Counting errors before committing to a flag takes seconds and makes the work plannable: `npx tsc --noEmit --strictNullChecks | wc -l`. Do that for each flag and tackle them in ascending order of count, which is usually close to the order above.",
        },
      ],
      pitfalls: [
        {
          title: "`strictNullChecks` cannot be enabled per-file",
          body: "Unlike `checkJs`, there is no comment that turns strict null checking on for one file. It is all or nothing for the whole project, which is why it is the flag that needs planning rather than a ratchet. The usual approach is a dedicated effort — count the errors, fix them in batches by directory, and merge frequently so nothing drifts.",
        },
      ],
    },
    {
      id: "any-vs-unknown",
      heading: "Why `any` spreads and `unknown` does not",
      body: [
        "`any` disables checking for the value **and everything derived from it**. Read a property of an `any` and you get `any`. Call it and the result is `any`. Pass it into a typed function and no check happens. One `any` at an API boundary can silently untype an entire feature, and nothing reports it.",
        "`unknown` is the safe counterpart: it accepts any value, but you can do nothing with it until you narrow it. The check happens once, at the boundary, and everything downstream is properly typed.",
        "**The rule: use `unknown` at every boundary where data arrives from outside** — JSON, `localStorage`, `postMessage`, third-party callbacks — and narrow it there.",
      ],
      examples: [
        {
          id: "any-contagion",
          title: "The same data, two ways",
          ts: `// any: nothing below this line is checked, and nothing warns you.
const data: any = JSON.parse(raw);
const name = data.user.naem;          // typo — no error
sendEmail(data.user.email);           // wrong type? no error
const count: number = data.total;     // a string? no error

// unknown: one check, then real types all the way down.
const parsed: unknown = JSON.parse(raw);

function isUser(value: unknown): value is { name: string; email: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as Record<string, unknown>).name === "string" &&
    "email" in value &&
    typeof (value as Record<string, unknown>).email === "string"
  );
}

if (isUser(parsed)) {
  sendEmail(parsed.email);            // typed
  // parsed.naem                      -> Error: Property 'naem' does not exist
}

// In practice, a schema library writes the guard and infers the type:
//   const User = z.object({ name: z.string(), email: z.string().email() });
//   const user = User.parse(JSON.parse(raw));   // typed AND validated`,
          explanation:
            "The four `any` lines are all bugs and all compile. That is the argument for `unknown` in one screen. Writing type guards by hand gets tedious fast, which is why a schema library is worth the dependency at any real boundary — it gives you the runtime check and the static type from one declaration, and they cannot drift apart.",
        },
        {
          id: "finding-any",
          title: "Finding the `any` you already have",
          lang: "bash",
          code: `# Explicit annotations and casts.
grep -rn ": any\\b\\|as any\\|<any>" src | wc -l

# Suppressions.
grep -rn "@ts-ignore\\|@ts-expect-error" src | wc -l

# Implicit any that inference produced — the ones grep cannot see.
npx tsc --noEmit --noImplicitAny 2>&1 | grep -c "TS7006\\|TS7031\\|TS7053"

# Lint rules that stop new ones arriving:
#   @typescript-eslint/no-explicit-any
#   @typescript-eslint/no-unsafe-assignment
#   @typescript-eslint/no-unsafe-member-access
#   @typescript-eslint/no-unsafe-call`,
          explanation:
            "The `no-unsafe-*` rules are the valuable ones and are usually skipped because they need type-aware linting. They catch the *implicit* spread — the property access on an `any` that grep will never find — which is exactly the invisible part of the problem.",
        },
      ],
    },
    {
      id: "ratchet",
      heading: "Ratcheting by directory",
      body: [
        "Some flags cannot be enabled per file, but they can be enabled per **project** — and a codebase can contain several. Nested `tsconfig` files let a converted directory run strict while the rest catches up.",
        "The essential property of a ratchet is that it only turns one way. A stricter setting, once enabled, is enforced in CI, so the codebase cannot slip back while nobody is looking.",
      ],
      examples: [
        {
          id: "nested-tsconfig",
          title: "Strict where you have earned it",
          lang: "javascript",
          code: `// tsconfig.json — the lenient base for the whole repo
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": true
  },
  "include": ["src"],
  "exclude": ["src/features/checkout"]     // handled by its own config
}

// src/features/checkout/tsconfig.json — fully converted, fully strict
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "checkJs": true
  },
  "include": ["."]
}

// package.json
//   "typecheck": "tsc --noEmit && tsc --noEmit -p src/features/checkout"`,
          explanation:
            "Both run in CI, so the strict directory cannot regress and the lenient one cannot get worse. As each feature is converted it gets its own config, and when the last one is done the base config becomes strict and every child config can be deleted. The migration finishes by subtraction, which is a good sign it was structured correctly.",
        },
      ],
    },
    {
      id: "what-to-skip",
      heading: "What not to bother with",
      body: [
        "Not every strictness knob repays its cost, and a migration that chases all of them stalls on the least valuable ones.",
        "**Typing every intermediate variable.** Inference is good; annotate boundaries — function parameters, return types of exported functions, and data crossing a module edge — and let the rest infer. Annotations inside a function body mostly add noise and drift.",
        "**Eliminating every `any` before shipping.** A documented, searchable `any` at a genuinely awkward boundary is fine. An `any` nobody knows about is not. The difference is a comment and a tracking count.",
        "**`exactOptionalPropertyTypes` early.** It is correct — it distinguishes \"absent\" from \"present and undefined\" — and it produces a surprising amount of churn in code that spreads objects. Leave it until the rest is done.",
        "**Perfect types for a module you are about to delete.** Check the roadmap before typing something carefully.",
        "The judgement to hold on to: types exist to prevent bugs and make change safe. A type that does neither is a cost, and TypeScript is expressive enough that it is entirely possible to spend a week on types that no one benefits from.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between allowJs, checkJs and `// @ts-check`?",
      answer:
        "`allowJs` includes `.js` files in the program so imports resolve and the editor understands them, but checks nothing. `checkJs` type-checks every included `.js` file. `// @ts-check` is a per-file comment that opts one file in regardless of the flag — which is what makes incremental adoption practical, because you can leave `checkJs` off and turn files on one at a time.",
    },
    {
      question: "Can you type JavaScript without converting it?",
      answer:
        "Yes. TypeScript understands JSDoc as fully as its own syntax, so a `.js` file with `// @ts-check` and JSDoc annotations gets real inference, real errors and full editor support. `import(\"./types\").Foo` even lets it use types declared in `.ts` files. The cost is verbosity — generics in JSDoc get unpleasant — but no file is renamed and no build changes.",
    },
    {
      question: "In what order would you enable the strict flags, and why?",
      answer:
        "Cheapest first: `noImplicitThis` and `alwaysStrict`, then `noImplicitAny`, then `strictNullChecks`, then the smaller ones. `noImplicitAny` goes before `strictNullChecks` because typed parameters make the null errors far more accurate — doing it the other way round means fixing some of them twice. Count the errors per flag with `tsc --noEmit --<flag>` before committing to one.",
    },
    {
      question: "Why is `unknown` better than `any` at a boundary?",
      answer:
        "`any` disables checking for the value and everything derived from it, so one `any` can silently untype a whole feature with no warning. `unknown` accepts anything but permits nothing until you narrow it, so the check happens once at the boundary and everything downstream is properly typed. In practice a schema library is better still, because it produces the runtime validation and the static type from one declaration.",
    },
    {
      question: "How do you apply strictness to part of a codebase?",
      answer:
        "Flags like `strictNullChecks` cannot be set per file, but they can be set per project. A nested `tsconfig.json` that extends the base and turns on `strict` lets a converted directory run strict while the rest catches up, with both configs checked in CI so neither can regress. When the last directory is converted, the base becomes strict and the child configs are deleted.",
    },
  ],
  takeaways: [
    "`allowJs` includes JavaScript, `checkJs` checks it, and `// @ts-check` overrides the flag for one file",
    "JSDoc with `@ts-check` gives real type checking with no renames — and `/** @type {X} */ (expr)` needs its parentheses",
    "Enable strict flags individually, cheapest first, and put `noImplicitAny` before `strictNullChecks`",
    "`strictNullChecks` cannot be enabled per file, so it needs planning rather than a ratchet",
    "`any` is contagious — everything derived from it is unchecked, and grep cannot find the implicit spread",
    "`unknown` moves the check to the boundary; a schema library gives you the check and the type together",
    "Nested tsconfigs let converted directories run strict while the rest catches up, with both in CI",
    "Annotate boundaries and let bodies infer; a type that prevents no bug and enables no change is a cost",
  ],
  status: "available",
};
