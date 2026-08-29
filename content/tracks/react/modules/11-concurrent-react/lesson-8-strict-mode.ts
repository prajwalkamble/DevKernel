import type { Lesson } from "@/content/types";

export const strictModeLesson: Lesson = {
  id: "react-strict-mode",
  slug: "strict-mode",
  moduleSlug: "concurrent-react",
  title: "Strict Mode & Double Invocation",
  summary:
    "Why your effect runs twice in development, what exactly gets doubled, the two classes of bug it exists to find — one of them shown running — and why turning it off is the wrong response to being annoyed by it.",
  estimatedMinutes: 26,
  objectives: [
    "List what Strict Mode double-invokes and what it does not",
    "Say what impurity the doubled render is looking for",
    "Say what the remount is looking for",
    "Fix an effect that breaks under the doubling",
    "Explain why this is development-only and why it should stay on",
  ],
  sections: [
    {
      id: "the-complaint",
      heading: "The complaint",
      body: [
        "Every React developer meets this in their first week: an effect logs twice, a request goes out twice, a counter is 2 instead of 1 — and only in development. The internet's most popular answer is to delete `<StrictMode>` from `main.tsx`.",
        "It is worth understanding what that deletes, because Strict Mode does not create these bugs. It reveals them, and it reveals them at the only moment they are cheap to fix.",
      ],
      examples: [
        {
          id: "where-it-comes-from",
          title: "Where it comes from",
          lang: "tsx",
          code: `/* main.tsx, exactly as create-vite generates it. */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
          explanation:
            "It is on by default in every scaffolded app, it does nothing in a production build, and it applies to everything inside it — so wrapping only part of the tree while you work on it is a legitimate move.",
        },
      ],
    },
    {
      id: "what-doubles",
      heading: "What is doubled, precisely",
      body: [
        "**Component function bodies.** Every render runs twice.",
        "**`useState` and `useReducer` initialiser functions.** `useState(() => expensive())` calls `expensive` twice.",
        "**`useMemo` calculations** and **`useReducer` reducers**. All of these are things React expects to be pure.",
        "**Effects.** These are not doubled but *remounted*: setup, cleanup, setup — in that order, in one mount.",
        "And what is not: event handlers, `useEffect` cleanups on unmount, refs, and anything in a production build. It is all stripped from the production bundle, so the doubling costs your users nothing.",
      ],
      visual: {
        id: "strict-off-visual",
        kind: "react-concurrent",
        algorithm: "strict-off",
        title: "Mounting without Strict Mode",
      },
    },
    {
      id: "the-double-render",
      heading: "The doubled render, and what it looks for",
      body: [
        "Render is supposed to be a pure function of props and state — the same inputs give the same output and nothing else happens. That was always the rule; concurrent rendering made it a correctness requirement, because a render that never commits can still have run (lesson 1).",
        "Calling the function twice is a cheap test for it. If it is pure, the second call is invisible: same output, no observable difference. If it is not, you get a visible wrong answer *on every mount*, in development, instead of an occasional wrong answer in production.",
        "Watch the cart in this one.",
      ],
      visual: {
        id: "strict-on-visual",
        kind: "react-concurrent",
        algorithm: "strict-on",
        title: "The same mount, inside Strict Mode",
      },
      examples: [
        {
          id: "the-log",
          title: "The same component, in and out of Strict Mode",
          lang: "tsx",
          code: `import { StrictMode, useEffect, useState, act } from "react";
import { createRoot } from "react-dom/client";

const log: string[] = [];

function Chat() {
  const [id] = useState(() => { log.push("initialiser"); return 1; });
  log.push("render");
  useEffect(() => {
    log.push(\`connect(\${id})\`);
    return () => log.push(\`disconnect(\${id})\`);
  }, [id]);
  return <p>chat</p>;
}

const a = document.createElement("div");
document.body.appendChild(a);
log.push("--- without StrictMode ---");
await act(async () => { createRoot(a).render(<Chat />); });

const b = document.createElement("div");
document.body.appendChild(b);
log.push("--- with StrictMode ---");
await act(async () => { createRoot(b).render(<StrictMode><Chat /></StrictMode>); });

console.log(log.join("\\n"));`,
          output: `--- without StrictMode ---
initialiser
render
connect(1)
--- with StrictMode ---
initialiser
initialiser
render
render
connect(1)
disconnect(1)
connect(1)`,
          explanation:
            "Read the last three lines as one unit: **connect, disconnect, connect**. It is not the effect running twice. It is a full mount, unmount and mount, which is exactly what a route change or a Fast Refresh does — and the cleanup is being tested, not the effect.",
        },
      ],
      pitfalls: [
        {
          title: "The bugs this actually finds",
          body: "Mutating a prop or a module-level value during render. Pushing to an array declared outside the component. Reading and writing a `ref` in the render body. Generating an id with `Math.random()` and expecting it to be stable — which produces a hydration mismatch in production, three weeks later, in a way nobody can reproduce.",
        },
      ],
    },
    {
      id: "the-remount",
      heading: "The remount, and what it looks for",
      body: [
        "The effect half is testing one property: **is this effect resilient to being run twice?** Which is the same as asking whether its cleanup undoes what its setup did.",
        "That matters because a remount is not hypothetical. It happens on every route change, on every Fast Refresh, on every `key` change, and — deliberately — in an offscreen-content feature React has been building towards for years. An effect that leaks on a remount leaks in production; Strict Mode just makes it leak in front of you.",
        "So the fix is never to suppress the second run. It is to write the cleanup.",
      ],
      examples: [
        {
          id: "the-fixes",
          title: "The three shapes",
          lang: "jsx",
          code: `/* A subscription: the cleanup is the unsubscriber. */
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);

/* A fetch: the cleanup cannot un-send the request, so it invalidates the
   response instead. Module 7's ignore flag, and it happens to make the
   doubled run harmless as a side effect of being correct. */
useEffect(() => {
  let ignore = false;
  fetchUser(id).then((user) => { if (!ignore) setUser(user); });
  return () => { ignore = true; };
}, [id]);

/* A timer, an observer, an event listener — all the same shape. */
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

/* And the one that cannot be fixed this way, because it should never have
   been an effect: something that must happen once per user action rather
   than once per mount. */
useEffect(() => { analytics.track("checkout_started"); }, []);  // ✗
// Put it in the handler that started the checkout instead.`,
          explanation:
            "The first three are the same pattern: acquire, and return the release. The fourth is the case people reach for a `useRef` guard to fix, and the guard is a way of not noticing that the event being tracked is a click, not a mount.",
        },
      ],
      pitfalls: [
        {
          title: "The ref guard is a smell, not a fix",
          body: "`const done = useRef(false); if (!done.current) { … }` silences the second run and keeps the bug: it is still true that a remount will not re-acquire whatever the effect acquired. It also fails in the case it claims to fix, since a real remount gets a fresh ref. If an effect genuinely must not repeat, it usually should not be an effect.",
        },
        {
          title: "Two requests in the Network tab are usually not the problem",
          body: "In development, with an `ignore` flag, the duplicate is harmless and disappears in production. It is worth checking that it is idempotent — a doubled `POST /orders` is a real problem, and one an effect should not have been making anyway — but a doubled `GET` is noise.",
        },
      ],
    },
    {
      id: "keeping-it-on",
      heading: "Keeping it on",
      body: [
        "The argument for leaving it enabled is that every bug it surfaces is a bug you already have. The doubling does not introduce impurity or missing cleanups; it makes them deterministic instead of intermittent.",
        "It is also how React ships new behaviour. Every capability that involves rendering something more than once, or unmounting and restoring a subtree — offscreen rendering, restoring state after a back navigation — depends on components tolerating exactly what Strict Mode is testing for. Code that passes it today is code that will not need rewriting later.",
        "If it is genuinely in the way while you are debugging something else, wrap a smaller part of the tree rather than deleting it. And if an effect only works because it ran once, that is the finding, not the obstacle.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does my useEffect run twice?",
      answer:
        "Strict Mode in development mounts the component, immediately unmounts it, and mounts it again — so the sequence is setup, cleanup, setup, not the effect running twice. It is testing whether the cleanup undoes what the setup did, because a real remount happens on every route change, Fast Refresh and `key` change. The fix is to write the cleanup, never to suppress the second run, and none of it happens in production.",
    },
    {
      question: "What exactly does Strict Mode double-invoke?",
      answer:
        "Component function bodies, `useState` and `useReducer` initialisers, `useMemo` calculations, and reducers — everything React expects to be pure. Effects are not doubled but remounted: setup, cleanup, setup. Event handlers are untouched, and the whole mechanism is stripped from a production build.",
    },
    {
      question: "What kind of bug does the doubled render find?",
      answer:
        "Impurity. Mutating a prop or a module-level value during render, pushing to an array outside the component, writing to a ref in the render body, generating an id with `Math.random()` and expecting it to be stable. Concurrent rendering made purity a correctness requirement, because a render that is thrown away before commit can still have run — so calling the function twice is a cheap, deterministic test for the property React now depends on.",
    },
    {
      question: "Is it ever right to remove StrictMode?",
      answer:
        "Rarely, and not because effects run twice. Everything it surfaces is a pre-existing bug, and React's own direction — offscreen rendering, restoring state after a back navigation — depends on components tolerating exactly what it tests. If it is genuinely obstructing a debugging session, wrap a smaller part of the tree; if an effect only works because it ran once, that is the finding rather than the obstacle.",
    },
  ],
  takeaways: [
    "Strict Mode is development-only and stripped from production builds",
    "Renders, initialisers, memo calculations and reducers are called twice",
    "Effects are not doubled — they are remounted: setup, cleanup, setup",
    "The doubled render tests purity; the remount tests the cleanup",
    "A remount really happens on route changes, Fast Refresh and key changes",
    "The fix is always the cleanup, never a ref guard that suppresses the second run",
    "Something that must happen once per action belongs in the handler, not in an effect",
    "Code that survives Strict Mode is code that survives React's future rendering features",
  ],
  status: "available",
};
