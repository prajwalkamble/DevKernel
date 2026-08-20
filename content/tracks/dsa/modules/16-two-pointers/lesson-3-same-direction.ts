import type { Lesson } from "@/content/types";

export const sameDirectionLesson: Lesson = {
  id: "dsa-tp-same",
  slug: "same-direction-read-write-and-lag",
  moduleSlug: "two-pointers",
  title: "Same Direction: Read/Write, Fast/Slow & Lag",
  summary:
    "The other half of the pattern. Both pointers move the same way, and the gap between them carries the meaning — which is how in-place filtering, cycle detection and \"nth from the end\" all become one pass with no extra memory.",
  estimatedMinutes: 30,
  objectives: [
    "Write the read/write pair for in-place filtering",
    "State what the region behind the write pointer always holds",
    "Use a fixed lag to solve \"nth from the end\" in one pass",
    "Use fast/slow to find a midpoint or detect a cycle",
    "Distinguish this from a sliding window",
  ],
  sections: [
    {
      id: "read-write",
      heading: "Read and write",
      body: [
        "The most common same-direction pair. **`read` visits every element; `write` marks where the next kept element goes.** They start together, `read` always runs ahead, and the answer is `write` at the end.",
        "The invariant is worth stating exactly, because it is what makes the code obviously correct: **everything in `a[0:write]` is finished and correct; everything from `read` onwards is unexamined; the gap between them is garbage nobody will read.**",
        "This is how you filter, deduplicate, compact or partition an array with O(1) extra space — the family the arrays module introduced, now with a name.",
      ],
      examples: [
        {
          id: "same-direction",
          title: "Read/write, fast/slow, and lag-by-k",
          lang: "python",
          code: `# Same-direction pointers: read/write, fast/slow, and lag-by-k.

def remove_duplicates(a):
    """Sorted input. \`write\` marks where the next kept element goes."""
    if not a:
        return 0
    write = 1
    for read in range(1, len(a)):
        if a[read] != a[write - 1]:
            a[write] = a[read]
            write += 1
    return write

a = [1, 1, 2, 2, 2, 3, 5, 5]
n = remove_duplicates(a)
print("after dedup:", a[:n], " tail (ignored):", a[n:])

def move_zeroes(a):
    write = 0
    for read in range(len(a)):
        if a[read] != 0:
            a[write], a[read] = a[read], a[write]
            write += 1
    return a

print("move zeroes:", move_zeroes([0, 1, 0, 3, 12]))

# Fast/slow on a list, expressed on an array for clarity.
def middle(a):
    slow = fast = 0
    while fast + 1 < len(a):
        slow += 1
        fast += 2
    return slow

for xs in ([1, 2, 3, 4, 5], [1, 2, 3, 4], [1], [1, 2]):
    print(f"  middle of {str(xs):15} -> index {middle(xs)} value {xs[middle(xs)]}")

# Lag by k: the nth node from the end, in one pass.
def nth_from_end(a, k):
    lead = k
    trail = 0
    while lead < len(a):
        lead += 1
        trail += 1
    return trail

b = [10, 20, 30, 40, 50]
for k in (1, 2, 5):
    print(f"  {k} from end of {b} -> index {nth_from_end(b, k)} value {b[nth_from_end(b, k)]}")`,
          output: `after dedup: [1, 2, 3, 5]  tail (ignored): [2, 3, 5, 5]
move zeroes: [1, 3, 12, 0, 0]
  middle of [1, 2, 3, 4, 5] -> index 2 value 3
  middle of [1, 2, 3, 4]    -> index 2 value 3
  middle of [1]             -> index 0 value 1
  middle of [1, 2]          -> index 1 value 2
  1 from end of [10, 20, 30, 40, 50] -> index 4 value 50
  2 from end of [10, 20, 30, 40, 50] -> index 3 value 40
  5 from end of [10, 20, 30, 40, 50] -> index 0 value 10`,
          explanation:
            "The dedup leaves `[2, 3, 5, 5]` behind the write pointer — deliberate garbage. The function returns a *length*, and the caller reads only that prefix. Problems in this family say \"return k, and the first k elements should be…\", which is exactly this contract.\n\n`move_zeroes` swaps rather than overwrites, which is what gets the zeros to the back in one pass instead of needing a fill loop afterwards.\n\n**Lag by k** is the trick behind \"remove the nth node from the end\" on a linked list, where you cannot ask for the length. Start one pointer k ahead; walk both until the leader falls off the end; the trailer is sitting exactly k from the end. On an array this is arithmetic, but on a list it is the only single-pass way.",
        },
      ],
    },
    {
      id: "fast-slow",
      heading: "Fast and slow",
      body: [
        "Advance one pointer by one and the other by two. Two things fall out.",
        "**The midpoint.** When the fast pointer reaches the end, the slow one is halfway. On a linked list — where there is no index and no length — this is how you find the middle in one pass, and it is the first step of merge-sorting a list or checking one for palindromy.",
        "**Cycle detection.** In a structure with a cycle, the fast pointer laps the slow one and they meet; without a cycle, the fast one falls off the end. That is **Floyd's algorithm**, and the surprising part — that after meeting you can find the cycle's *entrance* by restarting one pointer at the head and walking both at the same speed — is derived in the linked-lists module.",
      ],
    },
    {
      id: "not-a-window",
      heading: "This is not a sliding window",
      body: [
        "Both patterns have two same-direction indices, and the distinction matters because it decides what you maintain.",
        "**Two pointers**: the gap has no meaning of its own. `write` is a *destination*; `slow` is a *position*. Nothing is being measured about the region between them.",
        "**Sliding window**: the region between the pointers is the answer being built, and you maintain a running summary of it — a sum, a count, a frequency map. The next module is entirely about that.",
        "If you find yourself keeping a running total of what is between the pointers, you are writing a window, and the window module's shrink-and-grow structure will serve you better than this one's.",
      ],
      pitfalls: [
        {
          title: "Comparing against `a[write - 1]`, not `a[read - 1]`",
          body: "In the dedup, the last *kept* value is at `write - 1`, not `read - 1` — those diverge as soon as anything is dropped. Using `read - 1` compares against a value that may have been discarded, and it fails on the first input with three or more consecutive duplicates.",
        },
        {
          title: "`fast + 1 < len` against `fast < len` changes which middle you get",
          body: "For an even-length input there are two middles. `fast + 1 < len` gives the first, `fast < len` gives the second. Neither is wrong; the problem statement decides, and it is the kind of off-by-one that only shows on even inputs.",
        },
      ],
    },
  ],
  takeaways: [
    "Read/write: `a[0:write]` is finished, `a[read:]` is unexamined, the gap is garbage",
    "The function returns a length, and the caller reads only that prefix",
    "Compare against `a[write - 1]` — the last *kept* value",
    "Lag by k solves \"nth from the end\" in one pass with no length",
    "Fast/slow finds the midpoint and detects cycles",
    "If you are summarising the region *between* the pointers, it is a window instead",
  ],
  status: "available",
};
