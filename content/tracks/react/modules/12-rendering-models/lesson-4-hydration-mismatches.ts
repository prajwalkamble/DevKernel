import type { Lesson } from "@/content/types";

export const hydrationMismatchesLesson: Lesson = {
  id: "react-hydration-mismatches",
  slug: "hydration-mismatches",
  moduleSlug: "client-and-server-rendering",
  title: "Hydration Mismatches",
  summary:
    "The error every server-rendered app hits, what React actually does about it — proven, and it is worse than a warning — the five things that cause it, and the two fixes that are not suppressToken.",
  estimatedMinutes: 30,
  objectives: [
    "Read a hydration mismatch error and find the cause from it",
    "Show what React does to the tree when one happens",
    "Name the five common causes",
    "Apply the two-pass fix and know what it costs",
    "Say what suppressHydrationWarning does and does not do",
  ],
  sections: [
    {
      id: "what-happens",
      heading: "What React does about one",
      body: [
        "The reasonable guess is that React patches up the difference — it found the wrong text, it writes the right text, everybody moves on. That is not what happens, and the gap between the guess and the reality is why mismatches are worth a lesson of their own.",
        "React **abandons the server's HTML for that root and re-renders the whole tree on the client**. Every node is thrown away and rebuilt.",
      ],
      examples: [
        {
          id: "the-mismatch",
          title: "A mismatch, and its cost",
          lang: "jsx",
          code: `import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/* The classic: a value that legitimately differs between the two machines. */
let onServer = true;
function Greeting() {
  return <p>{onServer ? "Good evening" : "Good morning"}</p>;
}

const html = renderToString(<Greeting />);
onServer = false;

const container = document.createElement("div");
container.innerHTML = html;
document.body.appendChild(container);
const before = container.querySelector("p");

await act(async () => {
  hydrateRoot(container, <Greeting />, {
    /* The message is long; the first sentence is the identification. */
    onRecoverableError(error) {
      console.log("recoverable:", (error).message.split(". ")[0] + ".");
    },
  });
});
console.log("server said:     ", html);
console.log("after hydration: ", container.innerHTML);
console.log("same <p> node:   ", container.querySelector("p") === before);`,
          output: `recoverable: Hydration failed because the server rendered text didn't match the client.
server said:      <p>Good evening</p>
after hydration:  <p>Good morning</p>
same <p> node:    false`,
          explanation:
            "`false`. The `<p>` the server sent is gone and a new one is in its place — and this is a one-element page. On a real page it is every element under that root: the server render wasted, a full client render paid for, the paint the user was already looking at replaced, and any focus, scroll position or text selection inside it destroyed.",
          alternates: [
            {
              lang: "tsx",
              code: `import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/* The classic: a value that legitimately differs between the two machines. */
let onServer = true;
function Greeting() {
  return <p>{onServer ? "Good evening" : "Good morning"}</p>;
}

const html = renderToString(<Greeting />);
onServer = false;

const container = document.createElement("div");
container.innerHTML = html;
document.body.appendChild(container);
const before = container.querySelector("p")!;

await act(async () => {
  hydrateRoot(container, <Greeting />, {
    /* The message is long; the first sentence is the identification. */
    onRecoverableError(error) {
      console.log("recoverable:", (error as Error).message.split(". ")[0] + ".");
    },
  });
});
console.log("server said:     ", html);
console.log("after hydration: ", container.innerHTML);
console.log("same <p> node:   ", container.querySelector("p") === before);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "It is a recoverable error, which is a polite way of saying nothing breaks",
          body: "The page works afterwards. That is exactly why mismatches survive in production for months: in development they are a red console message that people learn to scroll past, and in production they are invisible unless you have wired up `onRecoverableError`. Wire it up — it is one option on `hydrateRoot`, and it turns an invisible cost into a number.",
        },
      ],
    },
    {
      id: "reading-it",
      heading: "Reading the error",
      body: [
        "React 19's message is genuinely good, and most people stop reading it at the first line. It ends with a diff showing the component, the element, and the two values marked `+` for what the client rendered and `-` for what the server sent.",
        "That diff is the answer nine times out of ten. The component name tells you where, and the two values tell you what differed — and the *shape* of the difference usually tells you which of the five causes it is.",
      ],
      examples: [
        {
          id: "the-message",
          title: "The whole message, from the example above",
          lang: "bash",
          code: `Hydration failed because the server rendered text didn't match the client.
As a result this tree will be regenerated on the client. This can happen if a
SSR-ed Client Component used:

- A server/client branch \`if (typeof window !== 'undefined')\`.
- Variable input such as \`Date.now()\` or \`Math.random()\` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes
with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  <Greeting>
    <p>
+     Good morning
-     Good evening`,
          explanation:
            "React lists its own five causes, and they are the right five. The last paragraph is not filler either: an extension that injects markup into the page before React loads produces a mismatch in code you did not write, which is why a bug report of this shape should always ask whether it reproduces in a private window.",
        },
      ],
    },
    {
      id: "the-causes",
      heading: "The five causes",
      body: [
        "**1. Branching on the environment.** `typeof window !== \"undefined\"` inside a render, directly or through a helper. The server takes one branch and the client takes the other; that is the whole bug, and it is the most common one because it looks like the fix for something else.",
        "**2. Time and randomness.** `Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()`. Two machines, two answers. A relative timestamp — *3 minutes ago* — mismatches for a page that took four seconds to reach the browser.",
        "**3. Locale and timezone.** `toLocaleDateString()` uses the *server's* locale and timezone on the server. A date rendered in London and hydrated in Mumbai is a different string, and sometimes a different day.",
        "**4. Browser-only storage.** `localStorage`, `sessionStorage`, cookies read through `document.cookie`, `matchMedia`. The server has none of them, so it renders the default and the client renders the stored value. Theme switchers are the canonical case, which is why every one of them has a flash-of-wrong-theme story.",
        "**5. Invalid nesting.** This one is different from the others, because your React tree is fine. `<p><div/></p>` is invalid HTML, so the browser's parser *silently restructures the server's markup* before React sees it — and React then compares its tree against a DOM that no longer matches it. The tell is a mismatch you cannot explain from the component code.",
      ],
      visual: {
        id: "hydration-mismatch-visual",
        kind: "react-server",
        algorithm: "hydration-mismatch",
        title: "One node differs, the whole tree goes",
      },
      pitfalls: [
        {
          title: "The nesting one has a fixed list",
          body: "`<p>` may not contain a block element. `<a>` may not contain another `<a>`. `<button>` may not contain a `<button>`. `<table>` may not contain a bare `<div>`, and text directly inside `<tbody>` is moved out. `<form>` may not contain a `<form>`. If a mismatch makes no sense, run the server's HTML through a validator before reading the component again.",
        },
      ],
    },
    {
      id: "the-fix",
      heading: "The fix, which is always the same shape",
      body: [
        "Only the **first** client render is constrained. So: render what the server rendered, then change it.",
        "That means the difference has to happen in an effect — after hydration — rather than during the render that hydration compares.",
      ],
      examples: [
        {
          id: "two-pass",
          title: "Two ways to say 'after mount'",
          lang: "jsx",
          code: `import { useState, useEffect, useSyncExternalStore, act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/* The two-pass pattern: render the server's answer, then correct after mount. */
function TwoPass() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <p>{mounted ? "browser" : "server"}</p>;
}

/* The same thing declared once, with the server's answer as an argument
   rather than as a state machine. Module 10's hook, doing its actual job. */
const subscribe = () => () => {};
function ViaStore() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return <p>{isClient ? "browser" : "server"}</p>;
}

async function run(label, tree) {
  const html = renderToString(tree);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  let warned = false;
  await act(async () => {
    hydrateRoot(container, tree, { onRecoverableError() { warned = true; } });
  });
  console.log(\`\${label} server=\${html} after hydration=\${container.innerHTML} warned=\${warned}\`);
}

await run("two-pass:  ", <TwoPass />);
await run("via store: ", <ViaStore />);`,
          output: `two-pass:   server=<p>server</p> after hydration=<p>browser</p> warned=false
via store:  server=<p>server</p> after hydration=<p>browser</p> warned=false`,
          explanation:
            "Both hydrate cleanly and both end up showing the browser's value. The cost is the same in each case and it is real: the first paint shows the server's answer, so the user sees the placeholder before the real thing. That is the trade, and it is why the good version of a theme switcher renders the theme from a cookie the server can read, rather than from `localStorage` that it cannot.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, useSyncExternalStore, act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/* The two-pass pattern: render the server's answer, then correct after mount. */
function TwoPass() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <p>{mounted ? "browser" : "server"}</p>;
}

/* The same thing declared once, with the server's answer as an argument
   rather than as a state machine. Module 10's hook, doing its actual job. */
const subscribe = () => () => {};
function ViaStore() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return <p>{isClient ? "browser" : "server"}</p>;
}

async function run(label: string, tree: React.ReactElement) {
  const html = renderToString(tree);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  let warned = false;
  await act(async () => {
    hydrateRoot(container, tree, { onRecoverableError() { warned = true; } });
  });
  console.log(\`\${label} server=\${html} after hydration=\${container.innerHTML} warned=\${warned}\`);
}

await run("two-pass:  ", <TwoPass />);
await run("via store: ", <ViaStore />);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`typeof window` inside a render is never the fix",
          body: "It is cause number one wearing a solution's clothes. The server render and the first client render take different branches by construction, which is precisely the thing that must not happen. If it appears to work, it is because something else re-rendered before you looked.",
        },
      ],
    },
    {
      id: "suppress",
      heading: "suppressHydrationWarning, and what it actually does",
      body: [
        "There is an escape hatch, and almost everybody who reaches for it is surprised by what it does.",
        "`suppressHydrationWarning` on an element tells React not to warn about a difference in that element's own text. It is one level deep, it does not apply to children, and — this is the surprising part — **it does not fix the value**.",
      ],
      examples: [
        {
          id: "suppressed",
          title: "Suppressed, and what is on screen afterwards",
          lang: "jsx",
          code: `import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

let onServer = true;
const now = () => (onServer ? "12:00:00" : "12:00:07");

function Clock({ suppress }) {
  return <time suppressHydrationWarning={suppress}>{now()}</time>;
}

async function run(label, suppress) {
  onServer = true;
  const html = renderToString(<Clock suppress={suppress} />);
  onServer = false;
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  let warned = false;
  await act(async () => {
    hydrateRoot(container, <Clock suppress={suppress} />, {
      onRecoverableError() { warned = true; },
    });
  });
  console.log(\`\${label} warned=\${warned}  server=\${html}  after=\${container.innerHTML}\`);
}

await run("plain:      ", false);
await run("suppressed: ", true);`,
          output: `plain:       warned=true  server=<time>12:00:00</time>  after=<time>12:00:07</time>
suppressed:  warned=false  server=<time>12:00:00</time>  after=<time>12:00:00</time>`,
          explanation:
            "Read the two `after` values. Without suppression React regenerates the tree and the screen ends up with the *client's* time — the right answer, expensively. With suppression the warning goes away and the screen keeps the **server's** time, which is the stale one, and it will stay stale until something re-renders that element.\n\nSo suppressing is not \"ignore this difference\", it is \"keep the server's version\". Legitimate for a timestamp you are about to update in an effect anyway. Wrong for anything you needed to be correct.",
          alternates: [
            {
              lang: "tsx",
              code: `import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

let onServer = true;
const now = () => (onServer ? "12:00:00" : "12:00:07");

function Clock({ suppress }: { suppress: boolean }) {
  return <time suppressHydrationWarning={suppress}>{now()}</time>;
}

async function run(label: string, suppress: boolean) {
  onServer = true;
  const html = renderToString(<Clock suppress={suppress} />);
  onServer = false;
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  let warned = false;
  await act(async () => {
    hydrateRoot(container, <Clock suppress={suppress} />, {
      onRecoverableError() { warned = true; },
    });
  });
  console.log(\`\${label} warned=\${warned}  server=\${html}  after=\${container.innerHTML}\`);
}

await run("plain:      ", false);
await run("suppressed: ", true);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "It covers that one element and nothing below it",
          body: "It does not suppress a structural mismatch, and it does not apply to descendants. If you find yourself sprinkling it down a subtree, the mismatch is structural and this is not the tool.",
        },
      ],
    },
    {
      id: "finding-them",
      heading: "Finding them before your users do",
      body: [
        "**Wire up `onRecoverableError`** in production and send it to whatever you use for errors. Mismatches are silent in production by design; this is the only way they are ever a number rather than an anecdote.",
        "**Test hydration, not just rendering.** A test that calls `render()` from Testing Library never hydrates, so it cannot see any of this. A test that renders to a string, puts it in a container and calls `hydrateRoot` with a spy on `onRecoverableError` catches every mismatch in that tree — which is what every example in this lesson is.",
        "**Suspect the environment first.** Ask whether it reproduces in a private window with extensions off before reading a single line of the component.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens when hydration fails?",
      answer:
        "React does not patch the difference. It abandons the server's HTML for that root and re-renders the whole tree on the client — every node thrown away and rebuilt. So you pay for the server render, pay again for a full client render, replace the paint the user was already looking at, and lose any focus, scroll or selection inside it. The page still works afterwards, which is why the cost stays invisible.",
    },
    {
      question: "What causes hydration mismatches?",
      answer:
        "Five things. Branching on `typeof window` during render; time and randomness such as `Date.now()` or `Math.random()`; locale and timezone formatting, where the server uses its own; browser-only storage like `localStorage`, cookies or `matchMedia`, which the server cannot read; and invalid HTML nesting, where the parser silently restructures the server's markup before React ever compares it. A browser extension injecting markup causes the same thing in code you did not write.",
    },
    {
      question: "How do you fix one?",
      answer:
        "Only the first client render is constrained, so render what the server rendered and change it afterwards — in an effect, or with `useSyncExternalStore`'s `getServerSnapshot`, which says the same thing declaratively. The cost is a visible placeholder on the first paint, which is why a value the server *can* know — a theme in a cookie rather than in `localStorage` — is a better fix than either.",
    },
    {
      question: "What does suppressHydrationWarning do?",
      answer:
        "It silences the warning for a difference in one element's own text — not its children, and not a structural mismatch. What surprises people is that it does not correct the value: React keeps the server's version on screen. So it is right for a timestamp an effect is about to overwrite anyway, and wrong for anything that needed to be correct, because the page will sit there showing the server's answer.",
    },
  ],
  takeaways: [
    "A mismatch discards the server's HTML for the whole root and re-renders on the client",
    "The node identity changes, so focus, scroll and selection inside it are lost",
    "It is a recoverable error — silent in production unless you wire up `onRecoverableError`",
    "The error's `+`/`-` diff names the component and both values; read to the end of it",
    "Five causes: environment branches, time and randomness, locale, browser storage, invalid nesting",
    "Invalid nesting mismatches come from the HTML parser, not from your tree",
    "The fix is always: render the server's answer, then change it after mount",
    "`suppressHydrationWarning` keeps the server's value — it hides the warning, not the difference",
    "Hydration bugs need a hydration test; `render()` from Testing Library cannot see them",
  ],
  status: "available",
};
