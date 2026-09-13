import type { Lesson } from "@/content/types";

export const shortestPathsAsDpLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-shortest-paths-as-dp",
  slug: "shortest-paths-as-dp",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Shortest Paths as Dynamic Programming",
  summary:
    "Bellman-Ford is a DP over the number of edges used, and making that explicit is what solves shortest paths with a hop limit. Measured: reading the previous round from a frozen copy matched every walk on 1,000 of 1,000 graphs; updating in place matched 762.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Write shortest paths as a recurrence over the number of edges used",
    "Implement a hop-limited shortest path with one frozen array per round",
    "Explain why in-place relaxation breaks the limit",
    "Place longest paths on DAGs and Floyd–Warshall in the same framework",
  ],
  sections: [
    {
      id: "the-recurrence",
      heading: "The recurrence",
      body: [
        "Let `dp[j][v]` be the cheapest cost of reaching `v` from the source using **at most** `j` edges. With no edges only the source is reachable: `dp[0][source] = 0`, everything else infinite. For `j \u2265 1`, the best walk of at most `j` edges to `v` either uses at most `j - 1` edges, or ends with some edge `u \u2192 v` after at most `j - 1` edges to `u`:",
        "`dp[j][v] = min(dp[j-1][v], min over edges u\u2192v of dp[j-1][u] + w)`",
        "Every value in round `j` is computed from round `j - 1` only. With no negative cycles a shortest path uses at most `n - 1` edges, so `dp[n-1]` holds the ordinary shortest distances. That is Bellman\u2013Ford, stated as the DP it always was.",
      ],
    },
    {
      id: "the-limit",
      heading: "A hop limit, and the in-place shortcut that breaks it",
      body: [
        "Standard Bellman\u2013Ford updates one array in place: within a round, a node improved early can pass its new value on to a later edge in the same round. For unlimited shortest paths that is a free speed-up \u2014 more improvement per round never hurts.",
        "With a limit of `k` edges it is a bug. A value improved in round `j` may already use `j` edges; reading it again within round `j` produces a walk of `j + 1` or more edges, so after `k` rounds some distances use more than `k` edges and come out too cheap. The fix is to read from a copy of the previous round, so each round adds at most one edge.",
        "Dijkstra does not solve this directly either: the cheapest path to a node may use too many edges, while a dearer path with fewer edges is the one a later node needs. Dijkstra over `(node, edges used)` states works, at `k` times the size.",
      ],
      examples: [
        {
          id: "hop-limited-shortest-paths",
          title: "A frozen array per round against in-place updates, checked against every walk",
          lang: "python",
          code: `# Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
# way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
# single array in place looks the same and lets one round use several edges.
# Both are checked against enumerating every walk.

INF = 1 << 40


def by_rounds(n, edges, source, limit, in_place):
    best = [INF] * n
    best[source] = 0
    relaxations = 0
    for _ in range(limit):
        read = best if in_place else list(best)   # the previous round, frozen
        for u, v, w in edges:
            relaxations += 1
            if read[u] + w < best[v]:
                best[v] = read[u] + w
    return best, relaxations


def by_enumeration(n, edges, source, limit):
    best = [INF] * n
    stack = [[source, 0, 0]]
    while stack:
        node, cost, used = stack.pop()
        if cost < best[node]:
            best[node] = cost
        if used == limit:
            continue
        for u, v, w in edges:
            if u == node:
                stack.append([v, cost + w, used + 1])
    return best


# The same linear congruential generator in every language, so the graphs
# below are the same graphs whichever translation is run.
seed = 74500027


def rand(k):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % k


TRIALS = 1000
layered_right = 0
in_place_right = 0
for _ in range(TRIALS):
    n = 6
    edges = []
    for _ in range(12):
        u = rand(n)
        v = rand(n)
        if u != v:
            edges.append((u, v, 1 + rand(20)))
    limit = rand(4)
    truth = by_enumeration(n, edges, 0, limit)
    if by_rounds(n, edges, 0, limit, False)[0] == truth:
        layered_right += 1
    if by_rounds(n, edges, 0, limit, True)[0] == truth:
        in_place_right += 1
print("%d random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk" % TRIALS)
print("  a fresh array per round   matched  %d" % layered_right)
print("  one array updated in place matched %d" % in_place_right)
print()

n = 300
edges = []
for _ in range(1500):
    u = rand(n)
    v = rand(n)
    if u != v:
        edges.append((u, v, 1 + rand(100)))
unlimited, _ = by_rounds(n, edges, 0, n - 1, False)
print("one graph of %d nodes and %d edges, from node 0" % (n, len(edges)))
print()
print("  edge limit   reachable   limit raises the cost   relaxations")
for limit in [1, 2, 4, 8, 16, 32]:
    best, relaxations = by_rounds(n, edges, 0, limit, False)
    reachable = 0
    dearer = 0
    for v in range(n):
        if best[v] < INF:
            reachable += 1
            if best[v] > unlimited[v]:
                dearer += 1
    print("%12d %11d %23d %13d" % (limit, reachable, dearer, relaxations))
`,
          output: `1000 random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk
  a fresh array per round   matched  1000
  one array updated in place matched 762

one graph of 300 nodes and 1497 edges, from node 0

  edge limit   reachable   limit raises the cost   relaxations
           1           2                       0          1497
           2           6                       0          2994
           4          79                      24          5988
           8         299                      51         11976
          16         299                       0         23952
          32         299                       0         47904`,
          explanation:
            "On 1,000 random six-node graphs with limits of 0 to 3 edges, reading from a frozen copy of the previous round matched enumerating every walk 1,000 times; updating one array in place matched 762 times. The second table runs the frozen version on one 300-node graph. With a limit of 4 edges, 79 nodes are reachable and 24 of them cost more than their unlimited shortest path; at 8 edges every node is reachable and 51 still cost more; from 16 edges on the limit changes nothing. Relaxations are the limit times the 1,497 edges.",
          alternates: [
            {
              lang: "javascript",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

const INF = 2 ** 40;

function byRounds(n, edges, source, limit, inPlace) {
  const best = new Array(n).fill(INF);
  best[source] = 0;
  let relaxations = 0;
  for (let round = 0; round < limit; round++) {
    const read = inPlace ? best : best.slice(); // the previous round, frozen
    for (const [u, v, w] of edges) {
      relaxations += 1;
      if (read[u] + w < best[v]) best[v] = read[u] + w;
    }
  }
  return [best, relaxations];
}

function byEnumeration(n, edges, source, limit) {
  const best = new Array(n).fill(INF);
  const stack = [[source, 0, 0]];
  while (stack.length > 0) {
    const [node, cost, used] = stack.pop();
    if (cost < best[node]) best[node] = cost;
    if (used === limit) continue;
    for (const [u, v, w] of edges) {
      if (u === node) stack.push([v, cost + w, used + 1]);
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 74500027n;

function rand(k) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 1000;
let layeredRight = 0;
let inPlaceRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 6;
  const edges = [];
  for (let i = 0; i < 12; i++) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v, 1 + rand(20)]);
  }
  const limit = rand(4);
  const truth = byEnumeration(n, edges, 0, limit).join(",");
  if (byRounds(n, edges, 0, limit, false)[0].join(",") === truth) layeredRight += 1;
  if (byRounds(n, edges, 0, limit, true)[0].join(",") === truth) inPlaceRight += 1;
}
console.log(TRIALS + " random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk");
console.log("  a fresh array per round   matched  " + layeredRight);
console.log("  one array updated in place matched " + inPlaceRight);
console.log();

const n = 300;
const edges = [];
for (let i = 0; i < 1500; i++) {
  const u = rand(n);
  const v = rand(n);
  if (u !== v) edges.push([u, v, 1 + rand(100)]);
}
const [unlimited] = byRounds(n, edges, 0, n - 1, false);
console.log("one graph of " + n + " nodes and " + edges.length + " edges, from node 0");
console.log();
console.log("  edge limit   reachable   limit raises the cost   relaxations");
for (const limit of [1, 2, 4, 8, 16, 32]) {
  const [best, relaxations] = byRounds(n, edges, 0, limit, false);
  let reachable = 0;
  let dearer = 0;
  for (let v = 0; v < n; v++) {
    if (best[v] < INF) {
      reachable += 1;
      if (best[v] > unlimited[v]) dearer += 1;
    }
  }
  console.log(padLeft(limit, 12) + " " + padLeft(reachable, 11) + " " + padLeft(dearer, 23) + " " + padLeft(relaxations, 13));
}
`,
            },
            {
              lang: "typescript",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

type Edge = [number, number, number];

const INF = 2 ** 40;

function byRounds(n: number, edges: Edge[], source: number, limit: number, inPlace: boolean): [number[], number] {
  const best: number[] = new Array(n).fill(INF);
  best[source] = 0;
  let relaxations = 0;
  for (let round = 0; round < limit; round++) {
    const read = inPlace ? best : best.slice(); // the previous round, frozen
    for (const [u, v, w] of edges) {
      relaxations += 1;
      if (read[u] + w < best[v]) best[v] = read[u] + w;
    }
  }
  return [best, relaxations];
}

function byEnumeration(n: number, edges: Edge[], source: number, limit: number): number[] {
  const best: number[] = new Array(n).fill(INF);
  const stack: number[][] = [[source, 0, 0]];
  while (stack.length > 0) {
    const [node, cost, used] = stack.pop()!;
    if (cost < best[node]) best[node] = cost;
    if (used === limit) continue;
    for (const [u, v, w] of edges) {
      if (u === node) stack.push([v, cost + w, used + 1]);
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 74500027n;

function rand(k: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 1000;
let layeredRight = 0;
let inPlaceRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 6;
  const edges: Edge[] = [];
  for (let i = 0; i < 12; i++) {
    const u = rand(n);
    const v = rand(n);
    if (u !== v) edges.push([u, v, 1 + rand(20)]);
  }
  const limit = rand(4);
  const truth = byEnumeration(n, edges, 0, limit).join(",");
  if (byRounds(n, edges, 0, limit, false)[0].join(",") === truth) layeredRight += 1;
  if (byRounds(n, edges, 0, limit, true)[0].join(",") === truth) inPlaceRight += 1;
}
console.log(TRIALS + " random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk");
console.log("  a fresh array per round   matched  " + layeredRight);
console.log("  one array updated in place matched " + inPlaceRight);
console.log();

const n = 300;
const edges: Edge[] = [];
for (let i = 0; i < 1500; i++) {
  const u = rand(n);
  const v = rand(n);
  if (u !== v) edges.push([u, v, 1 + rand(100)]);
}
const [unlimited] = byRounds(n, edges, 0, n - 1, false);
console.log("one graph of " + n + " nodes and " + edges.length + " edges, from node 0");
console.log();
console.log("  edge limit   reachable   limit raises the cost   relaxations");
for (const limit of [1, 2, 4, 8, 16, 32]) {
  const [best, relaxations] = byRounds(n, edges, 0, limit, false);
  let reachable = 0;
  let dearer = 0;
  for (let v = 0; v < n; v++) {
    if (best[v] < INF) {
      reachable += 1;
      if (best[v] > unlimited[v]) dearer += 1;
    }
  }
  console.log(padLeft(limit, 12) + " " + padLeft(reachable, 11) + " " + padLeft(dearer, 23) + " " + padLeft(relaxations, 13));
}
`,
            },
            {
              lang: "java",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
  static final long INF = 1L << 40;
  static long relaxations = 0;

  static long[] byRounds(int n, List<long[]> edges, int source, int limit, boolean inPlace) {
    long[] best = new long[n];
    Arrays.fill(best, INF);
    best[source] = 0;
    relaxations = 0;
    for (int round = 0; round < limit; round++) {
      long[] read = inPlace ? best : best.clone(); // the previous round, frozen
      for (long[] edge : edges) {
        relaxations += 1;
        int u = (int) edge[0];
        int v = (int) edge[1];
        if (read[u] + edge[2] < best[v]) {
          best[v] = read[u] + edge[2];
        }
      }
    }
    return best;
  }

  static long[] byEnumeration(int n, List<long[]> edges, int source, int limit) {
    long[] best = new long[n];
    Arrays.fill(best, INF);
    List<long[]> stack = new ArrayList<>();
    stack.add(new long[] {source, 0, 0});
    while (!stack.isEmpty()) {
      long[] top = stack.remove(stack.size() - 1);
      int node = (int) top[0];
      if (top[1] < best[node]) {
        best[node] = top[1];
      }
      if (top[2] == limit) {
        continue;
      }
      for (long[] edge : edges) {
        if (edge[0] == node) {
          stack.add(new long[] {edge[1], top[1] + edge[2], top[2] + 1});
        }
      }
    }
    return best;
  }

  // The same linear congruential generator in every language, so the graphs
  // below are the same graphs whichever translation is run.
  static long seed = 74500027L;

  static int rand(int k) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % k);
  }

  public static void main(String[] args) {
    final int trials = 1000;
    int layeredRight = 0;
    int inPlaceRight = 0;
    for (int t = 0; t < trials; t++) {
      final int n = 6;
      List<long[]> edges = new ArrayList<>();
      for (int i = 0; i < 12; i++) {
        int u = rand(n);
        int v = rand(n);
        if (u != v) {
          edges.add(new long[] {u, v, 1 + rand(20)});
        }
      }
      int limit = rand(4);
      long[] truth = byEnumeration(n, edges, 0, limit);
      if (Arrays.equals(byRounds(n, edges, 0, limit, false), truth)) {
        layeredRight += 1;
      }
      if (Arrays.equals(byRounds(n, edges, 0, limit, true), truth)) {
        inPlaceRight += 1;
      }
    }
    System.out.printf("%d random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk%n", trials);
    System.out.println("  a fresh array per round   matched  " + layeredRight);
    System.out.println("  one array updated in place matched " + inPlaceRight);
    System.out.println();

    final int n = 300;
    List<long[]> edges = new ArrayList<>();
    for (int i = 0; i < 1500; i++) {
      int u = rand(n);
      int v = rand(n);
      if (u != v) {
        edges.add(new long[] {u, v, 1 + rand(100)});
      }
    }
    long[] unlimited = byRounds(n, edges, 0, n - 1, false);
    System.out.printf("one graph of %d nodes and %d edges, from node 0%n", n, edges.size());
    System.out.println();
    System.out.println("  edge limit   reachable   limit raises the cost   relaxations");
    int[] limits = {1, 2, 4, 8, 16, 32};
    for (int limit : limits) {
      long[] best = byRounds(n, edges, 0, limit, false);
      int reachable = 0;
      int dearer = 0;
      for (int v = 0; v < n; v++) {
        if (best[v] < INF) {
          reachable += 1;
          if (best[v] > unlimited[v]) {
            dearer += 1;
          }
        }
      }
      System.out.printf("%12d %11d %23d %13d%n", limit, reachable, dearer, relaxations);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

#include <cstdio>
#include <utility>
#include <vector>

static const long long INF = 1LL << 40;

struct Edge {
  int u;
  int v;
  long long w;
};

std::pair<std::vector<long long>, long long> byRounds(int n, const std::vector<Edge>& edges, int source,
                                                      int limit, bool inPlace) {
  std::vector<long long> best(n, INF);
  best[source] = 0;
  long long relaxations = 0;
  for (int round = 0; round < limit; round++) {
    std::vector<long long> frozen;
    if (!inPlace) {
      frozen = best;  // the previous round, frozen
    }
    const std::vector<long long>& read = inPlace ? best : frozen;
    for (const Edge& e : edges) {
      relaxations += 1;
      if (read[e.u] + e.w < best[e.v]) {
        best[e.v] = read[e.u] + e.w;
      }
    }
  }
  return std::make_pair(best, relaxations);
}

std::vector<long long> byEnumeration(int n, const std::vector<Edge>& edges, int source, int limit) {
  struct State {
    int node;
    long long cost;
    int used;
  };
  std::vector<long long> best(n, INF);
  std::vector<State> stack(1, State{source, 0, 0});
  while (!stack.empty()) {
    State top = stack.back();
    stack.pop_back();
    if (top.cost < best[top.node]) {
      best[top.node] = top.cost;
    }
    if (top.used == limit) {
      continue;
    }
    for (const Edge& e : edges) {
      if (e.u == top.node) {
        stack.push_back(State{e.v, top.cost + e.w, top.used + 1});
      }
    }
  }
  return best;
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
long long seed = 74500027LL;

int rand_below(int k) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % k);
}

int main() {
  const int trials = 1000;
  int layeredRight = 0;
  int inPlaceRight = 0;
  for (int t = 0; t < trials; t++) {
    const int n = 6;
    std::vector<Edge> edges;
    for (int i = 0; i < 12; i++) {
      int u = rand_below(n);
      int v = rand_below(n);
      if (u != v) {
        edges.push_back(Edge{u, v, 1 + rand_below(20)});
      }
    }
    int limit = rand_below(4);
    std::vector<long long> truth = byEnumeration(n, edges, 0, limit);
    if (byRounds(n, edges, 0, limit, false).first == truth) {
      layeredRight += 1;
    }
    if (byRounds(n, edges, 0, limit, true).first == truth) {
      inPlaceRight += 1;
    }
  }
  std::printf("%d random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk\\n", trials);
  std::printf("  a fresh array per round   matched  %d\\n", layeredRight);
  std::printf("  one array updated in place matched %d\\n", inPlaceRight);
  std::printf("\\n");

  const int n = 300;
  std::vector<Edge> edges;
  for (int i = 0; i < 1500; i++) {
    int u = rand_below(n);
    int v = rand_below(n);
    if (u != v) {
      edges.push_back(Edge{u, v, 1 + rand_below(100)});
    }
  }
  std::vector<long long> unlimited = byRounds(n, edges, 0, n - 1, false).first;
  std::printf("one graph of %d nodes and %d edges, from node 0\\n", n, (int)edges.size());
  std::printf("\\n");
  std::printf("  edge limit   reachable   limit raises the cost   relaxations\\n");
  int limits[6] = {1, 2, 4, 8, 16, 32};
  for (int limit : limits) {
    std::pair<std::vector<long long>, long long> result = byRounds(n, edges, 0, limit, false);
    int reachable = 0;
    int dearer = 0;
    for (int v = 0; v < n; v++) {
      if (result.first[v] < INF) {
        reachable += 1;
        if (result.first[v] > unlimited[v]) {
          dearer += 1;
        }
      }
    }
    std::printf("%12d %11d %23d %13lld\\n", limit, reachable, dearer, result.second);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

const INF: i64 = 1 << 40;

fn by_rounds(n: usize, edges: &[(usize, usize, i64)], source: usize, limit: usize, in_place: bool) -> (Vec<i64>, i64) {
    let mut best = vec![INF; n];
    best[source] = 0;
    let mut relaxations = 0;
    for _ in 0..limit {
        let frozen = best.clone(); // the previous round, frozen
        for &(u, v, w) in edges.iter() {
            relaxations += 1;
            let from = if in_place { best[u] } else { frozen[u] };
            if from + w < best[v] {
                best[v] = from + w;
            }
        }
    }
    (best, relaxations)
}

fn by_enumeration(n: usize, edges: &[(usize, usize, i64)], source: usize, limit: usize) -> Vec<i64> {
    let mut best = vec![INF; n];
    let mut stack: Vec<(usize, i64, usize)> = vec![(source, 0, 0)];
    while let Some((node, cost, used)) = stack.pop() {
        if cost < best[node] {
            best[node] = cost;
        }
        if used == limit {
            continue;
        }
        for &(u, v, w) in edges.iter() {
            if u == node {
                stack.push((v, cost + w, used + 1));
            }
        }
    }
    best
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
static mut SEED: i64 = 74500027;

fn rand_below(k: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % k
    }
}

fn main() {
    let trials = 1000;
    let mut layered_right = 0;
    let mut in_place_right = 0;
    for _ in 0..trials {
        let n = 6usize;
        let mut edges: Vec<(usize, usize, i64)> = Vec::new();
        for _ in 0..12 {
            let u = rand_below(n as i64) as usize;
            let v = rand_below(n as i64) as usize;
            if u != v {
                edges.push((u, v, 1 + rand_below(20)));
            }
        }
        let limit = rand_below(4) as usize;
        let truth = by_enumeration(n, &edges, 0, limit);
        if by_rounds(n, &edges, 0, limit, false).0 == truth {
            layered_right += 1;
        }
        if by_rounds(n, &edges, 0, limit, true).0 == truth {
            in_place_right += 1;
        }
    }
    println!("{} random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk", trials);
    println!("  a fresh array per round   matched  {}", layered_right);
    println!("  one array updated in place matched {}", in_place_right);
    println!();

    let n = 300usize;
    let mut edges: Vec<(usize, usize, i64)> = Vec::new();
    for _ in 0..1500 {
        let u = rand_below(n as i64) as usize;
        let v = rand_below(n as i64) as usize;
        if u != v {
            edges.push((u, v, 1 + rand_below(100)));
        }
    }
    let (unlimited, _) = by_rounds(n, &edges, 0, n - 1, false);
    println!("one graph of {} nodes and {} edges, from node 0", n, edges.len());
    println!();
    println!("  edge limit   reachable   limit raises the cost   relaxations");
    for &limit in [1usize, 2, 4, 8, 16, 32].iter() {
        let (best, relaxations) = by_rounds(n, &edges, 0, limit, false);
        let mut reachable = 0;
        let mut dearer = 0;
        for v in 0..n {
            if best[v] < INF {
                reachable += 1;
                if best[v] > unlimited[v] {
                    dearer += 1;
                }
            }
        }
        println!("{:>12} {:>11} {:>23} {:>13}", limit, reachable, dearer, relaxations);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Shortest paths with a limit on the number of edges. dp[j][v] is the cheapest
// way to reach v with at most j edges, built from dp[j - 1] alone. Updating a
// single array in place looks the same and lets one round use several edges.
// Both are checked against enumerating every walk.

package main

import "fmt"

const inf = int64(1) << 40

type edge struct {
	u, v int
	w    int64
}

func byRounds(n int, edges []edge, source, limit int, inPlace bool) ([]int64, int64) {
	best := make([]int64, n)
	for i := range best {
		best[i] = inf
	}
	best[source] = 0
	var relaxations int64
	for round := 0; round < limit; round++ {
		read := best
		if !inPlace {
			read = append([]int64{}, best...) // the previous round, frozen
		}
		for _, e := range edges {
			relaxations++
			if read[e.u]+e.w < best[e.v] {
				best[e.v] = read[e.u] + e.w
			}
		}
	}
	return best, relaxations
}

func byEnumeration(n int, edges []edge, source, limit int) []int64 {
	type state struct {
		node int
		cost int64
		used int
	}
	best := make([]int64, n)
	for i := range best {
		best[i] = inf
	}
	stack := []state{{source, 0, 0}}
	for len(stack) > 0 {
		top := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if top.cost < best[top.node] {
			best[top.node] = top.cost
		}
		if top.used == limit {
			continue
		}
		for _, e := range edges {
			if e.u == top.node {
				stack = append(stack, state{e.v, top.cost + e.w, top.used + 1})
			}
		}
	}
	return best
}

func same(a, b []int64) bool {
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return len(a) == len(b)
}

// The same linear congruential generator in every language, so the graphs
// below are the same graphs whichever translation is run.
var seed int64 = 74500027

func randBelow(k int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(k))
}

func main() {
	const trials = 1000
	layeredRight := 0
	inPlaceRight := 0
	for t := 0; t < trials; t++ {
		const n = 6
		edges := []edge{}
		for i := 0; i < 12; i++ {
			u := randBelow(n)
			v := randBelow(n)
			if u != v {
				edges = append(edges, edge{u, v, int64(1 + randBelow(20))})
			}
		}
		limit := randBelow(4)
		truth := byEnumeration(n, edges, 0, limit)
		if layered, _ := byRounds(n, edges, 0, limit, false); same(layered, truth) {
			layeredRight++
		}
		if inPlace, _ := byRounds(n, edges, 0, limit, true); same(inPlace, truth) {
			inPlaceRight++
		}
	}
	fmt.Printf("%d random graphs of 6 nodes, edge limits of 0 to 3, checked against every walk\\n", trials)
	fmt.Printf("  a fresh array per round   matched  %d\\n", layeredRight)
	fmt.Printf("  one array updated in place matched %d\\n", inPlaceRight)
	fmt.Println()

	const n = 300
	edges := []edge{}
	for i := 0; i < 1500; i++ {
		u := randBelow(n)
		v := randBelow(n)
		if u != v {
			edges = append(edges, edge{u, v, int64(1 + randBelow(100))})
		}
	}
	unlimited, _ := byRounds(n, edges, 0, n-1, false)
	fmt.Printf("one graph of %d nodes and %d edges, from node 0\\n", n, len(edges))
	fmt.Println()
	fmt.Println("  edge limit   reachable   limit raises the cost   relaxations")
	for _, limit := range []int{1, 2, 4, 8, 16, 32} {
		best, relaxations := byRounds(n, edges, 0, limit, false)
		reachable := 0
		dearer := 0
		for v := 0; v < n; v++ {
			if best[v] < inf {
				reachable++
				if best[v] > unlimited[v] {
					dearer++
				}
			}
		}
		fmt.Printf("%12d %11d %23d %13d\\n", limit, reachable, dearer, relaxations)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-same-shape",
      heading: "The same shape elsewhere",
      body: [
        "**Floyd\u2013Warshall** is the same idea with a different dimension: `dp[k][i][j]` is the shortest path from `i` to `j` using only the first `k` vertices as intermediates, and adding vertex `k` either helps or does not. There the in-place update is safe, because using vertex `k` twice never helps a shortest path.",
        "**Longest path on a DAG** is a DP in topological order: each node's longest distance is the maximum over incoming edges of the predecessor's distance plus the weight, and topological order guarantees the predecessors are final. On graphs with cycles the longest simple path is NP-hard, so the acyclicity is the requirement, not a convenience.",
        "**Counting shortest paths**, **the k-th shortest walk length**, and **shortest paths with a cost limit on a second resource** all follow the pattern: find the dimension that makes each value depend only on strictly smaller ones, and fill in that order.",
      ],
      pitfalls: [
        {
          title: "Relaxing in place with an edge limit",
          body: "Measured: wrong on 238 of 1,000 small graphs. Read round j from a copy of round j - 1.",
        },
        {
          title: "Running Dijkstra on a hop-limited problem",
          body: "The cheapest route may use too many edges. Either expand the state to (node, edges used) or use the round-by-round DP.",
        },
        {
          title: "Treating 'at most k stops' as k edges",
          body: "k intermediate stops means k + 1 edges. Get the off-by-one from the statement before choosing the round count.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you find the cheapest route with at most k edges?",
      answer:
        "Run Bellman-Ford as the DP it is: dp[j][v] is the cheapest cost using at most j edges, and each round computes dp[j] from dp[j - 1] only, relaxing every edge u to v as dp[j-1][u] + w. After k rounds, dp[k] is the answer, in O(k E). The important detail is reading from a frozen copy of the previous round. I checked both versions against enumerating every walk on 1,000 small graphs: the frozen copy matched all of them, updating in place matched 762, because an in-place value improved earlier in the round can already have used this round's edge.",
    },
    {
      question: "Why can't you use Dijkstra for a shortest path with an edge limit?",
      answer:
        "Because the cheapest path to an intermediate node can use too many edges, and Dijkstra keeps only that cheapest one; a dearer path with fewer edges may be the one that still fits the limit further on. You can fix it by running Dijkstra over states of (node, edges used), which is k times larger, or use the Bellman-Ford round DP. On a 300-node graph I measured, a limit of 8 edges made 51 of 300 destinations dearer than their unconstrained shortest path, so the limit genuinely changes answers.",
    },
  ],
  takeaways: [
    "dp[j][v]: cheapest cost to v with at most j edges",
    "Round j reads only round j - 1; n - 1 rounds give ordinary shortest paths",
    "In-place relaxation lets one round use several edges",
    "Measured: frozen copy 1,000 of 1,000, in place 762",
    "A limit of 8 edges changed 51 of 300 destinations on one graph",
    "Floyd–Warshall is the same DP over allowed intermediate vertices",
    "Longest path is a DP on a DAG and NP-hard with cycles",
  ],
};
