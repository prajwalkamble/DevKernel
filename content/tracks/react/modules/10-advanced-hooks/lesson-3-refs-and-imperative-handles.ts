import type { Lesson } from "@/content/types";

export const refsAndImperativeHandlesLesson: Lesson = {
  id: "react-refs-as-props",
  slug: "refs-and-imperative-handles",
  moduleSlug: "advanced-and-custom-hooks",
  title: "Refs as Props, and useImperativeHandle",
  summary:
    "React 19 made `ref` an ordinary prop, so `forwardRef` is no longer needed. What replaced it, when to expose a deliberate handle instead of a DOM node, and why this is the API of last resort.",
  estimatedMinutes: 26,
  objectives: [
    "Accept a ref as a prop on a function component",
    "Say what forwardRef was for and what to do with existing code",
    "Design an imperative handle rather than exposing a DOM node",
    "Use a ref callback's cleanup, new in React 19",
    "Say when an imperative API is the wrong answer",
  ],
  sections: [
    {
      id: "ref-as-prop",
      heading: "`ref` is a prop now",
      body: [
        "Until React 19, `ref` was not a prop. It was pulled out of the props object by JSX and delivered separately, so a function component could not receive one — hence `forwardRef`, a wrapper that took `(props, ref)` and passed the second argument through.",
        "**In React 19 that is gone.** `ref` is an ordinary prop on function components. Declare it, type it, pass it on.",
      ],
      examples: [
        {
          id: "refs-two-ways",
          title: "A DOM ref and a handle, side by side",
          lang: "tsx",
          code: `import { useRef, useImperativeHandle, useState, act } from "react";
import { createRoot } from "react-dom/client";

/* React 19: \`ref\` is an ordinary prop on a function component.
   No forwardRef, no second parameter. */
function TextField({ ref, label }: { ref?: React.Ref<HTMLInputElement>; label: string }) {
  return (
    <p>
      <label>{label}<input ref={ref} /></label>
    </p>
  );
}

/* When the parent should be able to *do* things rather than reach into the
   DOM, expose a deliberate surface instead of the node. */
type EditorHandle = { focus: () => void; clear: () => void };

function Editor({ ref }: { ref?: React.Ref<EditorHandle> }) {
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    clear: () => setValue(""),
  }), []);
  return <input ref={input} value={value} onChange={(e) => setValue(e.target.value)} />;
}

function App() {
  const field = useRef<HTMLInputElement>(null);
  const editor = useRef<EditorHandle>(null);
  return (
    <div>
      <TextField ref={field} label="Name" />
      <Editor ref={editor} />
      <button type="button" id="probe" onClick={() => {
        console.log("  the field ref points at:", field.current?.tagName);
        console.log("  the editor ref exposes: ", Object.keys(editor.current ?? {}).join(", "));
        console.log("  and not the DOM node:   ", (editor.current as unknown as HTMLElement)?.tagName);
      }}>probe</button>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
console.log("what each ref holds after mount:");
act(() => { container.querySelector<HTMLButtonElement>("#probe")!.click(); });`,
          output: `what each ref holds after mount:
  the field ref points at: INPUT
  the editor ref exposes:  focus, clear
  and not the DOM node:    undefined`,
          explanation:
            "Two different contracts. `TextField` hands the caller the real `<input>` — everything on it, forever, including whatever the caller decides to do with `style` or `value`. `Editor` hands the caller two functions and keeps its DOM node private, so its internals can change without breaking anybody.",
        },
      ],
      pitfalls: [
        {
          title: "What to do with existing `forwardRef`",
          body: "It still works and is deprecated. Migrating is mechanical — delete the wrapper, move `ref` into the props type — and there is a codemod for it. Do it opportunistically rather than as a project: the deprecation warning is the only cost until it is removed.",
        },
        {
          title: "It is only function components",
          body: "Class components still receive `ref` the old way, pointing at the instance. And a ref on a component that does not pass it anywhere silently stays `null` — there is no warning, because \"this component chose not to expose one\" is a legitimate design.",
        },
      ],
    },
    {
      id: "imperative-handle",
      heading: "useImperativeHandle",
      body: [
        "`useImperativeHandle(ref, createHandle, deps)` replaces whatever the ref would have received with the object `createHandle` returns.",
        "The reason to use it is **narrowing**. A DOM node is an enormous, permanent, public API: hand one out and a caller can read layout, set styles, change the value, attach listeners, and remove it from the document — and any of those becomes something you have to preserve. A handle with two methods is a contract you can keep.",
        "The dependency array works as everywhere else, and `[]` is the usual answer: the handle's methods close over refs, and refs do not change identity. A dependency list that changes rebuilds the handle, which the parent will not notice unless it stored the object rather than the ref.",
      ],
      examples: [
        {
          id: "handle-design",
          title: "A handle that is worth having",
          lang: "tsx",
          code: `type ChatHandle = {
  /** Scrolls to the newest message. */
  scrollToLatest: () => void;
  /** Puts the caret in the composer. */
  focusComposer: () => void;
};

function ChatPanel({ ref, roomId }: { ref?: React.Ref<ChatHandle>; roomId: string }) {
  const list = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);

  // [] is right: both methods only read refs, whose identity never changes.
  useImperativeHandle(ref, () => ({
    scrollToLatest: () => list.current?.scrollTo({ top: list.current.scrollHeight }),
    focusComposer: () => composer.current?.focus(),
  }), []);

  return (
    <section>
      <div ref={list}>{/* … */}</div>
      <textarea ref={composer} />
    </section>
  );
}

/* The caller can do exactly two things, both named after intent rather than
   mechanism — so switching the list to a virtualised one later changes the
   implementation of scrollToLatest and nothing else. */
function Room() {
  const chat = useRef<ChatHandle>(null);
  return (
    <>
      <ChatPanel ref={chat} roomId="general" />
      <button type="button" onClick={() => chat.current?.scrollToLatest()}>Jump to latest</button>
    </>
  );
}`,
          explanation:
            "`scrollToLatest` rather than `getScrollElement`. The first is a capability the component promises; the second is an implementation detail promoted to an API, and it is the version that breaks when the list becomes virtualised.",
        },
      ],
      pitfalls: [
        {
          title: "Do not use it to route round one-way data flow",
          body: "A handle with `setValue`, `setOpen` and `reset` is state living in a child that the parent is steering by remote control. Now the value's owner cannot be determined by reading the tree, and the parent cannot render from it. If the parent needs to control something, that is a prop — module 3. Imperative handles are for actions that have no rendered representation: focus, scroll, play, select, measure.",
        },
      ],
    },
    {
      id: "ref-cleanup",
      heading: "Ref callbacks can clean up now",
      body: [
        "A ref can be a function instead of a ref object. React calls it with the node on attach and, historically, with `null` on detach — which meant every ref callback had a `if (node === null)` branch.",
        "**In React 19 a ref callback may return a cleanup function**, exactly like an effect. React calls it on detach and stops passing `null`.",
        "This makes a callback ref the right tool for anything set up per node: an observer, a listener, a third-party widget attached to an element.",
      ],
      examples: [
        {
          id: "ref-cleanup-code",
          title: "A per-node observer, with its teardown next to it",
          lang: "tsx",
          code: `function Reveal({ children }: { children: ReactNode }) {
  return (
    <div
      ref={(node) => {
        const observer = new IntersectionObserver(([entry]) => {
          entry.target.classList.toggle("visible", entry.isIntersecting);
        });
        observer.observe(node);
        // React 19: returned, and called when this node detaches.
        return () => observer.disconnect();
      }}
    >
      {children}
    </div>
  );
}`,
          explanation:
            "Setup and teardown are two adjacent lines rather than two branches of an `if`. One caution carried over from module 7: an inline arrow is a new function every render, so React detaches and re-attaches on every render of the parent — fine for this, wasteful if the setup is expensive. `useCallback` the ref when it is.",
        },
      ],
    },
    {
      id: "last-resort",
      heading: "The API of last resort",
      body: [
        "Everything in this lesson is an escape hatch, and it is worth being explicit about what you give up by using one.",
        "An imperative call is **invisible to React's model**. It does not participate in rendering, it cannot be derived from state, it is not replayed when a component re-mounts, and it does not appear in the tree — so the answer to \"why is this focused?\" is no longer in the component's props or state.",
        "The things that legitimately have no rendered representation are a short list: **focus, scroll position, text selection, media playback, canvas drawing, animation triggers, and measuring**. If what you want is not on that list, there is almost certainly a prop for it.",
        "The test before adding a handle: *can this be expressed as \"the UI looks like this given this state\"?* If yes, it is state and a prop. If no — \"put the caret here\", \"play this\" — a handle is the right tool.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you pass a ref to a function component?",
      answer:
        "In React 19, as an ordinary prop — declare `ref` in the props type and use it. Before 19, `ref` was extracted by JSX rather than delivered in props, which is why `forwardRef` existed: a wrapper that took `(props, ref)` and passed the second argument through. `forwardRef` still works, is deprecated, and has a codemod.",
    },
    {
      question: "What is useImperativeHandle for?",
      answer:
        "Replacing what a ref receives with a deliberate object instead of a DOM node. The reason is narrowing: a DOM node is an enormous permanent public API, so handing one out means every property on it becomes something callers may depend on. A handle of two named methods is a contract you can actually keep, and it lets the component change its internals — swapping a plain list for a virtualised one — without breaking a caller.",
    },
    {
      question: "When is an imperative handle the wrong answer?",
      answer:
        "Whenever what you want can be expressed as \"the UI looks like this given this state\" — then it is a prop, and a handle with `setValue` or `setOpen` is a parent steering a child by remote control, with no owner you can find by reading the tree. Handles are for things with no rendered representation: focus, scroll, selection, media playback, canvas drawing, animation triggers and measurement.",
    },
    {
      question: "What changed about ref callbacks in React 19?",
      answer:
        "They may return a cleanup function, which React calls on detach — and when one does, React stops calling it with `null`. So setup and teardown sit next to each other instead of being two branches of a null check, which makes a callback ref the natural place for a per-node observer or listener. The caveat is unchanged: an inline arrow is a new function each render, so React re-attaches every render unless it is memoised.",
    },
  ],
  takeaways: [
    "React 19: `ref` is an ordinary prop on function components; `forwardRef` is deprecated with a codemod",
    "A ref on a component that does not pass it on stays `null`, with no warning",
    "`useImperativeHandle` narrows a huge permanent API down to a contract you can keep",
    "Name handle methods after intent — `scrollToLatest`, not `getScrollElement`",
    "`[]` is the usual dependency list, since the methods only close over refs",
    "A handle full of setters is one-way data flow being routed around — use props",
    "React 19 ref callbacks may return a cleanup, and then are never called with `null`",
    "Reserve all of it for what has no rendered representation: focus, scroll, selection, media, canvas, measurement",
  ],
  status: "available",
};
