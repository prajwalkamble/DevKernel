import type { Lesson } from "@/content/types";

export const testingAndDebuggingLesson: Lesson = {
  id: "dsa-intro-testing-and-debugging",
  slug: "testing-and-debugging-by-hand",
  moduleSlug: "introduction-to-programming",
  title: "Testing & Debugging Before You Have Any Tooling",
  summary:
    "Tracing a program on paper, print debugging done properly, shrinking a failing input, and the brute-force oracle that finds bugs no hand-picked test ever will.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Trace a short program by hand and produce the same answer the machine does",
    "Use print debugging deliberately rather than by scattering print statements",
    "Shrink a large failing input down to a minimal one",
    "Build a brute-force oracle and use random testing to find bugs you would not have guessed",
  ],
  sections: [
    {
      id: "why-by-hand",
      heading: "Why by hand, when debuggers exist",
      body: [
        "Debuggers are good and you should learn one eventually. But the skills in this lesson are the ones that transfer to the situations where you have no debugger: an interview whiteboard, a shared editor with no run button, a contest where you have three minutes left.",
        "More importantly, tracing by hand builds something a debugger actively erodes — a model of what your program does. A debugger shows you what happened. Tracing forces you to predict what will happen, and then find out whether you were right. The gap between your prediction and reality is precisely where your misunderstanding lives, and it is the only reliable way to find it.",
      ],
    },
    {
      id: "tracing",
      heading: "Tracing on paper",
      body: [
        "The technique is a table. One column per variable, one row per iteration. Fill it in by executing the program in your head, slowly, writing every value down.",
        "The rule that makes it work: **write down what actually happens, not what you intended to happen**. This is much harder than it sounds. Your eyes will read `i <= n` and your brain will process `i < n`, because that is what you meant. Tracing only finds bugs if you read what is on the page.",
      ],
      examples: [
        {
          id: "trace-target",
          title: "The program to trace",
          lang: "python",
          code: `def count_pairs(values, target):
    count = 0
    for i in range(len(values)):
        for j in range(i, len(values)):
            if values[i] + values[j] == target:
                count += 1
    return count

print(count_pairs([1, 3, 2, 3], 4))`,
          output: `3`,
          explanation:
            "Before reading on, decide for yourself whether 3 is right. The array is `[1, 3, 2, 3]` and the target is 4. Predicting first is the entire point — if your prediction was 2, the trace below will show you exactly which row you did not expect, and that row is worth more to you than the answer is.",
        },
        {
          id: "trace-table",
          title: "The trace, one row per inner iteration",
          lang: "bash",
          code: `values = [1, 3, 2, 3]   target = 4

   i   j   values[i]  values[j]   sum   equal?   count
   -   -   ---------  ---------   ---   ------   -----
   0   0       1          1        2      no       0
   0   1       1          3        4     YES       1
   0   2       1          2        3      no       1
   0   3       1          3        4     YES       2
   1   1       3          3        6      no       2
   1   2       3          2        5      no       2
   1   3       3          3        6      no       2
   2   2       2          2        4     YES       3     <-- !
   2   3       2          3        5      no       3
   3   3       3          3        6      no       3

  final count = 3, which is what the program printed`,
          explanation:
            "Ten rows, three hits. Two of them are the pairs you would expect — index 0 with index 1, and index 0 with index 3, both 1 + 3. The third, marked with the arrow, is index 2 paired with *itself*: `range(i, len(values))` starts at `i`, so `j == i` is reached, and 2 + 2 is 4. That is almost certainly not what a \"count the pairs\" problem wants, and the loop should start at `i + 1`. Note what just happened: the trace did not find a coding error, it found an unasked question about the specification — and it found it before the code was ever submitted anywhere.",
        },
      ],
    },
    {
      id: "print-debugging",
      heading: "Print debugging, done deliberately",
      body: [
        "When the trace and the program disagree, the machine settles it. But scattering `print(x)` everywhere produces a wall of unlabelled numbers that is barely more useful than the disagreement.",
        "Three rules make print debugging into an actual technique.",
        "**Label everything.** `print(\"i\", i, \"j\", j, \"count\", count)` — never a bare value. Ten lines in, unlabelled output is unreadable.",
        "**Print at the decision, not at the top.** You want the values at the moment the branch is taken, because that is where your model and reality diverge.",
        "**Print the condition's value, not just its inputs.** Seeing `sum=4 equal=True` is immediate; seeing `4` and working out what the code concluded is a second inference you do not need to make.",
      ],
      examples: [
        {
          id: "instrumented",
          title: "The same function, instrumented",
          lang: "python",
          code: `def count_pairs(values, target):
    count = 0
    for i in range(len(values)):
        for j in range(i, len(values)):
            total = values[i] + values[j]
            hit = total == target
            print(f"i={i} j={j} {values[i]}+{values[j]}={total} hit={hit} count={count}")
            if hit:
                count += 1
    return count

print("answer:", count_pairs([1, 3, 2], 4))`,
          output: `i=0 j=0 1+1=2 hit=False count=0
i=0 j=1 1+3=4 hit=True count=0
i=0 j=2 1+2=3 hit=False count=1
i=1 j=1 3+3=6 hit=False count=1
i=1 j=2 3+2=5 hit=False count=1
i=2 j=2 2+2=4 hit=True count=1
answer: 2`,
          explanation:
            "Now the behaviour is not in dispute. Two hits: `(0,1)` and `(2,2)`. And the second one exposes the real question — the code counts an element paired with *itself*, which is almost never what a \"find two numbers\" problem wants. This is not a coding bug at all; it is an unasked question about the specification, surfaced by instrumenting the loop. `range(i, ...)` should almost certainly have been `range(i + 1, ...)`.",
        },
      ],
      pitfalls: [
        {
          title: "Leaving debug prints in a submitted solution",
          body: "On a judge this is a wrong answer, because the extra lines are compared against the expected output. In an interview it reads as untidy. Delete them as soon as they have done their job — and if you find yourself re-adding the same ones, that is a sign the function wants splitting up.",
        },
        {
          title: "Printing inside a loop over a large input",
          body: "A million lines of output takes longer to produce than the algorithm takes to run, and you cannot read it anyway. Shrink the input first. Which is the next section.",
        },
      ],
    },
    {
      id: "shrinking",
      heading: "Shrinking a failing input",
      body: [
        "You have a bug that shows up on an input of a thousand elements. Do not debug that input. Find a smaller one that fails the same way, and debug that.",
        "The procedure is mechanical. Halve the input. Does it still fail? If yes, halve again. If no, put back the half you removed and halve the other one. Repeat until removing anything makes the failure go away.",
        "You now have a minimal reproducing case — typically three or four elements — that you can trace by hand in a minute. And the shape of that minimal case usually names the bug outright: if it is all-negative, your accumulator started at zero; if it is two identical values, your comparison used `>` where it needed `>=`.",
        "The reason this feels like a detour and is not: debugging effort scales with input size, and shrinking is a handful of runs. Ten minutes of halving beats an hour of squinting at a thousand numbers, every time.",
      ],
    },
    {
      id: "oracle",
      heading: "The brute force as an oracle",
      body: [
        "The most powerful technique in this lesson, and the one almost nobody uses early.",
        "You have a fast solution you are unsure about. You also have — or can write in two minutes — a slow, obviously-correct one. Generate random small inputs, run both, and compare. When they disagree, you have a failing case *and* you know the right answer, and because the input is small you can trace it.",
        "This finds bugs that hand-picked tests never will, because you did not think of them — which is exactly why the bug is there.",
      ],
      examples: [
        {
          id: "random-testing",
          title: "A fast solution, an obvious one, and ten thousand random comparisons",
          lang: "python",
          code: `import random


def largest_fast(values):
    """The one under suspicion."""
    biggest = 0
    for value in values:
        if value > biggest:
            biggest = value
    return biggest


def largest_obvious(values):
    """Slow, dumb, and clearly right."""
    return sorted(values)[-1]


random.seed(7)
for trial in range(10000):
    n = random.randint(1, 6)
    values = [random.randint(-10, 10) for _ in range(n)]

    fast = largest_fast(values)
    obvious = largest_obvious(values)

    if fast != obvious:
        print("MISMATCH on", values)
        print("  fast   :", fast)
        print("  obvious:", obvious)
        break
else:
    print("10000 random tests passed")`,
          output: `MISMATCH on [-8]
  fast   : 0
  obvious: -8`,
          explanation:
            "Found in a fraction of a second, and the failing input is a single negative number — about as small and as traceable as a counterexample gets. This is the same bug from the errors lesson, but notice the difference: there you were told about it, and here it was *found*, by a loop that knew nothing about the bug. Note also `random.seed(7)`: without it the failing case differs on every run, and a reproducible failure is worth far more than a random one.",
        },
      ],
      pitfalls: [
        {
          title: "Generating inputs that are too large or too tame",
          body: "Random tests find bugs when the values are small and the arrays are short, because that is where duplicates, negatives and single-element cases occur often. Ranges like `randint(-10, 10)` with `n` up to 6 produce collisions and edge cases constantly. `randint(0, 10**9)` with n = 1000 will almost never generate a duplicate and finds nothing.",
        },
        {
          title: "Comparing against a reference that shares the bug",
          body: "If you write the oracle by copying the fast version and simplifying it, you may copy the mistaken assumption too. The oracle should be written from the problem statement, as stupidly as possible — sort the whole thing, try every pair, whatever is obviously correct regardless of cost.",
        },
      ],
    },
    {
      id: "the-loop",
      heading: "The whole loop, in order",
      body: [
        "Putting the module together, this is what solving a problem looks like from here on.",
        "**Read the statement properly** — all four parts, and restate it in one sentence.",
        "**Write the test list from the constraints** before any code: smallest input, two elements, all-negative, all-identical, largest.",
        "**Write the obvious solution**, however slow. It is your oracle and your proof that you understood the question.",
        "**Trace it by hand** on the smallest test. Predict first, then run.",
        "**When it disagrees, instrument the decision** — label everything, print the condition's value.",
        "**When a big input fails, shrink it** by halving until nothing more can be removed.",
        "**When you write a faster version, keep the slow one** and compare them on ten thousand random small inputs.",
        "None of this requires tooling, an IDE or experience. It is available to you on your very first problem, and it is most of what separates people who make steady progress from people who get stuck and stay stuck.",
        "That completes Module 0's first module. You now have a working setup, a model of what a program is, and a method for finding out when one is wrong. The next module is the choice of language you will carry through the rest of the track.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you debug a solution that gives the wrong answer on a large input?",
      answer:
        "Shrink the input before debugging it. Halve it, check whether it still fails, and keep halving — putting back the half you removed if the failure disappears — until removing anything makes it pass. That gives a minimal reproducing case of a few elements, which can be traced by hand, and its shape usually names the bug: all-negative points at an accumulator initialised to zero, two identical values at a strict comparison that should be non-strict. Debugging effort scales with input size, so the shrinking pays for itself immediately.",
    },
    {
      question: "What is a brute-force oracle and why is it worth writing?",
      answer:
        "A deliberately slow but obviously correct implementation, used as a reference to test a fast one against. You generate random small inputs, run both, and compare; a disagreement gives you a failing case together with the correct answer, on an input small enough to trace. It finds the bugs hand-written tests miss, because those are precisely the cases you did not think of. The one discipline is to write the oracle from the problem statement rather than by simplifying the fast version, or it may inherit the same wrong assumption.",
    },
    {
      question: "You have no debugger. How do you find where a program goes wrong?",
      answer:
        "Trace it on paper first — a table with one column per variable and one row per iteration — reading what is written rather than what you intended. Where the trace and the program disagree, instrument that point: print labelled values at the decision, including the condition's own truth value, not just its inputs. That narrows it to a specific line and a specific iteration. Tracing before running matters because it forces a prediction, and the gap between prediction and behaviour is where the misunderstanding is.",
    },
  ],
  takeaways: [
    "Tracing forces a prediction; the gap between it and reality is where your misunderstanding lives",
    "Trace what is written, not what you meant — your eyes will read `<=` as `<` if that is what you intended",
    "Label every debug print, print at the decision, and print the condition's value rather than its inputs",
    "Delete debug prints before submitting; on a judge they are a wrong answer",
    "Shrink a failing input by halving until nothing more can be removed, then trace the minimal case",
    "The shape of the minimal failing case usually names the bug outright",
    "Keep the brute force as an oracle and compare on random small inputs — small values and short arrays find the most",
    "Seed your random generator, so a failure you found is a failure you can reproduce",
  ],
};
