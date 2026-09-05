/**
 * Dynamic programming, shown as the table filling in.
 *
 * A DP table is the one place where the picture genuinely is the algorithm:
 * every cell is a subproblem, and watching the dependencies light up as each
 * cell is computed is what turns a recurrence from notation into a mechanism.
 */
import { Recorder, type MatrixFrame, type Role, type Visualisation, cellKey } from "./types";

function matrixRecorder() {
  const rec = new Recorder<MatrixFrame>();
  const emit = (
    cells: string[][], roles: Record<string, Role>, note: string,
    rowLabels?: string[], colLabels?: string[]
  ) => rec.push({ kind: "matrix", cells: cells.map((r) => [...r]), roles, note, rowLabels, colLabels });
  return { rec, emit };
}

/* ---------------------------------------------------------------- Fibonacci -- */

export function fibonacciMemo(n = 8): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const memo: (number | undefined)[] = new Array(n + 1).fill(undefined);
  // A memo table's whole point is which cells are *not* filled in yet, and a
  // bar chart has no way to say that — an uncomputed cell and a cell holding
  // zero would draw identically, which is precisely the distinction being
  // taught. Cells can be blank.
  const emit = (roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: [memo.map((v) => (v === undefined ? "" : String(v)))],
      roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [`0,${k}`, v])),
      colLabels: memo.map((_, i) => `fib(${i})`),
      rowLabels: ["memo"],
      note,
    });

  emit({}, `Computing fib(${n}) bottom-up. Each cell is a subproblem solved exactly once.`);
  memo[0] = 0;
  emit({ 0: "sorted" }, "fib(0) = 0, by definition.");
  if (n >= 1) {
    memo[1] = 1;
    emit({ 0: "sorted", 1: "sorted" }, "fib(1) = 1, by definition.");
  }
  for (let i = 2; i <= n; i++) {
    rec.bump("additions");
    emit({ [i - 2]: "compare", [i - 1]: "compare", [i]: "active" },
      `fib(${i}) needs fib(${i - 2}) = ${memo[i - 2]} and fib(${i - 1}) = ${memo[i - 1]}.`);
    memo[i] = memo[i - 1]! + memo[i - 2]!;
    const done: Record<number, Role> = {};
    for (let k = 0; k <= i; k++) done[k] = "sorted";
    emit(done, `fib(${i}) = ${memo[i]}. Stored, and never recomputed.`);
  }
  return {
    frames: rec.frames,
    summary:
      `The naive recursion recomputes fib(${n - 2}) and its subtree over and over — 2.7 million calls by fib(30). Storing each answer as it is computed makes the cost linear, because there are only n distinct subproblems. This is the entire idea of dynamic programming; everything else is choosing what the subproblems are.`,
  };
}

/* ------------------------------------------------------------------- LCS -- */

export function longestCommonSubsequence(a = "ABCBDAB", b = "BDCABA"): Visualisation {
  const { rec, emit } = matrixRecorder();
  const rows = a.length + 1;
  const cols = b.length + 1;
  const cells: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(""));
  const rowLabels = ["·", ...a];
  const colLabels = ["·", ...b];
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) cells[i][0] = "0";
  for (let j = 0; j < cols; j++) cells[0][j] = "0";
  emit(cells, {}, `An empty prefix shares nothing, so the first row and column are 0.`, rowLabels, colLabels);

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      rec.bump("cells");
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        cells[i][j] = String(dp[i][j]);
        emit(cells, { [cellKey(i, j)]: "swap", [cellKey(i - 1, j - 1)]: "compare" },
          `'${a[i - 1]}' matches '${b[j - 1]}', so extend the diagonal: ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.`,
          rowLabels, colLabels);
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        cells[i][j] = String(dp[i][j]);
        emit(cells, { [cellKey(i, j)]: "active", [cellKey(i - 1, j)]: "compare", [cellKey(i, j - 1)]: "compare" },
          `'${a[i - 1]}' ≠ '${b[j - 1]}', so take the better of above (${dp[i - 1][j]}) and left (${dp[i][j - 1]}).`,
          rowLabels, colLabels);
      }
    }
  }
  emit(cells, { [cellKey(rows - 1, cols - 1)]: "found" },
    `The bottom-right cell is the answer: the longest common subsequence has length ${dp[rows - 1][cols - 1]}.`,
    rowLabels, colLabels);
  return {
    frames: rec.frames,
    summary:
      "Each cell answers one subproblem: the LCS length of two prefixes. Matching characters extend the diagonal by one; a mismatch takes the better of dropping one character from either string. Every cell depends only on three neighbours, which is why the whole table fills in O(mn) — and why the recurrence is easier to see here than to read.",
  };
}

