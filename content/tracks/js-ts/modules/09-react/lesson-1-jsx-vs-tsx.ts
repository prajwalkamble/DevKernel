import type { Lesson } from "@/content/types";

export const jsxVsTsxLesson: Lesson = {
  id: "react-ts-jsx-vs-tsx",
  slug: "jsx-vs-tsx",
  moduleSlug: "react",
  title: "JSX vs TSX: What Actually Changes",
  summary:
    "What the .tsx extension turns on and what it costs, where React's types come from, and the three React 19 changes that make most older TypeScript-with-React material wrong.",
  estimatedMinutes: 30,
  objectives: [
    "Say what the .tsx extension changes about parsing",
    "Explain the one syntax that stops working in .tsx, and the two workarounds",
    "Know where React's types live and what `jsx: react-jsx` selects",
    "Name the three React 19 typing changes that break older tutorials",
    "Decide what to annotate and what to let infer",
  ],
  sections: [
    {
      id: "scope",
      heading: "What this module is, and is not",
      body: [
        "This module is about **types applied to React**, not about React. It assumes you know what a component, a prop and a hook are; if you do not, the **React track** in this curriculum teaches those properly and this module will make far more sense afterwards.",
        "What is here instead: how to describe React's shapes to the compiler, which of them TypeScript infers for free, and the specific places where React and TypeScript interact badly enough to need a known workaround.",
      ],
    },
    {
      id: "extension",
      heading: "The extension is the switch",
      body: [
        "TypeScript decides whether to parse JSX **from the file extension alone**. A `.ts` file containing `<div />` is a syntax error no matter what your config says; rename it to `.tsx` and the same characters parse as markup.",
        "The `jsx` compiler option then decides what that markup compiles *to* — `\"react-jsx\"` for the modern automatic runtime, which is what any current setup uses, or `\"react\"` for the classic `React.createElement` form. `\"preserve\"` leaves the JSX alone for a downstream tool such as Babel or a bundler.",
        "The practical rule: **only files that actually contain JSX should be `.tsx`.** Hooks, utilities and type files stay `.ts`, and there is a real reason for that beyond tidiness — which is the next section.",
      ],
      examples: [
        {
          id: "jsx-side-by-side",
          title: "The same component in JSX",
          lang: "jsx",
          code: `// Greeting.jsx — nothing is checked. The shape of \`props\` is
// whatever the caller happened to pass.
export function Greeting({ name, count, onDismiss }) {
  return (
    <section>
      <h2>Hello, {name}!</h2>
      <p>You have {count} messages.</p>
      <button onClick={onDismiss}>Dismiss</button>
    </section>
  );
}`,
        },
        {
          id: "tsx-side-by-side",
          title: "...and in TSX",
          lang: "tsx",
          code: `// Greeting.tsx — the interface is the component's contract, and
// every call site is checked against it.
interface GreetingProps {
  name: string;
  count: number;
  onDismiss: () => void;
}

export function Greeting({ name, count, onDismiss }: GreetingProps) {
  return (
    <section>
      <h2>Hello, {name}!</h2>
      <p>You have {count} messages.</p>
      <button onClick={onDismiss}>Dismiss</button>
    </section>
  );
}

// <Greeting name="Ada" count="3" onDismiss={dismiss} />
//   Error: Type 'string' is not assignable to type 'number'.
// <Greeting name="Ada" onDismiss={dismiss} />
//   Error: Property 'count' is missing.`,
          explanation:
            "That is the entire difference at this level: one annotation, and every usage of the component is now checked. Note what did **not** need annotating — `onClick` on the `<button>` is already typed by React's own definitions, and the return type is inferred.",
        },
      ],
    },
    {
      id: "generic-arrow",
      heading: "The one thing that breaks in .tsx",
      body: [
        "In a `.ts` file, `<T>(value: T) => value` is a generic arrow function. In a `.tsx` file the parser sees `<T>` and starts reading a JSX element, and everything after it goes wrong.",
        "This is the single most common confusion caused by the extension, and it produces an error message that says nothing about generics.",
      ],
      examples: [
        {
          id: "generic-arrow-error",
          title: "What the parser thinks you meant",
          lang: "tsx",
          code: `// In a .tsx file:
const identity = <T>(value: T): T => value;`,
          output: `b.tsx(2,19): error TS17008: JSX element 'T' has no corresponding closing tag.
b.tsx(2,36): error TS1382: Unexpected token. Did you mean \`{'>'}\` or \`&gt;\`?
b.tsx(3,1): error TS1005: '</' expected.`,
          explanation:
            "\"JSX element 'T' has no corresponding closing tag\" is the giveaway. Nothing in the message mentions generics, so the first encounter usually costs ten minutes.",
        },
        {
          id: "generic-arrow-fixes",
          title: "The three things that work",
          lang: "tsx",
          code: `// 1. A trailing comma. Ugly, universally used, and does nothing at runtime.
const identity = <T,>(value: T): T => value;

// 2. A constraint, which also disambiguates.
const identity2 = <T extends unknown>(value: T): T => value;

// 3. A function declaration, which never had the problem.
function identity3<T>(value: T): T {
  return value;
}`,
          explanation:
            "The trailing comma is what you will see in real codebases and in library source. The cleanest answer, though, is often organisational: a generic helper is rarely JSX, so it belongs in a `.ts` file where `<T>` parses normally.",
        },
      ],
    },
    {
      id: "where-types-live",
      heading: "Where React's types come from",
      body: [
        "React ships no types of its own. They come from **`@types/react`** and **`@types/react-dom`**, maintained on DefinitelyTyped, and they are versioned separately from React itself.",
        "That separation causes a specific class of confusion: `react` at 19 with `@types/react` at 18 produces errors about APIs that plainly exist. **Keep the major versions aligned**, and in a monorepo make sure only one copy of `@types/react` is installed — two copies produce type errors claiming that `ReactNode` is not assignable to `ReactNode`, which is exactly as confusing as it sounds.",
        "The types are worth opening. Ctrl-clicking `useState` or `ComponentProps` in your editor lands you in the actual definition, which is more reliable than any article about it.",
      ],
      pitfalls: [
        {
          title: "Two copies of @types/react produce impossible-looking errors",
          body: "\"Type 'ReactNode' is not assignable to type 'ReactNode'\" means two different versions of the types are installed, so the two `ReactNode`s are genuinely different types. Run `npm ls @types/react` to find the duplicate. In npm, a `overrides` entry (or `resolutions` in Yarn) pinning one version is the usual fix.",
        },
      ],
    },
    {
      id: "react-19",
      heading: "Three React 19 changes that break older material",
      body: [
        "Most TypeScript-with-React writing predates React 19, and three changes in particular make it actively wrong. All three are verified below against `@types/react` 19.",
      ],
      examples: [
        {
          id: "react-19-changes",
          title: "The three, and what they now report",
          lang: "tsx",
          code: `import { useRef, createContext, type FC } from "react";

// 1. React.FC no longer implies \`children\`.
const Old: FC = ({ children }) => <div>{children}</div>;

// 2. The GLOBAL JSX namespace is gone. It lives under React now.
function f(): JSX.Element {
  return <div />;
}

// 3. useRef requires an argument.
const r1 = useRef<HTMLInputElement>();

// (createContext has always required one, and it is the same error.)
const Ctx = createContext<{ theme: string }>();`,
          output: `a.tsx(4,20): error TS2339: Property 'children' does not exist on type '{}'.
a.tsx(7,15): error TS2503: Cannot find namespace 'JSX'.
a.tsx(17,12): error TS2554: Expected 1 arguments, but got 0.
a.tsx(21,13): error TS2554: Expected 1 arguments, but got 0.`,
          explanation:
            "`Cannot find namespace 'JSX'` is the one that catches most people, because the code compiled fine for years. The global namespace was removed to stop two React versions in one project fighting over it.",
        },
        {
          id: "react-19-fixes",
          title: "The modern equivalents",
          lang: "tsx",
          code: `import { useRef, createContext, type ReactNode } from "react";

// 1. Declare children yourself. \`FC\` is now optional ceremony —
//    most codebases just annotate the parameter.
interface LayoutProps {
  children: ReactNode;
}
function Layout({ children }: LayoutProps) {
  return <div>{children}</div>;
}

// 2. JSX.Element is now React.JSX.Element — but you rarely need it,
//    because the return type is inferred.
function f(): React.JSX.Element {
  return <div />;
}
function g() {
  return <div />;   // inferred; prefer this
}

// 3. Pass the initial value explicitly.
const inputRef = useRef<HTMLInputElement>(null);
const timer = useRef<number | undefined>(undefined);

// 4. And the change that removes code: ref is an ordinary prop now,
//    so forwardRef is no longer needed just to accept one.
interface InputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}
function Input({ label, ref }: InputProps) {
  return <input aria-label={label} ref={ref} />;
}`,
          explanation:
            "The fourth point is the most valuable of the four. Every `forwardRef` wrapper written to pass a ref through — and the awkward generic signature that came with it — can be deleted in React 19. `ref` is just a prop, with a normal type.",
        },
      ],
    },
    {
      id: "what-to-annotate",
      heading: "What to annotate, and what to leave alone",
      body: [
        "TypeScript infers a great deal in React, and over-annotating is a real cost — noise to read, and a second place to update when something changes.",
        "**Annotate:** props (always — that is the component's contract), `useState` when the initial value does not imply the full type, `useReducer` state and actions, context values, and the parameters of a custom hook.",
        "**Do not annotate:** a component's return type, the type of `useState`'s setter, event parameters on built-in elements, or the result of `useMemo` and `useCallback`. All of those are inferred correctly, and writing them down only creates drift.",
      ],
      examples: [
        {
          id: "annotate-what",
          title: "The balance in one component",
          lang: "tsx",
          code: `interface CounterProps {
  start: number;                       // annotate: this is the contract
  onChange?: (value: number) => void;
}

// No return type: \`JSX.Element\` is inferred, and writing it adds nothing.
export function Counter({ start, onChange }: CounterProps) {
  // Inferred as number from the initial value — no annotation needed.
  const [count, setCount] = useState(start);

  // Annotate: \`null\` alone would infer the type as \`null\` forever.
  const [error, setError] = useState<string | null>(null);

  // Inferred. \`useCallback\` returns exactly what you gave it.
  const increment = useCallback(() => {
    setCount((c) => {
      onChange?.(c + 1);
      return c + 1;
    });
  }, [onChange]);

  // Event parameter is inferred from the element and the handler name.
  return (
    <button onClick={(event) => { event.preventDefault(); increment(); }}>
      {count} {error}
    </button>
  );
}`,
          explanation:
            "The two annotations that are present are the two that are load-bearing: the props interface, and the `useState` whose initial value is `null`. Everything else is inferred, and the next lesson but one explains exactly why the `null` case needs help.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the .tsx extension actually change?",
      answer:
        "Whether TypeScript parses JSX at all — it decides from the extension, not from configuration, so `<div />` in a `.ts` file is a syntax error regardless of the `jsx` setting. The `jsx` option then controls what the JSX compiles to: `react-jsx` for the automatic runtime, `react` for `React.createElement`, or `preserve` to leave it for another tool.",
    },
    {
      question: "Why does `const f = <T>(x: T) => x` fail in a .tsx file?",
      answer:
        "The parser reads `<T>` as the start of a JSX element, so the error is `JSX element 'T' has no corresponding closing tag` — nothing about generics. Fix it with a trailing comma (`<T,>`), a constraint (`<T extends unknown>`), or by writing a function declaration instead. Often the real fix is moving a generic helper into a `.ts` file, where the problem does not exist.",
    },
    {
      question: "What changed about typing React in version 19?",
      answer:
        "`React.FC` no longer implicitly adds `children`, so components taking children must declare them. The global `JSX` namespace was removed in favour of `React.JSX`. `useRef` now requires an initial argument. And `ref` became an ordinary prop, so `forwardRef` is no longer needed purely to accept one — a large amount of boilerplate can be deleted.",
    },
    {
      question: "What causes \"Type 'ReactNode' is not assignable to type 'ReactNode'\"?",
      answer:
        "Two copies of `@types/react` at different versions in the dependency tree, so the two `ReactNode` types genuinely are different. Find it with `npm ls @types/react` and pin a single version with an `overrides` (npm) or `resolutions` (Yarn) entry. Keeping `@types/react` aligned with the React major version avoids the related class of errors about APIs that plainly exist.",
    },
  ],
  takeaways: [
    "The file extension decides whether JSX parses; the `jsx` option decides what it compiles to",
    "`<T>(x: T) => x` breaks in .tsx — use `<T,>`, a constraint, or a function declaration",
    "React's types ship separately as `@types/react`; keep the major version aligned and ensure only one copy is installed",
    "React 19: `FC` no longer implies children, the global `JSX` namespace is gone, and `useRef` requires an argument",
    "React 19 made `ref` an ordinary prop, so `forwardRef` wrappers written just to pass a ref can be deleted",
    "Annotate props, `useState` with an ambiguous initial value, reducers and context; let return types, setters and event parameters infer",
  ],
  status: "available",
};
