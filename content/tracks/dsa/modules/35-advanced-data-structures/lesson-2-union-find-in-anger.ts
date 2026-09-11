import type { Lesson } from "@/content/types";

export const unionFindInAngerLesson: Lesson = {
  id: "dsa-advanced-structures-union-find-in-anger",
  slug: "union-find-in-anger",
  moduleSlug: "advanced-data-structures",
  title: "Union-Find in Anger: Storing a Relation to the Parent",
  summary:
    "Union-find becomes far more useful when each node also stores how it relates to its parent. Measured: with one parity bit it answered \"still two-colourable?\" correctly after all 15,000 edges, in 12,262 parent steps against 394,354 edge visits for re-running a colouring search.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Augment union-find with a value relative to the parent",
    "Maintain that value correctly through path compression and union",
    "Detect an odd cycle online with a parity bit",
    "Recognise the problems whose hidden structure is a weighted union-find",
  ],
  sections: [
    {
      id: "a-relation-per-node",
      heading: "A relation per node",
      body: [
        "Plain union-find answers one question: are these two in the same group. The augmented version answers a second: **how are they related** within the group.",
        "Each node stores a value relative to its parent \u2014 a parity bit (same side or opposite side), a difference (`x - parent = 3`), or a ratio (`x / parent = 2.5`). Composing those values along the path to the root gives each node's value relative to the root, and two nodes in the same group are related by comparing their values relative to the shared root.",
        "The parity bit is the simplest case and the one measured here. Its question: can every node be coloured one of two colours so that every edge joins different colours? That is the same as asking whether the graph has an odd cycle.",
      ],
    },
    {
      id: "the-operations",
      heading: "Find and union with a parity bit",
      body: [
        "**Find** walks to the root, then compresses the path. Compression changes each node's parent to the root, so its stored parity must change from \"relative to old parent\" to \"relative to root\". Processing the path from the node nearest the root outward, each node's new parity is its own bit XOR the already-corrected parity of its old parent.",
        "**Adding an edge** `a \u2014 b` requires `a` and `b` to be on opposite sides. Find both. If they share a root, the edge is consistent exactly when their parities to that root differ; if they are equal, this edge closes an odd cycle.",
        "If the roots differ, attach one root under the other. The attached root's parity must make `a` and `b` opposite: `parity[ra] = pa XOR pb XOR 1`, where `pa` and `pb` are the two parities found. Union by size still applies and does not affect that formula, because it is symmetric in `a` and `b`.",
      ],
      examples: [
        {
          id: "parity-union-find-against-a-colouring-search",
          title: "An odd-cycle check after every edge, against a two-colouring search",
          lang: "python",
          code: `# Union-find that remembers one extra bit per node: whether it sits on the
# same side as its parent. That is enough to answer "is the graph still
# two-colourable?" after every edge, and a colouring search from scratch
# is the oracle it is checked against.

from collections import deque

NODES = 40
EDGES = 30
STREAMS = 500

work = [0, 0]  # search steps, union-find steps


def bipartite_by_search(adjacency):
    colour = [-1] * NODES
    for start in range(NODES):
        if colour[start] != -1:
            continue
        colour[start] = 0
        queue = deque([start])
        while queue:
            node = queue.popleft()
            for other in adjacency[node]:
                work[0] += 1
                if colour[other] == -1:
                    colour[other] = 1 - colour[node]
                    queue.append(other)
                elif colour[other] == colour[node]:
                    return False
    return True


parent = []
parity = []
size = []


def find(x):
    # returns the root and x's side relative to it, compressing the path
    path = []
    while parent[x] != x:
        work[1] += 1
        path.append(x)
        x = parent[x]
    root = x
    side = 0
    for node in reversed(path):
        side ^= parity[node]
        parity[node] = side
        parent[node] = root
    return root, side


def add_edge(a, b):
    # False when the edge closes an odd cycle
    ra, pa = find(a)
    rb, pb = find(b)
    if ra == rb:
        return pa != pb
    if size[ra] > size[rb]:
        ra, rb = rb, ra
    parent[ra] = rb
    parity[ra] = pa ^ pb ^ 1
    size[rb] += size[ra]
    return True


# The same linear congruential generator in every language, so the edge
# streams below are the same streams whichever translation is run.
seed = 88120007


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


answers = 0
agreed = 0
first_break_agreed = 0
never_broke = 0
for _ in range(STREAMS):
    adjacency = [[] for _ in range(NODES)]
    parent = list(range(NODES))
    parity = [0] * NODES
    size = [1] * NODES
    still_ok = True
    break_by_search = -1
    break_by_union = -1
    for e in range(EDGES):
        a = rand(NODES)
        b = (a + 1 + rand(NODES - 1)) % NODES  # never a self-loop
        adjacency[a].append(b)
        adjacency[b].append(a)
        if not add_edge(a, b):
            still_ok = False
        by_search = bipartite_by_search(adjacency)
        answers += 1
        if by_search == still_ok:
            agreed += 1
        if not by_search and break_by_search == -1:
            break_by_search = e
        if not still_ok and break_by_union == -1:
            break_by_union = e
    if break_by_search == break_by_union:
        first_break_agreed += 1
    if break_by_search == -1:
        never_broke += 1

print("%d random streams of %d edges over %d nodes" % (STREAMS, EDGES, NODES))
print("after every edge: is the graph still two-colourable?")
print()
print("answers that matched the colouring search    %6d of %d" % (agreed, answers))
print("streams where both agreed on the breaking edge %6d of %d" % (first_break_agreed, STREAMS))
print("streams that stayed two-colourable throughout  %6d" % never_broke)
print()
print("work over all streams")
print("  colouring search, rerun after each edge  %10d edge visits" % work[0])
print("  union-find with a parity bit             %10d parent steps" % work[1])
`,
          output: `500 random streams of 30 edges over 40 nodes
after every edge: is the graph still two-colourable?

answers that matched the colouring search     15000 of 15000
streams where both agreed on the breaking edge    500 of 500
streams that stayed two-colourable throughout     156

work over all streams
  colouring search, rerun after each edge      394354 edge visits
  union-find with a parity bit                  12262 parent steps`,
          explanation:
            "Over 500 random streams of 30 edges on 40 nodes, the parity union-find and a breadth-first two-colouring rerun from scratch gave the same answer after all 15,000 edges, and named the same breaking edge in all 500 streams; 156 streams never broke. The search spent 394,354 edge visits because it re-colours the whole graph after each edge. The union-find spent 12,262 parent steps in total, because it only ever walks the two paths to the roots and compresses them.",
          alternates: [
            {
              lang: "javascript",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

const NODES = 40;
const EDGES = 30;
const STREAMS = 500;

const work = [0, 0]; // search steps, union-find steps

function bipartiteBySearch(adjacency) {
  const colour = new Array(NODES).fill(-1);
  for (let start = 0; start < NODES; start++) {
    if (colour[start] !== -1) continue;
    colour[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      for (const other of adjacency[node]) {
        work[0] += 1;
        if (colour[other] === -1) {
          colour[other] = 1 - colour[node];
          queue.push(other);
        } else if (colour[other] === colour[node]) {
          return false;
        }
      }
    }
  }
  return true;
}

let parent = [];
let parity = [];
let size = [];

function find(x) {
  // returns the root and x's side relative to it, compressing the path
  const path = [];
  while (parent[x] !== x) {
    work[1] += 1;
    path.push(x);
    x = parent[x];
  }
  const root = x;
  let side = 0;
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    side ^= parity[node];
    parity[node] = side;
    parent[node] = root;
  }
  return [root, side];
}

function addEdge(a, b) {
  // false when the edge closes an odd cycle
  let [ra, pa] = find(a);
  let [rb, pb] = find(b);
  if (ra === rb) return pa !== pb;
  if (size[ra] > size[rb]) {
    const swap = ra;
    ra = rb;
    rb = swap;
  }
  parent[ra] = rb;
  parity[ra] = pa ^ pb ^ 1;
  size[rb] += size[ra];
  return true;
}

// The same linear congruential generator in every language, so the edge
// streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 88120007n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let answers = 0;
let agreed = 0;
let firstBreakAgreed = 0;
let neverBroke = 0;
for (let s = 0; s < STREAMS; s++) {
  const adjacency = [];
  for (let i = 0; i < NODES; i++) adjacency.push([]);
  parent = [];
  for (let i = 0; i < NODES; i++) parent.push(i);
  parity = new Array(NODES).fill(0);
  size = new Array(NODES).fill(1);
  let stillOk = true;
  let breakBySearch = -1;
  let breakByUnion = -1;
  for (let e = 0; e < EDGES; e++) {
    const a = rand(NODES);
    const b = (a + 1 + rand(NODES - 1)) % NODES; // never a self-loop
    adjacency[a].push(b);
    adjacency[b].push(a);
    if (!addEdge(a, b)) stillOk = false;
    const bySearch = bipartiteBySearch(adjacency);
    answers += 1;
    if (bySearch === stillOk) agreed += 1;
    if (!bySearch && breakBySearch === -1) breakBySearch = e;
    if (!stillOk && breakByUnion === -1) breakByUnion = e;
  }
  if (breakBySearch === breakByUnion) firstBreakAgreed += 1;
  if (breakBySearch === -1) neverBroke += 1;
}

console.log(STREAMS + " random streams of " + EDGES + " edges over " + NODES + " nodes");
console.log("after every edge: is the graph still two-colourable?");
console.log();
console.log("answers that matched the colouring search    " + padLeft(agreed, 6) + " of " + answers);
console.log(
  "streams where both agreed on the breaking edge " + padLeft(firstBreakAgreed, 6) + " of " + STREAMS,
);
console.log("streams that stayed two-colourable throughout  " + padLeft(neverBroke, 6));
console.log();
console.log("work over all streams");
console.log("  colouring search, rerun after each edge  " + padLeft(work[0], 10) + " edge visits");
console.log("  union-find with a parity bit             " + padLeft(work[1], 10) + " parent steps");
`,
            },
            {
              lang: "typescript",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

const NODES = 40;
const EDGES = 30;
const STREAMS = 500;

const work = [0, 0]; // search steps, union-find steps

function bipartiteBySearch(adjacency: number[][]): boolean {
  const colour = new Array(NODES).fill(-1);
  for (let start = 0; start < NODES; start++) {
    if (colour[start] !== -1) continue;
    colour[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      for (const other of adjacency[node]) {
        work[0] += 1;
        if (colour[other] === -1) {
          colour[other] = 1 - colour[node];
          queue.push(other);
        } else if (colour[other] === colour[node]) {
          return false;
        }
      }
    }
  }
  return true;
}

let parent: number[] = [];
let parity: number[] = [];
let size: number[] = [];

function find(x: number): [number, number] {
  // returns the root and x's side relative to it, compressing the path
  const path: number[] = [];
  while (parent[x] !== x) {
    work[1] += 1;
    path.push(x);
    x = parent[x];
  }
  const root = x;
  let side = 0;
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    side ^= parity[node];
    parity[node] = side;
    parent[node] = root;
  }
  return [root, side];
}

function addEdge(a: number, b: number): boolean {
  // false when the edge closes an odd cycle
  let [ra, pa] = find(a);
  let [rb, pb] = find(b);
  if (ra === rb) return pa !== pb;
  if (size[ra] > size[rb]) {
    const swap = ra;
    ra = rb;
    rb = swap;
  }
  parent[ra] = rb;
  parity[ra] = pa ^ pb ^ 1;
  size[rb] += size[ra];
  return true;
}

// The same linear congruential generator in every language, so the edge
// streams below are the same streams whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 88120007n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let answers = 0;
let agreed = 0;
let firstBreakAgreed = 0;
let neverBroke = 0;
for (let s = 0; s < STREAMS; s++) {
  const adjacency: number[][] = [];
  for (let i = 0; i < NODES; i++) adjacency.push([]);
  parent = [];
  for (let i = 0; i < NODES; i++) parent.push(i);
  parity = new Array(NODES).fill(0);
  size = new Array(NODES).fill(1);
  let stillOk = true;
  let breakBySearch = -1;
  let breakByUnion = -1;
  for (let e = 0; e < EDGES; e++) {
    const a = rand(NODES);
    const b = (a + 1 + rand(NODES - 1)) % NODES; // never a self-loop
    adjacency[a].push(b);
    adjacency[b].push(a);
    if (!addEdge(a, b)) stillOk = false;
    const bySearch = bipartiteBySearch(adjacency);
    answers += 1;
    if (bySearch === stillOk) agreed += 1;
    if (!bySearch && breakBySearch === -1) breakBySearch = e;
    if (!stillOk && breakByUnion === -1) breakByUnion = e;
  }
  if (breakBySearch === breakByUnion) firstBreakAgreed += 1;
  if (breakBySearch === -1) neverBroke += 1;
}

console.log(STREAMS + " random streams of " + EDGES + " edges over " + NODES + " nodes");
console.log("after every edge: is the graph still two-colourable?");
console.log();
console.log("answers that matched the colouring search    " + padLeft(agreed, 6) + " of " + answers);
console.log(
  "streams where both agreed on the breaking edge " + padLeft(firstBreakAgreed, 6) + " of " + STREAMS,
);
console.log("streams that stayed two-colourable throughout  " + padLeft(neverBroke, 6));
console.log();
console.log("work over all streams");
console.log("  colouring search, rerun after each edge  " + padLeft(work[0], 10) + " edge visits");
console.log("  union-find with a parity bit             " + padLeft(work[1], 10) + " parent steps");
`,
            },
            {
              lang: "java",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

import java.util.ArrayList;
import java.util.List;

public class Main {
  static final int NODES = 40;
  static final int EDGES = 30;
  static final int STREAMS = 500;

  static long searchWork = 0;
  static long unionWork = 0;

  static boolean bipartiteBySearch(List<List<Integer>> adjacency) {
    int[] colour = new int[NODES];
    java.util.Arrays.fill(colour, -1);
    int[] queue = new int[NODES];
    for (int start = 0; start < NODES; start++) {
      if (colour[start] != -1) {
        continue;
      }
      colour[start] = 0;
      int head = 0;
      int tail = 0;
      queue[tail++] = start;
      while (head < tail) {
        int node = queue[head++];
        for (int other : adjacency.get(node)) {
          searchWork += 1;
          if (colour[other] == -1) {
            colour[other] = 1 - colour[node];
            queue[tail++] = other;
          } else if (colour[other] == colour[node]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  static int[] parent = new int[NODES];
  static int[] parity = new int[NODES];
  static int[] size = new int[NODES];

  // returns the root, and leaves x's side relative to it in foundSide
  static int foundSide = 0;

  static int find(int x) {
    // compresses the path as it goes
    int[] path = new int[NODES];
    int length = 0;
    while (parent[x] != x) {
      unionWork += 1;
      path[length++] = x;
      x = parent[x];
    }
    int root = x;
    int side = 0;
    for (int i = length - 1; i >= 0; i--) {
      int node = path[i];
      side ^= parity[node];
      parity[node] = side;
      parent[node] = root;
    }
    foundSide = side;
    return root;
  }

  static boolean addEdge(int a, int b) {
    // false when the edge closes an odd cycle
    int ra = find(a);
    int pa = foundSide;
    int rb = find(b);
    int pb = foundSide;
    if (ra == rb) {
      return pa != pb;
    }
    if (size[ra] > size[rb]) {
      int swap = ra;
      ra = rb;
      rb = swap;
    }
    parent[ra] = rb;
    parity[ra] = pa ^ pb ^ 1;
    size[rb] += size[ra];
    return true;
  }

  // The same linear congruential generator in every language, so the edge
  // streams below are the same streams whichever translation is run.
  static long seed = 88120007L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    int answers = 0;
    int agreed = 0;
    int firstBreakAgreed = 0;
    int neverBroke = 0;
    for (int s = 0; s < STREAMS; s++) {
      List<List<Integer>> adjacency = new ArrayList<>();
      for (int i = 0; i < NODES; i++) {
        adjacency.add(new ArrayList<>());
        parent[i] = i;
        parity[i] = 0;
        size[i] = 1;
      }
      boolean stillOk = true;
      int breakBySearch = -1;
      int breakByUnion = -1;
      for (int e = 0; e < EDGES; e++) {
        int a = rand(NODES);
        int b = (a + 1 + rand(NODES - 1)) % NODES; // never a self-loop
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
        if (!addEdge(a, b)) {
          stillOk = false;
        }
        boolean bySearch = bipartiteBySearch(adjacency);
        answers += 1;
        if (bySearch == stillOk) {
          agreed += 1;
        }
        if (!bySearch && breakBySearch == -1) {
          breakBySearch = e;
        }
        if (!stillOk && breakByUnion == -1) {
          breakByUnion = e;
        }
      }
      if (breakBySearch == breakByUnion) {
        firstBreakAgreed += 1;
      }
      if (breakBySearch == -1) {
        neverBroke += 1;
      }
    }

    System.out.printf("%d random streams of %d edges over %d nodes%n", STREAMS, EDGES, NODES);
    System.out.println("after every edge: is the graph still two-colourable?");
    System.out.println();
    System.out.printf("answers that matched the colouring search    %6d of %d%n", agreed, answers);
    System.out.printf(
        "streams where both agreed on the breaking edge %6d of %d%n", firstBreakAgreed, STREAMS);
    System.out.printf("streams that stayed two-colourable throughout  %6d%n", neverBroke);
    System.out.println();
    System.out.println("work over all streams");
    System.out.printf("  colouring search, rerun after each edge  %10d edge visits%n", searchWork);
    System.out.printf("  union-find with a parity bit             %10d parent steps%n", unionWork);
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

#include <cstdio>
#include <utility>
#include <vector>

static const int NODES = 40;
static const int EDGES = 30;
static const int STREAMS = 500;

long long searchWork = 0;
long long unionWork = 0;

bool bipartiteBySearch(const std::vector<std::vector<int> >& adjacency) {
  std::vector<int> colour(NODES, -1);
  std::vector<int> queue;
  for (int start = 0; start < NODES; start++) {
    if (colour[start] != -1) {
      continue;
    }
    colour[start] = 0;
    queue.assign(1, start);
    size_t head = 0;
    while (head < queue.size()) {
      int node = queue[head++];
      for (int other : adjacency[node]) {
        searchWork += 1;
        if (colour[other] == -1) {
          colour[other] = 1 - colour[node];
          queue.push_back(other);
        } else if (colour[other] == colour[node]) {
          return false;
        }
      }
    }
  }
  return true;
}

std::vector<int> parent(NODES);
std::vector<int> parity(NODES);
std::vector<int> sizeOf(NODES);

std::pair<int, int> find(int x) {
  // returns the root and x's side relative to it, compressing the path
  std::vector<int> path;
  while (parent[x] != x) {
    unionWork += 1;
    path.push_back(x);
    x = parent[x];
  }
  int root = x;
  int side = 0;
  for (int i = (int)path.size() - 1; i >= 0; i--) {
    int node = path[i];
    side ^= parity[node];
    parity[node] = side;
    parent[node] = root;
  }
  return std::make_pair(root, side);
}

bool addEdge(int a, int b) {
  // false when the edge closes an odd cycle
  std::pair<int, int> fa = find(a);
  std::pair<int, int> fb = find(b);
  int ra = fa.first;
  int rb = fb.first;
  if (ra == rb) {
    return fa.second != fb.second;
  }
  if (sizeOf[ra] > sizeOf[rb]) {
    std::swap(ra, rb);
  }
  parent[ra] = rb;
  parity[ra] = fa.second ^ fb.second ^ 1;
  sizeOf[rb] += sizeOf[ra];
  return true;
}

// The same linear congruential generator in every language, so the edge
// streams below are the same streams whichever translation is run.
long long seed = 88120007LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  int answers = 0;
  int agreed = 0;
  int firstBreakAgreed = 0;
  int neverBroke = 0;
  for (int s = 0; s < STREAMS; s++) {
    std::vector<std::vector<int> > adjacency(NODES);
    for (int i = 0; i < NODES; i++) {
      parent[i] = i;
      parity[i] = 0;
      sizeOf[i] = 1;
    }
    bool stillOk = true;
    int breakBySearch = -1;
    int breakByUnion = -1;
    for (int e = 0; e < EDGES; e++) {
      int a = rand_below(NODES);
      int b = (a + 1 + rand_below(NODES - 1)) % NODES;  // never a self-loop
      adjacency[a].push_back(b);
      adjacency[b].push_back(a);
      if (!addEdge(a, b)) {
        stillOk = false;
      }
      bool bySearch = bipartiteBySearch(adjacency);
      answers += 1;
      if (bySearch == stillOk) {
        agreed += 1;
      }
      if (!bySearch && breakBySearch == -1) {
        breakBySearch = e;
      }
      if (!stillOk && breakByUnion == -1) {
        breakByUnion = e;
      }
    }
    if (breakBySearch == breakByUnion) {
      firstBreakAgreed += 1;
    }
    if (breakBySearch == -1) {
      neverBroke += 1;
    }
  }

  std::printf("%d random streams of %d edges over %d nodes\\n", STREAMS, EDGES, NODES);
  std::printf("after every edge: is the graph still two-colourable?\\n");
  std::printf("\\n");
  std::printf("answers that matched the colouring search    %6d of %d\\n", agreed, answers);
  std::printf("streams where both agreed on the breaking edge %6d of %d\\n", firstBreakAgreed,
              STREAMS);
  std::printf("streams that stayed two-colourable throughout  %6d\\n", neverBroke);
  std::printf("\\n");
  std::printf("work over all streams\\n");
  std::printf("  colouring search, rerun after each edge  %10lld edge visits\\n", searchWork);
  std::printf("  union-find with a parity bit             %10lld parent steps\\n", unionWork);
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

use std::collections::VecDeque;

const NODES: usize = 40;
const EDGES: usize = 30;
const STREAMS: usize = 500;

fn bipartite_by_search(adjacency: &[Vec<usize>], work: &mut i64) -> bool {
    let mut colour = vec![-1i32; NODES];
    for start in 0..NODES {
        if colour[start] != -1 {
            continue;
        }
        colour[start] = 0;
        let mut queue: VecDeque<usize> = VecDeque::new();
        queue.push_back(start);
        while let Some(node) = queue.pop_front() {
            for &other in adjacency[node].iter() {
                *work += 1;
                if colour[other] == -1 {
                    colour[other] = 1 - colour[node];
                    queue.push_back(other);
                } else if colour[other] == colour[node] {
                    return false;
                }
            }
        }
    }
    true
}

struct Groups {
    parent: Vec<usize>,
    parity: Vec<u8>,
    size: Vec<usize>,
    work: i64,
}

impl Groups {
    fn new() -> Groups {
        Groups {
            parent: (0..NODES).collect(),
            parity: vec![0; NODES],
            size: vec![1; NODES],
            work: 0,
        }
    }

    fn find(&mut self, start: usize) -> (usize, u8) {
        // returns the root and the node's side relative to it, compressing the path
        let mut path: Vec<usize> = Vec::new();
        let mut x = start;
        while self.parent[x] != x {
            self.work += 1;
            path.push(x);
            x = self.parent[x];
        }
        let root = x;
        let mut side = 0;
        for &node in path.iter().rev() {
            side ^= self.parity[node];
            self.parity[node] = side;
            self.parent[node] = root;
        }
        (root, side)
    }

    fn add_edge(&mut self, a: usize, b: usize) -> bool {
        // false when the edge closes an odd cycle
        let (mut ra, pa) = self.find(a);
        let (mut rb, pb) = self.find(b);
        if ra == rb {
            return pa != pb;
        }
        if self.size[ra] > self.size[rb] {
            std::mem::swap(&mut ra, &mut rb);
        }
        self.parent[ra] = rb;
        self.parity[ra] = pa ^ pb ^ 1;
        self.size[rb] += self.size[ra];
        true
    }
}

// The same linear congruential generator in every language, so the edge
// streams below are the same streams whichever translation is run.
static mut SEED: i64 = 88120007;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let mut search_work: i64 = 0;
    let mut union_work: i64 = 0;
    let mut answers = 0;
    let mut agreed = 0;
    let mut first_break_agreed = 0;
    let mut never_broke = 0;
    for _ in 0..STREAMS {
        let mut adjacency: Vec<Vec<usize>> = vec![Vec::new(); NODES];
        let mut groups = Groups::new();
        let mut still_ok = true;
        let mut break_by_search: i64 = -1;
        let mut break_by_union: i64 = -1;
        for e in 0..EDGES {
            let a = rand_below(NODES as i64) as usize;
            let b = (a + 1 + rand_below(NODES as i64 - 1) as usize) % NODES; // never a self-loop
            adjacency[a].push(b);
            adjacency[b].push(a);
            if !groups.add_edge(a, b) {
                still_ok = false;
            }
            let by_search = bipartite_by_search(&adjacency, &mut search_work);
            answers += 1;
            if by_search == still_ok {
                agreed += 1;
            }
            if !by_search && break_by_search == -1 {
                break_by_search = e as i64;
            }
            if !still_ok && break_by_union == -1 {
                break_by_union = e as i64;
            }
        }
        union_work += groups.work;
        if break_by_search == break_by_union {
            first_break_agreed += 1;
        }
        if break_by_search == -1 {
            never_broke += 1;
        }
    }

    println!("{} random streams of {} edges over {} nodes", STREAMS, EDGES, NODES);
    println!("after every edge: is the graph still two-colourable?");
    println!();
    println!("answers that matched the colouring search    {:>6} of {}", agreed, answers);
    println!(
        "streams where both agreed on the breaking edge {:>6} of {}",
        first_break_agreed, STREAMS
    );
    println!("streams that stayed two-colourable throughout  {:>6}", never_broke);
    println!();
    println!("work over all streams");
    println!("  colouring search, rerun after each edge  {:>10} edge visits", search_work);
    println!("  union-find with a parity bit             {:>10} parent steps", union_work);
}
`,
            },
            {
              lang: "go",
              code: `// Union-find that remembers one extra bit per node: whether it sits on the
// same side as its parent. That is enough to answer "is the graph still
// two-colourable?" after every edge, and a colouring search from scratch
// is the oracle it is checked against.

package main

import "fmt"

const nodes = 40
const edges = 30
const streams = 500

var searchWork int64
var unionWork int64

func bipartiteBySearch(adjacency [][]int) bool {
	colour := make([]int, nodes)
	for i := range colour {
		colour[i] = -1
	}
	for start := 0; start < nodes; start++ {
		if colour[start] != -1 {
			continue
		}
		colour[start] = 0
		queue := []int{start}
		for head := 0; head < len(queue); head++ {
			node := queue[head]
			for _, other := range adjacency[node] {
				searchWork++
				if colour[other] == -1 {
					colour[other] = 1 - colour[node]
					queue = append(queue, other)
				} else if colour[other] == colour[node] {
					return false
				}
			}
		}
	}
	return true
}

var parent [nodes]int
var parity [nodes]int
var size [nodes]int

func find(x int) (int, int) {
	// returns the root and x's side relative to it, compressing the path
	path := []int{}
	for parent[x] != x {
		unionWork++
		path = append(path, x)
		x = parent[x]
	}
	root := x
	side := 0
	for i := len(path) - 1; i >= 0; i-- {
		node := path[i]
		side ^= parity[node]
		parity[node] = side
		parent[node] = root
	}
	return root, side
}

func addEdge(a, b int) bool {
	// false when the edge closes an odd cycle
	ra, pa := find(a)
	rb, pb := find(b)
	if ra == rb {
		return pa != pb
	}
	if size[ra] > size[rb] {
		ra, rb = rb, ra
	}
	parent[ra] = rb
	parity[ra] = pa ^ pb ^ 1
	size[rb] += size[ra]
	return true
}

// The same linear congruential generator in every language, so the edge
// streams below are the same streams whichever translation is run.
var seed int64 = 88120007

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func main() {
	answers := 0
	agreed := 0
	firstBreakAgreed := 0
	neverBroke := 0
	for s := 0; s < streams; s++ {
		adjacency := make([][]int, nodes)
		for i := 0; i < nodes; i++ {
			parent[i] = i
			parity[i] = 0
			size[i] = 1
		}
		stillOk := true
		breakBySearch := -1
		breakByUnion := -1
		for e := 0; e < edges; e++ {
			a := int(randBelow(nodes))
			b := (a + 1 + int(randBelow(nodes-1))) % nodes // never a self-loop
			adjacency[a] = append(adjacency[a], b)
			adjacency[b] = append(adjacency[b], a)
			if !addEdge(a, b) {
				stillOk = false
			}
			bySearch := bipartiteBySearch(adjacency)
			answers++
			if bySearch == stillOk {
				agreed++
			}
			if !bySearch && breakBySearch == -1 {
				breakBySearch = e
			}
			if !stillOk && breakByUnion == -1 {
				breakByUnion = e
			}
		}
		if breakBySearch == breakByUnion {
			firstBreakAgreed++
		}
		if breakBySearch == -1 {
			neverBroke++
		}
	}

	fmt.Printf("%d random streams of %d edges over %d nodes\\n", streams, edges, nodes)
	fmt.Println("after every edge: is the graph still two-colourable?")
	fmt.Println()
	fmt.Printf("answers that matched the colouring search    %6d of %d\\n", agreed, answers)
	fmt.Printf("streams where both agreed on the breaking edge %6d of %d\\n", firstBreakAgreed, streams)
	fmt.Printf("streams that stayed two-colourable throughout  %6d\\n", neverBroke)
	fmt.Println()
	fmt.Println("work over all streams")
	fmt.Printf("  colouring search, rerun after each edge  %10d edge visits\\n", searchWork)
	fmt.Printf("  union-find with a parity bit             %10d parent steps\\n", unionWork)
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "what-it-is-secretly-the-answer-to",
      heading: "Problems that are secretly this",
      body: [
        "The recognisable shape is: items arrive with pairwise constraints, and the question is whether the constraints are consistent or what they imply. The value stored per node is what changes.",
        "**\"x and y are equal\" / \"x and y differ\" with two possible values** \u2014 the parity bit, unchanged. Equal adds parity 0 between them; differ adds parity 1. A contradiction is a same-root pair whose parity disagrees with the new constraint.",
        "**Ratio equations**, such as `a / b = 2`, `b / c = 3`, then query `a / c`. Store each node's ratio to its parent; compose by multiplying along the path; the answer is `ratio(a) / ratio(c)` if they share a root, and unknown otherwise.",
        "**Difference constraints**, such as `x - y = 5`. Store an offset to the parent; compose by adding; a contradiction is a same-root pair whose offsets disagree.",
        "**Redundant connection** \u2014 the first edge whose endpoints already share a root is the one that creates a cycle. No extra value needed, only the order of arrival.",
        "**Grouping by any shared attribute** \u2014 accounts sharing an email, cells switched on in a grid merging with lit neighbours. Union on the shared key; the component count after each arrival is the answer, maintained by decrementing it on every successful union.",
      ],
      pitfalls: [
        {
          title: "Compressing the path without updating the stored value",
          body: "Once a node points directly at the root, a value that was relative to its old parent is wrong. Recompute it during compression, from the root outward.",
        },
        {
          title: "Treating a self-loop as harmless",
          body: "An edge from a node to itself puts the node on both sides. It is an odd cycle, and the parity check catches it because the node shares a root with itself at equal parity.",
        },
        {
          title: "Using this when edges can be removed",
          body: "The augmentation inherits union-find's limitation: there is no delete. If constraints can be withdrawn, process offline in reverse or use a different structure.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you check after every edge whether a growing graph is still bipartite?",
      answer:
        "Union-find with a parity bit per node recording whether it is on the same side as its parent. Find returns the root and the node's parity to the root, fixing parities during path compression. For an edge a-b, if both share a root, the edge is fine exactly when their parities differ, and equal parities mean an odd cycle. Otherwise attach one root under the other with parity pa XOR pb XOR 1. I checked this against a two-colouring BFS rerun after every edge: same answer on all 15,000 edges, 12,262 parent steps against 394,354 edge visits.",
    },
    {
      question: "What kinds of problems are weighted union-find problems in disguise?",
      answer:
        "Anything where items arrive with pairwise relations and you need consistency or implications. Equal-or-different constraints over two values are the parity bit. Ratio equations like a/b = 2, b/c = 3, query a/c are a multiplicative weight to the parent. Difference constraints like x - y = 5 are an additive offset. Redundant connection is the first edge whose endpoints already share a root. Merging accounts by shared email or counting islands as cells switch on is plain union with a component counter. The one thing none of them can handle is deletion, since union-find cannot split a set.",
    },
  ],
  takeaways: [
    "Store each node's relation to its parent; compose along the path to the root",
    "Path compression must recompute the stored value relative to the new parent",
    "Same root and equal parity means the new edge closes an odd cycle",
    "Union sets the attached root's parity to pa XOR pb XOR 1",
    "Measured: 15,000 of 15,000 answers right, 12,262 parent steps against 394,354 edge visits",
    "Ratios multiply along the path; differences add",
    "A self-loop is an odd cycle",
    "No deletion, so withdrawn constraints need offline reversal",
  ],
};
