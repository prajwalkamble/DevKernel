import type { Lesson } from "@/content/types";

export const subsetEnumerationLesson: Lesson = {
  id: "dsa-bits-subsets",
  slug: "enumerating-subsets",
  moduleSlug: "bit-manipulation-and-math",
  title: "Enumerating Subsets Efficiently",
  summary:
    "Counting from 0 to 2^n gives you every subset. A three-token loop gives you every subset of a *given* subset. And the total cost of the second one over all masks is 3^n, not 4^n — which is the difference between a solution that passes and one that does not.",
  estimatedMinutes: 30,
  objectives: [
    "Enumerate all 2^n subsets by counting",
    "Enumerate the submasks of a mask with `(sub - 1) & mask`",
    "Prove the total submask work over all masks is 3^n",
    "Recognise bitmask DP from the constraints",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting is enumerating",
      body: [
        "Every integer from `0` to `2^n - 1` is a distinct subset of an n-element set, and counting visits each exactly once. There is nothing more to it — no recursion, no backtracking, no visited set.",
      ],
      examples: [
        {
          id: "subsets",
          title: "All subsets, then all submasks of one mask",
          lang: "python",
          code: `# every subset of a 3-element set
items = ["a", "b", "c"]
n = len(items)
print("all subsets of", items)
for mask in range(1 << n):
    chosen = [items[i] for i in range(n) if mask & (1 << i)]
    print(f"  {mask:03b} -> {chosen}")

# submask enumeration: every subset of a given mask, descending
mask = 0b1011
print(f"\\nsubmasks of {mask:04b}")
sub = mask
subs = []
while True:
    subs.append(sub)
    if sub == 0:
        break
    sub = (sub - 1) & mask
print("  ", " ".join(format(s, "04b") for s in subs))
print("   count:", len(subs), "= 2^(popcount) =", 1 << bin(mask).count("1"))

# why the total over all masks is 3^n, not 4^n
total = 0
for m in range(1 << 4):
    s = m
    while True:
        total += 1
        if s == 0:
            break
        s = (s - 1) & m
print("\\nsubmask pairs for n=4:", total, " 3^4 =", 3 ** 4)`,
          output: `all subsets of ['a', 'b', 'c']
  000 -> []
  001 -> ['a']
  010 -> ['b']
  011 -> ['a', 'b']
  100 -> ['c']
  101 -> ['a', 'c']
  110 -> ['b', 'c']
  111 -> ['a', 'b', 'c']

submasks of 1011
   1011 1010 1001 1000 0011 0010 0001 0000
   count: 8 = 2^(popcount) = 8

submask pairs for n=4: 81  3^4 = 81`,
          explanation:
            "The submask loop is the part worth understanding rather than memorising. `sub - 1` borrows through the trailing zeros, and `& mask` immediately discards any bit that was not in `mask` to begin with — so the result is the next-smallest submask, every time. It visits exactly the `2^popcount(mask)` submasks in descending order and stops at zero. The `if sub == 0: break` at the *bottom* rather than the top is deliberate: the empty submask is a legitimate subset and a top-tested loop would skip it.",
          alternates: [
            {
              lang: "javascript",
              code: `const strList = (xs) => "[" + xs.map((s) => \`'\${s}'\`).join(", ") + "]";
const bin = (n, w) => n.toString(2).padStart(w, "0");

// every subset of a 3-element set
const items = ["a", "b", "c"];
const n = items.length;
console.log("all subsets of", strList(items));
for (let mask = 0; mask < 1 << n; mask++) {
  const chosen = items.filter((_, i) => mask & (1 << i));
  console.log(\`  \${bin(mask, 3)} -> \${strList(chosen)}\`);
}

// submask enumeration: every subset of a given mask, descending
const mask = 0b1011;
console.log(\`\\nsubmasks of \${bin(mask, 4)}\`);
const subs = [];
let sub = mask;
for (;;) {
  subs.push(sub);
  if (sub === 0) break;
  sub = (sub - 1) & mask;
}
console.log("  ", subs.map((s) => bin(s, 4)).join(" "));
const popcount = mask.toString(2).split("").filter((c) => c === "1").length;
console.log("   count:", subs.length, "= 2^(popcount) =", 1 << popcount);

// why the total over all masks is 3^n, not 4^n
let total = 0;
for (let m = 0; m < 1 << 4; m++) {
  let s = m;
  for (;;) {
    total++;
    if (s === 0) break;
    s = (s - 1) & m;
  }
}
console.log("\\nsubmask pairs for n=4:", total, " 3^4 =", 3 ** 4);`,
            },
            {
              lang: "typescript",
              code: `const strList = (xs: string[]): string => "[" + xs.map((s) => \`'\${s}'\`).join(", ") + "]";
const bin = (n: number, w: number): string => n.toString(2).padStart(w, "0");

// every subset of a 3-element set
const items: string[] = ["a", "b", "c"];
const n = items.length;
console.log("all subsets of", strList(items));
for (let mask = 0; mask < 1 << n; mask++) {
  const chosen = items.filter((_, i) => mask & (1 << i));
  console.log(\`  \${bin(mask, 3)} -> \${strList(chosen)}\`);
}

// submask enumeration: every subset of a given mask, descending
const mask = 0b1011;
console.log(\`\\nsubmasks of \${bin(mask, 4)}\`);
const subs: number[] = [];
let sub = mask;
for (;;) {
  subs.push(sub);
  if (sub === 0) break;
  sub = (sub - 1) & mask;
}
console.log("  ", subs.map((s) => bin(s, 4)).join(" "));
const popcount = mask.toString(2).split("").filter((c) => c === "1").length;
console.log("   count:", subs.length, "= 2^(popcount) =", 1 << popcount);

// why the total over all masks is 3^n, not 4^n
let total = 0;
for (let m = 0; m < 1 << 4; m++) {
  let s = m;
  for (;;) {
    total++;
    if (s === 0) break;
    s = (s - 1) & m;
  }
}
console.log("\\nsubmask pairs for n=4:", total, " 3^4 =", 3 ** 4);`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String strList(List<String> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("'").append(xs.get(i)).append("'");
        }
        return sb.append("]").toString();
    }

    static String bin(int n, int w) {
        String s = Integer.toBinaryString(n);
        return "0".repeat(Math.max(0, w - s.length())) + s;
    }

    public static void main(String[] args) {
        // every subset of a 3-element set
        List<String> items = List.of("a", "b", "c");
        int n = items.size();
        System.out.println("all subsets of " + strList(items));
        for (int mask = 0; mask < 1 << n; mask++) {
            List<String> chosen = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) chosen.add(items.get(i));
            }
            System.out.println("  " + bin(mask, 3) + " -> " + strList(chosen));
        }

        // submask enumeration: every subset of a given mask, descending
        int mask = 0b1011;
        System.out.println("\\nsubmasks of " + bin(mask, 4));
        List<Integer> subs = new ArrayList<>();
        int sub = mask;
        while (true) {
            subs.add(sub);
            if (sub == 0) break;
            sub = (sub - 1) & mask;
        }
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < subs.size(); i++) {
            if (i > 0) line.append(" ");
            line.append(bin(subs.get(i), 4));
        }
        System.out.println("   " + line);
        System.out.println("   count: " + subs.size() + " = 2^(popcount) = "
                + (1 << Integer.bitCount(mask)));

        // why the total over all masks is 3^n, not 4^n
        int total = 0;
        for (int m = 0; m < 1 << 4; m++) {
            int s = m;
            while (true) {
                total++;
                if (s == 0) break;
                s = (s - 1) & m;
            }
        }
        System.out.println("\\nsubmask pairs for n=4: " + total + "  3^4 = " + 81);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <bitset>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string strList(const vector<string>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += "'" + xs[i] + "'";
    }
    return out + "]";
}

string bin(int n, int w) {
    string s = bitset<32>((unsigned)n).to_string();
    return s.substr(s.size() - w);
}

int main() {
    // every subset of a 3-element set
    vector<string> items = {"a", "b", "c"};
    int n = (int)items.size();
    cout << "all subsets of " << strList(items) << "\\n";
    for (int mask = 0; mask < 1 << n; mask++) {
        vector<string> chosen;
        for (int i = 0; i < n; i++) {
            if (mask & (1 << i)) chosen.push_back(items[i]);
        }
        cout << "  " << bin(mask, 3) << " -> " << strList(chosen) << "\\n";
    }

    // submask enumeration: every subset of a given mask, descending
    int mask = 0b1011;
    cout << "\\nsubmasks of " << bin(mask, 4) << "\\n";
    vector<int> subs;
    int sub = mask;
    while (true) {
        subs.push_back(sub);
        if (sub == 0) break;
        sub = (sub - 1) & mask;
    }
    cout << "   ";
    for (size_t i = 0; i < subs.size(); i++) {
        if (i) cout << " ";
        cout << bin(subs[i], 4);
    }
    cout << "\\n";
    cout << "   count: " << subs.size() << " = 2^(popcount) = "
         << (1 << bitset<32>((unsigned)mask).count()) << "\\n";

    // why the total over all masks is 3^n, not 4^n
    int total = 0;
    for (int m = 0; m < 1 << 4; m++) {
        int s = m;
        while (true) {
            total++;
            if (s == 0) break;
            s = (s - 1) & m;
        }
    }
    cout << "\\nsubmask pairs for n=4: " << total << "  3^4 = " << 81 << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn str_list(xs: &[&str]) -> String {
    let parts: Vec<String> = xs.iter().map(|s| format!("'{}'", s)).collect();
    format!("[{}]", parts.join(", "))
}

fn bin(n: u32, w: usize) -> String {
    format!("{:0width$b}", n, width = w)
}

fn main() {
    // every subset of a 3-element set
    let items = ["a", "b", "c"];
    let n = items.len();
    println!("all subsets of {}", str_list(&items));
    for mask in 0..1u32 << n {
        let chosen: Vec<&str> = items
            .iter()
            .enumerate()
            .filter(|(i, _)| mask & (1 << i) != 0)
            .map(|(_, s)| *s)
            .collect();
        println!("  {} -> {}", bin(mask, 3), str_list(&chosen));
    }

    // submask enumeration: every subset of a given mask, descending
    let mask: u32 = 0b1011;
    println!("\\nsubmasks of {}", bin(mask, 4));
    let mut subs: Vec<u32> = Vec::new();
    let mut sub = mask;
    loop {
        subs.push(sub);
        if sub == 0 {
            break;
        }
        sub = (sub - 1) & mask;
    }
    let shown: Vec<String> = subs.iter().map(|s| bin(*s, 4)).collect();
    println!("   {}", shown.join(" "));
    println!(
        "   count: {} = 2^(popcount) = {}",
        subs.len(),
        1u32 << mask.count_ones()
    );

    // why the total over all masks is 3^n, not 4^n
    let mut total = 0;
    for m in 0..1u32 << 4 {
        let mut s = m;
        loop {
            total += 1;
            if s == 0 {
                break;
            }
            s = (s - 1) & m;
        }
    }
    println!("\\nsubmask pairs for n=4: {}  3^4 = {}", total, 3i32.pow(4));
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math/bits"
	"strings"
)

func strList(xs []string) string {
	parts := make([]string, len(xs))
	for i, s := range xs {
		parts[i] = "'" + s + "'"
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func bin(n, w int) string {
	return fmt.Sprintf("%0*b", w, n)
}

func main() {
	// every subset of a 3-element set
	items := []string{"a", "b", "c"}
	n := len(items)
	fmt.Println("all subsets of", strList(items))
	for mask := 0; mask < 1<<n; mask++ {
		var chosen []string
		for i := 0; i < n; i++ {
			if mask&(1<<i) != 0 {
				chosen = append(chosen, items[i])
			}
		}
		fmt.Printf("  %s -> %s\\n", bin(mask, 3), strList(chosen))
	}

	// submask enumeration: every subset of a given mask, descending
	mask := 0b1011
	fmt.Printf("\\nsubmasks of %s\\n", bin(mask, 4))
	var subs []int
	sub := mask
	for {
		subs = append(subs, sub)
		if sub == 0 {
			break
		}
		sub = (sub - 1) & mask
	}
	shown := make([]string, len(subs))
	for i, s := range subs {
		shown[i] = bin(s, 4)
	}
	fmt.Println("  ", strings.Join(shown, " "))
	fmt.Println("   count:", len(subs), "= 2^(popcount) =", 1<<bits.OnesCount(uint(mask)))

	// why the total over all masks is 3^n, not 4^n
	total := 0
	for m := 0; m < 1<<4; m++ {
		s := m
		for {
			total++
			if s == 0 {
				break
			}
			s = (s - 1) & m
		}
	}
	fmt.Println("\\nsubmask pairs for n=4:", total, " 3^4 =", 81)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "three-to-the-n",
      heading: "Why the total is 3^n",
      body: [
        "The nested loop above looks like it should cost `2^n` masks times `2^n` submasks each — `4^n`, which for n = 20 is a trillion and hopeless. The measured answer for n = 4 is 81, which is exactly `3^n`.",
        "The counting argument is one line. A pair `(mask, submask)` is determined by deciding, for **each of the n elements independently**, one of three things: it is in the submask, or it is in the mask but not the submask, or it is in neither. Three choices, n elements, `3^n` pairs. There is no fourth option, because a submask cannot contain an element its mask does not.",
        "For n = 20 that is 3.5 billion rather than a trillion — still large, but the difference between \"tight but feasible in C++\" and \"impossible\". This bound is the reason subset-sum-over-subsets DP is a known technique rather than a curiosity.",
      ],
    },
    {
      id: "recognising",
      heading: "Recognising bitmask DP",
      body: [
        "The constraint is the giveaway, and it is unusually specific. **`n ≤ 20`** with a question about assignments, orderings, or covering — that is `2^n` states, and each state is a subset of things already used.",
        "The canonical shape is *assignment*: n tasks, n workers, a cost for each pairing, minimise the total. The state is \"which tasks are done\", the transition assigns the next worker to any remaining task, and the answer is at the full mask. Travelling salesman on 20 cities is the same skeleton with an extra dimension for the current city.",
        "The reason it works is that a subset carries all the information you need: *which* elements are used matters, and the order they were used in does not. If order does matter, a bitmask is not enough on its own.",
      ],
      pitfalls: [
        {
          title: "`for (int sub = mask; sub; sub = (sub - 1) & mask)` skips the empty set",
          body: "The idiomatic C++ one-liner tests `sub` at the top, so it stops before visiting zero. That is often what you want, and occasionally a silent bug. If the empty submask is a valid case, handle it outside the loop or restructure as the do-while shape above.",
        },
        {
          title: "`1 << n` overflows for n ≥ 31",
          body: "In Java and C++ this is an `int` shift, and `1 << 31` is negative. A problem with `n ≤ 20` never hits it, but a solution generalised carelessly will. Use `1L << n` if there is any doubt.",
        },
      ],
    },
  ],
  takeaways: [
    "Counting 0 to 2^n - 1 enumerates every subset, once each",
    "`sub = (sub - 1) & mask` walks the submasks of a mask in descending order",
    "Test for zero at the bottom of the loop or the empty submask is skipped",
    "The total submask work over all masks is 3^n, by a three-choices-per-element argument",
    "`n ≤ 20` plus assignment, ordering or covering means bitmask DP",
    "A bitmask records *which*, not *in what order*",
  ],
  status: "available",
};
