import type { Lesson } from "@/content/types";

export const stringPairGridLesson: Lesson = {
  id: "dsa-dp-string-pair-grid",
  slug: "the-string-pair-grid",
  moduleSlug: "dynamic-programming-patterns",
  title: "The String-Pair Grid",
  summary:
    "A dozen named problems sit on one grid whose state is a prefix of each string. Six of them written as one function, two neighbours that turn out to be arithmetic on the LCS length and one that looks equally close and is not, and what happens when the three edit operations stop costing the same.",
  estimatedMinutes: 45,
  objectives: [
    "Write the two-prefix grid once and vary the moves rather than the structure",
    "Say where each reading's answer lives, including the one that is not the last cell",
    "Derive the deletions-only and supersequence identities, and test rather than trust them",
    "Price the operations separately, and predict the threshold where one stops being used",
  ],
  sections: [
    {
      id: "one-grid-six-readings",
      heading: "One grid, six readings",
      body: [
        "The state is always the same: **a prefix of each string**, so the table is `(len(a) + 1)` by `(len(b) + 1)` and the cell at `(i, j)` is the answer for `a[:i]` against `b[:j]`. The transition always looks at exactly one pair of characters, `a[i-1]` against `b[j-1]`. What changes between problems is only which moves are legal and what each one costs.",
        "So rather than write six functions, the example below writes the grid once and switches on those two things. Six readings, and each is scored against its own exhaustive search \u2014 subsequence enumeration for most, and a breadth-first walk over single edits for edit distance, which is deliberately not another table.",
        "All six agree on 400 of 400 random pairs. The three-line summary of the differences: **a match is free** for LCS and edit distance, **costs one** for the supersequence; **either side may drop** in every reading but one; and the substring reading is the exception that resets to zero on a mismatch, because contiguity is exactly the constraint that a subsequence does not have.",
        "That last one also has a trap in it. Every other reading is answered by the bottom-right cell. Longest common **substring** is not \u2014 its cell means \"the run ending exactly here\", so the answer is the largest cell anywhere in the grid. Reading the last cell instead gave 0 where the answer was 2, on the very first pair. Module 27 lesson 3 says the answer is not always the last cell; this is what that looks like in practice.",
      ],
      examples: [
        {
          id: "six-readings-one-table",
          title: "Six string-pair problems as one parameterised grid",
          lang: "python",
          code: `# Six problems about two strings, all of them the same grid. The state is always
# "a prefix of each", the transition always compares one pair of characters, and
# what changes is which moves are legal and what each one costs.
#
# Written once, parameterised by those two things, and each reading checked
# against its own exhaustive search.

def grid(a, b, kind):
    """dp[i][j] over prefixes a[:i] and b[:j], under one of six readings."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    # Every reading but one is answered by the last cell. A common *substring*
    # has to be contiguous, so its cell means "the run ending exactly here" and
    # the answer is the largest cell anywhere in the grid.
    largest = 0

    for i in range(rows):
        for j in range(cols):
            if i == 0 and j == 0:
                table[i][j] = 0 if kind != "distinct" else 1
                continue
            if kind == "lcs":
                # Longest common subsequence: a match is free, either side may drop.
                best = 0
                if i > 0:
                    best = max(best, table[i - 1][j])
                if j > 0:
                    best = max(best, table[i][j - 1])
                if i > 0 and j > 0 and a[i - 1] == b[j - 1]:
                    best = max(best, table[i - 1][j - 1] + 1)
                table[i][j] = best
            elif kind == "edit":
                # Edit distance: drop, insert or replace, each costing one.
                if i == 0:
                    table[i][j] = j
                elif j == 0:
                    table[i][j] = i
                elif a[i - 1] == b[j - 1]:
                    table[i][j] = table[i - 1][j - 1]
                else:
                    table[i][j] = 1 + min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
            elif kind == "lcsubstring":
                # Longest common substring: contiguous, so a mismatch resets to zero.
                if i > 0 and j > 0 and a[i - 1] == b[j - 1]:
                    table[i][j] = table[i - 1][j - 1] + 1
                else:
                    table[i][j] = 0
                if table[i][j] > largest:
                    largest = table[i][j]
            elif kind == "scs":
                # Shortest common supersequence: a match is one character, else the cheaper side plus one.
                if i == 0:
                    table[i][j] = j
                elif j == 0:
                    table[i][j] = i
                elif a[i - 1] == b[j - 1]:
                    table[i][j] = table[i - 1][j - 1] + 1
                else:
                    table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1])
            elif kind == "deletions":
                # Delete-only distance: no replacement, so a mismatch drops one side.
                if i == 0:
                    table[i][j] = j
                elif j == 0:
                    table[i][j] = i
                elif a[i - 1] == b[j - 1]:
                    table[i][j] = table[i - 1][j - 1]
                else:
                    table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1])
            else:
                # Distinct subsequences: how many times b appears inside a as a subsequence.
                if j == 0:
                    table[i][j] = 1
                elif i == 0:
                    table[i][j] = 0
                elif a[i - 1] == b[j - 1]:
                    table[i][j] = table[i - 1][j - 1] + table[i - 1][j]
                else:
                    table[i][j] = table[i - 1][j]
    return largest if kind == "lcsubstring" else table[rows - 1][cols - 1]


def subsequences(text):
    """Every subsequence of text, as a list (with repeats collapsed by the caller)."""
    out = []
    for mask in range(1 << len(text)):
        out.append("".join(text[i] for i in range(len(text)) if mask >> i & 1))
    return out


def brute(a, b, kind):
    if kind == "lcs":
        shared = set(subsequences(a)) & set(subsequences(b))
        return max(len(s) for s in shared)
    if kind == "lcsubstring":
        best = 0
        for i in range(len(a)):
            for j in range(i + 1, len(a) + 1):
                if a[i:j] in b and j - i > best:
                    best = j - i
        return best
    if kind == "distinct":
        return sum(1 for s in subsequences(a) if s == b)
    if kind == "deletions":
        shared = set(subsequences(a)) & set(subsequences(b))
        keep = max(len(s) for s in shared)
        return len(a) + len(b) - 2 * keep
    if kind == "scs":
        shared = set(subsequences(a)) & set(subsequences(b))
        keep = max(len(s) for s in shared)
        return len(a) + len(b) - keep
    # edit: every sequence of at most len(a)+len(b) single edits, searched by BFS
    from collections import deque
    seen = {a}
    queue = deque([(a, 0)])
    while queue:
        word, steps = queue.popleft()
        if word == b:
            return steps
        if steps > len(a) + len(b):
            continue
        for i in range(len(word)):
            nxt = word[:i] + word[i + 1:]
            if nxt not in seen:
                seen.add(nxt)
                queue.append((nxt, steps + 1))
        for i in range(len(word) + 1):
            for ch in sorted(set(b)):
                nxt = word[:i] + ch + word[i:]
                if nxt not in seen and len(nxt) <= max(len(a), len(b)) + 1:
                    seen.add(nxt)
                    queue.append((nxt, steps + 1))
        for i in range(len(word)):
            for ch in sorted(set(b)):
                if word[i] != ch:
                    nxt = word[:i] + ch + word[i + 1:]
                    if nxt not in seen:
                        seen.add(nxt)
                        queue.append((nxt, steps + 1))
    return -1


KINDS = [
    ("lcs", "longest common subsequence"),
    ("lcsubstring", "longest common substring"),
    ("edit", "edit distance"),
    ("deletions", "deletions only"),
    ("scs", "shortest common supersequence"),
    ("distinct", "times the second is inside the first"),
]

A, B = "ABCBDAB", "BDCABA"
print(f"comparing '{A}' with '{B}'")
print()
print(f"{'reading':<40}{'table':>8}{'brute force':>14}")
for kind, label in KINDS:
    print(f"{label:<40}{grid(A, B, kind):>8}{brute(A, B, kind):>14}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 400
scores = [0] * len(KINDS)
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(3)) for _ in range(1 + rand(6)))
    b = "".join(chr(65 + rand(3)) for _ in range(1 + rand(5)))
    for k, (kind, _) in enumerate(KINDS):
        if grid(a, b, kind) == brute(a, b, kind):
            scores[k] += 1

print(f"each reading against its own exhaustive search, on {TRIALS} random pairs:")
for k, (_, label) in enumerate(KINDS):
    print(f"  {label:<40}{scores[k]:>6}")
`,
          output: `comparing 'ABCBDAB' with 'BDCABA'

reading                                    table   brute force
longest common subsequence                     4             4
longest common substring                       2             2
edit distance                                  5             5
deletions only                                 5             5
shortest common supersequence                  9             9
times the second is inside the first           0             0

each reading against its own exhaustive search, on 400 random pairs:
  longest common subsequence                 400
  longest common substring                   400
  edit distance                              400
  deletions only                             400
  shortest common supersequence              400
  times the second is inside the first       400`,
          explanation:
            "One function, switched on the reading. Every branch is scored against a search that does not use a table: subsequence enumeration for five of them, and a breadth-first walk over single edits for edit distance. The substring reading returns the largest cell rather than the last, which is the one place the six differ in where the answer lives.",
          alternates: [
            {
              lang: "javascript",
              code: `// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.

/** dp[i][j] over prefixes a[:i] and b[:j], under one of six readings. */
function grid(a, b, kind) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  // Every reading but one is answered by the last cell. A common *substring*
  // has to be contiguous, so its cell means "the run ending exactly here" and
  // the answer is the largest cell anywhere in the grid.
  let largest = 0;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i === 0 && j === 0) {
        table[i][j] = kind === "distinct" ? 1 : 0;
        continue;
      }
      if (kind === "lcs") {
        let best = 0;
        if (i > 0) best = Math.max(best, table[i - 1][j]);
        if (j > 0) best = Math.max(best, table[i][j - 1]);
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) best = Math.max(best, table[i - 1][j - 1] + 1);
        table[i][j] = best;
      } else if (kind === "edit") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
        else table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      } else if (kind === "lcsubstring") {
        table[i][j] = i > 0 && j > 0 && a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : 0;
        if (table[i][j] > largest) largest = table[i][j];
      } else if (kind === "scs") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
        else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
      } else if (kind === "deletions") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
        else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
      } else {
        if (j === 0) table[i][j] = 1;
        else if (i === 0) table[i][j] = 0;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + table[i - 1][j];
        else table[i][j] = table[i - 1][j];
      }
    }
  }
  return kind === "lcsubstring" ? largest : table[rows - 1][cols - 1];
}

/** Every subsequence of text. */
function subsequences(text) {
  const out = [];
  for (let mask = 0; mask < 1 << text.length; mask++) {
    let s = "";
    for (let i = 0; i < text.length; i++) if ((mask >> i) & 1) s += text[i];
    out.push(s);
  }
  return out;
}

function longestShared(a, b) {
  const inB = new Set(subsequences(b));
  let keep = 0;
  for (const s of subsequences(a)) if (inB.has(s) && s.length > keep) keep = s.length;
  return keep;
}

function brute(a, b, kind) {
  if (kind === "lcs") return longestShared(a, b);
  if (kind === "lcsubstring") {
    let best = 0;
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j <= a.length; j++) {
        if (b.includes(a.slice(i, j)) && j - i > best) best = j - i;
      }
    }
    return best;
  }
  if (kind === "distinct") return subsequences(a).filter((s) => s === b).length;
  if (kind === "deletions") return a.length + b.length - 2 * longestShared(a, b);
  if (kind === "scs") return a.length + b.length - longestShared(a, b);

  // edit: every sequence of single edits, searched breadth-first
  const seen = new Set([a]);
  const queue = [[a, 0]];
  const letters = [...new Set(b)].sort();
  const longest = Math.max(a.length, b.length);
  let head = 0;
  while (head < queue.length) {
    const [word, step] = queue[head++];
    if (word === b) return step;
    if (step > a.length + b.length) continue;
    const add = (next) => {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, step + 1]);
      }
    };
    for (let i = 0; i < word.length; i++) add(word.slice(0, i) + word.slice(i + 1));
    for (let i = 0; i <= word.length; i++) {
      for (const ch of letters) {
        const next = word.slice(0, i) + ch + word.slice(i);
        if (next.length <= longest + 1) add(next);
      }
    }
    for (let i = 0; i < word.length; i++) {
      for (const ch of letters) {
        if (word[i] !== ch) add(word.slice(0, i) + ch + word.slice(i + 1));
      }
    }
  }
  return -1;
}

const KINDS = [
  ["lcs", "longest common subsequence"],
  ["lcsubstring", "longest common substring"],
  ["edit", "edit distance"],
  ["deletions", "deletions only"],
  ["scs", "shortest common supersequence"],
  ["distinct", "times the second is inside the first"],
];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

const A = "ABCBDAB";
const B = "BDCABA";
console.log(\`comparing '\${A}' with '\${B}'\`);
console.log();
console.log(padEnd("reading", 40) + pad("table", 8) + pad("brute force", 14));
for (const [kind, label] of KINDS) {
  console.log(padEnd(label, 40) + pad(grid(A, B, kind), 8) + pad(brute(A, B, kind), 14));
}
console.log();

const TRIALS = 400;
const scores = new Array(KINDS.length).fill(0);
for (let t = 0; t < TRIALS; t++) {
  let x = "";
  const na = 1 + rand(6);
  for (let i = 0; i < na; i++) x += String.fromCharCode(65 + rand(3));
  let y = "";
  const nb = 1 + rand(5);
  for (let i = 0; i < nb; i++) y += String.fromCharCode(65 + rand(3));
  for (let k = 0; k < KINDS.length; k++) {
    if (grid(x, y, KINDS[k][0]) === brute(x, y, KINDS[k][0])) scores[k]++;
  }
}

console.log(\`each reading against its own exhaustive search, on \${TRIALS} random pairs:\`);
for (let k = 0; k < KINDS.length; k++) {
  console.log(\`  \${padEnd(KINDS[k][1], 40)}\${pad(scores[k], 6)}\`);
}
`,
            },
            {
              lang: "typescript",
              code: `// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.

/** dp[i][j] over prefixes a[:i] and b[:j], under one of six readings. */
function grid(a: string, b: string, kind: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  // Every reading but one is answered by the last cell. A common *substring*
  // has to be contiguous, so its cell means "the run ending exactly here" and
  // the answer is the largest cell anywhere in the grid.
  let largest = 0;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i === 0 && j === 0) {
        table[i][j] = kind === "distinct" ? 1 : 0;
        continue;
      }
      if (kind === "lcs") {
        let best = 0;
        if (i > 0) best = Math.max(best, table[i - 1][j]);
        if (j > 0) best = Math.max(best, table[i][j - 1]);
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) best = Math.max(best, table[i - 1][j - 1] + 1);
        table[i][j] = best;
      } else if (kind === "edit") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
        else table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
      } else if (kind === "lcsubstring") {
        table[i][j] = i > 0 && j > 0 && a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : 0;
        if (table[i][j] > largest) largest = table[i][j];
      } else if (kind === "scs") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
        else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
      } else if (kind === "deletions") {
        if (i === 0) table[i][j] = j;
        else if (j === 0) table[i][j] = i;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
        else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
      } else {
        if (j === 0) table[i][j] = 1;
        else if (i === 0) table[i][j] = 0;
        else if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + table[i - 1][j];
        else table[i][j] = table[i - 1][j];
      }
    }
  }
  return kind === "lcsubstring" ? largest : table[rows - 1][cols - 1];
}

/** Every subsequence of text. */
function subsequences(text: string): string[] {
  const out: string[] = [];
  for (let mask = 0; mask < 1 << text.length; mask++) {
    let s = "";
    for (let i = 0; i < text.length; i++) if ((mask >> i) & 1) s += text[i];
    out.push(s);
  }
  return out;
}

function longestShared(a: string, b: string): number {
  const inB = new Set(subsequences(b));
  let keep = 0;
  for (const s of subsequences(a)) if (inB.has(s) && s.length > keep) keep = s.length;
  return keep;
}

function brute(a: string, b: string, kind: string): number {
  if (kind === "lcs") return longestShared(a, b);
  if (kind === "lcsubstring") {
    let best = 0;
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j <= a.length; j++) {
        if (b.includes(a.slice(i, j)) && j - i > best) best = j - i;
      }
    }
    return best;
  }
  if (kind === "distinct") return subsequences(a).filter((s) => s === b).length;
  if (kind === "deletions") return a.length + b.length - 2 * longestShared(a, b);
  if (kind === "scs") return a.length + b.length - longestShared(a, b);

  // edit: every sequence of single edits, searched breadth-first
  const seen = new Set([a]);
  const queue: [string, number][] = [[a, 0]];
  const letters = [...new Set(b)].sort();
  const longest = Math.max(a.length, b.length);
  let head = 0;
  while (head < queue.length) {
    const [word, step] = queue[head++];
    if (word === b) return step;
    if (step > a.length + b.length) continue;
    const add = (next: string): void => {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, step + 1]);
      }
    };
    for (let i = 0; i < word.length; i++) add(word.slice(0, i) + word.slice(i + 1));
    for (let i = 0; i <= word.length; i++) {
      for (const ch of letters) {
        const next = word.slice(0, i) + ch + word.slice(i);
        if (next.length <= longest + 1) add(next);
      }
    }
    for (let i = 0; i < word.length; i++) {
      for (const ch of letters) {
        if (word[i] !== ch) add(word.slice(0, i) + ch + word.slice(i + 1));
      }
    }
  }
  return -1;
}

const KINDS: [string, string][] = [
  ["lcs", "longest common subsequence"],
  ["lcsubstring", "longest common substring"],
  ["edit", "edit distance"],
  ["deletions", "deletions only"],
  ["scs", "shortest common supersequence"],
  ["distinct", "times the second is inside the first"],
];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

const A = "ABCBDAB";
const B = "BDCABA";
console.log(\`comparing '\${A}' with '\${B}'\`);
console.log();
console.log(padEnd("reading", 40) + pad("table", 8) + pad("brute force", 14));
for (const [kind, label] of KINDS) {
  console.log(padEnd(label, 40) + pad(grid(A, B, kind), 8) + pad(brute(A, B, kind), 14));
}
console.log();

const TRIALS = 400;
const scores = new Array(KINDS.length).fill(0);
for (let t = 0; t < TRIALS; t++) {
  let x = "";
  const na = 1 + rand(6);
  for (let i = 0; i < na; i++) x += String.fromCharCode(65 + rand(3));
  let y = "";
  const nb = 1 + rand(5);
  for (let i = 0; i < nb; i++) y += String.fromCharCode(65 + rand(3));
  for (let k = 0; k < KINDS.length; k++) {
    if (grid(x, y, KINDS[k][0]) === brute(x, y, KINDS[k][0])) scores[k]++;
  }
}

console.log(\`each reading against its own exhaustive search, on \${TRIALS} random pairs:\`);
for (let k = 0; k < KINDS.length; k++) {
  console.log(\`  \${padEnd(KINDS[k][1], 40)}\${pad(scores[k], 6)}\`);
}
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.
public class Main {
    /** dp[i][j] over prefixes a[:i] and b[:j], under one of six readings. */
    static long grid(String a, String b, String kind) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        long[][] table = new long[rows][cols];
        // Every reading but one is answered by the last cell. A common
        // *substring* has to be contiguous, so its cell means "the run ending
        // exactly here" and the answer is the largest cell anywhere in the grid.
        long largest = 0;

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (i == 0 && j == 0) {
                    table[i][j] = kind.equals("distinct") ? 1 : 0;
                    continue;
                }
                if (kind.equals("lcs")) {
                    long best = 0;
                    if (i > 0) best = Math.max(best, table[i - 1][j]);
                    if (j > 0) best = Math.max(best, table[i][j - 1]);
                    if (i > 0 && j > 0 && a.charAt(i - 1) == b.charAt(j - 1)) {
                        best = Math.max(best, table[i - 1][j - 1] + 1);
                    }
                    table[i][j] = best;
                } else if (kind.equals("edit")) {
                    if (i == 0) {
                        table[i][j] = j;
                    } else if (j == 0) {
                        table[i][j] = i;
                    } else if (a.charAt(i - 1) == b.charAt(j - 1)) {
                        table[i][j] = table[i - 1][j - 1];
                    } else {
                        table[i][j] = 1 + Math.min(table[i - 1][j - 1],
                            Math.min(table[i - 1][j], table[i][j - 1]));
                    }
                } else if (kind.equals("lcsubstring")) {
                    if (i > 0 && j > 0 && a.charAt(i - 1) == b.charAt(j - 1)) {
                        table[i][j] = table[i - 1][j - 1] + 1;
                    } else {
                        table[i][j] = 0;
                    }
                    if (table[i][j] > largest) largest = table[i][j];
                } else if (kind.equals("scs")) {
                    if (i == 0) {
                        table[i][j] = j;
                    } else if (j == 0) {
                        table[i][j] = i;
                    } else if (a.charAt(i - 1) == b.charAt(j - 1)) {
                        table[i][j] = table[i - 1][j - 1] + 1;
                    } else {
                        table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
                    }
                } else if (kind.equals("deletions")) {
                    if (i == 0) {
                        table[i][j] = j;
                    } else if (j == 0) {
                        table[i][j] = i;
                    } else if (a.charAt(i - 1) == b.charAt(j - 1)) {
                        table[i][j] = table[i - 1][j - 1];
                    } else {
                        table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
                    }
                } else {
                    if (j == 0) {
                        table[i][j] = 1;
                    } else if (i == 0) {
                        table[i][j] = 0;
                    } else if (a.charAt(i - 1) == b.charAt(j - 1)) {
                        table[i][j] = table[i - 1][j - 1] + table[i - 1][j];
                    } else {
                        table[i][j] = table[i - 1][j];
                    }
                }
            }
        }
        return kind.equals("lcsubstring") ? largest : table[rows - 1][cols - 1];
    }

    /** Every subsequence of text, as a list. */
    static List<String> subsequences(String text) {
        List<String> out = new ArrayList<>();
        for (int mask = 0; mask < (1 << text.length()); mask++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < text.length(); i++) {
                if ((mask >> i & 1) == 1) sb.append(text.charAt(i));
            }
            out.add(sb.toString());
        }
        return out;
    }

    static int longestShared(String a, String b) {
        Set<String> shared = new HashSet<>(subsequences(a));
        shared.retainAll(new HashSet<>(subsequences(b)));
        int keep = 0;
        for (String s : shared) keep = Math.max(keep, s.length());
        return keep;
    }

    static long brute(String a, String b, String kind) {
        if (kind.equals("lcs")) return longestShared(a, b);
        if (kind.equals("lcsubstring")) {
            int best = 0;
            for (int i = 0; i < a.length(); i++) {
                for (int j = i + 1; j <= a.length(); j++) {
                    if (b.contains(a.substring(i, j)) && j - i > best) best = j - i;
                }
            }
            return best;
        }
        if (kind.equals("distinct")) {
            long found = 0;
            for (String s : subsequences(a)) {
                if (s.equals(b)) found++;
            }
            return found;
        }
        if (kind.equals("deletions")) return a.length() + b.length() - 2L * longestShared(a, b);
        if (kind.equals("scs")) return a.length() + b.length() - longestShared(a, b);

        // edit: every sequence of single edits, searched breadth-first
        Set<String> seen = new HashSet<>();
        seen.add(a);
        Deque<String> words = new ArrayDeque<>();
        Deque<Integer> steps = new ArrayDeque<>();
        words.add(a);
        steps.add(0);
        Set<Character> letters = new TreeSet<>();
        for (char ch : b.toCharArray()) letters.add(ch);
        while (!words.isEmpty()) {
            String word = words.poll();
            int step = steps.poll();
            if (word.equals(b)) return step;
            if (step > a.length() + b.length()) continue;
            for (int i = 0; i < word.length(); i++) {
                String next = word.substring(0, i) + word.substring(i + 1);
                if (seen.add(next)) {
                    words.add(next);
                    steps.add(step + 1);
                }
            }
            for (int i = 0; i <= word.length(); i++) {
                for (char ch : letters) {
                    String next = word.substring(0, i) + ch + word.substring(i);
                    if (next.length() <= Math.max(a.length(), b.length()) + 1 && seen.add(next)) {
                        words.add(next);
                        steps.add(step + 1);
                    }
                }
            }
            for (int i = 0; i < word.length(); i++) {
                for (char ch : letters) {
                    if (word.charAt(i) != ch) {
                        String next = word.substring(0, i) + ch + word.substring(i + 1);
                        if (seen.add(next)) {
                            words.add(next);
                            steps.add(step + 1);
                        }
                    }
                }
            }
        }
        return -1;
    }

    static final String[][] KINDS = {
        { "lcs", "longest common subsequence" },
        { "lcsubstring", "longest common substring" },
        { "edit", "edit distance" },
        { "deletions", "deletions only" },
        { "scs", "shortest common supersequence" },
        { "distinct", "times the second is inside the first" },
    };

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        String a = "ABCBDAB";
        String b = "BDCABA";
        System.out.printf("comparing '%s' with '%s'%n", a, b);
        System.out.println();
        System.out.printf("%-40s%8s%14s%n", "reading", "table", "brute force");
        for (String[] kind : KINDS) {
            System.out.printf("%-40s%8d%14d%n", kind[1], grid(a, b, kind[0]), brute(a, b, kind[0]));
        }
        System.out.println();

        final int TRIALS = 400;
        int[] scores = new int[KINDS.length];
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder x = new StringBuilder();
            int na = 1 + rand(6);
            for (int i = 0; i < na; i++) x.append((char) (65 + rand(3)));
            StringBuilder y = new StringBuilder();
            int nb = 1 + rand(5);
            for (int i = 0; i < nb; i++) y.append((char) (65 + rand(3)));
            for (int k = 0; k < KINDS.length; k++) {
                if (grid(x.toString(), y.toString(), KINDS[k][0])
                    == brute(x.toString(), y.toString(), KINDS[k][0])) scores[k]++;
            }
        }

        System.out.printf("each reading against its own exhaustive search, on %d random pairs:%n", TRIALS);
        for (int k = 0; k < KINDS.length; k++) {
            System.out.printf("  %-40s%6d%n", KINDS[k][1], scores[k]);
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.
#include <algorithm>
#include <array>
#include <cstdint>
#include <deque>
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

// dp[i][j] over prefixes a[:i] and b[:j], under one of six readings.
std::int64_t grid(const std::string &a, const std::string &b, const std::string &kind) {
    int rows = static_cast<int>(a.size()) + 1;
    int cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<std::int64_t>> table(rows, std::vector<std::int64_t>(cols, 0));
    // Every reading but one is answered by the last cell. A common *substring*
    // has to be contiguous, so its cell means "the run ending exactly here" and
    // the answer is the largest cell anywhere in the grid.
    std::int64_t largest = 0;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (i == 0 && j == 0) {
                table[i][j] = kind == "distinct" ? 1 : 0;
                continue;
            }
            if (kind == "lcs") {
                std::int64_t best = 0;
                if (i > 0) best = std::max(best, table[i - 1][j]);
                if (j > 0) best = std::max(best, table[i][j - 1]);
                if (i > 0 && j > 0 && a[i - 1] == b[j - 1]) {
                    best = std::max(best, table[i - 1][j - 1] + 1);
                }
                table[i][j] = best;
            } else if (kind == "edit") {
                if (i == 0) {
                    table[i][j] = j;
                } else if (j == 0) {
                    table[i][j] = i;
                } else if (a[i - 1] == b[j - 1]) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = 1 + std::min(table[i - 1][j - 1],
                        std::min(table[i - 1][j], table[i][j - 1]));
                }
            } else if (kind == "lcsubstring") {
                if (i > 0 && j > 0 && a[i - 1] == b[j - 1]) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = 0;
                }
                if (table[i][j] > largest) largest = table[i][j];
            } else if (kind == "scs") {
                if (i == 0) {
                    table[i][j] = j;
                } else if (j == 0) {
                    table[i][j] = i;
                } else if (a[i - 1] == b[j - 1]) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = 1 + std::min(table[i - 1][j], table[i][j - 1]);
                }
            } else if (kind == "deletions") {
                if (i == 0) {
                    table[i][j] = j;
                } else if (j == 0) {
                    table[i][j] = i;
                } else if (a[i - 1] == b[j - 1]) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = 1 + std::min(table[i - 1][j], table[i][j - 1]);
                }
            } else {
                if (j == 0) {
                    table[i][j] = 1;
                } else if (i == 0) {
                    table[i][j] = 0;
                } else if (a[i - 1] == b[j - 1]) {
                    table[i][j] = table[i - 1][j - 1] + table[i - 1][j];
                } else {
                    table[i][j] = table[i - 1][j];
                }
            }
        }
    }
    return kind == "lcsubstring" ? largest : table[rows - 1][cols - 1];
}

// Every subsequence of text.
std::vector<std::string> subsequences(const std::string &text) {
    std::vector<std::string> out;
    for (int mask = 0; mask < (1 << text.size()); mask++) {
        std::string s;
        for (size_t i = 0; i < text.size(); i++) {
            if (mask >> i & 1) s += text[i];
        }
        out.push_back(s);
    }
    return out;
}

int longestShared(const std::string &a, const std::string &b) {
    std::set<std::string> inB;
    for (const auto &s : subsequences(b)) inB.insert(s);
    int keep = 0;
    for (const auto &s : subsequences(a)) {
        if (inB.count(s) && static_cast<int>(s.size()) > keep) keep = static_cast<int>(s.size());
    }
    return keep;
}

std::int64_t brute(const std::string &a, const std::string &b, const std::string &kind) {
    if (kind == "lcs") return longestShared(a, b);
    if (kind == "lcsubstring") {
        int best = 0;
        for (size_t i = 0; i < a.size(); i++) {
            for (size_t j = i + 1; j <= a.size(); j++) {
                if (b.find(a.substr(i, j - i)) != std::string::npos &&
                    static_cast<int>(j - i) > best) {
                    best = static_cast<int>(j - i);
                }
            }
        }
        return best;
    }
    if (kind == "distinct") {
        std::int64_t found = 0;
        for (const auto &s : subsequences(a)) {
            if (s == b) found++;
        }
        return found;
    }
    if (kind == "deletions") return static_cast<std::int64_t>(a.size() + b.size()) - 2LL * longestShared(a, b);
    if (kind == "scs") return static_cast<std::int64_t>(a.size() + b.size()) - longestShared(a, b);

    // edit: every sequence of single edits, searched breadth-first
    std::set<std::string> seen{a};
    std::deque<std::pair<std::string, int>> queue{{a, 0}};
    std::set<char> letters(b.begin(), b.end());
    while (!queue.empty()) {
        auto [word, step] = queue.front();
        queue.pop_front();
        if (word == b) return step;
        if (step > static_cast<int>(a.size() + b.size())) continue;
        auto add = [&](const std::string &next) {
            if (seen.insert(next).second) queue.push_back({next, step + 1});
        };
        for (size_t i = 0; i < word.size(); i++) add(word.substr(0, i) + word.substr(i + 1));
        size_t longest = std::max(a.size(), b.size());
        for (size_t i = 0; i <= word.size(); i++) {
            for (char ch : letters) {
                std::string next = word.substr(0, i) + ch + word.substr(i);
                if (next.size() <= longest + 1) add(next);
            }
        }
        for (size_t i = 0; i < word.size(); i++) {
            for (char ch : letters) {
                if (word[i] != ch) add(word.substr(0, i) + ch + word.substr(i + 1));
            }
        }
    }
    return -1;
}

static const std::array<std::array<std::string, 2>, 6> KINDS = {{
    {"lcs", "longest common subsequence"},
    {"lcsubstring", "longest common substring"},
    {"edit", "edit distance"},
    {"deletions", "deletions only"},
    {"scs", "shortest common supersequence"},
    {"distinct", "times the second is inside the first"},
}};

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::string a = "ABCBDAB";
    std::string b = "BDCABA";
    std::cout << "comparing '" << a << "' with '" << b << "'\\n\\n";
    std::cout << std::left << std::setw(40) << "reading" << std::right << std::setw(8) << "table"
              << std::setw(14) << "brute force" << "\\n";
    for (const auto &kind : KINDS) {
        std::cout << std::left << std::setw(40) << kind[1] << std::right << std::setw(8)
                  << grid(a, b, kind[0]) << std::setw(14) << brute(a, b, kind[0]) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 400;
    std::array<int, 6> scores{};
    for (int t = 0; t < TRIALS; t++) {
        std::string x, y;
        int na = 1 + rnd(6);
        for (int i = 0; i < na; i++) x += static_cast<char>(65 + rnd(3));
        int nb = 1 + rnd(5);
        for (int i = 0; i < nb; i++) y += static_cast<char>(65 + rnd(3));
        for (size_t k = 0; k < KINDS.size(); k++) {
            if (grid(x, y, KINDS[k][0]) == brute(x, y, KINDS[k][0])) scores[k]++;
        }
    }

    std::cout << "each reading against its own exhaustive search, on " << TRIALS << " random pairs:\\n";
    for (size_t k = 0; k < KINDS.size(); k++) {
        std::cout << "  " << std::left << std::setw(40) << KINDS[k][1] << std::right << std::setw(6)
                  << scores[k] << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.
use std::collections::{BTreeSet, VecDeque};

/// dp[i][j] over prefixes a[:i] and b[:j], under one of six readings.
fn grid(a: &[u8], b: &[u8], kind: &str) -> i64 {
    let rows = a.len() + 1;
    let cols = b.len() + 1;
    let mut table = vec![vec![0i64; cols]; rows];
    // Every reading but one is answered by the last cell. A common *substring*
    // has to be contiguous, so its cell means "the run ending exactly here" and
    // the answer is the largest cell anywhere in the grid.
    let mut largest = 0i64;

    for i in 0..rows {
        for j in 0..cols {
            if i == 0 && j == 0 {
                table[i][j] = if kind == "distinct" { 1 } else { 0 };
                continue;
            }
            match kind {
                "lcs" => {
                    let mut best = 0i64;
                    if i > 0 {
                        best = best.max(table[i - 1][j]);
                    }
                    if j > 0 {
                        best = best.max(table[i][j - 1]);
                    }
                    if i > 0 && j > 0 && a[i - 1] == b[j - 1] {
                        best = best.max(table[i - 1][j - 1] + 1);
                    }
                    table[i][j] = best;
                }
                "edit" => {
                    table[i][j] = if i == 0 {
                        j as i64
                    } else if j == 0 {
                        i as i64
                    } else if a[i - 1] == b[j - 1] {
                        table[i - 1][j - 1]
                    } else {
                        1 + table[i - 1][j - 1].min(table[i - 1][j]).min(table[i][j - 1])
                    };
                }
                "lcsubstring" => {
                    table[i][j] = if i > 0 && j > 0 && a[i - 1] == b[j - 1] {
                        table[i - 1][j - 1] + 1
                    } else {
                        0
                    };
                    if table[i][j] > largest {
                        largest = table[i][j];
                    }
                }
                "scs" => {
                    table[i][j] = if i == 0 {
                        j as i64
                    } else if j == 0 {
                        i as i64
                    } else if a[i - 1] == b[j - 1] {
                        table[i - 1][j - 1] + 1
                    } else {
                        1 + table[i - 1][j].min(table[i][j - 1])
                    };
                }
                "deletions" => {
                    table[i][j] = if i == 0 {
                        j as i64
                    } else if j == 0 {
                        i as i64
                    } else if a[i - 1] == b[j - 1] {
                        table[i - 1][j - 1]
                    } else {
                        1 + table[i - 1][j].min(table[i][j - 1])
                    };
                }
                _ => {
                    table[i][j] = if j == 0 {
                        1
                    } else if i == 0 {
                        0
                    } else if a[i - 1] == b[j - 1] {
                        table[i - 1][j - 1] + table[i - 1][j]
                    } else {
                        table[i - 1][j]
                    };
                }
            }
        }
    }
    if kind == "lcsubstring" { largest } else { table[rows - 1][cols - 1] }
}

/// Every subsequence of text.
fn subsequences(text: &[u8]) -> Vec<Vec<u8>> {
    let mut out = Vec::new();
    for mask in 0..(1usize << text.len()) {
        out.push((0..text.len()).filter(|i| mask >> i & 1 == 1).map(|i| text[i]).collect());
    }
    out
}

fn longest_shared(a: &[u8], b: &[u8]) -> usize {
    let in_b: BTreeSet<Vec<u8>> = subsequences(b).into_iter().collect();
    subsequences(a).into_iter().filter(|s| in_b.contains(s)).map(|s| s.len()).max().unwrap_or(0)
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    if needle.len() > haystack.len() {
        return false;
    }
    (0..=haystack.len() - needle.len()).any(|i| &haystack[i..i + needle.len()] == needle)
}

fn brute(a: &[u8], b: &[u8], kind: &str) -> i64 {
    match kind {
        "lcs" => longest_shared(a, b) as i64,
        "lcsubstring" => {
            let mut best = 0;
            for i in 0..a.len() {
                for j in (i + 1)..=a.len() {
                    if contains(b, &a[i..j]) && j - i > best {
                        best = j - i;
                    }
                }
            }
            best as i64
        }
        "distinct" => subsequences(a).into_iter().filter(|s| s.as_slice() == b).count() as i64,
        "deletions" => (a.len() + b.len()) as i64 - 2 * longest_shared(a, b) as i64,
        "scs" => (a.len() + b.len()) as i64 - longest_shared(a, b) as i64,
        _ => {
            // edit: every sequence of single edits, searched breadth-first
            let mut seen: BTreeSet<Vec<u8>> = BTreeSet::new();
            seen.insert(a.to_vec());
            let mut queue: VecDeque<(Vec<u8>, i64)> = VecDeque::new();
            queue.push_back((a.to_vec(), 0));
            let letters: BTreeSet<u8> = b.iter().copied().collect();
            let longest = a.len().max(b.len());
            while let Some((word, step)) = queue.pop_front() {
                if word.as_slice() == b {
                    return step;
                }
                if step > (a.len() + b.len()) as i64 {
                    continue;
                }
                let mut nexts: Vec<Vec<u8>> = Vec::new();
                for i in 0..word.len() {
                    let mut next = word.clone();
                    next.remove(i);
                    nexts.push(next);
                }
                for i in 0..=word.len() {
                    for &ch in &letters {
                        let mut next = word.clone();
                        next.insert(i, ch);
                        if next.len() <= longest + 1 {
                            nexts.push(next);
                        }
                    }
                }
                for i in 0..word.len() {
                    for &ch in &letters {
                        if word[i] != ch {
                            let mut next = word.clone();
                            next[i] = ch;
                            nexts.push(next);
                        }
                    }
                }
                for next in nexts {
                    if seen.insert(next.clone()) {
                        queue.push_back((next, step + 1));
                    }
                }
            }
            -1
        }
    }
}

const KINDS: [(&str, &str); 6] = [
    ("lcs", "longest common subsequence"),
    ("lcsubstring", "longest common substring"),
    ("edit", "edit distance"),
    ("deletions", "deletions only"),
    ("scs", "shortest common supersequence"),
    ("distinct", "times the second is inside the first"),
];

fn rand(seed: &mut i64, n: i64) -> usize {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as usize
}

fn main() {
    let a = b"ABCBDAB";
    let b = b"BDCABA";
    println!("comparing '{}' with '{}'", String::from_utf8_lossy(a), String::from_utf8_lossy(b));
    println!();
    println!("{:<40}{:>8}{:>14}", "reading", "table", "brute force");
    for (kind, label) in KINDS.iter() {
        println!("{:<40}{:>8}{:>14}", label, grid(a, b, kind), brute(a, b, kind));
    }
    println!();

    const TRIALS: i32 = 400;
    let mut seed = 1i64;
    let mut scores = [0i32; 6];
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 6);
        let x: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        let nb = 1 + rand(&mut seed, 5);
        let y: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 3)) as u8).collect();
        for (k, (kind, _)) in KINDS.iter().enumerate() {
            if grid(&x, &y, kind) == brute(&x, &y, kind) {
                scores[k] += 1;
            }
        }
    }

    println!("each reading against its own exhaustive search, on {} random pairs:", TRIALS);
    for (k, (_, label)) in KINDS.iter().enumerate() {
        println!("  {:<40}{:>6}", label, scores[k]);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Six problems about two strings, all of them the same grid. The state is always
// "a prefix of each", the transition always compares one pair of characters, and
// what changes is which moves are legal and what each one costs.
//
// Written once, parameterised by those two things, and each reading checked
// against its own exhaustive search.
package main

import (
	"fmt"
	"sort"
	"strings"
)

func maxOf(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func minOf(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

// dp[i][j] over prefixes a[:i] and b[:j], under one of six readings.
func grid(a, b, kind string) int64 {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int64, rows)
	for i := range table {
		table[i] = make([]int64, cols)
	}
	// Every reading but one is answered by the last cell. A common *substring*
	// has to be contiguous, so its cell means "the run ending exactly here" and
	// the answer is the largest cell anywhere in the grid.
	var largest int64

	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			if i == 0 && j == 0 {
				if kind == "distinct" {
					table[i][j] = 1
				}
				continue
			}
			switch kind {
			case "lcs":
				var best int64
				if i > 0 {
					best = maxOf(best, table[i-1][j])
				}
				if j > 0 {
					best = maxOf(best, table[i][j-1])
				}
				if i > 0 && j > 0 && a[i-1] == b[j-1] {
					best = maxOf(best, table[i-1][j-1]+1)
				}
				table[i][j] = best
			case "edit":
				if i == 0 {
					table[i][j] = int64(j)
				} else if j == 0 {
					table[i][j] = int64(i)
				} else if a[i-1] == b[j-1] {
					table[i][j] = table[i-1][j-1]
				} else {
					table[i][j] = 1 + minOf(table[i-1][j-1], minOf(table[i-1][j], table[i][j-1]))
				}
			case "lcsubstring":
				if i > 0 && j > 0 && a[i-1] == b[j-1] {
					table[i][j] = table[i-1][j-1] + 1
				} else {
					table[i][j] = 0
				}
				if table[i][j] > largest {
					largest = table[i][j]
				}
			case "scs":
				if i == 0 {
					table[i][j] = int64(j)
				} else if j == 0 {
					table[i][j] = int64(i)
				} else if a[i-1] == b[j-1] {
					table[i][j] = table[i-1][j-1] + 1
				} else {
					table[i][j] = 1 + minOf(table[i-1][j], table[i][j-1])
				}
			case "deletions":
				if i == 0 {
					table[i][j] = int64(j)
				} else if j == 0 {
					table[i][j] = int64(i)
				} else if a[i-1] == b[j-1] {
					table[i][j] = table[i-1][j-1]
				} else {
					table[i][j] = 1 + minOf(table[i-1][j], table[i][j-1])
				}
			default:
				if j == 0 {
					table[i][j] = 1
				} else if i == 0 {
					table[i][j] = 0
				} else if a[i-1] == b[j-1] {
					table[i][j] = table[i-1][j-1] + table[i-1][j]
				} else {
					table[i][j] = table[i-1][j]
				}
			}
		}
	}
	if kind == "lcsubstring" {
		return largest
	}
	return table[rows-1][cols-1]
}

// Every subsequence of text.
func subsequences(text string) []string {
	var out []string
	for mask := 0; mask < 1<<len(text); mask++ {
		var sb strings.Builder
		for i := 0; i < len(text); i++ {
			if mask>>i&1 == 1 {
				sb.WriteByte(text[i])
			}
		}
		out = append(out, sb.String())
	}
	return out
}

func longestShared(a, b string) int {
	inB := map[string]bool{}
	for _, s := range subsequences(b) {
		inB[s] = true
	}
	keep := 0
	for _, s := range subsequences(a) {
		if inB[s] && len(s) > keep {
			keep = len(s)
		}
	}
	return keep
}

func brute(a, b, kind string) int64 {
	switch kind {
	case "lcs":
		return int64(longestShared(a, b))
	case "lcsubstring":
		best := 0
		for i := 0; i < len(a); i++ {
			for j := i + 1; j <= len(a); j++ {
				if strings.Contains(b, a[i:j]) && j-i > best {
					best = j - i
				}
			}
		}
		return int64(best)
	case "distinct":
		var found int64
		for _, s := range subsequences(a) {
			if s == b {
				found++
			}
		}
		return found
	case "deletions":
		return int64(len(a) + len(b) - 2*longestShared(a, b))
	case "scs":
		return int64(len(a) + len(b) - longestShared(a, b))
	}

	// edit: every sequence of single edits, searched breadth-first
	seen := map[string]bool{a: true}
	words := []string{a}
	steps := []int{0}
	letterSet := map[rune]bool{}
	for _, ch := range b {
		letterSet[ch] = true
	}
	var letters []rune
	for ch := range letterSet {
		letters = append(letters, ch)
	}
	sort.Slice(letters, func(i, j int) bool { return letters[i] < letters[j] })
	for len(words) > 0 {
		word := words[0]
		step := steps[0]
		words = words[1:]
		steps = steps[1:]
		if word == b {
			return int64(step)
		}
		if step > len(a)+len(b) {
			continue
		}
		add := func(next string) {
			if !seen[next] {
				seen[next] = true
				words = append(words, next)
				steps = append(steps, step+1)
			}
		}
		for i := 0; i < len(word); i++ {
			add(word[:i] + word[i+1:])
		}
		longest := len(a)
		if len(b) > longest {
			longest = len(b)
		}
		for i := 0; i <= len(word); i++ {
			for _, ch := range letters {
				next := word[:i] + string(ch) + word[i:]
				if len(next) <= longest+1 {
					add(next)
				}
			}
		}
		for i := 0; i < len(word); i++ {
			for _, ch := range letters {
				if rune(word[i]) != ch {
					add(word[:i] + string(ch) + word[i+1:])
				}
			}
		}
	}
	return -1
}

var KINDS = [][2]string{
	{"lcs", "longest common subsequence"},
	{"lcsubstring", "longest common substring"},
	{"edit", "edit distance"},
	{"deletions", "deletions only"},
	{"scs", "shortest common supersequence"},
	{"distinct", "times the second is inside the first"},
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	a, b := "ABCBDAB", "BDCABA"
	fmt.Printf("comparing '%s' with '%s'\\n", a, b)
	fmt.Println()
	fmt.Printf("%-40s%8s%14s\\n", "reading", "table", "brute force")
	for _, kind := range KINDS {
		fmt.Printf("%-40s%8d%14d\\n", kind[1], grid(a, b, kind[0]), brute(a, b, kind[0]))
	}
	fmt.Println()

	const TRIALS = 400
	scores := make([]int, len(KINDS))
	for t := 0; t < TRIALS; t++ {
		var x, y strings.Builder
		na := 1 + rand(6)
		for i := 0; i < na; i++ {
			x.WriteByte(byte(65 + rand(3)))
		}
		nb := 1 + rand(5)
		for i := 0; i < nb; i++ {
			y.WriteByte(byte(65 + rand(3)))
		}
		for k, kind := range KINDS {
			if grid(x.String(), y.String(), kind[0]) == brute(x.String(), y.String(), kind[0]) {
				scores[k]++
			}
		}
	}

	fmt.Printf("each reading against its own exhaustive search, on %d random pairs:\\n", TRIALS)
	for k, kind := range KINDS {
		fmt.Printf("  %-40s%6d\\n", kind[1], scores[k])
	}
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-string-pair-grid",
        kind: "dp",
        algorithm: "lcs",
        title: "The two-prefix grid every reading shares",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "The answer is not always the bottom-right cell",
          body: "Five of these six readings are answered there and the substring one is not, because its cell means \"the run ending exactly here\" and a mismatch resets it to zero. Reading the last cell gives 0 where the answer is 2. Decide where the answer lives when you write the state, not after the table is full \u2014 module 27 lesson 3 makes the general case.",
        },
        {
          title: "Contiguous and non-contiguous are different problems",
          body: "Longest common subsequence and longest common substring differ by one branch: whether a mismatch may carry the previous value forward or must reset. They are frequently confused in problem statements as well as in code, and the giveaway word is contiguous or consecutive.",
        },
      ],
    },
    {
      id: "which-ones-are-arithmetic",
      heading: "Two of them are arithmetic, and one is not",
      body: [
        "Three of those six are not independent problems. Once you have the length of the longest common subsequence, two of them are arithmetic.",
        "Write `L` for that length. To turn `a` into `b` using deletions only, you delete everything in `a` outside the common part and everything in `b` outside it, so the cost is `n + m - 2L`. The shortest string containing both as subsequences writes the common part once and both remainders around it, so its length is `n + m - L`.",
        "Both are checked below against the tables that compute them directly rather than being taken on trust, and both hold on every one of six thousand random pairs.",
        "Then edit distance is checked against the same formula, and does not hold \u2014 which is the useful half. It is never *above* `n + m - 2L`, since anything deletions can do, edits can do too. It is *below* on 3,984 of the 6,000, because a replacement does in one move what a deletion and an insertion need two for. There is no formula from `L` to edit distance; the third move genuinely changes the problem.",
      ],
      examples: [
        {
          id: "identities-on-lcs",
          title: "Two identities on the LCS length, and the neighbour that has none",
          lang: "python",
          code: `# Three of those six readings are not independent problems. Once you have the
# longest common subsequence, two of them are arithmetic -- and one of them,
# which looks just as close, is not.
#
#   keep  = LCS(a, b)
#   deletions only            = len(a) + len(b) - 2 * keep
#   shortest common supersequence = len(a) + len(b) - keep
#
# Both are checked below against the tables that compute them directly. Edit
# distance is checked against the same formula and fails, which is the useful
# part: replacement does in one move what deletion needs two for.

def lcs(a, b):
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for i in range(1, rows):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
    return table[rows - 1][cols - 1]


def deletions_only(a, b):
    """Only deletions are allowed, from either string."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(cols):
        table[0][j] = j
    for i in range(1, rows):
        table[i][0] = i
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]
            else:
                table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1])
    return table[rows - 1][cols - 1]


def supersequence(a, b):
    """The shortest string containing both as subsequences."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(cols):
        table[0][j] = j
    for i in range(1, rows):
        table[i][0] = i
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1])
    return table[rows - 1][cols - 1]


def edit(a, b):
    """Insert, delete or replace, each costing one."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(cols):
        table[0][j] = j
    for i in range(1, rows):
        table[i][0] = i
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]
            else:
                table[i][j] = 1 + min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
    return table[rows - 1][cols - 1]


PAIRS = [
    ("ABCBDAB", "BDCABA"),
    ("kitten", "sitting"),
    ("abc", "abc"),
    ("abc", "xyz"),
    ("aaa", "aa"),
    ("intention", "execution"),
]

print(f"{'a':<12}{'b':<12}{'lcs':>5}{'del':>6}{'n+m-2L':>9}{'scs':>6}{'n+m-L':>8}{'edit':>6}")
for a, b in PAIRS:
    keep = lcs(a, b)
    print(f"{a:<12}{b:<12}{keep:>5}{deletions_only(a, b):>6}"
          f"{len(a) + len(b) - 2 * keep:>9}{supersequence(a, b):>6}"
          f"{len(a) + len(b) - keep:>8}{edit(a, b):>6}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 6000
del_matches = 0
scs_matches = 0
edit_matches = 0
edit_below = 0
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    b = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    keep = lcs(a, b)
    if deletions_only(a, b) == len(a) + len(b) - 2 * keep:
        del_matches += 1
    if supersequence(a, b) == len(a) + len(b) - keep:
        scs_matches += 1
    distance = edit(a, b)
    if distance == len(a) + len(b) - 2 * keep:
        edit_matches += 1
    if distance < len(a) + len(b) - 2 * keep:
        edit_below += 1

print(f"over {TRIALS} random pairs:")
print(f"  deletions only equals n + m - 2L        {del_matches:>6}")
print(f"  supersequence equals n + m - L          {scs_matches:>6}")
print(f"  edit distance equals n + m - 2L         {edit_matches:>6}")
print(f"  and is strictly below it                {edit_below:>6}")
print()
print("the last two lines are the point: edit distance is never above the")
print("delete-only cost and is often below it, because one replacement does what")
print("a deletion and an insertion would need two moves for.")
`,
          output: `a           b             lcs   del   n+m-2L   scs   n+m-L  edit
ABCBDAB     BDCABA          4     5        5     9       9     5
kitten      sitting         4     5        5     9       9     3
abc         abc             3     0        0     3       3     0
abc         xyz             0     6        6     6       6     3
aaa         aa              2     1        1     3       3     1
intention   execution       5     8        8    13      13     5

over 6000 random pairs:
  deletions only equals n + m - 2L          6000
  supersequence equals n + m - L            6000
  edit distance equals n + m - 2L           2016
  and is strictly below it                  3984

the last two lines are the point: edit distance is never above the
delete-only cost and is often below it, because one replacement does what
a deletion and an insertion would need two moves for.`,
          explanation:
            "The two identities are checked against the tables that compute those quantities directly, not against each other. Edit distance is then measured against the same formula so the gap is counted rather than described \u2014 it is never above, and below on about two thirds of pairs.",
          alternates: [
            {
              lang: "javascript",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.

function lcs(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
      else table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** Only deletions are allowed, from either string. */
function deletionsOnly(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** The shortest string containing both as subsequences. */
function supersequence(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
      else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** Insert, delete or replace, each costing one. */
function edit(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

const PAIRS = [
  ["ABCBDAB", "BDCABA"],
  ["kitten", "sitting"],
  ["abc", "abc"],
  ["abc", "xyz"],
  ["aaa", "aa"],
  ["intention", "execution"],
];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

console.log(
  padEnd("a", 12) + padEnd("b", 12) + pad("lcs", 5) + pad("del", 6) + pad("n+m-2L", 9) +
    pad("scs", 6) + pad("n+m-L", 8) + pad("edit", 6)
);
for (const [a, b] of PAIRS) {
  const keep = lcs(a, b);
  console.log(
    padEnd(a, 12) + padEnd(b, 12) + pad(keep, 5) + pad(deletionsOnly(a, b), 6) +
      pad(a.length + b.length - 2 * keep, 9) + pad(supersequence(a, b), 6) +
      pad(a.length + b.length - keep, 8) + pad(edit(a, b), 6)
  );
}
console.log();

const TRIALS = 6000;
let delMatches = 0;
let scsMatches = 0;
let editMatches = 0;
let editBelow = 0;
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const keep = lcs(a, b);
  if (deletionsOnly(a, b) === a.length + b.length - 2 * keep) delMatches++;
  if (supersequence(a, b) === a.length + b.length - keep) scsMatches++;
  const distance = edit(a, b);
  if (distance === a.length + b.length - 2 * keep) editMatches++;
  if (distance < a.length + b.length - 2 * keep) editBelow++;
}

console.log(\`over \${TRIALS} random pairs:\`);
console.log(\`  deletions only equals n + m - 2L        \${pad(delMatches, 6)}\`);
console.log(\`  supersequence equals n + m - L          \${pad(scsMatches, 6)}\`);
console.log(\`  edit distance equals n + m - 2L         \${pad(editMatches, 6)}\`);
console.log(\`  and is strictly below it                \${pad(editBelow, 6)}\`);
console.log();
console.log("the last two lines are the point: edit distance is never above the");
console.log("delete-only cost and is often below it, because one replacement does what");
console.log("a deletion and an insertion would need two moves for.");
`,
            },
            {
              lang: "typescript",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.

function lcs(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
      else table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** Only deletions are allowed, from either string. */
function deletionsOnly(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** The shortest string containing both as subsequences. */
function supersequence(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1;
      else table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

/** Insert, delete or replace, each costing one. */
function edit(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 0; j < cols; j++) table[0][j] = j;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[rows - 1][cols - 1];
}

const PAIRS: [string, string][] = [
  ["ABCBDAB", "BDCABA"],
  ["kitten", "sitting"],
  ["abc", "abc"],
  ["abc", "xyz"],
  ["aaa", "aa"],
  ["intention", "execution"],
];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

console.log(
  padEnd("a", 12) + padEnd("b", 12) + pad("lcs", 5) + pad("del", 6) + pad("n+m-2L", 9) +
    pad("scs", 6) + pad("n+m-L", 8) + pad("edit", 6)
);
for (const [a, b] of PAIRS) {
  const keep = lcs(a, b);
  console.log(
    padEnd(a, 12) + padEnd(b, 12) + pad(keep, 5) + pad(deletionsOnly(a, b), 6) +
      pad(a.length + b.length - 2 * keep, 9) + pad(supersequence(a, b), 6) +
      pad(a.length + b.length - keep, 8) + pad(edit(a, b), 6)
  );
}
console.log();

const TRIALS = 6000;
let delMatches = 0;
let scsMatches = 0;
let editMatches = 0;
let editBelow = 0;
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const keep = lcs(a, b);
  if (deletionsOnly(a, b) === a.length + b.length - 2 * keep) delMatches++;
  if (supersequence(a, b) === a.length + b.length - keep) scsMatches++;
  const distance = edit(a, b);
  if (distance === a.length + b.length - 2 * keep) editMatches++;
  if (distance < a.length + b.length - 2 * keep) editBelow++;
}

console.log(\`over \${TRIALS} random pairs:\`);
console.log(\`  deletions only equals n + m - 2L        \${pad(delMatches, 6)}\`);
console.log(\`  supersequence equals n + m - L          \${pad(scsMatches, 6)}\`);
console.log(\`  edit distance equals n + m - 2L         \${pad(editMatches, 6)}\`);
console.log(\`  and is strictly below it                \${pad(editBelow, 6)}\`);
console.log();
console.log("the last two lines are the point: edit distance is never above the");
console.log("delete-only cost and is often below it, because one replacement does what");
console.log("a deletion and an insertion would need two moves for.");
`,
            },
            {
              lang: "java",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.
public class Main {
    static int lcs(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int i = 1; i < rows; i++) {
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    /** Only deletions are allowed, from either string. */
    static int deletionsOnly(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 0; j < cols; j++) table[0][j] = j;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i;
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    /** The shortest string containing both as subsequences. */
    static int supersequence(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 0; j < cols; j++) table[0][j] = j;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i;
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    /** Insert, delete or replace, each costing one. */
    static int edit(String a, String b) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 0; j < cols; j++) table[0][j] = j;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i;
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = 1 + Math.min(table[i - 1][j - 1],
                        Math.min(table[i - 1][j], table[i][j - 1]));
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    static final String[][] PAIRS = {
        { "ABCBDAB", "BDCABA" },
        { "kitten", "sitting" },
        { "abc", "abc" },
        { "abc", "xyz" },
        { "aaa", "aa" },
        { "intention", "execution" },
    };

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        System.out.printf("%-12s%-12s%5s%6s%9s%6s%8s%6s%n",
            "a", "b", "lcs", "del", "n+m-2L", "scs", "n+m-L", "edit");
        for (String[] pair : PAIRS) {
            String a = pair[0];
            String b = pair[1];
            int keep = lcs(a, b);
            System.out.printf("%-12s%-12s%5d%6d%9d%6d%8d%6d%n", a, b, keep,
                deletionsOnly(a, b), a.length() + b.length() - 2 * keep,
                supersequence(a, b), a.length() + b.length() - keep, edit(a, b));
        }
        System.out.println();

        final int TRIALS = 6000;
        int delMatches = 0;
        int scsMatches = 0;
        int editMatches = 0;
        int editBelow = 0;
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder x = new StringBuilder();
            int na = 1 + rand(8);
            for (int i = 0; i < na; i++) x.append((char) (65 + rand(4)));
            StringBuilder y = new StringBuilder();
            int nb = 1 + rand(8);
            for (int i = 0; i < nb; i++) y.append((char) (65 + rand(4)));
            String a = x.toString();
            String b = y.toString();
            int keep = lcs(a, b);
            if (deletionsOnly(a, b) == a.length() + b.length() - 2 * keep) delMatches++;
            if (supersequence(a, b) == a.length() + b.length() - keep) scsMatches++;
            int distance = edit(a, b);
            if (distance == a.length() + b.length() - 2 * keep) editMatches++;
            if (distance < a.length() + b.length() - 2 * keep) editBelow++;
        }

        System.out.printf("over %d random pairs:%n", TRIALS);
        System.out.printf("  deletions only equals n + m - 2L        %6d%n", delMatches);
        System.out.printf("  supersequence equals n + m - L          %6d%n", scsMatches);
        System.out.printf("  edit distance equals n + m - 2L         %6d%n", editMatches);
        System.out.printf("  and is strictly below it                %6d%n", editBelow);
        System.out.println();
        System.out.println("the last two lines are the point: edit distance is never above the");
        System.out.println("delete-only cost and is often below it, because one replacement does what");
        System.out.println("a deletion and an insertion would need two moves for.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

int lcs(const std::string &a, const std::string &b) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1] + 1;
            } else {
                table[i][j] = std::max(table[i - 1][j], table[i][j - 1]);
            }
        }
    }
    return table[rows - 1][cols - 1];
}

// Only deletions are allowed, from either string.
int deletionsOnly(const std::string &a, const std::string &b) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 0; j < cols; j++) table[0][j] = j;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i;
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1];
            } else {
                table[i][j] = 1 + std::min(table[i - 1][j], table[i][j - 1]);
            }
        }
    }
    return table[rows - 1][cols - 1];
}

// The shortest string containing both as subsequences.
int supersequence(const std::string &a, const std::string &b) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 0; j < cols; j++) table[0][j] = j;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i;
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1] + 1;
            } else {
                table[i][j] = 1 + std::min(table[i - 1][j], table[i][j - 1]);
            }
        }
    }
    return table[rows - 1][cols - 1];
}

// Insert, delete or replace, each costing one.
int edit(const std::string &a, const std::string &b) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 0; j < cols; j++) table[0][j] = j;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i;
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1];
            } else {
                table[i][j] = 1 + std::min(table[i - 1][j - 1],
                    std::min(table[i - 1][j], table[i][j - 1]));
            }
        }
    }
    return table[rows - 1][cols - 1];
}

static const std::array<std::array<std::string, 2>, 6> PAIRS = {{
    {"ABCBDAB", "BDCABA"},
    {"kitten", "sitting"},
    {"abc", "abc"},
    {"abc", "xyz"},
    {"aaa", "aa"},
    {"intention", "execution"},
}};

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::cout << std::left << std::setw(12) << "a" << std::setw(12) << "b" << std::right
              << std::setw(5) << "lcs" << std::setw(6) << "del" << std::setw(9) << "n+m-2L"
              << std::setw(6) << "scs" << std::setw(8) << "n+m-L" << std::setw(6) << "edit" << "\\n";
    for (const auto &pair : PAIRS) {
        const std::string &a = pair[0];
        const std::string &b = pair[1];
        int keep = lcs(a, b);
        int n = static_cast<int>(a.size()), m = static_cast<int>(b.size());
        std::cout << std::left << std::setw(12) << a << std::setw(12) << b << std::right
                  << std::setw(5) << keep << std::setw(6) << deletionsOnly(a, b)
                  << std::setw(9) << n + m - 2 * keep << std::setw(6) << supersequence(a, b)
                  << std::setw(8) << n + m - keep << std::setw(6) << edit(a, b) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 6000;
    int delMatches = 0, scsMatches = 0, editMatches = 0, editBelow = 0;
    for (int t = 0; t < TRIALS; t++) {
        std::string a, b;
        int na = 1 + rnd(8);
        for (int i = 0; i < na; i++) a += static_cast<char>(65 + rnd(4));
        int nb = 1 + rnd(8);
        for (int i = 0; i < nb; i++) b += static_cast<char>(65 + rnd(4));
        int keep = lcs(a, b);
        int n = static_cast<int>(a.size()), m = static_cast<int>(b.size());
        if (deletionsOnly(a, b) == n + m - 2 * keep) delMatches++;
        if (supersequence(a, b) == n + m - keep) scsMatches++;
        int distance = edit(a, b);
        if (distance == n + m - 2 * keep) editMatches++;
        if (distance < n + m - 2 * keep) editBelow++;
    }

    std::cout << "over " << TRIALS << " random pairs:\\n";
    std::cout << "  deletions only equals n + m - 2L        " << std::setw(6) << delMatches << "\\n";
    std::cout << "  supersequence equals n + m - L          " << std::setw(6) << scsMatches << "\\n";
    std::cout << "  edit distance equals n + m - 2L         " << std::setw(6) << editMatches << "\\n";
    std::cout << "  and is strictly below it                " << std::setw(6) << editBelow << "\\n\\n";
    std::cout << "the last two lines are the point: edit distance is never above the\\n";
    std::cout << "delete-only cost and is often below it, because one replacement does what\\n";
    std::cout << "a deletion and an insertion would need two moves for.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.

fn lcs(a: &[u8], b: &[u8]) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for i in 1..rows {
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1] + 1
            } else {
                table[i - 1][j].max(table[i][j - 1])
            };
        }
    }
    table[rows - 1][cols - 1]
}

/// Only deletions are allowed, from either string.
fn deletions_only(a: &[u8], b: &[u8]) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 0..cols {
        table[0][j] = j as i32;
    }
    for i in 1..rows {
        table[i][0] = i as i32;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1]
            } else {
                1 + table[i - 1][j].min(table[i][j - 1])
            };
        }
    }
    table[rows - 1][cols - 1]
}

/// The shortest string containing both as subsequences.
fn supersequence(a: &[u8], b: &[u8]) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 0..cols {
        table[0][j] = j as i32;
    }
    for i in 1..rows {
        table[i][0] = i as i32;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1] + 1
            } else {
                1 + table[i - 1][j].min(table[i][j - 1])
            };
        }
    }
    table[rows - 1][cols - 1]
}

/// Insert, delete or replace, each costing one.
fn edit(a: &[u8], b: &[u8]) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 0..cols {
        table[0][j] = j as i32;
    }
    for i in 1..rows {
        table[i][0] = i as i32;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1]
            } else {
                1 + table[i - 1][j - 1].min(table[i - 1][j]).min(table[i][j - 1])
            };
        }
    }
    table[rows - 1][cols - 1]
}

const PAIRS: [(&str, &str); 6] = [
    ("ABCBDAB", "BDCABA"),
    ("kitten", "sitting"),
    ("abc", "abc"),
    ("abc", "xyz"),
    ("aaa", "aa"),
    ("intention", "execution"),
];

fn rand(seed: &mut i64, n: i64) -> usize {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as usize
}

fn main() {
    println!("{:<12}{:<12}{:>5}{:>6}{:>9}{:>6}{:>8}{:>6}",
        "a", "b", "lcs", "del", "n+m-2L", "scs", "n+m-L", "edit");
    for (a, b) in PAIRS.iter() {
        let (x, y) = (a.as_bytes(), b.as_bytes());
        let keep = lcs(x, y);
        let (n, m) = (x.len() as i32, y.len() as i32);
        println!("{:<12}{:<12}{:>5}{:>6}{:>9}{:>6}{:>8}{:>6}", a, b, keep,
            deletions_only(x, y), n + m - 2 * keep, supersequence(x, y), n + m - keep, edit(x, y));
    }
    println!();

    const TRIALS: i32 = 6000;
    let mut seed = 1i64;
    let mut del_matches = 0;
    let mut scs_matches = 0;
    let mut edit_matches = 0;
    let mut edit_below = 0;
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 8);
        let a: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let nb = 1 + rand(&mut seed, 8);
        let b: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let keep = lcs(&a, &b);
        let (n, m) = (a.len() as i32, b.len() as i32);
        if deletions_only(&a, &b) == n + m - 2 * keep {
            del_matches += 1;
        }
        if supersequence(&a, &b) == n + m - keep {
            scs_matches += 1;
        }
        let distance = edit(&a, &b);
        if distance == n + m - 2 * keep {
            edit_matches += 1;
        }
        if distance < n + m - 2 * keep {
            edit_below += 1;
        }
    }

    println!("over {} random pairs:", TRIALS);
    println!("  deletions only equals n + m - 2L        {:>6}", del_matches);
    println!("  supersequence equals n + m - L          {:>6}", scs_matches);
    println!("  edit distance equals n + m - 2L         {:>6}", edit_matches);
    println!("  and is strictly below it                {:>6}", edit_below);
    println!();
    println!("the last two lines are the point: edit distance is never above the");
    println!("delete-only cost and is often below it, because one replacement does what");
    println!("a deletion and an insertion would need two moves for.");
}
`,
            },
            {
              lang: "go",
              code: `// Three of those six readings are not independent problems. Once you have the
// longest common subsequence, two of them are arithmetic -- and one of them,
// which looks just as close, is not.
//
//   keep  = LCS(a, b)
//   deletions only                = len(a) + len(b) - 2 * keep
//   shortest common supersequence = len(a) + len(b) - keep
//
// Both are checked below against the tables that compute them directly. Edit
// distance is checked against the same formula and fails, which is the useful
// part: replacement does in one move what deletion needs two for.
package main

import "fmt"

func maxOf(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func minOf(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func lcs(a, b string) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for i := 1; i < rows; i++ {
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1] + 1
			} else {
				table[i][j] = maxOf(table[i-1][j], table[i][j-1])
			}
		}
	}
	return table[rows-1][cols-1]
}

// Only deletions are allowed, from either string.
func deletionsOnly(a, b string) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 0; j < cols; j++ {
		table[0][j] = j
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1]
			} else {
				table[i][j] = 1 + minOf(table[i-1][j], table[i][j-1])
			}
		}
	}
	return table[rows-1][cols-1]
}

// The shortest string containing both as subsequences.
func supersequence(a, b string) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 0; j < cols; j++ {
		table[0][j] = j
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1] + 1
			} else {
				table[i][j] = 1 + minOf(table[i-1][j], table[i][j-1])
			}
		}
	}
	return table[rows-1][cols-1]
}

// Insert, delete or replace, each costing one.
func edit(a, b string) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 0; j < cols; j++ {
		table[0][j] = j
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1]
			} else {
				table[i][j] = 1 + minOf(table[i-1][j-1], minOf(table[i-1][j], table[i][j-1]))
			}
		}
	}
	return table[rows-1][cols-1]
}

var PAIRS = [][2]string{
	{"ABCBDAB", "BDCABA"},
	{"kitten", "sitting"},
	{"abc", "abc"},
	{"abc", "xyz"},
	{"aaa", "aa"},
	{"intention", "execution"},
}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	fmt.Printf("%-12s%-12s%5s%6s%9s%6s%8s%6s\\n", "a", "b", "lcs", "del", "n+m-2L", "scs", "n+m-L", "edit")
	for _, pair := range PAIRS {
		a, b := pair[0], pair[1]
		keep := lcs(a, b)
		fmt.Printf("%-12s%-12s%5d%6d%9d%6d%8d%6d\\n", a, b, keep,
			deletionsOnly(a, b), len(a)+len(b)-2*keep,
			supersequence(a, b), len(a)+len(b)-keep, edit(a, b))
	}
	fmt.Println()

	const TRIALS = 6000
	delMatches, scsMatches, editMatches, editBelow := 0, 0, 0, 0
	for t := 0; t < TRIALS; t++ {
		na := 1 + rand(8)
		a := ""
		for i := 0; i < na; i++ {
			a += string(rune(65 + rand(4)))
		}
		nb := 1 + rand(8)
		b := ""
		for i := 0; i < nb; i++ {
			b += string(rune(65 + rand(4)))
		}
		keep := lcs(a, b)
		if deletionsOnly(a, b) == len(a)+len(b)-2*keep {
			delMatches++
		}
		if supersequence(a, b) == len(a)+len(b)-keep {
			scsMatches++
		}
		distance := edit(a, b)
		if distance == len(a)+len(b)-2*keep {
			editMatches++
		}
		if distance < len(a)+len(b)-2*keep {
			editBelow++
		}
	}

	fmt.Printf("over %d random pairs:\\n", TRIALS)
	fmt.Printf("  deletions only equals n + m - 2L        %6d\\n", delMatches)
	fmt.Printf("  supersequence equals n + m - L          %6d\\n", scsMatches)
	fmt.Printf("  edit distance equals n + m - 2L         %6d\\n", editMatches)
	fmt.Printf("  and is strictly below it                %6d\\n", editBelow)
	fmt.Println()
	fmt.Println("the last two lines are the point: edit distance is never above the")
	fmt.Println("delete-only cost and is often below it, because one replacement does what")
	fmt.Println("a deletion and an insertion would need two moves for.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Not every neighbour reduces to LCS",
          body: "Deletions-only and the shortest common supersequence are both arithmetic on L, and edit distance looks equally close and is not. It is strictly below n + m - 2L on about two thirds of random pairs, because replacement collapses two moves into one. Checking a suspected identity on a few thousand random inputs takes a second and settles it.",
        },
        {
          title: "An identity is a claim about every input",
          body: "Both formulas here hold on all 6,000 pairs tested, which is what makes them safe to use as a shortcut. The habit worth keeping is that the test came first: a formula that holds on the three examples you tried is not yet an identity, and this module has already produced several wrong programs that agreed with their worked example.",
        },
      ],
    },
    {
      id: "pricing-the-moves",
      heading: "When the operations stop costing the same",
      body: [
        "The grid has no opinion about every move costing one. Price the three moves separately and the same recurrence covers a family \u2014 spell-checkers that weight a transposition differently from an insertion, diff tools that make deletions cheap, alignment scoring in bioinformatics where the costs come from a substitution matrix.",
        "And once the prices are visible, one of them has a threshold you can read straight off the recurrence before running anything. A replacement is one move. Getting the same effect without one costs a deletion plus an insertion. So replacement is worth having exactly while `replace < delete + insert`, and at or above that price a minimising table has no reason ever to pick it.",
        "Which is what the numbers say. With insert and delete at one apiece, a replace price of 1 agrees with the never-replace table on 1,325 of 4,000 pairs; at 2 and at 3 it agrees on all 4,000. The threshold is exactly where the arithmetic predicted, and the check costs one loop.",
        "The alignment enumeration in the middle is worth a look for its own sake. It walks the two strings from front to back, consuming a character of one, of the other, or of both at each step, with no table anywhere \u2014 and it is the honest definition of what the grid is summarising. Every dynamic program in this module has an enumeration like that behind it, and writing it is the cheapest way to be sure the table means what you think.",
      ],
      examples: [
        {
          id: "weighted-edits",
          title: "The same grid with the three moves priced separately",
          lang: "python",
          code: `# The grid does not care that every operation costs one. Give the three moves
# their own prices and the same recurrence answers a family of problems -- and
# one of the prices has a threshold in it that can be read straight off the
# recurrence and then checked.
#
# A replacement is one move. Achieving the same thing without one costs a
# deletion plus an insertion. So replacement is worth having exactly while it is
# cheaper than the two together, and at or above that price the table stops
# using it at all.

BIG = 10 ** 6


def weighted_edit(a, b, insert, delete, replace):
    """The usual grid with the three moves priced separately."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(1, cols):
        table[0][j] = j * insert
    for i in range(1, rows):
        table[i][0] = i * delete
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]
            else:
                table[i][j] = min(
                    table[i - 1][j - 1] + replace,
                    table[i - 1][j] + delete,
                    table[i][j - 1] + insert,
                )
    return table[rows - 1][cols - 1]


def deletions_only(a, b, insert, delete):
    """The same grid with replacement removed from the choice set entirely."""
    rows, cols = len(a) + 1, len(b) + 1
    table = [[0] * cols for _ in range(rows)]
    for j in range(1, cols):
        table[0][j] = j * insert
    for i in range(1, rows):
        table[i][0] = i * delete
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]
            else:
                table[i][j] = min(table[i - 1][j] + delete, table[i][j - 1] + insert)
    return table[rows - 1][cols - 1]


def brute(a, b, insert, delete, replace):
    """Every alignment of the two strings, enumerated and priced.

    An alignment is a walk from the front of both strings to the end of both,
    where each step consumes a character of a, a character of b, or one of each.
    There is no table here: this recurses over the walks themselves, recomputing
    freely, and keeps the cheapest one it finds.
    """
    def walk(i, j):
        if i == len(a):
            return (len(b) - j) * insert
        if j == len(b):
            return (len(a) - i) * delete
        best = walk(i + 1, j + 1) + (0 if a[i] == b[j] else replace)
        step = walk(i + 1, j) + delete
        if step < best:
            best = step
        step = walk(i, j + 1) + insert
        if step < best:
            best = step
        return best

    return walk(0, 0)


PAIRS = [("kitten", "sitting"), ("abc", "xyz"), ("ab", "ba"), ("aab", "abb")]

print("insert and delete both cost 1; the replace price varies")
print()
print(f"{'a':<9}{'b':<9}{'replace=1':>11}{'replace=2':>11}{'replace=3':>11}{'no replace':>12}")
for a, b in PAIRS:
    print(f"{a:<9}{b:<9}"
          f"{weighted_edit(a, b, 1, 1, 1):>11}{weighted_edit(a, b, 1, 1, 2):>11}"
          f"{weighted_edit(a, b, 1, 1, 3):>11}{deletions_only(a, b, 1, 1):>12}")
print()

print("and the same four pairs checked against every alignment, enumerated:")
print(f"{'a':<9}{'b':<9}{'replace=1':>11}{'replace=2':>11}{'replace=3':>11}")
for a, b in PAIRS:
    print(f"{a:<9}{b:<9}"
          f"{brute(a, b, 1, 1, 1):>11}{brute(a, b, 1, 1, 2):>11}{brute(a, b, 1, 1, 3):>11}")
print()

seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 4000
same_as_no_replace = [0, 0, 0]
for _ in range(TRIALS):
    a = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    b = "".join(chr(65 + rand(4)) for _ in range(1 + rand(8)))
    without = deletions_only(a, b, 1, 1)
    for k, price in enumerate((1, 2, 3)):
        if weighted_edit(a, b, 1, 1, price) == without:
            same_as_no_replace[k] += 1

print(f"over {TRIALS} random pairs, how often the priced table equals the one")
print("that cannot replace at all:")
for k, price in enumerate((1, 2, 3)):
    print(f"  replace costs {price}     {same_as_no_replace[k]:>6}")
print()
print("at a price of 2 the two agree everywhere, and above it they still do:")
print("once a replacement costs as much as the delete and insert it stands in")
print("for, the minimum never has a reason to pick it.")
`,
          output: `insert and delete both cost 1; the replace price varies

a        b          replace=1  replace=2  replace=3  no replace
kitten   sitting            3          5          5           5
abc      xyz                3          6          6           6
ab       ba                 2          2          2           2
aab      abb                1          2          2           2

and the same four pairs checked against every alignment, enumerated:
a        b          replace=1  replace=2  replace=3
kitten   sitting            3          5          5
abc      xyz                3          6          6
ab       ba                 2          2          2
aab      abb                1          2          2

over 4000 random pairs, how often the priced table equals the one
that cannot replace at all:
  replace costs 1       1325
  replace costs 2       4000
  replace costs 3       4000

at a price of 2 the two agree everywhere, and above it they still do:
once a replacement costs as much as the delete and insert it stands in
for, the minimum never has a reason to pick it.`,
          explanation:
            "The three prices are parameters, and the fourth column is the table with replacement removed from the choice set altogether. The middle block re-derives the same four answers by enumerating alignments with no table at all, which is what the grid is a summary of.",
          alternates: [
            {
              lang: "javascript",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.

/** The usual grid with the three moves priced separately. */
function weightedEdit(a, b, insert, del, replace) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 1; j < cols; j++) table[0][j] = j * insert;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i * del;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1];
      } else {
        table[i][j] = Math.min(
          table[i - 1][j - 1] + replace,
          table[i - 1][j] + del,
          table[i][j - 1] + insert
        );
      }
    }
  }
  return table[rows - 1][cols - 1];
}

/** The same grid with replacement removed from the choice set entirely. */
function deletionsOnly(a, b, insert, del) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 1; j < cols; j++) table[0][j] = j * insert;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i * del;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = Math.min(table[i - 1][j] + del, table[i][j - 1] + insert);
    }
  }
  return table[rows - 1][cols - 1];
}

function walk(a, b, i, j, insert, del, replace) {
  if (i === a.length) return (b.length - j) * insert;
  if (j === b.length) return (a.length - i) * del;
  let best = walk(a, b, i + 1, j + 1, insert, del, replace) + (a[i] === b[j] ? 0 : replace);
  let step = walk(a, b, i + 1, j, insert, del, replace) + del;
  if (step < best) best = step;
  step = walk(a, b, i, j + 1, insert, del, replace) + insert;
  if (step < best) best = step;
  return best;
}

/**
 * Every alignment of the two strings, enumerated and priced.
 *
 * An alignment is a walk from the front of both strings to the end of both,
 * where each step consumes a character of a, a character of b, or one of each.
 * There is no table here: this recurses over the walks themselves, recomputing
 * freely, and keeps the cheapest one it finds.
 */
function brute(a, b, insert, del, replace) {
  return walk(a, b, 0, 0, insert, del, replace);
}

const PAIRS = [["kitten", "sitting"], ["abc", "xyz"], ["ab", "ba"], ["aab", "abb"]];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

console.log("insert and delete both cost 1; the replace price varies");
console.log();
console.log(
  padEnd("a", 9) + padEnd("b", 9) + pad("replace=1", 11) + pad("replace=2", 11) +
    pad("replace=3", 11) + pad("no replace", 12)
);
for (const [a, b] of PAIRS) {
  console.log(
    padEnd(a, 9) + padEnd(b, 9) + pad(weightedEdit(a, b, 1, 1, 1), 11) +
      pad(weightedEdit(a, b, 1, 1, 2), 11) + pad(weightedEdit(a, b, 1, 1, 3), 11) +
      pad(deletionsOnly(a, b, 1, 1), 12)
  );
}
console.log();

console.log("and the same four pairs checked against every alignment, enumerated:");
console.log(padEnd("a", 9) + padEnd("b", 9) + pad("replace=1", 11) + pad("replace=2", 11) + pad("replace=3", 11));
for (const [a, b] of PAIRS) {
  console.log(
    padEnd(a, 9) + padEnd(b, 9) + pad(brute(a, b, 1, 1, 1), 11) + pad(brute(a, b, 1, 1, 2), 11) +
      pad(brute(a, b, 1, 1, 3), 11)
  );
}
console.log();

const TRIALS = 4000;
const sameAsNoReplace = [0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const without = deletionsOnly(a, b, 1, 1);
  for (let k = 0; k < 3; k++) {
    if (weightedEdit(a, b, 1, 1, k + 1) === without) sameAsNoReplace[k]++;
  }
}

console.log(\`over \${TRIALS} random pairs, how often the priced table equals the one\`);
console.log("that cannot replace at all:");
for (let k = 0; k < 3; k++) {
  console.log(\`  replace costs \${k + 1}     \${pad(sameAsNoReplace[k], 6)}\`);
}
console.log();
console.log("at a price of 2 the two agree everywhere, and above it they still do:");
console.log("once a replacement costs as much as the delete and insert it stands in");
console.log("for, the minimum never has a reason to pick it.");
`,
            },
            {
              lang: "typescript",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.

/** The usual grid with the three moves priced separately. */
function weightedEdit(a: string, b: string, insert: number, del: number, replace: number): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 1; j < cols; j++) table[0][j] = j * insert;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i * del;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1];
      } else {
        table[i][j] = Math.min(
          table[i - 1][j - 1] + replace,
          table[i - 1][j] + del,
          table[i][j - 1] + insert
        );
      }
    }
  }
  return table[rows - 1][cols - 1];
}

