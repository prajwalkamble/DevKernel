import type { Lesson } from "@/content/types";

export const dpOnTreesLesson: Lesson = {
  id: "dsa-dp-on-trees",
  slug: "dp-on-trees",
  moduleSlug: "dynamic-programming-patterns",
  title: "DP on Trees, and Rerooting",
  summary:
    "Dynamic programming where the table is the tree itself. Why one value per node is usually not enough, why the answer to a path question is a maximum over every node rather than the root's value, and rerooting \u2014 the two-pass technique that answers \"for every node\" in linear time instead of quadratic.",
  estimatedMinutes: 45,
  objectives: [
    "Use the tree's own structure as the fill order, without recursion",
    "Decide how many values per node the parent actually needs",
    "Combine at every node and keep the answer globally when the question is about a path",
    "Turn an \"answer at every node\" question into two linear passes",
  ],
  sections: [
    {
      id: "the-tree-is-the-table",
      heading: "The tree is the table, and the state is a node and a flag",
      body: [
        "Every table so far has been an array you allocated. On a tree the table is the tree \u2014 one entry per node, filled in an order the structure already gives you. That changes almost nothing about the method and quite a lot about how the code looks, so it is worth being explicit about both halves.",
        "The order first, because it is the part that looks like magic and is not. A tree has no cycles, so \"children before parents\" is always a valid fill order and always exists \u2014 the thing lesson 5 had to check and lesson 6 had to be careful about is free here. The examples in this lesson represent a tree as a parent array with `parent[0] = -1` and `parent[i] < i`, which makes that order literally a backwards loop over the indices. No recursion, no stack, no separate ordering pass.",
        "The state second. The problem is the maximum-weight independent set: choose nodes with no two adjacent, maximising total weight. The obvious state \u2014 one number per node, \"the best this subtree can do\" \u2014 fails the second precondition from module 27 for the same reason lesson 4's `best(i)` did. It does not say whether the subtree's own root was used, and that is precisely what the parent needs to know before deciding about itself.",
        "So the state is a node **and a flag**: `take[v]`, the best for `v`'s subtree with `v` chosen, and `skip[v]`, the best with `v` not chosen. A child folds into its parent in one line each: taking the parent forbids the child, so it contributes `skip[child]`; skipping the parent leaves the child free, so it contributes the better of the child's two.",
        "The example runs that against every subset on trees small enough to enumerate \u2014 3,000 out of 3,000 \u2014 alongside two things that nearly work. Dropping one of those two contributions is right on 224 of 3,000, and always *too small*: removing a branch from a maximisation cannot invent a better set, only fail to find one. That is the opposite signature to lesson 6's balloon table, which over-claimed because its halves were not independent. Which side of the truth a wrong answer falls on tells you which kind of mistake you made.",
        "And greedy \u2014 take the heaviest available node, block its neighbours, repeat \u2014 is right 2,324 times out of 3,000. Which is exactly the trap this whole module keeps returning to: 77 percent is far too high to notice by hand and far too low to ship.",
      ],
      examples: [
        {
          id: "two-values-per-node",
          title: "Independent set on a tree, against every subset",
          lang: "python",
          code: `# Dynamic programming on a tree, where the state is a node and the table is the
# tree itself.
#
# The problem is the maximum-weight independent set: choose a set of nodes with
# no two adjacent, maximising total weight. One value per node is not enough --
# knowing the best a subtree can do says nothing about whether its root was
# used, and that is exactly what the parent needs to know. So the state is a
# node *and a flag*, which is the tree version of lesson 4's "put the ending
# into the state".
#
# Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
# iterating i from the last node down to 0 always finishes a node's children
# before the node itself. No recursion and no explicit ordering pass.


def two_state(parent, weight):
    n = len(parent)
    take = list(weight)
    skip = [0] * n
    for v in range(n - 1, 0, -1):
        p = parent[v]
        take[p] += skip[v]              # taking p forbids v
        skip[p] += max(take[v], skip[v])  # skipping p leaves v free
    return max(take[0], skip[0])


def forgetful(parent, weight):
    """The same table, minus one choice: skipping p also skips v."""
    n = len(parent)
    take = list(weight)
    skip = [0] * n
    for v in range(n - 1, 0, -1):
        p = parent[v]
        take[p] += skip[v]
        skip[p] += skip[v]
    return max(take[0], skip[0])


def greedy(parent, weight):
    """Repeatedly take the heaviest node still available, then block its neighbours."""
    n = len(parent)
    neighbours = [[] for _ in range(n)]
    for v in range(1, n):
        neighbours[v].append(parent[v])
        neighbours[parent[v]].append(v)
    blocked = [False] * n
    used = [False] * n
    total = 0
    for _ in range(n):
        best = -1
        for v in range(n):
            if not blocked[v] and not used[v] and (best < 0 or weight[v] > weight[best]):
                best = v
        if best < 0:
            break
        total += weight[best]
        used[best] = True
        for u in neighbours[best]:
            blocked[u] = True
    return total


def brute(parent, weight):
    """Every subset, kept if no chosen node is the parent of another."""
    n = len(parent)
    best = 0
    for mask in range(1 << n):
        ok = True
        total = 0
        for v in range(n):
            if mask >> v & 1:
                total += weight[v]
                if v > 0 and mask >> parent[v] & 1:
                    ok = False
        if ok and total > best:
            best = total
    return best


def show(parent):
    return "[" + ", ".join(str(p) for p in parent) + "]"


CASES = [
    ([-1, 0, 0], [3, 2, 2]),
    ([-1, 0, 1, 2], [3, 1, 1, 3]),
    ([-1, 0, 0, 1, 1], [1, 5, 1, 1, 1]),
    ([-1, 0, 1, 1, 0], [4, 1, 2, 2, 4]),
    ([-1, 0, 1, 2, 3, 4], [1, 2, 3, 4, 5, 6]),
]

print(f"{'parents':<24}{'weights':<22}{'two states':>12}{'a lost choice':>15}{'greedy':>8}{'every subset':>14}")
for parent, weight in CASES:
    print(f"{show(parent):<24}{show(weight):<22}{two_state(parent, weight):>12}"
          f"{forgetful(parent, weight):>15}{greedy(parent, weight):>8}{brute(parent, weight):>14}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
two_ok = 0
forget_ok = 0
forget_under = 0
greedy_ok = 0
for _ in range(TRIALS):
    n = 2 + rand(9)
    parent = [-1] + [rand(v) for v in range(1, n)]
    weight = [1 + rand(9) for _ in range(n)]
    truth = brute(parent, weight)
    if two_state(parent, weight) == truth:
        two_ok += 1
    guess = forgetful(parent, weight)
    if guess == truth:
        forget_ok += 1
    if guess < truth:
        forget_under += 1
    if greedy(parent, weight) == truth:
        greedy_ok += 1

print(f"over {TRIALS} random trees of 2 to 10 nodes, against every subset:")
print(f"  a node and a flag                  {two_ok:>6}")
print(f"  the same table, minus one choice   {forget_ok:>6}")
print(f"  heaviest available node first      {greedy_ok:>6}")
print()
print(f"the second one was too small on {forget_under} of them and never too large: dropping")
print("a branch from a maximisation cannot invent a better set, it can only fail to")
print("find one. That is the opposite signature to lesson 6's balloon table, which")
print("over-claimed because its two halves were not independent -- an answer that is")
print("always on one side of the truth tells you which kind of mistake you made.")
`,
          output: `parents                 weights                 two states  a lost choice  greedy  every subset
[-1, 0, 0]              [3, 2, 2]                        4              3       3             4
[-1, 0, 1, 2]           [3, 1, 1, 3]                     6              3       6             6
[-1, 0, 0, 1, 1]        [1, 5, 1, 1, 1]                  6              1       6             6
[-1, 0, 1, 1, 0]        [4, 1, 2, 2, 4]                  8              4       8             8
[-1, 0, 1, 2, 3, 4]     [1, 2, 3, 4, 5, 6]              12              1      12            12

over 3000 random trees of 2 to 10 nodes, against every subset:
  a node and a flag                    3000
  the same table, minus one choice      224
  heaviest available node first        2324

the second one was too small on 2776 of them and never too large: dropping
a branch from a maximisation cannot invent a better set, it can only fail to
find one. That is the opposite signature to lesson 6's balloon table, which
over-claimed because its two halves were not independent -- an answer that is
always on one side of the truth tells you which kind of mistake you made.`,
          explanation:
            "The two-state table against every subset, alongside a version with one of the two contributions dropped and a greedy. The dropped-contribution version is never too large, which is the signature of a maximisation that lost an option rather than one that broke a constraint.",
          alternates: [
            {
              lang: "javascript",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.

function twoState(parent, weight) {
  const n = parent.length;
  const take = [...weight];
  const skip = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    take[p] += skip[v]; // taking p forbids v
    skip[p] += Math.max(take[v], skip[v]); // skipping p leaves v free
  }
  return Math.max(take[0], skip[0]);
}

/** The same table, minus one choice: skipping p also skips v. */
function forgetful(parent, weight) {
  const n = parent.length;
  const take = [...weight];
  const skip = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    take[p] += skip[v];
    skip[p] += skip[v];
  }
  return Math.max(take[0], skip[0]);
}

/** Repeatedly take the heaviest node still available, then block its neighbours. */
function greedy(parent, weight) {
  const n = parent.length;
  const neighbours = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  const blocked = new Array(n).fill(false);
  const used = new Array(n).fill(false);
  let total = 0;
  for (let round = 0; round < n; round++) {
    let best = -1;
    for (let v = 0; v < n; v++) {
      if (!blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best])) best = v;
    }
    if (best < 0) break;
    total += weight[best];
    used[best] = true;
    for (const u of neighbours[best]) blocked[u] = true;
  }
  return total;
}

/** Every subset, kept if no chosen node is the parent of another. */
function brute(parent, weight) {
  const n = parent.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    let total = 0;
    for (let v = 0; v < n; v++) {
      if ((mask >> v) & 1) {
        total += weight[v];
        if (v > 0 && (mask >> parent[v]) & 1) ok = false;
      }
    }
    if (ok && total > best) best = total;
  }
  return best;
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
  [[-1, 0, 0], [3, 2, 2]],
  [[-1, 0, 1, 2], [3, 1, 1, 3]],
  [[-1, 0, 0, 1, 1], [1, 5, 1, 1, 1]],
  [[-1, 0, 1, 1, 0], [4, 1, 2, 2, 4]],
  [[-1, 0, 1, 2, 3, 4], [1, 2, 3, 4, 5, 6]],
];

console.log(
  padEnd("parents", 24) + padEnd("weights", 22) + pad("two states", 12) +
    pad("a lost choice", 15) + pad("greedy", 8) + pad("every subset", 14)
);
for (const [parent, weight] of CASES) {
  console.log(
    padEnd(show(parent), 24) + padEnd(show(weight), 22) + pad(twoState(parent, weight), 12) +
      pad(forgetful(parent, weight), 15) + pad(greedy(parent, weight), 8) + pad(brute(parent, weight), 14)
  );
}
console.log();

const TRIALS = 3000;
let twoOk = 0;
let forgetOk = 0;
let forgetUnder = 0;
let greedyOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const weight = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(parent, weight);
  if (twoState(parent, weight) === truth) twoOk++;
  const guess = forgetful(parent, weight);
  if (guess === truth) forgetOk++;
  if (guess < truth) forgetUnder++;
  if (greedy(parent, weight) === truth) greedyOk++;
}

console.log(\`over \${TRIALS} random trees of 2 to 10 nodes, against every subset:\`);
console.log("  a node and a flag                  " + pad(twoOk, 6));
console.log("  the same table, minus one choice   " + pad(forgetOk, 6));
console.log("  heaviest available node first      " + pad(greedyOk, 6));
console.log();
console.log(\`the second one was too small on \${forgetUnder} of them and never too large: dropping\`);
console.log("a branch from a maximisation cannot invent a better set, it can only fail to");
console.log("find one. That is the opposite signature to lesson 6's balloon table, which");
console.log("over-claimed because its two halves were not independent -- an answer that is");
console.log("always on one side of the truth tells you which kind of mistake you made.");
`,
            },
            {
              lang: "typescript",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.

function twoState(parent: number[], weight: number[]): number {
  const n = parent.length;
  const take = [...weight];
  const skip = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    take[p] += skip[v]; // taking p forbids v
    skip[p] += Math.max(take[v], skip[v]); // skipping p leaves v free
  }
  return Math.max(take[0], skip[0]);
}

/** The same table, minus one choice: skipping p also skips v. */
function forgetful(parent: number[], weight: number[]): number {
  const n = parent.length;
  const take = [...weight];
  const skip = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    take[p] += skip[v];
    skip[p] += skip[v];
  }
  return Math.max(take[0], skip[0]);
}

