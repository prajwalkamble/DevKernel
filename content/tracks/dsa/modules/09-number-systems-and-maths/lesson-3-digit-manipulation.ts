import type { Lesson } from "@/content/types";

export const digitManipulationLesson: Lesson = {
  id: "dsa-math-digits",
  slug: "digit-manipulation",
  moduleSlug: "number-systems-and-maths",
  title: "Extracting & Rebuilding Digits",
  summary:
    "The two-line loop behind a whole family of problems — digit sums, reversal, palindromes, Armstrong numbers — and why doing it arithmetically beats converting to a string.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Extract the digits of a number with `% 10` and `// 10`",
    "Rebuild a number from digits with the multiply-and-add loop",
    "Handle zero and negatives, which are where these loops break",
    "Solve digit-sum, reversal and palindrome problems without string conversion",
  ],
  sections: [
    {
      id: "the-loop",
      heading: "The loop",
      body: [
        "Two operations do all the work. **`n % 10` is the last digit** and **`n // 10` removes it.** Repeat until nothing is left.",
        "```\nwhile n > 0:\n    digit = n % 10\n    n //= 10\n```",
        "That produces the digits **right to left**, which is worth saying out loud because half the bugs in this area come from expecting them left to right. If you need them in reading order, collect and reverse.",
        "It generalises immediately: replace 10 with any base and it is the base-conversion loop from lesson one. The digit sum, the digit count, the reversal and the palindrome check are all this loop with a different body.",
      ],
      examples: [
        {
          id: "extract",
          title: "Extracting the digits",
          lang: "python",
          code: `def digits_of(n):
    n = abs(n)
    if n == 0:
        return [0]
    out = []
    while n > 0:
        out.append(n % 10)
        n //= 10
    return out[::-1]


for n in (4071, 9, 0, -523, 1000):
    d = digits_of(n)
    print(f"{n:>6} -> {d}   count {len(d)}   sum {sum(d)}")`,
          output: `  4071 -> [4, 0, 7, 1]   count 4   sum 12
     9 -> [9]   count 1   sum 9
     0 -> [0]   count 1   sum 0
  -523 -> [5, 2, 3]   count 3   sum 10
  1000 -> [1, 0, 0, 0]   count 4   sum 1`,
          explanation:
            "The two guards are the whole difficulty. `abs` handles negatives, because `-523 % 10` is 7 in Python and −3 in Java and neither is a digit. The explicit zero case handles the fact that `while n > 0` runs zero times for zero — so without it, `digits_of(0)` returns an empty list and the digit count is 0 rather than 1.",
        },
      ],
      pitfalls: [
        {
          title: "The `while n > 0` loop never runs for zero",
          body: "Every function on this page needs zero written out separately: digit count 1, digit sum 0, reversal 0, palindrome true. Test with 0 before submitting anything digit-based; it is the single most common failing hidden case in this family.",
        },
        {
          title: "`%` on a negative number differs between the two languages",
          body: "Python's `-523 % 10` is 7 — the result takes the sign of the divisor. Java's is −3 — it takes the sign of the dividend. Take the absolute value first and the difference stops mattering, which is why every function here starts with `abs`.",
        },
      ],
    },
    {
      id: "rebuilding",
      heading: "Rebuilding a number",
      body: [
        "The inverse loop is just as short: **multiply the running total by 10 and add the next digit.**",
        "```\nresult = result * 10 + digit\n```",
        "That is Horner's method again, and it appears in three places you will meet repeatedly: reversing a number, parsing a string of digits into an integer by hand, and converting between bases.",
        "The multiply-and-add form is worth preferring over computing powers of ten, because it needs no exponentiation, no floating point, and no knowledge of how many digits there are.",
      ],
      examples: [
        {
          id: "reverse",
          title: "Reversal and the palindrome check",
          lang: "python",
          code: `def reverse_number(n):
    result = 0
    while n > 0:
        result = result * 10 + n % 10
        n //= 10
    return result


def is_palindrome_number(n):
    if n < 0:
        return False
    return n == reverse_number(n)


for n in (1234, 1200, 7, 0):
    print(f"reverse({n}) = {reverse_number(n)}")

print()
for n in (121, 1221, 123, -121, 10, 0):
    print(f"{n:>5} palindrome: {is_palindrome_number(n)}")`,
          output: `reverse(1234) = 4321
reverse(1200) = 21
reverse(7) = 7
reverse(0) = 0

  121 palindrome: True
 1221 palindrome: True
  123 palindrome: False
 -121 palindrome: False
   10 palindrome: False
    0 palindrome: True`,
          explanation:
            "`reverse(1200)` is 21, not 0021 — trailing zeros vanish, because a number has no leading zeros. That is correct behaviour and it is also why 10 is not a palindrome while 0 is. Negatives are excluded by convention: −121 reversed reads 121−, which is not the same string, so the standard problem answers false.",
        },
      ],
    },
    {
      id: "counting-digits",
      heading: "Counting digits: three ways, one of them wrong",
      body: [
        "**The loop.** Divide by 10 until zero, counting. Always correct, O(number of digits).",
        "**The string.** `len(str(n))` in Python, `String.valueOf(n).length()` in Java. Correct, allocates, and perfectly acceptable in an interview unless the problem forbids it.",
        "**The logarithm.** `int(log10(n)) + 1`. Looks clever and is **not reliable** — floating-point log10 can round to the wrong side of an integer boundary, and then the count is off by one.",
        "The failing case is not hypothetical or hard to reach: fifteen nines. `log10(999999999999999)` evaluates to exactly 15.0 because the true value 14.9999… is not representable, so the formula reports 16 digits for a 15-digit number.",
      ],
      examples: [
        {
          id: "counting",
          title: "Where the logarithm breaks",
          lang: "python",
          code: `import math


def count_by_loop(n):
    if n == 0:
        return 1
    n = abs(n)
    c = 0
    while n > 0:
        c += 1
        n //= 10
    return c


print(f"{'n':>17}  {'loop':>4}  {'str':>4}  {'log10':>5}")
for n in (0, 7, 99, 100, 999999, 10 ** 12):
    log_count = 0 if n == 0 else int(math.log10(n)) + 1
    print(f"{n:>17}  {count_by_loop(n):>4}  {len(str(n)):>4}  {log_count:>5}")

bad = 10 ** 15 - 1
print()
print("the number      :", bad)
print("true digits     :", count_by_loop(bad), "and", len(str(bad)))
print("log10 says      :", math.log10(bad), "->", int(math.log10(bad)) + 1)
print("the real log10 is just under 15, but is not representable")`,
          output: `                n  loop   str  log10
                0     1     1      0
                7     1     1      1
               99     2     2      2
              100     3     3      3
           999999     6     6      6
    1000000000000    13    13     13

the number      : 999999999999999
true digits     : 15 and 15
log10 says      : 15.0 -> 16
the real log10 is just under 15, but is not representable`,
          explanation:
            "The table agrees on every small value, which is exactly what makes the logarithm approach dangerous — it passes casual testing and fails on the boundary values a hidden test case will pick. Use the loop, or use the string. This is the first appearance of a theme that lesson eight develops: **floating point is the wrong tool for exact integer questions.**",
        },
      ],
    },
    {
      id: "family",
      heading: "The family of problems",
      body: [
        "Recognising these by name saves time, because they are all the same loop.",
        "**Digit sum / digital root.** Sum the digits; repeat until one digit remains. The closed form for the digital root is `1 + (n - 1) % 9` for positive n, which is worth knowing as a party trick and as a genuine O(1) answer.",
        "**Armstrong (narcissistic) numbers.** Each digit raised to the power of the digit count, summed, equals the number. 153 = 1³ + 5³ + 3³.",
        "**Happy numbers.** Repeatedly sum the squares of the digits; the number is happy if this reaches 1. It always either reaches 1 or enters a cycle — which makes it the standard teaching problem for cycle detection.",
        "**Palindrome without reversing the whole number.** Reverse only the second half and compare; this avoids overflow in a fixed-width language, which is the follow-up the interviewer is waiting for.",
      ],
      examples: [
        {
          id: "family",
          title: "Four of them",
          lang: "python",
          code: `def digit_sum(n):
    total = 0
    n = abs(n)
    while n > 0:
        total += n % 10
        n //= 10
    return total


def digital_root(n):
    while n >= 10:
        n = digit_sum(n)
    return n


def is_armstrong(n):
    k = len(str(n))
    return n == sum(int(d) ** k for d in str(n))


def is_happy(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1


print("digit sums   :", [digit_sum(n) for n in (4071, 999, 0)])
print("digital roots:", [digital_root(n) for n in (4071, 999, 38)])
print("closed form  :", [1 + (n - 1) % 9 for n in (4071, 999, 38)])
print("armstrong    :", [n for n in range(100, 1000) if is_armstrong(n)])
print("happy        :", [n for n in range(1, 21) if is_happy(n)])`,
          output: `digit sums   : [12, 27, 0]
digital roots: [3, 9, 2]
closed form  : [3, 9, 2]
armstrong    : [153, 370, 371, 407]
happy        : [1, 7, 10, 13, 19]`,
          explanation:
            "The closed form agrees with the iterative digital root on every value, which is the point — a loop replaced by one expression, justified by the fact that a number is congruent to its digit sum modulo 9. The happy-number function uses a `set` for cycle detection; without it, an unhappy number loops forever, and that is the actual lesson the problem is teaching.",
        },
      ],
      pitfalls: [
        {
          title: "Reversing a number to check a palindrome can overflow",
          body: "In Java, reversing a large `int` can leave the range and wrap, so the comparison fails on a valid input. The fix the interviewer wants is to reverse only the second half of the digits and compare with the first — the reversed half can never exceed the original, so it cannot overflow. Python has no such problem, which is why the follow-up catches Python solvers off guard.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you extract the digits of a number without converting it to a string?",
      answer:
        "`n % 10` gives the last digit and `n // 10` removes it; loop until n is zero. The digits come out right to left, so reverse if you need reading order. Two guards are required: take the absolute value first, because `%` on a negative differs between Python and Java, and handle zero explicitly, because the `while n > 0` loop never runs for it.",
    },
    {
      question: "How do you count the digits of a number, and why not use log10?",
      answer:
        "Divide by 10 until zero, counting — or take the length of the string form, which is fine in most interviews. `int(log10(n)) + 1` is unreliable: floating-point log10 can land on the wrong side of an integer boundary. `log10(999999999999999)` evaluates to exactly 15.0 because the true value is not representable, so the formula reports 16 digits for a 15-digit number. Small values all agree, so the bug survives casual testing.",
    },
    {
      question: "How would you check whether a number is a palindrome without overflowing?",
      answer:
        "Reverse only the second half of the digits and compare it with the first half, stopping when the reversed part becomes at least as large as what remains. The reversed half can never exceed the original number, so it cannot overflow — where reversing the whole number can, in any fixed-width language. Negatives are false by convention, and any number ending in 0 other than 0 itself is false, because the reversal would need a leading zero.",
    },
  ],
  takeaways: [
    "`n % 10` is the last digit, `n // 10` removes it — digits come out right to left",
    "Rebuild with `result = result * 10 + digit`, which is Horner's method",
    "Take `abs` first: `%` on negatives differs between Python and Java",
    "Zero needs its own case in every one of these loops",
    "Count digits with the loop or the string form; `int(log10(n)) + 1` is off by one on fifteen nines",
    "Reversing drops trailing zeros, which is why 10 is not a palindrome and 0 is",
    "The digital root has a closed form: `1 + (n - 1) % 9`",
    "Happy numbers need cycle detection; reverse only half the digits to avoid overflow",
  ],
};
