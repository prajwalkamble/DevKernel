import type { Lesson } from "@/content/types";

export const reconciliationLesson: Lesson = {
  id: "react-reconciliation",
  slug: "virtual-dom-and-reconciliation",
  moduleSlug: "jsx-and-rendering",
  title: "The Virtual DOM & Reconciliation",
  summary:
    "What React compares, the three rules it compares by, and why a changed element type throws away everything below it. Also what the virtual DOM is not, since most of what is said about it is marketing.",
  estimatedMinutes: 30,
  objectives: [
    "State what the virtual DOM actually is, and what it does not buy you",
    "Apply the three reconciliation rules to a pair of trees",
    "Explain why a different type at one position destroys the subtree",
    "Recognise the conditional-wrapper pattern that remounts a subtree by accident",
    "Say why the algorithm is a set of heuristics rather than an optimal diff",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "The virtual DOM, without the marketing",
      body: [
        "The virtual DOM is the element tree from the first lesson: plain objects with a `type`, `props` and `key`. React keeps the tree it rendered last time, builds a new one when something changes, compares the two, and applies the differences to the real DOM.",
        "The claim you will hear is that this makes React fast because the DOM is slow. That is not right, and it is worth being precise, because the wrong model leads to the wrong optimisations. Touching the DOM directly is *faster* than building a tree of objects and diffing it first. React does more work, not less.",
        "What the virtual DOM buys is that **you get to write the whole UI as a function of state and not think about updates at all**. Describe what the screen should look like now; React works out the minimum set of DOM operations to get there. The diff is the price of that, and it is a price worth paying because a hand-written update path is where bugs live — the branch that forgot to clear a field, the state that got out of step with the screen.",
        "So: the virtual DOM is a convenience mechanism, not a speed mechanism. React is fast enough because the diff is cheap and the DOM operations are minimal, not because it beat the DOM at its own game.",
      ],
    },
    {
      id: "three-rules",
      heading: "The three rules",
      body: [
        "React does not compute the minimum edit between two trees. That problem is O(n³) in the general case, and for a UI tree it is not worth solving. Instead it applies three heuristics that are almost always right for real interfaces, and it accepts being wrong occasionally in exchange for being linear.",
        "**Different type at the same position: destroy and rebuild.** A `<ul>` that became a `<section>` is not treated as a modified `<ul>`. The old node, its children, and all of their state are thrown away, and the new subtree is built from nothing.",
        "**Same type: keep the node and update what differs.** The DOM node survives, its state survives, and React sets only the props that changed. This is the case that makes React usable — a keystroke in a form does not rebuild the form.",
        "**Children are matched in order, unless they have keys.** Without keys, the first child is compared with the first child, the second with the second. With keys, they are matched by key wherever they moved to. That is the whole subject of the next lesson.",
      ],
      visual: {
        id: "reconciliation-visual",
        kind: "react-rendering",
        algorithm: "reconcile-same-type",
        title: "Reconciliation, one comparison at a time",
      },
      examples: [
        {
          id: "type-decides",
          title: "What React compares at a position",
          lang: "tsx",
          code: `function Panel({ children }) {
  return <div className="panel">{children}</div>;
}

// Same position, three different element types.
const a = <div className="panel" />;
const b = <div className="panel highlighted" />;
const c = <section className="panel" />;
const d = <Panel />;

console.log("a vs b — same type?", a.type === b.type);
console.log("b vs c — same type?", b.type === c.type);
console.log("c vs d — same type?", c.type === d.type);
console.log("d's type is the function itself:", d.type === Panel);`,
          output: `a vs b — same type? true
b vs c — same type? false
c vs d — same type? false
d's type is the function itself: true`,
          explanation:
            "Only `type` is consulted for this decision — never `className`, never the children. `a` to `b` keeps the node and changes one attribute. `b` to `c` looks like a trivial change and is not: `div` and `section` are different strings, so the node and everything under it goes. And a component's type is the function, so swapping which component renders at a position destroys the subtree just as surely.",
        },
      ],
      pitfalls: [
        {
          title: "The comparison is by position in the tree, not by what the code looks like",
          body: "React has no idea that two `<Row>` elements in different branches of a ternary are \"the same row\" to you. It walks the two trees in parallel and compares whatever it finds at each position. Two branches that render structurally identical trees will reuse the nodes; two that differ by one wrapper will not.",
        },
      ],
    },
    {
      id: "the-remount-trap",
      heading: "The conditional wrapper that remounts everything",
      body: [
        "The rule about differing types has a consequence that bites in real code, and the visual above is the shape of it: something at the top of the tree changes type, and a whole subtree that looks untouched is destroyed and rebuilt.",
        "The classic version is a wrapper that only sometimes exists. `{isModal ? <Dialog><Form /></Dialog> : <Form />}` puts `Form` at depth 1 in one branch and depth 0 in the other, so toggling `isModal` unmounts the form and mounts a new one — losing everything the user typed, every scroll position, and every piece of local state inside it.",
        "The fix is to keep the structure constant and vary the props: render the wrapper always and let it decide how to present itself. When that is genuinely impossible, the state has to live above the boundary, where remounting cannot reach it.",
      ],
      examples: [
        {
          id: "wrapper-remount",
          title: "The same children at two different depths",
          lang: "tsx",
          code: `function Form() {
  return <input defaultValue="typed so far" />;
}

// The form is a child of Dialog in one branch and a root in the other.
function Toggling({ isModal }) {
  return isModal ? <div className="dialog"><Form /></div> : <Form />;
}

// The structure is the same in both branches; only a prop differs.
function Stable({ isModal }) {
  return (
    <div className={isModal ? "dialog" : "plain"}>
      <Form />
    </div>
  );
}

function App() {
  return (
    <>
      <Toggling isModal={false} />
      <Toggling isModal={true} />
      <Stable isModal={false} />
      <Stable isModal={true} />
    </>
  );
}`,
          output: `<input value="typed so far"/><div class="dialog"><input value="typed so far"/></div><div class="plain"><input value="typed so far"/></div><div class="dialog"><input value="typed so far"/></div>`,
          explanation:
            "The markup is nearly identical, which is exactly why this is hard to spot in review. The difference is invisible in the output and decisive at runtime: in `Toggling` the `<input>` is a child of a `<div>` in one branch and of the fragment in the other, so flipping `isModal` changes the type at that position and React rebuilds the input from scratch. In `Stable` the position is unchanged and only `className` differs, so the input — and whatever the user had typed into it — survives.",
        },
      ],
      pitfalls: [
        {
          title: "Defining a component inside another component is the same bug in disguise",
          body: "A nested `function Row() {…}` is a *new function object* on every render of its parent, so the element's `type` is a different value every time. React compares types by identity, sees a change, and destroys and rebuilds the subtree on every single parent render. The symptom is an input that will not keep focus, or state that resets as you type — never an error. Module 1 flagged this; this is the mechanism behind it.",
        },
      ],
    },
    {
      id: "cost",
      heading: "What this makes cheap and what it makes expensive",
      body: [
        "**Cheap:** changing text, toggling a class, adding an attribute, adding or removing an item at the end of a list. All of these are a shallow prop comparison and one DOM operation.",
        "**Expensive:** changing the type of an element high in the tree, and reordering a keyless list, which the next lesson covers. Both turn a small logical change into a large amount of DOM work.",
        "**Free, and often misunderstood:** a component re-rendering. Running a function and comparing two objects is not the thing that costs — a re-render that produces an identical tree results in no DOM operations at all. Module 9 makes this argument properly, because \"stop it re-rendering\" is the most commonly misapplied React optimisation.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is the virtual DOM faster than the real DOM?",
      answer:
        "No — it is strictly more work: React builds a tree of objects and diffs it before touching the DOM at all, and a direct DOM write would skip both steps. What it buys is the programming model: you describe the UI as a function of state and never write update logic, and React derives the minimal set of DOM operations. It is a mechanism for correctness and convenience whose cost happens to be low, not a performance trick.",
    },
    {
      question: "What happens when an element's type changes between renders?",
      answer:
        "React destroys the old node and everything beneath it, including all component state and DOM state such as focus and scroll position, and builds the new subtree from nothing. It does not attempt to match a `<div>` against a `<section>`, or one component against another. Only `type` is consulted for that decision — props and children are irrelevant to it.",
    },
    {
      question: "Why does React use heuristics rather than computing the minimal diff?",
      answer:
        "The general tree-diff problem is O(n³), which is unusable for a UI tree on every update. React's three heuristics — different type means rebuild, same type means update in place, children match by position unless keyed — are linear and are almost always right for real interfaces, where elements rarely change type and lists change at their ends. It trades occasional extra work for a predictable, linear-time algorithm.",
    },
  ],
  takeaways: [
    "The virtual DOM is the element tree; it buys the programming model, not raw speed",
    "Different type at a position destroys the subtree and all its state; same type keeps the node and updates what differs",
    "Only `type` decides that — props, className and children have no bearing on it",
    "A conditional wrapper changes the position of its children and silently remounts them",
    "A component defined inside another has a new type identity every render, so its subtree is rebuilt every time",
    "React uses linear heuristics rather than a minimal diff, because the general problem is O(n³)",
  ],
  status: "available",
};
