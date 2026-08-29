import type { Lesson } from "@/content/types";

export const expressionsInJsxLesson: Lesson = {
  id: "react-expressions-in-jsx",
  slug: "expressions-in-jsx",
  moduleSlug: "jsx-and-rendering",
  title: "Expressions, Conditionals & What Actually Renders",
  summary:
    "Exactly which values React draws and which it ignores, the four idioms for rendering something conditionally and when each is right, and the whitespace rules that decide whether a space appears between two tags.",
  estimatedMinutes: 30,
  objectives: [
    "State what React renders for every kind of value, from `null` to a nested array",
    "Explain why an object as a child throws while an array does not",
    "Choose between `&&`, a ternary, an early return and an extracted variable",
    "Predict when JSX keeps whitespace between elements and when it drops it",
    "Avoid the falsy traps that put a stray `0` or an empty string on the page",
  ],
  sections: [
    {
      id: "expression-not-statement",
      heading: "Braces take an expression",
      body: [
        "`{}` inside JSX means \"evaluate this and use the result as a child\". It must be an **expression** — something that produces a value. `if`, `for`, `switch` and variable declarations are statements, and none of them may appear there.",
        "This is not a restriction React invented. Look back at the emit from the first lesson: children are arguments to a function call, and you cannot pass an `if` as an argument in JavaScript either.",
        "Everything that follows in this lesson is a consequence. Conditional rendering uses `&&` and ternaries because those are the expression forms of a conditional. Loops use `.map()` because that is the expression form of a loop.",
      ],
    },
    {
      id: "what-renders",
      heading: "What React draws, and what it ignores",
      body: [
        "There is a short list of values React deliberately renders as nothing, and it is worth knowing exactly rather than approximately — the difference between `0` and `false` is behind one of the most common visual bugs in React.",
        "**Rendered as nothing:** `null`, `undefined`, `false`, `true`, and the empty string. **Rendered:** every other string, every number including `0`, and BigInts. **Flattened and rendered:** arrays, at any depth, with the ignorable values dropped along the way. **Thrown on:** plain objects.",
      ],
      examples: [
        {
          id: "renders-what",
          title: "Every case, measured",
          lang: "jsx",
          code: `import { renderToStaticMarkup } from "react-dom/server";

const cases = [
  ["null", null],
  ["undefined", undefined],
  ["false", false],
  ["true", true],
  ["empty string", ""],
  ["0", 0],
  ["string", "hi"],
  ["array", ["a", 1, null, false, "b"]],
  ["nested array", [["a", "b"], "c"]],
  ["10n (BigInt)", 10n],
];

for (const [label, value] of cases) {
  console.log(label.padEnd(14), renderToStaticMarkup(<div>{value}</div>));
}`,
          output: `null           <div></div>
undefined      <div></div>
false          <div></div>
true           <div></div>
empty string   <div></div>
0              <div>0</div>
string         <div>hi</div>
array          <div>a1b</div>
nested array   <div>abc</div>
10n (BigInt)   <div>10</div>`,
          explanation:
            "The two lines to memorise are the fourth and the sixth. `true` renders nothing — so `{isReady && <Spinner />}` is safe when `isReady` is a real boolean. `0` renders — so `{count && <Badge />}` prints a bare `0` when the count is zero. Note too that the array dropped its `null` and `false` and concatenated the rest with no separator: `\"a\"`, `1`, `\"b\"` became `a1b`.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

// The annotation is load-bearing. Without it TypeScript infers a union from
// the rows and \`label.padEnd\` stops compiling, because \`label\` could be any
// of the second-column types too.
const cases: [string, ReactNode][] = [
  ["null", null],
  ["undefined", undefined],
  ["false", false],
  ["true", true],
  ["empty string", ""],
  ["0", 0],
  ["string", "hi"],
  ["array", ["a", 1, null, false, "b"]],
  ["nested array", [["a", "b"], "c"]],
  ["10n (BigInt)", 10n],
];

for (const [label, value] of cases) {
  console.log(label.padEnd(14), renderToStaticMarkup(<div>{value}</div>));
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`NaN` renders too, and warns about it",
          body: "`NaN` is a number, so React renders the literal text `NaN` — and logs `Received NaN for the \\`children\\` attribute` while doing it. It almost always means an arithmetic slip upstream, such as `Number(undefined)` or a subtraction against a field that has not loaded yet. Treat the warning as pointing at your data, not at your JSX.",
        },
        {
          title: "An empty string is falsy but renders nothing, which hides a different bug",
          body: "`{name || \"Anonymous\"}` looks safe until `name` is `\"\"`, at which point the fallback appears — probably what you wanted. But `{name && <Greeting />}` with `name === \"\"` renders nothing *and* leaves no trace, because the empty string is one of the values React draws as nothing. The symptom is a missing element rather than a stray character, which makes it much harder to spot than the `0` case.",
        },
      ],
    },
    {
      id: "objects-throw",
      heading: "Why an object throws but an array does not",
      body: [
        "React can render an array because an array has an obvious meaning as children: render each item in order. A plain object has no such meaning — React cannot guess whether you wanted its keys, its values, or something else — so rather than silently drawing nothing it throws, with a message that names the keys it found.",
        "In practice this is almost always a missing property access: you meant `{user.name}` and wrote `{user}`. The error names the keys, which is usually enough to spot it immediately.",
      ],
      examples: [
        {
          id: "object-child",
          title: "The error, and what it tells you",
          lang: "jsx",
          code: `import { renderToStaticMarkup } from "react-dom/server";

const user = { name: "Ada", age: 36 };

try {
  // Meant \`{user.name}\`.
  renderToStaticMarkup(<p>{user}</p>);
} catch (error) {
  console.log(error.message);
}

// Dates and other class instances are objects too.
try {
  renderToStaticMarkup(<p>{new Date(0)}</p>);
} catch (error) {
  console.log(error.message);
}`,
          output: `Objects are not valid as a React child (found: object with keys {name, age}). If you meant to render a collection of children, use an array instead.
Objects are not valid as a React child (found: [object Date]). If you meant to render a collection of children, use an array instead.`,
          explanation:
            "The first message lists the object's keys, which points straight at the property you forgot. The second is the one that surprises people: a `Date` is an object, so rendering one throws rather than printing the date — and the message degrades to a bare `[object Date]`, naming the type but nothing about the value. Format it first: `{date.toLocaleDateString()}`.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup } from "react-dom/server";

const user = { name: "Ada", age: 36 };

try {
  // Meant \`{user.name}\`. TypeScript does not stop this: an object is not a
  // ReactNode, but \`{user}\` in a child position is checked loosely enough
  // that the failure still arrives at runtime.
  renderToStaticMarkup(<p>{user as never}</p>);
} catch (error) {
  // Under \`strict\`, a caught value is \`unknown\` — reaching for \`.message\`
  // needs a narrowing or a cast first.
  console.log((error as Error).message);
}

// Dates and other class instances are objects too.
try {
  renderToStaticMarkup(<p>{new Date(0) as never}</p>);
} catch (error) {
  console.log((error as Error).message);
}`,
            },
          ],
        },
      ],
    },
    {
      id: "idioms",
      heading: "The four ways to render conditionally",
      body: [
        "**`&&`** for \"show this or show nothing\". Shortest, and the one with the falsy trap — keep the left side a genuine boolean.",
        "**A ternary** for \"show this or show that\". It has no falsy trap, because both branches are explicit.",
        "**An early return** for \"this component has nothing to show at all\". Returning `null` from the top of a component is clearer than wrapping its entire body in a conditional.",
        "**An extracted variable** when the condition is long or nested. JSX nested three ternaries deep is unreadable, and the fix is never a cleverer expression — it is a `let` above the `return`, or a small component.",
      ],
      examples: [
        {
          id: "conditional-idioms",
          title: "All four, in one component",
          lang: "jsx",
          code: `function Status({ state, count }) {
  // Early return: nothing to show at all.
  if (state === "idle") return null;

  // Extracted variable: clearer than a nested ternary in place.
  let label;
  if (state === "loading") label = <em>Loading…</em>;
  else if (state === "error") label = <strong>Failed</strong>;
  else label = <span>Ready</span>;

  return (
    <div>
      {label}

      {/* \`&&\` with a real boolean on the left. */}
      {count > 0 && <span className="badge">{count}</span>}

      {/* A ternary: this or that, no falsy trap. */}
      {state === "error" ? <button type="button">Retry</button> : <small>ok</small>}
    </div>
  );
}

function App() {
  return (
    <>
      <Status state="idle" count={0} />
      <Status state="loading" count={0} />
      <Status state="error" count={3} />
    </>
  );
}`,
          output: `<div><em>Loading…</em><small>ok</small></div><div><strong>Failed</strong><span class="badge">3</span><button type="button">Retry</button></div>`,
          explanation:
            "The `idle` case produced nothing at all — the early return. The `loading` case shows no badge because `count > 0` is `false`, and `false` renders as nothing. Had that been written `{count && …}`, the loading case would have printed a stray `0` between the label and the `ok`.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

type State = "idle" | "loading" | "error" | "ready";

function Status({ state, count }: { state: State; count: number }) {
  // Early return: nothing to show at all.
  if (state === "idle") return null;

  // Extracted variable: clearer than a nested ternary in place. \`ReactNode\`
  // rather than a bare \`let\`, which would be an implicit \`any\`.
  let label: ReactNode;
  if (state === "loading") label = <em>Loading…</em>;
  else if (state === "error") label = <strong>Failed</strong>;
  else label = <span>Ready</span>;

  return (
    <div>
      {label}

      {/* \`&&\` with a real boolean on the left. */}
      {count > 0 && <span className="badge">{count}</span>}

      {/* A ternary: this or that, no falsy trap. */}
      {state === "error" ? <button type="button">Retry</button> : <small>ok</small>}
    </div>
  );
}

function App() {
  return (
    <>
      <Status state="idle" count={0} />
      <Status state="loading" count={0} />
      <Status state="error" count={3} />
    </>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "An IIFE in JSX is a sign the logic wants to leave",
          body: "`{(() => { switch (s) { … } })()}` works, because a function call is an expression. It is also a statement block smuggled into a template, and it reads worse every time somebody adds a case. When you reach for one, the answer is a variable computed above the `return`, or a component of its own. The exception nobody argues with is a `switch` over a small closed set, extracted into a named helper function that returns JSX.",
        },
      ],
    },
    {
      id: "whitespace",
      heading: "Where the spaces go",
      body: [
        "JSX does not preserve source whitespace the way HTML does, and the rules catch everyone once: two tags on separate lines render with **no** space between them, while two tags on the same line separated by a space render **with** one.",
        "The rule is: whitespace at the beginning and end of a line is removed, and a newline between two elements is removed entirely. A newline between two pieces of *text* collapses to a single space.",
        "When you need a space that survives, write it as an expression: `{\" \"}`. That is not a hack — it is a string child, and string children are kept verbatim.",
      ],
      examples: [
        {
          id: "jsx-whitespace",
          title: "Five arrangements, five results",
          lang: "jsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

// Text on two lines: the newline becomes one space.
const A = () => (
  <p>
    one
    two
  </p>
);

// Elements on two lines: the newline disappears.
const B = () => (
  <p>
    <span>a</span>
    <span>b</span>
  </p>
);

// Elements on one line with a space: the space is kept.
const C = () => <p><span>a</span> <span>b</span></p>;

// Text and an expression on one line: the space is kept.
const D = () => <p>hello {"world"}</p>;

// Two adjacent expressions: nothing between them.
const E = () => <p>{"a"}{"b"}</p>;

for (const [name, Case] of [["A", A], ["B", B], ["C", C], ["D", D], ["E", E]]) {
  console.log(name, JSON.stringify(render(<Case />)));
}`,
          output: `A "<p>one two</p>"
B "<p><span>a</span><span>b</span></p>"
C "<p><span>a</span> <span>b</span></p>"
D "<p>hello world</p>"
E "<p>ab</p>"`,
          explanation:
            "`B` is the one that bites: two links or two badges laid out on separate lines for readability render flush against each other. If you want the space, either put them on one line, add `{\" \"}` between them, or — usually better — make it a styling decision with a gap rather than a text space.",
          alternates: [
            {
              lang: "tsx",
              code: `import { renderToStaticMarkup as render } from "react-dom/server";
import type { ReactElement } from "react";

// Text on two lines: the newline becomes one space.
const A = () => (
  <p>
    one
    two
  </p>
);

// Elements on two lines: the newline disappears.
const B = () => (
  <p>
    <span>a</span>
    <span>b</span>
  </p>
);

// Elements on one line with a space: the space is kept.
const C = () => <p><span>a</span> <span>b</span></p>;

// Text and an expression on one line: the space is kept.
const D = () => <p>hello {"world"}</p>;

// Two adjacent expressions: nothing between them.
const E = () => <p>{"a"}{"b"}</p>;

// Annotated for the same reason as the table above: otherwise each row is a
// \`string | (() => ReactElement)\` and \`<Case />\` is not callable.
const cases: [string, () => ReactElement][] = [["A", A], ["B", B], ["C", C], ["D", D], ["E", E]];

for (const [name, Case] of cases) {
  console.log(name, JSON.stringify(render(<Case />)));
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which values render as nothing in React?",
      answer:
        "`null`, `undefined`, `false`, `true` and the empty string. Everything else that is a valid child gets drawn, including `0`, `NaN` and BigInts — which is why `{count && <Badge />}` puts a bare `0` on the page when the count is zero, while `{isReady && <Badge />}` with a real boolean is safe. Arrays are flattened and rendered element by element, with the ignorable values dropped; plain objects throw.",
    },
    {
      question: "Why can't you write an `if` statement inside JSX braces?",
      answer:
        "Because braces take an expression, and JSX compiles to a function call where children are arguments. `if` is a statement and produces no value, so there is nothing to pass. The expression forms are `&&`, the ternary, and for iteration `.map()`. When the logic is too big for those, it belongs above the `return` in ordinary statements, or in its own component.",
    },
    {
      question: "Why does rendering `{user}` throw when `{users.map(…)}` does not?",
      answer:
        "An array has an unambiguous reading as children — render each item in order — so React flattens and renders it. A plain object has no such reading, so rather than silently rendering nothing React throws and names the keys it found, which usually points straight at the property access that was left out. Class instances count as objects too, so `{new Date()}` throws rather than printing a date.",
    },
  ],
  takeaways: [
    "Braces take an expression because children are function arguments; statements have no value to pass",
    "`null`, `undefined`, `false`, `true` and `\"\"` render as nothing — `0`, `NaN` and every other number and string render",
    "Arrays flatten at any depth and drop the ignorable values; plain objects throw and name their keys",
    "`&&` for show-or-nothing, a ternary for this-or-that, an early return for nothing-at-all, a variable when it gets long",
    "A newline between two elements produces no space; a newline between two pieces of text collapses to one",
    "`{\" \"}` is the way to write a space that survives, because string children are kept verbatim",
  ],
  status: "available",
};