/* --------------------------------------------------------- edit distance -- */

export function editDistance(a = "kitten", b = "sitting"): Visualisation {
  const { rec, emit } = matrixRecorder();
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const cells: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(""));
  const rowLabels = ["·", ...a];
  const colLabels = ["·", ...b];

  for (let i = 0; i < rows; i++) { dp[i][0] = i; cells[i][0] = String(i); }
  for (let j = 0; j < cols; j++) { dp[0][j] = j; cells[0][j] = String(j); }
  emit(cells, {}, "Turning a prefix into nothing costs one deletion per character — that is the first row and column.",
    rowLabels, colLabels);

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      rec.bump("cells");
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      cells[i][j] = String(dp[i][j]);
      const why = cost === 0
        ? `'${a[i - 1]}' matches '${b[j - 1]}', so the diagonal carries straight through at no cost.`
        : `'${a[i - 1]}' ≠ '${b[j - 1]}': the cheapest of delete (${dp[i - 1][j]}+1), insert (${dp[i][j - 1]}+1) or substitute (${dp[i - 1][j - 1]}+1) is ${dp[i][j]}.`;
      emit(cells, {
        [cellKey(i, j)]: cost === 0 ? "swap" : "active",
        [cellKey(i - 1, j)]: "compare",
        [cellKey(i, j - 1)]: "compare",
        [cellKey(i - 1, j - 1)]: "compare",
      }, why, rowLabels, colLabels);
    }
  }
  emit(cells, { [cellKey(rows - 1, cols - 1)]: "found" },
    `"${a}" becomes "${b}" in ${dp[rows - 1][cols - 1]} edits.`, rowLabels, colLabels);
  return {
    frames: rec.frames,
    summary:
      "Levenshtein distance: the fewest single-character insertions, deletions and substitutions turning one string into another. Each cell takes the cheapest of three neighbours, and the diagonal is free when the characters already match. O(mn) time and — if you keep only the previous row — O(n) space.",
  };
}

/* ---------------------------------------------------------------- knapsack -- */

export function knapsack(): Visualisation {
  const { rec, emit } = matrixRecorder();
  const items = [
    { name: "map", weight: 1, value: 1 },
    { name: "rope", weight: 3, value: 4 },
    { name: "torch", weight: 4, value: 5 },
    { name: "axe", weight: 5, value: 7 },
  ];
  const capacity = 7;
  const rows = items.length + 1;
  const cols = capacity + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const cells: string[][] = Array.from({ length: rows }, () => new Array(cols).fill("0"));
  const rowLabels = ["none", ...items.map((i) => `${i.name} ${i.weight}kg/£${i.value}`)];
  const colLabels = Array.from({ length: cols }, (_, c) => String(c));

  emit(cells, {}, "Rows add one item at a time; columns are the capacity available. With no items the best value is 0.",
    rowLabels, colLabels);

  for (let i = 1; i < rows; i++) {
    const item = items[i - 1];
    for (let w = 0; w < cols; w++) {
      rec.bump("cells");
      if (item.weight > w) {
        dp[i][w] = dp[i - 1][w];
        cells[i][w] = String(dp[i][w]);
        emit(cells, { [cellKey(i, w)]: "discarded", [cellKey(i - 1, w)]: "compare" },
          `${item.name} weighs ${item.weight}kg and only ${w}kg is free — it cannot be taken.`,
          rowLabels, colLabels);
      } else {
        const skip = dp[i - 1][w];
        const take = dp[i - 1][w - item.weight] + item.value;
        dp[i][w] = Math.max(skip, take);
        cells[i][w] = String(dp[i][w]);
        emit(cells, {
          [cellKey(i, w)]: take > skip ? "swap" : "active",
          [cellKey(i - 1, w)]: "compare",
          [cellKey(i - 1, w - item.weight)]: "compare",
        }, take > skip
          ? `Taking ${item.name} gives ${take}, better than skipping it (${skip}).`
          : `Skipping ${item.name} gives ${skip}, at least as good as taking it (${take}).`,
          rowLabels, colLabels);
      }
    }
  }
  emit(cells, { [cellKey(rows - 1, cols - 1)]: "found" },
    `The best value carryable in ${capacity}kg is £${dp[rows - 1][cols - 1]}.`, rowLabels, colLabels);
  return {
    frames: rec.frames,
    summary:
      "0/1 knapsack: each item is taken whole or not at all. Every cell asks one question — with these items available and this much capacity, what is the best value — and answers it by comparing taking against skipping. O(n × capacity), which is *pseudo*-polynomial: it scales with the capacity's value rather than its number of digits.",
  };
}

