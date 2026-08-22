import type { Lesson } from "@/content/types";

export const schedulingLesson: Lesson = {
  id: "dsa-heap-scheduling",
  slug: "scheduling-intervals-and-the-heap-sheet",
  moduleSlug: "heaps-and-priority-queues",
  title: "Scheduling, Intervals, and the Heap Sheet",
  summary:
    "Where the heap meets greedy. Sorting decides the order things are considered in; the heap answers, in one comparison, what is available right now — and the module closes on the two questions that pick the shape.",
  estimatedMinutes: 35,
  objectives: [
    "Solve interval-overlap problems with a sorted pass and a heap of end times",
    "Separate the greedy choice from the structure that makes it cheap",
    "Recognise Huffman's argument in problems that do not mention encoding",
    "Pick a heap shape from what the root must be and what may be in it at once",
  ],
  sections: [
    {
      id: "sort-then-heap",
      heading: "Sort for the order, heap for the availability",
      body: [
        "A large family of scheduling problems has the same two-part answer, and it is worth seeing the parts as doing different jobs.",
        "**The sort fixes the order of consideration.** Rooms free up as time moves forward, so meetings must be examined in start order or the question *is anything free* has no meaning yet. The sort is a precondition, not the algorithm.",
        "**The heap answers availability in one comparison.** It holds one entry per resource in use, keyed so that the root is the one that becomes available first. A new arrival only ever needs to ask about that one \u2014 if the soonest-free room is not free yet, none of them are.",
        "Meeting Rooms II is the canonical instance, and the answer is not a count you maintain but the *size of the heap*, which is the number of resources simultaneously in use. The same shape solves minimum platforms, CPU-with-k-cores, and most of the problems that ask how many of something you need at once.",
      ],
      examples: [
        {
          id: "meeting-rooms",
          title: "One end time per room in use",
          lang: "python",
          code: `import heapq

meetings = [(0, 30), (5, 10), (15, 20), (25, 45), (35, 40)]

# Sort by start: rooms can only be reused in time order.
meetings.sort()
rooms = []          # min-heap of the times each busy room frees up

print(f"{'meeting':>12}  {'action':<34} {'rooms in use'}")
print("-" * 62)
for start, end in meetings:
    if rooms and rooms[0] <= start:
        freed = heapq.heappop(rooms)
        action = f"room freed at {freed} — reuse it"
    else:
        action = "nothing free — open another"
    heapq.heappush(rooms, end)
    print(f"{f'[{start},{end})':>12}  {action:<34} {len(rooms)}")

print()
print(f"rooms needed: {len(rooms)}")
print()
print("the heap holds one end time per room in use, and its root is the room")
print("that frees up soonest — the only room a new meeting could possibly take.")
print("that is the same shape as top-k: the root is the candidate for eviction.")`,
          output: `     meeting  action                             rooms in use
--------------------------------------------------------------
      [0,30)  nothing free — open another        1
      [5,10)  nothing free — open another        2
     [15,20)  room freed at 10 — reuse it        2
     [25,45)  room freed at 20 — reuse it        2
     [35,40)  room freed at 30 — reuse it        2

rooms needed: 2

the heap holds one end time per room in use, and its root is the room
that frees up soonest — the only room a new meeting could possibly take.
that is the same shape as top-k: the root is the candidate for eviction.`,
          explanation:
            "Sorting by start time is not the algorithm, it is the precondition: rooms free up in time order, so meetings have to be considered in that order for the question *is anything free yet* to be answerable at all. The heap then holds one end time per occupied room, and its root is the room that frees soonest \u2014 the only room a new meeting could possibly take, which is why one comparison settles it. The answer is the heap's size, and the shape is the same one as top-k: the root is whatever is next to be evicted.",
        },
      ],
      visual: {
        id: "scheduling-visual",
        kind: "heap",
        title: "The soonest-free resource on top",
      },
    },
    {
      id: "greedy-and-the-heap",
      heading: "The heap is not the insight",
      body: [
        "It is worth being careful about which part of these solutions is the clever bit, because interviewers ask about the other part.",
        "In *connect sticks*, the insight is that joining two sticks makes a stick that gets joined again, so an early join is paid for in every later one \u2014 and therefore the cheapest strategy joins the two shortest available. That is a greedy choice, and it needs an exchange argument to be believed.",
        "The heap contributes nothing to that argument. Its entire job is to make *the two shortest* cost O(log n) instead of O(n), and the same solution written with a sorted list and a linear scan would be equally correct and slower.",
        "This is Huffman coding, incidentally \u2014 the same algorithm, where the sticks are symbol frequencies and the total cost is the encoded length. Recognising the shape is worth more than recognising the name: whenever combining two items produces an item that will be combined again, and the cost is the sum, the answer is a min-heap and repeatedly taking two.",
      ],
      examples: [
        {
          id: "connect-sticks",
          title: "Why the two smallest, every time",
          lang: "python",
          code: `import heapq

sticks = [8, 4, 6, 12]

# Joining two sticks costs their combined length, and that combined stick
# is joined again later — so early joins are paid for repeatedly.
heap = list(sticks)
heapq.heapify(heap)
total = 0
print("sticks:", sticks)
while len(heap) > 1:
    a = heapq.heappop(heap)
    b = heapq.heappop(heap)
    total += a + b
    heapq.heappush(heap, a + b)
    print(f"  join {a} + {b} = {a + b}   running cost {total}")
print(f"cheapest total: {total}")

print()
worst = 0
h2 = [-x for x in sticks]
heapq.heapify(h2)
while len(h2) > 1:
    a = -heapq.heappop(h2)
    b = -heapq.heappop(h2)
    worst += a + b
    heapq.heappush(h2, -(a + b))
print(f"joining the two largest each time instead: {worst}")
print()
print("same sticks, same number of joins, different total — because a stick")
print("joined early is carried inside every later join. Taking the two")
print("smallest keeps the repeatedly-counted lengths as small as possible,")
print("and the heap is what makes 'the two smallest' cost O(log n) each time.")`,
          output: `sticks: [8, 4, 6, 12]
  join 4 + 6 = 10   running cost 10
  join 8 + 10 = 18   running cost 28
  join 12 + 18 = 30   running cost 58
cheapest total: 58

joining the two largest each time instead: 76

same sticks, same number of joins, different total — because a stick
joined early is carried inside every later join. Taking the two
smallest keeps the repeatedly-counted lengths as small as possible,
and the heap is what makes 'the two smallest' cost O(log n) each time.`,
          explanation:
            "This is Huffman coding wearing different clothes, and the argument is the same. A stick joined early is contained in every later join, so its length is counted once per remaining round \u2014 which makes early joins expensive in proportion to how much longer the process runs. Joining the two smallest keeps the repeatedly-counted lengths as small as possible, and the 58-against-76 gap on four sticks is that effect at the smallest scale worth printing. The heap is not the insight; the greedy choice is. The heap is what makes *the two smallest* cost O(log n) rather than O(n).",
        },
      ],
    },
    {
      id: "the-sheet",
      heading: "Closing the module",
      body: [
        "Every problem in this module resolved into the same two decisions, and they are the two worth carrying out of it.",
        "**What does the root need to be?** The root is the only element a heap makes cheap, so the question is which single element the algorithm repeatedly asks about. For the k largest it is the smallest thing kept, for meeting rooms the earliest end time, for connect-sticks the shortest stick. Answer this and the min-or-max question answers itself.",
        "**What is allowed in the heap at once?** This fixes both the memory and the log in the bound. k for top-k, one cursor per list for a merge, one entry per busy resource for scheduling, half the data for a running median.",
        "And one check that comes before both: if the thing being ranked is a bounded non-negative integer, the answer is probably an array of buckets and there is no heap in it at all.",
      ],
      examples: [
        {
          id: "the-sheet",
          title: "The shapes, and the two questions that pick between them",
          lang: "python",
          code: `rows = [
    ("kth largest / smallest", "heap of size k, ordered backwards", "O(n log k)"),
    ("top k frequent", "count, then buckets by count", "O(n)"),
    ("running median", "two heaps facing each other", "O(log n) per add"),
    ("merge k sorted lists", "heap of one cursor per list", "O(n log k)"),
    ("meeting rooms II", "min-heap of end times", "O(n log n)"),
    ("connect sticks / Huffman", "min-heap, join the two smallest", "O(n log n)"),
    ("task scheduler by deadline", "max-heap of value, drop when late", "O(n log n)"),
    ("sliding window median", "two heaps plus lazy deletion", "O(n log n)"),
    ("kth smallest in a sorted matrix", "heap of row cursors, or binary search", "O(k log n)"),
    ("smallest range across k lists", "k-way merge, track the max", "O(n log k)"),
]

print(f"{'problem':<32} {'shape':<38} {'cost'}")
print("-" * 88)
for problem, shape, cost in rows:
    print(f"{problem:<32} {shape:<38} {cost}")

print()
print("two questions decide almost all of these:")
print("  1. what does the root need to be? — that fixes min-heap or max-heap")
print("  2. what is allowed in the heap at once? — that fixes the size, and the bound")
print()
print("and one check before any of it: if the ranking key is a small integer,")
print("the answer is probably an array, and there is no heap in it at all.")`,
          output: `problem                          shape                                  cost
----------------------------------------------------------------------------------------
kth largest / smallest           heap of size k, ordered backwards      O(n log k)
top k frequent                   count, then buckets by count           O(n)
running median                   two heaps facing each other            O(log n) per add
merge k sorted lists             heap of one cursor per list            O(n log k)
meeting rooms II                 min-heap of end times                  O(n log n)
connect sticks / Huffman         min-heap, join the two smallest        O(n log n)
task scheduler by deadline       max-heap of value, drop when late      O(n log n)
sliding window median            two heaps plus lazy deletion           O(n log n)
kth smallest in a sorted matrix  heap of row cursors, or binary search  O(k log n)
smallest range across k lists    k-way merge, track the max             O(n log k)

two questions decide almost all of these:
  1. what does the root need to be? — that fixes min-heap or max-heap
  2. what is allowed in the heap at once? — that fixes the size, and the bound

and one check before any of it: if the ranking key is a small integer,
the answer is probably an array, and there is no heap in it at all.`,
          explanation:
            "The table is worth reading as a set of answers to the two questions under it rather than as ten things to memorise. *What does the root need to be* settles the direction \u2014 for the k largest it is the smallest kept, for meeting rooms it is the earliest end, for connect-sticks it is the shortest stick. *What is allowed in the heap at once* settles the bound \u2014 k for top-k, one per list for a merge, one per busy room for scheduling. Nearly every heap problem is those two decisions and then twenty lines of standard library.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Given a list of meeting intervals, find the minimum number of rooms required.",
      answer:
        "Sort the meetings by start time, then keep a min-heap of the end times of the meetings currently running. For each meeting, if the heap's root is less than or equal to the new start time, that room has freed up \u2014 pop it. Then push the new end time either way. The answer is the maximum size the heap reaches, which since nothing is ever popped without a push is just its final size. O(n log n) for the sort and the heap operations. The root is the only room worth checking, because if the soonest-free room is not free, none are.",
    },
    {
      question: "You must join n ropes into one; joining two costs the sum of their lengths. Minimise the cost.",
      answer:
        "Repeatedly join the two shortest ropes, using a min-heap to find them. The reason is that a joined rope is joined again, so its length is charged once for every remaining round \u2014 early joins are the expensive ones, and keeping them short is what minimises the total. It is Huffman's algorithm: O(n log n), dominated by n pops and pushes. The heap is not where the insight is; the greedy choice is, and it needs an exchange argument.",
    },
    {
      question: "How do you decide between a min-heap and a max-heap for a problem you have not seen before?",
      answer:
        "Ask what single element the algorithm keeps needing. A heap makes exactly one element cheap \u2014 its root \u2014 so whichever value the loop consults on every iteration has to be the root, and that fixes the direction. For the k largest, the value consulted is the smallest one currently kept, so it is a min-heap even though the question says largest. For meeting rooms it is the earliest end time. Getting this backwards is the usual bug, and it shows up as an O(k) scan appearing inside the loop to find the value the heap should have been surfacing.",
    },
  ],
  takeaways: [
    "Sort to fix the order of consideration; use the heap to answer availability in one comparison.",
    "In interval problems the answer is usually the heap's size \u2014 the number of resources in use at once.",
    "The greedy choice is the insight; the heap only makes that choice cheap to execute.",
    "Combining two items into one that will be combined again is Huffman's shape: min-heap, take two, repeat.",
    "Pick the direction by asking what the root must be, and the bound by asking what may be in the heap at once.",
    "Check first whether the ranking key is a small integer \u2014 if it is, the answer is buckets and not a heap at all.",
  ],
  status: "available",
};
