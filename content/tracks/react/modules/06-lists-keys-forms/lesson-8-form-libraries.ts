import type { Lesson } from "@/content/types";

export const formLibrariesLesson: Lesson = {
  id: "react-form-libraries",
  slug: "form-libraries",
  moduleSlug: "lists-keys-forms",
  title: "When to Reach for a Form Library",
  summary:
    "What the hand-written version actually costs once a form gets large, what a library removes, and the honest answer for the many forms that need nothing at all.",
  estimatedMinutes: 25,
  objectives: [
    "Say what a form library actually provides",
    "Name the point at which hand-written state stops scaling",
    "Explain why re-render count is the usual technical argument",
    "Compare the uncontrolled and controlled approaches the ecosystem takes",
    "Decide for a given form without reaching for a default",
  ],
  sections: [
    {
      id: "what-it-costs",
      heading: "What the hand-written version costs",
      body: [
        "For three fields, nothing worth discussing. `useState` per field, a submit handler, a derived error or two.",
        "At fifteen fields, four things have grown that were free at three.",
        "**Wiring.** Every field needs `value`, `onChange`, `onBlur`, `id`, `name`, `aria-invalid`, `aria-describedby` and a label. That is eight attributes repeated fifteen times, and the ones that get forgotten are the accessibility ones because nothing breaks visibly.",
        "**Re-renders.** Controlled fields in one component mean every keystroke re-renders the whole form. At fifteen simple inputs it is imperceptible; with a rich text editor or a large table in the same component it is not.",
        "**Validation structure.** Cross-field rules, async rules such as \"is this username taken\", and per-field messages need somewhere to live, and a `validate(values)` function grows into a small language.",
        "**Arrays.** A repeating section — line items, contacts — needs add, remove, reorder, and per-row errors keyed correctly. This is where hand-written forms most often become genuinely difficult.",
      ],
    },
    {
      id: "what-you-get",
      heading: "What a library provides",
      body: [
        "Roughly the same list, in every library worth using.",
        "**Registration**, so a field is wired with one call instead of eight attributes.",
        "**Managed touched, dirty and submitting state** — the interaction state from the validation lesson, which is genuinely fiddly to track for many fields.",
        "**A schema integration**, so validation is declared once with Zod, Valibot or Yup and the types come from the same declaration.",
        "**Field arrays**, with the keying and per-row error paths handled.",
        "**Fewer re-renders**, by keeping values out of React state and subscribing only the components that display them.",
        "None of that is unavailable by hand. The value is that it is already written, already tested, and consistent across a codebase — which matters most on a team.",
      ],
    },
    {
      id: "two-approaches",
      heading: "The two approaches",
      body: [
        "**Uncontrolled-first** — React Hook Form is the dominant example. Values live in the DOM and are collected through refs, so typing causes no re-render at all. Fields are registered with a call that returns the props to spread. It is fast by construction and reads a little further from plain React.",
        "**Controlled with a store** — Formik historically, and the newer TanStack Form. Values live in the library's own state, and components subscribe to the slices they need. Closer to the React model, with re-render control coming from the subscription rather than from avoiding state.",
        "**The platform route** — React 19's `action`, `useFormStatus` and `useActionState`, with a schema for validation. Not a library at all, and increasingly the right answer for forms that submit to a server, because it is the same shape a Server Function takes in module 12.",
        "The differences matter far less than the decision to use one at all. All three are competent.",
      ],
    },
    {
      id: "deciding",
      heading: "Deciding",
      body: [
        "**No library** when the form is small, the validation is per-field, and there are no repeating sections. Most forms on most sites. A search box, a login, a settings toggle, a comment box.",
        "**A library** when any of these is true: more than about ten fields, repeating sections, cross-field or async validation, a multi-step wizard, or the same form patterns repeated across a large codebase where consistency is the real win.",
        "**The platform** when the form's job is to send data to a server and get a result back, and you are on React 19 with a framework that supports actions.",
        "The failure mode worth avoiding in both directions: adding a dependency for a two-field login, and hand-rolling a fifteen-field form with a repeating section because the codebase has no library yet.",
      ],
      pitfalls: [
        {
          title: "Adopting a library does not remove the need to understand this module",
          body: "Every library is built on the same three ideas: controlled or uncontrolled fields, derived validity, and interaction state deciding what to show. Its documentation assumes you know them, and its failure modes are the same ones — a field that will not accept typing, an error shown too early, a list keyed by index. The library removes the typing, not the model.",
        },
      ],
    },
    {
      id: "a-middle-path",
      heading: "The middle path most codebases end up on",
      body: [
        "Before a library, one refactor removes most of the repetition: a `<Field>` component that takes a name and renders the label, the input, the error and all the wiring between them.",
        "It is thirty lines, it is yours, and it removes the eight-attribute repetition and the forgotten accessibility attributes in one move. Fields become `<Field name=\"email\" label=\"Email\" />` and the form's own code shrinks to a list of them.",
        "It is often enough, and when it is not, it is exactly the seam a library slots into — the `<Field>` component changes and the form does not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a form library actually give you?",
      answer:
        "Field registration so wiring is one call rather than eight attributes; managed touched, dirty and submitting state; schema-based validation that also produces the types; field arrays with the keying and error paths handled; and fewer re-renders, either by keeping values out of React state or by subscribing components to slices. None of it is impossible by hand — the value is that it is written, tested and consistent across a codebase.",
    },
    {
      question: "When is a form library not worth it?",
      answer:
        "When the form is small, the validation is per-field, and there are no repeating sections — which covers most forms: a login, a search box, a comment field, a settings panel. Adding a dependency for two fields costs more than it saves. The threshold is roughly ten fields, or the arrival of a repeating section, cross-field or async validation, or a wizard.",
    },
    {
      question: "Why is React Hook Form usually described as fast?",
      answer:
        "Because it is uncontrolled by default: field values live in the DOM and are read through refs, so typing causes no re-render at all, where a controlled form re-renders on every keystroke. The trade is that it reads a little further from plain React and values are not available during render unless you explicitly watch them. Controlled libraries such as TanStack Form get similar results differently, by keeping values in their own store and subscribing only the components that display them.",
    },
  ],
  takeaways: [
    "Hand-written forms are fine at three fields and start costing at around fifteen",
    "The costs are repeated wiring, whole-form re-renders, validation structure, and repeating sections",
    "Libraries provide registration, interaction state, schema validation, field arrays and fewer re-renders",
    "React Hook Form avoids re-renders by staying uncontrolled; store-based libraries subscribe by slice",
    "React 19's `action` and `useActionState` are the platform answer for server-bound forms",
    "A thirty-line `<Field>` component removes most of the repetition and is the seam a library later fills",
  ],
  status: "available",
};
