/**
 * Module 9's arithmetic, performed rather than asserted.
 *
 * Four of the five generators here compute their numbers from a real
 * implementation: `renderVsDom` walks two element trees and counts the
 * mutations the diff actually finds; `memoCache` runs a `useMemo` cache and
 * counts comparisons, computations and allocations; `compilerCache` runs the
 * control flow the React Compiler really emits, slot for slot, taken from the
 * verified output in the compiler lesson; `virtualWindow` does the windowing
 * arithmetic a virtualiser does.
 *
 * `flameGraph` is different and says so in its own comment: a flame graph is
 * made of timings, and timings cannot be measured in a frame generator. It is
 * an explicit model over a stated cost table — the same device the rendering
 * lessons use for their timelines — and the arithmetic over that table is
 * real even though the table is chosen.
 */
import {
  Recorder,
  type Role,
  type SequenceFrame,
  type TreeNode,
  type TreeFrame,
  type Visualisation,
} from "./types";

/* ------------------------------------------ 1. renders against DOM writes -- */

interface VNode {
  id: string;
  label: string;
  text?: string;
  children?: VNode[];
}

/** The tree the counted example renders: a header, and a list of rows. */
const tree = (tick: number, hidden: string): VNode => ({
  id: "app",
  label: "<App>",
  children: [
    { id: "out", label: "<output>", text: String(tick) },
    { id: "hidden", label: "<span hidden>", text: hidden },
    {
      id: "list",
      label: "<Rows>",
      children: [0, 1, 2, 3].map((i) => ({
        id: `row${i}`,
        label: `<Row ${i}>`,
        text: `row ${i}`,
      })),
    },
  ],
});

function flatten(node: VNode, depth = 0, out: { node: VNode; depth: number }[] = []) {
  out.push({ node, depth });
  for (const child of node.children ?? []) flatten(child, depth + 1, out);
  return out;
}

/**
 * A real diff: walk both trees in step and record where the text differs.
 *
 * The mutation count is the length of what this returns, so a frame claiming
 * "one DOM write" is claiming what the walk found.
 */
function diffText(before: VNode, after: VNode, changed: string[] = []): string[] {
  if (before.text !== after.text) changed.push(after.id);
  const a = before.children ?? [];
  const b = after.children ?? [];
  for (let i = 0; i < b.length; i++) diffText(a[i]!, b[i]!, changed);
  return changed;
}

function renderVsDom(): Visualisation {
  const rec = new Recorder<TreeFrame>();

  /* Leaves take consecutive slots and every other node sits at the midpoint
     of its own, which is the rule the element-tree visuals use and the one
     that keeps the edges from crossing. */
  const nodes = (t: VNode, roles: Map<string, Role>): TreeNode[] => {
    const out: TreeNode[] = [];
    let slot = 0;
    const walk = (node: VNode, depth: number, parent?: string): number => {
      const children = node.children ?? [];
      const badge = node.text === undefined ? undefined : `"${node.text}"`;
      if (children.length === 0) {
        const x = slot++;
        out.push({ id: node.id, label: node.label, depth, x, parent, role: roles.get(node.id), badge });
        return x;
      }
      const xs = children.map((child) => walk(child, depth + 1, node.id));
      const x = (xs[0]! + xs[xs.length - 1]!) / 2;
      out.push({ id: node.id, label: node.label, depth, x, parent, role: roles.get(node.id), badge });
      return x;
    };
    walk(t, 0);
    return out;
  };

  const emit = (t: VNode, roles: Map<string, Role>, note: string) =>
    rec.push({ kind: "tree", nodes: nodes(t, roles), note });

  const current = tree(0, "");
  emit(current, new Map(), "Seven components on screen. The two buttons in the real example are left out; what matters is the ratio between what re-renders and what the browser is asked to change.");

  /* --- a state change that alters nothing visible --- */
  const quiet = tree(0, "");
  const quietChanges = diffText(current, quiet);
  rec.bump("renders", flatten(quiet).length);
  emit(
    quiet,
    new Map(flatten(quiet).map(({ node }) => [node.id, "updated" as Role])),
    `A counter that nothing renders is incremented. Every one of these ${flatten(quiet).length} components runs again — that is what "re-render" means — and React compares the objects they returned with the previous ones.`,
  );

  emit(
    quiet,
    new Map(),
    `The diff found ${quietChanges.length} differences, so the browser was asked to do ${quietChanges.length} things. The state changed, every component ran, and the DOM was not touched.`,
  );

  /* --- a state change that moves exactly one number --- */
  const loud = tree(1, "");
  const loudChanges = diffText(quiet, loud);
  rec.bump("renders", flatten(loud).length);
  rec.bump("DOM writes", loudChanges.length);
  emit(
    loud,
    new Map(flatten(loud).map(({ node }) => [node.id, "updated" as Role])),
    "Now a state change that one component displays. Again every component runs — React has no way to know in advance which output will differ.",
  );

  emit(
    loud,
    new Map(loudChanges.map((id) => [id, "found" as Role])),
    `And the diff found exactly ${loudChanges.length}: the one text node whose contents changed. ${flatten(loud).length} components ran to produce ${loudChanges.length} DOM write.`,
  );

  emit(
    loud,
    new Map(),
    `Measured on the real component in this lesson the ratio is 201 renders to 1 mutation. That is not waste — it is the trade reconciliation exists to make: cheap work in JavaScript so that expensive work in the DOM can be skipped.`,
  );

  return {
    frames: rec.frames,
    summary:
      "A re-render is React calling your functions and comparing the objects they return. It is not a repaint, and it is not a DOM write. Every component below a state change runs, because React cannot know which output will differ until it has one — and then the diff touches only what actually changed, which here is one text node out of seven components and, in the measured example, one out of 201. The render count measures the cheap half of that trade. An optimisation that lowers it while leaving the DOM writes alone has optimised the half that was already fast.",
  };
}

