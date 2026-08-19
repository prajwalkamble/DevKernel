import type { Lesson } from "@/content/types";

export const typingTheDomLesson: Lesson = {
  id: "dom-typing",
  slug: "typing-the-dom",
  moduleSlug: "dom-browser",
  title: "Typing the DOM in TypeScript",
  summary:
    "Why every DOM query starts as possibly-null and too general, the four ways to narrow it, and how to type event handlers — including the target/currentTarget distinction that TypeScript models more strictly than people expect.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why querySelector returns `Element | null`",
    "Narrow a query result with a generic, a guard or an assertion, and choose between them",
    "Type event handlers, and know when the event type is inferred",
    "Explain why `event.target` is typed as `EventTarget | null`",
    "Type custom events and dataset access",
    "Know where the DOM types live and how to read them",
  ],
  sections: [
    {
      id: "two-problems",
      heading: "Two problems with every query",
      body: [
        "`document.querySelector(\".item\")` has a return type of `Element | null`, and both halves of that are inconvenient in a different way.",
        "**It might be null.** TypeScript cannot know whether the selector matches anything — that depends on HTML it has never seen. Under `strictNullChecks` this is an error at the first use, and it is the correct error: this really is the most common runtime crash in DOM code.",
        "**`Element` is too general.** `Element` is the base of the hierarchy and has no `value`, no `href`, no `checked`. Those live on `HTMLInputElement`, `HTMLAnchorElement` and so on. So even after you have handled null, most of what you want to do is still not allowed.",
      ],
      examples: [
        {
          id: "dom-errors",
          title: "The errors, verbatim",
          ts: `const el = document.querySelector(".item");
el.textContent = "x";
// Error: 'el' is possibly 'null'. (TS18047)

const input = document.querySelector("#name");
console.log(input.value);
// Error: 'input' is possibly 'null'. (TS18047)
// Error: Property 'value' does not exist on type 'Element'. (TS2339)`,
          output: `a.ts(2,1): error TS18047: 'el' is possibly 'null'.
a.ts(5,13): error TS18047: 'input' is possibly 'null'.
a.ts(5,19): error TS2339: Property 'value' does not exist on type 'Element'.`,
          explanation:
            "Both problems on one line, reported separately. Notice that TypeScript does not attempt to parse your selector to work out the element type — `querySelector(\"#name\")` tells it nothing, because an id could belong to any tag.",
        },
      ],
    },
    {
      id: "narrowing",
      heading: "Four ways to fix it, in order of preference",
      body: [
        "**1. Let the tag name infer it.** `querySelector` is overloaded: passing a known HTML tag name returns the right type automatically. `document.querySelector(\"input\")` really is `HTMLInputElement | null` with no annotation at all. This only works for a bare tag name, which is why it is rarely enough on its own.",
        "**2. Pass a type argument.** `querySelector<HTMLInputElement>(\"#name\")` is the everyday answer. It is still an assertion — nothing checks it at runtime — but it is concise and it keeps the null.",
        "**3. Narrow with `instanceof`.** The only option that is actually *checked*. Use it at boundaries where being wrong would be expensive, and in event handlers, where it also narrows the null away.",
        "**4. Assert with `!` or `as`.** `querySelector(\"#app\")!` claims non-null. Reasonable for an element you control that is guaranteed to be in the HTML; a lie waiting to happen anywhere else.",
      ],
      examples: [
        {
          id: "narrowing-options",
          title: "The same query, four ways",
          ts: `// 1. Inferred from the tag name — no annotation needed.
const firstInput = document.querySelector("input");
//    ^? HTMLInputElement | null

// 2. Explicit type argument. Concise, and still nullable.
const nameField = document.querySelector<HTMLInputElement>("#name");
if (nameField) console.log(nameField.value);

// 3. instanceof — the only one that is genuinely checked at runtime.
const maybe = document.querySelector("#name");
if (maybe instanceof HTMLInputElement) {
  console.log(maybe.value);   // narrowed, and true
}

// 4. Non-null assertion. Fine for something you know is in your own HTML.
const root = document.querySelector<HTMLDivElement>("#app")!;
root.append("ready");

// A helper worth having, so the failure is loud and immediate rather than
// a null dereference three functions later.
function must<T extends Element>(selector: string, root: ParentNode = document): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(\`No element matches \${selector}\`);
  return found;
}

const form = must<HTMLFormElement>("#signup");`,
          explanation:
            "The `must` helper is worth adopting. `!` silently produces `undefined` at runtime and the failure surfaces somewhere unrelated; a thrown error names the selector that was missing, which is usually the entire debugging session.",
        },
      ],
      pitfalls: [
        {
          title: "A type argument is a claim, not a check",
          body: "`querySelector<HTMLInputElement>(\"#name\")` compiles happily even if `#name` is a `<div>`. TypeScript trusts you and the runtime does not care until you read `.value` and get `undefined`. Where correctness matters — parsing user input, integrating with markup you do not own — use `instanceof`, which is the only form the runtime participates in.",
        },
      ],
    },
    {
      id: "collections",
      heading: "Typing collections",
      body: [
        "`querySelectorAll` takes the same type argument and returns `NodeListOf<T>`. Because a `NodeList` has no `map` or `filter`, converting to an array is normal — and the element type survives the conversion.",
      ],
      examples: [
        {
          id: "typing-collections",
          title: "Lists, and keeping the element type",
          ts: `const inputs = document.querySelectorAll<HTMLInputElement>("input[name]");
//    ^? NodeListOf<HTMLInputElement>

// forEach exists and the parameter is typed.
inputs.forEach((input) => console.log(input.name, input.value));

// Spreading keeps the type: HTMLInputElement[]
const values = [...inputs].map((input) => input.value);

// Filtering with a type guard narrows a mixed list.
const controls = document.querySelectorAll(".control");
const checkboxes = [...controls].filter(
  (el): el is HTMLInputElement => el instanceof HTMLInputElement && el.type === "checkbox"
);
//    ^? HTMLInputElement[]

const checked = checkboxes.filter((box) => box.checked).map((box) => box.value);`,
          explanation:
            "The `(el): el is HTMLInputElement =>` annotation is a **type predicate**, and it is what makes `filter` narrow the array type. Without it the result stays `Element[]` no matter what the callback checks — `filter` cannot otherwise know that the boolean it received says anything about the type.",
        },
      ],
    },
    {
      id: "events",
      heading: "Typing events",
      body: [
        "`addEventListener` is heavily overloaded against a map of event names to event types, so **for a known event name on a known element the event parameter is inferred correctly with no annotation**. `\"click\"` gives you `MouseEvent`, `\"keydown\"` gives `KeyboardEvent`, `\"input\"` gives `Event`.",
        "That inference is why you should prefer `addEventListener` over assigning to `onclick`, and why an extracted handler function needs the annotation that an inline one does not.",
      ],
      examples: [
        {
          id: "event-inference",
          title: "Inferred inline, annotated when extracted",
          ts: `// Inferred: no annotation needed.
document.addEventListener("click", (event) => {
  console.log(event.clientX, event.clientY);   // MouseEvent
});

button.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submit();         // KeyboardEvent
});

// Extracted: the inference is gone, so say what it is.
function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}
document.addEventListener("keydown", onKeyDown);

// The event types you will actually reach for:
//   MouseEvent  PointerEvent  KeyboardEvent  InputEvent
//   FocusEvent  SubmitEvent   DragEvent      WheelEvent
//   ClipboardEvent  TouchEvent  AnimationEvent  TransitionEvent`,
          explanation:
            "One asymmetry worth knowing: `element.onclick = (event) => …` also infers, but assigning a handler that way replaces any previous one. Prefer `addEventListener` for the behaviour, and enjoy the identical inference.",
        },
        {
          id: "target-typing",
          title: "target is EventTarget, and that is deliberate",
          ts: `form.addEventListener("submit", (event) => {
  event.preventDefault();
  const t = event.target;
  console.log(t.elements);
  // Error: 't' is possibly 'null'. (TS18047)
  // Error: Property 'elements' does not exist on type 'EventTarget'. (TS2339)
});`,
          output: `a.ts(18,15): error TS18047: 't' is possibly 'null'.
a.ts(18,17): error TS2339: Property 'elements' does not exist on type 'EventTarget'.`,
          explanation:
            "This is not TypeScript being awkward — it is correct. With delegation, `target` is *whatever was clicked*, which could be any element in the subtree, so nothing more specific can be guaranteed. `EventTarget` is also not necessarily an element at all: `window`, `document` and `XMLHttpRequest` are all event targets.",
        },
        {
          id: "target-solutions",
          title: "Handling target and currentTarget properly",
          ts: `// currentTarget IS known — it is the element you attached to — but it is
// typed as EventTarget on the generic Event. Inside addEventListener on a
// specific element, TypeScript narrows it for you:
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);   // HTMLFormElement, inferred
  console.log(Object.fromEntries(data));
});

// For target, narrow with instanceof — the runtime check you needed anyway.
list.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLElement)) return;

  const item = event.target.closest<HTMLLIElement>("li[data-id]");
  if (!item) return;

  console.log(item.dataset.id);   // string | undefined
});

// An extracted handler can declare the pairing it needs:
function onInput(event: Event & { currentTarget: HTMLInputElement }) {
  console.log(event.currentTarget.value);
}`,
          explanation:
            "The rule: **`currentTarget` is what you attached to and is usually already typed; `target` is whatever was clicked and needs an `instanceof` guard.** That guard is not TypeScript ceremony — with delegation, `target` genuinely can be a text node's parent, an SVG element inside a button, or anything else the markup contains.",
        },
      ],
      pitfalls: [
        {
          title: "`dataset` values are always `string | undefined`",
          body: "`item.dataset.id` is typed `string | undefined` no matter what the markup contains, because TypeScript cannot see your HTML. There is no way to make it narrower without asserting, and asserting is usually wrong — a missing attribute really does produce `undefined`. Convert explicitly (`Number(item.dataset.id)`) and handle the missing case.",
        },
      ],
    },
    {
      id: "custom-events",
      heading: "Typing custom events",
      body: [
        "A `CustomEvent` is generic in its `detail`, so `CustomEvent<{ sku: string }>` types the payload. Getting a *listener* to see that type requires telling TypeScript that the event name exists, which is done by augmenting the global event map.",
      ],
      examples: [
        {
          id: "custom-event-typing",
          title: "Declaring an application event",
          ts: `interface CartAddDetail {
  sku: string;
  qty: number;
}

// Augment the map addEventListener is overloaded against.
declare global {
  interface DocumentEventMap {
    "cart:add": CustomEvent<CartAddDetail>;
  }
}

// Now the listener's parameter is inferred, with a typed detail.
document.addEventListener("cart:add", (event) => {
  console.log(event.detail.sku, event.detail.qty);
  //          ^? CartAddDetail
});

document.dispatchEvent(
  new CustomEvent<CartAddDetail>("cart:add", {
    detail: { sku: "A1", qty: 2 },
    bubbles: true,
  })
);

export {};   // makes this file a module, which \`declare global\` requires`,
          explanation:
            "`HTMLElementEventMap` and `WindowEventMap` are the equivalents for elements and `window`. The `export {}` at the bottom matters: `declare global` is only legal inside a module, and a file with no imports or exports is a script. Forgetting it produces a confusing error about augmentations in a non-module file.",
        },
      ],
    },
    {
      id: "lib-dom",
      heading: "Where the types come from",
      body: [
        "All of this lives in **`lib.dom.d.ts`**, which ships with TypeScript. It is included whenever `\"dom\"` is in your `lib` setting — which it is by default when `target` is a browser-ish one, and which you must add explicitly if you set `lib` yourself.",
        "Two practical consequences. In a **Node** project, `document` is correctly an error, and adding `\"dom\"` just to silence it is how server code ends up calling browser APIs that do not exist. And the file is readable: ctrl-clicking `HTMLInputElement` in your editor takes you to the exact interface, which is usually faster than searching for documentation.",
        "For Node globals you want `@types/node`; for a project that is genuinely both, split the `tsconfig` rather than merging the libs.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does querySelector return `Element | null` rather than something specific?",
      answer:
        "Null because TypeScript cannot know whether the selector matches anything — that depends on HTML it never sees. `Element` because a CSS selector does not determine a tag: `#name` could be an input, a div or anything else. The exception is a bare tag name, where an overload does infer the specific type.",
    },
    {
      question: "What are the ways to narrow a DOM query, and which is safest?",
      answer:
        "A type argument (`querySelector<HTMLInputElement>`), an `instanceof` guard, or a non-null assertion. `instanceof` is the only one checked at runtime — the other two are claims TypeScript trusts. Use the type argument for everyday code against your own markup, and `instanceof` at boundaries where being wrong matters.",
    },
    {
      question: "Why is `event.target` typed as `EventTarget | null` when `currentTarget` is often specific?",
      answer:
        "`currentTarget` is the element you attached the listener to, so its type is known from the `addEventListener` call. `target` is whatever the event originated on, which with delegation can be any descendant — or not an element at all, since `window` and `XMLHttpRequest` are event targets too. Narrow it with `instanceof HTMLElement`, which is the runtime check delegation needs regardless.",
    },
    {
      question: "How do you get a typed `detail` on a custom event listener?",
      answer:
        "Augment the relevant event map — `DocumentEventMap`, `HTMLElementEventMap` or `WindowEventMap` — inside a `declare global` block, mapping your event name to `CustomEvent<YourDetail>`. `addEventListener` is overloaded against those maps, so the listener parameter is then inferred. The file must be a module, so it needs an `export {}` if it has no other imports or exports.",
    },
  ],
  takeaways: [
    "Every query is `Element | null`: possibly missing, and too general to be useful",
    "A bare tag name infers the right type; anything else needs a type argument, a guard or an assertion",
    "A type argument is an unchecked claim — `instanceof` is the only narrowing the runtime participates in",
    "A `must()` helper that throws beats `!`, because the error names the selector instead of surfacing later as undefined",
    "`filter` only narrows an array when the callback is a type predicate (`(el): el is T =>`)",
    "Event parameters are inferred for known event names, and need annotating once the handler is extracted",
    "`currentTarget` is what you attached to; `target` is whatever was hit and needs an `instanceof` guard",
    "`dataset` values are always `string | undefined` — convert and handle the missing case",
    "The DOM types are `lib.dom.d.ts`; adding `\"dom\"` to a Node project's lib to silence an error hides a real bug",
  ],
  status: "available",
};
