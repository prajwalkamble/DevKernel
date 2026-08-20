/**
 * Graph algorithms, instrumented.
 *
 * Every generator here runs the real algorithm and emits a frame at each
 * decision point. Layout is fixed per sample graph rather than force-directed,
 * because a graph that moves between frames is unreadable — the eye spends its
 * effort re-finding nodes instead of following the algorithm.
 */
import {
  Recorder,
  type GraphEdge,
  type GraphFrame,
  type MatrixFrame,
  type Role,
  type Visualisation,
  cellKey,
} from "./types";

export interface GraphSpec {
  nodes: { id: string; x: number; y: number }[];
  edges: { from: string; to: string; weight?: number }[];
  directed?: boolean;
}

/** A small undirected graph laid out by hand so it never overlaps itself. */
export const SAMPLE_GRAPH: GraphSpec = {
  nodes: [
    { id: "A", x: 60, y: 40 },
    { id: "B", x: 180, y: 40 },
    { id: "C", x: 300, y: 40 },
    { id: "D", x: 60, y: 150 },
    { id: "E", x: 180, y: 150 },
    { id: "F", x: 300, y: 150 },
  ],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "D", weight: 2 },
    { from: "B", to: "C", weight: 3 },
    { from: "B", to: "E", weight: 5 },
    { from: "C", to: "F", weight: 1 },
    { from: "D", to: "E", weight: 7 },
    { from: "E", to: "F", weight: 6 },
  ],
};

/** A directed acyclic graph, for topological order. */
export const SAMPLE_DAG: GraphSpec = {
  directed: true,
  nodes: [
    { id: "shirt", x: 50, y: 30 },
    { id: "tie", x: 190, y: 30 },
    { id: "jacket", x: 330, y: 90 },
    { id: "socks", x: 50, y: 150 },
    { id: "shoes", x: 190, y: 150 },
    { id: "trousers", x: 50, y: 90 },
  ],
  edges: [
    { from: "shirt", to: "tie" },
    { from: "tie", to: "jacket" },
    { from: "trousers", to: "shoes" },
    { from: "socks", to: "shoes" },
    { from: "trousers", to: "jacket" },
  ],
};

function adjacency(spec: GraphSpec) {
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const n of spec.nodes) adj.set(n.id, []);
  for (const e of spec.edges) {
    adj.get(e.from)!.push({ to: e.to, weight: e.weight ?? 1 });
    if (!spec.directed) adj.get(e.to)!.push({ to: e.from, weight: e.weight ?? 1 });
  }
  // A stable neighbour order makes the animation reproducible, which matters
  // when a lesson describes what happens at a particular step.
  for (const list of adj.values()) list.sort((a, b) => a.to.localeCompare(b.to));
  return adj;
}

function graphEmitter(spec: GraphSpec, rec: Recorder<GraphFrame>) {
  return (
    nodeRoles: Record<string, Role>,
    edgeRoles: Record<string, Role>,
    note: string,
    badges: Record<string, string> = {},
    output?: string[]
  ) => {
    rec.push({
      kind: "graph",
      nodes: spec.nodes.map((n) => ({
        id: n.id, label: n.id, x: n.x, y: n.y,
        role: nodeRoles[n.id], badge: badges[n.id],
      })),
      edges: spec.edges.map<GraphEdge>((e) => ({
        from: e.from, to: e.to, weight: e.weight,
        role: edgeRoles[`${e.from}-${e.to}`] ?? edgeRoles[`${e.to}-${e.from}`],
        directed: spec.directed,
      })),
      note,
      output: output ? [...output] : undefined,
    });
  };
}

/* --------------------------------------------------------------------- BFS -- */

