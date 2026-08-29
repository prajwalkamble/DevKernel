import type { Lesson } from "@/content/types";

export const useContextLesson: Lesson = {
  id: "react-usecontext",
  slug: "usecontext",
  moduleSlug: "core-hooks",
  title: "`useContext`: Reading Shared Data Without Prop Drilling",
  summary:
    "Context lets a component read a value from an ancestor without every level in between passing it along. What it is not is a state manager — and the difference matters the moment the value starts changing.",
  estimatedMinutes: 30,
  objectives: [
    "Create, provide and consume a context",
    "Say exactly which components re-render when a context value changes",
    "Give a context a sensible default, or refuse to have one",
    "Recognise the new-object-every-render mistake in a provider",
    "Decide when prop drilling is the better answer",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem it solves",
      body: [
        "A value needed deep in the tree has to be passed through every component in between, none of which uses it. Five levels of `theme` prop so a button can be dark. That is prop drilling, and it is tedious rather than incorrect — the code works, it is just noisy, and every intermediate component now has a prop in its signature that has nothing to do with it.",
        "Context removes the intermediate steps. An ancestor provides a value, any descendant reads it directly, and nothing in between mentions it.",
        "It is worth saying plainly that prop drilling is fine at one or two levels. The cure has costs — a provider, an import, and a re-render story — that a single extra prop does not.",
      ],
    },
    {
      id: "three-steps",
      heading: "Create, provide, consume",
      body: [
        "**Create:** `const ThemeContext = createContext(\"light\")`. The argument is the default, used only when a component reads the context with no provider above it.",
        "**Provide:** `<ThemeContext value={theme}>`. In React 19 the context object is itself the provider; older code writes `<ThemeContext.Provider value={theme}>`, which still works.",
        "**Consume:** `const theme = useContext(ThemeContext)`. React walks up from the component to the nearest provider and returns its value.",
        "The lookup is by **position in the tree**, not by module scope. Two providers of the same context in different branches give different values to their own descendants, and the nearest one wins.",
      ],
      examples: [
        {
          id: "context-basics",
          title: "Nearest provider wins",
          lang: "jsx",
          code: `import { createContext, useContext } from "react";

const ThemeContext = createContext("light");

function Button({ label }) {
  const theme = useContext(ThemeContext);
  return <button type="button" className={theme}>{label}</button>;
}

// No provider between App and this one, so it reads the outer value.
function Toolbar() {
  return <div><Button label="in toolbar" /></div>;
}

function App() {
  return (
    <ThemeContext value="dark">
      <Toolbar />
      {/* A nearer provider overrides it for its own subtree. */}
      <ThemeContext value="high-contrast">
        <Button label="in override" />
      </ThemeContext>
    </ThemeContext>
  );
}`,
          output: `<div><button type="button" class="dark">in toolbar</button></div><button type="button" class="high-contrast">in override</button>`,
          explanation:
            "`Toolbar` passes no props and does not mention the theme, and the button inside it is still dark. The second button sits under a nearer provider and gets that value instead. Nothing about this is global — it is scoped to a subtree, which is what makes context safe to use more than once.",
          alternates: [
            {
              lang: "tsx",
              code: `import { createContext, useContext } from "react";

type Theme = "light" | "dark" | "high-contrast";

// The default value is what gives the context its type, so a union here means
// a misspelled theme is caught at the provider rather than in a class name.
const ThemeContext = createContext<Theme>("light");

function Button({ label }: { label: string }) {
  const theme = useContext(ThemeContext);
  return <button type="button" className={theme}>{label}</button>;
}

// No provider between App and this one, so it reads the outer value.
function Toolbar() {
  return <div><Button label="in toolbar" /></div>;
}

function App() {
  return (
    <ThemeContext value="dark">
      <Toolbar />
      {/* A nearer provider overrides it for its own subtree. */}
      <ThemeContext value="high-contrast">
        <Button label="in override" />
      </ThemeContext>
    </ThemeContext>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A default of `undefined` is better than a plausible-looking one",
          body: "`createContext(\"light\")` means a component rendered outside any provider silently gets `\"light\"` instead of failing — so a forgotten provider looks like a working component with the wrong theme. Many codebases use `createContext(undefined)` and a custom hook that throws: `if (value === undefined) throw new Error(\"useTheme must be used within ThemeProvider\")`. The error names the mistake at the point of the mistake, which the plausible default never does.",
        },
      ],
    },
    {
      id: "re-renders",
      heading: "What re-renders when the value changes",
      body: [
        "**Every component that reads the context, wherever it is in the subtree.** That is the part context does well: a consumer twenty levels down updates without anything in between being involved.",
        "**And that is all it does.** Context does not make updates cheaper or more targeted than props — it makes them *reach further*. A consumer cannot subscribe to one field of the value; it re-renders when the value changes, whatever changed in it.",
        "So a single context holding a large object is a broadcast: every consumer re-renders whenever any part of it changes. Splitting one context into several — one for the value, one for the setter, one per independent concern — is the standard remedy, and module 8 does it properly.",
      ],
      examples: [
        {
          id: "context-updates",
          title: "Who re-renders, and who does not",
          lang: "jsx",
          code: `import { createContext, useContext, useState, act } from "react";
import { createRoot } from "react-dom/client";

const CountContext = createContext(0);
const counts = { reader: 0, bystander: 0, middle: 0 };

function Reader() {
  counts.reader++;
  const value = useContext(CountContext);
  return <span id="v">{value}</span>;
}

function Bystander() {
  counts.bystander++;
  return <span>-</span>;
}

// Passes children through and reads nothing.
function Middle({ children }) {
  counts.middle++;
  return <div>{children}</div>;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <CountContext value={count}>
      <Middle><Reader /></Middle>
      <Middle><Bystander /></Middle>
      <button id="b" onClick={() => setCount((c) => c + 1)}>bump</button>
    </CountContext>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App />); });
console.log("mounted: ", JSON.stringify(counts));
act(() => { container.querySelector("#b").click(); });
console.log("after bump:", JSON.stringify(counts));`,
          output: `mounted:  {"reader":1,"bystander":1,"middle":2}
after bump: {"reader":2,"bystander":2,"middle":4}`,
          explanation:
            "Everything re-rendered, including `Bystander`, which reads nothing. That is not context's doing — the state lives in `App`, so `App` re-rendered and re-created its whole subtree, exactly as module 4 described. Context did not cause those re-renders and does not prevent them. The way to stop a bystander re-rendering is to pass it as `children` from a component that does not re-render, or to memoise it; module 9 covers both.",
          alternates: [
            {
              lang: "tsx",
              code: `import { createContext, useContext, useState, act } from "react";
import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";

const CountContext = createContext(0);
const counts = { reader: 0, bystander: 0, middle: 0 };

function Reader() {
  counts.reader++;
  const value = useContext(CountContext);
  return <span id="v">{value}</span>;
}

function Bystander() {
  counts.bystander++;
  return <span>-</span>;
}

// Passes children through and reads nothing.
function Middle({ children }: { children: ReactNode }) {
  counts.middle++;
  return <div>{children}</div>;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <CountContext value={count}>
      <Middle><Reader /></Middle>
      <Middle><Bystander /></Middle>
      <button id="b" onClick={() => setCount((c) => c + 1)}>bump</button>
    </CountContext>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

act(() => { root.render(<App />); });
console.log("mounted: ", JSON.stringify(counts));
act(() => { container.querySelector<HTMLButtonElement>("#b")!.click(); });
console.log("after bump:", JSON.stringify(counts));`,
            },
          ],
        },
      ],
    },
    {
      id: "provider-value",
      heading: "The mistake every provider makes once",
      body: [
        "`<AuthContext value={{ user, login, logout }}>` builds a **new object on every render of the provider**. Context consumers compare by reference, so every consumer re-renders every time the provider renders — even when `user`, `login` and `logout` are all unchanged.",
        "The fix is `useMemo` around the value, with the pieces as dependencies, and `useCallback` on the functions so they are stable in turn.",
        "This is the same reference-identity rule as the dependency array two lessons ago, and as `React.memo`. Three features, one comparison.",
      ],
    },
    {
      id: "not-a-store",
      heading: "Why context is not a state manager",
      body: [
        "Context is a **transport**. It moves a value down the tree without intermediate props. It holds nothing, updates nothing, and has no opinion about where the value came from — the state still lives in some component's `useState` or `useReducer`.",
        "What a state manager adds is selective subscription: a consumer says which slice it cares about and re-renders only when that slice changes. Context cannot do this, and that is the gap Zustand, Redux Toolkit and Jotai fill.",
        "The practical rule: context suits values that are read widely and change **rarely** — a theme, the current user, a locale, a router. It suits a value changing on every keystroke badly, because every consumer in the subtree renders on every keystroke.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does React decide which value `useContext` returns?",
      answer:
        "By walking up the tree from the calling component to the nearest matching provider and returning its value — position in the tree, not module scope. If there is no provider above it, the default passed to `createContext` is used. Two providers of the same context in different branches give different values to their own descendants, which is what makes context safe to use more than once in an app.",
    },
    {
      question: "Does context help with performance?",
      answer:
        "No — it helps with plumbing. It makes an update reach a distant consumer without intermediate props, but every consumer re-renders when the value changes, and none can subscribe to just one field of it. A single context holding a large object broadcasts to everything reading it. Splitting into several contexts limits the blast radius; genuinely selective subscription is what a state library adds.",
    },
    {
      question: "Why does an inline object as a provider value cause extra re-renders?",
      answer:
        "Because `value={{ user, login }}` allocates a new object on every render of the provider, and consumers compare the value by reference — so all of them re-render even when nothing inside it changed. Wrap the value in `useMemo` and the functions in `useCallback`. It is the same reference-identity rule that governs dependency arrays and `React.memo`.",
    },
  ],
  takeaways: [
    "Context removes the intermediate props, and prop drilling one or two levels is still fine",
    "The value comes from the nearest provider above the component in the tree",
    "Every consumer re-renders when the value changes; none can subscribe to part of it",
    "A default that looks plausible hides a missing provider — prefer one that throws",
    "An inline object as the provider value re-renders every consumer on every provider render",
    "Context is a transport, not a store — it suits values read widely and changed rarely",
  ],
  status: "available",
};
