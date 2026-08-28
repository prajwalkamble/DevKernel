import type { Lesson } from "@/content/types";

export const elementsAndComponentsLesson: Lesson = {
  id: "react-elements-and-components",
  slug: "elements-and-components",
  moduleSlug: "jsx-and-rendering",
  title: "Elements Against Components",
  summary:
    "An element is a description; a component is a function that produces one. Confusing the two is behind `<Foo />` against `Foo()`, elements stored in variables, and the question of what React is actually comparing when it re-renders.",
  estimatedMinutes: 30,
  objectives: [
    "State the difference between an element, a component and a component instance",
    "Explain what changes when you call a component instead of rendering it",
    "Treat elements as ordinary values: stored, passed, returned, put in arrays",
    "Recognise that creating an element does no work",
    "Use `cloneElement` and `isValidElement` knowingly rather than by cargo cult",
  ],
  sections: [
    {
      id: "three-things",
      heading: "Three things with confusingly similar names",
      visual: {
        id: "elements-tree-visual",
        kind: "react-rendering",
        algorithm: "element-tree",
        title: "JSX in, element tree out",
      },
      body: [
        "A **component** is the function you wrote. It exists once, whatever happens on screen.",
        "An **element** is a description of one appearance of that component: the object `{ type: Greeting, props: { name: \"Ada\" } }`. Two `<Greeting />` in a tree are two elements.",
        "An **instance** is what React keeps internally for a mounted element: its state, its hooks, its position in the tree. You never hold one — this is the thing `useState` stores into, and the thing a `key` change throws away.",
        "The distinction is not pedantry. `<Greeting />` creates an element and hands it to React, which then owns an instance and calls your function when it needs to. Everything React can do — skip a re-render, preserve state, tear a subtree down — depends on it holding descriptions it can compare, rather than results it cannot.",
      ],
      examples: [
        {
          id: "element-vs-call",
          title: "`<Hello />` against `Hello()`",
          lang: "tsx",
          code: `function Hello({ name }) {
  return <p>Hello, {name}!</p>;
}

// Rendered: an element whose type is the function itself.
const rendered = <Hello name="Ada" />;

// Called: the function runs now, and you get back whatever it returned.
const called = Hello({ name: "Ada" });

console.log("rendered.type === Hello:", rendered.type === Hello);
console.log("rendered.props:         ", JSON.stringify(rendered.props));
console.log("called.type:            ", called.type);
console.log("called.props:           ", JSON.stringify(called.props));`,
          output: `rendered.type === Hello: true
rendered.props:          {"name":"Ada"}
called.type:             p
called.props:            {"children":["Hello, ","Ada","!"]}`,
          explanation:
            "`rendered` is a description React has not looked inside yet. `called` is the `<p>` element that came *out* of `Hello`, produced immediately — React never learns that `Hello` was involved. Both produce identical HTML, which is exactly why this mistake survives review.",
        },
      ],
      pitfalls: [
        {
          title: "Calling a component instead of rendering it breaks state and hooks",
          body: "`{Hello({ name })}` gives React a `<p>` where it expected a `Hello`. There is no instance for `Hello`, so it has no state of its own, and any hooks it calls are counted against **the calling component's** hook list — which shifts every subsequent hook's slot and produces the wrong values with no error at the point of the mistake. It also cannot be memoised or suspended independently, because React does not know it exists. Render it: `<Hello name={name} />`.",
        },
      ],
    },
    {
      id: "elements-are-values",
      heading: "Elements are ordinary values",
      body: [
        "Because an element is a plain object, everything you can do with an object you can do with an element. Store it in a variable, put it in an array, return it from a helper, pass it as a prop, choose between two of them with a ternary.",
        "This is the whole mechanism behind the composition patterns later in the track. A `Layout` that takes `sidebar` and `content` as element props, a table that takes a `renderRow`, a modal that takes its own footer — none of these need a feature, because elements were already values.",
      ],
      examples: [
        {
          id: "elements-as-values",
          title: "Stored, chosen, collected, passed",
          lang: "tsx",
          code: `const warning = <strong>Careful</strong>;
const ok = <em>Fine</em>;

function Panel({ heading, body }) {
  return <section>{heading}{body}</section>;
}

function App() {
  const level = "warn";

  // Chosen with a ternary, collected into an array, passed as a prop.
  const badge = level === "warn" ? warning : ok;
  const bullets = ["one", "two"].map((t) => <li key={t}>{t}</li>);

  return (
    <Panel
      heading={<h2>Status</h2>}
      body={
        <div>
          {badge}
          <ul>{bullets}</ul>
        </div>
      }
    />
  );
}`,
          output: `<section><h2>Status</h2><div><strong>Careful</strong><ul><li>one</li><li>two</li></ul></div></section>`,
          explanation:
            "`warning` and `ok` are created once, at module level, and reused. That is safe precisely because elements are immutable descriptions — nothing that renders one can change it. Note also that `Panel` never knows whether `heading` came from a literal, a variable or a ternary.",
        },
      ],
    },
    {
      id: "creating-is-free",
      heading: "Creating an element does no work",
      body: [
        "`<ExpensiveChart data={huge} />` runs nothing. It allocates an object with two fields. The chart's function is not called, no DOM is touched, and `huge` is not read.",
        "This trips people up in the other direction too. A common instinct is to guard element creation — `{shouldShow ? <Chart /> : null}` — under the belief that creating the element is the cost. The cost is React rendering it, which the ternary does prevent; but writing `const chart = <Chart />` above and using it conditionally costs nothing extra.",
        "It is also why the `&&` and ternary patterns are cheap, and why passing elements around as props does not duplicate work.",
      ],
      examples: [
        {
          id: "creation-is-inert",
          title: "The component does not run until React renders it",
          lang: "tsx",
          code: `function Expensive() {
  console.log("Expensive actually ran");
  return <div>done</div>;
}

console.log("before creating the element");
const el = <Expensive />;
console.log("after creating the element — nothing ran yet");

function App() {
  return el;
}`,
          output: `before creating the element
after creating the element — nothing ran yet
Expensive actually ran
<div>done</div>`,
          explanation:
            "The log from inside `Expensive` appears only when React renders `App`, well after the element was created. An element is a note saying *what* to render; the function runs when React gets round to it.",
        },
      ],
    },
    {
      id: "inspecting",
      heading: "Working with elements you were handed",
      body: [
        "A component that receives elements sometimes needs to inspect or adjust them. Three APIs exist, and all three are worth knowing about mainly so you can recognise when *not* to use them.",
        "`isValidElement(value)` tells you whether something is a React element rather than a string or a number. `cloneElement(el, props)` returns a copy with props merged in. `Children.map` and `Children.toArray` iterate `children` safely, including when it is a single value rather than an array.",
        "The reason to be wary: all of them couple a parent to the shape of its children. A `Tabs` that clones every child to inject an `active` prop breaks the moment somebody wraps a tab in a `<div>`. Context, or an explicit prop, survives that.",
      ],
      examples: [
        {
          id: "clone-and-validate",
          title: "Cloning to inject a prop",
          lang: "tsx",
          code: `import { Children, cloneElement, isValidElement } from "react";

function Tab({ label, active }) {
  return <li className={active ? "on" : "off"}>{label}</li>;
}

function Tabs({ children, current }) {
  return (
    <ul>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? cloneElement(child, { active: i === current }) : child
      )}
    </ul>
  );
}

function App() {
  return (
    <Tabs current={1}>
      <Tab label="First" />
      <Tab label="Second" />
    </Tabs>
  );
}`,
          output: `<ul><li class="off">First</li><li class="on">Second</li></ul>`,
          explanation:
            "It works, and the coupling is visible: `Tabs` assumes its children are tabs and that injecting `active` means something to them. Wrap either `<Tab>` in a `<div>` and the prop lands on the div instead. The version of this that survives refactoring passes `current` through context and lets each `Tab` read it.",
        },
      ],
      pitfalls: [
        {
          title: "`Children.toArray` rewrites keys",
          body: "`Children.toArray` prefixes each child's key to keep them unique across the flattening it performs, so the keys you read back are not the keys you set. Do not use it to look a child up by key, and do not rely on the result's keys matching your data. It is for counting and flattening, not for identity.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `<Foo />` and `Foo()`?",
      answer:
        "`<Foo />` creates an element whose `type` is the function, and hands it to React — React then owns an instance with its own state and hook list, and decides when to call the function. `Foo()` calls the function immediately and yields whatever it returned, so React never sees `Foo` at all. The rendered HTML is identical, but the called version has no state of its own, contributes its hooks to the caller's hook list, and cannot be memoised, suspended or re-rendered independently.",
    },
    {
      question: "Does creating a React element do any work?",
      answer:
        "No. It allocates a plain object with `type`, `props` and `key`. The component function is not called and no DOM is touched until React renders that element. This is why storing elements in variables, passing them as props and building them ahead of a conditional are all free.",
    },
    {
      question: "Why can React skip re-rendering a subtree?",
      answer:
        "Because it holds descriptions rather than results. On a re-render React has the previous element tree and the new one, both plain immutable objects, so it can compare them — and where an element is identical by reference, or a memoised component's props are unchanged, it can reuse the previous output without calling the function again. If components returned finished DOM, there would be nothing to compare.",
    },
  ],
  takeaways: [
    "A component is a function, an element is a description of one appearance of it, an instance is React's internal record holding state",
    "`<Foo />` gives React an element to own; `Foo()` inlines the result and hides the component from React entirely",
    "Calling a component instead of rendering it costs it its state and mixes its hooks into the caller's hook list",
    "Elements are ordinary immutable values — store them, choose between them, collect them, pass them as props",
    "Creating an element runs nothing; the component function runs when React renders it",
    "`cloneElement` and `Children` work, but couple a parent to the shape of its children — prefer context or an explicit prop",
  ],
  status: "available",
};
