/**
 * Three mechanisms that belong to one lesson each.
 *
 * `attributeMapping` is the odd one out and says so here: the prop-to-
 * attribute table is React's, transcribed, not measured — a frame generator
 * has no DOM to render into. What it does run is the *rule* that decides
 * between the three cases, over every entry in the table.
 *
 * `debounceTimer` runs a real timer state machine on a virtual clock, so the
 * number of calls that survive is what the implementation allowed through.
 * `handlerMatching` runs a real request matcher over real handler patterns.
 */
import { Recorder, type Role, type SequenceFrame, type Visualisation } from "./types";

/* ----------------------------------------- 1. props to DOM attributes -- */

/**
 * The three things React can do with a prop on a host element.
 *
 * The table is transcribed from React's documented behaviour rather than
 * measured. What is computed here is the classification: each entry is put
 * through one rule — reserved, renamed, or passed straight through — and the
 * frames report which branch it took.
 */
function attributeMapping(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const RENAMED: Record<string, string> = {
    className: "class",
    htmlFor: "for",
    tabIndex: "tabindex",
    autoComplete: "autocomplete",
  };
  const RESERVED = new Set(["key", "ref", "children", "dangerouslySetInnerHTML"]);

  /** The rule, applied rather than described. */
  const classify = (prop: string): { kind: "reserved" | "renamed" | "through"; as: string } => {
    if (RESERVED.has(prop)) return { kind: "reserved", as: "never reaches the DOM" };
    if (RENAMED[prop]) return { kind: "renamed", as: RENAMED[prop]! };
    if (/^(data|aria)-/.test(prop)) return { kind: "through", as: prop };
    if (prop === "style") return { kind: "renamed", as: "style (from an object)" };
    if (/^on[A-Z]/.test(prop)) return { kind: "reserved", as: "a React event handler" };
    return { kind: "through", as: prop.toLowerCase() === prop ? prop : prop.toLowerCase() };
  };

  const PROPS = [
    "id",
    "className",
    "htmlFor",
    "tabIndex",
    "style",
    "data-testid",
    "aria-label",
    "onClick",
    "key",
    "children",
    "customThing",
  ];

  const shown: { id: string; label: string; role?: Role }[] = [];

  const emit = (probe: { id: string; label: string; role?: Role }[], note: string) =>
    rec.push({ kind: "sequence", items: [...probe, ...shown], note });

  emit([], "Every prop on a host element takes one of three routes. The table React uses is transcribed here rather than measured — there is no DOM in a frame generator — but the rule that sorts them is run over every entry.");

  const NOTES: Record<string, string> = {
    id: "Most props pass straight through under their own name. `id` is `id`.",
    className: "`class` is a reserved word in JavaScript, so the prop is `className` and React renames it on the way out. This is the rename people actually hit.",
    htmlFor: "`for` is reserved too — it is a loop keyword — so the label's attribute is `htmlFor`.",
    tabIndex: "Camel-cased because the *DOM property* is `tabIndex`; the attribute it becomes is lower-case. React follows the property names, not the attribute names, which is why the casing looks inconsistent until you know which list it is following.",
    style: "`style` takes an object, not a string, and React writes each entry onto the node's style. Camel-cased keys, and numbers get `px` appended for the properties that take a length.",
    "data-testid": "`data-*` and `aria-*` are the two families passed through **exactly as written**, hyphens and all — which is why these two are the only lower-case-with-hyphens props in React.",
    "aria-label": "The other one, for the same reason. Every other attribute would be camel-cased.",
    onClick: "An `onSomething` prop is not an attribute at all. React registers it in its own event system and nothing appears on the node — which is why you cannot find the handler by inspecting the DOM.",
    key: "`key` never reaches the DOM and never reaches the component either. It is React's, for reconciliation.",
    children: "`children` is not an attribute; it is what goes inside the element.",
    customThing: "And an unknown prop is passed through lower-cased. Since React 16 this does not warn — which is convenient for web components and a silent typo trap for everything else: `classname` becomes an attribute rather than a mistake.",
  };

  for (const prop of PROPS) {
    const result = classify(prop);
    rec.bump(result.kind);
    emit(
      [
        { id: "p", label: prop, role: "active" },
        {
          id: "o",
          label: `→ ${result.as}`,
          role: result.kind === "reserved" ? "discarded" : result.kind === "renamed" ? "updated" : "found",
        },
      ],
      NOTES[prop]!,
    );
    shown.push({
      id: `s${shown.length}`,
      label: `${prop} → ${result.as}`,
      role: result.kind === "reserved" ? "discarded" : result.kind === "renamed" ? "updated" : "unchanged",
    });
  }

  emit([], "Four renamed, four reserved, three straight through. The only two you have to remember are `className` and `htmlFor`, because they are the ones where the JavaScript keyword forced a different name — everything else follows from the DOM property names.");

  return {
    frames: rec.frames,
    summary:
      "A prop on a host element is renamed, reserved, or passed through. Renamed covers the handful where the DOM attribute collides with a JavaScript keyword — `className` for `class`, `htmlFor` for `for` — plus the camel-cased ones that follow the DOM *property* names rather than the attribute names. Reserved covers `key`, `ref`, `children` and every `onSomething` handler, none of which reach the node at all. Everything else passes through, including `data-*` and `aria-*` exactly as written, and including unknown props — which since React 16 no longer warn, so a misspelled `classname` becomes a real attribute instead of an error.",
  };
}

