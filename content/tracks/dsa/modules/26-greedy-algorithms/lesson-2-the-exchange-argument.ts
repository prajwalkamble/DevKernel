import type { Lesson } from "@/content/types";

export const exchangeArgumentLesson: Lesson = {
  id: "dsa-greedy-exchange",
  slug: "proving-a-greedy-rule-correct",
  moduleSlug: "greedy-algorithms",
  title: "Proving It: The Exchange Argument",
  summary:
    "Two proof shapes cover almost every greedy algorithm you will meet. Both are mechanical enough to attempt in an interview, and both tell you something useful when they fail.",
  estimatedMinutes: 35,
  objectives: [
    "Run an exchange argument as a procedure rather than quoting it as a phrase",
    "Recognise which problems suit \"greedy stays ahead\" instead, and why",
    "Use a failed proof as a disproof, and read the counterexample out of it",
    "Say what a passing test suite does and does not tell you about a greedy rule",
  ],
  sections: [
    {
      id: "exchange-as-procedure",
      heading: "The exchange argument, run as a procedure",
      body: [
        "The exchange argument has three steps and they never change. Assume some optimal solution exists. Find the first place it disagrees with your greedy rule. Show that the disagreement can be exchanged for the greedy choice without the solution getting worse. Since each exchange moves the solution one step closer to the greedy one and never loses value, the greedy solution must be optimal too.",
        "The subtlety is in step three, and it is always the same subtlety: the exchange has to be *legal*. Removing something and putting something else in its place must leave you with a valid solution — a bag that is not overfull, a schedule with no overlap, a code that is still decodable. Most greedy proofs succeed or fail on whether that swap can be made.",
        "Running it on the divisible bag makes the mechanism visible. Start from a packing that disagrees with the rule everywhere it can, and repeatedly move kilograms from the worst ratio in the bag to the best ratio still on the shelf. Every swap is legal, because weight is conserved, and every swap gains value.",
      ],
      examples: [
        {
          id: "exchange-on-fractional",
          title: "Rewriting a rival solution into the greedy one",
          lang: "python",
          code: `# name, value, weight, ratio
items = [("copper", 60, 10), ("silver", 100, 20), ("gold", 120, 30)]
capacity = 50
ratio = {name: value / weight for name, value, weight in items}
stock = {name: weight for name, _, weight in items}

# An adversary hands us a packing and claims it is optimal. It is full, and it
# does not agree with the greedy rule anywhere it could.
packing = {"copper": 0, "silver": 20, "gold": 30}


def value_of(p):
    return sum(kg * ratio[name] for name, kg in p.items())


def show(p, label):
    parts = [f"{name} {kg}kg" for name, kg in p.items() if kg > 0]
    print(f"  {label:<11} {', '.join(parts):<36} = {value_of(p):>6.2f}")


print(f"ratios: {', '.join(f'{n} {ratio[n]:.2f}' for n, _, _ in items)}")
print(f"bag: {sum(packing.values())} kg of {capacity}, so it is already full")
print()
show(packing, "start:")
print()

print("the exchange step: find a kilo of a worse ratio sitting in the bag while a")
print("better ratio is still on the shelf, and swap them. value cannot go down.")
print()

step = 1
while True:
    # Best ratio with stock left, worst ratio currently in the bag.
    better = max((n for n, _, _ in items if packing[n] < stock[n]),
                 key=lambda n: ratio[n], default=None)
    worse = min((n for n, _, _ in items if packing[n] > 0),
                key=lambda n: ratio[n], default=None)
    if better is None or worse is None or ratio[better] <= ratio[worse]:
        break
    swap = min(stock[better] - packing[better], packing[worse])
    before = value_of(packing)
    packing[worse] -= swap
    packing[better] += swap
    gain = value_of(packing) - before
    print(f"  step {step}: swap {swap} kg of {worse} ({ratio[worse]:.2f}) "
          f"for {swap} kg of {better} ({ratio[better]:.2f}), gaining {gain:+.2f}")
    show(packing, "now:")
    step += 1

print()
print("no swap is left to make: every kilo in the bag beats every kilo on the shelf.")
print("that is exactly the packing the greedy rule builds, so greedy is optimal here.")`,
          output: `ratios: copper 6.00, silver 5.00, gold 4.00
bag: 50 kg of 50, so it is already full

  start:      silver 20kg, gold 30kg               = 220.00

the exchange step: find a kilo of a worse ratio sitting in the bag while a
better ratio is still on the shelf, and swap them. value cannot go down.

  step 1: swap 10 kg of gold (4.00) for 10 kg of copper (6.00), gaining +20.00
  now:        copper 10kg, silver 20kg, gold 20kg  = 240.00

no swap is left to make: every kilo in the bag beats every kilo on the shelf.
that is exactly the packing the greedy rule builds, so greedy is optimal here.`,
          explanation:
            "An exchange argument is not hand-waving about why a rule feels right. It is a procedure: take any optimal solution, find a place where it disagrees with the greedy rule, and show that the disagreement can be swapped out without losing value. Do that repeatedly and the optimal solution turns into the greedy one, which means the greedy one was optimal all along. Here the swap is literal — kilograms of a worse ratio leave the bag and kilograms of a better ratio replace them — and the loop terminates because each swap strictly reduces how much the packing disagrees with the rule.",
          alternates: [
            {
              lang: "javascript",
              code: `// name, value, weight, ratio
const items = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;
const ratio = Object.fromEntries(items.map((it) => [it.name, it.value / it.weight]));
const stock = Object.fromEntries(items.map((it) => [it.name, it.weight]));

// An adversary hands us a packing and claims it is optimal. It is full, and it
// does not agree with the greedy rule anywhere it could.
const packing = { copper: 0, silver: 20, gold: 30 };
const names = items.map((it) => it.name);

const valueOf = (p) => names.reduce((s, n) => s + p[n] * ratio[n], 0);

function show(p, label) {
  const parts = names.filter((n) => p[n] > 0).map((n) => \`\${n} \${p[n]}kg\`);
  console.log(\`  \${label.padEnd(11)} \${parts.join(", ").padEnd(36)} = \${valueOf(p).toFixed(2).padStart(6)}\`);
}

console.log(\`ratios: \${names.map((n) => \`\${n} \${ratio[n].toFixed(2)}\`).join(", ")}\`);
const filled = names.reduce((s, n) => s + packing[n], 0);
console.log(\`bag: \${filled} kg of \${capacity}, so it is already full\`);
console.log();
show(packing, "start:");
console.log();

console.log("the exchange step: find a kilo of a worse ratio sitting in the bag while a");
console.log("better ratio is still on the shelf, and swap them. value cannot go down.");
console.log();

let step = 1;
for (;;) {
  // Best ratio with stock left, worst ratio currently in the bag.
  const shelf = names.filter((n) => packing[n] < stock[n]);
  const bag = names.filter((n) => packing[n] > 0);
  if (shelf.length === 0 || bag.length === 0) break;
  const better = shelf.reduce((a, b) => (ratio[b] > ratio[a] ? b : a));
  const worse = bag.reduce((a, b) => (ratio[b] < ratio[a] ? b : a));
  if (ratio[better] <= ratio[worse]) break;

  const swap = Math.min(stock[better] - packing[better], packing[worse]);
  const before = valueOf(packing);
  packing[worse] -= swap;
  packing[better] += swap;
  const gain = valueOf(packing) - before;
  console.log(\`  step \${step}: swap \${swap} kg of \${worse} (\${ratio[worse].toFixed(2)}) \`
    + \`for \${swap} kg of \${better} (\${ratio[better].toFixed(2)}), gaining \${gain >= 0 ? "+" : ""}\${gain.toFixed(2)}\`);
  show(packing, "now:");
  step += 1;
}

console.log();
console.log("no swap is left to make: every kilo in the bag beats every kilo on the shelf.");
console.log("that is exactly the packing the greedy rule builds, so greedy is optimal here.");`,
            },
            {
              lang: "typescript",
              code: `interface Item {
  name: string;
  value: number;
  weight: number;
}

type Packing = Record<string, number>;

// name, value, weight, ratio
const items: Item[] = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;
const ratio: Record<string, number> = Object.fromEntries(items.map((it) => [it.name, it.value / it.weight]));
const stock: Record<string, number> = Object.fromEntries(items.map((it) => [it.name, it.weight]));

// An adversary hands us a packing and claims it is optimal. It is full, and it
// does not agree with the greedy rule anywhere it could.
const packing: Packing = { copper: 0, silver: 20, gold: 30 };
const names = items.map((it) => it.name);

const valueOf = (p: Packing): number => names.reduce((s, n) => s + p[n] * ratio[n], 0);

function show(p: Packing, label: string): void {
  const parts = names.filter((n) => p[n] > 0).map((n) => \`\${n} \${p[n]}kg\`);
  console.log(\`  \${label.padEnd(11)} \${parts.join(", ").padEnd(36)} = \${valueOf(p).toFixed(2).padStart(6)}\`);
}

console.log(\`ratios: \${names.map((n) => \`\${n} \${ratio[n].toFixed(2)}\`).join(", ")}\`);
const filled = names.reduce((s, n) => s + packing[n], 0);
console.log(\`bag: \${filled} kg of \${capacity}, so it is already full\`);
console.log();
show(packing, "start:");
console.log();

console.log("the exchange step: find a kilo of a worse ratio sitting in the bag while a");
console.log("better ratio is still on the shelf, and swap them. value cannot go down.");
console.log();

let step = 1;
for (;;) {
  // Best ratio with stock left, worst ratio currently in the bag.
  const shelf = names.filter((n) => packing[n] < stock[n]);
  const bag = names.filter((n) => packing[n] > 0);
  if (shelf.length === 0 || bag.length === 0) break;
  const better = shelf.reduce((a, b) => (ratio[b] > ratio[a] ? b : a));
  const worse = bag.reduce((a, b) => (ratio[b] < ratio[a] ? b : a));
  if (ratio[better] <= ratio[worse]) break;

  const swap = Math.min(stock[better] - packing[better], packing[worse]);
  const before = valueOf(packing);
  packing[worse] -= swap;
  packing[better] += swap;
  const gain = valueOf(packing) - before;
  console.log(\`  step \${step}: swap \${swap} kg of \${worse} (\${ratio[worse].toFixed(2)}) \`
    + \`for \${swap} kg of \${better} (\${ratio[better].toFixed(2)}), gaining \${gain >= 0 ? "+" : ""}\${gain.toFixed(2)}\`);
  show(packing, "now:");
  step += 1;
}

console.log();
console.log("no swap is left to make: every kilo in the bag beats every kilo on the shelf.");
console.log("that is exactly the packing the greedy rule builds, so greedy is optimal here.");`,
            },
            {
              lang: "java",
              code: `import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;

public class Main {
    static final String[] NAMES = {"copper", "silver", "gold"};
    static final int[] VALUES = {60, 100, 120};
    static final int[] WEIGHTS = {10, 20, 30};
    static final Map<String, Double> RATIO = new LinkedHashMap<>();
    static final Map<String, Integer> STOCK = new LinkedHashMap<>();

    static double valueOf(Map<String, Integer> p) {
        double total = 0;
        for (String n : NAMES) total += p.get(n) * RATIO.get(n);
        return total;
    }

    static void show(Map<String, Integer> p, String label) {
        StringJoiner parts = new StringJoiner(", ");
        for (String n : NAMES) {
            if (p.get(n) > 0) parts.add(n + " " + p.get(n) + "kg");
        }
        System.out.printf(Locale.ROOT, "  %-11s %-36s = %6.2f%n", label, parts, valueOf(p));
    }

    public static void main(String[] args) {
        for (int i = 0; i < NAMES.length; i++) {
            RATIO.put(NAMES[i], (double) VALUES[i] / WEIGHTS[i]);
            STOCK.put(NAMES[i], WEIGHTS[i]);
        }
        int capacity = 50;

        // An adversary hands us a packing and claims it is optimal. It is full, and it
        // does not agree with the greedy rule anywhere it could.
        Map<String, Integer> packing = new LinkedHashMap<>();
        packing.put("copper", 0);
        packing.put("silver", 20);
        packing.put("gold", 30);

        StringJoiner ratios = new StringJoiner(", ");
        for (String n : NAMES) ratios.add(String.format(Locale.ROOT, "%s %.2f", n, RATIO.get(n)));
        System.out.println("ratios: " + ratios);
        int filled = 0;
        for (String n : NAMES) filled += packing.get(n);
        System.out.println("bag: " + filled + " kg of " + capacity + ", so it is already full");
        System.out.println();
        show(packing, "start:");
        System.out.println();

        System.out.println("the exchange step: find a kilo of a worse ratio sitting in the bag while a");
        System.out.println("better ratio is still on the shelf, and swap them. value cannot go down.");
        System.out.println();

        int step = 1;
        while (true) {
            // Best ratio with stock left, worst ratio currently in the bag.
            String better = null;
            String worse = null;
            for (String n : NAMES) {
                if (packing.get(n) < STOCK.get(n) && (better == null || RATIO.get(n) > RATIO.get(better))) better = n;
                if (packing.get(n) > 0 && (worse == null || RATIO.get(n) < RATIO.get(worse))) worse = n;
            }
            if (better == null || worse == null || RATIO.get(better) <= RATIO.get(worse)) break;

            int swap = Math.min(STOCK.get(better) - packing.get(better), packing.get(worse));
            double before = valueOf(packing);
            packing.put(worse, packing.get(worse) - swap);
            packing.put(better, packing.get(better) + swap);
            double gain = valueOf(packing) - before;
            System.out.printf(Locale.ROOT,
                    "  step %d: swap %d kg of %s (%.2f) for %d kg of %s (%.2f), gaining %+.2f%n",
                    step, swap, worse, RATIO.get(worse), swap, better, RATIO.get(better), gain);
            show(packing, "now:");
            step += 1;
        }

        System.out.println();
        System.out.println("no swap is left to make: every kilo in the bag beats every kilo on the shelf.");
        System.out.println("that is exactly the packing the greedy rule builds, so greedy is optimal here.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

const std::vector<std::string> NAMES = {"copper", "silver", "gold"};
std::map<std::string, double> ratio;
std::map<std::string, int> stock;

double valueOf(const std::map<std::string, int>& p) {
    double total = 0;
    for (const std::string& n : NAMES) total += p.at(n) * ratio[n];
    return total;
}

void show(const std::map<std::string, int>& p, const std::string& label) {
    std::string parts;
    for (const std::string& n : NAMES) {
        if (p.at(n) > 0) {
            if (!parts.empty()) parts += ", ";
            parts += n + " " + std::to_string(p.at(n)) + "kg";
        }
    }
    std::cout << "  " << std::left << std::setw(11) << label << ' ' << std::setw(36) << parts
              << std::right << " = " << std::setw(6) << std::fixed << std::setprecision(2)
              << valueOf(p) << '\\n';
}

int main() {
    // name, value, weight, ratio
    const std::vector<int> values = {60, 100, 120};
    const std::vector<int> weights = {10, 20, 30};
    for (std::size_t i = 0; i < NAMES.size(); i++) {
        ratio[NAMES[i]] = static_cast<double>(values[i]) / weights[i];
        stock[NAMES[i]] = weights[i];
    }
    const int capacity = 50;

    // An adversary hands us a packing and claims it is optimal. It is full, and it
    // does not agree with the greedy rule anywhere it could.
    std::map<std::string, int> packing = {{"copper", 0}, {"silver", 20}, {"gold", 30}};

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "ratios: ";
    for (std::size_t i = 0; i < NAMES.size(); i++) {
        std::cout << (i ? ", " : "") << NAMES[i] << ' ' << ratio[NAMES[i]];
    }
    std::cout << '\\n';
    int filled = 0;
    for (const std::string& n : NAMES) filled += packing[n];
    std::cout << "bag: " << filled << " kg of " << capacity << ", so it is already full\\n\\n";
    show(packing, "start:");
    std::cout << '\\n';

    std::cout << "the exchange step: find a kilo of a worse ratio sitting in the bag while a\\n";
    std::cout << "better ratio is still on the shelf, and swap them. value cannot go down.\\n\\n";

    int step = 1;
    while (true) {
        // Best ratio with stock left, worst ratio currently in the bag.
        std::string better, worse;
        for (const std::string& n : NAMES) {
            if (packing[n] < stock[n] && (better.empty() || ratio[n] > ratio[better])) better = n;
            if (packing[n] > 0 && (worse.empty() || ratio[n] < ratio[worse])) worse = n;
        }
        if (better.empty() || worse.empty() || ratio[better] <= ratio[worse]) break;

        int swap = std::min(stock[better] - packing[better], packing[worse]);
        double before = valueOf(packing);
        packing[worse] -= swap;
        packing[better] += swap;
        double gain = valueOf(packing) - before;
        std::cout << "  step " << step << ": swap " << swap << " kg of " << worse << " ("
                  << ratio[worse] << ") for " << swap << " kg of " << better << " ("
                  << ratio[better] << "), gaining " << std::showpos << gain << std::noshowpos << '\\n';
        show(packing, "now:");
        step += 1;
    }

    std::cout << "\\nno swap is left to make: every kilo in the bag beats every kilo on the shelf.\\n";
    std::cout << "that is exactly the packing the greedy rule builds, so greedy is optimal here.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

const NAMES: [&str; 3] = ["copper", "silver", "gold"];

fn value_of(p: &HashMap<&str, i32>, ratio: &HashMap<&str, f64>) -> f64 {
    NAMES.iter().map(|n| f64::from(p[n]) * ratio[n]).sum()
}

fn show(p: &HashMap<&str, i32>, label: &str, ratio: &HashMap<&str, f64>) {
    let parts: Vec<String> = NAMES.iter()
        .filter(|n| p[*n] > 0)
        .map(|n| format!("{} {}kg", n, p[n]))
        .collect();
    println!("  {:<11} {:<36} = {:>6.2}", label, parts.join(", "), value_of(p, ratio));
}

fn main() {
    // name, value, weight, ratio
    let values = [60, 100, 120];
    let weights = [10, 20, 30];
    let mut ratio: HashMap<&str, f64> = HashMap::new();
    let mut stock: HashMap<&str, i32> = HashMap::new();
    for i in 0..NAMES.len() {
        ratio.insert(NAMES[i], f64::from(values[i]) / f64::from(weights[i]));
        stock.insert(NAMES[i], weights[i]);
    }
    let capacity = 50;

    // An adversary hands us a packing and claims it is optimal. It is full, and it
    // does not agree with the greedy rule anywhere it could.
    let mut packing: HashMap<&str, i32> = HashMap::new();
    packing.insert("copper", 0);
    packing.insert("silver", 20);
    packing.insert("gold", 30);

    let ratios: Vec<String> = NAMES.iter().map(|n| format!("{} {:.2}", n, ratio[n])).collect();
    println!("ratios: {}", ratios.join(", "));
    let filled: i32 = NAMES.iter().map(|n| packing[n]).sum();
    println!("bag: {} kg of {}, so it is already full", filled, capacity);
    println!();
    show(&packing, "start:", &ratio);
    println!();

    println!("the exchange step: find a kilo of a worse ratio sitting in the bag while a");
    println!("better ratio is still on the shelf, and swap them. value cannot go down.");
    println!();

    let mut step = 1;
    loop {
        // Best ratio with stock left, worst ratio currently in the bag.
        let better = NAMES.iter().filter(|n| packing[*n] < stock[*n])
            .max_by(|a, b| ratio[*a].partial_cmp(&ratio[*b]).unwrap()).copied();
        let worse = NAMES.iter().filter(|n| packing[*n] > 0)
            .min_by(|a, b| ratio[*a].partial_cmp(&ratio[*b]).unwrap()).copied();
        let (better, worse) = match (better, worse) {
            (Some(b), Some(w)) if ratio[b] > ratio[w] => (b, w),
            _ => break,
        };

        let swap = (stock[better] - packing[better]).min(packing[worse]);
        let before = value_of(&packing, &ratio);
        *packing.get_mut(worse).unwrap() -= swap;
        *packing.get_mut(better).unwrap() += swap;
        let gain = value_of(&packing, &ratio) - before;
        println!("  step {}: swap {} kg of {} ({:.2}) for {} kg of {} ({:.2}), gaining {:+.2}",
                 step, swap, worse, ratio[worse], swap, better, ratio[better], gain);
        show(&packing, "now:", &ratio);
        step += 1;
    }

    println!();
    println!("no swap is left to make: every kilo in the bag beats every kilo on the shelf.");
    println!("that is exactly the packing the greedy rule builds, so greedy is optimal here.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

var names = []string{"copper", "silver", "gold"}

func valueOf(p map[string]int, ratio map[string]float64) float64 {
	total := 0.0
	for _, n := range names {
		total += float64(p[n]) * ratio[n]
	}
	return total
}

func show(p map[string]int, label string, ratio map[string]float64) {
	var parts []string
	for _, n := range names {
		if p[n] > 0 {
			parts = append(parts, fmt.Sprintf("%s %dkg", n, p[n]))
		}
	}
	fmt.Printf("  %-11s %-36s = %6.2f\\n", label, strings.Join(parts, ", "), valueOf(p, ratio))
}

func main() {
	// name, value, weight, ratio
	values := []int{60, 100, 120}
	weights := []int{10, 20, 30}
	ratio := map[string]float64{}
	stock := map[string]int{}
	for i, n := range names {
		ratio[n] = float64(values[i]) / float64(weights[i])
		stock[n] = weights[i]
	}
	capacity := 50

	// An adversary hands us a packing and claims it is optimal. It is full, and it
	// does not agree with the greedy rule anywhere it could.
	packing := map[string]int{"copper": 0, "silver": 20, "gold": 30}

	var ratios []string
	for _, n := range names {
		ratios = append(ratios, fmt.Sprintf("%s %.2f", n, ratio[n]))
	}
	fmt.Println("ratios: " + strings.Join(ratios, ", "))
	filled := 0
	for _, n := range names {
		filled += packing[n]
	}
	fmt.Printf("bag: %d kg of %d, so it is already full\\n", filled, capacity)
	fmt.Println()
	show(packing, "start:", ratio)
	fmt.Println()

	fmt.Println("the exchange step: find a kilo of a worse ratio sitting in the bag while a")
	fmt.Println("better ratio is still on the shelf, and swap them. value cannot go down.")
	fmt.Println()

	step := 1
	for {
		// Best ratio with stock left, worst ratio currently in the bag.
		better, worse := "", ""
		for _, n := range names {
			if packing[n] < stock[n] && (better == "" || ratio[n] > ratio[better]) {
				better = n
			}
			if packing[n] > 0 && (worse == "" || ratio[n] < ratio[worse]) {
				worse = n
			}
		}
		if better == "" || worse == "" || ratio[better] <= ratio[worse] {
			break
		}

		swap := stock[better] - packing[better]
		if packing[worse] < swap {
			swap = packing[worse]
		}
		before := valueOf(packing, ratio)
		packing[worse] -= swap
		packing[better] += swap
		gain := valueOf(packing, ratio) - before
		fmt.Printf("  step %d: swap %d kg of %s (%.2f) for %d kg of %s (%.2f), gaining %+.2f\\n",
			step, swap, worse, ratio[worse], swap, better, ratio[better], gain)
		show(packing, "now:", ratio)
		step++
	}

	fmt.Println()
	fmt.Println("no swap is left to make: every kilo in the bag beats every kilo on the shelf.")
	fmt.Println("that is exactly the packing the greedy rule builds, so greedy is optimal here.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "stays-ahead",
      heading: "The other shape: greedy stays ahead",
      body: [
        "Some problems resist the exchange framing. When the objective is a count — the most items bought, the most meetings attended, the fewest coins handed over — there is often nothing natural to swap, because solutions differ in size rather than in composition.",
        "For those, the argument is an induction on steps instead. You show that after every step, greedy's partial solution is at least as good as any rival's partial solution measured the same way. Then a rival cannot overtake, because it was never ahead, and greedy's stopping point is therefore no earlier than anyone else's.",
        "The measure has to be chosen with care, and choosing it is the real work. For buying the most items on a budget the right measure is money spent after k purchases, and the claim is that greedy's spend is the smallest that k items can cost. That is provable in a line — greedy holds the k cheapest items by construction — and the table below checks it against every possible subset instead of taking the line on trust.",
      ],
      examples: [
        {
          id: "stays-ahead",
          title: "Greedy stays ahead at every step",
          lang: "python",
          code: `from itertools import combinations

prices = [7, 3, 9, 2, 8, 5]
budget = 20

# The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
order = sorted(prices)
print(f"prices: {prices}")
print(f"sorted: {order}")
print(f"budget: {budget}")
print()

spent, bought = 0, []
for price in order:
    if spent + price > budget:
        break
    spent += price
    bought.append(price)
print(f"greedy buys {bought}, spending {spent} of {budget} -> {len(bought)} items")
print()

# "Stays ahead": after k purchases, no other way of choosing k items has spent
# less. Checked here against every k-subset rather than argued.
print("the claim: for every k, greedy's spend is the least any k items can cost")
print(f"  {'k':>2} {'greedy spend':>13} {'cheapest k items':>17}  same?")
for k in range(1, len(prices) + 1):
    greedy_k = sum(order[:k])
    cheapest = min(sum(c) for c in combinations(prices, k))
    print(f"  {k:>2} {greedy_k:>13} {cheapest:>17}  {'yes' if greedy_k == cheapest else 'NO'}")

print()
print("greedy is never behind, so the first k it cannot afford is the first k")
print("nobody can afford. that bounds every rival at the same count, which is")
print("what 'stays ahead' proves — an induction on k rather than a swap.")`,
          output: `prices: [7, 3, 9, 2, 8, 5]
sorted: [2, 3, 5, 7, 8, 9]
budget: 20

greedy buys [2, 3, 5, 7], spending 17 of 20 -> 4 items

the claim: for every k, greedy's spend is the least any k items can cost
   k  greedy spend  cheapest k items  same?
   1             2                 2  yes
   2             5                 5  yes
   3            10                10  yes
   4            17                17  yes
   5            25                25  yes
   6            34                34  yes

greedy is never behind, so the first k it cannot afford is the first k
nobody can afford. that bounds every rival at the same count, which is
what 'stays ahead' proves — an induction on k rather than a swap.`,
          explanation:
            "The second standard shape suits problems that count things rather than total them. Instead of rewriting a rival solution, you show that after every step the greedy solution is at least as far along as any rival — here, that its spend after k purchases is the least k items can possibly cost. The induction then does the rest: if greedy is never behind, it cannot run out of budget before a rival does, so no rival buys more items. The table checks the claim against every subset rather than asserting it, which is the difference between a proof you believe and a proof you have seen fail to fail.",
          alternates: [
            {
              lang: "javascript",
              code: `const prices = [7, 3, 9, 2, 8, 5];
const budget = 20;

const show = (a) => \`[\${a.join(", ")}]\`;
const padL = (s, w) => String(s).padStart(w);

// The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
const order = [...prices].sort((a, b) => a - b);
console.log(\`prices: \${show(prices)}\`);
console.log(\`sorted: \${show(order)}\`);
console.log(\`budget: \${budget}\`);
console.log();

let spent = 0;
const bought = [];
for (const price of order) {
  if (spent + price > budget) break;
  spent += price;
  bought.push(price);
}
console.log(\`greedy buys \${show(bought)}, spending \${spent} of \${budget} -> \${bought.length} items\`);
console.log();

// "Stays ahead": after k purchases, no other way of choosing k items has spent
// less. Checked here against every k-subset rather than argued.
console.log("the claim: for every k, greedy's spend is the least any k items can cost");
console.log(\`  \${padL("k", 2)} \${padL("greedy spend", 13)} \${padL("cheapest k items", 17)}  same?\`);
for (let k = 1; k <= prices.length; k++) {
  const greedyK = order.slice(0, k).reduce((s, v) => s + v, 0);
  let cheapest = Infinity;
  for (let mask = 0; mask < 1 << prices.length; mask++) {
    const chosen = prices.filter((_, i) => (mask >> i) & 1);
    if (chosen.length === k) cheapest = Math.min(cheapest, chosen.reduce((s, v) => s + v, 0));
  }
  console.log(\`  \${padL(k, 2)} \${padL(greedyK, 13)} \${padL(cheapest, 17)}  \${greedyK === cheapest ? "yes" : "NO"}\`);
}

console.log();
console.log("greedy is never behind, so the first k it cannot afford is the first k");
console.log("nobody can afford. that bounds every rival at the same count, which is");
console.log("what 'stays ahead' proves — an induction on k rather than a swap.");`,
            },
            {
              lang: "typescript",
              code: `const prices: number[] = [7, 3, 9, 2, 8, 5];
const budget = 20;

const show = (a: number[]): string => \`[\${a.join(", ")}]\`;
const padL = (s: string | number, w: number): string => String(s).padStart(w);

// The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
const order = [...prices].sort((a, b) => a - b);
console.log(\`prices: \${show(prices)}\`);
console.log(\`sorted: \${show(order)}\`);
console.log(\`budget: \${budget}\`);
console.log();

let spent = 0;
const bought: number[] = [];
for (const price of order) {
  if (spent + price > budget) break;
  spent += price;
  bought.push(price);
}
console.log(\`greedy buys \${show(bought)}, spending \${spent} of \${budget} -> \${bought.length} items\`);
console.log();

// "Stays ahead": after k purchases, no other way of choosing k items has spent
// less. Checked here against every k-subset rather than argued.
console.log("the claim: for every k, greedy's spend is the least any k items can cost");
console.log(\`  \${padL("k", 2)} \${padL("greedy spend", 13)} \${padL("cheapest k items", 17)}  same?\`);
for (let k = 1; k <= prices.length; k++) {
  const greedyK = order.slice(0, k).reduce((s, v) => s + v, 0);
  let cheapest = Infinity;
  for (let mask = 0; mask < 1 << prices.length; mask++) {
    const chosen = prices.filter((_, i) => (mask >> i) & 1);
    if (chosen.length === k) cheapest = Math.min(cheapest, chosen.reduce((s, v) => s + v, 0));
  }
  console.log(\`  \${padL(k, 2)} \${padL(greedyK, 13)} \${padL(cheapest, 17)}  \${greedyK === cheapest ? "yes" : "NO"}\`);
}

console.log();
console.log("greedy is never behind, so the first k it cannot afford is the first k");
console.log("nobody can afford. that bounds every rival at the same count, which is");
console.log("what 'stays ahead' proves — an induction on k rather than a swap.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    static String show(List<Integer> a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.size(); i++) sb.append(i > 0 ? ", " : "").append(a.get(i));
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        int[] prices = {7, 3, 9, 2, 8, 5};
        int budget = 20;

        // The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
        int[] order = prices.clone();
        Arrays.sort(order);

        List<Integer> priceList = new ArrayList<>();
        for (int p : prices) priceList.add(p);
        List<Integer> orderList = new ArrayList<>();
        for (int p : order) orderList.add(p);

        System.out.println("prices: " + show(priceList));
        System.out.println("sorted: " + show(orderList));
        System.out.println("budget: " + budget);
        System.out.println();

        int spent = 0;
        List<Integer> bought = new ArrayList<>();
        for (int price : order) {
            if (spent + price > budget) break;
            spent += price;
            bought.add(price);
        }
        System.out.println("greedy buys " + show(bought) + ", spending " + spent
                + " of " + budget + " -> " + bought.size() + " items");
        System.out.println();

        // "Stays ahead": after k purchases, no other way of choosing k items has spent
        // less. Checked here against every k-subset rather than argued.
        System.out.println("the claim: for every k, greedy's spend is the least any k items can cost");
        System.out.printf("  %2s %13s %17s  same?%n", "k", "greedy spend", "cheapest k items");
        for (int k = 1; k <= prices.length; k++) {
            int greedyK = 0;
            for (int i = 0; i < k; i++) greedyK += order[i];
            int cheapest = Integer.MAX_VALUE;
            for (int mask = 0; mask < 1 << prices.length; mask++) {
                if (Integer.bitCount(mask) != k) continue;
                int sum = 0;
                for (int i = 0; i < prices.length; i++) {
                    if ((mask >> i & 1) == 1) sum += prices[i];
                }
                cheapest = Math.min(cheapest, sum);
            }
            System.out.printf("  %2d %13d %17d  %s%n", k, greedyK, cheapest,
                    greedyK == cheapest ? "yes" : "NO");
        }

        System.out.println();
        System.out.println("greedy is never behind, so the first k it cannot afford is the first k");
        System.out.println("nobody can afford. that bounds every rival at the same count, which is");
        System.out.println("what 'stays ahead' proves — an induction on k rather than a swap.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <bitset>
#include <climits>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (std::size_t i = 0; i < a.size(); i++) {
        out += (i ? ", " : "") + std::to_string(a[i]);
    }
    return out + "]";
}

int main() {
    std::vector<int> prices = {7, 3, 9, 2, 8, 5};
    const int budget = 20;

    // The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
    std::vector<int> order = prices;
    std::sort(order.begin(), order.end());

    std::cout << "prices: " << show(prices) << '\\n';
    std::cout << "sorted: " << show(order) << '\\n';
    std::cout << "budget: " << budget << '\\n' << '\\n';

    int spent = 0;
    std::vector<int> bought;
    for (int price : order) {
        if (spent + price > budget) break;
        spent += price;
        bought.push_back(price);
    }
    std::cout << "greedy buys " << show(bought) << ", spending " << spent << " of " << budget
              << " -> " << bought.size() << " items\\n\\n";

    // "Stays ahead": after k purchases, no other way of choosing k items has spent
    // less. Checked here against every k-subset rather than argued.
    std::cout << "the claim: for every k, greedy's spend is the least any k items can cost\\n";
    std::cout << "  " << std::setw(2) << "k" << ' ' << std::setw(13) << "greedy spend" << ' '
              << std::setw(17) << "cheapest k items" << "  same?\\n";
    const int n = static_cast<int>(prices.size());
    for (int k = 1; k <= n; k++) {
        int greedyK = 0;
        for (int i = 0; i < k; i++) greedyK += order[i];
        int cheapest = INT_MAX;
        for (int mask = 0; mask < 1 << n; mask++) {
            if (std::bitset<32>(mask).count() != static_cast<std::size_t>(k)) continue;
            int sum = 0;
            for (int i = 0; i < n; i++) {
                if (mask >> i & 1) sum += prices[i];
            }
            cheapest = std::min(cheapest, sum);
        }
        std::cout << "  " << std::setw(2) << k << ' ' << std::setw(13) << greedyK << ' '
                  << std::setw(17) << cheapest << "  " << (greedyK == cheapest ? "yes" : "NO") << '\\n';
    }

    std::cout << "\\ngreedy is never behind, so the first k it cannot afford is the first k\\n";
    std::cout << "nobody can afford. that bounds every rival at the same count, which is\\n";
    std::cout << "what 'stays ahead' proves — an induction on k rather than a swap.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let prices = vec![7, 3, 9, 2, 8, 5];
    let budget = 20;

    // The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
    let mut order = prices.clone();
    order.sort();

    println!("prices: {}", show(&prices));
    println!("sorted: {}", show(&order));
    println!("budget: {}", budget);
    println!();

    let mut spent = 0;
    let mut bought: Vec<i32> = Vec::new();
    for &price in &order {
        if spent + price > budget {
            break;
        }
        spent += price;
        bought.push(price);
    }
    println!("greedy buys {}, spending {} of {} -> {} items",
             show(&bought), spent, budget, bought.len());
    println!();

    // "Stays ahead": after k purchases, no other way of choosing k items has spent
    // less. Checked here against every k-subset rather than argued.
    println!("the claim: for every k, greedy's spend is the least any k items can cost");
    println!("  {:>2} {:>13} {:>17}  same?", "k", "greedy spend", "cheapest k items");
    let n = prices.len();
    for k in 1..=n {
        let greedy_k: i32 = order[..k].iter().sum();
        let mut cheapest = i32::MAX;
        for mask in 0..(1u32 << n) {
            if mask.count_ones() as usize != k {
                continue;
            }
            let sum: i32 = (0..n).filter(|i| mask >> i & 1 == 1).map(|i| prices[i]).sum();
            cheapest = cheapest.min(sum);
        }
        println!("  {:>2} {:>13} {:>17}  {}", k, greedy_k, cheapest,
                 if greedy_k == cheapest { "yes" } else { "NO" });
    }

    println!();
    println!("greedy is never behind, so the first k it cannot afford is the first k");
    println!("nobody can afford. that bounds every rival at the same count, which is");
    println!("what 'stays ahead' proves — an induction on k rather than a swap.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math/bits"
	"sort"
	"strconv"
	"strings"
)

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	prices := []int{7, 3, 9, 2, 8, 5}
	budget := 20

	// The rule: buy the cheapest thing you can still afford. Sorting is the algorithm.
	order := append([]int(nil), prices...)
	sort.Ints(order)

	fmt.Println("prices: " + show(prices))
	fmt.Println("sorted: " + show(order))
	fmt.Println("budget:", budget)
	fmt.Println()

	spent := 0
	var bought []int
	for _, price := range order {
		if spent+price > budget {
			break
		}
		spent += price
		bought = append(bought, price)
	}
	fmt.Printf("greedy buys %s, spending %d of %d -> %d items\\n",
		show(bought), spent, budget, len(bought))
	fmt.Println()

	// "Stays ahead": after k purchases, no other way of choosing k items has spent
	// less. Checked here against every k-subset rather than argued.
	fmt.Println("the claim: for every k, greedy's spend is the least any k items can cost")
	fmt.Printf("  %2s %13s %17s  same?\\n", "k", "greedy spend", "cheapest k items")
	n := len(prices)
	for k := 1; k <= n; k++ {
		greedyK := 0
		for i := 0; i < k; i++ {
			greedyK += order[i]
		}
		cheapest := 1 << 30
		for mask := 0; mask < 1<<n; mask++ {
			if bits.OnesCount(uint(mask)) != k {
				continue
			}
			sum := 0
			for i := 0; i < n; i++ {
				if mask>>i&1 == 1 {
					sum += prices[i]
				}
			}
			if sum < cheapest {
				cheapest = sum
			}
		}
		same := "NO"
		if greedyK == cheapest {
			same = "yes"
		}
		fmt.Printf("  %2d %13d %17d  %s\\n", k, greedyK, cheapest, same)
	}

	fmt.Println()
	fmt.Println("greedy is never behind, so the first k it cannot afford is the first k")
	fmt.Println("nobody can afford. that bounds every rival at the same count, which is")
	fmt.Println("what 'stays ahead' proves — an induction on k rather than a swap.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "when-the-proof-fails",
      heading: "When the proof fails, it hands you the counterexample",
      body: [
        "The reason to attempt a proof before writing the code is not rigour for its own sake. It is that a failed exchange argument is far more informative than a failed test.",
        "A test tells you that some input produced the wrong answer. A failed exchange step tells you *which choice* cannot be justified and *why the swap is unavailable* — and that usually generalises into the whole family of inputs your rule will get wrong.",
        "Attempting the argument on the indivisible bag takes about a minute. The obligation is to rewrite an optimal packing so that it starts with copper; there are only two ways to make room, and both lose more than they gain. The rule is dead, and it died before any code was written.",
        "The habit worth taking from this: when a greedy rule occurs to you, spend the minute. If the exchange goes through, you have a proof. If it does not, you have a counterexample. Either way you know more than a passing test suite would have told you.",
      ],
      examples: [
        {
          id: "exchange-that-fails",
          title: "The same argument, on the version where it breaks",
          lang: "python",
          code: `items = [("copper", 60, 10), ("silver", 100, 20), ("gold", 120, 30)]
greedy_first = "copper"   # best ratio, 6.00

# The optimal solution the exchange argument has to start from.
optimum = ["silver", "gold"]
by_name = {name: (value, weight) for name, value, weight in items}
opt_value = sum(by_name[n][0] for n in optimum)
opt_weight = sum(by_name[n][1] for n in optimum)

print(f"an optimal packing: {' + '.join(optimum)} = {opt_value} in {opt_weight} kg")
print(f"greedy would start with {greedy_first}, which is not in it.")
print()
print("the exchange argument now has one job: rewrite this optimum so that it")
print("starts with copper, without losing value. every way of doing that:")
print()

need = by_name[greedy_first][1]
print(f"  copper needs {need} kg, and the bag is already full, so something must go")
print(f"  {'remove':<8} {'frees':>6} {'loses':>6} {'gains':>6} {'new total':>10}  better?")

best_rewrite = 0
for name in optimum:
    lost_value, freed = by_name[name]
    if freed < need:
        print(f"  {name:<8} {freed:>6} {lost_value:>6} {'-':>6} {'-':>10}  no room even so")
        continue
    gained = by_name[greedy_first][0]
    total = opt_value - lost_value + gained
    best_rewrite = max(best_rewrite, total)
    print(f"  {name:<8} {freed:>6} {lost_value:>6} {gained:>6} {total:>10}  "
          f"{'yes' if total >= opt_value else 'no'}")

print()
print(f"best rewrite that includes copper: {best_rewrite}, against an optimum of {opt_value}")
print("the exchange step cannot be taken. that is not a gap in the proof —")
print("it is the disproof: copper is in no optimal packing, so the greedy")
print("choice property is false here, and no cleverer tie-break can repair it.")
print()
print("in the divisible version the same step succeeded because 10 kg of gold")
print("could be removed instead of all 30. indivisibility removes the exchange,")
print("and the exchange was the whole proof.")`,
          output: `an optimal packing: silver + gold = 220 in 50 kg
greedy would start with copper, which is not in it.

the exchange argument now has one job: rewrite this optimum so that it
starts with copper, without losing value. every way of doing that:

  copper needs 10 kg, and the bag is already full, so something must go
  remove    frees  loses  gains  new total  better?
  silver       20    100     60        180  no
  gold         30    120     60        160  no

best rewrite that includes copper: 180, against an optimum of 220
the exchange step cannot be taken. that is not a gap in the proof —
it is the disproof: copper is in no optimal packing, so the greedy
choice property is false here, and no cleverer tie-break can repair it.

in the divisible version the same step succeeded because 10 kg of gold
could be removed instead of all 30. indivisibility removes the exchange,
and the exchange was the whole proof.`,
          explanation:
            "This is why attempting the proof is worth the time even when the rule is wrong. The argument has one obligation — rewrite an optimal solution so that it begins with the greedy choice — and here every rewrite is enumerated and every one loses value. That is not an inconclusive proof. It is a disproof, and it names the instance: copper belongs to no optimal packing, so the greedy choice property is false and no tie-break, no secondary sort key and no amount of testing will repair it. Notice what changed from the first example: there the exchange could take *ten kilograms* of gold, and here it must take all thirty or none. The proof failed exactly where the problem stopped allowing partial swaps.",
          alternates: [
            {
              lang: "javascript",
              code: `const items = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const greedyFirst = "copper"; // best ratio, 6.00

// The optimal solution the exchange argument has to start from.
const optimum = ["silver", "gold"];
const byName = Object.fromEntries(items.map((it) => [it.name, it]));
const optValue = optimum.reduce((s, n) => s + byName[n].value, 0);
const optWeight = optimum.reduce((s, n) => s + byName[n].weight, 0);

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

console.log(\`an optimal packing: \${optimum.join(" + ")} = \${optValue} in \${optWeight} kg\`);
console.log(\`greedy would start with \${greedyFirst}, which is not in it.\`);
console.log();
console.log("the exchange argument now has one job: rewrite this optimum so that it");
console.log("starts with copper, without losing value. every way of doing that:");
console.log();

const need = byName[greedyFirst].weight;
console.log(\`  copper needs \${need} kg, and the bag is already full, so something must go\`);
console.log(\`  \${padR("remove", 8)} \${padL("frees", 6)} \${padL("loses", 6)} \${padL("gains", 6)} \${padL("new total", 10)}  better?\`);

let bestRewrite = 0;
for (const name of optimum) {
  const { value: lostValue, weight: freed } = byName[name];
  if (freed < need) {
    console.log(\`  \${padR(name, 8)} \${padL(freed, 6)} \${padL(lostValue, 6)} \${padL("-", 6)} \${padL("-", 10)}  no room even so\`);
    continue;
  }
  const gained = byName[greedyFirst].value;
  const total = optValue - lostValue + gained;
  bestRewrite = Math.max(bestRewrite, total);
  console.log(\`  \${padR(name, 8)} \${padL(freed, 6)} \${padL(lostValue, 6)} \${padL(gained, 6)} \${padL(total, 10)}  \${total >= optValue ? "yes" : "no"}\`);
}

console.log();
console.log(\`best rewrite that includes copper: \${bestRewrite}, against an optimum of \${optValue}\`);
console.log("the exchange step cannot be taken. that is not a gap in the proof —");
console.log("it is the disproof: copper is in no optimal packing, so the greedy");
console.log("choice property is false here, and no cleverer tie-break can repair it.");
console.log();
console.log("in the divisible version the same step succeeded because 10 kg of gold");
console.log("could be removed instead of all 30. indivisibility removes the exchange,");
console.log("and the exchange was the whole proof.");`,
            },
            {
              lang: "typescript",
              code: `interface Item {
  name: string;
  value: number;
  weight: number;
}

const items: Item[] = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const greedyFirst = "copper"; // best ratio, 6.00

// The optimal solution the exchange argument has to start from.
const optimum = ["silver", "gold"];
const byName: Record<string, Item> = Object.fromEntries(items.map((it) => [it.name, it]));
const optValue = optimum.reduce((s, n) => s + byName[n].value, 0);
const optWeight = optimum.reduce((s, n) => s + byName[n].weight, 0);

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

console.log(\`an optimal packing: \${optimum.join(" + ")} = \${optValue} in \${optWeight} kg\`);
console.log(\`greedy would start with \${greedyFirst}, which is not in it.\`);
console.log();
console.log("the exchange argument now has one job: rewrite this optimum so that it");
console.log("starts with copper, without losing value. every way of doing that:");
console.log();

const need = byName[greedyFirst].weight;
console.log(\`  copper needs \${need} kg, and the bag is already full, so something must go\`);
console.log(\`  \${padR("remove", 8)} \${padL("frees", 6)} \${padL("loses", 6)} \${padL("gains", 6)} \${padL("new total", 10)}  better?\`);

let bestRewrite = 0;
for (const name of optimum) {
  const { value: lostValue, weight: freed } = byName[name];
  if (freed < need) {
    console.log(\`  \${padR(name, 8)} \${padL(freed, 6)} \${padL(lostValue, 6)} \${padL("-", 6)} \${padL("-", 10)}  no room even so\`);
    continue;
  }
  const gained = byName[greedyFirst].value;
  const total = optValue - lostValue + gained;
  bestRewrite = Math.max(bestRewrite, total);
  console.log(\`  \${padR(name, 8)} \${padL(freed, 6)} \${padL(lostValue, 6)} \${padL(gained, 6)} \${padL(total, 10)}  \${total >= optValue ? "yes" : "no"}\`);
}

console.log();
console.log(\`best rewrite that includes copper: \${bestRewrite}, against an optimum of \${optValue}\`);
console.log("the exchange step cannot be taken. that is not a gap in the proof —");
console.log("it is the disproof: copper is in no optimal packing, so the greedy");
console.log("choice property is false here, and no cleverer tie-break can repair it.");
console.log();
console.log("in the divisible version the same step succeeded because 10 kg of gold");
console.log("could be removed instead of all 30. indivisibility removes the exchange,");
console.log("and the exchange was the whole proof.");`,
            },
            {
              lang: "java",
              code: `import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    record Item(String name, int value, int weight) {}

    public static void main(String[] args) {
        List<Item> items = List.of(
                new Item("copper", 60, 10),
                new Item("silver", 100, 20),
                new Item("gold", 120, 30));
        String greedyFirst = "copper";   // best ratio, 6.00

        // The optimal solution the exchange argument has to start from.
        List<String> optimum = List.of("silver", "gold");
        Map<String, Item> byName = new LinkedHashMap<>();
        for (Item it : items) byName.put(it.name(), it);
        int optValue = 0;
        int optWeight = 0;
        for (String n : optimum) {
            optValue += byName.get(n).value();
            optWeight += byName.get(n).weight();
        }

        System.out.println("an optimal packing: " + String.join(" + ", optimum)
                + " = " + optValue + " in " + optWeight + " kg");
        System.out.println("greedy would start with " + greedyFirst + ", which is not in it.");
        System.out.println();
        System.out.println("the exchange argument now has one job: rewrite this optimum so that it");
        System.out.println("starts with copper, without losing value. every way of doing that:");
        System.out.println();

        int need = byName.get(greedyFirst).weight();
        System.out.println("  copper needs " + need
                + " kg, and the bag is already full, so something must go");
        System.out.printf("  %-8s %6s %6s %6s %10s  better?%n",
                "remove", "frees", "loses", "gains", "new total");

        int bestRewrite = 0;
        for (String name : optimum) {
            int lostValue = byName.get(name).value();
            int freed = byName.get(name).weight();
            if (freed < need) {
                System.out.printf("  %-8s %6d %6d %6s %10s  no room even so%n",
                        name, freed, lostValue, "-", "-");
                continue;
            }
            int gained = byName.get(greedyFirst).value();
            int total = optValue - lostValue + gained;
            bestRewrite = Math.max(bestRewrite, total);
            System.out.printf("  %-8s %6d %6d %6d %10d  %s%n",
                    name, freed, lostValue, gained, total, total >= optValue ? "yes" : "no");
        }

        System.out.println();
        System.out.println("best rewrite that includes copper: " + bestRewrite
                + ", against an optimum of " + optValue);
        System.out.println("the exchange step cannot be taken. that is not a gap in the proof —");
        System.out.println("it is the disproof: copper is in no optimal packing, so the greedy");
        System.out.println("choice property is false here, and no cleverer tie-break can repair it.");
        System.out.println();
        System.out.println("in the divisible version the same step succeeded because 10 kg of gold");
        System.out.println("could be removed instead of all 30. indivisibility removes the exchange,");
        System.out.println("and the exchange was the whole proof.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int value;
    int weight;
};

int main() {
    std::vector<Item> items = {{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}};
    const std::string greedyFirst = "copper";   // best ratio, 6.00

    // The optimal solution the exchange argument has to start from.
    std::vector<std::string> optimum = {"silver", "gold"};
    std::map<std::string, Item> byName;
    for (const Item& it : items) byName[it.name] = it;
    int optValue = 0;
    int optWeight = 0;
    for (const std::string& n : optimum) {
        optValue += byName[n].value;
        optWeight += byName[n].weight;
    }

    std::cout << "an optimal packing: ";
    for (std::size_t i = 0; i < optimum.size(); i++) std::cout << (i ? " + " : "") << optimum[i];
    std::cout << " = " << optValue << " in " << optWeight << " kg\\n";
    std::cout << "greedy would start with " << greedyFirst << ", which is not in it.\\n\\n";
    std::cout << "the exchange argument now has one job: rewrite this optimum so that it\\n";
    std::cout << "starts with copper, without losing value. every way of doing that:\\n\\n";

    int need = byName[greedyFirst].weight;
    std::cout << "  copper needs " << need
              << " kg, and the bag is already full, so something must go\\n";
    std::cout << "  " << std::left << std::setw(8) << "remove" << std::right << ' '
              << std::setw(6) << "frees" << ' ' << std::setw(6) << "loses" << ' '
              << std::setw(6) << "gains" << ' ' << std::setw(10) << "new total" << "  better?\\n";

    int bestRewrite = 0;
    for (const std::string& name : optimum) {
        int lostValue = byName[name].value;
        int freed = byName[name].weight;
        if (freed < need) {
            std::cout << "  " << std::left << std::setw(8) << name << std::right << ' '
                      << std::setw(6) << freed << ' ' << std::setw(6) << lostValue << ' '
                      << std::setw(6) << "-" << ' ' << std::setw(10) << "-"
                      << "  no room even so\\n";
            continue;
        }
        int gained = byName[greedyFirst].value;
        int total = optValue - lostValue + gained;
        bestRewrite = std::max(bestRewrite, total);
        std::cout << "  " << std::left << std::setw(8) << name << std::right << ' '
                  << std::setw(6) << freed << ' ' << std::setw(6) << lostValue << ' '
                  << std::setw(6) << gained << ' ' << std::setw(10) << total << "  "
                  << (total >= optValue ? "yes" : "no") << '\\n';
    }

    std::cout << '\\n';
    std::cout << "best rewrite that includes copper: " << bestRewrite
              << ", against an optimum of " << optValue << '\\n';
    std::cout << "the exchange step cannot be taken. that is not a gap in the proof —\\n";
    std::cout << "it is the disproof: copper is in no optimal packing, so the greedy\\n";
    std::cout << "choice property is false here, and no cleverer tie-break can repair it.\\n\\n";
    std::cout << "in the divisible version the same step succeeded because 10 kg of gold\\n";
    std::cout << "could be removed instead of all 30. indivisibility removes the exchange,\\n";
    std::cout << "and the exchange was the whole proof.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

struct Item {
    name: &'static str,
    value: i32,
    weight: i32,
}

fn main() {
    let items = vec![
        Item { name: "copper", value: 60, weight: 10 },
        Item { name: "silver", value: 100, weight: 20 },
        Item { name: "gold", value: 120, weight: 30 },
    ];
    let greedy_first = "copper"; // best ratio, 6.00

    // The optimal solution the exchange argument has to start from.
    let optimum = vec!["silver", "gold"];
    let by_name: HashMap<&str, &Item> = items.iter().map(|it| (it.name, it)).collect();
    let opt_value: i32 = optimum.iter().map(|n| by_name[n].value).sum();
    let opt_weight: i32 = optimum.iter().map(|n| by_name[n].weight).sum();

    println!("an optimal packing: {} = {} in {} kg", optimum.join(" + "), opt_value, opt_weight);
    println!("greedy would start with {}, which is not in it.", greedy_first);
    println!();
    println!("the exchange argument now has one job: rewrite this optimum so that it");
    println!("starts with copper, without losing value. every way of doing that:");
    println!();

    let need = by_name[greedy_first].weight;
    println!("  copper needs {} kg, and the bag is already full, so something must go", need);
    println!("  {:<8} {:>6} {:>6} {:>6} {:>10}  better?",
             "remove", "frees", "loses", "gains", "new total");

    let mut best_rewrite = 0;
    for name in &optimum {
        let lost_value = by_name[name].value;
        let freed = by_name[name].weight;
        if freed < need {
            println!("  {:<8} {:>6} {:>6} {:>6} {:>10}  no room even so",
                     name, freed, lost_value, "-", "-");
            continue;
        }
        let gained = by_name[greedy_first].value;
        let total = opt_value - lost_value + gained;
        best_rewrite = best_rewrite.max(total);
        println!("  {:<8} {:>6} {:>6} {:>6} {:>10}  {}",
                 name, freed, lost_value, gained, total,
                 if total >= opt_value { "yes" } else { "no" });
    }

    println!();
    println!("best rewrite that includes copper: {}, against an optimum of {}",
             best_rewrite, opt_value);
    println!("the exchange step cannot be taken. that is not a gap in the proof —");
    println!("it is the disproof: copper is in no optimal packing, so the greedy");
    println!("choice property is false here, and no cleverer tie-break can repair it.");
    println!();
    println!("in the divisible version the same step succeeded because 10 kg of gold");
    println!("could be removed instead of all 30. indivisibility removes the exchange,");
    println!("and the exchange was the whole proof.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

type item struct {
	name   string
	value  int
	weight int
}

func main() {
	items := []item{{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}}
	greedyFirst := "copper" // best ratio, 6.00

	// The optimal solution the exchange argument has to start from.
	optimum := []string{"silver", "gold"}
	byName := map[string]item{}
	for _, it := range items {
		byName[it.name] = it
	}
	optValue, optWeight := 0, 0
	for _, n := range optimum {
		optValue += byName[n].value
		optWeight += byName[n].weight
	}

	fmt.Printf("an optimal packing: %s = %d in %d kg\\n",
		strings.Join(optimum, " + "), optValue, optWeight)
	fmt.Printf("greedy would start with %s, which is not in it.\\n", greedyFirst)
	fmt.Println()
	fmt.Println("the exchange argument now has one job: rewrite this optimum so that it")
	fmt.Println("starts with copper, without losing value. every way of doing that:")
	fmt.Println()

	need := byName[greedyFirst].weight
	fmt.Printf("  copper needs %d kg, and the bag is already full, so something must go\\n", need)
	fmt.Printf("  %-8s %6s %6s %6s %10s  better?\\n",
		"remove", "frees", "loses", "gains", "new total")

	bestRewrite := 0
	for _, name := range optimum {
		lostValue := byName[name].value
		freed := byName[name].weight
		if freed < need {
			fmt.Printf("  %-8s %6d %6d %6s %10s  no room even so\\n",
				name, freed, lostValue, "-", "-")
			continue
		}
		gained := byName[greedyFirst].value
		total := optValue - lostValue + gained
		if total > bestRewrite {
			bestRewrite = total
		}
		better := "no"
		if total >= optValue {
			better = "yes"
		}
		fmt.Printf("  %-8s %6d %6d %6d %10d  %s\\n",
			name, freed, lostValue, gained, total, better)
	}

	fmt.Println()
	fmt.Printf("best rewrite that includes copper: %d, against an optimum of %d\\n",
		bestRewrite, optValue)
	fmt.Println("the exchange step cannot be taken. that is not a gap in the proof —")
	fmt.Println("it is the disproof: copper is in no optimal packing, so the greedy")
	fmt.Println("choice property is false here, and no cleverer tie-break can repair it.")
	fmt.Println()
	fmt.Println("in the divisible version the same step succeeded because 10 kg of gold")
	fmt.Println("could be removed instead of all 30. indivisibility removes the exchange,")
	fmt.Println("and the exchange was the whole proof.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through an exchange argument.",
      answer:
        "Assume an optimal solution. Find the earliest point at which it differs from what the greedy rule would have chosen. Show that you can replace that part with the greedy choice and end up with a solution that is still valid and no worse. Because each such replacement moves the optimal solution one step closer to the greedy one without losing value, repeating it turns the optimal solution into the greedy solution, so the greedy solution is optimal. The step that carries the weight is validity: you must show the swapped solution is still legal, and that is exactly the step that fails for problems where greedy is wrong.",
    },
    {
      question: "When would you use a stays-ahead argument instead?",
      answer:
        "When solutions are not comparable piece by piece, which usually means the objective is a count rather than a sum over chosen items. Exchange arguments need something you can take out and put back; if greedy's answer has more elements than a rival's, there may be no matching to swap along. Stays-ahead sidesteps that by fixing a measure of progress — money spent after k purchases, finish time after k meetings — and proving by induction that greedy's value of that measure is never worse. Interval scheduling is the standard example, and the measure is the finishing time of the k-th chosen interval.",
    },
    {
      question: "Your exchange argument does not go through. What have you learned?",
      answer:
        "Usually that the rule is wrong, and specifically where. The step that fails names a choice that cannot be swapped into an optimal solution, and that choice is a counterexample generator: it tells you the shape of input to construct. It is worth being careful here, because a failed proof attempt is not by itself a disproof — you may have picked a clumsy exchange. The way to settle it is to enumerate, as in the example above: if every rewrite that includes the greedy choice is strictly worse, the greedy choice property is genuinely false. At that point the answer is not a better tie-break but a different technique, normally dynamic programming.",
    },
  ],
  takeaways: [
    "An exchange argument is a procedure, not a phrase: assume an optimum, find the first disagreement, swap it for the greedy choice without losing value.",
    "The step that decides the proof is always legality — whether the swapped solution is still valid.",
    "Stays-ahead suits counting problems: fix a measure of progress and induct on steps.",
    "A failed exchange step points at the counterexample. That is worth more than a failing test, because it generalises.",
    "Enumerating every rewrite turns a failed proof attempt into an actual disproof.",
    "Attempt the proof before writing the code. It takes a minute and decides whether greedy is the right technique at all.",
  ],
  status: "available",
};
