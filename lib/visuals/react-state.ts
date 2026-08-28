/**
 * The state mechanics of modules 4 to 6, each one run rather than drawn.
 *
 * Everything here is a small, real implementation of the thing being taught,
 * with `emit()` threaded through it. `snapshot()` builds actual JavaScript
 * closures and calls them, so the number a stale callback reports is the
 * number the closure genuinely holds. `batching()` runs a real queue with a
 * real flush point. `mutateVsCopy()` calls `Object.is` on real arrays and
 * reports the answer it gets back. `depsCompare()` compares real values
 * across real renders.
 *
 * The point of that discipline is the same as everywhere else in this
 * directory: a hand-drawn animation of "state is a snapshot" would show
 * whatever its author believed, and the places it was wrong would be exactly
 * the places a learner is stuck. If one of these implementations is wrong,
 * the animation is visibly wrong too.
 */
import { Recorder, type Role, type SequenceFrame, type Visualisation } from "./types";

type Item = { id: string; label: string; role?: Role };

/* --------------------------------------------- 1. state is a snapshot -- */

/**
 * Why a callback scheduled during a render reports an old number.
 *
 * The mechanism is a closure, so this uses closures. `renderPass` returns
 * handlers that have captured `count` as an ordinary local, and the delayed
 * callback is genuinely the one built in the first pass — it is called at the
 * end and reports whatever it captured, with nothing here free to decide what
 * that should be.
 */
function snapshot(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  interface Pass {
    n: number;
    count: number;
    /** Built during the pass, so it closes over that pass's `count`. */
    delayed: () => number;
  }

  const passes: Pass[] = [];
  let committed = 0;

  const renderPass = (count: number): Pass => {
    const pass: Pass = { n: passes.length, count, delayed: () => count };
    passes.push(pass);
    return pass;
  };

  const emit = (roles: Record<number, Role>, pins: Record<number, string>, note: string) =>
    rec.push({
      kind: "sequence",
      items: passes.map((p, i) => ({
        id: `p${i}`,
        label: `render #${p.n} · count = ${p.count}`,
        role: roles[i],
      })),
      pins,
      note,
    });

  renderPass(committed);
  emit({ 0: "active" }, { 0: "on screen" }, "The first render. `count` is 0 — a plain local variable in that call of the component, not a reference to a box React owns.");

  emit(
    { 0: "active" },
    { 0: "captured by the handler" },
    "The click handler is created during this render, so it closes over *this* `count`. That binding is fixed for the lifetime of the handler; nothing can reassign it later.",
  );

  /* The handler runs. Its three setters all compute from the same captured
     value, which is the whole reason the answer is 1 rather than 3. */
  const captured = passes[0].count;
  const queued = [captured + 1, captured + 1, captured + 1];
  rec.bump("setState calls", 3);
  emit(
    { 0: "active" },
    { 0: `count is ${captured} in here` },
    `Click. The handler calls setCount(count + 1) three times, and \`count\` is ${captured} at every one of them — so all three queue the value ${queued[0]}.`,
  );

  committed = queued.reduce((_, value) => value, committed);
  const second = renderPass(committed);
  rec.bump("renders");
  emit(
    { 0: "stale", 1: "active" },
    { 1: "on screen" },
    `React processes the queue and re-renders. The component function runs again, and *this* call has its own \`count\` — ${second.count}. Render #0's variables did not change; they were never going to.`,
  );

  /* The delayed callback from the first pass is still holding its own count.
     Calling it is the demonstration: nothing here chooses the number. */
  const reported = passes[0].delayed();
  emit(
    { 0: "stale", 1: "unchanged" },
    { 0: `still reports ${reported}` },
    `Now the setTimeout that render #0 scheduled fires. It reports ${reported}, not ${second.count} — because it is a function built in render #0, reading render #0's variable. The screen moved on; that closure did not.`,
  );

  emit(
    { 0: "unchanged", 1: "active" },
    { 1: "the only live one" },
    "Two renders, two independent sets of variables. \"State is a snapshot\" is this and nothing more: the component function's locals belong to the call that created them.",
  );

  return {
    frames: rec.frames,
    summary:
      "Each render is a separate call of the component function, with its own locals. A handler or a timeout created during a render closes over that render's variables, so it keeps reporting them however many times the state has changed since. Three setters computing from the same captured `count` therefore queue the same value three times. The fix is never to reach for the newer value from the old closure — it is to stop needing it, with an updater function that is handed the current value instead.",
  };
}