/* ------------------------------------------------------ 2. debouncing -- */

/**
 * A debounce, run on a virtual clock.
 *
 * The timer is a real value that is really cleared and really reset, and the
 * committed calls are the ones the implementation let through — so the count
 * at the end is a result rather than a promise.
 */
function debounceTimer(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const DELAY = 300;
  let now = 0;
  let timer: { fireAt: number; value: string } | null = null;
  const committed: string[] = [];
  let cancelled = 0;

  const emit = (event: string, roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "t", label: `t = ${now}ms`, role: roles[0] },
        { id: "e", label: event, role: roles[1] },
        { id: "p", label: timer ? `pending: "${timer.value}" at ${timer.fireAt}ms` : "pending: none", role: roles[2] },
        { id: "c", label: `committed: ${committed.length ? committed.map((c) => `"${c}"`).join(", ") : "none"}`, role: roles[3] },
      ],
      note,
    });

  /** Advance the clock, firing the timer if it comes due. */
  const tick = (ms: number) => {
    const target = now + ms;
    if (timer && timer.fireAt <= target) {
      now = timer.fireAt;
      committed.push(timer.value);
      timer = null;
      rec.bump("committed");
      emit("timer fires", { 1: "found", 3: "updated" }, `${DELAY}ms passed with no new keystroke, so the pending value is committed. This is the only place the expensive thing — a request, a filter over ten thousand rows — actually happens.`);
    }
    now = target;
  };

  /** A keystroke: cancel whatever was pending and start again. */
  const type = (value: string, note: string) => {
    if (timer) {
      cancelled++;
      rec.bump("cancelled");
    }
    timer = { fireAt: now + DELAY, value };
    rec.bump("keystrokes");
    emit(`types "${value}"`, { 1: "active", 2: "updated" }, note);
  };

  emit("idle", { 0: "unchanged" }, `A debounce with a ${DELAY}ms delay. Nothing pending, nothing committed.`);

  type("h", "First keystroke. A timer is set for 300ms from now — and nothing else happens.");
  tick(100);
  type("ho", "Another keystroke 100ms later. The pending timer is **cleared** and a new one set, so the first value never fires. That clearing is the whole mechanism, and it is what a `useEffect` cleanup does.");
  tick(80);
  type("hos", "And again, 80ms after that. Two cancellations so far.");
  tick(400);

  emit("settled", { 3: "found" }, `Three keystrokes, ${cancelled} cancellations, ${committed.length} commit. The user typed three characters and one request went out.`);

  type("hose", "Then a fourth character after the pause.");
  tick(400);

  emit(
    "done",
    { 3: "found" },
    `Four keystrokes total and ${committed.length} commits — not one, because a debounce is not \`take the last one\`, it is \`fire when things go quiet\`. A pause in the middle of typing produces a commit, which is exactly what you want for a search box and exactly what surprises people who expected one.`,
  );

  return {
    frames: rec.frames,
    summary:
      "A debounce sets a timer and clears it every time a new event arrives, so the work runs only after things have been quiet for the delay. Written as a hook, the clearing is the effect's cleanup — which is the reason a debounce is one of the few genuinely correct uses of `useEffect`: it synchronises with an external system, the timer, and its teardown is what makes it work. The behaviour people get wrong is thinking it fires once at the end. It fires after every pause, so four characters with a gap in the middle produce two commits, not one.",
  };
}

