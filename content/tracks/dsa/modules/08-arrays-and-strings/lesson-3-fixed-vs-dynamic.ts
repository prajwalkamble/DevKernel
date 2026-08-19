import type { Lesson } from "@/content/types";

export const fixedVsDynamicLesson: Lesson = {
  id: "dsa-arr-dynamic",
  slug: "fixed-and-dynamic-arrays",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Fixed Arrays, Dynamic Arrays & Why Doubling Works",
  summary:
    "What happens when a growable array runs out of room, why doubling makes appending O(1) on average, and the amortised argument behind it.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the difference between a fixed array and a dynamic one",
    "Describe what happens on an append that exceeds capacity",
    "Explain why doubling gives amortised O(1) and adding a constant does not",
    "Distinguish size from capacity, and say when to pre-size a collection",
  ],
  sections: [
    {
      id: "fixed",
      heading: "Fixed arrays cannot grow",
      body: [
        "A Java array is allocated once with a size that can never change. `new int[5]` reserves exactly five slots, and there is no `add` method — the only way to \"grow\" it is to allocate a bigger one and copy everything across.",
        "Python has no fixed array at all in everyday use; its `list` is dynamic. So this lesson is mostly about Java's `ArrayList` and Python's `list`, which are the same idea under different names.",
      ],
      examples: [
        {
          id: "growing-manually",
          title: "Growing by hand, which is what the library does",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int[] grow(int[] original, int extra) {
        int[] bigger = new int[original.length + extra];
        for (int i = 0; i < original.length; i++) {
            bigger[i] = original[i];
        }
        return bigger;
    }

    public static void main(String[] args) {
        int[] small = { 1, 2, 3 };
        System.out.println(Arrays.toString(small) + " length " + small.length);

        int[] bigger = grow(small, 2);
        bigger[3] = 4;
        System.out.println(Arrays.toString(bigger) + " length " + bigger.length);

        System.out.println("the original is untouched: " + Arrays.toString(small));

        int[] viaLibrary = Arrays.copyOf(small, 5);
        System.out.println(Arrays.toString(viaLibrary));
    }
}`,
          output: `[1, 2, 3] length 3
[1, 2, 3, 4, 0] length 5
the original is untouched: [1, 2, 3]
[1, 2, 3, 0, 0]`,
          explanation:
            "Allocate, copy, return — three lines, and `Arrays.copyOf` does exactly this for you. The new slots are zero, per the guarantee from lesson one. The cost is the copy: growing an n-element array is O(n), which is the fact the rest of this lesson is about.",
        },
      ],
    },
    {
      id: "size-vs-capacity",
      heading: "Size against capacity",
      body: [
        "A dynamic array holds an ordinary fixed array inside it, plus a count of how much is in use. Two numbers, and the distinction matters:",
        "**Size** — how many elements you have put in. This is what `size()` and `len()` report.",
        "**Capacity** — how many the internal array can hold before it must grow. Invisible from outside, and always at least the size.",
        "Appending writes into the next free slot and increments the size — O(1). When size reaches capacity, the structure allocates a bigger internal array, copies everything, and then appends — O(n) for that one call.",
      ],
      examples: [
        {
          id: "size-capacity",
          title: "A dynamic array, implemented",
          lang: "python",
          code: `class Growable:
    def __init__(self):
        self.data = [None] * 1
        self.size = 0
        self.copies = 0

    def append(self, item):
        if self.size == len(self.data):
            bigger = [None] * (len(self.data) * 2)
            for i in range(self.size):
                bigger[i] = self.data[i]
                self.copies += 1
            self.data = bigger
        self.data[self.size] = item
        self.size += 1

    def capacity(self):
        return len(self.data)


g = Growable()
for i in range(9):
    before = g.capacity()
    g.append(i)
    marker = "  <- grew" if g.capacity() != before else ""
    print(f"append {i}: size {g.size}, capacity {g.capacity()}{marker}")

print("total elements copied:", g.copies)`,
          output: `append 0: size 1, capacity 1
append 1: size 2, capacity 2  <- grew
append 2: size 3, capacity 4  <- grew
append 3: size 4, capacity 4
append 4: size 5, capacity 8  <- grew
append 5: size 6, capacity 8
append 6: size 7, capacity 8
append 7: size 8, capacity 8
append 8: size 9, capacity 16  <- grew
total elements copied: 15`,
          explanation:
            "Nine appends, four growths, fifteen elements copied in total. The growths happen at capacities 1, 2, 4 and 8 — powers of two, ever further apart. That spacing is the whole trick and the next section explains why it makes the average cost constant.",
        },
      ],
    },
    {
      id: "amortised",
      heading: "Why doubling makes it O(1) on average",
      body: [
        "Appending is usually O(1) and occasionally O(n). The useful question is what n appends cost *in total*, and the answer is O(n) — so the average per append is constant. That is what **amortised O(1)** means.",
        "The argument is short. Growing from capacity c copies c elements. Doing n appends triggers growths at capacities 1, 2, 4, 8, … up to n, so the total copying is 1 + 2 + 4 + … + n, which is less than 2n. Fewer than two copies per element, however large n gets.",
        "The key is that the *gaps* between growths double as well. Each expensive operation buys twice as many cheap ones as the last, so the expensive ones never catch up.",
        "Growing by a **constant** instead — adding 10 slots each time — breaks it. Growths then happen every 10 appends regardless of size, and the total copying becomes quadratic.",
      ],
      examples: [
        {
          id: "doubling-vs-constant",
          title: "Doubling against adding a constant, counted",
          lang: "python",
          code: `def copies_when_doubling(n):
    capacity, size, copies = 1, 0, 0
    for _ in range(n):
        if size == capacity:
            copies += size
            capacity *= 2
        size += 1
    return copies


def copies_when_adding(n, step=10):
    capacity, size, copies = step, 0, 0
    for _ in range(n):
        if size == capacity:
            copies += size
            capacity += step
        size += 1
    return copies


print(f"{'n':>7}  {'doubling':>10}  {'per item':>9}  {'add 10':>10}  {'per item':>9}")
for n in (1000, 10_000, 100_000):
    d = copies_when_doubling(n)
    a = copies_when_adding(n)
    print(f"{n:>7}  {d:>10}  {d / n:>9.2f}  {a:>10}  {a / n:>9.1f}")`,
          output: `      n    doubling   per item      add 10   per item
   1000        1023       1.02       49500       49.5
  10000       16383       1.64     4995000      499.5
 100000      131071       1.31   499950000     4999.5
`,
          explanation:
            "Doubling copies fewer than two elements per item at every size — the per-item column stays around 1. Adding a constant is 49.5 copies per item at n = 1,000 and 4,999.5 at n = 100,000: the per-item cost grows *with n*, which is the definition of not being constant. Total work is O(n) against O(n²), from one line of the growth policy.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming amortised means always",
          body: "One particular append really does cost O(n), and in latency-sensitive code that spike matters. For problem solving it never does — the total is what a time limit measures. But saying \"append is O(1)\" without the word amortised is the kind of imprecision an interviewer will pick up on.",
        },
      ],
    },
    {
      id: "pre-sizing",
      heading: "Pre-sizing, and when it is worth it",
      body: [
        "If you know how many elements are coming, you can allocate the capacity up front and skip every growth: `new ArrayList<>(n)` in Java, or `[None] * n` in Python.",
        "This is a constant-factor optimisation and it never changes a complexity. It is worth doing when the size is known and the count is large, and not worth thinking about otherwise.",
        "The genuinely important case is different: **use the right structure.** Appending to a dynamic array is amortised O(1) and is fine. Inserting at the *front* is O(n) every time, and no growth policy fixes that — that needs a deque, as the collections lesson said.",
      ],
      examples: [
        {
          id: "front-vs-back",
          title: "The cost no growth policy can fix",
          lang: "python",
          code: `from collections import deque


def append_back(n):
    values = []
    for i in range(n):
        values.append(i)
    return len(values)


def insert_front_list(n):
    values = []
    shifts = 0
    for i in range(n):
        shifts += len(values)     # what insert(0, x) must move
        values.insert(0, i)
    return shifts


def append_front_deque(n):
    values = deque()
    for i in range(n):
        values.appendleft(i)
    return len(values)


for n in (1000, 2000, 4000):
    print(f"n={n:>5}  list.insert(0) moved {insert_front_list(n):>9,} elements"
          f"   deque.appendleft moved 0")`,
          output: `n= 1000  list.insert(0) moved   499,500 elements   deque.appendleft moved 0
n= 2000  list.insert(0) moved 1,999,000 elements   deque.appendleft moved 0
n= 4000  list.insert(0) moved 7,998,000 elements   deque.appendleft moved 0
`,
          explanation:
            "The shift count quadruples when n doubles — quadratic, and entirely separate from the growth question. A deque keeps blocks at both ends and adds at the front in O(1), moving nothing. This is the same warning as `pop(0)` from the collections lesson, and it is the most common accidental slowdown in Python solutions.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens when you append to a full ArrayList?",
      answer:
        "It allocates a new internal array — typically about 1.5 or 2 times the old capacity — copies every existing element across, discards the old array, and then performs the append. That single call is O(n). Every other append writes into a free slot and is O(1), so the cost is amortised: n appends total O(n) work, and the average per append is constant.",
    },
    {
      question: "Why does doubling give amortised O(1) but adding a fixed number does not?",
      answer:
        "Because with doubling the growths happen at capacities 1, 2, 4, 8 and so on, so the total copying over n appends is 1 + 2 + 4 + … which is under 2n — fewer than two copies per element regardless of size. Each expensive growth buys twice as many cheap appends as the last, so they never catch up. Adding a constant makes growths happen every k appends however large the array is, giving n/k growths that each copy an ever-larger array: total work becomes quadratic, and measured, the per-item cost rises from 49.5 at n = 1,000 to 4,999.5 at n = 100,000.",
    },
    {
      question: "What is the difference between size and capacity?",
      answer:
        "Size is how many elements are actually stored and is what `size()` or `len()` reports. Capacity is how large the internal array is — how many could be stored before it must grow — and is invisible from outside. Appending increments the size; it only touches the capacity when the two are equal. Pre-sizing with `new ArrayList<>(n)` sets the capacity up front and skips the growths, which is a constant-factor win rather than a complexity change.",
    },
  ],
  takeaways: [
    "A Java array's size is fixed at allocation; growing means allocate, copy, discard",
    "A dynamic array is a fixed array plus a size count, and grows when they meet",
    "Size is what you stored; capacity is what fits before the next growth",
    "Doubling makes n appends cost O(n) in total — under two copies per element",
    "The gaps between growths double too, which is why the expensive calls never catch up",
    "Growing by a constant makes the total quadratic: 4,999 copies per item at n = 100,000",
    "Say \"amortised O(1)\", not \"O(1)\" — one particular append really does cost O(n)",
    "No growth policy fixes front insertion; that needs a deque",
  ],
};
