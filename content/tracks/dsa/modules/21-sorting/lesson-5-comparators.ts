import type { Lesson } from "@/content/types";

export const comparatorsLesson: Lesson = {
  id: "dsa-sort-comparators",
  slug: "comparators-and-the-contract",
  moduleSlug: "sorting",
  title: "Comparators and the Contract",
  summary:
    "Sorting by several keys, in mixed directions, without writing a comparison by hand. And the contract every comparator has to satisfy — which subtracting two integers quietly violates.",
  estimatedMinutes: 30,
  objectives: [
    "Compose a multi-key comparator with mixed directions",
    "State the three rules a comparator must obey",
    "Explain why `a - b` is a broken comparator",
    "Sort descending without breaking stability or the contract",
  ],
  sections: [
    {
      id: "composing",
      heading: "Composing keys instead of writing comparisons",
      body: [
        "The hand-written form — check the first key, if equal check the second — is easy to get subtly wrong and hard to read. Every modern language has a compositional form instead.",
        "**Java** — `Comparator.comparingInt(Entry::score).thenComparing(Entry::name)`.",
        "**Python** — `key=lambda p: (p.score, p.name)`. A tuple compares lexicographically, which is exactly multi-key ordering.",
        "**JavaScript** — `(a, b) => a.score - b.score || a.name.localeCompare(b.name)`, using `||` to fall through on zero.",
        "**C++** — a lambda returning `tie(a.score, a.name) < tie(b.score, b.name)`.",
        "**Rust** — `v.sort_by_key(|e| (e.score, e.name.clone()))`.",
        "Mixed directions are where the tuple trick runs out. Python's usual answer is negation for numbers — `(-p.score, p.name)` — which does not work for strings; then you either do two stable passes or write the comparator with `functools.cmp_to_key`.",
      ],
      examples: [
        {
          id: "multi-key",
          title: "Two keys, two directions",
          lang: "java",
          code: `import java.util.*;

public class Main {
    record Entry(String name, int score) { }

    public static void main(String[] args) {
        List<Entry> data = new ArrayList<>(List.of(
            new Entry("cy", 30), new Entry("ana", 25),
            new Entry("bob", 30), new Entry("dee", 25)));

        List<Entry> asc = new ArrayList<>(data);
        asc.sort(Comparator.comparingInt(Entry::score).thenComparing(Entry::name));
        System.out.println("score asc, name asc:  " + names(asc));

        List<Entry> mixed = new ArrayList<>(data);
        mixed.sort(Comparator.comparingInt(Entry::score).reversed()
                             .thenComparing(Entry::name));
        System.out.println("score desc, name asc: " + names(mixed));

        System.out.println("subtraction overflows: "
            + (Integer.MIN_VALUE - 1 > 0));
    }

    static List<String> names(List<Entry> xs) {
        List<String> out = new ArrayList<>();
        for (Entry e : xs) out.add(e.name());
        return out;
    }
}`,
          output: `score asc, name asc:  [ana, dee, bob, cy]
score desc, name asc: [bob, cy, ana, dee]
subtraction overflows: true`,
          explanation:
            "Note where `.reversed()` sits. It applies to **everything composed before it**, so `comparingInt(score).reversed().thenComparing(name)` reverses only the score — the name stays ascending. Written as `comparingInt(score).thenComparing(name).reversed()` it would reverse both. The last line is the punchline of the next section: `Integer.MIN_VALUE - 1` wraps around to positive, so a subtraction-based comparator reports that the smallest possible int is greater than itself minus one.",
        },
      ],
    },
    {
      id: "the-contract",
      heading: "The contract",
      body: [
        "A comparator returns negative, zero or positive for *a before b*, *equivalent*, *a after b*. It must satisfy three rules:",
        "**Antisymmetry.** `compare(a, b)` and `compare(b, a)` must have opposite signs.",
        "**Transitivity.** If a comes before b and b before c, then a must come before c.",
        "**Transitive equality.** If a is equivalent to b and b to c, then a must be equivalent to c.",
        "Violating any of them is undefined behaviour, and the failure is not graceful. Java's TimSort detects some violations and throws `IllegalArgumentException: Comparison method violates its general contract!` — usually only on arrays past the insertion-sort threshold, so it appears on large inputs after passing every small test. C++'s `std::sort` with a bad comparator can read past the end of the array and crash.",
        "The classic violation is **`return a - b`** for integers. It is antisymmetric and transitive for small values and overflows for large ones: `Integer.MIN_VALUE - 1` wraps to positive, inverting the answer. Use `Integer.compare(a, b)`, which is the same speed and always correct.",
        "The second classic is a comparator that is not *consistent* — one whose result depends on something that changes during the sort, such as a field being mutated, or a `Math.random()` tiebreak. Both produce contract violations that look like corruption.",
      ],
      pitfalls: [
        {
          title: "return a - b",
          body: "Overflows for large or negative values and silently inverts the comparison. `Integer.compare(a, b)` in Java, `(a > b) - (a < b)` in C, `a.cmp(&b)` in Rust. There is no performance argument for the subtraction — it is the same instruction count.",
        },
        {
          title: "Comparing floats with subtraction",
          body: "Same overflow problem plus NaN. Any comparison involving NaN is false, so a NaN in the data makes the comparator non-transitive and the sort's behaviour undefined. Use the language's float comparison and decide explicitly where NaN goes.",
        },
        {
          title: "Putting reversed() in the wrong place",
          body: "It reverses everything composed so far, not just the last key. `.comparing(a).thenComparing(b).reversed()` reverses both. To reverse only one key, attach the reversal to that key: `.comparing(a, Comparator.reverseOrder()).thenComparing(b)`.",
        },
        {
          title: "Sorting descending by reversing after sorting",
          body: "Sorting ascending then reversing the list also reverses the order of equal elements, which destroys stability. Sort with a descending comparator instead — the tie order is then preserved as intended.",
        },
      ],
    },
    {
      id: "in-problems",
      heading: "Where comparators decide the problem",
      body: [
        "**Meeting rooms and interval merging** — sort by start. The whole algorithm depends on that one choice, and sorting by end instead gives a different, also-useful ordering for the greedy activity-selection problem.",
        "**Largest Number** — arrange integers to form the biggest concatenation. The comparator is `(a, b) => (b + a) - (a + b)` on the string forms, and finding it *is* the problem. Worth proving to yourself that it is transitive.",
        "**Task scheduling by deadline, k closest points, top-k by frequency** — each is a library sort plus the right comparator, and the comparator carries all the insight.",
        "**Custom alphabet ordering** — verifying an alien dictionary means comparing with a supplied ordering rather than the natural one. Same shape.",
        "The recurring lesson: when a problem is \"arrange these optimally\", the work is finding the ordering rule and then arguing it is a valid total order. The sort itself is one line.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is wrong with `return a - b` as a comparator?",
      answer:
        "Integer overflow. For large or negative values the subtraction wraps and the sign inverts, so the comparator becomes non-transitive and the sort's behaviour is undefined — Java may throw a contract violation, C++ may read out of bounds. `Integer.compare(a, b)` is correct and no slower.",
    },
    {
      question: "What three properties must a comparator satisfy?",
      answer:
        "Antisymmetry — compare(a,b) and compare(b,a) have opposite signs. Transitivity of ordering. Transitivity of equality. Breaking any of them is undefined behaviour rather than merely a wrong order.",
    },
    {
      question: "How do you sort descending without losing stability?",
      answer:
        "Use a descending comparator. Sorting ascending and reversing the result also reverses equal elements, which is exactly what stability was supposed to prevent.",
    },
  ],
  takeaways: [
    "Compose keys — thenComparing, tuple keys, tie — rather than hand-writing branches",
    "reversed() applies to everything composed before it",
    "A comparator must be antisymmetric and transitive, in order and in equality",
    "a - b overflows; use the language's compare function",
    "NaN makes float comparators non-transitive",
    "Sort descending directly — reversing afterwards destroys stability",
  ],
  status: "available",
};
