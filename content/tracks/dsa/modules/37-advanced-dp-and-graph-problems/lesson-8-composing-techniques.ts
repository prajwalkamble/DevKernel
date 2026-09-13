import type { Lesson } from "@/content/types";

export const composingTechniquesLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-composing-techniques",
  slug: "composing-techniques",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Composing Two Techniques: Binary Search Over a Matching",
  summary:
    "The problems that feel hard are usually two known techniques joined at a seam. Measured on minimising the longest assignment: binary search on the answer with a matching inside matched every permutation on 500 of 500 tables, and the plausible greedy matched 55.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Find the seam in a problem by asking what would be easy if the answer were given",
    "Combine binary search on the answer with bipartite matching",
    "Measure what the composition costs, including when it is not the cheaper option",
    "Recognise the common compositions",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "A problem no single technique solves",
      body: [
        "Assign `n` workers to `n` jobs, one each, where worker `w` takes `time[w][j]` on job `j`. Minimise the longest single assignment.",
        "No technique from earlier modules answers it alone. Bipartite matching finds whether a full assignment exists, but not the one minimising a maximum. Binary search finds a threshold, but needs a way to test each candidate. A greedy that always takes the cheapest free pair looks right and is not.",
        "The question that opens it up is: **what would be easy if the answer were given?** If someone claimed the answer is `T`, checking the claim is a matching problem \u2014 keep only the pairs with `time \u2264 T` and ask whether a perfect matching exists.",
      ],
    },
    {
      id: "the-composition",
      heading: "Binary search over a feasibility test",
      body: [
        "Feasibility is **monotone** in `T`: if a perfect matching exists using pairs of time at most `T`, it still exists when more pairs are allowed. So the smallest feasible `T` can be found by binary search over the sorted distinct times, with one matching per probe.",
        "The matching inside is Kuhn's augmenting-path algorithm, the unit-capacity case of the flow from lesson 7: for each worker, search for a free job or an assigned job whose worker can be moved elsewhere.",
        "Composed, the algorithm runs `log2(distinct times)` matchings instead of trying every value.",
      ],
      examples: [
        {
          id: "bottleneck-assignment",
          title: "Binary search plus matching against every permutation and a greedy, then the cost of scanning against searching",
          lang: "python",
          code: `# Assign n workers to n jobs so that the longest single assignment is as short
# as possible. No one technique solves it; two composed do: binary search on
# the answer, where each test is a bipartite matching on the edges allowed.
# Checked against every permutation, and against a greedy that looks plausible.

work = [0]


def has_perfect_matching(n, time, limit):
    # Kuhn's algorithm on the edges whose time is at most limit
    match_of_job = [-1] * n

    def try_worker(w, visited):
        for j in range(n):
            work[0] += 1
            if time[w][j] <= limit and not visited[j]:
                visited[j] = True
                if match_of_job[j] == -1 or try_worker(match_of_job[j], visited):
                    match_of_job[j] = w
                    return True
        return False

    for w in range(n):
        if not try_worker(w, [False] * n):
            return False
    return True


def by_binary_search(n, time):
    values = sorted(set(v for row in time for v in row))
    lo = 0
    hi = len(values) - 1
    checks = 0
    while lo < hi:
        mid = (lo + hi) // 2
        checks += 1
        if has_perfect_matching(n, time, values[mid]):
            hi = mid
        else:
            lo = mid + 1
    return values[lo], checks


def by_linear_scan(n, time):
    values = sorted(set(v for row in time for v in row))
    checks = 0
    for v in values:
        checks += 1
        if has_perfect_matching(n, time, v):
            return v, checks
    return values[-1], checks


def by_greedy(n, time):
    # take the cheapest remaining pair whose worker and job are both free
    pairs = []
    for w in range(n):
        for j in range(n):
            pairs.append((time[w][j], w, j))
    pairs.sort()
    worker_used = [False] * n
    job_used = [False] * n
    worst = 0
    for t, w, j in pairs:
        if not worker_used[w] and not job_used[j]:
            worker_used[w] = True
            job_used[j] = True
            worst = max(worst, t)
    return worst


def by_every_permutation(n, time):
    best = [None]
    used = [False] * n

    def place(w, worst):
        if best[0] is not None and worst >= best[0]:
            return
        if w == n:
            best[0] = worst
            return
        for j in range(n):
            if not used[j]:
                used[j] = True
                place(w + 1, max(worst, time[w][j]))
                used[j] = False

    place(0, 0)
    return best[0]


# The same linear congruential generator in every language, so the tables
# below are the same whichever translation is run.
seed = 96100043


def rand(k):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % k


def random_times(n):
    return [[1 + rand(1000) for _ in range(n)] for _ in range(n)]


TRIALS = 500
composed_right = 0
greedy_right = 0
for _ in range(TRIALS):
    n = 6
    time = random_times(n)
    truth = by_every_permutation(n, time)
    if by_binary_search(n, time)[0] == truth:
        composed_right += 1
    if by_greedy(n, time) == truth:
        greedy_right += 1
print("%d random 6 x 6 time tables, checked against all 720 assignments" % TRIALS)
print("  binary search on the answer + matching   right %d" % composed_right)
print("  greedy: cheapest free pair first         right %d" % greedy_right)
print()
print("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search")
for n in [10, 20, 40]:
    time = random_times(n)
    work[0] = 0
    a, scan_checks = by_linear_scan(n, time)
    scan_work = work[0]
    work[0] = 0
    b, search_checks = by_binary_search(n, time)
    search_work = work[0]
    distinct = len(set(v for row in time for v in row))
    note = "" if a == b else "   (disagree)"
    print("%10d %16d %21d %15d %19d %15d%s"
          % (n, distinct, scan_checks, search_checks, scan_work, search_work, note))
`,
          output: `500 random 6 x 6 time tables, checked against all 720 assignments
  binary search on the answer + matching   right 500
  greedy: cheapest free pair first         right 55

         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search
        10               96                    44               7                1221             644
        20              326                    60               8                2855            4995
        40              800                   105              10               67944           52365`,
          explanation:
            "On 500 random 6 by 6 tables, binary search on the answer with a matching test matched the best of all 720 assignments 500 times. The greedy that takes the cheapest free pair matched 55 times. The second table compares a linear scan over sorted times with binary search. Binary search ran 7, 8 and 10 matchings where the scan ran 44, 60 and 105. Edge checks tell a less tidy story: at n = 20 binary search spent 4,995 against the scan's 2,855, because its first probe is at the median time, a dense graph where matching is expensive, while the scan's early probes are sparse graphs that fail quickly. At n = 40 binary search was cheaper, 52,365 against 67,944.",
          alternates: [
            {
              lang: "javascript",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

let work = 0;

function hasPerfectMatching(n, time, limit) {
  // Kuhn's algorithm on the edges whose time is at most limit
  const matchOfJob = new Array(n).fill(-1);

  function tryWorker(w, visited) {
    for (let j = 0; j < n; j++) {
      work += 1;
      if (time[w][j] <= limit && !visited[j]) {
        visited[j] = true;
        if (matchOfJob[j] === -1 || tryWorker(matchOfJob[j], visited)) {
          matchOfJob[j] = w;
          return true;
        }
      }
    }
    return false;
  }

  for (let w = 0; w < n; w++) {
    if (!tryWorker(w, new Array(n).fill(false))) return false;
  }
  return true;
}

function distinctTimes(time) {
  const values = [...new Set(time.flat())];
  values.sort((a, b) => a - b);
  return values;
}

function byBinarySearch(n, time) {
  const values = distinctTimes(time);
  let lo = 0;
  let hi = values.length - 1;
  let checks = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    checks += 1;
    if (hasPerfectMatching(n, time, values[mid])) hi = mid;
    else lo = mid + 1;
  }
  return [values[lo], checks];
}

function byLinearScan(n, time) {
  const values = distinctTimes(time);
  let checks = 0;
  for (const v of values) {
    checks += 1;
    if (hasPerfectMatching(n, time, v)) return [v, checks];
  }
  return [values[values.length - 1], checks];
}

function byGreedy(n, time) {
  // take the cheapest remaining pair whose worker and job are both free
  const pairs = [];
  for (let w = 0; w < n; w++) {
    for (let j = 0; j < n; j++) pairs.push([time[w][j], w, j]);
  }
  pairs.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] !== y[1] ? x[1] - y[1] : x[2] - y[2]));
  const workerUsed = new Array(n).fill(false);
  const jobUsed = new Array(n).fill(false);
  let worst = 0;
  for (const [t, w, j] of pairs) {
    if (!workerUsed[w] && !jobUsed[j]) {
      workerUsed[w] = true;
      jobUsed[j] = true;
      worst = Math.max(worst, t);
    }
  }
  return worst;
}

function byEveryPermutation(n, time) {
  let best = -1;
  const used = new Array(n).fill(false);

  function place(w, worst) {
    if (best >= 0 && worst >= best) return;
    if (w === n) {
      best = worst;
      return;
    }
    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        used[j] = true;
        place(w + 1, Math.max(worst, time[w][j]));
        used[j] = false;
      }
    }
  }

  place(0, 0);
  return best;
}

