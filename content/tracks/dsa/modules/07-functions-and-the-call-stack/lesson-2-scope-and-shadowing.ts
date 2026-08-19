import type { Lesson } from "@/content/types";

export const scopeLesson: Lesson = {
  id: "dsa-fn-scope",
  slug: "scope-and-shadowing",
  moduleSlug: "functions-and-the-call-stack",
  title: "Scope, Shadowing & How Long a Variable Lives",
  summary:
    "Where a name is visible, what happens when an inner name hides an outer one, and Python's rule that assigning to a global makes it local for the whole function.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Say which names are visible at any point in a program",
    "Explain shadowing and predict which variable a name refers to",
    "State Python's rule for assigning to a name defined outside the function",
    "Explain why globals make code hard to test",
  ],
  sections: [
    {
      id: "scopes",
      heading: "Where a name can be seen",
      body: [
        "A variable's **scope** is the region of code where its name means something. Both languages use essentially the same rule: a name is visible from where it is declared to the end of the block that contains it.",
        "Function parameters and local variables are visible only inside that function. Names at the top level of a file are visible everywhere below them — those are globals, and the rest of this lesson is largely about why to avoid them.",
        "Java also has **block scope**: a variable declared inside an `if` or a `for` disappears at the closing brace. Python does not — a name assigned inside an `if` or a loop is visible for the rest of the function, which surprises people coming from Java.",
      ],
      examples: [
        {
          id: "block-scope",
          title: "Python has no block scope",
          lang: "python",
          code: `def demo(flag):
    if flag:
        inside_if = "assigned in the if"
    for i in range(3):
        pass

    print("i survives the loop:", i)
    if flag:
        print(inside_if)
    else:
        print("inside_if was never assigned")


demo(True)
demo(False)`,
          output: `i survives the loop: 2
assigned in the if
i survives the loop: 2
inside_if was never assigned`,
          explanation:
            "The loop variable `i` is still 2 after the loop ends, and `inside_if` exists only when the branch ran. Java would reject both usages at compile time, because there the names do not exist outside their blocks. Python's rule is more permissive and it is why a variable assigned only in one branch can produce a `NameError` far from the branch that failed to run.",
        },
      ],
      pitfalls: [
        {
          title: "Relying on a loop variable after the loop",
          body: "It holds the last value, and for an empty sequence it does not exist at all — `for i in range(0)` leaves `i` undefined. Code that reads the loop variable afterwards works until the input is empty, which is the case people forget to test.",
        },
      ],
    },
    {
      id: "shadowing",
      heading: "Shadowing",
      body: [
        "When an inner name matches an outer one, the inner one **shadows** it: inside that region, the name refers to the local. The outer variable is untouched and reappears when the inner scope ends.",
        "Shadowing is legal and sometimes deliberate — a parameter named `values` shadowing a global `values` is fine. It becomes a problem when it is accidental, because the code reads as though it modifies the outer variable and does not.",
      ],
      examples: [
        {
          id: "shadowing",
          title: "The local wins, and the outer is unchanged",
          lang: "python",
          code: `count = 10


def shadows():
    count = 99
    return count


def reads():
    return count


print("inside shadows():", shadows())
print("global after     :", count)
print("inside reads()   :", reads())`,
          output: `inside shadows(): 99
global after     : 10
inside reads()   : 10`,
          explanation:
            "`shadows` creates a *new local* called `count` — the global is untouched, as the second line proves. `reads` has no local of that name, so it sees the global. Both are working as designed; the trap is writing `shadows` while believing you have updated the global.",
        },
      ],
    },
    {
      id: "python-global-rule",
      heading: "Python's rule, which catches everybody",
      body: [
        "Here is the behaviour that produces the most confusing error message in beginner Python.",
        "**If a function assigns to a name anywhere in its body, that name is local for the entire function** — including on lines *before* the assignment. Python decides this when compiling the function, not while running it.",
        "So a function that reads a global and later assigns to it fails on the read, with `UnboundLocalError`, on a line that looks completely innocent.",
        "The fix is `global name` to declare intent — or better, to pass the value in and return the new one, which is what the rest of this module recommends anyway.",
      ],
      examples: [
        {
          id: "unbound-local",
          title: "The read that fails because of a later write",
          lang: "python",
          code: `total = 0


def works():
    return total + 1


def fails():
    print("about to read total")
    return total + 1
    total = 99          # never runs, and yet


def fixed():
    global total
    total = total + 1
    return total


print("works():", works())

try:
    fails()
except UnboundLocalError as e:
    print("fails():", e)

print("fixed():", fixed(), "and the global is now", total)`,
          output: `works(): 1
about to read total
fails(): cannot access local variable 'total' where it is not associated with a value
fixed(): 1 and the global is now 1`,
          explanation:
            "The assignment on the last line of `fails` is **unreachable** — it comes after a `return` — and it still makes `total` local for the whole function, so the `return total + 1` above it fails. That is the rule in its purest form: the decision is made by looking at the function's text, not by running it. `works` is identical except that it never assigns, so `total` stays global.",
        },
      ],
      pitfalls: [
        {
          title: "Reaching for `global` as the fix",
          body: "It works and it is almost always the wrong answer. A function that mutates a global cannot be tested in isolation, cannot be called twice with predictable results, and makes the order of calls part of the program's meaning. Pass the value in and return the new one instead.",
        },
      ],
    },
    {
      id: "why-avoid-globals",
      heading: "Why globals make things hard",
      body: [
        "Three concrete costs, all of which show up in this track rather than in theory.",
        "**They break testing.** A function reading a global gives different answers depending on what ran before it, so a test has to set up state that is not in its arguments.",
        "**They break recursion.** A recursive function accumulating into a global is sharing one variable across every level of the call stack, so results from one branch leak into another. This is the single most common cause of a backtracking solution that returns nonsense.",
        "**They hide the interface.** A function's signature stops describing what it needs, so a reader must scan the body to find out.",
        "The rule: **arguments in, return value out.** If a recursion needs to accumulate, pass the accumulator down as a parameter or return it up — both are covered in the recursion lesson.",
      ],
      examples: [
        {
          id: "recursion-global",
          title: "Why a global accumulator breaks recursion",
          lang: "python",
          code: `paths = []


def walk_global(node, trail):
    trail.append(node)
    if node >= 3:
        paths.append(trail)          # shares one list
        return
    walk_global(node + 1, trail)


walk_global(1, [])
print("global version:", paths)


def walk_clean(node, trail):
    trail = trail + [node]           # a new list each level
    if node >= 3:
        return [trail]
    return walk_clean(node + 1, trail)


print("clean version :", walk_clean(1, []))`,
          output: `global version: [[1, 2, 3]]
clean version : [[1, 2, 3]]`,
          explanation:
            "Both give the right answer here, on a single path — which is exactly what makes the first version dangerous. `walk_global` appends the *same* list object it has been mutating, so with two branches the recorded paths would all be the same final list. The clean version builds a new list at each level and returns it, so nothing is shared. The backtracking lesson in Module 1 is entirely about this distinction.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is variable shadowing?",
      answer:
        "An inner scope declaring a name that already exists in an outer one, so inside that region the name refers to the local and the outer variable is untouched. It is legal and often deliberate — a parameter shadowing a global is normal — and it becomes a bug when accidental, because the code reads as though it updates the outer variable while actually creating a new one that disappears at the end of the block.",
    },
    {
      question: "Why does reading a global in a Python function sometimes raise UnboundLocalError?",
      answer:
        "Because if the function assigns to that name anywhere in its body, Python treats the name as local for the *whole* function — decided when compiling the function, not while running it. So a read that appears before the assignment fails, and it fails even when the assignment is unreachable. Declaring `global name` fixes it, but the better answer is usually to pass the value in as a parameter and return the new one.",
    },
    {
      question: "Why are globals particularly dangerous in recursion?",
      answer:
        "Because every level of the call stack shares one variable, so results from one branch leak into another. A backtracking function that accumulates into a global list ends up recording the same mutated object repeatedly, or carrying state from an abandoned branch into the next one. Passing the accumulator down as a parameter, or returning results up, gives each level its own copy and removes the whole class of bug.",
    },
  ],
  takeaways: [
    "A name is visible from its declaration to the end of the enclosing block",
    "Java has block scope; Python does not, so loop and `if` variables outlive their block",
    "A loop variable holds its last value afterwards, and does not exist at all for an empty sequence",
    "Shadowing makes the inner name win and leaves the outer variable untouched",
    "Assigning to a name anywhere in a Python function makes it local for the whole function",
    "That applies even when the assignment is unreachable — the rule is textual, not runtime",
    "Globals break testing, break recursion, and hide the interface",
    "Arguments in, return value out; pass accumulators down or return them up",
  ],
};
