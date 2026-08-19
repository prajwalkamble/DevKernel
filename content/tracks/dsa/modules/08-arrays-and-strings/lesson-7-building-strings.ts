import type { Lesson } from "@/content/types";

export const buildingStringsLesson: Lesson = {
  id: "dsa-arr-building",
  slug: "building-strings",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Building a String Without the Quadratic Trap",
  summary:
    "Four ways to assemble text, what each costs, and the one that is right by default — plus the case where the trap hides behind a library call.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Choose the right construction technique for a given situation",
    "Explain why a buffer is linear and repeated concatenation is not",
    "Use `StringBuilder` and `join` fluently, including the separator cases",
    "Recognise the quadratic trap when it is hidden inside `+=` on a field",
  ],
  sections: [
    {
      id: "four-ways",
      heading: "Four ways, and when each is right",
      body: [
        "Module 2 established the rule: never build a string with `+` in a loop. This lesson is the positive version — what to do instead, and how to pick.",
        "**Concatenation with `+`** — right for a fixed, small number of pieces. `\"answer: \" + n` is clear and costs nothing. The problem is repetition, not the operator.",
        "**A buffer** — `StringBuilder` in Java, a list plus `join` in Python. Right whenever the number of pieces depends on the input.",
        "**`join`** — right when you already have the pieces in a collection and want a separator between them. It is the shortest correct answer more often than people expect.",
        "**Formatting** — f-strings and `String.format`. Right when you are interpolating a few values into a fixed shape, which is most printing.",
      ],
      examples: [
        {
          id: "four-ways",
          title: "The same output, four ways",
          lang: "python",
          code: `values = [3, 1, 4]

# 1. Concatenation: fine for a fixed, small number of pieces.
header = "values" + ": " + str(len(values))
print(header)

# 2. A buffer: right when the count depends on the input.
parts = []
for v in values:
    parts.append(str(v * 2))
print("".join(parts))

# 3. join: right when the pieces are already a collection.
print(", ".join(str(v) for v in values))
print(" -> ".join(["start", "middle", "end"]))

# 4. Formatting: right for interpolating into a fixed shape.
print(f"{len(values)} values, largest {max(values)}, sum {sum(values)}")`,
          output: `values: 3
628
3, 1, 4
start -> middle -> end
3 values, largest 4, sum 8`,
          explanation:
            "Four techniques, four appropriate uses. Note the third line passes a generator straight to `join` rather than building a list first — that avoids one intermediate collection and is the idiomatic form. And `join` puts separators *between* items, never after the last, which is what makes it immune to the trailing-separator bug from the formatting lesson.",
        },
      ],
    },
    {
      id: "why-linear",
      heading: "Why a buffer is linear",
      body: [
        "The mechanism is exactly the dynamic array from lesson three, and knowing that makes the cost obvious rather than a fact to memorise.",
        "A `StringBuilder` holds a `char[]` and a count. Appending writes into the next free slot — O(1) — and when the array fills, it allocates a bigger one and copies, which by the doubling argument is amortised O(1) per character. Total for n characters: **O(n)**.",
        "Repeated concatenation has no buffer. Each `+` allocates a string of the full current length and copies everything into it, so the totals are 1 + 2 + 3 + … + n = **O(n²)**.",
        "The difference is not the operator. It is that one of them keeps the partial result and the other rebuilds it every time.",
      ],
      examples: [
        {
          id: "counting-copies",
          title: "Counting the characters copied",
          lang: "python",
          code: `def copies_concatenating(n):
    """Each += rebuilds the whole string so far."""
    total = 0
    length = 0
    for _ in range(n):
        total += length      # copy what exists
        length += 1
    return total


def copies_buffering(n):
    """A doubling buffer: copy only on growth."""
    total = 0
    capacity, size = 1, 0
    for _ in range(n):
        if size == capacity:
            total += size
            capacity *= 2
        size += 1
    return total


print(f"{'n':>7}  {'concatenating':>14}  {'buffering':>10}  {'ratio':>8}")
for n in (100, 1000, 10_000):
    c = copies_concatenating(n)
    b = copies_buffering(n)
    print(f"{n:>7}  {c:>14,}  {b:>10,}  {c / b:>8.1f}x")`,
          output: `      n   concatenating   buffering     ratio
    100           4,950         127      39.0x
   1000         499,500       1,023     488.3x
  10000      49,995,000      16,383    3051.6x
`,
          explanation:
            "The ratio grows with n — 39× at a hundred characters, 3,051× at ten thousand. That growth is the signature: a constant-factor difference would keep the ratio flat. At n = 10,000 the concatenating version copies fifty million characters to build a ten-thousand-character string.",
        },
      ],
    },
    {
      id: "java-builder",
      heading: "StringBuilder in practice",
      body: [
        "Three things worth knowing beyond `append`.",
        "**It chains.** `sb.append(a).append(b)` works because `append` returns the builder. Convenient, and it is why the pattern-printing lessons used it.",
        "**It appends anything.** There are overloads for every primitive and for `Object`, so `append(count)` on an `int` needs no conversion. Watch the `char` against `int` case from the character lesson — `append('A' + 1)` appends 66, not `B`.",
        "**It has `reverse`, `insert`, `deleteCharAt` and `setCharAt`.** `new StringBuilder(s).reverse().toString()` is the one-line string reversal, and `setCharAt` is how you modify a single character without rebuilding.",
      ],
      examples: [
        {
          id: "builder-methods",
          title: "The methods worth knowing",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append("count: ").append(3).append(", ok: ").append(true);
        System.out.println(sb);
        System.out.println("length " + sb.length());

        StringBuilder edit = new StringBuilder("hello");
        edit.setCharAt(0, 'H');
        edit.insert(5, '!');
        System.out.println(edit);
        edit.deleteCharAt(5);
        System.out.println(edit + " -> reversed: " + new StringBuilder(edit).reverse());

        StringBuilder joined = new StringBuilder();
        String[] parts = { "a", "b", "c" };
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                joined.append(", ");
            }
            joined.append(parts[i]);
        }
        System.out.println(joined);
        System.out.println(String.join(", ", parts));
    }
}`,
          output: `count: 3, ok: true