/* ------------------------------------------------------------- coin change -- */

export function coinChange(coins = [1, 3, 4], amount = 6): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const INF = Infinity;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  const emit = (roles: Record<number, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: [dp.map((v) => (v === INF ? "∞" : String(v)))],
      roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [`0,${k}`, v])),
      colLabels: dp.map((_, i) => String(i)),
      rowLabels: ["coins"],
      note,
    });

  emit({ 0: "sorted" }, `Fewest coins from ${coins.join(", ")} making each amount up to ${amount}. Zero needs no coins.`);
  for (let target = 1; target <= amount; target++) {
    for (const coin of coins) {
      if (coin > target) continue;
      rec.bump("comparisons");
      const candidate = dp[target - coin] + 1;
      if (candidate < dp[target]) {
        dp[target] = candidate;
        emit({ [target]: "swap", [target - coin]: "compare" },
          `Making ${target} with a ${coin} leaves ${target - coin}, which needs ${dp[target - coin]} — so ${target} needs ${dp[target]}.`);
      } else {
        emit({ [target]: "active", [target - coin]: "discarded" },
          `A ${coin} towards ${target} would need ${candidate === INF ? "∞" : candidate}, no better than ${dp[target]}.`);
      }
    }
  }
  emit({ [amount]: "found" }, `${amount} needs ${dp[amount]} coins.`);
  return {
    frames: rec.frames,
    summary:
      "For each amount, try every coin and keep the best. The greedy \"take the largest coin first\" answer is wrong for coin systems like 1, 3, 4 — making 6 greedily gives 4+1+1, three coins, where 3+3 needs two. That failure is exactly why this needs DP.",
  };
}

/* ------------------------------------------------------------- grid paths -- */

/**
 * Counting right/down paths through a grid with a wall in it.
 *
 * The point the picture makes that the prose cannot: each cell is the sum of
 * exactly two neighbours, so the wall's zero propagates down and right through
 * everything that would have gone through it. On an open grid the answer is a
 * binomial coefficient and no table is needed; one wall and the closed form is
 * gone while the table has not changed at all.
 */
export function gridPaths(grid = ["....", "..#.", "....", "...."]): Visualisation {
  const rows = grid.length;
  const cols = grid[0].length;
  const rec = new Recorder<MatrixFrame>();
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const seen: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const emit = (roles: Record<string, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: dp.map((row, i) =>
        row.map((v, j) => (grid[i][j] === "#" ? "#" : seen[i][j] ? String(v) : ""))
      ),
      roles,
      rowLabels: grid.map((_, i) => String(i)),
      colLabels: grid[0].split("").map((_, j) => String(j)),
      note,
    });

  emit({}, `Right/down paths across a ${rows} by ${cols} grid with one wall. Blank cells are not computed yet.`);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      seen[i][j] = true;
      if (grid[i][j] === "#") {
        emit({ [cellKey(i, j)]: "discarded" }, `(${i}, ${j}) is a wall: no path goes through it.`);
        continue;
      }
      if (i === 0 && j === 0) {
        dp[i][j] = 1;
        emit({ [cellKey(i, j)]: "found" }, "The start is reached one way: by already being there.");
        continue;
      }
      const above = i > 0 ? dp[i - 1][j] : 0;
      const left = j > 0 ? dp[i][j - 1] : 0;
      rec.bump("comparisons");
      dp[i][j] = above + left;
      const roles: Record<string, Role> = { [cellKey(i, j)]: "swap" };
      if (i > 0) roles[cellKey(i - 1, j)] = "compare";
      if (j > 0) roles[cellKey(i, j - 1)] = "compare";
      emit(roles, `(${i}, ${j}) is entered from above (${above}) or from the left (${left}): ${dp[i][j]}.`);
    }
  }
  emit({ [cellKey(rows - 1, cols - 1)]: "found" },
    `${dp[rows - 1][cols - 1]} paths. Without the wall it would be the binomial coefficient C(${rows + cols - 2}, ${rows - 1}).`);
  return {
    frames: rec.frames,
    summary:
      "Every cell is the sum of the one above and the one to its left, because those are the only two cells a right/down path can arrive from. A wall contributes zero, and that zero spreads through everything downstream of it — which is exactly why the open-grid closed form stops applying the moment one cell is blocked.",
  };
}