export function bfs(spec: GraphSpec = SAMPLE_GRAPH, start = "A"): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const emit = graphEmitter(spec, rec);
  const adj = adjacency(spec);
  const seen = new Set<string>([start]);
  const queue = [start];
  const order: string[] = [];
  const roles: Record<string, Role> = { [start]: "active" };
  const edgeRoles: Record<string, Role> = {};
  const depth: Record<string, string> = { [start]: "0" };

  emit(roles, edgeRoles, `Start at ${start}. BFS uses a queue, so it finishes a whole level before going deeper.`, depth, order);

  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    roles[node] = "sorted";
    rec.bump("visited");
    emit(roles, edgeRoles, `Dequeue ${node} and visit it. Queue is now [${queue.join(", ")}].`, depth, order);

    for (const { to } of adj.get(node)!) {
      if (seen.has(to)) {
        emit({ ...roles, [to]: "discarded" }, { ...edgeRoles, [`${node}-${to}`]: "discarded" },
          `${to} has already been seen — skip it.`, depth, order);
        continue;
      }
      seen.add(to);
      queue.push(to);
      roles[to] = "active";
      edgeRoles[`${node}-${to}`] = "sorted";
      depth[to] = String(Number(depth[node]) + 1);
      rec.bump("enqueued");
      emit(roles, edgeRoles, `${to} is new — mark it seen and enqueue it. It is ${depth[to]} step(s) from ${start}.`, depth, order);
    }
  }
  emit(roles, edgeRoles, `Every reachable node visited, in level order: ${order.join(" → ")}.`, depth, order);
  return {
    frames: rec.frames,
    summary:
      "Breadth-first search visits every node at distance 1, then every node at distance 2, and so on — because a queue hands back what arrived first. That level order is why BFS finds the shortest path in an unweighted graph, and why the badge under each node is its distance from the start. O(V + E).",
  };
}

/* --------------------------------------------------------------------- DFS -- */

export function dfs(spec: GraphSpec = SAMPLE_GRAPH, start = "A"): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const emit = graphEmitter(spec, rec);
  const adj = adjacency(spec);
  const seen = new Set<string>();
  const order: string[] = [];
  const roles: Record<string, Role> = {};
  const edgeRoles: Record<string, Role> = {};

  emit(roles, edgeRoles, `Start at ${start}. DFS follows one path as far as it goes before backing up.`, {}, order);

  function walk(node: string, from?: string) {
    seen.add(node);
    order.push(node);
    roles[node] = "active";
    if (from) edgeRoles[`${from}-${node}`] = "sorted";
    rec.bump("visited");
    emit(roles, edgeRoles, `Visit ${node}, going as deep as possible first.`, {}, order);

    for (const { to } of adj.get(node)!) {
      if (seen.has(to)) {
        emit({ ...roles, [to]: "discarded" }, edgeRoles, `${to} is already visited — do not follow it.`, {}, order);
        continue;
      }
      walk(to, node);
      emit(roles, edgeRoles, `Backtrack to ${node} and try its next neighbour.`, {}, order);
    }
    roles[node] = "sorted";
  }

  walk(start);
  emit(roles, edgeRoles, `Finished. Visit order: ${order.join(" → ")}.`, {}, order);
  return {
    frames: rec.frames,
    summary:
      "Depth-first search commits to one path until it dead-ends, then backtracks — a stack, whether explicit or the call stack. It does not find shortest paths, but it is the right tool for connectivity, cycle detection, topological order and anything that needs to know when a subtree is finished. O(V + E).",
  };
}

/* ---------------------------------------------------------------- Dijkstra -- */

