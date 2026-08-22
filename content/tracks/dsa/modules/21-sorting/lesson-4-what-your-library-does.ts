import type { Lesson } from "@/content/types";

export const librarySortLesson: Lesson = {
  id: "dsa-sort-library",
  slug: "what-your-library-sort-actually-is",
  moduleSlug: "sorting",
  title: "What Your Library Sort Actually Is",
  summary:
    "None of them is a textbook algorithm. They are hybrids that switch strategy based on size and on what the data looks like — and knowing which hybrid explains both the guarantees you get and the ones you do not.",
  estimatedMinutes: 30,
  objectives: [
    "Name the algorithm behind the standard sort in your language",
    "Explain why Java sorts primitives and objects differently",
    "Describe how introsort avoids quicksort's quadratic case",
    "Explain what TimSort exploits and why it usually wins",
  ],
  sections: [
    {
      id: "the-hybrids",
      heading: "Three hybrids, and what each optimises for",
      body: [
        "**TimSort** — Python's `sorted`, Java's `Arrays.sort` on objects, JavaScript's `Array.sort` in V8. Finds existing ascending or descending **runs** in the data, extends short ones with insertion sort, then merges runs using a stack with balancing rules. Stable, O(n log n) worst case, and **O(n) on data that is already sorted or nearly so**. Built on the observation that real-world data usually has structure.",
        "**Introsort** — C++'s `std::sort`. Quicksort, with two escape hatches: below about 16 elements it switches to insertion sort, and if the recursion goes deeper than roughly `2·log n` it concludes the pivots are pathological and switches to heap sort. That converts quicksort's O(n²) worst case into a guaranteed O(n log n) while keeping quicksort's speed on ordinary input. Not stable.",
        "**Dual-pivot quicksort** — Java's `Arrays.sort` on primitives. Partitions into three regions around two pivots rather than two around one, which measures faster on primitive arrays. Not stable, but for primitives stability is unobservable, so nothing is lost.",
        "**pdqsort** — Rust's `sort_unstable`, and newer C++ implementations. Pattern-defeating quicksort: detects the input patterns that make quicksort degrade and handles each specially.",
      ],
      examples: [
        {
          id: "java-two-sorts",
          title: "Java has two sorts, and picks by type",
          lang: "java",
          code: `import java.util.*;

public class Main {
    record Entry(String name, int score) { }

    public static void main(String[] args) {
        List<Entry> data = new ArrayList<>(List.of(
            new Entry("cy", 30), new Entry("ana", 25),
            new Entry("bob", 30), new Entry("dee", 25)));

        // Objects: TimSort, and stable by contract.
        List<Entry> byScore = new ArrayList<>(data);
        byScore.sort(Comparator.comparingInt(Entry::score));
        System.out.println("objects, by score: " + names(byScore));

        // Primitives: dual-pivot quicksort, and stability is unobservable.
        int[] prims = {5, 3, 9, 1, 3};
        Arrays.sort(prims);
        System.out.println("primitives:        " + Arrays.toString(prims));
    }

    static List<String> names(List<Entry> xs) {
        List<String> out = new ArrayList<>();
        for (Entry e : xs) out.add(e.name());
        return out;
    }
}`,
          output: `objects, by score: [ana, dee, cy, bob]
primitives:        [1, 3, 3, 5, 9]`,
          explanation:
            "`cy` before `bob` among the 30s is TimSort's stability preserving input order. The primitive array uses a completely different algorithm — dual-pivot quicksort — chosen because primitives cannot carry hidden data, so stability buys nothing and raw speed is all that matters. The two overloads of the same method name are two different algorithms with two different guarantee sets.",
        },
      ],
    },
    {
      id: "the-quadratic-case",
      heading: "The quadratic worst case, and who still has it",
      body: [
        "Textbook quicksort is O(n²) when pivots split badly, and the classic trigger — already-sorted input with a first-element pivot — is depressingly common in practice.",
        "Modern library sorts have mostly closed this. Introsort switches to heap sort on deep recursion. TimSort was never quicksort. Dual-pivot quicksort in Java is still theoretically quadratic on adversarial input, and there are known inputs that trigger it, though you will not meet them by accident.",
        "The place this genuinely bites is **C++ competitive programming**, where `std::sort` on `int` was historically attackable with a crafted anti-quicksort test. The standard defence is shuffling before sorting — `std::shuffle` with a random seed — which destroys any adversarial arrangement for the cost of one linear pass.",
        "The other place is `unordered_map` and friends, which is the hashing module's territory. The shared lesson is that a public deterministic algorithm can be gamed, and the fix is nearly always to inject randomness.",
      ],
      pitfalls: [
        {
          title: "Assuming Arrays.sort is one algorithm",
          body: "`Arrays.sort(int[])` and `Arrays.sort(Object[])` are different algorithms with different stability guarantees. Boxing an `int[]` to `Integer[]` to get stability is a real technique with a real cost — and needing it is usually a sign the compound key should have been in the comparator.",
        },
        {
          title: "Expecting O(n log n) from a custom comparator",
          body: "The bound counts comparisons. An expensive comparator multiplies the whole cost, and one that allocates on every call can dominate the sort entirely. If a sort is unexpectedly slow, profile the comparator before the algorithm.",
        },
        {
          title: "Sorting to find one element",
          body: "Sorting to get the maximum is O(n log n) for something a linear scan does in O(n). For the k-th largest, quickselect is O(n) average and a size-k heap is O(n log k). Sorting is the reflex answer and frequently one complexity class too slow.",
        },
      ],
    },
    {
      id: "practical",
      heading: "What to do with this",
      body: [
        "**Use the library sort.** It is a hybrid tuned by people who measured, and hand-rolling a textbook quicksort is a downgrade in every respect.",
        "**Know its stability.** Stable in Python, Java on objects, JavaScript, Rust's `sort`. Unstable in C++'s `std::sort`, Java on primitives, Rust's `sort_unstable`. This is the fact most likely to change your output.",
        "**Know the escape hatch.** `std::stable_sort` when you need stability in C++; `sort_unstable` when you want speed and do not in Rust.",
        "**Say it in interviews.** Asked how you would sort, \"I would call the library sort — TimSort in Python, which is stable and adaptive\" is a stronger answer than reciting merge sort, and it opens the door to discussing when you would not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What algorithm does your language's sort use?",
      answer:
        "Python and Java-on-objects use TimSort: run detection plus merging, stable, O(n log n) worst case and O(n) on nearly-sorted data. C++ uses introsort: quicksort that falls back to heap sort on deep recursion and insertion sort when small, not stable. Java sorts primitives with dual-pivot quicksort, because stability is unobservable there.",
    },
    {
      question: "How does introsort avoid quicksort's quadratic worst case?",
      answer:
        "It tracks recursion depth. Past roughly 2·log n it concludes the pivots are degenerate and switches to heap sort, which is O(n log n) guaranteed. That caps the worst case while keeping quicksort's speed on ordinary input.",
    },
    {
      question: "Why is Java's Arrays.sort stable for objects but not for primitives?",
      answer:
        "Primitives carry no data outside their value, so two equal ints are indistinguishable and stability is unobservable — which frees the implementation to use the faster dual-pivot quicksort. Objects can carry unexamined fields, so order among equals is observable and TimSort's stability is part of the contract.",
    },
  ],
  takeaways: [
    "Library sorts are hybrids, not textbook algorithms",
    "TimSort exploits existing runs — O(n) on nearly-sorted data",
    "Introsort is quicksort with heap-sort and insertion-sort escape hatches",
    "Java picks a different algorithm for primitives than for objects",
    "std::sort is unstable; std::stable_sort is the one that is not",
    "Sorting to find one element is usually a complexity class too slow",
  ],
  status: "available",
};