/* ------------------------------------------------------- 2. batching -- */

/**
 * How many renders a handful of setters cost.
 *
 * A real queue with a real flush point. `setState` appends and schedules;
 * the flush drains and renders once. `flushSync` drains immediately, which is
 * modelled by calling the same drain from inside the handler — so the extra
 * render in that run is produced by the mechanism rather than asserted by a
 * caption.
 */
function batching(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  let pending: { label: string; apply: (s: State) => State }[] = [];
  let state: State = { count: 0, flag: false };
  let renders = 0;

  interface State {
    count: number;
    flag: boolean;
  }

  const items = (): Item[] => [
    { id: "count", label: `count = ${state.count}` },
    { id: "flag", label: `flag = ${state.flag}` },
    ...pending.map((p, i) => ({ id: `q${i}`, label: p.label, role: "active" as Role })),
  ];

  const emit = (note: string, pins: Record<number, string> = {}) =>
    rec.push({ kind: "sequence", items: items(), pins, note });

  const setState = (label: string, apply: (s: State) => State) => {
    pending.push({ label, apply });
    rec.bump("setState calls");
  };

  /** Drain the queue and render once — whatever put us here. */
  const flush = (why: string) => {
    if (pending.length === 0) return;
    for (const update of pending) state = update.apply(state);
    pending = [];
    renders++;
    rec.bump("renders");
    emit(`${why} React applies every queued update, then renders once. That is ${renders} render${renders === 1 ? "" : "s"} so far.`, { 0: "on screen", 1: "on screen" });
  };

  emit("Before the click: two pieces of state, nothing queued.", { 0: "on screen", 1: "on screen" });

  setState("count → 1", (s) => ({ ...s, count: s.count + 1 }));
  emit("The handler calls setCount. Nothing has rendered — the update is queued and React has scheduled itself to run after the handler returns.");

  setState("flag → true", (s) => ({ ...s, flag: true }));
  emit("A second setter, a different piece of state. Still queued, still no render.");

  flush("The handler returns.");

  emit("Two setters, one render. That is batching, and it is why you cannot read the new state on the next line of the handler — there is no new state yet.");

  /* React 18 extended this beyond React's own event handlers. The queue does
     not care what put an entry in it, which is the point. */
  setState("count → 2", (s) => ({ ...s, count: s.count + 1 }));
  setState("flag → false", (s) => ({ ...s, flag: false }));
  emit("Now the same two setters from inside a `setTimeout`. Before React 18 each of these rendered on its own; the queue is the same queue either way.");

  flush("The timeout callback returns.");
  emit("One render again. That is what automatic batching changed: the batching stopped depending on *what* called the setter.");

  /* flushSync is the same drain, called earlier. */
  setState("count → 3", (s) => ({ ...s, count: s.count + 1 }));
  emit("And `flushSync`: one setter, queued as normal…");
  flush("…but `flushSync` drains the queue immediately, before the handler continues.");

  setState("flag → true", (s) => ({ ...s, flag: true }));
  flush("The rest of the handler queues another update, which renders on its own.");

  emit(
    `Two renders for what would have been one. \`flushSync\` is not free — it is the escape hatch for the case where you must read the DOM before the browser paints.`,
    { 0: "on screen", 1: "on screen" },
  );

  return {
    frames: rec.frames,
    summary:
      "A setter appends to a queue and schedules React; it does not render. When the code that queued them finishes, React drains the queue and renders once — however many setters ran and however many pieces of state they touched. React 18 made that true regardless of what called the setter, so a timeout, a promise callback and a click all batch the same way. `flushSync` drains the queue on the spot, which is exactly one render more than you needed unless you genuinely have to read the laid-out DOM before the browser paints.",
  };
}

