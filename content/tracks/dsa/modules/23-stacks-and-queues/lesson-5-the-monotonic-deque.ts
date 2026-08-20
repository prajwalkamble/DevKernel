import type { Lesson } from "@/content/types";

export const monotonicDequeLesson: Lesson = {
  id: "dsa-sq-mono-deque",
  slug: "the-monotonic-deque",
  moduleSlug: "stacks-and-queues",
  title: "The Monotonic Deque",
  summary:
    "Sliding-window maximum in O(n). The deque is needed rather than a stack because two different things must be discarded — values that have expired, and values that can never win again.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why a heap gives O(n log k) and the deque gives O(n)",
    "Identify the two discard rules and which end each acts on",
    "Write sliding-window maximum correctly",
    "Recognise the problems this generalises to",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Maximum of every window",
      body: [
        "Given an array and a window size k, report the maximum of each window as it slides. The brute force is O(n·k).",
        "A max-heap does better: push each element, and take the top after discarding entries that have left the window. O(n log k), and it is a perfectly respectable answer.",
        "The deque gets O(n), and the reason it can is a domination argument. If `x` enters the window and there is an older element `y ≤ x` still inside, then **`y` can never be the maximum again** — every future window containing `y` also contains `x`, which is at least as large and survives longer. So `y` can be discarded immediately rather than kept and skipped over later.",
        "Apply that rule on arrival and the surviving elements are always in decreasing order, with the maximum at the front. The structure is a monotonic deque.",
      ],
      examples: [
        {
          id: "window-max",
          title: "Sliding window maximum",
          lang: "python",
          code: `from collections import deque

def sliding_window_max(nums, k):
    dq = deque()                     # indices, values decreasing
    out = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                 # smaller values can never win again
        dq.append(i)
        if dq[0] == i - k:
            dq.popleft()             # the front has left the window
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out

print(sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))
print(sliding_window_max([1], 1))
print(sliding_window_max([9, 8, 7, 6], 2))`,
          output: `[3, 3, 5, 5, 6, 7]
[1]
[9, 8, 7]`,
          explanation:
            "Two discards at **opposite ends**, which is exactly why a deque is required rather than a stack. From the **back**, values the newcomer dominates — they can never win again. From the **front**, the index that has just fallen out of the window. Only one element can expire per step, so the front check is an `if` and not a `while`. The strictly decreasing input `[9,8,7,6]` never triggers a back-discard, and every answer comes from an expiry instead.",
        },
      ],
      visual: {
        id: "deque-visual",
        kind: "deque",
        title: "Discarding from both ends as the window slides",
      },
    },
    {
      id: "the-two-rules",
      heading: "The two rules, kept apart",
      body: [
        "Keeping the two discard conditions distinct in your head is most of what makes this implementable.",
        "**Back — domination.** Before appending `i`, remove every index whose value is `<=` the new one. These are elements still inside the window that have been rendered irrelevant. This is a `while`, because one arrival can dominate many.",
        "**Front — expiry.** After appending, if the front index equals `i - k` it has just slid out. This is an `if`, because exactly one element leaves per step.",
        "The deque therefore holds indices that are **both still in the window and not yet dominated** — precisely the elements that could still be the answer for some future window. The front is the current maximum by construction.",
        "Total work is O(n) by the same amortised argument as the monotonic stack: each index is appended once and removed once, from one end or the other.",
      ],
      pitfalls: [
        {
          title: "Storing values instead of indices",
          body: "Expiry is a question about position — has this element left the window? — and a value cannot answer it. Store indices and read values through them. This is the same rule as the monotonic stack and for the same reason.",
        },
        {
          title: "Using a while for the front check",
          body: "Only one element leaves the window per step, so a `while` is harmless but misleading. More importantly, the check must be `dq[0] == i - k` and not `dq[0] < i - k + 1` written carelessly — an off-by-one here silently drops an element that is still in the window.",
        },
        {
          title: "Emitting an answer before the first full window",
          body: "The first complete window ends at index `k - 1`. Appending before that produces answers for partial windows, which is a different problem — and the resulting array is the right shape but shifted, which makes it look like an off-by-one in the algorithm rather than in the guard.",
        },
        {
          title: "<= versus < on the back discard",
          body: "With `<=`, equal values are discarded and the deque keeps only the newest of a run — which is correct, since the newest survives longest. With `<`, duplicates accumulate; still correct, but the deque grows. Prefer `<=` and know why.",
        },
      ],
    },
    {
      id: "generalising",
      heading: "Where else it applies",
      body: [
        "**Sliding Window Minimum** — the same code with the comparison flipped.",
        "**Shortest Subarray with Sum at Least K.** Prefix sums plus a monotonic deque, and the version that permits negative numbers — where the plain sliding window fails, as the prefix-sums lesson established. One of the hardest problems in this family and a good measure of whether the pattern has really landed.",
        "**Constrained Subsequence Sum.** A dynamic-programming recurrence whose transition needs the maximum over a window of previous states; the deque supplies it in O(1) amortised, turning O(n·k) into O(n). This is the most common way the pattern appears inside a DP.",
        "**Jump Game VI** — the same shape, and the friendlier introduction to it.",
        "**Max Value of Equation** — the window maximum of a derived quantity rather than of the array itself.",
        "The generalisation worth carrying: whenever an algorithm repeatedly needs *the extreme value over a sliding range*, and elements leave the range in the order they entered, the monotonic deque replaces a heap and removes the log factor. That combination — extreme over a window, FIFO expiry — is the signature to look for.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Sliding window maximum in O(n) — how?",
      answer:
        "A deque of indices with decreasing values. On arrival, discard from the back everything the newcomer is at least as large as, since those can never be the maximum again; then discard the front if it has left the window. The front is the current maximum. Each index enters and leaves once, so the pass is O(n).",
    },
    {
      question: "Why a deque rather than a stack?",
      answer:
        "Two different discards happen at opposite ends: dominated elements at the back, expired elements at the front. A stack only exposes one end, so it cannot do both.",
    },
    {
      question: "How does this compare with a heap?",
      answer:
        "A heap gives O(n log k) and is simpler to write. The deque gives O(n) by discarding dominated elements eagerly instead of storing them and skipping them later. Offer the heap first, then improve to the deque — that progression is what the question is usually probing.",
    },
  ],
  takeaways: [
    "An older element no larger than the newcomer can never win again",
    "Discard dominated values from the back, expired indices from the front",
    "Back discard is a while; front expiry is an if",
    "Store indices — expiry is a question about position",
    "Each index enters and leaves once, so the pass is O(n)",
    "Extreme-over-a-window plus FIFO expiry is the signature",
  ],
  status: "available",
};