/** Repeatedly take the heaviest node still available, then block its neighbours. */
function greedy(parent: number[], weight: number[]): number {
  const n = parent.length;
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  const blocked = new Array(n).fill(false);
  const used = new Array(n).fill(false);
  let total = 0;
  for (let round = 0; round < n; round++) {
    let best = -1;
    for (let v = 0; v < n; v++) {
      if (!blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best])) best = v;
    }
    if (best < 0) break;
    total += weight[best];
    used[best] = true;
    for (const u of neighbours[best]) blocked[u] = true;
  }
  return total;
}

/** Every subset, kept if no chosen node is the parent of another. */
function brute(parent: number[], weight: number[]): number {
  const n = parent.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    let total = 0;
    for (let v = 0; v < n; v++) {
      if ((mask >> v) & 1) {
        total += weight[v];
        if (v > 0 && (mask >> parent[v]) & 1) ok = false;
      }
    }
    if (ok && total > best) best = total;
  }
  return best;
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

const CASES: [number[], number[]][] = [
  [[-1, 0, 0], [3, 2, 2]],
  [[-1, 0, 1, 2], [3, 1, 1, 3]],
  [[-1, 0, 0, 1, 1], [1, 5, 1, 1, 1]],
  [[-1, 0, 1, 1, 0], [4, 1, 2, 2, 4]],
  [[-1, 0, 1, 2, 3, 4], [1, 2, 3, 4, 5, 6]],
];

console.log(
  padEnd("parents", 24) + padEnd("weights", 22) + pad("two states", 12) +
    pad("a lost choice", 15) + pad("greedy", 8) + pad("every subset", 14)
);
for (const [parent, weight] of CASES) {
  console.log(
    padEnd(show(parent), 24) + padEnd(show(weight), 22) + pad(twoState(parent, weight), 12) +
      pad(forgetful(parent, weight), 15) + pad(greedy(parent, weight), 8) + pad(brute(parent, weight), 14)
  );
}
console.log();

const TRIALS = 3000;
let twoOk = 0;
let forgetOk = 0;
let forgetUnder = 0;
let greedyOk = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(9);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const weight = Array.from({ length: n }, () => 1 + rand(9));
  const truth = brute(parent, weight);
  if (twoState(parent, weight) === truth) twoOk++;
  const guess = forgetful(parent, weight);
  if (guess === truth) forgetOk++;
  if (guess < truth) forgetUnder++;
  if (greedy(parent, weight) === truth) greedyOk++;
}

console.log(\`over \${TRIALS} random trees of 2 to 10 nodes, against every subset:\`);
console.log("  a node and a flag                  " + pad(twoOk, 6));
console.log("  the same table, minus one choice   " + pad(forgetOk, 6));
console.log("  heaviest available node first      " + pad(greedyOk, 6));
console.log();
console.log(\`the second one was too small on \${forgetUnder} of them and never too large: dropping\`);
console.log("a branch from a maximisation cannot invent a better set, it can only fail to");
console.log("find one. That is the opposite signature to lesson 6's balloon table, which");
console.log("over-claimed because its two halves were not independent -- an answer that is");
console.log("always on one side of the truth tells you which kind of mistake you made.");
`,
            },
            {
              lang: "java",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.
import java.util.ArrayList;
import java.util.List;

public class Main {
    static int twoState(int[] parent, int[] weight) {
        int n = parent.length;
        int[] take = weight.clone();
        int[] skip = new int[n];
        for (int v = n - 1; v > 0; v--) {
            int p = parent[v];
            take[p] += skip[v];                          // taking p forbids v
            skip[p] += Math.max(take[v], skip[v]);       // skipping p leaves v free
        }
        return Math.max(take[0], skip[0]);
    }

    // The same table, minus one choice: skipping p also skips v.
    static int forgetful(int[] parent, int[] weight) {
        int n = parent.length;
        int[] take = weight.clone();
        int[] skip = new int[n];
        for (int v = n - 1; v > 0; v--) {
            int p = parent[v];
            take[p] += skip[v];
            skip[p] += skip[v];
        }
        return Math.max(take[0], skip[0]);
    }

    // Repeatedly take the heaviest node still available, then block its neighbours.
    static int greedy(int[] parent, int[] weight) {
        int n = parent.length;
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int v = 0; v < n; v++) neighbours.add(new ArrayList<>());
        for (int v = 1; v < n; v++) {
            neighbours.get(v).add(parent[v]);
            neighbours.get(parent[v]).add(v);
        }
        boolean[] blocked = new boolean[n];
        boolean[] used = new boolean[n];
        int total = 0;
        for (int round = 0; round < n; round++) {
            int best = -1;
            for (int v = 0; v < n; v++) {
                if (!blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best])) best = v;
            }
            if (best < 0) break;
            total += weight[best];
            used[best] = true;
            for (int u : neighbours.get(best)) blocked[u] = true;
        }
        return total;
    }

    // Every subset, kept if no chosen node is the parent of another.
    static int brute(int[] parent, int[] weight) {
        int n = parent.length;
        int best = 0;
        for (int mask = 0; mask < 1 << n; mask++) {
            boolean ok = true;
            int total = 0;
            for (int v = 0; v < n; v++) {
                if ((mask >> v & 1) == 1) {
                    total += weight[v];
                    if (v > 0 && (mask >> parent[v] & 1) == 1) ok = false;
                }
            }
            if (ok && total > best) best = total;
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
        int[][] parents = {
            {-1, 0, 0},
            {-1, 0, 1, 2},
            {-1, 0, 0, 1, 1},
            {-1, 0, 1, 1, 0},
            {-1, 0, 1, 2, 3, 4},
        };
        int[][] weights = {
            {3, 2, 2},
            {3, 1, 1, 3},
            {1, 5, 1, 1, 1},
            {4, 1, 2, 2, 4},
            {1, 2, 3, 4, 5, 6},
        };

        System.out.println(padEnd("parents", 24) + padEnd("weights", 22) + pad("two states", 12)
            + pad("a lost choice", 15) + pad("greedy", 8) + pad("every subset", 14));
        for (int c = 0; c < parents.length; c++) {
            int[] parent = parents[c];
            int[] weight = weights[c];
            System.out.println(padEnd(show(parent), 24) + padEnd(show(weight), 22)
                + pad(twoState(parent, weight), 12) + pad(forgetful(parent, weight), 15)
                + pad(greedy(parent, weight), 8) + pad(brute(parent, weight), 14));
        }
        System.out.println();

        int trials = 3000;
        int twoOk = 0, forgetOk = 0, forgetUnder = 0, greedyOk = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(9);
            int[] parent = new int[n];
            parent[0] = -1;
            for (int v = 1; v < n; v++) parent[v] = rand(v);
            int[] weight = new int[n];
            for (int v = 0; v < n; v++) weight[v] = 1 + rand(9);
            int truth = brute(parent, weight);
            if (twoState(parent, weight) == truth) twoOk++;
            int guess = forgetful(parent, weight);
            if (guess == truth) forgetOk++;
            if (guess < truth) forgetUnder++;
            if (greedy(parent, weight) == truth) greedyOk++;
        }

        System.out.println("over " + trials + " random trees of 2 to 10 nodes, against every subset:");
        System.out.println("  a node and a flag                  " + pad(twoOk, 6));
        System.out.println("  the same table, minus one choice   " + pad(forgetOk, 6));
        System.out.println("  heaviest available node first      " + pad(greedyOk, 6));
        System.out.println();
        System.out.println("the second one was too small on " + forgetUnder
            + " of them and never too large: dropping");
        System.out.println("a branch from a maximisation cannot invent a better set, it can only fail to");
        System.out.println("find one. That is the opposite signature to lesson 6's balloon table, which");
        System.out.println("over-claimed because its two halves were not independent -- an answer that is");
        System.out.println("always on one side of the truth tells you which kind of mistake you made.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.
#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

int twoState(const std::vector<int> &parent, const std::vector<int> &weight) {
    int n = static_cast<int>(parent.size());
    std::vector<int> take = weight;
    std::vector<int> skip(n, 0);
    for (int v = n - 1; v > 0; v--) {
        int p = parent[v];
        take[p] += skip[v];                          // taking p forbids v
        skip[p] += std::max(take[v], skip[v]);       // skipping p leaves v free
    }
    return std::max(take[0], skip[0]);
}

// The same table, minus one choice: skipping p also skips v.
int forgetful(const std::vector<int> &parent, const std::vector<int> &weight) {
    int n = static_cast<int>(parent.size());
    std::vector<int> take = weight;
    std::vector<int> skip(n, 0);
    for (int v = n - 1; v > 0; v--) {
        int p = parent[v];
        take[p] += skip[v];
        skip[p] += skip[v];
    }
    return std::max(take[0], skip[0]);
}

// Repeatedly take the heaviest node still available, then block its neighbours.
int greedy(const std::vector<int> &parent, const std::vector<int> &weight) {
    int n = static_cast<int>(parent.size());
    std::vector<std::vector<int>> neighbours(n);
    for (int v = 1; v < n; v++) {
        neighbours[v].push_back(parent[v]);
        neighbours[parent[v]].push_back(v);
    }
    std::vector<bool> blocked(n, false), used(n, false);
    int total = 0;
    for (int round = 0; round < n; round++) {
        int best = -1;
        for (int v = 0; v < n; v++) {
            if (!blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best])) best = v;
        }
        if (best < 0) break;
        total += weight[best];
        used[best] = true;
        for (int u : neighbours[best]) blocked[u] = true;
    }
    return total;
}

