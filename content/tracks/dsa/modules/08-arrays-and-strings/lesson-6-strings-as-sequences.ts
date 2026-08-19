import type { Lesson } from "@/content/types";

export const stringsAsSequencesLesson: Lesson = {
  id: "dsa-arr-strings",
  slug: "strings-as-sequences",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Strings as Sequences of Characters",
  summary:
    "A string is an array you cannot write to — what that buys, what it costs, and the char-array conversion that gets the writing back.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Read characters out of a string by index in both languages",
    "Explain what immutability buys and what it prevents",
    "Convert to a mutable character sequence and back",
    "Apply the array in-place techniques to a string",
  ],
  sections: [
    {
      id: "an-array-you-cannot-write",
      heading: "An array you cannot write to",
      body: [
        "A string is a sequence of characters stored contiguously, indexed from 0, with a length. Everything from the indexing lesson applies: `s[0]` is the first character, `s[n - 1]` the last, and `s[n]` is out of range.",
        "The one difference is that you cannot assign to a position. `s[0] = 'x'` is an error in Python and does not compile in Java, because strings are **immutable** — a decision made deliberately and worth understanding rather than working around.",
        "What immutability buys: strings can be shared freely with no defensive copying, their hash can be computed once and cached (which makes them excellent map keys), and they are safe across threads with no synchronisation.",
        "What it costs: every modification allocates a new string, which is the quadratic trap from Module 2.",
      ],
      examples: [
        {
          id: "reading",
          title: "Reading is identical to an array; writing is not",
          lang: "python",
          code: `s = "hello"

print(s[0], s[4], s[-1], len(s))
print(s[1:4], s[::-1])

for i, ch in enumerate(s):
    print(i, ch, end="   ")
print()

try:
    s[0] = "H"
except TypeError as e:
    print("assignment:", e)

print("building a new one instead:", "H" + s[1:])
print("the original is untouched :", s)`,
          output: `h o o 5
ell olleh
0 h   1 e   2 l   3 l   4 o
assignment: 'str' object does not support item assignment
building a new one instead: Hello
the original is untouched : hello`,
          explanation:
            "Every read operation works exactly as it would on a list. The single assignment fails, and the workaround is to build a new string from slices — which is fine for one change and quadratic in a loop. Note the original is unchanged afterwards, which is the point of immutability rather than a side effect of it.",
        },
      ],
      pitfalls: [
        {
          title: "Java's `charAt` against Python's indexing",
          body: "Java has no `s[0]`; it is `s.charAt(0)`, and it returns a `char` rather than a one-character String. That distinction matters — `s.charAt(0) == 'h'` compares chars and works, while comparing against `\"h\"` does not compile. Python has no char type, so `s[0]` is a string of length one and `==` on it is the ordinary string comparison.",
        },
      ],
    },
    {
      id: "char-arrays",
      heading: "Getting the writing back",
      body: [
        "When a problem genuinely needs in-place character work — reversing, sorting the letters, partitioning — the answer is to convert to a mutable sequence, do the work, and convert back.",
        "**Java:** `s.toCharArray()` gives a `char[]` you can write to, and `new String(chars)` converts back. Both are O(n).",
        "**Python:** `list(s)` gives a list of one-character strings, and `\"\".join(chars)` converts back. Also O(n).",
        "Once converted, every technique from the in-place lesson applies unchanged — two pointers, read-and-write, the three-reversal rotation.",
      ],
      examples: [
        {
          id: "char-array",
          title: "Two pointers on a string",
          lang: "python",
          code: `def reverse_string(s):
    chars = list(s)
    lo, hi = 0, len(chars) - 1
    while lo < hi:
        chars[lo], chars[hi] = chars[hi], chars[lo]
        lo += 1
        hi -= 1
    return "".join(chars)


def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    lo, hi = 0, len(cleaned) - 1
    while lo < hi:
        if cleaned[lo] != cleaned[hi]:
            return False
        lo += 1
        hi -= 1
    return True


print(reverse_string("hello"))
print(reverse_string(""))

for text in ["racecar", "A man, a plan, a canal: Panama", "hello", ""]:
    print(f"{text!r:<34} palindrome: {is_palindrome(text)}")`,
          output: `olleh

'racecar'                          palindrome: True
'A man, a plan, a canal: Panama'   palindrome: True
'hello'                            palindrome: False
''                                 palindrome: True`,
          explanation:
            "The palindrome check is the same two-pointer loop as array reversal, comparing rather than swapping — which is why the array lesson comes first. The empty string is a palindrome by the loop's own logic, with no special case, because `lo < hi` is false immediately. Note `reverse_string` is a demonstration; in real Python you would write `s[::-1]`.",
        },
      ],
      pitfalls: [
        {
          title: "Reversing a string with two pointers when the language has a slice",
          body: "`s[::-1]` in Python and `new StringBuilder(s).reverse().toString()` in Java both do this in one line. Write the two-pointer version when a problem asks you to do it in place on a `char[]` — which LeetCode's Reverse String does explicitly — and use the built-in otherwise.",
        },
      ],
    },
    {
      id: "comparison",
      heading: "Comparing strings",
      body: [
        "Two operations, and confusing them is the trap from the comparison lesson.",
        "**Equality.** `equals` in Java, `==` in Python. Java's `==` compares references and appears to work on literals because of interning, then fails on a string built at run time.",
        "**Ordering.** `compareTo` in Java, `<` in Python. Both compare **lexicographically**: character by character from the left, and if one is a prefix of the other, the shorter sorts first.",
        "The property worth remembering: ordering is by character *code*, so all uppercase letters sort before all lowercase ones. `\"Z\" < \"a\"` is true, because 90 is less than 97 — which surprises people sorting names.",
      ],
      examples: [
        {
          id: "comparison",
          title: "Lexicographic order, including the case surprise",
          lang: "python",
          code: `print("abc" == "abc", "abc" == "abd")

print("abc" < "abd")
print("abc" < "ab")
print("ab" < "abc")

print("Z" < "a", ord("Z"), ord("a"))

names = ["banana", "Apple", "cherry", "Banana"]
print("default sort:", sorted(names))
print("case-folded :", sorted(names, key=str.lower))`,
          output: `True False
True
False
True
True 90 97
default sort: ['Apple', 'Banana', 'banana', 'cherry']
case-folded : ['Apple', 'banana', 'Banana', 'cherry']`,
          explanation:
            "The default sort puts every capitalised word before every lowercase one, which is almost never what a human wants — `Apple`, `Banana`, then `banana`, then `cherry`. Sorting with `key=str.lower` gives the expected order, and note that `banana` and `Banana` then tie and keep their original relative order, which is the stability property from the sorting lesson.",
        },
      ],
    },
    {
      id: "strings-as-keys",
      heading: "Why strings make good map keys",
      body: [
        "Immutability pays off directly here. A hash map key must have a hash that never changes while the key is in the map — otherwise the entry becomes unfindable, because it is looked for in the wrong bucket.",
        "Because a string cannot change, its hash can be computed once and **cached**, which makes repeated lookups cheap. Java's `String` does exactly this.",
        "The counterexample is instructive: a mutable list cannot be a dict key in Python at all, and using a mutable object as a `HashMap` key in Java is legal and dangerous — mutate it after inserting, and the entry is effectively lost.",
      ],
      examples: [
        {
          id: "keys",
          title: "What happens when a key can change",
          lang: "python",
          code: `counts = {"apple": 3, "pear": 1}
print(counts["apple"])

try:
    broken = {[1, 2]: "value"}
except TypeError as e:
    print("list as a key:", e)

print("tuple as a key:", {(1, 2): "value"}[(1, 2)])

# Anagram grouping relies on a string key built from sorted characters.
words = ["eat", "tea", "tan", "ate", "nat"]
groups = {}
for word in words:
    key = "".join(sorted(word))
    groups.setdefault(key, []).append(word)
print(groups)`,
          output: `3
list as a key: unhashable type: 'list'
tuple as a key: value
{'aet': ['eat', 'tea', 'ate'], 'ant': ['tan', 'nat']}
`,
          explanation:
            "Python refuses a list as a key outright, and accepts a tuple because tuples are immutable. The last block is the anagram-grouping idiom and it is worth recognising now: **build a canonical form and use it as a key**. Sorting each word's characters makes all its anagrams produce the same key, which turns the whole problem into one pass over a dict.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why are strings immutable?",
      answer:
        "Three benefits. They can be shared freely without defensive copying, since no holder can change one out from under another. Their hash can be computed once and cached, which makes them efficient and safe as hash-map keys — a key whose hash changes while it is in the map becomes unfindable. And they are safe across threads with no synchronisation. The cost is that every modification allocates a new string, which is why building one in a loop is quadratic and needs a `StringBuilder`.",
    },
    {
      question: "How do you modify a string in place?",
      answer:
        "You cannot — you convert to a mutable sequence, work there, and convert back. `s.toCharArray()` and `new String(chars)` in Java; `list(s)` and `\"\".join(chars)` in Python. Both conversions are O(n). Once converted, every array technique applies unchanged: two pointers for reversal or palindrome checking, read-and-write pointers for compaction, three reversals for rotation.",
    },
    {
      question: "How do strings compare, and what surprises people?",
      answer:
        "Lexicographically — character by character from the left, with the shorter string first when one is a prefix of the other. The surprise is that comparison is by character code, so every uppercase letter sorts before every lowercase one: `\"Z\" < \"a\"` is true because 90 is below 97. Sorting a list of names therefore puts all the capitalised ones first, which is almost never intended; the fix is a case-folding sort key.",
    },
  ],
  takeaways: [
    "A string is an array you can read by index and cannot write to",
    "Java uses `s.charAt(0)` returning a `char`; Python uses `s[0]` returning a one-character string",
    "Immutability buys free sharing, a cached hash, and thread safety; it costs an allocation per change",
    "Convert with `toCharArray`/`new String` or `list`/`join`, both O(n), then use the array techniques",
    "The palindrome check is the reversal loop comparing instead of swapping",
    "Compare with `equals` in Java, `==` in Python; ordering is lexicographic in both",
    "All uppercase sorts before all lowercase — `\"Z\" < \"a\"` is true",
    "Build a canonical form as a map key: sorted characters group anagrams in one pass",
  ],
};
