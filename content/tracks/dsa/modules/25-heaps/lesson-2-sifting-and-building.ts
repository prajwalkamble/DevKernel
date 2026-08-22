import type { Lesson } from "@/content/types";

export const siftingLesson: Lesson = {
  id: "dsa-heap-sifting",
  slug: "sifting-and-building",
  moduleSlug: "heaps-and-priority-queues",
  title: "Sift Up, Sift Down, and the O(n) Build",
  summary:
    "Two operations, both of which move one value along one path. Then the result that catches people out: turning an arbitrary array into a heap is linear, not n log n, and the reason is where the work sits.",
  estimatedMinutes: 35,
  objectives: [
    "Write sift up and sift down, and say what each one's stopping condition means",
    "Explain why pop promotes the last element rather than a child",
    "Build a heap in place, and justify the O(n) with the shape of the work",
    "Choose between building in place and pushing one at a time",
  ],
  sections: [
    {
      id: "one-path",
      heading: "Every repair is one path",
      body: [
        "The heap property can only be broken in one place at a time, and that is what makes it cheap to maintain. Add a value at the end and the only thing that can be wrong is the relationship between it and its parent. Take the root away and the only thing that can be wrong is the relationship between the replacement and its children.",
        "So the two operations are one idea in two directions. **Sift up** walks a value toward the root while its parent is larger. **Sift down** walks a value toward the leaves while a child is smaller. Both stop as soon as the local relationship holds, because everything beyond that point was already correct.",
        "Neither touches anything off that path. In a complete tree the longest path is \u230alog\u2082 n\u230b edges, so both are O(log n) \u2014 and unlike a balanced search tree there is no rotation, no colour, no rebalancing pass. The structure repairs itself by moving one value.",
      ],
      examples: [
        {
          id: "sift-up",
          title: "Push: append, then climb",
          lang: "python",
          code: `import math


def sift_up(heap, i):
    """Walk one value toward the root until its parent is no larger."""
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            break
        print(f"    heap[{p}]={heap[p]} > heap[{i}]={heap[i]}  -> swap")
        heap[p], heap[i] = heap[i], heap[p]
        i = p
    return i


def push(heap, v):
    print(f"push {v}: append, then sift up from index {len(heap)}")
    heap.append(v)
    end = sift_up(heap, len(heap) - 1)
    print(f"    settled at index {end}: {heap}")


heap = [1, 3, 6, 5, 9, 8]
print("start:", heap)
push(heap, 4)
push(heap, 0)
print()
print("each push touched one root-to-leaf path and nothing else.")
height = math.floor(math.log2(len(heap)))
print(f"a heap of {len(heap)} has height {height}, so that path is at most {height} swaps.")`,
          output: `start: [1, 3, 6, 5, 9, 8]
push 4: append, then sift up from index 6
    heap[2]=6 > heap[6]=4  -> swap
    settled at index 2: [1, 3, 4, 5, 9, 8, 6]
push 0: append, then sift up from index 7
    heap[3]=5 > heap[7]=0  -> swap
    heap[1]=3 > heap[3]=0  -> swap
    heap[0]=1 > heap[1]=0  -> swap
    settled at index 0: [0, 1, 4, 3, 9, 8, 6, 5]

each push touched one root-to-leaf path and nothing else.
a heap of 8 has height 3, so that path is at most 3 swaps.`,
          explanation:
            "Appending keeps the tree complete, and then exactly one thing can be wrong \u2014 the new value may be smaller than its parent. Fixing that may break the same property one level up, so the repair walks upward until it stops, which is at most the height of the tree. Note the loop condition: it stops the moment the parent is no larger, because everything above that point was already correct and nothing the new value did could have changed it.",
        },
      ],
      visual: {
        id: "sift-visual",
        kind: "heap",
        title: "One value, one path",
      },
    },
    {
      id: "the-hole",
      heading: "Why pop takes from the end",
      body: [
        "Removing the root leaves a hole, and how you fill it decides whether the array stays dense.",
        "The tempting move is to promote the smaller of the two children, then fill *its* hole the same way. That produces a correct heap by ordering \u2014 and a tree with a gap somewhere in the last level, which destroys completeness and with it the index arithmetic that the whole structure rests on.",
        "So the last element moves to the root instead. It is the only element that can be removed without opening a hole. It is also, almost certainly, one of the largest things in the heap, so it immediately falls most of the way back down \u2014 which looks wasteful and is not: the path it falls is the same O(log n) the alternative would have cost, and the array stays contiguous.",
      ],
      examples: [
        {
          id: "sift-down",
          title: "Pop: take the last, then fall",
          lang: "python",
          code: `def sift_down(heap, i, n):
    """Walk one value toward the leaves until both children are no smaller."""
    while True:
        smallest = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < n and heap[c] < heap[smallest]:
                smallest = c
        if smallest == i:
            return i
        print(f"    heap[{i}]={heap[i]} > heap[{smallest}]={heap[smallest]}  -> swap")
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest


def pop(heap):
    smallest = heap[0]
    last = heap.pop()
    print(f"pop {smallest}: move {last} from the end to the root, then sift down")
    if heap:
        heap[0] = last
        end = sift_down(heap, 0, len(heap))
        print(f"    settled at index {end}: {heap}")
    return smallest


heap = [0, 1, 4, 3, 9, 8, 6, 5]
print("start:", heap)
pop(heap)
pop(heap)
print()
print("the last element is the only one that can leave without opening a hole,")
print("which is why it — and not a child — is what replaces the root.")
print()
print("note the comparison count: two children per level, so sift-down does")
print("two comparisons per step where sift-up does one. Same O(log n), twice the constant.")`,
          output: `start: [0, 1, 4, 3, 9, 8, 6, 5]
pop 0: move 5 from the end to the root, then sift down
    heap[0]=5 > heap[1]=1  -> swap
    heap[1]=5 > heap[3]=3  -> swap
    settled at index 3: [1, 3, 4, 5, 9, 8, 6]
pop 1: move 6 from the end to the root, then sift down
    heap[0]=6 > heap[1]=3  -> swap
    heap[1]=6 > heap[3]=5  -> swap
    settled at index 3: [3, 5, 4, 6, 9, 8]

the last element is the only one that can leave without opening a hole,
which is why it — and not a child — is what replaces the root.

note the comparison count: two children per level, so sift-down does
two comparisons per step where sift-up does one. Same O(log n), twice the constant.`,
          explanation:
            "The obvious move \u2014 promote the smaller child into the hole and repeat \u2014 leaves a hole at a leaf and breaks completeness. Taking the *last* element instead keeps the array dense, at the cost of putting an almost-certainly-wrong value at the root, which then falls. The asymmetry with sift-up is worth noticing: climbing compares against one parent, falling compares against two children, so pop does roughly twice the comparisons of push at the same height.",
        },
      ],
    },
    {
      id: "build",
      heading: "Building a heap from a pile",
      body: [
        "Given n values already in hand, there are two ways to make them a heap, and they do not cost the same.",
        "Push them one at a time and you do n sift-ups. Each one starts at a leaf, which is where most of the array lives, so in the worst case each climbs the full height: O(n log n).",
        "Or drop the whole array in as it stands and sift *down* from the last internal node backwards. Every leaf is already a valid one-element heap, so half the array needs no work at all; the level above moves at most one step, the level above that at most two. The work is dominated by the many cheap nodes rather than the few expensive ones, and the total is O(n) \u2014 a genuinely surprising result the first time you meet it, and one of the few places where a tighter analysis changes the complexity rather than just the constant.",
        "The practical rule: if you already have the data, build in place. If it arrives over time, you have no choice but to push.",
      ],
      examples: [
        {
          id: "build-heap",
          title: "Building in place, and the O(n) that surprises people",
          lang: "python",
          code: `swaps = 0


def sift_down(heap, i, n):
    global swaps
    while True:
        smallest = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < n and heap[c] < heap[smallest]:
                smallest = c
        if smallest == i:
            return
        heap[i], heap[smallest] = heap[smallest], heap[i]
        swaps += 1
        i = smallest


def sift_up(heap, i):
    global swaps
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            return
        heap[p], heap[i] = heap[i], heap[p]
        swaps += 1
        i = p


def build_by_pushing(values):
    global swaps
    swaps = 0
    heap = []
    for v in values:
        heap.append(v)
        sift_up(heap, len(heap) - 1)
    return heap, swaps


def build_in_place(values):
    """Sift down from the last internal node backwards. The leaves are already heaps."""
    global swaps
    swaps = 0
    heap = list(values)
    for i in range(len(heap) // 2 - 1, -1, -1):
        sift_down(heap, i, len(heap))
    return heap, swaps


seed = 7


def next_rand():
    global seed
    seed = (seed * 16807) % 2147483647
    return seed


def report(name, make):
    print(f"{name}")
    print(f"{'n':>8} {'by pushing':>12} {'in place':>10} {'ratio':>7}")
    print("-" * 40)
    for n in (8, 64, 1_000, 100_000):
        data = make(n)
        a, pushes = build_by_pushing(data)
        b, inplace = build_in_place(data)
        assert a[0] == b[0] == min(data)
        print(f"{n:>8} {pushes:>12,} {inplace:>10,} {pushes / max(inplace, 1):>6.2f}x")
    print()


report("random input", lambda n: [next_rand() % 1000 for _ in range(n)])
report("descending input — the worst case for pushing", lambda n: list(range(n, 0, -1)))

print("the asymptotic claim is about the second table, not the first.")
print("on random data almost every pushed value stops within a step or two of")
print("where it landed, so both builds are linear and the gap is a constant.")
print("feed it descending values and every single push travels to the root:")
print("that is the O(n log n) the textbook means, and in-place stays O(n).")`,
          output: `random input
       n   by pushing   in place   ratio
----------------------------------------
       8            7          6   1.17x
      64           64         40   1.60x
    1000        1,325        764   1.73x
  100000      127,062     74,200   1.71x

descending input — the worst case for pushing
       n   by pushing   in place   ratio
----------------------------------------
       8           13          6   2.17x
      64          264         59   4.47x
    1000        7,987        992   8.05x
  100000    1,468,946     99,990  14.69x

the asymptotic claim is about the second table, not the first.
on random data almost every pushed value stops within a step or two of
where it landed, so both builds are linear and the gap is a constant.
feed it descending values and every single push travels to the root:
that is the O(n log n) the textbook means, and in-place stays O(n).`,
          explanation:
            "The counting is the argument. Sifting *down* from the middle backwards does most of its work near the leaves, where there is almost nowhere to fall: half the elements are leaves and move zero steps, a quarter move at most one, and the sum \u2211 n/2^k \u00b7 k converges to 2n. Sifting *up* has the opposite profile \u2014 most elements are near the leaves, and from there the path to the root is the full height. The second table is where that shows: with values arriving in descending order every push climbs the whole way, and the ratio grows with n exactly as O(n log n) against O(n) predicts. The first table is the honest caveat \u2014 on random input both are linear in practice and the difference is a constant.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through popping the minimum from a binary heap.",
      answer:
        "Save the root, move the last element into the root, shrink the array by one, then sift down: compare the value against both children, swap with the smaller if it is smaller than the value, and repeat until neither child is smaller or a leaf is reached. The last element is used because it is the only removal that keeps the tree complete — promoting a child would leave a gap in the last level and break the index arithmetic. Cost is O(log n), with two comparisons per level rather than the one that sift up needs.",
    },
    {
      question: "Building a heap from n elements is O(n). Where does the log go?",
      answer:
        "It goes into nodes that mostly cannot move. Sifting down from the last internal node backwards, the leaves — half the array — do no work at all, the level above moves at most one step, the one above that at most two. The total is the sum over levels of (nodes at that level) × (height above the leaves), which is ∑ n/2^(k+1) · k, and that converges to n rather than growing with log n. Doing it the other way, by pushing, inverts the profile: most elements start at the leaves and can climb the full height, which is where the O(n log n) comes from.",
    },
    {
      question: "Does sift down do anything different from sift up beyond direction?",
      answer:
        "It has to pick a child, and picking the wrong one silently breaks the heap. The swap must go to the *smaller* of the two children in a min-heap: swapping with the larger one can leave that larger value as the parent of a smaller sibling. It also costs twice as many comparisons per level, since each step compares against two children instead of one parent — same O(log n), noticeably different constant, which is why heapsort loses to quicksort in practice despite the better worst case.",
    },
  ],
  takeaways: [
    "Sift up and sift down are the same idea in two directions, and both touch exactly one root-to-leaf path.",
    "Both stop as soon as the local relation holds, because everything past that point was already correct.",
    "Pop promotes the last element, not a child: it is the only removal that keeps the tree complete.",
    "Sift down compares against two children, so pop costs about twice what push does at the same height.",
    "Building in place is O(n) because the work concentrates where there is nowhere to fall; pushing n times is O(n log n) in the worst case.",
  ],
  status: "available",
};
