import type { Lesson } from "@/content/types";

export const typingComponentsLesson: Lesson = {
  id: "react-typing-components",
  slug: "typing-components",
  moduleSlug: "testing-typescript-tooling",
  title: "Typing Components: Props, Children, Events & Refs",
  summary:
    "The types you write every day and the ones you should stop writing. ComponentProps instead of retyping a button, discriminated unions instead of four optional props, event types you almost never annotate, and ref as an ordinary prop in React 19.",
  estimatedMinutes: 30,
  objectives: [
    "Type props, children and optional callbacks",
    "Extend a native element's props with ComponentProps",
    "Make impossible prop combinations unrepresentable",
    "Type events, and know when not to",
    "Type a ref now that forwardRef is gone",
  ],
  sections: [
    {
      id: "the-basics",
      heading: "The shape you write ninety percent of the time",
      body: [
        "An interface for the props, destructured in the signature. No `React.FC`, no generic on the function, no separate type for the component itself.",
        "`React.FC` is worth one sentence of history: it used to add an implicit `children` prop, which typed a component as accepting children whether or not it used any. React 18's types removed that, so `FC` now does almost nothing — and the almost-nothing it does is stop the component being generic. Plain function, typed parameter.",
      ],
      examples: [
        {
          id: "basic-props",
          title: "Props, children and an optional callback",
          lang: "jsx",
          code: `export function Card({ title, children, onDismiss }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
      {onDismiss && <button onClick={onDismiss}>×</button>}
    </section>
  );
}`,
          explanation:
            "Three decisions worth knowing the reason for: `ReactNode` rather than `ReactElement`, because children are usually not elements; `?` rather than a default, because the component branches on absence; and `() => void` rather than `() => unknown`, because `void` is the return type that accepts any function.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

interface CardProps {
  title: string;
  /* ReactNode is everything React can render: elements, strings, numbers,
     arrays, null, false. Not ReactElement — that excludes a plain string,
     and <Card>hello</Card> is a plain string. */
  children: ReactNode;
  /* Optional, so callers may omit it. Return void, not unknown: void here
     means "I ignore whatever you return", which lets a caller pass a
     function that happens to return something. */
  onDismiss?: () => void;
}

export function Card({ title, children, onDismiss }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
      {onDismiss && <button onClick={onDismiss}>×</button>}
    </section>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`ReactElement` will reject your text",
          body: "`children: ReactElement` compiles until someone writes `<Card>Saved</Card>`, and then produces a confusing error about `string` not being assignable. `ReactNode` is the type of \"anything renderable\" and is what you want unless you specifically mean one element.",
        },
      ],
    },
    {
      id: "native",
      heading: "Not retyping the DOM",
      body: [
        "The most common waste of an afternoon: a `Button` component whose props interface lists `onClick`, `disabled`, `type`, `className`, `aria-label`… and is missing the twelve a caller eventually needs.",
        "`ComponentProps<\"button\">` is every prop React accepts on a `<button>`, correctly typed, kept up to date by `@types/react`. Intersect it with your own props and spread the rest.",
      ],
      examples: [
        {
          id: "component-props",
          title: "Everything a button takes, plus one",
          lang: "tsx",
          code: `import { useRef, type ComponentProps, type Ref } from "react";

/* Everything a <button> accepts, plus one prop of our own. */
type ButtonProps = ComponentProps<"button"> & { variant: "primary" | "ghost" };

export function Button({ variant, className, ...rest }: ButtonProps) {
  return <button className={\`btn btn-\${variant} \${className ?? ""}\`} {...rest} />;
}

/* React 19: ref is an ordinary prop, so it arrives through ...rest with no
   forwardRef and no extra type parameter. */
export function Usage() {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button variant="primary" ref={ref} type="submit" aria-label="Save">Save</Button>
      <Button variant="loud">Nope</Button>
      <Button variant="ghost" onClick={(event) => event.currentTarget.disabled = true} />
      <Button variant="ghost" onClick={(event) => event.currentTarget.checked} />
    </>
  );
}

/* Typing the ref explicitly, for a component that forwards it onward. */
export function Field({ ref, ...rest }: ComponentProps<"input"> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} />;
}`,
          output: `src/native.tsx(17,15): error TS2322: Type '"loud"' is not assignable to type '"primary" | "ghost"'.
src/native.tsx(19,71): error TS2339: Property 'checked' does not exist on type 'EventTarget & HTMLButtonElement'.`,
          explanation:
            "Two errors, from `tsc --noEmit` on that file. The first is your own union doing its job. The second is the interesting one: nobody annotated that event handler, and TypeScript still knows `currentTarget` is an `HTMLButtonElement` — because `ComponentProps<\"button\">` typed `onClick` and the parameter was inferred from it. That is why the next section is short.",
          requires: "tsc (the output is its diagnostics, not a program's)",
        },
      ],
      pitfalls: [
        {
          title: "`ComponentProps` has three cousins",
          body: "`ComponentProps<typeof MyComponent>` gets the props of one of your own components, which is how you extend or wrap it without exporting its props type. `ComponentPropsWithRef` and `ComponentPropsWithoutRef` existed to work around `forwardRef`; in React 19, where `ref` is a normal prop, `ComponentProps` already includes it and the other two are mostly legacy.",
        },
      ],
    },
    {
      id: "events",
      heading: "Events, and when not to type them",
      body: [
        "The rule is short: **inline handlers need no annotation.** The parameter type is inferred from the prop, and any annotation you add is a chance to get it wrong.",
        "You only need the name when the handler is defined away from its JSX — extracted to a variable, stored in an object, passed through a prop of your own.",
        "The naming scheme is regular: `React.ChangeEvent<T>`, `MouseEvent<T>`, `KeyboardEvent<T>`, `FormEvent<T>`, `FocusEvent<T>`, and `T` is the element the handler is attached to. The handler *types* are `ChangeEventHandler<T>` and friends, which is the whole function rather than its argument.",
      ],
      examples: [
        {
          id: "event-types",
          title: "The two cases",
          lang: "tsx",
          code: `/* Inline: nothing to annotate. TypeScript already knows event is a
   ChangeEvent<HTMLInputElement>, because that is what onChange takes. */
<input onChange={(event) => setName(event.target.value)} />

/* Extracted: now it needs a name. */
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setName(event.target.value);
};
<input onChange={handleChange} />

/* Or type the whole handler, which is shorter and infers the parameter. */
const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  setName(event.target.value);
};

/* target against currentTarget, which is a real bug and not a style point.
   currentTarget is the element the handler is on and is typed as such.
   target is whatever was actually clicked — a <span> inside the button —
   and is typed EventTarget, with nothing useful on it. */
<button onClick={(event) => {
  event.currentTarget.disabled = true;   // fine
  // event.target.disabled = true;       // Property 'disabled' does not exist
}} />`,
          explanation:
            "The `target`/`currentTarget` distinction catches people twice: once in TypeScript, where `target` is uselessly typed, and once at runtime, where it is a different element than you expected because the user clicked the icon inside the button.",
        },
      ],
    },
    {
      id: "unions",
      heading: "Making the impossible unrepresentable",
      body: [
        "The most valuable typing move in React, and the least used.",
        "A props interface with four optional fields describes sixteen combinations, of which perhaps three are legal. The component then defends itself with runtime checks, and the caller finds out about the other thirteen when something is undefined.",
        "A discriminated union describes only the legal ones. Now the compiler is the runtime check, and — this is the part that surprises people — **it narrows inside the component too**.",
      ],
      examples: [
        {
          id: "discriminated",
          title: "Two shapes, and the four mistakes they rule out",
          lang: "tsx",
          code: `/* Two shapes, not one shape with four optional fields. */
type AlertProps =
  | { kind: "info"; message: string }
  | { kind: "error"; message: string; retry: () => void };

export function Alert(props: AlertProps) {
  return (
    <div role="alert">
      {props.message}
      {props.kind === "error" && <button onClick={props.retry}>Retry</button>}
    </div>
  );
}

/* Legal. */
export const a = <Alert kind="info" message="Saved" />;

/* The two the union rules out. */
export const b = <Alert kind="error" message="Failed" />;
export const c = <Alert kind="info" message="Saved" retry={() => {}} />;

/* And the read the narrowing rules out. */
export function Broken(props: AlertProps) {
  return <button onClick={props.retry}>Retry</button>;
}`,
          output: `src/union.tsx(21,19): error TS2322: Type '{ kind: "error"; message: string; }' is not assignable to type 'IntrinsicAttributes & AlertProps'.
  Property 'retry' is missing in type '{ kind: "error"; message: string; }' but required in type '{ kind: "error"; message: string; retry: () => void; }'.
src/union.tsx(22,53): error TS2322: Type '{ kind: "info"; message: string; retry: () => void; }' is not assignable to type 'IntrinsicAttributes & AlertProps'.
  Property 'retry' does not exist on type 'IntrinsicAttributes & { kind: "info"; message: string; }'.
src/union.tsx(26,33): error TS2339: Property 'retry' does not exist on type 'AlertProps'.
  Property 'retry' does not exist on type '{ kind: "info"; message: string; }'.`,
          explanation:
            "Three errors, and note what each one is. An error variant with no `retry` is rejected. An info variant *with* a `retry` is also rejected — excess property checking, which is why the union catches over-supply as well as under-supply. And reading `props.retry` without narrowing on `kind` first is rejected inside the component, which is the runtime check you no longer have to write.\n\nDestructuring defeats the narrowing, incidentally: `function Alert({ kind, retry })` breaks the connection between the two, so keep `props` intact when the type is a union.",
          requires: "tsc (the output is its diagnostics, not a program's)",
        },
      ],
      pitfalls: [
        {
          title: "The tell that you want a union",
          body: "Two or more optional props that are only ever used together, or a comment saying \"only pass this when …\". Both are a union written as a struct.",
        },
      ],
    },
    {
      id: "the-rest",
      heading: "The rest of the vocabulary",
      body: [
        "**`ReactNode`** — anything renderable. The type of `children`.",
        "**`ReactElement`** — specifically an element. Use when you really mean one, which is rare.",
        "**`CSSProperties`** — the `style` prop's type.",
        "**`PropsWithChildren<P>`** — `P & { children?: ReactNode }`. Fine, and writing `children: ReactNode` yourself is clearer and lets you make it required.",
        "**`Dispatch<SetStateAction<T>>`** — the type of a `setState` function, for when you pass one down. If you find yourself writing it often, that is module 8 telling you to pass a narrower callback instead.",
        "**`useState<T | null>(null)`** — the annotation `useState` actually needs, because it cannot infer `T` from `null`. Nearly every other `useState` infers correctly and should be left alone.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you type a component's props?",
      answer:
        "An interface for the props, destructured in the signature — no `React.FC`. `FC` used to add an implicit `children`, which was removed in React 18's types, so today it mostly just stops the component from being generic. Use `ReactNode` for children, since children are usually strings and arrays rather than single elements, and `() => void` for callbacks, because `void` accepts a function that returns something.",
    },
    {
      question: "How do you accept every prop a native element takes?",
      answer:
        "`ComponentProps<\"button\">`, intersected with your own props, and spread the rest onto the element. It is correct, complete and maintained by `@types/react`, which a hand-written list is not. It also types the event handlers for you, which is why inline handlers need no annotation — `event.currentTarget` is already known to be an `HTMLButtonElement`.",
    },
    {
      question: "When do you have to annotate an event parameter?",
      answer:
        "Only when the handler is defined away from the JSX. Inline, the parameter is inferred from the prop's type and any annotation is a chance to be wrong. Extracted, either annotate the parameter as `React.ChangeEvent<HTMLInputElement>` or type the whole function as `ChangeEventHandler<HTMLInputElement>`, which infers the parameter for you.",
    },
    {
      question: "What is a discriminated union of props for?",
      answer:
        "Making illegal prop combinations impossible to write. Four optional props describe sixteen combinations of which three are legal; two union members describe exactly the legal ones. It catches both missing props and props that should not be there, and it narrows inside the component — so after checking `kind === \"error\"`, `retry` exists, and reading it without checking is a compile error rather than a runtime one. Keep `props` un-destructured, or the narrowing is lost.",
    },
  ],
  takeaways: [
    "Plain function, typed props parameter — `React.FC` earns nothing in React 19",
    "`ReactNode` for children; `ReactElement` rejects a plain string",
    "`() => void` for callbacks, so a caller may pass a function that returns something",
    "`ComponentProps<\"button\">` instead of retyping the DOM, and it types the events too",
    "Inline handlers need no annotation; extracted ones need `ChangeEvent<T>` or `ChangeEventHandler<T>`",
    "`currentTarget` is the element the handler is on; `target` is whatever was clicked",
    "A discriminated union rules out both missing and surplus props, and narrows inside the component",
    "Destructuring a union prop object loses the narrowing",
    "`useState<T | null>(null)` is the one `useState` that genuinely needs an annotation",
  ],
  status: "available",
};
