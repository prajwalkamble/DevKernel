import type { Lesson } from "@/content/types";

export const offByOneLesson: Lesson = {
  id: "dsa-flow-off-by-one",
  slug: "off-by-one-and-the-fence-post",
  moduleSlug: "conditional-statements-and-loops",
  title: "Off-by-One Errors & the Fence-Post Problem",
  summary:
    "Why n posts hold n−1 rails, the four places the mistake actually appears, and the half-open convention that removes most of them by construction.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the fence-post problem and recognise it in code",
    "Convert between inclusive and exclusive bounds without error",
    "Compute the length of a range and the midpoint of one correctly",
    "Use the half-open convention deliberately rather than by habit",
  ],
  sections: [
    {
      id: "fence-post",
      heading: "The fence-post problem",
      body: [
        "A fence 10 metres long with a post every metre needs **11 posts**, not 10 — one at each end plus nine between. Count the gaps and you get 10; count the posts and you get 11. Confusing the two is the origin of most off-by-one errors, and the reason they feel so hard to see: both numbers are correct answers, to different questions.",
        "In code the same pair shows up constantly. The number of elements from index `a` to index `b` **inclusive** is `b - a + 1`. The number of *gaps* between them is `b - a`. Whether you want posts or rails is a question about the problem, not about the syntax.",
      ],
      examples: [
        {
          id: "posts-and-rails",
          title: "Counting both",
          lang: "python",
          code: `values = ["a", "b", "c", "d", "e"]
lo, hi = 1, 3

inclusive = values[lo:hi + 1]
print("values[1..3] inclusive:", inclusive, "count:", hi - lo + 1)

half_open = values[lo:hi]
print("values[1..3) half-open:", half_open, "count:", hi - lo)

print("adjacent pairs:")
for i in range(len(values) - 1):
    print(" ", values[i], values[i + 1])
print("pair count:", len(values) - 1)`,
          output: `values[1..3] inclusive: ['b', 'c', 'd'] count: 3
values[1..3) half-open: ['b', 'c'] count: 2
adjacent pairs:
  a b
  b c
  c d
  d e
pair count: 4`,
          explanation:
            "Five values give four adjacent pairs — posts and rails again. Note the loop bound: `range(len(values) - 1)` is correct precisely because the body touches `i` and `i + 1`, so the last legal `i` is one before the end. Writing `range(len(values))` there is the single most common off-by-one in this track, and it crashes on the final pass.",
        },
      ],
    },
    {
      id: "four-places",
      heading: "The four places it appears",
      body: [
        "Off-by-one errors are not random. They occur in four specific places, and knowing the list means you check four things rather than staring at the whole loop.",
        "**The loop bound.** `<` against `<=`. Over a zero-indexed collection of length n, the last valid index is n − 1, so the condition is `i < n`. `i <= n` runs one pass too many and crashes; `i < n - 1` runs one too few and silently misses the last element.",
        "**The starting value.** 0 against 1. Zero for indices, one when the problem is counted from one, and the mistake is mixing the two in one function.",
        "**The slice or sub-range end.** Inclusive against exclusive, which is the fence-post question directly.",
        "**The size of a derived collection.** n items give n − 1 gaps, n − 1 adjacent pairs, n(n−1)/2 unordered pairs. Allocating an array of the wrong one of those is an off-by-one that appears as a crash much later.",
      ],
      examples: [
        {
          id: "bound-comparison",
          title: "All three loop bounds, side by side",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int[] values = { 10, 20, 30 };

        System.out.print("i < n     :");
        for (int i = 0; i < values.length; i++) System.out.print(" " + values[i]);
        System.out.println();

        System.out.print("i < n - 1 :");
        for (int i = 0; i < values.length - 1; i++) System.out.print(" " + values[i]);
        System.out.println("   <- missed the last one");

        System.out.print("i <= n    :");
        try {
            for (int i = 0; i <= values.length; i++) System.out.print(" " + values[i]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("   <- crashed at index " + values.length);
        }
    }
}`,
          output: `i < n     : 10 20 30
i < n - 1 : 10 20   <- missed the last one
i <= n    : 10 20 30   <- crashed at index 3`,
          explanation:
            "The three bounds and their three outcomes. The crash is the *good* case — it announces itself. The silent version, `i < n - 1`, produced plausible output that is simply missing an element, and on a large array nothing tells you. That asymmetry is why `< n - 1` deserves a second look every time you write it.",
        },
      ],
    },
    {
      id: "half-open",
      heading: "The half-open convention",
      body: [
        "Both languages, and most of computing, use **half-open ranges**: the start is included and the end is excluded. `range(a, b)`, `values[a:b]`, `subList(a, b)` and `Arrays.copyOfRange(a, b)` all work this way.",
        "This is not a quirk. Three properties fall out of it and each removes a class of error.",
        "**The length is `b - a`.** No `+ 1`, so no `+ 1` to misplace.",
        "**Ranges compose.** `[a, b)` and `[b, c)` join to `[a, c)` exactly, with the boundary appearing once as an end and once as a start. With inclusive ends you must remember to write `b + 1` for the second range.",
        "**The empty range is expressible.** `[a, a)` is empty and needs no special case, where an inclusive `[a, a]` always contains one element and \"empty\" has to be signalled some other way.",
        "Adopt it deliberately: **when you invent your own bounds, make them half-open.** Two-pointer problems and sliding windows both go wrong far less often when `hi` means \"one past the last\" than when it means \"the last\".",
      ],
      examples: [
        {
          id: "half-open",
          title: "The three properties, demonstrated",
          lang: "python",
          code: `n = 10
a, b, c = 2, 5, 9

print("length:", len(range(a, b)), "==", b - a)

left = list(range(a, b))
right = list(range(b, c))
print("compose:", left + right == list(range(a, c)))

print("empty  :", list(range(a, a)))

values = list("abcdefghij")
print(values[a:b], values[b:c])
print(values[a:b] + values[b:c] == values[a:c])
print("whole  :", values[0:n] == values)`,
          output: `length: 3 == 3
compose: True
empty  : []
['c', 'd', 'e'] ['f', 'g', 'h', 'i']
True
whole  : True
`,
          explanation:
            "Every line is a property you get for free. The composition one is the most useful in practice: splitting a range at `b` needs no adjustment on either side, which is exactly what merge sort, binary search and every divide-and-conquer algorithm does constantly. With inclusive bounds each of those splits needs a `± 1` you have to get right.",
        },
      ],
      pitfalls: [
        {
          title: "Mixing conventions in one function",
          body: "Binary search with an inclusive `hi = len - 1` and a `while lo <= hi` is correct. So is an exclusive `hi = len` with `while lo < hi`. Mixing them — `hi = len` with `lo <= hi` — indexes past the end. Pick one convention per function, write it in a comment, and keep every bound consistent with it.",
        },
      ],
    },
    {
      id: "checking",
      heading: "Three checks that find them without running anything",
      body: [
        "Off-by-one errors are cheap to find if you look in the right places, and all three checks take seconds.",
        "**Check the first pass.** Substitute the starting value by hand. Does the body do the right thing for it? Is the first element included?",
        "**Check the last pass.** What is the largest value the counter takes? Substitute it. Is that index valid, and is the last element included?",
        "**Check the empty case.** What happens when the collection has zero elements, or one? A loop that assumes at least two — anything touching `i` and `i + 1` — needs an explicit answer for the single-element input.",
        "The last one is the most productive, because it is the case that both crashes and gets left out of hand-written tests.",
      ],
      examples: [
        {
          id: "boundary-checks",
          title: "The same function against the three checks",
          lang: "python",
          code: `def is_sorted(values):
    for i in range(len(values) - 1):
        if values[i] > values[i + 1]:
            return False
    return True


cases = [
    [],
    [1],
    [1, 2],
    [2, 1],
    [1, 2, 3],
    [1, 3, 2],
]
for case in cases:
    print(f"{str(case):<12} -> {is_sorted(case)}")`,
          output: `[]           -> True
[1]          -> True
[1, 2]       -> True
[2, 1]       -> False
[1, 2, 3]    -> True
[1, 3, 2]    -> False
`,
          explanation:
            "The bound `len(values) - 1` is doing real work at both ends. For the empty list it is −1, so `range(-1)` is empty and the loop never runs — returning `True`, which is the mathematically correct answer for an empty sequence. For one element it is 0, so again no passes. Neither case needed a special branch, because the bound was right; that is what a correct bound buys you.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the fence-post problem?",
      answer:
        "A fence of length 10 with posts every metre needs 11 posts — the gaps and the posts are different counts, and confusing them is the origin of most off-by-one errors. In code, the elements from index `a` to `b` inclusive number `b - a + 1` while the gaps between them number `b - a`. Which you want is determined by the problem: iterating adjacent pairs of n elements gives n − 1 pairs, so the loop bound is `len - 1` rather than `len`.",
    },
    {
      question: "Why do most languages use half-open ranges?",
      answer:
        "Because three useful properties follow. The length of `[a, b)` is exactly `b - a` with no adjustment, so there is no `+ 1` to misplace. Adjacent ranges compose exactly — `[a, b)` and `[b, c)` join to `[a, c)` with the boundary written once — which is what every divide-and-conquer split needs. And the empty range `[a, a)` is expressible without a special case, where an inclusive range always contains at least one element.",
    },
    {
      question: "How do you check a loop bound without running the code?",
      answer:
        "Substitute three values by hand. The first: does the body behave correctly for the starting index, and is the first element included? The last: what is the largest value the counter takes, is that index valid, and is the final element covered? And the empty or single-element input: a loop touching `i` and `i + 1` must have an answer for a one-element collection. The third is the most productive, because it is both the one that crashes and the one people omit from their tests.",
    },
  ],
  takeaways: [
    "Posts and rails: n items have n − 1 gaps, and both are correct answers to different questions",
    "Four places the error lives: the bound, the start, the range end, and the size of a derived collection",
    "`i < n` is right; `i <= n` crashes and `i < n - 1` silently drops the last element",
    "The silent one is more dangerous than the crash",
    "Half-open ranges make the length `b - a`, compose exactly, and can be empty",
    "Pick one bound convention per function and write it in a comment",
    "Check the first pass, the last pass, and the empty or single-element input",
    "A loop touching `i` and `i + 1` must stop at `len - 1`",
  ],
};
