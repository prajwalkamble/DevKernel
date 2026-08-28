import type { Lesson } from "@/content/types";

export const propsLesson: Lesson = {
  id: "react-props",
  slug: "props",
  moduleSlug: "foundations",
  title: "Props: Passing Data Into a Component",
  summary:
    "What props are, how they get from a parent to a child, why they are read-only, what `children` really is, and how one-way data flow makes a React application possible to reason about.",
  estimatedMinutes: 35,
  objectives: [
    "Pass props to a component and read them inside it",
    "Destructure props and give them default values",
    "Explain why props are read-only, and what breaks when you mutate them",
    "Use `children` and understand that it is an ordinary prop",
    "Pass functions as props to send data back up",
    "Type props with TypeScript",
  ],
  sections: [
    {
      id: "what-props-are",
      heading: "Props are the arguments of a component",
      visual: {
        id: "props-flow-down",
        kind: "react-rendering",
        algorithm: "props-down",
        title: "One-way data flow, one prop at a time",
      },
      body: [
        "A component is a function, and **props are how you pass it arguments.** That is the whole concept; everything else is detail.",
        "The mechanics: in JSX you write attributes on the element, and React collects every one of them into a single object and passes it as the function's first parameter. By convention that parameter is called `props`.",
        "Strings can be written in quotes. **Anything else goes in braces** — numbers, booleans, arrays, objects, functions, other elements. `count=\"3\"` passes the string `\"3\"`; `count={3}` passes the number.",
      ],
      examples: [
        {
          id: "props-basics",
          title: "Passing and reading",
          lang: "tsx",
          code: `function UserCard(props) {
  return (
    <article>
      <h3>{props.name}</h3>
      <p>{props.age} years old</p>
      {props.isAdmin && <span className="badge">admin</span>}
    </article>
  );
}

function App() {
  return (
    <div>
      <UserCard name="Ada" age={36} isAdmin={true} />
      <UserCard name="Grace" age={45} isAdmin={false} />

      {/* A bare attribute is shorthand for {true}. */}
      <UserCard name="Alan" age={41} isAdmin />
    </div>
  );
}`,
          output: `<div><article><h3>Ada</h3><p>36 years old</p><span class="badge">admin</span></article><article><h3>Grace</h3><p>45 years old</p></article><article><h3>Alan</h3><p>41 years old</p><span class="badge">admin</span></article></div>`,
          explanation:
            "Three uses of the same component, each with its own data and no shared state. Note `age={36}` in braces: written as `age=\"36\"` it would be the string `\"36\"`, and `props.age - 1` would then produce `35` by coercion in JavaScript but a type error in TypeScript — the sort of bug that is much cheaper to prevent than to find.",
        },
      ],
    },
    {
      id: "destructuring",
      heading: "Destructuring and defaults",
      body: [
        "Writing `props.` in front of everything gets old immediately, so almost all real React destructures the parameter. This is plain JavaScript destructuring — nothing React-specific about it — and it has the pleasant side effect of documenting the component's entire interface in its signature.",
        "Default values come from the same JavaScript feature, and they apply when the prop is `undefined` — which includes not passing it at all.",
      ],
      examples: [
        {
          id: "props-destructure",
          title: "The form you will actually write",
          lang: "tsx",
          code: `// The signature is now the documentation.
function Button({ label, variant = "secondary", disabled = false, onClick }) {
  return (
    <button className={\`btn btn-\${variant}\`} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

// Collect the rest, and spread them onto the underlying element. This is how
// component libraries let you pass any DOM attribute through.
function Input({ label, id, ...rest }) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </>
  );
}

function App() {
  return (
    <form>
      <Input label="Email" id="email" type="email" required placeholder="you@example.com" />
      <Button label="Send" variant="primary" />
      <Button label="Cancel" />
    </form>
  );
}`,
          explanation:
            "`{...rest}` spreads the remaining props onto the `<input>`, so `type`, `required` and `placeholder` reach the DOM without `Input` having to know about them. This is the single most useful pattern for building reusable components, and TypeScript can type it exactly (`ComponentProps<\"input\">`).",
        },
      ],
      pitfalls: [
        {
          title: "A default only applies to `undefined`, not to every falsy value",
          body: "`function Card({ count = 10 })` gives you 10 when the prop is missing or explicitly `undefined`. Pass `count={0}` or `count={null}` and you get `0` and `null` — defaults are not `||`. This is usually what you want, and it surprises people who expected otherwise.",
        },
      ],
    },
    {
      id: "read-only",
      heading: "Props are read-only, and why that matters",
      body: [
        "**A component must never modify its own props.** Not `props.name = \"x\"`, not `props.items.push(item)`, not sorting an array prop in place.",
        "The reason is the guarantee the whole model rests on: given the same props, a component produces the same output. React relies on that to decide what to re-render and when it can skip work. A component that mutates its props breaks the guarantee, and the failure mode is not an error — it is a component that shows stale data, or a sibling that changes when it should not have, appearing only in some orderings.",
        "The rule in one sentence: **data flows down, and changes flow up.** A child that wants something to change does not change it — it calls a function its parent gave it, and the parent changes its own state. React calls this *one-way data flow*, and it means that when a value is wrong you can find the single place that owns it rather than searching everywhere it is used.",
      ],
      examples: [
        {
          id: "props-mutation",
          title: "The mutation bug, and the fix",
          lang: "tsx",
          code: `// WRONG: sort() sorts in place, so this mutates the parent's array.
function ScoreList({ scores }) {
  const ordered = scores.sort((a, b) => b - a);   // mutates \`scores\`!
  return <ol>{ordered.map((s) => <li key={s}>{s}</li>)}</ol>;
}

// RIGHT: copy first. toSorted() returns a new array and never mutates.
function ScoreListFixed({ scores }) {
  const ordered = scores.toSorted((a, b) => b - a);
  return <ol>{ordered.map((s) => <li key={s}>{s}</li>)}</ol>;
}

// Also right, and works everywhere:
//   const ordered = [...scores].sort((a, b) => b - a);`,
          explanation:
            "`sort`, `reverse`, `splice`, `push` and `pop` all mutate. `toSorted`, `toReversed`, `toSpliced`, `map`, `filter`, `slice` and `concat` all return a new array. When an array or object arrives as a prop, treat it as borrowed: read it, copy it, never write to it.",
        },
        {
          id: "props-callbacks",
          title: "Changes flow up: passing a function down",
          lang: "tsx",
          code: `function SearchInput({ value, onChange, onClear }) {
  // This component owns no state. It renders what it is given and
  // reports what happened; the parent decides what that means.
  return (
    <div>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      {value !== "" && (
        <button type="button" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} />
      <p>Searching for: {query || "everything"}</p>
    </>
  );
}`,
          explanation:
            "`SearchInput` has no state of its own — the value comes down as a prop and every change goes back up through a callback. This is the *controlled component* pattern, and it is why the `<p>` below stays in sync automatically. The convention is `onSomething` for the prop and `handleSomething` for the function that implements it.",
        },
      ],
    },
    {
      id: "children",
      heading: "children is just a prop",
      body: [
        "Whatever you put *between* a component's opening and closing tags arrives as a prop called `children`. There is nothing special about it beyond the syntax — you could pass `children=\"hello\"` explicitly and it would work identically.",
        "This is what makes wrapper components possible: a `Card`, a `Modal`, a `Layout` can accept arbitrary content without knowing anything about it. It is React's answer to slots, and it is the most important composition tool in the library.",
      ],
      examples: [
        {
          id: "children-prop",
          title: "Wrappers, and passing elements as ordinary props",
          lang: "tsx",
          code: `function Card({ title, children, footer }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </section>
  );
}

function App() {
  return (
    <Card
      title="Welcome"
      /* An element in a prop — \`children\` has no monopoly on this. */
      footer={<a href="/more">Read more</a>}
    >
      <p>Anything at all can go here.</p>
      <p>Including several elements.</p>
    </Card>
  );
}`,
          output: `<section class="card"><h3>Welcome</h3><div class="card-body"><p>Anything at all can go here.</p><p>Including several elements.</p></div><div class="card-footer"><a href="/more">Read more</a></div></section>`,
          explanation:
            "`footer` demonstrates that passing elements is not limited to `children`. When a component needs two or three distinct slots, named element props are clearer than trying to inspect and split `children`.",
        },
      ],
    },
    {
      id: "typing",
      heading: "Typing props",
      body: [
        "In a TypeScript project, props are the main place types pay for themselves. A wrong prop name or a string where a number belongs becomes an error in your editor rather than a rendering oddity later.",
        "Note two React 19 details that older material gets wrong. **`React.FC` no longer implies `children`** — if a component takes children, say so. And **`ref` is now an ordinary prop**, so `forwardRef` is no longer needed just to accept one.",
      ],
      examples: [
        {
          id: "props-typescript",
          title: "The three forms worth knowing",
          lang: "tsx",
          code: `import type { ComponentProps, ReactNode } from "react";

// 1. An explicit interface — the default choice.
interface CardProps {
  title: string;
  footer?: ReactNode;        // optional
  children: ReactNode;       // must be declared; React 19 does not add it
}

function Card({ title, footer, children }: CardProps) {
  return <section>{title}{children}{footer}</section>;
}

// 2. A union, so invalid combinations cannot be expressed at all.
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
}

function Button({ label, variant = "secondary", onClick }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{label}</button>;
}

// 3. Extending a DOM element's own props, for pass-through components.
type InputProps = ComponentProps<"input"> & { label: string };

function Input({ label, id, ...rest }: InputProps) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </>
  );
}`,
          explanation:
            "`ComponentProps<\"input\">` is the one worth remembering: it gives you every attribute a real `<input>` accepts, correctly typed, including `ref`. Writing that list by hand is both tedious and always slightly wrong.",
        },
      ],
      pitfalls: [
        {
          title: "`variant?: string` is a missed opportunity",
          body: "Typing a variant as `string` accepts `\"primry\"` and every other typo. A union of literals (`\"primary\" | \"secondary\" | \"danger\"`) makes the invalid values unrepresentable and gives you autocomplete at every call site. Whenever a prop has a known set of values, spell them out.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are props, and why are they read-only?",
      answer:
        "Props are the arguments passed to a component: React collects the JSX attributes into one object and hands it to the function. They are read-only because React's model depends on a component producing the same output for the same props — that is what lets it skip work and reason about what changed. Mutating props breaks that guarantee silently, producing stale renders rather than errors.",
    },
    {
      question: "What is one-way data flow, and how does a child change data it does not own?",
      answer:
        "Data flows down through props from parent to child, and only the owner of a piece of state can change it. A child that needs something changed receives a callback as a prop and calls it; the parent then updates its own state, re-renders, and passes the new value back down. The benefit is that every value has exactly one place it can be changed.",
    },
    {
      question: "Is `children` special?",
      answer:
        "Only syntactically. Content written between a component's tags is collected into a prop named `children`, but it behaves like any other prop and can be passed explicitly. That is why you can just as well pass elements through named props when a component needs several distinct slots.",
    },
  ],
  takeaways: [
    "Props are a component's arguments; JSX attributes become one object passed to the function",
    "Strings can use quotes, everything else needs braces — `age=\"36\"` is a string, `age={36}` is a number",
    "Destructure in the signature so the component's interface documents itself; defaults apply only to `undefined`",
    "Props are read-only — copy arrays before sorting, and never write to an object you received",
    "Data flows down through props and changes flow up through callbacks, so every value has one owner",
    "`children` is an ordinary prop, and elements can be passed through named props too",
    "In React 19, `React.FC` does not imply children and `ref` is a normal prop; `ComponentProps<\"input\">` types pass-through components properly",
  ],
  status: "available",
};
