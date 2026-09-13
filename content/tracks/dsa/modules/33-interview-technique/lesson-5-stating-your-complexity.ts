import type { Lesson } from "@/content/types";

export const statingYourComplexityLesson: Lesson = {
  id: "dsa-interview-technique-stating-your-complexity",
  slug: "stating-your-complexity",
  moduleSlug: "interview-technique",
  title: "Stating Your Complexity, Including the Space",
  summary:
    "The most common wrong complexity claim is \"it is O(n), there is one loop\" — a statement about the shape of the code rather than about the work. Four versions of one problem, all with a single visible loop, two of them quadratic.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Count the work inside the loop, not the loops",
    "State space alongside time, and distinguish auxiliary from output space",
    "Use the doubling ratio to check a complexity claim with no theory",
    "Say O(range) as O(range) rather than rounding it",
  ],
  sections: [
    {
      id: "counting-loops",
      heading: "The claim that is usually wrong",
      body: [
        "\"It is `O(n)` \u2014 there is one loop.\" This is the single most common incorrect complexity statement in interviews, and it is wrong in a specific way worth naming.",
        "It is a statement about the **shape of the code** rather than about the **work performed**. One loop is `O(n)` iterations, which is only `O(n)` total if each iteration does constant work \u2014 and the moment the body contains a `sort`, a `list.count`, a string concatenation, an `in` on a list, or a nested helper function, it does not.",
        "The reason the error is so common is that the expensive work usually does not look like a loop. `set(prefix)` is one short expression and a linear scan. `arr[:i]` is a slice and a copy. `\"\".join` inside a loop is fine; `s = s + c` inside a loop is quadratic in Java, Go and C++ — measured — while CPython and V8 optimise it into an append and Rust's `String + &str` appends in place; none of which is a guarantee to lean on. None of these are indented under a `for`.",
        "The correct question is not how many loops there are. It is: **for one iteration, how much work happens?** Multiply that by the iteration count. That is the whole method.",
      ],
    },
    {
      id: "four-versions",
      heading: "Four versions, one visible loop each",
      body: [
        "The problem is counting the distinct values in every prefix of an array \u2014 for each `i`, how many distinct values appear in the first `i + 1` positions. Four implementations, all correct, all with exactly one loop you can see.",
        "The program counts the actual operations rather than reasoning about them, and runs each version at four input sizes so the growth is visible directly.",
      ],
      examples: [
        {
          id: "one-loop-four-complexities",
          title: "Counting the work rather than the loops, at four sizes",
          lang: "python",
          code: `# The complexity you state should be the one you wrote, not the one you meant.
#
# "It is O(n), there is one loop" is the most common wrong complexity claim in
# an interview, and it is wrong for one reason: a loop that calls something
# linear is quadratic, and the call does not look like a loop.
#
# Four ways to answer the same question -- for each prefix of the array, how
# many distinct values are in it. All four have exactly one visible loop. Two
# of them are quadratic. The counters below are element inspections, counted
# explicitly rather than timed, so the growth can be read off directly.
LIMIT = 1000


def by_recounting(values, work):
    """A fresh set for every prefix. One loop, and a linear body."""
    out = []
    for i in range(len(values)):
        seen = set()
        for j in range(i + 1):
            work[0] += 1
            seen.add(values[j])
        out.append(len(seen))
    return out


def by_scanning_back(values, work):
    """Add one if this value has not appeared before. One loop, linear body."""
    out = []
    count = 0
    for i in range(len(values)):
        fresh = True
        for j in range(i):
            work[0] += 1
            if values[j] == values[i]:
                fresh = False
                break
        if fresh:
            count += 1
        out.append(count)
    return out


def by_keeping_a_set(values, work):
    """One set, kept across the loop. One loop, constant body."""
    out = []
    seen = set()
    for x in values:
        work[0] += 1
        seen.add(x)
        out.append(len(seen))
    return out


def by_counting_array(values, work):
    """One array of counts, sized by the value range. One loop, constant body."""
    present = [False] * LIMIT
    out = []
    count = 0
    for x in values:
        work[0] += 1
        if not present[x]:
            present[x] = True
            count += 1
        out.append(count)
    return out


WAYS = [
    ("recount each prefix", by_recounting, "O(n)"),
    ("scan back for a duplicate", by_scanning_back, "O(1)"),
    ("keep one set", by_keeping_a_set, "O(n)"),
    ("keep a counting array", by_counting_array, "O(range)"),
]

# The same linear congruential generator in every language, so the arrays
# below are the same arrays whichever translation is run.
seed = 505


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def make(n):
    return [rand(LIMIT) for _ in range(n)]


# All four must agree before any of the counts mean anything.
check = make(200)
base = by_recounting(check, [0])
agree = sum(1 for _, fn, _ in WAYS if fn(check, [0]) == base)

print("all four agree on the same input: %d of %d" % (agree, len(WAYS)))
print()
print("%-28s %10s %10s %10s %10s %10s" % (
    "how", "n=100", "n=200", "n=400", "n=800", "800/400"))
for name, fn, space in WAYS:
    counts = []
    for n in (100, 200, 400, 800):
        work = [0]
        fn(make(n), work)
        counts.append(work[0])
    # Tenths, by integer arithmetic, so every translation prints the same
    # digits without depending on how it rounds a float.
    tenths = counts[3] * 10 // counts[2] if counts[2] else 0
    print("%-28s %10d %10d %10d %10d %8d.%d" % (
        name, counts[0], counts[1], counts[2], counts[3], tenths // 10, tenths % 10))

print()
print("%-28s %-12s %s" % ("how", "extra space", "the honest claim"))
for name, fn, space in WAYS:
    work = [0]
    fn(make(400), work)
    growth = "O(n^2)" if work[0] > 400 * 4 else "O(n)"
    print("%-28s %-12s %s time" % (name, space, growth))

print()
print("Every one of the four has a single visible loop, and two of them are")
print("quadratic. The last column is the giveaway: double the input and the")
print("work goes up by exactly two for the linear ones and by three or four")
print("for the quadratic ones. That ratio is worth computing in your head")
print("when you are unsure -- it needs no theory at all.")
print()
print("The scan-back row shows 3.5 rather than 4.0 because it stops at the")
print("first duplicate, so it does less than the full n squared over two.")
print("That is a real constant-factor saving and it does not change the")
print("class: the ratio is still well above two, and it will stay above two")
print("however large the input gets.")
print()
print("The mistake both quadratic versions make is the same one, and it is")
print("the most common wrong complexity claim there is: the body of the loop")
print("is not constant. Building a fresh set, or scanning backwards for a")
print("duplicate, is linear work, and it does not look like a loop when it is")
print("a function call. \\"It is O(n), there is one loop\\" is a statement about")
print("the shape of the code rather than about the work.")
print()
print("The space column is the other half, and the half people forget to say.")
print("Two of these are O(n) extra space, one is O(1) beyond the output, and")
print("one is O(range) -- which is a different thing again, and worth saying")
print("as O(range) rather than rounding it to O(1) or to O(n). If the values")
print("are bounded by a small constant it is effectively O(1); if the range")
print("is a billion it is unusable, and the constraints decide which.")
print()
print("The output array itself is O(n) in all four, and whether to count it")
print("is a real question worth asking out loud: output space is usually")
print("excluded, auxiliary space is not. Saying which convention you are")
print("using takes four words and removes the ambiguity entirely.")
`,
          output: `all four agree on the same input: 4 of 4

how                               n=100      n=200      n=400      n=800    800/400
recount each prefix                5050      20100      80200     320400        3.9
scan back for a duplicate          4781      18402      68917     244103        3.5
keep one set                        100        200        400        800        2.0
keep a counting array               100        200        400        800        2.0

how                          extra space  the honest claim
recount each prefix          O(n)         O(n^2) time
scan back for a duplicate    O(1)         O(n^2) time
keep one set                 O(n)         O(n) time
keep a counting array        O(range)     O(n) time

Every one of the four has a single visible loop, and two of them are
quadratic. The last column is the giveaway: double the input and the
work goes up by exactly two for the linear ones and by three or four
for the quadratic ones. That ratio is worth computing in your head
when you are unsure -- it needs no theory at all.

The scan-back row shows 3.5 rather than 4.0 because it stops at the
first duplicate, so it does less than the full n squared over two.
That is a real constant-factor saving and it does not change the
class: the ratio is still well above two, and it will stay above two
however large the input gets.

The mistake both quadratic versions make is the same one, and it is
the most common wrong complexity claim there is: the body of the loop
is not constant. Building a fresh set, or scanning backwards for a
duplicate, is linear work, and it does not look like a loop when it is
a function call. "It is O(n), there is one loop" is a statement about
the shape of the code rather than about the work.

The space column is the other half, and the half people forget to say.
Two of these are O(n) extra space, one is O(1) beyond the output, and
one is O(range) -- which is a different thing again, and worth saying
as O(range) rather than rounding it to O(1) or to O(n). If the values
are bounded by a small constant it is effectively O(1); if the range
is a billion it is unusable, and the constraints decide which.

The output array itself is O(n) in all four, and whether to count it
is a real question worth asking out loud: output space is usually
excluded, auxiliary space is not. Saying which convention you are
using takes four words and removes the ambiguity entirely.`,
          explanation:
            "All four agree on every input, so the difference is purely cost. Recounting the prefix does 5,050 units at n=100 and 320,400 at n=800; scanning back does 4,781 and 244,103; the two linear versions do exactly n. The last column is the doubling ratio -- work at n=800 divided by work at n=400 -- and it separates the classes with no theory at all: 2.0 means linear, 3.9 means quadratic. The scan-back row lands at 3.5 rather than 4.0 because it stops at the first duplicate, which is a genuine constant-factor saving that does not change the class. Both quadratic versions have a single visible loop, and in both the expensive work is a function call rather than an indented block.",
          alternates: [
            {
              lang: "javascript",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
const LIMIT = 1000;

// A fresh set for every prefix. One loop, and a linear body.
function byRecounting(values, work) {
  const out = [];
  for (let i = 0; i < values.length; i += 1) {
    const seen = new Set();
    for (let j = 0; j <= i; j += 1) {
      work[0] += 1;
      seen.add(values[j]);
    }
    out.push(seen.size);
  }
  return out;
}

// Add one if this value has not appeared before. One loop, linear body.
function byScanningBack(values, work) {
  const out = [];
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    let fresh = true;
    for (let j = 0; j < i; j += 1) {
      work[0] += 1;
      if (values[j] === values[i]) {
        fresh = false;
        break;
      }
    }
    if (fresh) count += 1;
    out.push(count);
  }
  return out;
}

// One set, kept across the loop. One loop, constant body.
function byKeepingASet(values, work) {
  const out = [];
  const seen = new Set();
  for (const x of values) {
    work[0] += 1;
    seen.add(x);
    out.push(seen.size);
  }
  return out;
}

// One array of counts, sized by the value range. One loop, constant body.
function byCountingArray(values, work) {
  const present = new Array(LIMIT).fill(false);
  const out = [];
  let count = 0;
  for (const x of values) {
    work[0] += 1;
    if (!present[x]) {
      present[x] = true;
      count += 1;
    }
    out.push(count);
  }
  return out;
}

const WAYS = [
  ["recount each prefix", byRecounting, "O(n)"],
  ["scan back for a duplicate", byScanningBack, "O(1)"],
  ["keep one set", byKeepingASet, "O(n)"],
  ["keep a counting array", byCountingArray, "O(range)"],
];

// The same linear congruential generator in every language, so the arrays
// below are the same arrays whichever translation is run. JavaScript needs
// BigInt here because the multiply runs past 2^53.
let seed = 505n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function make(n) {
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(rand(LIMIT));
  return out;
}

// All four must agree before any of the counts mean anything.
const check = make(200);
const base = byRecounting(check, [0]);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const agree = WAYS.filter(([, fn]) => same(fn(check, [0]), base)).length;

console.log(\`all four agree on the same input: \${agree} of \${WAYS.length}\`);
console.log();
console.log(
  "how".padEnd(28) + " " + "n=100".padStart(10) + " " + "n=200".padStart(10) + " " +
  "n=400".padStart(10) + " " + "n=800".padStart(10) + " " + "800/400".padStart(10),
);
for (const [name, fn] of WAYS) {
  const counts = [];
  for (const n of [100, 200, 400, 800]) {
    const work = [0];
    fn(make(n), work);
    counts.push(work[0]);
  }
  // Tenths, by integer arithmetic, so every translation prints the same
  // digits without depending on how it rounds a float.
  const tenths = counts[2] ? Math.floor((counts[3] * 10) / counts[2]) : 0;
  console.log(
    name.padEnd(28) + " " + String(counts[0]).padStart(10) + " " +
    String(counts[1]).padStart(10) + " " + String(counts[2]).padStart(10) + " " +
    String(counts[3]).padStart(10) + " " +
    String(Math.floor(tenths / 10)).padStart(8) + "." + (tenths % 10),
  );
}

console.log();
console.log("how".padEnd(28) + " " + "extra space".padEnd(12) + " " + "the honest claim");
for (const [name, fn, space] of WAYS) {
  const work = [0];
  fn(make(400), work);
  const growth = work[0] > 400 * 4 ? "O(n^2)" : "O(n)";
  console.log(name.padEnd(28) + " " + space.padEnd(12) + " " + growth + " time");
}

console.log();
console.log("Every one of the four has a single visible loop, and two of them are");
console.log("quadratic. The last column is the giveaway: double the input and the");
console.log("work goes up by exactly two for the linear ones and by three or four");
console.log("for the quadratic ones. That ratio is worth computing in your head");
console.log("when you are unsure -- it needs no theory at all.");
console.log();
console.log("The scan-back row shows 3.5 rather than 4.0 because it stops at the");
console.log("first duplicate, so it does less than the full n squared over two.");
console.log("That is a real constant-factor saving and it does not change the");
console.log("class: the ratio is still well above two, and it will stay above two");
console.log("however large the input gets.");
console.log();
console.log("The mistake both quadratic versions make is the same one, and it is");
console.log("the most common wrong complexity claim there is: the body of the loop");
console.log("is not constant. Building a fresh set, or scanning backwards for a");
console.log("duplicate, is linear work, and it does not look like a loop when it is");
console.log('a function call. "It is O(n), there is one loop" is a statement about');
console.log("the shape of the code rather than about the work.");
console.log();
console.log("The space column is the other half, and the half people forget to say.");
console.log("Two of these are O(n) extra space, one is O(1) beyond the output, and");
console.log("one is O(range) -- which is a different thing again, and worth saying");
console.log("as O(range) rather than rounding it to O(1) or to O(n). If the values");
console.log("are bounded by a small constant it is effectively O(1); if the range");
console.log("is a billion it is unusable, and the constraints decide which.");
console.log();
console.log("The output array itself is O(n) in all four, and whether to count it");
console.log("is a real question worth asking out loud: output space is usually");
console.log("excluded, auxiliary space is not. Saying which convention you are");
console.log("using takes four words and removes the ambiguity entirely.");
`,
            },
            {
              lang: "typescript",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
const LIMIT = 1000;

// A fresh set for every prefix. One loop, and a linear body.
function byRecounting(values: number[], work: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const seen = new Set<number>();
    for (let j = 0; j <= i; j += 1) {
      work[0] += 1;
      seen.add(values[j]);
    }
    out.push(seen.size);
  }
  return out;
}

// Add one if this value has not appeared before. One loop, linear body.
function byScanningBack(values: number[], work: number[]): number[] {
  const out: number[] = [];
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    let fresh = true;
    for (let j = 0; j < i; j += 1) {
      work[0] += 1;
      if (values[j] === values[i]) {
        fresh = false;
        break;
      }
    }
    if (fresh) count += 1;
    out.push(count);
  }
  return out;
}

// One set, kept across the loop. One loop, constant body.
function byKeepingASet(values: number[], work: number[]): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const x of values) {
    work[0] += 1;
    seen.add(x);
    out.push(seen.size);
  }
  return out;
}

// One array of counts, sized by the value range. One loop, constant body.
function byCountingArray(values: number[], work: number[]): number[] {
  const present = new Array(LIMIT).fill(false);
  const out: number[] = [];
  let count = 0;
  for (const x of values) {
    work[0] += 1;
    if (!present[x]) {
      present[x] = true;
      count += 1;
    }
    out.push(count);
  }
  return out;
}

const WAYS: [string, (values: number[], work: number[]) => number[], string][] = [
  ["recount each prefix", byRecounting, "O(n)"],
  ["scan back for a duplicate", byScanningBack, "O(1)"],
  ["keep one set", byKeepingASet, "O(n)"],
  ["keep a counting array", byCountingArray, "O(range)"],
];

// The same linear congruential generator in every language, so the arrays
// below are the same arrays whichever translation is run. JavaScript needs
// BigInt here because the multiply runs past 2^53.
let seed = 505n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function make(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) out.push(rand(LIMIT));
  return out;
}

// All four must agree before any of the counts mean anything.
const check = make(200);
const base = byRecounting(check, [0]);
const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
const agree = WAYS.filter(([, fn]) => same(fn(check, [0]), base)).length;

console.log(\`all four agree on the same input: \${agree} of \${WAYS.length}\`);
console.log();
console.log(
  "how".padEnd(28) + " " + "n=100".padStart(10) + " " + "n=200".padStart(10) + " " +
  "n=400".padStart(10) + " " + "n=800".padStart(10) + " " + "800/400".padStart(10),
);
for (const [name, fn] of WAYS) {
  const counts: number[] = [];
  for (const n of [100, 200, 400, 800]) {
    const work = [0];
    fn(make(n), work);
    counts.push(work[0]);
  }
  // Tenths, by integer arithmetic, so every translation prints the same
  // digits without depending on how it rounds a float.
  const tenths = counts[2] ? Math.floor((counts[3] * 10) / counts[2]) : 0;
  console.log(
    name.padEnd(28) + " " + String(counts[0]).padStart(10) + " " +
    String(counts[1]).padStart(10) + " " + String(counts[2]).padStart(10) + " " +
    String(counts[3]).padStart(10) + " " +
    String(Math.floor(tenths / 10)).padStart(8) + "." + (tenths % 10),
  );
}

console.log();
console.log("how".padEnd(28) + " " + "extra space".padEnd(12) + " " + "the honest claim");
for (const [name, fn, space] of WAYS) {
  const work = [0];
  fn(make(400), work);
  const growth = work[0] > 400 * 4 ? "O(n^2)" : "O(n)";
  console.log(name.padEnd(28) + " " + space.padEnd(12) + " " + growth + " time");
}

console.log();
console.log("Every one of the four has a single visible loop, and two of them are");
console.log("quadratic. The last column is the giveaway: double the input and the");
console.log("work goes up by exactly two for the linear ones and by three or four");
console.log("for the quadratic ones. That ratio is worth computing in your head");
console.log("when you are unsure -- it needs no theory at all.");
console.log();
console.log("The scan-back row shows 3.5 rather than 4.0 because it stops at the");
console.log("first duplicate, so it does less than the full n squared over two.");
console.log("That is a real constant-factor saving and it does not change the");
console.log("class: the ratio is still well above two, and it will stay above two");
console.log("however large the input gets.");
console.log();
console.log("The mistake both quadratic versions make is the same one, and it is");
console.log("the most common wrong complexity claim there is: the body of the loop");
console.log("is not constant. Building a fresh set, or scanning backwards for a");
console.log("duplicate, is linear work, and it does not look like a loop when it is");
console.log('a function call. "It is O(n), there is one loop" is a statement about');
console.log("the shape of the code rather than about the work.");
console.log();
console.log("The space column is the other half, and the half people forget to say.");
console.log("Two of these are O(n) extra space, one is O(1) beyond the output, and");
console.log("one is O(range) -- which is a different thing again, and worth saying");
console.log("as O(range) rather than rounding it to O(1) or to O(n). If the values");
console.log("are bounded by a small constant it is effectively O(1); if the range");
console.log("is a billion it is unusable, and the constraints decide which.");
console.log();
console.log("The output array itself is O(n) in all four, and whether to count it");
console.log("is a real question worth asking out loud: output space is usually");
console.log("excluded, auxiliary space is not. Saying which convention you are");
console.log("using takes four words and removes the ambiguity entirely.");
`,
            },
            {
              lang: "java",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.BiFunction;

public class Main {
    static final int LIMIT = 1000;

    /** A fresh set for every prefix. One loop, and a linear body. */
    static List<Integer> byRecounting(int[] values, long[] work) {
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < values.length; i++) {
            Set<Integer> seen = new HashSet<>();
            for (int j = 0; j <= i; j++) {
                work[0]++;
                seen.add(values[j]);
            }
            out.add(seen.size());
        }
        return out;
    }

    /** Add one if this value has not appeared before. One loop, linear body. */
    static List<Integer> byScanningBack(int[] values, long[] work) {
        List<Integer> out = new ArrayList<>();
        int count = 0;
        for (int i = 0; i < values.length; i++) {
            boolean fresh = true;
            for (int j = 0; j < i; j++) {
                work[0]++;
                if (values[j] == values[i]) {
                    fresh = false;
                    break;
                }
            }
            if (fresh) count++;
            out.add(count);
        }
        return out;
    }

    /** One set, kept across the loop. One loop, constant body. */
    static List<Integer> byKeepingASet(int[] values, long[] work) {
        List<Integer> out = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (int x : values) {
            work[0]++;
            seen.add(x);
            out.add(seen.size());
        }
        return out;
    }

    /** One array of counts, sized by the value range. One loop, constant body. */
    static List<Integer> byCountingArray(int[] values, long[] work) {
        boolean[] present = new boolean[LIMIT];
        List<Integer> out = new ArrayList<>();
        int count = 0;
        for (int x : values) {
            work[0]++;
            if (!present[x]) {
                present[x] = true;
                count++;
            }
            out.add(count);
        }
        return out;
    }

    static final String[] WAY_NAMES = {
        "recount each prefix", "scan back for a duplicate", "keep one set",
        "keep a counting array"};
    static final String[] WAY_SPACE = {"O(n)", "O(1)", "O(n)", "O(range)"};

    static List<Integer> run(int which, int[] values, long[] work) {
        switch (which) {
            case 0: return byRecounting(values, work);
            case 1: return byScanningBack(values, work);
            case 2: return byKeepingASet(values, work);
            default: return byCountingArray(values, work);
        }
    }

    // The same linear congruential generator in every language, so the arrays
    // below are the same arrays whichever translation is run.
    static long seed = 505L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static int[] make(int n) {
        int[] out = new int[n];
        for (int i = 0; i < n; i++) out[i] = rand(LIMIT);
        return out;
    }

    public static void main(String[] args) {
        // All four must agree before any of the counts mean anything.
        int[] check = make(200);
        List<Integer> base = byRecounting(check, new long[1]);
        int agree = 0;
        for (int w = 0; w < 4; w++)
            if (run(w, check, new long[1]).equals(base)) agree++;

        System.out.println("all four agree on the same input: " + agree + " of 4");
        System.out.println();
        System.out.printf("%-28s %10s %10s %10s %10s %10s%n",
            "how", "n=100", "n=200", "n=400", "n=800", "800/400");
        for (int w = 0; w < 4; w++) {
            long[] counts = new long[4];
            int[] sizes = {100, 200, 400, 800};
            for (int s = 0; s < 4; s++) {
                long[] work = new long[1];
                run(w, make(sizes[s]), work);
                counts[s] = work[0];
            }
            // Tenths, by integer arithmetic, so every translation prints the
            // same digits without depending on how it rounds a float.
            long tenths = counts[2] != 0 ? counts[3] * 10 / counts[2] : 0;
            System.out.printf("%-28s %10d %10d %10d %10d %8d.%d%n", WAY_NAMES[w],
                counts[0], counts[1], counts[2], counts[3], tenths / 10, tenths % 10);
        }

        System.out.println();
        System.out.printf("%-28s %-12s %s%n", "how", "extra space", "the honest claim");
        for (int w = 0; w < 4; w++) {
            long[] work = new long[1];
            run(w, make(400), work);
            String growth = work[0] > 400L * 4 ? "O(n^2)" : "O(n)";
            System.out.printf("%-28s %-12s %s time%n", WAY_NAMES[w], WAY_SPACE[w], growth);
        }

        System.out.println();
        System.out.println("Every one of the four has a single visible loop, and two of them are");
        System.out.println("quadratic. The last column is the giveaway: double the input and the");
        System.out.println("work goes up by exactly two for the linear ones and by three or four");
        System.out.println("for the quadratic ones. That ratio is worth computing in your head");
        System.out.println("when you are unsure -- it needs no theory at all.");
        System.out.println();
        System.out.println("The scan-back row shows 3.5 rather than 4.0 because it stops at the");
        System.out.println("first duplicate, so it does less than the full n squared over two.");
        System.out.println("That is a real constant-factor saving and it does not change the");
        System.out.println("class: the ratio is still well above two, and it will stay above two");
        System.out.println("however large the input gets.");
        System.out.println();
        System.out.println("The mistake both quadratic versions make is the same one, and it is");
        System.out.println("the most common wrong complexity claim there is: the body of the loop");
        System.out.println("is not constant. Building a fresh set, or scanning backwards for a");
        System.out.println("duplicate, is linear work, and it does not look like a loop when it is");
        System.out.println("a function call. \\"It is O(n), there is one loop\\" is a statement about");
        System.out.println("the shape of the code rather than about the work.");
        System.out.println();
        System.out.println("The space column is the other half, and the half people forget to say.");
        System.out.println("Two of these are O(n) extra space, one is O(1) beyond the output, and");
        System.out.println("one is O(range) -- which is a different thing again, and worth saying");
        System.out.println("as O(range) rather than rounding it to O(1) or to O(n). If the values");
        System.out.println("are bounded by a small constant it is effectively O(1); if the range");
        System.out.println("is a billion it is unusable, and the constraints decide which.");
        System.out.println();
        System.out.println("The output array itself is O(n) in all four, and whether to count it");
        System.out.println("is a real question worth asking out loud: output space is usually");
        System.out.println("excluded, auxiliary space is not. Saying which convention you are");
        System.out.println("using takes four words and removes the ambiguity entirely.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
#include <iomanip>
#include <iostream>
#include <set>
#include <string>
#include <vector>

const int LIMIT = 1000;

// A fresh set for every prefix. One loop, and a linear body.
std::vector<int> by_recounting(const std::vector<int>& values, long long& work) {
    std::vector<int> out;
    for (size_t i = 0; i < values.size(); i++) {
        std::set<int> seen;
        for (size_t j = 0; j <= i; j++) {
            work++;
            seen.insert(values[j]);
        }
        out.push_back(static_cast<int>(seen.size()));
    }
    return out;
}

// Add one if this value has not appeared before. One loop, linear body.
std::vector<int> by_scanning_back(const std::vector<int>& values, long long& work) {
    std::vector<int> out;
    int count = 0;
    for (size_t i = 0; i < values.size(); i++) {
        bool fresh = true;
        for (size_t j = 0; j < i; j++) {
            work++;
            if (values[j] == values[i]) {
                fresh = false;
                break;
            }
        }
        if (fresh) count++;
        out.push_back(count);
    }
    return out;
}

// One set, kept across the loop. One loop, constant body.
std::vector<int> by_keeping_a_set(const std::vector<int>& values, long long& work) {
    std::vector<int> out;
    std::set<int> seen;
    for (int x : values) {
        work++;
        seen.insert(x);
        out.push_back(static_cast<int>(seen.size()));
    }
    return out;
}

// One array of counts, sized by the value range. One loop, constant body.
std::vector<int> by_counting_array(const std::vector<int>& values, long long& work) {
    std::vector<bool> present(LIMIT, false);
    std::vector<int> out;
    int count = 0;
    for (int x : values) {
        work++;
        if (!present[x]) {
            present[x] = true;
            count++;
        }
        out.push_back(count);
    }
    return out;
}

const std::string WAY_NAMES[4] = {
    "recount each prefix", "scan back for a duplicate", "keep one set",
    "keep a counting array"};
const std::string WAY_SPACE[4] = {"O(n)", "O(1)", "O(n)", "O(range)"};

std::vector<int> run_way(int which, const std::vector<int>& values, long long& work) {
    if (which == 0) return by_recounting(values, work);
    if (which == 1) return by_scanning_back(values, work);
    if (which == 2) return by_keeping_a_set(values, work);
    return by_counting_array(values, work);
}

// The same linear congruential generator in every language, so the arrays
// below are the same arrays whichever translation is run.
long long seed = 505;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

std::vector<int> make(int n) {
    std::vector<int> out(n);
    for (int i = 0; i < n; i++) out[i] = rand_below(LIMIT);
    return out;
}

int main() {
    // All four must agree before any of the counts mean anything.
    std::vector<int> check = make(200);
    long long ignored = 0;
    std::vector<int> base = by_recounting(check, ignored);
    int agree = 0;
    for (int w = 0; w < 4; w++) {
        long long work = 0;
        if (run_way(w, check, work) == base) agree++;
    }

    std::cout << "all four agree on the same input: " << agree << " of 4\\n";
    std::cout << "\\n";
    std::cout << std::left << std::setw(28) << "how" << " " << std::right << std::setw(10)
              << "n=100" << " " << std::setw(10) << "n=200" << " " << std::setw(10)
              << "n=400" << " " << std::setw(10) << "n=800" << " " << std::setw(10)
              << "800/400" << "\\n";
    int sizes[4] = {100, 200, 400, 800};
    for (int w = 0; w < 4; w++) {
        long long counts[4];
        for (int s = 0; s < 4; s++) {
            long long work = 0;
            run_way(w, make(sizes[s]), work);
            counts[s] = work;
        }
        // Tenths, by integer arithmetic, so every translation prints the same
        // digits without depending on how it rounds a float.
        long long tenths = counts[2] ? counts[3] * 10 / counts[2] : 0;
        std::cout << std::left << std::setw(28) << WAY_NAMES[w] << " " << std::right
                  << std::setw(10) << counts[0] << " " << std::setw(10) << counts[1] << " "
                  << std::setw(10) << counts[2] << " " << std::setw(10) << counts[3] << " "
                  << std::setw(8) << (tenths / 10) << "." << (tenths % 10) << "\\n";
    }

    std::cout << "\\n";
    std::cout << std::left << std::setw(28) << "how" << " " << std::setw(12) << "extra space"
              << " " << "the honest claim" << "\\n";
    for (int w = 0; w < 4; w++) {
        long long work = 0;
        run_way(w, make(400), work);
        std::string growth = work > 400LL * 4 ? "O(n^2)" : "O(n)";
        std::cout << std::left << std::setw(28) << WAY_NAMES[w] << " " << std::setw(12)
                  << WAY_SPACE[w] << " " << growth << " time" << "\\n";
    }

    std::cout << "\\n";
    std::cout << "Every one of the four has a single visible loop, and two of them are\\n";
    std::cout << "quadratic. The last column is the giveaway: double the input and the\\n";
    std::cout << "work goes up by exactly two for the linear ones and by three or four\\n";
    std::cout << "for the quadratic ones. That ratio is worth computing in your head\\n";
    std::cout << "when you are unsure -- it needs no theory at all.\\n";
    std::cout << "\\n";
    std::cout << "The scan-back row shows 3.5 rather than 4.0 because it stops at the\\n";
    std::cout << "first duplicate, so it does less than the full n squared over two.\\n";
    std::cout << "That is a real constant-factor saving and it does not change the\\n";
    std::cout << "class: the ratio is still well above two, and it will stay above two\\n";
    std::cout << "however large the input gets.\\n";
    std::cout << "\\n";
    std::cout << "The mistake both quadratic versions make is the same one, and it is\\n";
    std::cout << "the most common wrong complexity claim there is: the body of the loop\\n";
    std::cout << "is not constant. Building a fresh set, or scanning backwards for a\\n";
    std::cout << "duplicate, is linear work, and it does not look like a loop when it is\\n";
    std::cout << "a function call. \\"It is O(n), there is one loop\\" is a statement about\\n";
    std::cout << "the shape of the code rather than about the work.\\n";
    std::cout << "\\n";
    std::cout << "The space column is the other half, and the half people forget to say.\\n";
    std::cout << "Two of these are O(n) extra space, one is O(1) beyond the output, and\\n";
    std::cout << "one is O(range) -- which is a different thing again, and worth saying\\n";
    std::cout << "as O(range) rather than rounding it to O(1) or to O(n). If the values\\n";
    std::cout << "are bounded by a small constant it is effectively O(1); if the range\\n";
    std::cout << "is a billion it is unusable, and the constraints decide which.\\n";
    std::cout << "\\n";
    std::cout << "The output array itself is O(n) in all four, and whether to count it\\n";
    std::cout << "is a real question worth asking out loud: output space is usually\\n";
    std::cout << "excluded, auxiliary space is not. Saying which convention you are\\n";
    std::cout << "using takes four words and removes the ambiguity entirely.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
use std::collections::BTreeSet;

const LIMIT: i64 = 1000;

/// A fresh set for every prefix. One loop, and a linear body.
fn by_recounting(values: &[i64], work: &mut i64) -> Vec<i64> {
    let mut out = Vec::new();
    for i in 0..values.len() {
        let mut seen: BTreeSet<i64> = BTreeSet::new();
        for j in 0..=i {
            *work += 1;
            seen.insert(values[j]);
        }
        out.push(seen.len() as i64);
    }
    out
}

/// Add one if this value has not appeared before. One loop, linear body.
fn by_scanning_back(values: &[i64], work: &mut i64) -> Vec<i64> {
    let mut out = Vec::new();
    let mut count = 0i64;
    for i in 0..values.len() {
        let mut fresh = true;
        for j in 0..i {
            *work += 1;
            if values[j] == values[i] {
                fresh = false;
                break;
            }
        }
        if fresh {
            count += 1;
        }
        out.push(count);
    }
    out
}

/// One set, kept across the loop. One loop, constant body.
fn by_keeping_a_set(values: &[i64], work: &mut i64) -> Vec<i64> {
    let mut out = Vec::new();
    let mut seen: BTreeSet<i64> = BTreeSet::new();
    for &x in values {
        *work += 1;
        seen.insert(x);
        out.push(seen.len() as i64);
    }
    out
}

/// One array of counts, sized by the value range. One loop, constant body.
fn by_counting_array(values: &[i64], work: &mut i64) -> Vec<i64> {
    let mut present = vec![false; LIMIT as usize];
    let mut out = Vec::new();
    let mut count = 0i64;
    for &x in values {
        *work += 1;
        if !present[x as usize] {
            present[x as usize] = true;
            count += 1;
        }
        out.push(count);
    }
    out
}

const WAY_NAMES: [&str; 4] = [
    "recount each prefix",
    "scan back for a duplicate",
    "keep one set",
    "keep a counting array",
];
const WAY_SPACE: [&str; 4] = ["O(n)", "O(1)", "O(n)", "O(range)"];

fn run_way(which: usize, values: &[i64], work: &mut i64) -> Vec<i64> {
    match which {
        0 => by_recounting(values, work),
        1 => by_scanning_back(values, work),
        2 => by_keeping_a_set(values, work),
        _ => by_counting_array(values, work),
    }
}

/// The same linear congruential generator in every language, so the arrays
/// below are the same arrays whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn make(rng: &mut Rng, n: usize) -> Vec<i64> {
    (0..n).map(|_| rng.next(LIMIT)).collect()
}

fn main() {
    let mut rng = Rng { seed: 505 };

    // All four must agree before any of the counts mean anything.
    let check = make(&mut rng, 200);
    let mut ignored = 0i64;
    let base = by_recounting(&check, &mut ignored);
    let mut agree = 0;
    for w in 0..4 {
        let mut work = 0i64;
        if run_way(w, &check, &mut work) == base {
            agree += 1;
        }
    }

    println!("all four agree on the same input: {} of 4", agree);
    println!();
    println!(
        "{:<28} {:>10} {:>10} {:>10} {:>10} {:>10}",
        "how", "n=100", "n=200", "n=400", "n=800", "800/400"
    );
    let sizes = [100usize, 200, 400, 800];
    for w in 0..4 {
        let mut counts = [0i64; 4];
        for (s, &n) in sizes.iter().enumerate() {
            let mut work = 0i64;
            let values = make(&mut rng, n);
            run_way(w, &values, &mut work);
            counts[s] = work;
        }
        // Tenths, by integer arithmetic, so every translation prints the same
        // digits without depending on how it rounds a float.
        let tenths = if counts[2] != 0 { counts[3] * 10 / counts[2] } else { 0 };
        println!(
            "{:<28} {:>10} {:>10} {:>10} {:>10} {:>8}.{}",
            WAY_NAMES[w],
            counts[0],
            counts[1],
            counts[2],
            counts[3],
            tenths / 10,
            tenths % 10
        );
    }

    println!();
    println!("{:<28} {:<12} {}", "how", "extra space", "the honest claim");
    for w in 0..4 {
        let mut work = 0i64;
        let values = make(&mut rng, 400);
        run_way(w, &values, &mut work);
        let growth = if work > 400 * 4 { "O(n^2)" } else { "O(n)" };
        println!("{:<28} {:<12} {} time", WAY_NAMES[w], WAY_SPACE[w], growth);
    }

    println!();
    println!("Every one of the four has a single visible loop, and two of them are");
    println!("quadratic. The last column is the giveaway: double the input and the");
    println!("work goes up by exactly two for the linear ones and by three or four");
    println!("for the quadratic ones. That ratio is worth computing in your head");
    println!("when you are unsure -- it needs no theory at all.");
    println!();
    println!("The scan-back row shows 3.5 rather than 4.0 because it stops at the");
    println!("first duplicate, so it does less than the full n squared over two.");
    println!("That is a real constant-factor saving and it does not change the");
    println!("class: the ratio is still well above two, and it will stay above two");
    println!("however large the input gets.");
    println!();
    println!("The mistake both quadratic versions make is the same one, and it is");
    println!("the most common wrong complexity claim there is: the body of the loop");
    println!("is not constant. Building a fresh set, or scanning backwards for a");
    println!("duplicate, is linear work, and it does not look like a loop when it is");
    println!("a function call. \\"It is O(n), there is one loop\\" is a statement about");
    println!("the shape of the code rather than about the work.");
    println!();
    println!("The space column is the other half, and the half people forget to say.");
    println!("Two of these are O(n) extra space, one is O(1) beyond the output, and");
    println!("one is O(range) -- which is a different thing again, and worth saying");
    println!("as O(range) rather than rounding it to O(1) or to O(n). If the values");
    println!("are bounded by a small constant it is effectively O(1); if the range");
    println!("is a billion it is unusable, and the constraints decide which.");
    println!();
    println!("The output array itself is O(n) in all four, and whether to count it");
    println!("is a real question worth asking out loud: output space is usually");
    println!("excluded, auxiliary space is not. Saying which convention you are");
    println!("using takes four words and removes the ambiguity entirely.");
}
`,
            },
            {
              lang: "go",
              code: `// The complexity you state should be the one you wrote, not the one you meant.
//
// "It is O(n), there is one loop" is the most common wrong complexity claim in
// an interview, and it is wrong for one reason: a loop that calls something
// linear is quadratic, and the call does not look like a loop.
//
// Four ways to answer the same question -- for each prefix of the array, how
// many distinct values are in it. All four have exactly one visible loop. Two
// of them are quadratic. The counters below are element inspections, counted
// explicitly rather than timed, so the growth can be read off directly.
package main

import "fmt"

const limit = 1000

// byRecounting builds a fresh set for every prefix. One loop, linear body.
func byRecounting(values []int, work *int64) []int {
	var out []int
	for i := range values {
		seen := map[int]bool{}
		for j := 0; j <= i; j++ {
			*work++
			seen[values[j]] = true
		}
		out = append(out, len(seen))
	}
	return out
}

// byScanningBack adds one if this value has not appeared before. One loop,
// linear body.
func byScanningBack(values []int, work *int64) []int {
	var out []int
	count := 0
	for i := range values {
		fresh := true
		for j := 0; j < i; j++ {
			*work++
			if values[j] == values[i] {
				fresh = false
				break
			}
		}
		if fresh {
			count++
		}
		out = append(out, count)
	}
	return out
}

// byKeepingASet keeps one set across the loop. One loop, constant body.
func byKeepingASet(values []int, work *int64) []int {
	var out []int
	seen := map[int]bool{}
	for _, x := range values {
		*work++
		seen[x] = true
		out = append(out, len(seen))
	}
	return out
}

// byCountingArray keeps one array of counts, sized by the value range. One
// loop, constant body.
func byCountingArray(values []int, work *int64) []int {
	present := make([]bool, limit)
	var out []int
	count := 0
	for _, x := range values {
		*work++
		if !present[x] {
			present[x] = true
			count++
		}
		out = append(out, count)
	}
	return out
}

var wayNames = []string{
	"recount each prefix", "scan back for a duplicate", "keep one set",
	"keep a counting array"}
var waySpace = []string{"O(n)", "O(1)", "O(n)", "O(range)"}

func runWay(which int, values []int, work *int64) []int {
	switch which {
	case 0:
		return byRecounting(values, work)
	case 1:
		return byScanningBack(values, work)
	case 2:
		return byKeepingASet(values, work)
	}
	return byCountingArray(values, work)
}

func same(a, b []int) bool {
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

// The same linear congruential generator in every language, so the arrays
// below are the same arrays whichever translation is run.
var seed int64 = 505

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func make1(n int) []int {
	out := make([]int, n)
	for i := range out {
		out[i] = randBelow(limit)
	}
	return out
}

func main() {
	// All four must agree before any of the counts mean anything.
	check := make1(200)
	var ignored int64
	base := byRecounting(check, &ignored)
	agree := 0
	for w := 0; w < 4; w++ {
		var work int64
		if same(runWay(w, check, &work), base) {
			agree++
		}
	}

	fmt.Printf("all four agree on the same input: %d of 4\\n", agree)
	fmt.Println()
	fmt.Printf("%-28s %10s %10s %10s %10s %10s\\n",
		"how", "n=100", "n=200", "n=400", "n=800", "800/400")
	sizes := []int{100, 200, 400, 800}
	for w := 0; w < 4; w++ {
		var counts [4]int64
		for s, n := range sizes {
			var work int64
			runWay(w, make1(n), &work)
			counts[s] = work
		}
		// Tenths, by integer arithmetic, so every translation prints the same
		// digits without depending on how it rounds a float.
		var tenths int64
		if counts[2] != 0 {
			tenths = counts[3] * 10 / counts[2]
		}
		fmt.Printf("%-28s %10d %10d %10d %10d %8d.%d\\n", wayNames[w],
			counts[0], counts[1], counts[2], counts[3], tenths/10, tenths%10)
	}

	fmt.Println()
	fmt.Printf("%-28s %-12s %s\\n", "how", "extra space", "the honest claim")
	for w := 0; w < 4; w++ {
		var work int64
		runWay(w, make1(400), &work)
		growth := "O(n)"
		if work > 400*4 {
			growth = "O(n^2)"
		}
		fmt.Printf("%-28s %-12s %s time\\n", wayNames[w], waySpace[w], growth)
	}

	fmt.Println()
	fmt.Println("Every one of the four has a single visible loop, and two of them are")
	fmt.Println("quadratic. The last column is the giveaway: double the input and the")
	fmt.Println("work goes up by exactly two for the linear ones and by three or four")
	fmt.Println("for the quadratic ones. That ratio is worth computing in your head")
	fmt.Println("when you are unsure -- it needs no theory at all.")
	fmt.Println()
	fmt.Println("The scan-back row shows 3.5 rather than 4.0 because it stops at the")
	fmt.Println("first duplicate, so it does less than the full n squared over two.")
	fmt.Println("That is a real constant-factor saving and it does not change the")
	fmt.Println("class: the ratio is still well above two, and it will stay above two")
	fmt.Println("however large the input gets.")
	fmt.Println()
	fmt.Println("The mistake both quadratic versions make is the same one, and it is")
	fmt.Println("the most common wrong complexity claim there is: the body of the loop")
	fmt.Println("is not constant. Building a fresh set, or scanning backwards for a")
	fmt.Println("duplicate, is linear work, and it does not look like a loop when it is")
	fmt.Println("a function call. \\"It is O(n), there is one loop\\" is a statement about")
	fmt.Println("the shape of the code rather than about the work.")
	fmt.Println()
	fmt.Println("The space column is the other half, and the half people forget to say.")
	fmt.Println("Two of these are O(n) extra space, one is O(1) beyond the output, and")
	fmt.Println("one is O(range) -- which is a different thing again, and worth saying")
	fmt.Println("as O(range) rather than rounding it to O(1) or to O(n). If the values")
	fmt.Println("are bounded by a small constant it is effectively O(1); if the range")
	fmt.Println("is a billion it is unusable, and the constraints decide which.")
	fmt.Println()
	fmt.Println("The output array itself is O(n) in all four, and whether to count it")
	fmt.Println("is a real question worth asking out loud: output space is usually")
	fmt.Println("excluded, auxiliary space is not. Saying which convention you are")
	fmt.Println("using takes four words and removes the ambiguity entirely.")
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "the-ratio",
      heading: "The doubling ratio, for when you are unsure",
      body: [
        "The last column of that table is a technique, not just a presentation choice. Double the input and see what the work multiplies by. Roughly 2 is linear, roughly 4 is quadratic, roughly 8 is cubic, and slightly-more-than-2 is `n log n`.",
        "You can do this in your head during an interview without running anything: \"if I double `n`, the outer loop runs twice as often and each pass scans twice as far, so the work goes up four times \u2014 that is quadratic.\" It is the same reasoning as counting the work in the body, said in a way that is harder to get wrong.",
        "It is also robust against the case where you cannot name the class. If you can say \"doubling the input roughly quadruples the work, so it is quadratic\", you have stated the complexity correctly even if you never wrote the summation.",
        "And it is the fastest way to check a claim you are unsure of. `n log n` and `n` are easy to confuse when reading code; 2.0 against 2.2 in a measured table is not.",
      ],
      pitfalls: [
        {
          title: "Counting loops rather than work",
          body: "The whole point of the table above. Two of the four have one loop and are quadratic. Ask what one iteration costs, then multiply.",
        },
        {
          title: "Ignoring the cost of built-ins",
          body: "`in` on a list is linear; on a set it is constant. `sort` is n log n and it is one word. Slicing copies. These are the operations that turn a linear-looking loop quadratic, and they are exactly the ones that do not look like work.",
        },
        {
          title: "Stating time and stopping",
          body: "Space is half the answer and it is the half candidates forget. Say both, every time, unprompted.",
        },
      ],
    },
    {
      id: "space",
      heading: "The space half",
      body: [
        "The second table in the output is the part most candidates never say, and it distinguishes the four versions that the time column had collapsed into two.",
        "Recounting uses `O(n)` extra space for the set it rebuilds. Scanning back uses `O(1)`. Keeping one set uses `O(n)`. The counting array uses `O(range)`.",
        "**`O(range)` is worth saying as `O(range)`.** It is neither `O(1)` nor `O(n)`, and which of those it behaves like is decided by the constraints \u2014 bounded small values make it effectively constant, a value range of a billion makes it unusable. Rounding it in either direction throws away the thing the interviewer wants to hear you notice.",
        "**Auxiliary against output.** The result array is `O(n)` in all four versions, and the usual convention excludes output space from the space complexity. That is a convention, not a law, so say which one you are using: \"`O(1)` auxiliary, not counting the output array\" is four extra words that remove the ambiguity completely.",
        "And say the trade-off out loud when there is one. Scanning back is `O(1)` space and quadratic time; keeping a set is `O(n)` space and linear time. That is a real choice, and naming it as a choice is a stronger answer than naming either version as the answer.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is your solution's complexity?",
      answer:
        "I state both halves, and I get the time by counting the work in one iteration rather than counting loops. That distinction matters more than it sounds: I measured four versions of counting distinct values per prefix, all with exactly one visible loop, and two of them are quadratic -- because building a fresh set or scanning backwards is linear work that happens to be a function call rather than an indented block. If I am unsure, I use the doubling ratio: at n=400 to n=800 the linear ones went up by exactly 2.0 and the quadratic ones by 3.5 and 3.9. Then space: how much extra beyond the output, and I say whether I am counting the output.",
    },
    {
      question: "Why does space complexity matter if the time is optimal?",
      answer:
        "Because it is often the actual constraint, and because it is where the real trade-off usually lives. In the four versions I measured, the time column collapses them into two groups but the space column separates all four: O(n) for the rebuilt set, O(1) for the backward scan, O(n) for the single set, O(range) for the counting array. Scanning back is O(1) space and quadratic time, keeping a set is O(n) space and linear -- that is a genuine choice and naming it as a choice is a better answer than picking one. I would also say O(range) as O(range) rather than rounding it, because whether it behaves like O(1) or is unusable depends entirely on the value constraints.",
    },
  ],
  takeaways: [
    "\"One loop, so O(n)\" describes the code's shape, not its work",
    "Four versions, one visible loop each, two of them quadratic",
    "Ask what one iteration costs, then multiply by the iteration count",
    "The expensive work is usually a function call, not an indented block",
    "Doubling ratio: ~2 linear, ~4 quadratic, ~8 cubic — no theory required",
    "3.5 rather than 4.0 is a constant-factor saving, not a different class",
    "Say space unprompted; say O(range) as O(range); say whether output counts",
  ],
};
