import type { Lesson } from "@/content/types";

export const validationLesson: Lesson = {
  id: "react-validation",
  slug: "validation-and-errors",
  moduleSlug: "lists-keys-forms",
  title: "Validation, and Showing Errors at the Right Moment",
  summary:
    "Whether a field is valid is derived, not state. What is state is whether the user has finished with it — and getting that distinction right is the difference between a form that helps and one that shouts at an empty field before it has been filled in.",
  estimatedMinutes: 30,
  objectives: [
    "Derive validity instead of storing it",
    "Track touched and submitted, which are the real state",
    "Choose when each error becomes visible",
    "Wire an error to its field for assistive technology",
    "Say what the browser validates for free, and where it stops",
  ],
  sections: [
    {
      id: "derived",
      heading: "Validity is derived",
      body: [
        "`const emailError = email.includes(\"@\") ? null : \"Enter a valid email\"` — computed during render, from the value. It cannot be stale, it needs no effect, and there is no path by which the field and its error can disagree.",
        "Storing it in state creates the same second source of truth module 4 warned about, and the same symptom: an error message one keystroke behind, still showing after the field has been corrected.",
        "So the shape is: **values are state, validity is derived, visibility is state.** The third is the interesting one.",
      ],
    },
    {
      id: "when-to-show",
      heading: "When to show it",
      body: [
        "An error that is correct from the first render is still wrong to display. An empty required field is invalid the moment the form appears, and telling somebody they have made a mistake before they have typed anything is hostile.",
        "What decides visibility is not validity but **what the user has done**, and that genuinely is state:",
        "**Touched.** The field has been focused and left. Set it in `onBlur`. This is the usual trigger for a single field's error.",
        "**Submitted.** The form has been submitted at least once. After that, show everything — the user has asked for the form to be checked.",
        "**Dirty.** The value has changed from its initial one. Useful for \"you have unsaved changes\" more than for errors.",
        "The rule that follows: **show an error when the field is touched, or the form has been submitted.** Hide it again as soon as the field becomes valid, so correcting a mistake gives immediate feedback.",
      ],
      examples: [
        {
          id: "touched-and-submitted",
          title: "The same error, appearing at three different moments",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

function Signup() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Derived: recomputed every render, so it can never lag the value.
  const error = email.includes("@") ? null : "Enter a valid email";
  const show = error && (touched || submitted);

  return (
    <form
      id="f"
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
    >
      <input
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={show ? true : undefined}
        aria-describedby={show ? "email-error" : undefined}
      />
      {show && <span id="email-error" role="alert">{error}</span>}
      <output id="state">error={String(Boolean(error))} shown={String(Boolean(show))}</output>
    </form>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
act(() => { root.render(<Signup />); });
const show = (label) => console.log(label, container.querySelector("#state").textContent);

show("on first render:     ");

// Typing something still invalid, without leaving the field.
function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
act(() => { type(container.querySelector("#email"), "ada"); });
show("after typing 'ada':  ");

// React delegates blur as the bubbling \`focusout\` event, so that is what has
// to be dispatched here; a non-bubbling \`blur\` never reaches the handler.
act(() => { container.querySelector("#email").dispatchEvent(new Event("focusout", { bubbles: true })); });
show("after leaving field: ");

act(() => { type(container.querySelector("#email"), "ada@example.com"); });
show("after correcting it: ");`,
          output: `on first render:      error=true shown=false
after typing 'ada':   error=true shown=false
after leaving field:  error=true shown=true
after correcting it:  error=false shown=false`,
          explanation:
            "`error` is true on all three of the first lines and `shown` only becomes true on the third. The field was invalid from the very first render and said nothing, because the user had not finished with it; leaving the field is what gave permission to complain. The last line is the part that needs no code: correcting the value made `error` null, and the message vanished because it was derived rather than stored.",
        },
      ],
      pitfalls: [
        {
          title: "Validating on every keystroke tells people they are wrong while they type",
          body: "`ada@ex` is not a valid email, and neither is any prefix of one — so live validation on an email field flashes an error through the entire time somebody is typing it. Validate on blur for the first message, and only then switch that field to validating as you type, so corrections are acknowledged immediately without the initial nagging.",
        },
      ],
    },
    {
      id: "many-fields",
      heading: "More than one field",
      body: [
        "The same three ideas scale by holding objects instead of booleans: `values`, `touched`, and derived `errors`.",
        "`errors` is one function of `values` — `const errors = validate(values)` — returning an object keyed the same way. It stays derived, and it can express cross-field rules that per-field validation cannot: a confirmation that must match a password, an end date after a start date.",
        "`touched` is an object keyed by field name, set in a shared `onBlur` handler using the field's `name`.",
        "Submitting is then `if (Object.keys(errors).length > 0) { setSubmitted(true); return; }` — show everything, submit nothing.",
        "This is the point at which a form library starts to earn its keep, which is the last lesson in this module.",
      ],
    },
    {
      id: "accessibility",
      heading: "Wiring the error to the field",
      body: [
        "A message rendered next to an input is not connected to it. Three attributes do the connecting, and they cost one line each.",
        "**`aria-invalid`** on the field when it is showing an error, so the state is announced rather than only coloured.",
        "**`aria-describedby`** pointing at the message's `id`, so a screen reader reads the error when the field is focused.",
        "**`role=\"alert\"`** on the message, so it is announced when it appears rather than only when the field is next visited.",
        "Set `aria-invalid` and `aria-describedby` **only while the error is shown**. A permanently invalid field announces itself as invalid before the user has done anything, which is the accessibility version of the same mistake as showing the message too early.",
        "And the field needs a real `<label htmlFor>`. Placeholder text is not a label: it disappears on focus, fails contrast requirements, and is not reliably announced.",
      ],
    },
    {
      id: "browser-validation",
      heading: "What the browser does for free",
      body: [
        "`required`, `type=\"email\"`, `type=\"url\"`, `min`, `max`, `minLength`, `maxLength` and `pattern` are enforced by the browser before a submit event fires. That is real validation with no code, and it works before your JavaScript has loaded.",
        "Its limits are why it is rarely the whole answer. The messages are the browser's, in the browser's wording, and cannot be restyled. It cannot express a rule involving two fields. And `noValidate` on the form is needed to turn it off when you want to present your own messages instead.",
        "The pragmatic combination: keep the attributes on the fields for the free enforcement and the semantics they give assistive technology, add `noValidate` when you are rendering your own messages, and use `event.currentTarget.checkValidity()` if you want to ask the browser's opinion without its UI.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Should validation errors live in state?",
      answer:
        "No — whether a field is valid is derived from its value, so compute it during render. Storing it creates a second source of truth and produces an error message one keystroke behind that lingers after the field is corrected. What genuinely is state is whether the user has *finished* with the field: touched, set on blur, and whether the form has been submitted. Values are state, validity is derived, visibility is state.",
    },
    {
      question: "When should a field's error become visible?",
      answer:
        "When the field has been touched — focused and left — or once the form has been submitted at least once. An empty required field is invalid on the very first render, and showing that immediately tells people they have made a mistake before they have typed anything. Errors should disappear as soon as the value becomes valid, which happens automatically when the error is derived rather than stored.",
    },
    {
      question: "How do you connect an error message to its input?",
      answer:
        "`aria-invalid` on the field while the error shows, `aria-describedby` pointing at the message's `id` so it is read when the field is focused, and `role=\"alert\"` on the message so it is announced when it appears. All three should be applied only while the error is displayed, since a permanently invalid field announces itself before the user has done anything. The field also needs a real `<label htmlFor>` — a placeholder is not a label.",
    },
  ],
  takeaways: [
    "Validity is derived from the value; only the values and the interaction are state",
    "Show an error when the field is touched or the form has been submitted, not when it is invalid",
    "A derived error clears itself when the value is corrected, with no code to clear it",
    "Live validation on an email field flashes an error through every prefix of a valid address",
    "`aria-invalid`, `aria-describedby` and `role=\"alert\"` connect the message to the field",
    "Browser validation is free and real, but cannot be styled or express cross-field rules",
  ],
  status: "available",
};
