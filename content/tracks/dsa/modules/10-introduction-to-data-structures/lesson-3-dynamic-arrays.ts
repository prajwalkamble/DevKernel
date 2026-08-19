import type { Lesson } from "@/content/types";

export const dynamicArraysLesson: Lesson = {
  id: "dsa-ds-dynamic-arrays",
  slug: "dynamic-arrays",
  moduleSlug: "introduction-to-data-structures",
  title: "Dynamic Arrays: The Default Structure",
  summary:
    "How a list grows, why appending is amortised O(1) and inserting at the front is not, and the growth factor argument that decides both.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain the doubling strategy and prove appending is amortised O(1)",
    "Watch a real list reallocate as it grows",
    "State the cost of every list operation and where the expensive ones hide",
    "Choose between a dynamic array and something else on evidence",
  ],
  sections: [
    {
      id: "the-growth",
      heading: "How a list grows",
      body: [
        "A dynamic array is a fixed array plus a length. Appending writes into the next free slot, which is O(1) — until the array is full.",
        "When it fills, the structure **allocates a larger array, copies everything across, and discards the old one.** That single append costs O(n).",
        "The design question is how much larger. Growing by a **constant amount** — say ten slots — makes n appends cost O(n²), because you reallocate every ten elements and copy everything each time. Growing by a **constant factor** makes n appends cost O(n) in total.",
        "That is the doubling argument, and it is why every real implementation multiplies rather than adds. Java's `ArrayList` grows by 1.5×, Python's list by roughly 1.125× once it is large, and both are constant factors so both are amortised O(1).",
      ],
      examples: [
        {
          id: "real-growth",
          title: "A real Python list reallocating",
          lang: "python",
          code: `import sys

values = []
prev = sys.getsizeof(values)
print(f"{'len':>5}  {'bytes':>7}  grew")
for i in range(20):
    values.append(i)
    size = sys.getsizeof(values)
    if size != prev:
        print(f"{len(values):>5}  {size:>7}  yes")
        prev = size
    elif i < 3:
        print(f"{len(values):>5}  {size:>7}")`,
          output: `  len    bytes  grew
    1       88  yes
    2       88
    3       88
    5      120  yes
    9      184  yes
   17      248  yes`,
          explanation:
            "The memory footprint jumps at lengths 1, 5, 9 and 17 and stays flat between — the flat stretches are the appends that cost O(1) and the jumps are the ones that copy. Note the list is holding spare capacity almost all the time; that unused space is the price of the fast append, and it is the space-for-time trade from lesson one, made concrete in bytes.",
        },
        {
          id: "growth-factors",
          title: "Counting the copies for two growth factors",
          lang: "python",
          code: `def simulate(n, factor):
    capacity, size, copies, grows = 1, 0, 0, 0
    for _ in range(n):
        if size == capacity:
            copies += size
            capacity = max(capacity + 1, int(capacity * factor))
            grows += 1
        size += 1
    return copies, grows


fmt = "{:>8}  {:>13}  {:>7}  {:>11}  {:>7}"
print(fmt.format("appends", "x1.5 copies", "grows", "x2 copies", "grows"))
for n in (100, 1_000, 10_000, 100_000):
    a = simulate(n, 1.5)
    b = simulate(n, 2)
    print(fmt.format(f"{n:,}", f"{a[0]:,}", a[1], f"{b[0]:,}", b[1]))

print()
n = 100_000
copies, grows = simulate(n, 2)
print(f"for {n:,} appends: {copies:,} copies over {grows} reallocations")
print(f"copies per append: {copies / n:.2f}  -- a constant, which is what amortised O(1) means")`,
          output: ` appends    x1.5 copies    grows    x2 copies    grows
     100            284       12          127        7
   1,000          2,137       17        1,023       10
  10,000         24,284       23       16,383       14
 100,000        276,521       29      131,071       17

for 100,000 appends: 131,071 copies over 17 reallocations
copies per append: 1.31  -- a constant, which is what amortised O(1) means`,
          explanation:
            "The final ratio is the proof. A hundred thousand appends cost 131,071 copies — **1.31 copies per append, and that number does not grow with n.** A constant amount of work per operation on average is exactly what amortised O(1) means. The 1.5× factor does more copying but wastes less memory, which is the trade the two implementations weigh differently.",
        },
      ],
    },
    {
      id: "the-costs",
      heading: "Every operation, and where it hurts",
      body: [
        "**Index — O(1).** The address is `base + i × size`, one multiplication.",
        "**Append — amortised O(1).** As above.",
        "**Insert or delete at position i — O(n − i).** Everything after the position shifts. At the end that is nothing; at the front it is the whole array.",
        "**Search by value — O(n).** No structure to exploit, unless the array is sorted, in which case binary search gives O(log n).",
        "**Delete by value — O(n).** A search plus a shift.",
        "The single most important consequence: **`list.pop(0)` and `list.insert(0, x)` are O(n).** They look as innocent as `pop()` and `append`, and inside a loop they turn a linear algorithm quadratic. That is what a deque exists to fix.",
      ],
      examples: [
        {
          id: "shift-cost",
          title: "How much shifts, and where",
          lang: "python",
          code: `def shifts_to_insert_at(n, index):
    return n - index


print("inserting into a list of 1000 elements:")
for index in (0, 250, 500, 999, 1000):
    print(f"  at index {index:>4}: {shifts_to_insert_at(1000, index):>4} elements shift")

print()
values = [1, 2, 3, 4, 5]
values.insert(0, 0)
print("insert at front:", values)
values.append(6)
print("append         :", values)
del values[3]
print("delete index 3 :", values)
values.remove(6)
print("remove value 6 :", values)
print("pop from end   :", values.pop(), values)
print("pop from front :", values.pop(0), values)`,
          output: `inserting into a list of 1000 elements:
  at index    0: 1000 elements shift
  at index  250:  750 elements shift
  at index  500:  500 elements shift
  at index  999:    1 elements shift
  at index 1000:    0 elements shift

insert at front: [0, 1, 2, 3, 4, 5]
append         : [0, 1, 2, 3, 4, 5, 6]
delete index 3 : [0, 1, 2, 4, 5, 6]
remove value 6 : [0, 1, 2, 4, 5]
pop from end   : 5 [0, 1, 2, 4]
pop from front : 0 [1, 2, 4]`,
          explanation:
            "The cost is the distance from the end, which is why the two ends of a list are so different despite the identical-looking method calls. `pop()` and `pop(0)` differ by one argument and by a factor of n. Nothing in the syntax warns you.",
        },
      ],
      pitfalls: [
        {
          title: "Removing elements while iterating",
          body: "Deleting from a list you are looping over shifts the remaining elements under the cursor, so the loop skips the element after each removal. Both languages have the same trap; Java at least throws `ConcurrentModificationException` for a for-each loop, while Python silently produces a wrong answer. Build a new list, iterate backwards, or use the read-and-write-pointer pattern from the arrays module.",
        },
      ],
    },
    {
      id: "java-side",
      heading: "In Java: array against ArrayList",
      body: [
        "Java exposes both layers, which makes the distinction unusually visible.",
        "**`int[]`** is the fixed array. Its size is set at construction and never changes, `length` is a field not a method, and it can hold primitives directly.",
        "**`ArrayList<Integer>`** is the dynamic array. It resizes, `size()` is a method, and it can only hold objects — so every `int` is boxed into an `Integer`, which costs an allocation and a pointer dereference per element.",
        "That boxing is the reason competitive Java code uses `int[]` wherever the size is known. For a million elements the difference is real, not theoretical.",
      ],
      examples: [
        {
          id: "java-lists",
          title: "The two, side by side",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] fixed = new int[5];
        fixed[0] = 10;
        System.out.println(Arrays.toString(fixed) + " length " + fixed.length);

        List<Integer> dynamic = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            dynamic.add(i * 10);
        }
        System.out.println(dynamic + " size " + dynamic.size());

        dynamic.add(0, 5);
        System.out.println("insert at front: " + dynamic);
        dynamic.remove(0);
        System.out.println("remove at front: " + dynamic);

        System.out.println("indexOf(30): " + dynamic.indexOf(30));
        System.out.println("contains(99): " + dynamic.contains(99));

        List<Integer> presized = new ArrayList<>(1000);
        System.out.println("presized capacity, size is still " + presized.size());

        Integer boxed = 30;
        System.out.println("remove(int) vs remove(Object): "
            + dynamic.remove(boxed) + " -> " + dynamic);
    }
}`,
          output: `[10, 0, 0, 0, 0] length 5
