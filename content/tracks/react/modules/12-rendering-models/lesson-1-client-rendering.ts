import type { Lesson } from "@/content/types";

export const clientRenderingLesson: Lesson = {
  id: "react-client-rendering",
  slug: "client-side-rendering",
  moduleSlug: "client-and-server-rendering",
  title: "Client-Side Rendering: The Empty Div",
  summary:
    "What actually ships when you deploy a Vite React app, the four sequential round trips between the request and the first useful pixel, and the cases where this is genuinely the right answer.",
  estimatedMinutes: 26,
  objectives: [
    "Read the HTML a client-rendered app actually serves",
    "Name the four steps between the request and the content",
    "Say what this costs for search engines and link previews",
    "Recognise the apps for which it is the correct choice",
    "Name the two problems the rest of this module is about",
  ],
  sections: [
    {
      id: "the-document",
      heading: "The whole document",
      body: [
        "Run `npm run build` on the app from module 1 and open `dist/index.html`. What follows is the whole of it — the entire HTML your server sends, for every route, to every visitor, forever.",
        "There is no content in it. Not the title, not the nav, not a single word of the page. The `<div id=\"root\">` is empty, and the only thing that will ever fill it is `main.js`, once it has downloaded and run.",
        "That is client-side rendering: the server sends an application, and the application builds the page.",
      ],
      examples: [
        {
          id: "the-html",
          title: "What the server sends",
          lang: "html",
          code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>viteapp</title>
    <script type="module" crossorigin src="/assets/index-CP6jzYRJ.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-D64VDMd1.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
          explanation:
            "This is `dist/index.html` from a real `vite build` of the module 1 scaffold. The build did one interesting thing to it: replaced the `<script src=\"/src/main.tsx\">` with the hashed bundle and added the stylesheet link. Everything else is the file you have been editing since module 1 — including the `<title>`, which is the project name and is the title of every route in the app.",
        },
      ],
    },
    {
      id: "the-waterfall",
      heading: "Four steps, one after another",
      body: [
        "The cost is not that the browser does the rendering. It is that the four things it needs arrive **in sequence**, each one only discoverable after the previous one has landed.",
        "**1. The document.** Fast — it is a few hundred bytes. The browser paints, and paints nothing.",
        "**2. The bundle.** The document names it, so the download starts as soon as the head is parsed. This is the big one — `vite build` on that untouched scaffold reports `193.28 kB │ gzip: 60.63 kB` for a page that renders a logo and a counter.",
        "**3. Executing it.** Parse, compile, run. On a mid-range phone this is a real number, not a rounding error, and it is CPU-bound so a fast network does not help.",
        "**4. The data.** React renders, an effect fires, and only now does the browser learn what to fetch — because the URL was inside the bundle that just finished executing.",
        "Nothing in that list can start early. The famous consequence is the *loading waterfall*: a component fetches, renders a child, and the child fetches — and each level of the tree is another round trip.",
      ],
      visual: {
        id: "csr-timeline-visual",
        kind: "react-server",
        algorithm: "csr-timeline",
        title: "Request to content, client-rendered",
      },
      pitfalls: [
        {
          title: "The numbers in that visualisation are a model, not a measurement",
          body: "They are arithmetic over a stated set of assumptions — one 50ms round trip, a 120kB bundle, 90ms to execute it — and they are there to show the *shape*: four sequential dependencies, none of which can overlap. Your own numbers come from the Network and Performance panels, and they are the ones worth acting on.",
        },
      ],
    },
    {
      id: "what-it-costs",
      heading: "What it costs beyond the wait",
      body: [
        "**Search engines and crawlers.** Google renders JavaScript, but it does so in a second pass with its own queue, so indexing is delayed and unpredictable. Everything else — Bing, Slack, Twitter, Facebook, LinkedIn, iMessage — largely does not. A link to a client-rendered page previews as its `<title>` and nothing else, because there is nothing else in the document.",
        "**Metadata per route.** One `index.html` means one title, one description, one Open Graph image, for every URL. Setting them from JavaScript works for the browser tab and does not work for the crawler that already left.",
        "**The perceived start.** A white screen has no information in it. A skeleton is better and still tells the user nothing about whether the page is working.",
        "**It is worst on the worst devices.** The two expensive steps — executing the bundle and rendering the tree — are CPU work, and CPU is exactly what a cheap Android phone does not have. The gap between a fast laptop and a slow phone is much wider here than for anything the network does.",
      ],
    },
    {
      id: "when-its-right",
      heading: "When it is the right answer",
      body: [
        "This is not a lesson about why client rendering is bad. It is the correct choice for a large class of applications, and picking a server framework for one of them is a real cost paid for nothing.",
        "**Anything behind a login.** An admin panel, a dashboard, an internal tool. Nobody indexes it, nobody shares links into it, and the user is signed in for hours — a slower first load in exchange for a much simpler deployment is a good trade.",
        "**Anything that is not a document.** A design tool, an editor, a map, a game. The first screen is an application, not content, and there is no meaningful HTML for a server to have sent.",
        "**Anything shipped as a static file.** An Electron app, a Chrome extension, a Capacitor build. There is no server to render on.",
        "**A team without a server.** A `dist/` folder on a CDN has no runtime, no scaling, no cold starts and no bill. That is a genuine architectural advantage, and moving to server rendering means giving it up.",
        "What client rendering is *not* right for is the case it is most often used for: a public, content-shaped page where being found and being fast on a phone are the whole point.",
      ],
    },
    {
      id: "the-two-problems",
      heading: "The two problems",
      body: [
        "Everything in the rest of this module is an answer to one of exactly two questions.",
        "**Who renders the HTML, and when?** The browser at request time (this lesson), the server at request time (lesson 2), or a build machine, once, in advance (lesson 5).",
        "**How much JavaScript has to reach the browser?** Server rendering answers the first question and not the second — the bundle still ships, in full, and hydration still runs. Server Components are the answer to the second, which is why they are a separate idea rather than a better SSR.",
        "Keep those two apart and the rest of this module stays simple. Mix them together and every discussion of Server Components becomes an argument about SSR.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a client-rendered React app actually serve?",
      answer:
        "A near-empty HTML document — a `<div id=\"root\"></div>`, a script tag and a stylesheet link — and the same one for every route. All the content is produced in the browser once the bundle has downloaded and run, which is why viewing source on a Vite-built app shows you no page text at all.",
    },
    {
      question: "Why is client rendering slow to first content?",
      answer:
        "Because four things happen in sequence and none can start early: the document arrives and paints nothing, the bundle downloads, the bundle executes, and only then does the app discover what data it needs and fetch it. Each is gated on the previous one. The two expensive steps are CPU-bound, so they hurt most on the cheap phones where the network is not the bottleneck.",
    },
    {
      question: "What does client rendering cost you beyond the wait?",
      answer:
        "Discoverability. Google renders JavaScript in a delayed second pass; most other crawlers and every link-preview bot do not, so a shared link previews as a title and nothing else. And one `index.html` means one title and one Open Graph image for every route — setting them from JavaScript is too late for the crawler that has already gone.",
    },
    {
      question: "When is client-side rendering the right choice?",
      answer:
        "When nothing is indexing you and the first screen is an application rather than a document: anything behind a login, an editor or a map or a game, anything shipped as a static file such as an Electron app or a browser extension. It also buys a real operational advantage — a folder on a CDN with no runtime, no scaling and no cold starts — which server rendering asks you to give up.",
    },
  ],
  takeaways: [
    "A client-rendered app serves one near-empty document for every route",
    "Document → bundle → execute → fetch, strictly in sequence",
    "Both expensive steps are CPU work, so slow phones suffer most",
    "Most crawlers and every link-preview bot see the empty document",
    "One `index.html` means one set of metadata for the whole app",
    "It is the right answer behind a login, for application-shaped screens, and for static distribution",
    "Two separate questions drive this module: who renders the HTML, and how much JavaScript ships",
  ],
  status: "available",
};
