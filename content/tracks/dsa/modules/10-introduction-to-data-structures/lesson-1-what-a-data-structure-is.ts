import type { Lesson } from "@/content/types";

export const whatADataStructureIsLesson: Lesson = {
  id: "dsa-ds-what",
  slug: "what-a-data-structure-is",
  moduleSlug: "introduction-to-data-structures",
  title: "What a Data Structure Actually Is",
  summary:
    "A structure is a set of operations with costs attached — learn to see them that way and choosing one stops being memorisation.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Define a data structure by its operations rather than its shape",
    "Separate the abstract interface from the concrete implementation",
    "Read a structure as a table of costs and choose from that table",
    "Explain why there is no single best structure",
  ],
  sections: [
    {
      id: "operations-not-shapes",
      heading: "Operations, not shapes",
      body: [
        "The usual way this topic is taught is a gallery of pictures — boxes with arrows for a linked list, a triangle for a tree — and then a list of names to memorise. That approach makes the subject feel like trivia.",
        "The useful definition is different. **A data structure is a set of operations, each with a cost.** The picture is an implementation detail that explains where the costs come from.",
        "So a hash map is not \"an array of buckets\". A hash map is: *insert in O(1), look up by key in O(1), delete in O(1), and no order.* The buckets explain why, and when you are choosing a structure the costs are what you actually consult.",
        "This reframing is what makes the rest of the course tractable. There are about eight structures worth knowing, and every problem is a question of which set of costs fits.",
      ],
      examples: [
        {
          id: "operations",
          title: "The same data, five questions, five different costs",
          lang: "python",
          code: `values = [5, 3, 9, 1]

print("index by position:", values[2])
print("search by value  :", 9 in values, "at", values.index(9))
print("append           :", values + [7])
print("insert in middle :", values[:2] + [99] + values[2:])
print("delete in middle :", values[:1] + values[2:])
print("the original is unchanged:", values)`,
          output: `index by position: 9
search by value  : True at 2
append           : [5, 3, 9, 1, 7]
insert in middle : [5, 3, 99, 9, 1]
delete in middle : [5, 9, 1]
the original is unchanged: [5, 3, 9, 1]`,
          explanation:
            "Five operations on one list, and they do not cost the same. Indexing is O(1) — the address is arithmetic. Searching is O(n) — every element might have to be checked. Inserting in the middle is O(n) — everything after it shifts. The list does not announce this, which is exactly why you have to know it.",
        },
      ],
    },
    {
      id: "abstract-vs-concrete",
      heading: "The interface against the implementation",
      body: [
        "Two words get used loosely and the distinction is worth having.",
        "**An abstract data type** is the *contract*: the operations and what they mean. A stack is push, pop and peek, last in first out. That says nothing about how it is stored.",
        "**A data structure** is the *implementation*: the concrete arrangement of memory that provides those operations at particular costs. A stack can be an array or a linked list; both satisfy the contract, at slightly different costs.",
        "Why it matters practically: it means you can pick the contract first — \"I need last-in-first-out\" — and then pick the implementation from the costs. Beginners tend to do it in the other order, reaching for a structure they know and bending the problem to fit.",
      ],
      examples: [
        {
          id: "adt",
          title: "A contract, and two things behind it",
          lang: "python",
          code: `class Counter:
    """A bag of counts, exposed only through its operations."""

    def __init__(self):
        self._counts = {}

    def add(self, item):
        self._counts[item] = self._counts.get(item, 0) + 1

    def count(self, item):
        return self._counts.get(item, 0)

    def most_common(self):
        if not self._counts:
            return None
        return max(self._counts.items(), key=lambda kv: kv[1])


c = Counter()
for word in "the cat sat on the mat the end".split():
    c.add(word)

print("count('the') :", c.count("the"))
print("count('dog') :", c.count("dog"))
print("most common  :", c.most_common())

from collections import Counter as StdCounter

std = StdCounter("the cat sat on the mat the end".split())
print()
print("the standard library version:", std.most_common(2))
print("same answer for 'the':", std["the"] == c.count("the"))`,
          output: `count('the') : 3
count('dog') : 0
most common  : ('the', 3)

the standard library version: [('the', 3), ('cat', 1)]
same answer for 'the': True`,
          explanation:
            "The three public methods are the contract; the dict behind them is the implementation, and the leading underscore says so. Swapping the dict for a sorted structure would change the costs — `most_common` could become O(1) — without changing a single line of calling code. That separation is the entire reason the distinction exists.",
        },
      ],
    },
    {
      id: "the-cost-table",
      heading: "The table you actually consult",
      body: [
        "Here is the whole module in one table. Everything after this lesson is an explanation of a row or a column.",
        "Read it as: *which operation does my problem do most, and which structure makes that operation cheap?* That is the choosing algorithm, and it is nearly always enough.",
        "The dashes are as informative as the entries. A heap cannot be indexed by position and a hash map has no order — those are not oversights, they are the price paid for the operations that are fast.",
      ],
      examples: [
        {
          id: "cost-table",
          title: "The costs, side by side",
          lang: "python",
          code: `header = ("operation", "array", "linked", "hash map", "tree", "heap")
rows = [
    ("index by position", "O(1)", "O(n)", "-", "-", "-"),
    ("search by value", "O(n)", "O(n)", "O(1)", "O(log n)", "O(n)"),
    ("insert at end", "O(1)*", "O(1)", "O(1)", "O(log n)", "O(log n)"),
    ("insert at front", "O(n)", "O(1)", "-", "-", "-"),
    ("delete in middle", "O(n)", "O(1)**", "O(1)", "O(log n)", "-"),
    ("find the minimum", "O(n)", "O(n)", "O(n)", "O(log n)", "O(1)"),
    ("visit in sorted order", "O(n log n)", "O(n log n)", "O(n log n)", "O(n)", "O(n log n)"),
]

fmt = "{:<21} {:>10} {:>10} {:>10} {:>10} {:>10}"
print(fmt.format(*header))
print("-" * 76)
for r in rows:
    print(fmt.format(*r))
print()
print("*  amortised     ** given a reference to the node")`,
          output: `operation                  array     linked   hash map       tree       heap
----------------------------------------------------------------------------
index by position           O(1)       O(n)          -          -          -
search by value             O(n)       O(n)       O(1)   O(log n)       O(n)
insert at end              O(1)*       O(1)       O(1)   O(log n)   O(log n)
insert at front             O(n)       O(1)          -          -          -
delete in middle            O(n)     O(1)**       O(1)   O(log n)          -
find the minimum            O(n)       O(n)       O(n)   O(log n)       O(1)
visit in sorted order O(n log n) O(n log n) O(n log n)       O(n) O(n log n)

*  amortised     ** given a reference to the node`,
          explanation:
            "Every column has a row where it wins and rows where it loses badly. The array owns indexing; the hash map owns search; the tree owns ordered traversal; the heap owns finding the minimum. **No column dominates**, which is the reason this whole subject exists — if one structure were best at everything, there would be nothing to learn.",
        },
      ],
      pitfalls: [
        {
          title: "Reading a single cost and ignoring the rest",
          body: "\"A hash map is O(1)\" is true for lookup and irrelevant if your problem needs the smallest element or ordered iteration, both of which are O(n) or worse. Always ask what *else* the algorithm does with the structure — the second-most-frequent operation is usually what decides the choice.",
        },
      ],
    },
    {
      id: "the-trade",
      heading: "There is always a trade",
      body: [
        "Three trades run through everything that follows, and naming them now means you will recognise them each time.",
        "**Space for time.** A hash map is fast because it keeps extra empty slots — typically it is only two-thirds full. Precomputing anything is the same trade.",
        "**Order for speed.** A hash map is faster than a tree at lookup precisely *because* it does not maintain order. The moment you need sorted output, you pay for it somewhere.",
        "**Flexibility for locality.** A linked list inserts anywhere in O(1) and is slow to walk, because its nodes are scattered in memory. An array is the reverse. This is the one that does not show up in the big-O table at all and still shows up in the benchmark.",
        "When a structure looks like it is free, look for which of these three it is quietly spending.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a data structure?",
      answer:
        "A way of organising data that provides a specific set of operations at specific costs. The useful definition is the operations and their costs rather than the shape — a hash map is insert, look up and delete in O(1) with no ordering, and the bucket array is just the mechanism that delivers those costs. Choosing a structure means matching your algorithm's most frequent operations against that cost table.",
    },
    {
      question: "What is the difference between an abstract data type and a data structure?",
      answer:
        "The abstract data type is the contract — the operations and their meaning, like a stack being push, pop and peek with last-in-first-out semantics. The data structure is the implementation that provides it, and a single ADT can have several: a stack can be an array or a linked list, at different costs. Separating them lets you choose the semantics you need first and the implementation from the cost profile second.",
    },
    {
      question: "Why is there no single best data structure?",
      answer:
        "Because every structure buys speed on some operations by giving it up on others. A hash map has O(1) lookup because it abandons ordering; a heap finds the minimum in O(1) because it maintains only a partial order and cannot search; an array indexes in O(1) because it is contiguous, which is exactly why inserting in the middle costs O(n). The recurring trades are space for time, order for speed, and flexibility for memory locality.",
    },
  ],
  takeaways: [
    "A data structure is a set of operations with costs; the diagram only explains the costs",
    "The abstract data type is the contract; the data structure is the implementation",
    "Pick the semantics you need first, then the implementation from the cost table",
    "Array owns indexing, hash map owns search, tree owns order, heap owns the minimum",
    "The dashes in the table are prices paid, not oversights",
    "The second-most-frequent operation usually decides the choice",
    "Three recurring trades: space for time, order for speed, flexibility for locality",
    "No structure dominates — which is why the subject exists at all",
  ],
};