// The same linear congruential generator in every language, so the tables
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 96100043n;

function rand(k) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function randomTimes(n) {
  const time = [];
  for (let w = 0; w < n; w++) {
    const row = [];
    for (let j = 0; j < n; j++) row.push(1 + rand(1000));
    time.push(row);
  }
  return time;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 500;
let composedRight = 0;
let greedyRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 6;
  const time = randomTimes(n);
  const truth = byEveryPermutation(n, time);
  if (byBinarySearch(n, time)[0] === truth) composedRight += 1;
  if (byGreedy(n, time) === truth) greedyRight += 1;
}
console.log(TRIALS + " random 6 x 6 time tables, checked against all 720 assignments");
console.log("  binary search on the answer + matching   right " + composedRight);
console.log("  greedy: cheapest free pair first         right " + greedyRight);
console.log();
console.log("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search");
for (const n of [10, 20, 40]) {
  const time = randomTimes(n);
  work = 0;
  const [a, scanChecks] = byLinearScan(n, time);
  const scanWork = work;
  work = 0;
  const [b, searchChecks] = byBinarySearch(n, time);
  const searchWork = work;
  const distinct = distinctTimes(time).length;
  const note = a === b ? "" : "   (disagree)";
  console.log(
    padLeft(n, 10) + " " + padLeft(distinct, 16) + " " + padLeft(scanChecks, 21) + " " + padLeft(searchChecks, 15) +
      " " + padLeft(scanWork, 19) + " " + padLeft(searchWork, 15) + note,
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

let work = 0;

function hasPerfectMatching(n: number, time: number[][], limit: number): boolean {
  // Kuhn's algorithm on the edges whose time is at most limit
  const matchOfJob = new Array(n).fill(-1);

  function tryWorker(w: number, visited: boolean[]): boolean {
    for (let j = 0; j < n; j++) {
      work += 1;
      if (time[w][j] <= limit && !visited[j]) {
        visited[j] = true;
        if (matchOfJob[j] === -1 || tryWorker(matchOfJob[j], visited)) {
          matchOfJob[j] = w;
          return true;
        }
      }
    }
    return false;
  }

  for (let w = 0; w < n; w++) {
    if (!tryWorker(w, new Array(n).fill(false))) return false;
  }
  return true;
}

function distinctTimes(time: number[][]): number[] {
  const values = [...new Set(time.flat())];
  values.sort((a, b) => a - b);
  return values;
}

function byBinarySearch(n: number, time: number[][]): [number, number] {
  const values = distinctTimes(time);
  let lo = 0;
  let hi = values.length - 1;
  let checks = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    checks += 1;
    if (hasPerfectMatching(n, time, values[mid])) hi = mid;
    else lo = mid + 1;
  }
  return [values[lo], checks];
}

function byLinearScan(n: number, time: number[][]): [number, number] {
  const values = distinctTimes(time);
  let checks = 0;
  for (const v of values) {
    checks += 1;
    if (hasPerfectMatching(n, time, v)) return [v, checks];
  }
  return [values[values.length - 1], checks];
}

function byGreedy(n: number, time: number[][]): number {
  // take the cheapest remaining pair whose worker and job are both free
  const pairs: Array<[number, number, number]> = [];
  for (let w = 0; w < n; w++) {
    for (let j = 0; j < n; j++) pairs.push([time[w][j], w, j]);
  }
  pairs.sort((x, y) => (x[0] !== y[0] ? x[0] - y[0] : x[1] !== y[1] ? x[1] - y[1] : x[2] - y[2]));
  const workerUsed = new Array(n).fill(false);
  const jobUsed = new Array(n).fill(false);
  let worst = 0;
  for (const [t, w, j] of pairs) {
    if (!workerUsed[w] && !jobUsed[j]) {
      workerUsed[w] = true;
      jobUsed[j] = true;
      worst = Math.max(worst, t);
    }
  }
  return worst;
}

function byEveryPermutation(n: number, time: number[][]): number {
  let best = -1;
  const used: boolean[] = new Array(n).fill(false);

  function place(w: number, worst: number): void {
    if (best >= 0 && worst >= best) return;
    if (w === n) {
      best = worst;
      return;
    }
    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        used[j] = true;
        place(w + 1, Math.max(worst, time[w][j]));
        used[j] = false;
      }
    }
  }

  place(0, 0);
  return best;
}

