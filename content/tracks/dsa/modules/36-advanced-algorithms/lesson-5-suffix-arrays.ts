import type { Lesson } from "@/content/types";

export const suffixArraysLesson: Lesson = {
  id: "dsa-advanced-algorithms-suffix-arrays",
  slug: "suffix-arrays",
  moduleSlug: "advanced-algorithms",
  title: "Suffix Arrays and the Problems They Trivialise",
  summary:
    "Sort every suffix, keep the start positions, and record how much each shares with its neighbour. Distinct substrings and the longest repeated substring fall out of one sum and one maximum. Measured: Kasai's LCP computation costs 3,999 comparisons on 4,000 repeated letters, against 7,998,000 comparing neighbours directly.",
  estimatedMinutes: 40,
  status: "available",
  objectives: [
    "Build a suffix array by prefix doubling",
    "Compute the LCP array in linear time with Kasai's algorithm",
    "Answer distinct-substring and longest-repeat questions from the two arrays",
    "Search for a pattern and find a longest common substring with them",
  ],
  sections: [
    {
      id: "the-array",
      heading: "The suffix array and the LCP array",
      body: [
        "The **suffix array** of a string lists the starting positions of all its suffixes in sorted order. For `banana` the suffixes sorted are `a`, `ana`, `anana`, `banana`, `na`, `nana`, so the array is `5 3 1 0 4 2`.",
        "The **LCP array** records, for each suffix in sorted order, the length of the longest common prefix with the suffix before it: `0 1 3 0 0 2` for `banana`. `anana` shares `ana` with `ana`, so its entry is 3.",
        "Sorting puts every group of suffixes that share a prefix next to each other. That adjacency is what makes the two arrays powerful: questions about all substrings become questions about neighbours.",
      ],
    },
    {
      id: "building",
      heading: "Building both arrays",
      body: [
        "**Prefix doubling.** Sorting suffixes by direct comparison costs up to `n` per comparison. Instead, rank suffixes by their first character, then by their first 2, 4, 8 characters. A suffix's first `2k` characters are its first `k` followed by the first `k` of the suffix `k` positions later, so each round sorts pairs of ranks from the previous round. The process stops as soon as every suffix has a distinct rank, after at most `log2 n` rounds. With a comparison sort this is `O(n log^2 n)`; with radix sort on the rank pairs, `O(n log n)`. Linear-time constructions such as SA-IS exist and are what libraries use.",
        "**Kasai's LCP algorithm.** Process suffixes in text order, not sorted order. If the suffix starting at `i` shares `h` characters with its sorted predecessor, then the suffix starting at `i + 1` shares at least `h - 1` with its own predecessor, because dropping the first character of both keeps them adjacent-or-closer in order. So `h` decreases by at most one per step and only increases through comparisons, which bounds the total at under `2n`.",
      ],
      examples: [
        {
          id: "suffix-array-and-kasai",
          title: "Doubling construction, Kasai's LCP, and two questions answered from them",
          lang: "python",
          code: `# A suffix array is every suffix of a string, sorted, stored as start
# positions. Built by doubling, checked against sorting the suffixes
# directly, and then used with its LCP array to answer two questions that
# are hard without it.

work = [0]


def suffix_array(s):
    # after the round with step k, suffixes are ordered by their first 2k
    # characters; rank records that order, with ties sharing a rank
    n = len(s)
    order = list(range(n))
    rank = [ord(ch) for ch in s]
    k = 1
    rounds = 0
    while True:
        rounds += 1
        key = [(rank[i], rank[i + k] if i + k < n else -1) for i in range(n)]
        order.sort(key=lambda i: key[i])
        fresh = [0] * n
        for j in range(1, n):
            fresh[order[j]] = fresh[order[j - 1]] + (1 if key[order[j]] != key[order[j - 1]] else 0)
        rank = fresh
        if rank[order[n - 1]] == n - 1:     # every suffix has its own rank
            return order, rounds
        k *= 2


def lcp_naive(s, sa):
    # longest common prefix of each suffix with the one before it
    lcp = [0] * len(s)
    for j in range(1, len(s)):
        a = sa[j - 1]
        b = sa[j]
        h = 0
        while a + h < len(s) and b + h < len(s):
            work[0] += 1
            if s[a + h] != s[b + h]:
                break
            h += 1
        lcp[j] = h
    return lcp


def lcp_kasai(s, sa):
    # visit suffixes in text order: the LCP can drop by at most one per step
    n = len(s)
    where = [0] * n
    for j in range(n):
        where[sa[j]] = j
    lcp = [0] * n
    h = 0
    for i in range(n):
        if where[i] == 0:
            h = 0
            continue
        other = sa[where[i] - 1]
        while i + h < n and other + h < n:
            work[0] += 1
            if s[i + h] != s[other + h]:
                break
            h += 1
        lcp[where[i]] = h
        if h > 0:
            h -= 1
    return lcp


# The same linear congruential generator in every language, so the strings
# below are the same strings whichever translation is run.
seed = 92300011


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_string(length, alphabet):
    out = ""
    for _ in range(length):
        out += chr(97 + rand(alphabet))
    return out


word = "banana"
sa, _ = suffix_array(word)
lcp = lcp_kasai(word, sa)
print("suffixes of %s in sorted order" % word)
print()
print("  start  lcp  suffix")
for j in range(len(word)):
    print("%7d %4d  %s" % (sa[j], lcp[j], word[sa[j]:]))
print()

checks = [0, 0, 0, 0]
for _ in range(500):
    s = random_string(1 + rand(30), 3)
    sa, _ = suffix_array(s)
    if sa == sorted(range(len(s)), key=lambda i: s[i:]):
        checks[0] += 1
    kasai = lcp_kasai(s, sa)
    if kasai == lcp_naive(s, sa):
        checks[1] += 1
    distinct = len(s) * (len(s) + 1) // 2 - sum(kasai)
    every = {}
    longest_repeat = 0
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            piece = s[i:j]
            if piece in every:
                longest_repeat = max(longest_repeat, j - i)
            every[piece] = True
    if distinct == len(every):
        checks[2] += 1
    if max(kasai) == longest_repeat:
        checks[3] += 1
print("500 random strings of up to 30 letters from a-c")
print("  suffix array equal to sorting the suffixes directly  %d" % checks[0])
print("  kasai lcp equal to comparing neighbours directly     %d" % checks[1])
print("  distinct substrings = n(n+1)/2 - sum of lcp          %d" % checks[2])
print("  longest repeated substring = largest lcp             %d" % checks[3])
print()
print("      length   doubling rounds   lcp by comparing   lcp by kasai   text")
for length in [1000, 2000, 4000]:
    for name, s in [["random, 2 letters", random_string(length, 2)],
                    ["all one letter", "a" * length]]:
        sa, rounds = suffix_array(s)
        work[0] = 0
        lcp_naive(s, sa)
        slow = work[0]
        work[0] = 0
        lcp_kasai(s, sa)
        print("%12d %17d %18d %14d   %s" % (length, rounds, slow, work[0], name))
`,
          output: `suffixes of banana in sorted order

  start  lcp  suffix
      5    0  a
      3    1  ana
      1    3  anana
      0    0  banana
      4    0  na
      2    2  nana

500 random strings of up to 30 letters from a-c
  suffix array equal to sorting the suffixes directly  500
  kasai lcp equal to comparing neighbours directly     500
  distinct substrings = n(n+1)/2 - sum of lcp          500
  longest repeated substring = largest lcp             500

      length   doubling rounds   lcp by comparing   lcp by kasai   text
        1000                 5               9723           1984   random, 2 letters
        1000                10             499500            999   all one letter
        2000                 5              21669           3983   random, 2 letters
        2000                11            1999000           1999   all one letter
        4000                 5              47257           7984   random, 2 letters
        4000                12            7998000           3999   all one letter`,
          explanation:
            "Across 500 random strings the doubling construction equalled a direct sort of the suffixes, Kasai's LCP equalled comparing neighbours directly, the distinct-substring formula equalled a set of all substrings, and the largest LCP equalled the longest repeated substring \u2014 500 of 500 each. Doubling needed 5 rounds on random text and 10 to 12 on one repeated letter, where every rank stays tied until the prefixes cover the whole string. Kasai spent 3,999 comparisons on 4,000 repeated letters; comparing neighbours directly spent 7,998,000.",
          alternates: [
            {
              lang: "javascript",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

let work = 0;

function suffixArray(s) {
  // after the round with step k, suffixes are ordered by their first 2k
  // characters; rank records that order, with ties sharing a rank
  const n = s.length;
  const order = [];
  for (let i = 0; i < n; i++) order.push(i);
  let rank = [];
  for (let i = 0; i < n; i++) rank.push(s.charCodeAt(i));
  let k = 1;
  let rounds = 0;
  for (;;) {
    rounds += 1;
    const first = rank.slice();
    const second = [];
    for (let i = 0; i < n; i++) second.push(i + k < n ? rank[i + k] : -1);
    order.sort((a, b) => (first[a] !== first[b] ? first[a] - first[b] : second[a] - second[b]));
    const fresh = new Array(n).fill(0);
    for (let j = 1; j < n; j++) {
      const a = order[j - 1];
      const b = order[j];
      const differs = first[a] !== first[b] || second[a] !== second[b];
      fresh[b] = fresh[a] + (differs ? 1 : 0);
    }
    rank = fresh;
    if (rank[order[n - 1]] === n - 1) return [order, rounds]; // every suffix has its own rank
    k *= 2;
  }
}

function lcpNaive(s, sa) {
  // longest common prefix of each suffix with the one before it
  const lcp = new Array(s.length).fill(0);
  for (let j = 1; j < s.length; j++) {
    const a = sa[j - 1];
    const b = sa[j];
    let h = 0;
    while (a + h < s.length && b + h < s.length) {
      work += 1;
      if (s[a + h] !== s[b + h]) break;
      h += 1;
    }
    lcp[j] = h;
  }
  return lcp;
}

function lcpKasai(s, sa) {
  // visit suffixes in text order: the LCP can drop by at most one per step
  const n = s.length;
  const where = new Array(n).fill(0);
  for (let j = 0; j < n; j++) where[sa[j]] = j;
  const lcp = new Array(n).fill(0);
  let h = 0;
  for (let i = 0; i < n; i++) {
    if (where[i] === 0) {
      h = 0;
      continue;
    }
    const other = sa[where[i] - 1];
    while (i + h < n && other + h < n) {
      work += 1;
      if (s[i + h] !== s[other + h]) break;
      h += 1;
    }
    lcp[where[i]] = h;
    if (h > 0) h -= 1;
  }
  return lcp;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 92300011n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomString(length, alphabet) {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(97 + rand(alphabet));
  return out;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const word = "banana";
const [wordSa] = suffixArray(word);
const wordLcp = lcpKasai(word, wordSa);
console.log("suffixes of " + word + " in sorted order");
console.log();
console.log("  start  lcp  suffix");
for (let j = 0; j < word.length; j++) {
  console.log(padLeft(wordSa[j], 7) + " " + padLeft(wordLcp[j], 4) + "  " + word.slice(wordSa[j]));
}
console.log();

const checks = [0, 0, 0, 0];
for (let t = 0; t < 500; t++) {
  const s = randomString(1 + rand(30), 3);
  const [sa] = suffixArray(s);
  const direct = [];
  for (let i = 0; i < s.length; i++) direct.push(i);
  direct.sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));
  if (sa.join(",") === direct.join(",")) checks[0] += 1;
  const kasai = lcpKasai(s, sa);
  if (kasai.join(",") === lcpNaive(s, sa).join(",")) checks[1] += 1;
  let sum = 0;
  for (const v of kasai) sum += v;
  const distinct = (s.length * (s.length + 1)) / 2 - sum;
  const every = new Set();
  let longestRepeat = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const piece = s.slice(i, j);
      if (every.has(piece)) longestRepeat = Math.max(longestRepeat, j - i);
      every.add(piece);
    }
  }
  if (distinct === every.size) checks[2] += 1;
  if (Math.max(...kasai) === longestRepeat) checks[3] += 1;
}
console.log("500 random strings of up to 30 letters from a-c");
console.log("  suffix array equal to sorting the suffixes directly  " + checks[0]);
console.log("  kasai lcp equal to comparing neighbours directly     " + checks[1]);
console.log("  distinct substrings = n(n+1)/2 - sum of lcp          " + checks[2]);
console.log("  longest repeated substring = largest lcp             " + checks[3]);
console.log();
console.log("      length   doubling rounds   lcp by comparing   lcp by kasai   text");
for (const length of [1000, 2000, 4000]) {
  const inputs = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    const [sa, rounds] = suffixArray(s);
    work = 0;
    lcpNaive(s, sa);
    const slow = work;
    work = 0;
    lcpKasai(s, sa);
    console.log(
      padLeft(length, 12) + " " + padLeft(rounds, 17) + " " + padLeft(slow, 18) + " " +
        padLeft(work, 14) + "   " + name,
    );
  }
}
`,
            },
            {
              lang: "typescript",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

let work = 0;

function suffixArray(s: string): [number[], number] {
  // after the round with step k, suffixes are ordered by their first 2k
  // characters; rank records that order, with ties sharing a rank
  const n = s.length;
  const order: number[] = [];
  for (let i = 0; i < n; i++) order.push(i);
  let rank: number[] = [];
  for (let i = 0; i < n; i++) rank.push(s.charCodeAt(i));
  let k = 1;
  let rounds = 0;
  for (;;) {
    rounds += 1;
    const first = rank.slice();
    const second: number[] = [];
    for (let i = 0; i < n; i++) second.push(i + k < n ? rank[i + k] : -1);
    order.sort((a, b) => (first[a] !== first[b] ? first[a] - first[b] : second[a] - second[b]));
    const fresh = new Array(n).fill(0);
    for (let j = 1; j < n; j++) {
      const a = order[j - 1];
      const b = order[j];
      const differs = first[a] !== first[b] || second[a] !== second[b];
      fresh[b] = fresh[a] + (differs ? 1 : 0);
    }
    rank = fresh;
    if (rank[order[n - 1]] === n - 1) return [order, rounds]; // every suffix has its own rank
    k *= 2;
  }
}

function lcpNaive(s: string, sa: number[]): number[] {
  // longest common prefix of each suffix with the one before it
  const lcp = new Array(s.length).fill(0);
  for (let j = 1; j < s.length; j++) {
    const a = sa[j - 1];
    const b = sa[j];
    let h = 0;
    while (a + h < s.length && b + h < s.length) {
      work += 1;
      if (s[a + h] !== s[b + h]) break;
      h += 1;
    }
    lcp[j] = h;
  }
  return lcp;
}

function lcpKasai(s: string, sa: number[]): number[] {
  // visit suffixes in text order: the LCP can drop by at most one per step
  const n = s.length;
  const where = new Array(n).fill(0);
  for (let j = 0; j < n; j++) where[sa[j]] = j;
  const lcp = new Array(n).fill(0);
  let h = 0;
  for (let i = 0; i < n; i++) {
    if (where[i] === 0) {
      h = 0;
      continue;
    }
    const other = sa[where[i] - 1];
    while (i + h < n && other + h < n) {
      work += 1;
      if (s[i + h] !== s[other + h]) break;
      h += 1;
    }
    lcp[where[i]] = h;
    if (h > 0) h -= 1;
  }
  return lcp;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 92300011n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomString(length: number, alphabet: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(97 + rand(alphabet));
  return out;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const word = "banana";
const [wordSa] = suffixArray(word);
const wordLcp = lcpKasai(word, wordSa);
console.log("suffixes of " + word + " in sorted order");
console.log();
console.log("  start  lcp  suffix");
for (let j = 0; j < word.length; j++) {
  console.log(padLeft(wordSa[j], 7) + " " + padLeft(wordLcp[j], 4) + "  " + word.slice(wordSa[j]));
}
console.log();

const checks = [0, 0, 0, 0];
for (let t = 0; t < 500; t++) {
  const s = randomString(1 + rand(30), 3);
  const [sa] = suffixArray(s);
  const direct: number[] = [];
  for (let i = 0; i < s.length; i++) direct.push(i);
  direct.sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));
  if (sa.join(",") === direct.join(",")) checks[0] += 1;
  const kasai = lcpKasai(s, sa);
  if (kasai.join(",") === lcpNaive(s, sa).join(",")) checks[1] += 1;
  let sum = 0;
  for (const v of kasai) sum += v;
  const distinct = (s.length * (s.length + 1)) / 2 - sum;
  const every = new Set<string>();
  let longestRepeat = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const piece = s.slice(i, j);
      if (every.has(piece)) longestRepeat = Math.max(longestRepeat, j - i);
      every.add(piece);
    }
  }
  if (distinct === every.size) checks[2] += 1;
  if (Math.max(...kasai) === longestRepeat) checks[3] += 1;
}
console.log("500 random strings of up to 30 letters from a-c");
console.log("  suffix array equal to sorting the suffixes directly  " + checks[0]);
console.log("  kasai lcp equal to comparing neighbours directly     " + checks[1]);
console.log("  distinct substrings = n(n+1)/2 - sum of lcp          " + checks[2]);
console.log("  longest repeated substring = largest lcp             " + checks[3]);
console.log();
console.log("      length   doubling rounds   lcp by comparing   lcp by kasai   text");
for (const length of [1000, 2000, 4000]) {
  const inputs: Array<[string, string]> = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    const [sa, rounds] = suffixArray(s);
    work = 0;
    lcpNaive(s, sa);
    const slow = work;
    work = 0;
    lcpKasai(s, sa);
    console.log(
      padLeft(length, 12) + " " + padLeft(rounds, 17) + " " + padLeft(slow, 18) + " " +
        padLeft(work, 14) + "   " + name,
    );
  }
}
`,
            },
            {
              lang: "java",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class Main {
  static long work = 0;
  static int lastRounds = 0;

  static int[] suffixArray(String s) {
    // after the round with step k, suffixes are ordered by their first 2k
    // characters; rank records that order, with ties sharing a rank
    int n = s.length();
    Integer[] order = new Integer[n];
    int[] rank = new int[n];
    for (int i = 0; i < n; i++) {
      order[i] = i;
      rank[i] = s.charAt(i);
    }
    int k = 1;
    int rounds = 0;
    while (true) {
      rounds += 1;
      final int[] first = rank.clone();
      final int[] second = new int[n];
      for (int i = 0; i < n; i++) {
        second[i] = i + k < n ? rank[i + k] : -1;
      }
      Arrays.sort(order, (a, b) -> first[a] != first[b]
          ? Integer.compare(first[a], first[b]) : Integer.compare(second[a], second[b]));
      int[] fresh = new int[n];
      for (int j = 1; j < n; j++) {
        int a = order[j - 1];
        int b = order[j];
        boolean differs = first[a] != first[b] || second[a] != second[b];
        fresh[b] = fresh[a] + (differs ? 1 : 0);
      }
      rank = fresh;
      if (rank[order[n - 1]] == n - 1) { // every suffix has its own rank
        lastRounds = rounds;
        int[] out = new int[n];
        for (int i = 0; i < n; i++) {
          out[i] = order[i];
        }
        return out;
      }
      k *= 2;
    }
  }

  static int[] lcpNaive(String s, int[] sa) {
    // longest common prefix of each suffix with the one before it
    int[] lcp = new int[s.length()];
    for (int j = 1; j < s.length(); j++) {
      int a = sa[j - 1];
      int b = sa[j];
      int h = 0;
      while (a + h < s.length() && b + h < s.length()) {
        work += 1;
        if (s.charAt(a + h) != s.charAt(b + h)) {
          break;
        }
        h += 1;
      }
      lcp[j] = h;
    }
    return lcp;
  }

  static int[] lcpKasai(String s, int[] sa) {
    // visit suffixes in text order: the LCP can drop by at most one per step
    int n = s.length();
    int[] where = new int[n];
    for (int j = 0; j < n; j++) {
      where[sa[j]] = j;
    }
    int[] lcp = new int[n];
    int h = 0;
    for (int i = 0; i < n; i++) {
      if (where[i] == 0) {
        h = 0;
        continue;
      }
      int other = sa[where[i] - 1];
      while (i + h < n && other + h < n) {
        work += 1;
        if (s.charAt(i + h) != s.charAt(other + h)) {
          break;
        }
        h += 1;
      }
      lcp[where[i]] = h;
      if (h > 0) {
        h -= 1;
      }
    }
    return lcp;
  }

  // The same linear congruential generator in every language, so the strings
  // below are the same strings whichever translation is run.
  static long seed = 92300011L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static String randomString(int length, int alphabet) {
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < length; i++) {
      out.append((char) (97 + rand(alphabet)));
    }
    return out.toString();
  }

  public static void main(String[] args) {
    String word = "banana";
    int[] wordSa = suffixArray(word);
    int[] wordLcp = lcpKasai(word, wordSa);
    System.out.println("suffixes of " + word + " in sorted order");
    System.out.println();
    System.out.println("  start  lcp  suffix");
    for (int j = 0; j < word.length(); j++) {
      System.out.printf("%7d %4d  %s%n", wordSa[j], wordLcp[j], word.substring(wordSa[j]));
    }
    System.out.println();

    int[] checks = new int[4];
    for (int t = 0; t < 500; t++) {
      final String s = randomString(1 + rand(30), 3);
      int[] sa = suffixArray(s);
      Integer[] direct = new Integer[s.length()];
      for (int i = 0; i < s.length(); i++) {
        direct[i] = i;
      }
      Arrays.sort(direct, (a, b) -> s.substring(a).compareTo(s.substring(b)));
      boolean same = true;
      for (int i = 0; i < s.length(); i++) {
        if (direct[i] != sa[i]) {
          same = false;
        }
      }
      if (same) {
        checks[0] += 1;
      }
      int[] kasai = lcpKasai(s, sa);
      if (Arrays.equals(kasai, lcpNaive(s, sa))) {
        checks[1] += 1;
      }
      int sum = 0;
      int largest = 0;
      for (int v : kasai) {
        sum += v;
        largest = Math.max(largest, v);
      }
      int distinct = s.length() * (s.length() + 1) / 2 - sum;
      Set<String> every = new HashSet<>();
      int longestRepeat = 0;
      for (int i = 0; i < s.length(); i++) {
        for (int j = i + 1; j <= s.length(); j++) {
          String piece = s.substring(i, j);
          if (every.contains(piece)) {
            longestRepeat = Math.max(longestRepeat, j - i);
          }
          every.add(piece);
        }
      }
      if (distinct == every.size()) {
        checks[2] += 1;
      }
      if (largest == longestRepeat) {
        checks[3] += 1;
      }
    }
    System.out.println("500 random strings of up to 30 letters from a-c");
    System.out.println("  suffix array equal to sorting the suffixes directly  " + checks[0]);
    System.out.println("  kasai lcp equal to comparing neighbours directly     " + checks[1]);
    System.out.println("  distinct substrings = n(n+1)/2 - sum of lcp          " + checks[2]);
    System.out.println("  longest repeated substring = largest lcp             " + checks[3]);
    System.out.println();
    System.out.println("      length   doubling rounds   lcp by comparing   lcp by kasai   text");
    int[] lengths = {1000, 2000, 4000};
    for (int length : lengths) {
      String[][] inputs = {
        {"random, 2 letters", randomString(length, 2)},
        {"all one letter", "a".repeat(length)},
      };
      for (String[] input : inputs) {
        int[] sa = suffixArray(input[1]);
        work = 0;
        lcpNaive(input[1], sa);
        long slow = work;
        work = 0;
        lcpKasai(input[1], sa);
        System.out.printf("%12d %17d %18d %14d   %s%n", length, lastRounds, slow, work, input[0]);
      }
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

#include <algorithm>
#include <cstdio>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

long long work = 0;

std::pair<std::vector<int>, int> suffixArray(const std::string& s) {
  // after the round with step k, suffixes are ordered by their first 2k
  // characters; rank records that order, with ties sharing a rank
  int n = (int)s.size();
  std::vector<int> order(n);
  std::vector<int> rank(n);
  for (int i = 0; i < n; i++) {
    order[i] = i;
    rank[i] = (unsigned char)s[i];
  }
  int k = 1;
  int rounds = 0;
  while (true) {
    rounds += 1;
    std::vector<int> first = rank;
    std::vector<int> second(n);
    for (int i = 0; i < n; i++) {
      second[i] = i + k < n ? rank[i + k] : -1;
    }
    std::sort(order.begin(), order.end(), [&](int a, int b) {
      return first[a] != first[b] ? first[a] < first[b] : second[a] < second[b];
    });
    std::vector<int> fresh(n, 0);
    for (int j = 1; j < n; j++) {
      int a = order[j - 1];
      int b = order[j];
      bool differs = first[a] != first[b] || second[a] != second[b];
      fresh[b] = fresh[a] + (differs ? 1 : 0);
    }
    rank = fresh;
    if (rank[order[n - 1]] == n - 1) {  // every suffix has its own rank
      return std::make_pair(order, rounds);
    }
    k *= 2;
  }
}

std::vector<int> lcpNaive(const std::string& s, const std::vector<int>& sa) {
  // longest common prefix of each suffix with the one before it
  int n = (int)s.size();
  std::vector<int> lcp(n, 0);
  for (int j = 1; j < n; j++) {
    int a = sa[j - 1];
    int b = sa[j];
    int h = 0;
    while (a + h < n && b + h < n) {
      work += 1;
      if (s[a + h] != s[b + h]) {
        break;
      }
      h += 1;
    }
    lcp[j] = h;
  }
  return lcp;
}

std::vector<int> lcpKasai(const std::string& s, const std::vector<int>& sa) {
  // visit suffixes in text order: the LCP can drop by at most one per step
  int n = (int)s.size();
  std::vector<int> where(n, 0);
  for (int j = 0; j < n; j++) {
    where[sa[j]] = j;
  }
  std::vector<int> lcp(n, 0);
  int h = 0;
  for (int i = 0; i < n; i++) {
    if (where[i] == 0) {
      h = 0;
      continue;
    }
    int other = sa[where[i] - 1];
    while (i + h < n && other + h < n) {
      work += 1;
      if (s[i + h] != s[other + h]) {
        break;
      }
      h += 1;
    }
    lcp[where[i]] = h;
    if (h > 0) {
      h -= 1;
    }
  }
  return lcp;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
long long seed = 92300011LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

std::string randomString(int length, int alphabet) {
  std::string out;
  for (int i = 0; i < length; i++) {
    out += (char)(97 + rand_below(alphabet));
  }
  return out;
}

int main() {
  std::string word = "banana";
  std::vector<int> wordSa = suffixArray(word).first;
  std::vector<int> wordLcp = lcpKasai(word, wordSa);
  std::printf("suffixes of %s in sorted order\\n", word.c_str());
  std::printf("\\n");
  std::printf("  start  lcp  suffix\\n");
  for (size_t j = 0; j < word.size(); j++) {
    std::printf("%7d %4d  %s\\n", wordSa[j], wordLcp[j], word.substr(wordSa[j]).c_str());
  }
  std::printf("\\n");

  int checks[4] = {0, 0, 0, 0};
  for (int t = 0; t < 500; t++) {
    int length = 1 + rand_below(30);
    std::string s = randomString(length, 3);
    std::vector<int> sa = suffixArray(s).first;
    std::vector<int> direct(s.size());
    for (size_t i = 0; i < s.size(); i++) {
      direct[i] = (int)i;
    }
    std::sort(direct.begin(), direct.end(),
              [&](int a, int b) { return s.substr(a) < s.substr(b); });
    if (direct == sa) {
      checks[0] += 1;
    }
    std::vector<int> kasai = lcpKasai(s, sa);
    if (kasai == lcpNaive(s, sa)) {
      checks[1] += 1;
    }
    int sum = 0;
    int largest = 0;
    for (int v : kasai) {
      sum += v;
      largest = std::max(largest, v);
    }
    int n = (int)s.size();
    int distinct = n * (n + 1) / 2 - sum;
    std::unordered_set<std::string> every;
    int longestRepeat = 0;
    for (int i = 0; i < n; i++) {
      for (int j = i + 1; j <= n; j++) {
        std::string piece = s.substr(i, j - i);
        if (every.count(piece) > 0) {
          longestRepeat = std::max(longestRepeat, j - i);
        }
        every.insert(piece);
      }
    }
    if (distinct == (int)every.size()) {
      checks[2] += 1;
    }
    if (largest == longestRepeat) {
      checks[3] += 1;
    }
  }
  std::printf("500 random strings of up to 30 letters from a-c\\n");
  std::printf("  suffix array equal to sorting the suffixes directly  %d\\n", checks[0]);
  std::printf("  kasai lcp equal to comparing neighbours directly     %d\\n", checks[1]);
  std::printf("  distinct substrings = n(n+1)/2 - sum of lcp          %d\\n", checks[2]);
  std::printf("  longest repeated substring = largest lcp             %d\\n", checks[3]);
  std::printf("\\n");
  std::printf("      length   doubling rounds   lcp by comparing   lcp by kasai   text\\n");
  int lengths[3] = {1000, 2000, 4000};
  for (int length : lengths) {
    std::string random = randomString(length, 2);
    std::vector<std::pair<std::string, std::string> > inputs = {
        {"random, 2 letters", random},
        {"all one letter", std::string(length, 'a')},
    };
    for (const std::pair<std::string, std::string>& input : inputs) {
      std::pair<std::vector<int>, int> built = suffixArray(input.second);
      work = 0;
      lcpNaive(input.second, built.first);
      long long slow = work;
      work = 0;
      lcpKasai(input.second, built.first);
      std::printf("%12d %17d %18lld %14lld   %s\\n", length, built.second, slow, work,
                  input.first.c_str());
    }
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

use std::collections::HashSet;

static mut WORK: i64 = 0;

fn tick() {
    unsafe {
        WORK += 1;
    }
}

fn take_work() -> i64 {
    unsafe {
        let spent = WORK;
        WORK = 0;
        spent
    }
}

fn suffix_array(s: &[u8]) -> (Vec<usize>, usize) {
    // after the round with step k, suffixes are ordered by their first 2k
    // characters; rank records that order, with ties sharing a rank
    let n = s.len();
    let mut order: Vec<usize> = (0..n).collect();
    let mut rank: Vec<i64> = s.iter().map(|&c| c as i64).collect();
    let mut k = 1;
    let mut rounds = 0;
    loop {
        rounds += 1;
        let key: Vec<(i64, i64)> = (0..n)
            .map(|i| (rank[i], if i + k < n { rank[i + k] } else { -1 }))
            .collect();
        order.sort_by(|&a, &b| key[a].cmp(&key[b]));
        let mut fresh = vec![0i64; n];
        for j in 1..n {
            let differs = key[order[j]] != key[order[j - 1]];
            fresh[order[j]] = fresh[order[j - 1]] + if differs { 1 } else { 0 };
        }
        rank = fresh;
        if rank[order[n - 1]] == n as i64 - 1 {
            // every suffix has its own rank
            return (order, rounds);
        }
        k *= 2;
    }
}

fn lcp_naive(s: &[u8], sa: &[usize]) -> Vec<usize> {
    // longest common prefix of each suffix with the one before it
    let n = s.len();
    let mut lcp = vec![0; n];
    for j in 1..n {
        let a = sa[j - 1];
        let b = sa[j];
        let mut h = 0;
        while a + h < n && b + h < n {
            tick();
            if s[a + h] != s[b + h] {
                break;
            }
            h += 1;
        }
        lcp[j] = h;
    }
    lcp
}

fn lcp_kasai(s: &[u8], sa: &[usize]) -> Vec<usize> {
    // visit suffixes in text order: the LCP can drop by at most one per step
    let n = s.len();
    let mut place = vec![0; n];
    for j in 0..n {
        place[sa[j]] = j;
    }
    let mut lcp = vec![0; n];
    let mut h = 0;
    for i in 0..n {
        if place[i] == 0 {
            h = 0;
            continue;
        }
        let other = sa[place[i] - 1];
        while i + h < n && other + h < n {
            tick();
            if s[i + h] != s[other + h] {
                break;
            }
            h += 1;
        }
        lcp[place[i]] = h;
        if h > 0 {
            h -= 1;
        }
    }
    lcp
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
static mut SEED: i64 = 92300011;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn random_string(length: i64, alphabet: i64) -> Vec<u8> {
    (0..length).map(|_| (97 + rand_below(alphabet)) as u8).collect()
}

fn main() {
    let word = b"banana";
    let (word_sa, _) = suffix_array(word);
    let word_lcp = lcp_kasai(word, &word_sa);
    println!("suffixes of banana in sorted order");
    println!();
    println!("  start  lcp  suffix");
    for j in 0..word.len() {
        let suffix = String::from_utf8(word[word_sa[j]..].to_vec()).unwrap();
        println!("{:>7} {:>4}  {}", word_sa[j], word_lcp[j], suffix);
    }
    println!();

    let mut checks = [0; 4];
    for _ in 0..500 {
        let length = 1 + rand_below(30);
        let s = random_string(length, 3);
        let (sa, _) = suffix_array(&s);
        let mut direct: Vec<usize> = (0..s.len()).collect();
        direct.sort_by(|&a, &b| s[a..].cmp(&s[b..]));
        if direct == sa {
            checks[0] += 1;
        }
        let kasai = lcp_kasai(&s, &sa);
        if kasai == lcp_naive(&s, &sa) {
            checks[1] += 1;
        }
        let n = s.len();
        let distinct = n * (n + 1) / 2 - kasai.iter().sum::<usize>();
        let mut every: HashSet<&[u8]> = HashSet::new();
        let mut longest_repeat = 0;
        for i in 0..n {
            for j in i + 1..=n {
                let piece = &s[i..j];
                if every.contains(piece) {
                    longest_repeat = longest_repeat.max(j - i);
                }
                every.insert(piece);
            }
        }
        if distinct == every.len() {
            checks[2] += 1;
        }
        if *kasai.iter().max().unwrap() == longest_repeat {
            checks[3] += 1;
        }
    }
    take_work();
    println!("500 random strings of up to 30 letters from a-c");
    println!("  suffix array equal to sorting the suffixes directly  {}", checks[0]);
    println!("  kasai lcp equal to comparing neighbours directly     {}", checks[1]);
    println!("  distinct substrings = n(n+1)/2 - sum of lcp          {}", checks[2]);
    println!("  longest repeated substring = largest lcp             {}", checks[3]);
    println!();
    println!("      length   doubling rounds   lcp by comparing   lcp by kasai   text");
    for &length in [1000i64, 2000, 4000].iter() {
        let inputs: Vec<(&str, Vec<u8>)> = vec![
            ("random, 2 letters", random_string(length, 2)),
            ("all one letter", vec![b'a'; length as usize]),
        ];
        for (name, s) in inputs.iter() {
            let (sa, rounds) = suffix_array(s);
            take_work();
            lcp_naive(s, &sa);
            let slow = take_work();
            lcp_kasai(s, &sa);
            let fast = take_work();
            println!("{:>12} {:>17} {:>18} {:>14}   {}", length, rounds, slow, fast, name);
        }
    }
}
`,
            },
            {
              lang: "go",
              code: `// A suffix array is every suffix of a string, sorted, stored as start
// positions. Built by doubling, checked against sorting the suffixes
// directly, and then used with its LCP array to answer two questions that
// are hard without it.

package main

import (
	"fmt"
	"sort"
	"strings"
)

var work int64

func suffixArray(s string) ([]int, int) {
	// after the round with step k, suffixes are ordered by their first 2k
	// characters; rank records that order, with ties sharing a rank
	n := len(s)
	order := make([]int, n)
	rank := make([]int, n)
	for i := 0; i < n; i++ {
		order[i] = i
		rank[i] = int(s[i])
	}
	rounds := 0
	for k := 1; ; k *= 2 {
		rounds++
		first := append([]int{}, rank...)
		second := make([]int, n)
		for i := 0; i < n; i++ {
			if i+k < n {
				second[i] = rank[i+k]
			} else {
				second[i] = -1
			}
		}
		sort.Slice(order, func(x, y int) bool {
			a, b := order[x], order[y]
			if first[a] != first[b] {
				return first[a] < first[b]
			}
			return second[a] < second[b]
		})
		fresh := make([]int, n)
		for j := 1; j < n; j++ {
			a, b := order[j-1], order[j]
			fresh[b] = fresh[a]
			if first[a] != first[b] || second[a] != second[b] {
				fresh[b]++
			}
		}
		rank = fresh
		if rank[order[n-1]] == n-1 { // every suffix has its own rank
			return order, rounds
		}
	}
}

func lcpNaive(s string, sa []int) []int {
	// longest common prefix of each suffix with the one before it
	lcp := make([]int, len(s))
	for j := 1; j < len(s); j++ {
		a, b := sa[j-1], sa[j]
		h := 0
		for a+h < len(s) && b+h < len(s) {
			work++
			if s[a+h] != s[b+h] {
				break
			}
			h++
		}
		lcp[j] = h
	}
	return lcp
}

func lcpKasai(s string, sa []int) []int {
	// visit suffixes in text order: the LCP can drop by at most one per step
	n := len(s)
	where := make([]int, n)
	for j := 0; j < n; j++ {
		where[sa[j]] = j
	}
	lcp := make([]int, n)
	h := 0
	for i := 0; i < n; i++ {
		if where[i] == 0 {
			h = 0
			continue
		}
		other := sa[where[i]-1]
		for i+h < n && other+h < n {
			work++
			if s[i+h] != s[other+h] {
				break
			}
			h++
		}
		lcp[where[i]] = h
		if h > 0 {
			h--
		}
	}
	return lcp
}

func sameInts(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
var seed int64 = 92300011

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func randomString(length, alphabet int) string {
	out := make([]byte, length)
	for i := range out {
		out[i] = byte(97 + randBelow(alphabet))
	}
	return string(out)
}

func main() {
	word := "banana"
	wordSa, _ := suffixArray(word)
	wordLcp := lcpKasai(word, wordSa)
	fmt.Printf("suffixes of %s in sorted order\\n", word)
	fmt.Println()
	fmt.Println("  start  lcp  suffix")
	for j := range word {
		fmt.Printf("%7d %4d  %s\\n", wordSa[j], wordLcp[j], word[wordSa[j]:])
	}
	fmt.Println()

	checks := [4]int{}
	for t := 0; t < 500; t++ {
		s := randomString(1+randBelow(30), 3)
		sa, _ := suffixArray(s)
		direct := make([]int, len(s))
		for i := range direct {
			direct[i] = i
		}
		sort.Slice(direct, func(x, y int) bool { return s[direct[x]:] < s[direct[y]:] })
		if sameInts(direct, sa) {
			checks[0]++
		}
		kasai := lcpKasai(s, sa)
		if sameInts(kasai, lcpNaive(s, sa)) {
			checks[1]++
		}
		sum := 0
		largest := 0
		for _, v := range kasai {
			sum += v
			largest = max(largest, v)
		}
		n := len(s)
		distinct := n*(n+1)/2 - sum
		every := map[string]bool{}
		longestRepeat := 0
		for i := 0; i < n; i++ {
			for j := i + 1; j <= n; j++ {
				piece := s[i:j]
				if every[piece] {
					longestRepeat = max(longestRepeat, j-i)
				}
				every[piece] = true
			}
		}
		if distinct == len(every) {
			checks[2]++
		}
		if largest == longestRepeat {
			checks[3]++
		}
	}
	fmt.Println("500 random strings of up to 30 letters from a-c")
	fmt.Printf("  suffix array equal to sorting the suffixes directly  %d\\n", checks[0])
	fmt.Printf("  kasai lcp equal to comparing neighbours directly     %d\\n", checks[1])
	fmt.Printf("  distinct substrings = n(n+1)/2 - sum of lcp          %d\\n", checks[2])
	fmt.Printf("  longest repeated substring = largest lcp             %d\\n", checks[3])
	fmt.Println()
	fmt.Println("      length   doubling rounds   lcp by comparing   lcp by kasai   text")
	for _, length := range []int{1000, 2000, 4000} {
		inputs := [][2]string{
			{"random, 2 letters", randomString(length, 2)},
			{"all one letter", strings.Repeat("a", length)},
		}
		for _, input := range inputs {
			sa, rounds := suffixArray(input[1])
			work = 0
			lcpNaive(input[1], sa)
			slow := work
			work = 0
			lcpKasai(input[1], sa)
			fmt.Printf("%12d %17d %18d %14d   %s\\n", length, rounds, slow, work, input[0])
		}
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "what-they-trivialise",
      heading: "What they trivialise",
      body: [
        "**Number of distinct substrings.** Every substring is a prefix of some suffix. A string of length `n` has `n(n+1)/2` suffix prefixes, and each LCP entry counts prefixes a suffix shares with its predecessor \u2014 exactly the ones already counted. So the distinct count is `n(n+1)/2 - sum(LCP)`.",
        "**Longest repeated substring.** A substring occurring twice is a common prefix of two suffixes, and the longest common prefix of any two suffixes is achieved by some adjacent pair in sorted order. So it is `max(LCP)`, starting at the suffix where the maximum occurs.",
        "**Pattern search.** All suffixes beginning with a pattern are contiguous in the array. Two binary searches find the block in `O(m log n)` character comparisons, and the block's size is the number of occurrences.",
        "**Longest common substring of two strings.** Build the suffix array of `a + '#' + b` with a separator in neither. The answer is the largest LCP between adjacent suffixes that start on different sides of the separator.",
        "**Longest substring occurring at least `k` times.** The maximum over every window of `k - 1` consecutive LCP entries of the window's minimum \u2014 a sliding window minimum over the LCP array.",
      ],
      pitfalls: [
        {
          title: "Sorting suffixes by string comparison for large n",
          body: "Each comparison can take n steps, and on repetitive text it does. Doubling or a library construction avoids that.",
        },
        {
          title: "Reading the LCP as relative to the next suffix",
          body: "The convention here, and in most code, is the previous suffix in sorted order, with the first entry 0. Mixing conventions shifts every answer by one position.",
        },
        {
          title: "A separator that sorts inside the alphabet",
          body: "For longest common substring, the separator must not occur in either string, or suffixes can share a prefix across it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a suffix array, and what does the LCP array add?",
      answer:
        "The suffix array lists the starting positions of all suffixes in sorted order -- for banana, 5 3 1 0 4 2. The LCP array gives each sorted suffix's longest common prefix with the one before it -- 0 1 3 0 0 2. Sorting puts suffixes sharing a prefix next to each other, so questions about all substrings become questions about neighbours. Distinct substrings are n(n+1)/2 minus the sum of the LCP array, and the longest repeated substring is its maximum. I checked both against brute force on 500 random strings and all 500 matched.",
    },
    {
      question: "How do you build a suffix array and its LCP array efficiently?",
      answer:
        "Build the suffix array by prefix doubling: rank by first character, then repeatedly sort by pairs of ranks k apart to get order by 2k characters, stopping when all ranks are distinct -- at most log n rounds; I measured 5 rounds on random text and 12 on 4,000 repeated letters. Build LCP with Kasai: process suffixes in text order, since the shared length can drop by at most one from position i to i + 1, which keeps total comparisons under 2n. On 4,000 repeated letters that was 3,999 comparisons, against 7,998,000 comparing neighbours directly.",
    },
  ],
  takeaways: [
    "Suffix array: start positions of the sorted suffixes",
    "LCP array: shared prefix length with the previous sorted suffix",
    "Prefix doubling sorts by rank pairs, at most log n rounds",
    "Kasai visits suffixes in text order; the shared length drops by at most one",
    "Measured on 4,000 repeated letters: Kasai 3,999 comparisons, direct 7,998,000",
    "Distinct substrings = n(n+1)/2 - sum(LCP); longest repeat = max(LCP)",
    "Occurrences of a pattern form one contiguous block, found by binary search",
  ],
};
