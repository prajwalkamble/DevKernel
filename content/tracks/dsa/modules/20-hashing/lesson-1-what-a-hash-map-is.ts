import type { Lesson } from "@/content/types";

export const whatAHashMapIsLesson: Lesson = {
  id: "dsa-hash-what",
  slug: "buckets-hashes-and-load-factor",
  moduleSlug: "hashing",
  title: "What a Hash Map Actually Is",
  summary:
    "An array you index with a number computed from the key. Everything else — collisions, chaining, resizing, the load factor — is bookkeeping to keep that one trick working as the table fills up.",
  estimatedMinutes: 30,
  objectives: [
    "Describe a hash map as an array plus a function from key to index",
    "Explain what a collision is and how chaining resolves it",
    "Say what the load factor is and why exceeding it triggers a resize",
    "Explain why resizing is amortised O(1) rather than free",
  ],
  sections: [
    {
      id: "the-trick",
      heading: "The whole trick, in one sentence",
      body: [
        "An array gives you O(1) access *if you already know the index*. A hash map's entire contribution is a way to compute an index from a key that is not a number.",
        "That function is the **hash function**. Feed it `\"ana\"`, get back some large integer; take that integer modulo the number of slots, and you have an index into an ordinary array. Store the key and value there. To look `\"ana\"` up again, recompute the same index and read that slot.",
        "Nothing is searched. That is the point, and it is why a hash map turns a nested loop into a single pass more often than any other structure in this track.",
        "The catch is immediate: two different keys can produce the same index. That is a **collision**, and everything else in this lesson exists to handle it.",
      ],
      examples: [
        {
          id: "toy-table",
          title: "Seven buckets, seven keys",
          lang: "python",
          code: `words = ["ana", "bob", "cy", "dee", "eve", "fay", "gus"]
buckets = [[] for _ in range(7)]

for w in words:
    h = 0
    for ch in w:
        h = h * 31 + ord(ch)
    buckets[h % 7].append(w)

for i, b in enumerate(buckets):
    print(i, b)`,
          output: `0 ['fay', 'gus']
1 []
2 ['dee']
3 []
4 ['bob']
5 ['ana', 'cy']
6 ['eve']`,
          explanation:
            "The `h * 31 + ord(ch)` loop is close to what `String.hashCode` really does in Java. Seven keys into seven buckets does **not** give one key per bucket — two buckets hold two keys and two hold none. That is normal and expected, not a sign of a bad hash: spreading n keys randomly over n buckets leaves about 37% of them empty.",
        },
      ],
      visual: {
        id: "hash-buckets",
        kind: "hash-table",
        title: "Keys landing in buckets, collisions chaining",
        words: ["ana", "bob", "cy", "dee", "eve", "fay", "gus"],
      },
    },
    {
      id: "collisions",
      heading: "Collisions, and chaining",
      body: [
        "Two keys landing in the same bucket is not an error to be avoided — with a table smaller than the universe of keys it is a mathematical certainty. It is a case to be handled.",
        "**Chaining** is the common answer: each bucket holds a small list, and a collision appends to it. Lookup finds the bucket, then walks its list comparing keys with `==`. Java's `HashMap`, Python's `dict` and Go's `map` all resolve collisions, and all of them therefore call your key's equality check — which is why the equals/hashCode contract in lesson 6 is not academic.",
        "**Open addressing** is the other answer: on a collision, probe forward for the next free slot. Python's `dict` uses a form of this. It is more cache-friendly and more fiddly to delete from.",
        "The distinction rarely changes how you *use* a map. What it changes is the cost when the chains get long, which is the next lesson.",
      ],
    },
    {
      id: "load-factor",
      heading: "Load factor, and why the table resizes",
      body: [
        "The **load factor** is `entries / buckets`. At 0.75 — Java's default — three quarters of the buckets have something in them and chains are still short.",
        "Push past that and chains lengthen, so every lookup walks further. So the table **resizes**: allocate a bigger array, usually double, and re-insert everything. Every key's index is recomputed, because the index depended on the bucket count.",
        "A resize is O(n). It happens rarely enough that the *average* insertion is still O(1) — this is amortised analysis, the same argument as the dynamic array's doubling. The cost is real but spread out.",
        "Two practical consequences. **First**, if you know roughly how many entries are coming, say so at construction — `new HashMap<>(expectedSize)` — and you skip the resize chain entirely. **Second**, a single `put` can occasionally take far longer than the others, which matters for latency-sensitive code and not at all for interview problems.",
      ],
      pitfalls: [
        {
          title: "Expecting the iteration order to mean something",
          body: "A hash map's iteration order is a consequence of bucket layout, and a resize changes it. Java's `HashMap` and Go's `map` both make no order guarantee — Go actively randomises it so you cannot accidentally depend on it. If you need order, use `LinkedHashMap`, an ordered dict, or sort on the way out. Python's `dict` does preserve insertion order as of 3.7, which is a language guarantee rather than a property of hashing.",
        },
        {
          title: "Treating the hash as the identity",
          body: "Equal hashes do not mean equal keys — that is what a collision *is*. Every map compares keys with equality after finding the bucket. A key type whose `equals` disagrees with its `hashCode` breaks this, and the entry becomes unreachable.",
        },
        {
          title: "Mutating a key after inserting it",
          body: "The entry sits in the bucket its hash chose at insertion time. Change a field the hash depends on and the key now hashes elsewhere — the entry is still in the table, occupying memory, and no lookup will ever find it. Use immutable keys.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the time complexity of a hash map lookup?",
      answer:
        "O(1) on average, O(n) in the worst case. The average assumes keys spread across buckets so chains stay short; the worst case is every key in one bucket, which degrades to a linear scan. Say both — an answer of just 'O(1)' is the one interviewers push back on.",
    },
    {
      question: "Why does a hash map resize, and what does it cost?",
      answer:
        "It resizes when the load factor is exceeded, to keep chains short. It costs O(n) because every entry's bucket index has to be recomputed for the new table size. Doubling makes the amortised cost per insertion O(1).",
    },
    {
      question: "What happens if two keys have the same hash code?",
      answer:
        "They land in the same bucket, and the map falls back to comparing keys with equality — walking the chain under chaining, or probing under open addressing. Correctness is unaffected; only speed is.",
    },
  ],
  takeaways: [
    "A hash map is an array plus a function from key to index",
    "Collisions are certain, not exceptional — chaining or probing handles them",
    "Load factor is entries ÷ buckets; crossing it triggers an O(n) resize",
    "Doubling makes insertion amortised O(1), not uniformly O(1)",
    "Iteration order is not a guarantee unless the type promises one",
    "Never mutate a key after it has been inserted",
  ],
  status: "available",
};
