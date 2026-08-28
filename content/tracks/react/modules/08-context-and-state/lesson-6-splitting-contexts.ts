import type { Lesson } from "@/content/types";

export const splittingContextsLesson: Lesson = {
  id: "react-splitting-contexts",
  slug: "splitting-contexts",
  moduleSlug: "context-and-state-architecture",
  title: "Splitting Contexts to Limit Re-renders",
  summary:
    "The only re-render control context offers, measured. Split by rate of change, not by subject; watch a write-only component drop to zero renders; and see exactly where the technique runs out.",
  estimatedMinutes: 25,
  objectives: [
    "Measure the difference splitting makes, with render counts",
    "Split by how often a value changes rather than by what it is about",
    "Say why this is a coarse substitute for selectors",
    "Recognise when you have split too far",
    "Know the point at which a store is the honest answer",
  ],
  sections: [
    {
      id: "measured",
      heading: "The measurement",
      body: [
        "The same state twice. On one side, one context holding `[value, dispatch]`. On the other, two contexts holding the same information. One increment on each side, and a render counter in every component.",
      ],
      examples: [
        {
          id: "split-measurement",
          title: "Combined against split",
          lang: "tsx",
          code: `import { createContext, useContext, useReducer, act } from "react";
import type { ReactNode, Dispatch } from "react";
import { createRoot } from "react-dom/client";

type Action = { type: "added" };
const reducer = (n: number, a: Action) => (a.type === "added" ? n + 1 : n);

const renders: Record<string, number> = {};
const count = (n: string) => { renders[n] = (renders[n] ?? 0) + 1; };

/* ---- one context holding both the value and the dispatcher ---- */
const Combined = createContext<[number, Dispatch<Action>]>([0, () => {}]);
function CombinedProvider({ children }: { children: ReactNode }) {
  const [n, dispatch] = useReducer(reducer, 0);
  return <Combined.Provider value={[n, dispatch]}>{children}</Combined.Provider>;
}
function CombinedReader() { count("reader(combined)"); return <output>{useContext(Combined)[0]}</output>; }
function CombinedWriter() {
  count("writer(combined)");
  const [, dispatch] = useContext(Combined);
  return <button type="button" id="a" onClick={() => dispatch({ type: "added" })}>+</button>;
}

/* ---- the same state, split into two contexts ---- */
const ValueCtx = createContext(0);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});
function SplitProvider({ children }: { children: ReactNode }) {
  const [n, dispatch] = useReducer(reducer, 0);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <ValueCtx.Provider value={n}>{children}</ValueCtx.Provider>
    </DispatchCtx.Provider>
  );
}
function SplitReader() { count("reader(split)"); return <output>{useContext(ValueCtx)}</output>; }
function SplitWriter() {
  count("writer(split)");
  const dispatch = useContext(DispatchCtx);
  return <button type="button" id="b" onClick={() => dispatch({ type: "added" })}>+</button>;
}

function App() {
  return (
    <>
      <CombinedProvider><CombinedReader /><CombinedWriter /></CombinedProvider>
      <SplitProvider><SplitReader /><SplitWriter /></SplitProvider>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
for (const k of Object.keys(renders)) renders[k] = 0;

act(() => { container.querySelector<HTMLButtonElement>("#a")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>("#b")!.click(); });
console.log("one increment on each side:");
for (const [k, v] of Object.entries(renders)) console.log(\`  \${k.padEnd(18)} \${v} re-render(s)\`);`,
          output: `one increment on each side:
  reader(combined)   1 re-render(s)
  writer(combined)   1 re-render(s)
  reader(split)      1 re-render(s)
  writer(split)      0 re-render(s)`,
          explanation:
            "Zero. The split writer does not re-render at all, because the only context it reads is the dispatch context, and `dispatch` has the same identity it has always had. On a real page that is every button, every menu item and every form control that writes to the store dropping out of the re-render set — and it cost one extra `createContext` call.",
        },
      ],
      pitfalls: [
        {
          title: "The combined version is not fixable with useMemo",
          body: "`value={useMemo(() => [n, dispatch], [n, dispatch])}` still changes identity whenever `n` changes, because `n` is in the array. The problem is not the object's identity; it is that one context carries two things with different rates of change. Only splitting fixes that.",
        },
      ],
    },
    {
      id: "by-rate",
      heading: "Split by rate of change, not by subject",
      visual: {
        id: "context-split-visual",
        kind: "react-rendering",
        algorithm: "context-update",
        title: "What one context value wakes",
      },
      body: [
        "The instinct is to split by topic: a `UserContext`, a `SettingsContext`, a `CartContext`. That is a fine way to organise code, and it is not what makes the re-renders go away.",
        "**The axis that matters is how often a value changes.** Two values in one context means every reader of either re-renders at the combined rate. So the split to make is between the parts that change at different rates, even when they are obviously about the same thing.",
        "A concrete case. An editor's context holds the document, the current selection and the zoom level. The document changes on save; the selection changes on every cursor move. Combined, the toolbar — which only needs the zoom — re-renders on every cursor move. Split three ways, it re-renders when the zoom changes and at no other time.",
        "The rule of thumb: **anything that changes on every keystroke or every mouse move gets its own context**, or does not go in context at all.",
      ],
      examples: [
        {
          id: "rate-split",
          title: "Three rates, three contexts",
          lang: "tsx",
          code: `/* One provider, three contexts, split by how often each value changes.
   Nothing else about the component changes. */
const DocumentCtx = createContext<Doc | null>(null);      // rarely: on save
const SelectionCtx = createContext<Range | null>(null);   // constantly: every keystroke
const EditorActions = createContext<Actions | null>(null); // never: stable callbacks

export function EditorProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<Doc>(emptyDoc);
  const [selection, setSelection] = useState<Range>(emptyRange);

  // Stable for the provider's whole life, so EditorActions never changes value.
  const actions = useMemo<Actions>(
    () => ({ save: () => save(doc), select: setSelection }),
    [doc],
  );

  return (
    <EditorActions.Provider value={actions}>
      <DocumentCtx.Provider value={doc}>
        <SelectionCtx.Provider value={selection}>{children}</SelectionCtx.Provider>
      </DocumentCtx.Provider>
    </EditorActions.Provider>
  );
}

// A toolbar that reads only useEditorActions() now re-renders when its
// parent does, and never because the cursor moved.`,
          explanation:
            "`actions` depends on `doc` because `save` closes over it, so it changes on save and not on every keystroke — which is the rate that matters. Getting a genuinely never-changing actions object means putting `doc` in a ref, which is worth doing when the toolbar is expensive and is over-engineering when it is not.",
        },
      ],
    },
    {
      id: "too-far",
      heading: "When you have split too far",
      body: [
        "This has a real cost and it is not free to keep going.",
        "**Provider nesting.** Six contexts is six providers, and a component tree with a six-deep wrapper at the top is harder to read and shows six extra levels in DevTools.",
        "**More places to look.** \"Where does this value come from?\" now has six candidate answers, and a value that should live with another one is in a different file for a reason nobody wrote down.",
        "**A guess about the future.** Splitting is a static decision about which values are read together. When a component needs three of the six, you have not reduced its re-renders at all — you have made it call three hooks instead of one.",
        "Three or four contexts per provider is where the return stops. Past that, the granularity you actually want is per-component, and that is a selector, and context does not have selectors.",
      ],
      pitfalls: [
        {
          title: "The obvious workaround is a store with extra steps",
          body: "Putting a subscribable object in a context and having components subscribe to slices of it with `useSyncExternalStore` does give you selectors — and it is exactly what Zustand does, with the provider optional. If you find yourself building it, you have identified the case for lesson 8 rather than found a way around it.",
        },
      ],
    },
    {
      id: "when-store",
      heading: "The honest boundary",
      body: [
        "Splitting is the right tool when the values genuinely fall into a few groups with different rates of change. That covers most applications: a theme, a user, a set of actions, one frequently-changing thing.",
        "It is the wrong tool when many components each want a different small part of one large, frequently-changing object. Ten components, ten different fields, one object that changes constantly — no static split helps, because the grouping you want is per-component and it is not knowable in advance.",
        "The diagnostic question: **can you name the two or three groups?** If yes, split. If you find yourself listing every field, the granularity you need is a selector.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you reduce re-renders from a context?",
      answer:
        "Split it. Anything read separately and changing at a different rate goes in its own context — most usefully, state and dispatch, since dispatch never changes identity, so components that only write drop to zero re-renders from that context. Beyond that, split by how often values change rather than by subject: a value that changes on every keystroke sitting in the same context as one that changes on save makes every reader of either re-render at the faster rate.",
    },
    {
      question: "Why split by rate of change rather than by topic?",
      answer:
        "Because a context re-renders all of its consumers at the combined rate of everything in it, and grouping by topic frequently puts a fast-changing value next to a slow one. An editor context holding the document and the selection makes a toolbar that only needs the zoom re-render on every cursor move. Topic is a good way to organise files; rate of change is what determines re-renders.",
    },
    {
      question: "When does splitting stop working?",
      answer:
        "Around three or four contexts, and structurally when many components each need a different small piece of one large, frequently-changing object. Splitting is a static decision about which values are read together, so a component needing three of six contexts has gained nothing but three hook calls. The granularity you want at that point is per-component, which is a selector — and context has no selectors, so the answer is a store.",
    },
  ],
  takeaways: [
    "Splitting state from dispatch takes write-only components to zero re-renders, for one extra `createContext`",
    "`useMemo` cannot fix a combined context — the problem is two rates of change in one value",
    "Split by how often a value changes, not by what it is about",
    "Anything changing on every keystroke gets its own context, or stays out of context",
    "The cost is provider nesting, more places to look, and a static guess about who reads what",
    "Three or four contexts per provider is where the return stops",
    "If you cannot name two or three groups, you want selectors and therefore a store",
  ],
  status: "available",
};
