import type { Lesson } from "@/content/types";

export const whatJsxCompilesToLesson: Lesson = {
  id: "react-what-jsx-compiles-to",
  slug: "what-jsx-compiles-to",
  moduleSlug: "jsx-and-rendering",
  title: "What JSX Compiles To",
  summary:
    "The exact code the compiler emits for JSX — the automatic runtime, `jsx` against `jsxs`, where `key` goes, and what the resulting object looks like at runtime. Every later surprise in this module is a consequence of one of these details.",
  estimatedMinutes: 30,
  objectives: [
    "Read the code the automatic runtime emits for any piece of JSX",
    "Explain why `jsx` and `jsxs` are two different functions",
    "Say where `key` lives, and why it is not a prop",
    "Describe a React element's runtime shape, including `$$typeof`",
    "Predict what a spread compiles to, and how prop order resolves",
  ],
  sections: [
    {
      id: "the-emit",
      heading: "The code the compiler actually emits",
      body: [
        "Module 1 said JSX compiles to function calls. That is true, and it is where most explanations stop. It is worth seeing the real emit, because four separate behaviours later in this module are visible in it and invisible without it.",
        "Modern React uses the **automatic runtime**. The compiler adds its own import — you do not write one — and calls `jsx` from `react/jsx-runtime`. The older **classic runtime** compiled to `React.createElement` and needed `React` in scope, which is why so much older code opens with an import it never appears to use.",
      ],
      examples: [
        {
          id: "automatic-runtime-emit",
          title: "Four pieces of JSX, and what each becomes",
          lang: "jsx",
          code: `const one = <span id="x">hi</span>;
const many = <ul><li>a</li><li>b</li></ul>;
const keyed = <li key="k" id="i">t</li>;
const comp = <Widget size={3}>body</Widget>;

// The compiler emits this, adding the import itself:
//
//   import { jsx, jsxs } from "react/jsx-runtime";
//
//   const one   = jsx("span", { id: "x", children: "hi" });
//   const many  = jsxs("ul", { children: [
//                   jsx("li", { children: "a" }),
//                   jsx("li", { children: "b" }),
//                 ] });
//   const keyed = jsx("li", { id: "i", children: "t" }, "k");
//   const comp  = jsx(Widget, { size: 3, children: "body" });`,
          explanation:
            "Read the four lines of emit and the rest of this module is half-explained. `children` is an ordinary entry in the props object, which is why `children` is an ordinary prop. A DOM tag arrives as the **string** `\"span\"`; a component arrives as **the function itself**, which is what capitalisation decides. `many` calls `jsxs` rather than `jsx`. And `keyed` passes `\"k\"` as a *third argument*, not inside props.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactElement, ReactNode } from "react";

declare function Widget(props: { size: number; children: ReactNode }): ReactElement;

const one = <span id="x">hi</span>;
const many = <ul><li>a</li><li>b</li></ul>;
const keyed = <li key="k" id="i">t</li>;
const comp = <Widget size={3}>body</Widget>;

// Types are erased before the JSX transform runs, so the emit is identical
// to the JavaScript version — the declaration above produces no code:
//
//   import { jsx, jsxs } from "react/jsx-runtime";
//
//   const one   = jsx("span", { id: "x", children: "hi" });
//   const many  = jsxs("ul", { children: [
//                   jsx("li", { children: "a" }),
//                   jsx("li", { children: "b" }),
//                 ] });
//   const keyed = jsx("li", { id: "i", children: "t" }, "k");
//   const comp  = jsx(Widget, { size: 3, children: "body" });`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`jsx` and `jsxs` are not a typo",
          body: "The `s` is for *static children*: when the compiler can see at compile time that the children are a fixed list, it emits `jsxs` and React skips the development-time check that every child in a dynamically built array has a key. Children built by `.map()` cannot be known statically, so those go through `jsx` and do get checked — which is exactly why the missing-key warning fires for mapped lists and never for children you typed out by hand.",
        },
      ],
    },
    {
      id: "runtime-shape",
      heading: "What the call returns",
      body: [
        "The return value is a **React element**: a frozen plain object. Four fields matter, and one of them is a defence mechanism rather than data.",
        "`type` is the string or the function. `props` holds everything you passed, including `children`. `key` sits *beside* props, not in them. And `$$typeof` is a **symbol** — its presence is how React knows an object came from a real `jsx()` call.",
        "That last one exists for security. If a server ever sends user-controlled JSON straight into a render, an attacker could try to hand you an object shaped like an element. `Symbol` values cannot be expressed in JSON, so a forged element cannot carry a valid `$$typeof` and React refuses to render it.",
      ],
      examples: [
        {
          id: "element-shape",
          title: "An element, inspected",
          lang: "jsx",
          code: `const el = <li key="k" id="i">t</li>;

console.log("type:      ", el.type);
console.log("key:       ", el.key);
console.log("props:     ", JSON.stringify(el.props));
console.log("$$typeof:  ", String(el.$$typeof));
console.log("frozen:    ", Object.isFrozen(el));

// \`key\` is deliberately absent from props.
console.log("props keys:", JSON.stringify(Object.keys(el.props)));`,
          output: `type:       li
key:        k
props:      {"id":"i","children":"t"}
$$typeof:   Symbol(react.transitional.element)
frozen:     true
props keys: ["id","children"]`,
          explanation:
            "Note the symbol's name: in React 19 it is `react.transitional.element`, not the `react.element` that older articles quote. Never compare against it yourself — it is an implementation detail that has already changed once. And note what is missing from `props`: the key you passed.",
          alternates: [
            {
              lang: "tsx",
              code: `const el = <li key="k" id="i">t</li>;

console.log("type:      ", el.type);
console.log("key:       ", el.key);
console.log("props:     ", JSON.stringify(el.props));
// \`$$typeof\` is on the object at runtime, but React does not put it on the
// element type — so TypeScript needs to be told it is there.
console.log("$$typeof:  ", String((el as unknown as { $$typeof: symbol }).$$typeof));
console.log("frozen:    ", Object.isFrozen(el));

// \`key\` is deliberately absent from props.
console.log("props keys:", JSON.stringify(Object.keys(el.props)));`,
            },
          ],
        },
        {
          id: "key-is-not-a-prop",
          title: "Reading `props.key`, and being told off for it",
          lang: "jsx",
          code: `const el = <li key="k" id="i">t</li>;

// React 19 leaves a non-enumerable getter on props purely to catch this.
console.log(el.props.key);`,
          output: `undefined
li: \`key\` is not a prop. Trying to access it will result in \`undefined\` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)`,
          explanation:
            "The value is `undefined` and the warning goes to stderr, which is why it is printed after the value here. A component genuinely cannot see its own key, because the key is instruction to React about *which* item this is between renders — not data about the item. When the component needs the value too, pass it twice: `<Row key={row.id} id={row.id} />`.",
          alternates: [
            {
              lang: "tsx",
              code: `const el = <li key="k" id="i">t</li>;

// React 19 leaves a non-enumerable getter on props purely to catch this.
// The type says nothing either way: \`props\` here is \`any\`, so naming a
// field that was never a prop is not a compile error — only a runtime scold.
console.log((el.props as { key?: string }).key);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Elements are frozen, so you cannot patch one",
          body: "`element.props.className = \"x\"` fails silently in loose mode and throws in strict mode. An element describes one specific render and is never edited afterwards — that immutability is what lets React compare an old tree with a new one cheaply. When you need a modified copy, build a new element: `cloneElement(el, { className: \"x\" })`, or better, pass different props in the first place.",
        },
      ],
    },
    {
      id: "spreads-and-order",
      heading: "Spreads, and why order decides the winner",
      body: [
        "`<input {...rest} id=\"after\" />` compiles to an ordinary object literal with an ordinary spread: `jsx(\"input\", { ...rest, id: \"after\" })`. There is no JSX-specific merging rule to learn, because there is no merging — it is the object spread you already know.",
        "So **the last one wins**, and moving the spread changes the result. Putting the spread last lets a caller override anything you set; putting it first makes your own attributes final. Both are legitimate, and component libraries choose deliberately between them.",
      ],
      examples: [
        {
          id: "spread-order",
          title: "The same props, two orders",
          lang: "jsx",
          code: `const rest = { id: "from-rest", type: "text" };

// Spread first: the explicit \`id\` wins.
const a = <input {...rest} id="explicit" />;

// Spread last: the caller's \`id\` wins.
const b = <input id="explicit" {...rest} />;

console.log(JSON.stringify(a.props));
console.log(JSON.stringify(b.props));`,
          output: `{"id":"explicit","type":"text"}
{"id":"from-rest","type":"text"}`,
          explanation:
            "This is the whole rule. A component that wants to stay overridable spreads incoming props **last** onto the element it renders; one that must guarantee an attribute — a `type=\"button\"` that has to stay a button — spreads first and sets the attribute after.",
          alternates: [
            {
              lang: "tsx",
              code: `// \`as const\` narrows \`type\` to "text". Without it the field is \`string\`,
// which is not assignable to the union \`<input type>\` accepts.
const rest = { id: "from-rest", type: "text" } as const;

// Spread first: the explicit \`id\` wins.
const a = <input {...rest} id="explicit" />;

// Spread last: the caller's \`id\` wins.
const b = <input id="explicit" {...rest} />;

console.log(JSON.stringify(a.props));
console.log(JSON.stringify(b.props));`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the automatic JSX runtime change compared with `React.createElement`?",
      answer:
        "The compiler imports `jsx`/`jsxs` from `react/jsx-runtime` itself, so `React` no longer needs to be in scope — that is why `import React from \"react\"` disappeared from component files after React 17. The call shape also changes: children move inside the props object rather than being trailing arguments, and `key` becomes a separate third argument instead of a member of the config object.",
    },
    {
      question: "Why is `key` not accessible as a prop inside a component?",
      answer:
        "Because it is not passed as one. The compiler emits it as a third argument to `jsx`, and React stores it on the element beside `props`, since it is instruction to React about identity rather than data for the component. React 19 leaves a non-enumerable getter on props that warns and returns `undefined` if you read `props.key`. If a component needs the value, pass it a second time under a different name.",
    },
    {
      question: "What is `$$typeof` on a React element for?",
      answer:
        "It marks the object as having come from a real `jsx()` call. It holds a symbol, and symbols cannot survive `JSON.parse`, so an element-shaped object that arrived as JSON from a server cannot carry a valid one. React refuses to render such an object, which closes off an injection route where user-controlled JSON is rendered directly.",
    },
  ],
  takeaways: [
    "JSX compiles to `jsx(type, props, key)` from `react/jsx-runtime`; the compiler adds the import, so `React` need not be in scope",
    "A DOM tag compiles to a string type, a component to the function itself — capitalisation is what selects between them",
    "`children` is an ordinary entry in the props object, which is why it behaves like an ordinary prop",
    "`jsxs` is used when the compiler can see the children are a static list, which is why only dynamic lists get the missing-key warning",
    "`key` is a third argument and lives beside props, not inside them; a component cannot read its own key",
    "An element is a frozen plain object, and `$$typeof` is a symbol that stops JSON-shaped forgeries from being rendered",
  ],
  status: "available",
};
