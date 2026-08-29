import type { Lesson } from "@/content/types";

export const jsxAndComponentsLesson: Lesson = {
  id: "react-jsx-and-components",
  slug: "jsx-and-your-first-component",
  moduleSlug: "foundations",
  title: "JSX & Your First Component",
  summary:
    "What JSX compiles to and why that explains all of its rules, the differences from HTML that catch everyone, and how to write and compose your own components.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what JSX compiles to, and what a React element actually is",
    "Write JSX correctly: one root, closed tags, camelCase attributes",
    "Embed expressions, and know why statements are not allowed",
    "Render conditionally without falling into the `0` trap",
    "Write a component and compose it into a tree",
  ],
  sections: [
    {
      id: "what-jsx-is",
      heading: "JSX is a function call wearing a costume",
      body: [
        "JSX is not HTML, and it is not part of JavaScript. It is a **syntax extension** that a build tool transforms into ordinary function calls before the browser ever sees it. Every rule JSX has follows from that, so it is worth seeing the transformation once.",
        "The result of that call is a **React element**: a plain JavaScript object describing what you want on screen. It is not a DOM node, and creating one does nothing to the page — it is a description, which React will later use to produce or update DOM.",
      ],
      examples: [
        {
          id: "jsx-compiles-to",
          title: "The same element, three ways",
          lang: "jsx",
          code: `// What you write:
const element = <span id="x">hi</span>;

// What the compiler emits (the modern automatic runtime):
//   import { jsx } from "react/jsx-runtime";
//   const element = jsx("span", { id: "x", children: "hi" });

// What it is equivalent to, in the older explicit form:
const manual = React.createElement("span", { id: "x" }, "hi");

console.log(typeof element.type, element.type);
console.log(Object.keys(element.props));
console.log(JSON.stringify(element.props) === JSON.stringify(manual.props));`,
          output: `string span
[ 'id', 'children' ]
true`,
          explanation:
            "Three things fall out of this. The element's `type` is the string `\"span\"` for a DOM tag — it would be the *function itself* for a component. Everything you pass, including the children, ends up in `props`. And because it is a plain object, you can store an element in a variable, put it in an array, or return it from a function, which is exactly what components do.",
        },
      ],
      pitfalls: [
        {
          title: "You no longer need `import React` for JSX",
          body: "Older code starts every component file with `import React from \"react\"` because JSX used to compile to `React.createElement`, which needed `React` in scope. Since React 17 the automatic runtime imports what it needs itself, and Vite's React template configures it. You only import React now when you use something from it by name, such as a type. The Assembly-track equivalent of trivia, but it explains a line you will see everywhere.",
        },
      ],
    },
    {
      id: "the-rules",
      heading: "The rules, and where each comes from",
      body: [
        "**One root element.** A function can return one value, and JSX is compiled to a function call, so a component returns one element. Wrap siblings in a parent — or in a **Fragment**, written `<>…</>`, when you do not want a real DOM node.",
        "**Every tag closes.** `<br>` is legal HTML; in JSX it must be `<br />`, because the compiler is parsing a tree and has no list of void elements to guess from.",
        "**Attributes are camelCase.** JSX sets DOM *properties*, and their names are `className`, `htmlFor`, `tabIndex`, `onClick`. `class` and `for` are reserved words in JavaScript, which is why those two differ most visibly. Custom `data-*` and `aria-*` attributes keep their dashes, because they are genuine attributes rather than properties.",
        "**Braces embed an expression.** `{}` inside JSX means \"evaluate this JavaScript and use the result\". An *expression* — something with a value. `if`, `for` and `switch` are statements and cannot appear there, which is why conditional rendering uses `&&` and ternaries.",
      ],
      examples: [
        {
          id: "jsx-rules",
          title: "The differences from HTML, in one component",
          lang: "jsx",
          code: `function Profile({ user, isAdmin }) {
  const heading = "Profile";

  return (
    <>
      {/* A comment inside JSX is an expression containing a comment. */}
      <h1 className="title">{heading}</h1>

      <label htmlFor="name">Name</label>
      <input id="name" defaultValue={user.name} />
      <br />

      {/* Braces take an expression, so any JS that produces a value works. */}
      <p>{user.name.toUpperCase()}</p>
      <p>Member for {new Date().getFullYear() - user.joined} years</p>

      {/* Style is an object, and its keys are camelCase too. */}
      <p style={{ color: "crimson", fontWeight: 600 }}>Careful</p>

      {/* Dashed attributes stay dashed. */}
      <div data-testid="profile" aria-live="polite" />

      {isAdmin && <button type="button">Delete user</button>}
    </>
  );
}`,
          explanation:
            "The double braces in `style={{ … }}` are not special syntax: the outer pair embeds an expression, and the inner pair is an object literal. Note also that `<>…</>` produces no element in the output — the children are placed directly into the parent.",
          alternates: [
            {
              lang: "tsx",
              code: `type User = { name: string; joined: number };

function Profile({ user, isAdmin }: { user: User; isAdmin?: boolean }) {
  const heading = "Profile";

  return (
    <>
      {/* A comment inside JSX is an expression containing a comment. */}
      <h1 className="title">{heading}</h1>

      <label htmlFor="name">Name</label>
      <input id="name" defaultValue={user.name} />
      <br />

      {/* Braces take an expression, so any JS that produces a value works. */}
      <p>{user.name.toUpperCase()}</p>
      <p>Member for {new Date().getFullYear() - user.joined} years</p>

      {/* Style is an object, and its keys are camelCase too. */}
      <p style={{ color: "crimson", fontWeight: 600 }}>Careful</p>

      {/* Dashed attributes stay dashed. */}
      <div data-testid="profile" aria-live="polite" />

      {isAdmin && <button type="button">Delete user</button>}
    </>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "conditional",
      heading: "Conditional rendering, and the `0` that appears from nowhere",
      body: [
        "React renders `null`, `undefined`, `false` and `true` as nothing at all. That is what makes `{condition && <Thing />}` work: when the condition is false, the expression evaluates to `false`, and `false` renders nothing.",
        "It is also the source of a bug that every React programmer hits exactly once. `&&` does not return a boolean — it returns **the left operand if that operand is falsy**, and only otherwise the right one. So when the left side is `0`, the expression evaluates to `0`, and `0` is a number, and React renders numbers.",
      ],
      examples: [
        {
          id: "falsy-render",
          title: "The bug, and the fix, side by side",
          lang: "jsx",
          code: `const items = [];       // empty
const zero = 0;

function Truthy() {
  return (
    <ul>
      {/* items.length is 0, so \`&&\` returns 0, and React renders it. */}
      <li>{items.length && <em>has items</em>}</li>

      {/* A real boolean. False renders nothing. */}
      <li>{items.length > 0 && <em>has items</em>}</li>

      {/* \`||\` has the mirror-image trap: 0 is falsy, so this falls through. */}
      <li>{zero || "fallback"}</li>

      {/* All four of these render nothing whatsoever. */}
      <li>{null}{undefined}{false}{true}</li>

      {/* An array renders its elements, concatenated. */}
      <li>{["a", "b"]}</li>
    </ul>
  );
}`,
          output: `<ul><li>0</li><li></li><li>fallback</li><li></li><li>ab</li></ul>`,
          explanation:
            "That output is what React actually produces. A stray `0` on the page — usually right where a list is empty — is always this. The habit that prevents it: **make the left side of `&&` a real boolean**, with `> 0`, `!== 0`, or `Boolean(...)`. A ternary (`items.length ? <em/> : null`) avoids the question entirely and is often clearer.",
          alternates: [
            {
              lang: "tsx",
              code: `// The annotation matters here: \`const items = []\` on its own is \`never[]\`,
// so pushing a string into it later would not compile.
const items: string[] = [];
const zero = 0;

function Truthy() {
  return (
    <ul>
      {/* items.length is 0, so \`&&\` returns 0, and React renders it. */}
      <li>{items.length && <em>has items</em>}</li>

      {/* A real boolean. False renders nothing. */}
      <li>{items.length > 0 && <em>has items</em>}</li>

      {/* \`||\` has the mirror-image trap: 0 is falsy, so this falls through. */}
      <li>{zero || "fallback"}</li>

      {/* All four of these render nothing whatsoever. */}
      <li>{null}{undefined}{false}{true}</li>

      {/* An array renders its elements, concatenated. */}
      <li>{["a", "b"]}</li>
    </ul>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`{zero || \"fallback\"}` is a different trap in the same family",
          body: "`||` falls through on any falsy value, so a legitimate `0`, empty string or `false` gets replaced by your fallback. When you mean \"only when this is null or undefined\", use `??` — the nullish coalescing operator — which ignores the other falsy values.",
        },
      ],
    },
    {
      id: "writing-components",
      heading: "Writing a component",
      body: [
        "Two rules make a function a component, and both are enforced.",
        "**It must return something renderable.** JSX, `null`, a string, a number, an array of elements — or nothing at all. A function with no `return` used to be an error; since React 18 it renders as nothing, exactly like `null`. Returning `null` still says \"I have decided to show nothing\" more clearly than falling off the end of a function does.",
        "**Its name must start with a capital letter.** This is not a style preference — it is how the compiler distinguishes the two cases. `<button />` compiles to `jsx(\"button\", …)`, passing a *string*, which means a DOM element. `<Button />` compiles to `jsx(Button, …)`, passing the *function itself*. A lowercase component name is silently treated as an unknown HTML tag, and the resulting error message rarely points at the real cause.",
      ],
      examples: [
        {
          id: "first-component",
          title: "Defining and composing components",
          lang: "jsx",
          code: `// Lowercase: React sees the string "avatar" and looks for an HTML tag.
function avatar() {
  return <img src="/me.png" alt="" />;
}

// Capitalised: React receives the function.
function Avatar() {
  return <img src="/me.png" alt="" />;
}

function Card() {
  return (
    <article className="card">
      <Avatar />
      <h3>Ada Lovelace</h3>
      <p>Wrote the first algorithm intended for a machine.</p>
    </article>
  );
}

export default function App() {
  return (
    <main>
      <Card />
      <Card />
    </main>
  );
}`,
          explanation:
            "`<Card />` twice produces two independent cards. That independence matters later: each instance of a component gets its own state, so two counters on one page count separately without any effort on your part.",
        },
      ],
      pitfalls: [
        {
          title: "Never define a component inside another component",
          body: "Declaring `function Row() {…}` inside `function Table() {…}` creates a *new function object* on every render of `Table`. React compares element types by identity, sees a different type, and unmounts and re-mounts the whole subtree — destroying its state and its DOM nodes every time the parent renders. Define components at the top level of a module. This is one of the most damaging beginner mistakes and one of the hardest to diagnose, because the symptom is \"my input keeps losing focus\", not an error.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does JSX compile to, and what is a React element?",
      answer:
        "JSX compiles to function calls — `jsx(type, props)` with the modern automatic runtime, or `React.createElement(type, props, ...children)` with the classic one. The result is a React element: a plain JavaScript object with a `type` and `props`, describing what should be on screen. It is not a DOM node, and creating one has no effect on the page until React renders it.",
    },
    {
      question: "Why must component names start with a capital letter?",
      answer:
        "The compiler uses the case to decide what to pass as the element's type. A lowercase tag becomes a string, which React treats as a DOM element; a capitalised one becomes a reference to the function itself, which React treats as a component. Naming a component in lowercase makes React look for an HTML element of that name instead of calling your function.",
    },
    {
      question: "Why does `{items.length && <List />}` sometimes render a stray 0?",
      answer:
        "`&&` returns its left operand when that operand is falsy, rather than returning a boolean. When the array is empty, `items.length` is `0`, so the expression evaluates to `0` — and React renders numbers, unlike `false`, `null` and `undefined` which render nothing. The fix is to make the left side a genuine boolean, or to use a ternary.",
    },
  ],
  takeaways: [
    "JSX is a syntax extension compiled to function calls; a React element is a plain object with `type` and `props`",
    "One root element, every tag closed, camelCase attributes — each rule follows from JSX being compiled to a function call",
    "Braces embed an expression, not a statement, which is why conditionals use `&&` and ternaries",
    "`null`, `undefined`, `false` and `true` render nothing; numbers and strings render, which is where the stray `0` comes from",
    "Capitalisation decides whether React receives a string (DOM tag) or your function (component)",
    "Never define a component inside another component — it remounts the subtree and destroys its state on every parent render",
  ],
  status: "available",
};
