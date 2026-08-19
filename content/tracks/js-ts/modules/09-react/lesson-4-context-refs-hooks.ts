import type { Lesson } from "@/content/types";

export const contextRefsHooksLesson: Lesson = {
  id: "react-ts-context-refs-hooks",
  slug: "typing-context-refs-hooks",
  moduleSlug: "react",
  title: "Typing Context, Refs & Custom Hooks",
  summary:
    "The three places React's types push back: a context with no sensible default, a ref that is null until it is not, and a custom hook whose return value widens into something useless unless you stop it.",
  estimatedMinutes: 35,
  objectives: [
    "Create a context without inventing a fake default value",
    "Write the guard hook that removes undefined from every consumer",
    "Type the three kinds of ref, and know which are read-only",
    "Return a tuple from a custom hook without it widening",
    "Type a generic custom hook",
  ],
  sections: [
    {
      id: "context-default",
      heading: "Context: the fake default problem",
      body: [
        "`createContext` requires an argument — the value used when a component reads the context with no provider above it. For most application contexts there is no honest default: a theme, a session, a store all only exist because a provider created them.",
        "Two bad answers are common. `createContext({} as Theme)` lies, and every consumer then reads properties off an empty object at runtime with no warning. `createContext<Theme | null>(null)` is honest but pushes a null check into every single consumer.",
        "The right answer keeps the honest type and pays the cost once, in a **guard hook**.",
      ],
      examples: [
        {
          id: "context-guard",
          title: "The pattern worth memorising",
          lang: "tsx",
          code: `import { createContext, useContext, type ReactNode } from "react";

interface Theme {
  mode: "light" | "dark";
}

// Honest: undefined genuinely is the value outside a provider.
const ThemeContext = createContext<Theme | undefined>(undefined);

// The guard is the only place that deals with it.
export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  if (value === undefined) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return value;
}

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

// Consumers get a plain \`Theme\`. No null checks, anywhere.
function Uses() {
  const theme = useTheme();
  return <div>{theme.mode}</div>;
}

// Reading the context directly keeps the undefined:
function Unsafe() {
  const theme = useContext(ThemeContext);
  return <div>{theme.mode}</div>;
}`,
          output: `d.tsx(18,16): error TS18048: 't' is possibly 'undefined'.`,
          explanation:
            "The error is on the *unsafe* version, and that is the design working: the only way to avoid it is the guard hook, so the guard becomes the path of least resistance. **Do not export the context itself** — export only the provider and the hook, and the wrong usage becomes unavailable rather than merely discouraged.",
        },
      ],
      pitfalls: [
        {
          title: "A new object literal as the context value re-renders every consumer",
          body: "`<ThemeContext.Provider value={{ mode }}>` creates a new object on every render of the provider, so every consumer re-renders even when `mode` did not change. Memoise it with `useMemo`, or pass a value that is already stable. TypeScript will not warn about this — it is a correctness-adjacent performance bug that only profiling finds.",
        },
      ],
    },
    {
      id: "refs",
      heading: "Three kinds of ref",
      body: [
        "`useRef` has three distinct uses, and they type differently.",
        "**A DOM ref**, passed to an element's `ref` attribute. Initialise with `null`, because React sets it after the element mounts. The resulting `current` is `T | null`.",
        "**A mutable value** that survives renders without causing one — a timer id, a previous value, an instance of something. `current` is writable and typed exactly as you declare it.",
        "**A ref you receive as a prop**, which React 19 made an ordinary prop typed `Ref<T>`.",
        "The distinction that trips people: when you pass a ref to an element's `ref` attribute, **React owns `current`** — you read it, React writes it. When you use a ref as a mutable box, you own it.",
      ],
      examples: [
        {
          id: "ref-typing",
          title: "All three, and the null you cannot skip",
          lang: "tsx",
          code: `// 1. A DOM ref. \`current\` is HTMLInputElement | null.
const inputRef = useRef<HTMLInputElement>(null);

// 2. A mutable box. React 19 requires the argument, so pass undefined
//    explicitly when there is no meaningful initial value.
const timer = useRef<number | undefined>(undefined);
const renders = useRef(0);          // number, inferred

useEffect(() => {
  inputRef.current.focus();
}, []);`,
          output: `d.tsx(26,5): error TS18047: 'inputRef.current' is possibly 'null'.`,
          explanation:
            "That null is real, not pedantry: the effect runs after mount so `current` is set, but the same ref is `null` during the first render and again after unmount. Narrow it — `inputRef.current?.focus()` for a fire-and-forget call, or an `if (!inputRef.current) return;` guard when several statements depend on it.",
        },
        {
          id: "ref-as-prop",
          title: "React 19: ref is a prop",
          lang: "tsx",
          code: `import type { Ref, ComponentProps } from "react";

// Before React 19 this needed forwardRef and its awkward generics.
interface InputProps extends ComponentProps<"input"> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, ref, ...rest }: InputProps) {
  return (
    <>
      <label>{label}</label>
      <input ref={ref} {...rest} />
    </>
  );
}

// And it composes exactly like any other prop:
function Form() {
  const first = useRef<HTMLInputElement>(null);
  return <Input label="Name" ref={first} />;
}

// A callback ref, when you need to run something on attach and detach.
// Returning a function from it is the React 19 cleanup form.
<input
  ref={(node) => {
    node?.addEventListener("focus", onFocus);
    return () => node?.removeEventListener("focus", onFocus);
  }}
/>;`,
          explanation:
            "`ComponentProps<\"input\">` already includes `ref`, so the explicit `ref?: Ref<HTMLInputElement>` above is redundant in that particular example — it is written out to show the type. When you are not extending a DOM element's props, that is the declaration you need.",
        },
      ],
    },
    {
      id: "custom-hooks",
      heading: "Custom hooks: the widening problem",
      body: [
        "A custom hook is an ordinary function, so its types are ordinary too — with one React-specific trap.",
        "Returning an array so callers can name the parts (`const [value, setValue] = useThing()`) is idiomatic. But TypeScript infers an array literal as an **array of the union of its element types**, not as a tuple. So `[boolean, () => void]` widens to `(boolean | (() => void))[]`, and destructuring gives both positions that union — meaning neither can be used.",
        "`as const` fixes it, and so does an explicit tuple return type.",
      ],
      examples: [
        {
          id: "tuple-widening",
          title: "With and without `as const`",
          lang: "tsx",
          code: `// Correct: \`as const\` freezes it into a readonly tuple.
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn((v) => !v)] as const;
}

const [isOpen, toggle] = useToggle();
//     ^? boolean        ^? () => void

const wrong: string = isOpen;`,
          output: `d.tsx(38,9): error TS2322: Type 'boolean' is not assignable to type 'string'.`,
          explanation:
            "That error is the proof it worked: `isOpen` is genuinely `boolean`, not a union. Without `as const` the same line would report `boolean | (() => void)` instead — and calling `toggle()` would fail with \"Not all constituents of type 'boolean | (() => void)' are callable\", which is the signature of this bug.",
        },
        {
          id: "hook-return-shapes",
          title: "Tuple or object — and when to use each",
          lang: "tsx",
          code: `// A tuple, when there are two values and the caller will rename them.
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;
}

// The explicit alternative, which reads better in a public API.
function useToggleTyped(initial = false): readonly [boolean, () => void] {
  const [on, setOn] = useState(initial);
  return [on, useCallback(() => setOn((v) => !v), [])];
}

// An object, once there are three or more values — no \`as const\` needed,
// and callers do not have to remember an order.
interface UseFetchResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  // ...
}

const { data, isLoading, refetch } = useFetch<User>("/api/user");`,
          explanation:
            "The rule of thumb React itself follows: **two values, return a tuple; more than two, return an object.** A tuple's whole benefit is that the caller names the parts, and that stops being worth the positional coupling somewhere around the third element.",
        },
      ],
      pitfalls: [
        {
          title: "`as const` on an object makes it deeply readonly",
          body: "On a tuple that is exactly what you want. On an object return it also marks every property `readonly`, which is usually harmless but will reject a caller that reassigns a destructured field. If you want the tuple behaviour without the readonly, write the explicit `[A, B]` return type instead.",
        },
      ],
    },
    {
      id: "generic-hooks",
      heading: "Generic custom hooks",
      body: [
        "A hook that works over any type needs a type parameter, and it is worth putting the constraint on it that the implementation actually relies on.",
      ],
      examples: [
        {
          id: "generic-hook",
          title: "A typed localStorage hook",
          lang: "tsx",
          code: `function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(previous) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // quota, or storage disabled — module 8
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set] as const;
}

// T is inferred from the initial value.
const [theme, setTheme] = useLocalStorage("theme", "dark");
//     ^? string

// Or pinned explicitly when the initial value is not representative.
const [ids, setIds] = useLocalStorage<number[]>("ids", []);`,
          explanation:
            "Two things worth copying. The lazy initialiser — `useState(() => …)` — means the read from storage happens once rather than on every render. And the `typeof next === \"function\"` branch mirrors `useState`'s own updater support; the cast inside it is unavoidable, because TypeScript cannot narrow `T | ((p: T) => T)` when `T` might itself be a function.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you type a context that has no sensible default?",
      answer:
        "Type it as `T | undefined` with `undefined` as the default — that is honest, since `undefined` really is what a consumer outside the provider gets. Then pay the check once in a guard hook that throws if the value is undefined and returns `T`, so every consumer has a plain `T`. Export only the provider and the hook, not the context, so the unguarded path is unavailable.",
    },
    {
      question: "Why is `ref.current` typed as possibly null?",
      answer:
        "Because it genuinely is: React assigns it after the element mounts, so it is `null` on the first render and again after unmount. Effects run after mount, so it is usually populated there — but the type is correct and the narrowing is cheap. For a ref used as a mutable box rather than a DOM ref, you choose the type and there need be no null at all.",
    },
    {
      question: "Why does a custom hook returning an array need `as const`?",
      answer:
        "TypeScript infers an array literal as an array of the union of its element types, not a tuple, so `[boolean, () => void]` becomes `(boolean | (() => void))[]` and both destructured positions get that union — making the boolean uncallable and the function unusable as a boolean. `as const` produces a readonly tuple, and an explicit `[boolean, () => void]` return type does the same without the readonly.",
    },
    {
      question: "When should a hook return a tuple rather than an object?",
      answer:
        "Two values, where the caller is expected to rename them — `useState`, `useToggle`, `useReducer`. Beyond two, an object is better: callers do not have to remember an order, extra values can be added without breaking positional destructuring, and no `as const` is needed.",
    },
  ],
  takeaways: [
    "Type a context as `T | undefined`, default `undefined`, and check once in a guard hook that throws",
    "Export the provider and the hook, not the context, so consumers cannot skip the guard",
    "A fresh object as a context value re-renders every consumer — memoise it",
    "DOM refs are `T | null` because React fills them after mount; mutable refs are typed however you declare them",
    "React 19 made `ref` an ordinary prop, so `forwardRef` is no longer needed to receive one",
    "An array returned from a hook widens to a union array — `as const` or an explicit tuple type fixes it",
    "Two values, return a tuple; three or more, return an object",
    "Use a lazy initialiser (`useState(() => …)`) when the initial value costs something to compute",
  ],
  status: "available",
};
