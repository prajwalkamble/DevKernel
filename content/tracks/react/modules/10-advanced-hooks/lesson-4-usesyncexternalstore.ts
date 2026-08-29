import type { Lesson } from "@/content/types";

export const useSyncExternalStoreLesson: Lesson = {
  id: "react-usesyncexternalstore",
  slug: "usesyncexternalstore",
  moduleSlug: "advanced-and-custom-hooks",
  title: "useSyncExternalStore",
  summary:
    "Subscribing to something that is not React state, correctly. The two functions it takes, the update the useState-plus-useEffect version silently misses — demonstrated — and the third argument that makes it work on a server.",
  estimatedMinutes: 28,
  objectives: [
    "Write subscribe and getSnapshot for an external source",
    "Show the update an effect-based subscription misses",
    "Say what tearing is and why concurrent rendering makes it possible",
    "Supply getServerSnapshot and know when it is required",
    "Keep getSnapshot cheap and stable",
  ],
  sections: [
    {
      id: "the-signature",
      heading: "Two functions",
      body: [
        "`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`.",
        "**`subscribe(onChange)`** registers a listener and returns the function that removes it. React calls it on mount and whenever its identity changes — so it must be stable, or you resubscribe on every render.",
        "**`getSnapshot()`** returns the current value. React calls it during render and again after every notification, and re-renders when the result differs by `Object.is`.",
        "Notice what is absent: no state, no effect, no copy of the value. React reads through to the source every time, which is the entire point.",
      ],
      visual: {
        id: "external-store-visual",
        kind: "react-rendering",
        algorithm: "external-store",
        title: "Subscribe, snapshot, notify",
      },
    },
    {
      id: "the-missed-update",
      heading: "The update the obvious version misses",
      body: [
        "Everyone writes the effect version first: hold a copy in state, subscribe in an effect, update the copy when the listener fires. It is wrong, and it is wrong in a window you cannot see.",
        "The value is read during render. The subscription starts in an effect, which runs **after the commit**. Anything the source does in between is never observed by anyone — the render already happened, and the listener did not exist yet.",
        "That window is not theoretical. A ref callback fires exactly there, at commit, before effects — so it can stand in for the socket message, media-query change or other tab that reaches you at that moment.",
      ],
      examples: [
        {
          id: "missed-update",
          title: "The same store, subscribed two ways",
          lang: "jsx",
          code: `import { useState, useEffect, useSyncExternalStore, act } from "react";
import { createRoot } from "react-dom/client";

const listeners = new Set();
let status = "online";
const store = {
  get: () => status,
  set(next) { status = next; for (const l of listeners) l(); },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
};

/* The version everybody writes first: a copy in state, kept up to date by
   an effect. It reads during render and subscribes afterwards. */
function useStatusCopy() {
  const [value, setValue] = useState(store.get());
  useEffect(() => store.subscribe(() => setValue(store.get())), []);
  return value;
}

/* The version React provides. Nothing is copied; it reads through the
   snapshot, and React re-checks the snapshot right after subscribing. */
function useStatusSync() {
  return useSyncExternalStore(store.subscribe, store.get);
}

function drive(useStatus, label) {
  status = "online";
  let fired = false;
  function Badge() {
    const value = useStatus();
    // A ref callback runs at commit time — after the render, before any
    // effect. That is exactly the window in which an effect-based
    // subscription is not yet listening.
    return <output ref={() => { if (!fired) { fired = true; store.set("offline"); } }}>{value}</output>;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(<Badge />); });
  console.log(\`\${label.padEnd(26)} store says "\${store.get()}", the screen says "\${container.textContent}"\`);
}

drive(useStatusCopy, "useState + useEffect:");
drive(useStatusSync, "useSyncExternalStore:");`,
          output: `useState + useEffect:      store says "offline", the screen says "online"
useSyncExternalStore:      store says "offline", the screen says "offline"`,
          explanation:
            "The first line is a permanently wrong screen. The store says `offline`, the badge says `online`, and it will stay that way until something else happens to change the store again. `useSyncExternalStore` re-reads the snapshot immediately after subscribing, precisely to close that window — that check is the reason the hook exists rather than being a documented pattern.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, useSyncExternalStore, act } from "react";
import { createRoot } from "react-dom/client";

const listeners = new Set<() => void>();
let status = "online";
const store = {
  get: () => status,
  set(next: string) { status = next; for (const l of listeners) l(); },
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
};

/* The version everybody writes first: a copy in state, kept up to date by
   an effect. It reads during render and subscribes afterwards. */
function useStatusCopy() {
  const [value, setValue] = useState(store.get());
  useEffect(() => store.subscribe(() => setValue(store.get())), []);
  return value;
}

/* The version React provides. Nothing is copied; it reads through the
   snapshot, and React re-checks the snapshot right after subscribing. */
function useStatusSync() {
  return useSyncExternalStore(store.subscribe, store.get);
}

function drive(useStatus: () => string, label: string) {
  status = "online";
  let fired = false;
  function Badge() {
    const value = useStatus();
    // A ref callback runs at commit time — after the render, before any
    // effect. That is exactly the window in which an effect-based
    // subscription is not yet listening.
    return <output ref={() => { if (!fired) { fired = true; store.set("offline"); } }}>{value}</output>;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(<Badge />); });
  console.log(\`\${label.padEnd(26)} store says "\${store.get()}", the screen says "\${container.textContent}"\`);
}

drive(useStatusCopy, "useState + useEffect:");
drive(useStatusSync, "useSyncExternalStore:");`,
            },
          ],
        },
      ],
    },
    {
      id: "tearing",
      heading: "Tearing",
      body: [
        "The second reason, and the one the hook is named for.",
        "Concurrent rendering means React can start rendering a tree, pause, and resume. If an external value changes during that pause, components rendered before the pause hold the old value and components rendered after hold the new one — and both get committed together. Two parts of one screen showing different values for the same thing. That is **tearing**.",
        "It cannot happen with React state, because React controls when state updates become visible to a render. It absolutely can happen with a value in a module-level variable that anything may change at any time.",
        "`useSyncExternalStore` prevents it: when React notices the snapshot changed mid-render, it throws the render away and restarts it with the new value. That is what the `Sync` in the name means, and it is why the hook cannot be replaced by a carefully-written effect.",
      ],
      pitfalls: [
        {
          title: "This is why store libraries use it",
          body: "Zustand, Redux and Jotai all call `useSyncExternalStore` underneath. Before it existed, every store library had its own subscription code, and React 18's concurrent rendering broke all of them in the same way. The hook was added to give them one correct implementation — which is the honest framing of who it is for: **you use it to build a hook, and then use the hook.**",
        },
      ],
    },
    {
      id: "server",
      heading: "The third argument",
      body: [
        "`getServerSnapshot` is called during server rendering and during hydration. It is **required** if the component is ever server-rendered: without it, React throws during the server render rather than guessing.",
        "The reason it cannot fall back to `getSnapshot` is that most external sources do not exist on a server. `window.matchMedia`, `navigator.onLine`, `localStorage` — reading any of them on the server throws.",
        "It must return the same value the client's first render will produce, or you get a hydration mismatch. In practice that means returning a **neutral default** and letting the real value arrive after hydration.",
      ],
      examples: [
        {
          id: "browser-source",
          title: "A browser value, wrapped safely",
          lang: "jsx",
          code: `/* Module scope, so their identity never changes and React never
   resubscribes. A subscribe defined inside the hook would be a new
   function on every render. */
const subscribe = (onChange) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getSnapshot = () => navigator.onLine;

/* On the server there is no navigator. Assume online: it is the state the
   page is almost certainly in, and the client corrects it immediately after
   hydration if not. */
const getServerSnapshot = () => true;

export function useOnline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}`,
          explanation:
            "Both functions are module-level constants for the reason module 9 gave: a new `subscribe` identity makes React unsubscribe and resubscribe on every render, and a new `getSnapshot` that returns a new object makes it loop. Defining them outside the hook removes both possibilities structurally.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Module scope, so their identity never changes and React never
   resubscribes. A subscribe defined inside the hook would be a new
   function on every render. */
const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getSnapshot = () => navigator.onLine;

/* On the server there is no navigator. Assume online: it is the state the
   page is almost certainly in, and the client corrects it immediately after
   hydration if not. */
const getServerSnapshot = () => true;

export function useOnline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`getSnapshot` must return a cached value, never a new object",
          body: "`() => ({ width: window.innerWidth })` builds a new object every call, so `Object.is` always says it changed, so React re-renders, calls it again, and loops — React detects this and throws \"The result of getSnapshot should be cached\". Return a primitive, or have the store hold one object and return it. This is the identity rule from module 9 in its fourth costume.",
        },
        {
          title: "It must also be cheap",
          body: "React calls it on every render and after every notification. Anything that reads layout — `getBoundingClientRect`, `offsetWidth` — forces the browser to recompute layout each time. Keep the value in the store and have the source update it, rather than computing it in the getter.",
        },
      ],
    },
    {
      id: "when",
      heading: "When you actually need it",
      body: [
        "**When the value lives outside React and changes on its own.** A browser API (`navigator.onLine`, `matchMedia`, `document.visibilityState`), a WebSocket connection state, a non-React library holding state, a value in another frame.",
        "**When you are writing a store.** Which mostly means: when you are writing a store library.",
        "**Not for data fetching.** A snapshot must be synchronous. `use` and Suspense are the tools for a promise — module 11.",
        "**Not for React state.** If React owns the value, `useState` already gives you all of these guarantees.",
        "For most people the honest answer is that they will use it two or three times in a career, wrapped in a hook, and get its benefits every day through whichever store library they use.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does useSyncExternalStore do?",
      answer:
        "Subscribes a component to a value that lives outside React. It takes `subscribe`, which registers a listener and returns the unsubscriber, and `getSnapshot`, which reads the current value — React calls the snapshot during render and after every notification, and re-renders when it differs by `Object.is`. Nothing is copied into state; React reads through to the source every time.",
    },
    {
      question: "Why not useState plus useEffect?",
      answer:
        "Two reasons. There is a window between the render that reads the value and the effect that subscribes, and a change landing in it is never observed by anyone — leaving a permanently stale screen with no error. And under concurrent rendering an external value can change mid-render, so components rendered before and after the pause commit different values for the same thing. `useSyncExternalStore` re-checks the snapshot right after subscribing to close the first, and restarts the render to prevent the second.",
    },
    {
      question: "What is tearing?",
      answer:
        "Two parts of one committed screen showing different values for the same source, because the value changed while React was part-way through an interruptible render. It cannot happen with React state, since React controls when a state update becomes visible to a render, but it can with a module-level value anything may change. `useSyncExternalStore` detects the mid-render change and restarts the render — which is what the `Sync` in the name refers to.",
    },
    {
      question: "What is getServerSnapshot for?",
      answer:
        "Server rendering and hydration. It is required for any component that is server-rendered — React throws rather than guessing — because most external sources do not exist there: reading `navigator`, `matchMedia` or `localStorage` on a server throws. It should return a neutral default that matches what the client's first render will produce, and the real value arrives after hydration.",
    },
  ],
  takeaways: [
    "`subscribe` registers a listener and returns the unsubscriber; `getSnapshot` reads the value",
    "Nothing is copied into state — React reads through to the source",
    "An effect-based subscription misses anything that changes between render and effect, permanently",
    "Tearing: two parts of one screen showing different values, possible only for non-React state",
    "React restarts the render when it sees the snapshot change mid-render",
    "`getServerSnapshot` is required for a server-rendered component, and should be a neutral default",
    "Define `subscribe` and `getSnapshot` at module scope so their identity never changes",
    "`getSnapshot` must return a cached value and be cheap — a new object every call is a loop React throws on",
    "You use it to build a hook; most people meet it through a store library",
  ],
  status: "available",
};
