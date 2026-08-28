import type { Lesson } from "@/content/types";

export const cleanupAndStrictModeLesson: Lesson = {
  id: "react-cleanup-strict-mode",
  slug: "cleanup-and-strict-mode",
  moduleSlug: "core-hooks",
  title: "Cleanup, and Why Effects Run Twice",
  summary:
    "The function an effect returns is how it undoes itself, and it runs far more often than \"on unmount\". Strict Mode's deliberate mount–unmount–remount is a test of exactly that, and the correct response is never to switch it off.",
  estimatedMinutes: 30,
  objectives: [
    "Say when a cleanup function runs, in all three cases",
    "Write cleanup for a subscription, a timer and a fetch",
    "Explain what Strict Mode's double mount is checking",
    "Diagnose a doubled side effect as a missing cleanup",
    "Say why an empty dependency array does not mean \"runs once\"",
  ],
  sections: [
    {
      id: "when-cleanup-runs",
      heading: "When cleanup runs",
      body: [
        "An effect may return a function. React calls it in three situations, and the middle one is the one people forget.",
        "**Before the effect runs again.** Whenever a dependency changes, React first cleans up the previous run, then sets up the new one. So an effect with `[roomId]` disconnects from the old room before connecting to the new one, with no code in the component doing that by hand.",
        "**When the component unmounts.** The last cleanup.",
        "**In Strict Mode, immediately after the first run**, in development, as a test. The next section.",
        "Reading it as \"cleanup runs on unmount\" is what produces effects that subscribe on every dependency change and unsubscribe once — the class of leak that `componentDidUpdate` used to cause, reappearing in a hook.",
      ],
    },
    {
      id: "strict-mode",
      heading: "The double mount",
      visual: {
        id: "strict-double-mount-visual",
        kind: "react-concurrent",
        algorithm: "strict-on",
        title: "The double mount, and what it is checking",
      },
      body: [
        "In development, inside `<StrictMode>`, React mounts each component, runs its effects, **immediately runs their cleanups, and runs the effects again**. It also calls the component function twice per render.",
        "This is not a bug and it does not happen in production. It is a test of one property: that setting an effect up, tearing it down and setting it up again leaves you where you started.",
        "That property matters because React reserves the right to do exactly this. A component may be unmounted and remounted — by a `key` change, by Suspense, by future features that reuse state across mounts. An effect that only works the first time is broken; Strict Mode makes it break immediately and visibly rather than in a way you meet six months later.",
      ],
      examples: [
        {
          id: "double-mount",
          title: "The same component, with and without Strict Mode",
          lang: "tsx",
          code: `import { StrictMode, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Probe({ label }) {
  console.log("  render", label);
  useEffect(() => {
    console.log("  effect", label);
    return () => console.log("  cleanup", label);
  }, []);
  return <p>{label}</p>;
}

const plain = document.createElement("div");
document.body.appendChild(plain);
console.log("without StrictMode:");
act(() => { createRoot(plain).render(<Probe label="A" />); });

const strict = document.createElement("div");
document.body.appendChild(strict);
console.log("inside StrictMode:");
act(() => { createRoot(strict).render(<StrictMode><Probe label="B" /></StrictMode>); });`,
          output: `without StrictMode:
  render A
  effect A
inside StrictMode:
  render B
  render B
  effect B
  cleanup B
  effect B`,
          explanation:
            "`render B` twice is the purity check from module 2. The `effect → cleanup → effect` sequence is the new part: React set the effect up, tore it down, and set it up again, all before anything else happened. An effect whose cleanup is complete ends in exactly the state it would have reached without the extra cycle. An effect with no cleanup ends up having done its work twice.",
        },
      ],
      pitfalls: [
        {
          title: "\"My API is called twice in development\" is the test working",
          body: "The instinct is to add a ref guard so the fetch only happens once, or to remove `<StrictMode>`. Both hide the finding rather than fixing it. A fetch that fires twice is a fetch with no cleanup — and the same missing cleanup causes a real race in production when a prop changes fast enough for two requests to be in flight, with the slower one landing last. Cancel it with an `AbortController`, or ignore the stale response, and the double call in development becomes harmless.",
        },
      ],
    },
    {
      id: "writing-cleanup",
      heading: "What cleanup looks like for the usual cases",
      body: [
        "**A subscription:** the effect calls `subscribe`, the cleanup calls `unsubscribe`. Symmetric, and the easiest kind to get right because the API names the pair for you.",
        "**A timer:** `setInterval` in the effect, `clearInterval` in the cleanup. Without it, a component that mounts and unmounts repeatedly leaves an interval running for each mount, and they accumulate silently.",
        "**An event listener:** `addEventListener` and `removeEventListener` — with the *same function reference*, which means the handler has to be defined inside the effect or be stable, or the removal quietly does nothing.",
        "**A fetch:** there is nothing to unsubscribe from, so cleanup either aborts the request or marks the result as unwanted. Both are covered properly in module 7; the point here is that the cleanup slot is where it goes.",
      ],
      examples: [
        {
          id: "cleanup-symmetry",
          title: "Setup and teardown, and what happens without them",
          lang: "tsx",
          code: `import { useEffect, act } from "react";
import { createRoot } from "react-dom/client";

const listeners = new Set();
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function Leaky({ id }) {
  useEffect(() => {
    subscribe(() => id);          // subscribes, never unsubscribes
  }, [id]);
  return null;
}

function Tidy({ id }) {
  useEffect(() => {
    const unsubscribe = subscribe(() => id);
    return unsubscribe;           // torn down before each re-run, and on unmount
  }, [id]);
  return null;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

const show = (label) => console.log(label, "live listeners:", listeners.size);

act(() => { root.render(<><Leaky id={1} /><Tidy id={1} /></>); });
show("after mount:      ");
act(() => { root.render(<><Leaky id={2} /><Tidy id={2} /></>); });
act(() => { root.render(<><Leaky id={3} /><Tidy id={3} /></>); });
show("after two changes:");
act(() => { root.unmount(); });
show("after unmount:    ");`,
          output: `after mount:       live listeners: 2
after two changes: live listeners: 4
after unmount:     live listeners: 3`,
          explanation:
            "Both started with one listener each. After two `id` changes, `Leaky` had accumulated three — one per run, none removed — while `Tidy` still had one, because each re-run cleaned up the previous. After unmount `Tidy` removed its last and `Leaky` left all three behind forever. Each of those closures also holds the `id` from the render that created it, so this is a memory leak and a source of stale callbacks at once.",
        },
      ],
    },
    {
      id: "empty-array",
      heading: "`[]` does not mean \"runs once\"",
      body: [
        "It means \"depends on nothing\", and those are different claims. React is free to unmount and remount a component whenever it likes, and every remount runs the effect again.",
        "Things that already do this today: a `key` change, a parent re-rendering the component at a different position, Suspense suspending and resuming, and Strict Mode in development.",
        "So an effect that must genuinely happen once per application — installing a global, initialising an SDK — does not belong in a component at all. Put it at module scope, where it runs once per import, or guard it with a module-level flag. Trying to express \"once ever\" through a dependency array is expressing it in the wrong place.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When does an effect's cleanup function run?",
      answer:
        "Three times: before the effect runs again because a dependency changed, when the component unmounts, and — in development inside Strict Mode — immediately after the first run as a test. The middle-changing case is the one people forget, and forgetting it produces effects that subscribe on every dependency change and unsubscribe only once, which is the leak `componentDidUpdate` used to cause.",
    },
    {
      question: "Why does React run effects twice in development?",
      answer:
        "Strict Mode mounts, runs effects, immediately runs their cleanups and runs them again, to check that setup–teardown–setup leaves the component where it started. React genuinely may remount a component — on a `key` change, via Suspense, when a parent moves it — so an effect that only works the first time is broken; this makes it break immediately rather than months later. It does not happen in production, and the fix for a doubled side effect is to write the cleanup, not to remove Strict Mode.",
    },
    {
      question: "Does an empty dependency array mean the effect runs once?",
      answer:
        "No — it means the effect depends on nothing, so it re-runs whenever the component mounts, and a component can mount more than once: a `key` change, Suspense resuming, a parent moving it in the tree, Strict Mode in development. Anything that must happen exactly once per application belongs at module scope rather than in a component, because a dependency array cannot express \"once ever\".",
    },
  ],
  takeaways: [
    "Cleanup runs before each re-run, on unmount, and once extra in Strict Mode",
    "Reading it as \"runs on unmount\" produces subscriptions that accumulate on every dependency change",
    "Strict Mode's mount–unmount–remount tests that an effect can be torn down and set up again",
    "A doubled API call in development is a missing cleanup, and the same gap is a real race in production",
    "An event listener must be removed with the same function reference it was added with",
    "`[]` means \"depends on nothing\", not \"runs once\" — once-ever work belongs at module scope",
  ],
  status: "available",
};
