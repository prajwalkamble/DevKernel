import type { Lesson } from "@/content/types";

export const starterTemplateLesson: Lesson = {
  id: "dsa-lang-template",
  slug: "the-starter-template",
  moduleSlug: "your-solving-language",
  title: "The Template You Type From Muscle Memory",
  summary:
    "The twelve operations that appear in almost every solution, in one place — plus the blank page you should be able to reproduce without thinking.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Reproduce a working starter file in your chosen language without looking anything up",
    "Perform the twelve core operations from memory",
    "Explain what belongs in a template and what does not",
    "Self-test your fluency and know what to drill",
  ],
  sections: [
    {
      id: "why-a-template",
      heading: "Why have one at all",
      body: [
        "Every problem starts the same way: a file, a function, a way to check it works. If typing that costs you two minutes and any thought at all, you have spent two minutes and some attention on something that is identical every time.",
        "A template is not about saving keystrokes. It is about removing a decision. The blank page is where hesitation starts, and starting from a page that is already correct means the first thing you think about is the problem.",
        "The rule for what goes in: **everything you need every time, and nothing you need sometimes.** A template with eleven unused imports is a template you edit before you can use, which defeats it.",
      ],
    },
    {
      id: "python-template",
      heading: "The Python template",
      body: [
        "Short, because Python needs little. Two imports that genuinely are needed most of the time, a function, and a `main` guard so you can add tests without them running on import.",
      ],
      examples: [
        {
          id: "python-template",
          title: "solution.py",
          lang: "python",
          code: `from collections import Counter, defaultdict, deque
import heapq


def solve(nums, target):
    # Restate: what is this asking, in one sentence?
    # Brute force: what would trying everything look like?
    # Constraints: what complexity am I allowed?
    return []


def main():
    print(solve([2, 7, 11, 15], 9))
    print(solve([3, 2, 4], 6))
    print(solve([], 0))          # the empty case, always


if __name__ == "__main__":
    main()`,
          output: `[]
[]
[]`,
          explanation:
            "Three calls, including the empty input, before the function does anything. That ordering is deliberate: the test cases are written while you still remember what the edge cases are, which is before you have started thinking about the algorithm. The three comments are the first three steps of the Framework, sitting where you will see them.",
        },
      ],
    },
    {
      id: "java-template",
      heading: "The Java template",
      body: [
        "Longer, and worth typing from memory a few times until it is automatic. `import java.util.*` is the one import that earns its place unconditionally.",
      ],
      examples: [
        {
          id: "java-template",
          title: "Main.java",
          lang: "java",
          code: `import java.util.*;

public class Main {

    static int[] solve(int[] nums, int target) {
        // Restate: what is this asking, in one sentence?
        // Brute force: what would trying everything look like?
        // Constraints: what complexity am I allowed?
        return new int[] {};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solve(new int[] { 2, 7, 11, 15 }, 9)));
        System.out.println(Arrays.toString(solve(new int[] { 3, 2, 4 }, 6)));
        System.out.println(Arrays.toString(solve(new int[] {}, 0)));
    }
}`,
          output: `[]
[]
[]`,
          explanation:
            "`static` on `solve` so `main` can call it without constructing anything, and `Arrays.toString` on every print because printing an array directly gives you something like `[I@2f92e0f4`. Both of those are papercuts that cost people a minute each, every time, until they become automatic.",
        },
      ],
    },
    {
      id: "twelve-operations",
      heading: "The twelve operations",
      body: [
        "These are what solutions are made of. If all twelve are automatic, the language has stopped being in your way — which is the entire goal of this module.",
      ],
      examples: [
        {
          id: "twelve-python",
          title: "All twelve, Python",
          lang: "python",
          code: `from collections import Counter, defaultdict, deque
import heapq
import bisect

nums = [4, 1, 4, 9, 1, 4]
words = ["fig", "apple", "kiwi"]

print(1, len(nums), max(nums), min(nums), sum(nums))
print(2, sorted(nums), sorted(words, key=len))
print(3, [n for n in nums if n > 2])
print(4, set(nums), 9 in set(nums))
print(5, dict(Counter(nums)))

groups = defaultdict(list)
for w in words:
    groups[len(w)].append(w)
print(6, dict(groups))

queue = deque([1, 2, 3])
queue.append(4)
print(7, queue.popleft(), list(queue))

heap = [5, 1, 3]
heapq.heapify(heap)
print(8, heapq.heappop(heap))

print(9, list(enumerate(words)))
print(10, list(zip(words, nums)))
print(11, "-".join(words), "abc"[::-1])
print(12, bisect.bisect_left([1, 3, 5, 7], 5))`,
          output: `1 6 9 1 23
2 [1, 1, 4, 4, 4, 9] ['fig', 'kiwi', 'apple']
3 [4, 4, 9, 4]
4 {1, 4, 9} True
5 {4: 3, 1: 2, 9: 1}
6 {3: ['fig'], 5: ['apple'], 4: ['kiwi']}
7 1 [2, 3, 4]
8 1
9 [(0, 'fig'), (1, 'apple'), (2, 'kiwi')]
10 [('fig', 4), ('apple', 1), ('kiwi', 4)]
11 fig-apple-kiwi cba
12 2`,
          explanation:
            "Length, max, min, sum; sort with a key; filter; set membership; count; group; queue; heap; enumerate and zip; join and reverse; binary search. That is the whole vocabulary. Everything in Module 1 is these twelve operations arranged differently — which is why getting them into muscle memory now is worth an afternoon.",
        },
        {
          id: "twelve-java",
          title: "The same twelve, Java",
          lang: "java",
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = { 4, 1, 4, 9, 1, 4 };
        List<String> words = new ArrayList<>(List.of("fig", "apple", "kiwi"));

        int sum = 0, max = Integer.MIN_VALUE;
        for (int n : nums) { sum += n; max = Math.max(max, n); }
        System.out.println("1 " + nums.length + " " + max + " " + sum);

        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        words.sort(Comparator.comparingInt(String::length));
        System.out.println("2 " + Arrays.toString(sorted) + " " + words);

        List<Integer> kept = new ArrayList<>();
        for (int n : nums) if (n > 2) kept.add(n);
        System.out.println("3 " + kept);

        Set<Integer> unique = new HashSet<>(kept);
        System.out.println("4 " + unique.contains(9));

        Map<Integer, Integer> counts = new HashMap<>();
        for (int n : nums) counts.merge(n, 1, Integer::sum);
        System.out.println("5 " + counts);

        Map<Integer, List<String>> groups = new TreeMap<>();
        for (String w : words) groups.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
        System.out.println("6 " + groups);

        Deque<Integer> queue = new ArrayDeque<>(List.of(1, 2, 3));
        queue.addLast(4);
        System.out.println("7 " + queue.pollFirst() + " " + queue);

        PriorityQueue<Integer> heap = new PriorityQueue<>(List.of(5, 1, 3));
        System.out.println("8 " + heap.poll());

        System.out.println("9 " + String.join("-", words));
        System.out.println("10 " + new StringBuilder("abc").reverse());
        System.out.println("11 " + Arrays.binarySearch(new int[] { 1, 3, 5, 7 }, 5));
        System.out.println("12 " + Math.floorMod(-7, 3));
    }
}`,
          output: `1 6 9 23
2 [1, 1, 4, 4, 4, 9] [fig, kiwi, apple]
3 [4, 4, 9, 4]
4 true
5 {1=2, 4=3, 9=1}
6 {3=[fig], 4=[kiwi], 5=[apple]}
7 1 [2, 3, 4]
8 1
9 fig-kiwi-apple
10 cba
11 2
12 2`,
          explanation:
            "Notice line 9: `words` prints in length order because the sort on line 2 mutated the list in place. That is not a bug in the example — it is the thing to notice. Java's `sort` on a `List` mutates; Python's `sorted` returns a copy and `.sort()` mutates. Mixing those up is a real source of confusion, and seeing it happen here is cheaper than debugging it later.",
        },
      ],
    },
    {
      id: "fluency-test",
      heading: "Testing your own fluency",
      body: [
        "A concrete check, worth doing honestly. Close this page and write, from memory, without looking anything up:",
        "The starter file for your language. A hash map from string to list, populated with two entries. A frequency count of a list of integers. The top two most frequent values. A sort by length, then alphabetically. A BFS-shaped queue with pushes and pops at the right ends. A min-heap with three pushes and one pop. A binary search for the first index at or above a value.",
        "Anything that made you pause is what to drill. Not by reading about it — by typing it five times, on five separate occasions, until the pause is gone. That is a genuinely small amount of work and it removes a tax you would otherwise pay on every problem for the next year.",
        "That completes the language module. From here on, this track assumes the twelve operations are available to you without thought, and spends its attention entirely on the algorithms.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Should you use a prepared template in a coding interview?",
      answer:
        "A small one, yes — a function signature and a couple of test calls is normal and shows organisation. What does not belong is a contest harness: fast input readers, unused imports, macros. There is no standard input in an interview, so that code is answering a question nobody asked, and it spends your opening minutes on setup rather than on clarifying the problem. Keep the habit, drop the machinery.",
    },
    {
      question: "Why does printing a Java array give something like `[I@2f92e0f4`?",
      answer:
        "Arrays inherit `Object.toString()`, which prints the type descriptor and the identity hash code rather than the contents — `[I` means an array of `int`. `Arrays.toString(array)` prints a one-dimensional array's elements, and `Arrays.deepToString(array)` handles nested arrays. Python has no equivalent problem because its lists implement a sensible `repr`.",
    },
    {
      question: "What is the difference between `sorted(values)` and `values.sort()` in Python?",
      answer:
        "`sorted` returns a new sorted list and leaves the original alone; `.sort()` sorts in place and returns `None`. Use `sorted` when you need the original order preserved — which matters whenever the problem asks for indices — and `.sort()` when you do not. Java's `Collections.sort` and `List.sort` both mutate, with no returning equivalent, so a defensive `clone()` or a copy is the way to keep the original there.",
    },
  ],
  takeaways: [
    "A template removes a decision, not keystrokes — the blank page is where hesitation starts",
    "Include what you need every time and nothing you need sometimes",
    "Write the test calls, including the empty input, before writing the function",
    "Java: `static` on the solver so `main` can call it, and `Arrays.toString` on every array you print",
    "Twelve operations cover nearly every solution; Module 1 is those twelve rearranged",
    "Java's `List.sort` mutates; Python's `sorted` copies and `.sort()` mutates",
    "Test your fluency by writing all twelve from memory, and drill whatever made you pause",
    "Keep the small template in interviews and drop the contest input machinery",
  ],
};
