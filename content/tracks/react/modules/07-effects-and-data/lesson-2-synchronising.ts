import type { Lesson } from "@/content/types";

export const synchronisingLesson: Lesson = {
  id: "react-synchronising",
  slug: "synchronising-with-an-external-system",
  moduleSlug: "effects-and-data",
  title: "What an Effect Is Actually For",
  summary:
    "The job that has no other answer: keeping something outside React in step with what is on screen. The connect/disconnect shape, why the cleanup is not optional, and where an effect sits in the frame.",
  estimatedMinutes: 30,
  objectives: [
    "Describe an effect as synchronisation rather than as a lifecycle hook",
    "Write the connect/disconnect shape and say what each dependency change does",
    "Place useEffect relative to render, commit and paint",
    "Explain why an effect runs after the paint and what that costs",
    "Recognise the external systems you already have in your codebase",
  ],
  sections: [
    {
      id: "not-a-lifecycle",
      heading: "Not a lifecycle hook",
      body: [
        "If you learned class components, you will have been told `useEffect` is `componentDidMount` plus `componentDidUpdate` plus `componentWillUnmount` rolled together. That analogy will actively mislead you, and this is the moment to drop it.",
        "An effect does not answer *\"what should happen when this component appears?\"*. It answers **\"what does the outside world have to look like, given the props and state this component currently has?\"**",
        "The difference shows up in the empty dependency array. Under the lifecycle reading, `[]` means \"run once on mount\", so Strict Mode running it twice looks like a bug in React. Under the synchronisation reading, `[]` means \"this synchronisation does not depend on anything, so it is valid for the whole time the component is on screen\" — and React is free to stop and restart it whenever it likes, because a correct effect that stops and restarts ends up in the same place. Strict Mode is checking exactly that.",
        "Write effects so that running them twice is harmless, and every version of this question stops being a question.",
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what each change does to it",
      body: [
        "An external system is anything with a lifetime React does not manage: a chat connection, a WebSocket, a `setInterval`, an `IntersectionObserver`, a map widget, an analytics SDK, `document.title`.",
        "Every one of them has the same shape — start it, and return the function that stops it.",
      ],
      examples: [
        {
          id: "connect-disconnect",
          title: "One connection, kept in step with a prop",
          lang: "jsx",
          code: `import { useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* An external system: something with a lifecycle React knows nothing about. */
function createConnection(room) {
  return {
    connect() { console.log(\`  [chat] connected to \${room}\`); },
    disconnect() { console.log(\`  [chat] disconnected from \${room}\`); },
  };
}

function ChatRoom({ room }) {
  useEffect(() => {
    const connection = createConnection(room);
    connection.connect();
    return () => connection.disconnect();
  }, [room]);
  return <h1>Welcome to {room}</h1>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount with room=general:");
act(() => { root.render(<ChatRoom room="general" />); });

console.log("re-render with the same room:");
act(() => { root.render(<ChatRoom room="general" />); });

console.log("change room to travel:");
act(() => { root.render(<ChatRoom room="travel" />); });

console.log("unmount:");
act(() => { root.unmount(); });`,
          output: `mount with room=general:
  [chat] connected to general
re-render with the same room:
change room to travel:
  [chat] disconnected from general
  [chat] connected to travel
unmount:
  [chat] disconnected from travel`,
          explanation:
            "Four behaviours, one shape. Mount connects. A re-render with the same `room` does nothing at all — the dependency did not change, so the existing synchronisation is still valid. Changing `room` disconnects from the old one **before** connecting to the new one. Unmounting disconnects. You wrote two lines and got all four, because you described the correspondence rather than the four events.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* An external system: something with a lifecycle React knows nothing about. */
function createConnection(room: string) {
  return {
    connect() { console.log(\`  [chat] connected to \${room}\`); },
    disconnect() { console.log(\`  [chat] disconnected from \${room}\`); },
  };
}

function ChatRoom({ room }: { room: string }) {
  useEffect(() => {
    const connection = createConnection(room);
    connection.connect();
    return () => connection.disconnect();
  }, [room]);
  return <h1>Welcome to {room}</h1>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount with room=general:");
act(() => { root.render(<ChatRoom room="general" />); });

console.log("re-render with the same room:");
act(() => { root.render(<ChatRoom room="general" />); });

console.log("change room to travel:");
act(() => { root.render(<ChatRoom room="travel" />); });

console.log("unmount:");
act(() => { root.unmount(); });`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The cleanup runs before the next effect, not after it",
          body: "Read the `change room` block again: disconnect, then connect. This ordering is what makes the shape safe. Your cleanup closes over the values of the render that created it, so it always releases the resource *that* render acquired — never the one about to be acquired. If cleanup ran last you could not write a correct effect at all.",
        },
        {
          title: "No cleanup means a leak per dependency change",
          body: "Delete the `return` line from that example and the log becomes four `connected` lines with no `disconnect`. Every room change leaks a connection, and unmounting the component leaves one open forever. This is what Strict Mode's double mount is designed to make loud in development instead of silent in production.",
        },
      ],
    },
    {
      id: "timing",
      heading: "When an effect runs",
      body: [
        "The order is worth being able to state without looking. Render, commit, **paint**, then effect.",
        "The important word is *paint*. By the time your effect runs, the browser has already drawn the frame. That is deliberate: the effect cannot delay what the user sees, which is exactly the property you want for connecting a socket or sending an analytics ping.",
        "It is also the property you do not want when the effect changes something visible. If an effect measures an element and repositions it, the user sees one frame in the wrong place before the correction lands. That is `useLayoutEffect`, which runs before the paint, and it has a lesson of its own later in this module.",
        "On an update the sequence gains one step, and it goes early: render, commit, **cleanup of the previous effect**, paint, new effect.",
      ],
      examples: [
        {
          id: "effect-order",
          title: "The order, printed",
          lang: "jsx",
          code: `import { useEffect, useLayoutEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Both({ label }) {
  console.log(\`  render (\${label})\`);
  useLayoutEffect(() => {
    console.log(\`  useLayoutEffect (\${label})  <- before the browser paints\`);
    return () => console.log(\`  cleanup layout (\${label})\`);
  }, [label]);
  useEffect(() => {
    console.log(\`  useEffect (\${label})        <- after the browser paints\`);
    return () => console.log(\`  cleanup effect (\${label})\`);
  }, [label]);
  return (
    <p
      ref={(node) => {
        // React 19: a ref callback may return its own cleanup.
        console.log(\`  ref attached (\${label})     <- commit: the node is in the DOM\`);
        void node;
        return () => console.log(\`  ref detached (\${label})\`);
      }}
    >
      {label}
    </p>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount:");
act(() => { root.render(<Both label="first" />); });

console.log("\\nchange the label prop:");
act(() => { root.render(<Both label="second" />); });

console.log("\\nunmount:");
act(() => { root.unmount(); });`,
          output: `mount:
  render (first)
  ref attached (first)     <- commit: the node is in the DOM
  useLayoutEffect (first)  <- before the browser paints
  useEffect (first)        <- after the browser paints

change the label prop:
  render (second)
  ref detached (first)
  cleanup layout (first)
  ref attached (second)     <- commit: the node is in the DOM
  useLayoutEffect (second)  <- before the browser paints
  cleanup effect (first)
  useEffect (second)        <- after the browser paints

unmount:
  cleanup layout (second)
  ref detached (second)
  cleanup effect (second)`,
          explanation:
            "Three things fall out of the middle block. Refs attach at commit, before any effect. The **layout** cleanup and the layout effect both run before the passive effect's cleanup — the two queues are processed separately, not interleaved by component. And the `<p>` was reused rather than replaced, yet the ref detached and re-attached: the `ref` prop is a new arrow function on every render, so React tears the old one down and installs the new one.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useEffect, useLayoutEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Both({ label }: { label: string }) {
  console.log(\`  render (\${label})\`);
  useLayoutEffect(() => {
    console.log(\`  useLayoutEffect (\${label})  <- before the browser paints\`);
    return () => console.log(\`  cleanup layout (\${label})\`);
  }, [label]);
  useEffect(() => {
    console.log(\`  useEffect (\${label})        <- after the browser paints\`);
    return () => console.log(\`  cleanup effect (\${label})\`);
  }, [label]);
  return (
    <p
      ref={(node) => {
        // React 19: a ref callback may return its own cleanup.
        console.log(\`  ref attached (\${label})     <- commit: the node is in the DOM\`);
        void node;
        return () => console.log(\`  ref detached (\${label})\`);
      }}
    >
      {label}
    </p>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount:");
act(() => { root.render(<Both label="first" />); });

console.log("\\nchange the label prop:");
act(() => { root.render(<Both label="second" />); });

console.log("\\nunmount:");
act(() => { root.unmount(); });`,
            },
          ],
        },
      ],
    },
    {
      id: "what-counts",
      heading: "What counts as an external system",
      body: [
        "Worth listing, because most people underestimate how many they already have.",
        "**Network connections** — WebSockets, server-sent events, long polling, and a `fetch` in flight.",
        "**Timers** — `setInterval`, `setTimeout`, `requestAnimationFrame`.",
        "**Browser APIs that take a callback** — `addEventListener`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver`, `matchMedia`.",
        "**Storage** — `localStorage`, `IndexedDB`, cookies.",
        "**Anything imperative from a library** — a map, a chart, a rich text editor, a video player. Anything you `new` up and later have to destroy.",
        "**The document itself** — `document.title`, focus, `<meta>` tags, the scroll position.",
        "Every one of them has the same test: does it keep existing after your component stops rendering? If yes, it is external and it needs an effect with a cleanup.",
      ],
      pitfalls: [
        {
          title: "Another component's state is not an external system",
          body: "Synchronising two pieces of React state with an effect — a parent's and a child's, or two siblings' — is the chained-effect anti-pattern from lesson 1 wearing a disguise. React state is not outside React. Lift it, derive it, or pass it, but do not keep two copies in step with an effect.",
        },
      ],
    },
    {
      id: "in-practice",
      heading: "Writing one you will not regret",
      body: [
        "Four habits, each of which prevents a class of bug you would otherwise find in production.",
        "**Return the cleanup first.** Write the `return` line before you write the body. It is the line people forget, and forgetting it is a leak rather than an error.",
        "**One effect per concern.** Two unrelated synchronisations in one effect means one dependency array covering both, so a change to either restarts both. Two effects is the right answer, and they may sit next to each other.",
        "**Assume it will run twice.** Not because Strict Mode does it, but because that is what the model permits — and an effect that survives being run twice also survives a remount, a fast route change, and a hot reload.",
        "**Let the linter fill the dependency array.** Then read what it produced. A dependency you did not expect is usually the linter telling you the effect closes over something unstable — and the fix is to move that thing, not to delete the dependency.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is useEffect for?",
      answer:
        "Synchronising something outside React with the props and state a component currently has — a connection, a subscription, a timer, a browser API, an imperative widget. The framing that survives contact with concurrent rendering is synchronisation rather than lifecycle: an effect describes a correspondence that should hold, and React is free to stop and restart it, which is why the cleanup is part of the effect rather than an optional extra.",
    },
    {
      question: "Why does cleanup run before the next effect rather than after?",
      answer:
        "So that the cleanup releases the thing its own render acquired. It closes over that render's variables, so the cleanup created alongside `room=\"general\"` disconnects from `general` — and if it ran after the new effect you would connect to `travel` and then disconnect from... whichever room the closure had. Cleanup-then-effect is what makes the connect/disconnect shape correct without any bookkeeping of your own.",
    },
    {
      question: "Where does an effect run relative to the browser paint?",
      answer:
        "After it. Render, commit, paint, effect — so an effect cannot delay what the user sees, which is right for network and subscription work. `useLayoutEffect` runs between commit and paint, blocking it, which is right only for measuring the DOM and adjusting before the user sees anything.",
    },
    {
      question: "Why does React run effects twice in development?",
      answer:
        "Strict Mode mounts, unmounts and remounts every component to check that effects clean up after themselves. The model already permits React to stop and restart an effect — that is what a remount is — so an effect that breaks when run twice is already broken; Strict Mode just makes it break in development rather than in production. The fix is always the cleanup function, never removing Strict Mode.",
    },
  ],
  takeaways: [
    "An effect answers \"what should the outside world look like, given this state?\" — not \"what happens on mount?\"",
    "The shape is always: start it, return the function that stops it",
    "A re-render with unchanged dependencies does nothing; a changed dependency cleans up the old synchronisation before starting the new one",
    "Cleanup closes over its own render's values, which is why it always releases the right resource",
    "Effects run after the paint; `useLayoutEffect` runs before it and blocks it",
    "Refs attach at commit, before any effect — and an inline `ref` arrow detaches and re-attaches on every render",
    "If it outlives your component's render, it is external and needs a cleanup",
    "Write effects that survive running twice, and Strict Mode stops being a nuisance",
  ],
  status: "available",
};
