import type { Lesson } from "@/content/types";

export const orderedAndChoosingLesson: Lesson = {
  id: "dsa-ds-ordered",
  slug: "ordered-structures-and-choosing",
  moduleSlug: "introduction-to-data-structures",
  title: "Ordered Structures & Choosing One",
  summary:
    "Sorted maps, what Python is missing and how to work around it, and the decision procedure that closes the module.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Use a sorted map's floor, ceiling and range queries",
    "Substitute `bisect` over a sorted list where Python has no TreeMap",
    "Pick a structure from the operations a problem needs",
    "Close the module with the whole cost table in one place",
  ],
  sections: [
    {
      id: "what-order-buys",
      heading: "What ordering buys",
      body: [
        "A hash map answers \"is this exact key present?\". A **sorted map** answers four more questions that a hash map simply cannot:",
        "**Floor** — the largest key at most x. **Ceiling** — the smallest key at least x. **Range** — every key between a and b. **Extremes** — the smallest and largest key.",
        "Those four cover a whole family of problems: nearest booking slot, price at or before a timestamp, closest value, interval overlap, calendar scheduling. Whenever a problem says \"the closest\", \"the next available\" or \"in this range\", a sorted structure is the intended answer.",
        "The price is that every operation becomes **O(log n) instead of O(1)**, because the structure is a balanced tree rather than a bucket array. That is a real cost and usually a cheap one — log₂ of a million is twenty.",
      ],
      examples: [
        {
          id: "treemap",
          title: "Java: TreeMap and TreeSet",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        TreeMap<Integer, String> map = new TreeMap<>();
        map.put(10, "ten"); map.put(30, "thirty"); map.put(20, "twenty"); map.put(50, "fifty");
        System.out.println("iterates in key order: " + map);
        System.out.println("firstKey / lastKey: " + map.firstKey() + " " + map.lastKey());
        System.out.println("floorKey(35)   : " + map.floorKey(35));
        System.out.println("ceilingKey(35) : " + map.ceilingKey(35));
        System.out.println("lowerKey(30)   : " + map.lowerKey(30));
        System.out.println("higherKey(30)  : " + map.higherKey(30));
        System.out.println("headMap(30)    : " + map.headMap(30));
        System.out.println("tailMap(30)    : " + map.tailMap(30));
        System.out.println("subMap(20, 50) : " + map.subMap(20, 50));
        System.out.println("ceilingKey(99) : " + map.ceilingKey(99));

        TreeSet<Integer> set = new TreeSet<>(List.of(5, 1, 9, 3));
        System.out.println("TreeSet: " + set + " first " + set.first() + " last " + set.last());
        System.out.println("descending: " + set.descendingSet());
    }
}`,
          output: `iterates in key order: {10=ten, 20=twenty, 30=thirty, 50=fifty}
firstKey / lastKey: 10 50
floorKey(35)   : 30
ceilingKey(35) : 50
lowerKey(30)   : 20
higherKey(30)  : 50
headMap(30)    : {10=ten, 20=twenty}
tailMap(30)    : {30=thirty, 50=fifty}
subMap(20, 50) : {20=twenty, 30=thirty}
ceilingKey(99) : null
TreeSet: [1, 3, 5, 9] first 1 last 9
descending: [9, 5, 3, 1]`,
          explanation:
            "The distinction between `floor`/`ceiling` and `lower`/`higher` is inclusivity: floor and ceiling allow an exact match, lower and higher are strict. Getting that backwards is a genuine off-by-one, and the method names do not help. Note the ranges are **views**, not copies — `headMap` reflects later changes to the map and is O(1) to create, which matters when the map is large.",
        },
      ],
      pitfalls: [
        {
          title: "`ceilingKey` returns null, and it will autounbox",
          body: "`int k = map.ceilingKey(99);` throws a `NullPointerException` when no such key exists, because the null `Integer` is unboxed into an `int`. Assign to an `Integer` and check for null. The same applies to every `get`, `floorKey`, `poll` and `peek` in the collections API — anywhere a boxed type can be null.",
        },
      ],
    },
    {
      id: "python-workaround",
      heading: "Python has no TreeMap",
      body: [
        "There is no built-in sorted map or sorted set. The standard substitute is the **`bisect`** module, which does binary search over a list you keep sorted yourself.",
        "`bisect_left(a, x)` returns the leftmost index where x could be inserted while keeping the list sorted; `bisect_right` returns the rightmost. With those two, every ordered query from the previous section falls out.",
        "The catch is the cost: **searching is O(log n) and inserting is O(n)**, because insertion shifts the list. So `bisect` over a sorted list is right when the data is built once and queried many times, and wrong when insertions and queries interleave.",
        "For that case the answer is the third-party **`sortedcontainers`**, whose `SortedList` gives effectively O(log n) for both. It is not in the standard library, so in an interview say what you would use and why — that is the expected answer, not a workaround.",
      ],
      examples: [
        {
          id: "bisect",
          title: "Every ordered query, from two functions",
          lang: "python",
          code: `import bisect

values = [10, 20, 30, 40, 50]
print("values:", values)
print("bisect_left(30) :", bisect.bisect_left(values, 30))
print("bisect_right(30):", bisect.bisect_right(values, 30))
print("bisect_left(35) :", bisect.bisect_left(values, 35))
print("bisect_left(5)  :", bisect.bisect_left(values, 5))
print("bisect_left(99) :", bisect.bisect_left(values, 99))

print()
print("the four ordered queries, all from bisect:")
target = 35
i = bisect.bisect_left(values, target)
print("  first >= 35 :", values[i] if i < len(values) else None)
j = bisect.bisect_right(values, target)
print("  first > 35  :", values[j] if j < len(values) else None)
print("  last < 35   :", values[i - 1] if i > 0 else None)
print("  count in [20, 40]:",
      bisect.bisect_right(values, 40) - bisect.bisect_left(values, 20))

print()
bisect.insort(values, 35)
print("insort keeps it sorted:", values, "-- but the insert is O(n)")`,
          output: `values: [10, 20, 30, 40, 50]
bisect_left(30) : 2
bisect_right(30): 3
bisect_left(35) : 3
bisect_left(5)  : 0
bisect_left(99) : 5

the four ordered queries, all from bisect:
  first >= 35 : 40
  first > 35  : 40
  last < 35   : 30
  count in [20, 40]: 3

insort keeps it sorted: [10, 20, 30, 35, 40, 50] -- but the insert is O(n)`,
          explanation:
            "The difference between left and right only shows on an **exact match** — both return 3 for the absent 35, but 2 and 3 for the present 30. That is precisely what makes `bisect_right(b) - bisect_left(a)` count the elements in a range, and it is the one detail to get right. The out-of-range answers, 0 and `len(values)`, are also deliberate: they let you write bounds checks as `i < len(values)` with no special cases.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing, in order",
      body: [
        "The whole module reduces to a short procedure. Ask these questions in order and take the first match.",
        "The reason it is ordered rather than a lookup table is that the earlier questions are more restrictive — if you genuinely only need the minimum, a heap beats a sorted map, and you should take the heap.",
        "And when nothing matches, the answer is a dynamic array. It is the right default, and \"start with a list and change it when a cost hurts\" is a legitimate strategy rather than a failure to decide.",
      ],
      examples: [
        {
          id: "decision",
          title: "The decision procedure",
          lang: "python",
          code: `questions = [
    ("Index by position?", "dynamic array"),
    ("Look up by key, order irrelevant?", "hash map / set"),
    ("Look up by key AND need order?", "sorted map / TreeMap"),
    ("Only ever need the smallest or largest?", "heap"),
    ("Add and remove at one end only?", "stack"),
    ("Add at one end, remove at the other?", "queue / deque"),
    ("Track relationships between things?", "graph"),
]

width = max(len(q) for q, _ in questions)
for q, answer in questions:
    print(f"  {q:<{width}}  ->  {answer}")

print()
print("Nothing applies? Use a dynamic array. It is the right default.")`,
          output: `  Index by position?                       ->  dynamic array
  Look up by key, order irrelevant?        ->  hash map / set
  Look up by key AND need order?           ->  sorted map / TreeMap
  Only ever need the smallest or largest?  ->  heap
  Add and remove at one end only?          ->  stack
  Add at one end, remove at the other?     ->  queue / deque
  Track relationships between things?      ->  graph

Nothing applies? Use a dynamic array. It is the right default.`,
          explanation:
            "Seven questions covering nearly every choice you will make. The one that catches people is the third: needing both keyed lookup *and* order is common — sliding windows over timestamps, calendar problems, closest-value queries — and reaching for a hash map there produces a solution that works and is O(n) where it should be O(log n).",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module",
      body: [
        "You now have the map. Every structure in Module 1 is one of these, examined in more depth or specialised for a particular problem.",
        "**The habit worth keeping:** when you read a problem, list the operations the algorithm will perform and how often. Then pick the structure whose cheap operations match your frequent ones. That is the entire skill, and it beats memorising which structure goes with which problem name.",
        "**The one thing to internalise:** every structure buys speed somewhere by giving it up elsewhere. When one looks free, find the price — it is usually memory, ordering, or the ability to search.",
        "One module remains before Module 1: complexity analysis, which gives you the vocabulary this lesson has been borrowing all the way through. After that, the structures get built rather than surveyed.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When would you use a TreeMap instead of a HashMap?",
      answer:
        "When you need ordering as well as keyed lookup — floor and ceiling queries, ranges, the smallest or largest key, or iteration in sorted order. A hash map cannot answer any of those without scanning everything. The cost is O(log n) per operation instead of O(1), which is usually cheap: log₂ of a million is twenty. Problems phrased as \"the closest\", \"the next available\" or \"within this range\" are signalling a sorted structure.",
    },
    {
      question: "Python has no TreeMap — what do you use?",
      answer:
        "The `bisect` module over a list you keep sorted, which gives O(log n) search via `bisect_left` and `bisect_right`. The limitation is that insertion is O(n) because the list shifts, so it suits data built once and queried many times. When insertions and queries interleave, the answer is `sortedcontainers.SortedList`, which is effectively O(log n) for both — third-party, so in an interview you name it and explain the trade rather than pretending it is built in.",
    },
    {
      question: "How do you decide which data structure to use?",
      answer:
        "List the operations the algorithm performs and how often, then pick the structure whose cheap operations match the frequent ones. In order of restrictiveness: indexing by position means an array; keyed lookup means a hash map, or a sorted map if order matters too; needing only the extreme means a heap; one-ended access means a stack or queue; relationships mean a graph. When nothing matches, a dynamic array is the right default — starting there and changing when a cost hurts is a legitimate strategy.",
    },
  ],
  takeaways: [
    "A sorted map adds floor, ceiling, range and extremes — none of which a hash map can answer",
    "The price is O(log n) rather than O(1), which is twenty steps at a million entries",
    "`floor`/`ceiling` are inclusive; `lower`/`higher` are strict",
    "TreeMap range views are views, not copies, and reflect later changes",
    "A null from `ceilingKey` autounboxes into a NullPointerException",
    "Python has no sorted map: use `bisect` over a sorted list, or `sortedcontainers`",
    "`bisect_left` and `bisect_right` differ only on an exact match — that is what counts a range",
    "Match cheap operations to frequent ones; default to a dynamic array when nothing matches",
  ],
};
