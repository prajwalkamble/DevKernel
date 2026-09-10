import type { Lesson } from "@/content/types";

export const greedyOrDpLesson: Lesson = {
  id: "dsa-pattern-atlas-greedy-or-dp",
  slug: "greedy-or-dp",
  moduleSlug: "pattern-atlas-drills",
  title: "Greedy or DP: One Word Changes the Answer",
  summary:
    "The same statement with one extra word, and the greedy rule that was provably optimal becomes a heuristic that loses a third of the time. The test that separates them, and what the failures look like when you get it wrong.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "State the condition that makes a greedy rule safe rather than plausible",
    "Recognise when a decision needs an answer to a smaller version of itself",
    "Say what a wrong greedy rule's errors look like, and why they are hard to spot",
    "Choose between two plausible greedy rules by disproving both",
  ],
  sections: [
    {
      id: "one-word",
      heading: "One word",
      body: [
        "\"Given a set of intervals, pick as many as possible that do not overlap.\" That is a greedy problem and the rule is one line: sort by finishing time, take every interval that starts after the last one you took.",
        "\"Given a set of intervals **each with a value**, pick a non-overlapping set worth as much as possible.\" That is not a greedy problem. The statement changed by three words and the technique changed completely.",
        "The unweighted rule is not merely usually right, it is provably right, and the measurement says so: optimal on every one of 3,000 random sets, scored against an exhaustive search over every subset. The argument is short \u2014 taking the interval that frees the resource soonest can never leave you worse off, because any other first choice finishes no earlier and therefore rules out at least as much.",
        "Read that argument again and notice what it depends on: *the only thing an interval costs you is the time it occupies*. Add a value and that stops being true. Finishing soonest says nothing about being worth more, and the same rule drops to 1,934 of 3,000.",
      ],
      examples: [
        {
          id: "greedy-or-dp",
          title: "The same intervals, weighted and unweighted, against an exhaustive search",
          lang: "python",
          code: `# One statement, one extra word, and the pattern changes.
#
# "Given a set of intervals, pick as many as possible that do not overlap" is
# a greedy problem, and the greedy rule is one line: sort by finishing time
# and take every interval that starts after the last one you took.
#
# "Given a set of intervals *each with a value*, pick a non-overlapping set
# worth as much as possible" is not. The word "value" removes the reason the
# greedy rule was safe, and the answer becomes a dynamic programme.
#
# Both are scored below against an exhaustive search over every subset, which
# is the only way to be sure which one the greedy rule survives.
import itertools


def compatible(chosen):
    """Do these intervals avoid each other? Touching at an endpoint is allowed."""
    order = sorted(chosen)
    for i in range(1, len(order)):
        if order[i][0] < order[i - 1][1]:
            return False
    return True


def greedy_count(intervals):
    """Earliest finishing time first, take it if it fits."""
    order = sorted(intervals, key=lambda iv: (iv[1], iv[0]))
    taken = 0
    last_end = -(10 ** 9)
    for start, end, _ in order:
        if start >= last_end:
            taken += 1
            last_end = end
    return taken


def greedy_value(intervals):
    """The same rule, now trying to maximise value. Nothing justifies it."""
    order = sorted(intervals, key=lambda iv: (iv[1], iv[0]))
    total = 0
    last_end = -(10 ** 9)
    for start, end, value in order:
        if start >= last_end:
            total += value
            last_end = end
    return total


def greedy_by_value(intervals):
    """The other tempting rule: dearest first. Also nothing justifies it."""
    order = sorted(intervals, key=lambda iv: (-iv[2], iv[1], iv[0]))
    total = 0
    taken = []
    for start, end, value in order:
        if all(start >= e or end <= s for s, e, _ in taken):
            taken.append((start, end, value))
            total += value
    return total


def dp_value(intervals):
    """Sort by finish, then for each interval: take it or do not.

    Taking it means adding its value to the best answer among the intervals
    that finish at or before it starts -- which is exactly the recurrence a
    greedy rule cannot express, because it has to look backwards.
    """
    order = sorted(intervals, key=lambda iv: (iv[1], iv[0]))
    n = len(order)
    best = [0] * (n + 1)
    for i in range(1, n + 1):
        start, end, value = order[i - 1]
        skip = best[i - 1]
        j = 0
        for k in range(i - 1, -1, -1):
            if k == 0 or order[k - 1][1] <= start:
                j = k
                break
        take = value + best[j]
        best[i] = skip if skip > take else take
    return best[n]


def by_trying(intervals, weighted):
    """Every subset, checked for overlap. Exponential and exact."""
    best = 0
    n = len(intervals)
    for size in range(n + 1):
        for pick in itertools.combinations(intervals, size):
            if not compatible(pick):
                continue
            score = sum(iv[2] for iv in pick) if weighted else len(pick)
            if score > best:
                best = score
    return best


def show(intervals):
    return "[" + ", ".join("%d-%d:%d" % iv for iv in intervals) + "]"


CASES = [
    [(0, 3, 1), (2, 5, 1), (4, 7, 1)],
    [(0, 6, 5), (0, 2, 3), (3, 6, 3)],
    [(0, 2, 1), (1, 4, 9), (3, 5, 1)],
]

print("%-34s %-8s %-8s %-8s %s" % (
    "intervals", "count", "greedy", "dearest", "best value"))
for intervals in CASES:
    print("%-34s %-8d %-8d %-8d %d" % (
        show(intervals), greedy_count(intervals), greedy_value(intervals),
        greedy_by_value(intervals), by_trying(intervals, True)))

# The same linear congruential generator in every language, so the random
# instances below are the same instances whichever translation is run.
seed = 31081


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
count_ok = 0
finish_ok = dearest_ok = dp_ok = 0
finish_low = finish_high = 0
for _ in range(trials):
    n = 1 + rand(6)
    intervals = []
    for _ in range(n):
        start = rand(8)
        end = start + 1 + rand(4)
        intervals.append((start, end, 1 + rand(9)))

    count_ok += greedy_count(intervals) == by_trying(intervals, False)

    want = by_trying(intervals, True)
    got = greedy_value(intervals)
    finish_ok += got == want
    dearest_ok += greedy_by_value(intervals) == want
    dp_ok += dp_value(intervals) == want
    if got < want:
        finish_low += 1
    if got > want:
        finish_high += 1

print()
print("over %d random sets of at most 6 intervals:" % trials)
print("  %-44s %6d" % ("unweighted: earliest finish was optimal", count_ok))
print()
print("  %-44s %6d" % ("weighted: earliest finish was optimal", finish_ok))
print("  %-44s %6d" % ("weighted: dearest first was optimal", dearest_ok))
print("  %-44s %6d" % ("weighted: the dynamic programme was", dp_ok))
print("  %-44s %6d" % ("times earliest finish scored too low", finish_low))
print("  %-44s %6d" % ("times it scored too high", finish_high))

print()
print("The first counter is the greedy theorem: on the unweighted problem,")
print("earliest finishing time was optimal on every one of the %d sets." % count_ok)
print("That is not luck. Taking the interval that frees the resource soonest")
print("can never leave you worse off, because any other first choice finishes")
print("no earlier and so rules out at least as much.")
print()
print("Add values and that argument dies. Finishing soonest says nothing about")
print("being worth more, and the same rule dropped to %d of %d. Row three of" % (finish_ok, trials))
print("the demo is the smallest case: it takes two intervals worth 1 each and")
print("misses the single one worth 9.")
print()
print("Sorting by value instead is better and still not right -- %d of %d" % (dearest_ok, trials))
print("-- because a dear interval can block two cheaper ones that together")
print("beat it. Row two is that: one interval worth 5 against two worth 3.")
print("Two plausible greedy rules, two different sets of failures, and no")
print("way to tell which you are looking at from the statement alone.")
print()
print("Every failure is in the same direction, %d too low and %d too high," % (finish_low, finish_high))
print("which is what a greedy rule looks like when it is merely a heuristic:")
print("it produces a legal answer, never an impossible one, and sometimes not")
print("the best one.")
print()
print("The dynamic programme is right on all %d, and the shape of it is the" % dp_ok)
print("recognition lesson. It asks, for each interval, take it or leave it --")
print("and to take it, it needs the best answer over everything that finished")
print("before this one started. A greedy rule cannot express that, because it")
print("looks only at the choice in front of it. When a decision needs an")
print("answer to a smaller version of the same question, that is the tell for")
print("dynamic programming, and no amount of sorting will replace it.")
`,
          output: `intervals                          count    greedy   dearest  best value
[0-3:1, 2-5:1, 4-7:1]              2        2        2        2
[0-6:5, 0-2:3, 3-6:3]              2        6        5        6
[0-2:1, 1-4:9, 3-5:1]              2        2        9        9

over 3000 random sets of at most 6 intervals:
  unweighted: earliest finish was optimal        3000

  weighted: earliest finish was optimal          1934
  weighted: dearest first was optimal            2839
  weighted: the dynamic programme was            3000
  times earliest finish scored too low           1066
  times it scored too high                          0

The first counter is the greedy theorem: on the unweighted problem,
earliest finishing time was optimal on every one of the 3000 sets.
That is not luck. Taking the interval that frees the resource soonest
can never leave you worse off, because any other first choice finishes
no earlier and so rules out at least as much.

Add values and that argument dies. Finishing soonest says nothing about
being worth more, and the same rule dropped to 1934 of 3000. Row three of
the demo is the smallest case: it takes two intervals worth 1 each and
misses the single one worth 9.

Sorting by value instead is better and still not right -- 2839 of 3000
-- because a dear interval can block two cheaper ones that together
beat it. Row two is that: one interval worth 5 against two worth 3.
Two plausible greedy rules, two different sets of failures, and no
way to tell which you are looking at from the statement alone.

Every failure is in the same direction, 1066 too low and 0 too high,
which is what a greedy rule looks like when it is merely a heuristic:
it produces a legal answer, never an impossible one, and sometimes not
the best one.

The dynamic programme is right on all 3000, and the shape of it is the
recognition lesson. It asks, for each interval, take it or leave it --
and to take it, it needs the best answer over everything that finished
before this one started. A greedy rule cannot express that, because it
looks only at the choice in front of it. When a decision needs an
answer to a smaller version of the same question, that is the tell for
dynamic programming, and no amount of sorting will replace it.`,
          explanation:
            "Two plausible greedy rules and one dynamic programme, all scored against every subset. The first counter is a theorem; the next two are heuristics, and they fail on different inputs.",
          alternates: [
            {
              lang: "javascript",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.

// Do these intervals avoid each other? Touching at an endpoint is allowed.
function compatible(chosen) {
  const order = [...chosen].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  for (let i = 1; i < order.length; i += 1) {
    if (order[i][0] < order[i - 1][1]) return false;
  }
  return true;
}

const byFinish = (a, b) => (a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]);

// Earliest finishing time first, take it if it fits.
function greedyCount(intervals) {
  const order = [...intervals].sort(byFinish);
  let taken = 0;
  let lastEnd = -(10 ** 9);
  for (const [start, end] of order) {
    if (start >= lastEnd) {
      taken += 1;
      lastEnd = end;
    }
  }
  return taken;
}

// The same rule, now trying to maximise value. Nothing justifies it.
function greedyValue(intervals) {
  const order = [...intervals].sort(byFinish);
  let total = 0;
  let lastEnd = -(10 ** 9);
  for (const [start, end, value] of order) {
    if (start >= lastEnd) {
      total += value;
      lastEnd = end;
    }
  }
  return total;
}

// The other tempting rule: dearest first. Also nothing justifies it.
function greedyByValue(intervals) {
  const order = [...intervals].sort((a, b) => {
    if (a[2] !== b[2]) return b[2] - a[2];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[0] - b[0];
  });
  let total = 0;
  const taken = [];
  for (const [start, end, value] of order) {
    if (taken.every(([s, e]) => start >= e || end <= s)) {
      taken.push([start, end, value]);
      total += value;
    }
  }
  return total;
}

// Sort by finish, then for each interval: take it or do not.
//
// Taking it means adding its value to the best answer among the intervals
// that finish at or before it starts -- which is exactly the recurrence a
// greedy rule cannot express, because it has to look backwards.
function dpValue(intervals) {
  const order = [...intervals].sort(byFinish);
  const n = order.length;
  const best = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    const [start, , value] = order[i - 1];
    const skip = best[i - 1];
    let j = 0;
    for (let k = i - 1; k >= 0; k -= 1) {
      if (k === 0 || order[k - 1][1] <= start) {
        j = k;
        break;
      }
    }
    const take = value + best[j];
    best[i] = skip > take ? skip : take;
  }
  return best[n];
}

// Every subset, checked for overlap. Exponential and exact.
function byTrying(intervals, weighted) {
  let best = 0;
  const n = intervals.length;
  const pick = [];
  const walk = (start) => {
    if (compatible(pick)) {
      const score = weighted ? pick.reduce((sum, iv) => sum + iv[2], 0) : pick.length;
      if (score > best) best = score;
    }
    for (let i = start; i < n; i += 1) {
      pick.push(intervals[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return best;
}

function show(intervals) {
  return "[" + intervals.map(([s, e, v]) => \`\${s}-\${e}:\${v}\`).join(", ") + "]";
}

const CASES = [
  [[0, 3, 1], [2, 5, 1], [4, 7, 1]],
  [[0, 6, 5], [0, 2, 3], [3, 6, 3]],
  [[0, 2, 1], [1, 4, 9], [3, 5, 1]],
];

console.log(
  "intervals".padEnd(34) + " " + "count".padEnd(8) + " " + "greedy".padEnd(8) + " " +
  "dearest".padEnd(8) + " " + "best value",
);
for (const intervals of CASES) {
  console.log(
    show(intervals).padEnd(34) + " " + String(greedyCount(intervals)).padEnd(8) + " " +
    String(greedyValue(intervals)).padEnd(8) + " " +
    String(greedyByValue(intervals)).padEnd(8) + " " + byTrying(intervals, true),
  );
}

// The same linear congruential generator in every language, so the random
// instances below are the same instances whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 31081n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let countOk = 0;
let finishOk = 0;
let dearestOk = 0;
let dpOk = 0;
let finishLow = 0;
let finishHigh = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 1 + rand(6);
  const intervals = [];
  for (let i = 0; i < n; i += 1) {
    const start = rand(8);
    const end = start + 1 + rand(4);
    intervals.push([start, end, 1 + rand(9)]);
  }

  if (greedyCount(intervals) === byTrying(intervals, false)) countOk += 1;

  const want = byTrying(intervals, true);
  const got = greedyValue(intervals);
  if (got === want) finishOk += 1;
  if (greedyByValue(intervals) === want) dearestOk += 1;
  if (dpValue(intervals) === want) dpOk += 1;
  if (got < want) finishLow += 1;
  if (got > want) finishHigh += 1;
}

const row = (text, value) => "  " + text.padEnd(44) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random sets of at most 6 intervals:\`);
console.log(row("unweighted: earliest finish was optimal", countOk));
console.log();
console.log(row("weighted: earliest finish was optimal", finishOk));
console.log(row("weighted: dearest first was optimal", dearestOk));
console.log(row("weighted: the dynamic programme was", dpOk));
console.log(row("times earliest finish scored too low", finishLow));
console.log(row("times it scored too high", finishHigh));

console.log();
console.log("The first counter is the greedy theorem: on the unweighted problem,");
console.log(\`earliest finishing time was optimal on every one of the \${countOk} sets.\`);
console.log("That is not luck. Taking the interval that frees the resource soonest");
console.log("can never leave you worse off, because any other first choice finishes");
console.log("no earlier and so rules out at least as much.");
console.log();
console.log("Add values and that argument dies. Finishing soonest says nothing about");
console.log(\`being worth more, and the same rule dropped to \${finishOk} of \${trials}. Row three of\`);
console.log("the demo is the smallest case: it takes two intervals worth 1 each and");
console.log("misses the single one worth 9.");
console.log();
console.log(\`Sorting by value instead is better and still not right -- \${dearestOk} of \${trials}\`);
console.log("-- because a dear interval can block two cheaper ones that together");
console.log("beat it. Row two is that: one interval worth 5 against two worth 3.");
console.log("Two plausible greedy rules, two different sets of failures, and no");
console.log("way to tell which you are looking at from the statement alone.");
console.log();
console.log(\`Every failure is in the same direction, \${finishLow} too low and \${finishHigh} too high,\`);
console.log("which is what a greedy rule looks like when it is merely a heuristic:");
console.log("it produces a legal answer, never an impossible one, and sometimes not");
console.log("the best one.");
console.log();
console.log(\`The dynamic programme is right on all \${dpOk}, and the shape of it is the\`);
console.log("recognition lesson. It asks, for each interval, take it or leave it --");
console.log("and to take it, it needs the best answer over everything that finished");
console.log("before this one started. A greedy rule cannot express that, because it");
console.log("looks only at the choice in front of it. When a decision needs an");
console.log("answer to a smaller version of the same question, that is the tell for");
console.log("dynamic programming, and no amount of sorting will replace it.");
`,
            },
            {
              lang: "typescript",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.

// Do these intervals avoid each other? Touching at an endpoint is allowed.
function compatible(chosen: number[][]): boolean {
  const order = [...chosen].sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  for (let i = 1; i < order.length; i += 1) {
    if (order[i][0] < order[i - 1][1]) return false;
  }
  return true;
}

const byFinish = (a: number[], b: number[]): number => (a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]);

// Earliest finishing time first, take it if it fits.
function greedyCount(intervals: number[][]): number {
  const order = [...intervals].sort(byFinish);
  let taken = 0;
  let lastEnd = -(10 ** 9);
  for (const [start, end] of order) {
    if (start >= lastEnd) {
      taken += 1;
      lastEnd = end;
    }
  }
  return taken;
}

// The same rule, now trying to maximise value. Nothing justifies it.
function greedyValue(intervals: number[][]): number {
  const order = [...intervals].sort(byFinish);
  let total = 0;
  let lastEnd = -(10 ** 9);
  for (const [start, end, value] of order) {
    if (start >= lastEnd) {
      total += value;
      lastEnd = end;
    }
  }
  return total;
}

// The other tempting rule: dearest first. Also nothing justifies it.
function greedyByValue(intervals: number[][]): number {
  const order = [...intervals].sort((a, b) => {
    if (a[2] !== b[2]) return b[2] - a[2];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[0] - b[0];
  });
  let total = 0;
  const taken: number[][] = [];
  for (const [start, end, value] of order) {
    if (taken.every(([s, e]) => start >= e || end <= s)) {
      taken.push([start, end, value]);
      total += value;
    }
  }
  return total;
}

// Sort by finish, then for each interval: take it or do not.
//
// Taking it means adding its value to the best answer among the intervals
// that finish at or before it starts -- which is exactly the recurrence a
// greedy rule cannot express, because it has to look backwards.
function dpValue(intervals: number[][]): number {
  const order = [...intervals].sort(byFinish);
  const n = order.length;
  const best = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    const [start, , value] = order[i - 1];
    const skip = best[i - 1];
    let j = 0;
    for (let k = i - 1; k >= 0; k -= 1) {
      if (k === 0 || order[k - 1][1] <= start) {
        j = k;
        break;
      }
    }
    const take = value + best[j];
    best[i] = skip > take ? skip : take;
  }
  return best[n];
}

// Every subset, checked for overlap. Exponential and exact.
function byTrying(intervals: number[][], weighted: boolean): number {
  let best = 0;
  const n = intervals.length;
  const pick: number[][] = [];
  const walk = (start: number): void => {
    if (compatible(pick)) {
      const score = weighted ? pick.reduce((sum, iv) => sum + iv[2], 0) : pick.length;
      if (score > best) best = score;
    }
    for (let i = start; i < n; i += 1) {
      pick.push(intervals[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return best;
}

function show(intervals: number[][]): string {
  return "[" + intervals.map(([s, e, v]) => \`\${s}-\${e}:\${v}\`).join(", ") + "]";
}

const CASES: number[][][] = [
  [[0, 3, 1], [2, 5, 1], [4, 7, 1]],
  [[0, 6, 5], [0, 2, 3], [3, 6, 3]],
  [[0, 2, 1], [1, 4, 9], [3, 5, 1]],
];

console.log(
  "intervals".padEnd(34) + " " + "count".padEnd(8) + " " + "greedy".padEnd(8) + " " +
  "dearest".padEnd(8) + " " + "best value",
);
for (const intervals of CASES) {
  console.log(
    show(intervals).padEnd(34) + " " + String(greedyCount(intervals)).padEnd(8) + " " +
    String(greedyValue(intervals)).padEnd(8) + " " +
    String(greedyByValue(intervals)).padEnd(8) + " " + byTrying(intervals, true),
  );
}

// The same linear congruential generator in every language, so the random
// instances below are the same instances whichever translation is run.
// JavaScript needs BigInt here because the multiply runs past 2^53.
let seed = 31081n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let countOk = 0;
let finishOk = 0;
let dearestOk = 0;
let dpOk = 0;
let finishLow = 0;
let finishHigh = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 1 + rand(6);
  const intervals: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const start = rand(8);
    const end = start + 1 + rand(4);
    intervals.push([start, end, 1 + rand(9)]);
  }

  if (greedyCount(intervals) === byTrying(intervals, false)) countOk += 1;

  const want = byTrying(intervals, true);
  const got = greedyValue(intervals);
  if (got === want) finishOk += 1;
  if (greedyByValue(intervals) === want) dearestOk += 1;
  if (dpValue(intervals) === want) dpOk += 1;
  if (got < want) finishLow += 1;
  if (got > want) finishHigh += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(44) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random sets of at most 6 intervals:\`);
console.log(row("unweighted: earliest finish was optimal", countOk));
console.log();
console.log(row("weighted: earliest finish was optimal", finishOk));
console.log(row("weighted: dearest first was optimal", dearestOk));
console.log(row("weighted: the dynamic programme was", dpOk));
console.log(row("times earliest finish scored too low", finishLow));
console.log(row("times it scored too high", finishHigh));

console.log();
console.log("The first counter is the greedy theorem: on the unweighted problem,");
console.log(\`earliest finishing time was optimal on every one of the \${countOk} sets.\`);
console.log("That is not luck. Taking the interval that frees the resource soonest");
console.log("can never leave you worse off, because any other first choice finishes");
console.log("no earlier and so rules out at least as much.");
console.log();
console.log("Add values and that argument dies. Finishing soonest says nothing about");
console.log(\`being worth more, and the same rule dropped to \${finishOk} of \${trials}. Row three of\`);
console.log("the demo is the smallest case: it takes two intervals worth 1 each and");
console.log("misses the single one worth 9.");
console.log();
console.log(\`Sorting by value instead is better and still not right -- \${dearestOk} of \${trials}\`);
console.log("-- because a dear interval can block two cheaper ones that together");
console.log("beat it. Row two is that: one interval worth 5 against two worth 3.");
console.log("Two plausible greedy rules, two different sets of failures, and no");
console.log("way to tell which you are looking at from the statement alone.");
console.log();
console.log(\`Every failure is in the same direction, \${finishLow} too low and \${finishHigh} too high,\`);
console.log("which is what a greedy rule looks like when it is merely a heuristic:");
console.log("it produces a legal answer, never an impossible one, and sometimes not");
console.log("the best one.");
console.log();
console.log(\`The dynamic programme is right on all \${dpOk}, and the shape of it is the\`);
console.log("recognition lesson. It asks, for each interval, take it or leave it --");
console.log("and to take it, it needs the best answer over everything that finished");
console.log("before this one started. A greedy rule cannot express that, because it");
console.log("looks only at the choice in front of it. When a decision needs an");
console.log("answer to a smaller version of the same question, that is the tell for");
console.log("dynamic programming, and no amount of sorting will replace it.");
`,
            },
            {
              lang: "java",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    /** Do these intervals avoid each other? Touching at an endpoint is allowed. */
    static boolean compatible(List<int[]> chosen) {
        List<int[]> order = new ArrayList<>(chosen);
        order.sort(Comparator.<int[]>comparingInt(iv -> iv[0]).thenComparingInt(iv -> iv[1]));
        for (int i = 1; i < order.size(); i++)
            if (order.get(i)[0] < order.get(i - 1)[1]) return false;
        return true;
    }

    static final Comparator<int[]> BY_FINISH =
        Comparator.<int[]>comparingInt(iv -> iv[1]).thenComparingInt(iv -> iv[0]);

    /** Earliest finishing time first, take it if it fits. */
    static int greedyCount(List<int[]> intervals) {
        List<int[]> order = new ArrayList<>(intervals);
        order.sort(BY_FINISH);
        int taken = 0, lastEnd = -1000000000;
        for (int[] iv : order) {
            if (iv[0] >= lastEnd) {
                taken++;
                lastEnd = iv[1];
            }
        }
        return taken;
    }

    /** The same rule, now trying to maximise value. Nothing justifies it. */
    static int greedyValue(List<int[]> intervals) {
        List<int[]> order = new ArrayList<>(intervals);
        order.sort(BY_FINISH);
        int total = 0, lastEnd = -1000000000;
        for (int[] iv : order) {
            if (iv[0] >= lastEnd) {
                total += iv[2];
                lastEnd = iv[1];
            }
        }
        return total;
    }

    /** The other tempting rule: dearest first. Also nothing justifies it. */
    static int greedyByValue(List<int[]> intervals) {
        List<int[]> order = new ArrayList<>(intervals);
        order.sort(Comparator.<int[]>comparingInt(iv -> -iv[2])
            .thenComparingInt(iv -> iv[1]).thenComparingInt(iv -> iv[0]));
        int total = 0;
        List<int[]> taken = new ArrayList<>();
        for (int[] iv : order) {
            boolean fits = true;
            for (int[] have : taken)
                if (!(iv[0] >= have[1] || iv[1] <= have[0])) fits = false;
            if (fits) {
                taken.add(iv);
                total += iv[2];
            }
        }
        return total;
    }

    /**
     * Sort by finish, then for each interval: take it or do not.
     *
     * <p>Taking it means adding its value to the best answer among the
     * intervals that finish at or before it starts -- which is exactly the
     * recurrence a greedy rule cannot express, because it has to look
     * backwards.
     */
    static int dpValue(List<int[]> intervals) {
        List<int[]> order = new ArrayList<>(intervals);
        order.sort(BY_FINISH);
        int n = order.size();
        int[] best = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            int start = order.get(i - 1)[0], value = order.get(i - 1)[2];
            int skip = best[i - 1];
            int j = 0;
            for (int k = i - 1; k >= 0; k--) {
                if (k == 0 || order.get(k - 1)[1] <= start) {
                    j = k;
                    break;
                }
            }
            int take = value + best[j];
            best[i] = Math.max(skip, take);
        }
        return best[n];
    }

    static int bestFound;

    static void walk(List<int[]> intervals, List<int[]> pick, int start, boolean weighted) {
        if (compatible(pick)) {
            int score = 0;
            if (weighted) {
                for (int[] iv : pick) score += iv[2];
            } else {
                score = pick.size();
            }
            if (score > bestFound) bestFound = score;
        }
        for (int i = start; i < intervals.size(); i++) {
            pick.add(intervals.get(i));
            walk(intervals, pick, i + 1, weighted);
            pick.remove(pick.size() - 1);
        }
    }

    /** Every subset, checked for overlap. Exponential and exact. */
    static int byTrying(List<int[]> intervals, boolean weighted) {
        bestFound = 0;
        walk(intervals, new ArrayList<>(), 0, weighted);
        return bestFound;
    }

    static String show(List<int[]> intervals) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < intervals.size(); i++) {
            if (i > 0) sb.append(", ");
            int[] iv = intervals.get(i);
            sb.append(iv[0]).append("-").append(iv[1]).append(":").append(iv[2]);
        }
        return sb.append("]").toString();
    }

    static List<int[]> listOf(int[][] triples) {
        List<int[]> out = new ArrayList<>();
        for (int[] t : triples) out.add(t);
        return out;
    }

    // The same linear congruential generator in every language, so the random
    // instances below are the same instances whichever translation is run.
    static long seed = 31081L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-44s %6d", text, value);
    }

    public static void main(String[] args) {
        int[][][] cases = {
            {{0, 3, 1}, {2, 5, 1}, {4, 7, 1}},
            {{0, 6, 5}, {0, 2, 3}, {3, 6, 3}},
            {{0, 2, 1}, {1, 4, 9}, {3, 5, 1}},
        };

        System.out.printf("%-34s %-8s %-8s %-8s %s%n",
            "intervals", "count", "greedy", "dearest", "best value");
        for (int[][] triples : cases) {
            List<int[]> intervals = listOf(triples);
            System.out.printf("%-34s %-8d %-8d %-8d %d%n", show(intervals),
                greedyCount(intervals), greedyValue(intervals), greedyByValue(intervals),
                byTrying(intervals, true));
        }

        int trials = 3000;
        int countOk = 0, finishOk = 0, dearestOk = 0, dpOk = 0;
        int finishLow = 0, finishHigh = 0;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rand(6);
            List<int[]> intervals = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                int start = rand(8);
                int end = start + 1 + rand(4);
                intervals.add(new int[] {start, end, 1 + rand(9)});
            }

            if (greedyCount(intervals) == byTrying(intervals, false)) countOk++;

            int want = byTrying(intervals, true);
            int got = greedyValue(intervals);
            if (got == want) finishOk++;
            if (greedyByValue(intervals) == want) dearestOk++;
            if (dpValue(intervals) == want) dpOk++;
            if (got < want) finishLow++;
            if (got > want) finishHigh++;
        }

        System.out.println();
        System.out.println("over " + trials + " random sets of at most 6 intervals:");
        System.out.println(row("unweighted: earliest finish was optimal", countOk));
        System.out.println();
        System.out.println(row("weighted: earliest finish was optimal", finishOk));
        System.out.println(row("weighted: dearest first was optimal", dearestOk));
        System.out.println(row("weighted: the dynamic programme was", dpOk));
        System.out.println(row("times earliest finish scored too low", finishLow));
        System.out.println(row("times it scored too high", finishHigh));

        System.out.println();
        System.out.println("The first counter is the greedy theorem: on the unweighted problem,");
        System.out.println("earliest finishing time was optimal on every one of the " + countOk
            + " sets.");
        System.out.println("That is not luck. Taking the interval that frees the resource soonest");
        System.out.println("can never leave you worse off, because any other first choice finishes");
        System.out.println("no earlier and so rules out at least as much.");
        System.out.println();
        System.out.println("Add values and that argument dies. Finishing soonest says nothing about");
        System.out.println("being worth more, and the same rule dropped to " + finishOk + " of "
            + trials + ". Row three of");
        System.out.println("the demo is the smallest case: it takes two intervals worth 1 each and");
        System.out.println("misses the single one worth 9.");
        System.out.println();
        System.out.println("Sorting by value instead is better and still not right -- " + dearestOk
            + " of " + trials);
        System.out.println("-- because a dear interval can block two cheaper ones that together");
        System.out.println("beat it. Row two is that: one interval worth 5 against two worth 3.");
        System.out.println("Two plausible greedy rules, two different sets of failures, and no");
        System.out.println("way to tell which you are looking at from the statement alone.");
        System.out.println();
        System.out.println("Every failure is in the same direction, " + finishLow + " too low and "
            + finishHigh + " too high,");
        System.out.println("which is what a greedy rule looks like when it is merely a heuristic:");
        System.out.println("it produces a legal answer, never an impossible one, and sometimes not");
        System.out.println("the best one.");
        System.out.println();
        System.out.println("The dynamic programme is right on all " + dpOk
            + ", and the shape of it is the");
        System.out.println("recognition lesson. It asks, for each interval, take it or leave it --");
        System.out.println("and to take it, it needs the best answer over everything that finished");
        System.out.println("before this one started. A greedy rule cannot express that, because it");
        System.out.println("looks only at the choice in front of it. When a decision needs an");
        System.out.println("answer to a smaller version of the same question, that is the tell for");
        System.out.println("dynamic programming, and no amount of sorting will replace it.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

using Interval = std::array<int, 3>;

// Do these intervals avoid each other? Touching at an endpoint is allowed.
bool compatible(std::vector<Interval> chosen) {
    std::sort(chosen.begin(), chosen.end(), [](const Interval& a, const Interval& b) {
        return a[0] != b[0] ? a[0] < b[0] : a[1] < b[1];
    });
    for (size_t i = 1; i < chosen.size(); i++)
        if (chosen[i][0] < chosen[i - 1][1]) return false;
    return true;
}

bool by_finish(const Interval& a, const Interval& b) {
    return a[1] != b[1] ? a[1] < b[1] : a[0] < b[0];
}

// Earliest finishing time first, take it if it fits.
int greedy_count(std::vector<Interval> intervals) {
    std::sort(intervals.begin(), intervals.end(), by_finish);
    int taken = 0, last_end = -1000000000;
    for (const Interval& iv : intervals) {
        if (iv[0] >= last_end) {
            taken++;
            last_end = iv[1];
        }
    }
    return taken;
}

// The same rule, now trying to maximise value. Nothing justifies it.
int greedy_value(std::vector<Interval> intervals) {
    std::sort(intervals.begin(), intervals.end(), by_finish);
    int total = 0, last_end = -1000000000;
    for (const Interval& iv : intervals) {
        if (iv[0] >= last_end) {
            total += iv[2];
            last_end = iv[1];
        }
    }
    return total;
}

// The other tempting rule: dearest first. Also nothing justifies it.
int greedy_by_value(std::vector<Interval> intervals) {
    std::sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        if (a[2] != b[2]) return a[2] > b[2];
        if (a[1] != b[1]) return a[1] < b[1];
        return a[0] < b[0];
    });
    int total = 0;
    std::vector<Interval> taken;
    for (const Interval& iv : intervals) {
        bool fits = true;
        for (const Interval& have : taken)
            if (!(iv[0] >= have[1] || iv[1] <= have[0])) fits = false;
        if (fits) {
            taken.push_back(iv);
            total += iv[2];
        }
    }
    return total;
}

// Sort by finish, then for each interval: take it or do not.
//
// Taking it means adding its value to the best answer among the intervals
// that finish at or before it starts -- which is exactly the recurrence a
// greedy rule cannot express, because it has to look backwards.
int dp_value(std::vector<Interval> intervals) {
    std::sort(intervals.begin(), intervals.end(), by_finish);
    int n = static_cast<int>(intervals.size());
    std::vector<int> best(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        int start = intervals[i - 1][0], value = intervals[i - 1][2];
        int skip = best[i - 1];
        int j = 0;
        for (int k = i - 1; k >= 0; k--) {
            if (k == 0 || intervals[k - 1][1] <= start) {
                j = k;
                break;
            }
        }
        int take = value + best[j];
        best[i] = skip > take ? skip : take;
    }
    return best[n];
}

void walk(const std::vector<Interval>& intervals, std::vector<Interval>& pick, size_t start,
          bool weighted, int& best) {
    if (compatible(pick)) {
        int score = 0;
        if (weighted) {
            for (const Interval& iv : pick) score += iv[2];
        } else {
            score = static_cast<int>(pick.size());
        }
        if (score > best) best = score;
    }
    for (size_t i = start; i < intervals.size(); i++) {
        pick.push_back(intervals[i]);
        walk(intervals, pick, i + 1, weighted, best);
        pick.pop_back();
    }
}

// Every subset, checked for overlap. Exponential and exact.
int by_trying(const std::vector<Interval>& intervals, bool weighted) {
    int best = 0;
    std::vector<Interval> pick;
    walk(intervals, pick, 0, weighted, best);
    return best;
}

std::string show(const std::vector<Interval>& intervals) {
    std::string s = "[";
    for (size_t i = 0; i < intervals.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(intervals[i][0]) + "-" + std::to_string(intervals[i][1]) + ":" +
             std::to_string(intervals[i][2]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// instances below are the same instances whichever translation is run.
long long seed = 31081;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(44) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<std::vector<Interval>> cases = {
        {{0, 3, 1}, {2, 5, 1}, {4, 7, 1}},
        {{0, 6, 5}, {0, 2, 3}, {3, 6, 3}},
        {{0, 2, 1}, {1, 4, 9}, {3, 5, 1}},
    };

    std::cout << std::left << std::setw(34) << "intervals" << " " << std::setw(8) << "count"
              << " " << std::setw(8) << "greedy" << " " << std::setw(8) << "dearest" << " "
              << "best value" << "\\n";
    for (const auto& intervals : cases) {
        std::cout << std::left << std::setw(34) << show(intervals) << " " << std::setw(8)
                  << greedy_count(intervals) << " " << std::setw(8) << greedy_value(intervals)
                  << " " << std::setw(8) << greedy_by_value(intervals) << " "
                  << by_trying(intervals, true) << "\\n";
    }

    int trials = 3000;
    int count_ok = 0, finish_ok = 0, dearest_ok = 0, dp_ok = 0;
    int finish_low = 0, finish_high = 0;
    for (int t = 0; t < trials; t++) {
        int n = 1 + rand_below(6);
        std::vector<Interval> intervals;
        for (int i = 0; i < n; i++) {
            int start = rand_below(8);
            int end = start + 1 + rand_below(4);
            intervals.push_back({start, end, 1 + rand_below(9)});
        }

        if (greedy_count(intervals) == by_trying(intervals, false)) count_ok++;

        int want = by_trying(intervals, true);
        int got = greedy_value(intervals);
        if (got == want) finish_ok++;
        if (greedy_by_value(intervals) == want) dearest_ok++;
        if (dp_value(intervals) == want) dp_ok++;
        if (got < want) finish_low++;
        if (got > want) finish_high++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random sets of at most 6 intervals:\\n";
    row("unweighted: earliest finish was optimal", count_ok);
    std::cout << "\\n";
    row("weighted: earliest finish was optimal", finish_ok);
    row("weighted: dearest first was optimal", dearest_ok);
    row("weighted: the dynamic programme was", dp_ok);
    row("times earliest finish scored too low", finish_low);
    row("times it scored too high", finish_high);

    std::cout << "\\n";
    std::cout << "The first counter is the greedy theorem: on the unweighted problem,\\n";
    std::cout << "earliest finishing time was optimal on every one of the " << count_ok
              << " sets.\\n";
    std::cout << "That is not luck. Taking the interval that frees the resource soonest\\n";
    std::cout << "can never leave you worse off, because any other first choice finishes\\n";
    std::cout << "no earlier and so rules out at least as much.\\n";
    std::cout << "\\n";
    std::cout << "Add values and that argument dies. Finishing soonest says nothing about\\n";
    std::cout << "being worth more, and the same rule dropped to " << finish_ok << " of " << trials
              << ". Row three of\\n";
    std::cout << "the demo is the smallest case: it takes two intervals worth 1 each and\\n";
    std::cout << "misses the single one worth 9.\\n";
    std::cout << "\\n";
    std::cout << "Sorting by value instead is better and still not right -- " << dearest_ok
              << " of " << trials << "\\n";
    std::cout << "-- because a dear interval can block two cheaper ones that together\\n";
    std::cout << "beat it. Row two is that: one interval worth 5 against two worth 3.\\n";
    std::cout << "Two plausible greedy rules, two different sets of failures, and no\\n";
    std::cout << "way to tell which you are looking at from the statement alone.\\n";
    std::cout << "\\n";
    std::cout << "Every failure is in the same direction, " << finish_low << " too low and "
              << finish_high << " too high,\\n";
    std::cout << "which is what a greedy rule looks like when it is merely a heuristic:\\n";
    std::cout << "it produces a legal answer, never an impossible one, and sometimes not\\n";
    std::cout << "the best one.\\n";
    std::cout << "\\n";
    std::cout << "The dynamic programme is right on all " << dp_ok
              << ", and the shape of it is the\\n";
    std::cout << "recognition lesson. It asks, for each interval, take it or leave it --\\n";
    std::cout << "and to take it, it needs the best answer over everything that finished\\n";
    std::cout << "before this one started. A greedy rule cannot express that, because it\\n";
    std::cout << "looks only at the choice in front of it. When a decision needs an\\n";
    std::cout << "answer to a smaller version of the same question, that is the tell for\\n";
    std::cout << "dynamic programming, and no amount of sorting will replace it.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.
type Interval = (i64, i64, i64);

/// Do these intervals avoid each other? Touching at an endpoint is allowed.
fn compatible(chosen: &[Interval]) -> bool {
    let mut order = chosen.to_vec();
    order.sort_by_key(|iv| (iv.0, iv.1));
    for i in 1..order.len() {
        if order[i].0 < order[i - 1].1 {
            return false;
        }
    }
    true
}

fn sorted_by_finish(intervals: &[Interval]) -> Vec<Interval> {
    let mut order = intervals.to_vec();
    order.sort_by_key(|iv| (iv.1, iv.0));
    order
}

/// Earliest finishing time first, take it if it fits.
fn greedy_count(intervals: &[Interval]) -> i64 {
    let order = sorted_by_finish(intervals);
    let mut taken = 0i64;
    let mut last_end = -1_000_000_000i64;
    for &(start, end, _) in &order {
        if start >= last_end {
            taken += 1;
            last_end = end;
        }
    }
    taken
}

/// The same rule, now trying to maximise value. Nothing justifies it.
fn greedy_value(intervals: &[Interval]) -> i64 {
    let order = sorted_by_finish(intervals);
    let mut total = 0i64;
    let mut last_end = -1_000_000_000i64;
    for &(start, end, value) in &order {
        if start >= last_end {
            total += value;
            last_end = end;
        }
    }
    total
}

/// The other tempting rule: dearest first. Also nothing justifies it.
fn greedy_by_value(intervals: &[Interval]) -> i64 {
    let mut order = intervals.to_vec();
    order.sort_by_key(|iv| (-iv.2, iv.1, iv.0));
    let mut total = 0i64;
    let mut taken: Vec<Interval> = Vec::new();
    for &(start, end, value) in &order {
        if taken.iter().all(|&(s, e, _)| start >= e || end <= s) {
            taken.push((start, end, value));
            total += value;
        }
    }
    total
}

/// Sort by finish, then for each interval: take it or do not.
///
/// Taking it means adding its value to the best answer among the intervals
/// that finish at or before it starts -- which is exactly the recurrence a
/// greedy rule cannot express, because it has to look backwards.
fn dp_value(intervals: &[Interval]) -> i64 {
    let order = sorted_by_finish(intervals);
    let n = order.len();
    let mut best = vec![0i64; n + 1];
    for i in 1..=n {
        let (start, _, value) = order[i - 1];
        let skip = best[i - 1];
        let mut j = 0;
        for k in (0..i).rev() {
            if k == 0 || order[k - 1].1 <= start {
                j = k;
                break;
            }
        }
        let take = value + best[j];
        best[i] = if skip > take { skip } else { take };
    }
    best[n]
}

fn walk(
    intervals: &[Interval],
    pick: &mut Vec<Interval>,
    start: usize,
    weighted: bool,
    best: &mut i64,
) {
    if compatible(pick) {
        let score = if weighted {
            pick.iter().map(|iv| iv.2).sum()
        } else {
            pick.len() as i64
        };
        if score > *best {
            *best = score;
        }
    }
    for i in start..intervals.len() {
        pick.push(intervals[i]);
        walk(intervals, pick, i + 1, weighted, best);
        pick.pop();
    }
}

/// Every subset, checked for overlap. Exponential and exact.
fn by_trying(intervals: &[Interval], weighted: bool) -> i64 {
    let mut best = 0i64;
    let mut pick: Vec<Interval> = Vec::new();
    walk(intervals, &mut pick, 0, weighted, &mut best);
    best
}

fn show(intervals: &[Interval]) -> String {
    let cells: Vec<String> = intervals
        .iter()
        .map(|&(s, e, v)| format!("{}-{}:{}", s, e, v))
        .collect();
    format!("[{}]", cells.join(", "))
}

/// The same linear congruential generator in every language, so the random
/// instances below are the same instances whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn row(text: &str, value: i64) {
    println!("  {:<44} {:>6}", text, value);
}

fn main() {
    let cases: Vec<Vec<Interval>> = vec![
        vec![(0, 3, 1), (2, 5, 1), (4, 7, 1)],
        vec![(0, 6, 5), (0, 2, 3), (3, 6, 3)],
        vec![(0, 2, 1), (1, 4, 9), (3, 5, 1)],
    ];

    println!(
        "{:<34} {:<8} {:<8} {:<8} {}",
        "intervals", "count", "greedy", "dearest", "best value"
    );
    for intervals in &cases {
        println!(
            "{:<34} {:<8} {:<8} {:<8} {}",
            show(intervals),
            greedy_count(intervals),
            greedy_value(intervals),
            greedy_by_value(intervals),
            by_trying(intervals, true)
        );
    }

    let mut rng = Rng { seed: 31081 };
    let trials = 3000;
    let (mut count_ok, mut finish_ok, mut dearest_ok, mut dp_ok) = (0i64, 0i64, 0i64, 0i64);
    let (mut finish_low, mut finish_high) = (0i64, 0i64);
    for _ in 0..trials {
        let n = 1 + rng.next(6);
        let mut intervals: Vec<Interval> = Vec::new();
        for _ in 0..n {
            let start = rng.next(8);
            let end = start + 1 + rng.next(4);
            intervals.push((start, end, 1 + rng.next(9)));
        }

        if greedy_count(&intervals) == by_trying(&intervals, false) {
            count_ok += 1;
        }

        let want = by_trying(&intervals, true);
        let got = greedy_value(&intervals);
        if got == want {
            finish_ok += 1;
        }
        if greedy_by_value(&intervals) == want {
            dearest_ok += 1;
        }
        if dp_value(&intervals) == want {
            dp_ok += 1;
        }
        if got < want {
            finish_low += 1;
        }
        if got > want {
            finish_high += 1;
        }
    }

    println!();
    println!("over {} random sets of at most 6 intervals:", trials);
    row("unweighted: earliest finish was optimal", count_ok);
    println!();
    row("weighted: earliest finish was optimal", finish_ok);
    row("weighted: dearest first was optimal", dearest_ok);
    row("weighted: the dynamic programme was", dp_ok);
    row("times earliest finish scored too low", finish_low);
    row("times it scored too high", finish_high);

    println!();
    println!("The first counter is the greedy theorem: on the unweighted problem,");
    println!(
        "earliest finishing time was optimal on every one of the {} sets.",
        count_ok
    );
    println!("That is not luck. Taking the interval that frees the resource soonest");
    println!("can never leave you worse off, because any other first choice finishes");
    println!("no earlier and so rules out at least as much.");
    println!();
    println!("Add values and that argument dies. Finishing soonest says nothing about");
    println!(
        "being worth more, and the same rule dropped to {} of {}. Row three of",
        finish_ok, trials
    );
    println!("the demo is the smallest case: it takes two intervals worth 1 each and");
    println!("misses the single one worth 9.");
    println!();
    println!(
        "Sorting by value instead is better and still not right -- {} of {}",
        dearest_ok, trials
    );
    println!("-- because a dear interval can block two cheaper ones that together");
    println!("beat it. Row two is that: one interval worth 5 against two worth 3.");
    println!("Two plausible greedy rules, two different sets of failures, and no");
    println!("way to tell which you are looking at from the statement alone.");
    println!();
    println!(
        "Every failure is in the same direction, {} too low and {} too high,",
        finish_low, finish_high
    );
    println!("which is what a greedy rule looks like when it is merely a heuristic:");
    println!("it produces a legal answer, never an impossible one, and sometimes not");
    println!("the best one.");
    println!();
    println!(
        "The dynamic programme is right on all {}, and the shape of it is the",
        dp_ok
    );
    println!("recognition lesson. It asks, for each interval, take it or leave it --");
    println!("and to take it, it needs the best answer over everything that finished");
    println!("before this one started. A greedy rule cannot express that, because it");
    println!("looks only at the choice in front of it. When a decision needs an");
    println!("answer to a smaller version of the same question, that is the tell for");
    println!("dynamic programming, and no amount of sorting will replace it.");
}
`,
            },
            {
              lang: "go",
              code: `// One statement, one extra word, and the pattern changes.
//
// "Given a set of intervals, pick as many as possible that do not overlap" is
// a greedy problem, and the greedy rule is one line: sort by finishing time
// and take every interval that starts after the last one you took.
//
// "Given a set of intervals *each with a value*, pick a non-overlapping set
// worth as much as possible" is not. The word "value" removes the reason the
// greedy rule was safe, and the answer becomes a dynamic programme.
//
// Both are scored below against an exhaustive search over every subset, which
// is the only way to be sure which one the greedy rule survives.
package main

import (
	"fmt"
	"sort"
	"strings"
)

// Interval is a half-open span with a value attached.
type Interval struct {
	Start, End, Value int
}

// compatible asks whether these intervals avoid each other. Touching at an
// endpoint is allowed.
func compatible(chosen []Interval) bool {
	order := append([]Interval{}, chosen...)
	sort.Slice(order, func(i, j int) bool {
		if order[i].Start != order[j].Start {
			return order[i].Start < order[j].Start
		}
		return order[i].End < order[j].End
	})
	for i := 1; i < len(order); i++ {
		if order[i].Start < order[i-1].End {
			return false
		}
	}
	return true
}

func sortedByFinish(intervals []Interval) []Interval {
	order := append([]Interval{}, intervals...)
	sort.Slice(order, func(i, j int) bool {
		if order[i].End != order[j].End {
			return order[i].End < order[j].End
		}
		return order[i].Start < order[j].Start
	})
	return order
}

// greedyCount takes the earliest finishing time first, if it fits.
func greedyCount(intervals []Interval) int {
	order := sortedByFinish(intervals)
	taken, lastEnd := 0, -1000000000
	for _, iv := range order {
		if iv.Start >= lastEnd {
			taken++
			lastEnd = iv.End
		}
	}
	return taken
}

// greedyValue is the same rule, now trying to maximise value. Nothing
// justifies it.
func greedyValue(intervals []Interval) int {
	order := sortedByFinish(intervals)
	total, lastEnd := 0, -1000000000
	for _, iv := range order {
		if iv.Start >= lastEnd {
			total += iv.Value
			lastEnd = iv.End
		}
	}
	return total
}

// greedyByValue is the other tempting rule: dearest first. Also nothing
// justifies it.
func greedyByValue(intervals []Interval) int {
	order := append([]Interval{}, intervals...)
	sort.Slice(order, func(i, j int) bool {
		if order[i].Value != order[j].Value {
			return order[i].Value > order[j].Value
		}
		if order[i].End != order[j].End {
			return order[i].End < order[j].End
		}
		return order[i].Start < order[j].Start
	})
	total := 0
	var taken []Interval
	for _, iv := range order {
		fits := true
		for _, have := range taken {
			if !(iv.Start >= have.End || iv.End <= have.Start) {
				fits = false
			}
		}
		if fits {
			taken = append(taken, iv)
			total += iv.Value
		}
	}
	return total
}

// dpValue sorts by finish, then for each interval decides take it or not.
//
// Taking it means adding its value to the best answer among the intervals
// that finish at or before it starts -- which is exactly the recurrence a
// greedy rule cannot express, because it has to look backwards.
func dpValue(intervals []Interval) int {
	order := sortedByFinish(intervals)
	n := len(order)
	best := make([]int, n+1)
	for i := 1; i <= n; i++ {
		start, value := order[i-1].Start, order[i-1].Value
		skip := best[i-1]
		j := 0
		for k := i - 1; k >= 0; k-- {
			if k == 0 || order[k-1].End <= start {
				j = k
				break
			}
		}
		take := value + best[j]
		if skip > take {
			best[i] = skip
		} else {
			best[i] = take
		}
	}
	return best[n]
}

func walk(intervals []Interval, pick []Interval, start int, weighted bool, best *int) []Interval {
	if compatible(pick) {
		score := len(pick)
		if weighted {
			score = 0
			for _, iv := range pick {
				score += iv.Value
			}
		}
		if score > *best {
			*best = score
		}
	}
	for i := start; i < len(intervals); i++ {
		pick = append(pick, intervals[i])
		pick = walk(intervals, pick, i+1, weighted, best)
		pick = pick[:len(pick)-1]
	}
	return pick
}

// byTrying checks every subset for overlap. Exponential and exact.
func byTrying(intervals []Interval, weighted bool) int {
	best := 0
	walk(intervals, nil, 0, weighted, &best)
	return best
}

func show(intervals []Interval) string {
	cells := make([]string, len(intervals))
	for i, iv := range intervals {
		cells[i] = fmt.Sprintf("%d-%d:%d", iv.Start, iv.End, iv.Value)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// instances below are the same instances whichever translation is run.
var seed int64 = 31081

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-44s %6d\\n", text, value)
}

func main() {
	cases := [][]Interval{
		{{0, 3, 1}, {2, 5, 1}, {4, 7, 1}},
		{{0, 6, 5}, {0, 2, 3}, {3, 6, 3}},
		{{0, 2, 1}, {1, 4, 9}, {3, 5, 1}},
	}

	fmt.Printf("%-34s %-8s %-8s %-8s %s\\n",
		"intervals", "count", "greedy", "dearest", "best value")
	for _, intervals := range cases {
		fmt.Printf("%-34s %-8d %-8d %-8d %d\\n", show(intervals),
			greedyCount(intervals), greedyValue(intervals), greedyByValue(intervals),
			byTrying(intervals, true))
	}

	trials := 3000
	countOk, finishOk, dearestOk, dpOk := 0, 0, 0, 0
	finishLow, finishHigh := 0, 0
	for t := 0; t < trials; t++ {
		n := 1 + randBelow(6)
		var intervals []Interval
		for i := 0; i < n; i++ {
			start := randBelow(8)
			end := start + 1 + randBelow(4)
			intervals = append(intervals, Interval{start, end, 1 + randBelow(9)})
		}

		if greedyCount(intervals) == byTrying(intervals, false) {
			countOk++
		}

		want := byTrying(intervals, true)
		got := greedyValue(intervals)
		if got == want {
			finishOk++
		}
		if greedyByValue(intervals) == want {
			dearestOk++
		}
		if dpValue(intervals) == want {
			dpOk++
		}
		if got < want {
			finishLow++
		}
		if got > want {
			finishHigh++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random sets of at most 6 intervals:\\n", trials)
	row("unweighted: earliest finish was optimal", countOk)
	fmt.Println()
	row("weighted: earliest finish was optimal", finishOk)
	row("weighted: dearest first was optimal", dearestOk)
	row("weighted: the dynamic programme was", dpOk)
	row("times earliest finish scored too low", finishLow)
	row("times it scored too high", finishHigh)

	fmt.Println()
	fmt.Println("The first counter is the greedy theorem: on the unweighted problem,")
	fmt.Printf("earliest finishing time was optimal on every one of the %d sets.\\n", countOk)
	fmt.Println("That is not luck. Taking the interval that frees the resource soonest")
	fmt.Println("can never leave you worse off, because any other first choice finishes")
	fmt.Println("no earlier and so rules out at least as much.")
	fmt.Println()
	fmt.Println("Add values and that argument dies. Finishing soonest says nothing about")
	fmt.Printf("being worth more, and the same rule dropped to %d of %d. Row three of\\n", finishOk, trials)
	fmt.Println("the demo is the smallest case: it takes two intervals worth 1 each and")
	fmt.Println("misses the single one worth 9.")
	fmt.Println()
	fmt.Printf("Sorting by value instead is better and still not right -- %d of %d\\n", dearestOk, trials)
	fmt.Println("-- because a dear interval can block two cheaper ones that together")
	fmt.Println("beat it. Row two is that: one interval worth 5 against two worth 3.")
	fmt.Println("Two plausible greedy rules, two different sets of failures, and no")
	fmt.Println("way to tell which you are looking at from the statement alone.")
	fmt.Println()
	fmt.Printf("Every failure is in the same direction, %d too low and %d too high,\\n", finishLow, finishHigh)
	fmt.Println("which is what a greedy rule looks like when it is merely a heuristic:")
	fmt.Println("it produces a legal answer, never an impossible one, and sometimes not")
	fmt.Println("the best one.")
	fmt.Println()
	fmt.Printf("The dynamic programme is right on all %d, and the shape of it is the\\n", dpOk)
	fmt.Println("recognition lesson. It asks, for each interval, take it or leave it --")
	fmt.Println("and to take it, it needs the best answer over everything that finished")
	fmt.Println("before this one started. A greedy rule cannot express that, because it")
	fmt.Println("looks only at the choice in front of it. When a decision needs an")
	fmt.Println("answer to a smaller version of the same question, that is the tell for")
	fmt.Println("dynamic programming, and no amount of sorting will replace it.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Testing a greedy rule instead of arguing for it",
          body: "Earliest-finish on the weighted problem is right on 1,934 of 3,000 random sets, which is often enough that a handful of hand-written cases will pass. A greedy rule needs an exchange argument -- a reason why the local choice cannot close off a better global one -- and if you cannot state one, you have a heuristic.",
        },
        {
          title: "Trying a second greedy rule when the first one fails",
          body: "Dearest-first scores better than earliest-finish here -- 2,839 against 1,934 -- which makes it look like progress. It is not; it is a different heuristic with a different failure set. Two plausible greedy rules that both fail is a strong signal that no greedy rule works, and the effort is better spent on the recurrence.",
        },
        {
          title: "Assuming a wrong greedy answer will look wrong",
          body: "Every one of the 1,066 failures was in the same direction: too low, never too high. A greedy rule that is merely a heuristic still produces a legal answer, so nothing about the output looks impossible. That is exactly what makes it survive a spot check.",
        },
      ],
    },
    {
      id: "the-test",
      heading: "The test that separates them",
      body: [
        "The question to ask is not \"does a greedy rule exist\" but **what does this decision need to know?**",
        "If each choice can be made from information available at that choice \u2014 the interval in front of you, its finishing time, what you have taken so far as a single number \u2014 it may be greedy, and now you owe an exchange argument.",
        "If making the choice requires *the answer to a smaller version of the same question*, it is dynamic programming and no amount of sorting will replace it. The weighted interval recurrence is the clean example: to decide whether to take an interval, you need the best achievable value over everything that finished before it started. That is not a fact about the interval; it is a solved subproblem.",
        "Written out, the shape is unmistakable \u2014 for each item, take it or leave it, where taking it adds a value plus the best answer to a strictly smaller instance. That phrase, *the best answer to a smaller instance*, is the tell. The dynamic programme is right on all 3,000.",
        "The exchange argument is the other half of the test, and it is what you should try to *fail*. Take your greedy rule and try to construct a case where the local choice blocks something better. If you succeed in two minutes, you have saved yourself twenty. If you fail in two minutes and the argument is clean, take the greedy answer and say the argument out loud.",
      ],
    },
    {
      id: "the-pairs-worth-knowing",
      heading: "The pairs worth knowing",
      body: [
        "This is not the only statement pair with a greedy version and a DP version, and the others are worth recognising because the distinguishing word is always small.",
        "**Interval scheduling** (greedy, earliest finish) against **weighted interval scheduling** (DP). The word is \"value\".",
        "**Fractional knapsack** (greedy, best value per unit) against **0/1 knapsack** (DP). The words are \"you may take part of an item\" against \"take it or leave it\".",
        "**Coin change with a canonical coin system** (greedy, largest coin first) against **coin change in general** (DP). Nothing in the statement usually says which system you are in, which is what makes this one genuinely nasty \u2014 the greedy rule works on the coins in your pocket and fails on, say, 1, 3 and 4 making 6.",
        "**Minimum spanning tree** (greedy, and provably so \u2014 the cut property) against **shortest path tree** (Dijkstra, which is also greedy but for a different reason). Two greedy algorithms with two different justifications, and the module-30 lesson measured what happens when you mistake one for the other.",
        "**Activity selection** (greedy) against **longest increasing subsequence** (DP). Both are \"pick a compatible subset in order\", and only one of them has a local rule.",
        "In every pair the greedy version has an exchange argument and the DP version does not. That is the only difference that matters, and it is why the test above is about the argument rather than about the vocabulary.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you know whether a problem is greedy or dynamic programming?",
      answer:
        "I ask what a single decision needs to know. If it can be made from what is in front of it -- this item, its cost, a running total -- then greedy is a candidate and I owe an exchange argument: a reason why taking the locally best option cannot close off a better global one. If the decision needs the best answer to a smaller version of the same problem, that is dynamic programming and sorting will not replace it. Weighted interval scheduling is the clean example: to decide whether to take an interval I need the best value achievable over everything that finished before it started, which is a solved subproblem, not a property of the interval.",
    },
    {
      question: "Your greedy rule passes all your test cases. Is it correct?",
      answer:
        "Not established. I measured exactly this: on weighted interval scheduling, sorting by earliest finish is optimal on 1,934 of 3,000 random instances, and sorting by highest value on 2,839. Either would pass a handful of hand-written cases. Worse, every failure was too low rather than too high, so the answer is always legal and never looks impossible. A greedy rule is correct when there is an exchange argument, not when the tests pass -- and if I cannot state the argument, I would either find a counterexample by random search against a brute force, or write the DP.",
    },
    {
      question: "You try one greedy rule and it fails. What next?",
      answer:
        "Not another greedy rule. Two plausible rules that both fail is strong evidence that no local rule works, and the failures usually have different shapes, which is the tell -- earliest-finish loses when one dear interval beats several cheap ones, dearest-first loses when one dear interval blocks two cheaper ones that together beat it. At that point the effort belongs in the recurrence. I would write the take-it-or-leave-it form, work out what a decision needs from smaller instances, and check it against a brute force on small inputs.",
    },
  ],
  takeaways: [
    "Unweighted interval scheduling is provably greedy: optimal on 3,000 of 3,000 against exhaustive search",
    "Add one word — \"value\" — and the same rule drops to 1,934 of 3,000",
    "A greedy rule is correct when there is an exchange argument, not when the tests pass",
    "Every failure was too low, never too high: a heuristic still returns a legal answer",
    "Dearest-first scored better (2,839) and is equally wrong — a different heuristic, not progress",
    "Two plausible greedy rules that both fail means write the recurrence",
    "The DP tell: the decision needs the best answer to a strictly smaller instance",
    "The same one-word split separates fractional from 0/1 knapsack, and canonical from general coin change",
  ],
};