// Every subset, kept if no chosen node is the parent of another.
int brute(const std::vector<int> &parent, const std::vector<int> &weight) {
    int n = static_cast<int>(parent.size());
    int best = 0;
    for (int mask = 0; mask < 1 << n; mask++) {
        bool ok = true;
        int total = 0;
        for (int v = 0; v < n; v++) {
            if (mask >> v & 1) {
                total += weight[v];
                if (v > 0 && (mask >> parent[v] & 1)) ok = false;
            }
        }
        if (ok && total > best) best = total;
    }
    return best;
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
    const std::vector<std::vector<int>> parents = {
        {-1, 0, 0},
        {-1, 0, 1, 2},
        {-1, 0, 0, 1, 1},
        {-1, 0, 1, 1, 0},
        {-1, 0, 1, 2, 3, 4},
    };
    const std::vector<std::vector<int>> weights = {
        {3, 2, 2},
        {3, 1, 1, 3},
        {1, 5, 1, 1, 1},
        {4, 1, 2, 2, 4},
        {1, 2, 3, 4, 5, 6},
    };

    std::cout << std::left << std::setw(24) << "parents" << std::setw(22) << "weights"
              << std::right << std::setw(12) << "two states" << std::setw(15) << "a lost choice"
              << std::setw(8) << "greedy" << std::setw(14) << "every subset" << "\\n";
    for (size_t c = 0; c < parents.size(); c++) {
        const auto &parent = parents[c];
        const auto &weight = weights[c];
        std::cout << std::left << std::setw(24) << show(parent) << std::setw(22) << show(weight)
                  << std::right << std::setw(12) << twoState(parent, weight)
                  << std::setw(15) << forgetful(parent, weight) << std::setw(8) << greedy(parent, weight)
                  << std::setw(14) << brute(parent, weight) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int twoOk = 0, forgetOk = 0, forgetUnder = 0, greedyOk = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(9);
        std::vector<int> parent(n);
        parent[0] = -1;
        for (int v = 1; v < n; v++) parent[v] = rnd(v);
        std::vector<int> weight(n);
        for (int v = 0; v < n; v++) weight[v] = 1 + rnd(9);
        int truth = brute(parent, weight);
        if (twoState(parent, weight) == truth) twoOk++;
        int guess = forgetful(parent, weight);
        if (guess == truth) forgetOk++;
        if (guess < truth) forgetUnder++;
        if (greedy(parent, weight) == truth) greedyOk++;
    }

    std::cout << "over " << TRIALS << " random trees of 2 to 10 nodes, against every subset:\\n";
    std::cout << "  a node and a flag                  " << std::setw(6) << twoOk << "\\n";
    std::cout << "  the same table, minus one choice   " << std::setw(6) << forgetOk << "\\n";
    std::cout << "  heaviest available node first      " << std::setw(6) << greedyOk << "\\n\\n";
    std::cout << "the second one was too small on " << forgetUnder
              << " of them and never too large: dropping\\n";
    std::cout << "a branch from a maximisation cannot invent a better set, it can only fail to\\n";
    std::cout << "find one. That is the opposite signature to lesson 6's balloon table, which\\n";
    std::cout << "over-claimed because its two halves were not independent -- an answer that is\\n";
    std::cout << "always on one side of the truth tells you which kind of mistake you made.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.

fn two_state(parent: &[i32], weight: &[i32]) -> i32 {
    let n = parent.len();
    let mut take = weight.to_vec();
    let mut skip = vec![0; n];
    for v in (1..n).rev() {
        let p = parent[v] as usize;
        take[p] += skip[v]; // taking p forbids v
        skip[p] += take[v].max(skip[v]); // skipping p leaves v free
    }
    take[0].max(skip[0])
}

/// The same table, minus one choice: skipping p also skips v.
fn forgetful(parent: &[i32], weight: &[i32]) -> i32 {
    let n = parent.len();
    let mut take = weight.to_vec();
    let mut skip = vec![0; n];
    for v in (1..n).rev() {
        let p = parent[v] as usize;
        take[p] += skip[v];
        skip[p] += skip[v];
    }
    take[0].max(skip[0])
}

/// Repeatedly take the heaviest node still available, then block its neighbours.
fn greedy(parent: &[i32], weight: &[i32]) -> i32 {
    let n = parent.len();
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for v in 1..n {
        let p = parent[v] as usize;
        neighbours[v].push(p);
        neighbours[p].push(v);
    }
    let mut blocked = vec![false; n];
    let mut used = vec![false; n];
    let mut total = 0;
    for _ in 0..n {
        let mut best: i32 = -1;
        for v in 0..n {
            if !blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best as usize]) {
                best = v as i32;
            }
        }
        if best < 0 {
            break;
        }
        let chosen = best as usize;
        total += weight[chosen];
        used[chosen] = true;
        for &u in &neighbours[chosen] {
            blocked[u] = true;
        }
    }
    total
}

/// Every subset, kept if no chosen node is the parent of another.
fn brute(parent: &[i32], weight: &[i32]) -> i32 {
    let n = parent.len();
    let mut best = 0;
    for mask in 0..(1u32 << n) {
        let mut ok = true;
        let mut total = 0;
        for v in 0..n {
            if mask >> v & 1 == 1 {
                total += weight[v];
                if v > 0 && mask >> parent[v] & 1 == 1 {
                    ok = false;
                }
            }
        }
        if ok && total > best {
            best = total;
        }
    }
    best
}

fn show(values: &[i32]) -> String {
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
    let parents: Vec<Vec<i32>> = vec![
        vec![-1, 0, 0],
        vec![-1, 0, 1, 2],
        vec![-1, 0, 0, 1, 1],
        vec![-1, 0, 1, 1, 0],
        vec![-1, 0, 1, 2, 3, 4],
    ];
    let weights: Vec<Vec<i32>> = vec![
        vec![3, 2, 2],
        vec![3, 1, 1, 3],
        vec![1, 5, 1, 1, 1],
        vec![4, 1, 2, 2, 4],
        vec![1, 2, 3, 4, 5, 6],
    ];

    println!(
        "{:<24}{:<22}{:>12}{:>15}{:>8}{:>14}",
        "parents", "weights", "two states", "a lost choice", "greedy", "every subset"
    );
    for (c, parent) in parents.iter().enumerate() {
        let weight = &weights[c];
        println!(
            "{:<24}{:<22}{:>12}{:>15}{:>8}{:>14}",
            show(parent),
            show(weight),
            two_state(parent, weight),
            forgetful(parent, weight),
            greedy(parent, weight),
            brute(parent, weight)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut two_ok, mut forget_ok, mut forget_under, mut greedy_ok) = (0, 0, 0, 0);
    for _ in 0..trials {
        let n = (2 + rng.next(9)) as usize;
        let mut parent = vec![-1i32; n];
        for v in 1..n {
            parent[v] = rng.next(v as i64) as i32;
        }
        let weight: Vec<i32> = (0..n).map(|_| (1 + rng.next(9)) as i32).collect();
        let truth = brute(&parent, &weight);
        if two_state(&parent, &weight) == truth {
            two_ok += 1;
        }
        let guess = forgetful(&parent, &weight);
        if guess == truth {
            forget_ok += 1;
        }
        if guess < truth {
            forget_under += 1;
        }
        if greedy(&parent, &weight) == truth {
            greedy_ok += 1;
        }
    }

    println!("over {} random trees of 2 to 10 nodes, against every subset:", trials);
    println!("  a node and a flag                  {:>6}", two_ok);
    println!("  the same table, minus one choice   {:>6}", forget_ok);
    println!("  heaviest available node first      {:>6}", greedy_ok);
    println!();
    println!("the second one was too small on {} of them and never too large: dropping", forget_under);
    println!("a branch from a maximisation cannot invent a better set, it can only fail to");
    println!("find one. That is the opposite signature to lesson 6's balloon table, which");
    println!("over-claimed because its two halves were not independent -- an answer that is");
    println!("always on one side of the truth tells you which kind of mistake you made.");
}
`,
            },
            {
              lang: "go",
              code: `// Dynamic programming on a tree, where the state is a node and the table is the
// tree itself.
//
// The problem is the maximum-weight independent set: choose a set of nodes with
// no two adjacent, maximising total weight. One value per node is not enough --
// knowing the best a subtree can do says nothing about whether its root was
// used, and that is exactly what the parent needs to know. So the state is a
// node *and a flag*, which is the tree version of lesson 4's "put the ending
// into the state".
//
// Trees are given as a parent array with parent[0] = -1 and parent[i] < i, so
// iterating i from the last node down to 0 always finishes a node's children
// before the node itself. No recursion and no explicit ordering pass.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func larger(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func twoState(parent, weight []int) int {
	n := len(parent)
	take := append([]int(nil), weight...)
	skip := make([]int, n)
	for v := n - 1; v > 0; v-- {
		p := parent[v]
		take[p] += skip[v]                  // taking p forbids v
		skip[p] += larger(take[v], skip[v]) // skipping p leaves v free
	}
	return larger(take[0], skip[0])
}

// forgetful is the same table, minus one choice: skipping p also skips v.
func forgetful(parent, weight []int) int {
	n := len(parent)
	take := append([]int(nil), weight...)
	skip := make([]int, n)
	for v := n - 1; v > 0; v-- {
		p := parent[v]
		take[p] += skip[v]
		skip[p] += skip[v]
	}
	return larger(take[0], skip[0])
}

// greedy repeatedly takes the heaviest node still available, then blocks its neighbours.
func greedy(parent, weight []int) int {
	n := len(parent)
	neighbours := make([][]int, n)
	for v := 1; v < n; v++ {
		neighbours[v] = append(neighbours[v], parent[v])
		neighbours[parent[v]] = append(neighbours[parent[v]], v)
	}
	blocked := make([]bool, n)
	used := make([]bool, n)
	total := 0
	for round := 0; round < n; round++ {
		best := -1
		for v := 0; v < n; v++ {
			if !blocked[v] && !used[v] && (best < 0 || weight[v] > weight[best]) {
				best = v
			}
		}
		if best < 0 {
			break
		}
		total += weight[best]
		used[best] = true
		for _, u := range neighbours[best] {
			blocked[u] = true
		}
	}
	return total
}

