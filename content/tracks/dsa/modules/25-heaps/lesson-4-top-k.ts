import type { Lesson } from "@/content/types";

export const topKLesson: Lesson = {
  id: "dsa-heap-top-k",
  slug: "top-k-and-the-heap-that-is-backwards",
  moduleSlug: "heaps-and-priority-queues",
  title: "Top-K, and Why the Heap Points the Wrong Way",
  summary:
    "For the k largest you want a min-heap, which feels backwards until you notice what the root is for: it is the weakest thing you have kept, and therefore the bar every newcomer has to clear.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why the k largest need a min-heap and the k smallest need a max-heap",
    "Keep the heap capped at k, and say what that buys over heapifying everything",
    "Compare O(n log k) against O(n log n) and locate where the win disappears",
    "Answer the streaming follow-up without changing the algorithm",
  ],
  sections: [
    {
      id: "the-inversion",
      heading: "The heap points the other way",
      body: [
        "The instinct for *give me the three largest* is a max-heap, and the instinct is wrong. Think about what the algorithm actually needs to ask at each step.",
        "You are carrying a set of candidates. A new value arrives. The only question is whether it belongs in the set \u2014 and it belongs if and only if it beats the **worst** thing currently there. So the element you need instant access to is the smallest of the ones you kept, which means a min-heap.",
        "A max-heap would put the largest kept value at the root, and the largest kept value is the one element the algorithm never has to consult. Every arrival would need a scan to find the weakest candidate, which is O(k) per element and throws the whole benefit away.",
        "The rule generalises and is worth memorising in this form: **the heap holds the answer, and its root is the thing most likely to be evicted from it.** For the k largest that is a min-heap; for the k smallest, a max-heap; for the k closest to a point, a max-heap of distances.",
      ],
      examples: [
        {
          id: "top-k-trace",
          title: "A min-heap of size k, and what the root is for",
          lang: "python",
          code: `import heapq

values = [7, 2, 9, 4, 1, 8, 3, 6, 5]
k = 3

heap = []
print(f"keeping the {k} largest, in a min-heap of size {k}")
print(f"{'value':>6}  {'action':<28} {'heap':<14} {'smallest kept':>14}")
print("-" * 68)
for v in values:
    if len(heap) < k:
        heapq.heappush(heap, v)
        action = "room left — keep it"
    elif v > heap[0]:
        evicted = heapq.heappushpop(heap, v)
        action = f"beats {evicted} — evict it"
    else:
        action = f"loses to {heap[0]} — drop it"
    print(f"{v:>6}  {action:<28} {str(sorted(heap)):<14} {heap[0]:>14}")

print()
print("the k largest:", sorted(heap, reverse=True))
print()
print("the heap holds the k largest, and its root is the *smallest* of them —")
print("which is exactly the value a new arrival has to beat to get in.")
print("a max-heap of size k would put the largest on top, and the largest is")
print("the one element you never need to look at.")`,
          output: `keeping the 3 largest, in a min-heap of size 3
 value  action                       heap            smallest kept
--------------------------------------------------------------------
     7  room left — keep it          [7]                         7
     2  room left — keep it          [2, 7]                      2
     9  room left — keep it          [2, 7, 9]                   2
     4  beats 2 — evict it           [4, 7, 9]                   4
     1  loses to 4 — drop it         [4, 7, 9]                   4
     8  beats 4 — evict it           [7, 8, 9]                   7
     3  loses to 7 — drop it         [7, 8, 9]                   7
     6  loses to 7 — drop it         [7, 8, 9]                   7
     5  loses to 7 — drop it         [7, 8, 9]                   7

the k largest: [9, 8, 7]

the heap holds the k largest, and its root is the *smallest* of them —
which is exactly the value a new arrival has to beat to get in.
a max-heap of size k would put the largest on top, and the largest is
the one element you never need to look at.`,
          explanation:
            "The root of the heap is the *weakest thing currently in the answer*, which makes the admission test a single O(1) comparison: anything that does not beat it cannot belong. That is the whole reason the heap is a min-heap when the question asks for the largest. The heap never grows past k, so each of the n arrivals costs O(log k) at worst and most cost nothing at all \u2014 on this input, four of the nine were rejected without a single swap.",
        },
      ],
      visual: {
        id: "topk-visual",
        kind: "heap",
        title: "The root as the bar to clear",
      },
    },
    {
      id: "what-it-buys",
      heading: "n log k, and where that stops mattering",
      body: [
        "Sorting everything and slicing the front is O(n log n), correct, one line, and frequently the right answer. The heap is O(n log k), and the case for it has to be made rather than assumed.",
        "The saving is genuine when k is small and n is large \u2014 a sixth of the work at n = 10\u2076 and k = 10. It shrinks as k grows, and at k = n the heap approach is a sort with worse constants than the one in the standard library.",
        "There is also a third option worth naming: **quickselect** partitions around a pivot and finds the k-th largest in O(n) expected time, then the k largest fall out of the partition for free. It beats both when all the data is in memory and you do not need the result ordered. It is O(n\u00b2) in the worst case, needs random pivots to avoid that in practice, and it reorders the input.",
        "The honest summary: sort for clarity, heap for streams and small k, quickselect when n is huge, memory-resident, and the constant factor is worth the extra code.",
      ],
      examples: [
        {
          id: "top-k-cost",
          title: "Against sorting, and where the win ends",
          lang: "python",
          code: `import heapq
import math

seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def top_k_by_heap(values, k):
    """A heap of size k: O(n log k)."""
    heap = []
    for v in values:
        if len(heap) < k:
            heapq.heappush(heap, v)
        elif v > heap[0]:
            heapq.heappushpop(heap, v)
    return sorted(heap, reverse=True)


def top_k_by_sorting(values, k):
    """Sort everything, take k: O(n log n)."""
    return sorted(values, reverse=True)[:k]


print(f"{'n':>9} {'k':>5} {'n log2 k':>12} {'n log2 n':>12} {'sort/heap':>10}")
print("-" * 54)
for n in (1_000, 100_000, 1_000_000):
    for k in (10, 1_000):
        heap_work = n * math.log2(k)
        sort_work = n * math.log2(n)
        print(f"{n:>9} {k:>5} {heap_work:>12,.0f} {sort_work:>12,.0f} {sort_work / heap_work:>9.1f}x")

print()
data = [next_rand() % 100_000 for _ in range(20_000)]
by_heap = top_k_by_heap(data, 10)
by_sort = top_k_by_sorting(data, 10)
print("same answer on 20,000 values:", "yes" if by_heap == by_sort else "no")
print("top 10:", by_heap)
print()
print("the win is real but bounded: k has to stay small for log k to beat log n.")
print("at k = n the heap approach *is* a sort, and a slower one than the library's.")`,
          output: `        n     k     n log2 k     n log2 n  sort/heap
------------------------------------------------------
     1000    10        3,322        9,966       3.0x
     1000  1000        9,966        9,966       1.0x
   100000    10      332,193    1,660,964       5.0x
   100000  1000      996,578    1,660,964       1.7x
  1000000    10    3,321,928   19,931,569       6.0x
  1000000  1000    9,965,784   19,931,569       2.0x

same answer on 20,000 values: yes
top 10: [99998, 99998, 99993, 99992, 99987, 99986, 99982, 99981, 99955, 99952]

the win is real but bounded: k has to stay small for log k to beat log n.
at k = n the heap approach *is* a sort, and a slower one than the library's.`,
          explanation:
            "n log k against n log n is a real saving but a bounded one, and the table is worth reading before reaching for the heap reflexively. At k = 10 the heap does a sixth of the work at a million elements; at k = 1000 it does half; at k = n it does the same work as a sort while being a worse sort. The other thing the table does not show is constants \u2014 a library sort is a tuned, cache-friendly, branch-predictable routine, and a heap is a pointer-jumping walk over a tree, so for small n the sort frequently wins outright despite the asymptotics.",
        },
      ],
    },
    {
      id: "the-follow-up",
      heading: "The question behind the question",
      body: [
        "Top-K is asked so often not because the answer is hard but because the follow-up separates people, and the follow-up is always about scale.",
        "*What if there are a billion records?* The capped heap already handles it \u2014 it holds k, not n. *What if it is a stream with no end?* Same code; the heap is the running answer and can be read at any moment. *What if the data is spread over a hundred machines?* Each machine keeps its own top k, the coordinator merges a hundred heaps of k, which is the same algorithm one level up.",
        "None of those need a new idea, which is the point. Choosing the capped min-heap at the start is what makes all three answers immediate, and choosing the heapify-everything version means starting over.",
      ],
      examples: [
        {
          id: "wrong-heap",
          title: "The version that does not survive the follow-up",
          lang: "python",
          code: `import heapq

values = [7, 2, 9, 4, 1, 8, 3, 6, 5]
k = 3

# The tempting version: a max-heap of everything, popped k times.
max_heap = [-v for v in values]
heapq.heapify(max_heap)
answer = [-heapq.heappop(max_heap) for _ in range(k)]
print("max-heap of all n, popped k times:", answer)
print(f"  correct, but the heap held all {len(values)} values")
print(f"  O(n) to build + O(k log n) to pop — fine when n fits in memory")
print()

# The version that scales: a min-heap of only k.
min_heap = []
for v in values:
    heapq.heappush(min_heap, v)
    if len(min_heap) > k:
        heapq.heappop(min_heap)          # evict the smallest kept
print("min-heap capped at k:            ", sorted(min_heap, reverse=True))
print(f"  the heap never held more than {k} values")
print("  O(n log k), and it works on a stream that does not fit in memory")
print()
print("both are correct. The second is the one that survives the follow-up")
print("question, which is always some version of \\"now n does not fit\\".")`,
          output: `max-heap of all n, popped k times: [9, 8, 7]
  correct, but the heap held all 9 values
  O(n) to build + O(k log n) to pop — fine when n fits in memory

min-heap capped at k:             [9, 8, 7]
  the heap never held more than 3 values
  O(n log k), and it works on a stream that does not fit in memory

both are correct. The second is the one that survives the follow-up
question, which is always some version of "now n does not fit".`,
          explanation:
            "Both produce the right answer, and in an interview the difference between them is the entire point of the question. Heapifying all of n and popping k times is O(n + k log n) and needs every element in memory at once. Capping a min-heap at k is O(n log k) and needs k. When the follow-up arrives \u2014 and it always does, phrased as *now imagine a billion records* or *now it is a stream* \u2014 the first approach has nowhere to go and the second is already the answer.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is a min-heap the right structure for finding the k largest elements?",
      answer:
        "Because the operation the algorithm repeats is *decide whether this new value belongs in the answer*, and it belongs exactly when it beats the weakest value currently kept. A min-heap puts that weakest value at the root, so the test is one comparison and the eviction is one pop. A max-heap would surface the largest kept value, which is the one element the decision never involves, and finding the weakest would cost O(k) per arrival.",
    },
    {
      question: "What is the complexity, and when would you just sort instead?",
      answer:
        "O(n log k): each of n elements costs at most one push and one pop on a heap that never exceeds k. Sorting is O(n log n), which is worse asymptotically but has far better constants \u2014 a library sort is cache-friendly and branch-predictable where a heap jumps around an array. So for small n, or when k is close to n, sorting is faster in wall-clock terms as well as simpler. The heap earns its place when k is small and n is large, and it becomes the only option when n does not fit in memory.",
    },
    {
      question: "The interviewer says the input is now an unbounded stream. What changes?",
      answer:
        "Nothing, if the heap was capped at k from the start \u2014 it holds the k largest seen so far, it never grows, and it can be read at any point. That is the reason to prefer it over heapifying the whole array and popping k times, which needs every element present at once. If the data is also distributed, the same algorithm composes: each shard keeps its own top k and a coordinator merges those, which is a k-way merge over a handful of small heaps.",
    },
  ],
  takeaways: [
    "For the k largest, use a min-heap; for the k smallest, a max-heap. The root is what gets evicted next.",
    "Cap the heap at k. A heap holding all of n answers the same question and fails the streaming follow-up.",
    "O(n log k) beats O(n log n) only while k stays small \u2014 at k = n it is a sort with worse constants.",
    "Quickselect is O(n) expected and beats both in memory, at the cost of reordering the input and an O(n\u00b2) worst case.",
    "The streaming, unbounded and distributed versions all reduce to the same capped heap, which is why the question gets asked.",
  ],
  status: "available",
};
