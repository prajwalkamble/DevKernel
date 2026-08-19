import type { Problem } from "../types";

export const slidingWindowProblems: Problem[] = [
  {
    id: "best-time-to-buy-and-sell-stock",
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    topics: ["arrays", "dynamic-programming"],
    patterns: ["brute-force-enumeration", "two-pointers-same-direction", "dp-one-dimension"],
    companies: ["Amazon", "Microsoft", "Meta", "Apple", "Goldman Sachs", "Zoho"],
    prompt: "Buy on one day and sell on a later one, for the largest profit.",
    statement: [
      "You are given an array `prices` where `prices[i]` is the price of a stock on day i.",
      "You want to maximise your profit by choosing a single day to buy and a **different, later** day to sell. Return the maximum profit you can achieve; if no profit is possible, return 0.",
    ],
    constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"],
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 1 at 1, sell on day 4 at 6. Note the largest price (6) and the smallest (1) happen to be in the right order here — that is not always true.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "Prices only fall, so every trade loses money. Not trading is allowed, and that is what the 0 means.",
      },
      { input: "prices = [2]", output: "0", explanation: "One day, so there is no later day to sell on." },
    ],
    signals: [
      "**\"A later day\"** is the constraint that makes this interesting. Otherwise the answer would just be max − min. The buy must come *before* the sell, so order matters and you cannot sort.",
      "**n up to 10⁵** rules out checking every (buy, sell) pair.",
      "**\"Return 0 if no profit is possible\"** means the empty trade is a legal answer. That is why `best` starts at 0 rather than at negative infinity.",
      "The shape is: for each position, I need something summarising everything before it. That is a running aggregate, and it is the same shape as prefix sums — the difference is that here the aggregate is a running minimum.",
    ],
    judge: {
      entry: "maxProfit",
      params: [
        { name: "prices", type: "int[]" },
      ],
      returns: "int",
      cases: [
        { args: [[7, 1, 5, 3, 6, 4]], expected: 5, visible: true },
        { args: [[7, 6, 4, 3, 1]], expected: 0, visible: true },
        { args: [[2]], expected: 0, visible: true },
        { args: [[1, 2]], expected: 1, note: "The smallest profitable case." },
        {
          args: [[3, 2, 6, 5, 0, 3]],
          expected: 4,
          note: "The cheapest day comes after the most profitable trade.",
        },
        { args: [[2, 4, 1]], expected: 2, note: "The lowest price is last, where it is useless." },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Try every buy day against every later sell day",
        intuition: [
          "The answer is one (buy, sell) pair with buy before sell, so enumerate them.",
          "The inner loop starting at `buy + 1` is exactly the 'later day' constraint, written as code.",
        ],
        time: "O(n²)",
        space: "O(1)",
        java: `class Solution {
    public int maxProfit(int[] prices) {
        int best = 0;
        for (int buy = 0; buy < prices.length; buy++) {
            for (int sell = buy + 1; sell < prices.length; sell++) {
                best = Math.max(best, prices[sell] - prices[buy]);
            }
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_profit(self, prices: list[int]) -> int:
        best = 0
        n = len(prices)
        for buy in range(n):
            for sell in range(buy + 1, n):
                best = max(best, prices[sell] - prices[buy])
        return best`,
        verdict:
          "5 × 10⁹ operations at the limit. But turn it around: instead of asking 'for each buy day, what is the best sell day?', ask 'for each sell day, what is the best buy day?'. The answer to the second question is just the cheapest price so far — one number, not a scan.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Track the cheapest price seen so far",
        intuition: [
          "Flip the loop. Treat each day as the day you sell.",
          "If you are selling today, the best you could have done is to have bought at the lowest price on any earlier day. That is a single number, and it is updatable in O(1) as you go.",
          "So carry `cheapest`, the minimum price seen so far, and at every day compute `price - cheapest` as the profit if you sold today. The largest of those is the answer.",
          "The order inside the loop matters and is worth pausing on. Updating `cheapest` *before* computing the profit means today's price is eligible as its own buy price — giving a profit of 0 on that day, never negative. Since not trading at all is allowed and also yields 0, that is exactly right, and it removes the need for any special case.",
          "This is one-dimensional DP in disguise: `best[i]` = the best profit selling on or before day i, and it depends only on `best[i-1]` and the running minimum. Recognising it as such is what makes the harder variants of this problem tractable.",
        ],
        walkthrough: [
          "`cheapest = +∞`, `best = 0`.",
          "For each price: `cheapest = min(cheapest, price)`, then `best = max(best, price - cheapest)`.",
          "Return `best`.",
        ],
        time: "O(n) — one pass",
        space: "O(1)",
        java: `class Solution {
    public int maxProfit(int[] prices) {
        int cheapest = Integer.MAX_VALUE;
        int best = 0;
        for (int price : prices) {
            cheapest = Math.min(cheapest, price);
            best = Math.max(best, price - cheapest);
        }
        return best;
    }
}`,
        python: `class Solution:
    def max_profit(self, prices: list[int]) -> int:
        cheapest = float("inf")
        best = 0
        for price in prices:
            cheapest = min(cheapest, price)
            best = max(best, price - cheapest)
        return best`,
        verdict:
          "Optimal: you must read every price to know it is not the answer, so O(n) is the floor, and this uses two variables. In Java, note that `cheapest` starts at `Integer.MAX_VALUE` and the subtraction happens only after the `min`, so there is no overflow — reversing the two lines would introduce one.",
      },
    ],
    followUps: [
      "What if you could trade as many times as you liked? Then the answer is the sum of every upward step — greedy, still one pass.",
      "What if you were limited to two transactions, or to k? That is real DP: track the best profit in each of the 2k states, which is Best Time to Buy and Sell Stock III and IV.",
      "What if you had to report the buy and sell days? Record the index whenever `cheapest` updates and whenever `best` updates — but track them separately, since the buy day is the one that produced the current minimum, not the current day.",
    ],
    related: ["maximum-subarray", "product-of-array-except-self"],
  },
  {
    id: "longest-substring-without-repeating-characters",
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topics: ["strings", "hashing"],
    patterns: ["brute-force-enumeration", "sliding-window-variable", "hashing-for-lookup"],
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Adobe", "Bloomberg", "Flipkart"],
    prompt: "Find the longest stretch of a string in which no character repeats.",
    statement: [
      "Given a string `s`, find the length of the longest **substring** without repeating characters.",
      "A substring is a contiguous, non-empty sequence of characters.",
    ],
    constraints: ["0 ≤ s.length ≤ 5 × 10⁴", "`s` consists of English letters, digits, symbols and spaces"],
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: '"abc", starting at index 0.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The best you can do is a single "b".' },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: '"wke". Note that "pwke" is a subsequence, not a substring — it is not contiguous, so it does not count.',
      },
      {
        input: 's = "abba"',
        output: "2",
        explanation:
          'The killer case. Having consumed "abb", the left edge sits after the first "b". When the final "a" arrives, its last-seen index is 0 — which is *behind* the left edge and therefore stale. Jumping the left edge back to 1 would be wrong; that is the bug this example exists to catch.',
      },
    ],
    signals: [
      "**\"Substring\"**, not subsequence. Contiguous. That one word is what makes this a window problem — if it said subsequence, no window would apply.",
      "**\"Longest … such that a condition holds\"** is the variable-size sliding window signature almost verbatim.",
      "**The condition is monotone**: if a stretch already contains a repeat, extending it cannot remove that repeat. That is precisely what licenses the grow-right/shrink-left sweep.",
      "**\"Letters, digits, symbols and spaces\"** — not just lowercase. So a 26-element array is wrong here; you need a real map or a 128-entry ASCII table.",
    ],
    judge: {
      entry: "lengthOfLongestSubstring",
      params: [
        { name: "s", type: "string" },
      ],
      returns: "int",
      cases: [
        { args: ["abcabcbb"], expected: 3, visible: true },
        { args: ["bbbbb"], expected: 1, visible: true },
        { args: ["pwwkew"], expected: 3, visible: true },
        { args: ["abba"], expected: 2, visible: true },
        { args: [" "], expected: 1, note: "A single space is still a character." },
        {
          args: ["dvdf"],
          expected: 3,
          note: "The repeat is behind the window, so the left edge must not move back.",
        },
        {
          args: ["tmmzuxt"],
          expected: 5,
          note: "The answer starts after a repeat and ends on one.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Every start, extended until it repeats",
        intuition: [
          "For each starting index, extend rightwards with a set of the characters used, and stop at the first repeat.",
          "The `break` is doing something important: once a start has hit a repeat, no longer substring from that start can work, so there is no reason to continue. That observation is the seed of the linear solution.",
        ],
        time: "O(n²) in the worst case",
        space: "O(min(n, alphabet))",
        java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            Set<Character> window = new HashSet<>();
            for (int j = i; j < s.length(); j++) {
                if (!window.add(s.charAt(j))) {
                    break;
                }
                best = Math.max(best, j - i + 1);
            }
        }
        return best;
    }
}`,
        python: `class Solution:
    def length_of_longest_substring(self, s: str) -> int:
        best = 0
        for i in range(len(s)):
            window: set[str] = set()
            for j in range(i, len(s)):
                if s[j] in window:
                    break
                window.add(s[j])
                best = max(best, j - i + 1)
        return best`,
        verdict:
          "Correct, and it rebuilds the set from scratch for every start — throwing away, n times over, work it just did. The next start is almost the same window as the last one; that is what the sliding window exploits.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "Sliding window with last-seen indices",
        intuition: [
          "Keep a window `[left, right]` that is always valid — that is, always free of repeats. Its width is then a candidate answer at every step, with no checking needed.",
          "Extend `right` one character at a time. If the new character is already inside the window, the window is no longer valid, and the only way to fix it is to move `left` past that character's previous occurrence.",
          "Store, for each character, the index it was **last** seen at. That turns 'how far must `left` jump?' into a lookup rather than a scan — the naive version walks `left` forward one step at a time, which is still O(n) overall but does more work than needed.",
          "Now the trap, and it is the one that catches nearly everybody: a last-seen index can be **stale**. On `\"abba\"`, when the final `a` arrives its last-seen index is 0, but `left` is already at 2. Jumping `left` back to 1 would *grow* the window and break the invariant. The guard `prev >= left` is what rejects a stale entry — and it is why the answer for `\"abba\"` is 2 rather than 3.",
          "`left` only ever moves forward. That is the whole reason this is O(n): each index is entered once and left once, so the two pointers make at most 2n moves between them.",
        ],
        walkthrough: [
          "`lastSeen` empty, `left = 0`, `best = 0`.",
          "For each `right`, let `c = s[right]`.",
          "If `c` was seen at index `prev` and `prev >= left`, set `left = prev + 1`.",
          "Record `lastSeen[c] = right`, then `best = max(best, right - left + 1)`.",
        ],
        time: "O(n) — one pass, each pointer moving forward only",
        space: "O(min(n, alphabet size))",
        java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0;
        int left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            Integer prev = lastSeen.get(c);
            if (prev != null && prev >= left) {
                left = prev + 1;
            }
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
        python: `class Solution:
    def length_of_longest_substring(self, s: str) -> int:
        last_seen: dict[str, int] = {}
        best = 0
        left = 0
        for right, c in enumerate(s):
            if c in last_seen and last_seen[c] >= left:
                left = last_seen[c] + 1
            last_seen[c] = right
            best = max(best, right - left + 1)
        return best`,
        verdict:
          "Optimal. The empty string falls out correctly with no special case — the loop simply never runs and `best` stays 0. Say the invariant out loud when you present this: 'the window is always repeat-free, so its width is always a candidate.' That sentence is the solution.",
      },
    ],
    followUps: [
      "At most k distinct characters instead of zero repeats? Same skeleton, but the window needs counts rather than last-seen indices, and `left` walks forward rather than jumping.",
      "What if you had to return the substring itself? Record `left` whenever `best` updates.",
      "Why does `left` never move backwards, and why does that matter? Because a valid window can only be invalidated from the right, so the fix is always to shrink from the left. If `left` could move backwards the analysis would collapse and this would not be linear.",
    ],
    related: ["valid-anagram", "two-sum"],
  },
];
