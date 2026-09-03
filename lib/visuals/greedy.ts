/**
 * Greedy algorithms, shown as the choice being made and then never revisited.
 *
 * The thing a greedy animation has to communicate is not the answer but the
 * *commitment*: at every step one option is taken on a local rule, and the
 * frames that follow can never take it back. So the roles here are deliberately
 * terminal — an interval that is discarded stays discarded for the rest of the
 * run — because a picture in which rejected options quietly reappear would be
 * teaching backtracking, which is the technique this module exists to
 * distinguish greedy from.
 *
 * Intervals are drawn as a matrix rather than as a bespoke frame kind: a Gantt
 * chart *is* a grid of time slots, so `MatrixFrame` already describes one, and
 * a new frame kind would have meant a new canvas for no extra expressiveness.
 */
import {
  Recorder, cellKey, type BucketFrame, type MatrixFrame, type Role, type TreeFrame,
  type TreeNode, type Visualisation,
} from "./types";

interface Interval {
  name: string;
  start: number;
  end: number;
}

/* ------------------------------------------------------- interval scheduling -- */

/** The classic set, chosen so the earliest-finish rule and the earliest-start
 *  rule visibly disagree — C starts first and is the wrong answer. */
const MEETINGS: Interval[] = [
  { name: "A", start: 1, end: 4 },
  { name: "B", start: 3, end: 5 },
  { name: "C", start: 0, end: 6 },
  { name: "D", start: 5, end: 7 },
  { name: "E", start: 3, end: 9 },
  { name: "F", start: 6, end: 10 },
  { name: "G", start: 8, end: 11 },
];

function ganttCells(rows: Interval[], span: number): string[][] {
  return rows.map((it) =>
    Array.from({ length: span }, (_, t) => (t >= it.start && t < it.end ? it.name : ""))
  );
}

/** Paints one interval's occupied slots with a role. */
function paintRow(
  roles: Record<string, Role>, rows: Interval[], row: number, role: Role
) {
  for (let t = rows[row].start; t < rows[row].end; t++) roles[cellKey(row, t)] = role;
}

export function intervalScheduling(): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const span = Math.max(...MEETINGS.map((m) => m.end));
  // Sorting by finish time is the algorithm; everything after it is a scan.
  const rows = [...MEETINGS].sort((a, b) => a.end - b.end);
  const cells = ganttCells(rows, span);
  const rowLabels = rows.map((m) => `${m.name}  ${m.start}–${m.end}`);
  const colLabels = Array.from({ length: span }, (_, t) => String(t));
  const settled: Record<string, Role> = {};

  const emit = (extra: Record<string, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: cells.map((r) => [...r]),
      roles: { ...settled, ...extra },
      rowLabels,
      colLabels,
      note,
    });

  emit({}, `Seven meetings, one room. Rows are sorted by finishing time, which is the whole algorithm — the scan below never sorts again.`);

  let lastEnd = 0;
  const chosen: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i];
    const probe: Record<string, Role> = {};
    for (let t = m.start; t < m.end; t++) probe[cellKey(i, t)] = "active";
    emit(probe, `Consider ${m.name} (${m.start}–${m.end}). The room is free from ${lastEnd}.`);

    if (m.start >= lastEnd) {
      const freeFrom = lastEnd;
      paintRow(settled, rows, i, "found");
      chosen.push(m.name);
      lastEnd = m.end;
      rec.bump("booked");
      emit({}, `${m.name} starts at ${m.start}, which is not before ${freeFrom}. Book it; the room is now busy until ${lastEnd}.`);
    } else {
      paintRow(settled, rows, i, "discarded");
      rec.bump("rejected");
      emit({}, `${m.name} starts at ${m.start}, before the room frees at ${lastEnd}. Rejected, and never looked at again.`);
    }
  }

  emit({}, `Booked ${chosen.join(", ")} — ${chosen.length} meetings. No later choice could have improved on an earlier one.`);

  return {
    frames: rec.frames,
    summary:
      "Sort by finishing time, then take every meeting that starts after the one you last took. The rule works because finishing earliest leaves the most room behind it: any schedule can be rewritten to start with the earliest-finishing meeting without losing a booking, which is the exchange argument in one sentence. Sorting by starting time instead takes C here and books two meetings rather than three, and sorting by duration fails on a different family again.",
  };
}

/* ---------------------------------------------------------- merging intervals -- */

const RANGES: Interval[] = [
  { name: "p", start: 1, end: 4 },
  { name: "q", start: 2, end: 6 },
  { name: "r", start: 8, end: 10 },
  { name: "s", start: 9, end: 12 },
  { name: "t", start: 15, end: 18 },
];

