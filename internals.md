# DevKernel internals

In-depth documentation of how DevKernel is built. For setup, scripts and a tour of the site, see [README.md](README.md).

This document is organised by subsystem rather than by directory, because the interesting boundaries in this codebase do not line up with folders — the practice console alone spans `content/practice`, `lib/judge`, `lib/runtimes`, `public/judge` and `components/practice`.

---

## Contents

1. [Design rules](#1-design-rules)
2. [Stack and configuration](#2-stack-and-configuration)
3. [The content data model](#3-the-content-data-model)
4. [Routing and rendering](#4-routing-and-rendering)
5. [The lesson rendering pipeline](#5-the-lesson-rendering-pipeline)
6. [In-browser execution: three engines](#6-in-browser-execution-three-engines)
7. [`lib/runtimes` — the interpreters](#7-libruntimes--the-interpreters)
8. [The x86-64 assembler and emulator](#8-the-x86-64-assembler-and-emulator)
9. [The practice judge](#9-the-practice-judge)
10. [Visualisations](#10-visualisations)
11. [Client state and persistence](#11-client-state-and-persistence)
12. [Analytics](#12-analytics)
13. [Styling and theming](#13-styling-and-theming)
14. [The asset pipeline](#14-the-asset-pipeline)
15. [Verification gates](#15-verification-gates)
16. [Known rough edges](#16-known-rough-edges)
17. [File map](#17-file-map)

---

## 1. Design rules

Five rules explain most of the decisions below. They are stated here once so the rest of the document can refer to them.

**R1 — Nothing on the page is remembered, everything is run.** No `output` field in a lesson is written by hand. No visualisation frame is drawn by hand. Both are enforced by CI, not by discipline.

**R2 — Content is data, not markup.** The curriculum is TypeScript objects. That is what lets a script walk it, a type error catch a typo in a pattern id, and the lesson counts on the home page be derived rather than maintained.

**R3 — A wrong answer must never be reported as the learner's fault.** The compiled-language runtimes are interpreters written for this site, not real toolchains. When one meets something it does not implement it reports `unsupported` and names what was missing. Reporting that as a failed test case would tell somebody their correct solution is wrong, and the console stops being trustworthy the first time it does.

**R4 — One place decides correctness.** Runtimes report what a function returned or what it threw. They never compare. Comparison happens once, in TypeScript, in `lib/judge/compare.ts`, so "correct" means the same thing in Python as in Rust.

**R5 — Everything runs in the visitor's browser.** There is no execution backend. That is a security posture (no untrusted code on a server), a cost posture (static hosting), and a constraint that shapes sections 6 through 8.

---

## 2. Stack and configuration

| Concern | Choice |
| --- | --- |
| Framework | Next.js `16.3.0`, App Router |
| React | `19.2.8` |
| Language | TypeScript 5, `strict: true`, `noEmit`, `moduleResolution: "bundler"`, path alias `@/*` → `./*` |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, configured in CSS rather than a config file |
| Syntax highlighting | Shiki 4, **server-side only** |
| Editors | Monaco 0.56 via `@monaco-editor/react` |
| Python | Pyodide 314 (CPython 3.14 compiled to WebAssembly) |
| Icons | `lucide-react` |
| Theme | `next-themes`, class strategy, system default |
| Fonts | Geist and Geist Mono via `next/font/google` |
| Analytics | `posthog-js`, opt-in, same-origin proxied |
| Linting | ESLint 9 flat config |

### `next.config.ts`

The only non-default configuration is a pair of rewrites that proxy PostHog:

```
/ingest/static/:path*  →  https://us-assets.i.posthog.com/static/:path*
/ingest/:path*         →  https://us.i.posthog.com/:path*
```

The asset host is derived from the ingest host by string substitution (`://us.i.` → `://us-assets.i.`, same for `eu`), and both `next.config.ts` and `instrumentation-client.ts` read `NEXT_PUBLIC_POSTHOG_HOST`, so the proxy and the SDK cannot disagree about which region events are going to.

### `tsconfig.json`

Notable: `include` covers `**/*.mts` as well as `.ts`/`.tsx`, and pulls in both `.next/types` and `.next/dev/types` — which is why `npm run verify` runs `next typegen` *before* `tsc`. Route-typed helpers such as `LayoutProps<"/">` in `app/layout.tsx` come from that generated output and will not resolve without it.

### `eslint.config.mjs`

Extends `eslint-config-next` core-web-vitals and typescript, then **restates** the default ignore list, because overriding `globalIgnores` replaces it rather than extending it. The two additions are `public/pyodide/**` and `public/monaco/**` — minified build output of pinned dependencies, copied in rather than authored here.

### `CMakeLists.txt`

A CMake project named `shapes` sits at the repository root. It declares a library from `src/circle.cpp` and `src/rectangle.cpp` and a `demo` executable from `src/main.cpp`. **None of those files exist in the repository** — it is a teaching fixture for the C++ build-tooling module rather than part of the site's build. See [Known rough edges](#16-known-rough-edges).

---

## 3. The content data model

Everything the site renders comes from `content/`, and `content/types.ts` is the contract.

### The hierarchy

```
Track ──< Module ──< Lesson ──< Section ──< CodeExample ──< CodeVariant
                                       └──< Pitfall
                                       └──  VisualSpec
                        └──< InterviewQuestion
```

**`TrackDefinition`** carries `id`, `slug`, `title`, `shortTitle` (badges and breadcrumbs), `tagline` (one line, on cards), `description` (a paragraph, on the track page), `order`, `status`, `accent`, `mode`, `lessonMinutes` as a `[min, max]` tuple, and three booleans' worth of policy:

- `mode: "learn" | "revise"` — whether the reader is meeting the language or getting it back. It decides the lesson budget and the copy on the track page.
- `interviewPrep: boolean` — whether the track carries interview questions. Rust, Go and Assembly set it false: they are here to build things with, and the room that would go to interview material goes to programs you compile and run.
- `runnable: boolean` — whether the playground can execute this track's code.

**`ModuleDefinition`** adds an optional `phase` — a stage grouping above the module level ("Module 1 · Non-linear DSA", "Electives · Advanced DSA"). `CurriculumMap` draws a divider whenever the phase changes, including on the first module. Tracks that declare no phases never draw one.

**`Lesson`** is `id`, `slug`, `moduleSlug`, `title`, `summary`, `estimatedMinutes`, optional `objectives`, an array of `sections`, optional `interviewQuestions` and `takeaways`, and a `status`.

**`Section`** is a heading plus any combination of `body` (paragraphs of markdown-lite prose), `examples`, one `visual`, and `pitfalls`.

### The two-status system

`ModuleStatus` is `"available" | "coming-soon"`, and it appears on both modules and lessons. The roadmap adds a **third** state of its own — `RoadmapStatus` is `"live" | "syllabus" | "planned"` — deliberately, because a syllabus that is settled is a real thing to have published: calling it "coming soon" hides how much of the decision-making is done, and calling it "available" would be a lie.

### `createComingSoonModule`

`content/comingSoon.ts` turns a settled syllabus into a real module. Given eight `topics`, it produces a module with exactly one lesson: `estimatedMinutes: 0`, one section explaining that the lessons are still being written, and the topics as `takeaways`. `LessonView` renders those under the heading "The topics it will cover" instead of "Key takeaways".

It mirrors the owning track's `interviewPrep` flag so a preview cannot promise interview questions the finished module will not carry.

This is why two different counts exist:

- `getTotalLessonCount()` — lessons with `status: "available"`, across every track. **518.**
- `getPlannedLessonCount(track)` — available lessons, plus one per *topic* in each coming-soon module. Summed across tracks: **1,543.**

### The registry — `content/tracks/index.ts`

Imports all twelve track definitions, runs each through `toTrack()`, and sorts by `order`. `toTrack` stamps `trackSlug` onto every module, so module files never repeat it and lookups never need both halves.

The registry is also the entire query API:

| Function | Returns |
| --- | --- |
| `getTracksByMode(mode)` | Tracks filtered to `learn` or `revise` |
| `getTrackBySlug` / `getModule` / `getLesson` | Single-entity lookups |
| `getTrackLessons(track)` | Flattened lesson list, module order preserved |
| `getAllLessonRefs()` | Every `{trackSlug, moduleSlug, lessonSlug}` — feeds `generateStaticParams` |
| `getAdjacentLessons(...)` | Previous/next **within a track**; the last lesson of a track has no next |
| `getTrackStats(track)` | Available lessons, available modules, total modules, summed minutes |
| `getPlannedLessonCount(track)` | See above |
| `getTotalLessonCount()` | Live lessons everywhere |
| `lessonHref` / `trackHref` | URL builders |
| `lessonBudgetLabel(track)` | `"25–45 min per lesson"`, with an en dash |

`defaultTrack` is `tracks[0]` — where "start learning" goes when no track has been chosen, and what `SidebarNav` falls back to off a lesson route.

### `content/roadmap.ts`

A layer above tracks, answering the two questions a visitor actually arrives with: *where do I start* and *how long until I can do something*. Neither has a good answer on a page that opens with a list of twelve tracks.

`ROADMAP_MODULES` describes Modules 0–4 plus electives. Each entry names the `trackSlugs` that carry it and, optionally, the `phases` within those tracks — so `getRoadmapModuleStats()` derives its counts from the real curriculum and cannot drift away from it. Entries also carry an optional `gaps` array, which is used to state honestly what a module does *not* yet cover.

`FIRST_MONTH` is four `RoadmapWeek` objects, each with separate `beginner` and `experienced` tracks and a single `outcome` sentence.

### The practice model — `content/practice/`

A problem is deliberately **not** a statement plus an answer:

```ts
Problem {
  id, slug, title, difficulty, topics[], patterns[], companies[]
  prompt        // one line, plain words
  statement[]   // paragraphs
  constraints[]
  examples[]    // input / output / optional explanation
  signals[]     // ← the reading: what in the statement implies which pattern
  approaches[]  // ← ordered worst to best; the first is always a brute force
  judge?        // signature + test cases for the in-browser console
  followUps?
  related[]     // "same idea, different hat"
}
```

`signals` and the ordering of `approaches` are the opinionated part. Storing only the optimal solution would teach the thing that cannot be taught — how to have the clever idea — and skip the thing that can be: how to get from a brute force you already believe to a solution you can defend.

Each `Approach` carries a `tier` (`brute-force` | `better` | `optimal`), an `intuition` array phrased in the order you would actually have the thoughts, an optional `walkthrough`, `time` and `space` with the variable named, `java` and `python` source, and a `verdict` explaining why you move on — or, for the optimal one, why you stop.

**Topics and patterns are different axes**, on purpose. A topic is *where a problem lives*; a pattern is *how you solve it*. "Two Sum" is filed under arrays and hashing, but the transferable lesson is the `hashing-for-lookup` pattern, which also solves problems filed under strings and trees. Filter by topic when working through a syllabus; filter by pattern when drilling a weakness.

`PatternId`, `TopicId` and `Company` are **curated string unions rather than free text**. A typo in a problem file is then a build error instead of a filter chip that silently matches nothing, and "Amazon" and "amazon" cannot become two chips. Current sizes: 33 pattern ids (17 have full `Pattern` entries in `patterns.ts`), 16 topics, 22 companies.

A `Pattern` carries `triggers` (how a statement announces the pattern), an `invariant` (the property maintained at every step — "being able to state this is the difference between having memorised a template and understanding it"), a Java and Python `template`, complexities, and `breaks`: where it looks applicable and is not.

### Facets and the summary projection

`ProblemSummary` is `Pick<Problem, "slug" | "title" | "prompt" | "difficulty" | "topics" | "patterns" | "companies">`. The list page projects down to it before handing anything to the client, because a full `Problem` carries several kilobytes of Java, Python and prose per approach and shipping all of that to render a table of rows would be absurd.

`buildFacets()` derives filter options by tallying the problems themselves, so a company or pattern can never appear as a chip that matches nothing. Filtering semantics: **OR within a facet, AND across facets** — Easy *or* Medium, *and* tagged hashing. Free text matches title and prompt only.

`ProblemSort` offers `recommended` (array order — the curated solving order), `difficulty-asc`, `difficulty-desc` and `title`. Every branch copies before sorting.

---

## 4. Routing and rendering

### Static enumeration

Three dynamic route segments exist, and all three do the same two things:

```ts
export const dynamicParams = false;
export function generateStaticParams() { /* every known slug */ }
```

The `dynamicParams = false` is not decoration. Each of these routes has a sibling `loading.tsx`, which makes the response stream — and a streamed response **has already committed a 200** by the time `notFound()` runs inside the page. Refusing unknown params at the routing layer is what keeps the status code honest.

| Route | Params from |
| --- | --- |
| `/curriculum/[trackSlug]` | `tracks.map(t => ({ trackSlug: t.slug }))` |
| `/learn/[trackSlug]/[moduleSlug]/[lessonSlug]` | `getAllLessonRefs()` |
| `/practice/[problemSlug]` | `PROBLEMS.map(p => ({ problemSlug: p.slug }))` |

Every route also exports `generateMetadata` (or a static `metadata`), producing per-lesson titles of the form `"<lesson> — <trackShortTitle> — DevKernel"` with the lesson summary as description.

### The lesson shell is a layout, not a page

`app/learn/[trackSlug]/layout.tsx` is three lines of JSX and one of the more consequential files in the repo:

```tsx
export default function TrackLayout({ children }) {
  return <LessonShell>{children}</LessonShell>;
}
```

A page is replaced on every navigation; a layout is not. With the shell inside the page, clicking a lesson unmounted the sidebar and mounted a new one — so its scroll position went back to the top and any module the reader had expanded collapsed again. As a layout, the `<aside>` is the same DOM node from one lesson to the next and simply keeps its scroll.

It sits under `[trackSlug]` so that switching *tracks* does rebuild it, which is right: the sidebar's contents change completely.

Two consequences land in `SidebarNav`:

- **Opening the current module** used to come free with remounting. It is now done explicitly, by comparing the route's module against a `seenModule` state value **during render** rather than in an effect — the documented way to react to a changed input. It adds the module to the open set without closing anything the reader opened.
- **Scrolling the active lesson into view** happens on first mount only; running it on every navigation would fight the scroll position the layout exists to preserve. It sets the scroll container's own `scrollTop` rather than calling `scrollIntoView`, because that method scrolls every scrollable ancestor including the document — measurably nudging the whole page down by a pixel on load.

`HeaderNav` uses the same render-phase adjustment to close the mobile menu on navigation: React re-runs the component immediately without painting the intermediate state, so the menu is already closed on the first frame of the new page, where an effect would close it one paint later as a visible flash.

### Server/client split

The default is server. Client components are the ones that genuinely need browser state:

| Client component | Why |
| --- | --- |
| `SidebarNav`, `HeaderNav`, `HeaderProgress`, `CurriculumMap` | `usePathname`, and localStorage-backed progress |
| `ExampleLanguagePicker` | Reads and writes the global language preference |
| `Visual`, `VisualPlayer` | Frames are generated in the browser; playback is state |
| `PlaygroundClient`, `PlaygroundEditor`, `ConsolePanel` | Editor and worker lifecycle |
| `SolveConsole`, `SolveEditor`, `SolveResults`, `ProblemWorkspace`, `ProblemBrowser` | Editor, judge, split panes, filters |
| `ThemeProvider`, `ThemeToggle` | `next-themes` |

The problem page is the clearest case of the split done deliberately. `app/practice/[problemSlug]/page.tsx` renders the top bar, the description, the signals and the approaches **on the server**, then hands them to `ProblemWorkspace` as slots. That keeps Shiki's highlighting and the whole content tree out of the browser bundle; the client half only decides which pane is how wide and which tab is showing.

Both Monaco-based editors are loaded with `next/dynamic` and `ssr: false`, with skeleton placeholders shaped like the code they are about to be replaced by.

---

## 5. The lesson rendering pipeline

`LessonView` → `SectionBlock` → (`Prose`, `ComparisonPanel`, `Visual`, `PitfallCallout`), then takeaways, interview questions, a completion button and previous/next links.

### Markdown-lite

`components/lesson/Prose.tsx` implements a deliberately tiny inline syntax: `**bold**`, `*italic*` and `` `code` ``. Content is authored as plain data, so this exists to allow minimal emphasis without opening the door to raw HTML injection.

The tokenizer is one regex:

```
/(\*\*(?=\S)[\s\S]*?[^\s*]\*\*|\*(?=\S)[^*]*[^\s*]\*|`[^`]+`)/g
```

Three properties are load-bearing:

- **Bold is tested before italic**, since a bold token also starts and ends with `*`.
- **Code never nests.** Asterisks and backticks inside a code span render literally. Bold and italic do nest, and may contain code.
- **A delimiter must hug non-whitespace** (`(?=\S)` on the opening side, `[^\s*]` before the closing side), so prose containing `2 * 3` or a trailing `yield*` is left alone rather than being paired up into spurious emphasis.

`Prose` renders an array of paragraphs; `ProseInline` renders a single string, and is used for objectives, takeaways, signals, follow-ups and example explanations.

### Syntax highlighting

`CodeBlock` is an **async server component**. It calls Shiki's `codeToHtml` with `themes: { light: "github-light", dark: "github-dark" }` and `defaultColor: false`, which emits both palettes as CSS variables (`--shiki-light`, `--shiki-dark`) on every token. `globals.css` then picks between them:

```css
.shiki, .shiki span      { color: var(--shiki-light); background-color: transparent !important; }
.dark .shiki, .dark .shiki span { color: var(--shiki-dark); }
```

The consequence is that **no highlighter ships to the browser**, and theme switching is a CSS class change rather than a re-highlight. `CodeLanguage` (19 members) maps to a display label and a badge colour class; config, schema and wire formats (`bash`, `xml`, `yaml`, `properties`, `sql`, `graphql`, `json`, `http`, `html`) stay neutral rather than competing for a colour with the Java on the same page.

### `ComparisonPanel` — three shapes of example

1. **Primary + `alternates`** → every variant is highlighted on the server and handed to `ExampleLanguagePicker` as finished markup. Switching language is a re-parent: no network, no highlighter, no re-render of the code.
2. **`js` and `ts` both set** → a two-column grid. Only the JS/TS track uses this.
3. **Anything else** → one block, plus the output panel and explanation.

Outputs and titles travel *with* the language. A variant may override either: `CodeVariant.output` when a language legitimately prints something different, and `CodeVariant.title` because most titles name a file — `db/schema.ts` in a TypeScript project is `db/schema.js` in a JavaScript one, and a heading that disagrees with the code under it is worse than no heading.

### The language picker

`EXAMPLE_LANGUAGES` (10 members) is an ordered tuple, and the picker **filters that list** rather than reading keys off the `blocks` object — object key order is insertion order, which here would be the order translations happen to sit in the content file, so every dropdown would sort differently.

The chosen language is stored **globally**, not per example: choosing Rust once should hold for the rest of the lesson and the next one. Two fallbacks make that survive contact with reality:

- `SAME_CHOICE` pairs `jsx ↔ javascript` and `tsx ↔ typescript`. To a reader those are one decision — "show me this project in JavaScript" — so choosing either member satisfies the other. Without it, picking TSX on a component would leave every non-component file in the same project showing JavaScript.
- If neither the choice nor its sibling is available, the example falls back to its own `primary`. A reader who picked Rust is shown Python rather than a blank panel.

### Handing code to the playground

`lib/playgroundHandoff.ts` maps every `CodeLanguage` to a `PlaygroundLanguage` or to `null`. The `null` entries are the languages with nowhere to go: `bash` blocks are commands to paste into a terminal, and the config/schema/wire formats are files that belong to a project on disk. Their blocks show no "open in playground" affordance at all.

The handoff itself is one `sessionStorage` key (`devkernel:playground-handoff`), written on click and **consumed** — read and removed — on the playground's first mount.

---

## 6. In-browser execution: three engines

Nothing leaves the browser. Which engine runs a language:

| Engine | Languages | Where it lives | Isolation |
| --- | --- | --- | --- |
| JavaScript worker | JavaScript, TypeScript, JSX/TSX | `lib/sandboxRunner.ts`, `public/judge/js-worker.js` | Web Worker |
| Pyodide | Python | `public/judge/python-worker.js`, `python-playground-worker.js` | Web Worker (module) |
| Tree-walking interpreters | C, C++, Go, Java, Rust | `lib/runtimes/` | Main thread in the playground; a bundled Worker in the judge |
| x86-64 emulator | Assembly | `lib/runtimes/asm.ts` | Main thread |

**Why a Worker rather than an iframe**, everywhere: a synchronous `while (true)` is the single most common thing to write while practising. On a worker thread it can always be force-terminated; in an iframe on the main thread it freezes the page and the Stop button with it.

### The JavaScript sandbox

`createSandboxWorker()` builds a worker from a `Blob` URL. The script it assembles is not just an eval harness — it includes a **~185-line React-compatible shim** so that JSX has something to compile against:

- `__createElement` and `Fragment` behave exactly as React's do: JSX compiled with the classic runtime calls them and gets back the same plain element objects, with `key` lifted out of props and `ref` dropped.
- `renderToString` is the playground's own six-line renderer, not `react-dom`. It handles void elements, `className`→`class` and `htmlFor`→`for`, style objects with a unitless-property table, and HTML escaping of both text and attribute values.
- **The hooks are defined only to fail.** `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useReducer`, `useId`, `useLayoutEffect` and `useTransition` each throw a sentence explaining that there is no reconciler here, so there is nowhere for state or effects to live — "call your component as a function, or use `renderToString(element)`". A `TypeError` would have been the alternative, and it explains nothing.
- A `require` shim resolves `"react"` and `react/jsx*` to the shim module and throws a readable error for anything else, because a worker has no module loader. `exports` and `module` are declared because TypeScript's emit references them whenever a file contains any import — even a type-only one that was erased.
- Console formatting is element-aware: `console.log(<App />)` prints a JSX-shaped tree rather than the `{"props":{}}` that `JSON.stringify` produces once it drops the functions.

`useSandbox` owns the lifecycle: one worker per run, terminated and replaced on the next, a **6-second watchdog** that reports a probable infinite loop, and a `show()` path that lets output produced elsewhere (the interpreters, Python) replace the console wholesale.

### TypeScript transpilation

`lib/transpile.ts` dynamically imports `typescript` — so it never lands in a bundle outside the playground and the judge — and calls `transpileModule`. Two details matter:

- **JSX is detected by regex**, conservatively: a fragment, a closing tag, or a self-closing tag. It has to be conservative because compiling as `.tsx` is not free — the angle-bracket type assertion `<string>value` and the bare generic arrow `<T>(x: T) => x` both stop parsing there. A false negative is harmless; the file compiles as `.ts` exactly as before.
- **The virtual filename is the switch.** TypeScript decides whether to parse JSX from the extension alone, so `transpile.ts` passes `playground.tsx` or `playground.ts` accordingly.

Compiler options are `target: ES2020`, `module: None`, `jsx: React` (classic). The automatic runtime is deliberately avoided: it emits an import of `react/jsx-runtime`, and `ModuleKind.None` turns imports into `require()` calls a Web Worker cannot satisfy. Diagnostics are collected with line numbers and shown as warnings — the code still runs, because a type error you can see beside a passing run teaches more than a refusal to run at all.

### Python

Two workers, because they answer different questions:

- `python-playground-worker.js` runs a whole file top to bottom with `runPythonAsync` and streams stdout/stderr.
- `python-worker.js` calls one named function once per test case (see [§9](#9-the-practice-judge)).

Both boot Pyodide with `indexURL: "/pyodide/"` and both give **each run a fresh namespace** — `pyodide.toPy({__name__: "__main__"})` in the playground, `pyodide.runPython("dict()")` in the judge — so a name left behind by a previous attempt cannot make broken code look like it works. The namespace is destroyed in a `finally`.

`lib/pythonPlayground.ts` keeps the worker alive between runs (booting CPython costs seconds and a download) but throws it away on timeout, since a hung interpreter is in an unknown state. Budgets: **60 s** for the first boot, **15 s** per run afterwards, tracked by a `booted` flag so the error message can distinguish "the program ran too long" from "CPython did not finish downloading in time".

### The playground's language table

`lib/playgroundLanguages.ts` holds, per language: Monaco id, Shiki id, conventional filename, starter program, a short `runtime` label for the toolbar and a longer `runtimeNote` tooltip. The starters are teaching artefacts in their own right — the Rust one demonstrates `mut`, the Assembly one is a bare `write`/`exit` syscall pair with the `$ - msg` length idiom explained inline, the C one shows `qsort` with a comparator and `sizeof`-based length.

Dropdown order is alphabetical across the general-purpose languages with **Assembly last**, because it is not a general-purpose choice: you open it to see what the machine does, not to solve a problem.

---

## 7. `lib/runtimes` — the interpreters

Roughly 7,900 lines — excluding the assembler in `asm.ts` — implementing C, C++, Go, Java and Rust well enough to run what these tracks teach. This is the largest and least obvious subsystem in the repo.

### The contract (`types.ts`)

```ts
RuntimeResult { lines: RuntimeLine[]; exitCode: number | null }
RuntimeLine   { level: "log" | "info" | "warn" | "error"; text: string }
```

Two error classes, and the distinction between them is the whole design:

- **`UnsupportedError`** — the runtime deliberately does not implement this. Thrown with a `what` and an optional line, formatted as `line 12: X is not supported by the browser runtime`.
- **`ProgramError`** — a genuine error in the user's program.

Rule R3 lives here: *anything not implemented must throw `UnsupportedError`, never return a plausible wrong answer.*

**`OutputSink`** collects output and enforces the two limits a runaway program cannot defeat:

| Limit | Default | Judge override |
| --- | --- | --- |
| `maxChars` | 200,000 | 20,000 |
| `maxSteps` | 20,000,000 | 4,000,000 per case |

`step(cost)` is called by the evaluator; exceeding the budget throws "execution stopped: step limit reached (this usually means an infinite loop)". `write()` splits on newlines the way a terminal would and buffers a trailing partial line until `flush()`.

### Shared machinery (`lang.ts`, ~1,700 lines)

A lexer, a common AST, a Pratt expression parser and a tree-walking evaluator. Rust, C++ and Java differ far more in declaration syntax and standard library than in expressions, so expressions and evaluation are shared and each language supplies a **dialect** plus a table of builtins.

The lexer handles a multi-character punctuation table (longest match first: `..=`, `<<=`, `->`, `=>`, `::`, `:=`, `<-`, …), string/char escapes including `\u{...}`, numeric literals with `float` and `suffix` metadata (`u8`, `f64`), and object-like `#define` macros substituted after the whole file is read.

**Integers carry width and signedness.** That is what lets overflow behave the way each language says it does: Rust panics, C++ and Java wrap. `int(value, bits, signed)` is the constructor, and `limits` supplies the ranges.

### The parser (`parser.ts`, ~2,400 lines)

One parser, four dialects (`rust | cpp | java | go`). Binding powers for the shared Pratt loop:

```
|| 1 · && 2 · | 3 · ^ 4 · & 5 · ==/!= 6 · </<=/>/>= 7 · <</>> 8 · +/- 9 · */ /% 10
```

**Go earns a special case.** Its expressions reuse the Pratt parser, but the type follows the name, one keyword spells four kinds of loop, assignment has a declaring form (`:=`), and there are no semicolons at all. The last one is handled *before* parsing, by `goSemicolons`, which inserts them so the statement parser can still assume they exist.

`CLIKE_SPECIFIERS` — `const`, `constexpr`, `consteval`, `constinit`, `static`, `inline`, `mutable`, `volatile`, `final` — are skipped as noise, because they change compile-time or storage semantics rather than the value produced, and skipping them lets `constexpr int n = 4;` parse as the declaration it is. **`extern` and `register` are deliberately absent** from that set: both change what a declaration *means*, so a program using them fails loudly rather than running with the qualifier quietly dropped.

### Dialects and formatting

`dialects.ts` supplies value formatting, standard-library builtins and the entry points `runRust`, `runCpp`, `runJava`, `runC`, `runGo`. Formatting is per-language because **the same double prints three different ways**: Rust's `{}` gives `1`, C++'s `<<` gives `1` but truncates to six significant digits, and Java's `println` gives `1.0`. Getting this wrong would quietly teach the wrong thing.

`stdlib.ts` holds what every language shares — sorting, comparators, bounds checks, and the collection operations each dialect exposes under a different name — so adding a language means writing a table of names rather than another heap. `sortInPlace` relies on `Array.prototype.sort` being specified as stable, which matters because `Arrays.sort` on objects, `Collections.sort` and `std::stable_sort` all promise stability.

**`cdialect.ts` — two visible decisions:**

- **Pointers are arrays.** There is no address space, so `int *p` holds a sequence and `p[i]` indexes it. That covers what C is used for here — arrays, strings, `malloc` buffers — and stops short of pointer arithmetic across objects, which fails loudly rather than guessing.
- **`sizeof` tells the truth.** It returns real byte sizes, so `sizeof(int)` is 4 and `malloc(n * sizeof(int))` allocates four times the slots the program will use. Wasting slots costs nothing and keeps `printf("%zu", sizeof(int))` honest; pretending every type is one byte wide would not.

**`godialect.ts` — three observable behaviours, documented because a program can see them:**

- **`fmt` sorts map keys.** Printing a map gives `map[a:1 b:2]` in key order, which real Go has done since 1.12 for reproducibility.
- **`range` over a map is insertion-ordered here**, where Go deliberately randomises it. This is the one divergence that could hide a bug — a program depending on map order is wrong in Go and will look right here. A seeded shuffle would trade a hidden bug for a flaky one, so the lessons teach the rule instead.
- **`append` mutates its argument.** Go's own aliasing after `append` is unspecified (it depends on spare capacity), so no correct program may rely on it either way; growing in place keeps `xs = append(xs, v)` linear rather than quadratic.

Go float formatting reimplements `strconv.FormatFloat(v, 'g', -1, 64)`: shortest round-tripping decimal, switching to an exponent outside `1e-4 .. 1e21`. JavaScript's own `String` switches at `1e-7`, so the band between them — `0.00001` is `1e-05` in Go and `0.00001` in JS — has to be handled rather than inherited.

### Loading

`lib/runtimes/index.ts` exposes one function, `runInBrowser(language, source)`, and **dynamically imports** either `./asm` or `./dialects` so the interpreters stay out of the playground's initial bundle.

---

## 8. The x86-64 assembler and emulator

`lib/runtimes/asm.ts` (~950 lines) assembles and executes the NASM subset the Assembly track teaches.

**Faithful:**

- The 64/32/16/8-bit register file, including the rule that **a 32-bit write zeroes the upper half**, and the legacy high-byte registers (`ah` is bits 8–15 of `rax`).
- Two's complement arithmetic at every width.
- The ZF/SF/CF/OF/PF flags and the conditional jumps that read them.
- The full `base + index*scale + disp` addressing formula.
- A real downward-growing stack. `BASE_ADDR = 0x400000`, `MEM_SIZE = 1 MiB`, `STACK_TOP = BASE_ADDR + MEM_SIZE - 16`.
- The Linux `write` / `read` / `exit` syscall convention.

**Not faithful, and stated:** this executes *decoded* instructions rather than encoded bytes. There is no instruction-length or opcode-byte modelling. Everything the track teaches about semantics holds; nothing about encoding does.

---

## 9. The practice judge

The console on a problem page. Eight languages, all executing in the browser.

### The protocol

Every language reduces to the same contract: take the source, call one named function once per test case, hand back either a JSON-encodable value or the text of the exception it threw.

```ts
JudgeSpec { entry, params: JudgeType[], returns: JudgeType, cases: unknown[][] }
```

**The expected answers are deliberately absent from the spec.** It crosses a `postMessage` boundary into workers that must not import the content tree, and a runtime that knew the answers could not be trusted to report what the code actually returned (R4).

Worker messages are flat so the handler stays a switch:

```ts
| { type: "ready" }
| { type: "stdout"; text }
| { type: "case";  case: RawCaseResult }   // one at a time, as it finishes
| { type: "cases"; cases: RawCaseResult[] } // the whole set
| { type: "failed"; status; message }
```

The **running commentary** matters more than it looks: reporting each case as it finishes is the difference between "timed out" and "four passed, then it hung on n = 35", and the second one is the whole lesson.

`RunStatus` distinguishes `passed`, `failed`, `no-entry`, `compile-error`, `runtime-error`, `timeout`, `cancelled` and `unsupported`. `failed` means the code ran and got something wrong, which is the useful outcome; the rest mean it never got that far, and each is worth telling apart.

### Routing a language to a runtime

`JudgeRunner` (`lib/judge/runner.ts`) keeps up to three workers alive:

| Kind | Languages | Worker |
| --- | --- | --- |
| `python` | Python | `/judge/python-worker.js` (module worker, served from `public/`) |
| `javascript` | JavaScript, TypeScript | `/judge/js-worker.js` (classic worker, `importScripts`) |
| `interpreted` | C, C++, Go, Java, Rust | `./interpretedWorker.ts` — **bundled**, because it imports TypeScript modules |

It is a plain class, not a hook, on purpose: a Worker is a live thread with its own lifetime, and the page merely observes it. `useJudge` is a thin subscription that exposes `{ outcome, phase, run, stop, reset }`.

Two budgets, because the two waits are nothing alike: **`BOOT_MS = 60,000`** (downloading and starting CPython legitimately takes seconds) and **`RUN_MS = 10,000`** (a solution that has not returned in ten seconds is a loop that never will). Only the first Python run is a boot; the worker is kept afterwards, because paying multiple seconds on every Run would ruin the edit-and-rerun loop practice depends on.

A `generation` counter is bumped on every run and on `stop`, so a late message from a terminated worker is ignored rather than mistaken for the current run's result. When the watchdog fires, the cases that *did* finish are kept and graded, and the message names how many were left.

### The three harnesses

**JavaScript** (`public/judge/js-harness.js`) — a plain script, not a module, so `importScripts` can pull it in and a Node test can evaluate the same file and call the helpers directly. The code that grades you is the code that was tested.

It defines a `PREAMBLE` that is prepended **to your code**, not to the harness — `TreeNode` has to exist in the scope your solution is compiled into, or `new TreeNode(1)` is a `ReferenceError`. Entry resolution compiles your source inside `new Function` with a trailing expression that hands back the entry point by name, guarded by `typeof` so a misspelling reports as a missing function rather than a `ReferenceError` from nowhere; a `class Solution` is also returned and instantiated, because pasting the class from the solutions below the console is a reasonable thing to do.

`encode()` narrows return values to numbers, strings, booleans, arrays of those, and typed arrays. A `Map` or `Set` reaching that point throws a named `TypeError` — silently stringifying it would fail the case with an unreadable diff.

**Python** (`public/judge/runtime.py`) — one file split on a `# --- DRIVER ---` marker. The preamble (a `TreeNode` with `__slots__`) runs into the same namespace your solution will land in, so a signature mentioning `TreeNode` resolves. The driver runs after your code and its final expression is the JSON string the worker sends back.

`_dk_resolve` accepts three spellings: LeetCode's camelCase, the track's snake_case, and a method on a `Solution` class. `_dk_error()` formats the traceback with the driver's own frame removed (`tb = tb.tb_next`) so it points at your code. Encoding is a **separate step** from calling, so "your code raised" and "your code returned something uncomparable" do not arrive looking alike.

**The interpreted five** (`lib/judge/interpreted.ts`) — **no driver program is generated.** The interpreters are synchronous and live in the same process, so the source is parsed once and the entry function is then *called* directly, one call per case, with arguments converted in and the result converted back. That buys three things a generated `main` would not: per-case error isolation, no escaping bugs at the boundary, and the ability to tell "your loop threw on case 4" apart from "your file does not compile".

Conversion is driven by the **declared type, not the JavaScript value's shape**, because the two disagree exactly where it matters: `"a"` is a `char` in one problem and a `string` in another, and getting that wrong would hand a Java solution a `String` where it expects a `char` and fail it for the runtime's mistake. Integer width follows the language: 64-bit for Go and Rust, 32-bit for C, C++ and Java.

Globals are re-declared and re-executed per case, and each case gets a fresh `OutputSink`, so one case cannot starve or contaminate the next.

An `UnsupportedError` is **fatal for the whole run, not for one case** — the next case would meet the same gap, and four more failures would bury the one sentence that explains it.

### C's calling convention

C solutions get the signature LeetCode gives them, and `cArguments()` builds the call to match: an array arrives as a pointer followed by its length, a matrix adds a per-row length array, and a returned array is sized through a trailing `int* returnSize`. A solution that never writes `*returnSize` leaves it at zero — read as "not set", so the array is taken whole rather than silently marked empty.

It is more ceremony than the other languages need, and it is the ceremony C actually has. Inventing a friendlier one would teach a calling convention that exists nowhere else.

### Grading and comparison

`grade.ts` is pure — no Workers, no `import.meta.url` — which is what lets `scripts/try-judge.mjs` reproduce the browser's verdicts from a terminal.

`compare.ts` is the only place a value is called right or wrong:

- **`exact`** — deep structural equality.
- **`unordered`** — sorts a flat array first, for problems whose statement says the answer may be in any order.
- **`unordered-nested`** — sorts both the inner arrays and the outer one. Three-sum is why this exists: the triples may come in any order and so may the numbers inside them.

`compareValues` imposes a total order over JSON values (null < boolean < number < string < array < object) purely to make `unordered` deterministic; the ordering itself is arbitrary, it just has to be the same on both sides.

Doubles compare with `DOUBLE_EPSILON = 1e-9`, scaled by magnitude, and integers compare exactly — `0.30000000000000004` should pass a `double` problem, and nothing should quietly pass an `int` one. `null` and `undefined` are treated as the same "no value", because Python's `None` arrives as one and a JavaScript function that falls off its end returns the other.

### Stubs

`lib/judge/languages.ts` generates the code the editor opens with, per language, from the judge signature. `JudgeType` (13 members) is mapped four times over — Python, TS/JS, Java, and then C++/Go/Rust/C — which is why the type set is deliberately small and concrete rather than a general type system: every addition costs eight tables.

Details worth knowing:

- **Python stubs use snake_case.** Every runtime accepts either spelling, so the stub offers the one matching the solutions printed further down the page.
- **Java stubs are `static`.** Not decoration: the generated harness calls the method straight from `main()`, with no `Solution` instance to hang it off.
- **C++ stubs take plain references, not `const&`.** Idiomatic would be `const&`, but several of these problems want a solution that sorts its input in place, and the stub should compile without the reader first having to fight the type.
- **`tree` is unsupported in the five interpreted languages.** The conversion throws a named `UnsupportedError` pointing the reader at Python, JavaScript or TypeScript.

### The Java escape hatch

`lib/judge/javaHarness.ts` builds a single self-contained `.java` file — cases inlined, tree inputs rebuilt, results printed and counted — that a reader can run on a real JDK. It is offered as a "copy harness" button when the console's language is Java.

The comparison travels **as text**: Java's primitive arrays make structural equality across `int[]`, `char[][]` and `String` a pile of overloads, whereas rendering both sides to the same JSON is one `show` method per type and no chance of `Arrays.equals` being called where `deepEquals` was meant. Expected values are canonicalised with the same `canonical()` the browser uses, so "passes in Java" means what it does everywhere else.

### Drafts

`lib/judge/attempts.ts` stores drafts in localStorage keyed **per problem *and* per language** (`devkernel:attempt:<slug>:<language>`), so switching the dropdown to check how the same idea reads in Python does not throw away the Java you had going. A console that loses your half-finished solution on a refresh is one you stop trusting with anything longer than five lines.

---

## 10. Visualisations

The same rule that governs lesson output governs the pictures: **a visualisation is generated by running the real algorithm, never authored by hand.** A hand-drawn animation of merge sort is a drawing of what somebody *remembers* merge sort doing, and it will be subtly wrong in exactly the places a learner is trying to understand.

Every generator in `lib/visuals/` is an ordinary implementation with `emit()` calls threaded through it. The frames are a side effect of the algorithm actually executing — so if the implementation is wrong, the animation is visibly wrong too.

### Frames are snapshots, not deltas

A frame is a **complete** description of the state. That costs memory on a large input and buys the thing a learner needs most: the ability to step *backwards*, which a delta stream cannot do without replaying from the start.

Eight frame kinds:

| Kind | Shape | Used for |
| --- | --- | --- |
| `array` | `values[]`, `roles`, `markers`, `note`, `stats` | Sorting, searching, windows, prefix sums |
| `heap` | `values[]`, `roles` | A heap shown as array *and* tree at once — the whole point of a heap |
| `tree` | `nodes[]` with `depth`, `x`, `parent`, `terminal`, `badge` | BSTs, tries, React element trees |
| `sequence` | `items[]`, `pins`, `linked` | Stacks, queues, linked lists |
| `buckets` | `buckets[]` of `{key, items}` | Hash tables with chaining |
| `graph` | `nodes[]` with `x`/`y`, `edges[]` with `weight`/`directed`, `output[]` | Traversals, shortest paths |
| `matrix` | `cells: string[][]`, `roles` keyed `"r,c"`, row/col labels | DP grids, distance matrices, character grids |
| `filetree` | flat `entries[]` with `depth`, `kind`, `note` | Project layout, for the React structure module |

Two shapes are flat on purpose. `TreeNode` carries its own `depth` and `x`, and `FileEntry` its own `depth`, because **a frame has to be self-describing** — a renderer that walked a nested structure to work out layout would be recomputing it on every frame.

`MatrixFrame.cells` holds display *strings* rather than numbers because a DP table often wants a blank for "not computed yet", which no number can honestly stand in for.

Every frame carries a `note`: one sentence saying what this step did. It is both the caption and the screen-reader text.

### Roles

19 roles, and the vocabulary is split deliberately rather than reused:

- **Algorithms:** `compare`, `swap`, `pivot`, `sorted`, `active`, `window`, `discarded`, `found`.
- **React reconciliation:** `mounted`, `updated`, `unchanged`, `unmounted`, `moved` — borrowing "swapping" or "in final place" for these would put the wrong word in the legend under the animation.
- **File trees:** `created`, `deleted` — a file that did not exist before is *created*, not *mounted*; mounting is something React does to a component.
- **Concurrent rendering:** `suspended` (the work was not thrown away, it is waiting) and `stale` (the word `useDeferredValue` is documented in).
- **Rendering models:** `server` and `client`.

`components/visuals/roles.ts` maps each role to four Tailwind class tables — `ROLE_FILL`, `ROLE_TEXT`, `ROLE_RING`, `ROLE_SVG_FILL`, `ROLE_STROKE` — all written as **complete literals**. They cannot be derived by swapping `bg-` for `fill-` at runtime: Tailwind only emits classes it can see in the source, so a class name assembled by `String.replace` resolves to nothing and the shape renders with the browser's default black fill.

Colour is never the only signal. Every frame carries its sentence, and the roles are distinguishable by lightness as well as hue so the animation still reads for the ~8% of men with a colour vision deficiency.

### `Recorder`

A three-method helper: `bump(name, by)` maintains named counters, `stats` snapshots them, and `push(frame)` appends the frame with a **copy** of the counters attached — which is what makes the running tallies under the player correct at every step rather than only at the end.

### Resolution

`VisualKind` has 35 members. `lib/visuals/resolve.ts` splits them three ways:

- **`sorting` and `searching`** — their own tables (`SORTERS`, `SEARCHERS`), plus a shuffle control and, for search, a target picker.
- **19 families** in the `FAMILIES` table, each `{ table, fallback }`: `graph`, `dp`, `string-matching`, `pattern`, `tree-algorithm`, `bits-and-math`, and thirteen React families (`react-rendering`, `react-structure`, `react-concurrent`, `react-server`, `react-tooling`, `react-patterns`, `react-state`, `react-data`, `react-perf`, `react-jsx`, `react-arch`, `react-forms`, `react-misc`).
- **14 structures** dispatched by `runStructure()`: stack, queue, deque, linked list, doubly linked list, circular buffer, dynamic array, BST, trie, heap, hash table, segment tree, Fenwick tree, LRU cache.

`Visual.tsx` reads the same `FAMILIES` tables to build its picker, so a kind cannot offer an option the resolver does not know how to run.

`resolve.ts` exists as a separate module for one reason: `scripts/verify-visual-frames.ts` needs to run every spec without rendering it, and a checker that reimplemented this dispatch would be checking its own copy rather than what a reader sees.

One nice detail: the default search target is `values[length - 2]`, **not** the midpoint — binary search would find a midpoint on its first look and the animation would be over before it showed anything.

### The player

`VisualPlayer` provides transport controls, a scrubber, the current step's sentence in an `aria-live="polite"` region, a legend filtered to the roles the run actually uses, the running stats, and keyboard control (←/→ step, space play/pause, Home/End).

Four speeds: 0.5× = 1200 ms, 1× = 600 ms, 2× = 280 ms, 4× = 120 ms per frame.

Three decisions in the playback effect are worth reading carefully, because all three have been got wrong before:

1. **Resetting is the caller's job.** `Visual` gives the player a `key` derived from the run, so choosing a different algorithm or reshuffling remounts it at frame zero. That is React's own answer to "reset state when a prop changes", and it avoids a `setState` inside an effect.
2. **Reaching the end does not clear `playing`.** The effect simply stops scheduling. Keeping the flag means pressing Replay resumes playing rather than requiring a second click.
3. **`clamped` must stay in the dependency list.** Each tick schedules exactly one advance, so *arriving* at a frame is what arms the timer for the next. Drop it and the chain is never re-armed: playback advances a single step and stalls. Nothing type-checks or lints its way to that bug — which is the entire reason `verify-visual-playback.mjs` exists.

Playback stops at the end instead of looping, because a loop restarts the explanation mid-thought.

---

## 11. Client state and persistence

There are no accounts. Everything personal lives in the browser.

| Key | Store | Holds |
| --- | --- | --- |
| `devkernel:completed-lessons` | localStorage | `"track/module/lesson"` strings |
| `devkernel:solved-problems` | localStorage | Problem slugs |
| `devkernel:solution-language` | localStorage | `java` \| `python` — which language *solutions* are read in |
| `devkernel:practice-language` | localStorage | Which language the *console* opens in |
| `devkernel:example-language` | localStorage | Which language lesson examples display |
| `devkernel:attempt:<slug>:<language>` | localStorage | One draft per problem per language |
| `devkernel:solve-split-y` | localStorage | Editor/results split percentage |
| `devkernel:problem-split-x` | localStorage | Description/workspace split percentage |
| `devkernel:playground-handoff` | **session**Storage | Code sent from a lesson to the playground; consumed on read |

Three custom events keep multiple components on one page in step: `devkernel:progress-changed`, `devkernel:practice-changed`, `devkernel:example-language-change`. `practiceProgress.ts` additionally listens for the native `storage` event so two open tabs agree.

**Every read is wrapped in `try`/`catch` and guarded by `typeof window === "undefined"`.** A disabled or full store degrades to "no progress recorded" rather than a crash — a full store is not worth interrupting a solve over.

**Migrations.** `lib/progress.ts` reads three keys in order, newest first:

1. `devkernel:completed-lessons` — current.
2. `engineershub:completed-lessons` — a previous brand; same format, so entries move across verbatim.
3. `jsts-mastery:completed-lessons` — predates tracks entirely; its two-segment keys were all JS/TS, so each is rewritten as `js-ts/<key>`.

A migration writes the result to the current key, so it happens once.

Lesson progress and practice progress are kept **separate on purpose**: a lesson is read once, a problem is worth re-solving a month later, and conflating them would make "reset" ambiguous.

Two language preferences also stay separate, because they are different decisions: plenty of people read Java because that is what their interviews are in, and reach for Python when they want to get an idea working quickly. The solutions default to Java — the language most of this track's target interview loops are conducted in, and the one whose verbosity makes the data structures visible.

`useSplit` is a shared hook behind both draggable dividers: pointer capture, clamped to `[min, max]`, persisted per key, with an accessible label.

---

## 12. Analytics

Off by default. With no `NEXT_PUBLIC_POSTHOG_KEY` in the environment, `posthog.init` never runs — so a local checkout, CI and a fork send nothing and nobody has to remember to turn it off.

`lib/analytics.ts` declares an `AnalyticsEvents` map typing every event name and property shape, and `track()` is generic over its keys. The map is the point: event names and property shapes drift the moment they live as string literals at each call site, and a misspelt name in PostHog is a silently empty chart rather than an error. `track()` early-returns unless `posthog.__loaded`, which is what lets call sites stay unconditional.

Five events, each chosen because a pageview cannot answer it: `lesson completed`, `example language changed`, `playground run`, `practice run` (with status and duration), `visualization played`. Nothing restates what the URL already says — the path already carries track, module and lesson.

`instrumentation-client.ts` runs after the document loads but **before React hydrates**, so a pageview is recorded even if the visitor leaves before the page becomes interactive. Its configuration is four deliberate choices:

- **`api_host: "/ingest"`** — same-origin, proxied by the rewrites. A blocked request is an uncounted reader, and this audience blocks. `ui_host` is set separately so links from the SDK back into PostHog still point at the real host.
- **`rewriteRequestPath`** strips trailing slashes. PostHog's paths end in one (`/e/`, `/flags/`), and Next answers a trailing slash with a 308 — which for a POST drops the body and the events vanish. The usual fix, `skipTrailingSlashRedirect`, would disable canonical redirects site-wide and leave every lesson reachable at two URLs; PostHog serves the slash-less paths identically, so asking for those is the narrower fix.
- **`capture_pageview: "history_change"`** — after the first load, moving between lessons only pushes history state, so the default load-time-only pageview would record one visit per session no matter how much of the curriculum someone read.
- **`session_recording.blockSelector: ".monaco-editor, [data-ph-no-capture]"`** — Monaco renders what you type as ordinary DOM text, so without this, replay would ship half-written interview solutions off the machine. Blocked rather than masked: a grey box is enough to see that someone was editing. `maskAllInputs` is on as well.

`defaults: "2026-08-29"` pins the behaviour the file was written against, since `posthog-js` ships breaking default changes under dated keys.

---

## 13. Styling and theming

Tailwind v4, configured entirely in `app/globals.css` — there is no `tailwind.config`.

The file has three layers:

1. **`:root` and `.dark`** define ~60 raw CSS custom properties each: surfaces, borders, accents, a brand gradient, per-track colour pairs, difficulty colours, code and console surfaces, and a skeleton sheen.
2. **`@theme inline`** maps those onto Tailwind's colour namespace, which is what turns `--dsa-color` into the usable utilities `text-dsa`, `bg-dsa`, `bg-dsa-soft`.
3. Base rules and two components: `.scrollbar-thin` and `.skeleton`.

`@custom-variant dark (&:where(.dark, .dark *))` pairs with `next-themes` in class mode. `:where()` keeps the variant at zero specificity so it never wins a fight it should not.

**Contrast is a stated constraint.** Track colours double as badge *text* on their own `-soft` background, so each has to clear 4.5:1 against it — which rules out the bright yellows and cyans several of the brands actually use, hence `--js-color: #8a6100` in light mode. Difficulty colours follow the same rule and additionally have to work directly on `--surface` in the problem table. System Design is teal rather than another blue specifically because it sits beside DSA in the same list.

**Code surfaces track the theme rather than being fixed dark**, because `github-light` paints near-black tokens which would be invisible on a dark block.

Three colour tables live in TypeScript — `TRACK_BADGE_CLASS`, `TRACK_ACCENT_TEXT`, `TRACK_ACCENT_BG` in `lib/trackTheme.ts`, plus `DIFFICULTY_BADGE_CLASS` in `content/practice/index.ts` and the five role tables — all written as complete literals for the same scanner reason as the visual roles.

Two accessibility behaviours: `prefers-reduced-motion` disables both smooth scrolling and the skeleton sweep, and `html { overflow-x: hidden }` stops a single long token in a heading side-scrolling the whole page instead of just its own container.

Every route has a `loading.tsx` built from the shared `Skeleton` primitives, shaped like the content it precedes. The sweep is a `background-position` animation over a gradient rather than a moving child element, so a skeleton is one empty div with no layout cost and nothing to clean up.

---

## 14. The asset pipeline

Two dependencies cannot be imported; they have to exist at a URL, because each fetches its own payload over HTTP at load time. `npm run assets` runs before both `dev` and `build`.

**`scripts/copy-pyodide.mjs`** copies exactly five files into `public/pyodide/`: `pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`. The package also ships source maps, two demo pages, ESM/CJS variants that are never loaded and type declarations — together most of its weight.

**`scripts/copy-monaco.mjs`** copies the AMD build into `public/monaco/vs/`, skipping `nls/lang` (1.7 MB of translated editor strings the loader only requests when `vs/nls.availableLanguages` names a locale, which nothing here does) and `.d.ts` files.

It resolves the source with `require.resolve("monaco-editor")` rather than a subpath, because the package's `exports` map sends every subpath — `./package.json` included — into the ESM tree; the bare specifier's `require` condition is `./min/vs/index.js`, which is exactly where the AMD build lives.

`lib/monacoLoader.ts` then points the loader at the copy:

```ts
loader.config({ paths: { vs: "/monaco/vs" } });
```

Without it, `@monaco-editor/react` fetches the editor from jsDelivr, which has two problems worth fixing rather than living with: the playground and the practice console stop working the moment the CDN is unreachable — offline, behind a strict CSP, on a locked-down network — and the built-in default is pinned to its own version, so the editor in the browser was 0.55.1 while `package.json` pinned 0.56.0. Import the module from any file that renders an editor; the call is idempotent and must happen before the first `Editor` mounts.

Both scripts **skip files already present at the same size**, because this runs before every dev server start and re-copying 9.6 MB of wasm (or 20 MB of editor) each time is pure latency. Both output directories are gitignored: they are a pinned dependency's build output, not source.

---

## 15. Verification gates

### `scripts/verify-lesson-code.mjs`

The gate that makes rule R1 true. It compiles the content tree, walks every track → module → lesson → section → example, and runs each example whose language it has a toolchain for **and** which declares an `output`. Examples with no `output` are illustrations rather than promises and are skipped.

**Loading the content tree from Node** is a small trick worth knowing about. The tree is TypeScript with `@/` imports, so the script writes a throwaway `tsconfig.json`, compiles `content/**/*.ts` to CommonJS with `tsc`, then patches `Module._resolveFilename` to rewrite `@/…` specifiers into the output directory. Simpler than adding a bundler, and it means the script checks the same objects the site renders. `rootDir` is pinned, or `tsc` infers it from the inputs and drops the `content/` prefix the alias then expects.

**Two language sets, and the asymmetry is deliberate:**

- `RUNNABLE` — checked for an example's *primary* code: `java`, `python`, `go`, `tsx`, `jsx`. Deliberately short. Turning the full set on here would also start checking the C++ and Rust tracks, whose examples are written against particular build invocations this runner does not reproduce — `-Wall` for the warning lessons, `g++ -E` for the preprocessor one, a deliberate non-zero exit for another, and a few that print timings and so can never match.
- `TRANSLATABLE` — checked for *every* alternate: `java`, `python`, `go`, `cpp`, `rust`, `javascript`, `typescript`, `asm`, `jsx`, `tsx`. Translations are plain programs written to be run exactly this way, so the whole toolchain set is safe. The dropdown promises the same program in another language, and an unverified translation makes that a lie.

**Per-language runners:**

| Language | How |
| --- | --- |
| Java | Wraps a bare snippet in a minimal `Main` class unless it already declares a `class`/`interface`/`enum`/`record`; runs `java Main.java` in single-file source mode |
| Python | `python3 snippet.py` |
| Go | **No wrapping** — an example carries its own `package main` and imports, because Go refuses to compile an unused import so a fixed preamble is impossible. Each gets its own directory so two `main`s never collide. `GOFLAGS=-mod=mod`, `GOTOOLCHAIN=local` |
| C++ | `g++ -std=c++20 -O0`, then run |
| Rust | `rustc --edition 2021`, then run |
| JavaScript | `node snippet.mjs` |
| TypeScript | The local `tsx` binary directly — not `npx tsx`, which re-resolves the package on every call and costs more than the type-strip does. Type-*strips* rather than type-checks; the repo's own `tsc --noEmit` is what checks types |
| Assembly | `nasm -f elf64`, then `ld` bare — no libc, so examples exit through the syscall rather than through `main` returning |
| JSX / TSX | See below |

**React examples** (`runReact`) are the most involved case:

- They cannot use the system temp directory. `import React from "react"` resolves by walking up from the file, and esbuild finds the JSX setting by walking up for a tsconfig — so a file in `/tmp` gets "Cannot find module 'react'" and no transform. They run in `node_modules/.devkernel-verify`, which git, tsconfig and eslint already ignore.
- A `tsconfig.json` pinning `jsx: "react-jsx"` is written there, because the repo's own tsconfig excludes `node_modules` and the loader would otherwise fall back to the **classic** transform — hiding exactly the automatic-runtime behaviours the lessons describe (`key` lifted out of props, `jsx` vs `jsxs`).
- A `package.json` with `{"type": "module"}` goes beside it, because CommonJS emit would deny examples top-level `await` and put them in sloppy mode, where a write to a frozen props object fails silently instead of throwing.
- `reactRoot()` decides what to render, by an explicit contract: an example declaring `App` renders `App`; otherwise an example that prints nothing of its own renders its last top-level component; an example that prints for itself and has no `App` renders nothing (it is *inspecting* components, and appending markup would be noise); and an example calling `createRoot`/`hydrateRoot` renders nothing here either, since it is driving React on a real DOM and printing what it means to show. Component detection requires a lowercase letter in the name, so `const MAX_ROWS = 10` is not mistaken for a component.
- The harness is appended **after** the example, never prepended: ES imports are hoisted so the bindings exist either way, and appending keeps every line number in a stack trace equal to the line the learner is reading on the page.
- Examples mentioning the DOM, `react-dom/client` or `act` get a real one from jsdom via `--import scripts/react-dom-env.mjs`, loaded before the example is evaluated. That file overwrites `FormData` deliberately: Node's own undici version throws when handed a jsdom form. It also installs `MutationObserver`, `IntersectionObserver` and `ResizeObserver`, so a lesson can *count* what React writes to the DOM rather than assert that a re-render is not a DOM write, and sets `IS_REACT_ACT_ENVIRONMENT`.
- The DOM roughly doubles an example's runtime, hence loading it only where asked for.

**Normalisation** before diffing: CRLF → LF, trailing whitespace stripped, trailing blank lines removed, and every scratch path rewritten to the filename a learner would actually see — `Main.java`, `main.py`, `main.go`, `main.cpp`, `main.rs`, `App.tsx`/`App.jsx`. A diagnostic should quote a filename, not a temp directory that differs on every run.

**A non-zero exit is not a failure.** Several lessons teach an error message on purpose, and those examples are *supposed* to fail. The output is the whole contract; the exit status is reported as "(exit N, as intended)".

The per-example timeout is **300 s**, deliberately generous: the n-queens pruning example measures an unpruned 19-million-node search and lands within a couple of seconds of two minutes, so a 120 s limit made it pass or fail depending on what else the machine was doing. A slow example is a slow example; a flaky one is a broken signal.

### `scripts/verify-visual-frames.ts`

Runs **every entry in every table** — whether or not a lesson points at it, since the picker can reach all of them — then every `visual` spec a lesson declares, resolved the way the page resolves it.

Structural checks per frame kind: role names must be known; index keys in `roles`, `markers` and `pins` must be integers inside the array; tree and filetree ids must be unique; a tree node's `parent` must be present in the same frame; graph edges must name nodes that exist; matrix rows must be equal width and label counts must match; a filetree row may only indent by one from the row above it; every frame needs a non-empty `note`; every visualisation needs a summary and **at least two frames**.

It exists for three failures nothing else catches:

1. **A role pinned to an index that does not exist.** The canvas renders that silently — the highlight simply does not appear — so a pointer that stopped being drawn looks like an algorithm that stopped moving it.
2. **A spec naming an algorithm no table has.** `FamilyVisual` falls back to the family default, and with `lockAlgorithm: true` the picker is hidden — so a typo shows a *different algorithm* under the lesson's own title with nothing on screen to say so.
3. **A generator emitting one frame or none.** There is nothing to animate and the player has no way to say so.

It also polices the **language dropdown**, which is otherwise unenforced. `DROPDOWN_LANGUAGES` pins the allowed set per track — `dsa` gets eight, `react` and `nextjs` get `jsx`/`tsx`/`javascript`/`typescript`, `angular` gets `javascript`/`typescript` — and `LANGUAGE_PAIR` requires each alternate to be the *counterpart* of its primary (`jsx ↔ tsx`, `javascript ↔ typescript`). Pinning per track rather than merely allowing a dropdown is what catches the real defect: not "a dropdown appeared" but "a React example offers to be read in Python". A `jsx` primary beside a `typescript` alternate is wrong twice over — the reader sees a component highlighted as a plain module, and choosing TypeScript on one example stops carrying to the next.

### `scripts/verify-visual-playback.mjs`

Launches headless Chromium, connects over the DevTools protocol via a raw WebSocket, walks the gallery, presses Play and **measures elapsed wall-clock time** against the speed each button promises.

The header carries a warning worth repeating: **never add `--virtual-time-budget`.** It fast-forwards `setTimeout`, which is the exact mechanism under test — with it, the run finishes instantly and the script reports success whether or not playback works. Every measurement here is deliberately real elapsed time, which is why it takes minutes and needs a server already running.

Flags: `--entries` (gallery walk only), `--speeds` (speed labels only), `--url`, `--port`. Chromium is found from `$CHROME` or a list of standard locations.

### The two dev helpers

Neither is a gate; both exist so the runtimes can be iterated on without a browser.

- **`scripts/try-runtime.mjs <lang> <file|->`** — compiles the same TypeScript the site ships and calls straight into it. Exit status is the program's own.
- **`scripts/try-judge.mjs <problem-slug> <language> <file>`** — calls the same grading path the browser does (`runInterpreted`, then `gradeCases`), so a verdict here is the verdict a learner would see. Exits non-zero unless every case passes.

### CI and the hook

`.github/workflows/verify.yml` runs two jobs **in parallel**, not in sequence:

- **`checks`** — `npm ci`, `npm run verify`, `npm run build`. A few minutes; this is what gates a pull request.
- **`lesson-code`** — the full example run, `timeout-minutes: 60`, with Java 25 (Temurin), Python 3.13, Go 1.24 and `nasm` installed. It runs *beside* the fast half rather than in front of it.

The toolchain versions are pinned because **a recorded output is only reproducible on the toolchain it was recorded against**. The runner's default JDK printed `1.15292150460684698E18` where every lesson says `1.152921504606847E18`, because `Double.toString` switched to the shortest round-tripping decimal in JDK 19.

`.githooks/pre-commit` runs only the fast half. Enable it per clone with `git config core.hooksPath .githooks`.

---

## 16. Known rough edges

Documented rather than smoothed over, since a reader of this file is likely to hit them.

**1. The practice-language preference only persists for four of eight languages.** `PRACTICE_LANGUAGE_ORDER` in `lib/judge/languages.ts` offers `python, javascript, typescript, java, cpp, c, go, rust`, and `SolveConsole` renders all eight. But `VALID_LANGUAGES` in `lib/judge/attempts.ts` is `["python", "javascript", "typescript", "java"]`, and `loadPracticeLanguage()` falls back to `python` for anything outside it. Pick Go, reload, and the console silently opens in Python. Drafts are unaffected — `loadAttempt` does not validate — so the Go you wrote is still there; only the selection is lost. The fix is one line: derive `VALID_LANGUAGES` from `PRACTICE_LANGUAGE_ORDER`.

**2. `javaHarness.ts` opens with a comment that is no longer true.** It says "the browser cannot run Java", which predates the Java interpreter in `lib/runtimes`. Java *does* run in the browser now; the harness is a real-JDK escape hatch offered alongside, not instead. The doc comment reads as though the escape hatch is the only path.

**3. `CMakeLists.txt` at the repository root references files that do not exist.** It declares `src/circle.cpp`, `src/rectangle.cpp` and `src/main.cpp`; there is no `src/` directory. It appears to be a fixture for the C++ build-tooling module that ended up at the root rather than beside the lesson that uses it. `cmake .` in a fresh clone will fail.

**4. `RUNNABLE` in the lesson-code verifier does not cover C++ or Rust primaries.** By design and documented in the file, but the practical effect is that the C++ track's ~370 primary examples are verified only through their translations (of which they have none) — that is, not by this gate. Their outputs were recorded against real toolchains when written; making the runner reproduce those specific build invocations is described in the source as "its own piece of work".

**5. `content/practice/patterns.ts` defines 17 of the 33 ids in the `PatternId` union.** The union is intentionally ahead of the content — it is what makes a typo a build error — but `getPattern(id)` returns `undefined` for the other 16, and the problem page silently renders nothing for those. Any problem tagged with one would show a shorter "patterns behind it" list than its tags suggest.

**6. Analytics `AnalyticsEvents` types `example language changed` as `{from, to}` strings** while every other event is more structured. Not a defect, just an inconsistency to be aware of when querying.

---

## 17. File map

```
app/
  layout.tsx                    Root layout: fonts, ThemeProvider, Header, metadata, themeColor
  globals.css                   All theming: ~60 CSS variables per mode, @theme inline, skeletons
  (home)/page.tsx               Landing page; counts derived from the content tree
  roadmap/page.tsx              Modules 0–4, electives, first-month plan
  curriculum/(index)/page.tsx   Tracks, split by mode
  curriculum/[trackSlug]/       One track + CurriculumMap
  learn/[trackSlug]/layout.tsx  The lesson shell — a layout so the sidebar survives navigation
  learn/.../[lessonSlug]/       One lesson
  practice/(index)/page.tsx     The sheet
  practice/[problemSlug]/       Problem workspace; server-rendered slots
  playground/page.tsx           Thin wrapper over PlaygroundClient
  visualize/page.tsx            Thin wrapper over VisualizeGallery
  */loading.tsx                 One skeleton per route

components/
  brand/DevKernelMark           Gradient wordmark
  curriculum/CurriculumMap      Module list with phase dividers and progress
  layout/Header, HeaderNav      Server header, client nav; render-phase menu close
  layout/HeaderProgress         Current track's progress, or overall; totals passed from the server
  layout/LessonShell, SidebarNav  Persistent sidebar; scroll and expansion preserved
  lesson/LessonView             Header, sections, takeaways, interview Q&A, prev/next
  lesson/SectionBlock           Prose → examples → visual → pitfalls
  lesson/Prose                  Markdown-lite: **bold**, *italic*, `code`
  lesson/CodeBlock              Async server component; Shiki dual-theme
  lesson/CodeBlockActions       Copy, and "open in playground" where a target exists
  lesson/ComparisonPanel        Three example shapes
  lesson/ExampleLanguagePicker  Re-parents server-rendered blocks
  lesson/InterviewQA, PitfallCallout, MarkCompleteButton
  playground/PlaygroundClient   Language state, run dispatch, mobile pane switching
  playground/PlaygroundEditor   Monaco; model extension latches JSX mode
  playground/ConsolePanel       Levelled output
  practice/ProblemBrowser       Facet filters, sort, search
  practice/ProblemWorkspace     Two panes + three tabs, gating the approaches
  practice/SolveConsole         Language, drafts, run, Java harness copy
  practice/SolveEditor, SolveResults, SolvedToggle, ApproachPanel,
  practice/SolutionLanguagePane, DifficultyBadge, SplitHandle, useSplit
  skeleton/Skeleton             Shared loading primitives
  theme/ThemeProvider, ThemeToggle
  visuals/Visual                Spec → the right player; owns picker/shuffle state
  visuals/VisualPlayer          Transport, scrubber, legend, stats, keyboard
  visuals/canvases              Eight renderers, one per frame kind
  visuals/VisualizeGallery      The /visualize page
  visuals/roles                 Five complete-literal Tailwind class tables

content/
  types.ts                      The data model
  tracks/index.ts               Registry + the whole query API
  tracks/<track>/index.ts       Track definition and module order
  tracks/<track>/modules/...    One file per lesson, one index per module
  comingSoon.ts                 Syllabus → preview lesson
  roadmap.ts                    Modules 0–4, electives, FIRST_MONTH
  practice/types.ts             Problem, Approach, Pattern, Judge
  practice/index.ts             PROBLEMS, facets, filtering, sorting, stats
  practice/patterns.ts          Pattern definitions with templates and invariants
  practice/topics.ts            The filing cabinet
  practice/problems/*.ts        Seven files, grouped by pattern family

lib/
  judge/types.ts                The run protocol
  judge/runner.ts               Worker lifecycle, watchdogs, generation counter
  judge/grade.ts                Raw values → verdicts; pure, so Node can run it
  judge/compare.ts              The only place a value is called right or wrong
  judge/languages.ts            Eight language profiles + stub generation
  judge/interpreted.ts          Bridge to lib/runtimes; C calling convention
  judge/interpretedWorker.ts    Bundled worker for the five interpreted languages
  judge/javaHarness.ts          Self-contained .java file for a real JDK
  judge/attempts.ts             Per-problem, per-language drafts
  judge/format.ts, useJudge.ts
  runtimes/types.ts             RuntimeResult, the two error classes, OutputSink
  runtimes/lang.ts              Lexer, AST, Pratt parser, evaluator, sized integers
  runtimes/parser.ts            Four dialects; Go semicolon insertion
  runtimes/dialects.ts          Rust/C++/Java front-ends and formatting
  runtimes/cdialect.ts          C: pointers as arrays, honest sizeof
  runtimes/godialect.ts         Go: fmt ordering, range order, append
  runtimes/stdlib.ts            What every language shares
  runtimes/asm.ts               x86-64 assembler and emulator
  visuals/types.ts              Frames, roles, Recorder
  visuals/resolve.ts            Spec → Visualisation; shared with the frame checker
  visuals/{sorting,searching,graphs,dp,strings,patterns,trees,numbers,
           structures,structures2}   Algorithm and structure generators
  visuals/react*.ts(x)          Thirteen React visualisation families
  sandboxRunner.ts              Worker script + React shim
  useSandbox.ts                 Sandbox lifecycle and 6s watchdog
  pythonPlayground.ts           Pyodide worker for the playground
  playgroundLanguages.ts        Nine profiles, starters, runtime notes
  playgroundHandoff.ts          Language mapping + sessionStorage handoff
  transpile.ts                  In-browser TypeScript/JSX
  monacoLoader.ts               Points Monaco at the local copy
  progress.ts, practiceProgress.ts, exampleLanguage.ts   Persistence + events
  useProgress.ts, usePracticeProgress.ts, useExampleLanguage.ts
  analytics.ts                  Typed event map
  trackTheme.ts                 Per-track class tables

public/judge/
  js-worker.js                  JS/TS judge worker
  js-harness.js                 Shared by the worker and Node tests
  python-worker.js              Pyodide judge worker
  python-playground-worker.js   Pyodide playground worker
  runtime.py                    Preamble + driver, split on a marker

scripts/
  copy-pyodide.mjs, copy-monaco.mjs      Asset pipeline
  verify-lesson-code.mjs                 Gate 1: every example, seven toolchains
  verify-visual-frames.ts                Gate 2: frames + dropdown policy
  verify-visual-playback.mjs             Gate 3: real browser, real clock
  try-runtime.mjs, try-judge.mjs         Dev helpers
  react-dom-env.mjs                      jsdom globals for React examples
```
