/**
 * Concurrent rendering, animated by running a scheduler.
 *
 * The same rule as everywhere else in this directory: nothing here is a drawing
 * of what concurrent React is remembered to do. Each generator is a small,
 * complete implementation of the *rule* the lesson teaches — a work loop that
 * really does check its queue between units, a boundary search that really does
 * walk up the ancestor stack, an event queue whose out-of-order outcome is a
 * consequence of the latencies it was given. Change a rule and the animation
 * changes with it.
 *
 * What this is not, and the lessons say so: React's own scheduler, with its
 * lanes, its expiration times and its `MessageChannel` yielding. Reproducing
 * that would not make the picture more truthful; it would make it unreadable
 * while depicting the same three ideas — work can be split, work can be thrown
 * away, and some work is more urgent than other work.
 */
import type { ReactNode } from "react";
import { layout, read, type ElNode } from "./react";
import {
  Recorder,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type Visualisation,
} from "./types";

/* ------------------------------------------------- 1. blocking against not -- */

/**
 * One render, six components, and a keystroke that arrives part-way through.
 *
 * There is a real work loop here with a real event queue. `yields` is the only
 * difference between the two runs: when it is false the loop cannot look at the
 * queue until it has finished, so the keystroke waits; when it is true the loop
 * checks between units and finds it. The stalled input in the first run is
 * therefore something the loop *does*, not a caption asserting that it would.
 */
interface Unit {
  id: string;
  label: string;
}

const TREE_WORK: Unit[] = [
  { id: "w0", label: "App" },
  { id: "w1", label: "Nav" },
  { id: "w2", label: "List" },
  { id: "w3", label: "Row" },
  { id: "w4", label: "Row" },
  { id: "w5", label: "Row" },
];

/** When the user presses a key, measured in completed units of work. */
const KEYSTROKE_AT = 2;

function renderLoop(yields: boolean): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  /* The browser's event queue. The loop may only see it when it yields. */
  const pending: string[] = [];
  let done = 0;
  let discarded = false;

  const emit = (note: string, roles: (i: number) => Role | undefined, pin?: string) =>
    rec.push({
      kind: "sequence",
      items: TREE_WORK.map((unit, i) => ({
        id: `${unit.id}-${rec.frames.length}`,
        label: unit.label,
        role: roles(i),
      })),
      pins: pin === undefined ? {} : { [Math.min(done, TREE_WORK.length - 1)]: pin },
      note,
    });

  const progress = (i: number): Role | undefined =>
    i < done ? "unchanged" : i === done ? "active" : undefined;

  emit(
    yields
      ? "A render of six components is about to start. React will do them one at a time and look up between each one."
      : "A render of six components is about to start. Once it does, nothing else can run on this thread until it finishes.",
    () => undefined
  );

  while (done < TREE_WORK.length) {
    /* The keystroke lands in the browser's queue after two units of work,
       whatever the renderer is doing about it. */
    if (done === KEYSTROKE_AT && pending.length === 0 && !discarded) {
      pending.push("keystroke");
      emit(
        yields
          ? "The user presses a key. It goes into the event queue."
          : "The user presses a key. It goes into the event queue — where it will sit, because the thread is busy.",
        progress,
        "input queued"
      );
    }

    if (yields && pending.length > 0) {
      /* The whole of the difference: the loop can look at the queue, and what
         it has rendered so far is throwaway work, because nothing has been
         committed. */
      discarded = true;
      const stopped = done;
      emit(
        `React yields. There is input waiting, so the ${stopped} units rendered so far are thrown away — none of it was committed, so nothing on screen changes.`,
        (i) => (i < stopped ? "discarded" : undefined)
      );
      pending.pop();
      rec.bump("input handled");
      emit(
        "The keystroke is handled immediately: the input shows the new character. This is the responsiveness people mean by 'concurrent'.",
        () => undefined,
        "input handled"
      );
      done = 0;
      emit("Now the render restarts, from the top, with the newer state.", progress);
      continue;
    }

    rec.bump("units rendered");
    done++;
    emit(
      done === TREE_WORK.length
        ? "The last component is rendered. Only now is there a complete tree to commit."
        : `${TREE_WORK[done - 1].label} is rendered.`,
      (i) => (i < done ? "unchanged" : i === done ? "active" : undefined)
    );
  }

  emit("Commit. The DOM is updated in one go.", () => "mounted");

  if (!yields) {
    pending.pop();
    rec.bump("input handled");
    emit(
      `The keystroke is finally handled — ${TREE_WORK.length - KEYSTROKE_AT} units of work after it was pressed. That gap is the jank.`,
      () => "unchanged",
      "input handled"
    );
  }

  return {
    frames: rec.frames,
    summary: yields
      ? "Concurrent rendering means React can stop between units of work, look at what else needs doing, and throw away a render it has not committed. The keystroke is handled the moment it arrives; the render simply starts again with newer state. Work is wasted — the same components are rendered twice — and that is the trade: wasted work in exchange for an interface that answers."
      : "In the blocking model a render is one indivisible task. The keystroke arrives two units in and cannot be looked at until the sixth is done, because there is one thread and the renderer is on it. Nothing here is slow — the total work is identical to the concurrent run — but the input waits, and waiting is what a user perceives as jank.",
  };
}

