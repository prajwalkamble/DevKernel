import type { Lesson } from "@/content/types";

export const readOnlyPropsLesson: Lesson = {
  id: "react-read-only-props",
  slug: "props-are-read-only",
  moduleSlug: "components-and-props",
  title: "Props Are Read-Only, and What That Buys",
  summary:
    "React freezes props in development, which is a symptom rather than the rule. The rule is one-way data flow — and the reason it is worth the extra plumbing is that it turns \"where did this value come from?\" into a question with one answer.",
  estimatedMinutes: 25,
  objectives: [
    "Demonstrate that props are frozen, and say in which builds",
    "Explain what breaks when a component mutates what it was given",
    "Describe one-way data flow, and where the events actually go",
    "Say why nothing travels up the tree, despite the phrase",
    "Choose where a piece of state has to live",
  ],
  sections: [
    {
      id: "frozen",
      heading: "Frozen, and only in development",
      body: [
        "React calls `Object.freeze` on every element's props in development builds. An attempt to write to one fails — silently in sloppy mode, with a `TypeError` in strict mode, which is what module code always is.",
        "In production that freeze is skipped, for the obvious reason that freezing every props object on every render costs something and the check has already served its purpose. So the guard rail exists precisely where you are looking, and is gone where you are not.",
        "That asymmetry is the argument for taking it seriously rather than treating it as a lint rule: a mutation that throws on your machine corrupts state quietly on a user's.",
      ],
      examples: [
        {
          id: "props-frozen",
          title: "The freeze, demonstrated",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Probe(props) {
  console.log("props frozen?", Object.isFrozen(props));
  try {
    Object.defineProperty(props, "label", { value: "changed" });
    console.log("redefining succeeded");
  } catch (error) {
    console.log("redefining ->", error.message);
  }
  return <span>{props.label}</span>;
}

console.log("rendered:", render(<Probe label="original" />));

// The element itself is frozen too, and so is its props object.
const el = <p id="x" />;
console.log("element frozen?", Object.isFrozen(el), "| props frozen?", Object.isFrozen(el.props));`,
          output: `props frozen? true
redefining -> Cannot redefine property: label
rendered: <span>original</span>
element frozen? true | props frozen? true`,
          explanation:
            "The value never changed, and the component rendered what it was given. Note that this is a development build — the same code in production would not be frozen, the write would succeed, and the component would render `changed` while its parent still believed the label was `original`.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Probe(props: { label: string }) {
  console.log("props frozen?", Object.isFrozen(props));
  try {
    Object.defineProperty(props, "label", { value: "changed" });
    console.log("redefining succeeded");
  } catch (error) {
    // \`catch\` binds \`unknown\` under strict, so reaching for \`.message\` needs
    // the cast. The frozen-ness itself is a runtime fact — the type system
    // arrives at "do not write to props" from a different direction.
    console.log("redefining ->", (error as Error).message);
  }
  return <span>{props.label}</span>;
}

console.log("rendered:", render(<Probe label="original" />));

// The element itself is frozen too, and so is its props object.
const el = <p id="x" />;
console.log("element frozen?", Object.isFrozen(el), "| props frozen?", Object.isFrozen(el.props));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The freeze is shallow, so the dangerous case is not caught at all",
          body: "`Object.freeze` protects the props object, not the objects inside it. `props.user.name = \"x\"` and `props.items.push(…)` both succeed, in development and production alike, and both mutate data the parent still owns. This is the mutation that actually happens in real code, and nothing warns about it — `props.items.sort()` in a render body is the classic, because `sort` mutates in place. Copy first: `[...props.items].sort()` or `props.items.toSorted()`.",
        },
      ],
    },
    {
      id: "why",
      heading: "Why one-way data flow is worth the plumbing",
      body: [
        "Passing a callback down three levels so a button can change something is more code than letting the button reach up and set it. The trade is deliberate.",
        "**A value has one owner.** When the number on screen is wrong, it is wrong in exactly one place, and every component displaying it is displaying what it was handed. Debugging becomes a walk up the tree rather than a search of everything that might have written to it.",
        "**Renders stay predictable.** React re-renders a component when its own state changes or when it is given new props. If a child could write to a parent's data directly, React would have no way of knowing something changed — the screen and the data would drift apart, which is the exact failure mode the framework exists to remove.",
        "**Components stay honest about their inputs.** A component that only reads props is a function of its arguments, which is what makes it testable, memoisable and movable.",
      ],
    },
    {
      id: "events-up",
      heading: "\"Data down, events up\" — and what actually happens",
      body: [
        "The phrase describes the shape correctly and the mechanism misleadingly. Nothing travels up the tree.",
        "When a parent passes `onIncrement={handleIncrement}` to a child, it is passing **its own function**. The child calling it does not send a message anywhere — it invokes a closure that was defined in the parent and still belongs to it. The parent's code runs, the parent's `setState` is called, and the parent re-renders.",
        "This matters because it tells you where to look. A child \"changing\" something is really the owner changing it on the child's request, so the logic to read is always in the owner, never in the caller.",
        "It also explains the naming convention. The prop is named for the event that happened (`onSelect`, `onDismiss`), not for what the parent will do about it (`setSelectedId`, `closeDialog`) — the child reports; the owner decides.",
      ],
      examples: [
        {
          id: "callback-ownership",
          title: "The function the child calls belongs to the parent",
          lang: "jsx",
          code: `function Row({ person, onSelect }) {
  // Row has no idea what selecting means. It reports; it does not decide.
  return (
    <li>
      <button type="button" onClick={() => onSelect(person.id)}>
        {person.name}
      </button>
    </li>
  );
}

function List({ people, selectedId, onSelect }) {
  return (
    <ul>
      {people.map((person) => (
        <Row
          key={person.id}
          person={person}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

const people = [
  { id: "a", name: "Ada" },
  { id: "g", name: "Grace" },
];

function App() {
  // In a real component this would be useState; the ownership is the point.
  const selectedId = "a";
  const handleSelect = (id) => console.log("App decides what to do with", id);

  return <List people={people} selectedId={selectedId} onSelect={handleSelect} />;
}`,
          output: `<ul><li><button type="button">Ada</button></li><li><button type="button">Grace</button></li></ul>`,
          explanation:
            "`onSelect` passed through `List` untouched — a component forwarding a callback it does not use is extremely common, and is the plumbing that context exists to remove when the tree gets deep. `Row` names the prop for the event, so it can be dropped into any parent with any meaning of \"select\".",
          alternates: [
            {
              lang: "tsx",
              code: `type Person = { id: string; name: string };

function Row({ person, onSelect }: { person: Person; onSelect: (id: string) => void }) {
  // Row has no idea what selecting means. It reports; it does not decide —
  // and the callback's signature is where that contract is written down.
  return (
    <li>
      <button type="button" onClick={() => onSelect(person.id)}>
        {person.name}
      </button>
    </li>
  );
}

function List({ people, selectedId, onSelect }: {
  people: Person[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul>
      {people.map((person) => (
        <Row
          key={person.id}
          person={person}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

const people: Person[] = [
  { id: "a", name: "Ada" },
  { id: "g", name: "Grace" },
];

function App() {
  // In a real component this would be useState; the ownership is the point.
  const selectedId = "a";
  const handleSelect = (id: string) => console.log("App decides what to do with", id);

  return <List people={people} selectedId={selectedId} onSelect={handleSelect} />;
}`,
            },
          ],
        },
      ],
    },
    {
      id: "where-state-lives",
      heading: "Where a piece of state has to live",
      body: [
        "One-way flow forces a single question: what is the lowest component that can see everything which needs this value?",
        "**Only one component uses it:** keep it there. Local state is the cheapest and the easiest to reason about, and moving it up before you have to makes everything below re-render for no reason.",
        "**Two siblings use it:** it cannot live in either, because a sibling cannot see a sibling's state. It moves to their nearest common parent, and both receive it as a prop. That is lifting state up, and lesson 5 does it properly.",
        "**Half the app uses it:** the common parent is the root, and threading it through every level is the prop drilling that context solves — with the caveat, covered in module 8, that context is not a state manager.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Are props actually immutable, or is that just a convention?",
      answer:
        "React freezes each element's props object with `Object.freeze` in development builds, so a write throws in strict mode; in production the freeze is skipped for cost. The freeze is also shallow — `props.items.push(…)` and `props.user.name = \"x\"` succeed in every build, and those are the mutations that actually occur. So it is enforced enough to catch the obvious case while you are looking, and a convention everywhere else.",
    },
    {
      question: "What does one-way data flow actually buy you?",
      answer:
        "A single owner for every value, so a wrong number on screen is wrong in exactly one place and debugging is a walk up the tree. It also keeps React's model coherent: React re-renders on state changes and new props, so a child writing to a parent's data directly would change the data without changing the screen. And it keeps components functions of their inputs, which is what makes them testable and memoisable.",
    },
    {
      question: "When a child calls a callback prop, what travels up the tree?",
      answer:
        "Nothing. The function was defined in the parent and passed down as an ordinary value; calling it invokes a closure that still belongs to the parent, so the parent's code runs and the parent's state updates. \"Events up\" describes the shape of the data flow, not a message-passing mechanism — which is why the logic to read when a child appears to change something is always in the owner.",
    },
  ],
  takeaways: [
    "React freezes props in development and not in production, so a mutation that throws on your machine can corrupt state on a user's",
    "The freeze is shallow — `props.items.sort()` and `props.user.name = …` are never caught, and are the mutations that really happen",
    "One-way flow gives every value one owner, which is what makes a wrong value findable",
    "A child calling a callback sends nothing upward; it invokes the parent's own function, so the parent's code runs",
    "Name callback props for the event that happened, not for what the parent will do about it",
    "State lives in the lowest component that can see everyone who needs it — no lower, and no higher",
  ],
  status: "available",
};
