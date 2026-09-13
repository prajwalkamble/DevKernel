import type { Lesson } from "@/content/types";

export const rabinKarpLesson: Lesson = {
  id: "dsa-advanced-algorithms-rabin-karp",
  slug: "rabin-karp",
  moduleSlug: "advanced-algorithms",
  title: "Rabin-Karp, Rolling Hashes, and Collisions",
  summary:
    "A polynomial hash of a window can be updated in constant time as the window slides, so every window is compared by one number. Measured: 205 of 211 hash hits were false with a modulus of 101; trusting hashes without checking undercounted distinct substrings by 41 with a modulus of about a million.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Define a polynomial hash and roll it across a text in constant time per step",
    "Verify hash hits and measure how many are spurious as the modulus changes",
    "Measure the wrong answers produced by trusting hashes",
    "Choose moduli and bases that keep collisions manageable",
  ],
  sections: [
    {
      id: "the-rolling-hash",
      heading: "The rolling hash",
      body: [
        "Treat a window of `m` characters as a number in base `B`, reduced modulo a prime `M`: `h = (c0\u00b7B^(m-1) + c1\u00b7B^(m-2) + ... + c(m-1)) mod M`.",
        "Sliding the window one step removes the leftmost character and appends a new one: subtract `c0\u00b7B^(m-1)`, multiply by `B`, add the new character, reduce. With `B^(m-1) mod M` precomputed, each step is constant time, so the hashes of all `n - m + 1` windows cost `O(n)`.",
        "**Rabin-Karp search** compares each window's hash with the pattern's hash, and compares characters only when the two hashes are equal. Equal strings always have equal hashes; unequal strings can too, which is a **collision**.",
        "Subtraction under a modulus can go negative. Add `M` before reducing, as the program does.",
      ],
    },
    {
      id: "measured",
      heading: "What collisions cost",
      body: [
        "The program measures collisions in two uses of the same rolling hash: a search that verifies every hit, and a distinct-substring count that trusts the hashes.",
      ],
      examples: [
        {
          id: "rolling-hash-collisions",
          title: "Spurious hits by modulus during a search, then an undercount from trusting hashes",
          lang: "python",
          code: `# Rabin-Karp compares a rolling hash of each window with the pattern's hash,
# and only compares characters when the hashes agree. Two measurements of what
# a collision costs: extra checking during a search, and wrong answers when
# the hash is trusted without checking.

BASE = 131


def window_hashes(s, length, modulus):
    # hash of s[i:i+length] for every i, each step O(1)
    top = 1
    for _ in range(length - 1):
        top = top * BASE % modulus
    h = 0
    for i in range(length):
        h = (h * BASE + ord(s[i])) % modulus
    out = [h]
    for i in range(length, len(s)):
        h = (h - ord(s[i - length]) * top % modulus + modulus) % modulus   # drop the left character
        h = (h * BASE + ord(s[i])) % modulus                               # append the right one
        out.append(h)
    return out


def string_hash(s, modulus):
    h = 0
    for ch in s:
        h = (h * BASE + ord(ch)) % modulus
    return h


# The same linear congruential generator in every language, so the strings
# below are the same strings whichever translation is run.
seed = 70300043


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_string(length, alphabet):
    out = ""
    for _ in range(length):
        out += chr(97 + rand(alphabet))
    return out


TEXT = 20000
text = random_string(TEXT, 2)
pattern = text[5000:5012]
print("search: text of %d characters over 2 letters, pattern of %d" % (TEXT, len(pattern)))
print()
print("   modulus   hash hits   real matches   spurious hits   characters checked")
for modulus in [101, 10007, 1000003, 1000000007]:
    target = string_hash(pattern, modulus)
    hits = 0
    real = 0
    checked = 0
    for start, h in enumerate(window_hashes(text, len(pattern), modulus)):
        if h != target:
            continue
        hits += 1
        j = 0
        while j < len(pattern):
            checked += 1
            if text[start + j] != pattern[j]:
                break
            j += 1
        if j == len(pattern):
            real += 1
    print("%10d %11d %14d %15d %20d" % (modulus, hits, real, hits - real, checked))
print()

LENGTH = 16
print("counting distinct substrings of length %d without comparing them," % LENGTH)
print("by counting distinct hashes")
print()
exact = {}
for i in range(TEXT - LENGTH + 1):
    exact[text[i:i + LENGTH]] = True
print("   modulus   distinct hashes   true distinct   undercount")
for modulus in [1000003, 1000000007]:
    seen = {}
    for h in window_hashes(text, LENGTH, modulus):
        seen[h] = True
    print("%10d %17d %15d %12d" % (modulus, len(seen), len(exact), len(exact) - len(seen)))
first = window_hashes(text, LENGTH, 1000000007)
second = window_hashes(text, LENGTH, 998244353)
pairs = {}
for i in range(len(first)):
    pairs[str(first[i]) + "," + str(second[i])] = True
print("%10s %17d %15d %12d" % ("two hashes", len(pairs), len(exact), len(exact) - len(pairs)))
`,
          output: `search: text of 20000 characters over 2 letters, pattern of 12

   modulus   hash hits   real matches   spurious hits   characters checked
       101         211              6             205                  499
     10007           6              6               0                   72
   1000003           6              6               0                   72
1000000007           6              6               0                   72

counting distinct substrings of length 16 without comparing them,
by counting distinct hashes

   modulus   distinct hashes   true distinct   undercount
   1000003             17248           17289           41
1000000007             17289           17289            0
two hashes             17289           17289            0`,
          explanation:
            "With a modulus of 101 the search found 211 windows whose hash equalled the pattern's, and 205 of them were not matches: verification examined 499 characters instead of 72. From a modulus of 10,007 upward there were no spurious hits and only the 6 real matches were checked. The second table trusts the hashes. Counting distinct hashes of the 16-character windows reported 17,248 distinct substrings with a modulus of 1,000,003, which is 41 fewer than the true 17,289. With 1,000,000,007, and with two independent hashes, the count was exact.",
          alternates: [
            {
              lang: "javascript",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

const BASE = 131;

function windowHashes(s, length, modulus) {
  // hash of s[i:i+length] for every i, each step O(1)
  let top = 1;
  for (let i = 0; i < length - 1; i++) top = (top * BASE) % modulus;
  let h = 0;
  for (let i = 0; i < length; i++) h = (h * BASE + s.charCodeAt(i)) % modulus;
  const out = [h];
  for (let i = length; i < s.length; i++) {
    h = (h - ((s.charCodeAt(i - length) * top) % modulus) + modulus) % modulus; // drop the left character
    h = (h * BASE + s.charCodeAt(i)) % modulus; // append the right one
    out.push(h);
  }
  return out;
}

function stringHash(s, modulus) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * BASE + s.charCodeAt(i)) % modulus;
  return h;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 70300043n;

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

const TEXT = 20000;
const text = randomString(TEXT, 2);
const pattern = text.slice(5000, 5012);
console.log(
  "search: text of " + TEXT + " characters over 2 letters, pattern of " + pattern.length,
);
console.log();
console.log("   modulus   hash hits   real matches   spurious hits   characters checked");
for (const modulus of [101, 10007, 1000003, 1000000007]) {
  const target = stringHash(pattern, modulus);
  let hits = 0;
  let real = 0;
  let checked = 0;
  const hashes = windowHashes(text, pattern.length, modulus);
  for (let start = 0; start < hashes.length; start++) {
    if (hashes[start] !== target) continue;
    hits += 1;
    let j = 0;
    while (j < pattern.length) {
      checked += 1;
      if (text[start + j] !== pattern[j]) break;
      j += 1;
    }
    if (j === pattern.length) real += 1;
  }
  console.log(
    padLeft(modulus, 10) + " " + padLeft(hits, 11) + " " + padLeft(real, 14) + " " +
      padLeft(hits - real, 15) + " " + padLeft(checked, 20),
  );
}
console.log();

const LENGTH = 16;
console.log("counting distinct substrings of length " + LENGTH + " without comparing them,");
console.log("by counting distinct hashes");
console.log();
const exact = new Set();
for (let i = 0; i + LENGTH <= TEXT; i++) exact.add(text.slice(i, i + LENGTH));
console.log("   modulus   distinct hashes   true distinct   undercount");
for (const modulus of [1000003, 1000000007]) {
  const seen = new Set(windowHashes(text, LENGTH, modulus));
  console.log(
    padLeft(modulus, 10) + " " + padLeft(seen.size, 17) + " " + padLeft(exact.size, 15) + " " +
      padLeft(exact.size - seen.size, 12),
  );
}
const first = windowHashes(text, LENGTH, 1000000007);
const second = windowHashes(text, LENGTH, 998244353);
const pairs = new Set();
for (let i = 0; i < first.length; i++) pairs.add(first[i] + "," + second[i]);
console.log(
  padLeft("two hashes", 10) + " " + padLeft(pairs.size, 17) + " " + padLeft(exact.size, 15) +
    " " + padLeft(exact.size - pairs.size, 12),
);
`,
            },
            {
              lang: "typescript",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

const BASE = 131;

function windowHashes(s: string, length: number, modulus: number): number[] {
  // hash of s[i:i+length] for every i, each step O(1)
  let top = 1;
  for (let i = 0; i < length - 1; i++) top = (top * BASE) % modulus;
  let h = 0;
  for (let i = 0; i < length; i++) h = (h * BASE + s.charCodeAt(i)) % modulus;
  const out = [h];
  for (let i = length; i < s.length; i++) {
    h = (h - ((s.charCodeAt(i - length) * top) % modulus) + modulus) % modulus; // drop the left character
    h = (h * BASE + s.charCodeAt(i)) % modulus; // append the right one
    out.push(h);
  }
  return out;
}

function stringHash(s: string, modulus: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * BASE + s.charCodeAt(i)) % modulus;
  return h;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 70300043n;

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

const TEXT = 20000;
const text = randomString(TEXT, 2);
const pattern = text.slice(5000, 5012);
console.log(
  "search: text of " + TEXT + " characters over 2 letters, pattern of " + pattern.length,
);
console.log();
console.log("   modulus   hash hits   real matches   spurious hits   characters checked");
for (const modulus of [101, 10007, 1000003, 1000000007]) {
  const target = stringHash(pattern, modulus);
  let hits = 0;
  let real = 0;
  let checked = 0;
  const hashes = windowHashes(text, pattern.length, modulus);
  for (let start = 0; start < hashes.length; start++) {
    if (hashes[start] !== target) continue;
    hits += 1;
    let j = 0;
    while (j < pattern.length) {
      checked += 1;
      if (text[start + j] !== pattern[j]) break;
      j += 1;
    }
    if (j === pattern.length) real += 1;
  }
  console.log(
    padLeft(modulus, 10) + " " + padLeft(hits, 11) + " " + padLeft(real, 14) + " " +
      padLeft(hits - real, 15) + " " + padLeft(checked, 20),
  );
}
console.log();

const LENGTH = 16;
console.log("counting distinct substrings of length " + LENGTH + " without comparing them,");
console.log("by counting distinct hashes");
console.log();
const exact = new Set<string>();
for (let i = 0; i + LENGTH <= TEXT; i++) exact.add(text.slice(i, i + LENGTH));
console.log("   modulus   distinct hashes   true distinct   undercount");
for (const modulus of [1000003, 1000000007]) {
  const seen = new Set(windowHashes(text, LENGTH, modulus));
  console.log(
    padLeft(modulus, 10) + " " + padLeft(seen.size, 17) + " " + padLeft(exact.size, 15) + " " +
      padLeft(exact.size - seen.size, 12),
  );
}
const first = windowHashes(text, LENGTH, 1000000007);
const second = windowHashes(text, LENGTH, 998244353);
const pairs = new Set<string>();
for (let i = 0; i < first.length; i++) pairs.add(first[i] + "," + second[i]);
console.log(
  padLeft("two hashes", 10) + " " + padLeft(pairs.size, 17) + " " + padLeft(exact.size, 15) +
    " " + padLeft(exact.size - pairs.size, 12),
);
`,
            },
            {
              lang: "java",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

import java.util.HashSet;
import java.util.Set;

public class Main {
  static final long BASE = 131;

  static long[] windowHashes(String s, int length, long modulus) {
    // hash of s[i:i+length] for every i, each step O(1)
    long top = 1;
    for (int i = 0; i < length - 1; i++) {
      top = top * BASE % modulus;
    }
    long h = 0;
    for (int i = 0; i < length; i++) {
      h = (h * BASE + s.charAt(i)) % modulus;
    }
    long[] out = new long[s.length() - length + 1];
    out[0] = h;
    for (int i = length; i < s.length(); i++) {
      h = (h - s.charAt(i - length) * top % modulus + modulus) % modulus; // drop the left character
      h = (h * BASE + s.charAt(i)) % modulus; // append the right one
      out[i - length + 1] = h;
    }
    return out;
  }

  static long stringHash(String s, long modulus) {
    long h = 0;
    for (int i = 0; i < s.length(); i++) {
      h = (h * BASE + s.charAt(i)) % modulus;
    }
    return h;
  }

  // The same linear congruential generator in every language, so the strings
  // below are the same strings whichever translation is run.
  static long seed = 70300043L;

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
    final int textLength = 20000;
    String text = randomString(textLength, 2);
    String pattern = text.substring(5000, 5012);
    System.out.printf(
        "search: text of %d characters over 2 letters, pattern of %d%n", textLength, pattern.length());
    System.out.println();
    System.out.println("   modulus   hash hits   real matches   spurious hits   characters checked");
    long[] moduli = {101, 10007, 1000003, 1000000007};
    for (long modulus : moduli) {
      long target = stringHash(pattern, modulus);
      int hits = 0;
      int real = 0;
      int checked = 0;
      long[] hashes = windowHashes(text, pattern.length(), modulus);
      for (int start = 0; start < hashes.length; start++) {
        if (hashes[start] != target) {
          continue;
        }
        hits += 1;
        int j = 0;
        while (j < pattern.length()) {
          checked += 1;
          if (text.charAt(start + j) != pattern.charAt(j)) {
            break;
          }
          j += 1;
        }
        if (j == pattern.length()) {
          real += 1;
        }
      }
      System.out.printf("%10d %11d %14d %15d %20d%n", modulus, hits, real, hits - real, checked);
    }
    System.out.println();

    final int length = 16;
    System.out.printf("counting distinct substrings of length %d without comparing them,%n", length);
    System.out.println("by counting distinct hashes");
    System.out.println();
    Set<String> exact = new HashSet<>();
    for (int i = 0; i + length <= textLength; i++) {
      exact.add(text.substring(i, i + length));
    }
    System.out.println("   modulus   distinct hashes   true distinct   undercount");
    long[] bigger = {1000003, 1000000007};
    for (long modulus : bigger) {
      Set<Long> seen = new HashSet<>();
      for (long h : windowHashes(text, length, modulus)) {
        seen.add(h);
      }
      System.out.printf(
          "%10d %17d %15d %12d%n", modulus, seen.size(), exact.size(), exact.size() - seen.size());
    }
    long[] first = windowHashes(text, length, 1000000007);
    long[] second = windowHashes(text, length, 998244353);
    Set<String> pairs = new HashSet<>();
    for (int i = 0; i < first.length; i++) {
      pairs.add(first[i] + "," + second[i]);
    }
    System.out.printf(
        "%10s %17d %15d %12d%n", "two hashes", pairs.size(), exact.size(), exact.size() - pairs.size());
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

#include <cstdio>
#include <set>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

static const long long BASE = 131;

std::vector<long long> windowHashes(const std::string& s, int length, long long modulus) {
  // hash of s[i:i+length] for every i, each step O(1)
  long long top = 1;
  for (int i = 0; i < length - 1; i++) {
    top = top * BASE % modulus;
  }
  long long h = 0;
  for (int i = 0; i < length; i++) {
    h = (h * BASE + s[i]) % modulus;
  }
  std::vector<long long> out(1, h);
  for (int i = length; i < (int)s.size(); i++) {
    h = (h - s[i - length] * top % modulus + modulus) % modulus;  // drop the left character
    h = (h * BASE + s[i]) % modulus;                               // append the right one
    out.push_back(h);
  }
  return out;
}

long long stringHash(const std::string& s, long long modulus) {
  long long h = 0;
  for (char ch : s) {
    h = (h * BASE + ch) % modulus;
  }
  return h;
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
long long seed = 70300043LL;

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
  const int textLength = 20000;
  std::string text = randomString(textLength, 2);
  std::string pattern = text.substr(5000, 12);
  std::printf("search: text of %d characters over 2 letters, pattern of %d\\n", textLength,
              (int)pattern.size());
  std::printf("\\n");
  std::printf("   modulus   hash hits   real matches   spurious hits   characters checked\\n");
  long long moduli[4] = {101, 10007, 1000003, 1000000007};
  for (long long modulus : moduli) {
    long long target = stringHash(pattern, modulus);
    int hits = 0;
    int real = 0;
    int checked = 0;
    std::vector<long long> hashes = windowHashes(text, (int)pattern.size(), modulus);
    for (int start = 0; start < (int)hashes.size(); start++) {
      if (hashes[start] != target) {
        continue;
      }
      hits += 1;
      size_t j = 0;
      while (j < pattern.size()) {
        checked += 1;
        if (text[start + j] != pattern[j]) {
          break;
        }
        j += 1;
      }
      if (j == pattern.size()) {
        real += 1;
      }
    }
    std::printf("%10lld %11d %14d %15d %20d\\n", modulus, hits, real, hits - real, checked);
  }
  std::printf("\\n");

  const int length = 16;
  std::printf("counting distinct substrings of length %d without comparing them,\\n", length);
  std::printf("by counting distinct hashes\\n");
  std::printf("\\n");
  std::unordered_set<std::string> exact;
  for (int i = 0; i + length <= textLength; i++) {
    exact.insert(text.substr(i, length));
  }
  std::printf("   modulus   distinct hashes   true distinct   undercount\\n");
  long long bigger[2] = {1000003, 1000000007};
  for (long long modulus : bigger) {
    std::vector<long long> hashes = windowHashes(text, length, modulus);
    std::unordered_set<long long> seen(hashes.begin(), hashes.end());
    std::printf("%10lld %17d %15d %12d\\n", modulus, (int)seen.size(), (int)exact.size(),
                (int)exact.size() - (int)seen.size());
  }
  std::vector<long long> first = windowHashes(text, length, 1000000007);
  std::vector<long long> second = windowHashes(text, length, 998244353);
  std::set<std::pair<long long, long long> > pairs;
  for (size_t i = 0; i < first.size(); i++) {
    pairs.insert(std::make_pair(first[i], second[i]));
  }
  std::printf("%10s %17d %15d %12d\\n", "two hashes", (int)pairs.size(), (int)exact.size(),
              (int)exact.size() - (int)pairs.size());
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

use std::collections::HashSet;

const BASE: i64 = 131;

fn window_hashes(s: &[u8], length: usize, modulus: i64) -> Vec<i64> {
    // hash of s[i..i+length] for every i, each step O(1)
    let mut top = 1;
    for _ in 0..length - 1 {
        top = top * BASE % modulus;
    }
    let mut h = 0;
    for i in 0..length {
        h = (h * BASE + s[i] as i64) % modulus;
    }
    let mut out = vec![h];
    for i in length..s.len() {
        h = (h - s[i - length] as i64 * top % modulus + modulus) % modulus; // drop the left character
        h = (h * BASE + s[i] as i64) % modulus; // append the right one
        out.push(h);
    }
    out
}

fn string_hash(s: &[u8], modulus: i64) -> i64 {
    let mut h = 0;
    for &ch in s {
        h = (h * BASE + ch as i64) % modulus;
    }
    h
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
static mut SEED: i64 = 70300043;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn random_string(length: usize, alphabet: i64) -> Vec<u8> {
    (0..length).map(|_| (97 + rand_below(alphabet)) as u8).collect()
}

fn main() {
    let text_length = 20000;
    let text = random_string(text_length, 2);
    let pattern = text[5000..5012].to_vec();
    println!(
        "search: text of {} characters over 2 letters, pattern of {}",
        text_length,
        pattern.len()
    );
    println!();
    println!("   modulus   hash hits   real matches   spurious hits   characters checked");
    for &modulus in [101i64, 10007, 1000003, 1000000007].iter() {
        let target = string_hash(&pattern, modulus);
        let mut hits = 0;
        let mut real = 0;
        let mut checked = 0;
        for (start, &h) in window_hashes(&text, pattern.len(), modulus).iter().enumerate() {
            if h != target {
                continue;
            }
            hits += 1;
            let mut j = 0;
            while j < pattern.len() {
                checked += 1;
                if text[start + j] != pattern[j] {
                    break;
                }
                j += 1;
            }
            if j == pattern.len() {
                real += 1;
            }
        }
        println!("{:>10} {:>11} {:>14} {:>15} {:>20}", modulus, hits, real, hits - real, checked);
    }
    println!();

    let length = 16;
    println!("counting distinct substrings of length {} without comparing them,", length);
    println!("by counting distinct hashes");
    println!();
    let mut exact: HashSet<&[u8]> = HashSet::new();
    for i in 0..=text_length - length {
        exact.insert(&text[i..i + length]);
    }
    println!("   modulus   distinct hashes   true distinct   undercount");
    for &modulus in [1000003i64, 1000000007].iter() {
        let seen: HashSet<i64> = window_hashes(&text, length, modulus).into_iter().collect();
        println!(
            "{:>10} {:>17} {:>15} {:>12}",
            modulus,
            seen.len(),
            exact.len(),
            exact.len() - seen.len()
        );
    }
    let first = window_hashes(&text, length, 1000000007);
    let second = window_hashes(&text, length, 998244353);
    let pairs: HashSet<(i64, i64)> = first.iter().cloned().zip(second.iter().cloned()).collect();
    println!(
        "{:>10} {:>17} {:>15} {:>12}",
        "two hashes",
        pairs.len(),
        exact.len(),
        exact.len() - pairs.len()
    );
}
`,
            },
            {
              lang: "go",
              code: `// Rabin-Karp compares a rolling hash of each window with the pattern's hash,
// and only compares characters when the hashes agree. Two measurements of what
// a collision costs: extra checking during a search, and wrong answers when
// the hash is trusted without checking.

package main

import "fmt"

const base = 131

func windowHashes(s string, length int, modulus int64) []int64 {
	// hash of s[i:i+length] for every i, each step O(1)
	var top int64 = 1
	for i := 0; i < length-1; i++ {
		top = top * base % modulus
	}
	var h int64
	for i := 0; i < length; i++ {
		h = (h*base + int64(s[i])) % modulus
	}
	out := []int64{h}
	for i := length; i < len(s); i++ {
		h = (h - int64(s[i-length])*top%modulus + modulus) % modulus // drop the left character
		h = (h*base + int64(s[i])) % modulus                         // append the right one
		out = append(out, h)
	}
	return out
}

func stringHash(s string, modulus int64) int64 {
	var h int64
	for i := 0; i < len(s); i++ {
		h = (h*base + int64(s[i])) % modulus
	}
	return h
}

// The same linear congruential generator in every language, so the strings
// below are the same strings whichever translation is run.
var seed int64 = 70300043

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
	const textLength = 20000
	text := randomString(textLength, 2)
	pattern := text[5000:5012]
	fmt.Printf("search: text of %d characters over 2 letters, pattern of %d\\n", textLength, len(pattern))
	fmt.Println()
	fmt.Println("   modulus   hash hits   real matches   spurious hits   characters checked")
	for _, modulus := range []int64{101, 10007, 1000003, 1000000007} {
		target := stringHash(pattern, modulus)
		hits := 0
		real := 0
		checked := 0
		for start, h := range windowHashes(text, len(pattern), modulus) {
			if h != target {
				continue
			}
			hits++
			j := 0
			for j < len(pattern) {
				checked++
				if text[start+j] != pattern[j] {
					break
				}
				j++
			}
			if j == len(pattern) {
				real++
			}
		}
		fmt.Printf("%10d %11d %14d %15d %20d\\n", modulus, hits, real, hits-real, checked)
	}
	fmt.Println()

	const length = 16
	fmt.Printf("counting distinct substrings of length %d without comparing them,\\n", length)
	fmt.Println("by counting distinct hashes")
	fmt.Println()
	exact := map[string]bool{}
	for i := 0; i+length <= textLength; i++ {
		exact[text[i:i+length]] = true
	}
	fmt.Println("   modulus   distinct hashes   true distinct   undercount")
	for _, modulus := range []int64{1000003, 1000000007} {
		seen := map[int64]bool{}
		for _, h := range windowHashes(text, length, modulus) {
			seen[h] = true
		}
		fmt.Printf("%10d %17d %15d %12d\\n", modulus, len(seen), len(exact), len(exact)-len(seen))
	}
	first := windowHashes(text, length, 1000000007)
	second := windowHashes(text, length, 998244353)
	pairs := map[[2]int64]bool{}
	for i := range first {
		pairs[[2]int64{first[i], second[i]}] = true
	}
	fmt.Printf("%10s %17d %15d %12d\\n", "two hashes", len(pairs), len(exact), len(exact)-len(pairs))
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "planning-for-collisions",
      heading: "Planning for collisions",
      body: [
        "The two tables show two different risks, and they call for different defences.",
        "**When hits are verified, collisions cost time, not correctness.** Each spurious hit costs up to `m` character comparisons. A modulus too small for the number of windows turns Rabin-Karp into a naive search, as the modulus-101 row nearly does.",
        "**When hashes are trusted, collisions cost correctness.** Counting distinct substrings, detecting duplicate windows, or comparing substrings by hash all silently merge unequal strings. The chance of some collision among `k` distinct strings becomes large once `k` approaches the square root of the modulus \u2014 about 1,000 for a modulus near a million. The measurement had 17,289 distinct strings, far past that point, and 41 were lost.",
        "Defences, in order of strength:",
        "**A large prime modulus.** Near `10^9` the square-root point is about 31,600; in 64-bit arithmetic, products of two such values still fit.",
        "**Two independent hashes** with different moduli, compared as a pair. The measurement's double hash was exact; the collision probability is roughly the product of the two.",
        "**A random base chosen at run time.** A fixed base and modulus can be attacked: inputs can be constructed to collide. Hashing modulo `2^64` by letting integers overflow is known to be broken for any base by strings built from the Thue\u2013Morse sequence. A randomly chosen base against a prime modulus defeats inputs prepared in advance.",
      ],
      pitfalls: [
        {
          title: "Skipping verification in a search",
          body: "Every spurious hit becomes a reported match. With a modulus of 101 that would have been 205 wrong answers out of 211.",
        },
        {
          title: "Trusting hashes for equality with a modulus near a million",
          body: "Measured: 41 distinct substrings lost among 17,289. Use a modulus near 10^9 or a pair of hashes.",
        },
        {
          title: "Negative values after subtracting the outgoing character",
          body: "In most languages `%` keeps the sign of the dividend. Add the modulus before taking the remainder.",
        },
      ],
    },
    {
      id: "where-it-wins",
      heading: "Where Rabin-Karp is the right tool",
      body: [
        "For a single pattern, KMP and Z give a linear worst case with no probability involved. Rabin-Karp earns its place in problems those algorithms do not fit:",
        "**Many patterns of the same length.** Put all pattern hashes in a hash set and check each window against the set: one pass for any number of patterns.",
        "**Comparing arbitrary substrings.** With prefix hashes `H[i]`, the hash of any `s[l..r]` is available in constant time, so two substrings can be compared in `O(1)`. Combined with binary search this finds the longest repeated substring or the longest common substring in `O(n log n)`.",
        "**Two-dimensional matching.** Hash each row's windows, then roll a second hash down the columns of row hashes.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does Rabin-Karp work, and what can go wrong?",
      answer:
        "It keeps a polynomial hash of the current window modulo a prime, updated in constant time as the window slides: subtract the outgoing character times B^(m-1), multiply by B, add the incoming character. Windows whose hash equals the pattern's are verified character by character. What goes wrong is collisions. With a modulus of 101 I measured 211 hash hits of which 205 were false, so verification did most of the work; from 10,007 upward there were none on a 20,000-character text. The algorithm stays correct as long as hits are verified -- collisions only cost time.",
    },
    {
      question: "When is it unsafe to compare strings by hash alone?",
      answer:
        "Once the number of distinct strings approaches the square root of the modulus, some collision becomes likely, and trusting the hash silently merges unequal strings. I counted distinct 16-character substrings by hash: with a modulus of 1,000,003 the count was 41 short of the true 17,289, while 10^9+7 and a pair of independent hashes were exact. So use a modulus near 10^9 or two hashes, and choose the base randomly at run time, because a fixed base and modulus can be attacked -- overflow hashing modulo 2^64 is known to collide on Thue-Morse strings for any base.",
    },
  ],
  takeaways: [
    "A window hash rolls in constant time: remove, multiply, add, reduce",
    "Verified hits make collisions cost time; trusted hashes make them cost correctness",
    "Measured with modulus 101: 205 of 211 hits spurious",
    "Measured with modulus 1,000,003: 41 distinct substrings lost among 17,289",
    "Collisions become likely near the square root of the modulus",
    "Use a modulus near 10^9, or two hashes, and a random base",
    "Rabin-Karp's niche: many equal-length patterns and constant-time substring comparison",
  ],
};
