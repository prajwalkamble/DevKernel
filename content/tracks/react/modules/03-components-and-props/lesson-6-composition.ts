import type { Lesson } from "@/content/types";

export const compositionLesson: Lesson = {
  id: "react-composition",
  slug: "composition-not-inheritance",
  moduleSlug: "components-and-props",
  title: "Composition Instead of Inheritance",
  summary:
    "React has no mechanism for one component to extend another, and has never needed one. The two things inheritance is normally reached for — containment and specialisation — are both ordinary props, and the patterns built on that are what every component library is made of.",
  estimatedMinutes: 30,
  objectives: [
    "Say why React offers no component inheritance, and what replaces it",
    "Distinguish containment from specialisation, and use props for each",
    "Read a higher-order component, and say why the pattern faded",
    "Choose between children, named slots, a render prop and a hook",
    "Recognise a compound component and what it is for",
  ],
  sections: [
    {
      id: "no-inheritance",
      heading: "There is no `extends`, and no gap where it would go",
      body: [
        "In an object-oriented UI toolkit, a `PrimaryButton` extends `Button` and overrides a method. React has no equivalent, deliberately: there is no way for one component to inherit another's rendering, and no supported way to override part of a component's output from outside.",
        "The reason is that components are functions returning values, and the natural way to combine functions is to call them and pass values around. Inheritance would add a second, weaker mechanism for something composition already does — and composition survives refactoring in a way that an inheritance hierarchy does not.",
        "Every case where inheritance is the instinct turns out to be one of two things, and both are props.",
      ],
    },
    {
      id: "two-cases",
      heading: "Containment and specialisation",
      body: [
        "**Containment** is a component that holds content it knows nothing about: a card, a dialog, a sidebar, a layout. It cannot know its contents in advance, so the contents arrive as `children`, or as named element props when there is more than one slot.",
        "**Specialisation** is a component that is a specific configuration of a general one: a `DangerDialog` is a `Dialog` with particular props. In an OO toolkit that is a subclass; here it is a component that renders the general one with those props filled in.",
        "The second is worth seeing written down, because it looks too simple to be the answer — and that simplicity is the point. A specialised component is a function call with some arguments already supplied.",
      ],
      examples: [
        {
          id: "specialisation",
          title: "A specialised component is a component that renders the general one",
          lang: "jsx",
          code: `// The general component. Knows nothing about danger.
function Dialog({ tone = "neutral", heading, children, action }) {
  return (
    <section className={\`dialog dialog--\${tone}\`}>
      <h2>{heading}</h2>
      <div>{children}</div>
      {action}
    </section>
  );
}

// The "subclass": a Dialog with some props decided in advance.
function DangerDialog({ heading, children }) {
  return (
    <Dialog
      tone="danger"
      heading={heading}
      action={<button type="button">Delete</button>}
    >
      {children}
    </Dialog>
  );
}

function App() {
  return (
    <DangerDialog heading="Delete project">
      <p>All 42 files will be removed.</p>
    </DangerDialog>
  );
}`,
          output: `<section class="dialog dialog--danger"><h2>Delete project</h2><div><p>All 42 files will be removed.</p></div><button type="button">Delete</button></section>`,
          explanation:
            "No inheritance, no override, no base class — `DangerDialog` renders `Dialog` and supplies two props. It can also add or remove props freely, which a subclass cannot: it deliberately does not expose `tone`, so nobody can create a `DangerDialog` that is not dangerous. Narrowing an interface is much harder in an inheritance hierarchy than in a wrapper.",
        },
      ],
    },
    {
      id: "hocs",
      heading: "Higher-order components, and why they faded",
      body: [
        "A higher-order component is a function that takes a component and returns a new one wrapping it. Before hooks it was the main way to share behaviour between components, and it is all over older codebases and library APIs — `connect()` from Redux, `withRouter`, `withStyles`.",
        "It is worth being able to read one. It is rarely worth writing a new one, for three reasons that were never solved: the props it injects are invisible at the call site, so you cannot tell where `user` came from; wrapping several deep produces a debugging tree full of anonymous wrappers; and the wrapper has to forward every prop and ref by hand, which is easy to get subtly wrong.",
        "Custom hooks replaced it for sharing logic, because a hook shares behaviour without adding anything to the tree and returns its values visibly at the call site. Module 10 writes them properly.",
      ],
      examples: [
        {
          id: "hoc",
          title: "A higher-order component, read rather than written",
          lang: "jsx",
          code: `// Takes a component, returns a component that renders it with an extra prop.
function withBadge(Wrapped, badge) {
  function WithBadge(props) {
    return (
      <span>
        <Wrapped {...props} />
        <sup>{badge}</sup>
      </span>
    );
  }
  // Without this the DevTools tree shows "WithBadge" for every wrapped component.
  WithBadge.displayName = \`withBadge(\${Wrapped.name})\`;
  return WithBadge;
}

function Name({ children }) {
  return <strong>{children}</strong>;
}

const NameWithBadge = withBadge(Name, "new");

function App() {
  return <NameWithBadge>Ada</NameWithBadge>;
}`,
          output: `<span><strong>Ada</strong><sup>new</sup></span>`,
          explanation:
            "`{...props}` is doing the load-bearing work, and it is where these go wrong: forget it and the wrapped component receives nothing. Note also that `NameWithBadge` is created **at module level**. Calling `withBadge(Name, \"new\")` inside a component would produce a new component type on every render, which is the nested-component bug from lesson 1 wearing a different hat.",
        },
      ],
      pitfalls: [
        {
          title: "Never create a wrapped component during render",
          body: "`const Wrapped = withSomething(Inner)` inside a component body runs on every render and returns a new function each time, so React sees a new element type and destroys and rebuilds the subtree — losing all its state. Higher-order components must be applied once, at module scope. The same rule applies to `React.memo`, `forwardRef` and `lazy`.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between the four",
      body: [
        "**`children`** when the component provides a shape and the caller provides content. The default answer, and usually the right one.",
        "**Named element props** when there are two or three distinct slots. Clearer than splitting `children`, and immune to a caller adding a wrapper.",
        "**A render prop** when the component owns data *and* the markup structure around it, and the caller fills in the parts inside — the table from the previous lesson, where the component owns the rows and keys.",
        "**A custom hook** when what is shared is behaviour with no markup at all: subscriptions, timers, form state, a fetch. Nothing appears in the tree, and the caller can see exactly what it received.",
        "If two of these look equally good, prefer the one that puts fewer components in the tree — every wrapper is a thing to scroll past in DevTools and a boundary that props have to cross.",
      ],
    },
    {
      id: "compound",
      heading: "Compound components, briefly",
      visual: {
        id: "composition-compound-visual",
        kind: "react-patterns",
        algorithm: "compound",
        title: "Sharing state without inheriting it",
      },
      body: [
        "A compound component is a set of components designed to be used together, where the parent holds the state and the children read it — `<Tabs>` with `<Tabs.List>` and `<Tabs.Panel>`, or a `<Select>` with its `<Option>`s.",
        "It gives the caller control over structure and ordering while keeping the coordinating logic in one place. The children find the shared state through context rather than by being cloned, which is what makes it survive a caller wrapping something in a `<div>`.",
        "Module 14 builds one properly, once context is available. It is mentioned here because it is the pattern people are reaching for when they try to clone children and inject props, and it is the version that works.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does React not support component inheritance?",
      answer:
        "Because composition already covers what inheritance is used for, and does it with fewer rules. Containment — a component holding content it does not know about — is `children` or named element props. Specialisation — a specific configuration of a general component — is a component that renders the general one with some props supplied. A wrapper can also narrow the interface, hiding props a caller should not set, which a subclass cannot do.",
    },
    {
      question: "What is a higher-order component, and should you write one today?",
      answer:
        "A function that takes a component and returns a new component wrapping it, usually to inject props. It was the pre-hooks way to share behaviour, and you should be able to read one because older code and library APIs are full of them. For new code a custom hook is almost always better: it adds nothing to the tree, the values it returns are visible at the call site, and there is no prop or ref forwarding to get wrong.",
    },
    {
      question: "Why must a higher-order component be applied outside of render?",
      answer:
        "Because it returns a new function every time it is called. Applying it during render produces a different component type on each render, so reconciliation sees the type change, destroys the subtree and mounts a fresh one — losing all state and DOM state every time the parent renders. It has to happen once at module scope, and the same applies to `memo`, `forwardRef` and `lazy`.",
    },
  ],
  takeaways: [
    "React has no component inheritance, and the two things it would be used for are both ordinary props",
    "Containment is `children` or named element props; specialisation is a component that renders the general one",
    "A wrapper can narrow an interface — hiding a prop so a `DangerDialog` cannot be made non-dangerous — which a subclass cannot",
    "Higher-order components are worth reading and rarely worth writing; custom hooks replaced them for sharing logic",
    "Never create a wrapped, memoised or lazy component during render — it changes type identity every time",
    "Prefer whichever option puts fewer components in the tree",
  ],
  status: "available",
};
