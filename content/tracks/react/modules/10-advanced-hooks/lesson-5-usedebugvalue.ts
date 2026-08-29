import type { Lesson } from "@/content/types";

export const useDebugValueLesson: Lesson = {
  id: "react-usedebugvalue",
  slug: "usedebugvalue-and-devtools",
  moduleSlug: "advanced-and-custom-hooks",
  title: "useDebugValue and the DevTools Story",
  summary:
    "What DevTools shows for a custom hook by default, why that is unreadable for anything with three hooks in it, and the one-line hook that fixes it — plus the lazy-format argument nobody uses and should.",
  estimatedMinutes: 18,
  objectives: [
    "Describe how DevTools displays a custom hook",
    "Add a readable label with useDebugValue",
    "Use the formatter argument and say why it exists",
    "Decide which hooks deserve one",
    "Name the other DevTools features for hooks",
  ],
  sections: [
    {
      id: "the-default",
      heading: "What DevTools shows by default",
      body: [
        "Select a component in the DevTools **Components** tab and the right panel lists its hooks — in call order, since that is the only order there is.",
        "A custom hook appears as a named group with its internal hooks nested inside. `useSearch` containing `State`, `State`, `Effect` is fine when you wrote it five minutes ago.",
        "It stops being fine when a hook has three `useState`s, two `useRef`s and an effect. You get seven unnamed rows, and working out which `State` is which means counting them against the source. The panel is telling you everything and communicating nothing.",
      ],
    },
    {
      id: "the-fix",
      heading: "`useDebugValue`",
      body: [
        "One line, and it puts a label next to the hook's name in the panel: `useSearch: \"ada\" (3 results)` instead of a group you have to expand.",
        "It does nothing at runtime and is stripped from production builds, so it costs nothing to ship.",
      ],
      examples: [
        {
          id: "debug-value",
          title: "Labelling a hook",
          lang: "jsx",
          code: `function useSearch(query) {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const lastQuery = useRef(query);

  useEffect(() => { /* … */ }, [query]);

  // Shown beside "useSearch" in the Components panel. Development only.
  useDebugValue(\`\${status}: "\${query}" → \${results.length} hits\`);

  return { results, status };
}

/* The second argument is a formatter, called only when the hook is actually
   being inspected. It exists for values that are expensive to render as a
   string — and nobody uses it, so most codebases quietly do the work on
   every render of every component using the hook. */
function useSelection(nodes) {
  useDebugValue(nodes, (set) =>
    // Only runs when somebody opens this hook in DevTools.
    [...set].map((n) => n.nodeName).join(", "));

  return nodes;
}`,
          explanation:
            "The formatter is the part worth remembering. `useDebugValue(expensiveToString(x))` computes the string on every render whether or not DevTools is open; `useDebugValue(x, expensiveToString)` computes it only when somebody looks. Same information, and no cost in the common case where nobody is looking.",
          alternates: [
            {
              lang: "tsx",
              code: `function useSearch(query: string) {
  const [results, setResults] = useState<Hit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const lastQuery = useRef(query);

  useEffect(() => { /* … */ }, [query]);

  // Shown beside "useSearch" in the Components panel. Development only.
  useDebugValue(\`\${status}: "\${query}" → \${results.length} hits\`);

  return { results, status };
}

/* The second argument is a formatter, called only when the hook is actually
   being inspected. It exists for values that are expensive to render as a
   string — and nobody uses it, so most codebases quietly do the work on
   every render of every component using the hook. */
function useSelection(nodes: Set<Node>) {
  useDebugValue(nodes, (set) =>
    // Only runs when somebody opens this hook in DevTools.
    [...set].map((n) => n.nodeName).join(", "));

  return nodes;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Only in hooks people share",
          body: "React's own documentation says to reserve it for hooks that are part of a shared library. A single-use hook is one file away and adding a label to it is noise for a reader who could just open the file. The threshold: a hook used across several features, or one whose state is not obvious from its return value.",
        },
        {
          title: "It is not a logger",
          body: "It runs on every render, so a `console.log`-style side effect inside the formatter breaks render purity, and the value is only ever visible in DevTools. For tracing, use a `console.log` in an effect — which runs after the commit and cannot affect the render.",
        },
      ],
    },
    {
      id: "other-devtools",
      heading: "The rest of the hooks story in DevTools",
      body: [
        "**Hook values are editable.** Click a `State` row's value and change it. This is the fastest way to see an error or empty state without arranging for a request to fail.",
        "**\"Rendered by\"** at the bottom of the panel is the component's owner chain — which component actually created this element. That is a different question from where it sits in the tree, and it is the one you want when a prop has an unexpected value.",
        "**Component filters** hide host elements and named components you do not care about, which is what makes a deep tree navigable at all.",
        "**The Profiler tab**, from module 9, will tell you which hook index changed to cause a render — count the hooks in the source to identify it, and note that a custom hook may account for several indices.",
        "**`console.log` still works, and belongs in an effect.** A log in a component body runs twice under Strict Mode and again on every discarded render. In an effect it runs after the commit, once per real update, which is what you meant.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is useDebugValue for?",
      answer:
        "Labelling a custom hook in React DevTools. By default a custom hook shows as a named group of unnamed internal hooks — `State`, `State`, `Effect` — which is unreadable once there are more than two or three. `useDebugValue` puts a summary next to the hook's name. It does nothing at runtime and is stripped from production builds.",
    },
    {
      question: "Why does useDebugValue take a second argument?",
      answer:
        "It is a formatter, called only when the hook is actually being inspected in DevTools. Passing an already-formatted string does the work on every render of every component using the hook, whether or not anybody is looking; passing the raw value plus a formatter defers it to the moment somebody opens that hook. It is the argument almost nobody uses, and it is the one that makes the hook free.",
    },
    {
      question: "Which hooks should have one?",
      answer:
        "Ones that are shared — used across several features, or published — and ones whose internal state is not obvious from what they return. React's own guidance is to reserve it for shared library hooks. For a hook used in one place, the label is noise for a reader who could open the file instead.",
    },
  ],
  takeaways: [
    "DevTools lists a custom hook's internal hooks in call order, unnamed",
    "`useDebugValue` puts a readable summary next to the hook's name",
    "It is development-only and stripped from production",
    "The formatter argument defers the work to when somebody actually looks",
    "Reserve it for shared hooks, or ones whose state is not obvious from the return value",
    "Hook values are editable in the panel — the fastest way to see an error state",
    "\"Rendered by\" answers who created this element, which is not where it sits in the tree",
    "For tracing, `console.log` in an effect, not in the body",
  ],
  status: "available",
};
