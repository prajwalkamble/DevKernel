import type { Lesson } from "@/content/types";

export const kmpLesson: Lesson = {
  id: "dsa-advanced-algorithms-kmp",
  slug: "kmp",
  moduleSlug: "advanced-algorithms",
  title: "KMP and the Failure Function",
  summary:
    "The failure function records, for every prefix of the pattern, its longest proper border — and that is enough to search without ever moving backwards in the text. Measured on text built to be slow: 1,990,100 comparisons naively, 40,098 with KMP.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Define the failure function as the longest proper border of each prefix",
    "Compute it in linear time by following the fallback chain",
    "Search a text with it and bound the comparisons at about 2n",
    "Say when KMP's guarantee matters and when it does not",
  ],
  sections: [
    {
      id: "what-it-computes",
      heading: "What the failure function computes",
      body: [
        "A **border** of a string is a string that is both a proper prefix and a suffix of it. `abab` has borders `ab` and the empty string; `aaaa` has `aaa`, `aa`, `a` and the empty string.",
        "The failure function `pi[i]` is the length of the **longest** border of `s[0..i]`. For `abaababaab` it is `0 0 1 1 2 3 2 3 4 5`: the whole string ends with `abaab`, which is also how it begins.",
        "Why that number matters for search: if the first `k` characters of the pattern matched and the next character fails, the text's last `k` characters are exactly `pattern[0..k-1]`. The longest way that text can still be the start of a match is its longest border, `pi[k-1]`. So the search can continue with `k = pi[k-1]` matched characters, without re-reading any text.",
      ],
    },
    {
      id: "computing-it",
      heading: "Computing it, and searching with it",
      body: [
        "The failure function is computed by running the same idea on the pattern against itself. Keep `k`, the border length for the previous position. At position `i`, compare `s[i]` with `s[k]`. If they match, the border grows to `k + 1`. If not, fall back to `k = pi[k-1]` \u2014 the next shorter border \u2014 and compare again, until a match or `k = 0`.",
        "The search is the same loop with the text supplying `s[i]`. When `k` reaches the pattern length, a match ends at `i`, and `k` falls back to `pi[k-1]` so overlapping matches are still found.",
        "**Why it is linear.** `k` increases by at most one per text character, and every fallback decreases it by at least one. It can therefore fall back at most as many times as it has increased, so the comparisons total at most about `2n`.",
      ],
      examples: [
        {
          id: "kmp-against-naive-search",
          title: "The failure function checked against its definition, then KMP against a naive search",
          lang: "python",
          code: `# The failure function, checked against its definition, and then used to
# search. Character comparisons are counted for a naive search and for KMP
# on text that is random and on text built to make the naive search slow.

def failure_by_definition(s):
    # pi[i]: the longest proper prefix of s[0..i] that is also its suffix
    pi = []
    for i in range(len(s)):
        best = 0
        for length in range(1, i + 1):
            if s[:length] == s[i - length + 1:i + 1]:
                best = length
        pi.append(best)
    return pi


work = [0]


def failure(s):
    pi = [0] * len(s)
    k = 0
    for i in range(1, len(s)):
        while True:
            work[0] += 1
            if s[i] == s[k]:
                k += 1
                break
            if k == 0:
                break
            k = pi[k - 1]          # fall back to the next shorter border
        pi[i] = k
    return pi


def kmp_search(text, pattern):
    pi = failure(pattern)
    found = []
    k = 0
    for i in range(len(text)):
        while True:
            work[0] += 1
            if text[i] == pattern[k]:
                k += 1
                break
            if k == 0:
                break
            k = pi[k - 1]
        if k == len(pattern):
            found.append(i - len(pattern) + 1)
            k = pi[k - 1]
    return found


def naive_search(text, pattern):
    found = []
    for start in range(len(text) - len(pattern) + 1):
        j = 0
        while j < len(pattern):
            work[0] += 1
            if text[start + j] != pattern[j]:
                break
            j += 1
        if j == len(pattern):
            found.append(start)
    return found


# The same linear congruential generator in every language, so the strings
# below are the same strings whichever translation is run.
seed = 51900013


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
    s = random_string(1 + rand(12), 2)
    if failure(s) == failure_by_definition(s):
        agree += 1
print("failure function matched its definition on %d of 2000 random strings" % agree)
print()
example = "abaababaab"
print("s   " + "  ".join(example))
print("pi  " + "  ".join(str(v) for v in failure(example)))
print()

TEXT = 20000
print("text of %d characters" % TEXT)
print()
print("case                        pattern   matches   naive cmps   kmp cmps")
cases = []
cases.append(["random, 2 letters", random_string(TEXT, 2), random_string(8, 2)])
cases.append(["random, 26 letters", random_string(TEXT, 26), "abc"])
cases.append(["all a, pattern a...ab", "a" * TEXT, "a" * 99 + "b"])
for name, text, pattern in cases:
    work[0] = 0
    slow = naive_search(text, pattern)
    slow_cost = work[0]
    work[0] = 0
    fast = kmp_search(text, pattern)
    fast_cost = work[0]
    same = "" if slow == fast else "  (disagree)"
    print("%-27s %7d %9d %12d %10d%s" % (name, len(pattern), len(fast), slow_cost, fast_cost, same))
`,
          output: `failure function matched its definition on 2000 of 2000 random strings

s   a  b  a  a  b  a  b  a  a  b
pi  0  0  1  1  2  3  2  3  4  5

text of 20000 characters

case                        pattern   matches   naive cmps   kmp cmps
random, 2 letters                 8        74        39914      29996
random, 26 letters                3         2        20806      20772
all a, pattern a...ab           100         0      1990100      40098`,
          explanation:
            "The linear computation matched the brute-force definition on 2,000 of 2,000 random strings. On a 20,000-character text of all `a` with the pattern `a...ab`, the naive search spends 1,990,100 comparisons, because every alignment matches 99 characters before failing. KMP spends 40,098, about 2n. On random text the gap is small or absent: 39,914 against 29,996 with two letters, and 20,806 against 20,772 with 26 letters, where mismatches come almost immediately and there is nothing to reuse.",
          alternates: [
            {
              lang: "javascript",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

function failureByDefinition(s) {
  // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
  const pi = [];
  for (let i = 0; i < s.length; i++) {
    let best = 0;
    for (let length = 1; length <= i; length++) {
      if (s.slice(0, length) === s.slice(i - length + 1, i + 1)) best = length;
    }
    pi.push(best);
  }
  return pi;
}

let work = 0;

function failure(s) {
  const pi = new Array(s.length).fill(0);
  let k = 0;
  for (let i = 1; i < s.length; i++) {
    for (;;) {
      work += 1;
      if (s[i] === s[k]) {
        k += 1;
        break;
      }
      if (k === 0) break;
      k = pi[k - 1]; // fall back to the next shorter border
    }
    pi[i] = k;
  }
  return pi;
}

function kmpSearch(text, pattern) {
  const pi = failure(pattern);
  const found = [];
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    for (;;) {
      work += 1;
      if (text[i] === pattern[k]) {
        k += 1;
        break;
      }
      if (k === 0) break;
      k = pi[k - 1];
    }
    if (k === pattern.length) {
      found.push(i - pattern.length + 1);
      k = pi[k - 1];
    }
  }
  return found;
}

function naiveSearch(text, pattern) {
  const found = [];
  for (let start = 0; start + pattern.length <= text.length; start++) {
    let j = 0;
    while (j < pattern.length) {
      work += 1;
      if (text[start + j] !== pattern[j]) break;
      j += 1;
    }
    if (j === pattern.length) found.push(start);
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 51900013n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomString(length, alphabet) {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(97 + rand(alphabet));
  return out;
}

function pad(s, width) {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(12), 2);
  if (failure(s).join(",") === failureByDefinition(s).join(",")) agree += 1;
}
console.log("failure function matched its definition on " + agree + " of 2000 random strings");
console.log();
const example = "abaababaab";
console.log("s   " + example.split("").join("  "));
console.log("pi  " + failure(example).join("  "));
console.log();

const TEXT = 20000;
console.log("text of " + TEXT + " characters");
console.log();
console.log("case                        pattern   matches   naive cmps   kmp cmps");
const cases = [];
const text1 = randomString(TEXT, 2);
cases.push(["random, 2 letters", text1, randomString(8, 2)]);
cases.push(["random, 26 letters", randomString(TEXT, 26), "abc"]);
cases.push(["all a, pattern a...ab", "a".repeat(TEXT), "a".repeat(99) + "b"]);
for (const [name, text, pattern] of cases) {
  work = 0;
  const slow = naiveSearch(text, pattern);
  const slowCost = work;
  work = 0;
  const fast = kmpSearch(text, pattern);
  const fastCost = work;
  const same = slow.join(",") === fast.join(",") ? "" : "  (disagree)";
  console.log(
    pad(name, 27) + " " + padLeft(pattern.length, 7) + " " + padLeft(fast.length, 9) + " " +
      padLeft(slowCost, 12) + " " + padLeft(fastCost, 10) + same,
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

function failureByDefinition(s: string): number[] {
  // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
  const pi: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let best = 0;
    for (let length = 1; length <= i; length++) {
      if (s.slice(0, length) === s.slice(i - length + 1, i + 1)) best = length;
    }
    pi.push(best);
  }
  return pi;
}

let work = 0;

function failure(s: string): number[] {
  const pi = new Array(s.length).fill(0);
  let k = 0;
  for (let i = 1; i < s.length; i++) {
    for (;;) {
      work += 1;
      if (s[i] === s[k]) {
        k += 1;
        break;
      }
      if (k === 0) break;
      k = pi[k - 1]; // fall back to the next shorter border
    }
    pi[i] = k;
  }
  return pi;
}

function kmpSearch(text: string, pattern: string): number[] {
  const pi = failure(pattern);
  const found: number[] = [];
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    for (;;) {
      work += 1;
      if (text[i] === pattern[k]) {
        k += 1;
        break;
      }
      if (k === 0) break;
      k = pi[k - 1];
    }
    if (k === pattern.length) {
      found.push(i - pattern.length + 1);
      k = pi[k - 1];
    }
  }
  return found;
}

function naiveSearch(text: string, pattern: string): number[] {
  const found: number[] = [];
  for (let start = 0; start + pattern.length <= text.length; start++) {
    let j = 0;
    while (j < pattern.length) {
      work += 1;
      if (text[start + j] !== pattern[j]) break;
      j += 1;
    }
    if (j === pattern.length) found.push(start);
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 51900013n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomString(length: number, alphabet: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(97 + rand(alphabet));
  return out;
}

function pad(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out += " ";
  return out;
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

let agree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(12), 2);
  if (failure(s).join(",") === failureByDefinition(s).join(",")) agree += 1;
}
console.log("failure function matched its definition on " + agree + " of 2000 random strings");
console.log();
const example = "abaababaab";
console.log("s   " + example.split("").join("  "));
console.log("pi  " + failure(example).join("  "));
console.log();

const TEXT = 20000;
console.log("text of " + TEXT + " characters");
console.log();
console.log("case                        pattern   matches   naive cmps   kmp cmps");
const cases: Array<[string, string, string]> = [];
const text1 = randomString(TEXT, 2);
cases.push(["random, 2 letters", text1, randomString(8, 2)]);
cases.push(["random, 26 letters", randomString(TEXT, 26), "abc"]);
cases.push(["all a, pattern a...ab", "a".repeat(TEXT), "a".repeat(99) + "b"]);
for (const [name, text, pattern] of cases) {
  work = 0;
  const slow = naiveSearch(text, pattern);
  const slowCost = work;
  work = 0;
  const fast = kmpSearch(text, pattern);
  const fastCost = work;
  const same = slow.join(",") === fast.join(",") ? "" : "  (disagree)";
  console.log(
    pad(name, 27) + " " + padLeft(pattern.length, 7) + " " + padLeft(fast.length, 9) + " " +
      padLeft(slowCost, 12) + " " + padLeft(fastCost, 10) + same,
  );
}
`,
            },
            {
              lang: "java",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
  static int[] failureByDefinition(String s) {
    // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
    int[] pi = new int[s.length()];
    for (int i = 0; i < s.length(); i++) {
      int best = 0;
      for (int length = 1; length <= i; length++) {
        if (s.substring(0, length).equals(s.substring(i - length + 1, i + 1))) {
          best = length;
        }
      }
      pi[i] = best;
    }
    return pi;
  }

  static long work = 0;

  static int[] failure(String s) {
    int[] pi = new int[s.length()];
    int k = 0;
    for (int i = 1; i < s.length(); i++) {
      while (true) {
        work += 1;
        if (s.charAt(i) == s.charAt(k)) {
          k += 1;
          break;
        }
        if (k == 0) {
          break;
        }
        k = pi[k - 1]; // fall back to the next shorter border
      }
      pi[i] = k;
    }
    return pi;
  }

  static List<Integer> kmpSearch(String text, String pattern) {
    int[] pi = failure(pattern);
    List<Integer> found = new ArrayList<>();
    int k = 0;
    for (int i = 0; i < text.length(); i++) {
      while (true) {
        work += 1;
        if (text.charAt(i) == pattern.charAt(k)) {
          k += 1;
          break;
        }
        if (k == 0) {
          break;
        }
        k = pi[k - 1];
      }
      if (k == pattern.length()) {
        found.add(i - pattern.length() + 1);
        k = pi[k - 1];
      }
    }
    return found;
  }

  static List<Integer> naiveSearch(String text, String pattern) {
    List<Integer> found = new ArrayList<>();
    for (int start = 0; start + pattern.length() <= text.length(); start++) {
      int j = 0;
      while (j < pattern.length()) {
        work += 1;
        if (text.charAt(start + j) != pattern.charAt(j)) {
          break;
        }
        j += 1;
      }
      if (j == pattern.length()) {
        found.add(start);
      }
    }
    return found;
  }

  // The same linear congruential generator in every language, so the strings
  // below are the same strings whichever translation is run.
  static long seed = 51900013L;

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

  static String joined(int[] values) {
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < values.length; i++) {
      if (i > 0) {
        out.append("  ");
      }
      out.append(values[i]);
    }
    return out.toString();
  }

  public static void main(String[] args) {
    int agree = 0;
    for (int t = 0; t < 2000; t++) {
      String s = randomString(1 + rand(12), 2);
      if (Arrays.equals(failure(s), failureByDefinition(s))) {
        agree += 1;
      }
    }
    System.out.printf("failure function matched its definition on %d of 2000 random strings%n", agree);
    System.out.println();
    String example = "abaababaab";
    System.out.println("s   " + String.join("  ", example.split("")));
    System.out.println("pi  " + joined(failure(example)));
    System.out.println();

    final int textLength = 20000;
    System.out.printf("text of %d characters%n", textLength);
    System.out.println();
    System.out.println("case                        pattern   matches   naive cmps   kmp cmps");
    String text1 = randomString(textLength, 2);
    String pattern1 = randomString(8, 2);
    String text2 = randomString(textLength, 26);
    String[][] cases = {
      {"random, 2 letters", text1, pattern1},
      {"random, 26 letters", text2, "abc"},
      {"all a, pattern a...ab", "a".repeat(textLength), "a".repeat(99) + "b"},
    };
    for (String[] c : cases) {
      work = 0;
      List<Integer> slow = naiveSearch(c[1], c[2]);
      long slowCost = work;
      work = 0;
      List<Integer> fast = kmpSearch(c[1], c[2]);
      long fastCost = work;
      String same = slow.equals(fast) ? "" : "  (disagree)";
      System.out.printf(
          "%-27s %7d %9d %12d %10d%s%n", c[0], c[2].length(), fast.size(), slowCost, fastCost, same);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

#include <cstdio>
#include <string>
#include <vector>

std::vector<int> failureByDefinition(const std::string& s) {
  // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
  std::vector<int> pi;
  for (int i = 0; i < (int)s.size(); i++) {
    int best = 0;
    for (int length = 1; length <= i; length++) {
      if (s.substr(0, length) == s.substr(i - length + 1, length)) {
        best = length;
      }
    }
    pi.push_back(best);
  }
  return pi;
}

long long work = 0;

std::vector<int> failure(const std::string& s) {
  std::vector<int> pi(s.size(), 0);
  int k = 0;
  for (int i = 1; i < (int)s.size(); i++) {
    while (true) {
      work += 1;
      if (s[i] == s[k]) {
        k += 1;
        break;
      }
      if (k == 0) {
        break;
      }
      k = pi[k - 1];  // fall back to the next shorter border
    }
    pi[i] = k;
  }
  return pi;
}

std::vector<int> kmpSearch(const std::string& text, const std::string& pattern) {
  std::vector<int> pi = failure(pattern);
  std::vector<int> found;
  int k = 0;
  for (int i = 0; i < (int)text.size(); i++) {
    while (true) {
      work += 1;
      if (text[i] == pattern[k]) {
        k += 1;
        break;
      }
      if (k == 0) {
        break;
      }
      k = pi[k - 1];
    }
    if (k == (int)pattern.size()) {
      found.push_back(i - (int)pattern.size() + 1);
      k = pi[k - 1];
    }
  }
  return found;
}

std::vector<int> naiveSearch(const std::string& text, const std::string& pattern) {
  std::vector<int> found;
  for (int start = 0; start + pattern.size() <= text.size(); start++) {
    size_t j = 0;
    while (j < pattern.size()) {
      work += 1;
      if (text[start + j] != pattern[j]) {
        break;
      }
      j += 1;
    }
    if (j == pattern.size()) {
      found.push_back(start);
    }
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
long long seed = 51900013LL;

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
    int length = 1 + rand_below(12);
    std::string s = randomString(length, 2);
    if (failure(s) == failureByDefinition(s)) {
      agree += 1;
    }
  }
  std::printf("failure function matched its definition on %d of 2000 random strings\\n", agree);
  std::printf("\\n");
  std::string example = "abaababaab";
  std::printf("s   ");
  for (size_t i = 0; i < example.size(); i++) {
    std::printf(i == 0 ? "%c" : "  %c", example[i]);
  }
  std::printf("\\npi  ");
  std::vector<int> pi = failure(example);
  for (size_t i = 0; i < pi.size(); i++) {
    std::printf(i == 0 ? "%d" : "  %d", pi[i]);
  }
  std::printf("\\n\\n");

  const int textLength = 20000;
  std::printf("text of %d characters\\n", textLength);
  std::printf("\\n");
  std::printf("case                        pattern   matches   naive cmps   kmp cmps\\n");
  std::string text1 = randomString(textLength, 2);
  std::string pattern1 = randomString(8, 2);
  std::string text2 = randomString(textLength, 26);
  std::vector<std::vector<std::string> > cases = {
      {"random, 2 letters", text1, pattern1},
      {"random, 26 letters", text2, "abc"},
      {"all a, pattern a...ab", std::string(textLength, 'a'), std::string(99, 'a') + "b"},
  };
  for (const std::vector<std::string>& c : cases) {
    work = 0;
    std::vector<int> slow = naiveSearch(c[1], c[2]);
    long long slowCost = work;
    work = 0;
    std::vector<int> fast = kmpSearch(c[1], c[2]);
    long long fastCost = work;
    const char* same = slow == fast ? "" : "  (disagree)";
    std::printf("%-27s %7d %9d %12lld %10lld%s\\n", c[0].c_str(), (int)c[2].size(),
                (int)fast.size(), slowCost, fastCost, same);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

fn failure_by_definition(s: &[u8]) -> Vec<usize> {
    // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
    let mut pi = Vec::new();
    for i in 0..s.len() {
        let mut best = 0;
        for length in 1..=i {
            if s[..length] == s[i + 1 - length..i + 1] {
                best = length;
            }
        }
        pi.push(best);
    }
    pi
}

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

fn failure(s: &[u8]) -> Vec<usize> {
    let mut pi = vec![0; s.len()];
    let mut k = 0;
    for i in 1..s.len() {
        loop {
            tick();
            if s[i] == s[k] {
                k += 1;
                break;
            }
            if k == 0 {
                break;
            }
            k = pi[k - 1]; // fall back to the next shorter border
        }
        pi[i] = k;
    }
    pi
}

fn kmp_search(text: &[u8], pattern: &[u8]) -> Vec<usize> {
    let pi = failure(pattern);
    let mut found = Vec::new();
    let mut k = 0;
    for i in 0..text.len() {
        loop {
            tick();
            if text[i] == pattern[k] {
                k += 1;
                break;
            }
            if k == 0 {
                break;
            }
            k = pi[k - 1];
        }
        if k == pattern.len() {
            found.push(i + 1 - pattern.len());
            k = pi[k - 1];
        }
    }
    found
}

fn naive_search(text: &[u8], pattern: &[u8]) -> Vec<usize> {
    let mut found = Vec::new();
    let mut start = 0;
    while start + pattern.len() <= text.len() {
        let mut j = 0;
        while j < pattern.len() {
            tick();
            if text[start + j] != pattern[j] {
                break;
            }
            j += 1;
        }
        if j == pattern.len() {
            found.push(start);
        }
        start += 1;
    }
    found
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
static mut SEED: i64 = 51900013;

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
        let length = 1 + rand_below(12);
        let s = random_string(length, 2);
        if failure(&s) == failure_by_definition(&s) {
            agree += 1;
        }
    }
    take_work();
    println!("failure function matched its definition on {} of 2000 random strings", agree);
    println!();
    let example = b"abaababaab";
    let letters: Vec<String> = example.iter().map(|&c| (c as char).to_string()).collect();
    println!("s   {}", letters.join("  "));
    let pi: Vec<String> = failure(example).iter().map(|v| v.to_string()).collect();
    println!("pi  {}", pi.join("  "));
    println!();

    let text_length = 20000;
    println!("text of {} characters", text_length);
    println!();
    println!("case                        pattern   matches   naive cmps   kmp cmps");
    let text1 = random_string(text_length, 2);
    let pattern1 = random_string(8, 2);
    let text2 = random_string(text_length, 26);
    let mut pattern3 = vec![b'a'; 99];
    pattern3.push(b'b');
    let cases: Vec<(&str, Vec<u8>, Vec<u8>)> = vec![
        ("random, 2 letters", text1, pattern1),
        ("random, 26 letters", text2, b"abc".to_vec()),
        ("all a, pattern a...ab", vec![b'a'; text_length as usize], pattern3),
    ];
    for (name, text, pattern) in cases.iter() {
        take_work();
        let slow = naive_search(text, pattern);
        let slow_cost = take_work();
        let fast = kmp_search(text, pattern);
        let fast_cost = take_work();
        let same = if slow == fast { "" } else { "  (disagree)" };
        println!(
            "{:<27} {:>7} {:>9} {:>12} {:>10}{}",
            name,
            pattern.len(),
            fast.len(),
            slow_cost,
            fast_cost,
            same
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// The failure function, checked against its definition, and then used to
// search. Character comparisons are counted for a naive search and for KMP
// on text that is random and on text built to make the naive search slow.

package main

import (
	"fmt"
	"strings"
)

func failureByDefinition(s string) []int {
	// pi[i]: the longest proper prefix of s[0..i] that is also its suffix
	pi := []int{}
	for i := 0; i < len(s); i++ {
		best := 0
		for length := 1; length <= i; length++ {
			if s[:length] == s[i-length+1:i+1] {
				best = length
			}
		}
		pi = append(pi, best)
	}
	return pi
}

var work int64

func failure(s string) []int {
	pi := make([]int, len(s))
	k := 0
	for i := 1; i < len(s); i++ {
		for {
			work++
			if s[i] == s[k] {
				k++
				break
			}
			if k == 0 {
				break
			}
			k = pi[k-1] // fall back to the next shorter border
		}
		pi[i] = k
	}
	return pi
}

func kmpSearch(text, pattern string) []int {
	pi := failure(pattern)
	found := []int{}
	k := 0
	for i := 0; i < len(text); i++ {
		for {
			work++
			if text[i] == pattern[k] {
				k++
				break
			}
			if k == 0 {
				break
			}
			k = pi[k-1]
		}
		if k == len(pattern) {
			found = append(found, i-len(pattern)+1)
			k = pi[k-1]
		}
	}
	return found
}

func naiveSearch(text, pattern string) []int {
	found := []int{}
	for start := 0; start+len(pattern) <= len(text); start++ {
		j := 0
		for j < len(pattern) {
			work++
			if text[start+j] != pattern[j] {
				break
			}
			j++
		}
		if j == len(pattern) {
			found = append(found, start)
		}
	}
	return found
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
var seed int64 = 51900013

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

func main() {
	agree := 0
	for t := 0; t < 2000; t++ {
		s := randomString(1+randBelow(12), 2)
		if sameInts(failure(s), failureByDefinition(s)) {
			agree++
		}
	}
	fmt.Printf("failure function matched its definition on %d of 2000 random strings\\n", agree)
	fmt.Println()
	example := "abaababaab"
	fmt.Println("s   " + strings.Join(strings.Split(example, ""), "  "))
	parts := []string{}
	for _, v := range failure(example) {
		parts = append(parts, fmt.Sprint(v))
	}
	fmt.Println("pi  " + strings.Join(parts, "  "))
	fmt.Println()

	const textLength = 20000
	fmt.Printf("text of %d characters\\n", textLength)
	fmt.Println()
	fmt.Println("case                        pattern   matches   naive cmps   kmp cmps")
	text1 := randomString(textLength, 2)
	pattern1 := randomString(8, 2)
	text2 := randomString(textLength, 26)
	cases := [][3]string{
		{"random, 2 letters", text1, pattern1},
		{"random, 26 letters", text2, "abc"},
		{"all a, pattern a...ab", strings.Repeat("a", textLength), strings.Repeat("a", 99) + "b"},
	}
	for _, c := range cases {
		work = 0
		slow := naiveSearch(c[1], c[2])
		slowCost := work
		work = 0
		fast := kmpSearch(c[1], c[2])
		fastCost := work
		same := ""
		if !sameInts(slow, fast) {
			same = "  (disagree)"
		}
		fmt.Printf("%-27s %7d %9d %12d %10d%s\\n", c[0], len(c[2]), len(fast), slowCost, fastCost, same)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "when-it-matters",
      heading: "When it matters, and what else it answers",
      body: [
        "The 26-letter row is the honest result: on ordinary text a naive search is already nearly linear, because most alignments fail on the first or second character. KMP's value is the **guarantee**. Inputs with long partial matches \u2014 repetitive data, DNA, adversarial test cases \u2014 are exactly where the naive search goes quadratic, and KMP does not.",
        "KMP also reads the text strictly left to right, one character at a time, holding only `k`. That makes it usable on a stream too large to store.",
        "The failure function answers questions beyond search:",
        "**Shortest period.** A string of length `n` repeats a block of length `n - pi[n-1]`; it is an exact repetition of that block when `n` is divisible by it. `abcabcabc` has `pi[8] = 6` and period 3.",
        "**Occurrences as prefix-function values.** Computing `pi` over `pattern + '#' + text` (with a separator absent from both) marks every match as a position where `pi` equals the pattern length.",
        "**Longest prefix that is also a suffix** is `pi[n-1]` directly, which is a common interview question stated without naming KMP.",
      ],
      pitfalls: [
        {
          title: "Falling back to pi[k] instead of pi[k-1]",
          body: "`k` matched characters occupy `pattern[0..k-1]`, so the next border is `pi[k-1]`. Off by one here gives wrong fallbacks that still pass simple tests.",
        },
        {
          title: "Resetting k to 0 after a match",
          body: "Overlapping matches are lost: searching `aa` in `aaa` must find two. Fall back to `pi[k-1]`.",
        },
        {
          title: "Expecting a speed-up on random text",
          body: "Measured with 26 letters: 20,806 comparisons naive, 20,772 KMP. The benefit is the worst case, not the average.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the failure function in KMP?",
      answer:
        "For each prefix of the pattern, the length of its longest proper border -- a string that is both a proper prefix and a suffix. It matters because after matching k characters and then failing, the text just read equals the pattern's first k characters, and the longest way that can still start a match is that prefix's longest border. So the search continues with k = pi[k-1] and never re-reads text. It is computed by the same loop run on the pattern against itself, and it also gives the shortest period of a string as n - pi[n-1].",
    },
    {
      question: "Why is KMP linear, and when does it beat a naive search?",
      answer:
        "The matched length k rises by at most one per text character and every fallback lowers it, so total fallbacks cannot exceed total increases, about 2n comparisons in all. It beats a naive search when the text has long partial matches: on 20,000 characters of all a with pattern a...ab I measured 1,990,100 naive comparisons against 40,098. On random 26-letter text it did not help at all -- 20,806 against 20,772 -- because mismatches come immediately. The point of KMP is the worst-case guarantee and the fact that it streams the text left to right.",
    },
  ],
  takeaways: [
    "pi[i] is the longest proper border of the first i + 1 characters",
    "On a mismatch after k matches, continue from pi[k-1]",
    "k rises at most once per character, so comparisons are at most about 2n",
    "Measured worst case: 1,990,100 naive comparisons against 40,098",
    "On random 26-letter text there is no gain; the value is the guarantee",
    "After a full match fall back to pi[k-1] to keep overlaps",
    "Shortest period is n - pi[n-1]",
  ],
};