/* ------------------------------ 3. mutation, and what Object.is says -- */

/**
 * The comparison React actually performs, performed.
 *
 * `Object.is` is called on the real values and its real answer decides the
 * frame, so the run cannot claim a bail-out that would not happen.
 */
function mutateVsCopy(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const emit = (
    label: string,
    list: string[],
    verdict: string,
    role: Role,
    note: string,
    pins: Record<number, string> = {},
  ) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "ref", label, role },
        ...list.map((value, i) => ({ id: `v${i}`, label: value, role })),
        { id: "verdict", label: verdict, role },
      ],
      pins,
      note,
    });

  /* --- the mutating version --- */
  let stored: string[] = ["a", "b"];
  const beforeMutation = stored;

  emit("todos (render 1)", stored, "—", "unchanged", "State holds an array. React is also holding a reference to that exact array — the same object, not a copy of it.", { 0: "React's reference" });

  stored.push("c");
  rec.bump("mutations");
  emit("todos (mutated)", stored, "—", "updated", "`todos.push(\"c\")` succeeds. The array now has three entries — and it is still the same array object it was a moment ago.");

  const mutatedSame = Object.is(beforeMutation, stored);
  emit(
    "setTodos(todos)",
    stored,
    `Object.is → ${mutatedSame}`,
    mutatedSame ? "discarded" : "created",
    `Passing it to the setter, React compares the new value with the old one. \`Object.is\` returns ${mutatedSame} — they are the same object — so React bails out. No render. The screen still shows two items while the state has three.`,
    { 0: "unchanged identity" },
  );

  emit(
    "todos (still)",
    stored,
    "no render",
    "discarded",
    "That divergence is the real damage. The bug is not the missing render; it is that the state and the screen now disagree, and the next unrelated render is where somebody discovers it.",
  );

  /* --- the copying version --- */
  stored = ["a", "b"];
  const beforeCopy = stored;
  emit("todos (render 1)", stored, "—", "unchanged", "Start again. Same array, same reference held by React.", { 0: "React's reference" });

  const copied = [...stored, "c"];
  rec.bump("copies");
  emit("[...todos, \"c\"]", copied, "—", "created", "A spread builds a *new* array with the old contents plus one. The old array is untouched — which is what lets React compare the two at all.");

  const copiedSame = Object.is(beforeCopy, copied);
  stored = copied;
  emit(
    "setTodos(next)",
    stored,
    `Object.is → ${copiedSame}`,
    copiedSame ? "discarded" : "created",
    `\`Object.is\` returns ${copiedSame}: a different object. React schedules a render, the screen shows three items, and the state and the screen agree.`,
    { 0: "new identity" },
  );

  return {
    frames: rec.frames,
    summary:
      "React decides whether to re-render by calling `Object.is` on the old state and the new. A mutated array is the same object it was, so that comparison says \"unchanged\" and React bails out — while the mutation itself succeeded. The result is not a missing feature but a divergence: the state has the new item, the screen does not, and the two stay out of step until some unrelated render papers over it. Building a new array or object gives the comparison something to see, which is the entire reason for the spread.",
  };
}

/* ------------------------------------------------ 4. derived state -- */

/**
 * Two states kept in step by an effect, against one state and a derivation.
 *
 * The render loop is real: an effect that sets state schedules another pass,
 * and this runs that loop until it settles rather than asserting how many
 * passes it takes.
 */
