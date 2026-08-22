/**
 * The rest of the structures, animated by operating on real ones.
 *
 * These are the ones whose *cost* is the lesson — a dynamic array's doubling,
 * a ring buffer's wraparound, an LRU's eviction order — so each generator
 * narrates the expensive step rather than only the result.
 */
import {
  Recorder,
  type BucketFrame,
  type MatrixFrame,
  type Role,
  type SequenceFrame,
  type TreeFrame,
  type Visualisation,
} from "./types";

/* ------------------------------------------------------- dynamic array -- */

export function dynamicArray(count = 9): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  let capacity = 1;
  const items: number[] = [];
  // Slots rather than bars: an empty slot has no height, so a bar chart would
  // draw spare capacity as a zero-valued element — which is a different thing
  // entirely. A row of cells can be genuinely blank.
  const emit = (roles: Record<number, Role>, note: string) => {
    const row = [
      ...items.map(String),
      ...new Array(Math.max(0, capacity - items.length)).fill(""),
    ];
    rec.push({
      kind: "matrix",
      cells: [row],
      roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [`0,${k}`, v])),
      colLabels: row.map((_, i) => String(i)),
      rowLabels: [`len ${items.length} / cap ${capacity}`],
      note,
    });
  };

  emit({}, "A dynamic array starts with capacity 1. Appending is O(1) — until the storage runs out.");
  for (let i = 1; i <= count; i++) {
    if (items.length === capacity) {
      const old = capacity;
      capacity *= 2;
      rec.bump("reallocations");
      rec.bump("copies", items.length);
      emit(Object.fromEntries(items.map((_, k) => [k, "swap" as Role])),
        `Full at ${old}. Allocate ${capacity} slots and copy all ${items.length} existing elements across — this one append costs O(n).`);
    }
    items.push(i);
    rec.bump("appends");
    emit({ [items.length - 1]: "active" },
      `Append ${i}. Capacity ${capacity}, used ${items.length}.`);
  }
  emit(Object.fromEntries(items.map((_, k) => [k, "sorted" as Role])),
    `${count} appends cost ${rec.stats.copies ?? 0} copies in total — under 2n, which is why the *amortised* cost is O(1).`);
  return {
    frames: rec.frames,
    summary:
      "A dynamic array doubles its storage when full, copying everything across. That one append is O(n) — but doubling means it happens rarely, and the total copying over n appends is under 2n. Hence amortised O(1). Growing by a *constant* instead of doubling would make the total O(n²), which is the thing the doubling is there to avoid.",
  };
}

/* ---------------------------------------------------------------- deque -- */

export function dequeDemo(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const items: number[] = [];
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      items: items.map((v, i) => ({ id: `${i}-${v}`, label: String(v), role: i === at ? role : undefined })),
      pins: items.length ? { 0: "front", [items.length - 1]: "back" } : {},
      note,
    });

  emit("A deque — a double-ended queue. Both ends are O(1), which neither a stack nor a queue gives you.");
  const script: [string, number?][] = [
    ["pushBack", 5], ["pushBack", 8], ["pushFront", 3], ["pushFront", 1],
    ["popBack"], ["popFront"], ["pushBack", 9],
  ];
  for (const [op, value] of script) {
    if (op === "pushBack") { items.push(value!); rec.bump("ops"); emit(`pushBack(${value})`, "active", items.length - 1); }
    else if (op === "pushFront") { items.unshift(value!); rec.bump("ops"); emit(`pushFront(${value})`, "active", 0); }
    else if (op === "popBack") {
      emit(`popBack() removes ${items[items.length - 1]}`, "swap", items.length - 1);
      items.pop(); rec.bump("ops"); emit("Removed from the back.");
    } else {
      emit(`popFront() removes ${items[0]}`, "swap", 0);
      items.shift(); rec.bump("ops"); emit("Removed from the front.");
    }
  }
  emit("A deque is a stack and a queue at once — and the structure behind the sliding-window maximum.");
  return {
    frames: rec.frames,
    summary:
      "A deque allows push and pop at both ends in O(1), which a plain array cannot: removing from the front of an array shifts everything. Implementations use a ring buffer or a doubly linked list. It is the structure behind the monotonic-deque trick that makes sliding-window maximum linear.",
  };
}

/* -------------------------------------------------------- circular buffer -- */

