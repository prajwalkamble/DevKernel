# DevKernel

**A from-scratch software-engineering curriculum where every line of output on the page was produced by running the code.**

Live at **[devkernel.vercel.app](https://devkernel.vercel.app)**

![The DevKernel home page](docs/screenshots/home.png)

Every screenshot in this README is one page cut on a diagonal: light theme on the left, dark theme on the right.

---

## Table of contents

- [What this is](#what-this-is)
- [Why it exists](#why-it-exists)
- [What is in it](#what-is-in-it)
- [The tracks](#the-tracks)
- [The site](#the-site)
- [One algorithm, ten languages](#one-algorithm-ten-languages)
- [Getting started](#getting-started)
- [npm scripts](#npm-scripts)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Verification](#verification)
- [Adding content](#adding-content)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Further reading](#further-reading)
- [License](#license)

---

## What this is

DevKernel is a Next.js 16 application that serves a large, hand-written curriculum in software engineering, plus four interactive tools that run entirely in the browser:

- **Lessons** — long-form prose with worked examples, pitfalls, takeaways and interview questions.
- **A playground** — write and run nine languages in the browser, with no server round-trip.
- **A practice console** — solve problems in eight languages and have them graded against real test cases.
- **A visualisation gallery** — step forwards and backwards through algorithms and data structures.

The curriculum is not markdown. It is **TypeScript data** — objects containing prose, code and the output that code produces — which is what makes the central claim enforceable: `scripts/verify-lesson-code.mjs` compiles and runs every example against a real toolchain and diffs it against what the lesson promises. A mismatch is a failed build.

## Why it exists

Most programming courses fail in one of two ways, and they are opposite failures.

The first is the **tutorial that never goes deep**. It shows you `for i in range(n)` and moves on. It never tells you that integer division rounds toward zero in six languages and toward negative infinity in Python, so you will write a binary search that works on every test you try and breaks on the one with a negative midpoint.

The second is the **reference that assumes the floor**. It starts at arrays. People who already know what a variable costs find it excellent; everyone else bounces off it and concludes they are bad at this.

There is a third failure that both share, and it is the one this project was built to fix: **the output on the page is usually typed by hand**. Someone wrote the code, believed they knew what it would print, and typed that in. Most of the time they were right. The rest of the time a learner spends an hour discovering that the reference material is wrong.

That last problem is tractable in a way the other two are not. You can just run the code — so this project does, on every push.

## What is in it

Figures below are counted from the content tree, not maintained by hand. Regenerate them by walking `content/tracks` (see [Verification](#verification) for the scripts that do the same walk).

| Metric | Count |
| --- | --- |
| Tracks | 12 |
| Modules | **71 live** of 203 declared |
| Lessons live | **518** |
| Lessons + published syllabus topics | 1,543 |
| Sections | 2,321 |
| Code examples | 1,752 |
| Verified translations (`alternates`) | 939 |
| Embedded visualisations | 61 |
| Pitfall callouts | 1,074 |
| Interview questions | 1,826 |
| Practice problems | 18, with 116 test cases and 40 approaches |
| Body prose | ~283,000 words (~733,000 including pitfalls, takeaways and interview answers) |
| Example code | ~45,000 lines, plus ~44,000 lines of translations |

Every track publishes its **full syllabus up front**. A module that has not been written yet still declares its eight topics, renders as a preview lesson, and is counted honestly as "coming soon" rather than hidden.

## The tracks

| # | Track | Slug | Mode | Modules (live/total) | Lessons live | Per lesson | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Data Structures & Algorithms | `dsa` | learn | 25 / 37 | 200 | 25–45 min | The deepest track; owns the visualisations and the problem sheet |
| 2 | System Design: SQL, LLD & HLD | `system-design` | learn | 0 / 29 | 0 | 25–45 min | Syllabus published |
| 3 | JavaScript & TypeScript | `js-ts` | learn | 12 / 12 | 73 | 20–40 min | Complete; runs in the playground |
| 4 | React | `react` | learn | 15 / 15 | 115 | 20–45 min | Complete; JSX/TSX translations |
| 5 | Next.js | `nextjs` | learn | 0 / 14 | 0 | 25–40 min | Syllabus published |
| 6 | Angular | `angular` | learn | 0 / 14 | 0 | 25–40 min | Syllabus published |
| 7 | Rust | `rust` | learn | 1 / 14 | 6 | 25–40 min | Build-focused, no interview prep |
| 8 | Go | `go` | learn | 1 / 10 | 6 | 25–40 min | Build-focused; runs in the playground |
| 9 | Assembly (x86-64) | `assembly` | learn | 1 / 14 | 5 | 25–40 min | NASM, Intel syntax, Linux |
| 10 | C++ | `cpp` | learn | 14 / 14 | 98 | 25–40 min | Complete |
| 11 | Java | `java` | **revise** | 0 / 12 | 0 | 10–15 min | Short standalone refreshers |
| 12 | Spring Boot | `spring-boot` | learn | 2 / 18 | 15 | 25–40 min | In progress |

A `learn` track assumes the language is new and takes the time it takes. A `revise` track assumes you have written it before and is cut into short, self-contained refreshers.

## The site

| Route | What it does |
| --- | --- |
| `/` | Landing page; track cards, counts derived from the content tree |
| `/roadmap` | The programme above the level of a track — Modules 0–4, electives, and a first-month plan |
| `/curriculum` | All tracks, split into "learn from scratch" and "revise and master" |
| `/curriculum/[trackSlug]` | One track: description, stats, and the full module map with phase dividers |
| `/learn/[trackSlug]/[moduleSlug]/[lessonSlug]` | A lesson, inside a persistent sidebar shell |
| `/practice` | The problem sheet, filterable by difficulty, topic, pattern and company |
| `/practice/[problemSlug]` | One problem as a workspace: statement, signals, approaches, and an in-browser judge |
| `/visualize` | The gallery of every algorithm family and data structure |
| `/playground` | A nine-language editor and console |

Every content route is enumerated at build time with `generateStaticParams` and pins `dynamicParams = false`, so an unknown slug is a real 404 rather than a 200 that a streamed `loading.tsx` has already committed to.

## One algorithm, ten languages

An example may carry `alternates` — the same program in another language, offered behind a dropdown. **Every alternate is run by the same gate against the same expected output**, so a translation that has drifted is a failed build rather than something a reader discovers.

Where a language legitimately prints something different, the variant carries its own recorded output, and that difference is usually the point. Switching the language on the DSA track's failure example *is* the lesson:

- Python and JavaScript print three lines and then fail — neither looked at line 4 until it arrived there.
- Java, C++, Rust and Go print nothing at all — each read the whole file and refused to produce a program.
- TypeScript sits on both sides: `tsc` rejects the file outright, and it still runs under a type-stripping runner, because checking and stripping are separate steps.

The dropdown is fenced per track by a check in `scripts/verify-visual-frames.ts`. DSA offers eight languages; React and Next.js offer JSX/TSX and JavaScript/TypeScript; Angular offers JavaScript/TypeScript. A C++ course's examples are C++ because that is the subject — offering to read one "in Python" would be incoherent, and the check makes that a build failure.

## Getting started

**Requirements**

- Node 20 or newer (CI uses Node 20)
- npm

**Install and run**

```bash
git clone https://github.com/prajwalkamble/DevKernel.git
cd DevKernel
npm install
npm run dev
```

Then open <http://localhost:3000>.

`npm run dev` and `npm run build` both run `npm run assets` first, which copies two runtime dependencies out of `node_modules` and into `public/`:

- **Pyodide** (~13 MB) — a CPython build compiled to WebAssembly, fetched over HTTP by its own loader, so it has to be reachable at a URL.
- **Monaco** — loaded by an AMD loader for the same reason. Copying it locally also stops `@monaco-editor/react` falling back to a public CDN pinned to a different version than `package.json` declares.

Both directories are gitignored and are skipped on re-run when already present at the right size, so a warm dev start pays nothing for them.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Copies assets, then starts the Next dev server |
| `npm run build` | Copies assets, then a production build |
| `npm start` | Serves the production build |
| `npm run lint` | ESLint (flat config, `eslint-config-next` core-web-vitals + typescript) |
| `npm run assets` | `pyodide` + `monaco` copy steps |
| `npm run pyodide` / `npm run monaco` | Either copy step on its own |
| `npm run verify` | The fast gate: `next typegen`, `tsc --noEmit`, `eslint .`, then `verify:frames` |
| `npm run verify:frames` | Runs every visualisation and checks the frames are well-formed |
| `npm run verify:code` | The slow gate: compiles and runs every lesson example and translation |
| `npm run verify:visuals` | Drives a real Chromium and checks playback actually advances |

`verify:code` takes an optional track and module filter:

```bash
node scripts/verify-lesson-code.mjs                    # every track
node scripts/verify-lesson-code.mjs dsa                # one track
node scripts/verify-lesson-code.mjs dsa the-framework  # one module
```

Two more scripts exist for working on the runtimes without opening a browser:

```bash
node scripts/try-runtime.mjs java path/to/Main.java    # run a file on a browser runtime
node scripts/try-judge.mjs two-sum c path/to/sol.c     # grade a solution against real cases
```

## Environment variables

Analytics is **opt-in per environment**. With no key set, PostHog never initialises and nothing is sent — which is what a local checkout, CI and a fork should all do. Copy `.env.example` to `.env.local` only when you want your own browsing to show up.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key. A write-only ingest key; it ships to the browser by design and grants no read access. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Ingest host for your region. Defaults to `https://us.i.posthog.com`. |

Both are `NEXT_PUBLIC_`, so they are inlined by `next build` rather than read at runtime — they must be present in the environment that runs the **production build**, not merely on the server that serves it.

Analytics requests go out same-origin through `/ingest` and are proxied to PostHog by rewrites in `next.config.ts`. The audience for this site is developers, and `*.posthog.com` is on every blocklist worth the name, so measuring directly would quietly under-count exactly the people the course is for.

## Project structure

```
.
├── app/                      # App Router: routes, layouts, loading skeletons, global CSS
│   ├── (home)/               #   landing page
│   ├── curriculum/           #   track index and per-track pages
│   ├── learn/[trackSlug]/    #   lesson shell (a layout, so the sidebar keeps its scroll)
│   ├── practice/             #   problem sheet and problem workspace
│   ├── playground/           #   nine-language editor
│   ├── roadmap/              #   the programme above the level of a track
│   └── visualize/            #   the visualisation gallery
├── components/               # UI, split by area: lesson, practice, playground, visuals, layout
├── content/                  # THE CURRICULUM — TypeScript data, no markdown
│   ├── types.ts              #   Track / Module / Lesson / Section / CodeExample / VisualSpec
│   ├── tracks/               #   one directory per track, one file per module
│   ├── practice/             #   problems, patterns, topics, judge specs
│   ├── roadmap.ts            #   Modules 0–4, electives, first-month plan
│   └── comingSoon.ts         #   turns a settled syllabus into a preview lesson
├── lib/                      # Logic with no JSX
│   ├── judge/                #   the practice console: runners, workers, grading, stubs
│   ├── runtimes/             #   in-browser interpreters for C, C++, Go, Java, Rust + an x86-64 emulator
│   ├── visuals/              #   frame generators — the real algorithms, instrumented
│   └── *.ts                  #   progress, analytics, theming, transpiling, playground plumbing
├── public/judge/             # Hand-written worker scripts and the Python driver
├── scripts/                  # Asset copying, the three verification gates, two dev helpers
├── docs/screenshots/         # The images in this README
├── .githooks/pre-commit      # Runs the fast gate before a commit
└── .github/workflows/        # CI: the fast gate + the full lesson-code run
```

## Verification

Three gates, deliberately separated by how long they take.

**1. `npm run verify` — seconds.** Type generation, `tsc --noEmit`, ESLint, and the visual frame checker. This is what the pre-commit hook runs and what gates a pull request. Enable the hook once per clone:

```bash
git config core.hooksPath .githooks
```

**2. `npm run verify:code` — up to half an hour.** Compiles and runs every example and every translation, then diffs against the recorded output. This is the check that makes the project's central promise true. It needs real toolchains on `PATH`:

| Language | Needs | CI pins |
| --- | --- | --- |
| Java | `java` (single-file source mode) | Temurin 25 |
| Python | `python3` | 3.13 |
| Go | `go` | 1.24 |
| C++ | `g++` (`-std=c++20`) | image default |
| Rust | `rustc` (edition 2021) | image default |
| JavaScript / TypeScript | `node`, and the local `tsx` | Node 20 |
| JSX / TSX | `tsx`, `react-dom/server`, and `jsdom` for examples that touch the DOM | Node 20 |
| Assembly | `nasm` and `ld` | installed by the workflow |

The versions are pinned for a reason: a recorded output is only reproducible on the toolchain it was recorded against. The runner's default JDK printed `1.15292150460684698E18` where every lesson says `1.152921504606847E18`, because `Double.toString` switched to the shortest round-tripping decimal in JDK 19.

**3. `npm run verify:visuals` — minutes, and needs a running server.** Drives a real Chromium over the DevTools protocol and measures wall-clock playback. It exists for one bug class the other two cannot see: playback is a chain of timeouts, and a dropped dependency in the player's effect leaves frames that are individually perfect while the animation advances one step and stalls.

## Adding content

**A lesson.** Add a `Lesson` object to a module file under `content/tracks/<track>/modules/<nn>-<slug>/`, export it from the module's `index.ts`, and register the module in the track's `index.ts`. Route generation, the sidebar, the curriculum map, progress tracking and the lesson counts all follow from the data — nothing else needs editing.

Write the code first, run it, and **paste the output you actually got**. If an example needs a toolchain the verifier cannot stand up (a Spring application context, say), set `requires: "..."` on it — the verifier then reports it as skipped-with-a-reason rather than as a mismatch, because a suite that is permanently eight-red is a suite people stop reading.

**A problem.** Add a `Problem` to a file under `content/practice/problems/` and re-export it from `content/practice/index.ts`. Order in that array is the recommended solving order, not alphabetical: each problem sits after the one whose idea it builds on. Give it a `judge` block — signature, parameter types and cases — or it becomes a problem you can only read.

**A visualisation.** Add a generator to `lib/visuals/`, register it in the relevant table, and reference it from a lesson's `section.visual`. Generators are ordinary implementations of the algorithm with `emit()` threaded through, so if the implementation is wrong the animation is visibly wrong too. Never hand-author frames.

**A coming-soon module.** Call `createComingSoonModule({ ... })` with eight topics. It becomes a preview lesson, and the topics are what the "planned lessons" counts are derived from.

## Deployment

Deployed on Vercel at [devkernel.vercel.app](https://devkernel.vercel.app). Nothing is server-rendered per request beyond Next's own defaults: content routes are statically enumerated, and every interactive feature — the playground, the judge, the visualisations — runs in the visitor's browser, so there is no execution backend to operate or secure.

Set `NEXT_PUBLIC_POSTHOG_KEY` in the hosting provider's environment if you want analytics; leave it unset and the SDK never initialises.

## Screenshots

**Reading a lesson.** Prose, a verified example, its real output, and the language picker.

![A lesson page with the language dropdown](docs/screenshots/lesson-languages.png)

**A lesson with an embedded visualisation** — generated by running the algorithm the lesson is about.

![A lesson with an embedded heap visualization](docs/screenshots/lesson-visual.png)

**The visualisation gallery** — every algorithm family and data structure, steppable and reversible.

![The visualize gallery](docs/screenshots/visualize.png)

**The practice console** — write a solution, run it in the browser, have it graded against the same tests before you see anyone else's answer.

![The practice console](docs/screenshots/practice.png)

**The curriculum**, with every track's full syllabus published up front.

![The curriculum page](docs/screenshots/curriculum.png)

## Further reading

- **[internals.md](internals.md)** — the in-depth documentation: the content data model, the three execution engines, the judge protocol, the visualisation frame contract, client-side persistence, and every verification gate.
- `AGENTS.md` / `CLAUDE.md` — notes for coding agents working in this repo. The Next.js block in `AGENTS.md` is written and re-added by `next dev` itself.

---

## License

Licensed under either of

- **Apache License, Version 2.0** — [`LICENSE-APACHE`](LICENSE-APACHE) or <https://www.apache.org/licenses/LICENSE-2.0>
- **MIT license** — [`LICENSE-MIT`](LICENSE-MIT) or <https://opensource.org/licenses/MIT>

at your option. In SPDX terms, `MIT OR Apache-2.0`.

You do not need both. Take whichever fits the project you are putting this into, and comply with that one — MIT if you want the shortest possible obligation, Apache-2.0 if you want its express patent grant and its explicit terms on trademarks, notices and contributions. This is the same arrangement the Rust project uses, and it exists so that neither choice is a barrier.

Unless you state otherwise, any contribution you intentionally submit for inclusion in this work is dual licensed as above, with no additional terms or conditions.

The licences cover this repository: the application code **and** the curriculum in `content/`. They do not cover the third-party runtimes the deployed site serves, which carry their own terms and are fetched from `node_modules` at build time rather than committed here — [Monaco Editor](https://github.com/microsoft/monaco-editor) (MIT) and [Pyodide](https://github.com/pyodide/pyodide) (MPL-2.0).
