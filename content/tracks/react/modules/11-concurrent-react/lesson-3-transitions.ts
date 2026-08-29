import type { Lesson } from "@/content/types";

export const transitionsLesson: Lesson = {
  id: "react-transitions",
  slug: "transitions",
  moduleSlug: "concurrent-react",
  title: "Transitions: Telling React What Can Wait",
  summary:
    "startTransition and useTransition — marking an update as non-urgent so the cheap part of a click commits without waiting for the expensive part. The two forms, what isPending is for, and the mistake that silently un-marks the update.",
  estimatedMinutes: 30,
  objectives: [
    "Mark an update as a transition and explain what that changes",
    "Choose between useTransition and the imported startTransition",
    "Use isPending without replacing the screen",
    "Say why the update must be made synchronously inside the callback",
    "Recognise the cases where a transition buys nothing",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "One click, two updates, one of them expensive",
      body: [
        "A tab bar. Clicking a tab does two things: highlights the tab, and renders that tab's contents. The highlight is a class change. The contents might be a thousand-row table.",
        "Both are set in the same handler, so both are urgent, so they render together and commit together — and the highlight, which was ready almost immediately, sits waiting for the table. The user clicks and, for as long as the table takes, nothing at all happens. Not even the highlight.",
        "That is the situation transitions exist for, and it is worth seeing the two schedules side by side.",
      ],
      visual: {
        id: "transition-off-visual",
        kind: "react-concurrent",
        algorithm: "transition-off",
        title: "Both updates urgent",
      },
    },
    {
      id: "the-fix",
      heading: "Marking one of them",
      body: [
        "`startTransition(() => setTab(next))` says: this update is not what the user is waiting on. React renders it at a lower priority, may interrupt it, and — crucially — commits the urgent updates from the same handler without it.",
        "One click becomes two commits. The first is the tab highlight, on screen immediately. The second is the table, whenever it is done.",
      ],
      visual: {
        id: "transition-on-visual",
        kind: "react-concurrent",
        algorithm: "transition-on",
        title: "The list update marked as a transition",
      },
      examples: [
        {
          id: "two-renders",
          title: "What the component sees",
          lang: "jsx",
          code: `import { useState, useTransition, act } from "react";
import { createRoot } from "react-dom/client";

const log = [];

function App() {
  const [tab, setTab] = useState("home");
  const [pending, startTransition] = useTransition();
  log.push(\`render: tab=\${tab} pending=\${pending}\`);
  return (
    <div>
      <span>{tab}</span>
      <button onClick={() => startTransition(() => setTab("posts"))}>posts</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
log.push("--- click ---");
await act(async () => { container.querySelector("button").click(); });
console.log(log.join("\\n"));`,
          output: `render: tab=home pending=false
--- click ---
render: tab=home pending=true
render: tab=posts pending=false`,
          explanation:
            "Two renders from one click, and look at the middle one: `tab` is still `home` while `pending` is already true. That is the urgent commit — the screen has not changed yet, but React has told you it is working on it, and that is the frame in which you show a pending indicator.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useTransition, act } from "react";
import { createRoot } from "react-dom/client";

const log: string[] = [];

function App() {
  const [tab, setTab] = useState("home");
  const [pending, startTransition] = useTransition();
  log.push(\`render: tab=\${tab} pending=\${pending}\`);
  return (
    <div>
      <span>{tab}</span>
      <button onClick={() => startTransition(() => setTab("posts"))}>posts</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
log.push("--- click ---");
await act(async () => { container.querySelector("button")!.click(); });
console.log(log.join("\\n"));`,
            },
          ],
        },
      ],
    },
    {
      id: "two-forms",
      heading: "The two forms",
      body: [
        "**`useTransition()`** returns `[isPending, startTransition]`. Use it when the component wants to show that something is in flight.",
        "**`startTransition` imported from `react`** does the same scheduling with no `isPending`. Use it outside a component — in a store's action, a router, an event handler defined at module scope — where there is no place for a hook.",
        "They are not interchangeable in one respect, and it is worth seeing rather than remembering.",
      ],
      examples: [
        {
          id: "hook-vs-import",
          title: "The same transition, both ways",
          lang: "jsx",
          code: `import { useState, useTransition, startTransition as globalStartTransition, act } from "react";
import { createRoot } from "react-dom/client";

const log = [];
let viaHook;
let viaImport;

function Tabs() {
  const [tab, setTab] = useState("home");
  const [pending, startTransition] = useTransition();
  viaHook = () => startTransition(() => setTab(tab === "home" ? "posts" : "home"));
  viaImport = () => globalStartTransition(() => setTab(tab === "home" ? "posts" : "home"));
  log.push(\`render tab=\${tab} isPending=\${pending}\`);
  return <p>{tab}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Tabs />); });

log.push("--- the startTransition from useTransition ---");
await act(async () => { viaHook(); });

log.push("--- the startTransition imported from react ---");
await act(async () => { viaImport(); });

console.log(log.join("\\n"));`,
          output: `render tab=home isPending=false
--- the startTransition from useTransition ---
render tab=home isPending=true
render tab=posts isPending=false
--- the startTransition imported from react ---
render tab=home isPending=false`,
          explanation:
            "The hook's version produces the extra pending render. The imported one schedules the same low-priority update and produces one render, because there is no `isPending` state for it to set. Same scheduling, different bookkeeping — so if a transition seems not to be working because nothing shows as pending, check which one you imported.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useTransition, startTransition as globalStartTransition, act } from "react";
import { createRoot } from "react-dom/client";

const log: string[] = [];
let viaHook: () => void;
let viaImport: () => void;

function Tabs() {
  const [tab, setTab] = useState("home");
  const [pending, startTransition] = useTransition();
  viaHook = () => startTransition(() => setTab(tab === "home" ? "posts" : "home"));
  viaImport = () => globalStartTransition(() => setTab(tab === "home" ? "posts" : "home"));
  log.push(\`render tab=\${tab} isPending=\${pending}\`);
  return <p>{tab}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Tabs />); });

log.push("--- the startTransition from useTransition ---");
await act(async () => { viaHook(); });

log.push("--- the startTransition imported from react ---");
await act(async () => { viaImport(); });

console.log(log.join("\\n"));`,
            },
          ],
        },
      ],
    },
    {
      id: "ispending",
      heading: "Using isPending well",
      body: [
        "`isPending` is true from the moment the transition is scheduled until its render commits. The temptation is to render a spinner from it. Do not: replacing the content with a spinner throws away the entire benefit, which was that the old content stayed on screen.",
        "What works is an indicator that leaves the content in place — dimming the panel with an opacity, a thin bar at the top of the region, disabling the control that started it, `aria-busy` on the container. The rule of thumb: if `isPending` changes what is rendered rather than how it looks, you have probably undone the transition.",
      ],
      examples: [
        {
          id: "pending-styling",
          title: "The shape that works",
          lang: "jsx",
          code: `function Tabs() {
  const [tab, setTab] = useState<Tab>("home");
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <nav>
        {TABS.map((t) => (
          <button
            key={t}
            /* The highlight is urgent and lands on the first commit, so this
               is already correct while the panel is still catching up. */
            aria-current={t === tab}
            onClick={() => startTransition(() => setTab(t))}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Still the old panel, just visibly stale. Not a spinner. */}
      <div aria-busy={isPending} style={{ opacity: isPending ? 0.6 : 1 }}>
        <Panel tab={tab} />
      </div>
    </>
  );
}`,
          explanation:
            "The nav updates on the first commit and the panel on the second. Between them the panel is dimmed and marked `aria-busy`, which is honest — the content is real, it is simply out of date — and it is a much smaller visual change than a spinner replacing a screenful of text.",
        },
      ],
    },
    {
      id: "the-rules",
      heading: "The rule that catches everyone",
      body: [
        "**The state update has to happen synchronously inside the callback.** React marks whatever updates are scheduled during the synchronous run of that function; anything scheduled later — after an `await`, in a `.then`, in a `setTimeout` — is a separate, urgent update that React has no way to associate with the transition.",
        "What makes this hard to catch is that `isPending` lies about it. React 19 keeps a transition *pending* for as long as an async callback is running, because that is how Actions report progress — so the flag goes true, stays true, and tells you nothing about whether the update was actually marked. The test that does not lie is a suspending update: a real transition keeps the old screen, and an unmarked one shows the fallback.",
        "So this does not work:",
      ],
      examples: [
        {
          id: "async-trap",
          title: "The version that quietly does nothing",
          lang: "jsx",
          code: `/* Wrong: the only thing inside the callback is a promise being created. */
startTransition(() => {
  fetch(url).then((r) => r.json()).then(setResults);
});

/* Wrong for the same reason, and easier to talk yourself into. */
startTransition(async () => {
  const results = await search(query);
  setResults(results);   // ← a new task; nothing marked it
});

/* Right: do the awaiting outside, and mark the update itself. */
const results = await search(query);
startTransition(() => setResults(results));`,
          explanation:
            "The test is simple: by the time `startTransition`'s callback returns, has the state been set? If not, nothing was marked. This is also why a transition is not a way to make a fetch non-blocking — a fetch was never blocking rendering in the first place.",
        },
        {
          id: "ispending-is-not-proof",
          title: "The same flag, two different schedules",
          lang: "jsx",
          code: `import { Suspense, use, useState, useTransition, act } from "react";
import { createRoot } from "react-dom/client";

const cache = new Map();
function load(id) {
  if (!cache.has(id)) {
    let resolve;
    cache.set(id, { promise: new Promise((r) => { resolve = r; }), resolve });
  }
  return cache.get(id);
}

function Page({ id }) {
  return <b>{use(load(id).promise)}</b>;
}

let goSync;
let goAsync;

function App() {
  const [id, setId] = useState("a");
  const [pending, startTransition] = useTransition();
  goSync = () => startTransition(() => setId("b"));
  goAsync = () => startTransition(async () => {
    await Promise.resolve();
    setId("c");
  });
  return (
    <Suspense fallback={<i>fallback</i>}>
      <span data-pending={pending} />
      <Page id={id} />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const show = (label) => console.log(\`\${label} \${container.innerHTML}\`);

await act(async () => { createRoot(container).render(<App />); });
await act(async () => { load("a").resolve("page A"); });
show("mounted:                     ");

await act(async () => { goSync(); });
show("set inside the callback:     ");
await act(async () => { load("b").resolve("page B"); });

await act(async () => { goAsync(); await new Promise((r) => setTimeout(r, 10)); });
show("set after an await:          ");`,
          output: `mounted:                      <span data-pending="false"></span><b>page A</b>
set inside the callback:      <span data-pending="true"></span><b>page A</b>
set after an await:           <span data-pending="true" style="display: none;"></span><b style="display: none;">page B</b><i>fallback</i>`,
          explanation:
            "`data-pending` is `true` on both of the last two lines. Only the middle one is a transition: page A is still on screen while page B renders. In the last line React has hidden the old content and put the fallback up, which is precisely the behaviour a transition prevents — so the update made after the `await` was an ordinary urgent one, whatever the flag said.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Suspense, use, useState, useTransition, act } from "react";
import { createRoot } from "react-dom/client";

const cache = new Map<string, { promise: Promise<string>; resolve: (v: string) => void }>();
function load(id: string) {
  if (!cache.has(id)) {
    let resolve!: (v: string) => void;
    cache.set(id, { promise: new Promise<string>((r) => { resolve = r; }), resolve });
  }
  return cache.get(id)!;
}

function Page({ id }: { id: string }) {
  return <b>{use(load(id).promise)}</b>;
}

let goSync: () => void;
let goAsync: () => void;

function App() {
  const [id, setId] = useState("a");
  const [pending, startTransition] = useTransition();
  goSync = () => startTransition(() => setId("b"));
  goAsync = () => startTransition(async () => {
    await Promise.resolve();
    setId("c");
  });
  return (
    <Suspense fallback={<i>fallback</i>}>
      <span data-pending={pending} />
      <Page id={id} />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const show = (label: string) => console.log(\`\${label} \${container.innerHTML}\`);

await act(async () => { createRoot(container).render(<App />); });
await act(async () => { load("a").resolve("page A"); });
show("mounted:                     ");

await act(async () => { goSync(); });
show("set inside the callback:     ");
await act(async () => { load("b").resolve("page B"); });

await act(async () => { goAsync(); await new Promise((r) => setTimeout(r, 10)); });
show("set after an await:          ");`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Transitions do not delay anything",
          body: "There is no timer and no debounce. React starts the transition render immediately; it is simply willing to interrupt it. On a machine fast enough that nothing interrupts, both commits happen in the same frame and the user sees one update — which is the correct outcome, and the reason a transition costs nothing when it is not needed.",
        },
        {
          title: "A transition around a cheap update buys nothing",
          body: "If the expensive part is not actually a React render — a slow network call, a heavy image decode, a canvas repaint — there is no long render to interrupt, and the transition changes nothing except adding an `isPending` you now have to style. Measure with the Profiler first, which is module 9.",
        },
        {
          title: "Controlled inputs must not be in a transition",
          body: "Marking `setValue` from an input's `onChange` as a transition means React may not commit the keystroke immediately, and the user sees characters lag or arrive out of order. The input's own state is always urgent; it is the *expensive consumer* of that state that gets deferred — which is what `useDeferredValue`, next, is for.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does startTransition do?",
      answer:
        "It marks the state updates made inside its callback as non-urgent. React then renders them at a lower priority, is willing to interrupt and restart that render, and commits any urgent updates from the same handler without waiting for it. The visible effect is that one click produces two commits — the cheap update immediately, the expensive one when it is ready — instead of one commit after everything is done.",
    },
    {
      question: "What is the difference between useTransition and the startTransition imported from react?",
      answer:
        "The scheduling is identical; only the bookkeeping differs. `useTransition` also gives you `isPending`, which costs an extra render at the start of the transition, and being a hook it can only be called in a component. The imported `startTransition` has no pending flag and can be called anywhere — a store action, a router, module scope. If a transition appears not to work because nothing shows as pending, that is usually which one was imported.",
    },
    {
      question: "Why does startTransition sometimes appear to do nothing?",
      answer:
        "Almost always because the state update did not happen synchronously inside the callback. React marks whatever is scheduled during that function's synchronous run; anything after an `await`, in a `.then`, or in a timeout is a separate urgent update. `isPending` is no help here — React keeps it true for the whole of an async callback — so the reliable check is a suspending update, where a real transition keeps the old screen and an unmarked one shows the fallback. The fix is to await outside and put only the `setState` inside.",
    },
    {
      question: "How should isPending be rendered?",
      answer:
        "As a change to how the existing content looks, not to what content there is. Dim the region, show a thin progress bar, disable the control, set `aria-busy`. Swapping in a spinner replaces the old content, which is precisely what the transition was keeping on screen — so the spinner undoes the feature you turned on.",
    },
  ],
  takeaways: [
    "A transition marks an update as not-what-the-user-is-waiting-for",
    "One click becomes two commits: the urgent part now, the expensive part when ready",
    "`useTransition` adds `isPending` and costs one extra render; the imported `startTransition` does not",
    "The `setState` must run synchronously inside the callback or nothing is marked",
    "`isPending` stays true across an async callback even when nothing was marked — it is not proof",
    "`isPending` should change how the content looks, never replace it",
    "Nothing is delayed — React starts immediately and is merely willing to be interrupted",
    "Never put a controlled input's own `setState` in a transition",
    "A transition around a cheap render, or around a slow network call, buys nothing",
  ],
  status: "available",
};
