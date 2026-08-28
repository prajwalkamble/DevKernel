import type { Lesson } from "@/content/types";

export const whatMakesAComponentLesson: Lesson = {
  id: "react-what-makes-a-component",
  slug: "what-makes-a-component",
  moduleSlug: "components-and-props",
  title: "What Makes a Function a Component",
  summary:
    "The rules a function must obey to be a component, every one of them traceable to something you have already seen — and the two rules about *where* you define it, which are the ones that cause real damage when broken.",
  estimatedMinutes: 25,
  objectives: [
    "State the rules a component must follow, and where each comes from",
    "Explain what capitalisation changes in the compiled output",
    "Say what a component may return, including the case that changed in React 18",
    "Explain why a component defined inside another destroys state on every render",
    "Decide when something should be a component and when it should stay a function",
  ],
  sections: [
    {
      id: "the-rules",
      heading: "The rules, and where each comes from",
      body: [
        "A component is an ordinary JavaScript function. What makes it a *component* is that React calls it, and React's expectations are narrow and worth stating exactly.",
        "**Its name starts with a capital letter.** Not style — the compiler reads the case to decide what to pass as the element's type. Lowercase becomes a string, which React treats as a DOM tag.",
        "**It returns something renderable.** JSX, `null`, a string, a number, an array — or nothing at all, which since React 18 is legal and renders as nothing.",
        "**It is pure.** Same props, same output; no mutation of anything that existed before the call; nothing observable. Module 2 covered why: a render may be discarded and redone.",
        "**It takes one argument.** React calls it with a single props object. A second parameter is not a second prop — for years it was the legacy context argument, and in React 19 `ref` arrives as an ordinary prop rather than a second argument.",
      ],
      examples: [
        {
          id: "capitalisation",
          title: "What the case actually changes",
          lang: "tsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

// Lowercase: the compiler passes the string "avatar".
function avatar() {
  return <img alt="" />;
}

// Capitalised: the compiler passes the function itself.
function Avatar() {
  return <img alt="" />;
}

console.log("lowercase type:", JSON.stringify((<avatar />).type));
console.log("capitalised type is the function:", (<Avatar />).type === Avatar);

// So the lowercase one is emitted as an unknown HTML tag, and its body never runs.
console.log("lowercase renders:", render(<div><avatar /></div>));
console.log("capitalised renders:", render(<div><Avatar /></div>));`,
          output: `lowercase type: "avatar"
capitalised type is the function: true
lowercase renders: <div><avatar></avatar></div>
capitalised renders: <div><img alt=""/></div>`,
          explanation:
            "There is no error and no warning. React was handed the string `\"avatar\"`, so it produced an `<avatar>` element — valid in HTML as a custom element, and completely empty, because your function was never called. The symptom is a blank space where a component should be, which sends people looking at CSS rather than at the letter `a`.",
        },
      ],
      pitfalls: [
        {
          title: "A component held in a variable must also be capitalised",
          body: "`const cmp = Avatar; return <cmp />;` compiles to the string `\"cmp\"` and renders an empty `<cmp>` element, because the compiler reads the *tag* you wrote and not what the variable holds. Capitalise the variable — `const Cmp = Avatar` — or use a member expression, which is always treated as a component: `<ui.Avatar />` works whatever the case.",
        },
      ],
    },
    {
      id: "what-it-returns",
      heading: "What a component may return",
      visual: {
        id: "component-returns-tree",
        kind: "react-rendering",
        algorithm: "element-tree",
        title: "What a component hands back",
      },
      body: [
        "Anything React can render, which is the list from module 2: elements, strings, numbers, arrays, `null`, `undefined`, `false`. Not plain objects.",
        "Returning `null` is the idiomatic way to say \"this component has decided to show nothing\". It is an ordinary return value, not a special case — the component still mounted, still has state, and its effects still run.",
        "A function that falls off the end returns `undefined`, and React 18 made that render as nothing rather than throw. It is legal, but it usually means a missing `return` before a JSX block rather than a deliberate decision, so `null` remains the better way to say you meant it.",
      ],
      examples: [
        {
          id: "return-values",
          title: "Four returns, all legal",
          lang: "tsx",
          code: `import { renderToStaticMarkup as render } from "react-dom/server";

function Nothing() { return null; }
function Implicit() {}                       // no return at all
function JustText() { return "plain text"; }
function Several() { return [<b key="a">a</b>, <i key="b">b</i>]; }

console.log("null:    ", JSON.stringify(render(<div><Nothing /></div>)));
console.log("implicit:", JSON.stringify(render(<div><Implicit /></div>)));
console.log("string:  ", JSON.stringify(render(<div><JustText /></div>)));
console.log("array:   ", JSON.stringify(render(<div><Several /></div>)));`,
          output: `null:     "<div></div>"
implicit: "<div></div>"
string:   "<div>plain text</div>"
array:    "<div><b>a</b><i>b</i></div>"`,
          explanation:
            "A component returning a bare string is genuinely useful — a `<Currency>` or a `<RelativeTime>` that produces text with no wrapper element, so the caller decides the markup. The array case needs keys for the same reason any list does.",
        },
      ],
      pitfalls: [
        {
          title: "The missing `return` after a line break",
          body: "`return\\n  <div />;` returns `undefined`, because automatic semicolon insertion ends the statement at `return`. Before React 18 this threw and you found it immediately; now it renders nothing, silently. Either keep the JSX on the same line as `return`, or wrap it in parentheses starting on the `return` line — which is why the convention is `return (` with the JSX indented beneath.",
        },
      ],
    },
    {
      id: "where-you-define-it",
      heading: "Where you define it, and why it matters more than how",
      body: [
        "**Define components at the top level of a module.** Never inside another component, and never inside a function that a component calls.",
        "The reason is identity. A `function Row() {…}` written inside `Table` is a *new function object* every time `Table` runs. Reconciliation compares element types by identity, so React sees a different type at that position on every render of the parent — and a different type means destroy the subtree and rebuild it, as module 2 established.",
        "The result is that the nested component's DOM nodes are thrown away and recreated on every parent render, taking with them its state, its scroll position, and the focus if the user was typing in it.",
      ],
      examples: [
        {
          id: "nested-identity",
          title: "The identity a nested component has",
          lang: "tsx",
          code: `// Stands in for two renders of a parent that defines a component inside itself.
function renderParent() {
  function Row() { return <li />; }
  return <Row />;
}

const firstRender = renderParent();
const secondRender = renderParent();

console.log("nested — same type across renders?", firstRender.type === secondRender.type);

// Defined once, at the top level.
function StableRow() { return <li />; }

console.log("top level — same type across renders?", (<StableRow />).type === (<StableRow />).type);`,
          output: `nested — same type across renders? false
top level — same type across renders? true`,
          explanation:
            "`false` is the whole bug. React compares those two types, finds them different, and concludes the element at that position has been replaced by something else entirely. Everything below it is unmounted and rebuilt — on every single render of the parent, for as long as the code stays that way.",
        },
      ],
      pitfalls: [
        {
          title: "The symptom is never an error message",
          body: "It is \"my input loses focus after every keystroke\", or \"the accordion closes whenever anything else on the page changes\", or a mysteriously slow list. None of those point at the nested definition. If you see any of them, look first for a component declared inside another component — including one hidden inside a `.map()` callback or a `useMemo`.",
        },
      ],
    },
    {
      id: "when-to-extract",
      heading: "When something should be a component, and when it should not",
      body: [
        "Not every function returning JSX needs to be a component. A helper that returns a fragment of markup, called directly as `renderIcon(name)`, is a perfectly good function — and because React never sees it, it costs nothing to call and cannot hold state.",
        "**Make it a component when it needs an identity:** its own state, its own effects, its own place in the tree so it can be memoised, suspended, or given a key. Anything with `useState` in it must be a component, because hooks require one.",
        "**Leave it a function when it is purely a shape:** a formatting helper, a small markup fragment with no behaviour, something used once. A component that exists only to avoid repeating six lines is often less clear than the six lines.",
        "The one thing not to do is the middle ground: a function that returns JSX and is *called* as `{Row(props)}` where it should have been `<Row {...props} />`. Module 2 covered what that costs — no instance, no state, and its hooks counted against the caller.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes a function a React component rather than a plain function?",
      answer:
        "That React calls it, which requires a capitalised name so the compiler passes the function itself as the element type rather than a string. Beyond that it must return something renderable — JSX, a string, a number, an array, `null`, or nothing at all — and it must be pure, because React may discard a render and redo it. It receives a single props object as its only argument.",
    },
    {
      question: "What happens if you define a component inside another component?",
      answer:
        "It becomes a new function object on every render of the parent, so the element's `type` changes identity each time. Reconciliation treats a changed type as a different element, so React unmounts the subtree and mounts a fresh one on every parent render — destroying its state, its DOM nodes, its scroll position and any focus. There is no error; the symptoms are lost focus and state that resets.",
    },
    {
      question: "Is it valid for a component to return nothing?",
      answer:
        "Yes since React 18 — a component that falls off the end returns `undefined` and React renders nothing, the same as `null`. Before React 18 it threw. It is still better style to `return null` deliberately, because an accidental `undefined` is usually a missing `return` — often caused by automatic semicolon insertion after a bare `return` on its own line — and that now fails silently rather than loudly.",
    },
  ],
  takeaways: [
    "Capitalisation decides whether the compiler passes a string or your function; a lowercase component silently renders an empty custom element",
    "A component may return JSX, a string, a number, an array, `null` — or nothing, which has been legal since React 18",
    "A bare `return` followed by JSX on the next line returns `undefined`, and now fails silently rather than throwing",
    "Define components at the top level: a nested one gets a new identity every parent render, so its subtree is destroyed and rebuilt each time",
    "The symptoms of that are lost focus and resetting state, never an error message",
    "Make it a component when it needs an identity — state, effects, a key, memoisation; otherwise a plain function is fine",
  ],
  status: "available",
};