export function mergeIntervals(): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const span = Math.max(...RANGES.map((r) => r.end));
  const rows = [...RANGES].sort((a, b) => a.start - b.start);
  const rowLabels = [...rows.map((r) => `${r.name}  ${r.start}–${r.end}`), "merged"];
  const colLabels = Array.from({ length: span }, (_, t) => String(t));
  const merged: Interval[] = [];

  const emit = (extra: Record<string, Role>, note: string) => {
    const cells = ganttCells(rows, span);
    // The output row is rebuilt from the merged list every frame, so the
    // picture can never drift from the data it is meant to be showing.
    const out = new Array(span).fill("");
    const roles: Record<string, Role> = { ...extra };
    for (const m of merged) {
      for (let t = m.start; t < m.end; t++) {
        out[t] = "█";
        roles[cellKey(rows.length, t)] = "found";
      }
    }
    cells.push(out);
    rec.push({ kind: "matrix", cells, roles, rowLabels, colLabels, note });
  };

  emit({}, `Five ranges, sorted by where they start. Sorting is again the algorithm: once starts are in order, an overlap can only ever be with the range currently being built.`);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const probe: Record<string, Role> = {};
    for (let t = r.start; t < r.end; t++) probe[cellKey(i, t)] = "active";
    const open = merged[merged.length - 1];

    if (!open || r.start > open.end) {
      emit(probe, `${r.name} starts at ${r.start}${open ? `, after the open range ends at ${open.end}` : ""}. Nothing to merge with, so it opens a new range.`);
      merged.push({ ...r });
      rec.bump("ranges");
      emit({}, `Range ${merged.length} is open, covering ${r.start}–${r.end}.`);
    } else {
      emit(probe, `${r.name} starts at ${r.start}, which is not past ${open.end}. It overlaps the open range.`);
      const before = open.end;
      open.end = Math.max(open.end, r.end);
      rec.bump("merges");
      emit({}, before === open.end
        ? `${r.name} ends at ${r.end}, inside the open range. Swallowed whole; the range is unchanged.`
        : `The open range stretches from ${before} to ${open.end}.`);
    }
  }

  emit({}, `Done in one pass: ${merged.map((m) => `${m.start}–${m.end}`).join(", ")}. Only the last range is ever open, which is why no earlier range needs revisiting.`);

  return {
    frames: rec.frames,
    summary:
      "Sort by start, then walk once holding a single open range. A new range either begins after the open one ends — in which case the open range is final and can be emitted — or it overlaps, in which case the open range's end is stretched. Because starts are sorted, nothing that arrives later can overlap a range that has already been closed, so one pass is enough and no output ever has to be revisited.",
  };
}

/* ------------------------------------------------------------------- Huffman -- */

interface HuffNode {
  id: string;
  label: string;
  weight: number;
  left?: string;
  right?: string;
}

const FREQUENCIES: { symbol: string; weight: number }[] = [
  { symbol: "a", weight: 5 },
  { symbol: "b", weight: 9 },
  { symbol: "c", weight: 12 },
  { symbol: "d", weight: 13 },
  { symbol: "e", weight: 16 },
  { symbol: "f", weight: 45 },
];

/**
 * Lays a forest out for a `TreeFrame`.
 *
 * Every node needs a depth and an x before it can be drawn, and a frame has to
 * be self-describing, so the layout is computed here rather than in the canvas.
 * In-order position is used for x, which is what keeps a parent centred between
 * the two children it was built from.
 */
function layoutForest(
  nodes: Map<string, HuffNode>, roots: string[], roles: Record<string, Role>
): TreeNode[] {
  const out: TreeNode[] = [];
  let slot = 0;

  const walk = (id: string, depth: number, parent?: string) => {
    const node = nodes.get(id)!;
    if (node.left) walk(node.left, depth + 1, id);
    const x = node.left ? undefined : slot++;
    const placed: TreeNode = {
      id, label: node.label, depth, x: x ?? 0, parent, role: roles[id],
      badge: String(node.weight),
    };
    out.push(placed);
    if (node.right) walk(node.right, depth + 1, id);
    // An internal node sits midway between its subtrees, which is only known
    // once both have been walked.
    if (node.left && node.right) {
      const l = out.find((n) => n.id === node.left)!;
      const r = out.find((n) => n.id === node.right)!;
      placed.x = (l.x + r.x) / 2;
    }
  };

  for (const root of roots) {
    walk(root, 0);
    slot += 1;   // a gap between the trees of the forest
  }
  return out;
}

