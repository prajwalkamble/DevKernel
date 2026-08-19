import type { Lesson } from "@/content/types";

export const declaringArraysLesson: Lesson = {
  id: "dsa-arr-declaring",
  slug: "declaring-and-traversing",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Declaring, Initialising & Traversing an Array",
  summary:
    "The first real data structure: contiguous memory, constant-time indexing, and the three ways to walk one — plus what an uninitialised slot actually contains.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Declare an array with a size, and with initial values, in both languages",
    "State what an uninitialised element holds in Java",
    "Traverse an array by index, by element, and with both",
    "Explain why indexing is constant time",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "Contiguous memory, and why indexing is free",
      body: [
        "An array is a block of memory holding elements of the same type, laid out **end to end with no gaps**. That single property is what makes it the structure everything else is built from.",
        "Because the elements are the same size and contiguous, the address of element `i` is `start + i × size`. That is one multiplication and one addition — **constant time, regardless of the index**. Reaching element 999,999 costs exactly what reaching element 0 costs.",
        "Everything else about arrays follows from this. Indexing is instant; inserting in the middle is not, because everything after has to shift; and the size is fixed at creation, because the block was allocated once.",
      ],
      examples: [
        {
          id: "declaring-java",
          title: "Java: three ways to create one",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] sized = new int[5];
        int[] initialised = { 3, 1, 4, 1, 5 };
        String[] objects = new String[2];

        System.out.println(Arrays.toString(sized));
        System.out.println(Arrays.toString(initialised) + "  length " + initialised.length);
        System.out.println(Arrays.toString(objects));

        int[] filled = new int[4];
        Arrays.fill(filled, 7);
        System.out.println(Arrays.toString(filled));
    }
}`,
          output: `[0, 0, 0, 0, 0]
[3, 1, 4, 1, 5]  length 5
[null, null]
[7, 7, 7, 7]`,
          explanation:
            "Java fills a new array with the **zero value** of its type — 0 for numbers, `false` for booleans, `null` for objects. That is a guarantee you can rely on: `new int[n]` is n zeros and needs no initialisation loop. Note `Arrays.toString` on every print; a bare `System.out.println(array)` gives a memory address, as the template lesson warned.",
        },
        {
          id: "declaring-python",
          title: "Python: lists, and the multiplication trap",
          lang: "python",
          code: `zeros = [0] * 5
initialised = [3, 1, 4, 1, 5]
empty = []

print(zeros)
print(initialised, "length", len(initialised))
print(empty, len(empty))

built = [i * i for i in range(5)]
print(built)

# The trap: * copies the reference, not the object.
rows_broken = [[0] * 3] * 2
rows_fixed = [[0] * 3 for _ in range(2)]
rows_broken[0][0] = 9
rows_fixed[0][0] = 9
print("broken:", rows_broken)
print("fixed :", rows_fixed)`,
          output: `[0, 0, 0, 0, 0]
[3, 1, 4, 1, 5] length 5
[] 0
[0, 1, 4, 9, 16]
broken: [[9, 0, 0], [9, 0, 0]]
fixed : [[9, 0, 0], [0, 0, 0]]`,
          explanation:
            "`[0] * 5` is safe because integers are immutable — copying the reference five times is indistinguishable from copying the value. `[[0] * 3] * 2` is not, because the inner list *is* mutable and both rows point at the same one. The rule: `*` is fine for immutable elements and wrong for mutable ones.",
        },
      ],
      pitfalls: [
        {
          title: "`array.length` against `list.size()` against `string.length()`",
          body: "Java uses three different spellings: a field for arrays, a method for collections, and a differently-named method for strings. Python uses `len()` for all three. There is no logic to Java's inconsistency; it is simply something to absorb, and it is a very common compile error early on.",
        },
      ],
    },
    {
      id: "traversing",
      heading: "Three ways to walk one",
      body: [
        "**By index** — `for (int i = 0; i < n; i++)`. Use when you need the position: comparing neighbours, writing back into the array, or reporting where something was found.",
        "**By element** — the enhanced for loop, or Python's plain `for`. Use when the position is irrelevant. It removes three places an indexed loop can be wrong.",
        "**By both** — Python's `enumerate`. Java has no equivalent, so the indexed form does this job there.",
        "The default should be by element. Reach for the index when you actually need it, which is less often than beginners assume.",
      ],
      examples: [
        {
          id: "traversing",
          title: "All three, and when each is right",
          lang: "python",
          code: `values = [3, 1, 4, 1, 5]

total = 0
for v in values:
    total += v
print("by element, sum:", total)

for i, v in enumerate(values):
    if v == 1:
        print("found 1 at index", i)

# The index is genuinely needed when comparing neighbours.
increasing = []
for i in range(len(values) - 1):
    if values[i] < values[i + 1]:
        increasing.append((values[i], values[i + 1]))
