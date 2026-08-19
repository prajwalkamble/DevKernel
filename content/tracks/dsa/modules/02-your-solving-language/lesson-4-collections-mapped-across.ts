import type { Lesson } from "@/content/types";

export const collectionsMappedLesson: Lesson = {
  id: "dsa-lang-collections",
  slug: "collections-mapped-across",
  moduleSlug: "your-solving-language",
  title: "Collections, Mapped Onto Each Other",
  summary:
    "The eight structures that appear in nearly every solution, what each costs, and the exact name for the same thing in both languages.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Name the Java and Python equivalent of each core structure",
    "State the cost of the operations you will actually perform on each",
    "Use `Counter`, `defaultdict`, `deque`, `heapq` and `bisect`, and their Java counterparts",
    "Choose a structure from the operation your problem performs most",
  ],
  sections: [
    {
      id: "the-table",
      heading: "The whole map, on one screen",
      body: [
        "Eight structures cover nearly everything. Learn this table once and most of the standard-library question disappears.",
      ],
      examples: [
        {
          id: "mapping-table",
          title: "The same structure, both languages",
          lang: "bash",
          code: `WHAT YOU WANT             JAVA                      PYTHON            LOOKUP  INSERT

growable array            ArrayList<E>              list              O(1)*   O(1) amortised
key to value              HashMap<K,V>              dict              O(1)~   O(1)~
membership only           HashSet<E>                set               O(1)~   O(1)~
keys kept in order        TreeMap<K,V>              (none built in)   O(log n) O(log n)
push and pop both ends    ArrayDeque<E>             collections.deque O(1)    O(1)
smallest remaining        PriorityQueue<E>          heapq (on a list) O(1) peek O(log n)
count occurrences         HashMap + merge           collections.Counter
group into buckets        computeIfAbsent           collections.defaultdict

  * by index.  ~ average case; worst case is O(n) if every key collides.

  Python has no built-in sorted map. Use a sorted list plus the bisect
  module, or the third-party sortedcontainers when it is available.`,
          explanation:
            "The two columns that matter are the last two. Almost every structure choice in this track comes down to which operation you are about to do a hundred thousand times, and reading across that row tells you whether it costs you constant time or logarithmic — or, if you have chosen wrong, linear.",
        },
      ],
    },
    {
      id: "python-batteries",
      heading: "Python's four batteries",
      body: [
        "Four imports do most of the work, and using them is the difference between idiomatic Python and Java written with Python syntax.",
        "**`Counter`** counts things. It is a `dict` subclass, so everything you know about dicts still applies, and `most_common(k)` gives the top k directly.",
        "**`defaultdict`** removes the \"is this key there yet?\" check when grouping.",
        "**`deque`** is a double-ended queue with O(1) at both ends. This one is not optional: `list.pop(0)` is O(n), and using a list as a queue turns a linear BFS into a quadratic one.",
        "**`heapq`** turns a plain list into a min-heap. There is no max-heap — you negate the values, which is the standard trick and worth internalising now.",
      ],
      examples: [
        {
          id: "python-batteries-demo",
          title: "All four, doing what you will actually use them for",
          lang: "python",
          code: `from collections import Counter, defaultdict, deque
import heapq
import bisect

counts = Counter("mississippi")
print(counts.most_common(2))

groups = defaultdict(list)
groups["a"].append(1)
groups["a"].append(2)
print(dict(groups))

queue = deque([1, 2, 3])
queue.appendleft(0)
print(queue.popleft(), list(queue))

heap = [5, 1, 3]
heapq.heapify(heap)
print(heapq.heappop(heap), heap)
print(heapq.nlargest(2, [5, 1, 9, 3]))

values = [1, 3, 5, 7]
print(bisect.bisect_left(values, 5), bisect.bisect_right(values, 5), bisect.bisect_left(values, 4))`,
          output: `[('i', 4), ('s', 4)]
{'a': [1, 2]}
0 [1, 2, 3]
1 [3, 5]
[9, 5]
2 3 2`,
          explanation:
            "Note the last line, which is the whole of binary search handed to you. `bisect_left` gives the first position where the value could be inserted keeping order — so for a value that is present, it is the index of its first occurrence, and for one that is absent, it is where it would go. `bisect_right` gives the position after the last occurrence. The difference between them is the count of that value, which solves a surprising number of problems on its own.",
        },
      ],
      pitfalls: [
        {
          title: "Using a list as a queue",
          body: "`values.pop(0)` removes from the front by shifting every remaining element left — O(n). In a BFS over 10⁵ nodes that turns the whole traversal quadratic. `collections.deque` and `popleft()` is O(1). This is the single most common accidental slowdown in Python solutions.",
        },
        {
          title: "Expecting a max-heap",
          body: "`heapq` is a min-heap only. For a max-heap, push `-value` and negate on the way out. For tuples, negate the field you are ordering by: `heapq.heappush(h, (-count, word))`.",
        },
      ],
    },
    {
      id: "java-equivalents",
      heading: "Java's equivalents",
      body: [
        "Java has no `Counter` or `defaultdict`, but it has two `Map` methods that do the same jobs in one line each, and knowing them removes most of the verbosity people complain about.",
        "**`merge(key, 1, Integer::sum)`** is counting. If the key is absent it stores 1; if present it applies the function to the old and new values.",
        "**`computeIfAbsent(key, k -> new ArrayList<>())`** is grouping. It creates the list on first use and returns it either way, so you can chain `.add(...)` straight onto it.",
        "**`getOrDefault(key, 0)`** is the read-side equivalent and saves a null check.",
      ],
      examples: [
        {
          id: "java-collections-demo",
          title: "The same six operations in Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char c : "mississippi".toCharArray()) {
            counts.merge(c, 1, Integer::sum);
        }
        System.out.println(counts.get('s') + " " + counts.getOrDefault('z', 0));

        Map<String, List<Integer>> groups = new HashMap<>();
        groups.computeIfAbsent("a", k -> new ArrayList<>()).add(1);
        groups.computeIfAbsent("a", k -> new ArrayList<>()).add(2);
        System.out.println(groups);

        Deque<Integer> queue = new ArrayDeque<>(List.of(1, 2, 3));
        queue.addFirst(0);
        System.out.println(queue.pollFirst() + " " + queue);

        PriorityQueue<Integer> heap = new PriorityQueue<>(List.of(5, 1, 3));
        System.out.println(heap.poll() + " " + heap.peek());

        TreeMap<Integer, String> ordered = new TreeMap<>();
        ordered.put(1, "a");
        ordered.put(5, "b");
        ordered.put(9, "c");
        System.out.println(ordered.firstKey() + " " + ordered.ceilingKey(4) + " " + ordered.floorKey(4));
    }
}`,
          output: `4 0
{a=[1, 2]}
0 [1, 2, 3]
1 3
1 5 1`,
          explanation:
            "The last line is the thing Python does not have. `TreeMap` keeps keys sorted and answers \"the smallest key at least 4\" (`ceilingKey`) and \"the largest key at most 4\" (`floorKey`) in O(log n). Problems about the nearest earlier or later value — interval scheduling, stock spans, calendar bookings — are usually asking for exactly this, and in Python you build it out of a sorted list and `bisect`.",
        },
      ],
      pitfalls: [
        {
          title: "`PriorityQueue` is not sorted when you iterate it",
          body: "Printing one shows heap order, not sorted order — only `poll()` gives elements in priority sequence. The example above prints `[3, 5]`-shaped internals rather than a sorted list, and people misread that as a bug in their comparator.",
        },
        {
          title: "`==` on boxed Integers",
          body: "`Integer` values between −128 and 127 are cached, so `==` appears to work and then stops working at 128. Always use `.equals()`, or compare as `int` by unboxing. This is a genuine, hard-to-see source of wrong answers.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing from the operation, not from habit",
      body: [
        "The decision procedure is one question: **what does this problem do most?**",
        "**Repeated \"have I seen this?\"** → a hash set. This is the single most common answer in the whole track, and it is what turns an O(n²) nested loop into O(n).",
        "**Repeated \"how many of these?\"** → a hash map, or `Counter`.",
        "**Repeated \"the smallest thing remaining\"** → a heap. If you find yourself sorting inside a loop, this is what you wanted.",
        "**Repeated \"the most recent unresolved thing\"** → a stack. Nesting, matching brackets, next-greater-element.",
        "**Repeated \"the oldest thing\"** → a queue, and therefore a deque.",
        "**Repeated \"the nearest key above or below\"** → a sorted structure: `TreeMap`, or a sorted list with `bisect`.",
        "**Repeated \"the sum of a range\"** → not a structure at all, but a prefix-sum array.",
        "Notice that every one of those starts with an operation and ends at a structure. Starting from the structure you like and looking for a way to use it is the mistake, and it is the one that produces solutions that are almost right and slower than they should be.",
      ],
      examples: [
        {
          id: "operation-picks-structure",
          title: "The same input, four questions, four structures",
          lang: "python",
          code: `from collections import Counter
import heapq

values = [4, 1, 4, 9, 1, 4]

# "have I seen this?"        -> set
seen = set()
duplicate = next((v for v in values if v in seen or seen.add(v)), None)
print("first duplicate:", duplicate)

# "how many of each?"        -> Counter
print("counts:", Counter(values).most_common())

# "the two largest?"         -> heap
print("two largest:", heapq.nlargest(2, values))

# "sum of a range, often?"   -> prefix sums
prefix = [0]
for v in values:
    prefix.append(prefix[-1] + v)
print("sum of values[1:4]:", prefix[4] - prefix[1])`,
          output: `first duplicate: 4
counts: [(4, 3), (1, 2), (9, 1)]
two largest: [9, 4]
sum of values[1:4]: 14`,
          explanation:
            "Four questions about one array, four different structures, and none of them is a preference — each is named by its question. The prefix array is the odd one out and worth noticing: it is not a data structure from the library at all, just an array you computed once so that every later range sum is a single subtraction.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is `list.pop(0)` a problem in Python?",
      answer:
        "It removes from the front of a dynamic array, which requires shifting every remaining element left — O(n) per call. Used as a queue in a BFS over n nodes it makes the whole traversal O(n²). `collections.deque` supports `popleft()` in O(1) because it is a doubly-linked structure of blocks rather than one contiguous array. The Java equivalent is `ArrayDeque`, and the same warning applies to `ArrayList.remove(0)`.",
    },
    {
      question: "How do you get a max-heap in Python?",
      answer:
        "`heapq` provides only a min-heap, so you negate: push `-value` and negate again when popping. For tuples, negate the field you are ordering by — `(-count, word)` gives the highest count first while keeping words in ascending order for ties, which is exactly what top-k-frequent problems ask for. Java's `PriorityQueue` takes a comparator, so `new PriorityQueue<>(Comparator.reverseOrder())` does it directly.",
    },
    {
      question: "When would you use a TreeMap instead of a HashMap?",
      answer:
        "When you need order, not just lookup. `TreeMap` keeps keys sorted and gives you `firstKey`, `lastKey`, `ceilingKey` and `floorKey` — the nearest key above or below a value — in O(log n). A `HashMap` cannot answer those at all without scanning everything. The cost is O(log n) rather than O(1) on ordinary get and put, so you take it only when the ordering queries are what the problem is about: nearest booking, next greater timestamp, range queries over keys.",
    },
  ],
  takeaways: [
    "Eight structures cover nearly everything; learn the cross-language table once",
    "Python's four batteries: `Counter`, `defaultdict`, `deque`, `heapq` — plus `bisect` for ordered lookup",
    "Java's two workhorse Map methods are `merge` for counting and `computeIfAbsent` for grouping",
    "`bisect_right` minus `bisect_left` is the count of a value in a sorted list",
    "`list.pop(0)` is O(n) and turns a BFS quadratic; use a deque",
    "`heapq` is min-only — negate for a max-heap, including inside tuples",
    "Java's `TreeMap` answers nearest-above and nearest-below in O(log n); Python needs a sorted list plus bisect",
    "Pick the structure from the operation the problem repeats most, never from preference",
  ],
};
