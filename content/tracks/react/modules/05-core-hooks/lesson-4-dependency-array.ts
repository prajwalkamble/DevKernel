import type { Lesson } from "@/content/types";

export const dependencyArrayLesson: Lesson = {
  id: "react-dependency-array",
  slug: "the-dependency-array",
  moduleSlug: "core-hooks",
  title: "The Dependency Array, and the Lint Rule Worth Obeying",
  summary:
    "Three forms with three meanings, compared by reference rather than by value — which is why an object or a function in the list makes the effect run every single time, and why removing it is the wrong fix.",
  estimatedMinutes: 30,
  objectives: [
    "Distinguish no array, an empty array and a populated one",
    "Say how React compares dependencies, and what that means for objects",
    "Explain why an inline object or function re-runs the effect every render",
    "Fix a runaway effect without lying to the lint rule",
    "Say why silencing exhaustive-deps produces stale closures",
  ],
  sections: [
    {
      id: "three-forms",
      heading: "Three forms",
      body: [
        "**No array at all** — the effect runs after every render. Rarely what anyone wants, and the usual cause of an accidental infinite loop when the effect sets state.",
        "**An empty array** — the effect runs once when the component mounts, and its cleanup runs once when it unmounts. This is the form people reach for reflexively and the one that most often hides a bug, because it means \"this effect depends on nothing\" and it usually does.",
        "**A populated array** — the effect runs on mount and again whenever one of the listed values differs from last render.",
      ],
      examples: [
        {
          id: "three-arrays",
          title: "Four effects, four different schedules",
          lang: "jsx",
          code: `import { useEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Deps({ a, b }) {
  useEffect(() => { console.log("    no array  -> ran (a=" + a + " b=" + b + ")"); });
  useEffect(() => { console.log("    []        -> ran"); }, []);
  useEffect(() => { console.log("    [a]       -> ran (a=" + a + ")"); }, [a]);
  // An object literal: a new reference on every render, so never equal.
  useEffect(() => { console.log("    [{ a }]   -> ran"); }, [{ a }]);
  return <span>{a}/{b}</span>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount a=1 b=1:");
act(() => { root.render(<Deps a={1} b={1} />); });
console.log("re-render, b changed:");
act(() => { root.render(<Deps a={1} b={2} />); });
console.log("re-render, a changed:");
act(() => { root.render(<Deps a={2} b={2} />); });
console.log("re-render, nothing changed:");
act(() => { root.render(<Deps a={2} b={2} />); });`,
          output: `mount a=1 b=1:
    no array  -> ran (a=1 b=1)
    []        -> ran
    [a]       -> ran (a=1)
    [{ a }]   -> ran
re-render, b changed:
    no array  -> ran (a=1 b=2)
    [{ a }]   -> ran
re-render, a changed:
    no array  -> ran (a=2 b=2)
    [a]       -> ran (a=2)
    [{ a }]   -> ran
re-render, nothing changed:
    no array  -> ran (a=2 b=2)
    [{ a }]   -> ran`,
          explanation:
            "The fourth line of every block is the one to notice. `[{ a }]` ran on all four renders, including the last, where **nothing changed at all**. The object's contents were identical every time; the object was a different one every time. That is the trap, and it is the next section.",
        },
      ],
    },
    {
      id: "by-reference",
      heading: "Compared by reference, not by value",
      body: [
        "React compares each dependency with the previous render's using `Object.is`. For a string, a number or a boolean that is a value comparison and behaves as you expect. For an object, an array or a function it is a **reference** comparison.",
        "A component body creates fresh objects, arrays and functions on every render. So `[{ id }]`, `[options]` where `options` is built in the body, and `[handleChange]` where the handler is defined in the body are all *guaranteed* to differ every render — the effect runs every time, and if it sets state, forever.",
        "This is the same mechanism as `React.memo` and `useMemo`, and the same fix applies. It is worth learning once here because it explains all three.",
      ],
      pitfalls: [
        {
          title: "A prop can be the unstable reference, and then it is the parent's problem",
          body: "`useEffect(..., [config])` where the parent renders `<Child config={{ retries: 3 }} />` re-runs on every parent render, because the parent builds a new object each time. Nothing in the child can fix it — the child is being handed a different value. The fix belongs in the parent: hoist the constant to module scope, or memoise it. This is why an effect that mysteriously runs constantly should send you up the tree, not down.",
        },
      ],
    },
    {
      id: "fixing",
      heading: "Fixing a runaway effect, in the order to try",
      body: [
        "**Move the value out.** If it does not change, it does not belong in the component body. A constant object or a pure function hoisted to module scope has one reference forever and disappears from the dependency array.",
        "**Move it inside the effect.** If it is only used by the effect, declare it there. A function or object created inside the effect is not a dependency at all — this removes more dependency-array problems than anything else and is almost always the right answer.",
        "**Depend on the primitive, not the object.** `[user.id]` rather than `[user]`. Numbers and strings compare by value, so the effect re-runs only when the thing you actually care about changes.",
        "**Memoise it.** `useMemo` for a value, `useCallback` for a function, so the reference survives between renders. Real, and the last resort rather than the first — module 9 shows how often it is applied to problems the first three options would have removed.",
        "**Not on the list:** deleting the dependency and silencing the lint rule.",
      ],
      examples: [
        {
          id: "stabilising",
          title: "The same effect, made to run only when it should",
          lang: "jsx",
          code: `import { useEffect, useState, act } from "react";
import { createRoot } from "react-dom/client";

let runaway = 0;
let stable = 0;

// The options object is rebuilt every render, so this effect never settles.
function Runaway({ userId }) {
  const options = { retries: 3 };
  useEffect(() => { runaway += options.retries > 0 ? 1 : 0; }, [userId, options]);
  return null;
}

// Hoisted out of the component: one reference forever, so it is not reactive
// and leaves the dependency array entirely.
const OPTIONS = { retries: 3 };

function Stable({ userId }) {
  useEffect(() => { stable += OPTIONS.retries > 0 ? 1 : 0; }, [userId]);
  return null;
}

function App({ userId, tick }) {
  return <><Runaway userId={userId} /><Stable userId={userId} /><span>{tick}</span></>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App userId="a" tick={1} />); });
act(() => { root.render(<App userId="a" tick={2} />); });
act(() => { root.render(<App userId="a" tick={3} />); });
console.log("three renders, userId unchanged →  runaway:", runaway, " stable:", stable);

act(() => { root.render(<App userId="b" tick={4} />); });
console.log("fourth render, userId changed   →  runaway:", runaway, " stable:", stable);`,
          output: `three renders, userId unchanged →  runaway: 3  stable: 1
fourth render, userId changed   →  runaway: 4  stable: 2`,
          explanation:
            "Both effects use an options object and both depend on `userId`. `Runaway` ran four times — once per render, including the two where nothing it cares about changed — because its `options` was a new object each time. `Stable` ran exactly twice: once on mount, and once when `userId` actually changed. Hoisting the object did not merely stabilise a reference; it removed the value from the dependency array altogether, because something declared outside the component is not reactive and there is nothing to list.",
        },
      ],
    },
    {
      id: "the-lint-rule",
      heading: "`exhaustive-deps`, and what silencing it costs",
      body: [
        "The rule reads your effect, works out every reactive value it uses, and requires each to be listed. When it complains, it is almost always right about the *facts* — the effect really does read that value.",
        "Removing a dependency does not stop the effect using the value. It stops the effect being re-created, so the closure it kept holds the value from the render where it was set up. That is the stale closure from module 4, and it is worse than the re-running it was meant to cure: instead of doing too much work, the code now does the wrong work, silently.",
        "So when the rule complains, the question is never \"how do I remove this from the array\". It is \"why does this value change more often than the effect should re-run\", and the answer is one of the four fixes above.",
        "The rule does have false positives — mostly around values that are conceptually constant but not provably so. The escape hatch is to make them actually constant rather than to suppress the warning.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does React compare dependencies?",
      answer:
        "With `Object.is` against the previous render's array — a value comparison for primitives and a reference comparison for objects, arrays and functions. Since a component body creates fresh objects and functions on every render, any of those in the dependency array differ every time and the effect re-runs on every render. It is the same comparison `React.memo`, `useMemo` and `useCallback` use.",
    },
    {
      question: "An effect is re-running on every render. How do you fix it?",
      answer:
        "Find the unstable dependency, then in order: move it out of the component if it never changes; move it inside the effect if only the effect uses it, which removes it from the array entirely; depend on a primitive such as `user.id` rather than the object; and only then memoise it with `useMemo` or `useCallback`. If the unstable value is a prop, no fix inside the component will work — the parent is creating it fresh each render, so the fix belongs there.",
    },
    {
      question: "What actually happens when you silence `exhaustive-deps`?",
      answer:
        "The effect stops being re-created, so the closure it captured keeps the values from the render that set it up. It does not stop using the value — it starts using an old one. So you trade an effect that runs too often for one that runs with stale data and gives no indication it is doing so, which is strictly worse. The rule is reporting a real dependency; the fix is to make that dependency stable.",
    },
  ],
  takeaways: [
    "No array runs every render, `[]` runs on mount, a populated array runs when a listed value changes",
    "Dependencies are compared with `Object.is` — by reference for objects, arrays and functions",
    "An object or function created in the component body differs every render, so the effect never settles",
    "An unstable dependency that arrives as a prop can only be fixed in the parent",
    "Prefer moving the value out or into the effect over memoising it",
    "Silencing `exhaustive-deps` swaps too-frequent runs for silently stale data",
  ],
  status: "available",
};