export function circularBuffer(capacity = 6): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const slots: (number | null)[] = new Array(capacity).fill(null);
  let head = 0;
  let tail = 0;
  let size = 0;
  const emit = (roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: [
        slots.map((v) => (v === null ? "" : String(v))),
        slots.map((_, i) =>
          i === head && i === tail ? "h/t" : i === head ? "head" : i === tail ? "tail" : ""),
      ],
      roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [`0,${k}`, v])),
      colLabels: slots.map((_, i) => String(i)),
      // `head == tail` is ambiguous — it means both empty and full — which is
      // why a real ring buffer keeps a count or wastes one slot. Showing the
      // size makes that visible rather than mysterious.
      rowLabels: [`size ${size}`, ""],
      note,
    });

  emit({}, `A ring buffer of ${capacity} slots. head is where the next read comes from; tail is where the next write goes.`);
  const push = (v: number) => {
    slots[tail] = v;
    tail = (tail + 1) % capacity;
    size++;
    rec.bump("writes");
    emit({ [(tail - 1 + capacity) % capacity]: "active" },
      `Write ${v}, then tail advances — wrapping with % ${capacity}, which is what makes it circular.`);
  };
  const pop = () => {
    const v = slots[head];
    slots[head] = null;
    const was = head;
    head = (head + 1) % capacity;
    size--;
    rec.bump("reads");
    emit({ [was]: "discarded" }, `Read ${v} from slot ${was}; head advances.`);
  };

  for (const v of [10, 20, 30, 40]) push(v);
  pop(); pop();
  for (const v of [50, 60, 70]) push(v);
  emit({}, "tail has wrapped past the end and is now behind head — no data moved, only the indices changed.");
  return {
    frames: rec.frames,
    summary:
      "A circular buffer stores a queue in a fixed array by wrapping the indices with modulo. Nothing is ever shifted, so both ends are genuinely O(1) — which is what a queue built on a plain array fails to achieve, since removing from the front costs O(n). It is how audio buffers, network rings and bounded producer/consumer queues are built.",
  };
}

/* ---------------------------------------------------- doubly linked list -- */

export function doublyLinkedList(): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  let items: number[] = [];
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      linked: true,
      items: items.map((v, i) => ({ id: `${i}-${v}`, label: String(v), role: i === at ? role : undefined })),
      pins: items.length ? { 0: "head", [items.length - 1]: "tail" } : {},
      note,
    });

  emit("A doubly linked list keeps a `prev` as well as a `next`, and usually a tail pointer too.");
  for (const v of [3, 7, 9]) {
    items = [...items, v];
    rec.bump("nodes");
    emit(`Append ${v}. With a tail pointer this is O(1) — the singly linked version had to walk.`, "active", items.length - 1);
  }
  items = [5, ...items];
  rec.bump("nodes");
  emit("Prepend 5. O(1) at this end too.", "active", 0);
  const idx = items.indexOf(7);
  emit("Delete 7 — and note that we already hold the node.", "swap", idx);
  items = items.filter((v) => v !== 7);
  rec.bump("deletions");
  emit("Its neighbours are relinked to each other. O(1), with no search, because `prev` gives us the predecessor for free.");
  emit("That is the whole advantage: a singly linked list must walk from the head to find the predecessor.");
  return {
    frames: rec.frames,
    summary:
      "A doubly linked list adds a backward pointer, which buys O(1) deletion given a node — no search for the predecessor — and O(1) operations at both ends. The cost is an extra pointer per node and two links to maintain on every change. It is the structure inside an LRU cache and inside most language deque implementations.",
  };
}

/* ------------------------------------------------------------ LRU cache -- */

export function lruCache(capacity = 3): Visualisation {
  const rec = new Recorder<SequenceFrame>();
  const order: string[] = []; // most recent first
  const emit = (note: string, role?: Role, at?: number) =>
    rec.push({
      kind: "sequence",
      linked: true,
      items: order.map((k, i) => ({ id: k, label: k, role: i === at ? role : undefined })),
      pins: order.length ? { 0: "newest", [order.length - 1]: "oldest" } : {},
      note,
      stats: { size: order.length },
    });

  emit(`An LRU cache of capacity ${capacity}. The list is kept in recency order: newest at the front.`);
  const touch = (key: string) => {
    const at = order.indexOf(key);
    if (at !== -1) {
      rec.bump("hits");
      emit(`get(${key}) — a hit. Move it to the front, because it is now the most recently used.`, "found", at);
      order.splice(at, 1);
      order.unshift(key);
      emit(`${key} is now newest.`, "active", 0);
      return;
    }
    rec.bump("misses");
    if (order.length === capacity) {
      const evicted = order[order.length - 1];
      emit(`put(${key}) — a miss, and the cache is full. The oldest entry, ${evicted}, is evicted.`, "swap", order.length - 1);
      order.pop();
      rec.bump("evictions");
    }
    order.unshift(key);
    emit(`${key} is inserted at the front.`, "active", 0);
  };

  for (const key of ["A", "B", "C", "A", "D", "B"]) touch(key);
  emit("Every operation touched only the ends of the list, so all of them were O(1).");
  return {
    frames: rec.frames,
    summary:
      "An LRU cache evicts whatever was used least recently. Done well it is a hash map for O(1) lookup plus a doubly linked list for O(1) reordering — the map finds the node, and the node's `prev`/`next` let it be unlinked and re-inserted at the front without any search. Neither structure alone gives both.",
  };
}

/* --------------------------------------------------------- segment tree -- */

