import type { Lesson } from "@/content/types";

export const groupingByDerivedKeyLesson: Lesson = {
  id: "dsa-hash-grouping",
  slug: "grouping-by-a-derived-key",
  moduleSlug: "hashing",
  title: "Grouping by a Derived Key",
  summary:
    "Find the thing every member of a group shares, compute it, and use it as the map key. The whole difficulty of these problems is choosing the key — the grouping itself is three lines.",
  estimatedMinutes: 30,
  objectives: [
    "Design a canonical form for an equivalence class",
    "Group items in one pass with a map from key to list",
    "Weigh the cost of computing a key against the cost of comparing items",
    "Recognise grouping problems by their phrasing",
  ],
  sections: [
    {
      id: "canonical-forms",
      heading: "The key is the problem",
      body: [
        "\"Group the anagrams together.\" The naive approach compares every string against every other — O(n²) comparisons, each itself O(k).",
        "The better question is: what do all anagrams of one word have in common, that nothing else has? Their sorted letters. `eat`, `tea` and `ate` all become `aet`; `bat` becomes `abt` and joins nothing. That value is a **canonical form** — one representative for an entire equivalence class.",
        "Once you have it, grouping is a single pass appending into `map[key]`. The algorithm is not the grouping. The algorithm is the choice of key.",
      ],
      examples: [
        {
          id: "group-anagrams",
          title: "Group Anagrams",
          lang: "python",
          code: `words = ["eat", "tea", "tan", "ate", "nat", "bat"]
groups = {}
for w in words:
    key = "".join(sorted(w))
    groups.setdefault(key, []).append(w)

for key, group in groups.items():
    print(key, group)`,
          output: `aet ['eat', 'tea', 'ate']
ant ['tan', 'nat']
abt ['bat']`,
          explanation:
            "`setdefault` is the idiom for \"append into a list I may not have created yet\" — Java spells it `computeIfAbsent`, Go relies on the zero value of a slice, C++ default-constructs on `operator[]`. Sorting each word costs O(k log k), so the whole thing is O(n · k log k). The letter-count alternative — a 26-tuple as the key — is O(n · k), better when words are long.",
        },
      ],
      visual: {
        id: "hash-group",
        kind: "hash-table",
        title: "Canonical keys landing in buckets",
        words: ["aet", "ant", "abt"],
      },
    },
    {
      id: "choosing",
      heading: "Choosing between candidate keys",
      body: [
        "Usually more than one canonical form works, and the choice is a cost trade.",
        "**Sorted letters** — `\"\".join(sorted(w))` — is short to write and obviously correct. O(k log k) per word.",
        "**A tuple of 26 counts** is O(k) per word and wins when words are long, but it is more code and the key is bulkier to hash.",
        "**A product of primes**, one prime per letter, is elegant and *wrong* on real inputs: the product overflows fixed-width integers on long words, and silently collides. In Python, where integers are arbitrary precision, it works but the multiplication is no longer O(1). Mention it as a known trap rather than a trick.",
        "The general test for a candidate key: **equal members must always produce equal keys, and different members must never produce equal keys**. The first is what makes the grouping complete; the second is what makes it correct. A key that satisfies only the first — like a hash of the word — puts extra members in a group, which is why hashing is not by itself a canonical form.",
      ],
    },
    {
      id: "recognising",
      heading: "Recognising the shape",
      body: [
        "The phrasing gives it away: *group*, *bucket*, *partition*, *find all sets of*, *how many distinct kinds of*.",
        "**Group Anagrams** — key is sorted letters or a letter tally.",
        "**Group Shifted Strings.** `abc` and `bcd` shift onto each other; the key is the tuple of gaps between consecutive letters, modulo 26 to make wraparound behave.",
        "**Isomorphic Strings.** Not grouping, but the same idea: map each string to a canonical pattern — `egg` and `add` both become `0,1,1` — and compare.",
        "**Number of Distinct Islands.** Key is the shape of an island normalised to its top-left corner, recorded as a path or a set of relative coordinates. The grouping is a set of shapes and the answer is its size.",
        "**Group by identical rows or columns.** Key is the row as a tuple. Trivially easy once you notice it is a grouping problem, and easy to miss.",
        "In every one of these, if the key is chosen well the remaining code is a three-line loop. If the problem feels hard, the key is wrong.",
      ],
      pitfalls: [
        {
          title: "Using an unhashable key",
          body: "Python lists and dicts cannot be dict keys. Convert to a tuple or a string. Java arrays *can* be map keys but hash by identity, so two equal `int[]` are different keys — use `Arrays.toString`, a `List<Integer>`, or a record.",
        },
        {
          title: "A key that merges things it should not",
          body: "The classic is grouping words by their *length* or by a set of letters — `abb` and `aab` share the same letter set but are not anagrams. Test candidate keys against a pair that should stay apart, not only against a pair that should join.",
        },
        {
          title: "Recomputing the key more than once per item",
          body: "Computing the key inside a comparison, or twice per loop iteration, quietly multiplies the cost. Compute once, then use it — especially when the key is a sort or a scan of the item.",
        },
        {
          title: "Depending on the group order",
          body: "The order the groups come out in is the map's iteration order, and the order within a group is insertion order. If a problem or a test expects a particular arrangement, sort explicitly rather than relying on either.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you group anagrams, and what is the complexity?",
      answer:
        "Map each word to a canonical form and append into a map keyed by it. Sorted letters gives O(n · k log k); a 26-element count tuple gives O(n · k), which is better for long words. Space is O(n · k) for the groups.",
    },
    {
      question: "What makes a good key for a grouping problem?",
      answer:
        "Equal members must always produce equal keys, and different members must never produce equal keys. The second condition is the one people skip — it is why a hash of the item is not a canonical form.",
    },
    {
      question: "Why is multiplying primes a risky anagram key?",
      answer:
        "It overflows fixed-width integers on longer words and then collides silently, so unrelated words group together. In arbitrary-precision languages it is correct but the multiplication stops being constant time.",
    },
  ],
  takeaways: [
    "Grouping is easy; choosing the canonical key is the problem",
    "A good key never merges members of different classes",
    "Sorted letters is O(k log k); a count tuple is O(k)",
    "setdefault / computeIfAbsent is the append-into-a-new-list idiom",
    "Prime products overflow — a known trap rather than a trick",
    "Keys must be hashable and must not hash by identity",
  ],
  status: "available",
};
