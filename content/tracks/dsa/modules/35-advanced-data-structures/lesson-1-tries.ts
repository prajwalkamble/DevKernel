import type { Lesson } from "@/content/types";

export const triesLesson: Lesson = {
  id: "dsa-advanced-structures-tries",
  slug: "tries",
  moduleSlug: "advanced-data-structures",
  title: "Tries: Prefix Search, Autocomplete, and the Memory Trade",
  summary:
    "A tree keyed by characters answers a prefix question in time proportional to the prefix, not to the number of words. Measured: 2 characters examined per query against 49 for binary search and 2,324 for a scan — paid for with up to 197,340 child slots for 11,039 stored characters.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Build a trie with a per-node count and answer prefix counts from it",
    "Compare a trie against scanning and against binary search on a sorted list",
    "Measure how node count depends on how much the words share",
    "Choose a child representation by alphabet size",
  ],
  sections: [
    {
      id: "the-structure",
      heading: "The structure",
      body: [
        "A trie stores a set of strings as a tree whose edges are characters. The root is the empty string; the node reached by following `c`, `a`, `t` represents the prefix `cat`. Every word is a path from the root.",
        "Two things are stored per node beyond its children. A **passing count** \u2014 how many inserted words go through this node \u2014 answers \"how many words start with this prefix\". An **end marker** or end count answers \"is this exact string a word\". Without the end marker, `car` and `cart` are indistinguishable at the node for `car`.",
        "Insertion walks the word, creating missing children, and increments the passing count of every node on the path. A prefix query walks the prefix and reads one count. Neither operation looks at any other word, which is the entire point.",
      ],
    },
    {
      id: "measured",
      heading: "Prefix counts, three ways",
      body: [
        "The program counts words by prefix with a linear scan, with two binary searches on a sorted copy of the list, and with a trie, counting every character examined. Then it builds tries over the same number of characters with alphabets of 2, 4 and 26 letters.",
      ],
      examples: [
        {
          id: "prefix-counts-three-ways",
          title: "Scan, binary search and a trie on the same prefix queries, then trie size by alphabet",
          lang: "python",
          code: `# Counting the words that start with a prefix, three ways: scan every word,
# binary search a sorted list, and walk a trie. Then the memory the trie
# spends to do it, which depends on how much the words share.

WORDS = 2000
QUERIES = 2000

# The same linear congruential generator in every language, so the words
# below are the same words whichever translation is run.
seed = 70010023


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def make_words(alphabet):
    words = []
    for _ in range(WORDS):
        length = 3 + rand(6)
        word = ""
        for _ in range(length):
            word += chr(97 + rand(alphabet))
        words.append(word)
    return words


work = [0]


def starts_with(word, prefix):
    if len(word) < len(prefix):
        return False
    for i in range(len(prefix)):
        work[0] += 1
        if word[i] != prefix[i]:
            return False
    return True


def by_scan(words, prefix):
    count = 0
    for word in words:
        if starts_with(word, prefix):
            count += 1
    return count


def compare(a, b):
    # -1, 0 or 1, counting one unit per character examined
    i = 0
    while i < len(a) and i < len(b):
        work[0] += 1
        if a[i] != b[i]:
            return -1 if a[i] < b[i] else 1
        i += 1
    if len(a) == len(b):
        return 0
    return -1 if len(a) < len(b) else 1


def lower_bound(ordered, key):
    lo = 0
    hi = len(ordered)
    while lo < hi:
        mid = (lo + hi) // 2
        if compare(ordered[mid], key) < 0:
            lo = mid + 1
        else:
            hi = mid
    return lo


def by_binary_search(ordered, prefix):
    # every word with the prefix sorts between the prefix itself and the
    # prefix followed by a character larger than any letter
    return lower_bound(ordered, prefix + "{") - lower_bound(ordered, prefix)


def build_trie(words):
    children = [[-1] * 26]
    passing = [0]
    for word in words:
        node = 0
        passing[0] += 1
        for ch in word:
            c = ord(ch) - 97
            if children[node][c] == -1:
                children[node][c] = len(children)
                children.append([-1] * 26)
                passing.append(0)
            node = children[node][c]
            passing[node] += 1
    return children, passing


def by_trie(children, passing, prefix):
    node = 0
    for ch in prefix:
        work[0] += 1
        node = children[node][ord(ch) - 97]
        if node == -1:
            return 0
    return passing[node]


words = make_words(4)
ordered = sorted(words)
children, passing = build_trie(words)
prefixes = []
for _ in range(QUERIES):
    length = 1 + rand(4)
    prefix = ""
    for _ in range(length):
        prefix += chr(97 + rand(4))
    prefixes.append(prefix)

agree = 0
cost = [0, 0, 0]
for prefix in prefixes:
    work[0] = 0
    a = by_scan(words, prefix)
    cost[0] += work[0]
    work[0] = 0
    b = by_binary_search(ordered, prefix)
    cost[1] += work[0]
    work[0] = 0
    c = by_trie(children, passing, prefix)
    cost[2] += work[0]
    if a == b and b == c:
        agree += 1

print("%d words over the letters a-d, %d prefix queries" % (WORDS, QUERIES))
print("all three gave the same count on %d of %d queries" % (agree, QUERIES))
print()
print("method              characters examined per query")
print("scan every word     %10d" % (cost[0] // QUERIES))
print("binary search       %10d" % (cost[1] // QUERIES))
print("walk the trie       %10d" % (cost[2] // QUERIES))
print()
print("alphabet   characters stored   trie nodes   nodes per character   child slots")
for alphabet in [2, 4, 26]:
    sample = make_words(alphabet)
    stored = 0
    for word in sample:
        stored += len(word)
    kids, _ = build_trie(sample)
    nodes = len(kids) - 1
    share = nodes * 100 // stored
    print("%8d %19d %12d %18d.%02d %13d" % (alphabet, stored, nodes, share // 100, share % 100, nodes * 26))
`,
          output: `2000 words over the letters a-d, 2000 prefix queries
all three gave the same count on 2000 of 2000 queries

method              characters examined per query
scan every word           2324
binary search               49
walk the trie                2

alphabet   characters stored   trie nodes   nodes per character   child slots
       2               11066          459                  0.04         11934
       4               10919         2927                  0.26         76102
      26               11039         7590                  0.68        197340`,
          explanation:
            "All three agree on 2,000 of 2,000 queries. The scan examines 2,324 characters per query, because it touches every word. Binary search examines 49: two lower-bound searches, one for the prefix and one for the prefix followed by `{`, which sorts after every letter, so the matching words lie between them. The trie examines 2, because it walks only the prefix and reads a count. The second table is the cost. With two letters the 11,066 stored characters share heavily and need 459 nodes; with 26 letters 11,039 characters need 7,590 nodes, and at 26 child slots per node that is 197,340 slots.",
          alternates: [
            {
              lang: "javascript",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

const WORDS = 2000;
const QUERIES = 2000;

// The same linear congruential generator in every language, so the words
// below are the same words whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 70010023n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function makeWords(alphabet) {
  const words = [];
  for (let w = 0; w < WORDS; w++) {
    const length = 3 + rand(6);
    let word = "";
    for (let i = 0; i < length; i++) word += String.fromCharCode(97 + rand(alphabet));
    words.push(word);
  }
  return words;
}

let work = 0;

function startsWith(word, prefix) {
  if (word.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    work += 1;
    if (word[i] !== prefix[i]) return false;
  }
  return true;
}

function byScan(words, prefix) {
  let count = 0;
  for (const word of words) {
    if (startsWith(word, prefix)) count += 1;
  }
  return count;
}

function compare(a, b) {
  // -1, 0 or 1, counting one unit per character examined
  let i = 0;
  while (i < a.length && i < b.length) {
    work += 1;
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    i += 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}

function lowerBound(ordered, key) {
  let lo = 0;
  let hi = ordered.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (compare(ordered[mid], key) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function byBinarySearch(ordered, prefix) {
  // every word with the prefix sorts between the prefix itself and the
  // prefix followed by a character larger than any letter
  return lowerBound(ordered, prefix + "{") - lowerBound(ordered, prefix);
}

function buildTrie(words) {
  const children = [new Array(26).fill(-1)];
  const passing = [0];
  for (const word of words) {
    let node = 0;
    passing[0] += 1;
    for (const ch of word) {
      const c = ch.charCodeAt(0) - 97;
      if (children[node][c] === -1) {
        children[node][c] = children.length;
        children.push(new Array(26).fill(-1));
        passing.push(0);
      }
      node = children[node][c];
      passing[node] += 1;
    }
  }
  return [children, passing];
}

function byTrie(children, passing, prefix) {
  let node = 0;
  for (const ch of prefix) {
    work += 1;
    node = children[node][ch.charCodeAt(0) - 97];
    if (node === -1) return 0;
  }
  return passing[node];
}

function padLeft(s, width) {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const words = makeWords(4);
const ordered = words.slice().sort();
const [children, passing] = buildTrie(words);
const prefixes = [];
for (let q = 0; q < QUERIES; q++) {
  const length = 1 + rand(4);
  let prefix = "";
  for (let i = 0; i < length; i++) prefix += String.fromCharCode(97 + rand(4));
  prefixes.push(prefix);
}

let agree = 0;
const cost = [0, 0, 0];
for (const prefix of prefixes) {
  work = 0;
  const a = byScan(words, prefix);
  cost[0] += work;
  work = 0;
  const b = byBinarySearch(ordered, prefix);
  cost[1] += work;
  work = 0;
  const c = byTrie(children, passing, prefix);
  cost[2] += work;
  if (a === b && b === c) agree += 1;
}

console.log(WORDS + " words over the letters a-d, " + QUERIES + " prefix queries");
console.log("all three gave the same count on " + agree + " of " + QUERIES + " queries");
console.log();
console.log("method              characters examined per query");
console.log("scan every word     " + padLeft(Math.floor(cost[0] / QUERIES), 10));
console.log("binary search       " + padLeft(Math.floor(cost[1] / QUERIES), 10));
console.log("walk the trie       " + padLeft(Math.floor(cost[2] / QUERIES), 10));
console.log();
console.log("alphabet   characters stored   trie nodes   nodes per character   child slots");
for (const alphabet of [2, 4, 26]) {
  const sample = makeWords(alphabet);
  let stored = 0;
  for (const word of sample) stored += word.length;
  const [kids] = buildTrie(sample);
  const nodes = kids.length - 1;
  const share = Math.floor((nodes * 100) / stored);
  const fraction = share % 100;
  console.log(
    padLeft(alphabet, 8) + " " + padLeft(stored, 19) + " " + padLeft(nodes, 12) + " " +
      padLeft(Math.floor(share / 100), 18) + "." + (fraction < 10 ? "0" : "") + fraction + " " +
      padLeft(nodes * 26, 13),
  );
}
`,
            },
            {
              lang: "typescript",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

const WORDS = 2000;
const QUERIES = 2000;

// The same linear congruential generator in every language, so the words
// below are the same words whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 70010023n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function makeWords(alphabet: number): string[] {
  const words: string[] = [];
  for (let w = 0; w < WORDS; w++) {
    const length = 3 + rand(6);
    let word = "";
    for (let i = 0; i < length; i++) word += String.fromCharCode(97 + rand(alphabet));
    words.push(word);
  }
  return words;
}

let work = 0;

function startsWith(word: string, prefix: string): boolean {
  if (word.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    work += 1;
    if (word[i] !== prefix[i]) return false;
  }
  return true;
}

function byScan(words: string[], prefix: string): number {
  let count = 0;
  for (const word of words) {
    if (startsWith(word, prefix)) count += 1;
  }
  return count;
}

function compare(a: string, b: string): number {
  // -1, 0 or 1, counting one unit per character examined
  let i = 0;
  while (i < a.length && i < b.length) {
    work += 1;
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    i += 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}

function lowerBound(ordered: string[], key: string): number {
  let lo = 0;
  let hi = ordered.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (compare(ordered[mid], key) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function byBinarySearch(ordered: string[], prefix: string): number {
  // every word with the prefix sorts between the prefix itself and the
  // prefix followed by a character larger than any letter
  return lowerBound(ordered, prefix + "{") - lowerBound(ordered, prefix);
}

function buildTrie(words: string[]): [number[][], number[]] {
  const children: number[][] = [new Array(26).fill(-1)];
  const passing: number[] = [0];
  for (const word of words) {
    let node = 0;
    passing[0] += 1;
    for (const ch of word) {
      const c = ch.charCodeAt(0) - 97;
      if (children[node][c] === -1) {
        children[node][c] = children.length;
        children.push(new Array(26).fill(-1));
        passing.push(0);
      }
      node = children[node][c];
      passing[node] += 1;
    }
  }
  return [children, passing];
}

function byTrie(children: number[][], passing: number[], prefix: string): number {
  let node = 0;
  for (const ch of prefix) {
    work += 1;
    node = children[node][ch.charCodeAt(0) - 97];
    if (node === -1) return 0;
  }
  return passing[node];
}

function padLeft(s: string | number, width: number): string {
  let out = String(s);
  while (out.length < width) out = " " + out;
  return out;
}

const words = makeWords(4);
const ordered = words.slice().sort();
const [children, passing] = buildTrie(words);
const prefixes: string[] = [];
for (let q = 0; q < QUERIES; q++) {
  const length = 1 + rand(4);
  let prefix = "";
  for (let i = 0; i < length; i++) prefix += String.fromCharCode(97 + rand(4));
  prefixes.push(prefix);
}

let agree = 0;
const cost = [0, 0, 0];
for (const prefix of prefixes) {
  work = 0;
  const a = byScan(words, prefix);
  cost[0] += work;
  work = 0;
  const b = byBinarySearch(ordered, prefix);
  cost[1] += work;
  work = 0;
  const c = byTrie(children, passing, prefix);
  cost[2] += work;
  if (a === b && b === c) agree += 1;
}

console.log(WORDS + " words over the letters a-d, " + QUERIES + " prefix queries");
console.log("all three gave the same count on " + agree + " of " + QUERIES + " queries");
console.log();
console.log("method              characters examined per query");
console.log("scan every word     " + padLeft(Math.floor(cost[0] / QUERIES), 10));
console.log("binary search       " + padLeft(Math.floor(cost[1] / QUERIES), 10));
console.log("walk the trie       " + padLeft(Math.floor(cost[2] / QUERIES), 10));
console.log();
console.log("alphabet   characters stored   trie nodes   nodes per character   child slots");
for (const alphabet of [2, 4, 26]) {
  const sample = makeWords(alphabet);
  let stored = 0;
  for (const word of sample) stored += word.length;
  const [kids] = buildTrie(sample);
  const nodes = kids.length - 1;
  const share = Math.floor((nodes * 100) / stored);
  const fraction = share % 100;
  console.log(
    padLeft(alphabet, 8) + " " + padLeft(stored, 19) + " " + padLeft(nodes, 12) + " " +
      padLeft(Math.floor(share / 100), 18) + "." + (fraction < 10 ? "0" : "") + fraction + " " +
      padLeft(nodes * 26, 13),
  );
}
`,
            },
            {
              lang: "java",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
  static final int WORDS = 2000;
  static final int QUERIES = 2000;

  // The same linear congruential generator in every language, so the words
  // below are the same words whichever translation is run.
  static long seed = 70010023L;

  static int rand(int n) {
    seed = (seed * 1103515245L + 12345L) % 2147483648L;
    return (int) (seed / 65536L % n);
  }

  static List<String> makeWords(int alphabet) {
    List<String> words = new ArrayList<>();
    for (int w = 0; w < WORDS; w++) {
      int length = 3 + rand(6);
      StringBuilder word = new StringBuilder();
      for (int i = 0; i < length; i++) {
        word.append((char) (97 + rand(alphabet)));
      }
      words.add(word.toString());
    }
    return words;
  }

  static long work = 0;

  static boolean startsWith(String word, String prefix) {
    if (word.length() < prefix.length()) {
      return false;
    }
    for (int i = 0; i < prefix.length(); i++) {
      work += 1;
      if (word.charAt(i) != prefix.charAt(i)) {
        return false;
      }
    }
    return true;
  }

  static int byScan(List<String> words, String prefix) {
    int count = 0;
    for (String word : words) {
      if (startsWith(word, prefix)) {
        count += 1;
      }
    }
    return count;
  }

  static int compare(String a, String b) {
    // -1, 0 or 1, counting one unit per character examined
    int i = 0;
    while (i < a.length() && i < b.length()) {
      work += 1;
      if (a.charAt(i) != b.charAt(i)) {
        return a.charAt(i) < b.charAt(i) ? -1 : 1;
      }
      i += 1;
    }
    if (a.length() == b.length()) {
      return 0;
    }
    return a.length() < b.length() ? -1 : 1;
  }

  static int lowerBound(List<String> ordered, String key) {
    int lo = 0;
    int hi = ordered.size();
    while (lo < hi) {
      int mid = (lo + hi) / 2;
      if (compare(ordered.get(mid), key) < 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  static int byBinarySearch(List<String> ordered, String prefix) {
    // every word with the prefix sorts between the prefix itself and the
    // prefix followed by a character larger than any letter
    return lowerBound(ordered, prefix + "{") - lowerBound(ordered, prefix);
  }

  static List<int[]> children;
  static List<Integer> passing;

  static void buildTrie(List<String> words) {
    children = new ArrayList<>();
    passing = new ArrayList<>();
    int[] root = new int[26];
    Arrays.fill(root, -1);
    children.add(root);
    passing.add(0);
    for (String word : words) {
      int node = 0;
      passing.set(0, passing.get(0) + 1);
      for (int i = 0; i < word.length(); i++) {
        int c = word.charAt(i) - 97;
        if (children.get(node)[c] == -1) {
          children.get(node)[c] = children.size();
          int[] fresh = new int[26];
          Arrays.fill(fresh, -1);
          children.add(fresh);
          passing.add(0);
        }
        node = children.get(node)[c];
        passing.set(node, passing.get(node) + 1);
      }
    }
  }

  static int byTrie(String prefix) {
    int node = 0;
    for (int i = 0; i < prefix.length(); i++) {
      work += 1;
      node = children.get(node)[prefix.charAt(i) - 97];
      if (node == -1) {
        return 0;
      }
    }
    return passing.get(node);
  }

  public static void main(String[] args) {
    List<String> words = makeWords(4);
    List<String> ordered = new ArrayList<>(words);
    Collections.sort(ordered);
    buildTrie(words);
    List<String> prefixes = new ArrayList<>();
    for (int q = 0; q < QUERIES; q++) {
      int length = 1 + rand(4);
      StringBuilder prefix = new StringBuilder();
      for (int i = 0; i < length; i++) {
        prefix.append((char) (97 + rand(4)));
      }
      prefixes.add(prefix.toString());
    }

    int agree = 0;
    long[] cost = new long[3];
    for (String prefix : prefixes) {
      work = 0;
      int a = byScan(words, prefix);
      cost[0] += work;
      work = 0;
      int b = byBinarySearch(ordered, prefix);
      cost[1] += work;
      work = 0;
      int c = byTrie(prefix);
      cost[2] += work;
      if (a == b && b == c) {
        agree += 1;
      }
    }

    System.out.printf("%d words over the letters a-d, %d prefix queries%n", WORDS, QUERIES);
    System.out.printf("all three gave the same count on %d of %d queries%n", agree, QUERIES);
    System.out.println();
    System.out.println("method              characters examined per query");
    System.out.printf("scan every word     %10d%n", cost[0] / QUERIES);
    System.out.printf("binary search       %10d%n", cost[1] / QUERIES);
    System.out.printf("walk the trie       %10d%n", cost[2] / QUERIES);
    System.out.println();
    System.out.println(
        "alphabet   characters stored   trie nodes   nodes per character   child slots");
    int[] alphabets = {2, 4, 26};
    for (int alphabet : alphabets) {
      List<String> sample = makeWords(alphabet);
      int stored = 0;
      for (String word : sample) {
        stored += word.length();
      }
      buildTrie(sample);
      int nodes = children.size() - 1;
      int share = nodes * 100 / stored;
      System.out.printf(
          "%8d %19d %12d %18d.%02d %13d%n",
          alphabet, stored, nodes, share / 100, share % 100, nodes * 26);
    }
  }
}
`,
            },
            {
              lang: "cpp",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

#include <algorithm>
#include <array>
#include <cstdio>
#include <string>
#include <vector>

static const int WORDS = 2000;
static const int QUERIES = 2000;

// The same linear congruential generator in every language, so the words
// below are the same words whichever translation is run.
long long seed = 70010023LL;

int rand_below(int n) {
  seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
  return (int)(seed / 65536LL % n);
}

std::vector<std::string> makeWords(int alphabet) {
  std::vector<std::string> words;
  for (int w = 0; w < WORDS; w++) {
    int length = 3 + rand_below(6);
    std::string word;
    for (int i = 0; i < length; i++) {
      word += (char)(97 + rand_below(alphabet));
    }
    words.push_back(word);
  }
  return words;
}

long long work = 0;

bool startsWith(const std::string& word, const std::string& prefix) {
  if (word.size() < prefix.size()) {
    return false;
  }
  for (size_t i = 0; i < prefix.size(); i++) {
    work += 1;
    if (word[i] != prefix[i]) {
      return false;
    }
  }
  return true;
}

int byScan(const std::vector<std::string>& words, const std::string& prefix) {
  int count = 0;
  for (const std::string& word : words) {
    if (startsWith(word, prefix)) {
      count += 1;
    }
  }
  return count;
}

int compare(const std::string& a, const std::string& b) {
  // -1, 0 or 1, counting one unit per character examined
  size_t i = 0;
  while (i < a.size() && i < b.size()) {
    work += 1;
    if (a[i] != b[i]) {
      return a[i] < b[i] ? -1 : 1;
    }
    i += 1;
  }
  if (a.size() == b.size()) {
    return 0;
  }
  return a.size() < b.size() ? -1 : 1;
}

int lowerBound(const std::vector<std::string>& ordered, const std::string& key) {
  int lo = 0;
  int hi = (int)ordered.size();
  while (lo < hi) {
    int mid = (lo + hi) / 2;
    if (compare(ordered[mid], key) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

int byBinarySearch(const std::vector<std::string>& ordered, const std::string& prefix) {
  // every word with the prefix sorts between the prefix itself and the
  // prefix followed by a character larger than any letter
  return lowerBound(ordered, prefix + "{") - lowerBound(ordered, prefix);
}

std::vector<std::array<int, 26> > children;
std::vector<int> passing;

std::array<int, 26> emptyNode() {
  std::array<int, 26> node;
  node.fill(-1);
  return node;
}

void buildTrie(const std::vector<std::string>& words) {
  children.assign(1, emptyNode());
  passing.assign(1, 0);
  for (const std::string& word : words) {
    int node = 0;
    passing[0] += 1;
    for (char ch : word) {
      int c = ch - 97;
      if (children[node][c] == -1) {
        children[node][c] = (int)children.size();
        children.push_back(emptyNode());
        passing.push_back(0);
      }
      node = children[node][c];
      passing[node] += 1;
    }
  }
}

int byTrie(const std::string& prefix) {
  int node = 0;
  for (char ch : prefix) {
    work += 1;
    node = children[node][ch - 97];
    if (node == -1) {
      return 0;
    }
  }
  return passing[node];
}

int main() {
  std::vector<std::string> words = makeWords(4);
  std::vector<std::string> ordered = words;
  std::sort(ordered.begin(), ordered.end());
  buildTrie(words);
  std::vector<std::string> prefixes;
  for (int q = 0; q < QUERIES; q++) {
    int length = 1 + rand_below(4);
    std::string prefix;
    for (int i = 0; i < length; i++) {
      prefix += (char)(97 + rand_below(4));
    }
    prefixes.push_back(prefix);
  }

  int agree = 0;
  long long cost[3] = {0, 0, 0};
  for (const std::string& prefix : prefixes) {
    work = 0;
    int a = byScan(words, prefix);
    cost[0] += work;
    work = 0;
    int b = byBinarySearch(ordered, prefix);
    cost[1] += work;
    work = 0;
    int c = byTrie(prefix);
    cost[2] += work;
    if (a == b && b == c) {
      agree += 1;
    }
  }

  std::printf("%d words over the letters a-d, %d prefix queries\\n", WORDS, QUERIES);
  std::printf("all three gave the same count on %d of %d queries\\n", agree, QUERIES);
  std::printf("\\n");
  std::printf("method              characters examined per query\\n");
  std::printf("scan every word     %10lld\\n", cost[0] / QUERIES);
  std::printf("binary search       %10lld\\n", cost[1] / QUERIES);
  std::printf("walk the trie       %10lld\\n", cost[2] / QUERIES);
  std::printf("\\n");
  std::printf("alphabet   characters stored   trie nodes   nodes per character   child slots\\n");
  int alphabets[3] = {2, 4, 26};
  for (int alphabet : alphabets) {
    std::vector<std::string> sample = makeWords(alphabet);
    int stored = 0;
    for (const std::string& word : sample) {
      stored += (int)word.size();
    }
    buildTrie(sample);
    int nodes = (int)children.size() - 1;
    int share = nodes * 100 / stored;
    std::printf("%8d %19d %12d %18d.%02d %13d\\n", alphabet, stored, nodes, share / 100,
                share % 100, nodes * 26);
  }
  return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

const WORDS: usize = 2000;
const QUERIES: usize = 2000;

// The same linear congruential generator in every language, so the words
// below are the same words whichever translation is run.
static mut SEED: i64 = 70010023;

fn rand_below(n: i64) -> i64 {
    unsafe {
        SEED = (SEED * 1103515245 + 12345) % 2147483648;
        SEED / 65536 % n
    }
}

fn make_words(alphabet: i64) -> Vec<Vec<u8>> {
    let mut words: Vec<Vec<u8>> = Vec::new();
    for _ in 0..WORDS {
        let length = 3 + rand_below(6);
        let mut word: Vec<u8> = Vec::new();
        for _ in 0..length {
            word.push((97 + rand_below(alphabet)) as u8);
        }
        words.push(word);
    }
    words
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

fn starts_with(word: &[u8], prefix: &[u8]) -> bool {
    if word.len() < prefix.len() {
        return false;
    }
    for i in 0..prefix.len() {
        tick();
        if word[i] != prefix[i] {
            return false;
        }
    }
    true
}

fn by_scan(words: &[Vec<u8>], prefix: &[u8]) -> i64 {
    let mut count = 0;
    for word in words {
        if starts_with(word, prefix) {
            count += 1;
        }
    }
    count
}

fn compare(a: &[u8], b: &[u8]) -> i32 {
    // -1, 0 or 1, counting one unit per character examined
    let mut i = 0;
    while i < a.len() && i < b.len() {
        tick();
        if a[i] != b[i] {
            return if a[i] < b[i] { -1 } else { 1 };
        }
        i += 1;
    }
    if a.len() == b.len() {
        return 0;
    }
    if a.len() < b.len() {
        -1
    } else {
        1
    }
}

fn lower_bound(ordered: &[Vec<u8>], key: &[u8]) -> i64 {
    let mut lo = 0;
    let mut hi = ordered.len();
    while lo < hi {
        let mid = (lo + hi) / 2;
        if compare(&ordered[mid], key) < 0 {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo as i64
}

fn by_binary_search(ordered: &[Vec<u8>], prefix: &[u8]) -> i64 {
    // every word with the prefix sorts between the prefix itself and the
    // prefix followed by a character larger than any letter
    let mut upper = prefix.to_vec();
    upper.push(b'{');
    lower_bound(ordered, &upper) - lower_bound(ordered, prefix)
}

fn build_trie(words: &[Vec<u8>]) -> (Vec<[i64; 26]>, Vec<i64>) {
    let mut children: Vec<[i64; 26]> = vec![[-1; 26]];
    let mut passing: Vec<i64> = vec![0];
    for word in words {
        let mut node = 0;
        passing[0] += 1;
        for &ch in word {
            let c = (ch - 97) as usize;
            if children[node][c] == -1 {
                children[node][c] = children.len() as i64;
                children.push([-1; 26]);
                passing.push(0);
            }
            node = children[node][c] as usize;
            passing[node] += 1;
        }
    }
    (children, passing)
}

fn by_trie(children: &[[i64; 26]], passing: &[i64], prefix: &[u8]) -> i64 {
    let mut node: i64 = 0;
    for &ch in prefix {
        tick();
        node = children[node as usize][(ch - 97) as usize];
        if node == -1 {
            return 0;
        }
    }
    passing[node as usize]
}

fn main() {
    let words = make_words(4);
    let mut ordered = words.clone();
    ordered.sort();
    let (children, passing) = build_trie(&words);
    let mut prefixes: Vec<Vec<u8>> = Vec::new();
    for _ in 0..QUERIES {
        let length = 1 + rand_below(4);
        let mut prefix: Vec<u8> = Vec::new();
        for _ in 0..length {
            prefix.push((97 + rand_below(4)) as u8);
        }
        prefixes.push(prefix);
    }

    let mut agree = 0;
    let mut cost = [0i64; 3];
    for prefix in prefixes.iter() {
        take_work();
        let a = by_scan(&words, prefix);
        cost[0] += take_work();
        let b = by_binary_search(&ordered, prefix);
        cost[1] += take_work();
        let c = by_trie(&children, &passing, prefix);
        cost[2] += take_work();
        if a == b && b == c {
            agree += 1;
        }
    }

    println!("{} words over the letters a-d, {} prefix queries", WORDS, QUERIES);
    println!("all three gave the same count on {} of {} queries", agree, QUERIES);
    println!();
    println!("method              characters examined per query");
    println!("scan every word     {:>10}", cost[0] / QUERIES as i64);
    println!("binary search       {:>10}", cost[1] / QUERIES as i64);
    println!("walk the trie       {:>10}", cost[2] / QUERIES as i64);
    println!();
    println!("alphabet   characters stored   trie nodes   nodes per character   child slots");
    for &alphabet in [2i64, 4, 26].iter() {
        let sample = make_words(alphabet);
        let mut stored = 0;
        for word in sample.iter() {
            stored += word.len() as i64;
        }
        let (kids, _) = build_trie(&sample);
        let nodes = kids.len() as i64 - 1;
        let share = nodes * 100 / stored;
        println!(
            "{:>8} {:>19} {:>12} {:>18}.{:02} {:>13}",
            alphabet,
            stored,
            nodes,
            share / 100,
            share % 100,
            nodes * 26
        );
    }
}
`,
            },
            {
              lang: "go",
              code: `// Counting the words that start with a prefix, three ways: scan every word,
// binary search a sorted list, and walk a trie. Then the memory the trie
// spends to do it, which depends on how much the words share.

package main

import (
	"fmt"
	"sort"
)

const wordCount = 2000
const queryCount = 2000

// The same linear congruential generator in every language, so the words
// below are the same words whichever translation is run.
var seed int64 = 70010023

func randBelow(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func makeWords(alphabet int64) []string {
	words := []string{}
	for w := 0; w < wordCount; w++ {
		length := 3 + randBelow(6)
		word := []byte{}
		for i := int64(0); i < length; i++ {
			word = append(word, byte(97+randBelow(alphabet)))
		}
		words = append(words, string(word))
	}
	return words
}

var work int64

func startsWith(word, prefix string) bool {
	if len(word) < len(prefix) {
		return false
	}
	for i := 0; i < len(prefix); i++ {
		work++
		if word[i] != prefix[i] {
			return false
		}
	}
	return true
}

func byScan(words []string, prefix string) int {
	count := 0
	for _, word := range words {
		if startsWith(word, prefix) {
			count++
		}
	}
	return count
}

func compare(a, b string) int {
	// -1, 0 or 1, counting one unit per character examined
	i := 0
	for i < len(a) && i < len(b) {
		work++
		if a[i] != b[i] {
			if a[i] < b[i] {
				return -1
			}
			return 1
		}
		i++
	}
	if len(a) == len(b) {
		return 0
	}
	if len(a) < len(b) {
		return -1
	}
	return 1
}

func lowerBound(ordered []string, key string) int {
	lo := 0
	hi := len(ordered)
	for lo < hi {
		mid := (lo + hi) / 2
		if compare(ordered[mid], key) < 0 {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

func byBinarySearch(ordered []string, prefix string) int {
	// every word with the prefix sorts between the prefix itself and the
	// prefix followed by a character larger than any letter
	return lowerBound(ordered, prefix+"{") - lowerBound(ordered, prefix)
}

func emptyNode() [26]int {
	var node [26]int
	for i := range node {
		node[i] = -1
	}
	return node
}

func buildTrie(words []string) ([][26]int, []int) {
	children := [][26]int{emptyNode()}
	passing := []int{0}
	for _, word := range words {
		node := 0
		passing[0]++
		for i := 0; i < len(word); i++ {
			c := int(word[i]) - 97
			if children[node][c] == -1 {
				children[node][c] = len(children)
				children = append(children, emptyNode())
				passing = append(passing, 0)
			}
			node = children[node][c]
			passing[node]++
		}
	}
	return children, passing
}

func byTrie(children [][26]int, passing []int, prefix string) int {
	node := 0
	for i := 0; i < len(prefix); i++ {
		work++
		node = children[node][int(prefix[i])-97]
		if node == -1 {
			return 0
		}
	}
	return passing[node]
}

func main() {
	words := makeWords(4)
	ordered := append([]string{}, words...)
	sort.Strings(ordered)
	children, passing := buildTrie(words)
	prefixes := []string{}
	for q := 0; q < queryCount; q++ {
		length := 1 + randBelow(4)
		prefix := []byte{}
		for i := int64(0); i < length; i++ {
			prefix = append(prefix, byte(97+randBelow(4)))
		}
		prefixes = append(prefixes, string(prefix))
	}

	agree := 0
	var cost [3]int64
	for _, prefix := range prefixes {
		work = 0
		a := byScan(words, prefix)
		cost[0] += work
		work = 0
		b := byBinarySearch(ordered, prefix)
		cost[1] += work
		work = 0
		c := byTrie(children, passing, prefix)
		cost[2] += work
		if a == b && b == c {
			agree++
		}
	}

	fmt.Printf("%d words over the letters a-d, %d prefix queries\\n", wordCount, queryCount)
	fmt.Printf("all three gave the same count on %d of %d queries\\n", agree, queryCount)
	fmt.Println()
	fmt.Println("method              characters examined per query")
	fmt.Printf("scan every word     %10d\\n", cost[0]/queryCount)
	fmt.Printf("binary search       %10d\\n", cost[1]/queryCount)
	fmt.Printf("walk the trie       %10d\\n", cost[2]/queryCount)
	fmt.Println()
	fmt.Println("alphabet   characters stored   trie nodes   nodes per character   child slots")
	for _, alphabet := range []int64{2, 4, 26} {
		sample := makeWords(alphabet)
		stored := 0
		for _, word := range sample {
			stored += len(word)
		}
		kids, _ := buildTrie(sample)
		nodes := len(kids) - 1
		share := nodes * 100 / stored
		fmt.Printf("%8d %19d %12d %18d.%02d %13d\\n", alphabet, stored, nodes, share/100, share%100, nodes*26)
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-memory-trade",
      heading: "The memory trade",
      body: [
        "A trie's node count is the number of **distinct prefixes** in the set. Sharing is what makes it small: nodes per character fell to 0.04 with a two-letter alphabet, where almost every prefix repeats, and rose to 0.68 with 26 letters, where most words branch off early and every later character is a new node.",
        "The child representation multiplies that count. Three choices:",
        "**A fixed array per node**, one slot per letter. Constant-time child lookup and the fastest walk, but every node pays for the whole alphabet \u2014 26 slots, or 256 for bytes, whether it has one child or none. This is what the measured 197,340 slots are.",
        "**A hash map per node**. Memory proportional to actual children, a hash lookup per character. The usual choice for large or Unicode alphabets.",
        "**A sorted list of children**. Smallest, with a binary search per character. Reasonable when nodes have few children, which is most nodes deep in the tree.",
        "The fourth option changes the node count itself: a **compressed trie** (radix tree) merges every chain of single-child nodes into one edge labelled with a string. Deep in a trie over natural text most nodes have exactly one child, so this removes most of them.",
      ],
      pitfalls: [
        {
          title: "No end marker",
          body: "Counting passing words answers prefix questions; it cannot tell whether `car` was inserted or only `cart` was. Keep a separate end count.",
        },
        {
          title: "A 26-slot array at every node for sparse data",
          body: "The measured cost is 197,340 slots for 11,039 characters. Use a map or a sorted child list unless the alphabet is tiny or the set is dense.",
        },
        {
          title: "Reaching for a trie when binary search is enough",
          body: "A sorted array answered the same queries with 49 character comparisons and no extra memory. A trie is worth it when prefix queries dominate, or when you need to walk the subtree below a prefix.",
        },
      ],
    },
    {
      id: "autocomplete",
      heading: "Autocomplete",
      body: [
        "Autocomplete is the query a trie is best at: walk to the prefix node, then enumerate words in its subtree. The walk is proportional to the prefix; the enumeration is proportional to the number of suggestions produced, not to the size of the dictionary.",
        "Returning the `k` most frequent completions rather than the first `k` found needs more than a depth-first search, because the most frequent completion may be deep in the subtree. Two standard answers:",
        "**Search the subtree with a priority queue** keyed by frequency, stopping after `k` words. Correct, and its cost depends on how much of the subtree has to be opened.",
        "**Store the top `k` completions at every node** at insertion time. A query becomes one walk and one read. Insertion becomes more expensive, since every node on the path may need its list updated, and memory grows by `k` references per node. This is the trade search engines make, because queries vastly outnumber insertions.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When is a trie better than a hash set of words?",
      answer:
        "When the question is about prefixes. A hash set answers 'is this exact word present' in constant time and cannot answer 'how many words start with ca' without scanning. A trie answers the prefix question in time proportional to the prefix: in my measurement 2 characters examined per query, against 2,324 for a scan and 49 for binary search on a sorted list. It also supports autocomplete, since the words with a given prefix are exactly the subtree under that prefix node. For exact membership only, the hash set is smaller and simpler.",
    },
    {
      question: "What does a trie cost in memory, and how do you reduce it?",
      answer:
        "One node per distinct prefix, times the size of the child representation. Sharing decides the node count: over about 11,000 characters I measured 459 nodes with a 2-letter alphabet and 7,590 with 26 letters. With a 26-slot array per node the second case is 197,340 slots. To reduce it, store children in a hash map or a sorted list so nodes pay only for children that exist, and compress single-child chains into one edge labelled with a string, which removes most nodes deep in the tree.",
    },
  ],
  takeaways: [
    "A trie node represents a prefix; its passing count answers prefix-count queries",
    "Keep an end count separately, or prefixes and words are indistinguishable",
    "Measured characters per query: trie 2, binary search 49, scan 2,324",
    "Node count is the number of distinct prefixes, so sharing decides the size",
    "26-letter alphabet: 7,590 nodes and 197,340 array slots for 11,039 characters",
    "Array children are fastest; maps and sorted lists pay only for real children",
    "Radix trees collapse single-child chains",
    "For top-k autocomplete, store the best completions at each node",
  ],
};