export function huffmanCoding(): Visualisation {
  const rec = new Recorder<TreeFrame>();
  const nodes = new Map<string, HuffNode>();
  let next = 0;
  for (const { symbol, weight } of FREQUENCIES) {
    nodes.set(symbol, { id: symbol, label: symbol, weight });
  }
  // The "heap": kept sorted by weight, which is what a min-heap would give.
  let pool = FREQUENCIES.map((f) => f.symbol);

  const emit = (roles: Record<string, Role>, note: string) => {
    const ordered = [...pool].sort((a, b) => nodes.get(a)!.weight - nodes.get(b)!.weight);
    rec.push({ kind: "tree", nodes: layoutForest(nodes, ordered, roles), note });
  };

  emit({}, `Six symbols and how often each occurs. Every one is its own tree; the pool is a min-heap ordered by weight.`);

  while (pool.length > 1) {
    const ordered = [...pool].sort((a, b) => nodes.get(a)!.weight - nodes.get(b)!.weight);
    const [x, y] = ordered;
    emit({ [x]: "active", [y]: "active" },
      `The two rarest are ${nodes.get(x)!.label} (${nodes.get(x)!.weight}) and ${nodes.get(y)!.label} (${nodes.get(y)!.weight}). Pop both.`);

    const id = `n${next++}`;
    nodes.set(id, {
      // "*" rather than a prettier bullet, so an internal node is written the
      // same way here as in the lesson's own trace table.
      id, label: "*", weight: nodes.get(x)!.weight + nodes.get(y)!.weight, left: x, right: y,
    });
    pool = [...pool.filter((p) => p !== x && p !== y), id];
    rec.bump("merges");
    emit({ [id]: "found" },
      `Join them under a node of weight ${nodes.get(id)!.weight} and push it back. The rarest symbols are now the deepest, which is the whole trick.`);
  }

  // Read the codes off the finished tree.
  const codes = new Map<string, string>();
  const readCodes = (id: string, prefix: string) => {
    const node = nodes.get(id)!;
    if (!node.left && !node.right) {
      codes.set(node.label, prefix || "0");
      return;
    }
    readCodes(node.left!, `${prefix}0`);
    readCodes(node.right!, `${prefix}1`);
  };
  readCodes(pool[0], "");

  const bits = FREQUENCIES.reduce((s, f) => s + f.weight * codes.get(f.symbol)!.length, 0);
  const flat = FREQUENCIES.reduce((s, f) => s + f.weight * 3, 0);
  emit(Object.fromEntries(FREQUENCIES.map((f) => [f.symbol, "sorted" as Role])),
    `Codes: ${FREQUENCIES.map((f) => `${f.symbol}=${codes.get(f.symbol)}`).join(", ")}. ${bits} bits against ${flat} for a fixed 3-bit code.`);

  return {
    frames: rec.frames,
    summary:
      "Huffman is greedy on one rule: repeatedly join the two least frequent trees. Because a symbol's code length is its depth, joining the two rarest pushes exactly the symbols that matter least furthest down, and the exchange argument shows the two rarest can always be made siblings at the deepest level of some optimal tree. Every symbol ends at a leaf, so no code is a prefix of another and the result decodes without separators.",
  };
}

/* --------------------------------------------------------------- coin change -- */

/**
 * Greedy coin change, run twice: on a system where it is optimal and on one
 * where it is not.
 *
 * Both runs are in one visualisation on purpose. The failure is only legible
 * next to the success, because the *algorithm does not change* — the same rule
 * is applied equally carefully to both, and only the denominations differ.
 */
export function coinChange(): Visualisation {
  const rec = new Recorder<BucketFrame>();

  const run = (coins: number[], target: number, verdict: (n: number) => string) => {
    const taken = new Map<number, number>();
    let left = target;

    const emit = (active: number | null, note: string) =>
      rec.push({
        kind: "buckets",
        buckets: coins.map((c) => ({
          key: String(c),
          items: Array.from({ length: taken.get(c) ?? 0 }, () => String(c)),
          role: c === active ? "active" : (taken.get(c) ?? 0) > 0 ? "found" : undefined,
        })),
        note,
      });

    emit(null, `Make ${target} from ${coins.join(", ")}. The rule: always take the largest coin that still fits.`);
    for (const c of coins) {
      if (c > left) {
        emit(c, `${c} is larger than the ${left} still owed. Skip it.`);
        continue;
      }
      while (c <= left) {
        taken.set(c, (taken.get(c) ?? 0) + 1);
        left -= c;
        rec.bump("coins");
        emit(c, `Take a ${c}. ${left} still owed.`);
      }
    }
    const count = [...taken.values()].reduce((s, n) => s + n, 0);
    emit(null, verdict(count));
  };

  run([25, 10, 5, 1], 41, (n) =>
    `${n} coins: 25 + 10 + 5 + 1. This system is canonical, so greedy is optimal for every amount.`);
  run([4, 3, 1], 6, (n) =>
    `${n} coins: 4 + 1 + 1. But 3 + 3 is two coins, so greedy is wrong here — and it was wrong on its very first choice.`);

  return {
    frames: rec.frames,
    summary:
      "Taking the largest coin that fits is optimal for some denomination systems and not others, and the algorithm cannot tell which it is holding. With 25, 10, 5 and 1 it is optimal for every amount; with 4, 3 and 1 it makes 6 as 4 + 1 + 1 where 3 + 3 would do. Taking the 4 is what loses, and no later choice recovers. A system where greedy always wins is called canonical, and deciding whether one is canonical takes more work than simply running dynamic programming instead.",
  };
}

export const GREEDY_ALGOS = {
  intervals: { label: "Interval scheduling", run: () => intervalScheduling() },
  merge: { label: "Merging intervals", run: () => mergeIntervals() },
  huffman: { label: "Huffman coding", run: () => huffmanCoding() },
  coins: { label: "Coin change", run: () => coinChange() },
} as const;

export type GreedyAlgoName = keyof typeof GREEDY_ALGOS;
