import type { Lesson } from "@/content/types";

export const asteriskOnO1Lesson: Lesson = {
  id: "dsa-hash-worst-case",
  slug: "why-o1-is-average-not-worst-case",
  moduleSlug: "hashing",
  title: "The Asterisk on O(1)",
  summary:
    "Average-case O(1) is a statement about how keys spread, not a promise. When every key lands in one bucket the map is a linked list — and on a judge, that can be arranged deliberately.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why hash map operations are average-case and not worst-case O(1)",
    "Quantify how badly an all-collide table degrades",
    "Recognise a hash-collision attack on a judge or a server",
    "Name the defences: treeification, randomised seeds, and sorted fallbacks",
  ],
  sections: [
    {
      id: "the-degenerate-case",
      heading: "When every key lands in one bucket",
      body: [
        "A hash map's O(1) rests on chains staying short. Take that away and the structure underneath is exposed: a bucket is a list, and a list is searched linearly.",
        "The cost is not slightly worse. Inserting n keys into one bucket compares against everything already there — 0, then 1, then 2 — which totals `n(n-1)/2` comparisons. Quadratic.",
      ],
      examples: [
        {
          id: "collision-cost",
          title: "Counting the comparisons, not the milliseconds",
          lang: "python",
          code: `def probes(hash_fn, n, buckets=64):
    """Equality checks needed to insert n distinct keys, chaining on collision."""
    table = [[] for _ in range(buckets)]
    checks = 0
    for i in range(n):
        chain = table[hash_fn(i) % buckets]
        checks += len(chain)          # compared against everything already there
        chain.append(i)
    return checks

spread = lambda i: i * 2654435761
same = lambda i: 0

for n in (64, 256, 1024):
    print(f"n={n:5d}  spread={probes(spread, n):7d}  all-collide={probes(same, n):9d}")`,
          output: `n=   64  spread=      0  all-collide=     2016
n=  256  spread=    384  all-collide=    32640
n= 1024  spread=   7680  all-collide=   523776`,
          explanation:
            "Counting comparisons rather than timing makes this reproducible — the same numbers on any machine. The all-collide column is exactly `n(n-1)/2`: 1024 × 1023 ÷ 2 = 523,776. The spread column grows linearly with n once the table is full, because chains stay a constant few entries long. At n=1024 the ratio is already 68×, and it keeps widening.",
          alternates: [
            {
              lang: "javascript",
              code: `// Equality checks needed to insert n distinct keys, chaining on collision.
const padL = (v, w) => String(v).padStart(w);

function probes(hashFn, n, buckets = 64) {
  const table = Array.from({ length: buckets }, () => []);
  let checks = 0;
  for (let i = 0; i < n; i++) {
    const chain = table[hashFn(i) % buckets];
    checks += chain.length;        // compared against everything already there
    chain.push(i);
  }
  return checks;
}

const spread = (i) => i * 2654435761;
const same = () => 0;

for (const n of [64, 256, 1024]) {
  console.log(
    \`n=\${padL(n, 5)}  spread=\${padL(probes(spread, n), 7)}  all-collide=\${padL(probes(same, n), 9)}\`
  );
}`,
            },
            {
              lang: "typescript",
              code: `// Equality checks needed to insert n distinct keys, chaining on collision.
const padL = (v: number, w: number): string => String(v).padStart(w);

function probes(hashFn: (i: number) => number, n: number, buckets = 64): number {
  const table: number[][] = Array.from({ length: buckets }, () => []);
  let checks = 0;
  for (let i = 0; i < n; i++) {
    const chain = table[hashFn(i) % buckets];
    checks += chain.length;        // compared against everything already there
    chain.push(i);
  }
  return checks;
}

const spread = (i: number): number => i * 2654435761;
const same = (): number => 0;

for (const n of [64, 256, 1024]) {
  console.log(
    \`n=\${padL(n, 5)}  spread=\${padL(probes(spread, n), 7)}  all-collide=\${padL(probes(same, n), 9)}\`
  );
}`,
            },
            {
              lang: "java",
              code: `import java.util.*;
import java.util.function.LongUnaryOperator;

public class Main {
    /** Equality checks needed to insert n distinct keys, chaining on collision. */
    static long probes(LongUnaryOperator hashFn, int n, int buckets) {
        List<List<Integer>> table = new ArrayList<>();
        for (int i = 0; i < buckets; i++) table.add(new ArrayList<>());
        long checks = 0;
        for (int i = 0; i < n; i++) {
            List<Integer> chain = table.get((int) (hashFn.applyAsLong(i) % buckets));
            checks += chain.size();     // compared against everything already there
            chain.add(i);
        }
        return checks;
    }

    public static void main(String[] args) {
        // long, not int: i * 2654435761 leaves 32 bits behind well before n = 1024.
        LongUnaryOperator spread = i -> i * 2654435761L;
        LongUnaryOperator same = i -> 0L;

        for (int n : new int[]{64, 256, 1024}) {
            System.out.printf("n=%5d  spread=%7d  all-collide=%9d%n",
                    n, probes(spread, n, 64), probes(same, n, 64));
        }
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <functional>
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

// Equality checks needed to insert n distinct keys, chaining on collision.
long long probes(const function<long long(int)>& hashFn, int n, int buckets = 64) {
    vector<vector<int>> table(buckets);
    long long checks = 0;
    for (int i = 0; i < n; i++) {
        auto& chain = table[hashFn(i) % buckets];
        checks += (long long)chain.size();   // compared against everything there
        chain.push_back(i);
    }
    return checks;
}

int main() {
    // long long, not int: i * 2654435761 leaves 32 bits behind well before n = 1024.
    auto spread = [](int i) { return (long long)i * 2654435761LL; };
    auto same = [](int) { return 0LL; };

    for (int n : {64, 256, 1024}) {
        cout << "n=" << setw(5) << n
             << "  spread=" << setw(7) << probes(spread, n)
             << "  all-collide=" << setw(9) << probes(same, n) << "\\n";
    }
}`,
            },
            {
              lang: "rust",
              code: `/// Equality checks needed to insert n distinct keys, chaining on collision.
fn probes(hash_fn: impl Fn(i64) -> i64, n: i64, buckets: i64) -> i64 {
    let mut table: Vec<Vec<i64>> = vec![Vec::new(); buckets as usize];
    let mut checks = 0;
    for i in 0..n {
        let chain = &mut table[(hash_fn(i) % buckets) as usize];
        checks += chain.len() as i64; // compared against everything already there
        chain.push(i);
    }
    checks
}

fn main() {
    // i64, not i32: i * 2654435761 leaves 32 bits behind well before n = 1024.
    let spread = |i: i64| i * 2654435761;
    let same = |_: i64| 0;

    for n in [64i64, 256, 1024] {
        println!(
            "n={:5}  spread={:7}  all-collide={:9}",
            n,
            probes(spread, n, 64),
            probes(same, n, 64)
        );
    }
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

// Equality checks needed to insert n distinct keys, chaining on collision.
func probes(hashFn func(int) int, n, buckets int) int {
	table := make([][]int, buckets)
	checks := 0
	for i := 0; i < n; i++ {
		b := hashFn(i) % buckets
		checks += len(table[b]) // compared against everything already there
		table[b] = append(table[b], i)
	}
	return checks
}

func main() {
	// Go's int is 64-bit here, so i * 2654435761 does not wrap.
	spread := func(i int) int { return i * 2654435761 }
	same := func(int) int { return 0 }

	for _, n := range []int{64, 256, 1024} {
		fmt.Printf("n=%5d  spread=%7d  all-collide=%9d\\n", n, probes(spread, n, 64), probes(same, n, 64))
	}
}`,
            },
          ],
        },
      ],
      visual: {
        id: "hash-collide",
        kind: "hash-table",
        title: "Watch a chain grow when keys share a bucket",
        words: ["ana", "cy", "gus", "fay", "bob", "dee"],
      },
    },
    {
      id: "adversarial",
      heading: "This can be arranged on purpose",
      body: [
        "If the hash function is public and deterministic, anyone can compute a set of keys that all collide. That is a **hash-collision attack**, and it was a real vulnerability across most web frameworks in 2011: a POST body of a few thousand crafted parameter names turned form parsing into a quadratic loop and pinned a CPU.",
        "The same trick appears in competitive programming. A problem with anti-hash tests can push `unordered_map<int,int>` in C++ into its worst case, because its hash for integers is famously the identity and its bucket count is a known prime. Solutions that pass locally then time out on the judge.",
        "The defences are worth knowing by name.",
        "**Randomised seeds.** Python salts string hashing per process, so the collision set is not predictable across runs. This is why `hash(\"a\")` differs between Python processes and why you must never persist a hash value.",
        "**Treeification.** Java 8+ converts a bucket to a balanced tree once its chain passes eight entries, turning the worst case from O(n) into O(log n) for keys that are comparable.",
        "**Pick your own hash.** In C++ competitive code the standard fix is a custom hash mixing the key with a random constant, or simply using `map` — O(log n) guaranteed — when n is small enough that the log does not matter.",
      ],
      pitfalls: [
        {
          title: "Quoting O(1) without the qualifier in an interview",
          body: "\"Hash map lookup is O(1)\" invites the follow-up \"always?\". The complete answer is average-case O(1), worst-case O(n), with the worst case reachable when hashes collide — and Java mitigates it by treeifying long chains. Volunteering the caveat reads as understanding rather than recall.",
        },
        {
          title: "Persisting or transmitting a hash value",
          body: "`hashCode` and `hash()` are not stable across processes, versions or platforms. Python randomises string hashes per run by default. A hash is a bucket index, not an identifier — if you need a stable fingerprint, use a real digest such as SHA-256.",
        },
        {
          title: "Assuming the worst case cannot happen to you",
          body: "It does not need an attacker. Keys derived from a structured source — sequential ids multiplied by the table size, grid coordinates packed badly, strings differing only past a truncation point — can collide en masse by accident. If a map-based solution is mysteriously slow, print the bucket distribution before optimising anything else.",
        },
      ],
    },
    {
      id: "when-it-matters",
      heading: "When to actually care",
      body: [
        "For interview problems, almost never. Use the hash map, say \"average O(1)\" out loud, and move on.",
        "For a judge with anti-hash tests, it decides whether you pass. The tell is a solution that is clearly the intended complexity and still times out.",
        "For a server parsing untrusted input into a map, it is a denial-of-service vector, and the fix belongs in the framework rather than your handler.",
        "For everything else, the more common cause of a slow map is not collisions at all — it is a key type whose `hashCode` is expensive, or a map being rebuilt inside a loop that could have been built once.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Can a hash map lookup ever be O(n)?",
      answer:
        "Yes — when every key hashes to the same bucket, lookup degenerates to scanning a list. It happens by accident with a poor hash function and on purpose in a collision attack. Java 8+ treeifies chains longer than eight entries, which caps the damage at O(log n) for comparable keys.",
    },
    {
      question: "Why does Python randomise string hashes?",
      answer:
        "To make collisions unpredictable across processes, which defeats hash-collision denial-of-service attacks. The consequence is that hash values are not stable between runs and must never be persisted.",
    },
    {
      question: "Your solution is O(n) with a hash map but times out on the judge. What do you check?",
      answer:
        "Whether the tests are adversarial against the language's default hash. In C++ that means replacing `unordered_map`'s hash with one mixing in a random constant, or switching to `map` and accepting O(log n). Also check that the map is not being rebuilt inside a loop.",
    },
  ],
  takeaways: [
    "O(1) is average-case; the worst case is O(n) and is reachable",
    "All n keys in one bucket costs n(n−1)/2 comparisons — quadratic",
    "Collision attacks are real: deterministic public hashes can be gamed",
    "Defences: randomised seeds, treeified chains, custom or ordered maps",
    "Never persist a hash value — it is a bucket index, not an identifier",
    "Say \"average O(1), worst O(n)\" in interviews and pre-empt the follow-up",
  ],
  status: "available",
};
