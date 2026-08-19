import type { Lesson } from "@/content/types";

export const readAndWritePointersLesson: Lesson = {
  id: "dsa-arr-compaction",
  slug: "the-read-pointer-and-the-write-pointer",
  moduleSlug: "arrays-and-strings",
  title: "The Read Pointer & the Write Pointer",
  summary:
    "One skeleton, an invariant you can state in a sentence, and a family of problems that stop being separate problems once you have it.",
  estimatedMinutes: 25,
  objectives: [
    "State the compaction invariant and use it to prove the loop correct",
    "Solve remove-element, dedupe, at-most-k and filter with one skeleton",
    "Choose between stable compaction and swap-with-the-end",
    "Return a length rather than a new array, and know why the problem asks for that",
  ],
  sections: [
    {
      id: "the-shape",
      heading: "Two indices moving at different speeds",
      body: [
        "Here is the first genuine *pattern* in the track, as opposed to a technique. It has a shape you will recognise on sight after this lesson.",
        "The problem: remove some elements from an array, in place, using no extra space. The obvious approach — shift everything left whenever you delete something — is O(n) per deletion and O(n²) overall. The pattern does it in one pass.",
        "**Use two indices. `read` visits every element exactly once. `write` marks where the next kept element goes.** They start together; `read` advances every iteration; `write` advances only when something is kept. The gap between them is exactly the number of elements discarded so far.",
        "**The invariant** — the sentence that makes it correct, and the sentence to say out loud in an interview: *`a[0:write]` contains every element kept so far, in their original order.* It is true before the loop starts, since both are zero and the empty prefix trivially contains nothing. Each iteration preserves it. So it is true at the end, when `read` has seen everything — and \"everything kept, in order\" is the answer.",
      ],
      examples: [
        {
          id: "trace",
          title: "The two pointers, traced",
          lang: "python",
          code: `def move_zeroes(a):
    """Invariant: a[0:write] holds every kept element so far, in order."""
    write = 0
    print(f"  {'read':>4} {'value':>5} {'keep?':>6} {'write':>5}   array")
    print("  " + "-" * 46)
    for read in range(len(a)):
        value = a[read]
        keep = value != 0
        if keep:
            a[write], a[read] = a[read], a[write]
            write += 1
        print(f"  {read:>4} {value:>5} {str(keep):>6} {write:>5}   {a}")
    return write


print("move every zero to the end, keeping the order of the rest")
data = [0, 1, 0, 3, 12]
print(f"  start: {data}")
kept = move_zeroes(data)
print(f"  final: {data}   kept {kept} non-zero values in a[0:{kept}]")`,
          output: `move every zero to the end, keeping the order of the rest
  start: [0, 1, 0, 3, 12]
  read value  keep? write   array
  ----------------------------------------------
     0     0  False     0   [0, 1, 0, 3, 12]
     1     1   True     1   [1, 0, 0, 3, 12]
     2     0  False     1   [1, 0, 0, 3, 12]
     3     3   True     2   [1, 3, 0, 0, 12]
     4    12   True     3   [1, 3, 12, 0, 0]
  final: [1, 3, 12, 0, 0]   kept 3 non-zero values in a[0:3]`,
          explanation:
            "Watch `write` fall behind `read` at row 0 and stay behind. That gap — one, then one, then two — is the count of zeroes seen. This version *swaps* rather than assigns, which is what makes the zeroes accumulate neatly at the end rather than being left as stale copies; if the problem only asks for the first `k` elements and does not care what follows, a plain `a[write] = a[read]` is fine and one operation cheaper. Note that the swap is harmless when `write == read`, which is the case for the whole prefix before the first zero.",
        },
      ],
      pitfalls: [
        {
          title: "Advancing `write` unconditionally",
          body: "If `write += 1` sits outside the `if`, the two pointers never separate and the loop copies each element onto itself — a no-op that leaves the array untouched and returns the original length. It is a one-character mistake and the symptom is that the function appears to do nothing at all, which sends people looking at the predicate instead of the increment.",
        },
      ],
    },
    {
      id: "one-skeleton",
      heading: "One skeleton, four problems",
      body: [
        "What makes this a pattern rather than a solution is that the loop never changes. Only the predicate does — the single line that decides whether the current element is kept.",
        "That is worth internalising, because these are four separately-numbered problems on every sheet in existence, and they are one problem.",
      ],
      examples: [
        {
          id: "skeleton",
          title: "The loop is fixed; the predicate is the problem",
          lang: "python",
          code: `def compact(a, keep):
    """The whole pattern. Only \`keep(a, write, read)\` changes between problems."""
    write = 0
    for read in range(len(a)):
        if keep(a, write, read):
            a[write] = a[read]
            write += 1
    return write


cases = [
    ("remove every 3",
     [3, 2, 2, 3, 1, 3],
     lambda a, w, r: a[r] != 3),
    ("dedupe a sorted array",
     [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
     lambda a, w, r: w == 0 or a[r] != a[w - 1]),
    ("keep at most two of each",
     [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
     lambda a, w, r: w < 2 or a[r] != a[w - 2]),
    ("drop the negatives",
     [-1, 5, -3, 0, 7, -8],
     lambda a, w, r: a[r] >= 0),
]

for name, data, keep in cases:
    before = str(data)
    k = compact(data, keep)
    print(f"{name}")
    print(f"    in  {before}")
    print(f"    out k={k}  a[0:k]={data[:k]}")`,
          output: `remove every 3
    in  [3, 2, 2, 3, 1, 3]
    out k=3  a[0:k]=[2, 2, 1]
dedupe a sorted array
    in  [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
    out k=5  a[0:k]=[0, 1, 2, 3, 4]
keep at most two of each
    in  [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
    out k=9  a[0:k]=[0, 0, 1, 1, 2, 2, 3, 3, 4]
drop the negatives
    in  [-1, 5, -3, 0, 7, -8]
    out k=3  a[0:k]=[5, 0, 7]`,
          explanation:
            "The two middle predicates are the interesting ones, and they are worth reading slowly. **Both compare against the output, not the input** — `a[w - 1]` is the last element already kept, and `a[w - 2]` is the one before it. That is why the at-most-two version generalises to at-most-k by changing a single digit: keeping k copies means checking whether the k-th most recent survivor already has this value. Comparing against `a[r - 1]` instead would be comparing against the input, which fails as soon as a run is longer than the limit.",
        },
      ],
    },
    {
      id: "order",
      heading: "When the order does not matter",
      body: [
        "There is a second version of this, and the choice between them is a genuine trade rather than one being better.",
        "If the survivors do not have to keep their relative order, you can fill a hole by pulling in the last element rather than shifting: **swap with the end, shrink the end, and do not advance the read pointer** (because the element you just pulled in has not been examined yet).",
        "The stable version does one write per *kept* element. The swap version does one write per *removed* element. Which is cheaper depends entirely on which is rarer, and when removals are rare the difference is not subtle.",
      ],
      examples: [
        {
          id: "stable-vs-swap",
          title: "Stable compaction against swap-with-the-end",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int writes;

    /** Stable: survivors keep their relative order. */
    static int compactStable(int[] a, int drop) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] != drop) {
                a[write++] = a[read];
                writes++;
            }
        }
        return write;
    }

    /** Unstable: pull a survivor in from the end instead of shifting. */
    static int compactSwapEnd(int[] a, int drop) {
        int i = 0, n = a.length;
        while (i < n) {
            if (a[i] == drop) {
                a[i] = a[n - 1];
                writes++;
                n--;
            } else {
                i++;
            }
        }
        return n;
    }

    public static void main(String[] args) {
        int[] base = {3, 2, 2, 3, 1, 3, 5, 4};

        int[] a = base.clone();
        writes = 0;
        int k1 = compactStable(a, 3);
        System.out.printf("stable    k=%d  %s  writes=%d%n",
                k1, Arrays.toString(Arrays.copyOf(a, k1)), writes);

        int[] b = base.clone();
        writes = 0;
        int k2 = compactSwapEnd(b, 3);
        System.out.printf("swap-end  k=%d  %s  writes=%d%n",
                k2, Arrays.toString(Arrays.copyOf(b, k2)), writes);

        // now a case where almost nothing is removed
        int[] big = new int[100000];
        Arrays.fill(big, 1);
        big[0] = 3;

        int[] c = big.clone();
        writes = 0;
        compactStable(c, 3);
        int stableWrites = writes;

        int[] d = big.clone();
        writes = 0;
        compactSwapEnd(d, 3);
        int swapWrites = writes;

        System.out.println();
        System.out.println("100,000 elements, exactly one of them removed:");
        System.out.printf("  stable   writes = %,d%n", stableWrites);
        System.out.printf("  swap-end writes = %,d%n", swapWrites);
    }
}`,
          output: `stable    k=5  [2, 2, 1, 5, 4]  writes=5
