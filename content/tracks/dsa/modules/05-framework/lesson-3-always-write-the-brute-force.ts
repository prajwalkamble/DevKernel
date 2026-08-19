import type { Lesson } from "@/content/types";

export const bruteForceLesson: Lesson = {
  id: "dsa-framework-brute-force",
  slug: "always-write-the-brute-force",
  moduleSlug: "the-framework",
  title: "Step 3 — Always Write the Brute Force",
  summary:
    "The step everyone skips because it feels like giving up, and the one that produces the fast solution, the test oracle and half the interview score.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Produce a brute force for any problem by naming its answer space and enumerating it",
    "Find the fast algorithm by locating the specific waste in the slow one, rather than by recall",
    "Use the brute force as an oracle in a differential test, and catch a bug no hand-picked example finds",
    "Recognise the problems where the brute force is the intended solution",
  ],
  sections: [
    {
      id: "why",
      heading: "Why the slow answer is the most valuable thing you write",
      body: [
        "There is a strong instinct to skip this step. Writing the O(n²) solution feels like admitting you cannot see the clever one, and in an interview it feels like showing weakness. Both of those instincts are wrong, and expensively so.",
        "**It proves you understood the question.** A brute force is the problem statement rewritten as code. If you can write one, you have understood what is being asked; if you cannot, you have not, and no amount of cleverness will rescue that.",
        "**It is what you optimise.** This is the big one. Almost no fast algorithm is invented from nothing — it is a brute force with one specific waste removed. Two Sum's hash map exists because the inner loop was asking a membership question. Kadane exists because adjacent subarrays share almost all their sum. The monotonic stack exists because each scan re-walks what the previous scan already walked. In every case the fast solution is *visible in* the slow one. Skip the slow one and you have nothing to look at, and you are back to trying to remember an answer.",
        "**It is an oracle.** You now have an implementation that is obviously correct. That is worth a great deal: you can run it against your fast version on thousands of random inputs and find bugs that no example you would have chosen by hand ever finds. There is a demonstration of exactly this below.",
        "**It scores.** In an interview, a working brute force on the board is a correct solution. Everything after it is improvement rather than gamble. Candidates who hold out for the optimal solution and run out of time score below candidates who had something working at minute ten — and the ones who say \"here's the O(n²), let me now show you why we can do better\" are demonstrating the reasoning being assessed.",
      ],
      pitfalls: [
        {
          title: "\"The interviewer will think I don't know the trick\"",
          body: "The reverse. Jumping straight to a memorised optimal solution is the most common way to look like you have seen the problem before rather than solved it — and it is followed immediately by a question you cannot answer, because you never derived it. Deriving it out loud from the brute force is strictly stronger, and it is the same amount of code.",
        },
      ],
    },
    {
      id: "how",
      heading: "How to write one for any problem",
      body: [
        "The recipe is mechanical, which is the point: it works when you have no idea. **Name the answer space, enumerate it, and check each candidate against the definition.**",
        "The only real question is what the answer *is*, and the restatement from step 1 tells you. Then the enumeration follows from the shape of the answer:",
        "The answer is **a pair** → two nested loops, O(n²). **A triple** → three, O(n³). **A subarray** → all start/end pairs, O(n²) ranges. **A subsequence or subset** → all 2ⁿ subsets. **An arrangement** → all n! permutations. **A number in a range** → try every value in the range. **A path in a grid or graph** → every path from the source, by DFS.",
        "That list is the whole method. If the answer is a pair of indices, you already know your brute force is a double loop before you have thought about the problem at all — and writing it will show you what the inner loop is doing, which is where the fast solution lives.",
        "Two rules keep the brute force useful. Keep it **obviously correct**, not efficient: a clever brute force is a contradiction and cannot be trusted as an oracle. And write it against the **definition**, not against your intuition about the answer — for 'the longest substring with at most k replacements', count the letters in the substring and check the definition literally, rather than reasoning about which substring is best.",
      ],
      examples: [
        {
          id: "answer-space",
          title: "The answer space names the loop",
          lang: "bash",
          code: `"the two indices that sum to target"        pair       -> for i, for j>i
"every triple summing to zero"             triple     -> for i, for j>i, for k>j
"the longest substring with no repeats"    subarray   -> for start, for end>=start
"the subset with the largest sum under W"  subset     -> for mask in 0..2^n
"the shortest tour visiting every city"    ordering   -> for each permutation
"the minimum speed that finishes in time"  a number   -> for speed in 1..max
"can I reach the exit"                     a path     -> DFS from the start

You do not need an idea to write any of these. You need to know what
shape the answer has, and step 1 already told you.`,
          explanation:
            "This is the part worth internalising, because it removes the blank page entirely. There is no problem where you cannot start. Knowing that the answer is a number in a range gives you `for speed in 1..max` immediately — and that loop, once written, is visibly a search over a sorted true/false array, which is what turns Koko into a binary search.",
        },
      ],
    },
    {
      id: "finding-the-waste",
      heading: "Reading the fast solution out of the slow one",
      body: [
        "Once the brute force exists, look at it and ask one question: **what is it doing more than once?**",
        "There are only a few answers, and each one names a technique.",
        "**It re-answers the same membership question.** The inner loop is really asking \"is X in here?\" over and over. → Remember what you have seen in a hash set or map, and the inner loop disappears. This is Two Sum.",
        "**Adjacent iterations recompute nearly the same aggregate.** The sum for `[i..j]` and `[i..j+1]` differ by one element. → Keep a running value and update it, rather than recomputing. This is prefix sums, sliding windows and Kadane.",
        "**It re-scans a region a previous iteration already scanned.** Each index walks rightwards over elements the index before it already walked over. → Carry the unresolved work in a stack. This is the monotonic stack.",
        "**It ignores an ordering it was given.** The input is sorted and the loop scans anyway. → Binary search, or two pointers.",
        "**It recomputes the same subproblem on the same arguments.** The recursion tree has repeated nodes. → Memoise. This is every DP problem.",
        "**It explores branches that cannot possibly lead to an answer.** → Prune, or find a greedy argument that rules them out.",
        "Six diagnoses. Almost every optimisation in this track is one of them, which means the question \"what is it doing more than once?\" has a small, learnable set of answers — and asking it is a great deal more reliable than trying to recall which trick this problem uses.",
      ],
      examples: [
        {
          id: "waste-worked",
          title: "The same question, on three brute forces",
          lang: "java",
          code: `// 1. Two Sum. What repeats?
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (nums[i] + nums[j] == target) { /* ... */ }
    }
}
// The inner loop asks one question: "is target - nums[i] anywhere after i?"
// A membership question, asked n times. -> hash map. O(n).

// 2. Maximum subarray. What repeats?
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += nums[j];
    }
}
// The sums for start i and start i+1 share all but one term.
// An aggregate recomputed from scratch. -> keep a running value. O(n).

// 3. Daily temperatures. What repeats?
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (t[j] > t[i]) { answer[i] = j - i; break; }
    }
}
// On a decreasing run, index i walks over exactly the elements i+1 walked
// over. A region re-scanned. -> hold the unresolved indices. Stack. O(n).`,
          explanation:
            "Three problems, three different fast techniques, one question. Notice that in each case the diagnosis is visible in four lines of slow code, and in none of them did you have to recall what the answer was. This is the mechanism the whole framework is built to reach.",
        },
      ],
    },
    {
      id: "oracle",
      heading: "The brute force as a test oracle",
      body: [
        "Here is the use that people are most often unaware of, and it is the one that will save you the most time.",
        "You have two implementations: one obviously correct and slow, one fast and possibly wrong. Generate thousands of small random inputs and compare them. Any disagreement is a bug, and it comes with a minimal counterexample attached.",
        "This finds a category of bug that hand-picked tests structurally cannot. The examples you invent are the ones you thought of — but the bug is, by definition, in the case you did *not* think of. Random search does not share your blind spot.",
        "Three rules make it work. Keep the inputs **tiny** — length 0 to 8 — because a bug that exists at all almost always exists on a small input, and a small counterexample is one you can trace by hand. Keep the **alphabet small** — two or three distinct values — because that manufactures the duplicates and ties where bugs live. And **seed** the generator, so a failure is reproducible.",
        "The demonstration below runs this against the sliding-window solution for 'longest substring without repeating characters', in a version missing one guard — the check that a character's last-seen index is still inside the window. It is a subtle bug: it passes `\"abcabcbb\"`, `\"bbbbb\"` and `\"pwwkew\"`, the three examples the problem itself provides.",
      ],
      examples: [
        {
          id: "oracle-py",
          title: "A differential test in about fifteen lines",
          lang: "python",
          code: `import random


def brute(s: str) -> int:
    """Obviously correct: every start, extended until a repeat."""
    best = 0
    for i in range(len(s)):
        window: set[str] = set()
        for j in range(i, len(s)):
            if s[j] in window:
                break
            window.add(s[j])
            best = max(best, j - i + 1)
    return best


def fast_buggy(s: str) -> int:
    """The sliding window, missing the check that a last-seen index is stale."""
    last_seen: dict[str, int] = {}
    best = left = 0
    for right, c in enumerate(s):
        if c in last_seen:
            left = last_seen[c] + 1
        last_seen[c] = right
        best = max(best, right - left + 1)
    return best


def fast(s: str) -> int:
    last_seen: dict[str, int] = {}
    best = left = 0
    for right, c in enumerate(s):
        if c in last_seen and last_seen[c] >= left:
            left = last_seen[c] + 1
        last_seen[c] = right
        best = max(best, right - left + 1)
    return best


def differential_test(candidate, trials: int = 10_000) -> str:
    random.seed(7)
    for trial in range(trials):
        n = random.randrange(0, 9)
        s = "".join(random.choice("ab") for _ in range(n))
        expected, actual = brute(s), candidate(s)
        if expected != actual:
            return f"FAILED on trial {trial}: s={s!r} brute={expected} fast={actual}"
    return f"{trials} random tests passed"


print("buggy :", differential_test(fast_buggy))
print("fixed :", differential_test(fast))`,
          output: `buggy : FAILED on trial 9: s='bbaab' brute=2 fast=3
fixed : 10000 random tests passed`,
          explanation:
            "Nine trials. It took nine random five-character strings to find a bug that survives every example the problem statement provides. And the counterexample it hands you — `'bbaab'` — is short enough to trace by hand: after `\"bba\"` the window starts at index 2, so when the second `b` arrives at index 4 its last-seen index of 1 is **stale**, already behind the window. The buggy version jumps `left` backwards to 2 and reports a window that contains two `b`s.",
        },
        {
          id: "oracle-java",
          title: "The same test in Java",
          lang: "java",
          code: `import java.util.*;
import java.util.function.ToIntFunction;

public class Main {
    /** Obviously correct: every start, extended until a repeat. */
    static int brute(String s) {
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            Set<Character> window = new HashSet<>();
            for (int j = i; j < s.length(); j++) {
                if (!window.add(s.charAt(j))) break;
                best = Math.max(best, j - i + 1);
            }
        }
        return best;
    }

    /** The sliding window, missing the check that a last-seen index is stale. */
    static int fastBuggy(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastSeen.containsKey(c)) left = lastSeen.get(c) + 1;
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    static int fast(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
                left = lastSeen.get(c) + 1;
            }
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    static String differentialTest(ToIntFunction<String> candidate, int trials) {
        Random random = new Random(7);
        for (int trial = 0; trial < trials; trial++) {
            int n = random.nextInt(9);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                sb.append(random.nextBoolean() ? 'a' : 'b');
            }
            String s = sb.toString();
            int expected = brute(s);
            int actual = candidate.applyAsInt(s);
            if (expected != actual) {
                return "FAILED on trial " + trial + ": s=\\"" + s
                        + "\\" brute=" + expected + " fast=" + actual;
            }
        }
        return trials + " random tests passed";
    }

    public static void main(String[] args) {
        System.out.println("buggy : " + differentialTest(Main::fastBuggy, 10_000));
        System.out.println("fixed : " + differentialTest(Main::fast, 10_000));
    }
}`,
          output: `buggy : FAILED on trial 0: s="aabbbaa" brute=2 fast=4
fixed : 10000 random tests passed`,
          explanation:
            "Same bug, different generator, caught on the very first trial. The counterexample differs because the random sequences differ — which is itself the point. You are not relying on one lucky test; you are sampling a space your intuition does not cover. Two minutes to write, and it decides the question of whether your solution is correct.",
        },
      ],
      pitfalls: [
        {
          title: "Testing with large random inputs",
          body: "Tempting, and much less useful. A 1000-character counterexample tells you there is a bug and nothing about where. Small inputs — under ten elements, two or three distinct values — find the same bugs and hand you a case you can walk through by hand. If a bug only appears at n = 1000, it is usually overflow or a performance issue, not a logic error, and needs different tools.",
        },
        {
          title: "Trusting a brute force you optimised",
          body: "The oracle's only job is to be obviously right. The moment you add an early exit or a clever skip to make it faster, it is a second implementation that might share a bug with the first — and a differential test between two implementations of the same misunderstanding passes happily. Keep it dumb.",
        },
      ],
    },
    {
      id: "sometimes-enough",
      heading: "When the brute force is the answer",
      body: [
        "Sometimes you write it, check the constraints, and find you are finished. This happens more often than people expect, and missing it wastes a great deal of time.",
        "If n ≤ 100, an O(n³) solution is a million operations and runs instantly. If n ≤ 20 and the answer is a subset, 2²⁰ is a million and the exhaustive search *is* the intended solution — small exponential bounds are practically a signature for it. If n ≤ 8 and the answer is an ordering, 8! is forty thousand and permutations are fine.",
        "This is the direct payoff of doing step 4 next. A brute force is not slow in the abstract; it is slow relative to a bound. Read the bound and the question of whether you need to optimise at all is answered in five seconds — and if the answer is no, then hunting for a clever solution is not diligence, it is a way of losing twenty minutes and introducing bugs.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "You cannot see the optimal solution. What do you do?",
      answer:
        "Write the brute force and say so. It gets a correct solution on the board, which is worth more than an unfinished clever one, and it is what I then optimise: I look at it and ask what it is doing more than once. If the inner loop is a membership test, that is a hash map; if adjacent iterations recompute nearly the same aggregate, that is a running value or a window; if it re-scans a region, that is a stack; if the recursion repeats arguments, that is memoisation. The fast solution is usually visible in the slow one rather than recalled.",
    },
    {
      question: "How would you convince yourself an algorithm is correct before submitting it?",
      answer:
        "Trace it on the small example I worked by hand, check the edge cases I listed, and then run it against the brute force on a few thousand tiny random inputs. Tiny is the important part — length under ten, two or three distinct values — because bugs almost always appear on small inputs and the counterexample is then short enough to trace. Hand-picked tests only cover the cases I thought of, and the bug is by definition in one I did not.",
    },
    {
      question: "When would you not bother optimising a brute force?",
      answer:
        "When the constraints say I do not need to. n ≤ 100 makes O(n³) about a million operations, which is instant; n ≤ 20 with a subset answer makes 2ⁿ the intended solution rather than a fallback. Checking that takes five seconds and can save twenty minutes. Small exponential bounds in particular are usually the setter telling you exhaustive search is expected.",
    },
  ],
  takeaways: [
    "Write the brute force every time: it proves you understood the question, and it is what you optimise",
    "Produce one mechanically — name the shape of the answer, enumerate that space, check each candidate against the definition",
    "The fast solution is found by asking what the slow one does more than once; there are only about six answers, and each names a technique",
    "Keep the brute force obviously correct rather than efficient, because its second job is to be an oracle",
    "A differential test on tiny random inputs finds bugs no hand-picked example will — the buggy window above survived every example in the problem statement and fell on the ninth random string",
    "Small inputs and a small alphabet; seed the generator so failures reproduce",
    "Check the constraints before optimising: at n ≤ 100, or n ≤ 20 for subsets, the brute force is frequently the intended solution",
  ],
};
