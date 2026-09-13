import type { Lesson } from "@/content/types";

export const digitDpLesson: Lesson = {
  id: "dsa-advanced-dp-and-graphs-digit-dp",
  slug: "digit-dp",
  moduleSlug: "advanced-dp-and-graph-problems",
  title: "Digit DP: Counting Numbers With a Property",
  summary:
    "Count the integers up to N with a digit property by walking N's digits once, carrying a small state instead of visiting numbers. Measured: all integers up to 10^18 with a digit sum divisible by 7 — 142,857,142,856,594,042 of them — counted in 1,201 steps.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Define the state for a digit DP: position, a property summary, and the tight flag",
    "Implement the count up to N iteratively and answer a range as a difference",
    "Bound the steps by digits, state size and base",
    "Extend the state to other digit properties",
  ],
  sections: [
    {
      id: "the-state",
      heading: "The state",
      body: [
        "Build numbers from the most significant digit down. At each position, a number being built is in one of two situations. Either its digits so far exactly match the corresponding prefix of `N` \u2014 it is **tight** \u2014 and the next digit can be at most `N`'s digit there. Or some earlier digit was smaller than `N`'s, so it is already below `N`, and every later digit is free.",
        "For a property such as \"digit sum divisible by `K`\", numbers that are already below `N` only need to be grouped by their digit sum modulo `K`: two numbers with the same remainder behave identically from here on. So the state is a count per remainder for the loose numbers, plus the single tight prefix's own remainder.",
        "At each digit `d` of `N`: every loose count spreads across the ten possible next digits; the tight prefix contributes one new loose number for each digit `x` smaller than `d`; and the tight prefix advances by `d`. At the end, the answer is the loose count with remainder 0, plus one if `N` itself qualifies.",
        "Leading zeros are harmless here because they add 0 to a digit sum; numbers shorter than `N` are counted as `N`-length numbers with zeros in front. Properties where a leading zero is not a digit \u2014 \"no two adjacent digits equal\", \"contains a 7\" before the first real digit \u2014 need a `started` flag in the state as well.",
      ],
    },
    {
      id: "measured",
      heading: "Counting instead of visiting",
      body: [
        "A range `[L, R]` is `count(R) - count(L - 1)`, with `count(-1) = 0` so that `L = 0` works.",
      ],
      examples: [
        {
          id: "digit-sum-divisible-by-k",
          title: "Digit DP against visiting every number, then counts up to 10^18",
          lang: "python",
          code: `# How many integers from 0 to N have a digit sum divisible by K? Digit DP
# answers it by walking N's digits once, keeping a count for each remainder,
# instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

work = [0]


def count_up_to(limit, k):
    # loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
    # tight_rem: the digit sum, mod k, of limit's own prefix
    if limit < 0:
        return 0
    digits = str(limit)
    loose = [0] * k
    tight_rem = 0
    for ch in digits:
        d = ord(ch) - 48
        fresh = [0] * k
        for r in range(k):
            if loose[r] == 0:
                continue
            for x in range(10):
                work[0] += 1
                fresh[(r + x) % k] += loose[r]
        for x in range(d):                  # leave the tight path at a smaller digit
            work[0] += 1
            fresh[(tight_rem + x) % k] += 1
        tight_rem = (tight_rem + d) % k
        loose = fresh
    return loose[0] + (1 if tight_rem == 0 else 0)


def count_by_visiting(low, high, k):
    total = 0
    for x in range(low, high + 1):
        s = 0
        y = x
        while y > 0:
            s += y % 10
            y //= 10
        if s % k == 0:
            total += 1
    return total


# The same linear congruential generator in every language, so the ranges
# below are the same whichever translation is run.
seed = 63100013


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


agree = 0
for _ in range(300):
    low = rand(20000)
    high = low + rand(20000)
    k = 1 + rand(12)
    if count_up_to(high, k) - count_up_to(low - 1, k) == count_by_visiting(low, high, k):
        agree += 1
print("digit DP matched counting every number in 300 random ranges: %d" % agree)
print()
K = 7
print("numbers from 0 to N with a digit sum divisible by %d" % K)
print()
print("                        N                 count   digit DP steps")
for limit in [10 ** 6, 10 ** 9, 10 ** 12, 10 ** 18, 999999999999999999]:
    work[0] = 0
    got = count_up_to(limit, K)
    print("%25d %21d %16d" % (limit, got, work[0]))
`,
          output: `digit DP matched counting every number in 300 random ranges: 300

numbers from 0 to N with a digit sum divisible by 7

                        N                 count   digit DP steps
                  1000000                142880              361
               1000000000             142857050              571
            1000000000000          142857141804              781
      1000000000000000000    142857142856594042             1201
       999999999999999999    142857142856594042             1352`,
          explanation:
            "Digit DP matched counting every number directly on 300 of 300 random ranges with divisors from 1 to 12. With a divisor of 7, counting up to 10^6 took 361 steps and up to 10^18 took 1,201, where visiting would take 10^18. Every step is one digit, one remainder, one next digit, so the cost is about digits times K times 10. The last two rows have the same count, because 10^18 has digit sum 1 and does not qualify; 999...9 takes more steps because its tight path allows every smaller digit at every position.",
          alternates: [
            {
              lang: "javascript",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

// Counts reach 10^17, so they are BigInt; the step counter stays a number.
let work = 0;

function countUpTo(limit, k) {
  // loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
  // tightRem: the digit sum, mod k, of limit's own prefix
  if (limit < 0n) return 0n;
  const digits = limit.toString();
  let loose = new Array(k).fill(0n);
  let tightRem = 0;
  for (const ch of digits) {
    const d = ch.charCodeAt(0) - 48;
    const fresh = new Array(k).fill(0n);
    for (let r = 0; r < k; r++) {
      if (loose[r] === 0n) continue;
      for (let x = 0; x < 10; x++) {
        work += 1;
        fresh[(r + x) % k] += loose[r];
      }
    }
    for (let x = 0; x < d; x++) {
      // leave the tight path at a smaller digit
      work += 1;
      fresh[(tightRem + x) % k] += 1n;
    }
    tightRem = (tightRem + d) % k;
    loose = fresh;
  }
  return loose[0] + (tightRem === 0 ? 1n : 0n);
}

function countByVisiting(low, high, k) {
  let total = 0;
  for (let x = low; x <= high; x++) {
    let s = 0;
    let y = x;
    while (y > 0) {
      s += y % 10;
      y = Math.floor(y / 10);
    }
    if (s % k === 0) total += 1;
  }
  return total;
}

// The same linear congruential generator in every language, so the ranges
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 63100013n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let t = 0; t < 300; t++) {
  const low = rand(20000);
  const high = low + rand(20000);
  const k = 1 + rand(12);
  const byDigits = countUpTo(BigInt(high), k) - countUpTo(BigInt(low - 1), k);
  if (byDigits === BigInt(countByVisiting(low, high, k))) agree += 1;
}
console.log("digit DP matched counting every number in 300 random ranges: " + agree);
console.log();
const K = 7;
console.log("numbers from 0 to N with a digit sum divisible by " + K);
console.log();
console.log("                        N                 count   digit DP steps");
for (const limit of [10n ** 6n, 10n ** 9n, 10n ** 12n, 10n ** 18n, 999999999999999999n]) {
  work = 0;
  const got = countUpTo(limit, K);
  console.log(padLeft(limit, 25) + " " + padLeft(got, 21) + " " + padLeft(work, 16));
}
`,
            },
            {
              lang: "typescript",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

// Counts reach 10^17, so they are BigInt; the step counter stays a number.
let work = 0;

function countUpTo(limit: bigint, k: number): bigint {
  // loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
  // tightRem: the digit sum, mod k, of limit's own prefix
  if (limit < 0n) return 0n;
  const digits = limit.toString();
  let loose: bigint[] = new Array(k).fill(0n);
  let tightRem = 0;
  for (const ch of digits) {
    const d = ch.charCodeAt(0) - 48;
    const fresh: bigint[] = new Array(k).fill(0n);
    for (let r = 0; r < k; r++) {
      if (loose[r] === 0n) continue;
      for (let x = 0; x < 10; x++) {
        work += 1;
        fresh[(r + x) % k] += loose[r];
      }
    }
    for (let x = 0; x < d; x++) {
      // leave the tight path at a smaller digit
      work += 1;
      fresh[(tightRem + x) % k] += 1n;
    }
    tightRem = (tightRem + d) % k;
    loose = fresh;
  }
  return loose[0] + (tightRem === 0 ? 1n : 0n);
}

function countByVisiting(low: number, high: number, k: number): number {
  let total = 0;
  for (let x = low; x <= high; x++) {
    let s = 0;
    let y = x;
    while (y > 0) {
      s += y % 10;
      y = Math.floor(y / 10);
    }
    if (s % k === 0) total += 1;
  }
  return total;
}

// The same linear congruential generator in every language, so the ranges
// below are the same whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 63100013n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function padLeft(s: string | number | bigint, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let t = 0; t < 300; t++) {
  const low = rand(20000);
  const high = low + rand(20000);
  const k = 1 + rand(12);
  const byDigits = countUpTo(BigInt(high), k) - countUpTo(BigInt(low - 1), k);
  if (byDigits === BigInt(countByVisiting(low, high, k))) agree += 1;
}
console.log("digit DP matched counting every number in 300 random ranges: " + agree);
console.log();
const K = 7;
console.log("numbers from 0 to N with a digit sum divisible by " + K);
console.log();
console.log("                        N                 count   digit DP steps");
for (const limit of [10n ** 6n, 10n ** 9n, 10n ** 12n, 10n ** 18n, 999999999999999999n]) {
  work = 0;
  const got = countUpTo(limit, K);
  console.log(padLeft(limit, 25) + " " + padLeft(got, 21) + " " + padLeft(work, 16));
}
`,
            },
            {
              lang: "java",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

public class Main {
  static long work = 0;

  static long countUpTo(long limit, int k) {
    // loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
    // tightRem: the digit sum, mod k, of limit's own prefix
    if (limit < 0) {
      return 0;
    }
    String digits = String.valueOf(limit);
    long[] loose = new long[k];
    int tightRem = 0;
    for (int p = 0; p < digits.length(); p++) {
      int d = digits.charAt(p) - '0';
      long[] fresh = new long[k];
      for (int r = 0; r < k; r++) {
        if (loose[r] == 0) {
          continue;
        }
        for (int x = 0; x < 10; x++) {
          work += 1;
          fresh[(r + x) % k] += loose[r];
        }
      }
      for (int x = 0; x < d; x++) { // leave the tight path at a smaller digit
        work += 1;
        fresh[(tightRem + x) % k] += 1;
      }
      tightRem = (tightRem + d) % k;
      loose = fresh;
    }
    return loose[0] + (tightRem == 0 ? 1 : 0);
  }

  static long countByVisiting(long low, long high, int k) {
    long total = 0;
    for (long x = low; x <= high; x++) {
      long s = 0;
      long y = x;
      while (y > 0) {
        s += y % 10;
        y /= 10;
      }
      if (s % k == 0) {
        total += 1;
      }
    }
    return total;
  }

  // The same linear congruential generator in every language, so the ranges
  // below are the same whichever translation is run.
  static long seed = 63100013L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  public static void main(String[] args) {
    int agree = 0;
    for (int t = 0; t < 300; t++) {
      int low = rand(20000);
      int high = low + rand(20000);
      int k = 1 + rand(12);
      if (countUpTo(high, k) - countUpTo(low - 1, k) == countByVisiting(low, high, k)) {
        agree += 1;
      }
    }
    System.out.println("digit DP matched counting every number in 300 random ranges: " + agree);
    System.out.println();
    final int bigK = 7;
    System.out.println("numbers from 0 to N with a digit sum divisible by " + bigK);
    System.out.println();
    System.out.println("                        N                 count   digit DP steps");
    long[] limits = {1000000L, 1000000000L, 1000000000000L, 1000000000000000000L, 999999999999999999L};
    for (long limit : limits) {
      work = 0;
      long got = countUpTo(limit, bigK);
      System.out.printf("%25d %21d %16d%n", limit, got, work);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

#include <cstdio>
#include <string>
#include <vector>

long long work = 0;

long long countUpTo(long long limit, int k) {
  // loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
  // tightRem: the digit sum, mod k, of limit's own prefix
  if (limit < 0) {
    return 0;
  }
  std::string digits = std::to_string(limit);
  std::vector<long long> loose(k, 0);
  int tightRem = 0;
  for (char ch : digits) {
    int d = ch - '0';
    std::vector<long long> fresh(k, 0);
    for (int r = 0; r < k; r++) {
      if (loose[r] == 0) {
        continue;
      }
      for (int x = 0; x < 10; x++) {
        work += 1;
        fresh[(r + x) % k] += loose[r];
      }
    }
    for (int x = 0; x < d; x++) {  // leave the tight path at a smaller digit
      work += 1;
      fresh[(tightRem + x) % k] += 1;
    }
    tightRem = (tightRem + d) % k;
    loose = fresh;
  }
  return loose[0] + (tightRem == 0 ? 1 : 0);
}

long long countByVisiting(long long low, long long high, int k) {
  long long total = 0;
  for (long long x = low; x <= high; x++) {
    long long s = 0;
    for (long long y = x; y > 0; y /= 10) {
      s += y % 10;
    }
    if (s % k == 0) {
      total += 1;
    }
  }
  return total;
}

// The same linear congruential generator in every language, so the ranges
// below are the same whichever translation is run.
long long seed = 63100013LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

int main() {
  int agree = 0;
  for (int t = 0; t < 300; t++) {
    int low = rand_below(20000);
    int high = low + rand_below(20000);
    int k = 1 + rand_below(12);
    if (countUpTo(high, k) - countUpTo(low - 1, k) == countByVisiting(low, high, k)) {
      agree += 1;
    }
  }
  std::printf("digit DP matched counting every number in 300 random ranges: %d\\n", agree);
  std::printf("\\n");
  const int bigK = 7;
  std::printf("numbers from 0 to N with a digit sum divisible by %d\\n", bigK);
  std::printf("\\n");
  std::printf("                        N                 count   digit DP steps\\n");
  long long limits[5] = {1000000LL, 1000000000LL, 1000000000000LL, 1000000000000000000LL,
                         999999999999999999LL};
  for (long long limit : limits) {
    work = 0;
    long long got = countUpTo(limit, bigK);
    std::printf("%25lld %21lld %16lld\\n", limit, got, work);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

fn count_up_to(limit: i64, k: usize, work: &mut i64) -> i64 {
    // loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
    // tight_rem: the digit sum, mod k, of limit's own prefix
    if limit < 0 {
        return 0;
    }
    let digits = limit.to_string();
    let mut loose = vec![0i64; k];
    let mut tight_rem = 0usize;
    for ch in digits.bytes() {
        let d = (ch - b'0') as usize;
        let mut fresh = vec![0i64; k];
        for r in 0..k {
            if loose[r] == 0 {
                continue;
            }
            for x in 0..10 {
                *work += 1;
                fresh[(r + x) % k] += loose[r];
            }
        }
        for x in 0..d {
            // leave the tight path at a smaller digit
            *work += 1;
            fresh[(tight_rem + x) % k] += 1;
        }
        tight_rem = (tight_rem + d) % k;
        loose = fresh;
    }
    loose[0] + if tight_rem == 0 { 1 } else { 0 }
}

fn count_by_visiting(low: i64, high: i64, k: i64) -> i64 {
    let mut total = 0;
    for x in low..=high {
        let mut s = 0;
        let mut y = x;
        while y > 0 {
            s += y % 10;
            y /= 10;
        }
        if s % k == 0 {
            total += 1;
        }
    }
    total
}

// The same linear congruential generator in every language, so the ranges
// below are the same whichever translation is run.
static mut SEED: i64 = 63100013;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn main() {
    let mut ignored = 0;
    let mut agree = 0;
    for _ in 0..300 {
        let low = rand_below(20000);
        let high = low + rand_below(20000);
        let k = 1 + rand_below(12);
        let by_digits = count_up_to(high, k as usize, &mut ignored) - count_up_to(low - 1, k as usize, &mut ignored);
        if by_digits == count_by_visiting(low, high, k) {
            agree += 1;
        }
    }
    println!("digit DP matched counting every number in 300 random ranges: {}", agree);
    println!();
    let big_k = 7;
    println!("numbers from 0 to N with a digit sum divisible by {}", big_k);
    println!();
    println!("                        N                 count   digit DP steps");
    for &limit in [1000000i64, 1000000000, 1000000000000, 1000000000000000000, 999999999999999999].iter() {
        let mut work = 0;
        let got = count_up_to(limit, big_k, &mut work);
        println!("{:>25} {:>21} {:>16}", limit, got, work);
    }
}
`,
            },
            {
              lang: "go",
              code: `// How many integers from 0 to N have a digit sum divisible by K? Digit DP
// answers it by walking N's digits once, keeping a count for each remainder,
// instead of visiting every number. A range [L, R] is count(R) - count(L - 1).

package main

import (
	"fmt"
	"strconv"
)

var work int64

func countUpTo(limit int64, k int) int64 {
	// loose[r]: prefixes already below limit's prefix, with digit sum = r mod k
	// tightRem: the digit sum, mod k, of limit's own prefix
	if limit < 0 {
		return 0
	}
	digits := strconv.FormatInt(limit, 10)
	loose := make([]int64, k)
	tightRem := 0
	for i := 0; i < len(digits); i++ {
		d := int(digits[i] - '0')
		fresh := make([]int64, k)
		for r := 0; r < k; r++ {
			if loose[r] == 0 {
				continue
			}
			for x := 0; x < 10; x++ {
				work++
				fresh[(r+x)%k] += loose[r]
			}
		}
		for x := 0; x < d; x++ { // leave the tight path at a smaller digit
			work++
			fresh[(tightRem+x)%k]++
		}
		tightRem = (tightRem + d) % k
		loose = fresh
	}
	if tightRem == 0 {
		return loose[0] + 1
	}
	return loose[0]
}

func countByVisiting(low, high int64, k int) int64 {
	var total int64
	for x := low; x <= high; x++ {
		var s int64
		for y := x; y > 0; y /= 10 {
			s += y % 10
		}
		if s%int64(k) == 0 {
			total++
		}
	}
	return total
}

// The same linear congruential generator in every language, so the ranges
// below are the same whichever translation is run.
var seed int64 = 63100013

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	agree := 0
	for t := 0; t < 300; t++ {
		low := int64(randBelow(20000))
		high := low + int64(randBelow(20000))
		k := 1 + randBelow(12)
		if countUpTo(high, k)-countUpTo(low-1, k) == countByVisiting(low, high, k) {
			agree++
		}
	}
	fmt.Printf("digit DP matched counting every number in 300 random ranges: %d\\n", agree)
	fmt.Println()
	const bigK = 7
	fmt.Printf("numbers from 0 to N with a digit sum divisible by %d\\n", bigK)
	fmt.Println()
	fmt.Println("                        N                 count   digit DP steps")
	for _, limit := range []int64{1000000, 1000000000, 1000000000000, 1000000000000000000, 999999999999999999} {
		work = 0
		got := countUpTo(limit, bigK)
		fmt.Printf("%25d %21d %16d\\n", limit, got, work)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "other-properties",
      heading: "Other properties, other state",
      body: [
        "The method is fixed; only the summary of the prefix changes. The summary must hold exactly what the future digits need to decide the property, and nothing more, because its size multiplies the cost.",
        "**Contains a given digit**: a flag, seen or not.",
        "**No two adjacent digits equal**: the previous digit, 10 values, plus `started`.",
        "**The number itself divisible by M**: the value modulo `M`, updated as `(r\u00b710 + x) mod M`.",
        "**Digits in non-decreasing order**: the previous digit.",
        "**Count of a digit equal to c**: the count so far, capped at `c + 1` since higher counts all fail.",
        "**Sum of a function of the digits over the range**, rather than a count: keep, for each state, both the number of prefixes and their accumulated total, and extend both at each step.",
      ],
      pitfalls: [
        {
          title: "Forgetting whether 0 is counted",
          body: "The count here includes 0, which has digit sum 0. If a problem counts from 1, subtract it or start the range at 1.",
        },
        {
          title: "Computing count(L - 1) for L = 0 without a guard",
          body: "Negative limits must return 0, or the range difference is wrong for ranges starting at 0.",
        },
        {
          title: "Carrying more state than the property needs",
          body: "Storing the digit sum itself instead of its remainder turns K states into up to 9 times the digit count, and the cost multiplies accordingly.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you count the integers up to 10^18 with a digit property?",
      answer:
        "Digit DP. Walk the digits of N from the most significant, keeping the numbers already below N grouped by a small summary of their digits -- for 'digit sum divisible by K' that is the remainder mod K -- plus the one tight prefix that still equals N's prefix. At each digit, loose counts spread over all ten next digits, the tight prefix spawns a loose number for every smaller digit, and the tight prefix advances. Up to 10^18 with K = 7 that counted 142,857,142,856,594,042 numbers in 1,201 steps, and it matched visiting every number on 300 random ranges. A range is count(R) - count(L - 1).",
    },
    {
      question: "What goes in the state of a digit DP?",
      answer:
        "Exactly what the remaining digits need in order to decide the property, because its size multiplies the cost, which is about digits times state size times 10. A digit sum mod K needs the remainder; divisibility of the number by M needs the value mod M; 'no two adjacent digits equal' needs the previous digit plus a started flag so leading zeros are not treated as digits; 'contains a 7' needs one flag. And there is always the tight distinction between prefixes still equal to N's and those already below it.",
    },
  ],
  takeaways: [
    "Tight prefixes still equal N's prefix; loose ones are already below N",
    "Loose numbers are grouped by a summary that is all the future needs",
    "Each digit: spread loose counts, spawn from the tight prefix, advance it",
    "Measured: up to 10^18 with K = 7 in 1,201 steps",
    "A range is count(R) - count(L - 1), with count(-1) = 0",
    "Properties about leading digits need a started flag",
    "Cost is about digits times state size times the base",
  ],
};
