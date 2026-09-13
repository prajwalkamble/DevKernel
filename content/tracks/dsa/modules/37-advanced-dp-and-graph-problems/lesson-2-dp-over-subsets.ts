import type { Lesson } from "@/content/types";

export const dpOverSubsetsLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-dp-over-subsets",
  slug: "dp-over-subsets",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Bitmask DP Over Subsets: Submask Walks and Sum Over Subsets",
  summary:
    "When the answer for a set depends on all of its subsets, the loop structure decides the exponent. Measured at 14 items: walking every mask's submasks took 4,782,969 steps, and adding one bit at a time took 229,376, with identical results.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Enumerate every submask of a mask with one bit trick",
    "Say why walking all submasks of all masks costs 3^n",
    "Compute sums over subsets in n·2^n by processing one bit at a time",
    "Recognise partition-into-groups problems as submask DP",
  ],
  sections: [
    {
      id: "submask-walk",
      heading: "Walking the submasks of a mask",
      body: [
        "A set of `n` items is an `n`-bit integer. A **submask** of `mask` is any integer whose set bits are a subset of `mask`'s. The loop `sub = mask`, then repeatedly `sub = (sub - 1) & mask`, visits every submask exactly once in decreasing order: subtracting one clears the lowest set bit and sets every bit below it, and the `& mask` discards the bits that are not in `mask`.",
        "The walk reaches 0, and `(0 - 1) & mask` is `mask` again, so the loop must stop after processing 0 rather than test for it at the top \u2014 or 0 must be handled separately.",
        "**Cost over all masks.** Running the walk for every mask from 0 to `2^n - 1` visits every (mask, submask) pair. Each item is independently in neither, in the mask only, or in both \u2014 three choices \u2014 so the total is exactly `3^n`, not `4^n` and not `2^n \u00b7 2^n`.",
      ],
    },
    {
      id: "sum-over-subsets",
      heading: "Sum over subsets, one bit at a time",
      body: [
        "Many problems need, for every mask, the sum of some value `f` over all of its submasks: how many input numbers are submasks of each mask, or the total weight of items compatible with each set.",
        "The submask walk gives it in `3^n`. **Sum over subsets** (SOS) gives it in `n \u00b7 2^n`. Start with `g = f`. For each bit from 0 to `n - 1`, and for every mask containing that bit, add `g[mask without the bit]` into `g[mask]`.",
        "After processing bits 0 through `i - 1`, `g[mask]` holds the sum of `f` over the submasks that differ from `mask` only in those bits. Adding bit `i` doubles the set of allowed differences, and the two halves are exactly `g[mask]` and `g[mask without bit i]`. After all `n` bits every submask has been counted once. It is a prefix sum along each of `n` dimensions of a `2 \u00d7 2 \u00d7 ... \u00d7 2` array.",
        "The bit loop must be the outer loop. Swapping it with the mask loop counts some submasks more than once.",
      ],
      examples: [
        {
          id: "submask-sums-three-ways",
          title: "Sums over subsets by every pair, by submask walks, and by one bit at a time",
          lang: "python",
          code: `# For every subset of n items, the sum of a value over all of its subsets.
# Three ways: test every pair of masks, walk each mask's submasks, or add one
# bit at a time (sum over subsets). The steps each takes are counted.

work = [0]


def by_every_pair(f, n):
    size = 1 << n
    g = [0] * size
    for mask in range(size):
        for sub in range(size):
            work[0] += 1
            if sub & mask == sub:
                g[mask] += f[sub]
    return g


def by_submask_walk(f, n):
    size = 1 << n
    g = [0] * size
    for mask in range(size):
        sub = mask
        while True:
            work[0] += 1
            g[mask] += f[sub]
            if sub == 0:
                break
            sub = (sub - 1) & mask      # the next smaller submask of mask
    return g


def by_one_bit_at_a_time(f, n):
    # after processing bits 0..i-1, g[mask] sums f over the submasks of mask
    # that differ from it only in those bits
    g = list(f)
    for bit in range(n):
        for mask in range(1 << n):
            work[0] += 1
            if mask & (1 << bit):
                g[mask] += g[mask ^ (1 << bit)]
    return g


# The same linear congruential generator in every language, so the values
# below are the same whichever translation is run.
seed = 44700019


def rand(k):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % k


print("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree")
for n in [6, 8, 10, 12, 14]:
    f = [rand(10) for _ in range(1 << n)]
    if n <= 10:
        work[0] = 0
        a = by_every_pair(f, n)
        pairs = "%d" % work[0]
    else:
        a = None
        pairs = "not run"
    work[0] = 0
    b = by_submask_walk(f, n)
    walk = work[0]
    work[0] = 0
    c = by_one_bit_at_a_time(f, n)
    sweep = work[0]
    same = b == c and (a is None or a == b)
    print("%10d %18s %20d %27d   %s" % (n, pairs, walk, sweep, "yes" if same else "no"))
`,
          output: `         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree
         6               4096                  729                         384   yes
         8              65536                 6561                        2048   yes
        10            1048576                59049                       10240   yes
        12            not run               531441                       49152   yes
        14            not run              4782969                      229376   yes`,
          explanation:
            "All three methods agreed at every size where they ran. Testing every pair of masks costs 4^n: 1,048,576 at n = 10, and it was not run beyond that. Walking submasks costs exactly 3^n: 59,049 at n = 10 and 4,782,969 at n = 14. Processing one bit at a time costs n times 2^n: 10,240 at n = 10 and 229,376 at n = 14, which is 21 times fewer steps than the submask walk at that size.",
          alternates: [
            {
              lang: "javascript",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

let work = 0;

function byEveryPair(f, n) {
  const size = 1 << n;
  const g = new Array(size).fill(0);
  for (let mask = 0; mask < size; mask++) {
    for (let sub = 0; sub < size; sub++) {
      work += 1;
      if ((sub & mask) === sub) g[mask] += f[sub];
    }
  }
  return g;
}

function bySubmaskWalk(f, n) {
  const size = 1 << n;
  const g = new Array(size).fill(0);
  for (let mask = 0; mask < size; mask++) {
    let sub = mask;
    for (;;) {
      work += 1;
      g[mask] += f[sub];
      if (sub === 0) break;
      sub = (sub - 1) & mask; // the next smaller submask of mask
    }
  }
  return g;
}

function byOneBitAtATime(f, n) {
  // after processing bits 0..i-1, g[mask] sums f over the submasks of mask
  // that differ from it only in those bits
  const g = f.slice();
  for (let bit = 0; bit < n; bit++) {
    for (let mask = 0; mask < 1 << n; mask++) {
      work += 1;
      if (mask & (1 << bit)) g[mask] += g[mask ^ (1 << bit)];
    }
  }
  return g;
}

// The same linear congruential generator in every language, so the values
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 44700019n;

function rand(k) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree");
for (const n of [6, 8, 10, 12, 14]) {
  const f = [];
  for (let i = 0; i < 1 << n; i++) f.push(rand(10));
  let a = null;
  let pairs = "not run";
  if (n <= 10) {
    work = 0;
    a = byEveryPair(f, n);
    pairs = String(work);
  }
  work = 0;
  const b = bySubmaskWalk(f, n);
  const walk = work;
  work = 0;
  const c = byOneBitAtATime(f, n);
  const sweep = work;
  const same = b.join(",") === c.join(",") && (a === null || a.join(",") === b.join(","));
  console.log(
    padLeft(n, 10) + " " + padLeft(pairs, 18) + " " + padLeft(walk, 20) + " " + padLeft(sweep, 27) +
      "   " + (same ? "yes" : "no"),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

let work = 0;

function byEveryPair(f: number[], n: number): number[] {
  const size = 1 << n;
  const g = new Array(size).fill(0);
  for (let mask = 0; mask < size; mask++) {
    for (let sub = 0; sub < size; sub++) {
      work += 1;
      if ((sub & mask) === sub) g[mask] += f[sub];
    }
  }
  return g;
}

function bySubmaskWalk(f: number[], n: number): number[] {
  const size = 1 << n;
  const g = new Array(size).fill(0);
  for (let mask = 0; mask < size; mask++) {
    let sub = mask;
    for (;;) {
      work += 1;
      g[mask] += f[sub];
      if (sub === 0) break;
      sub = (sub - 1) & mask; // the next smaller submask of mask
    }
  }
  return g;
}

function byOneBitAtATime(f: number[], n: number): number[] {
  // after processing bits 0..i-1, g[mask] sums f over the submasks of mask
  // that differ from it only in those bits
  const g = f.slice();
  for (let bit = 0; bit < n; bit++) {
    for (let mask = 0; mask < 1 << n; mask++) {
      work += 1;
      if (mask & (1 << bit)) g[mask] += g[mask ^ (1 << bit)];
    }
  }
  return g;
}

// The same linear congruential generator in every language, so the values
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 44700019n;

function rand(k: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(k));
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

console.log("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree");
for (const n of [6, 8, 10, 12, 14]) {
  const f: number[] = [];
  for (let i = 0; i < 1 << n; i++) f.push(rand(10));
  let a: number[] | null = null;
  let pairs = "not run";
  if (n <= 10) {
    work = 0;
    a = byEveryPair(f, n);
    pairs = String(work);
  }
  work = 0;
  const b = bySubmaskWalk(f, n);
  const walk = work;
  work = 0;
  const c = byOneBitAtATime(f, n);
  const sweep = work;
  const same = b.join(",") === c.join(",") && (a === null || a.join(",") === b.join(","));
  console.log(
    padLeft(n, 10) + " " + padLeft(pairs, 18) + " " + padLeft(walk, 20) + " " + padLeft(sweep, 27) +
      "   " + (same ? "yes" : "no"),
  );
}
`,
            },
            {
              lang: "java",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

import java.util.Arrays;

public class Main {
  static long work = 0;

  static long[] byEveryPair(long[] f, int n) {
    int size = 1 << n;
    long[] g = new long[size];
    for (int mask = 0; mask < size; mask++) {
      for (int sub = 0; sub < size; sub++) {
        work += 1;
        if ((sub & mask) == sub) {
          g[mask] += f[sub];
        }
      }
    }
    return g;
  }

  static long[] bySubmaskWalk(long[] f, int n) {
    int size = 1 << n;
    long[] g = new long[size];
    for (int mask = 0; mask < size; mask++) {
      int sub = mask;
      while (true) {
        work += 1;
        g[mask] += f[sub];
        if (sub == 0) {
          break;
        }
        sub = (sub - 1) & mask; // the next smaller submask of mask
      }
    }
    return g;
  }

  static long[] byOneBitAtATime(long[] f, int n) {
    // after processing bits 0..i-1, g[mask] sums f over the submasks of mask
    // that differ from it only in those bits
    long[] g = f.clone();
    for (int bit = 0; bit < n; bit++) {
      for (int mask = 0; mask < (1 << n); mask++) {
        work += 1;
        if ((mask & (1 << bit)) != 0) {
          g[mask] += g[mask ^ (1 << bit)];
        }
      }
    }
    return g;
  }

  // The same linear congruential generator in every language, so the values
  // below are the same whichever translation is run.
  static long seed = 44700019L;

  static int rand(int k) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % k);
  }

  public static void main(String[] args) {
    System.out.println("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree");
    int[] sizes = {6, 8, 10, 12, 14};
    for (int n : sizes) {
      long[] f = new long[1 << n];
      for (int i = 0; i < f.length; i++) {
        f[i] = rand(10);
      }
      long[] a = null;
      String pairs = "not run";
      if (n <= 10) {
        work = 0;
        a = byEveryPair(f, n);
        pairs = String.valueOf(work);
      }
      work = 0;
      long[] b = bySubmaskWalk(f, n);
      long walk = work;
      work = 0;
      long[] c = byOneBitAtATime(f, n);
      long sweep = work;
      boolean same = Arrays.equals(b, c) && (a == null || Arrays.equals(a, b));
      System.out.printf("%10d %18s %20d %27d   %s%n", n, pairs, walk, sweep, same ? "yes" : "no");
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

#include <cstdio>
#include <string>
#include <vector>

long long work = 0;

std::vector<long long> byEveryPair(const std::vector<long long>& f, int n) {
  int size = 1 << n;
  std::vector<long long> g(size, 0);
  for (int mask = 0; mask < size; mask++) {
    for (int sub = 0; sub < size; sub++) {
      work += 1;
      if ((sub & mask) == sub) {
        g[mask] += f[sub];
      }
    }
  }
  return g;
}

std::vector<long long> bySubmaskWalk(const std::vector<long long>& f, int n) {
  int size = 1 << n;
  std::vector<long long> g(size, 0);
  for (int mask = 0; mask < size; mask++) {
    int sub = mask;
    while (true) {
      work += 1;
      g[mask] += f[sub];
      if (sub == 0) {
        break;
      }
      sub = (sub - 1) & mask;  // the next smaller submask of mask
    }
  }
  return g;
}

std::vector<long long> byOneBitAtATime(const std::vector<long long>& f, int n) {
  // after processing bits 0..i-1, g[mask] sums f over the submasks of mask
  // that differ from it only in those bits
  std::vector<long long> g = f;
  for (int bit = 0; bit < n; bit++) {
    for (int mask = 0; mask < (1 << n); mask++) {
      work += 1;
      if (mask & (1 << bit)) {
        g[mask] += g[mask ^ (1 << bit)];
      }
    }
  }
  return g;
}

// The same linear congruential generator in every language, so the values
// below are the same whichever translation is run.
long long seed = 44700019LL;

int rand_below(int k) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % k);
}

int main() {
  std::printf("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree\\n");
  int sizes[5] = {6, 8, 10, 12, 14};
  for (int n : sizes) {
    std::vector<long long> f;
    for (int i = 0; i < (1 << n); i++) {
      f.push_back(rand_below(10));
    }
    std::vector<long long> a;
    bool ranPairs = false;
    std::string pairs = "not run";
    if (n <= 10) {
      work = 0;
      a = byEveryPair(f, n);
      ranPairs = true;
      pairs = std::to_string(work);
    }
    work = 0;
    std::vector<long long> b = bySubmaskWalk(f, n);
    long long walk = work;
    work = 0;
    std::vector<long long> c = byOneBitAtATime(f, n);
    long long sweep = work;
    bool same = b == c && (!ranPairs || a == b);
    std::printf("%10d %18s %20lld %27lld   %s\\n", n, pairs.c_str(), walk, sweep, same ? "yes" : "no");
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

fn by_every_pair(f: &[i64], n: usize, work: &mut i64) -> Vec<i64> {
    let size = 1usize << n;
    let mut g = vec![0i64; size];
    for mask in 0..size {
        for sub in 0..size {
            *work += 1;
            if sub & mask == sub {
                g[mask] += f[sub];
            }
        }
    }
    g
}

fn by_submask_walk(f: &[i64], n: usize, work: &mut i64) -> Vec<i64> {
    let size = 1usize << n;
    let mut g = vec![0i64; size];
    for mask in 0..size {
        let mut sub = mask;
        loop {
            *work += 1;
            g[mask] += f[sub];
            if sub == 0 {
                break;
            }
            sub = (sub - 1) & mask; // the next smaller submask of mask
        }
    }
    g
}

fn by_one_bit_at_a_time(f: &[i64], n: usize, work: &mut i64) -> Vec<i64> {
    // after processing bits 0..i-1, g[mask] sums f over the submasks of mask
    // that differ from it only in those bits
    let mut g = f.to_vec();
    for bit in 0..n {
        for mask in 0..(1usize << n) {
            *work += 1;
            if mask & (1 << bit) != 0 {
                g[mask] += g[mask ^ (1 << bit)];
            }
        }
    }
    g
}

// The same linear congruential generator in every language, so the values
// below are the same whichever translation is run.
static mut SEED: i64 = 44700019;

fn rand_below(k: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % k
    }
}

fn main() {
    println!("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree");
    for &n in [6usize, 8, 10, 12, 14].iter() {
        let f: Vec<i64> = (0..(1usize << n)).map(|_| rand_below(10)).collect();
        let mut a: Option<Vec<i64>> = None;
        let mut pairs = String::from("not run");
        if n <= 10 {
            let mut work = 0;
            a = Some(by_every_pair(&f, n, &mut work));
            pairs = work.to_string();
        }
        let mut walk = 0;
        let b = by_submask_walk(&f, n, &mut walk);
        let mut sweep = 0;
        let c = by_one_bit_at_a_time(&f, n, &mut sweep);
        let same = b == c && a.as_ref().map_or(true, |x| *x == b);
        println!("{:>10} {:>18} {:>20} {:>27}   {}", n, pairs, walk, sweep, if same { "yes" } else { "no" });
    }
}
`,
            },
            {
              lang: "go",
              code: `// For every subset of n items, the sum of a value over all of its subsets.
// Three ways: test every pair of masks, walk each mask's submasks, or add one
// bit at a time (sum over subsets). The steps each takes are counted.

package main

import "fmt"

var work int64

func byEveryPair(f []int64, n int) []int64 {
	size := 1 << n
	g := make([]int64, size)
	for mask := 0; mask < size; mask++ {
		for sub := 0; sub < size; sub++ {
			work++
			if sub&mask == sub {
				g[mask] += f[sub]
			}
		}
	}
	return g
}

func bySubmaskWalk(f []int64, n int) []int64 {
	size := 1 << n
	g := make([]int64, size)
	for mask := 0; mask < size; mask++ {
		sub := mask
		for {
			work++
			g[mask] += f[sub]
			if sub == 0 {
				break
			}
			sub = (sub - 1) & mask // the next smaller submask of mask
		}
	}
	return g
}

func byOneBitAtATime(f []int64, n int) []int64 {
	// after processing bits 0..i-1, g[mask] sums f over the submasks of mask
	// that differ from it only in those bits
	g := append([]int64{}, f...)
	for bit := 0; bit < n; bit++ {
		for mask := 0; mask < 1<<n; mask++ {
			work++
			if mask&(1<<bit) != 0 {
				g[mask] += g[mask^(1<<bit)]
			}
		}
	}
	return g
}

// The same linear congruential generator in every language, so the values
// below are the same whichever translation is run.
var seed int64 = 44700019

func randBelow(k int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(k))
}

func same(a, b []int64) bool {
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

func main() {
	fmt.Println("         n   every pair (4^n)   submask walk (3^n)   one bit at a time (n 2^n)   agree")
	for _, n := range []int{6, 8, 10, 12, 14} {
		f := make([]int64, 1<<n)
		for i := range f {
			f[i] = int64(randBelow(10))
		}
		var a []int64
		pairs := "not run"
		if n <= 10 {
			work = 0
			a = byEveryPair(f, n)
			pairs = fmt.Sprint(work)
		}
		work = 0
		b := bySubmaskWalk(f, n)
		walk := work
		work = 0
		c := byOneBitAtATime(f, n)
		sweep := work
		agree := "no"
		if same(b, c) && (a == nil || same(a, b)) {
			agree = "yes"
		}
		fmt.Printf("%10d %18s %20d %27d   %s\\n", n, pairs, walk, sweep, agree)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "when-each",
      heading: "When each one is the right loop",
      body: [
        "**SOS** applies when the combine over submasks is a plain sum, count, minimum or maximum that does not depend on how a mask is split. Its superset version \u2014 sum over all masks containing a given mask \u2014 runs the same loop adding `g[mask with the bit]` into `g[mask]`.",
        "**The submask walk** is needed when the transition depends on the split itself. Partitioning a set into groups is the standard case: `dp[mask] = min over submasks s of mask of dp[mask without s] + cost[s]`. The cost of the part `s` and the remaining set `mask without s` both depend on which submask was chosen, so no prefix-sum shortcut exists, and `3^n` is the honest bound. Restricting `s` to submasks containing the lowest set bit of `mask` avoids counting each partition once per ordering, without changing the bound.",
        "Both are exponential. At `n = 20`, `2^n` is about a million and `3^n` about 3.5 billion; the constraints on `n` in the problem statement are usually the signal for which one is intended.",
      ],
      pitfalls: [
        {
          title: "Testing sub == 0 at the top of the walk",
          body: "The empty submask is then never processed, or the loop runs forever because `(0 - 1) & mask` returns to `mask`. Process, then break when `sub` is 0.",
        },
        {
          title: "Putting the mask loop outside the bit loop in SOS",
          body: "Each submask must be reached through exactly one order of added bits. With the loops swapped, some are added more than once.",
        },
        {
          title: "Using SOS for a partition problem",
          body: "SOS combines values over submasks independently; partition DP needs the value of the remainder for each chosen part, which only the submask walk provides.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you iterate over all submasks of a bitmask, and what does it cost over every mask?",
      answer:
        "Start with sub = mask and repeat sub = (sub - 1) & mask, processing each value and stopping after 0; subtracting one clears the lowest set bit and fills the bits below, and the and-mask discards bits outside the set. Over all masks the total is exactly 3^n, because each item is independently in neither, the mask only, or both. I measured 59,049 steps at n = 10 and 4,782,969 at n = 14, exactly 3^n.",
    },
    {
      question: "How do you compute, for every mask, the sum of a value over all its submasks faster than 3^n?",
      answer:
        "Sum over subsets: start from g = f, then for each bit, outermost, add g[mask without the bit] into g[mask] for every mask containing it. After processing a set of bits, g[mask] sums over submasks that differ only in those bits, so after all n bits it is the full submask sum. That is n times 2^n. At n = 14 I measured 229,376 steps against 4,782,969 for walking submasks, with identical results. It only works when the combine does not depend on the split -- partitioning a set into groups still needs the 3^n submask walk.",
    },
  ],
  takeaways: [
    "sub = (sub - 1) & mask walks every submask in decreasing order",
    "Process 0, then stop; (0 - 1) & mask wraps back to mask",
    "Over all masks, submask walks cost exactly 3^n",
    "Sum over subsets is a prefix sum along each bit: n times 2^n",
    "Measured at n = 14: 4,782,969 submask steps, 229,376 one bit at a time",
    "The bit loop must be outermost in sum over subsets",
    "Partition into groups needs the submask walk, at 3^n",
  ],
};