export function segmentTree(values = [3, 1, 4, 1, 5, 9, 2, 6]): Visualisation {
  const rec = new Recorder<TreeFrame>();
  let slot = 0;

  // Build the tree bottom-up, recording each internal node as it is computed.
  interface Seg { lo: number; hi: number; sum: number; id: string; depth: number; x: number; parent?: string }
  const segs: Seg[] = [];
  const build = (lo: number, hi: number, depth: number, parent?: string): Seg => {
    const id = `${lo}-${hi}`;
    if (lo === hi) {
      const seg: Seg = { lo, hi, sum: values[lo], id, depth, x: slot++, parent };
      segs.push(seg);
      return seg;
    }
    const mid = Math.floor((lo + hi) / 2);
    const left = build(lo, mid, depth + 1, id);
    const right = build(mid + 1, hi, depth + 1, id);
    const seg: Seg = { lo, hi, sum: left.sum + right.sum, id, depth, x: (left.x + right.x) / 2, parent };
    segs.push(seg);
    return seg;
  };
  build(0, values.length - 1, 0);

  const draw = (roles: Map<string, Role>, note: string) => {
    rec.push({
      kind: "tree",
      nodes: segs.map((s) => ({
        id: s.id, label: String(s.sum), depth: s.depth, x: s.x, parent: s.parent, role: roles.get(s.id),
      })),
      note,
    });
  };

  draw(new Map(), `Each node holds the sum of a range. The root covers everything: ${segs[segs.length - 1].sum}.`);
  draw(new Map(segs.filter((s) => s.lo === s.hi).map((s) => [s.id, "sorted" as Role])),
    "The leaves are the original values.");

  // Query [2, 5].
  const [ql, qr] = [2, 5];
  const roles = new Map<string, Role>();
  let total = 0;
  const query = (seg: Seg): void => {
    if (seg.hi < ql || seg.lo > qr) {
      roles.set(seg.id, "discarded");
      draw(roles, `Range [${seg.lo}, ${seg.hi}] is entirely outside the query — ignore it and its whole subtree.`);
      return;
    }
    if (seg.lo >= ql && seg.hi <= qr) {
      roles.set(seg.id, "found");
      total += seg.sum;
      rec.bump("nodes visited");
      draw(roles, `Range [${seg.lo}, ${seg.hi}] is entirely inside the query — take its sum ${seg.sum} whole. Running total ${total}.`);
      return;
    }
    roles.set(seg.id, "compare");
    draw(roles, `Range [${seg.lo}, ${seg.hi}] partly overlaps — descend into both children.`);
    const kids = segs.filter((s) => s.parent === seg.id).sort((a, b) => a.lo - b.lo);
    for (const kid of kids) query(kid);
  };
  draw(roles, `Now query the sum of indices ${ql} to ${qr}.`);
  query(segs[segs.length - 1]);
  draw(roles, `Sum of [${ql}, ${qr}] is ${total}, from a handful of nodes rather than four additions.`);

  return {
    frames: rec.frames,
    summary:
      "A segment tree stores a range's answer at every node, so any query is covered by O(log n) nodes — take a node whole when its range is inside the query, discard it when it is outside, and descend only when it straddles the boundary. Unlike a prefix array it also supports updates in O(log n), and unlike a Fenwick tree it works for min, max and GCD as well as sums.",
  };
}

/* ------------------------------------------------------- Fenwick tree -- */

export function fenwickTree(values = [3, 1, 4, 1, 5, 9, 2, 6]): Visualisation {
  const rec = new Recorder<BucketFrame>();
  const n = values.length;
  const tree = new Array(n + 1).fill(0);

  const emit = (note: string, active?: number) =>
    rec.push({
      kind: "buckets",
      buckets: tree.slice(1).map((sum, i) => {
        const idx = i + 1;
        const covers = idx - (idx & -idx) + 1;
        return {
          key: String(idx),
          items: [`covers ${covers}..${idx}`, `sum ${sum}`],
          role: idx === active ? "active" : undefined,
        };
      }),
      note,
    });

  emit("A Fenwick tree stores partial sums. Index i covers a range whose length is i's lowest set bit.");
  for (let i = 0; i < n; i++) {
    let idx = i + 1;
    while (idx <= n) {
      tree[idx] += values[i];
      rec.bump("updates");
      emit(`Adding ${values[i]} (index ${i}) — it belongs to tree index ${idx}. Next: ${idx} + lowbit(${idx}) = ${idx + (idx & -idx)}.`, idx);
      idx += idx & -idx;
    }
  }
  emit("Built. Every update touched only O(log n) entries.");

  let at = 6;
  let total = 0;
  emit(`Prefix sum of the first ${at} values: walk down by clearing the lowest set bit each time.`);
  while (at > 0) {
    total += tree[at];
    rec.bump("reads");
    emit(`Add tree[${at}] = ${tree[at]}; running total ${total}. Next: ${at} − lowbit(${at}) = ${at - (at & -at)}.`, at);
    at -= at & -at;
  }
  emit(`Prefix sum is ${total}, from ${rec.stats.reads} lookups rather than six additions.`);
  return {
    frames: rec.frames,
    summary:
      "A Fenwick tree — a binary indexed tree — gives prefix sums and point updates in O(log n) using a single array and no pointers. The structure lives entirely in the index arithmetic: `i & -i` isolates the lowest set bit, adding it walks up, subtracting it walks down. It is smaller and faster than a segment tree, but it needs an invertible operation, so it does sums and not minima.",
  };
}
