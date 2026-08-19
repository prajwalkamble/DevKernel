import type { Lesson } from "@/content/types";

export const indexingBoundsLesson: Lesson = {
  id: "dsa-arr-indexing",
  slug: "indexing-and-bounds",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Indexing, Bounds & Slicing",
  summary:
    "Zero-based indexing, the crash at the far end, Python's negative indices — and why slicing does not throw where indexing does.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "State the valid index range for a collection of length n",
    "Use negative indices and slices in Python correctly",
    "Explain why an out-of-range slice is silent and an out-of-range index is not",
    "Write a bounds guard that protects an index expression",
  ],
  sections: [
    {
      id: "zero-based",
      heading: "Zero-based, and the last index",
      body: [
        "Indices start at 0, so a collection of length n has valid indices **0 to n − 1**. The last one is `n - 1`, not `n`, and `n` itself is always out of range.",
        "That single `- 1` is the origin of most crashes in this module. It is worth being able to say the rule aloud rather than deriving it each time.",
        "The reason for zero-based indexing is the address arithmetic from the previous lesson: `start + i × size` means index 0 is the start, with no adjustment. One-based indexing would need `start + (i - 1) × size` on every access.",
      ],
      examples: [
        {
          id: "bounds",
          title: "Both ends, and one past",
          lang: "python",
          code: `values = [10, 20, 30, 40]
n = len(values)

print("length      :", n)
print("first       :", values[0])
print("last        :", values[n - 1])
print("last, again :", values[-1])

for index in (0, n - 1, n, -1, -n, -n - 1):
    try:
        print(f"values[{index:>3}] = {values[index]}")
    except IndexError as e:
        print(f"values[{index:>3}] -> IndexError: {e}")`,
          output: `length      : 4
first       : 10
last        : 40
last, again : 40
values[  0] = 10
values[  3] = 40
values[  4] -> IndexError: list index out of range
values[ -1] = 40
values[ -4] = 10
values[ -5] -> IndexError: list index out of range`,
          explanation:
            "Valid indices run 0 to 3 forwards and −1 to −4 backwards; anything outside either range throws. Negative indexing is a genuine convenience — `values[-1]` for the last element beats `values[len(values) - 1]` — and it is Python-only. Java has nothing equivalent, so the arithmetic is explicit there.",
        },
      ],
      pitfalls: [
        {
          title: "A negative index silently reading from the other end",
          body: "Python's negative indexing means an index that has gone wrong by becoming negative does not crash — it quietly reads from the far end. `values[i - 1]` with `i = 0` gives the *last* element rather than an error. In Java the same expression throws immediately, which is one of the rare cases where Java's behaviour is the more debuggable one.",
        },
      ],
    },
    {
      id: "slicing",
      heading: "Slicing, and why it does not throw",
      body: [
        "`values[a:b]` gives a new list from index `a` up to but not including `b` — the half-open convention from the loops module.",
        "The surprising part: **a slice never raises IndexError.** Out-of-range bounds are clamped to the collection, so `values[0:1000]` gives the whole list and `values[10:20]` on a four-element list gives `[]`.",
        "That is convenient and occasionally hides a bug, because a slice with a miscalculated bound returns something plausible instead of complaining. When a slice comes back shorter than expected, check the bounds rather than the data.",
      ],
      examples: [
        {
          id: "slicing",
          title: "Slices clamp; indices do not",
          lang: "python",
          code: `values = [10, 20, 30, 40]

print(values[1:3])
print(values[:2])
print(values[2:])
print(values[:])
print(values[::2])
print(values[::-1])

print("out of range slice :", values[10:20])
print("over-long slice    :", values[0:1000])
print("reversed bounds    :", values[3:1])

try:
    values[10]
except IndexError:
    print("out of range index : IndexError")`,
          output: `[20, 30]
[10, 20]
[30, 40]
[10, 20, 30, 40]
[10, 30]
[40, 30, 20, 10]
out of range slice : []
over-long slice    : [10, 20, 30, 40]
reversed bounds    : []
out of range index : IndexError`,
          explanation:
            "Four different kinds of nonsense bound, four silent empty-or-clamped results, and one crash — the crash being the only one that tells you something is wrong. Note `values[:]` is the idiomatic full copy, which the pass-by-value lesson used to avoid mutating a caller's list.",
        },
      ],
    },
    {
      id: "slices-copy",
      heading: "A slice is a copy",
      body: [
        "`values[a:b]` builds a **new list** and copies the elements into it. That costs O(b − a) time and the same in memory.",
        "Which matters for two reasons. Modifying a slice does not touch the original, which is usually what you want. And slicing inside a loop is quietly quadratic — the trap the strings lesson flagged, and it applies to lists identically.",
        "Java's `Arrays.copyOfRange` and `List.subList` differ here: `copyOfRange` copies, while `subList` returns a **view** backed by the original, so writing through it changes the original. That is a genuine trap when moving between the two languages.",
      ],
      examples: [
        {
          id: "slice-copies",
          title: "The copy, and the cost of slicing in a loop",
          lang: "python",
          code: `original = [1, 2, 3, 4]
part = original[1:3]
part[0] = 99

print("original:", original)
print("part    :", part)

# Walking a list by repeatedly slicing off the head is quadratic.
def sum_by_slicing(values):
    copied = 0
    while values:
        copied += len(values)
        values = values[1:]
    return copied


def sum_by_index(values):
    return len(values)


for n in (100, 200, 400):
    slicing = sum_by_slicing(list(range(n)))
    indexing = sum_by_index(list(range(n)))
    print(f"n={n:>4}  elements copied by slicing: {slicing:>6}   by indexing: {indexing:>4}")`,
          output: `original: [1, 2, 3, 4]
part    : [99, 3]
n= 100  elements copied by slicing:   5050   by indexing:  100
n= 200  elements copied by slicing:  20100   by indexing:  200
n= 400  elements copied by slicing:  80200   by indexing:  400`,
          explanation:
            "Writing into the slice left the original alone, which confirms it is a copy. And the copy count quadruples when n doubles — the signature of a quadratic, from a loop that looks linear. Walking a list means moving an index, never chopping the head off repeatedly.",
        },
      ],
      pitfalls: [
        {
          title: "Java's `subList` is a view, not a copy",
          body: "`list.subList(1, 3).set(0, 99)` modifies the original list, and structurally modifying the backing list invalidates the view entirely. `Arrays.copyOfRange` and `new ArrayList<>(list.subList(a, b))` both copy. Python's slice always copies, so code translated from Python to Java can change behaviour silently here.",
        },
      ],
    },
    {
      id: "guards",
      heading: "Guarding an index",
      body: [
        "Any index computed from something other than a loop counter needs checking before use. The guard is the short-circuit pattern from the operators module, and the order is not optional.",
        "`i < values.length && values[i] == target` is safe. Reversed, it crashes. The bounds test must come first because the second operand cannot be evaluated otherwise — which is precisely what short-circuiting provides.",
        "For neighbour lookups the guard is two-sided: `0 <= i && i < n`, which Python chains as `0 <= i < n`.",
      ],
      examples: [
        {
          id: "guards",
          title: "Neighbours, guarded",
          lang: "python",
          code: `values = [10, 20, 30, 40]
n = len(values)


def neighbours(i):
    found = []
    for offset in (-1, 1):
        j = i + offset
        if 0 <= j < n:
            found.append(values[j])
    return found


for i in range(n):
    print(f"index {i} ({values[i]}) has neighbours {neighbours(i)}")

# Without the guard, the ends misbehave rather than crash.
print("unguarded values[0 - 1]:", values[0 - 1], "<- wrapped to the end")`,
          output: `index 0 (10) has neighbours [20]
index 1 (20) has neighbours [10, 30]
index 2 (30) has neighbours [20, 40]
index 3 (40) has neighbours [30]
unguarded values[0 - 1]: 40 <- wrapped to the end`,
          explanation:
            "The two ends have one neighbour each and the middle positions have two — the guard handles all four without a special case for the edges. The last line shows what happens without it: `values[-1]` does not crash, it silently returns 40 from the far end, so an index that has gone wrong by becoming negative produces a plausible answer from the wrong place. That is the strongest argument for guarding rather than relying on a crash to tell you.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the valid index range for a collection of length n?",
      answer:
        "0 to n − 1. Index n is always out of range, and it is the single most common cause of an out-of-bounds crash — a loop written `i <= n` rather than `i < n`. Python additionally accepts negative indices from −1 down to −n, counting from the end, so `values[-1]` is the last element. Anything outside either range raises.",
    },
    {
      question: "Why does an out-of-range slice not raise in Python?",
      answer:
        "Because slice bounds are clamped to the collection rather than validated. `values[10:20]` on a four-element list gives an empty list, and `values[0:1000]` gives the whole thing. That is convenient and occasionally hides a bug, since a miscalculated bound returns something plausible instead of complaining — so when a slice comes back shorter than expected, suspect the bounds rather than the data.",
    },
    {
      question: "Is a Python slice a copy or a view?",
      answer:
        "A copy — it allocates a new list and copies the elements, costing O(b − a). So modifying the slice leaves the original alone, and slicing inside a loop is quadratic. Java differs: `Arrays.copyOfRange` copies, but `List.subList` returns a view backed by the original, so writes through it change the original and structural changes to the backing list invalidate it. Code translated between the languages can change behaviour silently here.",
    },
  ],
  takeaways: [
    "Valid indices are 0 to n − 1; index n is always out of range",
    "Zero-based indexing exists because the address is `start + i × size` with no adjustment",
    "Python accepts −1 to −n from the end, so a negative index reads rather than crashing",
    "Slices clamp their bounds and never raise, which hides miscalculated bounds",
    "A Python slice is a copy; slicing the head off in a loop is quadratic",
    "Java's `subList` is a view and `copyOfRange` is a copy — they are not interchangeable",
    "Guard a computed index with `0 <= i < n` before using it, and put the guard first",
  ],
};
