# DevKernel internals

How this project is built, in depth. For what it is, how to install it and how to run it, see [README.md](README.md). For the git and review workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

This document is organised by subsystem rather than by directory. The interesting boundaries in this codebase do not line up with folders: the practice console alone spans `content/practice`, `lib/judge`, `lib/runtimes`, `public/judge` and `components/practice`, and describing each of those directories in turn would take five passes to say one thing.

## Contents

1. [Design rules](#1-design-rules)
2. [Stack and configuration](#2-stack-and-configuration)
3. [The content data model](#3-the-content-data-model)
4. [Routing and rendering](#4-routing-and-rendering)
5. [The lesson rendering pipeline](#5-the-lesson-rendering-pipeline)
6. [In-browser execution: three engines](#6-in-browser-execution-three-engines)
7. [The interpreters in lib/runtimes](#7-the-interpreters-in-libruntimes)
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

## 1. Design rules

Five rules account for most of the decisions in the rest of this document. They are stated once here so later sections can refer back to them.

R1. Nothing on the page is remembered, everything is run. No `output` field in a lesson is written by hand, and no visualisation frame is drawn by hand. Section 15 describes the gates that enforce this.

R2. Content is data, not markup. The curriculum is TypeScript objects. That is what lets a script walk it, a type error catch a mistyped pattern identifier, and the lesson counts on the home page be derived rather than maintained.

R3. A wrong answer must never be reported as the learner's fault. The compiled-language runtimes are interpreters written for this project, not real toolchains. When one meets something it does not implement it reports `unsupported` and names what was missing. Reporting that as a failed test case would tell somebody their correct solution is wrong, and the console stops being trustworthy the first time it does.

R4. One place decides correctness. Runtimes report what a function returned or what it threw. They never compare. Comparison happens once, in TypeScript, in `lib/judge/compare.ts`, so that correct means the same thing in Python as it does in Rust.

R5. Everything runs in the visitor's browser. There is no execution backend. That is a security posture, a cost posture, and the constraint that shapes sections 6 to 8.

## 2. Stack and configuration

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16.3.0, App Router |
| React | 19.2.8 |
| Language | TypeScript 5, `strict: true`, `noEmit`, `moduleResolution: "bundler"`, path alias `@/*` mapping to `./*` |
| Styling | Tailwind CSS v4 through `@tailwindcss/postcss`, configured in CSS rather than in a config file |
| Syntax highlighting | Shiki 4, server-side only |
| Editors | Monaco 0.56 through `@monaco-editor/react` |
| Python | Pyodide 314, a CPython build compiled to WebAssembly |
| Icons | `lucide-react` |
| Theme | `next-themes`, class strategy, system default |
| Fonts | Geist and Geist Mono through `next/font/google` |
| Analytics | `posthog-js`, optional |
| Verification | `tsx` for TypeScript scripts, `jsdom` for React examples, `ws` for browser automation |

`tsconfig.json` sets `target: "ES2020"`, `jsx: "react-jsx"`, `isolatedModules`, and includes `.next/types` so that the generated route types participate in the type check.

`next.config.ts` contains one thing: a pair of rewrites that proxy `/ingest` and `/ingest/static` to PostHog. The asset host is derived from the ingest host by substituting the regional prefix, so the two cannot disagree about which region events go to.

There is no custom webpack or Turbopack configuration, no middleware, and no API routes.

## 3. The content data model

Defined in `content/types.ts`. The whole curriculum is an instance of it.

### The hierarchy

```
TrackDefinition
  ModuleDefinition
    Lesson
      Section
        CodeExample
          CodeVariant   (alternates)
        VisualSpec
        Pitfall
      InterviewQuestion
```

A `TrackDefinition` declares its modules. `content/tracks/index.ts` maps each definition through `toTrack`, which stamps `trackSlug` onto every module and sorts modules by `order`, then sorts the tracks themselves by `order`. Module files therefore never repeat which track they belong to, and the sort order is data rather than file order.

### Fields that carry a decision

`Track.mode` is `learn` or `revise`. A learn track assumes the language is new and takes the time it takes. A revise track assumes you have written it before and is cut into short self-contained topics. This changes the copy on the track page and the lesson budget shown beside it.

`Track.interviewPrep` decides whether a track carries interview questions at all. Rust and assembly are build-focused and trade that material for more time on real programs.

`Track.runnable` records whether the playground can execute the track's code.

`Track.accent` selects the colour pair the track is badged with. The values are a union, so a mistyped accent is a type error rather than an unstyled badge.

`Module.phase` is an optional grouping above the module level. A long track is a sequence of stages rather than a flat list, and the curriculum map draws a divider whenever the phase changes.

`ModuleStatus` is `available` or `coming-soon`, and appears on both modules and lessons.

### Code examples

A `CodeExample` has three mutually exclusive shapes:

- `js` and `ts` together, used only by the JavaScript and TypeScript track, which shows the two side by side.
- `code` plus `lang`, which is every other track.
- Either of those plus `alternates`, a list of `CodeVariant` objects holding the same program in other languages.

`output` is the program's printed output. `explanation` is prose about the example. `requires` names a toolchain the local verifier cannot stand up, such as a Spring application context; an example that declares it is reported as skipped with a reason rather than as a mismatch.

A `CodeVariant` may override `output` when a language legitimately prints differently, and may override `title` when the title names a file, since a module a TypeScript project keeps in `db/schema.ts` is `db/schema.js` in a JavaScript one. It may also carry its own `requires`.

`CodeLanguage` spans the executable languages plus the configuration, markup and wire formats a lesson needs to show: `xml`, `html`, `yaml`, `properties`, `sql`, `graphql`, `json`, `http` and `bash`.

### Visual specifications

A `VisualSpec` says what to show, never how it animates. It carries a `kind` from a closed union, an optional `algorithm` to start on, `lockAlgorithm` to hide the picker when a lesson is about one algorithm only, and optional starting data: `data` for numbers, `words` for tries and hash tables, `target` for searches, `lookup` for a trie.

`VisualKind` has three groups: algorithm families with a picker over several algorithms, the React rendering-model kinds, and individual data structures.

### Practice

`content/practice/types.ts` defines a parallel model for the problem sheet.

A `Problem` is not a statement plus an answer. It carries `signals`, the things in the statement and the constraints that tell you which pattern this is, and `approaches`, an ordered chain from brute force to optimal. `ApproachTier` is `brute-force`, `better` or `optimal`, and each approach carries its `intuition` in the order you would actually have the thought, a `walkthrough`, `time` and `space` with the variable named, implementations in `java` and `python`, and a `verdict` saying why you move on from it.

`PatternId`, `TopicId` and `Company` are curated unions rather than free text, so a typo is a build error instead of a filter chip that silently matches nothing.

A `Judge` holds everything the in-browser console needs: `entry`, the function your solution must define, named as the problem names it; `params` and `returns` drawn from `JudgeType`; an optional `compare` mode; and `cases`. `JudgeType` is deliberately small and concrete, because each entry has to be spelled out once per language the console offers. `tree` is the one indirection: it travels as a level-order array with `null` for a missing child, and each runtime rebuilds a node object from it before calling your function.

`JudgeCompare` is `exact`, `unordered`, or `unordered-nested`. The last exists for problems like three-sum, where the triples may come in any order and so may the numbers inside them.

### Preview modules

`content/comingSoon.ts` exports `createComingSoonModule`, which builds a `ModuleDefinition` with `status: "coming-soon"` and exactly one lesson, slug `coming-soon`. That lesson has a single section explaining that the module is being written, and carries the module's topic list in `takeaways`.

This is the mechanism behind publishing a syllabus up front, and it is also what the counting helpers key on. `getPlannedLessonCount` counts real lessons for available modules and topic entries for coming-soon ones. `getTrackStats` counts only lessons whose status is `available`. So a preview module contributes one route and zero live lessons, which is why the site can honestly say 518 lessons are live while 1,543 topics are published.

## 4. Routing and rendering

### The routes

| Route | Source |
| --- | --- |
| `/` | `app/(home)/page.tsx` |
| `/curriculum` | `app/curriculum/(index)/page.tsx` |
| `/curriculum/[trackSlug]` | `app/curriculum/[trackSlug]/page.tsx` |
| `/learn/[trackSlug]/[moduleSlug]/[lessonSlug]` | `app/learn/.../page.tsx` |
| `/playground` | `app/playground/page.tsx` |
| `/practice` | `app/practice/(index)/page.tsx` |
| `/practice/[problemSlug]` | `app/practice/[problemSlug]/page.tsx` |
| `/roadmap` | `app/roadmap/page.tsx` |
| `/visualize` | `app/visualize/page.tsx` |

### Static generation and honest status codes

Every dynamic route sets `export const dynamicParams = false` and enumerates its parameters with `generateStaticParams`. For lessons that is `getAllLessonRefs()`, which flattens every track, module and lesson.

Refusing unknown parameters at the routing layer is not tidiness. Each of these routes has a `loading.tsx`, which makes the response stream, and a streamed response has already committed a 200 by the time `notFound()` runs inside the component. Enumerating the parameters is what keeps the status code correct for an unknown slug.

### Route groups and the loading files

Every route has a skeleton that mirrors its own page, in `components/skeleton/Skeleton.tsx` primitives.

A `loading.tsx` wraps the page it sits beside and every nested layout below it. A single `app/loading.tsx` therefore stood in for every route on the site, so opening a lesson showed the home page's hero skeleton. The fix is route groups, which affect the file tree without affecting URLs:

- `app/(home)/loading.tsx` covers `/` alone rather than everything.
- `app/curriculum/(index)/loading.tsx` covers `/curriculum` without covering `/curriculum/[trackSlug]`, which has its own.
- `app/practice/(index)/loading.tsx` does the same for the problem sheet and an individual problem.

`LoadingRegion` announces the loading state once for assistive technology, and every individual `Skeleton` is `aria-hidden`, so a screen reader hears one message rather than a wall of empty boxes.

### Where the lesson shell lives

`app/learn/[trackSlug]/layout.tsx` renders `LessonShell`, and its placement is the point of the file. A page is replaced on every navigation; a layout is not. With the shell in the page, clicking a lesson unmounted the sidebar and mounted a new one, so its scroll position jumped to the top and any module the reader had expanded collapsed. As a layout under `[trackSlug]`, the `aside` is the same DOM node from one lesson to the next and keeps its scroll, while switching tracks does rebuild it, which is correct because its contents change completely.

`SidebarNav` compensates for the one thing remounting used to provide free. When the route moves into a different module, that module is added to the open set during render rather than in an effect, and nothing the reader opened themselves is closed.

### Server and client boundaries

The root layout wires up the fonts, the theme provider, the header and a `main`. `Header` is a server component that computes per-track lesson totals once; the interactive parts, `HeaderNav`, `HeaderProgress` and `ThemeToggle`, are separate client components.

The problem page is the clearest example of the split. Everything is rendered on the server and handed to `ProblemWorkspace` as slots. The client half only decides which pane is how wide and which tab is showing, so Shiki and the whole content tree stay out of the browser bundle.

Both editors are loaded with `next/dynamic` and `ssr: false`, each with a placeholder shaped like the code it is about to be replaced by.

## 5. The lesson rendering pipeline

`LessonView` renders the header, then a `SectionBlock` per section, then interview questions and the completion button. `SectionBlock` renders, in order: the heading, the prose, one `ComparisonPanel` per example, the visualisation if there is one, and the pitfalls.

### Prose

`components/lesson/Prose.tsx` implements a deliberately small inline dialect: `**bold**`, `*italic*` and `` `code` ``. It is not Markdown. Content is authored as data, so this exists to allow minimal emphasis without admitting raw HTML.

The tokenizer is one regular expression:

```
/(\*\*(?=\S)[\s\S]*?[^\s*]\*\*|\*(?=\S)[^*]*[^\s*]\*|`[^`]+`)/g
```

Three behaviours are deliberate. Bold is tested before italic, since a bold token also starts and ends with an asterisk. Bold and italic nest and may contain code, while code never nests, so asterisks and backticks inside a code span render literally. An emphasis delimiter must hug non-whitespace, which is what stops a lone operator in `2 * 3` from being paired up with a later asterisk.

### Code blocks

`CodeBlock` is an async server component. It calls Shiki's `codeToHtml` with both a light and a dark theme and `defaultColor: false`, which emits both palettes as CSS variables on every token. `globals.css` then chooses between them by theme class. Highlighting never happens in the browser.

Each block carries a language label and a per-language badge colour. Languages that are configuration, schema or wire formats stay neutral rather than competing for a colour with the program beside them.

### The language dropdown

This is the part with the most moving pieces.

`ComparisonPanel` decides the shape of an example. If it has both `js` and `ts`, they are shown side by side. Otherwise, if it has a primary `lang` and `code` and at least one alternate, every variant is highlighted on the server and passed to `ExampleLanguagePicker` as finished markup, keyed by language. Outputs and titles are passed the same way, because a title that names a file has to change with the language.

`ExampleLanguagePicker` then only re-parents markup that already exists. Switching language costs no network request and ships no highlighter.

The chosen language is stored globally in `localStorage` under `devkernel:example-language`, with a custom event so every panel on the page reacts at once. It is a preference, not a guarantee: an example that does not carry the chosen language falls back to its own primary rather than showing nothing.

`SAME_CHOICE` in the picker handles one wrinkle. A React lesson labels a component `jsx` and a plain module `javascript`, and their typed counterparts `tsx` and `typescript`. To a reader those are one decision, so choosing either member of a pair satisfies the other. Without it, picking TSX on a component would leave every non-component file in the same project showing JavaScript.

`EXAMPLE_LANGUAGES` in `lib/exampleLanguage.ts` is an ordered array rather than the keys of an object, because object key order is insertion order and would leave every dropdown sorted by whichever translation happened to be written first.

## 6. In-browser execution: three engines

Three engines, chosen by language. All three run in the visitor's browser.

### The JavaScript sandbox

Used for JavaScript and TypeScript in the playground, and for JavaScript and TypeScript in the practice console.

`lib/sandboxRunner.ts` builds a Web Worker whose source includes a small React-compatible runtime, so that JSX has something to compile against. `createElement` and `Fragment` behave exactly as React's do and produce the same plain element objects. `renderToString` is the playground's own renderer rather than react-dom: there is no reconciler, no state and no effects, which is why the hooks are defined only to fail with an explanation rather than a bare `TypeError`.

A worker rather than an iframe, because a `while (true)` is the single most common thing to write in a scratchpad and the page has to be able to terminate it. `lib/useSandbox.ts` arms a six-second watchdog and tears the worker down when it fires.

TypeScript is type-stripped in the browser by `lib/transpile.ts`, which dynamically imports the TypeScript compiler so it never enters bundles outside the playground. Whether to compile as `.tsx` is decided by a deliberately conservative regular expression, because compiling as TSX is not free: the angle-bracket type assertion and the bare generic arrow both stop parsing under it. A false negative is harmless, since the file then compiles as `.ts` exactly as before.

### Pyodide

Used for Python in both the playground and the practice console, through two different workers.

`public/judge/python-playground-worker.js` runs a script top to bottom and reports what it printed. `public/judge/python-worker.js` answers a different question: call one named function once per test case. They cannot be merged, because those are genuinely different protocols.

Both load `/pyodide/pyodide.mjs` and pass `indexURL: "/pyodide/"`. This is real CPython with the whole standard library, so `collections.Counter`, `heapq`, `bisect` and `functools.lru_cache` behave as they do in an interview.

Booting costs a download and a few seconds, so the worker is created once per page and kept. `lib/pythonPlayground.ts` allows 60 seconds for the boot and 15 for a run, and exposes `resetPython()` to throw the interpreter away when a clean one is wanted.

### The interpreters

C, C++, Go, Java and Rust in both tools, and x86-64 assembly in the playground, run on the code in `lib/runtimes`. Those are the subject of the next two sections.

In the playground they run in the page itself, loaded on demand by `runInBrowser` in `lib/runtimes/index.ts` so the initial bundle stays small. In the practice console they run on a bundled worker, `lib/judge/interpretedWorker.ts`, because a runaway solution has to be terminable.

## 7. The interpreters in lib/runtimes

About 7,900 lines implementing five languages, in the eight files this section covers; `lib/runtimes` is 8,831 lines in total, the rest being the assembler in section 8. The contract is in `lib/runtimes/types.ts` and is short: these are interpreters written for this site, they cover the subset each track teaches, and they are required to fail loudly on anything outside it. `UnsupportedError` names what was missing. A silently wrong answer is the one outcome that is not allowed.

### Shared machinery

`lang.ts` holds the lexer, the common AST, a Pratt expression parser and a tree-walking evaluator. The lexer handles object-like `#define` macros, substituting them once the whole file has been read.

Integers carry their width and signedness, so overflow behaves the way the language being taught says it does: Rust panics, C++ and Java wrap.

`parser.ts` is one parser with four dialects. Rust, C++ and Java share almost all of their expression grammar, so only declarations, loops and type syntax branch. Go earns its own section: the type follows the name, one keyword spells four kinds of loop, and there are no semicolons at all. That last one is handled before parsing starts, by `goSemicolons`, so the statement parser can still assume them.

`stdlib.ts` holds the parts of a standard library that are the same in every language: sorting, comparators, bounds checks, and the collection operations every dialect exposes under a different name. Adding a language means writing a table of names rather than another heap.

### The front-ends

`dialects.ts` supplies Rust, C++ and Java. Formatting is per-language on purpose, because the same double prints three different ways: Rust's `{}` gives `1`, C++'s stream insertion gives `1` but truncates to six significant digits, and Java's `println` gives `1.0`. Getting this wrong would quietly teach the wrong thing.

`cdialect.ts` supplies C. Two decisions are visible from a program. Pointers are arrays: there is no address space, so `int *p` holds a sequence and `p[i]` indexes it, which covers arrays, strings and buffers from `malloc` and stops short of pointer arithmetic across objects, which fails loudly rather than guessing. And `sizeof` tells the truth, returning real byte sizes, so `malloc(n * sizeof(int))` allocates four times the slots the program will use. Wasting slots costs nothing and keeps `printf("%zu", sizeof(int))` honest.

`godialect.ts` supplies Go. Three behaviours a program can observe are documented in the file. Printing a map sorts its keys, as real Go has done since 1.12. Ranging over a map is insertion-ordered here where Go deliberately randomises it, which is the one divergence that could hide a bug; it is unavoidable without a seeded shuffle, which would trade a hidden bug for a flaky one, so the lessons teach the rule instead. And `append` grows in place, which keeps `xs = append(xs, v)` linear; Go's own aliasing after `append` is unspecified, so no correct program may rely on it either way.

### Limits

`OutputSink` enforces two budgets that a program cannot defeat: a cap on how much it may print, 200,000 characters by default, and a budget of interpreter steps, 20 million by default. Exceeding either raises a `ProgramError` naming the reason, and the step limit's message says outright that this usually means an infinite loop. The practice console uses a smaller step budget than the playground, because it runs the same function once per case and a runaway loop should be reported quickly.

## 8. The x86-64 assembler and emulator

`lib/runtimes/asm.ts`, about 940 lines, covering the NASM subset the assembly track teaches.

What is faithful: the 64, 32, 16 and 8-bit register file, including the rule that a 32-bit write zeroes the upper half; the legacy high-byte registers; two's complement arithmetic at every width; the ZF, SF, CF, OF and PF flags and the conditional jumps that read them; the full base plus index times scale plus displacement addressing formula; a real downward-growing stack; and the Linux `write`, `read` and `exit` syscall convention.

What is not: this executes decoded instructions rather than encoded bytes. There is no instruction-length or opcode-byte modelling. Everything the track teaches about semantics holds; nothing about encoding does. The file says so at the top, which matters because a learner cannot otherwise tell which half they are looking at.

The machine is one mebibyte of address space based at `0x400000`, with the stack top sixteen bytes below the end.

## 9. The practice judge

### The protocol

Every language reduces to the same three steps: take the source, call one named function once per test case, and hand back either a JSON-encodable value or the text of the exception it threw.

Comparing those values against the expected ones is deliberately not the runtime's job. `toSpec` in `lib/judge/grade.ts` strips the expected answers out before anything crosses a worker boundary, so a runtime does not have them and could not be trusted to report honestly if it did.

### Deciding correctness

`lib/judge/compare.ts` is the only place a value is called right or wrong, and it runs on the main thread over JSON values. Four languages comparing answers four times would be four chances for correct in Python and wrong in Java, and on a practice site a false failure on a learner's working code is the most expensive bug there is.

`canonical` rearranges a value according to the compare mode, so the equality check stays a plain structural walk. `compareValues` provides a total order over the JSON values a problem can produce; the ordering itself is arbitrary and exists only to make `unordered` deterministic.

Doubles are compared with a tolerance of `1e-9` scaled by magnitude, integers exactly. So `0.30000000000000004` passes a `double` problem and nothing quietly passes an `int` one. `null` and `undefined` are treated as the same absence, because Python's `None` arrives as one and a JavaScript function that falls off its end returns the other.

### Running

`lib/judge/runner.ts` owns the workers. It is a plain class rather than a hook, because a worker is a live thread with its own lifetime and the page happens to be one of its observers. `lib/judge/useJudge.ts` is a thin React subscription over it.

Three worker kinds: `python`, `javascript` and `interpreted`. The first two are hand-written files served from `public/`; the third is bundled, because it imports the TypeScript interpreters.

Two timeouts, because the two waits are nothing alike. Booting Pyodide legitimately takes seconds, so it gets 60. A solution that has not returned in 10 seconds is a loop that never will.

Workers are kept between runs. Paying Pyodide's boot on every Run would ruin the edit-and-rerun loop practice depends on.

A `generation` counter is bumped on every run and on `stop`, so a message arriving from a terminated worker is ignored rather than attributed to the current run.

Individual case results are reported as they finish, not only in a batch at the end. That is what makes a timeout useful: four passed and then it hung on the fifth says something, where a bare timeout says nothing. The watchdog keeps whatever finished and reports which case it stopped on.

TypeScript is transpiled before it is sent, and type diagnostics are kept as stdout lines rather than treated as fatal. TypeScript still emits usable JavaScript for most complaints, and a type error visible beside a passing run teaches more than a refusal to run.

### The interpreted path

`lib/judge/interpreted.ts` generates no driver program. The interpreters are synchronous and live in the same process, so the source is parsed once and the entry function is then called directly, once per case, with arguments converted to interpreter values and the result converted back.

That buys three things a generated `main` would not: per-case error isolation, no escaping bugs at the boundary, and the ability to tell a loop that threw on case four apart from a file that does not compile.

Rule R3 governs this file. An `UnsupportedError` stops the run with status `unsupported` and names what was missing. It is never a failed case.

### The Java harness

`lib/judge/javaHarness.ts` is a secondary affordance, not the grading path. Java is graded on the interpreter like the other four. What this builds is a single self-contained `Main.java` with the cases inlined, the tree inputs rebuilt, and the results printed and counted, so you can run the same tests on a real JDK with one command. The console offers it as "Copy a runnable Main.java".

It compares by rendering both sides to the same JSON text. Java's primitive arrays make structural equality across `int[]`, `char[][]` and `String` a pile of overloads, whereas rendering to text is one method per type and no chance of `Arrays.equals` being called where `deepEquals` was meant. It canonicalises with the same function the browser uses, so passing in Java means what it means everywhere else.

### Stubs and profiles

`lib/judge/languages.ts` holds a profile per language: the Monaco language id, the filename shown on the editor tab, the tab size, and a one-line note under the dropdown saying what Run will do. `buildStub` writes the starting signature in each language from the problem's `Judge`.

Python leads the ordering because it reaches a first answer fastest and reads most like whiteboard pseudocode.

### The browser-side harnesses

`public/judge/js-harness.js` and `public/judge/runtime.py` are counterparts held to the same rule: report what the function returned or what it threw, and never decide whether that was right.

`js-harness.js` is a plain script rather than a module, so a worker can pull it in with `importScripts` and a Node test can evaluate the same file and call the helpers directly. The code that grades you is the code that was tested. Its `TreeNode` definition is prepended to your code rather than defined in the harness, because it has to exist in the scope your solution is compiled into.

`js-worker.js` replaces the five console methods so debug prints survive the run, and recovers the entry point through a trailing expression that uses `typeof` to short-circuit, so a misspelled function name reports as a missing function rather than as a `ReferenceError` from nowhere. It also hands back `Solution`, because pasting the class from the solutions below the console is a reasonable thing to do and should work.

`runtime.py` is split at a `# --- DRIVER ---` marker: everything before it runs before your code, everything after drives the cases.

## 10. Visualisations

### The rule

Generators are ordinary implementations of the algorithm with `emit` calls threaded through them. The frames are a side effect of the algorithm actually executing. Remove the emits and a correct algorithm remains; break the implementation and the animation is visibly wrong.

A frame is a complete snapshot rather than a delta. That costs memory on a large input and buys the thing a learner needs most: stepping backwards, which a delta stream cannot do without replaying from the start.

### Frame shapes

Eight, defined in `lib/visuals/types.ts`: `array`, `tree`, `sequence`, `heap`, `buckets`, `graph`, `matrix` and `filetree`.

Every frame carries a `note`, one sentence saying what this step did, which doubles as the screen-reader text. Most carry `stats`, running tallies shown beside the animation, accumulated by `Recorder.bump`.

Frames are self-describing. `TreeNode` carries its own `depth` and `x`, and `GraphNode` its own coordinates, so layout is computed in the generator rather than recomputed by the renderer on every frame. `FileTreeFrame` is a flat list of rows with a depth each, because a project layout is read the way `tree` prints it and the interesting comparison is between two listings.

`MatrixFrame.cells` holds display strings rather than numbers, because a dynamic-programming table often wants a blank for not computed yet, which no number can honestly stand in for.

### Roles

`Role` is the vocabulary a highlight can use, and it is deliberately segmented. The algorithm roles are `compare`, `swap`, `pivot`, `sorted`, `active`, `window`, `discarded`, `found`. Reconciliation has its own, because a node is kept, updated, moved, created or destroyed, and borrowing "swapping" for those would put the wrong word in the legend. Project layout adds `created` and `deleted`, since a file that did not exist before is created, not mounted. Concurrent rendering adds `suspended` and `stale`. The rendering-model module adds `server` and `client`.

`components/visuals/roles.ts` maps roles to colours, written as complete class literals so Tailwind's scanner finds them. Colour is never the only signal: every frame also carries its sentence, and the roles are distinguishable by lightness as well as hue.

### Dispatch

`lib/visuals/resolve.ts` turns a `VisualSpec` into frames. `FAMILIES` maps each family kind to its algorithm table and a fallback, and `Visual` reads the same tables to build the picker, so a kind cannot offer an option the resolver cannot run. `runStructure` covers the individual data structures.

This dispatch lives in `lib/` rather than in the component because it has two callers: the component that renders a visualisation, and the frame checker that verifies every one of them. A checker with its own copy of the dispatch would be checking its own copy.

`resolveVisual` describes the initial state only. The picker and the shuffle button move a visualisation somewhere it does not describe, which is why the checker also runs every entry in every table directly.

Two details in it are pedagogical. A search target defaults to the second-to-last value rather than the midpoint, because binary search would find the midpoint on its first look and the animation would be over before it showed anything. And `missingTarget` finds a value inside the array's range that is not in it, for demonstrating a failed search.

### Rendering

`VisualPlayer` is the shell every visualisation shares: transport controls, a scrubber, the current step's sentence and the tallies. Because frames are precomputed, stepping backwards is an index change rather than a replay. Playback stops at the end instead of looping, because a loop restarts the explanation mid-thought. Four speeds are offered, from 1200ms to 120ms per frame.

`canvases.tsx` draws each frame kind as SVG. Every drawing is fitted into a viewport of bounded height, between 150 and 300 pixels, with `preserveAspectRatio="xMidYMid meet"`. Two failures pull in opposite directions: told only to fill its container, an SVG blows a four-node tree up to the width of the page; given no cap, a deep trie grows until the reader has to scroll, which defeats the point of watching the whole thing change at once.

## 11. Client state and persistence

There are no accounts. Everything a visitor accumulates lives in `localStorage` in their browser.

| Key | Holds |
| --- | --- |
| `devkernel:completed-lessons` | Lesson keys of the form `track/module/lesson` |
| `devkernel:solved-problems` | Problem slugs |
| `devkernel:attempt:<slug>:<language>` | One editor draft, per problem and per language |
| `devkernel:practice-language` | Which language the console is set to |
| `devkernel:solution-language` | Which language the solutions are read in, Java or Python |
| `devkernel:example-language` | Which language lesson examples are shown in |
| `devkernel:playground-handoff` | Code sent from a lesson to the playground |

Four of these modules share one shape on purpose: a getter and setter pair, a custom event so several components on one page stay in step, and a `storage` listener so two tabs do too. There is one way this codebase shares a client-side preference rather than several.

Lesson progress and practice progress are kept separate deliberately. A lesson is read once; a problem is worth re-solving a month later. Conflating them would make "reset" ambiguous.

`lib/progress.ts` carries a one-time migration chain for two earlier storage keys from previous names of the project. The renamed key carried no format change and moves across verbatim; the oldest key predates tracks, so its two-segment entries are rewritten with the `js-ts` track prefix they implied.

Every read and write is wrapped in `try`/`catch`. A full or disabled store is not worth interrupting a solve over.

The hooks that expose this state read `localStorage` into React state on mount and then subscribe. That is the sanctioned effect pattern for syncing with a source React does not own, and the one place it trips a lint rule carries an explanatory disable comment rather than a restructure.

## 12. Analytics

Optional, and off unless a key is present and the build is a production one.

`instrumentation-client.ts` runs after the document loads but before React hydrates, so a pageview is recorded even if the visitor leaves before the page becomes interactive. With no `NEXT_PUBLIC_POSTHOG_KEY` in the environment, PostHog never initialises and nothing is sent, so a local checkout, continuous integration and a fork are all silent without anyone remembering to turn something off.

A key alone is not enough under `next dev`. Development also needs `NEXT_PUBLIC_POSTHOG_DEV=1`, for two reasons that are easy to discover the hard way. A dev server runs on a machine that is regularly on a flaky network, behind a VPN or offline, and a send that cannot reach PostHog surfaces as a proxy failure printing an `AggregateError` that lists every address the host resolves to — both families, several screens per pageview. And the sends that do succeed are indistinguishable from a real reader's, so browsing the site while building it skews the data the analytics exist to provide.

`next.config.ts` gates the `/ingest` rewrites on the same condition, and that symmetry is the point rather than tidiness. A proxy mounted while the SDK is off is not inert: it forwards whatever reaches `/ingest` — a stray request, a crawler, a browser extension — so a checkout whose owner believes analytics is off would still open outbound connections to PostHog. The two reads in `instrumentation-client.ts` have to stay literal `process.env.NEXT_PUBLIC_…` expressions, because Next inlines those textually at build time and reading them through a shared helper would leave the client with `undefined` — which is why the condition is written out twice rather than factored into one function.

Five configuration decisions are load-bearing:

`api_host: "/ingest"` sends events same-origin, proxied by the rewrites in `next.config.ts`. The audience for this site is developers, and PostHog's domains are on every blocklist worth the name, so measuring directly would under-count exactly the people the course is for. `ui_host` is set separately so links from the SDK back into PostHog still work.

`rewriteRequestPath` strips trailing slashes. PostHog's own paths end in a slash, and Next answers a trailing slash with a 308 to the slash-less form, which for a POST drops the body and loses the events. The usual fix disables canonical redirects site-wide and would leave every lesson reachable at two URLs, so the request path is changed instead and the site's own URLs are left alone.

`capture_pageview: "history_change"` exists because this is a single App Router application. After the first load, moving between lessons only pushes history state, so the default would record one visit per session no matter how much of the curriculum someone read.

`defaults` is pinned to a dated key, because `posthog-js` ships breaking default changes under those and an upgrade could otherwise quietly change what is captured.

Session replay blocks `.monaco-editor` and `[data-ph-no-capture]`, and masks all inputs. Monaco renders what you type as ordinary DOM text, so without this, replay would ship half-written interview solutions off the machine. Blocked rather than masked: a grey box is enough to show that someone was editing.

`lib/analytics.ts` declares the handful of custom events as a typed map. Autocapture already records clicks and pageviews already record which lesson was open, so nothing here restates what a pageview would say. What it adds is what a URL cannot tell you: whether a reader ran anything, whether an attempt passed, and whether the language dropdown is actually used. The map exists because event names drift the moment they live as string literals at call sites, and a misspelled name in PostHog is a silently empty chart rather than an error.

## 13. Styling and theming

Tailwind v4, configured in `app/globals.css` rather than in a JavaScript config file. `@custom-variant dark` binds the dark variant to a `.dark` class, which is what `next-themes` toggles.

Colours are defined twice as CSS custom properties, once on `:root` and once on `.dark`, then exposed to Tailwind through an `@theme` block that maps each to a `--color-*` name. Components therefore write `bg-surface` and `text-muted`, and neither theme is the special case.

Two constraints shaped the palette. Track colours double as badge text on their own soft background, so each has to clear a 4.5 to 1 contrast ratio against it, which rules out the bright yellows and cyans several of the languages use as brand colours. And the difficulty colours sit both on their own soft background and directly on `--surface`, so they are held to the same rule in two places.

The brand gradient is three stops, restated per theme rather than derived, because a fixed gradient cannot invert and the logo has no background to sit on.

Code surfaces track the theme rather than being fixed dark, because the light Shiki theme paints near-black tokens that would be invisible on a dark block.

Two accessibility behaviours: `prefers-reduced-motion` disables both smooth scrolling and the skeleton sweep, and `html { overflow-x: hidden }` stops one long token in a heading from side-scrolling the whole page instead of just its own container.

The skeleton sweep is a background-position animation over a gradient rather than a moving child element, so a skeleton is one empty div with no layout cost and nothing to clean up.

## 14. The asset pipeline

Two dependencies cannot be imported and have to exist at a URL, because both fetch their own payloads over HTTP at load time.

`scripts/copy-pyodide.mjs` copies five files out of `node_modules/pyodide` into `public/pyodide`: `pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`, `python_stdlib.zip` and `pyodide-lock.json`. The package also ships source maps, demo pages, module variants that are not loaded and type declarations, which together are most of its weight.

`scripts/copy-monaco.mjs` copies the editor into `public/monaco`, skipping `nls/lang`, which is 1.7 MB of translated editor strings the loader only requests when a locale is named, and nothing here names one.

`lib/monacoLoader.ts` then repoints `@monaco-editor/react` at that copy. Its default is to fetch the editor from a public CDN, which has two problems. The playground and the practice console stop working the moment that CDN is unreachable, and on those pages the editor is not an enhancement, it is the page. And the default is pinned to its own version, so the browser was running an editor a minor release behind the one `package.json` declares and the types describe.

Both directories are gitignored and both copiers run from `predev` and `prebuild`, so a fresh clone works without a separate command. They are copies of a pinned dependency's build output, which is why they are generated rather than committed.

## 15. Verification gates

### The fast gate

```
npm run verify
```

`next typegen`, then `tsc --noEmit`, then `eslint .`, then the frame checker. A couple of minutes.

`.githooks/pre-commit` runs exactly this. It is not enabled automatically, since git does not pick up a hooks directory on its own:

```
git config core.hooksPath .githooks
```

### The frame checker

`scripts/verify-visual-frames.ts` runs every visualisation and checks the frames are well formed. It catches three things nothing else does.

A role or marker pinned to an index the array does not have. The canvas renders those silently, the highlight simply does not appear, so a pointer that stops being drawn looks like an algorithm that stopped moving it.

A `visual` spec naming an algorithm no table has. The component falls back to the family default, and with `lockAlgorithm: true` the picker is hidden, so a typo shows a different algorithm under the lesson's own title with nothing on screen to say so.

A generator that emits one frame or none. There is nothing to animate and the player has no way to say so.

It also checks per-kind invariants: unique node identifiers, parents that exist in the same frame, matrix rows of equal width, label counts matching row and column counts, and a file-tree row never indenting more than one level below the row above it, since a deeper jump means a directory row was never emitted and the connectors would attach to the wrong parent.

Beyond frames, it enforces where the language dropdown may appear. `DROPDOWN_LANGUAGES` pins the permitted languages per track, and `LANGUAGE_PAIR` requires that a primary and its alternate are the two spellings of the same thing. The failure worth catching is not that a dropdown appeared but that a React example offered to be read in Python, or that a JSX primary sat beside a `typescript` alternate, which would show a component highlighted as a plain module and break the carry-over described in section 5.

It runs every entry in every table, not only the ones a lesson points at, because the picker can reach all of them.

### The lesson-code gate

```
npm run verify:code [track] [module]
```

`scripts/verify-lesson-code.mjs` is the gate that makes the central rule true.

It compiles the content tree with `tsc` to CommonJS in a temporary directory and loads it, patching `Module._resolveFilename` to resolve the `@/` alias, which `tsc` leaves untouched in the emit. That is simpler than adding a bundler, and it means the script checks the same objects the site renders.

Two language sets, and the distinction matters. `RUNNABLE` covers a lesson's primary example and is deliberately short: `java`, `python`, `go`, `tsx`, `jsx`. Turning the full set on there would also start checking the C++ and Rust tracks, whose examples are written against particular build invocations this runner does not reproduce, such as a warning flag or a preprocessor-only run. `TRANSLATABLE` covers translations and is the whole set, because a translation is a plain program written to be run exactly this way.

Each language gets a runner. Java snippets are wrapped in the smallest class that will run them, unless the example already declares a type. Go examples are not wrapped at all, because Go refuses to compile an unused import so a snippet cannot be given a fixed preamble; each gets its own directory so two `main` declarations never collide. C++ builds with `g++ -std=c++20 -O0`; Rust with `rustc --edition 2021`; assembly with `nasm -f elf64` and a bare `ld`, so examples exit through the syscall rather than through `main` returning. TypeScript runs through the `tsx` loader, which type-strips rather than type-checks, since the repository's own `tsc --noEmit` is what checks types and a second full check per example would make the script unusable.

React examples are the intricate case. They cannot use the system temporary directory, because `import React from "react"` resolves by walking up from the file and esbuild finds the JSX setting by walking up for a tsconfig, so a file in `/tmp` gets a missing-module error and no JSX transform. They run from `node_modules/.devkernel-verify`, which git, tsconfig and ESLint already ignore.

`reactRoot` decides what an example means to show, by a contract the tracks follow. An example that declares `App` renders `App`. An example that prints nothing of its own renders its last top-level component. An example that prints for itself and has no `App` renders nothing, because it is inspecting components rather than displaying them. An example that calls `createRoot` renders nothing here either, because it is driving React on a real DOM and printing what it means to show. Requiring a lowercase letter in the name keeps a capitalised constant from being taken for a component.

`scripts/react-dom-env.mjs` installs a jsdom environment through node's `--import`, so it is in place before the example module evaluates. It overwrites rather than fills gaps for names Node also defines, because Node's own `FormData` throws when handed a jsdom form. It also sets `IS_REACT_ACT_ENVIRONMENT`.

Anything the harness adds goes after the example, because module imports are hoisted either way and appending keeps every line number in a diagnostic equal to the line the learner is reading.

`normalise` removes the differences that are not worth failing on: trailing whitespace, carriage returns, and the scratch directory paths that appear in compiler diagnostics and stack traces. Each language's temporary filename is rewritten to the name a learner would use, so an error quotes `main.go` rather than a path that differs on every run.

A non-zero exit is not a failure. Several lessons teach an error message on purpose, and those examples are supposed to fail. The output is the whole contract.

Examples with no `output` are skipped, because they are illustrations rather than promises. Examples with `requires` are skipped and the reason is printed, because a suite that is permanently eight-red is a suite people stop reading.

### The playback gate

```
npm run verify:visuals
```

`scripts/verify-visual-playback.mjs` starts headless Chromium, connects over the DevTools protocol with `ws`, presses Play on every visualisation and measures whether the animation advances. It needs a server already running and takes several minutes.

It exists for a failure the frame checker structurally cannot see. Playback is a chain of timeouts where arriving at a frame is what schedules the frame after it. Drop the frame index from the effect's dependency list and the chain is never re-armed: the frames are still perfect, and the animation advances one step and stalls. Nothing type-checks or lints its way to that, and no assertion about frame contents can observe it.

The file carries a warning worth repeating: never add `--virtual-time-budget` to the Chromium flags. It fast-forwards `setTimeout`, which is the exact mechanism under test, and with it the run finishes instantly and reports success whether or not playback works. Every measurement here is deliberately real elapsed time.

### Continuous integration

`.github/workflows/verify.yml`, on every push and pull request, in two jobs.

`checks` is the fast half: `npm run verify` and `npm run build`. It finishes in a couple of minutes and is the one that gates a pull request.

`lesson-code` is the slow half: `npm run verify:code` across every track, which takes around ten minutes. It installs the toolchains first, and the versions are pinned rather than defaulted. The workflow records why: the runner's default JDK printed `1.15292150460684698E18` where every lesson says `1.152921504606847E18`, because `Double.toString` switched to the shortest round-tripping decimal in JDK 19. A recorded output is only reproducible on the toolchain it was recorded against. NASM is installed explicitly because the image does not carry it, and a missing assembler is indistinguishable from a program that printed nothing.

### Development helpers

`scripts/try-runtime.mjs` runs a source file through one of the browser language runtimes from Node, so iterating on an interpreter does not mean starting the dev server and clicking into the playground. `scripts/try-judge.mjs` grades a solution file against a problem's real cases through the same path the browser uses. Both exit with a status that composes with a shell script.

## 16. Known rough edges

Stated plainly, because a document that only lists what works is not much use for finding your way around.

Go map iteration is insertion-ordered here where real Go randomises it. A program that depends on map order is wrong in Go and will look right in this playground. The alternative, a seeded shuffle, would trade a hidden bug for a flaky one, so the lessons teach the rule instead.

The assembler models semantics, not encoding. Nothing about instruction length or opcode bytes is faithful.

The compiled-language runtimes cover a subset. They report `unsupported` and name what was missing rather than guessing, which is the correct behaviour, but it does mean a solution using an unimplemented library corner cannot be graded in that language.

`RUNNABLE` in the lesson-code verifier excludes C++ and Rust for primary examples. Those tracks' examples are written against particular build invocations the runner does not reproduce. Their translations are still checked, because those are plain programs.

`CMakeLists.txt` at the repository root declares a `shapes` project whose `src/` and `include/` directories do not exist. It was added in a C++ content commit and appears to be a stray file rather than part of the build.

The Next.js and Angular tracks are registered and route correctly, but every one of their modules is a preview. They carry no examples, so none of the language-dropdown machinery applies to them yet.

## 17. File map

```
app/
  layout.tsx                      Fonts, theme provider, header, metadata, viewport
  globals.css                     Tailwind v4 config, both palettes, skeleton animation
  icon.svg, apple-icon.png,       Favicon set
    favicon.ico
  (home)/                         "/" and its skeleton
  curriculum/(index)/             "/curriculum" and its skeleton
  curriculum/[trackSlug]/         One track, with the module map
  learn/[trackSlug]/
    layout.tsx                    LessonShell, kept mounted across lessons
    [moduleSlug]/[lessonSlug]/    The lesson route
  playground/                     The editor page
  practice/(index)/               The problem sheet
  practice/[problemSlug]/         One problem, as a workspace
  roadmap/                        The programme above the level of a track
  visualize/                      The gallery

components/
  brand/DevKernelMark.tsx         The logo, gradient from the theme tokens
  layout/                         Header, nav, progress, lesson shell, sidebar
  lesson/                         LessonView, SectionBlock, CodeBlock, Prose,
                                  ComparisonPanel, ExampleLanguagePicker,
                                  PitfallCallout, InterviewQA, MarkCompleteButton
  curriculum/CurriculumMap.tsx    Modules and phases for a track
  practice/                       ProblemBrowser, ProblemWorkspace, SolveConsole,
                                  SolveEditor, SolveResults, ApproachPanel,
                                  SolutionLanguagePane, split-pane helpers
  playground/                     PlaygroundClient, PlaygroundEditor, ConsolePanel
  visuals/                        Visual, VisualPlayer, canvases, roles, gallery
  skeleton/Skeleton.tsx           Skeleton primitives and LoadingRegion
  theme/                          Theme provider and toggle

content/
  types.ts                        The curriculum data model
  comingSoon.ts                   Preview modules for unwritten syllabus
  roadmap.ts                      The programme, derived from real track data
  tracks/index.ts                 Registration, lookup and counting helpers
  tracks/<track>/                 One directory per track, one file per lesson
  practice/                       Problem model, problems, patterns, topics

lib/
  runtimes/                       lang, parser, dialects, cdialect, godialect,
                                  stdlib, asm, types, index
  judge/                          runner, grade, compare, interpreted,
                                  interpretedWorker, javaHarness, languages,
                                  format, attempts, types, useJudge
  visuals/                        types, resolve, and one file per algorithm family
  sandboxRunner.ts                The JavaScript worker and its React shim
  transpile.ts                    In-browser TypeScript and JSX compilation
  pythonPlayground.ts             The Pyodide worker for the playground
  playgroundLanguages.ts          Language profiles and starter programs
  playgroundHandoff.ts            Sending lesson code to the playground
  monacoLoader.ts                 Repoints Monaco at the local copy
  progress.ts, practiceProgress.ts, exampleLanguage.ts
                                  localStorage-backed state, one shape each
  useProgress.ts, usePracticeProgress.ts, useExampleLanguage.ts, useSandbox.ts
                                  The React subscriptions over them
  analytics.ts                    The typed event map
  trackTheme.ts                   Per-track colour class literals

public/judge/
  js-harness.js                   The JavaScript grading helpers
  js-worker.js                    The JavaScript console worker
  python-worker.js                The Python console worker
  python-playground-worker.js     The Python playground worker
  runtime.py                      The Python grading driver

scripts/
  verify-lesson-code.mjs          Runs every example and diffs its output
  verify-visual-frames.ts         Runs every visualisation and checks the frames
  verify-visual-playback.mjs      Drives a browser and checks playback advances
  react-dom-env.mjs               jsdom environment for React examples
  copy-pyodide.mjs, copy-monaco.mjs
                                  The asset pipeline
  try-runtime.mjs, try-judge.mjs  Development helpers

.githooks/pre-commit              Runs npm run verify
.github/workflows/verify.yml      The two CI jobs
instrumentation-client.ts         PostHog initialisation
next.config.ts                    The /ingest rewrites
```
