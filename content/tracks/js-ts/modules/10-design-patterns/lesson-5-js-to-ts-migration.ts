import type { Lesson } from "@/content/types";

export const migrationLesson: Lesson = {
  id: "patterns-migration",
  slug: "js-to-ts-migration",
  moduleSlug: "design-patterns",
  title: "Migrating a JavaScript Project to TypeScript",
  summary:
    "A migration that ships continuously instead of stopping the world: get the build compiling on day one with nothing type-checked, then convert file by file, lowest-level first, with the compiler telling you where you are.",
  estimatedMinutes: 40,
  objectives: [
    "Set up a tsconfig that accepts an existing JavaScript codebase unchanged",
    "Order the conversion so each file's dependencies are already typed",
    "Convert a file without letting the diff sprawl",
    "Get types for untyped dependencies",
    "Handle the patterns that do not translate directly",
    "Measure progress so the migration does not stall at 60%",
  ],
  sections: [
    {
      id: "principles",
      heading: "Two rules that decide whether this succeeds",
      body: [
        "**Never stop shipping.** A migration branch that runs for three months will be abandoned, because it accumulates conflicts faster than it converts files. Every step below leaves the codebase working, tested and deployable.",
        "**Never turn everything on at once.** Enabling `strict` on an untyped codebase produces thousands of errors, none of which are prioritised, and the team concludes TypeScript is not worth it. Turn on one flag at a time and fix its errors before the next.",
        "The shape that works: make TypeScript *compile* the project first while checking almost nothing, then tighten. Compiling is a build change; checking is a code change; doing them together makes both harder to review.",
      ],
    },
    {
      id: "step-1",
      heading: "Step 1 — install and compile, checking nothing",
      body: [
        "The goal of this step is a build that produces identical output and reports zero errors. It should be reviewable in one sitting and safe to merge immediately.",
      ],
      examples: [
        {
          id: "initial-tsconfig",
          title: "The starting tsconfig",
          lang: "bash",
          code: `npm install --save-dev typescript @types/node
npx tsc --init`,
        },
        {
          id: "tsconfig-permissive",
          title: "tsconfig.json — deliberately permissive",
          lang: "javascript",
          code: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],

    // The two that matter right now:
    "allowJs": true,      // compile .js files alongside .ts
    "checkJs": false,     // ...but do not type-check them yet

    // Everything off. These get turned on later, one at a time.
    "strict": false,
    "noImplicitAny": false,

    // Interop with the CommonJS world you are probably still in.
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // Do not let TypeScript take over the build yet.
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}`,
          explanation:
            "`allowJs: true` with `checkJs: false` is the whole trick: TypeScript now *understands* the project — module graph, editor navigation, autocomplete — while reporting nothing about it. `skipLibCheck` skips type-checking of `.d.ts` files in dependencies, which otherwise surfaces errors in code you cannot fix. `noEmit` leaves your existing bundler in charge; TypeScript is only a checker for now.",
        },
        {
          id: "ci-step",
          title: "Add it to CI immediately",
          lang: "bash",
          code: `# package.json
#   "scripts": { "typecheck": "tsc --noEmit" }

npm run typecheck   # must pass, and must keep passing`,
          explanation:
            "Wiring this into CI on day one is what stops regression. From here the error count only ever goes down, because a pull request that raises it fails. Without that gate, a migration loses ground on Fridays.",
        },
      ],
    },
    {
      id: "step-2",
      heading: "Step 2 — choose an order",
      body: [
        "Convert **from the leaves inward**: files with the fewest dependencies first, then the files that depend on them. Converting a component before the module it imports means typing the same values twice — once as a guess, once properly.",
        "A workable order for most codebases: **constants and enums**, then **pure utilities**, then **types and models** (often a new file rather than a conversion), then **API and data-access**, then **state**, then **components**, and **entry points last**.",
        "Do not convert tests early. A test suite in TypeScript checking untyped source produces friction with no benefit; convert a module's tests just after the module.",
      ],
      examples: [
        {
          id: "find-leaves",
          title: "Finding the leaves",
          lang: "bash",
          code: `# List files by how many things they import — fewest first.
npx madge --summary src

# Anything imported by many files is high-value: typing it once
# improves inference everywhere it is used.
npx madge --summary --reverse src

# And the cycles, which are worth breaking before you convert them.
npx madge --circular --extensions js,ts src`,
          explanation:
            "The reverse summary is the one that matters for sequencing. A `formatMoney` helper imported by forty files is worth typing on day two, because every one of those forty files gets better inference for free once it is done.",
        },
      ],
    },
    {
      id: "step-3",
      heading: "Step 3 — convert a file",
      body: [
        "Rename `.js` to `.ts` (or `.tsx` if it contains JSX) and fix what appears. Keep the diff to *types only*: resist refactoring at the same time, because a diff that both converts and restructures cannot be reviewed for either.",
        "Errors arrive in a predictable order, and there are only about five kinds.",
      ],
      examples: [
        {
          id: "conversion-errors",
          title: "The five errors you will actually see",
          ts: `// 1. TS7006 — implicit any on a parameter. Annotate it.
function greet(name) { … }
function greet(name: string) { … }

// 2. TS2339 — property does not exist. The object needs a type.
const config = {};
config.retries = 3;              // Property 'retries' does not exist on type '{}'
const config: { retries?: number } = {};

// 3. TS18047 / TS2531 — possibly null, once strictNullChecks is on.
const el = document.querySelector(".x");
el.textContent = "y";            // 'el' is possibly 'null'
el?.setAttribute("data-x", "1"); // or narrow it properly

// 4. TS2345 — argument type mismatch. Usually a real bug the JS was hiding.
send(userId);                    // string passed where number expected

// 5. TS7053 — implicit any from an index expression.
const value = lookup[key];       // No index signature on type '…'
const value = lookup[key as keyof typeof lookup];`,
          explanation:
            "Category 4 is the one worth watching for. A meaningful fraction of the errors a first conversion produces are genuine defects that JavaScript was coercing past — a number passed as a string, a field that is sometimes absent. Those are the payoff, and they are worth writing down as you find them.",
        },
        {
          id: "escape-hatches",
          title: "Escape hatches, ranked",
          ts: `// Best: model it honestly, even loosely.
interface LegacyConfig {
  retries?: number;
  [key: string]: unknown;      // an index signature is honest about the rest
}

// Acceptable during migration: \`unknown\` forces a check at the point of use.
function handle(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "id" in payload) { … }
}

// Tolerable, if it is deliberate and searchable:
// TODO(migration): type this once the API contract is documented
const legacy = thing as any;

// Worst: silencing without a reason.
// @ts-ignore
const broken = thing.nope;

// If you must suppress, prefer this one — it errors when it becomes unnecessary,
// so suppressions cannot outlive the problem.
// @ts-expect-error the vendor SDK's types are wrong; see issue #412`,
          explanation:
            "**`@ts-expect-error` over `@ts-ignore`, always.** They suppress identically, but `@ts-expect-error` becomes an error itself once the underlying problem is fixed — so it cleans itself up instead of hiding a real error introduced later on the same line.",
        },
      ],
      pitfalls: [
        {
          title: "Do not convert and refactor in the same commit",
          body: "A migration diff should be readable as \"the same code, now typed\". Mixing in a rename, an extraction or a behaviour change makes it impossible to tell whether the types are right or the logic moved, and it makes reverting a bad conversion impossible without also reverting the improvement. Convert, merge, then refactor with the types helping you.",
        },
      ],
    },
    {
      id: "step-4",
      heading: "Step 4 — types for dependencies",
      body: [
        "A converted file importing an untyped package produces `TS7016: Could not find a declaration file`. There are four routes, in order of preference.",
        "**Check whether the package ships types.** Most modern ones do. Look for a `types` or `exports` entry in its `package.json`.",
        "**Install `@types/<name>`** from DefinitelyTyped. Note the scoped-package mangling from module 7: `@acme/utils` becomes `@types/acme__utils`.",
        "**Write a minimal declaration** yourself, covering only what you use.",
        "**Declare the module as `any`**, as a last resort — one line, and it silences everything about that package.",
      ],
      examples: [
        {
          id: "declaring-modules",
          title: "Your own declarations",
          ts: `// types/legacy-chart.d.ts

// Minimal but honest: type the three things you actually call.
declare module "legacy-chart" {
  export interface ChartOptions {
    width?: number;
    height?: number;
    data: Array<{ label: string; value: number }>;
  }

  export function render(element: HTMLElement, options: ChartOptions): void;
  export function destroy(element: HTMLElement): void;
}

// Last resort — everything from this package becomes \`any\`.
declare module "ancient-jquery-plugin";

// Non-code imports your bundler handles but TypeScript does not know about:
declare module "*.svg" {
  const url: string;
  export default url;
}
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}`,
          explanation:
            "Make sure the `types/` directory is inside `include`, or the declarations are simply not loaded — which produces the confusing situation where the file plainly exists and the error persists. Typing only what you call is the right amount: a complete declaration for a package you use three functions from is wasted work that will drift.",
        },
      ],
    },
    {
      id: "patterns",
      heading: "Patterns that do not translate directly",
      body: [
        "A few JavaScript idioms need a specific TypeScript answer, and hitting them without knowing it costs an afternoon each.",
      ],
      examples: [
        {
          id: "tricky-patterns",
          title: "The four that come up every time",
          ts: `// 1. Adding a property to \`window\` or \`globalThis\`.
declare global {
  interface Window {
    dataLayer?: unknown[];
    __APP_CONFIG__?: { apiUrl: string };
  }
}
export {};   // \`declare global\` is only legal in a module

// 2. Dynamic property access on an object literal.
const handlers = { save, load, reset };
type HandlerName = keyof typeof handlers;

function run(name: HandlerName) {
  handlers[name]();          // no index-signature error
}

// 3. Functions with several call shapes — overloads, not a union parameter.
function parse(input: string): object;
function parse(input: string, asText: true): string;
function parse(input: string, asText?: boolean): object | string {
  return asText ? input : JSON.parse(input);
}

// 4. \`this\` in a callback: declare it as the first parameter.
//    It is erased at compile time and is not a real argument.
function handler(this: HTMLButtonElement, event: MouseEvent): void {
  console.log(this.disabled);
}`,
          explanation:
            "Number 2 is by far the most common. `handlers[someString]()` fails because a string is not known to be a key; `keyof typeof handlers` gives you the exact union of valid names, and as a bonus every call site now gets autocomplete and a compile error on a typo.",
        },
      ],
    },
    {
      id: "measuring",
      heading: "Measuring, so it finishes",
      body: [
        "Migrations stall at around two-thirds, when the easy files are done and what remains is the code nobody wants to touch. Two things prevent that: a number that goes down, and a rule that stops it going up.",
        "**Count what is left**, publish it, and make it visible in the pull request template. **Require new files to be TypeScript** — a lint rule or a CI check that fails on a new `.js` under `src/`. That single rule is what makes the finish line reachable, because the denominator stops growing.",
      ],
      examples: [
        {
          id: "measuring-progress",
          title: "Two commands and one rule",
          lang: "bash",
          code: `# How much is left?
echo "js:  $(find src -name '*.js'  -o -name '*.jsx' | wc -l)"
echo "ts:  $(find src -name '*.ts'  -o -name '*.tsx' | wc -l)"

# How much is typed in name only?
grep -rn ": any\\b\\|as any\\|@ts-ignore\\|@ts-expect-error" src | wc -l

# Fail CI on a new JavaScript file:
if git diff --name-only origin/main... | grep -qE '^src/.*\\.jsx?$'; then
  echo "New .js files are not allowed — write .ts"; exit 1
fi`,
          explanation:
            "The second command is the honest one. A codebase can be 100% `.ts` and barely typed at all if the conversion was done with `any`, and that number is the difference between a migration that finished and one that stopped. Track both, and treat a rising `any` count the same way you would treat a rising error count.",
        },
      ],
      pitfalls: [
        {
          title: "The last 10% is where the value is",
          body: "The files that resist conversion are usually the oldest, most-depended-on and least-understood — which is exactly where the bugs are. It is tempting to declare victory at 90% and leave them, but those files are the reason the migration was worth doing. Budget for them explicitly rather than letting them become permanent.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you start migrating a large JavaScript codebase to TypeScript?",
      answer:
        "Add TypeScript with `allowJs: true` and `checkJs: false`, `strict` off, and `noEmit` so the existing bundler stays in charge. That compiles the project on day one with zero errors and gives the whole team editor support immediately. Wire `tsc --noEmit` into CI at that point, so the error count can only go down, then convert file by file from the leaves inward.",
    },
    {
      question: "In what order should files be converted, and why?",
      answer:
        "Leaves first — constants, pure utilities, then models, data access, state, components, entry points last. Converting a file before its dependencies means inventing types for values that will be typed properly later, so the work is done twice. Files imported by many others are the highest value, because typing them once improves inference everywhere they are used.",
    },
    {
      question: "What is the difference between `@ts-ignore` and `@ts-expect-error`?",
      answer:
        "They suppress identically, but `@ts-expect-error` becomes an error itself if the line stops having an error. That means it cleans itself up when the underlying problem is fixed, and it cannot silently hide a *new* error introduced on that line later. Always prefer it, and put the reason in the comment.",
    },
    {
      question: "How do you handle a dependency with no type declarations?",
      answer:
        "Check whether it ships its own types, then look for `@types/<name>` on DefinitelyTyped — remembering that scoped packages are mangled, so `@acme/utils` becomes `@types/acme__utils`. Otherwise write a `declare module` covering only the parts you use, which is usually a dozen lines. `declare module \"name\";` with no body types the whole package as `any` and is the last resort.",
    },
    {
      question: "How do you keep a migration from stalling?",
      answer:
        "Make the remaining count visible, and stop the denominator growing with a CI rule that rejects new `.js` files under `src`. Track the number of `any`, `as any` and suppressions alongside the file count, because a codebase can be fully `.ts` and barely typed. Budget explicitly for the last stretch, which is the oldest and least-understood code and therefore where most of the value is.",
    },
  ],
  takeaways: [
    "Never stop shipping and never enable everything at once — the two rules that decide whether a migration finishes",
    "`allowJs: true` with `checkJs: false` compiles the project on day one with zero errors and full editor support",
    "Put `tsc --noEmit` in CI immediately, so the error count can only fall",
    "Convert from the leaves inward, and type widely-imported files early for the inference payoff",
    "Keep conversion diffs to types only — never convert and refactor in one commit",
    "A real share of first-conversion errors are genuine bugs JavaScript was coercing past",
    "`@ts-expect-error` over `@ts-ignore`, because it errors once it is no longer needed",
    "`keyof typeof` solves dynamic property access; `declare global` needs the file to be a module",
    "Track `any` and suppressions alongside file counts — full `.ts` is not the same as typed",
  ],
  status: "available",
};