print("ascending pairs:", increasing)

# ...and when writing back.
doubled = values[:]
for i in range(len(doubled)):
    doubled[i] *= 2
print("doubled:", doubled, "original:", values)`,
          output: `by element, sum: 14
found 1 at index 1
found 1 at index 3
ascending pairs: [(1, 4), (1, 5)]
doubled: [6, 2, 8, 2, 10] original: [3, 1, 4, 1, 5]`,
          explanation:
            "Four loops, three of which genuinely need the index: reporting a position, comparing `i` with `i + 1`, and assigning back. The sum does not, so it uses the simpler form. Note the neighbour loop stops at `len - 1`, the fence-post bound from the off-by-one lesson — and note `values[:]` copies before mutating, which is the pass-by-value lesson applied.",
        },
      ],
      pitfalls: [
        {
          title: "Writing back through a for-each variable",
          body: "`for (int v : values) v *= 2;` in Java, and `for v in values: v *= 2` in Python, both change only the loop variable. The array is untouched. Assigning back requires the index form, or in Python a comprehension that builds a new list.",
        },
      ],
    },
    {
      id: "cost-model",
      heading: "What each operation costs",
      body: [
        "Worth having as a table now, because every structure in Module 1 is compared against these numbers.",
        "**Read or write by index — O(1).** The address arithmetic above.",
        "**Search for a value — O(n).** No shortcut without extra structure; you look at each element.",
        "**Insert or delete at the end — O(1) amortised** for a dynamic array, impossible for a fixed one.",
        "**Insert or delete in the middle — O(n).** Everything after the position shifts.",
        "The last one is the array's defining weakness, and it is exactly what linked lists trade against — they make middle insertion O(1) and give up the constant-time indexing.",
      ],
      examples: [
        {
          id: "cost",
          title: "Counting the shifts an insertion costs",
          lang: "python",
          code: `def insert_at(values, index, item):
    """What list.insert does underneath: shift, then place."""
    values.append(None)
    shifts = 0
    for i in range(len(values) - 1, index, -1):
        values[i] = values[i - 1]
        shifts += 1
    values[index] = item
    return shifts


for position in (0, 2, 5):
    data = [1, 2, 3, 4, 5]
    moved = insert_at(data, position, 99)
    print(f"insert at {position}: {moved} elements moved -> {data}")`,
          output: `insert at 0: 5 elements moved -> [99, 1, 2, 3, 4, 5]
insert at 2: 3 elements moved -> [1, 2, 99, 3, 4, 5]
insert at 5: 0 elements moved -> [1, 2, 3, 4, 5, 99]`,
          explanation:
            "Inserting at the front moves every element; at the end, none. That is the whole reason `append` is cheap and `insert(0, x)` is not — and why using a list as a queue with `pop(0)` turns a linear algorithm quadratic, as the collections lesson warned. The cost is not in the library; it is in the memory layout.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is array indexing O(1)?",
      answer:
        "Because the elements are the same size and stored contiguously, so the address of element `i` is the start address plus `i` times the element size — one multiplication and one addition, independent of `i`. Reaching the millionth element costs the same as the first. Everything else about arrays follows from that layout: search is O(n) because there is no shortcut, and middle insertion is O(n) because the contiguity must be preserved by shifting.",
    },
    {
      question: "What does `new int[5]` contain in Java?",
      answer:
        "Five zeros. Java guarantees that a newly allocated array is filled with the zero value of its element type — 0 for numeric types, `false` for `boolean`, `null` for object types. So `new int[n]` needs no initialisation loop, and `new String[n]` is n nulls, which is a common source of NullPointerException if you forget to fill it before use.",
    },
    {
      question: "Why is `[[0] * 3] * 2` wrong in Python but `[0] * 3` fine?",
      answer:
        "Because `*` repeats references rather than copying objects. For integers that is indistinguishable from copying, since they are immutable and can never be changed through one reference. For a list it matters: both rows point at the same inner list, so writing to one appears to write to all. The fix is a comprehension — `[[0] * 3 for _ in range(2)]` — which evaluates the inner expression once per row.",
    },
  ],
  takeaways: [
    "An array is contiguous same-sized elements, which is why indexing is one multiply and one add",
    "`new int[5]` in Java is five zeros; object arrays are filled with null",
    "`[0] * 5` is safe for immutable elements and wrong for mutable ones",
    "Java spells it `array.length`, `list.size()` and `string.length()`; Python uses `len()` for all three",
    "Default to iterating by element; reach for the index when you need a position or write back",
    "Writing through a for-each variable changes the variable, not the array",
    "Index O(1), search O(n), append O(1) amortised, middle insertion O(n)",
    "Inserting at the front moves every element — the same cost that makes `pop(0)` quadratic in a loop",
  ],
};
