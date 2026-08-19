import type { Lesson } from "@/content/types";

export const whatAProgramIsLesson: Lesson = {
  id: "dsa-intro-what-a-program-is",
  slug: "what-a-program-is",
  moduleSlug: "introduction-to-programming",
  title: "What a Program Actually Is",
  summary:
    "Source code, the thing that turns it into instructions, and the machine that runs them — the model you need before any of the syntax means anything.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Describe what happens between the file you write and the work the machine does",
    "State the difference between a compiler and an interpreter, and where Java and Python each sit",
    "Explain why a Java mistake is often caught before the program runs and the same mistake in Python is not",
    "Say what memory is, at the level of detail the rest of this track needs",
  ],
  sections: [
    {
      id: "the-question",
      heading: "The question nobody answers first",
      body: [
        "Most first lessons open by having you type something and watch it print. That works, and you will do it in the next lesson. But it leaves a question unasked, and the gap it leaves is where a lot of later confusion comes from: *what is the thing you just typed, and what happened to it?*",
        "Here is the honest answer. A computer can do a small number of extremely simple things: copy a number from one place to another, add two numbers, compare two numbers, and — crucially — jump to a different instruction depending on the result of a comparison. That is very nearly the whole list. Everything else, every application you have ever used, is built out of billions of those operations arranged in the right order.",
        "The catch is that those operations are expressed as numbers. Not words — numbers. The instruction that adds two values is a specific number, the instruction that jumps is another. Writing a program directly in those numbers is possible, and for the first decade or so of computing it is roughly what people did. It is also unbearable.",
        "So we write something else. We write **source code** — text with words in it, designed for a human to read — and then a separate program turns that text into the numbers the machine can execute. That separate program is the part that is worth understanding early, because which kind of it you are using changes how your mistakes reach you.",
      ],
    },
    {
      id: "compilers-and-interpreters",
      heading: "Two ways to bridge the gap",
      body: [
        "There are two broad strategies for getting from your text to running instructions, and the two languages this track uses are the textbook examples of each.",
        "A **compiler** reads your entire source file before anything runs, checks that it makes sense, and translates it into instructions in one go. If anything in the file is wrong — a misspelled name, a missing bracket, an attempt to put text into a slot that only holds numbers — it stops and tells you, and no part of your program runs at all.",
        "An **interpreter** reads your source a piece at a time *while the program is running*, working out what each piece means as it reaches it. It does not check the whole file first. If line 40 contains nonsense, lines 1 to 39 will run perfectly happily, and you will find out about line 40 only when execution arrives there.",
        "Python is interpreted. Java is compiled — although with a twist worth knowing, because it explains the word most people meet without explanation.",
        "Java's compiler does not produce instructions for your particular machine. It produces instructions for an imaginary one, called **bytecode**, and then a program called the **Java Virtual Machine** — the JVM — runs that bytecode on whatever real machine you happen to have. That is the whole reason the same compiled Java file runs on Windows, macOS and Linux without being rebuilt: the differences between them are the JVM's problem, not yours.",
      ],
      examples: [
        {
          id: "pipeline",
          title: "The same journey, two routes",
          lang: "bash",
          code: `JAVA                                  PYTHON

  Main.java     (you write this)        main.py      (you write this)
      |                                     |
      | javac  — the compiler               | python3 — the interpreter
      | reads the WHOLE file first          | reads and runs a line at a time
      |                                     |
      v                                     v
  Main.class    (bytecode)              (no separate file you ever see)
      |                                     |
      | java — the JVM                      |
      v                                     v
  the machine does the work             the machine does the work

  Mistakes on line 40 stop you          Mistakes on line 40 are found
  BEFORE line 1 runs.                   only when line 40 is reached.`,
          explanation:
            "The two columns are not better and worse — they are a trade. Java makes you satisfy the compiler before you get to see anything happen at all, which is slower to start and catches a whole class of mistake for free. Python lets you run immediately and finds those same mistakes at the worst possible moment, which is faster to start and less forgiving later.",
        },
      ],
      pitfalls: [
        {
          title: "Believing \"it compiled\" means \"it is correct\"",
          body: "A compiler checks that your program is *meaningful*, not that it is *right*. A program that compiles perfectly can still add when it should subtract. Compilation rules out one category of mistake — roughly, sentences that are not grammatical — and says nothing at all about whether you wrote the sentence you meant.",
        },
        {
          title: "Assuming Python's flexibility is always an advantage",
          body: "It is genuinely faster to get something running, which matters a lot when you are practising. It also means a typo in a rarely-taken branch can sit undiscovered for months and then fire in front of an interviewer. Neither language is the right answer in general; you will pick one in the next module and stop thinking about it.",
        },
      ],
    },
    {
      id: "seeing-it",
      heading: "Seeing the difference for yourself",
      body: [
        "This is not an abstract distinction. Here is the same mistake — using a name that was never defined — in both languages, with the same structure: some work that succeeds, then the mistake.",
        "Read the outputs carefully. They are the whole lesson.",
      ],
      examples: [
        {
          id: "python-late-failure",
          title: "Python: the first three lines run, and then it stops",
          lang: "python",
          code: `print("step one")
print("step two")
print("step three")
print(undefined_name)
print("step five")`,
          output: `step one
step two
step three
Traceback (most recent call last):
  File "main.py", line 4, in <module>
    print(undefined_name)
          ^^^^^^^^^^^^^^
NameError: name 'undefined_name' is not defined`,
          explanation:
            "Three lines of output appeared before the failure. The interpreter had no idea line 4 was broken until it got there — and if line 4 had been inside a branch that only runs on Tuesdays, you would have found out on a Tuesday. Note also that line 5 never ran: once a program fails this way, it stops.",
        },
        {
          id: "java-early-failure",
          title: "Java: nothing runs at all",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println("step one");
        System.out.println("step two");
        System.out.println("step three");
        System.out.println(undefinedName);
        System.out.println("step five");
    }
}`,
          output: `Main.java:6: error: cannot find symbol
        System.out.println(undefinedName);
                           ^
  symbol:   variable undefinedName
  location: class Main
1 error
error: compilation failed`,
          explanation:
            "No \"step one\". The compiler read the entire file, found that `undefinedName` refers to nothing, and refused to produce a program at all — so there was never anything to run. That refusal is the feature: the mistake was found without the program being executed even once, and it would have been found the same way if line 6 were buried in a branch that runs once a year.",
        },
      ],
      pitfalls: [
        {
          title: "Reading only the last line of an error",
          body: "Both messages above tell you the file, the line number and the column. Beginners tend to see a wall of red and scroll past it; the information you need is almost always in the first two lines. Get into the habit now of reading the line number first — you will spend a meaningful fraction of your career doing exactly this.",
        },
      ],
    },
    {
      id: "memory",
      heading: "Where the values live",
      body: [
        "One more piece of the model, kept deliberately small.",
        "When your program runs, it is given a large block of **memory** to work with. Picture it as an enormous row of numbered boxes, each holding a small amount of data. The numbers — the addresses — start at zero and count upwards, and every box has one.",
        "When you write `x = 5`, what happens is that a box is chosen, the value 5 is put in it, and the name `x` is recorded as meaning \"that box\". When you later write `x + 1`, the machine looks up which box `x` means, reads the value out, and adds one to it.",
        "That is the entire mental model you need for now, and almost the entire model you need for this whole track. Two consequences follow from it that will matter constantly later, so it is worth stating them now even though they will not fully land until you meet them:",
        "**Boxes are finite in size.** A box designated to hold a whole number holds a fixed number of digits' worth. Exceed it and the value does not grow — it wraps around, silently, to a wrong answer. This is the single most common source of mysterious wrong answers in competitive programming.",
        "**A name is not the same as the value.** Two names can refer to the same box. Change the contents through one name and the other name sees the change, because there was only ever one box. This is the source of an entire family of bugs that survive every language you will ever use, and there is a whole lesson on it later.",
        "Everything else — arrays, strings, objects, the data structures this track is named after — is built on top of numbered boxes. When something confuses you later, dropping back to \"what is actually in memory, and which name points at it?\" resolves it more often than any other question.",
      ],
      examples: [
        {
          id: "boxes",
          title: "Names, boxes, values",
          lang: "python",
          code: `a = 5
b = a
a = 7

print("a =", a)
print("b =", b)`,
          output: `a = 7
b = 5`,
          explanation:
            "`b = a` copied the *value* 5 into a second box; it did not make `b` another name for `a`'s box. So changing `a` afterwards leaves `b` alone. That is the behaviour you would expect — and it is worth seeing it confirmed now, because the lesson on references shows you the case where exactly this reasoning gives the wrong answer, and knowing precisely which assumption breaks is what makes that lesson land.",
        },
      ],
    },
    {
      id: "what-to-hold-onto",
      heading: "What to hold on to",
      body: [
        "You do not need to understand processors, and you certainly do not need to understand bytecode. What you need is a model that makes the rest of this module make sense, and it is this:",
        "You write text. A program turns that text into instructions. The instructions move numbers between numbered boxes, do arithmetic on them, compare them, and jump around based on the comparisons. Java checks the whole text before running any of it; Python checks each piece as it arrives.",
        "That is enough to start. In the next lesson you will write and run a program in both languages, and everything above will stop being description and become something you have watched happen.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a compiler and an interpreter?",
      answer:
        "A compiler translates the whole source file into machine-executable form before anything runs, so errors in the source stop the program before its first line executes. An interpreter works through the source while running, translating and executing as it goes, so earlier lines run normally and an error later in the file surfaces only when execution reaches it. Java is compiled — to bytecode, which the JVM then executes — and Python is interpreted. The practical consequence is when your mistakes reach you: at build time in one case, at run time in the other.",
    },
    {
      question: "Why is Java described as platform-independent?",
      answer:
        "Because `javac` does not compile to instructions for your specific processor and operating system. It compiles to bytecode, an instruction set for an imaginary machine, and a JVM built for each real platform executes that bytecode. The platform differences are absorbed by the JVM rather than by your program, so the same compiled `.class` file runs anywhere a JVM exists. The slogan is \"write once, run anywhere\", and the JVM is the reason it is true.",
    },
    {
      question: "What is bytecode?",
      answer:
        "The intermediate form Java compiles to: a compact instruction set for the Java Virtual Machine rather than for any physical processor. It is not source code — it is not meant to be read — and it is not native machine code either. The JVM executes it, and typically compiles the parts that run most often into real machine instructions while the program is running, which is why long-running Java gets faster after it has warmed up.",
    },
  ],
  takeaways: [
    "A machine can only move numbers, do arithmetic, compare, and jump based on comparisons; everything else is built from those",
    "Source code is text for humans; a compiler or interpreter turns it into something the machine can execute",
    "A compiler reads the whole file first, so mistakes stop the program before line 1 runs",
    "An interpreter translates as it goes, so earlier lines run and mistakes surface only when reached",
    "Java compiles to bytecode which the JVM executes, which is why the same file runs on any platform",
    "Compiling successfully means your program is meaningful, not that it is correct",
    "Memory is numbered boxes; a name records which box, and a name is not the same thing as the value in it",
  ],
};