/** The same grid with replacement removed from the choice set entirely. */
function deletionsOnly(a: string, b: string, insert: number, del: number): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let j = 1; j < cols; j++) table[0][j] = j * insert;
  for (let i = 1; i < rows; i++) {
    table[i][0] = i * del;
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1];
      else table[i][j] = Math.min(table[i - 1][j] + del, table[i][j - 1] + insert);
    }
  }
  return table[rows - 1][cols - 1];
}

function walk(a: string, b: string, i: number, j: number, insert: number, del: number, replace: number): number {
  if (i === a.length) return (b.length - j) * insert;
  if (j === b.length) return (a.length - i) * del;
  let best = walk(a, b, i + 1, j + 1, insert, del, replace) + (a[i] === b[j] ? 0 : replace);
  let step = walk(a, b, i + 1, j, insert, del, replace) + del;
  if (step < best) best = step;
  step = walk(a, b, i, j + 1, insert, del, replace) + insert;
  if (step < best) best = step;
  return best;
}

/**
 * Every alignment of the two strings, enumerated and priced.
 *
 * An alignment is a walk from the front of both strings to the end of both,
 * where each step consumes a character of a, a character of b, or one of each.
 * There is no table here: this recurses over the walks themselves, recomputing
 * freely, and keeps the cheapest one it finds.
 */