swap-end  k=5  [4, 2, 2, 5, 1]  writes=3

100,000 elements, exactly one of them removed:
  stable   writes = 99,999
  swap-end writes = 1`,
          explanation:
            "**Same k, different arrays** — both answers are correct for a problem that says order does not matter, and only one is correct for a problem that says it does. The second measurement is the reason to know the trick: 99,999 writes against 1, for the same result. Both loops are still O(n), because both still *read* every element; what changed is the number of writes, which is a constant factor and occasionally a large one. In the stable version the `a[write++] = a[read]` when `write == read` is a genuine write of an element onto itself, and guarding it with `if (write != read)` is a legitimate small saving.",
        },
      ],
      pitfalls: [
        {
          title: "Advancing the index after a swap-with-the-end",
          body: "The element pulled in from the end has not been tested yet, so the loop must re-examine the same position. Writing this as a `for` loop with an unconditional `i++` skips it, and the bug only shows when two removable elements end up adjacent after a swap — which is exactly the case a small hand-written test misses. Use a `while` with the increment inside the `else`, as above.",
        },
      ],
    },
    {
      id: "why-a-length",
      heading: "Why the problem asks for a length",
      body: [
        "These problems return an integer `k` and promise nothing about the array beyond index `k`. That looks like a quirk of the judge and it is not.",
        "**An array cannot be resized.** Its length is fixed at allocation, in Java literally and in Python effectively for this purpose, so \"remove in place\" cannot mean \"produce a shorter array\" — there is no such operation. It has to mean \"arrange the survivors at the front and tell me how many there are\", which is precisely what `(array, length)` is: the same pair a dynamic array keeps internally.",
        "So the signature is teaching you the representation. When you get to implementing your own growable structures, `(buffer, size)` with unused capacity beyond `size` is the whole idea, and this is the first place you meet it.",
        "**In an interview**, say what you are leaving behind: \"the first k elements are the answer, and I make no promises about the rest.\" It is the difference between looking like you finished and looking like you knew what you were doing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you remove elements from an array in place in one pass?",
      answer:
        "Two indices. A read pointer visits every element once; a write pointer marks where the next surviving element goes. Advance read every iteration, advance write only when you keep something, and copy `a[read]` to `a[write]` when you do. The invariant is that `a[0:write]` holds every kept element so far in order — true at the start with both at zero, preserved by each iteration, and therefore true at the end. It is O(n) time and O(1) space, against O(n²) for the shift-everything-left approach.",
    },
    {
      question: "Dedupe a sorted array in place. What does the comparison compare against?",
      answer:
        "Against the output, not the input: keep `a[read]` when `write == 0` or `a[read] != a[write - 1]`, where `a[write - 1]` is the last element already kept. That generalises immediately — allowing at most k copies of each value means comparing against `a[write - k]`, so at-most-two is a single changed digit. Comparing against `a[read - 1]` instead looks equivalent and breaks as soon as a run is longer than the limit, because the input still contains the duplicates the output has already dropped.",
    },
    {
      question: "When would you swap with the last element instead of compacting?",
      answer:
        "When the order of the survivors does not matter. Instead of shifting, overwrite the removable element with the last one and shrink the logical length — and do not advance the index, because the element you pulled in has not been examined. It costs one write per *removed* element rather than one per *kept* element, which for 100,000 elements with a single removal measures as 1 write against 99,999. Both are O(n) since both read everything; the difference is constant factor. The catch is that it destroys the original ordering, so it is wrong for anything that says \"preserve relative order\".",
    },
  ],
  takeaways: [
    "read visits everything; write marks where the next survivor goes",
    "The gap between them is exactly how many elements have been discarded",
    "Invariant: a[0:write] holds every kept element so far, in order",
    "The loop never changes between problems — only the keep predicate does",
    "Dedupe compares against a[write-1]; at-most-k compares against a[write-k]",
    "Compare against the output, never the input",
    "Swap-with-the-end costs one write per removal, but destroys the order",
    "Returning a length is not a quirk — an array cannot be resized",
  ],
  status: "available",
};
