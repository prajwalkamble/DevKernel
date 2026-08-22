import type { Lesson } from "@/content/types";

export const choosingYourLanguageLesson: Lesson = {
  id: "dsa-lang-choosing",
  slug: "choosing-your-language",
  moduleSlug: "your-solving-language",
  title: "Choosing One, and Stopping the Argument",
  summary:
    "The grounds that actually decide which language you solve problems in — and why the decision matters far less than making it and moving on.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "List the differences between Java and Python that genuinely affect solving problems",
    "Dismiss the arguments that sound decisive and are not",
    "Choose one language for this track on stated grounds",
    "Explain when the other language is worth switching to",
  ],
  sections: [
    {
      id: "why-one",
      heading: "Why one, and why now",
      body: [
        "You are going to write a few hundred solutions. Every one of them uses the same dozen operations: sort a list, look something up, count occurrences, push and pop, take the smallest remaining, iterate with an index. If those twelve operations are things you type without thinking, every problem is one problem — the algorithmic one. If they are not, every problem is two problems, and the algorithmic one always loses, because it is the harder of the two and it goes second.",
        "That is the entire argument for choosing now and stopping. Fluency is worth much more than any property of either language, and fluency comes from repetition in one place.",
        "The reason people do not choose is that they are waiting to find out which is *better*. Neither is. They are different in ways that matter for about a week and then stop mattering at all.",
      ],
    },
    {
      id: "real-differences",
      heading: "The differences that actually matter",
      body: [
        "Four, and only four, are worth weighing.",
        "**Typing speed under pressure.** Python solutions are roughly half the length. In a 45-minute interview or a timed contest, that is real: less to type, less to get wrong, more time thinking. This is the strongest single argument for Python and it is a practical one, not an aesthetic one.",
        "**Arbitrary-precision integers.** Python integers never overflow. Java's `int` silently wraps past 2.1 billion, and remembering to use `long` is a discipline you must maintain forever. This deletes an entire class of silent wrong answer, and it is the second-strongest argument for Python.",
        "**Visible structure.** Java makes you say `HashMap<String, List<Integer>>`. That is more typing and it is also a picture of exactly what you are holding. Some people find that clarifying — particularly when a solution involves nesting — and for them the verbosity is a feature rather than a tax.",
        "**What the room speaks.** A large share of interview loops at big companies, especially in India, are conducted in Java, and some interviewers are noticeably more fluent reading it. This matters less than people think — every major company accepts Python — but it is not zero.",
        "Notice what is not on that list: performance. It belongs in its own section because it is the argument people make most and it is very nearly always wrong.",
      ],
    },
    {
      id: "the-speed-argument",
      heading: "The speed argument, examined",
      body: [
        "Java runs faster than Python. Typically somewhere between ten and fifty times faster on tight numeric loops. That sounds decisive and it is almost never the thing that decides a submission.",
        "The reason is that time limits are set with interpreted languages in mind, and the gap between an accepted solution and a rejected one is virtually always a gap in *complexity*, not in constant factor. An O(n²) solution to a problem wanting O(n log n) fails in both languages. An O(n log n) solution passes in both.",
        "Where the constant factor does bite is narrow and worth naming so you can recognise it: very tight loops over 10⁷ or more elements on a strict judge. In that specific case Python needs its work pushed into built-ins — `sum`, `sorted`, slicing, `collections.Counter` — which are C underneath and roughly as fast as Java. If you are doing arithmetic element by element in a Python loop at that scale, you are the exception, and the fix is usually to stop looping rather than to change language.",
      ],
      examples: [
        {
          id: "same-solution",
          title: "The same solution, both languages",
          lang: "python",
          code: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []


print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))`,
          output: `[0, 1]
[1, 2]`,
          explanation:
            "Nine lines. Note `enumerate`, which hands you the index and the value together, and `in seen`, which is a hash lookup written as English. Both are things you will type thousands of times.",
        },
        {
          id: "same-solution-java",
          title: "And in Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i])) {
                return new int[] { seen.get(target - nums[i]), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[] { 2, 7, 11, 15 }, 9)));
        System.out.println(Arrays.toString(twoSum(new int[] { 3, 2, 4 }, 6)));
    }
}`,
          output: `[0, 1]
[1, 2]`,
          explanation:
            "Identical algorithm, roughly twice the characters. The extra text is the type declaration, the explicit `containsKey`, and `Arrays.toString` — because printing an array directly in Java gives you a memory address rather than its contents, which is a papercut you will meet within your first hour. Neither version is cleverer. One is quicker to type and one shows you the map's key and value types on the line that creates it.",
        },
      ],
      pitfalls: [
        {
          title: "Choosing Java because it is faster",
          body: "Unless you are writing tight numeric loops over ten million elements, this will not be the reason a submission fails. Complexity decides; constant factors decide the last few per cent. Choosing on this basis is optimising the wrong variable at the cost of the one that matters, which is how quickly you can express an idea.",
        },
        {
          title: "Switching language when you get stuck",
          body: "Being stuck is almost never a language problem, and switching resets your fluency clock to zero while feeling like progress. If a solution is hard to express, the usual cause is that you have not finished thinking, not that you are in the wrong syntax.",
        },
      ],
    },
    {
      id: "recommendation",
      heading: "A recommendation, since you asked",
      body: [
        "**Python, unless you have a specific reason not to.** Shorter to write, no overflow to remember, and a standard library whose defaults are the ones problem-solving wants. For most people practising for interviews, this is simply the better tool.",
        "**Java if** your target interviews are conducted in it and you want the practice to match, or if you already write it fluently — in which case the fluency you have beats the fluency you would have to build — or if you genuinely find the explicit types clarifying rather than noisy. That last one is real and not everybody has it.",
        "**Do not** pick C++ for this track. It is faster still and the standard library is excellent, but the ways it can go wrong — undefined behaviour, iterator invalidation, manual memory — are not the ways you are trying to learn about right now.",
        "This track shows every algorithm in both languages, so reading the one you did not choose costs you nothing and is worth doing occasionally. Write in one.",
      ],
    },
    {
      id: "commit",
      heading: "Committing properly",
      body: [
        "Having chosen, the rest of this module is about making that choice pay. Seven more lessons, each on one thing you will do constantly: the arithmetic traps, building strings, the collections and what they cost, iterating, sorting with a custom order, reading input fast, and the template you start every problem from.",
        "By the end you should be able to write all twelve core operations without looking anything up. That is what \"stop fighting the language\" means, and it is worth two or three hours to get there once rather than paying a tax on every problem for a year.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which language should you use in a coding interview?",
      answer:
        "Whichever you are most fluent in, unless the company has said otherwise — and almost none do. Fluency dominates everything else, because the interview measures how you think, and fumbling syntax obscures that. If you are equally comfortable in both, Python is usually the better choice under time pressure: it is roughly half the code and has no integer overflow to keep track of. It is worth asking at the start, and worth saying which you plan to use and why.",
    },
    {
      question: "Is Python too slow for coding interviews or contests?",
      answer:
        "For interviews, no — you are not judged on constant factors, and the algorithmic complexity is the whole discussion. For competitive programming it can matter, but the fix is usually to push work into built-ins like `sum`, `sorted` and `Counter`, which are implemented in C, rather than to change language. The cases where Python genuinely cannot pass a strict limit are narrow: tight element-by-element arithmetic over ten million or more values.",
    },
    {
      question: "Why does Python not have integer overflow?",
      answer:
        "Because its integers are arbitrary-precision: they are not fixed-width machine words but objects that grow to hold whatever value they need, limited only by memory. Java's `int` is a fixed 32 bits, so exceeding its range wraps silently rather than growing. The trade is speed — Python's integers are slower because they are not raw machine words — for the removal of an entire category of silent wrong answer.",
    },
  ],
  takeaways: [
    "Fluency in one language beats any property of either; choose now and stop deliberating",
    "The four differences that matter: typing speed, overflow, visible structure, and what your interviewers read",
    "Speed is almost never the deciding factor — complexity is, and it fails in both languages equally",
    "Python's constant factor bites only in tight loops over 10⁷+ elements, and the fix is built-ins, not a rewrite",
    "Python is the default recommendation: half the code, no overflow, better defaults for problem solving",
    "Java is right if your interviews are in it, you are already fluent, or explicit types genuinely help you",
    "Being stuck is not a language problem, and switching resets your fluency while feeling like progress",
  ],
};
