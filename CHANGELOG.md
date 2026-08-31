# Changelog

Notable changes to DevKernel, newest first.

Versions are `MAJOR.MINOR.PATCH`. The project is before 1.0, which means the
content model in `content/types.ts`, the visualisation frame contract in
`lib/visuals/types.ts` and the site's route shapes may change between minor
versions without a deprecation period. Nothing here is published as a package,
so no downstream code depends on those shapes yet.

Every count in this file was measured against the tree being released, not
estimated. The commands that produced them are named at the end of each entry.

## 0.1.0 — 2026-08-31

The first tagged release. It exists because the React track is finished, and a
finished track is the first thing in this repository worth pinning a version
to. The tag covers the whole repository; the React track is what is new in
it.

### The React track

Fifteen modules, 115 lessons, marked `available`. The track teaches React 19
from the first component to the parts most people skip, in an order chosen so
that nothing is used before it has been explained: props arrive before any
hook, the four everyday hooks get a module of their own before the rest, and
rendering models come late, once there is enough vocabulary for the difference
between hydration and a Server Component to mean something.

| Module | Title | Lessons |
| --- | --- | --- |
| 1 | What React Is & Your First App | 6 |
| 2 | JSX & Rendering in Depth | 8 |
| 3 | Components & Props | 9 |
| 4 | State & Events | 8 |
| 5 | The Hooks You Use Every Day | 8 |
| 6 | Lists, Keys & Forms | 8 |
| 7 | Effects, Lifecycle & Data Fetching | 8 |
| 8 | Composition, Context & State Architecture | 8 |
| 9 | Rendering Behaviour & Performance | 8 |
| 10 | Advanced Hooks & Custom Hooks | 8 |
| 11 | Concurrent React, Suspense & Transitions | 8 |
| 12 | Client, Server & Hydration | 8 |
| 13 | Testing, TypeScript & Tooling | 8 |
| 14 | Patterns, Ecosystem & Judgement | 7 |
| 15 | Capstone: Build a Bug Tracker | 5 |

What that comes to, counted from the content tree:

| Measure | Count |
| --- | --- |
| Modules | 15 |
| Lessons | 115 |
| Sections | 535 |
| Code examples | 313 |
| Code blocks, counting translations | 590 |
| Examples offering a language dropdown | 277 |
| Pitfall callouts | 279 |
| Interview questions | 409 |
| Learning objectives | 581 |
| Takeaways | 859 |
| Estimated reading time | 3,299 minutes across the 115 lessons, 18 to 40 each |

### Every React example is checked against React

The lesson verifier runs React examples rather than trusting the output typed
next to them. `scripts/react-dom-env.mjs` installs a jsdom document through
node's `--import`, before the example module is evaluated, so that
`react-dom/client` has a document to mount into and so that no line number in
the example shifts. It overwrites Node's own `FormData` with jsdom's, because
Node's throws when handed a jsdom form, and it installs `MutationObserver`,
`IntersectionObserver` and `ResizeObserver` so a lesson can count what React
actually writes to the DOM instead of asserting that a re-render is not a DOM
write.

`node scripts/verify-lesson-code.mjs react` on this tree: **294 code blocks
executed against React 19.2.8, 0 mismatched.** Fourteen more declare an output
that a different toolchain produced — `tsc` diagnostics, an eslint report, a
vitest summary, the React Compiler's emit — and are reported as skipped with
the reason named, rather than as a mismatch nobody can act on. The remaining
231 eligible blocks declare no expected output, so there is nothing to check.

### JSX first, TSX behind the dropdown

Every React example is now written in JSX, with the TypeScript version offered
as an alternate. Both are checked against the same expected output, so a
translation that has drifted from the original fails the build. The dropdown
choice is stored globally, so picking JSX or TSX carries across every example
on the page and into the next lesson. 277 of the track's 313 examples carry
the pair.

The capstone can be built in either language, filenames included: a heading
that names `db/schema.ts` says `db/schema.js` in the JavaScript version,
because a heading that disagrees with the code under it is worse than no
heading.

### The capstone

