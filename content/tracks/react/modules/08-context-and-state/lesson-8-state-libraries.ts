import type { Lesson } from "@/content/types";

export const stateLibrariesLesson: Lesson = {
  id: "react-state-libraries",
  slug: "zustand-redux-and-jotai",
  moduleSlug: "context-and-state-architecture",
  title: "Zustand, Redux Toolkit and Jotai",
  summary:
    "Build the fourteen lines every store library is underneath, watch a selector skip a render that context could not, then choose between the three by what they actually differ on.",
  estimatedMinutes: 30,
  objectives: [
    "Write a store with subscribe, getSnapshot and a selector",
    "Demonstrate a selector skipping a render context cannot skip",
    "Say what each of the three libraries adds to that base",
    "Choose one for a given situation and defend it",
    "Say why most applications need less of one than they think",
  ],
  sections: [
    {
      id: "the-base",
      heading: "The fourteen lines underneath all of them",
      visual: {
        id: "store-vs-context-visual",
        kind: "react-arch",
        algorithm: "context-vs-store",
        title: "Who gets told when one field changes",
      },
      body: [
        "A store is a value, a set of listeners, and a way to read part of it. `useSyncExternalStore` is the React hook for subscribing to exactly that shape — module 10 covers the hook properly; here it is the thing that makes the store a store.",
        "Build it once and the libraries stop being magic.",
      ],
      examples: [
        {
          id: "hand-built-store",
          title: "A store with selectors, and what that buys",
          lang: "tsx",
          code: `import { useSyncExternalStore, act } from "react";
import { createRoot } from "react-dom/client";

/* A store, in fourteen lines. This is what every store library is
   underneath: a value, a set of listeners, and a way to select part of it. */
function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(update: (previous: T) => T) {
      state = update(state);
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const cart = createStore({ items: 0, coupon: "" });

/* The selector is the whole point: a component subscribes to a slice, and
   React skips it when that slice is unchanged. Context cannot do this. */
function useCart<S>(select: (s: { items: number; coupon: string }) => S): S {
  return useSyncExternalStore(cart.subscribe, () => select(cart.get()));
}

const renders: Record<string, number> = {};
const count = (n: string) => { renders[n] = (renders[n] ?? 0) + 1; };

function ItemCount() { count("ItemCount"); return <output>{useCart((s) => s.items)}</output>; }
function CouponTag() { count("CouponTag"); return <em>{useCart((s) => s.coupon)}</em>; }
function App() { return <><ItemCount /><CouponTag /></>; }

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
for (const k of Object.keys(renders)) renders[k] = 0;

console.log("no provider wraps these components, and nothing was drilled.");
act(() => { cart.set((s) => ({ ...s, items: s.items + 1 })); });
console.log("after changing items: ", JSON.stringify(renders), container.innerHTML);
for (const k of Object.keys(renders)) renders[k] = 0;
act(() => { cart.set((s) => ({ ...s, coupon: "SAVE10" })); });
console.log("after changing coupon:", JSON.stringify(renders), container.innerHTML);`,
          output: `no provider wraps these components, and nothing was drilled.
after changing items:  {"ItemCount":1,"CouponTag":0} <output>1</output><em></em>
after changing coupon: {"ItemCount":0,"CouponTag":1} <output>1</output><em>SAVE10</em>`,
          explanation:
            "Two things context could not do, in one run. **The selector**: changing `items` re-rendered only the component that reads `items`, and changing `coupon` only the one that reads `coupon`. And **no provider**: the store is a module-level object, so components subscribe from anywhere and nothing wraps the tree.",
        },
      ],
      pitfalls: [
        {
          title: "A selector that returns a new object breaks it",
          body: "`useCart(s => ({ items: s.items }))` builds a new object on every read, so the `Object.is` check that decides whether to re-render always fails and the component re-renders on every store change. Return a primitive, or the same object reference, or use a library's equality-function option. This is the same identity problem as memo and dependency arrays, in its third costume.",
        },
        {
          title: "A module-level store is one store per page load",
          body: "That is right for a browser app and wrong on a server, where one process serves many users and a module-level value would be shared between them. Frameworks that render on the server need the store created per request — which is why Zustand still offers a provider, and why Redux always had one.",
        },
      ],
    },
    {
      id: "zustand",
      heading: "Zustand",
      body: [
        "The above, finished. A `create` function that builds the store and returns the hook, selectors built in, no provider required, and roughly 1 KB.",
        "It is the default answer for client state in a modern React app that needs a store at all.",
      ],
      examples: [
        {
          id: "zustand-store",
          title: "The same cart",
          lang: "tsx",
          code: `import { create } from "zustand";

/* State and the functions that change it, in one object. \`set\` merges at
   the top level, so a partial object is enough. */
export const useCart = create<{
  items: Item[];
  coupon: string | null;
  add: (item: Item) => void;
  clear: () => void;
}>((set) => ({
  items: [],
  coupon: null,
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  clear: () => set({ items: [], coupon: null }),
}));

/* Subscribes to one number. Adding a coupon does not re-render this. */
function CartBadge() {
  const count = useCart((s) => s.items.length);
  return <span>{count}</span>;
}

/* Actions are stable, so this component never re-renders from the store. */
function AddButton({ item }: { item: Item }) {
  const add = useCart((s) => s.add);
  return <button type="button" onClick={() => add(item)}>Add</button>;
}

// Usable outside React too, which context cannot do:
socket.on("cart:updated", (items) => useCart.setState({ items }));`,
          explanation:
            "The last line is the second reason to reach for a store. `useCart.setState` works from a socket handler, a router guard, a test setup, or any non-React code — the store is an ordinary object that happens to have a React hook attached, rather than something that only exists inside the tree.",
        },
      ],
      pitfalls: [
        {
          title: "Its one sharp edge is the object selector",
          body: "`useCart(s => ({ items: s.items, add: s.add }))` re-renders on every store change, for the reason above. Either take one value per call — `const items = useCart(s => s.items)` and `const add = useCart(s => s.add)` — or use `useShallow` from `zustand/shallow`. This accounts for most \"Zustand re-renders too much\" reports.",
        },
      ],
    },
    {
      id: "redux",
      heading: "Redux Toolkit",
      body: [
        "Redux is not what it was in 2017. **Redux Toolkit is the only correct way to use Redux now**, and it removed the boilerplate the reputation is based on: `createSlice` generates action creators and types from a reducer, and Immer lets you write `state.items.push(item)` inside it while still producing a new object.",
        "What it buys over Zustand is a strict, uniform architecture and the best devtools in front-end development — a full action log with time-travel, so \"what did the user do before this broke?\" is answerable from a bug report.",
        "What it costs is size, more concepts — slices, the store, `useSelector`, `useDispatch` — and enough ceremony that a small app feels over-built. The strictness is the point on a large team and the cost on a small one.",
        "It is the right choice for a large application with many contributors, for a team that already knows it, and for anything where the action log is genuinely how you debug. It is the wrong choice for a new small app, which is what \"Redux is overkill\" always meant.",
      ],
      examples: [
        {
          id: "rtk-slice",
          title: "A slice",
          lang: "typescript",
          code: `import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as Item[], coupon: null as string | null },
  reducers: {
    // Immer: this *looks* like mutation and produces a new object.
    // Writing it this way outside a slice would be a real bug.
    added(state, action: PayloadAction<Item>) {
      state.items.push(action.payload);
    },
    cleared(state) {
      state.items = [];
      state.coupon = null;
    },
  },
});

// Action creators and their types, generated from the reducer names.
export const { added, cleared } = cartSlice.actions;
export default cartSlice.reducer;`,
          explanation:
            "`state.items.push` is safe here and only here. Immer hands the reducer a draft proxy, records what you did to it, and produces a new object from the recording — so the rule from lesson 4 about never mutating still holds; Immer is just doing the copying for you.",
        },
      ],
    },
    {
      id: "jotai",
      heading: "Jotai",
      body: [
        "A different model rather than a smaller one. Instead of one store you select from, state is **atoms** — many small independent pieces, composed by deriving atoms from other atoms.",
        "`const countAtom = atom(0)` and `const doubledAtom = atom(get => get(countAtom) * 2)`. A component using `useAtom(doubledAtom)` re-renders when `countAtom` changes and not otherwise, and the dependency graph is worked out for you rather than declared in a selector.",
        "It suits state that is naturally fragmented — a canvas of independent objects, a form with hundreds of fields, a spreadsheet — where a single store object would be one enormous thing everybody selects a sliver of. It is less natural when the state genuinely is one coherent object with rules, which is where a reducer's single transition function earns its keep.",
        "It is the least common of the three, which matters: fewer people on your team will know it, and there are fewer answers when something goes wrong.",
      ],
    },
    {
      id: "choosing",
      heading: "Choosing",
      body: [
        "**Nothing.** Start here, and stay if you can. Data cache for server state, URL for URL state, `useState` and context for the rest. Most applications never need more, and adding a store early puts state in it that should have stayed local.",
        "**Zustand** when you need selectors, or access from outside React, and you want the smallest thing that provides them. The default answer.",
        "**Redux Toolkit** when the team is large, the state is genuinely complex and shared, the action log is how you debug, or the codebase already uses it.",
        "**Jotai** when the state is naturally many small independent pieces rather than one object.",
        "One thing that is not a differentiator: none of them should be holding your server data. Whichever you pick, pair it with a data cache and watch how little is left — for most applications the honest answer is a theme, a signed-in user, and a cart.",
      ],
      pitfalls: [
        {
          title: "\"Which state manager?\" is the wrong first question",
          body: "It is asked before the four kinds of state have been separated, so it gets answered with a tool that then holds all four. Separate them first — server data to a cache, URL state to the URL, ephemeral state to components — and the remaining question is usually small enough to answer with `useState` and one context. The library decision gets easier the later you make it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a store give you that context does not?",
      answer:
        "Selectors and existence outside the tree. A store lets a component subscribe to a slice, so changing one field re-renders only the components reading that field — context re-renders every consumer for any change and has no way to express \"I only care about this part\". And a store is an ordinary object, so a socket handler, a router guard or a test can read and write it without going through a component.",
    },
    {
      question: "What is a store, underneath?",
      answer:
        "A value, a set of listeners, and a notify-on-change setter — about fourteen lines. React subscribes to it with `useSyncExternalStore`, which takes the subscribe function and a snapshot getter, and re-renders when the snapshot changes by `Object.is`. Every library on top of that adds ergonomics: Zustand adds `create` and a hook, Redux Toolkit adds slices and devtools, Jotai replaces the single object with a graph of atoms.",
    },
    {
      question: "Zustand, Redux Toolkit or Jotai?",
      answer:
        "Nothing, first — most applications need a data cache, the URL and `useState`, and adding a store early attracts state that should have stayed local. Zustand when you need selectors or access from outside React and want the smallest thing that provides them. Redux Toolkit for a large team, genuinely complex shared state, or when the time-travel action log is how you debug — and it is not the Redux of 2017, since `createSlice` and Immer removed the boilerplate. Jotai when state is naturally many small independent pieces.",
    },
    {
      question: "Why does a Zustand selector returning an object cause extra renders?",
      answer:
        "Because the subscription re-renders when the selected value changes by `Object.is`, and a selector that builds a new object returns a new reference every time, so the check always fails. Select one value per call, or use a shallow equality helper. It is the same identity problem as `memo` with an inline prop and an unstable dependency array — the third place the same rule shows up.",
    },
  ],
  takeaways: [
    "A store is a value, a listener set and a notifier — `useSyncExternalStore` connects it to React",
    "Selectors are the feature context lacks: subscribe to a slice, re-render only for that slice",
    "A store also exists outside the tree, so non-React code can read and write it",
    "A selector returning a fresh object re-renders every time — the identity rule again",
    "Zustand: the smallest thing with selectors and no provider; the default answer",
    "Redux Toolkit: strict architecture and time-travel devtools; `createSlice` and Immer removed the boilerplate",
    "Jotai: many small atoms with a derived graph, for naturally fragmented state",
    "A module-level store is one per page load — fine in a browser, wrong on a server",
    "Separate the four kinds of state before choosing, and the choice usually shrinks to nothing",
  ],
  status: "available",
};
