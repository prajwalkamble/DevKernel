import type { Lesson } from "@/content/types";

export const genericComponentsLesson: Lesson = {
  id: "react-generic-components",
  slug: "generic-components-and-hooks",
  moduleSlug: "testing-typescript-tooling",
  title: "Generic Components & Typing a Hook",
  summary:
    "One type parameter that makes three props agree with each other, the arrow-function syntax that breaks in .tsx files, and the two-character fix that stops a custom hook's tuple return from being useless.",
  estimatedMinutes: 28,
  objectives: [
    "Write a generic component and let inference do the work",
    "Work around the .tsx arrow-function ambiguity",
    "Type a hook that returns a tuple, and know why as const matters",
    "Type a hook that must be used inside a provider",
    "Constrain a type parameter without over-constraining it",
  ],
  sections: [
    {
      id: "why",
      heading: "The problem a generic solves",
      body: [
        "A reusable list takes an array, a way to get a key, and a way to render a row. Type the array as `unknown[]` and the other two props know nothing about what they receive; type it as `any[]` and you have turned the checker off for the whole component.",
        "What you want to say is: *these three props are about the same type, whatever it turns out to be.* That is a type parameter.",
      ],
      examples: [
        {
          id: "generic-list",
          title: "One parameter, three props, no annotation at the call site",
          lang: "tsx",
          code: `import type { ReactNode } from "react";

/* One type parameter connects three props: the array, the key extractor and
   the renderer all agree about what a row is. */
interface ListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
}

export function List<T>({ items, getKey, children }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{children(item)}</li>)}</ul>;
}

interface User { id: string; name: string; age: number }
const users: User[] = [{ id: "1", name: "Ada", age: 36 }];

/* T is inferred as User. Nothing was annotated at the call site. */
export const good = (
  <List items={users} getKey={(u) => u.id}>
    {(u) => <span>{u.name}</span>}
  </List>
);

/* And the mistakes it now catches. */
export const bad1 = (
  <List items={users} getKey={(u) => u.age}>
    {(u) => <span>{u.name}</span>}
  </List>
);
export const bad2 = (
  <List items={users} getKey={(u) => u.id}>
    {(u) => <span>{u.emailAddress}</span>}
  </List>
);`,
          output: `src/generic.tsx(27,38): error TS2322: Type 'number' is not assignable to type 'string'.
src/generic.tsx(33,22): error TS2339: Property 'emailAddress' does not exist on type 'User'.`,
          explanation:
            "`T` is inferred from `items` and then flows into the other two props. The call site says nothing about types; the two mistakes are still caught, and `u` autocompletes inside the render function. `children` as a *function* is what makes that possible — a render prop is the only way for the caller's JSX to receive a value the caller did not create.",
          requires: "tsc (the output is its diagnostics, not a program's)",
        },
      ],
    },
    {
      id: "the-syntax-trap",
      heading: "The syntax trap in a .tsx file",
      body: [
        "`const List = <T>(props: ListProps<T>) => …` does not compile in a `.tsx` file. `<T>` is parsed as the start of a JSX element, and the error is about an unclosed tag rather than about generics, which makes it hard to search for.",
        "Three ways out, in order of preference: write it as a `function` declaration, which has no ambiguity; add a constraint, `<T,>` or `<T extends unknown>`, so the parser commits to a type parameter; or put it in a `.ts` file, which is rarely an option for a component.",
        "Function declarations are the right answer, and this is the one place where the `const Component = () =>` house style has a real cost.",
      ],
      examples: [
        {
          id: "syntax",
          title: "The three spellings",
          lang: "tsx",
          code: `/* ✗ In a .tsx file, <T> starts a JSX element. */
const List = <T>(props: ListProps<T>) => { /* … */ };

/* ✓ A function declaration: no ambiguity, nothing to work around. */
function List<T>(props: ListProps<T>) { /* … */ }

/* ✓ The trailing comma, which exists purely to disambiguate. */
const List = <T,>(props: ListProps<T>) => { /* … */ };

/* ✓ Or a constraint, which does the same and reads better. */
const List = <T extends unknown>(props: ListProps<T>) => { /* … */ };`,
          explanation:
            "The lone comma in `<T,>` looks like a typo and is not — it is the standard workaround, and a formatter that removes it will break your build. Prefer the function declaration.",
        },
      ],
    },
    {
      id: "constraints",
      heading: "Constraining a parameter",
      body: [
        "`<T>` accepts anything. If the component needs the items to have something, say so: `<T extends { id: string }>` lets you drop the `getKey` prop entirely.",
        "The judgement call is that every constraint you add is a caller you turn away. A list that requires `id: string` cannot be used with an array of strings, and the `getKey` prop existed precisely so it could be. Constrain when the component genuinely cannot work otherwise; otherwise take a function and let the caller answer the question.",
      ],
      examples: [
        {
          id: "constraint",
          title: "The trade",
          lang: "tsx",
          code: `/* Constrained: simpler to call, and only for things with an id. */
function List<T extends { id: string }>({ items, children }: {
  items: T[];
  children: (item: T) => ReactNode;
}) {
  return <ul>{items.map((item) => <li key={item.id}>{children(item)}</li>)}</ul>;
}

/* Unconstrained: one more prop, and it works for string[], number[],
   a tuple, a row from a table with a composite key — anything. */
function List<T>({ items, getKey, children }: {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
}) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{children(item)}</li>)}</ul>;
}`,
          explanation:
            "Neither is right in general. The question is whether the things this list will hold always have an id, and the honest answer for a component in a design system is usually no.",
        },
      ],
    },
    {
      id: "hook-returns",
      heading: "Typing what a hook returns",
      body: [
        "The two shapes, and when to use each:",
        "**A tuple** — for two or three values whose names the caller should choose. `useState` returns one; so should `useToggle` and `useDisclosure`. The caller writes `const [isOpen, toggleOpen] = useToggle()`, and can use two of them in one component without renaming anything.",
        "**An object** — for four or more, or when the caller usually wants a subset. `const { data, error, isLoading } = useQuery(…)` would be unreadable as a five-element tuple.",
        "And a tuple needs two extra characters, without which it is not a tuple at all.",
      ],
      examples: [
        {
          id: "as-const",
          title: "Two characters, and what happens without them",
          lang: "tsx",
          code: `import { useCallback, useState } from "react";

/* No \`as const\`: TypeScript widens this to an array of the union. */
function useToggleLoose(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}

/* With it, the positions keep their own types. */
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;
}

export function Loose() {
  const [on, toggle] = useToggleLoose();
  return <button onClick={toggle}>{on ? "on" : "off"}</button>;
}

export function Tight() {
  const [on, toggle] = useToggle();
  return <button onClick={toggle}>{on ? "on" : "off"}</button>;
}`,
          output: `src/tuple.tsx(19,18): error TS2322: Type 'boolean | (() => void)' is not assignable to type 'MouseEventHandler<HTMLButtonElement> | undefined'.
  Type 'boolean' is not assignable to type 'MouseEventHandler<HTMLButtonElement>'.`,
          explanation:
            "Without `as const` the return type is `(boolean | (() => void))[]` — an array where every position might be either. So `toggle` might be a boolean, `on` might be a function, and the error appears at the *use* site, some distance from the hook that caused it. `as const` makes it `readonly [boolean, () => void]` and both positions become exact. The alternative is an explicit return annotation, which is more to maintain and says the same thing.",
          requires: "tsc (the output is its diagnostics, not a program's)",
        },
      ],
    },
    {
      id: "context-hook",
      heading: "The hook that must be inside its provider",
      body: [
        "Module 8's context hook has a typing problem: `createContext<T | null>(null)` means every consumer gets `T | null` and has to check for null, forever, for a case that is a programming error rather than a state.",
        "The fix is one function that throws, and narrows.",
      ],
      examples: [
        {
          id: "context-hook-code",
          title: "Throwing to narrow",
          lang: "tsx",
          code: `interface TabsValue {
  active: string;
  select: (id: string) => void;
}

/* null is the only honest default — there is no meaningful "no tabs" value. */
const TabsContext = createContext<TabsValue | null>(null);

export function useTabs(): TabsValue {
  const value = useContext(TabsContext);
  /* The throw is a type guard as well as a runtime check: after it,
     TypeScript knows value is TabsValue, so every caller gets a
     non-nullable type and writes no null check of its own. */
  if (value === null) {
    throw new Error("useTabs must be used inside <Tabs>. Wrap the component in one.");
  }
  return value;
}`,
          explanation:
            "Two things for the price of one line. The runtime error names both components and says what to do, which is the whole error-handling story of a compound component. And the return type is non-nullable, so a hundred call sites stop writing `if (!tabs) return null` for a situation that cannot legally occur.",
        },
      ],
      pitfalls: [
        {
          title: "Do not fake a default to avoid the null",
          body: "`createContext<TabsValue>({ active: \"\", select: () => {} })` removes the null and removes the error with it: a component used outside its provider now silently does nothing, which is a much worse afternoon than an exception with a sentence in it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you make a component generic?",
      answer:
        "When two or more props have to agree about a type the component does not know — a list that takes items, a key extractor and a row renderer. One type parameter says \"these are all about the same thing\", and inference fills it in from the items, so the call site annotates nothing and still catches a key extractor returning the wrong type or a row reading a field that does not exist.",
    },
    {
      question: "Why does an arrow function with a type parameter fail in a .tsx file?",
      answer:
        "Because `<T>` is parsed as the start of a JSX element, and the error is about an unclosed tag rather than about generics. The fixes are a `function` declaration, which has no ambiguity, or the trailing comma `<T,>`, or a constraint like `<T extends unknown>`. The function declaration is the right answer, and it is the one place where an all-arrow-functions house style has a genuine cost.",
    },
    {
      question: "Why does a hook that returns a tuple need `as const`?",
      answer:
        "Without it, TypeScript widens the return to an array of the union of the element types — `(boolean | (() => void))[]` — so both destructured positions get both types and the error surfaces at the call site rather than in the hook. `as const` makes it a `readonly` tuple, so each position keeps its own type. The alternative is an explicit return annotation, which is more to maintain.",
    },
    {
      question: "How do you type a hook that must be used inside a provider?",
      answer:
        "Create the context as `T | null` with `null` as the default, and have the hook throw when it reads `null`. The throw is a type guard as well as a runtime check, so the hook's return type is non-nullable and no call site writes a null check for a case that is a programming error. Faking a default object instead removes the error message and replaces a loud failure with a silent one.",
    },
  ],
  takeaways: [
    "A type parameter makes several props agree about a type the component does not know",
    "Inference from `items` means the call site annotates nothing",
    "`children` as a function is how the caller's JSX receives a value it did not create",
    "`const X = <T>(…)` breaks in `.tsx`; use a function declaration, `<T,>`, or a constraint",
    "Every constraint you add is a caller you turn away — take a function instead where you can",
    "Tuple returns for two or three values, object returns for more",
    "A tuple return needs `as const` or both positions get the union of both types",
    "A context hook that throws on `null` is both the runtime check and the type narrowing",
    "A fake default context value turns a loud error into a silent no-op",
  ],
  status: "available",
};