/* ---------------------------------------------------- 2. Suspense boundary -- */

/**
 * A boundary search, run rather than drawn.
 *
 * `walk` renders a real element tree, and a component that is not ready throws
 * — the actual mechanism, a thrown value that unwinds the render. The walker
 * catches it and looks up the ancestor stack it is holding for the nearest
 * Suspense. Which boundary catches is therefore computed from the tree's shape;
 * move the boundary in `SUSPENSE_TREE` and the animation follows it.
 */
function Sidebar() { return null; }
Sidebar.displayName = "Sidebar";
function Post() { return null; }
Post.displayName = "Post";
function Comments() { return null; }
Comments.displayName = "Comments";
function Boundary({ children }: { children?: ReactNode }) { return children; }
Boundary.displayName = "Suspense";

const SUSPENSE_TREE = (
  <div>
    <Sidebar />
    <Post />
    <Boundary>
      <Comments />
    </Boundary>
  </div>
);

/** Which components are still waiting on data, and what for. */
const NOT_READY = new Set(["Comments"]);

function suspenseRun(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root = read(SUSPENSE_TREE, "s")!;
  const roles = new Map<string, Role>();
  const badges = new Map<string, string>([
    ["Suspense", "fallback=<Skeleton/>"],
  ]);

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles, badges), note });

  emit("A page with a Suspense boundary around the one part that needs data. Nothing has rendered yet.");

  /* A depth-first render that keeps the ancestor stack, so a throw can be
     matched against the boundaries actually above it. */
  const walk = (node: ElNode, stack: ElNode[]) => {
    if (NOT_READY.has(node.label)) {
      rec.bump("suspended");
      roles.set(node.id, "suspended");
      emit(`${node.label} needs data that has not arrived. It throws — which is literally how suspending works: the render of this subtree is unwound.`);
      /* Nearest first, so an inner boundary wins over an outer one. */
      const boundary = [...stack].reverse().find((a) => a.label === "Suspense");
      if (!boundary) {
        emit("No Suspense above it, so the throw keeps going to the root, and React has nothing to show but the fallback of the whole app.");
        return;
      }
      roles.set(boundary.id, "suspended");
      emit(`The throw is caught by the nearest Suspense above it. That boundary — and only that boundary — swaps to its fallback. Everything outside it is untouched.`);
      return;
    }
    rec.bump("rendered");
    roles.set(node.id, "mounted");
    emit(`${node.label} renders normally.`);
    for (const child of node.children) walk(child, [...stack, node]);
  };

  walk(root, []);

  emit("This is the whole point: Sidebar and Post are on screen and interactive while Comments is still loading. A single isLoading flag at the top of the page could not have done that — it would have hidden all three.");

  /* The data arrives. Only the suspended subtree is retried; nothing else is
     re-rendered, which is why the boundary is where it is. */
  NOT_READY.delete("Comments");
  const comments = root.children.find((c) => c.label === "Suspense")!.children[0];
  roles.set(comments.id, "mounted");
  roles.set(root.children.find((c) => c.label === "Suspense")!.id, "mounted");
  rec.bump("rendered");
  emit("The data arrives. React retries the boundary's children, the fallback is replaced by the real content, and no state anywhere else on the page was lost.");
  NOT_READY.add("Comments");

  return {
    frames: rec.frames,
    summary:
      "Suspending is a throw, and a Suspense boundary is the catch. The nearest boundary above the component that suspended shows its fallback; everything outside that boundary carries on rendering and stays interactive. Where you put the boundary is therefore a design decision about how much of the screen is allowed to disappear at once — which is the question a loading flag never makes you ask.",
  };
}

