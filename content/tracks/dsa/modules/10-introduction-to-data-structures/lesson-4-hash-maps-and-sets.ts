import type { Lesson } from "@/content/types";

export const hashMapsAndSetsLesson: Lesson = {
  id: "dsa-ds-hash",
  slug: "hash-maps-and-sets",
  moduleSlug: "introduction-to-data-structures",
  title: "Hash Maps & Hash Sets",
  summary:
    "How O(1) lookup is possible at all, what a collision costs, and the four patterns that solve half of all interview problems.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Explain how hashing turns a key into a position in O(1)",
    "Describe collisions, load factor and why the average case holds",
    "Use the counting, grouping, seen-set and complement patterns fluently",
    "Say honestly when a hash map's worst case is O(n)",
  ],
  sections: [
    {
      id: "how",
      heading: "How O(1) lookup works",
      body: [
        "Indexing an array is O(1) because the position is arithmetic. A hash map takes that and makes it work for keys that are not integers.",
        "**Hash the key to a number, reduce it modulo the number of buckets, and that is the position.** Both steps are constant time, so finding where a key *should* be is O(1) regardless of how many entries exist.",
        "Then the complication: two different keys can hash to the same bucket. That is a **collision**, and it is unavoidable — there are infinitely many possible keys and finitely many buckets.",
        "The standard fix is **chaining**: each bucket holds a small list, and a lookup walks it. With a good hash function and enough buckets, those lists have length 0 or 1 almost always, which is why the average lookup is O(1) even though the worst case is not.",
      ],
      examples: [
        {
          id: "buckets",
          title: "A toy hash, and what happens when buckets run short",
          lang: "python",
          code: `def simple_hash(text):
    """A tiny polynomial hash - the same idea real ones use, much weaker."""
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) % (2 ** 32)
    return h


keys = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape"]


def show(n_buckets):
    buckets = [[] for _ in range(n_buckets)]
    for k in keys:
        buckets[simple_hash(k) % n_buckets].append(k)
    collisions = sum(len(b) - 1 for b in buckets if b)
    print(f"{len(keys)} keys in {n_buckets} buckets -> {collisions} collisions")
    for i, b in enumerate(buckets):
        print(f"   bucket {i}: {b}")


show(4)
print()
show(16)`,
          output: `7 keys in 4 buckets -> 3 collisions
   bucket 0: ['elderberry', 'fig']
   bucket 1: ['banana', 'cherry']
   bucket 2: ['apple', 'date']
   bucket 3: ['grape']

7 keys in 16 buckets -> 0 collisions
   bucket 0: []
   bucket 1: []
   bucket 2: []
   bucket 3: []
   bucket 4: ['fig']
   bucket 5: ['banana']
   bucket 6: []
   bucket 7: []
   bucket 8: []
   bucket 9: ['cherry']
   bucket 10: ['apple']
   bucket 11: ['grape']
   bucket 12: ['elderberry']
   bucket 13: []
   bucket 14: ['date']
   bucket 15: []`,
          explanation:
            "Seven keys in four buckets collide three times; the same seven in sixteen buckets collide not at all. The `h * 31 + ord(ch)` line is genuinely how Java's `String.hashCode` works — the whole mechanism is that simple. Note the second run leaves nine buckets empty: **the empty space is what buys the speed**, and it is why a hash map uses more memory than the data it holds.",
        },
      ],
      pitfalls: [
        {
          title: "Python's `hash()` on strings is not stable across runs",
          body: "It is randomised per process by a seed, as a defence against denial-of-service attacks that deliberately collide keys. So `hash(\"apple\")` gives a different number every time you start Python, and any code depending on a specific hash value or on bucket order is not reproducible. That randomisation is also why the example above defines its own hash instead of calling the built-in.",
        },
      ],
      visual: {
        id: "hash-visual",
        kind: "hash-table",
        title: "Hashing keys into buckets, collisions and all",
      },
    },
    {
      id: "load-factor",
      heading: "Load factor and resizing",
      body: [
        "The **load factor** is entries divided by buckets. It is the single number controlling how well a hash map performs.",
        "When it rises past a threshold — 0.75 in Java's `HashMap`, around 0.66 in Python's dict — the structure **allocates more buckets and rehashes every key into the new array.** That single insert costs O(n), and by the same doubling argument as the dynamic array, inserts remain amortised O(1).",
        "So a hash map is deliberately kept at most about two-thirds full. That is not waste; it is the mechanism. Packing it tighter makes chains longer and lookups slower.",
        "**Practical consequence:** if you know roughly how many entries you will store, presize it. `new HashMap<>(expectedSize * 4 / 3)` in Java skips every rehash, and rehashing a large map is genuinely expensive.",
      ],
    },
    {
      id: "patterns",
      heading: "The four patterns",
      body: [
        "Nearly every hash-map problem is one of four shapes. Learning them as shapes rather than as individual problems is the highest-leverage thing in this lesson.",
        "**Counting.** Map each value to how many times it appeared. Anagrams, majority element, character frequency, duplicates.",
        "**Grouping.** Map a *canonical form* to a list of everything sharing it. Group anagrams by sorted letters; group points by slope; group words by length.",
        "**The seen set.** Walk the input adding to a set, and check membership before adding. Duplicate detection, cycle detection, longest substring without repeats.",
        "**The complement.** For each element, ask whether the value you *need* has already been seen. This is the Two Sum trick and it turns an O(n²) double loop into one O(n) pass — the single most valuable pattern in the list.",
      ],
      examples: [
        {
          id: "python-patterns",
          title: "All four, in Python",
          lang: "python",
          code: `from collections import Counter, defaultdict

# 1. Counting
counts = {}
for word in "the cat sat on the mat the end".split():
    counts[word] = counts.get(word, 0) + 1
print("counting:", counts)
print("with Counter:", Counter("mississippi").most_common(3))

# 2. Grouping by a canonical form
groups = defaultdict(list)
for word in ["eat", "tea", "tan", "ate", "nat"]:
    groups["".join(sorted(word))].append(word)
print("grouping:", dict(groups))

# 3. The seen set
seen = set()
first_dup = None
for x in [3, 1, 4, 1, 5]:
    if x in seen:
        first_dup = x
        break
    seen.add(x)
print("first duplicate:", first_dup)


# 4. The complement
def two_sum(values, target):
    wanted = {}
    for i, v in enumerate(values):
        if v in wanted:
            return [wanted[v], i]
        wanted[target - v] = i
    return []


print("two sum:", two_sum([2, 7, 11, 15], 9), two_sum([3, 2, 4], 6))`,
          output: `counting: {'the': 3, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1, 'end': 1}
with Counter: [('i', 4), ('s', 4), ('p', 2)]
grouping: {'aet': ['eat', 'tea', 'ate'], 'ant': ['tan', 'nat']}
first duplicate: 1
two sum: [0, 1] [1, 2]`,
          explanation:
            "Four patterns, sixteen lines. The Two Sum version stores what it *wants to see later* rather than what it has seen, which is one of two equivalent spellings — the other stores each value and looks up `target - v`. Both are one pass and O(n); the second is more common and slightly easier to explain out loud.",
        },
        {
          id: "java-patterns",
          title: "The same, in Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        for (String w : "the cat sat on the mat the end".split(" ")) {
            counts.merge(w, 1, Integer::sum);
        }
        System.out.println(new TreeMap<>(counts));

        Map<String, List<String>> groups = new HashMap<>();
        for (String w : new String[] { "eat", "tea", "tan", "ate", "nat" }) {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
        }
        System.out.println(new TreeMap<>(groups));

        Set<Integer> seen = new HashSet<>();
        for (int x : new int[] { 3, 1, 4, 1, 5 }) {
            if (!seen.add(x)) {
                System.out.println("first duplicate: " + x);
                break;
            }
        }

        int[] values = { 2, 7, 11, 15 };
        int target = 9;
        Map<Integer, Integer> index = new HashMap<>();
        for (int i = 0; i < values.length; i++) {
            Integer j = index.get(target - values[i]);
            if (j != null) {
                System.out.println("two sum: [" + j + ", " + i + "]");
                break;
            }
            index.put(values[i], i);
        }

        System.out.println("getOrDefault: " + counts.getOrDefault("dog", 0));
    }
}`,
          output: `{cat=1, end=1, mat=1, on=1, sat=1, the=3}
{aet=[eat, tea, ate], ant=[tan, nat]}
first duplicate: 1
two sum: [0, 1]
getOrDefault: 0`,
          explanation:
            "Three methods here are worth learning by name. `merge(key, 1, Integer::sum)` is the counting idiom in one call. `computeIfAbsent` is the grouping idiom, creating the list only when the key is new. And **`set.add` returns false when the element was already present**, which turns the seen-set check into a single call rather than a contains-then-add. The output is wrapped in a `TreeMap` purely so the printed order is deterministic — a `HashMap`'s own order is unspecified.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming an iteration order",
          body: "A `HashMap`'s order is unspecified and can change between JDK versions or with a different insertion sequence. Python's dict has preserved insertion order since 3.7, which is a language guarantee — but a Python `set` has no such guarantee. Never write a solution whose correctness depends on the order a hash structure iterates in; if you need order, use `LinkedHashMap`, a `TreeMap`, or sort at the end.",
        },
      ],
    },
    {
      id: "worst-case",
      heading: "The honest worst case",
      body: [
        "\"A hash map is O(1)\" is an average-case claim, and the distinction occasionally matters.",
        "If every key hashes to the same bucket, every lookup walks a chain of length n and the map degrades to **O(n) per operation**. With random data this is vanishingly unlikely; with *adversarial* data it is not, which is why Python randomises its string hashing and why Java 8 upgraded long chains into balanced trees, capping the worst case at O(log n).",
        "For interviews the useful phrasing is: **average O(1), worst case O(n), and the worst case requires either a hostile input or a badly written `hashCode`.** Saying that shows you know it is not magic.",
        "The other honest cost is memory. A hash map holds spare buckets plus per-entry overhead — in Java, each entry is an object with a key reference, a value reference, a cached hash and a next pointer. Expect several times the memory of the raw data.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a hash map achieve O(1) lookup?",
      answer:
        "It hashes the key to an integer and reduces it modulo the bucket count, which gives the position directly — both steps are constant time regardless of size. Collisions, where two keys land in the same bucket, are handled by chaining a small list per bucket. With a good hash and a load factor kept below about 0.75, those chains are almost always length 0 or 1, so the average lookup is constant. The map resizes and rehashes when the load factor is exceeded, which keeps inserts amortised O(1).",
    },
    {
      question: "What is the worst case for a hash map, and when does it happen?",
      answer:
        "O(n) per operation, when every key hashes into the same bucket and each lookup walks a chain of length n. It requires either an adversarial input designed to collide or a badly written `hashCode` — a constant one, for instance. Real implementations defend against it: Python randomises string hashing per process, and Java 8 converts long chains into balanced trees, capping the worst case at O(log n). The correct phrasing is average O(1), worst case O(n).",
    },
    {
      question: "What are the common hash-map problem patterns?",
      answer:
        "Four. Counting — map value to frequency, for anagrams, majority element, duplicates. Grouping — map a canonical form to a list, such as sorted letters for anagram grouping. The seen set — add as you walk and test membership before adding, for duplicate and cycle detection. And the complement — for each element ask whether the value you need has already been seen, which is the Two Sum trick and turns an O(n²) double loop into a single O(n) pass.",
    },
  ],
  takeaways: [
    "Hash the key, reduce modulo the bucket count — both O(1), which is where the speed comes from",
    "Collisions are unavoidable; chaining keeps them cheap while the load factor stays low",
    "Resizing rehashes every key, which makes inserts amortised O(1) by the doubling argument",
    "A hash map is deliberately kept about two-thirds full; the empty space is the mechanism",
    "Average O(1), worst case O(n) — say both",
    "The four patterns: counting, grouping by canonical form, the seen set, the complement",
    "Java: `merge` for counting, `computeIfAbsent` for grouping, `add` returns false on a duplicate",
    "Never depend on iteration order; Python dicts preserve insertion order, sets and HashMaps do not",
  ],
};
