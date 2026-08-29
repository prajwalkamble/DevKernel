import type { Lesson } from "@/content/types";

export const childrenLesson: Lesson = {
  id: "react-children-prop",
  slug: "children-as-a-prop",
  moduleSlug: "components-and-props",
  title: "`children`, and Why It Is Just Another Prop",
  summary:
    "The syntax makes `children` look special; the compiled output shows it is not. What follows from that: wrappers that know nothing about their contents, several named slots instead of one, and children passed as a function.",
  estimatedMinutes: 30,
  objectives: [
    "Show that `children` is an ordinary entry in the props object",
    "Write a wrapper component that accepts arbitrary content",
    "Use named element props when one slot is not enough",
    "Pass a function as children, and say what that buys",
    "Avoid the `Children` API in the cases where composition is better",
  ],
  sections: [
    {
      id: "not-special",
      heading: "The syntax is special; the prop is not",
      body: [
        "Whatever sits between a component's opening and closing tags is collected by the compiler into the props object under the key `children`. That is the entire feature.",
        "Module 2's compiled output showed it directly: `<Widget size={3}>body</Widget>` becomes `jsx(Widget, { size: 3, children: \"body\" })`. `children` sits in props beside `size`, with no special treatment.",
        "So everything true of a prop is true of `children`. It can be given explicitly as an attribute, it can have a default, it can be renamed while destructuring, and it can hold any value — an element, a string, an array, a number, `null`, or a function.",
      ],
      examples: [
        {
          id: "children-is-a-prop",
          title: "Three spellings of the same thing",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Note({ children }) {
  return <aside>{children}</aside>;
}

// Between the tags...
const a = <Note>hello</Note>;
// ...or as an ordinary attribute, which is identical.
const b = <Note children="hello" />;

console.log("props from the tag form:      ", JSON.stringify(a.props));
console.log("props from the attribute form:", JSON.stringify(b.props));
console.log("same output?", render(a) === render(b));`,
          output: `props from the tag form:       {"children":"hello"}
props from the attribute form: {"children":"hello"}
same output? true`,
          explanation:
            "Identical props and identical output. Nobody writes the attribute form — it reads badly and loses the visual nesting — but knowing it exists is what makes `children` stop feeling like magic. It also explains the precedence rule: if you write both, the tag content wins, because the compiler assigns it last.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";
import type { ReactNode } from "react";

function Note({ children }: { children: ReactNode }) {
  return <aside>{children}</aside>;
}

// Between the tags...
const a = <Note>hello</Note>;
// ...or as an ordinary attribute, which is identical — and the type says so:
// \`children\` is declared like any other prop and can be passed like one.
const b = <Note children="hello" />;

console.log("props from the tag form:      ", JSON.stringify(a.props));
console.log("props from the attribute form:", JSON.stringify(b.props));
console.log("same output?", render(a) === render(b));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`children` is not always an array",
          body: "One child arrives as that child, not as an array of one; several arrive as an array; none arrives as `undefined`. So `children.map(…)` throws for a single child, and `children.length` is the string's length when the child is text. This is the reason the `Children` helpers exist. Most components never need to look — they render `{children}` and let React handle the shape.",
        },
      ],
    },
    {
      id: "wrappers",
      heading: "Wrappers that know nothing about their contents",
      body: [
        "The value of `children` is that a component can provide structure, styling and behaviour without knowing what it is wrapping. A `Card`, a `Dialog`, a `Layout`, an `ErrorBoundary` — none of them need to know their contents to do their job.",
        "This is the most important composition tool in React, and it is why the library needs no slot syntax, no transclusion, no content projection. Elements are values, and `children` is the prop you pass them in.",
        "It also inverts a dependency in a way that matters: the wrapper depends on nothing, and the caller decides everything. A `Card` that took a `title` and a `body` string can only ever render text; a `Card` that takes `children` can render anything anyone ever writes.",
      ],
    },
    {
      id: "several-slots",
      heading: "When one slot is not enough",
      body: [
        "A dialog usually needs a header, a body and a footer. There is only one `children`, so the second and third slots are ordinary props that happen to hold elements.",
        "Nothing about this is a special feature — module 2's lesson on elements established that an element is a value, so it may be passed as any prop. Naming the slots is clearer than trying to inspect `children` and split it up, and it survives a caller who wraps something in a `<div>`.",
      ],
      examples: [
        {
          id: "named-slots",
          title: "One `children`, two named slots",
          lang: "jsx",
          code: `function Dialog({ heading, children, footer = null }) {
  return (
    <section className="dialog">
      <header>{heading}</header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

function App() {
  return (
    <Dialog
      heading={<h2>Delete project</h2>}
      footer={<button type="button">Cancel</button>}
    >
      <p>This cannot be undone.</p>
      <p>All 42 files will be removed.</p>
    </Dialog>
  );
}`,
          output: `<section class="dialog"><header><h2>Delete project</h2></header><div class="body"><p>This cannot be undone.</p><p>All 42 files will be removed.</p></div><footer><button type="button">Cancel</button></footer></section>`,
          explanation:
            "`heading` and `footer` are elements in props; `children` is the main slot because it is the one with the most content and reads best nested. The `footer = null` default plus the `&&` means omitting it produces no `<footer>` element at all, rather than an empty one.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

// Every slot is a ReactNode, which is what makes them interchangeable: an
// element, a string, an array of either, or null.
function Dialog({ heading, children, footer = null }: {
  heading: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="dialog">
      <header>{heading}</header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

function App() {
  return (
    <Dialog
      heading={<h2>Delete project</h2>}
      footer={<button type="button">Cancel</button>}
    >
      <p>This cannot be undone.</p>
      <p>All 42 files will be removed.</p>
    </Dialog>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "children-as-function",
      heading: "`children` as a function",
      body: [
        "Because `children` can hold any value, it can hold a function. The component then calls it, passing whatever it has, and renders the result.",
        "This is the **render prop** pattern, and it solves a specific problem: a component that owns some state or behaviour but has no opinion about the markup. A `Toggle` that manages open/closed, a `MousePosition` that tracks coordinates, a `List` that handles selection — each has something to give the caller, and no business deciding how it looks.",
        "Custom hooks have replaced most uses of this, and module 10 makes that case. It survives where the thing being shared is *markup structure* rather than logic — which is exactly what a hook cannot give you.",
      ],
      examples: [
        {
          id: "render-prop",
          title: "The component owns the data; the caller owns the markup",
          lang: "jsx",
          code: `// Knows how to pick a row; knows nothing about how a row looks.
function Table({ rows, children }) {
  return (
    <table>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id}>{children(row, i)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const rows = [
  { id: "a", name: "Ada", year: 1815 },
  { id: "g", name: "Grace", year: 1906 },
];

function App() {
  return (
    <Table rows={rows}>
      {(row, i) => (
        <>
          <td>{i + 1}</td>
          <td>{row.name}</td>
          <td>{row.year}</td>
        </>
      )}
    </Table>
  );
}`,
          output: `<table><tbody><tr><td>1</td><td>Ada</td><td>1815</td></tr><tr><td>2</td><td>Grace</td><td>1906</td></tr></tbody></table>`,
          explanation:
            "`Table` decided the `<table>`, `<tbody>` and `<tr>`, and where the key goes; the caller decided the cells. Neither could have been written without the other's cooperation, and neither had to know the other's details. Note that `children` here is called, not rendered — `{children(row, i)}`, not `{children}`.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

// The generic is what makes a render prop pay for itself in TypeScript: \`row\`
// inside the callback is the caller's own row type, so \`row.name\` is checked
// at the call site without Table knowing anything about it.
function Table<T extends { id: string }>({ rows, children }: {
  rows: T[];
  children: (row: T, index: number) => ReactNode;
}) {
  return (
    <table>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id}>{children(row, i)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const rows = [
  { id: "a", name: "Ada", year: 1815 },
  { id: "g", name: "Grace", year: 1906 },
];

function App() {
  return (
    <Table rows={rows}>
      {(row, i) => (
        <>
          <td>{i + 1}</td>
          <td>{row.name}</td>
          <td>{row.year}</td>
        </>
      )}
    </Table>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A function child is not renderable on its own",
          body: "If a component receives a function as `children` and renders `{children}` rather than calling it, React throws — a function is not a valid child, the same way a plain object is not. The error says `Functions are not valid as a React child`, and it usually means either a forgotten call in the component, or a caller who passed `{() => …}` to something expecting elements.",
        },
      ],
    },
    {
      id: "children-api",
      heading: "The `Children` helpers, and why to reach for them last",
      body: [
        "`Children.map`, `Children.count`, `Children.toArray` and `Children.only` exist to deal with the fact that `children` may be one thing, an array, or nothing. They handle all three shapes safely.",
        "They are also the tool behind a pattern worth resisting: a parent that walks its children and clones them to inject props. It works right up until somebody wraps a child in a `<div>` or a `<Fragment>`, at which point the prop lands on the wrapper and the feature silently stops.",
        "Context is the answer for sharing something with descendants at any depth, and module 8 covers it. `Children.toArray` also rewrites the keys it returns — it prefixes them to keep them unique across flattening — so it must never be used to look a child up by key.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is `children` a special prop?",
      answer:
        "Only in its syntax. The compiler collects whatever sits between the tags and puts it in the props object under the key `children` — `<Note>hi</Note>` compiles to `jsx(Note, { children: \"hi\" })`. Writing `<Note children=\"hi\" />` is identical. Everything true of any prop is true of it: defaults, renaming, and holding any value including a function.",
    },
    {
      question: "How do you give a component more than one slot?",
      answer:
        "Pass elements as ordinary named props — `<Dialog heading={<h2>…</h2>} footer={<button/>}>body</Dialog>`. Elements are values, so any prop can hold one. That is clearer than inspecting `children` and splitting it up, and it does not break when a caller wraps something in an extra element.",
    },
    {
      question: "What is a render prop, and is it still worth knowing?",
      answer:
        "A component that receives a function — usually as `children` — and calls it with data it owns, letting the caller decide the markup. Custom hooks have replaced most of its uses, because sharing logic no longer needs a component in the tree. It still earns its place when what is being shared is markup structure rather than logic: a table that owns the rows and keys while the caller owns the cells is something a hook cannot express.",
    },
  ],
  takeaways: [
    "`children` is an ordinary entry in the props object; only the tag syntax is special",
    "It may be one child, an array, `undefined`, a string, or a function — so `children.map` is not safe in general",
    "Wrappers that take `children` need to know nothing about what they wrap, which is React's whole composition story",
    "More than one slot means more named props holding elements, not splitting `children` up",
    "A function child is the render prop pattern: the component owns the data, the caller owns the markup",
    "`Children` helpers exist for the awkward shapes, but cloning children to inject props breaks the moment one is wrapped",
  ],
  status: "available",
};
