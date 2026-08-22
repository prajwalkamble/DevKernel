import type { Lesson } from "@/content/types";

export const statementsAndExpressionsLesson: Lesson = {
  id: "dsa-intro-statements-and-expressions",
  slug: "statements-and-expressions",
  moduleSlug: "introduction-to-programming",
  title: "Statements, Expressions & the Order Things Happen",
  summary:
    "The difference between something that has a value and something that does something — and the evaluation order that decides what your code actually means.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Tell an expression from a statement, and say why the distinction matters",
    "Evaluate a mixed arithmetic expression by hand and get the same answer the machine does",
    "Explain what happens when `+` is given a number and a piece of text",
    "Predict the output of code that mixes assignment with evaluation",
  ],
  sections: [
    {
      id: "two-kinds-of-thing",
      heading: "Two kinds of thing",
      body: [
        "Almost everything you write is one of two things, and separating them early makes a lot of later syntax stop being arbitrary.",
        "An **expression** is anything that has a value. `5` is an expression. So are `2 + 3`, `count`, `count * 2 + 1`, and `x > 10`. You can always ask \"what is this worth?\" and get an answer — the last one is worth `true` or `false`.",
        "A **statement** is an instruction that does something. `int x = 5;` is a statement. So is `System.out.println(...)`, and so is an `if` or a loop. You cannot ask what a statement is worth; asking is a category error.",
        "The relationship is that statements *contain* expressions. `int total = price * quantity;` is one statement containing the expression `price * quantity`, whose value gets stored. Wherever a value is needed, any expression producing the right kind of value will do — which is why you can write `println(a + b)` as readily as `println(x)`, and why conditions in `if` statements can be as complicated as you like.",
      ],
      examples: [
        {
          id: "expressions-everywhere",
          title: "An expression fits anywhere a value fits",
          lang: "python",
          code: `price = 12
quantity = 3

print(price)
print(price * quantity)
print(price * quantity > 30)
print(max(price, quantity) + 1)

total = price * quantity + 10
print(total)`,
          output: `12
36
True
13
46`,
          explanation:
            "Every argument to `print` here is an expression: a name, an arithmetic expression, a comparison, a function call combined with arithmetic. The machine reduces each to a single value before `print` ever sees it. Note the third one produces `True` — a comparison is an expression like any other, and its value is a boolean.",
        },
      ],
    },
    {
      id: "evaluation-order",
      heading: "The order things are worked out",
      body: [
        "When an expression has several operators, they do not run left to right. They run in an order set by **precedence**, and both languages use the order you learned in school arithmetic.",
        "Multiplication, division and remainder bind more tightly than addition and subtraction. Comparisons are looser than all arithmetic. Logical `and` and `or` are looser still. So `a + b * c > d` means `(a + (b * c)) > d`, and that is the same in Java and Python.",
        "You do not need to memorise a full precedence table. You need two habits: know that `*` beats `+`, and use brackets everywhere else. Brackets cost nothing, never confuse a reader, and eliminate an entire class of bug that is very hard to see when reading.",
      ],
      examples: [
        {
          id: "precedence",
          title: "Precedence, and what brackets change",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(2 + 3 * 4);
        System.out.println((2 + 3) * 4);

        System.out.println(10 - 4 - 3);
        System.out.println(10 - (4 - 3));

        int a = 5, b = 2, c = 20;
        System.out.println(a + b * 3 > c);
        System.out.println((a + b) * 3 > c);
    }
}`,
          output: `14
20
3
9
false
true`,
          explanation:
            "Two things here. `2 + 3 * 4` is 14 because multiplication happens first — the school rule. And `10 - 4 - 3` is 3 because subtraction groups *left to right*: it means `(10 - 4) - 3`. Line four proves it by forcing the other grouping and getting 9 instead. That property is called associativity, and it is separate from precedence: precedence decides which operator wins, associativity decides what happens when they tie.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming a long expression is read left to right",
          body: "It is not, and the failure is silent — you get a number, just the wrong one. Whenever an expression mixes more than two operators, either bracket it or split it across two lines with an intermediate variable. The second option is usually the better one, because the intermediate gets a name and the name explains what it is.",
        },
      ],
    },
    {
      id: "plus-is-two-operators",
      heading: "`+` is doing two different jobs",
      body: [
        "One operator deserves its own section, because it is the source of the most common surprise a beginner hits when printing things.",
        "`+` between two numbers adds them. `+` between two pieces of text joins them end to end — *concatenation*. Which one you get depends on what the operands are, and when you mix a number and a piece of text, the two languages behave completely differently.",
        "Java converts the number to text and concatenates. Python refuses and raises an error.",
      ],
      examples: [
        {
          id: "plus-two-jobs",
          title: "Adding a number to a piece of text, seven ways",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println(1 + 2);
        System.out.println("1" + "2");
        System.out.println("total: " + 3);

        System.out.println("sum: " + 1 + 2);
        System.out.println("sum: " + (1 + 2));
    }
}`,
          output: `3
12
total: 3
sum: 12
sum: 3`,
          explanation:
            "`\"total: \" + 3` is the whole example, and the seven answers are worth seeing in a row. Java and JavaScript convert the number to text and concatenate. Python refuses with a TypeError, which is the friendliest failure here because it names the line. Rust and Go refuse at compile time, so the program never exists. And C++ does something else entirely: `\"total: \"` is not a string object but a pointer to characters, so adding 3 moves the pointer three characters along and prints `al: ` — no error, no warning, a completely different answer. That is the single best argument in this module for reading a language's rules rather than assuming they match the last one you used. JavaScript earns its own footnote: `\"3\" - 1` is 2, because `-` has no string meaning to fall back on, so the string is coerced instead. One operator, two jobs, and a coin flip about which one you get.",
          alternates: [
            {
              lang: "javascript",
              code: `console.log(1 + 2);
console.log("1" + "2");
console.log("total: " + 3);

console.log("sum: " + 1 + 2);
console.log("sum: " + (1 + 2));
console.log("3" - 1);`,
              output: `3
12
total: 3
sum: 12
sum: 3
2`,
            },
            {
              lang: "typescript",
              code: `console.log(1 + 2);
console.log("1" + "2");
console.log("total: " + 3);

console.log("sum: " + 1 + 2);
console.log("sum: " + (1 + 2));
console.log("3" - 1);`,
              output: `3
12
total: 3
sum: 12
sum: 3
2`,
            },
            {
              lang: "python",
              code: `print(1 + 2)
print("1" + "2")
print("total: " + 3)`,
              output: `3
12
Traceback (most recent call last):
  File "main.py", line 3, in <module>
    print("total: " + 3)
          ~~~~~~~~~~^~~
TypeError: can only concatenate str (not "int") to str`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <string>

int main() {
    std::cout << 1 + 2 << "\\n";
    std::cout << std::string("1") + "2" << "\\n";
    // "total: " is not a string object — it is a pointer to characters, and
    // adding 3 to a pointer moves it three characters along.
    std::cout << "total: " + 3 << "\\n";
    std::cout << std::string("total: ") + std::to_string(3) << "\\n";
}`,
              output: `3
12
al: 
total: 3`,
            },
            {
              lang: "rust",
              code: `fn main() {
    println!("{}", 1 + 2);
    println!("{}", String::from("1") + "2");
    println!("{}", "total: ".to_string() + 3);
}`,
              output: `error[E0308]: mismatched types
 --> main.rs:4:44
  |
4 |     println!("{}", "total: ".to_string() + 3);
  |                                            ^ expected \`&str\`, found integer

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0308\`.`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

func main() {
	fmt.Println(1 + 2)
	fmt.Println("1" + "2")
	fmt.Println("total: " + 3)
}`,
              output: `# command-line-arguments
./main.go:8:14: invalid operation: "total: " + 3 (mismatched types untyped string and untyped int)`,
            },
          ],
        },
      ],
    },
    {
      id: "assignment-is-not-comparison",
      heading: "Assignment is not comparison",
      body: [
        "`=` assigns. `==` compares. They are entirely different operations that happen to look alike, and confusing them is a rite of passage.",
        "Java protects you from most of the damage: an `if` requires a boolean, and an assignment of a number does not produce one, so `if (x = 5)` is a compile error. Python is less protective in general but happens to make this exact mistake a syntax error too, because assignment is a statement there and cannot appear inside a condition.",
        "So both languages catch the classic version. The one to actually watch for is the reverse: writing `==` where you meant `=`, which is legal in both and simply does nothing.",
      ],
      examples: [
        {
          id: "assign-vs-compare",
          title: "The mistake that compiles",
          lang: "python",
          code: `count = 10
count == 20          # a comparison whose result is thrown away
print(count)

count = 20           # this is what was meant
print(count)`,
          output: `10
20`,
          explanation:
            "Line 2 is a legal expression statement. It computes `False` and discards it, changing nothing, producing no error and no warning. Reading the code quickly, it looks like an assignment. This is the argument for tools — linters flag \"this expression has no effect\" — and for reading your own code once before running it.",
        },
      ],
      pitfalls: [
        {
          title: "Reading `=` as \"equals\" when speaking through code",
          body: "Say \"becomes\" or \"gets\" instead: `count = count + 1` reads as \"count becomes count plus one\", which is exactly right and never confusing. Reserve \"equals\" for `==`. This sounds trivial and it measurably reduces the number of times you write the wrong one.",
        },
      ],
    },
    {
      id: "compound-assignment",
      heading: "Shorthands you will read constantly",
      body: [
        "A few forms come up so often that both languages have shorthands. They are not faster to execute — they are shorter to read, which is the actual benefit.",
        "`x += 1` means `x = x + 1`. The same works for `-=`, `*=`, `/=` and `%=`.",
        "Java additionally has `x++` and `x--` for adding or subtracting one. Python deliberately does not, which is why `i += 1` is the idiom there.",
        "`x++` has a subtlety worth knowing about once and then designing around: as an expression it has a value, and *when* the increment happens differs between `x++` and `++x`.",
      ],
      examples: [
        {
          id: "increment",
          title: "Post-increment against pre-increment",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        System.out.println(a++);
        System.out.println(a);

        int b = 5;
        System.out.println(++b);
        System.out.println(b);
    }
}`,
          output: `5
6
6
6`,
          explanation:
            "`a++` yields the old value and *then* increments, so it prints 5 while leaving `a` at 6. `++b` increments first and yields the new value, printing 6. Both end at 6. The practical advice: use `x++` on a line by itself, where the distinction cannot matter, and never inside a larger expression. Code that depends on this is code that gets misread.",
        },
      ],
    },
    {
      id: "one-thing-at-a-time",
      heading: "The habit worth forming now",
      body: [
        "You will read code that packs four operations into one line, and you may be tempted to write it. Resist for now, and mostly resist later.",
        "There is no performance argument. A compiler produces identical instructions for one dense line and three clear ones, so the only thing density buys is fewer lines on screen — and the only thing it costs is that you cannot see which part is wrong when something is.",
        "Splitting an expression gives each intermediate a name, and the name is documentation that cannot go stale. `int mid = lo + (hi - lo) / 2;` is one line; if it ever misbehaves, having `mid` as a separate named value means you can print it. That is the whole argument, and it is enough.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between an expression and a statement?",
      answer:
        "An expression has a value — `2 + 3`, `x`, `x > 10` — and can appear anywhere a value is expected. A statement performs an action and has no value: a declaration, an assignment, an `if`, a loop. Statements contain expressions. The distinction matters because it tells you where a piece of code is allowed to go: anything that produces a value can be passed as an argument or used as a condition, and anything that does not, cannot.",
    },
    {
      question: "In Java, what does `System.out.println(\"sum: \" + 1 + 2)` print, and why?",
      answer:
        "`sum: 12`. `+` is left-associative, so `\"sum: \" + 1` is evaluated first; because one operand is a String, that concatenates to `\"sum: 1\"`, and then `+ 2` concatenates again. To add first you need brackets: `\"sum: \" + (1 + 2)` gives `sum: 3`. This is the standard explanation for a printed number that appears to have extra digits stuck on the end.",
    },
    {
      question: "What is the difference between `i++` and `++i`?",
      answer:
        "Both increment `i` by one; they differ in the value the expression yields. `i++` evaluates to the value before the increment, `++i` to the value after. As a standalone statement they are interchangeable and the difference is invisible. Inside a larger expression the difference is real, and the right response is to avoid writing that expression rather than to memorise which is which.",
    },
  ],
  takeaways: [
    "An expression has a value; a statement does something. Statements contain expressions",
    "Precedence, not left-to-right order, decides what a mixed expression means — `*` binds tighter than `+`",
    "Same-precedence operators group left to right, which is why `10 - 4 - 3` is 3",
    "In Java `+` concatenates when either side is text, and `\"sum: \" + 1 + 2` gives `sum: 12`",
    "Python refuses to mix text and numbers with `+`; use several arguments to `print`, or an f-string",
    "`=` is \"becomes\", `==` is \"equals\" — and `count == 20` on its own line is legal and does nothing",
    "Use `x++` only as a whole statement, never inside a bigger expression",
    "Splitting a dense expression costs nothing at run time and gives each intermediate a name you can print",
  ],
};
