import type { Lesson } from "@/content/types";

export const stringOperationsLesson: Lesson = {
  id: "dsa-arr-string-ops",
  slug: "the-string-operations-worth-knowing",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "The String Operations Worth Knowing Cold",
  summary:
    "Substring, split, join, search, case and trim — what each costs, the differences between the two languages, and the ones that quietly allocate.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Use the dozen string methods that appear in nearly every solution",
    "State the cost of each, and which of them allocate",
    "Handle the split edge cases that produce empty strings",
    "Close out the module with the array-and-string toolkit in one place",
  ],
  sections: [
    {
      id: "the-dozen",
      heading: "The dozen",
      body: [
        "These cover almost everything. Learn the pairs together, because the two languages differ mostly in naming.",
        "**Length** — `len(s)` / `s.length()`. O(1) in both.",
        "**Character at** — `s[i]` / `s.charAt(i)`. O(1).",
        "**Substring** — `s[a:b]` / `s.substring(a, b)`. O(b − a), and it allocates.",
        "**Search** — `s.find(t)` and `s.index(t)` / `s.indexOf(t)`. O(n × m) in the worst case for the naive implementations both use.",
        "**Contains** — `t in s` / `s.contains(t)`.",
        "**Split** — `s.split(sep)` / `s.split(regex)`. Note Java's takes a *regular expression*, which is a real difference.",
        "**Join** — `sep.join(parts)` / `String.join(sep, parts)`.",
        "**Case** — `s.lower()`, `s.upper()` / `s.toLowerCase()`, `s.toUpperCase()`.",
        "**Trim** — `s.strip()` / `s.trim()` or `s.strip()`.",
        "**Replace** — `s.replace(a, b)` in both, though Java's `replaceAll` takes a regex.",
        "**Starts and ends with** — `s.startswith(t)` / `s.startsWith(t)`.",
        "**Compare** — `==` / `.equals`, and `<` / `.compareTo`.",
      ],
      examples: [
        {
          id: "the-dozen",
          title: "All of them, on one string",
          lang: "python",
          code: `s = "  Hello, World  "

print(repr(s.strip()))
print(s.strip().lower(), "|", s.strip().upper())
print(s.strip()[0:5], "|", s.strip()[7:])
print(s.find("World"), s.find("Nope"))
print("World" in s, s.strip().startswith("Hello"), s.strip().endswith("!"))
print(s.strip().replace("l", "L"))
print(s.strip().split(", "))
print("-".join(["a", "b", "c"]))
print(s.count("l"), len(s), len(s.strip()))`,
          output: `'Hello, World'
hello, world | HELLO, WORLD
Hello | World
9 -1
True True False
HeLLo, WorLd
['Hello', 'World']
a-b-c
3 16 12
`,
          explanation:
            "Note `find` returns −1 for a missing substring while `index` raises — the same not-found convention as the search lesson, with two spellings so you can choose whether absence is exceptional. Java has only `indexOf`, which returns −1. And every method here returns a *new* string; none of them modifies `s`, which still has its surrounding spaces at the end.",
        },
      ],
    },
    {
      id: "split-edges",
      heading: "Split, and its edge cases",
      body: [
        "Split is the operation whose edge cases actually bite, and the two languages disagree on several.",
        "**Consecutive separators produce empty strings.** `\"a,,b\".split(\",\")` gives three parts with an empty middle, in both languages. That is usually what you want for CSV and never what you want for whitespace.",
        "**Splitting on whitespace with no argument is different.** Python's `s.split()` with no separator collapses runs of whitespace *and* drops leading and trailing ones. `s.split(\" \")` does not. That distinction catches people parsing input.",
        "**Java's split takes a regex.** `s.split(\".\")` splits on *any character* and returns nothing useful, because `.` is the regex wildcard. Escaping it as `\"\\\\.\"` is required.",
        "**Trailing empties are dropped in Java** by default. `\"a,b,,\".split(\",\")` gives two elements, not four, unless you pass a negative limit.",
      ],
      examples: [
        {
          id: "split-python",
          title: "Python: with and without an argument",
          lang: "python",
          code: `line = "  3   1  4  "

print(line.split())
print(line.split(" "))
print(len(line.split()), "against", len(line.split(" ")))

print("a,,b".split(","))
print("a,b,,".split(","))
print("".split(","))
print("".split())

print([int(p) for p in line.split()])`,
          output: `['3', '1', '4']
['', '', '3', '', '', '1', '', '4', '', '']
3 against 10
['a', '', 'b']
['a', 'b', '', '']
['']
[]
[3, 1, 4]
`,
          explanation:
            "Ten parts against three, from the same line — `split()` with no argument is what you want for whitespace-separated input, and `split(\" \")` almost never is. Note the last two lines: splitting an empty string on a separator gives one empty element, while splitting it on whitespace gives nothing at all. Both are defensible and they are not the same, which is why an empty input line deserves a test.",
        },
        {
          id: "split-java",
          title: "Java: the regex, and dropped trailing empties",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println(Arrays.toString("a,b,c".split(",")));
        System.out.println(Arrays.toString("a,b,,".split(",")));
        System.out.println(Arrays.toString("a,b,,".split(",", -1)));

        System.out.println(Arrays.toString("a.b.c".split(".")));
        System.out.println(Arrays.toString("a.b.c".split("\\\\.")));

        System.out.println(Arrays.toString("  3   1  4  ".trim().split("\\\\s+")));
    }
}`,
          output: `[a, b, c]
[a, b]
[a, b, , ]
[]
[a, b, c]
[3, 1, 4]`,
          explanation:
            "Three surprises in six lines. Trailing empty strings are dropped unless you pass `-1` as the limit. Splitting on `\".\"` returns an *empty array*, because the regex `.` matches every character and every part is an empty trailing string that then gets dropped. And the whitespace idiom is `trim()` first — otherwise the leading spaces produce an empty first element even with `\\\\s+`.",
        },
      ],
    },
    {
      id: "costs",
      heading: "What allocates",
      body: [
        "Because strings are immutable, **every method that appears to change one actually returns a new one**. That is an allocation and a copy, and in a loop it is the quadratic trap again.",
        "The ones that allocate: `substring`, `replace`, `toLowerCase`, `toUpperCase`, `trim`, `strip`, `concat`, `split` (an array plus every part), `join`.",
        "The ones that do not: `length`, `charAt`, `indexOf`, `contains`, `startsWith`, `equals`, `compareTo`. These read without building anything.",
        "The practical consequence: **prefer the reading operations inside loops.** Comparing `s.charAt(i) == t.charAt(j)` allocates nothing; comparing `s.substring(i, i + k).equals(t)` allocates a new string on every iteration.",
      ],
      examples: [
        {
          id: "allocation",
          title: "The same check, with and without allocating",
          lang: "python",
          code: `def count_occurrences_slicing(text, pattern):
    """Allocates a new string on every position."""
    allocated = 0
    found = 0
    k = len(pattern)
    for i in range(len(text) - k + 1):
        allocated += k
        if text[i:i + k] == pattern:
            found += 1
    return found, allocated


def count_occurrences_indexing(text, pattern):
    """Compares character by character; allocates nothing."""
    found = 0
    k = len(pattern)
    for i in range(len(text) - k + 1):
        if all(text[i + j] == pattern[j] for j in range(k)):
            found += 1
    return found, 0


text = "abababab" * 50
pattern = "abab"

a = count_occurrences_slicing(text, pattern)
b = count_occurrences_indexing(text, pattern)
print("slicing :", a[0], "matches,", a[1], "characters allocated")
print("indexing:", b[0], "matches,", b[1], "characters allocated")
print("built-in:", text.count(pattern), "(non-overlapping, so a different count)")`,
          output: `slicing : 199 matches, 1588 characters allocated
indexing: 199 matches, 0 characters allocated
built-in: 100 (non-overlapping, so a different count)
`,
          explanation:
            "Same answer, 1,588 characters allocated against none. And the third line is a genuine trap worth knowing: `str.count` counts **non-overlapping** occurrences, so it reports 100 where the overlapping scan finds 199. Whenever a built-in disagrees with your loop, check whether it is answering the overlapping or the non-overlapping question.",
        },
      ],
      pitfalls: [
        {
          title: "`s.substring(i, j)` in a loop",
          body: "Each call copies `j - i` characters. Inside a loop over positions that is quadratic even though the loop looks linear — the hidden-nesting problem from the nested-loops lesson. Compare characters by index instead, or use the language's own search, which is implemented in C or native code.",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module",
      body: [
        "Arrays and strings are the two structures every later module is built from, and the toolkit is now complete.",
        "**Arrays.** Contiguous, O(1) indexing, O(n) search and middle insertion, amortised O(1) append when dynamic. Reversal, rotation and compaction all in place, all with two pointers moving at different speeds.",
        "**Strings.** The same, minus writing. Convert to a mutable sequence when you need to write, and never rebuild one per character.",
        "**The habit worth keeping**: before writing any loop over an array or string, ask what each *operation* inside it costs. A linear operation inside a linear loop is quadratic, and it does not announce itself.",
        "Next is number systems and maths, which is the last group of primitives before the module closes with data structures and complexity.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `find` and `index` on a Python string?",
      answer:
        "`find` returns −1 when the substring is absent; `index` raises a `ValueError`. Both return the position of the first occurrence otherwise. The choice is about whether absence is an expected outcome or an error — `find` for the former, `index` for the latter. Java has only `indexOf`, which returns −1, so the −1 convention is what interview problems expect.",
    },
    {
      question: "What is the difference between `s.split()` and `s.split(\" \")` in Python?",
      answer:
        "With no argument, `split` treats any run of whitespace as one separator and ignores leading and trailing whitespace, so `\"  3   1  \"` gives three tokens. With an explicit `\" \"` it splits on each single space, producing empty strings for every consecutive space and for the leading and trailing ones — ten elements for the same input. For whitespace-separated input the no-argument form is nearly always what you want.",
    },
    {
      question: "Which string operations allocate, and why does it matter?",
      answer:
        "Anything that appears to modify: `substring`, `replace`, case conversion, `trim`, `split`, `join`, and concatenation — all return new strings, because strings are immutable. Reading operations do not: `length`, `charAt`, `indexOf`, `contains`, `startsWith`, `equals`. It matters inside loops, where a linear allocating operation makes a linear-looking loop quadratic. Comparing `charAt(i)` against `charAt(j)` costs nothing; comparing substrings copies on every iteration.",
    },
  ],
  takeaways: [
    "A dozen operations cover nearly everything; learn the Java and Python names as pairs",
    "`find` returns −1 and `index` raises; Java has only `indexOf`, returning −1",
    "Python's `split()` with no argument collapses whitespace runs and trims; `split(\" \")` does not",
    "Java's `split` takes a regex, so `split(\".\")` returns nothing useful",
    "Java drops trailing empty parts unless you pass a limit of −1",
    "Everything that seems to modify a string allocates a new one",
    "`substring` in a loop is quadratic; compare by index instead",
    "`str.count` counts non-overlapping occurrences, which is a different question from an overlapping scan",
  ],
};
