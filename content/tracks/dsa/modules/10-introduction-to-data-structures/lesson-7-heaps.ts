import type { Lesson } from "@/content/types";

export const heapsLesson: Lesson = {
  id: "dsa-ds-heaps",
  slug: "heaps-and-priority-queues",
  moduleSlug: "introduction-to-data-structures",
  title: "Heaps & Priority Queues",
  summary:
    "A tree stored in an array, why partial order is enough, and the top-k pattern that turns O(n log n) into O(n log k).",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain the heap property and the array-index arithmetic behind it",
    "Use a min-heap in both languages and fake a max-heap in Python",
    "Apply the size-k heap pattern for top-k problems",
    "Say why a heap cannot search and why that is the point",
  ],
  sections: [
    {
      id: "partial-order",
      heading: "Partial order is enough",
      body: [
        "A sorted array answers \"what is the smallest?\" in O(1), and costs O(n log n) to build and O(n) to insert into. That is far more order than the question needs.",
        "A heap maintains only the **heap property**: every parent is at most each of its children. That says nothing about siblings and nothing about the overall arrangement — but it does guarantee **the smallest element is at the root**, which is the only thing a priority queue needs.",
        "Maintaining that much less order is much cheaper: **insert O(log n), remove the minimum O(log n), peek at the minimum O(1)**, and building one from an existing array is O(n).",
        "This is the general shape of a good data structure: identify the least order the problem needs, and pay only for that.",
      ],
      examples: [
        {
          id: "heap-basics",
          title: "Pushing, peeking, popping",
          lang: "python",
          code: `import heapq

h = []
for x in [5, 3, 8, 1, 9, 2]:
    heapq.heappush(h, x)
    print(f"  push {x}: {h}")

print()
print("the list is not sorted, only heap-ordered:", h)
print("smallest is always at index 0:", h[0])
print("popping gives sorted order:", [heapq.heappop(h) for _ in range(6)])

print()
values = [5, 3, 8, 1, 9, 2]
heapq.heapify(values)
print("heapify in O(n):", values)
print("three smallest:", heapq.nsmallest(3, [5, 3, 8, 1, 9, 2]))
print("three largest :", heapq.nlargest(3, [5, 3, 8, 1, 9, 2]))`,
          output: `  push 5: [5]
  push 3: [3, 5]
  push 8: [3, 5, 8]
  push 1: [1, 3, 8, 5]
  push 9: [1, 3, 8, 5, 9]
  push 2: [1, 3, 2, 5, 9, 8]

the list is not sorted, only heap-ordered: [1, 3, 2, 5, 9, 8]
smallest is always at index 0: 1
popping gives sorted order: [1, 2, 3, 5, 8, 9]

heapify in O(n): [1, 3, 2, 5, 9, 8]
three smallest: [1, 2, 3]
three largest : [9, 8, 5]`,
          explanation:
            "`[1, 3, 2, 5, 9, 8]` is a valid heap and is obviously not sorted — 9 sits before 8. That is the partial order doing exactly as much as it must. Note `heapify` rearranges an existing list in **O(n)**, which is cheaper than n pushes at O(n log n), so build from a list whenever you have one.",
        },
      ],
      pitfalls: [
        {
          title: "Reading a heap as if it were sorted",
          body: "Only index 0 is meaningful. Printing the list, iterating it, or taking `h[1]` as the second smallest are all wrong — `h[1]` is merely *a* child of the root. To get elements in order you must pop, or call `nsmallest`. Java's `PriorityQueue.toString` has the same trap and prints heap order too.",
        },
      ],
    },
    {
      id: "array-representation",
      heading: "A tree with no pointers",
      body: [
        "A heap is drawn as a binary tree and stored as a plain array, with the position arithmetic doing the work that references would otherwise do.",
        "**Children of index i:** `2i + 1` and `2i + 2`. **Parent of index i:** `(i - 1) // 2`.",
        "That works because a heap is a **complete** tree — every level full except possibly the last, which fills left to right — so there are no gaps and the indices line up exactly.",
        "The two operations follow immediately. **Sift up:** after appending at the end, swap with the parent while it is larger. **Sift down:** after moving the last element to the root, swap with the smaller child while it is smaller. Each walks one root-to-leaf path, which is why both are O(log n).",
        "No pointers means no allocation per element and perfect memory locality, which is why heaps are fast in practice as well as in theory.",
      ],
      examples: [
        {
          id: "indices",
          title: "The index arithmetic",
          lang: "python",
          code: `heap = [1, 3, 2, 7, 5, 8, 9]
print("as a list :", heap)
print()
print("index  value  parent  children")
for i, v in enumerate(heap):
    parent = (i - 1) // 2 if i > 0 else None
    left, right = 2 * i + 1, 2 * i + 2
    kids = [heap[j] for j in (left, right) if j < len(heap)]
    print(f"{i:>5}  {v:>5}  {str(heap[parent]) if parent is not None else '-':>6}  {kids}")

print()
print("the heap property: every parent <= each child")
print("holds:", all(heap[(i - 1) // 2] <= heap[i] for i in range(1, len(heap))))`,
          output: `as a list : [1, 3, 2, 7, 5, 8, 9]

index  value  parent  children
    0      1       -  [3, 2]
    1      3       1  [7, 5]
    2      2       1  [8, 9]
    3      7       3  []
    4      5       3  []
    5      8       2  []
    6      9       2  []

the heap property: every parent <= each child
holds: True`,
          explanation:
            "The whole check is one line: every element is at least its parent. Note it says nothing about siblings — 3 and 2 sit next to each other in the wrong order and the heap is still valid — and nothing about cousins. That is exactly the freedom that makes the operations O(log n) rather than O(n).",
        },
      ],
      visual: {
        id: "heap-visual",
        kind: "heap",
        title: "A min-heap, as a tree and as the array it really is",
      },
    },
    {
      id: "max-heaps",
      heading: "Faking a max-heap",
      body: [
        "**Python's `heapq` is a min-heap and offers no max variant.** Three ways round it, in order of preference.",
        "**Negate the values.** Push `-x`, pop and negate again. The largest value has the smallest negation, so a min-heap over the negatives is a max-heap over the originals. Ugly, allocation-free, and universally used.",
        "**Use `nlargest`.** Correct and clear for a one-off query, but it does not maintain a live heap.",
        "**Store tuples with a negated first element.** `(-priority, item)` when you need to keep the payload readable.",
        "**Java's `PriorityQueue` takes a comparator**, so `new PriorityQueue<>(Comparator.reverseOrder())` is a max-heap directly — one of the few places Java is tidier than Python for this material.",
      ],
      examples: [
        {
          id: "max-and-topk",
          title: "Negation, the top-k pattern, and tuple ordering",
          lang: "python",
          code: `import heapq

values = [5, 3, 8, 1, 9, 2]

negated = [-v for v in values]
heapq.heapify(negated)
print("max-heap by negation:", [-heapq.heappop(negated) for _ in range(len(values))])

print()


def k_largest(values, k):
    """Keep a min-heap of size k; the root is the k-th largest so far."""
    h = []
    for v in values:
        heapq.heappush(h, v)
        if len(h) > k:
            heapq.heappop(h)
    return sorted(h, reverse=True)


print("3 largest via a size-3 min-heap:", k_largest([5, 3, 8, 1, 9, 2], 3))
print("sorting instead would be O(n log n); this is O(n log k)")

print()
tasks = [(2, "write"), (1, "plan"), (3, "ship"), (1, "argue")]
heapq.heapify(tasks)
print("tuples compare element by element:")
while tasks:
    print("  ", heapq.heappop(tasks))`,
          output: `max-heap by negation: [9, 8, 5, 3, 2, 1]

3 largest via a size-3 min-heap: [9, 8, 5]
sorting instead would be O(n log n); this is O(n log k)

tuples compare element by element:
   (1, 'argue')
   (1, 'plan')
   (2, 'write')
   (3, 'ship')`,
          explanation:
            "The middle block is the pattern worth memorising. To find the k **largest**, keep a **min**-heap of size k — the root is the weakest survivor, so anything smaller is discarded immediately. It is O(n log k) time and O(k) space, which beats sorting when k is small and works on a stream that does not fit in memory. And note the tuples: ties on the first element are broken by the second, which sorts `argue` before `plan` — useful when you want a deterministic order, and a trap when the second element is not comparable.",
        },
      ],
      pitfalls: [
        {
          title: "Tuples whose second element cannot be compared",
          body: "`heappush(h, (priority, some_object))` works until two priorities tie, at which point the heap compares the objects and raises a `TypeError` — on an input that may not appear in your testing. The fix is a tiebreaker: push `(priority, counter, object)` with an incrementing counter, which is always comparable and also makes the ordering stable.",
        },
      ],
    },
    {
      id: "when",
      heading: "When a heap is the answer",
      body: [
        "**Top-k anything.** k largest, k closest, k most frequent. Size-k heap, O(n log k).",
        "**A running median.** Two heaps — a max-heap of the lower half and a min-heap of the upper — rebalanced so their sizes differ by at most one. The median is then at one or both roots.",
        "**Scheduling and merging.** Merge k sorted lists by keeping one element from each in a heap. Dijkstra's algorithm and A* are the same idea, always expanding the cheapest frontier node.",
        "**And when it is not:** a heap cannot search. Finding an arbitrary value is O(n) because the partial order gives no guidance about where to look, and deleting an arbitrary element needs its index, which the heap does not track. If you need both ordering and search, you want a balanced tree — the next lesson.",
      ],
      examples: [
        {
          id: "java-pq",
          title: "Java: comparators do the work",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> min = new PriorityQueue<>();
        for (int x : new int[] { 5, 3, 8, 1, 9, 2 }) min.offer(x);
        System.out.println("min-heap peek: " + min.peek());
        StringBuilder sb = new StringBuilder();
        while (!min.isEmpty()) sb.append(min.poll()).append(" ");
        System.out.println("drained: " + sb.toString().trim());

        PriorityQueue<Integer> max = new PriorityQueue<>(Comparator.reverseOrder());
        for (int x : new int[] { 5, 3, 8, 1, 9, 2 }) max.offer(x);
        System.out.println("max-heap peek: " + max.peek());

        PriorityQueue<int[]> bySecond = new PriorityQueue<>((a, b) -> a[1] - b[1]);
        bySecond.offer(new int[] { 1, 30 });
        bySecond.offer(new int[] { 2, 10 });
        bySecond.offer(new int[] { 3, 20 });
        System.out.println("by second field: " + Arrays.toString(bySecond.poll()));

        PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 3, 8));
        System.out.println("toString is heap order, not sorted: " + pq);
    }
}`,
          output: `min-heap peek: 1
