import type { Lesson } from "@/content/types";

export const formSubmissionLesson: Lesson = {
  id: "react-form-submission",
  slug: "form-submission",
  moduleSlug: "lists-keys-forms",
  title: "Submission, `preventDefault`, and the Platform APIs",
  summary:
    "A form that submits properly is a form that still works before JavaScript loads. `FormData` reads every field in one line, and React 19's `action` prop takes the whole thing over — including a reset you need to know about.",
  estimatedMinutes: 30,
  objectives: [
    "Handle submission on the form rather than on the button",
    "Say exactly what `preventDefault` is preventing",
    "Read a whole form with `FormData`, and know which fields it skips",
    "Use React 19's `action` prop and `useFormStatus`",
    "Explain the form reset that `action` performs and `onSubmit` does not",
  ],
  sections: [
    {
      id: "on-the-form",
      heading: "The handler goes on the form",
      body: [
        "`<form onSubmit={handleSubmit}>`, not `<button onClick={handleSubmit}>`. The difference is not style — a submit event fires for **every** way a form can be submitted, and a click handler catches only one of them.",
        "A form submits when a submit button is clicked, when Enter is pressed in a single-line text field, and when script calls `form.requestSubmit()`. Handling the click misses the Enter key, which is how a large proportion of people submit a login form.",
        "It also gives you the browser's built-in validation for free: a form with `required` fields will not fire `submit` until they are filled, so the handler never runs against invalid input.",
        "The button still needs `type=\"submit\"` — or no `type`, since that is the default inside a form. The corollary matters more: **any other button inside a form must say `type=\"button\"`**, or clicking it submits.",
      ],
      pitfalls: [
        {
          title: "A bare `<button>` inside a form is a submit button",
          body: "`<button onClick={remove}>Remove</button>` inside a form submits it as well as removing the row, usually reloading the page mid-interaction. HTML's default `type` for a button in a form is `submit`, which surprises everyone once. Give every non-submitting button `type=\"button\"` — and it is worth making that the habit everywhere, since a component may later be dropped into a form.",
        },
      ],
    },
    {
      id: "preventdefault",
      heading: "What `preventDefault` prevents",
      body: [
        "The browser's default action for a submit event is to serialise the form, send it to the URL in `action` with the method in `method`, and **navigate the page to the response**. That full-page navigation is what `event.preventDefault()` cancels.",
        "It is worth being precise, because \"preventDefault stops the form submitting\" is the wrong model. The submit event already happened; what is cancelled is the navigation that would follow.",
        "So the fields, the validation and the event are all still there. Only the page reload is gone, and everything after that line is your code doing what the server would have done.",
      ],
    },
    {
      id: "formdata",
      heading: "`FormData` reads the whole form",
      body: [
        "`new FormData(event.currentTarget)` gives every named field's value in one call, with no state, no refs and no per-field wiring. For a form whose values are only needed at submit time, this is the entire implementation.",
        "Two rules decide what it contains, and both catch people. **Only fields with a `name` are included** — an `id` is not enough. And **disabled fields are excluded**, which is the browser's rule rather than React's.",
        "Checkboxes contribute their `value` when ticked and nothing at all when not, so an unticked box is *absent* rather than `false`. The default `value` for a checkbox is the string `\"on\"`, which is why `agreed=on` appears so often.",
        "`Object.fromEntries(formData)` converts it to a plain object, which is right until a field can appear more than once — a checkbox group under one name needs `formData.getAll(name)`.",
      ],
      examples: [
        {
          id: "formdata-shape",
          title: "What ends up in the FormData, and what does not",
          lang: "jsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

function Signup() {
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log("  entries:", [...data].map(([k, v]) => \`\${k}=\${v}\`).join("  "));
    console.log("  as object:", JSON.stringify(Object.fromEntries(data)));
    console.log("  unticked checkbox is:", JSON.stringify(data.get("marketing")));
  }

  return (
    <form id="f" onSubmit={handleSubmit}>
      <input name="email" defaultValue="ada@example.com" />
      {/* No name: invisible to FormData however it is styled or labelled. */}
      <input id="nickname" defaultValue="ada" />
      {/* Disabled: excluded by the platform, not by React. */}
      <input name="referrer" defaultValue="google" disabled />
      <input name="agreed" type="checkbox" defaultChecked />
      <input name="marketing" type="checkbox" />
      <input name="plan" type="radio" value="pro" defaultChecked />
      <button type="submit">Sign up</button>
    </form>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<Signup />); });
act(() => { container.querySelector("#f").requestSubmit(); });`,
          output: `  entries: email=ada@example.com  agreed=on  plan=pro
  as object: {"email":"ada@example.com","agreed":"on","plan":"pro"}
  unticked checkbox is: null
  `,
          explanation:
            "Three of the six fields made it. `nickname` was dropped for having no `name`, `referrer` for being disabled, and `marketing` for being unticked — and note that an unticked checkbox comes back as `null` rather than `false`, so `data.get(\"marketing\") === \"on\"` is the way to read it as a boolean. Every value is a string.",
        },
      ],
    },
    {
      id: "actions",
      heading: "React 19's `action` prop",
      body: [
        "React 19 lets a form take a **function** as its `action`. React calls it with the `FormData`, having already prevented the default navigation — so there is no event, no `preventDefault`, and no `new FormData(...)`.",
        "It is not merely shorthand. An action may be `async`, and React tracks its pending state, which `useFormStatus` exposes to any component inside the form — so a submit button can disable itself while the action runs without the form passing a prop down to it.",
        "The behaviour to know about: **React resets an uncontrolled form after the action completes.** `onSubmit` does not. For a create-a-comment box that is exactly what you want and saves a line; for an edit form it is data loss the first time a save fails. The answer there is to control the fields, so React has nothing to reset.",
      ],
      examples: [
        {
          id: "action-resets",
          title: "The reset that `action` performs",
          lang: "jsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

// React calls this with the FormData; no event, no preventDefault.
function WithAction() {
  return (
    <form id="a" action={(data) => console.log("  action received:", data.get("q"))}>
      <input name="q" defaultValue="start" />
      <button type="submit">go</button>
    </form>
  );
}

function WithOnSubmit() {
  function handleSubmit(event) {
    event.preventDefault();
    console.log("  onSubmit received:", new FormData(event.currentTarget).get("q"));
  }
  return (
    <form id="s" onSubmit={handleSubmit}>
      <input name="q" defaultValue="start" />
      <button type="submit">go</button>
    </form>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<><WithAction /><WithOnSubmit /></>); });

const field = (form) => container.querySelector(\`#\${form} input\`);
field("a").value = "typed-a";
field("s").value = "typed-s";
console.log("before: action-form =", field("a").value, "| onSubmit-form =", field("s").value);

act(() => { container.querySelector("#a").requestSubmit(); });
act(() => { container.querySelector("#s").requestSubmit(); });
console.log("after:  action-form =", field("a").value, "| onSubmit-form =", field("s").value);`,
          output: `before: action-form = typed-a | onSubmit-form = typed-s
  action received: typed-a
  onSubmit received: typed-s
after:  action-form = start | onSubmit-form = typed-s`,
          explanation:
            "Both handlers received what the user typed. Afterwards the `action` form is back to `start` and the `onSubmit` form still holds `typed-s`. React reset the first one — a genuine difference in behaviour between two things that look interchangeable, and the reason an edit form built with `action` appears to throw away the user's work when saving fails.",
        },
      ],
      pitfalls: [
        {
          title: "`useFormStatus` must be read from a child of the form",
          body: "It reports the status of the nearest form *above* the component calling it, so calling it in the same component that renders the `<form>` always returns `pending: false` — there is no form above it yet. The submit button has to be its own component inside the form. This is the single most common reason it appears not to work.",
        },
      ],
    },
    {
      id: "progressive",
      heading: "Why a real `<form>` at all",
      body: [
        "Every part of this works because the markup is a real form with real named fields, and that buys four things a `<div>` with a click handler does not.",
        "**Enter submits.** For free, and expected.",
        "**Browser validation.** `required`, `type=\"email\"`, `min`, `pattern` — all enforced before your handler runs.",
        "**Password managers work.** They look for a form with named fields and appropriate `autocomplete` attributes. A div-based login form is one users cannot save credentials for.",
        "**Assistive technology announces it as a form**, with the fields associated to their labels.",
        "The React-specific payoff is that a `<form action={fn}>` is the same shape a Server Function takes in module 12, so a form written this way survives the move to server-side handling unchanged.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why put the handler on the form rather than the submit button?",
      answer:
        "Because a submit event fires for every route into submission — clicking a submit button, pressing Enter in a text field, or `form.requestSubmit()` — while a click handler catches only the first. Handling the click silently breaks the Enter key. It also means browser validation runs first, so the handler never sees invalid input. And any button in a form that is not meant to submit needs `type=\"button\"`, since submit is the default.",
    },
    {
      question: "What exactly does `event.preventDefault()` stop in a submit handler?",
      answer:
        "The navigation. The browser's default action for submit is to serialise the form, send it to the `action` URL and load the response as a new page; `preventDefault` cancels that. The event still fired and the data is still there — only the page reload is prevented. Reading it as \"stops the form submitting\" is the wrong model, and it is why React 19's `action` prop needs no `preventDefault`: React has already done it.",
    },
    {
      question: "Which fields does `FormData` leave out?",
      answer:
        "Anything without a `name` attribute, anything disabled, and unticked checkboxes — an unticked box is absent rather than `false`, so `get()` returns `null`. Every value that is present is a string, with a ticked checkbox contributing its `value`, `\"on\"` by default. A name used more than once needs `getAll`, so `Object.fromEntries` is only safe when every name is unique.",
    },
  ],
  takeaways: [
    "Handle `onSubmit` on the form, so Enter and `requestSubmit` are covered as well as clicks",
    "A button in a form defaults to `type=\"submit\"` — everything else needs `type=\"button\"`",
    "`preventDefault` cancels the navigation, not the submission",
    "`FormData` skips unnamed and disabled fields, and an unticked checkbox is absent rather than false",
    "React 19's `action` receives the FormData directly, and resets an uncontrolled form afterwards",
    "`useFormStatus` reads the nearest form above it, so the submit button must be its own component",
  ],
  status: "available",
};