function brute(a: string, b: string, insert: number, del: number, replace: number): number {
  return walk(a, b, 0, 0, insert, del, replace);
}

const PAIRS: [string, string][] = [["kitten", "sitting"], ["abc", "xyz"], ["ab", "ba"], ["aab", "abb"]];

// BigInt, not Number: seed * 1103515245 runs past 2^53, so a double would
// silently round it and this stream would stop matching the other languages'.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

console.log("insert and delete both cost 1; the replace price varies");
console.log();
console.log(
  padEnd("a", 9) + padEnd("b", 9) + pad("replace=1", 11) + pad("replace=2", 11) +
    pad("replace=3", 11) + pad("no replace", 12)
);
for (const [a, b] of PAIRS) {
  console.log(
    padEnd(a, 9) + padEnd(b, 9) + pad(weightedEdit(a, b, 1, 1, 1), 11) +
      pad(weightedEdit(a, b, 1, 1, 2), 11) + pad(weightedEdit(a, b, 1, 1, 3), 11) +
      pad(deletionsOnly(a, b, 1, 1), 12)
  );
}
console.log();

console.log("and the same four pairs checked against every alignment, enumerated:");
console.log(padEnd("a", 9) + padEnd("b", 9) + pad("replace=1", 11) + pad("replace=2", 11) + pad("replace=3", 11));
for (const [a, b] of PAIRS) {
  console.log(
    padEnd(a, 9) + padEnd(b, 9) + pad(brute(a, b, 1, 1, 1), 11) + pad(brute(a, b, 1, 1, 2), 11) +
      pad(brute(a, b, 1, 1, 3), 11)
  );
}
console.log();

