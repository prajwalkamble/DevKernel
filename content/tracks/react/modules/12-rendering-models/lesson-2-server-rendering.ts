import type { Lesson } from "@/content/types";

export const serverRenderingLesson: Lesson = {
  id: "react-server-rendering",
  slug: "server-side-rendering",
  moduleSlug: "client-and-server-rendering",
  title: "Server-Side Rendering",
  summary:
    "Running your components on a server and sending the HTML they produce. What renderToString really emits — including the markers nobody explains — what is missing from it, and the window where a page looks finished and does nothing.",
  estimatedMinutes: 28,
  objectives: [
    "Render a component to HTML on a server",
    "Read the comment markers React puts in the output",
    "Say what is not in the HTML and why",
    "Describe the uncanny valley between paint and interactivity",
    "Choose between renderToString and renderToStaticMarkup",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The idea, and the whole of it",
      body: [
        "React components are functions that return a description of a tree. Nothing about that requires a browser. So run them on the server, turn the result into HTML, and put that HTML in the response.",
        "The browser now paints real content on its first paint. The bundle still downloads, still executes, and still builds the same tree — but it does so behind a page the user is already reading.",
        "That is server-side rendering. Two APIs and one idea.",
      ],
    },
    {
      id: "the-output",
      heading: "What comes out",
      body: [
        "Worth looking at closely, because two things in the output surprise people.",
      ],
      examples: [
        {
          id: "two-renderers",
          title: "The same tree, two server renderers",
          lang: "jsx",
          code: `import { renderToString, renderToStaticMarkup } from "react-dom/server";

function Post({ title, likes }) {
  return (
    <article className="post">
      <h1>{title}</h1>
      <p>{likes} likes</p>
      <button onClick={() => alert("hi")}>Like</button>
    </article>
  );
}

const tree = <Post title="Hello" likes={3} />;
console.log("renderToString:      ", renderToString(tree));
console.log("renderToStaticMarkup:", renderToStaticMarkup(tree));`,
          output: `renderToString:       <article class="post"><h1>Hello</h1><p>3<!-- --> likes</p><button>Like</button></article>
renderToStaticMarkup: <article class="post"><h1>Hello</h1><p>3 likes</p><button>Like</button></article>`,
          explanation:
            "First: **the `onClick` is not there.** It cannot be — a function has no HTML representation. The server sends the shape of the page; the behaviour arrives in the bundle. That single fact explains everything in the rest of this lesson.\n\nSecond: `<!-- -->` in the `renderToString` output. `{likes}` and `\" likes\"` are two separate text children, and once serialised they would be indistinguishable from one. The empty comment keeps them apart so the client's walk finds the same two nodes the server did. `renderToStaticMarkup` omits it because nothing will hydrate that output.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToString, renderToStaticMarkup } from "react-dom/server";

function Post({ title, likes }: { title: string; likes: number }) {
  return (
    <article className="post">
      <h1>{title}</h1>
      <p>{likes} likes</p>
      <button onClick={() => alert("hi")}>Like</button>
    </article>
  );
}

const tree = <Post title="Hello" likes={3} />;
console.log("renderToString:      ", renderToString(tree));
console.log("renderToStaticMarkup:", renderToStaticMarkup(tree));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`className` becomes `class`, and that is React's own translation",
          body: "The server renderer emits real HTML attribute names, which is a small reminder that `className` was only ever a JavaScript-side workaround for `class` being a reserved word. Everything in that output is HTML the browser would have accepted from any source.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape of a server-rendered request",
      body: [
        "The server does four things, and only the third is React.",
        "**Route.** Work out which component tree this URL means.",
        "**Fetch.** Get its data — usually straight from the database, since the server is already there, with no HTTP round trip and no client-side auth token.",
        "**Render.** Call `renderToString` (or, better, `renderToPipeableStream`, which is module 11's lesson 6).",
        "**Serialise.** Put the data you fetched into the response too, as JSON, so the client can render the same tree without fetching it again.",
        "That fourth step is not optional and is easy to miss. Without it, the client mounts, has no data, and fetches everything again — the server render bought a first paint and nothing else.",
      ],
      examples: [
        {
          id: "the-server",
          title: "The whole thing, without a framework",
          lang: "jsx",
          code: `import { renderToString } from "react-dom/server";

app.get("/post/:id", async (req, res) => {
  const post = await db.posts.find(req.params.id);

  const html = renderToString(<App post={post} />);

  res.send(\`<!doctype html>
<html lang="en">
  <head>
    <title>\${escapeHtml(post.title)}</title>
    <script type="module" src="/assets/main.js"></script>
  </head>
  <body>
    <div id="root">\${html}</div>
    <script>
      /* The same data, so the client's first render matches the server's
         without a second request. JSON.stringify is not safe here on its
         own: a "</script>" inside the data would end this tag. */
      window.__DATA__ = \${serialise(post)};
    </script>
  </body>
</html>\`);
});`,
          explanation:
            "Around fifteen lines, and every one of them is a decision a framework would have made for you: which routes render on the server, where the data goes, how it is escaped, what the document shell looks like. This is why nobody hand-rolls SSR — not because it is hard to start, but because the list of decisions keeps growing.",
        },
      ],
      pitfalls: [
        {
          title: "Serialised state is an injection hole",
          body: "`JSON.stringify` inside a `<script>` tag is not safe: a `</script>` in any string field closes the tag and everything after it is markup. Use a serialiser that escapes `<`, or put the data in a `<script type=\"application/json\">` and parse it with `JSON.parse(el.textContent)`, which cannot execute anything.",
        },
      ],
    },
    {
      id: "what-changes",
      heading: "What changes in the components",
      body: [
        "Less than you would guess, and the exceptions are worth knowing before you meet them at 2am.",
        "**No `window`, no `document`, no `localStorage`.** Reading any of them during render throws on the server. The rule is that the *render* must not touch the browser; an effect may, because effects do not run on the server at all.",
        "**No effects.** `useEffect` and `useLayoutEffect` never run during a server render. Anything that only happens in an effect has not happened yet when the HTML is produced.",
        "**Refs are null.** There is no DOM to attach to.",
        "**Cleanup does not run either**, so anything a render allocates on the server is leaked. This is why a render that opens a connection is a much worse idea on a server than in a browser.",
        "**One render, no updates.** `setState` during a server render does nothing useful; there is no second pass.",
      ],
      examples: [
        {
          id: "browser-only",
          title: "The two shapes for browser-only values",
          lang: "jsx",
          code: `/* Wrong: throws on the server, because there is no window. */
function Width() {
  return <p>{window.innerWidth}px</p>;
}

/* Right, version one: render the server's answer, correct after mount.
   Costs one extra client render and never mismatches. */
function Width() {
  const [width, setWidth] = useState(null);
  useEffect(() => setWidth(window.innerWidth), []);
  return <p>{width === null ? "…" : \`\${width}px\`}</p>;
}

/* Right, version two: the same thing declared once, with the server's
   answer as an explicit argument. Module 10's hook, doing exactly the
   job it was added for. */
const subscribe = (onChange) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
function Width() {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth, () => null);
  return <p>{width === null ? "…" : \`\${width}px\`}</p>;
}`,
          explanation:
            "Both correct versions have the same shape: the server produces a neutral value, the client corrects it after mounting. What you must not do is have the server guess — a server that renders `1024px` and a client that renders `390px` is the mismatch in lesson 4.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Wrong: throws on the server, because there is no window. */
function Width() {
  return <p>{window.innerWidth}px</p>;
}

/* Right, version one: render the server's answer, correct after mount.
   Costs one extra client render and never mismatches. */
function Width() {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => setWidth(window.innerWidth), []);
  return <p>{width === null ? "…" : \`\${width}px\`}</p>;
}

/* Right, version two: the same thing declared once, with the server's
   answer as an explicit argument. Module 10's hook, doing exactly the
   job it was added for. */
const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
function Width() {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth, () => null);
  return <p>{width === null ? "…" : \`\${width}px\`}</p>;
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-valley",
      heading: "The window where it looks finished and is not",
      body: [
        "This is the honest cost of server rendering, and it is rarely stated plainly.",
        "The HTML paints as soon as it arrives. The handlers exist only after the bundle has downloaded, executed and hydrated. Between those two moments the page is **fully rendered and completely dead** — buttons depress and do nothing, menus do not open, a form submits as a plain HTML form or not at all.",
        "Client rendering does not have this problem, because a blank screen at least tells the truth. Server rendering trades an honest wait for a dishonest one, and on a slow phone the dishonest one is longer.",
        "There are only three real mitigations, and none of them is a trick: **send less JavaScript** (module 13's code splitting, and lesson 6's Server Components), **stream** so hydration can start earlier (module 11), and **make the first screen work without JavaScript** where it can — a real `<form action>` that a browser can submit on its own is not a nostalgia act, it is the only thing on the page that works during that window.",
      ],
      pitfalls: [
        {
          title: "A metric that measures exactly this",
          body: "Interaction to Next Paint (INP) is a Core Web Vital, and an interaction during the hydration gap is the worst kind: the user clicked, the page was visibly ready, and nothing happened. It is measured on real users, so it counts the slow phones that a local Lighthouse run does not.",
        },
      ],
    },
    {
      id: "cost",
      heading: "What it costs to run",
      body: [
        "Client rendering deploys a folder to a CDN. Server rendering needs a process, per request, that renders your whole component tree — and `renderToString` is synchronous and CPU-bound, so it blocks the event loop for its duration.",
        "That means it is a genuine capacity question: server rendering is not free per request the way serving a file is, it does not cache the way a static file caches, and a traffic spike is now a compute problem. Streaming helps, because the loop is released between chunks. Static generation (lesson 5) sidesteps it entirely by doing the render once, ahead of time.",
        "None of that is an argument against it. It is the argument for reading lesson 8 before making the choice per screen rather than per app.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is server-side rendering in React?",
      answer:
        "Running the components on a server, turning the result into HTML with `renderToString` or a streaming renderer, and sending that HTML in the response. The browser paints real content on its first paint instead of an empty div. The bundle still downloads and still builds the same tree — but behind a page the user can already read.",
    },
    {
      question: "What is missing from server-rendered HTML?",
      answer:
        "The behaviour. Event handlers are functions and have no HTML representation, so `onClick` simply does not appear in the output — which is why the page is readable long before it is usable. What the server does emit that a static renderer does not is the hydration markers: an empty `<!-- -->` comment between adjacent text children, so the client's walk finds the same nodes the server produced.",
    },
    {
      question: "What in a component behaves differently on the server?",
      answer:
        "Effects never run, refs are null, cleanups never run, and there is no `window`, `document` or `localStorage` — reading any of them during render throws. There is also only one render, so `setState` during it achieves nothing. The working rule is that the render must not touch the browser, and anything that must may only do so in an effect, which the server never reaches.",
    },
    {
      question: "What is the downside of server rendering that people forget?",
      answer:
        "The window between paint and hydration, where the page is fully rendered and entirely dead — buttons do nothing, menus do not open. Client rendering does not have it because a blank screen tells the truth. The mitigations are to ship less JavaScript, to stream so hydration can start earlier, and to make the first screen work without JavaScript where it can. There is also a real operational cost: rendering is CPU work per request, and it does not cache the way a file does.",
    },
  ],
  takeaways: [
    "SSR runs the same components on a server and sends the HTML they produce",
    "Event handlers are not in the output — behaviour arrives with the bundle",
    "`<!-- -->` separates adjacent text children so hydration finds the same nodes",
    "`renderToStaticMarkup` omits those markers, for output nobody will hydrate",
    "Serialise the data into the response too, or the client fetches everything again",
    "Effects, refs, cleanups and `window` do not exist during a server render",
    "Between paint and hydration the page looks finished and does nothing",
    "Rendering per request is CPU work that does not cache like a static file",
  ],
  status: "available",
};
