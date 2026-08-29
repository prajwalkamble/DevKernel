import type { Lesson } from "@/content/types";

export const whatIsReactLesson: Lesson = {
  id: "react-what-is-react",
  slug: "what-is-react",
  moduleSlug: "foundations",
  title: "What React Is, and the Problem It Solves",
  summary:
    "Before any code: what React actually is, the specific problem with hand-written DOM manipulation that it exists to remove, what 'declarative' means in practice, and where React sits against the alternatives.",
  estimatedMinutes: 25,
  objectives: [
    "Say what React is in one sentence, accurately",
    "Explain the problem with imperative DOM code that React removes",
    "Describe what declarative UI means, concretely rather than as a slogan",
    "Explain what a component is and why the whole library is built from them",
    "Know where React runs, and what React itself does not include",
  ],
  sections: [
    {
      id: "one-sentence",
      heading: "React in one sentence",
      body: [
        "**React is a JavaScript library for building user interfaces out of components, where you describe what the UI should look like for a given state and React works out how to update the DOM to match.**",
        "Two halves of that sentence do the work. **Components** are the unit: a function that takes some data and returns a description of some UI. **Describe rather than update** is the model: you never write \"find this element and change its text\", you write \"for this data, the UI looks like this\", and React handles the difference.",
        "It is worth being precise about one word: React is a **library**, not a framework. It renders UI and manages component state. It does not give you routing, data fetching, form handling, or a build system — those are separate choices, which is both its greatest strength and the reason a new React project involves more decisions than a new Angular one.",
      ],
    },
    {
      id: "the-problem",
      heading: "The problem: keeping the DOM in sync with your data",
      body: [
        "Every UI is the same job underneath: you have some data, the screen shows that data, and when the data changes the screen must change too. Doing that by hand is where the difficulty lives.",
        "Consider a counter with a number, a button and a message that only appears above ten. In plain DOM code you write the *transitions*: when this happens, change that. Each new piece of state multiplies the number of transitions you have to keep straight, and the bug is always the same — one of the paths forgot to update one of the elements.",
      ],
      examples: [
        {
          id: "imperative-dom",
          title: "The imperative version: you describe every change",
          lang: "javascript",
          code: `const button = document.querySelector("#increment");
const output = document.querySelector("#count");
const warning = document.querySelector("#warning");

let count = 0;

button.addEventListener("click", () => {
  count += 1;

  // Every consequence of the change has to be spelled out, here,
  // at every place the change can happen.
  output.textContent = String(count);
  warning.hidden = count <= 10;
  button.disabled = count >= 20;
});

// ...and now add a reset button, and remember to repeat all three
// updates there too. And a "load saved count" path. And an undo.`,
          explanation:
            "Nothing here is wrong, and for a counter it is perfectly readable. The problem is growth: every *source* of change has to know about every *consequence* of change. With four pieces of state and six places that can modify them, you are maintaining twenty-four relationships by hand, and the compiler cannot help you.",
        },
        {
          id: "declarative-react",
          title: "The declarative version: you describe the result",
          lang: "jsx",
          code: `function Counter() {
  const [count, setCount] = useState(0);

  // One description of what the UI is, for any value of \`count\`.
  // There is no code that says "when the count changes, update the warning".
  return (
    <div>
      <p id="count">{count}</p>
      {count > 10 && <p id="warning">That is quite a lot of clicks.</p>}
      <button onClick={() => setCount(count + 1)} disabled={count >= 20}>
        Increment
      </button>
    </div>
  );
}`,
          explanation:
            "Add a reset button and it calls `setCount(0)`; the warning and the disabled state follow automatically, because they were never separately maintained — they are *expressions of the state*. This is the whole idea. Everything else in React is machinery to make it fast.",
        },
      ],
      pitfalls: [
        {
          title: "Declarative does not mean magic",
          body: "React is not watching your variables. `setCount` explicitly tells React \"this state changed, run the component function again and see what it returns now\". The declarative part is that you never say *how* the DOM should change — but you do still say *when* the state has changed. Forgetting that is the source of the most common beginner bug: mutating a value and wondering why nothing re-rendered.",
        },
      ],
    },
    {
      id: "components",
      heading: "Components: the unit everything is made of",
      body: [
        "A React component is a JavaScript function that returns a description of UI. That is the entire definition.",
        "This matters more than it sounds. Because components are functions, everything you already know about functions applies: they compose, you can pass them arguments, you can extract one out of another, you can put them in an array and map over it, you can test them in isolation. React did not invent a template language with its own rules for loops and conditions — it uses JavaScript's, because a component *is* JavaScript.",
        "The second consequence is that a component owns both its markup and its behaviour. The traditional separation was by *technology* — HTML in one file, CSS in another, JS in a third. React separates by *concern*: everything a search box needs lives in the search box. When you delete the search box, you delete all of it.",
      ],
      examples: [
        {
          id: "components-are-functions",
          title: "Components compose the way functions compose",
          lang: "jsx",
          code: `function Badge({ label }) {
  return <span className="badge">{label}</span>;
}

function Greeting({ name, children }) {
  return (
    <section>
      <h2>Hello, {name}!</h2>
      {children}
    </section>
  );
}

// Composed the same way you would compose any function call.
function App() {
  return (
    <div>
      <h1 className="title">Hello, world!</h1>
      <Greeting name="Ada">
        <p>Nested children render here.</p>
        <Badge label="new" />
      </Greeting>
    </div>
  );
}`,
          output: `<div><h1 class="title">Hello, world!</h1><section><h2>Hello, Ada!</h2><p>Nested children render here.</p><span class="badge">new</span></section></div>`,
          explanation:
            "That output is the real HTML React produces for this tree. Note `className` became `class` — JSX uses the DOM property names, which the next lesson but one covers. `Badge` and `Greeting` are ordinary functions; the only thing that makes them components is that React calls them and they return elements.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

function Greeting({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section>
      <h2>Hello, {name}!</h2>
      {children}
    </section>
  );
}

// Composed the same way you would compose any function call.
function App() {
  return (
    <div>
      <h1 className="title">Hello, world!</h1>
      <Greeting name="Ada">
        <p>Nested children render here.</p>
        <Badge label="new" />
      </Greeting>
    </div>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "where-react-runs",
      heading: "Where React runs, and what it is not",
      body: [
        "**React itself is renderer-agnostic.** The `react` package contains components, state and hooks; it knows nothing about the DOM. A second package does the actual output: `react-dom` for the browser, `react-native` for native mobile, `react-dom/server` for producing HTML on a server. This is why you install two packages and why `import React from 'react'` and `import { createRoot } from 'react-dom/client'` are different imports.",
        "**React does not include:** a router, a data-fetching layer, a form library, a state manager beyond component state, a styling system, or a build tool. Each of those is a decision you make. Frameworks built *on* React — Next.js chief among them — exist largely to make those decisions for you, which is why the Next.js track in this curriculum comes straight after this one.",
        "**Versions matter here.** This track teaches **React 19**, which changed several things people still have wrong from older tutorials: `ref` is now an ordinary prop, `forwardRef` is no longer needed for it, the `use` hook can read a promise during render, and Server Components are part of the picture. Where a lesson describes something that changed, it says so.",
      ],
      pitfalls: [
        {
          title: "Most React tutorials you will find are out of date",
          body: "React has been through three major shifts: class components to function components (2019), the concurrent rendering model (2022), and Server Components (2023 onwards). A tutorial that opens with `class App extends React.Component`, or that reaches for `componentDidMount`, is describing a React that nobody starts new work in. You will still meet class components in existing codebases, and this track covers reading them — but you will not write one.",
        },
      ],
    },
    {
      id: "alternatives",
      heading: "React against the alternatives, honestly",
      body: [
        "**Angular** is a framework rather than a library: routing, HTTP, forms, dependency injection and testing all ship in the box, with one official way to do each. That is a real advantage on a large team and a real cost on a small project. It is also the more opinionated of the two by a wide margin, and it uses TypeScript and decorators throughout.",
        "**Vue** occupies a middle position: a template syntax closer to HTML, a reactivity system that tracks dependencies automatically rather than re-running components, and official-but-separate router and store packages.",
        "**Svelte** and **Solid** compile away much of the runtime, producing smaller and faster output; they have smaller ecosystems and fewer jobs attached.",
        "The honest summary: React's technical advantages over the others are modest and arguable. Its practical advantages are not — the ecosystem, the hiring market, the volume of answered questions, and the fact that most component libraries target it first. For most teams that is the deciding factor, and it is a legitimate one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is React a library or a framework, and why does the distinction matter?",
      answer:
        "A library. It renders UI and manages component state, and deliberately leaves routing, data fetching, forms and build tooling to you. The distinction matters practically: starting a React project means making those choices yourself (or adopting a framework like Next.js that makes them), whereas Angular ships an official answer for each. It also explains why two React codebases can look nothing alike.",
    },
    {
      question: "What does it mean to say React is declarative?",
      answer:
        "You write a single description of what the UI should be for the current state, rather than a set of instructions for transitioning the DOM from one state to another. When state changes, React re-runs your component and updates the DOM to match the new description. The benefit is that consequences of a change do not have to be re-stated at every place the change can originate.",
    },
    {
      question: "Why is `react` a separate package from `react-dom`?",
      answer:
        "`react` is the renderer-agnostic core — components, state, hooks, and the element format. `react-dom` is one renderer that turns those elements into DOM nodes; `react-native` and `react-dom/server` are others. Keeping them separate is what allows the same component model to target the browser, native mobile, and server-rendered HTML.",
    },
  ],
  takeaways: [
    "React is a library for building UIs from components, where you describe the result for a given state instead of scripting DOM updates",
    "The problem it removes is that imperative UI code makes every source of change responsible for every consequence of change",
    "A component is just a function that returns a description of UI, so ordinary JavaScript composition applies",
    "React separates concerns by feature rather than by technology — markup and behaviour live together",
    "`react` is renderer-agnostic; `react-dom`, `react-native` and `react-dom/server` do the actual output",
    "React ships no router, data layer, form library or build tool — those are your choices, or a framework's",
    "This track teaches React 19; tutorials built around classes and lifecycle methods describe a React nobody starts new work in",
  ],
  status: "available",
};