export function dijkstra(spec: GraphSpec = SAMPLE_GRAPH, start = "A"): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const emit = graphEmitter(spec, rec);
  const adj = adjacency(spec);
  const dist = new Map<string, number>();
  const settled = new Set<string>();
  const roles: Record<string, Role> = {};
  const edgeRoles: Record<string, Role> = {};

  for (const n of spec.nodes) dist.set(n.id, Infinity);
  dist.set(start, 0);
  const badges = () => Object.fromEntries(
    [...dist].map(([k, v]) => [k, v === Infinity ? "∞" : String(v)])
  );

  roles[start] = "active";
  emit(roles, edgeRoles, `Start at ${start} with distance 0; everything else is unknown, written ∞.`, badges());

  for (;;) {
    let best: string | undefined;
    for (const [id, d] of dist) {
      if (!settled.has(id) && d < Infinity && (best === undefined || d < dist.get(best)!)) best = id;
    }
    if (best === undefined) break;

    settled.add(best);
    roles[best] = "sorted";
    rec.bump("settled");
    emit(roles, edgeRoles,
      `${best} has the smallest tentative distance (${dist.get(best)}), so it is settled — no later path can beat it.`,
      badges());

    for (const { to, weight } of adj.get(best)!) {
      if (settled.has(to)) continue;
      const through = dist.get(best)! + weight;
      rec.bump("relaxations");
      if (through < dist.get(to)!) {
        const previous = dist.get(to)! === Infinity ? "∞" : String(dist.get(to));
        dist.set(to, through);
        edgeRoles[`${best}-${to}`] = "sorted";
        emit({ ...roles, [to]: "compare" }, edgeRoles,
          `Going through ${best} reaches ${to} in ${through}, better than ${previous}. Update it.`,
          badges());
      } else {
        emit({ ...roles, [to]: "discarded" }, edgeRoles,
          `Going through ${best} reaches ${to} in ${through}, no better than ${dist.get(to)}. Leave it.`,
          badges());
      }
    }
  }
  emit(roles, edgeRoles, `Done. The badge under each node is its shortest distance from ${start}.`, badges());
  return {
    frames: rec.frames,
    summary:
      "Dijkstra settles nodes in increasing order of distance, and a settled node is final — nothing found later can improve it, because every edge weight is non-negative. That last clause is the whole precondition: with a negative edge a shorter path can appear after settling, and the algorithm is simply wrong. Use Bellman-Ford there instead.",
  };
}

/* -------------------------------------------------------- topological sort -- */

export function topologicalSort(spec: GraphSpec = SAMPLE_DAG): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const emit = graphEmitter(spec, rec);
  const adj = adjacency(spec);
  const indegree = new Map<string, number>();
  for (const n of spec.nodes) indegree.set(n.id, 0);
  for (const e of spec.edges) indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);

  const roles: Record<string, Role> = {};
  const edgeRoles: Record<string, Role> = {};
  const order: string[] = [];
  const badges = () => Object.fromEntries([...indegree].map(([k, v]) => [k, String(v)]));

  emit(roles, edgeRoles, "Count how many prerequisites each node has — that is its in-degree.", badges(), order);

  const ready = spec.nodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id).sort();
  for (const id of ready) roles[id] = "active";
  emit(roles, edgeRoles, `Nodes with no prerequisites are ready: ${ready.join(", ")}.`, badges(), order);

  while (ready.length) {
    const node = ready.shift()!;
    order.push(node);
    roles[node] = "sorted";
    rec.bump("emitted");
    emit(roles, edgeRoles, `Take ${node} — nothing is waiting on it. Output so far: ${order.join(" → ")}.`, badges(), order);

    for (const { to } of adj.get(node)!) {
      indegree.set(to, indegree.get(to)! - 1);
      edgeRoles[`${node}-${to}`] = "discarded";
      if (indegree.get(to) === 0) {
        ready.push(to);
        roles[to] = "active";
        emit(roles, edgeRoles, `${to} has no remaining prerequisites — it is ready.`, badges(), order);
      } else {
        emit(roles, edgeRoles, `${to} still waits on ${indegree.get(to)} other node(s).`, badges(), order);
      }
    }
    ready.sort();
  }

  const complete = order.length === spec.nodes.length;
  emit(roles, edgeRoles,
    complete
      ? `A valid order: ${order.join(" → ")}.`
      : "Some nodes never reached in-degree zero, which means the graph has a cycle and no valid order exists.",
    badges(), order);
  return {
    frames: rec.frames,
    summary:
      "Kahn's algorithm repeatedly takes a node with no remaining prerequisites and removes it, decrementing its neighbours. If it runs out of ready nodes before emitting everything, the leftovers form a cycle — which makes this a cycle detector as well as a sorter. O(V + E).",
  };
}

