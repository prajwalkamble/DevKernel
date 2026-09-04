import type { Lesson } from "@/content/types";

export const twoPreconditionsLesson: Lesson = {
  id: "dsa-dp-two-preconditions",
  slug: "the-two-preconditions",
  moduleSlug: "dynamic-programming-foundations",
  title: "The Two Preconditions",
  summary:
    "Dynamic programming is not a technique you reach for but a diagnosis you make about a recursion you already have. There are exactly two things to check, one of them measurable in six lines and the other the reason people write fast programs that print wrong answers.",
  estimatedMinutes: 35,
  objectives: [
    "Measure overlap rather than asserting it, by counting distinct subproblems against total calls",
    "State what optimal substructure requires, and recognise a sub-answer that has forgotten too much",
    "Tell dynamic programming apart from divide and conquer by a property you can instrument",
    "Price a dynamic program from its state space before writing any of it",
  ],
  sections: [
    {
      id: "the-diagnosis",
      heading: "Dynamic programming is a diagnosis, not a technique",
      body: [
        "Dynamic programming has a reputation as the hard one, and most of that reputation comes from how it is usually taught: as a bag of tricks. A table appears, a loop runs in a particular direction, a recurrence is produced from nowhere and turns out to be right. Taught that way it is twenty unrelated solutions, and the twenty-first problem is as hard as the first was.",
        "It is not a bag of tricks. It is a diagnosis you make about a recursion you have already written, followed by a repair that is close to mechanical once the diagnosis is right. This module is built in that order, and this lesson is the diagnosis.",
        "There are exactly two conditions. A problem yields to dynamic programming when its recursion asks the same question more than once \u2014 **overlapping subproblems** \u2014 and when the best answer to the whole is assembled out of best answers to the parts \u2014 **optimal substructure**. Miss the first and there is nothing to save. Miss the second and saving does not help, because what you cached is an answer to a question that will not compose.",
        "Start with overlap, because it is the one you can measure rather than argue about. Give every call a name, count how many times each name is asked for, and the property stops being a word and becomes a number.",
      ],
      examples: [
        {
          id: "overlap-census",
          title: "Counting how often the same question is asked",
          lang: "python",
          code: `# The cheapest possible demonstration of the property dynamic programming
# exists to exploit: a recursion that asks the same question over and over, and
# answers it from scratch every single time.

calls = {}


def fib(n):
    calls[n] = calls.get(n, 0) + 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(f"{'n':>3}{'fib(n)':>10}{'calls':>12}{'distinct':>10}{'calls each':>12}")
for n in (5, 10, 15, 20, 25, 30):
    calls.clear()
    value = fib(n)
    total = sum(calls.values())
    distinct = len(calls)
    print(f"{n:>3}{value:>10}{total:>12}{distinct:>10}{total // distinct:>12}")
print()

# The waste is not spread evenly. Print how often each smaller value is asked
# for while computing fib(20).
calls.clear()
fib(20)
print("while computing fib(20), how many times each value is asked for:")
print("  k     " + "".join(f"{k:>8}" for k in range(0, 21, 4)))
print("  calls " + "".join(f"{calls.get(k, 0):>8}" for k in range(0, 21, 4)))
print()

# Those counts are not arbitrary. The number of calls to fib(k) made while
# computing fib(n) is itself a Fibonacci number, which is why the total is
# exponential: the recursion's cost has the same growth as its answer.
table = [0, 1]
while len(table) < 40:
    table.append(table[-1] + table[-2])

ok = all(calls.get(k, 0) == table[20 - k + 1] for k in range(1, 21))
print(f"calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: {'yes' if ok else 'no'}")
print(f"total calls for fib(20) is {sum(calls.values())}, and 2*fib(21)-1 is {2 * table[21] - 1}")
`,
          output: `  n    fib(n)       calls  distinct  calls each
  5         5          15         6           2
 10        55         177        11          16
 15       610        1973        16         123
 20      6765       21891        21        1042
 25     75025      242785        26        9337
 30    832040     2692537        31       86856

while computing fib(20), how many times each value is asked for:
  k            0       4       8      12      16      20
  calls     4181    1597     233      34       5       1

calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: yes
total calls for fib(20) is 21891, and 2*fib(21)-1 is 21891`,
          explanation:
            "The recursion is the ordinary one; the only addition is a counter per argument. `distinct` is how many different questions were ever asked, and `calls each` is how many times each was asked on average. The last two lines check a claim rather than stating it: the number of calls to fib(k) inside fib(n) is fib(n-k+1), so the total is 2*fib(n+1)-1 and the cost of the recursion grows exactly as fast as its answer.",
          alternates: [
            {
              lang: "javascript",
              code: `// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.

let calls = new Array(64).fill(0);

function fib(n) {
  calls[n]++;
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

const pad = (value, width) => String(value).padStart(width);

console.log(pad("n", 3) + pad("fib(n)", 10) + pad("calls", 12) + pad("distinct", 10) + pad("calls each", 12));
for (const n of [5, 10, 15, 20, 25, 30]) {
  calls = new Array(64).fill(0);
  const value = fib(n);
  const total = calls.reduce((sum, c) => sum + c, 0);
  const distinct = calls.filter((c) => c > 0).length;
  console.log(
    pad(n, 3) + pad(value, 10) + pad(total, 12) + pad(distinct, 10) +
      pad(Math.floor(total / distinct), 12)
  );
}
console.log();

// The waste is not spread evenly. Print how often each smaller value is asked
// for while computing fib(20).
calls = new Array(64).fill(0);
fib(20);
console.log("while computing fib(20), how many times each value is asked for:");
let ks = "  k     ";
let cs = "  calls ";
for (let k = 0; k <= 20; k += 4) {
  ks += pad(k, 8);
  cs += pad(calls[k], 8);
}
console.log(ks);
console.log(cs);
console.log();

// Those counts are not arbitrary. The number of calls to fib(k) made while
// computing fib(n) is itself a Fibonacci number, which is why the total is
// exponential: the recursion's cost grows like its answer.
const table = new Array(40).fill(0);
table[1] = 1;
for (let i = 2; i < 40; i++) table[i] = table[i - 1] + table[i - 2];

let ok = true;
for (let k = 1; k <= 20; k++) if (calls[k] !== table[20 - k + 1]) ok = false;
console.log(\`calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: \${ok ? "yes" : "no"}\`);

const total = calls.reduce((sum, c) => sum + c, 0);
console.log(\`total calls for fib(20) is \${total}, and 2*fib(21)-1 is \${2 * table[21] - 1}\`);
`,
            },
            {
              lang: "typescript",
              code: `// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.

let calls: number[] = new Array(64).fill(0);

function fib(n: number): number {
  calls[n]++;
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

const pad = (value: string | number, width: number): string => String(value).padStart(width);

console.log(pad("n", 3) + pad("fib(n)", 10) + pad("calls", 12) + pad("distinct", 10) + pad("calls each", 12));
for (const n of [5, 10, 15, 20, 25, 30]) {
  calls = new Array(64).fill(0);
  const value = fib(n);
  const total = calls.reduce((sum, c) => sum + c, 0);
  const distinct = calls.filter((c) => c > 0).length;
  console.log(
    pad(n, 3) + pad(value, 10) + pad(total, 12) + pad(distinct, 10) +
      pad(Math.floor(total / distinct), 12)
  );
}
console.log();

// The waste is not spread evenly. Print how often each smaller value is asked
// for while computing fib(20).
calls = new Array(64).fill(0);
fib(20);
console.log("while computing fib(20), how many times each value is asked for:");
let ks = "  k     ";
let cs = "  calls ";
for (let k = 0; k <= 20; k += 4) {
  ks += pad(k, 8);
  cs += pad(calls[k], 8);
}
console.log(ks);
console.log(cs);
console.log();

// Those counts are not arbitrary. The number of calls to fib(k) made while
// computing fib(n) is itself a Fibonacci number, which is why the total is
// exponential: the recursion's cost grows like its answer.
const table = new Array(40).fill(0);
table[1] = 1;
for (let i = 2; i < 40; i++) table[i] = table[i - 1] + table[i - 2];

let ok = true;
for (let k = 1; k <= 20; k++) if (calls[k] !== table[20 - k + 1]) ok = false;
console.log(\`calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: \${ok ? "yes" : "no"}\`);

const total = calls.reduce((sum, c) => sum + c, 0);
console.log(\`total calls for fib(20) is \${total}, and 2*fib(21)-1 is \${2 * table[21] - 1}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.Arrays;

// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.
public class Main {
    static long[] calls = new long[64];

    static long fib(int n) {
        calls[n]++;
        if (n < 2) return n;
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        System.out.printf("%3s%10s%12s%10s%12s%n", "n", "fib(n)", "calls", "distinct", "calls each");
        for (int n : new int[] { 5, 10, 15, 20, 25, 30 }) {
            Arrays.fill(calls, 0);
            long value = fib(n);
            long total = 0;
            int distinct = 0;
            for (long c : calls) {
                total += c;
                if (c > 0) distinct++;
            }
            System.out.printf("%3d%10d%12d%10d%12d%n", n, value, total, distinct, total / distinct);
        }
        System.out.println();

        // The waste is not spread evenly. Print how often each smaller value is
        // asked for while computing fib(20).
        Arrays.fill(calls, 0);
        fib(20);
        System.out.println("while computing fib(20), how many times each value is asked for:");
        StringBuilder ks = new StringBuilder("  k     ");
        StringBuilder cs = new StringBuilder("  calls ");
        for (int k = 0; k <= 20; k += 4) {
            ks.append(String.format("%8d", k));
            cs.append(String.format("%8d", calls[k]));
        }
        System.out.println(ks);
        System.out.println(cs);
        System.out.println();

        // Those counts are not arbitrary. The number of calls to fib(k) made
        // while computing fib(n) is itself a Fibonacci number, which is why the
        // total is exponential: the recursion's cost grows like its answer.
        long[] table = new long[40];
        table[1] = 1;
        for (int i = 2; i < 40; i++) table[i] = table[i - 1] + table[i - 2];

        boolean ok = true;
        for (int k = 1; k <= 20; k++) if (calls[k] != table[20 - k + 1]) ok = false;
        System.out.printf("calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: %s%n", ok ? "yes" : "no");

        long total = 0;
        for (long c : calls) total += c;
        System.out.printf("total calls for fib(20) is %d, and 2*fib(21)-1 is %d%n", total, 2 * table[21] - 1);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>

static std::array<std::int64_t, 64> calls{};

std::int64_t fib(int n) {
    calls[n]++;
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    std::cout << std::setw(3) << "n" << std::setw(10) << "fib(n)" << std::setw(12) << "calls"
              << std::setw(10) << "distinct" << std::setw(12) << "calls each" << "\\n";
    for (int n : {5, 10, 15, 20, 25, 30}) {
        calls.fill(0);
        std::int64_t value = fib(n);
        std::int64_t total = 0;
        int distinct = 0;
        for (std::int64_t c : calls) {
            total += c;
            if (c > 0) distinct++;
        }
        std::cout << std::setw(3) << n << std::setw(10) << value << std::setw(12) << total
                  << std::setw(10) << distinct << std::setw(12) << total / distinct << "\\n";
    }
    std::cout << "\\n";

    // The waste is not spread evenly. Print how often each smaller value is
    // asked for while computing fib(20).
    calls.fill(0);
    fib(20);
    std::cout << "while computing fib(20), how many times each value is asked for:\\n";
    std::cout << "  k     ";
    for (int k = 0; k <= 20; k += 4) std::cout << std::setw(8) << k;
    std::cout << "\\n  calls ";
    for (int k = 0; k <= 20; k += 4) std::cout << std::setw(8) << calls[k];
    std::cout << "\\n\\n";

    // Those counts are not arbitrary. The number of calls to fib(k) made while
    // computing fib(n) is itself a Fibonacci number, which is why the total is
    // exponential: the recursion's cost grows like its answer.
    std::array<std::int64_t, 40> table{};
    table[1] = 1;
    for (int i = 2; i < 40; i++) table[i] = table[i - 1] + table[i - 2];

    bool ok = true;
    for (int k = 1; k <= 20; k++)
        if (calls[k] != table[20 - k + 1]) ok = false;
    std::cout << "calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: "
              << (ok ? "yes" : "no") << "\\n";

    std::int64_t total = 0;
    for (std::int64_t c : calls) total += c;
    std::cout << "total calls for fib(20) is " << total << ", and 2*fib(21)-1 is "
              << 2 * table[21] - 1 << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.

fn fib(n: usize, calls: &mut [i64; 64]) -> i64 {
    calls[n] += 1;
    if n < 2 {
        return n as i64;
    }
    fib(n - 1, calls) + fib(n - 2, calls)
}

fn main() {
    println!("{:>3}{:>10}{:>12}{:>10}{:>12}", "n", "fib(n)", "calls", "distinct", "calls each");
    for n in [5usize, 10, 15, 20, 25, 30] {
        let mut calls = [0i64; 64];
        let value = fib(n, &mut calls);
        let total: i64 = calls.iter().sum();
        let distinct = calls.iter().filter(|&&c| c > 0).count() as i64;
        println!("{:>3}{:>10}{:>12}{:>10}{:>12}", n, value, total, distinct, total / distinct);
    }
    println!();

    // The waste is not spread evenly. Print how often each smaller value is
    // asked for while computing fib(20).
    let mut calls = [0i64; 64];
    fib(20, &mut calls);
    println!("while computing fib(20), how many times each value is asked for:");
    let mut ks = String::from("  k     ");
    let mut cs = String::from("  calls ");
    let mut k = 0;
    while k <= 20 {
        ks.push_str(&format!("{:>8}", k));
        cs.push_str(&format!("{:>8}", calls[k]));
        k += 4;
    }
    println!("{}", ks);
    println!("{}", cs);
    println!();

    // Those counts are not arbitrary. The number of calls to fib(k) made while
    // computing fib(n) is itself a Fibonacci number, which is why the total is
    // exponential: the recursion's cost grows like its answer.
    let mut table = [0i64; 40];
    table[1] = 1;
    for i in 2..40 {
        table[i] = table[i - 1] + table[i - 2];
    }

    let ok = (1..=20).all(|k| calls[k] == table[20 - k + 1]);
    println!(
        "calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: {}",
        if ok { "yes" } else { "no" }
    );

    let total: i64 = calls.iter().sum();
    println!("total calls for fib(20) is {}, and 2*fib(21)-1 is {}", total, 2 * table[21] - 1);
}
`,
            },
            {
              lang: "go",
              code: `// The cheapest possible demonstration of the property dynamic programming
// exists to exploit: a recursion that asks the same question over and over, and
// answers it from scratch every single time.
package main

import "fmt"

var calls [64]int64

func fib(n int) int64 {
	calls[n]++
	if n < 2 {
		return int64(n)
	}
	return fib(n-1) + fib(n-2)
}

func main() {
	fmt.Printf("%3s%10s%12s%10s%12s\\n", "n", "fib(n)", "calls", "distinct", "calls each")
	for _, n := range []int{5, 10, 15, 20, 25, 30} {
		calls = [64]int64{}
		value := fib(n)
		var total int64
		distinct := 0
		for _, c := range calls {
			total += c
			if c > 0 {
				distinct++
			}
		}
		fmt.Printf("%3d%10d%12d%10d%12d\\n", n, value, total, distinct, total/int64(distinct))
	}
	fmt.Println()

	// The waste is not spread evenly. Print how often each smaller value is
	// asked for while computing fib(20).
	calls = [64]int64{}
	fib(20)
	fmt.Println("while computing fib(20), how many times each value is asked for:")
	ks := "  k     "
	cs := "  calls "
	for k := 0; k <= 20; k += 4 {
		ks += fmt.Sprintf("%8d", k)
		cs += fmt.Sprintf("%8d", calls[k])
	}
	fmt.Println(ks)
	fmt.Println(cs)
	fmt.Println()

	// Those counts are not arbitrary. The number of calls to fib(k) made while
	// computing fib(n) is itself a Fibonacci number, which is why the total is
	// exponential: the recursion's cost grows like its answer.
	var table [40]int64
	table[1] = 1
	for i := 2; i < 40; i++ {
		table[i] = table[i-1] + table[i-2]
	}

	ok := true
	for k := 1; k <= 20; k++ {
		if calls[k] != table[20-k+1] {
			ok = false
		}
	}
	answer := "no"
	if ok {
		answer = "yes"
	}
	fmt.Printf("calls to fib(k) equals fib(20-k+1), for every k from 1 to 20: %s\\n", answer)

	var total int64
	for _, c := range calls {
		total += c
	}
	fmt.Printf("total calls for fib(20) is %d, and 2*fib(21)-1 is %d\\n", total, 2*table[21]-1)
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-fibonacci-memo",
        kind: "dp",
        algorithm: "fibonacci",
        title: "Thirty-one questions, asked once each",
        lockAlgorithm: true,
      },
    },
    {
      id: "optimal-substructure",
      heading: "The precondition people skip",
      body: [
        "Overlap is the half everybody notices, because it is the half that shows up as a program being slow. Optimal substructure is the half that decides whether a cache is *allowed* to exist, and skipping it is how people produce dynamic programs that run fast and print the wrong number.",
        "The condition is this. For a cached answer to be reusable, it has to be a single well-defined thing that does not depend on how you arrived at the subproblem or on what you intend to do afterwards. \"The shortest distance from A to C\" is such a thing: it is 7 no matter which larger question asked, and a longer route that happens to pass through C can always be improved by splicing in the shorter one.",
        "\"The longest simple path from A to C\" is also perfectly well-defined, and it does not have that property at all. It cannot be spliced, because a path is only allowed to use each vertex once, and the number 13 has thrown away which vertices those were. Below is the same graph asked both questions, with the composition rule applied to each and the disagreements counted.",
      ],
      examples: [
        {
          id: "no-substructure",
          title: "The same graph, one question that composes and one that does not",
          lang: "python",
          code: `# Overlapping subproblems is the cheap precondition. This is the other one, and
# it is the one people skip: the best answer for the whole has to be built out
# of best answers for the parts. Shortest paths have that property. Longest
# simple paths, on the very same graph, do not.

NAMES = "ABCDE"
EDGES = [(0, 1, 4), (1, 2, 3), (2, 3, 2), (3, 0, 5), (1, 3, 1), (2, 4, 6), (3, 4, 2)]
N = len(NAMES)

ADJ = [[] for _ in range(N)]
for u, v, w in EDGES:
    ADJ[u].append((v, w))
    ADJ[v].append((u, w))


def best_simple_path(s, t, want_max):
    """Brute force over every simple path from s to t. Ties keep the first found."""
    best = [-1, []]

    def walk(at, seen, weight, path):
        if at == t:
            better = best[0] < 0 or (weight > best[0] if want_max else weight < best[0])
            if better:
                best[0] = weight
                best[1] = list(path)
            return
        for nxt, w in ADJ[at]:
            if nxt not in seen:
                seen.add(nxt)
                path.append(nxt)
                walk(nxt, seen, weight + w, path)
                path.pop()
                seen.remove(nxt)

    walk(s, {s}, 0, [s])
    return best[0], best[1]


def show(path):
    return "-".join(NAMES[v] for v in path)


shortest = [[(0, [])] * N for _ in range(N)]
longest = [[(0, [])] * N for _ in range(N)]
for s in range(N):
    for t in range(N):
        if s != t:
            shortest[s][t] = best_simple_path(s, t, False)
            longest[s][t] = best_simple_path(s, t, True)

print("edges: " + ", ".join(f"{NAMES[u]}{NAMES[v]}={w}" for u, v, w in EDGES))
print()
print(f"{'pair':<6}{'shortest':<22}{'longest simple':<22}")
for s in range(N):
    for t in range(s + 1, N):
        sw, sp = shortest[s][t]
        lw, lp = longest[s][t]
        print(f"{NAMES[s] + NAMES[t]:<6}{show(sp) + ' = ' + str(sw):<22}{show(lp) + ' = ' + str(lw):<22}")
print()


# The composition rule, stated once and applied to both: "the best route from s
# to t is the best route from s to some neighbour of t, plus that last edge."
def disagreements(best, want_max):
    bad = []
    for s in range(N):
        for t in range(N):
            if s == t:
                continue
            claim = -1
            for u, w in ADJ[t]:
                step = w if u == s else best[s][u][0] + w
                if claim < 0 or (step > claim if want_max else step < claim):
                    claim = step
            if claim != best[s][t][0]:
                bad.append((s, t, best[s][t][0], claim))
    return bad


short_bad = disagreements(shortest, False)
long_bad = disagreements(longest, True)

print(f"ordered pairs checked: {N * (N - 1)}")
print(f"shortest path        -- pairs where the composition disagrees: {len(short_bad)}")
print(f"longest simple path  -- pairs where the composition disagrees: {len(long_bad)}")
print()

s, t, truth, claim = long_bad[0]
print(f"{NAMES[s]} to {NAMES[t]}: really {truth} ({show(longest[s][t][1])}), the rule claims {claim}")
blame = -1
for u, w in ADJ[t]:
    if u != s:
        sub_w, sub_p = longest[s][u]
        print(f"    via {NAMES[u]}: {show(sub_p)} = {sub_w}, then {NAMES[u]}{NAMES[t]}={w} -> {sub_w + w}")
        if sub_w + w == claim:
            blame = u
print(f"    the rule takes the {NAMES[blame]} row -- but that route already walks through {NAMES[t]},")
print(f"    so the last edge has nowhere to land and the {claim} is a path that does not exist.")
`,
          output: `edges: AB=4, BC=3, CD=2, DA=5, BD=1, CE=6, DE=2

pair  shortest              longest simple        
AB    A-B = 4               A-D-E-C-B = 16        
AC    A-B-C = 7             A-B-D-E-C = 13        
AD    A-B-D = 5             A-B-C-E-D = 15        
AE    A-B-D-E = 7           A-D-B-C-E = 15        
BC    B-C = 3               B-A-D-E-C = 17        
BD    B-D = 1               B-C-E-D = 11          
BE    B-D-E = 3             B-A-D-C-E = 17        
CD    C-D = 2               C-B-A-D = 12          
CE    C-D-E = 4             C-B-A-D-E = 14        
DE    D-E = 2               D-A-B-C-E = 18        

ordered pairs checked: 20
shortest path        -- pairs where the composition disagrees: 0
longest simple path  -- pairs where the composition disagrees: 14

A to C: really 13 (A-B-D-E-C), the rule claims 21
    via B: A-D-E-C-B = 16, then BC=3 -> 19
    via D: A-B-C-E-D = 15, then DC=2 -> 17
    via E: A-D-B-C-E = 15, then EC=6 -> 21
    the rule takes the E row -- but that route already walks through C,
    so the last edge has nowhere to land and the 21 is a path that does not exist.`,
          explanation:
            "Both halves brute-force every simple path, so neither is relying on the property being tested. The composition rule is written once and applied to each: the best route from s to t should be the best route to some neighbour of t plus the last edge. For shortest paths it agrees everywhere. For longest simple paths it disagrees on fourteen of the twenty ordered pairs, and the printed case shows why \u2014 the sub-answer it wants to extend already contains the vertex it is trying to reach.",
          alternates: [
            {
              lang: "javascript",
              code: `// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.

const NAMES = "ABCDE";
const EDGES = [[0, 1, 4], [1, 2, 3], [2, 3, 2], [3, 0, 5], [1, 3, 1], [2, 4, 6], [3, 4, 2]];
const N = NAMES.length;

const ADJ = Array.from({ length: N }, () => []);
for (const [u, v, w] of EDGES) {
  ADJ[u].push([v, w]);
  ADJ[v].push([u, w]);
}

/** Brute force over every simple path from s to t. Ties keep the first found. */
function bestSimplePath(s, t, wantMax) {
  let bestWeight = -1;
  let bestPath = [];

  function walk(at, seen, weight, path) {
    if (at === t) {
      const better = bestWeight < 0 || (wantMax ? weight > bestWeight : weight < bestWeight);
      if (better) {
        bestWeight = weight;
        bestPath = [...path];
      }
      return;
    }
    for (const [next, w] of ADJ[at]) {
      if (!seen[next]) {
        seen[next] = true;
        path.push(next);
        walk(next, seen, weight + w, path);
        path.pop();
        seen[next] = false;
      }
    }
  }

  const seen = new Array(N).fill(false);
  seen[s] = true;
  walk(s, seen, 0, [s]);
  return [bestWeight, bestPath];
}

const show = (path) => path.map((v) => NAMES[v]).join("-");
const padEnd = (value, width) => String(value).padEnd(width);

const shortest = [];
const longest = [];
for (let s = 0; s < N; s++) {
  for (let t = 0; t < N; t++) {
    shortest[s * N + t] = s === t ? [0, []] : bestSimplePath(s, t, false);
    longest[s * N + t] = s === t ? [0, []] : bestSimplePath(s, t, true);
  }
}

console.log("edges: " + EDGES.map(([u, v, w]) => \`\${NAMES[u]}\${NAMES[v]}=\${w}\`).join(", "));
console.log();
console.log(padEnd("pair", 6) + padEnd("shortest", 22) + padEnd("longest simple", 22));
for (let s = 0; s < N; s++) {
  for (let t = s + 1; t < N; t++) {
    const [sw, sp] = shortest[s * N + t];
    const [lw, lp] = longest[s * N + t];
    console.log(
      padEnd(NAMES[s] + NAMES[t], 6) + padEnd(\`\${show(sp)} = \${sw}\`, 22) +
        padEnd(\`\${show(lp)} = \${lw}\`, 22)
    );
  }
}
console.log();

// The composition rule, stated once and applied to both: "the best route from s
// to t is the best route from s to some neighbour of t, plus that last edge."
function disagreements(best, wantMax) {
  const bad = [];
  for (let s = 0; s < N; s++) {
    for (let t = 0; t < N; t++) {
      if (s === t) continue;
      let claim = -1;
      for (const [u, w] of ADJ[t]) {
        const step = u === s ? w : best[s * N + u][0] + w;
        if (claim < 0 || (wantMax ? step > claim : step < claim)) claim = step;
      }
      if (claim !== best[s * N + t][0]) bad.push([s, t, best[s * N + t][0], claim]);
    }
  }
  return bad;
}

const shortBad = disagreements(shortest, false);
const longBad = disagreements(longest, true);

console.log(\`ordered pairs checked: \${N * (N - 1)}\`);
console.log(\`shortest path        -- pairs where the composition disagrees: \${shortBad.length}\`);
console.log(\`longest simple path  -- pairs where the composition disagrees: \${longBad.length}\`);
console.log();

const [s, t, truth, claim] = longBad[0];
console.log(\`\${NAMES[s]} to \${NAMES[t]}: really \${truth} (\${show(longest[s * N + t][1])}), the rule claims \${claim}\`);
let blame = 0;
for (const [u, w] of ADJ[t]) {
  if (u === s) continue;
  const [subW, subP] = longest[s * N + u];
  console.log(\`    via \${NAMES[u]}: \${show(subP)} = \${subW}, then \${NAMES[u]}\${NAMES[t]}=\${w} -> \${subW + w}\`);
  if (subW + w === claim) blame = u;
}
console.log(\`    the rule takes the \${NAMES[blame]} row -- but that route already walks through \${NAMES[t]},\`);
console.log(\`    so the last edge has nowhere to land and the \${claim} is a path that does not exist.\`);
`,
            },
            {
              lang: "typescript",
              code: `// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.

const NAMES = "ABCDE";
const EDGES = [[0, 1, 4], [1, 2, 3], [2, 3, 2], [3, 0, 5], [1, 3, 1], [2, 4, 6], [3, 4, 2]];
const N = NAMES.length;

type Step = [number, number];
type Best = [number, number[]];

const ADJ: Step[][] = Array.from({ length: N }, () => []);
for (const [u, v, w] of EDGES) {
  ADJ[u].push([v, w]);
  ADJ[v].push([u, w]);
}

/** Brute force over every simple path from s to t. Ties keep the first found. */
function bestSimplePath(s: number, t: number, wantMax: boolean): Best {
  let bestWeight = -1;
  let bestPath: number[] = [];

  function walk(at: number, seen: boolean[], weight: number, path: number[]): void {
    if (at === t) {
      const better = bestWeight < 0 || (wantMax ? weight > bestWeight : weight < bestWeight);
      if (better) {
        bestWeight = weight;
        bestPath = [...path];
      }
      return;
    }
    for (const [next, w] of ADJ[at]) {
      if (!seen[next]) {
        seen[next] = true;
        path.push(next);
        walk(next, seen, weight + w, path);
        path.pop();
        seen[next] = false;
      }
    }
  }

  const seen = new Array(N).fill(false);
  seen[s] = true;
  walk(s, seen, 0, [s]);
  return [bestWeight, bestPath];
}

const show = (path: number[]): string => path.map((v) => NAMES[v]).join("-");
const padEnd = (value: string | number, width: number): string => String(value).padEnd(width);

const shortest: Best[] = [];
const longest: Best[] = [];
for (let s = 0; s < N; s++) {
  for (let t = 0; t < N; t++) {
    shortest[s * N + t] = s === t ? [0, []] : bestSimplePath(s, t, false);
    longest[s * N + t] = s === t ? [0, []] : bestSimplePath(s, t, true);
  }
}

console.log("edges: " + EDGES.map(([u, v, w]) => \`\${NAMES[u]}\${NAMES[v]}=\${w}\`).join(", "));
console.log();
console.log(padEnd("pair", 6) + padEnd("shortest", 22) + padEnd("longest simple", 22));
for (let s = 0; s < N; s++) {
  for (let t = s + 1; t < N; t++) {
    const [sw, sp] = shortest[s * N + t];
    const [lw, lp] = longest[s * N + t];
    console.log(
      padEnd(NAMES[s] + NAMES[t], 6) + padEnd(\`\${show(sp)} = \${sw}\`, 22) +
        padEnd(\`\${show(lp)} = \${lw}\`, 22)
    );
  }
}
console.log();

// The composition rule, stated once and applied to both: "the best route from s
// to t is the best route from s to some neighbour of t, plus that last edge."
function disagreements(best: Best[], wantMax: boolean): [number, number, number, number][] {
  const bad: [number, number, number, number][] = [];
  for (let s = 0; s < N; s++) {
    for (let t = 0; t < N; t++) {
      if (s === t) continue;
      let claim = -1;
      for (const [u, w] of ADJ[t]) {
        const step = u === s ? w : best[s * N + u][0] + w;
        if (claim < 0 || (wantMax ? step > claim : step < claim)) claim = step;
      }
      if (claim !== best[s * N + t][0]) bad.push([s, t, best[s * N + t][0], claim]);
    }
  }
  return bad;
}

const shortBad = disagreements(shortest, false);
const longBad = disagreements(longest, true);

console.log(\`ordered pairs checked: \${N * (N - 1)}\`);
console.log(\`shortest path        -- pairs where the composition disagrees: \${shortBad.length}\`);
console.log(\`longest simple path  -- pairs where the composition disagrees: \${longBad.length}\`);
console.log();

const [s, t, truth, claim] = longBad[0];
console.log(\`\${NAMES[s]} to \${NAMES[t]}: really \${truth} (\${show(longest[s * N + t][1])}), the rule claims \${claim}\`);
let blame = 0;
for (const [u, w] of ADJ[t]) {
  if (u === s) continue;
  const [subW, subP] = longest[s * N + u];
  console.log(\`    via \${NAMES[u]}: \${show(subP)} = \${subW}, then \${NAMES[u]}\${NAMES[t]}=\${w} -> \${subW + w}\`);
  if (subW + w === claim) blame = u;
}
console.log(\`    the rule takes the \${NAMES[blame]} row -- but that route already walks through \${NAMES[t]},\`);
console.log(\`    so the last edge has nowhere to land and the \${claim} is a path that does not exist.\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.
public class Main {
    static final String NAMES = "ABCDE";
    static final int[][] EDGES = { { 0, 1, 4 }, { 1, 2, 3 }, { 2, 3, 2 }, { 3, 0, 5 },
                                   { 1, 3, 1 }, { 2, 4, 6 }, { 3, 4, 2 } };
    static final int N = NAMES.length();
    static final List<List<int[]>> ADJ = new ArrayList<>();

    static int bestWeight;
    static List<Integer> bestPath;

    /** Brute force over every simple path from s to t. Ties keep the first found. */
    static void walk(int at, int t, boolean[] seen, int weight, List<Integer> path, boolean wantMax) {
        if (at == t) {
            boolean better = bestWeight < 0 || (wantMax ? weight > bestWeight : weight < bestWeight);
            if (better) {
                bestWeight = weight;
                bestPath = new ArrayList<>(path);
            }
            return;
        }
        for (int[] e : ADJ.get(at)) {
            if (!seen[e[0]]) {
                seen[e[0]] = true;
                path.add(e[0]);
                walk(e[0], t, seen, weight + e[1], path, wantMax);
                path.remove(path.size() - 1);
                seen[e[0]] = false;
            }
        }
    }

    static void bestSimplePath(int s, int t, boolean wantMax) {
        bestWeight = -1;
        bestPath = new ArrayList<>();
        boolean[] seen = new boolean[N];
        seen[s] = true;
        List<Integer> path = new ArrayList<>();
        path.add(s);
        walk(s, t, seen, 0, path, wantMax);
    }

    static String show(List<Integer> path) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) sb.append('-');
            sb.append(NAMES.charAt(path.get(i)));
        }
        return sb.toString();
    }

    /**
     * The composition rule, stated once and applied to both: "the best route
     * from s to t is the best route from s to some neighbour of t, plus that
     * last edge."
     */
    static List<int[]> disagreements(int[] best, boolean wantMax) {
        List<int[]> bad = new ArrayList<>();
        for (int s = 0; s < N; s++) {
            for (int t = 0; t < N; t++) {
                if (s == t) continue;
                int claim = -1;
                for (int[] e : ADJ.get(t)) {
                    int step = e[0] == s ? e[1] : best[s * N + e[0]] + e[1];
                    if (claim < 0 || (wantMax ? step > claim : step < claim)) claim = step;
                }
                if (claim != best[s * N + t]) bad.add(new int[] { s, t, best[s * N + t], claim });
            }
        }
        return bad;
    }

    public static void main(String[] args) {
        for (int i = 0; i < N; i++) ADJ.add(new ArrayList<>());
        for (int[] e : EDGES) {
            ADJ.get(e[0]).add(new int[] { e[1], e[2] });
            ADJ.get(e[1]).add(new int[] { e[0], e[2] });
        }

        int[] shortW = new int[N * N];
        int[] longW = new int[N * N];
        List<List<Integer>> shortP = new ArrayList<>();
        List<List<Integer>> longP = new ArrayList<>();
        for (int i = 0; i < N * N; i++) {
            shortP.add(new ArrayList<>());
            longP.add(new ArrayList<>());
        }
        for (int s = 0; s < N; s++) {
            for (int t = 0; t < N; t++) {
                if (s == t) continue;
                bestSimplePath(s, t, false);
                shortW[s * N + t] = bestWeight;
                shortP.set(s * N + t, bestPath);
                bestSimplePath(s, t, true);
                longW[s * N + t] = bestWeight;
                longP.set(s * N + t, bestPath);
            }
        }

        StringBuilder edges = new StringBuilder("edges: ");
        for (int i = 0; i < EDGES.length; i++) {
            if (i > 0) edges.append(", ");
            edges.append(NAMES.charAt(EDGES[i][0])).append(NAMES.charAt(EDGES[i][1]))
                 .append('=').append(EDGES[i][2]);
        }
        System.out.println(edges);
        System.out.println();
        System.out.printf("%-6s%-22s%-22s%n", "pair", "shortest", "longest simple");
        for (int s = 0; s < N; s++) {
            for (int t = s + 1; t < N; t++) {
                String pair = "" + NAMES.charAt(s) + NAMES.charAt(t);
                System.out.printf("%-6s%-22s%-22s%n", pair,
                    show(shortP.get(s * N + t)) + " = " + shortW[s * N + t],
                    show(longP.get(s * N + t)) + " = " + longW[s * N + t]);
            }
        }
        System.out.println();

        List<int[]> shortBad = disagreements(shortW, false);
        List<int[]> longBad = disagreements(longW, true);

        System.out.printf("ordered pairs checked: %d%n", N * (N - 1));
        System.out.printf("shortest path        -- pairs where the composition disagrees: %d%n", shortBad.size());
        System.out.printf("longest simple path  -- pairs where the composition disagrees: %d%n", longBad.size());
        System.out.println();

        int[] first = longBad.get(0);
        int s = first[0], t = first[1], truth = first[2], claim = first[3];
        System.out.printf("%c to %c: really %d (%s), the rule claims %d%n",
            NAMES.charAt(s), NAMES.charAt(t), truth, show(longP.get(s * N + t)), claim);
        int blame = -1;
        for (int[] e : ADJ.get(t)) {
            if (e[0] == s) continue;
            int subW = longW[s * N + e[0]];
            System.out.printf("    via %c: %s = %d, then %c%c=%d -> %d%n",
                NAMES.charAt(e[0]), show(longP.get(s * N + e[0])), subW,
                NAMES.charAt(e[0]), NAMES.charAt(t), e[1], subW + e[1]);
            if (subW + e[1] == claim) blame = e[0];
        }
        System.out.printf("    the rule takes the %c row -- but that route already walks through %c,%n",
            NAMES.charAt(blame), NAMES.charAt(t));
        System.out.printf("    so the last edge has nowhere to land and the %d is a path that does not exist.%n", claim);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::string NAMES = "ABCDE";
static const std::array<std::array<int, 3>, 7> EDGES = {{{0, 1, 4}, {1, 2, 3}, {2, 3, 2},
                                                         {3, 0, 5}, {1, 3, 1}, {2, 4, 6},
                                                         {3, 4, 2}}};
static const int N = 5;

struct Edge {
    int to, w;
};

static std::vector<std::vector<Edge>> adj(N);
static int bestWeight;
static std::vector<int> bestPath;

// Brute force over every simple path from s to t. Ties keep the first found.
void walk(int at, int t, std::vector<bool> &seen, int weight, std::vector<int> &path, bool wantMax) {
    if (at == t) {
        bool better = bestWeight < 0 || (wantMax ? weight > bestWeight : weight < bestWeight);
        if (better) {
            bestWeight = weight;
            bestPath = path;
        }
        return;
    }
    for (const Edge &e : adj[at]) {
        if (!seen[e.to]) {
            seen[e.to] = true;
            path.push_back(e.to);
            walk(e.to, t, seen, weight + e.w, path, wantMax);
            path.pop_back();
            seen[e.to] = false;
        }
    }
}

void bestSimplePath(int s, int t, bool wantMax) {
    bestWeight = -1;
    bestPath.clear();
    std::vector<bool> seen(N, false);
    seen[s] = true;
    std::vector<int> path{s};
    walk(s, t, seen, 0, path, wantMax);
}

std::string show(const std::vector<int> &path) {
    std::string out;
    for (size_t i = 0; i < path.size(); i++) {
        if (i > 0) out += '-';
        out += NAMES[path[i]];
    }
    return out;
}

// The composition rule, stated once and applied to both: "the best route from s
// to t is the best route from s to some neighbour of t, plus that last edge."
std::vector<std::array<int, 4>> disagreements(const std::vector<int> &best, bool wantMax) {
    std::vector<std::array<int, 4>> bad;
    for (int s = 0; s < N; s++) {
        for (int t = 0; t < N; t++) {
            if (s == t) continue;
            int claim = -1;
            for (const Edge &e : adj[t]) {
                int step = e.to == s ? e.w : best[s * N + e.to] + e.w;
                if (claim < 0 || (wantMax ? step > claim : step < claim)) claim = step;
            }
            if (claim != best[s * N + t]) bad.push_back({s, t, best[s * N + t], claim});
        }
    }
    return bad;
}

int main() {
    for (const auto &e : EDGES) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }

    std::vector<int> shortW(N * N, 0), longW(N * N, 0);
    std::vector<std::vector<int>> shortP(N * N), longP(N * N);
    for (int s = 0; s < N; s++) {
        for (int t = 0; t < N; t++) {
            if (s == t) continue;
            bestSimplePath(s, t, false);
            shortW[s * N + t] = bestWeight;
            shortP[s * N + t] = bestPath;
            bestSimplePath(s, t, true);
            longW[s * N + t] = bestWeight;
            longP[s * N + t] = bestPath;
        }
    }

    std::cout << "edges: ";
    for (size_t i = 0; i < EDGES.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << NAMES[EDGES[i][0]] << NAMES[EDGES[i][1]] << '=' << EDGES[i][2];
    }
    std::cout << "\\n\\n";
    std::cout << std::left << std::setw(6) << "pair" << std::setw(22) << "shortest"
              << std::setw(22) << "longest simple" << "\\n";
    for (int s = 0; s < N; s++) {
        for (int t = s + 1; t < N; t++) {
            std::string pair = std::string(1, NAMES[s]) + NAMES[t];
            std::cout << std::setw(6) << pair
                      << std::setw(22) << (show(shortP[s * N + t]) + " = " + std::to_string(shortW[s * N + t]))
                      << std::setw(22) << (show(longP[s * N + t]) + " = " + std::to_string(longW[s * N + t]))
                      << "\\n";
        }
    }
    std::cout << "\\n";

    auto shortBad = disagreements(shortW, false);
    auto longBad = disagreements(longW, true);

    std::cout << "ordered pairs checked: " << N * (N - 1) << "\\n";
    std::cout << "shortest path        -- pairs where the composition disagrees: " << shortBad.size() << "\\n";
    std::cout << "longest simple path  -- pairs where the composition disagrees: " << longBad.size() << "\\n\\n";

    int s = longBad[0][0], t = longBad[0][1], truth = longBad[0][2], claim = longBad[0][3];
    std::cout << NAMES[s] << " to " << NAMES[t] << ": really " << truth << " ("
              << show(longP[s * N + t]) << "), the rule claims " << claim << "\\n";
    int blame = -1;
    for (const Edge &e : adj[t]) {
        if (e.to == s) continue;
        int subW = longW[s * N + e.to];
        std::cout << "    via " << NAMES[e.to] << ": " << show(longP[s * N + e.to]) << " = " << subW
                  << ", then " << NAMES[e.to] << NAMES[t] << '=' << e.w << " -> " << subW + e.w << "\\n";
        if (subW + e.w == claim) blame = e.to;
    }
    std::cout << "    the rule takes the " << NAMES[blame] << " row -- but that route already walks through "
              << NAMES[t] << ",\\n";
    std::cout << "    so the last edge has nowhere to land and the " << claim
              << " is a path that does not exist.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.

const NAMES: [char; 5] = ['A', 'B', 'C', 'D', 'E'];
const EDGES: [(usize, usize, i32); 7] = [
    (0, 1, 4), (1, 2, 3), (2, 3, 2), (3, 0, 5), (1, 3, 1), (2, 4, 6), (3, 4, 2),
];
const N: usize = 5;

struct Best {
    weight: i32,
    path: Vec<usize>,
}

/// Brute force over every simple path from s to t. Ties keep the first found.
fn walk(
    adj: &Vec<Vec<(usize, i32)>>, at: usize, t: usize, seen: &mut Vec<bool>,
    weight: i32, path: &mut Vec<usize>, want_max: bool, best: &mut Best,
) {
    if at == t {
        let better = best.weight < 0
            || if want_max { weight > best.weight } else { weight < best.weight };
        if better {
            best.weight = weight;
            best.path = path.clone();
        }
        return;
    }
    for &(next, w) in &adj[at] {
        if !seen[next] {
            seen[next] = true;
            path.push(next);
            walk(adj, next, t, seen, weight + w, path, want_max, best);
            path.pop();
            seen[next] = false;
        }
    }
}

fn best_simple_path(adj: &Vec<Vec<(usize, i32)>>, s: usize, t: usize, want_max: bool) -> Best {
    let mut best = Best { weight: -1, path: Vec::new() };
    let mut seen = vec![false; N];
    seen[s] = true;
    let mut path = vec![s];
    walk(adj, s, t, &mut seen, 0, &mut path, want_max, &mut best);
    best
}

fn show(path: &[usize]) -> String {
    path.iter().map(|&v| NAMES[v].to_string()).collect::<Vec<_>>().join("-")
}

/// The composition rule, stated once and applied to both: "the best route from
/// s to t is the best route from s to some neighbour of t, plus that last edge."
fn disagreements(
    adj: &Vec<Vec<(usize, i32)>>, best: &[i32], want_max: bool,
) -> Vec<(usize, usize, i32, i32)> {
    let mut bad = Vec::new();
    for s in 0..N {
        for t in 0..N {
            if s == t {
                continue;
            }
            let mut claim = -1;
            for &(u, w) in &adj[t] {
                let step = if u == s { w } else { best[s * N + u] + w };
                if claim < 0 || if want_max { step > claim } else { step < claim } {
                    claim = step;
                }
            }
            if claim != best[s * N + t] {
                bad.push((s, t, best[s * N + t], claim));
            }
        }
    }
    bad
}

fn main() {
    let mut adj: Vec<Vec<(usize, i32)>> = vec![Vec::new(); N];
    for &(u, v, w) in EDGES.iter() {
        adj[u].push((v, w));
        adj[v].push((u, w));
    }

    let mut short_w = vec![0i32; N * N];
    let mut long_w = vec![0i32; N * N];
    let mut short_p: Vec<Vec<usize>> = vec![Vec::new(); N * N];
    let mut long_p: Vec<Vec<usize>> = vec![Vec::new(); N * N];
    for s in 0..N {
        for t in 0..N {
            if s == t {
                continue;
            }
            let b = best_simple_path(&adj, s, t, false);
            short_w[s * N + t] = b.weight;
            short_p[s * N + t] = b.path;
            let b = best_simple_path(&adj, s, t, true);
            long_w[s * N + t] = b.weight;
            long_p[s * N + t] = b.path;
        }
    }

    let labels: Vec<String> = EDGES
        .iter()
        .map(|&(u, v, w)| format!("{}{}={}", NAMES[u], NAMES[v], w))
        .collect();
    println!("edges: {}", labels.join(", "));
    println!();
    println!("{:<6}{:<22}{:<22}", "pair", "shortest", "longest simple");
    for s in 0..N {
        for t in (s + 1)..N {
            let pair = format!("{}{}", NAMES[s], NAMES[t]);
            println!(
                "{:<6}{:<22}{:<22}",
                pair,
                format!("{} = {}", show(&short_p[s * N + t]), short_w[s * N + t]),
                format!("{} = {}", show(&long_p[s * N + t]), long_w[s * N + t])
            );
        }
    }
    println!();

    let short_bad = disagreements(&adj, &short_w, false);
    let long_bad = disagreements(&adj, &long_w, true);

    println!("ordered pairs checked: {}", N * (N - 1));
    println!("shortest path        -- pairs where the composition disagrees: {}", short_bad.len());
    println!("longest simple path  -- pairs where the composition disagrees: {}", long_bad.len());
    println!();

    let (s, t, truth, claim) = long_bad[0];
    println!(
        "{} to {}: really {} ({}), the rule claims {}",
        NAMES[s], NAMES[t], truth, show(&long_p[s * N + t]), claim
    );
    let mut blame = 0;
    for &(u, w) in &adj[t] {
        if u == s {
            continue;
        }
        let sub_w = long_w[s * N + u];
        println!(
            "    via {}: {} = {}, then {}{}={} -> {}",
            NAMES[u], show(&long_p[s * N + u]), sub_w, NAMES[u], NAMES[t], w, sub_w + w
        );
        if sub_w + w == claim {
            blame = u;
        }
    }
    println!(
        "    the rule takes the {} row -- but that route already walks through {},",
        NAMES[blame], NAMES[t]
    );
    println!(
        "    so the last edge has nowhere to land and the {} is a path that does not exist.",
        claim
    );
}
`,
            },
            {
              lang: "go",
              code: `// Overlapping subproblems is the cheap precondition. This is the other one, and
// it is the one people skip: the best answer for the whole has to be built out
// of best answers for the parts. Shortest paths have that property. Longest
// simple paths, on the very same graph, do not.
package main

import (
	"fmt"
	"strings"
)

const NAMES = "ABCDE"

var EDGES = [][3]int{{0, 1, 4}, {1, 2, 3}, {2, 3, 2}, {3, 0, 5}, {1, 3, 1}, {2, 4, 6}, {3, 4, 2}}

const N = len(NAMES)

type edge struct{ to, w int }

var adj [N][]edge

var bestWeight int
var bestPath []int

// Brute force over every simple path from s to t. Ties keep the first found.
func walk(at, t int, seen []bool, weight int, path []int, wantMax bool) {
	if at == t {
		better := bestWeight < 0 || (wantMax && weight > bestWeight) || (!wantMax && weight < bestWeight)
		if better {
			bestWeight = weight
			bestPath = append([]int{}, path...)
		}
		return
	}
	for _, e := range adj[at] {
		if !seen[e.to] {
			seen[e.to] = true
			path = append(path, e.to)
			walk(e.to, t, seen, weight+e.w, path, wantMax)
			path = path[:len(path)-1]
			seen[e.to] = false
		}
	}
}

func bestSimplePath(s, t int, wantMax bool) {
	bestWeight = -1
	bestPath = nil
	seen := make([]bool, N)
	seen[s] = true
	walk(s, t, seen, 0, []int{s}, wantMax)
}

func show(path []int) string {
	parts := make([]string, len(path))
	for i, v := range path {
		parts[i] = string(NAMES[v])
	}
	return strings.Join(parts, "-")
}

// The composition rule, stated once and applied to both: "the best route from s
// to t is the best route from s to some neighbour of t, plus that last edge."
func disagreements(best []int, wantMax bool) [][4]int {
	var bad [][4]int
	for s := 0; s < N; s++ {
		for t := 0; t < N; t++ {
			if s == t {
				continue
			}
			claim := -1
			for _, e := range adj[t] {
				step := best[s*N+e.to] + e.w
				if e.to == s {
					step = e.w
				}
				if claim < 0 || (wantMax && step > claim) || (!wantMax && step < claim) {
					claim = step
				}
			}
			if claim != best[s*N+t] {
				bad = append(bad, [4]int{s, t, best[s*N+t], claim})
			}
		}
	}
	return bad
}

func main() {
	for _, e := range EDGES {
		adj[e[0]] = append(adj[e[0]], edge{e[1], e[2]})
		adj[e[1]] = append(adj[e[1]], edge{e[0], e[2]})
	}

	shortW := make([]int, N*N)
	longW := make([]int, N*N)
	shortP := make([][]int, N*N)
	longP := make([][]int, N*N)
	for s := 0; s < N; s++ {
		for t := 0; t < N; t++ {
			if s == t {
				continue
			}
			bestSimplePath(s, t, false)
			shortW[s*N+t], shortP[s*N+t] = bestWeight, bestPath
			bestSimplePath(s, t, true)
			longW[s*N+t], longP[s*N+t] = bestWeight, bestPath
		}
	}

	labels := make([]string, len(EDGES))
	for i, e := range EDGES {
		labels[i] = fmt.Sprintf("%c%c=%d", NAMES[e[0]], NAMES[e[1]], e[2])
	}
	fmt.Println("edges: " + strings.Join(labels, ", "))
	fmt.Println()
	fmt.Printf("%-6s%-22s%-22s\\n", "pair", "shortest", "longest simple")
	for s := 0; s < N; s++ {
		for t := s + 1; t < N; t++ {
			pair := fmt.Sprintf("%c%c", NAMES[s], NAMES[t])
			fmt.Printf("%-6s%-22s%-22s\\n", pair,
				fmt.Sprintf("%s = %d", show(shortP[s*N+t]), shortW[s*N+t]),
				fmt.Sprintf("%s = %d", show(longP[s*N+t]), longW[s*N+t]))
		}
	}
	fmt.Println()

	shortBad := disagreements(shortW, false)
	longBad := disagreements(longW, true)

	fmt.Printf("ordered pairs checked: %d\\n", N*(N-1))
	fmt.Printf("shortest path        -- pairs where the composition disagrees: %d\\n", len(shortBad))
	fmt.Printf("longest simple path  -- pairs where the composition disagrees: %d\\n", len(longBad))
	fmt.Println()

	s, t, truth, claim := longBad[0][0], longBad[0][1], longBad[0][2], longBad[0][3]
	fmt.Printf("%c to %c: really %d (%s), the rule claims %d\\n",
		NAMES[s], NAMES[t], truth, show(longP[s*N+t]), claim)
	blame := -1
	for _, e := range adj[t] {
		if e.to == s {
			continue
		}
		subW := longW[s*N+e.to]
		fmt.Printf("    via %c: %s = %d, then %c%c=%d -> %d\\n",
			NAMES[e.to], show(longP[s*N+e.to]), subW, NAMES[e.to], NAMES[t], e.w, subW+e.w)
		if subW+e.w == claim {
			blame = e.to
		}
	}
	fmt.Printf("    the rule takes the %c row -- but that route already walks through %c,\\n", NAMES[blame], NAMES[t])
	fmt.Printf("    so the last edge has nowhere to land and the %d is a path that does not exist.\\n", claim)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Optimal substructure belongs to the state, not to the problem",
          body: "\"Longest simple path has no optimal substructure\" is shorthand, and taken literally it is false. Over pairs of endpoints there is none; over an endpoint pair *plus the set of vertices already used* there is, which is what bitmask DP exploits. When a recurrence refuses to close, the useful reaction is to ask what the sub-answer forgot rather than to conclude the problem is not a DP.",
        },
        {
          title: "A cache never tells you it is unsound",
          body: "Memoise the longest-simple-path recursion over `(s, t)` and it will run, terminate quickly, and print a number. Nothing crashes, nothing warns, and on small graphs the number is often even right. Correctness under memoisation is something you argue before you write it, not something you observe afterwards \u2014 which is exactly the situation the greedy module was in, and exactly why an exchange argument existed.",
        },
        {
          title: "Negative weights are the same bug in another costume",
          body: "The reason Dijkstra breaks on a negative edge is this precondition, not an implementation detail. Dijkstra finalises a vertex on the assumption that no later route can improve it, which is the claim that a shortest path's prefixes are themselves shortest. A negative edge withdraws that claim, and the fix \u2014 Bellman-Ford \u2014 is precisely the version that stops assuming and relaxes every edge repeatedly.",
        },
      ],
    },
    {
      id: "both-or-neither",
      heading: "Both conditions, or it is something else",
      body: [
        "The two conditions are independent, and all four combinations happen. Optimal substructure with no overlap is divide and conquer \u2014 merge sort, binary search, quickselect \u2014 where the subproblems partition the input and therefore cannot repeat. Overlap with no optimal substructure is the longest simple path over endpoints, where a cache is fast and wrong. Neither gives you a search. Both give you dynamic programming.",
        "Rather than assert that, measure it. Below are three recursions with the same instrumentation and the same cache bolted onto each: naive Fibonacci, merge sort, and coin change. The cache is switched on and off by a flag; when it is off, the memo is still filled in, so it ends up holding exactly the set of distinct subproblems and the count is free.",
      ],
      examples: [
        {
          id: "overlap-measured",
          title: "Three recursions, one cache, and the hit counts",
          lang: "python",
          code: `# "Overlapping" is a measurement, not an adjective. Run three recursions, give
# every subproblem a name, and count how many times each name is asked for. The
# same cache is bolted onto all three, and only two of them ever get a hit.

COINS = [1, 7, 10]
VALUES = [(i * 37 + 11) % 64 for i in range(32)]

# calls, hits. The memo is filled in either way -- when the cache is off it is
# never read, so it ends up holding exactly the distinct subproblems.
stats = [0, 0]


def fib(n, memo, use_cache):
    stats[0] += 1
    if use_cache and n in memo:
        stats[1] += 1
        return memo[n]
    value = n if n < 2 else fib(n - 1, memo, use_cache) + fib(n - 2, memo, use_cache)
    memo[n] = value
    return value


def merge_sort(lo, hi, memo, use_cache):
    stats[0] += 1
    key = lo * 1000 + hi
    if use_cache and key in memo:
        stats[1] += 1
        return memo[key]
    if hi - lo <= 1:
        out = VALUES[lo:hi]
    else:
        mid = (lo + hi) // 2
        left = merge_sort(lo, mid, memo, use_cache)
        right = merge_sort(mid, hi, memo, use_cache)
        out, i, j = [], 0, 0
        while i < len(left) or j < len(right):
            if j >= len(right) or (i < len(left) and left[i] <= right[j]):
                out.append(left[i])
                i += 1
            else:
                out.append(right[j])
                j += 1
    memo[key] = out
    return out


def coin_change(amount, memo, use_cache):
    stats[0] += 1
    if use_cache and amount in memo:
        stats[1] += 1
        return memo[amount]
    best = -1
    if amount > 0:
        for coin in COINS:
            if coin <= amount:
                sub = coin_change(amount - coin, memo, use_cache)
                if sub >= 0 and (best < 0 or sub + 1 < best):
                    best = sub + 1
    else:
        best = 0
    memo[amount] = best
    return best


def census(use_cache):
    rows = []
    for label in ("fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10"):
        memo = {}
        stats[0] = 0
        stats[1] = 0
        if label.startswith("fib"):
            fib(25, memo, use_cache)
        elif label.startswith("merge"):
            merge_sort(0, len(VALUES), memo, use_cache)
        else:
            coin_change(60, memo, use_cache)
        rows.append((label, stats[0], stats[1], len(memo)))
    return rows


plain = census(False)
cached = census(True)

print(f"{'recursion':<28}{'calls':>10}{'distinct':>10}{'each':>8}{'cached':>9}{'hits':>7}")
for (label, calls, _, distinct), (_, c_calls, c_hits, _) in zip(plain, cached):
    print(f"{label:<28}{calls:>10}{distinct:>10}{calls // distinct:>8}{c_calls:>9}{c_hits:>7}")
print()

# And the answers, so the cache is visibly not changing what is computed.
memo = {}
print(f"fib(25) = {fib(25, memo, True)}")
memo = {}
print(f"coin change for 60 = {coin_change(60, memo, True)} coins")
memo = {}
out = merge_sort(0, len(VALUES), memo, True)
print(f"merge sort output is sorted: {'yes' if out == sorted(VALUES) else 'no'}")
`,
          output: `recursion                        calls  distinct    each   cached   hits
fib(25)                         242785        26    9337       49     23
merge sort, 32 items                63        63       1       63      0
coin change, 60 from 1/7/10   11711618        61  191993      166    105

fib(25) = 75025
coin change for 60 = 6 coins
merge sort output is sorted: yes`,
          explanation:
            "The `use_cache` flag switches memoisation off without changing anything else, and the memo is written to either way so the distinct-subproblem count comes free. `each` is calls divided by distinct subproblems, which is the measurement the word \"overlapping\" is standing in for. Merge sort scores exactly one and takes zero cache hits; coin change scores 191,993.",
          alternates: [
            {
              lang: "javascript",
              code: `// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.

const COINS = [1, 7, 10];
const VALUES = Array.from({ length: 32 }, (_, i) => (i * 37 + 11) % 64);

// calls, hits. The memo is filled in either way -- when the cache is off it is
// never read, so it ends up holding exactly the distinct subproblems.
const stats = { calls: 0, hits: 0 };

function fib(n, memo, useCache) {
  stats.calls++;
  const seen = memo.get(n);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  const value = n < 2 ? n : fib(n - 1, memo, useCache) + fib(n - 2, memo, useCache);
  memo.set(n, value);
  return value;
}

function mergeSort(lo, hi, memo, useCache) {
  stats.calls++;
  const key = lo * 1000 + hi;
  const seen = memo.get(key);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let out = [];
  if (hi - lo <= 1) {
    out = VALUES.slice(lo, hi);
  } else {
    const mid = Math.floor((lo + hi) / 2);
    const left = mergeSort(lo, mid, memo, useCache);
    const right = mergeSort(mid, hi, memo, useCache);
    let i = 0;
    let j = 0;
    while (i < left.length || j < right.length) {
      if (j >= right.length || (i < left.length && left[i] <= right[j])) {
        out.push(left[i++]);
      } else {
        out.push(right[j++]);
      }
    }
  }
  memo.set(key, out);
  return out;
}

function coinChange(amount, memo, useCache) {
  stats.calls++;
  const seen = memo.get(amount);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let best = -1;
  if (amount > 0) {
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = coinChange(amount - coin, memo, useCache);
        if (sub >= 0 && (best < 0 || sub + 1 < best)) best = sub + 1;
      }
    }
  } else {
    best = 0;
  }
  memo.set(amount, best);
  return best;
}

const LABELS = ["fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10"];

/** Returns [calls, hits, distinct] for each of the three recursions. */
function census(useCache) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    stats.calls = 0;
    stats.hits = 0;
    const memo = new Map();
    if (r === 0) fib(25, memo, useCache);
    else if (r === 1) mergeSort(0, VALUES.length, memo, useCache);
    else coinChange(60, memo, useCache);
    rows.push([stats.calls, stats.hits, memo.size]);
  }
  return rows;
}

const plain = census(false);
const cached = census(true);

const padEnd = (value, width) => String(value).padEnd(width);
const pad = (value, width) => String(value).padStart(width);

console.log(
  padEnd("recursion", 28) + pad("calls", 10) + pad("distinct", 10) + pad("each", 8) +
    pad("cached", 9) + pad("hits", 7)
);
for (let r = 0; r < 3; r++) {
  console.log(
    padEnd(LABELS[r], 28) + pad(plain[r][0], 10) + pad(plain[r][2], 10) +
      pad(Math.floor(plain[r][0] / plain[r][2]), 8) + pad(cached[r][0], 9) + pad(cached[r][1], 7)
  );
}
console.log();

// And the answers, so the cache is visibly not changing what is computed.
console.log(\`fib(25) = \${fib(25, new Map(), true)}\`);
console.log(\`coin change for 60 = \${coinChange(60, new Map(), true)} coins\`);
const out = mergeSort(0, VALUES.length, new Map(), true);
const reference = [...VALUES].sort((a, b) => a - b);
const sorted = out.length === reference.length && out.every((v, i) => v === reference[i]);
console.log(\`merge sort output is sorted: \${sorted ? "yes" : "no"}\`);
`,
            },
            {
              lang: "typescript",
              code: `// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.

const COINS = [1, 7, 10];
const VALUES = Array.from({ length: 32 }, (_, i) => (i * 37 + 11) % 64);

// calls, hits. The memo is filled in either way -- when the cache is off it is
// never read, so it ends up holding exactly the distinct subproblems.
const stats = { calls: 0, hits: 0 };

function fib(n: number, memo: Map<number, number>, useCache: boolean): number {
  stats.calls++;
  const seen = memo.get(n);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  const value = n < 2 ? n : fib(n - 1, memo, useCache) + fib(n - 2, memo, useCache);
  memo.set(n, value);
  return value;
}

function mergeSort(lo: number, hi: number, memo: Map<number, number[]>, useCache: boolean): number[] {
  stats.calls++;
  const key = lo * 1000 + hi;
  const seen = memo.get(key);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let out: number[] = [];
  if (hi - lo <= 1) {
    out = VALUES.slice(lo, hi);
  } else {
    const mid = Math.floor((lo + hi) / 2);
    const left = mergeSort(lo, mid, memo, useCache);
    const right = mergeSort(mid, hi, memo, useCache);
    let i = 0;
    let j = 0;
    while (i < left.length || j < right.length) {
      if (j >= right.length || (i < left.length && left[i] <= right[j])) {
        out.push(left[i++]);
      } else {
        out.push(right[j++]);
      }
    }
  }
  memo.set(key, out);
  return out;
}

function coinChange(amount: number, memo: Map<number, number>, useCache: boolean): number {
  stats.calls++;
  const seen = memo.get(amount);
  if (useCache && seen !== undefined) {
    stats.hits++;
    return seen;
  }
  let best = -1;
  if (amount > 0) {
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = coinChange(amount - coin, memo, useCache);
        if (sub >= 0 && (best < 0 || sub + 1 < best)) best = sub + 1;
      }
    }
  } else {
    best = 0;
  }
  memo.set(amount, best);
  return best;
}

const LABELS = ["fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10"];

/** Returns [calls, hits, distinct] for each of the three recursions. */
function census(useCache: boolean): number[][] {
  const rows: number[][] = [];
  for (let r = 0; r < 3; r++) {
    stats.calls = 0;
    stats.hits = 0;
    let distinct = 0;
    if (r === 0) {
      const memo = new Map<number, number>();
      fib(25, memo, useCache);
      distinct = memo.size;
    } else if (r === 1) {
      const memo = new Map<number, number[]>();
      mergeSort(0, VALUES.length, memo, useCache);
      distinct = memo.size;
    } else {
      const memo = new Map<number, number>();
      coinChange(60, memo, useCache);
      distinct = memo.size;
    }
    rows.push([stats.calls, stats.hits, distinct]);
  }
  return rows;
}

const plain = census(false);
const cached = census(true);

const padEnd = (value: string | number, width: number): string => String(value).padEnd(width);
const pad = (value: string | number, width: number): string => String(value).padStart(width);

console.log(
  padEnd("recursion", 28) + pad("calls", 10) + pad("distinct", 10) + pad("each", 8) +
    pad("cached", 9) + pad("hits", 7)
);
for (let r = 0; r < 3; r++) {
  console.log(
    padEnd(LABELS[r], 28) + pad(plain[r][0], 10) + pad(plain[r][2], 10) +
      pad(Math.floor(plain[r][0] / plain[r][2]), 8) + pad(cached[r][0], 9) + pad(cached[r][1], 7)
  );
}
console.log();

// And the answers, so the cache is visibly not changing what is computed.
console.log(\`fib(25) = \${fib(25, new Map(), true)}\`);
console.log(\`coin change for 60 = \${coinChange(60, new Map(), true)} coins\`);
const out = mergeSort(0, VALUES.length, new Map(), true);
const reference = [...VALUES].sort((a, b) => a - b);
const sorted = out.length === reference.length && out.every((v, i) => v === reference[i]);
console.log(\`merge sort output is sorted: \${sorted ? "yes" : "no"}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.
public class Main {
    static final int[] COINS = { 1, 7, 10 };
    static final int[] VALUES = new int[32];

    // calls, hits. The memo is filled in either way -- when the cache is off it
    // is never read, so it ends up holding exactly the distinct subproblems.
    static long calls;
    static long hits;

    static long fib(int n, Map<Integer, Long> memo, boolean useCache) {
        calls++;
        if (useCache && memo.containsKey(n)) {
            hits++;
            return memo.get(n);
        }
        long value = n < 2 ? n : fib(n - 1, memo, useCache) + fib(n - 2, memo, useCache);
        memo.put(n, value);
        return value;
    }

    static List<Integer> mergeSort(int lo, int hi, Map<Integer, List<Integer>> memo, boolean useCache) {
        calls++;
        int key = lo * 1000 + hi;
        if (useCache && memo.containsKey(key)) {
            hits++;
            return memo.get(key);
        }
        List<Integer> out = new ArrayList<>();
        if (hi - lo <= 1) {
            for (int i = lo; i < hi; i++) out.add(VALUES[i]);
        } else {
            int mid = (lo + hi) / 2;
            List<Integer> left = mergeSort(lo, mid, memo, useCache);
            List<Integer> right = mergeSort(mid, hi, memo, useCache);
            int i = 0, j = 0;
            while (i < left.size() || j < right.size()) {
                if (j >= right.size() || (i < left.size() && left.get(i) <= right.get(j))) {
                    out.add(left.get(i++));
                } else {
                    out.add(right.get(j++));
                }
            }
        }
        memo.put(key, out);
        return out;
    }

    static int coinChange(int amount, Map<Integer, Integer> memo, boolean useCache) {
        calls++;
        if (useCache && memo.containsKey(amount)) {
            hits++;
            return memo.get(amount);
        }
        int best = -1;
        if (amount > 0) {
            for (int coin : COINS) {
                if (coin <= amount) {
                    int sub = coinChange(amount - coin, memo, useCache);
                    if (sub >= 0 && (best < 0 || sub + 1 < best)) best = sub + 1;
                }
            }
        } else {
            best = 0;
        }
        memo.put(amount, best);
        return best;
    }

    static final String[] LABELS = { "fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10" };

    /** Returns {calls, hits, distinct} for each of the three recursions. */
    static long[][] census(boolean useCache) {
        long[][] rows = new long[3][3];
        for (int r = 0; r < 3; r++) {
            calls = 0;
            hits = 0;
            int distinct;
            if (r == 0) {
                Map<Integer, Long> memo = new HashMap<>();
                fib(25, memo, useCache);
                distinct = memo.size();
            } else if (r == 1) {
                Map<Integer, List<Integer>> memo = new HashMap<>();
                mergeSort(0, VALUES.length, memo, useCache);
                distinct = memo.size();
            } else {
                Map<Integer, Integer> memo = new HashMap<>();
                coinChange(60, memo, useCache);
                distinct = memo.size();
            }
            rows[r] = new long[] { calls, hits, distinct };
        }
        return rows;
    }

    public static void main(String[] args) {
        for (int i = 0; i < VALUES.length; i++) VALUES[i] = (i * 37 + 11) % 64;

        long[][] plain = census(false);
        long[][] cached = census(true);

        System.out.printf("%-28s%10s%10s%8s%9s%7s%n",
            "recursion", "calls", "distinct", "each", "cached", "hits");
        for (int r = 0; r < 3; r++) {
            System.out.printf("%-28s%10d%10d%8d%9d%7d%n", LABELS[r], plain[r][0], plain[r][2],
                plain[r][0] / plain[r][2], cached[r][0], cached[r][1]);
        }
        System.out.println();

        // And the answers, so the cache is visibly not changing what is computed.
        System.out.printf("fib(25) = %d%n", fib(25, new HashMap<>(), true));
        System.out.printf("coin change for 60 = %d coins%n", coinChange(60, new HashMap<>(), true));
        List<Integer> out = mergeSort(0, VALUES.length, new HashMap<>(), true);
        int[] reference = VALUES.clone();
        java.util.Arrays.sort(reference);
        boolean sorted = out.size() == reference.length;
        for (int i = 0; sorted && i < reference.length; i++) if (out.get(i) != reference[i]) sorted = false;
        System.out.printf("merge sort output is sorted: %s%n", sorted ? "yes" : "no");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static const std::array<int, 3> COINS = {1, 7, 10};
static std::array<int, 32> VALUES{};

// calls, hits. The memo is filled in either way -- when the cache is off it is
// never read, so it ends up holding exactly the distinct subproblems.
static std::int64_t calls = 0;
static std::int64_t hits = 0;

std::int64_t fib(int n, std::map<int, std::int64_t> &memo, bool useCache) {
    calls++;
    if (useCache) {
        auto it = memo.find(n);
        if (it != memo.end()) {
            hits++;
            return it->second;
        }
    }
    std::int64_t value = n < 2 ? n : fib(n - 1, memo, useCache) + fib(n - 2, memo, useCache);
    memo[n] = value;
    return value;
}

std::vector<int> mergeSort(int lo, int hi, std::map<int, std::vector<int>> &memo, bool useCache) {
    calls++;
    int key = lo * 1000 + hi;
    if (useCache) {
        auto it = memo.find(key);
        if (it != memo.end()) {
            hits++;
            return it->second;
        }
    }
    std::vector<int> out;
    if (hi - lo <= 1) {
        for (int i = lo; i < hi; i++) out.push_back(VALUES[i]);
    } else {
        int mid = (lo + hi) / 2;
        std::vector<int> left = mergeSort(lo, mid, memo, useCache);
        std::vector<int> right = mergeSort(mid, hi, memo, useCache);
        size_t i = 0, j = 0;
        while (i < left.size() || j < right.size()) {
            if (j >= right.size() || (i < left.size() && left[i] <= right[j])) {
                out.push_back(left[i++]);
            } else {
                out.push_back(right[j++]);
            }
        }
    }
    memo[key] = out;
    return out;
}

int coinChange(int amount, std::map<int, int> &memo, bool useCache) {
    calls++;
    if (useCache) {
        auto it = memo.find(amount);
        if (it != memo.end()) {
            hits++;
            return it->second;
        }
    }
    int best = -1;
    if (amount > 0) {
        for (int coin : COINS) {
            if (coin <= amount) {
                int sub = coinChange(amount - coin, memo, useCache);
                if (sub >= 0 && (best < 0 || sub + 1 < best)) best = sub + 1;
            }
        }
    } else {
        best = 0;
    }
    memo[amount] = best;
    return best;
}

static const std::array<std::string, 3> LABELS = {"fib(25)", "merge sort, 32 items",
                                                  "coin change, 60 from 1/7/10"};

// Returns {calls, hits, distinct} for each of the three recursions.
std::array<std::array<std::int64_t, 3>, 3> census(bool useCache) {
    std::array<std::array<std::int64_t, 3>, 3> rows{};
    for (int r = 0; r < 3; r++) {
        calls = 0;
        hits = 0;
        std::int64_t distinct = 0;
        if (r == 0) {
            std::map<int, std::int64_t> memo;
            fib(25, memo, useCache);
            distinct = static_cast<std::int64_t>(memo.size());
        } else if (r == 1) {
            std::map<int, std::vector<int>> memo;
            mergeSort(0, static_cast<int>(VALUES.size()), memo, useCache);
            distinct = static_cast<std::int64_t>(memo.size());
        } else {
            std::map<int, int> memo;
            coinChange(60, memo, useCache);
            distinct = static_cast<std::int64_t>(memo.size());
        }
        rows[r] = {calls, hits, distinct};
    }
    return rows;
}

int main() {
    for (size_t i = 0; i < VALUES.size(); i++) VALUES[i] = static_cast<int>((i * 37 + 11) % 64);

    auto plain = census(false);
    auto cached = census(true);

    std::cout << std::left << std::setw(28) << "recursion" << std::right << std::setw(10) << "calls"
              << std::setw(10) << "distinct" << std::setw(8) << "each" << std::setw(9) << "cached"
              << std::setw(7) << "hits" << "\\n";
    for (int r = 0; r < 3; r++) {
        std::cout << std::left << std::setw(28) << LABELS[r] << std::right << std::setw(10) << plain[r][0]
                  << std::setw(10) << plain[r][2] << std::setw(8) << plain[r][0] / plain[r][2]
                  << std::setw(9) << cached[r][0] << std::setw(7) << cached[r][1] << "\\n";
    }
    std::cout << "\\n";

    // And the answers, so the cache is visibly not changing what is computed.
    std::map<int, std::int64_t> fibMemo;
    std::cout << "fib(25) = " << fib(25, fibMemo, true) << "\\n";
    std::map<int, int> coinMemo;
    std::cout << "coin change for 60 = " << coinChange(60, coinMemo, true) << " coins\\n";
    std::map<int, std::vector<int>> sortMemo;
    std::vector<int> out = mergeSort(0, static_cast<int>(VALUES.size()), sortMemo, true);
    std::vector<int> reference(VALUES.begin(), VALUES.end());
    std::sort(reference.begin(), reference.end());
    std::cout << "merge sort output is sorted: " << (out == reference ? "yes" : "no") << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.
use std::collections::HashMap;

const COINS: [usize; 3] = [1, 7, 10];

// calls, hits. The memo is filled in either way -- when the cache is off it is
// never read, so it ends up holding exactly the distinct subproblems.
struct Stats {
    calls: i64,
    hits: i64,
}

fn fib(n: usize, memo: &mut HashMap<usize, i64>, use_cache: bool, st: &mut Stats) -> i64 {
    st.calls += 1;
    if use_cache {
        if let Some(&v) = memo.get(&n) {
            st.hits += 1;
            return v;
        }
    }
    let value = if n < 2 {
        n as i64
    } else {
        fib(n - 1, memo, use_cache, st) + fib(n - 2, memo, use_cache, st)
    };
    memo.insert(n, value);
    value
}

fn merge_sort(
    lo: usize, hi: usize, values: &[i32], memo: &mut HashMap<usize, Vec<i32>>,
    use_cache: bool, st: &mut Stats,
) -> Vec<i32> {
    st.calls += 1;
    let key = lo * 1000 + hi;
    if use_cache {
        if let Some(v) = memo.get(&key) {
            st.hits += 1;
            return v.clone();
        }
    }
    let mut out: Vec<i32> = Vec::new();
    if hi - lo <= 1 {
        out.extend_from_slice(&values[lo..hi]);
    } else {
        let mid = (lo + hi) / 2;
        let left = merge_sort(lo, mid, values, memo, use_cache, st);
        let right = merge_sort(mid, hi, values, memo, use_cache, st);
        let (mut i, mut j) = (0usize, 0usize);
        while i < left.len() || j < right.len() {
            if j >= right.len() || (i < left.len() && left[i] <= right[j]) {
                out.push(left[i]);
                i += 1;
            } else {
                out.push(right[j]);
                j += 1;
            }
        }
    }
    memo.insert(key, out.clone());
    out
}

fn coin_change(amount: usize, memo: &mut HashMap<usize, i32>, use_cache: bool, st: &mut Stats) -> i32 {
    st.calls += 1;
    if use_cache {
        if let Some(&v) = memo.get(&amount) {
            st.hits += 1;
            return v;
        }
    }
    let mut best = -1;
    if amount > 0 {
        for &coin in COINS.iter() {
            if coin <= amount {
                let sub = coin_change(amount - coin, memo, use_cache, st);
                if sub >= 0 && (best < 0 || sub + 1 < best) {
                    best = sub + 1;
                }
            }
        }
    } else {
        best = 0;
    }
    memo.insert(amount, best);
    best
}

const LABELS: [&str; 3] = ["fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10"];

/// Returns (calls, hits, distinct) for each of the three recursions.
fn census(values: &[i32], use_cache: bool) -> [(i64, i64, i64); 3] {
    let mut rows = [(0i64, 0i64, 0i64); 3];
    for r in 0..3 {
        let mut st = Stats { calls: 0, hits: 0 };
        let distinct = match r {
            0 => {
                let mut memo: HashMap<usize, i64> = HashMap::new();
                fib(25, &mut memo, use_cache, &mut st);
                memo.len()
            }
            1 => {
                let mut memo: HashMap<usize, Vec<i32>> = HashMap::new();
                merge_sort(0, values.len(), values, &mut memo, use_cache, &mut st);
                memo.len()
            }
            _ => {
                let mut memo: HashMap<usize, i32> = HashMap::new();
                coin_change(60, &mut memo, use_cache, &mut st);
                memo.len()
            }
        };
        rows[r] = (st.calls, st.hits, distinct as i64);
    }
    rows
}

fn main() {
    let values: Vec<i32> = (0..32).map(|i| ((i * 37 + 11) % 64) as i32).collect();

    let plain = census(&values, false);
    let cached = census(&values, true);

    println!("{:<28}{:>10}{:>10}{:>8}{:>9}{:>7}",
        "recursion", "calls", "distinct", "each", "cached", "hits");
    for r in 0..3 {
        println!("{:<28}{:>10}{:>10}{:>8}{:>9}{:>7}",
            LABELS[r], plain[r].0, plain[r].2, plain[r].0 / plain[r].2, cached[r].0, cached[r].1);
    }
    println!();

    // And the answers, so the cache is visibly not changing what is computed.
    let mut st = Stats { calls: 0, hits: 0 };
    let mut fib_memo: HashMap<usize, i64> = HashMap::new();
    println!("fib(25) = {}", fib(25, &mut fib_memo, true, &mut st));
    let mut coin_memo: HashMap<usize, i32> = HashMap::new();
    println!("coin change for 60 = {} coins", coin_change(60, &mut coin_memo, true, &mut st));
    let mut sort_memo: HashMap<usize, Vec<i32>> = HashMap::new();
    let out = merge_sort(0, values.len(), &values, &mut sort_memo, true, &mut st);
    let mut reference = values.clone();
    reference.sort();
    println!("merge sort output is sorted: {}", if out == reference { "yes" } else { "no" });
}
`,
            },
            {
              lang: "go",
              code: `// "Overlapping" is a measurement, not an adjective. Run three recursions, give
// every subproblem a name, and count how many times each name is asked for. The
// same cache is bolted onto all three, and only two of them ever get a hit.
package main

import (
	"fmt"
	"sort"
)

var COINS = []int{1, 7, 10}
var VALUES [32]int

// calls, hits. The memo is filled in either way -- when the cache is off it is
// never read, so it ends up holding exactly the distinct subproblems.
var calls int64
var hits int64

func fib(n int, memo map[int]int64, useCache bool) int64 {
	calls++
	if useCache {
		if v, ok := memo[n]; ok {
			hits++
			return v
		}
	}
	var value int64
	if n < 2 {
		value = int64(n)
	} else {
		value = fib(n-1, memo, useCache) + fib(n-2, memo, useCache)
	}
	memo[n] = value
	return value
}

func mergeSort(lo, hi int, memo map[int][]int, useCache bool) []int {
	calls++
	key := lo*1000 + hi
	if useCache {
		if v, ok := memo[key]; ok {
			hits++
			return v
		}
	}
	var out []int
	if hi-lo <= 1 {
		for i := lo; i < hi; i++ {
			out = append(out, VALUES[i])
		}
	} else {
		mid := (lo + hi) / 2
		left := mergeSort(lo, mid, memo, useCache)
		right := mergeSort(mid, hi, memo, useCache)
		i, j := 0, 0
		for i < len(left) || j < len(right) {
			if j >= len(right) || (i < len(left) && left[i] <= right[j]) {
				out = append(out, left[i])
				i++
			} else {
				out = append(out, right[j])
				j++
			}
		}
	}
	memo[key] = out
	return out
}

func coinChange(amount int, memo map[int]int, useCache bool) int {
	calls++
	if useCache {
		if v, ok := memo[amount]; ok {
			hits++
			return v
		}
	}
	best := -1
	if amount > 0 {
		for _, coin := range COINS {
			if coin <= amount {
				sub := coinChange(amount-coin, memo, useCache)
				if sub >= 0 && (best < 0 || sub+1 < best) {
					best = sub + 1
				}
			}
		}
	} else {
		best = 0
	}
	memo[amount] = best
	return best
}

var LABELS = []string{"fib(25)", "merge sort, 32 items", "coin change, 60 from 1/7/10"}

// Returns {calls, hits, distinct} for each of the three recursions.
func census(useCache bool) [3][3]int64 {
	var rows [3][3]int64
	for r := 0; r < 3; r++ {
		calls, hits = 0, 0
		distinct := 0
		switch r {
		case 0:
			memo := map[int]int64{}
			fib(25, memo, useCache)
			distinct = len(memo)
		case 1:
			memo := map[int][]int{}
			mergeSort(0, len(VALUES), memo, useCache)
			distinct = len(memo)
		default:
			memo := map[int]int{}
			coinChange(60, memo, useCache)
			distinct = len(memo)
		}
		rows[r] = [3]int64{calls, hits, int64(distinct)}
	}
	return rows
}

func main() {
	for i := range VALUES {
		VALUES[i] = (i*37 + 11) % 64
	}

	plain := census(false)
	cached := census(true)

	fmt.Printf("%-28s%10s%10s%8s%9s%7s\\n", "recursion", "calls", "distinct", "each", "cached", "hits")
	for r := 0; r < 3; r++ {
		fmt.Printf("%-28s%10d%10d%8d%9d%7d\\n", LABELS[r], plain[r][0], plain[r][2],
			plain[r][0]/plain[r][2], cached[r][0], cached[r][1])
	}
	fmt.Println()

	// And the answers, so the cache is visibly not changing what is computed.
	fmt.Printf("fib(25) = %d\\n", fib(25, map[int]int64{}, true))
	fmt.Printf("coin change for 60 = %d coins\\n", coinChange(60, map[int]int{}, true))
	out := mergeSort(0, len(VALUES), map[int][]int{}, true)
	reference := append([]int{}, VALUES[:]...)
	sort.Ints(reference)
	sorted := len(out) == len(reference)
	for i := 0; sorted && i < len(reference); i++ {
		if out[i] != reference[i] {
			sorted = false
		}
	}
	answer := "no"
	if sorted {
		answer = "yes"
	}
	fmt.Printf("merge sort output is sorted: %s\\n", answer)
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Recursion plus a table is not automatically dynamic programming",
          body: "Memoising merge sort produces a program that is recursive, has a table, has optimal substructure, and is not a dynamic program by any useful definition \u2014 the table is pure overhead, as the zero in its hits column says. The word that distinguishes them is *overlapping*, and it is a measurement you can take in about six lines.",
        },
        {
          title: "The state space is your complexity estimate, and it comes first",
          body: "Because every distinct state is computed once, the running time is the number of states times the work per state. That means you can price a DP before implementing it, from the state definition alone. If the price is already too high \u2014 `2^n` subsets when n is 40 \u2014 the answer is a different state, and finding that out costs a minute rather than an afternoon.",
        },
      ],
    },
    {
      id: "the-checklist",
      heading: "Running the test on a problem you have not seen",
      body: [
        "None of this requires a flash of insight, which is the point of running it as a checklist on a problem you have never seen.",
        "**Write the brute-force recursion first.** You cannot diagnose a recursion you have not written, and the attempt to write one is what forces you to say out loud what a subproblem even is. Lesson 2 takes this seriously enough to do nothing else.",
        "**Name the arguments that actually vary.** Those arguments, and only those, are the state. An argument that is the same on every call \u2014 the coin list, the input array \u2014 is not part of the state and does not belong in the memo key.",
        "**Count the distinct states.** If the count is about the same as the number of calls, the subproblems partition and you have divide and conquer. If it is much smaller, you have overlap, and the ratio is roughly the speedup waiting for you.",
        "**Ask whether one number per state is enough.** Hand yourself the answer to a subproblem as a single value and try to build the level above out of it. If you catch yourself also wanting to know \"and which things did it use\", the state is too small and the substructure will not close \u2014 enlarge the state, or accept that this is not a DP.",
        "**Then read the state count as the running time.** The cost of a dynamic program is the number of states multiplied by the work per state, and both are things you can count before writing a line. `n` states with `O(1)` transitions is `O(n)`; `n * amount` states with a loop over `k` coins is `O(n * amount * k)`. If that number is larger than the constraints allow, the state is wrong and no amount of implementation care will fix it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes a problem a dynamic programming problem?",
      answer:
        "Two properties together, and neither alone is enough. Overlapping subproblems: the natural recursion asks the same question more than once, which is a thing you can measure by counting distinct argument tuples against total calls. And optimal substructure: the best answer to the whole is built out of best answers to the parts, so a cached sub-answer is reusable no matter which larger question asked for it. Without overlap you have divide and conquer and a cache that never hits \u2014 memoised merge sort takes exactly zero hits. Without optimal substructure you have a cache that hits often and returns numbers that are not answers to anything.",
    },
    {
      question: "Shortest path is a dynamic program and longest simple path is not, on the same graph. What is the difference?",
      answer:
        "The sub-answer for shortest path is complete: the distance from A to C is one number, and any longer route through C can be improved by splicing in that shorter one, so it composes. The sub-answer for longest simple path is not complete, because extending it legally depends on which vertices it already used, and a single number has forgotten them. Concretely, the longest A-to-E path may run A-D-B-C-E; adding the edge EC to it gives an arithmetically correct 21 that corresponds to no path at all. The repair is to enlarge the state to include the visited set, which restores the property and costs you 2^n states \u2014 so it is genuinely a DP, just an exponential one.",
    },
    {
      question: "Merge sort is recursive and has optimal substructure. Why is it not dynamic programming?",
      answer:
        "Because its subproblems partition rather than overlap. Sorting `[0, 16)` splits into `[0, 8)` and `[8, 16)`, which share nothing, so no subproblem is ever requested twice and there is nothing for a cache to return. Instrumenting it makes this unambiguous \u2014 63 calls, 63 distinct subproblems, 0 cache hits. Dynamic programming and divide and conquer both rely on optimal substructure; what separates them is whether the recursion tree repeats itself, and that is the property worth measuring first.",
    },
  ],
  takeaways: [
    "Dynamic programming is a diagnosis about a recursion you already wrote, not a technique you apply from the start.",
    "The two preconditions are overlapping subproblems and optimal substructure, and each is useless without the other.",
    "Overlap is measurable: count distinct argument tuples against total calls, and the ratio is roughly the speedup available.",
    "Naive fib(n) makes 2*fib(n+1)-1 calls, so an exponential recursion over about n distinct states costs as much as its own answer.",
    "Optimal substructure fails when a sub-answer forgets something the level above needs \u2014 for longest simple path, which vertices it used.",
    "It is a property of the state you chose, not of the problem: enlarging the state can restore it, at the price of more states.",
    "Optimal substructure without overlap is divide and conquer, and memoising it takes zero cache hits.",
    "The number of states times the work per state is the running time, so a DP can be priced before it is written.",
  ],
  status: "available",
};
