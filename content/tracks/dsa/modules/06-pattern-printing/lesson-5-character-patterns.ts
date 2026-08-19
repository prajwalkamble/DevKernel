import type { Lesson } from "@/content/types";

export const characterPatternsLesson: Lesson = {
  id: "dsa-pattern-characters",
  slug: "character-patterns",
  moduleSlug: "pattern-printing-problems",
  title: "Character Patterns",
  summary:
    "The same shapes with letters instead of stars, built on the character arithmetic from Module 3 — and the wrap-around that a modulo handles.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Generate a sequence of letters from an index",
    "Print letter triangles that reset per row and ones that continue",
    "Wrap past Z without a special case",
    "Mirror a row of characters to make a palindromic pattern",
  ],
  sections: [
    {
      id: "letters-from-index",
      heading: "Turning an index into a letter",
      body: [
        "Everything here rests on one fact from the characters lesson: **letters have consecutive codes**, so `chr(ord('A') + i)` is the i-th letter counting from zero. Java writes the same thing as `(char) ('A' + i)`.",
        "Once you have that, every star pattern from the previous lessons becomes a letter pattern by replacing the character with an expression. The loops do not change at all.",
      ],
      examples: [
        {
          id: "letters",
          title: "The index-to-letter step, then a triangle",
          lang: "python",
          code: `print([chr(ord("A") + i) for i in range(5)])
print([chr(ord("a") + i) for i in range(5)])

n = 4
print("resets each row:")
for r in range(n):
    print(" ".join(chr(ord("A") + c) for c in range(r + 1)))

print("continues across rows:")
for r in range(n):
    print(" ".join(chr(ord("A") + r) for c in range(r + 1)))`,
          output: `['A', 'B', 'C', 'D', 'E']
['a', 'b', 'c', 'd', 'e']
resets each row:
A
A B
A B C
A B C D
continues across rows:
A
B B
C C C
D D D D`,
          explanation:
            "The two triangles differ by one character: `c` in the first, `r` in the second. That is the same column-source-versus-row-source distinction as the number patterns lesson, which is the point — once the loop structure is automatic, every variant is a change to one expression.",
        },
      ],
    },
    {
      id: "running-letters",
      heading: "A running letter, and wrapping past Z",
      body: [
        "Floyd's triangle with letters means a counter that continues across rows. That works exactly as it did with numbers, until the counter passes 25 and `chr(ord('A') + 26)` gives you `[`.",
        "The fix is a modulo, which is the wrapping job from the modulo lesson: `chr(ord('A') + counter % 26)`. No special case, no `if`, and it works for any number of rows.",
      ],
      examples: [
        {
          id: "wrapping",
          title: "Past Z, with and without the modulo",
          lang: "python",
          code: `n = 7

print("without wrapping:")
counter = 0
for r in range(n):
    row = []
    for c in range(r + 1):
        row.append(chr(ord("A") + counter))
        counter += 1
    print("".join(row))

print("with wrapping:")
counter = 0
for r in range(n):
    row = []
    for c in range(r + 1):
        row.append(chr(ord("A") + counter % 26))
        counter += 1
    print("".join(row))`,
          output: `without wrapping:
A
BC
DEF
GHIJ
KLMNO
PQRSTU
VWXYZ[\\
with wrapping:
A
BC
DEF
GHIJ
KLMNO
PQRSTU
VWXYZAB`,
          explanation:
            "The last row of the first version runs off the end of the alphabet into the punctuation that follows Z in ASCII — `[` and `\\`. That is not an error and nothing warns you; it is simply what the next codes are. The modulo version wraps back to A. Note this is the same `% n` that wraps a circular array index, applied to a different kind of index.",
        },
      ],
      pitfalls: [
        {
          title: "Wrapping with a subtraction instead of a modulo",
          body: "`if counter > 25: counter -= 26` works for one wrap and fails on the second. The modulo handles any number of wraps with no branch, and it is the reason the modulo lesson listed wrapping as one of its four jobs.",
        },
      ],
    },
    {
      id: "mirrored",
      heading: "Mirrored rows",
      body: [
        "A common variant prints each row forwards then backwards — `ABCBA` — which is a palindrome centred on the row's last letter.",
        "Two ways to build it. **Concatenate** the forward part with the reverse of everything but its last character, which is short and clear. Or **derive from the distance to the centre**, which is longer but generalises to shapes where the row is not built from a sequence at all.",
        "The second is worth seeing because \"what is the distance from this position to the centre?\" is the question behind a lot of grid problems.",
      ],
      examples: [
        {
          id: "mirrored",
          title: "Both constructions",
          lang: "python",
          code: `n = 4

print("by concatenation:")
for r in range(n):
    forward = [chr(ord("A") + c) for c in range(r + 1)]
    row = forward + forward[-2::-1]
    print(" " * (n - r - 1) + "".join(row))

print("by distance from the centre:")
for r in range(n):
    width = 2 * r + 1
    row = []
    for c in range(width):
        distance = abs(c - r)
        row.append(chr(ord("A") + r - distance))
    print(" " * (n - r - 1) + "".join(row))`,
          output: `by concatenation:
   A
  ABA
 ABCBA
ABCDCBA
by distance from the centre:
   A
  ABA
 ABCBA
ABCDCBA`,
          explanation:
            "Identical output, two different ideas. `forward[-2::-1]` takes everything from the second-to-last element backwards, which is what avoids repeating the centre — the same off-by-one care as the diamond's join row. The distance version computes `abs(c - r)`, the number of steps from the middle, and subtracts it from the row's letter; that expression appears constantly in problems about rings, borders and Manhattan distance.",
        },
      ],
    },
    {
      id: "java",
      heading: "In Java",
      body: [
        "The one thing to remember is from the characters lesson: `'A' + i` is an `int`, so it must be cast back to `char` before it prints as a letter. Forgetting the cast prints numbers, which is a confusing enough symptom to be worth causing once.",
      ],
      examples: [
        {
          id: "java-letters",
          title: "The cast, and what happens without it",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 4;

        System.out.println("without the cast:");
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c <= r; c++) {
                line.append('A' + c).append(' ');
            }
            System.out.println(line);
        }

        System.out.println("with the cast:");
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c <= r; c++) {
                line.append((char) ('A' + c)).append(' ');
            }
            System.out.println(line);
        }
    }
}`,
          output: `without the cast:
