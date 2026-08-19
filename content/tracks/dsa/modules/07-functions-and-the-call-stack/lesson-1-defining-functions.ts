import type { Lesson } from "@/content/types";

export const definingFunctionsLesson: Lesson = {
  id: "dsa-fn-defining",
  slug: "defining-functions",
  moduleSlug: "functions-and-the-call-stack",
  title: "Defining a Function",
  summary:
    "Parameters, arguments and return values — and the two habits that make a function something you can test rather than something you have to read.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Define and call functions in both languages",
    "Distinguish a parameter from an argument, and say why it matters",
    "Return a value rather than printing one, and explain the difference",
    "Recognise a function that is doing more than one thing",
  ],
  sections: [
    {
      id: "why",
      heading: "What a function is for",
      body: [
        "A function gives a piece of work a **name** and a **boundary**. Those are two different benefits and both matter.",
        "The name is documentation that cannot go stale — `binarySearch` says what the twenty lines do, and unlike a comment it is checked by the compiler every time it is called.",
        "The boundary is what makes the work testable. A function has declared inputs and one output, so you can call it with a value and check what comes back. Twenty lines inline in a loop cannot be tested at all without running everything around them.",
        "That second point is why this module comes before recursion and before every algorithm in Module 1. The unit you test, the unit you reason about, and the unit an interviewer asks you to write are all functions.",
      ],
      examples: [
        {
          id: "basics",
          title: "The parts",
          lang: "python",
          code: `def add(a, b):
    return a + b


def shout(text):
    print(text.upper())


print(add(2, 3))
print(add(add(1, 2), 4))

result = shout("hello")
print("shout returned:", result)`,
          output: `5
7
HELLO
shout returned: None`,
          explanation:
            "`a` and `b` are **parameters** — the names in the definition. The `2` and `3` at the call site are **arguments** — the values supplied. The distinction is worth keeping because error messages use both words and they mean different things.\n\nThe last two lines are the important part: `shout` prints and returns nothing, so `result` is `None`. A function that prints has *done* something; a function that returns has *produced* something, and only the second can be used in an expression or checked by a test.",
        },
      ],
    },
    {
      id: "return-not-print",
      heading: "Return, do not print",
      body: [
        "This is the single most common structural mistake beginners make, and it is worth stating as a rule: **a function that computes something should return it, not print it.**",
        "A returned value can be tested, stored, passed on, and combined. A printed one is gone — the only thing the caller receives is `None`.",
        "It also matters directly for this track: every problem on the sheet, and every interview question, asks for a function that *returns* an answer. A solution that prints the right thing scores zero, because the harness calls your function and looks at what came back.",
        "Print at the edges — in `main`, in a test — and return everywhere else.",
      ],
      examples: [
        {
          id: "return-vs-print",
          title: "The same computation, one of them usable",
          lang: "python",
          code: `def largest_printing(values):
    biggest = values[0]
    for v in values:
        if v > biggest:
            biggest = v
    print(biggest)


def largest_returning(values):
    biggest = values[0]
    for v in values:
        if v > biggest:
            biggest = v
    return biggest


largest_printing([3, 9, 4])
print("can I use it?", largest_printing([3, 9, 4]) )

answer = largest_returning([3, 9, 4])
print("doubled:", answer * 2)
print("compared:", largest_returning([1, 2]) < largest_returning([5, 6]))`,
          output: `9
9
can I use it? None
doubled: 18
compared: True`,
          explanation:
            "The printing version's value cannot be doubled, compared, or checked — the caller gets `None`. Note it printed 9 twice: once from each call, with the second call's print appearing *before* the `can I use it?` text, because the argument is evaluated before the outer `print` runs. That evaluation order is worth noticing on its own.",
        },
      ],
      pitfalls: [
        {
          title: "A function with no `return` on some path",
          body: "In Python a function that falls off the end returns `None`, silently. In Java the compiler rejects a non-void method with a path that does not return — one of the places its strictness genuinely helps. If a Python function sometimes returns `None` unexpectedly, look for a branch with no `return`.",
        },
      ],
    },
    {
      id: "java-side",
      heading: "The same thing in Java",
      body: [
        "Java requires a **return type** before the name and a **type for every parameter**. `void` means the method returns nothing.",
        "`static` matters for this track: a static method belongs to the class and can be called without creating an object, which is why every helper in a single-file solution is static. A non-static method needs an instance, and there is none in `main`.",
      ],
      examples: [
        {
          id: "java-basics",
          title: "Types, and why everything is static here",
          lang: "java",
          code: `public class Main {
    static int add(int a, int b) {
        return a + b;
    }

    static void shout(String text) {
        System.out.println(text.toUpperCase());
    }

    static int largest(int[] values) {
        int biggest = values[0];
        for (int v : values) {
            if (v > biggest) {
                biggest = v;
            }
        }
        return biggest;
    }

    public static void main(String[] args) {
        System.out.println(add(2, 3));
        shout("hello");
        System.out.println(largest(new int[] { 3, 9, 4 }) * 2);
    }
}`,
          output: `5
HELLO
18`,
          explanation:
            "Three methods, all `static` so `main` can call them directly. The return type is part of the signature and is checked: returning a `String` from a method declared `int` does not compile, which catches a real class of mistake that Python finds only at run time.",
        },
      ],
    },
    {
      id: "one-thing",
      heading: "One function, one job",
      body: [
        "The test is whether you can describe what a function does **in one sentence with no \"and\"**. If the sentence needs an \"and\", it is probably two functions.",
        "This is not aesthetics. A function that reads input, computes an answer and prints it cannot be tested without supplying fake input and capturing output. Split into three, the middle one is a pure computation you can call with a list and compare against an expected value — which is exactly what the practice console does with your solutions.",
      ],
      examples: [
        {
          id: "splitting",
          title: "Three jobs, separated",
          lang: "python",
          code: `def parse(line):
    return [int(part) for part in line.split()]


def largest_even(values):
    evens = [v for v in values if v % 2 == 0]
    return max(evens) if evens else None


def report(value):
    return "none found" if value is None else f"largest even: {value}"


line = "3 8 1 6 5"
print(report(largest_even(parse(line))))
print(report(largest_even(parse("1 3 5"))))

# Each piece is testable on its own.
print(parse("1 2") == [1, 2])
print(largest_even([2, 4, 3]) == 4)
print(largest_even([1, 3]) is None)`,
          output: `largest even: 8
none found
True
True
True`,
          explanation:
            "Three functions, three sentences with no \"and\": parse a line into numbers; find the largest even value; describe a result. The last three lines test each independently, with no input to fake and no output to capture. Note `largest_even` returns `None` rather than printing a message when there is nothing — deciding what to *say* about that is `report`'s job, not its own.",
        },
      ],
      pitfalls: [
        {
          title: "A function that both computes and prints",
          body: "The most common version of doing two things. It cannot be reused anywhere the message is wrong, cannot be tested without capturing stdout, and cannot be composed. Returning the value and letting the caller decide how to present it costs nothing and removes all three problems.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a parameter and an argument?",
      answer:
        "A parameter is the name in the function's definition; an argument is the value supplied at the call site. `def add(a, b)` declares two parameters, and `add(2, 3)` passes two arguments. The distinction matters because error messages and documentation use both terms precisely — \"expected 2 arguments, got 3\" is about the call, while a question about a parameter's type is about the definition.",
    },
    {
      question: "Why should a function return a value rather than print it?",
      answer:
        "Because a returned value can be tested, stored, combined and passed on, while a printed one is gone and the caller receives nothing. It matters concretely for interviews and judges: the harness calls your function and inspects the return value, so a solution that prints the right answer scores zero. The rule is to print at the edges — in `main` or in a test — and return everywhere else.",
    },
    {
      question: "How do you know a function is doing too much?",
      answer:
        "If you cannot describe it in one sentence without an \"and\". The usual symptom is a function that both computes and presents — reading input, calculating, and printing — which cannot be tested without faking input and capturing output. Splitting it leaves a pure computation in the middle that takes a value and returns a value, and that piece can be checked with a single equality assertion.",
    },
  ],
  takeaways: [
    "A function gives work a name and a boundary; the boundary is what makes it testable",
    "Parameters are the names in the definition; arguments are the values at the call site",
    "Return, do not print — a printed value is gone and the caller gets nothing",
    "Judges and interviews call your function and inspect the return value",
    "A Python function with no `return` on a path silently returns `None`; Java rejects it at compile time",
    "Java needs a return type and a type per parameter; `static` lets `main` call it without an object",
    "If describing the function needs an \"and\", it is probably two functions",
    "Print at the edges, return everywhere else",
  ],
};