function derivedState(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const ITEMS = ["hat", "hose", "spade"];
  const query = "h";
  const matches = (list: string[], q: string) => list.filter((x) => x.startsWith(q));

  /* --- the two-state version --- */
  const items = ITEMS;
  let visible: string[] = [];
  let renders = 0;
  let settled = false;

  const emitPair = (roles: [Role | undefined, Role | undefined], note: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "items", label: `items = [${items.join(", ")}]`, role: roles[0] },
        { id: "visible", label: `visible = [${visible.join(", ")}]`, role: roles[1] },
        { id: "screen", label: `screen shows ${visible.length}`, role: roles[1] },
      ],
      pins: { 2: `render ${renders}` },
      note,
    });

  renders++;
  rec.bump("renders (stored)");
  emitPair(["unchanged", "stale"], "Two pieces of state: the list, and a second one holding the filtered view. The first render commits with `visible` still empty — nothing has run the effect yet.");

  /* The effect runs after commit; if it sets state, React renders again. */
  while (!settled) {
    const next = matches(items, query);
    if (next.length === visible.length && next.every((v, i) => v === visible[i])) {
      settled = true;
      break;
    }
    visible = next;
    rec.bump("effect passes");
    emitPair(["unchanged", "active"], "The effect runs after the commit, computes the filtered list and sets the second state.");
    renders++;
    rec.bump("renders (stored)");
    emitPair(["unchanged", "updated"], `That set schedules another render. Pass ${renders} is the first one that shows the right ${visible.length} items — one paint late.`);
  }

  emitPair(["unchanged", "unchanged"], `Settled after ${renders} renders. The window between them is real: the user saw an empty list for a frame, and any component reading \`visible\` during that pass read a lie.`);

  /* --- the derived version --- */
  renders = 0;
  visible = [];
  renders++;
  rec.bump("renders (derived)");
  const derived = matches(items, query);
  rec.push({
    kind: "sequence",
    items: [
      { id: "items", label: `items = [${items.join(", ")}]`, role: "unchanged" },
      { id: "derived", label: `const visible = items.filter(…) → [${derived.join(", ")}]`, role: "found" },
      { id: "screen", label: `screen shows ${derived.length}`, role: "found" },
    ],
    pins: { 2: `render ${renders}` },
    note: `The same screen with one piece of state. The filtered list is computed during the render that needs it, so the first commit is already correct — ${renders} render, no effect, and no pass in which the two can disagree.`,
  });

  return {
    frames: rec.frames,
    summary:
      "State that can be computed from other state should be computed, not stored. Storing it needs an effect to keep it in step, and an effect runs *after* the commit — so there is always at least one render showing the stale value, and always a window in which the two disagree. Deriving during render removes the second state, the effect, the extra render and the window together. The question to ask of every `useState` is whether anything could tell you its value from the state you already have.",
  };
}

/* ---------------------------------------- 5. the dependency array -- */

/**
 * What `exhaustive-deps` is protecting, compared with `Object.is`.
 *
 * The comparison is the real one, run across a sequence of real renders in
 * which one dependency is a primitive and one is an object literal rebuilt
 * every time. The verdict per render is whatever `Object.is` returns.
 */