/* ------------------------------------------------- 2. what a useMemo costs -- */

/**
 * One `useMemo`, run for real over a run of renders.
 *
 * The counters are incremented by the cache implementation, not by the
 * narration, so case B reporting a computation on every render is the cache
 * failing rather than a caption claiming it does. The example in the lesson
 * runs this a hundred times; this runs it six, and the shape is identical.
 */
function memoCache(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const RENDERS = 6;

  const run = (stableDeps: boolean, note: string) => {
    let stored: { deps: unknown[]; value: number } | null = null;
    let comparisons = 0;
    let computations = 0;
    let allocations = 0;

    for (let render = 1; render <= RENDERS; render++) {
      /* The dependency array is written in the JSX, so it is built on every
         render whether the memo hits or not. This is the cost that does not
         go away. */
      const deps: unknown[] = stableDeps ? ["ada"] : [{ name: "ada" }];
      allocations++;

      let hit = false;
      if (stored !== null) {
        comparisons++;
        hit = stored.deps.length === deps.length && stored.deps.every((d, i) => Object.is(d, deps[i]));
      }

      if (!hit) {
        computations++;
        stored = { deps, value: render };
      }

      rec.bump(stableDeps ? "stable-dep renders" : "unstable-dep renders");
      rec.push({
        kind: "sequence",
        items: [
          { id: "r", label: `render ${render}`, role: "active" },
          {
            id: "d",
            label: stableDeps ? `deps: ["ada"]` : `deps: [{ name: "ada" }]`,
            role: hit ? "unchanged" : "updated",
          },
          { id: "c", label: hit ? "cache hit" : "recomputed", role: hit ? "found" : "discarded" },
          { id: "n", label: `${comparisons} comparisons · ${computations} computations · ${allocations} arrays`, role: "unchanged" },
        ],
        note:
          render === 1
            ? `${note} The first render has nothing to compare against, so it always computes.`
            : hit
              ? `\`Object.is\` on the one dependency says unchanged, so the stored value is returned. ${computations} computation${computations === 1 ? "" : "s"} so far.`
              : `\`Object.is\` says changed — the literal is a new object every render — so the value is recomputed. ${computations} computations so far, one per render.`,
      });
    }

    return { comparisons, computations, allocations };
  };

  const stable = run(true, "Case A: the dependency is a string, and the same string every render.");
  const unstable = run(false, "Case B: the dependency is an object literal.");

  rec.push({
    kind: "sequence",
    items: [
      { id: "a", label: `stable: ${stable.computations} computation of ${RENDERS} renders`, role: "found" },
      { id: "b", label: `unstable: ${unstable.computations} computations of ${RENDERS} renders`, role: "discarded" },
      { id: "c", label: `both: ${stable.allocations} and ${unstable.allocations} dep arrays`, role: "updated" },
    ],
    note: `The number that does not change between the two cases is the allocation count: ${stable.allocations} either way. A memo always costs an array and a comparison per render, and only sometimes saves anything — so the question is never "should this be memoised" but "what does this cost to compute, and is its dependency stable".`,
  });

  return {
    frames: rec.frames,
    summary:
      "A `useMemo` stores one value and one dependency array, and returns the stored value when `Object.is` says every dependency matched. With a stable dependency it computes once and hits thereafter. With an object or array literal as a dependency it computes every single time, because the literal is a new object every render — so the memo adds an allocation and a comparison and saves nothing. The dependency array itself is built on every render in both cases, which is the cost that never goes away: memoising is not free, and a cheap computation behind an unstable dependency is strictly worse than no memo at all.",
  };
}

