import type { Lesson } from "@/content/types";

export const splittingAPageLesson: Lesson = {
  id: "react-splitting-a-page",
  slug: "splitting-a-page",
  moduleSlug: "components-and-props",
  title: "Splitting a Page Into Components: A Worked Refactor",
  summary:
    "One long component taken apart properly — where the seams actually are, what each extraction buys, and the check that the whole thing still produces byte-for-byte identical markup at the end.",
  estimatedMinutes: 35,
  objectives: [
    "Find the real seams in a component rather than splitting by size",
    "Extract a component and give it an interface worth having",
    "Keep a refactor honest by holding the output constant",
    "Say when a component should not be extracted",
    "Recognise when the props list is telling you the split was wrong",
  ],
  sections: [
    {
      id: "starting-point",
      heading: "The starting point",
      body: [
        "Here is a component that works and is getting hard to read. It renders an invoice: a header, a table of line items, and a total.",
        "Nothing about it is wrong. It is one function doing three unrelated things, and the argument for splitting it is not that it is long — it is that the three things change for different reasons and cannot be reused or tested apart.",
      ],
      examples: [
        {
          id: "before",
          title: "Before: one component, three jobs",
          lang: "jsx",
          code: `const invoice = {
  number: "INV-0042",
  customer: "Ada Lovelace",
  lines: [
    { id: "a", description: "Analytical Engine consultancy", hours: 12, rate: 150 },
    { id: "b", description: "Punch card design", hours: 4, rate: 90 },
  ],
};

function App() {
  const total = invoice.lines.reduce((sum, l) => sum + l.hours * l.rate, 0);

  return (
    <article>
      <header>
        <h1>{invoice.number}</h1>
        <p>{invoice.customer}</p>
      </header>
      <table>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.description}</td>
              <td>{line.hours}</td>
              <td>{\`£\${line.rate}\`}</td>
              <td>{\`£\${line.hours * line.rate}\`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <strong>{\`£\${total}\`}</strong>
      </footer>
    </article>
  );
}`,
          output: `<article><header><h1>INV-0042</h1><p>Ada Lovelace</p></header><table><tbody><tr><td>Analytical Engine consultancy</td><td>12</td><td>£150</td><td>£1800</td></tr><tr><td>Punch card design</td><td>4</td><td>£90</td><td>£360</td></tr></tbody></table><footer><strong>£2160</strong></footer></article>`,
          explanation:
            "That output is the contract for the rest of this lesson. A refactor that changes it is not a refactor — so it is worth writing down before touching anything, which is exactly what a snapshot test does for you automatically.",
        },
      ],
    },
    {
      id: "finding-seams",
      heading: "Where the seams are",
      body: [
        "Split by **reason to change**, not by line count. Four questions find almost every real boundary:",
        "**Does it repeat?** The `<tr>` is rendered once per line and is the obvious candidate. Repetition is the strongest signal there is.",
        "**Does it have its own state or effects?** Nothing here does yet, but anything that would is a component whether or not it is long.",
        "**Would you reuse it elsewhere?** A money formatter appears three times in this component and would appear in every other invoice-shaped screen.",
        "**Can you name it?** If a block has an obvious name — `InvoiceHeader`, `LineRow`, `Total` — it is a thing. If naming it takes a paragraph, it is probably not a seam, and extracting it will produce a component with eight props.",
        "The `£` formatting deserves attention: it repeats three times and is not markup at all. That makes it a **function**, not a component — the distinction lesson 1 drew. It has no identity, no state, nothing React needs to know about.",
      ],
    },
    {
      id: "after",
      heading: "After",
      body: [
        "Three components and one helper. Each takes exactly what it needs, none reaches for anything global, and the top-level component now reads as a description of the page rather than an implementation of it.",
      ],
      examples: [
        {
          id: "after",
          title: "After: the same output, four pieces",
          lang: "jsx",
          code: `const invoice = {
  number: "INV-0042",
  customer: "Ada Lovelace",
  lines: [
    { id: "a", description: "Analytical Engine consultancy", hours: 12, rate: 150 },
    { id: "b", description: "Punch card design", hours: 4, rate: 90 },
  ],
};

// Not a component: no markup of its own, no identity, nothing React needs.
const money = (amount) => \`£\${amount}\`;

function InvoiceHeader({ number, customer }) {
  return (
    <header>
      <h1>{number}</h1>
      <p>{customer}</p>
    </header>
  );
}

// Takes the fields it displays, not the whole app's data.
function LineRow({ description, hours, rate }) {
  return (
    <tr>
      <td>{description}</td>
      <td>{hours}</td>
      <td>{money(rate)}</td>
      <td>{money(hours * rate)}</td>
    </tr>
  );
}

function InvoiceTotal({ amount }) {
  return (
    <footer>
      <strong>{money(amount)}</strong>
    </footer>
  );
}

function App() {
  const total = invoice.lines.reduce((sum, l) => sum + l.hours * l.rate, 0);

  return (
    <article>
      <InvoiceHeader number={invoice.number} customer={invoice.customer} />
      <table>
        <tbody>
          {invoice.lines.map((line) => (
            <LineRow key={line.id} {...line} />
          ))}
        </tbody>
      </table>
      <InvoiceTotal amount={total} />
    </article>
  );
}`,
          output: `<article><header><h1>INV-0042</h1><p>Ada Lovelace</p></header><table><tbody><tr><td>Analytical Engine consultancy</td><td>12</td><td>£150</td><td>£1800</td></tr><tr><td>Punch card design</td><td>4</td><td>£90</td><td>£360</td></tr></tbody></table><footer><strong>£2160</strong></footer></article>`,
          explanation:
            "Byte for byte, the same output as before — which is the only evidence that a refactor was a refactor. Three details are deliberate. The `key` stayed on `LineRow`, the element the `.map()` returns, and moved with the extraction. `{...line}` spreads the row's own fields, and works because `LineRow` names each one it uses. And `total` stayed in `App`, because `App` owns the lines and the total is derived from them — pushing it down would mean passing the lines twice.",
        },
      ],
      pitfalls: [
        {
          title: "`{...line}` is convenient until the data grows a field",
          body: "Spreading a data object into a component's props is fine while the component names every field it uses, as `LineRow` does. It stops being fine when the object gains fields the component does not know about and the component spreads its own props onto a DOM element — the new fields then land in the HTML. Spread data into components that destructure it; be explicit with components that forward.",
        },
      ],
    },
    {
      id: "when-not-to",
      heading: "When not to extract",
      body: [
        "**When the props list is longer than the markup.** A component taking eight props to render four elements has not reduced complexity, it has relocated it and added a boundary. This is the clearest signal that the split was along the wrong line.",
        "**When it is used once and never will be again.** A `<header>` with two lines inside it is not made clearer by living in another file. Extract when the parent is hard to read, not on principle.",
        "**When the extraction needs the parent's internals.** If the new component needs four callbacks and three pieces of state from its parent, they are one thing and the boundary is imaginary. Either find a different seam or leave it alone.",
        "**When it would only exist to be memoised.** That is a performance decision, and module 9 covers whether it is even the right one — it usually is not.",
      ],
    },
    {
      id: "afterwards",
      heading: "What the split bought",
      body: [
        "`LineRow` can now be rendered with any line-shaped object, which means it can be tested with a fixture rather than by rendering the whole invoice.",
        "Each piece has a name, so a stack trace and the DevTools tree now say `LineRow` instead of pointing at line 47 of `App`.",
        "The seams match the reasons to change: a designer altering the header does not open the file that computes the total.",
        "And `App` reads as the shape of the page. That is the real benefit, and it is why splitting by *meaning* beats splitting by length — a component that is short because a chunk was moved out arbitrarily is no easier to understand than the long one was.",
        "One thing this refactor deliberately did not decide: which *files* those three components live in. Splitting a component and placing the file are separate questions, and the next lesson answers the second one — including the point at which a flat `components/` folder stops working.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide where to split a large component?",
      answer:
        "By reason to change rather than by length. Four signals find most seams: it repeats, so a `.map()` body becomes a component; it has its own state or effects; it would be reused elsewhere; or it has an obvious name. Something that repeats but has no markup — a formatter — should be a plain function rather than a component, since it needs no identity in the tree.",
    },
    {
      question: "How do you know a refactor did not change anything?",
      answer:
        "By holding the rendered output constant. Capture the markup before the change and compare after — byte for byte identical output is the evidence that only the structure moved, which is what a snapshot test automates. Without that, a refactor and a rewrite look the same from the outside until something breaks.",
    },
    {
      question: "When is extracting a component the wrong move?",
      answer:
        "When the props list ends up longer than the markup, which means the split was along the wrong line and complexity was relocated rather than reduced. Also when the new component would need several pieces of the parent's state and callbacks to function — they are one thing, and the boundary is imaginary — or when it is used once and the parent was perfectly readable already.",
    },
  ],
  takeaways: [
    "Split by reason to change, not by line count",
    "The strongest signals are repetition, its own state, genuine reuse, and having an obvious name",
    "Something that repeats but produces no markup is a function, not a component",
    "The key stays on the element the `.map()` returns, and moves with the extraction",
    "Identical output before and after is the only evidence that a refactor was a refactor",
    "A props list longer than the markup means the seam was in the wrong place",
  ],
  status: "available",
};
