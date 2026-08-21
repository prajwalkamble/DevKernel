import type { Lesson } from "@/content/types";

export const xorLesson: Lesson = {
  id: "dsa-bits-xor",
  slug: "xor-and-the-problems-it-solves",
  moduleSlug: "bit-manipulation-and-math",
  title: "XOR, and the Problems It Solves",
  summary:
    "Three identities that look trivial and between them solve a family of problems whose optimal solutions otherwise look impossible — including finding two unpaired numbers among millions in one pass and no extra space.",
  estimatedMinutes: 30,
  objectives: [
    "State the three XOR identities and why they matter together",
    "Solve single-number and missing-number in one pass, O(1) space",
    "Split a list to find two unpaired values using one differing bit",
    "Recognise XOR as \"pairing off\" rather than as a bit operation",
  ],
  sections: [
    {
      id: "identities",
      heading: "Three identities, and what they mean together",
      body: [
        "XOR is one bit rule — *set if exactly one input is set* — and three consequences:",
        "**`a ^ a = 0`.** A value XORed with itself vanishes.",
        "**`a ^ 0 = a`.** Zero is the identity, so XORing something in and never cancelling it leaves it standing.",
        "**It is commutative and associative.** Order does not matter, at all.",
        "Put together, they say something stronger than any of them alone: **XOR over a collection cancels everything that appears an even number of times, regardless of order.** You do not have to sort, or group, or track what you have seen. Anything paired disappears; anything unpaired survives.",
        "That is the whole trick, and every problem below is an application of that one sentence.",
      ],
    },
    {
      id: "one-pass",
      heading: "The single-number family",
      body: [
        "Once you read XOR as \"pairing off\", three separate sheet problems collapse into the same loop.",
      ],
      examples: [
        {
          id: "xor-family",
          title: "One accumulator, three problems",
          lang: "python",
          code: `print("identities")
print("  a ^ a =", 5 ^ 5)
print("  a ^ 0 =", 5 ^ 0)
print("  commutative:", (3 ^ 5) ^ 7 == 3 ^ (5 ^ 7))

# single number: everything appears twice except one
a = [4, 1, 2, 1, 2]
acc = 0
for v in a:
    acc ^= v
print("\\nsingle number in", a, "->", acc)

# missing number from 0..n
nums = [3, 0, 1]
n = len(nums)
acc = n
for i, v in enumerate(nums):
    acc ^= i ^ v
print("missing from", nums, "->", acc)

# two numbers appear once, the rest twice
b = [1, 2, 1, 3, 2, 5]
x = 0
for v in b:
    x ^= v
print("\\nboth-uniques xor =", x, "=", format(x, "04b"))
bit = x & -x
print("a differing bit  =", format(bit, "04b"))
g1 = g2 = 0
for v in b:
    if v & bit:
        g1 ^= v
    else:
        g2 ^= v
print("split gives      ", sorted([g1, g2]))

# swap without a temporary
p, q = 9, 4
p ^= q
q ^= p
p ^= q
print("\\nxor swap:", p, q)`,
          output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: True

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
          explanation:
            "**Missing number** works because XORing every index together with every value pairs each present number with its own index, leaving only the index that has no value. **Two uniques** is the clever one and worth walking slowly: XOR everything and you get `a ^ b` for the two survivors, since everything else cancelled. Those two must differ somewhere — that is what makes them different numbers — so `x & -x` picks any one bit where they disagree. Partition the whole list on that bit and the two survivors are guaranteed to land in different halves, while every duplicate pair lands together in the same half and cancels. Two XOR accumulators, one pass, constant space.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const bin = (n, w) => (n >>> 0).toString(2).padStart(w, "0").slice(-w);

console.log("identities");
console.log("  a ^ a =", 5 ^ 5);
console.log("  a ^ 0 =", 5 ^ 0);
console.log("  commutative:", ((3 ^ 5) ^ 7) === (3 ^ (5 ^ 7)));

// single number: everything appears twice except one
const a = [4, 1, 2, 1, 2];
let acc = 0;
for (const v of a) acc ^= v;
console.log("\\nsingle number in", list(a), "->", acc);

// missing number from 0..n
const nums = [3, 0, 1];
const n = nums.length;
let missing = n;
for (let i = 0; i < n; i++) missing ^= i ^ nums[i];
console.log("missing from", list(nums), "->", missing);

// two numbers appear once, the rest twice
const b = [1, 2, 1, 3, 2, 5];
let x = 0;
for (const v of b) x ^= v;
console.log("\\nboth-uniques xor =", x, "=", bin(x, 4));
const bit = x & -x;
console.log("a differing bit  =", bin(bit, 4));
let g1 = 0;
let g2 = 0;
for (const v of b) {
  if (v & bit) g1 ^= v;
  else g2 ^= v;
}
console.log("split gives      ", list([g1, g2].sort((p, q) => p - q)));

// swap without a temporary
let p = 9;
let q = 4;
p ^= q;
q ^= p;
p ^= q;
console.log("\\nxor swap:", p, q);`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const bin = (n: number, w: number): string => (n >>> 0).toString(2).padStart(w, "0").slice(-w);

console.log("identities");
console.log("  a ^ a =", 5 ^ 5);
console.log("  a ^ 0 =", 5 ^ 0);
console.log("  commutative:", ((3 ^ 5) ^ 7) === (3 ^ (5 ^ 7)));

// single number: everything appears twice except one
const a: number[] = [4, 1, 2, 1, 2];
let acc = 0;
for (const v of a) acc ^= v;
console.log("\\nsingle number in", list(a), "->", acc);

// missing number from 0..n
const nums: number[] = [3, 0, 1];
const n = nums.length;
let missing = n;
for (let i = 0; i < n; i++) missing ^= i ^ nums[i];
console.log("missing from", list(nums), "->", missing);

// two numbers appear once, the rest twice
const b: number[] = [1, 2, 1, 3, 2, 5];
let x = 0;
for (const v of b) x ^= v;
console.log("\\nboth-uniques xor =", x, "=", bin(x, 4));
const bit = x & -x;
console.log("a differing bit  =", bin(bit, 4));
let g1 = 0;
let g2 = 0;
for (const v of b) {
  if (v & bit) g1 ^= v;
  else g2 ^= v;
}
console.log("split gives      ", list([g1, g2].sort((p, q) => p - q)));

// swap without a temporary
let p = 9;
let q = 4;
p ^= q;
q ^= p;
p ^= q;
console.log("\\nxor swap:", p, q);`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
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

    static String bin(int n, int w) {
        String s = Integer.toBinaryString(n);
        if (s.length() > w) s = s.substring(s.length() - w);
        return "0".repeat(w - s.length()) + s;
    }

    public static void main(String[] args) {
        System.out.println("identities");
        System.out.println("  a ^ a = " + (5 ^ 5));
        System.out.println("  a ^ 0 = " + (5 ^ 0));
        System.out.println("  commutative: " + (((3 ^ 5) ^ 7) == (3 ^ (5 ^ 7))));

        // single number: everything appears twice except one
        int[] a = {4, 1, 2, 1, 2};
        int acc = 0;
        for (int v : a) acc ^= v;
        System.out.println("\\nsingle number in " + list(a) + " -> " + acc);

        // missing number from 0..n
        int[] nums = {3, 0, 1};
        int n = nums.length;
        int missing = n;
        for (int i = 0; i < n; i++) missing ^= i ^ nums[i];
        System.out.println("missing from " + list(nums) + " -> " + missing);

        // two numbers appear once, the rest twice
        int[] b = {1, 2, 1, 3, 2, 5};
        int x = 0;
        for (int v : b) x ^= v;
        System.out.println("\\nboth-uniques xor = " + x + " = " + bin(x, 4));
        int bit = x & -x;
        System.out.println("a differing bit  = " + bin(bit, 4));
        int g1 = 0, g2 = 0;
        for (int v : b) {
            if ((v & bit) != 0) g1 ^= v;
            else g2 ^= v;
        }
        int[] pair = {Math.min(g1, g2), Math.max(g1, g2)};
        System.out.println("split gives       " + list(pair));

        // swap without a temporary
        int p = 9, q = 4;
        p ^= q;
        q ^= p;
        p ^= q;
        System.out.println("\\nxor swap: " + p + " " + q);
    }
}`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <bitset>
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

string bin(int n, int w) {
    string s = bitset<32>((unsigned)n).to_string();
    return s.substr(s.size() - w);
}

int main() {
    cout << "identities\\n";
    cout << "  a ^ a = " << (5 ^ 5) << "\\n";
    cout << "  a ^ 0 = " << (5 ^ 0) << "\\n";
    cout << "  commutative: " << boolalpha << (((3 ^ 5) ^ 7) == (3 ^ (5 ^ 7))) << "\\n";

    // single number: everything appears twice except one
    vector<int> a = {4, 1, 2, 1, 2};
    int acc = 0;
    for (int v : a) acc ^= v;
    cout << "\\nsingle number in " << list(a) << " -> " << acc << "\\n";

    // missing number from 0..n
    vector<int> nums = {3, 0, 1};
    int n = (int)nums.size();
    int missing = n;
    for (int i = 0; i < n; i++) missing ^= i ^ nums[i];
    cout << "missing from " << list(nums) << " -> " << missing << "\\n";

    // two numbers appear once, the rest twice
    vector<int> b = {1, 2, 1, 3, 2, 5};
    int x = 0;
    for (int v : b) x ^= v;
    cout << "\\nboth-uniques xor = " << x << " = " << bin(x, 4) << "\\n";
    int bit = x & -x;
    cout << "a differing bit  = " << bin(bit, 4) << "\\n";
    int g1 = 0, g2 = 0;
    for (int v : b) {
        if (v & bit) g1 ^= v;
        else g2 ^= v;
    }
    vector<int> pair = {min(g1, g2), max(g1, g2)};
    cout << "split gives       " << list(pair) << "\\n";

    // swap without a temporary
    int p = 9, q = 4;
    p ^= q;
    q ^= p;
    p ^= q;
    cout << "\\nxor swap: " << p << " " << q << "\\n";
}`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn bin(n: i32, w: usize) -> String {
    let s = format!("{:032b}", n as u32);
    s[s.len() - w..].to_string()
}

fn main() {
    println!("identities");
    println!("  a ^ a = {}", 5 ^ 5);
    println!("  a ^ 0 = {}", 5 ^ 0);
    println!("  commutative: {}", ((3 ^ 5) ^ 7) == (3 ^ (5 ^ 7)));

    // single number: everything appears twice except one
    let a = [4, 1, 2, 1, 2];
    let acc = a.iter().fold(0, |acc, v| acc ^ v);
    println!("\\nsingle number in {} -> {}", list(&a), acc);

    // missing number from 0..n
    let nums = [3, 0, 1];
    let n = nums.len() as i32;
    let mut missing = n;
    for (i, v) in nums.iter().enumerate() {
        missing ^= i as i32 ^ v;
    }
    println!("missing from {} -> {}", list(&nums), missing);

    // two numbers appear once, the rest twice
    let b = [1, 2, 1, 3, 2, 5];
    let x = b.iter().fold(0, |acc, v| acc ^ v);
    println!("\\nboth-uniques xor = {} = {}", x, bin(x, 4));
    let bit = x & x.wrapping_neg();
    println!("a differing bit  = {}", bin(bit, 4));
    let (mut g1, mut g2) = (0, 0);
    for v in b {
        if v & bit != 0 {
            g1 ^= v;
        } else {
            g2 ^= v;
        }
    }
    let mut pair = [g1, g2];
    pair.sort();
    println!("split gives       {}", list(&pair));

    // swap without a temporary
    let (mut p, mut q) = (9, 4);
    p ^= q;
    q ^= p;
    p ^= q;
    println!("\\nxor swap: {} {}", p, q);
}`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"slices"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func bin(n, w int) string {
	s := fmt.Sprintf("%032b", uint32(int32(n)))
	return s[len(s)-w:]
}

func main() {
	fmt.Println("identities")
	fmt.Println("  a ^ a =", 5^5)
	fmt.Println("  a ^ 0 =", 5^0)
	fmt.Println("  commutative:", ((3^5)^7) == (3^(5^7)))

	// single number: everything appears twice except one
	a := []int{4, 1, 2, 1, 2}
	acc := 0
	for _, v := range a {
		acc ^= v
	}
	fmt.Println("\\nsingle number in", list(a), "->", acc)

	// missing number from 0..n
	nums := []int{3, 0, 1}
	n := len(nums)
	missing := n
	for i, v := range nums {
		missing ^= i ^ v
	}
	fmt.Println("missing from", list(nums), "->", missing)

	// two numbers appear once, the rest twice
	b := []int{1, 2, 1, 3, 2, 5}
	x := 0
	for _, v := range b {
		x ^= v
	}
	fmt.Println("\\nboth-uniques xor =", x, "=", bin(x, 4))
	bit := x & -x
	fmt.Println("a differing bit  =", bin(bit, 4))
	g1, g2 := 0, 0
	for _, v := range b {
		if v&bit != 0 {
			g1 ^= v
		} else {
			g2 ^= v
		}
	}
	pair := []int{g1, g2}
	slices.Sort(pair)
	fmt.Println("split gives      ", list(pair))

	// swap without a temporary
	p, q := 9, 4
	p ^= q
	q ^= p
	p ^= q
	fmt.Println("\\nxor swap:", p, q)
}`,
              output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: true

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
            },
          ],
        },
      ],
    },
    {
      id: "against-alternatives",
      heading: "Why not a hash set, or a sum?",
      body: [
        "A `HashSet` solves single-number and missing-number too, in O(n) time — but in **O(n) space**, and with the constant factor of hashing every element. XOR is O(1) space and one instruction per element. When an interviewer says \"now do it without extra space\", XOR is the answer they are waiting for.",
        "A **sum** also works for missing-number: add up `0..n`, subtract what you have. It reads more naturally, and it has one real weakness — the sum can overflow where the XOR cannot, because XOR never produces a value wider than its inputs. For `n = 10^5` the sum is fine; for `n` near the width of the type it is not. This is the same trade the cyclic-sort lesson made, seen from the other side.",
      ],
      pitfalls: [
        {
          title: "The XOR swap is a party trick, not a technique",
          body: "`p ^= q; q ^= p; p ^= q` swaps without a temporary, and you should never write it in real code. It is slower than a temporary on any modern compiler, it is harder to read, and it silently zeroes the value if both operands are the *same variable* — `swap(a[i], a[i])` destroys the element. Know it because it gets asked; use a temporary because it works.",
        },
        {
          title: "XOR only cancels *even* counts",
          body: "\"Everything appears twice except one\" is the precondition, and it matters. If a value appears three times it survives, and if two different values each appear once you get their XOR rather than either of them. Check what the problem actually guarantees before reaching for this.",
        },
      ],
    },
  ],
  takeaways: [
    "`a ^ a = 0`, `a ^ 0 = a`, and order does not matter",
    "XOR over a collection cancels everything appearing an even number of times",
    "Single number, missing number and two-uniques are one idea in three costumes",
    "`x & -x` picks a bit where two surviving values differ, which partitions them",
    "XOR beats a sum because it cannot overflow, and beats a set because it needs no space",
    "The XOR swap is interview trivia — use a temporary",
  ],
  status: "available",
};