/* --------------------------------------- 3. the cache the compiler emits -- */

/**
 * The React Compiler's emitted control flow, executed.
 *
 * This is the compiler's real output for `ProductList` — the one in the
 * lesson, produced by `babel-plugin-react-compiler` — transcribed into
 * TypeScript with `emit()` calls threaded through. Seven slots, the same
 * three guarded blocks, the same order. So which slots are read and which are
 * written on each render is decided by the emitted code, not by the caption.
 */
function compilerCache(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const SLOTS = [
    "$[0] products",
    "$[1] query",
    "$[2] filtered",
    "$[3] query",
    "$[4] predicate",
    "$[5] filtered",
    "$[6] element",
  ];

  interface Product {
    name: string;
  }

  /* The component instance's cache. `_c(7)` hands back an array of this
     length, filled with a sentinel nothing can equal. */
  const EMPTY = Symbol("empty");
  const $: unknown[] = new Array(7).fill(EMPTY);

  let computedFilter = 0;
  let computedPredicate = 0;
  let computedElement = 0;

  const emit = (touched: Record<number, Role>, note: string) =>
    rec.push({
      kind: "sequence",
      items: SLOTS.map((label, i) => ({
        id: `s${i}`,
        label: $[i] === EMPTY ? `${label}: —` : label,
        role: touched[i],
      })),
      note,
    });

  emit({}, "`const $ = _c(7)` asks React for a seven-slot cache belonging to this component instance. It survives every render and is thrown away when the component unmounts. Every slot is empty.");

  const render = (products: Product[], query: string, why: string) => {
    const touched: Record<number, Role> = {};

    let t1: Product[];
    if ($[0] !== products || $[1] !== query) {
      /* The outer block missed, so the predicate's own block is consulted. */
      let t2: (p: Product) => boolean;
      if ($[3] !== query) {
        computedPredicate++;
        t2 = (p) => p.name.includes(query);
        $[3] = query;
        $[4] = t2;
        touched[3] = "updated";
        touched[4] = "updated";
      } else {
        t2 = $[4] as (p: Product) => boolean;
        touched[4] = "found";
      }
      computedFilter++;
      t1 = products.filter(t2);
      $[0] = products;
      $[1] = query;
      $[2] = t1;
      touched[0] = "updated";
      touched[1] = "updated";
      touched[2] = "updated";
    } else {
      t1 = $[2] as Product[];
      touched[0] = "unchanged";
      touched[1] = "unchanged";
      touched[2] = "found";
    }
    const filtered = t1;

    /* The returned element is memoised on the filtered list, which is what
       lets the parent skip re-rendering Grid entirely. */
    if ($[5] !== filtered) {
      computedElement++;
      $[5] = filtered;
      $[6] = `<Grid rows=[${filtered.length}] />`;
      touched[5] = "updated";
      touched[6] = "updated";
    } else {
      touched[5] = "unchanged";
      touched[6] = "found";
    }

    rec.bump("renders");
    emit(touched, why);
    return filtered;
  };

  const products: Product[] = [{ name: "hat" }, { name: "hose" }, { name: "spade" }];

  render(products, "h", "First render. Every guard misses because every slot is empty, so the predicate is built, the filter runs, the element is built, and all seven slots are written.");

  render(products, "h", `Second render with the same props. Both guards hit: nothing is recomputed, and \`$[6]\` returns the *same element object* as last time — which is what lets the parent skip \`Grid\` without anybody writing \`memo\`.`);

  render(products, "ho", "Now the query changes. The outer guard misses, so the predicate is rebuilt on the new query and the filter re-runs — and because the resulting array is new, the element is rebuilt too.");

  const sameQueryNewArray: Product[] = [...products];
  render(sameQueryNewArray, "ho", "And the case worth seeing: the parent passed a new `products` array with identical contents. The outer guard misses on identity, so the filter runs again — but `$[3]` still holds the same query, so the predicate is *reused*. The compiler memoised a function literal nobody would have memoised by hand.");

  rec.push({
    kind: "sequence",
    items: [
      { id: "a", label: `filter ran ${computedFilter}× in 4 renders`, role: "updated" },
      { id: "b", label: `predicate built ${computedPredicate}×`, role: "found" },
      { id: "c", label: `element built ${computedElement}×`, role: "updated" },
    ],
    note: `Four renders. The predicate — a function literal inside the component — was built ${computedPredicate} times rather than 4, and the returned element ${computedElement} times rather than 4. Neither is something people write by hand, and the second is the one that actually saves a subtree.`,
  });

  return {
    frames: rec.frames,
    summary:
      "The compiler gives each component instance a fixed-size cache and wraps every computation in a guard that compares its inputs against the slots. That is a `useMemo` per value, written for you — including two nobody writes by hand: the function literals passed as props or arguments, and the element the component returns. The last one is the one that matters, because a memoised element lets the parent skip the whole subtree without a single `memo` call. It is the same mechanism as manual memoisation, applied exhaustively and without the judgement calls, which is why the honest summary is that it removes the memoisation work rather than that it makes React fast.",
  };
}

