import type { Lesson } from "@/content/types";

export const cyclicSortLesson: Lesson = {
  id: "dsa-arr-cyclic",
  slug: "cyclic-sort-and-the-missing-number-family",
  moduleSlug: "arrays-and-strings",
  title: "Cyclic Sort & the Missing-Number Family",
  summary:
    "When the values are 1 to n, the array can index itself — one loop that solves four separate sheet problems, and the arithmetic alternative that quietly overflows.",
  estimatedMinutes: 25,
  objectives: [
    "Recognise \"values in the range 1 to n\" as the signal it is",
    "Write cyclic sort and argue that a nested-looking loop is O(n)",
    "Derive missing-number, duplicate and first-missing-positive from one loop",
    "Compare against the sum and XOR approaches, including where the sum fails",
  ],
  sections: [
    {
      id: "the-signal",
      heading: "The constraint that is really an instruction",
      body: [
        "The complexity module made a promise: **\"the values are in the range 1 to n\" is a gift, and the reason is that it lets you index by value.** This lesson collects on it.",
        "When an array of length n contains the values 1 to n in some order, there is an obvious place for every value: `v` belongs at index `v - 1`. So the array can be sorted by repeatedly putting each value where it belongs — no comparisons, no O(n log n), just placement. That is **cyclic sort**, and it is O(n) with O(1) space.",
        "The loop looks alarming, because it is a `while` that does not always advance. Look at `a[i]`, work out where it belongs, and if it is not already there, swap it there — *without* advancing `i`, because the element that just arrived has not been checked. Advance only when `a[i]` is already correct.",
        "**Why that is still O(n):** every swap puts at least one value into its final position, permanently. There are n values, so there are at most n swaps in the entire run — and `i` advances at most n times. The amortised argument from the complexity module, in its simplest form.",
      ],
      examples: [
        {
          id: "cyclic-sort",
          title: "Cyclic sort, traced",
          lang: "python",
          code: `def cyclic_sort(a, trace=False):
    """Values are 1..n. Put value v at index v-1, one swap at a time."""
    i = 0
    swaps = 0
    while i < len(a):
        target = a[i] - 1
        if a[i] != a[target]:
            a[i], a[target] = a[target], a[i]
            swaps += 1
            if trace:
                print(f"    a[{i}]={a[target]} belongs at index {target}"
                      f"  -> swap  {a}")
        else:
            i += 1
    return swaps


data = [3, 1, 5, 4, 2]
print(f"start: {data}")
swaps = cyclic_sort(data, trace=True)
print(f"final: {data}   swaps={swaps}, and i advanced {len(data)} times")

print()
print("every swap puts one value in its final place, so there are at most n of them")
print("-> O(n) total work, even though the loop is a while and not a for")`,
          output: `start: [3, 1, 5, 4, 2]
    a[0]=3 belongs at index 2  -> swap  [5, 1, 3, 4, 2]
    a[0]=5 belongs at index 4  -> swap  [2, 1, 3, 4, 5]
    a[0]=2 belongs at index 1  -> swap  [1, 2, 3, 4, 5]
final: [1, 2, 3, 4, 5]   swaps=3, and i advanced 5 times

every swap puts one value in its final place, so there are at most n of them
-> O(n) total work, even though the loop is a while and not a for`,
          explanation:
            "Three swaps sorted a five-element array, and `i` never went backwards. Watch index 0 in the trace: it is the site of all three swaps, because each one brings in another misplaced value, and the chain only ends when the value that belongs at index 0 arrives there. **The comparison is `a[i] != a[target]` rather than `i != target`**, and that difference is what makes it survive duplicates — if two elements hold the same value, the second one finds its target already occupied by an equal value and the loop moves on instead of swapping forever.",
          alternates: [
            {
              lang: "javascript",
              code: `const show = (a) => \`[\${a.join(", ")}]\`;

/** Values are 1..n. Put value v at index v-1, one swap at a time. */
function cyclicSort(a, trace = false) {
  let i = 0;
  let swaps = 0;
  while (i < a.length) {
    const target = a[i] - 1;
    if (a[i] !== a[target]) {
      const t = a[i];
      a[i] = a[target];
      a[target] = t;
      swaps++;
      // a[target] now holds what a[i] held a line ago — the value that just
      // reached its final place, which is the one worth naming.
      if (trace) console.log(\`    a[\${i}]=\${a[target]} belongs at index \${target}  -> swap  \${show(a)}\`);
    } else {
      i++;
    }
  }
  return swaps;
}

const data = [3, 1, 5, 4, 2];
console.log(\`start: \${show(data)}\`);
const swaps = cyclicSort(data, true);
console.log(\`final: \${show(data)}   swaps=\${swaps}, and i advanced \${data.length} times\`);

console.log();
console.log("every swap puts one value in its final place, so there are at most n of them");
console.log("-> O(n) total work, even though the loop is a while and not a for");`,
            },
            {
              lang: "typescript",
              code: `const show = (a: number[]): string => \`[\${a.join(", ")}]\`;

/** Values are 1..n. Put value v at index v-1, one swap at a time. */
function cyclicSort(a: number[], trace = false): number {
  let i = 0;
  let swaps = 0;
  while (i < a.length) {
    const target = a[i] - 1;
    if (a[i] !== a[target]) {
      const t = a[i];
      a[i] = a[target];
      a[target] = t;
      swaps++;
      // a[target] now holds what a[i] held a line ago — the value that just
      // reached its final place, which is the one worth naming.
      if (trace) console.log(\`    a[\${i}]=\${a[target]} belongs at index \${target}  -> swap  \${show(a)}\`);
    } else {
      i++;
    }
  }
  return swaps;
}

const data = [3, 1, 5, 4, 2];
console.log(\`start: \${show(data)}\`);
const swaps = cyclicSort(data, true);
console.log(\`final: \${show(data)}   swaps=\${swaps}, and i advanced \${data.length} times\`);

console.log();
console.log("every swap puts one value in its final place, so there are at most n of them");
console.log("-> O(n) total work, even though the loop is a while and not a for");`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;

public class Main {
    static String show(int[] a) {
        return Arrays.toString(a);
    }

    /** Values are 1..n. Put value v at index v-1, one swap at a time. */
    static int cyclicSort(int[] a, boolean trace) {
        int i = 0, swaps = 0;
        while (i < a.length) {
            int target = a[i] - 1;
            if (a[i] != a[target]) {
                int t = a[i];
                a[i] = a[target];
                a[target] = t;
                swaps++;
                // a[target] now holds what a[i] held a line ago — the value that
                // just reached its final place, which is the one worth naming.
                if (trace) {
                    System.out.printf("    a[%d]=%d belongs at index %d  -> swap  %s%n",
                            i, a[target], target, show(a));
                }
            } else {
                i++;
            }
        }
        return swaps;
    }

    public static void main(String[] args) {
        int[] data = {3, 1, 5, 4, 2};
        System.out.println("start: " + show(data));
        int swaps = cyclicSort(data, true);
        System.out.printf("final: %s   swaps=%d, and i advanced %d times%n", show(data), swaps, data.length);

        System.out.println();
        System.out.println("every swap puts one value in its final place, so there are at most n of them");
        System.out.println("-> O(n) total work, even though the loop is a while and not a for");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <string>
#include <vector>

static std::string show(const std::vector<int>& a) {
    std::string out = "[";
    for (size_t i = 0; i < a.size(); ++i) {
        if (i) out += ", ";
        out += std::to_string(a[i]);
    }
    return out + "]";
}

// Values are 1..n. Put value v at index v-1, one swap at a time.
static int cyclic_sort(std::vector<int>& a, bool trace) {
    size_t i = 0;
    int swaps = 0;
    while (i < a.size()) {
        size_t target = static_cast<size_t>(a[i] - 1);
        if (a[i] != a[target]) {
            std::swap(a[i], a[target]);
            swaps++;
            // a[target] now holds what a[i] held a line ago — the value that
            // just reached its final place, which is the one worth naming.
            if (trace) {
                std::cout << "    a[" << i << "]=" << a[target] << " belongs at index "
                          << target << "  -> swap  " << show(a) << '\\n';
            }
        } else {
            i++;
        }
    }
    return swaps;
}

int main() {
    std::vector<int> data = {3, 1, 5, 4, 2};
    std::cout << "start: " << show(data) << '\\n';
    int swaps = cyclic_sort(data, true);
    std::cout << "final: " << show(data) << "   swaps=" << swaps
              << ", and i advanced " << data.size() << " times\\n";

    std::cout << '\\n';
    std::cout << "every swap puts one value in its final place, so there are at most n of them\\n";
    std::cout << "-> O(n) total work, even though the loop is a while and not a for\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Values are 1..n. Put value v at index v-1, one swap at a time.
fn cyclic_sort(a: &mut Vec<i32>, trace: bool) -> i32 {
    let mut i = 0usize;
    let mut swaps = 0;
    while i < a.len() {
        let target = (a[i] - 1) as usize;
        if a[i] != a[target] {
            a.swap(i, target);
            swaps += 1;
            // a[target] now holds what a[i] held a line ago — the value that
            // just reached its final place, which is the one worth naming.
            if trace {
                println!("    a[{}]={} belongs at index {}  -> swap  {}", i, a[target], target, show(a));
            }
        } else {
            i += 1;
        }
    }
    swaps
}

fn main() {
    let mut data = vec![3, 1, 5, 4, 2];
    println!("start: {}", show(&data));
    let swaps = cyclic_sort(&mut data, true);
    println!("final: {}   swaps={}, and i advanced {} times", show(&data), swaps, data.len());

    println!();
    println!("every swap puts one value in its final place, so there are at most n of them");
    println!("-> O(n) total work, even though the loop is a while and not a for");
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

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// cyclicSort assumes values are 1..n. It puts value v at index v-1, one swap at a time.
func cyclicSort(a []int, trace bool) int {
	i, swaps := 0, 0
	for i < len(a) {
		target := a[i] - 1
		if a[i] != a[target] {
			a[i], a[target] = a[target], a[i]
			swaps++
			// a[target] now holds what a[i] held a line ago — the value that
			// just reached its final place, which is the one worth naming.
			if trace {
				fmt.Printf("    a[%d]=%d belongs at index %d  -> swap  %s\\n", i, a[target], target, show(a))
			}
		} else {
			i++
		}
	}
	return swaps
}

func main() {
	data := []int{3, 1, 5, 4, 2}
	fmt.Printf("start: %s\\n", show(data))
	swaps := cyclicSort(data, true)
	fmt.Printf("final: %s   swaps=%d, and i advanced %d times\\n", show(data), swaps, len(data))

	fmt.Println()
	fmt.Println("every swap puts one value in its final place, so there are at most n of them")
	fmt.Println("-> O(n) total work, even though the loop is a while and not a for")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "cyclicsort-visual",
        kind: "pattern",
        algorithm: "cyclicsort",
        lockAlgorithm: true,
        title: "Sending each value to the index it names",
      },
      pitfalls: [
        {
          title: "Comparing indices instead of values",
          body: "Writing `while i != a[i] - 1: swap` looks equivalent and loops forever the moment the array contains a duplicate, because the value at the target is equal but the indices never agree. Since half this lesson's problems *are about duplicates*, the value comparison is not a refinement — it is the version that works.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "Four problems, one loop",
      body: [
        "Cyclic sort on its own is a curiosity. What makes it worth a lesson is that after the placement pass, **the first index whose value is wrong tells you everything**, and different problems only differ in what they read off it.",
        "Add one guard — skip values that fall outside `1..n` — and the same loop handles arrays containing negatives, zeroes and out-of-range values without any special casing. Those are simply left where they are, and they end up occupying exactly the positions whose rightful values are absent.",
        "The four problems below appear separately on every sheet. They are one problem with four different final scans.",
      ],
      examples: [
        {
          id: "family",
          title: "The same placement pass, four different readings",
          lang: "python",
          code: `def place(a):
    """Cyclic sort, tolerant of duplicates and out-of-range values."""
    i = 0
    n = len(a)
    while i < n:
        target = a[i] - 1
        if 0 <= target < n and a[i] != a[target]:
            a[i], a[target] = a[target], a[i]
        else:
            i += 1
    return a


def missing_number(a):            # values 0..n with one absent
    b = [v + 1 for v in a]        # shift to 1..n+1 so the same loop applies
    place(b)
    for i, v in enumerate(b):
        if v != i + 1:
            return i
    return len(a)


def find_duplicate(a):            # values 1..n-1, one appears twice
    place(a)
    for i, v in enumerate(a):
        if v != i + 1:
            return v
    return -1


def first_missing_positive(a):    # any integers; find the smallest absent positive
    place(a)
    for i, v in enumerate(a):
        if v != i + 1:
            return i + 1
    return len(a) + 1


def all_disappeared(a):           # values 1..n, some absent, some repeated
    place(a)
    return [i + 1 for i, v in enumerate(a) if v != i + 1]


print(f"{'problem':<26} {'input':<28} answer")
print("-" * 70)
cases = [
    ("missing number",        missing_number,        [3, 0, 1]),
    ("missing number",        missing_number,        [0, 1]),
    ("find the duplicate",    find_duplicate,        [1, 3, 4, 2, 2]),
    ("first missing positive", first_missing_positive, [3, 4, -1, 1]),
    ("first missing positive", first_missing_positive, [1, 2, 0]),
    ("first missing positive", first_missing_positive, [7, 8, 9, 11, 12]),
    ("all disappeared",       all_disappeared,       [4, 3, 2, 7, 8, 2, 3, 1]),
]
for name, fn, data in cases:
    print(f"{name:<26} {str(data):<28} {fn(list(data))}")

print()
print("one loop, four problems — only the final scan changes")`,
          output: `problem                    input                        answer
----------------------------------------------------------------------
missing number             [3, 0, 1]                    2
missing number             [0, 1]                       2
find the duplicate         [1, 3, 4, 2, 2]              2
first missing positive     [3, 4, -1, 1]                2
first missing positive     [1, 2, 0]                    3
first missing positive     [7, 8, 9, 11, 12]            1
all disappeared            [4, 3, 2, 7, 8, 2, 3, 1]     [5, 6]

one loop, four problems — only the final scan changes`,
          explanation:
            "**First missing positive is the one usually rated hard**, and here it is four lines after the shared pass — which is the whole argument for learning the pattern rather than the problems. Its three test cases cover the three shapes: a gap in the middle, a full prefix so the answer is n + 1, and values entirely out of range so the answer is 1. The `0 <= target < n` guard is what lets `-1`, `0` and `11` be present without breaking anything; they are simply never placed, and they come to rest in the slots whose real values are missing. The shift by one in `missing_number` is worth noticing as a technique in itself — rather than write a second loop for 0-based values, translate the input into the form the existing loop expects.",
          alternates: [
            {
              lang: "javascript",
              code: `/** Cyclic sort, tolerant of duplicates and out-of-range values. */
function place(a) {
  let i = 0;
  const n = a.length;
  while (i < n) {
    const target = a[i] - 1;
    if (target >= 0 && target < n && a[i] !== a[target]) {
      const t = a[i];
      a[i] = a[target];
      a[target] = t;
    } else {
      i++;
    }
  }
  return a;
}

function missingNumber(a) {            // values 0..n with one absent
  const b = a.map((v) => v + 1);       // shift to 1..n+1 so the same loop applies
  place(b);
  for (let i = 0; i < b.length; i++) if (b[i] !== i + 1) return i;
  return a.length;
}

function findDuplicate(a) {            // values 1..n-1, one appears twice
  place(a);
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) return a[i];
  return -1;
}

function firstMissingPositive(a) {     // any integers; find the smallest absent positive
  place(a);
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) return i + 1;
  return a.length + 1;
}

function allDisappeared(a) {           // values 1..n, some absent, some repeated
  place(a);
  const out = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) out.push(i + 1);
  return out;
}

const show = (a) => \`[\${a.join(", ")}]\`;

console.log(\`\${"problem".padEnd(26)} \${"input".padEnd(28)} answer\`);
console.log("-".repeat(70));
const cases = [
  ["missing number", (d) => String(missingNumber(d)), [3, 0, 1]],
  ["missing number", (d) => String(missingNumber(d)), [0, 1]],
  ["find the duplicate", (d) => String(findDuplicate(d)), [1, 3, 4, 2, 2]],
  ["first missing positive", (d) => String(firstMissingPositive(d)), [3, 4, -1, 1]],
  ["first missing positive", (d) => String(firstMissingPositive(d)), [1, 2, 0]],
  ["first missing positive", (d) => String(firstMissingPositive(d)), [7, 8, 9, 11, 12]],
  ["all disappeared", (d) => show(allDisappeared(d)), [4, 3, 2, 7, 8, 2, 3, 1]],
];
for (const [name, fn, data] of cases) {
  console.log(\`\${name.padEnd(26)} \${show(data).padEnd(28)} \${fn(data.slice())}\`);
}

console.log();
console.log("one loop, four problems — only the final scan changes");`,
            },
            {
              lang: "typescript",
              code: `/** Cyclic sort, tolerant of duplicates and out-of-range values. */
function place(a: number[]): number[] {
  let i = 0;
  const n = a.length;
  while (i < n) {
    const target = a[i] - 1;
    if (target >= 0 && target < n && a[i] !== a[target]) {
      const t = a[i];
      a[i] = a[target];
      a[target] = t;
    } else {
      i++;
    }
  }
  return a;
}

function missingNumber(a: number[]): number {            // values 0..n with one absent
  const b = a.map((v: number) => v + 1);       // shift to 1..n+1 so the same loop applies
  place(b);
  for (let i = 0; i < b.length; i++) if (b[i] !== i + 1) return i;
  return a.length;
}

function findDuplicate(a: number[]): number {            // values 1..n-1, one appears twice
  place(a);
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) return a[i];
  return -1;
}

function firstMissingPositive(a: number[]): number {     // any integers; find the smallest absent positive
  place(a);
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) return i + 1;
  return a.length + 1;
}

function allDisappeared(a: number[]): number[] {           // values 1..n, some absent, some repeated
  place(a);
  const out: number[] = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== i + 1) out.push(i + 1);
  return out;
}

const show = (a: number[]): string => \`[\${a.join(", ")}]\`;

console.log(\`\${"problem".padEnd(26)} \${"input".padEnd(28)} answer\`);
console.log("-".repeat(70));
const cases: [string, (d: number[]) => string, number[]][] = [
  ["missing number", (d: number[]) => String(missingNumber(d)), [3, 0, 1]],
  ["missing number", (d: number[]) => String(missingNumber(d)), [0, 1]],
  ["find the duplicate", (d: number[]) => String(findDuplicate(d)), [1, 3, 4, 2, 2]],
  ["first missing positive", (d: number[]) => String(firstMissingPositive(d)), [3, 4, -1, 1]],
  ["first missing positive", (d: number[]) => String(firstMissingPositive(d)), [1, 2, 0]],
  ["first missing positive", (d: number[]) => String(firstMissingPositive(d)), [7, 8, 9, 11, 12]],
  ["all disappeared", (d: number[]) => show(allDisappeared(d)), [4, 3, 2, 7, 8, 2, 3, 1]],
];
for (const [name, fn, data] of cases) {
  console.log(\`\${name.padEnd(26)} \${show(data).padEnd(28)} \${fn(data.slice())}\`);
}

console.log();
console.log("one loop, four problems — only the final scan changes");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

public class Main {
    /** Cyclic sort, tolerant of duplicates and out-of-range values. */
    static int[] place(int[] a) {
        int i = 0, n = a.length;
        while (i < n) {
            int target = a[i] - 1;
            if (target >= 0 && target < n && a[i] != a[target]) {
                int t = a[i];
                a[i] = a[target];
                a[target] = t;
            } else {
                i++;
            }
        }
        return a;
    }

    static int missingNumber(int[] a) {          // values 0..n with one absent
        int[] b = new int[a.length];
        for (int i = 0; i < a.length; i++) b[i] = a[i] + 1;   // shift to 1..n+1
        place(b);
        for (int i = 0; i < b.length; i++) if (b[i] != i + 1) return i;
        return a.length;
    }

    static int findDuplicate(int[] a) {          // values 1..n-1, one appears twice
        place(a);
        for (int i = 0; i < a.length; i++) if (a[i] != i + 1) return a[i];
        return -1;
    }

    static int firstMissingPositive(int[] a) {   // any integers; smallest absent positive
        place(a);
        for (int i = 0; i < a.length; i++) if (a[i] != i + 1) return i + 1;
        return a.length + 1;
    }

    static List<Integer> allDisappeared(int[] a) { // values 1..n, some absent, some repeated
        place(a);
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < a.length; i++) if (a[i] != i + 1) out.add(i + 1);
        return out;
    }

    /* Python prints whatever the function returned, int or list alike. Here the
       four return types have to meet somewhere, so each case carries a small
       function that renders its own answer. */
    record Case(String name, Function<int[], String> fn, int[] data) {}

    public static void main(String[] args) {
        System.out.printf("%-26s %-28s answer%n", "problem", "input");
        System.out.println("-".repeat(70));
        Case[] cases = {
            new Case("missing number", d -> String.valueOf(missingNumber(d)), new int[]{3, 0, 1}),
            new Case("missing number", d -> String.valueOf(missingNumber(d)), new int[]{0, 1}),
            new Case("find the duplicate", d -> String.valueOf(findDuplicate(d)), new int[]{1, 3, 4, 2, 2}),
            new Case("first missing positive", d -> String.valueOf(firstMissingPositive(d)), new int[]{3, 4, -1, 1}),
            new Case("first missing positive", d -> String.valueOf(firstMissingPositive(d)), new int[]{1, 2, 0}),
            new Case("first missing positive", d -> String.valueOf(firstMissingPositive(d)), new int[]{7, 8, 9, 11, 12}),
            new Case("all disappeared", d -> allDisappeared(d).toString(), new int[]{4, 3, 2, 7, 8, 2, 3, 1}),
        };
        for (Case c : cases) {
            System.out.printf("%-26s %-28s %s%n", c.name(), Arrays.toString(c.data()), c.fn().apply(c.data().clone()));
        }

        System.out.println();
        System.out.println("one loop, four problems — only the final scan changes");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// Cyclic sort, tolerant of duplicates and out-of-range values.
static std::vector<int>& place(std::vector<int>& a) {
    size_t i = 0, n = a.size();
    while (i < n) {
        long long target = static_cast<long long>(a[i]) - 1;
        if (target >= 0 && target < static_cast<long long>(n) && a[i] != a[target]) {
            std::swap(a[i], a[target]);
        } else {
            i++;
        }
    }
    return a;
}

static int missing_number(std::vector<int> a) {          // values 0..n with one absent
    std::vector<int> b;
    for (int v : a) b.push_back(v + 1);                  // shift to 1..n+1
    place(b);
    for (size_t i = 0; i < b.size(); ++i)
        if (b[i] != static_cast<int>(i) + 1) return static_cast<int>(i);
    return static_cast<int>(a.size());
}

static int find_duplicate(std::vector<int> a) {          // values 1..n-1, one appears twice
    place(a);
    for (size_t i = 0; i < a.size(); ++i)
        if (a[i] != static_cast<int>(i) + 1) return a[i];
    return -1;
}

static int first_missing_positive(std::vector<int> a) {  // smallest absent positive
    place(a);
    for (size_t i = 0; i < a.size(); ++i)
        if (a[i] != static_cast<int>(i) + 1) return static_cast<int>(i) + 1;
    return static_cast<int>(a.size()) + 1;
}

static std::vector<int> all_disappeared(std::vector<int> a) { // some absent, some repeated
    place(a);
    std::vector<int> out;
    for (size_t i = 0; i < a.size(); ++i)
        if (a[i] != static_cast<int>(i) + 1) out.push_back(static_cast<int>(i) + 1);
    return out;
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
    std::cout << std::left << std::setw(26) << "problem" << ' '
              << std::setw(28) << "input" << " answer\\n";
    std::cout << std::string(70, '-') << '\\n';

    /* Python prints whatever the function returned, int or vector alike. Here the
       four return types have to meet somewhere, so each case carries a small
       function that renders its own answer. */
    using Fn = std::function<std::string(std::vector<int>)>;
    const std::vector<std::tuple<std::string, Fn, std::vector<int>>> cases = {
        {"missing number", [](std::vector<int> d) { return std::to_string(missing_number(d)); }, {3, 0, 1}},
        {"missing number", [](std::vector<int> d) { return std::to_string(missing_number(d)); }, {0, 1}},
        {"find the duplicate", [](std::vector<int> d) { return std::to_string(find_duplicate(d)); }, {1, 3, 4, 2, 2}},
        {"first missing positive", [](std::vector<int> d) { return std::to_string(first_missing_positive(d)); }, {3, 4, -1, 1}},
        {"first missing positive", [](std::vector<int> d) { return std::to_string(first_missing_positive(d)); }, {1, 2, 0}},
        {"first missing positive", [](std::vector<int> d) { return std::to_string(first_missing_positive(d)); }, {7, 8, 9, 11, 12}},
        {"all disappeared", [](std::vector<int> d) { return show(all_disappeared(d)); }, {4, 3, 2, 7, 8, 2, 3, 1}},
    };
    for (const auto& c : cases) {
        // The call runs first: \`<<\` evaluates left to right, and the answer has
        // to exist before the row it belongs to is streamed.
        std::string answer = std::get<1>(c)(std::get<2>(c));
        std::cout << std::left << std::setw(26) << std::get<0>(c) << ' '
                  << std::setw(28) << show(std::get<2>(c)) << ' ' << answer << '\\n';
    }

    std::cout << '\\n';
    std::cout << "one loop, four problems — only the final scan changes\\n";
}`,
            },
            {
              lang: "rust",
              code: `/// Cyclic sort, tolerant of duplicates and out-of-range values.
fn place(a: &mut Vec<i32>) {
    let (mut i, n) = (0usize, a.len());
    while i < n {
        let target = a[i] - 1;
        if target >= 0 && (target as usize) < n && a[i] != a[target as usize] {
            a.swap(i, target as usize);
        } else {
            i += 1;
        }
    }
}

fn missing_number(a: Vec<i32>) -> i32 {          // values 0..n with one absent
    let mut b: Vec<i32> = a.iter().map(|v| v + 1).collect();   // shift to 1..n+1
    place(&mut b);
    for (i, &v) in b.iter().enumerate() {
        if v != i as i32 + 1 {
            return i as i32;
        }
    }
    a.len() as i32
}

fn find_duplicate(mut a: Vec<i32>) -> i32 {      // values 1..n-1, one appears twice
    place(&mut a);
    for (i, &v) in a.iter().enumerate() {
        if v != i as i32 + 1 {
            return v;
        }
    }
    -1
}

fn first_missing_positive(mut a: Vec<i32>) -> i32 {  // smallest absent positive
    place(&mut a);
    for (i, &v) in a.iter().enumerate() {
        if v != i as i32 + 1 {
            return i as i32 + 1;
        }
    }
    a.len() as i32 + 1
}

fn all_disappeared(mut a: Vec<i32>) -> Vec<i32> {    // some absent, some repeated
    place(&mut a);
    a.iter()
        .enumerate()
        .filter(|(i, &v)| v != *i as i32 + 1)
        .map(|(i, _)| i as i32 + 1)
        .collect()
}

fn show(a: &[i32]) -> String {
    let parts: Vec<String> = a.iter().map(|v| v.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn main() {
    println!("{:<26} {:<28} answer", "problem", "input");
    println!("{}", "-".repeat(70));

    // Python prints whatever the function returned, int or list alike. Here the
    // four return types have to meet somewhere, so each case carries a small
    // closure that renders its own answer.
    type Answer = Box<dyn Fn(Vec<i32>) -> String>;
    let cases: Vec<(&str, Answer, Vec<i32>)> = vec![
        ("missing number", Box::new(|d| missing_number(d).to_string()), vec![3, 0, 1]),
        ("missing number", Box::new(|d| missing_number(d).to_string()), vec![0, 1]),
        ("find the duplicate", Box::new(|d| find_duplicate(d).to_string()), vec![1, 3, 4, 2, 2]),
        ("first missing positive", Box::new(|d| first_missing_positive(d).to_string()), vec![3, 4, -1, 1]),
        ("first missing positive", Box::new(|d| first_missing_positive(d).to_string()), vec![1, 2, 0]),
        ("first missing positive", Box::new(|d| first_missing_positive(d).to_string()), vec![7, 8, 9, 11, 12]),
        ("all disappeared", Box::new(|d| show(&all_disappeared(d))), vec![4, 3, 2, 7, 8, 2, 3, 1]),
    ];
    for (name, f, data) in &cases {
        println!("{:<26} {:<28} {}", name, show(data), f(data.clone()));
    }

    println!();
    println!("one loop, four problems — only the final scan changes");
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

// place is a cyclic sort, tolerant of duplicates and out-of-range values.
func place(a []int) []int {
	i, n := 0, len(a)
	for i < n {
		target := a[i] - 1
		if target >= 0 && target < n && a[i] != a[target] {
			a[i], a[target] = a[target], a[i]
		} else {
			i++
		}
	}
	return a
}

func missingNumber(a []int) int { // values 0..n with one absent
	b := make([]int, len(a))
	for i, v := range a {
		b[i] = v + 1 // shift to 1..n+1 so the same loop applies
	}
	place(b)
	for i, v := range b {
		if v != i+1 {
			return i
		}
	}
	return len(a)
}

func findDuplicate(a []int) int { // values 1..n-1, one appears twice
	place(a)
	for i, v := range a {
		if v != i+1 {
			return v
		}
	}
	return -1
}

func firstMissingPositive(a []int) int { // smallest absent positive
	place(a)
	for i, v := range a {
		if v != i+1 {
			return i + 1
		}
	}
	return len(a) + 1
}

func allDisappeared(a []int) []int { // values 1..n, some absent, some repeated
	place(a)
	var out []int
	for i, v := range a {
		if v != i+1 {
			out = append(out, i+1)
		}
	}
	return out
}

func show(a []int) string {
	parts := make([]string, len(a))
	for i, v := range a {
		parts[i] = strconv.Itoa(v)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func main() {
	fmt.Printf("%-26s %-28s answer\\n", "problem", "input")
	fmt.Println(strings.Repeat("-", 70))

	// Python prints whatever the function returned, int or list alike. Here the
	// four return types have to meet somewhere, so each case carries a small
	// function that renders its own answer.
	cases := []struct {
		name string
		fn   func([]int) string
		data []int
	}{
		{"missing number", func(d []int) string { return strconv.Itoa(missingNumber(d)) }, []int{3, 0, 1}},
		{"missing number", func(d []int) string { return strconv.Itoa(missingNumber(d)) }, []int{0, 1}},
		{"find the duplicate", func(d []int) string { return strconv.Itoa(findDuplicate(d)) }, []int{1, 3, 4, 2, 2}},
		{"first missing positive", func(d []int) string { return strconv.Itoa(firstMissingPositive(d)) }, []int{3, 4, -1, 1}},
		{"first missing positive", func(d []int) string { return strconv.Itoa(firstMissingPositive(d)) }, []int{1, 2, 0}},
		{"first missing positive", func(d []int) string { return strconv.Itoa(firstMissingPositive(d)) }, []int{7, 8, 9, 11, 12}},
		{"all disappeared", func(d []int) string { return show(allDisappeared(d)) }, []int{4, 3, 2, 7, 8, 2, 3, 1}},
	}
	for _, c := range cases {
		d := append([]int(nil), c.data...)
		fmt.Printf("%-26s %-28s %s\\n", c.name, show(c.data), c.fn(d))
	}

	fmt.Println()
	fmt.Println("one loop, four problems — only the final scan changes")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-alternatives",
      heading: "The arithmetic alternatives, and where one of them breaks",
      body: [
        "For the single-missing-number case there are two shorter answers, and it is worth knowing all three along with their trade-offs.",
        "**The sum formula.** The values 0 to n sum to n(n+1)/2, so subtract the actual sum and the difference is the missing value. Two lines. It only works when exactly one value is missing and nothing repeats, and it is vulnerable to overflow.",
        "**XOR.** XOR every index and every value together, and every present value cancels with its index — leaving the missing one, since `x ^ x == 0`. Also two lines, no formula, and **no overflow is possible**, because XOR is bitwise and never produces a value wider than its inputs.",
        "**Cyclic sort.** Longer, and the only one that generalises to duplicates, multiple missing values, and out-of-range input.",
        "The overflow point deserves an actual demonstration rather than a warning, because the failure is not where people expect it to be.",
      ],
      examples: [
        {
          id: "overflow",
          title: "Where the sum formula actually fails",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int byIntSum(int[] a) {
        int n = a.length;
        int expected = n * (n + 1) / 2;          // the multiply overflows first
        int actual = 0;
        for (int v : a) actual += v;             // so does this
        return expected - actual;
    }

    static int byLongSum(int[] a) {
        int n = a.length;
        long expected = (long) n * (n + 1) / 2;
        long actual = 0;
        for (int v : a) actual += v;
        return (int) (expected - actual);
    }

    static int byXor(int[] a) {
        int x = 0;
        for (int i = 0; i < a.length; i++) x ^= i ^ a[i];
        return x ^ a.length;
    }

    public static void main(String[] args) {
        System.out.printf("%-10s %-10s %14s %14s %10s%n",
                "n", "missing", "int sum", "long sum", "xor");
        System.out.println("-".repeat(62));
        for (int n : new int[]{5, 100_000, 200_000}) {
            int[] a = new int[n];
            int missing = n / 3;
            for (int i = 0, w = 0; i <= n; i++) if (i != missing) a[w++] = i;
            System.out.printf("%-10d %-10d %14d %14d %10d%n",
                    n, missing, byIntSum(a), byLongSum(a), byXor(a));
        }

        System.out.println();
        int n = 200_000;
        System.out.println("what happened at n = 200,000:");
        System.out.printf("  n * (n + 1)          as long = %,d%n", (long) n * (n + 1));
        System.out.printf("  n * (n + 1)          as int  = %,d   <- wrapped%n", n * (n + 1));
        System.out.printf("  n * (n + 1) / 2      as int  = %,d%n", n * (n + 1) / 2);
        System.out.printf("  (long) n * (n+1) / 2         = %,d%n", (long) n * (n + 1) / 2);
        System.out.println();
        System.out.println("the wrapping is not what breaks it — the division after it is.");
        System.out.println("halving a wrapped value is not the wrapped half.");
        System.out.println("XOR has no formula, no division and cannot overflow.");
    }
}`,
          output: `n          missing           int sum       long sum        xor
--------------------------------------------------------------
5          1                       1              1          1
100000     33333               33333          33333      33333
200000     66666         -2147416982          66666      66666

what happened at n = 200,000:
  n * (n + 1)          as long = 40,000,200,000
  n * (n + 1)          as int  = 1,345,494,336   <- wrapped
  n * (n + 1) / 2      as int  = 672,747,168
  (long) n * (n+1) / 2         = 20,000,100,000

the wrapping is not what breaks it — the division after it is.
halving a wrapped value is not the wrapped half.
XOR has no formula, no division and cannot overflow.`,
          explanation:
            "This is a better lesson than \"beware of overflow\". At **n = 100,000 the int version is already overflowing and still returns the right answer**, because two's complement addition and subtraction are exact modulo 2³², so two wrapped sums differ by the true difference. At n = 200,000 it returns nonsense — and the reason is the `/ 2`. Division is *not* well defined modulo 2³²: halving the wrapped 1,345,494,336 gives 672,747,168, which is not the wrapped value of the true 20,000,100,000. So the danger is not addition, which survives, but the multiply-then-divide in the closed-form formula. **The fix is `(long) n * (n + 1) / 2`, with the cast on the first operand** — casting the result instead is too late, since the multiplication has already happened in `int`.",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module",
      body: [
        "That is the first module of Module 1, and it has a theme worth naming before moving on.",
        "**Everything here was one array and two or three indices.** Compaction, partitioning, the flag, spiral boundaries, cyclic sort — none of them allocated anything, and all of them worked by maintaining an invariant about what each region of the array contains. That is the skill this module was actually teaching; the individual problems are consequences of it.",
        "**The three habits to carry.** State the invariant in one sentence before writing the loop, and you will not get the pointer updates wrong. Test on the shapes that break boundary code — 1×1, single row, single column, non-square. And when the constraints say the values lie in 1 to n, stop and ask whether the array can index itself.",
        "**On the sheet.** *Valid Anagram* is the counting move from lesson two, and *Contains Duplicate* is the same idea one level simpler. *Product of Array Except Self* is a two-pass in-place construction of exactly the kind lesson three set up, and it is the natural bridge into prefix sums. *Two Sum* is there for contrast — it is the first problem in the track where no amount of pointer discipline helps and you need a different structure entirely, which is what the hashing module is for.",
        "**What comes next.** Two pointers takes the idea of indices moving under an invariant and adds a proof obligation: showing that moving a pointer discards nothing you needed. Everything after that — windows, prefix sums, binary search — is the same discipline applied to progressively less obvious invariants.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "An array of length n holds the values 1 to n in some order. Sort it in O(n).",
      answer:
        "Cyclic sort. Walk the array with an index i; the value v at position i belongs at index v − 1, so if it is not there already, swap it there and do not advance i, because the element that just arrived has not been checked. Advance only when the value at i is already correct. It is O(n) despite the while loop, because every swap places at least one value permanently and there are only n values to place, so there are at most n swaps overall. Compare values rather than indices — `a[i] != a[target]` — or the loop spins forever on duplicates.",
    },
    {
      question: "Find the smallest missing positive integer in an unsorted array, in O(n) time and O(1) space.",
      answer:
        "Cyclic sort with a range guard. Place each value v in 1..n at index v − 1, ignoring anything outside that range, then scan for the first index i where a[i] != i + 1 and return i + 1; if there is no such index the answer is n + 1. The out-of-range values need no special handling — they are simply never placed, and they come to rest in exactly the slots whose rightful values are absent. Both passes are O(n) and the sort is in place, which is what makes the O(1) space claim honest. The three cases worth testing are a gap in the middle, a complete prefix so the answer is n + 1, and all values out of range so the answer is 1.",
    },
    {
      question: "Three ways to find the one missing number in 0..n — which would you use?",
      answer:
        "XOR, usually. XOR every index and every value together and each present value cancels with its own index, leaving the missing one — two lines, no formula, and it cannot overflow because XOR never widens its inputs. The sum formula n(n+1)/2 minus the actual sum is equally short but has a real overflow hazard, and interestingly the addition is not the problem: two's complement addition is exact modulo 2³², so wrapped sums still differ correctly. It is the `/ 2` that breaks it, because division is not well defined modulo 2³² — measured, the int version is fine at n = 100,000 and wrong at n = 200,000. Write `(long) n * (n + 1) / 2` with the cast on the first operand. Cyclic sort is the longest of the three and the only one that survives duplicates or several missing values.",
    },
  ],
  takeaways: [
    "\"Values in 1 to n\" means the array can index itself — value v belongs at index v − 1",
    "Cyclic sort: swap into place without advancing; advance only when correct",
    "At most n swaps overall, because each one places a value permanently — O(n)",
    "Compare values, not indices, or duplicates spin the loop forever",
    "One placement pass, then the first wrong index answers four different problems",
    "A `1 <= v <= n` guard lets negatives and out-of-range values pass through harmlessly",
    "XOR cannot overflow; the sum formula's `/ 2` is what breaks, not the addition",
    "Cast the first operand: `(long) n * (n + 1) / 2`",
  ],
  status: "available",
};