const TRIALS = 4000;
const sameAsNoReplace = [0, 0, 0];
for (let t = 0; t < TRIALS; t++) {
  let a = "";
  const na = 1 + rand(8);
  for (let i = 0; i < na; i++) a += String.fromCharCode(65 + rand(4));
  let b = "";
  const nb = 1 + rand(8);
  for (let i = 0; i < nb; i++) b += String.fromCharCode(65 + rand(4));
  const without = deletionsOnly(a, b, 1, 1);
  for (let k = 0; k < 3; k++) {
    if (weightedEdit(a, b, 1, 1, k + 1) === without) sameAsNoReplace[k]++;
  }
}

console.log(\`over \${TRIALS} random pairs, how often the priced table equals the one\`);
console.log("that cannot replace at all:");
for (let k = 0; k < 3; k++) {
  console.log(\`  replace costs \${k + 1}     \${pad(sameAsNoReplace[k], 6)}\`);
}
console.log();
console.log("at a price of 2 the two agree everywhere, and above it they still do:");
console.log("once a replacement costs as much as the delete and insert it stands in");
console.log("for, the minimum never has a reason to pick it.");
`,
            },
            {
              lang: "java",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.
public class Main {
    /** The usual grid with the three moves priced separately. */
    static int weightedEdit(String a, String b, int insert, int delete, int replace) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 1; j < cols; j++) table[0][j] = j * insert;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i * delete;
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = Math.min(table[i - 1][j - 1] + replace,
                        Math.min(table[i - 1][j] + delete, table[i][j - 1] + insert));
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    /** The same grid with replacement removed from the choice set entirely. */
    static int deletionsOnly(String a, String b, int insert, int delete) {
        int rows = a.length() + 1;
        int cols = b.length() + 1;
        int[][] table = new int[rows][cols];
        for (int j = 1; j < cols; j++) table[0][j] = j * insert;
        for (int i = 1; i < rows; i++) {
            table[i][0] = i * delete;
            for (int j = 1; j < cols; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    table[i][j] = table[i - 1][j - 1];
                } else {
                    table[i][j] = Math.min(table[i - 1][j] + delete, table[i][j - 1] + insert);
                }
            }
        }
        return table[rows - 1][cols - 1];
    }

    /**
     * Every alignment of the two strings, enumerated and priced.
     *
     * An alignment is a walk from the front of both strings to the end of both,
     * where each step consumes a character of a, a character of b, or one of each.
     * There is no table here: this recurses over the walks themselves, recomputing
     * freely, and keeps the cheapest one it finds.
     */
    static int brute(String a, String b, int insert, int delete, int replace) {
        return walk(a, b, 0, 0, insert, delete, replace);
    }

    static int walk(String a, String b, int i, int j, int insert, int delete, int replace) {
        if (i == a.length()) return (b.length() - j) * insert;
        if (j == b.length()) return (a.length() - i) * delete;
        int best = walk(a, b, i + 1, j + 1, insert, delete, replace)
            + (a.charAt(i) == b.charAt(j) ? 0 : replace);
        int step = walk(a, b, i + 1, j, insert, delete, replace) + delete;
        if (step < best) best = step;
        step = walk(a, b, i, j + 1, insert, delete, replace) + insert;
        if (step < best) best = step;
        return best;
    }

    static final String[][] PAIRS = {
        { "kitten", "sitting" }, { "abc", "xyz" }, { "ab", "ba" }, { "aab", "abb" },
    };

    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245 + 12345) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        System.out.println("insert and delete both cost 1; the replace price varies");
        System.out.println();
        System.out.printf("%-9s%-9s%11s%11s%11s%12s%n",
            "a", "b", "replace=1", "replace=2", "replace=3", "no replace");
        for (String[] pair : PAIRS) {
            String a = pair[0];
            String b = pair[1];
            System.out.printf("%-9s%-9s%11d%11d%11d%12d%n", a, b,
                weightedEdit(a, b, 1, 1, 1), weightedEdit(a, b, 1, 1, 2),
                weightedEdit(a, b, 1, 1, 3), deletionsOnly(a, b, 1, 1));
        }
        System.out.println();

        System.out.println("and the same four pairs checked against every alignment, enumerated:");
        System.out.printf("%-9s%-9s%11s%11s%11s%n", "a", "b", "replace=1", "replace=2", "replace=3");
        for (String[] pair : PAIRS) {
            String a = pair[0];
            String b = pair[1];
            System.out.printf("%-9s%-9s%11d%11d%11d%n", a, b,
                brute(a, b, 1, 1, 1), brute(a, b, 1, 1, 2), brute(a, b, 1, 1, 3));
        }
        System.out.println();

        final int TRIALS = 4000;
        int[] sameAsNoReplace = new int[3];
        for (int t = 0; t < TRIALS; t++) {
            StringBuilder x = new StringBuilder();
            int na = 1 + rand(8);
            for (int i = 0; i < na; i++) x.append((char) (65 + rand(4)));
            StringBuilder y = new StringBuilder();
            int nb = 1 + rand(8);
            for (int i = 0; i < nb; i++) y.append((char) (65 + rand(4)));
            String a = x.toString();
            String b = y.toString();
            int without = deletionsOnly(a, b, 1, 1);
            for (int k = 0; k < 3; k++) {
                if (weightedEdit(a, b, 1, 1, k + 1) == without) sameAsNoReplace[k]++;
            }
        }

        System.out.printf("over %d random pairs, how often the priced table equals the one%n", TRIALS);
        System.out.println("that cannot replace at all:");
        for (int k = 0; k < 3; k++) {
            System.out.printf("  replace costs %d     %6d%n", k + 1, sameAsNoReplace[k]);
        }
        System.out.println();
        System.out.println("at a price of 2 the two agree everywhere, and above it they still do:");
        System.out.println("once a replacement costs as much as the delete and insert it stands in");
        System.out.println("for, the minimum never has a reason to pick it.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.
#include <algorithm>
#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

// The usual grid with the three moves priced separately.
int weightedEdit(const std::string &a, const std::string &b, int insert, int del, int replace) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 1; j < cols; j++) table[0][j] = j * insert;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i * del;
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1];
            } else {
                table[i][j] = std::min(table[i - 1][j - 1] + replace,
                    std::min(table[i - 1][j] + del, table[i][j - 1] + insert));
            }
        }
    }
    return table[rows - 1][cols - 1];
}

