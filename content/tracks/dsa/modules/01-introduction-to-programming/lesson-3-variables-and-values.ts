import type { Lesson } from "@/content/types";

export const variablesAndValuesLesson: Lesson = {
  id: "dsa-intro-variables-and-values",
  slug: "variables-and-values",
  moduleSlug: "introduction-to-programming",
  title: "Variables, Values & What They Cost",
  summary:
    "What a variable really is, why Java makes you declare a type and Python does not, and the first place a fixed-size box will silently give you a wrong answer.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Explain what happens in memory when you assign a value to a name",
    "Declare variables in both languages and say what the type annotation is for",
    "Predict the result of integer division and integer overflow before running the code",
    "Recognise the two arithmetic traps that produce wrong answers with no error message",
  ],
  sections: [
    {
      id: "what-a-variable-is",
      heading: "A name for a box",
      body: [
        "In the first lesson memory was described as a long row of numbered boxes. A variable is a *name* you have attached to one of those boxes so you never have to think about its number.",
        "That is worth being precise about, because the word \"variable\" suggests the thing that varies is the name, and it is not. The name stays put. What changes is the value in the box it points at.",
        "Two operations exist and it is worth separating them in your head from the start. **Declaring** is bringing a variable into existence. **Assigning** is putting a value into it. Python does both at once and never mentions it. Java lets you do them separately, and that difference is the reason the two languages feel so unalike.",
      ],
      examples: [
        {
          id: "declare-assign",
          title: "Declaring and assigning",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int count;              // declared: a box exists, nothing in it yet
        count = 5;              // assigned: the value 5 goes in
        int total = 10;         // both at once, which is what you normally write

        count = count + 1;      // read the box, add one, put it back
        System.out.println(count);
        System.out.println(total);
    }
}`,
          output: `6
10`,
          explanation:
            "`count = count + 1` reads oddly as mathematics and is the line worth pausing on. It is not an equation claiming `count` equals `count` plus one — nothing would satisfy that. `=` means *put the value on the right into the box on the left*, so this reads the current value, adds one, and stores the result back. Once you read `=` as \"becomes\" rather than \"equals\", it stops looking strange.",
        },
      ],
    },
    {
      id: "types",
      heading: "Why some languages ask you for a type",
      body: [
        "The word `int` in `int count` is a **type**: a promise about what kind of value this box will hold. Java requires one for every variable. Python requires none.",
        "The reason for the difference is not arbitrary. A box has to be a particular size, and the type is how Java knows what size to make it — a whole number and a piece of text need very different amounts of room. Java decides this before the program runs; Python works it out as it goes, which is why a Python variable can hold a number on one line and text on the next.",
        "That flexibility costs something, and it is worth seeing what.",
      ],
      examples: [
        {
          id: "python-dynamic",
          title: "Python: the name does not care what it holds",
          lang: "python",
          code: `value = 42
print(value, type(value))

value = "now I am text"
print(value, type(value))

value = [1, 2, 3]
print(value, type(value))`,
          output: `42 <class 'int'>
now I am text <class 'str'>
[1, 2, 3] <class 'list'>`,
          explanation:
            "One name, three completely different kinds of value, no complaint. This is convenient and occasionally disastrous: if a function is supposed to return a number and returns text under some condition, nothing notices until something tries to do arithmetic on it — possibly a long way from the mistake.",
        },
        {
          id: "java-static",
          title: "Java: the type is a promise the compiler enforces",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int value = 42;
        value = "now I am text";
        System.out.println(value);
    }
}`,
          output: `Main.java:4: error: incompatible types: String cannot be converted to int
        value = "now I am text";
                ^
1 error
error: compilation failed`,
          explanation:
            "Refused, before the program ran. In exchange for having to write `int`, you get a guarantee that this box holds a whole number for its entire life — so every later line that does arithmetic on it is safe by construction. That is the trade in one screen: Python trusts you and finds out late, Java checks you and finds out early.",
        },
      ],
      pitfalls: [
        {
          title: "Thinking Python has no types",
          body: "It does — `type(value)` above proves it. The difference is *when* the type is attached: in Python it belongs to the value and travels with it, in Java it belongs to the variable and is fixed at compile time. The jargon is dynamic against static typing, and \"Python is untyped\" is simply wrong.",
        },
      ],
    },
    {
      id: "the-types-you-need",
      heading: "The types you actually need",
      body: [
        "Java has a lot of types. For this entire track you need five, and you will use two of them ninety per cent of the time.",
        "**`int`** — a whole number. This is your default for everything countable: indices, counts, sums, array values.",
        "**`long`** — a bigger whole number, for when `int` is not enough. The next section is about exactly when that is.",
        "**`double`** — a number with a fractional part. Avoid it whenever you can; comparing them for equality is unreliable, for reasons covered in the data-types module.",
        "**`boolean`** — `true` or `false`. What every condition evaluates to.",
        "**`char`** — a single character, written in single quotes: `'a'`. Note that `\"a\"` with double quotes is a `String`, which is a different type entirely, and mixing them up is a common early error.",
        "Python's equivalents are `int`, `float`, `bool` and `str`, and it has no separate character type — a single character is just a string of length one. Python's `int` has no size limit at all, which removes a whole category of bug and is genuinely one of the strongest arguments for practising in it.",
      ],
    },
    {
      id: "integer-division",
      heading: "The first trap: integer division",
      body: [
        "Here is a result that surprises nearly everyone once, and it is better for it to be now than during a contest.",
        "When you divide one whole number by another in Java, the answer is a whole number. The fractional part is not rounded — it is discarded. `7 / 2` is 3, not 3.5 and not 4.",
        "Python splits this into two operators to keep it explicit: `/` always produces a fractional result, and `//` does the whole-number division. That is a genuinely better design, and it means the trap in Python is the opposite one — getting a `float` where you wanted an `int`.",
      ],
      examples: [
        {
          id: "integer-division",
          title: "The same four divisions, seven languages",
          lang: "python",
          code: `print("what / gives for 7 and 2  :", 7 / 2)
print("integer division, 7 by 2  :", 7 // 2)
print("integer division, 1 by 2  :", 1 // 2)
print("integer division, -7 by 2 :", -7 // 2)
print()
print("Python has two operators. \`/\` always produces a float, even for 7 / 2,")
print("and \`//\` is the integer one. Note -7 // 2 is -4 and not -3: Python floors,")
print("rounding toward negative infinity. Every other language here truncates")
print("toward zero, so this one line is a real source of off-by-one bugs.")`,
          output: `what / gives for 7 and 2  : 3.5
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -4

Python has two operators. \`/\` always produces a float, even for 7 / 2,
and \`//\` is the integer one. Note -7 // 2 is -4 and not -3: Python floors,
rounding toward negative infinity. Every other language here truncates
toward zero, so this one line is a real source of off-by-one bugs.`,
          explanation:
            "Switch the language and watch the last number. Every one of these is integer division of −7 by 2, and Python answers −4 where the other six answer −3. Python *floors* — it rounds toward negative infinity — and everything else *truncates* toward zero. On positive numbers the two agree, which is why this survives testing and then fails on the one input with a negative in it. The second thing to notice is that the languages disagree about what `/` even means: in Python, JavaScript and TypeScript it always produces a decimal and integer division needs a second operator, while in Java, C++, Rust and Go the same symbol quietly changes behaviour depending on the types either side of it. Dividing two integer variables and expecting a decimal is the single most common arithmetic bug in this track.",
          alternates: [
            {
              lang: "javascript",
              code: `console.log("what / gives for 7 and 2  :", 7 / 2);
console.log("integer division, 7 by 2  :", Math.trunc(7 / 2));
console.log("integer division, 1 by 2  :", Math.trunc(1 / 2));
console.log("integer division, -7 by 2 :", Math.trunc(-7 / 2));
console.log();
console.log("JavaScript has one number type and it is a float, so \`/\` never divides");
console.log("as an integer and there is no operator that does. Math.trunc is the");
console.log("usual stand-in, and it cuts toward zero — so -7 becomes -3, not -4.");
console.log("Math.floor would give -4, which is why the choice has to be deliberate.");`,
              output: `what / gives for 7 and 2  : 3.5
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

JavaScript has one number type and it is a float, so \`/\` never divides
as an integer and there is no operator that does. Math.trunc is the
usual stand-in, and it cuts toward zero — so -7 becomes -3, not -4.
Math.floor would give -4, which is why the choice has to be deliberate.`,
            },
            {
              lang: "typescript",
              code: `console.log("what / gives for 7 and 2  :", 7 / 2);
console.log("integer division, 7 by 2  :", Math.trunc(7 / 2));
console.log("integer division, 1 by 2  :", Math.trunc(1 / 2));
console.log("integer division, -7 by 2 :", Math.trunc(-7 / 2));
console.log();
console.log("JavaScript has one number type and it is a float, so \`/\` never divides");
console.log("as an integer and there is no operator that does. Math.trunc is the");
console.log("usual stand-in, and it cuts toward zero — so -7 becomes -3, not -4.");
console.log("Math.floor would give -4, which is why the choice has to be deliberate.");`,
              output: `what / gives for 7 and 2  : 3.5
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

JavaScript has one number type and it is a float, so \`/\` never divides
as an integer and there is no operator that does. Math.trunc is the
usual stand-in, and it cuts toward zero — so -7 becomes -3, not -4.
Math.floor would give -4, which is why the choice has to be deliberate.`,
            },
            {
              lang: "java",
              code: `public class Main {
    public static void main(String[] args) {
        System.out.println("what / gives for 7 and 2  : " + 7 / 2);
        System.out.println("integer division, 7 by 2  : " + 7 / 2);
        System.out.println("integer division, 1 by 2  : " + 1 / 2);
        System.out.println("integer division, -7 by 2 : " + -7 / 2);
        System.out.println();
        System.out.println("\`/\` on two ints IS integer division in Java — the same symbol does");
        System.out.println("both jobs and picks by the types on either side, so 7 / 2 is 3 and");
        System.out.println("7 / 2.0 is 3.5. It truncates toward zero, so -7 / 2 is -3.");
        System.out.println("Dividing two int variables and expecting a decimal is the classic bug.");
    }
}`,
              output: `what / gives for 7 and 2  : 3
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

\`/\` on two ints IS integer division in Java — the same symbol does
both jobs and picks by the types on either side, so 7 / 2 is 3 and
7 / 2.0 is 3.5. It truncates toward zero, so -7 / 2 is -3.
Dividing two int variables and expecting a decimal is the classic bug.`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>

int main() {
    std::cout << "what / gives for 7 and 2  : " << 7 / 2 << "\\n";
    std::cout << "integer division, 7 by 2  : " << 7 / 2 << "\\n";
    std::cout << "integer division, 1 by 2  : " << 1 / 2 << "\\n";
    std::cout << "integer division, -7 by 2 : " << -7 / 2 << "\\n";
    std::cout << "\\n";
    std::cout << "\`/\` on two ints IS integer division in C++, exactly as in Java, and\\n";
    std::cout << "the same symbol switches behaviour on the types around it. Since C++11\\n";
    std::cout << "the standard requires truncation toward zero, so -7 / 2 is -3.\\n";
    std::cout << "Write 7 / 2.0 when you wanted the decimal.\\n";
}`,
              output: `what / gives for 7 and 2  : 3
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

\`/\` on two ints IS integer division in C++, exactly as in Java, and
the same symbol switches behaviour on the types around it. Since C++11
the standard requires truncation toward zero, so -7 / 2 is -3.
Write 7 / 2.0 when you wanted the decimal.`,
            },
            {
              lang: "rust",
              code: `fn main() {
    println!("what / gives for 7 and 2  : {}", 7 / 2);
    println!("integer division, 7 by 2  : {}", 7 / 2);
    println!("integer division, 1 by 2  : {}", 1 / 2);
    println!("integer division, -7 by 2 : {}", -7 / 2);
    println!();
    println!("\`/\` picks its meaning from the types, and 7 and 2 are integers here,");
    println!("so this is integer division truncating toward zero: -7 / 2 is -3.");
    println!("Rust will not silently mix the two — 7 / 2.0 does not compile, because");
    println!("an integer and a float are different types and neither converts on its own.");
}`,
              output: `what / gives for 7 and 2  : 3
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

\`/\` picks its meaning from the types, and 7 and 2 are integers here,
so this is integer division truncating toward zero: -7 / 2 is -3.
Rust will not silently mix the two — 7 / 2.0 does not compile, because
an integer and a float are different types and neither converts on its own.`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

func main() {
	fmt.Println("what / gives for 7 and 2  :", 7/2)
	fmt.Println("integer division, 7 by 2  :", 7/2)
	fmt.Println("integer division, 1 by 2  :", 1/2)
	fmt.Println("integer division, -7 by 2 :", -7/2)
	fmt.Println()
	fmt.Println("\`/\` on two integers is integer division, truncating toward zero,")
	fmt.Println("so -7 / 2 is -3. Go is stricter than Java or C++ about mixing:")
	fmt.Println("an int and a float64 will not divide without an explicit conversion,")
	fmt.Println("which turns a whole family of silent-wrong-answer bugs into compile errors.")
}`,
              output: `what / gives for 7 and 2  : 3
integer division, 7 by 2  : 3
integer division, 1 by 2  : 0
integer division, -7 by 2 : -3

\`/\` on two integers is integer division, truncating toward zero,
so -7 / 2 is -3. Go is stricter than Java or C++ about mixing:
an int and a float64 will not divide without an explicit conversion,
which turns a whole family of silent-wrong-answer bugs into compile errors.`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Computing a midpoint with `(lo + hi) / 2` and expecting a fraction",
          body: "In binary search you *want* the whole-number division — it is the correct behaviour there, not a bug. The trap is the reverse: computing an average of scores or a percentage with integer division and quietly getting a truncated answer. When you want the fraction, say so.",
        },
      ],
    },
    {
      id: "overflow",
      heading: "The second trap: the box is only so big",
      body: [
        "A Java `int` occupies 32 bits, which means it can hold values from −2,147,483,648 to 2,147,483,647. That upper bound is about 2.1 billion, and it is closer than it sounds.",
        "What happens when you exceed it is the important part. The value does not become \"too big\", there is no error, and nothing warns you. It **wraps around** to the most negative value and keeps counting up from there. Your program carries on confidently with a wrong number.",
        "This is not exotic. Multiply two numbers around 100,000 — entirely ordinary sizes in a problem — and you have exceeded it.",
      ],
      examples: [
        {
          id: "overflow",
          title: "One past the top, in seven languages",
          lang: "python",
          code: `biggest = 2 ** 31 - 1
print("the largest 32-bit signed integer :", biggest)
print("add one to it                     :", biggest + 1)
print("and keep going                    :", 2 ** 200)
print()
print("Python has no fixed-width integer at all. It grows the number as far as")
print("memory allows, so nothing here overflows and nothing wraps. That is a")
print("real advantage for competitive programming and a real cost everywhere")
print("else: arithmetic on huge values is slower, and the bug the other")
print("languages would have shouted about is silently absent.")`,
          output: `the largest 32-bit signed integer : 2147483647
add one to it                     : 2147483648
and keep going                    : 1606938044258990275541962092341162602522202993782792835301376

Python has no fixed-width integer at all. It grows the number as far as
memory allows, so nothing here overflows and nothing wraps. That is a
real advantage for competitive programming and a real cost everywhere
else: arithmetic on huge values is slower, and the bug the other
languages would have shouted about is silently absent.`,
          explanation:
            "This is the widest split in the module, and every answer is a different design decision rather than a different amount of care. Java and Go wrap silently and define it, so the wrong answer is at least reproducible. C++ wraps too, but only for unsigned types — signed overflow is *undefined behaviour*, which means the compiler may assume it never happens and optimise accordingly, and that is a worse failure than a wrong number. Rust refuses to guess: a plain `+` panics in a debug build so you find it while testing, and `wrapping_add` and `checked_add` are how you say which you meant. Python has no fixed width at all and simply keeps going. JavaScript and TypeScript have neither — one float type that is exact to 2^53 and rounds silently past it. The lesson underneath all seven is the same: multiply the constraints out before you pick a type.",
          alternates: [
            {
              lang: "javascript",
              code: `const biggest = 2 ** 31 - 1;
console.log("the largest 32-bit signed integer :", biggest);
console.log("add one to it                     :", biggest + 1);
console.log("and past 2^53                     :", 2 ** 53 + 1);
console.log();
console.log("JavaScript has one number type, a 64-bit float, so 32 bits is not a");
console.log("boundary it knows about. It holds whole numbers exactly up to 2^53 and");
console.log("then starts rounding: 2^53 + 1 comes back as 2^53. Nothing wraps and");
console.log("nothing throws — the digits just quietly stop being right, which is why");
console.log("BigInt exists and why any modular arithmetic needs it.");`,
              output: `the largest 32-bit signed integer : 2147483647
add one to it                     : 2147483648
and past 2^53                     : 9007199254740992

JavaScript has one number type, a 64-bit float, so 32 bits is not a
boundary it knows about. It holds whole numbers exactly up to 2^53 and
then starts rounding: 2^53 + 1 comes back as 2^53. Nothing wraps and
nothing throws — the digits just quietly stop being right, which is why
BigInt exists and why any modular arithmetic needs it.`,
            },
            {
              lang: "typescript",
              code: `const biggest = 2 ** 31 - 1;
console.log("the largest 32-bit signed integer :", biggest);
console.log("add one to it                     :", biggest + 1);
console.log("and past 2^53                     :", 2 ** 53 + 1);
console.log();
console.log("JavaScript has one number type, a 64-bit float, so 32 bits is not a");
console.log("boundary it knows about. It holds whole numbers exactly up to 2^53 and");
console.log("then starts rounding: 2^53 + 1 comes back as 2^53. Nothing wraps and");
console.log("nothing throws — the digits just quietly stop being right, which is why");
console.log("BigInt exists and why any modular arithmetic needs it.");`,
              output: `the largest 32-bit signed integer : 2147483647
add one to it                     : 2147483648
and past 2^53                     : 9007199254740992

JavaScript has one number type, a 64-bit float, so 32 bits is not a
boundary it knows about. It holds whole numbers exactly up to 2^53 and
then starts rounding: 2^53 + 1 comes back as 2^53. Nothing wraps and
nothing throws — the digits just quietly stop being right, which is why
BigInt exists and why any modular arithmetic needs it.`,
            },
            {
              lang: "java",
              code: `public class Main {
    public static void main(String[] args) {
        int biggest = Integer.MAX_VALUE;
        System.out.println("the largest 32-bit signed integer : " + biggest);
        System.out.println("add one to it                     : " + (biggest + 1));
        System.out.println("as a long instead                 : " + ((long) biggest + 1));
        System.out.println();
        System.out.println("An int is exactly 32 bits and adding past the top wraps around to the");
        System.out.println("bottom — silently, with no error of any kind. Java defines this, so it");
        System.out.println("is at least predictable. The fix is to notice before it happens and use");
        System.out.println("a long, which is why every constraint in a problem statement is worth");
        System.out.println("multiplying out before you choose a type.");
    }
}`,
              output: `the largest 32-bit signed integer : 2147483647
add one to it                     : -2147483648
as a long instead                 : 2147483648

An int is exactly 32 bits and adding past the top wraps around to the
bottom — silently, with no error of any kind. Java defines this, so it
is at least predictable. The fix is to notice before it happens and use
a long, which is why every constraint in a problem statement is worth
multiplying out before you choose a type.`,
            },
            {
              lang: "cpp",
              code: `#include <cstdint>
#include <iostream>
#include <limits>

int main() {
    int biggest = std::numeric_limits<int>::max();
    std::cout << "the largest 32-bit signed integer : " << biggest << "\\n";
    // Signed overflow is undefined behaviour, so this is done on an unsigned
    // type, where wrapping is what the standard actually promises.
    unsigned int wrapped = static_cast<unsigned int>(biggest) + 1;
    std::cout << "add one, as unsigned              : " << wrapped << "\\n";
    std::cout << "as a 64-bit integer instead       : " << static_cast<int64_t>(biggest) + 1 << "\\n";
    std::cout << "\\n";
    std::cout << "C++ is the sharpest edge here. Overflowing a *signed* integer is not\\n";
    std::cout << "defined to wrap — it is undefined behaviour, which means the compiler is\\n";
    std::cout << "entitled to assume it never happens and optimise on that basis. Unsigned\\n";
    std::cout << "types do wrap, and that is guaranteed. Reach for int64_t before you need it.\\n";
}`,
              output: `the largest 32-bit signed integer : 2147483647
add one, as unsigned              : 2147483648
as a 64-bit integer instead       : 2147483648

C++ is the sharpest edge here. Overflowing a *signed* integer is not
defined to wrap — it is undefined behaviour, which means the compiler is
entitled to assume it never happens and optimise on that basis. Unsigned
types do wrap, and that is guaranteed. Reach for int64_t before you need it.`,
            },
            {
              lang: "rust",
              code: `fn main() {
    let biggest = i32::MAX;
    println!("the largest 32-bit signed integer : {}", biggest);
    // \`biggest + 1\` would not compile past the checker in a release build and
    // panics in a debug one, so the two outcomes are asked for explicitly.
    println!("add one, wrapping on purpose      : {}", biggest.wrapping_add(1));
    println!("add one, checked                  : {:?}", biggest.checked_add(1));
    println!("as a 64-bit integer instead       : {}", biggest as i64 + 1);
    println!();
    println!("Rust makes you say which one you meant. A plain \`biggest + 1\` panics in a");
    println!("debug build and wraps in a release one, which is deliberate: the panic finds");
    println!("the bug while you are testing. \`wrapping_add\` and \`checked_add\` are the two");
    println!("ways to opt in, and \`checked_add\` returning None is the one to reach for");
    println!("when overflow is a case rather than a mistake.");
}`,
              output: `the largest 32-bit signed integer : 2147483647
add one, wrapping on purpose      : -2147483648
add one, checked                  : None
as a 64-bit integer instead       : 2147483648

Rust makes you say which one you meant. A plain \`biggest + 1\` panics in a
debug build and wraps in a release one, which is deliberate: the panic finds
the bug while you are testing. \`wrapping_add\` and \`checked_add\` are the two
ways to opt in, and \`checked_add\` returning None is the one to reach for
when overflow is a case rather than a mistake.`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math"
)

func main() {
	var biggest int32 = math.MaxInt32
	fmt.Println("the largest 32-bit signed integer :", biggest)
	fmt.Println("add one to it                     :", biggest+1)
	fmt.Println("as a 64-bit integer instead       :", int64(biggest)+1)
	fmt.Println()
	fmt.Println("Go wraps, like Java, and defines it. The difference is that Go's plain")
	fmt.Println("\`int\` is 64 bits on every machine you will run this on, so you have to ask")
	fmt.Println("for int32 to see the problem at all. That makes overflow rarer here than in")
	fmt.Println("Java or C++ — and rarer is not never, which is why the constraint in the")
	fmt.Println("problem statement is still the thing to read first.")
}`,
              output: `the largest 32-bit signed integer : 2147483647
add one to it                     : -2147483648
as a 64-bit integer instead       : 2147483648

Go wraps, like Java, and defines it. The difference is that Go's plain
\`int\` is 64 bits on every machine you will run this on, so you have to ask
for int32 to see the problem at all. That makes overflow rarer here than in
Java or C++ — and rarer is not never, which is why the constraint in the
problem statement is still the thing to read first.`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Casting after the overflow instead of before",
          body: "`long result = a * b;` does not help when `a` and `b` are both `int`. The multiplication happens in `int`, overflows, and the already-wrong answer is then widened to `long`. You must promote an operand before the operation: `long result = (long) a * b;`.",
        },
        {
          title: "Assuming a sum is safe because each element is",
          body: "An array of 100,000 values each up to 100,000 sums to 10 billion. Every individual element fits in an `int` comfortably; the total does not. Sums, products and prefix sums are where this bites, and the habit worth building is to make the accumulator a `long` by default.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming, briefly",
      body: [
        "One rule, because it pays off immediately and there is a whole lesson on it later: a variable's name should say what it holds.",
        "`n`, `i`, `j` and `k` are fine and idiomatic for a size and for loop counters — everybody reads them correctly and expanding them adds nothing. Beyond those, spell it out. `maxSoFar` costs eight extra characters and saves you re-deriving what `m` meant when you come back to the code in an hour.",
        "Java uses `camelCase` for variables; Python uses `snake_case`. Both languages have strong conventions here and following them costs nothing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is integer overflow, and how do you avoid it?",
      answer:
        "A fixed-width integer type has a maximum value — 2,147,483,647 for a 32-bit `int` — and exceeding it wraps around to the most negative value rather than raising an error, so the program continues with a wrong number. You avoid it by using a 64-bit `long` for anything that accumulates or multiplies, and by promoting before the operation rather than after: `(long) a * b`, not `(long) (a * b)`. Python is immune because its integers grow arbitrarily.",
    },
    {
      question: "What does `7 / 2` evaluate to, and why does it matter?",
      answer:
        "In Java, 3 — dividing two `int`s gives an `int`, and the fractional part is discarded rather than rounded. In Python, `/` gives 3.5 and `//` gives 3. It matters because the truncation is silent: an average or a percentage computed with integer division is simply wrong with no error. It is also worth knowing that Java truncates toward zero while Python's `//` floors toward negative infinity, so `-7 / 2` is −3 in Java and `-7 // 2` is −4 in Python.",
    },
    {
      question: "What is the difference between static and dynamic typing?",
      answer:
        "With static typing the type belongs to the variable and is fixed and checked before the program runs, so a type mismatch is a compile error. With dynamic typing the type belongs to the value and travels with it, so a variable can hold anything and mismatches surface at run time when an operation is attempted. Java is statically typed, Python dynamically. The trade is when you find out: early and with more ceremony, or late and with less.",
    },
  ],
  takeaways: [
    "A variable is a name attached to a box in memory; `=` means \"becomes\", not \"equals\"",
    "Java's type annotation tells the compiler how big the box is and is checked before the program runs",
    "Python attaches types to values rather than to names, so a name can hold anything",
    "You need five Java types for this track: `int`, `long`, `double`, `boolean`, `char`",
    "Integer division discards the remainder: `7 / 2` is 3 in Java, and `1 / 2` is 0",
    "Java truncates toward zero, Python's `//` floors toward negative infinity — they differ on negatives",
    "An `int` overflows silently past 2.1 billion; use `long` for sums and products, and cast before the operation",
    "Python integers grow without limit, which removes that whole class of bug",
  ],
};