// The same linear congruential generator in every language, so the tables
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 96100043n;

function rand(k: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function randomTimes(n: number): number[][] {
  const time: number[][] = [];
  for (let w = 0; w < n; w++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(1 + rand(1000));
    time.push(row);
  }
  return time;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const TRIALS = 500;
let composedRight = 0;
let greedyRight = 0;
for (let t = 0; t < TRIALS; t++) {
  const n = 6;
  const time = randomTimes(n);
  const truth = byEveryPermutation(n, time);
  if (byBinarySearch(n, time)[0] === truth) composedRight += 1;
  if (byGreedy(n, time) === truth) greedyRight += 1;
}
console.log(TRIALS + " random 6 x 6 time tables, checked against all 720 assignments");
console.log("  binary search on the answer + matching   right " + composedRight);
console.log("  greedy: cheapest free pair first         right " + greedyRight);
console.log();
console.log("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search");
for (const n of [10, 20, 40]) {
  const time = randomTimes(n);
  work = 0;
  const [a, scanChecks] = byLinearScan(n, time);
  const scanWork = work;
  work = 0;
  const [b, searchChecks] = byBinarySearch(n, time);
  const searchWork = work;
  const distinct = distinctTimes(time).length;
  const note = a === b ? "" : "   (disagree)";
  console.log(
    padLeft(n, 10) + " " + padLeft(distinct, 16) + " " + padLeft(scanChecks, 21) + " " + padLeft(searchChecks, 15) +
      " " + padLeft(scanWork, 19) + " " + padLeft(searchWork, 15) + note,
  );
}
`,
            },
            {
              lang: "java",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.TreeSet;

public class Main {
  static long work = 0;

  // Kuhn's algorithm: try to give worker w a job, re-routing earlier workers
  static boolean tryWorker(int w, boolean[] visited, int n, int[][] time, int limit, int[] matchOfJob) {
    for (int j = 0; j < n; j++) {
      work += 1;
      if (time[w][j] <= limit && !visited[j]) {
        visited[j] = true;
        if (matchOfJob[j] == -1 || tryWorker(matchOfJob[j], visited, n, time, limit, matchOfJob)) {
          matchOfJob[j] = w;
          return true;
        }
      }
    }
    return false;
  }

  static boolean hasPerfectMatching(int n, int[][] time, int limit) {
    // matching on the edges whose time is at most limit
    int[] matchOfJob = new int[n];
    Arrays.fill(matchOfJob, -1);
    for (int w = 0; w < n; w++) {
      if (!tryWorker(w, new boolean[n], n, time, limit, matchOfJob)) {
        return false;
      }
    }
    return true;
  }

  static List<Integer> distinctTimes(int[][] time) {
    TreeSet<Integer> set = new TreeSet<>();
    for (int[] row : time) {
      for (int v : row) {
        set.add(v);
      }
    }
    return new ArrayList<>(set);
  }

  static int[] byBinarySearch(int n, int[][] time) {
    List<Integer> values = distinctTimes(time);
    int lo = 0;
    int hi = values.size() - 1;
    int checks = 0;
    while (lo < hi) {
      int mid = (lo + hi) / 2;
      checks += 1;
      if (hasPerfectMatching(n, time, values.get(mid))) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return new int[] {values.get(lo), checks};
  }

  static int[] byLinearScan(int n, int[][] time) {
    List<Integer> values = distinctTimes(time);
    int checks = 0;
    for (int v : values) {
      checks += 1;
      if (hasPerfectMatching(n, time, v)) {
        return new int[] {v, checks};
      }
    }
    return new int[] {values.get(values.size() - 1), checks};
  }

  static int byGreedy(int n, int[][] time) {
    // take the cheapest remaining pair whose worker and job are both free
    List<int[]> pairs = new ArrayList<>();
    for (int w = 0; w < n; w++) {
      for (int j = 0; j < n; j++) {
        pairs.add(new int[] {time[w][j], w, j});
      }
    }
    pairs.sort((x, y) -> x[0] != y[0] ? x[0] - y[0] : x[1] != y[1] ? x[1] - y[1] : x[2] - y[2]);
    boolean[] workerUsed = new boolean[n];
    boolean[] jobUsed = new boolean[n];
    int worst = 0;
    for (int[] pair : pairs) {
      if (!workerUsed[pair[1]] && !jobUsed[pair[2]]) {
        workerUsed[pair[1]] = true;
        jobUsed[pair[2]] = true;
        worst = Math.max(worst, pair[0]);
      }
    }
    return worst;
  }

  static int best;

  static void place(int w, int worst, int n, int[][] time, boolean[] used) {
    if (best >= 0 && worst >= best) {
      return;
    }
    if (w == n) {
      best = worst;
      return;
    }
    for (int j = 0; j < n; j++) {
      if (!used[j]) {
        used[j] = true;
        place(w + 1, Math.max(worst, time[w][j]), n, time, used);
        used[j] = false;
      }
    }
  }

  static int byEveryPermutation(int n, int[][] time) {
    best = -1;
    place(0, 0, n, time, new boolean[n]);
    return best;
  }

  // The same linear congruential generator in every language, so the tables
  // below are the same whichever translation is run.
  static long seed = 96100043L;

  static int rand(int k) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % k);
  }

  static int[][] randomTimes(int n) {
    int[][] time = new int[n][n];
    for (int w = 0; w < n; w++) {
      for (int j = 0; j < n; j++) {
        time[w][j] = 1 + rand(1000);
      }
    }
    return time;
  }

  public static void main(String[] args) {
    final int trials = 500;
    int composedRight = 0;
    int greedyRight = 0;
    for (int t = 0; t < trials; t++) {
      final int n = 6;
      int[][] time = randomTimes(n);
      int truth = byEveryPermutation(n, time);
      if (byBinarySearch(n, time)[0] == truth) {
        composedRight += 1;
      }
      if (byGreedy(n, time) == truth) {
        greedyRight += 1;
      }
    }
    System.out.printf("%d random 6 x 6 time tables, checked against all 720 assignments%n", trials);
    System.out.println("  binary search on the answer + matching   right " + composedRight);
    System.out.println("  greedy: cheapest free pair first         right " + greedyRight);
    System.out.println();
    System.out.println("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search");
    int[] sizes = {10, 20, 40};
    for (int n : sizes) {
      int[][] time = randomTimes(n);
      work = 0;
      int[] scan = byLinearScan(n, time);
      long scanWork = work;
      work = 0;
      int[] search = byBinarySearch(n, time);
      long searchWork = work;
      int distinct = distinctTimes(time).size();
      String note = scan[0] == search[0] ? "" : "   (disagree)";
      System.out.printf("%10d %16d %21d %15d %19d %15d%s%n", n, distinct, scan[1], search[1], scanWork, searchWork, note);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

#include <algorithm>
#include <cstdio>
#include <set>
#include <tuple>
#include <utility>
#include <vector>

typedef std::vector<std::vector<int> > Table;

long long work = 0;

// Kuhn's algorithm: try to give worker w a job, re-routing earlier workers
bool tryWorker(int w, std::vector<bool>& visited, int n, const Table& time, int limit,
               std::vector<int>& matchOfJob) {
  for (int j = 0; j < n; j++) {
    work += 1;
    if (time[w][j] <= limit && !visited[j]) {
      visited[j] = true;
      if (matchOfJob[j] == -1 || tryWorker(matchOfJob[j], visited, n, time, limit, matchOfJob)) {
        matchOfJob[j] = w;
        return true;
      }
    }
  }
  return false;
}

bool hasPerfectMatching(int n, const Table& time, int limit) {
  // matching on the edges whose time is at most limit
  std::vector<int> matchOfJob(n, -1);
  for (int w = 0; w < n; w++) {
    std::vector<bool> visited(n, false);
    if (!tryWorker(w, visited, n, time, limit, matchOfJob)) {
      return false;
    }
  }
  return true;
}

std::vector<int> distinctTimes(const Table& time) {
  std::set<int> set;
  for (const std::vector<int>& row : time) {
    set.insert(row.begin(), row.end());
  }
  return std::vector<int>(set.begin(), set.end());
}

std::pair<int, int> byBinarySearch(int n, const Table& time) {
  std::vector<int> values = distinctTimes(time);
  int lo = 0;
  int hi = (int)values.size() - 1;
  int checks = 0;
  while (lo < hi) {
    int mid = (lo + hi) / 2;
    checks += 1;
    if (hasPerfectMatching(n, time, values[mid])) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return std::make_pair(values[lo], checks);
}

std::pair<int, int> byLinearScan(int n, const Table& time) {
  std::vector<int> values = distinctTimes(time);
  int checks = 0;
  for (int v : values) {
    checks += 1;
    if (hasPerfectMatching(n, time, v)) {
      return std::make_pair(v, checks);
    }
  }
  return std::make_pair(values.back(), checks);
}

int byGreedy(int n, const Table& time) {
  // take the cheapest remaining pair whose worker and job are both free
  std::vector<std::tuple<int, int, int> > pairs;
  for (int w = 0; w < n; w++) {
    for (int j = 0; j < n; j++) {
      pairs.push_back(std::make_tuple(time[w][j], w, j));
    }
  }
  std::sort(pairs.begin(), pairs.end());
  std::vector<bool> workerUsed(n, false);
  std::vector<bool> jobUsed(n, false);
  int worst = 0;
  for (const std::tuple<int, int, int>& pair : pairs) {
    int t = std::get<0>(pair);
    int w = std::get<1>(pair);
    int j = std::get<2>(pair);
    if (!workerUsed[w] && !jobUsed[j]) {
      workerUsed[w] = true;
      jobUsed[j] = true;
      worst = std::max(worst, t);
    }
  }
  return worst;
}

void place(int w, int worst, int n, const Table& time, std::vector<bool>& used, int& best) {
  if (best >= 0 && worst >= best) {
    return;
  }
  if (w == n) {
    best = worst;
    return;
  }
  for (int j = 0; j < n; j++) {
    if (!used[j]) {
      used[j] = true;
      place(w + 1, std::max(worst, time[w][j]), n, time, used, best);
      used[j] = false;
    }
  }
}

int byEveryPermutation(int n, const Table& time) {
  int best = -1;
  std::vector<bool> used(n, false);
  place(0, 0, n, time, used, best);
  return best;
}

// The same linear congruential generator in every language, so the tables
// below are the same whichever translation is run.
long long seed = 96100043LL;

int rand_below(int k) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % k);
}

Table randomTimes(int n) {
  Table time(n, std::vector<int>(n, 0));
  for (int w = 0; w < n; w++) {
    for (int j = 0; j < n; j++) {
      time[w][j] = 1 + rand_below(1000);
    }
  }
  return time;
}

int main() {
  const int trials = 500;
  int composedRight = 0;
  int greedyRight = 0;
  for (int t = 0; t < trials; t++) {
    const int n = 6;
    Table time = randomTimes(n);
    int truth = byEveryPermutation(n, time);
    if (byBinarySearch(n, time).first == truth) {
      composedRight += 1;
    }
    if (byGreedy(n, time) == truth) {
      greedyRight += 1;
    }
  }
  std::printf("%d random 6 x 6 time tables, checked against all 720 assignments\\n", trials);
  std::printf("  binary search on the answer + matching   right %d\\n", composedRight);
  std::printf("  greedy: cheapest free pair first         right %d\\n", greedyRight);
  std::printf("\\n");
  std::printf("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search\\n");
  int sizes[3] = {10, 20, 40};
  for (int n : sizes) {
    Table time = randomTimes(n);
    work = 0;
    std::pair<int, int> scan = byLinearScan(n, time);
    long long scanWork = work;
    work = 0;
    std::pair<int, int> search = byBinarySearch(n, time);
    long long searchWork = work;
    int distinct = (int)distinctTimes(time).size();
    std::printf("%10d %16d %21d %15d %19lld %15lld%s\\n", n, distinct, scan.second, search.second, scanWork,
                searchWork, scan.first == search.first ? "" : "   (disagree)");
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

use std::collections::BTreeSet;

type Table = Vec<Vec<i64>>;

// Kuhn's algorithm: try to give worker w a job, re-routing earlier workers
fn try_worker(w: usize, visited: &mut [bool], time: &Table, limit: i64, match_of_job: &mut [i64], work: &mut i64) -> bool {
    let n = time.len();
    for j in 0..n {
        *work += 1;
        if time[w][j] <= limit && !visited[j] {
            visited[j] = true;
            if match_of_job[j] == -1 || try_worker(match_of_job[j] as usize, visited, time, limit, match_of_job, work) {
                match_of_job[j] = w as i64;
                return true;
            }
        }
    }
    false
}

fn has_perfect_matching(time: &Table, limit: i64, work: &mut i64) -> bool {
    // matching on the edges whose time is at most limit
    let n = time.len();
    let mut match_of_job = vec![-1i64; n];
    for w in 0..n {
        let mut visited = vec![false; n];
        if !try_worker(w, &mut visited, time, limit, &mut match_of_job, work) {
            return false;
        }
    }
    true
}

fn distinct_times(time: &Table) -> Vec<i64> {
    let set: BTreeSet<i64> = time.iter().flatten().cloned().collect();
    set.into_iter().collect()
}

fn by_binary_search(time: &Table, work: &mut i64) -> (i64, i64) {
    let values = distinct_times(time);
    let mut lo = 0;
    let mut hi = values.len() - 1;
    let mut checks = 0;
    while lo < hi {
        let mid = (lo + hi) / 2;
        checks += 1;
        if has_perfect_matching(time, values[mid], work) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    (values[lo], checks)
}

fn by_linear_scan(time: &Table, work: &mut i64) -> (i64, i64) {
    let values = distinct_times(time);
    let mut checks = 0;
    for &v in values.iter() {
        checks += 1;
        if has_perfect_matching(time, v, work) {
            return (v, checks);
        }
    }
    (*values.last().unwrap(), checks)
}

fn by_greedy(time: &Table) -> i64 {
    // take the cheapest remaining pair whose worker and job are both free
    let n = time.len();
    let mut pairs: Vec<(i64, usize, usize)> = Vec::new();
    for w in 0..n {
        for j in 0..n {
            pairs.push((time[w][j], w, j));
        }
    }
    pairs.sort();
    let mut worker_used = vec![false; n];
    let mut job_used = vec![false; n];
    let mut worst = 0;
    for &(t, w, j) in pairs.iter() {
        if !worker_used[w] && !job_used[j] {
            worker_used[w] = true;
            job_used[j] = true;
            worst = worst.max(t);
        }
    }
    worst
}

fn place(w: usize, worst: i64, time: &Table, used: &mut [bool], best: &mut Option<i64>) {
    if let Some(b) = *best {
        if worst >= b {
            return;
        }
    }
    if w == time.len() {
        *best = Some(worst);
        return;
    }
    for j in 0..time.len() {
        if !used[j] {
            used[j] = true;
            place(w + 1, worst.max(time[w][j]), time, used, best);
            used[j] = false;
        }
    }
}

fn by_every_permutation(time: &Table) -> i64 {
    let mut best = None;
    let mut used = vec![false; time.len()];
    place(0, 0, time, &mut used, &mut best);
    best.unwrap()
}

// The same linear congruential generator in every language, so the tables
// below are the same whichever translation is run.
static mut SEED: i64 = 96100043;

fn rand_below(k: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % k
    }
}

fn random_times(n: usize) -> Table {
    let mut time = vec![vec![0i64; n]; n];
    for w in 0..n {
        for j in 0..n {
            time[w][j] = 1 + rand_below(1000);
        }
    }
    time
}

fn main() {
    let trials = 500;
    let mut ignored = 0;
    let mut composed_right = 0;
    let mut greedy_right = 0;
    for _ in 0..trials {
        let time = random_times(6);
        let truth = by_every_permutation(&time);
        if by_binary_search(&time, &mut ignored).0 == truth {
            composed_right += 1;
        }
        if by_greedy(&time) == truth {
            greedy_right += 1;
        }
    }
    println!("{} random 6 x 6 time tables, checked against all 720 assignments", trials);
    println!("  binary search on the answer + matching   right {}", composed_right);
    println!("  greedy: cheapest free pair first         right {}", greedy_right);
    println!();
    println!("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search");
    for &n in [10usize, 20, 40].iter() {
        let time = random_times(n);
        let mut scan_work = 0;
        let (a, scan_checks) = by_linear_scan(&time, &mut scan_work);
        let mut search_work = 0;
        let (b, search_checks) = by_binary_search(&time, &mut search_work);
        let distinct = distinct_times(&time).len();
        let note = if a == b { "" } else { "   (disagree)" };
        println!(
            "{:>10} {:>16} {:>21} {:>15} {:>19} {:>15}{}",
            n, distinct, scan_checks, search_checks, scan_work, search_work, note
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Assign n workers to n jobs so that the longest single assignment is as short
// as possible. No one technique solves it; two composed do: binary search on
// the answer, where each test is a bipartite matching on the edges allowed.
// Checked against every permutation, and against a greedy that looks plausible.

package main

import (
	"fmt"
	"sort"
)

var work int64

func hasPerfectMatching(n int, time [][]int, limit int) bool {
	// Kuhn's algorithm on the edges whose time is at most limit
	matchOfJob := make([]int, n)
	for i := range matchOfJob {
		matchOfJob[i] = -1
	}
	var tryWorker func(w int, visited []bool) bool
	tryWorker = func(w int, visited []bool) bool {
		for j := 0; j < n; j++ {
			work++
			if time[w][j] <= limit && !visited[j] {
				visited[j] = true
				if matchOfJob[j] == -1 || tryWorker(matchOfJob[j], visited) {
					matchOfJob[j] = w
					return true
				}
			}
		}
		return false
	}
	for w := 0; w < n; w++ {
		if !tryWorker(w, make([]bool, n)) {
			return false
		}
	}
	return true
}

func distinctTimes(time [][]int) []int {
	seen := map[int]bool{}
	values := []int{}
	for _, row := range time {
		for _, v := range row {
			if !seen[v] {
				seen[v] = true
				values = append(values, v)
			}
		}
	}
	sort.Ints(values)
	return values
}

func byBinarySearch(n int, time [][]int) (int, int) {
	values := distinctTimes(time)
	lo := 0
	hi := len(values) - 1
	checks := 0
	for lo < hi {
		mid := (lo + hi) / 2
		checks++
		if hasPerfectMatching(n, time, values[mid]) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return values[lo], checks
}

func byLinearScan(n int, time [][]int) (int, int) {
	values := distinctTimes(time)
	checks := 0
	for _, v := range values {
		checks++
		if hasPerfectMatching(n, time, v) {
			return v, checks
		}
	}
	return values[len(values)-1], checks
}

func byGreedy(n int, time [][]int) int {
	// take the cheapest remaining pair whose worker and job are both free
	pairs := [][3]int{}
	for w := 0; w < n; w++ {
		for j := 0; j < n; j++ {
			pairs = append(pairs, [3]int{time[w][j], w, j})
		}
	}
	sort.Slice(pairs, func(x, y int) bool {
		for i := 0; i < 3; i++ {
			if pairs[x][i] != pairs[y][i] {
				return pairs[x][i] < pairs[y][i]
			}
		}
		return false
	})
	workerUsed := make([]bool, n)
	jobUsed := make([]bool, n)
	worst := 0
	for _, p := range pairs {
		if !workerUsed[p[1]] && !jobUsed[p[2]] {
			workerUsed[p[1]] = true
			jobUsed[p[2]] = true
			worst = max(worst, p[0])
		}
	}
	return worst
}

func byEveryPermutation(n int, time [][]int) int {
	best := -1
	used := make([]bool, n)
	var place func(w, worst int)
	place = func(w, worst int) {
		if best >= 0 && worst >= best {
			return
		}
		if w == n {
			best = worst
			return
		}
		for j := 0; j < n; j++ {
			if !used[j] {
				used[j] = true
				place(w+1, max(worst, time[w][j]))
				used[j] = false
			}
		}
	}
	place(0, 0)
	return best
}

// The same linear congruential generator in every language, so the tables
// below are the same whichever translation is run.
var seed int64 = 96100043

func randBelow(k int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(k))
}

func randomTimes(n int) [][]int {
	time := make([][]int, n)
	for w := range time {
		time[w] = make([]int, n)
		for j := range time[w] {
			time[w][j] = 1 + randBelow(1000)
		}
	}
	return time
}

func main() {
	const trials = 500
	composedRight := 0
	greedyRight := 0
	for t := 0; t < trials; t++ {
		const n = 6
		time := randomTimes(n)
		truth := byEveryPermutation(n, time)
		if value, _ := byBinarySearch(n, time); value == truth {
			composedRight++
		}
		if byGreedy(n, time) == truth {
			greedyRight++
		}
	}
	fmt.Printf("%d random 6 x 6 time tables, checked against all 720 assignments\\n", trials)
	fmt.Printf("  binary search on the answer + matching   right %d\\n", composedRight)
	fmt.Printf("  greedy: cheapest free pair first         right %d\\n", greedyRight)
	fmt.Println()
	fmt.Println("         n   distinct times   matchings run: scan   binary search   edge checks: scan   binary search")
	for _, n := range []int{10, 20, 40} {
		time := randomTimes(n)
		work = 0
		a, scanChecks := byLinearScan(n, time)
		scanWork := work
		work = 0
		b, searchChecks := byBinarySearch(n, time)
		searchWork := work
		note := ""
		if a != b {
			note = "   (disagree)"
		}
		fmt.Printf("%10d %16d %21d %15d %19d %15d%s\\n", n, len(distinctTimes(time)), scanChecks, searchChecks, scanWork, searchWork, note)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "reading-it",
      heading: "What the measurement says about compositions",
      body: [
        "**The greedy fails because the problem has two parts.** Taking the cheapest pair is locally right and globally wrong: it can use a job that a later worker needed, forcing that worker onto an expensive one. 55 of 500 is roughly how often that never happened.",
        "**The number of inner calls is the reliable win, not always the total work.** Binary search cut matchings from 105 to 10 at n = 40. But the cost of each inner call depends on where it is made, and the n = 20 row shows a linear scan winning on edge checks because its early probes were cheap. When the inner test's cost varies with the candidate, measure the total, not the probe count.",
        "**The seam is where the two techniques exchange a single value.** Binary search produces `T`; matching consumes it and returns yes or no. Compositions that pass one small value across the seam are the easy ones to get right.",
      ],
    },
    {
      id: "common-compositions",
      heading: "Common compositions",
      body: [
        "**Binary search on the answer + a graph search.** Minimise the largest edge on a path, or the earliest time two regions connect: guess the value, keep the edges allowed, test connectivity.",
        "**Sorting + union-find.** Answer offline queries of the form \"are these connected using edges of weight at most w\" by sorting queries and edges together and merging as the threshold rises.",
        "**Euler tour + a range structure.** Subtree queries on a changing tree, from lesson 6.",
        "**Binary lifting + aggregates.** Path maxima and sums between arbitrary nodes, from lesson 5.",
        "**Shortest paths + DP over an extra dimension.** Hop limits, fuel limits or discount tickets, as a state of (node, resource used), from lesson 4.",
        "**Bitmask DP + precomputed shortest paths.** Visit a small set of required nodes in the best order: all-pairs distances between them first, then DP over subsets.",
        "In each, the question is the same as here: which part becomes easy if another part's answer is given, and is that dependence monotone or small enough to enumerate?",
      ],
      pitfalls: [
        {
          title: "Binary searching a feasibility test that is not monotone",
          body: "If raising the threshold can turn yes into no, the search converges on a wrong boundary. Check monotonicity before using it.",
        },
        {
          title: "Searching over the full value range instead of the candidate values",
          body: "The answer is always one of the given times. Searching the distinct sorted values needs fewer probes and never tests an impossible value.",
        },
        {
          title: "Trusting probe counts as the cost",
          body: "Measured at n = 20: 8 matchings cost more edge checks than 60, because each probe's cost depends on the candidate. Count the inner work.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you assign n workers to n jobs to minimise the longest assignment?",
      answer:
        "Binary search on the answer with bipartite matching as the test. If the answer were T, feasibility is just whether a perfect matching exists using only pairs with time at most T, and that is monotone in T, so binary search over the sorted distinct times finds the smallest feasible one with a logarithmic number of matchings. I checked it against all 720 assignments on 500 random 6 by 6 tables and it matched every time; a greedy that takes the cheapest free pair matched only 55.",
    },
    {
      question: "How do you approach a problem that doesn't match any single known technique?",
      answer:
        "Look for the seam: ask what would be easy if part of the answer were given. Minimising a maximum usually becomes a yes-or-no question for a fixed threshold, which is binary search on the answer if the yes-or-no is monotone; the test itself is often a known algorithm like matching, BFS or union-find. Then measure the composition honestly. In my bottleneck assignment measurement binary search ran 8 matchings where a linear scan ran 60, but spent more edge checks at n = 20, because its first probe was on a dense graph -- so count the inner work, not only the number of probes.",
    },
  ],
  takeaways: [
    "Hard problems are often two known techniques joined at a seam",
    "Ask what becomes easy if part of the answer is given",
    "Minimise a maximum: binary search on a monotone feasibility test",
    "Measured: binary search + matching 500 of 500, greedy 55",
    "Measured at n = 40: 10 matchings against 105 for a linear scan",
    "Inner-call cost varies by candidate; at n = 20 the scan used fewer edge checks",
    "Search the candidate values, and check monotonicity first",
  ],
};
