import type { Lesson } from "@/content/types";

export const greedyChoiceLesson: Lesson = {
  id: "dsa-greedy-choice",
  slug: "the-greedy-choice-and-its-preconditions",
  moduleSlug: "greedy-algorithms",
  title: "The Greedy Choice, and the Two Things It Needs",
  summary:
    "A greedy algorithm makes the best-looking move and never reconsiders it. That is either optimal or badly wrong, and the difference is two named properties — one of which almost always holds, and one of which you have to earn.",
  estimatedMinutes: 30,
  objectives: [
    "Describe a greedy algorithm by its shape: one rule, applied to the best remaining option, never revisited",
    "State the greedy choice property and optimal substructure, and tell them apart",
    "Show on one instance that a greedy rule can be applied perfectly and still be wrong",
    "Say which of the two properties fails when greedy fails, and what that implies about the fix",
  ],
  sections: [
    {
      id: "one-rule-no-looking-back",
      heading: "One rule, applied without looking back",
      body: [
        "A greedy algorithm has a shape you can recognise before you understand the problem. There is a single rule for ranking the available options, the best one is taken, and the algorithm moves on. It never undoes a choice, never explores an alternative, and never keeps a table of what might have been. That is the entire technique.",
        "This makes greedy algorithms the cheapest thing in the toolbox. Almost always the cost is the sort that puts the options in rule order, so O(n log n), and often the code is under ten lines. Compare that with the alternatives for the same problems: exhaustive search is exponential, and dynamic programming needs a table, a state definition and a recurrence.",
        "The classic instance is a bag with a weight limit and materials that can be divided — sand, gold dust, wire by the metre. The rule writes itself: fill the bag with whatever is worth most per kilogram, and when that runs out move to the next best. It is obviously right, and for this problem it genuinely is.",
      ],
      examples: [
        {
          id: "fractional-by-ratio",
          title: "Fill the bag by value per kilo",
          lang: "python",
          code: `items = [
    # name, value, weight
    ("copper", 60, 10),
    ("silver", 100, 20),
    ("gold", 120, 30),
]
capacity = 50

print(f"{'item':>7} {'value':>6} {'weight':>7} {'value/weight':>13}")
print("-" * 36)
for name, value, weight in items:
    print(f"{name:>7} {value:>6} {weight:>7} {value / weight:>13.2f}")

# The greedy rule, stated once: always take from whatever is worth most per kilo.
order = sorted(items, key=lambda it: it[1] / it[2], reverse=True)

print()
print(f"greedy order (best ratio first): {', '.join(name for name, _, _ in order)}")
print(f"capacity: {capacity}")
print()

total = 0.0
left = capacity
for name, value, weight in order:
    if left == 0:
        print(f"  skip  {name:<7} nothing left to fill")
        continue
    take = min(weight, left)
    gained = value * take / weight
    total += gained
    left -= take
    kind = "all of" if take == weight else "part of"
    print(f"  take  {name:<7} {kind:>7} it: {take:>2} kg for {gained:>6.2f}, {left:>2} kg left")

print()
print(f"greedy total: {total:.2f}")
print("no step is ever revisited: each item is decided once and left alone")`,
          output: `   item  value  weight  value/weight
------------------------------------
 copper     60      10          6.00
 silver    100      20          5.00
   gold    120      30          4.00

greedy order (best ratio first): copper, silver, gold
capacity: 50

  take  copper   all of it: 10 kg for  60.00, 40 kg left
  take  silver   all of it: 20 kg for 100.00, 20 kg left
  take  gold    part of it: 20 kg for  80.00,  0 kg left

greedy total: 240.00
no step is ever revisited: each item is decided once and left alone`,
          explanation:
            "This is the whole shape of a greedy algorithm in one loop. There is a rule — take from whatever is worth most per kilo — it is applied to the best remaining option, and the choice is never revisited. No stack, no table, no second pass. Sorting costs O(n log n) and the loop costs O(n), so the algorithm costs the sort. The answer, 240, is genuinely the best this bag can hold, and the next section shows how narrow the reason for that is.",
          alternates: [
            {
              lang: "javascript",
              code: `const items = [
  // name, value, weight
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);
const fixed = (n, w, d) => n.toFixed(d).padStart(w);

console.log(\`\${padL("item", 7)} \${padL("value", 6)} \${padL("weight", 7)} \${padL("value/weight", 13)}\`);
console.log("-".repeat(36));
for (const { name, value, weight } of items) {
  console.log(\`\${padL(name, 7)} \${padL(value, 6)} \${padL(weight, 7)} \${fixed(value / weight, 13, 2)}\`);
}

// The greedy rule, stated once: always take from whatever is worth most per kilo.
const order = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);

console.log();
console.log(\`greedy order (best ratio first): \${order.map((it) => it.name).join(", ")}\`);
console.log(\`capacity: \${capacity}\`);
console.log();

let total = 0;
let left = capacity;
for (const { name, value, weight } of order) {
  if (left === 0) {
    console.log(\`  skip  \${padR(name, 7)} nothing left to fill\`);
    continue;
  }
  const take = Math.min(weight, left);
  const gained = (value * take) / weight;
  total += gained;
  left -= take;
  const kind = take === weight ? "all of" : "part of";
  console.log(\`  take  \${padR(name, 7)} \${padL(kind, 7)} it: \${padL(take, 2)} kg for \${fixed(gained, 6, 2)}, \${padL(left, 2)} kg left\`);
}

console.log();
console.log(\`greedy total: \${total.toFixed(2)}\`);
console.log("no step is ever revisited: each item is decided once and left alone");`,
            },
            {
              lang: "typescript",
              code: `interface Item {
  name: string;
  value: number;
  weight: number;
}

const items: Item[] = [
  // name, value, weight
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);
const fixed = (n: number, w: number, d: number): string => n.toFixed(d).padStart(w);

console.log(\`\${padL("item", 7)} \${padL("value", 6)} \${padL("weight", 7)} \${padL("value/weight", 13)}\`);
console.log("-".repeat(36));
for (const { name, value, weight } of items) {
  console.log(\`\${padL(name, 7)} \${padL(value, 6)} \${padL(weight, 7)} \${fixed(value / weight, 13, 2)}\`);
}

// The greedy rule, stated once: always take from whatever is worth most per kilo.
const order = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);

console.log();
console.log(\`greedy order (best ratio first): \${order.map((it) => it.name).join(", ")}\`);
console.log(\`capacity: \${capacity}\`);
console.log();

let total = 0;
let left = capacity;
for (const { name, value, weight } of order) {
  if (left === 0) {
    console.log(\`  skip  \${padR(name, 7)} nothing left to fill\`);
    continue;
  }
  const take = Math.min(weight, left);
  const gained = (value * take) / weight;
  total += gained;
  left -= take;
  const kind = take === weight ? "all of" : "part of";
  console.log(\`  take  \${padR(name, 7)} \${padL(kind, 7)} it: \${padL(take, 2)} kg for \${fixed(gained, 6, 2)}, \${padL(left, 2)} kg left\`);
}

console.log();
console.log(\`greedy total: \${total.toFixed(2)}\`);
console.log("no step is ever revisited: each item is decided once and left alone");`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;
import java.util.Locale;
import java.util.StringJoiner;

public class Main {
    public static void main(String[] args) {
        // name, value, weight
        String[] names = {"copper", "silver", "gold"};
        int[] values = {60, 100, 120};
        int[] weights = {10, 20, 30};
        int capacity = 50;

        System.out.printf("%7s %6s %7s %13s%n", "item", "value", "weight", "value/weight");
        System.out.println("-".repeat(36));
        for (int i = 0; i < names.length; i++) {
            System.out.printf(Locale.ROOT, "%7s %6d %7d %13.2f%n",
                    names[i], values[i], weights[i], (double) values[i] / weights[i]);
        }

        // The greedy rule, stated once: always take from whatever is worth most per kilo.
        Integer[] order = {0, 1, 2};
        Arrays.sort(order, (a, b) ->
                Double.compare((double) values[b] / weights[b], (double) values[a] / weights[a]));

        StringJoiner joiner = new StringJoiner(", ");
        for (int i : order) joiner.add(names[i]);
        System.out.println();
        System.out.println("greedy order (best ratio first): " + joiner);
        System.out.println("capacity: " + capacity);
        System.out.println();

        double total = 0;
        int left = capacity;
        for (int i : order) {
            if (left == 0) {
                System.out.printf("  skip  %-7s nothing left to fill%n", names[i]);
                continue;
            }
            int take = Math.min(weights[i], left);
            double gained = (double) values[i] * take / weights[i];
            total += gained;
            left -= take;
            String kind = take == weights[i] ? "all of" : "part of";
            System.out.printf(Locale.ROOT, "  take  %-7s %7s it: %2d kg for %6.2f, %2d kg left%n",
                    names[i], kind, take, gained, left);
        }

        System.out.println();
        System.out.printf(Locale.ROOT, "greedy total: %.2f%n", total);
        System.out.println("no step is ever revisited: each item is decided once and left alone");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int value;
    int weight;
};

int main() {
    // name, value, weight
    std::vector<Item> items = {
        {"copper", 60, 10},
        {"silver", 100, 20},
        {"gold", 120, 30},
    };
    const int capacity = 50;

    std::cout << std::setw(7) << "item" << ' ' << std::setw(6) << "value" << ' '
              << std::setw(7) << "weight" << ' ' << std::setw(13) << "value/weight" << '\\n';
    std::cout << std::string(36, '-') << '\\n';
    std::cout << std::fixed << std::setprecision(2);
    for (const Item& it : items) {
        std::cout << std::setw(7) << it.name << ' ' << std::setw(6) << it.value << ' '
                  << std::setw(7) << it.weight << ' '
                  << std::setw(13) << static_cast<double>(it.value) / it.weight << '\\n';
    }

    // The greedy rule, stated once: always take from whatever is worth most per kilo.
    std::vector<Item> order = items;
    std::stable_sort(order.begin(), order.end(), [](const Item& a, const Item& b) {
        return static_cast<double>(a.value) / a.weight > static_cast<double>(b.value) / b.weight;
    });

    std::cout << '\\n' << "greedy order (best ratio first): ";
    for (std::size_t i = 0; i < order.size(); i++) {
        std::cout << (i ? ", " : "") << order[i].name;
    }
    std::cout << '\\n' << "capacity: " << capacity << '\\n' << '\\n';

    double total = 0;
    int left = capacity;
    for (const Item& it : order) {
        if (left == 0) {
            std::cout << "  skip  " << std::left << std::setw(7) << it.name << std::right
                      << " nothing left to fill" << '\\n';
            continue;
        }
        int take = std::min(it.weight, left);
        double gained = static_cast<double>(it.value) * take / it.weight;
        total += gained;
        left -= take;
        std::string kind = take == it.weight ? "all of" : "part of";
        std::cout << "  take  " << std::left << std::setw(7) << it.name << std::right << ' '
                  << std::setw(7) << kind << " it: " << std::setw(2) << take << " kg for "
                  << std::setw(6) << gained << ", " << std::setw(2) << left << " kg left" << '\\n';
    }

    std::cout << '\\n' << "greedy total: " << total << '\\n';
    std::cout << "no step is ever revisited: each item is decided once and left alone" << '\\n';
}`,
            },
            {
              lang: "rust",
              code: `struct Item {
    name: &'static str,
    value: i32,
    weight: i32,
}

fn main() {
    // name, value, weight
    let items = vec![
        Item { name: "copper", value: 60, weight: 10 },
        Item { name: "silver", value: 100, weight: 20 },
        Item { name: "gold", value: 120, weight: 30 },
    ];
    let capacity = 50;

    println!("{:>7} {:>6} {:>7} {:>13}", "item", "value", "weight", "value/weight");
    println!("{}", "-".repeat(36));
    for it in &items {
        println!("{:>7} {:>6} {:>7} {:>13.2}", it.name, it.value, it.weight,
                 f64::from(it.value) / f64::from(it.weight));
    }

    // The greedy rule, stated once: always take from whatever is worth most per kilo.
    let mut order: Vec<&Item> = items.iter().collect();
    order.sort_by(|a, b| {
        let ra = f64::from(a.value) / f64::from(a.weight);
        let rb = f64::from(b.value) / f64::from(b.weight);
        rb.partial_cmp(&ra).unwrap()
    });

    let names: Vec<&str> = order.iter().map(|it| it.name).collect();
    println!();
    println!("greedy order (best ratio first): {}", names.join(", "));
    println!("capacity: {}", capacity);
    println!();

    let mut total = 0.0_f64;
    let mut left = capacity;
    for it in &order {
        if left == 0 {
            println!("  skip  {:<7} nothing left to fill", it.name);
            continue;
        }
        let take = it.weight.min(left);
        let gained = f64::from(it.value) * f64::from(take) / f64::from(it.weight);
        total += gained;
        left -= take;
        let kind = if take == it.weight { "all of" } else { "part of" };
        println!("  take  {:<7} {:>7} it: {:>2} kg for {:>6.2}, {:>2} kg left",
                 it.name, kind, take, gained, left);
    }

    println!();
    println!("greedy total: {:.2}", total);
    println!("no step is ever revisited: each item is decided once and left alone");
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

type item struct {
	name   string
	value  int
	weight int
}

func main() {
	// name, value, weight
	items := []item{
		{"copper", 60, 10},
		{"silver", 100, 20},
		{"gold", 120, 30},
	}
	capacity := 50

	fmt.Printf("%7s %6s %7s %13s\\n", "item", "value", "weight", "value/weight")
	fmt.Println(strings.Repeat("-", 36))
	for _, it := range items {
		fmt.Printf("%7s %6d %7d %13.2f\\n", it.name, it.value, it.weight,
			float64(it.value)/float64(it.weight))
	}

	// The greedy rule, stated once: always take from whatever is worth most per kilo.
	order := append([]item(nil), items...)
	sort.SliceStable(order, func(a, b int) bool {
		return float64(order[a].value)/float64(order[a].weight) >
			float64(order[b].value)/float64(order[b].weight)
	})

	names := make([]string, len(order))
	for i, it := range order {
		names[i] = it.name
	}
	fmt.Println()
	fmt.Println("greedy order (best ratio first): " + strings.Join(names, ", "))
	fmt.Println("capacity:", capacity)
	fmt.Println()

	total := 0.0
	left := capacity
	for _, it := range order {
		if left == 0 {
			fmt.Printf("  skip  %-7s nothing left to fill\\n", it.name)
			continue
		}
		take := it.weight
		if left < take {
			take = left
		}
		gained := float64(it.value) * float64(take) / float64(it.weight)
		total += gained
		left -= take
		kind := "part of"
		if take == it.weight {
			kind = "all of"
		}
		fmt.Printf("  take  %-7s %7s it: %2d kg for %6.2f, %2d kg left\\n",
			it.name, kind, take, gained, left)
	}

	fmt.Println()
	fmt.Printf("greedy total: %.2f\\n", total)
	fmt.Println("no step is ever revisited: each item is decided once and left alone")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "same-items-indivisible",
      heading: "Change one word, and the rule breaks",
      body: [
        "Now remove a single assumption. The materials are no longer powders but bars: you take a whole bar or you take none of it. Nothing else about the problem moves — the same three items, the same weights, the same values, the same 50 kg bag.",
        "The greedy rule survives the change without complaint. Value per kilogram is still computable, the bars still sort, the loop still runs and still refuses to look back. It produces an answer, and the answer is wrong.",
        "This is the point of the module in one comparison. The rule was not applied badly. There is no bug, no off-by-one, no tie-break to tune. A correctly implemented greedy algorithm returned a worse answer than brute force, because the problem stopped satisfying the condition that made the rule valid — and nothing in the code could have noticed.",
      ],
      examples: [
        {
          id: "zero-one-fails",
          title: "The same items, taken whole or not at all",
          lang: "python",
          code: `items = [("copper", 60, 10), ("silver", 100, 20), ("gold", 120, 30)]
capacity = 50

# Same items, same capacity. The only change: an item is taken whole or not at all.
order = sorted(items, key=lambda it: it[1] / it[2], reverse=True)

taken, total, left = [], 0, capacity
for name, value, weight in order:
    if weight <= left:
        taken.append(name)
        total += value
        left -= weight

print("greedy, best ratio first, whole items only:")
print(f"  took {' + '.join(taken)} = {total}, with {left} kg of the bag empty")
print()

print("every subset, checked by hand:")
print(f"  {'subset':<22} {'weight':>6} {'value':>6}  fits?")
best_value, best_names = 0, []
for mask in range(1 << len(items)):
    chosen = [items[i] for i in range(len(items)) if mask >> i & 1]
    weight = sum(it[2] for it in chosen)
    value = sum(it[1] for it in chosen)
    names = " + ".join(it[0] for it in chosen) or "(nothing)"
    fits = weight <= capacity
    if fits and value > best_value:
        best_value, best_names = value, [it[0] for it in chosen]
    print(f"  {names:<22} {weight:>6} {value:>6}  {'yes' if fits else 'no'}")

print()
print(f"best possible: {' + '.join(best_names)} = {best_value}")
print(f"greedy found:  {' + '.join(taken)} = {total}")
print(f"greedy is short by {best_value - total}")
print()
print("the ratio rule took copper first because 6.00 beat everything,")
print("and that one irrevocable choice left a 30 kg gold bar that no longer fit")`,
          output: `greedy, best ratio first, whole items only:
  took copper + silver = 160, with 20 kg of the bag empty

every subset, checked by hand:
  subset                 weight  value  fits?
  (nothing)                   0      0  yes
  copper                     10     60  yes
  silver                     20    100  yes
  copper + silver            30    160  yes
  gold                       30    120  yes
  copper + gold              40    180  yes
  silver + gold              50    220  yes
  copper + silver + gold     60    280  no

best possible: silver + gold = 220
greedy found:  copper + silver = 160
greedy is short by 60

the ratio rule took copper first because 6.00 beat everything,
and that one irrevocable choice left a 30 kg gold bar that no longer fit`,
          explanation:
            "Nothing changed except that an item can no longer be cut. The rule still runs, still picks the best ratio first, still never looks back — and now it is wrong by 60. Copper has the best ratio in the table and belongs in no optimal answer. That is worth sitting with: the greedy rule did not misfire, and a better tie-break would not save it. The rule was applied exactly as designed and produced a worse answer than a schoolchild enumerating eight subsets.",
          alternates: [
            {
              lang: "javascript",
              code: `const items = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;

// Same items, same capacity. The only change: an item is taken whole or not at all.
const order = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);

const taken = [];
let total = 0;
let left = capacity;
for (const { name, value, weight } of order) {
  if (weight <= left) {
    taken.push(name);
    total += value;
    left -= weight;
  }
}

console.log("greedy, best ratio first, whole items only:");
console.log(\`  took \${taken.join(" + ")} = \${total}, with \${left} kg of the bag empty\`);
console.log();

console.log("every subset, checked by hand:");
console.log(\`  \${"subset".padEnd(22)} \${"weight".padStart(6)} \${"value".padStart(6)}  fits?\`);
let bestValue = 0;
let bestNames = [];
for (let mask = 0; mask < 1 << items.length; mask++) {
  const chosen = items.filter((_, i) => (mask >> i) & 1);
  const weight = chosen.reduce((s, it) => s + it.weight, 0);
  const value = chosen.reduce((s, it) => s + it.value, 0);
  const names = chosen.map((it) => it.name).join(" + ") || "(nothing)";
  const fits = weight <= capacity;
  if (fits && value > bestValue) {
    bestValue = value;
    bestNames = chosen.map((it) => it.name);
  }
  console.log(\`  \${names.padEnd(22)} \${String(weight).padStart(6)} \${String(value).padStart(6)}  \${fits ? "yes" : "no"}\`);
}

console.log();
console.log(\`best possible: \${bestNames.join(" + ")} = \${bestValue}\`);
console.log(\`greedy found:  \${taken.join(" + ")} = \${total}\`);
console.log(\`greedy is short by \${bestValue - total}\`);
console.log();
console.log("the ratio rule took copper first because 6.00 beat everything,");
console.log("and that one irrevocable choice left a 30 kg gold bar that no longer fit");`,
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
const capacity = 50;

// Same items, same capacity. The only change: an item is taken whole or not at all.
const order = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);

const taken: string[] = [];
let total = 0;
let left = capacity;
for (const { name, value, weight } of order) {
  if (weight <= left) {
    taken.push(name);
    total += value;
    left -= weight;
  }
}

console.log("greedy, best ratio first, whole items only:");
console.log(\`  took \${taken.join(" + ")} = \${total}, with \${left} kg of the bag empty\`);
console.log();

console.log("every subset, checked by hand:");
console.log(\`  \${"subset".padEnd(22)} \${"weight".padStart(6)} \${"value".padStart(6)}  fits?\`);
let bestValue = 0;
let bestNames: string[] = [];
for (let mask = 0; mask < 1 << items.length; mask++) {
  const chosen = items.filter((_, i) => (mask >> i) & 1);
  const weight = chosen.reduce((s, it) => s + it.weight, 0);
  const value = chosen.reduce((s, it) => s + it.value, 0);
  const names = chosen.map((it) => it.name).join(" + ") || "(nothing)";
  const fits = weight <= capacity;
  if (fits && value > bestValue) {
    bestValue = value;
    bestNames = chosen.map((it) => it.name);
  }
  console.log(\`  \${names.padEnd(22)} \${String(weight).padStart(6)} \${String(value).padStart(6)}  \${fits ? "yes" : "no"}\`);
}

console.log();
console.log(\`best possible: \${bestNames.join(" + ")} = \${bestValue}\`);
console.log(\`greedy found:  \${taken.join(" + ")} = \${total}\`);
console.log(\`greedy is short by \${bestValue - total}\`);
console.log();
console.log("the ratio rule took copper first because 6.00 beat everything,");
console.log("and that one irrevocable choice left a 30 kg gold bar that no longer fit");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        String[] names = {"copper", "silver", "gold"};
        int[] values = {60, 100, 120};
        int[] weights = {10, 20, 30};
        int capacity = 50;

        // Same items, same capacity. The only change: an item is taken whole or not at all.
        Integer[] order = {0, 1, 2};
        Arrays.sort(order, (a, b) ->
                Double.compare((double) values[b] / weights[b], (double) values[a] / weights[a]));

        List<String> taken = new ArrayList<>();
        int total = 0;
        int left = capacity;
        for (int i : order) {
            if (weights[i] <= left) {
                taken.add(names[i]);
                total += values[i];
                left -= weights[i];
            }
        }

        System.out.println("greedy, best ratio first, whole items only:");
        System.out.println("  took " + String.join(" + ", taken) + " = " + total
                + ", with " + left + " kg of the bag empty");
        System.out.println();

        System.out.println("every subset, checked by hand:");
        System.out.printf("  %-22s %6s %6s  fits?%n", "subset", "weight", "value");
        int bestValue = 0;
        List<String> bestNames = new ArrayList<>();
        for (int mask = 0; mask < 1 << names.length; mask++) {
            List<String> chosen = new ArrayList<>();
            int weight = 0;
            int value = 0;
            for (int i = 0; i < names.length; i++) {
                if ((mask >> i & 1) == 1) {
                    chosen.add(names[i]);
                    weight += weights[i];
                    value += values[i];
                }
            }
            String label = chosen.isEmpty() ? "(nothing)" : String.join(" + ", chosen);
            boolean fits = weight <= capacity;
            if (fits && value > bestValue) {
                bestValue = value;
                bestNames = chosen;
            }
            System.out.printf("  %-22s %6d %6d  %s%n", label, weight, value, fits ? "yes" : "no");
        }

        System.out.println();
        System.out.println("best possible: " + String.join(" + ", bestNames) + " = " + bestValue);
        System.out.println("greedy found:  " + String.join(" + ", taken) + " = " + total);
        System.out.println("greedy is short by " + (bestValue - total));
        System.out.println();
        System.out.println("the ratio rule took copper first because 6.00 beat everything,");
        System.out.println("and that one irrevocable choice left a 30 kg gold bar that no longer fit");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int value;
    int weight;
};

int main() {
    std::vector<Item> items = {{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}};
    const int capacity = 50;

    // Same items, same capacity. The only change: an item is taken whole or not at all.
    std::vector<Item> order = items;
    std::stable_sort(order.begin(), order.end(), [](const Item& a, const Item& b) {
        return static_cast<double>(a.value) / a.weight > static_cast<double>(b.value) / b.weight;
    });

    std::vector<std::string> taken;
    int total = 0, left = capacity;
    for (const Item& it : order) {
        if (it.weight <= left) {
            taken.push_back(it.name);
            total += it.value;
            left -= it.weight;
        }
    }

    auto join = [](const std::vector<std::string>& parts) {
        std::string out;
        for (std::size_t i = 0; i < parts.size(); i++) out += (i ? " + " : "") + parts[i];
        return out;
    };

    std::cout << "greedy, best ratio first, whole items only:\\n";
    std::cout << "  took " << join(taken) << " = " << total << ", with " << left
              << " kg of the bag empty\\n\\n";

    std::cout << "every subset, checked by hand:\\n";
    std::cout << "  " << std::left << std::setw(22) << "subset" << std::right << ' '
              << std::setw(6) << "weight" << ' ' << std::setw(6) << "value" << "  fits?\\n";
    int bestValue = 0;
    std::vector<std::string> bestNames;
    for (int mask = 0; mask < 1 << static_cast<int>(items.size()); mask++) {
        std::vector<std::string> chosen;
        int weight = 0, value = 0;
        for (std::size_t i = 0; i < items.size(); i++) {
            if (mask >> i & 1) {
                chosen.push_back(items[i].name);
                weight += items[i].weight;
                value += items[i].value;
            }
        }
        std::string label = chosen.empty() ? "(nothing)" : join(chosen);
        bool fits = weight <= capacity;
        if (fits && value > bestValue) {
            bestValue = value;
            bestNames = chosen;
        }
        std::cout << "  " << std::left << std::setw(22) << label << std::right << ' '
                  << std::setw(6) << weight << ' ' << std::setw(6) << value << "  "
                  << (fits ? "yes" : "no") << '\\n';
    }

    std::cout << '\\n';
    std::cout << "best possible: " << join(bestNames) << " = " << bestValue << '\\n';
    std::cout << "greedy found:  " << join(taken) << " = " << total << '\\n';
    std::cout << "greedy is short by " << bestValue - total << '\\n' << '\\n';
    std::cout << "the ratio rule took copper first because 6.00 beat everything,\\n";
    std::cout << "and that one irrevocable choice left a 30 kg gold bar that no longer fit\\n";
}`,
            },
            {
              lang: "rust",
              code: `struct Item {
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
    let capacity = 50;

    // Same items, same capacity. The only change: an item is taken whole or not at all.
    let mut order: Vec<&Item> = items.iter().collect();
    order.sort_by(|a, b| {
        let ra = f64::from(a.value) / f64::from(a.weight);
        let rb = f64::from(b.value) / f64::from(b.weight);
        rb.partial_cmp(&ra).unwrap()
    });

    let mut taken: Vec<&str> = Vec::new();
    let mut total = 0;
    let mut left = capacity;
    for it in &order {
        if it.weight <= left {
            taken.push(it.name);
            total += it.value;
            left -= it.weight;
        }
    }

    println!("greedy, best ratio first, whole items only:");
    println!("  took {} = {}, with {} kg of the bag empty", taken.join(" + "), total, left);
    println!();

    println!("every subset, checked by hand:");
    println!("  {:<22} {:>6} {:>6}  fits?", "subset", "weight", "value");
    let mut best_value = 0;
    let mut best_names: Vec<&str> = Vec::new();
    for mask in 0..(1 << items.len()) {
        let chosen: Vec<&Item> = items.iter().enumerate()
            .filter(|(i, _)| mask >> i & 1 == 1)
            .map(|(_, it)| it)
            .collect();
        let weight: i32 = chosen.iter().map(|it| it.weight).sum();
        let value: i32 = chosen.iter().map(|it| it.value).sum();
        let names: Vec<&str> = chosen.iter().map(|it| it.name).collect();
        let label = if names.is_empty() { "(nothing)".to_string() } else { names.join(" + ") };
        let fits = weight <= capacity;
        if fits && value > best_value {
            best_value = value;
            best_names = names;
        }
        println!("  {:<22} {:>6} {:>6}  {}", label, weight, value, if fits { "yes" } else { "no" });
    }

    println!();
    println!("best possible: {} = {}", best_names.join(" + "), best_value);
    println!("greedy found:  {} = {}", taken.join(" + "), total);
    println!("greedy is short by {}", best_value - total);
    println!();
    println!("the ratio rule took copper first because 6.00 beat everything,");
    println!("and that one irrevocable choice left a 30 kg gold bar that no longer fit");
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

type item struct {
	name   string
	value  int
	weight int
}

func main() {
	items := []item{{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}}
	capacity := 50

	// Same items, same capacity. The only change: an item is taken whole or not at all.
	order := append([]item(nil), items...)
	sort.SliceStable(order, func(a, b int) bool {
		return float64(order[a].value)/float64(order[a].weight) >
			float64(order[b].value)/float64(order[b].weight)
	})

	var taken []string
	total, left := 0, capacity
	for _, it := range order {
		if it.weight <= left {
			taken = append(taken, it.name)
			total += it.value
			left -= it.weight
		}
	}

	fmt.Println("greedy, best ratio first, whole items only:")
	fmt.Printf("  took %s = %d, with %d kg of the bag empty\\n", strings.Join(taken, " + "), total, left)
	fmt.Println()

	fmt.Println("every subset, checked by hand:")
	fmt.Printf("  %-22s %6s %6s  fits?\\n", "subset", "weight", "value")
	bestValue := 0
	var bestNames []string
	for mask := 0; mask < 1<<len(items); mask++ {
		var chosen []string
		weight, value := 0, 0
		for i, it := range items {
			if mask>>i&1 == 1 {
				chosen = append(chosen, it.name)
				weight += it.weight
				value += it.value
			}
		}
		label := "(nothing)"
		if len(chosen) > 0 {
			label = strings.Join(chosen, " + ")
		}
		fits := weight <= capacity
		if fits && value > bestValue {
			bestValue = value
			bestNames = chosen
		}
		verdict := "no"
		if fits {
			verdict = "yes"
		}
		fmt.Printf("  %-22s %6d %6d  %s\\n", label, weight, value, verdict)
	}

	fmt.Println()
	fmt.Printf("best possible: %s = %d\\n", strings.Join(bestNames, " + "), bestValue)
	fmt.Printf("greedy found:  %s = %d\\n", strings.Join(taken, " + "), total)
	fmt.Printf("greedy is short by %d\\n", bestValue-total)
	fmt.Println()
	fmt.Println("the ratio rule took copper first because 6.00 beat everything,")
	fmt.Println("and that one irrevocable choice left a 30 kg gold bar that no longer fit")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "which-precondition-failed",
      heading: "Which of the two properties actually failed",
      body: [
        "Greedy needs two things to be true, and they are usually named together in a way that makes them sound like one idea. They are not, and knowing which one broke tells you what to do next.",
        "**Optimal substructure** is the claim that an optimal solution to the whole problem contains optimal solutions to its subproblems. Take the best 50 kg packing, remove one item along with the room it occupied, and what remains should be the best packing of the room that is left. If that fails, the problem cannot be decomposed at all, and neither greedy nor dynamic programming will help.",
        "**The greedy choice property** is the claim that the move your rule ranks first is contained in at least one optimal solution. Not that it is in every optimal solution, and not that it is obviously good — only that committing to it costs you nothing. This is the property that fails in the bar version, and it fails on the very first move.",
        "The distinction is what decides the technique. When substructure holds and the greedy choice property does not, the problem is a dynamic programming problem: you still solve it in pieces, but you must keep every promising option alive instead of committing to one. That is precisely the trade the last lesson of this module makes explicit.",
      ],
      examples: [
        {
          id: "which-precondition-failed",
          title: "Substructure held; the first move did not",
          lang: "python",
          code: `items = [("copper", 60, 10), ("silver", 100, 20), ("gold", 120, 30)]
capacity = 50


def best(pool, room):
    """The true optimum, by trying every subset of pool that fits in room."""
    top = 0
    for mask in range(1 << len(pool)):
        chosen = [pool[i] for i in range(len(pool)) if mask >> i & 1]
        if sum(it[2] for it in chosen) <= room:
            top = max(top, sum(it[1] for it in chosen))
    return top


print("optimal substructure: does the best answer contain best answers?")
print(f"  best(all three, {capacity} kg) = {best(items, capacity):>3}   [silver + gold]")
print("  drop gold from that solution and 20 kg of room with it:")
print(f"  best(all three, 20 kg) = {best(items, 20):>3}   [silver]")
print("  the remainder is itself optimal for the room it uses — substructure holds")
print()

print("greedy choice property: is the locally best first move in some optimum?")
print(f"  {'first move':<20} {'value now':>9} {'room left':>9} {'best after':>10} {'total':>6}")
for name, value, weight in items:
    rest = [it for it in items if it[0] != name]
    after = best(rest, capacity - weight)
    print(f"  take {name:<15} {value:>9} {capacity - weight:>9} {after:>10} {value + after:>6}")

print()
print("greedy picks copper first, on ratio 6.00 — the best ratio available.")
print("that single choice caps the bag at 180, and no later decision can undo it.")
print("silver first reaches 220. the rule is not merely unlucky here; it is wrong.")
print()
print("substructure held and greedy still failed, so substructure is not the")
print("property that was missing. what failed is the first move.")`,
          output: `optimal substructure: does the best answer contain best answers?
  best(all three, 50 kg) = 220   [silver + gold]
  drop gold from that solution and 20 kg of room with it:
  best(all three, 20 kg) = 100   [silver]
  the remainder is itself optimal for the room it uses — substructure holds

greedy choice property: is the locally best first move in some optimum?
  first move           value now room left best after  total
  take copper                 60        40        120    180
  take silver                100        30        120    220
  take gold                  120        20        100    220

greedy picks copper first, on ratio 6.00 — the best ratio available.
that single choice caps the bag at 180, and no later decision can undo it.
silver first reaches 220. the rule is not merely unlucky here; it is wrong.

substructure held and greedy still failed, so substructure is not the
property that was missing. what failed is the first move.`,
          explanation:
            "The two preconditions are worth separating because only one of them broke. **Optimal substructure** says an optimal solution is built out of optimal solutions to smaller versions of the problem, and the first block shows it holding: strip gold and its 20 kg out of the best 50 kg answer and what is left is the best 20 kg answer. **The greedy choice property** says the locally best move is in *some* optimal solution, and the second block shows it failing: committing to copper caps the bag at 180 no matter what follows, while silver or gold both reach 220. Substructure is what lets you solve the problem in pieces at all — it is why dynamic programming works here. The greedy choice property is the extra thing greedy needs, and it is the one you have to earn.",
          alternates: [
            {
              lang: "javascript",
              code: `const items = [
  { name: "copper", value: 60, weight: 10 },
  { name: "silver", value: 100, weight: 20 },
  { name: "gold", value: 120, weight: 30 },
];
const capacity = 50;

/** The true optimum, by trying every subset of pool that fits in room. */
function best(pool, room) {
  let top = 0;
  for (let mask = 0; mask < 1 << pool.length; mask++) {
    const chosen = pool.filter((_, i) => (mask >> i) & 1);
    if (chosen.reduce((s, it) => s + it.weight, 0) <= room) {
      top = Math.max(top, chosen.reduce((s, it) => s + it.value, 0));
    }
  }
  return top;
}

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

console.log("optimal substructure: does the best answer contain best answers?");
console.log(\`  best(all three, \${capacity} kg) = \${padL(best(items, capacity), 3)}   [silver + gold]\`);
console.log("  drop gold from that solution and 20 kg of room with it:");
console.log(\`  best(all three, 20 kg) = \${padL(best(items, 20), 3)}   [silver]\`);
console.log("  the remainder is itself optimal for the room it uses — substructure holds");
console.log();

console.log("greedy choice property: is the locally best first move in some optimum?");
console.log(\`  \${padR("first move", 20)} \${padL("value now", 9)} \${padL("room left", 9)} \${padL("best after", 10)} \${padL("total", 6)}\`);
for (const { name, value, weight } of items) {
  const rest = items.filter((it) => it.name !== name);
  const after = best(rest, capacity - weight);
  console.log(\`  take \${padR(name, 15)} \${padL(value, 9)} \${padL(capacity - weight, 9)} \${padL(after, 10)} \${padL(value + after, 6)}\`);
}

console.log();
console.log("greedy picks copper first, on ratio 6.00 — the best ratio available.");
console.log("that single choice caps the bag at 180, and no later decision can undo it.");
console.log("silver first reaches 220. the rule is not merely unlucky here; it is wrong.");
console.log();
console.log("substructure held and greedy still failed, so substructure is not the");
console.log("property that was missing. what failed is the first move.");`,
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
const capacity = 50;

/** The true optimum, by trying every subset of pool that fits in room. */
function best(pool: Item[], room: number): number {
  let top = 0;
  for (let mask = 0; mask < 1 << pool.length; mask++) {
    const chosen = pool.filter((_, i) => (mask >> i) & 1);
    if (chosen.reduce((s, it) => s + it.weight, 0) <= room) {
      top = Math.max(top, chosen.reduce((s, it) => s + it.value, 0));
    }
  }
  return top;
}

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

console.log("optimal substructure: does the best answer contain best answers?");
console.log(\`  best(all three, \${capacity} kg) = \${padL(best(items, capacity), 3)}   [silver + gold]\`);
console.log("  drop gold from that solution and 20 kg of room with it:");
console.log(\`  best(all three, 20 kg) = \${padL(best(items, 20), 3)}   [silver]\`);
console.log("  the remainder is itself optimal for the room it uses — substructure holds");
console.log();

console.log("greedy choice property: is the locally best first move in some optimum?");
console.log(\`  \${padR("first move", 20)} \${padL("value now", 9)} \${padL("room left", 9)} \${padL("best after", 10)} \${padL("total", 6)}\`);
for (const { name, value, weight } of items) {
  const rest = items.filter((it) => it.name !== name);
  const after = best(rest, capacity - weight);
  console.log(\`  take \${padR(name, 15)} \${padL(value, 9)} \${padL(capacity - weight, 9)} \${padL(after, 10)} \${padL(value + after, 6)}\`);
}

console.log();
console.log("greedy picks copper first, on ratio 6.00 — the best ratio available.");
console.log("that single choice caps the bag at 180, and no later decision can undo it.");
console.log("silver first reaches 220. the rule is not merely unlucky here; it is wrong.");
console.log();
console.log("substructure held and greedy still failed, so substructure is not the");
console.log("property that was missing. what failed is the first move.");`,
            },
            {
              lang: "java",
              code: `public class Main {
    static final String[] NAMES = {"copper", "silver", "gold"};
    static final int[] VALUES = {60, 100, 120};
    static final int[] WEIGHTS = {10, 20, 30};

    /** The true optimum, by trying every subset of pool that fits in room. */
    static int best(int pool, int room) {
        int top = 0;
        for (int mask = 0; mask < 1 << NAMES.length; mask++) {
            if ((mask & ~pool) != 0) continue;
            int weight = 0;
            int value = 0;
            for (int i = 0; i < NAMES.length; i++) {
                if ((mask >> i & 1) == 1) {
                    weight += WEIGHTS[i];
                    value += VALUES[i];
                }
            }
            if (weight <= room) top = Math.max(top, value);
        }
        return top;
    }

    public static void main(String[] args) {
        int capacity = 50;
        int all = (1 << NAMES.length) - 1;

        System.out.println("optimal substructure: does the best answer contain best answers?");
        System.out.printf("  best(all three, %d kg) = %3d   [silver + gold]%n", capacity, best(all, capacity));
        System.out.println("  drop gold from that solution and 20 kg of room with it:");
        System.out.printf("  best(all three, 20 kg) = %3d   [silver]%n", best(all, 20));
        System.out.println("  the remainder is itself optimal for the room it uses — substructure holds");
        System.out.println();

        System.out.println("greedy choice property: is the locally best first move in some optimum?");
        System.out.printf("  %-20s %9s %9s %10s %6s%n",
                "first move", "value now", "room left", "best after", "total");
        for (int i = 0; i < NAMES.length; i++) {
            int after = best(all & ~(1 << i), capacity - WEIGHTS[i]);
            System.out.printf("  take %-15s %9d %9d %10d %6d%n",
                    NAMES[i], VALUES[i], capacity - WEIGHTS[i], after, VALUES[i] + after);
        }

        System.out.println();
        System.out.println("greedy picks copper first, on ratio 6.00 — the best ratio available.");
        System.out.println("that single choice caps the bag at 180, and no later decision can undo it.");
        System.out.println("silver first reaches 220. the rule is not merely unlucky here; it is wrong.");
        System.out.println();
        System.out.println("substructure held and greedy still failed, so substructure is not the");
        System.out.println("property that was missing. what failed is the first move.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int value;
    int weight;
};

/** The true optimum, by trying every subset of pool that fits in room. */
int best(const std::vector<Item>& pool, int room) {
    int top = 0;
    for (int mask = 0; mask < 1 << static_cast<int>(pool.size()); mask++) {
        int weight = 0;
        int value = 0;
        for (std::size_t i = 0; i < pool.size(); i++) {
            if (mask >> i & 1) {
                weight += pool[i].weight;
                value += pool[i].value;
            }
        }
        if (weight <= room) top = std::max(top, value);
    }
    return top;
}

int main() {
    std::vector<Item> items = {{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}};
    const int capacity = 50;

    std::cout << "optimal substructure: does the best answer contain best answers?\\n";
    std::cout << "  best(all three, " << capacity << " kg) = " << std::setw(3)
              << best(items, capacity) << "   [silver + gold]\\n";
    std::cout << "  drop gold from that solution and 20 kg of room with it:\\n";
    std::cout << "  best(all three, 20 kg) = " << std::setw(3) << best(items, 20) << "   [silver]\\n";
    std::cout << "  the remainder is itself optimal for the room it uses — substructure holds\\n\\n";

    std::cout << "greedy choice property: is the locally best first move in some optimum?\\n";
    std::cout << "  " << std::left << std::setw(20) << "first move" << std::right << ' '
              << std::setw(9) << "value now" << ' ' << std::setw(9) << "room left" << ' '
              << std::setw(10) << "best after" << ' ' << std::setw(6) << "total" << '\\n';
    for (const Item& it : items) {
        std::vector<Item> rest;
        for (const Item& other : items) {
            if (other.name != it.name) rest.push_back(other);
        }
        int after = best(rest, capacity - it.weight);
        std::cout << "  take " << std::left << std::setw(15) << it.name << std::right << ' '
                  << std::setw(9) << it.value << ' ' << std::setw(9) << capacity - it.weight << ' '
                  << std::setw(10) << after << ' ' << std::setw(6) << it.value + after << '\\n';
    }

    std::cout << '\\n';
    std::cout << "greedy picks copper first, on ratio 6.00 — the best ratio available.\\n";
    std::cout << "that single choice caps the bag at 180, and no later decision can undo it.\\n";
    std::cout << "silver first reaches 220. the rule is not merely unlucky here; it is wrong.\\n\\n";
    std::cout << "substructure held and greedy still failed, so substructure is not the\\n";
    std::cout << "property that was missing. what failed is the first move.\\n";
}`,
            },
            {
              lang: "rust",
              code: `struct Item {
    name: &'static str,
    value: i32,
    weight: i32,
}

/// The true optimum, by trying every subset of pool that fits in room.
fn best(pool: &[&Item], room: i32) -> i32 {
    let mut top = 0;
    for mask in 0..(1 << pool.len()) {
        let mut weight = 0;
        let mut value = 0;
        for (i, it) in pool.iter().enumerate() {
            if mask >> i & 1 == 1 {
                weight += it.weight;
                value += it.value;
            }
        }
        if weight <= room {
            top = top.max(value);
        }
    }
    top
}

fn main() {
    let items = vec![
        Item { name: "copper", value: 60, weight: 10 },
        Item { name: "silver", value: 100, weight: 20 },
        Item { name: "gold", value: 120, weight: 30 },
    ];
    let capacity = 50;
    let all: Vec<&Item> = items.iter().collect();

    println!("optimal substructure: does the best answer contain best answers?");
    println!("  best(all three, {} kg) = {:>3}   [silver + gold]", capacity, best(&all, capacity));
    println!("  drop gold from that solution and 20 kg of room with it:");
    println!("  best(all three, 20 kg) = {:>3}   [silver]", best(&all, 20));
    println!("  the remainder is itself optimal for the room it uses — substructure holds");
    println!();

    println!("greedy choice property: is the locally best first move in some optimum?");
    println!("  {:<20} {:>9} {:>9} {:>10} {:>6}",
             "first move", "value now", "room left", "best after", "total");
    for it in &items {
        let rest: Vec<&Item> = items.iter().filter(|o| o.name != it.name).collect();
        let after = best(&rest, capacity - it.weight);
        println!("  take {:<15} {:>9} {:>9} {:>10} {:>6}",
                 it.name, it.value, capacity - it.weight, after, it.value + after);
    }

    println!();
    println!("greedy picks copper first, on ratio 6.00 — the best ratio available.");
    println!("that single choice caps the bag at 180, and no later decision can undo it.");
    println!("silver first reaches 220. the rule is not merely unlucky here; it is wrong.");
    println!();
    println!("substructure held and greedy still failed, so substructure is not the");
    println!("property that was missing. what failed is the first move.");
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

type item struct {
	name   string
	value  int
	weight int
}

// best is the true optimum, by trying every subset of pool that fits in room.
func best(pool []item, room int) int {
	top := 0
	for mask := 0; mask < 1<<len(pool); mask++ {
		weight, value := 0, 0
		for i, it := range pool {
			if mask>>i&1 == 1 {
				weight += it.weight
				value += it.value
			}
		}
		if weight <= room && value > top {
			top = value
		}
	}
	return top
}

func main() {
	items := []item{{"copper", 60, 10}, {"silver", 100, 20}, {"gold", 120, 30}}
	capacity := 50

	fmt.Println("optimal substructure: does the best answer contain best answers?")
	fmt.Printf("  best(all three, %d kg) = %3d   [silver + gold]\\n", capacity, best(items, capacity))
	fmt.Println("  drop gold from that solution and 20 kg of room with it:")
	fmt.Printf("  best(all three, 20 kg) = %3d   [silver]\\n", best(items, 20))
	fmt.Println("  the remainder is itself optimal for the room it uses — substructure holds")
	fmt.Println()

	fmt.Println("greedy choice property: is the locally best first move in some optimum?")
	fmt.Printf("  %-20s %9s %9s %10s %6s\\n",
		"first move", "value now", "room left", "best after", "total")
	for _, it := range items {
		var rest []item
		for _, other := range items {
			if other.name != it.name {
				rest = append(rest, other)
			}
		}
		after := best(rest, capacity-it.weight)
		fmt.Printf("  take %-15s %9d %9d %10d %6d\\n",
			it.name, it.value, capacity-it.weight, after, it.value+after)
	}

	fmt.Println()
	fmt.Println("greedy picks copper first, on ratio 6.00 — the best ratio available.")
	fmt.Println("that single choice caps the bag at 180, and no later decision can undo it.")
	fmt.Println("silver first reaches 220. the rule is not merely unlucky here; it is wrong.")
	fmt.Println()
	fmt.Println("substructure held and greedy still failed, so substructure is not the")
	fmt.Println("property that was missing. what failed is the first move.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the two conditions a greedy algorithm needs, and which one is usually the problem?",
      answer:
        "Optimal substructure, meaning an optimal solution is built from optimal solutions to subproblems, and the greedy choice property, meaning the locally best move is contained in some optimal solution. Substructure is the weaker requirement and holds for most problems worth asking about — it is also what dynamic programming needs, which is why the two techniques apply to overlapping sets of problems. The greedy choice property is the one that fails. Saying only \"it takes the local optimum and hopes for the best\" is the answer of somebody who has not had to prove one correct.",
    },
    {
      question: "Fractional knapsack is greedy and 0/1 knapsack is not. What exactly changes?",
      answer:
        "Divisibility, and nothing else. When an item can be cut, the last thing you take can be a fraction, so the bag always ends exactly full and the value-per-kilogram rule is provably optimal: any packing that uses a worse ratio anywhere can be improved by swapping in some of a better one. Once items are indivisible that swap is unavailable — you cannot take three-fifths of a gold bar to fill the gap — so the best ratio can leave a hole that no remaining item fits. The greedy choice property depends on being able to make that exchange, and indivisibility is what removes it.",
    },
    {
      question: "You have a greedy rule that passes every test you can think of. Is that enough?",
      answer:
        "No, and this is the honest answer rather than the cautious one. Greedy failures are not distributed like ordinary bugs; they cluster on instances where a locally attractive choice blocks a better structure later, and those are exactly the instances a handful of hand-written tests miss. The two things that do give confidence are a proof — usually an exchange argument, showing any optimal solution can be rewritten to start with your choice — and an exhaustive comparison against brute force over all small inputs. If neither is available and correctness matters, use dynamic programming, which does not need the property at all.",
    },
  ],
  takeaways: [
    "A greedy algorithm is one ranking rule, applied to the best remaining option, never revisited. That shape is the definition.",
    "The cost is almost always the sort: O(n log n), with a loop that is linear and short.",
    "Greedy needs optimal substructure and the greedy choice property. The second is the one that fails.",
    "Optimal substructure failing means the problem cannot be decomposed. The greedy choice property failing means it can, but not by committing.",
    "Fractional knapsack is greedy-optimal and 0/1 knapsack is not, on the same numbers. Divisibility is the whole difference.",
    "A greedy rule that fails is not buggy. It is correct code for a problem that does not have the property it assumes.",
  ],
  status: "available",
};
