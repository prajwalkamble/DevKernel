import type { Lesson } from "@/content/types";

export const whatCausesARerenderLesson: Lesson = {
  id: "react-what-causes-a-rerender",
  slug: "what-causes-a-re-render",
  moduleSlug: "rendering-and-performance",
  title: "What Causes a Re-render, and What Does Not",
  summary:
    "Three causes, and one non-cause that half the internet gets wrong. Measured with counters, including the bail-out you get from setting state to the value it already has.",
  estimatedMinutes: 25,
  objectives: [
    "List the three things that cause a component to re-render",
    "Say why a prop changing is not one of them",
    "Predict which components re-render for a given state change",
    "Explain the same-value bail-out and its one extra render",
    "Read a re-render as a question about the parent, not the child",
  ],
  sections: [
    {
      id: "three-causes",
      heading: "The three causes",
      body: [
        "**Its own state changed.** A `useState` setter or a `dispatch` was called with a value React considers different.",
        "**Its parent re-rendered.** No conditions. The child re-renders whether its props changed, whether it has props at all, and whether it has state of its own.",
        "**A context it reads changed.** Module 8 covered this one; it is the rule `memo` cannot stop.",
        "That is the complete list. Everything else you might have heard is a consequence of one of these three.",
      ],
    },
    {
      id: "not-props",
      heading: "The non-cause: a prop changing",
      body: [
        "\"A component re-renders when its props change\" is the sentence in most tutorials, and it is backwards in a way that matters.",
        "Ask how a prop *could* change. A prop is a value the parent passed in its JSX. For a different value to arrive, the parent's JSX must have been evaluated again — which means the parent re-rendered. **The parent's render is the cause; the changed prop is a symptom of the same event.**",
        "The proof is the other direction: a component whose props did not change re-renders anyway when its parent does. React does not compare props by default and never looks at them to decide.",
        "This matters because it tells you where to look. \"Why did this re-render?\" is almost always a question about the parent.",
      ],
      examples: [
        {
          id: "who-rerenders",
          title: "Four components, one state change",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

const renders = {};
const count = (n) => { renders[n] = (renders[n] ?? 0) + 1; };
const reset = () => { for (const k of Object.keys(renders)) renders[k] = 0; };

/* Takes a prop that never changes. */
function TakesProp({ label }) { count("TakesProp"); return <b>{label}</b>; }
/* Takes no props at all. */
function TakesNothing() { count("TakesNothing"); return <i />; }
/* Has its own state, which nobody touches. */
function HasOwnState() { count("HasOwnState"); const [n] = useState(0); return <u>{n}</u>; }
/* A sibling of the component whose state changes. */
function Sibling() { count("Sibling"); return <s />; }

function Middle() {
  count("Middle");
  return <><TakesProp label="fixed" /><TakesNothing /><HasOwnState /></>;
}

function App() {
  const [n, setN] = useState(0);
  count("App");
  return (
    <div>
      <output>{n}</output>
      <button type="button" id="go" onClick={() => setN((x) => x + 1)}>go</button>
      <button type="button" id="same" onClick={() => setN((x) => x)}>set same</button>
      <Middle />
      <Sibling />
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });

reset();
act(() => { container.querySelector("#go").click(); });
console.log("App's state changed:      ", JSON.stringify(renders));

reset();
act(() => { container.querySelector("#same").click(); });
console.log("set to the same value:    ", JSON.stringify(renders));

reset();
act(() => { container.querySelector("#go").click(); });
act(() => { container.querySelector("#go").click(); });
console.log("two more real changes:    ", JSON.stringify(renders));`,
          output: `App's state changed:       {"App":1,"Middle":1,"TakesProp":1,"TakesNothing":1,"HasOwnState":1,"Sibling":1}
set to the same value:     {"App":1,"Middle":0,"TakesProp":0,"TakesNothing":0,"HasOwnState":0,"Sibling":0}
two more real changes:     {"App":2,"Middle":2,"TakesProp":2,"TakesNothing":2,"HasOwnState":2,"Sibling":2}`,
          explanation:
            "First line: everything. A fixed prop did not save `TakesProp`; having no props did not save `TakesNothing`; having its own untouched state did not save `HasOwnState`; being off to one side did not save `Sibling`. The cascade goes down from wherever the state changed, unconditionally.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

const renders: Record<string, number> = {};
const count = (n: string) => { renders[n] = (renders[n] ?? 0) + 1; };
const reset = () => { for (const k of Object.keys(renders)) renders[k] = 0; };

/* Takes a prop that never changes. */
function TakesProp({ label }: { label: string }) { count("TakesProp"); return <b>{label}</b>; }
/* Takes no props at all. */
function TakesNothing() { count("TakesNothing"); return <i />; }
/* Has its own state, which nobody touches. */
function HasOwnState() { count("HasOwnState"); const [n] = useState(0); return <u>{n}</u>; }
/* A sibling of the component whose state changes. */
function Sibling() { count("Sibling"); return <s />; }

function Middle() {
  count("Middle");
  return <><TakesProp label="fixed" /><TakesNothing /><HasOwnState /></>;
}

function App() {
  const [n, setN] = useState(0);
  count("App");
  return (
    <div>
      <output>{n}</output>
      <button type="button" id="go" onClick={() => setN((x) => x + 1)}>go</button>
      <button type="button" id="same" onClick={() => setN((x) => x)}>set same</button>
      <Middle />
      <Sibling />
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });

reset();
act(() => { container.querySelector<HTMLButtonElement>("#go")!.click(); });
console.log("App's state changed:      ", JSON.stringify(renders));

reset();
act(() => { container.querySelector<HTMLButtonElement>("#same")!.click(); });
console.log("set to the same value:    ", JSON.stringify(renders));

reset();
act(() => { container.querySelector<HTMLButtonElement>("#go")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#go")!.click(); });
console.log("two more real changes:    ", JSON.stringify(renders));`,
            },
          ],
        },
      ],
    },
    {
      id: "bail-out",
      heading: "The same-value bail-out",
      body: [
        "The second line of that output is the interesting one. `setN(x => x)` produced **one** render of `App` and zero renders of anything below it.",
        "React compares the new state with the current one using `Object.is`. When they match it stops there and does not render the children — the update was a no-op and the tree below cannot have changed.",
        "It still rendered `App` once, and that is documented behaviour rather than an accident: React has to run the component to find out what the new state actually is, and by then it has rendered. It may skip even that if it can tell early enough, so do not build anything on the count.",
        "The practical consequences are two. Setting state to the value it already holds is cheap but not free. And a state update that produces an equal *object* is not equal — `setUser({...user})` with identical contents is a new object, `Object.is` says different, and the whole tree re-renders.",
      ],
      pitfalls: [
        {
          title: "Bailing out is not the same as batching",
          body: "Batching, from module 4, groups several updates into one render. The bail-out cancels an update whose value did not change. `setN(1); setN(1)` on a state that is already 1 is a bail-out; `setA(1); setB(2)` is batching. They both reduce render counts and they answer different questions.",
        },
      ],
    },
    {
      id: "reading-it",
      heading: "Reading a re-render",
      body: [
        "Given \"why did this component re-render?\", work through the three causes in order, and stop at the first that applies.",
        "**Did its own state change?** Check the setters it calls. If yes, that is the answer, and the next question is whether the value really changed.",
        "**Did a context it reads change?** Check every `useContext` in it and in every hook it calls. A custom hook can read a context without saying so at the call site, which is the case people miss.",
        "**Otherwise, its parent re-rendered** — and the same three questions now apply to the parent. Walk up until you find the component whose own state changed. That component is the origin, and everything from there down is the cascade.",
        "React DevTools' Profiler does this walk for you and reports \"why did this render?\" per component. Lesson 7 covers reading it.",
      ],
      pitfalls: [
        {
          title: "Strict Mode doubles your counts in development",
          body: "Every count in a development build is twice what production will do, because Strict Mode renders each component twice to check purity. That is fine for *comparing* two versions and misleading if you quote the absolute number. Profile a production build before believing a figure.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What causes a component to re-render?",
      answer:
        "Three things: its own state changed, its parent re-rendered, or a context it reads changed. That is the whole list. A prop changing is not a separate cause — for a prop to change, the parent must have re-rendered, so the parent's render is the cause and the changed prop is a symptom of the same event. React does not compare props by default and never consults them to decide.",
    },
    {
      question: "Does a component skip re-rendering if its props did not change?",
      answer:
        "No. By default React re-renders every child of a re-rendered component regardless of props, regardless of whether it has props at all, and regardless of its own state. Comparing props is opt-in, via `memo`, and it is opt-in because for most components the comparison costs about as much as the render it might save.",
    },
    {
      question: "What happens when you set state to the value it already has?",
      answer:
        "React compares with `Object.is`, finds them equal, and does not render the children — the update is a no-op. It may still render that one component once, because it has to run the component to discover the new value. The trap is that an object with identical contents is not the same value: `setUser({...user})` always looks like a change and re-renders the whole subtree.",
    },
  ],
  takeaways: [
    "Three causes: own state changed, parent re-rendered, a context it reads changed",
    "A prop changing is not a cause — it is a symptom of the parent having re-rendered",
    "React does not compare props by default; a component with unchanged props re-renders anyway",
    "Setting state to an equal value bails out before the children, but may still render that component once",
    "An object with identical contents is not an equal value",
    "\"Why did this re-render?\" is usually a question about the parent — walk up to the origin",
    "Development counts are doubled by Strict Mode; quote numbers from a production profile",
  ],
  status: "available",
};
