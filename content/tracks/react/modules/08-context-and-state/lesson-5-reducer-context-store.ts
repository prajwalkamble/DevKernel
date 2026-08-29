import type { Lesson } from "@/content/types";

export const reducerContextStoreLesson: Lesson = {
  id: "react-reducer-context-store",
  slug: "a-small-store-with-reducer-and-context",
  moduleSlug: "context-and-state-architecture",
  title: "A Small Store, From a Reducer and Context",
  summary:
    "Twenty lines that cover what most applications need from a state manager. Two contexts, two hooks that refuse to work without a provider, and the file layout that keeps it from leaking into the rest of the codebase.",
  estimatedMinutes: 30,
  objectives: [
    "Combine a reducer and context into a store with no library",
    "Write a hook that throws rather than returning a plausible default",
    "Split state and dispatch so that writers do not re-render",
    "Lay the files out so the context objects never leave the folder",
    "Say what this pattern still cannot do",
  ],
  sections: [
    {
      id: "the-combination",
      heading: "The combination",
      body: [
        "Two things from earlier modules, put together. A reducer holds all the transitions in one pure function; context carries the result to anything under a provider without drilling.",
        "The result covers a surprising amount of what teams install a library for. Build it once before deciding you need more.",
      ],
      examples: [
        {
          id: "cart-store",
          title: "The whole store",
          lang: "jsx",
          code: `import { createContext, useContext, useReducer, act } from "react";
import { createRoot } from "react-dom/client";

function cartReducer(state, action) {
  switch (action.type) {
    case "added": return { items: [...state.items, action.sku] };
    case "cleared": return { items: [] };
  }
}

/* Two contexts, and no default that could stand in for a real one. */
const CartState = createContext(null);
const CartDispatch = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <CartDispatch.Provider value={dispatch}>
      <CartState.Provider value={state}>{children}</CartState.Provider>
    </CartDispatch.Provider>
  );
}

/* One hook per context, each refusing to work without a provider. */
export function useCart() {
  const value = useContext(CartState);
  if (value === null) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
export function useCartDispatch() {
  const value = useContext(CartDispatch);
  if (value === null) throw new Error("useCartDispatch must be used inside <CartProvider>");
  return value;
}

function Total() { return <output>{useCart().items.length}</output>; }
function AddButton() {
  const dispatch = useCartDispatch();
  return <button type="button" id="add" onClick={() => dispatch({ type: "added", sku: "pen" })}>add</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => {
  createRoot(container).render(<CartProvider><Total /><AddButton /></CartProvider>);
});
act(() => { container.querySelector("#add").click(); });
act(() => { container.querySelector("#add").click(); });
console.log("after two adds:", container.querySelector("output").textContent);

/* What happens with no provider above. */
const bare = document.createElement("div");
document.body.appendChild(bare);
try {
  act(() => { createRoot(bare).render(<Total />); });
} catch (error) {
  console.log("rendered outside the provider:", (error).message);
}`,
          output: `after two adds: 2
rendered outside the provider: useCart must be used inside <CartProvider>`,
          explanation:
            "No library, no boilerplate directory, and the components see none of it: `Total` reads a value and `AddButton` sends an action. `cartReducer` is still the plain function from the last lesson, testable on its own.",
          alternates: [
            {
              lang: "tsx",
              code: `import { createContext, useContext, useReducer, act } from "react";
import type { ReactNode, Dispatch } from "react";
import { createRoot } from "react-dom/client";

type State = { items: string[] };
type Action = { type: "added"; sku: string } | { type: "cleared" };

function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case "added": return { items: [...state.items, action.sku] };
    case "cleared": return { items: [] };
  }
}

/* Two contexts, and no default that could stand in for a real one. */
const CartState = createContext<State | null>(null);
const CartDispatch = createContext<Dispatch<Action> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <CartDispatch.Provider value={dispatch}>
      <CartState.Provider value={state}>{children}</CartState.Provider>
    </CartDispatch.Provider>
  );
}

/* One hook per context, each refusing to work without a provider. */
export function useCart(): State {
  const value = useContext(CartState);
  if (value === null) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
export function useCartDispatch(): Dispatch<Action> {
  const value = useContext(CartDispatch);
  if (value === null) throw new Error("useCartDispatch must be used inside <CartProvider>");
  return value;
}

function Total() { return <output>{useCart().items.length}</output>; }
function AddButton() {
  const dispatch = useCartDispatch();
  return <button type="button" id="add" onClick={() => dispatch({ type: "added", sku: "pen" })}>add</button>;
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => {
  createRoot(container).render(<CartProvider><Total /><AddButton /></CartProvider>);
});
act(() => { container.querySelector<HTMLButtonElement>("#add")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#add")!.click(); });
console.log("after two adds:", container.querySelector("output")!.textContent);

/* What happens with no provider above. */
const bare = document.createElement("div");
document.body.appendChild(bare);
try {
  act(() => { createRoot(bare).render(<Total />); });
} catch (error) {
  console.log("rendered outside the provider:", (error as Error).message);
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-guard",
      heading: "The hook that throws",
      body: [
        "`createContext(null)` and a hook that throws is not defensive programming. It is the difference between a bug that names itself and a bug that does not.",
        "Give the context a plausible default — `createContext({ items: [] })` — and a component rendered outside the provider gets an empty cart. Nothing errors. The screen shows zero items and stays that way, and you spend an afternoon on it before noticing which subtree the component is in.",
        "With the guard, the same mistake is an error message that names the hook and the provider. The `null` default exists only so that \"no provider above me\" has a value, and the hook converts it into the sentence you needed.",
        "The types work out too: the hook's return type is `State`, not `State | null`, so every caller is spared a null check for a case that cannot reach them.",
      ],
      pitfalls: [
        {
          title: "Export the hooks, never the contexts",
          body: "If `CartState` is exported, some component will eventually `useContext(CartState)` directly and get `State | null` with no guard. Keep both context objects module-private and export only `CartProvider`, `useCart` and `useCartDispatch`. That also leaves you free to change the internals — split a context, swap in a store — without touching a caller.",
        },
      ],
    },
    {
      id: "two-contexts",
      heading: "Why two contexts rather than one",
      body: [
        "One context holding `[state, dispatch]` would work, and it would re-render every component that only dispatches.",
        "The reason is the property from lesson 4: **dispatch is stable forever.** So a context whose value is only `dispatch` has a value that never changes, and rule 2 from lesson 3 never fires for it. A component that reads only `useCartDispatch` re-renders when its parent does and never because the cart changed.",
        "That is worth having, and it is free. Every button, every menu item, every form that only *writes* to the store drops out of the re-render set entirely.",
        "The next lesson measures it, and generalises it to contexts that are not about dispatch.",
      ],
      pitfalls: [
        {
          title: "The nesting order does not matter, but the split does",
          body: "Whether `CartDispatch` wraps `CartState` or the other way round changes nothing — a consumer finds the nearest provider of the context it names, and neither is inside the other's value. What matters is that they are two contexts, so a component can read one without subscribing to the other.",
        },
      ],
    },
    {
      id: "files",
      heading: "Where the files go",
      body: [
        "Everything above is one feature's state, so it belongs in that feature's folder — module 3's rule applied to state.",
        "Step the listing. Each file appears at the point the previous one stopped being enough, which is also the order to write them in.",
      ],
      examples: [
        {
          id: "providers-file",
          title: "app/providers.jsx — the staircase, in one place",
          lang: "jsx",
          code: `/* Without this file, App.tsx grows a provider staircase and every new
   feature makes it one level deeper. With it, App.tsx has one wrapper and
   the nesting order is documented in the file whose job that is. */
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {/* Cart needs the signed-in user, so it goes inside Auth.
              The order is a real dependency, and this is where it is stated. */}
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// App.tsx
export default function App() {
  return <Providers><Router /></Providers>;
}`,
          explanation:
            "The comment about ordering is the point of the file. Provider nesting encodes real dependencies — a provider can only read a context that is above it — and when that ordering lives inline in `App.tsx` amongst routing and layout, somebody eventually reorders it and finds out at runtime.",
          alternates: [
            {
              lang: "tsx",
              title: "app/providers.tsx — the staircase, in one place",
              code: `/* Without this file, App.tsx grows a provider staircase and every new
   feature makes it one level deeper. With it, App.tsx has one wrapper and
   the nesting order is documented in the file whose job that is. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {/* Cart needs the signed-in user, so it goes inside Auth.
              The order is a real dependency, and this is where it is stated. */}
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// App.tsx
export default function App() {
  return <Providers><Router /></Providers>;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Not every provider belongs at the root",
          body: "A cart provider wrapping the entire application means the cart's state exists on the login screen. Mount a provider at the narrowest point that covers its consumers — often a route, not the root. Narrower providers also mean the state is discarded when the user leaves that section, which is usually what you want and is free.",
        },
        {
          title: "There is no top-level `store/` directory here",
          body: "The temptation is a folder holding every feature's state. Resist it: it makes every feature depend on one directory, and it separates a feature's state from the components that use it — the exact split module 3 spent a lesson undoing. State lives with its feature; only genuinely app-wide state lives outside one.",
        },
      ],
    },
    {
      id: "limits",
      heading: "What it still cannot do",
      body: [
        "This pattern is genuinely good and it has three hard limits. Knowing them is how you tell \"I should reach for a library\" from \"I should reach for a library because everybody does\".",
        "**No selectors.** Every component reading `useCart()` re-renders when any part of the cart changes. With a large state object and many readers, that is the whole re-render problem back again, and splitting contexts only helps down to the granularity you are willing to declare in advance.",
        "**It only exists inside the tree.** Nothing outside React can read or write it — an event handler in a non-React widget, a WebSocket message handler, a router guard. Getting a value out means routing it through a component.",
        "**No middleware, no devtools, no time travel.** Logging every action, persisting to `localStorage`, or replaying a session means writing each of those yourself.",
        "If none of those bite, you do not need a library, and installing one is a dependency and a concept for nothing. Lesson 8 covers the point at which they do.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you build a store without a library?",
      answer:
        "A reducer for the transitions and two contexts for delivery — one for the state, one for the dispatch — with a provider that calls `useReducer` and publishes both, and one hook per context. The hooks throw when there is no provider above, so a component rendered in the wrong subtree names its own bug instead of silently receiving an empty default. Only the provider and the hooks are exported; the context objects stay module-private so the internals can change.",
    },
    {
      question: "Why two contexts instead of one holding [state, dispatch]?",
      answer:
        "Because `dispatch` is stable for the life of the component, so a context whose value is only dispatch never changes value and never triggers a consumer re-render. Every component that only writes — buttons, menu items, forms — drops out of the re-render set entirely. A single context holding both would re-render all of them on every state change, for a value none of them read.",
    },
    {
      question: "Why should a context hook throw instead of returning a default?",
      answer:
        "A plausible default turns \"rendered outside the provider\" into a silent wrong value — an empty cart, a default theme — that looks like a data problem and is a tree problem. The `null` default plus a throwing hook makes the mistake name itself, and it also lets the hook's return type be the real type rather than `T | null`, so every caller is spared a null check for a case that cannot reach it.",
    },
    {
      question: "When does this stop being enough?",
      answer:
        "Three limits. No selectors, so every reader re-renders on any change to the state object. It only exists inside the React tree, so nothing outside — a socket handler, a router guard, a non-React widget — can read or write it. And no middleware or devtools, so logging, persistence and time-travel debugging are all yours to write. Until one of those bites, a library is a dependency for nothing.",
    },
  ],
  takeaways: [
    "A reducer plus two contexts is a store, in about twenty lines and no dependencies",
    "`createContext(null)` plus a throwing hook turns a wrong subtree into a named error",
    "The guard also gives the hook a non-nullable return type, sparing every caller a check",
    "Export the provider and the hooks; keep the context objects module-private",
    "Two contexts because `dispatch` is stable — write-only components then never re-render",
    "State lives in its feature's folder; there is no top-level `store/`",
    "One `providers.tsx` holds the nesting, because the order encodes real dependencies",
    "Mount a provider at the narrowest point that covers its consumers, not always the root",
    "Limits: no selectors, invisible outside the tree, no middleware or devtools",
  ],
  status: "available",
};
