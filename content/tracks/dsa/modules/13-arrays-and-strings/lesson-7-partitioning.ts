import type { Lesson } from "@/content/types";

export const partitioningLesson: Lesson = {
  id: "dsa-arr-partition",
  slug: "one-pass-partitioning",
  moduleSlug: "arrays-and-strings",
  title: "One-Pass Partitioning & the Dutch National Flag",
  summary:
    "Three regions, three pointers, one pass — and the single line that decides whether it is correct, demonstrated by testing the wrong version twenty thousand times.",
  estimatedMinutes: 25,
  objectives: [
    "Partition into two regions with the compaction loop and a comparison predicate",
    "Maintain three regions at once with the Dutch national flag invariant",
    "Explain why the middle pointer must not advance after a swap with the top",
    "Choose between one pass and two, and say what each costs",
  ],
  sections: [
    {
      id: "two-regions",
      heading: "Two regions: the compaction loop again",
      body: [
        "Partitioning is the operation quicksort and quickselect are built from, and you already have it. **Take the compaction loop from lesson three and make the predicate a comparison against a pivot.**",
        "The only change is that partitioning *swaps* rather than copies. Compaction was throwing the rejected elements away, so overwriting them was fine; partitioning needs both halves, so the element being displaced has to go somewhere — and the somewhere is the slot the kept element vacated.",
        "The result: everything less than the pivot is left of the returned index, everything else is right of it, in one pass and O(1) space. The returned index is the size of the left region, which is exactly the `k` that compaction returned.",
      ],
      examples: [
        {
          id: "partition",
          title: "Partition around a pivot",
          lang: "java",
          code: `import java.util.*;

public class Main {
    /** Everything < pivot ends up left of the returned index; >= pivot right of it. */
    static int partition(int[] a, int pivot) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] < pivot) {
                int t = a[write]; a[write] = a[read]; a[read] = t;
                write++;
            }
        }
        return write;
    }

    public static void main(String[] args) {
        int[][] cases = {
            {7, 2, 9, 4, 1, 8, 3},
            {5, 5, 5, 5},
            {1, 2, 3, 4, 5},
            {5, 4, 3, 2, 1},
        };
        int pivot = 5;
        System.out.println("pivot = " + pivot);
        System.out.println();
        for (int[] c : cases) {
            int[] a = c.clone();
            int k = partition(a, pivot);
            System.out.printf("  %-24s -> %-24s  k=%d%n",
                    Arrays.toString(c), Arrays.toString(a), k);
            for (int i = 0; i < k; i++)
                if (a[i] >= pivot) throw new AssertionError("left side wrong");
            for (int i = k; i < a.length; i++)
                if (a[i] < pivot) throw new AssertionError("right side wrong");
        }
        System.out.println();
        System.out.println("this is the compaction loop again — the predicate is just \`< pivot\`,");
        System.out.println("and swapping instead of copying keeps the discarded half rather than losing it.");
    }
}`,
          output: `pivot = 5

  [7, 2, 9, 4, 1, 8, 3]    -> [2, 4, 1, 3, 9, 8, 7]     k=4
  [5, 5, 5, 5]             -> [5, 5, 5, 5]              k=0
  [1, 2, 3, 4, 5]          -> [1, 2, 3, 4, 5]           k=4
  [5, 4, 3, 2, 1]          -> [4, 3, 2, 1, 5]           k=4

this is the compaction loop again — the predicate is just \`< pivot\`,
and swapping instead of copying keeps the discarded half rather than losing it.`,
          explanation:
            "The checks after each case are part of the example on purpose: **the postcondition of a partition is not \"the array is sorted\", it is \"every element left of k is smaller and every element right of k is not\"**, and that is what should be asserted. Row one shows why — `[2, 4, 1, 3, 9, 8, 7]` is in no sense sorted and is a perfectly correct partition. Row two is the degenerate case worth noticing: with every element equal to the pivot, k is 0 and the whole array lands on the right, which is exactly the input that makes naive quicksort quadratic.",
          alternates: [
            {
              lang: "python",
              code: `def partition(a, pivot):
    """Everything < pivot ends up left of the returned index; >= pivot right of it."""
    write = 0
    for read in range(len(a)):
        if a[read] < pivot:
            a[write], a[read] = a[read], a[write]
            write += 1
    return write


cases = [
    [7, 2, 9, 4, 1, 8, 3],
    [5, 5, 5, 5],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
]
pivot = 5
print(f"pivot = {pivot}")
print()
for c in cases:
    a = c[:]
    k = partition(a, pivot)
    print(f"  {str(c):<24} -> {str(a):<24}  k={k}")
    assert all(v < pivot for v in a[:k]), "left side wrong"
    assert all(v >= pivot for v in a[k:]), "right side wrong"

print()
print("this is the compaction loop again — the predicate is just \`< pivot\`,")
print("and swapping instead of copying keeps the discarded half rather than losing it.")`,
            },
            {
              lang: "javascript",
              code: `/** Everything < pivot ends up left of the returned index; >= pivot right of it. */
function partition(a, pivot) {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] < pivot) {
      const t = a[write];
      a[write] = a[read];
      a[read] = t;
      write++;
    }
  }
  return write;
}

const show = (a) => \`[\${a.join(", ")}]\`;

const cases = [
  [7, 2, 9, 4, 1, 8, 3],
  [5, 5, 5, 5],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
];
const pivot = 5;
console.log(\`pivot = \${pivot}\`);
console.log();
for (const c of cases) {
  const a = c.slice();
  const k = partition(a, pivot);
  console.log(\`  \${show(c).padEnd(24)} -> \${show(a).padEnd(24)}  k=\${k}\`);
  if (!a.slice(0, k).every((v) => v < pivot)) throw new Error("left side wrong");
  if (!a.slice(k).every((v) => v >= pivot)) throw new Error("right side wrong");
}

console.log();
console.log("this is the compaction loop again — the predicate is just \`< pivot\`,");
console.log("and swapping instead of copying keeps the discarded half rather than losing it.");`,
            },
            {
              lang: "typescript",
              code: `/** Everything < pivot ends up left of the returned index; >= pivot right of it. */
function partition(a: number[], pivot: number): number {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] < pivot) {
      const t = a[write];
      a[write] = a[read];
      a[read] = t;
      write++;
    }
  }
  return write;
}

const show = (a: number[]): string => \`[\${a.join(", ")}]\`;

const cases: number[][] = [
  [7, 2, 9, 4, 1, 8, 3],
  [5, 5, 5, 5],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
];
const pivot = 5;
console.log(\`pivot = \${pivot}\`);
console.log();
for (const c of cases) {
  const a = c.slice();
  const k = partition(a, pivot);
  console.log(\`  \${show(c).padEnd(24)} -> \${show(a).padEnd(24)}  k=\${k}\`);
  if (!a.slice(0, k).every((v: number) => v < pivot)) throw new Error("left side wrong");
  if (!a.slice(k).every((v: number) => v >= pivot)) throw new Error("right side wrong");
}

console.log();
console.log("this is the compaction loop again — the predicate is just \`< pivot\`,");
console.log("and swapping instead of copying keeps the discarded half rather than losing it.");`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Everything < pivot ends up left of the returned index; >= pivot right of it.
static size_t partition(std::vector<int>& a, int pivot) {
    size_t write = 0;
    for (size_t read = 0; read < a.size(); ++read) {
        if (a[read] < pivot) {
            std::swap(a[write], a[read]);
            write++;
        }
    }
    return write;
}

static std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (size_t i = 0; i < a.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(a[i]);
    }
    return out + "]";
}

int main() {
    const std::vector<std::vector<int>> cases = {
        {7, 2, 9, 4, 1, 8, 3},
        {5, 5, 5, 5},
        {1, 2, 3, 4, 5},
        {5, 4, 3, 2, 1},
    };
    const int pivot = 5;
    std::cout << "pivot = " << pivot << "\\n\\n";
    for (const auto& c : cases) {
        std::vector<int> a = c;
        size_t k = partition(a, pivot);
        std::cout << "  " << std::left << std::setw(24) << show(c)
                  << " -> " << std::setw(24) << show(a) << "  k=" << k << '\\n';
        for (size_t i = 0; i < k; ++i)
            if (a[i] >= pivot) { std::cerr << "left side wrong\\n"; return 1; }
        for (size_t i = k; i < a.size(); ++i)
            if (a[i] < pivot) { std::cerr << "right side wrong\\n"; return 1; }
    }
    std::cout << '\\n';
    std::cout << "this is the compaction loop again — the predicate is just \`< pivot\`,\\n";
    std::cout << "and swapping instead of copying keeps the discarded half rather than losing it.\\n";
}`,
            },
            {
              lang: "rust",
              code: `/// Everything < pivot ends up left of the returned index; >= pivot right of it.
fn partition(a: &mut [i32], pivot: i32) -> usize {
    let mut write = 0;
    for read in 0..a.len() {
        if a[read] < pivot {
            a.swap(write, read);
            write += 1;
        }
    }
    write
}

fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    let cases: Vec<Vec<i32>> = vec![
        vec![7, 2, 9, 4, 1, 8, 3],
        vec![5, 5, 5, 5],
        vec![1, 2, 3, 4, 5],
        vec![5, 4, 3, 2, 1],
    ];
    let pivot = 5;
    println!("pivot = {}", pivot);
    println!();
    for c in &cases {
        let mut a = c.clone();
        let k = partition(&mut a, pivot);
        println!("  {:<24} -> {:<24}  k={}", show(c), show(&a), k);
        assert!(a[..k].iter().all(|&v| v < pivot), "left side wrong");
        assert!(a[k..].iter().all(|&v| v >= pivot), "right side wrong");
    }
    println!();
    println!("this is the compaction loop again — the predicate is just \`< pivot\`,");
    println!("and swapping instead of copying keeps the discarded half rather than losing it.");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strconv"
	"strings"
)

// partition puts everything < pivot left of the returned index; >= pivot right of it.
func partition(a []int, pivot int) int {
	write := 0
	for read := 0; read < len(a); read++ {
		if a[read] < pivot {
			a[write], a[read] = a[read], a[write]
			write++
		}
	}
	return write
}

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	cases := [][]int{
		{7, 2, 9, 4, 1, 8, 3},
		{5, 5, 5, 5},
		{1, 2, 3, 4, 5},
		{5, 4, 3, 2, 1},
	}
	pivot := 5
	fmt.Printf("pivot = %d\\n\\n", pivot)
	for _, c := range cases {
		a := append([]int(nil), c...)
		k := partition(a, pivot)
		fmt.Printf("  %-24s -> %-24s  k=%d\\n", show(c), show(a), k)
		for _, v := range a[:k] {
			if v >= pivot {
				panic("left side wrong")
			}
		}
		for _, v := range a[k:] {
			if v < pivot {
				panic("right side wrong")
			}
		}
	}
	fmt.Println()
	fmt.Println("this is the compaction loop again — the predicate is just \`< pivot\`,")
	fmt.Println("and swapping instead of copying keeps the discarded half rather than losing it.")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "three-regions",
      heading: "Three regions at once",
      body: [
        "Now the version that earns its own name. \"Sort an array of 0s, 1s and 2s in one pass with constant space\" — the **Dutch national flag** problem, after Dijkstra, and the reason it is worth knowing is that maintaining three regions with three pointers is a genuinely different exercise from maintaining two.",
        "Three pointers, and the invariant is the whole algorithm:",
        "**`a[0 : low]` is all 0s. `a[low : mid]` is all 1s. `a[mid : high+1]` is unexamined. `a[high+1 : n]` is all 2s.**",
        "Then each value has one rule. A **0** belongs at the boundary of the 0s, so swap it to `low` and advance both `low` and `mid` — the element that came back from `low` is necessarily a 1, already in the right region. A **1** is already where it belongs, so just advance `mid`. A **2** goes to the boundary of the 2s, so swap it to `high` and decrement `high` — **and do not touch `mid`**.",
        "Loop while `mid <= high`, because `high` is inclusive: the unexamined region is empty only once `mid` has passed it.",
      ],
      examples: [
        {
          id: "dnf",
          title: "The flag, traced",
          lang: "python",
          code: `def sort_colours(a, trace=False):
    """low: end of the 0s.  mid: cursor.  high: start of the 2s."""
    low, mid, high = 0, 0, len(a) - 1
    if trace:
        print(f"  {'low':>3} {'mid':>3} {'high':>4}  {'action':<24} array")
        print("  " + "-" * 56)
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
            action = "0: swap low, both ++"
        elif a[mid] == 1:
            mid += 1
            action = "1: leave it, mid ++"
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1
            action = "2: swap high, mid stays"
        if trace:
            print(f"  {low:>3} {mid:>3} {high:>4}  {action:<24} {a}")
    return a


print("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:")
sort_colours([2, 0, 2, 1, 1, 0], trace=True)

print()
for case in ([2, 0, 1], [0, 0, 0], [2, 2, 2], [1], [], [2, 1, 0, 2, 1, 0, 2, 1, 0]):
    before = list(case)
    print(f"  {str(before):<32} -> {sort_colours(case)}")`,
          output: `sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:
  low mid high  action                   array
  --------------------------------------------------------
    0   0    4  2: swap high, mid stays  [0, 0, 2, 1, 1, 2]
    1   1    4  0: swap low, both ++     [0, 0, 2, 1, 1, 2]
    2   2    4  0: swap low, both ++     [0, 0, 2, 1, 1, 2]
    2   2    3  2: swap high, mid stays  [0, 0, 1, 1, 2, 2]
    2   3    3  1: leave it, mid ++      [0, 0, 1, 1, 2, 2]
    2   4    3  1: leave it, mid ++      [0, 0, 1, 1, 2, 2]

  [2, 0, 1]                        -> [0, 1, 2]
  [0, 0, 0]                        -> [0, 0, 0]
  [2, 2, 2]                        -> [2, 2, 2]
  [1]                              -> [1]
  []                               -> []
  [2, 1, 0, 2, 1, 0, 2, 1, 0]      -> [0, 0, 0, 1, 1, 1, 2, 2, 2]`,
          explanation:
            "Rows 1 and 4 are the ones to study — `mid` does not move, and on row 1 the loop then immediately looks at the same position again and finds a 0 there. That is the algorithm working exactly as designed. Six iterations for six elements, so this really is one pass, and the loop ends when `mid` passes `high` rather than when `mid` reaches the end. The empty-list case exits without an iteration, since `high` starts at −1.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);
const padR = (v, w) => String(v).padEnd(w);

// low: end of the 0s.  mid: cursor.  high: start of the 2s.
function sortColours(a, trace = false) {
  let low = 0;
  let mid = 0;
  let high = a.length - 1;
  if (trace) {
    console.log(\`  \${padL("low", 3)} \${padL("mid", 3)} \${padL("high", 4)}  \${padR("action", 24)} array\`);
    console.log("  " + "-".repeat(56));
  }
  while (mid <= high) {
    let action;
    if (a[mid] === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      low++;
      mid++;
      action = "0: swap low, both ++";
    } else if (a[mid] === 1) {
      mid++;
      action = "1: leave it, mid ++";
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      high--;
      action = "2: swap high, mid stays";
    }
    if (trace) {
      console.log(\`  \${padL(low, 3)} \${padL(mid, 3)} \${padL(high, 4)}  \${padR(action, 24)} \${list(a)}\`);
    }
  }
  return a;
}

console.log("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:");
sortColours([2, 0, 2, 1, 1, 0], true);

console.log();
for (const c of [[2, 0, 1], [0, 0, 0], [2, 2, 2], [1], [], [2, 1, 0, 2, 1, 0, 2, 1, 0]]) {
  const before = list(c);
  console.log(\`  \${padR(before, 32)} -> \${list(sortColours(c))}\`);
}`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number | string, w: number): string => String(v).padStart(w);
const padR = (v: string, w: number): string => String(v).padEnd(w);

// low: end of the 0s.  mid: cursor.  high: start of the 2s.
function sortColours(a: number[], trace = false): number[] {
  let low = 0;
  let mid = 0;
  let high = a.length - 1;
  if (trace) {
    console.log(\`  \${padL("low", 3)} \${padL("mid", 3)} \${padL("high", 4)}  \${padR("action", 24)} array\`);
    console.log("  " + "-".repeat(56));
  }
  while (mid <= high) {
    let action: string;
    if (a[mid] === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      low++;
      mid++;
      action = "0: swap low, both ++";
    } else if (a[mid] === 1) {
      mid++;
      action = "1: leave it, mid ++";
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      high--;
      action = "2: swap high, mid stays";
    }
    if (trace) {
      console.log(\`  \${padL(low, 3)} \${padL(mid, 3)} \${padL(high, 4)}  \${padR(action, 24)} \${list(a)}\`);
    }
  }
  return a;
}

console.log("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:");
sortColours([2, 0, 2, 1, 1, 0], true);

console.log();
const cases: number[][] = [[2, 0, 1], [0, 0, 0], [2, 2, 2], [1], [], [2, 1, 0, 2, 1, 0, 2, 1, 0]];
for (const c of cases) {
  const before = list(c);
  console.log(\`  \${padR(before, 32)} -> \${list(sortColours(c))}\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    /** low: end of the 0s.  mid: cursor.  high: start of the 2s. */
    static int[] sortColours(int[] a, boolean trace) {
        int low = 0, mid = 0, high = a.length - 1;
        if (trace) {
            System.out.printf("  %3s %3s %4s  %-24s array%n", "low", "mid", "high", "action");
            System.out.println("  " + "-".repeat(56));
        }
        while (mid <= high) {
            String action;
            if (a[mid] == 0) {
                int t = a[low];
                a[low] = a[mid];
                a[mid] = t;
                low++;
                mid++;
                action = "0: swap low, both ++";
            } else if (a[mid] == 1) {
                mid++;
                action = "1: leave it, mid ++";
            } else {
                int t = a[mid];
                a[mid] = a[high];
                a[high] = t;
                high--;
                action = "2: swap high, mid stays";
            }
            if (trace) {
                System.out.printf("  %3d %3d %4d  %-24s %s%n", low, mid, high, action, list(a));
            }
        }
        return a;
    }

    public static void main(String[] args) {
        System.out.println("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:");
        sortColours(new int[]{2, 0, 2, 1, 1, 0}, true);

        System.out.println();
        int[][] cases = {{2, 0, 1}, {0, 0, 0}, {2, 2, 2}, {1}, {}, {2, 1, 0, 2, 1, 0, 2, 1, 0}};
        for (int[] c : cases) {
            String before = list(c);
            System.out.printf("  %-32s -> %s%n", before, list(sortColours(c, false)));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
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

// low: end of the 0s.  mid: cursor.  high: start of the 2s.
vector<int>& sortColours(vector<int>& a, bool trace = false) {
    int low = 0, mid = 0, high = (int)a.size() - 1;
    if (trace) {
        cout << "  " << right << setw(3) << "low" << " " << setw(3) << "mid" << " "
             << setw(4) << "high" << "  " << left << setw(24) << "action" << " array\\n";
        cout << "  " << string(56, '-') << "\\n";
    }
    while (mid <= high) {
        string action;
        if (a[mid] == 0) {
            swap(a[low], a[mid]);
            low++;
            mid++;
            action = "0: swap low, both ++";
        } else if (a[mid] == 1) {
            mid++;
            action = "1: leave it, mid ++";
        } else {
            swap(a[mid], a[high]);
            high--;
            action = "2: swap high, mid stays";
        }
        if (trace) {
            cout << "  " << right << setw(3) << low << " " << setw(3) << mid << " "
                 << setw(4) << high << "  " << left << setw(24) << action << " "
                 << list(a) << "\\n";
        }
    }
    return a;
}

int main() {
    cout << "sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:\\n";
    vector<int> traced = {2, 0, 2, 1, 1, 0};
    sortColours(traced, true);

    cout << "\\n";
    vector<vector<int>> cases = {{2, 0, 1}, {0, 0, 0}, {2, 2, 2}, {1}, {},
                                 {2, 1, 0, 2, 1, 0, 2, 1, 0}};
    for (auto& c : cases) {
        string before = list(c);
        cout << "  " << left << setw(32) << before << " -> " << list(sortColours(c)) << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// low: end of the 0s.  mid: cursor.  high: start of the 2s.
fn sort_colours(a: &mut Vec<i32>, trace: bool) {
    let (mut low, mut mid) = (0i32, 0i32);
    let mut high = a.len() as i32 - 1;
    if trace {
        println!("  {:>3} {:>3} {:>4}  {:<24} array", "low", "mid", "high", "action");
        println!("  {}", "-".repeat(56));
    }
    while mid <= high {
        let action;
        if a[mid as usize] == 0 {
            a.swap(low as usize, mid as usize);
            low += 1;
            mid += 1;
            action = "0: swap low, both ++";
        } else if a[mid as usize] == 1 {
            mid += 1;
            action = "1: leave it, mid ++";
        } else {
            a.swap(mid as usize, high as usize);
            high -= 1;
            action = "2: swap high, mid stays";
        }
        if trace {
            println!("  {:>3} {:>3} {:>4}  {:<24} {}", low, mid, high, action, list(a));
        }
    }
}

fn main() {
    println!("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:");
    let mut traced = vec![2, 0, 2, 1, 1, 0];
    sort_colours(&mut traced, true);

    println!();
    let cases: Vec<Vec<i32>> = vec![
        vec![2, 0, 1],
        vec![0, 0, 0],
        vec![2, 2, 2],
        vec![1],
        vec![],
        vec![2, 1, 0, 2, 1, 0, 2, 1, 0],
    ];
    for c in cases {
        let mut c = c;
        let before = list(&c);
        sort_colours(&mut c, false);
        println!("  {:<32} -> {}", before, list(&c));
    }
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// low: end of the 0s.  mid: cursor.  high: start of the 2s.
func sortColours(a []int, trace bool) []int {
	low, mid, high := 0, 0, len(a)-1
	if trace {
		fmt.Printf("  %3s %3s %4s  %-24s array\\n", "low", "mid", "high", "action")
		fmt.Println("  " + strings.Repeat("-", 56))
	}
	for mid <= high {
		var action string
		switch a[mid] {
		case 0:
			a[low], a[mid] = a[mid], a[low]
			low++
			mid++
			action = "0: swap low, both ++"
		case 1:
			mid++
			action = "1: leave it, mid ++"
		default:
			a[mid], a[high] = a[high], a[mid]
			high--
			action = "2: swap high, mid stays"
		}
		if trace {
			fmt.Printf("  %3d %3d %4d  %-24s %s\\n", low, mid, high, action, list(a))
		}
	}
	return a
}

func main() {
	fmt.Println("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:")
	sortColours([]int{2, 0, 2, 1, 1, 0}, true)

	fmt.Println()
	cases := [][]int{{2, 0, 1}, {0, 0, 0}, {2, 2, 2}, {1}, {}, {2, 1, 0, 2, 1, 0, 2, 1, 0}}
	for _, c := range cases {
		before := list(c)
		fmt.Printf("  %-32s -> %s\\n", before, list(sortColours(c, false)))
	}
}`,
            },
          ],
        },
      ],
      visual: {
        id: "dutchflag-visual",
        kind: "pattern",
        algorithm: "dutchflag",
        lockAlgorithm: true,
        title: "Three regions growing at once",
      },
    },
    {
      id: "the-bug",
      heading: "The one line that decides whether it works",
      body: [
        "Everything above hinges on a single asymmetry that reads as arbitrary and is not.",
        "**When you swap with `low`, you advance `mid`. When you swap with `high`, you do not.**",
        "The reason is what the incoming element is. Swapping with `low` brings back whatever was at `low`, and by the invariant that region is all 1s — so the element arriving at `mid` is known to be a 1, already correctly placed, and there is nothing to examine. Swapping with `high` brings back an element from the *unexamined* region. It could be anything. Advancing past it skips it forever.",
        "It is a one-line difference and it produces wrong answers on only some inputs, which is the worst kind of bug to have. So rather than argue about it, test it — the differential test from the framework module, comparing both versions against `sorted()` on twenty thousand random inputs.",
      ],
      examples: [
        {
          id: "differential",
          title: "Testing the wrong version against the right one",
          lang: "python",
          code: `def sort_colours(a, advance_mid_after_high_swap):
    low, mid, high = 0, 0, len(a) - 1
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1
            if advance_mid_after_high_swap:      # the bug
                mid += 1
    return a


# A Lehmer generator rather than \`random\`: what this example reports is the
# *first* input the buggy version gets wrong, so every language has to walk the
# same 20,000 inputs in the same order, and no other language reproduces
# Python's Mersenne Twister. Every product here stays under 2^53, so a double
# holds it exactly too.
seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def rand_int(lo, hi):                            # inclusive, like randint
    return lo + next_rand() % (hi - lo + 1)


first_failure = None
trials = 0
for _ in range(20000):
    n = rand_int(1, 8)
    data = [rand_int(0, 2) for _ in range(n)]
    trials += 1
    correct = sort_colours(list(data), False)
    buggy = sort_colours(list(data), True)
    assert correct == sorted(data), data
    if buggy != correct and first_failure is None:
        first_failure = (list(data), correct, buggy)

print(f"random trials              : {trials:,}")
print("correct version            : matched sorted() every time")
print(f"buggy version first failed : input   {first_failure[0]}")
print(f"                             correct {first_failure[1]}")
print(f"                             buggy   {first_failure[2]}")
print()
print("the element swapped down from \`high\` has never been examined,")
print("so \`mid\` must stay where it is and look at it next.")`,
          output: `random trials              : 20,000
correct version            : matched sorted() every time
buggy version first failed : input   [2, 1, 1, 2, 1, 0, 2, 0]
                             correct [0, 0, 1, 1, 1, 2, 2, 2]
                             buggy   [0, 1, 1, 2, 1, 0, 2, 2]

the element swapped down from \`high\` has never been examined,
so \`mid\` must stay where it is and look at it next.`,
          explanation:
            "The counterexample is worth tracing by hand, and it is small enough to do in your head: the `0` at the end gets swapped up to where the `2` was, `mid` skips over it, and it never reaches the 0s region. **Note that the failure needs a specific arrangement** — plenty of the twenty thousand inputs pass with the bug in place, which is precisely why a couple of hand-picked test cases would not have caught it. This is the technique from the framework module and it costs eight lines: implement the version you trust, implement the version you are unsure of, and let a loop find the disagreement.",
          alternates: [
            {
              lang: "javascript",
              code: `function sortColours(a, advanceMidAfterHighSwap) {
  let low = 0;
  let mid = 0;
  let high = a.length - 1;
  while (mid <= high) {
    if (a[mid] === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      low++;
      mid++;
    } else if (a[mid] === 1) {
      mid++;
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      high--;
      if (advanceMidAfterHighSwap) mid++;        // the bug
    }
  }
  return a;
}

// A Lehmer generator rather than a library one: what this example reports is
// the *first* input the buggy version gets wrong, so every language has to walk
// the same 20,000 inputs in the same order. Every product here stays under
// 2^53, which is what lets a double hold it exactly.
let seed = 7;

function nextRand() {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

function randInt(lo, hi) {                       // inclusive
  return lo + (nextRand() % (hi - lo + 1));
}

const show = (a) => \`[\${a.join(", ")}]\`;
const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

let firstFailure = null;
let trials = 0;
for (let t = 0; t < 20000; t++) {
  const n = randInt(1, 8);
  const data = Array.from({ length: n }, () => randInt(0, 2));
  trials++;
  const correct = sortColours(data.slice(), false);
  const buggy = sortColours(data.slice(), true);
  const expected = data.slice().sort((x, y) => x - y);
  if (show(correct) !== show(expected)) throw new Error(show(data));
  if (show(buggy) !== show(correct) && firstFailure === null) {
    firstFailure = [data.slice(), correct, buggy];
  }
}

console.log(\`random trials              : \${group(trials)}\`);
console.log("correct version            : matched sorted() every time");
console.log(\`buggy version first failed : input   \${show(firstFailure[0])}\`);
console.log(\`                             correct \${show(firstFailure[1])}\`);
console.log(\`                             buggy   \${show(firstFailure[2])}\`);
console.log();
console.log("the element swapped down from \`high\` has never been examined,");
console.log("so \`mid\` must stay where it is and look at it next.");`,
            },
            {
              lang: "typescript",
              code: `function sortColours(a: number[], advanceMidAfterHighSwap: boolean): number[] {
  let low = 0;
  let mid = 0;
  let high = a.length - 1;
  while (mid <= high) {
    if (a[mid] === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      low++;
      mid++;
    } else if (a[mid] === 1) {
      mid++;
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      high--;
      if (advanceMidAfterHighSwap) mid++;        // the bug
    }
  }
  return a;
}

// A Lehmer generator rather than a library one: what this example reports is
// the *first* input the buggy version gets wrong, so every language has to walk
// the same 20,000 inputs in the same order. Every product here stays under
// 2^53, which is what lets a double hold it exactly.
let seed = 7;

function nextRand(): number {
  seed = (seed * 16807) % 2147483647;
  return seed;
}

function randInt(lo: number, hi: number): number {                       // inclusive
  return lo + (nextRand() % (hi - lo + 1));
}

const show = (a: number[]): string => \`[\${a.join(", ")}]\`;
const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

let firstFailure: number[][] | null = null;
let trials = 0;
for (let t = 0; t < 20000; t++) {
  const n = randInt(1, 8);
  const data: number[] = Array.from({ length: n }, () => randInt(0, 2));
  trials++;
  const correct = sortColours(data.slice(), false);
  const buggy = sortColours(data.slice(), true);
  const expected = data.slice().sort((x: number, y: number) => x - y);
  if (show(correct) !== show(expected)) throw new Error(show(data));
  if (show(buggy) !== show(correct) && firstFailure === null) {
    firstFailure = [data.slice(), correct, buggy];
  }
}

console.log(\`random trials              : \${group(trials)}\`);
console.log("correct version            : matched sorted() every time");
console.log(\`buggy version first failed : input   \${show(firstFailure![0])}\`);
console.log(\`                             correct \${show(firstFailure![1])}\`);
console.log(\`                             buggy   \${show(firstFailure![2])}\`);
console.log();
console.log("the element swapped down from \`high\` has never been examined,");
console.log("so \`mid\` must stay where it is and look at it next.");`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;

public class Main {
    static int[] sortColours(int[] a, boolean advanceMidAfterHighSwap) {
        int low = 0, mid = 0, high = a.length - 1;
        while (mid <= high) {
            if (a[mid] == 0) {
                int t = a[low]; a[low] = a[mid]; a[mid] = t;
                low++;
                mid++;
            } else if (a[mid] == 1) {
                mid++;
            } else {
                int t = a[mid]; a[mid] = a[high]; a[high] = t;
                high--;
                if (advanceMidAfterHighSwap) mid++;      // the bug
            }
        }
        return a;
    }

    /* A Lehmer generator rather than java.util.Random: what this example reports
       is the *first* input the buggy version gets wrong, so every language has to
       walk the same 20,000 inputs in the same order. */
    static long seed = 7;

    static long nextRand() {
        seed = (seed * 16807) % 2147483647L;
        return seed;
    }

    static int randInt(int lo, int hi) {                 // inclusive
        return lo + (int) (nextRand() % (hi - lo + 1));
    }

    public static void main(String[] args) {
        int[][] firstFailure = null;
        int trials = 0;
        for (int t = 0; t < 20000; t++) {
            int n = randInt(1, 8);
            int[] data = new int[n];
            for (int i = 0; i < n; i++) data[i] = randInt(0, 2);
            trials++;
            int[] correct = sortColours(data.clone(), false);
            int[] buggy = sortColours(data.clone(), true);
            int[] expected = data.clone();
            Arrays.sort(expected);
            if (!Arrays.equals(correct, expected)) throw new AssertionError(Arrays.toString(data));
            if (!Arrays.equals(buggy, correct) && firstFailure == null) {
                firstFailure = new int[][]{data.clone(), correct, buggy};
            }
        }

        System.out.printf("random trials              : %,d%n", trials);
        System.out.println("correct version            : matched sorted() every time");
        System.out.println("buggy version first failed : input   " + Arrays.toString(firstFailure[0]));
        System.out.println("                             correct " + Arrays.toString(firstFailure[1]));
        System.out.println("                             buggy   " + Arrays.toString(firstFailure[2]));
        System.out.println();
        System.out.println("the element swapped down from \`high\` has never been examined,");
        System.out.println("so \`mid\` must stay where it is and look at it next.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

static std::vector<int> sort_colours(std::vector<int> a, bool advance_mid_after_high_swap) {
    int low = 0, mid = 0, high = static_cast<int>(a.size()) - 1;
    while (mid <= high) {
        if (a[mid] == 0) {
            std::swap(a[low], a[mid]);
            low++;
            mid++;
        } else if (a[mid] == 1) {
            mid++;
        } else {
            std::swap(a[mid], a[high]);
            high--;
            if (advance_mid_after_high_swap) mid++;      // the bug
        }
    }
    return a;
}

/* A Lehmer generator rather than <random>: what this example reports is the
   *first* input the buggy version gets wrong, so every language has to walk the
   same 20,000 inputs in the same order. */
static long long seed = 7;

static long long next_rand() {
    seed = (seed * 16807) % 2147483647LL;
    return seed;
}

static int rand_int(int lo, int hi) {                    // inclusive
    return lo + static_cast<int>(next_rand() % (hi - lo + 1));
}

static std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (size_t i = 0; i < a.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(a[i]);
    }
    return out + "]";
}

static std::string group(long long n) {
    std::string s = std::to_string(n), out;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i > 0 && (s.size() - i) % 3 == 0) out += ',';
        out += s[i];
    }
    return out;
}

int main() {
    std::vector<std::vector<int>> first_failure;
    int trials = 0;
    for (int t = 0; t < 20000; ++t) {
        int n = rand_int(1, 8);
        std::vector<int> data(n);
        for (int i = 0; i < n; ++i) data[i] = rand_int(0, 2);
        trials++;
        std::vector<int> correct = sort_colours(data, false);
        std::vector<int> buggy = sort_colours(data, true);
        std::vector<int> expected = data;
        std::sort(expected.begin(), expected.end());
        if (correct != expected) { std::cerr << "correct version wrong on " << show(data) << '\\n'; return 1; }
        if (buggy != correct && first_failure.empty()) {
            first_failure = {data, correct, buggy};
        }
    }

    std::cout << "random trials              : " << group(trials) << '\\n';
    std::cout << "correct version            : matched sorted() every time\\n";
    std::cout << "buggy version first failed : input   " << show(first_failure[0]) << '\\n';
    std::cout << "                             correct " << show(first_failure[1]) << '\\n';
    std::cout << "                             buggy   " << show(first_failure[2]) << '\\n';
    std::cout << '\\n';
    std::cout << "the element swapped down from \`high\` has never been examined,\\n";
    std::cout << "so \`mid\` must stay where it is and look at it next.\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn sort_colours(mut a: Vec<i32>, advance_mid_after_high_swap: bool) -> Vec<i32> {
    let (mut low, mut mid) = (0i32, 0i32);
    let mut high = a.len() as i32 - 1;
    while mid <= high {
        if a[mid as usize] == 0 {
            a.swap(low as usize, mid as usize);
            low += 1;
            mid += 1;
        } else if a[mid as usize] == 1 {
            mid += 1;
        } else {
            a.swap(mid as usize, high as usize);
            high -= 1;
            if advance_mid_after_high_swap {
                mid += 1; // the bug
            }
        }
    }
    a
}

/// A Lehmer generator rather than a crate: what this example reports is the
/// *first* input the buggy version gets wrong, so every language has to walk
/// the same 20,000 inputs in the same order.
struct Lehmer {
    seed: i64,
}

impl Lehmer {
    fn next(&mut self) -> i64 {
        self.seed = (self.seed * 16807) % 2147483647;
        self.seed
    }

    fn range(&mut self, lo: i32, hi: i32) -> i32 {   // inclusive
        lo + (self.next() % (hi - lo + 1) as i64) as i32
    }
}

fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn group(n: i64) -> String {
    let s = n.to_string();
    let mut out = String::new();
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (s.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(c);
    }
    out
}

fn main() {
    let mut rng = Lehmer { seed: 7 };
    let mut first_failure: Option<(Vec<i32>, Vec<i32>, Vec<i32>)> = None;
    let mut trials = 0i64;
    for _ in 0..20000 {
        let n = rng.range(1, 8);
        let data: Vec<i32> = (0..n).map(|_| rng.range(0, 2)).collect();
        trials += 1;
        let correct = sort_colours(data.clone(), false);
        let buggy = sort_colours(data.clone(), true);
        let mut expected = data.clone();
        expected.sort_unstable();
        assert_eq!(correct, expected, "{}", show(&data));
        if buggy != correct && first_failure.is_none() {
            first_failure = Some((data.clone(), correct, buggy));
        }
    }

    let (input, correct, buggy) = first_failure.unwrap();
    println!("random trials              : {}", group(trials));
    println!("correct version            : matched sorted() every time");
    println!("buggy version first failed : input   {}", show(&input));
    println!("                             correct {}", show(&correct));
    println!("                             buggy   {}", show(&buggy));
    println!();
    println!("the element swapped down from \`high\` has never been examined,");
    println!("so \`mid\` must stay where it is and look at it next.");
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

func sortColours(a []int, advanceMidAfterHighSwap bool) []int {
	low, mid, high := 0, 0, len(a)-1
	for mid <= high {
		switch {
		case a[mid] == 0:
			a[low], a[mid] = a[mid], a[low]
			low++
			mid++
		case a[mid] == 1:
			mid++
		default:
			a[mid], a[high] = a[high], a[mid]
			high--
			if advanceMidAfterHighSwap {
				mid++ // the bug
			}
		}
	}
	return a
}

// A Lehmer generator rather than math/rand: what this example reports is the
// *first* input the buggy version gets wrong, so every language has to walk the
// same 20,000 inputs in the same order.
var seed int64 = 7

func nextRand() int64 {
	seed = (seed * 16807) % 2147483647
	return seed
}

func randInt(lo, hi int) int { // inclusive
	return lo + int(nextRand()%int64(hi-lo+1))
}

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func group(n int64) string {
	s := strconv.FormatInt(n, 10)
	var out strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out.WriteByte(',')
		}
		out.WriteRune(c)
	}
	return out.String()
}

func clone(a []int) []int { return append([]int(nil), a...) }

func main() {
	var firstFailure [][]int
	trials := int64(0)
	for t := 0; t < 20000; t++ {
		n := randInt(1, 8)
		data := make([]int, n)
		for i := range data {
			data[i] = randInt(0, 2)
		}
		trials++
		correct := sortColours(clone(data), false)
		buggy := sortColours(clone(data), true)
		expected := clone(data)
		sort.Ints(expected)
		if show(correct) != show(expected) {
			panic(show(data))
		}
		if show(buggy) != show(correct) && firstFailure == nil {
			firstFailure = [][]int{clone(data), correct, buggy}
		}
	}

	fmt.Printf("random trials              : %s\\n", group(trials))
	fmt.Println("correct version            : matched sorted() every time")
	fmt.Println("buggy version first failed : input   " + show(firstFailure[0]))
	fmt.Println("                             correct " + show(firstFailure[1]))
	fmt.Println("                             buggy   " + show(firstFailure[2]))
	fmt.Println()
	fmt.Println("the element swapped down from \`high\` has never been examined,")
	fmt.Println("so \`mid\` must stay where it is and look at it next.")
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Writing `while mid < high` instead of `mid <= high`",
          body: "`high` is the index of the last unexamined element, not one past it, so stopping at `mid == high` leaves that element unprocessed. It is invisible whenever the last unexamined value happens to be a 1 already in place, and produces a single misplaced element otherwise. Decide once whether your boundaries are inclusive or exclusive, and keep every comparison consistent with that choice — mixing the two conventions is the root of most off-by-one bugs in this module and the next.",
        },
      ],
    },
    {
      id: "one-pass-or-two",
      heading: "One pass, or two?",
      body: [
        "The honest counterpoint, because \"in one pass\" is a constraint the problem imposes rather than a virtue in itself.",
        "**Counting sort does the same job in two passes and four lines**: count how many 0s, 1s and 2s there are, then overwrite the array with that many of each. It is O(n) time and O(1) space too, it is much harder to get wrong, and on real hardware the two sequential passes may well beat the one pass with its swaps.",
        "So why learn the flag? Because the problem usually says \"one pass\" explicitly, and because **the three-region invariant is the transferable part**. The same structure appears in quicksort's three-way partition — which is what makes quicksort survive arrays full of duplicates — and in every problem that maintains more than two regions of an array at once.",
        "In an interview: offer the counting version first, say it is two passes, and then ask whether they want the one-pass version. That sequence demonstrates you know both and chose deliberately, which scores better than producing the clever one immediately.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Sort an array of 0s, 1s and 2s in one pass with constant space.",
      answer:
        "The Dutch national flag algorithm. Keep low, mid and high so that a[0:low] is all 0s, a[low:mid] is all 1s, a[mid:high+1] is unexamined and a[high+1:] is all 2s, and loop while mid ≤ high. On a 0, swap with low and advance both low and mid; on a 1, just advance mid; on a 2, swap with high, decrement high and leave mid alone. O(n) time, O(1) space, one pass. I would also mention the two-pass counting version — count the three values then rewrite the array — which is the same complexity and much harder to get wrong, and say I am writing the flag because the problem asked for a single pass.",
    },
    {
      question: "Why does `mid` advance after a swap with `low` but not after a swap with `high`?",
      answer:
        "Because of what comes back. Swapping with low returns whatever was at low, and by the invariant that region holds only 1s, so the incoming element is known to be a 1 and is already correctly placed — nothing to examine. Swapping with high returns an element from the unexamined region, which could be any of the three values, so mid has to stay and look at it on the next iteration. Advancing there skips it permanently, and the bug only shows on particular arrangements: a differential test over twenty thousand random arrays finds `[2, 1, 1, 2, 1, 0, 2, 0]`, where the very first swap pulls a 0 down from the back to `mid` and the extra increment steps straight over it.",
    },
    {
      question: "How does partitioning relate to the compaction loop?",
      answer:
        "It is the same loop with a comparison as the predicate. A read pointer visits everything, a write pointer marks the boundary of the left region, and the returned index is the size of that region — identical to the k that compaction returns. The one difference is that partitioning swaps rather than copies, because both halves are needed and the displaced element has to go into the slot the kept one vacated. The postcondition is not that the array is sorted but that everything before k is less than the pivot and everything from k on is not, which is worth asserting explicitly since partitioned output looks scrambled.",
    },
  ],
  takeaways: [
    "Partitioning is the compaction loop with a comparison predicate, swapping not copying",
    "A correct partition looks scrambled — assert the postcondition, not sortedness",
    "Flag invariant: 0s | 1s | unexamined | 2s, tracked by low, mid, high",
    "0 → swap low, advance both; 1 → advance mid; 2 → swap high, mid stays",
    "mid stays because the element from high has never been examined",
    "`while mid <= high` — high is inclusive, so `<` leaves one element unprocessed",
    "Counting sort does the same job in two passes and is far harder to get wrong",
    "The transferable part is the three-region invariant, not the colours",
  ],
  status: "available",
};
