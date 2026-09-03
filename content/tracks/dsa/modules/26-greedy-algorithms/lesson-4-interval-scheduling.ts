import type { Lesson } from "@/content/types";

export const intervalSchedulingLesson: Lesson = {
  id: "dsa-greedy-intervals",
  slug: "interval-scheduling-and-the-sort-key",
  moduleSlug: "greedy-algorithms",
  title: "Interval Scheduling, and the Sort Key That Solves It",
  summary:
    "The canonical greedy problem, where every candidate rule sounds equally reasonable and only one is right. Once the sort key is settled the algorithm is four lines, and a whole family of interview questions turns out to be the same four lines.",
  estimatedMinutes: 35,
  objectives: [
    "Solve interval scheduling with the earliest-finish rule, and say why that key and not another",
    "Prove it with a stays-ahead argument, and check the invariant rather than assert it",
    "Count the rooms a set of meetings needs with a sweep, and get the tie-break right",
    "Recognise the questions that are this algorithm rephrased, and the one that only looks like it",
  ],
  sections: [
    {
      id: "earliest-finish",
      heading: "Earliest finish, and why it is that key",
      body: [
        "One room, a list of meetings, and a request to fit as many in as possible. Every meeting is equal — you are counting them, not weighing them — and two meetings clash if they overlap at any point.",
        "The previous lesson already narrowed the field by search: earliest-start is wrong 112 times in 1,330 small instances, shortest-first 4 times, earliest-finish never. This lesson owes the reason, because a rule that survives a search is not the same as a rule that is right.",
        "The reason is that finishing early is the only property that helps the meetings you have not chosen yet. A meeting's start time tells you nothing about how much room it leaves behind it, and neither does its duration — a short meeting in the middle of the day blocks both halves. The finishing time is precisely the amount of day left, so taking the earliest finish leaves the most room for everything after it.",
        "That turns into a stays-ahead proof. Order any schedule by start time and compare it with greedy's meeting by meeting: greedy's first meeting finishes no later than the rival's first, and by induction its k-th finishes no later than the rival's k-th. A schedule that is never behind cannot run out of day first, so it cannot end up with fewer meetings.",
      ],
      visual: {
        id: "greedy-intervals",
        kind: "greedy",
        algorithm: "intervals",
        title: "Interval scheduling by earliest finishing time",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "earliest-finish",
          title: "Sort by finish, then one scan",
          lang: "python",
          code: `from itertools import combinations

meetings = [
    ("A", 1, 4), ("B", 3, 5), ("C", 0, 6), ("D", 5, 7),
    ("E", 3, 9), ("F", 6, 10), ("G", 8, 11),
]

# Sorting by finishing time is the algorithm. The scan below never sorts again.
order = sorted(meetings, key=lambda m: m[2])
print("sorted by finishing time:")
print(f"  {'meeting':<8} {'start':>5} {'finish':>7}")
for name, s, e in order:
    print(f"  {name:<8} {s:>5} {e:>7}")
print()

booked, free_at = [], 0
print("one scan, one variable — the time the room next comes free:")
for name, s, e in order:
    if s >= free_at:
        booked.append((name, s, e))
        print(f"  {name}: starts {s} >= {free_at}, book it. room busy until {e}")
        free_at = e
    else:
        print(f"  {name}: starts {s} <  {free_at}, drop it. never reconsidered")

print()
print(f"booked {', '.join(n for n, _, _ in booked)} — {len(booked)} meetings")
print()

# Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
def valid(combo):
    c = sorted(combo, key=lambda m: m[1])
    return all(c[i][1] >= c[i - 1][2] for i in range(1, len(c)))


print("the invariant, checked against every valid schedule:")
print(f"  {'k':>2} {'greedy finishes at':>19} {'best any schedule can do':>26}")
for k in range(1, len(booked) + 1):
    best = min(
        max(m[2] for m in sorted(c, key=lambda m: m[1])[:k])
        for c in combinations(meetings, k) if valid(c)
    )
    print(f"  {k:>2} {booked[k - 1][2]:>19} {best:>26}")

print()
print("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.")
print("so it never runs out of room first, and no schedule can hold more.")`,
          output: `sorted by finishing time:
  meeting  start  finish
  A            1       4
  B            3       5
  C            0       6
  D            5       7
  E            3       9
  F            6      10
  G            8      11

one scan, one variable — the time the room next comes free:
  A: starts 1 >= 0, book it. room busy until 4
  B: starts 3 <  4, drop it. never reconsidered
  C: starts 0 <  4, drop it. never reconsidered
  D: starts 5 >= 4, book it. room busy until 7
  E: starts 3 <  7, drop it. never reconsidered
  F: starts 6 <  7, drop it. never reconsidered
  G: starts 8 >= 7, book it. room busy until 11

booked A, D, G — 3 meetings

the invariant, checked against every valid schedule:
   k  greedy finishes at   best any schedule can do
   1                   4                          4
   2                   7                          7
   3                  11                         11

greedy's k-th meeting finishes no later than anyone else's k-th, for every k.
so it never runs out of room first, and no schedule can hold more.`,
          explanation:
            "The whole algorithm is the sort. What follows is a single pass holding one integer — the time the room next comes free — and the loop body is one comparison. That is why the complexity is O(n log n) for the sort and O(n) for everything else. The second half checks the stays-ahead invariant against every valid schedule rather than asserting it: for each k, greedy's k-th meeting finishes no later than the k-th meeting of any schedule that could have been chosen instead. Here it matches exactly at every k, which is the strongest form the invariant takes — greedy is not merely tied at the end, it is never behind at any point during the run.",
          alternates: [
            {
              lang: "javascript",
              code: `const meetings = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Sorting by finishing time is the algorithm. The scan below never sorts again.
const order = [...meetings].sort((a, b) => a[2] - b[2]);
console.log("sorted by finishing time:");
console.log(\`  \${padR("meeting", 8)} \${padL("start", 5)} \${padL("finish", 7)}\`);
for (const [name, s, e] of order) {
  console.log(\`  \${padR(name, 8)} \${padL(s, 5)} \${padL(e, 7)}\`);
}
console.log();

const booked = [];
let freeAt = 0;
console.log("one scan, one variable — the time the room next comes free:");
for (const [name, s, e] of order) {
  if (s >= freeAt) {
    booked.push([name, s, e]);
    console.log(\`  \${name}: starts \${s} >= \${freeAt}, book it. room busy until \${e}\`);
    freeAt = e;
  } else {
    console.log(\`  \${name}: starts \${s} <  \${freeAt}, drop it. never reconsidered\`);
  }
}

console.log();
console.log(\`booked \${booked.map(([n]) => n).join(", ")} — \${booked.length} meetings\`);
console.log();

// Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
function valid(combo) {
  const c = [...combo].sort((a, b) => a[1] - b[1]);
  return c.every((m, i) => i === 0 || m[1] >= c[i - 1][2]);
}

console.log("the invariant, checked against every valid schedule:");
console.log(\`  \${padL("k", 2)} \${padL("greedy finishes at", 19)} \${padL("best any schedule can do", 26)}\`);
for (let k = 1; k <= booked.length; k++) {
  let best = Infinity;
  for (let mask = 0; mask < 1 << meetings.length; mask++) {
    const combo = meetings.filter((_, i) => (mask >> i) & 1);
    if (combo.length !== k || !valid(combo)) continue;
    const byStart = [...combo].sort((a, b) => a[1] - b[1]);
    best = Math.min(best, Math.max(...byStart.slice(0, k).map((m) => m[2])));
  }
  console.log(\`  \${padL(k, 2)} \${padL(booked[k - 1][2], 19)} \${padL(best, 26)}\`);
}

console.log();
console.log("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.");
console.log("so it never runs out of room first, and no schedule can hold more.");`,
            },
            {
              lang: "typescript",
              code: `type Meeting = [string, number, number];

const meetings: Meeting[] = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Sorting by finishing time is the algorithm. The scan below never sorts again.
const order = [...meetings].sort((a, b) => a[2] - b[2]);
console.log("sorted by finishing time:");
console.log(\`  \${padR("meeting", 8)} \${padL("start", 5)} \${padL("finish", 7)}\`);
for (const [name, s, e] of order) {
  console.log(\`  \${padR(name, 8)} \${padL(s, 5)} \${padL(e, 7)}\`);
}
console.log();

const booked: Meeting[] = [];
let freeAt = 0;
console.log("one scan, one variable — the time the room next comes free:");
for (const [name, s, e] of order) {
  if (s >= freeAt) {
    booked.push([name, s, e]);
    console.log(\`  \${name}: starts \${s} >= \${freeAt}, book it. room busy until \${e}\`);
    freeAt = e;
  } else {
    console.log(\`  \${name}: starts \${s} <  \${freeAt}, drop it. never reconsidered\`);
  }
}

console.log();
console.log(\`booked \${booked.map(([n]) => n).join(", ")} — \${booked.length} meetings\`);
console.log();

// Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
function valid(combo: Meeting[]): boolean {
  const c = [...combo].sort((a, b) => a[1] - b[1]);
  return c.every((m, i) => i === 0 || m[1] >= c[i - 1][2]);
}

console.log("the invariant, checked against every valid schedule:");
console.log(\`  \${padL("k", 2)} \${padL("greedy finishes at", 19)} \${padL("best any schedule can do", 26)}\`);
for (let k = 1; k <= booked.length; k++) {
  let best = Infinity;
  for (let mask = 0; mask < 1 << meetings.length; mask++) {
    const combo = meetings.filter((_, i) => (mask >> i) & 1);
    if (combo.length !== k || !valid(combo)) continue;
    const byStart = [...combo].sort((a, b) => a[1] - b[1]);
    best = Math.min(best, Math.max(...byStart.slice(0, k).map((m) => m[2])));
  }
  console.log(\`  \${padL(k, 2)} \${padL(booked[k - 1][2], 19)} \${padL(best, 26)}\`);
}

console.log();
console.log("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.");
console.log("so it never runs out of room first, and no schedule can hold more.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    record Meeting(String name, int start, int finish) {}

    static boolean valid(List<Meeting> combo) {
        List<Meeting> c = new ArrayList<>(combo);
        c.sort(Comparator.comparingInt(Meeting::start));
        for (int i = 1; i < c.size(); i++) {
            if (c.get(i).start() < c.get(i - 1).finish()) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        List<Meeting> meetings = List.of(
                new Meeting("A", 1, 4), new Meeting("B", 3, 5), new Meeting("C", 0, 6),
                new Meeting("D", 5, 7), new Meeting("E", 3, 9), new Meeting("F", 6, 10),
                new Meeting("G", 8, 11));

        // Sorting by finishing time is the algorithm. The scan below never sorts again.
        List<Meeting> order = new ArrayList<>(meetings);
        order.sort(Comparator.comparingInt(Meeting::finish));
        System.out.println("sorted by finishing time:");
        System.out.printf("  %-8s %5s %7s%n", "meeting", "start", "finish");
        for (Meeting m : order) {
            System.out.printf("  %-8s %5d %7d%n", m.name(), m.start(), m.finish());
        }
        System.out.println();

        List<Meeting> booked = new ArrayList<>();
        int freeAt = 0;
        System.out.println("one scan, one variable — the time the room next comes free:");
        for (Meeting m : order) {
            if (m.start() >= freeAt) {
                booked.add(m);
                System.out.println("  " + m.name() + ": starts " + m.start() + " >= " + freeAt
                        + ", book it. room busy until " + m.finish());
                freeAt = m.finish();
            } else {
                System.out.println("  " + m.name() + ": starts " + m.start() + " <  " + freeAt
                        + ", drop it. never reconsidered");
            }
        }

        List<String> names = new ArrayList<>();
        for (Meeting m : booked) names.add(m.name());
        System.out.println();
        System.out.println("booked " + String.join(", ", names) + " — " + booked.size() + " meetings");
        System.out.println();

        // Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
        System.out.println("the invariant, checked against every valid schedule:");
        System.out.printf("  %2s %19s %26s%n", "k", "greedy finishes at", "best any schedule can do");
        for (int k = 1; k <= booked.size(); k++) {
            int best = Integer.MAX_VALUE;
            for (int mask = 0; mask < 1 << meetings.size(); mask++) {
                List<Meeting> combo = new ArrayList<>();
                for (int i = 0; i < meetings.size(); i++) {
                    if ((mask >> i & 1) == 1) combo.add(meetings.get(i));
                }
                if (combo.size() != k || !valid(combo)) continue;
                combo.sort(Comparator.comparingInt(Meeting::start));
                int latest = 0;
                for (int i = 0; i < k; i++) latest = Math.max(latest, combo.get(i).finish());
                best = Math.min(best, latest);
            }
            System.out.printf("  %2d %19d %26d%n", k, booked.get(k - 1).finish(), best);
        }

        System.out.println();
        System.out.println("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.");
        System.out.println("so it never runs out of room first, and no schedule can hold more.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <climits>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Meeting {
    std::string name;
    int start, finish;
};

bool valid(std::vector<Meeting> combo) {
    std::stable_sort(combo.begin(), combo.end(),
                     [](const Meeting& a, const Meeting& b) { return a.start < b.start; });
    for (std::size_t i = 1; i < combo.size(); i++) {
        if (combo[i].start < combo[i - 1].finish) return false;
    }
    return true;
}

int main() {
    std::vector<Meeting> meetings = {
        {"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
        {"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
    };

    // Sorting by finishing time is the algorithm. The scan below never sorts again.
    std::vector<Meeting> order = meetings;
    std::stable_sort(order.begin(), order.end(),
                     [](const Meeting& a, const Meeting& b) { return a.finish < b.finish; });
    std::cout << "sorted by finishing time:\\n";
    std::cout << "  " << std::left << std::setw(8) << "meeting" << std::right << ' '
              << std::setw(5) << "start" << ' ' << std::setw(7) << "finish" << '\\n';
    for (const Meeting& m : order) {
        std::cout << "  " << std::left << std::setw(8) << m.name << std::right << ' '
                  << std::setw(5) << m.start << ' ' << std::setw(7) << m.finish << '\\n';
    }
    std::cout << '\\n';

    std::vector<Meeting> booked;
    int freeAt = 0;
    std::cout << "one scan, one variable — the time the room next comes free:\\n";
    for (const Meeting& m : order) {
        if (m.start >= freeAt) {
            booked.push_back(m);
            std::cout << "  " << m.name << ": starts " << m.start << " >= " << freeAt
                      << ", book it. room busy until " << m.finish << '\\n';
            freeAt = m.finish;
        } else {
            std::cout << "  " << m.name << ": starts " << m.start << " <  " << freeAt
                      << ", drop it. never reconsidered\\n";
        }
    }

    std::cout << "\\nbooked ";
    for (std::size_t i = 0; i < booked.size(); i++) std::cout << (i ? ", " : "") << booked[i].name;
    std::cout << " — " << booked.size() << " meetings\\n\\n";

    // Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
    std::cout << "the invariant, checked against every valid schedule:\\n";
    std::cout << "  " << std::setw(2) << "k" << ' ' << std::setw(19) << "greedy finishes at" << ' '
              << std::setw(26) << "best any schedule can do" << '\\n';
    const int n = static_cast<int>(meetings.size());
    for (std::size_t k = 1; k <= booked.size(); k++) {
        int best = INT_MAX;
        for (int mask = 0; mask < 1 << n; mask++) {
            std::vector<Meeting> combo;
            for (int i = 0; i < n; i++) {
                if (mask >> i & 1) combo.push_back(meetings[static_cast<std::size_t>(i)]);
            }
            if (combo.size() != k || !valid(combo)) continue;
            std::stable_sort(combo.begin(), combo.end(),
                             [](const Meeting& a, const Meeting& b) { return a.start < b.start; });
            int latest = 0;
            for (std::size_t i = 0; i < k; i++) latest = std::max(latest, combo[i].finish);
            best = std::min(best, latest);
        }
        std::cout << "  " << std::setw(2) << k << ' ' << std::setw(19) << booked[k - 1].finish
                  << ' ' << std::setw(26) << best << '\\n';
    }

    std::cout << "\\ngreedy's k-th meeting finishes no later than anyone else's k-th, for every k.\\n";
    std::cout << "so it never runs out of room first, and no schedule can hold more.\\n";
}`,
            },
            {
              lang: "rust",
              code: `#[derive(Clone)]
struct Meeting {
    name: &'static str,
    start: i32,
    finish: i32,
}

fn valid(combo: &[Meeting]) -> bool {
    let mut c = combo.to_vec();
    c.sort_by_key(|m| m.start);
    (1..c.len()).all(|i| c[i].start >= c[i - 1].finish)
}

fn main() {
    let meetings = vec![
        Meeting { name: "A", start: 1, finish: 4 },
        Meeting { name: "B", start: 3, finish: 5 },
        Meeting { name: "C", start: 0, finish: 6 },
        Meeting { name: "D", start: 5, finish: 7 },
        Meeting { name: "E", start: 3, finish: 9 },
        Meeting { name: "F", start: 6, finish: 10 },
        Meeting { name: "G", start: 8, finish: 11 },
    ];

    // Sorting by finishing time is the algorithm. The scan below never sorts again.
    let mut order = meetings.clone();
    order.sort_by_key(|m| m.finish);
    println!("sorted by finishing time:");
    println!("  {:<8} {:>5} {:>7}", "meeting", "start", "finish");
    for m in &order {
        println!("  {:<8} {:>5} {:>7}", m.name, m.start, m.finish);
    }
    println!();

    let mut booked: Vec<Meeting> = Vec::new();
    let mut free_at = 0;
    println!("one scan, one variable — the time the room next comes free:");
    for m in &order {
        if m.start >= free_at {
            println!("  {}: starts {} >= {}, book it. room busy until {}",
                     m.name, m.start, free_at, m.finish);
            booked.push(m.clone());
            free_at = m.finish;
        } else {
            println!("  {}: starts {} <  {}, drop it. never reconsidered",
                     m.name, m.start, free_at);
        }
    }

    let names: Vec<&str> = booked.iter().map(|m| m.name).collect();
    println!();
    println!("booked {} — {} meetings", names.join(", "), booked.len());
    println!();

    // Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
    println!("the invariant, checked against every valid schedule:");
    println!("  {:>2} {:>19} {:>26}", "k", "greedy finishes at", "best any schedule can do");
    let n = meetings.len();
    for k in 1..=booked.len() {
        let mut best = i32::MAX;
        for mask in 0..(1u32 << n) {
            let mut combo: Vec<Meeting> = (0..n)
                .filter(|i| mask >> i & 1 == 1)
                .map(|i| meetings[i].clone())
                .collect();
            if combo.len() != k || !valid(&combo) {
                continue;
            }
            combo.sort_by_key(|m| m.start);
            let latest = combo[..k].iter().map(|m| m.finish).max().unwrap();
            best = best.min(latest);
        }
        println!("  {:>2} {:>19} {:>26}", k, booked[k - 1].finish, best);
    }

    println!();
    println!("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.");
    println!("so it never runs out of room first, and no schedule can hold more.");
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

type meeting struct {
	name          string
	start, finish int
}

func valid(combo []meeting) bool {
	c := append([]meeting(nil), combo...)
	sort.SliceStable(c, func(i, j int) bool { return c[i].start < c[j].start })
	for i := 1; i < len(c); i++ {
		if c[i].start < c[i-1].finish {
			return false
		}
	}
	return true
}

func main() {
	meetings := []meeting{
		{"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
		{"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
	}

	// Sorting by finishing time is the algorithm. The scan below never sorts again.
	order := append([]meeting(nil), meetings...)
	sort.SliceStable(order, func(i, j int) bool { return order[i].finish < order[j].finish })
	fmt.Println("sorted by finishing time:")
	fmt.Printf("  %-8s %5s %7s\\n", "meeting", "start", "finish")
	for _, m := range order {
		fmt.Printf("  %-8s %5d %7d\\n", m.name, m.start, m.finish)
	}
	fmt.Println()

	var booked []meeting
	freeAt := 0
	fmt.Println("one scan, one variable — the time the room next comes free:")
	for _, m := range order {
		if m.start >= freeAt {
			booked = append(booked, m)
			fmt.Printf("  %s: starts %d >= %d, book it. room busy until %d\\n",
				m.name, m.start, freeAt, m.finish)
			freeAt = m.finish
		} else {
			fmt.Printf("  %s: starts %d <  %d, drop it. never reconsidered\\n",
				m.name, m.start, freeAt)
		}
	}

	names := make([]string, len(booked))
	for i, m := range booked {
		names[i] = m.name
	}
	fmt.Println()
	fmt.Printf("booked %s — %d meetings\\n", strings.Join(names, ", "), len(booked))
	fmt.Println()

	// Stays ahead: after k bookings, no schedule finishes its k-th meeting earlier.
	fmt.Println("the invariant, checked against every valid schedule:")
	fmt.Printf("  %2s %19s %26s\\n", "k", "greedy finishes at", "best any schedule can do")
	n := len(meetings)
	for k := 1; k <= len(booked); k++ {
		best := 1 << 30
		for mask := 0; mask < 1<<n; mask++ {
			var combo []meeting
			for i := 0; i < n; i++ {
				if mask>>i&1 == 1 {
					combo = append(combo, meetings[i])
				}
			}
			if len(combo) != k || !valid(combo) {
				continue
			}
			sort.SliceStable(combo, func(i, j int) bool { return combo[i].start < combo[j].start })
			latest := 0
			for i := 0; i < k; i++ {
				if combo[i].finish > latest {
					latest = combo[i].finish
				}
			}
			if latest < best {
				best = latest
			}
		}
		fmt.Printf("  %2d %19d %26d\\n", k, booked[k-1].finish, best)
	}

	fmt.Println()
	fmt.Println("greedy's k-th meeting finishes no later than anyone else's k-th, for every k.")
	fmt.Println("so it never runs out of room first, and no schedule can hold more.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "how-many-rooms",
      heading: "The same intervals, a different question",
      body: [
        "Now nobody is turned away. Every meeting happens, and the question is how many rooms that takes.",
        "This is a different problem wearing the same clothes, and the difference is worth naming: in the first problem the greedy choice was *which meeting to keep*, and here it is *which room to reuse*. Nothing is ever rejected, so there is no irrevocable loss to worry about — which is why the second problem is easier than the first despite looking harder.",
        "The answer is the maximum number of meetings in progress at any instant, and the argument is two halves that meet. You cannot do better than that peak, because at the moment it occurs that many meetings genuinely need separate rooms. And you never need more, because a room is only opened when every existing one is busy — which is to say, only at the moment the count goes up.",
        "A sweep computes it in one pass: turn each meeting into a start event and an end event, sort by time, and track a running count. The only place this goes wrong is the tie-break at equal times, and it is worth getting right for the reason below rather than by trial and error.",
      ],
      examples: [
        {
          id: "how-many-rooms",
          title: "The sweep that counts rooms",
          lang: "python",
          code: `meetings = [
    ("A", 1, 4), ("B", 3, 5), ("C", 0, 6), ("D", 5, 7),
    ("E", 3, 9), ("F", 6, 10), ("G", 8, 11),
]

# Same meetings, opposite question: not "how many fit in one room" but
# "how many rooms are needed so that none is turned away".
events = []
for name, s, e in meetings:
    events.append((s, +1, name))
    events.append((e, -1, name))
# An end at time t must be processed before a start at t: a room freed at 5 is
# available at 5. Sorting -1 before +1 is the whole of that rule.
events.sort(key=lambda ev: (ev[0], ev[1]))

print("every start and end, in time order:")
print(f"  {'time':>4} {'event':<10} {'in progress':>12}")
live, peak, peak_at = 0, 0, None
for time, delta, name in events:
    live += delta
    label = f"{name} starts" if delta > 0 else f"{name} ends"
    if live > peak:
        peak, peak_at = live, time
    print(f"  {time:>4} {label:<10} {live:>12}")

print()
print(f"the peak is {peak}, first reached at time {peak_at}")
print(f"so {peak} rooms are needed, and {peak} is enough")
print()

overlapping = [name for name, s, e in meetings if s <= peak_at < e]
print(f"at time {peak_at} these are all in progress: {', '.join(overlapping)}")
print("no two of them can share, so no schedule does it in fewer rooms.")
print("and the sweep never needs more, because it only opens a room when")
print("every existing one is busy — the count is exactly the peak.")
print()
print("note what changed from the previous problem: nothing was rejected.")
print("the greedy choice here is which room to reuse, not which meeting to keep.")`,
          output: `every start and end, in time order:
  time event       in progress
     0 C starts              1
     1 A starts              2
     3 B starts              3
     3 E starts              4
     4 A ends                3
     5 B ends                2
     5 D starts              3
     6 C ends                2
     6 F starts              3
     7 D ends                2
     8 G starts              3
     9 E ends                2
    10 F ends                1
    11 G ends                0

the peak is 4, first reached at time 3
so 4 rooms are needed, and 4 is enough

at time 3 these are all in progress: A, B, C, E
no two of them can share, so no schedule does it in fewer rooms.
and the sweep never needs more, because it only opens a room when
every existing one is busy — the count is exactly the peak.

note what changed from the previous problem: nothing was rejected.
the greedy choice here is which room to reuse, not which meeting to keep.`,
          explanation:
            "The same meetings, and a question that sounds like the same problem but is not: rather than choosing which meetings to keep, keep all of them and ask how many rooms that needs. The answer is the largest number ever in progress at once, which a sweep finds by walking every start and end in time order with a running count. The one detail that decides correctness is the tie-break: an end at time *t* must be processed before a start at *t*, because a room freed at 5 is available at 5. Sorting `-1` before `+1` is the entire rule, and getting it backwards inflates the answer on exactly the inputs where meetings abut.",
          alternates: [
            {
              lang: "javascript",
              code: `const meetings = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Same meetings, opposite question: not "how many fit in one room" but
// "how many rooms are needed so that none is turned away".
const events = [];
for (const [name, s, e] of meetings) {
  events.push([s, +1, name]);
  events.push([e, -1, name]);
}
// An end at time t must be processed before a start at t: a room freed at 5 is
// available at 5. Sorting -1 before +1 is the whole of that rule.
events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

console.log("every start and end, in time order:");
console.log(\`  \${padL("time", 4)} \${padR("event", 10)} \${padL("in progress", 12)}\`);
let live = 0;
let peak = 0;
let peakAt = null;
for (const [time, delta, name] of events) {
  live += delta;
  const label = delta > 0 ? \`\${name} starts\` : \`\${name} ends\`;
  if (live > peak) {
    peak = live;
    peakAt = time;
  }
  console.log(\`  \${padL(time, 4)} \${padR(label, 10)} \${padL(live, 12)}\`);
}

console.log();
console.log(\`the peak is \${peak}, first reached at time \${peakAt}\`);
console.log(\`so \${peak} rooms are needed, and \${peak} is enough\`);
console.log();

const overlapping = meetings.filter(([, s, e]) => s <= peakAt && peakAt < e).map(([n]) => n);
console.log(\`at time \${peakAt} these are all in progress: \${overlapping.join(", ")}\`);
console.log("no two of them can share, so no schedule does it in fewer rooms.");
console.log("and the sweep never needs more, because it only opens a room when");
console.log("every existing one is busy — the count is exactly the peak.");
console.log();
console.log("note what changed from the previous problem: nothing was rejected.");
console.log("the greedy choice here is which room to reuse, not which meeting to keep.");`,
            },
            {
              lang: "typescript",
              code: `type Meeting = [string, number, number];
type Event = [number, number, string];

const meetings: Meeting[] = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s: string | number | null, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

// Same meetings, opposite question: not "how many fit in one room" but
// "how many rooms are needed so that none is turned away".
const events: Event[] = [];
for (const [name, s, e] of meetings) {
  events.push([s, +1, name]);
  events.push([e, -1, name]);
}
// An end at time t must be processed before a start at t: a room freed at 5 is
// available at 5. Sorting -1 before +1 is the whole of that rule.
events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

console.log("every start and end, in time order:");
console.log(\`  \${padL("time", 4)} \${padR("event", 10)} \${padL("in progress", 12)}\`);
let live = 0;
let peak = 0;
let peakAt: number | null = null;
for (const [time, delta, name] of events) {
  live += delta;
  const label = delta > 0 ? \`\${name} starts\` : \`\${name} ends\`;
  if (live > peak) {
    peak = live;
    peakAt = time;
  }
  console.log(\`  \${padL(time, 4)} \${padR(label, 10)} \${padL(live, 12)}\`);
}

console.log();
console.log(\`the peak is \${peak}, first reached at time \${peakAt}\`);
console.log(\`so \${peak} rooms are needed, and \${peak} is enough\`);
console.log();

const at = peakAt!;
const overlapping = meetings.filter(([, s, e]) => s <= at && at < e).map(([n]) => n);
console.log(\`at time \${peakAt} these are all in progress: \${overlapping.join(", ")}\`);
console.log("no two of them can share, so no schedule does it in fewer rooms.");
console.log("and the sweep never needs more, because it only opens a room when");
console.log("every existing one is busy — the count is exactly the peak.");
console.log();
console.log("note what changed from the previous problem: nothing was rejected.");
console.log("the greedy choice here is which room to reuse, not which meeting to keep.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    record Meeting(String name, int start, int finish) {}

    record Event(int time, int delta, String name) {}

    public static void main(String[] args) {
        List<Meeting> meetings = List.of(
                new Meeting("A", 1, 4), new Meeting("B", 3, 5), new Meeting("C", 0, 6),
                new Meeting("D", 5, 7), new Meeting("E", 3, 9), new Meeting("F", 6, 10),
                new Meeting("G", 8, 11));

        // Same meetings, opposite question: not "how many fit in one room" but
        // "how many rooms are needed so that none is turned away".
        List<Event> events = new ArrayList<>();
        for (Meeting m : meetings) {
            events.add(new Event(m.start(), +1, m.name()));
            events.add(new Event(m.finish(), -1, m.name()));
        }
        // An end at time t must be processed before a start at t: a room freed at 5 is
        // available at 5. Sorting -1 before +1 is the whole of that rule.
        events.sort(Comparator.comparingInt(Event::time).thenComparingInt(Event::delta));

        System.out.println("every start and end, in time order:");
        System.out.printf("  %4s %-10s %12s%n", "time", "event", "in progress");
        int live = 0;
        int peak = 0;
        Integer peakAt = null;
        for (Event ev : events) {
            live += ev.delta();
            String label = ev.delta() > 0 ? ev.name() + " starts" : ev.name() + " ends";
            if (live > peak) {
                peak = live;
                peakAt = ev.time();
            }
            System.out.printf("  %4d %-10s %12d%n", ev.time(), label, live);
        }

        System.out.println();
        System.out.println("the peak is " + peak + ", first reached at time " + peakAt);
        System.out.println("so " + peak + " rooms are needed, and " + peak + " is enough");
        System.out.println();

        List<String> overlapping = new ArrayList<>();
        for (Meeting m : meetings) {
            if (m.start() <= peakAt && peakAt < m.finish()) overlapping.add(m.name());
        }
        System.out.println("at time " + peakAt + " these are all in progress: "
                + String.join(", ", overlapping));
        System.out.println("no two of them can share, so no schedule does it in fewer rooms.");
        System.out.println("and the sweep never needs more, because it only opens a room when");
        System.out.println("every existing one is busy — the count is exactly the peak.");
        System.out.println();
        System.out.println("note what changed from the previous problem: nothing was rejected.");
        System.out.println("the greedy choice here is which room to reuse, not which meeting to keep.");
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

struct Meeting {
    std::string name;
    int start, finish;
};

struct Event {
    int time, delta;
    std::string name;
};

int main() {
    std::vector<Meeting> meetings = {
        {"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
        {"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
    };

    // Same meetings, opposite question: not "how many fit in one room" but
    // "how many rooms are needed so that none is turned away".
    std::vector<Event> events;
    for (const Meeting& m : meetings) {
        events.push_back({m.start, +1, m.name});
        events.push_back({m.finish, -1, m.name});
    }
    // An end at time t must be processed before a start at t: a room freed at 5 is
    // available at 5. Sorting -1 before +1 is the whole of that rule.
    std::stable_sort(events.begin(), events.end(), [](const Event& a, const Event& b) {
        return a.time != b.time ? a.time < b.time : a.delta < b.delta;
    });

    std::cout << "every start and end, in time order:\\n";
    std::cout << "  " << std::setw(4) << "time" << ' ' << std::left << std::setw(10) << "event"
              << std::right << ' ' << std::setw(12) << "in progress" << '\\n';
    int live = 0, peak = 0, peakAt = 0;
    for (const Event& ev : events) {
        live += ev.delta;
        std::string label = ev.name + (ev.delta > 0 ? " starts" : " ends");
        if (live > peak) {
            peak = live;
            peakAt = ev.time;
        }
        std::cout << "  " << std::setw(4) << ev.time << ' ' << std::left << std::setw(10) << label
                  << std::right << ' ' << std::setw(12) << live << '\\n';
    }

    std::cout << "\\nthe peak is " << peak << ", first reached at time " << peakAt << '\\n';
    std::cout << "so " << peak << " rooms are needed, and " << peak << " is enough\\n\\n";

    std::string overlapping;
    for (const Meeting& m : meetings) {
        if (m.start <= peakAt && peakAt < m.finish) {
            if (!overlapping.empty()) overlapping += ", ";
            overlapping += m.name;
        }
    }
    std::cout << "at time " << peakAt << " these are all in progress: " << overlapping << '\\n';
    std::cout << "no two of them can share, so no schedule does it in fewer rooms.\\n";
    std::cout << "and the sweep never needs more, because it only opens a room when\\n";
    std::cout << "every existing one is busy — the count is exactly the peak.\\n\\n";
    std::cout << "note what changed from the previous problem: nothing was rejected.\\n";
    std::cout << "the greedy choice here is which room to reuse, not which meeting to keep.\\n";
}`,
            },
            {
              lang: "rust",
              code: `struct Meeting {
    name: &'static str,
    start: i32,
    finish: i32,
}

struct Event {
    time: i32,
    delta: i32,
    name: &'static str,
}

fn main() {
    let meetings = vec![
        Meeting { name: "A", start: 1, finish: 4 },
        Meeting { name: "B", start: 3, finish: 5 },
        Meeting { name: "C", start: 0, finish: 6 },
        Meeting { name: "D", start: 5, finish: 7 },
        Meeting { name: "E", start: 3, finish: 9 },
        Meeting { name: "F", start: 6, finish: 10 },
        Meeting { name: "G", start: 8, finish: 11 },
    ];

    // Same meetings, opposite question: not "how many fit in one room" but
    // "how many rooms are needed so that none is turned away".
    let mut events: Vec<Event> = Vec::new();
    for m in &meetings {
        events.push(Event { time: m.start, delta: 1, name: m.name });
        events.push(Event { time: m.finish, delta: -1, name: m.name });
    }
    // An end at time t must be processed before a start at t: a room freed at 5 is
    // available at 5. Sorting -1 before +1 is the whole of that rule.
    events.sort_by_key(|e| (e.time, e.delta));

    println!("every start and end, in time order:");
    println!("  {:>4} {:<10} {:>12}", "time", "event", "in progress");
    let mut live = 0;
    let mut peak = 0;
    let mut peak_at = 0;
    for ev in &events {
        live += ev.delta;
        let label = format!("{} {}", ev.name, if ev.delta > 0 { "starts" } else { "ends" });
        if live > peak {
            peak = live;
            peak_at = ev.time;
        }
        println!("  {:>4} {:<10} {:>12}", ev.time, label, live);
    }

    println!();
    println!("the peak is {}, first reached at time {}", peak, peak_at);
    println!("so {} rooms are needed, and {} is enough", peak, peak);
    println!();

    let overlapping: Vec<&str> = meetings.iter()
        .filter(|m| m.start <= peak_at && peak_at < m.finish)
        .map(|m| m.name)
        .collect();
    println!("at time {} these are all in progress: {}", peak_at, overlapping.join(", "));
    println!("no two of them can share, so no schedule does it in fewer rooms.");
    println!("and the sweep never needs more, because it only opens a room when");
    println!("every existing one is busy — the count is exactly the peak.");
    println!();
    println!("note what changed from the previous problem: nothing was rejected.");
    println!("the greedy choice here is which room to reuse, not which meeting to keep.");
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

type meeting struct {
	name          string
	start, finish int
}

type event struct {
	time, delta int
	name        string
}

func main() {
	meetings := []meeting{
		{"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
		{"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
	}

	// Same meetings, opposite question: not "how many fit in one room" but
	// "how many rooms are needed so that none is turned away".
	var events []event
	for _, m := range meetings {
		events = append(events, event{m.start, +1, m.name})
		events = append(events, event{m.finish, -1, m.name})
	}
	// An end at time t must be processed before a start at t: a room freed at 5 is
	// available at 5. Sorting -1 before +1 is the whole of that rule.
	sort.SliceStable(events, func(i, j int) bool {
		if events[i].time != events[j].time {
			return events[i].time < events[j].time
		}
		return events[i].delta < events[j].delta
	})

	fmt.Println("every start and end, in time order:")
	fmt.Printf("  %4s %-10s %12s\\n", "time", "event", "in progress")
	live, peak, peakAt := 0, 0, 0
	for _, ev := range events {
		live += ev.delta
		word := "ends"
		if ev.delta > 0 {
			word = "starts"
		}
		if live > peak {
			peak = live
			peakAt = ev.time
		}
		fmt.Printf("  %4d %-10s %12d\\n", ev.time, ev.name+" "+word, live)
	}

	fmt.Println()
	fmt.Printf("the peak is %d, first reached at time %d\\n", peak, peakAt)
	fmt.Printf("so %d rooms are needed, and %d is enough\\n", peak, peak)
	fmt.Println()

	var overlapping []string
	for _, m := range meetings {
		if m.start <= peakAt && peakAt < m.finish {
			overlapping = append(overlapping, m.name)
		}
	}
	fmt.Printf("at time %d these are all in progress: %s\\n", peakAt, strings.Join(overlapping, ", "))
	fmt.Println("no two of them can share, so no schedule does it in fewer rooms.")
	fmt.Println("and the sweep never needs more, because it only opens a room when")
	fmt.Println("every existing one is busy — the count is exactly the peak.")
	fmt.Println()
	fmt.Println("note what changed from the previous problem: nothing was rejected.")
	fmt.Println("the greedy choice here is which room to reuse, not which meeting to keep.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-family",
      heading: "The family, and the one that only looks like it",
      body: [
        "Interval problems are asked in several phrasings that reduce to the same scan, and spotting that is most of the value of this lesson. The most meetings that fit in one room, the fewest meetings to cancel so that none clash, and whether the whole list can be attended as it stands are one algorithm and two subtractions.",
        "Then there is the one that breaks the pattern. Give every meeting a value and ask for the most valuable set rather than the largest, and the earliest-finish rule stops being correct — not marginally, but badly, because one long valuable meeting can be worth more than every short one put together.",
        "The tell is in the objective rather than in the shape of the input. Greedy rules are proven against a particular thing being maximised, and changing what is being counted invalidates the proof even though the code still compiles and the intervals still look the same. When a problem attaches numbers to the items, check whether your rule was ever proven for a weighted objective — usually it was not.",
      ],
      examples: [
        {
          id: "the-family-and-its-impostor",
          title: "Three questions, one scan — and one that is not",
          lang: "python",
          code: `meetings = [
    ("A", 1, 4), ("B", 3, 5), ("C", 0, 6), ("D", 5, 7),
    ("E", 3, 9), ("F", 6, 10), ("G", 8, 11),
]


def earliest_finish(items):
    """The one scan. Everything in this section is a way of reading its result."""
    kept, free_at = [], 0
    for name, s, e in sorted(items, key=lambda m: m[2]):
        if s >= free_at:
            kept.append(name)
            free_at = e
    return kept


kept = earliest_finish(meetings)
n = len(meetings)

print("three questions, one scan:")
print(f"  most meetings in one room          {len(kept)}   ({', '.join(kept)})")
print(f"  fewest to cancel for no clashes    {n - len(kept)}   (the other {n - len(kept)})")
print(f"  can every meeting be attended?     {'yes' if len(kept) == n else 'no'}")
print()
print("the second is the first subtracted from n, and the third is the first")
print("compared with n. an interview asks all three and they are one algorithm.")
print()

# Now the variant that looks identical and is not.
values = {"A": 1, "B": 1, "C": 10, "D": 1, "E": 1, "F": 1, "G": 1}
print("now give each meeting a value, and ask for the most valuable schedule:")
print(f"  {'meeting':<8} {'start':>5} {'finish':>7} {'value':>6}")
for name, s, e in meetings:
    print(f"  {name:<8} {s:>5} {e:>7} {values[name]:>6}")
print()

greedy_value = sum(values[n_] for n_ in kept)
print(f"earliest finish still picks {', '.join(kept)}, worth {greedy_value}")

best, best_set = 0, []
for mask in range(1 << len(meetings)):
    chosen = [meetings[i] for i in range(len(meetings)) if mask >> i & 1]
    ordered = sorted(chosen, key=lambda m: m[1])
    if all(ordered[i][1] >= ordered[i - 1][2] for i in range(1, len(ordered))):
        total = sum(values[m[0]] for m in ordered)
        if total > best:
            best, best_set = total, [m[0] for m in ordered]

print(f"the best schedule is {', '.join(best_set)}, worth {best}")
print()
print("counting and adding up are not the same objective, and the rule that")
print("is provably right for one is wrong by 8 for the other. weighted interval")
print("scheduling has optimal substructure but no greedy choice property —")
print("it is a dynamic programming problem, and the last lesson comes back to it.")`,
          output: `three questions, one scan:
  most meetings in one room          3   (A, D, G)
  fewest to cancel for no clashes    4   (the other 4)
  can every meeting be attended?     no

the second is the first subtracted from n, and the third is the first
compared with n. an interview asks all three and they are one algorithm.

now give each meeting a value, and ask for the most valuable schedule:
  meeting  start  finish  value
  A            1       4      1
  B            3       5      1
  C            0       6     10
  D            5       7      1
  E            3       9      1
  F            6      10      1
  G            8      11      1

earliest finish still picks A, D, G, worth 3
the best schedule is C, F, worth 11

counting and adding up are not the same objective, and the rule that
is provably right for one is wrong by 8 for the other. weighted interval
scheduling has optimal substructure but no greedy choice property —
it is a dynamic programming problem, and the last lesson comes back to it.`,
          explanation:
            "Three of the four questions here are the same algorithm read differently: the most meetings that fit, the fewest to cancel (which is n minus that), and whether every meeting can be attended (which is that compared with n). Recognising this is worth more than memorising three algorithms, because an interview will ask whichever phrasing it likes. The fourth is the trap. Attaching a value to each meeting and asking for the most valuable schedule looks like the same problem and is not: earliest-finish scores 3 where 11 was available. Counting and adding up are different objectives, and the rule proven correct for one has nothing to say about the other. Weighted interval scheduling keeps optimal substructure but loses the greedy choice property, which puts it in the dynamic programming chapter.",
          alternates: [
            {
              lang: "javascript",
              code: `const meetings = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

/** The one scan. Everything in this section is a way of reading its result. */
function earliestFinish(items) {
  const kept = [];
  let freeAt = 0;
  for (const [name, s, e] of [...items].sort((a, b) => a[2] - b[2])) {
    if (s >= freeAt) {
      kept.push(name);
      freeAt = e;
    }
  }
  return kept;
}

const kept = earliestFinish(meetings);
const n = meetings.length;

console.log("three questions, one scan:");
console.log(\`  most meetings in one room          \${kept.length}   (\${kept.join(", ")})\`);
console.log(\`  fewest to cancel for no clashes    \${n - kept.length}   (the other \${n - kept.length})\`);
console.log(\`  can every meeting be attended?     \${kept.length === n ? "yes" : "no"}\`);
console.log();
console.log("the second is the first subtracted from n, and the third is the first");
console.log("compared with n. an interview asks all three and they are one algorithm.");
console.log();

// Now the variant that looks identical and is not.
const values = { A: 1, B: 1, C: 10, D: 1, E: 1, F: 1, G: 1 };
console.log("now give each meeting a value, and ask for the most valuable schedule:");
console.log(\`  \${padR("meeting", 8)} \${padL("start", 5)} \${padL("finish", 7)} \${padL("value", 6)}\`);
for (const [name, s, e] of meetings) {
  console.log(\`  \${padR(name, 8)} \${padL(s, 5)} \${padL(e, 7)} \${padL(values[name], 6)}\`);
}
console.log();

const greedyValue = kept.reduce((s, name) => s + values[name], 0);
console.log(\`earliest finish still picks \${kept.join(", ")}, worth \${greedyValue}\`);

let best = 0;
let bestSet = [];
for (let mask = 0; mask < 1 << meetings.length; mask++) {
  const chosen = meetings.filter((_, i) => (mask >> i) & 1);
  const ordered = [...chosen].sort((a, b) => a[1] - b[1]);
  let ok = true;
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i][1] < ordered[i - 1][2]) ok = false;
  }
  if (!ok) continue;
  const total = ordered.reduce((s, m) => s + values[m[0]], 0);
  if (total > best) {
    best = total;
    bestSet = ordered.map((m) => m[0]);
  }
}

console.log(\`the best schedule is \${bestSet.join(", ")}, worth \${best}\`);
console.log();
console.log("counting and adding up are not the same objective, and the rule that");
console.log("is provably right for one is wrong by 8 for the other. weighted interval");
console.log("scheduling has optimal substructure but no greedy choice property —");
console.log("it is a dynamic programming problem, and the last lesson comes back to it.");`,
            },
            {
              lang: "typescript",
              code: `type Meeting = [string, number, number];

const meetings: Meeting[] = [
  ["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7],
  ["E", 3, 9], ["F", 6, 10], ["G", 8, 11],
];

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);

/** The one scan. Everything in this section is a way of reading its result. */
function earliestFinish(items: Meeting[]): string[] {
  const kept: string[] = [];
  let freeAt = 0;
  for (const [name, s, e] of [...items].sort((a, b) => a[2] - b[2])) {
    if (s >= freeAt) {
      kept.push(name);
      freeAt = e;
    }
  }
  return kept;
}

const kept = earliestFinish(meetings);
const n = meetings.length;

console.log("three questions, one scan:");
console.log(\`  most meetings in one room          \${kept.length}   (\${kept.join(", ")})\`);
console.log(\`  fewest to cancel for no clashes    \${n - kept.length}   (the other \${n - kept.length})\`);
console.log(\`  can every meeting be attended?     \${kept.length === n ? "yes" : "no"}\`);
console.log();
console.log("the second is the first subtracted from n, and the third is the first");
console.log("compared with n. an interview asks all three and they are one algorithm.");
console.log();

// Now the variant that looks identical and is not.
const values: Record<string, number> = { A: 1, B: 1, C: 10, D: 1, E: 1, F: 1, G: 1 };
console.log("now give each meeting a value, and ask for the most valuable schedule:");
console.log(\`  \${padR("meeting", 8)} \${padL("start", 5)} \${padL("finish", 7)} \${padL("value", 6)}\`);
for (const [name, s, e] of meetings) {
  console.log(\`  \${padR(name, 8)} \${padL(s, 5)} \${padL(e, 7)} \${padL(values[name], 6)}\`);
}
console.log();

const greedyValue = kept.reduce((s, name) => s + values[name], 0);
console.log(\`earliest finish still picks \${kept.join(", ")}, worth \${greedyValue}\`);

let best = 0;
let bestSet: string[] = [];
for (let mask = 0; mask < 1 << meetings.length; mask++) {
  const chosen = meetings.filter((_, i) => (mask >> i) & 1);
  const ordered = [...chosen].sort((a, b) => a[1] - b[1]);
  let ok = true;
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i][1] < ordered[i - 1][2]) ok = false;
  }
  if (!ok) continue;
  const total = ordered.reduce((s, m) => s + values[m[0]], 0);
  if (total > best) {
    best = total;
    bestSet = ordered.map((m) => m[0]);
  }
}

console.log(\`the best schedule is \${bestSet.join(", ")}, worth \${best}\`);
console.log();
console.log("counting and adding up are not the same objective, and the rule that");
console.log("is provably right for one is wrong by 8 for the other. weighted interval");
console.log("scheduling has optimal substructure but no greedy choice property —");
console.log("it is a dynamic programming problem, and the last lesson comes back to it.");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    record Meeting(String name, int start, int finish) {}

    /** The one scan. Everything in this section is a way of reading its result. */
    static List<String> earliestFinish(List<Meeting> items) {
        List<Meeting> order = new ArrayList<>(items);
        order.sort(Comparator.comparingInt(Meeting::finish));
        List<String> kept = new ArrayList<>();
        int freeAt = 0;
        for (Meeting m : order) {
            if (m.start() >= freeAt) {
                kept.add(m.name());
                freeAt = m.finish();
            }
        }
        return kept;
    }

    public static void main(String[] args) {
        List<Meeting> meetings = List.of(
                new Meeting("A", 1, 4), new Meeting("B", 3, 5), new Meeting("C", 0, 6),
                new Meeting("D", 5, 7), new Meeting("E", 3, 9), new Meeting("F", 6, 10),
                new Meeting("G", 8, 11));

        List<String> kept = earliestFinish(meetings);
        int n = meetings.size();

        System.out.println("three questions, one scan:");
        System.out.println("  most meetings in one room          " + kept.size()
                + "   (" + String.join(", ", kept) + ")");
        System.out.println("  fewest to cancel for no clashes    " + (n - kept.size())
                + "   (the other " + (n - kept.size()) + ")");
        System.out.println("  can every meeting be attended?     "
                + (kept.size() == n ? "yes" : "no"));
        System.out.println();
        System.out.println("the second is the first subtracted from n, and the third is the first");
        System.out.println("compared with n. an interview asks all three and they are one algorithm.");
        System.out.println();

        // Now the variant that looks identical and is not.
        Map<String, Integer> values = new LinkedHashMap<>();
        values.put("A", 1); values.put("B", 1); values.put("C", 10); values.put("D", 1);
        values.put("E", 1); values.put("F", 1); values.put("G", 1);

        System.out.println("now give each meeting a value, and ask for the most valuable schedule:");
        System.out.printf("  %-8s %5s %7s %6s%n", "meeting", "start", "finish", "value");
        for (Meeting m : meetings) {
            System.out.printf("  %-8s %5d %7d %6d%n",
                    m.name(), m.start(), m.finish(), values.get(m.name()));
        }
        System.out.println();

        int greedyValue = 0;
        for (String name : kept) greedyValue += values.get(name);
        System.out.println("earliest finish still picks " + String.join(", ", kept)
                + ", worth " + greedyValue);

        int best = 0;
        List<String> bestSet = new ArrayList<>();
        for (int mask = 0; mask < 1 << n; mask++) {
            List<Meeting> chosen = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask >> i & 1) == 1) chosen.add(meetings.get(i));
            }
            chosen.sort(Comparator.comparingInt(Meeting::start));
            boolean ok = true;
            for (int i = 1; i < chosen.size(); i++) {
                if (chosen.get(i).start() < chosen.get(i - 1).finish()) ok = false;
            }
            if (!ok) continue;
            int total = 0;
            for (Meeting m : chosen) total += values.get(m.name());
            if (total > best) {
                best = total;
                bestSet = new ArrayList<>();
                for (Meeting m : chosen) bestSet.add(m.name());
            }
        }

        System.out.println("the best schedule is " + String.join(", ", bestSet)
                + ", worth " + best);
        System.out.println();
        System.out.println("counting and adding up are not the same objective, and the rule that");
        System.out.println("is provably right for one is wrong by 8 for the other. weighted interval");
        System.out.println("scheduling has optimal substructure but no greedy choice property —");
        System.out.println("it is a dynamic programming problem, and the last lesson comes back to it.");
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

struct Meeting {
    std::string name;
    int start, finish;
};

/** The one scan. Everything in this section is a way of reading its result. */
std::vector<std::string> earliestFinish(std::vector<Meeting> items) {
    std::stable_sort(items.begin(), items.end(),
                     [](const Meeting& a, const Meeting& b) { return a.finish < b.finish; });
    std::vector<std::string> kept;
    int freeAt = 0;
    for (const Meeting& m : items) {
        if (m.start >= freeAt) {
            kept.push_back(m.name);
            freeAt = m.finish;
        }
    }
    return kept;
}

std::string join(const std::vector<std::string>& parts) {
    std::string out;
    for (std::size_t i = 0; i < parts.size(); i++) out += (i ? ", " : "") + parts[i];
    return out;
}

int main() {
    std::vector<Meeting> meetings = {
        {"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
        {"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
    };

    std::vector<std::string> kept = earliestFinish(meetings);
    const int n = static_cast<int>(meetings.size());

    std::cout << "three questions, one scan:\\n";
    std::cout << "  most meetings in one room          " << kept.size()
              << "   (" << join(kept) << ")\\n";
    std::cout << "  fewest to cancel for no clashes    " << n - static_cast<int>(kept.size())
              << "   (the other " << n - static_cast<int>(kept.size()) << ")\\n";
    std::cout << "  can every meeting be attended?     "
              << (static_cast<int>(kept.size()) == n ? "yes" : "no") << '\\n';
    std::cout << "\\nthe second is the first subtracted from n, and the third is the first\\n";
    std::cout << "compared with n. an interview asks all three and they are one algorithm.\\n\\n";

    // Now the variant that looks identical and is not.
    std::map<std::string, int> values = {
        {"A", 1}, {"B", 1}, {"C", 10}, {"D", 1}, {"E", 1}, {"F", 1}, {"G", 1},
    };

    std::cout << "now give each meeting a value, and ask for the most valuable schedule:\\n";
    std::cout << "  " << std::left << std::setw(8) << "meeting" << std::right << ' '
              << std::setw(5) << "start" << ' ' << std::setw(7) << "finish" << ' '
              << std::setw(6) << "value" << '\\n';
    for (const Meeting& m : meetings) {
        std::cout << "  " << std::left << std::setw(8) << m.name << std::right << ' '
                  << std::setw(5) << m.start << ' ' << std::setw(7) << m.finish << ' '
                  << std::setw(6) << values[m.name] << '\\n';
    }
    std::cout << '\\n';

    int greedyValue = 0;
    for (const std::string& name : kept) greedyValue += values[name];
    std::cout << "earliest finish still picks " << join(kept) << ", worth " << greedyValue << '\\n';

    int best = 0;
    std::vector<std::string> bestSet;
    for (int mask = 0; mask < 1 << n; mask++) {
        std::vector<Meeting> chosen;
        for (int i = 0; i < n; i++) {
            if (mask >> i & 1) chosen.push_back(meetings[static_cast<std::size_t>(i)]);
        }
        std::stable_sort(chosen.begin(), chosen.end(),
                         [](const Meeting& a, const Meeting& b) { return a.start < b.start; });
        bool ok = true;
        for (std::size_t i = 1; i < chosen.size(); i++) {
            if (chosen[i].start < chosen[i - 1].finish) ok = false;
        }
        if (!ok) continue;
        int total = 0;
        for (const Meeting& m : chosen) total += values[m.name];
        if (total > best) {
            best = total;
            bestSet.clear();
            for (const Meeting& m : chosen) bestSet.push_back(m.name);
        }
    }

    std::cout << "the best schedule is " << join(bestSet) << ", worth " << best << "\\n\\n";
    std::cout << "counting and adding up are not the same objective, and the rule that\\n";
    std::cout << "is provably right for one is wrong by 8 for the other. weighted interval\\n";
    std::cout << "scheduling has optimal substructure but no greedy choice property —\\n";
    std::cout << "it is a dynamic programming problem, and the last lesson comes back to it.\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

#[derive(Clone)]
struct Meeting {
    name: &'static str,
    start: i32,
    finish: i32,
}

/// The one scan. Everything in this section is a way of reading its result.
fn earliest_finish(items: &[Meeting]) -> Vec<&'static str> {
    let mut order = items.to_vec();
    order.sort_by_key(|m| m.finish);
    let mut kept: Vec<&'static str> = Vec::new();
    let mut free_at = 0;
    for m in order {
        if m.start >= free_at {
            kept.push(m.name);
            free_at = m.finish;
        }
    }
    kept
}

fn main() {
    let meetings = vec![
        Meeting { name: "A", start: 1, finish: 4 },
        Meeting { name: "B", start: 3, finish: 5 },
        Meeting { name: "C", start: 0, finish: 6 },
        Meeting { name: "D", start: 5, finish: 7 },
        Meeting { name: "E", start: 3, finish: 9 },
        Meeting { name: "F", start: 6, finish: 10 },
        Meeting { name: "G", start: 8, finish: 11 },
    ];

    let kept = earliest_finish(&meetings);
    let n = meetings.len();

    println!("three questions, one scan:");
    println!("  most meetings in one room          {}   ({})", kept.len(), kept.join(", "));
    println!("  fewest to cancel for no clashes    {}   (the other {})", n - kept.len(), n - kept.len());
    println!("  can every meeting be attended?     {}", if kept.len() == n { "yes" } else { "no" });
    println!();
    println!("the second is the first subtracted from n, and the third is the first");
    println!("compared with n. an interview asks all three and they are one algorithm.");
    println!();

    // Now the variant that looks identical and is not.
    let values: HashMap<&str, i32> = [
        ("A", 1), ("B", 1), ("C", 10), ("D", 1), ("E", 1), ("F", 1), ("G", 1),
    ].into_iter().collect();

    println!("now give each meeting a value, and ask for the most valuable schedule:");
    println!("  {:<8} {:>5} {:>7} {:>6}", "meeting", "start", "finish", "value");
    for m in &meetings {
        println!("  {:<8} {:>5} {:>7} {:>6}", m.name, m.start, m.finish, values[m.name]);
    }
    println!();

    let greedy_value: i32 = kept.iter().map(|n_| values[n_]).sum();
    println!("earliest finish still picks {}, worth {}", kept.join(", "), greedy_value);

    let mut best = 0;
    let mut best_set: Vec<&str> = Vec::new();
    for mask in 0..(1u32 << n) {
        let mut chosen: Vec<Meeting> = (0..n)
            .filter(|i| mask >> i & 1 == 1)
            .map(|i| meetings[i].clone())
            .collect();
        chosen.sort_by_key(|m| m.start);
        let ok = (1..chosen.len()).all(|i| chosen[i].start >= chosen[i - 1].finish);
        if !ok {
            continue;
        }
        let total: i32 = chosen.iter().map(|m| values[m.name]).sum();
        if total > best {
            best = total;
            best_set = chosen.iter().map(|m| m.name).collect();
        }
    }

    println!("the best schedule is {}, worth {}", best_set.join(", "), best);
    println!();
    println!("counting and adding up are not the same objective, and the rule that");
    println!("is provably right for one is wrong by 8 for the other. weighted interval");
    println!("scheduling has optimal substructure but no greedy choice property —");
    println!("it is a dynamic programming problem, and the last lesson comes back to it.");
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

type meeting struct {
	name          string
	start, finish int
}

// earliestFinish is the one scan. Everything in this section reads its result.
func earliestFinish(items []meeting) []string {
	order := append([]meeting(nil), items...)
	sort.SliceStable(order, func(i, j int) bool { return order[i].finish < order[j].finish })
	var kept []string
	freeAt := 0
	for _, m := range order {
		if m.start >= freeAt {
			kept = append(kept, m.name)
			freeAt = m.finish
		}
	}
	return kept
}

func main() {
	meetings := []meeting{
		{"A", 1, 4}, {"B", 3, 5}, {"C", 0, 6}, {"D", 5, 7},
		{"E", 3, 9}, {"F", 6, 10}, {"G", 8, 11},
	}

	kept := earliestFinish(meetings)
	n := len(meetings)

	fmt.Println("three questions, one scan:")
	fmt.Printf("  most meetings in one room          %d   (%s)\\n", len(kept), strings.Join(kept, ", "))
	fmt.Printf("  fewest to cancel for no clashes    %d   (the other %d)\\n", n-len(kept), n-len(kept))
	attended := "no"
	if len(kept) == n {
		attended = "yes"
	}
	fmt.Printf("  can every meeting be attended?     %s\\n", attended)
	fmt.Println()
	fmt.Println("the second is the first subtracted from n, and the third is the first")
	fmt.Println("compared with n. an interview asks all three and they are one algorithm.")
	fmt.Println()

	// Now the variant that looks identical and is not.
	values := map[string]int{"A": 1, "B": 1, "C": 10, "D": 1, "E": 1, "F": 1, "G": 1}

	fmt.Println("now give each meeting a value, and ask for the most valuable schedule:")
	fmt.Printf("  %-8s %5s %7s %6s\\n", "meeting", "start", "finish", "value")
	for _, m := range meetings {
		fmt.Printf("  %-8s %5d %7d %6d\\n", m.name, m.start, m.finish, values[m.name])
	}
	fmt.Println()

	greedyValue := 0
	for _, name := range kept {
		greedyValue += values[name]
	}
	fmt.Printf("earliest finish still picks %s, worth %d\\n", strings.Join(kept, ", "), greedyValue)

	best := 0
	var bestSet []string
	for mask := 0; mask < 1<<n; mask++ {
		var chosen []meeting
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				chosen = append(chosen, meetings[i])
			}
		}
		sort.SliceStable(chosen, func(i, j int) bool { return chosen[i].start < chosen[j].start })
		ok := true
		for i := 1; i < len(chosen); i++ {
			if chosen[i].start < chosen[i-1].finish {
				ok = false
			}
		}
		if !ok {
			continue
		}
		total := 0
		for _, m := range chosen {
			total += values[m.name]
		}
		if total > best {
			best = total
			bestSet = nil
			for _, m := range chosen {
				bestSet = append(bestSet, m.name)
			}
		}
	}

	fmt.Printf("the best schedule is %s, worth %d\\n", strings.Join(bestSet, ", "), best)
	fmt.Println()
	fmt.Println("counting and adding up are not the same objective, and the rule that")
	fmt.Println("is provably right for one is wrong by 8 for the other. weighted interval")
	fmt.Println("scheduling has optimal substructure but no greedy choice property —")
	fmt.Println("it is a dynamic programming problem, and the last lesson comes back to it.")
}`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why sort by finishing time rather than by start time or duration?",
      answer:
        "Because finishing time is the only one of the three that measures what a choice leaves behind. Taking the meeting that finishes earliest leaves the largest possible remainder of the day for everything still to be chosen, and that is exactly the quantity the rest of the algorithm depends on. Start time says nothing about how long a meeting runs, so an early-starting meeting can occupy the whole day; duration says nothing about position, so a short meeting in the middle blocks both sides. The proof is a stays-ahead induction: greedy's k-th meeting finishes no later than the k-th meeting of any other schedule, so it never runs out of day first.",
    },
    {
      question: "How many rooms does a set of meetings need, and why is that easier?",
      answer:
        "The maximum number in progress at any one instant, found by a sweep: emit a start and an end event for each meeting, sort by time with ends before starts at equal times, and track the running count. It is easier than the scheduling problem because nothing is ever rejected — the greedy choice is which room to reuse rather than which meeting to sacrifice, so there is no irrevocable decision to prove safe. The lower bound is immediate, since at the peak that many meetings genuinely overlap, and the upper bound follows because a new room is only ever opened when all the others are busy.",
    },
    {
      question: "The meetings now have values and you want the most valuable schedule. Does your algorithm change?",
      answer:
        "Completely. Earliest-finish is proven for maximising the *count*, and it says nothing about a weighted sum — one meeting occupying most of the day can be worth more than every short meeting combined, and greedy will always take the short ones. Weighted interval scheduling still has optimal substructure, so it is solvable by dynamic programming: sort by finish time, and for each interval choose between skipping it and taking it plus the best solution ending at or before its start, which a binary search finds. That is O(n log n) overall. The general lesson is that a greedy proof is attached to a specific objective, and changing the objective retires the proof.",
    },
  ],
  takeaways: [
    "Sort by finishing time, then scan once holding the time the room next comes free. The sort is the algorithm.",
    "Finishing time is the right key because it is the only one that measures what a choice leaves behind.",
    "The proof is stays-ahead: greedy's k-th meeting finishes no later than anyone else's k-th.",
    "Counting rooms is a different problem — nothing is rejected, so the greedy choice is which room to reuse.",
    "In the sweep, an end at time t must be processed before a start at t. That tie-break is the whole correctness argument.",
    "Most meetings, fewest cancellations and can-all-be-attended are one algorithm read three ways.",
    "Attach values and the rule dies. A greedy proof belongs to one objective and does not transfer to another.",
  ],
  status: "available",
};
