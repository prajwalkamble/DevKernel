import type { Problem } from "../types";

export const stackProblems: Problem[] = [
  {
    id: "valid-parentheses",
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    topics: ["strings", "stacks-queues"],
    patterns: ["brute-force-enumeration", "monotonic-stack"],
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Bloomberg", "Zoho", "Accenture"],
    prompt: "Decide whether a string of brackets is properly nested.",
    statement: [
      "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine whether the input is valid.",
      "A string is valid when every open bracket is closed by a bracket of the same type, and brackets close in the correct order.",
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "`s` consists only of the six bracket characters"],
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true", explanation: "Three independent pairs, side by side." },
      { input: 's = "(]"', output: "false", explanation: "Right count, wrong types." },
      {
        input: 's = "([)]"',
        output: "false",
        explanation:
          "The example that rules out counting. Every bracket type appears exactly twice, once open and once closed — but they interleave instead of nesting, so any counter-based solution wrongly says true.",
      },
      { input: 's = "]"', output: "false", explanation: "A closer with nothing open. The empty-stack check catches it." },
    ],
    signals: [
      "**\"In the correct order\"** and **\"properly nested\"** mean counting cannot work. `([)]` has balanced counts and is invalid; you need to know *which* bracket is currently innermost.",
      "**\"The most recently opened must close first\"** is last-in-first-out, spelled out. That is a stack, by definition rather than by cleverness.",
      "**A closer with nothing open** and **openers left over at the end** are two separate failure modes. Both need an explicit check, and forgetting the second one is the common bug: `\"(\"` must be false.",
      "n up to 10⁴ is small enough that almost anything passes — so this problem is not testing speed, it is testing whether you reach for the right structure.",
    ],
    judge: {
      entry: "isValid",
      params: [
        { name: "s", type: "string" },
      ],
      returns: "boolean",
      cases: [
        { args: ["()"], expected: true, visible: true },
        { args: ["()[]{}"], expected: true, visible: true },
        { args: ["(]"], expected: false, visible: true },
        { args: ["([)]"], expected: false, visible: true },
        { args: ["]"], expected: false, visible: true },
        {
          args: ["((("],
          expected: false,
          note: "Openers with nothing to close them — the check that happens after the loop.",
        },
        { args: ["{[]}"], expected: true, note: "Properly nested, two levels deep." },
        { args: ["(()[]{})"], expected: true, note: "Nesting and sequencing together." },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "Repeatedly delete adjacent pairs",
        intuition: [
          "A valid string always contains an innermost pair — two matching brackets side by side. Delete every such pair and repeat; a valid string collapses to nothing.",
          "Loop until a pass changes nothing. If what is left is empty, the string was valid.",
          "It is a genuine solution and a nice one to state, because it makes the nesting structure visible in a way counting never does.",
        ],
        time: "O(n²) — each pass is O(n) and there can be n/2 passes",
        space: "O(n) for the intermediate strings",
        java: `class Solution {
    public boolean isValid(String s) {
        int previousLength = -1;
        while (s.length() != previousLength) {
            previousLength = s.length();
            s = s.replace("()", "").replace("[]", "").replace("{}", "");
        }
        return s.isEmpty();
    }
}`,
        python: `class Solution:
    def is_valid(self, s: str) -> bool:
        previous_length = -1
        while len(s) != previous_length:
            previous_length = len(s)
            s = s.replace("()", "").replace("[]", "").replace("{}", "")
        return s == ""`,
        verdict:
          'Correct, and quadratic — on `"((((((…))))))"` it strips one pair per pass. It also allocates a fresh string every time. But notice what it is really doing: repeatedly matching the innermost pair. Do that in one pass and you have a stack.',
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "A stack of unclosed openers",
        intuition: [
          "Hold the openers you have seen and not yet closed. The one on top is always the innermost — the one that must close next.",
          "On an opener, push it. On a closer, the top of the stack must be its partner; if the stack is empty or the top is the wrong type, the string is invalid.",
          "At the end the stack must be empty. A non-empty stack means openers were never closed — this is the check that `\"(\"` needs and that people forget.",
          "Map closers to their openers rather than the other way round. You look up when you see a closer, so that is the direction the map should point, and it doubles as the test for 'is this character a closer?'.",
          "The invariant: the stack always holds exactly the openers that are still open, innermost on top. Say that sentence and the code writes itself.",
        ],
        walkthrough: [
          "Empty stack; map `) -> (`, `] -> [`, `} -> {`.",
          "For each character: not in the map means it is an opener — push it.",
          "In the map means it is a closer — if the stack is empty or `pop()` is not its opener, return false.",
          "Return whether the stack is empty.",
        ],
        time: "O(n) — one pass",
        space: "O(n), for a string that is all openers",
        java: `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

class Solution {
    private static final Map<Character, Character> CLOSER_TO_OPENER =
            Map.of(')', '(', ']', '[', '}', '{');

    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            Character opener = CLOSER_TO_OPENER.get(c);
            if (opener == null) {
                stack.push(c);
            } else if (stack.isEmpty() || stack.pop() != opener) {
                return false;
            }
        }
        return stack.isEmpty();
    }
}`,
        python: `class Solution:
    def is_valid(self, s: str) -> bool:
        closer_to_opener = {")": "(", "]": "[", "}": "{"}
        stack: list[str] = []
        for c in s:
            if c not in closer_to_opener:
                stack.append(c)
            elif not stack or stack.pop() != closer_to_opener[c]:
                return False
        return not stack`,
        verdict:
          "Optimal: one pass, and it returns the moment it can. Use `ArrayDeque` in Java rather than the `Stack` class — `Stack` extends `Vector`, so every operation is synchronised for no reason, and its iteration order is bottom-to-top, which is the opposite of what you expect.",
      },
    ],
    followUps: [
      "What if other characters were allowed, as in real source code? Ignore anything that is not a bracket — the logic is unchanged.",
      "What is the minimum number of insertions to make it valid? Track unmatched closers as you go and add the leftover openers at the end — one pass, no stack needed.",
      "What if you had to return the longest valid substring? That is genuinely harder: keep a stack of *indices* with a sentinel, or solve it with DP. Same structure, different question.",
    ],
    related: ["daily-temperatures"],
  },
  {
    id: "daily-temperatures",
    slug: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "medium",
    topics: ["arrays", "stacks-queues"],
    patterns: ["brute-force-enumeration", "monotonic-stack"],
    companies: ["Amazon", "Meta", "Google", "Bloomberg", "Uber", "Walmart"],
    prompt: "For each day, how long until a warmer one?",
    statement: [
      "Given an array `temperatures` of daily temperatures, return an array `answer` where `answer[i]` is the number of days you have to wait after day i to get a warmer temperature.",
      "If no future day is warmer, `answer[i]` is 0.",
    ],
    constraints: ["1 ≤ temperatures.length ≤ 10⁵", "30 ≤ temperatures[i] ≤ 100"],
    examples: [
      {
        input: "temperatures = [73,74,75,71,69,72,76,73]",
        output: "[1,1,4,2,1,1,0,0]",
        explanation:
          "Day 2 (75°) waits until day 6 (76°), so 4. Days 6 and 7 never see anything warmer, so 0. Note days 3, 4 and 5 all resolve against the same day 6 — they were stacked up waiting together.",
      },
      { input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]", explanation: "Strictly increasing, so every day is resolved by the next one." },
      { input: "temperatures = [30,60,90]", output: "[1,1,0]" },
    ],
    signals: [
      "**\"The next day warmer than this one\"**, asked for every index, is the next-greater-element problem exactly. The moment you see that phrasing, the monotonic stack should be the first thing you reach for.",
      "**n up to 10⁵** rules out the quadratic scan — 10¹⁰ operations at the limit.",
      "**\"How many days\"** means the answer is a *distance*, so you have to store indices rather than values. This is the detail that decides whether the implementation works.",
      "**Temperatures are between 30 and 100** — only 71 distinct values. That is a hint at a second, entirely different linear solution (bucket by temperature), worth mentioning even if you write the stack.",
      "The general shape: when a brute force scans rightwards from each index for the first element beating it, and elements get 'resolved' out of order, a stack of pending indices is the tool.",
    ],
    judge: {
      entry: "dailyTemperatures",
      params: [
        { name: "temperatures", type: "int[]" },
      ],
      returns: "int[]",
      cases: [
        {
          args: [[73, 74, 75, 71, 69, 72, 76, 73]],
          expected: [1, 1, 4, 2, 1, 1, 0, 0],
          visible: true,
        },
        { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0], visible: true },
        { args: [[30, 60, 90]], expected: [1, 1, 0], visible: true },
        {
          args: [[90, 80, 70, 60]],
          expected: [0, 0, 0, 0],
          note: "Strictly falling, so nothing is ever resolved.",
        },
        { args: [[50, 50, 50]], expected: [0, 0, 0], note: "Equal is not warmer." },
        {
          args: [[30, 20, 10, 40]],
          expected: [3, 2, 1, 0],
          note: "One late warm day resolves everything stacked up behind it.",
        },
      ],
    },
    approaches: [
      {
        id: "brute",
        tier: "brute-force",
        title: "For each day, scan forward",
        intuition: [
          "Read the definition literally: for day `i`, walk forward until you find a warmer day, and record the gap.",
          "Watch what it wastes on `[75, 71, 69, 72]`: the scan from 75 walks over 71 and 69 — and then the scan from 71 walks over 69 again. The same elements are re-examined by every day behind them.",
        ],
        time: "O(n²)",
        space: "O(1) beyond the output",
        java: `class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (temperatures[j] > temperatures[i]) {
                    answer[i] = j - i;
                    break;
                }
            }
        }
        return answer;
    }
}`,
        python: `class Solution:
    def daily_temperatures(self, temperatures: list[int]) -> list[int]:
        n = len(temperatures)
        answer = [0] * n
        for i in range(n):
            for j in range(i + 1, n):
                if temperatures[j] > temperatures[i]:
                    answer[i] = j - i
                    break
        return answer
`,
        verdict:
          "Correct, and 5 × 10⁹ operations on a decreasing input. The waste has a shape: days waiting for a warmer one form a decreasing run, and when a warm day finally arrives it resolves several of them at once. Something that holds a decreasing run and pops several items at once is a stack.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "A monotonic stack of unresolved days",
        intuition: [
          "Keep a stack of the days whose answer is still unknown. Because a day is only unresolved while nothing warmer has come along, their temperatures are automatically in decreasing order from the bottom up.",
          "When today arrives, it resolves everything on top of the stack that is colder than it — and it resolves them *correctly*, because the stack is ordered: today is genuinely the first warmer day for each of them, not merely some warmer day.",
          "Pop while today beats the top, writing `i - poppedIndex` for each. Then push today, since its own answer is not yet known.",
          "Store **indices**, not temperatures. You need `i - day` and the temperature alone cannot give you that.",
          "Whatever remains on the stack at the end never found a warmer day. Their answers stay 0 — which is the array's default in both languages, so the code says nothing about it. Say it out loud anyway, so it is clearly a decision rather than an accident.",
          "The cost: every index is pushed exactly once and popped at most once, so despite the nested `while` this is O(n). Being able to give that amortised argument is what the problem is testing.",
        ],
        walkthrough: [
          "`answer` all zeros; empty stack.",
          "For each day `i`: while the stack is non-empty and `temperatures[i]` beats the temperature at the top index, pop it and set its answer to `i - popped`.",
          "Push `i`.",
          "Return `answer`.",
        ],
        time: "O(n) amortised — each index pushed once, popped at most once",
        space: "O(n) for the stack",
        java: `import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] answer = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int day = stack.pop();
                answer[day] = i - day;
            }
            stack.push(i);
        }
        return answer;
    }
}`,
        python: `class Solution:
    def daily_temperatures(self, temperatures: list[int]) -> list[int]:
        answer = [0] * len(temperatures)
        stack: list[int] = []
        for i, temp in enumerate(temperatures):
            while stack and temp > temperatures[stack[-1]]:
                day = stack.pop()
                answer[day] = i - day
            stack.append(i)
        return answer`,
        verdict:
          "Optimal. `>` rather than `>=` is deliberate: the problem says *warmer*, so an equal temperature does not resolve a waiting day. Flip that operator and equal runs behave differently — decide which the problem wants and be explicit about it.",
      },
    ],
    followUps: [
      "Next Greater Element I and II, the Stock Span problem, and Largest Rectangle in a Histogram are all this algorithm with the comparison or the direction changed. Recognise the family and four problems collapse into one.",
      "Could you use the 30–100 range instead? Yes — walk right to left keeping, for each temperature, the nearest day it was seen; then for day `i` take the minimum over the 70 warmer temperatures. O(71n), linear in a different way.",
      "What if you wanted the next *cooler* day? Flip the comparison to `<`. Nothing else changes, which is the sign you have understood the pattern rather than memorised the code.",
    ],
    related: ["valid-parentheses", "container-with-most-water"],
  },
];