// The same grid with replacement removed from the choice set entirely.
int deletionsOnly(const std::string &a, const std::string &b, int insert, int del) {
    int rows = static_cast<int>(a.size()) + 1, cols = static_cast<int>(b.size()) + 1;
    std::vector<std::vector<int>> table(rows, std::vector<int>(cols, 0));
    for (int j = 1; j < cols; j++) table[0][j] = j * insert;
    for (int i = 1; i < rows; i++) {
        table[i][0] = i * del;
        for (int j = 1; j < cols; j++) {
            if (a[i - 1] == b[j - 1]) {
                table[i][j] = table[i - 1][j - 1];
            } else {
                table[i][j] = std::min(table[i - 1][j] + del, table[i][j - 1] + insert);
            }
        }
    }
    return table[rows - 1][cols - 1];
}

int walk(const std::string &a, const std::string &b, size_t i, size_t j,
         int insert, int del, int replace) {
    if (i == a.size()) return static_cast<int>(b.size() - j) * insert;
    if (j == b.size()) return static_cast<int>(a.size() - i) * del;
    int best = walk(a, b, i + 1, j + 1, insert, del, replace) + (a[i] == b[j] ? 0 : replace);
    int step = walk(a, b, i + 1, j, insert, del, replace) + del;
    if (step < best) best = step;
    step = walk(a, b, i, j + 1, insert, del, replace) + insert;
    if (step < best) best = step;
    return best;
}

