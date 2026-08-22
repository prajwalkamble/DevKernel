import type { Lesson } from "@/content/types";

export const stringsAtProblemScaleLesson: Lesson = {
  id: "dsa-arr-strings",
  slug: "strings-at-problem-scale",
  moduleSlug: "arrays-and-strings",
  title: "Strings at Problem Scale: Frequency & Canonical Form",
  summary:
    "The two ideas that solve most string problems — count the characters, or reduce the string to a canonical key — and the allocation that quietly turns a linear scan quadratic.",
  estimatedMinutes: 25,
  objectives: [
    "Replace a sort with a fixed-size frequency array when the alphabet is small",
    "Choose a canonical form and use it as a hash-map key",
    "Recognise when `substring` and slicing are costing you a complexity class",
    "Decide between a count array and a hash map on the size of the alphabet",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting beats sorting when the alphabet is small",
      body: [
        "Module 0 covered what a string is and what its operations cost. This lesson is about the two moves that appear in nearly every string problem worth the name.",
        "The first is **frequency counting**. \"Are these two words anagrams?\" has an obvious answer — sort both and compare — which is O(k log k) and completely correct. But an anagram is a statement about *how many of each letter*, and if the alphabet is 26 letters then a 26-slot array of counts answers it in O(k).",
        "The array is the point. It is fixed size regardless of the input, so its space cost is O(1); the index is computed from the character with `ch - 'a'`, which is the constant-time indexing from the last lesson doing exactly what it is good at.",
        "**When to use a map instead:** when the alphabet is not small or not known. Unicode, arbitrary tokens, or words rather than characters all want a `HashMap`/`dict`. The rule is the size of the key space, not the size of the input.",
      ],
      examples: [
        {
          id: "anagram-two-ways",
          title: "Anagram, sorted against counted",
          lang: "python",
          code: `import math


def by_sorting(a, b):
    return sorted(a) == sorted(b)


def by_count_array(a, b):
    if len(a) != len(b):
        return False
    counts = [0] * 26
    for ch in a:
        counts[ord(ch) - ord('a')] += 1
    for ch in b:
        i = ord(ch) - ord('a')
        counts[i] -= 1
        if counts[i] < 0:
            return False
    return True


pairs = [("listen", "silent"), ("anagram", "nagaram"),
         ("rat", "car"), ("aacc", "ccac"), ("a", "ab")]

print(f"{'a':<9} {'b':<9} {'sorted':>8} {'counts':>8}")
print("-" * 38)
for a, b in pairs:
    r1, r2 = by_sorting(a, b), by_count_array(a, b)
    assert r1 == r2, (a, b)
    print(f"{a:<9} {b:<9} {'yes' if r1 else 'no':>8} {'yes' if r2 else 'no':>8}")

print()
print("the two agree on every pair — now what each one costs")
print()
print(f"{'length n':>10} {'sort: n log2 n':>16} {'count: 2n':>12} {'ratio':>8}")
print("-" * 50)
for n in (10, 100, 1_000, 100_000):
    sort_cost = n * math.log2(n)
    count_cost = 2 * n
    print(f"{n:>10} {sort_cost:>16,.0f} {count_cost:>12,} {sort_cost / count_cost:>8.1f}x")`,
          output: `a         b           sorted   counts
--------------------------------------
listen    silent         yes      yes
anagram   nagaram        yes      yes
rat       car             no       no
aacc      ccac            no       no
a         ab              no       no

the two agree on every pair — now what each one costs

  length n   sort: n log2 n    count: 2n    ratio
--------------------------------------------------
        10               33           20      1.7x
       100              664          200      3.3x
      1000            9,966        2,000      5.0x
    100000        1,660,964      200,000      8.3x`,
          explanation:
            "Note how modest the win is at n = 10 and how it grows — that is the log factor, and it is a fair picture of what removing one is worth. The early `if counts[i] < 0: return False` is worth keeping: it exits the moment `b` has a letter `a` cannot supply, which on random unequal input is almost immediately. The length check first is not an optimisation but a correctness guard, since without it `\"a\"` and `\"aa\"` would pass the count loop.",
          alternates: [
            {
              lang: "javascript",
              code: `function bySorting(a, b) {
  return [...a].sort().join("") === [...b].sort().join("");
}

function byCountArray(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Array(26).fill(0);
  for (const ch of a) counts[ch.charCodeAt(0) - 97] += 1;
  for (const ch of b) {
    const i = ch.charCodeAt(0) - 97;
    counts[i] -= 1;
    if (counts[i] < 0) return false;
  }
  return true;
}

// Python's format spec pads and groups digits in one go. Everywhere else in
// this file that is two helpers, written once and reused by both tables.
const left = (s, w) => String(s).padEnd(w);
const right = (s, w) => String(s).padStart(w);
const group = (n) => String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const pairs = [["listen", "silent"], ["anagram", "nagaram"],
  ["rat", "car"], ["aacc", "ccac"], ["a", "ab"]];

console.log(\`\${left("a", 9)} \${left("b", 9)} \${right("sorted", 8)} \${right("counts", 8)}\`);
console.log("-".repeat(38));
for (const [a, b] of pairs) {
  const r1 = bySorting(a, b);
  const r2 = byCountArray(a, b);
  if (r1 !== r2) throw new Error(\`\${a} \${b}\`);
  console.log(\`\${left(a, 9)} \${left(b, 9)} \${right(r1 ? "yes" : "no", 8)} \${right(r2 ? "yes" : "no", 8)}\`);
}

console.log();
console.log("the two agree on every pair — now what each one costs");
console.log();
console.log(\`\${right("length n", 10)} \${right("sort: n log2 n", 16)} \${right("count: 2n", 12)} \${right("ratio", 8)}\`);
console.log("-".repeat(50));
for (const n of [10, 100, 1000, 100000]) {
  const sortCost = n * Math.log2(n);
  const countCost = 2 * n;
  console.log(\`\${right(n, 10)} \${right(group(sortCost), 16)} \${right(group(countCost), 12)} \${right((sortCost / countCost).toFixed(1), 8)}x\`);
}`,
            },
            {
              lang: "typescript",
              code: `function bySorting(a: string, b: string): boolean {
  return [...a].sort().join("") === [...b].sort().join("");
}

function byCountArray(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const counts = new Array(26).fill(0);
  for (const ch of a) counts[ch.charCodeAt(0) - 97] += 1;
  for (const ch of b) {
    const i = ch.charCodeAt(0) - 97;
    counts[i] -= 1;
    if (counts[i] < 0) return false;
  }
  return true;
}

// Python's format spec pads and groups digits in one go. Everywhere else in
// this file that is two helpers, written once and reused by both tables.
const left = (s: string | number, w: number): string => String(s).padEnd(w);
const right = (s: string | number, w: number): string => String(s).padStart(w);
const group = (n: number): string => String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const pairs: [string, string][] = [["listen", "silent"], ["anagram", "nagaram"],
  ["rat", "car"], ["aacc", "ccac"], ["a", "ab"]];

console.log(\`\${left("a", 9)} \${left("b", 9)} \${right("sorted", 8)} \${right("counts", 8)}\`);
console.log("-".repeat(38));
for (const [a, b] of pairs) {
  const r1 = bySorting(a, b);
  const r2 = byCountArray(a, b);
  if (r1 !== r2) throw new Error(\`\${a} \${b}\`);
  console.log(\`\${left(a, 9)} \${left(b, 9)} \${right(r1 ? "yes" : "no", 8)} \${right(r2 ? "yes" : "no", 8)}\`);
}

console.log();
console.log("the two agree on every pair — now what each one costs");
console.log();
console.log(\`\${right("length n", 10)} \${right("sort: n log2 n", 16)} \${right("count: 2n", 12)} \${right("ratio", 8)}\`);
console.log("-".repeat(50));
for (const n of [10, 100, 1000, 100000]) {
  const sortCost = n * Math.log2(n);
  const countCost = 2 * n;
  console.log(\`\${right(n, 10)} \${right(group(sortCost), 16)} \${right(group(countCost), 12)} \${right((sortCost / countCost).toFixed(1), 8)}x\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;

public class Main {
    static boolean bySorting(String a, String b) {
        char[] x = a.toCharArray();
        char[] y = b.toCharArray();
        Arrays.sort(x);
        Arrays.sort(y);
        return Arrays.equals(x, y);
    }

    static boolean byCountArray(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] counts = new int[26];
        for (char ch : a.toCharArray()) counts[ch - 'a'] += 1;
        for (char ch : b.toCharArray()) {
            int i = ch - 'a';
            counts[i] -= 1;
            if (counts[i] < 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        String[][] pairs = {{"listen", "silent"}, {"anagram", "nagaram"},
                            {"rat", "car"}, {"aacc", "ccac"}, {"a", "ab"}};

        System.out.printf("%-9s %-9s %8s %8s%n", "a", "b", "sorted", "counts");
        System.out.println("-".repeat(38));
        for (String[] p : pairs) {
            boolean r1 = bySorting(p[0], p[1]);
            boolean r2 = byCountArray(p[0], p[1]);
            if (r1 != r2) throw new AssertionError(p[0] + " " + p[1]);
            System.out.printf("%-9s %-9s %8s %8s%n", p[0], p[1], r1 ? "yes" : "no", r2 ? "yes" : "no");
        }

        System.out.println();
        System.out.println("the two agree on every pair — now what each one costs");
        System.out.println();
        System.out.printf("%10s %16s %12s %8s%n", "length n", "sort: n log2 n", "count: 2n", "ratio");
        System.out.println("-".repeat(50));
        for (int n : new int[]{10, 100, 1_000, 100_000}) {
            double sortCost = n * (Math.log(n) / Math.log(2));
            int countCost = 2 * n;
            System.out.printf("%10d %,16.0f %,12d %8.1fx%n", n, sortCost, countCost, sortCost / countCost);
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static bool by_sorting(std::string a, std::string b) {
    std::sort(a.begin(), a.end());
    std::sort(b.begin(), b.end());
    return a == b;
}

static bool by_count_array(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;
    std::vector<int> counts(26, 0);
    for (char ch : a) counts[ch - 'a'] += 1;
    for (char ch : b) {
        int i = ch - 'a';
        counts[i] -= 1;
        if (counts[i] < 0) return false;
    }
    return true;
}

// Python's \`,\` format spec, by hand: iostreams only group digits through a
// locale, and the one that does it is not guaranteed to be installed.
static std::string group(long long n) {
    std::string s = std::to_string(n), out;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i > 0 && (s.size() - i) % 3 == 0) out += ',';
        out += s[i];
    }
    return out;
}

int main() {
    const std::string pairs[][2] = {{"listen", "silent"}, {"anagram", "nagaram"},
                                    {"rat", "car"}, {"aacc", "ccac"}, {"a", "ab"}};

    std::cout << std::left << std::setw(9) << "a" << ' ' << std::setw(9) << "b"
              << ' ' << std::right << std::setw(8) << "sorted"
              << ' ' << std::setw(8) << "counts" << '\\n';
    std::cout << std::string(38, '-') << '\\n';
    for (const auto& p : pairs) {
        bool r1 = by_sorting(p[0], p[1]);
        bool r2 = by_count_array(p[0], p[1]);
        if (r1 != r2) { std::cerr << "disagreement on " << p[0] << '\\n'; return 1; }
        std::cout << std::left << std::setw(9) << p[0] << ' ' << std::setw(9) << p[1]
                  << ' ' << std::right << std::setw(8) << (r1 ? "yes" : "no")
                  << ' ' << std::setw(8) << (r2 ? "yes" : "no") << '\\n';
    }

    std::cout << '\\n' << "the two agree on every pair — now what each one costs" << '\\n' << '\\n';
    std::cout << std::right << std::setw(10) << "length n" << ' ' << std::setw(16) << "sort: n log2 n"
              << ' ' << std::setw(12) << "count: 2n" << ' ' << std::setw(8) << "ratio" << '\\n';
    std::cout << std::string(50, '-') << '\\n';
    for (long long n : {10LL, 100LL, 1000LL, 100000LL}) {
        double sort_cost = n * std::log2(static_cast<double>(n));
        long long count_cost = 2 * n;
        std::cout << std::setw(10) << n
                  << ' ' << std::setw(16) << group(std::llround(sort_cost))
                  << ' ' << std::setw(12) << group(count_cost)
                  << ' ' << std::setw(8) << std::fixed << std::setprecision(1)
                  << sort_cost / count_cost << "x" << '\\n';
    }
}`,
            },
            {
              lang: "rust",
              code: `fn by_sorting(a: &str, b: &str) -> bool {
    let mut x: Vec<char> = a.chars().collect();
    let mut y: Vec<char> = b.chars().collect();
    x.sort_unstable();
    y.sort_unstable();
    x == y
}

fn by_count_array(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut counts = [0i32; 26];
    for ch in a.bytes() {
        counts[(ch - b'a') as usize] += 1;
    }
    for ch in b.bytes() {
        let i = (ch - b'a') as usize;
        counts[i] -= 1;
        if counts[i] < 0 {
            return false;
        }
    }
    true
}

/// Python's \`,\` format spec, by hand: \`format!\` has width and precision but no
/// digit grouping.
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
    let pairs = [("listen", "silent"), ("anagram", "nagaram"),
                 ("rat", "car"), ("aacc", "ccac"), ("a", "ab")];

    println!("{:<9} {:<9} {:>8} {:>8}", "a", "b", "sorted", "counts");
    println!("{}", "-".repeat(38));
    for (a, b) in pairs {
        let r1 = by_sorting(a, b);
        let r2 = by_count_array(a, b);
        assert_eq!(r1, r2, "{} {}", a, b);
        println!("{:<9} {:<9} {:>8} {:>8}", a, b,
                 if r1 { "yes" } else { "no" }, if r2 { "yes" } else { "no" });
    }

    println!();
    println!("the two agree on every pair — now what each one costs");
    println!();
    println!("{:>10} {:>16} {:>12} {:>8}", "length n", "sort: n log2 n", "count: 2n", "ratio");
    println!("{}", "-".repeat(50));
    for n in [10i64, 100, 1_000, 100_000] {
        let sort_cost = n as f64 * (n as f64).log2();
        let count_cost = 2 * n;
        println!("{:>10} {:>16} {:>12} {:>8.1}x", n, group(sort_cost.round() as i64),
                 group(count_cost), sort_cost / count_cost as f64);
    }
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

func bySorting(a, b string) bool {
	x := strings.Split(a, "")
	y := strings.Split(b, "")
	sort.Strings(x)
	sort.Strings(y)
	return strings.Join(x, "") == strings.Join(y, "")
}

func byCountArray(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var counts [26]int
	for i := 0; i < len(a); i++ {
		counts[a[i]-'a']++
	}
	for i := 0; i < len(b); i++ {
		j := b[i] - 'a'
		counts[j]--
		if counts[j] < 0 {
			return false
		}
	}
	return true
}

// Python's \`,\` format spec, by hand: fmt has widths and precisions but no
// digit grouping.
func group(n int64) string {
	s := fmt.Sprintf("%d", n)
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
	pairs := [][2]string{{"listen", "silent"}, {"anagram", "nagaram"},
		{"rat", "car"}, {"aacc", "ccac"}, {"a", "ab"}}

	fmt.Printf("%-9s %-9s %8s %8s\\n", "a", "b", "sorted", "counts")
	fmt.Println(strings.Repeat("-", 38))
	for _, p := range pairs {
		r1 := bySorting(p[0], p[1])
		r2 := byCountArray(p[0], p[1])
		if r1 != r2 {
			panic(p[0] + " " + p[1])
		}
		yes := func(b bool) string {
			if b {
				return "yes"
			}
			return "no"
		}
		fmt.Printf("%-9s %-9s %8s %8s\\n", p[0], p[1], yes(r1), yes(r2))
	}

	fmt.Println()
	fmt.Println("the two agree on every pair — now what each one costs")
	fmt.Println()
	fmt.Printf("%10s %16s %12s %8s\\n", "length n", "sort: n log2 n", "count: 2n", "ratio")
	fmt.Println(strings.Repeat("-", 50))
	for _, n := range []int64{10, 100, 1_000, 100_000} {
		sortCost := float64(n) * math.Log2(float64(n))
		countCost := 2 * n
		fmt.Printf("%10d %16s %12s %8.1fx\\n", n, group(int64(math.Round(sortCost))),
			group(countCost), sortCost/float64(countCost))
	}
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Sizing the count array to the alphabet you assumed",
          body: "`new int[26]` is right for lowercase English and wrong the moment the input contains a capital, a digit or a space, where `ch - 'a'` goes negative or past the end. If the statement does not promise lowercase letters, either ask, or use `new int[128]` for ASCII and index by the character's own code, which costs nothing extra and cannot be out of range.",
        },
      ],
    },
    {
      id: "canonical-form",
      heading: "Canonical form: making unequal things equal",
      body: [
        "The second move. **A canonical form is a function that maps everything you want to treat as the same to one identical value** — which means you can use it as a hash-map key, and the map does the grouping for you.",
        "\"Group the anagrams together\" is the standard example. Two words belong in the same group when they have the same letters, so any function that ignores the ordering will do: the sorted string, or the tuple of 26 counts. Both are canonical; they differ only in cost.",
        "This generalises much further than strings, and it is worth recognising as a pattern rather than a trick. Grouping points by the line they lie on, shapes by their normalised outline, numbers by their remainder — all the same shape. **Whenever a problem says \"group by\", \"how many distinct\", or \"do any two of these match under some transformation\", you are being asked for a canonical form.**",
      ],
      examples: [
        {
          id: "group-anagrams",
          title: "Two canonical keys, one grouping",
          lang: "python",
          code: `from collections import defaultdict

words = ["eat", "tea", "tan", "ate", "nat", "bat"]


def sorted_key(word):
    return "".join(sorted(word))


def count_key(word):
    counts = [0] * 26
    for ch in word:
        counts[ord(ch) - ord('a')] += 1
    return tuple(counts)


for name, key in [("sorted key", sorted_key), ("count key", count_key)]:
    groups = defaultdict(list)
    for w in words:
        groups[key(w)].append(w)
    print(f"{name}:")
    for k, members in groups.items():
        shown = k if isinstance(k, str) else "".join(
            chr(ord('a') + i) * c for i, c in enumerate(k) if c
        )
        print(f"  {shown:<6} -> [{', '.join(members)}]")
    print(f"  groups: {len(groups)}")
    print()

print("identical grouping; the key is what differs")
print("  sorted key costs O(k log k) per word and is 3 lines")
print("  count key  costs O(k)       per word and is 5")`,
          output: `sorted key:
  aet    -> [eat, tea, ate]
  ant    -> [tan, nat]
  abt    -> [bat]
  groups: 3

count key:
  aet    -> [eat, tea, ate]
  ant    -> [tan, nat]
  abt    -> [bat]
  groups: 3

identical grouping; the key is what differs
  sorted key costs O(k log k) per word and is 3 lines
  count key  costs O(k)       per word and is 5`,
          explanation:
            "The key must be **hashable and immutable**, which is why the count version returns a `tuple` rather than the list — a list cannot be a dict key. Java has the same requirement for a different reason: an array's `hashCode` is its identity, so `int[]` is useless as a `HashMap` key and the counts must be turned into a `String` or a `List<Integer>` first. Note that the groups come out in first-appearance order, because both `dict` and `defaultdict` preserve insertion order; nothing about the algorithm guarantees the order a judge expects, so sort if the problem asks you to.",
          alternates: [
            {
              lang: "javascript",
              code: `const words = ["eat", "tea", "tan", "ate", "nat", "bat"];

function sortedKey(word) {
  return [...word].sort().join("");
}

// Python can hand a tuple straight to a dict; a JavaScript Map keys objects by
// identity, so two equal count arrays would land in two different buckets. The
// counts have to be serialised into a string to be usable as a key at all.
function countKey(word) {
  const counts = new Array(26).fill(0);
  for (const ch of word) counts[ch.charCodeAt(0) - 97] += 1;
  return counts.join(",");
}

function expand(key) {
  if (!key.includes(",")) return key;
  return key.split(",")
    .map((c, i) => String.fromCharCode(97 + i).repeat(Number(c)))
    .join("");
}

for (const [name, key] of [["sorted key", sortedKey], ["count key", countKey]]) {
  // A Map, not a plain object: it iterates in insertion order for every kind of
  // key, where an object would reorder integer-like ones.
  const groups = new Map();
  for (const w of words) {
    const k = key(w);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(w);
  }
  console.log(\`\${name}:\`);
  for (const [k, members] of groups) {
    console.log(\`  \${expand(k).padEnd(6)} -> [\${members.join(", ")}]\`);
  }
  console.log(\`  groups: \${groups.size}\`);
  console.log();
}

console.log("identical grouping; the key is what differs");
console.log("  sorted key costs O(k log k) per word and is 3 lines");
console.log("  count key  costs O(k)       per word and is 5");`,
            },
            {
              lang: "typescript",
              code: `const words: string[] = ["eat", "tea", "tan", "ate", "nat", "bat"];

function sortedKey(word: string): string {
  return [...word].sort().join("");
}

// Python can hand a tuple straight to a dict; a JavaScript Map keys objects by
// identity, so two equal count arrays would land in two different buckets. The
// counts have to be serialised into a string to be usable as a key at all.
function countKey(word: string): string {
  const counts = new Array(26).fill(0);
  for (const ch of word) counts[ch.charCodeAt(0) - 97] += 1;
  return counts.join(",");
}

function expand(key: string): string {
  if (!key.includes(",")) return key;
  return key.split(",")
    .map((c: string, i: number) => String.fromCharCode(97 + i).repeat(Number(c)))
    .join("");
}

const passes: [string, (w: string) => string][] = [["sorted key", sortedKey], ["count key", countKey]];
for (const [name, key] of passes) {
  // A Map, not a plain object: it iterates in insertion order for every kind of
  // key, where an object would reorder integer-like ones.
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const k = key(w);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(w);
  }
  console.log(\`\${name}:\`);
  for (const [k, members] of groups) {
    console.log(\`  \${expand(k).padEnd(6)} -> [\${members.join(", ")}]\`);
  }
  console.log(\`  groups: \${groups.size}\`);
  console.log();
}

console.log("identical grouping; the key is what differs");
console.log("  sorted key costs O(k log k) per word and is 3 lines");
console.log("  count key  costs O(k)       per word and is 5");`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    static final String[] WORDS = {"eat", "tea", "tan", "ate", "nat", "bat"};

    static String sortedKey(String word) {
        char[] c = word.toCharArray();
        Arrays.sort(c);
        return new String(c);
    }

    /* A List<Integer> rather than an int[]: arrays inherit Object's identity
       hashCode, so two equal count arrays are two different keys. The boxing
       is the price of using the counts as a key at all. */
    static List<Integer> countKey(String word) {
        List<Integer> counts = new ArrayList<>(Arrays.asList(new Integer[26]));
        java.util.Collections.fill(counts, 0);
        for (char ch : word.toCharArray()) counts.set(ch - 'a', counts.get(ch - 'a') + 1);
        return counts;
    }

    static String expand(List<Integer> counts) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 26; i++) {
            for (int c = 0; c < counts.get(i); c++) sb.append((char) ('a' + i));
        }
        return sb.toString();
    }

    static void report(String name, List<String> shown, List<List<String>> members) {
        System.out.println(name + ":");
        for (int i = 0; i < shown.size(); i++) {
            System.out.printf("  %-6s -> [%s]%n", shown.get(i), String.join(", ", members.get(i)));
        }
        System.out.println("  groups: " + shown.size());
        System.out.println();
    }

    public static void main(String[] args) {
        /* LinkedHashMap, not HashMap: Python's dict iterates in insertion order
           and the printed grouping depends on it. */
        Map<String, List<String>> bySorted = new LinkedHashMap<>();
        for (String w : WORDS) bySorted.computeIfAbsent(sortedKey(w), k -> new ArrayList<>()).add(w);
        report("sorted key", new ArrayList<>(bySorted.keySet()), new ArrayList<>(bySorted.values()));

        Map<List<Integer>, List<String>> byCount = new LinkedHashMap<>();
        for (String w : WORDS) byCount.computeIfAbsent(countKey(w), k -> new ArrayList<>()).add(w);
        List<String> shown = new ArrayList<>();
        for (List<Integer> k : byCount.keySet()) shown.add(expand(k));
        report("count key", shown, new ArrayList<>(byCount.values()));

        System.out.println("identical grouping; the key is what differs");
        System.out.println("  sorted key costs O(k log k) per word and is 3 lines");
        System.out.println("  count key  costs O(k)       per word and is 5");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static const std::vector<std::string> WORDS = {"eat", "tea", "tan", "ate", "nat", "bat"};

static std::string sorted_key(std::string word) {
    std::sort(word.begin(), word.end());
    return word;
}

static std::array<int, 26> count_key(const std::string& word) {
    std::array<int, 26> counts{};
    for (char ch : word) counts[ch - 'a'] += 1;
    return counts;
}

static std::string expand(const std::array<int, 26>& counts) {
    std::string out;
    for (int i = 0; i < 26; ++i) out.append(counts[i], static_cast<char>('a' + i));
    return out;
}

static void report(const std::string& name,
                   const std::vector<std::string>& shown,
                   const std::vector<std::vector<std::string>>& members) {
    std::cout << name << ":\\n";
    for (size_t i = 0; i < shown.size(); ++i) {
        std::string joined;
        for (size_t j = 0; j < members[i].size(); ++j) {
            if (j) joined += ", ";
            joined += members[i][j];
        }
        std::cout << "  " << std::left << std::setw(6) << shown[i] << " -> [" << joined << "]\\n";
    }
    std::cout << "  groups: " << shown.size() << "\\n\\n";
}

/* Neither map here can be iterated for the answer: std::map sorts its keys and
   Python's dict does not. Both passes keep the order the keys first appeared in
   a separate vector, which is what the printed grouping follows. */
template <typename K, typename KeyFn, typename Show>
static void group_by(const std::string& name, KeyFn key, Show show) {
    std::map<K, std::vector<std::string>> groups;
    std::vector<K> order;
    for (const auto& w : WORDS) {
        K k = key(w);
        if (groups.find(k) == groups.end()) order.push_back(k);
        groups[k].push_back(w);
    }
    std::vector<std::string> shown;
    std::vector<std::vector<std::string>> members;
    for (const auto& k : order) {
        shown.push_back(show(k));
        members.push_back(groups[k]);
    }
    report(name, shown, members);
}

int main() {
    group_by<std::string>("sorted key", sorted_key, [](const std::string& k) { return k; });
    group_by<std::array<int, 26>>("count key", count_key, expand);

    std::cout << "identical grouping; the key is what differs\\n";
    std::cout << "  sorted key costs O(k log k) per word and is 3 lines\\n";
    std::cout << "  count key  costs O(k)       per word and is 5\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::HashMap;

const WORDS: [&str; 6] = ["eat", "tea", "tan", "ate", "nat", "bat"];

fn sorted_key(word: &str) -> String {
    let mut c: Vec<char> = word.chars().collect();
    c.sort_unstable();
    c.into_iter().collect()
}

fn count_key(word: &str) -> [i32; 26] {
    let mut counts = [0i32; 26];
    for ch in word.bytes() {
        counts[(ch - b'a') as usize] += 1;
    }
    counts
}

fn expand(counts: &[i32; 26]) -> String {
    let mut out = String::new();
    for (i, &c) in counts.iter().enumerate() {
        for _ in 0..c {
            out.push((b'a' + i as u8) as char);
        }
    }
    out
}

/// A \`HashMap\` iterates in no order at all, and Python's dict iterates in
/// insertion order — so the keys are recorded in \`order\` as they first appear,
/// and that vector is what the printed grouping follows.
fn group_by<K: std::hash::Hash + Eq + Clone>(
    name: &str,
    key: impl Fn(&str) -> K,
    show: impl Fn(&K) -> String,
) {
    let mut groups: HashMap<K, Vec<&str>> = HashMap::new();
    let mut order: Vec<K> = Vec::new();
    for w in WORDS {
        let k = key(w);
        if !groups.contains_key(&k) {
            order.push(k.clone());
        }
        groups.entry(k).or_default().push(w);
    }
    println!("{}:", name);
    for k in &order {
        println!("  {:<6} -> [{}]", show(k), groups[k].join(", "));
    }
    println!("  groups: {}", order.len());
    println!();
}

fn main() {
    group_by("sorted key", sorted_key, |k: &String| k.clone());
    group_by("count key", count_key, expand);

    println!("identical grouping; the key is what differs");
    println!("  sorted key costs O(k log k) per word and is 3 lines");
    println!("  count key  costs O(k)       per word and is 5");
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

var words = []string{"eat", "tea", "tan", "ate", "nat", "bat"}

func sortedKey(word string) string {
	c := strings.Split(word, "")
	sort.Strings(c)
	return strings.Join(c, "")
}

func countKey(word string) [26]int {
	var counts [26]int
	for i := 0; i < len(word); i++ {
		counts[word[i]-'a']++
	}
	return counts
}

func expand(counts [26]int) string {
	var out strings.Builder
	for i, c := range counts {
		out.WriteString(strings.Repeat(string(rune('a'+i)), c))
	}
	return out.String()
}

// Go randomises map iteration on purpose, and Python's dict iterates in
// insertion order — so both passes record the keys as they first appear and
// print from that slice rather than from the map.
func report(name string, shown []string, members [][]string) {
	fmt.Printf("%s:\\n", name)
	for i, s := range shown {
		fmt.Printf("  %-6s -> [%s]\\n", s, strings.Join(members[i], ", "))
	}
	fmt.Printf("  groups: %d\\n\\n", len(shown))
}

func main() {
	bySorted := map[string][]string{}
	var sortedOrder []string
	for _, w := range words {
		k := sortedKey(w)
		if _, seen := bySorted[k]; !seen {
			sortedOrder = append(sortedOrder, k)
		}
		bySorted[k] = append(bySorted[k], w)
	}
	shown := make([]string, 0, len(sortedOrder))
	members := make([][]string, 0, len(sortedOrder))
	for _, k := range sortedOrder {
		shown = append(shown, k)
		members = append(members, bySorted[k])
	}
	report("sorted key", shown, members)

	// A [26]int is comparable, so Go can key a map by the counts directly.
	byCount := map[[26]int][]string{}
	var countOrder [][26]int
	for _, w := range words {
		k := countKey(w)
		if _, seen := byCount[k]; !seen {
			countOrder = append(countOrder, k)
		}
		byCount[k] = append(byCount[k], w)
	}
	shown = shown[:0]
	members = members[:0]
	for _, k := range countOrder {
		shown = append(shown, expand(k))
		members = append(members, byCount[k])
	}
	report("count key", shown, members)

	fmt.Println("identical grouping; the key is what differs")
	fmt.Println("  sorted key costs O(k log k) per word and is 3 lines")
	fmt.Println("  count key  costs O(k)       per word and is 5")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "slicing",
      heading: "The allocation hiding inside a comparison",
      body: [
        "A string is immutable in both languages, so every operation that appears to modify one actually builds a new one. Module 0 established that. The consequence worth drawing out here is what it does *inside an algorithm*.",
        "`t[i:i+m] == w` in Python and `t.substring(i, i + m).equals(w)` in Java both read as a comparison. Each is really two operations: **allocate and copy m characters, then compare them.** The copy happens first and unconditionally, so it cannot benefit from an early exit — the comparison may fail on the first character, but you paid for all m regardless.",
        "The fix is never exotic. Compare in place with indices, and the copy disappears.",
      ],
      examples: [
        {
          id: "slice-vs-index",
          title: "What the slice costs that the comparison does not",
          lang: "python",
          code: `def find_by_slicing(t, w):
    """Every window is copied into a fresh string before it is compared."""
    copied = 0
    for i in range(len(t) - len(w) + 1):
        copied += len(w)                 # the slice allocates and copies w chars
        if t[i:i + len(w)] == w:
            return i, copied
    return -1, copied


def find_by_indexing(t, w):
    """No allocation: compare in place and stop at the first mismatch."""
    read = 0
    for i in range(len(t) - len(w) + 1):
        j = 0
        while j < len(w) and t[i + j] == w[j]:
            read += 1
            j += 1
        if j < len(w):
            read += 1                    # the character that mismatched
        if j == len(w):
            return i, read
    return -1, read


cases = [
    ("mismatch at once", "abcdefghij" * 500, "zzzzzzzzzz"),
    ("long partial match", "a" * 5000 + "b", "a" * 20 + "b"),
    ("found early", "xyz" * 500, "xyzxyz"),
]

print(f"{'case':<20} {'copied':>10} {'read':>10} {'ratio':>8}")
print("-" * 52)
for name, text, word in cases:
    i1, copied = find_by_slicing(text, word)
    i2, read = find_by_indexing(text, word)
    assert i1 == i2, (name, i1, i2)
    print(f"{name:<20} {copied:>10,} {read:>10,} {copied / read:>7.1f}x")

print()
print("same answers, same O(n*m) worst case — but slicing cannot exit early,")
print("because the copy happens before the comparison does.")`,
          output: `case                     copied       read    ratio
----------------------------------------------------
mismatch at once         49,910      4,991    10.0x
long partial match      104,601    104,601     1.0x
found early                   6          6     1.0x

same answers, same O(n*m) worst case — but slicing cannot exit early,
because the copy happens before the comparison does.`,
          explanation:
            "The table is honest about the limits of the win: **10× when mismatches are immediate, and nothing at all when they are not.** That is the right way to think about it — indexing never loses and sometimes wins large, and the size of the win depends on the data. What matters more is the case this table does not show: when the slice happens inside a loop that already runs n times *and the slice length grows with n*, the copying is O(n) per iteration and you have silently written a quadratic algorithm out of a linear one. The dropdown stops at C++ because the premise stops there: in Rust a `&s[i..j]` and in Go an `s[i:j]` borrow the original bytes rather than copying them, so the left column of this table would read zero and the comparison it is making would not exist.",
          alternates: [
            {
              lang: "javascript",
              code: `// Every window is copied into a fresh string before it is compared.
function findBySlicing(t, w) {
  let copied = 0;
  for (let i = 0; i <= t.length - w.length; i++) {
    copied += w.length;               // the slice allocates and copies w chars
    if (t.slice(i, i + w.length) === w) return [i, copied];
  }
  return [-1, copied];
}

// No allocation: compare in place and stop at the first mismatch.
function findByIndexing(t, w) {
  let read = 0;
  for (let i = 0; i <= t.length - w.length; i++) {
    let j = 0;
    while (j < w.length && t[i + j] === w[j]) {
      read += 1;
      j += 1;
    }
    if (j < w.length) read += 1;      // the character that mismatched
    if (j === w.length) return [i, read];
  }
  return [-1, read];
}

const group = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const cases = [
  ["mismatch at once", "abcdefghij".repeat(500), "zzzzzzzzzz"],
  ["long partial match", "a".repeat(5000) + "b", "a".repeat(20) + "b"],
  ["found early", "xyz".repeat(500), "xyzxyz"],
];

console.log(\`\${"case".padEnd(20)} \${"copied".padStart(10)} \${"read".padStart(10)} \${"ratio".padStart(8)}\`);
console.log("-".repeat(52));
for (const [name, text, word] of cases) {
  const [i1, copied] = findBySlicing(text, word);
  const [i2, read] = findByIndexing(text, word);
  if (i1 !== i2) throw new Error(\`\${name}: \${i1} \${i2}\`);
  console.log(\`\${name.padEnd(20)} \${group(copied).padStart(10)} \${group(read).padStart(10)} \${(copied / read).toFixed(1).padStart(7)}x\`);
}

console.log();
console.log("same answers, same O(n*m) worst case — but slicing cannot exit early,");
console.log("because the copy happens before the comparison does.");`,
            },
            {
              lang: "typescript",
              code: `// Every window is copied into a fresh string before it is compared.
function findBySlicing(t: string, w: string): [number, number] {
  let copied = 0;
  for (let i = 0; i <= t.length - w.length; i++) {
    copied += w.length;               // the slice allocates and copies w chars
    if (t.slice(i, i + w.length) === w) return [i, copied];
  }
  return [-1, copied];
}

// No allocation: compare in place and stop at the first mismatch.
function findByIndexing(t: string, w: string): [number, number] {
  let read = 0;
  for (let i = 0; i <= t.length - w.length; i++) {
    let j = 0;
    while (j < w.length && t[i + j] === w[j]) {
      read += 1;
      j += 1;
    }
    if (j < w.length) read += 1;      // the character that mismatched
    if (j === w.length) return [i, read];
  }
  return [-1, read];
}

const group = (n: number): string => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");

const cases: [string, string, string][] = [
  ["mismatch at once", "abcdefghij".repeat(500), "zzzzzzzzzz"],
  ["long partial match", "a".repeat(5000) + "b", "a".repeat(20) + "b"],
  ["found early", "xyz".repeat(500), "xyzxyz"],
];

console.log(\`\${"case".padEnd(20)} \${"copied".padStart(10)} \${"read".padStart(10)} \${"ratio".padStart(8)}\`);
console.log("-".repeat(52));
for (const [name, text, word] of cases) {
  const [i1, copied] = findBySlicing(text, word);
  const [i2, read] = findByIndexing(text, word);
  if (i1 !== i2) throw new Error(\`\${name}: \${i1} \${i2}\`);
  console.log(\`\${name.padEnd(20)} \${group(copied).padStart(10)} \${group(read).padStart(10)} \${(copied / read).toFixed(1).padStart(7)}x\`);
}

console.log();
console.log("same answers, same O(n*m) worst case — but slicing cannot exit early,");
console.log("because the copy happens before the comparison does.");`,
            },
            {
              lang: "java",
              code: `public class Main {
    /** Every window is copied into a fresh string before it is compared. */
    static int[] findBySlicing(String t, String w) {
        int copied = 0;
        for (int i = 0; i <= t.length() - w.length(); i++) {
            copied += w.length();               // substring allocates and copies w chars
            if (t.substring(i, i + w.length()).equals(w)) return new int[]{i, copied};
        }
        return new int[]{-1, copied};
    }

    /** No allocation: compare in place and stop at the first mismatch. */
    static int[] findByIndexing(String t, String w) {
        int read = 0;
        for (int i = 0; i <= t.length() - w.length(); i++) {
            int j = 0;
            while (j < w.length() && t.charAt(i + j) == w.charAt(j)) {
                read += 1;
                j += 1;
            }
            if (j < w.length()) read += 1;      // the character that mismatched
            if (j == w.length()) return new int[]{i, read};
        }
        return new int[]{-1, read};
    }

    public static void main(String[] args) {
        String[][] cases = {
            {"mismatch at once", "abcdefghij".repeat(500), "zzzzzzzzzz"},
            {"long partial match", "a".repeat(5000) + "b", "a".repeat(20) + "b"},
            {"found early", "xyz".repeat(500), "xyzxyz"},
        };

        System.out.printf("%-20s %10s %10s %8s%n", "case", "copied", "read", "ratio");
        System.out.println("-".repeat(52));
        for (String[] c : cases) {
            int[] a = findBySlicing(c[1], c[2]);
            int[] b = findByIndexing(c[1], c[2]);
            if (a[0] != b[0]) throw new AssertionError(c[0]);
            System.out.printf("%-20s %,10d %,10d %7.1fx%n", c[0], a[1], b[1], (double) a[1] / b[1]);
        }

        System.out.println();
        System.out.println("same answers, same O(n*m) worst case — but slicing cannot exit early,");
        System.out.println("because the copy happens before the comparison does.");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

// Every window is copied into a fresh string before it is compared.
static std::pair<long long, long long> find_by_slicing(const std::string& t, const std::string& w) {
    long long copied = 0;
    for (size_t i = 0; i + w.size() <= t.size(); ++i) {
        copied += static_cast<long long>(w.size());   // substr allocates and copies w chars
        if (t.substr(i, w.size()) == w) return {static_cast<long long>(i), copied};
    }
    return {-1, copied};
}

// No allocation: compare in place and stop at the first mismatch.
static std::pair<long long, long long> find_by_indexing(const std::string& t, const std::string& w) {
    long long read = 0;
    for (size_t i = 0; i + w.size() <= t.size(); ++i) {
        size_t j = 0;
        while (j < w.size() && t[i + j] == w[j]) {
            read += 1;
            j += 1;
        }
        if (j < w.size()) read += 1;                  // the character that mismatched
        if (j == w.size()) return {static_cast<long long>(i), read};
    }
    return {-1, read};
}

static std::string repeat(const std::string& s, int n) {
    std::string out;
    for (int i = 0; i < n; ++i) out += s;
    return out;
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
    const std::vector<std::vector<std::string>> cases = {
        {"mismatch at once", repeat("abcdefghij", 500), "zzzzzzzzzz"},
        {"long partial match", repeat("a", 5000) + "b", repeat("a", 20) + "b"},
        {"found early", repeat("xyz", 500), "xyzxyz"},
    };

    std::cout << std::left << std::setw(20) << "case" << ' ' << std::right << std::setw(10) << "copied"
              << ' ' << std::setw(10) << "read" << ' ' << std::setw(8) << "ratio" << '\\n';
    std::cout << std::string(52, '-') << '\\n';
    for (const auto& c : cases) {
        auto a = find_by_slicing(c[1], c[2]);
        auto b = find_by_indexing(c[1], c[2]);
        if (a.first != b.first) { std::cerr << "mismatch on " << c[0] << '\\n'; return 1; }
        std::cout << std::left << std::setw(20) << c[0]
                  << ' ' << std::right << std::setw(10) << group(a.second)
                  << ' ' << std::setw(10) << group(b.second)
                  << ' ' << std::setw(7) << std::fixed << std::setprecision(1)
                  << static_cast<double>(a.second) / static_cast<double>(b.second) << "x" << '\\n';
    }

    std::cout << '\\n';
    std::cout << "same answers, same O(n*m) worst case — but slicing cannot exit early,\\n";
    std::cout << "because the copy happens before the comparison does.\\n";
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Building a suffix or prefix per iteration",
          body: "`for i in range(n): if s[i:] == something` looks linear and is quadratic — the slice at step i copies n − i characters, and those sum to n²/2. The same is true of `s.substring(i)` in Java. If you find yourself slicing inside a loop, the question to ask is whether the slice length depends on n; if it does, replace it with two indices into the original string.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between the three",
      body: [
        "A short decision procedure for the string problems in this module and the next few.",
        "**Fixed-size count array** — the alphabet is small and known (26 letters, 128 ASCII, 10 digits). O(1) space, fastest constant factor, and it doubles as the state for a sliding window later on.",
        "**Hash map of counts** — the alphabet is large, unknown, or the elements are not characters at all. Same asymptotics, larger constant, no assumptions.",
        "**Sorting** — when you need the order and not just the multiset, or when the canonical form genuinely is the sorted sequence and k is small enough that the log factor does not matter. It is also the shortest to write, which is worth something when you are being watched.",
        "And one thing to say out loud in an interview: **\"the alphabet is 26, so this count array is O(1) space, not O(k)\"**. Interviewers ask about that distinction deliberately, and getting it right signals that you know the difference between a bound that grows with the input and one that does not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you check whether two strings are anagrams, and what does it cost?",
      answer:
        "Compare lengths first, then count. A 26-slot array indexed by `ch - 'a'` incremented over the first string and decremented over the second, returning false the moment a count goes negative — O(k) time and O(1) space, since the array's size depends on the alphabet rather than the input. Sorting both and comparing is also correct and shorter to write at O(k log k), which is a reasonable answer if you say why you chose it. If the alphabet is not small or the characters are not known to be lowercase letters, swap the array for a hash map and the asymptotics are unchanged.",
    },
    {
      question: "What is a canonical form and where does it show up?",
      answer:
        "A function that maps every item you want to treat as equivalent onto one identical value, so a hash map can do the grouping. Anagrams are the standard case — the sorted string or the tuple of letter counts both work, and they produce identical groupings at O(k log k) and O(k) respectively. The pattern generalises well beyond strings: grouping points by the line through them, or numbers by their remainder, are the same idea. Any problem phrased as \"group by\", \"count distinct\", or \"are any two of these the same under some transformation\" is asking for one.",
    },
    {
      question: "Why can slicing a string inside a loop be a problem?",
      answer:
        "Because a slice or `substring` allocates and copies before anything is compared, so the cost is paid whether or not the comparison would have failed on the first character. Measured over a scan where mismatches are immediate, slicing copies ten times the characters that in-place indexing reads. The serious version is when the slice length grows with n — `s[i:]` inside a loop over i copies n − i characters each time, which sums to n²/2 and turns a linear algorithm quadratic while still looking linear on the page.",
    },
  ],
  takeaways: [
    "Small known alphabet → a fixed count array; the size is O(1), not O(k)",
    "`ch - 'a'` is the constant-time indexing of the previous lesson, applied",
    "Check lengths before counting — it is correctness, not an optimisation",
    "A canonical form maps equivalents to one key so a map can group them",
    "Sorted string and count tuple are both canonical: O(k log k) against O(k)",
    "Keys must be hashable — a tuple in Python, and never an `int[]` in Java",
    "A slice copies before it compares, so it can never exit early",
    "A slice whose length grows with n inside a loop over n is quadratic",
  ],
  status: "available",
};
