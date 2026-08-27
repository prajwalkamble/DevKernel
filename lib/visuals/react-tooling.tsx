/**
 * The tools around the code: how a test finds an element, what a click really
 * dispatches, and how a bundler decides what goes in which file.
 *
 * Two of these run an algorithm. The query ladder is Testing Library's
 * documented priority order implemented as predicates over a small element
 * model, so which query wins is *computed* from the element's attributes —
 * delete the label and the animation drops to the next rung on its own. The
 * chunk splitter is a real graph walk: reachability from each entry, with a
 * module reachable from two chunks hoisted into a shared one.
 *
 * The third is recorded data rather than a simulation, and is marked as such
 * where it appears. Nothing in a lesson page can run `userEvent`, so the event
 * list below was captured from a real test run and pasted, the same way the
 * generated project listing in `react-layout.ts` was read off a real scaffold.
 */
import {
  Recorder,
  type BucketFrame,
  type Role,
  type SequenceFrame,
  type Visualisation,
} from "./types";

/* ------------------------------------------------------- 1. the query ladder -- */

interface El {
  id: string;
  tag: string;
  text?: string;
  attrs: Record<string, string>;
  /** The id of a <label for=…> pointing at this element, if there is one. */
  labelledBy?: string;
}

/** The page under test. Ordinary markup, with one deliberately bare input. */
const MARKUP: El[] = [
  { id: "e1", tag: "button", text: "Save", attrs: {} },
  { id: "e2", tag: "input", attrs: { type: "email", placeholder: "you@example.com" }, labelledBy: "Email address" },
  { id: "e3", tag: "input", attrs: { type: "search", placeholder: "Search posts" } },
  { id: "e4", tag: "img", attrs: { src: "/a.png", alt: "Ada Lovelace" } },
  { id: "e5", tag: "p", text: "3 results", attrs: {} },
  { id: "e6", tag: "div", attrs: { "data-testid": "toast" } },
];

/** The implicit ARIA role for the handful of tags this model needs. */
function roleOf(el: El): string | null {
  if (el.tag === "button") return "button";
  if (el.tag === "img") return el.attrs.alt === undefined ? null : "img";
  if (el.tag === "a") return "link";
  if (el.tag === "input") {
    if (el.attrs.type === "search") return "searchbox";
    if (el.attrs.type === "checkbox") return "checkbox";
    return "textbox";
  }
  return null;
}

/** The accessible name, by the two sources this model covers. */
function accessibleName(el: El): string | null {
  return el.attrs["aria-label"] ?? el.labelledBy ?? el.text ?? el.attrs.alt ?? null;
}

interface Rung {
  name: string;
  /** Why this rung sits where it does in the ladder. */
  why: string;
  find: (el: El) => string | null;
}

/**
 * Testing Library's priority order, as predicates.
 *
 * The order is the library's own: what everyone can perceive first, then what a
 * sighted user perceives, then what nobody perceives at all. Each `find`
 * returns the argument the query would be called with, or null if this rung
 * cannot see the element.
 */
const LADDER: Rung[] = [
  {
    name: "getByRole",
    why: "Everybody's experience: the role is what a screen reader announces and what a mouse user sees the shape of. A test that finds a button by its role fails when the button stops being a button — which is a failure worth having.",
    find: (el) => {
      const role = roleOf(el);
      const name = accessibleName(el);
      return role && name ? `"${role}", { name: "${name}" }` : null;
    },
  },
  {
    name: "getByLabelText",
    why: "Form fields. The label is how a user is told what the field is for, so it is the right handle for the field — and a field with no label is a bug the test is entitled to notice.",
    find: (el) => (el.labelledBy ? `"${el.labelledBy}"` : null),
  },
  {
    name: "getByPlaceholderText",
    why: "A fallback for a field with no label. Note what accepting it concedes: a placeholder disappears as soon as the user types, so it is not a label, and reaching this rung usually means the markup should be fixed rather than the query chosen.",
    find: (el) => (el.attrs.placeholder ? `"${el.attrs.placeholder}"` : null),
  },
  {
    name: "getByText",
    why: "Non-interactive content — the paragraph, the heading, the error message. This is the ordinary way to assert what the page says.",
    find: (el) => (el.text && roleOf(el) === null ? `"${el.text}"` : null),
  },
  {
    name: "getByAltText",
    why: "Images, when the role query has not already covered them.",
    find: (el) => (el.attrs.alt ? `"${el.attrs.alt}"` : null),
  },
  {
    name: "getByTestId",
    why: "The last rung, and the only one no user can perceive. Legitimate for something with no text, no role and no label — a toast container, a canvas — and a smell everywhere else, because a test that only passes because of an attribute you added for the test is not testing the interface anybody uses.",
    find: (el) => (el.attrs["data-testid"] ? `"${el.attrs["data-testid"]}"` : null),
  },
];

function queryLadderRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const chosen = new Map<string, string>();

  const emit = (note: string, elementId: string | null, rung: number | null) =>
    rec.push({
      kind: "sequence",
      items: LADDER.map((r, i) => ({
        id: r.name,
        label: r.name.replace("getBy", ""),
        role: i === rung ? "active" : rung !== null && i < rung ? "discarded" : undefined,
      })),
      pins: elementId
        ? { 0: `looking for <${MARKUP.find((e) => e.id === elementId)!.tag}>` }
        : {},
      note,
    });

  emit("Testing Library's query priority, top to bottom. The rule is not a style preference: each rung down is one step further from what a user can actually perceive.", null, null);

  for (const el of MARKUP) {
    emit(`Finding the <${el.tag}>${el.text ? ` that says "${el.text}"` : ""}. Start at the top.`, el.id, null);
    for (let i = 0; i < LADDER.length; i++) {
      const found = LADDER[i].find(el);
      rec.bump("rungs tried");
      if (!found) {
        emit(`${LADDER[i].name} cannot see it — nothing here for that query to match on.`, el.id, i);
        continue;
      }
      chosen.set(el.id, `${LADDER[i].name}(${found})`);
      rec.bump("elements matched");
      emit(`${LADDER[i].name}(${found}). ${LADDER[i].why}`, el.id, i);
      break;
    }
  }

  emit(
    `Six elements, and the ladder placed each one by what the markup offers: ${[...chosen.values()].filter((q) => q.startsWith("getByRole")).length} by role, and exactly one that had to fall all the way to a test id — the div that a user genuinely cannot perceive.`,
    null,
    null
  );

  return {
    frames: rec.frames,
    summary:
      "Testing Library's query priority is a ladder, and the position of a query on it measures how far the test has drifted from the user's experience. getByRole first, because a role plus an accessible name is what everybody — mouse, keyboard, screen reader — actually has. getByTestId last, because it is an attribute added for the test and invisible to every user, so a test that leans on it can pass over an interface nobody can operate. When you find yourself reaching down the ladder, the usual fix is to the markup, not to the query.",
  };
}

/* ------------------------------------------------------ 2. what a click is -- */

/**
 * Recorded, not simulated — and the provenance matters, so here it is.
 *
 * These two lists were captured by attaching listeners for every pointer, mouse
 * and focus event to a real `<button>` in a real jsdom test and calling each
 * API once. They are pasted here for the same reason the generated scaffold in
 * `react-layout.ts` is: nothing on a lesson page can run Testing Library, and a
 * remembered list of events is exactly the sort of thing that is wrong in a way
 * nobody notices.
 */
const USER_EVENT_CLICK = [
  "pointerover", "pointerenter", "mouseover", "mouseenter", "pointermove", "mousemove",
  "pointerdown", "mousedown", "focus", "focusin", "pointerup", "mouseup", "click",
];
const FIRE_EVENT_CLICK = ["click"];

const EVENT_NOTE: Record<string, string> = {
  pointerover: "The pointer arrives over the element. A hover tooltip, a menu that opens on hover, a CSS :hover state — all of this begins here, and fireEvent skips every bit of it.",
  mouseenter: "mouseenter does not bubble, which is precisely why components use it and why a synthetic click that never fires it can leave a dropdown closed.",
  pointerdown: "The button goes down. Anything implementing a drag, a long-press or a custom focus ring starts on this one.",
  focus: "The browser focuses the element as part of the click. A test that never fires this can pass against a form that traps focus incorrectly.",
  click: "And finally the click itself — the only event fireEvent.click dispatches, and the last of thirteen a real click produces.",
};

function clickRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const emit = (list: string[], upTo: number, note: string) =>
    rec.push({
      kind: "sequence",
      items: list.map((name, i) => ({
        id: `${name}-${i}`,
        label: name.replace(/^pointer/, "ptr·").replace(/^mouse/, "mse·"),
        role: i === upTo ? "active" : i < upTo ? "unchanged" : undefined,
      })),
      note,
    });

  emit(FIRE_EVENT_CLICK, -1, "fireEvent.click(button) — one line of test code. Here is everything it dispatches.");
  emit(FIRE_EVENT_CLICK, 0, "One event. If the component under test opens on pointerdown, or depends on having been focused, this test is asserting against something a user cannot do.");

  emit(USER_EVENT_CLICK, -1, "await user.click(button) — the same one line, with userEvent instead.");
  USER_EVENT_CLICK.forEach((name, i) => {
    rec.bump("events dispatched");
    emit(USER_EVENT_CLICK, i, EVENT_NOTE[name] ?? `${name}, in the order a browser produces it.`);
  });

  emit(
    USER_EVENT_CLICK,
    USER_EVENT_CLICK.length - 1,
    `Thirteen events against one. That gap is the whole argument for userEvent: fireEvent tests that your handler works, userEvent tests that a user can reach it.`
  );

  return {
    frames: rec.frames,
    summary:
      "fireEvent dispatches exactly the event you name. userEvent dispatches the sequence a browser really produces for that interaction — pointer, mouse, focus and finally click, thirteen events for one click — which is why it catches the class of bug where the handler is fine and the element is unreachable: disabled, covered, never focused, or listening on pointerdown. userEvent is async and must be awaited, and that is the only cost.",
  };
}

