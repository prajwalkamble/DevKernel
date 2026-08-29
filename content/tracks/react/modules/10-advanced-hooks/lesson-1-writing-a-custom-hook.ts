import type { Lesson } from "@/content/types";

export const writingACustomHookLesson: Lesson = {
  id: "react-writing-a-custom-hook",
  slug: "writing-a-custom-hook",
  moduleSlug: "advanced-and-custom-hooks",
  title: "Writing a Custom Hook",
  summary:
    "A function whose name starts with `use`. That really is the whole definition — and the slot machinery from module 5 explains every property that follows from it, including why two components using the same hook never share a thing.",
  estimatedMinutes: 28,
  objectives: [
    "Extract a custom hook from a component",
    "Explain why calling one is the same as inlining its body",
    "Say what the `use` prefix does and does not do",
    "Decide what belongs in a hook and what belongs in a plain function",
    "Place a hook's file according to how many things call it",
  ],
  sections: [
    {
      id: "the-definition",
      heading: "The whole definition",
      body: [
        "A custom hook is **a function that calls other hooks, whose name begins with `use`**. There is no registration, no React API, no wrapper. `useCounter` is as much a hook as `useState` because it calls one.",
        "Module 5 established the mechanism: a component instance owns an ordered list of slots, and each hook call takes the next one. A custom hook has no list of its own — calling it simply runs its body, and *its* hook calls take slots in whichever component is currently rendering.",
        "Every property people find surprising falls out of that one fact: two components calling the same hook are two separate runs, with two separate sets of slots.",
      ],
      examples: [
        {
          id: "two-instances",
          title: "One hook, two components, two states",
          lang: "jsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A custom hook is a function whose name begins with \`use\` and which calls
   other hooks. There is no registration and no React API involved. */
function useCounter(start = 0) {
  const [n, setN] = useState(start);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (n !== start) setTouched(true);
  }, [n, start]);
  return { n, touched, increment: () => setN((c) => c + 1) };
}

function Left() {
  const { n, touched, increment } = useCounter();
  return <button type="button" className="left" onClick={increment}>{n}{touched ? "*" : ""}</button>;
}
function Right() {
  const { n, touched, increment } = useCounter(10);
  return <button type="button" className="right" onClick={increment}>{n}{touched ? "*" : ""}</button>;
}
function App() { return <><Left /><Right /></>; }

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
const show = () => \`left=\${container.querySelector(".left").textContent} right=\${container.querySelector(".right").textContent}\`;

console.log("both mounted:            ", show());
act(() => { container.querySelector(".left").click(); });
act(() => { container.querySelector(".left").click(); });
console.log("two clicks on the left:  ", show());
act(() => { container.querySelector(".right").click(); });
console.log("one click on the right:  ", show());
console.log("the hook is shared; the state is not.");`,
          output: `both mounted:             left=0 right=10
two clicks on the left:   left=2* right=10
one click on the right:   left=2* right=11*
the hook is shared; the state is not.`,
          explanation:
            "Two clicks on the left moved the left counter to 2 and did nothing to the right. **A custom hook shares logic, never state.** If you want two components to share a value, that is lifting it or a store — module 8 — and a hook cannot do it however you write it.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A custom hook is a function whose name begins with \`use\` and which calls
   other hooks. There is no registration and no React API involved. */
function useCounter(start = 0) {
  const [n, setN] = useState(start);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (n !== start) setTouched(true);
  }, [n, start]);
  return { n, touched, increment: () => setN((c) => c + 1) };
}

function Left() {
  const { n, touched, increment } = useCounter();
  return <button type="button" className="left" onClick={increment}>{n}{touched ? "*" : ""}</button>;
}
function Right() {
  const { n, touched, increment } = useCounter(10);
  return <button type="button" className="right" onClick={increment}>{n}{touched ? "*" : ""}</button>;
}
function App() { return <><Left /><Right /></>; }

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<App />); });
const show = () => \`left=\${container.querySelector(".left")!.textContent} right=\${container.querySelector(".right")!.textContent}\`;

console.log("both mounted:            ", show());
act(() => { container.querySelector<HTMLButtonElement>(".left")!.click(); });
act(() => { container.querySelector<HTMLButtonElement>(".left")!.click(); });
console.log("two clicks on the left:  ", show());
act(() => { container.querySelector<HTMLButtonElement>(".right")!.click(); });
console.log("one click on the right:  ", show());
console.log("the hook is shared; the state is not.");`,
            },
          ],
        },
      ],
    },
    {
      id: "the-prefix",
      heading: "What the `use` prefix does",
      body: [
        "It is a **convention that tooling relies on**, not a language feature. React does not read your function names at runtime.",
        "What actually depends on it: the `rules-of-hooks` lint rule, which uses the prefix to decide whether a function is allowed to call hooks and whether its callers must obey the rules. And React DevTools, which uses it to display the hook's name in the inspector.",
        "So the consequences of getting it wrong are concrete. Name a hook `getUser` and the linter stops checking its call sites — a conditional call inside a component goes unflagged, and you get module 5's slot-shifting bug with no warning. Name a plain function `useFormat` and the linter starts insisting its callers behave like components.",
        "The rule reads cleanly: **`use` if and only if it calls a hook.**",
      ],
      pitfalls: [
        {
          title: "The rules of hooks apply inside a custom hook, unchanged",
          body: "No conditional calls, no calls in loops, no early return before a hook. This is not an extra rule for hooks — it is the same rule, because the hook's calls are the component's calls. A custom hook with an `if` in front of a `useState` breaks the component that calls it, and the component's own code looks fine.",
        },
      ],
    },
    {
      id: "extracting",
      heading: "Extracting one",
      body: [
        "The mechanical move: take the state, the effects and the handlers that belong together, put them in a function, and return what the component needs.",
        "The judgement is what \"belong together\" means. **A hook should have a name that describes a capability, not a location.** `useSearchFilters` is a capability. `useHeaderLogic` is a place, and a hook named after a place accumulates everything that happens in that place.",
      ],
      examples: [
        {
          id: "extraction",
          title: "Before and after",
          lang: "jsx",
          code: `// Before: three concerns in one component body.
function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const [results, setResults] = useState([]);
  useEffect(() => {
    let ignore = false;
    search(debounced).then((r) => { if (!ignore) setResults(r); });
    return () => { ignore = true; };
  }, [debounced]);

  return <>{/* … */}</>;
}

// After: two capabilities, each named, each usable elsewhere.
function useDebounced(value, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

function useSearch(query) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    let ignore = false;
    search(query).then((r) => { if (!ignore) setResults(r); });
    return () => { ignore = true; };
  }, [query]);
  return results;
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useSearch(useDebounced(query));
  return <>{/* … */}</>;
}`,
          explanation:
            "The component went from twelve lines of mechanism to two lines of intent, and neither hook mentions searching *pages* — `useDebounced` will be used by something else within a month. Note that the extraction did not remove a single effect; it moved them somewhere they can be understood one at a time.",
          alternates: [
            {
              lang: "tsx",
              code: `// Before: three concerns in one component body.
function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const [results, setResults] = useState<Hit[]>([]);
  useEffect(() => {
    let ignore = false;
    search(debounced).then((r) => { if (!ignore) setResults(r); });
    return () => { ignore = true; };
  }, [debounced]);

  return <>{/* … */}</>;
}

// After: two capabilities, each named, each usable elsewhere.
function useDebounced<T>(value: T, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

function useSearch(query: string) {
  const [results, setResults] = useState<Hit[]>([]);
  useEffect(() => {
    let ignore = false;
    search(query).then((r) => { if (!ignore) setResults(r); });
    return () => { ignore = true; };
  }, [query]);
  return results;
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useSearch(useDebounced(query));
  return <>{/* … */}</>;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Extraction does not make an unnecessary effect necessary",
          body: "Module 7's rule survives the move: a `useDebounced` is a real synchronisation with a timer and deserves an effect, while a hook that wraps `useState` plus an effect that derives a value from it is the anti-pattern with a nicer name. Wrapping does not launder it.",
        },
        {
          title: "Not everything should be a hook",
          body: "If it does not call a hook, it is a plain function and should stay one. `formatMoney`, `parseFilters`, `sortRows` — none of them need a component, none of them need to be inside a render, and all of them are easier to test as functions. The test is exactly whether the body needs state, an effect, a ref or a context.",
        },
      ],
    },
    {
      id: "where-it-lives",
      heading: "Where the file goes",
      body: [
        "Same rule as everything else in module 3: **a hook lives next to its only caller, and moves outward when it gains a second one.**",
        "Step the listing. Three steps, and the interesting one is the last, where the hook is renamed because it no longer belongs to the feature it came from.",
      ],
      pitfalls: [
        {
          title: "A `hooks/` folder at the root is where single-caller hooks go to hide",
          body: "Creating `src/hooks/` on day one guarantees every hook is written into it, including the ones used by exactly one component. Then deleting that component leaves a hook nothing calls, and nobody can tell — which is the same argument module 3 made about `components/`, in a smaller folder.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a custom hook?",
      answer:
        "A function that calls other hooks, whose name begins with `use`. That is the whole definition — no registration, no React API. It has no state of its own: calling it is the same as inlining its body, so its hook calls claim slots in the calling component's list. Which is why two components using the same hook get two completely independent copies, and why a hook can share logic but never state.",
    },
    {
      question: "What does the `use` prefix actually do?",
      answer:
        "Nothing at runtime — it is a convention that tooling depends on. The `rules-of-hooks` lint rule uses it to decide whether a function may call hooks and whether its callers must obey the rules, and DevTools uses it to label the hook. The practical consequence is that a hook named without the prefix stops being lint-checked, so a conditional call inside it shifts every later slot with nothing to warn you.",
    },
    {
      question: "How do you decide whether something should be a hook or a plain function?",
      answer:
        "Whether the body needs state, an effect, a ref or a context. If it does not, it is a plain function and should stay one — a formatter or a sorter needs no component, no render, and is easier to test as a function. Wrapping it in a hook adds a rule about where it can be called for no benefit.",
    },
    {
      question: "Where should a custom hook's file live?",
      answer:
        "Next to its only caller, moving outward as it gains callers: a function in the component's own file when one thing uses it, a file in the feature folder when a second component in that feature does, and the shared layer only when a second *feature* does — with a rename at that point, because a hook keeping the original feature's vocabulary has not really been shared. A root `hooks/` folder created up front attracts single-caller hooks and hides the dead ones.",
    },
  ],
  takeaways: [
    "A custom hook is a function that calls hooks, named `use…` — that is the entire definition",
    "It has no state of its own; its hook calls claim slots in the calling component",
    "So it shares logic and never state — two callers get two independent copies",
    "The `use` prefix is what the lint rule and DevTools key off, and nothing else",
    "The rules of hooks apply inside it unchanged, because its calls are the component's calls",
    "Name it after a capability, not a place — `useHeaderLogic` will accumulate everything",
    "If it does not call a hook, it is a plain function",
    "The file moves outward as callers accumulate; a root `hooks/` folder created early hides dead hooks",
  ],
  status: "available",
};
