import type { Lesson } from "@/content/types";

export const jsxFundamentalsLesson: Lesson = {
  id: "modules-tooling-jsx",
  slug: "jsx-fundamentals",
  moduleSlug: "modules-tooling",
  title: "JSX Fundamentals",
  summary:
    "JSX is syntax sugar over function calls, and once you can read the calls the rest of it stops being magic: how the two runtimes compile, why capitalisation decides everything, what happens to props and children, and why an element is data rather than a DOM node.",
  estimatedMinutes: 30,
  objectives: [
    "Read JSX and predict the exact function calls it compiles to",
    "Distinguish the classic and automatic JSX runtimes and configure each",
    "Explain why a tag's capitalisation changes what the compiler emits",
    "Describe a JSX element as the plain object it is",
  ],
  sections: [
    {
      id: "what-jsx-is",
      heading: "JSX is an expression, not a template",
      body: [
        "JSX is a syntax extension. It is not part of JavaScript, no engine implements it, and it is not HTML — it is a compact way to write nested function calls, and a compiler rewrites it before anything runs. React popularised it, but it is a general syntax that Preact, Solid, Vue and others also compile.",
        "The most useful mental correction is that a JSX tag is an **expression**. It evaluates to a value you can assign to a variable, put in an array, return from a function or pass as an argument. That is why the things you can write inside `{...}` are also expressions — a ternary and `&&` work, an `if` statement and a `for` loop do not, because there is nowhere for a statement to go inside a function call's arguments.",
        "TypeScript compiles JSX itself, controlled by the `jsx` option: `preserve` leaves it alone for a downstream tool, `react` emits classic `React.createElement` calls, `react-jsx` emits the modern automatic runtime, and `react-jsxdev` adds source locations for development. JSX is only allowed in `.tsx` files (or `.jsx` for JavaScript), which is why the extension matters.",
      ],
      examples: [
        {
          id: "jsx-syntax-example",
          title: "The syntax, all in one place",
          ts: `// Tour.tsx
const user = { name: "Ada", admin: true };
const items = ["alpha", "beta"];

export function Tour() {
  return (
    <section className="tour" data-testid="tour" hidden={false}>
      {/* A JSX comment is an expression container holding a comment */}
      <h1>Hello, {user.name}</h1>

      {/* Braces hold an expression — a ternary is fine, an if statement is not */}
      <p>{items.length > 0 ? "has items" : "empty"}</p>
      {user.admin && <p>admin</p>}

      {/* Elements produced in a loop need a stable key */}
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {/* A fragment groups children without adding a wrapper element */}
      <>
        <hr />
        <small>footer</small>
      </>

      {/* Elements with no children must close themselves */}
      <input type="text" defaultValue={user.name} />
    </section>
  );
}

// An element is a value like any other
const heading = <h1>Reusable</h1>;
const both = [heading, <h2 key="second">Also reusable</h2>];
console.log(typeof heading, both.length);`,
          explanation:
            "Every attribute here is an ordinary function argument in disguise, and every `{}` is a slot where an expression's value gets substituted. Reading `<li key={item}>{item}</li>` as `call(\"li\", { key: item }, item)` makes the rules about what's allowed inside braces feel obvious rather than arbitrary.",
        },
      ],
      pitfalls: [
        {
          title: "&& with a number renders the number",
          body: "`{items.length && <List />}` looks like a conditional, but `&&` returns its left operand when that operand is falsy — so an empty array renders a literal `0` on the page rather than nothing. The same trap catches empty strings and `NaN`. Write the condition as a real boolean (`items.length > 0 && ...`) or use a ternary with `null`. React renders `null`, `undefined`, `false` and `true` as nothing; `0` is a perfectly good thing to display, so it displays it.",
        },
      ],
    },
    {
      id: "how-jsx-compiles",
      heading: "The two runtimes",
      body: [
        "The **classic runtime** compiles every element to `React.createElement(type, props, ...children)`. Because the emitted code names `React` directly, every file using JSX had to `import React from \"react\"` even when it never referenced React otherwise — an unavoidable ceremony that generated a great deal of confusion.",
        "The **automatic runtime**, introduced in React 17 and now the default everywhere, changes three things. The compiler inserts its own import from `react/jsx-runtime`, so no manual import is needed. Children move *into* the props object rather than being trailing arguments. And `key` is pulled out and passed as a separate third argument, which is why `key` never appears in a component's `props` — it was removed before the call was made.",
        "One more detail is visible in the output: the automatic runtime has two functions. `jsx` is used when there is a single child (or none), and `jsxs` when there are several static children — the extra information tells React it doesn't need to warn about missing keys for that array, because the children were written literally rather than produced by a loop.",
        "The `jsxImportSource` option redirects the generated import, which is how Preact (`\"jsxImportSource\": \"preact\"`) and Emotion plug into the same syntax. Setting it per-file with a `/** @jsxImportSource ... */` comment is also supported.",
      ],
      examples: [
        {
          id: "jsx-emit-example",
          title: "One component, two compilers",
          ts: `// Card.tsx
export function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </section>
  );
}

// --- "jsx": "react" (classic) ---------------------------------------------
// Requires \`React\` to be in scope; children are trailing arguments.
//
//   export function Card({ title, items }) {
//       return (React.createElement("section", { className: "card" },
//           React.createElement("h2", null, title),
//           items.map((item) => (React.createElement("p", { key: item }, item)))));
//   }
//
// --- "jsx": "react-jsx" (automatic) ----------------------------------------
// The import is generated; children live in props; key is the third argument.
//
//   import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
//   export function Card({ title, items }) {
//       return (_jsxs("section", { className: "card", children: [
//           _jsx("h2", { children: title }),
//           items.map((item) => (_jsx("p", { children: item }, item)))] }));
//   }
//
// Read the last line carefully: \`_jsx("p", { children: item }, item)\` passes
// \`item\` twice — once as the child, once as the key. The key is not a prop.`,
          explanation:
            "This is why `props.key` is always `undefined` inside a component: the compiler extracted it, and React uses it for reconciliation before your function is ever called. If you need the same value inside the component, pass it a second time under a different name — `<Row key={id} id={id} />`.",
        },
      ],
    },
    {
      id: "elements-vs-components",
      heading: "Capitalisation is a compiler rule",
      body: [
        "`<div />` compiles to a call with the **string** `\"div\"`; `<Widget />` compiles to a call with the **identifier** `Widget`. The rule is purely lexical: a tag beginning with a lowercase letter is treated as a built-in host element name, and anything else — a capital letter, or a dotted path like `<Layout.Row />` — is treated as a variable reference.",
        "That single rule explains several otherwise-mysterious behaviours. A component named `button` is invisible to JSX, because `<button />` means the HTML element. A component imported but never capitalised silently becomes an unknown tag. And `<Layout.Row />` works because a member expression is unambiguously a value reference, so no capitalisation is required after the dot.",
        "TypeScript checks host elements against the `JSX.IntrinsicElements` interface, which `@types/react` populates with every HTML and SVG tag and its attributes. An unrecognised lowercase tag is a type error naming that interface directly — which is also the hook you use when you need to teach TypeScript about a custom element.",
      ],
      examples: [
        {
          id: "elements-vs-components-example",
          title: "Same syntax, two completely different emits",
          ts: `// Elements.tsx
function Widget({ label }: { label: string }) {
  return <span>{label}</span>;
}

// Namespacing works because a member expression is unambiguous
const Layout = { Row: Widget };

export function Demo() {
  return (
    <div>
      {/* lowercase -> the string "div", checked against JSX.IntrinsicElements */}
      <span>host element</span>

      {/* capitalised -> the identifier Widget, called as a function */}
      <Widget label="component" />

      {/* dotted -> the member expression Layout.Row */}
      <Layout.Row label="also a component" />
    </div>
  );
}

// Lowercase and not a real tag, so the compiler goes looking for an HTML element
const broken = <mywidget label="oops" />;
// Error: Property 'mywidget' does not exist on type 'JSX.IntrinsicElements'.

// The rule in one line: this renders the HTML <button>, not the function below it.
function button() {
  return <span>never reached</span>;
}
const notTheComponent = <button type="button">click</button>;
console.log(typeof button, broken, notTheComponent);`,
          explanation:
            "The error message names `JSX.IntrinsicElements` because that interface *is* the list of legal lowercase tags. Adding an entry to it — via declaration merging — is how you make a web component like `<my-chart>` typecheck, which is the subject of the next lesson.",
        },
      ],
    },
    {
      id: "props-and-children",
      heading: "Props, children, and why className exists",
      body: [
        "Each JSX attribute becomes one key on the props object. A bare string attribute (`className=\"card\"`) becomes that string; braces (`hidden={false}`) become the expression's value; an attribute with no value (`disabled`) becomes `true`. The spread form `{...rest}` copies an object's own enumerable properties in, and later attributes overwrite earlier ones, which is what makes `<Button {...props} className=\"override\" />` behave the way you'd hope.",
        "Children are whatever sits between the tags, and they arrive as a `children` prop: a single value if there's one child, an array if there are several. That is a genuine inconsistency you will hit when writing code that inspects children, and it's the reason React ships `React.Children` helpers.",
        "The attribute names are React's, not HTML's. `className` and `htmlFor` exist because `class` and `for` are reserved words in JavaScript, and React chose to mirror the DOM property names rather than the HTML attribute names throughout — hence `tabIndex`, `readOnly`, `onClick`. Style is an object with camelCased keys, not a string. TypeScript catches all of these, and the errors suggest the right name.",
      ],
      examples: [
        {
          id: "props-children-example",
          title: "Attributes in, props out",
          ts: `// Props.tsx
type PanelProps = {
  title: string;
  collapsed?: boolean;
  children?: React.ReactNode;
};

function Panel({ title, collapsed = false, children }: PanelProps) {
  return (
    <div style={{ borderWidth: 1, paddingInline: 8 }}>
      <h3>{title}</h3>
      {!collapsed && children}
    </div>
  );
}

const shared = { title: "Spread", collapsed: true };

export function Demo() {
  return (
    <>
      {/* string attribute, expression attribute, bare attribute */}
      <input type="text" maxLength={20} disabled />

      {/* children arrive as the \`children\` prop */}
      <Panel title="With children">
        <p>first</p>
        <p>second</p>
      </Panel>

      {/* spread first, then override — later wins */}
      <Panel {...shared} collapsed={false}>
        <p>overridden</p>
      </Panel>
    </>
  );
}

// HTML's attribute name, not React's
const wrongAttribute = <div class="card">wrong</div>;
// Error: Type '{ children: string; class: string; }' is not assignable to type
//        'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>'.
console.log(wrongAttribute);`,
          explanation:
            "The `class` error is worth triggering once on purpose, because its second line says \"Did you mean 'className'?\" — the compiler recognises the mistake specifically. Note also that `style` takes an object with camelCased properties: `{{ borderWidth: 1 }}` is one pair of braces for JSX and one for the object literal.",
        },
      ],
      pitfalls: [
        {
          title: "A missing key is a runtime warning, not a type error",
          body: "TypeScript will not complain about `{items.map((i) => <li>{i}</li>)}`, because `key` is optional on every element — it only becomes required by convention, enforced by React logging a console warning. The consequence of getting it wrong is worse than the warning suggests: without stable keys React reconciles list children by position, so inserting an item at the front re-renders every row and can move input state to the wrong row. Use a stable id, not the array index, whenever the list can reorder.",
        },
      ],
    },
    {
      id: "jsx-is-just-data",
      heading: "An element is data, not a DOM node",
      body: [
        "The value a JSX expression produces is a plain object — roughly `{ type, props, key }`. It describes what you want; it has not created a DOM node, has not called your component function, and has not touched the page. Creating one is as cheap as creating any small object, which is what makes it reasonable to build a whole tree of them on every render.",
        "Rendering is a separate step performed by a renderer: it walks the tree, calls any function-typed `type` to get *its* elements, keeps walking until everything bottoms out in host elements, and only then produces DOM nodes (or an HTML string, or native views). Nothing about JSX itself requires React — the syntax is a general one, and the runtime is chosen by configuration.",
        "The clearest way to internalise this is to implement the two pieces. Twelve lines of `createElement` plus six lines of a recursive renderer reproduce the essential behaviour, and after writing them the phrase \"JSX compiles to function calls\" stops being something you take on faith.",
      ],
      examples: [
        {
          id: "jsx-as-data-example",
          title: "createElement and a renderer, from scratch",
          js: `// This is what the compiler calls. Nothing here renders anything.
function createElement(type, props, ...children) {
  return { type, props: { ...props, children } };
}

// A "component" is just a function from props to an element
const Badge = ({ label }) => createElement("span", { className: "badge" }, label);

// <div id="card"><Badge label="new" /> and text</div> compiles to exactly this:
const tree = createElement(
  "div",
  { id: "card" },
  createElement(Badge, { label: "new" }),
  " and text"
);

console.log("type of the outer element:", typeof tree.type, "->", tree.type);
console.log("type of the inner element:", typeof tree.props.children[0].type);
console.log("children:", JSON.stringify(tree.props.children[1]));

// The renderer is the part that actually does something. It walks the tree,
// calls every function-typed \`type\`, and bottoms out in host elements.
function render(node) {
  if (typeof node === "string") return node;
  if (typeof node.type === "function") return render(node.type(node.props));
  const inner = node.props.children.map(render).join("");
  return "<" + node.type + ">" + inner + "</" + node.type + ">";
}

console.log(render(tree));`,
          output: `type of the outer element: string -> div
type of the inner element: function
children: " and text"
<div><span>new</span> and text</div>`,
          explanation:
            "The two `typeof` lines are the whole idea: a host element carries a string, a component carries the function itself, and the renderer branches on which. Everything React adds — hooks, reconciliation, keys, concurrent rendering — lives in a much more sophisticated version of that six-line `render`, not in the syntax.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does JSX compile to?",
      answer:
        "Function calls. Under the classic runtime each element becomes React.createElement(type, props, ...children), which is why files using JSX used to need an explicit React import. Under the automatic runtime, default since React 17, the compiler generates its own import from react/jsx-runtime and emits jsx or jsxs — jsxs when there are several static children — with children moved inside the props object and key extracted as a separate third argument. Which one you get is decided by the jsx compiler option, and jsxImportSource redirects the generated import so Preact and others can use the same syntax.",
    },
    {
      question: "Why must components start with a capital letter?",
      answer:
        "Because the compiler decides from the first character alone. A lowercase tag compiles to a string — <div /> becomes a call with \"div\" — and is checked against JSX.IntrinsicElements, the interface listing every HTML and SVG element. Anything else compiles to an identifier reference, so <Widget /> passes the actual function. A dotted tag like <Layout.Row /> works without capitalisation because a member expression is unambiguously a value. The practical consequence is that a component named button can never be used as <button />, because that means the HTML element.",
    },
    {
      question: "Why can't you use an if statement inside JSX braces?",
      answer:
        "Because the braces mark a slot inside a function call's arguments, and only expressions can appear there. JSX compiles to calls, so anything you interpolate has to evaluate to a value — which is why ternaries and && work, and if, for and switch do not. The usual patterns follow from that: a ternary for two branches, && for an optional branch (being careful that the left side is a real boolean, since 0 renders as 0), or moving the logic into a variable or an early return above the JSX.",
    },
    {
      question: "What is a JSX element at runtime?",
      answer:
        "A plain object, roughly { type, props, key }. It is a description, not a DOM node: creating it calls nothing, renders nothing, and touches no page. The type is a string for a host element and the function itself for a component. A renderer then walks the tree, calls every function-typed type to get its elements, recurses until everything bottoms out in host elements, and only then creates DOM nodes. Because elements are cheap objects, rebuilding the whole tree on every render is a reasonable thing to do.",
    },
    {
      question: "Why is key not available in props?",
      answer:
        "The compiler removes it. Under the automatic runtime key is emitted as the third argument to jsx rather than as a key on the props object, so by the time React calls your component the prop is gone — reading props.key gives undefined. React needs it before rendering, for reconciliation: keys tell it which element in a list corresponds to which previous element, and without them children are matched by position, so inserting at the front re-renders everything and can carry input state to the wrong row. If a component needs the value too, pass it again under another name.",
    },
  ],
  takeaways: [
    "JSX is a syntax extension that compiles to function calls; a tag is an expression, which is why only expressions fit inside braces.",
    "The automatic runtime generates its own react/jsx-runtime import, moves children into props, and passes key as a separate argument.",
    "Capitalisation is a compiler rule: lowercase emits a string checked against JSX.IntrinsicElements, anything else emits an identifier.",
    "Attributes become props, with React's DOM-property names — className, htmlFor, onClick — and style as a camelCased object.",
    "An element is a plain { type, props } object that has rendered nothing; a renderer walks the tree afterwards and does the real work.",
  ],
  status: "available",
};
