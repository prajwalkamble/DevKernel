import type { Lesson } from "@/content/types";

export const coinSystemsLesson: Lesson = {
  id: "dsa-greedy-coins",
  slug: "coin-change-deciding-a-whole-system",
  moduleSlug: "greedy-algorithms",
  title: "Coin Change: Deciding a Whole System",
  summary:
    "Lesson 3 hunted counterexamples, which settles a rule only when the hunt succeeds. For coin systems the question can be closed either way — by a bound that says where a counterexample must be, and by a test that constructs it directly.",
  estimatedMinutes: 35,
  objectives: [
    "Say what makes a coin system canonical, and why one bad amount settles it",
    "Turn a counterexample hunt into a decision procedure using the two-largest-coins bound",
    "Run Pearson's test, which decides a system in time that ignores the size of the coins",
    "Explain why an arbitrary cutoff is not evidence, with the numbers to back it",
  ],
  sections: [
    {
      id: "canonical-systems",
      heading: "A bound is what turns a search into a proof",
      body: [
        "Every previous lesson in this module ended with a rule that either was or was not optimal, and the way to find out was to look for an instance that broke it. That works — but only in one direction. A counterexample is a proof of failure. Not finding one is not a proof of anything, because you only searched what you happened to search.",
        "Coin change is the problem where that gap can be closed exactly. A coin system is *canonical* when the greedy rule — take the largest coin that still fits, repeat — uses the fewest coins for every amount. US coins are canonical. Take the nickel away and they are not: thirty cents becomes a quarter and five pennies where three dimes would do.",
        "The way out is a theorem of Kozen and Zaks: if a system is not canonical, its smallest counterexample is strictly below the sum of its two largest coins. That turns a search into a decision procedure. Search up to that bound and one of two things happens — you find a counterexample and the system is refuted, or you do not and the system is *proved* canonical, because a counterexample would have had to be in the range you covered.",
        "The bound is what makes the second branch mean something. Without it the same loop is just an opinion with a for-statement around it.",
      ],
      visual: {
        id: "greedy-coins",
        kind: "greedy",
        algorithm: "coins",
        title: "Greedy coin change, on a system where it works and one where it does not",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "bounded-search",
          title: "Deciding seven coin systems, each up to its own bound",
          lang: "python",
          code: `# A coin system is CANONICAL when greedy - always take the largest coin that
# fits - is optimal for every amount. One counterexample disproves that. No
# counterexample proves nothing, unless the search that failed to find one was
# guaranteed to cover every case that could have failed.
#
# Kozen and Zaks: if a system is not canonical, its smallest counterexample is
# below the sum of the two largest coins. So a search up to that bound is a
# proof either way.

def greedy_coins(system, amount):
    used = 0
    for coin in system:
        used += amount // coin
        amount %= coin
    return used

def fewest_coins(system, limit):
    best = [0] + [limit + 1] * limit
    for amount in range(1, limit + 1):
        for coin in system:
            if coin <= amount and best[amount - coin] + 1 < best[amount]:
                best[amount] = best[amount - coin] + 1
    return best

def decide(system):
    limit = system[0] + system[1]
    best = fewest_coins(system, limit)
    for amount in range(1, limit + 1):
        got = greedy_coins(system, amount)
        if got != best[amount]:
            return limit, amount, got, best[amount]
    return limit, None, 0, 0

SYSTEMS = [
    ("US coins", [25, 10, 5, 1]),
    ("US without the nickel", [25, 10, 1]),
    ("the textbook villain", [4, 3, 1]),
    ("euro cents", [200, 100, 50, 20, 10, 5, 2, 1]),
    ("primes and one", [11, 7, 3, 1]),
    ("all divisors of 30", [30, 24, 12, 6, 3, 1]),
    ("nine six five one", [9, 6, 5, 1]),
]

print(f"{'system':<24}{'coins':<22}{'bound':>7}  verdict")
for name, system in SYSTEMS:
    limit, amount, got, best = decide(system)
    coins = " ".join(str(c) for c in system)
    if amount is None:
        verdict = "canonical"
    else:
        verdict = f"fails at {amount}: greedy {got}, best {best}"
    print(f"{name:<24}{coins:<22}{limit:>7}  {verdict}")
`,
          output: `system                  coins                   bound  verdict
US coins                25 10 5 1                  35  canonical
US without the nickel   25 10 1                    35  fails at 30: greedy 6, best 3
the textbook villain    4 3 1                       7  fails at 6: greedy 3, best 2
euro cents              200 100 50 20 10 5 2 1    300  canonical
primes and one          11 7 3 1                   18  canonical
all divisors of 30      30 24 12 6 3 1             54  fails at 48: greedy 3, best 2
nine six five one       9 6 5 1                    15  fails at 11: greedy 3, best 2`,
          explanation: "The bound is `system[0] + system[1]`, the two largest coins. Below it, greedy is compared against a DP table that holds the true minimum for every amount; the first disagreement is reported and the loop stops. Reaching the bound with no disagreement is the proof that there is none anywhere — that is the whole content of the theorem, and the only reason the word canonical can be printed rather than guessed at.",
          alternates: [
            {
              lang: "javascript",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.

function greedyCoins(system, amount) {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function fewestCoins(system, limit) {
  const best = new Array(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

function decide(system) {
  const limit = system[0] + system[1];
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    const got = greedyCoins(system, amount);
    if (got !== best[amount]) return { limit, amount, got, best: best[amount] };
  }
  return { limit, amount: null, got: 0, best: 0 };
}

const SYSTEMS = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["euro cents", [200, 100, 50, 20, 10, 5, 2, 1]],
  ["primes and one", [11, 7, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

console.log("system".padEnd(24) + "coins".padEnd(22) + "bound".padStart(7) + "  verdict");
for (const [name, system] of SYSTEMS) {
  const { limit, amount, got, best } = decide(system);
  const coins = system.join(" ");
  const verdict =
    amount === null ? "canonical" : \`fails at \${amount}: greedy \${got}, best \${best}\`;
  console.log(name.padEnd(24) + coins.padEnd(22) + String(limit).padStart(7) + "  " + verdict);
}
`,
            },
            {
              lang: "typescript",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.

function greedyCoins(system: number[], amount: number): number {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function fewestCoins(system: number[], limit: number): number[] {
  const best: number[] = new Array<number>(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

interface Verdict {
  limit: number;
  amount: number | null;
  got: number;
  best: number;
}

function decide(system: number[]): Verdict {
  const limit = system[0] + system[1];
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    const got = greedyCoins(system, amount);
    if (got !== best[amount]) return { limit, amount, got, best: best[amount] };
  }
  return { limit, amount: null, got: 0, best: 0 };
}

const SYSTEMS: Array<[string, number[]]> = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["euro cents", [200, 100, 50, 20, 10, 5, 2, 1]],
  ["primes and one", [11, 7, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

console.log("system".padEnd(24) + "coins".padEnd(22) + "bound".padStart(7) + "  verdict");
for (const [name, system] of SYSTEMS) {
  const { limit, amount, got, best } = decide(system);
  const coins = system.join(" ");
  const verdict =
    amount === null ? "canonical" : \`fails at \${amount}: greedy \${got}, best \${best}\`;
  console.log(name.padEnd(24) + coins.padEnd(22) + String(limit).padStart(7) + "  " + verdict);
}
`,
            },
            {
              lang: "java",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.
import java.util.Arrays;

public class Main {
    static int greedyCoins(int[] system, int amount) {
        int used = 0;
        for (int coin : system) {
            used += amount / coin;
            amount %= coin;
        }
        return used;
    }

    static int[] fewestCoins(int[] system, int limit) {
        int[] best = new int[limit + 1];
        Arrays.fill(best, limit + 1);
        best[0] = 0;
        for (int amount = 1; amount <= limit; amount++) {
            for (int coin : system) {
                if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                    best[amount] = best[amount - coin] + 1;
                }
            }
        }
        return best;
    }

    /** {limit, amount or -1, greedy count, best count} */
    static int[] decide(int[] system) {
        int limit = system[0] + system[1];
        int[] best = fewestCoins(system, limit);
        for (int amount = 1; amount <= limit; amount++) {
            int got = greedyCoins(system, amount);
            if (got != best[amount]) return new int[] {limit, amount, got, best[amount]};
        }
        return new int[] {limit, -1, 0, 0};
    }

    static final String[] NAMES = {
        "US coins", "US without the nickel", "the textbook villain", "euro cents",
        "primes and one", "all divisors of 30", "nine six five one",
    };

    static final int[][] SYSTEMS = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {200, 100, 50, 20, 10, 5, 2, 1},
        {11, 7, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    static String join(int[] system) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < system.length; i++) {
            if (i > 0) sb.append(' ');
            sb.append(system[i]);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.printf("%-24s%-22s%7s  verdict%n", "system", "coins", "bound");
        for (int s = 0; s < SYSTEMS.length; s++) {
            int[] r = decide(SYSTEMS[s]);
            String verdict = r[1] < 0
                ? "canonical"
                : String.format("fails at %d: greedy %d, best %d", r[1], r[2], r[3]);
            System.out.printf("%-24s%-22s%7d  %s%n", NAMES[s], join(SYSTEMS[s]), r[0], verdict);
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.
#include <cstdio>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

int greedy_coins(const std::vector<int>& system, int amount) {
    int used = 0;
    for (int coin : system) {
        used += amount / coin;
        amount %= coin;
    }
    return used;
}

std::vector<int> fewest_coins(const std::vector<int>& system, int limit) {
    std::vector<int> best(limit + 1, limit + 1);
    best[0] = 0;
    for (int amount = 1; amount <= limit; ++amount) {
        for (int coin : system) {
            if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                best[amount] = best[amount - coin] + 1;
            }
        }
    }
    return best;
}

struct Verdict {
    int limit;
    int amount;  // -1 when the system is canonical
    int got;
    int best;
};

Verdict decide(const std::vector<int>& system) {
    int limit = system[0] + system[1];
    std::vector<int> best = fewest_coins(system, limit);
    for (int amount = 1; amount <= limit; ++amount) {
        int got = greedy_coins(system, amount);
        if (got != best[amount]) return {limit, amount, got, best[amount]};
    }
    return {limit, -1, 0, 0};
}

std::string join(const std::vector<int>& system) {
    std::string out;
    for (size_t i = 0; i < system.size(); ++i) {
        if (i > 0) out += ' ';
        out += std::to_string(system[i]);
    }
    return out;
}

int main() {
    const std::vector<std::string> names = {
        "US coins", "US without the nickel", "the textbook villain", "euro cents",
        "primes and one", "all divisors of 30", "nine six five one",
    };
    const std::vector<std::vector<int>> systems = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {200, 100, 50, 20, 10, 5, 2, 1},
        {11, 7, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    std::cout << std::left << std::setw(24) << "system" << std::setw(22) << "coins"
              << std::right << std::setw(7) << "bound" << "  verdict\\n";
    for (size_t s = 0; s < systems.size(); ++s) {
        Verdict v = decide(systems[s]);
        char verdict[64];
        if (v.amount < 0) {
            std::snprintf(verdict, sizeof(verdict), "canonical");
        } else {
            std::snprintf(verdict, sizeof(verdict), "fails at %d: greedy %d, best %d",
                          v.amount, v.got, v.best);
        }
        std::cout << std::left << std::setw(24) << names[s] << std::setw(22) << join(systems[s])
                  << std::right << std::setw(7) << v.limit << "  " << verdict << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.

fn greedy_coins(system: &[i32], mut amount: i32) -> i32 {
    let mut used = 0;
    for &coin in system {
        used += amount / coin;
        amount %= coin;
    }
    used
}

fn fewest_coins(system: &[i32], limit: i32) -> Vec<i32> {
    let mut best = vec![limit + 1; (limit + 1) as usize];
    best[0] = 0;
    for amount in 1..=limit {
        for &coin in system {
            if coin <= amount && best[(amount - coin) as usize] + 1 < best[amount as usize] {
                best[amount as usize] = best[(amount - coin) as usize] + 1;
            }
        }
    }
    best
}

struct Verdict {
    limit: i32,
    amount: Option<i32>,
    got: i32,
    best: i32,
}

fn decide(system: &[i32]) -> Verdict {
    let limit = system[0] + system[1];
    let best = fewest_coins(system, limit);
    for amount in 1..=limit {
        let got = greedy_coins(system, amount);
        if got != best[amount as usize] {
            return Verdict { limit, amount: Some(amount), got, best: best[amount as usize] };
        }
    }
    Verdict { limit, amount: None, got: 0, best: 0 }
}

fn join(system: &[i32]) -> String {
    system.iter().map(|c| c.to_string()).collect::<Vec<_>>().join(" ")
}

fn main() {
    let systems: Vec<(&str, Vec<i32>)> = vec![
        ("US coins", vec![25, 10, 5, 1]),
        ("US without the nickel", vec![25, 10, 1]),
        ("the textbook villain", vec![4, 3, 1]),
        ("euro cents", vec![200, 100, 50, 20, 10, 5, 2, 1]),
        ("primes and one", vec![11, 7, 3, 1]),
        ("all divisors of 30", vec![30, 24, 12, 6, 3, 1]),
        ("nine six five one", vec![9, 6, 5, 1]),
    ];

    println!("{:<24}{:<22}{:>7}  verdict", "system", "coins", "bound");
    for (name, system) in &systems {
        let v = decide(system);
        let verdict = match v.amount {
            None => "canonical".to_string(),
            Some(a) => format!("fails at {}: greedy {}, best {}", a, v.got, v.best),
        };
        println!("{:<24}{:<22}{:>7}  {}", name, join(system), v.limit, verdict);
    }
}
`,
            },
            {
              lang: "go",
              code: `// A coin system is CANONICAL when greedy - always take the largest coin that
// fits - is optimal for every amount. One counterexample disproves that. No
// counterexample proves nothing, unless the search that failed to find one was
// guaranteed to cover every case that could have failed.
//
// Kozen and Zaks: if a system is not canonical, its smallest counterexample is
// below the sum of the two largest coins. So a search up to that bound is a
// proof either way.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func greedyCoins(system []int, amount int) int {
	used := 0
	for _, coin := range system {
		used += amount / coin
		amount %= coin
	}
	return used
}

func fewestCoins(system []int, limit int) []int {
	best := make([]int, limit+1)
	for i := range best {
		best[i] = limit + 1
	}
	best[0] = 0
	for amount := 1; amount <= limit; amount++ {
		for _, coin := range system {
			if coin <= amount && best[amount-coin]+1 < best[amount] {
				best[amount] = best[amount-coin] + 1
			}
		}
	}
	return best
}

type verdict struct {
	limit  int
	amount int // -1 when the system is canonical
	got    int
	best   int
}

func decide(system []int) verdict {
	limit := system[0] + system[1]
	best := fewestCoins(system, limit)
	for amount := 1; amount <= limit; amount++ {
		got := greedyCoins(system, amount)
		if got != best[amount] {
			return verdict{limit, amount, got, best[amount]}
		}
	}
	return verdict{limit, -1, 0, 0}
}

func join(system []int) string {
	parts := make([]string, len(system))
	for i, c := range system {
		parts[i] = strconv.Itoa(c)
	}
	return strings.Join(parts, " ")
}

func main() {
	names := []string{
		"US coins", "US without the nickel", "the textbook villain", "euro cents",
		"primes and one", "all divisors of 30", "nine six five one",
	}
	systems := [][]int{
		{25, 10, 5, 1},
		{25, 10, 1},
		{4, 3, 1},
		{200, 100, 50, 20, 10, 5, 2, 1},
		{11, 7, 3, 1},
		{30, 24, 12, 6, 3, 1},
		{9, 6, 5, 1},
	}

	fmt.Printf("%-24s%-22s%7s  verdict\\n", "system", "coins", "bound")
	for s, system := range systems {
		v := decide(system)
		text := "canonical"
		if v.amount >= 0 {
			text = fmt.Sprintf("fails at %d: greedy %d, best %d", v.amount, v.got, v.best)
		}
		fmt.Printf("%-24s%-22s%7d  %s\\n", names[s], join(system), v.limit, text)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "pearsons-test",
      heading: "Constructing the counterexample instead of looking for it",
      body: [
        "The bounded search is a proof, but it is a proof that costs the bound. Two coins of a hundred each and you scan two hundred amounts; two coins of a million and you scan two million. The size of the coins has nothing to do with how many coins there are, so a system of four coins can be arbitrarily expensive to decide this way.",
        "Pearson's test decides the same question in time that depends only on the number of coins. The idea is to stop searching amounts and start constructing the one amount that could possibly fail.",
        "Suppose a system is not canonical and let *w* be its smallest counterexample. Take a shortest representation of *w* — a multiset of coins summing to *w* using as few as possible. Let *i* be the index of the largest coin that representation uses and *j* the index of the smallest. Pearson proved that this representation is forced: above position *j* it agrees exactly with the greedy representation of `c[i-1] - 1`, and at position *j* it holds one coin more.",
        "That is a complete description of a candidate, and there is one per pair (i, j). So instead of scanning every amount below the bound, build those n² candidates, check each with one greedy pass, and take the smallest that fails. If none fails, the system is canonical — because the smallest counterexample, had one existed, would have been in the list.",
        "The two tests answer the same question, so the honest way to present the fast one is to run both and compare. Every three-, four- and five-coin system with nothing above twenty is five thousand systems, and they agree on all of them.",
      ],
      examples: [
        {
          id: "pearsons-test",
          title: "The same seven verdicts, at a fraction of the work",
          lang: "python",
          code: `# Pearson's test decides the same question without searching amounts at all.
#
# The reasoning: if a system fails, let w be its smallest counterexample and
# take a shortest representation of w. Let i be the largest coin that
# representation uses and j the smallest. Pearson proved that the
# representation then agrees with the greedy representation of c[i-1] - 1 in
# every position above j, and holds exactly one more coin in position j. That
# leaves one candidate amount per pair (i, j) - n squared of them, each costing
# a greedy pass - and if none of those is a counterexample, none exists.

def greedy_coins(system, amount):
    used = 0
    for coin in system:
        used += amount // coin
        amount %= coin
    return used

def greedy_vector(system, amount):
    counts = []
    for coin in system:
        counts.append(amount // coin)
        amount %= coin
    return counts

def pearson(system):
    n = len(system)
    smallest = None
    candidates = 0
    for i in range(1, n):
        above = greedy_vector(system, system[i - 1] - 1)
        for j in range(i, n):
            counts = above[:j] + [above[j] + 1] + [0] * (n - j - 1)
            amount = sum(counts[k] * system[k] for k in range(n))
            candidates += 1
            if sum(counts) < greedy_coins(system, amount):
                if smallest is None or amount < smallest:
                    smallest = amount
    return smallest, candidates

def fewest_coins(system, limit):
    best = [0] + [limit + 1] * limit
    for amount in range(1, limit + 1):
        for coin in system:
            if coin <= amount and best[amount - coin] + 1 < best[amount]:
                best[amount] = best[amount - coin] + 1
    return best

def bounded_search(system):
    limit = system[0] + system[1]
    best = fewest_coins(system, limit)
    for amount in range(1, limit + 1):
        if greedy_coins(system, amount) != best[amount]:
            return amount, limit
    return None, limit

SYSTEMS = [
    ("US coins", [25, 10, 5, 1]),
    ("US without the nickel", [25, 10, 1]),
    ("the textbook villain", [4, 3, 1]),
    ("euro cents", [200, 100, 50, 20, 10, 5, 2, 1]),
    ("primes and one", [11, 7, 3, 1]),
    ("all divisors of 30", [30, 24, 12, 6, 3, 1]),
    ("nine six five one", [9, 6, 5, 1]),
]

def label(amount):
    return "canonical" if amount is None else f"fails at {amount}"

print(f"{'system':<24}{'bounded search':<18}{'amounts':>8}   {'Pearson':<14}{'candidates':>11}")
for name, system in SYSTEMS:
    found, limit = bounded_search(system)
    pearson_found, candidates = pearson(system)
    assert found == pearson_found
    print(f"{name:<24}{label(found):<18}{limit:>8}   {label(pearson_found):<14}{candidates:>11}")

# The two agree because they answer the same question. Say so by machine over
# every system of three to five coins with nothing above twenty.
from itertools import combinations

systems = 0
failing = 0
disagreements = 0
for size in (3, 4, 5):
    for chosen in combinations(range(2, 21), size - 1):
        system = sorted(chosen + (1,), reverse=True)
        systems += 1
        found, _ = bounded_search(system)
        pearson_found, _ = pearson(system)
        if found is not None:
            failing += 1
        if found != pearson_found:
            disagreements += 1

print()
print("every system of 3 to 5 coins with no coin above 20:")
print(f"  {systems} systems, {failing} not canonical, {disagreements} disagreements")
`,
          output: `system                  bounded search     amounts   Pearson        candidates
US coins                canonical               35   canonical               6
US without the nickel   fails at 30             35   fails at 30             3
the textbook villain    fails at 6               7   fails at 6              3
euro cents              canonical              300   canonical              28
primes and one          canonical               18   canonical               6
all divisors of 30      fails at 48             54   fails at 48            15
nine six five one       fails at 11             15   fails at 11             6

every system of 3 to 5 coins with no coin above 20:
  5016 systems, 4613 not canonical, 0 disagreements`,
          explanation: "Look at the last two columns against the middle one. The euro system takes 300 amounts to decide by search and 28 candidates by Pearson, and the gap widens with the coin values rather than the coin count — a system of eight coins with a 50,000 note would still be 28 candidates. The sweep at the end is the reason to believe the fast test: 5,016 systems, decided both ways, no disagreement.",
          alternates: [
            {
              lang: "javascript",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.

function greedyCoins(system, amount) {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function greedyVector(system, amount) {
  const counts = [];
  for (const coin of system) {
    counts.push(Math.floor(amount / coin));
    amount %= coin;
  }
  return counts;
}

function pearson(system) {
  const n = system.length;
  let smallest = null;
  let candidates = 0;
  for (let i = 1; i < n; i++) {
    const above = greedyVector(system, system[i - 1] - 1);
    for (let j = i; j < n; j++) {
      const counts = above.slice(0, j).concat([above[j] + 1], new Array(n - j - 1).fill(0));
      let amount = 0;
      let used = 0;
      for (let k = 0; k < n; k++) {
        amount += counts[k] * system[k];
        used += counts[k];
      }
      candidates++;
      if (used < greedyCoins(system, amount)) {
        if (smallest === null || amount < smallest) smallest = amount;
      }
    }
  }
  return { smallest, candidates };
}

function fewestCoins(system, limit) {
  const best = new Array(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

function boundedSearch(system) {
  const limit = system[0] + system[1];
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    if (greedyCoins(system, amount) !== best[amount]) return { found: amount, limit };
  }
  return { found: null, limit };
}

const SYSTEMS = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["euro cents", [200, 100, 50, 20, 10, 5, 2, 1]],
  ["primes and one", [11, 7, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

const label = (amount) => (amount === null ? "canonical" : \`fails at \${amount}\`);

console.log(
  "system".padEnd(24) + "bounded search".padEnd(18) + "amounts".padStart(8) +
    "   " + "Pearson".padEnd(14) + "candidates".padStart(11)
);
for (const [name, system] of SYSTEMS) {
  const { found, limit } = boundedSearch(system);
  const { smallest, candidates } = pearson(system);
  if (found !== smallest) throw new Error("the two tests disagree");
  console.log(
    name.padEnd(24) + label(found).padEnd(18) + String(limit).padStart(8) +
      "   " + label(smallest).padEnd(14) + String(candidates).padStart(11)
  );
}

// The two agree because they answer the same question. Say so by machine over
// every system of three to five coins with nothing above twenty.
function* combinations(values, size) {
  const index = [];
  const walk = function* (start) {
    if (index.length === size) {
      yield index.map((i) => values[i]);
      return;
    }
    for (let i = start; i < values.length; i++) {
      index.push(i);
      yield* walk(i + 1);
      index.pop();
    }
  };
  yield* walk(0);
}

const pool = [];
for (let v = 2; v <= 20; v++) pool.push(v);

let systems = 0;
let failing = 0;
let disagreements = 0;
for (const size of [3, 4, 5]) {
  for (const chosen of combinations(pool, size - 1)) {
    const system = chosen.concat([1]).sort((a, b) => b - a);
    systems++;
    const { found } = boundedSearch(system);
    const { smallest } = pearson(system);
    if (found !== null) failing++;
    if (found !== smallest) disagreements++;
  }
}

console.log();
console.log("every system of 3 to 5 coins with no coin above 20:");
console.log(\`  \${systems} systems, \${failing} not canonical, \${disagreements} disagreements\`);
`,
            },
            {
              lang: "typescript",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.

function greedyCoins(system: number[], amount: number): number {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function greedyVector(system: number[], amount: number): number[] {
  const counts: number[] = [];
  for (const coin of system) {
    counts.push(Math.floor(amount / coin));
    amount %= coin;
  }
  return counts;
}

interface Pearson {
  smallest: number | null;
  candidates: number;
}

function pearson(system: number[]): Pearson {
  const n = system.length;
  let smallest: number | null = null;
  let candidates = 0;
  for (let i = 1; i < n; i++) {
    const above = greedyVector(system, system[i - 1] - 1);
    for (let j = i; j < n; j++) {
      const counts = above.slice(0, j).concat([above[j] + 1], new Array<number>(n - j - 1).fill(0));
      let amount = 0;
      let used = 0;
      for (let k = 0; k < n; k++) {
        amount += counts[k] * system[k];
        used += counts[k];
      }
      candidates++;
      if (used < greedyCoins(system, amount)) {
        if (smallest === null || amount < smallest) smallest = amount;
      }
    }
  }
  return { smallest, candidates };
}

function fewestCoins(system: number[], limit: number): number[] {
  const best: number[] = new Array<number>(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

interface Bounded {
  found: number | null;
  limit: number;
}

function boundedSearch(system: number[]): Bounded {
  const limit = system[0] + system[1];
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    if (greedyCoins(system, amount) !== best[amount]) return { found: amount, limit };
  }
  return { found: null, limit };
}

const SYSTEMS: Array<[string, number[]]> = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["euro cents", [200, 100, 50, 20, 10, 5, 2, 1]],
  ["primes and one", [11, 7, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

const label = (amount: number | null): string =>
  amount === null ? "canonical" : \`fails at \${amount}\`;

console.log(
  "system".padEnd(24) + "bounded search".padEnd(18) + "amounts".padStart(8) +
    "   " + "Pearson".padEnd(14) + "candidates".padStart(11)
);
for (const [name, system] of SYSTEMS) {
  const { found, limit } = boundedSearch(system);
  const { smallest, candidates } = pearson(system);
  if (found !== smallest) throw new Error("the two tests disagree");
  console.log(
    name.padEnd(24) + label(found).padEnd(18) + String(limit).padStart(8) +
      "   " + label(smallest).padEnd(14) + String(candidates).padStart(11)
  );
}

// The two agree because they answer the same question. Say so by machine over
// every system of three to five coins with nothing above twenty.
function* combinations(values: number[], size: number): Generator<number[]> {
  const index: number[] = [];
  function* walk(start: number): Generator<number[]> {
    if (index.length === size) {
      yield index.map((i) => values[i]);
      return;
    }
    for (let i = start; i < values.length; i++) {
      index.push(i);
      yield* walk(i + 1);
      index.pop();
    }
  }
  yield* walk(0);
}

const pool: number[] = [];
for (let v = 2; v <= 20; v++) pool.push(v);

let systems = 0;
let failing = 0;
let disagreements = 0;
for (const size of [3, 4, 5]) {
  for (const chosen of combinations(pool, size - 1)) {
    const system = chosen.concat([1]).sort((a, b) => b - a);
    systems++;
    const { found } = boundedSearch(system);
    const { smallest } = pearson(system);
    if (found !== null) failing++;
    if (found !== smallest) disagreements++;
  }
}

console.log();
console.log("every system of 3 to 5 coins with no coin above 20:");
console.log(\`  \${systems} systems, \${failing} not canonical, \${disagreements} disagreements\`);
`,
            },
            {
              lang: "java",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static int greedyCoins(int[] system, int amount) {
        int used = 0;
        for (int coin : system) {
            used += amount / coin;
            amount %= coin;
        }
        return used;
    }

    static int[] greedyVector(int[] system, int amount) {
        int[] counts = new int[system.length];
        for (int k = 0; k < system.length; k++) {
            counts[k] = amount / system[k];
            amount %= system[k];
        }
        return counts;
    }

    /** {smallest counterexample or -1, candidates examined} */
    static int[] pearson(int[] system) {
        int n = system.length;
        int smallest = -1;
        int candidates = 0;
        for (int i = 1; i < n; i++) {
            int[] above = greedyVector(system, system[i - 1] - 1);
            for (int j = i; j < n; j++) {
                int amount = 0;
                int used = 0;
                for (int k = 0; k < n; k++) {
                    int count = k < j ? above[k] : (k == j ? above[j] + 1 : 0);
                    amount += count * system[k];
                    used += count;
                }
                candidates++;
                if (used < greedyCoins(system, amount) && (smallest < 0 || amount < smallest)) {
                    smallest = amount;
                }
            }
        }
        return new int[] {smallest, candidates};
    }

    static int[] fewestCoins(int[] system, int limit) {
        int[] best = new int[limit + 1];
        Arrays.fill(best, limit + 1);
        best[0] = 0;
        for (int amount = 1; amount <= limit; amount++) {
            for (int coin : system) {
                if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                    best[amount] = best[amount - coin] + 1;
                }
            }
        }
        return best;
    }

    /** {smallest counterexample or -1, amounts examined} */
    static int[] boundedSearch(int[] system) {
        int limit = system[0] + system[1];
        int[] best = fewestCoins(system, limit);
        for (int amount = 1; amount <= limit; amount++) {
            if (greedyCoins(system, amount) != best[amount]) return new int[] {amount, limit};
        }
        return new int[] {-1, limit};
    }

    static final String[] NAMES = {
        "US coins", "US without the nickel", "the textbook villain", "euro cents",
        "primes and one", "all divisors of 30", "nine six five one",
    };

    static final int[][] SYSTEMS = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {200, 100, 50, 20, 10, 5, 2, 1},
        {11, 7, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    static String label(int amount) {
        return amount < 0 ? "canonical" : "fails at " + amount;
    }

    static void combinations(int[] values, int size, int start, List<Integer> index,
                             List<int[]> out) {
        if (index.size() == size) {
            int[] chosen = new int[size];
            for (int k = 0; k < size; k++) chosen[k] = values[index.get(k)];
            out.add(chosen);
            return;
        }
        for (int i = start; i < values.length; i++) {
            index.add(i);
            combinations(values, size, i + 1, index, out);
            index.remove(index.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.printf("%-24s%-18s%8s   %-14s%11s%n",
            "system", "bounded search", "amounts", "Pearson", "candidates");
        for (int s = 0; s < SYSTEMS.length; s++) {
            int[] bounded = boundedSearch(SYSTEMS[s]);
            int[] fast = pearson(SYSTEMS[s]);
            if (bounded[0] != fast[0]) throw new IllegalStateException("the two tests disagree");
            System.out.printf("%-24s%-18s%8d   %-14s%11d%n",
                NAMES[s], label(bounded[0]), bounded[1], label(fast[0]), fast[1]);
        }

        // The two agree because they answer the same question. Say so by
        // machine over every system of three to five coins with nothing above
        // twenty.
        int[] pool = new int[19];
        for (int v = 2; v <= 20; v++) pool[v - 2] = v;

        int systems = 0;
        int failing = 0;
        int disagreements = 0;
        for (int size : new int[] {3, 4, 5}) {
            List<int[]> chosenAll = new ArrayList<>();
            combinations(pool, size - 1, 0, new ArrayList<>(), chosenAll);
            for (int[] chosen : chosenAll) {
                int[] system = new int[size];
                System.arraycopy(chosen, 0, system, 0, size - 1);
                system[size - 1] = 1;
                Arrays.sort(system);
                for (int a = 0, b = size - 1; a < b; a++, b--) {
                    int t = system[a];
                    system[a] = system[b];
                    system[b] = t;
                }
                systems++;
                int found = boundedSearch(system)[0];
                int fast = pearson(system)[0];
                if (found >= 0) failing++;
                if (found != fast) disagreements++;
            }
        }

        System.out.println();
        System.out.println("every system of 3 to 5 coins with no coin above 20:");
        System.out.printf("  %d systems, %d not canonical, %d disagreements%n",
            systems, failing, disagreements);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.
#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int greedy_coins(const std::vector<int>& system, int amount) {
    int used = 0;
    for (int coin : system) {
        used += amount / coin;
        amount %= coin;
    }
    return used;
}

std::vector<int> greedy_vector(const std::vector<int>& system, int amount) {
    std::vector<int> counts;
    for (int coin : system) {
        counts.push_back(amount / coin);
        amount %= coin;
    }
    return counts;
}

struct Pearson {
    int smallest;  // -1 when the system is canonical
    int candidates;
};

Pearson pearson(const std::vector<int>& system) {
    int n = static_cast<int>(system.size());
    Pearson result{-1, 0};
    for (int i = 1; i < n; ++i) {
        std::vector<int> above = greedy_vector(system, system[i - 1] - 1);
        for (int j = i; j < n; ++j) {
            int amount = 0;
            int used = 0;
            for (int k = 0; k < n; ++k) {
                int count = k < j ? above[k] : (k == j ? above[j] + 1 : 0);
                amount += count * system[k];
                used += count;
            }
            result.candidates++;
            if (used < greedy_coins(system, amount) &&
                (result.smallest < 0 || amount < result.smallest)) {
                result.smallest = amount;
            }
        }
    }
    return result;
}

std::vector<int> fewest_coins(const std::vector<int>& system, int limit) {
    std::vector<int> best(limit + 1, limit + 1);
    best[0] = 0;
    for (int amount = 1; amount <= limit; ++amount) {
        for (int coin : system) {
            if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                best[amount] = best[amount - coin] + 1;
            }
        }
    }
    return best;
}

struct Bounded {
    int found;  // -1 when the system is canonical
    int limit;
};

Bounded bounded_search(const std::vector<int>& system) {
    int limit = system[0] + system[1];
    std::vector<int> best = fewest_coins(system, limit);
    for (int amount = 1; amount <= limit; ++amount) {
        if (greedy_coins(system, amount) != best[amount]) return {amount, limit};
    }
    return {-1, limit};
}

std::string label(int amount) {
    return amount < 0 ? "canonical" : "fails at " + std::to_string(amount);
}

int main() {
    const std::vector<std::string> names = {
        "US coins", "US without the nickel", "the textbook villain", "euro cents",
        "primes and one", "all divisors of 30", "nine six five one",
    };
    const std::vector<std::vector<int>> systems = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {200, 100, 50, 20, 10, 5, 2, 1},
        {11, 7, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    std::cout << std::left << std::setw(24) << "system" << std::setw(18) << "bounded search"
              << std::right << std::setw(8) << "amounts" << "   "
              << std::left << std::setw(14) << "Pearson"
              << std::right << std::setw(11) << "candidates" << "\\n";
    for (size_t s = 0; s < systems.size(); ++s) {
        Bounded bounded = bounded_search(systems[s]);
        Pearson fast = pearson(systems[s]);
        if (bounded.found != fast.smallest) throw std::runtime_error("the two tests disagree");
        std::cout << std::left << std::setw(24) << names[s]
                  << std::setw(18) << label(bounded.found)
                  << std::right << std::setw(8) << bounded.limit << "   "
                  << std::left << std::setw(14) << label(fast.smallest)
                  << std::right << std::setw(11) << fast.candidates << "\\n";
    }

    // The two agree because they answer the same question. Say so by machine
    // over every system of three to five coins with nothing above twenty.
    std::vector<int> pool;
    for (int v = 2; v <= 20; ++v) pool.push_back(v);

    int total = 0;
    int failing = 0;
    int disagreements = 0;
    std::vector<int> chosen;
    std::function<void(int, int)> walk = [&](int start, int size) {
        if (static_cast<int>(chosen.size()) == size) {
            std::vector<int> system = chosen;
            system.push_back(1);
            std::sort(system.begin(), system.end(), std::greater<int>());
            total++;
            int found = bounded_search(system).found;
            int fast = pearson(system).smallest;
            if (found >= 0) failing++;
            if (found != fast) disagreements++;
            return;
        }
        for (size_t i = start; i < pool.size(); ++i) {
            chosen.push_back(pool[i]);
            walk(static_cast<int>(i) + 1, size);
            chosen.pop_back();
        }
    };
    for (int size : {2, 3, 4}) walk(0, size);

    std::cout << "\\n";
    std::cout << "every system of 3 to 5 coins with no coin above 20:\\n";
    std::cout << "  " << total << " systems, " << failing << " not canonical, "
              << disagreements << " disagreements\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.

fn greedy_coins(system: &[i32], mut amount: i32) -> i32 {
    let mut used = 0;
    for &coin in system {
        used += amount / coin;
        amount %= coin;
    }
    used
}

fn greedy_vector(system: &[i32], mut amount: i32) -> Vec<i32> {
    let mut counts = Vec::new();
    for &coin in system {
        counts.push(amount / coin);
        amount %= coin;
    }
    counts
}

fn pearson(system: &[i32]) -> (Option<i32>, i32) {
    let n = system.len();
    let mut smallest: Option<i32> = None;
    let mut candidates = 0;
    for i in 1..n {
        let above = greedy_vector(system, system[i - 1] - 1);
        for j in i..n {
            let mut amount = 0;
            let mut used = 0;
            for k in 0..n {
                let count = if k < j {
                    above[k]
                } else if k == j {
                    above[j] + 1
                } else {
                    0
                };
                amount += count * system[k];
                used += count;
            }
            candidates += 1;
            if used < greedy_coins(system, amount) && smallest.is_none_or(|w| amount < w) {
                smallest = Some(amount);
            }
        }
    }
    (smallest, candidates)
}

fn fewest_coins(system: &[i32], limit: i32) -> Vec<i32> {
    let mut best = vec![limit + 1; (limit + 1) as usize];
    best[0] = 0;
    for amount in 1..=limit {
        for &coin in system {
            if coin <= amount && best[(amount - coin) as usize] + 1 < best[amount as usize] {
                best[amount as usize] = best[(amount - coin) as usize] + 1;
            }
        }
    }
    best
}

fn bounded_search(system: &[i32]) -> (Option<i32>, i32) {
    let limit = system[0] + system[1];
    let best = fewest_coins(system, limit);
    for amount in 1..=limit {
        if greedy_coins(system, amount) != best[amount as usize] {
            return (Some(amount), limit);
        }
    }
    (None, limit)
}

fn label(amount: Option<i32>) -> String {
    match amount {
        None => "canonical".to_string(),
        Some(a) => format!("fails at {}", a),
    }
}

fn combinations(pool: &[i32], size: usize, start: usize, chosen: &mut Vec<i32>,
                visit: &mut impl FnMut(&[i32])) {
    if chosen.len() == size {
        visit(chosen);
        return;
    }
    for i in start..pool.len() {
        chosen.push(pool[i]);
        combinations(pool, size, i + 1, chosen, visit);
        chosen.pop();
    }
}

fn main() {
    let systems: Vec<(&str, Vec<i32>)> = vec![
        ("US coins", vec![25, 10, 5, 1]),
        ("US without the nickel", vec![25, 10, 1]),
        ("the textbook villain", vec![4, 3, 1]),
        ("euro cents", vec![200, 100, 50, 20, 10, 5, 2, 1]),
        ("primes and one", vec![11, 7, 3, 1]),
        ("all divisors of 30", vec![30, 24, 12, 6, 3, 1]),
        ("nine six five one", vec![9, 6, 5, 1]),
    ];

    println!("{:<24}{:<18}{:>8}   {:<14}{:>11}",
             "system", "bounded search", "amounts", "Pearson", "candidates");
    for (name, system) in &systems {
        let (found, limit) = bounded_search(system);
        let (smallest, candidates) = pearson(system);
        assert_eq!(found, smallest, "the two tests disagree");
        println!("{:<24}{:<18}{:>8}   {:<14}{:>11}",
                 name, label(found), limit, label(smallest), candidates);
    }

    // The two agree because they answer the same question. Say so by machine
    // over every system of three to five coins with nothing above twenty.
    let pool: Vec<i32> = (2..=20).collect();
    let mut total = 0;
    let mut failing = 0;
    let mut disagreements = 0;
    for size in [2usize, 3, 4] {
        let mut chosen = Vec::new();
        combinations(&pool, size, 0, &mut chosen, &mut |picked: &[i32]| {
            let mut system = picked.to_vec();
            system.push(1);
            system.sort_by(|a, b| b.cmp(a));
            total += 1;
            let (found, _) = bounded_search(&system);
            let (fast, _) = pearson(&system);
            if found.is_some() {
                failing += 1;
            }
            if found != fast {
                disagreements += 1;
            }
        });
    }

    println!();
    println!("every system of 3 to 5 coins with no coin above 20:");
    println!("  {} systems, {} not canonical, {} disagreements", total, failing, disagreements);
}
`,
            },
            {
              lang: "go",
              code: `// Pearson's test decides the same question without searching amounts at all.
//
// The reasoning: if a system fails, let w be its smallest counterexample and
// take a shortest representation of w. Let i be the largest coin that
// representation uses and j the smallest. Pearson proved that the
// representation then agrees with the greedy representation of c[i-1] - 1 in
// every position above j, and holds exactly one more coin in position j. That
// leaves one candidate amount per pair (i, j) - n squared of them, each costing
// a greedy pass - and if none of those is a counterexample, none exists.
package main

import (
	"fmt"
	"sort"
)

func greedyCoins(system []int, amount int) int {
	used := 0
	for _, coin := range system {
		used += amount / coin
		amount %= coin
	}
	return used
}

func greedyVector(system []int, amount int) []int {
	counts := make([]int, len(system))
	for k, coin := range system {
		counts[k] = amount / coin
		amount %= coin
	}
	return counts
}

// Returns the smallest counterexample, or -1 when the system is canonical,
// together with the number of candidate amounts examined.
func pearson(system []int) (int, int) {
	n := len(system)
	smallest := -1
	candidates := 0
	for i := 1; i < n; i++ {
		above := greedyVector(system, system[i-1]-1)
		for j := i; j < n; j++ {
			amount := 0
			used := 0
			for k := 0; k < n; k++ {
				count := 0
				if k < j {
					count = above[k]
				} else if k == j {
					count = above[j] + 1
				}
				amount += count * system[k]
				used += count
			}
			candidates++
			if used < greedyCoins(system, amount) && (smallest < 0 || amount < smallest) {
				smallest = amount
			}
		}
	}
	return smallest, candidates
}

func fewestCoins(system []int, limit int) []int {
	best := make([]int, limit+1)
	for i := range best {
		best[i] = limit + 1
	}
	best[0] = 0
	for amount := 1; amount <= limit; amount++ {
		for _, coin := range system {
			if coin <= amount && best[amount-coin]+1 < best[amount] {
				best[amount] = best[amount-coin] + 1
			}
		}
	}
	return best
}

func boundedSearch(system []int) (int, int) {
	limit := system[0] + system[1]
	best := fewestCoins(system, limit)
	for amount := 1; amount <= limit; amount++ {
		if greedyCoins(system, amount) != best[amount] {
			return amount, limit
		}
	}
	return -1, limit
}

func label(amount int) string {
	if amount < 0 {
		return "canonical"
	}
	return fmt.Sprintf("fails at %d", amount)
}

func combinations(pool []int, size int, start int, chosen []int, visit func([]int)) {
	if len(chosen) == size {
		visit(chosen)
		return
	}
	for i := start; i < len(pool); i++ {
		combinations(pool, size, i+1, append(chosen, pool[i]), visit)
	}
}

func main() {
	names := []string{
		"US coins", "US without the nickel", "the textbook villain", "euro cents",
		"primes and one", "all divisors of 30", "nine six five one",
	}
	systems := [][]int{
		{25, 10, 5, 1},
		{25, 10, 1},
		{4, 3, 1},
		{200, 100, 50, 20, 10, 5, 2, 1},
		{11, 7, 3, 1},
		{30, 24, 12, 6, 3, 1},
		{9, 6, 5, 1},
	}

	fmt.Printf("%-24s%-18s%8s   %-14s%11s\\n",
		"system", "bounded search", "amounts", "Pearson", "candidates")
	for s, system := range systems {
		found, limit := boundedSearch(system)
		smallest, candidates := pearson(system)
		if found != smallest {
			panic("the two tests disagree")
		}
		fmt.Printf("%-24s%-18s%8d   %-14s%11d\\n",
			names[s], label(found), limit, label(smallest), candidates)
	}

	// The two agree because they answer the same question. Say so by machine
	// over every system of three to five coins with nothing above twenty.
	pool := make([]int, 0, 19)
	for v := 2; v <= 20; v++ {
		pool = append(pool, v)
	}

	total := 0
	failing := 0
	disagreements := 0
	for _, size := range []int{2, 3, 4} {
		combinations(pool, size, 0, nil, func(picked []int) {
			system := make([]int, len(picked), len(picked)+1)
			copy(system, picked)
			system = append(system, 1)
			sort.Sort(sort.Reverse(sort.IntSlice(system)))
			total++
			found, _ := boundedSearch(system)
			fast, _ := pearson(system)
			if found >= 0 {
				failing++
			}
			if found != fast {
				disagreements++
			}
		})
	}

	fmt.Println()
	fmt.Println("every system of 3 to 5 coins with no coin above 20:")
	fmt.Printf("  %d systems, %d not canonical, %d disagreements\\n", total, failing, disagreements)
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "why-the-bound",
      heading: "What an arbitrary cutoff misses",
      body: [
        "It is worth being concrete about what the bound is protecting you from, because the tempting shortcut — check the first hundred amounts and move on — is wrong far more often than it looks.",
        "Take the system 91, 15, 2, 1. Its first failure is at 105: greedy pays 91 + 2 + 2 + 2 + 2 + 2 + 2 + 1 + 1, eight coins, where seven 15s do it in seven. A hundred-amount check reports nothing and calls the system canonical.",
        "That is not an unlucky specimen. Of the 156,849 four-coin systems with no coin above a hundred, 150,736 are not canonical, and 38,529 of those first fail past amount 100 — a quarter of the failures, invisible to the shortcut.",
        "The bound is also close to tight, which is the other half of why it cannot be tightened by guessing. The worst case in that family is 100, 99, 2, 1, whose first failure is at 198 against a bound of 199. There is no smaller cutoff that would have worked.",
      ],
      examples: [
        {
          id: "cutoff-versus-bound",
          title: "How often a hundred-amount check is wrong",
          lang: "python",
          code: `# What the bound buys. "I tried the first hundred amounts and greedy was fine"
# is not an argument, and this is what it costs.
from itertools import combinations

def greedy_coins(system, amount):
    used = 0
    for coin in system:
        used += amount // coin
        amount %= coin
    return used

def greedy_vector(system, amount):
    counts = []
    for coin in system:
        counts.append(amount // coin)
        amount %= coin
    return counts

def pearson(system):
    n = len(system)
    smallest = None
    for i in range(1, n):
        above = greedy_vector(system, system[i - 1] - 1)
        for j in range(i, n):
            counts = above[:j] + [above[j] + 1] + [0] * (n - j - 1)
            amount = sum(counts[k] * system[k] for k in range(n))
            if sum(counts) < greedy_coins(system, amount):
                if smallest is None or amount < smallest:
                    smallest = amount
    return smallest

def fewest_coins(system, limit):
    best = [0] + [limit + 1] * limit
    for amount in range(1, limit + 1):
        for coin in system:
            if coin <= amount and best[amount - coin] + 1 < best[amount]:
                best[amount] = best[amount - coin] + 1
    return best

def first_failure(system, limit):
    best = fewest_coins(system, limit)
    for amount in range(1, limit + 1):
        if greedy_coins(system, amount) != best[amount]:
            return amount
    return None

# One system that a hundred-amount check gets wrong.
SUSPECT = [91, 15, 2, 1]
print("system", " ".join(str(c) for c in SUSPECT))
print("  bound (two largest coins):", SUSPECT[0] + SUSPECT[1])
print("  searching amounts 1 to 100:", first_failure(SUSPECT, 100) or "no failure found")
print("  searching to the bound:    ", first_failure(SUSPECT, SUSPECT[0] + SUSPECT[1]))

# And how common that is. Every four-coin system with no coin above 100,
# decided by Pearson's test, which the previous example checked against the
# bounded search.
CUTOFF = 100
systems = 0
failing = 0
missed = 0
worst_amount = 0
worst_system = None
tightest = 0.0

for chosen in combinations(range(2, 101), 3):
    system = sorted(chosen + (1,), reverse=True)
    systems += 1
    amount = pearson(system)
    if amount is None:
        continue
    failing += 1
    if amount > CUTOFF:
        missed += 1
    if amount > worst_amount:
        worst_amount = amount
        worst_system = system
    ratio = amount / (system[0] + system[1])
    if ratio > tightest:
        tightest = ratio

print()
print("every four-coin system with no coin above 100:")
print(f"  {systems} systems, {failing} not canonical")
print(f"  {missed} of those first fail above {CUTOFF}, so a {CUTOFF}-amount check calls them canonical")
print(f"  latest first failure: {worst_amount}, for {' '.join(str(c) for c in worst_system)}")
print(f"  largest first failure as a fraction of the bound: {tightest:.4f}")
`,
          output: `system 91 15 2 1
  bound (two largest coins): 106
  searching amounts 1 to 100: no failure found
  searching to the bound:     105

every four-coin system with no coin above 100:
  156849 systems, 150736 not canonical
  38529 of those first fail above 100, so a 100-amount check calls them canonical
  latest first failure: 198, for 100 99 2 1
  largest first failure as a fraction of the bound: 0.9950`,
          explanation: "The sweep uses Pearson's test rather than the bounded search, which is the previous example paying for itself: 156,849 systems decided in a second or two, where the search would have scanned up to 199 amounts each. The last line is the point — the largest first failure sits at 0.9950 of its bound, so the theorem is not merely correct, it is very nearly the smallest true bound there is.",
          alternates: [
            {
              lang: "javascript",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.

function greedyCoins(system, amount) {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function greedyVector(system, amount) {
  const counts = [];
  for (const coin of system) {
    counts.push(Math.floor(amount / coin));
    amount %= coin;
  }
  return counts;
}

function pearson(system) {
  const n = system.length;
  let smallest = null;
  for (let i = 1; i < n; i++) {
    const above = greedyVector(system, system[i - 1] - 1);
    for (let j = i; j < n; j++) {
      let amount = 0;
      let used = 0;
      for (let k = 0; k < n; k++) {
        const count = k < j ? above[k] : k === j ? above[j] + 1 : 0;
        amount += count * system[k];
        used += count;
      }
      if (used < greedyCoins(system, amount)) {
        if (smallest === null || amount < smallest) smallest = amount;
      }
    }
  }
  return smallest;
}

function fewestCoins(system, limit) {
  const best = new Array(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

function firstFailure(system, limit) {
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    if (greedyCoins(system, amount) !== best[amount]) return amount;
  }
  return null;
}

// One system that a hundred-amount check gets wrong.
const SUSPECT = [91, 15, 2, 1];
console.log("system " + SUSPECT.join(" "));
console.log("  bound (two largest coins): " + (SUSPECT[0] + SUSPECT[1]));
console.log("  searching amounts 1 to 100: " + (firstFailure(SUSPECT, 100) ?? "no failure found"));
console.log("  searching to the bound:     " + firstFailure(SUSPECT, SUSPECT[0] + SUSPECT[1]));

// And how common that is. Every four-coin system with no coin above 100,
// decided by Pearson's test, which the previous example checked against the
// bounded search.
const CUTOFF = 100;
let systems = 0;
let failing = 0;
let missed = 0;
let worstAmount = 0;
let worstSystem = null;
let tightest = 0;

for (let a = 2; a <= 100; a++) {
  for (let b = a + 1; b <= 100; b++) {
    for (let c = b + 1; c <= 100; c++) {
      const system = [c, b, a, 1];
      systems++;
      const amount = pearson(system);
      if (amount === null) continue;
      failing++;
      if (amount > CUTOFF) missed++;
      if (amount > worstAmount) {
        worstAmount = amount;
        worstSystem = system;
      }
      const ratio = amount / (system[0] + system[1]);
      if (ratio > tightest) tightest = ratio;
    }
  }
}

console.log();
console.log("every four-coin system with no coin above 100:");
console.log(\`  \${systems} systems, \${failing} not canonical\`);
console.log(\`  \${missed} of those first fail above \${CUTOFF}, so a \${CUTOFF}-amount check calls them canonical\`);
console.log(\`  latest first failure: \${worstAmount}, for \${worstSystem.join(" ")}\`);
console.log(\`  largest first failure as a fraction of the bound: \${tightest.toFixed(4)}\`);
`,
            },
            {
              lang: "typescript",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.

function greedyCoins(system: number[], amount: number): number {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

function greedyVector(system: number[], amount: number): number[] {
  const counts: number[] = [];
  for (const coin of system) {
    counts.push(Math.floor(amount / coin));
    amount %= coin;
  }
  return counts;
}

function pearson(system: number[]): number | null {
  const n = system.length;
  let smallest: number | null = null;
  for (let i = 1; i < n; i++) {
    const above = greedyVector(system, system[i - 1] - 1);
    for (let j = i; j < n; j++) {
      let amount = 0;
      let used = 0;
      for (let k = 0; k < n; k++) {
        const count = k < j ? above[k] : k === j ? above[j] + 1 : 0;
        amount += count * system[k];
        used += count;
      }
      if (used < greedyCoins(system, amount)) {
        if (smallest === null || amount < smallest) smallest = amount;
      }
    }
  }
  return smallest;
}

function fewestCoins(system: number[], limit: number): number[] {
  const best: number[] = new Array<number>(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

function firstFailure(system: number[], limit: number): number | null {
  const best = fewestCoins(system, limit);
  for (let amount = 1; amount <= limit; amount++) {
    if (greedyCoins(system, amount) !== best[amount]) return amount;
  }
  return null;
}

// One system that a hundred-amount check gets wrong.
const SUSPECT = [91, 15, 2, 1];
console.log("system " + SUSPECT.join(" "));
console.log("  bound (two largest coins): " + (SUSPECT[0] + SUSPECT[1]));
console.log("  searching amounts 1 to 100: " + (firstFailure(SUSPECT, 100) ?? "no failure found"));
console.log("  searching to the bound:     " + firstFailure(SUSPECT, SUSPECT[0] + SUSPECT[1]));

// And how common that is. Every four-coin system with no coin above 100,
// decided by Pearson's test, which the previous example checked against the
// bounded search.
const CUTOFF = 100;
let systems = 0;
let failing = 0;
let missed = 0;
let worstAmount = 0;
let worstSystem: number[] = [];
let tightest = 0;

for (let a = 2; a <= 100; a++) {
  for (let b = a + 1; b <= 100; b++) {
    for (let c = b + 1; c <= 100; c++) {
      const system = [c, b, a, 1];
      systems++;
      const amount = pearson(system);
      if (amount === null) continue;
      failing++;
      if (amount > CUTOFF) missed++;
      if (amount > worstAmount) {
        worstAmount = amount;
        worstSystem = system;
      }
      const ratio = amount / (system[0] + system[1]);
      if (ratio > tightest) tightest = ratio;
    }
  }
}

console.log();
console.log("every four-coin system with no coin above 100:");
console.log(\`  \${systems} systems, \${failing} not canonical\`);
console.log(\`  \${missed} of those first fail above \${CUTOFF}, so a \${CUTOFF}-amount check calls them canonical\`);
console.log(\`  latest first failure: \${worstAmount}, for \${worstSystem.join(" ")}\`);
console.log(\`  largest first failure as a fraction of the bound: \${tightest.toFixed(4)}\`);
`,
            },
            {
              lang: "java",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.
import java.util.Arrays;

public class Main {
    static int greedyCoins(int[] system, int amount) {
        int used = 0;
        for (int coin : system) {
            used += amount / coin;
            amount %= coin;
        }
        return used;
    }

    static int[] greedyVector(int[] system, int amount) {
        int[] counts = new int[system.length];
        for (int k = 0; k < system.length; k++) {
            counts[k] = amount / system[k];
            amount %= system[k];
        }
        return counts;
    }

    /** The smallest counterexample, or -1 when the system is canonical. */
    static int pearson(int[] system) {
        int n = system.length;
        int smallest = -1;
        for (int i = 1; i < n; i++) {
            int[] above = greedyVector(system, system[i - 1] - 1);
            for (int j = i; j < n; j++) {
                int amount = 0;
                int used = 0;
                for (int k = 0; k < n; k++) {
                    int count = k < j ? above[k] : (k == j ? above[j] + 1 : 0);
                    amount += count * system[k];
                    used += count;
                }
                if (used < greedyCoins(system, amount) && (smallest < 0 || amount < smallest)) {
                    smallest = amount;
                }
            }
        }
        return smallest;
    }

    static int[] fewestCoins(int[] system, int limit) {
        int[] best = new int[limit + 1];
        Arrays.fill(best, limit + 1);
        best[0] = 0;
        for (int amount = 1; amount <= limit; amount++) {
            for (int coin : system) {
                if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                    best[amount] = best[amount - coin] + 1;
                }
            }
        }
        return best;
    }

    static int firstFailure(int[] system, int limit) {
        int[] best = fewestCoins(system, limit);
        for (int amount = 1; amount <= limit; amount++) {
            if (greedyCoins(system, amount) != best[amount]) return amount;
        }
        return -1;
    }

    static String join(int[] system) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < system.length; i++) {
            if (i > 0) sb.append(' ');
            sb.append(system[i]);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        // One system that a hundred-amount check gets wrong.
        int[] suspect = {91, 15, 2, 1};
        int shortSearch = firstFailure(suspect, 100);
        System.out.println("system " + join(suspect));
        System.out.println("  bound (two largest coins): " + (suspect[0] + suspect[1]));
        System.out.println("  searching amounts 1 to 100: "
            + (shortSearch < 0 ? "no failure found" : Integer.toString(shortSearch)));
        System.out.println("  searching to the bound:     "
            + firstFailure(suspect, suspect[0] + suspect[1]));

        // And how common that is. Every four-coin system with no coin above
        // 100, decided by Pearson's test, which the previous example checked
        // against the bounded search.
        final int cutoff = 100;
        int systems = 0;
        int failing = 0;
        int missed = 0;
        int worstAmount = 0;
        int[] worstSystem = null;
        double tightest = 0;

        for (int a = 2; a <= 100; a++) {
            for (int b = a + 1; b <= 100; b++) {
                for (int c = b + 1; c <= 100; c++) {
                    int[] system = {c, b, a, 1};
                    systems++;
                    int amount = pearson(system);
                    if (amount < 0) continue;
                    failing++;
                    if (amount > cutoff) missed++;
                    if (amount > worstAmount) {
                        worstAmount = amount;
                        worstSystem = system;
                    }
                    double ratio = (double) amount / (system[0] + system[1]);
                    if (ratio > tightest) tightest = ratio;
                }
            }
        }

        System.out.println();
        System.out.println("every four-coin system with no coin above 100:");
        System.out.printf("  %d systems, %d not canonical%n", systems, failing);
        System.out.printf("  %d of those first fail above %d, so a %d-amount check calls them canonical%n",
            missed, cutoff, cutoff);
        System.out.printf("  latest first failure: %d, for %s%n", worstAmount, join(worstSystem));
        System.out.printf("  largest first failure as a fraction of the bound: %.4f%n", tightest);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

int greedy_coins(const std::vector<int>& system, int amount) {
    int used = 0;
    for (int coin : system) {
        used += amount / coin;
        amount %= coin;
    }
    return used;
}

std::vector<int> greedy_vector(const std::vector<int>& system, int amount) {
    std::vector<int> counts;
    for (int coin : system) {
        counts.push_back(amount / coin);
        amount %= coin;
    }
    return counts;
}

/** The smallest counterexample, or -1 when the system is canonical. */
int pearson(const std::vector<int>& system) {
    int n = static_cast<int>(system.size());
    int smallest = -1;
    for (int i = 1; i < n; ++i) {
        std::vector<int> above = greedy_vector(system, system[i - 1] - 1);
        for (int j = i; j < n; ++j) {
            int amount = 0;
            int used = 0;
            for (int k = 0; k < n; ++k) {
                int count = k < j ? above[k] : (k == j ? above[j] + 1 : 0);
                amount += count * system[k];
                used += count;
            }
            if (used < greedy_coins(system, amount) && (smallest < 0 || amount < smallest)) {
                smallest = amount;
            }
        }
    }
    return smallest;
}

std::vector<int> fewest_coins(const std::vector<int>& system, int limit) {
    std::vector<int> best(limit + 1, limit + 1);
    best[0] = 0;
    for (int amount = 1; amount <= limit; ++amount) {
        for (int coin : system) {
            if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                best[amount] = best[amount - coin] + 1;
            }
        }
    }
    return best;
}

int first_failure(const std::vector<int>& system, int limit) {
    std::vector<int> best = fewest_coins(system, limit);
    for (int amount = 1; amount <= limit; ++amount) {
        if (greedy_coins(system, amount) != best[amount]) return amount;
    }
    return -1;
}

std::string join(const std::vector<int>& system) {
    std::string out;
    for (size_t i = 0; i < system.size(); ++i) {
        if (i > 0) out += ' ';
        out += std::to_string(system[i]);
    }
    return out;
}

int main() {
    // One system that a hundred-amount check gets wrong.
    const std::vector<int> suspect = {91, 15, 2, 1};
    int short_search = first_failure(suspect, 100);
    std::cout << "system " << join(suspect) << "\\n";
    std::cout << "  bound (two largest coins): " << (suspect[0] + suspect[1]) << "\\n";
    std::cout << "  searching amounts 1 to 100: "
              << (short_search < 0 ? "no failure found" : std::to_string(short_search)) << "\\n";
    std::cout << "  searching to the bound:     "
              << first_failure(suspect, suspect[0] + suspect[1]) << "\\n";

    // And how common that is. Every four-coin system with no coin above 100,
    // decided by Pearson's test, which the previous example checked against the
    // bounded search.
    const int cutoff = 100;
    int systems = 0;
    int failing = 0;
    int missed = 0;
    int worst_amount = 0;
    std::vector<int> worst_system;
    double tightest = 0;

    for (int a = 2; a <= 100; ++a) {
        for (int b = a + 1; b <= 100; ++b) {
            for (int c = b + 1; c <= 100; ++c) {
                std::vector<int> system = {c, b, a, 1};
                systems++;
                int amount = pearson(system);
                if (amount < 0) continue;
                failing++;
                if (amount > cutoff) missed++;
                if (amount > worst_amount) {
                    worst_amount = amount;
                    worst_system = system;
                }
                double ratio = static_cast<double>(amount) / (system[0] + system[1]);
                if (ratio > tightest) tightest = ratio;
            }
        }
    }

    std::cout << "\\n";
    std::cout << "every four-coin system with no coin above 100:\\n";
    std::printf("  %d systems, %d not canonical\\n", systems, failing);
    std::printf("  %d of those first fail above %d, so a %d-amount check calls them canonical\\n",
                missed, cutoff, cutoff);
    std::printf("  latest first failure: %d, for %s\\n", worst_amount, join(worst_system).c_str());
    std::printf("  largest first failure as a fraction of the bound: %.4f\\n", tightest);
}
`,
            },
            {
              lang: "rust",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.

fn greedy_coins(system: &[i32], mut amount: i32) -> i32 {
    let mut used = 0;
    for &coin in system {
        used += amount / coin;
        amount %= coin;
    }
    used
}

fn greedy_vector(system: &[i32], mut amount: i32) -> Vec<i32> {
    let mut counts = Vec::new();
    for &coin in system {
        counts.push(amount / coin);
        amount %= coin;
    }
    counts
}

fn pearson(system: &[i32]) -> Option<i32> {
    let n = system.len();
    let mut smallest: Option<i32> = None;
    for i in 1..n {
        let above = greedy_vector(system, system[i - 1] - 1);
        for j in i..n {
            let mut amount = 0;
            let mut used = 0;
            for k in 0..n {
                let count = if k < j {
                    above[k]
                } else if k == j {
                    above[j] + 1
                } else {
                    0
                };
                amount += count * system[k];
                used += count;
            }
            if used < greedy_coins(system, amount) && smallest.is_none_or(|w| amount < w) {
                smallest = Some(amount);
            }
        }
    }
    smallest
}

fn fewest_coins(system: &[i32], limit: i32) -> Vec<i32> {
    let mut best = vec![limit + 1; (limit + 1) as usize];
    best[0] = 0;
    for amount in 1..=limit {
        for &coin in system {
            if coin <= amount && best[(amount - coin) as usize] + 1 < best[amount as usize] {
                best[amount as usize] = best[(amount - coin) as usize] + 1;
            }
        }
    }
    best
}

fn first_failure(system: &[i32], limit: i32) -> Option<i32> {
    let best = fewest_coins(system, limit);
    for amount in 1..=limit {
        if greedy_coins(system, amount) != best[amount as usize] {
            return Some(amount);
        }
    }
    None
}

fn join(system: &[i32]) -> String {
    system.iter().map(|c| c.to_string()).collect::<Vec<_>>().join(" ")
}

fn main() {
    // One system that a hundred-amount check gets wrong.
    let suspect = [91, 15, 2, 1];
    let short_search = match first_failure(&suspect, 100) {
        None => "no failure found".to_string(),
        Some(a) => a.to_string(),
    };
    println!("system {}", join(&suspect));
    println!("  bound (two largest coins): {}", suspect[0] + suspect[1]);
    println!("  searching amounts 1 to 100: {}", short_search);
    println!("  searching to the bound:     {}",
             first_failure(&suspect, suspect[0] + suspect[1]).unwrap());

    // And how common that is. Every four-coin system with no coin above 100,
    // decided by Pearson's test, which the previous example checked against the
    // bounded search.
    let cutoff = 100;
    let mut systems = 0;
    let mut failing = 0;
    let mut missed = 0;
    let mut worst_amount = 0;
    let mut worst_system: Vec<i32> = Vec::new();
    let mut tightest = 0.0_f64;

    for a in 2..=100 {
        for b in (a + 1)..=100 {
            for c in (b + 1)..=100 {
                let system = vec![c, b, a, 1];
                systems += 1;
                let amount = match pearson(&system) {
                    None => continue,
                    Some(w) => w,
                };
                failing += 1;
                if amount > cutoff {
                    missed += 1;
                }
                if amount > worst_amount {
                    worst_amount = amount;
                    worst_system = system.clone();
                }
                let ratio = f64::from(amount) / f64::from(system[0] + system[1]);
                if ratio > tightest {
                    tightest = ratio;
                }
            }
        }
    }

    println!();
    println!("every four-coin system with no coin above 100:");
    println!("  {} systems, {} not canonical", systems, failing);
    println!("  {} of those first fail above {}, so a {}-amount check calls them canonical",
             missed, cutoff, cutoff);
    println!("  latest first failure: {}, for {}", worst_amount, join(&worst_system));
    println!("  largest first failure as a fraction of the bound: {:.4}", tightest);
}
`,
            },
            {
              lang: "go",
              code: `// What the bound buys. "I tried the first hundred amounts and greedy was fine"
// is not an argument, and this is what it costs.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func greedyCoins(system []int, amount int) int {
	used := 0
	for _, coin := range system {
		used += amount / coin
		amount %= coin
	}
	return used
}

func greedyVector(system []int, amount int) []int {
	counts := make([]int, len(system))
	for k, coin := range system {
		counts[k] = amount / coin
		amount %= coin
	}
	return counts
}

// The smallest counterexample, or -1 when the system is canonical.
func pearson(system []int) int {
	n := len(system)
	smallest := -1
	for i := 1; i < n; i++ {
		above := greedyVector(system, system[i-1]-1)
		for j := i; j < n; j++ {
			amount := 0
			used := 0
			for k := 0; k < n; k++ {
				count := 0
				if k < j {
					count = above[k]
				} else if k == j {
					count = above[j] + 1
				}
				amount += count * system[k]
				used += count
			}
			if used < greedyCoins(system, amount) && (smallest < 0 || amount < smallest) {
				smallest = amount
			}
		}
	}
	return smallest
}

func fewestCoins(system []int, limit int) []int {
	best := make([]int, limit+1)
	for i := range best {
		best[i] = limit + 1
	}
	best[0] = 0
	for amount := 1; amount <= limit; amount++ {
		for _, coin := range system {
			if coin <= amount && best[amount-coin]+1 < best[amount] {
				best[amount] = best[amount-coin] + 1
			}
		}
	}
	return best
}

func firstFailure(system []int, limit int) int {
	best := fewestCoins(system, limit)
	for amount := 1; amount <= limit; amount++ {
		if greedyCoins(system, amount) != best[amount] {
			return amount
		}
	}
	return -1
}

func join(system []int) string {
	parts := make([]string, len(system))
	for i, c := range system {
		parts[i] = strconv.Itoa(c)
	}
	return strings.Join(parts, " ")
}

func main() {
	// One system that a hundred-amount check gets wrong.
	suspect := []int{91, 15, 2, 1}
	shortSearch := "no failure found"
	if found := firstFailure(suspect, 100); found >= 0 {
		shortSearch = strconv.Itoa(found)
	}
	fmt.Println("system " + join(suspect))
	fmt.Println("  bound (two largest coins):", suspect[0]+suspect[1])
	fmt.Println("  searching amounts 1 to 100: " + shortSearch)
	fmt.Println("  searching to the bound:    ", firstFailure(suspect, suspect[0]+suspect[1]))

	// And how common that is. Every four-coin system with no coin above 100,
	// decided by Pearson's test, which the previous example checked against the
	// bounded search.
	const cutoff = 100
	systems := 0
	failing := 0
	missed := 0
	worstAmount := 0
	var worstSystem []int
	tightest := 0.0

	for a := 2; a <= 100; a++ {
		for b := a + 1; b <= 100; b++ {
			for c := b + 1; c <= 100; c++ {
				system := []int{c, b, a, 1}
				systems++
				amount := pearson(system)
				if amount < 0 {
					continue
				}
				failing++
				if amount > cutoff {
					missed++
				}
				if amount > worstAmount {
					worstAmount = amount
					worstSystem = system
				}
				ratio := float64(amount) / float64(system[0]+system[1])
				if ratio > tightest {
					tightest = ratio
				}
			}
		}
	}

	fmt.Println()
	fmt.Println("every four-coin system with no coin above 100:")
	fmt.Printf("  %d systems, %d not canonical\\n", systems, failing)
	fmt.Printf("  %d of those first fail above %d, so a %d-amount check calls them canonical\\n",
		missed, cutoff, cutoff)
	fmt.Printf("  latest first failure: %d, for %s\\n", worstAmount, join(worstSystem))
	fmt.Printf("  largest first failure as a fraction of the bound: %.4f\\n", tightest)
}
`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide whether greedy coin change is optimal for a given coin system?",
      answer: "Not by trying amounts until you get bored. Two real options. The bounded search: by Kozen and Zaks, a non-canonical system's smallest counterexample is below the sum of its two largest coins, so compare greedy against a DP table up to that bound — find a mismatch and the system is refuted, find none and it is proved canonical. That costs O(c1 · n) time, which depends on the *values* of the coins. Or Pearson's test, which is O(n³) and depends only on how many coins there are: it constructs one candidate amount per pair of indices and checks each with a greedy pass. Pearson is the right answer when the coins are large; the bounded search is easier to write and easier to believe.",
    },
    {
      question: "Why is \"I tried the first hundred amounts and greedy always won\" not an argument?",
      answer: "Because the cutoff is unrelated to the thing being tested. The system 91, 15, 2, 1 first fails at 105, so a hundred-amount check passes it. Across all four-coin systems with no coin above a hundred, 38,529 of the non-canonical ones first fail above 100 — about a quarter of them. A search is only evidence of absence when the search covered every case that could have failed, which is what a bound gives you and an arbitrary cutoff does not.",
    },
    {
      question: "What is Pearson's test actually doing, in one sentence?",
      answer: "Constructing the only amounts that could be the smallest counterexample, instead of looking for them. If a system fails, the shortest representation of its smallest counterexample is pinned down by the pair (largest coin used, smallest coin used): above the smallest it copies the greedy representation of `c[i-1] - 1`, and at the smallest it holds one extra coin. That is n² candidates, each checkable with one greedy pass — so a whole system is decided in O(n³) with no reference to how large the coins are.",
    },
  ],
  takeaways: [
    "A counterexample refutes; a failed search proves nothing unless the search was bounded by something that says where a counterexample would have to be.",
    "Kozen and Zaks: a non-canonical system's smallest counterexample is below the sum of its two largest coins.",
    "That bound turns the hunt of lesson 3 into a decision procedure — the same loop, but now the negative answer means something.",
    "The bounded search costs the coin values; Pearson's test costs only the coin count, O(n³) either way the answer comes out the same.",
    "Pearson constructs candidates rather than searching amounts: one per (largest coin used, smallest coin used) pair.",
    "A fixed cutoff like 100 misses about a quarter of the failures among four-coin systems with coins up to 100.",
    "Canonical is a property of the system, not of the amounts you happened to try.",
  ],
  status: "available",
};