function depsCompare(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* A component re-rendered three times. `userId` changes once; `options` is
     an object literal, so it is a new object on every pass. */
  const ids = [7, 7, 8];
  let previous: [number, { sort: string }] | null = null;
  let effectRuns = 0;

  for (let pass = 0; pass < ids.length; pass++) {
    const deps: [number, { sort: string }] = [ids[pass]!, { sort: "name" }];

    const verdicts = previous
      ? deps.map((dep, i) => Object.is(dep, previous![i]))
      : deps.map(() => false);
    const changed = verdicts.some((same) => !same);
    if (changed) effectRuns++;
    rec.bump("renders");
    if (changed) rec.bump("effect runs");

    rec.push({
      kind: "sequence",
      items: [
        {
          id: `id${pass}`,
          label: `userId: ${deps[0]}`,
          role: previous ? (verdicts[0] ? "unchanged" : "updated") : "mounted",
        },
        {
          id: `opt${pass}`,
          label: `options: { sort: "name" }`,
          role: previous ? (verdicts[1] ? "unchanged" : "updated") : "mounted",
        },
        {
          id: `run${pass}`,
          label: changed ? "effect runs" : "effect skipped",
          role: changed ? "active" : "discarded",
        },
      ],
      pins: { 2: `render ${pass + 1}` },
      note: previous
        ? `Render ${pass + 1}. \`Object.is\` on each dependency against the last render's: userId → ${verdicts[0]}, options → ${verdicts[1]}. ${
            changed
              ? "One of them differs, so the effect re-runs — cleanup first, then the effect body."
              : "Both match, so React skips the effect entirely."
          }`
        : "The first render. There is no previous list to compare against, so the effect always runs once.",
    });

    previous = deps;
  }

  rec.push({
    kind: "sequence",
    items: [
      { id: "s1", label: "userId changed once", role: "unchanged" },
      { id: "s2", label: "options changed every render", role: "updated" },
      { id: "s3", label: `${effectRuns} effect runs, 3 renders`, role: "active" },
    ],
    note: `\`userId\` only changed once, but the effect ran ${effectRuns} times — because \`options\` is an object literal, and an object literal is a new object every render. That is the runaway effect, and it is a comparison working exactly as documented.`,
  });

  return {
    frames: rec.frames,
    summary:
      "React compares each dependency with the previous render's using `Object.is`, and re-runs the effect if any of them differs. That is a reference comparison, so a primitive behaves the way you expect and an object or function literal does not: rebuilt on every render, it is a new value every time, and the effect runs every time. The fix is almost never to remove it from the array — that just hides a stale closure. It is to stop creating a new one: move the literal out of the component, compute it with `useMemo`, or depend on the primitive fields you actually read.",
  };
}

/* ------------------------------------------------- 6. ref or state -- */

/**
 * The one difference that decides between a ref and state.
 *
 * Both stores are real objects and both writes really happen; the render
 * count is incremented only where the mechanism increments it, so the
 * "no render" claim is produced rather than stated.
 */
function refVsState(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const ref = { current: 0 };
  let stateValue = 0;
  let renders = 1;
  let onScreen = { ref: ref.current, state: stateValue };

  const emit = (roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "ref", label: `ref.current = ${ref.current}`, role: roles[0] },
        { id: "state", label: `state = ${stateValue}`, role: roles[1] },
        { id: "screen", label: `screen: ref ${onScreen.ref}, state ${onScreen.state}`, role: roles[2] },
      ],
      pins: { 2: `${renders} render${renders === 1 ? "" : "s"}` },
      note,
    });

  emit({ 0: "unchanged", 1: "unchanged", 2: "unchanged" }, "A ref and a piece of state, both holding 0, both rendered to the screen.");

  /* Writing a ref is an assignment to a property. Nothing schedules. */
  ref.current += 1;
  rec.bump("ref writes");
  emit({ 0: "updated", 2: "discarded" }, "`ref.current += 1`. The write succeeded — the box holds 1 — and nothing was scheduled, because assigning to a property is not a call into React. The screen still shows 0.");

  ref.current += 1;
  rec.bump("ref writes");
  emit({ 0: "updated", 2: "discarded" }, "Again. The ref is at 2 and the screen has not moved. This is exactly the behaviour you want for something the user must never see change — a timer id, a previous value, a scroll position.");

  /* Setting state schedules a render, which is what makes the screen catch up
     with both values at once. */
  stateValue += 1;
  renders++;
  rec.bump("renders");
  onScreen = { ref: ref.current, state: stateValue };
  emit({ 1: "active", 2: "updated" }, `\`setState\` schedules a render. On that pass the component reads both boxes, so the screen catches up with the ref too — showing ${onScreen.ref}, a number no ref write ever asked to display.`);

  emit(
    { 0: "unchanged", 1: "unchanged", 2: "unchanged" },
    "Which is the trap. A ref that is rendered looks like it works, because some other state eventually forces a pass. It is stale for an unpredictable length of time, and the bug appears when the unrelated update stops happening.",
  );

  return {
    frames: rec.frames,
    summary:
      "A ref is a mutable box; writing to it is a property assignment and schedules nothing. State is a request to React, and it schedules a render. That single difference is the whole decision: if the value appears on screen it must be state, because a ref will show a stale number until some unrelated update forces a pass — which looks like it works until the day nothing else updates. If the value must survive renders but must never cause one — a timeout id, an observer, the previous value of a prop — a ref is exactly right.",
  };
}