/* --------------------------------------------------------- 3. two priorities -- */

/**
 * An urgent update and a transition update, run through one queue.
 *
 * The queue is real: updates carry a lane, the loop drains urgent work before
 * transition work, and a transition render that is still in progress when a new
 * urgent update arrives is abandoned. The two commits in the animation are what
 * that loop produced.
 */
interface Update {
  id: string;
  label: string;
  urgent: boolean;
  /** How many units of work rendering this update costs. */
  cost: number;
}

function transitionRun(urgentOnly: boolean): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* One click. Without startTransition both state updates are urgent and share
     one render, so the expensive list holds up the cheap tab highlight. With
     it, the tab highlight is urgent and the list is not. */
  const queue: Update[] = urgentOnly
    ? [{ id: "u0", label: "tab + list", urgent: true, cost: 6 }]
    : [
        { id: "u0", label: "tab", urgent: true, cost: 1 },
        { id: "u1", label: "list", urgent: false, cost: 6 },
      ];

  const screen = { tab: "Home", list: "Home's list", pending: false };
  const emit = (note: string, role: Role | undefined, working?: string) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "tab", label: screen.tab, role: working === "tab" ? role : undefined },
        { id: "list", label: screen.list, role: working === "list" ? role : undefined },
        { id: "spinner", label: screen.pending ? "pending" : "idle", role: screen.pending ? "suspended" : undefined },
      ],
      pins: { 0: "tab", 1: "list", 2: "isPending" },
      note,
    });

  emit(
    urgentOnly
      ? "The screen before the click. Both pieces of state will be set in the same handler, with nothing marking either as less urgent."
      : "The same screen. This time the list update is wrapped in startTransition.",
    undefined
  );

  /* Urgent lane first, always: that is the entire scheduling rule. */
  const order = [...queue].sort((a, b) => Number(b.urgent) - Number(a.urgent));
  for (const update of order) {
    if (!update.urgent) {
      screen.pending = true;
      emit("isPending goes true the moment the transition is scheduled. That is what a subtle inline spinner is for.", undefined);
    }
    for (let unit = 1; unit <= update.cost; unit++) {
      rec.bump("units rendered");
      emit(
        `Rendering ${update.label}: unit ${unit} of ${update.cost}.${update.urgent ? "" : " React may yield between these, so a keystroke would still get through."}`,
        "active",
        update.label === "list" ? "list" : "tab"
      );
    }
    if (update.label.includes("tab")) screen.tab = "Posts";
    if (update.label.includes("list")) screen.list = "Posts' list";
    if (!update.urgent) screen.pending = false;
    rec.bump("commits");
    emit(
      update.urgent
        ? urgentOnly
          ? "One commit, after all six units. The tab highlight could have been on screen five units ago; it waited for the list."
          : "The first commit, after one unit. The tab highlight is already correct and the old list is still on screen — which is a coherent screen, not a spinner."
        : "The second commit. The list catches up, isPending goes false, and at no point was the screen blank.",
      "mounted",
      update.label === "list" ? "list" : "tab"
    );
  }

  return {
    frames: rec.frames,
    summary: urgentOnly
      ? "Without a transition every update in a handler is urgent, so they all render together and commit together. The cheap, immediately-visible part of the update — the tab highlight — is held hostage by the expensive part, and the user's click appears to do nothing for six units of work."
      : "startTransition splits one click into two commits. The urgent part renders and commits on its own, so the click feels instant; the expensive part renders at lower priority, may be interrupted, and commits when it is ready. isPending is true in between, which is how you show that something is happening without replacing the screen with a spinner.",
  };
}

/* ------------------------------------------------------ 4. deferred values -- */

/**
 * useDeferredValue over a burst of typing.
 *
 * A real event queue again: keystrokes arrive on a schedule, the expensive
 * render takes longer than the gap between them, and the loop abandons a
 * deferred render whenever a newer value is available. That the middle
 * keystrokes never get a deferred render of their own is an outcome of those
 * two numbers, not a claim — widen the gap and every one of them gets one.
 */
function deferredRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const keys = ["r", "e", "a", "c", "t"];
  /** Milliseconds between keystrokes, and what a deferred render costs. */
  const gap = 40;
  const renderCost = 90;

  let text = "";
  let deferred = "";
  /** The value a background render is currently working towards, if any. */
  let target: string | null = null;
  let finishesAt = 0;

  const emit = (now: number, note: string, role: Role) =>
    rec.push({
      kind: "sequence",
      items: [
        { id: "input", label: text || "·", role: "active" },
        { id: "deferred", label: deferred || "·", role: text === deferred ? "mounted" : role },
      ],
      pins: { 0: "text", 1: "deferred" },
      note: `${String(now).padStart(3)}ms — ${note}`,
    });

  emit(0, "An empty search box. text drives the input; deferred drives the expensive results list.", "stale");

  for (let i = 0; i < keys.length; i++) {
    const now = i * gap;
    /* Any background render still running is abandoned: its result is already
       out of date, and React has not committed it. */
    const abandoned = target !== null && finishesAt > now;
    text += keys[i];
    rec.bump("keystrokes");
    emit(
      now,
      abandoned
        ? `"${keys[i]}" typed. The input updates immediately. The background render towards "${target}" is abandoned — it was never committed, so nothing on screen flickers.`
        : `"${keys[i]}" typed. The input updates immediately; the results list still shows "${deferred || "nothing"}".`,
      "stale"
    );
    if (abandoned) rec.bump("renders abandoned");
    target = text;
    finishesAt = now + renderCost;
  }

  /* Typing stops, so the last background render is the first one that is
     allowed to finish. */
  deferred = target!;
  rec.bump("renders committed");
  emit(finishesAt, `Typing stopped, so the render towards "${deferred}" finishes and commits. One expensive render for five keystrokes.`, "mounted");

  return {
    frames: rec.frames,
    summary:
      "useDeferredValue gives you two values from one piece of state: the current one, which updates on every keystroke, and a lagging one, which updates only when React has time. The expensive subtree reads the lagging one, so it re-renders a fraction as often — and because an uncommitted background render can simply be abandoned, the intermediate values never reach the screen at all. It is debouncing without a timer, and without a delay when the machine is fast enough not to need one.",
  };
}

/* ----------------------------------------------------- 5. error boundaries -- */

/**
 * The same ancestor walk as the Suspense one, against a different catch.
 *
 * Deliberately the same algorithm: an error boundary and a Suspense boundary
 * are the same mechanism — a throw during render, caught by the nearest
 * ancestor that handles that kind of throw. Seeing one walk with two answers is
 * the point.
 */
function Widget() { return null; }
Widget.displayName = "Widget";
function Chart() { return null; }
Chart.displayName = "Chart";
function Header() { return null; }
Header.displayName = "Header";
function ErrorBoundary({ children }: { children?: ReactNode }) { return children; }
ErrorBoundary.displayName = "ErrBnd";
function Panel({ children }: { children?: ReactNode }) { return children; }
Panel.displayName = "Panel";

const ERROR_TREE = (
  <div>
    <Header />
    <ErrorBoundary>
      <Panel>
        <Widget />
        <Chart />
      </Panel>
    </ErrorBoundary>
  </div>
);

