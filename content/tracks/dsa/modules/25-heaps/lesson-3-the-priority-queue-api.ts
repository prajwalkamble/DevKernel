import type { Lesson } from "@/content/types";

export const priorityQueueLesson: Lesson = {
  id: "dsa-heap-priority-queue",
  slug: "the-priority-queue-api",
  moduleSlug: "heaps-and-priority-queues",
  title: "The Priority Queue API, and the Comparator That Decides Everything",
  summary:
    "The heap machinery never changes. What you choose is the ordering — and composite keys, ties and the missing decrease-key are where the real decisions and the real bugs live.",
  estimatedMinutes: 35,
  objectives: [
    "Separate the priority queue as an abstract type from the heap that implements it",
    "Build a max-heap out of a min-heap, and say why no new code is needed",
    "Design a composite key that will not throw when two priorities tie",
    "Use lazy deletion in place of decrease-key, and state what it costs",
  ],
  sections: [
    {
      id: "adt-and-implementation",
      heading: "The queue is the promise; the heap is the machinery",
      body: [
        "A **priority queue** is an abstract type with three operations: add an item with a priority, look at the most important one, remove the most important one. Nothing in that description mentions trees or arrays.",
        "A **binary heap** is the usual way to build one, and it is the reason the operations cost what they do \u2014 O(1) to peek, O(log n) to add or remove. Other implementations exist and trade differently: a sorted list makes removal O(1) and insertion O(n), a Fibonacci heap improves the theory and loses on constants almost everywhere in practice.",
        "The distinction matters when reading a problem. Requirements are stated in terms of the queue \u2014 *always process the most urgent job next* \u2014 and the choice of heap is yours. It also matters when reading a language's library, because the two mainstream ones expose the same structure very differently: Python gives you functions that operate on a plain list, Java gives you a class that hides the array entirely.",
      ],
      examples: [
        {
          id: "min-and-max",
          title: "One heap, two orderings",
          lang: "python",
          code: `import heapq

jobs = [(3, "write tests"), (1, "fix the build"), (4, "refactor"),
        (1, "answer the pager"), (2, "review the PR")]

print("as a min-heap — smallest priority number first:")
h = []
for job in jobs:
    heapq.heappush(h, job)
while h:
    p, name = heapq.heappop(h)
    print(f"  {p}  {name}")

print()
print("as a max-heap — negate on the way in, negate on the way out:")
h = []
for p, name in jobs:
    heapq.heappush(h, (-p, name))
while h:
    p, name = heapq.heappop(h)
    print(f"  {-p}  {name}")

print()
print("the heap never knew which one it was doing. Only the key changed.")`,
          output: `as a min-heap — smallest priority number first:
  1  answer the pager
  1  fix the build
  2  review the PR
  3  write tests
  4  refactor

as a max-heap — negate on the way in, negate on the way out:
  4  refactor
  3  write tests
  2  review the PR
  1  answer the pager
  1  fix the build

the heap never knew which one it was doing. Only the key changed.`,
          explanation:
            "There is no max-heap in Python's standard library and there does not need to be. The heap compares whatever you hand it, so negating the key on the way in and again on the way out turns the same code into a max-heap. Java takes the other route \u2014 `PriorityQueue` accepts a `Comparator`, and `Comparator.reverseOrder()` does the same job without touching the data. Either way the structure is unchanged; only the ordering it is asked about moves.",
        },
      ],
    },
    {
      id: "the-comparator",
      heading: "The comparator is the whole design",
      body: [
        "Everything interesting about a priority queue is in what it compares. The heap machinery is fixed; the ordering is the part you choose, and choosing it badly is where the bugs are.",
        "Two mechanisms do the same job. **Transform the key** \u2014 negate it, or build a tuple \u2014 and let the default ordering do the work. Or **supply a comparator** and leave the data alone. Python's `heapq` only offers the first, Java's `PriorityQueue` offers the second, and C++'s `priority_queue` takes a comparator type that defaults to `less`, which makes it a *max*-heap by default and catches out everyone arriving from Python.",
        "Composite keys are where care is needed. `(priority, name)` sorts by priority and then breaks ties by name \u2014 which is fine until the tiebreaker is something that cannot be compared at all, and then the queue throws on the first collision rather than at the point where the mistake was made.",
        "And a priority queue is **not stable**. Two items of equal priority come out in an order the structure never promised, and which will change if the sift path changes. If insertion order matters among equals, it has to be part of the key.",
      ],
      examples: [
        {
          id: "tie-breaking",
          title: "What happens when priorities tie",
          lang: "python",
          code: `import heapq
import itertools


class Task:
    def __init__(self, name):
        self.name = name


print("a tie in the first field falls through to the second:")
h = []
for pair in [(1, "beta"), (1, "alpha"), (2, "gamma")]:
    heapq.heappush(h, pair)
out = [heapq.heappop(h) for _ in range(3)]
print("  ", " ".join(f"({p},{name})" for p, name in out))
print("   the names were compared. Nobody asked for that, and here it was harmless.")

print()
print("now the payload is an object with no ordering:")
h = []
try:
    heapq.heappush(h, (1, Task("beta")))
    heapq.heappush(h, (1, Task("alpha")))
except TypeError as e:
    print(f"   TypeError: {e}")
print("   the crash arrives only when two priorities actually tie, so it")
print("   survives every test whose priorities happen to be distinct.")

print()
print("the fix is a tiebreaker that is always comparable and never ties:")
counter = itertools.count()
h = []
for name in ("beta", "alpha", "gamma"):
    heapq.heappush(h, (1, next(counter), Task(name)))
order = [heapq.heappop(h)[2].name for _ in range(3)]
print("  ", " ".join(order))
print("   equal priorities now come out in insertion order, which is usually")
print("   what was wanted anyway — a priority queue is not otherwise stable.")`,
          output: `a tie in the first field falls through to the second:
   (1,alpha) (1,beta) (2,gamma)
   the names were compared. Nobody asked for that, and here it was harmless.

now the payload is an object with no ordering:
   TypeError: '<' not supported between instances of 'Task' and 'Task'
   the crash arrives only when two priorities actually tie, so it
   survives every test whose priorities happen to be distinct.

the fix is a tiebreaker that is always comparable and never ties:
   beta alpha gamma
   equal priorities now come out in insertion order, which is usually
   what was wanted anyway — a priority queue is not otherwise stable.`,
          explanation:
            "A tuple compares field by field, so a tie in the priority quietly promotes the *payload* to being the tiebreaker. When the payload is a string that is merely surprising. When it is an object with no ordering it is a `TypeError` \u2014 and one that appears only when two priorities actually collide, which is exactly the case a small test suite is least likely to contain. The monotonic counter fixes it for good: it is always comparable, it never ties, and it makes equal priorities come out in insertion order, which is almost always the behaviour that was silently assumed.",
        },
      ],
    },
    {
      id: "what-it-will-not-do",
      heading: "No decrease-key, and what to do instead",
      body: [
        "Two operations that feel like they should exist do not: changing an item's priority, and removing an item that is not at the top. Both need to *find* the item first, and a heap has no way to do that short of scanning.",
        "The pattern that replaces them is **lazy deletion**. Never modify what is in the heap. Push a new entry with the new priority, keep a map recording the value you currently believe, and when an entry surfaces that disagrees with the map, discard it and pop again.",
        "It is correct because a stale entry can only ever have a *worse or equal* priority claim than the live one for the same item, so it can never be popped before the truth is. And the amortised cost stays O(log n) per operation, because each entry is pushed once and discarded at most once.",
        "The price is memory: the heap is bounded by the number of updates, not by the number of live items. For Dijkstra on a sparse graph that is fine and it is what most implementations do. For a scheduler reprioritising the same few thousand jobs in a tight loop it is not, and that is when an indexed heap \u2014 one that keeps a position map alongside the array \u2014 starts to earn its complexity.",
      ],
      examples: [
        {
          id: "lazy-deletion",
          title: "Changing your mind, without a decrease-key",
          lang: "python",
          code: `import heapq

# A heap has no way to find an arbitrary element, so it has no way to change
# one's priority or remove it. The standard answer is to leave the stale entry
# where it is and ignore it when it surfaces.
heap = []
pushed = 0
discarded = 0
current = {}          # task -> the priority we actually believe
REMOVED = object()


def set_priority(task, priority):
    global pushed
    current[task] = priority
    heapq.heappush(heap, (priority, task))     # the old entry stays behind
    pushed += 1


def remove(task):
    current[task] = REMOVED


def pop():
    global discarded
    while heap:
        priority, task = heapq.heappop(heap)
        if current.get(task) == priority:      # the entry still speaks for the task
            del current[task]
            return priority, task
        discarded += 1
    return None


for task, p in [("deploy", 5), ("build", 2), ("test", 3)]:
    set_priority(task, p)
print(f"queued 3 tasks, heap holds {len(heap)} entries")

set_priority("deploy", 1)                      # promoted
remove("test")                                 # cancelled
print(f"after one promotion and one cancellation, heap holds {len(heap)} entries")
print()

while True:
    got = pop()
    if got is None:
        break
    print(f"  popped {got[1]} at priority {got[0]}")

print()
print(f"{pushed} entries went in and {discarded} were discarded on the way out.")
print("the heap never shrank on cancellation — it grew. That is the trade:")
print("O(log n) updates, in exchange for a heap bounded by the number of")
print("updates rather than the number of live tasks.")`,
          output: `queued 3 tasks, heap holds 3 entries
after one promotion and one cancellation, heap holds 4 entries

  popped deploy at priority 1
  popped build at priority 2

4 entries went in and 2 were discarded on the way out.
the heap never shrank on cancellation — it grew. That is the trade:
O(log n) updates, in exchange for a heap bounded by the number of
updates rather than the number of live tasks.`,
          explanation:
            "Textbook priority queues offer `decrease-key`; the ones in standard libraries do not, because finding an arbitrary element in a heap is O(n) and the bookkeeping to make it O(log n) costs more than it saves for most callers. The working pattern is to never update in place: push a new entry, record what you now believe in a map, and drop entries that disagree when they surface. The cost is a heap that grows with the number of *updates* rather than the number of live items \u2014 worth knowing before using this in a loop that reprioritises constantly, and exactly what Dijkstra's implementations do.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Python has no max-heap. How do you get one?",
      answer:
        "Negate the key going in and coming out — push `-priority` and negate what you pop. The heap only ever asks whether one key is less than another, so reversing the sign reverses the ordering without changing a line of the structure. For values that cannot be negated, wrap them in a small class with `__lt__` defined backwards, or store `(-priority, tiebreaker, payload)`. The point worth making out loud is that a max-heap is not a different data structure, only a different comparison.",
    },
    {
      question: "You push `(priority, task)` tuples and it works in testing, then throws in production. What happened?",
      answer:
        "Two tasks arrived with the same priority. A tuple compares field by field, so the tie sent the comparison to the second field, and if the task object has no ordering that is a TypeError. It survives testing because tests usually use distinct priorities. The fix is a middle field that is always comparable and never ties — a monotonically increasing counter — which also has the useful side effect of making equal priorities come out in insertion order, since a priority queue gives no ordering among equals otherwise.",
    },
    {
      question: "How do you decrease a key in a heap that has no decrease-key?",
      answer:
        "You do not update in place, because finding the element is O(n). You push a second entry with the new priority and keep a map of what the current priority for each item actually is; when an entry is popped whose priority disagrees with the map, you throw it away and pop again. Each entry is pushed once and discarded at most once, so the amortised cost per operation is still O(log n). What it costs is memory — the heap is bounded by the number of updates rather than the number of live items — and that is the standard trade in a Dijkstra implementation.",
    },
  ],
  takeaways: [
    "A priority queue is the abstract type; a binary heap is one implementation of it, and the one the costs come from.",
    "A max-heap is a min-heap with the comparison reversed — by negating the key, or by supplying a comparator.",
    "C++'s `priority_queue` is a max-heap by default, which is the opposite of Python's and Java's.",
    "A tuple key breaks ties on its next field, so make that field a counter rather than whatever the payload happens to be.",
    "Priority queues are not stable: if insertion order matters among equals, put it in the key.",
    "Lazy deletion replaces decrease-key: push the new value, believe the map, discard entries that disagree.",
  ],
  status: "available",
};
