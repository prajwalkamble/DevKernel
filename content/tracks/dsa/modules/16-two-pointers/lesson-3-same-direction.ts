import type { Lesson } from "@/content/types";

export const sameDirectionLesson: Lesson = {
  id: "dsa-tp-same",
  slug: "same-direction-read-write-and-lag",
  moduleSlug: "two-pointers",
  title: "Same Direction: Read/Write, Fast/Slow & Lag",
  summary:
    "The other half of the pattern. Both pointers move the same way, and the gap between them carries the meaning — which is how in-place filtering, cycle detection and \"nth from the end\" all become one pass with no extra memory.",
  estimatedMinutes: 30,
  objectives: [
    "Write the read/write pair for in-place filtering",
    "State what the region behind the write pointer always holds",
    "Use a fixed lag to solve \"nth from the end\" in one pass",
    "Use fast/slow to find a midpoint or detect a cycle",
    "Distinguish this from a sliding window",
  ],
  sections: [
    {
      id: "read-write",
      heading: "Read and write",
      body: [
        "The most common same-direction pair. **`read` visits every element; `write` marks where the next kept element goes.** They start together, `read` always runs ahead, and the answer is `write` at the end.",
        "The invariant is worth stating exactly, because it is what makes the code obviously correct: **everything in `a[0:write]` is finished and correct; everything from `read` onwards is unexamined; the gap between them is garbage nobody will read.**",
        "This is how you filter, deduplicate, compact or partition an array with O(1) extra space — the family the arrays module introduced, now with a name.",
      ],
      examples: [
        {
          id: "same-direction",
          title: "Read/write, fast/slow, and lag-by-k",
          lang: "python",
          code: `# Same-direction pointers: read/write, fast/slow, and lag-by-k.

def remove_duplicates(a):
    """Sorted input. \`write\` marks where the next kept element goes."""
    if not a:
        return 0
    write = 1
    for read in range(1, len(a)):
        if a[read] != a[write - 1]:
            a[write] = a[read]
            write += 1
    return write

a = [1, 1, 2, 2, 2, 3, 5, 5]
n = remove_duplicates(a)
print("after dedup:", a[:n], " tail (ignored):", a[n:])

def move_zeroes(a):
    write = 0
    for read in range(len(a)):
        if a[read] != 0:
            a[write], a[read] = a[read], a[write]
            write += 1
    return a

print("move zeroes:", move_zeroes([0, 1, 0, 3, 12]))

# Fast/slow on a list, expressed on an array for clarity.
def middle(a):
    slow = fast = 0
    while fast + 1 < len(a):
        slow += 1
        fast += 2
    return slow

for xs in ([1, 2, 3, 4, 5], [1, 2, 3, 4], [1], [1, 2]):
    print(f"  middle of {str(xs):15} -> index {middle(xs)} value {xs[middle(xs)]}")

# Lag by k: the nth node from the end, in one pass.
def nth_from_end(a, k):
    lead = k
    trail = 0
    while lead < len(a):
        lead += 1
        trail += 1
    return trail

b = [10, 20, 30, 40, 50]
for k in (1, 2, 5):
    print(f"  {k} from end of {b} -> index {nth_from_end(b, k)} value {b[nth_from_end(b, k)]}")`,
          output: `after dedup: [1, 2, 3, 5]  tail (ignored): [2, 3, 5, 5]
move zeroes: [1, 3, 12, 0, 0]
  middle of [1, 2, 3, 4, 5] -> index 2 value 3
  middle of [1, 2, 3, 4]    -> index 2 value 3
  middle of [1]             -> index 0 value 1
  middle of [1, 2]          -> index 1 value 2
  1 from end of [10, 20, 30, 40, 50] -> index 4 value 50
  2 from end of [10, 20, 30, 40, 50] -> index 3 value 40
  5 from end of [10, 20, 30, 40, 50] -> index 0 value 10`,
          explanation:
            "The dedup leaves `[2, 3, 5, 5]` behind the write pointer — deliberate garbage. The function returns a *length*, and the caller reads only that prefix. Problems in this family say \"return k, and the first k elements should be…\", which is exactly this contract.\n\n`move_zeroes` swaps rather than overwrites, which is what gets the zeros to the back in one pass instead of needing a fill loop afterwards.\n\n**Lag by k** is the trick behind \"remove the nth node from the end\" on a linked list, where you cannot ask for the length. Start one pointer k ahead; walk both until the leader falls off the end; the trailer is sitting exactly k from the end. On an array this is arithmetic, but on a list it is the only single-pass way.",
          alternates: [
            {
              lang: "javascript",
              code: `// Same-direction pointers: read/write, fast/slow, and lag-by-k.
const list = (xs) => "[" + xs.join(", ") + "]";

// Sorted input. \`write\` marks where the next kept element goes.
function removeDuplicates(a) {
  if (a.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < a.length; read++) {
    if (a[read] !== a[write - 1]) {
      a[write] = a[read];
      write++;
    }
  }
  return write;
}

const a = [1, 1, 2, 2, 2, 3, 5, 5];
const n = removeDuplicates(a);
console.log("after dedup:", list(a.slice(0, n)), " tail (ignored):", list(a.slice(n)));

function moveZeroes(a) {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] !== 0) {
      [a[write], a[read]] = [a[read], a[write]];
      write++;
    }
  }
  return a;
}

console.log("move zeroes:", list(moveZeroes([0, 1, 0, 3, 12])));

// Fast/slow on a list, expressed on an array for clarity.
function middle(a) {
  let slow = 0;
  let fast = 0;
  while (fast + 1 < a.length) {
    slow++;
    fast += 2;
  }
  return slow;
}

for (const xs of [[1, 2, 3, 4, 5], [1, 2, 3, 4], [1], [1, 2]]) {
  const m = middle(xs);
  console.log(\`  middle of \${list(xs).padEnd(15)} -> index \${m} value \${xs[m]}\`);
}

// Lag by k: the nth node from the end, in one pass.
function nthFromEnd(a, k) {
  let lead = k;
  let trail = 0;
  while (lead < a.length) {
    lead++;
    trail++;
  }
  return trail;
}

const b = [10, 20, 30, 40, 50];
for (const k of [1, 2, 5]) {
  const i = nthFromEnd(b, k);
  console.log(\`  \${k} from end of \${list(b)} -> index \${i} value \${b[i]}\`);
}`,
            },
            {
              lang: "typescript",
              code: `// Same-direction pointers: read/write, fast/slow, and lag-by-k.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

// Sorted input. \`write\` marks where the next kept element goes.
function removeDuplicates(a: number[]): number {
  if (a.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < a.length; read++) {
    if (a[read] !== a[write - 1]) {
      a[write] = a[read];
      write++;
    }
  }
  return write;
}

const a: number[] = [1, 1, 2, 2, 2, 3, 5, 5];
const n = removeDuplicates(a);
console.log("after dedup:", list(a.slice(0, n)), " tail (ignored):", list(a.slice(n)));

function moveZeroes(a: number[]): number[] {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] !== 0) {
      [a[write], a[read]] = [a[read], a[write]];
      write++;
    }
  }
  return a;
}

console.log("move zeroes:", list(moveZeroes([0, 1, 0, 3, 12])));

// Fast/slow on a list, expressed on an array for clarity.
function middle(a: number[]): number {
  let slow = 0;
  let fast = 0;
  while (fast + 1 < a.length) {
    slow++;
    fast += 2;
  }
  return slow;
}

for (const xs of [[1, 2, 3, 4, 5], [1, 2, 3, 4], [1], [1, 2]]) {
  const m = middle(xs);
  console.log(\`  middle of \${list(xs).padEnd(15)} -> index \${m} value \${xs[m]}\`);
}

// Lag by k: the nth node from the end, in one pass.
function nthFromEnd(a: number[], k: number): number {
  let lead = k;
  let trail = 0;
  while (lead < a.length) {
    lead++;
    trail++;
  }
  return trail;
}

const b: number[] = [10, 20, 30, 40, 50];
for (const k of [1, 2, 5]) {
  const i = nthFromEnd(b, k);
  console.log(\`  \${k} from end of \${list(b)} -> index \${i} value \${b[i]}\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(int[] xs, int from, int to) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = from; i < to; i++) {
            if (i > from) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static String list(int[] xs) {
        return list(xs, 0, xs.length);
    }

    /** Sorted input. \`write\` marks where the next kept element goes. */
    static int removeDuplicates(int[] a) {
        if (a.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < a.length; read++) {
            if (a[read] != a[write - 1]) {
                a[write] = a[read];
                write++;
            }
        }
        return write;
    }

    static int[] moveZeroes(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] != 0) {
                int t = a[write];
                a[write] = a[read];
                a[read] = t;
                write++;
            }
        }
        return a;
    }

    /** Fast/slow on a list, expressed on an array for clarity. */
    static int middle(int[] a) {
        int slow = 0, fast = 0;
        while (fast + 1 < a.length) {
            slow++;
            fast += 2;
        }
        return slow;
    }

    /** Lag by k: the nth node from the end, in one pass. */
    static int nthFromEnd(int[] a, int k) {
        int lead = k, trail = 0;
        while (lead < a.length) {
            lead++;
            trail++;
        }
        return trail;
    }

    public static void main(String[] args) {
        int[] a = {1, 1, 2, 2, 2, 3, 5, 5};
        int n = removeDuplicates(a);
        System.out.println("after dedup: " + list(a, 0, n)
                + "  tail (ignored): " + list(a, n, a.length));

        System.out.println("move zeroes: " + list(moveZeroes(new int[]{0, 1, 0, 3, 12})));

        int[][] cases = {{1, 2, 3, 4, 5}, {1, 2, 3, 4}, {1}, {1, 2}};
        for (int[] xs : cases) {
            int m = middle(xs);
            System.out.printf("  middle of %-15s -> index %d value %d%n", list(xs), m, xs[m]);
        }

        int[] b = {10, 20, 30, 40, 50};
        for (int k : new int[]{1, 2, 5}) {
            int i = nthFromEnd(b, k);
            System.out.printf("  %d from end of %s -> index %d value %d%n", k, list(b), i, b[i]);
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Same-direction pointers: read/write, fast/slow, and lag-by-k.
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs, size_t from, size_t to) {
    string out = "[";
    for (size_t i = from; i < to; i++) {
        if (i > from) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

string list(const vector<int>& xs) { return list(xs, 0, xs.size()); }

// Sorted input. \`write\` marks where the next kept element goes.
size_t removeDuplicates(vector<int>& a) {
    if (a.empty()) return 0;
    size_t write = 1;
    for (size_t read = 1; read < a.size(); read++) {
        if (a[read] != a[write - 1]) {
            a[write] = a[read];
            write++;
        }
    }
    return write;
}

vector<int> moveZeroes(vector<int> a) {
    size_t write = 0;
    for (size_t read = 0; read < a.size(); read++) {
        if (a[read] != 0) {
            swap(a[write], a[read]);
            write++;
        }
    }
    return a;
}

// Fast/slow on a list, expressed on an array for clarity.
size_t middle(const vector<int>& a) {
    size_t slow = 0, fast = 0;
    while (fast + 1 < a.size()) {
        slow++;
        fast += 2;
    }
    return slow;
}

// Lag by k: the nth node from the end, in one pass.
size_t nthFromEnd(const vector<int>& a, size_t k) {
    size_t lead = k, trail = 0;
    while (lead < a.size()) {
        lead++;
        trail++;
    }
    return trail;
}

int main() {
    vector<int> a = {1, 1, 2, 2, 2, 3, 5, 5};
    size_t n = removeDuplicates(a);
    cout << "after dedup: " << list(a, 0, n)
         << "  tail (ignored): " << list(a, n, a.size()) << "\\n";

    cout << "move zeroes: " << list(moveZeroes({0, 1, 0, 3, 12})) << "\\n";

    vector<vector<int>> cases = {{1, 2, 3, 4, 5}, {1, 2, 3, 4}, {1}, {1, 2}};
    for (const auto& xs : cases) {
        size_t m = middle(xs);
        cout << "  middle of " << left << setw(15) << list(xs)
             << " -> index " << m << " value " << xs[m] << "\\n";
    }

    vector<int> b = {10, 20, 30, 40, 50};
    for (size_t k : {1, 2, 5}) {
        size_t i = nthFromEnd(b, k);
        cout << "  " << k << " from end of " << list(b)
             << " -> index " << i << " value " << b[i] << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `// Same-direction pointers: read/write, fast/slow, and lag-by-k.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Sorted input. \`write\` marks where the next kept element goes.
fn remove_duplicates(a: &mut [i32]) -> usize {
    if a.is_empty() {
        return 0;
    }
    let mut write = 1;
    for read in 1..a.len() {
        if a[read] != a[write - 1] {
            a[write] = a[read];
            write += 1;
        }
    }
    write
}

fn move_zeroes(mut a: Vec<i32>) -> Vec<i32> {
    let mut write = 0;
    for read in 0..a.len() {
        if a[read] != 0 {
            a.swap(write, read);
            write += 1;
        }
    }
    a
}

/// Fast/slow on a list, expressed on an array for clarity.
fn middle(a: &[i32]) -> usize {
    let (mut slow, mut fast) = (0usize, 0usize);
    while fast + 1 < a.len() {
        slow += 1;
        fast += 2;
    }
    slow
}

/// Lag by k: the nth node from the end, in one pass.
fn nth_from_end(a: &[i32], k: usize) -> usize {
    let (mut lead, mut trail) = (k, 0usize);
    while lead < a.len() {
        lead += 1;
        trail += 1;
    }
    trail
}

fn main() {
    let mut a = vec![1, 1, 2, 2, 2, 3, 5, 5];
    let n = remove_duplicates(&mut a);
    println!(
        "after dedup: {}  tail (ignored): {}",
        list(&a[..n]),
        list(&a[n..])
    );

    println!("move zeroes: {}", list(&move_zeroes(vec![0, 1, 0, 3, 12])));

    let cases: Vec<Vec<i32>> = vec![vec![1, 2, 3, 4, 5], vec![1, 2, 3, 4], vec![1], vec![1, 2]];
    for xs in &cases {
        let m = middle(xs);
        println!("  middle of {:<15} -> index {} value {}", list(xs), m, xs[m]);
    }

    let b = [10, 20, 30, 40, 50];
    for k in [1usize, 2, 5] {
        let i = nth_from_end(&b, k);
        println!("  {} from end of {} -> index {} value {}", k, list(&b), i, b[i]);
    }
}`,
            },
            {
              lang: "go",
              code: `// Same-direction pointers: read/write, fast/slow, and lag-by-k.
package main

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

// Sorted input. \`write\` marks where the next kept element goes.
func removeDuplicates(a []int) int {
	if len(a) == 0 {
		return 0
	}
	write := 1
	for read := 1; read < len(a); read++ {
		if a[read] != a[write-1] {
			a[write] = a[read]
			write++
		}
	}
	return write
}

func moveZeroes(a []int) []int {
	write := 0
	for read := range a {
		if a[read] != 0 {
			a[write], a[read] = a[read], a[write]
			write++
		}
	}
	return a
}

// Fast/slow on a list, expressed on an array for clarity.
func middle(a []int) int {
	slow, fast := 0, 0
	for fast+1 < len(a) {
		slow++
		fast += 2
	}
	return slow
}

// Lag by k: the nth node from the end, in one pass.
func nthFromEnd(a []int, k int) int {
	lead, trail := k, 0
	for lead < len(a) {
		lead++
		trail++
	}
	return trail
}

func main() {
	a := []int{1, 1, 2, 2, 2, 3, 5, 5}
	n := removeDuplicates(a)
	fmt.Println("after dedup:", list(a[:n]), " tail (ignored):", list(a[n:]))

	fmt.Println("move zeroes:", list(moveZeroes([]int{0, 1, 0, 3, 12})))

	cases := [][]int{{1, 2, 3, 4, 5}, {1, 2, 3, 4}, {1}, {1, 2}}
	for _, xs := range cases {
		m := middle(xs)
		fmt.Printf("  middle of %-15s -> index %d value %d\\n", list(xs), m, xs[m])
	}

	b := []int{10, 20, 30, 40, 50}
	for _, k := range []int{1, 2, 5} {
		i := nthFromEnd(b, k)
		fmt.Printf("  %d from end of %s -> index %d value %d\\n", k, list(b), i, b[i])
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "fast-slow",
      heading: "Fast and slow",
      body: [
        "Advance one pointer by one and the other by two. Two things fall out.",
        "**The midpoint.** When the fast pointer reaches the end, the slow one is halfway. On a linked list — where there is no index and no length — this is how you find the middle in one pass, and it is the first step of merge-sorting a list or checking one for palindromy.",
        "**Cycle detection.** In a structure with a cycle, the fast pointer laps the slow one and they meet; without a cycle, the fast one falls off the end. That is **Floyd's algorithm**, and the surprising part — that after meeting you can find the cycle's *entrance* by restarting one pointer at the head and walking both at the same speed — is derived in the linked-lists module.",
      ],
    },
    {
      id: "not-a-window",
      heading: "This is not a sliding window",
      body: [
        "Both patterns have two same-direction indices, and the distinction matters because it decides what you maintain.",
        "**Two pointers**: the gap has no meaning of its own. `write` is a *destination*; `slow` is a *position*. Nothing is being measured about the region between them.",
        "**Sliding window**: the region between the pointers is the answer being built, and you maintain a running summary of it — a sum, a count, a frequency map. The next module is entirely about that.",
        "If you find yourself keeping a running total of what is between the pointers, you are writing a window, and the window module's shrink-and-grow structure will serve you better than this one's.",
      ],
      pitfalls: [
        {
          title: "Comparing against `a[write - 1]`, not `a[read - 1]`",
          body: "In the dedup, the last *kept* value is at `write - 1`, not `read - 1` — those diverge as soon as anything is dropped. Using `read - 1` compares against a value that may have been discarded, and it fails on the first input with three or more consecutive duplicates.",
        },
        {
          title: "`fast + 1 < len` against `fast < len` changes which middle you get",
          body: "For an even-length input there are two middles. `fast + 1 < len` gives the first, `fast < len` gives the second. Neither is wrong; the problem statement decides, and it is the kind of off-by-one that only shows on even inputs.",
        },
      ],
    },
  ],
  takeaways: [
    "Read/write: `a[0:write]` is finished, `a[read:]` is unexamined, the gap is garbage",
    "The function returns a length, and the caller reads only that prefix",
    "Compare against `a[write - 1]` — the last *kept* value",
    "Lag by k solves \"nth from the end\" in one pass with no length",
    "Fast/slow finds the midpoint and detects cycles",
    "If you are summarising the region *between* the pointers, it is a window instead",
  ],
  status: "available",
};
