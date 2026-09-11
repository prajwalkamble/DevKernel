import type { Lesson } from "@/content/types";

export const manachersAlgorithmLesson: Lesson = {
  id: "dsa-advanced-algorithms-manachers-algorithm",
  slug: "manachers-algorithm",
  moduleSlug: "advanced-algorithms",
  title: "Manacher's Algorithm for Palindromes",
  summary:
    "Every palindromic substring in linear time, by reusing the mirror image of a palindrome already found. Measured on one repeated letter of length 4,000: 8,002,000 comparisons expanding around every centre, 7,999 with Manacher.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Transform a string so odd and even palindromes share one form",
    "Reuse the mirror position's radius inside a known palindrome",
    "Derive the longest palindrome and the palindrome count from the radius array",
    "Say when expanding around centres is already enough",
  ],
  sections: [
    {
      id: "one-form",
      heading: "One form for odd and even palindromes",
      body: [
        "A palindrome of odd length has a character at its centre; one of even length has a gap. Handling both separately doubles the code. Insert a separator between every pair of characters and at both ends: `aba` becomes `#a#b#a#`, `abba` becomes `#a#b#b#a#`. Now every palindrome in the original has a centre character in the transformed string `t`.",
        "Define `radius[i]` as the largest `r` such that `t[i-r..i+r]` is a palindrome. That `r` is exactly the length of the corresponding palindrome in the original string, because the separators and letters alternate.",
        "From the radius array: the **longest palindrome** has length `max(radius)`, and the **number of palindromic substrings** is the sum of `(radius[i] + 1) / 2` over all `i`, since a palindrome of length `r` centred somewhere contains `(r+1)/2` palindromes sharing that centre.",
      ],
    },
    {
      id: "the-mirror",
      heading: "The mirror",
      body: [
        "Keep `centre` and `right`: the palindrome found so far that reaches furthest right, covering `t[2\u00b7centre - right + 1 .. right - 1]`.",
        "For a new `i` inside it, the position `2\u00b7centre - i` is its mirror across the centre. The stretch around the mirror is reflected around `i`, so `radius[i]` is at least `min(right - i, radius[2\u00b7centre - i])` \u2014 capped at the edge, because nothing beyond `right` is known to be reflected.",
        "Start from that value, extend by comparing `t[i - r - 1]` with `t[i + r + 1]`, and if the palindrome at `i` now passes `right`, make `i` the new centre.",
        "**Why it is linear.** Every successful extension moves `right` forward, and `right` never moves back or passes the end of `t`. Each position adds at most one failed comparison.",
      ],
      examples: [
        {
          id: "manacher-against-expanding-centres",
          title: "Manacher and expanding around centres, both checked against brute force",
          lang: "python",
          code: `# Every palindromic substring, found in linear time. Manacher's algorithm
# reuses the mirror image of a palindrome it has already found; expanding
# around every centre reuses nothing. Both are checked against brute force.

work = [0]


def brute_force(s):
    # longest palindrome length and number of palindromic substrings
    longest = 0
    count = 0
    for i in range(len(s)):
        for j in range(i, len(s)):
            piece = s[i:j + 1]
            if piece == piece[::-1]:
                count += 1
                longest = max(longest, j - i + 1)
    return longest, count


def expand_around_centres(s):
    n = len(s)
    longest = 0
    count = 0
    for centre in range(2 * n - 1):
        left = centre // 2
        right = left + centre % 2
        while left >= 0 and right < n:
            work[0] += 1
            if s[left] != s[right]:
                break
            count += 1
            longest = max(longest, right - left + 1)
            left -= 1
            right += 1
    return longest, count


def manacher(s):
    # t puts a separator between characters so even and odd palindromes
    # both have a centre: "aba" becomes "#a#b#a#"
    t = "#" + "#".join(s) + "#"
    radius = [0] * len(t)      # radius[i] = length of the palindrome in s centred at t[i]
    centre = 0
    right = 0                  # the palindrome at centre reaches t[right - 1]
    for i in range(len(t)):
        if i < right:
            radius[i] = min(right - i, radius[2 * centre - i])   # the mirror's answer, capped
        while i - radius[i] - 1 >= 0 and i + radius[i] + 1 < len(t):
            work[0] += 1
            if t[i - radius[i] - 1] != t[i + radius[i] + 1]:
                break
            radius[i] += 1
        if i + radius[i] > right:
            centre = i
            right = i + radius[i]
    longest = 0
    count = 0
    for r in radius:
        longest = max(longest, r)
        count += (r + 1) // 2
    return longest, count


# The same linear congruential generator in every language, so the strings
# below are the same strings whichever translation is run.
seed = 81700061


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_string(length, alphabet):
    out = ""
    for _ in range(length):
        out += chr(97 + rand(alphabet))
    return out


agree = 0
for _ in range(2000):
    s = random_string(1 + rand(20), 2)
    truth = brute_force(s)
    if expand_around_centres(s) == truth and manacher(s) == truth:
        agree += 1
print("longest length and palindrome count matched brute force on %d of 2000 strings" % agree)
print()
print("      length   expand around centres   manacher   text")
for length in [1000, 2000, 4000]:
    for name, s in [["random, 2 letters", random_string(length, 2)],
                    ["all one letter", "a" * length]]:
        work[0] = 0
        expand_around_centres(s)
        slow = work[0]
        work[0] = 0
        manacher(s)
        print("%12d %23d %10d   %s" % (length, slow, work[0], name))
`,
          output: `longest length and palindrome count matched brute force on 2000 of 2000 strings

      length   expand around centres   manacher   text
        1000                    4952       3991   random, 2 letters
        1000                  500500       1999   all one letter
        2000                   10026       7991   random, 2 letters
        2000                 2001000       3999   all one letter
        4000                   20093      15992   random, 2 letters
        4000                 8002000       7999   all one letter`,
          explanation:
            "Both methods matched brute force on the longest length and the palindrome count for 2,000 of 2,000 random strings. On one repeated letter, expanding around every centre costs 500,500 comparisons at length 1,000 and 8,002,000 at 4,000, because every centre expands to the string's edge. Manacher costs 1,999 and 7,999. On random two-letter strings expanding costs 4,952 at length 1,000 against Manacher's 3,991 \u2014 close, because random palindromes are short.",
          alternates: [
            {
              lang: "javascript",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

let work = 0;

function bruteForce(s) {
  // longest palindrome length and number of palindromic substrings
  let longest = 0;
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const piece = s.slice(i, j + 1);
      if (piece === piece.split("").reverse().join("")) {
        count += 1;
        longest = Math.max(longest, j - i + 1);
      }
    }
  }
  return [longest, count];
}

function expandAroundCentres(s) {
  const n = s.length;
  let longest = 0;
  let count = 0;
  for (let centre = 0; centre < 2 * n - 1; centre++) {
    let left = Math.floor(centre / 2);
    let right = left + (centre % 2);
    while (left >= 0 && right < n) {
      work += 1;
      if (s[left] !== s[right]) break;
      count += 1;
      longest = Math.max(longest, right - left + 1);
      left -= 1;
      right += 1;
    }
  }
  return [longest, count];
}

function manacher(s) {
  // t puts a separator between characters so even and odd palindromes
  // both have a centre: "aba" becomes "#a#b#a#"
  const t = "#" + s.split("").join("#") + "#";
  const radius = new Array(t.length).fill(0); // length of the palindrome in s centred at t[i]
  let centre = 0;
  let right = 0; // the palindrome at centre reaches t[right - 1]
  for (let i = 0; i < t.length; i++) {
    if (i < right) radius[i] = Math.min(right - i, radius[2 * centre - i]); // the mirror's answer, capped
    while (i - radius[i] - 1 >= 0 && i + radius[i] + 1 < t.length) {
      work += 1;
      if (t[i - radius[i] - 1] !== t[i + radius[i] + 1]) break;
      radius[i] += 1;
    }
    if (i + radius[i] > right) {
      centre = i;
      right = i + radius[i];
    }
  }
  let longest = 0;
  let count = 0;
  for (const r of radius) {
    longest = Math.max(longest, r);
    count += Math.floor((r + 1) / 2);
  }
  return [longest, count];
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 81700061n;

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

let agree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(20), 2);
  const truth = bruteForce(s).join(",");
  if (expandAroundCentres(s).join(",") === truth && manacher(s).join(",") === truth) agree += 1;
}
console.log(
  "longest length and palindrome count matched brute force on " + agree + " of 2000 strings",
);
console.log();
console.log("      length   expand around centres   manacher   text");
for (const length of [1000, 2000, 4000]) {
  const inputs = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    work = 0;
    expandAroundCentres(s);
    const slow = work;
    work = 0;
    manacher(s);
    console.log(padLeft(length, 12) + " " + padLeft(slow, 23) + " " + padLeft(work, 10) + "   " + name);
  }
}
`,
            },
            {
              lang: "typescript",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

let work = 0;

function bruteForce(s: string): [number, number] {
  // longest palindrome length and number of palindromic substrings
  let longest = 0;
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const piece = s.slice(i, j + 1);
      if (piece === piece.split("").reverse().join("")) {
        count += 1;
        longest = Math.max(longest, j - i + 1);
      }
    }
  }
  return [longest, count];
}

function expandAroundCentres(s: string): [number, number] {
  const n = s.length;
  let longest = 0;
  let count = 0;
  for (let centre = 0; centre < 2 * n - 1; centre++) {
    let left = Math.floor(centre / 2);
    let right = left + (centre % 2);
    while (left >= 0 && right < n) {
      work += 1;
      if (s[left] !== s[right]) break;
      count += 1;
      longest = Math.max(longest, right - left + 1);
      left -= 1;
      right += 1;
    }
  }
  return [longest, count];
}

function manacher(s: string): [number, number] {
  // t puts a separator between characters so even and odd palindromes
  // both have a centre: "aba" becomes "#a#b#a#"
  const t = "#" + s.split("").join("#") + "#";
  const radius = new Array(t.length).fill(0); // length of the palindrome in s centred at t[i]
  let centre = 0;
  let right = 0; // the palindrome at centre reaches t[right - 1]
  for (let i = 0; i < t.length; i++) {
    if (i < right) radius[i] = Math.min(right - i, radius[2 * centre - i]); // the mirror's answer, capped
    while (i - radius[i] - 1 >= 0 && i + radius[i] + 1 < t.length) {
      work += 1;
      if (t[i - radius[i] - 1] !== t[i + radius[i] + 1]) break;
      radius[i] += 1;
    }
    if (i + radius[i] > right) {
      centre = i;
      right = i + radius[i];
    }
  }
  let longest = 0;
  let count = 0;
  for (const r of radius) {
    longest = Math.max(longest, r);
    count += Math.floor((r + 1) / 2);
  }
  return [longest, count];
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 81700061n;

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

let agree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(20), 2);
  const truth = bruteForce(s).join(",");
  if (expandAroundCentres(s).join(",") === truth && manacher(s).join(",") === truth) agree += 1;
}
console.log(
  "longest length and palindrome count matched brute force on " + agree + " of 2000 strings",
);
console.log();
console.log("      length   expand around centres   manacher   text");
for (const length of [1000, 2000, 4000]) {
  const inputs: Array<[string, string]> = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    work = 0;
    expandAroundCentres(s);
    const slow = work;
    work = 0;
    manacher(s);
    console.log(padLeft(length, 12) + " " + padLeft(slow, 23) + " " + padLeft(work, 10) + "   " + name);
  }
}
`,
            },
            {
              lang: "java",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

public class Main {
  static long work = 0;

  static long[] bruteForce(String s) {
    // longest palindrome length and number of palindromic substrings
    long longest = 0;
    long count = 0;
    for (int i = 0; i < s.length(); i++) {
      for (int j = i; j < s.length(); j++) {
        String piece = s.substring(i, j + 1);
        if (piece.equals(new StringBuilder(piece).reverse().toString())) {
          count += 1;
          longest = Math.max(longest, j - i + 1);
        }
      }
    }
    return new long[] {longest, count};
  }

  static long[] expandAroundCentres(String s) {
    int n = s.length();
    long longest = 0;
    long count = 0;
    for (int centre = 0; centre < 2 * n - 1; centre++) {
      int left = centre / 2;
      int right = left + centre % 2;
      while (left >= 0 && right < n) {
        work += 1;
        if (s.charAt(left) != s.charAt(right)) {
          break;
        }
        count += 1;
        longest = Math.max(longest, right - left + 1);
        left -= 1;
        right += 1;
      }
    }
    return new long[] {longest, count};
  }

  static long[] manacher(String s) {
    // t puts a separator between characters so even and odd palindromes
    // both have a centre: "aba" becomes "#a#b#a#"
    StringBuilder built = new StringBuilder("#");
    for (int i = 0; i < s.length(); i++) {
      built.append(s.charAt(i)).append('#');
    }
    String t = built.toString();
    int[] radius = new int[t.length()]; // length of the palindrome in s centred at t[i]
    int centre = 0;
    int right = 0; // the palindrome at centre reaches t[right - 1]
    for (int i = 0; i < t.length(); i++) {
      if (i < right) {
        radius[i] = Math.min(right - i, radius[2 * centre - i]); // the mirror's answer, capped
      }
      while (i - radius[i] - 1 >= 0 && i + radius[i] + 1 < t.length()) {
        work += 1;
        if (t.charAt(i - radius[i] - 1) != t.charAt(i + radius[i] + 1)) {
          break;
        }
        radius[i] += 1;
      }
      if (i + radius[i] > right) {
        centre = i;
        right = i + radius[i];
      }
    }
    long longest = 0;
    long count = 0;
    for (int r : radius) {
      longest = Math.max(longest, r);
      count += (r + 1) / 2;
    }
    return new long[] {longest, count};
  }

  // The same linear congruential generator in every language, so the strings
  // below are the same strings whichever translation is run.
  static long seed = 81700061L;

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
    int agree = 0;
    for (int t = 0; t < 2000; t++) {
      String s = randomString(1 + rand(20), 2);
      long[] truth = bruteForce(s);
      if (java.util.Arrays.equals(expandAroundCentres(s), truth)
          && java.util.Arrays.equals(manacher(s), truth)) {
        agree += 1;
      }
    }
    System.out.printf(
        "longest length and palindrome count matched brute force on %d of 2000 strings%n", agree);
    System.out.println();
    System.out.println("      length   expand around centres   manacher   text");
    int[] lengths = {1000, 2000, 4000};
    for (int length : lengths) {
      String[][] inputs = {
        {"random, 2 letters", randomString(length, 2)},
        {"all one letter", "a".repeat(length)},
      };
      for (String[] input : inputs) {
        work = 0;
        expandAroundCentres(input[1]);
        long slow = work;
        work = 0;
        manacher(input[1]);
        System.out.printf("%12d %23d %10d   %s%n", length, slow, work, input[0]);
      }
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

#include <algorithm>
#include <cstdio>
#include <string>
#include <utility>
#include <vector>

long long work = 0;

std::pair<long long, long long> bruteForce(const std::string& s) {
  // longest palindrome length and number of palindromic substrings
  long long longest = 0;
  long long count = 0;
  for (size_t i = 0; i < s.size(); i++) {
    for (size_t j = i; j < s.size(); j++) {
      std::string piece = s.substr(i, j - i + 1);
      if (piece == std::string(piece.rbegin(), piece.rend())) {
        count += 1;
        longest = std::max(longest, (long long)(j - i + 1));
      }
    }
  }
  return std::make_pair(longest, count);
}

std::pair<long long, long long> expandAroundCentres(const std::string& s) {
  int n = (int)s.size();
  long long longest = 0;
  long long count = 0;
  for (int centre = 0; centre < 2 * n - 1; centre++) {
    int left = centre / 2;
    int right = left + centre % 2;
    while (left >= 0 && right < n) {
      work += 1;
      if (s[left] != s[right]) {
        break;
      }
      count += 1;
      longest = std::max(longest, (long long)(right - left + 1));
      left -= 1;
      right += 1;
    }
  }
  return std::make_pair(longest, count);
}

std::pair<long long, long long> manacher(const std::string& s) {
  // t puts a separator between characters so even and odd palindromes
  // both have a centre: "aba" becomes "#a#b#a#"
  std::string t = "#";
  for (char ch : s) {
    t += ch;
    t += '#';
  }
  int size = (int)t.size();
  std::vector<int> radius(size, 0);  // length of the palindrome in s centred at t[i]
  int centre = 0;
  int right = 0;  // the palindrome at centre reaches t[right - 1]
  for (int i = 0; i < size; i++) {
    if (i < right) {
      radius[i] = std::min(right - i, radius[2 * centre - i]);  // the mirror's answer, capped
    }
    while (i - radius[i] - 1 >= 0 && i + radius[i] + 1 < size) {
      work += 1;
      if (t[i - radius[i] - 1] != t[i + radius[i] + 1]) {
        break;
      }
      radius[i] += 1;
    }
    if (i + radius[i] > right) {
      centre = i;
      right = i + radius[i];
    }
  }
  long long longest = 0;
  long long count = 0;
  for (int r : radius) {
    longest = std::max(longest, (long long)r);
    count += (r + 1) / 2;
  }
  return std::make_pair(longest, count);
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
long long seed = 81700061LL;

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
  int agree = 0;
  for (int t = 0; t < 2000; t++) {
    int length = 1 + rand_below(20);
    std::string s = randomString(length, 2);
    std::pair<long long, long long> truth = bruteForce(s);
    if (expandAroundCentres(s) == truth && manacher(s) == truth) {
      agree += 1;
    }
  }
  std::printf("longest length and palindrome count matched brute force on %d of 2000 strings\\n",
              agree);
  std::printf("\\n");
  std::printf("      length   expand around centres   manacher   text\\n");
  int lengths[3] = {1000, 2000, 4000};
  for (int length : lengths) {
    std::string random = randomString(length, 2);
    std::vector<std::pair<std::string, std::string> > inputs = {
        {"random, 2 letters", random},
        {"all one letter", std::string(length, 'a')},
    };
    for (const std::pair<std::string, std::string>& input : inputs) {
      work = 0;
      expandAroundCentres(input.second);
      long long slow = work;
      work = 0;
      manacher(input.second);
      std::printf("%12d %23lld %10lld   %s\\n", length, slow, work, input.first.c_str());
    }
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

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

fn brute_force(s: &[u8]) -> (usize, usize) {
    // longest palindrome length and number of palindromic substrings
    let mut longest = 0;
    let mut count = 0;
    for i in 0..s.len() {
        for j in i..s.len() {
            let piece = &s[i..=j];
            if piece.iter().eq(piece.iter().rev()) {
                count += 1;
                longest = longest.max(j - i + 1);
            }
        }
    }
    (longest, count)
}

fn expand_around_centres(s: &[u8]) -> (usize, usize) {
    let n = s.len() as i64;
    let mut longest = 0;
    let mut count = 0;
    for centre in 0..(2 * n - 1).max(0) {
        let mut left = centre / 2;
        let mut right = left + centre % 2;
        while left >= 0 && right < n {
            tick();
            if s[left as usize] != s[right as usize] {
                break;
            }
            count += 1;
            longest = longest.max((right - left + 1) as usize);
            left -= 1;
            right += 1;
        }
    }
    (longest, count)
}

fn manacher(s: &[u8]) -> (usize, usize) {
    // t puts a separator between characters so even and odd palindromes
    // both have a centre: "aba" becomes "#a#b#a#"
    let mut t = vec![b'#'];
    for &ch in s {
        t.push(ch);
        t.push(b'#');
    }
    let size = t.len();
    let mut radius = vec![0usize; size]; // length of the palindrome in s centred at t[i]
    let mut centre = 0;
    let mut right = 0; // the palindrome at centre reaches t[right - 1]
    for i in 0..size {
        if i < right {
            radius[i] = (right - i).min(radius[2 * centre - i]); // the mirror's answer, capped
        }
        while i >= radius[i] + 1 && i + radius[i] + 1 < size {
            tick();
            if t[i - radius[i] - 1] != t[i + radius[i] + 1] {
                break;
            }
            radius[i] += 1;
        }
        if i + radius[i] > right {
            centre = i;
            right = i + radius[i];
        }
    }
    let mut longest = 0;
    let mut count = 0;
    for &r in radius.iter() {
        longest = longest.max(r);
        count += (r + 1) / 2;
    }
    (longest, count)
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
static mut SEED: i64 = 81700061;

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
    let mut agree = 0;
    for _ in 0..2000 {
        let length = 1 + rand_below(20);
        let s = random_string(length, 2);
        let truth = brute_force(&s);
        if expand_around_centres(&s) == truth && manacher(&s) == truth {
            agree += 1;
        }
    }
    take_work();
    println!(
        "longest length and palindrome count matched brute force on {} of 2000 strings",
        agree
    );
    println!();
    println!("      length   expand around centres   manacher   text");
    for &length in [1000i64, 2000, 4000].iter() {
        let inputs: Vec<(&str, Vec<u8>)> = vec![
            ("random, 2 letters", random_string(length, 2)),
            ("all one letter", vec![b'a'; length as usize]),
        ];
        for (name, s) in inputs.iter() {
            take_work();
            expand_around_centres(s);
            let slow = take_work();
            manacher(s);
            let fast = take_work();
            println!("{:>12} {:>23} {:>10}   {}", length, slow, fast, name);
        }
    }
}
`,
            },
            {
              lang: "go",
              code: `// Every palindromic substring, found in linear time. Manacher's algorithm
// reuses the mirror image of a palindrome it has already found; expanding
// around every centre reuses nothing. Both are checked against brute force.

package main

import (
	"fmt"
	"strings"
)

var work int64

func bruteForce(s string) [2]int {
	// longest palindrome length and number of palindromic substrings
	longest := 0
	count := 0
	for i := 0; i < len(s); i++ {
		for j := i; j < len(s); j++ {
			palindrome := true
			for a, b := i, j; a < b; a, b = a+1, b-1 {
				if s[a] != s[b] {
					palindrome = false
					break
				}
			}
			if palindrome {
				count++
				longest = max(longest, j-i+1)
			}
		}
	}
	return [2]int{longest, count}
}

func expandAroundCentres(s string) [2]int {
	n := len(s)
	longest := 0
	count := 0
	for centre := 0; centre < 2*n-1; centre++ {
		left := centre / 2
		right := left + centre%2
		for left >= 0 && right < n {
			work++
			if s[left] != s[right] {
				break
			}
			count++
			longest = max(longest, right-left+1)
			left--
			right++
		}
	}
	return [2]int{longest, count}
}

func manacher(s string) [2]int {
	// t puts a separator between characters so even and odd palindromes
	// both have a centre: "aba" becomes "#a#b#a#"
	t := "#" + strings.Join(strings.Split(s, ""), "#") + "#"
	radius := make([]int, len(t)) // length of the palindrome in s centred at t[i]
	centre := 0
	right := 0 // the palindrome at centre reaches t[right - 1]
	for i := 0; i < len(t); i++ {
		if i < right {
			radius[i] = min(right-i, radius[2*centre-i]) // the mirror's answer, capped
		}
		for i-radius[i]-1 >= 0 && i+radius[i]+1 < len(t) {
			work++
			if t[i-radius[i]-1] != t[i+radius[i]+1] {
				break
			}
			radius[i]++
		}
		if i+radius[i] > right {
			centre = i
			right = i + radius[i]
		}
	}
	longest := 0
	count := 0
	for _, r := range radius {
		longest = max(longest, r)
		count += (r + 1) / 2
	}
	return [2]int{longest, count}
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
var seed int64 = 81700061

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
	agree := 0
	for t := 0; t < 2000; t++ {
		s := randomString(1+randBelow(20), 2)
		truth := bruteForce(s)
		if expandAroundCentres(s) == truth && manacher(s) == truth {
			agree++
		}
	}
	fmt.Printf("longest length and palindrome count matched brute force on %d of 2000 strings\\n", agree)
	fmt.Println()
	fmt.Println("      length   expand around centres   manacher   text")
	for _, length := range []int{1000, 2000, 4000} {
		inputs := [][2]string{
			{"random, 2 letters", randomString(length, 2)},
			{"all one letter", strings.Repeat("a", length)},
		}
		for _, input := range inputs {
			work = 0
			expandAroundCentres(input[1])
			slow := work
			work = 0
			manacher(input[1])
			fmt.Printf("%12d %23d %10d   %s\\n", length, slow, work, input[0])
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
      id: "when",
      heading: "When to use it",
      body: [
        "The random-string rows show that expanding around centres is near-linear when palindromes are short, which they are in most data. Its cost is the total length of all palindromes found, and that is only quadratic on highly repetitive input.",
        "So: expanding around centres is the right first answer for \"longest palindromic substring\" in an interview, stated as `O(n^2)` worst case. Manacher is the answer when the input can be adversarial or repetitive, or when the question asks for every palindrome length at every centre \u2014 for example, the minimum number of cuts to split a string into palindromes, where the palindrome table is the expensive part.",
        "Problems about palindromic **subsequences** are different. Characters need not be adjacent, and the standard tool is interval dynamic programming, not Manacher.",
      ],
      pitfalls: [
        {
          title: "Forgetting the cap at the right edge",
          body: "The mirror's radius is only valid up to `right`. Copying it uncapped claims characters beyond the known palindrome match.",
        },
        {
          title: "Mixing up lengths in the original and transformed strings",
          body: "With separators on both ends, `radius[i]` is already the length in the original string. Dividing or doubling it again gives wrong answers.",
        },
        {
          title: "Using it for subsequences",
          body: "A palindromic subsequence skips characters, so centres and radii do not describe it. That is a dynamic programming problem.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Manacher's algorithm find all palindromes in linear time?",
      answer:
        "It inserts a separator between characters so every palindrome has a centre character, then computes for each position the radius of the longest palindrome centred there. It keeps the palindrome reaching furthest right; for a position inside it, the mirror position across that palindrome's centre already has a radius, and the new radius starts at the smaller of that and the distance to the right edge. It then extends by comparison and moves the centre if it passes the edge. Every successful extension advances the right edge, so the work is linear: I measured 7,999 comparisons on 4,000 copies of one letter against 8,002,000 expanding around each centre.",
    },
    {
      question: "Is expanding around centres good enough for the longest palindromic substring?",
      answer:
        "Usually, and it is worth saying why. Its cost is the total length of the palindromes it finds, which is small on typical data: on random two-letter strings of length 1,000 I measured 4,952 comparisons against Manacher's 3,991. It is quadratic only on repetitive input, where one repeated letter of length 4,000 cost 8,002,000. So I would present expanding around centres as O(n^2) worst case and move to Manacher if the input can be repetitive or the problem needs every palindrome at every centre.",
    },
  ],
  takeaways: [
    "Separators give odd and even palindromes one form",
    "radius[i] in the transformed string is the palindrome length in the original",
    "Longest is max(radius); the count is the sum of (radius + 1) / 2",
    "Start from min(right - i, radius[mirror]), then extend",
    "Measured on one repeated letter: 8,002,000 expanding, 7,999 Manacher",
    "Expanding around centres is near-linear on random input",
    "Palindromic subsequences need dynamic programming, not Manacher",
  ],
};
