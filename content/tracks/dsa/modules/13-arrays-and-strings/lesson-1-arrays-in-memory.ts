import type { Lesson } from "@/content/types";

export const arraysInMemoryLesson: Lesson = {
  id: "dsa-arr-memory",
  slug: "arrays-in-memory",
  moduleSlug: "arrays-and-strings",
  title: "Arrays in Memory & Why Locality Matters",
  summary:
    "Why indexing is genuinely constant-time, and why two loops with identical complexity can differ by a factor of seventeen.",
  estimatedMinutes: 25,
  objectives: [
    "Explain constant-time indexing from the address arithmetic that implements it",
    "Predict which of two traversals of the same data will be faster",
    "Recognise the cost of an array of references against an array of values",
    "Separate a complexity claim from a constant-factor claim, and state both honestly",
  ],
  sections: [
    {
      id: "why-again",
      heading: "You have met arrays already — this is the other half",
      body: [
        "Module 0 taught you to *use* an array: declare it, walk it, index it, reverse it in place. This module treats it as the thing algorithms are built on, and that starts with one question Module 0 deferred.",
        "**Why is `a[999999]` exactly as fast as `a[0]`?** Not \"because arrays are fast\" — because of a specific mechanism, and the mechanism explains several things that otherwise look arbitrary.",
        "An array is one contiguous block of memory holding elements of identical width. The array variable knows the address of the first element and the width of one element. That is all the information needed, because the address of element `i` is not searched for, it is *computed*: `base + i × width`.",
        "One multiply and one add, regardless of `i`. That is the whole of O(1) indexing — there is no lookup table, no traversal, no search. It also explains the two restrictions that come with it: every element must be the same width (or the multiply is wrong), and the block must be contiguous (or the addition lands somewhere else entirely).",
      ],
      examples: [
        {
          id: "address-arithmetic",
          title: "The arithmetic that makes indexing constant-time",
          lang: "python",
          code: `BASE = 0x7f0000  # a pretend starting address, so the arithmetic is visible


def address(base, index, width):
    return base + index * width


print(f"{'type':<10} {'bytes':>6}  {'a[0]':>10} {'a[1]':>10} {'a[2]':>10} {'a[7]':>10}")
print("-" * 62)
for name, width in [("byte", 1), ("int", 4), ("long", 8), ("double", 8)]:
    cells = "".join(f"{hex(address(BASE, i, width)):>11}" for i in (0, 1, 2, 7))
    print(f"{name:<10} {width:>6} {cells}")

print()
print("indexing is one multiply and one add — the same work for a[0] as for a[999999]")`,
          output: `type        bytes        a[0]       a[1]       a[2]       a[7]
--------------------------------------------------------------
byte            1    0x7f0000   0x7f0001   0x7f0002   0x7f0007
int             4    0x7f0000   0x7f0004   0x7f0008   0x7f001c
long            8    0x7f0000   0x7f0008   0x7f0010   0x7f0038
double          8    0x7f0000   0x7f0008   0x7f0010   0x7f0038

indexing is one multiply and one add — the same work for a[0] as for a[999999]`,
          explanation:
            "Read the `int` row: element 7 sits at `0x7f001c`, which is `0x7f0000 + 7 × 4`. Nothing was walked to find it. This is also the honest answer to \"why does indexing start at zero\" — the index is an *offset* from the base, and the first element is zero elements along.",
          alternates: [
            {
              lang: "javascript",
              code: `const BASE = 0x7f0000; // a pretend starting address, so the arithmetic is visible

const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);
const hex = (n) => "0x" + n.toString(16);

function address(base, index, width) {
  return base + index * width;
}

console.log(
  \`\${padR("type", 10)} \${padL("bytes", 6)}  \${padL("a[0]", 10)} \${padL("a[1]", 10)} \${padL("a[2]", 10)} \${padL("a[7]", 10)}\`
);
console.log("-".repeat(62));
for (const [name, width] of [["byte", 1], ["int", 4], ["long", 8], ["double", 8]]) {
  const cells = [0, 1, 2, 7].map((i) => padL(hex(address(BASE, i, width)), 11)).join("");
  console.log(\`\${padR(name, 10)} \${padL(width, 6)} \${cells}\`);
}

console.log();
console.log("indexing is one multiply and one add — the same work for a[0] as for a[999999]");`,
            },
            {
              lang: "typescript",
              code: `const BASE = 0x7f0000; // a pretend starting address, so the arithmetic is visible

const padL = (s: string | number, w: number): string => String(s).padStart(w);
const padR = (s: string | number, w: number): string => String(s).padEnd(w);
const hex = (n: number): string => "0x" + n.toString(16);

function address(base: number, index: number, width: number): number {
  return base + index * width;
}

console.log(
  \`\${padR("type", 10)} \${padL("bytes", 6)}  \${padL("a[0]", 10)} \${padL("a[1]", 10)} \${padL("a[2]", 10)} \${padL("a[7]", 10)}\`
);
console.log("-".repeat(62));
const widths: [string, number][] = [["byte", 1], ["int", 4], ["long", 8], ["double", 8]];
for (const [name, width] of widths) {
  const cells = [0, 1, 2, 7].map((i) => padL(hex(address(BASE, i, width)), 11)).join("");
  console.log(\`\${padR(name, 10)} \${padL(width, 6)} \${cells}\`);
}

console.log();
console.log("indexing is one multiply and one add — the same work for a[0] as for a[999999]");`,
            },
            {
              lang: "java",
              code: `public class Main {
    static final long BASE = 0x7f0000L;  // a pretend starting address

    static long address(long base, int index, int width) {
        return base + (long) index * width;
    }

    public static void main(String[] args) {
        System.out.printf("%-10s %6s  %10s %10s %10s %10s%n",
                "type", "bytes", "a[0]", "a[1]", "a[2]", "a[7]");
        System.out.println("-".repeat(62));
        String[] names = {"byte", "int", "long", "double"};
        int[] widths = {1, 4, 8, 8};
        for (int k = 0; k < names.length; k++) {
            StringBuilder cells = new StringBuilder();
            for (int i : new int[]{0, 1, 2, 7}) {
                cells.append(String.format("%11s", "0x" + Long.toHexString(address(BASE, i, widths[k]))));
            }
            System.out.printf("%-10s %6d %s%n", names[k], widths[k], cells);
        }

        System.out.println();
        System.out.println("indexing is one multiply and one add — the same work for a[0] as for a[999999]");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

const long long BASE = 0x7f0000;  // a pretend starting address

long long address(long long base, int index, int width) {
    return base + (long long)index * width;
}

string hexOf(long long n) {
    ostringstream out;
    out << "0x" << hex << n;
    return out.str();
}

int main() {
    cout << left << setw(10) << "type" << " " << right << setw(6) << "bytes" << "  "
         << setw(10) << "a[0]" << " " << setw(10) << "a[1]" << " "
         << setw(10) << "a[2]" << " " << setw(10) << "a[7]" << "\\n";
    cout << string(62, '-') << "\\n";
    vector<pair<string, int>> rows = {{"byte", 1}, {"int", 4}, {"long", 8}, {"double", 8}};
    for (const auto& [name, width] : rows) {
        ostringstream cells;
        for (int i : {0, 1, 2, 7}) cells << setw(11) << hexOf(address(BASE, i, width));
        cout << left << setw(10) << name << " " << right << setw(6) << width
             << " " << cells.str() << "\\n";
    }

    cout << "\\n";
    cout << "indexing is one multiply and one add — the same work for a[0] as for a[999999]\\n";
}`,
            },
            {
              lang: "rust",
              code: `const BASE: u64 = 0x7f0000; // a pretend starting address, so the arithmetic is visible

fn address(base: u64, index: u64, width: u64) -> u64 {
    base + index * width
}

fn main() {
    println!(
        "{:<10} {:>6}  {:>10} {:>10} {:>10} {:>10}",
        "type", "bytes", "a[0]", "a[1]", "a[2]", "a[7]"
    );
    println!("{}", "-".repeat(62));
    for (name, width) in [("byte", 1u64), ("int", 4), ("long", 8), ("double", 8)] {
        let cells: String = [0u64, 1, 2, 7]
            .iter()
            .map(|i| format!("{:>11}", format!("0x{:x}", address(BASE, *i, width))))
            .collect();
        println!("{:<10} {:>6} {}", name, width, cells);
    }

    println!();
    println!("indexing is one multiply and one add — the same work for a[0] as for a[999999]");
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

const BASE = 0x7f0000 // a pretend starting address, so the arithmetic is visible

func address(base, index, width int) int {
	return base + index*width
}

func main() {
	fmt.Printf("%-10s %6s  %10s %10s %10s %10s\\n",
		"type", "bytes", "a[0]", "a[1]", "a[2]", "a[7]")
	fmt.Println(strings.Repeat("-", 62))
	type row struct {
		name  string
		width int
	}
	for _, r := range []row{{"byte", 1}, {"int", 4}, {"long", 8}, {"double", 8}} {
		var cells strings.Builder
		for _, i := range []int{0, 1, 2, 7} {
			fmt.Fprintf(&cells, "%11s", fmt.Sprintf("0x%x", address(BASE, i, r.width)))
		}
		fmt.Printf("%-10s %6d %s\\n", r.name, r.width, cells.String())
	}

	fmt.Println()
	fmt.Println("indexing is one multiply and one add — the same work for a[0] as for a[999999]")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "locality",
      heading: "Contiguity buys something the complexity does not show",
      body: [
        "Contiguity has a second consequence, and it is the one that catches people out in practice.",
        "Memory is not read a byte at a time. When the processor needs one address, it fetches a whole **cache line** around it — typically 64 bytes, so sixteen 4-byte ints. Those neighbours are now free to read. If your next access is the next element, it costs nothing; if it is somewhere else, the fetch is wasted and you pay again.",
        "This is **locality of reference**, and it is why a contiguous array beats every structure with the same asymptotic cost. Two loops that visit exactly the same 16 million elements, doing exactly the same addition, both indisputably O(n²) — and one is many times slower, purely because of the order it visits them in.",
        "In Java a 2D array is an array of row references, so a row really is contiguous. In C and in NumPy the whole matrix is one block in **row-major** order, which gives the same conclusion for the same reason.",
      ],
      examples: [
        {
          id: "row-vs-column",
          title: "Same elements, same complexity, very different speed",
          lang: "java",
          code: `public class Main {
    static final int N = 4000;

    static long rowMajor(int[][] m) {
        long sum = 0;
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                sum += m[r][c];
        return sum;
    }

    static long colMajor(int[][] m) {
        long sum = 0;
        for (int c = 0; c < N; c++)
            for (int r = 0; r < N; r++)
                sum += m[r][c];
        return sum;
    }

    public static void main(String[] args) {
        int[][] m = new int[N][N];
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                m[r][c] = 1;

        for (int i = 0; i < 3; i++) { rowMajor(m); colMajor(m); }   // warm the JIT

        long t0 = System.nanoTime();
        long a = rowMajor(m);
        long t1 = System.nanoTime();
        long b = colMajor(m);
        long t2 = System.nanoTime();

        long row = t1 - t0, col = t2 - t1;
        System.out.println("same answer         : " + (a == b));
        System.out.println("elements visited    : " + (long) N * N + " either way");
        System.out.println("same complexity     : O(n^2) either way");
        System.out.println("column-major slower : " + (col > row));
        System.out.println("by more than 2x     : " + (col > 2 * row));
    }
}`,
          output: `same answer         : true
elements visited    : 16000000 either way
same complexity     : O(n^2) either way
column-major slower : true
by more than 2x     : true`,
          explanation:
            "The program asserts only the *shape* of the result, because a millisecond figure printed in a lesson is a promise about somebody else's machine that cannot be kept. On the machine this was verified on the gap was about **17×** — 11ms against 192ms — and it will differ on yours while the inequality will not. The mechanism: the row-major loop touches consecutive addresses, so one cache line serves sixteen iterations. The column-major loop jumps 16KB between accesses, so every single one is a fresh fetch and fifteen sixteenths of every line is thrown away.",
        },
      ],
      pitfalls: [
        {
          title: "Reporting a constant-factor win as a complexity win",
          body: "Swapping the loop order above changes nothing about the complexity — it is O(n²) before and after, and doubling n still quadruples the work in both. Saying \"I made it faster by fixing the traversal order, it is still O(n²)\" is a strong answer. Saying \"I optimised it to O(n)\" is wrong, and an interviewer will follow up on it. Complexity and constant factor are separate claims and are worth separate sentences.",
        },
      ],
    },
    {
      id: "values-vs-references",
      heading: "An array of values against an array of references",
      body: [
        "The locality argument only holds when the array contains the data. Once it contains *pointers to* the data, every element access is two loads — one for the pointer, one for the object it names — and the objects can be anywhere.",
        "In Java this is the difference between `int[]` and `Integer[]`, which is the difference between `int[]` and `List<Integer>` too, since the list is backed by an `Object[]`. In Python it is unavoidable: a `list` is always an array of references, which is a large part of why Python is slower than Java at this kind of work regardless of the algorithm.",
        "The practical rules that fall out: **prefer `int[]` to `List<Integer>` for hot numeric work in Java**, and in Python **prefer a whole-array operation to a per-element loop** when one exists, because it runs the loop in C rather than in the interpreter.",
      ],
      examples: [
        {
          id: "boxed-vs-primitive",
          title: "int[] against Integer[], same numbers",
          lang: "java",
          code: `public class Main {
    static final int N = 10_000_000;

    static long sumPrimitive(int[] a) { long s = 0; for (int v : a) s += v; return s; }
    static long sumBoxed(Integer[] a) { long s = 0; for (Integer v : a) s += v; return s; }

    public static void main(String[] args) {
        int[] prim = new int[N];
        Integer[] boxed = new Integer[N];
        for (int i = 0; i < N; i++) { prim[i] = i % 1000; boxed[i] = i % 1000; }

        for (int i = 0; i < 5; i++) { sumPrimitive(prim); sumBoxed(boxed); }   // warm the JIT

        long t0 = System.nanoTime();
        long a = sumPrimitive(prim);
        long t1 = System.nanoTime();
        long b = sumBoxed(boxed);
        long t2 = System.nanoTime();

        System.out.println("same sum          : " + (a == b));
        System.out.println("int[]    bytes    : " + (long) N * 4 + "  (the numbers, packed)");
        System.out.println("Integer[] bytes   : " + (long) N * 8 + " of pointers + " + (long) N * 16 + " of objects");
        System.out.println("boxed slower      : " + ((t2 - t1) > (t1 - t0)));
        System.out.println("by more than 2x   : " + ((t2 - t1) > 2 * (t1 - t0)));
    }
}`,
          output: `same sum          : true
int[]    bytes    : 40000000  (the numbers, packed)
Integer[] bytes   : 80000000 of pointers + 160000000 of objects
boxed slower      : true
by more than 2x   : true`,
          explanation:
            "Six times the memory for the same ten million numbers, and about **4.7×** the time on the verifying machine. The memory figures are exact arithmetic rather than a measurement: eight bytes for each reference, plus a sixteen-byte object header and payload for each `Integer` it points at. Neither array's traversal is anything other than O(n) — this is entirely constant factor, and constant factors of five decide whether a solution finishes inside a time limit.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming `Integer` equality behaves like `int` equality",
          body: "Because `Integer` is a reference, `==` compares identities rather than values. Java caches the boxes for −128 to 127, so `Integer a = 100, b = 100; a == b` is `true` while the same code with `1000` is `false`. This is the single most common silent bug when a `List<Integer>` replaces an `int[]`. Use `.equals` or `intValue()`, or keep the primitives.",
        },
      ],
    },
    {
      id: "what-to-carry",
      heading: "What to carry forward",
      body: [
        "Three things from this lesson get used constantly in the rest of Module 1.",
        "**Indexing is arithmetic, not search.** Every technique that computes an index instead of scanning for it — cyclic sort, counting sort, marking a value's presence by its own index, the bucket in a hash table — is trading on exactly this. When you see \"values are in the range 1 to n\", the reason it is a gift is that it lets you index by value.",
        "**Contiguity is a real advantage, and it does not appear in the complexity.** It is why an array beats a linked list at nearly everything in practice despite the linked list's better insertion complexity, and why you should be suspicious of a structure whose elements are scattered.",
        "**Say complexity and constant factor separately.** They are different claims, they are improved by different means, and conflating them is how a good optimisation gets described as a wrong one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is array indexing O(1)?",
      answer:
        "Because the address of element i is computed rather than found: the array knows the base address and the element width, so the element lives at base + i × width. That is one multiply and one add whatever i is, with no traversal involved. It also explains the two constraints that come with arrays — every element must be the same width, or the multiplication is wrong, and the block must be contiguous, or the addition lands on unrelated memory.",
    },
    {
      question: "Two nested loops sum the same matrix, one row by row and one column by column. Same complexity — will they run at the same speed?",
      answer:
        "No, and the row-major one can be an order of magnitude faster. Memory is fetched a cache line at a time, around 64 bytes or sixteen ints, so the row-major loop gets fifteen of its next sixteen accesses for free while the column-major loop jumps a whole row between accesses and wastes almost every line it fetches. Measured on a 4000×4000 matrix the gap was about 17×. Both are still O(n²) — the traversal order is a constant-factor effect, and it is worth stating it as one rather than claiming a complexity improvement.",
    },
    {
      question: "When would you choose `int[]` over `List<Integer>`?",
      answer:
        "Whenever the work is numeric and hot, and the size is known or manageable. `List<Integer>` is backed by an `Object[]`, so every element is a reference to a separately allocated box — about six times the memory and, measured over ten million elements, roughly five times the time for the same sum. It also introduces the `==` trap, since comparing two `Integer` references outside the −128 to 127 cache compares identity rather than value. Take the list when you need growth or the collections API, and take the array when the loop matters.",
    },
  ],
  takeaways: [
    "An array is one contiguous block; element i lives at base + i × width",
    "That arithmetic is the whole reason indexing is O(1) — nothing is searched",
    "Memory arrives a cache line at a time, so consecutive access is nearly free",
    "Row-major vs column-major over a 4000×4000 matrix: ~17× apart, same O(n²)",
    "`Integer[]` costs ~6× the memory and ~5× the time of `int[]` for the same numbers",
    "`==` on boxed Integers compares identity — true below 128, false above it",
    "Complexity and constant factor are separate claims; state them separately",
    "\"Values in the range 1 to n\" is an invitation to index by value",
  ],
  status: "available",
};
