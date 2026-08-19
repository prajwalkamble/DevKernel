import type { Lesson } from "@/content/types";

export const tsxTypingLesson: Lesson = {
  id: "modules-tooling-tsx",
  slug: "tsx-typing-components",
  moduleSlug: "modules-tooling",
  title: "TSX: Typing JSX",
  summary:
    "Everything the type checker adds to JSX: what changes in a .tsx file, how to type props and children, the React type vocabulary worth memorising, generic and polymorphic components, and the JSX namespace that makes it all work.",
  estimatedMinutes: 35,
  objectives: [
    "Know what .tsx enables and the one syntax it takes away",
    "Type props, children and mutually exclusive prop combinations",
    "Choose correctly between ReactNode, ReactElement, ComponentProps and the event types",
    "Write generic and polymorphic components, and extend the JSX namespace",
  ],
  sections: [
    {
      id: "tsx-vs-ts",
      heading: "What .tsx changes",
      body: [
        "The `.tsx` extension turns on JSX parsing, and that has one cost: the angle-bracket type assertion is gone. `<string>value` is now the opening of a JSX element, so `value as string` is the only form available — which is why modern codebases use `as` everywhere and the older syntax survives only in `.ts` files.",
        "The same ambiguity bites generic arrow functions. `const first = <T>(items: T[]) => items[0]` parses as an unclosed `<T>` element and produces a cascade of syntax errors. The conventional fix is a trailing comma — `<T,>(items: T[]) => ...` — which is unambiguous because a JSX element name cannot be followed by one. Adding a constraint (`<T extends unknown>`) works too. A `function` declaration has no such problem, which is a reasonable argument for preferring one.",
        "Everything else is additive. Elements are typechecked against the props their component or intrinsic element declares, children are checked, and the return type of a component is inferred as an element type. Nothing about JSX becomes harder to write — the checker just starts catching the mistakes.",
      ],
      examples: [
        {
          id: "tsx-file-example",
          title: "The two syntaxes .tsx takes away",
          ts: `// Generic.tsx
// Fine in a .ts file; in .tsx this is a JSX element that never closes.
// const first = <T>(items: T[]) => items[0];

// The trailing comma disambiguates it — a JSX tag name can't be followed by one
const first = <T,>(items: T[]): T | undefined => items[0];

// A constraint does the same job, and reads better when you needed one anyway
const last = <T extends unknown>(items: T[]): T | undefined => items[items.length - 1];

// A function declaration is never ambiguous
function middle<T>(items: T[]): T | undefined {
  return items[Math.floor(items.length / 2)];
}

// Angle-bracket assertions are unavailable too: use \`as\`
const parsed = JSON.parse("{}") as { id: number };

console.log(first([1, 2]), last(["a"]), middle([true]), parsed);`,
          explanation:
            "The trailing comma looks like a typo forever. If it bothers you, `<T extends unknown>` is the same thing spelled out, and a plain `function` declaration sidesteps the question — which is part of why component definitions are so often written as declarations rather than arrows.",
        },
      ],
    },
    {
      id: "typing-props",
      heading: "Typing props and children",
      body: [
        "A component is a function, so its props are just its parameter type. Declare them inline for one-offs and as a named `type` or `interface` for anything reused — `interface` gets you declaration merging and slightly better error messages on large objects, `type` gets you unions and mapped types. Defaults come from ordinary destructuring defaults, which the checker understands, so a prop with a default can still be declared optional.",
        "Children are a normal prop named `children`, typed `ReactNode` when you'll accept anything renderable. `PropsWithChildren<P>` is a small helper that adds `children?: ReactNode` to your own props type. Neither is magic — you can and often should type children more narrowly, such as `children: string` for a component that puts them in an attribute.",
        "`React.FC` used to be the standard way to type a component, and it isn't any more. Until `@types/react` 18 it implicitly added `children` to every component, which meant components that accepted no children still typechecked when given some; the fix removed the implicit `children`, and with that gone `FC` mostly just constrains the return type while making generics awkward. Typing the props parameter directly is the current default.",
        "For props that are genuinely mutually exclusive, reach for a discriminated union — the same pattern as Module 6, applied to a component's API. It's the difference between documenting \"pass `href` or `onClick`, not both\" and having the compiler enforce it.",
      ],
      examples: [
        {
          id: "props-types-example",
          title: "Props, defaults, children, and impossible combinations",
          ts: `// Props.tsx
import { type PropsWithChildren, type ReactNode } from "react";

interface PanelProps {
  title: string;
  collapsed?: boolean; // optional
  footer?: ReactNode; // any renderable value, passed as a prop
  children?: ReactNode;
}

function Panel({ title, collapsed = false, footer, children }: PanelProps) {
  return (
    <section>
      <h3>{title}</h3>
      {!collapsed && children}
      {footer}
    </section>
  );
}

// The same thing with the helper: your props, plus children?: ReactNode
function Card({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <article>
      <h4>{title}</h4>
      {children}
    </article>
  );
}

// Mutually exclusive props, enforced rather than documented
type ActionProps =
  | { as: "button"; onClick: () => void }
  | { as: "link"; href: string };

function Action(props: ActionProps) {
  if (props.as === "link") return <a href={props.href}>go</a>;
  return <button onClick={props.onClick}>go</button>;
}

const ok = <Action as="link" href="https://example.com" />;

const wrong = <Action as="link" onClick={() => {}} />;
// Error: Type '{ as: "link"; onClick: () => void; }' is not assignable to type
//        'IntrinsicAttributes & ActionProps'.

console.log(Panel, Card, ok, wrong);`,
          explanation:
            "The `Action` union is worth the extra three lines. Without it the props type is `{ as: string; onClick?: ...; href?: ... }`, every branch needs a runtime check the compiler can't help with, and nothing stops a caller passing both — the exact \"impossible state\" problem Module 6 solved for data, applied to a component's API.",
        },
      ],
      pitfalls: [
        {
          title: "React.FC no longer implies children",
          body: "`const Panel: React.FC<{ title: string }> = ({ title, children }) => ...` was correct code until `@types/react` 18, and is now an error — `Property 'children' does not exist on type '{ title: string; }'`. The implicit children were removed deliberately, because they meant every component silently accepted children it would then ignore. Add `children` to the props type explicitly, or use `PropsWithChildren`. The wider lesson is that `React.FC` buys very little now and complicates generic components, so most codebases have stopped using it.",
        },
      ],
    },
    {
      id: "react-type-vocabulary",
      heading: "The vocabulary worth memorising",
      body: [
        "**`ReactNode`** is anything React can render: elements, strings, numbers, `null`, `undefined`, booleans, and arrays of those. It's what you want for `children` and for slot-like props. **`ReactElement`** is specifically an element object — the thing a JSX expression evaluates to — so it excludes strings and `null` and is the right type when you genuinely need an element to clone or inspect. Using `ReactElement` for children is a common over-restriction: it rejects `<Panel>hello</Panel>`.",
        "**`JSX.Element`** is React's element type under a different name, and in React 19's type definitions the global `JSX` namespace is gone — it now lives inside the React module. Unqualified `JSX.Element` fails with \"Cannot find namespace 'JSX'\"; write `React.JSX.Element`, or import it: `import { type JSX } from \"react\"`. In practice you rarely need any of the three, because a component's return type infers correctly on its own.",
        "**`ComponentProps<T>`** extracts the props of a component or intrinsic element, so `ComponentProps<\"button\">` is every attribute a `<button>` accepts and `ComponentProps<typeof Panel>` is whatever `Panel` takes. Intersecting it with your own props is the standard way to build a wrapper that forwards everything: `type IconButtonProps = ComponentProps<\"button\"> & { icon: string }`. The `WithoutRef` and `WithRef` variants exist for the cases where `ref` needs excluding or including explicitly.",
        "Events are generic over the element: `ChangeEvent<HTMLInputElement>` gives `event.target.value` its correct type, `MouseEvent<HTMLButtonElement>` types a click. You rarely have to write them — an inline arrow in `onChange={...}` gets the parameter type from the element — but a handler extracted to a named function does need the annotation. And in React 19 `ref` is an ordinary prop on function components, so `forwardRef` is no longer needed to accept one.",
      ],
      examples: [
        {
          id: "react-types-example",
          title: "ReactNode, ComponentProps, events, and ref as a prop",
          ts: `// Vocabulary.tsx
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

// ReactNode accepts everything renderable; ReactElement accepts only elements
const node: ReactNode = "a bare string is renderable";
const element: ReactElement = "a bare string is not an element";
// Error: Type 'string' is not assignable to type 'ReactElement<unknown,
//        string | JSXElementConstructor<any>>'.

// The global JSX namespace is gone in React 19's types
const stale: JSX.Element = <div />;
// Error: Cannot find namespace 'JSX'.

const current: React.JSX.Element = <div />; // or import { type JSX } from "react"

// ComponentProps<"button"> is every attribute a real button accepts
type IconButtonProps = ComponentProps<"button"> & { icon: string };

function IconButton({ icon, children, ...rest }: IconButtonProps) {
  return (
    <button {...rest}>
      {icon} {children}
    </button>
  );
}

function Form() {
  // In React 19 a function component can take \`ref\` as a plain prop
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  // An extracted handler needs the annotation an inline arrow would infer
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return (
    <form>
      <input ref={inputRef} value={value} onChange={handleChange} />
      <IconButton icon="+" type="submit" onClick={(event) => event.preventDefault()}>
        Add
      </IconButton>
    </form>
  );
}

console.log(node, element, stale, current, Form);`,
          explanation:
            "`ComponentProps<\"button\">` plus a rest spread is the pattern behind almost every design-system wrapper: you add what you need, forward the rest, and the consumer keeps every native attribute with full checking — including `type=\"submit\"`, which is exactly the prop people forget to allow when they hand-write the props type.",
        },
      ],
    },
    {
      id: "generic-and-polymorphic",
      heading: "Generic and polymorphic components",
      body: [
        "A component that works over a collection should be generic, exactly like the functions in Module 6. Declaring `function List<T>({ items, render }: ListProps<T>)` lets the callback's parameter be inferred from the array at each call site, so `items={users}` gives you a `User` in `render` with no annotation. This is where `React.FC` gets in the way — it has nowhere to put the type parameter — and one more reason to type the props parameter directly.",
        "The other common shape is a **polymorphic** component: one that renders a different element depending on an `as` prop, while still accepting the right props for whatever it renders. `ElementType` is the type of anything JSX can render as a tag, and `ComponentProps<E>` then gives that element's props, so `<Box as=\"a\" href=\"...\" />` typechecks and `<Box as=\"a\" nope=\"x\" />` does not.",
        "Polymorphic components get complicated quickly — `ref` forwarding and default type parameters are where the well-known type gymnastics come from — so it's worth being sure you need one. A design system's `Box` or `Text` earns it; a component with two possible tags is usually better served by a discriminated union or just two components.",
      ],
      examples: [
        {
          id: "polymorphic-example",
          title: "Inference through a generic component, and an as prop",
          ts: `// List.tsx
import { type ComponentProps, type ElementType, type ReactNode } from "react";

interface ListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  render: (item: T) => ReactNode;
}

// The type parameter lives on the function, so it is inferred per call site
function List<T>({ items, getKey, render }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{render(item)}</li>
      ))}
    </ul>
  );
}

interface User {
  id: string;
  name: string;
}
const users: User[] = [{ id: "1", name: "Ada" }];

// T is inferred as User, so \`user\` is typed in both callbacks — no annotations
const list = (
  <List items={users} getKey={(user) => user.id} render={(user) => user.name.toUpperCase()} />
);

// Polymorphic: the element decides which props are legal
type BoxProps<E extends ElementType> = { as?: E; children?: ReactNode } & Omit<
  ComponentProps<E>,
  "as" | "children"
>;

function Box<E extends ElementType = "div">({ as, children, ...rest }: BoxProps<E>) {
  const Component = as ?? "div";
  return <Component {...rest}>{children}</Component>;
}

const plain = <Box>a div by default</Box>;
const link = (
  <Box as="a" href="https://example.com">
    an anchor, with href allowed
  </Box>
);

const broken = <Box as="a" nope="x" />;
// Error: Type '{ as: "a"; nope: string; }' is not assignable to type
//        'IntrinsicAttributes & { as?: "a" | undefined; children?: ReactNode; }
//        & Omit<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>,
//        HTMLAnchorElement>, "children" | "as">'.

console.log(list, plain, link, broken);`,
          explanation:
            "Notice what the `List` call site does *not* contain: any mention of `User`. The type parameter flows from `items` into both callbacks, which is the entire payoff — and it's the reason a generic component has to be written as a plain function rather than through a helper type like `FC`.",
        },
      ],
    },
    {
      id: "the-jsx-namespace",
      heading: "The JSX namespace",
      body: [
        "When the checker sees `<div />` it looks up `\"div\"` in an interface called `JSX.IntrinsicElements`, and when it sees `<Widget />` it checks the value's call signature. That interface isn't built into TypeScript — it comes from whichever library the `jsxImportSource` option points at, which is how Preact, Solid and React can all be typed differently while sharing the syntax. `@types/react` populates it with every HTML and SVG tag.",
        "Because it's an ordinary interface, you can extend it. The reason to do so is custom elements: a web component like `<my-chart>` is a real DOM tag that `@types/react` has never heard of, so it fails with the `Property 'my-chart' does not exist` error from the previous lesson. Adding an entry teaches the checker its attributes.",
        "In React 19 the augmentation has to target the right namespace. The old recipe — `declare global { namespace JSX { ... } }` — now compiles silently and does nothing, because React's `JSX` namespace is no longer global. The working form augments the React module itself. This is the most likely thing to break when a codebase upgrades, precisely because the broken version produces no error of its own.",
        "A few other members of the namespace occasionally matter: `JSX.Element` is what an expression evaluates to, `JSX.ElementType` constrains what may appear as a tag, and `JSX.IntrinsicAttributes` is where `key` lives — which is why `key` is accepted on every element without any component declaring it.",
      ],
      examples: [
        {
          id: "jsx-namespace-example",
          title: "Teaching the checker about a custom element",
          ts: `// custom-elements.d.ts
import { type ReactNode } from "react";

// React 19: the JSX namespace lives inside the react module, so augment that.
// \`declare global { namespace JSX { ... } }\` still compiles and does nothing.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "my-chart": {
        data: string;
        height?: number;
        children?: ReactNode;
      };
    }
  }
}

// Chart.tsx
export function Chart({ points }: { points: number[] }) {
  return (
    <div>
      {/* Now a known tag, with its attributes checked */}
      <my-chart data={points.join(",")} height={200} />
    </div>
  );
}

// ...and checked as strictly as any other element
const typo = <my-chart data="1,2" heigth={200} />;
// Error: Type '{ data: string; heigth: number; }' is not assignable to type
//        '{ data: string; height?: number | undefined; children?: ReactNode; }'.
console.log(typo);`,
          explanation:
            "The declaration file has to be part of the program — inside `include`, and containing at least one `import` or `export` so that `declare module` is treated as an augmentation rather than a new module declaration. Get that wrong and you replace React's types instead of extending them, which produces a much stranger set of errors.",
        },
      ],
      pitfalls: [
        {
          title: "An augmentation in a file with no imports replaces the module",
          body: "`declare module \"react\" { ... }` means two different things depending on the file it appears in. In a module — one with a top-level `import` or `export` — it *augments* the existing types. In a script, with no imports or exports at all, it *declares* a new ambient module, shadowing the real one and leaving you with a React whose only export is the thing you just wrote. The symptom is a flood of \"has no exported member\" errors across the codebase, and the fix is to add an `import` to the declaration file.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What changes when a file is .tsx instead of .ts?",
      answer:
        "JSX parsing is enabled, and the angle-bracket type assertion is lost, because <string>value now reads as a JSX element — so as is the only assertion syntax available. The same ambiguity breaks generic arrow functions: <T>(items: T[]) => ... parses as an unclosed element, and the conventional fixes are a trailing comma, <T,>, or a constraint like <T extends unknown>. A function declaration has no ambiguity at all. Everything else is additive: elements, props and children get typechecked.",
    },
    {
      question: "What's the difference between ReactNode and ReactElement?",
      answer:
        "ReactNode is anything React can render — elements, strings, numbers, null, undefined, booleans, and arrays of those — so it's the right type for children and slot props. ReactElement is specifically the object a JSX expression evaluates to, which excludes strings and null; use it when you actually need an element, for instance to clone or inspect one. Typing children as ReactElement is a common over-restriction that rejects <Panel>hello</Panel>. JSX.Element is React's element type under another name, and in React 19's types the JSX namespace is no longer global — write React.JSX.Element or import JSX from react.",
    },
    {
      question: "How do you type a component that wraps a native element?",
      answer:
        "Intersect ComponentProps with your own props: type IconButtonProps = ComponentProps<\"button\"> & { icon: string }. Then destructure the props you consume and spread the rest onto the element. The consumer keeps every native attribute with full checking — type, disabled, aria-*, onClick — instead of the handful you thought to list. ComponentProps also works on components: ComponentProps<typeof Panel> extracts whatever Panel takes, which is useful for wrappers and for tests. ComponentPropsWithoutRef and ComponentPropsWithRef exist when ref needs handling explicitly.",
    },
    {
      question: "Why is React.FC discouraged now?",
      answer:
        "Until @types/react 18 it silently added children to every component's props, so components that ignore children still accepted them; removing that was a breaking change that broke a lot of code written as React.FC<Props> with a children parameter. With the implicit children gone, FC mainly constrains the return type — something inference already handles — while making generic components awkward, since there's nowhere to put a type parameter. Typing the props parameter directly is simpler and works for every case.",
    },
    {
      question: "How do you make TypeScript accept a custom element like <my-chart>?",
      answer:
        "By adding an entry to JSX.IntrinsicElements, which is the interface the checker consults for every lowercase tag. Since React 19 that namespace lives inside the react module rather than the global scope, so the augmentation is declare module \"react\" { namespace JSX { interface IntrinsicElements { \"my-chart\": { data: string } } } }. The pre-19 recipe using declare global still compiles and silently does nothing, which makes it a nasty upgrade trap. The declaration file must be included in the program and must itself contain an import or export, or declare module creates a new ambient module instead of augmenting the real one.",
    },
  ],
  takeaways: [
    "In .tsx the angle-bracket assertion is gone and generic arrows need <T,> or a constraint; function declarations avoid the problem.",
    "Props are just a parameter type — use a discriminated union for mutually exclusive props, and PropsWithChildren or an explicit children: ReactNode for children.",
    "ReactNode is anything renderable, ReactElement is an element specifically, and ComponentProps<T> extracts an element's or component's props for wrapper components.",
    "Generic components put the type parameter on the function so it is inferred per call site; polymorphic ones combine an as prop with ElementType.",
    "JSX.IntrinsicElements is the list of legal lowercase tags; extending it for custom elements now requires augmenting the react module, not the global namespace.",
  ],
  status: "available",
};