/* --------------------------------------------------------------- Union-Find -- */

export function unionFind(): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const spec: GraphSpec = {
    nodes: [
      { id: "0", x: 40, y: 40 }, { id: "1", x: 130, y: 40 }, { id: "2", x: 220, y: 40 },
      { id: "3", x: 310, y: 40 }, { id: "4", x: 85, y: 140 }, { id: "5", x: 265, y: 140 },
    ],
    edges: [],
  };
  const parent = new Map<string, string>(spec.nodes.map((n) => [n.id, n.id]));
  const treeEdges: { from: string; to: string }[] = [];

  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // Path compression: point everything on the way directly at the root.
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };

  const emit = (note: string, roles: Record<string, Role> = {}) => {
    const roots = new Map<string, string[]>();
    for (const n of spec.nodes) {
      const r = find(n.id);
      if (!roots.has(r)) roots.set(r, []);
      roots.get(r)!.push(n.id);
    }
    const badges: Record<string, string> = {};
    for (const n of spec.nodes) badges[n.id] = find(n.id);
    rec.push({
      kind: "graph",
      nodes: spec.nodes.map((n) => ({ id: n.id, label: n.id, x: n.x, y: n.y, role: roles[n.id], badge: badges[n.id] })),
      edges: treeEdges.map((e) => ({ from: e.from, to: e.to, role: "sorted" as Role, directed: true })),
      note,
      stats: { sets: roots.size },
    });
  };

  emit("Six elements, each its own set. The badge is the set's representative.");
  for (const [a, b] of [["0", "1"], ["2", "3"], ["1", "4"], ["3", "5"], ["0", "2"], ["1", "4"]] as [string, string][]) {
    const ra = find(a);
    const rb = find(b);
    rec.bump("finds", 2);
    if (ra === rb) {
      emit(`union(${a}, ${b}): both already have representative ${ra}, so they are in one set. Nothing to do.`,
        { [a]: "discarded", [b]: "discarded" });
      continue;
    }
    emit(`union(${a}, ${b}): representatives ${ra} and ${rb} differ, so the sets must be merged.`,
      { [a]: "compare", [b]: "compare" });
    parent.set(rb, ra);
    treeEdges.push({ from: rb, to: ra });
    rec.bump("unions");
    emit(`Point ${rb} at ${ra}. Everything in both sets now shares one representative.`,
      { [a]: "sorted", [b]: "sorted" });
  }
  emit("Finished. Each arrow points at a parent; following them reaches the representative.");
  return {
    frames: rec.frames,
    summary:
      "Union-Find keeps disjoint sets as a forest, where each node points at a parent and the root names the set. `union` links two roots; `find` walks to the root and — with path compression — flattens the path on the way back. With union by rank as well, both operations are effectively constant time. It is what makes Kruskal's algorithm and dynamic connectivity practical.",
  };
}

/* ------------------------------------------------------------------- MST -- */

