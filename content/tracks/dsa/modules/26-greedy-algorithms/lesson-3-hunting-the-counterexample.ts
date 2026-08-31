import type { Lesson } from "@/content/types";

export const counterexampleLesson: Lesson = {
  id: "dsa-greedy-counterexample",
  slug: "hunting-the-counterexample",
  moduleSlug: "greedy-algorithms",
  title: "Breaking It: Hunting the Counterexample",
  summary:
    "Deciding whether a greedy rule is right by thinking about it is slow and unreliable. Searching for the instance that breaks it is fast, mechanical, and gives you something to hold.",
  estimatedMinutes: 35,
  objectives: [
    "Write an exhaustive small-case search that compares a greedy rule against brute force",
    "Score several candidate rules at once, rather than defending the first one you thought of",
    "Shrink a cluttered counterexample down to the smallest instance that still fails",
    "Say what a zero-counterexample search does and does not establish",
  ],
  sections: [
    {
      id: "search-the-small-cases",
      heading: "Search the small cases exhaustively",
      body: [
        "A greedy rule is a claim about every input, and claims about every input are hard to check by inspection. But almost every greedy failure shows up on a tiny instance — two or three items, small numbers — because the mechanism that breaks the rule is a single bad first choice, and a single bad first choice needs almost nothing to demonstrate.",
        "That makes exhaustive search over small inputs an unreasonably good tool. Enumerate every instance below some small size, solve each one both ways, and report the disagreements. Brute force is allowed to be slow, because the instances are tiny and it only has to be obviously correct.",
        "Coin change is the standard illustration. Taking the largest coin that fits is optimal for the coins in your pocket, which is why the rule feels safe, and it is a property of those particular denominations rather than of the rule.",
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
          id: "smallest-failing-system",
          title: "Searching every small coin system for a failure",
          lang: "python",
          code: `def greedy_coins(system, amount):
    """Largest coin that still fits, over and over."""
    used = 0
    for coin in sorted(system, reverse=True):
        while coin <= amount:
            amount -= coin
            used += 1
    return used if amount == 0 else None


def fewest_coins(system, amount):
    """The true optimum, by dynamic programming."""
    best = [0] + [None] * amount
    for target in range(1, amount + 1):
        for coin in system:
            if coin <= target and best[target - coin] is not None:
                option = best[target - coin] + 1
                if best[target] is None or option < best[target]:
                    best[target] = option
    return best[amount]


# Every three-coin system that includes a 1, so change can always be made.
MAX_COIN, MAX_AMOUNT = 8, 24
failures = []
systems = 0
for a in range(2, MAX_COIN + 1):
    for b in range(a + 1, MAX_COIN + 1):
        system = [1, a, b]
        systems += 1
        for amount in range(1, MAX_AMOUNT + 1):
            g, opt = greedy_coins(system, amount), fewest_coins(system, amount)
            if g != opt:
                failures.append((b, a, amount, system, g, opt))
                break

print(f"searched {systems} systems of the form [1, a, b] with b <= {MAX_COIN},")
print(f"each against every amount up to {MAX_AMOUNT}")
print(f"greedy is wrong somewhere in {len(failures)} of them")
print()

failures.sort()
print("the first few, smallest coin set first:")
print(f"  {'system':<12} {'amount':>6} {'greedy':>6} {'optimal':>7}")
for _, _, amount, system, g, opt in failures[:5]:
    print(f"  {str(system):<12} {amount:>6} {g:>6} {opt:>7}")

print()
b, a, amount, system, g, opt = failures[0]
print(f"the smallest counterexample is {system} making {amount}")
print(f"  greedy takes {b} first, because it fits, and needs {g} coins")
print(f"  the optimum is {opt} coins and never touches the {b}")
print()
print("this is what a counterexample is for: not proof that the rule is bad,")
print("but the smallest instance you can hold in your head while you work out")
print("why the first choice was the one that lost.")`,
          output: `searched 21 systems of the form [1, a, b] with b <= 8,
each against every amount up to 24
greedy is wrong somewhere in 9 of them

the first few, smallest coin set first:
  system       amount greedy optimal
  [1, 3, 4]         6      3       2
  [1, 4, 5]         8      4       2
  [1, 4, 6]         8      3       2
  [1, 5, 6]        10      5       2
  [1, 5, 7]        10      4       2

the smallest counterexample is [1, 3, 4] making 6
  greedy takes 4 first, because it fits, and needs 3 coins
  the optimum is 2 coins and never touches the 4

this is what a counterexample is for: not proof that the rule is bad,
but the smallest instance you can hold in your head while you work out
why the first choice was the one that lost.`,
          explanation:
            "The instinct on meeting a greedy rule is to think hard about whether it is right. The faster move is to search. The space of three-coin systems up to 8 is 21 systems, each checkable against every amount up to 24 in microseconds, and the search settles the question outright: greedy is wrong somewhere in nine of them. It also hands back the *smallest* failure, `[1, 3, 4]` making 6, which is small enough to reason about. A search like this is worth writing before the algorithm it is testing, because it takes two minutes and it answers a question that thinking about it often does not.",
          alternates: [
            {
              lang: "javascript",
              code: `/** Largest coin that still fits, over and over. */
function greedyCoins(system, amount) {
  let used = 0;
  for (const coin of [...system].sort((a, b) => b - a)) {
    while (coin <= amount) {
      amount -= coin;
      used += 1;
    }
  }
  return amount === 0 ? used : null;
}

/** The true optimum, by dynamic programming. */
function fewestCoins(system, amount) {
  const best = [0, ...new Array(amount).fill(null)];
  for (let target = 1; target <= amount; target++) {
    for (const coin of system) {
      if (coin <= target && best[target - coin] !== null) {
        const option = best[target - coin] + 1;
        const current = best[target];
        if (current === null || option < current) best[target] = option;
      }
    }
  }
  return best[amount];
}

// Every three-coin system that includes a 1, so change can always be made.
const MAX_COIN = 8;
const MAX_AMOUNT = 24;
const failures = [];
let systems = 0;
for (let a = 2; a <= MAX_COIN; a++) {
  for (let b = a + 1; b <= MAX_COIN; b++) {
    const system = [1, a, b];
    systems += 1;
    for (let amount = 1; amount <= MAX_AMOUNT; amount++) {
      const g = greedyCoins(system, amount);
      const opt = fewestCoins(system, amount);
      if (g !== opt) {
        failures.push({ b, a, amount, system, g, opt });
        break;
      }
    }
  }
}

console.log(\`searched \${systems} systems of the form [1, a, b] with b <= \${MAX_COIN},\`);
console.log(\`each against every amount up to \${MAX_AMOUNT}\`);
console.log(\`greedy is wrong somewhere in \${failures.length} of them\`);
console.log();

failures.sort((x, y) => x.b - y.b || x.a - y.a || x.amount - y.amount);
const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);
const show = (a) => \`[\${a.join(", ")}]\`;

console.log("the first few, smallest coin set first:");
console.log(\`  \${padR("system", 12)} \${padL("amount", 6)} \${padL("greedy", 6)} \${padL("optimal", 7)}\`);
for (const f of failures.slice(0, 5)) {
  console.log(\`  \${padR(show(f.system), 12)} \${padL(f.amount, 6)} \${padL(f.g, 6)} \${padL(f.opt, 7)}\`);
}

console.log();
const first = failures[0];
console.log(\`the smallest counterexample is \${show(first.system)} making \${first.amount}\`);
console.log(\`  greedy takes \${first.b} first, because it fits, and needs \${first.g} coins\`);
console.log(\`  the optimum is \${first.opt} coins and never touches the \${first.b}\`);
console.log();
console.log("this is what a counterexample is for: not proof that the rule is bad,");
console.log("but the smallest instance you can hold in your head while you work out");
console.log("why the first choice was the one that lost.");`,
            },
            {
              lang: "typescript",
              code: `/** Largest coin that still fits, over and over. */
function greedyCoins(system: number[], amount: number): number | null {
  let used = 0;
  for (const coin of [...system].sort((a, b) => b - a)) {
    while (coin <= amount) {
      amount -= coin;
      used += 1;
    }
  }
  return amount === 0 ? used : null;
}

/** The true optimum, by dynamic programming. */
function fewestCoins(system: number[], amount: number): number | null {
  const best: (number | null)[] = [0, ...new Array<number | null>(amount).fill(null)];
  for (let target = 1; target <= amount; target++) {
    for (const coin of system) {
      if (coin <= target && best[target - coin] !== null) {
        const option = best[target - coin]! + 1;
        const current = best[target];
        if (current === null || option < current) best[target] = option;
      }
    }
  }
  return best[amount];
}

// Every three-coin system that includes a 1, so change can always be made.
const MAX_COIN = 8;
const MAX_AMOUNT = 24;
interface Failure {
  b: number;
  a: number;
  amount: number;
  system: number[];
  g: number | null;
  opt: number | null;
}

const failures: Failure[] = [];
let systems = 0;
for (let a = 2; a <= MAX_COIN; a++) {
  for (let b = a + 1; b <= MAX_COIN; b++) {
    const system = [1, a, b];
    systems += 1;
    for (let amount = 1; amount <= MAX_AMOUNT; amount++) {
      const g = greedyCoins(system, amount);
      const opt = fewestCoins(system, amount);
      if (g !== opt) {
        failures.push({ b, a, amount, system, g, opt });
        break;
      }
    }
  }
}

console.log(\`searched \${systems} systems of the form [1, a, b] with b <= \${MAX_COIN},\`);
console.log(\`each against every amount up to \${MAX_AMOUNT}\`);
console.log(\`greedy is wrong somewhere in \${failures.length} of them\`);
console.log();

failures.sort((x, y) => x.b - y.b || x.a - y.a || x.amount - y.amount);
const padL = (s: string | number | null, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);
const show = (a: number[]): string => \`[\${a.join(", ")}]\`;

console.log("the first few, smallest coin set first:");
console.log(\`  \${padR("system", 12)} \${padL("amount", 6)} \${padL("greedy", 6)} \${padL("optimal", 7)}\`);
for (const f of failures.slice(0, 5)) {
  console.log(\`  \${padR(show(f.system), 12)} \${padL(f.amount, 6)} \${padL(f.g, 6)} \${padL(f.opt, 7)}\`);
}

console.log();
const first = failures[0];
console.log(\`the smallest counterexample is \${show(first.system)} making \${first.amount}\`);
console.log(\`  greedy takes \${first.b} first, because it fits, and needs \${first.g} coins\`);
console.log(\`  the optimum is \${first.opt} coins and never touches the \${first.b}\`);
console.log();
console.log("this is what a counterexample is for: not proof that the rule is bad,");
console.log("but the smallest instance you can hold in your head while you work out");
console.log("why the first choice was the one that lost.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    /** Largest coin that still fits, over and over. */
    static Integer greedyCoins(int[] system, int amount) {
        int used = 0;
        int[] desc = system.clone();
        for (int i = 0; i < desc.length / 2; i++) {
            int t = desc[i];
            desc[i] = desc[desc.length - 1 - i];
            desc[desc.length - 1 - i] = t;
        }
        for (int coin : desc) {
            while (coin <= amount) {
                amount -= coin;
                used += 1;
            }
        }
        return amount == 0 ? used : null;
    }

    /** The true optimum, by dynamic programming. */
    static Integer fewestCoins(int[] system, int amount) {
        Integer[] best = new Integer[amount + 1];
        best[0] = 0;
        for (int target = 1; target <= amount; target++) {
            for (int coin : system) {
                if (coin <= target && best[target - coin] != null) {
                    int option = best[target - coin] + 1;
                    if (best[target] == null || option < best[target]) best[target] = option;
                }
            }
        }
        return best[amount];
    }

    record Failure(int b, int a, int amount, int[] system, Integer g, Integer opt) {}

    static String show(int[] a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) sb.append(i > 0 ? ", " : "").append(a[i]);
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        // Every three-coin system that includes a 1, so change can always be made.
        final int MAX_COIN = 8;
        final int MAX_AMOUNT = 24;
        List<Failure> failures = new ArrayList<>();
        int systems = 0;
        for (int a = 2; a <= MAX_COIN; a++) {
            for (int b = a + 1; b <= MAX_COIN; b++) {
                int[] system = {1, a, b};
                systems += 1;
                for (int amount = 1; amount <= MAX_AMOUNT; amount++) {
                    Integer g = greedyCoins(system, amount);
                    Integer opt = fewestCoins(system, amount);
                    if (g == null ? opt != null : !g.equals(opt)) {
                        failures.add(new Failure(b, a, amount, system, g, opt));
                        break;
                    }
                }
            }
        }

        System.out.println("searched " + systems + " systems of the form [1, a, b] with b <= "
                + MAX_COIN + ",");
        System.out.println("each against every amount up to " + MAX_AMOUNT);
        System.out.println("greedy is wrong somewhere in " + failures.size() + " of them");
        System.out.println();

        failures.sort(Comparator.comparingInt(Failure::b)
                .thenComparingInt(Failure::a)
                .thenComparingInt(Failure::amount));

        System.out.println("the first few, smallest coin set first:");
        System.out.printf("  %-12s %6s %6s %7s%n", "system", "amount", "greedy", "optimal");
        for (Failure f : failures.subList(0, 5)) {
            System.out.printf("  %-12s %6d %6d %7d%n", show(f.system()), f.amount(), f.g(), f.opt());
        }

        System.out.println();
        Failure first = failures.get(0);
        System.out.println("the smallest counterexample is " + show(first.system())
                + " making " + first.amount());
        System.out.println("  greedy takes " + first.b()
                + " first, because it fits, and needs " + first.g() + " coins");
        System.out.println("  the optimum is " + first.opt()
                + " coins and never touches the " + first.b());
        System.out.println();
        System.out.println("this is what a counterexample is for: not proof that the rule is bad,");
        System.out.println("but the smallest instance you can hold in your head while you work out");
        System.out.println("why the first choice was the one that lost.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <optional>
#include <string>
#include <vector>

/** Largest coin that still fits, over and over. */
std::optional<int> greedyCoins(std::vector<int> system, int amount) {
    int used = 0;
    std::sort(system.begin(), system.end(), std::greater<int>());
    for (int coin : system) {
        while (coin <= amount) {
            amount -= coin;
            used += 1;
        }
    }
    return amount == 0 ? std::optional<int>(used) : std::nullopt;
}

/** The true optimum, by dynamic programming. */
std::optional<int> fewestCoins(const std::vector<int>& system, int amount) {
    std::vector<std::optional<int>> best(amount + 1, std::nullopt);
    best[0] = 0;
    for (int target = 1; target <= amount; target++) {
        for (int coin : system) {
            if (coin <= target && best[target - coin].has_value()) {
                int option = *best[target - coin] + 1;
                if (!best[target].has_value() || option < *best[target]) best[target] = option;
            }
        }
    }
    return best[amount];
}

struct Failure {
    int b, a, amount;
    std::vector<int> system;
    std::optional<int> g, opt;
};

std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (std::size_t i = 0; i < a.size(); i++) out += (i ? ", " : "") + std::to_string(a[i]);
    return out + "]";
}

int main() {
    // Every three-coin system that includes a 1, so change can always be made.
    const int MAX_COIN = 8;
    const int MAX_AMOUNT = 24;
    std::vector<Failure> failures;
    int systems = 0;
    for (int a = 2; a <= MAX_COIN; a++) {
        for (int b = a + 1; b <= MAX_COIN; b++) {
            std::vector<int> system = {1, a, b};
            systems += 1;
            for (int amount = 1; amount <= MAX_AMOUNT; amount++) {
                auto g = greedyCoins(system, amount);
                auto opt = fewestCoins(system, amount);
                if (g != opt) {
                    failures.push_back({b, a, amount, system, g, opt});
                    break;
                }
            }
        }
    }

    std::cout << "searched " << systems << " systems of the form [1, a, b] with b <= "
              << MAX_COIN << ",\\n";
    std::cout << "each against every amount up to " << MAX_AMOUNT << '\\n';
    std::cout << "greedy is wrong somewhere in " << failures.size() << " of them\\n\\n";

    std::stable_sort(failures.begin(), failures.end(), [](const Failure& x, const Failure& y) {
        if (x.b != y.b) return x.b < y.b;
        if (x.a != y.a) return x.a < y.a;
        return x.amount < y.amount;
    });

    std::cout << "the first few, smallest coin set first:\\n";
    std::cout << "  " << std::left << std::setw(12) << "system" << std::right << ' '
              << std::setw(6) << "amount" << ' ' << std::setw(6) << "greedy" << ' '
              << std::setw(7) << "optimal" << '\\n';
    for (int i = 0; i < 5; i++) {
        const Failure& f = failures[i];
        std::cout << "  " << std::left << std::setw(12) << show(f.system) << std::right << ' '
                  << std::setw(6) << f.amount << ' ' << std::setw(6) << *f.g << ' '
                  << std::setw(7) << *f.opt << '\\n';
    }

    std::cout << '\\n';
    const Failure& first = failures[0];
    std::cout << "the smallest counterexample is " << show(first.system)
              << " making " << first.amount << '\\n';
    std::cout << "  greedy takes " << first.b << " first, because it fits, and needs "
              << *first.g << " coins\\n";
    std::cout << "  the optimum is " << *first.opt << " coins and never touches the "
              << first.b << "\\n\\n";
    std::cout << "this is what a counterexample is for: not proof that the rule is bad,\\n";
    std::cout << "but the smallest instance you can hold in your head while you work out\\n";
    std::cout << "why the first choice was the one that lost.\\n";
}`,
            },
            {
              lang: "rust",
              code: `/// Largest coin that still fits, over and over.
fn greedy_coins(system: &[i32], mut amount: i32) -> Option<i32> {
    let mut used = 0;
    let mut desc = system.to_vec();
    desc.sort_by(|a, b| b.cmp(a));
    for coin in desc {
        while coin <= amount {
            amount -= coin;
            used += 1;
        }
    }
    if amount == 0 { Some(used) } else { None }
}

/// The true optimum, by dynamic programming.
fn fewest_coins(system: &[i32], amount: i32) -> Option<i32> {
    let n = amount as usize;
    let mut best: Vec<Option<i32>> = vec![None; n + 1];
    best[0] = Some(0);
    for target in 1..=n {
        for &coin in system {
            let c = coin as usize;
            if c <= target {
                if let Some(prev) = best[target - c] {
                    let option = prev + 1;
                    if best[target].is_none() || option < best[target].unwrap() {
                        best[target] = Some(option);
                    }
                }
            }
        }
    }
    best[n]
}

struct Failure {
    b: i32,
    a: i32,
    amount: i32,
    system: Vec<i32>,
    g: Option<i32>,
    opt: Option<i32>,
}

fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    // Every three-coin system that includes a 1, so change can always be made.
    const MAX_COIN: i32 = 8;
    const MAX_AMOUNT: i32 = 24;
    let mut failures: Vec<Failure> = Vec::new();
    let mut systems = 0;
    for a in 2..=MAX_COIN {
        for b in (a + 1)..=MAX_COIN {
            let system = vec![1, a, b];
            systems += 1;
            for amount in 1..=MAX_AMOUNT {
                let g = greedy_coins(&system, amount);
                let opt = fewest_coins(&system, amount);
                if g != opt {
                    failures.push(Failure { b, a, amount, system: system.clone(), g, opt });
                    break;
                }
            }
        }
    }

    println!("searched {} systems of the form [1, a, b] with b <= {},", systems, MAX_COIN);
    println!("each against every amount up to {}", MAX_AMOUNT);
    println!("greedy is wrong somewhere in {} of them", failures.len());
    println!();

    failures.sort_by(|x, y| (x.b, x.a, x.amount).cmp(&(y.b, y.a, y.amount)));

    println!("the first few, smallest coin set first:");
    println!("  {:<12} {:>6} {:>6} {:>7}", "system", "amount", "greedy", "optimal");
    for f in failures.iter().take(5) {
        println!("  {:<12} {:>6} {:>6} {:>7}",
                 show(&f.system), f.amount, f.g.unwrap(), f.opt.unwrap());
    }

    println!();
    let first = &failures[0];
    println!("the smallest counterexample is {} making {}", show(&first.system), first.amount);
    println!("  greedy takes {} first, because it fits, and needs {} coins",
             first.b, first.g.unwrap());
    println!("  the optimum is {} coins and never touches the {}", first.opt.unwrap(), first.b);
    println!();
    println!("this is what a counterexample is for: not proof that the rule is bad,");
    println!("but the smallest instance you can hold in your head while you work out");
    println!("why the first choice was the one that lost.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// greedyCoins takes the largest coin that still fits, over and over.
func greedyCoins(system []int, amount int) (int, bool) {
	used := 0
	desc := append([]int(nil), system...)
	sort.Sort(sort.Reverse(sort.IntSlice(desc)))
	for _, coin := range desc {
		for coin <= amount {
			amount -= coin
			used++
		}
	}
	if amount == 0 {
		return used, true
	}
	return 0, false
}

// fewestCoins is the true optimum, by dynamic programming.
func fewestCoins(system []int, amount int) (int, bool) {
	best := make([]int, amount+1)
	ok := make([]bool, amount+1)
	ok[0] = true
	for target := 1; target <= amount; target++ {
		for _, coin := range system {
			if coin <= target && ok[target-coin] {
				option := best[target-coin] + 1
				if !ok[target] || option < best[target] {
					best[target] = option
					ok[target] = true
				}
			}
		}
	}
	return best[amount], ok[amount]
}

type failure struct {
	b, a, amount int
	system       []int
	g, opt       int
}

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	// Every three-coin system that includes a 1, so change can always be made.
	const maxCoin = 8
	const maxAmount = 24
	var failures []failure
	systems := 0
	for a := 2; a <= maxCoin; a++ {
		for b := a + 1; b <= maxCoin; b++ {
			system := []int{1, a, b}
			systems++
			for amount := 1; amount <= maxAmount; amount++ {
				g, gOK := greedyCoins(system, amount)
				opt, optOK := fewestCoins(system, amount)
				if g != opt || gOK != optOK {
					failures = append(failures, failure{b, a, amount, system, g, opt})
					break
				}
			}
		}
	}

	fmt.Printf("searched %d systems of the form [1, a, b] with b <= %d,\\n", systems, maxCoin)
	fmt.Printf("each against every amount up to %d\\n", maxAmount)
	fmt.Printf("greedy is wrong somewhere in %d of them\\n", len(failures))
	fmt.Println()

	sort.SliceStable(failures, func(i, j int) bool {
		x, y := failures[i], failures[j]
		if x.b != y.b {
			return x.b < y.b
		}
		if x.a != y.a {
			return x.a < y.a
		}
		return x.amount < y.amount
	})

	fmt.Println("the first few, smallest coin set first:")
	fmt.Printf("  %-12s %6s %6s %7s\\n", "system", "amount", "greedy", "optimal")
	for _, f := range failures[:5] {
		fmt.Printf("  %-12s %6d %6d %7d\\n", show(f.system), f.amount, f.g, f.opt)
	}

	fmt.Println()
	first := failures[0]
	fmt.Printf("the smallest counterexample is %s making %d\\n", show(first.system), first.amount)
	fmt.Printf("  greedy takes %d first, because it fits, and needs %d coins\\n", first.b, first.g)
	fmt.Printf("  the optimum is %d coins and never touches the %d\\n", first.opt, first.b)
	fmt.Println()
	fmt.Println("this is what a counterexample is for: not proof that the rule is bad,")
	fmt.Println("but the smallest instance you can hold in your head while you work out")
	fmt.Println("why the first choice was the one that lost.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "score-every-rule",
      heading: "Score every rule you were tempted by",
      body: [
        "A search is more useful still when it judges several rules at once. Most greedy problems come with a handful of plausible orderings, and the honest position before doing any work is that you do not know which is right — so test them together rather than defending the first one that occurred to you.",
        "Interval scheduling is the clearest case. Given a set of meetings and one room, you could take the meeting that starts earliest, or the shortest one, or the one that finishes earliest, and all three sound reasonable when said out loud.",
        "Run all three against brute force on every small instance and the field thins immediately. What matters as much as the counts is their *shape*: a rule that fails on one instance in twelve is easy to catch, and a rule that fails on three in a thousand will survive every test anyone writes by hand — which makes rarity a reason for more suspicion rather than less.",
      ],
      examples: [
        {
          id: "scoring-every-rule",
          title: "Every plausible sort key, scored against the truth",
          lang: "python",
          code: `from itertools import combinations

HORIZON = 6
ALL = [(s, e) for s in range(HORIZON) for e in range(s + 1, HORIZON + 1)]


def schedule(intervals, key):
    """Take meetings in \`key\` order, skipping any that overlap what is booked."""
    booked = []
    for it in sorted(intervals, key=key):
        if all(it[1] <= b[0] or it[0] >= b[1] for b in booked):
            booked.append(it)
    return len(booked)


def optimum(intervals):
    best = 0
    for size in range(len(intervals), 0, -1):
        for combo in combinations(intervals, size):
            ordered = sorted(combo)
            if all(ordered[i][0] >= ordered[i - 1][1] for i in range(1, len(ordered))):
                return size
    return best


RULES = {
    "earliest start": lambda it: (it[0], it[1]),
    "shortest first": lambda it: (it[1] - it[0], it[0]),
    "earliest finish": lambda it: (it[1], it[0]),
}

sets = list(combinations(ALL, 3))
print(f"every set of 3 meetings inside a {HORIZON}-hour day: {len(sets)} of them")
print(f"each rule scored against the true optimum, found by brute force")
print()

worst = {}
wrong = dict.fromkeys(RULES, 0)
for group in sets:
    best = optimum(group)
    for name, key in RULES.items():
        got = schedule(group, key)
        if got < best:
            wrong[name] += 1
            if name not in worst:
                worst[name] = (group, got, best)

print(f"  {'rule':<16} {'sets it gets wrong':>19}")
for name in RULES:
    print(f"  {name:<16} {wrong[name]:>19}")

print()
for name in RULES:
    if name not in worst:
        print(f"{name}: no counterexample exists in this space")
        continue
    group, got, best = worst[name]
    shown = ", ".join(f"{s}–{e}" for s, e in group)
    print(f"{name} first fails on {shown}")
    print(f"  it books {got}, and {best} was available")

print()
print("earliest finish is the only rule with nothing against it, and this is")
print("the evidence before the proof rather than instead of it — the next")
print("lesson has to say why finishing early is the property that matters.")`,
          output: `every set of 3 meetings inside a 6-hour day: 1330 of them
each rule scored against the true optimum, found by brute force

  rule              sets it gets wrong
  earliest start                   112
  shortest first                     4
  earliest finish                    0

earliest start first fails on 0–3, 1–2, 2–3
  it books 1, and 2 was available
shortest first first fails on 0–3, 2–4, 3–5
  it books 1, and 2 was available
earliest finish: no counterexample exists in this space

earliest finish is the only rule with nothing against it, and this is
the evidence before the proof rather than instead of it — the next
lesson has to say why finishing early is the property that matters.`,
          explanation:
            "Interval scheduling has several rules that sound equally sensible, and this is the cheapest way to tell them apart. Enumerating all 1,330 three-meeting sets inside a six-hour day and comparing each rule with the brute-force optimum kills two of them immediately: earliest-start is wrong 112 times, shortest-first 4 times, and earliest-finish never. Note what the failure counts do *not* tell you — that shortest-first fails rarely makes it more dangerous, not less, because a rule that is wrong 4 times in 1,330 will pass any test suite you write by hand. And note what this is not: zero counterexamples in one small space is evidence, not proof. The next lesson owes you the reason.",
          alternates: [
            {
              lang: "javascript",
              code: `const HORIZON = 6;
const ALL = [];
for (let s = 0; s < HORIZON; s++) {
  for (let e = s + 1; e <= HORIZON; e++) ALL.push([s, e]);
}

/** Take meetings in \`key\` order, skipping any that overlap what is booked. */
function schedule(intervals, key) {
  const booked = [];
  for (const it of [...intervals].sort((x, y) => {
    const [a, b] = [key(x), key(y)];
    return a[0] - b[0] || a[1] - b[1];
  })) {
    if (booked.every((b) => it[1] <= b[0] || it[0] >= b[1])) booked.push(it);
  }
  return booked.length;
}

function optimum(intervals) {
  for (let size = intervals.length; size > 0; size--) {
    for (let mask = 0; mask < 1 << intervals.length; mask++) {
      const combo = intervals.filter((_, i) => (mask >> i) & 1);
      if (combo.length !== size) continue;
      const ordered = [...combo].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let ok = true;
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i][0] < ordered[i - 1][1]) ok = false;
      }
      if (ok) return size;
    }
  }
  return 0;
}

const RULES = {
  "earliest start": (it) => [it[0], it[1]],
  "shortest first": (it) => [it[1] - it[0], it[0]],
  "earliest finish": (it) => [it[1], it[0]],
};

const sets = [];
for (let i = 0; i < ALL.length; i++) {
  for (let j = i + 1; j < ALL.length; j++) {
    for (let k = j + 1; k < ALL.length; k++) sets.push([ALL[i], ALL[j], ALL[k]]);
  }
}

console.log(\`every set of 3 meetings inside a \${HORIZON}-hour day: \${sets.length} of them\`);
console.log("each rule scored against the true optimum, found by brute force");
console.log();

const worst = {};
const wrong = Object.fromEntries(Object.keys(RULES).map((n) => [n, 0]));
for (const group of sets) {
  const best = optimum(group);
  for (const [name, key] of Object.entries(RULES)) {
    const got = schedule(group, key);
    if (got < best) {
      wrong[name] += 1;
      if (!(name in worst)) worst[name] = { group, got, best };
    }
  }
}

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);
console.log(\`  \${padR("rule", 16)} \${padL("sets it gets wrong", 19)}\`);
for (const name of Object.keys(RULES)) {
  console.log(\`  \${padR(name, 16)} \${padL(wrong[name], 19)}\`);
}

console.log();
for (const name of Object.keys(RULES)) {
  if (!(name in worst)) {
    console.log(\`\${name}: no counterexample exists in this space\`);
    continue;
  }
  const { group, got, best } = worst[name];
  const shown = group.map(([s, e]) => \`\${s}–\${e}\`).join(", ");
  console.log(\`\${name} first fails on \${shown}\`);
  console.log(\`  it books \${got}, and \${best} was available\`);
}

console.log();
console.log("earliest finish is the only rule with nothing against it, and this is");
console.log("the evidence before the proof rather than instead of it — the next");
console.log("lesson has to say why finishing early is the property that matters.");`,
            },
            {
              lang: "typescript",
              code: `const HORIZON = 6;
type Interval = [number, number];
type Key = (it: Interval) => [number, number];

const ALL: Interval[] = [];
for (let s = 0; s < HORIZON; s++) {
  for (let e = s + 1; e <= HORIZON; e++) ALL.push([s, e]);
}

/** Take meetings in \`key\` order, skipping any that overlap what is booked. */
function schedule(intervals: Interval[], key: Key): number {
  const booked: Interval[] = [];
  for (const it of [...intervals].sort((x, y) => {
    const [a, b] = [key(x), key(y)];
    return a[0] - b[0] || a[1] - b[1];
  })) {
    if (booked.every((b) => it[1] <= b[0] || it[0] >= b[1])) booked.push(it);
  }
  return booked.length;
}

function optimum(intervals: Interval[]): number {
  for (let size = intervals.length; size > 0; size--) {
    for (let mask = 0; mask < 1 << intervals.length; mask++) {
      const combo = intervals.filter((_, i) => (mask >> i) & 1);
      if (combo.length !== size) continue;
      const ordered = [...combo].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let ok = true;
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i][0] < ordered[i - 1][1]) ok = false;
      }
      if (ok) return size;
    }
  }
  return 0;
}

const RULES: Record<string, Key> = {
  "earliest start": (it: Interval) => [it[0], it[1]],
  "shortest first": (it: Interval) => [it[1] - it[0], it[0]],
  "earliest finish": (it: Interval) => [it[1], it[0]],
};

const sets: Interval[][] = [];
for (let i = 0; i < ALL.length; i++) {
  for (let j = i + 1; j < ALL.length; j++) {
    for (let k = j + 1; k < ALL.length; k++) sets.push([ALL[i], ALL[j], ALL[k]]);
  }
}

console.log(\`every set of 3 meetings inside a \${HORIZON}-hour day: \${sets.length} of them\`);
console.log("each rule scored against the true optimum, found by brute force");
console.log();

interface Worst {
  group: Interval[];
  got: number;
  best: number;
}

const worst: Record<string, Worst> = {};
const wrong: Record<string, number> = Object.fromEntries(Object.keys(RULES).map((n) => [n, 0]));
for (const group of sets) {
  const best = optimum(group);
  for (const [name, key] of Object.entries(RULES)) {
    const got = schedule(group, key);
    if (got < best) {
      wrong[name] += 1;
      if (!(name in worst)) worst[name] = { group, got, best };
    }
  }
}

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);
console.log(\`  \${padR("rule", 16)} \${padL("sets it gets wrong", 19)}\`);
for (const name of Object.keys(RULES)) {
  console.log(\`  \${padR(name, 16)} \${padL(wrong[name], 19)}\`);
}

console.log();
for (const name of Object.keys(RULES)) {
  if (!(name in worst)) {
    console.log(\`\${name}: no counterexample exists in this space\`);
    continue;
  }
  const { group, got, best } = worst[name];
  const shown = group.map(([s, e]) => \`\${s}–\${e}\`).join(", ");
  console.log(\`\${name} first fails on \${shown}\`);
  console.log(\`  it books \${got}, and \${best} was available\`);
}

console.log();
console.log("earliest finish is the only rule with nothing against it, and this is");
console.log("the evidence before the proof rather than instead of it — the next");
console.log("lesson has to say why finishing early is the property that matters.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class Main {
    static final int HORIZON = 6;

    /** Take meetings in \`key\` order, skipping any that overlap what is booked. */
    static int schedule(List<int[]> intervals, Function<int[], int[]> key) {
        List<int[]> ordered = new ArrayList<>(intervals);
        ordered.sort((x, y) -> {
            int[] a = key.apply(x);
            int[] b = key.apply(y);
            return a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]);
        });
        List<int[]> booked = new ArrayList<>();
        for (int[] it : ordered) {
            boolean free = true;
            for (int[] b : booked) {
                if (!(it[1] <= b[0] || it[0] >= b[1])) free = false;
            }
            if (free) booked.add(it);
        }
        return booked.size();
    }

    static int optimum(List<int[]> intervals) {
        for (int size = intervals.size(); size > 0; size--) {
            for (int mask = 0; mask < 1 << intervals.size(); mask++) {
                List<int[]> combo = new ArrayList<>();
                for (int i = 0; i < intervals.size(); i++) {
                    if ((mask >> i & 1) == 1) combo.add(intervals.get(i));
                }
                if (combo.size() != size) continue;
                combo.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                        : Integer.compare(a[1], b[1]));
                boolean ok = true;
                for (int i = 1; i < combo.size(); i++) {
                    if (combo.get(i)[0] < combo.get(i - 1)[1]) ok = false;
                }
                if (ok) return size;
            }
        }
        return 0;
    }

    public static void main(String[] args) {
        List<int[]> all = new ArrayList<>();
        for (int s = 0; s < HORIZON; s++) {
            for (int e = s + 1; e <= HORIZON; e++) all.add(new int[] {s, e});
        }

        Map<String, Function<int[], int[]>> rules = new LinkedHashMap<>();
        rules.put("earliest start", it -> new int[] {it[0], it[1]});
        rules.put("shortest first", it -> new int[] {it[1] - it[0], it[0]});
        rules.put("earliest finish", it -> new int[] {it[1], it[0]});

        List<List<int[]>> sets = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            for (int j = i + 1; j < all.size(); j++) {
                for (int k = j + 1; k < all.size(); k++) {
                    sets.add(List.of(all.get(i), all.get(j), all.get(k)));
                }
            }
        }

        System.out.println("every set of 3 meetings inside a " + HORIZON + "-hour day: "
                + sets.size() + " of them");
        System.out.println("each rule scored against the true optimum, found by brute force");
        System.out.println();

        Map<String, Object[]> worst = new LinkedHashMap<>();
        Map<String, Integer> wrong = new LinkedHashMap<>();
        for (String name : rules.keySet()) wrong.put(name, 0);

        for (List<int[]> group : sets) {
            int best = optimum(group);
            for (Map.Entry<String, Function<int[], int[]>> rule : rules.entrySet()) {
                int got = schedule(group, rule.getValue());
                if (got < best) {
                    wrong.merge(rule.getKey(), 1, Integer::sum);
                    worst.putIfAbsent(rule.getKey(), new Object[] {group, got, best});
                }
            }
        }

        System.out.printf("  %-16s %19s%n", "rule", "sets it gets wrong");
        for (String name : rules.keySet()) {
            System.out.printf("  %-16s %19d%n", name, wrong.get(name));
        }

        System.out.println();
        for (String name : rules.keySet()) {
            if (!worst.containsKey(name)) {
                System.out.println(name + ": no counterexample exists in this space");
                continue;
            }
            Object[] w = worst.get(name);
            @SuppressWarnings("unchecked")
            List<int[]> group = (List<int[]>) w[0];
            List<String> parts = new ArrayList<>();
            for (int[] it : group) parts.add(it[0] + "–" + it[1]);
            System.out.println(name + " first fails on " + String.join(", ", parts));
            System.out.println("  it books " + w[1] + ", and " + w[2] + " was available");
        }

        System.out.println();
        System.out.println("earliest finish is the only rule with nothing against it, and this is");
        System.out.println("the evidence before the proof rather than instead of it — the next");
        System.out.println("lesson has to say why finishing early is the property that matters.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <array>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

using Interval = std::array<int, 2>;
using Key = std::function<Interval(const Interval&)>;

constexpr int HORIZON = 6;

/** Take meetings in \`key\` order, skipping any that overlap what is booked. */
int schedule(const std::vector<Interval>& intervals, const Key& key) {
    std::vector<Interval> ordered = intervals;
    std::stable_sort(ordered.begin(), ordered.end(), [&](const Interval& x, const Interval& y) {
        return key(x) < key(y);
    });
    std::vector<Interval> booked;
    for (const Interval& it : ordered) {
        bool free = true;
        for (const Interval& b : booked) {
            if (!(it[1] <= b[0] || it[0] >= b[1])) free = false;
        }
        if (free) booked.push_back(it);
    }
    return static_cast<int>(booked.size());
}

int optimum(const std::vector<Interval>& intervals) {
    const int n = static_cast<int>(intervals.size());
    for (int size = n; size > 0; size--) {
        for (int mask = 0; mask < 1 << n; mask++) {
            std::vector<Interval> combo;
            for (int i = 0; i < n; i++) {
                if (mask >> i & 1) combo.push_back(intervals[i]);
            }
            if (static_cast<int>(combo.size()) != size) continue;
            std::sort(combo.begin(), combo.end());
            bool ok = true;
            for (std::size_t i = 1; i < combo.size(); i++) {
                if (combo[i][0] < combo[i - 1][1]) ok = false;
            }
            if (ok) return size;
        }
    }
    return 0;
}

int main() {
    std::vector<Interval> all;
    for (int s = 0; s < HORIZON; s++) {
        for (int e = s + 1; e <= HORIZON; e++) all.push_back({s, e});
    }

    const std::vector<std::pair<std::string, Key>> rules = {
        {"earliest start", [](const Interval& it) { return Interval{it[0], it[1]}; }},
        {"shortest first", [](const Interval& it) { return Interval{it[1] - it[0], it[0]}; }},
        {"earliest finish", [](const Interval& it) { return Interval{it[1], it[0]}; }},
    };

    std::vector<std::vector<Interval>> sets;
    for (std::size_t i = 0; i < all.size(); i++) {
        for (std::size_t j = i + 1; j < all.size(); j++) {
            for (std::size_t k = j + 1; k < all.size(); k++) {
                sets.push_back({all[i], all[j], all[k]});
            }
        }
    }

    std::cout << "every set of 3 meetings inside a " << HORIZON << "-hour day: "
              << sets.size() << " of them\\n";
    std::cout << "each rule scored against the true optimum, found by brute force\\n\\n";

    struct Worst { std::vector<Interval> group; int got, best; };
    std::map<std::string, Worst> worst;
    std::map<std::string, int> wrong;
    for (const auto& [name, key] : rules) wrong[name] = 0;

    for (const std::vector<Interval>& group : sets) {
        int best = optimum(group);
        for (const auto& [name, key] : rules) {
            int got = schedule(group, key);
            if (got < best) {
                wrong[name] += 1;
                if (!worst.count(name)) worst[name] = {group, got, best};
            }
        }
    }

    std::cout << "  " << std::left << std::setw(16) << "rule" << std::right << ' '
              << std::setw(19) << "sets it gets wrong" << '\\n';
    for (const auto& [name, key] : rules) {
        std::cout << "  " << std::left << std::setw(16) << name << std::right << ' '
                  << std::setw(19) << wrong[name] << '\\n';
    }

    std::cout << '\\n';
    for (const auto& [name, key] : rules) {
        if (!worst.count(name)) {
            std::cout << name << ": no counterexample exists in this space\\n";
            continue;
        }
        const Worst& w = worst[name];
        std::string shown;
        for (std::size_t i = 0; i < w.group.size(); i++) {
            shown += (i ? ", " : "") + std::to_string(w.group[i][0]) + "–"
                   + std::to_string(w.group[i][1]);
        }
        std::cout << name << " first fails on " << shown << '\\n';
        std::cout << "  it books " << w.got << ", and " << w.best << " was available\\n";
    }

    std::cout << '\\n';
    std::cout << "earliest finish is the only rule with nothing against it, and this is\\n";
    std::cout << "the evidence before the proof rather than instead of it — the next\\n";
    std::cout << "lesson has to say why finishing early is the property that matters.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

type Interval = (i32, i32);
type Key = fn(&Interval) -> (i32, i32);

const HORIZON: i32 = 6;

/// Take meetings in \`key\` order, skipping any that overlap what is booked.
fn schedule(intervals: &[Interval], key: Key) -> usize {
    let mut ordered = intervals.to_vec();
    ordered.sort_by_key(key);
    let mut booked: Vec<Interval> = Vec::new();
    for it in ordered {
        if booked.iter().all(|b| it.1 <= b.0 || it.0 >= b.1) {
            booked.push(it);
        }
    }
    booked.len()
}

fn optimum(intervals: &[Interval]) -> usize {
    let n = intervals.len();
    for size in (1..=n).rev() {
        for mask in 0..(1u32 << n) {
            let mut combo: Vec<Interval> = (0..n)
                .filter(|i| mask >> i & 1 == 1)
                .map(|i| intervals[i])
                .collect();
            if combo.len() != size {
                continue;
            }
            combo.sort();
            let ok = (1..combo.len()).all(|i| combo[i].0 >= combo[i - 1].1);
            if ok {
                return size;
            }
        }
    }
    0
}

fn main() {
    let mut all: Vec<Interval> = Vec::new();
    for s in 0..HORIZON {
        for e in (s + 1)..=HORIZON {
            all.push((s, e));
        }
    }

    let rules: Vec<(&str, Key)> = vec![
        ("earliest start", |it| (it.0, it.1)),
        ("shortest first", |it| (it.1 - it.0, it.0)),
        ("earliest finish", |it| (it.1, it.0)),
    ];

    let mut sets: Vec<Vec<Interval>> = Vec::new();
    for i in 0..all.len() {
        for j in (i + 1)..all.len() {
            for k in (j + 1)..all.len() {
                sets.push(vec![all[i], all[j], all[k]]);
            }
        }
    }

    println!("every set of 3 meetings inside a {}-hour day: {} of them", HORIZON, sets.len());
    println!("each rule scored against the true optimum, found by brute force");
    println!();

    let mut worst: HashMap<&str, (Vec<Interval>, usize, usize)> = HashMap::new();
    let mut wrong: HashMap<&str, usize> = rules.iter().map(|(n, _)| (*n, 0)).collect();

    for group in &sets {
        let best = optimum(group);
        for (name, key) in &rules {
            let got = schedule(group, *key);
            if got < best {
                *wrong.get_mut(name).unwrap() += 1;
                worst.entry(name).or_insert_with(|| (group.clone(), got, best));
            }
        }
    }

    println!("  {:<16} {:>19}", "rule", "sets it gets wrong");
    for (name, _) in &rules {
        println!("  {:<16} {:>19}", name, wrong[name]);
    }

    println!();
    for (name, _) in &rules {
        match worst.get(name) {
            None => println!("{}: no counterexample exists in this space", name),
            Some((group, got, best)) => {
                let parts: Vec<String> =
                    group.iter().map(|(s, e)| format!("{}–{}", s, e)).collect();
                println!("{} first fails on {}", name, parts.join(", "));
                println!("  it books {}, and {} was available", got, best);
            }
        }
    }

    println!();
    println!("earliest finish is the only rule with nothing against it, and this is");
    println!("the evidence before the proof rather than instead of it — the next");
    println!("lesson has to say why finishing early is the property that matters.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strings"
)

type interval struct{ start, end int }

type key func(interval) (int, int)

const horizon = 6

// schedule takes meetings in key order, skipping any that overlap what is booked.
func schedule(intervals []interval, k key) int {
	ordered := append([]interval(nil), intervals...)
	sort.SliceStable(ordered, func(i, j int) bool {
		a1, a2 := k(ordered[i])
		b1, b2 := k(ordered[j])
		if a1 != b1 {
			return a1 < b1
		}
		return a2 < b2
	})
	var booked []interval
	for _, it := range ordered {
		free := true
		for _, b := range booked {
			if !(it.end <= b.start || it.start >= b.end) {
				free = false
			}
		}
		if free {
			booked = append(booked, it)
		}
	}
	return len(booked)
}

func optimum(intervals []interval) int {
	n := len(intervals)
	for size := n; size > 0; size-- {
		for mask := 0; mask < 1<<n; mask++ {
			var combo []interval
			for i := 0; i < n; i++ {
				if mask>>i&1 == 1 {
					combo = append(combo, intervals[i])
				}
			}
			if len(combo) != size {
				continue
			}
			sort.Slice(combo, func(i, j int) bool {
				if combo[i].start != combo[j].start {
					return combo[i].start < combo[j].start
				}
				return combo[i].end < combo[j].end
			})
			ok := true
			for i := 1; i < len(combo); i++ {
				if combo[i].start < combo[i-1].end {
					ok = false
				}
			}
			if ok {
				return size
			}
		}
	}
	return 0
}

type worstCase struct {
	group      []interval
	got, best  int
}

func main() {
	var all []interval
	for s := 0; s < horizon; s++ {
		for e := s + 1; e <= horizon; e++ {
			all = append(all, interval{s, e})
		}
	}

	rules := []struct {
		name string
		k    key
	}{
		{"earliest start", func(it interval) (int, int) { return it.start, it.end }},
		{"shortest first", func(it interval) (int, int) { return it.end - it.start, it.start }},
		{"earliest finish", func(it interval) (int, int) { return it.end, it.start }},
	}

	var sets [][]interval
	for i := 0; i < len(all); i++ {
		for j := i + 1; j < len(all); j++ {
			for k := j + 1; k < len(all); k++ {
				sets = append(sets, []interval{all[i], all[j], all[k]})
			}
		}
	}

	fmt.Printf("every set of 3 meetings inside a %d-hour day: %d of them\\n", horizon, len(sets))
	fmt.Println("each rule scored against the true optimum, found by brute force")
	fmt.Println()

	worst := map[string]worstCase{}
	wrong := map[string]int{}
	for _, r := range rules {
		wrong[r.name] = 0
	}

	for _, group := range sets {
		best := optimum(group)
		for _, r := range rules {
			got := schedule(group, r.k)
			if got < best {
				wrong[r.name]++
				if _, seen := worst[r.name]; !seen {
					worst[r.name] = worstCase{group, got, best}
				}
			}
		}
	}

	fmt.Printf("  %-16s %19s\\n", "rule", "sets it gets wrong")
	for _, r := range rules {
		fmt.Printf("  %-16s %19d\\n", r.name, wrong[r.name])
	}

	fmt.Println()
	for _, r := range rules {
		w, seen := worst[r.name]
		if !seen {
			fmt.Printf("%s: no counterexample exists in this space\\n", r.name)
			continue
		}
		parts := make([]string, len(w.group))
		for i, it := range w.group {
			parts[i] = fmt.Sprintf("%d–%d", it.start, it.end)
		}
		fmt.Printf("%s first fails on %s\\n", r.name, strings.Join(parts, ", "))
		fmt.Printf("  it books %d, and %d was available\\n", w.got, w.best)
	}

	fmt.Println()
	fmt.Println("earliest finish is the only rule with nothing against it, and this is")
	fmt.Println("the evidence before the proof rather than instead of it — the next")
	fmt.Println("lesson has to say why finishing early is the property that matters.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "generate-then-shrink",
      heading: "When you cannot enumerate, generate — then shrink",
      body: [
        "Exhaustive search runs out quickly. Four items with values and weights up to twenty is already tens of millions of instances, and the interesting problems are larger than that.",
        "The replacement is random generation with a fixed seed, so the search is reproducible and every reader sees the same counterexample. Generate instances, run both algorithms, keep the disagreements.",
        "What random search gives you, though, is a *messy* counterexample: four items and arbitrary numbers, from which nothing can be read. The second half of the technique fixes that. Shrinking repeatedly proposes a smaller instance — one item fewer, one unit of value less, one unit of capacity less — and keeps any proposal that still fails. It is a hill-climb toward the smallest failing input, and it costs about ten lines.",
        "The end of that walk is a counterexample small enough to explain in a sentence, which is the whole point. A failing test tells you the rule is wrong. A minimal counterexample tells you why.",
      ],
      examples: [
        {
          id: "shrinking-a-counterexample",
          title: "Random search, then shrink",
          lang: "python",
          code: `# A deterministic generator, so the hunt is reproducible and the counterexample
# it reports is the same one for every reader.
seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def greedy(items, capacity):
    """Best value per unit weight first, whole items only."""
    total = 0
    left = capacity
    for value, weight in sorted(items, key=lambda it: it[0] / it[1], reverse=True):
        if weight <= left:
            total += value
            left -= weight
    return total


def optimum(items, capacity):
    best = 0
    for mask in range(1 << len(items)):
        chosen = [items[i] for i in range(len(items)) if mask >> i & 1]
        if sum(w for _, w in chosen) <= capacity:
            best = max(best, sum(v for v, _ in chosen))
    return best


def fails(items, capacity):
    return bool(items) and greedy(items, capacity) < optimum(items, capacity)


TRIALS = 500
broken, first = 0, None
for _ in range(TRIALS):
    items = [(rand(20) + 1, rand(10) + 1) for _ in range(4)]
    capacity = rand(20) + 1
    if fails(items, capacity):
        broken += 1
        if first is None:
            first = (items, capacity)

print(f"{TRIALS} random four-item instances, greedy against brute force")
print(f"  greedy is wrong on {broken} of them — {100 * broken // TRIALS}%")
print()

items, capacity = first
print(f"the first failure: {items} in capacity {capacity}")
print(f"  greedy {greedy(items, capacity)}, optimum {optimum(items, capacity)}")
print("large, arbitrary, and hard to reason about. so shrink it.")
print()

# Shrinking: repeatedly try a smaller instance, keeping any that still fails.
trace = []
while True:
    smaller = [(items[:i] + items[i + 1:], capacity) for i in range(len(items))]
    for i, (v, w) in enumerate(items):
        if v > 1:
            smaller.append((items[:i] + [(v - 1, w)] + items[i + 1:], capacity))
        if w > 1:
            smaller.append((items[:i] + [(v, w - 1)] + items[i + 1:], capacity))
    if capacity > 1:
        smaller.append((items, capacity - 1))

    for cand_items, cand_cap in smaller:
        if fails(cand_items, cand_cap):
            items, capacity = cand_items, cand_cap
            trace.append((list(items), capacity))
            break
    else:
        break

print(f"shrinking, keeping only changes that still fail ({len(trace)} accepted):")
for step, (shown, cap) in enumerate(trace[:3], start=1):
    print(f"  step {step:>2}: {shown} in capacity {cap}")
print(f"  ... {len(trace) - 4} more, each one item smaller or one unit cheaper ...")
print(f"  step {len(trace):>2}: {trace[-1][0]} in capacity {trace[-1][1]}")

print()
print(f"minimal counterexample: items {items}, capacity {capacity}")
print(f"  greedy takes the better ratio first — {items[1][0]}/{items[1][1]} beats "
      f"{items[0][0]}/{items[0][1]} — and scores {greedy(items, capacity)}")
print(f"  taking the other item alone scores {optimum(items, capacity)}")
print()
print("a random search finds a failure; shrinking is what turns it into one you")
print("can reason about. both together are about twenty lines, and they are the")
print("only thing standing between a plausible rule and a wrong one.")`,
          output: `500 random four-item instances, greedy against brute force
  greedy is wrong on 55 of them — 11%

the first failure: [(19, 9), (14, 6), (12, 8), (11, 10)] in capacity 13
  greedy 14, optimum 19
large, arbitrary, and hard to reason about. so shrink it.

shrinking, keeping only changes that still fail (51 accepted):
  step  1: [(19, 9), (14, 6), (11, 10)] in capacity 13
  step  2: [(19, 9), (14, 6)] in capacity 13
  step  3: [(18, 9), (14, 6)] in capacity 13
  ... 47 more, each one item smaller or one unit cheaper ...
  step 51: [(3, 3), (2, 1)] in capacity 3

minimal counterexample: items [(3, 3), (2, 1)], capacity 3
  greedy takes the better ratio first — 2/1 beats 3/3 — and scores 2
  taking the other item alone scores 3

a random search finds a failure; shrinking is what turns it into one you
can reason about. both together are about twenty lines, and they are the
only thing standing between a plausible rule and a wrong one.`,
          explanation:
            "When the space is too large to enumerate, generate instead — and then shrink. The first failure a random search finds is almost always cluttered: four items, arbitrary numbers, nothing to see. Shrinking fixes that by repeatedly trying a smaller instance and keeping any that still fails, which walks the counterexample down to two items and a capacity of 3. At that size the mechanism is visible: greedy takes the item with ratio 2.0, which leaves too little room for the item worth 3. The 11% failure rate is worth noticing too — greedy on 0/1 knapsack is not subtly wrong, it is wrong on roughly one instance in nine, and it still passes a test suite written by someone who believes it works.",
          alternates: [
            {
              lang: "javascript",
              code: `// A deterministic generator, so the hunt is reproducible and the counterexample
// it reports is the same one for every reader. BigInt because seed * 1103515245
// runs past what a double can hold exactly.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Best value per unit weight first, whole items only. */
function greedy(items, capacity) {
  let total = 0;
  let left = capacity;
  for (const [value, weight] of [...items].sort((a, b) => b[0] / b[1] - a[0] / a[1])) {
    if (weight <= left) {
      total += value;
      left -= weight;
    }
  }
  return total;
}

function optimum(items, capacity) {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const chosen = items.filter((_, i) => (mask >> i) & 1);
    if (chosen.reduce((s, [, w]) => s + w, 0) <= capacity) {
      best = Math.max(best, chosen.reduce((s, [v]) => s + v, 0));
    }
  }
  return best;
}

const fails = (items, capacity) =>
  items.length > 0 && greedy(items, capacity) < optimum(items, capacity);

const show = (items) => \`[\${items.map(([v, w]) => \`(\${v}, \${w})\`).join(", ")}]\`;

const TRIALS = 500;
let broken = 0;
let first = null;
for (let t = 0; t < TRIALS; t++) {
  const items = Array.from({ length: 4 }, () => [rand(20) + 1, rand(10) + 1]);
  const capacity = rand(20) + 1;
  if (fails(items, capacity)) {
    broken += 1;
    if (first === null) first = { items, capacity };
  }
}

console.log(\`\${TRIALS} random four-item instances, greedy against brute force\`);
console.log(\`  greedy is wrong on \${broken} of them — \${Math.floor((100 * broken) / TRIALS)}%\`);
console.log();

let items = first.items;
let capacity = first.capacity;
console.log(\`the first failure: \${show(items)} in capacity \${capacity}\`);
console.log(\`  greedy \${greedy(items, capacity)}, optimum \${optimum(items, capacity)}\`);
console.log("large, arbitrary, and hard to reason about. so shrink it.");
console.log();

// Shrinking: repeatedly try a smaller instance, keeping any that still fails.
const trace = [];
for (;;) {
  const smaller = items.map((_, i) => ({
    items: [...items.slice(0, i), ...items.slice(i + 1)], capacity,
  }));
  items.forEach(([v, w], i) => {
    if (v > 1) smaller.push({ items: [...items.slice(0, i), [v - 1, w], ...items.slice(i + 1)], capacity });
    if (w > 1) smaller.push({ items: [...items.slice(0, i), [v, w - 1], ...items.slice(i + 1)], capacity });
  });
  if (capacity > 1) smaller.push({ items, capacity: capacity - 1 });

  const next = smaller.find((c) => fails(c.items, c.capacity));
  if (!next) break;
  items = next.items;
  capacity = next.capacity;
  trace.push({ items: [...items], capacity });
}

const padL = (s, w) => String(s).padStart(w);
console.log(\`shrinking, keeping only changes that still fail (\${trace.length} accepted):\`);
trace.slice(0, 3).forEach((step, i) => {
  console.log(\`  step \${padL(i + 1, 2)}: \${show(step.items)} in capacity \${step.capacity}\`);
});
console.log(\`  ... \${trace.length - 4} more, each one item smaller or one unit cheaper ...\`);
const last = trace[trace.length - 1];
console.log(\`  step \${padL(trace.length, 2)}: \${show(last.items)} in capacity \${last.capacity}\`);

console.log();
console.log(\`minimal counterexample: items \${show(items)}, capacity \${capacity}\`);
console.log(\`  greedy takes the better ratio first — \${items[1][0]}/\${items[1][1]} beats \`
  + \`\${items[0][0]}/\${items[0][1]} — and scores \${greedy(items, capacity)}\`);
console.log(\`  taking the other item alone scores \${optimum(items, capacity)}\`);
console.log();
console.log("a random search finds a failure; shrinking is what turns it into one you");
console.log("can reason about. both together are about twenty lines, and they are the");
console.log("only thing standing between a plausible rule and a wrong one.");`,
            },
            {
              lang: "typescript",
              code: `// A deterministic generator, so the hunt is reproducible and the counterexample
// it reports is the same one for every reader. BigInt because seed * 1103515245
// runs past what a double can hold exactly.
type Item = [number, number];
type Instance = { items: Item[]; capacity: number };

let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

/** Best value per unit weight first, whole items only. */
function greedy(items: Item[], capacity: number): number {
  let total = 0;
  let left = capacity;
  for (const [value, weight] of [...items].sort((a, b) => b[0] / b[1] - a[0] / a[1])) {
    if (weight <= left) {
      total += value;
      left -= weight;
    }
  }
  return total;
}

function optimum(items: Item[], capacity: number): number {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const chosen = items.filter((_, i) => (mask >> i) & 1);
    if (chosen.reduce((s, [, w]) => s + w, 0) <= capacity) {
      best = Math.max(best, chosen.reduce((s, [v]) => s + v, 0));
    }
  }
  return best;
}

const fails = (items: Item[], capacity: number): boolean =>
  items.length > 0 && greedy(items, capacity) < optimum(items, capacity);

const show = (items: Item[]): string => \`[\${items.map(([v, w]) => \`(\${v}, \${w})\`).join(", ")}]\`;

const TRIALS = 500;
let broken = 0;
let first: Instance | null = null;
for (let t = 0; t < TRIALS; t++) {
  const items: Item[] = Array.from({ length: 4 }, () => [rand(20) + 1, rand(10) + 1]);
  const capacity = rand(20) + 1;
  if (fails(items, capacity)) {
    broken += 1;
    if (first === null) first = { items, capacity };
  }
}

console.log(\`\${TRIALS} random four-item instances, greedy against brute force\`);
console.log(\`  greedy is wrong on \${broken} of them — \${Math.floor((100 * broken) / TRIALS)}%\`);
console.log();

let items = first!.items;
let capacity = first!.capacity;
console.log(\`the first failure: \${show(items)} in capacity \${capacity}\`);
console.log(\`  greedy \${greedy(items, capacity)}, optimum \${optimum(items, capacity)}\`);
console.log("large, arbitrary, and hard to reason about. so shrink it.");
console.log();

// Shrinking: repeatedly try a smaller instance, keeping any that still fails.
const trace: Instance[] = [];
for (;;) {
  const smaller: Instance[] = items.map((_, i) => ({
    items: [...items.slice(0, i), ...items.slice(i + 1)], capacity,
  }));
  items.forEach(([v, w], i) => {
    if (v > 1) smaller.push({ items: [...items.slice(0, i), [v - 1, w], ...items.slice(i + 1)], capacity });
    if (w > 1) smaller.push({ items: [...items.slice(0, i), [v, w - 1], ...items.slice(i + 1)], capacity });
  });
  if (capacity > 1) smaller.push({ items, capacity: capacity - 1 });

  const next = smaller.find((c) => fails(c.items, c.capacity));
  if (!next) break;
  items = next.items;
  capacity = next.capacity;
  trace.push({ items: [...items], capacity });
}

const padL = (s: string | number, w: number): string => String(s).padStart(w);
console.log(\`shrinking, keeping only changes that still fail (\${trace.length} accepted):\`);
trace.slice(0, 3).forEach((step, i) => {
  console.log(\`  step \${padL(i + 1, 2)}: \${show(step.items)} in capacity \${step.capacity}\`);
});
console.log(\`  ... \${trace.length - 4} more, each one item smaller or one unit cheaper ...\`);
const last = trace[trace.length - 1];
console.log(\`  step \${padL(trace.length, 2)}: \${show(last.items)} in capacity \${last.capacity}\`);

console.log();
console.log(\`minimal counterexample: items \${show(items)}, capacity \${capacity}\`);
console.log(\`  greedy takes the better ratio first — \${items[1][0]}/\${items[1][1]} beats \`
  + \`\${items[0][0]}/\${items[0][1]} — and scores \${greedy(items, capacity)}\`);
console.log(\`  taking the other item alone scores \${optimum(items, capacity)}\`);
console.log();
console.log("a random search finds a failure; shrinking is what turns it into one you");
console.log("can reason about. both together are about twenty lines, and they are the");
console.log("only thing standing between a plausible rule and a wrong one.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    // A deterministic generator, so the hunt is reproducible and the counterexample
    // it reports is the same one for every reader.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    record Item(int value, int weight) {}

    /** Best value per unit weight first, whole items only. */
    static int greedy(List<Item> items, int capacity) {
        List<Item> order = new ArrayList<>(items);
        order.sort((a, b) -> Double.compare(
                (double) b.value() / b.weight(), (double) a.value() / a.weight()));
        int total = 0;
        int left = capacity;
        for (Item it : order) {
            if (it.weight() <= left) {
                total += it.value();
                left -= it.weight();
            }
        }
        return total;
    }

    static int optimum(List<Item> items, int capacity) {
        int best = 0;
        for (int mask = 0; mask < 1 << items.size(); mask++) {
            int weight = 0;
            int value = 0;
            for (int i = 0; i < items.size(); i++) {
                if ((mask >> i & 1) == 1) {
                    weight += items.get(i).weight();
                    value += items.get(i).value();
                }
            }
            if (weight <= capacity) best = Math.max(best, value);
        }
        return best;
    }

    static boolean fails(List<Item> items, int capacity) {
        return !items.isEmpty() && greedy(items, capacity) < optimum(items, capacity);
    }

    static String show(List<Item> items) {
        List<String> parts = new ArrayList<>();
        for (Item it : items) parts.add("(" + it.value() + ", " + it.weight() + ")");
        return "[" + String.join(", ", parts) + "]";
    }

    record Instance(List<Item> items, int capacity) {}

    public static void main(String[] args) {
        final int TRIALS = 500;
        int broken = 0;
        Instance first = null;
        for (int t = 0; t < TRIALS; t++) {
            List<Item> items = new ArrayList<>();
            for (int i = 0; i < 4; i++) items.add(new Item(rand(20) + 1, rand(10) + 1));
            int capacity = rand(20) + 1;
            if (fails(items, capacity)) {
                broken += 1;
                if (first == null) first = new Instance(items, capacity);
            }
        }

        System.out.println(TRIALS + " random four-item instances, greedy against brute force");
        System.out.println("  greedy is wrong on " + broken + " of them — "
                + (100 * broken / TRIALS) + "%");
        System.out.println();

        List<Item> items = first.items();
        int capacity = first.capacity();
        System.out.println("the first failure: " + show(items) + " in capacity " + capacity);
        System.out.println("  greedy " + greedy(items, capacity)
                + ", optimum " + optimum(items, capacity));
        System.out.println("large, arbitrary, and hard to reason about. so shrink it.");
        System.out.println();

        // Shrinking: repeatedly try a smaller instance, keeping any that still fails.
        List<Instance> trace = new ArrayList<>();
        while (true) {
            List<Instance> smaller = new ArrayList<>();
            for (int i = 0; i < items.size(); i++) {
                List<Item> without = new ArrayList<>(items);
                without.remove(i);
                smaller.add(new Instance(without, capacity));
            }
            for (int i = 0; i < items.size(); i++) {
                Item it = items.get(i);
                if (it.value() > 1) {
                    List<Item> copy = new ArrayList<>(items);
                    copy.set(i, new Item(it.value() - 1, it.weight()));
                    smaller.add(new Instance(copy, capacity));
                }
                if (it.weight() > 1) {
                    List<Item> copy = new ArrayList<>(items);
                    copy.set(i, new Item(it.value(), it.weight() - 1));
                    smaller.add(new Instance(copy, capacity));
                }
            }
            if (capacity > 1) smaller.add(new Instance(items, capacity - 1));

            Instance next = null;
            for (Instance c : smaller) {
                if (fails(c.items(), c.capacity())) {
                    next = c;
                    break;
                }
            }
            if (next == null) break;
            items = next.items();
            capacity = next.capacity();
            trace.add(new Instance(new ArrayList<>(items), capacity));
        }

        System.out.println("shrinking, keeping only changes that still fail ("
                + trace.size() + " accepted):");
        for (int i = 0; i < 3; i++) {
            Instance step = trace.get(i);
            System.out.printf("  step %2d: %s in capacity %d%n",
                    i + 1, show(step.items()), step.capacity());
        }
        System.out.println("  ... " + (trace.size() - 4)
                + " more, each one item smaller or one unit cheaper ...");
        Instance last = trace.get(trace.size() - 1);
        System.out.printf("  step %2d: %s in capacity %d%n",
                trace.size(), show(last.items()), last.capacity());

        System.out.println();
        System.out.println("minimal counterexample: items " + show(items)
                + ", capacity " + capacity);
        System.out.println("  greedy takes the better ratio first — "
                + items.get(1).value() + "/" + items.get(1).weight() + " beats "
                + items.get(0).value() + "/" + items.get(0).weight()
                + " — and scores " + greedy(items, capacity));
        System.out.println("  taking the other item alone scores " + optimum(items, capacity));
        System.out.println();
        System.out.println("a random search finds a failure; shrinking is what turns it into one you");
        System.out.println("can reason about. both together are about twenty lines, and they are the");
        System.out.println("only thing standing between a plausible rule and a wrong one.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

// A deterministic generator, so the hunt is reproducible and the counterexample
// it reports is the same one for every reader.
std::int64_t seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

struct Item {
    int value, weight;
};

/** Best value per unit weight first, whole items only. */
int greedy(std::vector<Item> items, int capacity) {
    std::stable_sort(items.begin(), items.end(), [](const Item& a, const Item& b) {
        return static_cast<double>(a.value) / a.weight > static_cast<double>(b.value) / b.weight;
    });
    int total = 0;
    int left = capacity;
    for (const Item& it : items) {
        if (it.weight <= left) {
            total += it.value;
            left -= it.weight;
        }
    }
    return total;
}

int optimum(const std::vector<Item>& items, int capacity) {
    int best = 0;
    const int n = static_cast<int>(items.size());
    for (int mask = 0; mask < 1 << n; mask++) {
        int weight = 0;
        int value = 0;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) {
                weight += items[i].weight;
                value += items[i].value;
            }
        }
        if (weight <= capacity) best = std::max(best, value);
    }
    return best;
}

bool fails(const std::vector<Item>& items, int capacity) {
    return !items.empty() && greedy(items, capacity) < optimum(items, capacity);
}

std::string show(const std::vector<Item>& items) {
    std::string out = "[";
    for (std::size_t i = 0; i < items.size(); i++) {
        out += (i ? ", " : "") + std::string("(") + std::to_string(items[i].value) + ", "
             + std::to_string(items[i].weight) + ")";
    }
    return out + "]";
}

struct Instance {
    std::vector<Item> items;
    int capacity;
};

int main() {
    const int TRIALS = 500;
    int broken = 0;
    Instance first{{}, 0};
    bool haveFirst = false;
    for (int t = 0; t < TRIALS; t++) {
        std::vector<Item> items;
        for (int i = 0; i < 4; i++) items.push_back({rand_below(20) + 1, rand_below(10) + 1});
        int capacity = rand_below(20) + 1;
        if (fails(items, capacity)) {
            broken += 1;
            if (!haveFirst) {
                first = {items, capacity};
                haveFirst = true;
            }
        }
    }

    std::cout << TRIALS << " random four-item instances, greedy against brute force\\n";
    std::cout << "  greedy is wrong on " << broken << " of them — "
              << 100 * broken / TRIALS << "%\\n\\n";

    std::vector<Item> items = first.items;
    int capacity = first.capacity;
    std::cout << "the first failure: " << show(items) << " in capacity " << capacity << '\\n';
    std::cout << "  greedy " << greedy(items, capacity) << ", optimum "
              << optimum(items, capacity) << '\\n';
    std::cout << "large, arbitrary, and hard to reason about. so shrink it.\\n\\n";

    // Shrinking: repeatedly try a smaller instance, keeping any that still fails.
    std::vector<Instance> trace;
    while (true) {
        std::vector<Instance> smaller;
        for (std::size_t i = 0; i < items.size(); i++) {
            std::vector<Item> without = items;
            without.erase(without.begin() + static_cast<long>(i));
            smaller.push_back({without, capacity});
        }
        for (std::size_t i = 0; i < items.size(); i++) {
            if (items[i].value > 1) {
                std::vector<Item> copy = items;
                copy[i].value -= 1;
                smaller.push_back({copy, capacity});
            }
            if (items[i].weight > 1) {
                std::vector<Item> copy = items;
                copy[i].weight -= 1;
                smaller.push_back({copy, capacity});
            }
        }
        if (capacity > 1) smaller.push_back({items, capacity - 1});

        bool advanced = false;
        for (const Instance& c : smaller) {
            if (fails(c.items, c.capacity)) {
                items = c.items;
                capacity = c.capacity;
                trace.push_back({items, capacity});
                advanced = true;
                break;
            }
        }
        if (!advanced) break;
    }

    std::cout << "shrinking, keeping only changes that still fail (" << trace.size()
              << " accepted):\\n";
    for (int i = 0; i < 3; i++) {
        printf("  step %2d: %s in capacity %d\\n", i + 1,
               show(trace[static_cast<std::size_t>(i)].items).c_str(),
               trace[static_cast<std::size_t>(i)].capacity);
    }
    std::cout << "  ... " << trace.size() - 4
              << " more, each one item smaller or one unit cheaper ...\\n";
    const Instance& last = trace.back();
    printf("  step %2d: %s in capacity %d\\n", static_cast<int>(trace.size()),
           show(last.items).c_str(), last.capacity);

    std::cout << "\\nminimal counterexample: items " << show(items)
              << ", capacity " << capacity << '\\n';
    std::cout << "  greedy takes the better ratio first — " << items[1].value << '/'
              << items[1].weight << " beats " << items[0].value << '/' << items[0].weight
              << " — and scores " << greedy(items, capacity) << '\\n';
    std::cout << "  taking the other item alone scores " << optimum(items, capacity) << "\\n\\n";
    std::cout << "a random search finds a failure; shrinking is what turns it into one you\\n";
    std::cout << "can reason about. both together are about twenty lines, and they are the\\n";
    std::cout << "only thing standing between a plausible rule and a wrong one.\\n";
}`,
            },
            {
              lang: "rust",
              code: `// A deterministic generator, so the hunt is reproducible and the counterexample
// it reports is the same one for every reader.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i32) -> i32 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        (self.seed / 65536 % i64::from(n)) as i32
    }
}

#[derive(Clone, Copy)]
struct Item {
    value: i32,
    weight: i32,
}

/// Best value per unit weight first, whole items only.
fn greedy(items: &[Item], capacity: i32) -> i32 {
    let mut order = items.to_vec();
    order.sort_by(|a, b| {
        let ra = f64::from(a.value) / f64::from(a.weight);
        let rb = f64::from(b.value) / f64::from(b.weight);
        rb.partial_cmp(&ra).unwrap()
    });
    let mut total = 0;
    let mut left = capacity;
    for it in order {
        if it.weight <= left {
            total += it.value;
            left -= it.weight;
        }
    }
    total
}

fn optimum(items: &[Item], capacity: i32) -> i32 {
    let mut best = 0;
    for mask in 0..(1u32 << items.len()) {
        let mut weight = 0;
        let mut value = 0;
        for (i, it) in items.iter().enumerate() {
            if mask >> i & 1 == 1 {
                weight += it.weight;
                value += it.value;
            }
        }
        if weight <= capacity {
            best = best.max(value);
        }
    }
    best
}

fn fails(items: &[Item], capacity: i32) -> bool {
    !items.is_empty() && greedy(items, capacity) < optimum(items, capacity)
}

fn show(items: &[Item]) -> String {
    let parts: Vec<String> = items.iter()
        .map(|it| format!("({}, {})", it.value, it.weight))
        .collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let mut rng = Rng { seed: 1 };
    const TRIALS: i32 = 500;
    let mut broken = 0;
    let mut first: Option<(Vec<Item>, i32)> = None;
    for _ in 0..TRIALS {
        let items: Vec<Item> = (0..4)
            .map(|_| Item { value: rng.next(20) + 1, weight: rng.next(10) + 1 })
            .collect();
        let capacity = rng.next(20) + 1;
        if fails(&items, capacity) {
            broken += 1;
            if first.is_none() {
                first = Some((items, capacity));
            }
        }
    }

    println!("{} random four-item instances, greedy against brute force", TRIALS);
    println!("  greedy is wrong on {} of them — {}%", broken, 100 * broken / TRIALS);
    println!();

    let (mut items, mut capacity) = first.unwrap();
    println!("the first failure: {} in capacity {}", show(&items), capacity);
    println!("  greedy {}, optimum {}", greedy(&items, capacity), optimum(&items, capacity));
    println!("large, arbitrary, and hard to reason about. so shrink it.");
    println!();

    // Shrinking: repeatedly try a smaller instance, keeping any that still fails.
    let mut trace: Vec<(Vec<Item>, i32)> = Vec::new();
    loop {
        let mut smaller: Vec<(Vec<Item>, i32)> = Vec::new();
        for i in 0..items.len() {
            let mut without = items.clone();
            without.remove(i);
            smaller.push((without, capacity));
        }
        for i in 0..items.len() {
            if items[i].value > 1 {
                let mut copy = items.clone();
                copy[i].value -= 1;
                smaller.push((copy, capacity));
            }
            if items[i].weight > 1 {
                let mut copy = items.clone();
                copy[i].weight -= 1;
                smaller.push((copy, capacity));
            }
        }
        if capacity > 1 {
            smaller.push((items.clone(), capacity - 1));
        }

        match smaller.into_iter().find(|(it, cap)| fails(it, *cap)) {
            None => break,
            Some((it, cap)) => {
                items = it;
                capacity = cap;
                trace.push((items.clone(), capacity));
            }
        }
    }

    println!("shrinking, keeping only changes that still fail ({} accepted):", trace.len());
    for (i, (shown, cap)) in trace.iter().take(3).enumerate() {
        println!("  step {:>2}: {} in capacity {}", i + 1, show(shown), cap);
    }
    println!("  ... {} more, each one item smaller or one unit cheaper ...", trace.len() - 4);
    let last = trace.last().unwrap();
    println!("  step {:>2}: {} in capacity {}", trace.len(), show(&last.0), last.1);

    println!();
    println!("minimal counterexample: items {}, capacity {}", show(&items), capacity);
    println!("  greedy takes the better ratio first — {}/{} beats {}/{} — and scores {}",
             items[1].value, items[1].weight, items[0].value, items[0].weight,
             greedy(&items, capacity));
    println!("  taking the other item alone scores {}", optimum(&items, capacity));
    println!();
    println!("a random search finds a failure; shrinking is what turns it into one you");
    println!("can reason about. both together are about twenty lines, and they are the");
    println!("only thing standing between a plausible rule and a wrong one.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"sort"
	"strings"
)

// A deterministic generator, so the hunt is reproducible and the counterexample
// it reports is the same one for every reader.
var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

type item struct{ value, weight int }

// greedy takes the best value per unit weight first, whole items only.
func greedy(items []item, capacity int) int {
	order := append([]item(nil), items...)
	sort.SliceStable(order, func(a, b int) bool {
		return float64(order[a].value)/float64(order[a].weight) >
			float64(order[b].value)/float64(order[b].weight)
	})
	total, left := 0, capacity
	for _, it := range order {
		if it.weight <= left {
			total += it.value
			left -= it.weight
		}
	}
	return total
}

func optimum(items []item, capacity int) int {
	best := 0
	for mask := 0; mask < 1<<len(items); mask++ {
		weight, value := 0, 0
		for i, it := range items {
			if mask>>i&1 == 1 {
				weight += it.weight
				value += it.value
			}
		}
		if weight <= capacity && value > best {
			best = value
		}
	}
	return best
}

func fails(items []item, capacity int) bool {
	return len(items) > 0 && greedy(items, capacity) < optimum(items, capacity)
}

func show(items []item) string {
	parts := make([]string, len(items))
	for i, it := range items {
		parts[i] = fmt.Sprintf("(%d, %d)", it.value, it.weight)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

type instance struct {
	items    []item
	capacity int
}

func main() {
	const trials = 500
	broken := 0
	var first *instance
	for t := 0; t < trials; t++ {
		items := make([]item, 4)
		for i := range items {
			items[i] = item{rand(20) + 1, rand(10) + 1}
		}
		capacity := rand(20) + 1
		if fails(items, capacity) {
			broken++
			if first == nil {
				first = &instance{items, capacity}
			}
		}
	}

	fmt.Printf("%d random four-item instances, greedy against brute force\\n", trials)
	fmt.Printf("  greedy is wrong on %d of them — %d%%\\n", broken, 100*broken/trials)
	fmt.Println()

	items, capacity := first.items, first.capacity
	fmt.Printf("the first failure: %s in capacity %d\\n", show(items), capacity)
	fmt.Printf("  greedy %d, optimum %d\\n", greedy(items, capacity), optimum(items, capacity))
	fmt.Println("large, arbitrary, and hard to reason about. so shrink it.")
	fmt.Println()

	// Shrinking: repeatedly try a smaller instance, keeping any that still fails.
	var trace []instance
	for {
		var smaller []instance
		for i := range items {
			without := append(append([]item(nil), items[:i]...), items[i+1:]...)
			smaller = append(smaller, instance{without, capacity})
		}
		for i, it := range items {
			if it.value > 1 {
				copyItems := append([]item(nil), items...)
				copyItems[i].value--
				smaller = append(smaller, instance{copyItems, capacity})
			}
			if it.weight > 1 {
				copyItems := append([]item(nil), items...)
				copyItems[i].weight--
				smaller = append(smaller, instance{copyItems, capacity})
			}
		}
		if capacity > 1 {
			smaller = append(smaller, instance{items, capacity - 1})
		}

		advanced := false
		for _, c := range smaller {
			if fails(c.items, c.capacity) {
				items, capacity = c.items, c.capacity
				trace = append(trace, instance{append([]item(nil), items...), capacity})
				advanced = true
				break
			}
		}
		if !advanced {
			break
		}
	}

	fmt.Printf("shrinking, keeping only changes that still fail (%d accepted):\\n", len(trace))
	for i := 0; i < 3; i++ {
		fmt.Printf("  step %2d: %s in capacity %d\\n", i+1, show(trace[i].items), trace[i].capacity)
	}
	fmt.Printf("  ... %d more, each one item smaller or one unit cheaper ...\\n", len(trace)-4)
	last := trace[len(trace)-1]
	fmt.Printf("  step %2d: %s in capacity %d\\n", len(trace), show(last.items), last.capacity)

	fmt.Println()
	fmt.Printf("minimal counterexample: items %s, capacity %d\\n", show(items), capacity)
	fmt.Printf("  greedy takes the better ratio first — %d/%d beats %d/%d — and scores %d\\n",
		items[1].value, items[1].weight, items[0].value, items[0].weight, greedy(items, capacity))
	fmt.Printf("  taking the other item alone scores %d\\n", optimum(items, capacity))
	fmt.Println()
	fmt.Println("a random search finds a failure; shrinking is what turns it into one you")
	fmt.Println("can reason about. both together are about twenty lines, and they are the")
	fmt.Println("only thing standing between a plausible rule and a wrong one.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you convince yourself a greedy rule is wrong?",
      answer:
        "Search rather than think. Write brute force — exponential is fine, the instances are tiny — and compare it against the greedy rule on every instance below some small size. Greedy failures almost always appear on two or three elements, because the mechanism is one bad first choice and that needs almost nothing to show. If the space is too large to enumerate, generate random instances with a fixed seed instead, and then shrink whatever fails until it is small enough to reason about. Both are about twenty lines and both are faster than arguing with yourself.",
    },
    {
      question: "Your search found no counterexample. Is the rule correct?",
      answer:
        "No — you have evidence, not a proof. The search covered instances below some bound, and nothing rules out a failure that needs more elements or larger numbers than that. It is genuinely useful evidence, because greedy failures cluster on small inputs, and a rule that survives every three-element instance has passed the test most wrong rules fail. But the thing that settles it is an exchange argument. The right order is to search first, because it is cheap and disproves most bad rules in seconds, then prove the survivor.",
    },
    {
      question: "Why shrink a counterexample instead of using the first one you find?",
      answer:
        "Because size is what makes it useful. A four-item random instance tells you only that the rule failed; you cannot see which choice lost or why. Shrinking walks it down to the smallest input that still fails, and at that size the mechanism is visible — here, two items where greedy takes the better ratio and leaves too little room for the item that was worth more. That minimal instance is what you put in a test, what you show a reviewer, and what tells you whether the fix is a different sort key or a different technique.",
    },
  ],
  takeaways: [
    "Greedy failures cluster on tiny inputs, which is what makes exhaustive small-case search so effective.",
    "Brute force is allowed to be slow. It only has to be obviously correct.",
    "Score every candidate rule at once rather than defending the first one you thought of.",
    "A rule that fails rarely is more dangerous than one that fails often — it survives hand-written tests.",
    "When the space is too large, generate with a fixed seed, then shrink the failure to its smallest form.",
    "No counterexample is evidence, not proof. Search first because it is cheap; prove the survivor.",
  ],
  status: "available",
};
