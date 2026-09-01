import type { Lesson } from "@/content/types";

export const mergingIntervalsLesson: Lesson = {
  id: "dsa-greedy-merging",
  slug: "merging-intervals-and-the-family-around-it",
  moduleSlug: "greedy-algorithms",
  title: "Merging Intervals, and the Family Around It",
  summary:
    "Four interview questions that are one sorted pass with one piece of state. Once you can see why sorting by start makes a closed range final, the whole family collapses into the same short loop.",
  estimatedMinutes: 30,
  objectives: [
    "Merge overlapping intervals in one pass, and say why one open range is enough state",
    "Insert into an already-merged list without re-sorting it",
    "Intersect two sorted lists with two pointers, advancing the one that ends first",
    "Recognise the family by its precondition rather than by its wording",
  ],
  sections: [
    {
      id: "merge-overlapping",
      heading: "Sort by start, then hold one open range",
      body: [
        "The previous lesson sorted by finishing time because it was choosing which intervals to keep. This one sorts by starting time, and the difference is not arbitrary: nothing is being rejected here, so the question is no longer what a choice leaves behind but which intervals are adjacent in time.",
        "Sorting by start buys a specific guarantee, and the whole family rests on it. Walk the list in that order holding one range open, and any interval you meet either starts after the open range ends — in which case the open range is *final*, because every later start is later still — or it overlaps, in which case the open range stretches. Nothing already emitted ever needs revisiting.",
        "That is what makes the state a single range rather than a list to search. The cost is the sort, O(n log n), and the pass is O(n).",
      ],
      visual: {
        id: "greedy-merge",
        kind: "greedy",
        algorithm: "merge",
        title: "Merging overlapping intervals",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "merge-overlapping",
          title: "Sort by start, hold one open range",
          lang: "python",
          code: `ranges = [("p", 1, 4), ("q", 2, 6), ("r", 8, 10), ("s", 9, 12), ("t", 15, 18)]

# Sorting by start is the algorithm. Once starts are in order, an overlap can
# only ever be with the range currently open — never with one already closed.
order = sorted(ranges, key=lambda r: r[1])
print(f"sorted by start: {', '.join(f'{n} {a}-{b}' for n, a, b in order)}")
print()

merged = []
for name, start, end in order:
    if merged and start <= merged[-1][1]:
        was = merged[-1][1]
        merged[-1][1] = max(merged[-1][1], end)
        if merged[-1][1] == was:
            print(f"  {name} {start}-{end}: inside the open range, swallowed whole")
        else:
            print(f"  {name} {start}-{end}: overlaps, open range stretches {was} -> {merged[-1][1]}")
    else:
        merged.append([start, end])
        print(f"  {name} {start}-{end}: nothing to merge with, opens range {len(merged)}")

print()
print(f"merged: {', '.join(f'{a}-{b}' for a, b in merged)}")
print(f"{len(ranges)} ranges became {len(merged)}, in one pass after the sort")
print()

# Why one open range is enough, checked rather than claimed.
print("the claim: once a range is final, no later interval can reopen it.")
print(f"  {'interval':<11} {'starts':>6}  {'ranges already final':<22} {'latest end':>10}  reopens one?")
for name, start, end in order:
    final = [m for m in merged if m[1] < start]
    shown = ", ".join(f"{a}-{b}" for a, b in final) or "(none yet)"
    latest = max((b for _, b in final), default=None)
    verdict = "no" if latest is None or start > latest else "YES"
    label = f"{name} {start}-{end}"
    print(f"  {label:<11} {start:>6}  {shown:<22} {str(latest) if latest else '-':>10}  {verdict}")

print()
print("every answer is no, and it has to be: a range becomes final exactly when")
print("a start passes its end, and starts only increase from there. that is why")
print("one open range is enough and the pass is O(n) — the sort is the whole cost.")`,
          output: `sorted by start: p 1-4, q 2-6, r 8-10, s 9-12, t 15-18

  p 1-4: nothing to merge with, opens range 1
  q 2-6: overlaps, open range stretches 4 -> 6
  r 8-10: nothing to merge with, opens range 2
  s 9-12: overlaps, open range stretches 10 -> 12
  t 15-18: nothing to merge with, opens range 3

merged: 1-6, 8-12, 15-18
5 ranges became 3, in one pass after the sort

the claim: once a range is final, no later interval can reopen it.
  interval    starts  ranges already final   latest end  reopens one?
  p 1-4            1  (none yet)                      -  no
  q 2-6            2  (none yet)                      -  no
  r 8-10           8  1-6                             6  no
  s 9-12           9  1-6                             6  no
  t 15-18         15  1-6, 8-12                      12  no

every answer is no, and it has to be: a range becomes final exactly when
a start passes its end, and starts only increase from there. that is why
one open range is enough and the pass is O(n) — the sort is the whole cost.`,
          explanation:
            "Two things carry the algorithm and both come from the sort. Because starts only increase, a new interval can only ever overlap the range currently open — so one variable is enough state, and there is no search. And because a range is closed exactly when a start passes its end, a closed range can never be reopened, which the table checks against every interval rather than asserting. Note the two ways an overlap resolves: `q` stretches the open range, while an interval wholly inside one changes nothing. Both are the same line of code, `max`, which is why the case that looks special needs no branch.",
          alternates: [
            {
              lang: "javascript",
              code: `const ranges = [
  ["p", 1, 4], ["q", 2, 6], ["r", 8, 10], ["s", 9, 12], ["t", 15, 18],
];

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Sorting by start is the algorithm. Once starts are in order, an overlap can
// only ever be with the range currently open — never with one already closed.
const order = [...ranges].sort((a, b) => a[1] - b[1]);
console.log(\`sorted by start: \${order.map(([n, a, b]) => \`\${n} \${a}-\${b}\`).join(", ")}\`);
console.log();

const merged = [];
for (const [name, start, end] of order) {
  const open = merged[merged.length - 1];
  if (open && start <= open[1]) {
    const was = open[1];
    open[1] = Math.max(open[1], end);
    if (open[1] === was) {
      console.log(\`  \${name} \${start}-\${end}: inside the open range, swallowed whole\`);
    } else {
      console.log(\`  \${name} \${start}-\${end}: overlaps, open range stretches \${was} -> \${open[1]}\`);
    }
  } else {
    merged.push([start, end]);
    console.log(\`  \${name} \${start}-\${end}: nothing to merge with, opens range \${merged.length}\`);
  }
}

console.log();
console.log(\`merged: \${merged.map(([a, b]) => \`\${a}-\${b}\`).join(", ")}\`);
console.log(\`\${ranges.length} ranges became \${merged.length}, in one pass after the sort\`);
console.log();

// Why one open range is enough, checked rather than claimed.
console.log("the claim: once a range is final, no later interval can reopen it.");
console.log(\`  \${padR("interval", 11)} \${padL("starts", 6)}  \${padR("ranges already final", 22)} \${padL("latest end", 10)}  reopens one?\`);
for (const [name, start, end] of order) {
  const final = merged.filter(([, b]) => b < start);
  const shown = final.map(([a, b]) => \`\${a}-\${b}\`).join(", ") || "(none yet)";
  const latest = final.length ? Math.max(...final.map(([, b]) => b)) : null;
  const verdict = latest === null || start > latest ? "no" : "YES";
  const label = \`\${name} \${start}-\${end}\`;
  console.log(\`  \${padR(label, 11)} \${padL(start, 6)}  \${padR(shown, 22)} \${padL(latest ?? "-", 10)}  \${verdict}\`);
}

console.log();
console.log("every answer is no, and it has to be: a range becomes final exactly when");
console.log("a start passes its end, and starts only increase from there. that is why");
console.log("one open range is enough and the pass is O(n) — the sort is the whole cost.");`,
            },
            {
              lang: "typescript",
              code: `type Range = [string, number, number];

const ranges: Range[] = [
  ["p", 1, 4], ["q", 2, 6], ["r", 8, 10], ["s", 9, 12], ["t", 15, 18],
];

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Sorting by start is the algorithm. Once starts are in order, an overlap can
// only ever be with the range currently open — never with one already closed.
const order = [...ranges].sort((a, b) => a[1] - b[1]);
console.log(\`sorted by start: \${order.map(([n, a, b]) => \`\${n} \${a}-\${b}\`).join(", ")}\`);
console.log();

const merged: [number, number][] = [];
for (const [name, start, end] of order) {
  const open = merged[merged.length - 1];
  if (open && start <= open[1]) {
    const was = open[1];
    open[1] = Math.max(open[1], end);
    if (open[1] === was) {
      console.log(\`  \${name} \${start}-\${end}: inside the open range, swallowed whole\`);
    } else {
      console.log(\`  \${name} \${start}-\${end}: overlaps, open range stretches \${was} -> \${open[1]}\`);
    }
  } else {
    merged.push([start, end]);
    console.log(\`  \${name} \${start}-\${end}: nothing to merge with, opens range \${merged.length}\`);
  }
}

console.log();
console.log(\`merged: \${merged.map(([a, b]) => \`\${a}-\${b}\`).join(", ")}\`);
console.log(\`\${ranges.length} ranges became \${merged.length}, in one pass after the sort\`);
console.log();

// Why one open range is enough, checked rather than claimed.
console.log("the claim: once a range is final, no later interval can reopen it.");
console.log(\`  \${padR("interval", 11)} \${padL("starts", 6)}  \${padR("ranges already final", 22)} \${padL("latest end", 10)}  reopens one?\`);
for (const [name, start, end] of order) {
  const final = merged.filter(([, b]) => b < start);
  const shown = final.map(([a, b]) => \`\${a}-\${b}\`).join(", ") || "(none yet)";
  const latest = final.length ? Math.max(...final.map(([, b]) => b)) : null;
  const verdict = latest === null || start > latest ? "no" : "YES";
  const label = \`\${name} \${start}-\${end}\`;
  console.log(\`  \${padR(label, 11)} \${padL(start, 6)}  \${padR(shown, 22)} \${padL(latest ?? "-", 10)}  \${verdict}\`);
}

console.log();
console.log("every answer is no, and it has to be: a range becomes final exactly when");
console.log("a start passes its end, and starts only increase from there. that is why");
console.log("one open range is enough and the pass is O(n) — the sort is the whole cost.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    record Range(String name, int start, int end) {}

    public static void main(String[] args) {
        List<Range> ranges = List.of(
                new Range("p", 1, 4), new Range("q", 2, 6), new Range("r", 8, 10),
                new Range("s", 9, 12), new Range("t", 15, 18));

        // Sorting by start is the algorithm. Once starts are in order, an overlap can
        // only ever be with the range currently open — never with one already closed.
        List<Range> order = new ArrayList<>(ranges);
        order.sort(Comparator.comparingInt(Range::start));
        List<String> shownOrder = new ArrayList<>();
        for (Range r : order) shownOrder.add(r.name() + " " + r.start() + "-" + r.end());
        System.out.println("sorted by start: " + String.join(", ", shownOrder));
        System.out.println();

        List<int[]> merged = new ArrayList<>();
        for (Range r : order) {
            int[] open = merged.isEmpty() ? null : merged.get(merged.size() - 1);
            if (open != null && r.start() <= open[1]) {
                int was = open[1];
                open[1] = Math.max(open[1], r.end());
                if (open[1] == was) {
                    System.out.println("  " + r.name() + " " + r.start() + "-" + r.end()
                            + ": inside the open range, swallowed whole");
                } else {
                    System.out.println("  " + r.name() + " " + r.start() + "-" + r.end()
                            + ": overlaps, open range stretches " + was + " -> " + open[1]);
                }
            } else {
                merged.add(new int[] {r.start(), r.end()});
                System.out.println("  " + r.name() + " " + r.start() + "-" + r.end()
                        + ": nothing to merge with, opens range " + merged.size());
            }
        }

        List<String> shownMerged = new ArrayList<>();
        for (int[] m : merged) shownMerged.add(m[0] + "-" + m[1]);
        System.out.println();
        System.out.println("merged: " + String.join(", ", shownMerged));
        System.out.println(ranges.size() + " ranges became " + merged.size()
                + ", in one pass after the sort");
        System.out.println();

        // Why one open range is enough, checked rather than claimed.
        System.out.println("the claim: once a range is final, no later interval can reopen it.");
        System.out.printf("  %-11s %6s  %-22s %10s  reopens one?%n",
                "interval", "starts", "ranges already final", "latest end");
        for (Range r : order) {
            List<String> parts = new ArrayList<>();
            Integer latest = null;
            for (int[] m : merged) {
                if (m[1] < r.start()) {
                    parts.add(m[0] + "-" + m[1]);
                    latest = latest == null ? m[1] : Math.max(latest, m[1]);
                }
            }
            String shown = parts.isEmpty() ? "(none yet)" : String.join(", ", parts);
            String verdict = latest == null || r.start() > latest ? "no" : "YES";
            String label = r.name() + " " + r.start() + "-" + r.end();
            System.out.printf("  %-11s %6d  %-22s %10s  %s%n",
                    label, r.start(), shown, latest == null ? "-" : latest.toString(), verdict);
        }

        System.out.println();
        System.out.println("every answer is no, and it has to be: a range becomes final exactly when");
        System.out.println("a start passes its end, and starts only increase from there. that is why");
        System.out.println("one open range is enough and the pass is O(n) — the sort is the whole cost.");
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

struct Range {
    std::string name;
    int start, end;
};

std::string join(const std::vector<std::string>& parts, const std::string& sep) {
    std::string out;
    for (std::size_t i = 0; i < parts.size(); i++) out += (i ? sep : "") + parts[i];
    return out;
}

int main() {
    std::vector<Range> ranges = {
        {"p", 1, 4}, {"q", 2, 6}, {"r", 8, 10}, {"s", 9, 12}, {"t", 15, 18},
    };

    // Sorting by start is the algorithm. Once starts are in order, an overlap can
    // only ever be with the range currently open — never with one already closed.
    std::vector<Range> order = ranges;
    std::stable_sort(order.begin(), order.end(),
                     [](const Range& a, const Range& b) { return a.start < b.start; });
    std::vector<std::string> shownOrder;
    for (const Range& r : order) {
        shownOrder.push_back(r.name + " " + std::to_string(r.start) + "-" + std::to_string(r.end));
    }
    std::cout << "sorted by start: " << join(shownOrder, ", ") << "\\n\\n";

    std::vector<std::pair<int, int>> merged;
    for (const Range& r : order) {
        if (!merged.empty() && r.start <= merged.back().second) {
            int was = merged.back().second;
            merged.back().second = std::max(merged.back().second, r.end);
            if (merged.back().second == was) {
                std::cout << "  " << r.name << " " << r.start << "-" << r.end
                          << ": inside the open range, swallowed whole\\n";
            } else {
                std::cout << "  " << r.name << " " << r.start << "-" << r.end
                          << ": overlaps, open range stretches " << was << " -> "
                          << merged.back().second << '\\n';
            }
        } else {
            merged.push_back({r.start, r.end});
            std::cout << "  " << r.name << " " << r.start << "-" << r.end
                      << ": nothing to merge with, opens range " << merged.size() << '\\n';
        }
    }

    std::vector<std::string> shownMerged;
    for (const auto& m : merged) {
        shownMerged.push_back(std::to_string(m.first) + "-" + std::to_string(m.second));
    }
    std::cout << "\\nmerged: " << join(shownMerged, ", ") << '\\n';
    std::cout << ranges.size() << " ranges became " << merged.size()
              << ", in one pass after the sort\\n\\n";

    // Why one open range is enough, checked rather than claimed.
    std::cout << "the claim: once a range is final, no later interval can reopen it.\\n";
    std::cout << "  " << std::left << std::setw(11) << "interval" << std::right << ' '
              << std::setw(6) << "starts" << "  " << std::left << std::setw(22)
              << "ranges already final" << std::right << ' ' << std::setw(10) << "latest end"
              << "  reopens one?\\n";
    for (const Range& r : order) {
        std::vector<std::string> parts;
        std::optional<int> latest;
        for (const auto& m : merged) {
            if (m.second < r.start) {
                parts.push_back(std::to_string(m.first) + "-" + std::to_string(m.second));
                latest = latest ? std::max(*latest, m.second) : m.second;
            }
        }
        std::string shown = parts.empty() ? "(none yet)" : join(parts, ", ");
        std::string verdict = (!latest || r.start > *latest) ? "no" : "YES";
        std::string label = r.name + " " + std::to_string(r.start) + "-" + std::to_string(r.end);
        std::cout << "  " << std::left << std::setw(11) << label << std::right << ' '
                  << std::setw(6) << r.start << "  " << std::left << std::setw(22) << shown
                  << std::right << ' ' << std::setw(10)
                  << (latest ? std::to_string(*latest) : "-") << "  " << verdict << '\\n';
    }

    std::cout << "\\nevery answer is no, and it has to be: a range becomes final exactly when\\n";
    std::cout << "a start passes its end, and starts only increase from there. that is why\\n";
    std::cout << "one open range is enough and the pass is O(n) — the sort is the whole cost.\\n";
}`,
            },
            {
              lang: "rust",
              code: `struct Range {
    name: &'static str,
    start: i32,
    end: i32,
}

fn main() {
    let ranges = vec![
        Range { name: "p", start: 1, end: 4 },
        Range { name: "q", start: 2, end: 6 },
        Range { name: "r", start: 8, end: 10 },
        Range { name: "s", start: 9, end: 12 },
        Range { name: "t", start: 15, end: 18 },
    ];

    // Sorting by start is the algorithm. Once starts are in order, an overlap can
    // only ever be with the range currently open — never with one already closed.
    let mut order: Vec<&Range> = ranges.iter().collect();
    order.sort_by_key(|r| r.start);
    let shown_order: Vec<String> = order.iter()
        .map(|r| format!("{} {}-{}", r.name, r.start, r.end))
        .collect();
    println!("sorted by start: {}", shown_order.join(", "));
    println!();

    let mut merged: Vec<(i32, i32)> = Vec::new();
    for r in &order {
        let overlaps = merged.last().map_or(false, |open| r.start <= open.1);
        if overlaps {
            let open = merged.last_mut().unwrap();
            let was = open.1;
            open.1 = open.1.max(r.end);
            if open.1 == was {
                println!("  {} {}-{}: inside the open range, swallowed whole", r.name, r.start, r.end);
            } else {
                println!("  {} {}-{}: overlaps, open range stretches {} -> {}",
                         r.name, r.start, r.end, was, open.1);
            }
        } else {
            merged.push((r.start, r.end));
            println!("  {} {}-{}: nothing to merge with, opens range {}",
                     r.name, r.start, r.end, merged.len());
        }
    }

    let shown_merged: Vec<String> = merged.iter().map(|(a, b)| format!("{}-{}", a, b)).collect();
    println!();
    println!("merged: {}", shown_merged.join(", "));
    println!("{} ranges became {}, in one pass after the sort", ranges.len(), merged.len());
    println!();

    // Why one open range is enough, checked rather than claimed.
    println!("the claim: once a range is final, no later interval can reopen it.");
    println!("  {:<11} {:>6}  {:<22} {:>10}  reopens one?",
             "interval", "starts", "ranges already final", "latest end");
    for r in &order {
        let final_ranges: Vec<&(i32, i32)> = merged.iter().filter(|m| m.1 < r.start).collect();
        let parts: Vec<String> = final_ranges.iter().map(|(a, b)| format!("{}-{}", a, b)).collect();
        let shown = if parts.is_empty() { "(none yet)".to_string() } else { parts.join(", ") };
        let latest = final_ranges.iter().map(|m| m.1).max();
        let verdict = match latest {
            None => "no",
            Some(l) => if r.start > l { "no" } else { "YES" },
        };
        let label = format!("{} {}-{}", r.name, r.start, r.end);
        let latest_text = latest.map_or("-".to_string(), |l| l.to_string());
        println!("  {:<11} {:>6}  {:<22} {:>10}  {}", label, r.start, shown, latest_text, verdict);
    }

    println!();
    println!("every answer is no, and it has to be: a range becomes final exactly when");
    println!("a start passes its end, and starts only increase from there. that is why");
    println!("one open range is enough and the pass is O(n) — the sort is the whole cost.");
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

type rangeT struct {
	name       string
	start, end int
}

func main() {
	ranges := []rangeT{
		{"p", 1, 4}, {"q", 2, 6}, {"r", 8, 10}, {"s", 9, 12}, {"t", 15, 18},
	}

	// Sorting by start is the algorithm. Once starts are in order, an overlap can
	// only ever be with the range currently open — never with one already closed.
	order := append([]rangeT(nil), ranges...)
	sort.SliceStable(order, func(i, j int) bool { return order[i].start < order[j].start })
	shownOrder := make([]string, len(order))
	for i, r := range order {
		shownOrder[i] = fmt.Sprintf("%s %d-%d", r.name, r.start, r.end)
	}
	fmt.Println("sorted by start: " + strings.Join(shownOrder, ", "))
	fmt.Println()

	var merged [][2]int
	for _, r := range order {
		if len(merged) > 0 && r.start <= merged[len(merged)-1][1] {
			was := merged[len(merged)-1][1]
			if r.end > merged[len(merged)-1][1] {
				merged[len(merged)-1][1] = r.end
			}
			if merged[len(merged)-1][1] == was {
				fmt.Printf("  %s %d-%d: inside the open range, swallowed whole\\n", r.name, r.start, r.end)
			} else {
				fmt.Printf("  %s %d-%d: overlaps, open range stretches %d -> %d\\n",
					r.name, r.start, r.end, was, merged[len(merged)-1][1])
			}
		} else {
			merged = append(merged, [2]int{r.start, r.end})
			fmt.Printf("  %s %d-%d: nothing to merge with, opens range %d\\n",
				r.name, r.start, r.end, len(merged))
		}
	}

	shownMerged := make([]string, len(merged))
	for i, m := range merged {
		shownMerged[i] = fmt.Sprintf("%d-%d", m[0], m[1])
	}
	fmt.Println()
	fmt.Println("merged: " + strings.Join(shownMerged, ", "))
	fmt.Printf("%d ranges became %d, in one pass after the sort\\n", len(ranges), len(merged))
	fmt.Println()

	// Why one open range is enough, checked rather than claimed.
	fmt.Println("the claim: once a range is final, no later interval can reopen it.")
	fmt.Printf("  %-11s %6s  %-22s %10s  reopens one?\\n",
		"interval", "starts", "ranges already final", "latest end")
	for _, r := range order {
		var parts []string
		latest := -1
		for _, m := range merged {
			if m[1] < r.start {
				parts = append(parts, fmt.Sprintf("%d-%d", m[0], m[1]))
				if m[1] > latest {
					latest = m[1]
				}
			}
		}
		shown := "(none yet)"
		if len(parts) > 0 {
			shown = strings.Join(parts, ", ")
		}
		verdict := "no"
		latestText := "-"
		if latest >= 0 {
			latestText = strconv.Itoa(latest)
			if r.start <= latest {
				verdict = "YES"
			}
		}
		label := fmt.Sprintf("%s %d-%d", r.name, r.start, r.end)
		fmt.Printf("  %-11s %6d  %-22s %10s  %s\\n", label, r.start, shown, latestText, verdict)
	}

	fmt.Println()
	fmt.Println("every answer is no, and it has to be: a range becomes final exactly when")
	fmt.Println("a start passes its end, and starts only increase from there. that is why")
	fmt.Println("one open range is enough and the pass is O(n) — the sort is the whole cost.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "insert-into-merged",
      heading: "Inserting into a list that is already merged",
      body: [
        "Now the list is already sorted and already disjoint — the output of the previous section — and one new interval arrives. The tempting move is to append it and re-run the merge, and it is worth resisting, because it discards the ordering you were handed and pays for a sort you do not need.",
        "The interval can be placed instead, in one pass with three phases. Everything ending before the new interval starts is copied through untouched. Everything the new interval touches is absorbed into it, which is the merge step applied to a single interval. Everything starting after it ends is copied through untouched.",
        "The phases are strictly ordered because the list is, and that is the only reason this works. On an unsorted list none of the three tests would be conclusive, and you would be back to a full merge.",
      ],
      examples: [
        {
          id: "insert-into-merged",
          title: "Inserting into a list that is already merged",
          lang: "python",
          code: `# The output of the merge, which is already sorted and already disjoint.
existing = [(1, 6), (8, 12), (15, 18)]
new = (5, 9)

print(f"existing: {', '.join(f'{a}-{b}' for a, b in existing)}")
print(f"inserting: {new[0]}-{new[1]}")
print()

# Three phases, in one pass. No sort: the list already has the order the merge
# left it in, and the new interval is placed rather than appended-and-resorted.
out, i, n = [], 0, len(existing)

print("phase 1 — everything that ends before the new one starts, copied as is:")
while i < n and existing[i][1] < new[0]:
    print(f"  {existing[i][0]}-{existing[i][1]} ends before {new[0]}, untouched")
    out.append(existing[i])
    i += 1
if not out:
    print("  (none — the very first range already reaches past 5)")

print()
print("phase 2 — everything that touches the new one, absorbed into it:")
start, end = new
while i < n and existing[i][0] <= end:
    print(f"  {existing[i][0]}-{existing[i][1]} overlaps; the merged range grows to "
          f"{min(start, existing[i][0])}-{max(end, existing[i][1])}")
    start = min(start, existing[i][0])
    end = max(end, existing[i][1])
    i += 1
out.append((start, end))

print()
print("phase 3 — everything that starts after it ends, copied as is:")
tail = existing[i:]
for a, b in tail:
    print(f"  {a}-{b} starts after {end}, untouched")
out.extend(tail)
if not tail:
    print("  (none)")

print()
print(f"result: {', '.join(f'{a}-{b}' for a, b in out)}")
print()
print(f"one pass, {n} ranges examined, no sort — the list was already ordered.")
print("the three phases are the whole algorithm, and the middle one is the only")
print("place any thinking happens: it is exactly the merge step from before,")
print("run against a single interval instead of a stream of them.")`,
          output: `existing: 1-6, 8-12, 15-18
inserting: 5-9

phase 1 — everything that ends before the new one starts, copied as is:
  (none — the very first range already reaches past 5)

phase 2 — everything that touches the new one, absorbed into it:
  1-6 overlaps; the merged range grows to 1-9
  8-12 overlaps; the merged range grows to 1-12

phase 3 — everything that starts after it ends, copied as is:
  15-18 starts after 12, untouched

result: 1-12, 15-18

one pass, 3 ranges examined, no sort — the list was already ordered.
the three phases are the whole algorithm, and the middle one is the only
place any thinking happens: it is exactly the merge step from before,
run against a single interval instead of a stream of them.`,
          explanation:
            "The common mistake is to append the new interval and re-run the merge, which throws away the ordering the list already has and costs another O(n log n). It is unnecessary: the list is sorted and disjoint, so one pass in three phases places the interval. Copy everything that ends before it starts, absorb everything it touches, copy the rest. Only the middle phase does any work, and it is the merge step from the previous section applied to one interval instead of a stream. The whole thing is O(n) with no sort.",
          alternates: [
            {
              lang: "javascript",
              code: `// The output of the merge, which is already sorted and already disjoint.
const existing = [[1, 6], [8, 12], [15, 18]];
const New = [5, 9];

const show = (rs) => rs.map(([a, b]) => \`\${a}-\${b}\`).join(", ");

console.log(\`existing: \${show(existing)}\`);
console.log(\`inserting: \${New[0]}-\${New[1]}\`);
console.log();

// Three phases, in one pass. No sort: the list already has the order the merge
// left it in, and the new interval is placed rather than appended-and-resorted.
const out = [];
let i = 0;
const n = existing.length;

console.log("phase 1 — everything that ends before the new one starts, copied as is:");
while (i < n && existing[i][1] < New[0]) {
  console.log(\`  \${existing[i][0]}-\${existing[i][1]} ends before \${New[0]}, untouched\`);
  out.push(existing[i]);
  i += 1;
}
if (out.length === 0) console.log("  (none — the very first range already reaches past 5)");

console.log();
console.log("phase 2 — everything that touches the new one, absorbed into it:");
let [start, end] = New;
while (i < n && existing[i][0] <= end) {
  console.log(\`  \${existing[i][0]}-\${existing[i][1]} overlaps; the merged range grows to \`
    + \`\${Math.min(start, existing[i][0])}-\${Math.max(end, existing[i][1])}\`);
  start = Math.min(start, existing[i][0]);
  end = Math.max(end, existing[i][1]);
  i += 1;
}
out.push([start, end]);

console.log();
console.log("phase 3 — everything that starts after it ends, copied as is:");
const tail = existing.slice(i);
for (const [a, b] of tail) {
  console.log(\`  \${a}-\${b} starts after \${end}, untouched\`);
}
out.push(...tail);
if (tail.length === 0) console.log("  (none)");

console.log();
console.log(\`result: \${show(out)}\`);
console.log();
console.log(\`one pass, \${n} ranges examined, no sort — the list was already ordered.\`);
console.log("the three phases are the whole algorithm, and the middle one is the only");
console.log("place any thinking happens: it is exactly the merge step from before,");
console.log("run against a single interval instead of a stream of them.");`,
            },
            {
              lang: "typescript",
              code: `// The output of the merge, which is already sorted and already disjoint.
type Span = [number, number];

const existing: Span[] = [[1, 6], [8, 12], [15, 18]];
const New: Span = [5, 9];

const show = (rs: Span[]): string => rs.map(([a, b]) => \`\${a}-\${b}\`).join(", ");

console.log(\`existing: \${show(existing)}\`);
console.log(\`inserting: \${New[0]}-\${New[1]}\`);
console.log();

// Three phases, in one pass. No sort: the list already has the order the merge
// left it in, and the new interval is placed rather than appended-and-resorted.
const out: Span[] = [];
let i = 0;
const n = existing.length;

console.log("phase 1 — everything that ends before the new one starts, copied as is:");
while (i < n && existing[i][1] < New[0]) {
  console.log(\`  \${existing[i][0]}-\${existing[i][1]} ends before \${New[0]}, untouched\`);
  out.push(existing[i]);
  i += 1;
}
if (out.length === 0) console.log("  (none — the very first range already reaches past 5)");

console.log();
console.log("phase 2 — everything that touches the new one, absorbed into it:");
let [start, end] = New;
while (i < n && existing[i][0] <= end) {
  console.log(\`  \${existing[i][0]}-\${existing[i][1]} overlaps; the merged range grows to \`
    + \`\${Math.min(start, existing[i][0])}-\${Math.max(end, existing[i][1])}\`);
  start = Math.min(start, existing[i][0]);
  end = Math.max(end, existing[i][1]);
  i += 1;
}
out.push([start, end]);

console.log();
console.log("phase 3 — everything that starts after it ends, copied as is:");
const tail = existing.slice(i);
for (const [a, b] of tail) {
  console.log(\`  \${a}-\${b} starts after \${end}, untouched\`);
}
out.push(...tail);
if (tail.length === 0) console.log("  (none)");

console.log();
console.log(\`result: \${show(out)}\`);
console.log();
console.log(\`one pass, \${n} ranges examined, no sort — the list was already ordered.\`);
console.log("the three phases are the whole algorithm, and the middle one is the only");
console.log("place any thinking happens: it is exactly the merge step from before,");
console.log("run against a single interval instead of a stream of them.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static String show(List<int[]> rs) {
        List<String> parts = new ArrayList<>();
        for (int[] r : rs) parts.add(r[0] + "-" + r[1]);
        return String.join(", ", parts);
    }

    public static void main(String[] args) {
        // The output of the merge, which is already sorted and already disjoint.
        List<int[]> existing = List.of(new int[] {1, 6}, new int[] {8, 12}, new int[] {15, 18});
        int[] fresh = {5, 9};

        System.out.println("existing: " + show(existing));
        System.out.println("inserting: " + fresh[0] + "-" + fresh[1]);
        System.out.println();

        // Three phases, in one pass. No sort: the list already has the order the merge
        // left it in, and the new interval is placed rather than appended-and-resorted.
        List<int[]> out = new ArrayList<>();
        int i = 0;
        int n = existing.size();

        System.out.println("phase 1 — everything that ends before the new one starts, copied as is:");
        while (i < n && existing.get(i)[1] < fresh[0]) {
            System.out.println("  " + existing.get(i)[0] + "-" + existing.get(i)[1]
                    + " ends before " + fresh[0] + ", untouched");
            out.add(existing.get(i));
            i += 1;
        }
        if (out.isEmpty()) {
            System.out.println("  (none — the very first range already reaches past 5)");
        }

        System.out.println();
        System.out.println("phase 2 — everything that touches the new one, absorbed into it:");
        int start = fresh[0];
        int end = fresh[1];
        while (i < n && existing.get(i)[0] <= end) {
            System.out.println("  " + existing.get(i)[0] + "-" + existing.get(i)[1]
                    + " overlaps; the merged range grows to "
                    + Math.min(start, existing.get(i)[0]) + "-" + Math.max(end, existing.get(i)[1]));
            start = Math.min(start, existing.get(i)[0]);
            end = Math.max(end, existing.get(i)[1]);
            i += 1;
        }
        out.add(new int[] {start, end});

        System.out.println();
        System.out.println("phase 3 — everything that starts after it ends, copied as is:");
        List<int[]> tail = existing.subList(i, n);
        for (int[] r : tail) {
            System.out.println("  " + r[0] + "-" + r[1] + " starts after " + end + ", untouched");
        }
        out.addAll(tail);
        if (tail.isEmpty()) System.out.println("  (none)");

        System.out.println();
        System.out.println("result: " + show(out));
        System.out.println();
        System.out.println("one pass, " + n + " ranges examined, no sort — the list was already ordered.");
        System.out.println("the three phases are the whole algorithm, and the middle one is the only");
        System.out.println("place any thinking happens: it is exactly the merge step from before,");
        System.out.println("run against a single interval instead of a stream of them.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

std::string show(const std::vector<std::pair<int, int>>& rs) {
    std::string out;
    for (std::size_t i = 0; i < rs.size(); i++) {
        out += (i ? ", " : "") + std::to_string(rs[i].first) + "-" + std::to_string(rs[i].second);
    }
    return out;
}

int main() {
    // The output of the merge, which is already sorted and already disjoint.
    std::vector<std::pair<int, int>> existing = {{1, 6}, {8, 12}, {15, 18}};
    std::pair<int, int> fresh = {5, 9};

    std::cout << "existing: " << show(existing) << '\\n';
    std::cout << "inserting: " << fresh.first << "-" << fresh.second << "\\n\\n";

    // Three phases, in one pass. No sort: the list already has the order the merge
    // left it in, and the new interval is placed rather than appended-and-resorted.
    std::vector<std::pair<int, int>> out;
    std::size_t i = 0;
    const std::size_t n = existing.size();

    std::cout << "phase 1 — everything that ends before the new one starts, copied as is:\\n";
    while (i < n && existing[i].second < fresh.first) {
        std::cout << "  " << existing[i].first << "-" << existing[i].second
                  << " ends before " << fresh.first << ", untouched\\n";
        out.push_back(existing[i]);
        i += 1;
    }
    if (out.empty()) {
        std::cout << "  (none — the very first range already reaches past 5)\\n";
    }

    std::cout << "\\nphase 2 — everything that touches the new one, absorbed into it:\\n";
    int start = fresh.first;
    int end = fresh.second;
    while (i < n && existing[i].first <= end) {
        std::cout << "  " << existing[i].first << "-" << existing[i].second
                  << " overlaps; the merged range grows to "
                  << std::min(start, existing[i].first) << "-"
                  << std::max(end, existing[i].second) << '\\n';
        start = std::min(start, existing[i].first);
        end = std::max(end, existing[i].second);
        i += 1;
    }
    out.push_back({start, end});

    std::cout << "\\nphase 3 — everything that starts after it ends, copied as is:\\n";
    std::vector<std::pair<int, int>> tail(existing.begin() + static_cast<long>(i), existing.end());
    for (const auto& r : tail) {
        std::cout << "  " << r.first << "-" << r.second << " starts after " << end << ", untouched\\n";
    }
    out.insert(out.end(), tail.begin(), tail.end());
    if (tail.empty()) std::cout << "  (none)\\n";

    std::cout << "\\nresult: " << show(out) << "\\n\\n";
    std::cout << "one pass, " << n << " ranges examined, no sort — the list was already ordered.\\n";
    std::cout << "the three phases are the whole algorithm, and the middle one is the only\\n";
    std::cout << "place any thinking happens: it is exactly the merge step from before,\\n";
    std::cout << "run against a single interval instead of a stream of them.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(rs: &[(i32, i32)]) -> String {
    let parts: Vec<String> = rs.iter().map(|(a, b)| format!("{}-{}", a, b)).collect();
    parts.join(", ")
}

fn main() {
    // The output of the merge, which is already sorted and already disjoint.
    let existing: Vec<(i32, i32)> = vec![(1, 6), (8, 12), (15, 18)];
    let fresh: (i32, i32) = (5, 9);

    println!("existing: {}", show(&existing));
    println!("inserting: {}-{}", fresh.0, fresh.1);
    println!();

    // Three phases, in one pass. No sort: the list already has the order the merge
    // left it in, and the new interval is placed rather than appended-and-resorted.
    let mut out: Vec<(i32, i32)> = Vec::new();
    let mut i = 0;
    let n = existing.len();

    println!("phase 1 — everything that ends before the new one starts, copied as is:");
    while i < n && existing[i].1 < fresh.0 {
        println!("  {}-{} ends before {}, untouched", existing[i].0, existing[i].1, fresh.0);
        out.push(existing[i]);
        i += 1;
    }
    if out.is_empty() {
        println!("  (none — the very first range already reaches past 5)");
    }

    println!();
    println!("phase 2 — everything that touches the new one, absorbed into it:");
    let (mut start, mut end) = fresh;
    while i < n && existing[i].0 <= end {
        println!("  {}-{} overlaps; the merged range grows to {}-{}",
                 existing[i].0, existing[i].1,
                 start.min(existing[i].0), end.max(existing[i].1));
        start = start.min(existing[i].0);
        end = end.max(existing[i].1);
        i += 1;
    }
    out.push((start, end));

    println!();
    println!("phase 3 — everything that starts after it ends, copied as is:");
    let tail = &existing[i..];
    for (a, b) in tail {
        println!("  {}-{} starts after {}, untouched", a, b, end);
    }
    out.extend_from_slice(tail);
    if tail.is_empty() {
        println!("  (none)");
    }

    println!();
    println!("result: {}", show(&out));
    println!();
    println!("one pass, {} ranges examined, no sort — the list was already ordered.", n);
    println!("the three phases are the whole algorithm, and the middle one is the only");
    println!("place any thinking happens: it is exactly the merge step from before,");
    println!("run against a single interval instead of a stream of them.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func show(rs [][2]int) string {
	parts := make([]string, len(rs))
	for i, r := range rs {
		parts[i] = fmt.Sprintf("%d-%d", r[0], r[1])
	}
	return strings.Join(parts, ", ")
}

func main() {
	// The output of the merge, which is already sorted and already disjoint.
	existing := [][2]int{{1, 6}, {8, 12}, {15, 18}}
	fresh := [2]int{5, 9}

	fmt.Println("existing: " + show(existing))
	fmt.Printf("inserting: %d-%d\\n", fresh[0], fresh[1])
	fmt.Println()

	// Three phases, in one pass. No sort: the list already has the order the merge
	// left it in, and the new interval is placed rather than appended-and-resorted.
	var out [][2]int
	i, n := 0, len(existing)

	fmt.Println("phase 1 — everything that ends before the new one starts, copied as is:")
	for i < n && existing[i][1] < fresh[0] {
		fmt.Printf("  %d-%d ends before %d, untouched\\n", existing[i][0], existing[i][1], fresh[0])
		out = append(out, existing[i])
		i++
	}
	if len(out) == 0 {
		fmt.Println("  (none — the very first range already reaches past 5)")
	}

	fmt.Println()
	fmt.Println("phase 2 — everything that touches the new one, absorbed into it:")
	start, end := fresh[0], fresh[1]
	for i < n && existing[i][0] <= end {
		lo, hi := start, end
		if existing[i][0] < lo {
			lo = existing[i][0]
		}
		if existing[i][1] > hi {
			hi = existing[i][1]
		}
		fmt.Printf("  %d-%d overlaps; the merged range grows to %d-%d\\n",
			existing[i][0], existing[i][1], lo, hi)
		start, end = lo, hi
		i++
	}
	out = append(out, [2]int{start, end})

	fmt.Println()
	fmt.Println("phase 3 — everything that starts after it ends, copied as is:")
	tail := existing[i:]
	for _, r := range tail {
		fmt.Printf("  %d-%d starts after %d, untouched\\n", r[0], r[1], end)
	}
	out = append(out, tail...)
	if len(tail) == 0 {
		fmt.Println("  (none)")
	}

	fmt.Println()
	fmt.Println("result: " + show(out))
	fmt.Println()
	fmt.Printf("one pass, %d ranges examined, no sort — the list was already ordered.\\n", n)
	fmt.Println("the three phases are the whole algorithm, and the middle one is the only")
	fmt.Println("place any thinking happens: it is exactly the merge step from before,")
	fmt.Println("run against a single interval instead of a stream of them.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "intersect-two-lists",
      heading: "Two lists, two pointers",
      body: [
        "The last member of the family takes two sorted, internally disjoint lists and asks where they overlap. The nested loop is O(n·m) and unnecessary for the usual reason: both lists are ordered, so a single pass over the pair is enough.",
        "Two facts do all the work. The overlap of two intervals is `max(starts)` to `min(ends)`, empty when that is backwards — no case analysis, just arithmetic. And when the two do not both continue, the one that ends first is finished: everything left in the other list starts later than the interval it was just compared with, so nothing remaining can reach back.",
        "Advancing that pointer is a greedy choice, and it is safe for exactly the reason rejecting an overlapping meeting was safe. Both problems discard an option permanently on a local comparison, and in both the ordering is what licenses it.",
      ],
      examples: [
        {
          id: "intersect-two-lists",
          title: "Intersecting two sorted lists",
          lang: "python",
          code: `# Both lists are sorted and internally disjoint — which is what makes one pass
# over the two of them enough, with no sort and no nested loop.
a = [(1, 6), (8, 12), (15, 18)]
b = [(2, 4), (5, 10), (14, 16), (17, 20)]

print(f"a: {', '.join(f'{s}-{e}' for s, e in a)}")
print(f"b: {', '.join(f'{s}-{e}' for s, e in b)}")
print()

print(f"  {'a':>7} {'b':>7} {'overlap':>9}  then advance")
out, i, j = [], 0, 0
while i < len(a) and j < len(b):
    lo = max(a[i][0], b[j][0])
    hi = min(a[i][1], b[j][1])
    piece = f"{lo}-{hi}" if lo < hi else "none"
    if lo < hi:
        out.append((lo, hi))
    # Whichever ends first can never meet anything later in the other list.
    moved = "a" if a[i][1] < b[j][1] else "b"
    print(f"  {f'{a[i][0]}-{a[i][1]}':>7} {f'{b[j][0]}-{b[j][1]}':>7} {piece:>9}  {moved}")
    if a[i][1] < b[j][1]:
        i += 1
    else:
        j += 1

print()
print(f"intersections: {', '.join(f'{s}-{e}' for s, e in out)}")
print()
print("the overlap of two intervals is always max(starts) to min(ends), and it")
print("is empty when that comes out backwards. the only decision is which")
print("pointer to move, and the answer is always the one that ends first —")
print("everything after it in the other list starts later still.")
print()
print(f"one pass over {len(a)} + {len(b)} intervals rather than {len(a)} x {len(b)} comparisons,")
print("and the greedy part is that a discarded interval is never revisited.")`,
          output: `a: 1-6, 8-12, 15-18
b: 2-4, 5-10, 14-16, 17-20

        a       b   overlap  then advance
      1-6     2-4       2-4  b
      1-6    5-10       5-6  a
     8-12    5-10      8-10  b
     8-12   14-16      none  a
    15-18   14-16     15-16  b
    15-18   17-20     17-18  a

intersections: 2-4, 5-6, 8-10, 15-16, 17-18

the overlap of two intervals is always max(starts) to min(ends), and it
is empty when that comes out backwards. the only decision is which
pointer to move, and the answer is always the one that ends first —
everything after it in the other list starts later still.

one pass over 3 + 4 intervals rather than 3 x 4 comparisons,
and the greedy part is that a discarded interval is never revisited.`,
          explanation:
            "The overlap of any two intervals is `max(starts)` to `min(ends)`, and it is empty exactly when that comes out backwards — so the arithmetic is never the hard part. The decision is which pointer to advance, and the answer is always the interval that ends first: everything remaining in the other list starts later than the one being compared, so an interval that has already ended can meet none of them. That is the greedy move, and discarding it is safe for the same reason discarding a rejected meeting was. One pass over 3 + 4 intervals rather than 3 × 4 comparisons.",
          alternates: [
            {
              lang: "javascript",
              code: `// Both lists are sorted and internally disjoint — which is what makes one pass
// over the two of them enough, with no sort and no nested loop.
const a = [[1, 6], [8, 12], [15, 18]];
const b = [[2, 4], [5, 10], [14, 16], [17, 20]];

const padL = (s, w) => String(s).padStart(w);
const show = (rs) => rs.map(([s, e]) => \`\${s}-\${e}\`).join(", ");

console.log(\`a: \${show(a)}\`);
console.log(\`b: \${show(b)}\`);
console.log();

console.log(\`  \${padL("a", 7)} \${padL("b", 7)} \${padL("overlap", 9)}  then advance\`);
const out = [];
let i = 0;
let j = 0;
while (i < a.length && j < b.length) {
  const lo = Math.max(a[i][0], b[j][0]);
  const hi = Math.min(a[i][1], b[j][1]);
  const piece = lo < hi ? \`\${lo}-\${hi}\` : "none";
  if (lo < hi) out.push([lo, hi]);
  // Whichever ends first can never meet anything later in the other list.
  const moved = a[i][1] < b[j][1] ? "a" : "b";
  console.log(\`  \${padL(\`\${a[i][0]}-\${a[i][1]}\`, 7)} \${padL(\`\${b[j][0]}-\${b[j][1]}\`, 7)} \${padL(piece, 9)}  \${moved}\`);
  if (a[i][1] < b[j][1]) i += 1;
  else j += 1;
}

console.log();
console.log(\`intersections: \${show(out)}\`);
console.log();
console.log("the overlap of two intervals is always max(starts) to min(ends), and it");
console.log("is empty when that comes out backwards. the only decision is which");
console.log("pointer to move, and the answer is always the one that ends first —");
console.log("everything after it in the other list starts later still.");
console.log();
console.log(\`one pass over \${a.length} + \${b.length} intervals rather than \${a.length} x \${b.length} comparisons,\`);
console.log("and the greedy part is that a discarded interval is never revisited.");`,
            },
            {
              lang: "typescript",
              code: `// Both lists are sorted and internally disjoint — which is what makes one pass
// over the two of them enough, with no sort and no nested loop.
type Span = [number, number];

const a: Span[] = [[1, 6], [8, 12], [15, 18]];
const b: Span[] = [[2, 4], [5, 10], [14, 16], [17, 20]];

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const show = (rs: Span[]): string => rs.map(([s, e]) => \`\${s}-\${e}\`).join(", ");

console.log(\`a: \${show(a)}\`);
console.log(\`b: \${show(b)}\`);
console.log();

console.log(\`  \${padL("a", 7)} \${padL("b", 7)} \${padL("overlap", 9)}  then advance\`);
const out: Span[] = [];
let i = 0;
let j = 0;
while (i < a.length && j < b.length) {
  const lo = Math.max(a[i][0], b[j][0]);
  const hi = Math.min(a[i][1], b[j][1]);
  const piece = lo < hi ? \`\${lo}-\${hi}\` : "none";
  if (lo < hi) out.push([lo, hi]);
  // Whichever ends first can never meet anything later in the other list.
  const moved = a[i][1] < b[j][1] ? "a" : "b";
  console.log(\`  \${padL(\`\${a[i][0]}-\${a[i][1]}\`, 7)} \${padL(\`\${b[j][0]}-\${b[j][1]}\`, 7)} \${padL(piece, 9)}  \${moved}\`);
  if (a[i][1] < b[j][1]) i += 1;
  else j += 1;
}

console.log();
console.log(\`intersections: \${show(out)}\`);
console.log();
console.log("the overlap of two intervals is always max(starts) to min(ends), and it");
console.log("is empty when that comes out backwards. the only decision is which");
console.log("pointer to move, and the answer is always the one that ends first —");
console.log("everything after it in the other list starts later still.");
console.log();
console.log(\`one pass over \${a.length} + \${b.length} intervals rather than \${a.length} x \${b.length} comparisons,\`);
console.log("and the greedy part is that a discarded interval is never revisited.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static String show(List<int[]> rs) {
        List<String> parts = new ArrayList<>();
        for (int[] r : rs) parts.add(r[0] + "-" + r[1]);
        return String.join(", ", parts);
    }

    public static void main(String[] args) {
        // Both lists are sorted and internally disjoint — which is what makes one pass
        // over the two of them enough, with no sort and no nested loop.
        List<int[]> a = List.of(new int[] {1, 6}, new int[] {8, 12}, new int[] {15, 18});
        List<int[]> b = List.of(new int[] {2, 4}, new int[] {5, 10},
                new int[] {14, 16}, new int[] {17, 20});

        System.out.println("a: " + show(a));
        System.out.println("b: " + show(b));
        System.out.println();

        System.out.printf("  %7s %7s %9s  then advance%n", "a", "b", "overlap");
        List<int[]> out = new ArrayList<>();
        int i = 0;
        int j = 0;
        while (i < a.size() && j < b.size()) {
            int lo = Math.max(a.get(i)[0], b.get(j)[0]);
            int hi = Math.min(a.get(i)[1], b.get(j)[1]);
            String piece = lo < hi ? lo + "-" + hi : "none";
            if (lo < hi) out.add(new int[] {lo, hi});
            // Whichever ends first can never meet anything later in the other list.
            String moved = a.get(i)[1] < b.get(j)[1] ? "a" : "b";
            System.out.printf("  %7s %7s %9s  %s%n",
                    a.get(i)[0] + "-" + a.get(i)[1], b.get(j)[0] + "-" + b.get(j)[1], piece, moved);
            if (a.get(i)[1] < b.get(j)[1]) i += 1;
            else j += 1;
        }

        System.out.println();
        System.out.println("intersections: " + show(out));
        System.out.println();
        System.out.println("the overlap of two intervals is always max(starts) to min(ends), and it");
        System.out.println("is empty when that comes out backwards. the only decision is which");
        System.out.println("pointer to move, and the answer is always the one that ends first —");
        System.out.println("everything after it in the other list starts later still.");
        System.out.println();
        System.out.println("one pass over " + a.size() + " + " + b.size()
                + " intervals rather than " + a.size() + " x " + b.size() + " comparisons,");
        System.out.println("and the greedy part is that a discarded interval is never revisited.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

std::string show(const std::vector<std::pair<int, int>>& rs) {
    std::string out;
    for (std::size_t i = 0; i < rs.size(); i++) {
        out += (i ? ", " : "") + std::to_string(rs[i].first) + "-" + std::to_string(rs[i].second);
    }
    return out;
}

std::string span(const std::pair<int, int>& r) {
    return std::to_string(r.first) + "-" + std::to_string(r.second);
}

int main() {
    // Both lists are sorted and internally disjoint — which is what makes one pass
    // over the two of them enough, with no sort and no nested loop.
    std::vector<std::pair<int, int>> a = {{1, 6}, {8, 12}, {15, 18}};
    std::vector<std::pair<int, int>> b = {{2, 4}, {5, 10}, {14, 16}, {17, 20}};

    std::cout << "a: " << show(a) << '\\n';
    std::cout << "b: " << show(b) << "\\n\\n";

    std::cout << "  " << std::setw(7) << "a" << ' ' << std::setw(7) << "b" << ' '
              << std::setw(9) << "overlap" << "  then advance\\n";
    std::vector<std::pair<int, int>> out;
    std::size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        int lo = std::max(a[i].first, b[j].first);
        int hi = std::min(a[i].second, b[j].second);
        std::string piece = lo < hi ? std::to_string(lo) + "-" + std::to_string(hi) : "none";
        if (lo < hi) out.push_back({lo, hi});
        // Whichever ends first can never meet anything later in the other list.
        std::string moved = a[i].second < b[j].second ? "a" : "b";
        std::cout << "  " << std::setw(7) << span(a[i]) << ' ' << std::setw(7) << span(b[j])
                  << ' ' << std::setw(9) << piece << "  " << moved << '\\n';
        if (a[i].second < b[j].second) i += 1;
        else j += 1;
    }

    std::cout << "\\nintersections: " << show(out) << "\\n\\n";
    std::cout << "the overlap of two intervals is always max(starts) to min(ends), and it\\n";
    std::cout << "is empty when that comes out backwards. the only decision is which\\n";
    std::cout << "pointer to move, and the answer is always the one that ends first —\\n";
    std::cout << "everything after it in the other list starts later still.\\n\\n";
    std::cout << "one pass over " << a.size() << " + " << b.size() << " intervals rather than "
              << a.size() << " x " << b.size() << " comparisons,\\n";
    std::cout << "and the greedy part is that a discarded interval is never revisited.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(rs: &[(i32, i32)]) -> String {
    let parts: Vec<String> = rs.iter().map(|(s, e)| format!("{}-{}", s, e)).collect();
    parts.join(", ")
}

fn main() {
    // Both lists are sorted and internally disjoint — which is what makes one pass
    // over the two of them enough, with no sort and no nested loop.
    let a: Vec<(i32, i32)> = vec![(1, 6), (8, 12), (15, 18)];
    let b: Vec<(i32, i32)> = vec![(2, 4), (5, 10), (14, 16), (17, 20)];

    println!("a: {}", show(&a));
    println!("b: {}", show(&b));
    println!();

    println!("  {:>7} {:>7} {:>9}  then advance", "a", "b", "overlap");
    let mut out: Vec<(i32, i32)> = Vec::new();
    let (mut i, mut j) = (0usize, 0usize);
    while i < a.len() && j < b.len() {
        let lo = a[i].0.max(b[j].0);
        let hi = a[i].1.min(b[j].1);
        let piece = if lo < hi { format!("{}-{}", lo, hi) } else { "none".to_string() };
        if lo < hi {
            out.push((lo, hi));
        }
        // Whichever ends first can never meet anything later in the other list.
        let moved = if a[i].1 < b[j].1 { "a" } else { "b" };
        println!("  {:>7} {:>7} {:>9}  {}",
                 format!("{}-{}", a[i].0, a[i].1), format!("{}-{}", b[j].0, b[j].1), piece, moved);
        if a[i].1 < b[j].1 { i += 1 } else { j += 1 }
    }

    println!();
    println!("intersections: {}", show(&out));
    println!();
    println!("the overlap of two intervals is always max(starts) to min(ends), and it");
    println!("is empty when that comes out backwards. the only decision is which");
    println!("pointer to move, and the answer is always the one that ends first —");
    println!("everything after it in the other list starts later still.");
    println!();
    println!("one pass over {} + {} intervals rather than {} x {} comparisons,",
             a.len(), b.len(), a.len(), b.len());
    println!("and the greedy part is that a discarded interval is never revisited.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func show(rs [][2]int) string {
	parts := make([]string, len(rs))
	for i, r := range rs {
		parts[i] = fmt.Sprintf("%d-%d", r[0], r[1])
	}
	return strings.Join(parts, ", ")
}

func main() {
	// Both lists are sorted and internally disjoint — which is what makes one pass
	// over the two of them enough, with no sort and no nested loop.
	a := [][2]int{{1, 6}, {8, 12}, {15, 18}}
	b := [][2]int{{2, 4}, {5, 10}, {14, 16}, {17, 20}}

	fmt.Println("a: " + show(a))
	fmt.Println("b: " + show(b))
	fmt.Println()

	fmt.Printf("  %7s %7s %9s  then advance\\n", "a", "b", "overlap")
	var out [][2]int
	i, j := 0, 0
	for i < len(a) && j < len(b) {
		lo, hi := a[i][0], a[i][1]
		if b[j][0] > lo {
			lo = b[j][0]
		}
		if b[j][1] < hi {
			hi = b[j][1]
		}
		piece := "none"
		if lo < hi {
			piece = fmt.Sprintf("%d-%d", lo, hi)
			out = append(out, [2]int{lo, hi})
		}
		// Whichever ends first can never meet anything later in the other list.
		moved := "b"
		if a[i][1] < b[j][1] {
			moved = "a"
		}
		fmt.Printf("  %7s %7s %9s  %s\\n",
			fmt.Sprintf("%d-%d", a[i][0], a[i][1]), fmt.Sprintf("%d-%d", b[j][0], b[j][1]), piece, moved)
		if a[i][1] < b[j][1] {
			i++
		} else {
			j++
		}
	}

	fmt.Println()
	fmt.Println("intersections: " + show(out))
	fmt.Println()
	fmt.Println("the overlap of two intervals is always max(starts) to min(ends), and it")
	fmt.Println("is empty when that comes out backwards. the only decision is which")
	fmt.Println("pointer to move, and the answer is always the one that ends first —")
	fmt.Println("everything after it in the other list starts later still.")
	fmt.Println()
	fmt.Printf("one pass over %d + %d intervals rather than %d x %d comparisons,\\n",
		len(a), len(b), len(a), len(b))
	fmt.Println("and the greedy part is that a discarded interval is never revisited.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does merging sort by start when interval scheduling sorts by finish?",
      answer:
        "Because the two problems ask different questions of the ordering. Scheduling chooses which intervals to keep, so what matters is how much room a choice leaves behind, and finishing time measures exactly that. Merging keeps everything and asks which intervals are adjacent in time, so what matters is that starts arrive in order — which is what makes the interval you are holding the only one a new arrival can overlap. Sorting merge by finish would break that: an interval that finishes late can start early, so the range you are holding would no longer be the only candidate.",
    },
    {
      question: "How do you insert an interval into an already-merged list?",
      answer:
        "In one pass, without re-sorting. Copy everything that ends before the new interval starts; then, while the next interval starts at or before the running end, absorb it by taking the minimum of the starts and the maximum of the ends; then copy the rest. That is O(n) and it relies on the list already being sorted and disjoint. Appending and re-merging gives the right answer but throws away the ordering you were given and costs another sort, which is the thing the question is checking you notice.",
    },
    {
      question: "Two sorted lists of disjoint intervals — find every overlap. Which pointer moves?",
      answer:
        "The one whose interval ends first. The overlap itself is `max(starts)` to `min(ends)`, recorded when that is non-empty. For the advance: whichever interval ends earlier cannot overlap anything further along the other list, because those all start later than the interval it was just compared against — so it is finished and can be dropped permanently. That gives one pass over n + m intervals instead of n·m comparisons. It is the same greedy shape as the rest of the module: a local comparison licenses a permanent discard, and the ordering is what makes it safe.",
    },
  ],
  takeaways: [
    "Sort by start when nothing is rejected, by finish when something is. The objective picks the key.",
    "Once starts are ordered, a new interval can only overlap the range currently open — so one variable is enough state.",
    "A range becomes final exactly when a start passes its end, and nothing later can reopen it.",
    "An interval wholly inside the open range and one that extends it are the same line of code: `max`.",
    "Inserting into a merged list is three phases in one pass. Appending and re-merging pays for a sort you were handed for free.",
    "Two overlapping intervals meet at `max(starts)` to `min(ends)`; advance whichever ends first.",
  ],
  status: "available",
};