/* ----------------------------------------- 7. controlled inputs -- */

/**
 * The round trip a controlled input makes on every keystroke, and the two
 * ways it is broken.
 *
 * The value on screen is computed from whichever box actually owns it, so the
 * frozen input is frozen because nothing wrote to React's copy — not because
 * a caption says so.
 */
function controlledInput(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* Two separate boxes, because that separation is the entire subject. React's
     copy changes when a setter runs; the DOM node's copy changes only when a
     commit writes to it, or when the user types into an input React is not
     controlling. Collapsing them into one variable would draw the round trip
     as though it had no steps. */
  let reactValue = "";
  let domValue = "";

  const emit = (stage: string, roles: Record<number, Role>, note: string, owned = true) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "state", label: owned ? `React state: "${reactValue}"` : "React state: none", role: roles[0] },
        { id: "dom", label: `input shows: "${domValue}"`, role: roles[1] },
        { id: "stage", label: stage, role: roles[2] },
      ],
      note,
    });

  /* --- controlled, wired correctly --- */
  emit("idle", { 0: "unchanged", 1: "unchanged" }, "A controlled input: `value={text}` and `onChange={e => setText(e.target.value)}`. Two copies of the text, and React's is the one that decides.");

  emit("keypress \"h\"", { 2: "active" }, "The user presses a key. The browser fires a change event carrying the character — and neither box has moved yet.");

  reactValue = "h";
  rec.bump("renders");
  emit("onChange → setState", { 0: "updated", 2: "active" }, `\`onChange\` reads \`e.target.value\` and sets state to "${reactValue}". React's copy has changed; the input on screen still shows "${domValue}", because nothing has rendered yet.`);

  domValue = reactValue;
  emit("render → commit", { 0: "unchanged", 1: "updated" }, "The render writes `value` onto the DOM node and the letter finally appears. One keystroke, four steps, all of them through React — that is what \"controlled\" costs and what it buys.");

  /* --- the frozen input: `value` with no `onChange` --- */
  reactValue = "";
  domValue = "";
  emit("value, no onChange", { 0: "unchanged", 1: "unchanged" }, "Now the same input with `value={text}` and no `onChange`. It looks identical.");

  emit("keypress \"h\"", { 2: "active" }, "The user types. The event fires, nobody is listening, and React's copy is untouched…");

  /* The DOM value is re-derived from React's copy on every render, so with
     nothing writing to that copy the node is put back the way it was. */
  domValue = reactValue;
  emit("React re-asserts value", { 0: "discarded", 1: "discarded" }, `…so \`value\` is still "${reactValue}", and React puts "${reactValue}" back on the node. The input is not read-only and it is not broken: it is correctly displaying a state that never changes.`);

  /* --- uncontrolled: the DOM owns it --- */
  reactValue = "";
  domValue = "";
  emit("uncontrolled: defaultValue", { 1: "unchanged" }, "The other arrangement: `defaultValue` and no `value`. React writes the initial text once and then stops having an opinion.", false);

  domValue = "h";
  emit("keypress \"h\"", { 1: "updated" }, "The user types and the DOM node updates itself. No handler, no state, no render — which is why this costs nothing per keystroke, and why there is nothing to validate against until submit.", false);

  return {
    frames: rec.frames,
    summary:
      "A controlled input has no memory of its own: React renders `value` onto it, so the text can only change if state changes first. Every keystroke is a full round trip — event, setState, render, DOM write — and the two copies are briefly out of step in the middle of it, which is exactly why the value is yours to validate, format or reject. Leave the `onChange` off and the input is not read-only; it is correctly displaying a state that never changes. An uncontrolled input hands the value back to the DOM node: free per keystroke, and nothing to read until submit.",
  };
}