// Every alignment of the two strings, enumerated and priced.
//
// An alignment is a walk from the front of both strings to the end of both,
// where each step consumes a character of a, a character of b, or one of each.
// There is no table here: this recurses over the walks themselves, recomputing
// freely, and keeps the cheapest one it finds.
int brute(const std::string &a, const std::string &b, int insert, int del, int replace) {
    return walk(a, b, 0, 0, insert, del, replace);
}

static const std::array<std::array<std::string, 2>, 4> PAIRS = {{
    {"kitten", "sitting"}, {"abc", "xyz"}, {"ab", "ba"}, {"aab", "abb"},
}};

static std::int64_t seed = 1;

int rnd(int n) {
    seed = (seed * 1103515245 + 12345) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::cout << "insert and delete both cost 1; the replace price varies\\n\\n";
    std::cout << std::left << std::setw(9) << "a" << std::setw(9) << "b" << std::right
              << std::setw(11) << "replace=1" << std::setw(11) << "replace=2"
              << std::setw(11) << "replace=3" << std::setw(12) << "no replace" << "\\n";
    for (const auto &pair : PAIRS) {
        const std::string &a = pair[0];
        const std::string &b = pair[1];
        std::cout << std::left << std::setw(9) << a << std::setw(9) << b << std::right
                  << std::setw(11) << weightedEdit(a, b, 1, 1, 1)
                  << std::setw(11) << weightedEdit(a, b, 1, 1, 2)
                  << std::setw(11) << weightedEdit(a, b, 1, 1, 3)
                  << std::setw(12) << deletionsOnly(a, b, 1, 1) << "\\n";
    }
    std::cout << "\\n";

    std::cout << "and the same four pairs checked against every alignment, enumerated:\\n";
    std::cout << std::left << std::setw(9) << "a" << std::setw(9) << "b" << std::right
              << std::setw(11) << "replace=1" << std::setw(11) << "replace=2"
              << std::setw(11) << "replace=3" << "\\n";
    for (const auto &pair : PAIRS) {
        const std::string &a = pair[0];
        const std::string &b = pair[1];
        std::cout << std::left << std::setw(9) << a << std::setw(9) << b << std::right
                  << std::setw(11) << brute(a, b, 1, 1, 1) << std::setw(11) << brute(a, b, 1, 1, 2)
                  << std::setw(11) << brute(a, b, 1, 1, 3) << "\\n";
    }
    std::cout << "\\n";

    const int TRIALS = 4000;
    std::array<int, 3> sameAsNoReplace{};
    for (int t = 0; t < TRIALS; t++) {
        std::string a, b;
        int na = 1 + rnd(8);
        for (int i = 0; i < na; i++) a += static_cast<char>(65 + rnd(4));
        int nb = 1 + rnd(8);
        for (int i = 0; i < nb; i++) b += static_cast<char>(65 + rnd(4));
        int without = deletionsOnly(a, b, 1, 1);
        for (int k = 0; k < 3; k++) {
            if (weightedEdit(a, b, 1, 1, k + 1) == without) sameAsNoReplace[k]++;
        }
    }

    std::cout << "over " << TRIALS << " random pairs, how often the priced table equals the one\\n";
    std::cout << "that cannot replace at all:\\n";
    for (int k = 0; k < 3; k++) {
        std::cout << "  replace costs " << (k + 1) << "     " << std::setw(6)
                  << sameAsNoReplace[k] << "\\n";
    }
    std::cout << "\\n";
    std::cout << "at a price of 2 the two agree everywhere, and above it they still do:\\n";
    std::cout << "once a replacement costs as much as the delete and insert it stands in\\n";
    std::cout << "for, the minimum never has a reason to pick it.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.

/// The usual grid with the three moves priced separately.
fn weighted_edit(a: &[u8], b: &[u8], insert: i32, delete: i32, replace: i32) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 1..cols {
        table[0][j] = j as i32 * insert;
    }
    for i in 1..rows {
        table[i][0] = i as i32 * delete;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1]
            } else {
                (table[i - 1][j - 1] + replace)
                    .min(table[i - 1][j] + delete)
                    .min(table[i][j - 1] + insert)
            };
        }
    }
    table[rows - 1][cols - 1]
}

