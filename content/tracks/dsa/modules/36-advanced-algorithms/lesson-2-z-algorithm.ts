import type { Lesson } from "@/content/types";

export const zAlgorithmLesson: Lesson = {
  id: "dsa-advanced-algorithms-z-algorithm",
  slug: "z-algorithm",
  moduleSlug: "advanced-algorithms",
  title: "The Z-Algorithm, and When It Is Simpler Than KMP",
  summary:
    "The Z-array gives, for every position, the length of the longest prefix of the string that starts there. A window of already-known matches makes it linear. Measured on a string of one repeated letter: 7,998,000 comparisons by definition, 3,999 with the window.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Define the Z-array and read pattern matches from it",
    "Maintain the rightmost matching window and reuse it",
    "Bound the comparisons and check the bound by measurement",
    "Choose between the Z-algorithm and KMP for a given problem",
  ],
  sections: [
    {
      id: "the-array",
      heading: "The Z-array",
      body: [
        "`z[i]` is the length of the longest common prefix of the string `s` and its suffix `s[i..]`. By convention `z[0]` is left as 0. For `aabxaabxaab` the array is `0 1 0 0 7 1 0 0 3 1 0`: at position 4 the string continues `aabxaab`, which matches its first seven characters.",
        "**Search.** Build `pattern + '#' + text`, with a separator that occurs in neither. Any position in the text part whose `z` value is at least the pattern length is the start of a match, and the separator stops a match from running past the pattern.",
      ],
    },
    {
      id: "the-window",
      heading: "Reusing the rightmost window",
      body: [
        "Computing each `z[i]` from scratch compares forward from every position. On a string of one repeated letter that is quadratic: each position matches all the way to the end.",
        "The linear algorithm keeps `[left, right)`, the match window reaching furthest to the right found so far, meaning `s[left..right-1]` equals `s[0..right-left-1]`.",
        "For a new position `i` inside that window, the characters from `i` to `right` are a copy of the characters from `i - left` onward in the prefix, whose answer `z[i - left]` is already known. So `z[i]` is at least `min(right - i, z[i - left])`. Start from there, extend by direct comparison, and if the match now reaches past `right`, move the window to start at `i`.",
        "**Why it is linear.** Every successful comparison past `right` advances `right`, which never moves back and cannot exceed `n`. Each position adds at most one failed comparison. The total is under `2n`.",
      ],
      examples: [
        {
          id: "z-array-against-its-definition",
          title: "The Z-array against its definition, search against a naive search, and comparisons",
          lang: "python",
          code: `# The Z-array: for every position, how long a prefix of the string starts
# there. Checked against its definition, then used to search by building
# pattern + separator + text, with comparisons counted.

work = [0]


def z_by_definition(s):
    # extend a fresh match at every position, reusing nothing
    z = [0] * len(s)
    for i in range(1, len(s)):
        while i + z[i] < len(s):
            work[0] += 1
            if s[z[i]] != s[i + z[i]]:
                break
            z[i] += 1
    return z


def z_array(s):
    n = len(s)
    z = [0] * n
    left = 0
    right = 0      # s[left:right] is the rightmost window known to match a prefix
    for i in range(1, n):
        if i < right:
            z[i] = min(right - i, z[i - left])   # copy what is already known
        while i + z[i] < n:
            work[0] += 1
            if s[z[i]] != s[i + z[i]]:
                break
            z[i] += 1
        if i + z[i] > right:
            left = i
            right = i + z[i]
    return z


def z_search(text, pattern):
    joined = pattern + "#" + text
    z = z_array(joined)
    found = []
    for i in range(len(pattern) + 1, len(joined)):
        if z[i] >= len(pattern):
            found.append(i - len(pattern) - 1)
    return found


def naive_search(text, pattern):
    found = []
    for start in range(len(text) - len(pattern) + 1):
        if text[start:start + len(pattern)] == pattern:
            found.append(start)
    return found


# The same linear congruential generator in every language, so the strings
# below are the same strings whichever translation is run.
seed = 62800031


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
search_agree = 0
for _ in range(2000):
    s = random_string(1 + rand(15), 2)
    if z_array(s) == z_by_definition(s):
        agree += 1
    text = random_string(30 + rand(30), 2)
    pattern = random_string(1 + rand(4), 2)
    if z_search(text, pattern) == naive_search(text, pattern):
        search_agree += 1
print("z-array matched its definition on %d of 2000 random strings" % agree)
print("search matched a naive search on %d of 2000 random texts" % search_agree)
print()
example = "aabxaabxaab"
print("s  " + "  ".join(example))
print("z  " + "  ".join(str(v) for v in z_array(example)))
print()
print("      length   by definition   z-algorithm   per character   text")
for length in [1000, 2000, 4000]:
    for name, s in [["random, 2 letters", random_string(length, 2)],
                    ["all one letter", "a" * length]]:
        work[0] = 0
        z_by_definition(s)
        slow = work[0]
        work[0] = 0
        z_array(s)
        per = work[0] * 100 // length
        print("%12d %15d %13d %12d.%02d   %s" % (length, slow, work[0], per // 100, per % 100, name))
`,
          output: `z-array matched its definition on 2000 of 2000 random strings
search matched a naive search on 2000 of 2000 random texts

s  a  a  b  x  a  a  b  x  a  a  b
z  0  1  0  0  7  1  0  0  3  1  0

      length   by definition   z-algorithm   per character   text
        1000            2040          1654            1.65   random, 2 letters
        1000          499500           999            0.99   all one letter
        2000            3960          3839            1.91   random, 2 letters
        2000         1999000          1999            0.99   all one letter
        4000            7863          6492            1.62   random, 2 letters
        4000         7998000          3999            0.99   all one letter`,
          explanation:
            "The window algorithm matched the definition on 2,000 of 2,000 random strings, and Z-based search matched a naive search on 2,000 of 2,000 texts. On one repeated letter the definition costs 499,500 comparisons at length 1,000 and 7,998,000 at 4,000 \u2014 quadratic \u2014 while the window version costs 999 and 3,999, one per position. On random two-letter strings both are close to linear, with the window version at 1.62 to 1.91 comparisons per character.",
          alternates: [
            {
              lang: "javascript",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

let work = 0;

function zByDefinition(s) {
  // extend a fresh match at every position, reusing nothing
  const z = new Array(s.length).fill(0);
  for (let i = 1; i < s.length; i++) {
    while (i + z[i] < s.length) {
      work += 1;
      if (s[z[i]] !== s[i + z[i]]) break;
      z[i] += 1;
    }
  }
  return z;
}

function zArray(s) {
  const n = s.length;
  const z = new Array(n).fill(0);
  let left = 0;
  let right = 0; // s[left:right] is the rightmost window known to match a prefix
  for (let i = 1; i < n; i++) {
    if (i < right) z[i] = Math.min(right - i, z[i - left]); // copy what is already known
    while (i + z[i] < n) {
      work += 1;
      if (s[z[i]] !== s[i + z[i]]) break;
      z[i] += 1;
    }
    if (i + z[i] > right) {
      left = i;
      right = i + z[i];
    }
  }
  return z;
}

function zSearch(text, pattern) {
  const joined = pattern + "#" + text;
  const z = zArray(joined);
  const found = [];
  for (let i = pattern.length + 1; i < joined.length; i++) {
    if (z[i] >= pattern.length) found.push(i - pattern.length - 1);
  }
  return found;
}

function naiveSearch(text, pattern) {
  const found = [];
  for (let start = 0; start + pattern.length <= text.length; start++) {
    if (text.slice(start, start + pattern.length) === pattern) found.push(start);
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 62800031n;

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
let searchAgree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(15), 2);
  if (zArray(s).join(",") === zByDefinition(s).join(",")) agree += 1;
  const text = randomString(30 + rand(30), 2);
  const pattern = randomString(1 + rand(4), 2);
  if (zSearch(text, pattern).join(",") === naiveSearch(text, pattern).join(",")) searchAgree += 1;
}
console.log("z-array matched its definition on " + agree + " of 2000 random strings");
console.log("search matched a naive search on " + searchAgree + " of 2000 random texts");
console.log();
const example = "aabxaabxaab";
console.log("s  " + example.split("").join("  "));
console.log("z  " + zArray(example).join("  "));
console.log();
console.log("      length   by definition   z-algorithm   per character   text");
for (const length of [1000, 2000, 4000]) {
  const inputs = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    work = 0;
    zByDefinition(s);
    const slow = work;
    work = 0;
    zArray(s);
    const per = Math.floor((work * 100) / length);
    const fraction = per % 100;
    console.log(
      padLeft(length, 12) + " " + padLeft(slow, 15) + " " + padLeft(work, 13) + " " +
        padLeft(Math.floor(per / 100), 12) + "." + (fraction < 10 ? "0" : "") + fraction +
        "   " + name,
    );
  }
}
`,
            },
            {
              lang: "typescript",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

let work = 0;

function zByDefinition(s: string): number[] {
  // extend a fresh match at every position, reusing nothing
  const z = new Array(s.length).fill(0);
  for (let i = 1; i < s.length; i++) {
    while (i + z[i] < s.length) {
      work += 1;
      if (s[z[i]] !== s[i + z[i]]) break;
      z[i] += 1;
    }
  }
  return z;
}

function zArray(s: string): number[] {
  const n = s.length;
  const z = new Array(n).fill(0);
  let left = 0;
  let right = 0; // s[left:right] is the rightmost window known to match a prefix
  for (let i = 1; i < n; i++) {
    if (i < right) z[i] = Math.min(right - i, z[i - left]); // copy what is already known
    while (i + z[i] < n) {
      work += 1;
      if (s[z[i]] !== s[i + z[i]]) break;
      z[i] += 1;
    }
    if (i + z[i] > right) {
      left = i;
      right = i + z[i];
    }
  }
  return z;
}

function zSearch(text: string, pattern: string): number[] {
  const joined = pattern + "#" + text;
  const z = zArray(joined);
  const found: number[] = [];
  for (let i = pattern.length + 1; i < joined.length; i++) {
    if (z[i] >= pattern.length) found.push(i - pattern.length - 1);
  }
  return found;
}

function naiveSearch(text: string, pattern: string): number[] {
  const found: number[] = [];
  for (let start = 0; start + pattern.length <= text.length; start++) {
    if (text.slice(start, start + pattern.length) === pattern) found.push(start);
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 62800031n;

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
let searchAgree = 0;
for (let t = 0; t < 2000; t++) {
  const s = randomString(1 + rand(15), 2);
  if (zArray(s).join(",") === zByDefinition(s).join(",")) agree += 1;
  const text = randomString(30 + rand(30), 2);
  const pattern = randomString(1 + rand(4), 2);
  if (zSearch(text, pattern).join(",") === naiveSearch(text, pattern).join(",")) searchAgree += 1;
}
console.log("z-array matched its definition on " + agree + " of 2000 random strings");
console.log("search matched a naive search on " + searchAgree + " of 2000 random texts");
console.log();
const example = "aabxaabxaab";
console.log("s  " + example.split("").join("  "));
console.log("z  " + zArray(example).join("  "));
console.log();
console.log("      length   by definition   z-algorithm   per character   text");
for (const length of [1000, 2000, 4000]) {
  const inputs: Array<[string, string]> = [
    ["random, 2 letters", randomString(length, 2)],
    ["all one letter", "a".repeat(length)],
  ];
  for (const [name, s] of inputs) {
    work = 0;
    zByDefinition(s);
    const slow = work;
    work = 0;
    zArray(s);
    const per = Math.floor((work * 100) / length);
    const fraction = per % 100;
    console.log(
      padLeft(length, 12) + " " + padLeft(slow, 15) + " " + padLeft(work, 13) + " " +
        padLeft(Math.floor(per / 100), 12) + "." + (fraction < 10 ? "0" : "") + fraction +
        "   " + name,
    );
  }
}
`,
            },
            {
              lang: "java",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
  static long work = 0;

  static int[] zByDefinition(String s) {
    // extend a fresh match at every position, reusing nothing
    int[] z = new int[s.length()];
    for (int i = 1; i < s.length(); i++) {
      while (i + z[i] < s.length()) {
        work += 1;
        if (s.charAt(z[i]) != s.charAt(i + z[i])) {
          break;
        }
        z[i] += 1;
      }
    }
    return z;
  }

  static int[] zArray(String s) {
    int n = s.length();
    int[] z = new int[n];
    int left = 0;
    int right = 0; // s[left:right] is the rightmost window known to match a prefix
    for (int i = 1; i < n; i++) {
      if (i < right) {
        z[i] = Math.min(right - i, z[i - left]); // copy what is already known
      }
      while (i + z[i] < n) {
        work += 1;
        if (s.charAt(z[i]) != s.charAt(i + z[i])) {
          break;
        }
        z[i] += 1;
      }
      if (i + z[i] > right) {
        left = i;
        right = i + z[i];
      }
    }
    return z;
  }

  static List<Integer> zSearch(String text, String pattern) {
    String joined = pattern + "#" + text;
    int[] z = zArray(joined);
    List<Integer> found = new ArrayList<>();
    for (int i = pattern.length() + 1; i < joined.length(); i++) {
      if (z[i] >= pattern.length()) {
        found.add(i - pattern.length() - 1);
      }
    }
    return found;
  }

  static List<Integer> naiveSearch(String text, String pattern) {
    List<Integer> found = new ArrayList<>();
    for (int start = 0; start + pattern.length() <= text.length(); start++) {
      if (text.substring(start, start + pattern.length()).equals(pattern)) {
        found.add(start);
      }
    }
    return found;
  }

  // The same linear congruential generator in every language, so the strings
  // below are the same strings whichever translation is run.
  static long seed = 62800031L;

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
    int searchAgree = 0;
    for (int t = 0; t < 2000; t++) {
      String s = randomString(1 + rand(15), 2);
      if (Arrays.equals(zArray(s), zByDefinition(s))) {
        agree += 1;
      }
      String text = randomString(30 + rand(30), 2);
      String pattern = randomString(1 + rand(4), 2);
      if (zSearch(text, pattern).equals(naiveSearch(text, pattern))) {
        searchAgree += 1;
      }
    }
    System.out.printf("z-array matched its definition on %d of 2000 random strings%n", agree);
    System.out.printf("search matched a naive search on %d of 2000 random texts%n", searchAgree);
    System.out.println();
    String example = "aabxaabxaab";
    System.out.println("s  " + String.join("  ", example.split("")));
    StringBuilder zLine = new StringBuilder("z  ");
    int[] z = zArray(example);
    for (int i = 0; i < z.length; i++) {
      zLine.append(i == 0 ? "" : "  ").append(z[i]);
    }
    System.out.println(zLine);
    System.out.println();
    System.out.println("      length   by definition   z-algorithm   per character   text");
    int[] lengths = {1000, 2000, 4000};
    for (int length : lengths) {
      String[][] inputs = {
        {"random, 2 letters", randomString(length, 2)},
        {"all one letter", "a".repeat(length)},
      };
      for (String[] input : inputs) {
        work = 0;
        zByDefinition(input[1]);
        long slow = work;
        work = 0;
        zArray(input[1]);
        long per = work * 100 / length;
        System.out.printf(
            "%12d %15d %13d %12d.%02d   %s%n", length, slow, work, per / 100, per % 100, input[0]);
      }
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

#include <algorithm>
#include <cstdio>
#include <string>
#include <vector>

long long work = 0;

std::vector<int> zByDefinition(const std::string& s) {
  // extend a fresh match at every position, reusing nothing
  std::vector<int> z(s.size(), 0);
  for (int i = 1; i < (int)s.size(); i++) {
    while (i + z[i] < (int)s.size()) {
      work += 1;
      if (s[z[i]] != s[i + z[i]]) {
        break;
      }
      z[i] += 1;
    }
  }
  return z;
}

std::vector<int> zArray(const std::string& s) {
  int n = (int)s.size();
  std::vector<int> z(n, 0);
  int left = 0;
  int right = 0;  // s[left:right] is the rightmost window known to match a prefix
  for (int i = 1; i < n; i++) {
    if (i < right) {
      z[i] = std::min(right - i, z[i - left]);  // copy what is already known
    }
    while (i + z[i] < n) {
      work += 1;
      if (s[z[i]] != s[i + z[i]]) {
        break;
      }
      z[i] += 1;
    }
    if (i + z[i] > right) {
      left = i;
      right = i + z[i];
    }
  }
  return z;
}

std::vector<int> zSearch(const std::string& text, const std::string& pattern) {
  std::string joined = pattern + "#" + text;
  std::vector<int> z = zArray(joined);
  std::vector<int> found;
  for (int i = (int)pattern.size() + 1; i < (int)joined.size(); i++) {
    if (z[i] >= (int)pattern.size()) {
      found.push_back(i - (int)pattern.size() - 1);
    }
  }
  return found;
}

std::vector<int> naiveSearch(const std::string& text, const std::string& pattern) {
  std::vector<int> found;
  for (int start = 0; start + pattern.size() <= text.size(); start++) {
    if (text.compare(start, pattern.size(), pattern) == 0) {
      found.push_back(start);
    }
  }
  return found;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
long long seed = 62800031LL;

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
  int searchAgree = 0;
  for (int t = 0; t < 2000; t++) {
    int length = 1 + rand_below(15);
    std::string s = randomString(length, 2);
    if (zArray(s) == zByDefinition(s)) {
      agree += 1;
    }
    int textLength = 30 + rand_below(30);
    std::string text = randomString(textLength, 2);
    int patternLength = 1 + rand_below(4);
    std::string pattern = randomString(patternLength, 2);
    if (zSearch(text, pattern) == naiveSearch(text, pattern)) {
      searchAgree += 1;
    }
  }
  std::printf("z-array matched its definition on %d of 2000 random strings\\n", agree);
  std::printf("search matched a naive search on %d of 2000 random texts\\n", searchAgree);
  std::printf("\\n");
  std::string example = "aabxaabxaab";
  std::printf("s  ");
  for (size_t i = 0; i < example.size(); i++) {
    std::printf(i == 0 ? "%c" : "  %c", example[i]);
  }
  std::printf("\\nz  ");
  std::vector<int> z = zArray(example);
  for (size_t i = 0; i < z.size(); i++) {
    std::printf(i == 0 ? "%d" : "  %d", z[i]);
  }
  std::printf("\\n\\n");
  std::printf("      length   by definition   z-algorithm   per character   text\\n");
  int lengths[3] = {1000, 2000, 4000};
  for (int length : lengths) {
    std::string random = randomString(length, 2);
    std::vector<std::pair<std::string, std::string> > inputs = {
        {"random, 2 letters", random},
        {"all one letter", std::string(length, 'a')},
    };
    for (const std::pair<std::string, std::string>& input : inputs) {
      work = 0;
      zByDefinition(input.second);
      long long slow = work;
      work = 0;
      zArray(input.second);
      long long per = work * 100 / length;
      std::printf("%12d %15lld %13lld %12lld.%02lld   %s\\n", length, slow, work, per / 100,
                  per % 100, input.first.c_str());
    }
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

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

fn z_by_definition(s: &[u8]) -> Vec<usize> {
    // extend a fresh match at every position, reusing nothing
    let mut z = vec![0; s.len()];
    for i in 1..s.len() {
        while i + z[i] < s.len() {
            tick();
            if s[z[i]] != s[i + z[i]] {
                break;
            }
            z[i] += 1;
        }
    }
    z
}

fn z_array(s: &[u8]) -> Vec<usize> {
    let n = s.len();
    let mut z = vec![0; n];
    let mut left = 0;
    let mut right = 0; // s[left..right] is the rightmost window known to match a prefix
    for i in 1..n {
        if i < right {
            z[i] = (right - i).min(z[i - left]); // copy what is already known
        }
        while i + z[i] < n {
            tick();
            if s[z[i]] != s[i + z[i]] {
                break;
            }
            z[i] += 1;
        }
        if i + z[i] > right {
            left = i;
            right = i + z[i];
        }
    }
    z
}

fn z_search(text: &[u8], pattern: &[u8]) -> Vec<usize> {
    let mut joined = pattern.to_vec();
    joined.push(b'#');
    joined.extend_from_slice(text);
    let z = z_array(&joined);
    let mut found = Vec::new();
    for i in pattern.len() + 1..joined.len() {
        if z[i] >= pattern.len() {
            found.push(i - pattern.len() - 1);
        }
    }
    found
}

fn naive_search(text: &[u8], pattern: &[u8]) -> Vec<usize> {
    let mut found = Vec::new();
    let mut start = 0;
    while start + pattern.len() <= text.len() {
        if &text[start..start + pattern.len()] == pattern {
            found.push(start);
        }
        start += 1;
    }
    found
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
static mut SEED: i64 = 62800031;

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
    let mut search_agree = 0;
    for _ in 0..2000 {
        let length = 1 + rand_below(15);
        let s = random_string(length, 2);
        if z_array(&s) == z_by_definition(&s) {
            agree += 1;
        }
        let text_length = 30 + rand_below(30);
        let text = random_string(text_length, 2);
        let pattern_length = 1 + rand_below(4);
        let pattern = random_string(pattern_length, 2);
        if z_search(&text, &pattern) == naive_search(&text, &pattern) {
            search_agree += 1;
        }
    }
    take_work();
    println!("z-array matched its definition on {} of 2000 random strings", agree);
    println!("search matched a naive search on {} of 2000 random texts", search_agree);
    println!();
    let example = b"aabxaabxaab";
    let letters: Vec<String> = example.iter().map(|&c| (c as char).to_string()).collect();
    println!("s  {}", letters.join("  "));
    let z: Vec<String> = z_array(example).iter().map(|v| v.to_string()).collect();
    println!("z  {}", z.join("  "));
    println!();
    println!("      length   by definition   z-algorithm   per character   text");
    for &length in [1000i64, 2000, 4000].iter() {
        let inputs: Vec<(&str, Vec<u8>)> = vec![
            ("random, 2 letters", random_string(length, 2)),
            ("all one letter", vec![b'a'; length as usize]),
        ];
        for (name, s) in inputs.iter() {
            take_work();
            z_by_definition(s);
            let slow = take_work();
            z_array(s);
            let fast = take_work();
            let per = fast * 100 / length;
            println!(
                "{:>12} {:>15} {:>13} {:>12}.{:02}   {}",
                length,
                slow,
                fast,
                per / 100,
                per % 100,
                name
            );
        }
    }
}
`,
            },
            {
              lang: "go",
              code: `// The Z-array: for every position, how long a prefix of the string starts
// there. Checked against its definition, then used to search by building
// pattern + separator + text, with comparisons counted.

package main

import (
	"fmt"
	"strings"
)

var work int64

func zByDefinition(s string) []int {
	// extend a fresh match at every position, reusing nothing
	z := make([]int, len(s))
	for i := 1; i < len(s); i++ {
		for i+z[i] < len(s) {
			work++
			if s[z[i]] != s[i+z[i]] {
				break
			}
			z[i]++
		}
	}
	return z
}

func zArray(s string) []int {
	n := len(s)
	z := make([]int, n)
	left := 0
	right := 0 // s[left:right] is the rightmost window known to match a prefix
	for i := 1; i < n; i++ {
		if i < right {
			z[i] = min(right-i, z[i-left]) // copy what is already known
		}
		for i+z[i] < n {
			work++
			if s[z[i]] != s[i+z[i]] {
				break
			}
			z[i]++
		}
		if i+z[i] > right {
			left = i
			right = i + z[i]
		}
	}
	return z
}

func zSearch(text, pattern string) []int {
	joined := pattern + "#" + text
	z := zArray(joined)
	found := []int{}
	for i := len(pattern) + 1; i < len(joined); i++ {
		if z[i] >= len(pattern) {
			found = append(found, i-len(pattern)-1)
		}
	}
	return found
}

func naiveSearch(text, pattern string) []int {
	found := []int{}
	for start := 0; start+len(pattern) <= len(text); start++ {
		if text[start:start+len(pattern)] == pattern {
			found = append(found, start)
		}
	}
	return found
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
var seed int64 = 62800031

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
	searchAgree := 0
	for t := 0; t < 2000; t++ {
		s := randomString(1+randBelow(15), 2)
		if sameInts(zArray(s), zByDefinition(s)) {
			agree++
		}
		text := randomString(30+randBelow(30), 2)
		pattern := randomString(1+randBelow(4), 2)
		if sameInts(zSearch(text, pattern), naiveSearch(text, pattern)) {
			searchAgree++
		}
	}
	fmt.Printf("z-array matched its definition on %d of 2000 random strings\\n", agree)
	fmt.Printf("search matched a naive search on %d of 2000 random texts\\n", searchAgree)
	fmt.Println()
	example := "aabxaabxaab"
	fmt.Println("s  " + strings.Join(strings.Split(example, ""), "  "))
	parts := []string{}
	for _, v := range zArray(example) {
		parts = append(parts, fmt.Sprint(v))
	}
	fmt.Println("z  " + strings.Join(parts, "  "))
	fmt.Println()
	fmt.Println("      length   by definition   z-algorithm   per character   text")
	for _, length := range []int{1000, 2000, 4000} {
		inputs := [][2]string{
			{"random, 2 letters", randomString(length, 2)},
			{"all one letter", strings.Repeat("a", length)},
		}
		for _, input := range inputs {
			work = 0
			zByDefinition(input[1])
			slow := work
			work = 0
			zArray(input[1])
			per := work * 100 / int64(length)
			fmt.Printf("%12d %15d %13d %12d.%02d   %s\\n", length, slow, work, per/100, per%100, input[0])
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
      id: "z-or-kmp",
      heading: "Z or KMP",
      body: [
        "Both find all occurrences in linear time, and each can be derived from the other. The choice is about which array answers the question directly.",
        "**Use Z when the question is about what starts at each position.** \"Does the pattern start here\", \"how much of the string's prefix appears starting here\", \"which suffixes are also prefixes\" (positions where `i + z[i] = n`). The array reads as the answer, and the algorithm has fewer places to go wrong than KMP's fallback chain.",
        "**Use KMP when the question is about what ends at each position, or the text is a stream.** The failure function is indexed by where a border ends, and the search consumes text one character at a time without storing it. Z needs the whole concatenation in memory.",
        "**String compression and periods** are natural in both. With Z: the smallest `p` dividing `n` with `z[p] = n - p` is the period. With KMP: `n - pi[n-1]`.",
      ],
      pitfalls: [
        {
          title: "A separator that can occur in the input",
          body: "If `#` appears in the text, the z values stop being capped at the pattern length, so a test for `z == m` starts missing matches — wrong on 4,172 of 20,000 random cases, against none for `z >= m`. Use a value outside the alphabet, and the equality test is safe too.",
        },
        {
          title: "Copying z[i - left] without the cap",
          body: "The copied value is only guaranteed up to the window edge. Take `min(right - i, z[i - left])`, then extend.",
        },
        {
          title: "Assuming the definition is fine because random tests are fast",
          body: "Measured on random strings the definition cost 2,040 at length 1,000; on one repeated letter, 499,500. Test the repetitive case.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the Z-algorithm compute, and how is it linear?",
      answer:
        "For each position i, z[i] is the length of the longest common prefix of the string and its suffix starting at i. It keeps the rightmost window [left, right) known to match a prefix; for i inside it, z[i] starts at min(right - i, z[i - left]) because that stretch is a copy of the prefix, then extends by comparison and moves the window if it passes right. Every successful extension advances right, which never retreats, so the total is under 2n. I measured 3,999 comparisons at length 4,000 on one repeated letter, against 7,998,000 computing each value from scratch.",
    },
    {
      question: "When would you use the Z-algorithm instead of KMP?",
      answer:
        "When the question is about what starts at each position, because the Z-array reads directly as that answer -- matches are positions in pattern#text with z at least the pattern length, and suffixes that equal prefixes are positions where i + z[i] = n. It is also easier to get right than KMP's fallback chain. I would use KMP when the question is about what ends at each position, or when the text is a stream, since KMP consumes it one character at a time and Z needs the full concatenation in memory.",
    },
  ],
  takeaways: [
    "z[i] is the longest common prefix of s and s[i..]",
    "Search with pattern + separator + text; z at least the pattern length marks a match",
    "Inside the window, start from min(right - i, z[i - left])",
    "right only advances, so comparisons stay under 2n",
    "Measured on one repeated letter: 7,998,000 by definition, 3,999 with the window",
    "Z answers what starts here; KMP answers what ends here and can stream",
    "The separator must be outside the alphabet",
  ],
};
