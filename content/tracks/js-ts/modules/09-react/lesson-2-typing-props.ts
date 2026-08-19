import type { Lesson } from "@/content/types";

export const typingPropsLesson: Lesson = {
  id: "react-ts-props",
  slug: "typing-props",
  moduleSlug: "react",
  title: "Typing Props, Children & Handlers",
  summary:
    "Describing a component's contract: which type to use for children, borrowing a DOM element's own props instead of retyping them, and discriminated unions that make an invalid prop combination impossible to write.",
  estimatedMinutes: 35,
  objectives: [
    "Choose between ReactNode, ReactElement and the other children types",
    "Extend a DOM element's props with ComponentProps",
    "Type event handler props precisely",
    "Make invalid prop combinations unrepresentable with a discriminated union",
    "Know why excess property checking catches typos in JSX",
  ],
  sections: [
    {
      id: "children",
      heading: "Typing children",
      body: [
        "React 19 removed the implicit `children` on `React.FC`, so you declare it — and the type you choose matters more than it looks.",
        "**`ReactNode`** is the right default. It covers everything React can render: elements, strings, numbers, arrays, `null`, `undefined`, `boolean`. If a caller can pass it, this accepts it.",
        "**`ReactElement`** is narrower — a single JSX element only. Use it when you genuinely need one element, for instance because you are going to `cloneElement` it.",
        "**`ReactNode` in a function** — `(value: T) => ReactNode` — is the render-prop shape, covered in the last lesson of this module.",
      ],
      examples: [
        {
          id: "children-types",
          title: "The three you will use",
          lang: "tsx",
          code: `import type { ReactNode, ReactElement } from "react";

// The default. Accepts anything renderable, including nothing.
interface CardProps {
  title: string;
  children: ReactNode;
}

// Optional children — note that \`ReactNode\` already includes undefined,
// but marking it optional is what makes <Card title="x" /> legal.
interface PanelProps {
  children?: ReactNode;
}

// Exactly one element. Rare, and usually a sign you want a prop instead.
interface TooltipProps {
  children: ReactElement;
  label: string;
}

// Several named slots read better than inspecting children.
interface LayoutProps {
  header: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;    // the main slot, by convention
}

function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div>
      <header>{header}</header>
      {sidebar && <aside>{sidebar}</aside>}
      <main>{children}</main>
    </div>
  );
}`,
          explanation:
            "The `LayoutProps` shape is worth copying. Trying to split a single `children` into regions — by counting it, by matching on element type — is fragile and defeats type checking. Named `ReactNode` props are explicit, ordered however you like, and each one is independently optional.",
        },
      ],
      pitfalls: [
        {
          title: "`JSX.Element` is not the type for children",
          body: "`JSX.Element` (now `React.JSX.Element`) means one element, so a component typed that way rejects a string, a number, an array and `null` — all of which callers will pass. It is also the wrong direction: it is a *return* type. Use `ReactNode` for anything a caller supplies.",
        },
      ],
    },
    {
      id: "component-props",
      heading: "Borrowing an element's props",
      body: [
        "A wrapper around a DOM element should accept everything that element accepts — `id`, `className`, `disabled`, `aria-*`, every event handler, `ref`. Writing that list by hand is tedious and always slightly wrong.",
        "**`ComponentProps<\"button\">`** gives you the lot, correctly typed, from React's own definitions. Intersect it with your own props and spread the rest onto the element.",
      ],
      examples: [
        {
          id: "component-props",
          title: "ComponentProps, and its two relatives",
          lang: "tsx",
          code: `import type { ComponentProps, ComponentPropsWithoutRef } from "react";

// Everything a real <button> accepts, plus your own additions.
type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "secondary", className, ...rest }: ButtonProps) {
  return <button className={\`btn btn-\${variant} \${className ?? ""}\`} {...rest} />;
}

// Every DOM attribute now works, checked, with no extra declarations:
// <Button variant="primary" type="submit" disabled aria-label="Save" onClick={save} />
// <Button variant="primry" />   -> Error: not assignable to the variant union

// ComponentPropsWithoutRef when you deliberately do not forward a ref.
type BoxProps = ComponentPropsWithoutRef<"div"> & { padded?: boolean };

// And you can borrow another component's props, which keeps a wrapper
// in sync with whatever it wraps.
type IconButtonProps = ComponentProps<typeof Button> & { icon: ReactNode };`,
          explanation:
            "The last line is the one people miss: `ComponentProps<typeof SomeComponent>` extracts the props of *your* component, so a wrapper cannot drift out of sync with the thing it wraps. Note the `className` handling — pulling it out of `rest` and merging it is necessary, because otherwise the spread would overwrite yours.",
        },
      ],
    },
    {
      id: "handlers",
      heading: "Typing handler props",
      body: [
        "There are two shapes, and choosing the right one matters for how reusable the component is.",
        "**A domain callback** — `onSelect: (id: string) => void` — says what happened in your terms. Prefer this: the parent does not need to know a DOM event was involved, and the component is free to change how it detects the interaction.",
        "**A DOM handler** — `onClick: MouseEventHandler<HTMLButtonElement>` — passes the event straight through. Right when the parent genuinely needs the event, usually to call `preventDefault`.",
      ],
      examples: [
        {
          id: "handler-props",
          title: "Both shapes, and the handler types",
          lang: "tsx",
          code: `import type { MouseEventHandler, ChangeEventHandler, FormEvent } from "react";

interface RowProps {
  id: string;
  // Domain callback: the parent learns what happened, not how.
  onSelect: (id: string) => void;
  // DOM handler: the parent gets the event itself.
  onContextMenu?: MouseEventHandler<HTMLLIElement>;
}

function Row({ id, onSelect, onContextMenu }: RowProps) {
  return (
    <li onClick={() => onSelect(id)} onContextMenu={onContextMenu}>
      {id}
    </li>
  );
}

// The handler type aliases, and their long forms:
//   MouseEventHandler<T>   =  (event: MouseEvent<T>) => void
//   ChangeEventHandler<T>  =  (event: ChangeEvent<T>) => void
//   FocusEventHandler<T>   =  (event: FocusEvent<T>) => void
//   KeyboardEventHandler<T> = (event: KeyboardEvent<T>) => void

// Inline handlers need no annotation at all — the element supplies it.
function SearchForm({ onSearch }: { onSearch: (q: string) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // currentTarget is typed; target would be EventTarget, as in module 8.
    const data = new FormData(event.currentTarget);
    onSearch(String(data.get("q") ?? ""));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="q" onChange={(event) => console.log(event.target.value)} />
    </form>
  );
}`,
          explanation:
            "Note React's event types are its own — `React.MouseEvent`, not the DOM's `MouseEvent`. They are synthetic events wrapping the native one, which is available as `event.nativeEvent`. Importing the wrong `MouseEvent` produces a mismatch that reads very oddly, so let the inference do it where you can.",
        },
      ],
    },
    {
      id: "discriminated",
      heading: "Making invalid combinations unrepresentable",
      body: [
        "Optional props are the usual way to express variation, and they allow combinations that make no sense — `variant=\"info\"` with a `retry` callback nothing will ever call, or an `href` on a button.",
        "A **discriminated union of prop types** makes those states impossible to write rather than merely discouraged, and it narrows inside the component too.",
      ],
      examples: [
        {
          id: "discriminated-props",
          title: "The union, and the error it produces",
          lang: "tsx",
          code: `type AlertProps =
  | { variant: "error"; message: string; retry: () => void }
  | { variant: "info"; message: string };

function Alert(props: AlertProps) {
  // Narrowed: \`retry\` exists only in this branch.
  if (props.variant === "error") {
    return (
      <div>
        {props.message}
        <button onClick={props.retry} />
      </div>
    );
  }
  return <div>{props.message}</div>;
}

// Passing retry to the info variant:
const bad = <Alert variant="info" message="hi" retry={() => {}} />;`,
          output: `c.tsx(14,48): error TS2322: Type '{ variant: "info"; message: string; retry: () => void; }' is not assignable to type 'IntrinsicAttributes & AlertProps'.
  Property 'retry' does not exist on type 'IntrinsicAttributes & { variant: "info"; message: string; }'.`,
          explanation:
            "The error names the exact branch it checked against. The other half of the benefit is inside the component: after `if (props.variant === \"error\")`, `props.retry` is known to exist, so no optional chaining and no non-null assertion. Compare that with `retry?: () => void`, where every use needs a guard the compiler cannot verify.",
        },
      ],
      pitfalls: [
        {
          title: "Destructuring in the parameter list defeats narrowing",
          body: "`function Alert({ variant, message, retry }: AlertProps)` fails, because destructuring separates the discriminant from the fields it discriminates — TypeScript can no longer connect `variant === \"error\"` to the presence of `retry`. Take the whole `props` object and destructure *after* narrowing, inside the branch.",
        },
      ],
    },
    {
      id: "excess-property",
      heading: "Why a typo in JSX is caught",
      body: [
        "TypeScript normally allows an object with extra properties where fewer are expected. **Object literals are the exception** — assigning a literal directly triggers *excess property checking*, which rejects unknown keys.",
        "JSX attributes are compiled to an object literal, so that check applies to every element you write. It is the reason a misspelled prop is an error rather than silently `undefined`.",
      ],
      examples: [
        {
          id: "excess-property",
          title: "The typo, caught",
          lang: "tsx",
          code: `interface CardProps {
  title: string;
}

function Card(props: CardProps) {
  return <div>{props.title}</div>;
}

const bad = <Card title="x" subtitle="y" />;`,
          output: `c.tsx(19,30): error TS2322: Type '{ title: string; subtitle: string; }' is not assignable to type 'IntrinsicAttributes & CardProps'.
  Property 'subtitle' does not exist on type 'IntrinsicAttributes & CardProps'.`,
          explanation:
            "`IntrinsicAttributes` appearing in the message is React's contribution — it is what adds `key` to every element's allowed props, which is why `key` never triggers this error. The check is *only* on literals, so spreading a wider object (`<Card {...bigObject} />`) passes silently, which is worth knowing when a typo somehow is not being caught.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which type should children have, and why not JSX.Element?",
      answer:
        "`ReactNode`. It covers everything React can render — elements, strings, numbers, arrays, null, undefined, booleans — which is what callers actually pass. `JSX.Element` means exactly one element, so it rejects strings, arrays and null, and it is really a return type rather than an input type. Use `ReactElement` only when you genuinely need a single element, such as before `cloneElement`.",
    },
    {
      question: "How do you make a component accept every prop a DOM element accepts?",
      answer:
        "Intersect with `ComponentProps<\"button\">`, which pulls the full, correctly typed attribute list from React's own definitions, then spread the rest onto the element. `ComponentPropsWithoutRef` is the variant for when you deliberately do not forward a ref, and `ComponentProps<typeof MyComponent>` borrows another component's props so a wrapper cannot drift out of sync.",
    },
    {
      question: "Why use a discriminated union for props instead of optional properties?",
      answer:
        "It makes invalid combinations unwritable rather than merely discouraged — you cannot pass a retry callback to a variant that has no retry. It also narrows inside the component, so after checking the discriminant the variant-specific props are known to exist, removing the optional chaining that optional props force on every use. The catch is that destructuring in the parameter list breaks the narrowing.",
    },
    {
      question: "Why is a misspelled prop an error, when TypeScript usually allows extra properties?",
      answer:
        "Excess property checking, which applies to object literals assigned directly to a typed target. JSX attributes compile to an object literal, so every element gets the check. It does not apply when you spread a pre-existing object into the element, which is why `<Card {...obj} />` will not catch the same typo.",
    },
  ],
  takeaways: [
    "`ReactNode` for anything a caller passes; `ReactElement` only when you need exactly one element",
    "Named `ReactNode` props beat trying to split a single `children` into slots",
    "`ComponentProps<\"button\">` borrows a DOM element's whole prop list; `ComponentProps<typeof X>` borrows a component's",
    "Prefer domain callbacks (`onSelect: (id: string) => void`) over passing DOM events, unless the parent needs the event",
    "React's event types are its own synthetic ones — `React.MouseEvent`, not the DOM's",
    "A discriminated union of prop types makes invalid combinations impossible and narrows inside the component",
    "Destructuring in the parameter list defeats discriminated-union narrowing — narrow first, destructure after",
    "Excess property checking catches JSX typos because attributes compile to an object literal; spreading bypasses it",
  ],
  status: "available",
};
