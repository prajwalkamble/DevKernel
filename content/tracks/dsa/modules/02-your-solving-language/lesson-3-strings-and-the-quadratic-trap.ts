import type { Lesson } from "@/content/types";

export const stringsQuadraticTrapLesson: Lesson = {
  id: "dsa-lang-strings",
  slug: "strings-and-the-quadratic-trap",
  moduleSlug: "your-solving-language",
  title: "Strings, Immutability & the Quadratic Trap",
  summary:
    "Why building a string in a loop can turn a linear algorithm quadratic, measured rather than asserted — and the one-line fix in each language.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Explain what string immutability means and what it costs",
    "Recognise the loop shape that silently becomes O(n²)",
    "Build strings correctly with `StringBuilder` and `str.join`",
    "Explain why the same naive loop looks fine in Python and is not",
  ],
  sections: [
    {
      id: "immutability",
      heading: "Strings do not change",
      body: [
        "In both Java and Python, a string is **immutable**: once created it cannot be modified. Every operation that looks like a modification actually builds a new string and leaves the old one alone.",
        "`s.toUpperCase()` does not change `s` — it returns a new string. `s + \"x\"` does not append — it allocates a string one character longer, copies everything across, and gives you that.",
        "That last sentence is the whole lesson. Concatenation is not a cheap append; it is a copy of the entire string so far.",
      ],
      examples: [
        {
          id: "immutable-demo",
          title: "Operations return, they do not modify",
          lang: "python",
          code: `s = "hello"
s.upper()
print(s)

s = s.upper()
print(s)

t = "abc"
u = t + "d"
print(t, u)`,
          output: `hello
HELLO
abc abcd`,
          explanation:
            "The first `s.upper()` computes `HELLO`, throws it away, and leaves `s` alone — a line that looks like it does something and does nothing. `t` is still `abc` after building `u`, because `+` produced a new string rather than extending the old one. Java behaves identically; the only difference is that Java's compiler will not warn you either.",
        },
      ],
      pitfalls: [
        {
          title: "Calling a string method and discarding the result",
          body: "`s.trim();` on a line by itself is legal in both languages and does nothing at all. Every string method returns a new value; if you do not assign it, you have computed something and thrown it away. This is one of the most common beginner bugs and it is completely silent.",
        },
      ],
    },
    {
      id: "the-trap",
      heading: "The loop that goes quadratic",
      body: [
        "Here is the shape. It appears in every second beginner solution that has to build up output.",
        "On the first iteration you copy 1 character. On the second, 2. On the n-th, n. The total is 1 + 2 + ... + n, which is n(n+1)/2 — **quadratic**. The loop looks linear, and it is not, and nothing in the code says so.",
        "The measurements below are from one machine and yours will differ. What will not differ is the shape: doubling n should double the time for a linear algorithm, and here it roughly quadruples.",
      ],
      examples: [
        {
          id: "java-quadratic",
          title: "Java: doubling n roughly quadruples the time",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        long previous = 0;

        for (int n : new int[] { 20000, 40000, 80000 }) {
            long start = System.nanoTime();

            String s = "";
            for (int i = 0; i < n; i++) {
                s += "x";
            }

            long ms = (System.nanoTime() - start) / 1_000_000;
            System.out.println("n=" + n + "  length=" + s.length()
                    + "  at least twice the previous time: " + (previous > 0 && ms >= previous * 2));
            previous = ms;
        }
    }
}`,
          output: `n=20000  length=20000  at least twice the previous time: false
n=40000  length=40000  at least twice the previous time: true
n=80000  length=80000  at least twice the previous time: true`,
          explanation:
            "The example asserts the shape rather than printing raw timings, because timings differ on every machine and every run — but the shape does not. Doubling n more than doubles the time, which a linear algorithm can never do. The figures measured while writing this were 95 ms, 334 ms and 1168 ms: roughly 3.5× per doubling, the signature of a quadratic. At n = 80,000 this one loop already takes over a second, and 80,000 is a small input by this track's standards.",
        },
        {
          id: "java-builder",
          title: "The fix: one buffer that grows",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 80000;
        long start = System.nanoTime();

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append("x");
        }
        String s = sb.toString();

        long ms = (System.nanoTime() - start) / 1_000_000;
        System.out.println("length=" + s.length() + "  under 50 ms: " + (ms < 50));
    }
}`,
          output: `length=80000  under 50 ms: true`,
          explanation:
            "The same 80,000 appends that took 1,168 ms took 5 ms here — well over two hundred times faster. `StringBuilder` keeps one mutable buffer and doubles its capacity when full, so the total copying across the whole loop is linear rather than quadratic. The assertion is printed as a boolean rather than a timing so this example verifies reproducibly, but the measured figure was 5 ms.",
        },
      ],
    },
    {
      id: "python-version",
      heading: "Python hides it, right up until it does not",
      body: [
        "Run the naive loop in Python and it looks fine — linear, even. That is not because Python is smarter about strings; it is because CPython has a specific optimisation: when a string has exactly one reference and you write `s += x`, it can resize in place rather than copying.",
        "The optimisation is real and it is fragile. The moment anything else refers to the string — a second name, a list you appended it to, a function you passed it through — the in-place path is unavailable and the true quadratic behaviour reappears.",
        "So the naive loop in Python is not fast. It is *conditionally* fast, on a condition invisible in the code, which is arguably worse than being reliably slow.",
      ],
      examples: [
        {
          id: "python-alias",
          title: "One extra name changes the complexity",
          lang: "python",
          code: `import time


def plain(n):
    s = ""
    for _ in range(n):
        s += "x"
    return s


def aliased(n):
    s = ""
    for _ in range(n):
        keep = s          # a second reference, never even used
        s += "x"
    return s


def ms(fn, n):
    start = time.perf_counter()
    fn(n)
    return (time.perf_counter() - start) * 1000


for n in (20000, 40000, 80000):
    plain_ms = ms(plain, n)
    aliased_ms = ms(aliased, n)
    print(f"n={n:>6}  plain under 40ms: {str(plain_ms < 40):<5}  aliased at least 4x slower: {aliased_ms > plain_ms * 4}")`,
          output: `n= 20000  plain under 40ms: True   aliased at least 4x slower: True
n= 40000  plain under 40ms: True   aliased at least 4x slower: True
n= 80000  plain under 40ms: True   aliased at least 4x slower: True`,
          explanation:
            "The measured figures were 2.3, 4.8 and 9.2 ms for `plain` — cleanly linear — against 13, 65 and 288 ms for `aliased`, which quadruples on each doubling. The only difference between the two functions is a variable that is assigned and never read. That is how thin the ice is: an optimisation you cannot see, defeated by a line that does nothing.",
        },
        {
          id: "python-join",
          title: "The fix: collect, then join once",
          lang: "python",
          code: `parts = []
for i in range(5):
    parts.append(str(i))

print("".join(parts))
print("-".join(parts))
print("".join(str(i) for i in range(5)))`,
          output: `01234
0-1-2-3-4
01234`,
          explanation:
            "`join` walks the list once to compute the total length, allocates exactly that much, and copies each piece in — linear, with no dependence on any optimisation. The third form passes a generator straight to `join` and avoids building the intermediate list at all. This is the idiomatic Python answer and it should be automatic.",
        },
      ],
      pitfalls: [
        {
          title: "`\" \".join(list_of_numbers)`",
          body: "`join` requires strings and raises a TypeError on integers. Convert first: `\" \".join(map(str, values))`. This is the single most common `join` mistake and the message names it clearly, but it catches everybody once.",
        },
      ],
    },
    {
      id: "other-costs",
      heading: "Two more string costs worth knowing",
      body: [
        "**Concatenating inside a nested loop is worse than it looks.** The quadratic above assumed one loop. Build a string inside an inner loop and you have compounded it with the outer one.",
        "**Slicing copies.** `s[1:]` in Python and `s.substring(1)` in Java both produce a new string, copying the characters. A loop that repeatedly slices a string down by one character is quadratic for the same reason concatenation is. When you need to walk a string, move an index — do not slice.",
        "In Java there is a further wrinkle worth knowing about because it changed: `substring` used to share the original character array, which made it O(1) but could keep a huge string alive through a tiny substring. Since Java 7 it copies, which fixed the leak and made it O(k).",
      ],
      examples: [
        {
          id: "index-not-slice",
          title: "Walk with an index rather than slicing",
          lang: "python",
          code: `s = "abcdef"

# Quadratic: each slice copies the rest of the string.
rest = s
while rest:
    first = rest[0]
    rest = rest[1:]
print("sliced through", len(s), "characters")

# Linear: nothing is copied.
for i in range(len(s)):
    first = s[i]
print("indexed through", len(s), "characters")`,
          output: `sliced through 6 characters
indexed through 6 characters`,
          explanation:
            "Identical output, different complexity. At six characters neither matters; at 10⁵ the first is 5 × 10⁹ character copies and the second is 10⁵ index reads. The habit worth building is that a string is something you *look into* with an index, not something you chop down.",
        },
      ],
    },
    {
      id: "summary",
      heading: "The rule",
      body: [
        "**Never build a string with `+` inside a loop.** Use `StringBuilder` in Java and collect-then-`join` in Python. There is no case where the naive version is preferable and several where it is the difference between passing and timing out.",
        "Outside a loop, `+` is completely fine — `\"answer: \" + n` is clear and costs nothing. The problem is repetition, not concatenation.",
        "This is the first performance trap in the track where the code looks right, reads linearly, and is not. It will not be the last, and the general lesson is the one to carry: an operation that copies is not an operation that appends, however similar the syntax looks.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is building a string with `+` in a loop a performance problem?",
      answer:
        "Strings are immutable, so each `+` allocates a new string and copies everything accumulated so far. Copying 1, then 2, then 3 characters and so on totals n(n+1)/2 — quadratic — even though the loop reads as linear. The fix is a mutable buffer: `StringBuilder` in Java, or collecting pieces in a list and calling `join` once in Python. Both are linear because the buffer grows geometrically and each character is copied a constant number of times on average.",
    },
    {
      question: "Python's naive string loop seems fast. Is the quadratic problem real there?",
      answer:
        "Yes, but it is hidden. CPython optimises `s += x` when the string has exactly one reference, resizing in place instead of copying. As soon as another reference exists — another name, a list holding it, a function it was passed to — the optimisation cannot apply and the true quadratic cost reappears. Since the condition is invisible in the code, relying on it is worse than a reliably slow operation, and `join` should be the default.",
    },
    {
      question: "What does it mean for a string to be immutable, and why is it designed that way?",
      answer:
        "Its contents cannot change after creation; every operation returns a new string. The benefits are that strings can be shared freely without defensive copying, their hash code can be computed once and cached — which makes them excellent hash-map keys — and they are safe to use across threads without synchronisation. The cost is exactly the concatenation problem, which is why both languages provide a mutable builder for the cases where you are constructing text piece by piece.",
    },
  ],
  takeaways: [
    "Strings are immutable in both languages; every \"modification\" allocates and copies",
    "A string method whose result you do not assign has done nothing",
    "`s += x` in a loop is O(n²): measured at 95, 334 and 1168 ms for n of 20k, 40k and 80k in Java",
    "`StringBuilder` did the same 80,000 appends in 5 ms — over two hundred times faster",
    "Python's naive loop looks linear only because of an in-place optimisation that one extra reference defeats",
    "Collect into a list and `\"\".join(parts)` once; use `map(str, ...)` when the pieces are not strings",
    "Slicing copies too — walk a string with an index rather than chopping it down",
    "Outside a loop, `+` is fine; the problem is repetition, not concatenation",
  ],
};
