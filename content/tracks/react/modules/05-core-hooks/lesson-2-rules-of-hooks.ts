import type { Lesson } from "@/content/types";

export const rulesOfHooksLesson: Lesson = {
  id: "react-rules-of-hooks",
  slug: "rules-of-hooks",
  moduleSlug: "core-hooks",
  title: "The Rules of Hooks, and the List Underneath Them",
  summary:
    "Two rules that look arbitrary until you know how React stores hook state: an ordered list per component instance, matched by call order and nothing else. Every rule, and every bug from breaking one, follows from that.",
  estimatedMinutes: 30,
  objectives: [
    "State both rules and the mechanism each protects",
    "Explain how React matches a hook call to its stored value",
    "Predict what happens when a hook is called conditionally",
    "Recognise the three places a hook may legally be called",
    "Say why the lint rule catches this and TypeScript cannot",
  ],
  sections: [
    {
      id: "the-rules",
      heading: "The two rules",
      body: [
        "**Only call hooks at the top level.** Not inside a condition, a loop, a nested function, or after an early return. The set of hooks a component calls must be identical on every render.",
        "**Only call hooks from React functions.** A component, or another hook. Not a plain function, not a class method, not an event handler.",
        "Both are enforced by the `eslint-plugin-react-hooks` rules, which are on by default in every React template — including this project's config. The rest of this lesson is why they exist, because a rule you understand is one you stop wanting to work around.",
      ],
    },
    {
      id: "the-list",
      heading: "The list underneath",
      body: [
        "Module 4 established that state belongs to a component *instance*. What it stores is a **list**, and hook calls are matched to entries in it **by order of execution**.",
        "There is no key, no name, no identity. `const [count, setCount] = useState(0)` is array destructuring — React never learns that you called it `count`. It knows only that this was the first `useState` call of this render, so it hands back the first entry.",
        "On the next render React walks the same list from the start, in the same order, handing back entry one to the first call, entry two to the second. That is the entire mechanism, and it is why the order must never change.",
      ],
      examples: [
        {
          id: "order-matters",
          title: "The list, and what a condition does to it",
          lang: "tsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

// A model of what React stores: one list per instance, read in call order.
const slots = [];
let cursor = 0;

function useSlot(initial) {
  const i = cursor++;
  if (slots.length === i) slots.push(initial);   // first render of this slot
  return slots[i];
}

function renderComponent(includeMiddle) {
  cursor = 0;
  const name = useSlot("Ada");
  const middle = includeMiddle ? useSlot("Grace") : undefined;
  const age = useSlot(36);
  return { name, middle, age };
}

console.log("first render, all three:  ", JSON.stringify(renderComponent(true)));
console.log("second render, same:      ", JSON.stringify(renderComponent(true)));
console.log("third render, middle gone:", JSON.stringify(renderComponent(false)));`,
          output: `first render, all three:   {"name":"Ada","middle":"Grace","age":36}
second render, same:       {"name":"Ada","middle":"Grace","age":36}
third render, middle gone: {"name":"Ada","age":"Grace"}`,
          explanation:
            "Read the third line. `age` is `\"Grace\"`. Skipping one call shifted every later call up by one slot, so the third hook read the second hook's value. Nothing threw — the model has no way to know a call is missing, and neither does React. That is exactly the failure the rule prevents, and it is why it is a rule rather than a suggestion.",
        },
      ],
      visual: {
        id: "hook-slots-visual",
        kind: "react-rendering",
        algorithm: "hook-slots",
        title: "Hook calls matched to slots, and what a condition does",
      },
    },
    {
      id: "what-react-does",
      heading: "What React does when it notices",
      body: [
        "React cannot detect a *shifted* list, because a shift is indistinguishable from you having written different hooks. It can detect a **length change**, and it throws: `Rendered fewer hooks than expected` or `Rendered more hooks than expected`.",
        "That error is the lucky case. It means the conditional hook was the last one, so the count changed and React noticed. When the conditional hook has other hooks after it, the count stays the same on some renders and you get silently wrong values instead — a `useState` returning another `useState`'s value, or an effect firing with somebody else's dependencies.",
        "So the error message is a gift rather than a nuisance, and its absence proves nothing.",
      ],
      pitfalls: [
        {
          title: "An early return is a condition",
          body: "`if (!user) return null;` before a `useEffect` means that on renders where `user` is missing, the effect is not called. React sees fewer hooks and throws. Put every hook above every early return — the guard clause goes *after* the hooks, which reads oddly the first few times and is correct.",
        },
      ],
    },
    {
      id: "where-legal",
      heading: "The three places a hook may be called",
      body: [
        "**At the top level of a component function.** The usual case.",
        "**At the top level of a custom hook.** A function whose name starts with `use`, which is how the lint rule knows it is allowed to contain hooks. The naming convention is load-bearing tooling, not style.",
        "**In React 19, inside `use()`** — which is genuinely different and covered in module 11. `use` may be called conditionally, because it is not a hook in the storage sense: it does not claim a slot.",
        "Everywhere else is a mistake the lint rule will catch: event handlers, `setTimeout` callbacks, `useMemo` bodies, `.map()` callbacks, class methods, plain helper functions.",
      ],
      examples: [
        {
          id: "hooks-in-a-loop",
          title: "The shape that looks reasonable and is not",
          lang: "tsx",
          code: `// Wrong: the number of hooks depends on the data.
//
//   function Fields({ names }) {
//     const values = names.map((n) => useState(""));   // hooks in a loop
//     …
//   }
//
// When \`names\` grows or shrinks, the list length changes and React throws.

// Right: one hook holding a collection.
function Fields({ names }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(names.map((n) => [n, ""]))
  );

  return (
    <>
      {names.map((name) => (
        <input
          key={name}
          value={values[name] ?? ""}
          onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
        />
      ))}
    </>
  );
}`,
          explanation:
            "The fix for \"I need a hook per item\" is almost always one hook holding a structure keyed by item. The other fix, when each item genuinely needs its own state and effects, is to extract a component — because a component *instance* is the thing React gives an independent hook list to.",
        },
      ],
    },
    {
      id: "why-lint",
      heading: "Why a lint rule, and not the type system",
      body: [
        "TypeScript cannot help here. The rule is about **which calls execute at run time**, and a type system reasons about values rather than about control flow reaching a call. A conditional `useState` is perfectly well typed.",
        "So it is a lint rule, and it is one of the very few worth treating as non-negotiable. `eslint-disable-next-line react-hooks/rules-of-hooks` is almost never correct — unlike the exhaustive-dependencies rule, which is a heuristic with real false positives, this one is checking an invariant the runtime genuinely requires.",
        "The React Compiler, which module 9 covers, will refuse to optimise a component that breaks the rules. That is a second reason to keep them: a component the compiler bails out of loses the memoisation it would otherwise have got for free.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can't hooks be called conditionally?",
      answer:
        "Because React stores hook state as an ordered list per component instance and matches calls to entries purely by call order — there is no name or key involved. Skipping a call on one render shifts every later hook up a slot, so a `useState` starts returning a different piece of state. React can only detect the case where the total count changes, and then it throws; when the conditional hook has others after it the count can stay the same and you get silently wrong values instead.",
    },
    {
      question: "What is actually wrong with calling a hook after an early return?",
      answer:
        "An early return is a condition. On renders that take it, the hooks below never execute, so the list is shorter than React expects and it throws `Rendered fewer hooks than expected`. Every hook has to sit above every early return, which means a guard clause comes after the hooks rather than at the very top of the function.",
    },
    {
      question: "Why is this a lint rule rather than something TypeScript catches?",
      answer:
        "Because it constrains which calls execute at run time, and a type system reasons about the types of values rather than about control flow reaching a call — a conditional `useState` is perfectly well typed. It is also one of the few lint rules worth treating as non-negotiable, since it checks an invariant the runtime genuinely depends on, and the React Compiler refuses to optimise components that break it.",
    },
  ],
  takeaways: [
    "React stores hook state as an ordered list per instance, matched by call order and nothing else",
    "Skipping a call shifts every later hook up a slot, so one hook returns another's value",
    "React can only detect a change in the *number* of hooks; a shift with a matching count is silent",
    "An early return is a condition — every hook goes above every early return",
    "\"A hook per item\" means one hook holding a collection, or a component per item",
    "The `use` prefix is what tells the tooling a function may contain hooks",
  ],
  status: "available",
};