[10, 20, 30, 40, 50] size 5
insert at front: [5, 10, 20, 30, 40, 50]
remove at front: [10, 20, 30, 40, 50]
indexOf(30): 2
contains(99): false
presized capacity, size is still 0
remove(int) vs remove(Object): true -> [10, 20, 40, 50]`,
          explanation:
            "Two details worth carrying. `new ArrayList<>(1000)` sets the *capacity*, not the size — the list is still empty, and presizing it this way is a genuine optimisation when you know the final length, because it skips every reallocation. And `remove` is overloaded: `remove(int)` removes by **index** while `remove(Object)` removes by **value**, so `list.remove(2)` and `list.remove(Integer.valueOf(2))` do completely different things.",
        },
      ],
      pitfalls: [
        {
          title: "`list.remove(2)` on a `List<Integer>`",
          body: "It removes the element at index 2, not the value 2, because the `int` overload wins over the boxed one. This is one of the few places in Java where the obvious reading is wrong. Use `remove(Integer.valueOf(2))` to remove by value, and prefer being explicit even when it looks redundant.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a dynamic array grow, and why is appending amortised O(1)?",
      answer:
        "It keeps a fixed array with spare capacity; appending writes into a free slot until the array is full, at which point it allocates a larger one and copies everything across. The key is that it grows by a constant *factor* rather than a constant amount — growing by a fixed number of slots would make n appends O(n²). With doubling, 100,000 appends cost 131,071 copies total, which is 1.31 copies per append and does not grow with n. Constant work per operation on average is exactly amortised O(1).",
    },
    {
      question: "What are the costs of the list operations, and which one surprises people?",
      answer:
        "Indexing O(1), appending amortised O(1), searching O(n), and inserting or deleting at position i costs O(n − i) because everything after shifts. The surprise is that `pop(0)` and `insert(0, x)` are O(n) while `pop()` and `append` are O(1) — they look identical and differ by a factor of n. Inside a loop that turns a linear algorithm quadratic, which is exactly what a deque exists to prevent.",
    },
    {
      question: "When would you use a plain array instead of an ArrayList in Java?",
      answer:
        "When the size is known and the elements are primitives. An `ArrayList<Integer>` boxes every element into an object, costing an allocation and a pointer dereference each, so an `int[]` is substantially faster and smaller for large data. The `ArrayList` earns its cost when the size is unknown, when you need the collection API, or when the elements are objects anyway. If you do use one and know the final size, presize it with `new ArrayList<>(n)` to skip every reallocation.",
    },
  ],
  takeaways: [
    "A dynamic array is a fixed array plus a length, with spare capacity held in reserve",
    "It grows by a constant factor, not a constant amount — the latter would be O(n²) overall",
    "100,000 appends cost about 1.31 copies each, and that ratio does not grow with n",
    "Java's ArrayList grows by 1.5×; the spare capacity is space traded for time",
    "Insert or delete at index i costs O(n − i) — free at the end, full price at the front",
    "`pop(0)` is O(n) and `pop()` is O(1); nothing in the syntax warns you",
    "Never remove from a list you are iterating over",
    "`new ArrayList<>(1000)` sets capacity, not size; `remove(int)` removes by index",
  ],
};
