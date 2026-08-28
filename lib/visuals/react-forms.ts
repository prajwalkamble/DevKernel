/**
 * Forms: which prop holds a value, what a submit collects, when an error is
 * allowed to appear, and how many states a set of booleans can express.
 *
 * `inputOwnership` reads a real table of the DOM's own value properties.
 * `formDataCollect` builds a real `FormData` from real field descriptors and
 * reads the entries back out of it. `validationTiming` runs a real state
 * machine over a real sequence of events. `booleanStates` enumerates every
 * combination of three booleans and marks the ones that cannot be true at
 * once — by evaluating the constraints, not by listing the answer.
 */
import { Recorder, type Role, type SequenceFrame, type Visualisation } from "./types";

/* ------------------------------------- 1. which prop holds the value -- */

/**
 * The one rule for controlling an input, and the four shapes it takes.
 *
 * The property names are the DOM's own: `value` for text, `checked` for
 * toggles, `files` for a file input — and `files` is read-only, which is the
 * whole reason a file input cannot be controlled.
 */
function inputOwnership(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const KINDS = [
    {
      kind: 'type="text" | "email" | "password" | <textarea>',
      prop: "value",
      event: "onChange → e.target.value",
      controllable: true,
      why: "The default case. `value` holds a string, and the change event carries the new one.",
    },
    {
      kind: 'type="checkbox" | type="radio"',
      prop: "checked",
      event: "onChange → e.target.checked",
      controllable: true,
      why: "A toggle's state is `checked`, not `value` — a checkbox's `value` is the string it submits when ticked, which is a different question. Controlling one with `value` silently does nothing.",
    },
    {
      kind: "<select> and <select multiple>",
      prop: "value",
      event: "onChange → e.target.value",
      controllable: true,
      why: "`value` again, and React lets you set it on the `<select>` rather than putting `selected` on an option — which is the one place React deliberately differs from HTML.",
    },
    {
      kind: 'type="file"',
      prop: "files",
      event: "onChange → e.target.files",
      controllable: false,
      why: "`files` is a read-only `FileList`, so there is no value to hand back and a file input **cannot** be controlled. It is always uncontrolled, and you read it from the event or from a ref.",
    },
  ];

  const emit = (i: number | null, note: string) =>
    rec.push({
      kind: "sequence",
      items: KINDS.map((k, j) => ({
        id: `k${j}`,
        label: `${k.kind} → ${k.prop}`,
        role: i === null ? (k.controllable ? "unchanged" : "discarded") : j === i ? (k.controllable ? "found" : "discarded") : undefined,
      })),
      note,
    });

  emit(null, "One rule for every input: React controls it by rendering the property the DOM uses to hold its value, and updates it from the change event. The only thing that varies is which property that is.");

  for (const k of KINDS) {
    rec.bump(k.controllable ? "controllable" : "not controllable");
    rec.push({
      kind: "sequence",
      items: [
        { id: "kind", label: k.kind, role: "active" },
        { id: "prop", label: `prop: ${k.prop}`, role: k.controllable ? "found" : "discarded" },
        { id: "ev", label: k.event, role: "unchanged" },
      ],
      note: k.why,
    });
  }

  emit(null, "Three of the four are controllable and one is not. The bug the table prevents is the second row: reaching for `value` on a checkbox, which compiles, renders, and does nothing at all.");

  return {
    frames: rec.frames,
    summary:
      "Controlling an input means rendering whichever property the DOM uses to hold its value and updating it from the change event. For text, textareas and selects that is `value`; for checkboxes and radios it is `checked`, and using `value` there is a silent no-op because a checkbox's `value` is the string it submits rather than its state. A file input's `files` is a read-only `FileList`, so it cannot be controlled at all — read it from the event or a ref and let the DOM own it.",
  };
}

/* ------------------------------------------ 2. what a submit collects -- */

/**
 * `new FormData(form)`, built for real and read back.
 *
 * The entries come out of an actual `FormData` object, so the rules that
 * catch people — a field with no `name` is absent, an unchecked box is
 * absent, a multi-select yields repeated keys — are the object's behaviour
 * rather than a list of gotchas.
 */