drained: 1 2 3 5 8 9
max-heap peek: 9
by second field: [2, 10]
toString is heap order, not sorted: [3, 5, 8]`,
          explanation:
            "A comparator makes a max-heap or any custom ordering trivial, with no negation trick needed. One warning about `(a, b) -> a[1] - b[1]`: subtraction as a comparator **overflows** when the values span the int range, producing an inconsistent ordering that can throw at run time. `Integer.compare(a[1], b[1])` is the safe form and should be your default.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a heap and how is it stored?",
      answer:
        "A complete binary tree satisfying the heap property — every parent is at most each child — which guarantees the minimum is at the root while saying nothing about siblings. Because the tree is complete it is stored in a plain array with no pointers: children of i are at 2i+1 and 2i+2, and the parent is at (i−1)/2. Insert and remove-min are O(log n) because each sifts along one root-to-leaf path, peek is O(1), and building from an existing array is O(n).",
    },
    {
      question: "How do you find the k largest elements in a stream?",
      answer:
        "Keep a **min**-heap of size k. Push each element and pop whenever the size exceeds k, so the root is always the weakest of the current top k and anything smaller is discarded at once. That is O(n log k) time and O(k) space, which beats sorting's O(n log n) when k is small and works on data that does not fit in memory. The mirror trick — a max-heap for the k smallest — is the same idea inverted.",
    },
    {
      question: "How do you get a max-heap in Python?",
      answer:
        "`heapq` is min-only, so you negate: push `-x` and negate on the way out, since the largest value has the smallest negation. For tuples, negate just the priority — `(-priority, item)`. `heapq.nlargest` is clearer for a one-off query but does not maintain a live heap. Java sidesteps all this because `PriorityQueue` accepts a comparator, so `Comparator.reverseOrder()` gives a max-heap directly.",
    },
  ],
  takeaways: [
    "A heap maintains only that each parent ≤ its children — the least order a priority queue needs",
    "Insert and remove-min are O(log n), peek is O(1), and heapify is O(n)",
    "Stored as an array: children at 2i+1 and 2i+2, parent at (i−1)/2, no pointers at all",
    "Only index 0 is meaningful; the rest is not sorted and must not be read as such",
    "Python's `heapq` is min-only — negate for a max-heap; Java takes a comparator",
    "Top-k largest: a min-heap of size k, O(n log k) time and O(k) space",
    "Tuples break ties on later elements — add a counter so unorderable payloads never compare",
    "A heap cannot search: finding an arbitrary value is O(n), which is what trees are for",
  ],
};
