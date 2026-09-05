import type { Lesson } from "@/content/types";

export const bitmaskDigitStateLesson: Lesson = {
  id: "dsa-dp-bitmask-digit-state",
  slug: "bitmask-digit-and-state-machines",
  moduleSlug: "dynamic-programming-patterns",
  title: "Bitmask, Digit and State-Machine DP",
  summary:
    "The three patterns where the state is not an index: a subset held in the bits of an integer, a position in a number's digits, and a mode in a small machine. Ends with the whole catalogue in one place, and the reminder that the catalogue is a shortcut for problems you have seen while the method is what handles the ones you have not.",
  estimatedMinutes: 45,
  objectives: [
    "Hold a subset in an integer, and see why numeric order is a valid fill order",
    "Say why the position belongs in the state alongside the set",
    "Get the tight and started flags right in a digit count, and know which way each fails",
    "Model a problem as modes and arrows, and add a rule by adding a mode",
  ],
  sections: [
    {
      id: "a-set-in-an-integer",
      heading: "A set, held in the bits of an integer",
      body: [
        "The last lesson of the module is three techniques that look unrelated and are the same idea: the state does not have to be an index. It can be a set, a position in a numeral, or a mode you are in. Once you accept that, a lot of problems that looked like they needed search turn out to be tables.",
        "Start with sets. If a subproblem is \"which of these `n` things have I dealt with\", that is a subset, and a subset of at most about twenty things fits in the bits of an integer. Then the table is an array indexed by that integer, and \u2014 this is the part that makes it work \u2014 plain numeric order is a valid fill order for free. Adding an element to a set only ever makes the integer larger, so every state a cell depends on has a smaller index and is already written. No length loops, no reversed sweeps, none of lesson 6's care.",
        "The travelling salesman tour is the standard instance, and it also makes the state-design point one more time. Knowing *which* cities have been visited does not price the next step, because the price depends on where you are standing. So the state is a set **and** a position \u2014 the same correction as lesson 4's ending and lesson 7's flag, wearing a third costume.",
        "What happens if you drop the position is instructive rather than merely wrong. The example computes the cheapest tree touching every city instead, which is a perfectly good algorithm answering a different question, and on all 3,000 random maps it comes in strictly below the true tour. It is a lower bound, not an approximation with a bug: without a position the table has stopped describing a walk at all.",
        "And nearest-neighbour \u2014 always drive to the closest unvisited city \u2014 is right on 1,997 of 3,000. Two thirds, again.",
        "The cost is `2^n * n` states with `n` transitions each, which is exponential and is still an enormous saving: at twenty cities that is about 21 million states against 121,645,100,408,832,000 tours. Exponential-but-smaller is the honest description of this technique, and around twenty elements is where it stops being usable.",
      ],
      examples: [
        {
          id: "set-and-position",
          title: "A tour as a set and a position, against every tour",
          lang: "python",
          code: `# Bitmask dynamic programming: the state is a *set*, held in the bits of an
# integer, and the fill order is numeric order because removing an element only
# ever makes the integer smaller.
#
# The travelling salesman tour is the standard instance, and it is also the
# clearest demonstration of why a set is not enough on its own. Knowing which
# cities have been visited does not price the next edge -- that depends on where
# you are standing. So the state is a set *and* a position, which is the same
# correction as lesson 4's ending and lesson 7's flag, in a third costume.
INF = 10 ** 9


def tour(dist):
    """dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`."""
    n = len(dist)
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0
    states = 0
    for mask in range(1 << n):
        if not mask & 1:
            continue
        for last in range(n):
            if dp[mask][last] >= INF:
                continue
            states += 1
            for nxt in range(n):
                if mask >> nxt & 1:
                    continue
                step = dp[mask][last] + dist[last][nxt]
                if step < dp[mask | 1 << nxt][nxt]:
                    dp[mask | 1 << nxt][nxt] = step
    full = (1 << n) - 1
    best = min(dp[full][last] + dist[last][0] for last in range(n))
    return best, states


def spanning_tree(dist):
    """The cheapest tree touching every city. A lower bound, not a tour."""
    n = len(dist)
    inside = [False] * n
    inside[0] = True
    total = 0
    for _ in range(n - 1):
        best = INF
        pick = -1
        for v in range(n):
            if inside[v]:
                continue
            for u in range(n):
                if inside[u] and dist[u][v] < best:
                    best = dist[u][v]
                    pick = v
        inside[pick] = True
        total += best
    return total


def nearest_neighbour(dist):
    """Always walk to the closest city not yet visited, then come home."""
    n = len(dist)
    seen = [False] * n
    seen[0] = True
    at = 0
    total = 0
    for _ in range(n - 1):
        best = INF
        pick = -1
        for v in range(n):
            if not seen[v] and dist[at][v] < best:
                best = dist[at][v]
                pick = v
        seen[pick] = True
        total += best
        at = pick
    return total + dist[at][0]


def brute(dist):
    """Every tour, walked. The definition, at (n-1)! cost."""
    n = len(dist)
    best = [INF]
    seen = [False] * n
    seen[0] = True
    order = [0]

    def step(at, spent):
        if spent >= best[0]:
            return
        if len(order) == n:
            total = spent + dist[at][0]
            if total < best[0]:
                best[0] = total
            return
        for v in range(n):
            if not seen[v]:
                seen[v] = True
                order.append(v)
                step(v, spent + dist[at][v])
                order.pop()
                seen[v] = False

    step(0, 0)
    return best[0]


def permutations_of(n):
    out = 1
    for step in range(2, n):
        out *= step
    return out


seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_distances(n):
    dist = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = 1 + rand(20)
            dist[i][j] = d
            dist[j][i] = d
    return dist


CASES = [
    [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]],
    [[0, 1, 9, 9], [1, 0, 1, 9], [9, 1, 0, 1], [9, 9, 1, 0]],
    [[0, 3, 3, 3], [3, 0, 3, 3], [3, 3, 0, 3], [3, 3, 3, 0]],
    [[0, 2, 9, 9, 9], [2, 0, 2, 9, 9], [9, 2, 0, 2, 9], [9, 9, 2, 0, 2], [9, 9, 9, 2, 0]],
]

print(f"{'cities':>8}{'set and position':>18}{'spanning tree':>15}{'nearest first':>15}{'every tour':>12}{'states':>8}{'tours':>7}")
for dist in CASES:
    n = len(dist)
    best, states = tour(dist)
    print(f"{n:>8}{best:>18}{spanning_tree(dist):>15}{nearest_neighbour(dist):>15}"
          f"{brute(dist):>12}{states:>8}{permutations_of(n):>7}")
print()

print("and what the table is buying, as n grows:")
print(f"{'cities':>8}{'2^n * n states':>16}{'(n-1)! tours':>22}")
for n in [4, 8, 12, 16, 20]:
    print(f"{n:>8}{(1 << n) * n:>16}{permutations_of(n):>22}")
print()

TRIALS = 3000
dp_ok = 0
tree_ok = 0
tree_over = 0
near_ok = 0
for _ in range(TRIALS):
    n = 3 + rand(4)
    dist = random_distances(n)
    truth = brute(dist)
    best, _ = tour(dist)
    if best == truth:
        dp_ok += 1
    bound = spanning_tree(dist)
    if bound == truth:
        tree_ok += 1
    if bound > truth:
        tree_over += 1
    if nearest_neighbour(dist) == truth:
        near_ok += 1

print(f"over {TRIALS} random maps of 3 to 6 cities, against every tour:")
print(f"  the set-and-position table   {dp_ok:>6}")
print(f"  the spanning tree bound      {tree_ok:>6}")
print(f"  nearest city first           {near_ok:>6}")
print()
print(f"the spanning tree was never above the true tour ({tree_over} times), which is what")
print("makes it a bound rather than an answer: dropping the position from the state")
print("stops the table describing a walk at all, and what it computes instead is a")
print("tree. The position is not an optimisation, it is what makes the next edge")
print("have a price.")
`,
          output: `  cities  set and position  spanning tree  nearest first  every tour  states  tours
       4                80             45             80          80      13      6
       4                12              3             12          12      13      6
       4                12              9             12          12      13      6
       5                17              8             17          17      33     24

and what the table is buying, as n grows:
  cities  2^n * n states          (n-1)! tours
       4              64                     6
       8            2048                  5040
      12           49152              39916800
      16         1048576         1307674368000
      20        20971520    121645100408832000

over 3000 random maps of 3 to 6 cities, against every tour:
  the set-and-position table     3000
  the spanning tree bound           0
  nearest city first             1997

the spanning tree was never above the true tour (0 times), which is what
makes it a bound rather than an answer: dropping the position from the state
stops the table describing a walk at all, and what it computes instead is a
tree. The position is not an optimisation, it is what makes the next edge
have a price.`,
          explanation:
            "The set-and-position table against every tour, plus the spanning tree you get if the position is dropped and the nearest-neighbour greedy. The second table is the reason to bother: exponential in the number of cities is still an enormous saving over factorial.",
          alternates: [
            {
              lang: "javascript",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.

const INF = 1000000000;

/** dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`. */
function tour(dist) {
  const n = dist.length;
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
  dp[1][0] = 0;
  let states = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & 1)) continue;
    for (let last = 0; last < n; last++) {
      if (dp[mask][last] >= INF) continue;
      states++;
      for (let nxt = 0; nxt < n; nxt++) {
        if ((mask >> nxt) & 1) continue;
        const step = dp[mask][last] + dist[last][nxt];
        if (step < dp[mask | (1 << nxt)][nxt]) dp[mask | (1 << nxt)][nxt] = step;
      }
    }
  }
  const full = (1 << n) - 1;
  let best = INF;
  for (let last = 0; last < n; last++) {
    if (dp[full][last] + dist[last][0] < best) best = dp[full][last] + dist[last][0];
  }
  return [best, states];
}

/** The cheapest tree touching every city. A lower bound, not a tour. */
function spanningTree(dist) {
  const n = dist.length;
  const inside = new Array(n).fill(false);
  inside[0] = true;
  let total = 0;
  for (let round = 0; round < n - 1; round++) {
    let best = INF;
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (inside[v]) continue;
      for (let u = 0; u < n; u++) {
        if (inside[u] && dist[u][v] < best) {
          best = dist[u][v];
          pick = v;
        }
      }
    }
    inside[pick] = true;
    total += best;
  }
  return total;
}

/** Always walk to the closest city not yet visited, then come home. */
function nearestNeighbour(dist) {
  const n = dist.length;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  let at = 0;
  let total = 0;
  for (let round = 0; round < n - 1; round++) {
    let best = INF;
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (!seen[v] && dist[at][v] < best) {
        best = dist[at][v];
        pick = v;
      }
    }
    seen[pick] = true;
    total += best;
    at = pick;
  }
  return total + dist[at][0];
}

/** Every tour, walked. The definition, at (n-1)! cost. */
function brute(dist) {
  const n = dist.length;
  let best = INF;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  let placed = 1;
  const step = (at, spent) => {
    if (spent >= best) return;
    if (placed === n) {
      const total = spent + dist[at][0];
      if (total < best) best = total;
      return;
    }
    for (let v = 0; v < n; v++) {
      if (!seen[v]) {
        seen[v] = true;
        placed++;
        step(v, spent + dist[at][v]);
        placed--;
        seen[v] = false;
      }
    }
  };
  step(0, 0);
  return best;
}

function permutationsOf(n) {
  let out = 1;
  for (let step = 2; step < n; step++) out *= step;
  return out;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomDistances(n) {
  const dist = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = 1 + rand(20);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  return dist;
}

const pad = (v, w) => String(v).padStart(w);

const CASES = [
  [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]],
  [[0, 1, 9, 9], [1, 0, 1, 9], [9, 1, 0, 1], [9, 9, 1, 0]],
  [[0, 3, 3, 3], [3, 0, 3, 3], [3, 3, 0, 3], [3, 3, 3, 0]],
  [[0, 2, 9, 9, 9], [2, 0, 2, 9, 9], [9, 2, 0, 2, 9], [9, 9, 2, 0, 2], [9, 9, 9, 2, 0]],
];

console.log(
  pad("cities", 8) + pad("set and position", 18) + pad("spanning tree", 15) +
    pad("nearest first", 15) + pad("every tour", 12) + pad("states", 8) + pad("tours", 7)
);
for (const dist of CASES) {
  const n = dist.length;
  const [best, states] = tour(dist);
  console.log(
    pad(n, 8) + pad(best, 18) + pad(spanningTree(dist), 15) + pad(nearestNeighbour(dist), 15) +
      pad(brute(dist), 12) + pad(states, 8) + pad(permutationsOf(n), 7)
  );
}
console.log();

console.log("and what the table is buying, as n grows:");
console.log(pad("cities", 8) + pad("2^n * n states", 16) + pad("(n-1)! tours", 22));
for (const n of [4, 8, 12, 16, 20]) {
  console.log(pad(n, 8) + pad((1 << n) * n, 16) + pad(permutationsOf(n), 22));
}
console.log();

const TRIALS = 3000;
let dpOk = 0;
let treeOk = 0;
let treeOver = 0;
let nearOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(4);
  const dist = randomDistances(n);
  const truth = brute(dist);
  const [best] = tour(dist);
  if (best === truth) dpOk++;
  const bound = spanningTree(dist);
  if (bound === truth) treeOk++;
  if (bound > truth) treeOver++;
  if (nearestNeighbour(dist) === truth) nearOk++;
}

console.log(\`over \${TRIALS} random maps of 3 to 6 cities, against every tour:\`);
console.log("  the set-and-position table   " + pad(dpOk, 6));
console.log("  the spanning tree bound      " + pad(treeOk, 6));
console.log("  nearest city first           " + pad(nearOk, 6));
console.log();
console.log(\`the spanning tree was never above the true tour (\${treeOver} times), which is what\`);
console.log("makes it a bound rather than an answer: dropping the position from the state");
console.log("stops the table describing a walk at all, and what it computes instead is a");
console.log("tree. The position is not an optimisation, it is what makes the next edge");
console.log("have a price.");
`,
            },
            {
              lang: "typescript",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.

const INF = 1000000000;

type Matrix = number[][];

/** dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`. */
function tour(dist: Matrix): [number, number] {
  const n = dist.length;
  const dp: number[][] = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
  dp[1][0] = 0;
  let states = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & 1)) continue;
    for (let last = 0; last < n; last++) {
      if (dp[mask][last] >= INF) continue;
      states++;
      for (let nxt = 0; nxt < n; nxt++) {
        if ((mask >> nxt) & 1) continue;
        const step = dp[mask][last] + dist[last][nxt];
        if (step < dp[mask | (1 << nxt)][nxt]) dp[mask | (1 << nxt)][nxt] = step;
      }
    }
  }
  const full = (1 << n) - 1;
  let best = INF;
  for (let last = 0; last < n; last++) {
    if (dp[full][last] + dist[last][0] < best) best = dp[full][last] + dist[last][0];
  }
  return [best, states];
}

/** The cheapest tree touching every city. A lower bound, not a tour. */
function spanningTree(dist: Matrix): number {
  const n = dist.length;
  const inside = new Array(n).fill(false);
  inside[0] = true;
  let total = 0;
  for (let round = 0; round < n - 1; round++) {
    let best = INF;
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (inside[v]) continue;
      for (let u = 0; u < n; u++) {
        if (inside[u] && dist[u][v] < best) {
          best = dist[u][v];
          pick = v;
        }
      }
    }
    inside[pick] = true;
    total += best;
  }
  return total;
}

/** Always walk to the closest city not yet visited, then come home. */
function nearestNeighbour(dist: Matrix): number {
  const n = dist.length;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  let at = 0;
  let total = 0;
  for (let round = 0; round < n - 1; round++) {
    let best = INF;
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (!seen[v] && dist[at][v] < best) {
        best = dist[at][v];
        pick = v;
      }
    }
    seen[pick] = true;
    total += best;
    at = pick;
  }
  return total + dist[at][0];
}

/** Every tour, walked. The definition, at (n-1)! cost. */
function brute(dist: Matrix): number {
  const n = dist.length;
  let best = INF;
  const seen = new Array(n).fill(false);
  seen[0] = true;
  let placed = 1;
  const step = (at: number, spent: number): void => {
    if (spent >= best) return;
    if (placed === n) {
      const total = spent + dist[at][0];
      if (total < best) best = total;
      return;
    }
    for (let v = 0; v < n; v++) {
      if (!seen[v]) {
        seen[v] = true;
        placed++;
        step(v, spent + dist[at][v]);
        placed--;
        seen[v] = false;
      }
    }
  };
  step(0, 0);
  return best;
}

function permutationsOf(n: number): number {
  let out = 1;
  for (let step = 2; step < n; step++) out *= step;
  return out;
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomDistances(n: number): Matrix {
  const dist: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = 1 + rand(20);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  return dist;
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES: Matrix[] = [
  [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]],
  [[0, 1, 9, 9], [1, 0, 1, 9], [9, 1, 0, 1], [9, 9, 1, 0]],
  [[0, 3, 3, 3], [3, 0, 3, 3], [3, 3, 0, 3], [3, 3, 3, 0]],
  [[0, 2, 9, 9, 9], [2, 0, 2, 9, 9], [9, 2, 0, 2, 9], [9, 9, 2, 0, 2], [9, 9, 9, 2, 0]],
];

console.log(
  pad("cities", 8) + pad("set and position", 18) + pad("spanning tree", 15) +
    pad("nearest first", 15) + pad("every tour", 12) + pad("states", 8) + pad("tours", 7)
);
for (const dist of CASES) {
  const n = dist.length;
  const [best, states] = tour(dist);
  console.log(
    pad(n, 8) + pad(best, 18) + pad(spanningTree(dist), 15) + pad(nearestNeighbour(dist), 15) +
      pad(brute(dist), 12) + pad(states, 8) + pad(permutationsOf(n), 7)
  );
}
console.log();

console.log("and what the table is buying, as n grows:");
console.log(pad("cities", 8) + pad("2^n * n states", 16) + pad("(n-1)! tours", 22));
for (const n of [4, 8, 12, 16, 20]) {
  console.log(pad(n, 8) + pad((1 << n) * n, 16) + pad(permutationsOf(n), 22));
}
console.log();

const TRIALS = 3000;
let dpOk = 0;
let treeOk = 0;
let treeOver = 0;
let nearOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 3 + rand(4);
  const dist = randomDistances(n);
  const truth = brute(dist);
  const [best] = tour(dist);
  if (best === truth) dpOk++;
  const bound = spanningTree(dist);
  if (bound === truth) treeOk++;
  if (bound > truth) treeOver++;
  if (nearestNeighbour(dist) === truth) nearOk++;
}

console.log(\`over \${TRIALS} random maps of 3 to 6 cities, against every tour:\`);
console.log("  the set-and-position table   " + pad(dpOk, 6));
console.log("  the spanning tree bound      " + pad(treeOk, 6));
console.log("  nearest city first           " + pad(nearOk, 6));
console.log();
console.log(\`the spanning tree was never above the true tour (\${treeOver} times), which is what\`);
console.log("makes it a bound rather than an answer: dropping the position from the state");
console.log("stops the table describing a walk at all, and what it computes instead is a");
console.log("tree. The position is not an optimisation, it is what makes the next edge");
console.log("have a price.");
`,
            },
            {
              lang: "java",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.
import java.util.Arrays;

public class Main {
    static final int INF = 1000000000;
    static int visitedStates;

    // dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`.
    static int tour(int[][] dist) {
        int n = dist.length;
        int[][] dp = new int[1 << n][n];
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[1][0] = 0;
        visitedStates = 0;
        for (int mask = 0; mask < 1 << n; mask++) {
            if ((mask & 1) == 0) continue;
            for (int last = 0; last < n; last++) {
                if (dp[mask][last] >= INF) continue;
                visitedStates++;
                for (int nxt = 0; nxt < n; nxt++) {
                    if ((mask >> nxt & 1) == 1) continue;
                    int step = dp[mask][last] + dist[last][nxt];
                    if (step < dp[mask | 1 << nxt][nxt]) dp[mask | 1 << nxt][nxt] = step;
                }
            }
        }
        int full = (1 << n) - 1;
        int best = INF;
        for (int last = 0; last < n; last++) {
            if (dp[full][last] + dist[last][0] < best) best = dp[full][last] + dist[last][0];
        }
        return best;
    }

    // The cheapest tree touching every city. A lower bound, not a tour.
    static int spanningTree(int[][] dist) {
        int n = dist.length;
        boolean[] inside = new boolean[n];
        inside[0] = true;
        int total = 0;
        for (int round = 0; round < n - 1; round++) {
            int best = INF, pick = -1;
            for (int v = 0; v < n; v++) {
                if (inside[v]) continue;
                for (int u = 0; u < n; u++) {
                    if (inside[u] && dist[u][v] < best) {
                        best = dist[u][v];
                        pick = v;
                    }
                }
            }
            inside[pick] = true;
            total += best;
        }
        return total;
    }

    // Always walk to the closest city not yet visited, then come home.
    static int nearestNeighbour(int[][] dist) {
        int n = dist.length;
        boolean[] seen = new boolean[n];
        seen[0] = true;
        int at = 0, total = 0;
        for (int round = 0; round < n - 1; round++) {
            int best = INF, pick = -1;
            for (int v = 0; v < n; v++) {
                if (!seen[v] && dist[at][v] < best) {
                    best = dist[at][v];
                    pick = v;
                }
            }
            seen[pick] = true;
            total += best;
            at = pick;
        }
        return total + dist[at][0];
    }

    static int bruteBest;
    static boolean[] bruteSeen;
    static int brutePlaced;

    // Every tour, walked. The definition, at (n-1)! cost.
    static int brute(int[][] dist) {
        int n = dist.length;
        bruteBest = INF;
        bruteSeen = new boolean[n];
        bruteSeen[0] = true;
        brutePlaced = 1;
        bruteStep(dist, 0, 0);
        return bruteBest;
    }

    static void bruteStep(int[][] dist, int at, int spent) {
        int n = dist.length;
        if (spent >= bruteBest) return;
        if (brutePlaced == n) {
            int total = spent + dist[at][0];
            if (total < bruteBest) bruteBest = total;
            return;
        }
        for (int v = 0; v < n; v++) {
            if (!bruteSeen[v]) {
                bruteSeen[v] = true;
                brutePlaced++;
                bruteStep(dist, v, spent + dist[at][v]);
                brutePlaced--;
                bruteSeen[v] = false;
            }
        }
    }

    static long permutationsOf(int n) {
        long out = 1;
        for (int step = 2; step < n; step++) out *= step;
        return out;
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    static int[][] randomDistances(int n) {
        int[][] dist = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int d = 1 + rand(20);
                dist[i][j] = d;
                dist[j][i] = d;
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        int[][][] cases = {
            {{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}},
            {{0, 1, 9, 9}, {1, 0, 1, 9}, {9, 1, 0, 1}, {9, 9, 1, 0}},
            {{0, 3, 3, 3}, {3, 0, 3, 3}, {3, 3, 0, 3}, {3, 3, 3, 0}},
            {{0, 2, 9, 9, 9}, {2, 0, 2, 9, 9}, {9, 2, 0, 2, 9}, {9, 9, 2, 0, 2}, {9, 9, 9, 2, 0}},
        };

        System.out.println(pad("cities", 8) + pad("set and position", 18) + pad("spanning tree", 15)
            + pad("nearest first", 15) + pad("every tour", 12) + pad("states", 8) + pad("tours", 7));
        for (int[][] dist : cases) {
            int n = dist.length;
            int best = tour(dist);
            System.out.println(pad(n, 8) + pad(best, 18) + pad(spanningTree(dist), 15)
                + pad(nearestNeighbour(dist), 15) + pad(brute(dist), 12) + pad(visitedStates, 8)
                + pad(permutationsOf(n), 7));
        }
        System.out.println();

        System.out.println("and what the table is buying, as n grows:");
        System.out.println(pad("cities", 8) + pad("2^n * n states", 16) + pad("(n-1)! tours", 22));
        for (int n : new int[] {4, 8, 12, 16, 20}) {
            System.out.println(pad(n, 8) + pad((long) (1 << n) * n, 16) + pad(permutationsOf(n), 22));
        }
        System.out.println();

        int trials = 3000;
        int dpOk = 0, treeOk = 0, treeOver = 0, nearOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rand(4);
            int[][] dist = randomDistances(n);
            int truth = brute(dist);
            if (tour(dist) == truth) dpOk++;
            int bound = spanningTree(dist);
            if (bound == truth) treeOk++;
            if (bound > truth) treeOver++;
            if (nearestNeighbour(dist) == truth) nearOk++;
        }

        System.out.println("over " + trials + " random maps of 3 to 6 cities, against every tour:");
        System.out.println("  the set-and-position table   " + pad(dpOk, 6));
        System.out.println("  the spanning tree bound      " + pad(treeOk, 6));
        System.out.println("  nearest city first           " + pad(nearOk, 6));
        System.out.println();
        System.out.println("the spanning tree was never above the true tour (" + treeOver
            + " times), which is what");
        System.out.println("makes it a bound rather than an answer: dropping the position from the state");
        System.out.println("stops the table describing a walk at all, and what it computes instead is a");
        System.out.println("tree. The position is not an optimisation, it is what makes the next edge");
        System.out.println("have a price.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <utility>
#include <vector>

using Matrix = std::vector<std::vector<int>>;

static const int INF = 1000000000;

// dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`.
std::pair<int, int> tour(const Matrix &dist) {
    int n = static_cast<int>(dist.size());
    std::vector<std::vector<int>> dp(1 << n, std::vector<int>(n, INF));
    dp[1][0] = 0;
    int states = 0;
    for (int mask = 0; mask < 1 << n; mask++) {
        if (!(mask & 1)) continue;
        for (int last = 0; last < n; last++) {
            if (dp[mask][last] >= INF) continue;
            states++;
            for (int nxt = 0; nxt < n; nxt++) {
                if (mask >> nxt & 1) continue;
                int step = dp[mask][last] + dist[last][nxt];
                if (step < dp[mask | 1 << nxt][nxt]) dp[mask | 1 << nxt][nxt] = step;
            }
        }
    }
    int full = (1 << n) - 1;
    int best = INF;
    for (int last = 0; last < n; last++) {
        if (dp[full][last] + dist[last][0] < best) best = dp[full][last] + dist[last][0];
    }
    return {best, states};
}

// The cheapest tree touching every city. A lower bound, not a tour.
int spanningTree(const Matrix &dist) {
    int n = static_cast<int>(dist.size());
    std::vector<bool> inside(n, false);
    inside[0] = true;
    int total = 0;
    for (int round = 0; round < n - 1; round++) {
        int best = INF, pick = -1;
        for (int v = 0; v < n; v++) {
            if (inside[v]) continue;
            for (int u = 0; u < n; u++) {
                if (inside[u] && dist[u][v] < best) {
                    best = dist[u][v];
                    pick = v;
                }
            }
        }
        inside[pick] = true;
        total += best;
    }
    return total;
}

// Always walk to the closest city not yet visited, then come home.
int nearestNeighbour(const Matrix &dist) {
    int n = static_cast<int>(dist.size());
    std::vector<bool> seen(n, false);
    seen[0] = true;
    int at = 0, total = 0;
    for (int round = 0; round < n - 1; round++) {
        int best = INF, pick = -1;
        for (int v = 0; v < n; v++) {
            if (!seen[v] && dist[at][v] < best) {
                best = dist[at][v];
                pick = v;
            }
        }
        seen[pick] = true;
        total += best;
        at = pick;
    }
    return total + dist[at][0];
}

void bruteStep(const Matrix &dist, int at, int spent, int &best,
               std::vector<bool> &seen, int &placed) {
    int n = static_cast<int>(dist.size());
    if (spent >= best) return;
    if (placed == n) {
        int total = spent + dist[at][0];
        if (total < best) best = total;
        return;
    }
    for (int v = 0; v < n; v++) {
        if (!seen[v]) {
            seen[v] = true;
            placed++;
            bruteStep(dist, v, spent + dist[at][v], best, seen, placed);
            placed--;
            seen[v] = false;
        }
    }
}

// Every tour, walked. The definition, at (n-1)! cost.
int brute(const Matrix &dist) {
    int n = static_cast<int>(dist.size());
    int best = INF;
    std::vector<bool> seen(n, false);
    seen[0] = true;
    int placed = 1;
    bruteStep(dist, 0, 0, best, seen, placed);
    return best;
}

std::int64_t permutationsOf(int n) {
    std::int64_t out = 1;
    for (int step = 2; step < n; step++) out *= step;
    return out;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

Matrix randomDistances(int n) {
    Matrix dist(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int d = 1 + rnd(20);
            dist[i][j] = d;
            dist[j][i] = d;
        }
    }
    return dist;
}

int main() {
    const std::vector<Matrix> cases = {
        {{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}},
        {{0, 1, 9, 9}, {1, 0, 1, 9}, {9, 1, 0, 1}, {9, 9, 1, 0}},
        {{0, 3, 3, 3}, {3, 0, 3, 3}, {3, 3, 0, 3}, {3, 3, 3, 0}},
        {{0, 2, 9, 9, 9}, {2, 0, 2, 9, 9}, {9, 2, 0, 2, 9}, {9, 9, 2, 0, 2}, {9, 9, 9, 2, 0}},
    };

    std::cout << std::right << std::setw(8) << "cities" << std::setw(18) << "set and position"
              << std::setw(15) << "spanning tree" << std::setw(15) << "nearest first"
              << std::setw(12) << "every tour" << std::setw(8) << "states"
              << std::setw(7) << "tours" << "\\n";
    for (const Matrix &dist : cases) {
        int n = static_cast<int>(dist.size());
        auto found = tour(dist);
        std::cout << std::setw(8) << n << std::setw(18) << found.first
                  << std::setw(15) << spanningTree(dist) << std::setw(15) << nearestNeighbour(dist)
                  << std::setw(12) << brute(dist) << std::setw(8) << found.second
                  << std::setw(7) << permutationsOf(n) << "\\n";
    }
    std::cout << "\\n";

    std::cout << "and what the table is buying, as n grows:\\n";
    std::cout << std::setw(8) << "cities" << std::setw(16) << "2^n * n states"
              << std::setw(22) << "(n-1)! tours" << "\\n";
    for (int n : {4, 8, 12, 16, 20}) {
        std::cout << std::setw(8) << n << std::setw(16) << static_cast<std::int64_t>(1 << n) * n
                  << std::setw(22) << permutationsOf(n) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int dpOk = 0, treeOk = 0, treeOver = 0, nearOk = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 3 + rnd(4);
        Matrix dist = randomDistances(n);
        int truth = brute(dist);
        if (tour(dist).first == truth) dpOk++;
        int bound = spanningTree(dist);
        if (bound == truth) treeOk++;
        if (bound > truth) treeOver++;
        if (nearestNeighbour(dist) == truth) nearOk++;
    }

    std::cout << "over " << TRIALS << " random maps of 3 to 6 cities, against every tour:\\n";
    std::cout << "  the set-and-position table   " << std::setw(6) << dpOk << "\\n";
    std::cout << "  the spanning tree bound      " << std::setw(6) << treeOk << "\\n";
    std::cout << "  nearest city first           " << std::setw(6) << nearOk << "\\n\\n";
    std::cout << "the spanning tree was never above the true tour (" << treeOver
              << " times), which is what\\n";
    std::cout << "makes it a bound rather than an answer: dropping the position from the state\\n";
    std::cout << "stops the table describing a walk at all, and what it computes instead is a\\n";
    std::cout << "tree. The position is not an optimisation, it is what makes the next edge\\n";
    std::cout << "have a price.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.

const INF: i64 = 1000000000;

type Matrix = Vec<Vec<i64>>;

/// dp[mask][last] = cheapest way to visit exactly \`mask\`, standing on \`last\`.
fn tour(dist: &Matrix) -> (i64, i64) {
    let n = dist.len();
    let mut dp = vec![vec![INF; n]; 1 << n];
    dp[1][0] = 0;
    let mut states = 0;
    for mask in 0..(1usize << n) {
        if mask & 1 == 0 {
            continue;
        }
        for last in 0..n {
            if dp[mask][last] >= INF {
                continue;
            }
            states += 1;
            for nxt in 0..n {
                if mask >> nxt & 1 == 1 {
                    continue;
                }
                let step = dp[mask][last] + dist[last][nxt];
                if step < dp[mask | 1 << nxt][nxt] {
                    dp[mask | 1 << nxt][nxt] = step;
                }
            }
        }
    }
    let full = (1usize << n) - 1;
    let best = (0..n).map(|last| dp[full][last] + dist[last][0]).min().unwrap_or(INF);
    (best, states)
}

/// The cheapest tree touching every city. A lower bound, not a tour.
fn spanning_tree(dist: &Matrix) -> i64 {
    let n = dist.len();
    let mut inside = vec![false; n];
    inside[0] = true;
    let mut total = 0;
    for _ in 0..n - 1 {
        let mut best = INF;
        let mut pick = 0;
        for v in 0..n {
            if inside[v] {
                continue;
            }
            for u in 0..n {
                if inside[u] && dist[u][v] < best {
                    best = dist[u][v];
                    pick = v;
                }
            }
        }
        inside[pick] = true;
        total += best;
    }
    total
}

/// Always walk to the closest city not yet visited, then come home.
fn nearest_neighbour(dist: &Matrix) -> i64 {
    let n = dist.len();
    let mut seen = vec![false; n];
    seen[0] = true;
    let mut at = 0;
    let mut total = 0;
    for _ in 0..n - 1 {
        let mut best = INF;
        let mut pick = 0;
        for v in 0..n {
            if !seen[v] && dist[at][v] < best {
                best = dist[at][v];
                pick = v;
            }
        }
        seen[pick] = true;
        total += best;
        at = pick;
    }
    total + dist[at][0]
}

fn brute_step(dist: &Matrix, at: usize, spent: i64, best: &mut i64,
              seen: &mut Vec<bool>, placed: &mut usize) {
    let n = dist.len();
    if spent >= *best {
        return;
    }
    if *placed == n {
        let total = spent + dist[at][0];
        if total < *best {
            *best = total;
        }
        return;
    }
    for v in 0..n {
        if !seen[v] {
            seen[v] = true;
            *placed += 1;
            brute_step(dist, v, spent + dist[at][v], best, seen, placed);
            *placed -= 1;
            seen[v] = false;
        }
    }
}

/// Every tour, walked. The definition, at (n-1)! cost.
fn brute(dist: &Matrix) -> i64 {
    let n = dist.len();
    let mut best = INF;
    let mut seen = vec![false; n];
    seen[0] = true;
    let mut placed = 1;
    brute_step(dist, 0, 0, &mut best, &mut seen, &mut placed);
    best
}

fn permutations_of(n: usize) -> i64 {
    let mut out: i64 = 1;
    for step in 2..n {
        out *= step as i64;
    }
    out
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn random_distances(rng: &mut Rng, n: usize) -> Matrix {
    let mut dist = vec![vec![0i64; n]; n];
    for i in 0..n {
        for j in (i + 1)..n {
            let d = 1 + rng.next(20);
            dist[i][j] = d;
            dist[j][i] = d;
        }
    }
    dist
}

fn main() {
    let cases: Vec<Matrix> = vec![
        vec![vec![0, 10, 15, 20], vec![10, 0, 35, 25], vec![15, 35, 0, 30], vec![20, 25, 30, 0]],
        vec![vec![0, 1, 9, 9], vec![1, 0, 1, 9], vec![9, 1, 0, 1], vec![9, 9, 1, 0]],
        vec![vec![0, 3, 3, 3], vec![3, 0, 3, 3], vec![3, 3, 0, 3], vec![3, 3, 3, 0]],
        vec![
            vec![0, 2, 9, 9, 9],
            vec![2, 0, 2, 9, 9],
            vec![9, 2, 0, 2, 9],
            vec![9, 9, 2, 0, 2],
            vec![9, 9, 9, 2, 0],
        ],
    ];

    println!(
        "{:>8}{:>18}{:>15}{:>15}{:>12}{:>8}{:>7}",
        "cities", "set and position", "spanning tree", "nearest first", "every tour", "states", "tours"
    );
    for dist in &cases {
        let n = dist.len();
        let (best, states) = tour(dist);
        println!(
            "{:>8}{:>18}{:>15}{:>15}{:>12}{:>8}{:>7}",
            n,
            best,
            spanning_tree(dist),
            nearest_neighbour(dist),
            brute(dist),
            states,
            permutations_of(n)
        );
    }
    println!();

    println!("and what the table is buying, as n grows:");
    println!("{:>8}{:>16}{:>22}", "cities", "2^n * n states", "(n-1)! tours");
    for n in [4usize, 8, 12, 16, 20] {
        println!("{:>8}{:>16}{:>22}", n, (1i64 << n) * n as i64, permutations_of(n));
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut dp_ok, mut tree_ok, mut tree_over, mut near_ok) = (0, 0, 0, 0);
    for _ in 0..trials {
        let n = (3 + rng.next(4)) as usize;
        let dist = random_distances(&mut rng, n);
        let truth = brute(&dist);
        let (best, _) = tour(&dist);
        if best == truth {
            dp_ok += 1;
        }
        let bound = spanning_tree(&dist);
        if bound == truth {
            tree_ok += 1;
        }
        if bound > truth {
            tree_over += 1;
        }
        if nearest_neighbour(&dist) == truth {
            near_ok += 1;
        }
    }

    println!("over {} random maps of 3 to 6 cities, against every tour:", trials);
    println!("  the set-and-position table   {:>6}", dp_ok);
    println!("  the spanning tree bound      {:>6}", tree_ok);
    println!("  nearest city first           {:>6}", near_ok);
    println!();
    println!("the spanning tree was never above the true tour ({} times), which is what", tree_over);
    println!("makes it a bound rather than an answer: dropping the position from the state");
    println!("stops the table describing a walk at all, and what it computes instead is a");
    println!("tree. The position is not an optimisation, it is what makes the next edge");
    println!("have a price.");
}
`,
            },
            {
              lang: "go",
              code: `// Bitmask dynamic programming: the state is a *set*, held in the bits of an
// integer, and the fill order is numeric order because removing an element only
// ever makes the integer smaller.
//
// The travelling salesman tour is the standard instance, and it is also the
// clearest demonstration of why a set is not enough on its own. Knowing which
// cities have been visited does not price the next edge -- that depends on where
// you are standing. So the state is a set *and* a position, which is the same
// correction as lesson 4's ending and lesson 7's flag, in a third costume.
package main

import "fmt"

const inf = 1000000000

// tour gives dp[mask][last] = cheapest way to visit exactly mask, standing on last.
func tour(dist [][]int) (int, int) {
	n := len(dist)
	dp := make([][]int, 1<<n)
	for i := range dp {
		dp[i] = make([]int, n)
		for j := range dp[i] {
			dp[i][j] = inf
		}
	}
	dp[1][0] = 0
	states := 0
	for mask := 0; mask < 1<<n; mask++ {
		if mask&1 == 0 {
			continue
		}
		for last := 0; last < n; last++ {
			if dp[mask][last] >= inf {
				continue
			}
			states++
			for nxt := 0; nxt < n; nxt++ {
				if mask>>nxt&1 == 1 {
					continue
				}
				step := dp[mask][last] + dist[last][nxt]
				if step < dp[mask|1<<nxt][nxt] {
					dp[mask|1<<nxt][nxt] = step
				}
			}
		}
	}
	full := (1 << n) - 1
	best := inf
	for last := 0; last < n; last++ {
		if dp[full][last]+dist[last][0] < best {
			best = dp[full][last] + dist[last][0]
		}
	}
	return best, states
}

// spanningTree is the cheapest tree touching every city: a lower bound, not a tour.
func spanningTree(dist [][]int) int {
	n := len(dist)
	inside := make([]bool, n)
	inside[0] = true
	total := 0
	for round := 0; round < n-1; round++ {
		best, pick := inf, -1
		for v := 0; v < n; v++ {
			if inside[v] {
				continue
			}
			for u := 0; u < n; u++ {
				if inside[u] && dist[u][v] < best {
					best = dist[u][v]
					pick = v
				}
			}
		}
		inside[pick] = true
		total += best
	}
	return total
}

// nearestNeighbour always walks to the closest city not yet visited, then comes home.
func nearestNeighbour(dist [][]int) int {
	n := len(dist)
	seen := make([]bool, n)
	seen[0] = true
	at, total := 0, 0
	for round := 0; round < n-1; round++ {
		best, pick := inf, -1
		for v := 0; v < n; v++ {
			if !seen[v] && dist[at][v] < best {
				best = dist[at][v]
				pick = v
			}
		}
		seen[pick] = true
		total += best
		at = pick
	}
	return total + dist[at][0]
}

// brute walks every tour. The definition, at (n-1)! cost.
func brute(dist [][]int) int {
	n := len(dist)
	best := inf
	seen := make([]bool, n)
	seen[0] = true
	placed := 1
	var step func(at, spent int)
	step = func(at, spent int) {
		if spent >= best {
			return
		}
		if placed == n {
			if total := spent + dist[at][0]; total < best {
				best = total
			}
			return
		}
		for v := 0; v < n; v++ {
			if !seen[v] {
				seen[v] = true
				placed++
				step(v, spent+dist[at][v])
				placed--
				seen[v] = false
			}
		}
	}
	step(0, 0)
	return best
}

func permutationsOf(n int) int64 {
	var out int64 = 1
	for step := 2; step < n; step++ {
		out *= int64(step)
	}
	return out
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func randomDistances(n int) [][]int {
	dist := make([][]int, n)
	for i := range dist {
		dist[i] = make([]int, n)
	}
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			d := 1 + rand(20)
			dist[i][j] = d
			dist[j][i] = d
		}
	}
	return dist
}

func main() {
	cases := [][][]int{
		{{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}},
		{{0, 1, 9, 9}, {1, 0, 1, 9}, {9, 1, 0, 1}, {9, 9, 1, 0}},
		{{0, 3, 3, 3}, {3, 0, 3, 3}, {3, 3, 0, 3}, {3, 3, 3, 0}},
		{{0, 2, 9, 9, 9}, {2, 0, 2, 9, 9}, {9, 2, 0, 2, 9}, {9, 9, 2, 0, 2}, {9, 9, 9, 2, 0}},
	}

	fmt.Printf("%8s%18s%15s%15s%12s%8s%7s\\n", "cities", "set and position", "spanning tree",
		"nearest first", "every tour", "states", "tours")
	for _, dist := range cases {
		n := len(dist)
		best, states := tour(dist)
		fmt.Printf("%8d%18d%15d%15d%12d%8d%7d\\n", n, best, spanningTree(dist),
			nearestNeighbour(dist), brute(dist), states, permutationsOf(n))
	}
	fmt.Println()

	fmt.Println("and what the table is buying, as n grows:")
	fmt.Printf("%8s%16s%22s\\n", "cities", "2^n * n states", "(n-1)! tours")
	for _, n := range []int{4, 8, 12, 16, 20} {
		fmt.Printf("%8d%16d%22d\\n", n, int64(1<<n)*int64(n), permutationsOf(n))
	}
	fmt.Println()

	trials := 3000
	dpOk, treeOk, treeOver, nearOk := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 3 + rand(4)
		dist := randomDistances(n)
		truth := brute(dist)
		best, _ := tour(dist)
		if best == truth {
			dpOk++
		}
		bound := spanningTree(dist)
		if bound == truth {
			treeOk++
		}
		if bound > truth {
			treeOver++
		}
		if nearestNeighbour(dist) == truth {
			nearOk++
		}
	}

	fmt.Printf("over %d random maps of 3 to 6 cities, against every tour:\\n", trials)
	fmt.Printf("  the set-and-position table   %6d\\n", dpOk)
	fmt.Printf("  the spanning tree bound      %6d\\n", treeOk)
	fmt.Printf("  nearest city first           %6d\\n", nearOk)
	fmt.Println()
	fmt.Printf("the spanning tree was never above the true tour (%d times), which is what\\n", treeOver)
	fmt.Println("makes it a bound rather than an answer: dropping the position from the state")
	fmt.Println("stops the table describing a walk at all, and what it computes instead is a")
	fmt.Println("tree. The position is not an optimisation, it is what makes the next edge")
	fmt.Println("have a price.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-bitmask-tour",
        kind: "dp",
        algorithm: "bitmask",
        title: "A table indexed by a subset, filled in numeric order",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "A set is not always enough state",
          body: "For a tour, the cost of the next edge depends on where you are standing, so the state is a set and a position. Dropping the position gives a table that computes a spanning tree instead \u2014 measured here, strictly below the true tour on every one of 3,000 maps. It is a valid algorithm for a different question, which is why nothing looks wrong.",
        },
        {
          title: "Bitmask DP is exponential, just less exponential",
          body: "2^n * n states rather than (n-1)! tours: about 21 million against 1.2 * 10^17 at twenty cities. That makes twenty feasible and thirty not. If n can be large, this is the wrong technique and the answer is an approximation or a solver, not a bigger table.",
        },
      ],
    },
    {
      id: "counting-without-visiting",
      heading: "Counting numbers without visiting them",
      body: [
        "The second technique counts things without visiting them, and it is the one most people find opaque until they see what the two flags are for.",
        "The question has the shape \"how many numbers from 0 to N have some property\". `N` can be enormous \u2014 10^12, 10^18 \u2014 so counting one at a time is not on. But a decimal number is a short sequence of digits, and if the property can be checked digit by digit while remembering a small amount, then the state is a position in that sequence plus whatever needs remembering. Twelve digits and a small memory is a tiny table.",
        "Two things have to be in the state, and they are the entire difficulty of the technique. **Tight**: are the digits chosen so far exactly `N`'s, so that the next digit is capped by `N`'s digit rather than free to be anything up to 9? **Started**: has a non-zero digit appeared yet, or are we still in the leading zeros that pad a shorter number out to `N`'s length?",
        "The example runs the property \"no two adjacent digits are equal\" with each flag switchable, against counting one by one. With both: 3,000 out of 3,000. Without `started`: 6. Without `tight`: 11. And the direction of each failure follows from what the flag was for \u2014 dropping `started` undercounts, because the padding zeros look like a clash; dropping `tight` overcounts, because nothing caps the digits any more.",
        "Then the payoff. Counting up to a million million, the answer is 317,733,228,541 and the table reaches it in 124 states. Not 124 million: one hundred and twenty-four. That is the whole argument for the technique in one line.",
      ],
      examples: [
        {
          id: "tight-and-started",
          title: "A digit count, with each of its two flags switchable",
          lang: "python",
          code: `# Digit dynamic programming: counting the numbers up to N with some property,
# without visiting the numbers.
#
# The state is a position in the decimal expansion plus whatever the property
# needs to remember, and two bookkeeping flags that are the whole difficulty of
# the technique:
#
#   tight   -- are the digits so far exactly N's, so the next digit is capped?
#   started -- has a non-zero digit appeared, or are we still in leading zeros?
#
# Both are easy to leave out, and leaving either out gives a program that runs
# and returns a number. The property here is "no two adjacent digits are equal".
NONE = 10


def digits_of(n):
    if n == 0:
        return [0]
    out = []
    while n > 0:
        out.append(n % 10)
        n //= 10
    out.reverse()
    return out


def count(limit, use_tight, use_started):
    """Numbers in 0..limit with no two adjacent digits equal."""
    ds = digits_of(limit)
    d = len(ds)
    # memo[pos][prev][tight][started], with -1 meaning "not computed".
    memo = [[[[-1] * 2 for _ in range(2)] for _ in range(11)] for _ in range(d + 1)]
    visited = [0]

    def walk(pos, prev, tight, started):
        if pos == d:
            return 1
        seen = memo[pos][prev][tight][started]
        if seen >= 0:
            return seen
        visited[0] += 1
        top = ds[pos] if (tight and use_tight) else 9
        total = 0
        for digit in range(top + 1):
            leading = started or digit > 0
            if use_started and not leading:
                # Still inside the leading zeros: this position is not a digit
                # of the number yet, so it cannot clash with anything.
                total += walk(pos + 1, NONE, 1 if (tight and digit == ds[pos]) else 0, 0)
                continue
            if prev != NONE and digit == prev:
                continue
            total += walk(pos + 1, digit, 1 if (tight and digit == ds[pos]) else 0, 1)
        memo[pos][prev][tight][started] = total
        return total

    answer = walk(0, NONE, 1, 0)
    return answer, visited[0]


def one_by_one(limit):
    """Check every number from 0 to limit. The definition."""
    total = 0
    for value in range(limit + 1):
        ds = digits_of(value)
        ok = True
        for i in range(1, len(ds)):
            if ds[i] == ds[i - 1]:
                ok = False
        if ok:
            total += 1
    return total, limit + 1


CASES = [9, 10, 11, 100, 121, 1000, 54321]

print(f"{'limit':>8}{'both flags':>12}{'no started':>12}{'no tight':>10}{'one by one':>12}{'states':>8}{'numbers':>9}")
for limit in CASES:
    both, states = count(limit, True, True)
    no_started, _ = count(limit, True, False)
    no_tight, _ = count(limit, False, True)
    truth, numbers = one_by_one(limit)
    print(f"{limit:>8}{both:>12}{no_started:>12}{no_tight:>10}{truth:>12}{states:>8}{numbers:>9}")
print()

BIG = 1000000000000
big, big_states = count(BIG, True, True)
print(f"and the point of the technique: up to {BIG} the answer is {big},")
print(f"reached in {big_states} states rather than {BIG + 1} numbers.")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
both_ok = 0
started_ok = 0
tight_ok = 0
tight_over = 0
started_under = 0
for _ in range(TRIALS):
    limit = rand(3000)
    truth, _ = one_by_one(limit)
    both, _ = count(limit, True, True)
    no_started, _ = count(limit, True, False)
    no_tight, _ = count(limit, False, True)
    if both == truth:
        both_ok += 1
    if no_started == truth:
        started_ok += 1
    if no_started < truth:
        started_under += 1
    if no_tight == truth:
        tight_ok += 1
    if no_tight > truth:
        tight_over += 1

print(f"over {TRIALS} random limits below 3000, against counting one by one:")
print(f"  both flags        {both_ok:>6}")
print(f"  without started   {started_ok:>6}")
print(f"  without tight     {tight_ok:>6}")
print()
print(f"without started it undercounts ({started_under} times), because a number shorter than")
print("the limit is padded with leading zeros and two of those look like a clash.")
print(f"Without tight it overcounts ({tight_over} times), because it stops noticing that the")
print("limit caps the digits at all. Two flags, two opposite failures, and both")
print("versions still return a plausible count.")
`,
          output: `   limit  both flags  no started  no tight  one by one  states  numbers
       9          10          10        10          10       1       10
      10          11          10        91          11       3       11
      11          11          10        91          11       3       12
     100          91          81       820          91      14      101
     121         102          92       820         102      15      122
    1000         820         729      7381         820      25     1001
   54321       36804       35984     66430       36804      43    54322

and the point of the technique: up to 1000000000000 the answer is 317733228541,
reached in 124 states rather than 1000000000001 numbers.

over 3000 random limits below 3000, against counting one by one:
  both flags          3000
  without started        6
  without tight         11

without started it undercounts (2994 times), because a number shorter than
the limit is padded with leading zeros and two of those look like a clash.
Without tight it overcounts (2989 times), because it stops noticing that the
limit caps the digits at all. Two flags, two opposite failures, and both
versions still return a plausible count.`,
          explanation:
            "The same digit table with each flag switchable, scored against counting one by one. The two failures point in opposite directions, which follows directly from what each flag was doing, and the large limit at the end is what the technique is for.",
          alternates: [
            {
              lang: "javascript",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".

const NONE = 10;

function digitsOf(n) {
  if (n === 0) return [0];
  const out = [];
  while (n > 0) {
    out.push(n % 10);
    n = Math.floor(n / 10);
  }
  out.reverse();
  return out;
}

/** Numbers in 0..limit with no two adjacent digits equal. */
function count(limit, useTight, useStarted) {
  const ds = digitsOf(limit);
  const d = ds.length;
  // memo[pos][prev][tight][started], with -1 meaning "not computed".
  const memo = Array.from({ length: d + 1 }, () =>
    Array.from({ length: 11 }, () => Array.from({ length: 2 }, () => [-1, -1]))
  );
  let visited = 0;

  const walk = (pos, prev, tight, started) => {
    if (pos === d) return 1;
    const seen = memo[pos][prev][tight][started];
    if (seen >= 0) return seen;
    visited++;
    const top = tight && useTight ? ds[pos] : 9;
    let total = 0;
    for (let digit = 0; digit <= top; digit++) {
      const leading = started === 1 || digit > 0;
      if (useStarted && !leading) {
        // Still inside the leading zeros: this position is not a digit
        // of the number yet, so it cannot clash with anything.
        total += walk(pos + 1, NONE, tight && digit === ds[pos] ? 1 : 0, 0);
        continue;
      }
      if (prev !== NONE && digit === prev) continue;
      total += walk(pos + 1, digit, tight && digit === ds[pos] ? 1 : 0, 1);
    }
    memo[pos][prev][tight][started] = total;
    return total;
  };

  const answer = walk(0, NONE, 1, 0);
  return [answer, visited];
}

/** Check every number from 0 to limit. The definition. */
function oneByOne(limit) {
  let total = 0;
  for (let value = 0; value <= limit; value++) {
    const ds = digitsOf(value);
    let ok = true;
    for (let i = 1; i < ds.length; i++) {
      if (ds[i] === ds[i - 1]) ok = false;
    }
    if (ok) total++;
  }
  return [total, limit + 1];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);

const CASES = [9, 10, 11, 100, 121, 1000, 54321];

console.log(
  pad("limit", 8) + pad("both flags", 12) + pad("no started", 12) + pad("no tight", 10) +
    pad("one by one", 12) + pad("states", 8) + pad("numbers", 9)
);
for (const limit of CASES) {
  const [both, states] = count(limit, true, true);
  const [noStarted] = count(limit, true, false);
  const [noTight] = count(limit, false, true);
  const [truth, numbers] = oneByOne(limit);
  console.log(
    pad(limit, 8) + pad(both, 12) + pad(noStarted, 12) + pad(noTight, 10) +
      pad(truth, 12) + pad(states, 8) + pad(numbers, 9)
  );
}
console.log();

const BIG = 1000000000000;
const [big, bigStates] = count(BIG, true, true);
console.log(\`and the point of the technique: up to \${BIG} the answer is \${big},\`);
console.log(\`reached in \${bigStates} states rather than \${BIG + 1} numbers.\`);
console.log();

const TRIALS = 3000;
let bothOk = 0;
let startedOk = 0;
let tightOk = 0;
let tightOver = 0;
let startedUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const limit = rand(3000);
  const [truth] = oneByOne(limit);
  const [both] = count(limit, true, true);
  const [noStarted] = count(limit, true, false);
  const [noTight] = count(limit, false, true);
  if (both === truth) bothOk++;
  if (noStarted === truth) startedOk++;
  if (noStarted < truth) startedUnder++;
  if (noTight === truth) tightOk++;
  if (noTight > truth) tightOver++;
}

console.log(\`over \${TRIALS} random limits below 3000, against counting one by one:\`);
console.log("  both flags        " + pad(bothOk, 6));
console.log("  without started   " + pad(startedOk, 6));
console.log("  without tight     " + pad(tightOk, 6));
console.log();
console.log(\`without started it undercounts (\${startedUnder} times), because a number shorter than\`);
console.log("the limit is padded with leading zeros and two of those look like a clash.");
console.log(\`Without tight it overcounts (\${tightOver} times), because it stops noticing that the\`);
console.log("limit caps the digits at all. Two flags, two opposite failures, and both");
console.log("versions still return a plausible count.");
`,
            },
            {
              lang: "typescript",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".

const NONE = 10;

function digitsOf(n: number): number[] {
  if (n === 0) return [0];
  const out: number[] = [];
  while (n > 0) {
    out.push(n % 10);
    n = Math.floor(n / 10);
  }
  out.reverse();
  return out;
}

/** Numbers in 0..limit with no two adjacent digits equal. */
function count(limit: number, useTight: boolean, useStarted: boolean): [number, number] {
  const ds = digitsOf(limit);
  const d = ds.length;
  // memo[pos][prev][tight][started], with -1 meaning "not computed".
  const memo: number[][][][] = Array.from({ length: d + 1 }, () =>
    Array.from({ length: 11 }, () => Array.from({ length: 2 }, () => [-1, -1]))
  );
  let visited = 0;

  const walk = (pos: number, prev: number, tight: number, started: number): number => {
    if (pos === d) return 1;
    const seen = memo[pos][prev][tight][started];
    if (seen >= 0) return seen;
    visited++;
    const top = tight && useTight ? ds[pos] : 9;
    let total = 0;
    for (let digit = 0; digit <= top; digit++) {
      const leading = started === 1 || digit > 0;
      if (useStarted && !leading) {
        // Still inside the leading zeros: this position is not a digit
        // of the number yet, so it cannot clash with anything.
        total += walk(pos + 1, NONE, tight && digit === ds[pos] ? 1 : 0, 0);
        continue;
      }
      if (prev !== NONE && digit === prev) continue;
      total += walk(pos + 1, digit, tight && digit === ds[pos] ? 1 : 0, 1);
    }
    memo[pos][prev][tight][started] = total;
    return total;
  };

  const answer = walk(0, NONE, 1, 0);
  return [answer, visited];
}

/** Check every number from 0 to limit. The definition. */
function oneByOne(limit: number): [number, number] {
  let total = 0;
  for (let value = 0; value <= limit; value++) {
    const ds = digitsOf(value);
    let ok = true;
    for (let i = 1; i < ds.length; i++) {
      if (ds[i] === ds[i - 1]) ok = false;
    }
    if (ok) total++;
  }
  return [total, limit + 1];
}

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);

const CASES = [9, 10, 11, 100, 121, 1000, 54321];

console.log(
  pad("limit", 8) + pad("both flags", 12) + pad("no started", 12) + pad("no tight", 10) +
    pad("one by one", 12) + pad("states", 8) + pad("numbers", 9)
);
for (const limit of CASES) {
  const [both, states] = count(limit, true, true);
  const [noStarted] = count(limit, true, false);
  const [noTight] = count(limit, false, true);
  const [truth, numbers] = oneByOne(limit);
  console.log(
    pad(limit, 8) + pad(both, 12) + pad(noStarted, 12) + pad(noTight, 10) +
      pad(truth, 12) + pad(states, 8) + pad(numbers, 9)
  );
}
console.log();

const BIG = 1000000000000;
const [big, bigStates] = count(BIG, true, true);
console.log(\`and the point of the technique: up to \${BIG} the answer is \${big},\`);
console.log(\`reached in \${bigStates} states rather than \${BIG + 1} numbers.\`);
console.log();

const TRIALS = 3000;
let bothOk = 0;
let startedOk = 0;
let tightOk = 0;
let tightOver = 0;
let startedUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const limit = rand(3000);
  const [truth] = oneByOne(limit);
  const [both] = count(limit, true, true);
  const [noStarted] = count(limit, true, false);
  const [noTight] = count(limit, false, true);
  if (both === truth) bothOk++;
  if (noStarted === truth) startedOk++;
  if (noStarted < truth) startedUnder++;
  if (noTight === truth) tightOk++;
  if (noTight > truth) tightOver++;
}

console.log(\`over \${TRIALS} random limits below 3000, against counting one by one:\`);
console.log("  both flags        " + pad(bothOk, 6));
console.log("  without started   " + pad(startedOk, 6));
console.log("  without tight     " + pad(tightOk, 6));
console.log();
console.log(\`without started it undercounts (\${startedUnder} times), because a number shorter than\`);
console.log("the limit is padded with leading zeros and two of those look like a clash.");
console.log(\`Without tight it overcounts (\${tightOver} times), because it stops noticing that the\`);
console.log("limit caps the digits at all. Two flags, two opposite failures, and both");
console.log("versions still return a plausible count.");
`,
            },
            {
              lang: "java",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final int NONE = 10;

    static int[] digitsOf(long n) {
        if (n == 0) return new int[] {0};
        List<Integer> out = new ArrayList<>();
        while (n > 0) {
            out.add((int) (n % 10));
            n /= 10;
        }
        int[] ds = new int[out.size()];
        for (int i = 0; i < ds.length; i++) ds[i] = out.get(out.size() - 1 - i);
        return ds;
    }

    static int[] digits;
    static long[][][][] memo;
    static boolean[][][][] known;
    static boolean flagTight, flagStarted;
    static long statesVisited;

    // Numbers in 0..limit with no two adjacent digits equal.
    static long count(long limit, boolean useTight, boolean useStarted) {
        digits = digitsOf(limit);
        flagTight = useTight;
        flagStarted = useStarted;
        int d = digits.length;
        memo = new long[d + 1][11][2][2];
        known = new boolean[d + 1][11][2][2];
        statesVisited = 0;
        return walk(0, NONE, 1, 0);
    }

    static long walk(int pos, int prev, int tight, int started) {
        int d = digits.length;
        if (pos == d) return 1;
        if (known[pos][prev][tight][started]) return memo[pos][prev][tight][started];
        statesVisited++;
        int top = (tight == 1 && flagTight) ? digits[pos] : 9;
        long total = 0;
        for (int digit = 0; digit <= top; digit++) {
            boolean leading = started == 1 || digit > 0;
            if (flagStarted && !leading) {
                // Still inside the leading zeros: this position is not a digit
                // of the number yet, so it cannot clash with anything.
                total += walk(pos + 1, NONE, (tight == 1 && digit == digits[pos]) ? 1 : 0, 0);
                continue;
            }
            if (prev != NONE && digit == prev) continue;
            total += walk(pos + 1, digit, (tight == 1 && digit == digits[pos]) ? 1 : 0, 1);
        }
        memo[pos][prev][tight][started] = total;
        known[pos][prev][tight][started] = true;
        return total;
    }

    // Check every number from 0 to limit. The definition.
    static long oneByOne(long limit) {
        long total = 0;
        for (long value = 0; value <= limit; value++) {
            int[] ds = digitsOf(value);
            boolean ok = true;
            for (int i = 1; i < ds.length; i++) {
                if (ds[i] == ds[i - 1]) ok = false;
            }
            if (ok) total++;
        }
        return total;
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        long[] cases = {9, 10, 11, 100, 121, 1000, 54321};

        System.out.println(pad("limit", 8) + pad("both flags", 12) + pad("no started", 12)
            + pad("no tight", 10) + pad("one by one", 12) + pad("states", 8) + pad("numbers", 9));
        for (long limit : cases) {
            long both = count(limit, true, true);
            long states = statesVisited;
            long noStarted = count(limit, true, false);
            long noTight = count(limit, false, true);
            long truth = oneByOne(limit);
            System.out.println(pad(limit, 8) + pad(both, 12) + pad(noStarted, 12) + pad(noTight, 10)
                + pad(truth, 12) + pad(states, 8) + pad(limit + 1, 9));
        }
        System.out.println();

        long big = 1000000000000L;
        long bigAnswer = count(big, true, true);
        System.out.println("and the point of the technique: up to " + big + " the answer is "
            + bigAnswer + ",");
        System.out.println("reached in " + statesVisited + " states rather than " + (big + 1) + " numbers.");
        System.out.println();

        int trials = 3000;
        int bothOk = 0, startedOk = 0, tightOk = 0, tightOver = 0, startedUnder = 0;
        for (int t = 0; t < trials; t++) {
            long limit = rand(3000);
            long truth = oneByOne(limit);
            long both = count(limit, true, true);
            long noStarted = count(limit, true, false);
            long noTight = count(limit, false, true);
            if (both == truth) bothOk++;
            if (noStarted == truth) startedOk++;
            if (noStarted < truth) startedUnder++;
            if (noTight == truth) tightOk++;
            if (noTight > truth) tightOver++;
        }

        System.out.println("over " + trials + " random limits below 3000, against counting one by one:");
        System.out.println("  both flags        " + pad(bothOk, 6));
        System.out.println("  without started   " + pad(startedOk, 6));
        System.out.println("  without tight     " + pad(tightOk, 6));
        System.out.println();
        System.out.println("without started it undercounts (" + startedUnder
            + " times), because a number shorter than");
        System.out.println("the limit is padded with leading zeros and two of those look like a clash.");
        System.out.println("Without tight it overcounts (" + tightOver
            + " times), because it stops noticing that the");
        System.out.println("limit caps the digits at all. Two flags, two opposite failures, and both");
        System.out.println("versions still return a plausible count.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <utility>
#include <vector>

static const int NONE = 10;

std::vector<int> digitsOf(std::int64_t n) {
    if (n == 0) return {0};
    std::vector<int> out;
    while (n > 0) {
        out.push_back(static_cast<int>(n % 10));
        n /= 10;
    }
    std::reverse(out.begin(), out.end());
    return out;
}

struct Counter {
    std::vector<int> ds;
    bool useTight;
    bool useStarted;
    std::vector<std::vector<std::vector<std::vector<std::int64_t>>>> memo;
    std::vector<std::vector<std::vector<std::vector<bool>>>> known;
    std::int64_t visited = 0;

    std::int64_t walk(int pos, int prev, int tight, int started) {
        int d = static_cast<int>(ds.size());
        if (pos == d) return 1;
        if (known[pos][prev][tight][started]) return memo[pos][prev][tight][started];
        visited++;
        int top = (tight && useTight) ? ds[pos] : 9;
        std::int64_t total = 0;
        for (int digit = 0; digit <= top; digit++) {
            bool leading = started == 1 || digit > 0;
            int nextTight = (tight && digit == ds[pos]) ? 1 : 0;
            if (useStarted && !leading) {
                // Still inside the leading zeros: this position is not a digit
                // of the number yet, so it cannot clash with anything.
                total += walk(pos + 1, NONE, nextTight, 0);
                continue;
            }
            if (prev != NONE && digit == prev) continue;
            total += walk(pos + 1, digit, nextTight, 1);
        }
        memo[pos][prev][tight][started] = total;
        known[pos][prev][tight][started] = true;
        return total;
    }
};

// Numbers in 0..limit with no two adjacent digits equal.
std::pair<std::int64_t, std::int64_t> count(std::int64_t limit, bool useTight, bool useStarted) {
    Counter c;
    c.ds = digitsOf(limit);
    c.useTight = useTight;
    c.useStarted = useStarted;
    int d = static_cast<int>(c.ds.size());
    c.memo.assign(d + 1, std::vector<std::vector<std::vector<std::int64_t>>>(
        11, std::vector<std::vector<std::int64_t>>(2, std::vector<std::int64_t>(2, 0))));
    c.known.assign(d + 1, std::vector<std::vector<std::vector<bool>>>(
        11, std::vector<std::vector<bool>>(2, std::vector<bool>(2, false))));
    std::int64_t answer = c.walk(0, NONE, 1, 0);
    return {answer, c.visited};
}

// Check every number from 0 to limit. The definition.
std::int64_t oneByOne(std::int64_t limit) {
    std::int64_t total = 0;
    for (std::int64_t value = 0; value <= limit; value++) {
        std::vector<int> ds = digitsOf(value);
        bool ok = true;
        for (size_t i = 1; i < ds.size(); i++) {
            if (ds[i] == ds[i - 1]) ok = false;
        }
        if (ok) total++;
    }
    return total;
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::int64_t> cases = {9, 10, 11, 100, 121, 1000, 54321};

    std::cout << std::right << std::setw(8) << "limit" << std::setw(12) << "both flags"
              << std::setw(12) << "no started" << std::setw(10) << "no tight"
              << std::setw(12) << "one by one" << std::setw(8) << "states"
              << std::setw(9) << "numbers" << "\\n";
    for (std::int64_t limit : cases) {
        auto both = count(limit, true, true);
        auto noStarted = count(limit, true, false);
        auto noTight = count(limit, false, true);
        std::cout << std::setw(8) << limit << std::setw(12) << both.first
                  << std::setw(12) << noStarted.first << std::setw(10) << noTight.first
                  << std::setw(12) << oneByOne(limit) << std::setw(8) << both.second
                  << std::setw(9) << limit + 1 << "\\n";
    }
    std::cout << "\\n";

    const std::int64_t BIG = 1000000000000LL;
    auto big = count(BIG, true, true);
    std::cout << "and the point of the technique: up to " << BIG << " the answer is "
              << big.first << ",\\n";
    std::cout << "reached in " << big.second << " states rather than " << BIG + 1 << " numbers.\\n\\n";

    const int TRIALS = 3000;
    int bothOk = 0, startedOk = 0, tightOk = 0, tightOver = 0, startedUnder = 0;
    for (int t = 0; t < TRIALS; t++) {
        std::int64_t limit = rnd(3000);
        std::int64_t truth = oneByOne(limit);
        std::int64_t both = count(limit, true, true).first;
        std::int64_t noStarted = count(limit, true, false).first;
        std::int64_t noTight = count(limit, false, true).first;
        if (both == truth) bothOk++;
        if (noStarted == truth) startedOk++;
        if (noStarted < truth) startedUnder++;
        if (noTight == truth) tightOk++;
        if (noTight > truth) tightOver++;
    }

    std::cout << "over " << TRIALS << " random limits below 3000, against counting one by one:\\n";
    std::cout << "  both flags        " << std::setw(6) << bothOk << "\\n";
    std::cout << "  without started   " << std::setw(6) << startedOk << "\\n";
    std::cout << "  without tight     " << std::setw(6) << tightOk << "\\n\\n";
    std::cout << "without started it undercounts (" << startedUnder
              << " times), because a number shorter than\\n";
    std::cout << "the limit is padded with leading zeros and two of those look like a clash.\\n";
    std::cout << "Without tight it overcounts (" << tightOver
              << " times), because it stops noticing that the\\n";
    std::cout << "limit caps the digits at all. Two flags, two opposite failures, and both\\n";
    std::cout << "versions still return a plausible count.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".

const NONE: usize = 10;

fn digits_of(mut n: i64) -> Vec<usize> {
    if n == 0 {
        return vec![0];
    }
    let mut out = Vec::new();
    while n > 0 {
        out.push((n % 10) as usize);
        n /= 10;
    }
    out.reverse();
    out
}

struct Counter {
    ds: Vec<usize>,
    use_tight: bool,
    use_started: bool,
    memo: Vec<Vec<Vec<Vec<i64>>>>,
    known: Vec<Vec<Vec<Vec<bool>>>>,
    visited: i64,
}

impl Counter {
    fn walk(&mut self, pos: usize, prev: usize, tight: usize, started: usize) -> i64 {
        let d = self.ds.len();
        if pos == d {
            return 1;
        }
        if self.known[pos][prev][tight][started] {
            return self.memo[pos][prev][tight][started];
        }
        self.visited += 1;
        let top = if tight == 1 && self.use_tight { self.ds[pos] } else { 9 };
        let mut total = 0;
        for digit in 0..=top {
            let leading = started == 1 || digit > 0;
            let next_tight = if tight == 1 && digit == self.ds[pos] { 1 } else { 0 };
            if self.use_started && !leading {
                // Still inside the leading zeros: this position is not a digit
                // of the number yet, so it cannot clash with anything.
                total += self.walk(pos + 1, NONE, next_tight, 0);
                continue;
            }
            if prev != NONE && digit == prev {
                continue;
            }
            total += self.walk(pos + 1, digit, next_tight, 1);
        }
        self.memo[pos][prev][tight][started] = total;
        self.known[pos][prev][tight][started] = true;
        total
    }
}

/// Numbers in 0..limit with no two adjacent digits equal.
fn count(limit: i64, use_tight: bool, use_started: bool) -> (i64, i64) {
    let ds = digits_of(limit);
    let d = ds.len();
    let mut c = Counter {
        ds,
        use_tight,
        use_started,
        memo: vec![vec![vec![vec![0i64; 2]; 2]; 11]; d + 1],
        known: vec![vec![vec![vec![false; 2]; 2]; 11]; d + 1],
        visited: 0,
    };
    let answer = c.walk(0, NONE, 1, 0);
    (answer, c.visited)
}

/// Check every number from 0 to limit. The definition.
fn one_by_one(limit: i64) -> i64 {
    let mut total = 0;
    for value in 0..=limit {
        let ds = digits_of(value);
        let mut ok = true;
        for i in 1..ds.len() {
            if ds[i] == ds[i - 1] {
                ok = false;
            }
        }
        if ok {
            total += 1;
        }
    }
    total
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let cases: [i64; 7] = [9, 10, 11, 100, 121, 1000, 54321];

    println!(
        "{:>8}{:>12}{:>12}{:>10}{:>12}{:>8}{:>9}",
        "limit", "both flags", "no started", "no tight", "one by one", "states", "numbers"
    );
    for &limit in cases.iter() {
        let (both, states) = count(limit, true, true);
        let (no_started, _) = count(limit, true, false);
        let (no_tight, _) = count(limit, false, true);
        println!(
            "{:>8}{:>12}{:>12}{:>10}{:>12}{:>8}{:>9}",
            limit,
            both,
            no_started,
            no_tight,
            one_by_one(limit),
            states,
            limit + 1
        );
    }
    println!();

    let big: i64 = 1000000000000;
    let (big_answer, big_states) = count(big, true, true);
    println!("and the point of the technique: up to {} the answer is {},", big, big_answer);
    println!("reached in {} states rather than {} numbers.", big_states, big + 1);
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut both_ok, mut started_ok, mut tight_ok) = (0, 0, 0);
    let (mut tight_over, mut started_under) = (0, 0);
    for _ in 0..trials {
        let limit = rng.next(3000);
        let truth = one_by_one(limit);
        let (both, _) = count(limit, true, true);
        let (no_started, _) = count(limit, true, false);
        let (no_tight, _) = count(limit, false, true);
        if both == truth {
            both_ok += 1;
        }
        if no_started == truth {
            started_ok += 1;
        }
        if no_started < truth {
            started_under += 1;
        }
        if no_tight == truth {
            tight_ok += 1;
        }
        if no_tight > truth {
            tight_over += 1;
        }
    }

    println!("over {} random limits below 3000, against counting one by one:", trials);
    println!("  both flags        {:>6}", both_ok);
    println!("  without started   {:>6}", started_ok);
    println!("  without tight     {:>6}", tight_ok);
    println!();
    println!("without started it undercounts ({} times), because a number shorter than", started_under);
    println!("the limit is padded with leading zeros and two of those look like a clash.");
    println!("Without tight it overcounts ({} times), because it stops noticing that the", tight_over);
    println!("limit caps the digits at all. Two flags, two opposite failures, and both");
    println!("versions still return a plausible count.");
}
`,
            },
            {
              lang: "go",
              code: `// Digit dynamic programming: counting the numbers up to N with some property,
// without visiting the numbers.
//
// The state is a position in the decimal expansion plus whatever the property
// needs to remember, and two bookkeeping flags that are the whole difficulty of
// the technique:
//
//   tight   -- are the digits so far exactly N's, so the next digit is capped?
//   started -- has a non-zero digit appeared, or are we still in leading zeros?
//
// Both are easy to leave out, and leaving either out gives a program that runs
// and returns a number. The property here is "no two adjacent digits are equal".
package main

import "fmt"

const none = 10

func digitsOf(n int64) []int {
	if n == 0 {
		return []int{0}
	}
	var out []int
	for n > 0 {
		out = append(out, int(n%10))
		n /= 10
	}
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

// count gives the numbers in 0..limit with no two adjacent digits equal.
func count(limit int64, useTight, useStarted bool) (int64, int64) {
	ds := digitsOf(limit)
	d := len(ds)
	// memo[pos][prev][tight][started], with known saying which are computed.
	memo := make([][][][]int64, d+1)
	known := make([][][][]bool, d+1)
	for i := range memo {
		memo[i] = make([][][]int64, 11)
		known[i] = make([][][]bool, 11)
		for j := range memo[i] {
			memo[i][j] = [][]int64{{0, 0}, {0, 0}}
			known[i][j] = [][]bool{{false, false}, {false, false}}
		}
	}
	var visited int64
	var walk func(pos, prev, tight, started int) int64
	walk = func(pos, prev, tight, started int) int64 {
		if pos == d {
			return 1
		}
		if known[pos][prev][tight][started] {
			return memo[pos][prev][tight][started]
		}
		visited++
		top := 9
		if tight == 1 && useTight {
			top = ds[pos]
		}
		var total int64
		for digit := 0; digit <= top; digit++ {
			leading := started == 1 || digit > 0
			nextTight := 0
			if tight == 1 && digit == ds[pos] {
				nextTight = 1
			}
			if useStarted && !leading {
				// Still inside the leading zeros: this position is not a digit
				// of the number yet, so it cannot clash with anything.
				total += walk(pos+1, none, nextTight, 0)
				continue
			}
			if prev != none && digit == prev {
				continue
			}
			total += walk(pos+1, digit, nextTight, 1)
		}
		memo[pos][prev][tight][started] = total
		known[pos][prev][tight][started] = true
		return total
	}
	return walk(0, none, 1, 0), visited
}

// oneByOne checks every number from 0 to limit. The definition.
func oneByOne(limit int64) int64 {
	var total int64
	for value := int64(0); value <= limit; value++ {
		ds := digitsOf(value)
		ok := true
		for i := 1; i < len(ds); i++ {
			if ds[i] == ds[i-1] {
				ok = false
			}
		}
		if ok {
			total++
		}
	}
	return total
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := []int64{9, 10, 11, 100, 121, 1000, 54321}

	fmt.Printf("%8s%12s%12s%10s%12s%8s%9s\\n", "limit", "both flags", "no started", "no tight",
		"one by one", "states", "numbers")
	for _, limit := range cases {
		both, states := count(limit, true, true)
		noStarted, _ := count(limit, true, false)
		noTight, _ := count(limit, false, true)
		truth := oneByOne(limit)
		fmt.Printf("%8d%12d%12d%10d%12d%8d%9d\\n", limit, both, noStarted, noTight, truth,
			states, limit+1)
	}
	fmt.Println()

	var big int64 = 1000000000000
	bigAnswer, bigStates := count(big, true, true)
	fmt.Printf("and the point of the technique: up to %d the answer is %d,\\n", big, bigAnswer)
	fmt.Printf("reached in %d states rather than %d numbers.\\n", bigStates, big+1)
	fmt.Println()

	trials := 3000
	bothOk, startedOk, tightOk, tightOver, startedUnder := 0, 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		limit := int64(rand(3000))
		truth := oneByOne(limit)
		both, _ := count(limit, true, true)
		noStarted, _ := count(limit, true, false)
		noTight, _ := count(limit, false, true)
		if both == truth {
			bothOk++
		}
		if noStarted == truth {
			startedOk++
		}
		if noStarted < truth {
			startedUnder++
		}
		if noTight == truth {
			tightOk++
		}
		if noTight > truth {
			tightOver++
		}
	}

	fmt.Printf("over %d random limits below 3000, against counting one by one:\\n", trials)
	fmt.Printf("  both flags        %6d\\n", bothOk)
	fmt.Printf("  without started   %6d\\n", startedOk)
	fmt.Printf("  without tight     %6d\\n", tightOk)
	fmt.Println()
	fmt.Printf("without started it undercounts (%d times), because a number shorter than\\n", startedUnder)
	fmt.Println("the limit is padded with leading zeros and two of those look like a clash.")
	fmt.Printf("Without tight it overcounts (%d times), because it stops noticing that the\\n", tightOver)
	fmt.Println("limit caps the digits at all. Two flags, two opposite failures, and both")
	fmt.Println("versions still return a plausible count.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Leaving out `tight` counts numbers above the limit",
          body: "Without it, every position is free to take any digit, so the count is for all numbers with that many digits rather than those up to N. It overcounted on 2,989 of 3,000 random limits here, and the result is still a plausible-looking number.",
        },
        {
          title: "Leaving out `started` makes leading zeros look like digits",
          body: "A number shorter than N is padded with leading zeros to N's length, and for a property about adjacent digits two of those padding zeros register as a clash. It undercounted on 2,994 of 3,000. Whether the flag is needed depends on the property \u2014 but deciding that deliberately is the point.",
        },
      ],
    },
    {
      id: "modes-and-arrows",
      heading: "The state is a mode, and the transition is an arrow",
      body: [
        "The third is the one that needs the least new machinery and gets used the most: the state is which *mode* you are in, and the transition is the arrows between modes.",
        "Buying and selling a share is the standard framing. With no restriction there are two modes \u2014 holding and not holding \u2014 and the answer also falls out of a greedy: add up every upward step, because every rise can be captured by buying the day before and selling the day after. Both are correct, and the example confirms them on 3,000 out of 3,000 series.",
        "Now add one sentence: you may not buy on the day after you sell. A third mode appears \u2014 just sold, and therefore barred \u2014 with one arrow in and one arrow out, and the recurrence is again one line per mode. Nothing else about the method changes.",
        "What changes is the two earlier answers. Both drop to 1,751 out of 3,000 on the new rules, and both fail by over-reporting, on 1,249 trials, because they allow a trade the rules forbid. The example scores them against the old rules as well, where they are still perfect. That is the point worth taking: neither is a broken algorithm. Each is the exact answer to a question that is no longer being asked.",
        "Writing the modes and the arrows down before the code is the whole design step. Once the diagram exists \u2014 `free` buys into `hold`, `hold` sells into `sold`, `sold` waits into `free` \u2014 the code is mechanical, and adding a rule means adding a node rather than patching an expression. That is also why this framing is worth reaching for when a problem grows constraints over time: at most `k` transactions, a transaction fee, a longer cooldown are all one more dimension or one more mode, and none of them disturbs what is already there.",
      ],
      examples: [
        {
          id: "one-rule-one-mode",
          title: "One extra rule, one extra mode, scored against both rule sets",
          lang: "python",
          code: `# State-machine dynamic programming: the state is which mode you are in, and
# the transition is the set of legal moves between modes.
#
# Buying and selling a share, with two rule sets. Without a cooldown there are
# two modes -- holding and not holding -- and the answer also falls out of a
# greedy: take every upward step. Add "you may not buy on the day after you
# sell" and a third mode appears, the greedy stops being right, and nothing else
# about the method changes.
#
#   free  --buy-->  hold  --sell-->  sold  --wait-->  free
#
# The whole design is that picture. Once the modes and the arrows are written
# down, the recurrence is one line per mode.
NEG = -(10 ** 9)


def with_cooldown(prices):
    """Three modes: holding, just sold (barred from buying), and free to buy."""
    hold, sold, free = NEG, NEG, 0
    for price in prices:
        hold, sold, free = (
            max(hold, free - price),   # keep holding, or buy while free
            hold + price,              # sell what is held
            max(free, sold),           # stay free, or leave the cooldown
        )
    return max(sold, free, 0)


def without_cooldown(prices):
    """Two modes. The same machine with the cooldown mode removed."""
    hold, free = NEG, 0
    for price in prices:
        hold, free = max(hold, free - price), max(free, hold + price)
    return max(free, 0)


def every_rise(prices):
    """Add up every upward step. Optimal when nothing stops you re-buying."""
    total = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            total += prices[i] - prices[i - 1]
    return total


def brute(prices, cooldown):
    """Every legal sequence of buys and sells, walked."""
    n = len(prices)

    def step(day, holding, blocked):
        if day == n:
            return 0
        best = step(day + 1, holding, False)  # do nothing today
        if holding:
            gain = prices[day] + step(day + 1, False, cooldown)
            best = max(best, gain)
        elif not blocked:
            gain = -prices[day] + step(day + 1, True, False)
            best = max(best, gain)
        return best

    return step(0, False, False)


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    [1, 2, 3, 0, 2],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [2, 1, 4, 5, 2, 9, 7],
    [3, 3, 3, 3],
]

print(f"{'prices':<26}{'three modes':>13}{'two modes':>11}{'every rise':>12}{'every schedule':>16}")
for prices in CASES:
    print(f"{show(prices):<26}{with_cooldown(prices):>13}{without_cooldown(prices):>11}"
          f"{every_rise(prices):>12}{brute(prices, True):>16}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
three_ok = 0
two_ok = 0
rise_ok = 0
two_over = 0
free_two_ok = 0
free_rise_ok = 0
for _ in range(TRIALS):
    n = 2 + rand(9)
    prices = [1 + rand(15) for _ in range(n)]
    truth = brute(prices, True)
    if with_cooldown(prices) == truth:
        three_ok += 1
    guess = without_cooldown(prices)
    if guess == truth:
        two_ok += 1
    if guess > truth:
        two_over += 1
    if every_rise(prices) == truth:
        rise_ok += 1
    # And the same series under the rules the two-mode machine was written for.
    loose = brute(prices, False)
    if without_cooldown(prices) == loose:
        free_two_ok += 1
    if every_rise(prices) == loose:
        free_rise_ok += 1

print(f"over {TRIALS} random price series of 2 to 10 days, with the cooldown rule:")
print(f"  the three-mode machine   {three_ok:>6}")
print(f"  the two-mode machine     {two_ok:>6}")
print(f"  every upward step        {rise_ok:>6}")
print()
print("and the same series without the cooldown, which is what those two answer:")
print(f"  the two-mode machine     {free_two_ok:>6}")
print(f"  every upward step        {free_rise_ok:>6}")
print()
print(f"so neither is wrong in itself. Both are exactly right about a different")
print(f"question, and both over-report on this one ({two_over} times for the two-mode")
print("machine), because they allow a trade the rules forbid. Adding a rule adds a")
print("mode; it does not adjust an existing answer.")
`,
          output: `prices                      three modes  two modes  every rise  every schedule
[1, 2, 3, 0, 2]                       3          4           4               3
[1, 2, 3, 4, 5]                       4          4           4               4
[5, 4, 3, 2, 1]                       0          0           0               0
[2, 1, 4, 5, 2, 9, 7]                10         11          11              10
[3, 3, 3, 3]                          0          0           0               0

over 3000 random price series of 2 to 10 days, with the cooldown rule:
  the three-mode machine     3000
  the two-mode machine       1751
  every upward step          1751

and the same series without the cooldown, which is what those two answer:
  the two-mode machine       3000
  every upward step          3000

so neither is wrong in itself. Both are exactly right about a different
question, and both over-report on this one (1249 times for the two-mode
machine), because they allow a trade the rules forbid. Adding a rule adds a
mode; it does not adjust an existing answer.`,
          explanation:
            "One extra rule, one extra mode. Both older answers are scored against both rule sets, so it is visible that they are not broken \u2014 they are exactly right about the problem without the cooldown and over-report on the problem with it.",
          alternates: [
            {
              lang: "javascript",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.

const NEG = -1000000000;

/** Three modes: holding, just sold (barred from buying), and free to buy. */
function withCooldown(prices) {
  let hold = NEG;
  let sold = NEG;
  let free = 0;
  for (const price of prices) {
    const nextHold = Math.max(hold, free - price); // keep holding, or buy while free
    const nextSold = hold + price; // sell what is held
    const nextFree = Math.max(free, sold); // stay free, or leave the cooldown
    hold = nextHold;
    sold = nextSold;
    free = nextFree;
  }
  return Math.max(sold, free, 0);
}

/** Two modes. The same machine with the cooldown mode removed. */
function withoutCooldown(prices) {
  let hold = NEG;
  let free = 0;
  for (const price of prices) {
    const nextHold = Math.max(hold, free - price);
    const nextFree = Math.max(free, hold + price);
    hold = nextHold;
    free = nextFree;
  }
  return Math.max(free, 0);
}

/** Add up every upward step. Optimal when nothing stops you re-buying. */
function everyRise(prices) {
  let total = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
  }
  return total;
}

/** Every legal sequence of buys and sells, walked. */
function brute(prices, cooldown) {
  const n = prices.length;
  const step = (day, holding, blocked) => {
    if (day === n) return 0;
    let best = step(day + 1, holding, false); // do nothing today
    if (holding) {
      const gain = prices[day] + step(day + 1, false, cooldown);
      if (gain > best) best = gain;
    } else if (!blocked) {
      const gain = -prices[day] + step(day + 1, true, false);
      if (gain > best) best = gain;
    }
    return best;
  };
  return step(0, false, false);
}

const show = (values) => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const CASES = [
  [1, 2, 3, 0, 2],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [2, 1, 4, 5, 2, 9, 7],
  [3, 3, 3, 3],
];

console.log(padEnd("prices", 26) + pad("three modes", 13) + pad("two modes", 11) + pad("every rise", 12) + pad("every schedule", 16));
for (const prices of CASES) {
  console.log(
    padEnd(show(prices), 26) + pad(withCooldown(prices), 13) + pad(withoutCooldown(prices), 11) +
      pad(everyRise(prices), 12) + pad(brute(prices, true), 16)
  );
}
console.log();

const TRIALS = 3000;
let threeOk = 0;
let twoOk = 0;
let riseOk = 0;
let twoOver = 0;
let freeTwoOk = 0;
let freeRiseOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const prices = Array.from({ length: n }, () => 1 + rand(15));
  const truth = brute(prices, true);
  if (withCooldown(prices) === truth) threeOk++;
  const guess = withoutCooldown(prices);
  if (guess === truth) twoOk++;
  if (guess > truth) twoOver++;
  if (everyRise(prices) === truth) riseOk++;
  // And the same series under the rules the two-mode machine was written for.
  const loose = brute(prices, false);
  if (withoutCooldown(prices) === loose) freeTwoOk++;
  if (everyRise(prices) === loose) freeRiseOk++;
}

console.log(\`over \${TRIALS} random price series of 2 to 10 days, with the cooldown rule:\`);
console.log("  the three-mode machine   " + pad(threeOk, 6));
console.log("  the two-mode machine     " + pad(twoOk, 6));
console.log("  every upward step        " + pad(riseOk, 6));
console.log();
console.log("and the same series without the cooldown, which is what those two answer:");
console.log("  the two-mode machine     " + pad(freeTwoOk, 6));
console.log("  every upward step        " + pad(freeRiseOk, 6));
console.log();
console.log("so neither is wrong in itself. Both are exactly right about a different");
console.log(\`question, and both over-report on this one (\${twoOver} times for the two-mode\`);
console.log("machine), because they allow a trade the rules forbid. Adding a rule adds a");
console.log("mode; it does not adjust an existing answer.");
`,
            },
            {
              lang: "typescript",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.

const NEG = -1000000000;

/** Three modes: holding, just sold (barred from buying), and free to buy. */
function withCooldown(prices: number[]): number {
  let hold = NEG;
  let sold = NEG;
  let free = 0;
  for (const price of prices) {
    const nextHold = Math.max(hold, free - price); // keep holding, or buy while free
    const nextSold = hold + price; // sell what is held
    const nextFree = Math.max(free, sold); // stay free, or leave the cooldown
    hold = nextHold;
    sold = nextSold;
    free = nextFree;
  }
  return Math.max(sold, free, 0);
}

/** Two modes. The same machine with the cooldown mode removed. */
function withoutCooldown(prices: number[]): number {
  let hold = NEG;
  let free = 0;
  for (const price of prices) {
    const nextHold = Math.max(hold, free - price);
    const nextFree = Math.max(free, hold + price);
    hold = nextHold;
    free = nextFree;
  }
  return Math.max(free, 0);
}

/** Add up every upward step. Optimal when nothing stops you re-buying. */
function everyRise(prices: number[]): number {
  let total = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
  }
  return total;
}

/** Every legal sequence of buys and sells, walked. */
function brute(prices: number[], cooldown: boolean): number {
  const n = prices.length;
  const step = (day: number, holding: boolean, blocked: boolean): number => {
    if (day === n) return 0;
    let best = step(day + 1, holding, false); // do nothing today
    if (holding) {
      const gain = prices[day] + step(day + 1, false, cooldown);
      if (gain > best) best = gain;
    } else if (!blocked) {
      const gain = -prices[day] + step(day + 1, true, false);
      if (gain > best) best = gain;
    }
    return best;
  };
  return step(0, false, false);
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const CASES = [
  [1, 2, 3, 0, 2],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [2, 1, 4, 5, 2, 9, 7],
  [3, 3, 3, 3],
];

console.log(padEnd("prices", 26) + pad("three modes", 13) + pad("two modes", 11) + pad("every rise", 12) + pad("every schedule", 16));
for (const prices of CASES) {
  console.log(
    padEnd(show(prices), 26) + pad(withCooldown(prices), 13) + pad(withoutCooldown(prices), 11) +
      pad(everyRise(prices), 12) + pad(brute(prices, true), 16)
  );
}
console.log();

const TRIALS = 3000;
let threeOk = 0;
let twoOk = 0;
let riseOk = 0;
let twoOver = 0;
let freeTwoOk = 0;
let freeRiseOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const prices = Array.from({ length: n }, () => 1 + rand(15));
  const truth = brute(prices, true);
  if (withCooldown(prices) === truth) threeOk++;
  const guess = withoutCooldown(prices);
  if (guess === truth) twoOk++;
  if (guess > truth) twoOver++;
  if (everyRise(prices) === truth) riseOk++;
  // And the same series under the rules the two-mode machine was written for.
  const loose = brute(prices, false);
  if (withoutCooldown(prices) === loose) freeTwoOk++;
  if (everyRise(prices) === loose) freeRiseOk++;
}

console.log(\`over \${TRIALS} random price series of 2 to 10 days, with the cooldown rule:\`);
console.log("  the three-mode machine   " + pad(threeOk, 6));
console.log("  the two-mode machine     " + pad(twoOk, 6));
console.log("  every upward step        " + pad(riseOk, 6));
console.log();
console.log("and the same series without the cooldown, which is what those two answer:");
console.log("  the two-mode machine     " + pad(freeTwoOk, 6));
console.log("  every upward step        " + pad(freeRiseOk, 6));
console.log();
console.log("so neither is wrong in itself. Both are exactly right about a different");
console.log(\`question, and both over-report on this one (\${twoOver} times for the two-mode\`);
console.log("machine), because they allow a trade the rules forbid. Adding a rule adds a");
console.log("mode; it does not adjust an existing answer.");
`,
            },
            {
              lang: "java",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.

public class Main {
    static final int NEG = -1000000000;

    // Three modes: holding, just sold (barred from buying), and free to buy.
    static int withCooldown(int[] prices) {
        int hold = NEG, sold = NEG, free = 0;
        for (int price : prices) {
            int nextHold = Math.max(hold, free - price);  // keep holding, or buy while free
            int nextSold = hold + price;                  // sell what is held
            int nextFree = Math.max(free, sold);          // stay free, or leave the cooldown
            hold = nextHold;
            sold = nextSold;
            free = nextFree;
        }
        return Math.max(Math.max(sold, free), 0);
    }

    // Two modes. The same machine with the cooldown mode removed.
    static int withoutCooldown(int[] prices) {
        int hold = NEG, free = 0;
        for (int price : prices) {
            int nextHold = Math.max(hold, free - price);
            int nextFree = Math.max(free, hold + price);
            hold = nextHold;
            free = nextFree;
        }
        return Math.max(free, 0);
    }

    // Add up every upward step. Optimal when nothing stops you re-buying.
    static int everyRise(int[] prices) {
        int total = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
        }
        return total;
    }

    // Every legal sequence of buys and sells, walked.
    static int brute(int[] prices, boolean cooldown) {
        return step(prices, cooldown, 0, false, false);
    }

    static int step(int[] prices, boolean cooldown, int day, boolean holding, boolean blocked) {
        if (day == prices.length) return 0;
        int best = step(prices, cooldown, day + 1, holding, false);  // do nothing today
        if (holding) {
            int gain = prices[day] + step(prices, cooldown, day + 1, false, cooldown);
            if (gain > best) best = gain;
        } else if (!blocked) {
            int gain = -prices[day] + step(prices, cooldown, day + 1, true, false);
            if (gain > best) best = gain;
        }
        return best;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    static String padEnd(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.append(' ');
        return sb.toString();
    }

    static String pad(Object v, int w) {
        StringBuilder sb = new StringBuilder(String.valueOf(v));
        while (sb.length() < w) sb.insert(0, ' ');
        return sb.toString();
    }

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        int[][] cases = {
            {1, 2, 3, 0, 2},
            {1, 2, 3, 4, 5},
            {5, 4, 3, 2, 1},
            {2, 1, 4, 5, 2, 9, 7},
            {3, 3, 3, 3},
        };

        System.out.println(padEnd("prices", 26) + pad("three modes", 13) + pad("two modes", 11)
            + pad("every rise", 12) + pad("every schedule", 16));
        for (int[] prices : cases) {
            System.out.println(padEnd(show(prices), 26) + pad(withCooldown(prices), 13)
                + pad(withoutCooldown(prices), 11) + pad(everyRise(prices), 12)
                + pad(brute(prices, true), 16));
        }
        System.out.println();

        int trials = 3000;
        int threeOk = 0, twoOk = 0, riseOk = 0, twoOver = 0, freeTwoOk = 0, freeRiseOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(9);
            int[] prices = new int[n];
            for (int i = 0; i < n; i++) prices[i] = 1 + rand(15);
            int truth = brute(prices, true);
            if (withCooldown(prices) == truth) threeOk++;
            int guess = withoutCooldown(prices);
            if (guess == truth) twoOk++;
            if (guess > truth) twoOver++;
            if (everyRise(prices) == truth) riseOk++;
            // And the same series under the rules the two-mode machine was written for.
            int loose = brute(prices, false);
            if (withoutCooldown(prices) == loose) freeTwoOk++;
            if (everyRise(prices) == loose) freeRiseOk++;
        }

        System.out.println("over " + trials + " random price series of 2 to 10 days, with the cooldown rule:");
        System.out.println("  the three-mode machine   " + pad(threeOk, 6));
        System.out.println("  the two-mode machine     " + pad(twoOk, 6));
        System.out.println("  every upward step        " + pad(riseOk, 6));
        System.out.println();
        System.out.println("and the same series without the cooldown, which is what those two answer:");
        System.out.println("  the two-mode machine     " + pad(freeTwoOk, 6));
        System.out.println("  every upward step        " + pad(freeRiseOk, 6));
        System.out.println();
        System.out.println("so neither is wrong in itself. Both are exactly right about a different");
        System.out.println("question, and both over-report on this one (" + twoOver + " times for the two-mode");
        System.out.println("machine), because they allow a trade the rules forbid. Adding a rule adds a");
        System.out.println("mode; it does not adjust an existing answer.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const int NEG = -1000000000;

// Three modes: holding, just sold (barred from buying), and free to buy.
int withCooldown(const std::vector<int> &prices) {
    int hold = NEG, sold = NEG, free = 0;
    for (int price : prices) {
        int nextHold = std::max(hold, free - price);  // keep holding, or buy while free
        int nextSold = hold + price;                  // sell what is held
        int nextFree = std::max(free, sold);          // stay free, or leave the cooldown
        hold = nextHold;
        sold = nextSold;
        free = nextFree;
    }
    return std::max(std::max(sold, free), 0);
}

// Two modes. The same machine with the cooldown mode removed.
int withoutCooldown(const std::vector<int> &prices) {
    int hold = NEG, free = 0;
    for (int price : prices) {
        int nextHold = std::max(hold, free - price);
        int nextFree = std::max(free, hold + price);
        hold = nextHold;
        free = nextFree;
    }
    return std::max(free, 0);
}

// Add up every upward step. Optimal when nothing stops you re-buying.
int everyRise(const std::vector<int> &prices) {
    int total = 0;
    for (size_t i = 1; i < prices.size(); i++) {
        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
    }
    return total;
}

int step(const std::vector<int> &prices, bool cooldown, size_t day, bool holding, bool blocked) {
    if (day == prices.size()) return 0;
    int best = step(prices, cooldown, day + 1, holding, false);  // do nothing today
    if (holding) {
        int gain = prices[day] + step(prices, cooldown, day + 1, false, cooldown);
        if (gain > best) best = gain;
    } else if (!blocked) {
        int gain = -prices[day] + step(prices, cooldown, day + 1, true, false);
        if (gain > best) best = gain;
    }
    return best;
}

// Every legal sequence of buys and sells, walked.
int brute(const std::vector<int> &prices, bool cooldown) {
    return step(prices, cooldown, 0, false, false);
}

std::string show(const std::vector<int> &values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) out += ", ";
        out += std::to_string(values[i]);
    }
    return out + "]";
}

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    const std::vector<std::vector<int>> cases = {
        {1, 2, 3, 0, 2},
        {1, 2, 3, 4, 5},
        {5, 4, 3, 2, 1},
        {2, 1, 4, 5, 2, 9, 7},
        {3, 3, 3, 3},
    };

    std::cout << std::left << std::setw(26) << "prices" << std::right << std::setw(13) << "three modes"
              << std::setw(11) << "two modes" << std::setw(12) << "every rise"
              << std::setw(16) << "every schedule" << "\\n";
    for (const auto &prices : cases) {
        std::cout << std::left << std::setw(26) << show(prices) << std::right
                  << std::setw(13) << withCooldown(prices) << std::setw(11) << withoutCooldown(prices)
                  << std::setw(12) << everyRise(prices) << std::setw(16) << brute(prices, true) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int threeOk = 0, twoOk = 0, riseOk = 0, twoOver = 0, freeTwoOk = 0, freeRiseOk = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(9);
        std::vector<int> prices(n);
        for (int i = 0; i < n; i++) prices[i] = 1 + rnd(15);
        int truth = brute(prices, true);
        if (withCooldown(prices) == truth) threeOk++;
        int guess = withoutCooldown(prices);
        if (guess == truth) twoOk++;
        if (guess > truth) twoOver++;
        if (everyRise(prices) == truth) riseOk++;
        // And the same series under the rules the two-mode machine was written for.
        int loose = brute(prices, false);
        if (withoutCooldown(prices) == loose) freeTwoOk++;
        if (everyRise(prices) == loose) freeRiseOk++;
    }

    std::cout << "over " << TRIALS << " random price series of 2 to 10 days, with the cooldown rule:\\n";
    std::cout << "  the three-mode machine   " << std::setw(6) << threeOk << "\\n";
    std::cout << "  the two-mode machine     " << std::setw(6) << twoOk << "\\n";
    std::cout << "  every upward step        " << std::setw(6) << riseOk << "\\n\\n";
    std::cout << "and the same series without the cooldown, which is what those two answer:\\n";
    std::cout << "  the two-mode machine     " << std::setw(6) << freeTwoOk << "\\n";
    std::cout << "  every upward step        " << std::setw(6) << freeRiseOk << "\\n\\n";
    std::cout << "so neither is wrong in itself. Both are exactly right about a different\\n";
    std::cout << "question, and both over-report on this one (" << twoOver << " times for the two-mode\\n";
    std::cout << "machine), because they allow a trade the rules forbid. Adding a rule adds a\\n";
    std::cout << "mode; it does not adjust an existing answer.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.

const NEG: i64 = -1000000000;

/// Three modes: holding, just sold (barred from buying), and free to buy.
fn with_cooldown(prices: &[i64]) -> i64 {
    let (mut hold, mut sold, mut free) = (NEG, NEG, 0);
    for &price in prices {
        let next_hold = hold.max(free - price); // keep holding, or buy while free
        let next_sold = hold + price; // sell what is held
        let next_free = free.max(sold); // stay free, or leave the cooldown
        hold = next_hold;
        sold = next_sold;
        free = next_free;
    }
    sold.max(free).max(0)
}

/// Two modes. The same machine with the cooldown mode removed.
fn without_cooldown(prices: &[i64]) -> i64 {
    let (mut hold, mut free) = (NEG, 0);
    for &price in prices {
        let next_hold = hold.max(free - price);
        let next_free = free.max(hold + price);
        hold = next_hold;
        free = next_free;
    }
    free.max(0)
}

/// Add up every upward step. Optimal when nothing stops you re-buying.
fn every_rise(prices: &[i64]) -> i64 {
    let mut total = 0;
    for i in 1..prices.len() {
        if prices[i] > prices[i - 1] {
            total += prices[i] - prices[i - 1];
        }
    }
    total
}

fn step(prices: &[i64], cooldown: bool, day: usize, holding: bool, blocked: bool) -> i64 {
    if day == prices.len() {
        return 0;
    }
    let mut best = step(prices, cooldown, day + 1, holding, false); // do nothing today
    if holding {
        let gain = prices[day] + step(prices, cooldown, day + 1, false, cooldown);
        if gain > best {
            best = gain;
        }
    } else if !blocked {
        let gain = -prices[day] + step(prices, cooldown, day + 1, true, false);
        if gain > best {
            best = gain;
        }
    }
    best
}

/// Every legal sequence of buys and sells, walked.
fn brute(prices: &[i64], cooldown: bool) -> i64 {
    step(prices, cooldown, 0, false, false)
}

fn show(values: &[i64]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let cases: Vec<Vec<i64>> = vec![
        vec![1, 2, 3, 0, 2],
        vec![1, 2, 3, 4, 5],
        vec![5, 4, 3, 2, 1],
        vec![2, 1, 4, 5, 2, 9, 7],
        vec![3, 3, 3, 3],
    ];

    println!(
        "{:<26}{:>13}{:>11}{:>12}{:>16}",
        "prices", "three modes", "two modes", "every rise", "every schedule"
    );
    for prices in &cases {
        println!(
            "{:<26}{:>13}{:>11}{:>12}{:>16}",
            show(prices),
            with_cooldown(prices),
            without_cooldown(prices),
            every_rise(prices),
            brute(prices, true)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut three_ok, mut two_ok, mut rise_ok, mut two_over) = (0, 0, 0, 0);
    let (mut free_two_ok, mut free_rise_ok) = (0, 0);
    for _ in 0..trials {
        let n = 2 + rng.next(9);
        let prices: Vec<i64> = (0..n).map(|_| 1 + rng.next(15)).collect();
        let truth = brute(&prices, true);
        if with_cooldown(&prices) == truth {
            three_ok += 1;
        }
        let guess = without_cooldown(&prices);
        if guess == truth {
            two_ok += 1;
        }
        if guess > truth {
            two_over += 1;
        }
        if every_rise(&prices) == truth {
            rise_ok += 1;
        }
        // And the same series under the rules the two-mode machine was written for.
        let loose = brute(&prices, false);
        if without_cooldown(&prices) == loose {
            free_two_ok += 1;
        }
        if every_rise(&prices) == loose {
            free_rise_ok += 1;
        }
    }

    println!("over {} random price series of 2 to 10 days, with the cooldown rule:", trials);
    println!("  the three-mode machine   {:>6}", three_ok);
    println!("  the two-mode machine     {:>6}", two_ok);
    println!("  every upward step        {:>6}", rise_ok);
    println!();
    println!("and the same series without the cooldown, which is what those two answer:");
    println!("  the two-mode machine     {:>6}", free_two_ok);
    println!("  every upward step        {:>6}", free_rise_ok);
    println!();
    println!("so neither is wrong in itself. Both are exactly right about a different");
    println!("question, and both over-report on this one ({} times for the two-mode", two_over);
    println!("machine), because they allow a trade the rules forbid. Adding a rule adds a");
    println!("mode; it does not adjust an existing answer.");
}
`,
            },
            {
              lang: "go",
              code: `// State-machine dynamic programming: the state is which mode you are in, and
// the transition is the set of legal moves between modes.
//
// Buying and selling a share, with two rule sets. Without a cooldown there are
// two modes -- holding and not holding -- and the answer also falls out of a
// greedy: take every upward step. Add "you may not buy on the day after you
// sell" and a third mode appears, the greedy stops being right, and nothing else
// about the method changes.
//
//   free  --buy-->  hold  --sell-->  sold  --wait-->  free
//
// The whole design is that picture. Once the modes and the arrows are written
// down, the recurrence is one line per mode.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

const neg = -1000000000

func larger(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// withCooldown has three modes: holding, just sold (barred from buying), and free to buy.
func withCooldown(prices []int) int {
	hold, sold, free := neg, neg, 0
	for _, price := range prices {
		nextHold := larger(hold, free-price) // keep holding, or buy while free
		nextSold := hold + price             // sell what is held
		nextFree := larger(free, sold)       // stay free, or leave the cooldown
		hold, sold, free = nextHold, nextSold, nextFree
	}
	return larger(larger(sold, free), 0)
}

// withoutCooldown is the same machine with the cooldown mode removed.
func withoutCooldown(prices []int) int {
	hold, free := neg, 0
	for _, price := range prices {
		nextHold := larger(hold, free-price)
		nextFree := larger(free, hold+price)
		hold, free = nextHold, nextFree
	}
	return larger(free, 0)
}

// everyRise adds up every upward step. Optimal when nothing stops you re-buying.
func everyRise(prices []int) int {
	total := 0
	for i := 1; i < len(prices); i++ {
		if prices[i] > prices[i-1] {
			total += prices[i] - prices[i-1]
		}
	}
	return total
}

// brute walks every legal sequence of buys and sells.
func brute(prices []int, cooldown bool) int {
	n := len(prices)
	var step func(day int, holding, blocked bool) int
	step = func(day int, holding, blocked bool) int {
		if day == n {
			return 0
		}
		best := step(day+1, holding, false) // do nothing today
		if holding {
			if gain := prices[day] + step(day+1, false, cooldown); gain > best {
				best = gain
			}
		} else if !blocked {
			if gain := -prices[day] + step(day+1, true, false); gain > best {
				best = gain
			}
		}
		return best
	}
	return step(0, false, false)
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]int{
		{1, 2, 3, 0, 2},
		{1, 2, 3, 4, 5},
		{5, 4, 3, 2, 1},
		{2, 1, 4, 5, 2, 9, 7},
		{3, 3, 3, 3},
	}

	fmt.Printf("%-26s%13s%11s%12s%16s\\n", "prices", "three modes", "two modes", "every rise",
		"every schedule")
	for _, prices := range cases {
		fmt.Printf("%-26s%13d%11d%12d%16d\\n", show(prices), withCooldown(prices),
			withoutCooldown(prices), everyRise(prices), brute(prices, true))
	}
	fmt.Println()

	trials := 3000
	threeOk, twoOk, riseOk, twoOver, freeTwoOk, freeRiseOk := 0, 0, 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(9)
		prices := make([]int, n)
		for i := range prices {
			prices[i] = 1 + rand(15)
		}
		truth := brute(prices, true)
		if withCooldown(prices) == truth {
			threeOk++
		}
		guess := withoutCooldown(prices)
		if guess == truth {
			twoOk++
		}
		if guess > truth {
			twoOver++
		}
		if everyRise(prices) == truth {
			riseOk++
		}
		// And the same series under the rules the two-mode machine was written for.
		loose := brute(prices, false)
		if withoutCooldown(prices) == loose {
			freeTwoOk++
		}
		if everyRise(prices) == loose {
			freeRiseOk++
		}
	}

	fmt.Printf("over %d random price series of 2 to 10 days, with the cooldown rule:\\n", trials)
	fmt.Printf("  the three-mode machine   %6d\\n", threeOk)
	fmt.Printf("  the two-mode machine     %6d\\n", twoOk)
	fmt.Printf("  every upward step        %6d\\n", riseOk)
	fmt.Println()
	fmt.Println("and the same series without the cooldown, which is what those two answer:")
	fmt.Printf("  the two-mode machine     %6d\\n", freeTwoOk)
	fmt.Printf("  every upward step        %6d\\n", freeRiseOk)
	fmt.Println()
	fmt.Println("so neither is wrong in itself. Both are exactly right about a different")
	fmt.Printf("question, and both over-report on this one (%d times for the two-mode\\n", twoOver)
	fmt.Println("machine), because they allow a trade the rules forbid. Adding a rule adds a")
	fmt.Println("mode; it does not adjust an existing answer.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A new rule means a new mode, not a patched formula",
          body: "Adding the cooldown does not adjust the two-mode answer, it adds a mode between selling and buying again. Trying to correct the old recurrence in place is how these problems get subtly wrong; drawing the modes and the arrows first makes the code mechanical.",
        },
        {
          title: "An algorithm that is right about the wrong problem still runs",
          body: "The two-mode machine and the sum of upward steps are both exactly correct without the cooldown, and both over-report with it, on 1,249 of 3,000 series. Before deciding an implementation is buggy, check which question it actually answers \u2014 that is often the faster route to the fix.",
        },
      ],
    },
    {
      id: "the-whole-catalogue",
      heading: "The whole catalogue, and what to do when nothing fits",
      body: [
        "That closes the module, so here is the whole catalogue in one place. Every one of these is module 27's method \u2014 find the state, find the transition, check the two preconditions, decide where the answer lives \u2014 with a different answer to the first question.",
        "**A prefix and a budget**: knapsack and subset sum, lessons 1 and 2. Pseudo-polynomial, because the table is indexed by a value.",
        "**A prefix of each of two sequences**: the string-pair grid, lesson 3. Genuinely polynomial, because both axes are lengths.",
        "**An index that names an ending**: longest increasing subsequence, lesson 4, and the sorted reductions that feed it.",
        "**A position, sometimes plus a resource**: grids, lesson 5, where the movement rule decides whether a fill order exists at all.",
        "**A contiguous range**: intervals, lesson 6, where the transition is a split and the fill order goes shortest first.",
        "**A node, sometimes plus a flag**: trees, lesson 7, where the structure is the schedule and rerooting answers every node at once.",
        "**A set, a digit position, or a mode**: this lesson.",
        "If a new problem does not fit any of those, the useful move is not to search the list harder. It is to go back to module 27 and ask what a subproblem is, whether its answer is enough to decide the next step, and whether the same subproblem really does come up more than once. The catalogue is a shortcut for problems you have seen before; the method is what handles the ones you have not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use a bitmask for the state, and what are the limits?",
      answer:
        "When a subproblem is \"which of these n things have I already dealt with\" and n is small \u2014 about twenty. The subset lives in the bits of an integer, so the table is a plain array, and numeric order over the masks is automatically a valid fill order, because adding an element only ever makes the integer larger. For a travelling salesman tour the state has to be the set **and** the current position, since the price of the next edge depends on where you stand; dropping the position gives a table that computes a minimum spanning tree instead, which on 3,000 random maps was strictly below the true tour every time. The cost is `2^n * n` states against `(n-1)!` tours \u2014 around 21 million versus 1.2 * 10^17 at twenty cities \u2014 so it is exponential but usable up to about twenty, and beyond that the honest answer is a different approach.",
    },
    {
      question: "How do you count the numbers up to 10^18 with some digit property?",
      answer:
        "Digit DP: the state is a position in the decimal expansion plus whatever the property needs to remember, so the table is a few hundred entries rather than 10^18. Two flags carry the whole difficulty. `tight` says whether the digits chosen so far are exactly the limit's, which caps the next digit; without it the count is for all numbers of that length and overshoots \u2014 measured, wrong on 2,989 of 3,000 random limits. `started` says whether a non-zero digit has appeared yet, so that the leading zeros padding a shorter number are not treated as real digits; without it, a property about adjacent digits sees the padding zeros as a clash and undercounts, wrong on 2,994 of 3,000. With both, counting \"no two adjacent digits equal\" up to a million million gives 317,733,228,541 in 124 states.",
    },
    {
      question: "What does it mean to model a DP as a state machine?",
      answer:
        "The state is which mode you are in and the transition is the arrows between modes, so the design work is drawing the diagram rather than writing the recurrence. Stock trading is the clean example: without restrictions there are two modes, holding and not holding. Add a one-day cooldown after selling and a third mode appears \u2014 just sold, barred from buying \u2014 with one arrow in and one out, and the recurrence is again one line per mode. What that framing buys you is that a new rule adds a node instead of complicating an expression, so at most k transactions, a fee, or a longer cooldown are each a small extension rather than a rewrite. It also makes clear that the two-mode version is not buggy: it is exactly right about the problem without the cooldown, and over-reports on the one with it, on 1,249 of 3,000 random series.",
    },
    {
      question: "You are given a problem that does not match any pattern you know. What do you do?",
      answer:
        "Go back to the method rather than searching the catalogue harder. Ask what a subproblem is, and write down precisely what one cell means. Ask whether that cell's value is enough to decide the next step \u2014 if not, the state is missing something, which is the single most common failure and the thread running through half these lessons: the ending in the longest increasing subsequence, the flag on a tree node, the position in a tour. Ask whether the same subproblem genuinely recurs, since if it does not, dynamic programming buys nothing over plain recursion. Then work out a fill order and check it is topological, and decide where the answer is read from before assuming it is the last cell. And write the brute force first: every measurement in this module came from scoring a table against an enumeration, and that habit has caught more mistakes than reading the recurrence ever did.",
    },
  ],
  takeaways: [
    "A state can be a set, a digit position or a mode \u2014 it does not have to be an index.",
    "Bitmask tables fill in plain numeric order, because adding an element only ever makes the integer larger.",
    "A tour needs the set *and* the position; without the position the table computes a spanning tree, below the true tour on all 3,000 maps.",
    "`2^n * n` states against `(n-1)!` tours makes twenty cities feasible and thirty not.",
    "Digit DP needs `tight` and `started`: dropping them overcounts and undercounts respectively, and both still return plausible numbers.",
    "Counting up to 10^12 took 124 states rather than 10^12 numbers.",
    "A new rule adds a mode rather than patching a formula: the cooldown turns two modes into three.",
    "The two-mode machine is not broken \u2014 it is exact for the problem without the cooldown and over-reports on the one with it, 1,249 times out of 3,000.",
    "When nothing in the catalogue fits, go back to the method: what is a subproblem, is its answer enough, does it recur, what order, and where is the answer.",
  ],
  status: "available",
};
