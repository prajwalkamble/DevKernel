import type { Lesson } from "@/content/types";

export const yourFirstProgramLesson: Lesson = {
  id: "dsa-intro-your-first-program",
  slug: "your-first-program",
  moduleSlug: "introduction-to-programming",
  title: "Your First Program",
  summary:
    "Get a working setup, run the same program in Java and Python, and understand every single character of it — including the six words of Java ceremony nobody usually explains.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Install and verify a working Java and Python setup, and know how to check each one",
    "Run a program from the command line in both languages",
    "Explain what every word in Java's `public static void main(String[] args)` is doing",
    "Recognise the three mistakes that stop a first program from running",
  ],
  sections: [
    {
      id: "setup",
      heading: "Getting a setup that works",
      body: [
        "You need two things installed, and you should install both even though you will eventually solve problems in only one. Reading the other language is a skill worth having, and this track shows every algorithm in both.",
        "**Python.** Most Linux distributions and macOS ship with it. On Windows, install it from python.org and tick \"Add Python to PATH\" during installation — that box is the difference between the next command working and not.",
        "**Java.** Install a JDK — a *Development* Kit, not a JRE, because the JRE only runs programs and cannot compile them. Any build of version 17 or later is fine; Temurin from Adoptium is a reasonable default if you have no reason to prefer another.",
        "Then verify both. This is not busywork: an installation that seems to have worked but is not on your PATH is the single most common reason a first program does not run, and it produces an error that looks nothing like the real problem.",
      ],
      examples: [
        {
          id: "verify",
          title: "Verifying the installation",
          lang: "bash",
          code: `$ python3 --version
Python 3.13.5

$ java --version
openjdk 25.0.3 2026-01-20
OpenJDK Runtime Environment (build 25.0.3+9)
OpenJDK 64-Bit Server VM (build 25.0.3+9, mixed mode, sharing)

$ javac --version
javac 25.0.3`,
          explanation:
            "Your version numbers will differ and that is fine — anything from Python 3.10 and Java 17 upwards works for everything in this track. What matters is that all three commands answer at all. `command not found` means the program is either not installed or not on your PATH, and on Windows the second is far more likely than the first.",
        },
      ],
      pitfalls: [
        {
          title: "`python` against `python3`",
          body: "On many systems `python` either does not exist or points at an ancient version 2, which is a different language in ways that will confuse you badly. Use `python3` explicitly. On Windows it is usually `python`, and `py` also works.",
        },
        {
          title: "Installing a JRE instead of a JDK",
          body: "If `java --version` works but `javac --version` says command not found, you have a runtime but no compiler. Install a full JDK. This catches a lot of people because downloads pages often push the JRE first.",
        },
      ],
    },
    {
      id: "python-first",
      heading: "The smallest program that does something",
      body: [
        "Create a file called `main.py` with a single line in it, and run it with `python3 main.py`.",
        "That is genuinely the whole program. There is no surrounding structure, no declaration of where execution begins — the file *is* the program, and it runs from the top.",
      ],
      examples: [
        {
          id: "hello",
          title: "The whole program, in whichever language you picked",
          lang: "python",
          code: `print("Hello, world!")`,
          output: `Hello, world!`,
          explanation:
            "One line of output, six ways of asking for it. What differs is not the idea but how much ceremony each language wants before it will let you say anything: Python and JavaScript need one line, Go and Rust need a function for the program to start in, C++ needs that plus an instruction to bring the printing machinery into scope, and Java needs a class to put the function inside. None of that ceremony is doing work — every one of these programs prints the same eleven characters — and it is worth seeing that plainly now, because it is the last time in this track that the differences between the languages will be this large a fraction of the program.",
          alternates: [
            {
              lang: "javascript",
              code: `console.log("Hello, world!");`,
            },
            {
              lang: "java",
              code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
}`,
            },
            {
              lang: "rust",
              code: `fn main() {
    println!("Hello, world!");
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}`,
            },
          ],
        },
        {
          id: "python-several",
          title: "Several statements run top to bottom",
          lang: "python",
          code: `print("first")
print("second")
print(2 + 3)
print("2 + 3")`,
          output: `first
second
5
2 + 3`,
          explanation:
            "The third and fourth lines are the point. `2 + 3` without quotes is arithmetic and prints 5; with quotes it is text and prints the characters. That distinction — between a value and the text that looks like it — is one you will meet again constantly, and it is worth fixing now while it is this visible.",
        },
      ],
    },
    {
      id: "java-next",
      heading: "What the ceremony around it is for",
      body: [
        "Create `Main.java`. The filename matters here in a way it did not for Python: a public class must live in a file with exactly its own name, so `public class Main` requires `Main.java`, capital M included.",
        "Run it with `java Main.java`. On Java 11 and later that single command compiles and runs in one step, which is ideal while you are learning. (The traditional two-step form — `javac Main.java` to produce `Main.class`, then `java Main` to run it — still works and is what you will use for anything larger.)",
      ],
      examples: [
        {
          id: "java-hello",
          title: "Main.java",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
          output: `Hello, world!`,
          explanation:
            "Six lines to Python's one, and every extra word is doing something. The next section takes them one at a time — this is the one place in the track where it is worth reading a line of ceremony word by word, because after this you will type it from muscle memory and never think about it again.",
        },
      ],
    },
    {
      id: "the-incantation",
      heading: "Every word of Java's version, explained",
      body: [
        "`public static void main(String[] args)` is usually presented as a magic phrase to copy. It is not magic, and knowing what it says removes a small permanent source of unease.",
        "**`public`** — visible from outside this class. The JVM has to be able to find and call this method from outside your code, so it cannot be private.",
        "**`static`** — belongs to the class itself rather than to an instance of it. This one matters: to call a non-static method you first need an object to call it *on*, and when your program starts there are no objects yet. `static` is what makes it callable without one.",
        "**`void`** — returns nothing. Some languages have the program return a number; Java does not use the return value here.",
        "**`main`** — the name the JVM looks for. It is a convention, not a keyword, but it is not negotiable: name it something else and the JVM will not find it.",
        "**`String[] args`** — an array of text values, holding whatever arguments were typed after the program name on the command line. You will almost never use it, but it must be in the signature, because this exact shape is what the JVM searches for.",
        "**`class Main`** — Java requires every piece of code to live inside a class. For now, treat the class as the container your program lives in. What a class is really for is a Module 2 topic, and trying to understand it now would cost more than it gives.",
        "**`System.out.println`** — the `println` method of the `out` object belonging to the `System` class. It prints its argument and moves to a new line. There is a `print` without the `ln` that stays on the same line, which you will want later for building up a line piece by piece.",
      ],
      examples: [
        {
          id: "java-print-vs-println",
          title: "print against println",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.print("a");
        System.out.print("b");
        System.out.print("c");
        System.out.println();
        System.out.println("on its own line");
    }
}`,
          output: `abc
on its own line`,
          explanation:
            "`print` leaves the cursor where it is; `println` moves to the next line after writing. `System.out.println()` with nothing in it just ends the current line, which is how you finish a line you built with several `print` calls. This exact pattern is how you will print a row of a pattern in the pattern-printing module.",
        },
      ],
      pitfalls: [
        {
          title: "The filename not matching the public class",
          body: "`public class Main` in a file called `main.java` or `Hello.java` is an error, and the message — \"class Main is public, should be declared in a file named Main.java\" — is one of the clearest Java produces. Match the name exactly, capital included.",
        },
        {
          title: "Forgetting the semicolon",
          body: "Java ends every statement with `;`. Python ends them with a newline. The compiler's complaint is `';' expected` and it points at the end of the offending line — although if you forget one inside a block, the error sometimes surfaces on the *following* line, which is worth knowing before it confuses you.",
        },
      ],
    },
    {
      id: "when-it-does-not-run",
      heading: "When it does not run",
      body: [
        "Three failures account for nearly every first-program problem. All three are worth causing on purpose once, right now, so that you recognise them instantly later rather than at 1am.",
        "**Command not found.** The language is not installed, or not on your PATH. Nothing to do with your code — the file was never even read.",
        "**A syntax error.** Your text is not valid in the language: a missing bracket, a missing semicolon, a misspelled keyword. The message names a line number; start there and look at the line *above* it too, since an unclosed bracket is reported where the confusion becomes undeniable rather than where it started.",
        "**Wrong directory.** `python3 main.py` from a folder that does not contain `main.py` gives \"No such file or directory\". Use `ls` (or `dir` on Windows) to check where you actually are. This one is embarrassingly common and takes people much longer than it should.",
      ],
      examples: [
        {
          id: "syntax-error-python",
          title: "A syntax error, on purpose",
          lang: "python",
          code: `print("this line is fine")
print("this one is missing a bracket"
print("and this one never gets a chance")`,
          output: `  File "main.py", line 2
    print("this one is missing a bracket"
         ^
SyntaxError: '(' was never closed`,
          explanation:
            "Notice that the first line did *not* print, even though it was perfectly valid and Python is an interpreted language. A syntax error is different from the runtime error you saw in the last lesson: Python must parse the whole file before it can run any of it, so broken *grammar* stops everything, while a broken *name* only stops things when reached. Notice too that the error points at line 2 rather than line 3 — it names where the unclosed bracket opened.",
        },
      ],
    },
    {
      id: "which-to-use",
      heading: "Which one should you actually pick?",
      body: [
        "For now: run both, for a week or two, while the programs are small. It costs almost nothing and it makes the next module — where you choose one properly — a decision based on experience rather than on what someone told you.",
        "The short version of that decision, so it is not hanging over you: **Python** is less to type, has the more forgiving standard library, and gets you to a working answer faster, which is why most people should practise in it. **Java** is more verbose and makes the structures visible, which some people find clarifying, and it is what a large share of interview loops at big companies are conducted in. Neither is wrong. Choosing one and stopping the deliberation is what matters, and that is what the next module is for.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does Java's `main` method have to be `static`?",
      answer:
        "Because the JVM has to call it before any objects exist. A non-static method belongs to an instance and can only be called on one, so invoking it would require the JVM to construct an object of your class first — which raises the question of which constructor to use and with what arguments. Making `main` static sidesteps all of that: it belongs to the class itself, so the JVM can call it as soon as the class is loaded.",
    },
    {
      question: "What does `String[] args` do?",
      answer:
        "It holds the command-line arguments passed after the program name, as an array of strings. Running `java Main hello 42` gives an array of two elements, `\"hello\"` and `\"42\"` — note the second is text, not a number, until you parse it. It must be present in the signature even when unused, because the JVM looks for a method with exactly that shape.",
    },
    {
      question: "What is the difference between the JDK, the JRE and the JVM?",
      answer:
        "The JVM is the thing that executes bytecode. The JRE is the JVM plus the standard class library — enough to run a Java program but not to build one. The JDK is the JRE plus the development tools, most importantly `javac`, the compiler. You need a JDK to write Java; a JRE is only enough to run someone else's.",
    },
  ],
  takeaways: [
    "Verify your setup with `python3 --version`, `java --version` and `javac --version` before writing anything",
    "A JRE runs Java; only a JDK can compile it",
    "A Python file is the program and runs from the top; Java needs a class and a `main` method",
    "`public static void main(String[] args)` is not magic: visible to the JVM, callable without an object, returns nothing, named what the JVM looks for, takes command-line arguments",
    "A public Java class must live in a file with exactly its own name",
    "`print` stays on the line, `println` ends it — you will need both",
    "A syntax error stops even an interpreted language before line 1, because the file must parse before any of it can run",
  ],
};
