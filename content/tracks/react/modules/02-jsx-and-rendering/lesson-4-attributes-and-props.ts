import type { Lesson } from "@/content/types";

export const attributesAndPropsLesson: Lesson = {
  id: "react-attributes-and-props",
  slug: "attributes-and-props",
  moduleSlug: "jsx-and-rendering",
  title: "Attributes, Props & the DOM Naming Rules",
  summary:
    "Why `className` and `htmlFor` exist, how booleans and the `style` object are translated, which names keep their dashes, and the single rule that decides whether any naming convention applies at all.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why `class` and `for` had to be renamed and why nothing else did",
    "Predict how a boolean, a number and a string attribute are emitted",
    "Write a `style` object, and say when React adds `px` and when it does not",
    "Know which names keep their dashes and why",
    "State the rule that makes all of this irrelevant for your own components",
  ],
  sections: [
    {
      id: "one-rule",
      heading: "The rule that decides whether any of this matters",
      body: [
        "There is exactly one question: **is the tag a DOM element or a component?**",
        "For a DOM element — lowercase, so the compiler passed a string — React has to turn your props into real HTML, and the naming rules in this lesson apply. For a component, props are handed to your function untouched. `<Widget className=\"x\" htmlFor=\"y\" whateverYouLike={1} />` passes three ordinary values; nothing is translated, nothing is validated, nothing is dropped.",
        "So the rules here are not \"React's prop conventions\". They are the DOM's naming, surfaced through JSX. Every one of them has a cause in the platform rather than in React.",
      ],
    },
    {
      id: "naming",
      heading: "The names that change, and why",
      body: [
        "**`class` becomes `className` and `for` becomes `htmlFor`** because `class` and `for` are reserved words in JavaScript. These two are the whole list of renames, and they exist for a JavaScript reason rather than a React one.",
        "**Everything else is the DOM property name**, which is camelCase: `tabIndex`, `readOnly`, `maxLength`, `onClick`, `colSpan`. React writes the corresponding attribute out in whatever form HTML wants — `tabIndex` in your JSX becomes `tabindex` in the markup.",
        "**`data-*` and `aria-*` keep their dashes.** They are genuine attributes rather than properties — the DOM exposes them through `dataset` and `getAttribute`, not as camelCase members — so there is nothing to convert them to.",
      ],
      examples: [
        {
          id: "attribute-naming",
          title: "What each form becomes in the markup",
          lang: "jsx",
          code: `function Naming() {
  return (
    <div>
      {/* The two renames, both forced by JavaScript's reserved words. */}
      <label className="lbl" htmlFor="email">Email</label>

      {/* camelCase in, lowercase attribute out. */}
      <input id="email" type="email" tabIndex={-1} />

      {/* Booleans: false removes the attribute, true writes it empty. */}
      <button type="button" disabled={false}>A</button>
      <button type="button" disabled={true}>B</button>

      {/* An object, camelCase keys, and \`px\` added only where it applies. */}
      <p style={{ marginTop: 8, lineHeight: 2, zIndex: 3, width: "50%" }}>styled</p>

      {/* Dashed names pass through unchanged. */}
      <div data-testid="box" aria-live="polite" aria-hidden="true" />

      {/* The deliberately unpleasant name for injecting raw HTML. */}
      <div dangerouslySetInnerHTML={{ __html: "<b>raw</b>" }} />
    </div>
  );
}`,
          output: `<div><label class="lbl" for="email">Email</label><input id="email" type="email" tabindex="-1"/><button type="button">A</button><button type="button" disabled="">B</button><p style="margin-top:8px;line-height:2;z-index:3;width:50%">styled</p><div data-testid="box" aria-live="polite" aria-hidden="true"></div><div><b>raw</b></div></div>`,
          explanation:
            "Four things to read off that line. `className`/`htmlFor` came out as `class`/`for`. `disabled={false}` produced **no attribute at all**, which is the correct HTML — a `disabled=\"false\"` attribute would still disable the button. `marginTop: 8` gained a `px` while `lineHeight: 2` and `zIndex: 3` did not. And the `data-` and `aria-` names are untouched.",
        },
      ],
      pitfalls: [
        {
          title: "`disabled=\"false\"` as a string disables the element",
          body: "In HTML a boolean attribute is on whenever it is *present*, whatever its value — so `disabled=\"false\"` is disabled. Write `disabled={false}` in braces and React removes the attribute entirely. This bites hardest when a value arrives from an API as the string `\"false\"`: `disabled={flag}` with `flag === \"false\"` is truthy, and the button is dead. Coerce at the boundary, not in the JSX.",
        },
      ],
    },
    {
      id: "style",
      heading: "The `style` object",
      body: [
        "`style` takes an object, not a string, and its keys are the camelCase CSS property names — the same ones the DOM's `element.style` uses. The double braces in `style={{ … }}` are not special syntax: the outer pair embeds an expression and the inner pair is an object literal.",
        "**A number gets `px` appended**, which is convenient for the majority of properties and wrong for the minority. React knows the unitless ones — `lineHeight`, `zIndex`, `opacity`, `flexGrow`, `fontWeight`, `order` and a few dozen more — and leaves those bare. For any other unit, pass a string: `width: \"50%\"`, `margin: \"1rem\"`.",
        "Custom properties are the exception to the camelCase rule: they keep their dashes, because `--brand-color` is their actual name.",
      ],
      examples: [
        {
          id: "style-object",
          title: "Numbers, strings and custom properties",
          lang: "jsx",
          code: `const theme = { accent: "crimson" };

function Styled() {
  return (
    <div
      style={{
        // Number on a length property: React appends px.
        padding: 12,
        // Number on a unitless property: left alone.
        opacity: 0.5,
        flexGrow: 2,
        // Any other unit has to be a string.
        width: "50%",
        marginBlock: "1rem",
        // Custom properties keep their dashes and take strings.
        "--brand": theme.accent,
      }}
    >
      content
    </div>
  );
}`,
          output: `<div style="padding:12px;opacity:0.5;flex-grow:2;width:50%;margin-block:1rem;--brand:crimson">content</div>`,
          explanation:
            "`padding: 12` became `12px`; `opacity` and `flexGrow` stayed bare. Note that inline styles cannot express a media query, a pseudo-class or a hover state — they are a single element's declarations and nothing more. Anything conditional beyond that belongs in a class you toggle.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { CSSProperties } from "react";

const theme = { accent: "crimson" };

function Styled() {
  return (
    <div
      style={{
        // Number on a length property: React appends px.
        padding: 12,
        // Number on a unitless property: left alone.
        opacity: 0.5,
        flexGrow: 2,
        // Any other unit has to be a string.
        width: "50%",
        marginBlock: "1rem",
        // Custom properties keep their dashes and take strings. \`CSSProperties\`
        // has no index signature, so this one needs the assertion — the single
        // most common piece of friction in a typed style object.
        "--brand": theme.accent,
      } as CSSProperties}
    >
      content
    </div>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A style object literal is a new object on every render",
          body: "`style={{ margin: 8 }}` allocates a fresh object each time the component runs. For a DOM element that is harmless — React compares the individual declarations, not the object identity. It stops being harmless when the object is passed to a memoised **component**, where a new reference defeats the memoisation every render. Hoist the object to module scope when it is constant, which is most of the time.",
        },
      ],
    },
    {
      id: "unknown-props",
      heading: "Props React does not recognise",
      body: [
        "React used to drop attributes it did not know about. Since React 19 it passes them through to the DOM instead, which is what makes custom elements and one-off attributes work without a wrapper.",
        "There is still a warning, and it is worth understanding rather than silencing. A **camelCase** unknown name produces `React does not recognize the … prop on a DOM element`, because camelCase is how React spells *properties* — so an unrecognised one is far more likely to be a typo or a prop that leaked down from a parent than a deliberate attribute. An all-lowercase or dashed name is assumed to be intentional and passes silently.",
        "This is the practical consequence of spreading props onto a DOM node: `<div {...rest} />` where `rest` still contains your component's own `isActive` will now put `isActive` in the HTML and warn about it. Destructure your own props out before spreading the remainder.",
      ],
      examples: [
        {
          id: "leaked-prop",
          title: "Taking your own props out of the spread",
          lang: "jsx",
          code: `// Destructure what is yours; spread only what is left.
function Row({ isActive, children, ...rest }) {
  return (
    <div className={isActive ? "row on" : "row"} {...rest}>
      {children}
    </div>
  );
}

function App() {
  return (
    <Row isActive id="r1" data-testid="row" title="A row">
      body
    </Row>
  );
}`,
          output: `<div class="row on" id="r1" data-testid="row" title="A row">body</div>`,
          explanation:
            "`isActive` was consumed by the component and never reached the DOM; `id`, `data-testid` and `title` passed straight through. This pattern — name your own props, spread the rest — is how nearly every component library forwards arbitrary DOM attributes without knowing what they are.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ComponentPropsWithoutRef } from "react";

// Everything a \`<div>\` accepts, plus the one prop that is ours. Typing it this
// way is what makes the spread below safe: \`rest\` is exactly the div props.
type RowProps = ComponentPropsWithoutRef<"div"> & { isActive?: boolean };

// Destructure what is yours; spread only what is left.
function Row({ isActive, children, ...rest }: RowProps) {
  return (
    <div className={isActive ? "row on" : "row"} {...rest}>
      {children}
    </div>
  );
}

function App() {
  return (
    <Row isActive id="r1" data-testid="row" title="A row">
      body
    </Row>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`dangerouslySetInnerHTML` is named to make you hesitate",
          body: "It takes `{ __html: string }` rather than a plain string, and both the prop name and the key are deliberately awkward, because the content bypasses every escape React normally does. Any user-controlled string reaching it is a cross-site scripting hole. If you must render HTML you did not write — a CMS field, a Markdown render — sanitise it with a real sanitiser first, and keep the sanitising at the boundary where the content enters rather than at the component that displays it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is it `className` and not `class`?",
      answer:
        "Because `class` is a reserved word in JavaScript, and JSX attributes compile to keys in an object literal. `htmlFor` exists for the same reason — `for` is also reserved. They are the only two renames; every other attribute uses the DOM property name, which is camelCase, and React writes out whatever attribute HTML actually wants. None of it applies to your own components, whose props are passed through untranslated.",
      },
    {
      question: "How does React decide whether to add `px` to a style value?",
      answer:
        "It appends `px` to a number on any property that takes a length, and leaves numbers alone on the properties that are genuinely unitless — `lineHeight`, `opacity`, `zIndex`, `flexGrow`, `fontWeight` and similar. React carries the list of unitless properties internally. Any other unit has to be given as a string, such as `width: \"50%\"` or `margin: \"1rem\"`, and CSS custom properties keep their dashes and take strings.",
    },
    {
      question: "What happens when you spread props onto a DOM element and one of them is your own?",
      answer:
        "Since React 19 the unrecognised prop is passed through into the HTML rather than dropped, and React warns — specifically for camelCase names, which are assumed to be typos or leaked props, while lowercase and dashed names pass silently. The fix is to destructure your component's own props out of the object and spread only the remainder, which is how component libraries forward arbitrary DOM attributes safely.",
    },
  ],
  takeaways: [
    "Naming rules apply only to DOM elements; props on your own components are passed through untouched",
    "`className` and `htmlFor` are the only renames, and both exist because `class` and `for` are reserved words",
    "A `false` boolean removes the attribute entirely, which is what HTML requires — a present attribute is on whatever its value",
    "`style` takes an object of camelCase properties; numbers gain `px` except on the unitless properties, and custom properties keep their dashes",
    "`data-*` and `aria-*` keep their dashes because they are attributes rather than properties",
    "React 19 passes unknown props through to the DOM and warns on camelCase ones — destructure your own props before spreading the rest",
  ],
  status: "available",
};