export function kruskal(spec: GraphSpec = SAMPLE_GRAPH): Visualisation {
  const rec = new Recorder<GraphFrame>();
  const emit = graphEmitter(spec, rec);
  const parent = new Map<string, string>(spec.nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!));

  const sorted = [...spec.edges].sort((a, b) => (a.weight ?? 1) - (b.weight ?? 1));
  const edgeRoles: Record<string, Role> = {};
  const nodeRoles: Record<string, Role> = {};
  let total = 0;

  emit(nodeRoles, edgeRoles,
    `Sort every edge by weight: ${sorted.map((e) => `${e.from}${e.to}(${e.weight})`).join(", ")}.`);

  for (const e of sorted) {
    const key = `${e.from}-${e.to}`;
    emit({ ...nodeRoles, [e.from]: "compare", [e.to]: "compare" }, { ...edgeRoles, [key]: "compare" },
      `Consider ${e.from}–${e.to}, weight ${e.weight}.`);
    rec.bump("considered");
    if (find(e.from) === find(e.to)) {
      edgeRoles[key] = "discarded";
      emit(nodeRoles, edgeRoles, `${e.from} and ${e.to} are already connected — taking this edge would make a cycle. Skip it.`);
      continue;
    }
    parent.set(find(e.from), find(e.to));
    edgeRoles[key] = "sorted";
    nodeRoles[e.from] = "sorted";
    nodeRoles[e.to] = "sorted";
    total += e.weight ?? 1;
    rec.bump("chosen");
    emit(nodeRoles, edgeRoles, `Take it. Total weight so far: ${total}.`);
  }
  emit(nodeRoles, edgeRoles, `Minimum spanning tree complete, total weight ${total}.`);
  return {
    frames: rec.frames,
    summary:
      "Kruskal's algorithm sorts every edge by weight and takes each one unless it would close a cycle — which Union-Find answers in near-constant time. The result is a minimum spanning tree: every node connected, for the least total weight. It is a greedy algorithm that is provably optimal, which is rarer than it sounds.",
  };
}

/* -------------------------------------------------------- Floyd–Warshall -- */

export function floydWarshall(): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const ids = ["A", "B", "C", "D"];
  const INF = Infinity;
  const d: number[][] = [
    [0, 3, INF, 7],
    [8, 0, 2, INF],
    [5, INF, 0, 1],
    [2, INF, INF, 0],
  ];
  const show = (v: number) => (v === INF ? "∞" : String(v));
  const emit = (note: string, roles: Record<string, Role> = {}) =>
    rec.push({
      kind: "matrix",
      cells: d.map((row) => row.map(show)),
      roles,
      rowLabels: ids,
      colLabels: ids,
      note,
    });

  emit("Start from the direct edges. ∞ means no direct edge — not that there is no path.");
  for (let k = 0; k < ids.length; k++) {
    emit(`Now allow ${ids[k]} as an intermediate stop.`, {});
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;
        rec.bump("comparisons");
        const through = d[i][k] + d[k][j];
        if (through < d[i][j]) {
          const before = show(d[i][j]);
          d[i][j] = through;
          rec.bump("improvements");
          emit(`${ids[i]}→${ids[j]} via ${ids[k]} costs ${through}, better than ${before}.`,
            { [cellKey(i, j)]: "swap", [cellKey(i, k)]: "compare", [cellKey(k, j)]: "compare" });
        }
      }
    }
  }
  emit("Every pair now holds the shortest distance between those two nodes.");
  return {
    frames: rec.frames,
    summary:
      "Floyd–Warshall asks, for every pair, whether routing through some intermediate node is shorter — repeated for every possible intermediate. Three nested loops, O(V³), and it gives *all* pairs at once rather than one source. Unlike Dijkstra it tolerates negative edges, though not negative cycles.",
  };
}

export const GRAPH_ALGOS = {
  bfs: { label: "Breadth-first search", run: () => bfs() },
  dfs: { label: "Depth-first search", run: () => dfs() },
  dijkstra: { label: "Dijkstra's shortest path", run: () => dijkstra() },
  topological: { label: "Topological sort", run: () => topologicalSort() },
  kruskal: { label: "Kruskal's MST", run: () => kruskal() },
  unionfind: { label: "Union-Find", run: () => unionFind() },
  floyd: { label: "Floyd–Warshall", run: () => floydWarshall() },
} as const;

export type GraphAlgoName = keyof typeof GRAPH_ALGOS;
