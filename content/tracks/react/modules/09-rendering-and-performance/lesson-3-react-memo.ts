import type { Lesson } from "@/content/types";

export const reactMemoLesson: Lesson = {
  id: "react-memo",
  slug: "react-memo",
  moduleSlug: "rendering-and-performance",
  title: "React.memo, and the Prop Identity Problem",
  summary:
    "The gate on a branch, and the reason it so often does nothing. Three versions of the same component measured — hoisted, inline, repaired — plus where the boundary should go and what it costs when it fails.",
  estimatedMinutes: 28,
  objectives: [
    "Say exactly what memo compares and when it skips",
    "Diagnose a memo that never skips",
    "Place a memo boundary where one comparison protects a subtree",
    "Say what a failed memo costs compared with no memo",
    "Use a custom comparison function, and know why you usually should not",
  ],
  sections: [
    {
      id: "what-it-does",
      heading: "What it does",
      body: [
        "`memo(Component)` returns a component that, before rendering, compares each of the new props with the old ones using `Object.is`. If all of them match, React skips the render — **and everything inside it**.",
        "That last part is where the value is. A memo boundary is not a saving of one render; it is one comparison deciding the fate of an entire subtree.",
      ],
      pitfalls: [
        {
          title: "It compares props only",
          body: "Its own state changing still re-renders it. A context it reads changing still re-renders it. `memo` intercepts exactly one of the three causes from lesson 1 — the parent's cascade — and has no opinion about the other two.",
        },
      ],
    },
    {
      id: "why-it-fails",
      heading: "Why it usually does nothing",
      body: [
        "Because `Object.is` compares identity, and every object, array and function written inside a component body is a new value on every render.",
        "`rows={[...]}`, `style={{ margin: 8 }}`, `onPick={() => …}`, `config={{ ...defaults, size }}` — each of those is a fresh value each time the parent renders, so the comparison fails, so the memo re-renders. Three versions of the same tree, measured:",
      ],
      examples: [
        {
          id: "memo-three-ways",
          title: "Hoisted, inline, repaired",
          lang: "jsx",
          code: `import { useState, useMemo, memo, act } from "react";
import { createRoot } from "react-dom/client";

const renders = {};
const count = (n) => { renders[n] = (renders[n] ?? 0) + 1; };
const reset = () => { for (const k of Object.keys(renders)) delete renders[k]; };
const Chart = memo(function Chart({ rows, onPick }) {
  count("Chart");
  void onPick;
  return <svg>{rows.length}</svg>;
});

/* A constant defined outside the component: the same array forever. */
const ROWS = [{ id: "a" }, { id: "b" }];
const noop = (_id) => {};

function Stable() {
  const [n, setN] = useState(0);
  count("Stable");
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      <Chart rows={ROWS} onPick={noop} />
    </div>
  );
}

function Inline() {
  const [n, setN] = useState(0);
  count("Inline");
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      {/* Both props are built fresh here, every render. */}
      <Chart rows={[{ id: "a" }, { id: "b" }]} onPick={(id) => console.log(id)} />
    </div>
  );
}

function Repaired() {
  const [n, setN] = useState(0);
  count("Repaired");
  const rows = useMemo(() => [{ id: "a" }, { id: "b" }], []);
  const onPick = useMemo(() => (id) => void id, []);
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      <Chart rows={rows} onPick={onPick} />
    </div>
  );
}

function drive(Component, label) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(<Component />); });
  reset();
  for (let i = 0; i < 3; i++) act(() => { container.querySelector(".go").click(); });
  console.log(\`\${label.padEnd(28)} parent \${renders[Component.name] ?? 0}, Chart \${renders.Chart ?? 0}\`);
}

console.log("three clicks on the parent's own button:");
drive(Stable, "  hoisted constants:");
drive(Inline, "  inline object and arrow:");
drive(Repaired, "  useMemo'd:");`,
          output: `three clicks on the parent's own button:
  hoisted constants:         parent 3, Chart 0
  inline object and arrow:   parent 3, Chart 3
  useMemo'd:                 parent 3, Chart 0`,
          explanation:
            "The middle line is the version in most codebases: `memo` present, comparison running on every render, and every comparison failing. The component is doing strictly more work than it would with no memo at all — and to the reader it looks optimised.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useMemo, memo, act } from "react";
import { createRoot } from "react-dom/client";

const renders: Record<string, number> = {};
const count = (n: string) => { renders[n] = (renders[n] ?? 0) + 1; };
const reset = () => { for (const k of Object.keys(renders)) delete renders[k]; };

type Row = { id: string };
const Chart = memo(function Chart({ rows, onPick }: { rows: Row[]; onPick: (id: string) => void }) {
  count("Chart");
  void onPick;
  return <svg>{rows.length}</svg>;
});

/* A constant defined outside the component: the same array forever. */
const ROWS: Row[] = [{ id: "a" }, { id: "b" }];
const noop = (_id: string) => {};

function Stable() {
  const [n, setN] = useState(0);
  count("Stable");
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      <Chart rows={ROWS} onPick={noop} />
    </div>
  );
}

function Inline() {
  const [n, setN] = useState(0);
  count("Inline");
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      {/* Both props are built fresh here, every render. */}
      <Chart rows={[{ id: "a" }, { id: "b" }]} onPick={(id) => console.log(id)} />
    </div>
  );
}

function Repaired() {
  const [n, setN] = useState(0);
  count("Repaired");
  const rows = useMemo(() => [{ id: "a" }, { id: "b" }], []);
  const onPick = useMemo(() => (id: string) => void id, []);
  return (
    <div>
      <button type="button" className="go" onClick={() => setN((x) => x + 1)}>{n}</button>
      <Chart rows={rows} onPick={onPick} />
    </div>
  );
}

function drive(Component: () => React.JSX.Element, label: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(<Component />); });
  reset();
  for (let i = 0; i < 3; i++) act(() => { container.querySelector<HTMLButtonElement>(".go")!.click(); });
  console.log(\`\${label.padEnd(28)} parent \${renders[Component.name] ?? 0}, Chart \${renders.Chart ?? 0}\`);
}

console.log("three clicks on the parent's own button:");
drive(Stable, "  hoisted constants:");
drive(Inline, "  inline object and arrow:");
drive(Repaired, "  useMemo'd:");`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`children` defeats memo, always",
          body: "JSX children are rebuilt on every render of the parent, so a memoised component that accepts `children` compares a new array against an old one and always re-renders. Memoising a layout wrapper is therefore a no-op. What does help is that the elements *inside* those children are the same objects, so they are not re-rendered — which is composition doing the work, not memo.",
        },
        {
          title: "A failed memo costs more than no memo",
          body: "You pay for the comparison of every prop, plus the memory holding the previous props, plus whatever `useCallback` and `useMemo` you added in the parent to feed it — and then it re-renders anyway. It is worse than not having done it, and it reads as if the problem were handled.",
        },
      ],
    },
    {
      id: "where",
      heading: "Where to put the boundary",
      body: [
        "Memoising everything is the wrong instinct — most components are cheap, and the comparison costs about what the render did.",
        "Put a boundary where **one comparison protects something expensive**.",
        "**Above an expensive subtree**, not around each of its leaves. One memo on the branch beats twenty on the twigs, and it is the only version that stops the whole subtree.",
        "**On a component in a frequently-rendering parent** — a list row under a container that re-renders on every keystroke.",
        "**Where the props are naturally stable**: primitives, data from a query cache, values that only change when the thing they describe changes. If making the props stable requires three `useCallback`s and a `useMemo`, the boundary is in the wrong place — move it, or restructure so the state is closer to what it changes.",
        "There is also a way to get most of this with no memo at all: pass the expensive subtree as `children` from a component above the changing state. The element is then created outside the re-rendering component and is the same object, so React skips it. Module 8's composition lesson covers the mechanics.",
      ],
    },
    {
      id: "custom-compare",
      heading: "The second argument, and why to leave it alone",
      body: [
        "`memo(Component, areEqual)` takes a comparison function. It returns `true` to *skip* the render — which is backwards from `Array.sort` and from most `shouldUpdate` APIs, and is a reliable source of inverted logic.",
        "Two things go wrong with it in practice. A deep comparison of a large object can cost more than the render it saves, and it runs on every render whether or not it helps. And it silently goes stale: someone adds a prop, the comparison does not mention it, and the component stops updating for that prop with no error anywhere.",
        "Reach for it only for a genuinely expensive component with one prop you can compare cheaply and correctly — an id, a version number, a timestamp. Otherwise fix the identity of the props, which fixes the cause rather than working around it.",
      ],
      examples: [
        {
          id: "custom-comparator",
          title: "The rare acceptable case",
          lang: "jsx",
          code: `/* Rendering this takes ~80ms, and \`report\` is a large object rebuilt by the
   server on every poll — so identity changes constantly while the content
   does not. Comparing one version number is cheap and exact. */
const HeavyReport = memo(
  function HeavyReport({ report, onExport }) {
    return <ExpensiveChart data={report.series} onExport={onExport} />;
  },
  (previous, next) =>
    // true means "equal, skip the render" — the opposite of most such APIs.
    previous.report.version === next.report.version
    && previous.onExport === next.onExport,
);`,
          explanation:
            "Note that `onExport` is still compared. Leaving a prop out of the comparison is how a memoised component stops responding to it — and since the comparator is the only place that would say so, nothing warns you. Every prop must appear, which is also why this does not scale past a handful.",
          alternates: [
            {
              lang: "tsx",
              code: `type Props = { report: Report; onExport: () => void };

/* Rendering this takes ~80ms, and \`report\` is a large object rebuilt by the
   server on every poll — so identity changes constantly while the content
   does not. Comparing one version number is cheap and exact. */
const HeavyReport = memo(
  function HeavyReport({ report, onExport }: Props) {
    return <ExpensiveChart data={report.series} onExport={onExport} />;
  },
  (previous, next) =>
    // true means "equal, skip the render" — the opposite of most such APIs.
    previous.report.version === next.report.version
    && previous.onExport === next.onExport,
);`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does React.memo do?",
      answer:
        "It compares each prop with the previous one using `Object.is` before rendering, and if all are equal it skips the component and everything inside it. That subtree-wide skip is where the value is — one comparison at the boundary decides the fate of the whole branch. It only intercepts the parent-cascade cause: its own state changing and a context it reads changing both still re-render it.",
    },
    {
      question: "Why does a memoised component still re-render?",
      answer:
        "Almost always an object, array or function literal in the parent's JSX. Those are new values on every render, so `Object.is` fails and the memo re-renders — while still paying for the comparison, so it is doing more work than it would with no memo. `children` is the same problem: JSX children are rebuilt every render, so memoising a wrapper that takes children is always a no-op.",
    },
    {
      question: "Where should a memo boundary go?",
      answer:
        "Above an expensive subtree rather than around each of its leaves, since one comparison spares the whole branch. On a component whose parent re-renders frequently. And where the props are naturally stable — primitives, or cached data. If making the props stable takes three `useCallback`s and a `useMemo`, the boundary is in the wrong place; often passing the subtree as `children` from above the changing state achieves the same thing with no memo at all.",
    },
    {
      question: "When would you use memo's second argument?",
      answer:
        "Rarely. For a genuinely expensive component with one cheaply comparable prop — a version number or an id — where the object's identity changes far more often than its content. The risks are that a deep comparison can cost more than the render, and that leaving a prop out makes the component silently stop updating for it with nothing to warn you. It also returns `true` to *skip*, which is inverted from most similar APIs.",
    },
  ],
  takeaways: [
    "`memo` compares props with `Object.is` and skips the component and its whole subtree",
    "It intercepts only the parent cascade — not its own state, not a context it reads",
    "It usually does nothing, because objects, arrays and functions in JSX are new every render",
    "A failed memo costs more than no memo, and looks like a solved problem",
    "`children` always defeats it",
    "Put the boundary above an expensive subtree, not around every leaf",
    "If stabilising the props needs a pile of `useCallback`s, the boundary is misplaced",
    "The custom comparator returns `true` to skip, and a forgotten prop silently stops updating",
  ],
  status: "available",
};
