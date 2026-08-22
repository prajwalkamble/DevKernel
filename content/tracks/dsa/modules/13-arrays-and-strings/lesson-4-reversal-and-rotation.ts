import type { Lesson } from "@/content/types";

export const reversalAndRotationLesson: Lesson = {
  id: "dsa-arr-rotation",
  slug: "reversal-rotation-and-the-cycles-underneath",
  moduleSlug: "arrays-and-strings",
  title: "Reversal, Rotation & the Cycles Underneath",
  summary:
    "Why three reversals rotate an array, the juggling algorithm that does it in half the writes, and the family of problems that are secretly rotations.",
  estimatedMinutes: 25,
  objectives: [
    "Normalise k before rotating, including negative and oversized values",
    "Explain why three reversals produce a rotation",
    "Derive the cycle structure of a rotation from gcd(n, k)",
    "Recognise reverse-words and is-rotation as the same idea wearing different clothes",
  ],
  sections: [
    {
      id: "recap",
      heading: "The three reversals, and the first thing to get right",
      body: [
        "Module 0 showed you that rotating an array left by k is three reversals: reverse the whole thing, then reverse the first k, then reverse the rest. This lesson asks *why*, and what else it is good for.",
        "The why is short. Rotating splits the array into two blocks, `A` and `B`, and produces `BA` from `AB`. Reversing the whole array gives `(AB)ʳ`, and reversal has the property that `(AB)ʳ = BʳAʳ` — the blocks swap places and each is individually backwards. Reversing each block in place then undoes the second half of that, leaving `BA`. Three linear passes, O(n) time, O(1) space.",
        "Before any of it, though: **normalise k**. `k` can exceed `n`, and in a left/right conversion it can go negative. `k %= n` handles the first; in Java, where `%` keeps the sign of the dividend, `k = ((k % n) + n) % n` handles both. Forgetting this is the most common way this code fails, and it fails with an index out of bounds rather than a wrong answer, so it is at least loud.",
      ],
      visual: {
        id: "rotation-visual",
        kind: "pattern",
        algorithm: "rotation",
        lockAlgorithm: true,
        title: "Three reversals, and what each one fixes",
      },
      pitfalls: [
        {
          title: "Rotating left when the problem said right",
          body: "Rotating right by k is rotating left by n − k, and the three-reversal version differs only in where the cut goes. Half the sheet's rotation problems specify right and half specify left, so decide which you are writing, check it against one small example by hand before you run anything, and say which one you implemented. A rotation that is correct in the wrong direction passes zero tests and looks like a much deeper bug than it is.",
        },
      ],
    },
    {
      id: "juggling",
      heading: "The cycles underneath",
      body: [
        "There is a second rotation algorithm, and it is worth knowing not because you will often need it but because of what it reveals.",
        "A rotation is a **permutation**: every element moves to a computable new position, `i → (i + k) mod n`. Follow that repeatedly from any starting index and you eventually come back to where you started — you have walked a *cycle*. So instead of three passes, you can walk each cycle once, carrying one held value round it.",
        "The question is how many cycles there are, and the answer is exactly **gcd(n, k)**. When n and k share no factor the whole array is one cycle; when they share a factor of 3 there are three independent cycles that never touch. This is the same fact that governs every \"step round a circle of n by k each time\" problem, and it is worth having seen it once.",
        "The payoff is that juggling does exactly n writes where the three-reversal version does about 2n.",
      ],
      examples: [
        {
          id: "juggling",
          title: "Three reversals against the cycles, with the cycles shown",
          lang: "python",
          code: `from math import gcd


def reverse(a, lo, hi):
    moves = 0
    while lo < hi:
        a[lo], a[hi] = a[hi], a[lo]
        lo += 1
        hi -= 1
        moves += 2
    return moves


def rotate_by_reversal(a, k):
    n = len(a)
    k %= n
    m = reverse(a, 0, n - 1)
    m += reverse(a, 0, k - 1)
    m += reverse(a, k, n - 1)
    return m


def rotate_by_juggling(a, k):
    """Follow each cycle once. There are exactly gcd(n, k) of them."""
    n = len(a)
    k %= n
    moves = 0
    cycles = []
    for start in range(gcd(n, k)):
        cycle = [start]
        held = a[start]
        i = start
        while True:
            j = (i - k) % n
            if j == start:
                break
            a[i] = a[j]
            moves += 1
            cycle.append(j)
            i = j
        a[i] = held
        moves += 1
        cycles.append(cycle)
    return moves, cycles


for n, k in [(7, 3), (8, 2), (6, 4), (9, 3)]:
    base = list(range(n))
    a = base.copy()
    r_moves = rotate_by_reversal(a, k)
    b = base.copy()
    j_moves, cycles = rotate_by_juggling(b, k)
    assert a == b, (n, k, a, b)
    print(f"n={n} k={k}  ->  {a}")
    print(f"    gcd(n,k)={gcd(n,k)}  cycles={cycles}")
    print(f"    reversal writes={r_moves}   juggling writes={j_moves}")`,
          output: `n=7 k=3  ->  [4, 5, 6, 0, 1, 2, 3]
    gcd(n,k)=1  cycles=[[0, 4, 1, 5, 2, 6, 3]]
    reversal writes=12   juggling writes=7
n=8 k=2  ->  [6, 7, 0, 1, 2, 3, 4, 5]
    gcd(n,k)=2  cycles=[[0, 6, 4, 2], [1, 7, 5, 3]]
    reversal writes=16   juggling writes=8
n=6 k=4  ->  [2, 3, 4, 5, 0, 1]
    gcd(n,k)=2  cycles=[[0, 2, 4], [1, 3, 5]]
    reversal writes=12   juggling writes=6
n=9 k=3  ->  [6, 7, 8, 0, 1, 2, 3, 4, 5]
    gcd(n,k)=3  cycles=[[0, 6, 3], [1, 7, 4], [2, 8, 5]]
    reversal writes=16   juggling writes=9`,
          explanation:
            "The `assert` is the point of the example as much as the numbers are: two visibly unrelated algorithms produce identical arrays on every case. Read the cycles for n = 9, k = 3 — three of them, each of length 3, and together they cover every index exactly once, which is what makes the algorithm complete. Juggling writes exactly n; reversal writes roughly 2n, since every swap is two writes and it performs about n swaps in total. **Write the three-reversal version in an interview** — it is four lines, impossible to get subtly wrong, and the constant factor is not what you are being assessed on. Know the cycle version because gcd cycles reappear.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";
const grid = (m) => "[" + m.map(list).join(", ") + "]";

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function reverse(a, lo, hi) {
  let moves = 0;
  while (lo < hi) {
    [a[lo], a[hi]] = [a[hi], a[lo]];
    lo++;
    hi--;
    moves += 2;
  }
  return moves;
}

function rotateByReversal(a, k) {
  const n = a.length;
  k %= n;
  let m = reverse(a, 0, n - 1);
  m += reverse(a, 0, k - 1);
  m += reverse(a, k, n - 1);
  return m;
}

// Follow each cycle once. There are exactly gcd(n, k) of them.
function rotateByJuggling(a, k) {
  const n = a.length;
  k %= n;
  let moves = 0;
  const cycles = [];
  for (let start = 0; start < gcd(n, k); start++) {
    const cycle = [start];
    const held = a[start];
    let i = start;
    for (;;) {
      const j = (((i - k) % n) + n) % n;
      if (j === start) break;
      a[i] = a[j];
      moves++;
      cycle.push(j);
      i = j;
    }
    a[i] = held;
    moves++;
    cycles.push(cycle);
  }
  return { moves, cycles };
}

for (const [n, k] of [[7, 3], [8, 2], [6, 4], [9, 3]]) {
  const base = Array.from({ length: n }, (_, i) => i);
  const a = [...base];
  const rMoves = rotateByReversal(a, k);
  const b = [...base];
  const { moves: jMoves, cycles } = rotateByJuggling(b, k);
  if (list(a) !== list(b)) throw new Error("the two rotations disagree");
  console.log(\`n=\${n} k=\${k}  ->  \${list(a)}\`);
  console.log(\`    gcd(n,k)=\${gcd(n, k)}  cycles=\${grid(cycles)}\`);
  console.log(\`    reversal writes=\${rMoves}   juggling writes=\${jMoves}\`);
}`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";
const grid = (m: number[][]): string => "[" + m.map(list).join(", ") + "]";

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

function reverse(a: number[], lo: number, hi: number): number {
  let moves = 0;
  while (lo < hi) {
    [a[lo], a[hi]] = [a[hi], a[lo]];
    lo++;
    hi--;
    moves += 2;
  }
  return moves;
}

function rotateByReversal(a: number[], k: number): number {
  const n = a.length;
  k %= n;
  let m = reverse(a, 0, n - 1);
  m += reverse(a, 0, k - 1);
  m += reverse(a, k, n - 1);
  return m;
}

// Follow each cycle once. There are exactly gcd(n, k) of them.
function rotateByJuggling(a: number[], k: number): { moves: number; cycles: number[][] } {
  const n = a.length;
  k %= n;
  let moves = 0;
  const cycles: number[][] = [];
  for (let start = 0; start < gcd(n, k); start++) {
    const cycle = [start];
    const held = a[start];
    let i = start;
    for (;;) {
      const j = (((i - k) % n) + n) % n;
      if (j === start) break;
      a[i] = a[j];
      moves++;
      cycle.push(j);
      i = j;
    }
    a[i] = held;
    moves++;
    cycles.push(cycle);
  }
  return { moves, cycles };
}

for (const [n, k] of [[7, 3], [8, 2], [6, 4], [9, 3]]) {
  const base = Array.from({ length: n }, (_, i) => i);
  const a = [...base];
  const rMoves = rotateByReversal(a, k);
  const b = [...base];
  const { moves: jMoves, cycles } = rotateByJuggling(b, k);
  if (list(a) !== list(b)) throw new Error("the two rotations disagree");
  console.log(\`n=\${n} k=\${k}  ->  \${list(a)}\`);
  console.log(\`    gcd(n,k)=\${gcd(n, k)}  cycles=\${grid(cycles)}\`);
  console.log(\`    reversal writes=\${rMoves}   juggling writes=\${jMoves}\`);
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static String list(int[] xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs[i]);
        }
        return sb.append("]").toString();
    }

    static String grid(List<List<Integer>> m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(list(m.get(i)));
        }
        return sb.append("]").toString();
    }

    static int gcd(int a, int b) {
        while (b != 0) {
            int t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    static int reverse(int[] a, int lo, int hi) {
        int moves = 0;
        while (lo < hi) {
            int t = a[lo];
            a[lo] = a[hi];
            a[hi] = t;
            lo++;
            hi--;
            moves += 2;
        }
        return moves;
    }

    static int rotateByReversal(int[] a, int k) {
        int n = a.length;
        k %= n;
        int m = reverse(a, 0, n - 1);
        m += reverse(a, 0, k - 1);
        m += reverse(a, k, n - 1);
        return m;
    }

    static List<List<Integer>> cycles;

    /** Follow each cycle once. There are exactly gcd(n, k) of them. */
    static int rotateByJuggling(int[] a, int k) {
        int n = a.length;
        k %= n;
        int moves = 0;
        cycles = new ArrayList<>();
        for (int start = 0; start < gcd(n, k); start++) {
            List<Integer> cycle = new ArrayList<>(List.of(start));
            int held = a[start];
            int i = start;
            while (true) {
                int j = ((i - k) % n + n) % n;
                if (j == start) break;
                a[i] = a[j];
                moves++;
                cycle.add(j);
                i = j;
            }
            a[i] = held;
            moves++;
            cycles.add(cycle);
        }
        return moves;
    }

    public static void main(String[] args) {
        int[][] params = {{7, 3}, {8, 2}, {6, 4}, {9, 3}};
        for (int[] p : params) {
            int n = p[0], k = p[1];
            int[] base = new int[n];
            for (int i = 0; i < n; i++) base[i] = i;
            int[] a = base.clone();
            int rMoves = rotateByReversal(a, k);
            int[] b = base.clone();
            int jMoves = rotateByJuggling(b, k);
            if (!Arrays.equals(a, b)) throw new AssertionError("the two rotations disagree");
            System.out.println("n=" + n + " k=" + k + "  ->  " + list(a));
            System.out.println("    gcd(n,k)=" + gcd(n, k) + "  cycles=" + grid(cycles));
            System.out.println("    reversal writes=" + rMoves + "   juggling writes=" + jMoves);
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <numeric>
#include <stdexcept>
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

string grid(const vector<vector<int>>& m) {
    string out = "[";
    for (size_t i = 0; i < m.size(); i++) {
        if (i) out += ", ";
        out += list(m[i]);
    }
    return out + "]";
}

int reverse_(vector<int>& a, int lo, int hi) {
    int moves = 0;
    while (lo < hi) {
        swap(a[lo], a[hi]);
        lo++;
        hi--;
        moves += 2;
    }
    return moves;
}

int rotateByReversal(vector<int>& a, int k) {
    int n = (int)a.size();
    k %= n;
    int m = reverse_(a, 0, n - 1);
    m += reverse_(a, 0, k - 1);
    m += reverse_(a, k, n - 1);
    return m;
}

// Follow each cycle once. There are exactly gcd(n, k) of them.
int rotateByJuggling(vector<int>& a, int k, vector<vector<int>>& cycles) {
    int n = (int)a.size();
    k %= n;
    int moves = 0;
    cycles.clear();
    for (int start = 0; start < gcd(n, k); start++) {
        vector<int> cycle = {start};
        int held = a[start];
        int i = start;
        while (true) {
            int j = ((i - k) % n + n) % n;
            if (j == start) break;
            a[i] = a[j];
            moves++;
            cycle.push_back(j);
            i = j;
        }
        a[i] = held;
        moves++;
        cycles.push_back(cycle);
    }
    return moves;
}

int main() {
    for (auto [n, k] : vector<pair<int, int>>{{7, 3}, {8, 2}, {6, 4}, {9, 3}}) {
        vector<int> base(n);
        for (int i = 0; i < n; i++) base[i] = i;
        vector<int> a = base;
        int rMoves = rotateByReversal(a, k);
        vector<int> b = base;
        vector<vector<int>> cycles;
        int jMoves = rotateByJuggling(b, k, cycles);
        if (a != b) throw runtime_error("the two rotations disagree");
        cout << "n=" << n << " k=" << k << "  ->  " << list(a) << "\\n";
        cout << "    gcd(n,k)=" << gcd(n, k) << "  cycles=" << grid(cycles) << "\\n";
        cout << "    reversal writes=" << rMoves << "   juggling writes=" << jMoves << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn grid(m: &[Vec<i32>]) -> String {
    let parts: Vec<String> = m.iter().map(|r| list(r)).collect();
    format!("[{}]", parts.join(", "))
}

fn gcd(mut a: i32, mut b: i32) -> i32 {
    while b != 0 {
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

fn reverse(a: &mut [i32], mut lo: i32, mut hi: i32) -> i32 {
    let mut moves = 0;
    while lo < hi {
        a.swap(lo as usize, hi as usize);
        lo += 1;
        hi -= 1;
        moves += 2;
    }
    moves
}

fn rotate_by_reversal(a: &mut [i32], k: i32) -> i32 {
    let n = a.len() as i32;
    let k = k % n;
    let mut m = reverse(a, 0, n - 1);
    m += reverse(a, 0, k - 1);
    m += reverse(a, k, n - 1);
    m
}

/// Follow each cycle once. There are exactly gcd(n, k) of them.
fn rotate_by_juggling(a: &mut [i32], k: i32) -> (i32, Vec<Vec<i32>>) {
    let n = a.len() as i32;
    let k = k % n;
    let mut moves = 0;
    let mut cycles = Vec::new();
    for start in 0..gcd(n, k) {
        let mut cycle = vec![start];
        let held = a[start as usize];
        let mut i = start;
        loop {
            let j = ((i - k) % n + n) % n;
            if j == start {
                break;
            }
            a[i as usize] = a[j as usize];
            moves += 1;
            cycle.push(j);
            i = j;
        }
        a[i as usize] = held;
        moves += 1;
        cycles.push(cycle);
    }
    (moves, cycles)
}

fn main() {
    for (n, k) in [(7, 3), (8, 2), (6, 4), (9, 3)] {
        let base: Vec<i32> = (0..n).collect();
        let mut a = base.clone();
        let r_moves = rotate_by_reversal(&mut a, k);
        let mut b = base.clone();
        let (j_moves, cycles) = rotate_by_juggling(&mut b, k);
        assert_eq!(a, b, "the two rotations disagree");
        println!("n={} k={}  ->  {}", n, k, list(&a));
        println!("    gcd(n,k)={}  cycles={}", gcd(n, k), grid(&cycles));
        println!("    reversal writes={}   juggling writes={}", r_moves, j_moves);
    }
}`,
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

func grid(m [][]int) string {
	parts := make([]string, len(m))
	for i, r := range m {
		parts[i] = list(r)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func gcd(a, b int) int {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func reverse(a []int, lo, hi int) int {
	moves := 0
	for lo < hi {
		a[lo], a[hi] = a[hi], a[lo]
		lo++
		hi--
		moves += 2
	}
	return moves
}

func rotateByReversal(a []int, k int) int {
	n := len(a)
	k %= n
	m := reverse(a, 0, n-1)
	m += reverse(a, 0, k-1)
	m += reverse(a, k, n-1)
	return m
}

// Follow each cycle once. There are exactly gcd(n, k) of them.
func rotateByJuggling(a []int, k int) (int, [][]int) {
	n := len(a)
	k %= n
	moves := 0
	var cycles [][]int
	for start := 0; start < gcd(n, k); start++ {
		cycle := []int{start}
		held := a[start]
		i := start
		for {
			j := ((i-k)%n + n) % n
			if j == start {
				break
			}
			a[i] = a[j]
			moves++
			cycle = append(cycle, j)
			i = j
		}
		a[i] = held
		moves++
		cycles = append(cycles, cycle)
	}
	return moves, cycles
}

func main() {
	for _, p := range [][2]int{{7, 3}, {8, 2}, {6, 4}, {9, 3}} {
		n, k := p[0], p[1]
		base := make([]int, n)
		for i := range base {
			base[i] = i
		}
		a := slices.Clone(base)
		rMoves := rotateByReversal(a, k)
		b := slices.Clone(base)
		jMoves, cycles := rotateByJuggling(b, k)
		if !slices.Equal(a, b) {
			panic("the two rotations disagree")
		}
		fmt.Printf("n=%d k=%d  ->  %s\\n", n, k, list(a))
		fmt.Printf("    gcd(n,k)=%d  cycles=%s\\n", gcd(n, k), grid(cycles))
		fmt.Printf("    reversal writes=%d   juggling writes=%d\\n", rMoves, jMoves)
	}
}`,
            },
          ],
        },
      ],
    },
    {
      id: "reverse-words",
      heading: "The same trick with more cuts",
      body: [
        "Once the identity `(AB)ʳ = BʳAʳ` is in your hands, a second problem falls out of it immediately.",
        "**Reverse the order of the words in a sentence, in place.** Reversing the whole string puts the words in the right order and each word backwards. Reversing each word individually fixes the second problem without touching the first. Two passes, no extra array.",
        "It is the rotation trick with many cuts rather than one, and recognising that is the difference between remembering two tricks and understanding one.",
      ],
      examples: [
        {
          id: "reverse-words",
          title: "Reverse the words, keep the letters",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static void reverse(char[] a, int lo, int hi) {
        while (lo < hi) {
            char t = a[lo]; a[lo] = a[hi]; a[hi] = t;
            lo++; hi--;
        }
    }

    static String reverseWords(String s) {
        char[] a = s.toCharArray();
        reverse(a, 0, a.length - 1);
        System.out.println("  after reversing everything : \\"" + new String(a) + "\\"");
        int start = 0;
        for (int i = 0; i <= a.length; i++) {
            if (i == a.length || a[i] == ' ') {
                reverse(a, start, i - 1);
                start = i + 1;
            }
        }
        return new String(a);
    }

    public static void main(String[] args) {
        String s = "the sky is blue";
        System.out.println("input                      : \\"" + s + "\\"");
        String out = reverseWords(s);
        System.out.println("  after reversing each word  : \\"" + out + "\\"");
        System.out.println();
        System.out.println("rotation is the same trick with one cut instead of many");
    }
}`,
          output: `input                      : "the sky is blue"
  after reversing everything : "eulb si yks eht"
  after reversing each word  : "blue is sky the"

rotation is the same trick with one cut instead of many`,
          explanation:
            "The loop condition is `i <= a.length` rather than `<`, which is deliberate: the final word has no space after it, so the loop needs one extra iteration to flush it. That off-by-one *in the other direction* — running one past the end on purpose, guarded by the `i == a.length` check before the array access — is a small idiom worth recognising, because the alternative is duplicating the reversal call after the loop. Note that this version assumes single spaces; the harder variant that collapses runs of spaces is the read-and-write pointer from the previous lesson layered on top.",
          alternates: [
            {
              lang: "python",
              code: `def reverse(a, lo, hi):
    while lo < hi:
        a[lo], a[hi] = a[hi], a[lo]
        lo += 1
        hi -= 1


def reverse_words(s):
    a = list(s)
    reverse(a, 0, len(a) - 1)
    print('  after reversing everything : "' + "".join(a) + '"')
    start = 0
    for i in range(len(a) + 1):
        if i == len(a) or a[i] == ' ':
            reverse(a, start, i - 1)
            start = i + 1
    return "".join(a)


s = "the sky is blue"
print('input                      : "' + s + '"')
out = reverse_words(s)
print('  after reversing each word  : "' + out + '"')
print()
print("rotation is the same trick with one cut instead of many")`,
            },
            {
              lang: "javascript",
              code: `function reverse(a, lo, hi) {
  while (lo < hi) {
    const t = a[lo];
    a[lo] = a[hi];
    a[hi] = t;
    lo++;
    hi--;
  }
}

function reverseWords(s) {
  const a = [...s];
  reverse(a, 0, a.length - 1);
  console.log('  after reversing everything : "' + a.join("") + '"');
  let start = 0;
  for (let i = 0; i <= a.length; i++) {
    if (i === a.length || a[i] === " ") {
      reverse(a, start, i - 1);
      start = i + 1;
    }
  }
  return a.join("");
}

const s = "the sky is blue";
console.log('input                      : "' + s + '"');
const out = reverseWords(s);
console.log('  after reversing each word  : "' + out + '"');
console.log();
console.log("rotation is the same trick with one cut instead of many");`,
            },
            {
              lang: "typescript",
              code: `function reverse(a: string[], lo: number, hi: number): void {
  while (lo < hi) {
    const t = a[lo];
    a[lo] = a[hi];
    a[hi] = t;
    lo++;
    hi--;
  }
}

function reverseWords(s: string): string {
  const a = [...s];
  reverse(a, 0, a.length - 1);
  console.log('  after reversing everything : "' + a.join("") + '"');
  let start = 0;
  for (let i = 0; i <= a.length; i++) {
    if (i === a.length || a[i] === " ") {
      reverse(a, start, i - 1);
      start = i + 1;
    }
  }
  return a.join("");
}

const s = "the sky is blue";
console.log('input                      : "' + s + '"');
const out = reverseWords(s);
console.log('  after reversing each word  : "' + out + '"');
console.log();
console.log("rotation is the same trick with one cut instead of many");`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <string>

static void reverse(std::string& a, int lo, int hi) {
    while (lo < hi) {
        char t = a[lo];
        a[lo] = a[hi];
        a[hi] = t;
        lo++;
        hi--;
    }
}

static std::string reverse_words(std::string s) {
    int n = static_cast<int>(s.size());
    reverse(s, 0, n - 1);
    std::cout << "  after reversing everything : \\"" << s << "\\"\\n";
    int start = 0;
    for (int i = 0; i <= n; i++) {
        if (i == n || s[i] == ' ') {
            reverse(s, start, i - 1);
            start = i + 1;
        }
    }
    return s;
}

int main() {
    std::string s = "the sky is blue";
    std::cout << "input                      : \\"" << s << "\\"\\n";
    // The call has to finish before the label is streamed: \`<<\` evaluates its
    // operands left to right, so writing them in one statement would put this
    // line above the trace reverse_words prints itself.
    std::string out = reverse_words(s);
    std::cout << "  after reversing each word  : \\"" << out << "\\"\\n";
    std::cout << '\\n';
    std::cout << "rotation is the same trick with one cut instead of many\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn reverse(a: &mut [char], mut lo: usize, hi: isize) {
    let mut hi = hi;
    while (lo as isize) < hi {
        a.swap(lo, hi as usize);
        lo += 1;
        hi -= 1;
    }
}

fn reverse_words(s: &str) -> String {
    // A Vec<char>, not the &str: a Rust string is UTF-8 bytes and cannot be
    // indexed or swapped in place by character position.
    let mut a: Vec<char> = s.chars().collect();
    let n = a.len();
    reverse(&mut a, 0, n as isize - 1);
    println!("  after reversing everything : \\"{}\\"", a.iter().collect::<String>());
    let mut start = 0usize;
    for i in 0..=n {
        if i == n || a[i] == ' ' {
            reverse(&mut a, start, i as isize - 1);
            start = i + 1;
        }
    }
    a.into_iter().collect()
}

fn main() {
    let s = "the sky is blue";
    println!("input                      : \\"{}\\"", s);
    let out = reverse_words(s);
    println!("  after reversing each word  : \\"{}\\"", out);
    println!();
    println!("rotation is the same trick with one cut instead of many");
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

func reverse(a []byte, lo, hi int) {
	for lo < hi {
		a[lo], a[hi] = a[hi], a[lo]
		lo++
		hi--
	}
}

func reverseWords(s string) string {
	a := []byte(s)
	reverse(a, 0, len(a)-1)
	fmt.Printf("  after reversing everything : %q\\n", string(a))
	start := 0
	for i := 0; i <= len(a); i++ {
		if i == len(a) || a[i] == ' ' {
			reverse(a, start, i-1)
			start = i + 1
		}
	}
	return string(a)
}

func main() {
	s := "the sky is blue"
	fmt.Printf("input                      : %q\\n", s)
	out := reverseWords(s)
	fmt.Printf("  after reversing each word  : %q\\n", out)
	fmt.Println()
	fmt.Println("rotation is the same trick with one cut instead of many")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "is-rotation",
      heading: "Is one string a rotation of another?",
      body: [
        "The last member of the family, and the one that looks like a puzzle until you see it.",
        "**Every rotation of `s` appears as a substring of `s + s`, and nothing else of that length does.** So `t` is a rotation of `s` exactly when the lengths match and `t` occurs in `s + s`. One line, and the index where it occurs is the rotation offset.",
        "The intuition: concatenating a string to itself lays every rotation out end to end with each one starting one position later. Reading a window of length n starting at offset i gives you precisely the rotation by i.",
        "The length check is not decoration — without it, `\"abc\"` would count as a rotation of `\"abcabc\"` because it certainly occurs inside `\"abcabcabcabc\"`.",
      ],
      examples: [
        {
          id: "is-rotation",
          title: "Rotation by concatenation",
          lang: "python",
          code: `def is_rotation(s, t):
    """Every rotation of s is a substring of s + s, and nothing else of that length is."""
    return len(s) == len(t) and t in s + s


def rotation_offset(s, t):
    if not is_rotation(s, t):
        return -1
    return (s + s).index(t)


pairs = [
    ("abcde", "cdeab"),
    ("abcde", "abcde"),
    ("abcde", "abced"),
    ("aaab", "abaa"),
    ("abc", "abcd"),
]

print(f"{'s':<8} {'t':<8} {'rotation?':>10} {'offset':>8}   s+s")
print("-" * 52)
for s, t in pairs:
    print(f"{s:<8} {t:<8} {str(is_rotation(s, t)):>10} {rotation_offset(s, t):>8}   {s + s}")

word = "abcde"
print()
print(f"every rotation of '{word}' lives inside '{word + word}':")
for i in range(len(word)):
    print(f"  offset {i}: {word[i:] + word[:i]}")`,
          output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          True        2   abcdeabcde
abcde    abcde          True        0   abcdeabcde
abcde    abced         False       -1   abcdeabcde
aaab     abaa           True        2   aaabaaab
abc      abcd          False       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
          explanation:
            "The fourth row is the one that keeps you honest: `\"abaa\"` really is a rotation of `\"aaab\"`, and a hand-written check that compares first characters or counts letters would get the third row (`\"abced\"`, an anagram but not a rotation) wrong in the other direction. The cost depends on the substring search — O(n²) with a naive scan, O(n) if you use KMP, which is a perfectly good thing to mention as an aside without implementing it. `s + s` allocates 2n characters, so this is O(n) space rather than O(1); if the interviewer asks for constant space, the answer is to compare `t` against `s` starting at each offset with modular indexing.",
          alternates: [
            {
              lang: "javascript",
              code: `const padL = (s, w) => String(s).padStart(w);
const padR = (s, w) => String(s).padEnd(w);

// Every rotation of s is a substring of s + s, and nothing else of that length is.
function isRotation(s, t) {
  return s.length === t.length && (s + s).includes(t);
}

function rotationOffset(s, t) {
  if (!isRotation(s, t)) return -1;
  return (s + s).indexOf(t);
}

const pairs = [
  ["abcde", "cdeab"],
  ["abcde", "abcde"],
  ["abcde", "abced"],
  ["aaab", "abaa"],
  ["abc", "abcd"],
];

console.log(\`\${padR("s", 8)} \${padR("t", 8)} \${padL("rotation?", 10)} \${padL("offset", 8)}   s+s\`);
console.log("-".repeat(52));
for (const [s, t] of pairs) {
  console.log(
    \`\${padR(s, 8)} \${padR(t, 8)} \${padL(isRotation(s, t), 10)} \${padL(rotationOffset(s, t), 8)}   \${s + s}\`
  );
}

const word = "abcde";
console.log();
console.log(\`every rotation of '\${word}' lives inside '\${word + word}':\`);
for (let i = 0; i < word.length; i++) {
  console.log(\`  offset \${i}: \${word.slice(i) + word.slice(0, i)}\`);
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
            {
              lang: "typescript",
              code: `const padL = (s: string | number | boolean, w: number): string => String(s).padStart(w);
const padR = (s: string, w: number): string => String(s).padEnd(w);

// Every rotation of s is a substring of s + s, and nothing else of that length is.
function isRotation(s: string, t: string): boolean {
  return s.length === t.length && (s + s).includes(t);
}

function rotationOffset(s: string, t: string): number {
  if (!isRotation(s, t)) return -1;
  return (s + s).indexOf(t);
}

const pairs: [string, string][] = [
  ["abcde", "cdeab"],
  ["abcde", "abcde"],
  ["abcde", "abced"],
  ["aaab", "abaa"],
  ["abc", "abcd"],
];

console.log(\`\${padR("s", 8)} \${padR("t", 8)} \${padL("rotation?", 10)} \${padL("offset", 8)}   s+s\`);
console.log("-".repeat(52));
for (const [s, t] of pairs) {
  console.log(
    \`\${padR(s, 8)} \${padR(t, 8)} \${padL(isRotation(s, t), 10)} \${padL(rotationOffset(s, t), 8)}   \${s + s}\`
  );
}

const word = "abcde";
console.log();
console.log(\`every rotation of '\${word}' lives inside '\${word + word}':\`);
for (let i = 0; i < word.length; i++) {
  console.log(\`  offset \${i}: \${word.slice(i) + word.slice(0, i)}\`);
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
            {
              lang: "java",
              code: `public class Main {
    /** Every rotation of s is a substring of s + s, and nothing else of that length is. */
    static boolean isRotation(String s, String t) {
        return s.length() == t.length() && (s + s).contains(t);
    }

    static int rotationOffset(String s, String t) {
        if (!isRotation(s, t)) return -1;
        return (s + s).indexOf(t);
    }

    public static void main(String[] args) {
        String[][] pairs = {{"abcde", "cdeab"}, {"abcde", "abcde"},
                            {"abcde", "abced"}, {"aaab", "abaa"}, {"abc", "abcd"}};

        System.out.printf("%-8s %-8s %10s %8s   s+s%n", "s", "t", "rotation?", "offset");
        System.out.println("-".repeat(52));
        for (String[] p : pairs) {
            String s = p[0], t = p[1];
            System.out.printf("%-8s %-8s %10b %8d   %s%n",
                    s, t, isRotation(s, t), rotationOffset(s, t), s + s);
        }

        String word = "abcde";
        System.out.println();
        System.out.println("every rotation of '" + word + "' lives inside '" + word + word + "':");
        for (int i = 0; i < word.length(); i++) {
            System.out.println("  offset " + i + ": " + word.substring(i) + word.substring(0, i));
        }
    }
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Every rotation of s is a substring of s + s, and nothing else of that length is.
bool isRotation(const string& s, const string& t) {
    return s.size() == t.size() && (s + s).find(t) != string::npos;
}

int rotationOffset(const string& s, const string& t) {
    if (!isRotation(s, t)) return -1;
    return (int)(s + s).find(t);
}

int main() {
    vector<pair<string, string>> pairs = {
        {"abcde", "cdeab"}, {"abcde", "abcde"}, {"abcde", "abced"},
        {"aaab", "abaa"}, {"abc", "abcd"}};

    cout << left << setw(8) << "s" << " " << setw(8) << "t" << " " << right
         << setw(10) << "rotation?" << " " << setw(8) << "offset" << "   s+s\\n";
    cout << string(52, '-') << "\\n";
    for (const auto& [s, t] : pairs) {
        cout << left << setw(8) << s << " " << setw(8) << t << " " << right
             << setw(10) << boolalpha << isRotation(s, t) << " "
             << setw(8) << rotationOffset(s, t) << "   " << s + s << "\\n";
    }

    string word = "abcde";
    cout << "\\n";
    cout << "every rotation of '" << word << "' lives inside '" << word + word << "':\\n";
    for (size_t i = 0; i < word.size(); i++) {
        cout << "  offset " << i << ": " << word.substr(i) + word.substr(0, i) << "\\n";
    }
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
            {
              lang: "rust",
              code: `/// Every rotation of s is a substring of s + s, and nothing else of that length is.
fn is_rotation(s: &str, t: &str) -> bool {
    s.len() == t.len() && format!("{}{}", s, s).contains(t)
}

fn rotation_offset(s: &str, t: &str) -> i32 {
    if !is_rotation(s, t) {
        return -1;
    }
    format!("{}{}", s, s).find(t).unwrap() as i32
}

fn main() {
    let pairs = [
        ("abcde", "cdeab"),
        ("abcde", "abcde"),
        ("abcde", "abced"),
        ("aaab", "abaa"),
        ("abc", "abcd"),
    ];

    println!("{:<8} {:<8} {:>10} {:>8}   s+s", "s", "t", "rotation?", "offset");
    println!("{}", "-".repeat(52));
    for (s, t) in pairs {
        println!(
            "{:<8} {:<8} {:>10} {:>8}   {}",
            s,
            t,
            is_rotation(s, t),
            rotation_offset(s, t),
            format!("{}{}", s, s)
        );
    }

    let word = "abcde";
    println!();
    println!("every rotation of '{}' lives inside '{}{}':", word, word, word);
    for i in 0..word.len() {
        println!("  offset {}: {}{}", i, &word[i..], &word[..i]);
    }
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

// Every rotation of s is a substring of s + s, and nothing else of that length is.
func isRotation(s, t string) bool {
	return len(s) == len(t) && strings.Contains(s+s, t)
}

func rotationOffset(s, t string) int {
	if !isRotation(s, t) {
		return -1
	}
	return strings.Index(s+s, t)
}

func main() {
	pairs := [][2]string{{"abcde", "cdeab"}, {"abcde", "abcde"},
		{"abcde", "abced"}, {"aaab", "abaa"}, {"abc", "abcd"}}

	fmt.Printf("%-8s %-8s %10s %8s   s+s\\n", "s", "t", "rotation?", "offset")
	fmt.Println(strings.Repeat("-", 52))
	for _, p := range pairs {
		s, t := p[0], p[1]
		fmt.Printf("%-8s %-8s %10t %8d   %s\\n", s, t, isRotation(s, t), rotationOffset(s, t), s+s)
	}

	word := "abcde"
	fmt.Println()
	fmt.Printf("every rotation of '%s' lives inside '%s':\\n", word, word+word)
	for i := 0; i < len(word); i++ {
		fmt.Printf("  offset %d: %s%s\\n", i, word[i:], word[:i])
	}
}`,
              output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          true        2   abcdeabcde
abcde    abcde          true        0   abcdeabcde
abcde    abced         false       -1   abcdeabcde
aaab     abaa           true        2   aaabaaab
abc      abcd          false       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Rotate an array left by k in place. Why does the three-reversal trick work?",
      answer:
        "Because reversal distributes over concatenation backwards: `(AB)ʳ = BʳAʳ`. Rotating turns `AB` into `BA`, so reverse the whole array to get `BʳAʳ`, then reverse each of the two blocks in place to recover `B` and `A` in that order. Three linear passes, O(n) time and O(1) space. The thing to get right before any of it is normalising k with `k %= n`, and in Java `((k % n) + n) % n` so a negative k behaves, since `%` there keeps the sign of the dividend.",
    },
    {
      question: "Is there a way to rotate with fewer writes, and how many cycles does it have?",
      answer:
        "Yes — the juggling algorithm treats the rotation as the permutation i → (i + k) mod n and walks each cycle once, carrying one held value round it. The number of cycles is exactly gcd(n, k): coprime n and k give a single cycle covering the whole array, and a shared factor of 3 gives three independent ones. It does exactly n writes against roughly 2n for the three reversals. In an interview I would still write the reversal version, because it is four lines and hard to get subtly wrong, and mention this one — the constant factor is not what is being assessed.",
    },
    {
      question: "How would you check whether one string is a rotation of another?",
      answer:
        "Check the lengths match, then check whether t occurs as a substring of s + s. Concatenating s to itself lays out every rotation end to end, each starting one position later, so the window of length n at offset i is exactly the rotation by i — and the index of the match is the offset. The length check matters: without it \"abc\" would count as a rotation of \"abcabc\". It is O(n) space for the doubled string and the time depends on the substring search, naive O(n²) or O(n) with KMP.",
    },
  ],
  takeaways: [
    "Normalise first: `k %= n`, and `((k % n) + n) % n` in Java for negatives",
    "Three reversals work because (AB)ʳ = BʳAʳ",
    "Rotating right by k is rotating left by n − k — decide which you are writing",
    "A rotation is the permutation i → (i + k) mod n, made of exactly gcd(n, k) cycles",
    "Juggling costs n writes; three reversals cost about 2n — write the reversals",
    "Reverse-the-words is the same identity with many cuts instead of one",
    "Every rotation of s is a substring of s + s, and the index is the offset",
    "Check the lengths, or \"abc\" is a rotation of \"abcabc\"",
  ],
  status: "available",
};
