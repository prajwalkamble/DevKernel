import type { Lesson } from "@/content/types";

export const fragmentsLesson: Lesson = {
  id: "react-fragments",
  slug: "fragments-and-multiple-children",
  moduleSlug: "jsx-and-rendering",
  title: "Fragments & Returning Several Children",
  summary:
    "Why a component may return only one thing, how a fragment satisfies that rule without adding a DOM node, and the two cases — keyed lists and CSS layout — where the difference between a fragment and a wrapping `div` genuinely matters.",
  estimatedMinutes: 25,
  objectives: [
    "Explain the one-root rule from the compiled output rather than as a convention",
    "Choose between `<>…</>` and `<Fragment>` knowingly",
    "Render a keyed list of element pairs correctly",
    "Say why a wrapper `div` can break a grid or flex layout when a fragment does not",
    "Recognise when returning an array is the simpler answer",
  ],
  sections: [
    {
      id: "one-root",
      heading: "Why only one root",
      visual: {
        id: "fragment-vs-div",
        kind: "react-jsx",
        algorithm: "fragment-vs-wrapper",
        title: "A wrapper div against a fragment",
      },
      body: [
        "A component returns one value, because it is a function and functions return one value. There is no React rule here at all — `return <p /> <p />;` is not valid JavaScript, and never gets as far as React.",
        "So when you need two siblings, you need one thing that contains them. A `<div>` works and adds a node to the DOM. A **fragment** works and adds nothing.",
        "A fragment is a real element like any other: its `type` is a symbol React recognises, and when React renders it, it places the children into the parent and produces no node of its own.",
      ],
      examples: [
        {
          id: "fragment-renders-nothing",
          title: "A fragment leaves no trace",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Wrapped() {
  return (
    <div>
      <span>a</span>
      <span>b</span>
    </div>
  );
}

function Fragged() {
  return (
    <>
      <span>a</span>
      <span>b</span>
    </>
  );
}

console.log("div: ", render(<Wrapped />));
console.log("frag:", render(<Fragged />));`,
          output: `div:  <div><span>a</span><span>b</span></div>
frag: <span>a</span><span>b</span>`,
          explanation:
            "The fragment version produces exactly the two spans, with nothing around them. That is the whole feature. Note also that the two spans came out flush against each other despite being on separate lines in the source — the whitespace rule from the previous lesson, not anything to do with fragments.",
        },
      ],
    },
    {
      id: "two-spellings",
      heading: "`<>` and `<Fragment>` are not quite interchangeable",
      body: [
        "`<>…</>` is shorthand for `<Fragment>…</Fragment>`, and for almost every use the shorthand is right.",
        "The shorthand **cannot take props**, and a fragment accepts exactly one useful prop: `key`. So the moment you build fragments in a `.map()`, you must write the long form and import `Fragment` from React.",
        "This is the case people meet in a description list or a table: each iteration needs to emit two sibling elements — a `<dt>` and a `<dd>`, or several `<td>`s — that must stay siblings in the parent. A wrapping `<div>` would be invalid HTML there and would break the layout; a keyed fragment is exactly right.",
      ],
      examples: [
        {
          id: "keyed-fragment",
          title: "One iteration, two sibling elements",
          lang: "jsx",
          code: `import { Fragment } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const rows = [
  { id: 1, term: "Element", def: "A description of UI" },
  { id: 2, term: "Component", def: "A function that returns one" },
];

// A div per row: invalid inside <dl>, and it breaks the pairing.
function Wrapped() {
  return (
    <dl>
      {rows.map((r) => (
        <div key={r.id}>
          <dt>{r.term}</dt>
          <dd>{r.def}</dd>
        </div>
      ))}
    </dl>
  );
}

// A keyed fragment: the dt and dd stay direct children of the dl.
function Fragged() {
  return (
    <dl>
      {rows.map((r) => (
        <Fragment key={r.id}>
          <dt>{r.term}</dt>
          <dd>{r.def}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

console.log("wrapped: ", render(<Wrapped />));
console.log("fragment:", render(<Fragged />));`,
          output: `wrapped:  <dl><div><dt>Element</dt><dd>A description of UI</dd></div><div><dt>Component</dt><dd>A function that returns one</dd></div></dl>
fragment: <dl><dt>Element</dt><dd>A description of UI</dd><dt>Component</dt><dd>A function that returns one</dd></dl>`,
          explanation:
            "The second output is the correct description list: four direct children of the `<dl>`, alternating. The first has wrapped each pair in a `<div>`, which browsers will render but which is not valid content for a `<dl>` and defeats any CSS that targets `dl > dt`. The same argument applies inside `<tr>`, `<select>` and `<ul>`, all of which constrain what their children may be.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Fragment } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

// Naming the row shape is the one thing TypeScript adds here: \`r.term\` and
// \`r.def\` are checked at both call sites rather than inferred twice.
type Row = { id: number; term: string; def: string };

const rows: Row[] = [
  { id: 1, term: "Element", def: "A description of UI" },
  { id: 2, term: "Component", def: "A function that returns one" },
];

// A div per row: invalid inside <dl>, and it breaks the pairing.
function Wrapped() {
  return (
    <dl>
      {rows.map((r) => (
        <div key={r.id}>
          <dt>{r.term}</dt>
          <dd>{r.def}</dd>
        </div>
      ))}
    </dl>
  );
}

// A keyed fragment: the dt and dd stay direct children of the dl.
function Fragged() {
  return (
    <dl>
      {rows.map((r) => (
        <Fragment key={r.id}>
          <dt>{r.term}</dt>
          <dd>{r.def}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

console.log("wrapped: ", render(<Wrapped />));
console.log("fragment:", render(<Fragged />));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`<key={id}>` is not valid — the shorthand takes no props at all",
          body: "There is no syntax for putting a prop on `<>`. If you need a key you need `<Fragment key={id}>`, which means importing `Fragment`. It is worth knowing this rather than discovering it: the error from trying is a parse error pointing at the `<`, which does not obviously say \"use the long form\".",
        },
      ],
    },
    {
      id: "layout",
      heading: "The wrapper that breaks a layout",
      body: [
        "CSS grid and flexbox apply to a container's **direct children**. A wrapper element inserted between them is therefore not cosmetic — it becomes the grid item, and the elements you actually wanted to place are now one level too deep, laid out by the wrapper's own display rules instead.",
        "This is the argument for fragments that has nothing to do with tidiness. A component that returns `<><Label /><Field /></>` can be dropped into a grid and its two elements will be placed by that grid. The same component returning a `<div>` gives the grid one item, and no amount of CSS on the parent will reach inside it.",
        "It is also why component libraries prefer fragments in their internals: the component cannot know what layout it will be dropped into, so it should add nothing that would interfere.",
      ],
      examples: [
        {
          id: "grid-children",
          title: "What the grid sees",
          lang: "jsx",
          code: `// Returns one element: the grid gets one item.
function WrappedPair() {
  return (
    <div>
      <dt>Term</dt>
      <dd>Definition</dd>
    </div>
  );
}

// Returns two elements: the grid gets two items.
function FraggedPair() {
  return (
    <>
      <dt>Term</dt>
      <dd>Definition</dd>
    </>
  );
}

function App() {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "8rem 1fr" }}>
      <FraggedPair />
    </dl>
  );
}`,
          output: `<dl style="display:grid;grid-template-columns:8rem 1fr"><dt>Term</dt><dd>Definition</dd></dl>`,
          explanation:
            "The `<dt>` and `<dd>` are direct children of the grid, so they land in the two declared columns. Swap in `WrappedPair` and the markup gains a `<div>` between them — the grid then has a single item spanning the first column, and the two-column layout silently stops working.",
        },
      ],
    },
    {
      id: "arrays",
      heading: "Returning an array instead",
      body: [
        "A component may also return an array of elements, which React renders in order. It is the same idea as a fragment with a different spelling, and it needs the same thing a fragment in a loop needs: a key on each item.",
        "It reads well when the children are already a collection and badly when they are not: `return [<dt key=\"t\" />, <dd key=\"d\" />]` is more punctuation than `<><dt /><dd /></>` for no gain. Reach for it when you are producing a list programmatically and already hold an array.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does a component have to return a single root element?",
      answer:
        "Because it is a JavaScript function, and a function returns one value — JSX compiles to a function call, so two adjacent roots would be two return values, which is not expressible. A fragment satisfies the rule without adding anything to the DOM: it is an element whose type is a symbol React recognises, and rendering it places its children directly into the parent.",
    },
    {
      question: "When must you write `<Fragment>` rather than `<>`?",
      answer:
        "When the fragment needs a `key`, which in practice means whenever you produce fragments inside a `.map()`. The shorthand syntax accepts no props at all, so there is nowhere to put the key. The usual case is a loop that has to emit two or more sibling elements per iteration — `<dt>`/`<dd>` pairs in a description list, or several `<td>`s in a row — where a wrapping element would be invalid HTML.",
    },
    {
      question: "Why can a wrapping `div` break a layout when a fragment does not?",
      answer:
        "Grid and flex layout apply to a container's direct children. A wrapper becomes the single child that gets laid out, and the elements inside it are one level deeper, positioned by the wrapper's own display rules instead of the container's. A fragment adds no node, so the elements it groups remain direct children and are placed by the container as intended.",
    },
  ],
  takeaways: [
    "One root is a JavaScript rule, not a React one: a function returns one value",
    "A fragment groups children and produces no DOM node of its own",
    "`<>…</>` takes no props, so a fragment in a `.map()` must be written `<Fragment key={…}>`",
    "Keyed fragments are the correct answer for `<dl>` pairs and multi-cell table rows, where a wrapper would be invalid HTML",
    "A wrapper element becomes the grid or flex item, which silently breaks layouts that a fragment leaves intact",
    "Returning an array is the same idea with different punctuation, and needs keys just the same",
  ],
  status: "available",
};