length 18
Hello!
Hello -> reversed: olleH
a, b, c
a, b, c`,
          explanation:
            "The separator loop at the bottom shows the manual way and the one-line way. `if (i > 0) append(\", \")` puts the separator *before* every element except the first, which is the correct shape — appending after each element instead leaves a trailing one. `String.join` does it for you and cannot get it wrong, which is why it is preferable whenever the pieces are already in a collection.",
        },
      ],
      pitfalls: [
        {
          title: "Reusing a StringBuilder without clearing it",
          body: "A builder declared outside a loop accumulates across iterations. Either declare it inside the loop, or call `setLength(0)` to reset it — the second is faster because it keeps the allocated buffer. Forgetting produces output where each line contains all the previous ones, which is a very recognisable symptom.",
        },
      ],
    },
    {
      id: "hidden-trap",
      heading: "Where the trap hides",
      body: [
        "The obvious `s += x` in a visible loop is easy to spot. Three variants are not.",
        "**Concatenating onto a field or a global** across many method calls. There is no loop in any single method, and the accumulation is still quadratic.",
        "**Building inside a recursion.** Each level concatenating the partial result rebuilds it, which in a backtracking search over many paths is expensive and easy to miss.",
        "**Concatenating in a stream or comprehension** with `reduce`. `functools.reduce(lambda a, b: a + b, parts)` is exactly the quadratic loop wearing functional clothes.",
        "The reliable tell is not the syntax. It is the question: **is a string being rebuilt more than once per character?** If yes, use a buffer.",
      ],
      examples: [
        {
          id: "hidden",
          title: "The same cost, three disguises",
          lang: "python",
          code: `from functools import reduce

parts = [str(i) for i in range(200)]


def by_reduce(parts):
    """Looks functional. Is the quadratic loop."""
    return reduce(lambda a, b: a + b, parts, "")


def by_recursion(parts, i=0):
    """Looks recursive. Also rebuilds at every level."""
    if i == len(parts):
        return ""
    return parts[i] + by_recursion(parts, i + 1)


def by_join(parts):
    return "".join(parts)


results = [by_reduce(parts), by_recursion(parts), by_join(parts)]
print("all three agree:", results[0] == results[1] == results[2])
print("length:", len(results[0]))
print("first 20 characters:", results[0][:20])`,
          output: `all three agree: True
length: 490
first 20 characters: 01234567891011121314`,
          explanation:
            "Three identical answers, and only the last is linear. `reduce` with `+` builds a new string on every step exactly as a loop would — the functional spelling changes nothing about the allocations. The recursive version is worse still, since it also uses a stack frame per element. Whenever pieces are being combined into a string, `join` is the answer.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is `StringBuilder` linear where repeated concatenation is quadratic?",
      answer:
        "A builder keeps one growable `char[]` and a count, so appending writes into a free slot — O(1) — and only copies when the buffer fills, which by the doubling argument is amortised O(1) per character. Repeated concatenation keeps nothing: each `+` allocates a string of the current full length and copies everything into it, so the totals are 1 + 2 + … + n. Measured, building a 10,000-character string copies 16,383 characters with a buffer and 49,995,000 without.",
    },
    {
      question: "When would you use `join` rather than a StringBuilder?",
      answer:
        "When the pieces are already in a collection and you want a separator between them. `join` walks the collection to compute the total length, allocates exactly that, and copies each piece in — linear, and it cannot produce a trailing separator, which the manual loop can. A builder is right when the pieces are produced as you go and there is no natural collection, or when you need `insert`, `setCharAt` or `reverse`.",
    },
    {
      question: "Where does the quadratic string trap hide?",
      answer:
        "Anywhere the rebuilding is not a visible loop: concatenating onto a field across many method calls, building a partial result at every level of a recursion, or `reduce` with `+` over a collection, which is the same loop in functional clothing. The reliable test is not syntactic — it is whether the string is being rebuilt more than once per character. If it is, use a buffer.",
    },
  ],
  takeaways: [
    "`+` is right for a fixed, small number of pieces; the problem is repetition, not the operator",
    "A buffer keeps the partial result; concatenation rebuilds it every time",
    "Measured at n = 10,000: 16,383 characters copied with a buffer, 49,995,000 without",
    "The ratio grows with n — a constant-factor difference would stay flat",
    "`join` is shortest when the pieces are already a collection, and cannot leave a trailing separator",
    "`StringBuilder` chains, appends any type, and offers `reverse`, `insert` and `setCharAt`",
    "Reset a reused builder with `setLength(0)` rather than reallocating",
    "The trap hides in fields, recursions and `reduce` — ask whether the string is rebuilt per character",
  ],
};
