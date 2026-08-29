import type { Lesson } from "@/content/types";

export const whatContextCostsLesson: Lesson = {
  id: "react-what-context-costs",
  slug: "what-a-context-update-costs",
  moduleSlug: "context-and-state-architecture",
  title: "What a Context Update Costs",
  summary:
    "Two rules, and they are different rules — which is why memo stops some of the re-renders and none of the ones you wanted. Measured, with render counts, and then the two design consequences.",
  estimatedMinutes: 28,
  objectives: [
    "State the two separate rules that make a context update re-render things",
    "Explain why memo cannot stop a consumer from re-rendering",
    "Measure re-renders for a context change and predict the counts",
    "Say why a provider whose value is an object literal re-renders everything",
    "Decide whether context fits a given piece of state",
  ],
  sections: [
    {
      id: "two-rules",
      heading: "Two rules, not one",
      body: [
        "\"A context update re-renders all consumers\" is the sentence everybody knows, and it describes about half of what happens.",
        "**Rule 1 — the ordinary cascade.** The provider is a component. When its value changes, whatever holds that value re-rendered, so everything below it re-renders too. This has nothing to do with context; it is React's default from module 2, and it applies to every component under the provider whether it consumes the context or not. `memo` stops it.",
        "**Rule 2 — the consumer rule.** Any component that called `useContext` on that context re-renders, wherever it is, whatever its props are, and whether or not it is memoised. `memo` cannot stop it, because the value did not arrive through props and there is nothing for memo to compare.",
        "The two rules together are why people's mental model breaks: they memoise the tree, the re-renders mostly stop, and the expensive consumer keeps re-rendering — which looks like memo failing rather than like a second rule they had not accounted for.",
      ],
    },
    {
      id: "measured",
      heading: "Measured",
      body: [
        "Four components under one provider, each in a different situation, with a counter in every render.",
      ],
      examples: [
        {
          id: "context-render-counts",
          title: "Who re-renders when the theme changes",
          lang: "jsx",
          code: `import { createContext, useContext, useState, memo, act } from "react";
import { createRoot } from "react-dom/client";

const ThemeContext = createContext("light");
const renders = {};
const count = (name) => { renders[name] = (renders[name] ?? 0) + 1; };

/* Reads the context — and is memoised, with no props at all. */
const Themed = memo(function Themed() {
  count("Themed");
  useContext(ThemeContext);
  return <button type="button" />;
});
/* Does not read it, and is memoised with no props. */
const Plain = memo(function Plain() { count("Plain"); return <span />; });
/* Does not read it, and is not memoised. */
function Ordinary() { count("Ordinary"); return <i />; }
/* Between the provider and the leaves; passes children through. */
const Toolbar = memo(function Toolbar({ children }) {
  count("Toolbar");
  return <div>{children}</div>;
});

function App() {
  const [theme, setTheme] = useState("light");
  count("App");
  return (
    <ThemeContext.Provider value={theme}>
      <button type="button" id="toggle" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        toggle
      </button>
      <Toolbar>
        <Themed />
        <Plain />
        <Ordinary />
      </Toolbar>
    </ThemeContext.Provider>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
console.log("after mount: ", JSON.stringify(renders));

for (const key of Object.keys(renders)) renders[key] = 0;
act(() => { container.querySelector("#toggle").click(); });
console.log("after toggle:", JSON.stringify(renders));`,
          output: `after mount:  {"App":1,"Toolbar":1,"Themed":1,"Plain":1,"Ordinary":1}
after toggle: {"App":1,"Toolbar":1,"Themed":1,"Plain":0,"Ordinary":1}`,
          explanation:
            "Four different outcomes from one click. **Themed** re-rendered despite `memo` and despite having no props — rule 2. **Plain**, also memoised with no props, was skipped — rule 1, stopped by memo. **Ordinary** re-rendered because its parent did, and it has no memo. **Toolbar** is memoised and still re-rendered, because its `children` prop is a fresh array of elements every time `App` runs.",
          alternates: [
            {
              lang: "tsx",
              code: `import { createContext, useContext, useState, memo, act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

const ThemeContext = createContext<"light" | "dark">("light");
const renders: Record<string, number> = {};
const count = (name: string) => { renders[name] = (renders[name] ?? 0) + 1; };

/* Reads the context — and is memoised, with no props at all. */
const Themed = memo(function Themed() {
  count("Themed");
  useContext(ThemeContext);
  return <button type="button" />;
});
/* Does not read it, and is memoised with no props. */
const Plain = memo(function Plain() { count("Plain"); return <span />; });
/* Does not read it, and is not memoised. */
function Ordinary() { count("Ordinary"); return <i />; }
/* Between the provider and the leaves; passes children through. */
const Toolbar = memo(function Toolbar({ children }: { children: ReactNode }) {
  count("Toolbar");
  return <div>{children}</div>;
});

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  count("App");
  return (
    <ThemeContext.Provider value={theme}>
      <button type="button" id="toggle" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        toggle
      </button>
      <Toolbar>
        <Themed />
        <Plain />
        <Ordinary />
      </Toolbar>
    </ThemeContext.Provider>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
console.log("after mount: ", JSON.stringify(renders));

for (const key of Object.keys(renders)) renders[key] = 0;
act(() => { container.querySelector<HTMLButtonElement>("#toggle")!.click(); });
console.log("after toggle:", JSON.stringify(renders));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`memo` plus `children` is almost always a no-op",
          body: "That `Toolbar` result surprises people. JSX children are rebuilt on every render of the parent, so a memoised component that takes `children` compares a new array against an old one and always re-renders. Memoising a layout wrapper therefore buys nothing. What does work is the composition point from lesson 2 — the elements *inside* the children are the same objects, so they are not re-rendered even though `Toolbar` is.",
        },
      ],
    },
    {
      id: "provider-value",
      heading: "The provider value",
      body: [
        "One line decides whether rule 2 fires at all: what you pass as `value`.",
        "React compares the previous value with the next one using `Object.is`. An object literal written in the provider's body is a new object every render, so the comparison always fails and **every consumer re-renders every time the provider renders** — including renders caused by something entirely unrelated.",
        "This is the single most common context performance bug, and the fix is `useMemo`.",
      ],
      examples: [
        {
          id: "stable-value",
          title: "The one line that matters",
          lang: "jsx",
          code: `// Broken. A new object on every render of AuthProvider — including renders
// caused by \`route\` changing, which no consumer of AuthContext cares about.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("/");

  return (
    <AuthContext.Provider value={{ user, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

// Fixed. The object's identity now changes only when \`user\` does.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("/");

  const value = useMemo(
    () => ({ user, signOut: () => setUser(null) }),
    [user],                       // setUser is stable, so it is not a dependency
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}`,
          explanation:
            "`setUser` does not appear in the dependency array because React guarantees a state setter's identity is stable for the life of the component. That guarantee is what makes the memo worth having: without it the dependency would change every render and you would be back where you started.",
          alternates: [
            {
              lang: "tsx",
              code: `// Broken. A new object on every render of AuthProvider — including renders
// caused by \`route\` changing, which no consumer of AuthContext cares about.
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState("/");

  return (
    <AuthContext.Provider value={{ user, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

// Fixed. The object's identity now changes only when \`user\` does.
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState("/");

  const value = useMemo(
    () => ({ user, signOut: () => setUser(null) }),
    [user],                       // setUser is stable, so it is not a dependency
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A primitive value needs no useMemo",
          body: "`value={theme}` where `theme` is a string is already stable by value — `Object.is(\"dark\", \"dark\")` is true. The problem only exists for objects, arrays and functions. If your context holds one primitive, there is nothing to fix, which is one more argument for splitting a context into several small ones.",
        },
      ],
    },
    {
      id: "consequences",
      heading: "The two consequences for design",
      body: [
        "**Context suits values that are read widely and change rarely.** Theme, locale, the signed-in user, a feature-flag set, a form's field registry. Every consumer re-rendering is fine when the value changes twice a session.",
        "**Context is a poor fit for values that change often.** A cart that updates on every keystroke, a mouse position, form state on a large form. Every consumer re-renders on every change and there is no way to say \"I only care about the total\". That is not a bug in context; it is the absence of a feature context does not have.",
        "The missing feature has a name: **selectors**. A store lets a component subscribe to a slice and re-render only when that slice changes. Context has no equivalent, and every proposed workaround — splitting contexts, memoising consumers, `useSyncExternalStore` under a provider — is either a partial fix or a store with extra steps. Lesson 6 covers the split; lesson 8 covers the store.",
        "The one-sentence version, worth keeping: **context is a transport, not a store.** It solves \"how does this value get there\", not \"who should re-render when it changes\".",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What re-renders when a context value changes?",
      answer:
        "Two separate sets, by two separate rules. Everything under the provider re-renders because the provider's own component re-rendered — that is React's ordinary cascade and `memo` stops it. And every component that called `useContext` on that context re-renders regardless of props and regardless of `memo`, because the value did not arrive through props so there is nothing for memo to compare. Confusing the two is why \"I memoised it and it still re-renders\" is such a common complaint.",
    },
    {
      question: "Why does a memoised context consumer still re-render?",
      answer:
        "`memo` compares props. The context value never passed through props — the component reached out and read it — so memo has nothing to compare and cannot skip the render. This is by design: if memo could block a context update, a consumer could show a stale value indefinitely.",
    },
    {
      question: "What is wrong with `value={{ user, signOut }}`?",
      answer:
        "It is a new object every render of the provider, so `Object.is` always fails and every consumer re-renders whenever the provider renders — including renders caused by unrelated state in the same component. Wrap it in `useMemo` keyed on the values that actually changed. State setters are stable, so they do not belong in the dependency array. A context holding a single primitive needs none of this.",
    },
    {
      question: "When is context the wrong tool?",
      answer:
        "When the value changes often and is read by many components that each care about a different part of it. Every consumer re-renders on every change and there is no way to subscribe to a slice — context has no selectors. That is the case for a store. Context suits values read widely and changed rarely: theme, locale, the current user, feature flags.",
    },
  ],
  takeaways: [
    "Two rules: the ordinary cascade under the provider, and every consumer of the changed context",
    "`memo` stops the first and cannot stop the second",
    "A memoised component taking `children` re-renders anyway — children are rebuilt every render",
    "React compares provider values with `Object.is`; an object literal fails every time",
    "`useMemo` the provider value; state setters are stable and are not dependencies",
    "A context holding one primitive needs no memo at all",
    "Context has no selectors — that is the feature a store adds",
    "Context is a transport, not a store: read widely, changed rarely",
  ],
  status: "available",
};
