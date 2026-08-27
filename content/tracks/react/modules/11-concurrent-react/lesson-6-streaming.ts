import type { Lesson } from "@/content/types";

export const streamingLesson: Lesson = {
  id: "react-streaming",
  slug: "streaming",
  moduleSlug: "concurrent-react",
  title: "Streaming: Sending a Page in Pieces",
  summary:
    "What renderToPipeableStream actually puts on the wire, in what order, and why. The shell, the boundary placeholders, the hidden divs that arrive later — printed from a real render — and what this changes about where you draw a boundary.",
  estimatedMinutes: 28,
  objectives: [
    "Say what the shell is and what decides its boundary",
    "Read the markers React puts in streamed HTML",
    "Explain how a late chunk reaches its place with JavaScript disabled",
    "Choose the right server rendering API",
    "Place boundaries for time-to-first-byte rather than for looks",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The all-or-nothing render",
      body: [
        "`renderToString` does what its name says: it renders the whole tree and returns a string. Which means the response cannot start until the slowest thing on the page has finished — one slow query and the user is looking at a blank browser tab for the duration.",
        "It is also synchronous, so it cannot wait for anything at all. Any component that suspends gets its fallback in the output, permanently, and no data is ever fetched during the render.",
        "Streaming fixes both. React sends the parts of the page it can render immediately, keeps the connection open, and sends each Suspense boundary's real content as its data arrives.",
      ],
      visual: {
        id: "streaming-visual",
        kind: "react-concurrent",
        algorithm: "streaming",
        title: "Four pieces, in the order they are ready",
        lockAlgorithm: true,
      },
    },
    {
      id: "the-shell",
      heading: "The shell",
      body: [
        "The **shell** is everything outside every Suspense boundary — the part of the page that does not depend on anything slow. React renders it first and flushes it as soon as it is complete.",
        "So the boundaries do not only decide what the loading state looks like; they decide **what the shell is**, and therefore how fast the first byte is. Move a boundary up and the shell gets smaller and arrives sooner. Remove all the boundaries and the shell is the whole page and streaming has bought you nothing.",
        "`onShellReady` fires at that moment, and it is where you start piping. If the shell itself throws, `onShellError` fires instead and you have a real error page rather than a half-sent one — which is why the shell should never contain anything that can fail.",
      ],
    },
    {
      id: "the-wire",
      heading: "What is actually on the wire",
      body: [
        "This is worth seeing rather than describing, so here is a two-boundary page rendered for real, with each chunk printed as it is flushed.",
      ],
      examples: [
        {
          id: "chunks",
          title: "Two chunks from one response",
          lang: "tsx",
          code: `import { Suspense, use } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";

let arrive: (value: string) => void;
const comments = new Promise<string>((resolve) => { arrive = resolve; });

function Comments() { return <p>{use(comments)}</p>; }

function Page() {
  return (
    <main>
      <h1>A post</h1>
      <Suspense fallback={<p>Loading comments…</p>}>
        <Comments />
      </Suspense>
    </main>
  );
}

const chunks: string[] = [];
const sink = new Writable({
  write(chunk, _encoding, done) { chunks.push(String(chunk)); done(); },
});

sink.on("finish", () => {
  chunks.forEach((chunk, i) => {
    /* The inline scripts are React's own boundary-swapping code, and they are
       long. Their length is the point, not their contents. */
    const readable = chunk.replace(
      /<script>[\\s\\S]*?<\\/script>/g,
      (s) => \`<script>…\${s.length} bytes…</script>\`
    );
    console.log(\`chunk \${i + 1}: \${readable}\`);
  });
});

const { pipe } = renderToPipeableStream(<Page />, {
  onShellReady() {
    /* The shell goes out now; the comments are still in flight. */
    pipe(sink);
    setTimeout(() => arrive("Two comments"), 10);
  },
});`,
          output: `chunk 1: <main><h1>A post</h1><!--$?--><template id="B:0"></template><p>Loading comments…</p><!--/$--></main><script>…74 bytes…</script>
chunk 2: <div hidden id="S:0"><p>Two comments</p></div><script>…862 bytes…</script>`,
          explanation:
            "Read chunk 1 carefully. `<!--$?-->` and `<!--/$-->` are the comment markers that delimit a suspended boundary — React uses comments because they are legal in any position that HTML allows. Between them sits the fallback, and a `<template id=\"B:0\">` marking the slot. The browser is already parsing and painting this.",
        },
      ],
    },
    {
      id: "the-swap",
      heading: "How the second chunk gets to the right place",
      body: [
        "Chunk 2 does not arrive where it belongs. It cannot — the browser appends to the end of the document, and the boundary is in the middle of it.",
        "So React sends the content in a `<div hidden id=\"S:0\">`, which is parsed and *not* displayed, followed by a script that finds `B:0`, moves the children of `S:0` into its place, and removes the marker. That is the 862 bytes in chunk 2: React's own DOM-swapping routine, sent once and reused for every subsequent boundary.",
        "Three things follow from this that are easy to miss.",
        "**It works before hydration.** That script is plain DOM manipulation, not React. Content streamed into the page appears whether or not the bundle has downloaded, which is the point.",
        "**Order does not matter.** Each boundary has its own id, so boundaries can arrive in any order — whichever query finishes first goes first, and the visual arrangement of the page is unaffected.",
        "**It needs JavaScript.** With scripts disabled, the fallbacks stay and the content sits in hidden divs at the bottom of the document. Streaming is a progressive enhancement over the shell, not a replacement for it — one more reason for the shell to be the part that matters.",
      ],
    },
    {
      id: "the-apis",
      heading: "Which API",
      body: [
        "**`renderToPipeableStream`** — Node. Returns `{ pipe, abort }` and takes the `onShellReady` / `onShellError` / `onError` / `onAllReady` callbacks. This is what a Node server uses.",
        "**`renderToReadableStream`** — Web Streams. Same behaviour for Deno, Bun, Cloudflare Workers and other edge runtimes. Returns a promise for a `ReadableStream`.",
        "**`renderToString`** — synchronous, no streaming, no data fetching. Suspense boundaries emit their fallbacks and never resolve.",
        "**`renderToStaticMarkup`** — the same, minus the hydration markers. For output nobody will hydrate: an email, an RSS item, an OG image. Never for a page.",
        "If you are using a framework, you are not calling any of these. Next.js, Remix and TanStack Start own the server render, and what you actually control is where the boundaries go.",
      ],
      examples: [
        {
          id: "on-all-ready",
          title: "The two moments you can start sending",
          lang: "tsx",
          code: `const { pipe } = renderToPipeableStream(<Page />, {
  bootstrapScripts: ["/main.js"],

  /* Stream. Send the shell now and each boundary as it resolves — the right
     default for a page a person is waiting on. */
  onShellReady() {
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    pipe(response);
  },

  /* Buffer. Wait for everything, then send it in one piece. The right
     choice for a crawler that will not run the swap scripts, and the only
     honest way to set a non-200 status based on something a boundary
     discovered — the header is long gone by the time it resolves. */
  // onAllReady() { pipe(response); },

  onShellError() {
    response.statusCode = 500;
    response.send("<h1>Something went wrong</h1>");
  },

  /* Every error from any boundary, including ones a client boundary will
     later retry. Log here; do not try to change the response. */
  onError(error) { logger.error(error); },
});`,
          explanation:
            "`bootstrapScripts` matters more than it looks: React adds the script tag itself so it can be sent at the right moment relative to the streamed content, which is what lets hydration begin while later boundaries are still arriving.",
        },
      ],
      pitfalls: [
        {
          title: "The status code is decided before the page is",
          body: "Once the shell is sent the headers are gone, so a 404 discovered inside a Suspense boundary cannot become a 404 response. Either resolve anything that determines the status before the shell — outside every boundary — or use `onAllReady` for that route and give up streaming on it.",
        },
      ],
    },
    {
      id: "placement",
      heading: "What this changes about boundary placement",
      body: [
        "In a client app, a Suspense boundary is about what the user looks at while waiting. On a server it is also about **when the response starts**, and those two goals do not always point the same way.",
        "The useful question becomes: *what is the fastest thing on this page that is worth painting?* That is the shell, and everything slower than it belongs inside a boundary.",
        "In practice that means the boundary usually goes around the data, not around the layout. A header, a nav and a page frame need no query and belong in the shell. A list that needs a database round trip belongs behind a boundary, even if the design shows it as the main content — because a nav that arrives in 30ms is a page the user can start using while the list renders.",
        "And the reverse mistake is worth naming: a boundary around something *fast* costs you a chunk, a marker pair and a script for no benefit at all.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is streaming SSR and what does it change?",
      answer:
        "Instead of rendering the whole tree to a string and sending it at the end, React sends the response in pieces over an open connection. Everything outside every Suspense boundary is the shell and goes first; each boundary's real content is sent as its data resolves. Time to first byte stops depending on the slowest query on the page, and the user gets something readable while the rest is still being fetched.",
    },
    {
      question: "How does content that arrives late end up in the right place?",
      answer:
        "React marks the boundary in the shell with HTML comments and an empty `<template>` carrying an id, and shows the fallback between them. The later chunk arrives as a `<div hidden>` with the real content plus a small inline script that moves those children into the marked slot and removes the placeholder. It is plain DOM work, so it happens before hydration and in any order — but it does require JavaScript, so with scripts off the fallbacks remain.",
    },
    {
      question: "What is the shell, and how do you make it smaller?",
      answer:
        "Everything not inside a Suspense boundary — the part React can render with no waiting. It is flushed as one piece, so it is the whole of your time to first byte. You shrink it by moving boundaries up: anything that needs a query belongs inside one, and the layout that needs nothing belongs outside. A page with no boundaries has the whole page as its shell, which is `renderToString` with extra steps.",
    },
    {
      question: "Why can a streamed response not return a 404 discovered inside a boundary?",
      answer:
        "Because the headers were sent with the shell, long before that boundary resolved. Anything that determines the status has to be resolved outside every boundary, before the shell is flushed — or that route has to use `onAllReady`, which buffers the whole page and gives up streaming in exchange for being able to set the status at the end.",
    },
  ],
  takeaways: [
    "The shell is everything outside every Suspense boundary, and it is your time to first byte",
    "Each boundary's content is flushed as its own data resolves, in whatever order that happens",
    "A late chunk arrives as a hidden div plus a script that moves it into a marked slot",
    "That swap is plain DOM work: it happens before hydration, but it needs JavaScript",
    "`renderToPipeableStream` for Node, `renderToReadableStream` for Web Streams runtimes",
    "`renderToString` never resolves a boundary; `renderToStaticMarkup` is for output nobody hydrates",
    "Status codes are fixed when the shell is sent — resolve them outside every boundary",
    "Put boundaries around the data and keep the layout in the shell",
  ],
  status: "available",
};