/* --------------------------------------------------------- 3. code splitting -- */

interface Mod {
  id: string;
  kb: number;
  imports: string[];
  /** Imports reached through React.lazy — a boundary, not an edge. */
  lazy?: string[];
}

/** A small app's module graph, with two routes loaded lazily. */
const GRAPH: Mod[] = [
  { id: "main", kb: 3, imports: ["App", "react"], lazy: ["Editor", "Chart"] },
  { id: "App", kb: 8, imports: ["ui"] },
  { id: "react", kb: 45, imports: [] },
  { id: "ui", kb: 12, imports: [] },
  { id: "Editor", kb: 6, imports: ["ui", "markdown"] },
  { id: "markdown", kb: 60, imports: [] },
  { id: "Chart", kb: 5, imports: ["ui", "d3"] },
  { id: "d3", kb: 90, imports: [] },
];

/**
 * The chunking rule, run.
 *
 * Reachability from each entry, then: a module reachable from more than one
 * entry is hoisted into a shared chunk, and a module reachable from exactly one
 * stays in it. `ui` ending up shared, and `markdown` not, are results of the
 * graph above rather than a decision typed in here — add an import of
 * `markdown` to `Chart` and it moves on its own.
 */
function chunkRun(): Visualisation {
  const rec = new Recorder<BucketFrame>();
  const byId = new Map(GRAPH.map((m) => [m.id, m]));

  const reach = (start: string): Set<string> => {
    const seen = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const next of byId.get(id)!.imports) stack.push(next);
    }
    return seen;
  };

  const entries = ["main", ...(byId.get("main")!.lazy ?? [])];
  const owners = new Map<string, string[]>();

  const chunks = new Map<string, string[]>(entries.map((e) => [e, []]));
  chunks.set("shared", []);

  const emit = (note: string, active?: string) =>
    rec.push({
      kind: "buckets",
      buckets: [...chunks.entries()].map(([name, mods]) => ({
        key: name === "main" ? "main" : name === "shared" ? "share" : name.slice(0, 5),
        items: mods.map((m) => `${m} ${byId.get(m)!.kb}kB`),
        role: name === active ? ("active" as Role) : undefined,
      })),
      note,
    });

  emit("Three entry points: the app itself, and two routes behind React.lazy. Nothing has been assigned yet.");

  for (const entry of entries) {
    const reached = reach(entry);
    rec.bump("modules walked", reached.size);
    for (const mod of reached) {
      owners.set(mod, [...(owners.get(mod) ?? []), entry]);
    }
    emit(`Walking the imports of ${entry}: ${[...reached].join(", ")}.`, entry);
  }

  for (const [mod, entriesFor] of owners) {
    const target = entriesFor.length > 1 ? "shared" : entriesFor[0];
    chunks.get(target)!.push(mod);
    rec.bump("kB placed", byId.get(mod)!.kb);
    emit(
      entriesFor.length > 1
        ? `${mod} is reachable from ${entriesFor.length} entries, so it goes in a shared chunk — downloaded once, used by all of them. Duplicating it into each would be smaller per route and larger overall.`
        : `${mod} is only reachable from ${target}, so it goes in that chunk and downloads only when that route does.`,
      target
    );
  }

  const initial = [...chunks.get("main")!, ...chunks.get("shared")!]
    .reduce((sum, m) => sum + byId.get(m)!.kb, 0);
  const total = GRAPH.reduce((sum, m) => sum + m.kb, 0);
  emit(`${initial}kB downloads on first load instead of ${total}kB. The ${total - initial}kB in the two route chunks — the markdown parser and the charting library — arrives only if the user goes there.`);

  return {
    frames: rec.frames,
    summary:
      "A bundler starts from your entry points, follows the imports, and puts what it reaches into a chunk. React.lazy creates another entry point, which is the whole mechanism: the dynamic import is a boundary the walk cannot cross eagerly, so everything behind it becomes its own file. A module reached from more than one entry is hoisted into a shared chunk rather than duplicated. Nothing about this is React-specific — which is why the useful question is 'what is only needed on one route', not 'where should I put a lazy'.",
  };
}

/* --------------------------------------------------------------- registry -- */

export const REACT_TOOLING_ALGOS = {
  "query-priority": { label: "Which query Testing Library wants", run: queryLadderRun },
  "click-events": { label: "fireEvent against userEvent", run: clickRun },
  "code-splitting": { label: "How a bundle is split", run: chunkRun },
} as const;

export type ReactToolingAlgoName = keyof typeof REACT_TOOLING_ALGOS;
