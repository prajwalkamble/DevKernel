import type { Lesson } from "@/content/types";

export const endToEndLesson: Lesson = {
  id: "dsa-framework-end-to-end",
  slug: "the-framework-end-to-end",
  moduleSlug: "the-framework",
  title: "All Seven Steps, on a Problem You Have Not Seen",
  summary:
    "One medium problem, worked from cold, with every step written out — including the wrong turn, and how the framework catches it.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Follow all seven steps on a single unfamiliar problem, start to finish",
    "See how a wrong turn is caught by a step rather than by a failing test",
    "Read a subtle correctness argument and know why it is not obvious",
    "Reproduce the whole method on a second problem without help",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem",
      body: [
        "This one appears nowhere else in this track, so if you have not met it before, work along rather than reading ahead. Give yourself the sixty seconds each step asks for.",
        "**Longest Repeating Character Replacement.** You are given a string `s` of uppercase English letters and an integer `k`. You may choose any character in the string and change it to any other uppercase letter, and you may do this at most `k` times. Return the length of the longest substring containing the same letter that you can obtain.",
        "Constraints: `1 ≤ s.length ≤ 10⁵`, `s` consists of uppercase English letters, `0 ≤ k ≤ s.length`.",
        "Examples: `s = \"ABAB\", k = 2` gives 4. `s = \"AABABBA\", k = 1` gives 4.",
      ],
    },
    {
      id: "step-1-2",
      heading: "Steps 1 and 2 — restate, and work it by hand",
      body: [
        "**Restate, using none of the statement's words.** \"Find the longest stretch of text I can make all one letter, if I'm allowed to overwrite at most k characters in it.\"",
        "That is already better than the original, because it says *stretch*, which forces the contiguity question into the open. Check it: the problem says substring, so contiguous, so a window is on the table. If it had said subsequence, it would not be.",
        "Flip it once more, because the flipped version is the one that becomes code: **in any stretch I pick, the characters I have to overwrite are the ones that are not the most common letter in it.** So a stretch is affordable exactly when `(its length) − (count of its most common letter) ≤ k`.",
        "That reformulation is the whole problem, and it came from restating rather than from insight. Getting there is worth more than anything that follows.",
        "**Signature.** In: a `String` and an `int`. Out: an `int`. `s` is non-empty; `k` may be 0; `k` may be as large as the whole string, in which case the answer is the whole string.",
        "**By hand**, on `\"AABABBA\"` with `k = 1`:",
      ],
      examples: [
        {
          id: "by-hand",
          title: "Working the second example with a pencil",
          lang: "bash",
          code: `s = A A B A B B A     k = 1

stretch      length   most common   to overwrite   affordable (<= 1)?
-------      ------   -----------   ------------   ------------------
AAB             3       A x2              1              yes
AABA            4       A x3              1              yes    <- 4
AABAB           5       A x3              2              no
 ABAB           4       A x2 / B x2       2              no
   ABBA         4       A x2 / B x2       2              no
    BBA         3       B x2              1              yes
   ABB          3       B x2              1              yes

answer 4

What did the pencil do? For each stretch it counted the letters, took the
biggest count, and subtracted. That is the brute force, and it arrived
without an idea.`,
          explanation:
            "Notice the by-hand pass also produced the *check* — length minus the most common count — as an executable expression. Step 2 keeps doing this: being the procedure yourself hands you the definition in a form you can type.",
        },
      ],
    },
    {
      id: "step-3",
      heading: "Step 3 — the brute force",
      body: [
        "The answer is a substring, so the answer space is every (start, end) pair, and the brute force is two nested loops over them with the check inside.",
        "Write it against the definition, not against intuition: count the letters in the stretch, take the largest count, subtract from the length, compare to `k`. Do not try to be clever about which stretch is best — that is the fast solution's job, and a clever brute force is not trustworthy as an oracle.",
      ],
      examples: [
        {
          id: "brute",
          title: "The brute force, written straight from the definition",
          lang: "java",
          code: `/** Brute force: every substring, checked directly against the definition. */
static int brute(String s, int k) {
    int best = 0;
    for (int i = 0; i < s.length(); i++) {
        for (int j = i; j < s.length(); j++) {
            int[] count = new int[26];
            int most = 0;
            for (int x = i; x <= j; x++) {
                most = Math.max(most, ++count[s.charAt(x) - 'A']);
            }
            int length = j - i + 1;
            if (length - most <= k) {
                best = Math.max(best, length);
            }
        }
    }
    return best;
}`,
          explanation:
            "O(n³) as written — n² substrings, each counted in O(n). It could be O(n²) by carrying the counts as `j` advances, and deliberately is not: the oracle's only job is to be obviously correct, and every optimisation is a chance to share a bug with the solution it is supposed to be checking.",
        },
      ],
    },
    {
      id: "step-4",
      heading: "Step 4 — read the constraints",
      body: [
        "`n ≤ 10⁵`. So n² is 10¹⁰ and dead; n³ is not worth writing down. The target is O(n) or O(n log n).",
        "`s` consists of **uppercase English letters** — 26 of them, a fixed alphabet. That is a real gift: an `int[26]` is O(1) space, and even an O(26) operation inside the loop is a constant. This will matter in a moment.",
        "`0 ≤ k ≤ s.length`. `k = 0` is legal, which means \"the longest run of a single repeated letter\" is a valid case and the code must handle it without a special branch. `k = n` is legal too, and the answer is then `n`.",
        "Nothing here overflows and nothing is asked about space, so the only instruction is: **linear, with a small fixed alphabet available**.",
      ],
    },
    {
      id: "step-5-6",
      heading: "Steps 5 and 6 — structure, then pattern",
      body: [
        "**Dominant operation.** The brute force's inner loop counts the letters of a stretch and takes the largest count. As the stretch grows by one character, that count changes by one entry. So the operation is *maintain a tally of a range and query its maximum* — an aggregate over a moving range, recomputed from scratch each time.",
        "**Structure.** A tally over a 26-letter alphabet is an `int[26]`. Nothing more exotic is needed, and the fixed alphabet from step 4 is what makes that O(1).",
        "**Pattern.** Now the four questions. Contiguous — yes, it says substring. Ordered — irrelevant, the positions matter so sorting is illegal anyway. What kind of answer — the best one, a maximum length. Local or global — a moving range, so local.",
        "Contiguous, plus \"longest such that a condition holds\", plus a condition maintained incrementally, is the variable-size sliding window, almost word for word.",
        "But step 6 says to check the precondition rather than match on the phrase. **Is the condition monotone?** If a stretch is unaffordable — too many characters to overwrite — can extending it make it affordable again? Extending adds one character. The length goes up by one. The most common count goes up by at most one. So `length − most` never decreases. It is monotone, and the window is legitimate.",
        "That check took fifteen seconds and it is the difference between using the window because it is correct and using it because the problem said \"substring\".",
      ],
    },
    {
      id: "wrong-turn",
      heading: "The wrong turn, and the step that catches it",
      body: [
        "Here is where this problem earns its reputation, and it is worth walking into the trap deliberately.",
        "The natural implementation recomputes the most common count when the window shrinks — after all, removing a character might reduce it. So you would write: on every shrink, rescan the 26 counters and take the maximum.",
        "That is correct, and it is O(26n), which is linear and passes. Fine.",
        "Now the tempting optimisation: never recompute it. Just keep `mostCommon` as the largest count ever seen in any window, and never decrease it. That is obviously wrong — the window has shrunk, its most common letter might now be less common, so the affordability check is using a stale, too-large number and may accept a window it should reject.",
        "Except that it passes. Every test.",
        "Step 3 is what tells you which of your two intuitions is right. You have an oracle; run it.",
      ],
      examples: [
        {
          id: "differential",
          title: "Twenty thousand random tests settle it",
          lang: "java",
          code: `import java.util.*;

public class Main {
    /** The O(26n) version we trust, plus the stale-count version under test. */
    static int optimal(String s, int k) {
        int[] count = new int[26];
        int left = 0, mostCommon = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            mostCommon = Math.max(mostCommon, ++count[s.charAt(right) - 'A']);
            while (right - left + 1 - mostCommon > k) {
                count[s.charAt(left) - 'A']--;
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    static int brute(String s, int k) {
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            for (int j = i; j < s.length(); j++) {
                int[] c = new int[26];
                int most = 0;
                for (int x = i; x <= j; x++) most = Math.max(most, ++c[s.charAt(x) - 'A']);
                int len = j - i + 1;
                if (len - most <= k) best = Math.max(best, len);
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(optimal("ABAB", 2));
        System.out.println(optimal("AABABBA", 1));
        System.out.println(optimal("AAAA", 0));
        System.out.println(optimal("ABCDE", 1));

        Random random = new Random(11);
        for (int trial = 0; trial < 20_000; trial++) {
            int n = random.nextInt(10);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                sb.append((char) ('A' + random.nextInt(3)));   // small alphabet on purpose
            }
            String s = sb.toString();
            int k = random.nextInt(4);
            if (brute(s, k) != optimal(s, k)) {
                System.out.println("MISMATCH s=" + s + " k=" + k
                        + " brute=" + brute(s, k) + " optimal=" + optimal(s, k));
                return;
            }
        }
        System.out.println("20000 random tests passed");
    }
}`,
          output: `4
4
4
2
20000 random tests passed`,
          explanation:
            "The four numbers are the stated examples plus two extra; then twenty thousand random strings over a three-letter alphabet, and no disagreement. The never-decreasing version is correct — and now you know it empirically, which is exactly the position from which to go and work out *why*.",
        },
      ],
    },
    {
      id: "why-it-works",
      heading: "Why the stale count is safe",
      body: [
        "The argument is short and worth understanding rather than memorising, because this shape — *an over-optimistic estimate that is safe because of what we are asking* — comes up repeatedly.",
        "We are looking for the **largest** window, and the algorithm only ever records `right - left + 1` as a candidate.",
        "Suppose `mostCommon` is stale — larger than the true count in the current window. Then the affordability test is too generous, so the window may fail to shrink when it strictly should, and the algorithm may record a length for a window that is not actually affordable.",
        "But that length was already achieved, honestly, at the earlier moment when `mostCommon` was set to that value — because at that moment there really was a window of at least that length with that many copies of a single letter. So the over-generous record cannot exceed the best legitimate answer found so far. It can never *increase* the reported maximum beyond something genuinely achievable.",
        "And `mostCommon` only ever rises when a genuinely larger count is seen, which is always in a window that is genuinely valid. So the maximum reported is exactly the largest legitimately affordable window.",
        "Two things to notice about that argument. It depends on the problem asking for a maximum — the same trick applied to a minimisation would be simply wrong. And it is not obvious; nobody derives it at the whiteboard under time pressure. What you *can* do under time pressure is write the O(26n) version that recomputes, which is correct, linear, and needs no argument at all — and then mention that the recomputation can be dropped, and why you believe it. That is a better interview answer than the clever version delivered without justification.",
      ],
      pitfalls: [
        {
          title: "Reaching for the clever version because it is what you saw in an editorial",
          body: "A solution you cannot justify is a liability. The follow-up question will be \"why doesn't the count need to decrease?\", and \"that's how I've seen it written\" is a worse answer than never having used the optimisation. Write the version you can defend.",
        },
      ],
    },
    {
      id: "step-7",
      heading: "Step 7 — the code",
      body: [
        "**Invariant:** the window `[left, right]` is always affordable — the characters that would need overwriting fit within `k` — so its width is always a candidate answer.",
        "The loop then does the two mechanical jobs. Extend right, updating the tally. Then, while the invariant is broken, shrink from the left. Then record the width.",
      ],
      examples: [
        {
          id: "final-java",
          title: "The solution, Java",
          lang: "java",
          code: `public class Main {
    /** Sliding window: a window is valid when the letters to replace fit in k. */
    static int optimal(String s, int k) {
        int[] count = new int[26];
        int left = 0;
        int mostCommon = 0;
        int best = 0;
        for (int right = 0; right < s.length(); right++) {
            mostCommon = Math.max(mostCommon, ++count[s.charAt(right) - 'A']);
            while (right - left + 1 - mostCommon > k) {
                count[s.charAt(left) - 'A']--;
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(optimal("ABAB", 2));
        System.out.println(optimal("AABABBA", 1));
        System.out.println(optimal("AAAA", 0));
        System.out.println(optimal("ABCDE", 1));
    }
}`,
          output: `4
4
4
2`,
          explanation:
            "The four outputs are `(\"ABAB\", 2)`, `(\"AABABBA\", 1)`, `(\"AAAA\", 0)` and `(\"ABCDE\", 1)` — the two stated examples plus the `k = 0` case and a case with no repeats at all. `k = 0` falls out with no special branch, which is what step 4 told us to check for.",
        },
        {
          id: "final-python",
          title: "The solution, Python",
          lang: "python",
          code: `import random
from collections import Counter


def optimal(s: str, k: int) -> int:
    count: Counter[str] = Counter()
    left = most_common = best = 0
    for right, c in enumerate(s):
        count[c] += 1
        most_common = max(most_common, count[c])
        while right - left + 1 - most_common > k:
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


def brute(s: str, k: int) -> int:
    best = 0
    for i in range(len(s)):
        for j in range(i, len(s)):
            window = s[i:j + 1]
            most = max(Counter(window).values())
            if len(window) - most <= k:
                best = max(best, len(window))
    return best


for text, limit in [("ABAB", 2), ("AABABBA", 1), ("AAAA", 0), ("ABCDE", 1)]:
    print(optimal(text, limit))

rng = random.Random(11)
for _ in range(20_000):
    n = rng.randrange(10)
    s = "".join(rng.choice("ABC") for _ in range(n))
    k = rng.randrange(4)
    if brute(s, k) != optimal(s, k):
        print(f"MISMATCH s={s} k={k} brute={brute(s, k)} optimal={optimal(s, k)}")
        break
else:
    print("20000 random tests passed")`,
          output: `4
4
4
2
20000 random tests passed`,
          explanation:
            "Same algorithm, same answers, and the same twenty thousand differential tests against a Python brute force. `Counter` stands in for the `int[26]` — slower by a constant, and it removes the assumption that the alphabet is uppercase Latin, which is the trade Python usually offers.",
        },
      ],
    },
    {
      id: "the-transcript",
      heading: "The whole thing, as you would say it out loud",
      body: [
        "Compressed to what an interviewer would actually hear. Under three minutes, and every sentence is one of the seven steps.",
      ],
      examples: [
        {
          id: "transcript",
          title: "Two and a half minutes, start to finish",
          lang: "bash",
          code: `1  "So: find the longest stretch I can make all one letter, if I can
    overwrite at most k characters in it. Equivalently - a stretch works
    when its length minus the count of its most common letter is <= k."

2  "String and an int in, an int out. k can be 0, and k can be the whole
    length. Let me try AABABBA with k=1... AABA works, AABAB needs two
    overwrites. So 4."

3  "Brute force: every substring, count its letters, check the definition.
    O(n^3) as written, or O(n^2) if I carry the counts."

4  "n is 1e5, so n^2 is out - I need linear or n log n. And it's uppercase
    letters only, so a 26-element tally is constant space."

5  "The inner loop maintains a tally over a moving range and asks for its
    maximum. That's an int[26]."

6  "It's contiguous and it's 'longest such that', so a window. Checking
    monotonicity: extending adds one to the length and at most one to the
    most-common count, so length-minus-most never decreases. Monotone, so
    the window is valid."

7  "Invariant: the window is always affordable, so its width is always a
    candidate. Extend right, shrink left while it's unaffordable, record.
    O(26n) if I recompute the max count on shrink, which is O(n).

    There's a known optimisation where you never decrease that count -
    it's safe because we only ever ask for a maximum - but I'll write the
    version I can justify and mention the other."`,
          explanation:
            "Every step is present, and the whole thing is deducible — there is not one point where the speaker needed to have seen this problem before. That is what the framework is for. Note also the last paragraph: naming a better solution you have chosen not to write, with the reason, is a stronger answer than silently writing it.",
        },
      ],
    },
    {
      id: "now-you",
      heading: "Now do it yourself",
      body: [
        "Take **Minimum Size Subarray Sum**: given an array of positive integers and a target, return the length of the shortest contiguous subarray whose sum is at least the target, or 0 if there is none. Constraints: `1 ≤ n ≤ 10⁵`, `1 ≤ nums[i] ≤ 10⁴`, and there is a follow-up asking for an O(n log n) solution if you have found the O(n) one.",
        "Work all seven steps before writing anything. Write the restatement down. Work an example by hand. State the brute force and its cost. Read the constraints to a target. Name the structure and the pattern — and check the precondition rather than matching on the phrase. Then write it, with the invariant as a comment.",
        "Two things to notice while you do it. **\"Positive integers\"** is not decoration — it is what makes the condition monotone, and it is the constraint the whole solution rests on. And **the follow-up asking for O(n log n) when you have an O(n)** is strange until you realise it is pointing at a completely different technique — prefix sums plus binary search — which is the one that still works when the numbers can be negative.",
        "When you finish, write down the sentence that unlocked it. That sentence is the thing you are actually collecting.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Talk me through Longest Repeating Character Replacement.",
      answer:
        "A stretch is usable when its length minus the count of its most common letter is at most k — that is how many characters I would have to overwrite. Contiguous plus 'longest such that' suggests a sliding window, and it is valid because the condition is monotone: extending adds one to the length and at most one to the most-common count, so the shortfall never decreases. So: extend right and update a 26-element tally; while the window is unaffordable, shrink from the left; record the width each step. O(n) time with a constant-size tally, O(1) space.",
    },
    {
      question: "In that solution, do you need to recompute the most common count when the window shrinks?",
      answer:
        "Strictly, recomputing is the version I can justify immediately, and it costs O(26) per shrink, which is still linear overall. There is a well-known optimisation where the count never decreases, and it is correct — because we only ever ask for the maximum window, and any over-generous window it lets through has a length that was already achieved legitimately at the moment the count was set. So it can never report something larger than a genuinely valid window. But the argument depends on this being a maximisation; the same trick in a minimisation problem would be wrong. I would write the recomputing version and offer the other with that reasoning.",
    },
    {
      question: "How would you check a solution like that is right, without a judge?",
      answer:
        "Write the brute force — every substring, counted directly against the definition — and run both on a few thousand random inputs. Small ones: strings under ten characters over a three-letter alphabet, so duplicates and ties are common. That is precisely how I would settle the question about the never-decreasing count: rather than arguing about it, run twenty thousand trials and see whether they ever disagree, and then go and find the reason.",
    },
  ],
  takeaways: [
    "The whole method runs in under three minutes on a medium problem, and every step is deducible without having seen it before",
    "Restating produced the key reformulation — length minus the most common count — which is the entire problem",
    "Working the example by hand produced the affordability check as an expression you can type",
    "Step 6's monotonicity check is what makes the window legitimate rather than merely plausible",
    "The oracle from step 3 settled a correctness question that argument alone would not have: 20,000 random tests, no disagreement",
    "Prefer the solution you can justify; naming a better one you chose not to write, with the reason, is a stronger answer than writing it silently",
    "Collect the sentence that unlocked each problem — the sentence transfers to problems you have not seen, the code does not",
  ],
};
