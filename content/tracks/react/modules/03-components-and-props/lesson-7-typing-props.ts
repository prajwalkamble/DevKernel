import type { Lesson } from "@/content/types";

export const typingPropsLesson: Lesson = {
  id: "react-typing-props",
  slug: "typing-props",
  moduleSlug: "components-and-props",
  title: "Typing Props with TypeScript",
  summary:
    "The handful of types that cover almost every component: `ReactNode` for content, `ComponentProps` for wrapping a DOM element without listing its attributes, and a discriminated union for props that must not be combined.",
  estimatedMinutes: 30,
  objectives: [
    "Type a component's props, and know why annotating the parameter is enough",
    "Choose between `ReactNode`, `ReactElement` and `JSX.Element`",
    "Use `ComponentProps` to inherit every attribute of a DOM element",
    "Make impossible prop combinations unrepresentable with a union",
    "Type an event handler without writing the event type by hand",
  ],
  sections: [
    {
      id: "the-basics",
      heading: "Annotate the parameter, and stop",
      body: [
        "A component's props are its only parameter, so typing that parameter types the component. There is no need for a `React.FC` annotation on the function itself — it adds nothing, it used to add an implicit `children` you may not want, and it makes generic components awkward to write.",
        "Use an `interface` or a `type`; the difference rarely matters here. Optional props take `?`, and a parameter default is what supplies the value at runtime.",
      ],
      examples: [
        {
          id: "typed-props",
          title: "A typed component, running",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Badge({ label, tone = "info", icon = null }) {
  return (
    <span className={\`badge badge--\${tone}\`}>
      {icon}
      {label}
    </span>
  );
}

console.log(render(<Badge label="Draft" />));
console.log(render(<Badge label="Late" tone="warn" icon={<b>!</b>} />));`,
          output: `<span class="badge badge--info">Draft</span>
<span class="badge badge--warn"><b>!</b>Late</span>`,
          explanation:
            "`tone?: \"info\" | \"warn\"` is doing two jobs: it makes the prop optional, and it restricts it to two strings, so a typo is a compile error rather than a class name that silently matches no CSS. A union of string literals is the most useful type in a component's props and the most under-used.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";
import type { ReactNode } from "react";

interface BadgeProps {
  label: string;
  /** Optional at the type level; a default supplies it at runtime. */
  tone?: "info" | "warn";
  icon?: ReactNode;
}

function Badge({ label, tone = "info", icon = null }: BadgeProps) {
  return (
    <span className={\`badge badge--\${tone}\`}>
      {icon}
      {label}
    </span>
  );
}

console.log(render(<Badge label="Draft" />));
console.log(render(<Badge label="Late" tone="warn" icon={<b>!</b>} />));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`React.FC` is not the modern default",
          body: "`const Badge: React.FC<BadgeProps> = ({ label }) => …` still works, but it buys nothing over annotating the parameter and costs something: until React 18's types it silently added `children` to every component, so a component that should not accept children accepted them anyway. It also makes generic components clumsy, since the type parameter has nowhere natural to go. Annotate the parameter.",
        },
      ],
    },
    {
      id: "content-types",
      heading: "`ReactNode`, and its narrower relatives",
      body: [
        "**`ReactNode`** is what you almost always want for content. It covers everything React can render: elements, strings, numbers, arrays, `null`, `undefined`, `boolean`. If a prop holds \"anything that can go on the page\", this is its type.",
        "**`ReactElement`** is narrower: an element specifically. Use it when the component genuinely needs an element — because it clones it, reads its props, or requires it to have a key — and not merely as a way of saying \"some JSX\".",
        "**`PropsWithChildren<P>`** adds `children?: ReactNode` to your props type. It is a convenience rather than a necessity; writing `children: ReactNode` yourself is one line and lets you decide whether it is optional, which the helper does not.",
        "The rule of thumb: type it `ReactNode` unless you can name the operation that requires it to be an element.",
      ],
    },
    {
      id: "component-props",
      heading: "`ComponentProps`: inheriting an element's whole interface",
      body: [
        "A component wrapping a DOM element should accept everything that element accepts. Listing them is hopeless — `<button>` has dozens — so TypeScript reads them from React's own definitions.",
        "**`ComponentProps<\"button\">`** is every prop React's `<button>` accepts, including `ref`. **`ComponentPropsWithoutRef<\"button\">`** is the same without it, which was the usual choice before React 19 made `ref` an ordinary prop.",
        "Combine it with your own props using an intersection, and use `Omit` when you are taking over one of the element's own props — a `Button` with its own `type` union, say.",
      ],
      examples: [
        {
          id: "component-props",
          title: "Every button attribute, plus two of your own",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Button({ variant = "solid", children, ...rest }) {
  return (
    <button type="button" className={\`btn btn--\${variant}\`} {...rest}>
      {children}
    </button>
  );
}

console.log(render(
  <Button variant="ghost" id="save" aria-label="Save draft" disabled>
    Save
  </Button>
));`,
          output: `<button type="button" class="btn btn--ghost" id="save" aria-label="Save draft" disabled="">Save</button>`,
          explanation:
            "`id`, `aria-label` and `disabled` were never named in `ButtonProps` and are all fully typed, because `ComponentProps<\"button\">` brought them in. `Omit<…, \"type\">` removes the element's own `type` so callers cannot set it — the component has decided it is always `\"button\"`, and now the type system enforces what the spread order enforces at runtime.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";
import type { ComponentProps, ReactNode } from "react";

// Everything <button> accepts, minus the props we are redefining ourselves.
type ButtonProps = Omit<ComponentProps<"button">, "type"> & {
  variant?: "solid" | "ghost";
  children: ReactNode;
};

function Button({ variant = "solid", children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={\`btn btn--\${variant}\`} {...rest}>
      {children}
    </button>
  );
}

console.log(render(
  <Button variant="ghost" id="save" aria-label="Save draft" disabled>
    Save
  </Button>
));`,
            },
          ],
        },
      ],
    },
    {
      id: "unions",
      heading: "Making bad combinations unrepresentable",
      body: [
        "Optional props are a blunt tool. `{ href?: string; onClick?: () => void }` permits both at once, neither, and every combination — including the ones that make no sense.",
        "A **discriminated union** describes the states that actually exist. Each member has a shared literal field the compiler can switch on, and the fields that belong to that state and no other.",
        "The payoff is in both directions: a caller cannot construct an invalid combination, and inside the component, checking the discriminant narrows the type so the fields of that branch are known to exist — no optional chaining, no non-null assertions.",
      ],
      examples: [
        {
          id: "discriminated",
          title: "Two shapes, one component",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Action(props) {
  // Narrowed by the discriminant: \`href\` exists only in this branch.
  if (props.as === "link") {
    return <a href={props.href}>{props.label}</a>;
  }
  return <button type="button" onClick={props.onSelect}>{props.label}</button>;
}

console.log(render(<Action as="link" href="/docs" label="Read the docs" />));
console.log(render(<Action as="button" onSelect={() => {}} label="Dismiss" />));`,
          output: `<a href="/docs">Read the docs</a>
<button type="button">Dismiss</button>`,
          explanation:
            "A caller cannot pass `href` alongside `as=\"button\"` — the union has no member allowing it. Inside, `props.as === \"link\"` narrows to the first member, so `props.href` is a `string` rather than a `string | undefined`. Note that the whole `props` object is taken rather than destructured in the parameter list: destructuring separates the discriminant from the fields it discriminates, and narrowing stops working.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";

type ActionProps =
  | { as: "link"; href: string; label: string }
  | { as: "button"; onSelect: () => void; label: string };

function Action(props: ActionProps) {
  // Narrowed by the discriminant: \`href\` exists only in this branch.
  if (props.as === "link") {
    return <a href={props.href}>{props.label}</a>;
  }
  return <button type="button" onClick={props.onSelect}>{props.label}</button>;
}

console.log(render(<Action as="link" href="/docs" label="Read the docs" />));
console.log(render(<Action as="button" onSelect={() => {}} label="Dismiss" />));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Destructuring in the parameter list defeats narrowing",
          body: "`function Action({ as, href, label }: ActionProps)` fails to compile, because TypeScript can no longer connect `as === \"link\"` to the presence of `href` once they are separate variables. Accept the whole `props` object and destructure *inside* a branch, after the check has narrowed the type.",
        },
      ],
    },
    {
      id: "handlers",
      heading: "Typing event handlers without writing the event type",
      body: [
        "Handler props are usually best typed by their *meaning* rather than by the DOM event: `onSelect: (id: string) => void` says far more than `onSelect: (e: MouseEvent) => void`, and does not tie the caller to a click.",
        "When a component genuinely forwards a DOM event, take the type from the element rather than writing it out. `ComponentProps<\"input\">[\"onChange\"]` is exactly the right type and stays right if React's definitions change.",
        "Type handler returns as `void`, not `boolean` or `unknown`. A `void` return lets a caller pass a function returning anything, which is what you want — `onClick={() => setOpen(true)}` should not be an error because `setOpen` returns something.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Should you type a component with `React.FC`?",
      answer:
        "No — annotate the props parameter instead. `React.FC` adds nothing over that, historically injected an implicit `children` into components that should not accept any, and makes generic components awkward because the type parameter has nowhere natural to sit. `function Badge({ label }: BadgeProps)` is the modern form.",
    },
    {
      question: "What is the difference between `ReactNode` and `ReactElement`?",
      answer:
        "`ReactNode` is anything React can render — elements, strings, numbers, arrays, `null`, `undefined`, booleans — and is the right type for almost any content prop. `ReactElement` is specifically an element object. Use the narrower one only when the component does something that requires an element, such as cloning it or reading its props; using it merely to mean \"some JSX\" rejects perfectly valid children like a string.",
    },
    {
      question: "How do you let a component accept every attribute of the DOM element it wraps?",
      answer:
        "Intersect your own props with `ComponentProps<\"button\">`, which is React's own definition of that element's props, and spread the rest onto the element. Use `Omit` to remove any you are redefining — a `Button` that fixes `type=\"button\"` omits `type` so callers cannot set it, making the type system enforce the same guarantee the spread order enforces at runtime.",
    },
  ],
  takeaways: [
    "Type the props parameter; `React.FC` adds nothing and historically added an unwanted `children`",
    "`ReactNode` for content, `ReactElement` only when you need an actual element",
    "A union of string literals is the highest-value type in a component's props",
    "`ComponentProps<\"button\">` inherits every attribute of the element, and `Omit` takes back the ones you redefine",
    "A discriminated union makes impossible prop combinations impossible, and narrows inside the component",
    "Take the whole `props` object when narrowing a union — parameter destructuring breaks it",
  ],
  status: "available",
};