/* -------------------------------------------------------- 4. windowing -- */

/**
 * The arithmetic a virtualiser does, done.
 *
 * Given a row height, a viewport and a scroll offset, the visible slice is a
 * division and a clamp. Running it at several offsets is the whole idea, and
 * the rendered-row count in each frame is the length of the slice this
 * computes.
 */
function virtualWindow(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const TOTAL = 10_000;
  const ROW = 32;
  const VIEWPORT = 640;
  const OVERSCAN = 3;

  const windowAt = (scrollTop: number) => {
    const first = Math.floor(scrollTop / ROW);
    const visible = Math.ceil(VIEWPORT / ROW);
    const start = Math.max(0, first - OVERSCAN);
    const end = Math.min(TOTAL, first + visible + OVERSCAN);
    return { start, end, count: end - start };
  };

  const emit = (scrollTop: number, note: string, roles: Record<number, Role> = {}) => {
    const w = windowAt(scrollTop);
    rec.push({
      kind: "sequence",
      items: [
        { id: "scroll", label: `scrollTop ${scrollTop}px`, role: roles[0] },
        { id: "range", label: `rows ${w.start}–${w.end - 1}`, role: roles[1] ?? "active" },
        { id: "count", label: `${w.count} rendered of ${TOTAL.toLocaleString("en-GB")}`, role: roles[2] ?? "found" },
        { id: "spacer", label: `spacer height ${(TOTAL * ROW).toLocaleString("en-GB")}px`, role: roles[3] },
      ],
      note,
    });
    return w;
  };

  rec.push({
    kind: "sequence",
    items: [
      { id: "naive", label: `${TOTAL.toLocaleString("en-GB")} rows rendered`, role: "discarded" },
      { id: "seen", label: `${Math.ceil(VIEWPORT / ROW)} of them on screen`, role: "found" },
      { id: "waste", label: `${(TOTAL - Math.ceil(VIEWPORT / ROW)).toLocaleString("en-GB")} nobody can see`, role: "discarded" },
    ],
    note: `Ten thousand rows, each ${ROW}px, in a ${VIEWPORT}px viewport. ${Math.ceil(VIEWPORT / ROW)} fit on screen, so rendering all of them puts ${(TOTAL - Math.ceil(VIEWPORT / ROW)).toLocaleString("en-GB")} elements in the document that nobody can look at — and every one of them is a real DOM node the browser lays out.`,
  });

  const top = emit(0, `Windowing renders the slice instead. At the top: rows 0 to ${windowAt(0).end - 1}, which is ${windowAt(0).count} elements — the ${Math.ceil(VIEWPORT / ROW)} visible plus ${OVERSCAN} of overscan below, so a fast scroll does not show a blank strip. There is no overscan above because the clamp stops it at row 0.`);
  rec.bump("max rendered", top.count);

  emit(3_200, `Scrolled a hundred rows down. Now there is overscan at both ends, so the slice is ${windowAt(3_200).count} rather than ${windowAt(0).count} — and from here it stays that size. That is the property that matters: the cost of the list is independent of its length.`);

  emit(160_000, "Five thousand rows in. Same number of DOM nodes.");

  emit(TOTAL * ROW - VIEWPORT, `And at the very bottom, where the clamp does its work: the window stops at row ${TOTAL - 1} rather than running past the end.`);

  rec.push({
    kind: "sequence",
    items: [
      { id: "spacer", label: `one spacer, ${(TOTAL * ROW).toLocaleString("en-GB")}px tall`, role: "active" },
      { id: "why", label: "so the scrollbar is honest", role: "found" },
    ],
    note: `The piece that makes it work at all: a single element of the full height sits behind the slice, so the scrollbar reflects ten thousand rows even though ${top.count} exist. Without it the container would be ${(top.count * ROW)}px tall and there would be nothing to scroll.`,
  });

  return {
    frames: rec.frames,
    summary:
      "Windowing renders the slice of a list that is actually visible, plus a small overscan, and puts one full-height spacer behind it so the scrollbar still describes the whole list. The slice is a division and a clamp, so its size is fixed by the viewport rather than by the data: the same twenty-six elements whether the list holds ten thousand rows or ten million. That is the only optimisation in this module that changes the complexity of the screen rather than a constant factor, which is why it comes before any amount of memoising — and also why it is not free, since anything relying on real elements being present, like Ctrl-F or a screen reader reading the whole list, stops working.",
  };
}

