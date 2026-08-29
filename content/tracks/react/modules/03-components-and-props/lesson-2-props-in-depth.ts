import type { Lesson } from "@/content/types";

export const propsInDepthLesson: Lesson = {
  id: "react-props-in-depth",
  slug: "props-in-depth",
  moduleSlug: "components-and-props",
  title: "Props, Properly",
  summary:
    "Destructuring with defaults, collecting the rest, renaming, and forwarding a whole object onward — the small set of patterns that every component library is built from, and the two places a default value does not do what it looks like.",
  estimatedMinutes: 30,
  objectives: [
    "Destructure props with defaults, renaming and a rest object",
    "Say exactly when a default value applies and when it does not",
    "Forward unknown props onward without leaking your own",
    "Choose an order for spread and explicit props deliberately",
    "Recognise the boolean shorthand and what it passes",
  ],
  sections: [
    {
      id: "one-object",
      heading: "Props are one object, and destructuring is ordinary JavaScript",
      body: [
        "React calls your component with a single object. Everything else in this lesson is destructuring syntax you already know, applied to that object — there is no React-specific prop API to learn.",
        "Destructuring in the parameter list is the convention because it documents the component's interface in its signature: a reader sees what it accepts without reading the body.",
      ],
      examples: [
        {
          id: "destructuring-forms",
          title: "Defaults, renaming, and the rest",
          lang: "jsx",
          code: `function Field({
  label,                       // required, by convention rather than enforcement
  type = "text",               // default when the prop is absent or undefined
  id: htmlId,                  // renamed, because \`id\` would shadow something
  ...rest                      // everything the caller passed that we did not name
}) {
  return (
    <p>
      <label htmlFor={htmlId}>{label}</label>
      <input id={htmlId} type={type} {...rest} />
    </p>
  );
}

function App() {
  return (
    <>
      <Field label="Name" id="name" />
      <Field label="Age" id="age" type="number" min={0} max={120} required />
    </>
  );
}`,
          output: `<p><label for="name">Name</label><input id="name" type="text"/></p><p><label for="age">Age</label><input id="age" type="number" min="0" max="120" required=""/></p>`,
          explanation:
            "`min`, `max` and `required` were never named by `Field` and still reached the input, through `...rest`. That is the whole mechanism behind components that accept arbitrary DOM attributes. Note `required` with no value: the shorthand passes the boolean `true`, and React writes a present-but-empty attribute, which is what HTML means by a boolean attribute.",
        },
      ],
    },
    {
      id: "defaults",
      heading: "When a default actually applies",
      body: [
        "`type = \"text\"` applies when the prop is **`undefined`**. That is the only case — it is JavaScript's default-parameter rule, not a React one.",
        "So it applies when the caller omitted the prop, and also when the caller explicitly passed `undefined`. It does **not** apply for `null`, `0`, `\"\"` or `false`, all of which are values the caller chose.",
        "This is usually what you want and occasionally a trap: `<Field type={maybeType} />` where `maybeType` is `null` passes `null`, and the default never fires.",
      ],
      examples: [
        {
          id: "default-firing",
          title: "Which of these get the default",
          lang: "jsx",
          code: `function Show({ value = "DEFAULT" }) {
  return <li>{String(value)}</li>;
}

function App() {
  return (
    <ul>
      {/* omitted */}
      <Show />
      {/* explicitly undefined */}
      <Show value={undefined} />
      {/* null, zero, empty string, false — all values the caller chose */}
      <Show value={null} />
      <Show value={0} />
      <Show value="" />
      <Show value={false} />
    </ul>
  );
}`,
          output: `<ul><li>DEFAULT</li><li>DEFAULT</li><li>null</li><li>0</li><li></li><li>false</li></ul>`,
          explanation:
            "Only the first two got the default. `null` printed as the string `\"null\"` here because `String(null)` was called on it — rendered directly it would have shown nothing at all, which is the version of this bug that is genuinely hard to see. When a prop must fall back on `null` too, use `??` in the body rather than a parameter default.",
        },
      ],
      pitfalls: [
        {
          title: "`defaultProps` is gone for function components",
          body: "React 19 removed `Component.defaultProps` for function components — it is ignored, with a warning. Parameter defaults replace it entirely and have always been clearer, since they sit next to the name they apply to. If you meet `Foo.defaultProps = {…}` in an older codebase, moving it into the destructuring is a mechanical and safe change.",
        },
      ],
    },
    {
      id: "forwarding",
      heading: "Forwarding the rest, without leaking your own",
      visual: {
        id: "spread-precedence",
        kind: "react-jsx",
        algorithm: "props-spread-order",
        title: "Which side of the spread wins",
      },
      body: [
        "A component that wraps a DOM element should let callers pass any attribute that element accepts — `id`, `aria-*`, `data-*`, `onClick`, `title` — without listing them all. Collecting them with `...rest` and spreading them onto the element does exactly that.",
        "The rule is to **name every prop that is yours** in the destructuring, so it is removed from `rest`. Anything you forget stays in `rest`, lands on the DOM node, and since React 19 is written into the HTML with a warning rather than dropped.",
        "Where the spread goes decides who wins. Spread first and your own attributes override the caller's; spread last and the caller can override yours. Both are legitimate — a `Button` that must stay `type=\"button\"` spreads first; a `Box` meant to be fully customisable spreads last.",
      ],
      examples: [
        {
          id: "spread-position",
          title: "The same component, two spread positions",
          lang: "jsx",
          code: `// Spread first: the component's own type wins, always.
function SafeButton({ children, ...rest }) {
  return <button {...rest} type="button">{children}</button>;
}

// Spread last: the caller can override anything.
function OpenButton({ children, ...rest }) {
  return <button type="button" {...rest}>{children}</button>;
}

function App() {
  return (
    <>
      <SafeButton type="submit" className="a">Safe</SafeButton>
      <OpenButton type="submit" className="b">Open</OpenButton>
    </>
  );
}`,
          output: `<button type="button" class="a">Safe</button><button type="submit" class="b">Open</button>`,
          explanation:
            "The caller asked for `type=\"submit\"` in both cases. `SafeButton` refused — which is the point, since a button inside a form defaults to submitting and that is a classic accidental form submission. `OpenButton` allowed it. Neither is right in general; the choice is the component's contract, and it is worth making deliberately rather than by where the cursor happened to be.",
        },
      ],
      pitfalls: [
        {
          title: "Spreading everything onto a DOM node leaks your own props",
          body: "`function Row({ ...rest }) { return <div {...rest} /> }` forwards `isActive`, `variant` and every other prop of yours straight into the HTML. Since React 19 those are written to the DOM and warned about rather than dropped, so the page gains attributes like `isActive=\"true\"`. Name your own props in the destructuring; that is what takes them out of `rest`.",
        },
      ],
    },
    {
      id: "shapes",
      heading: "Passing a shape rather than a scatter of props",
      body: [
        "When six props all come from one object, consider passing the object. `<UserCard user={user} />` beats `<UserCard name={user.name} age={user.age} email={user.email} … />` — it is shorter, it stays correct when the shape gains a field, and it makes the dependency obvious.",
        "The counter-argument is coupling: a component that takes `user` can only ever render a user, while one taking `name` and `age` can render anything with a name and an age. For a leaf presentational component the scattered props are often more reusable; for a component that clearly belongs to one domain object, the object is clearer.",
        "The version to avoid is passing the object *and* pulling fields out of it in the caller, which gives you both problems at once.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When does a default value in destructured props apply?",
      answer:
        "Only when the value is `undefined` — either the prop was omitted or `undefined` was passed explicitly. It is JavaScript's default-parameter rule, so `null`, `0`, `\"\"` and `false` are all values the caller chose and the default does not fire for any of them. When a prop needs a fallback for `null` as well, handle it in the body with `??`.",
    },
    {
      question: "How does a component accept arbitrary DOM attributes without listing them?",
      answer:
        "By collecting the ones it does not name into a rest object and spreading that onto the element it renders — `function Row({ isActive, ...rest }) { return <div {...rest} /> }`. Naming its own props in the destructuring is what keeps them out of `rest`; anything forgotten lands in the HTML and, since React 19, is written there with a warning rather than being dropped.",
    },
    {
      question: "Does the position of a spread among JSX attributes matter?",
      answer:
        "Yes — it compiles to an ordinary object literal, so the last occurrence of a key wins. Spreading before your own attributes lets you guarantee them, which is how a `Button` keeps `type=\"button\"` whatever the caller passes; spreading after lets the caller override anything. It is a deliberate contract decision, not a formatting preference.",
    },
  ],
  takeaways: [
    "Props are one object; every pattern here is ordinary destructuring rather than a React API",
    "A parameter default fires only for `undefined` — not for `null`, `0`, `\"\"` or `false`",
    "`defaultProps` is removed for function components in React 19; parameter defaults replace it",
    "Naming a prop in the destructuring is what keeps it out of `...rest` and off the DOM node",
    "The spread's position decides who wins: spread first to guarantee your own attributes, last to let callers override",
    "A bare boolean attribute passes `true`, and React writes it as a present-but-empty HTML attribute",
  ],
  status: "available",
};