/// The same grid with replacement removed from the choice set entirely.
fn deletions_only(a: &[u8], b: &[u8], insert: i32, delete: i32) -> i32 {
    let (rows, cols) = (a.len() + 1, b.len() + 1);
    let mut table = vec![vec![0i32; cols]; rows];
    for j in 1..cols {
        table[0][j] = j as i32 * insert;
    }
    for i in 1..rows {
        table[i][0] = i as i32 * delete;
        for j in 1..cols {
            table[i][j] = if a[i - 1] == b[j - 1] {
                table[i - 1][j - 1]
            } else {
                (table[i - 1][j] + delete).min(table[i][j - 1] + insert)
            };
        }
    }
    table[rows - 1][cols - 1]
}

fn walk(a: &[u8], b: &[u8], i: usize, j: usize, insert: i32, delete: i32, replace: i32) -> i32 {
    if i == a.len() {
        return (b.len() - j) as i32 * insert;
    }
    if j == b.len() {
        return (a.len() - i) as i32 * delete;
    }
    let mut best = walk(a, b, i + 1, j + 1, insert, delete, replace)
        + if a[i] == b[j] { 0 } else { replace };
    let step = walk(a, b, i + 1, j, insert, delete, replace) + delete;
    if step < best {
        best = step;
    }
    let step = walk(a, b, i, j + 1, insert, delete, replace) + insert;
    if step < best {
        best = step;
    }
    best
}

