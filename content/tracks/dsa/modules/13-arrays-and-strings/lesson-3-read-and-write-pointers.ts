import type { Lesson } from "@/content/types";

export const readAndWritePointersLesson: Lesson = {
  id: "dsa-arr-compaction",
  slug: "the-read-pointer-and-the-write-pointer",
  moduleSlug: "arrays-and-strings",
  title: "The Read Pointer & the Write Pointer",
  summary:
    "One skeleton, an invariant you can state in a sentence, and a family of problems that stop being separate problems once you have it.",
  estimatedMinutes: 25,
  objectives: [
    "State the compaction invariant and use it to prove the loop correct",
    "Solve remove-element, dedupe, at-most-k and filter with one skeleton",
    "Choose between stable compaction and swap-with-the-end",
    "Return a length rather than a new array, and know why the problem asks for that",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "Two indices moving at different speeds",
      body: [
        "Here is the first genuine *pattern* in the track, as opposed to a technique. It has a shape you will recognise on sight after this lesson.",
        "The problem: remove some elements from an array, in place, using no extra space. The obvious approach — shift everything left whenever you delete something — is O(n) per deletion and O(n²) overall. The pattern does it in one pass.",
        "**Use two indices. `read` visits every element exactly once. `write` marks where the next kept element goes.** They start together; `read` advances every iteration; `write` advances only when something is kept. The gap between them is exactly the number of elements discarded so far.",
        "**The invariant** — the sentence that makes it correct, and the sentence to say out loud in an interview: *`a[0:write]` contains every element kept so far, in their original order.* It is true before the loop starts, since both are zero and the empty prefix trivially contains nothing. Each iteration preserves it. So it is true at the end, when `read` has seen everything — and \"everything kept, in order\" is the answer.",
      ],
      examples: [
        {
          id: "trace",
          title: "The two pointers, traced",
          lang: "python",
          code: `def move_zeroes(a):
    """Invariant: a[0:write] holds every kept element so far, in order."""
    write = 0
    print(f"  {'read':>4} {'value':>5} {'keep?':>6} {'write':>5}   array")
    print("  " + "-" * 46)
    for read in range(len(a)):
        value = a[read]
        keep = value != 0
        if keep:
            a[write], a[read] = a[read], a[write]
            write += 1
        print(f"  {read:>4} {value:>5} {str(keep):>6} {write:>5}   {a}")
    return write


print("move every zero to the end, keeping the order of the rest")
data = [0, 1, 0, 3, 12]
print(f"  start: {data}")
kept = move_zeroes(data)
print(f"  final: {data}   kept {kept} non-zero values in a[0:{kept}]")`,
          output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  False     0   [0, 1, 0, 3, 12]
     1     1   True     1   [1, 0, 0, 3, 12]
     2     0  False     1   [1, 0, 0, 3, 12]
     3     3   True     2   [1, 3, 0, 0, 12]
     4    12   True     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
          explanation:
            "Watch `write` fall behind `read` at row 0 and stay behind. That gap — one, then one, then two — is the count of zeroes seen. This version *swaps* rather than assigns, which is what makes the zeroes accumulate neatly at the end rather than being left as stale copies; if the problem only asks for the first `k` elements and does not care what follows, a plain `a[write] = a[read]` is fine and one operation cheaper. Note that the swap is harmless when `write == read`, which is the case for the whole prefix before the first zero.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (s, w) => String(s).padStart(w);

// Invariant: a[0:write] holds every kept element so far, in order.
function moveZeroes(a) {
  let write = 0;
  console.log(\`  \${padL("read", 4)} \${padL("value", 5)} \${padL("keep?", 6)} \${padL("write", 5)}   array\`);
  console.log("  " + "-".repeat(46));
  for (let read = 0; read < a.length; read++) {
    const value = a[read];
    const keep = value !== 0;
    if (keep) {
      [a[write], a[read]] = [a[read], a[write]];
      write++;
    }
    console.log(\`  \${padL(read, 4)} \${padL(value, 5)} \${padL(keep, 6)} \${padL(write, 5)}   \${list(a)}\`);
  }
  return write;
}

console.log("move every zero to the end, keeping the order of the rest");
const data = [0, 1, 0, 3, 12];
console.log(\`  start: \${list(data)}\`);
const kept = moveZeroes(data);
console.log(\`  final: \${list(data)}   kept \${kept} non-zero values in a[0:\${kept}]\`);`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (s: string | number | boolean, w: number): string => String(s).padStart(w);

// Invariant: a[0:write] holds every kept element so far, in order.
function moveZeroes(a: number[]): number {
  let write = 0;
  console.log(\`  \${padL("read", 4)} \${padL("value", 5)} \${padL("keep?", 6)} \${padL("write", 5)}   array\`);
  console.log("  " + "-".repeat(46));
  for (let read = 0; read < a.length; read++) {
    const value = a[read];
    const keep = value !== 0;
    if (keep) {
      [a[write], a[read]] = [a[read], a[write]];
      write++;
    }
    console.log(\`  \${padL(read, 4)} \${padL(value, 5)} \${padL(keep, 6)} \${padL(write, 5)}   \${list(a)}\`);
  }
  return write;
}

console.log("move every zero to the end, keeping the order of the rest");
const data: number[] = [0, 1, 0, 3, 12];
console.log(\`  start: \${list(data)}\`);
const kept = moveZeroes(data);
console.log(\`  final: \${list(data)}   kept \${kept} non-zero values in a[0:\${kept}]\`);`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
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

    /** Invariant: a[0:write] holds every kept element so far, in order. */
    static int moveZeroes(int[] a) {
        int write = 0;
        System.out.printf("  %4s %5s %6s %5s   array%n", "read", "value", "keep?", "write");
        System.out.println("  " + "-".repeat(46));
        for (int read = 0; read < a.length; read++) {
            int value = a[read];
            boolean keep = value != 0;
            if (keep) {
                int t = a[write];
                a[write] = a[read];
                a[read] = t;
                write++;
            }
            System.out.printf("  %4d %5d %6b %5d   %s%n", read, value, keep, write, list(a));
        }
        return write;
    }

    public static void main(String[] args) {
        System.out.println("move every zero to the end, keeping the order of the rest");
        int[] data = {0, 1, 0, 3, 12};
        System.out.println("  start: " + list(data));
        int kept = moveZeroes(data);
        System.out.println("  final: " + list(data) + "   kept " + kept
                + " non-zero values in a[0:" + kept + "]");
    }
}`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
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

// Invariant: a[0:write] holds every kept element so far, in order.
size_t moveZeroes(vector<int>& a) {
    size_t write = 0;
    cout << "  " << right << setw(4) << "read" << " " << setw(5) << "value"
         << " " << setw(6) << "keep?" << " " << setw(5) << "write" << "   array\\n";
    cout << "  " << string(46, '-') << "\\n";
    for (size_t read = 0; read < a.size(); read++) {
        int value = a[read];
        bool keep = value != 0;
        if (keep) {
            swap(a[write], a[read]);
            write++;
        }
        cout << "  " << setw(4) << read << " " << setw(5) << value << " "
             << setw(6) << boolalpha << keep << " " << setw(5) << write
             << "   " << list(a) << "\\n";
    }
    return write;
}

int main() {
    cout << "move every zero to the end, keeping the order of the rest\\n";
    vector<int> data = {0, 1, 0, 3, 12};
    cout << "  start: " << list(data) << "\\n";
    size_t kept = moveZeroes(data);
    cout << "  final: " << list(data) << "   kept " << kept
         << " non-zero values in a[0:" << kept << "]\\n";
}`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// Invariant: a[0..write] holds every kept element so far, in order.
fn move_zeroes(a: &mut Vec<i32>) -> usize {
    let mut write = 0;
    println!("  {:>4} {:>5} {:>6} {:>5}   array", "read", "value", "keep?", "write");
    println!("  {}", "-".repeat(46));
    for read in 0..a.len() {
        let value = a[read];
        let keep = value != 0;
        if keep {
            a.swap(write, read);
            write += 1;
        }
        println!("  {:>4} {:>5} {:>6} {:>5}   {}", read, value, keep, write, list(a));
    }
    write
}

fn main() {
    println!("move every zero to the end, keeping the order of the rest");
    let mut data = vec![0, 1, 0, 3, 12];
    println!("  start: {}", list(&data));
    let kept = move_zeroes(&mut data);
    println!("  final: {}   kept {} non-zero values in a[0:{}]", list(&data), kept, kept);
}`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
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

// Invariant: a[0:write] holds every kept element so far, in order.
func moveZeroes(a []int) int {
	write := 0
	fmt.Printf("  %4s %5s %6s %5s   array\\n", "read", "value", "keep?", "write")
	fmt.Println("  " + strings.Repeat("-", 46))
	for read := range a {
		value := a[read]
		keep := value != 0
		if keep {
			a[write], a[read] = a[read], a[write]
			write++
		}
		fmt.Printf("  %4d %5d %6t %5d   %s\\n", read, value, keep, write, list(a))
	}
	return write
}

func main() {
	fmt.Println("move every zero to the end, keeping the order of the rest")
	data := []int{0, 1, 0, 3, 12}
	fmt.Println("  start:", list(data))
	kept := moveZeroes(data)
	fmt.Printf("  final: %s   kept %d non-zero values in a[0:%d]\\n", list(data), kept, kept)
}`,
              output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  false     0   [0, 1, 0, 3, 12]
     1     1   true     1   [1, 0, 0, 3, 12]
     2     0  false     1   [1, 0, 0, 3, 12]
     3     3   true     2   [1, 3, 0, 0, 12]
     4    12   true     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Advancing `write` unconditionally",
          body: "If `write += 1` sits outside the `if`, the two pointers never separate and the loop copies each element onto itself — a no-op that leaves the array untouched and returns the original length. It is a one-character mistake and the symptom is that the function appears to do nothing at all, which sends people looking at the predicate instead of the increment.",
        },
      ],
    },
    {
      id: "one-skeleton",
      heading: "One skeleton, four problems",
      body: [
        "What makes this a pattern rather than a solution is that the loop never changes. Only the predicate does — the single line that decides whether the current element is kept.",
        "That is worth internalising, because these are four separately-numbered problems on every sheet in existence, and they are one problem.",
      ],
      examples: [
        {
          id: "skeleton",
          title: "The loop is fixed; the predicate is the problem",
          lang: "python",
          code: `def compact(a, keep):
    """The whole pattern. Only \`keep(a, write, read)\` changes between problems."""
    write = 0
    for read in range(len(a)):
        if keep(a, write, read):
            a[write] = a[read]
            write += 1
    return write


cases = [
    ("remove every 3",
     [3, 2, 2, 3, 1, 3],
     lambda a, w, r: a[r] != 3),
    ("dedupe a sorted array",
     [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
     lambda a, w, r: w == 0 or a[r] != a[w - 1]),
    ("keep at most two of each",
     [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
     lambda a, w, r: w < 2 or a[r] != a[w - 2]),
    ("drop the negatives",
     [-1, 5, -3, 0, 7, -8],
     lambda a, w, r: a[r] >= 0),
]

for name, data, keep in cases:
    before = str(data)
    k = compact(data, keep)
    print(f"{name}")
    print(f"    in  {before}")
    print(f"    out k={k}  a[0:k]={data[:k]}")`,
          output: `remove every 3
    in  [3, 2, 2, 3, 1, 3]
    out k=3  a[0:k]=[2, 2, 1]
dedupe a sorted array
    in  [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
    out k=5  a[0:k]=[0, 1, 2, 3, 4]
keep at most two of each
    in  [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
    out k=9  a[0:k]=[0, 0, 1, 1, 2, 2, 3, 3, 4]
drop the negatives
    in  [-1, 5, -3, 0, 7, -8]
    out k=3  a[0:k]=[5, 0, 7]`,
          explanation:
            "The two middle predicates are the interesting ones, and they are worth reading slowly. **Both compare against the output, not the input** — `a[w - 1]` is the last element already kept, and `a[w - 2]` is the one before it. That is why the at-most-two version generalises to at-most-k by changing a single digit: keeping k copies means checking whether the k-th most recent survivor already has this value. Comparing against `a[r - 1]` instead would be comparing against the input, which fails as soon as a run is longer than the limit.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

// The whole pattern. Only \`keep(a, write, read)\` changes between problems.
function compact(a, keep) {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (keep(a, write, read)) {
      a[write] = a[read];
      write++;
    }
  }
  return write;
}

const cases = [
  ["remove every 3", [3, 2, 2, 3, 1, 3], (a, w, r) => a[r] !== 3],
  ["dedupe a sorted array", [0, 0, 1, 1, 1, 2, 2, 3, 3, 4], (a, w, r) => w === 0 || a[r] !== a[w - 1]],
  ["keep at most two of each", [0, 0, 1, 1, 1, 2, 2, 3, 3, 4], (a, w, r) => w < 2 || a[r] !== a[w - 2]],
  ["drop the negatives", [-1, 5, -3, 0, 7, -8], (a, w, r) => a[r] >= 0],
];

for (const [name, data, keep] of cases) {
  const before = list(data);
  const k = compact(data, keep);
  console.log(name);
  console.log(\`    in  \${before}\`);
  console.log(\`    out k=\${k}  a[0:k]=\${list(data.slice(0, k))}\`);
}`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

// The whole pattern. Only \`keep(a, write, read)\` changes between problems.
type Keep = (a: number[], w: number, r: number) => boolean;

function compact(a: number[], keep: Keep): number {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (keep(a, write, read)) {
      a[write] = a[read];
      write++;
    }
  }
  return write;
}

const cases: [string, number[], Keep][] = [
  ["remove every 3", [3, 2, 2, 3, 1, 3], (a, w, r) => a[r] !== 3],
  ["dedupe a sorted array", [0, 0, 1, 1, 1, 2, 2, 3, 3, 4], (a, w, r) => w === 0 || a[r] !== a[w - 1]],
  ["keep at most two of each", [0, 0, 1, 1, 1, 2, 2, 3, 3, 4], (a, w, r) => w < 2 || a[r] !== a[w - 2]],
  ["drop the negatives", [-1, 5, -3, 0, 7, -8], (a, w, r) => a[r] >= 0],
];

for (const [name, data, keep] of cases) {
  const before = list(data);
  const k = compact(data, keep);
  console.log(name);
  console.log(\`    in  \${before}\`);
  console.log(\`    out k=\${k}  a[0:k]=\${list(data.slice(0, k))}\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    interface Keep {
        boolean test(int[] a, int write, int read);
    }

    /** The whole pattern. Only \`keep(a, write, read)\` changes between problems. */
    static int compact(int[] a, Keep keep) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (keep.test(a, write, read)) {
                a[write] = a[read];
                write++;
            }
        }
        return write;
    }

    static String list(int[] xs, int to) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < to; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        String[] names = {"remove every 3", "dedupe a sorted array",
                          "keep at most two of each", "drop the negatives"};
        int[][] data = {{3, 2, 2, 3, 1, 3}, {0, 0, 1, 1, 1, 2, 2, 3, 3, 4},
                        {0, 0, 1, 1, 1, 2, 2, 3, 3, 4}, {-1, 5, -3, 0, 7, -8}};
        Keep[] keeps = {
            (a, w, r) -> a[r] != 3,
            (a, w, r) -> w == 0 || a[r] != a[w - 1],
            (a, w, r) -> w < 2 || a[r] != a[w - 2],
            (a, w, r) -> a[r] >= 0,
        };

        for (int i = 0; i < names.length; i++) {
            String before = list(data[i], data[i].length);
            int k = compact(data[i], keeps[i]);
            System.out.println(names[i]);
            System.out.println("    in  " + before);
            System.out.println("    out k=" + k + "  a[0:k]=" + list(data[i], k));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

using Keep = function<bool(const vector<int>&, size_t, size_t)>;

string list(const vector<int>& xs, size_t to) {
    string out = "[";
    for (size_t i = 0; i < to; i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

// The whole pattern. Only \`keep(a, write, read)\` changes between problems.
size_t compact(vector<int>& a, const Keep& keep) {
    size_t write = 0;
    for (size_t read = 0; read < a.size(); read++) {
        if (keep(a, write, read)) {
            a[write] = a[read];
            write++;
        }
    }
    return write;
}

int main() {
    vector<string> names = {"remove every 3", "dedupe a sorted array",
                            "keep at most two of each", "drop the negatives"};
    vector<vector<int>> data = {{3, 2, 2, 3, 1, 3}, {0, 0, 1, 1, 1, 2, 2, 3, 3, 4},
                                {0, 0, 1, 1, 1, 2, 2, 3, 3, 4}, {-1, 5, -3, 0, 7, -8}};
    vector<Keep> keeps = {
        [](const vector<int>& a, size_t, size_t r) { return a[r] != 3; },
        [](const vector<int>& a, size_t w, size_t r) { return w == 0 || a[r] != a[w - 1]; },
        [](const vector<int>& a, size_t w, size_t r) { return w < 2 || a[r] != a[w - 2]; },
        [](const vector<int>& a, size_t, size_t r) { return a[r] >= 0; },
    };

    for (size_t i = 0; i < names.size(); i++) {
        string before = list(data[i], data[i].size());
        size_t k = compact(data[i], keeps[i]);
        cout << names[i] << "\\n";
        cout << "    in  " << before << "\\n";
        cout << "    out k=" << k << "  a[0:k]=" << list(data[i], k) << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// The whole pattern. Only \`keep(a, write, read)\` changes between problems.
fn compact(a: &mut [i32], keep: fn(&[i32], usize, usize) -> bool) -> usize {
    let mut write = 0;
    for read in 0..a.len() {
        if keep(a, write, read) {
            a[write] = a[read];
            write += 1;
        }
    }
    write
}

fn main() {
    let cases: Vec<(&str, Vec<i32>, fn(&[i32], usize, usize) -> bool)> = vec![
        ("remove every 3", vec![3, 2, 2, 3, 1, 3], |a, _w, r| a[r] != 3),
        (
            "dedupe a sorted array",
            vec![0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
            |a, w, r| w == 0 || a[r] != a[w - 1],
        ),
        (
            "keep at most two of each",
            vec![0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
            |a, w, r| w < 2 || a[r] != a[w - 2],
        ),
        ("drop the negatives", vec![-1, 5, -3, 0, 7, -8], |a, _w, r| a[r] >= 0),
    ];

    for (name, data, keep) in cases {
        let mut data = data;
        let before = list(&data);
        let k = compact(&mut data, keep);
        println!("{}", name);
        println!("    in  {}", before);
        println!("    out k={}  a[0:k]={}", k, list(&data[..k]));
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

// The whole pattern. Only keep(a, write, read) changes between problems.
func compact(a []int, keep func([]int, int, int) bool) int {
	write := 0
	for read := range a {
		if keep(a, write, read) {
			a[write] = a[read]
			write++
		}
	}
	return write
}

func main() {
	type testCase struct {
		name string
		data []int
		keep func([]int, int, int) bool
	}
	cases := []testCase{
		{"remove every 3", []int{3, 2, 2, 3, 1, 3},
			func(a []int, w, r int) bool { return a[r] != 3 }},
		{"dedupe a sorted array", []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4},
			func(a []int, w, r int) bool { return w == 0 || a[r] != a[w-1] }},
		{"keep at most two of each", []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4},
			func(a []int, w, r int) bool { return w < 2 || a[r] != a[w-2] }},
		{"drop the negatives", []int{-1, 5, -3, 0, 7, -8},
			func(a []int, w, r int) bool { return a[r] >= 0 }},
	}

	for _, c := range cases {
		before := list(c.data)
		k := compact(c.data, c.keep)
		fmt.Println(c.name)
		fmt.Println("    in ", before)
		fmt.Printf("    out k=%d  a[0:k]=%s\\n", k, list(c.data[:k]))
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "order",
      heading: "When the order does not matter",
      body: [
        "There is a second version of this, and the choice between them is a genuine trade rather than one being better.",
        "If the survivors do not have to keep their relative order, you can fill a hole by pulling in the last element rather than shifting: **swap with the end, shrink the end, and do not advance the read pointer** (because the element you just pulled in has not been examined yet).",
        "The stable version does one write per *kept* element. The swap version does one write per *removed* element. Which is cheaper depends entirely on which is rarer, and when removals are rare the difference is not subtle.",
      ],
      examples: [
        {
          id: "stable-vs-swap",
          title: "Stable compaction against swap-with-the-end",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int writes;

    /** Stable: survivors keep their relative order. */
    static int compactStable(int[] a, int drop) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] != drop) {
                a[write++] = a[read];
                writes++;
            }
        }
        return write;
    }

    /** Unstable: pull a survivor in from the end instead of shifting. */
    static int compactSwapEnd(int[] a, int drop) {
        int i = 0, n = a.length;
        while (i < n) {
            if (a[i] == drop) {
                a[i] = a[n - 1];
                writes++;
                n--;
            } else {
                i++;
            }
        }
        return n;
    }

    public static void main(String[] args) {
        int[] base = {3, 2, 2, 3, 1, 3, 5, 4};

        int[] a = base.clone();
        writes = 0;
        int k1 = compactStable(a, 3);
        System.out.printf("stable    k=%d  %s  writes=%d%n",
                k1, Arrays.toString(Arrays.copyOf(a, k1)), writes);

        int[] b = base.clone();
        writes = 0;
        int k2 = compactSwapEnd(b, 3);
        System.out.printf("swap-end  k=%d  %s  writes=%d%n",
                k2, Arrays.toString(Arrays.copyOf(b, k2)), writes);

        // now a case where almost nothing is removed
        int[] big = new int[100000];
        Arrays.fill(big, 1);
        big[0] = 3;

        int[] c = big.clone();
        writes = 0;
        compactStable(c, 3);
        int stableWrites = writes;

        int[] d = big.clone();
        writes = 0;
        compactSwapEnd(d, 3);
        int swapWrites = writes;

        System.out.println();
        System.out.println("100,000 elements, exactly one of them removed:");
        System.out.printf("  stable   writes = %,d%n", stableWrites);
        System.out.printf("  swap-end writes = %,d%n", swapWrites);
    }
}`,
          output: `stable    k=5  [2, 2, 1, 5, 4]  writes=5
swap-end  k=5  [4, 2, 2, 5, 1]  writes=3

100,000 elements, exactly one of them removed:
  stable   writes = 99,999
  swap-end writes = 1`,
          explanation:
            "**Same k, different arrays** — both answers are correct for a problem that says order does not matter, and only one is correct for a problem that says it does. The second measurement is the reason to know the trick: 99,999 writes against 1, for the same result. Both loops are still O(n), because both still *read* every element; what changed is the number of writes, which is a constant factor and occasionally a large one. In the stable version the `a[write++] = a[read]` when `write == read` is a genuine write of an element onto itself, and guarding it with `if (write != read)` is a legitimate small saving.",
          alternates: [
            {
              lang: "python",
              code: `writes = 0


def compact_stable(a, drop):
    """Stable: survivors keep their relative order."""
    global writes
    write = 0
    for read in range(len(a)):
        if a[read] != drop:
            a[write] = a[read]
            write += 1
            writes += 1
    return write


def compact_swap_end(a, drop):
    """Unstable: pull a survivor in from the end instead of shifting."""
    global writes
    i, n = 0, len(a)
    while i < n:
        if a[i] == drop:
            a[i] = a[n - 1]
            writes += 1
            n -= 1
        else:
            i += 1
    return n


base = [3, 2, 2, 3, 1, 3, 5, 4]

a = base[:]
writes = 0
k1 = compact_stable(a, 3)
print(f"stable    k={k1}  {a[:k1]}  writes={writes}")

b = base[:]
writes = 0
k2 = compact_swap_end(b, 3)
print(f"swap-end  k={k2}  {b[:k2]}  writes={writes}")

# now a case where almost nothing is removed
big = [1] * 100_000
big[0] = 3

c = big[:]
writes = 0
compact_stable(c, 3)
stable_writes = writes

d = big[:]
writes = 0
compact_swap_end(d, 3)
swap_writes = writes

print()
print("100,000 elements, exactly one of them removed:")
print(f"  stable   writes = {stable_writes:,}")
print(f"  swap-end writes = {swap_writes:,}")`,
            },
            {
              lang: "javascript",
              code: `let writes = 0;

/** Stable: survivors keep their relative order. */
function compactStable(a, drop) {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] !== drop) {
      a[write++] = a[read];
      writes++;
    }
  }
  return write;
}

/** Unstable: pull a survivor in from the end instead of shifting. */
function compactSwapEnd(a, drop) {
  let i = 0;
  let n = a.length;
  while (i < n) {
    if (a[i] === drop) {
      a[i] = a[n - 1];
      writes++;
      n--;
    } else {
      i++;
    }
  }
  return n;
}

const show = (a) => \`[\${a.join(", ")}]\`;
const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const base = [3, 2, 2, 3, 1, 3, 5, 4];

const a = base.slice();
writes = 0;
const k1 = compactStable(a, 3);
console.log(\`stable    k=\${k1}  \${show(a.slice(0, k1))}  writes=\${writes}\`);

const b = base.slice();
writes = 0;
const k2 = compactSwapEnd(b, 3);
console.log(\`swap-end  k=\${k2}  \${show(b.slice(0, k2))}  writes=\${writes}\`);

// now a case where almost nothing is removed
const big = new Array(100000).fill(1);
big[0] = 3;

const c = big.slice();
writes = 0;
compactStable(c, 3);
const stableWrites = writes;

const d = big.slice();
writes = 0;
compactSwapEnd(d, 3);
const swapWrites = writes;

console.log();
console.log("100,000 elements, exactly one of them removed:");
console.log(\`  stable   writes = \${group(stableWrites)}\`);
console.log(\`  swap-end writes = \${group(swapWrites)}\`);`,
            },
            {
              lang: "typescript",
              code: `let writes = 0;

/** Stable: survivors keep their relative order. */
function compactStable(a: number[], drop: number): number {
  let write = 0;
  for (let read = 0; read < a.length; read++) {
    if (a[read] !== drop) {
      a[write++] = a[read];
      writes++;
    }
  }
  return write;
}

/** Unstable: pull a survivor in from the end instead of shifting. */
function compactSwapEnd(a: number[], drop: number): number {
  let i = 0;
  let n = a.length;
  while (i < n) {
    if (a[i] === drop) {
      a[i] = a[n - 1];
      writes++;
      n--;
    } else {
      i++;
    }
  }
  return n;
}

const show = (a: number[]): string => \`[\${a.join(", ")}]\`;
const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const base = [3, 2, 2, 3, 1, 3, 5, 4];

const a = base.slice();
writes = 0;
const k1 = compactStable(a, 3);
console.log(\`stable    k=\${k1}  \${show(a.slice(0, k1))}  writes=\${writes}\`);

const b = base.slice();
writes = 0;
const k2 = compactSwapEnd(b, 3);
console.log(\`swap-end  k=\${k2}  \${show(b.slice(0, k2))}  writes=\${writes}\`);

// now a case where almost nothing is removed
const big = new Array(100000).fill(1);
big[0] = 3;

const c = big.slice();
writes = 0;
compactStable(c, 3);
const stableWrites = writes;

const d = big.slice();
writes = 0;
compactSwapEnd(d, 3);
const swapWrites = writes;

console.log();
console.log("100,000 elements, exactly one of them removed:");
console.log(\`  stable   writes = \${group(stableWrites)}\`);
console.log(\`  swap-end writes = \${group(swapWrites)}\`);`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <string>
#include <vector>

static long long writes = 0;

// Stable: survivors keep their relative order.
static size_t compact_stable(std::vector<int>& a, int drop) {
    size_t write = 0;
    for (size_t read = 0; read < a.size(); ++read) {
        if (a[read] != drop) {
            a[write++] = a[read];
            writes++;
        }
    }
    return write;
}

// Unstable: pull a survivor in from the end instead of shifting.
static size_t compact_swap_end(std::vector<int>& a, int drop) {
    size_t i = 0, n = a.size();
    while (i < n) {
        if (a[i] == drop) {
            a[i] = a[n - 1];
            writes++;
            n--;
        } else {
            i++;
        }
    }
    return n;
}

static std::string show(const std::vector<int>& a, size_t k) {
    std::string out = "[";
    for (size_t i = 0; i < k; ++i) {
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
    const std::vector<int> base = {3, 2, 2, 3, 1, 3, 5, 4};

    std::vector<int> a = base;
    writes = 0;
    size_t k1 = compact_stable(a, 3);
    std::cout << "stable    k=" << k1 << "  " << show(a, k1) << "  writes=" << writes << '\\n';

    std::vector<int> b = base;
    writes = 0;
    size_t k2 = compact_swap_end(b, 3);
    std::cout << "swap-end  k=" << k2 << "  " << show(b, k2) << "  writes=" << writes << '\\n';

    // now a case where almost nothing is removed
    std::vector<int> big(100000, 1);
    big[0] = 3;

    std::vector<int> c = big;
    writes = 0;
    compact_stable(c, 3);
    long long stable_writes = writes;

    std::vector<int> d = big;
    writes = 0;
    compact_swap_end(d, 3);
    long long swap_writes = writes;

    std::cout << '\\n';
    std::cout << "100,000 elements, exactly one of them removed:\\n";
    std::cout << "  stable   writes = " << group(stable_writes) << '\\n';
    std::cout << "  swap-end writes = " << group(swap_writes) << '\\n';
}`,
            },
            {
              lang: "rust",
              code: `/// Stable: survivors keep their relative order.
///
/// The counter travels as an argument rather than living in a global, which is
/// what the other languages use: a mutable static is \`unsafe\` to touch in Rust,
/// and this is the same information passed explicitly.
fn compact_stable(a: &mut [i32], drop: i32, writes: &mut i64) -> usize {
    let mut write = 0;
    for read in 0..a.len() {
        if a[read] != drop {
            a[write] = a[read];
            write += 1;
            *writes += 1;
        }
    }
    write
}

/// Unstable: pull a survivor in from the end instead of shifting.
fn compact_swap_end(a: &mut [i32], drop: i32, writes: &mut i64) -> usize {
    let (mut i, mut n) = (0usize, a.len());
    while i < n {
        if a[i] == drop {
            a[i] = a[n - 1];
            *writes += 1;
            n -= 1;
        } else {
            i += 1;
        }
    }
    n
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
    let base = [3, 2, 2, 3, 1, 3, 5, 4];

    let mut a = base;
    let mut writes = 0i64;
    let k1 = compact_stable(&mut a, 3, &mut writes);
    println!("stable    k={}  {}  writes={}", k1, show(&a[..k1]), writes);

    let mut b = base;
    writes = 0;
    let k2 = compact_swap_end(&mut b, 3, &mut writes);
    println!("swap-end  k={}  {}  writes={}", k2, show(&b[..k2]), writes);

    // now a case where almost nothing is removed
    let mut big = vec![1i32; 100_000];
    big[0] = 3;

    let mut c = big.clone();
    writes = 0;
    compact_stable(&mut c, 3, &mut writes);
    let stable_writes = writes;

    let mut d = big.clone();
    writes = 0;
    compact_swap_end(&mut d, 3, &mut writes);
    let swap_writes = writes;

    println!();
    println!("100,000 elements, exactly one of them removed:");
    println!("  stable   writes = {}", group(stable_writes));
    println!("  swap-end writes = {}", group(swap_writes));
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

var writes int64

// compactStable is stable: survivors keep their relative order.
func compactStable(a []int, drop int) int {
	write := 0
	for read := 0; read < len(a); read++ {
		if a[read] != drop {
			a[write] = a[read]
			write++
			writes++
		}
	}
	return write
}

// compactSwapEnd is unstable: it pulls a survivor in from the end instead of shifting.
func compactSwapEnd(a []int, drop int) int {
	i, n := 0, len(a)
	for i < n {
		if a[i] == drop {
			a[i] = a[n-1]
			writes++
			n--
		} else {
			i++
		}
	}
	return n
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

func main() {
	base := []int{3, 2, 2, 3, 1, 3, 5, 4}

	a := append([]int(nil), base...)
	writes = 0
	k1 := compactStable(a, 3)
	fmt.Printf("stable    k=%d  %s  writes=%d\\n", k1, show(a[:k1]), writes)

	b := append([]int(nil), base...)
	writes = 0
	k2 := compactSwapEnd(b, 3)
	fmt.Printf("swap-end  k=%d  %s  writes=%d\\n", k2, show(b[:k2]), writes)

	// now a case where almost nothing is removed
	big := make([]int, 100000)
	for i := range big {
		big[i] = 1
	}
	big[0] = 3

	c := append([]int(nil), big...)
	writes = 0
	compactStable(c, 3)
	stableWrites := writes

	d := append([]int(nil), big...)
	writes = 0
	compactSwapEnd(d, 3)
	swapWrites := writes

	fmt.Println()
	fmt.Println("100,000 elements, exactly one of them removed:")
	fmt.Printf("  stable   writes = %s\\n", group(stableWrites))
	fmt.Printf("  swap-end writes = %s\\n", group(swapWrites))
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Advancing the index after a swap-with-the-end",
          body: "The element pulled in from the end has not been tested yet, so the loop must re-examine the same position. Writing this as a `for` loop with an unconditional `i++` skips it, and the bug only shows when two removable elements end up adjacent after a swap — which is exactly the case a small hand-written test misses. Use a `while` with the increment inside the `else`, as above.",
        },
      ],
    },
    {
      id: "why-a-length",
      heading: "Why the problem asks for a length",
      body: [
        "These problems return an integer `k` and promise nothing about the array beyond index `k`. That looks like a quirk of the judge and it is not.",
        "**An array cannot be resized.** Its length is fixed at allocation, in Java literally and in Python effectively for this purpose, so \"remove in place\" cannot mean \"produce a shorter array\" — there is no such operation. It has to mean \"arrange the survivors at the front and tell me how many there are\", which is precisely what `(array, length)` is: the same pair a dynamic array keeps internally.",
        "So the signature is teaching you the representation. When you get to implementing your own growable structures, `(buffer, size)` with unused capacity beyond `size` is the whole idea, and this is the first place you meet it.",
        "**In an interview**, say what you are leaving behind: \"the first k elements are the answer, and I make no promises about the rest.\" It is the difference between looking like you finished and looking like you knew what you were doing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you remove elements from an array in place in one pass?",
      answer:
        "Two indices. A read pointer visits every element once; a write pointer marks where the next surviving element goes. Advance read every iteration, advance write only when you keep something, and copy `a[read]` to `a[write]` when you do. The invariant is that `a[0:write]` holds every kept element so far in order — true at the start with both at zero, preserved by each iteration, and therefore true at the end. It is O(n) time and O(1) space, against O(n²) for the shift-everything-left approach.",
    },
    {
      question: "Dedupe a sorted array in place. What does the comparison compare against?",
      answer:
        "Against the output, not the input: keep `a[read]` when `write == 0` or `a[read] != a[write - 1]`, where `a[write - 1]` is the last element already kept. That generalises immediately — allowing at most k copies of each value means comparing against `a[write - k]`, so at-most-two is a single changed digit. Comparing against `a[read - 1]` instead looks equivalent and breaks as soon as a run is longer than the limit, because the input still contains the duplicates the output has already dropped.",
    },
    {
      question: "When would you swap with the last element instead of compacting?",
      answer:
        "When the order of the survivors does not matter. Instead of shifting, overwrite the removable element with the last one and shrink the logical length — and do not advance the index, because the element you pulled in has not been examined. It costs one write per *removed* element rather than one per *kept* element, which for 100,000 elements with a single removal measures as 1 write against 99,999. Both are O(n) since both read everything; the difference is constant factor. The catch is that it destroys the original ordering, so it is wrong for anything that says \"preserve relative order\".",
    },
  ],
  takeaways: [
    "read visits everything; write marks where the next survivor goes",
    "The gap between them is exactly how many elements have been discarded",
    "Invariant: a[0:write] holds every kept element so far, in order",
    "The loop never changes between problems — only the keep predicate does",
    "Dedupe compares against a[write-1]; at-most-k compares against a[write-k]",
    "Compare against the output, never the input",
    "Swap-with-the-end costs one write per removal, but destroys the order",
    "Returning a length is not a quirk — an array cannot be resized",
  ],
  status: "available",
};
