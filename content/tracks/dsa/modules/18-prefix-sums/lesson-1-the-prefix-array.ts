import type { Lesson } from "@/content/types";

export const thePrefixArrayLesson: Lesson = {
  id: "dsa-ps-array",
  slug: "the-prefix-array-and-the-leading-zero",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "The Prefix Array & the Leading Zero",
  summary:
    "One pass of precomputation turns every range-sum query into a single subtraction. The array is one element longer than the input, and that extra leading zero is not padding — it is what removes an edge case from every query you will ever write.",
  estimatedMinutes: 25,
  objectives: [
    "Build a prefix array with the leading-zero convention",
    "Answer a range sum in O(1) and get the indices right",
    "Explain what the leading zero buys",
    "Say when precomputation pays for itself",
    "State why prefix products are a trap",
  ],
  sections: [
    {
      id: "the-trade",
      heading: "Pay once, answer forever",
      body: [
        "Answering *q* range-sum queries by looping over each range costs O(q · n). Precomputing prefix sums costs O(n) once and then O(1) per query — total O(n + q).",
        "For one query the precomputation is wasted. For a thousand queries on a million elements it is the difference between a second and a fortnight. The pattern is worth recognising as a *trade* rather than a trick: you are buying query speed with a linear setup.",
      ],
      examples: [
        {
          id: "prefix",
          title: "The array, the queries, and the product trap",
          lang: "python",
          code: `def build_prefix(a):
    """prefix[i] is the sum of the first i elements. prefix[0] = 0."""
    prefix = [0] * (len(a) + 1)
    for i, v in enumerate(a):
        prefix[i + 1] = prefix[i] + v
    return prefix

a = [3, 1, 4, 1, 5, 9, 2, 6]
p = build_prefix(a)
print("array :", a)
print("prefix:", p, " (length", len(p), "=", len(a), "+ 1)")

print("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:")
for lo, hi in ((0, 3), (2, 6), (0, 8), (4, 5), (3, 3)):
    print(f"  a[{lo}:{hi}] = {a[lo:hi]!s:18} sum {p[hi] - p[lo]:3}"
          f"  (check {sum(a[lo:hi]):3})")

# the leading zero is what removes the special case
print("\\nwithout the leading zero you would need:")
print("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)")
print("with it, every query is one subtraction and lo == 0 is not special.")

# range products, and the zero problem
def build_products(a):
    prod = [1] * (len(a) + 1)
    for i, v in enumerate(a):
        prod[i + 1] = prod[i] * v
    return prod

b = [2, 3, 4, 5]
q = build_products(b)
print("\\nproducts of", b, "->", q)
print("  product b[1:3] =", q[3] // q[1], " (check", 3 * 4, ")")

c = [2, 0, 4, 5]
r = build_products(c)
print("\\nwith a zero:", c, "->", r)
print("  product c[2:4] would be r[4] // r[2] -> division by zero")
print("  prefix products only work when no element is zero, and only for")
print("  exact division — which floats do not give you.")`,
          output: `array : [3, 1, 4, 1, 5, 9, 2, 6]
prefix: [0, 3, 4, 8, 9, 14, 23, 25, 31]  (length 9 = 8 + 1)

range sums, a[lo:hi] = prefix[hi] - prefix[lo]:
  a[0:3] = [3, 1, 4]          sum   8  (check   8)
  a[2:6] = [4, 1, 5, 9]       sum  19  (check  19)
  a[0:8] = [3, 1, 4, 1, 5, 9, 2, 6] sum  31  (check  31)
  a[4:5] = [5]                sum   5  (check   5)
  a[3:3] = []                 sum   0  (check   0)

without the leading zero you would need:
  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)
with it, every query is one subtraction and lo == 0 is not special.

products of [2, 3, 4, 5] -> [1, 2, 6, 24, 120]
  product b[1:3] = 12  (check 12 )

with a zero: [2, 0, 4, 5] -> [1, 2, 0, 0, 0]
  product c[2:4] would be r[4] // r[2] -> division by zero
  prefix products only work when no element is zero, and only for
  exact division — which floats do not give you.`,
          explanation:
            "Note the empty range: `a[3:3]` gives 0 with no special handling, because `p[3] - p[3]` is zero by construction. Every convention question — is the range inclusive, what about an empty one, what about starting at index 0 — answers itself once the array is half-open and one longer than the input.",
          alternates: [
            {
              lang: "javascript",
              code: `// prefix[i] is the sum of the first i elements. prefix[0] = 0.
const list = (xs) => "[" + xs.join(", ") + "]";
const padL = (v, w) => String(v).padStart(w);
const padR = (v, w) => String(v).padEnd(w);

function buildPrefix(a) {
  const prefix = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];
  return prefix;
}

const a = [3, 1, 4, 1, 5, 9, 2, 6];
const p = buildPrefix(a);
console.log("array :", list(a));
console.log("prefix:", list(p), " (length", p.length, "=", a.length, "+ 1)");

console.log("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:");
for (const [lo, hi] of [[0, 3], [2, 6], [0, 8], [4, 5], [3, 3]]) {
  const slice = a.slice(lo, hi);
  const check = slice.reduce((s, v) => s + v, 0);
  console.log(
    \`  a[\${lo}:\${hi}] = \${padR(list(slice), 18)} sum \${padL(p[hi] - p[lo], 3)}  (check \${padL(check, 3)})\`
  );
}

// the leading zero is what removes the special case
console.log("\\nwithout the leading zero you would need:");
console.log("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)");
console.log("with it, every query is one subtraction and lo == 0 is not special.");

// range products, and the zero problem
function buildProducts(a) {
  const prod = new Array(a.length + 1).fill(1);
  for (let i = 0; i < a.length; i++) prod[i + 1] = prod[i] * a[i];
  return prod;
}

const b = [2, 3, 4, 5];
const q = buildProducts(b);
console.log("\\nproducts of", list(b), "->", list(q));
console.log("  product b[1:3] =", Math.trunc(q[3] / q[1]), " (check", 3 * 4, ")");

const c = [2, 0, 4, 5];
const r = buildProducts(c);
console.log("\\nwith a zero:", list(c), "->", list(r));
console.log("  product c[2:4] would be r[4] // r[2] -> division by zero");
console.log("  prefix products only work when no element is zero, and only for");
console.log("  exact division — which floats do not give you.");`,
            },
            {
              lang: "typescript",
              code: `// prefix[i] is the sum of the first i elements. prefix[0] = 0.
const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const padL = (v: number, w: number): string => String(v).padStart(w);
const padR = (v: string, w: number): string => String(v).padEnd(w);

function buildPrefix(a: number[]): number[] {
  const prefix = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];
  return prefix;
}

const a: number[] = [3, 1, 4, 1, 5, 9, 2, 6];
const p = buildPrefix(a);
console.log("array :", list(a));
console.log("prefix:", list(p), " (length", p.length, "=", a.length, "+ 1)");

console.log("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:");
for (const [lo, hi] of [[0, 3], [2, 6], [0, 8], [4, 5], [3, 3]]) {
  const slice = a.slice(lo, hi);
  const check = slice.reduce((s, v) => s + v, 0);
  console.log(
    \`  a[\${lo}:\${hi}] = \${padR(list(slice), 18)} sum \${padL(p[hi] - p[lo], 3)}  (check \${padL(check, 3)})\`
  );
}

// the leading zero is what removes the special case
console.log("\\nwithout the leading zero you would need:");
console.log("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)");
console.log("with it, every query is one subtraction and lo == 0 is not special.");

// range products, and the zero problem
function buildProducts(a: number[]): number[] {
  const prod = new Array(a.length + 1).fill(1);
  for (let i = 0; i < a.length; i++) prod[i + 1] = prod[i] * a[i];
  return prod;
}

const b: number[] = [2, 3, 4, 5];
const q = buildProducts(b);
console.log("\\nproducts of", list(b), "->", list(q));
console.log("  product b[1:3] =", Math.trunc(q[3] / q[1]), " (check", 3 * 4, ")");

const c: number[] = [2, 0, 4, 5];
const r = buildProducts(c);
console.log("\\nwith a zero:", list(c), "->", list(r));
console.log("  product c[2:4] would be r[4] // r[2] -> division by zero");
console.log("  prefix products only work when no element is zero, and only for");
console.log("  exact division — which floats do not give you.");`,
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

    /** prefix[i] is the sum of the first i elements. prefix[0] = 0. */
    static int[] buildPrefix(int[] a) {
        int[] prefix = new int[a.length + 1];
        for (int i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];
        return prefix;
    }

    static int[] buildProducts(int[] a) {
        int[] prod = new int[a.length + 1];
        prod[0] = 1;
        for (int i = 0; i < a.length; i++) prod[i + 1] = prod[i] * a[i];
        return prod;
    }

    public static void main(String[] args) {
        int[] a = {3, 1, 4, 1, 5, 9, 2, 6};
        int[] p = buildPrefix(a);
        System.out.println("array : " + list(a));
        System.out.println("prefix: " + list(p) + "  (length " + p.length
                + " = " + a.length + " + 1)");

        System.out.println("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:");
        int[][] ranges = {{0, 3}, {2, 6}, {0, 8}, {4, 5}, {3, 3}};
        for (int[] r : ranges) {
            int lo = r[0], hi = r[1], check = 0;
            for (int i = lo; i < hi; i++) check += a[i];
            System.out.printf("  a[%d:%d] = %-18s sum %3d  (check %3d)%n",
                    lo, hi, list(a, lo, hi), p[hi] - p[lo], check);
        }

        // the leading zero is what removes the special case
        System.out.println("\\nwithout the leading zero you would need:");
        System.out.println("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)");
        System.out.println("with it, every query is one subtraction and lo == 0 is not special.");

        // range products, and the zero problem
        int[] b = {2, 3, 4, 5};
        int[] q = buildProducts(b);
        System.out.println("\\nproducts of " + list(b) + " -> " + list(q));
        System.out.println("  product b[1:3] = " + q[3] / q[1] + "  (check " + 3 * 4 + " )");

        int[] c = {2, 0, 4, 5};
        int[] rr = buildProducts(c);
        System.out.println("\\nwith a zero: " + list(c) + " -> " + list(rr));
        System.out.println("  product c[2:4] would be r[4] // r[2] -> division by zero");
        System.out.println("  prefix products only work when no element is zero, and only for");
        System.out.println("  exact division — which floats do not give you.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `// prefix[i] is the sum of the first i elements. prefix[0] = 0.
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

vector<int> buildPrefix(const vector<int>& a) {
    vector<int> prefix(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) prefix[i + 1] = prefix[i] + a[i];
    return prefix;
}

vector<int> buildProducts(const vector<int>& a) {
    vector<int> prod(a.size() + 1, 1);
    for (size_t i = 0; i < a.size(); i++) prod[i + 1] = prod[i] * a[i];
    return prod;
}

int main() {
    vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};
    vector<int> p = buildPrefix(a);
    cout << "array : " << list(a) << "\\n";
    cout << "prefix: " << list(p) << "  (length " << p.size()
         << " = " << a.size() << " + 1)\\n";

    cout << "\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:\\n";
    vector<pair<size_t, size_t>> ranges = {{0, 3}, {2, 6}, {0, 8}, {4, 5}, {3, 3}};
    for (auto [lo, hi] : ranges) {
        int check = 0;
        for (size_t i = lo; i < hi; i++) check += a[i];
        cout << "  a[" << lo << ":" << hi << "] = " << left << setw(18) << list(a, lo, hi)
             << " sum " << right << setw(3) << p[hi] - p[lo]
             << "  (check " << setw(3) << check << ")\\n";
    }

    // the leading zero is what removes the special case
    cout << "\\nwithout the leading zero you would need:\\n";
    cout << "  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)\\n";
    cout << "with it, every query is one subtraction and lo == 0 is not special.\\n";

    // range products, and the zero problem
    vector<int> b = {2, 3, 4, 5};
    vector<int> q = buildProducts(b);
    cout << "\\nproducts of " << list(b) << " -> " << list(q) << "\\n";
    cout << "  product b[1:3] = " << q[3] / q[1] << "  (check " << 3 * 4 << " )\\n";

    vector<int> c = {2, 0, 4, 5};
    vector<int> r = buildProducts(c);
    cout << "\\nwith a zero: " << list(c) << " -> " << list(r) << "\\n";
    cout << "  product c[2:4] would be r[4] // r[2] -> division by zero\\n";
    cout << "  prefix products only work when no element is zero, and only for\\n";
    cout << "  exact division — which floats do not give you.\\n";
}`,
            },
            {
              lang: "rust",
              code: `// prefix[i] is the sum of the first i elements. prefix[0] = 0.
fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn build_prefix(a: &[i32]) -> Vec<i32> {
    let mut prefix = vec![0; a.len() + 1];
    for (i, v) in a.iter().enumerate() {
        prefix[i + 1] = prefix[i] + v;
    }
    prefix
}

fn build_products(a: &[i32]) -> Vec<i32> {
    let mut prod = vec![1; a.len() + 1];
    for (i, v) in a.iter().enumerate() {
        prod[i + 1] = prod[i] * v;
    }
    prod
}

fn main() {
    let a = [3, 1, 4, 1, 5, 9, 2, 6];
    let p = build_prefix(&a);
    println!("array : {}", list(&a));
    println!("prefix: {}  (length {} = {} + 1)", list(&p), p.len(), a.len());

    println!("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:");
    for (lo, hi) in [(0usize, 3usize), (2, 6), (0, 8), (4, 5), (3, 3)] {
        let check: i32 = a[lo..hi].iter().sum();
        println!(
            "  a[{}:{}] = {:<18} sum {:3}  (check {:3})",
            lo,
            hi,
            list(&a[lo..hi]),
            p[hi] - p[lo],
            check
        );
    }

    // the leading zero is what removes the special case
    println!("\\nwithout the leading zero you would need:");
    println!("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)");
    println!("with it, every query is one subtraction and lo == 0 is not special.");

    // range products, and the zero problem
    let b = [2, 3, 4, 5];
    let q = build_products(&b);
    println!("\\nproducts of {} -> {}", list(&b), list(&q));
    println!("  product b[1:3] = {}  (check {} )", q[3] / q[1], 3 * 4);

    let c = [2, 0, 4, 5];
    let r = build_products(&c);
    println!("\\nwith a zero: {} -> {}", list(&c), list(&r));
    println!("  product c[2:4] would be r[4] // r[2] -> division by zero");
    println!("  prefix products only work when no element is zero, and only for");
    println!("  exact division — which floats do not give you.");
}`,
            },
            {
              lang: "go",
              code: `// prefix[i] is the sum of the first i elements. prefix[0] = 0.
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

func buildPrefix(a []int) []int {
	prefix := make([]int, len(a)+1)
	for i, v := range a {
		prefix[i+1] = prefix[i] + v
	}
	return prefix
}

func buildProducts(a []int) []int {
	prod := make([]int, len(a)+1)
	prod[0] = 1
	for i, v := range a {
		prod[i+1] = prod[i] * v
	}
	return prod
}

func main() {
	a := []int{3, 1, 4, 1, 5, 9, 2, 6}
	p := buildPrefix(a)
	fmt.Println("array :", list(a))
	fmt.Println("prefix:", list(p), " (length", len(p), "=", len(a), "+ 1)")

	fmt.Println("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:")
	for _, r := range [][2]int{{0, 3}, {2, 6}, {0, 8}, {4, 5}, {3, 3}} {
		lo, hi := r[0], r[1]
		check := 0
		for _, v := range a[lo:hi] {
			check += v
		}
		fmt.Printf("  a[%d:%d] = %-18s sum %3d  (check %3d)\\n",
			lo, hi, list(a[lo:hi]), p[hi]-p[lo], check)
	}

	// the leading zero is what removes the special case
	fmt.Println("\\nwithout the leading zero you would need:")
	fmt.Println("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)")
	fmt.Println("with it, every query is one subtraction and lo == 0 is not special.")

	// range products, and the zero problem
	b := []int{2, 3, 4, 5}
	q := buildProducts(b)
	fmt.Println("\\nproducts of", list(b), "->", list(q))
	fmt.Println("  product b[1:3] =", q[3]/q[1], " (check", 3*4, ")")

	c := []int{2, 0, 4, 5}
	r := buildProducts(c)
	fmt.Println("\\nwith a zero:", list(c), "->", list(r))
	fmt.Println("  product c[2:4] would be r[4] // r[2] -> division by zero")
	fmt.Println("  prefix products only work when no element is zero, and only for")
	fmt.Println("  exact division — which floats do not give you.")
}`,
            },
          ],
        },
      ],
      visual: {
        id: "prefix-visual",
        kind: "pattern",
        algorithm: "prefix",
        lockAlgorithm: true,
        title: "Building the prefix array, then querying it",
      },
    },
    {
      id: "the-leading-zero",
      heading: "Why the leading zero",
      body: [
        "Define `prefix[i]` as the sum of the **first i elements**, so `prefix[0] = 0` — the sum of nothing. Then the sum of the half-open range `a[lo:hi]` is exactly `prefix[hi] - prefix[lo]`, with no conditions.",
        "The alternative — `prefix[i]` meaning the sum up to *and including* index i — needs `prefix[hi] - prefix[lo - 1]`, and `lo == 0` reads `prefix[-1]`. In Python that silently returns the *last* element of the array, which is a wrong answer rather than an error. In Java it throws.",
        "The half-open convention also matches how `a[lo:hi]`, `subList`, and `substring` already work in every language on this site, so the indices in your head match the indices in the code.",
      ],
      pitfalls: [
        {
          title: "Mixing inclusive and half-open in the same function",
          body: "Problems usually state ranges inclusively — \"the sum from index l to index r\". Convert once, at the boundary: `p[r + 1] - p[l]`. Write the conversion down rather than deriving it each time, because deriving it under pressure is where the off-by-one comes from.",
        },
        {
          title: "Prefix products",
          body: "They need division to invert, and division fails on a zero and loses precision on floats. The standard workaround for \"product of array except self\" is not a prefix-product array at all — it is a prefix pass and a suffix pass multiplied together, which never divides.",
        },
        {
          title: "Overflow",
          body: "The last prefix entry is the sum of the whole array. For 10⁵ elements of 10⁹ that is 10¹⁴, which needs a `long` in Java, C++ and Go. This is the width question from the bits-and-math module, and it is the most common way a correct prefix solution still fails.",
        },
      ],
    },
  ],
  takeaways: [
    "Precompute in O(n), then answer each range query in O(1)",
    "`prefix[i]` is the sum of the first i elements, so `prefix[0] = 0`",
    "`sum(a[lo:hi]) = prefix[hi] - prefix[lo]`, with no special case for `lo == 0`",
    "The array is one element longer than the input",
    "Convert inclusive problem indices once, at the boundary",
    "Prefix products need division and break on zeros — use prefix-and-suffix instead",
    "The final prefix is the whole-array sum; check whether it needs 64 bits",
  ],
  status: "available",
};
