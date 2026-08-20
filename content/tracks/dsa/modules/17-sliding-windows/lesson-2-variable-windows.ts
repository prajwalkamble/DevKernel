import type { Lesson } from "@/content/types";

export const variableWindowsLesson: Lesson = {
  id: "dsa-sw-variable",
  slug: "variable-size-windows",
  moduleSlug: "sliding-windows",
  title: "Variable-Size Windows: Grow Right, Shrink Left",
  summary:
    "The shape that solves the whole family. One loop over the right edge, an inner while that moves the left edge, and an amortised argument that the two-loop structure is still linear.",
  estimatedMinutes: 35,
  objectives: [
    "Write the grow-right shrink-left skeleton from memory",
    "Choose between shrinking while invalid and shrinking while valid",
    "Prove the nested loop is O(n), not O(n²)",
    "Record the answer at the right moment for longest and for shortest",
  ],
  sections: [
    {
      id: "the-skeleton",
      heading: "The skeleton",
      body: [
        "Every variable window is this, and the only decisions are what the state is and what the condition says:",
        "*For each `right`: add `a[right]` to the state. While the window needs fixing, remove `a[left]` and advance `left`. Record the answer.*",
        "There are two families, and they differ in one word.",
        "**Longest valid window** — shrink **while the window is invalid**. The inner loop restores validity, so after it the window is the longest valid one ending at `right`. Record after shrinking.",
        "**Shortest valid window** — shrink **while the window is still valid**. Each shrink step is a candidate answer, so you record *inside* the inner loop, before removing.",
        "Getting these the wrong way round is the most common bug in the pattern, and it produces plausible answers rather than crashes.",
      ],
      examples: [
        {
          id: "variable",
          title: "Longest and shortest, side by side",
          lang: "python",
          code: `def longest_no_repeat(s, trace=False):
    """Variable window: grow right always, shrink left while invalid."""
    last = {}
    left = 0
    best = 0
    best_str = ""
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            if trace:
                print(f"  right={right} '{ch}' repeats -> left {left} => {last[ch] + 1}")
            left = last[ch] + 1
        last[ch] = right
        if right - left + 1 > best:
            best = right - left + 1
            best_str = s[left:right + 1]
        if trace:
            print(f"  window '{s[left:right + 1]}' len={right - left + 1}")
    return best, best_str

for s in ("abcabcbb", "bbbbb", "pwwkew", ""):
    n, sub = longest_no_repeat(s)
    print(f"{s!r:12} -> {n}  {sub!r}")

print("\\ntrace for 'pwwkew':")
longest_no_repeat("pwwkew", trace=True)

def min_subarray_len(target, nums):
    """Smallest window with sum >= target. Shrink while STILL valid."""
    left = 0
    total = 0
    best = None
    for right, v in enumerate(nums):
        total += v
        while total >= target:
            span = right - left + 1
            best = span if best is None else min(best, span)
            total -= nums[left]
            left += 1
    return best or 0

print("\\nminimum length with sum >= 7:")
for xs in ([2,3,1,2,4,3], [1,4,4], [1,1,1,1,1,1,1,1]):
    print(f"  {str(xs):26} -> {min_subarray_len(7, xs)}")`,
          output: `'abcabcbb'   -> 3  'abc'
'bbbbb'      -> 1  'b'
'pwwkew'     -> 3  'wke'
''           -> 0  ''

trace for 'pwwkew':
  window 'p' len=1
  window 'pw' len=2
  right=2 'w' repeats -> left 0 => 2
  window 'w' len=1
  window 'wk' len=2
  window 'wke' len=3
  right=5 'w' repeats -> left 2 => 3
  window 'kew' len=3

minimum length with sum >= 7:
  [2, 3, 1, 2, 4, 3]         -> 2
  [1, 4, 4]                  -> 2
  [1, 1, 1, 1, 1, 1, 1, 1]   -> 7`,
          explanation:
            "The `longest` version uses a **jump** rather than a loop: seeing a repeat, `left` moves straight to just past the previous occurrence. That is an optimisation of the same shrink — the `while` version, decrementing counts one at a time, is equally correct and easier to adapt.\n\nThe `last[ch] >= left` guard is essential. `'pwwkew'` at `right=5` sees a `w` last seen at index 2, but `left` is already 2 — so the character is *not* in the current window and moving `left` backwards would be wrong. Without that check, `left` can go backwards and the algorithm breaks.\n\nIn `min_subarray_len` the answer is recorded **before** shrinking, inside the loop. Each iteration of that inner while is a genuinely valid window, and the smallest of them is the one you want.",
        },
      ],
      visual: {
        id: "window-visual",
        kind: "pattern",
        algorithm: "window",
        lockAlgorithm: true,
        title: "Grow right, shrink left",
      },
    },
    {
      id: "amortised",
      heading: "Why a nested loop is still O(n)",
      body: [
        "It looks quadratic: a `for` over `right` with a `while` over `left` inside. It is not, and the argument is the same amortised one the arrays module used for cyclic sort.",
        "**`left` only ever increases, and it can never exceed `n`.** The inner `while` may run many times on one iteration and zero times on the next, but summed over the entire outer loop it executes at most `n` times in total. So the two pointers together do at most `2n` moves.",
        "Say this out loud in an interview. \"The inner loop looks nested but `left` is monotonic, so the total work is O(n)\" is the sentence that gets the complexity question right, and people who have only memorised the shape cannot produce it.",
      ],
      pitfalls: [
        {
          title: "Recording the answer in the wrong place",
          body: "For a *longest* window, record after the inner loop, when the window is valid again. For a *shortest*, record inside it, while the window is still valid. Swap them and you will report the longest invalid window or miss the smallest valid one — and both bugs return numbers that look reasonable.",
        },
        {
          title: "Letting `left` move backwards",
          body: "In the jump form, always guard with `last[ch] >= left`. A character last seen *before* the window started is not in the window, and jumping to it un-shrinks the window and breaks the monotonic argument the complexity depends on.",
        },
        {
          title: "Returning `best` when nothing was ever valid",
          body: "`min_subarray_len` returns `best or 0` because the problem asks for 0 when no window qualifies. Initialising `best` to zero instead would make every answer zero, since `min` would never beat it.",
        },
      ],
    },
  ],
  takeaways: [
    "Grow right always; shrink left in an inner while",
    "Longest: shrink while invalid, record after. Shortest: shrink while valid, record inside",
    "`left` is monotonic, so the nested loop is O(n) amortised — say this out loud",
    "Guard a left-jump with `last[ch] >= left` or the window can un-shrink",
    "Initialise the best-so-far so that \"never valid\" is distinguishable",
  ],
  status: "available",
};
