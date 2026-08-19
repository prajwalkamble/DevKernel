import type { Lesson } from "@/content/types";

export const inPlaceLesson: Lesson = {
  id: "dsa-arr-in-place",
  slug: "reversing-rotating-and-shifting",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Reversing, Rotating & Shifting In Place",
  summary:
    "The two-pointer swap, the three-reversal rotation, and the read-and-write pointers that compact an array without a second one.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Reverse an array in place with two pointers",
    "Rotate an array in O(n) time and O(1) space using three reversals",
    "Compact an array with separate read and write pointers",
    "Say what \"in place\" means and when a problem is really demanding it",
  ],
  sections: [
    {
      id: "what-in-place-means",
      heading: "What \"in place\" actually demands",
      body: [
        "\"Modify the array in place\" and \"use only constant extra space\" mean the same thing: **you may use a fixed number of variables, and you may not allocate a second array.**",
        "Two consequences worth being precise about. A handful of index variables is fine, however many. And building a new array of the same size is *not* fine even if you copy it back at the end — that is O(n) extra space no matter how you dress it.",
        "When a problem says this, it is not an inconvenience. It is the setter ruling out the easy solution to force the interesting one, exactly as the constraints lesson described.",
      ],
    },
    {
      id: "reversal",
      heading: "Reversal: two pointers walking inward",
      body: [
        "Put one index at each end, swap them, move both inward, and stop when they meet. That is the whole algorithm and it is the first genuine two-pointer technique in this track.",
        "The loop condition is `lo < hi`, not `lo <= hi`. With an odd length the two meet on the middle element, and swapping it with itself is harmless but pointless; with `<=` on an even length they would cross and start swapping back.",
        "The invariant, in the style of the loops module: *everything outside `[lo, hi]` is already in its final position.*",
      ],
      examples: [
        {
          id: "reversal",
          title: "Reversal, with the swaps shown",
          lang: "python",
          code: `def reverse_in_place(values):
    lo, hi = 0, len(values) - 1
    while lo < hi:
        print(f"  swap index {lo} and {hi}: {values[lo]} <-> {values[hi]}")
        values[lo], values[hi] = values[hi], values[lo]
        lo += 1
        hi -= 1
    return values


print("even length:")
print(reverse_in_place([1, 2, 3, 4]))

print("odd length:")
print(reverse_in_place([1, 2, 3, 4, 5]))

print("single element:")
print(reverse_in_place([1]))

print("empty:")
print(reverse_in_place([]))`,
          output: `even length:
  swap index 0 and 3: 1 <-> 4
  swap index 1 and 2: 2 <-> 3
[4, 3, 2, 1]
odd length:
  swap index 0 and 4: 1 <-> 5
  swap index 1 and 3: 2 <-> 4
[5, 4, 3, 2, 1]
single element:
[1]
empty:
[]
`,
          explanation:
            "Four elements need two swaps and five need two as well — the middle element of an odd-length array stays put and is never touched. The single-element and empty cases do nothing at all, because `lo < hi` is false immediately, which is a correct bound handling its own edge cases with no special branch.",
        },
      ],
      pitfalls: [
        {
          title: "Swapping in Java without a temporary",
          body: "Python's `a[i], a[j] = a[j], a[i]` builds the right-hand tuple first, so it is safe. Java needs the temporary: `int t = a[i]; a[i] = a[j]; a[j] = t;`. Writing `a[i] = a[j]; a[j] = a[i];` loses the original value — a mistake that produces a duplicated element rather than a crash.",
        },
      ],
    },
    {
      id: "rotation",
      heading: "Rotation: the three-reversal trick",
      body: [
        "Rotating an array right by k places is a standard problem, and the naive answer — shift everything one place, k times — is O(n × k), which is quadratic when k is around n.",
        "The trick is three reversals. **Reverse the whole array, then reverse the first k, then reverse the rest.** That is O(n) time and O(1) space.",
        "Why it works: reversing the whole array puts the last k elements at the front but backwards, and puts the first n − k at the back, also backwards. Reversing each part separately fixes both.",
        "Two details that are easy to get wrong. `k` must be reduced modulo `n` first, since rotating by n is rotating by nothing. And a negative or zero `k` needs handling or the sub-reversals get nonsense bounds.",
      ],
      examples: [
        {
          id: "rotation",
          title: "The three reversals, step by step",
          lang: "python",
          code: `def reverse_range(values, lo, hi):
    while lo < hi:
        values[lo], values[hi] = values[hi], values[lo]
        lo += 1
        hi -= 1


def rotate_right(values, k):
    n = len(values)
    if n == 0:
        return values
    k %= n
    print(f"  start          {values}")
    reverse_range(values, 0, n - 1)
    print(f"  reverse all    {values}")
    reverse_range(values, 0, k - 1)
    print(f"  reverse first {k} {values}")
    reverse_range(values, k, n - 1)
    print(f"  reverse rest   {values}")
    return values


print("rotate [1,2,3,4,5] right by 2:")
print(rotate_right([1, 2, 3, 4, 5], 2))

print("rotate by 5 (a full turn):")
print(rotate_right([1, 2, 3, 4, 5], 5))

print("rotate by 7 (same as by 2):")
print(rotate_right([1, 2, 3, 4, 5], 7))`,
          output: `rotate [1,2,3,4,5] right by 2:
  start          [1, 2, 3, 4, 5]
  reverse all    [5, 4, 3, 2, 1]
  reverse first 2 [4, 5, 3, 2, 1]
  reverse rest   [4, 5, 1, 2, 3]
[4, 5, 1, 2, 3]
rotate by 5 (a full turn):
  start          [1, 2, 3, 4, 5]
  reverse all    [5, 4, 3, 2, 1]
  reverse first 0 [5, 4, 3, 2, 1]
  reverse rest   [1, 2, 3, 4, 5]
[1, 2, 3, 4, 5]
rotate by 7 (same as by 2):
  start          [1, 2, 3, 4, 5]
  reverse all    [5, 4, 3, 2, 1]
  reverse first 2 [4, 5, 3, 2, 1]
  reverse rest   [4, 5, 1, 2, 3]
[4, 5, 1, 2, 3]
`,
          explanation:
            "The trace makes the trick visible: after reversing everything, `4, 5` and `1, 2, 3` are both present as contiguous blocks in the right positions and the wrong internal order, and the two sub-reversals fix each. The `k %= n` line is doing real work — rotating by 7 produces exactly the same steps as rotating by 2, and without it the sub-reversal bounds would run off the end.",
        },
      ],
    },
    {
      id: "read-write",
      heading: "Read and write pointers",
      body: [
        "The third in-place technique, and the most broadly useful: **two indices moving at different speeds**, one reading every element and one marking where the next kept element goes.",
        "The read pointer advances on every iteration. The write pointer advances only when something is kept. At the end, the first `write` elements are the answer and everything after is stale.",
        "This solves an entire family: remove an element, remove duplicates from a sorted array, move zeros to the end, partition around a pivot. All of them are the same three lines with a different keep-condition.",
      ],
      examples: [
        {
          id: "read-write",
          title: "One shape, three problems",
          lang: "python",
          code: `def remove_value(values, unwanted):
    write = 0
    for read in range(len(values)):
        if values[read] != unwanted:
            values[write] = values[read]
            write += 1
    return write


def move_zeros_to_end(values):
    write = 0
    for read in range(len(values)):
        if values[read] != 0:
            values[write] = values[read]
            write += 1
    while write < len(values):
        values[write] = 0
        write += 1
    return values


def dedupe_sorted(values):
    if not values:
        return 0
    write = 1
    for read in range(1, len(values)):
        if values[read] != values[write - 1]:
            values[write] = values[read]
            write += 1
    return write


a = [3, 2, 2, 3, 4]
kept = remove_value(a, 2)
print("remove 2 :", a[:kept], "(kept", kept, "of", len(a), ")")

b = [0, 1, 0, 3, 12]
print("move zeros:", move_zeros_to_end(b))

c = [1, 1, 2, 2, 2, 3]
kept = dedupe_sorted(c)
print("dedupe   :", c[:kept], "(kept", kept, ")")`,
          output: `remove 2 : [3, 3, 4] (kept 3 of 5 )
move zeros: [1, 3, 12, 0, 0]
dedupe   : [1, 2, 3] (kept 3 )
`,
          explanation:
            "Three problems, one shape. Note what each returns: `remove_value` and `dedupe_sorted` return a *count*, because they cannot shrink the array in place — the elements past the count are leftovers and the caller is told to ignore them. That convention is exactly what LeetCode's in-place removal problems specify, and returning the array instead of the count is a common wrong answer.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming the tail is cleaned up",
          body: "After compacting, positions from `write` onwards still hold their old values. `move_zeros_to_end` has an explicit second loop to overwrite them; the other two do not, because their problem statements only care about the first `write` elements. Read the statement to find out which one you are being asked for.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you reverse an array in place?",
      answer:
        "Two pointers, one at each end, swapping and moving inward while `lo < hi`. It performs n/2 swaps, is O(n) time and O(1) space. The condition must be strict: with an odd length the pointers meet on the middle element, which needs no swap, and using `<=` on an even length would let them cross and undo the work. Java needs a temporary variable for the swap; Python's tuple assignment handles it directly.",
    },
    {
      question: "How do you rotate an array right by k in O(1) space?",
      answer:
        "Three reversals: reverse the whole array, then reverse the first k elements, then reverse the remaining n − k. Reversing everything brings the last k to the front in reverse order and pushes the rest to the back in reverse order, and the two sub-reversals correct each block. O(n) time, O(1) space. Reduce k modulo n first — rotating by n is a no-op, and without the reduction the sub-ranges get invalid bounds.",
    },
    {
      question: "What is the read-and-write-pointer technique?",
      answer:
        "Two indices moving at different speeds: the read pointer visits every element, and the write pointer marks where the next kept element goes and advances only when something is kept. At the end the first `write` positions hold the answer. It solves remove-element, remove-duplicates-from-sorted, move-zeros and partitioning with the same three lines and a different keep-condition — and those problems conventionally return the count rather than a resized array, because an in-place algorithm cannot shrink one.",
    },
  ],
  takeaways: [
    "\"In place\" means a constant number of variables and no second array — copying back at the end does not count",
    "Reversal is two pointers walking inward while `lo < hi`, n/2 swaps",
    "The strict `<` matters: the middle of an odd-length array needs no swap",
    "Java needs a temporary to swap; `a[i] = a[j]; a[j] = a[i];` duplicates instead",
    "Rotate right by k with three reversals: whole, first k, then the rest",
    "Reduce k modulo n first, or the sub-ranges get invalid bounds",
    "Read and write pointers compact an array: read every element, write only the kept ones",
    "Those problems return a count, because in-place code cannot shrink the array",
  ],
};
