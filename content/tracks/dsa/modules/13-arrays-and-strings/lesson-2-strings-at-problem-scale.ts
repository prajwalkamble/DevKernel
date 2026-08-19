import type { Lesson } from "@/content/types";

export const stringsAtProblemScaleLesson: Lesson = {
  id: "dsa-arr-strings",
  slug: "strings-at-problem-scale",
  moduleSlug: "arrays-and-strings",
  title: "Strings at Problem Scale: Frequency & Canonical Form",
  summary:
    "The two ideas that solve most string problems — count the characters, or reduce the string to a canonical key — and the allocation that quietly turns a linear scan quadratic.",
  estimatedMinutes: 25,
  objectives: [
    "Replace a sort with a fixed-size frequency array when the alphabet is small",
    "Choose a canonical form and use it as a hash-map key",
    "Recognise when `substring` and slicing are costing you a complexity class",
    "Decide between a count array and a hash map on the size of the alphabet",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting beats sorting when the alphabet is small",
      body: [
        "Module 0 covered what a string is and what its operations cost. This lesson is about the two moves that appear in nearly every string problem worth the name.",
        "The first is **frequency counting**. \"Are these two words anagrams?\" has an obvious answer — sort both and compare — which is O(k log k) and completely correct. But an anagram is a statement about *how many of each letter*, and if the alphabet is 26 letters then a 26-slot array of counts answers it in O(k).",
        "The array is the point. It is fixed size regardless of the input, so its space cost is O(1); the index is computed from the character with `ch - 'a'`, which is the constant-time indexing from the last lesson doing exactly what it is good at.",
        "**When to use a map instead:** when the alphabet is not small or not known. Unicode, arbitrary tokens, or words rather than characters all want a `HashMap`/`dict`. The rule is the size of the key space, not the size of the input.",
      ],
      examples: [
        {
          id: "anagram-two-ways",
          title: "Anagram, sorted against counted",
          lang: "python",
          code: `import math


def by_sorting(a, b):
    return sorted(a) == sorted(b)


def by_count_array(a, b):
    if len(a) != len(b):
        return False
    counts = [0] * 26
    for ch in a:
        counts[ord(ch) - ord('a')] += 1
    for ch in b:
        i = ord(ch) - ord('a')
        counts[i] -= 1
        if counts[i] < 0:
            return False
    return True


pairs = [("listen", "silent"), ("anagram", "nagaram"),
         ("rat", "car"), ("aacc", "ccac"), ("a", "ab")]

print(f"{'a':<9} {'b':<9} {'sorted':>8} {'counts':>8}")
print("-" * 38)
for a, b in pairs:
    r1, r2 = by_sorting(a, b), by_count_array(a, b)
    assert r1 == r2, (a, b)
    print(f"{a:<9} {b:<9} {str(r1):>8} {str(r2):>8}")

print()
print("the two agree on every pair — now what each one costs")
print()
print(f"{'length n':>10} {'sort: n log2 n':>16} {'count: 2n':>12} {'ratio':>8}")
print("-" * 50)
for n in (10, 100, 1_000, 100_000):
    sort_cost = n * math.log2(n)
    count_cost = 2 * n
    print(f"{n:>10} {sort_cost:>16,.0f} {count_cost:>12,} {sort_cost / count_cost:>8.1f}x")`,
          output: `a         b           sorted   counts
--------------------------------------
listen    silent        True     True
anagram   nagaram       True     True
rat       car          False    False
aacc      ccac         False    False
a         ab           False    False

the two agree on every pair — now what each one costs

  length n   sort: n log2 n    count: 2n    ratio
--------------------------------------------------
        10               33           20      1.7x
       100              664          200      3.3x
      1000            9,966        2,000      5.0x
    100000        1,660,964      200,000      8.3x`,
          explanation:
            "Note how modest the win is at n = 10 and how it grows — that is the log factor, and it is a fair picture of what removing one is worth. The early `if counts[i] < 0: return False` is worth keeping: it exits the moment `b` has a letter `a` cannot supply, which on random unequal input is almost immediately. The length check first is not an optimisation but a correctness guard, since without it `\"a\"` and `\"aa\"` would pass the count loop.",
        },
      ],
      pitfalls: [
        {
          title: "Sizing the count array to the alphabet you assumed",
          body: "`new int[26]` is right for lowercase English and wrong the moment the input contains a capital, a digit or a space, where `ch - 'a'` goes negative or past the end. If the statement does not promise lowercase letters, either ask, or use `new int[128]` for ASCII and index by the character's own code, which costs nothing extra and cannot be out of range.",
        },
      ],
    },
    {
      id: "canonical-form",
      heading: "Canonical form: making unequal things equal",
      body: [
        "The second move. **A canonical form is a function that maps everything you want to treat as the same to one identical value** — which means you can use it as a hash-map key, and the map does the grouping for you.",
        "\"Group the anagrams together\" is the standard example. Two words belong in the same group when they have the same letters, so any function that ignores the ordering will do: the sorted string, or the tuple of 26 counts. Both are canonical; they differ only in cost.",
        "This generalises much further than strings, and it is worth recognising as a pattern rather than a trick. Grouping points by the line they lie on, shapes by their normalised outline, numbers by their remainder — all the same shape. **Whenever a problem says \"group by\", \"how many distinct\", or \"do any two of these match under some transformation\", you are being asked for a canonical form.**",
      ],
      examples: [
        {
          id: "group-anagrams",
          title: "Two canonical keys, one grouping",
          lang: "python",
          code: `from collections import defaultdict

words = ["eat", "tea", "tan", "ate", "nat", "bat"]


def sorted_key(word):
    return "".join(sorted(word))


def count_key(word):
    counts = [0] * 26
    for ch in word:
        counts[ord(ch) - ord('a')] += 1
    return tuple(counts)


for name, key in [("sorted key", sorted_key), ("count key", count_key)]:
    groups = defaultdict(list)
    for w in words:
        groups[key(w)].append(w)
    print(f"{name}:")
    for k, members in groups.items():
        shown = k if isinstance(k, str) else "".join(
            chr(ord('a') + i) * c for i, c in enumerate(k) if c
        )
        print(f"  {shown:<6} -> {members}")
    print(f"  groups: {len(groups)}")
    print()

print("identical grouping; the key is what differs")
print("  sorted key costs O(k log k) per word and is 3 lines")
print("  count key  costs O(k)       per word and is 5")`,
          output: `sorted key:
  aet    -> ['eat', 'tea', 'ate']
  ant    -> ['tan', 'nat']
  abt    -> ['bat']
  groups: 3

count key:
  aet    -> ['eat', 'tea', 'ate']
  ant    -> ['tan', 'nat']
  abt    -> ['bat']
  groups: 3

identical grouping; the key is what differs
  sorted key costs O(k log k) per word and is 3 lines
  count key  costs O(k)       per word and is 5`,
          explanation:
            "The key must be **hashable and immutable**, which is why the count version returns a `tuple` rather than the list — a list cannot be a dict key. Java has the same requirement for a different reason: an array's `hashCode` is its identity, so `int[]` is useless as a `HashMap` key and the counts must be turned into a `String` or a `List<Integer>` first. Note that the groups come out in first-appearance order, because both `dict` and `defaultdict` preserve insertion order; nothing about the algorithm guarantees the order a judge expects, so sort if the problem asks you to.",
        },
      ],
    },
    {
      id: "slicing",
      heading: "The allocation hiding inside a comparison",
      body: [
        "A string is immutable in both languages, so every operation that appears to modify one actually builds a new one. Module 0 established that. The consequence worth drawing out here is what it does *inside an algorithm*.",
        "`t[i:i+m] == w` in Python and `t.substring(i, i + m).equals(w)` in Java both read as a comparison. Each is really two operations: **allocate and copy m characters, then compare them.** The copy happens first and unconditionally, so it cannot benefit from an early exit — the comparison may fail on the first character, but you paid for all m regardless.",
        "The fix is never exotic. Compare in place with indices, and the copy disappears.",
      ],
      examples: [
        {
          id: "slice-vs-index",
          title: "What the slice costs that the comparison does not",
          lang: "python",
          code: `def find_by_slicing(t, w):
    """Every window is copied into a fresh string before it is compared."""
    copied = 0
    for i in range(len(t) - len(w) + 1):
        copied += len(w)                 # the slice allocates and copies w chars
        if t[i:i + len(w)] == w:
            return i, copied
    return -1, copied


def find_by_indexing(t, w):
    """No allocation: compare in place and stop at the first mismatch."""
    read = 0
    for i in range(len(t) - len(w) + 1):
        j = 0
        while j < len(w) and t[i + j] == w[j]:
            read += 1
            j += 1
        if j < len(w):
            read += 1                    # the character that mismatched
        if j == len(w):
            return i, read
    return -1, read


cases = [
    ("mismatch at once", "abcdefghij" * 500, "zzzzzzzzzz"),
    ("long partial match", "a" * 5000 + "b", "a" * 20 + "b"),
    ("found early", "xyz" * 500, "xyzxyz"),
]

print(f"{'case':<20} {'copied':>10} {'read':>10} {'ratio':>8}")
print("-" * 52)
for name, text, word in cases:
    i1, copied = find_by_slicing(text, word)
    i2, read = find_by_indexing(text, word)
    assert i1 == i2, (name, i1, i2)
    print(f"{name:<20} {copied:>10,} {read:>10,} {copied / read:>7.1f}x")

print()
print("same answers, same O(n*m) worst case — but slicing cannot exit early,")
print("because the copy happens before the comparison does.")`,
          output: `case                     copied       read    ratio
----------------------------------------------------
mismatch at once         49,910      4,991    10.0x
long partial match      104,601    104,601     1.0x
found early                   6          6     1.0x

same answers, same O(n*m) worst case — but slicing cannot exit early,
because the copy happens before the comparison does.`,
          explanation:
            "The table is honest about the limits of the win: **10× when mismatches are immediate, and nothing at all when they are not.** That is the right way to think about it — indexing never loses and sometimes wins large, and the size of the win depends on the data. What matters more is the case this table does not show: when the slice happens inside a loop that already runs n times *and the slice length grows with n*, the copying is O(n) per iteration and you have silently written a quadratic algorithm out of a linear one.",
        },
      ],
      pitfalls: [
        {
          title: "Building a suffix or prefix per iteration",
          body: "`for i in range(n): if s[i:] == something` looks linear and is quadratic — the slice at step i copies n − i characters, and those sum to n²/2. The same is true of `s.substring(i)` in Java. If you find yourself slicing inside a loop, the question to ask is whether the slice length depends on n; if it does, replace it with two indices into the original string.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between the three",
      body: [
        "A short decision procedure for the string problems in this module and the next few.",
        "**Fixed-size count array** — the alphabet is small and known (26 letters, 128 ASCII, 10 digits). O(1) space, fastest constant factor, and it doubles as the state for a sliding window later on.",
        "**Hash map of counts** — the alphabet is large, unknown, or the elements are not characters at all. Same asymptotics, larger constant, no assumptions.",
        "**Sorting** — when you need the order and not just the multiset, or when the canonical form genuinely is the sorted sequence and k is small enough that the log factor does not matter. It is also the shortest to write, which is worth something when you are being watched.",
        "And one thing to say out loud in an interview: **\"the alphabet is 26, so this count array is O(1) space, not O(k)\"**. Interviewers ask about that distinction deliberately, and getting it right signals that you know the difference between a bound that grows with the input and one that does not.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you check whether two strings are anagrams, and what does it cost?",
      answer:
        "Compare lengths first, then count. A 26-slot array indexed by `ch - 'a'` incremented over the first string and decremented over the second, returning false the moment a count goes negative — O(k) time and O(1) space, since the array's size depends on the alphabet rather than the input. Sorting both and comparing is also correct and shorter to write at O(k log k), which is a reasonable answer if you say why you chose it. If the alphabet is not small or the characters are not known to be lowercase letters, swap the array for a hash map and the asymptotics are unchanged.",
    },
    {
      question: "What is a canonical form and where does it show up?",
      answer:
        "A function that maps every item you want to treat as equivalent onto one identical value, so a hash map can do the grouping. Anagrams are the standard case — the sorted string or the tuple of letter counts both work, and they produce identical groupings at O(k log k) and O(k) respectively. The pattern generalises well beyond strings: grouping points by the line through them, or numbers by their remainder, are the same idea. Any problem phrased as \"group by\", \"count distinct\", or \"are any two of these the same under some transformation\" is asking for one.",
    },
    {
      question: "Why can slicing a string inside a loop be a problem?",
      answer:
        "Because a slice or `substring` allocates and copies before anything is compared, so the cost is paid whether or not the comparison would have failed on the first character. Measured over a scan where mismatches are immediate, slicing copies ten times the characters that in-place indexing reads. The serious version is when the slice length grows with n — `s[i:]` inside a loop over i copies n − i characters each time, which sums to n²/2 and turns a linear algorithm quadratic while still looking linear on the page.",
    },
  ],
  takeaways: [
    "Small known alphabet → a fixed count array; the size is O(1), not O(k)",
    "`ch - 'a'` is the constant-time indexing of the previous lesson, applied",
    "Check lengths before counting — it is correctness, not an optimisation",
    "A canonical form maps equivalents to one key so a map can group them",
    "Sorted string and count tuple are both canonical: O(k log k) against O(k)",
    "Keys must be hashable — a tuple in Python, and never an `int[]` in Java",
    "A slice copies before it compares, so it can never exit early",
    "A slice whose length grows with n inside a loop over n is quadratic",
  ],
  status: "available",
};
