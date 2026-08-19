import type { Lesson } from "@/content/types";

export const reversalAndRotationLesson: Lesson = {
  id: "dsa-arr-rotation",
  slug: "reversal-rotation-and-the-cycles-underneath",
  moduleSlug: "arrays-and-strings",
  title: "Reversal, Rotation & the Cycles Underneath",
  summary:
    "Why three reversals rotate an array, the juggling algorithm that does it in half the writes, and the family of problems that are secretly rotations.",
  estimatedMinutes: 25,
  objectives: [
    "Normalise k before rotating, including negative and oversized values",
    "Explain why three reversals produce a rotation",
    "Derive the cycle structure of a rotation from gcd(n, k)",
    "Recognise reverse-words and is-rotation as the same idea wearing different clothes",
  ],
  sections: [
    {
      id: "recap",
      heading: "The three reversals, and the first thing to get right",
      body: [
        "Module 0 showed you that rotating an array left by k is three reversals: reverse the whole thing, then reverse the first k, then reverse the rest. This lesson asks *why*, and what else it is good for.",
        "The why is short. Rotating splits the array into two blocks, `A` and `B`, and produces `BA` from `AB`. Reversing the whole array gives `(AB)ʳ`, and reversal has the property that `(AB)ʳ = BʳAʳ` — the blocks swap places and each is individually backwards. Reversing each block in place then undoes the second half of that, leaving `BA`. Three linear passes, O(n) time, O(1) space.",
        "Before any of it, though: **normalise k**. `k` can exceed `n`, and in a left/right conversion it can go negative. `k %= n` handles the first; in Java, where `%` keeps the sign of the dividend, `k = ((k % n) + n) % n` handles both. Forgetting this is the most common way this code fails, and it fails with an index out of bounds rather than a wrong answer, so it is at least loud.",
      ],
      pitfalls: [
        {
          title: "Rotating left when the problem said right",
          body: "Rotating right by k is rotating left by n − k, and the three-reversal version differs only in where the cut goes. Half the sheet's rotation problems specify right and half specify left, so decide which you are writing, check it against one small example by hand before you run anything, and say which one you implemented. A rotation that is correct in the wrong direction passes zero tests and looks like a much deeper bug than it is.",
        },
      ],
    },
    {
      id: "juggling",
      heading: "The cycles underneath",
      body: [
        "There is a second rotation algorithm, and it is worth knowing not because you will often need it but because of what it reveals.",
        "A rotation is a **permutation**: every element moves to a computable new position, `i → (i + k) mod n`. Follow that repeatedly from any starting index and you eventually come back to where you started — you have walked a *cycle*. So instead of three passes, you can walk each cycle once, carrying one held value round it.",
        "The question is how many cycles there are, and the answer is exactly **gcd(n, k)**. When n and k share no factor the whole array is one cycle; when they share a factor of 3 there are three independent cycles that never touch. This is the same fact that governs every \"step round a circle of n by k each time\" problem, and it is worth having seen it once.",
        "The payoff is that juggling does exactly n writes where the three-reversal version does about 2n.",
      ],
      examples: [
        {
          id: "juggling",
          title: "Three reversals against the cycles, with the cycles shown",
          lang: "python",
          code: `from math import gcd


def reverse(a, lo, hi):
    moves = 0
    while lo < hi:
        a[lo], a[hi] = a[hi], a[lo]
        lo += 1
        hi -= 1
        moves += 2
    return moves


def rotate_by_reversal(a, k):
    n = len(a)
    k %= n
    m = reverse(a, 0, n - 1)
    m += reverse(a, 0, k - 1)
    m += reverse(a, k, n - 1)
    return m


def rotate_by_juggling(a, k):
    """Follow each cycle once. There are exactly gcd(n, k) of them."""
    n = len(a)
    k %= n
    moves = 0
    cycles = []
    for start in range(gcd(n, k)):
        cycle = [start]
        held = a[start]
        i = start
        while True:
            j = (i - k) % n
            if j == start:
                break
            a[i] = a[j]
            moves += 1
            cycle.append(j)
            i = j
        a[i] = held
        moves += 1
        cycles.append(cycle)
    return moves, cycles


for n, k in [(7, 3), (8, 2), (6, 4), (9, 3)]:
    base = list(range(n))
    a = base.copy()
    r_moves = rotate_by_reversal(a, k)
    b = base.copy()
    j_moves, cycles = rotate_by_juggling(b, k)
    assert a == b, (n, k, a, b)
    print(f"n={n} k={k}  ->  {a}")
    print(f"    gcd(n,k)={gcd(n,k)}  cycles={cycles}")
    print(f"    reversal writes={r_moves}   juggling writes={j_moves}")`,
          output: `n=7 k=3  ->  [4, 5, 6, 0, 1, 2, 3]
    gcd(n,k)=1  cycles=[[0, 4, 1, 5, 2, 6, 3]]
    reversal writes=12   juggling writes=7
n=8 k=2  ->  [6, 7, 0, 1, 2, 3, 4, 5]
    gcd(n,k)=2  cycles=[[0, 6, 4, 2], [1, 7, 5, 3]]
    reversal writes=16   juggling writes=8
n=6 k=4  ->  [2, 3, 4, 5, 0, 1]
    gcd(n,k)=2  cycles=[[0, 2, 4], [1, 3, 5]]
    reversal writes=12   juggling writes=6
n=9 k=3  ->  [6, 7, 8, 0, 1, 2, 3, 4, 5]
    gcd(n,k)=3  cycles=[[0, 6, 3], [1, 7, 4], [2, 8, 5]]
    reversal writes=16   juggling writes=9`,
          explanation:
            "The `assert` is the point of the example as much as the numbers are: two visibly unrelated algorithms produce identical arrays on every case. Read the cycles for n = 9, k = 3 — three of them, each of length 3, and together they cover every index exactly once, which is what makes the algorithm complete. Juggling writes exactly n; reversal writes roughly 2n, since every swap is two writes and it performs about n swaps in total. **Write the three-reversal version in an interview** — it is four lines, impossible to get subtly wrong, and the constant factor is not what you are being assessed on. Know the cycle version because gcd cycles reappear.",
        },
      ],
    },
    {
      id: "reverse-words",
      heading: "The same trick with more cuts",
      body: [
        "Once the identity `(AB)ʳ = BʳAʳ` is in your hands, a second problem falls out of it immediately.",
        "**Reverse the order of the words in a sentence, in place.** Reversing the whole string puts the words in the right order and each word backwards. Reversing each word individually fixes the second problem without touching the first. Two passes, no extra array.",
        "It is the rotation trick with many cuts rather than one, and recognising that is the difference between remembering two tricks and understanding one.",
      ],
      examples: [
        {
          id: "reverse-words",
          title: "Reverse the words, keep the letters",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static void reverse(char[] a, int lo, int hi) {
        while (lo < hi) {
            char t = a[lo]; a[lo] = a[hi]; a[hi] = t;
            lo++; hi--;
        }
    }

    static String reverseWords(String s) {
        char[] a = s.toCharArray();
        reverse(a, 0, a.length - 1);
        System.out.println("  after reversing everything : \\"" + new String(a) + "\\"");
        int start = 0;
        for (int i = 0; i <= a.length; i++) {
            if (i == a.length || a[i] == ' ') {
                reverse(a, start, i - 1);
                start = i + 1;
            }
        }
        return new String(a);
    }

    public static void main(String[] args) {
        String s = "the sky is blue";
        System.out.println("input                      : \\"" + s + "\\"");
        String out = reverseWords(s);
        System.out.println("  after reversing each word  : \\"" + out + "\\"");
        System.out.println();
        System.out.println("rotation is the same trick with one cut instead of many");
    }
}`,
          output: `input                      : "the sky is blue"
  after reversing everything : "eulb si yks eht"
  after reversing each word  : "blue is sky the"

rotation is the same trick with one cut instead of many`,
          explanation:
            "The loop condition is `i <= a.length` rather than `<`, which is deliberate: the final word has no space after it, so the loop needs one extra iteration to flush it. That off-by-one *in the other direction* — running one past the end on purpose, guarded by the `i == a.length` check before the array access — is a small idiom worth recognising, because the alternative is duplicating the reversal call after the loop. Note that this version assumes single spaces; the harder variant that collapses runs of spaces is the read-and-write pointer from the previous lesson layered on top.",
        },
      ],
    },
    {
      id: "is-rotation",
      heading: "Is one string a rotation of another?",
      body: [
        "The last member of the family, and the one that looks like a puzzle until you see it.",
        "**Every rotation of `s` appears as a substring of `s + s`, and nothing else of that length does.** So `t` is a rotation of `s` exactly when the lengths match and `t` occurs in `s + s`. One line, and the index where it occurs is the rotation offset.",
        "The intuition: concatenating a string to itself lays every rotation out end to end with each one starting one position later. Reading a window of length n starting at offset i gives you precisely the rotation by i.",
        "The length check is not decoration — without it, `\"abc\"` would count as a rotation of `\"abcabc\"` because it certainly occurs inside `\"abcabcabcabc\"`.",
      ],
      examples: [
        {
          id: "is-rotation",
          title: "Rotation by concatenation",
          lang: "python",
          code: `def is_rotation(s, t):
    """Every rotation of s is a substring of s + s, and nothing else of that length is."""
    return len(s) == len(t) and t in s + s


def rotation_offset(s, t):
    if not is_rotation(s, t):
        return -1
    return (s + s).index(t)


pairs = [
    ("abcde", "cdeab"),
    ("abcde", "abcde"),
    ("abcde", "abced"),
    ("aaab", "abaa"),
    ("abc", "abcd"),
]

print(f"{'s':<8} {'t':<8} {'rotation?':>10} {'offset':>8}   s+s")
print("-" * 52)
for s, t in pairs:
    print(f"{s:<8} {t:<8} {str(is_rotation(s, t)):>10} {rotation_offset(s, t):>8}   {s + s}")

word = "abcde"
print()
print(f"every rotation of '{word}' lives inside '{word + word}':")
for i in range(len(word)):
    print(f"  offset {i}: {word[i:] + word[:i]}")`,
          output: `s        t         rotation?   offset   s+s
----------------------------------------------------
abcde    cdeab          True        2   abcdeabcde
abcde    abcde          True        0   abcdeabcde
abcde    abced         False       -1   abcdeabcde
aaab     abaa           True        2   aaabaaab
abc      abcd          False       -1   abcabc

every rotation of 'abcde' lives inside 'abcdeabcde':
  offset 0: abcde
  offset 1: bcdea
  offset 2: cdeab
  offset 3: deabc
  offset 4: eabcd`,
          explanation:
            "The fourth row is the one that keeps you honest: `\"abaa\"` really is a rotation of `\"aaab\"`, and a hand-written check that compares first characters or counts letters would get the third row (`\"abced\"`, an anagram but not a rotation) wrong in the other direction. The cost depends on the substring search — O(n²) with a naive scan, O(n) if you use KMP, which is a perfectly good thing to mention as an aside without implementing it. `s + s` allocates 2n characters, so this is O(n) space rather than O(1); if the interviewer asks for constant space, the answer is to compare `t` against `s` starting at each offset with modular indexing.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Rotate an array left by k in place. Why does the three-reversal trick work?",
      answer:
        "Because reversal distributes over concatenation backwards: `(AB)ʳ = BʳAʳ`. Rotating turns `AB` into `BA`, so reverse the whole array to get `BʳAʳ`, then reverse each of the two blocks in place to recover `B` and `A` in that order. Three linear passes, O(n) time and O(1) space. The thing to get right before any of it is normalising k with `k %= n`, and in Java `((k % n) + n) % n` so a negative k behaves, since `%` there keeps the sign of the dividend.",
    },
    {
      question: "Is there a way to rotate with fewer writes, and how many cycles does it have?",
      answer:
        "Yes — the juggling algorithm treats the rotation as the permutation i → (i + k) mod n and walks each cycle once, carrying one held value round it. The number of cycles is exactly gcd(n, k): coprime n and k give a single cycle covering the whole array, and a shared factor of 3 gives three independent ones. It does exactly n writes against roughly 2n for the three reversals. In an interview I would still write the reversal version, because it is four lines and hard to get subtly wrong, and mention this one — the constant factor is not what is being assessed.",
    },
    {
      question: "How would you check whether one string is a rotation of another?",
      answer:
        "Check the lengths match, then check whether t occurs as a substring of s + s. Concatenating s to itself lays out every rotation end to end, each starting one position later, so the window of length n at offset i is exactly the rotation by i — and the index of the match is the offset. The length check matters: without it \"abc\" would count as a rotation of \"abcabc\". It is O(n) space for the doubled string and the time depends on the substring search, naive O(n²) or O(n) with KMP.",
    },
  ],
  takeaways: [
    "Normalise first: `k %= n`, and `((k % n) + n) % n` in Java for negatives",
    "Three reversals work because (AB)ʳ = BʳAʳ",
    "Rotating right by k is rotating left by n − k — decide which you are writing",
    "A rotation is the permutation i → (i + k) mod n, made of exactly gcd(n, k) cycles",
    "Juggling costs n writes; three reversals cost about 2n — write the reversals",
    "Reverse-the-words is the same identity with many cuts instead of one",
    "Every rotation of s is a substring of s + s, and the index is the offset",
    "Check the lengths, or \"abc\" is a rotation of \"abcabc\"",
  ],
  status: "available",
};
