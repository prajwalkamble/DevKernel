import type { Lesson } from "@/content/types";

export const differenceArraysLesson: Lesson = {
  id: "dsa-ps-diff",
  slug: "difference-arrays-and-range-updates",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "Difference Arrays & Range Updates",
  summary:
    "Prefix sums answer range queries fast. Difference arrays are the mirror image — they make range *updates* fast, at the cost of not being able to read anything until you are done.",
  estimatedMinutes: 30,
  objectives: [
    "Apply a range update in O(1) with a difference array",
    "Rebuild the final array with one prefix pass",
    "State the trade: fast updates, no reads until the end",
    "Recognise the interval-counting problems this solves",
  ],
  sections: [
    {
      id: "the-mirror",
      heading: "The mirror image",
      body: [
        "Prefix sums: **O(n) to build, O(1) to query, O(n) to update** — because changing one element invalidates every prefix after it.",
        "Difference arrays: **O(1) to update a whole range, O(n) to read the result.** You record only the *changes* at the boundaries and reconstruct at the end.",
        "The two are inverses. A prefix sum of a difference array gives back the original, which is why the reconstruction is a single running total.",
      ],
      examples: [
        {
          id: "difference",
          title: "Range updates, and 2D prefix sums",
          lang: "python",
          code: `def range_update(n, updates):
    """Difference array: each range update is O(1), one final pass rebuilds."""
    diff = [0] * (n + 1)
    for lo, hi, delta in updates:          # inclusive lo..hi
        diff[lo] += delta
        diff[hi + 1] -= delta
    out = []
    run = 0
    for i in range(n):
        run += diff[i]
        out.append(run)
    return out, diff

n = 8
updates = [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
result, diff = range_update(n, updates)
print("updates (lo, hi, delta):", updates)
print("diff array :", diff)
print("final array:", result)

def naive(n, updates):
    a = [0] * n
    ops = 0
    for lo, hi, delta in updates:
        for i in range(lo, hi + 1):
            a[i] += delta
            ops += 1
    return a, ops

check, ops = naive(n, updates)
print("naive result:", check, " matches:", check == result)
print(f"\\nfor n=10^6 and 10^5 updates each spanning the whole array:")
print(f"  naive: 10^5 * 10^6 = 10^11 operations")
print(f"  diff : 10^5 * 2 + 10^6 = {2 * 10**5 + 10**6:,} operations")

# 2D prefix sums
def build_2d(m):
    rows, cols = len(m), len(m[0])
    p = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c]
    return p

def submatrix_sum(p, r1, c1, r2, c2):
    """Inclusive corners. Inclusion-exclusion: whole - top - left + overlap."""
    return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1]

mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
p = build_2d(mat)
print("\\nmatrix:", mat)
for row in p:
    print("  prefix", row)
for (r1, c1, r2, c2) in ((0, 0, 1, 1), (1, 1, 2, 2), (0, 0, 2, 2), (2, 0, 2, 2)):
    got = submatrix_sum(p, r1, c1, r2, c2)
    want = sum(mat[r][c] for r in range(r1, r2 + 1) for c in range(c1, c2 + 1))
    print(f"  ({r1},{c1})..({r2},{c2}) = {got:2}  check {want:2}  {'ok' if got == want else 'BAD'}")`,
          output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: True

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
          explanation:
            "The difference array is `n + 1` long so that `diff[hi + 1]` is always writable, even when `hi` is the last index. Without that slot every update touching the end needs a bounds check.\n\nA hundred billion operations against 1.2 million — five orders of magnitude, from replacing a loop over a range with two array writes.\n\n**The 2D version** is inclusion-exclusion in both directions. Building: the rectangle up to `(r, c)` is the cell, plus the rectangle above, plus the one to the left, minus the one counted twice at the top-left. Querying reverses the same reasoning. Getting the four terms right is easier if you draw the rectangles once rather than memorising the signs.",
          alternates: [
            {
              lang: "javascript",
              code: `// Difference array: each range update is O(1), one final pass rebuilds.
const list = (xs) => "[" + xs.join(", ") + "]";
const grid = (m) => "[" + m.map(list).join(", ") + "]";
const triples = (ts) => "[" + ts.map((t) => \`(\${t.join(", ")})\`).join(", ") + "]";
const commas = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const padL = (v, w) => String(v).padStart(w);

function rangeUpdate(n, updates) {
  const diff = new Array(n + 1).fill(0);
  for (const [lo, hi, delta] of updates) {
    // inclusive lo..hi
    diff[lo] += delta;
    diff[hi + 1] -= delta;
  }
  const out = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    run += diff[i];
    out.push(run);
  }
  return { out, diff };
}

const n = 8;
const updates = [[1, 3, 5], [2, 5, -2], [0, 7, 1]];
const { out: result, diff } = rangeUpdate(n, updates);
console.log("updates (lo, hi, delta):", triples(updates));
console.log("diff array :", list(diff));
console.log("final array:", list(result));

function naive(n, updates) {
  const a = new Array(n).fill(0);
  let ops = 0;
  for (const [lo, hi, delta] of updates) {
    for (let i = lo; i <= hi; i++) {
      a[i] += delta;
      ops++;
    }
  }
  return { a, ops };
}

const { a: check } = naive(n, updates);
console.log("naive result:", list(check), " matches:", list(check) === list(result));
console.log(\`\\nfor n=10^6 and 10^5 updates each spanning the whole array:\`);
console.log(\`  naive: 10^5 * 10^6 = 10^11 operations\`);
console.log(\`  diff : 10^5 * 2 + 10^6 = \${commas(2 * 10 ** 5 + 10 ** 6)} operations\`);

// 2D prefix sums
function build2d(m) {
  const rows = m.length;
  const cols = m[0].length;
  const p = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
    }
  }
  return p;
}

// Inclusive corners. Inclusion-exclusion: whole - top - left + overlap.
function submatrixSum(p, r1, c1, r2, c2) {
  return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];
}

const mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const p2 = build2d(mat);
console.log("\\nmatrix:", grid(mat));
for (const row of p2) console.log("  prefix", list(row));
for (const [r1, c1, r2, c2] of [[0, 0, 1, 1], [1, 1, 2, 2], [0, 0, 2, 2], [2, 0, 2, 2]]) {
  const got = submatrixSum(p2, r1, c1, r2, c2);
  let want = 0;
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) want += mat[r][c];
  console.log(
    \`  (\${r1},\${c1})..(\${r2},\${c2}) = \${padL(got, 2)}  check \${padL(want, 2)}  \${got === want ? "ok" : "BAD"}\`
  );
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
            {
              lang: "typescript",
              code: `// Difference array: each range update is O(1), one final pass rebuilds.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const grid = (m: number[][]): string => "[" + m.map(list).join(", ") + "]";
const triples = (ts: number[][]): string => "[" + ts.map((t) => \`(\${t.join(", ")})\`).join(", ") + "]";
const commas = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
const padL = (v: number, w: number): string => String(v).padStart(w);

function rangeUpdate(n: number, updates: number[][]): { out: number[]; diff: number[] } {
  const diff = new Array(n + 1).fill(0);
  for (const [lo, hi, delta] of updates) {
    // inclusive lo..hi
    diff[lo] += delta;
    diff[hi + 1] -= delta;
  }
  const out: number[] = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    run += diff[i];
    out.push(run);
  }
  return { out, diff };
}

const n = 8;
const updates: number[][] = [[1, 3, 5], [2, 5, -2], [0, 7, 1]];
const { out: result, diff } = rangeUpdate(n, updates);
console.log("updates (lo, hi, delta):", triples(updates));
console.log("diff array :", list(diff));
console.log("final array:", list(result));

function naive(n: number, updates: number[][]): { a: number[]; ops: number } {
  const a = new Array(n).fill(0);
  let ops = 0;
  for (const [lo, hi, delta] of updates) {
    for (let i = lo; i <= hi; i++) {
      a[i] += delta;
      ops++;
    }
  }
  return { a, ops };
}

const { a: check } = naive(n, updates);
console.log("naive result:", list(check), " matches:", list(check) === list(result));
console.log(\`\\nfor n=10^6 and 10^5 updates each spanning the whole array:\`);
console.log(\`  naive: 10^5 * 10^6 = 10^11 operations\`);
console.log(\`  diff : 10^5 * 2 + 10^6 = \${commas(2 * 10 ** 5 + 10 ** 6)} operations\`);

// 2D prefix sums
function build2d(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  const p = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
    }
  }
  return p;
}

// Inclusive corners. Inclusion-exclusion: whole - top - left + overlap.
function submatrixSum(p: number[][], r1: number, c1: number, r2: number, c2: number): number {
  return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];
}

const mat: number[][] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const p2 = build2d(mat);
console.log("\\nmatrix:", grid(mat));
for (const row of p2) console.log("  prefix", list(row));
for (const [r1, c1, r2, c2] of [[0, 0, 1, 1], [1, 1, 2, 2], [0, 0, 2, 2], [2, 0, 2, 2]]) {
  const got = submatrixSum(p2, r1, c1, r2, c2);
  let want = 0;
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) want += mat[r][c];
  console.log(
    \`  (\${r1},\${c1})..(\${r2},\${c2}) = \${padL(got, 2)}  check \${padL(want, 2)}  \${got === want ? "ok" : "BAD"}\`
  );
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** Difference array: each range update is O(1), one final pass rebuilds. */
public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static String grid(int[][] m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(m[i]));
        }
        return sb.append("]").toString();
    }

    static String triples(int[][] ts) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < ts.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append("(").append(ts[i][0]).append(", ").append(ts[i][1])
              .append(", ").append(ts[i][2]).append(")");
        }
        return sb.append("]").toString();
    }

    static int[] diff;

    static int[] rangeUpdate(int n, int[][] updates) {
        diff = new int[n + 1];
        for (int[] u : updates) {          // inclusive lo..hi
            diff[u[0]] += u[2];
            diff[u[1] + 1] -= u[2];
        }
        int[] out = new int[n];
        int run = 0;
        for (int i = 0; i < n; i++) {
            run += diff[i];
            out[i] = run;
        }
        return out;
    }

    static int[] naive(int n, int[][] updates) {
        int[] a = new int[n];
        for (int[] u : updates) {
            for (int i = u[0]; i <= u[1]; i++) a[i] += u[2];
        }
        return a;
    }

    static int[][] build2d(int[][] m) {
        int rows = m.length, cols = m[0].length;
        int[][] p = new int[rows + 1][cols + 1];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
        return p;
    }

    /** Inclusive corners. Inclusion-exclusion: whole - top - left + overlap. */
    static int submatrixSum(int[][] p, int r1, int c1, int r2, int c2) {
        return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];
    }

    public static void main(String[] args) {
        int n = 8;
        int[][] updates = {{1, 3, 5}, {2, 5, -2}, {0, 7, 1}};
        int[] result = rangeUpdate(n, updates);
        System.out.println("updates (lo, hi, delta): " + triples(updates));
        System.out.println("diff array : " + list(diff));
        System.out.println("final array: " + list(result));

        int[] check = naive(n, updates);
        System.out.println("naive result: " + list(check)
                + "  matches: " + Arrays.equals(check, result));
        System.out.println("\\nfor n=10^6 and 10^5 updates each spanning the whole array:");
        System.out.println("  naive: 10^5 * 10^6 = 10^11 operations");
        System.out.printf(Locale.ROOT, "  diff : 10^5 * 2 + 10^6 = %,d operations%n",
                2 * 100_000 + 1_000_000);

        // 2D prefix sums
        int[][] mat = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        int[][] p = build2d(mat);
        System.out.println("\\nmatrix: " + grid(mat));
        for (int[] row : p) System.out.println("  prefix " + list(row));
        int[][] corners = {{0, 0, 1, 1}, {1, 1, 2, 2}, {0, 0, 2, 2}, {2, 0, 2, 2}};
        for (int[] q : corners) {
            int r1 = q[0], c1 = q[1], r2 = q[2], c2 = q[3];
            int got = submatrixSum(p, r1, c1, r2, c2), want = 0;
            for (int r = r1; r <= r2; r++)
                for (int c = c1; c <= c2; c++) want += mat[r][c];
            System.out.printf("  (%d,%d)..(%d,%d) = %2d  check %2d  %s%n",
                    r1, c1, r2, c2, got, want, got == want ? "ok" : "BAD");
        }
    }
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
            {
              lang: "cpp",
              code: `// Difference array: each range update is O(1), one final pass rebuilds.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

string grid(const vector<vector<int>>& m) {
    string out = "[";
    for (size_t i = 0; i < m.size(); i++) {
        if (i) out += ", ";
        out += list(m[i]);
    }
    return out + "]";
}

string triples(const vector<array<int, 3>>& ts) {
    string out = "[";
    for (size_t i = 0; i < ts.size(); i++) {
        if (i) out += ", ";
        out += "(" + to_string(ts[i][0]) + ", " + to_string(ts[i][1])
             + ", " + to_string(ts[i][2]) + ")";
    }
    return out + "]";
}

string commas(long long n) {
    string s = to_string(n), out;
    int c = 0;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        out += s[i];
        if (++c % 3 == 0 && i > 0) out += ',';
    }
    return string(out.rbegin(), out.rend());
}

vector<int> rangeUpdate(int n, const vector<array<int, 3>>& updates, vector<int>& diff) {
    diff.assign(n + 1, 0);
    for (const auto& u : updates) {        // inclusive lo..hi
        diff[u[0]] += u[2];
        diff[u[1] + 1] -= u[2];
    }
    vector<int> out;
    int run = 0;
    for (int i = 0; i < n; i++) {
        run += diff[i];
        out.push_back(run);
    }
    return out;
}

vector<int> naive(int n, const vector<array<int, 3>>& updates) {
    vector<int> a(n, 0);
    for (const auto& u : updates)
        for (int i = u[0]; i <= u[1]; i++) a[i] += u[2];
    return a;
}

vector<vector<int>> build2d(const vector<vector<int>>& m) {
    size_t rows = m.size(), cols = m[0].size();
    vector<vector<int>> p(rows + 1, vector<int>(cols + 1, 0));
    for (size_t r = 0; r < rows; r++)
        for (size_t c = 0; c < cols; c++)
            p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
    return p;
}

// Inclusive corners. Inclusion-exclusion: whole - top - left + overlap.
int submatrixSum(const vector<vector<int>>& p, int r1, int c1, int r2, int c2) {
    return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];
}

int main() {
    int n = 8;
    vector<array<int, 3>> updates = {{1, 3, 5}, {2, 5, -2}, {0, 7, 1}};
    vector<int> diff;
    vector<int> result = rangeUpdate(n, updates, diff);
    cout << "updates (lo, hi, delta): " << triples(updates) << "\\n";
    cout << "diff array : " << list(diff) << "\\n";
    cout << "final array: " << list(result) << "\\n";

    vector<int> check = naive(n, updates);
    cout << "naive result: " << list(check) << "  matches: " << boolalpha
         << (check == result) << "\\n";
    cout << "\\nfor n=10^6 and 10^5 updates each spanning the whole array:\\n";
    cout << "  naive: 10^5 * 10^6 = 10^11 operations\\n";
    cout << "  diff : 10^5 * 2 + 10^6 = " << commas(2 * 100000LL + 1000000LL) << " operations\\n";

    // 2D prefix sums
    vector<vector<int>> mat = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    auto p = build2d(mat);
    cout << "\\nmatrix: " << grid(mat) << "\\n";
    for (const auto& row : p) cout << "  prefix " << list(row) << "\\n";
    vector<array<int, 4>> corners = {{0, 0, 1, 1}, {1, 1, 2, 2}, {0, 0, 2, 2}, {2, 0, 2, 2}};
    for (const auto& q : corners) {
        int r1 = q[0], c1 = q[1], r2 = q[2], c2 = q[3];
        int got = submatrixSum(p, r1, c1, r2, c2), want = 0;
        for (int r = r1; r <= r2; r++)
            for (int c = c1; c <= c2; c++) want += mat[r][c];
        cout << "  (" << r1 << "," << c1 << ")..(" << r2 << "," << c2 << ") = "
             << setw(2) << got << "  check " << setw(2) << want
             << "  " << (got == want ? "ok" : "BAD") << "\\n";
    }
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
            {
              lang: "rust",
              code: `// Difference array: each range update is O(1), one final pass rebuilds.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn grid(m: &[Vec<i32>]) -> String {
    let parts: Vec<String> = m.iter().map(|r| list(r)).collect();
    format!("[{}]", parts.join(", "))
}

fn triples(ts: &[(usize, usize, i32)]) -> String {
    let parts: Vec<String> = ts.iter().map(|t| format!("({}, {}, {})", t.0, t.1, t.2)).collect();
    format!("[{}]", parts.join(", "))
}

fn commas(n: i64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

fn range_update(n: usize, updates: &[(usize, usize, i32)]) -> (Vec<i32>, Vec<i32>) {
    let mut diff = vec![0; n + 1];
    for &(lo, hi, delta) in updates {
        // inclusive lo..hi
        diff[lo] += delta;
        diff[hi + 1] -= delta;
    }
    let mut out = Vec::new();
    let mut run = 0;
    for i in 0..n {
        run += diff[i];
        out.push(run);
    }
    (out, diff)
}

fn naive(n: usize, updates: &[(usize, usize, i32)]) -> Vec<i32> {
    let mut a = vec![0; n];
    for &(lo, hi, delta) in updates {
        for i in lo..=hi {
            a[i] += delta;
        }
    }
    a
}

fn build_2d(m: &[Vec<i32>]) -> Vec<Vec<i32>> {
    let (rows, cols) = (m.len(), m[0].len());
    let mut p = vec![vec![0; cols + 1]; rows + 1];
    for r in 0..rows {
        for c in 0..cols {
            p[r + 1][c + 1] = m[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
        }
    }
    p
}

/// Inclusive corners. Inclusion-exclusion: whole - top - left + overlap.
fn submatrix_sum(p: &[Vec<i32>], r1: usize, c1: usize, r2: usize, c2: usize) -> i32 {
    p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1]
}

fn main() {
    let n = 8usize;
    let updates = [(1usize, 3usize, 5), (2, 5, -2), (0, 7, 1)];
    let (result, diff) = range_update(n, &updates);
    println!("updates (lo, hi, delta): {}", triples(&updates));
    println!("diff array : {}", list(&diff));
    println!("final array: {}", list(&result));

    let check = naive(n, &updates);
    println!("naive result: {}  matches: {}", list(&check), check == result);
    println!("\\nfor n=10^6 and 10^5 updates each spanning the whole array:");
    println!("  naive: 10^5 * 10^6 = 10^11 operations");
    println!("  diff : 10^5 * 2 + 10^6 = {} operations", commas(2 * 100_000 + 1_000_000));

    // 2D prefix sums
    let mat = vec![vec![1, 2, 3], vec![4, 5, 6], vec![7, 8, 9]];
    let p = build_2d(&mat);
    println!("\\nmatrix: {}", grid(&mat));
    for row in &p {
        println!("  prefix {}", list(row));
    }
    for (r1, c1, r2, c2) in [(0usize, 0usize, 1usize, 1usize), (1, 1, 2, 2), (0, 0, 2, 2), (2, 0, 2, 2)] {
        let got = submatrix_sum(&p, r1, c1, r2, c2);
        let mut want = 0;
        for r in r1..=r2 {
            for c in c1..=c2 {
                want += mat[r][c];
            }
        }
        println!(
            "  ({},{})..({},{}) = {:2}  check {:2}  {}",
            r1, c1, r2, c2, got, want,
            if got == want { "ok" } else { "BAD" }
        );
    }
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
            {
              lang: "go",
              code: `// Difference array: each range update is O(1), one final pass rebuilds.
package main

import (
	"fmt"
	"slices"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func grid(m [][]int) string {
	parts := make([]string, len(m))
	for i, r := range m {
		parts[i] = list(r)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func triples(ts [][3]int) string {
	parts := make([]string, len(ts))
	for i, t := range ts {
		parts[i] = fmt.Sprintf("(%d, %d, %d)", t[0], t[1], t[2])
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func commas(n int) string {
	s := fmt.Sprint(n)
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(ch)
	}
	return b.String()
}

func rangeUpdate(n int, updates [][3]int) ([]int, []int) {
	diff := make([]int, n+1)
	for _, u := range updates { // inclusive lo..hi
		diff[u[0]] += u[2]
		diff[u[1]+1] -= u[2]
	}
	out := []int{}
	run := 0
	for i := 0; i < n; i++ {
		run += diff[i]
		out = append(out, run)
	}
	return out, diff
}

func naive(n int, updates [][3]int) []int {
	a := make([]int, n)
	for _, u := range updates {
		for i := u[0]; i <= u[1]; i++ {
			a[i] += u[2]
		}
	}
	return a
}

func build2d(m [][]int) [][]int {
	rows, cols := len(m), len(m[0])
	p := make([][]int, rows+1)
	for i := range p {
		p[i] = make([]int, cols+1)
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			p[r+1][c+1] = m[r][c] + p[r][c+1] + p[r+1][c] - p[r][c]
		}
	}
	return p
}

// Inclusive corners. Inclusion-exclusion: whole - top - left + overlap.
func submatrixSum(p [][]int, r1, c1, r2, c2 int) int {
	return p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1]
}

func main() {
	n := 8
	updates := [][3]int{{1, 3, 5}, {2, 5, -2}, {0, 7, 1}}
	result, diff := rangeUpdate(n, updates)
	fmt.Println("updates (lo, hi, delta):", triples(updates))
	fmt.Println("diff array :", list(diff))
	fmt.Println("final array:", list(result))

	check := naive(n, updates)
	fmt.Println("naive result:", list(check), " matches:", slices.Equal(check, result))
	fmt.Println("\\nfor n=10^6 and 10^5 updates each spanning the whole array:")
	fmt.Println("  naive: 10^5 * 10^6 = 10^11 operations")
	fmt.Println("  diff : 10^5 * 2 + 10^6 =", commas(2*100000+1000000), "operations")

	// 2D prefix sums
	mat := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	p := build2d(mat)
	fmt.Println("\\nmatrix:", grid(mat))
	for _, row := range p {
		fmt.Println("  prefix", list(row))
	}
	for _, q := range [][4]int{{0, 0, 1, 1}, {1, 1, 2, 2}, {0, 0, 2, 2}, {2, 0, 2, 2}} {
		r1, c1, r2, c2 := q[0], q[1], q[2], q[3]
		got, want := submatrixSum(p, r1, c1, r2, c2), 0
		for r := r1; r <= r2; r++ {
			for c := c1; c <= c2; c++ {
				want += mat[r][c]
			}
		}
		verdict := "BAD"
		if got == want {
			verdict = "ok"
		}
		fmt.Printf("  (%d,%d)..(%d,%d) = %2d  check %2d  %s\\n", r1, c1, r2, c2, got, want, verdict)
	}
}`,
              output: `updates (lo, hi, delta): [(1, 3, 5), (2, 5, -2), (0, 7, 1)]
diff array : [1, 5, -2, 0, -5, 0, 2, 0, -1]
final array: [1, 6, 4, 4, -1, -1, 1, 1]
naive result: [1, 6, 4, 4, -1, -1, 1, 1]  matches: true

for n=10^6 and 10^5 updates each spanning the whole array:
  naive: 10^5 * 10^6 = 10^11 operations
  diff : 10^5 * 2 + 10^6 = 1,200,000 operations

matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  prefix [0, 0, 0, 0]
  prefix [0, 1, 3, 6]
  prefix [0, 5, 12, 21]
  prefix [0, 12, 27, 45]
  (0,0)..(1,1) = 12  check 12  ok
  (1,1)..(2,2) = 28  check 28  ok
  (0,0)..(2,2) = 45  check 45  ok
  (2,0)..(2,2) = 24  check 24  ok`,
            },
          ],
        },
      ],
    },
    {
      id: "the-family",
      heading: "The problems this is really for",
      body: [
        "Difference arrays rarely appear under that name. They appear as **interval counting**.",
        "**Corporate Flight Bookings** — a list of `(first, last, seats)` and a final per-flight total. Exactly the loop above.",
        "**Car Pooling** — passengers boarding and leaving at stops; add at pickup, subtract at drop-off, then sweep and check the running total never exceeds capacity.",
        "**Meeting Rooms II / maximum concurrent intervals** — the same sweep. `+1` at each start, `−1` at each end, and the answer is the maximum running value.",
        "**Range Addition** — the bare form, stated directly.",
        "The recognition cue is *many range updates followed by one read*, or *the maximum number of overlapping intervals*. If the reads are interleaved with the updates, this does not apply and you want a Fenwick tree — which the advanced-structures elective covers.",
      ],
      pitfalls: [
        {
          title: "Half-open versus inclusive at the boundary",
          body: "If the problem's ranges are inclusive, the subtraction goes at `hi + 1`. If they are half-open, it goes at `hi`. Choosing the wrong one shifts every value by one position at the edges, which small tests often survive.",
        },
        {
          title: "Reading the array before reconstructing",
          body: "The difference array is not the answer. Mid-loop it is meaningless — `diff[i]` is a delta, not a value. Do all updates first, then reconstruct once.",
        },
        {
          title: "Events at the same coordinate",
          body: "In interval-overlap problems, whether an interval ending at time t conflicts with one starting at t depends on the problem. Process the ends before the starts if touching intervals are allowed to share a room, and after if they are not. This decides several borderline test cases.",
        },
      ],
    },
  ],
  takeaways: [
    "Difference arrays make range updates O(1) and reads O(n) — the mirror of prefix sums",
    "`diff[lo] += delta` and `diff[hi + 1] -= delta`, then one running-total pass",
    "Size the array `n + 1` so the `hi + 1` write is always in bounds",
    "Do all updates before reconstructing; mid-loop the array is meaningless",
    "Interval counting and maximum-overlap problems are this technique",
    "Interleaved reads and updates need a Fenwick tree instead",
    "2D prefix sums are inclusion-exclusion — draw the rectangles rather than memorise",
  ],
  status: "available",
};