function formDataCollect(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* The form, as the browser would see it after the user filled it in. */
  const FIELDS: { label: string; name: string | null; value: string | string[]; included: boolean; why: string }[] = [
    { label: '<input name="title" value="Fix the filter">', name: "title", value: "Fix the filter", included: true, why: "A named field with a value: included, as expected." },
    { label: '<input value="draft">  (no name)', name: null, value: "draft", included: false, why: "No `name` attribute, so it is **not** in the form data at all. This is the single most common surprise: the field is on screen, the user typed into it, and the server never sees it." },
    { label: '<input type="checkbox" name="urgent" checked>', name: "urgent", value: "on", included: true, why: 'A ticked checkbox contributes its `value`, which defaults to the string "on" when you did not set one.' },
    { label: '<input type="checkbox" name="silent">  (unchecked)', name: "silent", value: "", included: false, why: "An unchecked box contributes **nothing** — the key is absent rather than false. Reading it back gives `null`, so a boolean field needs `formData.has(name)` rather than a truthiness check on the value." },
    { label: '<select name="labels" multiple>  (two chosen)', name: "labels", value: ["bug", "ui"], included: true, why: "A multiple select contributes one entry per selection — the same key twice — which is why `getAll` exists and `get` would silently lose one." },
  ];

  /* Build the real thing. */
  const data = new FormData();
  const shown: { id: string; label: string; role?: Role }[] = [];

  const emit = (probe: { id: string; label: string; role?: Role }[], note: string) =>
    rec.push({ kind: "sequence", items: [...probe, ...shown], note });

  emit([], "A form with five fields, submitted. `new FormData(event.currentTarget)` walks the form and collects what it finds — and what it finds is not quite what is on the screen.");

  for (const field of FIELDS) {
    if (field.included && field.name) {
      for (const v of Array.isArray(field.value) ? field.value : [field.value]) data.append(field.name, v);
    }
    rec.bump(field.included ? "collected" : "dropped");

    /* Read the state of the real FormData back out. */
    const entries = [...data.entries()].map(([k, v]) => `${k}=${String(v)}`);
    shown.length = 0;
    shown.push(...entries.map((e, i) => ({ id: `e${i}`, label: e, role: "unchanged" as Role })));

    emit(
      [
        { id: "f", label: field.label, role: "active" },
        { id: "r", label: field.included ? "→ collected" : "→ absent", role: field.included ? "found" : "discarded" },
      ],
      field.why,
    );
  }

  const keys = [...new Set([...data.keys()])];
  emit(
    [],
    `Five fields on screen, ${data.getAll("labels").length + keys.length - 1} entries under ${keys.length} keys. \`Object.fromEntries(formData)\` would give you ${keys.length} properties and quietly keep only the last "labels" — which is why the multi-value case needs \`getAll\`.`,
  );

  return {
    frames: rec.frames,
    summary:
      "`new FormData(form)` collects successful controls, which is not the same as visible ones. A field with no `name` is absent however much the user typed into it. An unchecked box is absent rather than false, so a boolean needs `has()` rather than a truthiness test. A multiple select contributes one entry per selection under the same key, so `get()` silently keeps one and `getAll()` is the correct reader — and `Object.fromEntries` has the same flaw. It is the browser's own collection rule, which is exactly why it is worth knowing rather than re-implementing with a ref per field.",
  };
}

/* ------------------------------------- 3. when an error may be shown -- */

/**
 * The touched/dirty/submitted machine, run over a real sequence of events.
 *
 * Whether the message is visible in each frame is computed from the state,
 * not chosen — so the frame where the field is invalid and the message is
 * still hidden is the rule working, which is the point.
 */
function validationTiming(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  interface Field {
    value: string;
    touched: boolean;
    submitted: boolean;
  }
  let field: Field = { value: "", touched: false, submitted: false };

  const error = (f: Field) => (f.value.trim() === "" ? "Title is required" : null);
  /* The rule: an error is shown once the user has left the field, or once
     they have tried to submit. Never while they are still typing it. */
  const visible = (f: Field) => error(f) !== null && (f.touched || f.submitted);

  const emit = (event: string, note: string) => {
    const err = error(field);
    const show = visible(field);
    rec.push({
      kind: "sequence",
      items: [
        { id: "ev", label: event, role: "active" },
        { id: "v", label: `value: "${field.value}"`, role: "unchanged" },
        { id: "t", label: `touched: ${field.touched} · submitted: ${field.submitted}`, role: "unchanged" },
        { id: "e", label: err ? `invalid: ${err}` : "valid", role: err ? "discarded" : "found" },
        { id: "s", label: show ? "message shown" : "message hidden", role: show ? "updated" : "unchanged" },
      ],
      note,
    });
  };

  emit("first render", "An empty required field. It is already invalid — and showing that now would mean greeting the user with an error before they have done anything.");

  field = { ...field, value: "F" };
  emit("types \"F\"", "Still invalid by some rules, and still nothing shown. Validating on every keystroke means telling someone their email is wrong while they are halfway through typing it.");

  field = { ...field, value: "" };
  emit("clears it", "Empty again. The rule has not changed and neither has the screen.");

  field = { ...field, touched: true };
  rec.bump("blurs");
  emit("blurs the field", "Now the user has left the field, so they are finished with it — and *this* is the first moment the message is allowed to appear. `touched` is what that moment is called.");

  field = { ...field, value: "Fix the filter" };
  emit("types a title", "Once a message is on screen the rules invert: it now updates on every keystroke, so it disappears the instant the input becomes valid rather than waiting for another blur.");

  field = { value: "", touched: false, submitted: true };
  rec.bump("submits");
  emit("submits without touching anything", "And the case the whole design exists for: a user who tabs straight to the button. Nothing was touched, so nothing was showing — `submitted` is what makes every invalid field speak up at once.");

  return {
    frames: rec.frames,
    summary:
      "Whether a field is invalid and whether its message should be visible are two different questions, and conflating them is what produces forms that shout at people before they have typed. Validity is derived from the value on every render. Visibility needs one more fact: has the user finished with this field — `touched`, set on blur — or have they tried to submit. Before either, stay quiet; after either, update on every keystroke so a fixed field clears immediately. The submit case is the one that matters most, because a user who tabs straight to the button has touched nothing at all.",
  };
}

