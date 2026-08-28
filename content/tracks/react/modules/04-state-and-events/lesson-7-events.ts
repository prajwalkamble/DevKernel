import type { Lesson } from "@/content/types";

export const eventsLesson: Lesson = {
  id: "react-events",
  slug: "events-and-delegation",
  moduleSlug: "state-and-events",
  title: "Events, Synthetic Events & Delegation",
  summary:
    "React does not attach a listener to your button. It attaches a few to the root and reconstructs the whole capture-and-bubble journey itself — which explains the synthetic event object, the capture-phase props, and why stopping propagation does not stop a native listener.",
  estimatedMinutes: 30,
  objectives: [
    "Say where React actually attaches its listeners",
    "Describe what a synthetic event is and why it exists",
    "Predict the order handlers run in, including the capture phase",
    "Use `preventDefault` and `stopPropagation` knowing what each reaches",
    "Pass an argument to a handler without calling it during render",
  ],
  sections: [
    {
      id: "delegation",
      heading: "Where the listener actually is",
      visual: {
        id: "event-delegation-visual",
        kind: "react-tooling",
        algorithm: "click-events",
        title: "One listener, and the path an event takes",
      },
      body: [
        "Writing `onClick` on a hundred buttons does not create a hundred listeners. React attaches a small number of listeners to the **root container** — the element passed to `createRoot` — and works out which of your handlers to run from the event's target.",
        "This is event delegation, and React does it for the obvious reason: attaching and detaching a real listener every time a component mounts or unmounts would be far more expensive than one listener per event type at the top.",
        "It moved in React 17. Before that the listeners went on `document`, which broke when two React versions ran on one page and when a React app was embedded in something that stopped propagation. Attaching at the root container fixed both, and is why advice written before 2020 about `document`-level handlers is out of date.",
      ],
      examples: [
        {
          id: "delegation-order",
          title: "Handler order, and where the native listener sits",
          lang: "tsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div
      id="outer"
      onClickCapture={() => console.log("  2. parent, capture phase")}
      onClick={() => console.log("  4. parent, bubble phase")}
    >
      <button id="b" onClick={() => console.log("  3. button")}>go</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<App />); });

// Native listeners, for comparison with React's synthetic pass.
container.addEventListener("click", () => console.log("  5. native listener on the root container"));
document.addEventListener("click", () => console.log("  6. native listener on document"));

console.log("1. clicking the button:");
act(() => { container.querySelector("#b").click(); });`,
          output: `1. clicking the button:
  2. parent, capture phase
  3. button
  4. parent, bubble phase
  5. native listener on the root container
  6. native listener on document`,
          explanation:
            "Every React handler ran before the native listener on the very same container. That is the delegation showing: one real click reached the container, and React then replayed the whole capture-then-bubble journey through its own tree synthetically before the browser's own bubbling continued. Nothing was ever attached to the `<button>`.",
        },
      ],
    },
    {
      id: "synthetic",
      heading: "The synthetic event",
      body: [
        "The object your handler receives is not the browser's event. It is a `SyntheticBaseEvent`: a wrapper with the same interface — `type`, `target`, `currentTarget`, `preventDefault`, `stopPropagation` — normalised across browsers.",
        "The real event is always available as `event.nativeEvent` when you need something the wrapper does not expose.",
        "The historical wrinkle worth knowing: synthetic events used to be **pooled**. The object was reused after the handler returned, so reading `event.target` inside a `setTimeout` gave you `null`, and you had to call `event.persist()`. Pooling was removed in React 17. Code calling `persist()` is harmless and unnecessary, and advice about it is obsolete.",
      ],
      examples: [
        {
          id: "synthetic-shape",
          title: "What is in your hand",
          lang: "tsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div id="outer">
      <button id="b" onClick={(event) => {
        console.log("constructor:      ", event.constructor.name);
        console.log("type:             ", event.type);
        console.log("target:           ", event.target.id);
        console.log("currentTarget:    ", event.currentTarget.id);
        console.log("nativeEvent real? ", event.nativeEvent instanceof MouseEvent);
      }}>go</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<App />); });
act(() => { container.querySelector("#b").click(); });`,
          output: `constructor:       SyntheticBaseEvent
type:              click
target:            b
currentTarget:     b
nativeEvent real?  true`,
          explanation:
            "`target` is what was clicked; `currentTarget` is the element whose handler is running. They are the same here because the handler is on the button itself — on the parent's handler, `target` would still be `b` while `currentTarget` became `outer`. That distinction is the whole of delegation in one pair of properties.",
        },
      ],
      pitfalls: [
        {
          title: "`currentTarget` is only valid during the handler",
          body: "It changes as the event travels, so reading it inside a `setTimeout` or after an `await` gives whatever it had become by then — usually `null`. Capture what you need into a variable at the top of the handler. `target` is safe since React 17 removed pooling, but `currentTarget` is a moving value by design rather than a pooling artefact.",
        },
      ],
    },
    {
      id: "stopping",
      heading: "`preventDefault` and `stopPropagation`",
      body: [
        "**`preventDefault()`** cancels the browser's default action: a form submitting and reloading the page, a link navigating, a checkbox toggling. It does not stop the event travelling.",
        "**`stopPropagation()`** stops the event reaching handlers further up. It does not cancel the default action.",
        "They answer different questions and are routinely confused. A form's `onSubmit` almost always wants `preventDefault` and almost never wants `stopPropagation`.",
        "The delegation caveat: `stopPropagation` in a React handler stops React's *synthetic* propagation. The native event is still travelling — it has already reached the root container, which is where React was listening — so a native listener added with `addEventListener` further up will still fire. When you need to stop both, call `event.nativeEvent.stopPropagation()` as well.",
      ],
    },
    {
      id: "arguments",
      heading: "Passing arguments to a handler",
      body: [
        "The event is the only argument React supplies. Anything else has to be closed over, which means wrapping: `onClick={() => onSelect(person.id)}`.",
        "Both are available if you need them: `onClick={(event) => onSelect(person.id, event)}`.",
        "The mistake to avoid is `onClick={onSelect(person.id)}`, which calls `onSelect` during render and passes its return value as the handler. Module 3's lesson on functions as props covered why that produces a render loop rather than an error.",
        "For a list, an alternative that avoids allocating a function per row is a single handler on the container that reads the id from a `data-` attribute on the target. It is worth knowing and rarely worth doing — the allocation is not the expensive part, and the explicit version is clearer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Does React attach an event listener to every element with an `onClick`?",
      answer:
        "No. It attaches a small number of listeners to the root container passed to `createRoot`, and works out which handlers to call from the event's target — event delegation. It then replays the capture and bubble phases through its own component tree synthetically. The listeners were on `document` before React 17; moving them to the root container fixed conflicts between two React versions on one page and apps embedded in other apps.",
    },
    {
      question: "What is a synthetic event, and do you still need `event.persist()`?",
      answer:
        "A cross-browser wrapper around the native event with the same interface, available as `event.nativeEvent` if you need the original. `persist()` is no longer needed: synthetic events used to be pooled and reused after the handler returned, which is why reading properties asynchronously gave nulls, and React 17 removed pooling. Calling it now is harmless and pointless.",
    },
    {
      question: "Why might `stopPropagation` in a React handler fail to stop a native listener?",
      answer:
        "Because React's listener is at the root container, so by the time your handler runs the native event has already travelled there. `stopPropagation` on the synthetic event stops React's own synthetic pass, not the native event's remaining journey — a listener added with `addEventListener` above the root still fires. Stopping both requires `event.nativeEvent.stopPropagation()` as well.",
    },
  ],
  takeaways: [
    "React attaches listeners to the root container, not to your elements — one real click, one synthetic pass",
    "Listeners moved from `document` to the root container in React 17, which is why older advice is wrong",
    "The handler receives a `SyntheticBaseEvent`; the browser's event is `event.nativeEvent`",
    "Event pooling and `persist()` were removed in React 17",
    "`preventDefault` cancels the browser's action, `stopPropagation` stops the journey — they are unrelated",
    "`stopPropagation` stops React's synthetic pass, not the native event that has already reached the root",
  ],
  status: "available",
};
