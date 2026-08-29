import type { Lesson } from "@/content/types";

export const hydrationLesson: Lesson = {
  id: "react-hydration",
  slug: "hydration",
  moduleSlug: "client-and-server-rendering",
  title: "Hydration",
  summary:
    "Attaching React to HTML that already exists. What hydrateRoot does differently from createRoot, proof that the DOM nodes are reused rather than recreated, and why the same page can be visible and dead at the same time.",
  estimatedMinutes: 28,
  objectives: [
    "Use hydrateRoot and say how it differs from createRoot",
    "Show that hydration reuses the existing DOM nodes",
    "Explain why the first client render must match the server's",
    "Say what selective hydration changes",
    "Measure the gap between paint and interactivity",
  ],
  sections: [
    {
      id: "the-job",
      heading: "The job",
      body: [
        "The server sent HTML. The browser parsed it, built a DOM, and painted it. React now starts up in a page that already contains, structurally, exactly what React was going to build.",
        "It would be wasteful to build it again — and worse than wasteful: replacing the DOM would throw away the paint the user is looking at, lose any focus or scroll or text selection, and restart every CSS animation.",
        "So `hydrateRoot` does something else. It renders the tree in memory and, instead of creating DOM nodes, walks the existing ones **in lockstep**, and where the type at a position matches, it adopts that node and attaches this position's props and handlers to it.",
      ],
      visual: {
        id: "hydration-visual",
        kind: "react-server",
        algorithm: "hydration",
        title: "Adopting the server's DOM",
      },
    },
    {
      id: "proving-it",
      heading: "Proving it reuses the nodes",
      body: [
        "It is easy to say React \"attaches\" to the HTML and hard to picture. So hold onto the DOM node before hydrating and check whether it is the same object afterwards.",
      ],
      examples: [
        {
          id: "same-node",
          title: "Dead, then alive, same button",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>clicked {n} times</button>;
}

const html = renderToString(<Counter />);
console.log("server HTML:", html);

const container = document.createElement("div");
container.innerHTML = html;
document.body.appendChild(container);
const before = container.querySelector("button")!;

/* Before hydration the button is in the page and does nothing. */
before.click();
console.log("click before hydration:", before.textContent);

await act(async () => { hydrateRoot(container, <Counter />); });
console.log("same DOM node afterwards:", container.querySelector("button") === before);

await act(async () => { container.querySelector("button")!.click(); });
console.log("click after hydration: ", container.querySelector("button")!.textContent);`,
          output: `server HTML: <button>clicked <!-- -->0<!-- --> times</button>
click before hydration: clicked 0 times
same DOM node afterwards: true
click after hydration:  clicked 1 times`,
          explanation:
            "The third line is the whole lesson: `true`. Not a new button that looks the same — the same object. The click before hydration does nothing at all, because the handler does not exist yet, and the click afterwards works, on that identical node.",
        },
      ],
      pitfalls: [
        {
          title: "`createRoot` on server HTML would be a bug",
          body: "It would ignore the existing children, build the tree from nothing, and replace them — a flash, lost focus, restarted animations, and the server render wasted. If a page is server-rendered, its entry point is `hydrateRoot`. React 19 will warn if it sees you do otherwise.",
        },
      ],
    },
    {
      id: "the-constraint",
      heading: "The constraint this creates",
      body: [
        "Adopting a node requires knowing which node to adopt, and React decides that by **position and type**. It does not search, it does not match by id, and it does not try to be clever: it walks its own tree and the DOM together, and expects them to agree.",
        "Which means the client's **first** render has to produce the same tree the server did. Not similar — the same elements in the same order.",
        "Only the first. Once hydration is finished the trees can diverge as much as you like, and normally do, since an effect fires and state changes. This is why every fix in the next lesson has the same shape: render what the server rendered, then change it.",
      ],
      examples: [
        {
          id: "attribute-mismatch",
          title: "An attribute that differs, and what React does about it",
          lang: "tsx",
          code: `import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/* React's attribute warning is a console.error and it is long. Route it to
   stdout and keep the first two sentences, which are the ones that matter. */
console.error = (...args: unknown[]) =>
  console.log("React warns:", String(args[0]).split(". ").slice(0, 2).join(". ") + ".");

/* Same elements, same text — only the className differs. */
let onServer = true;
function Box() {
  return <div className={onServer ? "a" : "b"}><span>text</span></div>;
}

const html = renderToString(<Box />);
onServer = false;

const container = document.createElement("div");
container.innerHTML = html;
document.body.appendChild(container);
const before = container.querySelector("span")!;

let recoverable = 0;
await act(async () => {
  hydrateRoot(container, <Box />, { onRecoverableError() { recoverable++; } });
});
console.log("server:", html);
console.log("after: ", container.innerHTML);
console.log("same <span> node:", container.querySelector("span") === before,
  "| recoverable errors:", recoverable);`,
          output: `React warns: A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.
server: <div class="a"><span>text</span></div>
after:  <div class="a"><span>text</span></div>
same <span> node: true | recoverable errors: 0`,
          explanation:
            "Three surprises in three lines. The tree is **not** thrown away — the span is the same node and hydration succeeded. The attribute is **not** corrected: the page keeps `class=\"a\"`, the server's value, and React's own warning says so in as many words — *\"This won't be patched up\"*. And it is not a recoverable error, so `onRecoverableError` never fires; the only signal is a `console.error` in development, which is invisible in production.\n\nSo an attribute mismatch is quieter and more permanent than a structural one: your page runs, and one element is wearing the server's class until something re-renders it.",
        },
      ],
    },
    {
      id: "selective",
      heading: "Selective hydration",
      body: [
        "React 18 made hydration interruptible, in exactly the sense of module 11's first lesson — and once it is interruptible, two useful things follow.",
        "**It can be split up.** Each Suspense boundary hydrates independently, so a large page becomes many small hydration tasks with a yield between them, rather than one long block that freezes the tab.",
        "**It can be reprioritised by a click.** If the user clicks something inside a boundary that has not hydrated yet, React records the event, hydrates *that* boundary first, and then replays the event into the freshly attached handler. Interactivity arrives where the user is looking rather than in source order.",
        "Neither needs any code. What they need is Suspense boundaries — which means the boundaries you drew for loading states (module 11) are also the units of hydration, and a page with none of them hydrates as one indivisible lump.",
      ],
    },
    {
      id: "cost",
      heading: "What hydration costs",
      body: [
        "It is cheaper than rendering, since no DOM is created, and it is not free. Every component in the tree still runs, every hook still initialises, every event handler is still created and registered. On a large page it is the single most expensive thing that happens in the browser.",
        "That is the number behind the whole of the next few lessons: server rendering makes the page **appear** sooner and does nothing whatever for when it becomes **usable**, because the bundle still has to arrive and hydration still has to run. If anything, it makes that gap more noticeable, because the user now has something to try to interact with.",
        "Which is why the interesting question stopped being \"where do we render\" and became \"how much of this needs to hydrate at all\" — and that is lesson 6.",
      ],
      examples: [
        {
          id: "measuring",
          title: "Measuring your own gap",
          lang: "jsx",
          code: `/* Paste into the console on a server-rendered page. FCP is when the
   content appeared; the hydration mark is when it started working. The
   distance between them is the window where the page lied. */
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, Math.round(entry.startTime), "ms");
  }
}).observe({ type: "paint", buffered: true });

/* In the app, once, at the end of the entry module. */
hydrateRoot(document.getElementById("root"), <App />);
requestIdleCallback(() => performance.mark("hydrated"));`,
          explanation:
            "`first-contentful-paint` against your own `hydrated` mark is the number worth watching, and it is the one a Lighthouse score on a fast laptop will flatter. Total Blocking Time in a throttled run is the closest standard proxy.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is hydration?",
      answer:
        "Attaching React to HTML that already exists. `hydrateRoot` renders the tree in memory and, instead of creating DOM nodes, walks the server's DOM in lockstep — where the type at a position matches, it adopts that node and attaches this position's props and event handlers to it. The nodes are literally the same objects, which is why the paint is preserved along with focus, scroll and running animations.",
    },
    {
      question: "Why must the first client render match the server's output?",
      answer:
        "Because React decides which DOM node to adopt by position and type as it walks both trees together — it does not search or match by id. A different element at a position means it cannot adopt, and it falls back to re-rendering. Only the first render is constrained; once hydration is done the trees diverge freely, which is why every fix for a mismatch has the shape 'render what the server rendered, then change it'.",
    },
    {
      question: "What is selective hydration?",
      answer:
        "Hydration became interruptible in React 18, so each Suspense boundary hydrates as its own unit with yields in between rather than one long blocking task. It also lets a click reprioritise: React records an event on a not-yet-hydrated boundary, hydrates that boundary first, and replays the event into the new handler. It needs no code, only Suspense boundaries — a page with none hydrates as one lump.",
    },
    {
      question: "Does server rendering make a page interactive sooner?",
      answer:
        "No. It makes the page *appear* sooner. Interactivity still waits for the bundle to download, execute and hydrate, and hydration runs every component and initialises every hook — the most expensive thing that happens on a large page. Arguably it makes the delay more noticeable, because the user now has something visible to try to click.",
    },
  ],
  takeaways: [
    "`hydrateRoot` adopts existing DOM nodes rather than creating new ones — provably the same objects",
    "`createRoot` on server HTML throws the server render away and flashes",
    "Adoption is by position and type, so the first client render must match the server's",
    "Only the first render is constrained; afterwards the trees diverge freely",
    "Attribute differences are reconciled; a different element at a position is not",
    "Selective hydration splits the work per Suspense boundary and lets a click jump the queue",
    "Hydration runs every component and every hook — cheaper than rendering, far from free",
    "SSR moves the first paint earlier and does nothing for time-to-interactive",
  ],
  status: "available",
};
