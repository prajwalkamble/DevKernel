import type { Lesson } from "@/content/types";

export const passByValueLesson: Lesson = {
  id: "dsa-fn-pass-by-value",
  slug: "pass-by-value-and-references",
  moduleSlug: "functions-and-the-call-stack",
  title: "Pass by Value, Pass by Reference & What Actually Happens",
  summary:
    "Why a function can change your list but not your number, in both languages — and the one rule that makes every case predictable.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State what is copied when an argument is passed, in Java and Python",
    "Predict whether a function's changes are visible to the caller",
    "Distinguish mutating an object from rebinding a name",
    "Avoid the surprise of a helper that silently sorts the caller's list",
  ],
  sections: [
    {
      id: "the-rule",
      heading: "One rule that covers every case",
      body: [
        "There is a great deal of confused writing about this, and it resolves into one sentence that is true of both languages:",
        "**The value is always copied. When the value is a reference, the copy points at the same object.**",
        "So: a number is copied, and the function's changes to it are invisible to you. A list is *a reference to a list*, and the reference is copied — both names now point at the same list, so mutating it through either is visible through both. But **rebinding** the parameter to a different object only changes the local copy.",
        "That single rule predicts every example in this lesson. Java calls it pass-by-value with references as values; Python's term is call-by-object-reference. The behaviour is the same and the terminology is not worth arguing about.",
      ],
      examples: [
        {
          id: "python-both",
          title: "Mutate, rebind, and a plain number",
          lang: "python",
          code: `def mutate(values):
    values.append(99)


def rebind(values):
    values = [0, 0, 0]


def reassign(n):
    n = 99


data = [1, 2, 3]
mutate(data)
print("after mutate :", data)

rebind(data)
print("after rebind :", data)

number = 5
reassign(number)
print("after reassign:", number)`,
          output: `after mutate : [1, 2, 3, 99]
after rebind : [1, 2, 3, 99]
after reassign: 5`,
          explanation:
            "Three functions, two of which appear to do the same thing. `mutate` changes the object both names point at, so the caller sees it. `rebind` points the local name at a *new* list and leaves the original untouched. `reassign` is the same story for a number — the local copy changes and nothing else does. `append` mutates; `=` rebinds; that is the whole distinction.",
        },
        {
          id: "java-both",
          title: "The same three in Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static void mutate(List<Integer> values) {
        values.add(99);
    }

    static void rebind(List<Integer> values) {
        values = new ArrayList<>(List.of(0, 0, 0));
    }

    static void reassign(int n) {
        n = 99;
    }

    public static void main(String[] args) {
        List<Integer> data = new ArrayList<>(List.of(1, 2, 3));

        mutate(data);
        System.out.println("after mutate  : " + data);

        rebind(data);
        System.out.println("after rebind  : " + data);

        int number = 5;
        reassign(number);
        System.out.println("after reassign: " + number);
    }
}`,
          output: `after mutate  : [1, 2, 3, 99]
after rebind  : [1, 2, 3, 99]
after reassign: 5`,
          explanation:
            "Identical results, which is the point — the two languages behave the same way despite the different vocabulary. Java is strictly pass-by-value: what is copied for `data` is the reference, so `values.add` reaches the same list and `values = new ArrayList<>()` only repoints the local copy.",
        },
      ],
      pitfalls: [
        {
          title: "Trying to swap two variables with a function",
          body: "`swap(a, b)` cannot work in either language for numbers or strings, because the function only ever sees copies. Java has no way at all; Python's answer is to return a tuple and unpack it at the call site, `a, b = swap(a, b)`. If you find yourself wanting an output parameter, return a value instead.",
        },
      ],
    },
    {
      id: "which-are-which",
      heading: "What is copied, and what is shared",
      body: [
        "**Copied — changes never visible to the caller:** all Java primitives (`int`, `long`, `double`, `boolean`, `char`), and in Python all *immutable* values, which is numbers, strings, tuples and booleans.",
        "**Shared — mutations visible, rebinding not:** every object. Arrays, lists, maps, sets, and your own classes in Java; lists, dicts, sets and objects in Python.",
        "The neat consequence for Python: **immutability decides it.** You cannot mutate a string or a tuple, so a function can never change one you passed in — the question does not arise. Everything that *can* be mutated is shared.",
      ],
      examples: [
        {
          id: "immutable",
          title: "Immutable values cannot be changed through a parameter",
          lang: "python",
          code: `def try_to_change(text, pair, values):
    text = text.upper()
    pair = pair + (4,)
    values.append(4)
    return text, pair


t = "hello"
p = (1, 2, 3)
v = [1, 2, 3]

returned_text, returned_pair = try_to_change(t, p, v)

print("string  :", t, "->", returned_text)
print("tuple   :", p, "->", returned_pair)
print("list    :", v)`,
          output: `string  : hello -> HELLO
tuple   : (1, 2, 3) -> (1, 2, 3, 4)
list    : [1, 2, 3, 4]`,
          explanation:
            "The string and tuple are unchanged in the caller — the function built new ones and had to *return* them for the caller to see anything. The list was mutated in place and needed no return at all. That asymmetry is not two different rules; it is one rule meeting two kinds of value.",
        },
      ],
    },
    {
      id: "accidental-mutation",
      heading: "The bug this actually causes",
      body: [
        "The theory matters because of one specific, common mistake: **a helper that sorts or modifies the list it was given.**",
        "`values.sort()` inside a function sorts the caller's list. If the caller needed the original order — because the answer involves indices, say — the code now returns wrong indices, and nothing indicates where the order was lost.",
        "The fix is a one-word habit: **copy before mutating a parameter**, unless mutating it is the documented purpose. `sorted(values)` returns a new list; `values.sort()` changes the caller's. `new ArrayList<>(values)` and `values.clone()` do the same job in Java.",
      ],
      examples: [
        {
          id: "accidental-sort",
          title: "A helper that quietly destroys the caller's order",
          lang: "python",
          code: `def median_destructive(values):
    values.sort()
    return values[len(values) // 2]


def median_safe(values):
    ordered = sorted(values)
    return ordered[len(ordered) // 2]


data = [5, 1, 4]
print("median:", median_destructive(data))
print("caller's list is now:", data)

data = [5, 1, 4]
print("median:", median_safe(data))
print("caller's list is now:", data)

# Why it matters: the caller wanted an index into the ORIGINAL order.
data = [5, 1, 4]
m = median_destructive(data)
print("index of the median in what the caller thinks is their list:", data.index(m))`,
          output: `median: 4
caller's list is now: [1, 4, 5]
median: 4
caller's list is now: [5, 1, 4]
index of the median in what the caller thinks is their list: 1`,
          explanation:
            "The last line is the damage. In the caller's original list `[5, 1, 4]` the median 4 sits at index 2; after the destructive helper it reports 1, because the list it is searching has been reordered underneath it. Nothing raised an error and the median itself was correct — this is exactly the silent logical error from the errors lesson.",
        },
      ],
      pitfalls: [
        {
          title: "A mutable default argument in Python",
          body: "`def collect(item, into=[]):` evaluates the default **once**, when the function is defined — so every call without an explicit argument shares one list, and it accumulates across calls. The fix is `into=None` and `if into is None: into = []` inside. It is the same reference-sharing rule in its most surprising form.",
        },
      ],
    },
    {
      id: "default-argument",
      heading: "The mutable default, demonstrated",
      body: [
        "This deserves its own example because the behaviour looks impossible until you know the rule.",
      ],
      examples: [
        {
          id: "mutable-default",
          title: "One list, shared by every call",
          lang: "python",
          code: `def broken(item, into=[]):
    into.append(item)
    return into


print(broken(1))
print(broken(2))
print(broken(3))


def fixed(item, into=None):
    if into is None:
        into = []
    into.append(item)
    return into


print(fixed(1))
print(fixed(2))
print(fixed(3))`,
          output: `[1]
[1, 2]
[1, 2, 3]
[1]
[2]
[3]`,
          explanation:
            "Three independent calls to `broken`, and the list grows across all of them — because the default `[]` was created once, when `def` was executed, and every call that omits the argument gets that same object. `fixed` uses `None` as the sentinel and builds a fresh list inside, which is the standard Python idiom and worth typing from memory.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is Java pass-by-value or pass-by-reference?",
      answer:
        "Strictly pass-by-value — but for an object, the value being copied is the reference. So the method gets its own copy of the reference pointing at the same object: mutating through it is visible to the caller, while reassigning the parameter only repoints the local copy. That is why `list.add(x)` inside a method is visible outside and `list = new ArrayList<>()` is not. Python behaves identically; the terminology differs, the semantics do not.",
    },
    {
      question: "Why does a Python function change a list you passed but not a string?",
      answer:
        "Because strings are immutable and lists are not. Both are passed the same way — the reference is copied — but there is no operation that modifies a string in place, so any \"change\" builds a new one and rebinds the local name, which the caller never sees. A list can be mutated through the shared reference, so `append` is visible. Immutability, not a different calling convention, is what decides it.",
    },
    {
      question: "What is wrong with `def collect(item, into=[])`?",
      answer:
        "The default is evaluated once, when the `def` statement runs, so every call that omits the argument shares one list and it accumulates across calls. The idiom is `into=None` with `if into is None: into = []` in the body, which creates a fresh list per call. It is the same reference-sharing rule as everything else in this lesson, in the form that surprises people most.",
    },
  ],
  takeaways: [
    "One rule: the value is always copied, and when the value is a reference the copy points at the same object",
    "Mutating through a parameter is visible to the caller; rebinding the parameter is not",
    "Java primitives and Python's immutable values are effectively copied outright",
    "In Python, immutability decides it — anything mutable is shared",
    "You cannot write a `swap` function for numbers in either language; return a tuple instead",
    "A helper that sorts its parameter destroys the caller's order silently",
    "Copy before mutating: `sorted(values)`, `new ArrayList<>(values)`, `values.clone()`",
    "A mutable default argument is created once and shared by every call — use `None` as the sentinel",
  ],
};
