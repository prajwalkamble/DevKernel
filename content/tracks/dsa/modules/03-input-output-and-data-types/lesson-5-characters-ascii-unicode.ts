import type { Lesson } from "@/content/types";

export const charactersLesson: Lesson = {
  id: "dsa-io-characters",
  slug: "characters-ascii-and-unicode",
  moduleSlug: "input-output-and-data-types",
  title: "Characters, ASCII & Arithmetic on Letters",
  summary:
    "Why `'c' - 'a'` is 2, how that one fact powers a whole family of string problems, and where Unicode makes the simple version wrong.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Convert between a character and its numeric code in both languages",
    "Use `c - 'a'` to index a 26-element frequency array",
    "Classify characters without memorising code ranges",
    "Say where the assumption of one byte per character breaks",
  ],
  sections: [
    {
      id: "characters-are-numbers",
      heading: "A character is a number",
      body: [
        "Underneath, a character *is* a number. `'a'` is 97, `'b'` is 98, `'A'` is 65, `'0'` is 48. The mapping is ASCII for the first 128 values, and it was designed so that letters and digits are each contiguous and in order.",
        "That contiguity is the whole point, because it means arithmetic on characters is meaningful. `'c' - 'a'` is 2 — the position of `c` in the alphabet, counting from zero. That single expression is the basis of most string counting problems.",
        "Java exposes this directly: `char` is a numeric type, and mixing it with `int` promotes it. Python has no character type, so it uses two functions — `ord` to get the number and `chr` to get the character back.",
      ],
      examples: [
        {
          id: "char-arithmetic-java",
          title: "Java: char is a number that prints as a letter",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        char c = 'a';

        System.out.println((int) c);
        System.out.println((char) 97);
        System.out.println('c' - 'a');
        System.out.println('a' + 1);
        System.out.println((char) ('a' + 1));
        System.out.println('5' - '0');
    }
}`,
          output: `97
a
2
98
b
5`,
          explanation:
            "The two middle lines are the trap. `'a' + 1` is 98, an `int`, because arithmetic on `char` promotes to `int` — and `System.out.println` then prints the number. To get back a character you must cast: `(char) ('a' + 1)` gives `b`. The last line is the standard digit conversion, and it is worth preferring over `Integer.parseInt` for a single character.",
        },
        {
          id: "char-arithmetic-python",
          title: "Python: ord and chr",
          lang: "python",
          code: `print(ord("a"), ord("A"), ord("0"))
print(chr(97), chr(65))
print(ord("c") - ord("a"))
print([chr(ord("a") + i) for i in range(5)])
print(int("5"), ord("5") - ord("0"))`,
          output: `97 65 48
a A
2
['a', 'b', 'c', 'd', 'e']
5 5`,
          explanation:
            "Python is more verbose here because it has no character type — a single character is a string of length one, so you convert explicitly. Note that both `int(\"5\")` and `ord(\"5\") - ord(\"0\")` give 5; the first is clearer and the second generalises to the character-arithmetic patterns below.",
        },
      ],
      pitfalls: [
        {
          title: "`'a'` against `\"a\"` in Java",
          body: "Single quotes make a `char`, double quotes make a `String`, and they are unrelated types. `char c = \"a\";` does not compile. Worse, `\"\" + 'a' + 'b'` gives `ab` while `'a' + 'b'` gives 195, because the second is integer addition — a genuinely confusing pair of behaviours in the same expression.",
        },
      ],
    },
    {
      id: "frequency-array",
      heading: "The 26-element array",
      body: [
        "Here is what character arithmetic is *for*. When the input is guaranteed to be lowercase English letters — which problem statements say constantly — you do not need a hash map to count characters. You need an array of 26 integers, indexed by `c - 'a'`.",
        "It is faster, it uses less memory, and it is the expected answer to \"can you do this without a hash map?\" It also has a nice property a map does not: iterating it gives you the letters in alphabetical order for free.",
      ],
      examples: [
        {
          id: "frequency-array",
          title: "Counting letters without a map",
          lang: "java",
          code: `public class Main {
    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;

        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
            counts[t.charAt(i) - 'a']--;
        }

        for (int count : counts) {
            if (count != 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram"));
        System.out.println(isAnagram("rat", "car"));
        System.out.println(isAnagram("a", "ab"));
    }
}`,
          output: `true
false
false`,
          explanation:
            "One pass, one array of 26 integers, no map. Note the trick of incrementing for one string and decrementing for the other in the same loop — at the end, every count is zero if and only if the strings are anagrams. The length check first is not an optimisation, it is a correctness requirement, and it is also the cheapest possible test.",
        },
        {
          id: "frequency-python",
          title: "The same idea in Python, and when to use Counter instead",
          lang: "python",
          code: `def is_anagram_array(s, t):
    if len(s) != len(t):
        return False
    counts = [0] * 26
    for a, b in zip(s, t):
        counts[ord(a) - ord("a")] += 1
        counts[ord(b) - ord("a")] -= 1
    return all(c == 0 for c in counts)


from collections import Counter


def is_anagram_counter(s, t):
    return Counter(s) == Counter(t)


print(is_anagram_array("anagram", "nagaram"), is_anagram_counter("anagram", "nagaram"))
print(is_anagram_array("rat", "car"), is_anagram_counter("rat", "car"))`,
          output: `True True
False False`,
          explanation:
            "In Python the `Counter` version is one line and is what you should write, unless the interviewer asks for the array — which they sometimes do, precisely to see whether you know why it is possible. The array version is also the one that generalises when the alphabet is not letters: any small fixed set of symbols can be indexed the same way.",
        },
      ],
      pitfalls: [
        {
          title: "Using a 26-element array on mixed-case input",
          body: "`'A' - 'a'` is −32, so an uppercase letter indexes at a negative position and crashes. If the statement does not promise lowercase, either normalise the case first or use 128 elements and index by the raw code.",
        },
      ],
    },
    {
      id: "classification",
      heading: "Classifying without memorising ranges",
      body: [
        "You will need \"is this a digit?\", \"is this a letter?\", \"is this whitespace?\". Both languages have these built in and you should use them rather than comparing against code points, which is unreadable and wrong for anything non-English.",
      ],
      examples: [
        {
          id: "classification",
          title: "The classification methods",
          lang: "python",
          code: `for ch in ["5", "x", "X", " ", "!"]:
    print(repr(ch), ch.isdigit(), ch.isalpha(), ch.isupper(), ch.isspace(), ch.isalnum())

print("Hello".lower(), "Hello".upper())
print("hello world".title())`,
          output: `'5' True False False False True
'x' False True False False True
'X' False True True False True
' ' False False False True False
'!' False False False False False
hello HELLO
Hello World`,
          explanation:
            "Java's equivalents are `Character.isDigit`, `Character.isLetter`, `Character.isUpperCase`, `Character.isWhitespace` and `Character.isLetterOrDigit`, with the same behaviour. Prefer these to `c >= '0' && c <= '9'` — the built-in is clearer, is not wrong on non-ASCII digits, and reads as its own documentation.",
        },
      ],
    },
    {
      id: "unicode",
      heading: "Where the simple model breaks",
      body: [
        "Everything above assumes one character is one unit. For English it is. For the rest of the world it is not, and the exact way it breaks differs between the two languages.",
        "**Python 3 strings are sequences of Unicode code points.** `len(\"héllo\")` is 5, which is what you want. Encoding to bytes is a separate, explicit step.",
        "**Java strings are sequences of UTF-16 code units.** For most characters that is the same thing, but characters outside the Basic Multilingual Plane — emoji, some scripts — take *two* units, so `length()` counts them twice and `charAt` can return half a character.",
        "For this track it does not matter: problem statements say \"lowercase English letters\" almost every time. It is worth knowing so that the day a problem says \"Unicode\" you slow down instead of assuming.",
      ],
      examples: [
        {
          id: "unicode-python",
          title: "Characters against bytes",
          lang: "python",
          code: `s = "héllo"
print(len(s))
print(s.encode("utf-8"))
print(len(s.encode("utf-8")))

emoji = "a😀b"
print(len(emoji), [ord(c) for c in emoji])`,
          output: `5
b'h\\xc3\\xa9llo'
6
3 [97, 128512, 98]`,
          explanation:
            "Five characters, six bytes — the `é` needs two bytes in UTF-8. Python keeps those layers separate, so `len` on a string always counts characters and you only meet bytes when you ask for them. Java's `String.length()` would report 2 for the emoji alone, because it is stored as a surrogate pair, and that is the difference worth remembering.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does `c - 'a'` give a letter's position in the alphabet?",
      answer:
        "Because ASCII assigns the lowercase letters consecutive codes starting at 97, so subtracting the code of `'a'` maps `'a'` to 0, `'b'` to 1 and so on. That gives a direct index into a 26-element array, which is the standard way to count letters without a hash map — faster, smaller, and it yields the letters in alphabetical order when you iterate it. The same trick gives digits with `c - '0'`.",
    },
    {
      question: "How would you check whether two strings are anagrams without a hash map?",
      answer:
        "Compare lengths first — different lengths cannot be anagrams and it is the cheapest possible check. Then make an `int[26]`, increment at `s.charAt(i) - 'a'` and decrement at `t.charAt(i) - 'a'` in the same pass, and confirm every count is zero at the end. That is O(n) time and O(1) space, since the array size does not depend on the input. It assumes lowercase English letters, which the statement usually promises — and if it does not, that is a question worth asking.",
    },
    {
      question: "What is the difference between `String.length()` in Java and `len()` in Python?",
      answer:
        "Python 3 strings are sequences of Unicode code points, so `len` counts characters as a human would. Java strings are sequences of UTF-16 code units, so characters outside the Basic Multilingual Plane — emoji and some scripts — occupy two units and are counted twice, and `charAt` can return one half of a surrogate pair. For English input the two agree; the distinction matters the moment a problem genuinely involves Unicode.",
    },
  ],
  takeaways: [
    "A character is a number: `'a'` is 97, `'A'` is 65, `'0'` is 48, and each run is contiguous",
    "`c - 'a'` is a letter's alphabet position; `c - '0'` converts a digit character",
    "In Java, `'a' + 1` is an `int` — cast back with `(char)` to get a letter",
    "Java's `'a'` and `\"a\"` are different types; Python has no character type at all",
    "An `int[26]` indexed by `c - 'a'` counts letters faster than a map and iterates in alphabetical order",
    "Uppercase input gives a negative index into that array and crashes",
    "Use `isDigit`/`isalpha`-style helpers rather than comparing code points by hand",
    "Python's `len` counts code points; Java's `length()` counts UTF-16 units and double-counts emoji",
  ],
};