/* ------------------------------------------ 8. resetting with a key -- */

/**
 * What changing a key does to the state underneath it.
 *
 * The instance table is real: a keyed instance is looked up by key, reused
 * when found and constructed when not, so the state that survives is the
 * state that genuinely survived the lookup.
 */
function resetByKey(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* React's own bookkeeping, in miniature: what exists at this position. */
  let mounted: { key: string; draft: string } | null = null;

  const render = (key: string): { reused: boolean } => {
    if (mounted && mounted.key === key) return { reused: true };
    mounted = { key, draft: "" };
    return { reused: false };
  };

  const emit = (selected: string, roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "sel", label: `selected user: ${selected}`, role: roles[0] },
        { id: "key", label: `<Form key="${mounted?.key}">`, role: roles[1] },
        { id: "draft", label: `draft: "${mounted?.draft}"`, role: roles[2] },
      ],
      note,
    });

  render("ada");
  rec.bump("mounts");
  emit("ada", { 1: "mounted", 2: "mounted" }, "A form for Ada, keyed by her id. React has no instance at this position yet, so it mounts one with fresh state.");

  mounted!.draft = "half a sente";
  emit("ada", { 2: "active" }, "The user types. The draft lives in the form's own state, which is where a half-finished edit belongs.");

  /* Same key: the lookup finds the existing instance, so state survives. */
  const same = render("ada");
  emit("ada", { 1: "unchanged", 2: "unchanged" }, `A re-render with the same key. The lookup ${same.reused ? "finds the existing instance" : "misses"}, so the state is untouched — this is the ordinary case, and it is why a form does not lose your typing every time the parent renders.`);

  /* Different key: the lookup misses, the old instance is destroyed and a new
     one constructed. The draft is gone because it belonged to the old one. */
  const switched = render("grace");
  rec.bump("mounts");
  rec.bump("unmounts");
  emit("grace", { 0: "updated", 1: "mounted", 2: "mounted" }, `Now the parent selects Grace, so the key changes. The lookup ${switched.reused ? "reuses" : "misses"} — React unmounts the old instance and constructs a new one, and the draft is gone because it belonged to the instance that no longer exists.`);

  emit("grace", { 1: "unchanged", 2: "unchanged" }, "That is the whole trick. No effect watching a prop, no manual clearing, no window in which the form shows Ada's text under Grace's name. One attribute, and the reset is a consequence of identity rather than a thing you remembered to do.");

  return {
    frames: rec.frames,
    summary:
      "React matches a component to its previous instance by position and key. Keep the key and the instance — and its state — is reused; change it and the old instance is unmounted and a new one constructed with fresh state. So `key={user.id}` on a form is a complete answer to \"clear this when the selection changes\": the reset is a consequence of the identity changing, not a step someone has to remember. The alternative — an effect that watches the prop and clears the fields — runs after the commit, which means one render in which the new user's form shows the old user's text.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_STATE_ALGOS = {
  snapshot: {
    label: "State is a snapshot",
    run: snapshot,
  },
  batching: {
    label: "Batching, and flushSync",
    run: batching,
  },
  "mutate-vs-copy": {
    label: "Mutation against Object.is",
    run: mutateVsCopy,
  },
  "derived-state": {
    label: "Derived state, stored or computed",
    run: derivedState,
  },
  "deps-compare": {
    label: "The dependency array, compared",
    run: depsCompare,
  },
  "ref-vs-state": {
    label: "A ref writes; state renders",
    run: refVsState,
  },
  "controlled-input": {
    label: "A controlled input's round trip",
    run: controlledInput,
  },
  "reset-by-key": {
    label: "Resetting state with a key",
    run: resetByKey,
  },
} as const;

export type ReactStateName = keyof typeof REACT_STATE_ALGOS;