/* ------------------------------------------- longest increasing subsequence -- */

/**
 * The patience method, shown as the tails array being overwritten.
 *
 * Two rows on purpose. The top row is the input being consumed left to right;
 * the bottom is `tails`, whose length is the answer and whose *contents* are
 * not always a subsequence of the input. This default input is the case where
 * that goes wrong visibly: the final 1 overwrites the first tail at the very
 * end, leaving [1, 3, 4, 5] — an array that could never have been read off
 * [2, 6, 8, 3, 4, 5, 1] in order.
 */
export function longestIncreasingSubsequence(values = [2, 6, 8, 3, 4, 5, 1]): Visualisation {
  const rec = new Recorder<MatrixFrame>();
  const tails: number[] = [];
  const emit = (roles: Record<string, Role>, note: string) =>
    rec.push({
      kind: "matrix",
      cells: [
        values.map(String),
        values.map((_, i) => (i < tails.length ? String(tails[i]) : "")),
      ],
      roles,
      rowLabels: ["input", "tails"],
      colLabels: values.map((_, i) => String(i)),
      note,
    });

  emit({}, `Longest strictly increasing subsequence of ${values.join(", ")}. The tails row starts empty.`);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    // The first tail not below `value`: replacing it keeps every length still
    // reachable and lowers the bar for the next element.
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      rec.bump("comparisons");
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) {
      tails.push(value);
      emit({ [cellKey(0, i)]: "active", [cellKey(1, lo)]: "swap" },
        `${value} is above every tail, so it extends the best run: length ${tails.length}.`);
    } else {
      const replaced = tails[lo];
      tails[lo] = value;
      emit({ [cellKey(0, i)]: "active", [cellKey(1, lo)]: "swap" },
        `${value} replaces ${replaced} as the smallest ending for a run of ${lo + 1}. The length does not change.`);
    }
  }
  const last = values.length - 1;
  emit(
    Object.fromEntries(tails.map((_, i) => [cellKey(1, i), "found" as Role])),
    `Length ${tails.length}, from ${last + 1} elements. Read the length, not the contents — the final ${values[last]} overwrote a tail after everything it would have to precede.`
  );
  return {
    frames: rec.frames,
    summary:
      "Each value either extends the tails array or overwrites the first tail not below it, found by binary search — O(n log n) rather than the quadratic table. What the array holds is the smallest possible ending value for a run of each length, which is why its *length* is the answer while its contents need not form a real subsequence of the input.",
  };
}

export const DP_ALGOS = {
  fibonacci: { label: "Fibonacci (memoised)", run: () => fibonacciMemo() },
  lcs: { label: "Longest common subsequence", run: () => longestCommonSubsequence() },
  edit: { label: "Edit distance", run: () => editDistance() },
  knapsack: { label: "0/1 knapsack", run: () => knapsack() },
  coins: { label: "Coin change", run: () => coinChange() },
  paths: { label: "Grid paths with a wall", run: () => gridPaths() },
  lis: { label: "Longest increasing subsequence", run: () => longestIncreasingSubsequence() },
} as const;

export type DpAlgoName = keyof typeof DP_ALGOS;
