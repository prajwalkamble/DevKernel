import type { Lesson } from "@/content/types";

export const heapPropertyLesson: Lesson = {
  id: "dsa-heap-property",
  slug: "the-heap-property-and-the-array",
  moduleSlug: "heaps-and-priority-queues",
  title: "The Heap Property, and Why an Array Is the Right Home",
  summary:
    "A heap promises much less than a search tree — only that a parent beats its children — and gets a far cheaper repair in exchange. The array is not an optimisation of the tree; it is the tree.",
  estimatedMinutes: 30,
  objectives: [
    "State the heap property, and say what it deliberately does not order",
    "Move between an index and its parent and children without drawing anything",
    "Explain why completeness is what licenses the index arithmetic",
    "Say what a heap cannot answer, and reach for something else when asked",
  ],
  sections: [
    {
      id: "the-weakest-invariant",
      heading: "The weakest invariant that still works",
      body: [
        "A binary search tree orders everything: for any node, the whole left subtree is smaller and the whole right subtree is larger. That is a strong promise, and keeping it is why insertion has to find the one correct position and why the tree needs balancing to stay useful.",
        "A heap promises far less. Every node is smaller than its children \u2014 and that is all. Siblings are unordered. Cousins are unordered. A value three levels down may be smaller than a value one level down in another subtree. The only thing the structure guarantees is that the smallest element in the whole collection is sitting at the root.",
        "That weakness is the feature. Because the promise is local, repairing it after a change is local too: a value moves along one root-to-leaf path and nothing else in the tree has to be touched. One path in a complete tree is \u230alog\u2082 n\u230b steps, so insertion and removal are O(log n) with a small constant and no rebalancing machinery at all.",
        "So the question a heap answers is narrow and the answer is instant: **what is the smallest thing here?** If that is the question your problem keeps asking, this is the structure. If you find yourself wanting anything else from it, you have probably picked the wrong one.",
      ],
      examples: [
        {
          id: "array-and-tree",
          title: "One array, read two ways",
          lang: "python",
          code: `def parent(i):
    return (i - 1) // 2


def left(i):
    return 2 * i + 1


def right(i):
    return 2 * i + 2


heap = [1, 3, 6, 5, 9, 8]
print("array:", heap)
print()

print("the same array read as levels of a tree:")
level, start = 0, 0
while start < len(heap):
    row = heap[start:start + 2 ** level]
    print(f"  level {level}: {' '.join(str(v) for v in row)}")
    start += 2 ** level
    level += 1

print()
print(f"{'i':>3} {'value':>6} {'parent':>8} {'left':>6} {'right':>7}")
print("-" * 34)
for i, v in enumerate(heap):
    p = "-" if i == 0 else f"{heap[parent(i)]}@{parent(i)}"
    l = f"{heap[left(i)]}@{left(i)}" if left(i) < len(heap) else "-"
    r = f"{heap[right(i)]}@{right(i)}" if right(i) < len(heap) else "-"
    print(f"{i:>3} {v:>6} {p:>8} {l:>6} {r:>7}")

print()
print("the invariant is only ever parent <= child:")
for i in range(1, len(heap)):
    print(f"  heap[{parent(i)}]={heap[parent(i)]} <= heap[{i}]={heap[i]}")
print("no rule relates 3 and 6, or 5 and 8 — siblings are unordered")`,
          output: `array: [1, 3, 6, 5, 9, 8]

the same array read as levels of a tree:
  level 0: 1
  level 1: 3 6
  level 2: 5 9 8

  i  value   parent   left   right
----------------------------------
  0      1        -    3@1     6@2
  1      3      1@0    5@3     9@4
  2      6      1@0    8@5       -
  3      5      3@1      -       -
  4      9      3@1      -       -
  5      8      6@2      -       -

the invariant is only ever parent <= child:
  heap[0]=1 <= heap[1]=3
  heap[0]=1 <= heap[2]=6
  heap[1]=3 <= heap[3]=5
  heap[1]=3 <= heap[4]=9
  heap[2]=6 <= heap[5]=8
no rule relates 3 and 6, or 5 and 8 — siblings are unordered`,
          explanation:
            "The tree is a way of reading the array, not a thing that exists alongside it. `2i + 1`, `2i + 2` and `(i - 1) // 2` are the whole data structure \u2014 there is no node object, no left pointer, no allocation per element. The last block is the point of the lesson: the invariant relates a node to its *children only*. `3` and `6` are siblings and the heap says nothing about which is larger, which is exactly why maintaining it is cheap.",
        },
      ],
      visual: {
        id: "heap-shape-visual",
        kind: "heap",
        title: "Sift up, and the one path it touches",
      },
    },
    {
      id: "the-array",
      heading: "The array is the structure, not a representation of it",
      body: [
        "Drawn on a whiteboard a heap is a tree, and that picture is worth keeping \u2014 but there is no tree in memory. There is one flat array, and three index formulas that let you read it as a tree.",
        "Children of `i` live at `2i + 1` and `2i + 2`; the parent of `i` lives at `(i - 1) // 2`. Nothing is stored to make that true. It is arithmetic, so it costs nothing to compute and nothing to keep.",
        "This is why a heap outruns a pointer-based tree by more than the complexity suggests. There is no node allocation, no pointer chasing, and the whole structure is contiguous \u2014 so walking a parent-to-child path reads memory the cache has usually already fetched. The constant factor is small in a way that O(log n) does not capture.",
      ],
      examples: [
        {
          id: "completeness",
          title: "Why the array never has a hole",
          lang: "python",
          code: `import heapq

heap = []
print(f"{'push':>6}  {'array after':<28} {'levels':<18} min")
print("-" * 62)
for v in (5, 3, 8, 1, 9, 2):
    heapq.heappush(heap, v)
    levels, level, start = [], 0, 0
    while start < len(heap):
        levels.append("".join(str(x) for x in heap[start:start + 2 ** level]))
        start += 2 ** level
        level += 1
    print(f"{v:>6}  {str(heap):<28} {'|'.join(levels):<18} {heap[0]}")

print()
print("the array never has a hole in it, because the tree is always complete:")
print("every level is full except the last, and the last fills left to right.")
print()
print("that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need")
print("real pointers, and the whole reason a heap is fast would be gone.")`,
          output: `  push  array after                  levels             min
--------------------------------------------------------------
     5  [5]                          5                  5
     3  [3, 5]                       3|5                3
     8  [3, 5, 8]                    3|58               3
     1  [1, 3, 8, 5]                 1|38|5             1
     9  [1, 3, 8, 5, 9]              1|38|59            1
     2  [1, 3, 2, 5, 9, 8]           1|32|598           1

the array never has a hole in it, because the tree is always complete:
every level is full except the last, and the last fills left to right.

that is what makes 2i+1 and 2i+2 valid. A tree with a gap would need
real pointers, and the whole reason a heap is fast would be gone.`,
          explanation:
            "A binary heap is always a **complete** tree: every level full except the last, and the last filled left to right. That is not a coincidence to be maintained with care \u2014 it falls out of always appending at the end and always removing from the end. Completeness is what licenses the index arithmetic, and the index arithmetic is what makes the structure fast, so the shape rule and the speed are the same fact.",
        },
      ],
    },
    {
      id: "the-trade",
      heading: "What you gave up to get it",
      body: [
        "It is worth being explicit about what is now impossible, because the failure mode is reaching for a heap and then discovering halfway through that it cannot answer the question you actually have.",
        "**Searching is O(n).** There is no ordering to steer a search by, so finding an arbitrary value means scanning every element. A heap is not a set.",
        "**There is no k-th smallest.** The root is the minimum and the rest is unordered, so the second-smallest is *one of two* candidates, the third is one of a larger set, and past that the structure tells you nothing without dismantling it.",
        "**Iteration is not sorted.** Walking the array visits elements in level order, which is not sorted order and is not any order a problem is likely to want. Repeatedly popping *does* give sorted order \u2014 that is heapsort \u2014 but it destroys the heap and costs O(n log n).",
        "Against that, the two things it does give are worth a great deal: the minimum in O(1), and insertion in O(log n) with no rebalancing. Whole families of problems are exactly that shape.",
      ],
      examples: [
        {
          id: "not-sorted",
          title: "What it answers, and what it refuses",
          lang: "python",
          code: `import math

heap = [1, 3, 6, 5, 9, 8]

print("heap:  ", heap)
print("sorted:", sorted(heap))
print("a heap is not a sorted array, and never claims to be")
print()

print("what it answers in O(1):")
print(f"  smallest = heap[0] = {heap[0]}")
print()

print("what it will not answer without a full scan:")
for target in (8, 4):
    steps = 0
    found = False
    for v in heap:                       # no ordering to steer a search by
        steps += 1
        if v == target:
            found = True
            break
    print(f"  is {target} present? {'yes' if found else 'no':3}  after {steps} comparisons of {len(heap)}")

print()
print("contrast a sorted array, where the same question is a binary search:")
print(f"  ~log2({len(heap)}) = {math.ceil(math.log2(len(heap)))} comparisons, and it also answers 'what is the 3rd smallest'")
print()
print("the heap gives up both to make insertion O(log n) instead of O(n)")`,
          output: `heap:   [1, 3, 6, 5, 9, 8]
sorted: [1, 3, 5, 6, 8, 9]
a heap is not a sorted array, and never claims to be

what it answers in O(1):
  smallest = heap[0] = 1

what it will not answer without a full scan:
  is 8 present? yes  after 6 comparisons of 6
  is 4 present? no   after 6 comparisons of 6

contrast a sorted array, where the same question is a binary search:
  ~log2(6) = 3 comparisons, and it also answers 'what is the 3rd smallest'

the heap gives up both to make insertion O(log n) instead of O(n)`,
          explanation:
            "Every structure is a trade, and this is the heap's. A sorted array answers *is x present*, *what is the k-th smallest* and *what is in this range*, all in O(log n) or better \u2014 and pays O(n) for every insertion. The heap answers exactly one question, *what is the smallest*, and pays O(log n) to insert. Reaching for a heap when the question is membership is a common and expensive mistake.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is a binary heap stored in an array rather than with node objects?",
      answer:
        "Because a heap is always a complete tree, so the positions are known in advance and the parent-child relationships are arithmetic: children of i at 2i+1 and 2i+2, parent at (i-1)//2. Nothing needs to be stored to make that true. The result is one contiguous allocation instead of one per node, no pointer chasing, and cache behaviour that a linked tree cannot match. A tree with gaps could not do this, which is why completeness and speed are the same property here.",
    },
    {
      question: "A heap gives you the minimum in O(1). Why not use it to find the k-th smallest?",
      answer:
        "The heap orders a node against its children and nothing else, so below the root there is no ranking to read off. The second-smallest is one of the root's two children; the third is one of a larger frontier; past that the structure says nothing. You can get the k-th smallest by popping k times, which is O(k log n) and destroys the heap, or by keeping a size-k heap as you scan — but reading it out of the array directly is not possible, and an answer that claims otherwise is the tell that the invariant has not landed.",
    },
    {
      question: "When is a sorted array the better choice?",
      answer:
        "When the collection is built once and queried many times. A sorted array answers membership, k-th smallest and range queries in O(log n) or better, all of which a heap refuses. The heap wins when elements keep arriving: insertion is O(log n) against the sorted array's O(n), and if the only question ever asked is what the smallest element is, the sorted array's extra ordering is work nobody needed.",
    },
  ],
  takeaways: [
    "The heap property relates a node to its children only — siblings and cousins are deliberately unordered.",
    "A weaker invariant is a cheaper invariant: one root-to-leaf path repairs it, which is why there is no rebalancing.",
    "`2i + 1`, `2i + 2` and `(i - 1) // 2` are the entire structure. There are no nodes and no pointers.",
    "The array is dense because the tree is complete, and the tree is complete because insertion appends and removal takes from the end.",
    "A heap is not a set and not a sorted array: search is O(n) and there is no k-th smallest.",
  ],
  status: "available",
};
