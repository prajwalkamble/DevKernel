import type { Lesson } from "@/content/types";

export const partitioningLesson: Lesson = {
  id: "dsa-arr-partition",
  slug: "one-pass-partitioning",
  moduleSlug: "arrays-and-strings",
  title: "One-Pass Partitioning & the Dutch National Flag",
  summary:
    "Three regions, three pointers, one pass — and the single line that decides whether it is correct, demonstrated by testing the wrong version twenty thousand times.",
  estimatedMinutes: 25,
  objectives: [
    "Partition into two regions with the compaction loop and a comparison predicate",
    "Maintain three regions at once with the Dutch national flag invariant",
    "Explain why the middle pointer must not advance after a swap with the top",
    "Choose between one pass and two, and say what each costs",
  ],
  sections: [
    {
      id: "two-regions",
      heading: "Two regions: the compaction loop again",
      body: [
        "Partitioning is the operation quicksort and quickselect are built from, and you already have it. **Take the compaction loop from lesson three and make the predicate a comparison against a pivot.**",
        "The only change is that partitioning *swaps* rather than copies. Compaction was throwing the rejected elements away, so overwriting them was fine; partitioning needs both halves, so the element being displaced has to go somewhere — and the somewhere is the slot the kept element vacated.",
        "The result: everything less than the pivot is left of the returned index, everything else is right of it, in one pass and O(1) space. The returned index is the size of the left region, which is exactly the `k` that compaction returned.",
      ],
      examples: [
        {
          id: "partition",
          title: "Partition around a pivot",
          lang: "java",
          code: `import java.util.*;

public class Main {
    /** Everything < pivot ends up left of the returned index; >= pivot right of it. */
    static int partition(int[] a, int pivot) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] < pivot) {
                int t = a[write]; a[write] = a[read]; a[read] = t;
                write++;
            }
        }
        return write;
    }

    public static void main(String[] args) {
        int[][] cases = {
            {7, 2, 9, 4, 1, 8, 3},
            {5, 5, 5, 5},
            {1, 2, 3, 4, 5},
            {5, 4, 3, 2, 1},
        };
        int pivot = 5;
        System.out.println("pivot = " + pivot);
        System.out.println();
        for (int[] c : cases) {
            int[] a = c.clone();
            int k = partition(a, pivot);
            System.out.printf("  %-24s -> %-24s  k=%d%n",
                    Arrays.toString(c), Arrays.toString(a), k);
            for (int i = 0; i < k; i++)
                if (a[i] >= pivot) throw new AssertionError("left side wrong");
            for (int i = k; i < a.length; i++)
                if (a[i] < pivot) throw new AssertionError("right side wrong");
        }
        System.out.println();
        System.out.println("this is the compaction loop again — the predicate is just \`< pivot\`,");
        System.out.println("and swapping instead of copying keeps the discarded half rather than losing it.");
    }
}`,
          output: `pivot = 5

  [7, 2, 9, 4, 1, 8, 3]    -> [2, 4, 1, 3, 9, 8, 7]     k=4
  [5, 5, 5, 5]             -> [5, 5, 5, 5]              k=0
  [1, 2, 3, 4, 5]          -> [1, 2, 3, 4, 5]           k=4
  [5, 4, 3, 2, 1]          -> [4, 3, 2, 1, 5]           k=4

this is the compaction loop again — the predicate is just \`< pivot\`,
and swapping instead of copying keeps the discarded half rather than losing it.`,
          explanation:
            "The checks after each case are part of the example on purpose: **the postcondition of a partition is not \"the array is sorted\", it is \"every element left of k is smaller and every element right of k is not\"**, and that is what should be asserted. Row one shows why — `[2, 4, 1, 3, 9, 8, 7]` is in no sense sorted and is a perfectly correct partition. Row two is the degenerate case worth noticing: with every element equal to the pivot, k is 0 and the whole array lands on the right, which is exactly the input that makes naive quicksort quadratic.",
        },
      ],
    },
    {
      id: "three-regions",
      heading: "Three regions at once",
      body: [
        "Now the version that earns its own name. \"Sort an array of 0s, 1s and 2s in one pass with constant space\" — the **Dutch national flag** problem, after Dijkstra, and the reason it is worth knowing is that maintaining three regions with three pointers is a genuinely different exercise from maintaining two.",
        "Three pointers, and the invariant is the whole algorithm:",
        "**`a[0 : low]` is all 0s. `a[low : mid]` is all 1s. `a[mid : high+1]` is unexamined. `a[high+1 : n]` is all 2s.**",
        "Then each value has one rule. A **0** belongs at the boundary of the 0s, so swap it to `low` and advance both `low` and `mid` — the element that came back from `low` is necessarily a 1, already in the right region. A **1** is already where it belongs, so just advance `mid`. A **2** goes to the boundary of the 2s, so swap it to `high` and decrement `high` — **and do not touch `mid`**.",
        "Loop while `mid <= high`, because `high` is inclusive: the unexamined region is empty only once `mid` has passed it.",
      ],
      examples: [
        {
          id: "dnf",
          title: "The flag, traced",
          lang: "python",
          code: `def sort_colours(a, trace=False):
    """low: end of the 0s.  mid: cursor.  high: start of the 2s."""
    low, mid, high = 0, 0, len(a) - 1
    if trace:
        print(f"  {'low':>3} {'mid':>3} {'high':>4}  {'action':<24} array")
        print("  " + "-" * 56)
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
            action = "0: swap low, both ++"
        elif a[mid] == 1:
            mid += 1
            action = "1: leave it, mid ++"
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1
            action = "2: swap high, mid stays"
        if trace:
            print(f"  {low:>3} {mid:>3} {high:>4}  {action:<24} {a}")
    return a


print("sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:")
sort_colours([2, 0, 2, 1, 1, 0], trace=True)

print()
for case in ([2, 0, 1], [0, 0, 0], [2, 2, 2], [1], [], [2, 1, 0, 2, 1, 0, 2, 1, 0]):
    before = list(case)
    print(f"  {str(before):<32} -> {sort_colours(case)}")`,
          output: `sort [2, 0, 2, 1, 1, 0] into 0s, 1s, 2s in one pass:
  low mid high  action                   array
  --------------------------------------------------------
    0   0    4  2: swap high, mid stays  [0, 0, 2, 1, 1, 2]
    1   1    4  0: swap low, both ++     [0, 0, 2, 1, 1, 2]
    2   2    4  0: swap low, both ++     [0, 0, 2, 1, 1, 2]
    2   2    3  2: swap high, mid stays  [0, 0, 1, 1, 2, 2]
    2   3    3  1: leave it, mid ++      [0, 0, 1, 1, 2, 2]
    2   4    3  1: leave it, mid ++      [0, 0, 1, 1, 2, 2]

  [2, 0, 1]                        -> [0, 1, 2]
  [0, 0, 0]                        -> [0, 0, 0]
  [2, 2, 2]                        -> [2, 2, 2]
  [1]                              -> [1]
  []                               -> []
  [2, 1, 0, 2, 1, 0, 2, 1, 0]      -> [0, 0, 0, 1, 1, 1, 2, 2, 2]`,
          explanation:
            "Rows 1 and 4 are the ones to study — `mid` does not move, and on row 1 the loop then immediately looks at the same position again and finds a 0 there. That is the algorithm working exactly as designed. Six iterations for six elements, so this really is one pass, and the loop ends when `mid` passes `high` rather than when `mid` reaches the end. The empty-list case exits without an iteration, since `high` starts at −1.",
        },
      ],
    },
    {
      id: "the-bug",
      heading: "The one line that decides whether it works",
      body: [
        "Everything above hinges on a single asymmetry that reads as arbitrary and is not.",
        "**When you swap with `low`, you advance `mid`. When you swap with `high`, you do not.**",
        "The reason is what the incoming element is. Swapping with `low` brings back whatever was at `low`, and by the invariant that region is all 1s — so the element arriving at `mid` is known to be a 1, already correctly placed, and there is nothing to examine. Swapping with `high` brings back an element from the *unexamined* region. It could be anything. Advancing past it skips it forever.",
        "It is a one-line difference and it produces wrong answers on only some inputs, which is the worst kind of bug to have. So rather than argue about it, test it — the differential test from the framework module, comparing both versions against `sorted()` on twenty thousand random inputs.",
      ],
      examples: [
        {
          id: "differential",
          title: "Testing the wrong version against the right one",
          lang: "python",
          code: `import random


def sort_colours(a, advance_mid_after_high_swap):
    low, mid, high = 0, 0, len(a) - 1
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1
            if advance_mid_after_high_swap:      # the bug
                mid += 1
    return a


random.seed(7)
first_failure = None
trials = 0
for _ in range(20000):
    data = [random.randint(0, 2) for _ in range(random.randint(1, 8))]
    trials += 1
    correct = sort_colours(list(data), False)
    buggy = sort_colours(list(data), True)
    assert correct == sorted(data), data
    if buggy != correct and first_failure is None:
        first_failure = (list(data), correct, buggy)

print(f"random trials              : {trials:,}")
print("correct version            : matched sorted() every time")
print(f"buggy version first failed : input   {first_failure[0]}")
print(f"                             correct {first_failure[1]}")
print(f"                             buggy   {first_failure[2]}")
print()
print("the element swapped down from \`high\` has never been examined,")
print("so \`mid\` must stay where it is and look at it next.")`,
          output: `random trials              : 20,000
correct version            : matched sorted() every time
buggy version first failed : input   [1, 2, 1, 1, 1, 0]
                             correct [0, 1, 1, 1, 1, 2]
                             buggy   [1, 0, 1, 1, 1, 2]

the element swapped down from \`high\` has never been examined,
so \`mid\` must stay where it is and look at it next.`,
          explanation:
            "The counterexample is worth tracing by hand, and it is small enough to do in your head: the `0` at the end gets swapped up to where the `2` was, `mid` skips over it, and it never reaches the 0s region. **Note that the failure needs a specific arrangement** — plenty of the twenty thousand inputs pass with the bug in place, which is precisely why a couple of hand-picked test cases would not have caught it. This is the technique from the framework module and it costs eight lines: implement the version you trust, implement the version you are unsure of, and let a loop find the disagreement.",
        },
      ],
      pitfalls: [
        {
          title: "Writing `while mid < high` instead of `mid <= high`",
          body: "`high` is the index of the last unexamined element, not one past it, so stopping at `mid == high` leaves that element unprocessed. It is invisible whenever the last unexamined value happens to be a 1 already in place, and produces a single misplaced element otherwise. Decide once whether your boundaries are inclusive or exclusive, and keep every comparison consistent with that choice — mixing the two conventions is the root of most off-by-one bugs in this module and the next.",
        },
      ],
    },
    {
      id: "one-pass-or-two",
      heading: "One pass, or two?",
      body: [
        "The honest counterpoint, because \"in one pass\" is a constraint the problem imposes rather than a virtue in itself.",
        "**Counting sort does the same job in two passes and four lines**: count how many 0s, 1s and 2s there are, then overwrite the array with that many of each. It is O(n) time and O(1) space too, it is much harder to get wrong, and on real hardware the two sequential passes may well beat the one pass with its swaps.",
        "So why learn the flag? Because the problem usually says \"one pass\" explicitly, and because **the three-region invariant is the transferable part**. The same structure appears in quicksort's three-way partition — which is what makes quicksort survive arrays full of duplicates — and in every problem that maintains more than two regions of an array at once.",
        "In an interview: offer the counting version first, say it is two passes, and then ask whether they want the one-pass version. That sequence demonstrates you know both and chose deliberately, which scores better than producing the clever one immediately.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Sort an array of 0s, 1s and 2s in one pass with constant space.",
      answer:
        "The Dutch national flag algorithm. Keep low, mid and high so that a[0:low] is all 0s, a[low:mid] is all 1s, a[mid:high+1] is unexamined and a[high+1:] is all 2s, and loop while mid ≤ high. On a 0, swap with low and advance both low and mid; on a 1, just advance mid; on a 2, swap with high, decrement high and leave mid alone. O(n) time, O(1) space, one pass. I would also mention the two-pass counting version — count the three values then rewrite the array — which is the same complexity and much harder to get wrong, and say I am writing the flag because the problem asked for a single pass.",
    },
    {
      question: "Why does `mid` advance after a swap with `low` but not after a swap with `high`?",
      answer:
        "Because of what comes back. Swapping with low returns whatever was at low, and by the invariant that region holds only 1s, so the incoming element is known to be a 1 and is already correctly placed — nothing to examine. Swapping with high returns an element from the unexamined region, which could be any of the three values, so mid has to stay and look at it on the next iteration. Advancing there skips it permanently, and the bug only shows on particular arrangements: a differential test over twenty thousand random arrays finds `[1, 2, 1, 1, 1, 0]`, where the trailing 0 gets swapped forward and never reaches the 0s.",
    },
    {
      question: "How does partitioning relate to the compaction loop?",
      answer:
        "It is the same loop with a comparison as the predicate. A read pointer visits everything, a write pointer marks the boundary of the left region, and the returned index is the size of that region — identical to the k that compaction returns. The one difference is that partitioning swaps rather than copies, because both halves are needed and the displaced element has to go into the slot the kept one vacated. The postcondition is not that the array is sorted but that everything before k is less than the pivot and everything from k on is not, which is worth asserting explicitly since partitioned output looks scrambled.",
    },
  ],
  takeaways: [
    "Partitioning is the compaction loop with a comparison predicate, swapping not copying",
    "A correct partition looks scrambled — assert the postcondition, not sortedness",
    "Flag invariant: 0s | 1s | unexamined | 2s, tracked by low, mid, high",
    "0 → swap low, advance both; 1 → advance mid; 2 → swap high, mid stays",
    "mid stays because the element from high has never been examined",
    "`while mid <= high` — high is inclusive, so `<` leaves one element unprocessed",
    "Counting sort does the same job in two passes and is far harder to get wrong",
    "The transferable part is the three-region invariant, not the colours",
  ],
  status: "available",
};
