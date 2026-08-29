import type { Lesson } from "@/content/types";

export const whyHooksExistLesson: Lesson = {
  id: "react-why-hooks-exist",
  slug: "why-hooks-exist",
  moduleSlug: "core-hooks",
  title: "Why Hooks Exist, and What They Replaced",
  summary:
    "Hooks were not a nicer syntax for classes. They exist because the class API tied stateful logic to the component that used it, and every attempt to share that logic without a hook made the component tree worse.",
  estimatedMinutes: 25,
  objectives: [
    "Say what problem hooks were introduced to solve",
    "Describe what a class component's lifecycle methods got wrong",
    "Explain why higher-order components and render props were not enough",
    "Recognise the three complaints hooks answer",
    "Read a class component well enough to work in an older codebase",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem was sharing behaviour, not verbosity",
      body: [
        "The usual story is that hooks replaced classes because classes were verbose. That is a side benefit and not the reason.",
        "The reason is that **stateful logic had nowhere to live except a component**. If two components both needed to track window size, subscribe to a store, or debounce a value, the only ways to share that were to wrap one component in another or to pass a function as a child — both of which put an extra component in the tree for something that was never about the tree.",
        "A custom hook is a function that calls other hooks. It shares behaviour without rendering anything, so the tree stays the shape the UI actually is. Module 10 writes them; this lesson is about why they were needed.",
      ],
    },
    {
      id: "lifecycle",
      heading: "What the lifecycle methods got wrong",
      body: [
        "A class component grouped code by **when it ran**, not by **what it was about**. A single subscription would be split across three methods: set up in `componentDidMount`, torn down and re-established in `componentDidUpdate`, and torn down again in `componentWillUnmount`.",
        "That grouping had two consequences. Related code was scattered, so a change had to be made in three places and one of them was regularly forgotten — usually the update case, which is why so many class components leaked subscriptions when their props changed. And unrelated code was crammed together, so `componentDidMount` became a list of five things that had nothing to do with each other.",
        "`useEffect` inverts it: one effect per concern, with its own setup and its own cleanup side by side. The three lifecycle methods collapse into one function whose dependency array says when it should re-run.",
      ],
      examples: [
        {
          id: "lifecycle-to-effect",
          title: "The same subscription, both ways",
          lang: "jsx",
          code: `// The class version: one concern, three methods, two chances to forget.
//
//   class Room extends React.Component {
//     componentDidMount() {
//       this.conn = connect(this.props.roomId);
//     }
//     componentDidUpdate(prev) {
//       if (prev.roomId !== this.props.roomId) {   // forgotten constantly
//         this.conn.close();
//         this.conn = connect(this.props.roomId);
//       }
//     }
//     componentWillUnmount() {
//       this.conn.close();
//     }
//   }

// The hook version: one concern, one place, and the re-run is declared.
function Room({ roomId }) {
  useEffect(() => {
    const connection = connect(roomId);
    return () => connection.close();
  }, [roomId]);

  return <h1>Room {roomId}</h1>;
}`,
          explanation:
            "Setup and cleanup are adjacent, so it is hard to write one without the other. And `[roomId]` states the re-run condition as data rather than as an `if` in a second method — which is the whole of what `componentDidUpdate` was doing by hand, correctly, once you remembered to.",
        },
      ],
      pitfalls: [
        {
          title: "`useEffect` is not `componentDidMount`",
          body: "The habit of reading `useEffect(fn, [])` as \"on mount\" survives, and it is what produces effects with dependencies deliberately left out so they will not re-run. An effect describes a *synchronisation*: this is what should be true while these values hold. When a value it uses changes, re-running is correct behaviour, not a nuisance. Module 7 makes this argument at length.",
        },
      ],
    },
    {
      id: "what-came-before",
      heading: "Higher-order components and render props",
      body: [
        "Before hooks, the two ways to share stateful logic both worked by adding components.",
        "**A higher-order component** wrapped yours and injected props. Module 3 covered the costs: the injected props are invisible at the call site, several of them nest into a tower of anonymous wrappers, and every prop and ref has to be forwarded by hand.",
        "**A render prop** passed a function as `children` and called it with the data. It kept the values visible at the call site, which was better, but nesting three of them produced the pyramid that the pattern is remembered for.",
        "Neither was wrong. Both were the best available answer to a question the library could not otherwise answer, and both put components in the tree that existed only to carry logic.",
      ],
    },
    {
      id: "three-complaints",
      heading: "The three complaints hooks answer",
      body: [
        "**Hard to reuse stateful logic.** Solved by custom hooks: a function calling hooks, sharing behaviour with nothing added to the tree.",
        "**Complex components become hard to understand.** Solved by grouping code by concern rather than by lifecycle timing, so a component can be read one effect at a time.",
        "**Classes confuse people and machines.** `this` had to be bound; a mistyped binding produced a runtime error rather than a compile error. And class components minified poorly and were resistant to the compiler optimisations React wanted to make — which is the part that mattered most to the team, and the reason function components are where all the new work goes.",
        "That last point is worth taking seriously in 2026: Server Components, the `use` hook and the React Compiler are function-component features. Classes still work and are not deprecated, but they receive nothing new.",
      ],
    },
    {
      id: "reading-classes",
      heading: "Enough class syntax to work in an old file",
      body: [
        "You will meet these. The mapping is small enough to memorise.",
        "`this.state` and `this.setState` become `useState` — with one real difference: `setState` **merged** the object you passed into the existing state, while a `useState` setter replaces it. Porting a class often means adding a spread that was previously implicit.",
        "`componentDidMount` plus `componentDidUpdate` plus `componentWillUnmount` become one `useEffect` with a dependency array and a cleanup return.",
        "`this.props` becomes the function's parameter. `createRef` becomes `useRef`. `shouldComponentUpdate` becomes `React.memo`.",
        "The one thing with no hook equivalent is **error boundaries**, which still require a class with `componentDidCatch` or `getDerivedStateFromError`. Every React app that catches render errors has at least one class in it, usually copied from the documentation and never touched again.",
      ],
      pitfalls: [
        {
          title: "`setState` merged; the `useState` setter replaces",
          body: "`this.setState({ name })` left every other field of state alone. `setForm({ name })` throws the rest away. Porting a class component by mechanically renaming the calls produces state objects that silently lose fields — and because the fields are lost rather than wrong, the symptom is usually an `undefined` somewhere far away. Write `setForm(prev => ({ ...prev, name }))`, or split the state into separate `useState` calls, which module 4 argued is usually better anyway.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why were hooks introduced?",
      answer:
        "To make stateful logic reusable without changing the component tree. Before hooks the only ways to share it were higher-order components and render props, both of which wrap a component in another component — so sharing three behaviours meant three extra levels of tree that had nothing to do with the UI. A custom hook is a plain function calling other hooks, so it shares the behaviour and renders nothing. Reducing verbosity was a side effect, not the goal.",
    },
    {
      question: "What was wrong with lifecycle methods?",
      answer:
        "They grouped code by when it ran rather than by what it was about. One subscription was split across `componentDidMount`, `componentDidUpdate` and `componentWillUnmount`, so related code was scattered — the update branch being the one people forgot, which is why class components leaked subscriptions when props changed — while unrelated concerns were crammed into the same method. An effect keeps one concern's setup and cleanup together and declares its re-run condition as a dependency array.",
    },
    {
      question: "Is there anything you still need a class component for?",
      answer:
        "Error boundaries. Catching an error thrown during rendering still requires `componentDidCatch` or `getDerivedStateFromError`, and neither has a hook equivalent, so most codebases contain exactly one class copied from the docs. Everything else has a hook, and all new React features — Server Components, the `use` hook, the compiler — target function components only.",
    },
  ],
  takeaways: [
    "Hooks exist to make stateful logic reusable without adding components to the tree",
    "Lifecycle methods grouped code by when it ran; effects group it by what it is about",
    "The forgotten `componentDidUpdate` branch is why class components leaked subscriptions on prop changes",
    "Higher-order components and render props both worked, and both paid for it in tree depth",
    "`this.setState` merged, the `useState` setter replaces — the classic porting bug",
    "Error boundaries are the one thing still requiring a class",
  ],
  status: "available",
};
