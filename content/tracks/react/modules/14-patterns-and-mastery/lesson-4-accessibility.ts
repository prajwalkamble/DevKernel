import type { Lesson } from "@/content/types";

export const accessibilityLesson: Lesson = {
  id: "react-accessibility",
  slug: "accessibility",
  moduleSlug: "patterns-and-mastery",
  title: "Accessibility in React",
  summary:
    "The specifically-React parts: why a div with an onClick is unreachable — measured — what tabindex actually does to the tab order, managing focus when a dialog opens, and announcing something that changed without moving the user.",
  estimatedMinutes: 30,
  objectives: [
    "Say what an interactive element must have and use the one that has it",
    "Explain the sequential focus order and why tabindex=1 is a bug",
    "Move focus when a route or a dialog changes",
    "Announce an update with a live region",
    "Label things React makes hard to label",
  ],
  sections: [
    {
      id: "the-div",
      heading: "The div with an onClick",
      body: [
        "The most common accessibility bug in React, and it is a React bug specifically: `onClick` works on any element, so nothing stops you putting it on a `<div>`.",
        "Three things a `<button>` gives you that a `<div>` does not: it is in the tab order, Enter and Space activate it, and it announces itself as a button. All three are missing from the div, and the first one is easy to measure.",
      ],
      examples: [
        {
          id: "focusable",
          title: "Three elements, one of them unreachable",
          lang: "jsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function Both() {
  return (
    <>
      <div onClick={() => {}}>Delete</div>
      <span role="button" tabIndex={0} onClick={() => {}}>Delete</span>
      <button onClick={() => {}}>Delete</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Both />); });

for (const el of container.children) {
  const node = el;
  node.focus();
  console.log(
    \`<\${node.tagName.toLowerCase()}>\`.padEnd(9) +
    \`role=\${(node.getAttribute("role") ?? node.tagName.toLowerCase()).padEnd(7)}\` +
    \` tabIndex=\${String(node.tabIndex).padEnd(3)}\` +
    \` reachable by keyboard=\${document.activeElement === node}\`
  );
}`,
          output: `<div>    role=div     tabIndex=-1  reachable by keyboard=false
<span>   role=button  tabIndex=0   reachable by keyboard=true
<button> role=button  tabIndex=0   reachable by keyboard=true`,
          explanation:
            "The first row is the bug: `focus()` was called on it and it did not take focus, so no amount of tabbing will ever reach it. A keyboard user cannot delete anything.\n\nThe middle row is what it costs to fix a `<div>` properly — a role, a `tabIndex`, and (not shown, because jsdom does not implement activation behaviour) a `keydown` handler for both Enter and Space, with Space also needing `preventDefault` so the page does not scroll. The third row is a `<button>`, which has all of it already. This is why the answer is always \"use the element\".",
          alternates: [
            {
              lang: "tsx",
              code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function Both() {
  return (
    <>
      <div onClick={() => {}}>Delete</div>
      <span role="button" tabIndex={0} onClick={() => {}}>Delete</span>
      <button onClick={() => {}}>Delete</button>
    </>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Both />); });

for (const el of container.children) {
  const node = el as HTMLElement;
  node.focus();
  console.log(
    \`<\${node.tagName.toLowerCase()}>\`.padEnd(9) +
    \`role=\${(node.getAttribute("role") ?? node.tagName.toLowerCase()).padEnd(7)}\` +
    \` tabIndex=\${String(node.tabIndex).padEnd(3)}\` +
    \` reachable by keyboard=\${document.activeElement === node}\`
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The reason people reach for a div is styling, and it is not a reason",
          body: "`button { all: unset }` or a Tailwind reset removes every default style a button has. There is no appearance a div can have that a button cannot, and `<button>` is the only one of the two that works.",
        },
      ],
    },
    {
      id: "focus-order",
      heading: "The tab order, and what tabindex does to it",
      body: [
        "The specification's sequential focus navigation order has a rule most people have never read, and it explains why `tabindex=\"1\"` is never the fix it looks like.",
        "**Everything with a positive `tabindex` comes first**, in ascending numeric order, ahead of the entire rest of the document. Then everything with `tabindex=\"0\"` or native focusability, in document order.",
        "So a single `tabindex=\"1\"` does not move an element up by one. It moves it in front of every other focusable thing on the page.",
      ],
      examples: [
        {
          id: "tabindex-values",
          title: "The two values worth using",
          lang: "jsx",
          code: `/* 0 — put a non-interactive element into the natural order, at its
   position in the document. For a custom control, and always with a
   role and keyboard handlers to match. */
<span role="button" tabIndex={0} onClick={…} onKeyDown={…} />

/* -1 — focusable by script, not by tabbing. This is what you put on the
   thing you are about to move focus *to*: a dialog, a route heading, an
   error summary. The user never tabs to it; you send them there. */
<div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" />

/* Any positive number — reordering the entire page. Do not. Change the
   DOM order instead, which is the thing you actually meant. */
<input tabIndex={1} />`,
          explanation:
            "`tabIndex={-1}` is the one people have not met and the one that matters most, because focus management is impossible without it: you cannot move focus to an element that cannot receive it, and a heading or a dialog container is not focusable by default.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Identical in both languages. \`tabIndex\` is typed \`number\`, so the three
   cases below differ by value rather than by type, and nothing here needs
   annotating — the judgement about which number to use is the lesson. */

/* 0 — put a non-interactive element into the natural order, at its
   position in the document. For a custom control, and always with a
   role and keyboard handlers to match. */
<span role="button" tabIndex={0} onClick={…} onKeyDown={…} />

/* -1 — focusable by script, not by tabbing. This is what you put on the
   thing you are about to move focus *to*: a dialog, a route heading, an
   error summary. The user never tabs to it; you send them there. */
<div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" />

/* Any positive number — reordering the entire page. Do not. Change the
   DOM order instead, which is the thing you actually meant. */
<input tabIndex={1} />`,
            },
          ],
        },
      ],
    },
    {
      id: "focus-management",
      heading: "Moving focus when the screen changes",
      body: [
        "In a multi-page site, following a link moves focus to the top of the new document. In a single-page app, **nothing happens** — the URL changes, the content changes, and focus stays on the link that no longer exists. A screen reader announces nothing, and the next Tab starts from the body.",
        "This is the accessibility bug that is unique to client-side routing, and it is invisible unless you are using a keyboard or a screen reader. Three places need it.",
        "**On navigation** — move focus to the new page's `<h1>`, with `tabIndex={-1}` on it.",
        "**When a dialog opens** — move focus into the dialog, trap it there while it is open, and return it to the trigger on close. This is enough work that a headless library is the honest recommendation, and `<dialog>` with `showModal()` now does most of it natively.",
        "**When content is removed** — deleting a row leaves focus on a button that no longer exists, and focus falls back to the body. Move it somewhere sensible first.",
      ],
      examples: [
        {
          id: "focus-code",
          title: "The two hooks that cover most of it",
          lang: "jsx",
          code: `/* On navigation. The heading is not focusable by default, hence -1. */
function usePageFocus(pathname) {
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [pathname]);
  return heading;
}

function Page({ title }) {
  const heading = usePageFocus(useLocation().pathname);
  return <h1 ref={heading} tabIndex={-1}>{title}</h1>;
}

/* Returning focus to whatever opened a dialog. The ref is captured
   before focus moves, and the cleanup restores it — which also handles
   the case where the dialog is unmounted rather than closed. */
function useReturnFocus(open) {
  const previous = useRef(null);
  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement;
    return () => previous.current?.focus();
  }, [open]);
}`,
          explanation:
            "Both are effects, and both are the legitimate kind: they synchronise something outside React — the document's focus — with React's state. This is what module 7 meant by an effect that is not a data fetch.",
          alternates: [
            {
              lang: "tsx",
              code: `/* On navigation. The heading is not focusable by default, hence -1. */
function usePageFocus(pathname: string) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [pathname]);
  return heading;
}

function Page({ title }: { title: string }) {
  const heading = usePageFocus(useLocation().pathname);
  return <h1 ref={heading} tabIndex={-1}>{title}</h1>;
}

/* Returning focus to whatever opened a dialog. The ref is captured
   before focus moves, and the cleanup restores it — which also handles
   the case where the dialog is unmounted rather than closed. */
function useReturnFocus(open: boolean) {
  const previous = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement;
    return () => previous.current?.focus();
  }, [open]);
}`,
            },
          ],
        },
      ],
    },
    {
      id: "live-regions",
      heading: "Announcing something without moving anyone",
      body: [
        "Focus moves the user. Sometimes you want to tell them something and leave them where they are — a search result count, a *saved* confirmation, a validation error, an item added to a cart.",
        "That is a **live region**: an element a screen reader watches and reads out when its contents change.",
        "**`role=\"status\"`** (or `aria-live=\"polite\"`) waits for a pause. This is what you want almost always.",
        "**`role=\"alert\"`** (or `aria-live=\"assertive\"`) interrupts. For errors and for nothing else.",
        "The rule people get wrong: **the region must be in the DOM before the message is.** A screen reader watches an existing element for changes; an element that appears already containing text often announces nothing.",
      ],
      examples: [
        {
          id: "live",
          title: "The container is always there; only the text changes",
          lang: "jsx",
          code: `/* ✗ Nothing to watch until the message exists, and by then it is too
   late for many screen readers. */
{message && <p role="status">{message}</p>}

/* ✓ The region is always mounted and usually empty. */
<p role="status" className="sr-only">{message}</p>

/* A search result count — announced, and the user stays in the input. */
function Results({ query, items }) {
  return (
    <>
      <p role="status" className="sr-only">
        {query ? \`\${items.length} results for \${query}\` : ""}
      </p>
      <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
    </>
  );
}`,
          explanation:
            "`sr-only` is the standard class that hides an element visually while leaving it in the accessibility tree — a clip rectangle rather than `display: none`, because `display: none` removes it from the tree as well and announces nothing. Tailwind ships it; every design system has its own.",
          alternates: [
            {
              lang: "tsx",
              code: `/* ✗ Nothing to watch until the message exists, and by then it is too
   late for many screen readers. */
{message && <p role="status">{message}</p>}

/* ✓ The region is always mounted and usually empty. */
<p role="status" className="sr-only">{message}</p>

/* A search result count — announced, and the user stays in the input. */
function Results({ query, items }: { query: string; items: Item[] }) {
  return (
    <>
      <p role="status" className="sr-only">
        {query ? \`\${items.length} results for \${query}\` : ""}
      </p>
      <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
    </>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "labelling",
      heading: "Labelling, and the id problem React created",
      body: [
        "Every form control needs a label, and `<label htmlFor={id}>` needs an id that is unique in the document. A component rendered twice on one page with a hard-coded id produces two elements with the same id, and the label points at whichever the browser found first.",
        "`useId` from module 10 is the answer, and this is the problem it was added for.",
        "The other labelling cases: an icon-only button needs `aria-label`; an input with visible helper text or an error should point at it with `aria-describedby`; and `aria-labelledby` beats `aria-label` whenever there is already visible text to point at, because a visible label is also a label for the people who can see it.",
      ],
      examples: [
        {
          id: "labels",
          title: "Four labelling cases",
          lang: "jsx",
          code: `function Field({ label, error, ...rest }) {
  /* Unique per instance, stable across renders, and identical on the
     server and after hydration — which a counter or a random id is not. */
  const id = useId();
  const errorId = \`\${id}-error\`;

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {/* Always mounted, so the error is announced when it appears. */}
      <p id={errorId} role="alert">{error}</p>
    </>
  );
}

/* An icon-only button: the icon is decorative, the button needs a name. */
<button aria-label="Close" onClick={close}>
  <XIcon aria-hidden="true" />
</button>

/* Visible text already exists, so point at it rather than duplicating it. */
<section aria-labelledby="billing-heading">
  <h2 id="billing-heading">Billing</h2>
</section>`,
          explanation:
            "`aria-hidden` on the icon matters: without it a screen reader may read the SVG's title as well as the `aria-label`, and the button announces itself twice. Decorative graphics inside a labelled control should always be hidden from the tree.",
          alternates: [
            {
              lang: "tsx",
              code: `function Field({ label, error, ...rest }: FieldProps) {
  /* Unique per instance, stable across renders, and identical on the
     server and after hydration — which a counter or a random id is not. */
  const id = useId();
  const errorId = \`\${id}-error\`;

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {/* Always mounted, so the error is announced when it appears. */}
      <p id={errorId} role="alert">{error}</p>
    </>
  );
}

/* An icon-only button: the icon is decorative, the button needs a name. */
<button aria-label="Close" onClick={close}>
  <XIcon aria-hidden="true" />
</button>

/* Visible text already exists, so point at it rather than duplicating it. */
<section aria-labelledby="billing-heading">
  <h2 id="billing-heading">Billing</h2>
</section>`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The cheapest tooling wins here",
          body: "`eslint-plugin-jsx-a11y` catches the div-with-onClick, the missing alt, the label pointing at nothing — statically, for free. `axe-devtools` in the browser catches contrast, ARIA misuse and structure. Neither replaces tabbing through the page yourself, which takes thirty seconds and finds things no tool does.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is wrong with a div that has an onClick?",
      answer:
        "Three things a button has and it does not: it is not in the tab order, so a keyboard user can never reach it; Enter and Space do not activate it; and it announces itself as a generic container rather than as a button. Fixing it properly takes a `role`, a `tabIndex={0}`, and a keydown handler for both keys with `preventDefault` on Space — at which point you have reimplemented `<button>`, which needs no styling concession since `all: unset` removes every default.",
    },
    {
      question: "Why is a positive tabindex a bug?",
      answer:
        "Because sequential focus navigation puts every element with a positive tabindex first, in ascending order, ahead of the whole document — then everything else in document order. So `tabindex=\"1\"` does not move an element up by one, it moves it in front of every other focusable thing on the page, and a second one starts an ordering nobody can maintain. The two values worth using are 0, to add a custom control to the natural order, and -1, to make something focusable by script only.",
    },
    {
      question: "What does a single-page app break about focus?",
      answer:
        "Navigation. Following a link in a multi-page site moves focus to the new document; a client-side route change moves nothing, so focus stays on a link that no longer exists, a screen reader announces nothing, and the next Tab starts from the body. The fix is to move focus to the new page's heading, with `tabIndex={-1}` on it because a heading is not focusable by default. The same applies when a dialog opens and when focused content is deleted.",
    },
    {
      question: "How do you announce something without moving focus?",
      answer:
        "A live region: `role=\"status\"` for anything that can wait for a pause, `role=\"alert\"` for errors, which interrupt. The mistake is conditionally rendering the region — a screen reader watches an existing element for changes, so one that appears already containing text often announces nothing. Keep the container mounted and change its text.",
    },
    {
      question: "Why does React need useId for labels?",
      answer:
        "Because `<label htmlFor>` needs an id unique in the document, and a component rendered twice on one page with a hard-coded id produces two elements sharing it — the label then points at whichever the browser found first. `useId` gives a value that is unique per instance, stable across renders, and identical on the server and after hydration, which a counter or a random value is not.",
    },
  ],
  takeaways: [
    "A div with `onClick` is not in the tab order and cannot be reached — measurably",
    "Fixing one properly means reimplementing `<button>`, which has no styling penalty",
    "A positive `tabindex` jumps the element ahead of the entire document",
    "`tabIndex={0}` adds to the natural order; `tabIndex={-1}` allows scripted focus",
    "Client-side routing moves no focus — send it to the new page's heading",
    "Capture the active element before opening a dialog and restore it on close",
    "A live region must be mounted before its message arrives",
    "`role=\"status\"` for almost everything, `role=\"alert\"` only for errors",
    "`useId` for label ids; `aria-labelledby` when visible text already exists",
    "`aria-hidden` on a decorative icon inside a labelled button, or it is read twice",
  ],
  status: "available",
};