/// Every alignment of the two strings, enumerated and priced.
///
/// An alignment is a walk from the front of both strings to the end of both,
/// where each step consumes a character of a, a character of b, or one of each.
/// There is no table here: this recurses over the walks themselves, recomputing
/// freely, and keeps the cheapest one it finds.
fn brute(a: &[u8], b: &[u8], insert: i32, delete: i32, replace: i32) -> i32 {
    walk(a, b, 0, 0, insert, delete, replace)
}

const PAIRS: [(&str, &str); 4] = [("kitten", "sitting"), ("abc", "xyz"), ("ab", "ba"), ("aab", "abb")];

fn rand(seed: &mut i64, n: i64) -> usize {
    *seed = (*seed * 1103515245 + 12345) % 2147483648;
    (*seed / 65536 % n) as usize
}

fn main() {
    println!("insert and delete both cost 1; the replace price varies");
    println!();
    println!("{:<9}{:<9}{:>11}{:>11}{:>11}{:>12}",
        "a", "b", "replace=1", "replace=2", "replace=3", "no replace");
    for (a, b) in PAIRS.iter() {
        let (x, y) = (a.as_bytes(), b.as_bytes());
        println!("{:<9}{:<9}{:>11}{:>11}{:>11}{:>12}", a, b,
            weighted_edit(x, y, 1, 1, 1), weighted_edit(x, y, 1, 1, 2),
            weighted_edit(x, y, 1, 1, 3), deletions_only(x, y, 1, 1));
    }
    println!();

    println!("and the same four pairs checked against every alignment, enumerated:");
    println!("{:<9}{:<9}{:>11}{:>11}{:>11}", "a", "b", "replace=1", "replace=2", "replace=3");
    for (a, b) in PAIRS.iter() {
        let (x, y) = (a.as_bytes(), b.as_bytes());
        println!("{:<9}{:<9}{:>11}{:>11}{:>11}", a, b,
            brute(x, y, 1, 1, 1), brute(x, y, 1, 1, 2), brute(x, y, 1, 1, 3));
    }
    println!();

    const TRIALS: i32 = 4000;
    let mut seed = 1i64;
    let mut same_as_no_replace = [0i32; 3];
    for _ in 0..TRIALS {
        let na = 1 + rand(&mut seed, 8);
        let a: Vec<u8> = (0..na).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let nb = 1 + rand(&mut seed, 8);
        let b: Vec<u8> = (0..nb).map(|_| (65 + rand(&mut seed, 4)) as u8).collect();
        let without = deletions_only(&a, &b, 1, 1);
        for k in 0..3 {
            if weighted_edit(&a, &b, 1, 1, k + 1) == without {
                same_as_no_replace[k as usize] += 1;
            }
        }
    }

    println!("over {} random pairs, how often the priced table equals the one", TRIALS);
    println!("that cannot replace at all:");
    for k in 0..3 {
        println!("  replace costs {}     {:>6}", k + 1, same_as_no_replace[k]);
    }
    println!();
    println!("at a price of 2 the two agree everywhere, and above it they still do:");
    println!("once a replacement costs as much as the delete and insert it stands in");
    println!("for, the minimum never has a reason to pick it.");
}
`,
            },
            {
              lang: "go",
              code: `// The grid does not care that every operation costs one. Give the three moves
// their own prices and the same recurrence answers a family of problems -- and
// one of the prices has a threshold in it that can be read straight off the
// recurrence and then checked.
//
// A replacement is one move. Achieving the same thing without one costs a
// deletion plus an insertion. So replacement is worth having exactly while it is
// cheaper than the two together, and at or above that price the table stops
// using it at all.
package main

import "fmt"

func minOf(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// The usual grid with the three moves priced separately.
func weightedEdit(a, b string, insert, delete, replace int) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 1; j < cols; j++ {
		table[0][j] = j * insert
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i * delete
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1]
			} else {
				table[i][j] = minOf(table[i-1][j-1]+replace,
					minOf(table[i-1][j]+delete, table[i][j-1]+insert))
			}
		}
	}
	return table[rows-1][cols-1]
}

// The same grid with replacement removed from the choice set entirely.
func deletionsOnly(a, b string, insert, delete int) int {
	rows, cols := len(a)+1, len(b)+1
	table := make([][]int, rows)
	for i := range table {
		table[i] = make([]int, cols)
	}
	for j := 1; j < cols; j++ {
		table[0][j] = j * insert
	}
	for i := 1; i < rows; i++ {
		table[i][0] = i * delete
		for j := 1; j < cols; j++ {
			if a[i-1] == b[j-1] {
				table[i][j] = table[i-1][j-1]
			} else {
				table[i][j] = minOf(table[i-1][j]+delete, table[i][j-1]+insert)
			}
		}
	}
	return table[rows-1][cols-1]
}

// Every alignment of the two strings, enumerated and priced.
//
// An alignment is a walk from the front of both strings to the end of both,
// where each step consumes a character of a, a character of b, or one of each.
// There is no table here: this recurses over the walks themselves, recomputing
// freely, and keeps the cheapest one it finds.
func brute(a, b string, insert, delete, replace int) int {
	return walk(a, b, 0, 0, insert, delete, replace)
}

func walk(a, b string, i, j, insert, delete, replace int) int {
	if i == len(a) {
		return (len(b) - j) * insert
	}
	if j == len(b) {
		return (len(a) - i) * delete
	}
	best := walk(a, b, i+1, j+1, insert, delete, replace)
	if a[i] != b[j] {
		best += replace
	}
	if step := walk(a, b, i+1, j, insert, delete, replace) + delete; step < best {
		best = step
	}
	if step := walk(a, b, i, j+1, insert, delete, replace) + insert; step < best {
		best = step
	}
	return best
}

var PAIRS = [][2]string{{"kitten", "sitting"}, {"abc", "xyz"}, {"ab", "ba"}, {"aab", "abb"}}

var seed int64 = 1

func rand(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func main() {
	fmt.Println("insert and delete both cost 1; the replace price varies")
	fmt.Println()
	fmt.Printf("%-9s%-9s%11s%11s%11s%12s\\n", "a", "b", "replace=1", "replace=2", "replace=3", "no replace")
	for _, pair := range PAIRS {
		a, b := pair[0], pair[1]
		fmt.Printf("%-9s%-9s%11d%11d%11d%12d\\n", a, b,
			weightedEdit(a, b, 1, 1, 1), weightedEdit(a, b, 1, 1, 2),
			weightedEdit(a, b, 1, 1, 3), deletionsOnly(a, b, 1, 1))
	}
	fmt.Println()

	fmt.Println("and the same four pairs checked against every alignment, enumerated:")
	fmt.Printf("%-9s%-9s%11s%11s%11s\\n", "a", "b", "replace=1", "replace=2", "replace=3")
	for _, pair := range PAIRS {
		a, b := pair[0], pair[1]
		fmt.Printf("%-9s%-9s%11d%11d%11d\\n", a, b,
			brute(a, b, 1, 1, 1), brute(a, b, 1, 1, 2), brute(a, b, 1, 1, 3))
	}
	fmt.Println()

	const TRIALS = 4000
	sameAsNoReplace := [3]int{}
	for t := 0; t < TRIALS; t++ {
		na := 1 + rand(8)
		a := ""
		for i := 0; i < na; i++ {
			a += string(rune(65 + rand(4)))
		}
		nb := 1 + rand(8)
		b := ""
		for i := 0; i < nb; i++ {
			b += string(rune(65 + rand(4)))
		}
		without := deletionsOnly(a, b, 1, 1)
		for k := 0; k < 3; k++ {
			if weightedEdit(a, b, 1, 1, k+1) == without {
				sameAsNoReplace[k]++
			}
		}
	}

	fmt.Printf("over %d random pairs, how often the priced table equals the one\\n", TRIALS)
	fmt.Println("that cannot replace at all:")
	for k := 0; k < 3; k++ {
		fmt.Printf("  replace costs %d     %6d\\n", k+1, sameAsNoReplace[k])
	}
	fmt.Println()
	fmt.Println("at a price of 2 the two agree everywhere, and above it they still do:")
	fmt.Println("once a replacement costs as much as the delete and insert it stands in")
	fmt.Println("for, the minimum never has a reason to pick it.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Weighted edits change which moves get used, not the recurrence",
          body: "The grid is unchanged; only the constants are. That means a threshold like replace >= delete + insert can be reasoned about before running anything, and then confirmed \u2014 here the priced table becomes identical to the never-replace table at exactly the predicted price.",
        },
        {
          title: "Keep an enumeration around, even after the table works",
          body: "The alignment walk in this example has no table and recomputes everything, which makes it slow and makes it trustworthy. It is the definition the grid is compressing, and it is what you check the grid against when you change the prices, add a move, or adjust the base row.",
        },
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, and what identifies it",
      body: [
        "So the shape, and the questions that identify it.",
        "**The state is a prefix of each sequence.** Two indices, one table, `O(n * m)` cells \u2014 and unlike knapsack, both dimensions are lengths rather than values, so this family is properly polynomial rather than pseudo-polynomial.",
        "**The transition compares one pair.** Equal or not equal, and then a small set of moves whose prices define the problem.",
        "**The differences are three switches**: is a match free or paid for, may one side advance alone, and does a mismatch reset the run or carry it.",
        "**And ask where the answer lives** before reading it. Bottom-right for most; largest cell for anything contiguous; and if the problem is a count rather than an optimum, remember from module 27 lesson 4 that the base case changes to a one rather than a zero.",
        "Everything from the foundations module applies unchanged. The row-at-a-time reduction from lesson 6 works here \u2014 that lesson used this very grid \u2014 and so does the caution that goes with it: dropping to one row destroys the traceback, and if the question was which edits rather than how many, Hirschberg's divide and conquer is the way to keep both.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Longest common subsequence and edit distance \u2014 how are they related?",
      answer:
        "They are the same grid with different moves. The state in both is a pair of prefixes, the transition in both compares a[i-1] against b[j-1], and what differs is the choice set: LCS may drop from either side and pays nothing for a match, edit distance may drop from either side, replace on the diagonal, and also pays nothing for a match. They are close enough that two of their neighbours are pure arithmetic on the LCS length \u2014 deletions-only distance is n + m - 2L, and the shortest common supersequence is n + m - L \u2014 but edit distance itself is not, because replacement does in one move what a deletion and an insertion need two for. On six thousand random pairs it sits strictly below n + m - 2L about two thirds of the time and never above it.",
    },
    {
      question: "What is the difference between longest common subsequence and longest common substring?",
      answer:
        "One branch, and where you read the answer. A subsequence may skip, so on a mismatch the cell carries forward the better of its two neighbours. A substring must be contiguous, so on a mismatch the cell resets to zero \u2014 and because the cell then means \"the run ending exactly here\", the answer is the largest cell anywhere in the table rather than the bottom-right one. That second half is easy to miss: reading the last cell gives 0 where the answer is 2. The word to watch for in a statement is contiguous or consecutive.",
    },
    {
      question: "How would you handle edit distance where the operations have different costs?",
      answer:
        "The recurrence does not change \u2014 only the constants do. Each branch adds its own price instead of one, and the base row and column become j * insert and i * delete rather than j and i. What that makes visible is a threshold you can reason about before running anything: a replacement achieves what a deletion plus an insertion achieves, so it is only ever worth taking while replace < delete + insert. At or above that price the minimum never selects it, and the priced table becomes identical to one with replacement removed from the choice set entirely \u2014 which on four thousand random pairs it does at exactly a replace cost of 2 when insert and delete are 1.",
    },
  ],
  takeaways: [
    "Every two-string problem here is one grid: the state is a prefix of each, and the transition compares one pair of characters.",
    "What separates the problems is three switches \u2014 is a match free, may one side advance alone, does a mismatch reset the run.",
    "Longest common substring is the exception that resets on a mismatch, and its answer is the largest cell rather than the last one.",
    "Deletions-only distance is n + m - 2L and the shortest common supersequence is n + m - L, both checked on 6,000 pairs.",
    "Edit distance has no such formula: it is never above n + m - 2L and below it on 3,984 of 6,000, because replacement collapses two moves into one.",
    "Pricing the three moves separately leaves the recurrence alone and only changes the constants.",
    "Replacement is worth taking only while it costs less than a delete plus an insert \u2014 measured, the tables coincide at exactly that price.",
    "Both dimensions are lengths rather than values, so this family is genuinely polynomial, unlike the knapsack family.",
  ],
  status: "available",
};