function errorRun(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const root = read(ERROR_TREE, "e")!;
  const roles = new Map<string, Role>();
  const badges = new Map<string, string>([["ErrBnd", "fallback=<Oops/>"]]);

  const emit = (note: string) =>
    rec.push({ kind: "tree", nodes: layout(root, roles, badges), note });

  emit("A dashboard. One error boundary, wrapped around the panel rather than around the whole app.");

  const throws = "Chart";
  let caught = false;

  const walk = (node: ElNode, ancestors: ElNode[]): boolean => {
    if (node.label === throws) {
      rec.bump("threw");
      roles.set(node.id, "unmounted");
      emit(`${node.label} throws during render — a bad response shape, an undefined read, anything. React stops rendering this subtree.`);
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestor = ancestors[i];
        rec.bump("ancestors checked");
        if (ancestor.label !== "ErrBnd") {
          roles.set(ancestor.id, "unmounted");
          emit(`${ancestor.label} is not an error boundary, so it cannot stop this. It is unmounted along with everything inside it, and the error keeps going up.`);
          continue;
        }
        roles.set(ancestor.id, "mounted");
        emit("This one is. getDerivedStateFromError puts the error into its state, and its next render returns the fallback instead of its children.");
        caught = true;
        return true;
      }
      return false;
    }
    roles.set(node.id, "unchanged");
    for (const child of node.children) if (walk(child, [...ancestors, node])) return true;
    return false;
  };

  walk(root, []);

  if (!caught) {
    emit("Nothing caught it, so React unmounts the entire tree. A React 19 app with no boundary at all shows a blank page — that is the default, and it is why one boundary somewhere near the root is not optional.");
  } else {
    emit("Header is still on screen, still interactive: it was never inside the boundary. The blast radius of a thrown error is exactly the subtree of the boundary that caught it — which makes 'where do the boundaries go' a real design question.");
  }

  return {
    frames: rec.frames,
    summary:
      "An error boundary catches a throw from anywhere below it during render, in a lifecycle, or in a constructor — and replaces its own children with a fallback. The search is for the nearest boundary above the throw, so nesting them gives you granularity: an outer one that keeps the app alive, inner ones that keep a failure local. Nothing catches an error thrown in an event handler or in an async callback, because by then React is not on the stack.",
  };
}

/* ------------------------------------------------------ 6. streaming a page -- */

/**
 * A server render that flushes in pieces, run as a discrete-event simulation.
 *
 * Each piece of data has a latency, the stream flushes a boundary when its data
 * lands, and the events are applied in time order. The shell arriving before
 * the slow data is therefore a consequence of the numbers below — make the
 * comments faster than the shell and the animation reorders itself.
 */
interface Piece {
  id: string;
  label: string;
  /** When this piece's data is ready, in milliseconds. */
  readyAt: number;
  boundary: boolean;
}

function streamingRun(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const pieces: Piece[] = [
    { id: "shell", label: "shell", readyAt: 20, boundary: false },
    { id: "post", label: "post", readyAt: 60, boundary: true },
    { id: "cmts", label: "comments", readyAt: 400, boundary: true },
    { id: "recs", label: "related", readyAt: 180, boundary: true },
  ];

  const sent: string[] = [];
  const emit = (now: number, note: string, active?: string) =>
    rec.push({
      kind: "sequence",
      items: pieces.map((piece) => ({
        id: piece.id,
        label: piece.label,
        role:
          piece.id === active ? "active"
            : sent.includes(piece.id) ? "mounted"
              : "suspended",
      })),
      pins: Object.fromEntries(
        pieces.map((piece, i) => [i, sent.includes(piece.id) ? "sent" : `${piece.readyAt}ms`])
      ),
      note: `${String(now).padStart(3)}ms — ${note}`,
    });

  emit(0, "The request arrives. Every boundary's data is still in flight; a non-streaming server render would now wait for the slowest of them.");

  /* Time order, which is the only ordering the network gives you. */
  for (const piece of [...pieces].sort((a, b) => a.readyAt - b.readyAt)) {
    sent.push(piece.id);
    rec.bump("chunks flushed");
    emit(
      piece.readyAt,
      piece.boundary
        ? `The ${piece.label} data lands, so React renders that boundary and flushes it down the same response — as a hidden div plus a two-line script that moves it into place. The browser is already showing everything above.`
        : "The shell — everything outside a Suspense boundary — is ready, so it is flushed straight away. The user sees a page here, with fallbacks where the slow parts will go.",
      piece.id
    );
  }

  emit(
    pieces[2].readyAt,
    `The response closes. The slowest piece took ${pieces[2].readyAt}ms, but the first paint happened at ${pieces[0].readyAt}ms — and without streaming both numbers would have been ${pieces[2].readyAt}ms.`
  );

  return {
    frames: rec.frames,
    summary:
      "Streaming server rendering sends the response in pieces rather than waiting for the whole page. Everything outside a Suspense boundary is the shell and goes first; each boundary is flushed as its own data resolves, in whatever order that happens, and a small inline script slots each piece into place. Time to first byte stops depending on your slowest query — which is the reason to draw the boundary around the slow thing rather than around the page.",
  };
}

