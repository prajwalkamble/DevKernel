import type { Lesson } from "@/content/types";

export const viteAndTheBuildLesson: Lesson = {
  id: "react-vite-and-the-build",
  slug: "vite-and-the-build",
  moduleSlug: "testing-typescript-tooling",
  title: "Vite & What a React Build Does",
  summary:
    "The two different programs behind npm run dev and npm run build, what actually comes out of dist — read off a real build — how a lazy import becomes a chunk, and the analysis step that finds the 200kB nobody meant to ship.",
  estimatedMinutes: 28,
  objectives: [
    "Say why dev and build are two different pipelines",
    "Read a production build's output",
    "Explain what content hashes buy",
    "Split a bundle with lazy and see the chunk appear",
    "Find what is actually in a bundle",
  ],
  sections: [
    {
      id: "two-programs",
      heading: "Two programs, one config file",
      body: [
        "This confuses everyone once. `vite dev` and `vite build` are not the same pipeline with a flag.",
        "**Dev** serves your source as native ES modules. The browser requests `main.tsx`, Vite transforms that one file and returns it, the browser requests its imports, and so on. There is no bundle — which is why the dev server starts instantly regardless of project size, and why a change to one file is served in milliseconds without touching anything else.",
        "**Build** runs Rollup and produces bundles. Because two hundred separate module requests over a real network is slower than one file, and because tree-shaking, minification and hashing all need to see the whole graph.",
        "The practical consequence: **something can work in dev and fail in the build**, and the reason is almost always one of three things. A circular import that native ESM tolerated and Rollup's ordering did not. A `process.env` reference that existed in dev's transform and not in the build. A case-insensitive filesystem locally against a case-sensitive one in CI. Run the build before you push.",
      ],
    },
    {
      id: "the-output",
      heading: "What comes out",
      body: [
        "The scaffold from module 1, with one route behind `React.lazy`, built for production.",
      ],
      examples: [
        {
          id: "build-output",
          title: "A real `vite build`",
          lang: "bash",
          code: `$ npx vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 18 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-DGNrK5qb.css    1.78 kB │ gzip:  0.81 kB
dist/assets/Heavy-BbkHBMkS.js     0.13 kB │ gzip:  0.14 kB
dist/assets/index-CP7Zf5UC.js   191.83 kB │ gzip: 60.53 kB

✓ built in 331ms`,
          explanation:
            "Four things worth reading here. The **gzip column** is the number that matters — 60.53 kB is what crosses the network, and 191.83 kB is what the browser then has to parse, which is the number that matters on a slow phone. `Heavy-BbkHBMkS.js` is a separate chunk, and nothing in the config asked for it — a `lazy(() => import(…))` is what created it. The CSS is **extracted into its own file** rather than injected by JavaScript, so it can load in parallel with the bundle. And note the smallest file has a *larger* gzip size than its raw size: compression has a fixed overhead, which is why splitting into many tiny chunks is not free.",
          requires: "vite (this is its build output, not a program's)",
        },
      ],
    },
    {
      id: "hashes",
      heading: "What the hashes are for",
      body: [
        "`index-CP7Zf5UC.js` is not a random name. The hash is derived from the file's **contents**, and that single fact is the whole caching strategy.",
        "Serve every hashed file with `Cache-Control: max-age=31536000, immutable` — cache it for a year and never revalidate — and serve `index.html` with `no-cache`. Now a deploy invalidates exactly what changed: the HTML is always fresh, it points at the new hashes, and every file whose contents did not change keeps its name and stays in the user's cache.",
        "It also explains why the CSS is a separate file with its own hash. A styling-only change produces a new CSS name and leaves the 191kB bundle's name untouched, so returning users download 1.78 kB instead of 193 kB.",
      ],
      pitfalls: [
        {
          title: "`public/` is the deliberate exception",
          body: "Files there are copied through with their names intact and no hash, which is what makes a fixed path like `/favicon.svg` or `/robots.txt` possible — and means they must be served with a short cache lifetime, because a change does not change the name. Nothing in `public/` is bundled, transformed or tree-shaken; it is a copy step.",
        },
      ],
    },
    {
      id: "splitting",
      heading: "Splitting the bundle",
      body: [
        "One chunk means every user downloads every route. `React.lazy` plus a dynamic import creates a boundary the bundler cannot cross eagerly, so everything behind it becomes its own file.",
        "The reason it needs a Suspense boundary is now obvious: the component genuinely is not there yet, so the render suspends — module 11's mechanism, with a network request instead of a data fetch.",
      ],
      examples: [
        {
          id: "lazy",
          title: "What produced that second chunk",
          lang: "jsx",
          code: `import { lazy, Suspense, useState } from "react";

/* The dynamic import is the boundary. Everything reachable from ./Heavy —
   and not reachable any other way — goes into its own file. */
const Heavy = lazy(() => import("./Heavy"));

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <main>
      <button onClick={() => setShow(true)}>Open</button>
      {/* The component is not loaded yet, so its render suspends: the same
          mechanism as data fetching, waiting on a network request for code. */}
      {show && <Suspense fallback={<p>Loading…</p>}><Heavy /></Suspense>}
    </main>
  );
}`,
          explanation:
            "The split points worth making are the ones where a lot of code is only needed sometimes: a route the user may never visit, a rich text editor behind a button, a charting library on one tab, an admin section most accounts cannot see. Splitting a 4kB component is churn — you have traded one round trip for a saving smaller than the request's own overhead.",
          alternates: [
            {
              lang: "tsx",
              code: `import { lazy, Suspense, useState } from "react";

/* The dynamic import is the boundary. Everything reachable from ./Heavy —
   and not reachable any other way — goes into its own file.

   \`lazy\` requires the imported module to have a *default* export that is a
   component; pointing it at a file with only named exports is a compile
   error here rather than a blank screen at runtime. */
const Heavy = lazy(() => import("./Heavy"));

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <main>
      <button onClick={() => setShow(true)}>Open</button>
      {/* The component is not loaded yet, so its render suspends: the same
          mechanism as data fetching, waiting on a network request for code. */}
      {show && <Suspense fallback={<p>Loading…</p>}><Heavy /></Suspense>}
    </main>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A lazy component must be defined outside the render",
          body: "`const Heavy = lazy(…)` inside a component creates a new lazy wrapper on every render, so React unmounts and re-imports the component each time. Module scope, always — the same identity rule as everywhere else.",
        },
      ],
    },
    {
      id: "analysis",
      heading: "Finding what is actually in there",
      body: [
        "191kB for a page with a button is a number worth being curious about, and the answer is never guessable. A visualiser is the only honest way to find out.",
        "`rollup-plugin-visualizer` writes an interactive treemap of the build. Every bundle-size investigation starts there, and it usually ends within a minute or two, because the culprit is invariably one of a short list.",
        "**A date library, entire.** Importing `moment` brings every locale. `date-fns` with named imports, or `Intl.DateTimeFormat`, which is built into the browser.",
        "**An icon set, entire.** `import { Home } from \"some-icons\"` looks like one icon and is often the whole package if it is not tree-shakeable.",
        "**A utility library, entire.** `import _ from \"lodash\"` is the lot; `lodash-es` with named imports is not.",
        "**Two copies of something.** Two versions of the same package in the tree, usually from a peer dependency mismatch. `npm ls <package>` tells you.",
        "**Something that should have been server-side.** A markdown parser, a syntax highlighter, a PDF generator — module 12's argument, showing up as a number.",
      ],
      examples: [
        {
          id: "visualiser",
          title: "Turning it on",
          lang: "javascript",
          code: `// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      /* gzip, because that is what crosses the network. The raw size is
         still the parse cost, so it is worth looking at both. */
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
});`,
          explanation:
            "Two numbers, two different problems. Gzip size is download time, which a fast connection solves. Raw size is parse and compile time, which nothing solves on a slow phone — so a 500kB bundle that gzips to 120kB is still 500kB of JavaScript for the device to chew through before anything runs.",
          alternates: [
            {
              lang: "typescript",
              code: `// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      /* gzip, because that is what crosses the network. The raw size is
         still the parse cost, so it is worth looking at both. */
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
});`,
            },
          ],
        },
      ],
    },
    {
      id: "the-rest",
      heading: "The rest of the config, briefly",
      body: [
        "**Environment variables.** `import.meta.env.VITE_API_URL`. Only the `VITE_`-prefixed ones are exposed, which is a guard rail rather than a convention — and it is worth being clear that they are *inlined into the bundle*, so nothing there is secret. A key in a `VITE_` variable is a key you have published.",
        "**Proxying.** `server.proxy` forwards `/api` to your backend during development, so the browser sees a same-origin request and CORS never comes up.",
        "**Path aliases.** Module 3's `@/` — set once in `tsconfig.json`, and current Vite reads it from there directly.",
        "**Preview.** `vite preview` serves `dist/` as a static site. It is not a production server, but it is the only cheap way to check the actual build output before deploying it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why are the dev server and the production build different pipelines?",
      answer:
        "Dev serves your source as native ES modules — the browser requests each file and Vite transforms that one file, so startup is instant regardless of project size and a change is served without rebuilding anything else. Build runs Rollup, because two hundred module requests over a real network is slower than one file, and because tree-shaking, minification and hashing all need the whole graph. The consequence is that code can work in dev and fail in the build, so run the build before pushing.",
    },
    {
      question: "What do content hashes in the filenames buy you?",
      answer:
        "The entire caching strategy. The hash comes from the file's contents, so serve every hashed file with a one-year immutable cache and `index.html` with none. A deploy then invalidates exactly what changed: the HTML is always fresh and points at the new names, and anything whose contents did not change keeps its name and stays cached. It is also why CSS is extracted separately — a styling change downloads 1.78 kB rather than the whole bundle.",
    },
    {
      question: "How does code splitting work, and where should you split?",
      answer:
        "A dynamic `import()` is a boundary the bundler cannot cross eagerly, so everything only reachable through it becomes its own chunk — `React.lazy` wraps that in a component, and it needs Suspense because the component genuinely is not there yet. Split where a lot of code is only needed sometimes: a route, an editor behind a button, a charting library on one tab. Splitting a small component trades a round trip for a saving smaller than the request overhead.",
    },
    {
      question: "How do you find out why a bundle is large?",
      answer:
        "A visualiser such as `rollup-plugin-visualizer`, which draws a treemap of the build. Guessing does not work, and the answer is usually one of a short list: a date or icon or utility library imported whole, two copies of one package from a version mismatch, or something that should have run on the server. Look at both gzip size, which is download time, and raw size, which is parse time and is the one that hurts on a slow phone.",
    },
  ],
  takeaways: [
    "Dev serves unbundled modules; build runs Rollup — two pipelines, one config",
    "Code can work in dev and fail in the build; run the build before pushing",
    "The gzip column is download cost, the raw column is parse cost",
    "CSS is extracted into its own hashed file so a styling change is cheap",
    "Content hashes plus immutable caching mean a deploy invalidates only what changed",
    "`public/` is copied through unhashed, which is why fixed paths work there",
    "A dynamic import creates a chunk; nothing in the config asks for one",
    "`lazy()` must be called at module scope, or the component re-imports every render",
    "`VITE_`-prefixed variables are inlined into the bundle and are not secret",
  ],
  status: "available",
};
