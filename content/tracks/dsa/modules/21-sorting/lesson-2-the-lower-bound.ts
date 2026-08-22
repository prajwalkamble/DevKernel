import type { Lesson } from "@/content/types";

export const lowerBoundLesson: Lesson = {
  id: "dsa-sort-lower-bound",
  slug: "the-n-log-n-lower-bound",
  moduleSlug: "sorting",
  title: "The n log n Lower Bound",
  summary:
    "No comparison sort can beat O(n log n), and the proof is a counting argument you can reconstruct in an interview. The sorts that do beat it escape by not comparing at all.",
  estimatedMinutes: 25,
  objectives: [
    "Reconstruct the decision-tree argument for the Ω(n log n) bound",
    "State precisely which sorts the bound applies to",
    "Explain how counting and radix sort avoid it",
    "Say what those sorts pay in exchange",
  ],
  sections: [
    {
      id: "the-argument",
      heading: "Why comparisons cannot do better",
      body: [
        "Think of a comparison sort as walking down a decision tree. Each internal node is a comparison, each branch is an outcome, and each leaf is one final arrangement.",
        "There are **n! possible orderings** of n distinct elements, and the algorithm must be able to reach every one of them — otherwise there is some input it sorts wrongly. So the tree needs at least n! leaves.",
        "A binary tree of height h has at most 2^h leaves. So `2^h ≥ n!`, which gives `h ≥ log₂(n!)`.",
        "By Stirling's approximation `log₂(n!)` is `Θ(n log n)`. The height of the tree is the number of comparisons in the worst case, so **every comparison sort needs Ω(n log n) comparisons on some input**.",
        "The argument is worth being able to reproduce, because it is one of the few lower bounds in the syllabus and interviewers do ask for it. The one-line version: *there are n! answers, each comparison halves the possibilities, so you need log₂(n!) ≈ n log n of them*.",
      ],
    },
    {
      id: "what-it-covers",
      heading: "What the bound does and does not cover",
      body: [
        "It applies to algorithms whose **only** way of learning about the data is asking \"is a before b?\". Insertion, merge, quick, heap, shell, cocktail — all bound.",
        "It says nothing about algorithms that look *inside* a key. If you can use a key's value as an array index, you are not comparing, the decision tree does not model you, and the bound does not apply.",
        "That is the whole escape hatch, and both counting sort and radix sort go through it.",
        "It also assumes the elements are distinct, and it bounds the **worst case**. An adaptive sort can be O(n) on favourable input without contradicting anything — insertion sort on already-sorted data is not a counterexample, because the bound is a statement about some input, not every input.",
      ],
      examples: [
        {
          id: "counting-sort",
          title: "Sorting without a single comparison",
          lang: "python",
          code: `def counting_sort(a, k):
    counts = [0] * (k + 1)
    for x in a:
        counts[x] += 1
    print("counts:", counts)
    for i in range(1, k + 1):
        counts[i] += counts[i - 1]
    print("running:", counts)
    out = [0] * len(a)
    for x in reversed(a):          # reversed keeps equal keys in input order
        counts[x] -= 1
        out[counts[x]] = x
    return out

data = [3, 1, 4, 1, 5, 0, 2, 3]
print("input: ", data)
print("sorted:", counting_sort(data, 5))`,
          output: `input:  [3, 1, 4, 1, 5, 0, 2, 3]
counts: [1, 2, 1, 2, 1, 1]
running: [1, 3, 4, 6, 7, 8]
sorted: [0, 1, 1, 2, 3, 3, 4, 5]`,
          explanation:
            "Not one `<` between elements. The value **is** the index — `counts[x] += 1` uses the key to address memory directly. The running totals turn counts into final positions: after the prefix sum, `counts[x]` is one past where the last x belongs. Walking the input **backwards** and decrementing is what makes it stable, which lesson 3 shows is the property radix sort depends on entirely.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

function countingSort(a, k) {
  const counts = new Array(k + 1).fill(0);
  for (const x of a) counts[x]++;
  console.log("counts:", list(counts));
  for (let i = 1; i <= k; i++) counts[i] += counts[i - 1];
  console.log("running:", list(counts));
  const out = new Array(a.length).fill(0);
  for (let i = a.length - 1; i >= 0; i--) {   // backwards keeps equal keys in input order
    const x = a[i];
    counts[x]--;
    out[counts[x]] = x;
  }
  return out;
}

const data = [3, 1, 4, 1, 5, 0, 2, 3];
console.log("input: ", list(data));
// Computed before the print: the sort logs two lines of its own, which have to
// land above the result rather than below the label.
const sorted = countingSort(data, 5);
console.log("sorted:", list(sorted));`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

function countingSort(a: number[], k: number): number[] {
  const counts = new Array(k + 1).fill(0);
  for (const x of a) counts[x]++;
  console.log("counts:", list(counts));
  for (let i = 1; i <= k; i++) counts[i] += counts[i - 1];
  console.log("running:", list(counts));
  const out = new Array(a.length).fill(0);
  for (let i = a.length - 1; i >= 0; i--) {   // backwards keeps equal keys in input order
    const x = a[i];
    counts[x]--;
    out[counts[x]] = x;
  }
  return out;
}

const data: number[] = [3, 1, 4, 1, 5, 0, 2, 3];
console.log("input: ", list(data));
// Computed before the print: the sort logs two lines of its own, which have to
// land above the result rather than below the label.
const sorted = countingSort(data, 5);
console.log("sorted:", list(sorted));`,
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

    static int[] countingSort(int[] a, int k) {
        int[] counts = new int[k + 1];
        for (int x : a) counts[x]++;
        System.out.println("counts: " + list(counts));
        for (int i = 1; i <= k; i++) counts[i] += counts[i - 1];
        System.out.println("running: " + list(counts));
        int[] out = new int[a.length];
        for (int i = a.length - 1; i >= 0; i--) {   // backwards keeps equal keys in order
            int x = a[i];
            counts[x]--;
            out[counts[x]] = x;
        }
        return out;
    }

    public static void main(String[] args) {
        int[] data = {3, 1, 4, 1, 5, 0, 2, 3};
        System.out.println("input:  " + list(data));
        int[] sorted = countingSort(data, 5);
        System.out.println("sorted: " + list(sorted));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
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

vector<int> countingSort(const vector<int>& a, int k) {
    vector<int> counts(k + 1, 0);
    for (int x : a) counts[x]++;
    cout << "counts: " << list(counts) << "\\n";
    for (int i = 1; i <= k; i++) counts[i] += counts[i - 1];
    cout << "running: " << list(counts) << "\\n";
    vector<int> out(a.size(), 0);
    for (int i = (int)a.size() - 1; i >= 0; i--) {  // backwards keeps equal keys in order
        int x = a[i];
        counts[x]--;
        out[counts[x]] = x;
    }
    return out;
}

int main() {
    vector<int> data = {3, 1, 4, 1, 5, 0, 2, 3};
    cout << "input:  " << list(data) << "\\n";
    // Computed before the print: \`<<\` runs left to right, so streaming the
    // label first would put it above the two lines the sort logs.
    vector<int> sorted = countingSort(data, 5);
    cout << "sorted: " << list(sorted) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn counting_sort(a: &[i32], k: usize) -> Vec<i32> {
    let mut counts = vec![0i32; k + 1];
    for &x in a {
        counts[x as usize] += 1;
    }
    println!("counts: {}", list(&counts));
    for i in 1..=k {
        counts[i] += counts[i - 1];
    }
    println!("running: {}", list(&counts));
    let mut out = vec![0i32; a.len()];
    for &x in a.iter().rev() {
        // reversed keeps equal keys in input order
        counts[x as usize] -= 1;
        out[counts[x as usize] as usize] = x;
    }
    out
}

fn main() {
    let data = [3, 1, 4, 1, 5, 0, 2, 3];
    println!("input:  {}", list(&data));
    let sorted = counting_sort(&data, 5);
    println!("sorted: {}", list(&sorted));
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

func countingSort(a []int, k int) []int {
	counts := make([]int, k+1)
	for _, x := range a {
		counts[x]++
	}
	fmt.Println("counts:", list(counts))
	for i := 1; i <= k; i++ {
		counts[i] += counts[i-1]
	}
	fmt.Println("running:", list(counts))
	out := make([]int, len(a))
	for i := len(a) - 1; i >= 0; i-- { // backwards keeps equal keys in input order
		x := a[i]
		counts[x]--
		out[counts[x]] = x
	}
	return out
}

func main() {
	data := []int{3, 1, 4, 1, 5, 0, 2, 3}
	fmt.Println("input: ", list(data))
	sorted := countingSort(data, 5)
	fmt.Println("sorted:", list(sorted))
}`,
            },
          ],
        },
      ],
      visual: {
        id: "counting-visual",
        kind: "sorting",
        algorithm: "counting",
        lockAlgorithm: true,
        title: "Counting sort: tally, accumulate, place",
      },
    },
    {
      id: "the-price",
      heading: "What you pay to escape",
      body: [
        "Counting sort is O(n + k) for keys in the range 0..k. When k is comparable to n that is linear and unbeatable. When k is large it is a disaster: sorting eight 32-bit integers this way allocates four billion counters.",
        "So the bound is not really broken; it is traded. Comparison sorts are O(n log n) *for any comparable type*. Counting sort is O(n + k) *for small integer keys only*. You buy speed with a restriction on the input.",
        "Radix sort extends the range by sorting digit by digit, each pass a stable counting sort. d passes over n elements with base-b digits gives O(d · (n + b)). This is how you sort large integers or fixed-length strings in linear time — and the constant is high enough that for n in the thousands, quicksort usually still wins.",
        "The practical takeaway is a recognition rule: when a problem says the values are bounded — ages, scores 0–100, lowercase letters, a small range stated in the constraints — a comparison sort may not be the intended solution.",
      ],
      pitfalls: [
        {
          title: "Claiming a sort beats O(n log n) without saying how",
          body: "\"Radix sort is O(n)\" is the kind of statement that invites a follow-up you must be ready for. It is O(d·(n+b)), and d depends on the key width. For 32-bit keys with base-256 digits that is four passes — linear in n, with a constant of four plus the counting overhead.",
        },
        {
          title: "Reaching for counting sort when k is unbounded",
          body: "The array is sized by the key range, not the element count. Values up to 10⁹ make it unusable regardless of how few elements there are. Check the constraint on the *values*, not on n.",
        },
        {
          title: "Treating the bound as a statement about every input",
          body: "It bounds the worst case. Adaptive sorts are legitimately O(n) on favourable inputs, and that is not a contradiction — there is still some input on which they need n log n comparisons.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Prove that comparison sorting is Ω(n log n).",
      answer:
        "Model it as a decision tree: internal nodes are comparisons, leaves are orderings. There are n! orderings, all reachable, so the tree needs n! leaves. A binary tree of height h has at most 2^h leaves, so h ≥ log₂(n!) = Θ(n log n). Height is worst-case comparisons.",
    },
    {
      question: "How does counting sort get around it?",
      answer:
        "It never compares elements. It uses each key directly as an array index, which the decision-tree model does not describe. The price is a counter array sized by the key range, making it O(n + k) and unusable when k is large.",
    },
    {
      question: "When is radix sort actually the right choice?",
      answer:
        "Large n with fixed-width keys — integers, dates, fixed-length strings — where d passes of stable counting sort beat log n comparisons. For small n the constants dominate and quicksort wins, so it is a large-data technique rather than an interview default.",
    },
  ],
  takeaways: [
    "n! orderings and binary decisions give h ≥ log₂(n!) = Θ(n log n)",
    "The bound applies only to algorithms that learn by comparing",
    "Counting sort uses the key as an index, so the model does not apply",
    "O(n + k) is linear only while k stays near n",
    "Radix sort is repeated stable counting sort, digit by digit",
    "Bounded values in the constraints are the hint to consider these",
  ],
  status: "available",
};