/* ------------------------------------------------- 5. the flame graph -- */

/**
 * Reading a commit: `actualDuration` against `baseDuration`.
 *
 * Timings cannot be measured from inside a frame generator, so unlike
 * everything else in this file the per-component costs below are a stated
 * model rather than a measurement — the same device the client/server
 * timelines use. What is real is the arithmetic over them: `baseDuration` is
 * the sum of a subtree's own costs, `actualDuration` counts only what
 * actually rendered, and both are computed by walking the tree.
 */
const COMMIT_COSTS: Record<string, number> = {
  App: 0.4,
  Header: 0.3,
  Sidebar: 1.1,
  Filters: 0.6,
  IssueList: 2.2,
  Row: 0.5,
  Chart: 14.8,
};

interface CNode {
  id: string;
  cost: number;
  /** Did this component actually re-render in the commit being read? */
  rendered: boolean;
  children?: CNode[];
}

function flameGraph(): Visualisation {
  const rec = new Recorder<TreeFrame>();

  const rows = (n: number, rendered: boolean): CNode[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `Row ${i + 1}`,
      cost: COMMIT_COSTS.Row!,
      rendered,
    }));

  /* One commit: a filter changed, so the list and its rows re-rendered. The
     chart did not — it is memoised and its props did not change. */
  const commit: CNode = {
    id: "App",
    cost: COMMIT_COSTS.App!,
    rendered: true,
    children: [
      { id: "Header", cost: COMMIT_COSTS.Header!, rendered: false },
      { id: "Sidebar", cost: COMMIT_COSTS.Sidebar!, rendered: false },
      {
        id: "IssueList",
        cost: COMMIT_COSTS.IssueList!,
        rendered: true,
        children: rows(4, true),
      },
      { id: "Chart", cost: COMMIT_COSTS.Chart!, rendered: false },
    ],
  };

  /** Everything a subtree would cost if all of it rendered. */
  const base = (n: CNode): number =>
    n.cost + (n.children ?? []).reduce((sum, c) => sum + base(c), 0);

  /** What it did cost: only the parts that rendered. */
  const actual = (n: CNode): number =>
    (n.rendered ? n.cost : 0) + (n.children ?? []).reduce((sum, c) => sum + actual(c), 0);

  const emit = (
    role: (n: CNode) => Role | undefined,
    badge: (n: CNode) => string | undefined,
    note: string,
  ) => {
    const out: TreeNode[] = [];
    let slot = 0;
    const walk = (n: CNode, depth: number, parent?: string): number => {
      const children = n.children ?? [];
      if (children.length === 0) {
        const x = slot++;
        out.push({ id: n.id, label: n.id, depth, x, parent, role: role(n), badge: badge(n) });
        return x;
      }
      const xs = children.map((child) => walk(child, depth + 1, n.id));
      const x = (xs[0]! + xs[xs.length - 1]!) / 2;
      out.push({ id: n.id, label: n.id, depth, x, parent, role: role(n), badge: badge(n) });
      return x;
    };
    walk(commit, 0);
    rec.push({ kind: "tree", nodes: out, note });
  };

  emit(
    () => undefined,
    (n) => `${base(n).toFixed(1)}ms`,
    "One commit in the Profiler. Every node is captioned with its `baseDuration` — what that subtree would cost if all of it rendered. The costs are a stated model, not a measurement; the sums over them are real.",
  );

  emit(
    (n) => (n.rendered ? "updated" : "discarded"),
    (n) => `${base(n).toFixed(1)}ms`,
    "A filter changed. The list and its rows re-rendered; the header, the sidebar and the chart did not — the chart is memoised and its props did not change.",
  );

  emit(
    (n) => (n.rendered ? "updated" : "discarded"),
    (n) => `${actual(n).toFixed(1)}ms`,
    `Now captioned with \`actualDuration\`: only what rendered. The chart contributes ${actual(commit.children![3]!).toFixed(1)}ms rather than ${base(commit.children![3]!).toFixed(1)}ms, and the whole commit is ${actual(commit).toFixed(1)}ms against a base of ${base(commit).toFixed(1)}ms.`,
  );

  emit(
    (n) => (n.id === "Chart" ? "found" : n.rendered ? "updated" : undefined),
    (n) => `${base(n).toFixed(1)}ms`,
    `And here is the thing the graph is for. \`Chart\` is ${((base(commit.children![3]!) / base(commit)) * 100).toFixed(0)}% of what this screen costs when it renders. It did not render in this commit — but the moment a change reaches it, every millisecond saved elsewhere is noise beside it.`,
  );

  const rowsTotal = rows(4, true).reduce((s, r) => s + r.cost, 0);
  emit(
    (n) => (n.id.startsWith("Row") ? "found" : undefined),
    (n) => `${base(n).toFixed(1)}ms`,
    `The other reading: four rows at ${COMMIT_COSTS.Row!.toFixed(1)}ms are ${rowsTotal.toFixed(1)}ms together. Cheap here — and this is the number that scales with the data, so at four hundred rows it is ${(COMMIT_COSTS.Row! * 400).toFixed(0)}ms and the chart is no longer the problem.`,
  );

  return {
    frames: rec.frames,
    summary:
      "The Profiler records two numbers per component per commit. `baseDuration` is what the subtree costs when all of it renders; `actualDuration` is what it cost this time, counting only what re-rendered. Reading them together is the whole technique: a wide bar that did not render this commit is not a problem today and is the biggest one you have the moment a change reaches it, and a narrow bar repeated four hundred times is the one that grows with the data. The instinct the graph corrects is optimising what re-rendered most often rather than what costs most — the render count is free to look at, and it is the wrong number.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_PERF_ALGOS = {
  "render-vs-dom": {
    label: "Renders against DOM writes",
    run: renderVsDom,
  },
  "memo-cache": {
    label: "What one useMemo costs",
    run: memoCache,
  },
  "compiler-cache": {
    label: "The cache the compiler emits",
    run: compilerCache,
  },
  "virtual-window": {
    label: "Windowing: the visible slice",
    run: virtualWindow,
  },
  "flame-graph": {
    label: "Reading a commit's flame graph",
    run: flameGraph,
  },
} as const;

export type ReactPerfName = keyof typeof REACT_PERF_ALGOS;