65
65 66
65 66 67
65 66 67 68
with the cast:
A
A B
A B C
A B C D`,
          explanation:
            "Without the cast you get the ASCII codes — 65 is `A` — because `'A' + c` promotes to `int` and `append(int)` prints the number. The cast tells `append` to take the `char` overload. If a letter pattern ever comes out as a grid of numbers in the sixties and seventies, this is why.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you turn a loop index into a letter?",
      answer:
        "`chr(ord('A') + i)` in Python, `(char) ('A' + i)` in Java, relying on the alphabet occupying consecutive character codes. The reverse — letter to index — is `ord(c) - ord('A')`, which is the same expression that indexes a 26-element frequency array. In Java the cast is required, because `'A' + i` promotes to `int` and printing it gives the numeric code rather than the letter.",
    },
    {
      question: "How do you wrap a letter sequence past Z?",
      answer:
        "Take the index modulo 26 before converting: `chr(ord('A') + counter % 26)`. Without it the sequence continues into the punctuation that follows Z in ASCII, silently, since those are simply the next codes. A subtraction like `if counter > 25: counter -= 26` handles one wrap and fails on the second; the modulo handles any number with no branch.",
    },
    {
      question: "How would you print each row as a palindrome, like `ABCBA`?",
      answer:
        "Either build the forward half and concatenate it with the reverse of all but its last element — `forward + forward[-2::-1]` — which avoids duplicating the centre, or compute each position from its distance to the middle: `abs(c - r)` steps from the centre, subtracted from the row's letter. The second is more code and generalises better, because distance-from-centre is the same expression that describes rings, borders and Manhattan distance in grid problems.",
    },
  ],
  takeaways: [
    "`chr(ord('A') + i)` and `(char) ('A' + i)` turn an index into a letter",
    "Every star pattern becomes a letter pattern by changing one expression",
    "`c` as the source gives letters that reset per row; `r` gives a letter per row",
    "Past Z the codes continue into punctuation — wrap with `% 26`, not a subtraction",
    "`forward + forward[-2::-1]` mirrors a row without repeating the centre",
    "`abs(c - r)` is the distance from the centre, and generalises to rings and borders",
    "In Java, `'A' + i` is an `int` and must be cast, or you print 65 instead of A",
  ],
};
