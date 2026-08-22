import type { Lesson } from "@/content/types";

export const lruCacheLesson: Lesson = {
  id: "dsa-ll-lru",
  slug: "the-lru-cache",
  moduleSlug: "linked-lists",
  title: "The LRU Cache",
  summary:
    "The problem that justifies the doubly linked list. A hash map gives O(1) lookup and has no order; a list gives order and has no lookup. Neither works alone, and together they are exactly O(1).",
  estimatedMinutes: 35,
  objectives: [
    "Explain why one structure cannot do the job",
    "Describe the roles of the map and the list precisely",
    "Justify the sentinel head and tail nodes",
    "Recognise the built-in shortcut and when it is acceptable",
  ],
  sections: [
    {
      id: "why-two",
      heading: "Why two structures",
      body: [
        "The cache must do three things in O(1): look a key up, mark a key as most recently used, and evict the least recently used.",
        "A **hash map** does the lookup in O(1) and knows nothing about order. Finding the least recently used entry would mean scanning every key.",
        "A **doubly linked list** keeps order — most recent at the front, least recent at the back — and evicting from the back is O(1). But finding a key in it is O(n).",
        "So use both, over the *same* nodes. The map holds key → node. The list holds the nodes in recency order. A lookup goes through the map to get the node in O(1), then unlinks and re-inserts it at the front in O(1) because it is doubly linked and you are holding it.",
        "That last clause is the reason the list must be doubly linked. Unlinking a node needs its predecessor; a singly linked list would require an O(n) search to find one, and the whole design would collapse.",
      ],
      visual: {
        id: "lru-visual",
        kind: "lru-cache",
        title: "Lookups moving nodes to the front, evictions from the back",
      },
    },
    {
      id: "sentinels",
      heading: "Sentinel head and tail",
      body: [
        "Every operation here is an unlink or an insert, and both have edge cases at the ends: removing the only node, inserting into an empty list, evicting the last remaining entry.",
        "Two permanent sentinel nodes — one before the first real node and one after the last — remove all of them. Every real node then has both a `prev` and a `next` that are never null, so unlinking is unconditionally `node.prev.next = node.next; node.next.prev = node.prev`.",
        "It is the dummy head idea from lesson 2, applied at both ends because the list is doubly linked. Written this way there is not a single null check in the implementation, and an LRU cache with no null checks is one that works the first time.",
        "The two helpers to write are `remove(node)` and `add_front(node)`. Every public operation is then a short composition of them: `get` is remove-then-add-front, `put` on an existing key is the same plus a value update, and `put` on a new key is add-front plus possibly evicting `tail.prev`.",
      ],
      examples: [
        {
          id: "linked-hash-map",
          title: "The built-in shortcut",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static class LRUCache {
        private final int capacity;
        private final LinkedHashMap<Integer, Integer> map;

        LRUCache(int capacity) {
            this.capacity = capacity;
            // accessOrder = true makes get() count as a use
            this.map = new LinkedHashMap<>(16, 0.75f, true);
        }

        int get(int key) {
            return map.getOrDefault(key, -1);
        }

        void put(int key, int value) {
            map.put(key, value);
            if (map.size() > capacity) {
                int oldest = map.keySet().iterator().next();
                map.remove(oldest);
            }
        }
    }

    public static void main(String[] args) {
        LRUCache c = new LRUCache(2);
        c.put(1, 1);
        c.put(2, 2);
        System.out.println("get(1): " + c.get(1));   // 1, and now 1 is newest
        c.put(3, 3);                                  // evicts 2, not 1
        System.out.println("get(2): " + c.get(2));   // -1
        System.out.println("get(3): " + c.get(3));   // 3
    }
}`,
          output: `get(1): 1
get(2): -1
get(3): 3`,
          explanation:
            "`LinkedHashMap` **is** a hash map plus a doubly linked list — the exact design above, already in the standard library. The third constructor argument turns on access order, so `get` counts as a use. `get(2)` returns −1 because touching key 1 made key 2 the least recently used, so inserting 3 evicted it. Python's equivalent is `collections.OrderedDict` with `move_to_end`, or `functools.lru_cache` for memoisation. Know this exists — and expect to be asked for the hand-rolled version anyway, because the map-plus-list insight is the thing being examined.",
        },
      ],
      pitfalls: [
        {
          title: "Using a singly linked list",
          body: "Unlinking a node then needs its predecessor, which costs O(n) to find — and the whole point of the design was O(1). The doubly linked list is not a preference here, it is a requirement.",
        },
        {
          title: "Forgetting to remove the evicted key from the map",
          body: "Unlinking the node from the list while leaving its key in the map leaves a dangling entry. Lookups then return a node that is no longer in the list, and the size accounting drifts. Every eviction touches both structures — always.",
        },
        {
          title: "Not treating get as a use",
          body: "A read must move the entry to the front. Miss it and the cache evicts entries that are actively being read, which is a correctness bug that only shows up in the access pattern the cache exists to optimise.",
        },
        {
          title: "Updating an existing key without moving it",
          body: "`put` on a key already present is both a value update and a use. Handling only the update leaves the entry in its old recency position.",
        },
      ],
    },
    {
      id: "beyond",
      heading: "Variants worth knowing",
      body: [
        "**LFU cache** — evict the *least frequently* used, breaking ties by recency. Needs a map from key to node, a map from frequency to a list of nodes at that frequency, and a running minimum frequency. Materially harder, and a common senior-level follow-up.",
        "**TTL caches** — entries expire on a clock as well as on pressure. Usually a heap or timing wheel keyed by expiry alongside the map.",
        "**All O(1) Data Structure** — increment and decrement keys, report the max and min key, all in O(1). The same map-plus-doubly-linked-list idea with buckets of equal-count keys, and the clearest generalisation of the pattern.",
        "**Insert Delete GetRandom O(1)** — a map plus an *array*, where deletion swaps with the last element. Different pair of structures, same principle: one structure for lookup, one for the ordering property, kept in sync.",
        "The generalisable lesson is worth stating plainly. When a problem demands O(1) for operations that pull in different directions — one needing lookup, one needing order — the answer is usually two structures over the same elements, with every mutation updating both.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Design an LRU cache with O(1) get and put.",
      answer:
        "A hash map from key to node plus a doubly linked list in recency order. Lookup goes through the map; using an entry unlinks it and re-inserts it at the front, both O(1) because the node is doubly linked and already in hand. Eviction removes the node before the tail sentinel and deletes its key from the map.",
    },
    {
      question: "Why must the list be doubly linked?",
      answer:
        "Unlinking a node requires its predecessor. A singly linked list would need an O(n) scan to find it, which defeats the O(1) requirement. The `prev` pointer is what makes remove-in-place constant time.",
    },
    {
      question: "What do the sentinel nodes buy you?",
      answer:
        "They remove every null check. With a permanent node before the head and after the tail, every real node has non-null neighbours, so unlink and insert are unconditional two-line operations — and the empty, single-element and evict-the-last cases all stop being special.",
    },
  ],
  takeaways: [
    "The map gives lookup, the list gives order — neither works alone",
    "Both structures reference the same nodes and are updated together",
    "Doubly linked is required, because unlinking needs the predecessor",
    "Sentinel head and tail remove every null check",
    "get is a use — move the entry to the front",
    "LinkedHashMap and OrderedDict are this design, already built",
  ],
  status: "available",
};
