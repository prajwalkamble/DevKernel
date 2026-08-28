import type { Lesson } from "@/content/types";

export const serverComponentsLesson: Lesson = {
  id: "react-server-components",
  slug: "react-server-components",
  moduleSlug: "client-and-server-rendering",
  title: "React Server Components",
  summary:
    "Components that run on the server and never ship. The thing they change that server rendering does not, the payload format printed from a real build, what they cannot do, and a measured before-and-after on a bundle.",
  estimatedMinutes: 34,
  objectives: [
    "Say what a Server Component is and how it differs from SSR",
    "Read a real RSC payload and identify the two kinds of entry",
    "List what a Server Component cannot do, and why each one follows",
    "Show the bundle difference a boundary makes",
    "Say what infrastructure Server Components require",
  ],
  sections: [
    {
      id: "the-distinction",
      heading: "The distinction that has to come first",
      body: [
        "Server-side rendering runs your components on a server to produce HTML — and then **ships them to the browser as well**, because they have to hydrate. The bundle is unchanged. SSR answers *when the first paint happens* and nothing else.",
        "A Server Component runs on the server and **is not in the bundle at all**. Not a smaller version of it; not there. What reaches the browser is the output it produced.",
        "So the two are orthogonal, and the confusion between them is the single biggest source of nonsense written about this topic. A Server Component is not \"SSR done better\". It is an answer to a different question: *how much JavaScript has to reach the browser?*",
      ],
    },
    {
      id: "what-they-are",
      heading: "What one looks like",
      body: [
        "An ordinary component, with one new capability: it may be `async`, and it may await directly.",
        "There is no `useEffect`, no loading state, no fetch in the browser, and no round trip — the query runs on the same machine as the database. And when this component's render is done, its code has no further purpose, so it is not sent anywhere.",
      ],
      examples: [
        {
          id: "an-rsc",
          title: "A Server Component",
          lang: "tsx",
          code: `/* No "use client" at the top of the file, so this runs on the server —
   which in the Server Components model is the default, not the opt-in. */
import { marked } from "marked";

export default async function Post({ id }: { id: string }) {
  /* Straight to the database. No API route, no fetch, no auth token to
     forward: this code is already inside the trust boundary. */
  const post = await db.posts.find(id);

  /* A 40kB markdown parser, running here. The browser never sees it — it
     receives the HTML this produced. */
  const html = await marked.parse(post.body);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {/* A Client Component, referenced by a Server one. */}
      <LikeButton postId={post.id} initial={post.likes} />
    </article>
  );
}`,
          explanation:
            "Three things here are impossible in a client component: the `async` function itself, the direct database access, and the dependency that does not ship. The fourth thing — rendering `<LikeButton>` — is what makes the model usable rather than a curiosity.",
        },
      ],
    },
    {
      id: "the-payload",
      heading: "What actually goes over the wire",
      body: [
        "A Server Component does not produce HTML for the client to hydrate. It produces a **serialised description of the rendered tree**, in React's own format, and the browser's React reconstructs elements from it.",
        "This is worth seeing, because it makes the whole model concrete in a way no amount of prose does. What follows is the interesting part of a real payload, taken from a `next build` of a page with one Server Component and one Client Component.",
      ],
      examples: [
        {
          id: "real-payload",
          title: "Two lines from a real .rsc file",
          lang: "bash",
          code: `d:I[50877,["/_next/static/chunks/3fntmmi971322.js","/_next/static/chunks/2yg1tx01t30tg.js"],"Counter"]
4:["$","main",null,{"children":[["$","h1",null,{"children":"A server-rendered title"}],["$","$Ld",null,{"label":"Likes"}]]}]`,
          explanation:
            "Line `4` is the rendered tree: `main`, containing an `h1` whose child is the string the server produced. The component that produced it is nowhere — only its output is here, as data.\n\nLine `d` is the other kind of entry. `I[…]` is a **client reference**: a module id, the chunks the browser must load to get it, and the export name. Inside the tree, `\"$Ld\"` points at it, and the props sit beside it in plain JSON.\n\nThat is the entire model in two lines. Server Components arrive as the result of running them; Client Components arrive as an instruction to go and fetch some JavaScript.",
          requires: "a Next.js build (this is the .rsc output of one, not a program)",
        },
      ],
      pitfalls: [
        {
          title: "Why a payload rather than HTML",
          body: "Because it has to be re-renderable. On a client-side navigation the browser fetches a new payload and reconciles it against the current tree, so component state below unchanged boundaries survives — a scroll position, an open menu, a form in progress. HTML could not do that: replacing markup destroys everything. On the *first* load you get both, HTML for the paint and the payload inlined for hydration.",
        },
      ],
    },
    {
      id: "cannot",
      heading: "What they cannot do, and why each follows",
      body: [
        "Every restriction comes from one fact: **the component ran once, on a machine that has already sent its response and forgotten about you.**",
        "**No state.** `useState` promises that a value survives between renders and that setting it causes another one. On a server there is no second render and nothing to survive into.",
        "**No effects.** `useEffect` runs after a commit to a DOM. There is no DOM here and no commit.",
        "**No event handlers.** A function cannot be serialised, so `onClick` cannot cross to the browser. This is the restriction people hit first and it is the same fact as the previous two.",
        "**No browser APIs.** No `window`, no `localStorage`, no `document`. There is no browser.",
        "**No context.** A Server Component cannot read a context provided by a Client Component, because the provider only exists in the browser. Pass a prop instead.",
        "None of this is a limitation React chose to impose. It is what running on a server means, and the reason the boundary exists is that some components genuinely need the things on this list.",
      ],
      visual: {
        id: "server-components-visual",
        kind: "react-server",
        algorithm: "server-components",
        title: "Which components reach the browser",
      },
    },
    {
      id: "measured",
      heading: "What it is worth, measured",
      body: [
        "The claim is that moving a dependency across the boundary removes it from the bundle. That is easy to check: build the same page twice, once with a markdown parser used in a Server Component and once with the identical parser used in a Client Component, and measure the client chunks.",
      ],
      examples: [
        {
          id: "bundle-diff",
          title: "One import, moved across the boundary",
          lang: "bash",
          code: `# The page renders the same markdown either way. The only difference is
# which side of the "use client" boundary the parser is imported on.

$ du -sb .next/static/chunks     # marked imported in the Server Component
564446   .next/static/chunks

$ du -sb .next/static/chunks     # marked imported in the Client Component
606729   .next/static/chunks`,
          explanation:
            "42,283 bytes, for a small library, on a page with almost nothing else in it. Nothing was minified differently and no configuration changed — the parser simply had no reason to be in the browser in the first case and every reason in the second. That is the whole argument for Server Components, and it scales with how much of your tree is presentation rather than interaction.",
          requires: "two Next.js builds (these are du figures from them, not a program's output)",
        },
      ],
      pitfalls: [
        {
          title: "The saving is not compression, and it is not tree-shaking",
          body: "Tree-shaking removes code nothing references. This removes code that *is* referenced and used — it just runs somewhere else. That is why it can move dependencies a bundler could never touch: a date library with every locale in it, a syntax highlighter, an ORM.",
        },
      ],
    },
    {
      id: "what-it-takes",
      heading: "What it takes to use them",
      body: [
        "This is the honest caveat, and it is a large one.",
        "Server Components need a **bundler that understands the boundary** (to build two module graphs and emit client references), a **server runtime that can render the payload**, and a **router that knows how to request one on navigation**. React ships the primitives; it does not ship any of those three.",
        "So in practice this means a framework: Next.js's App Router, or React Router v7 / Remix, or TanStack Start, or a Vite setup with an RSC plugin. You cannot add Server Components to a create-vite app, and the recurring question of \"how do I use RSC without a framework\" has an unsatisfying answer: by writing one.",
        "It is also worth being clear about who this is for. If your app is behind a login and nobody indexes it, the bundle argument is much weaker than for a public, content-heavy site — and the added infrastructure is a real cost. Server Components are a strong answer to a specific problem, not a general upgrade.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a React Server Component, and how is it different from SSR?",
      answer:
        "SSR runs your components on a server to produce HTML and then ships those same components to the browser, because they have to hydrate — the bundle is unchanged, and only the timing of the first paint improves. A Server Component runs on the server and is never sent at all: what reaches the browser is its output. They answer different questions — SSR answers when the first paint happens, Server Components answer how much JavaScript has to arrive.",
    },
    {
      question: "What does a Server Component send to the browser?",
      answer:
        "A serialised description of the rendered tree, in React's own format, not HTML. Elements appear as data — a tag, props, children — and a Client Component appears as a *client reference*: a module id, the chunks needed to load it, and an export name, with its props inline. It is a payload rather than markup because it has to be re-renderable: on a client navigation React reconciles the new payload against the current tree, so state below unchanged boundaries survives.",
    },
    {
      question: "What can a Server Component not do?",
      answer:
        "State, effects, event handlers, browser APIs, and reading a context provided on the client. All five come from one fact: it ran once on a machine that has already sent its response. There is no second render for state to survive into, no DOM for an effect to run after, and no way to serialise a function so `onClick` could cross. Anything needing those goes in a Client Component.",
    },
    {
      question: "What do Server Components actually save?",
      answer:
        "Bundle size, measurably — moving one markdown parser from a Client Component to a Server Component removed 42kB from the client chunks of an otherwise empty page. Crucially this is not tree-shaking: the code is referenced and used, it just runs somewhere else, which is why it can eliminate dependencies a bundler could never remove. They also remove the client-side data waterfall, since the component awaits its own data on the server.",
    },
    {
      question: "What do you need in order to use them?",
      answer:
        "A framework. They require a bundler that builds two module graphs and emits client references, a server runtime that can render and stream the payload, and a router that requests a payload on navigation — none of which React ships. So it is Next.js's App Router, React Router v7, TanStack Start, or a Vite RSC plugin. You cannot add them to a create-vite app.",
    },
  ],
  takeaways: [
    "SSR ships your components anyway; a Server Component is never in the bundle",
    "They answer different questions — first paint against how much JavaScript arrives",
    "A Server Component may be `async` and await a query directly, with no round trip",
    "The wire format is a serialised tree, not HTML, so it can be reconciled on navigation",
    "A Client Component appears in it as a reference: module id, chunks, export name, props",
    "No state, no effects, no handlers, no browser APIs, no client context — all one fact",
    "Moving one parser across the boundary measured 42kB off the client chunks",
    "The saving is not tree-shaking: the code is used, it just runs elsewhere",
    "They require a framework — bundler, server runtime and router all have to cooperate",
  ],
  status: "available",
};
