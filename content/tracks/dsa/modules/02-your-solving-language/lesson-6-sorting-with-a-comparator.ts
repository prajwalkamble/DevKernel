import type { Lesson } from "@/content/types";

export const sortingComparatorLesson: Lesson = {
  id: "dsa-lang-sorting",
  slug: "sorting-with-a-comparator",
  moduleSlug: "your-solving-language",
  title: "Sorting by Something Other Than the Value",
  summary:
    "Sort keys, multi-level tie-breaking, descending order done safely — and the stability guarantee that makes half of these tricks work.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Sort by a derived key in both languages",
    "Break ties on a second field, including in the opposite direction",
    "Explain what stability is and when you are relying on it",
    "Avoid the two comparator mistakes that produce wrong or crashing sorts",
  ],
  sections: [
    {
      id: "sort-key",
      heading: "Sorting by a key you compute",
      body: [
        "Sorting values by their natural order is one call in both languages and needs no lesson. The useful case is sorting by *something derived from* the value: by length, by the second field, by absolute value, by frequency.",
        "Python does this with `key=`, a function applied once per element to produce the thing to compare. Java does it with a `Comparator`, most readably built with `Comparator.comparing`.",
        "The `key=` approach has a performance property worth knowing: the key function runs once per element, not once per comparison. Sorting n items involves about n log n comparisons but only n key computations, so an expensive key is much cheaper than it looks.",
      ],
      examples: [
        {
          id: "python-key",
          title: "Python: sorted with a key",
          lang: "python",
          code: `words = ["banana", "kiwi", "apple", "fig"]

print(sorted(words))
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))
print(sorted(words, key=lambda w: w[-1]))

nums = [3, -1, 2, -4]
print(sorted(nums, key=abs))

values = [3, 1, 2]
values.sort()
print(values)`,
          output: `['apple', 'banana', 'fig', 'kiwi']
['fig', 'kiwi', 'apple', 'banana']
['banana', 'apple', 'kiwi', 'fig']
['banana', 'apple', 'fig', 'kiwi']
[-1, 2, 3, -4]
[1, 2, 3]`,
          explanation:
            "`sorted` returns a new list; `.sort()` sorts in place and returns `None` — assigning the result of `.sort()` is a common bug that leaves you holding `None`. Note the fourth line sorts by last letter, and `banana` and `apple` both end in `a`: they stay in their original relative order, which is stability and is the subject of a later section here.",
        },
        {
          id: "java-comparator",
          title: "Java: the same sorts",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> words = new ArrayList<>(List.of("banana", "kiwi", "apple", "fig"));

        Collections.sort(words);
        System.out.println(words);

        words.sort(Comparator.comparingInt(String::length));
        System.out.println(words);

        words.sort(Comparator.comparingInt(String::length).reversed());
        System.out.println(words);

        int[] primitives = { 3, 1, 2 };
        Arrays.sort(primitives);
        System.out.println(Arrays.toString(primitives));

        Integer[] boxed = { 3, 1, 2 };
        Arrays.sort(boxed, Comparator.reverseOrder());
        System.out.println(Arrays.toString(boxed));
    }
}`,
          output: `[apple, banana, fig, kiwi]
[fig, kiwi, apple, banana]
[banana, apple, kiwi, fig]
[1, 2, 3]
[3, 2, 1]`,
          explanation:
            "The last two lines are a Java wrinkle that catches everybody. `Arrays.sort(int[])` takes no comparator at all — primitives cannot be compared by an object — so there is no way to sort an `int[]` descending directly. You either sort ascending and reverse it yourself, or box to `Integer[]` and pass `Comparator.reverseOrder()`. This is worth remembering before you need it under time pressure.",
        },
      ],
      pitfalls: [
        {
          title: "`values = values.sort()` in Python",
          body: "`list.sort()` sorts in place and returns `None`, so this replaces your list with `None`. Use `values.sort()` on its own line, or `values = sorted(values)`. The same applies to `reverse()` against `reversed()`.",
        },
      ],
    },
    {
      id: "tie-breaking",
      heading: "Breaking ties on a second field",
      body: [
        "\"Sort by count descending, and alphabetically among equal counts\" is one of the most common requirements in the whole track — it is what every top-k-frequent problem asks for.",
        "Python's idiom is to return a **tuple** from the key function. Tuples compare element by element, so `(a, b)` sorts by `a` first and uses `b` only for ties. This is the single most useful Python sorting trick there is.",
        "Java chains with `thenComparing`, which reads almost like the English requirement.",
      ],
      examples: [
        {
          id: "python-tuple-key",
          title: "Python: a tuple key, with one field reversed",
          lang: "python",
          code: `people = [("bob", 30), ("amy", 25), ("cal", 30)]

print(sorted(people, key=lambda p: (p[1], p[0])))
print(sorted(people, key=lambda p: (-p[1], p[0])))

words = ["banana", "kiwi", "apple", "fig"]
print(sorted(words, key=lambda w: (len(w), w)))`,
          output: `[('amy', 25), ('bob', 30), ('cal', 30)]
[('bob', 30), ('cal', 30), ('amy', 25)]
['fig', 'kiwi', 'apple', 'banana']`,
          explanation:
            "The second line is the pattern to memorise. `reverse=True` would flip *both* fields, giving names in descending order too — which is not what was asked. Negating the numeric field inside the tuple reverses that field alone, leaving names ascending. It only works on numbers, which is why the trick is stated as negate rather than as reverse.",
        },
        {
          id: "java-thencomparing",
          title: "Java: chained comparators",
          lang: "java",
          code: `import java.util.*;

public class Main {
    record Person(String name, int age) {}

    public static void main(String[] args) {
        List<Person> people = new ArrayList<>(List.of(
                new Person("bob", 30),
                new Person("amy", 25),
                new Person("cal", 30)));

        people.sort(Comparator.comparingInt(Person::age).thenComparing(Person::name));
        System.out.println(people);

        people.sort(Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name));
        System.out.println(people);
    }
}`,
          output: `[Person[name=amy, age=25], Person[name=bob, age=30], Person[name=cal, age=30]]
[Person[name=bob, age=30], Person[name=cal, age=30], Person[name=amy, age=25]]`,
          explanation:
            "Read the second sort left to right: by age, reversed, then by name. `reversed()` applies to everything chained *before* it and not after, which is exactly what you want here — and is worth checking whenever a chain does not do what you expected, because putting `.reversed()` at the end of the whole chain would flip the names too.",
        },
      ],
    },
    {
      id: "stability",
      heading: "Stability, and what it buys you",
      body: [
        "A sort is **stable** if elements that compare equal keep their original relative order. Both `list.sort` in Python and `Collections.sort` in Java are stable, and it is a documented guarantee rather than an accident.",
        "This is more useful than it sounds, because it lets you sort by several criteria without writing a compound comparator at all: **sort by the least significant field first, then by the most significant**. The later sort preserves the earlier ordering among ties.",
        "That is worth having in your pocket for the moment a problem adds a third tie-break and your tuple key is becoming unreadable.",
      ],
      examples: [
        {
          id: "stability-demo",
          title: "Two passes, no compound key",
          lang: "python",
          code: `people = [("bob", 30), ("amy", 25), ("cal", 30), ("dot", 25)]

# Sort by the LESS significant field first...
by_name = sorted(people, key=lambda p: p[0])
# ...then by the more significant one. Ties keep the name order.
by_age_then_name = sorted(by_name, key=lambda p: p[1])

print(by_name)
print(by_age_then_name)

# The same thing in one pass, for comparison.
print(sorted(people, key=lambda p: (p[1], p[0])))`,
          output: `[('amy', 25), ('bob', 30), ('cal', 30), ('dot', 25)]
[('amy', 25), ('dot', 25), ('bob', 30), ('cal', 30)]
[('amy', 25), ('dot', 25), ('bob', 30), ('cal', 30)]`,
          explanation:
            "The last two lines are identical, produced two different ways. The two-pass version works only because the second sort is stable — with an unstable sort, the name ordering established by the first pass could be destroyed by the second. Java's `Arrays.sort` on *primitives* is not stable, incidentally, because it uses a dual-pivot quicksort; it does not matter for primitives, since equal ints are indistinguishable.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming Java's primitive sort is stable",
          body: "`Arrays.sort(int[])` uses dual-pivot quicksort and is not stable; `Arrays.sort(Object[])` uses TimSort and is. It never matters for primitives — two equal `int`s are the same value — but it matters the moment you sort an array of objects by one field and rely on a previous ordering.",
        },
      ],
    },
    {
      id: "comparator-mistakes",
      heading: "The two comparator mistakes",
      body: [
        "**Subtracting to compare.** `(a, b) -> a - b` looks neat and overflows: if `a` is 2,000,000,000 and `b` is −2,000,000,000, the subtraction wraps to a negative number and the comparator claims the larger value is smaller. Use `Integer.compare(a, b)`, which cannot overflow.",
        "**An inconsistent comparator.** If your comparison is not a valid ordering — if it says `a < b` and `b < a`, or is not transitive — Java's TimSort detects it and throws `IllegalArgumentException: Comparison method violates its general contract!`. That message is famously confusing and it always means the same thing: your comparator is not a consistent ordering, usually because a tie-break case returns a nonzero value in both directions.",
        "Python protects you from both by using `key=` rather than a comparison function. That is the deeper reason to prefer keys: a key cannot be inconsistent, because it reduces the problem to comparing values that already have a valid order.",
      ],
      examples: [
        {
          id: "subtraction-overflow",
          title: "Why subtracting is wrong",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 2000000000;
        int b = -2000000000;

        System.out.println("a - b        : " + (a - b));
        System.out.println("says a < b?  : " + ((a - b) < 0));
        System.out.println("compare(a, b): " + Integer.compare(a, b));
    }
}`,
          output: `a - b        : -294967296
says a < b?  : true
compare(a, b): 1`,
          explanation:
            "This is the bug in full. The true difference is 4,000,000,000, which does not fit in an `int`, so it wraps to −294,967,296 — a *negative* number. A comparator returning a negative value means \"the first argument is smaller\", so this one confidently reports that 2,000,000,000 is less than −2,000,000,000. `Integer.compare` gets it right. And note how narrow the failure is: it only happens when the two values are far apart, so the comparator passes every casual test and inverts exactly on the adversarial input a judge will hand you.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you sort by one field descending and another ascending?",
      answer:
        "In Python, return a tuple from the key with the descending field negated: `key=lambda p: (-p.count, p.name)`. Using `reverse=True` would flip both fields, which is not what was asked. In Java, chain comparators and place `reversed()` carefully: `Comparator.comparingInt(P::count).reversed().thenComparing(P::name)` — `reversed()` applies to everything chained before it, so putting it at the end of the whole chain would reverse the names too.",
    },
    {
      question: "What does it mean for a sort to be stable, and when do you rely on it?",
      answer:
        "Equal elements keep their original relative order. You rely on it whenever you sort in several passes: sort by the least significant key first, then the most significant, and the earlier ordering survives among ties — which lets you avoid writing a compound comparator. Python's sort and Java's `Collections.sort` and `Arrays.sort(Object[])` are stable; `Arrays.sort(int[])` is not, because it is a quicksort, though for primitives that is unobservable.",
    },
    {
      question: "Why is `(a, b) -> a - b` a bad comparator?",
      answer:
        "It overflows. With `a` near `Integer.MAX_VALUE` and `b` negative, the subtraction wraps and returns a value with the wrong sign, so the comparator reports the ordering backwards — and because it is only wrong for extreme pairs, it passes casual testing and fails on the adversarial input. `Integer.compare(a, b)` is the correct form. If a comparator is inconsistent in this way, TimSort may also throw \"Comparison method violates its general contract\".",
    },
  ],
  takeaways: [
    "Python sorts by a derived key with `key=`; the key runs once per element, not once per comparison",
    "`sorted` returns a new list; `.sort()` sorts in place and returns `None`",
    "A tuple key sorts by several fields: `(-count, name)` gives count descending, name ascending",
    "`reverse=True` flips every field; negating one field inside the tuple flips only that one",
    "Java chains with `thenComparing`, and `reversed()` applies to everything chained before it",
    "`Arrays.sort(int[])` takes no comparator — box to `Integer[]` to sort primitives descending",
    "Stable sorts let you sort in passes: least significant field first, most significant last",
    "Never compare by subtracting; use `Integer.compare`, which cannot overflow",
  ],
};
