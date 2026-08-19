import type { Lesson } from "@/content/types";

export const sourceMapsLesson: Lesson = {
  id: "testing-source-maps",
  slug: "source-maps",
  moduleSlug: "testing-debugging",
  title: "Source Maps & Debugging Compiled TypeScript",
  summary:
    "Why a stack trace points at code you never wrote, what a source map actually contains, the compiler options that make debugging work, and the decision about shipping maps to production.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a source map is and how a tool finds one",
    "Configure TypeScript to emit usable maps",
    "Get source-mapped stack traces from Node",
    "Debug TypeScript directly in the browser and in tests",
    "Decide whether to ship source maps, and how to do it safely",
  ],
  sections: [
    {
      id: "problem",
      heading: "The problem, demonstrated",
      body: [
        "You wrote TypeScript. The runtime executes JavaScript. Every line number, filename and column in a stack trace refers to the **output**, which may be transpiled, bundled, minified and several thousand lines from anything you recognise.",
        "A source map is the translation table that lets tools show you the original instead.",
      ],
      examples: [
        {
          id: "stack-comparison",
          title: "The same error, with and without the map",
          lang: "bash",
          code: `# app.ts compiled with:  tsc --sourceMap app.ts
#   -> app.js and app.js.map

node app.js
node --enable-source-maps app.js`,
          output: `# WITHOUT source maps — points at generated JavaScript
Error: Order abc not found
    at findOrder (/project/app.js:7:15)

# WITH --enable-source-maps — points at the TypeScript you wrote
Error: Order abc not found
    at findOrder (/project/app.ts:6:11)
    at run (/project/app.ts:12:3)
    at Object.<anonymous> (/project/app.ts:15:1)`,
          explanation:
            "Two things changed: the filename became `.ts`, and the line moved from 7 to 6 — because the compiled output has extra lines the source does not. On a small file the difference is mildly annoying; after minification the generated location is a column number on line 1, and without a map the trace is worthless.",
        },
      ],
    },
    {
      id: "what-is-a-map",
      heading: "What is actually in a source map",
      body: [
        "A `.map` file is JSON with a handful of fields. Knowing them explains every source-map problem you will hit.",
        "**`version`**, **`file`** (the generated file), and **`sources`** — the paths of the original files.",
        "**`sourcesContent`** — the *full text* of those originals, embedded. Optional, and the field that decides whether a debugger can show you code it cannot otherwise fetch.",
        "**`mappings`** — a base64 VLQ-encoded string mapping generated positions back to original ones. This is the bulk of the file and is not meant to be read by humans.",
        "**`names`** — original identifiers, so a minified `t` can be displayed as `orderTotal`.",
        "A tool finds the map from a comment on the last line of the generated file — `//# sourceMappingURL=app.js.map` — or from a `SourceMap` HTTP header.",
      ],
      pitfalls: [
        {
          title: "Without `sourcesContent`, the debugger needs the original files on disk",
          body: "If the map only lists paths, the tool must fetch each one. In a browser that means the `.ts` files have to be served; in Node it means they must still exist at the recorded path. Deploying built output without the sources produces maps that resolve line numbers but show no code. `inlineSources: true` embeds the text and removes the problem entirely.",
        },
      ],
    },
    {
      id: "tsconfig",
      heading: "The compiler options",
      body: [
        "Four options control map emission, and the combination you want depends on where the code will run.",
        "**`sourceMap: true`** — emit a separate `.js.map` alongside each file. The normal choice.",
        "**`inlineSourceMap: true`** — embed the map as a base64 data URI in the JavaScript itself. One file, much larger; convenient for local tooling, wrong for anything you ship.",
        "**`inlineSources: true`** — embed the original source text in the map. Use it whenever the `.ts` files will not be available where debugging happens.",
        "**`sourceRoot`** and **`mapRoot`** — rewrite the paths recorded in the map, for when the layout at debug time differs from the layout at build time.",
      ],
      examples: [
        {
          id: "tsconfig-maps",
          title: "The settings that work",
          lang: "javascript",
          code: `{
  "compilerOptions": {
    "sourceMap": true,
    // Embed the sources, so a debugger never has to find the .ts files.
    "inlineSources": true,

    // Do not do this in a build you ship — it inflates every .js file.
    // "inlineSourceMap": true,

    "outDir": "dist",
    "declarationMap": true   // ctrl-click a .d.ts symbol -> the .ts source
  }
}`,
          explanation:
            "`declarationMap` is the one most people have never enabled and immediately miss afterwards. Without it, ctrl-clicking a symbol from a locally-built package lands you in the generated `.d.ts`; with it, you go to the actual implementation. In a monorepo it is the difference between navigable and not.",
        },
      ],
    },
    {
      id: "node",
      heading: "Node",
      body: [
        "Node does not apply source maps unless told to. **`--enable-source-maps`** turns it on, which is what produced the corrected trace at the top of this lesson. It costs a small amount of startup time and is worth it everywhere, including production.",
        "The equivalent for a long-running service is the `NODE_OPTIONS` environment variable, so no start command has to change.",
      ],
      examples: [
        {
          id: "node-source-maps",
          title: "Turning it on, and what runs TypeScript directly",
          lang: "bash",
          code: `# Per command
node --enable-source-maps dist/server.js

# Or for everything, including npm scripts and child processes
NODE_OPTIONS="--enable-source-maps" npm start

# Runtimes that execute TypeScript directly handle maps themselves:
tsx server.ts          # esbuild-based
node --experimental-strip-types server.ts   # Node 22+
deno run server.ts
bun run server.ts

# Vitest already reports failures against your .ts source — that is
# source maps doing their job, which is why lesson 1's failure report
# showed the original file and line.`,
          explanation:
            "This is worth enabling in production specifically. An error report from a live service with generated line numbers costs an hour of cross-referencing per incident; with maps applied it points at the source file, and the cost is a few milliseconds at startup.",
        },
      ],
    },
    {
      id: "browser",
      heading: "The browser",
      body: [
        "DevTools applies source maps automatically when it finds them, so a bundled application shows your original files in the Sources panel under a folder named for the bundler. Breakpoints set there bind to the generated code underneath.",
        "When it is not working, there are only a few causes, and they are quick to check.",
      ],
      examples: [
        {
          id: "browser-maps",
          title: "Diagnosing a map that is not applying",
          lang: "bash",
          code: `# 1. Is the map referenced? Check the last line of the bundle:
#      //# sourceMappingURL=main.a1b2c3.js.map

# 2. Is it being fetched? Network panel, filter ".map" —
#    a 404 here is the most common cause, usually because the
#    deploy uploaded the .js files and not the .map files.

# 3. Is it enabled? DevTools Settings -> Preferences ->
#    "Enable JavaScript source maps" (on by default).

# 4. Is the map stale? A cached map against a new bundle shows
#    the right file with wrong lines — which is worse than none.
#    Hashed filenames prevent this.

# 5. Vite/webpack in dev: check the devtool setting.
#      vite:    build.sourcemap: true
#      webpack: devtool: "source-map"          (accurate, slower)
#               devtool: "eval-source-map"     (fast, dev only)`,
          explanation:
            "Point four is the one that wastes the most time, because it fails *quietly*: the panel shows your source, the breakpoints bind, and everything is offset by a few lines so the values look wrong. If the debugger seems to be lying, suspect a stale map before you suspect the runtime.",
        },
      ],
    },
    {
      id: "production",
      heading: "Shipping source maps: the actual trade-off",
      body: [
        "**Serving maps publicly means publishing your source.** Anyone can open DevTools and read your original, commented, unminified code. For most applications that matters far less than people assume — minified JavaScript is not a meaningful secret, and any determined reader can follow it anyway — but it is a real decision, and it becomes a genuine one if comments contain internal URLs, credentials or unreleased feature names.",
        "**Not shipping them means production errors are unreadable.** A trace pointing at `main.a1b2c3.js:1:48291` cannot be triaged.",
        "The standard answer takes both: **generate maps, upload them to your error tracker, and do not serve them to browsers.** Sentry, Bugsnag and Rollbar all support this — they apply the map server-side, so your stack traces are readable and the maps are never public.",
      ],
      examples: [
        {
          id: "hidden-source-maps",
          title: "Generate, upload, do not serve",
          lang: "bash",
          code: `# Vite: emit maps without the //# sourceMappingURL comment,
# so browsers never request them.
#   build: { sourcemap: "hidden" }
#
# webpack: devtool: "hidden-source-map"

# Then upload them at deploy time and delete them from the bundle.
sentry-cli sourcemaps upload --release "$VERSION" ./dist
find ./dist -name "*.map" -delete

# If you do serve them, restrict access rather than publishing:
#   - only to authenticated internal users, or
#   - only from your office IP range at the CDN`,
          explanation:
            "`\"hidden\"` is the specific setting to know: the maps are produced but the reference comment is omitted, so DevTools does not fetch them and the error tracker still gets what it needs. Deleting the `.map` files after upload closes the remaining gap, which is that a hidden map is still downloadable by anyone who guesses the filename.",
        },
      ],
      pitfalls: [
        {
          title: "Maps must match the exact build they came from",
          body: "A map uploaded from a different build, or from a rebuild with a different timestamp or hash, resolves to wrong lines. Upload the maps produced by the same build that produced the deployed bundle, and tie both to a release identifier so the tracker can pair them. Two builds of the same commit can differ.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a source map and how does a tool find one?",
      answer:
        "A JSON file mapping positions in generated code back to positions in the original source, containing the source paths, optionally their full text in `sourcesContent`, and a VLQ-encoded `mappings` string. Tools find it from a `//# sourceMappingURL=` comment on the last line of the generated file, or from a `SourceMap` HTTP header.",
    },
    {
      question: "Why does Node show generated line numbers by default?",
      answer:
        "Because applying source maps costs startup time, so it is opt-in: `node --enable-source-maps`, or `NODE_OPTIONS=\"--enable-source-maps\"` for everything. It is worth enabling in production — the alternative is cross-referencing generated line numbers by hand for every incident. Runtimes that execute TypeScript directly, like tsx and Deno, handle it themselves.",
    },
    {
      question: "What does `inlineSources` do, and when do you need it?",
      answer:
        "It embeds the original source text inside the map rather than only listing file paths. Without it, the debugger must fetch each original file — which means the `.ts` files have to be served in a browser, or still exist on disk in Node. If you deploy build output without the sources, `inlineSources` is what makes the maps actually show code.",
    },
    {
      question: "Should you ship source maps to production?",
      answer:
        "Generate them, upload them to your error tracker, and do not serve them to browsers — `sourcemap: \"hidden\"` in Vite or `hidden-source-map` in webpack emit the maps without the reference comment. That gives readable production stack traces without publishing your source. Delete the map files from the deployed bundle after upload, and tie maps to a release so the tracker pairs them with the right build.",
    },
    {
      question: "The debugger shows your source but the values look wrong. What is the likely cause?",
      answer:
        "A stale source map — usually a cached map applied to a newer bundle. Everything appears to work while the positions are offset, which is more misleading than having no map at all. Hashed filenames prevent it. The other common causes are a 404 on the `.map` file, or a deploy that shipped the JavaScript without the maps.",
    },
  ],
  takeaways: [
    "A stack trace refers to generated code; a source map is the translation back to what you wrote",
    "The map contains source paths, optionally their text (`sourcesContent`), and a VLQ `mappings` string",
    "`sourceMap: true` plus `inlineSources: true` is the combination that works when sources are not deployed",
    "`declarationMap` makes ctrl-click go to the implementation rather than the `.d.ts`",
    "Node needs `--enable-source-maps`; enable it in production, where it saves an hour per incident",
    "Vitest already reports failures against your source — that is source maps working",
    "A stale map fails quietly with offset positions, which is worse than no map",
    "Generate maps, upload them to the error tracker, do not serve them — `hidden` in Vite, `hidden-source-map` in webpack",
  ],
  status: "available",
};
