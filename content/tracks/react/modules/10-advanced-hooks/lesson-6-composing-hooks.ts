import type { Lesson } from "@/content/types";

export const composingHooksLesson: Lesson = {
  id: "react-composing-hooks",
  slug: "composing-hooks-and-return-shapes",
  moduleSlug: "advanced-and-custom-hooks",
  title: "Composing Hooks, and the Shape They Return",
  summary:
    "Hooks build on hooks, which is the point. The two return shapes and the rule that picks between them, why an unstable return value ruins every consumer downstream, and how to keep a composed hook from becoming a hook nobody can use twice.",
  estimatedMinutes: 26,
  objectives: [
    "Choose between an array and an object return, with a rule",
    "Keep a hook's returned functions stable, and say why it matters",
    "Compose hooks without inventing a hook per screen",
    "Type a generic custom hook",
    "Recognise a hook that has grown too many responsibilities",
  ],
  sections: [
    {
      id: "composition",
      heading: "Hooks compose because they are functions",
      body: [
        "A custom hook may call any hook, including your own. There is no depth limit and no ceremony — `useSearchResults` calls `useDebounced`, which calls `useState` and `useEffect`, and the slots all land in the same component's list.",
        "The thing to watch is not depth; it is **whether each layer has a name that means something**. A chain of three well-named hooks reads like a sentence. A chain of three hooks named after the screen they were extracted from reads like a call stack.",
      ],
    },
    {
      id: "shapes",
      heading: "Array or object",
      body: [
        "React's own hooks demonstrate both, and the difference is not stylistic.",
        "**Return an array** when the caller will rename the values, and there are at most two or three. `const [on, toggle] = useToggle()` and `const [open, setOpen] = useToggle()` in the same component, with no renaming syntax. That is why `useState` returns one.",
        "**Return an object** when there are more than three values, or when callers want different subsets. `const { data, error } = useQuery(…)` takes two of six without naming the other four, and the hook can add a seventh without touching a single call site.",
        "The rule that decides it: **will callers routinely want a subset?** If yes, an object; positional destructuring forces you to name everything up to the last one you want.",
      ],
      examples: [
        {
          id: "return-shapes",
          title: "Both shapes, at the call site",
          lang: "jsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* Two shapes for the same hook, and what each costs at the call site. */

/* An array: positional, so the caller names everything. Right when there are
   at most two or three values and every caller wants all of them. */
function useToggleArray(initial = false) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn((v) => !v)];
}

/* An object: named, so the caller takes what it needs and the hook can grow
   a field without touching a single call site. */
function useFetchLike(id) {
  const [state, setState] = useState({
    status: "loading", data: null,
  });
  useEffect(() => { setState({ status: "ready", data: \`record \${id}\` }); }, [id]);
  return { ...state, refetch: () => setState({ status: "loading", data: null }) };
}

function Demo() {
  // Positional: two different toggles, named freely, no renaming syntax.
  const [menuOpen, toggleMenu] = useToggleArray();
  const [darkMode, toggleDark] = useToggleArray(true);

  // Named: this component wants two of the four fields and says so.
  const { status, data } = useFetchLike("a1");

  return (
    <output>
      {\`menu=\${menuOpen} dark=\${darkMode} status=\${status} data=\${data} \`}
      <button type="button" id="m" onClick={toggleMenu}>m</button>
      <button type="button" id="d" onClick={toggleDark}>d</button>
    </output>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<Demo />); });
const show = () => container.querySelector("output").textContent.trim();
console.log("mounted:            ", show());
act(() => { container.querySelector("#m").click(); });
console.log("after toggling menu:", show());
act(() => { container.querySelector("#d").click(); });
console.log("after toggling dark:", show());`,
          output: `mounted:             menu=false dark=true status=ready data=record a1 md
after toggling menu: menu=true dark=true status=ready data=record a1 md
after toggling dark: menu=true dark=false status=ready data=record a1 md`,
          explanation:
            "Two `useToggleArray` calls in one component, named `menuOpen` and `darkMode` with no ceremony. The same with an object would be `const { on: menuOpen, toggle: toggleMenu } = …` twice — which is the cost of an object return when the caller wants everything and wants to rename it.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* Two shapes for the same hook, and what each costs at the call site. */

/* An array: positional, so the caller names everything. Right when there are
   at most two or three values and every caller wants all of them. */
function useToggleArray(initial = false) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn((v) => !v)] as const;
}

/* An object: named, so the caller takes what it needs and the hook can grow
   a field without touching a single call site. */
function useFetchLike(id: string) {
  const [state, setState] = useState<{ status: string; data: string | null }>({
    status: "loading", data: null,
  });
  useEffect(() => { setState({ status: "ready", data: \`record \${id}\` }); }, [id]);
  return { ...state, refetch: () => setState({ status: "loading", data: null }) };
}

function Demo() {
  // Positional: two different toggles, named freely, no renaming syntax.
  const [menuOpen, toggleMenu] = useToggleArray();
  const [darkMode, toggleDark] = useToggleArray(true);

  // Named: this component wants two of the four fields and says so.
  const { status, data } = useFetchLike("a1");

  return (
    <output>
      {\`menu=\${menuOpen} dark=\${darkMode} status=\${status} data=\${data} \`}
      <button type="button" id="m" onClick={toggleMenu}>m</button>
      <button type="button" id="d" onClick={toggleDark}>d</button>
    </output>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<Demo />); });
const show = () => container.querySelector("output")!.textContent!.trim();
console.log("mounted:            ", show());
act(() => { container.querySelector<HTMLButtonElement>("#m")!.click(); });
console.log("after toggling menu:", show());
act(() => { container.querySelector<HTMLButtonElement>("#d")!.click(); });
console.log("after toggling dark:", show());`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`as const` is required on an array return",
          body: "Without it TypeScript infers `(boolean | (() => void))[]` — an array of the union — so `const [on, toggle] = useToggle()` gives both variables that union type and calling `toggle()` is an error. `as const` makes it the tuple `readonly [boolean, () => void]`, which is what destructuring needs.",
        },
      ],
    },
    {
      id: "stability",
      heading: "A hook's return value is somebody's dependency",
      body: [
        "This is the part that separates a hook people enjoy using from one they fight.",
        "Whatever a hook returns ends up in a dependency array, in a memoised child's props, or in a context value. If it has a new identity on every render, **every one of those breaks**, and the caller cannot fix it — the instability is inside your hook.",
        "So: stabilise what you return. Functions with `useCallback`, objects with `useMemo`. And prefer the shapes that are stable for free — a state setter, a `dispatch`, and a primitive all are.",
      ],
      examples: [
        {
          id: "stable-return",
          title: "The same hook, twice",
          lang: "jsx",
          code: `// Unusable downstream. Both fields are new on every render, so a caller's
// useEffect([reset]) fires forever and a memoised child never skips —
// and there is nothing the caller can do about it.
function useForm(initial) {
  const [values, setValues] = useState(initial);
  return {
    values,
    reset: () => setValues(initial),
    setField: (k, v) => setValues((s) => ({ ...s, [k]: v })),
  };
}

// Usable. \`reset\` and \`setField\` keep their identity, so the object only
// changes when \`values\` does — and callers can depend on any of it.
function useForm(initial) {
  const [values, setValues] = useState(initial);

  const reset = useCallback(() => setValues(initial), [initial]);
  const setField = useCallback(
    (k, v) => setValues((s) => ({ ...s, [k]: v })),
    [],   // the updater form means it needs nothing from this render
  );

  return useMemo(() => ({ values, reset, setField }), [values, reset, setField]);
}

// Better still: return them separately, so a caller that only writes never
// re-renders when \`values\` changes. Same idea as splitting a context.
function useForm(initial) {
  // …
  return [values, useMemo(() => ({ reset, setField }), [reset, setField])];
}`,
          explanation:
            "The `useCallback` on `setField` has an empty dependency array because it uses the updater form of the setter — it needs nothing from the render that created it. That is the shape to aim for: **write the callbacks so their dependency lists are empty**, and the stability comes for free rather than being maintained.",
          alternates: [
            {
              lang: "tsx",
              code: `// Unusable downstream. Both fields are new on every render, so a caller's
// useEffect([reset]) fires forever and a memoised child never skips —
// and there is nothing the caller can do about it.
function useForm(initial: Values) {
  const [values, setValues] = useState(initial);
  return {
    values,
    reset: () => setValues(initial),
    setField: (k: string, v: string) => setValues((s) => ({ ...s, [k]: v })),
  };
}

// Usable. \`reset\` and \`setField\` keep their identity, so the object only
// changes when \`values\` does — and callers can depend on any of it.
function useForm(initial: Values) {
  const [values, setValues] = useState(initial);

  const reset = useCallback(() => setValues(initial), [initial]);
  const setField = useCallback(
    (k: string, v: string) => setValues((s) => ({ ...s, [k]: v })),
    [],   // the updater form means it needs nothing from this render
  );

  return useMemo(() => ({ values, reset, setField }), [values, reset, setField]);
}

// Better still: return them separately, so a caller that only writes never
// re-renders when \`values\` changes. Same idea as splitting a context.
function useForm(initial: Values) {
  // …
  return [values, useMemo(() => ({ reset, setField }), [reset, setField])] as const;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The React Compiler does not excuse this",
          body: "It memoises what it can prove, and it can only prove things about code it compiles. A published hook is consumed by codebases that may not have the compiler on, and a hook whose stability depends on the caller's build configuration is a hook that behaves differently in two projects. Stabilise a shared hook's return by hand.",
        },
      ],
    },
    {
      id: "too-much",
      heading: "When a hook has too many responsibilities",
      body: [
        "**It returns more than about six things.** That is several hooks that were extracted together because they happened to be in the same component.",
        "**Its name contains \"and\", or is a screen name.** `useProductPageState` is a bag; `useProductFilters` and `useProductSelection` are two hooks.",
        "**Every caller destructures a different half.** A strong signal that there are two hooks in there, and each caller wants one of them.",
        "**It takes flags that switch off parts of it.** `useThing({ withPolling: false })` is two hooks joined by a boolean, and the boolean is a worse interface than two names.",
        "The counter-signal, and it is real: **a hook per screen is worse than one long component.** Extracting `useCheckoutPage` from `CheckoutPage` moves the code to another file and changes nothing else — the same length, the same responsibilities, one more indirection. Extract capabilities, not screens.",
      ],
      examples: [
        {
          id: "generic-hook",
          title: "Typing a generic hook",
          lang: "javascript",
          code: `/* One type parameter, inferred from the argument, so callers write
   nothing. \`useLocalStorage("theme", "light")\` gives \`string\`; passing an
   object gives that object's type. */
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw));
    } catch {
      // A private window, a full quota, or a value that is not JSON.
      return fallback;
    }
  });

  // Same signature as useState's setter, so it is a drop-in replacement —
  // including the updater form, which callers will expect.
  const set = useCallback((next) => {
    setValue((previous) => {
      const resolved = next instanceof Function ? next(previous) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* quota, or storage disabled */ }
      return resolved;
    });
  }, [key]);

  return [value, set];
}`,
          explanation:
            "Two decisions worth copying. The type parameter is inferred from `fallback`, so no caller writes an annotation. And the returned setter matches `useState`'s exactly, updater form included — a hook that looks like the thing it replaces is a hook nobody has to read the source of.",
          alternates: [
            {
              lang: "typescript",
              code: `/* One type parameter, inferred from the argument, so callers write
   nothing. \`useLocalStorage("theme", "light")\` gives \`string\`; passing an
   object gives that object's type. */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      // A private window, a full quota, or a value that is not JSON.
      return fallback;
    }
  });

  // Same signature as useState's setter, so it is a drop-in replacement —
  // including the updater form, which callers will expect.
  const set = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const resolved = next instanceof Function ? next(previous) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* quota, or storage disabled */ }
      return resolved;
    });
  }, [key]);

  return [value, set] as const;
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Should a custom hook return an array or an object?",
      answer:
        "An array when there are at most two or three values and callers will rename them — `const [open, setOpen] = useToggle()` twice in one component, with no renaming syntax, which is why `useState` returns one. An object when there are more, or when callers want different subsets: they take two of six without naming the rest, and the hook can add a field without touching any call site. The deciding question is whether callers routinely want a subset.",
    },
    {
      question: "Why does it matter whether a hook's return value is stable?",
      answer:
        "Because it becomes somebody else's dependency — a dependency array, a memoised child's props, a context value. A function or object rebuilt on every render breaks all of them, and the caller cannot fix it, because the instability is inside the hook. So a shared hook stabilises what it returns: `useCallback` for functions, `useMemo` for objects, and callbacks written in the updater form so their dependency lists are empty and the stability is free rather than maintained.",
    },
    {
      question: "When has a custom hook grown too big?",
      answer:
        "When it returns more than about six things, when its name is a screen name or contains \"and\", when every caller destructures a different half of it, or when it takes flags that switch parts of it off — that last one is two hooks joined by a boolean. The opposite mistake is also common: extracting a `useCheckoutPage` from `CheckoutPage` moves the code and changes nothing. Extract capabilities, not screens.",
    },
    {
      question: "How do you type a generic custom hook?",
      answer:
        "One type parameter inferred from an argument, so callers write no annotations — `useLocalStorage<T>(key: string, fallback: T)` infers `T` from `fallback`. Return `as const` for a tuple, or TypeScript widens it to an array of the union and destructuring produces the wrong types. And where the hook stands in for a built-in, match its signature exactly — including `useState`'s updater form — so nobody has to read the source to use it.",
    },
  ],
  takeaways: [
    "Hooks compose because they are functions — watch the names, not the depth",
    "Array for two or three values callers will rename; object when callers want subsets",
    "`as const` on a tuple return, or destructuring gets the union type",
    "A hook's return value becomes somebody's dependency — stabilise it inside the hook",
    "Write callbacks in the updater form so their dependency lists are empty",
    "The compiler does not excuse this for a shared hook: consumers may not compile it",
    "Too big: six-plus returns, a screen name, callers taking different halves, or feature flags",
    "Extract capabilities, not screens — `useCheckoutPage` moves code and changes nothing",
    "Match a built-in's signature when standing in for it",
  ],
  status: "available",
};
