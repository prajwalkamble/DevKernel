import type { Lesson } from "@/content/types";

export const booleansNullLesson: Lesson = {
  id: "dsa-io-booleans-null",
  slug: "booleans-null-and-truthiness",
  moduleSlug: "input-output-and-data-types",
  title: "Booleans, Null & the Truthiness Traps",
  summary:
    "What Python treats as false, why that makes `if not values` ambiguous, and the two Java null failures that are not where you think they are.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "List the values Python treats as false, and say why the list is a hazard",
    "Distinguish \"absent\" from \"zero\" in a lookup that can return either",
    "Explain how autoboxing turns a null into a NullPointerException on a line with no method call",
    "Use short-circuit evaluation to guard a check that would otherwise crash",
  ],
  sections: [
    {
      id: "truthiness",
      heading: "Python's falsy values",
      body: [
        "Python lets any value be used as a condition, and defines a specific set that count as false. Everything else is true.",
        "Zero of any numeric type. The empty string. The empty list, tuple, dict and set. `None`. And `False` itself.",
        "This is convenient — `if values:` reads better than `if len(values) > 0:` — and it is a genuine hazard, because **`0` and \"empty\" and \"missing\" are all false and are not the same thing.**",
      ],
      examples: [
        {
          id: "falsy-table",
          title: "Everything that is false",
          lang: "python",
          code: `for value in [0, 1, -1, 0.0, "", "a", "0", [], [0], {}, set(), None, False]:
    print(f"{repr(value):>6}  {bool(value)}")`,
          output: `     0  False
     1  True
    -1  True
   0.0  False
    ''  False
   'a'  True
   '0'  True
    []  False
   [0]  True
    {}  False
 set()  False
  None  False
 False  False`,
          explanation:
            "Two rows deserve attention. `'0'` is a non-empty string and therefore **true**, which catches people reading input — a line containing `0` is truthy until you convert it to an integer. And `[0]` is a non-empty list and true, even though its only element is false. The rule is about the container, not its contents.",
        },
      ],
      pitfalls: [
        {
          title: "`if not count:` when 0 is a legitimate value",
          body: "This is true both when `count` is missing and when it is genuinely zero, and those usually need different handling. When zero is a real possible value, test explicitly: `if count is None:` or `if count == 0:`. This is the most common truthiness bug there is.",
        },
      ],
    },
    {
      id: "absent-vs-zero",
      heading: "Absent against zero",
      body: [
        "The distinction matters most on dictionary lookups, where a missing key and a stored zero look identical through a truthiness test.",
        "`dict.get(key)` returns `None` when absent. `dict.get(key, 0)` returns 0 when absent, which is convenient for counting and destroys the distinction. Choose deliberately.",
      ],
      examples: [
        {
          id: "get-default",
          title: "Three ways to ask, three different answers",
          lang: "python",
          code: `counts = {"a": 0, "b": 2}

print(counts.get("a"), counts.get("z"))
print(counts.get("a", 0), counts.get("z", 0))
print("a" in counts, "z" in counts)

for key in ["a", "z"]:
    if not counts.get(key):
        print(key, "-> falsy, but is it missing or zero?")
    if key not in counts:
        print(key, "-> definitely missing")`,
          output: `0 None
0 0
True False
a -> falsy, but is it missing or zero?
z -> falsy, but is it missing or zero?
z -> definitely missing`,
          explanation:
            "The key `a` is present with value 0 and the key `z` is absent, and the truthiness test cannot tell them apart — it fires for both. `in` is the unambiguous question and it is the one to ask whenever zero is a legitimate stored value. This is exactly the bug that makes a frequency-counting solution report the wrong answer on input containing a zero.",
        },
      ],
    },
    {
      id: "java-booleans",
      heading: "Java: no truthiness at all",
      body: [
        "Java requires a condition to be a `boolean`. `if (count)` does not compile when `count` is an `int`, which removes the entire class of bug above.",
        "In exchange Java has `null`, and null failures are its own category. The classic is calling a method on a null reference. The one that surprises people is **autoboxing**: assigning a null `Integer` to an `int` calls `intValue()` on it, so a line with no visible method call throws.",
      ],
      examples: [
        {
          id: "java-null",
          title: "Two nulls, one of them invisible",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String s = null;
        System.out.println("concatenating null: " + s);

        Map<String, Integer> counts = new HashMap<>();
        counts.put("a", 1);

        try {
            int value = counts.get("missing");
            System.out.println(value);
        } catch (NullPointerException e) {
            System.out.println("unboxing a null Integer threw NullPointerException");
        }

        int safe = counts.getOrDefault("missing", 0);
        System.out.println("getOrDefault: " + safe);
    }
}`,
          output: `concatenating null: null
unboxing a null Integer threw NullPointerException
getOrDefault: 0`,
          explanation:
            "Three behaviours. Concatenating a null into a string does *not* throw — it prints the word `null`, which is why a stray `null` sometimes appears in output instead of crashing. The middle case is the invisible one: `counts.get(\"missing\")` returns a null `Integer`, and assigning it to an `int` unboxes it, which is a method call you did not write. `getOrDefault` is the fix and should be your default for count maps.",
        },
      ],
      pitfalls: [
        {
          title: "`map.get(key) > 0`",
          body: "Throws when the key is absent, for the same unboxing reason — the comparison needs an `int`. Use `map.getOrDefault(key, 0) > 0`, or check `containsKey` first.",
        },
      ],
    },
    {
      id: "short-circuit",
      heading: "Short-circuit evaluation as a guard",
      body: [
        "`&&` stops as soon as it knows the answer is false, and `||` stops as soon as it knows the answer is true. The right-hand side is not evaluated at all.",
        "That is not an optimisation — it is a correctness tool, and it is how you write a check whose second half would crash if the first half were false.",
        "Python's `and` and `or` behave the same way, with one extra property: they return one of the *operands* rather than a boolean, which is what makes `value or default` work as an idiom.",
      ],
      examples: [
        {
          id: "short-circuit",
          title: "Guarding with `and`, defaulting with `or`",
          lang: "python",
          code: `values = []

print(len(values) > 0 and values[0] == 1)

name = None
print(name or "anonymous")
print("" or "empty string is falsy too")
print(0 or "so is zero")

def loud():
    print("  (this ran)")
    return True

print("short circuit:", False and loud())
print("no short circuit:", True and loud())`,
          output: `False
anonymous
empty string is falsy too
so is zero
short circuit: False
  (this ran)
no short circuit: True`,
          explanation:
            "The first line would crash if `and` evaluated both sides — `values[0]` on an empty list is an IndexError — and it does not, because the left side was false. The `loud()` pair proves it directly: the function ran only in the second case. And note `0 or \"so is zero\"`: the `or` default idiom substitutes for zero as well as for None, which is occasionally exactly wrong and worth remembering.",
        },
      ],
      pitfalls: [
        {
          title: "Java's `&` and `|` on booleans",
          body: "They are the non-short-circuiting versions and evaluate both sides always. `if (arr != null & arr.length > 0)` throws a NullPointerException on a null array, because the right side runs regardless. Use `&&` and `||` unless you have a specific reason not to, and you will not.",
        },
      ],
    },
    {
      id: "comparing-to-none",
      heading: "`is` against `==`",
      body: [
        "Python has two notions of sameness. `==` asks whether the values are equal; `is` asks whether they are the *same object* in memory.",
        "For `None`, always use `is`. There is exactly one `None` object, so identity is the right question, and a class can define `==` to do something surprising while identity cannot be overridden.",
        "For everything else, use `==`. Comparing numbers or strings with `is` sometimes appears to work because small integers and short strings are cached and reused — and then stops working at a larger value, which is a genuinely horrible bug to track down. Java has the same trap in a different costume: `Integer` values from −128 to 127 are cached, so `==` on boxed integers works until it does not.",
      ],
      examples: [
        {
          id: "identity",
          title: "The caching that makes `is` look correct",
          lang: "python",
          code: `# Written as literals, both are folded to one object at compile time.
a = 257
b = 257
print("literal 257 :", a == b, a is b)

# Computed at run time, the cache is what decides.
c = int("256")
d = int("256")
print("computed 256:", c == d, c is d)

e = int("257")
f = int("257")
print("computed 257:", e == f, e is f)

x = None
print("None        :", x is None, x == None)`,
          output: `literal 257 : True True
computed 256: True True
computed 257: True False
None        : True True`,
          explanation:
            "Three answers to the same question. CPython caches small integers from −5 to 256, so two separately computed 256s really are one object — and two computed 257s are not. The literals at the top are a *different* mechanism: the compiler folds equal constants in one code object into a single object, so they look cached at any size. That is two accidental behaviours stacked on top of each other, which is exactly why `is` on numbers is unreliable. Use `==` for values and `is` only for `None`. Java's boxed `Integer` cache runs from −128 to 127 and produces the identical surprise with `==`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What values are falsy in Python, and why is that a hazard?",
      answer:
        "Zero of any numeric type, the empty string, empty list, tuple, dict and set, `None`, and `False`. It is a hazard because zero, empty and missing are all false while meaning different things, so `if not count:` fires both when a count is genuinely zero and when the lookup found nothing. When zero is a legitimate value, test explicitly with `is None` or `== 0`, or ask `key in dict` rather than testing the value's truthiness.",
    },
    {
      question: "How can a Java line with no method call throw a NullPointerException?",
      answer:
        "Autoboxing. Assigning an `Integer` to an `int`, or using one in arithmetic or a comparison, calls `intValue()` on it implicitly — so `int value = map.get(key);` throws when the key is absent and `get` returned null. The method call is generated by the compiler and is invisible in the source. `map.getOrDefault(key, 0)` avoids it, and is the right default for any counting map.",
    },
    {
      question: "When should you use `is` instead of `==` in Python?",
      answer:
        "Only for `None`, and by extension for the other singletons like `True` and `False`. `is` tests object identity, and there is exactly one `None`, so it is both correct and immune to a class redefining `==`. For values, always use `==`: identity comparisons on numbers and strings appear to work because small integers and interned strings are cached, and then fail above 256, which is a very unpleasant bug to find.",
    },
  ],
  takeaways: [
    "Python's falsy values: 0, 0.0, '', [], (), {}, set(), None, False — and nothing else",
    "`'0'` is a non-empty string and therefore true; `[0]` is a non-empty list and true",
    "`if not count:` cannot distinguish zero from missing; use `is None`, `== 0`, or `key in dict`",
    "Java has no truthiness — a condition must be a boolean, which removes that whole class of bug",
    "Concatenating null into a Java string prints `null` rather than throwing",
    "Unboxing a null `Integer` into an `int` throws on a line with no visible method call; use `getOrDefault`",
    "`&&` and `||` short-circuit, which is how you guard a check that would otherwise crash",
    "Use `is` only for `None`; small-integer caching makes it look right up to 256 and then fail",
  ],
};