// brute checks every subset, keeping those where no chosen node is the parent of another.
func brute(parent, weight []int) int {
	n := len(parent)
	best := 0
	for mask := 0; mask < 1<<n; mask++ {
		ok := true
		total := 0
		for v := 0; v < n; v++ {
			if mask>>v&1 == 1 {
				total += weight[v]
				if v > 0 && mask>>parent[v]&1 == 1 {
					ok = false
				}
			}
		}
		if ok && total > best {
			best = total
		}
	}
	return best
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
	parents := [][]int{
		{-1, 0, 0},
		{-1, 0, 1, 2},
		{-1, 0, 0, 1, 1},
		{-1, 0, 1, 1, 0},
		{-1, 0, 1, 2, 3, 4},
	}
	weights := [][]int{
		{3, 2, 2},
		{3, 1, 1, 3},
		{1, 5, 1, 1, 1},
		{4, 1, 2, 2, 4},
		{1, 2, 3, 4, 5, 6},
	}

	fmt.Printf("%-24s%-22s%12s%15s%8s%14s\\n", "parents", "weights", "two states",
		"a lost choice", "greedy", "every subset")
	for c, parent := range parents {
		weight := weights[c]
		fmt.Printf("%-24s%-22s%12d%15d%8d%14d\\n", show(parent), show(weight),
			twoState(parent, weight), forgetful(parent, weight), greedy(parent, weight),
			brute(parent, weight))
	}
	fmt.Println()

	trials := 3000
	twoOk, forgetOk, forgetUnder, greedyOk := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(9)
		parent := make([]int, n)
		parent[0] = -1
		for v := 1; v < n; v++ {
			parent[v] = rand(v)
		}
		weight := make([]int, n)
		for v := 0; v < n; v++ {
			weight[v] = 1 + rand(9)
		}
		truth := brute(parent, weight)
		if twoState(parent, weight) == truth {
			twoOk++
		}
		guess := forgetful(parent, weight)
		if guess == truth {
			forgetOk++
		}
		if guess < truth {
			forgetUnder++
		}
		if greedy(parent, weight) == truth {
			greedyOk++
		}
	}

	fmt.Printf("over %d random trees of 2 to 10 nodes, against every subset:\\n", trials)
	fmt.Printf("  a node and a flag                  %6d\\n", twoOk)
	fmt.Printf("  the same table, minus one choice   %6d\\n", forgetOk)
	fmt.Printf("  heaviest available node first      %6d\\n", greedyOk)
	fmt.Println()
	fmt.Printf("the second one was too small on %d of them and never too large: dropping\\n", forgetUnder)
	fmt.Println("a branch from a maximisation cannot invent a better set, it can only fail to")
	fmt.Println("find one. That is the opposite signature to lesson 6's balloon table, which")
	fmt.Println("over-claimed because its two halves were not independent -- an answer that is")
	fmt.Println("always on one side of the truth tells you which kind of mistake you made.")
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-tree-fold",
        kind: "dp",
        algorithm: "tree",
        title: "Two numbers per node, folded up the tree",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "One number per node loses what the parent needs",
          body: "\"The best this subtree can do\" does not record whether the subtree's own root was used, and the parent cannot decide about itself without that. The fix is the same one as the longest increasing subsequence: put the thing the caller needs into the state. Two entries per node, not one.",
        },
        {
          title: "Too small and too large mean different things",
          body: "A maximisation that lost one of its options can only under-report \u2014 here 224 correct out of 3,000, never above the truth. One whose subproblems are not independent can over-report, as lesson 6's balloon table did on 1,315 trials. When a wrong answer is consistently on one side, that says which class of bug to look for.",
        },
      ],
    },
    {
      id: "not-at-the-root",
      heading: "The answer is not at the root",
      body: [
        "The second thing about trees is where the answer lives, and it is the same question as lesson 3's longest common substring and lesson 4's largest cell, in its third disguise.",
        "Take the diameter: the longest path between any two nodes. The recurrence computes something perfectly reasonable per node \u2014 the depths of the two deepest branches hanging below it \u2014 and the longest path through a given node is the sum of those two. But the longest path in the whole tree passes through exactly one highest node, and there is no reason for that to be the root.",
        "So the table is per-node and the answer is a global maximum over all nodes. Reading it at the root instead gives the longest path *through the root*, which is a different quantity and usually, but not always, equal.",
        "Usually is the operative word. Over 3,000 random trees the root reading was right 2,895 times \u2014 96.5 percent \u2014 and too small on the other 105. It fails only when the tree's centre is somewhere other than node 0, and the way these trees are generated puts the root near the centre most of the time. On a tree rooted at a leaf it would fail constantly. A test set that happens to root things centrally will not find this.",
        "The two versions share the same table and the same recurrence. They differ in one line: where the answer is read from. That is worth saying plainly because it keeps happening \u2014 module 27 lesson 3 raised it, and this is the fourth distinct problem in two modules where the recurrence was right and the reading was wrong.",
      ],
      examples: [
        {
          id: "diameter-anywhere",
          title: "The diameter, combined everywhere and read at the root",
          lang: "python",
          code: `# The longest path in a tree, which is where "the answer is not the last cell"
# turns into "the answer is not at the root".
#
# The recurrence computes one thing per node -- the height of its subtree -- but
# the quantity being asked for is combined at every node and kept globally. The
# longest path passes through exactly one highest node, and that node is not
# usually the root.
#
# Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
# downwards finishes every child before its parent.


def heights(parent):
    """best1[v] and best2[v]: the two deepest branches hanging below v, in edges."""
    n = len(parent)
    best1 = [0] * n
    best2 = [0] * n
    for v in range(n - 1, 0, -1):
        p = parent[v]
        reach = best1[v] + 1
        if reach > best1[p]:
            best2[p] = best1[p]
            best1[p] = reach
        elif reach > best2[p]:
            best2[p] = reach
    return best1, best2


def diameter(parent):
    """Combine at every node and keep the largest, because the top can be anywhere."""
    best1, best2 = heights(parent)
    return max(best1[v] + best2[v] for v in range(len(parent)))


def through_the_root(parent):
    """The same two numbers, read only at the root."""
    best1, best2 = heights(parent)
    return best1[0] + best2[0]


def brute(parent):
    """The distance between every pair of nodes, by walking the tree from each."""
    n = len(parent)
    neighbours = [[] for _ in range(n)]
    for v in range(1, n):
        neighbours[v].append(parent[v])
        neighbours[parent[v]].append(v)
    best = 0
    for start in range(n):
        distance = [-1] * n
        distance[start] = 0
        queue = [start]
        head = 0
        while head < len(queue):
            v = queue[head]
            head += 1
            for u in neighbours[v]:
                if distance[u] < 0:
                    distance[u] = distance[v] + 1
                    queue.append(u)
        best = max(best, max(distance))
    return best


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    [-1, 0, 0],
    [-1, 0, 1, 2],
    [-1, 0, 1, 1, 0, 4],
    [-1, 0, 1, 2, 1, 4],
    [-1, 0, 0, 1, 1, 2, 2],
    [-1, 0, 1, 2, 3],
]

print(f"{'parents':<28}{'combined anywhere':>19}{'read at the root':>18}{'every pair':>12}")
for parent in CASES:
    print(f"{show(parent):<28}{diameter(parent):>19}{through_the_root(parent):>18}{brute(parent):>12}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
anywhere_ok = 0
root_ok = 0
root_under = 0
for _ in range(TRIALS):
    n = 2 + rand(11)
    parent = [-1] + [rand(v) for v in range(1, n)]
    truth = brute(parent)
    if diameter(parent) == truth:
        anywhere_ok += 1
    guess = through_the_root(parent)
    if guess == truth:
        root_ok += 1
    if guess < truth:
        root_under += 1

print(f"over {TRIALS} random trees of 2 to 12 nodes, against every pair of nodes:")
print(f"  combined at every node, largest kept   {anywhere_ok:>6}")
print(f"  the same two numbers read at the root  {root_ok:>6}")
print()
print(f"the root reading was too small on {root_under} of them: the longest path went")
print("through some other node, and the root never saw it. Nothing about the")
print("recurrence is different between the two -- they share the same table, and")
print("differ only in where the answer is read from.")
`,
          output: `parents                       combined anywhere  read at the root  every pair
[-1, 0, 0]                                    2                 2           2
[-1, 0, 1, 2]                                 3                 3           3
[-1, 0, 1, 1, 0, 4]                           4                 4           4
[-1, 0, 1, 2, 1, 4]                           4                 3           4
[-1, 0, 0, 1, 1, 2, 2]                        4                 4           4
[-1, 0, 1, 2, 3]                              4                 4           4

over 3000 random trees of 2 to 12 nodes, against every pair of nodes:
  combined at every node, largest kept     3000
  the same two numbers read at the root    2895

the root reading was too small on 105 of them: the longest path went
through some other node, and the root never saw it. Nothing about the
recurrence is different between the two -- they share the same table, and
differ only in where the answer is read from.`,
          explanation:
            "One table, two readings. The recurrence is identical; the only difference is whether the per-node combination is kept globally or read at the root. The 105 failures are the trees whose centre is not node 0.",
          alternates: [
            {
              lang: "javascript",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.

/** best1[v] and best2[v]: the two deepest branches hanging below v, in edges. */
function heights(parent) {
  const n = parent.length;
  const best1 = new Array(n).fill(0);
  const best2 = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    const reach = best1[v] + 1;
    if (reach > best1[p]) {
      best2[p] = best1[p];
      best1[p] = reach;
    } else if (reach > best2[p]) {
      best2[p] = reach;
    }
  }
  return [best1, best2];
}

/** Combine at every node and keep the largest, because the top can be anywhere. */
function diameter(parent) {
  const [best1, best2] = heights(parent);
  let best = 0;
  for (let v = 0; v < parent.length; v++) {
    if (best1[v] + best2[v] > best) best = best1[v] + best2[v];
  }
  return best;
}

/** The same two numbers, read only at the root. */
function throughTheRoot(parent) {
  const [best1, best2] = heights(parent);
  return best1[0] + best2[0];
}

/** The distance between every pair of nodes, by walking the tree from each. */
function brute(parent) {
  const n = parent.length;
  const neighbours = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  let best = 0;
  for (let start = 0; start < n; start++) {
    const distance = new Array(n).fill(-1);
    distance[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head++;
      for (const u of neighbours[v]) {
        if (distance[u] < 0) {
          distance[u] = distance[v] + 1;
          queue.push(u);
        }
      }
    }
    for (const d of distance) if (d > best) best = d;
  }
  return best;
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
  [-1, 0, 0],
  [-1, 0, 1, 2],
  [-1, 0, 1, 1, 0, 4],
  [-1, 0, 1, 2, 1, 4],
  [-1, 0, 0, 1, 1, 2, 2],
  [-1, 0, 1, 2, 3],
];

console.log(padEnd("parents", 28) + pad("combined anywhere", 19) + pad("read at the root", 18) + pad("every pair", 12));
for (const parent of CASES) {
  console.log(
    padEnd(show(parent), 28) + pad(diameter(parent), 19) + pad(throughTheRoot(parent), 18) + pad(brute(parent), 12)
  );
}
console.log();

const TRIALS = 3000;
let anywhereOk = 0;
let rootOk = 0;
let rootUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(11);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const truth = brute(parent);
  if (diameter(parent) === truth) anywhereOk++;
  const guess = throughTheRoot(parent);
  if (guess === truth) rootOk++;
  if (guess < truth) rootUnder++;
}

console.log(\`over \${TRIALS} random trees of 2 to 12 nodes, against every pair of nodes:\`);
console.log("  combined at every node, largest kept   " + pad(anywhereOk, 6));
console.log("  the same two numbers read at the root  " + pad(rootOk, 6));
console.log();
console.log(\`the root reading was too small on \${rootUnder} of them: the longest path went\`);
console.log("through some other node, and the root never saw it. Nothing about the");
console.log("recurrence is different between the two -- they share the same table, and");
console.log("differ only in where the answer is read from.");
`,
            },
            {
              lang: "typescript",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.

/** best1[v] and best2[v]: the two deepest branches hanging below v, in edges. */
function heights(parent: number[]): [number[], number[]] {
  const n = parent.length;
  const best1 = new Array(n).fill(0);
  const best2 = new Array(n).fill(0);
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    const reach = best1[v] + 1;
    if (reach > best1[p]) {
      best2[p] = best1[p];
      best1[p] = reach;
    } else if (reach > best2[p]) {
      best2[p] = reach;
    }
  }
  return [best1, best2];
}

/** Combine at every node and keep the largest, because the top can be anywhere. */
function diameter(parent: number[]): number {
  const [best1, best2] = heights(parent);
  let best = 0;
  for (let v = 0; v < parent.length; v++) {
    if (best1[v] + best2[v] > best) best = best1[v] + best2[v];
  }
  return best;
}

/** The same two numbers, read only at the root. */
function throughTheRoot(parent: number[]): number {
  const [best1, best2] = heights(parent);
  return best1[0] + best2[0];
}

/** The distance between every pair of nodes, by walking the tree from each. */
function brute(parent: number[]): number {
  const n = parent.length;
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  let best = 0;
  for (let start = 0; start < n; start++) {
    const distance = new Array(n).fill(-1);
    distance[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head++;
      for (const u of neighbours[v]) {
        if (distance[u] < 0) {
          distance[u] = distance[v] + 1;
          queue.push(u);
        }
      }
    }
    for (const d of distance) if (d > best) best = d;
  }
  return best;
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
  [-1, 0, 0],
  [-1, 0, 1, 2],
  [-1, 0, 1, 1, 0, 4],
  [-1, 0, 1, 2, 1, 4],
  [-1, 0, 0, 1, 1, 2, 2],
  [-1, 0, 1, 2, 3],
];

console.log(padEnd("parents", 28) + pad("combined anywhere", 19) + pad("read at the root", 18) + pad("every pair", 12));
for (const parent of CASES) {
  console.log(
    padEnd(show(parent), 28) + pad(diameter(parent), 19) + pad(throughTheRoot(parent), 18) + pad(brute(parent), 12)
  );
}
console.log();

const TRIALS = 3000;
let anywhereOk = 0;
let rootOk = 0;
let rootUnder = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(11);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const truth = brute(parent);
  if (diameter(parent) === truth) anywhereOk++;
  const guess = throughTheRoot(parent);
  if (guess === truth) rootOk++;
  if (guess < truth) rootUnder++;
}

console.log(\`over \${TRIALS} random trees of 2 to 12 nodes, against every pair of nodes:\`);
console.log("  combined at every node, largest kept   " + pad(anywhereOk, 6));
console.log("  the same two numbers read at the root  " + pad(rootOk, 6));
console.log();
console.log(\`the root reading was too small on \${rootUnder} of them: the longest path went\`);
console.log("through some other node, and the root never saw it. Nothing about the");
console.log("recurrence is different between the two -- they share the same table, and");
console.log("differ only in where the answer is read from.");
`,
            },
            {
              lang: "java",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    // best1[v] and best2[v]: the two deepest branches hanging below v, in edges.
    static int[][] heights(int[] parent) {
        int n = parent.length;
        int[] best1 = new int[n];
        int[] best2 = new int[n];
        for (int v = n - 1; v > 0; v--) {
            int p = parent[v];
            int reach = best1[v] + 1;
            if (reach > best1[p]) {
                best2[p] = best1[p];
                best1[p] = reach;
            } else if (reach > best2[p]) {
                best2[p] = reach;
            }
        }
        return new int[][] {best1, best2};
    }

    // Combine at every node and keep the largest, because the top can be anywhere.
    static int diameter(int[] parent) {
        int[][] pair = heights(parent);
        int best = 0;
        for (int v = 0; v < parent.length; v++) {
            if (pair[0][v] + pair[1][v] > best) best = pair[0][v] + pair[1][v];
        }
        return best;
    }

    // The same two numbers, read only at the root.
    static int throughTheRoot(int[] parent) {
        int[][] pair = heights(parent);
        return pair[0][0] + pair[1][0];
    }

    // The distance between every pair of nodes, by walking the tree from each.
    static int brute(int[] parent) {
        int n = parent.length;
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int v = 0; v < n; v++) neighbours.add(new ArrayList<>());
        for (int v = 1; v < n; v++) {
            neighbours.get(v).add(parent[v]);
            neighbours.get(parent[v]).add(v);
        }
        int best = 0;
        for (int start = 0; start < n; start++) {
            int[] distance = new int[n];
            Arrays.fill(distance, -1);
            distance[start] = 0;
            List<Integer> queue = new ArrayList<>();
            queue.add(start);
            int head = 0;
            while (head < queue.size()) {
                int v = queue.get(head);
                head++;
                for (int u : neighbours.get(v)) {
                    if (distance[u] < 0) {
                        distance[u] = distance[v] + 1;
                        queue.add(u);
                    }
                }
            }
            for (int d : distance) if (d > best) best = d;
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
            {-1, 0, 0},
            {-1, 0, 1, 2},
            {-1, 0, 1, 1, 0, 4},
            {-1, 0, 1, 2, 1, 4},
            {-1, 0, 0, 1, 1, 2, 2},
            {-1, 0, 1, 2, 3},
        };

        System.out.println(padEnd("parents", 28) + pad("combined anywhere", 19)
            + pad("read at the root", 18) + pad("every pair", 12));
        for (int[] parent : cases) {
            System.out.println(padEnd(show(parent), 28) + pad(diameter(parent), 19)
                + pad(throughTheRoot(parent), 18) + pad(brute(parent), 12));
        }
        System.out.println();

        int trials = 3000;
        int anywhereOk = 0, rootOk = 0, rootUnder = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(11);
            int[] parent = new int[n];
            parent[0] = -1;
            for (int v = 1; v < n; v++) parent[v] = rand(v);
            int truth = brute(parent);
            if (diameter(parent) == truth) anywhereOk++;
            int guess = throughTheRoot(parent);
            if (guess == truth) rootOk++;
            if (guess < truth) rootUnder++;
        }

        System.out.println("over " + trials + " random trees of 2 to 12 nodes, against every pair of nodes:");
        System.out.println("  combined at every node, largest kept   " + pad(anywhereOk, 6));
        System.out.println("  the same two numbers read at the root  " + pad(rootOk, 6));
        System.out.println();
        System.out.println("the root reading was too small on " + rootUnder + " of them: the longest path went");
        System.out.println("through some other node, and the root never saw it. Nothing about the");
        System.out.println("recurrence is different between the two -- they share the same table, and");
        System.out.println("differ only in where the answer is read from.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// The two deepest branches hanging below each node, in edges.
std::array<std::vector<int>, 2> heights(const std::vector<int> &parent) {
    int n = static_cast<int>(parent.size());
    std::vector<int> best1(n, 0), best2(n, 0);
    for (int v = n - 1; v > 0; v--) {
        int p = parent[v];
        int reach = best1[v] + 1;
        if (reach > best1[p]) {
            best2[p] = best1[p];
            best1[p] = reach;
        } else if (reach > best2[p]) {
            best2[p] = reach;
        }
    }
    return {best1, best2};
}

// Combine at every node and keep the largest, because the top can be anywhere.
int diameter(const std::vector<int> &parent) {
    auto pair = heights(parent);
    int best = 0;
    for (size_t v = 0; v < parent.size(); v++) {
        if (pair[0][v] + pair[1][v] > best) best = pair[0][v] + pair[1][v];
    }
    return best;
}

// The same two numbers, read only at the root.
int throughTheRoot(const std::vector<int> &parent) {
    auto pair = heights(parent);
    return pair[0][0] + pair[1][0];
}

// The distance between every pair of nodes, by walking the tree from each.
int brute(const std::vector<int> &parent) {
    int n = static_cast<int>(parent.size());
    std::vector<std::vector<int>> neighbours(n);
    for (int v = 1; v < n; v++) {
        neighbours[v].push_back(parent[v]);
        neighbours[parent[v]].push_back(v);
    }
    int best = 0;
    for (int start = 0; start < n; start++) {
        std::vector<int> distance(n, -1);
        distance[start] = 0;
        std::vector<int> queue = {start};
        for (size_t head = 0; head < queue.size(); head++) {
            int v = queue[head];
            for (int u : neighbours[v]) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.push_back(u);
                }
            }
        }
        for (int d : distance) if (d > best) best = d;
    }
    return best;
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
        {-1, 0, 0},
        {-1, 0, 1, 2},
        {-1, 0, 1, 1, 0, 4},
        {-1, 0, 1, 2, 1, 4},
        {-1, 0, 0, 1, 1, 2, 2},
        {-1, 0, 1, 2, 3},
    };

    std::cout << std::left << std::setw(28) << "parents" << std::right << std::setw(19) << "combined anywhere"
              << std::setw(18) << "read at the root" << std::setw(12) << "every pair" << "\\n";
    for (const auto &parent : cases) {
        std::cout << std::left << std::setw(28) << show(parent) << std::right
                  << std::setw(19) << diameter(parent) << std::setw(18) << throughTheRoot(parent)
                  << std::setw(12) << brute(parent) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int anywhereOk = 0, rootOk = 0, rootUnder = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(11);
        std::vector<int> parent(n);
        parent[0] = -1;
        for (int v = 1; v < n; v++) parent[v] = rnd(v);
        int truth = brute(parent);
        if (diameter(parent) == truth) anywhereOk++;
        int guess = throughTheRoot(parent);
        if (guess == truth) rootOk++;
        if (guess < truth) rootUnder++;
    }

    std::cout << "over " << TRIALS << " random trees of 2 to 12 nodes, against every pair of nodes:\\n";
    std::cout << "  combined at every node, largest kept   " << std::setw(6) << anywhereOk << "\\n";
    std::cout << "  the same two numbers read at the root  " << std::setw(6) << rootOk << "\\n\\n";
    std::cout << "the root reading was too small on " << rootUnder << " of them: the longest path went\\n";
    std::cout << "through some other node, and the root never saw it. Nothing about the\\n";
    std::cout << "recurrence is different between the two -- they share the same table, and\\n";
    std::cout << "differ only in where the answer is read from.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.

/// The two deepest branches hanging below each node, in edges.
fn heights(parent: &[i32]) -> (Vec<i32>, Vec<i32>) {
    let n = parent.len();
    let mut best1 = vec![0; n];
    let mut best2 = vec![0; n];
    for v in (1..n).rev() {
        let p = parent[v] as usize;
        let reach = best1[v] + 1;
        if reach > best1[p] {
            best2[p] = best1[p];
            best1[p] = reach;
        } else if reach > best2[p] {
            best2[p] = reach;
        }
    }
    (best1, best2)
}

/// Combine at every node and keep the largest, because the top can be anywhere.
fn diameter(parent: &[i32]) -> i32 {
    let (best1, best2) = heights(parent);
    (0..parent.len()).map(|v| best1[v] + best2[v]).max().unwrap_or(0)
}

/// The same two numbers, read only at the root.
fn through_the_root(parent: &[i32]) -> i32 {
    let (best1, best2) = heights(parent);
    best1[0] + best2[0]
}

/// The distance between every pair of nodes, by walking the tree from each.
fn brute(parent: &[i32]) -> i32 {
    let n = parent.len();
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for v in 1..n {
        let p = parent[v] as usize;
        neighbours[v].push(p);
        neighbours[p].push(v);
    }
    let mut best = 0;
    for start in 0..n {
        let mut distance = vec![-1i32; n];
        distance[start] = 0;
        let mut queue = vec![start];
        let mut head = 0;
        while head < queue.len() {
            let v = queue[head];
            head += 1;
            for k in 0..neighbours[v].len() {
                let u = neighbours[v][k];
                if distance[u] < 0 {
                    distance[u] = distance[v] + 1;
                    queue.push(u);
                }
            }
        }
        for &d in &distance {
            if d > best {
                best = d;
            }
        }
    }
    best
}

fn show(values: &[i32]) -> String {
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
    let cases: Vec<Vec<i32>> = vec![
        vec![-1, 0, 0],
        vec![-1, 0, 1, 2],
        vec![-1, 0, 1, 1, 0, 4],
        vec![-1, 0, 1, 2, 1, 4],
        vec![-1, 0, 0, 1, 1, 2, 2],
        vec![-1, 0, 1, 2, 3],
    ];

    println!(
        "{:<28}{:>19}{:>18}{:>12}",
        "parents", "combined anywhere", "read at the root", "every pair"
    );
    for parent in &cases {
        println!(
            "{:<28}{:>19}{:>18}{:>12}",
            show(parent),
            diameter(parent),
            through_the_root(parent),
            brute(parent)
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut anywhere_ok, mut root_ok, mut root_under) = (0, 0, 0);
    for _ in 0..trials {
        let n = (2 + rng.next(11)) as usize;
        let mut parent = vec![-1i32; n];
        for v in 1..n {
            parent[v] = rng.next(v as i64) as i32;
        }
        let truth = brute(&parent);
        if diameter(&parent) == truth {
            anywhere_ok += 1;
        }
        let guess = through_the_root(&parent);
        if guess == truth {
            root_ok += 1;
        }
        if guess < truth {
            root_under += 1;
        }
    }

    println!("over {} random trees of 2 to 12 nodes, against every pair of nodes:", trials);
    println!("  combined at every node, largest kept   {:>6}", anywhere_ok);
    println!("  the same two numbers read at the root  {:>6}", root_ok);
    println!();
    println!("the root reading was too small on {} of them: the longest path went", root_under);
    println!("through some other node, and the root never saw it. Nothing about the");
    println!("recurrence is different between the two -- they share the same table, and");
    println!("differ only in where the answer is read from.");
}
`,
            },
            {
              lang: "go",
              code: `// The longest path in a tree, which is where "the answer is not the last cell"
// turns into "the answer is not at the root".
//
// The recurrence computes one thing per node -- the height of its subtree -- but
// the quantity being asked for is combined at every node and kept globally. The
// longest path passes through exactly one highest node, and that node is not
// usually the root.
//
// Trees are parent arrays again: parent[0] = -1 and parent[i] < i, so walking i
// downwards finishes every child before its parent.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// heights gives the two deepest branches hanging below each node, in edges.
func heights(parent []int) ([]int, []int) {
	n := len(parent)
	best1 := make([]int, n)
	best2 := make([]int, n)
	for v := n - 1; v > 0; v-- {
		p := parent[v]
		reach := best1[v] + 1
		if reach > best1[p] {
			best2[p] = best1[p]
			best1[p] = reach
		} else if reach > best2[p] {
			best2[p] = reach
		}
	}
	return best1, best2
}

// diameter combines at every node and keeps the largest, because the top can be anywhere.
func diameter(parent []int) int {
	best1, best2 := heights(parent)
	best := 0
	for v := range parent {
		if best1[v]+best2[v] > best {
			best = best1[v] + best2[v]
		}
	}
	return best
}

// throughTheRoot reads the same two numbers only at the root.
func throughTheRoot(parent []int) int {
	best1, best2 := heights(parent)
	return best1[0] + best2[0]
}

// brute measures the distance between every pair of nodes by walking from each.
func brute(parent []int) int {
	n := len(parent)
	neighbours := make([][]int, n)
	for v := 1; v < n; v++ {
		neighbours[v] = append(neighbours[v], parent[v])
		neighbours[parent[v]] = append(neighbours[parent[v]], v)
	}
	best := 0
	for start := 0; start < n; start++ {
		distance := make([]int, n)
		for i := range distance {
			distance[i] = -1
		}
		distance[start] = 0
		queue := []int{start}
		for head := 0; head < len(queue); head++ {
			v := queue[head]
			for _, u := range neighbours[v] {
				if distance[u] < 0 {
					distance[u] = distance[v] + 1
					queue = append(queue, u)
				}
			}
		}
		for _, d := range distance {
			if d > best {
				best = d
			}
		}
	}
	return best
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
		{-1, 0, 0},
		{-1, 0, 1, 2},
		{-1, 0, 1, 1, 0, 4},
		{-1, 0, 1, 2, 1, 4},
		{-1, 0, 0, 1, 1, 2, 2},
		{-1, 0, 1, 2, 3},
	}

	fmt.Printf("%-28s%19s%18s%12s\\n", "parents", "combined anywhere", "read at the root", "every pair")
	for _, parent := range cases {
		fmt.Printf("%-28s%19d%18d%12d\\n", show(parent), diameter(parent),
			throughTheRoot(parent), brute(parent))
	}
	fmt.Println()

	trials := 3000
	anywhereOk, rootOk, rootUnder := 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 2 + rand(11)
		parent := make([]int, n)
		parent[0] = -1
		for v := 1; v < n; v++ {
			parent[v] = rand(v)
		}
		truth := brute(parent)
		if diameter(parent) == truth {
			anywhereOk++
		}
		guess := throughTheRoot(parent)
		if guess == truth {
			rootOk++
		}
		if guess < truth {
			rootUnder++
		}
	}

	fmt.Printf("over %d random trees of 2 to 12 nodes, against every pair of nodes:\\n", trials)
	fmt.Printf("  combined at every node, largest kept   %6d\\n", anywhereOk)
	fmt.Printf("  the same two numbers read at the root  %6d\\n", rootOk)
	fmt.Println()
	fmt.Printf("the root reading was too small on %d of them: the longest path went\\n", rootUnder)
	fmt.Println("through some other node, and the root never saw it. Nothing about the")
	fmt.Println("recurrence is different between the two -- they share the same table, and")
	fmt.Println("differ only in where the answer is read from.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The answer is not at the root",
          body: "The diameter is a maximum over every node of that node's two deepest branches, because the highest point of the longest path can be anywhere. Reading the root gives the longest path through the root: right on 2,895 of 3,000 random trees here, and silently too small on the rest.",
        },
        {
          title: "Randomly generated trees flatter a root-centred bug",
          body: "These parent arrays put each node under a uniformly chosen earlier node, which keeps the root near the centre most of the time. Root the same tree at a leaf and the same bug fails constantly. Any test set for a tree algorithm should include a path and a star, and should try more than one root.",
        },
      ],
    },
    {
      id: "rerooting",
      heading: "Answering for every node, in two passes",
      body: [
        "The third thing is the technique that makes trees more than \"recursion with a cache\", and it is worth learning properly because it turns a whole class of `O(n^2)` answers into `O(n)`.",
        "The question: for *every* node, what is the sum of distances from it to all the others? One node is a single traversal. Every node, done directly, is `n` traversals \u2014 quadratic, and it recomputes almost everything each time.",
        "Rerooting is the observation that moving the root across a single edge changes every distance by exactly one, and the direction depends only on which side of that edge a node is on. Cross into a subtree of size `s`: those `s` nodes each get one step closer, and the other `n - s` each get one step further. So the new total is the old total plus `n - 2s`, and `s` is already in the table.",
        "That is two passes. Upwards for subtree sizes and the sum of distances within each subtree; downwards, sliding the root along each edge with that one line of arithmetic. The upward pass is the loop over indices descending, the downward pass is the same loop ascending \u2014 the tree is being used as its own schedule in both directions.",
        "Measured on 3,000 trees of up to 61 nodes, the two approaches agree on every node of every tree, and the work is 3,853,211 node visits against 181,714. Same answers, one factor of `n` less work, and the entire saving is one line of arithmetic that avoids recomputation.",
        "Rerooting generalises well beyond distance sums \u2014 the height from each node, the number of nodes at each distance, the best path starting anywhere \u2014 and the shape is always the same. Compute what each subtree contributes upwards, then push the complement downwards. The part that takes practice is working out what \"the complement\" is for a given quantity, which is a small algebra problem per problem rather than a new technique each time.",
      ],
      examples: [
        {
          id: "rerooting",
          title: "Sum of distances from every node, walked and rerooted",
          lang: "python",
          code: `# Rerooting: computing an answer for every node as the root, in two passes
# rather than n.
#
# The question is the sum of distances from each node to all the others. Doing
# it directly means walking the whole tree once per node, which is O(n^2). The
# observation that removes a factor of n is that moving the root across one edge
# changes every distance by exactly one, in a direction that depends only on
# which side of the edge each node is on -- and the sizes of the two sides are
# already in the table.
#
# So: one pass upwards for subtree sizes and subtree distance sums, one pass
# downwards to slide the root along each edge. Two passes, both linear.


def by_walking(parent):
    """Walk the whole tree from every node. n traversals, and n^2 edge visits."""
    n = len(parent)
    neighbours = [[] for _ in range(n)]
    for v in range(1, n):
        neighbours[v].append(parent[v])
        neighbours[parent[v]].append(v)
    sums = [0] * n
    visits = 0
    for start in range(n):
        distance = [-1] * n
        distance[start] = 0
        queue = [start]
        head = 0
        while head < len(queue):
            v = queue[head]
            head += 1
            visits += 1
            for u in neighbours[v]:
                if distance[u] < 0:
                    distance[u] = distance[v] + 1
                    queue.append(u)
        sums[start] = sum(distance)
    return sums, visits


def by_rerooting(parent):
    """Two linear passes: sizes and subtree sums up, then the root slid down."""
    n = len(parent)
    size = [1] * n
    down = [0] * n
    visits = 0
    # Children come after parents in the array, so descending order is a
    # post-order: every child is final before its parent is touched.
    for v in range(n - 1, 0, -1):
        p = parent[v]
        size[p] += size[v]
        down[p] += down[v] + size[v]
        visits += 1
    answer = [0] * n
    answer[0] = down[0]
    # Ascending order is the reverse: every parent is final before its children.
    for v in range(1, n):
        # Crossing the edge into v moves size[v] nodes one step closer and the
        # other n - size[v] one step further away.
        answer[v] = answer[parent[v]] + n - 2 * size[v]
        visits += 1
    return answer, visits


def show(values):
    return "[" + ", ".join(str(v) for v in values) + "]"


CASES = [
    [-1, 0, 0],
    [-1, 0, 1, 2],
    [-1, 0, 0, 1, 1],
    [-1, 0, 1, 1, 0, 4],
    [-1, 0, 1, 2, 3, 4, 5],
]

print(f"{'parents':<28}{'distance sums per node':<32}{'walked':>8}{'rerooted':>10}")
for parent in CASES:
    walked, walk_visits = by_walking(parent)
    rerooted, reroot_visits = by_rerooting(parent)
    same = "same" if walked == rerooted else "DIFFER"
    print(f"{show(parent):<28}{show(rerooted) + ' ' + same:<32}{walk_visits:>8}{reroot_visits:>10}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 3000
agree = 0
walk_total = 0
reroot_total = 0
biggest = 0
for _ in range(TRIALS):
    n = 2 + rand(60)
    parent = [-1] + [rand(v) for v in range(1, n)]
    walked, walk_visits = by_walking(parent)
    rerooted, reroot_visits = by_rerooting(parent)
    if walked == rerooted:
        agree += 1
    walk_total += walk_visits
    reroot_total += reroot_visits
    biggest = max(biggest, n)

print(f"over {TRIALS} random trees of up to {biggest} nodes:")
print(f"  the two agree on every node          {agree:>8}")
print(f"  node visits, walking from each root  {walk_total:>8}")
print(f"  node visits, rerooting               {reroot_total:>8}")
print()
print("same answers, and the work is linear rather than quadratic. The whole")
print("saving comes from one line: crossing an edge into a subtree of size s")
print("moves s nodes one step closer and n - s of them one step further, so the")
print("new total is the old one plus n - 2s. Nothing is recomputed.")
`,
          output: `parents                     distance sums per node            walked  rerooted
[-1, 0, 0]                  [2, 3, 3] same                         9         4
[-1, 0, 1, 2]               [6, 4, 4, 6] same                     16         6
[-1, 0, 0, 1, 1]            [6, 5, 9, 8, 8] same                  25         8
[-1, 0, 1, 1, 0, 4]         [8, 8, 12, 12, 10, 14] same           36        10
[-1, 0, 1, 2, 3, 4, 5]      [21, 16, 13, 12, 13, 16, 21] same      49        12

over 3000 random trees of up to 61 nodes:
  the two agree on every node              3000
  node visits, walking from each root   3853211
  node visits, rerooting                 181714

same answers, and the work is linear rather than quadratic. The whole
saving comes from one line: crossing an edge into a subtree of size s
moves s nodes one step closer and n - s of them one step further, so the
new total is the old one plus n - 2s. Nothing is recomputed.`,
          explanation:
            "The same question answered n times and twice, with node visits counted so the difference is measured rather than asserted. The second pass is four lines, and the line that matters is the one adding n - 2s.",
          alternates: [
            {
              lang: "javascript",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.

/** Walk the whole tree from every node. n traversals, and n^2 edge visits. */
function byWalking(parent) {
  const n = parent.length;
  const neighbours = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  const sums = new Array(n).fill(0);
  let visits = 0;
  for (let start = 0; start < n; start++) {
    const distance = new Array(n).fill(-1);
    distance[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head++;
      visits++;
      for (const u of neighbours[v]) {
        if (distance[u] < 0) {
          distance[u] = distance[v] + 1;
          queue.push(u);
        }
      }
    }
    sums[start] = distance.reduce((a, b) => a + b, 0);
  }
  return [sums, visits];
}

/** Two linear passes: sizes and subtree sums up, then the root slid down. */
function byRerooting(parent) {
  const n = parent.length;
  const size = new Array(n).fill(1);
  const down = new Array(n).fill(0);
  let visits = 0;
  // Children come after parents in the array, so descending order is a
  // post-order: every child is final before its parent is touched.
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    size[p] += size[v];
    down[p] += down[v] + size[v];
    visits++;
  }
  const answer = new Array(n).fill(0);
  answer[0] = down[0];
  // Ascending order is the reverse: every parent is final before its children.
  for (let v = 1; v < n; v++) {
    // Crossing the edge into v moves size[v] nodes one step closer and the
    // other n - size[v] one step further away.
    answer[v] = answer[parent[v]] + n - 2 * size[v];
    visits++;
  }
  return [answer, visits];
}

const show = (values) => \`[\${values.join(", ")}]\`;
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

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
  [-1, 0, 0],
  [-1, 0, 1, 2],
  [-1, 0, 0, 1, 1],
  [-1, 0, 1, 1, 0, 4],
  [-1, 0, 1, 2, 3, 4, 5],
];

console.log(padEnd("parents", 28) + padEnd("distance sums per node", 32) + pad("walked", 8) + pad("rerooted", 10));
for (const parent of CASES) {
  const [walked, walkVisits] = byWalking(parent);
  const [rerooted, rerootVisits] = byRerooting(parent);
  const verdict = same(walked, rerooted) ? "same" : "DIFFER";
  console.log(
    padEnd(show(parent), 28) + padEnd(show(rerooted) + " " + verdict, 32) +
      pad(walkVisits, 8) + pad(rerootVisits, 10)
  );
}
console.log();

const TRIALS = 3000;
let agree = 0;
let walkTotal = 0;
let rerootTotal = 0;
let biggest = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(60);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const [walked, walkVisits] = byWalking(parent);
  const [rerooted, rerootVisits] = byRerooting(parent);
  if (same(walked, rerooted)) agree++;
  walkTotal += walkVisits;
  rerootTotal += rerootVisits;
  if (n > biggest) biggest = n;
}

console.log(\`over \${TRIALS} random trees of up to \${biggest} nodes:\`);
console.log("  the two agree on every node          " + pad(agree, 8));
console.log("  node visits, walking from each root  " + pad(walkTotal, 8));
console.log("  node visits, rerooting               " + pad(rerootTotal, 8));
console.log();
console.log("same answers, and the work is linear rather than quadratic. The whole");
console.log("saving comes from one line: crossing an edge into a subtree of size s");
console.log("moves s nodes one step closer and n - s of them one step further, so the");
console.log("new total is the old one plus n - 2s. Nothing is recomputed.");
`,
            },
            {
              lang: "typescript",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.

/** Walk the whole tree from every node. n traversals, and n^2 edge visits. */
function byWalking(parent: number[]): [number[], number] {
  const n = parent.length;
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) {
    neighbours[v].push(parent[v]);
    neighbours[parent[v]].push(v);
  }
  const sums = new Array(n).fill(0);
  let visits = 0;
  for (let start = 0; start < n; start++) {
    const distance = new Array(n).fill(-1);
    distance[start] = 0;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head];
      head++;
      visits++;
      for (const u of neighbours[v]) {
        if (distance[u] < 0) {
          distance[u] = distance[v] + 1;
          queue.push(u);
        }
      }
    }
    sums[start] = distance.reduce((a, b) => a + b, 0);
  }
  return [sums, visits];
}

/** Two linear passes: sizes and subtree sums up, then the root slid down. */
function byRerooting(parent: number[]): [number[], number] {
  const n = parent.length;
  const size = new Array(n).fill(1);
  const down = new Array(n).fill(0);
  let visits = 0;
  // Children come after parents in the array, so descending order is a
  // post-order: every child is final before its parent is touched.
  for (let v = n - 1; v > 0; v--) {
    const p = parent[v];
    size[p] += size[v];
    down[p] += down[v] + size[v];
    visits++;
  }
  const answer = new Array(n).fill(0);
  answer[0] = down[0];
  // Ascending order is the reverse: every parent is final before its children.
  for (let v = 1; v < n; v++) {
    // Crossing the edge into v moves size[v] nodes one step closer and the
    // other n - size[v] one step further away.
    answer[v] = answer[parent[v]] + n - 2 * size[v];
    visits++;
  }
  return [answer, visits];
}

const show = (values: number[]): string => \`[\${values.join(", ")}]\`;
const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

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
  [-1, 0, 0],
  [-1, 0, 1, 2],
  [-1, 0, 0, 1, 1],
  [-1, 0, 1, 1, 0, 4],
  [-1, 0, 1, 2, 3, 4, 5],
];

console.log(padEnd("parents", 28) + padEnd("distance sums per node", 32) + pad("walked", 8) + pad("rerooted", 10));
for (const parent of CASES) {
  const [walked, walkVisits] = byWalking(parent);
  const [rerooted, rerootVisits] = byRerooting(parent);
  const verdict = same(walked, rerooted) ? "same" : "DIFFER";
  console.log(
    padEnd(show(parent), 28) + padEnd(show(rerooted) + " " + verdict, 32) +
      pad(walkVisits, 8) + pad(rerootVisits, 10)
  );
}
console.log();

const TRIALS = 3000;
let agree = 0;
let walkTotal = 0;
let rerootTotal = 0;
let biggest = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 2 + rand(60);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(rand(v));
  const [walked, walkVisits] = byWalking(parent);
  const [rerooted, rerootVisits] = byRerooting(parent);
  if (same(walked, rerooted)) agree++;
  walkTotal += walkVisits;
  rerootTotal += rerootVisits;
  if (n > biggest) biggest = n;
}

console.log(\`over \${TRIALS} random trees of up to \${biggest} nodes:\`);
console.log("  the two agree on every node          " + pad(agree, 8));
console.log("  node visits, walking from each root  " + pad(walkTotal, 8));
console.log("  node visits, rerooting               " + pad(rerootTotal, 8));
console.log();
console.log("same answers, and the work is linear rather than quadratic. The whole");
console.log("saving comes from one line: crossing an edge into a subtree of size s");
console.log("moves s nodes one step closer and n - s of them one step further, so the");
console.log("new total is the old one plus n - 2s. Nothing is recomputed.");
`,
            },
            {
              lang: "java",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static long visits;

    // Walk the whole tree from every node. n traversals, and n^2 edge visits.
    static int[] byWalking(int[] parent) {
        int n = parent.length;
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int v = 0; v < n; v++) neighbours.add(new ArrayList<>());
        for (int v = 1; v < n; v++) {
            neighbours.get(v).add(parent[v]);
            neighbours.get(parent[v]).add(v);
        }
        int[] sums = new int[n];
        visits = 0;
        for (int start = 0; start < n; start++) {
            int[] distance = new int[n];
            Arrays.fill(distance, -1);
            distance[start] = 0;
            List<Integer> queue = new ArrayList<>();
            queue.add(start);
            int head = 0;
            while (head < queue.size()) {
                int v = queue.get(head);
                head++;
                visits++;
                for (int u : neighbours.get(v)) {
                    if (distance[u] < 0) {
                        distance[u] = distance[v] + 1;
                        queue.add(u);
                    }
                }
            }
            int total = 0;
            for (int d : distance) total += d;
            sums[start] = total;
        }
        return sums;
    }

    // Two linear passes: sizes and subtree sums up, then the root slid down.
    static int[] byRerooting(int[] parent) {
        int n = parent.length;
        int[] size = new int[n];
        Arrays.fill(size, 1);
        int[] down = new int[n];
        visits = 0;
        // Children come after parents in the array, so descending order is a
        // post-order: every child is final before its parent is touched.
        for (int v = n - 1; v > 0; v--) {
            int p = parent[v];
            size[p] += size[v];
            down[p] += down[v] + size[v];
            visits++;
        }
        int[] answer = new int[n];
        answer[0] = down[0];
        // Ascending order is the reverse: every parent is final before its children.
        for (int v = 1; v < n; v++) {
            // Crossing the edge into v moves size[v] nodes one step closer and the
            // other n - size[v] one step further away.
            answer[v] = answer[parent[v]] + n - 2 * size[v];
            visits++;
        }
        return answer;
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
            {-1, 0, 0},
            {-1, 0, 1, 2},
            {-1, 0, 0, 1, 1},
            {-1, 0, 1, 1, 0, 4},
            {-1, 0, 1, 2, 3, 4, 5},
        };

        System.out.println(padEnd("parents", 28) + padEnd("distance sums per node", 32)
            + pad("walked", 8) + pad("rerooted", 10));
        for (int[] parent : cases) {
            int[] walked = byWalking(parent);
            long walkVisits = visits;
            int[] rerooted = byRerooting(parent);
            long rerootVisits = visits;
            String verdict = Arrays.equals(walked, rerooted) ? "same" : "DIFFER";
            System.out.println(padEnd(show(parent), 28) + padEnd(show(rerooted) + " " + verdict, 32)
                + pad(walkVisits, 8) + pad(rerootVisits, 10));
        }
        System.out.println();

        int trials = 3000;
        int agree = 0, biggest = 0;
        long walkTotal = 0, rerootTotal = 0;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rand(60);
            int[] parent = new int[n];
            parent[0] = -1;
            for (int v = 1; v < n; v++) parent[v] = rand(v);
            int[] walked = byWalking(parent);
            walkTotal += visits;
            int[] rerooted = byRerooting(parent);
            rerootTotal += visits;
            if (Arrays.equals(walked, rerooted)) agree++;
            if (n > biggest) biggest = n;
        }

        System.out.println("over " + trials + " random trees of up to " + biggest + " nodes:");
        System.out.println("  the two agree on every node          " + pad(agree, 8));
        System.out.println("  node visits, walking from each root  " + pad(walkTotal, 8));
        System.out.println("  node visits, rerooting               " + pad(rerootTotal, 8));
        System.out.println();
        System.out.println("same answers, and the work is linear rather than quadratic. The whole");
        System.out.println("saving comes from one line: crossing an edge into a subtree of size s");
        System.out.println("moves s nodes one step closer and n - s of them one step further, so the");
        System.out.println("new total is the old one plus n - 2s. Nothing is recomputed.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

// Walk the whole tree from every node. n traversals, and n^2 node visits.
std::pair<std::vector<int>, std::int64_t> byWalking(const std::vector<int> &parent) {
    int n = static_cast<int>(parent.size());
    std::vector<std::vector<int>> neighbours(n);
    for (int v = 1; v < n; v++) {
        neighbours[v].push_back(parent[v]);
        neighbours[parent[v]].push_back(v);
    }
    std::vector<int> sums(n, 0);
    std::int64_t visits = 0;
    for (int start = 0; start < n; start++) {
        std::vector<int> distance(n, -1);
        distance[start] = 0;
        std::vector<int> queue = {start};
        for (size_t head = 0; head < queue.size(); head++) {
            int v = queue[head];
            visits++;
            for (int u : neighbours[v]) {
                if (distance[u] < 0) {
                    distance[u] = distance[v] + 1;
                    queue.push_back(u);
                }
            }
        }
        int total = 0;
        for (int d : distance) total += d;
        sums[start] = total;
    }
    return {sums, visits};
}

// Two linear passes: sizes and subtree sums up, then the root slid down.
std::pair<std::vector<int>, std::int64_t> byRerooting(const std::vector<int> &parent) {
    int n = static_cast<int>(parent.size());
    std::vector<int> size(n, 1), down(n, 0);
    std::int64_t visits = 0;
    // Children come after parents in the array, so descending order is a
    // post-order: every child is final before its parent is touched.
    for (int v = n - 1; v > 0; v--) {
        int p = parent[v];
        size[p] += size[v];
        down[p] += down[v] + size[v];
        visits++;
    }
    std::vector<int> answer(n, 0);
    answer[0] = down[0];
    // Ascending order is the reverse: every parent is final before its children.
    for (int v = 1; v < n; v++) {
        // Crossing the edge into v moves size[v] nodes one step closer and the
        // other n - size[v] one step further away.
        answer[v] = answer[parent[v]] + n - 2 * size[v];
        visits++;
    }
    return {answer, visits};
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
        {-1, 0, 0},
        {-1, 0, 1, 2},
        {-1, 0, 0, 1, 1},
        {-1, 0, 1, 1, 0, 4},
        {-1, 0, 1, 2, 3, 4, 5},
    };

    std::cout << std::left << std::setw(28) << "parents" << std::setw(32) << "distance sums per node"
              << std::right << std::setw(8) << "walked" << std::setw(10) << "rerooted" << "\\n";
    for (const auto &parent : cases) {
        auto walked = byWalking(parent);
        auto rerooted = byRerooting(parent);
        std::string verdict = walked.first == rerooted.first ? "same" : "DIFFER";
        std::cout << std::left << std::setw(28) << show(parent)
                  << std::setw(32) << (show(rerooted.first) + " " + verdict) << std::right
                  << std::setw(8) << walked.second << std::setw(10) << rerooted.second << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 3000;
    int agree = 0, biggest = 0;
    std::int64_t walkTotal = 0, rerootTotal = 0;
    for (int t = 0; t < TRIALS; t++) {
        int n = 2 + rnd(60);
        std::vector<int> parent(n);
        parent[0] = -1;
        for (int v = 1; v < n; v++) parent[v] = rnd(v);
        auto walked = byWalking(parent);
        auto rerooted = byRerooting(parent);
        if (walked.first == rerooted.first) agree++;
        walkTotal += walked.second;
        rerootTotal += rerooted.second;
        if (n > biggest) biggest = n;
    }

    std::cout << "over " << TRIALS << " random trees of up to " << biggest << " nodes:\\n";
    std::cout << "  the two agree on every node          " << std::setw(8) << agree << "\\n";
    std::cout << "  node visits, walking from each root  " << std::setw(8) << walkTotal << "\\n";
    std::cout << "  node visits, rerooting               " << std::setw(8) << rerootTotal << "\\n\\n";
    std::cout << "same answers, and the work is linear rather than quadratic. The whole\\n";
    std::cout << "saving comes from one line: crossing an edge into a subtree of size s\\n";
    std::cout << "moves s nodes one step closer and n - s of them one step further, so the\\n";
    std::cout << "new total is the old one plus n - 2s. Nothing is recomputed.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.

/// Walk the whole tree from every node. n traversals, and n^2 node visits.
fn by_walking(parent: &[i32]) -> (Vec<i64>, i64) {
    let n = parent.len();
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for v in 1..n {
        let p = parent[v] as usize;
        neighbours[v].push(p);
        neighbours[p].push(v);
    }
    let mut sums = vec![0i64; n];
    let mut visits = 0i64;
    for start in 0..n {
        let mut distance = vec![-1i64; n];
        distance[start] = 0;
        let mut queue = vec![start];
        let mut head = 0;
        while head < queue.len() {
            let v = queue[head];
            head += 1;
            visits += 1;
            for k in 0..neighbours[v].len() {
                let u = neighbours[v][k];
                if distance[u] < 0 {
                    distance[u] = distance[v] + 1;
                    queue.push(u);
                }
            }
        }
        sums[start] = distance.iter().sum();
    }
    (sums, visits)
}

/// Two linear passes: sizes and subtree sums up, then the root slid down.
fn by_rerooting(parent: &[i32]) -> (Vec<i64>, i64) {
    let n = parent.len();
    let mut size = vec![1i64; n];
    let mut down = vec![0i64; n];
    let mut visits = 0i64;
    // Children come after parents in the array, so descending order is a
    // post-order: every child is final before its parent is touched.
    for v in (1..n).rev() {
        let p = parent[v] as usize;
        size[p] += size[v];
        down[p] += down[v] + size[v];
        visits += 1;
    }
    let mut answer = vec![0i64; n];
    answer[0] = down[0];
    // Ascending order is the reverse: every parent is final before its children.
    for v in 1..n {
        // Crossing the edge into v moves size[v] nodes one step closer and the
        // other n - size[v] one step further away.
        answer[v] = answer[parent[v] as usize] + n as i64 - 2 * size[v];
        visits += 1;
    }
    (answer, visits)
}

fn show_i32(values: &[i32]) -> String {
    let parts: Vec<String> = values.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn show_i64(values: &[i64]) -> String {
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
    let cases: Vec<Vec<i32>> = vec![
        vec![-1, 0, 0],
        vec![-1, 0, 1, 2],
        vec![-1, 0, 0, 1, 1],
        vec![-1, 0, 1, 1, 0, 4],
        vec![-1, 0, 1, 2, 3, 4, 5],
    ];

    println!(
        "{:<28}{:<32}{:>8}{:>10}",
        "parents", "distance sums per node", "walked", "rerooted"
    );
    for parent in &cases {
        let (walked, walk_visits) = by_walking(parent);
        let (rerooted, reroot_visits) = by_rerooting(parent);
        let verdict = if walked == rerooted { "same" } else { "DIFFER" };
        println!(
            "{:<28}{:<32}{:>8}{:>10}",
            show_i32(parent),
            format!("{} {}", show_i64(&rerooted), verdict),
            walk_visits,
            reroot_visits
        );
    }
    println!();

    let trials = 3000;
    let mut rng = Rng { seed: 1 };
    let (mut agree, mut biggest) = (0, 0usize);
    let (mut walk_total, mut reroot_total) = (0i64, 0i64);
    for _ in 0..trials {
        let n = (2 + rng.next(60)) as usize;
        let mut parent = vec![-1i32; n];
        for v in 1..n {
            parent[v] = rng.next(v as i64) as i32;
        }
        let (walked, walk_visits) = by_walking(&parent);
        let (rerooted, reroot_visits) = by_rerooting(&parent);
        if walked == rerooted {
            agree += 1;
        }
        walk_total += walk_visits;
        reroot_total += reroot_visits;
        if n > biggest {
            biggest = n;
        }
    }

    println!("over {} random trees of up to {} nodes:", trials, biggest);
    println!("  the two agree on every node          {:>8}", agree);
    println!("  node visits, walking from each root  {:>8}", walk_total);
    println!("  node visits, rerooting               {:>8}", reroot_total);
    println!();
    println!("same answers, and the work is linear rather than quadratic. The whole");
    println!("saving comes from one line: crossing an edge into a subtree of size s");
    println!("moves s nodes one step closer and n - s of them one step further, so the");
    println!("new total is the old one plus n - 2s. Nothing is recomputed.");
}
`,
            },
            {
              lang: "go",
              code: `// Rerooting: computing an answer for every node as the root, in two passes
// rather than n.
//
// The question is the sum of distances from each node to all the others. Doing
// it directly means walking the whole tree once per node, which is O(n^2). The
// observation that removes a factor of n is that moving the root across one edge
// changes every distance by exactly one, in a direction that depends only on
// which side of the edge each node is on -- and the sizes of the two sides are
// already in the table.
//
// So: one pass upwards for subtree sizes and subtree distance sums, one pass
// downwards to slide the root along each edge. Two passes, both linear.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// byWalking walks the whole tree from every node: n traversals, and n^2 node visits.
func byWalking(parent []int) ([]int, int64) {
	n := len(parent)
	neighbours := make([][]int, n)
	for v := 1; v < n; v++ {
		neighbours[v] = append(neighbours[v], parent[v])
		neighbours[parent[v]] = append(neighbours[parent[v]], v)
	}
	sums := make([]int, n)
	var visits int64
	for start := 0; start < n; start++ {
		distance := make([]int, n)
		for i := range distance {
			distance[i] = -1
		}
		distance[start] = 0
		queue := []int{start}
		for head := 0; head < len(queue); head++ {
			v := queue[head]
			visits++
			for _, u := range neighbours[v] {
				if distance[u] < 0 {
					distance[u] = distance[v] + 1
					queue = append(queue, u)
				}
			}
		}
		total := 0
		for _, d := range distance {
			total += d
		}
		sums[start] = total
	}
	return sums, visits
}

// byRerooting runs two linear passes: sizes and subtree sums up, then the root slid down.
func byRerooting(parent []int) ([]int, int64) {
	n := len(parent)
	size := make([]int, n)
	for i := range size {
		size[i] = 1
	}
	down := make([]int, n)
	var visits int64
	// Children come after parents in the array, so descending order is a
	// post-order: every child is final before its parent is touched.
	for v := n - 1; v > 0; v-- {
		p := parent[v]
		size[p] += size[v]
		down[p] += down[v] + size[v]
		visits++
	}
	answer := make([]int, n)
	answer[0] = down[0]
	// Ascending order is the reverse: every parent is final before its children.
	for v := 1; v < n; v++ {
		// Crossing the edge into v moves size[v] nodes one step closer and the
		// other n - size[v] one step further away.
		answer[v] = answer[parent[v]] + n - 2*size[v]
		visits++
	}
	return answer, visits
}

func show(values []int) string {
	parts := make([]string, len(values))
	for i, v := range values {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func same(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	cases := [][]int{
		{-1, 0, 0},
		{-1, 0, 1, 2},
		{-1, 0, 0, 1, 1},
		{-1, 0, 1, 1, 0, 4},
		{-1, 0, 1, 2, 3, 4, 5},
	}

	fmt.Printf("%-28s%-32s%8s%10s\\n", "parents", "distance sums per node", "walked", "rerooted")
	for _, parent := range cases {
		walked, walkVisits := byWalking(parent)
		rerooted, rerootVisits := byRerooting(parent)
		verdict := "DIFFER"
		if same(walked, rerooted) {
			verdict = "same"
		}
		fmt.Printf("%-28s%-32s%8d%10d\\n", show(parent), show(rerooted)+" "+verdict,
			walkVisits, rerootVisits)
	}
	fmt.Println()

	trials := 3000
	agree, biggest := 0, 0
	var walkTotal, rerootTotal int64
	for t := 0; t < trials; t++ {
		n := 2 + rand(60)
		parent := make([]int, n)
		parent[0] = -1
		for v := 1; v < n; v++ {
			parent[v] = rand(v)
		}
		walked, walkVisits := byWalking(parent)
		rerooted, rerootVisits := byRerooting(parent)
		if same(walked, rerooted) {
			agree++
		}
		walkTotal += walkVisits
		rerootTotal += rerootVisits
		if n > biggest {
			biggest = n
		}
	}

	fmt.Printf("over %d random trees of up to %d nodes:\\n", trials, biggest)
	fmt.Printf("  the two agree on every node          %8d\\n", agree)
	fmt.Printf("  node visits, walking from each root  %8d\\n", walkTotal)
	fmt.Printf("  node visits, rerooting               %8d\\n", rerootTotal)
	fmt.Println()
	fmt.Println("same answers, and the work is linear rather than quadratic. The whole")
	fmt.Println("saving comes from one line: crossing an edge into a subtree of size s")
	fmt.Println("moves s nodes one step closer and n - s of them one step further, so the")
	fmt.Println("new total is the old one plus n - 2s. Nothing is recomputed.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "\"For every node\" almost always means rerooting",
          body: "Running the single-node algorithm n times is quadratic and recomputes nearly everything. Two passes \u2014 contributions upwards, complements downwards \u2014 give the same answers for every node in linear time; measured here, 181,714 node visits against 3,853,211.",
        },
        {
          title: "Work out the complement carefully, and check it against the slow version",
          body: "The whole technique rests on one line of arithmetic per problem, and getting it wrong produces plausible numbers. Keeping the O(n^2) version around and comparing every node on small trees costs nothing and is the only cheap way to be sure the algebra is right.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what identifies it",
      body: [
        "So the shape.",
        "**The table is the tree, and the fill order is free.** Children before parents for the upward pass, parents before children for the downward one. Trees are acyclic by definition, so unlike lessons 5 and 6 there is no order to establish and none to get wrong.",
        "**One value per node is usually not enough.** If the parent's decision depends on what the child did, that fact belongs in the state. Two states is the common case; problems with a colouring or a distance constraint need more.",
        "**Combine at every node, and keep the answer globally** when the quantity being asked for is a path or a shape rather than a subtree total. The recurrence being right does not mean the root holds the answer.",
        "**Reach for rerooting whenever the question says \"for every node\".** Two linear passes instead of `n` traversals, and the arithmetic for sliding across one edge is usually a couple of lines.",
        "Everything transfers from the earlier lessons. A tree is a graph without the cycle problem that ended lesson 5, so the boundary drawn there is exactly where this family begins; and the parent array trick means none of these programs need recursion, which matters more than it sounds when the tree is a path of a hundred thousand nodes and the default stack is not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Maximum-weight independent set on a tree \u2014 what is the state?",
      answer:
        "A node and a flag: the best for the subtree with the node taken, and the best with it skipped. One number per node fails the optimal-substructure requirement, because \"the best this subtree can do\" does not say whether the subtree's root was used, and that is what the parent needs before it can decide about itself. Folding a child into its parent is one line each \u2014 taking the parent forbids the child, so it contributes the child's skip value; skipping the parent leaves the child free, so it contributes the better of the child's two. Verified against every subset on 3,000 small trees it is right every time, while dropping either contribution scores 224 and greedy scores 2,324, which is high enough to look correct on any handful of examples.",
    },
    {
      question: "How do you compute the diameter of a tree, and where does the answer live?",
      answer:
        "Per node, keep the depths of the two deepest branches hanging below it; the longest path through that node is their sum. The answer is the maximum of that over all nodes, not the value at the root \u2014 the longest path has exactly one highest point and there is no reason for it to be the root. Reading the root instead gives the longest path through the root, which on 3,000 random trees agreed 2,895 times and was too small on 105. It is the same class of mistake as reading the bottom-right cell for longest common substring: the recurrence is correct and the reading is not.",
    },
    {
      question: "What is rerooting, and when would you use it?",
      answer:
        "When the question asks for an answer at every node rather than at one. Doing it directly is n traversals; rerooting is two. The upward pass computes what each subtree contributes; the downward pass converts a parent's answer into a child's by accounting for the edge between them. For sum of distances the arithmetic is one line: crossing into a subtree of size s brings those s nodes one step closer and pushes the other n - s one step further, so the answer changes by n - 2s. On 3,000 trees of up to 61 nodes the two approaches agreed on every node and cost 181,714 node visits against 3,853,211. The part that varies between problems is what the complement is, which is a small algebra exercise, so the sane practice is to keep the quadratic version as a test oracle.",
    },
    {
      question: "Why is fill order not a problem on trees, when it was on grids and intervals?",
      answer:
        "Because a tree is acyclic and rooted, so \"every child before its parent\" is always a valid topological order and it always exists. Lesson 5's four-direction grid had no such order at all \u2014 the dependencies were cyclic \u2014 and lesson 6's interval table had one, but not the row-major one people reach for. On a tree it comes for free from the structure. In these examples it is even free of recursion: with the tree stored as a parent array where each parent has a smaller index, a descending loop over the indices is a post-order and an ascending one is a pre-order. That matters in practice, because a tree that is essentially a path will overflow a default call stack long before it exhausts memory.",
    },
  ],
  takeaways: [
    "On a tree the table is the tree, and children-before-parents is always a valid fill order.",
    "With a parent array where `parent[i] < i`, a descending loop is a post-order and an ascending one a pre-order \u2014 no recursion needed.",
    "Independent set needs two values per node, because the parent must know whether the child was used.",
    "Dropping one of the two contributions was right 224 times out of 3,000, and never too large.",
    "A wrong answer that is always too small lost an option; one that is too large broke a constraint.",
    "Greedy by weight was right 2,324 times out of 3,000 \u2014 the usual dangerous fraction.",
    "The diameter is a maximum over all nodes, not the root's value: reading the root agreed 2,895 times out of 3,000.",
    "Rerooting answers \"for every node\" in two linear passes: 181,714 node visits against 3,853,211 here.",
    "Crossing an edge into a subtree of size `s` changes the distance sum by `n - 2s`, which is the whole saving.",
  ],
  status: "available",
};