/* ------------------------------------------- 3. matching a request -- */

/**
 * How a request handler is chosen, run.
 *
 * The matcher is real: method equality plus a path pattern compiled to a
 * regular expression, first match wins. So a frame reporting that a request
 * fell through to no handler is reporting what the matcher returned, which is
 * the case `onUnhandledRequest: "error"` exists to catch.
 */
function handlerMatching(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const HANDLERS = [
    { method: "GET", path: "/api/users" },
    { method: "GET", path: "/api/projects/:projectId/issues" },
    { method: "GET", path: "/api/issues/:id" },
    { method: "POST", path: "/api/issues/:id/comments" },
  ];

  /** `:param` becomes a segment wildcard; everything else is literal. */
  const toRegExp = (path: string) =>
    new RegExp(`^${path.replace(/:[A-Za-z]+/g, "[^/]+").replace(/\//g, "\\/")}$`);

  const match = (method: string, url: string) =>
    HANDLERS.findIndex((h) => h.method === method && toRegExp(h.path).test(url));

  const REQUESTS = [
    { method: "GET", url: "/api/users", why: "An exact literal path. The first handler matches and the request never reaches the network." },
    { method: "GET", url: "/api/projects/p_web/issues", why: "`:projectId` matched one path segment. The parameter is a wildcard, not a value the handler had to predict." },
    { method: "GET", url: "/api/projects/p_web/issues?status=open", why: "And the query string — which is *not* part of the path, so the same handler matches. Filtering on it is the handler's job, done by reading the URL, not something the pattern can express." },
    { method: "POST", url: "/api/issues/i_1/comments", why: "Method is part of the match. The GET handler for a similar path is skipped, and the POST one is chosen." },
    { method: "PATCH", url: "/api/issues/i_1", why: "And the case that matters. No handler declares PATCH, so nothing matches — the request falls through. With `onUnhandledRequest: \"error\"` that fails the test; without it, it silently hits the real network or hangs." },
  ];

  for (const request of REQUESTS) {
    /* Query strings are not part of the path, which is a real property of the
       matcher rather than a note about it. */
    const path = request.url.split("?")[0]!;
    const hit = match(request.method, path);
    rec.bump(hit === -1 ? "unhandled" : "handled");

    rec.push({
      kind: "sequence",
      items: [
        { id: "req", label: `${request.method} ${request.url}`, role: "active" },
        ...HANDLERS.map((h, i) => ({
          id: `h${i}`,
          label: `${h.method} ${h.path}`,
          role: i === hit ? ("found" as Role) : ("discarded" as Role),
        })),
        { id: "out", label: hit === -1 ? "no handler" : "intercepted", role: hit === -1 ? "stale" : "updated" },
      ],
      note: request.why,
    });
  }

  rec.push({
    kind: "sequence",
    items: [
      { id: "a", label: "4 of 5 intercepted", role: "found" },
      { id: "b", label: "1 fell through", role: "stale" },
    ],
    note: "Handlers describe the network, not your modules — so everything below the wire runs for real: the hook, the fetch wrapper, the response parsing. The one setting worth turning on is `onUnhandledRequest: \"error\"`, which turns that fifth row from a silent hang into a failing test naming the request nobody covered.",
  });

  return {
    frames: rec.frames,
    summary:
      "A request handler is chosen by method and by a path pattern in which `:param` matches one segment, first match wins, and the query string is not part of the path — so one handler covers every filter combination and reads them from the URL itself. Because the interception happens at the network rather than at the module, the hook, the fetch wrapper and the response parsing all run for real, and a wrong URL or a changed schema is caught. The request that matches nothing is the important case, and `onUnhandledRequest: \"error\"` is what turns it from a silent hang into a failing test that names it.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_MISC_ALGOS = {
  "attribute-mapping": {
    label: "Props to DOM attributes",
    run: attributeMapping,
  },
  "debounce-timer": {
    label: "A debounce, on a clock",
    run: debounceTimer,
  },
  "handler-matching": {
    label: "Which handler answers a request",
    run: handlerMatching,
  },
} as const;

export type ReactMiscName = keyof typeof REACT_MISC_ALGOS;
