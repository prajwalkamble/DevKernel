import type { Lesson } from "@/content/types";

export const creatingAnAppLesson: Lesson = {
  id: "react-creating-an-app",
  slug: "creating-a-react-app",
  moduleSlug: "foundations",
  title: "Creating a React App",
  summary:
    "From an empty directory to a running application: which tool to use in 2026 and why Create React App is gone, what every generated file does, and the four lines that actually mount React onto the page.",
  estimatedMinutes: 30,
  objectives: [
    "Create a React project with Vite, and know why not Create React App",
    "Explain what every file in a fresh project is for",
    "Read the entry point and say what createRoot and StrictMode do",
    "Understand what the dev server does that a plain file server does not",
    "Know when to reach for a framework such as Next.js instead",
  ],
  sections: [
    {
      id: "which-tool",
      heading: "Which tool, and why not Create React App",
      body: [
        "For years the answer was `create-react-app`. It is now **deprecated** — the React team formally retired it in 2025, and the React documentation no longer recommends it. If you find a tutorial that starts with `npx create-react-app`, that tutorial has not been updated in some time.",
        "There are two live answers, and which one you want depends on what you are building.",
        "**Vite** is a build tool. `npm create vite@latest` gives you a React app that renders entirely in the browser, with an extremely fast dev server and no opinions about anything else. Use it when you want to learn React itself, when you are building something that lives behind a login and does not need to be indexed, or when you are adding a UI to an existing backend.",
        "**Next.js** is a framework built on React. It adds routing, server rendering, data fetching and a build pipeline. Use it when you are building a product — most real React applications end up needing what it provides, and retrofitting it later is harder than starting with it.",
        "**This module uses Vite**, deliberately. A framework is the right choice for production and the wrong choice for learning, because it answers questions you have not asked yet. Learn React on Vite, where nothing is hidden, then take the Next.js track knowing which parts are React and which parts are Next.",
      ],
      examples: [
        {
          id: "create-vite",
          title: "Creating and running the project",
          lang: "bash",
          code: `# The template name matters: react-ts gives you TypeScript,
# react gives you plain JavaScript.
npm create vite@latest my-app -- --template react-ts

cd my-app
npm install
npm run dev`,
          output: `  VITE v8.2.2  ready in 959 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help`,
          explanation:
            "The `--` before `--template` is not a typo: it tells npm that the flags after it belong to the command being run rather than to npm itself. Your Vite version will differ. Open the URL and you have a running React application.",
        },
      ],
      pitfalls: [
        {
          title: "`npm create vite` scaffolds, it does not install",
          body: "The generator writes files and stops; the `npm install` step is separate and the output tells you so. Skipping it produces a confusing `Cannot find module 'react'` on the first run. Some versions offer to install for you — read what it prints rather than assuming.",
        },
      ],
    },
    {
      id: "the-files",
      heading: "What every file is for",
      body: [
        "A fresh project is eighteen files and none of them are mysterious. Knowing what each one does is worth five minutes now and saves an hour later.",
        "Read the listing below. The shape to hold on to is that **everything at the root is configuration and everything in `src/` is your code** — and that the generator has deliberately not invented a folder structure for you.",
      ],
      examples: [
        {
          id: "project-tree",
          title: "The generated project",
          lang: "bash",
          code: `my-app/
├── .gitignore           <- node_modules, dist, editor noise
├── .oxlintrc.json       <- lint rules; rules-of-hooks is set to error
├── README.md            <- the four commands, nothing more
├── index.html           <- the real HTML page; the app mounts into it
├── package.json         <- dependencies and the npm scripts
├── tsconfig.json        <- empty; it only references the other two
├── tsconfig.app.json    <- TypeScript settings for src/
├── tsconfig.node.json   <- TypeScript settings for vite.config.ts
├── vite.config.ts       <- build configuration (one plugin, nothing more)
├── public/              <- served as-is, never processed
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx         <- the entry point: this is where React starts
    ├── App.tsx          <- the root component
    ├── App.css          <- styles for App
    ├── index.css        <- global styles
    └── assets/          <- images imported by code, and processed
        ├── hero.png
        ├── react.svg
        └── vite.svg`,
          explanation:
            "The distinction between `public/` and `src/assets/` catches people out. A file in `public/` is copied to the output untouched and referenced by URL (`/favicon.svg`); if you misspell it you get a 404 at runtime. A file in `src/assets/` is *imported by your code*, which lets the build hash it, inline it if small, and fail the build if it is missing. Prefer `src/assets/` for exactly that reason.",
        },
        {
          id: "three-tsconfigs",
          title: "Why there are three tsconfig files",
          lang: "json",
          code: `// tsconfig.json — compiles nothing; it points at the other two.
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`,
          explanation:
            "A React project has **two different environments in one directory**. The code in `src/` runs in a browser and needs DOM types and `\"jsx\": \"react-jsx\"`. `vite.config.ts` runs in Node, before a browser is involved, and needs neither. One config cannot describe both without lying about one of them, so the scaffold splits them and leaves the root file as a pointer. `npm run build` runs `tsc -b`, which builds both projects. If a type error ever appears in a file you did not think was being checked, this is why.",
        },
        {
          id: "index-html",
          title: "index.html — the only HTML page there is",
          lang: "html",
          code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>my-app</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          explanation:
            "This is the whole page a visitor's browser receives. **Everything you build lives inside that one empty div**, put there by JavaScript after the page loads — which is exactly what client-side rendering means, and exactly what Server Components and Next.js later change. Note the script tag: a module script pointing at TypeScript source, not at a bundle. The dev server compiles it on request.",
        },
      ],
      pitfalls: [
        {
          title: "`create-vite` gives you no folder structure, and that is deliberate",
          body: "There is no `components/`, no `hooks/`, no `routes/`. Every tutorial invents one in its first five minutes and they all invent a different one. The generator refuses to guess because the right structure depends on what you are building — module 3 covers the two layouts worth knowing and when each stops working.",
        },
      ],
    },
    {
      id: "entry-point",
      heading: "main.tsx: the four lines that start React",
      body: [
        "This file is short and every line earns its place. It is the seam between the page and your application.",
      ],
      examples: [
        {
          id: "main-tsx",
          title: "src/main.tsx",
          lang: "tsx",
          code: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
          explanation:
            "`createRoot` takes a real DOM node and returns a React root — the boundary between the DOM React controls and the DOM it must not touch. `render` gives that root a tree to display. The `!` is TypeScript's non-null assertion: `getElementById` might return null, and here we are asserting it does not because the div is right there in index.html.",
        },
      ],
      pitfalls: [
        {
          title: "Importing CSS from JavaScript is a build-tool feature, not a language feature",
          body: "`import \"./index.css\"` is not valid JavaScript and no browser can do it. Vite understands it and turns it into a stylesheet in the output. This is worth knowing because it is the first place a React project depends on its build tool rather than on the language — and because it stops working the moment you try to run the file outside that build.",
        },
      ],
    },
    {
      id: "strict-mode",
      heading: "StrictMode, and why your effects run twice",
      body: [
        "`<StrictMode>` is a development-only wrapper. It renders nothing and disappears entirely from production builds. What it does is **deliberately make your components misbehave in the ways React is allowed to misbehave**, so that you find the bugs during development instead of in production.",
        "Concretely, in development it renders every component twice, runs every effect twice (mount, clean up, mount again), and re-runs state updater functions twice.",
        "This *will* confuse you the first time you see a `console.log` appear twice and conclude something is broken. Nothing is broken. React reserves the right to render a component more than once for the same state, and to mount, unmount and re-mount a component while preserving its state — Strict Mode simply exercises that right early. Code that only works when it runs exactly once has a bug; Strict Mode is finding it.",
        "**Do not remove StrictMode to make the double-logging stop.** That is turning off the smoke alarm. Module 5 covers effect cleanup, which is the real fix in almost every case.",
      ],
      examples: [
        {
          id: "strict-mode-double",
          title: "What you will see, and what it means",
          lang: "tsx",
          code: `function Chat() {
  useEffect(() => {
    console.log("connecting…");
    // No cleanup — this is the bug Strict Mode is exposing.
  }, []);

  return <p>Chat</p>;
}

// In development, inside <StrictMode>, the console shows:
//   connecting…
//   connecting…
//
// Two connections were opened and only one will ever be closed.
// The fix is a cleanup function, not removing StrictMode:

function ChatFixed() {
  useEffect(() => {
    const connection = connect();
    return () => connection.close();   // <- runs on unmount
  }, []);

  return <p>Chat</p>;
}`,
          explanation:
            "The doubled log is not the problem; it is the *symptom*. The problem is an effect that acquires something and never releases it. In production that leaks one connection per mount, which is the kind of bug that only shows up under load.",
        },
      ],
    },
    {
      id: "dev-server",
      heading: "The dev server, and the production build",
      body: [
        "`npm run dev` starts Vite's development server. It is not just a file server: it transforms your TypeScript and JSX on the fly, serves modules to the browser individually rather than bundling them, and pushes updates over a websocket when you save.",
        "That last part is **Hot Module Replacement**. When you edit a component, Vite sends just that module to the browser and React swaps it in — *without reloading the page and without losing your state*. A form you had half-filled stays half-filled. This is the single biggest quality-of-life difference from the pre-2020 workflow, and it is worth noticing rather than taking for granted.",
        "`npm run build` produces the deployable output in `dist/`: bundled, minified, tree-shaken JavaScript with hashed filenames. `npm run preview` serves that output locally so you can check the production build before shipping it — which matters, because a few classes of bug only appear there.",
      ],
      examples: [
        {
          id: "scripts",
          title: "The four scripts you get",
          lang: "bash",
          code: `npm run dev        # dev server with hot module replacement
npm run build      # tsc -b, then produce dist/
npm run preview    # serve dist/ locally, as production would
npm run lint       # oxlint, with the rules-of-hooks rule set to error`,
          output: `> my-app@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/react-CHdo91hT.svg    4.12 kB │ gzip:  2.06 kB
dist/assets/vite-BF8QNONU.svg     8.70 kB │ gzip:  1.60 kB
dist/assets/hero-CLDdwZDr.png    13.05 kB
dist/assets/index-D64VDMd1.css    4.10 kB │ gzip:  1.47 kB
dist/assets/index-CP6jzYRJ.js   193.28 kB │ gzip: 60.63 kB

✓ built in 483ms`,
          explanation:
            "Two things to read out of that. The hashes in the filenames are content hashes, which is what lets a CDN cache them forever — change the file and the name changes with it. And the number worth internalising is the last one: **an empty React application is around 60 KB gzipped before you write a line of your own**. That is the entry fee, and it is the main argument the smaller alternatives make against React. Note also which linter ran: newer scaffolds ship `oxlint` rather than ESLint. The rule you actually care about, `rules-of-hooks`, is on either way — module 5 explains why it is not optional.",
        },
      ],
      pitfalls: [
        {
          title: "`npm run build` type-checks; `npm run dev` does not",
          body: "Vite strips TypeScript types without checking them, because checking is slow and the dev server prioritises speed. The check is the `tsc -b` half of the build script, and it is the only place it happens. That means a type error can sit in your code all afternoon and only surface when you build. Keep your editor's TypeScript service running, and do not let `npm run build` be the first thing that ever type-checks your work.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why was Create React App deprecated, and what replaced it?",
      answer:
        "It was built on webpack with a configuration you could not change without ejecting, its dev server had become slow relative to newer tools, and it did not have an answer for server rendering. The React team retired it in 2025 and now points people at either a build tool such as Vite for client-rendered apps, or a framework such as Next.js for anything that needs routing and server rendering.",
    },
    {
      question: "What does createRoot do?",
      answer:
        "It takes a DOM node and returns a React root — the boundary of the DOM that React owns and will reconcile. Calling `.render()` on it hands React a tree to display. It replaced the older `ReactDOM.render` in React 18 because the root object is what enables concurrent rendering features.",
    },
    {
      question: "Why does StrictMode make effects run twice, and should you remove it?",
      answer:
        "It deliberately exercises behaviour React is allowed to perform — rendering a component twice, and unmounting and re-mounting while preserving state — so that code which only works when it runs exactly once fails during development rather than in production. You should not remove it; the double invocation is exposing a missing cleanup function, and it is stripped from production builds anyway.",
    },
  ],
  takeaways: [
    "Create React App is deprecated — use Vite for learning and client-rendered apps, or Next.js for products",
    "`index.html` contains one empty div; everything you build is inserted into it by JavaScript, which is what client-side rendering means",
    "`public/` is copied verbatim and referenced by URL, so a typo is a runtime 404; `src/assets/` is imported by code, so a typo is a build error",
    "There are three tsconfig files because `src/` runs in a browser and `vite.config.ts` runs in Node — the root one compiles nothing and only references the other two",
    "The scaffold deliberately invents no folder structure; that decision is yours, and module 3 covers it",
    "`createRoot(node).render(tree)` is the seam between the page and React",
    "StrictMode is development-only and doubles renders and effects on purpose — the doubled log is a symptom of missing cleanup, not a bug to silence",
    "The dev server offers hot module replacement, which preserves state across edits; the production build is a separate output you should test before shipping",
    "`npm run dev` does not type-check — only `npm run build` does",
  ],
  status: "available",
};