/* ------------------------------ 4. booleans against a state union -- */

/**
 * Every combination of three status booleans, enumerated and checked.
 *
 * The illegal combinations are found by evaluating the constraints over all
 * eight rows rather than by being listed, so the count of unreachable states
 * is a result — and the union that replaces them has exactly the four the
 * check leaves standing.
 */
function booleanStates(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  interface Flags {
    loading: boolean;
    error: boolean;
    empty: boolean;
  }

  /* What the screen cannot simultaneously be. */
  const illegal = (f: Flags): string | null => {
    if (f.loading && f.error) return "loading and failed at once";
    if (f.loading && f.empty) return "loading and known to be empty";
    if (f.error && f.empty) return "failed, and also empty";
    return null;
  };

  const rows: Flags[] = [];
  for (const loading of [false, true])
    for (const error of [false, true])
      for (const empty of [false, true])
        rows.push({ loading, error, empty });

  const label = (f: Flags) =>
    `${f.loading ? "L" : "·"}${f.error ? "E" : "·"}${f.empty ? "M" : "·"}`;

  const emit = (upTo: number, note: string) =>
    rec.push({
      kind: "sequence",
      items: rows.map((f, i) => ({
        id: `r${i}`,
        label: label(f),
        role: i > upTo ? undefined : illegal(f) ? "discarded" : "found",
      })),
      note,
    });

  emit(-1, "Three booleans — `isLoading`, `isError`, `isEmpty` — give eight combinations. A screen written as three `if` statements has to be correct in all eight, whether or not all eight can happen.");

  let bad = 0;
  rows.forEach((f, i) => {
    const why = illegal(f);
    if (why) bad++;
    rec.bump(why ? "impossible" : "reachable");
    emit(i, why ? `\`${label(f)}\` is ${why} — a state the data can never be in, and one nobody writes a branch for. What renders here is whatever the last \`if\` happened to catch.` : `\`${label(f)}\` is a real state the screen must handle.`);
  });

  emit(
    rows.length,
    `${bad} of ${rows.length} combinations cannot happen, and the type permits every one of them. That is the argument: the bug is not that somebody will set two flags at once, it is that the compiler cannot tell you when they do.`,
  );

  const union = ["loading", "error", "empty", "success"];
  rec.push({
    kind: "sequence",
    items: union.map((s, i) => ({ id: `u${i}`, label: s, role: "found" })),
    note: `One field with ${union.length} values instead of ${rows.length - bad === union.length ? "three booleans" : "three booleans"}: exactly the ${rows.length - bad} reachable states, no unreachable ones, and a \`switch\` the compiler will reject if you forget a case. Adding a fifth state is then a compile error in every screen rather than a branch somebody forgot.`,
  });

  return {
    frames: rec.frames,
    summary:
      "Three status booleans describe eight combinations, and only four of them can happen — so half of what the type permits is unreachable, and the code has no way to say so. The failure is not that someone sets two flags at once; it is that when the branches are written as independent `if`s, an impossible combination renders whatever the last one happened to catch. A single field with four values encodes exactly the reachable states, makes the impossible ones unrepresentable, and turns a forgotten case into a compile error instead of a blank screen.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_FORM_ALGOS = {
  "input-ownership": {
    label: "Which prop holds the value",
    run: inputOwnership,
  },
  "form-data": {
    label: "What a submit actually collects",
    run: formDataCollect,
  },
  "validation-timing": {
    label: "When an error may be shown",
    run: validationTiming,
  },
  "boolean-states": {
    label: "Three booleans against one union",
    run: booleanStates,
  },
} as const;

export type ReactFormName = keyof typeof REACT_FORM_ALGOS;