/* --------------------------------------------------- 7. Strict Mode's double -- */

/**
 * The double invocation, produced by a mount runtime that really does it twice.
 *
 * `mount(strict)` is one function. In strict mode it runs the same render and
 * effect steps a second time and inserts a cleanup between them — so the log
 * beside the animation is a trace of a run, and the impure component below is
 * caught by the doubling rather than annotated as being catchable.
 */
function strictRun(strict: boolean): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* Deliberately impure: it mutates a module-level array during render, which
     is exactly the class of bug the doubling exists to surface. */
  const cart: string[] = [];
  const log: string[] = [];
  let connections = 0;

  const emit = (note: string, active: number) =>
    rec.push({
      kind: "sequence",
      items: log.map((entry, i) => ({
        id: `l${i}`,
        label: entry,
        role: i === active ? "active" : i < active ? "unchanged" : undefined,
      })),
      note,
    });

  const step = (entry: string, note: string) => {
    log.push(entry);
    rec.bump(entry.startsWith("connect") ? "connections opened" : "steps");
    emit(note, log.length - 1);
  };

  rec.push({ kind: "sequence", items: [], note: strict
    ? "Mounting the same component inside <StrictMode>, in a development build. Nothing has run yet."
    : "Mounting a component: render, then effect. Nothing has run yet." });

  const render = () => {
    cart.push("shoes");
    step(`render → cart has ${cart.length}`, `The component renders. It pushes to a module-level array while doing so — a side effect during render, which is the thing React asks you not to do.`);
  };
  const effect = () => {
    connections++;
    step(`connect (#${connections})`, "The effect runs and opens a connection.");
  };
  const cleanup = () => {
    connections--;
    step(`disconnect (#${connections + 1})`, "Strict Mode immediately runs the cleanup, then the effect again. An effect that cannot survive that is an effect that would leak on any remount — a route change, a Fast Refresh, a key change.");
  };

  render();
  if (strict) render();
  effect();
  if (strict) { cleanup(); effect(); }

  emit(
    strict
      ? `Two renders and two effects. The connection count is back to ${connections}, because the cleanup balanced the extra effect — but the cart has ${cart.length} items instead of one, and nobody wrote code to add the second. That bug is now visible on every mount instead of once a month in production.`
      : `One render, one effect. The cart has ${cart.length} item and the connection count is ${connections}: correct, and the impurity in the render is invisible. It is still there.`,
    log.length - 1
  );

  return {
    frames: rec.frames,
    summary: strict
      ? "Strict Mode double-invokes renders, initialisers and effects in development only. A pure component is unaffected by the second render; an effect with a correct cleanup is unaffected by the extra mount. Anything that breaks was already broken — it simply needed a remount to show it, and Strict Mode gives it one on every mount rather than leaving it for a route change in production."
      : "Without Strict Mode this component looks correct: one render, one effect, the right connection count. The mutation during render and a missing cleanup would both survive here and fail later, when something remounts the component. That is the case for turning the doubling on rather than off.",
  };
}

/* --------------------------------------------------------------- registry -- */

export const REACT_CONCURRENT_ALGOS = {
  "blocking-render": {
    label: "Rendering: blocking",
    run: () => renderLoop(false),
  },
  "interruptible-render": {
    label: "Rendering: interruptible",
    run: () => renderLoop(true),
  },
  "suspense-boundary": {
    label: "Suspense: which boundary catches",
    run: suspenseRun,
  },
  "transition-off": {
    label: "One click, no transition",
    run: () => transitionRun(true),
  },
  "transition-on": {
    label: "One click, with startTransition",
    run: () => transitionRun(false),
  },
  "deferred-value": {
    label: "useDeferredValue while typing",
    run: deferredRun,
  },
  "error-boundary": {
    label: "An error looking for a boundary",
    run: errorRun,
  },
  streaming: {
    label: "Streaming a page in pieces",
    run: streamingRun,
  },
  "strict-off": {
    label: "Mounting without Strict Mode",
    run: () => strictRun(false),
  },
  "strict-on": {
    label: "Mounting inside Strict Mode",
    run: () => strictRun(true),
  },
} as const;

export type ReactConcurrentAlgoName = keyof typeof REACT_CONCURRENT_ALGOS;
