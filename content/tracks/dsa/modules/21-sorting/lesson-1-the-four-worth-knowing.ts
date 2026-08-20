import type { Lesson } from "@/content/types";

export const fourSortsLesson: Lesson = {
  id: "dsa-sort-four",
  slug: "the-sorts-worth-knowing",
  moduleSlug: "sorting",
  title: "The Sorts Worth Knowing",
  summary:
    "You will implement one of these roughly never and depend on one of them constantly. What matters is knowing which shape of input each is good at, and why insertion sort — the slowest on paper — is inside every serious library.",
  estimatedMinutes: 35,
  objectives: [
    "Describe insertion, merge, quick and heap sort in one sentence each",
    "Explain why insertion sort beats O(n log n) sorts on small or nearly-sorted input",
    "State each algorithm's worst case and space cost",
    "Choose a sort from the shape of the data rather than from the average case",
  ],
  sections: [
    {
      id: "the-cast",
      heading: "Four algorithms, four different strengths",
      body: [
        "**Insertion sort.** Take each element and slide it left into place. O(n²) worst case, **O(n) on already-sorted input**, in-place, stable. Its constant factor is tiny.",
        "**Merge sort.** Split in half, sort both, merge. **O(n log n) guaranteed** — best, average and worst — stable, but needs O(n) extra space.",
        "**Quicksort.** Partition around a pivot, recurse on both sides. O(n log n) average, **O(n²) worst**, in-place, not stable. Fastest in practice on random data because it moves memory in a cache-friendly way.",
        "**Heap sort.** Build a heap, repeatedly extract the maximum. **O(n log n) guaranteed and O(1) space** — the only one with both — but not stable and it jumps around memory, so it loses to quicksort in wall-clock terms.",
        "No algorithm here wins on every axis, which is exactly why four survive. Guaranteed bound, stability, in-place, cache behaviour — pick any three.",
      ],
      visual: {
        id: "sort-picker",
        kind: "sorting",
        algorithm: "insertion",
        title: "Step through each one on the same array",
      },
    },
    {
      id: "small-and-sorted",
      heading: "Why insertion sort is not a toy",
      body: [
        "Insertion sort is O(n²) and every real library uses it. Both facts are true, and the reason is that asymptotic complexity describes large n and says nothing about the constant.",
        "On an array of ten elements, insertion sort's tight inner loop beats merge sort's recursion, allocation and merging. Libraries exploit this: below a threshold — 32 in Java's TimSort, 16 in typical introsort implementations — the recursion stops and insertion sort finishes the job.",
        "The second property matters more. Insertion sort is **adaptive**: on nearly-sorted input it does almost no work, because each element is already close to where it belongs. Real data is very often nearly sorted, and this is the property TimSort is built around.",
      ],
      examples: [
        {
          id: "adaptive",
          title: "Counting the work, on three shapes of input",
          lang: "python",
          code: `def counted(sort_fn, data):
    """Runs a sort on a copy and reports comparisons and moves."""
    stats = {"cmp": 0, "move": 0}
    out = sort_fn(list(data), stats)
    assert out == sorted(data)
    return stats

def insertion(a, st):
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0:
            st["cmp"] += 1
            if a[j] <= key:
                break
            a[j + 1] = a[j]
            st["move"] += 1
            j -= 1
        a[j + 1] = key
    return a

def selection(a, st):
    for i in range(len(a)):
        lo = i
        for j in range(i + 1, len(a)):
            st["cmp"] += 1
            if a[j] < a[lo]:
                lo = j
        a[i], a[lo] = a[lo], a[i]
        st["move"] += 1
    return a

sorted_in = list(range(12))
reversed_in = list(range(12))[::-1]
shuffled = [7, 2, 9, 0, 11, 4, 1, 8, 3, 10, 5, 6]

for name, data in [("sorted", sorted_in), ("reversed", reversed_in), ("shuffled", shuffled)]:
    i = counted(insertion, data)
    s = counted(selection, data)
    print(f"{name:9s} insertion cmp={i['cmp']:3d} move={i['move']:3d}   selection cmp={s['cmp']:3d} move={s['move']:3d}")`,
          output: `sorted    insertion cmp= 11 move=  0   selection cmp= 66 move= 12
reversed  insertion cmp= 66 move= 66   selection cmp= 66 move= 12
shuffled  insertion cmp= 39 move= 30   selection cmp= 66 move= 12`,
          explanation:
            "Insertion sort on sorted input: 11 comparisons, **zero moves** — one comparison per element to confirm it is already in place. On reversed input it degrades to the full 66. Selection sort does **66 comparisons whatever you give it**, because it scans the whole remaining array regardless; it is not adaptive at all. Its one virtue is the move count: exactly n, which matters if a swap is expensive — writing to flash memory, say.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing by the shape of the data",
      body: [
        "**Nearly sorted** → insertion sort, or a library sort that detects runs. Linear in practice.",
        "**Small** → insertion sort. Under about 32 elements nothing else is worth the overhead.",
        "**Needs a guaranteed bound** → merge sort or heap sort. Quicksort's worst case is real and, on a judge, arrangeable.",
        "**Memory is tight** → heap sort, the only O(n log n) sort in O(1) space. Quicksort is often called in-place but its recursion is O(log n) stack.",
        "**Stability required** → merge sort. Quicksort and heap sort both destroy the order of equal elements.",
        "**Keys are small integers** → do not compare at all; counting or radix sort, which lesson 6 covers.",
        "In an interview the honest answer is almost always \"call the library sort\". The value of knowing the four is being able to say *why* the library made the choice it did — which is lesson 4.",
      ],
      pitfalls: [
        {
          title: "Calling quicksort O(n log n) without qualification",
          body: "It is O(n log n) on average and O(n²) when pivots split badly — sorted input with a first-element pivot is the classic trigger. Randomised or median-of-three pivots make the bad case unlikely rather than impossible, which is why library implementations also detect the degeneration and switch to heap sort.",
        },
        {
          title: "Calling quicksort in-place and merge sort not",
          body: "Roughly true, but quicksort still uses O(log n) stack for its recursion, and an unbalanced partition makes that O(n). Merge sort's O(n) buffer is the honest comparison against quicksort's O(log n) stack, not against zero.",
        },
        {
          title: "Ignoring the cost of comparison itself",
          body: "The complexities count comparisons, treating each as O(1). Comparing long strings or invoking a comparator that allocates makes the real cost `O(n log n × cost of one comparison)`. When comparisons are expensive, an algorithm that does fewer of them — merge sort — can beat one that does more but moves memory better.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why do library sorts fall back to insertion sort for small arrays?",
      answer:
        "Its constant factor is far smaller — a tight loop with no recursion or allocation — and asymptotic complexity says nothing about constants. Below roughly 32 elements it wins outright, so TimSort and introsort both stop recursing and finish with it.",
    },
    {
      question: "When would you choose heap sort?",
      answer:
        "When you need a guaranteed O(n log n) bound in O(1) space. Merge sort matches the bound but needs O(n) extra; quicksort matches the space but not the bound. Heap sort's cost is poor cache behaviour and no stability.",
    },
    {
      question: "What makes a sort adaptive, and why does it matter?",
      answer:
        "It does less work on input that is already partly ordered. Insertion sort is O(n) on sorted input. It matters because real data is frequently nearly sorted — appended records, re-sorting after a small change — and TimSort is designed around exploiting existing runs.",
    },
  ],
  takeaways: [
    "Insertion: O(n²) but adaptive, tiny constant, stable, and inside every library",
    "Merge: O(n log n) guaranteed and stable, at O(n) space",
    "Quick: fastest in practice, O(n²) worst case, not stable",
    "Heap: the only O(n log n) sort in O(1) space, poor cache behaviour",
    "Selection sort is never adaptive but does exactly n moves",
    "Choose from the shape of the data, not from the average case",
  ],
  status: "available",
};
