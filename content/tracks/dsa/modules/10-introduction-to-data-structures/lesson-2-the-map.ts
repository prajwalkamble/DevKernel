import type { Lesson } from "@/content/types";

export const theMapLesson: Lesson = {
  id: "dsa-ds-map",
  slug: "the-map-of-data-structures",
  moduleSlug: "introduction-to-data-structures",
  title: "The Map of Data Structures",
  summary:
    "Every structure you will meet, grouped by what makes them different, and the built-in that provides each one in Python and Java.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Name the six families and what distinguishes them",
    "Identify which eight structures cover almost every interview problem",
    "Map each structure to its built-in in both languages",
    "Know which ones you will implement and which ones you will just use",
  ],
  sections: [
    {
      id: "families",
      heading: "Six families",
      body: [
        "There are a lot of named structures and only a few genuinely different ideas. Grouping them makes the list memorable.",
        "**Linear and contiguous** — elements in a row, in one block of memory. Array, dynamic array, string. Fast to index, slow to insert in the middle.",
        "**Linear and linked** — elements in a row, connected by references. Linked lists. Fast to insert, slow to index.",
        "**Restricted linear** — a linear structure with the operations deliberately limited. Stack, queue, priority queue. The restriction is the point: it makes the behaviour predictable and the implementation fast.",
        "**Associative** — keyed lookup rather than positional. Hash maps and sets, and their ordered counterparts.",
        "**Hierarchical** — each element has children. Trees, heaps, tries.",
        "**Connected** — arbitrary relationships. Graphs, and union-find for tracking connectivity.",
      ],
      examples: [
        {
          id: "families",
          title: "The full list, grouped",
          lang: "python",
          code: `families = {
    "linear, contiguous": ["array", "dynamic array / list", "string"],
    "linear, linked": ["singly linked list", "doubly linked list", "deque"],
    "restricted linear": ["stack", "queue", "priority queue"],
    "associative": ["hash map", "hash set", "sorted map", "sorted set"],
    "hierarchical": ["binary tree", "BST", "heap", "trie"],
    "connected": ["graph", "union-find"],
}

for family, members in families.items():
    print(f"{family:<20} {', '.join(members)}")

print()
print("total distinct structures:", sum(len(m) for m in families.values()))
print("worth knowing cold      :", 8)`,
          output: `linear, contiguous   array, dynamic array / list, string
linear, linked       singly linked list, doubly linked list, deque
restricted linear    stack, queue, priority queue
associative          hash map, hash set, sorted map, sorted set
hierarchical         binary tree, BST, heap, trie
connected            graph, union-find

total distinct structures: 19
worth knowing cold      : 8`,
          explanation:
            "Nineteen names, six ideas. Note the ordering of the families is roughly the order this course covers them, and it is roughly the order of increasing structure: a row, a row with links, a row with rules, keyed access, a hierarchy, an arbitrary graph.",
        },
      ],
      visual: {
        id: "list-visual",
        kind: "linked-list",
        title: "A linked list: cheap to splice, expensive to reach",
      },
    },
    {
      id: "the-eight",
      heading: "The eight that matter most",
      body: [
        "If you know these eight properly, you can solve the large majority of interview problems. The rest are specialisations you can learn when a problem demands them.",
        "**Dynamic array** — the default. Ordered, indexable, appendable.",
        "**Hash map** and **hash set** — the other default. Keyed lookup, membership testing, counting, grouping. Half of all easy and medium problems involve one.",
        "**Stack** — anything with nesting, matching, undo, or \"the most recent thing that…\".",
        "**Queue** and **deque** — breadth-first traversal, sliding windows, anything processed in arrival order.",
        "**Heap** — top-k, streaming medians, scheduling, Dijkstra.",
        "**Binary search tree** (in practice, a sorted map) — when you need ordering *and* fast lookup.",
        "**Graph** — anything about relationships, and any grid problem, since a grid is a graph.",
        "The remaining ones — tries, union-find, segment trees, balanced-tree internals — each unlock a specific family of problems and are worth learning after these eight are automatic.",
      ],
    },
    {
      id: "builtins",
      heading: "What each language gives you",
      body: [
        "You will implement a handful of these for understanding and use the built-in for everything else. Knowing the built-in names saves real time under interview pressure.",
        "Two entries deserve comment.",
        "**Python has no sorted map.** There is no built-in equivalent of `TreeMap`. The usual substitutes are the `bisect` module over a sorted list, or the third-party `sortedcontainers` — and in an interview, saying \"I would use a `SortedList` here, or maintain a sorted list with `bisect`\" is the expected answer.",
        "**Python's heap is a min-heap only**, and it is a module of functions operating on a plain list rather than a class. Java's `PriorityQueue` is also a min-heap by default but takes a comparator.",
      ],
      examples: [
        {
          id: "builtins",
          title: "The mapping, both languages",
          lang: "python",
          code: `rows = [
    ("dynamic array", "list", "ArrayList<E>"),
    ("hash map", "dict", "HashMap<K,V>"),
    ("hash set", "set", "HashSet<E>"),
    ("sorted map", "(none - use bisect)", "TreeMap<K,V>"),
    ("stack", "list", "ArrayDeque<E>"),
    ("queue / deque", "collections.deque", "ArrayDeque<E>"),
    ("min-heap", "heapq on a list", "PriorityQueue<E>"),
    ("linked list", "(rarely used)", "LinkedList<E>"),
]

fmt = "{:<15} {:<21} {}"
print(fmt.format("structure", "Python", "Java"))
print("-" * 56)
for r in rows:
    print(fmt.format(*r))`,
          output: `structure       Python                Java
--------------------------------------------------------
dynamic array   list                  ArrayList<E>
hash map        dict                  HashMap<K,V>
hash set        set                   HashSet<E>
sorted map      (none - use bisect)   TreeMap<K,V>
stack           list                  ArrayDeque<E>
queue / deque   collections.deque     ArrayDeque<E>
min-heap        heapq on a list       PriorityQueue<E>
linked list     (rarely used)         LinkedList<E>`,
          explanation:
            "Note `ArrayDeque` appears twice: in Java it is the recommended implementation of both a stack and a queue. The older `Stack` class is synchronised and extends `Vector`, which makes it slower and gives it a bizarre iteration order — the JDK's own documentation points at `ArrayDeque` instead. Python has no stack type because a list already does it: `append` and `pop` at the end are both O(1).",
        },
      ],
      pitfalls: [
        {
          title: "Using `java.util.Stack` or `LinkedList` as a queue",
          body: "Both work and both are the wrong choice. `Stack` is legacy and synchronised; `LinkedList` allocates a node per element and scatters them through memory, so it is measurably slower than `ArrayDeque` for every queue operation despite identical big-O. `ArrayDeque` is the answer for both stacks and queues in modern Java.",
        },
      ],
    },
    {
      id: "what-to-implement",
      heading: "What to implement, what to use",
      body: [
        "A reasonable division, and one that matches what interviews actually ask.",
        "**Implement at least once, for understanding:** a dynamic array's growth, a singly linked list, a stack and a queue on an array, a binary search tree's insert and search, a heap's sift-up and sift-down.",
        "**Use the built-in, always:** hash maps and sets. Nobody will ask you to write a hash table in a 45-minute interview, and if they do, they are testing something other than problem-solving.",
        "**Understand but rarely implement:** balanced trees. Knowing that a red-black tree keeps operations O(log n) is enough; the rotation cases are not interview material.",
        "The reason to implement any of them is not that you will need the code. It is that having written a sift-down once makes the heap's costs obvious forever, and the costs are what you actually use.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which data structures should you know for interviews?",
      answer:
        "Eight cover the large majority: dynamic array, hash map, hash set, stack, queue or deque, heap, a sorted map or BST, and graphs. Beyond those, tries, union-find and segment trees each unlock a specific family of problems and are worth learning once the first eight are automatic. Grouping them helps — contiguous, linked, restricted-linear, associative, hierarchical and connected are the six underlying ideas.",
    },
    {
      question: "What would you use in Java for a stack and a queue?",
      answer:
        "`ArrayDeque` for both. The legacy `Stack` class is synchronised, extends `Vector`, and iterates bottom-to-top, which surprises people; `LinkedList` implements `Queue` but allocates a node per element and has poor memory locality, so it loses to `ArrayDeque` in practice despite matching big-O. In Python a plain list serves as a stack because append and pop at the end are O(1), and `collections.deque` serves as a queue.",
    },
    {
      question: "What does Python not have that Java does?",
      answer:
        "A sorted map or sorted set — there is no built-in equivalent of `TreeMap` or `TreeSet`. The standard substitutes are the `bisect` module over a maintained sorted list, which gives O(log n) search but O(n) insertion, or the third-party `sortedcontainers` library, whose `SortedList` gives effectively O(log n) for both. Saying so explicitly is the expected answer when a problem needs ordered lookup.",
    },
  ],
  takeaways: [
    "Six families: contiguous, linked, restricted-linear, associative, hierarchical, connected",
    "Eight structures cover most problems; the rest unlock specific families",
    "Hash maps and sets appear in roughly half of all easy and medium problems",
    "`ArrayDeque` is Java's answer for both stacks and queues; avoid `Stack` and `LinkedList`",
    "A Python list is already a stack — append and pop at the end are O(1)",
    "Python has no sorted map; use `bisect` over a sorted list, or `sortedcontainers`",
    "Python's `heapq` is min-only and operates on a plain list",
    "Implement a few for understanding; use the built-in hash map always",
  ],
};
