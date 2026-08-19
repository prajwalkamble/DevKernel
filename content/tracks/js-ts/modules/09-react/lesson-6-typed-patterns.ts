import type { Lesson } from "@/content/types";

export const typedPatternsLesson: Lesson = {
  id: "react-ts-patterns",
  slug: "typing-common-patterns",
  moduleSlug: "react",
  title: "Typing Common React Patterns",
  summary:
    "The patterns real component libraries are built from — controlled inputs, render props, compound components — and what changes about each one when the types have to hold.",
  estimatedMinutes: 35,
  objectives: [
    "Type a controlled input, including the optional-value case",
    "Type a render prop, and know when children-as-a-function is better",
    "Type compound components sharing state through context",
    "Type a component that is controlled or uncontrolled",
    "Recognise which patterns type cleanly and which fight the compiler",
  ],
  sections: [
    {
      id: "controlled",
      heading: "Controlled inputs",
      body: [
        "The controlled pattern — value in, change out — types almost trivially. What is worth getting right is the **generic version**, where the value is not a string, and the **optional-value version**, where a component can be either controlled or uncontrolled.",
      ],
      examples: [
        {
          id: "controlled-generic",
          title: "Controlled over any value type",
          lang: "tsx",
          code: `interface FieldProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  // Parse is only needed when T is not a string — so the two are tied together.
  parse: (raw: string) => T;
  format: (value: T) => string;
}

function Field<T>({ label, value, onChange, parse, format }: FieldProps<T>) {
  return (
    <label>
      {label}
      <input value={format(value)} onChange={(event) => onChange(parse(event.target.value))} />
    </label>
  );
}

// <Field<number>
//   label="Age"
//   value={age}
//   onChange={setAge}
//   parse={(raw) => Number(raw)}
//   format={String}
// />

// A specialised wrapper is usually nicer at the call site than a generic
// one used with explicit type arguments.
function NumberField(props: Omit<FieldProps<number>, "parse" | "format">) {
  return <Field {...props} parse={Number} format={String} />;
}`,
          explanation:
            "The `Omit` in `NumberField` is the useful trick: it derives its props from the generic component, so adding a prop to `Field` automatically reaches the wrapper and nothing drifts. Note also that this is a case where an explicit type argument at the call site is a smell — hence the wrapper.",
        },
        {
          id: "controlled-or-not",
          title: "Controlled or uncontrolled, in one component",
          lang: "tsx",
          code: `// A discriminated union will not help here, because the discriminant is
// the *presence* of a prop rather than a value. Two optional props plus
// internal state is the standard shape.
interface ToggleProps {
  /** Controlled: supply both, and the parent owns the state. */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Uncontrolled: supply this instead, and the component owns it. */
  defaultChecked?: boolean;
}

function Toggle({ checked, onChange, defaultChecked = false }: ToggleProps) {
  const [internal, setInternal] = useState(defaultChecked);

  // The presence of \`checked\` decides which mode we are in.
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internal;

  function handleChange(next: boolean) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <input
      type="checkbox"
      checked={value}
      onChange={(event) => handleChange(event.target.checked)}
    />
  );
}`,
          explanation:
            "This is exactly how Radix, MUI and React's own form elements handle it. Two details matter. `onChange` is called in **both** modes, so a controlled parent is notified and an uncontrolled one can still observe. And `checked !== undefined` is the test — not truthiness, because `checked={false}` is a perfectly valid controlled value.",
        },
      ],
      pitfalls: [
        {
          title: "Switching between controlled and uncontrolled mid-life",
          body: "If `checked` starts `undefined` and later becomes a boolean — commonly because it is loaded asynchronously — the component silently changes mode and React logs a warning about an input changing from uncontrolled to controlled. The types cannot catch it, because both props are legitimately optional. Decide the mode once, from whether the prop was present on the first render.",
        },
      ],
    },
    {
      id: "render-props",
      heading: "Render props and children-as-a-function",
      body: [
        "A render prop is a prop whose value is a function returning UI. It types cleanly, and it is the mechanism behind the generic `List` in the previous lesson.",
        "The type is `(args) => ReactNode` — **not** `=> JSX.Element`, because a renderer is allowed to return `null`, a string, or a fragment.",
        "`children` can be that function too, which reads better when there is exactly one renderer.",
      ],
      examples: [
        {
          id: "render-prop",
          title: "Both forms, and the type they share",
          lang: "tsx",
          code: `import type { ReactNode } from "react";

// As a named prop: clearest when there are several renderers.
interface DataViewProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
}

function DataView<T>({ items, renderItem, renderEmpty }: DataViewProps<T>) {
  if (items.length === 0) return <>{renderEmpty?.() ?? <p>Nothing here.</p>}</>;
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item, i)}</li>)}</ul>;
}

// As children: nicer when there is exactly one.
interface MouseTrackerProps {
  children: (position: { x: number; y: number }) => ReactNode;
}

function MouseTracker({ children }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <>{children(position)}</>;
}

// The call site reads well, and \`position\` is fully typed:
// <MouseTracker>{(position) => <span>{position.x}, {position.y}</span>}</MouseTracker>`,
          explanation:
            "Note the `MouseEvent` in the effect is the **DOM** one, not React's synthetic type — because `window.addEventListener` is a DOM API, not a React prop. Importing React's `MouseEvent` there produces a mismatch that reads very strangely, and it is the most common way this specific pattern goes wrong.",
        },
      ],
      pitfalls: [
        {
          title: "A custom hook is usually the better answer now",
          body: "Render props existed largely to share stateful logic before hooks. `useMousePosition()` returning `{ x, y }` does the same job with no extra element in the tree, no nesting, and simpler types. Render props still earn their place when the component controls *rendering* — a virtualised list, a headless combobox — rather than merely sharing state.",
        },
      ],
    },
    {
      id: "compound",
      heading: "Compound components",
      body: [
        "A compound component is a set of parts that share state implicitly — `<Tabs>`, `<Tabs.List>`, `<Tabs.Tab>`, `<Tabs.Panel>` — so the caller composes the markup while the parent owns the behaviour.",
        "The typing is the context pattern from lesson 4, plus one decision: how the parts are exposed. Attaching them as properties of the parent (`Tabs.Tab`) gives a tidy call site; separate named exports type more simply and tree-shake better. Both are common.",
      ],
      examples: [
        {
          id: "compound-tabs",
          title: "Tabs, typed",
          lang: "tsx",
          code: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

// The same guard hook as lesson 4 — parts used outside <Tabs> fail loudly.
function useTabs(): TabsContextValue {
  const value = useContext(TabsContext);
  if (!value) throw new Error("Tabs parts must be used inside <Tabs>");
  return value;
}

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
}

export function Tabs({ defaultValue, children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  // Memoised: a fresh object here re-renders every part on any parent render.
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button role="tab" aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  );
}

function Panel({ value, children }: { value: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === value ? <div role="tabpanel">{children}</div> : null;
}

// Attaching the parts. TypeScript handles this without any assertion.
Tabs.Tab = Tab;
Tabs.Panel = Panel;

// <Tabs defaultValue="a">
//   <Tabs.Tab value="a">First</Tabs.Tab>
//   <Tabs.Panel value="a">…</Tabs.Panel>
// </Tabs>`,
          explanation:
            "`Tabs.Tab = Tab` works because a function is an object, and TypeScript records the added property on the declared function's type. It only works on a `function` declaration — assigning a property to an arrow function stored in a `const` gives \"Property 'Tab' does not exist on type …\", which is another reason components in libraries are written as declarations.",
        },
      ],
      pitfalls: [
        {
          title: "You cannot type-check which children are passed",
          body: "There is no way to say \"`<Tabs>` accepts only `<Tabs.Tab>` and `<Tabs.Panel>` children\" — `children` is `ReactNode` and TypeScript cannot inspect the elements inside it. Attempts to restrict it with `ReactElement<TabProps>` fail as soon as a caller wraps a part in a fragment, a conditional or a `map`. The guard hook is the enforcement: a part used outside its parent throws immediately with a clear message, which is the best available answer.",
        },
      ],
    },
    {
      id: "wrapping-up",
      heading: "Which patterns type well",
      body: [
        "A rough ranking, from the ones types make better to the ones types make harder.",
        "**Type beautifully.** Controlled components, render props, generic list and table components, custom hooks, discriminated-union props. In each case the types add real safety and the signatures stay readable.",
        "**Type acceptably.** Compound components — the context is clean, the child restriction is simply not expressible. Polymorphic `as` props — correct, but the errors are dense.",
        "**Fight back.** Higher-order components, which have to reproduce and re-wrap the wrapped component's props and lose inference in the process; and anything that inspects or manipulates `children` at runtime, which TypeScript cannot see into at all. Both largely disappeared with hooks, and where you meet them in older code the honest approach is usually to replace them rather than to type them perfectly.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you type a component that can be controlled or uncontrolled?",
      answer:
        "Two optional props — `value`/`onChange` for controlled and `defaultValue` for uncontrolled — plus internal state, with the mode decided by whether the controlled prop is `undefined`. A discriminated union does not help, because the discriminant is the presence of a prop rather than its value. Test with `value !== undefined`, not truthiness, since `false` and `0` are valid controlled values.",
    },
    {
      question: "What type should a render prop have?",
      answer:
        "`(args) => ReactNode`. Not `=> JSX.Element`, because a renderer may legitimately return `null`, a string, a number or a fragment, and the narrower type rejects all of those. The same applies to a children-as-a-function prop, which is the same pattern with a different name.",
    },
    {
      question: "How do compound components share state, and can you restrict their children?",
      answer:
        "Through context, with a guard hook that throws when a part is used outside its parent. You cannot restrict which children are passed — `children` is `ReactNode` and TypeScript cannot inspect it, and any attempt to require specific element types breaks as soon as a caller uses a fragment, a conditional or a `map`. The runtime guard is the enforcement mechanism.",
    },
    {
      question: "Why does `Tabs.Tab = Tab` type-check, and when does it not?",
      answer:
        "A function is an object, so TypeScript records the assigned property on the function's type — but only for a `function` declaration. Assigning a property to an arrow function held in a `const` produces \"Property 'Tab' does not exist\", because the const's type is fixed at the annotation. It is one of several reasons library components are usually written as function declarations.",
    },
  ],
  takeaways: [
    "Controlled components type trivially; the generic version should be wrapped in a specialised component rather than used with explicit type arguments",
    "Controlled-or-uncontrolled is two optional props plus internal state, with the mode decided by `value !== undefined`",
    "Deriving a wrapper's props with `Omit<Props, …>` keeps it in sync with the component it wraps",
    "A render prop returns `ReactNode`, never `JSX.Element`",
    "In an effect, `addEventListener` gives you the DOM event types, not React's synthetic ones",
    "Compound components share state through a context plus a guard hook; restricting which children are passed is not expressible",
    "`Tabs.Tab = Tab` works on function declarations, not on arrow functions in a const",
    "Higher-order components and runtime children manipulation are the two patterns that genuinely fight the type system",
  ],
  status: "available",
};
