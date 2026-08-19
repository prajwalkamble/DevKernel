import type { Lesson } from "@/content/types";

export const comparisonEqualityLesson: Lesson = {
  id: "dsa-ops-comparison",
  slug: "comparison-and-equality",
  moduleSlug: "operators-and-expressions",
  title: "Comparison & Equality",
  summary:
    "Why `==` on two Java strings is a bug you can get away with for months, what `compareTo` returns, and the chained comparison Python has and Java does not.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say when `==` compares values and when it compares references",
    "Use `equals` and `compareTo` correctly, including their contracts",
    "Compare strings and collections for content in both languages",
    "Use Python's chained comparisons, and know Java has no equivalent",
  ],
  sections: [
    {
      id: "relational",
      heading: "The relational operators",
      body: [
        "`<`, `<=`, `>`, `>=` compare magnitudes and return a boolean. On numbers they behave exactly as you expect in both languages, and there is nothing to learn.",
        "The interesting part is `==`, because what it means depends on what you give it.",
      ],
    },
    {
      id: "reference-vs-value",
      heading: "The Java trap: `==` on objects",
      body: [
        "In Java, `==` compares **primitives by value and objects by reference**. Two `int`s with the same number are equal; two `String` objects with the same characters are equal only if they are literally the same object in memory.",
        "This is the bug that hides, because Java *interns* string literals: two identical literals in your source refer to one shared object, so `==` appears to work. The moment a string arrives from input, or is built by concatenation, it is a different object and `==` becomes false — with identical-looking text.",
      ],
      examples: [
        {
          id: "string-equality",
          title: "The same text, two objects",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        String a = "hi";
        String b = "hi";
        String c = new String("hi");
        String d = "h" + getI();

        System.out.println("a == b     : " + (a == b));
        System.out.println("a == c     : " + (a == c));
        System.out.println("a == d     : " + (a == d));
        System.out.println("a.equals(c): " + a.equals(c));
        System.out.println("a.equals(d): " + a.equals(d));
    }

    static String getI() {
        return "i";
    }
}`,
          output: `a == b     : true
a == c     : false
a == d     : false
a.equals(c): true
a.equals(d): true`,
          explanation:
            "Four strings, all reading `hi`. The first two are the same interned literal so `==` is true; the third is explicitly a new object and the fourth is built at run time, and both are false. Every one of them is `equals`. The lesson is not to remember which case is which — it is to never use `==` on objects at all.",
        },
      ],
      pitfalls: [
        {
          title: "`==` on boxed `Integer`",
          body: "Java caches boxed integers from −128 to 127, so `Integer a = 127, b = 127; a == b` is true and the same code with 128 is false. This is the same interning trap in a form that is much harder to spot, because the values look like plain numbers. Use `.equals()`, or unbox to `int` before comparing.",
        },
      ],
    },
    {
      id: "equals-and-compareto",
      heading: "`equals` and `compareTo`",
      body: [
        "`equals` answers *are these the same value?* and returns a boolean.",
        "`compareTo` answers *which comes first?* and returns an `int`: **negative if the receiver is smaller, zero if equal, positive if larger**. The exact magnitude is unspecified and you should never depend on it — only the sign is meaningful.",
        "The two carry a contract that matters when you write them yourself: `a.equals(b)` must be true exactly when `a.compareTo(b) == 0`, `equals` must agree with `hashCode`, and both must be symmetric and transitive. Violating any of those breaks sorting and hash maps in ways that are extremely hard to debug.",
      ],
      examples: [
        {
          id: "compareto",
          title: "What compareTo actually returns",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("abc vs abd : " + "abc".compareTo("abd"));
        System.out.println("abd vs abc : " + "abd".compareTo("abc"));
        System.out.println("abc vs abc : " + "abc".compareTo("abc"));
        System.out.println("abc vs ab  : " + "abc".compareTo("ab"));
        System.out.println("Integer    : " + Integer.compare(3, 7));

        System.out.println(Arrays.equals(new int[] { 1, 2 }, new int[] { 1, 2 }));
        System.out.println(List.of(1, 2).equals(List.of(1, 2)));
    }
}`,
          output: `abc vs abd : -1
abd vs abc : 1
abc vs abc : 0
abc vs ab  : 1
Integer    : -1
true
true`,
          explanation:
            "Strings compare lexicographically: at the first differing position, `c` is before `d` so the answer is negative. When one string is a prefix of the other, the shorter one comes first — hence `abc` against `ab` is positive. The last two lines are the ones people forget: `==` on arrays compares references, so `Arrays.equals` is required, while `List.equals` compares contents already.",
        },
      ],
      pitfalls: [
        {
          title: "`array1 == array2`",
          body: "Always false for two distinct arrays, however identical their contents, because an array is an object. Use `Arrays.equals` for one dimension and `Arrays.deepEquals` for nested arrays. This catches people constantly when comparing an answer to an expected value in a test.",
        },
      ],
    },
    {
      id: "python-equality",
      heading: "Python: `==` compares values",
      body: [
        "Python's `==` compares contents for every built-in type, so the Java trap does not exist. `\"hi\" == \"hi\"` is true whatever produced the strings, and `[1, 2] == [1, 2]` is true for two separately built lists.",
        "The corresponding Python trap is the opposite one — using `is` when you meant `==`, which the previous module covered. The short version: `is` only for `None`.",
      ],
      examples: [
        {
          id: "python-equality",
          title: "Content comparison, all the way down",
          lang: "python",
          code: `a = "hi"
b = "".join(["h", "i"])
print(a == b, a is b)

print([1, 2] == [1, 2])
print({"x": 1} == {"x": 1})
print({1, 2} == {2, 1})
print((1, 2) == (1, 2))

print([1, 2] < [1, 3])
print("apple" < "banana")
print((1, "b") < (1, "c"))`,
          output: `True False
True
True
True
True
True
True
True`,
          explanation:
            "The last three lines are the useful discovery: `<` works on lists, strings and tuples, comparing element by element from the left. That is why a tuple makes such a good sort key — the ordering you want is already defined. Note the set comparison ignores order, because a set has none.",
        },
      ],
    },
    {
      id: "chained",
      heading: "Chained comparisons",
      body: [
        "Python allows `a < b < c`, and it means what mathematics means: `a < b and b < c`, with `b` evaluated once.",
        "Java does not have this. `a < b < c` does not compile there, because `a < b` is a boolean and a boolean cannot be compared with `<` to a number — which is a case where Java's strictness saves you from a bug that would be silent in some other languages.",
        "The chained form is genuinely useful for bounds checks, and it is the idiomatic way to write them in Python.",
      ],
      examples: [
        {
          id: "chaining",
          title: "Bounds checks, chained",
          lang: "python",
          code: `rows, cols = 3, 4
r, c = 2, 5

print(0 <= r < rows and 0 <= c < cols)
print(0 <= r < rows)
print(1 < 2 < 3)
print(1 < 2 > 3)

def side_effect():
    print("  (evaluated once)")
    return 2

print(1 < side_effect() < 3)`,
          output: `False
True
True
False
  (evaluated once)
True`,
          explanation:
            "`0 <= r < rows and 0 <= c < cols` is the standard grid bounds check and reads exactly like its mathematical statement — this is the single most common use of chaining. The last block proves the middle expression is evaluated only once, which matters when it is a function call, and is the reason chaining is not merely shorthand for writing the comparison twice.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why should you never compare Java strings with `==`?",
      answer:
        "Because `==` on objects compares references, not contents. It appears to work because the compiler interns string literals, so two identical literals in the source are the same object — but a string read from input or built by concatenation is a different object, and `==` becomes false for identical text. Use `.equals()`. The same trap applies to boxed `Integer` values, which are cached from −128 to 127 and so compare equal with `==` right up until 128.",
    },
    {
      question: "What does `compareTo` return?",
      answer:
        "A negative `int` if the receiver sorts before the argument, zero if they are equal, and a positive `int` if it sorts after. Only the sign is specified — the magnitude is an implementation detail and code that relies on it, such as expecting exactly −1, is wrong. The contract also requires that `compareTo` returning zero agrees with `equals`, and that `equals` agrees with `hashCode`; breaking either produces sorting and hash-map bugs that are very hard to trace.",
    },
    {
      question: "How do you compare two arrays for equality in Java?",
      answer:
        "`Arrays.equals(a, b)` for one dimension, `Arrays.deepEquals(a, b)` for nested arrays. `a == b` compares references and is false for any two distinct arrays regardless of contents, and `a.equals(b)` is no better because arrays do not override `equals`. Lists do compare by content, so `List.of(1, 2).equals(List.of(1, 2))` is true — which is part of why returning a `List` is often friendlier than returning an array.",
    },
  ],
  takeaways: [
    "Java's `==` compares primitives by value and objects by reference",
    "String literals are interned, so `==` on strings works until the string comes from input",
    "Boxed `Integer` is cached from −128 to 127 — the same trap, harder to see",
    "`equals` answers same-value; `compareTo` answers which-comes-first, and only its sign is meaningful",
    "`==` on arrays compares references; use `Arrays.equals` or `Arrays.deepEquals`",
    "Python's `==` compares contents for every built-in type, so the trap does not exist there",
    "Python's `<` works on lists, strings and tuples element by element — which is why tuples make good sort keys",
    "`0 <= r < rows` chains in Python, evaluates the middle once, and does not exist in Java",
  ],
};
