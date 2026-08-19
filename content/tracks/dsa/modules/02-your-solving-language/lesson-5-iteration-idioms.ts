import type { Lesson } from "@/content/types";

export const iterationIdiomsLesson: Lesson = {
  id: "dsa-lang-iteration",
  slug: "iteration-idioms",
  moduleSlug: "your-solving-language",
  title: "Iteration Idioms & Mutating While You Iterate",
  summary:
    "Index and value together, two lists at once, walking a map, going backwards — and the bug that Java shouts about and Python performs silently.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Iterate with index and value together in both languages",
    "Walk a map's entries, and iterate two sequences in parallel",
    "Iterate backwards without off-by-one errors",
    "Explain why removing from a collection while iterating it is a bug, and what to do instead",
  ],
  sections: [
    {
      id: "index-and-value",
      heading: "Index and value together",
      body: [
        "The single most common iteration in problem solving is \"for each element, and I also need its position\". Both languages have a right way to write it and a way people write it instead.",
        "In Python, `enumerate` gives both. Writing `for i in range(len(values))` and then indexing is the Java habit transplanted, and it is noisier and easier to get wrong.",
        "In Java, the enhanced for loop gives you the value only, so when you need the index you use the classic three-part form. That is not a failing — it is just how it is, and the three-part loop is worth being able to type without thinking.",
      ],
      examples: [
        {
          id: "enumerate",
          title: "Python: enumerate, zip, and items",
          lang: "python",
          code: `words = ["a", "bb", "ccc"]

for i, word in enumerate(words):
    print(i, word)

for word, n in zip(words, [1, 2, 3]):
    print(word, n)

lengths = {"a": 1, "bb": 2}
for key, value in lengths.items():
    print(key, value)

for i, word in enumerate(words, start=1):
    print(i, word)`,
          output: `0 a
1 bb
2 ccc
a 1
bb 2
ccc 3
a 1
bb 2
1 a
2 bb
3 ccc`,
          explanation:
            "Three idioms you will use constantly. `enumerate` for position and value, `zip` for two sequences in step, `.items()` for a dict's pairs — never `for key in d:` followed by `d[key]`, which is a second lookup for no reason. The `start=1` argument is the clean answer to one-indexed problems: it changes the reported index without changing your arithmetic.",
        },
        {
          id: "java-entryset",
          title: "Java: entrySet and the indexed loop",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] words = { "a", "bb", "ccc" };

        for (int i = 0; i < words.length; i++) {
            System.out.println(i + " " + words[i]);
        }

        for (String word : words) {
            System.out.println(word);
        }

        Map<String, Integer> lengths = new LinkedHashMap<>();
        lengths.put("a", 1);
        lengths.put("bb", 2);

        for (Map.Entry<String, Integer> entry : lengths.entrySet()) {
            System.out.println(entry.getKey() + " " + entry.getValue());
        }
    }
}`,
          output: `0 a
1 bb
2 ccc
a
bb
ccc
a 1
bb 2`,
          explanation:
            "`entrySet()` is the one to internalise: iterating `keySet()` and then calling `get(key)` inside the loop does a second hash lookup on every iteration for information you already had. Note `LinkedHashMap` rather than `HashMap` — a plain `HashMap` gives no ordering guarantee, and relying on the order it happens to produce is a bug waiting for a different input size.",
        },
      ],
      pitfalls: [
        {
          title: "`for i in range(len(values))` in Python",
          body: "Correct, and a tell that you are writing Java. Use `enumerate` when you need both, and iterate the values directly when you do not. The exceptions are real but narrow: when you need to assign back into the list by index, or when you are stepping two indices independently.",
        },
      ],
    },
    {
      id: "backwards",
      heading: "Going backwards without off-by-one errors",
      body: [
        "Iterating in reverse is where index arithmetic goes wrong most often, because the bounds are asymmetric and easy to fumble.",
        "Python has two clean ways that avoid the arithmetic entirely, and one explicit way for when you genuinely need the index counting down.",
      ],
      examples: [
        {
          id: "backwards-python",
          title: "Three ways backwards",
          lang: "python",
          code: `values = [1, 2, 3, 4]

print(list(reversed(values)))
print(values[::-1])

for i in range(len(values) - 1, -1, -1):
    print(i, values[i])`,
          output: `[4, 3, 2, 1]
[4, 3, 2, 1]
3 4
2 3
1 2
0 1`,
          explanation:
            "`reversed` and `[::-1]` differ in one way worth knowing: the slice builds a whole new list, and `reversed` returns a lazy iterator that copies nothing. For a large list inside a loop, that matters. The three-argument `range` is the explicit form — start at the last index, stop *before* −1 so that 0 is included, step by −1 — and getting `-1` rather than `0` as the middle argument is the classic error.",
        },
      ],
    },
    {
      id: "mutating",
      heading: "The bug: changing a collection while iterating it",
      body: [
        "Removing elements from a list while looping over it is one of the most common bugs there is, and the two languages handle it in completely opposite ways.",
        "**Java throws.** The collection tracks a modification count, notices it changed underneath the iterator, and raises `ConcurrentModificationException`. Loud, immediate, impossible to miss.",
        "**Python does not.** It quietly keeps an internal index that no longer lines up with the shifted list. Elements are skipped. No error, wrong answer.",
        "Python's behaviour is worse precisely because it is quieter, and the example below shows an input where the result is not merely different but plainly wrong.",
      ],
      examples: [
        {
          id: "python-mutation",
          title: "Python: elements silently skipped",
          lang: "python",
          code: `values = [2, 4, 6]
for value in values:
    if value % 2 == 0:
        values.remove(value)
print("removed every even:", values)

correct = [2, 4, 6]
correct = [value for value in correct if value % 2 != 0]
print("built a new list  :", correct)`,
          output: `removed every even: [4]
built a new list  : []`,
          explanation:
            "Every element was even, so the answer must be the empty list — and the first loop left a 4 behind. What happened: the loop is at index 0, removes 2, and the list becomes `[4, 6]`; the loop advances to index 1, which is now 6, removes it; index 2 is past the end, so it stops, never having looked at 4. Nothing reported a problem. The fix is not a cleverer loop — it is to build a new list instead of editing the one you are walking.",
        },
        {
          id: "java-mutation",
          title: "Java: the same mistake, announced",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> bad = new ArrayList<>(List.of(2, 4, 6));
        try {
            for (Integer value : bad) {
                if (value % 2 == 0) {
                    bad.remove(value);
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("threw " + e.getClass().getSimpleName());
        }

        List<Integer> good = new ArrayList<>(List.of(2, 4, 6));
        Iterator<Integer> it = good.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) {
                it.remove();
            }
        }
        System.out.println("iterator remove: " + good);

        List<Integer> best = new ArrayList<>(List.of(2, 4, 6));
        best.removeIf(value -> value % 2 == 0);
        System.out.println("removeIf       : " + best);
    }
}`,
          output: `threw ConcurrentModificationException
iterator remove: []
removeIf       : []`,
          explanation:
            "Three behaviours in one program. The enhanced for loop throws — annoying in the moment and a genuine gift, because the alternative is Python's silence. `Iterator.remove()` is the sanctioned way to delete during a walk, since the iterator updates its own bookkeeping. `removeIf` is better still and is what you should reach for: one line, no iterator, no chance of getting it wrong.",
        },
      ],
      pitfalls: [
        {
          title: "Mutating a dict or set during iteration",
          body: "The same rule applies and Python *does* raise here — `RuntimeError: dictionary changed size during iteration`. Only lists get the silent treatment, because a list iterator is a plain index. Collect the keys to delete in a separate list first, then delete after the loop.",
        },
      ],
    },
    {
      id: "comprehensions",
      heading: "Comprehensions, and where to stop",
      body: [
        "Python's list comprehension is the idiomatic answer to \"transform or filter this sequence\", and it is genuinely faster than the equivalent loop with `append`, because it avoids a method lookup and call per element.",
        "The rule for when to use one: **a comprehension should fit on one line and do one thing.** Transform, or filter, or both once. As soon as it has two `for` clauses and a conditional expression, it has stopped being clearer than the loop it replaced, and the loop is what you should write.",
      ],
      examples: [
        {
          id: "comprehensions",
          title: "Good, and one step too far",
          lang: "python",
          code: `nums = [1, 2, 3, 4, 5, 6]

print([n * n for n in nums])
print([n for n in nums if n % 2 == 0])
print([n * n for n in nums if n % 3 == 0])

print({n % 3 for n in nums})
print({n: n * n for n in nums if n < 4})

grid = [[1, 2], [3, 4]]
print([cell for row in grid for cell in row])`,
          output: `[1, 4, 9, 16, 25, 36]
[2, 4, 6]
[9, 36]
{0, 1, 2}
{1: 1, 2: 4, 3: 9}
[1, 2, 3, 4]`,
          explanation:
            "The first five are clear. The last one — flattening a grid — is the point at which people start to hesitate, and the ordering trips everybody up: the `for` clauses read left to right in the same order as the nested loops they replace, so `for row in grid` comes first even though `cell` is what is produced. It is worth knowing and worth not nesting further.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens if you remove elements from a list while iterating over it?",
      answer:
        "In Java the enhanced for loop throws `ConcurrentModificationException`, because the collection tracks a modification count the iterator checks. In Python nothing is thrown: the list iterator holds an index, removing shifts the remaining elements left, and elements get silently skipped — so `[2, 4, 6]` with every even removed leaves `[4]`. The fixes are `removeIf` or `Iterator.remove()` in Java, and building a new list with a comprehension in Python.",
    },
    {
      question: "Why iterate `entrySet()` rather than `keySet()`?",
      answer:
        "Iterating the keys and calling `get(key)` inside the loop performs a second hash lookup per element for data the iterator already has. `entrySet()` yields the key and value together in one pass. For a map of n entries that halves the number of hash operations, and it reads better. Python's equivalent is `.items()` rather than looping the keys and indexing.",
    },
    {
      question: "What is the difference between `reversed(values)` and `values[::-1]`?",
      answer:
        "`values[::-1]` builds a whole new reversed list, so it costs O(n) time and O(n) extra memory. `reversed(values)` returns a lazy iterator that yields elements back to front without copying anything, so it is O(1) memory. For a single pass, `reversed` is the better choice; the slice is right when you actually need a new list you can keep or modify.",
    },
  ],
  takeaways: [
    "`enumerate` for index and value, `zip` for two sequences, `.items()` for a dict — never key-then-lookup",
    "`enumerate(values, start=1)` handles one-indexed problems without touching your arithmetic",
    "Java's `entrySet()` avoids a second hash lookup per element that `keySet()` costs you",
    "`HashMap` has no ordering guarantee; use `LinkedHashMap` when you rely on one",
    "`reversed` is a lazy iterator; `[::-1]` copies the whole list",
    "Removing while iterating throws in Java and silently skips elements in Python",
    "Use `removeIf` or `Iterator.remove()` in Java; build a new list with a comprehension in Python",
    "A comprehension should fit on one line and do one thing; past that, write the loop",
  ],
};