Module 15 is one project rather than more material. Bug Tracker, in the shape
of a small Bugzilla, Jira or GitHub Issues: numbered functional and
non-functional requirements written down first, then a shared schema package,
a Hono and SQLite backend, and a React and TypeScript front end with filters
held in the URL, a triage queue ordered worst-first, two optimistic mutations
and one deliberately not, and tests that fake the network rather than the
modules.

### Site changes that came with the track

- The site works on a phone. Layout, navigation and every track's lesson pages.
- The lesson sidebar keeps its scroll position across navigations, and no
  longer moves the page when it mounts.
- A logo, in the sizes a phone home screen asks for.
- Route-specific loading skeletons. The home skeleton no longer stands in for
  every route.

### Fixed

- The `use()` lesson's uncached-promise example was flaky and had been failing
  `verify / lesson-code` on `main`. It resolved its promise on a timer, which
  left it host-dependent whether React replayed the render in the same pass —
  preserving its thenable state and emitting the warning — or unwound to the
  Suspense boundary, which resets that state and emits nothing. It now settles
  on a microtask, so the replay path is the only one, and the lesson says what
  React actually does on recovery: it discards the newly created promise and
  resumes with the first one, which is why the screen still shows the right
  answer and why the bug survives review.
- Assorted defects the React track surfaced in shared code, each with a gate
  added so it cannot come back.
- Minified component names no longer break the visualisation frames. Only
  `next build` catches that class of failure, so the components carry explicit
  `displayName` values.

### Documentation

`README.md` rewritten as a surface-level overview: what the project is, the
rule it is built on, features, how it works, the curriculum, requirements,
installation, scripts, environment variables, layout and deployment.

`INTERNALS.md` added: seventeen sections organised by subsystem rather than by
directory — the content data model, routing and static generation, the lesson
pipeline, the three in-browser execution engines, the five interpreters, the
x86-64 assembler and emulator, the judge protocol, the visualisation frame
contract, client state, analytics, theming, the asset pipeline and every
verification gate.

`CONTRIBUTING.md` added: prerequisites split between what you need to run the
site and what you additionally need to run the lesson verifier, installation,
what each gate costs, the full git workflow including forks, rebases, pushes
and rejected pushes, and the rules for content, practice problems,
visualisations and code.

### Licensing

Dual licensed under `MIT OR Apache-2.0`, at your option, in `LICENSE-MIT` and
`LICENSE-APACHE`, with `license` declared in `package.json`. The licences cover
this repository. They do not cover Monaco Editor or Pyodide, which the deployed
site serves, which carry their own terms, and which are copied out of
`node_modules` at build time rather than committed here.

### Known limitations

- The playground's React support is a shim, not React. `lib/sandboxRunner.ts`
  injects a `createElement` and `Fragment` that behave as React's do and
  renders JSX to a string; there is no reconciler, so every hook throws with a
  message saying there is nowhere for state or effects to live. Lesson
  examples are unaffected — the verifier runs those against real React under
  jsdom.
- The React track embeds no visualisations. 87 React visualisations across 13
  families are implemented, registered in `lib/visuals/resolve.ts` and checked
  by `npm run verify:frames`, but the lessons that used to embed them no longer
  do, and the Visualize gallery lists only its 22 data-structure and algorithm
  entries. Nothing in the UI currently reaches them.
- The home page and the root metadata describe "all six" playground languages.
  `LANGUAGE_ORDER` has nine: C, C++, Go, Java, JavaScript, Python, Rust,
  TypeScript and x86-64 assembly. The copy is wrong, not the playground.
- `CMakeLists.txt` at the repository root declares a `shapes` project whose
  `src/` and `include/` directories do not exist. Nothing references it and
  nothing builds it.
- There is no `engines` field. Continuous integration runs Node 20; newer
  versions are untested rather than blocked.

### How this release was checked

- `npm run verify` — `next typegen`, `tsc --noEmit`, `eslint .` and the frame
  verifier. 213 visualisations run, 3,080 frames checked, 61 lesson specs
  resolved, 388 examples carrying a language dropdown, no problems.
- `node scripts/verify-lesson-code.mjs react` — 294 run, 0 mismatched.
- `npm run build`.
- The `verify` workflow on GitHub Actions, green on the tagged commit.
