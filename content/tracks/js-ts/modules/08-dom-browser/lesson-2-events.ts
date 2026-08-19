import type { Lesson } from "@/content/types";

export const eventsLesson: Lesson = {
  id: "dom-events",
  slug: "events-and-delegation",
  moduleSlug: "dom-browser",
  title: "Events, Delegation & Custom Events",
  summary:
    "How an event travels through the DOM, the difference between target and currentTarget that delegation depends on, and the listener options that replace most manual cleanup code.",
  estimatedMinutes: 35,
  objectives: [
    "Describe the three phases an event passes through",
    "Explain the difference between target and currentTarget",
    "Use event delegation, and know when it is the right tool",
    "Distinguish preventDefault from stopPropagation",
    "Remove listeners correctly, including with an AbortSignal",
    "Dispatch and listen for custom events with a payload",
  ],
  sections: [
    {
      id: "listening",
      heading: "addEventListener, and why it is the only option worth using",
      body: [
        "There are three ways to attach a handler and only one you should write.",
        "`onclick=\"…\"` **in HTML** mixes behaviour into markup and is blocked by any reasonable Content Security Policy. `element.onclick = fn` **as a property** works, but there is exactly one slot — assigning a second handler silently replaces the first.",
        "**`addEventListener`** allows any number of handlers, supports the capture phase, takes an options object, and can be removed precisely. Use it.",
        "The third argument is the interesting one. Passing `true` means \"listen during the capture phase\"; passing an object unlocks `once`, `passive` and `signal`.",
      ],
      examples: [
        {
          id: "listener-options",
          title: "The options worth knowing",
          js: `const button = document.querySelector("#btn");

// Fires at most once, then removes itself. No cleanup code needed.
button.addEventListener("click", handleFirstClick, { once: true });

// Promises never to call preventDefault, so the browser can scroll without
// waiting for the handler. Required in practice for touch and wheel handlers.
window.addEventListener("wheel", onWheel, { passive: true });

// Listen during the capture phase instead of the bubble phase.
document.addEventListener("focus", onAnyFocus, { capture: true });

// Tie the listener's lifetime to an AbortController.
const controller = new AbortController();
button.addEventListener("click", onClick, { signal: controller.signal });
window.addEventListener("resize", onResize, { signal: controller.signal });

controller.abort();   // removes BOTH listeners, in one call`,
          explanation:
            "`signal` is the most useful of the four and the least known. One `abort()` detaches every listener registered with that signal, which turns component cleanup from a list of matched `removeEventListener` calls into a single line — and it is impossible to get out of sync, because there is nothing to keep in sync.",
        },
      ],
      pitfalls: [
        {
          title: "`removeEventListener` needs the identical function reference",
          body: "`addEventListener(\"click\", () => doThing())` followed by `removeEventListener(\"click\", () => doThing())` removes nothing: two arrow functions with the same body are two different objects. Keep a reference in a variable, or use an `AbortSignal` and stop thinking about it. The same applies to a bound method — `fn.bind(this)` returns a new function every call.",
        },
      ],
    },
    {
      id: "phases",
      heading: "The three phases, and target against currentTarget",
      body: [
        "An event does not simply fire on the element you clicked. It makes a round trip.",
        "**Capture**: the event travels down from `window` through every ancestor to the target, firing any listener registered with `capture: true`.",
        "**Target**: listeners on the element itself fire.",
        "**Bubble**: the event travels back up through the ancestors, firing normal listeners. Most events bubble; a few — `focus`, `blur`, `load` — do not, which is why their bubbling counterparts `focusin` and `focusout` exist.",
        "Two properties describe where you are in that journey, and confusing them is the classic delegation bug. **`event.target`** is the element the event originated on and never changes. **`event.currentTarget`** is the element whose listener is running right now.",
      ],
      examples: [
        {
          id: "phase-order",
          title: "Clicking a span inside a button inside a div",
          js: `// <div id="outer"><button id="btn"><span id="label">Click</span></button></div>

outer.addEventListener("click", (e) =>
  console.log(\`outer  capture=false target=#\${e.target.id} currentTarget=#\${e.currentTarget.id}\`));

outer.addEventListener("click", (e) =>
  console.log(\`outer  capture=true  target=#\${e.target.id} currentTarget=#\${e.currentTarget.id}\`), true);

btn.addEventListener("click", (e) =>
  console.log(\`btn    capture=false target=#\${e.target.id} currentTarget=#\${e.currentTarget.id}\`));

// The user clicks the <span>.`,
          output: `outer  capture=true  target=#label currentTarget=#outer
btn    capture=false target=#label currentTarget=#btn
outer  capture=false target=#label currentTarget=#outer`,
          explanation:
            "Read the order: outer's capture listener runs **first**, before the button's — capture travels downward. Then the bubble listeners run on the way back up. Throughout, `target` is `#label` in every single line, because the user clicked the span. `currentTarget` is whichever element's listener is executing. **That is why delegation works at all.**",
        },
      ],
    },
    {
      id: "delegation",
      heading: "Event delegation",
      body: [
        "Rather than attaching a listener to every item in a list, attach **one** listener to the list and work out which item was clicked from `event.target`.",
        "Two reasons this is worth doing. It is one listener instead of a thousand, which matters for memory and for setup cost. And — more importantly — **it works for elements that do not exist yet**. Add a row to the table an hour later and it is already handled, because the listener is on the table.",
        "The pattern always uses `closest`, never `target` directly. The user might click a `<span>` or an icon *inside* the row, so `target` is that inner element; `closest(\"li\")` walks up from wherever the click landed to the row you actually care about.",
      ],
      examples: [
        {
          id: "delegation-example",
          title: "One listener for a whole list",
          js: `// <ul id="list"><li data-id="1">One</li><li data-id="2">Two</li></ul>

document.querySelector("#list").addEventListener("click", (event) => {
  // Walk up from whatever was actually clicked to the row.
  const item = event.target.closest("li");

  // The click might have landed on the <ul>'s own padding.
  if (!item) return;

  console.log("clicked item", item.dataset.id);
});

// Rows added later need no extra wiring:
list.insertAdjacentHTML("beforeend", '<li data-id="3">Three</li>');`,
          output: `clicked item 2`,
          explanation:
            "The `if (!item) return` guard is not optional. `closest` returns `null` when nothing matches, which happens whenever the click lands on the container itself rather than on a row. When one container holds several kinds of control, branch on a `data-action` attribute rather than on tag names — it survives markup changes.",
        },
        {
          id: "delegation-action",
          title: "Branching by data-action",
          js: `// <li data-id="7">
//   <button data-action="edit">Edit</button>
//   <button data-action="delete">Delete</button>
// </li>

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.closest("li").dataset.id;

  switch (button.dataset.action) {
    case "edit":
      startEditing(id);
      break;
    case "delete":
      remove(id);
      break;
  }
});`,
          explanation:
            "One listener, any number of rows, any number of actions per row. The markup declares intent and the handler dispatches on it — which also means the handler does not break when a designer wraps the button text in a `<span>`.",
        },
      ],
      pitfalls: [
        {
          title: "Delegation does not work for events that do not bubble",
          body: "`focus`, `blur`, `load`, `error` and `scroll` (on an element) do not bubble, so a listener on an ancestor never sees them. Use `focusin`/`focusout`, which are the bubbling versions of focus and blur, or register during the capture phase, which reaches the target on the way down regardless of bubbling.",
        },
      ],
    },
    {
      id: "prevent-vs-stop",
      heading: "preventDefault against stopPropagation",
      body: [
        "These sound similar and do entirely unrelated things.",
        "**`preventDefault()`** cancels the browser's built-in response to the event: following a link, submitting a form, checking a checkbox, showing the context menu. It does not affect other listeners at all — they still run.",
        "**`stopPropagation()`** stops the event travelling any further through the phases, so listeners on ancestors never fire. The default action still happens. There is also **`stopImmediatePropagation()`**, which additionally prevents other listeners *on the same element* from running.",
        "`stopPropagation` deserves suspicion. It is invisible action at a distance: some other component's listener silently stops working, and nothing in that component explains why. Reach for a condition in the outer handler instead — usually `if (event.target.closest(\".menu\")) return;` — which keeps the decision where it can be read.",
      ],
      examples: [
        {
          id: "prevent-stop",
          title: "Which one you actually want",
          js: `// A form that submits over fetch instead of navigating.
form.addEventListener("submit", async (event) => {
  event.preventDefault();          // stop the page navigation
  await save(new FormData(form));  // ...and do it ourselves
});

// A link that is handled by a client-side router — but let the user
// open it in a new tab, and let real modifier clicks through.
link.addEventListener("click", (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  router.navigate(link.href);
});

// stopPropagation: usually a sign the design is wrong.
menu.addEventListener("click", (event) => event.stopPropagation());

// The version that is easier to debug six months later:
document.addEventListener("click", (event) => {
  if (event.target.closest(".menu")) return;   // clicks inside the menu are not "outside"
  closeMenu();
});`,
          explanation:
            "The link handler is worth copying. A router that calls `preventDefault()` unconditionally breaks command-click, middle-click and shift-click — three things users do constantly and will assume are broken rather than deliberate.",
        },
      ],
    },
    {
      id: "custom-events",
      heading: "Custom events",
      body: [
        "You can define your own event types, dispatch them from any element, and listen for them exactly like built-in ones. It is a genuinely useful decoupling tool: the component that raises the event does not need a reference to whatever responds.",
        "**`CustomEvent`** carries a payload in its `detail` property. Two options matter: `bubbles: true` so ancestors can hear it (custom events do **not** bubble by default), and `composed: true` if it must escape a shadow DOM boundary.",
        "Namespace the type — `cart:add`, not `add` — so it cannot collide with a built-in name or another library's.",
      ],
      examples: [
        {
          id: "custom-event",
          title: "Raising and handling an application event",
          js: `// Somewhere deep in the UI:
function addToCart(sku, qty) {
  document.dispatchEvent(
    new CustomEvent("cart:add", {
      detail: { sku, qty },
      bubbles: true,
    })
  );
}

// Somewhere else entirely, with no knowledge of the above:
document.addEventListener("cart:add", (event) => {
  console.log("custom detail:", JSON.stringify(event.detail));
});

addToCart("A1", 2);`,
          output: `custom detail: {"sku":"A1","qty":2}`,
          explanation:
            "`detail` is the only place a payload may go — assigning your own properties to the event object works but is not part of the contract and is easy to lose. Note that `dispatchEvent` is **synchronous**: the listeners run before `dispatchEvent` returns, which occasionally surprises people expecting queue semantics.",
        },
      ],
      pitfalls: [
        {
          title: "Custom events do not bubble unless you say so",
          body: "`new CustomEvent(\"thing\")` has `bubbles: false`, so a listener on `document` will never see it dispatched from a button. Built-in events like `click` bubble by default; custom ones do the opposite. If your listener is not firing, this is the first thing to check.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the three phases of event propagation?",
      answer:
        "Capture, target, and bubble. The event travels down from `window` to the target firing capture-phase listeners, then fires listeners on the target itself, then travels back up firing normal listeners. `addEventListener`'s third argument chooses the phase; most code uses the bubble phase, which is the default.",
    },
    {
      question: "What is the difference between event.target and event.currentTarget?",
      answer:
        "`target` is the element the event originated on and is the same in every listener. `currentTarget` is the element whose listener is currently executing, so it changes as the event propagates. Delegation depends on this: the listener is on the container (`currentTarget`) while the thing clicked is `target`.",
    },
    {
      question: "What is event delegation and why use it?",
      answer:
        "Attaching one listener to a common ancestor rather than one to each child, then identifying the relevant child from `event.target`, normally with `closest`. It uses a single listener instead of many, and it automatically covers elements added to the DOM later, which is why it is the standard approach for dynamic lists.",
    },
    {
      question: "preventDefault or stopPropagation — which does what?",
      answer:
        "`preventDefault` cancels the browser's built-in reaction, such as navigating a link or submitting a form, but other listeners still run. `stopPropagation` stops the event reaching further listeners up or down the tree, but the default action still happens. They are independent, and `stopPropagation` should be used sparingly because it breaks other components invisibly.",
    },
    {
      question: "How do you remove an event listener reliably?",
      answer:
        "`removeEventListener` requires the exact same function reference and the same capture setting, so an inline arrow function can never be removed. Either keep the reference in a variable, or register listeners with an `AbortSignal` and call `abort()` — which removes every listener sharing that signal in one call and cannot fall out of sync.",
    },
  ],
  takeaways: [
    "Use `addEventListener`; the `onclick` property has one slot and inline handlers are blocked by CSP",
    "Events capture down, fire on the target, then bubble up — capture listeners on ancestors run before the target's own",
    "`target` is where the event started and never changes; `currentTarget` is whose listener is running",
    "Delegation means one listener on a container plus `closest` — and it covers elements added later",
    "Guard delegation with `if (!item) return`, because `closest` returns null for clicks on the container itself",
    "`preventDefault` cancels the browser's action; `stopPropagation` cancels the journey — they are unrelated",
    "`removeEventListener` needs the identical reference; `{ signal }` with an AbortController is the cleaner answer",
    "Custom events carry data in `detail` and do not bubble unless you pass `bubbles: true`",
  ],
  status: "available",
};
