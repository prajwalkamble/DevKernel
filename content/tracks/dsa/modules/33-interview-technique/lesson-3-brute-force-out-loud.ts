import type { Lesson } from "@/content/types";

export const bruteForceOutLoudLesson: Lesson = {
  id: "dsa-interview-technique-brute-force-out-loud",
  slug: "brute-force-out-loud",
  moduleSlug: "interview-technique",
  title: "The Brute Force, Out Loud, First",
  summary:
    "Not because it earns partial credit — because it is the oracle. Measured: four hand-picked tests caught one of four seeded bugs; random inputs checked against a brute force caught all four, with counterexamples two intervals long.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Say the brute force in one sentence with its complexity, in under a minute",
    "Use the brute force as a correctness oracle rather than as a fallback answer",
    "Measure how much a small set of hand-picked tests actually catches",
    "Recognise when to write the brute force down and when only to say it",
  ],
  sections: [
    {
      id: "the-usual-argument",
      heading: "The usual argument, and the better one",
      body: [
        "The advice to state a brute force first is nearly universal and the reason usually given is weak: it gets something on the board, so if you run out of time you have shown *something*.",
        "That is true and it is not the point. Interviewers rarely give much credit for an unwritten `O(n^3)`, and a candidate who says \"well, brute force is cubic\" and then stalls has not banked anything.",
        "The real reason is that the brute force is the only **oracle** you will have. It is the version whose correctness you can see by inspection, and once it exists you can check anything you write afterwards against it \u2014 on inputs you did not have to reason about.",
        "That is a different claim and a much stronger one, and it is measurable. The rest of this lesson measures it.",
      ],
    },
    {
      id: "measuring-it",
      heading: "What the oracle actually catches",
      body: [
        "The problem below is merging overlapping intervals \u2014 a standard question, and one where the fast solution is short enough that people write it confidently and wrongly.",
        "The brute force is the definition restated: while any two intervals overlap, merge them and start again. Quadratic at least, obviously correct, four lines. The fast version sorts by start and sweeps once.",
        "Then four bugs are seeded into the fast version, each one an actual mistake people make: using `>` where `>=` belongs, so touching intervals are not merged; taking the new end rather than the larger end; forgetting to sort; and dropping the last interval.",
        "Each buggy version is run against two things: four hand-picked tests of the kind people write when asked for tests, and three thousand random small inputs checked against the brute force.",
      ],
      examples: [
        {
          id: "brute-force-as-oracle",
          title: "Four seeded bugs, four hand-picked tests, and three thousand random ones",
          lang: "python",
          code: `# The brute force is not a warm-up. It is the oracle.
#
# "Write the brute force first" is usually justified as a way to get something
# on the board. The stronger reason is that it is an obviously-correct
# implementation you can test the fast one against on random inputs -- and
# random inputs find bugs that hand-picked examples do not.
#
# Below: merging overlapping intervals. One brute force that repeatedly merges
# any overlapping pair until none are left, one fast sweep, and four seeded
# bugs of the kind people actually write. Then two ways of testing, scored
# against each other.


def merge_by_brute_force(intervals):
    """Keep merging any two that overlap, until no two do. Obviously correct."""
    out = [list(iv) for iv in intervals]
    merged = True
    while merged:
        merged = False
        for i in range(len(out)):
            for j in range(i + 1, len(out)):
                a, b = out[i], out[j]
                if a[0] <= b[1] and b[0] <= a[1]:
                    a[0] = min(a[0], b[0])
                    a[1] = max(a[1], b[1])
                    out.pop(j)
                    merged = True
                    break
            if merged:
                break
    return sorted(tuple(iv) for iv in out)


def merge_fast(intervals, bug=0):
    """Sort by start and sweep. \`bug\` selects one of four plausible mistakes.

    1  overlap tested with > instead of >=, so touching intervals stay apart
    2  the merged end is the new one rather than the larger of the two
    3  the sort is missing
    4  the last interval is never appended
    """
    order = list(intervals) if bug == 3 else sorted(intervals)
    out = []
    for start, end in order:
        if out and (start < out[-1][1] if bug == 1 else start <= out[-1][1]):
            if bug == 2:
                out[-1] = (out[-1][0], end)
            else:
                out[-1] = (out[-1][0], max(out[-1][1], end))
        else:
            out.append((start, end))
    if bug == 4 and out:
        out.pop()
    return sorted(out)


# The tests a person actually writes: nothing, one thing, the example from the
# statement, and two that do not touch.
HAND_PICKED = [
    [],
    [(1, 3)],
    [(1, 3), (2, 6), (8, 10)],
    [(1, 4), (6, 8)],
]


def show(intervals):
    if not intervals:
        return "[]"
    return "[" + ", ".join("%d-%d" % (a, b) for a, b in intervals) + "]"


BUGS = [
    (1, "touching not merged"),
    (2, "end not maxed"),
    (3, "no sort"),
    (4, "last one dropped"),
]

print("%-30s %s" % ("hand-picked test", "which bugs it catches"))
for case in HAND_PICKED:
    want = merge_by_brute_force(case)
    caught = [name for bug, name in BUGS if merge_fast(case, bug) != want]
    print("%-30s %s" % (show(case), ", ".join(caught) if caught else "none"))

# The same linear congruential generator in every language, so the random
# inputs below are the same inputs whichever translation is run.
seed = 33033


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


def random_case():
    n = rand(5)
    case = []
    for _ in range(n):
        start = rand(10)
        case.append((start, start + rand(4)))
    return case


trials = 3000
found = {bug: 0 for bug, _ in BUGS}
smallest = {bug: None for bug, _ in BUGS}
correct_clean = 0
for _ in range(trials):
    case = random_case()
    want = merge_by_brute_force(case)
    if merge_fast(case, 0) == want:
        correct_clean += 1
    for bug, _ in BUGS:
        if merge_fast(case, bug) != want:
            found[bug] += 1
            if smallest[bug] is None or len(case) < len(smallest[bug]):
                smallest[bug] = case

hand_caught = set()
for case in HAND_PICKED:
    want = merge_by_brute_force(case)
    for bug, _ in BUGS:
        if merge_fast(case, bug) != want:
            hand_caught.add(bug)

print()
print("over %d random inputs of at most 4 intervals:" % trials)
print("  %-30s %6d" % ("the correct sweep agreed", correct_clean))
print()
print("%-22s %10s %10s %s" % ("seeded bug", "hand-picked", "random", "smallest case found"))
for bug, name in BUGS:
    print("%-22s %10s %10d %s" % (
        name,
        "caught" if bug in hand_caught else "missed",
        found[bug],
        show(sorted(smallest[bug])) if smallest[bug] else "-"))

print()
print("The correct sweep agreed with the brute force on all %d inputs, which" % correct_clean)
print("is what makes the rest of the table trustworthy: the oracle and the")
print("fast version really do answer the same question.")
print()
print("The four hand-picked tests are the ones people write -- nothing, one")
print("thing, the example from the statement, and two that do not touch. They")
print("caught %d of the %d seeded bugs." % (len(hand_caught), len(BUGS)))
print()
print("Random inputs caught all four, and note the last column: every")
print("counterexample it found is tiny. These are not exotic inputs. They are")
print("the two-interval cases nobody thinks to write down, and they are found")
print("in a few hundred milliseconds by a loop that compares two functions.")
print()
print("That is the argument for the brute force, and it is a stronger one than")
print("\\"get something on the board\\". Without it you have no oracle, so the")
print("only tests you can write are ones where you worked out the answer by")
print("hand -- which means the only cases you test are the ones you already")
print("thought of, which are exactly the ones you did not get wrong.")
`,
          output: `hand-picked test               which bugs it catches
[]                             none
[1-3]                          last one dropped
[1-3, 2-6, 8-10]               last one dropped
[1-4, 6-8]                     last one dropped

over 3000 random inputs of at most 4 intervals:
  the correct sweep agreed         3000

seeded bug             hand-picked     random smallest case found
touching not merged        missed        698 [6-9, 9-9]
end not maxed              missed        192 [8-10, 9-9]
no sort                    missed       1273 [8-10, 9-11]
last one dropped           caught       2345 [0-2]

The correct sweep agreed with the brute force on all 3000 inputs, which
is what makes the rest of the table trustworthy: the oracle and the
fast version really do answer the same question.

The four hand-picked tests are the ones people write -- nothing, one
thing, the example from the statement, and two that do not touch. They
caught 1 of the 4 seeded bugs.

Random inputs caught all four, and note the last column: every
counterexample it found is tiny. These are not exotic inputs. They are
the two-interval cases nobody thinks to write down, and they are found
in a few hundred milliseconds by a loop that compares two functions.

That is the argument for the brute force, and it is a stronger one than
"get something on the board". Without it you have no oracle, so the
only tests you can write are ones where you worked out the answer by
hand -- which means the only cases you test are the ones you already
thought of, which are exactly the ones you did not get wrong.`,
          explanation:
            "The first block confirms the oracle: the correct sweep agrees with the brute force on all 3,000 inputs, which is what makes the rest of the table mean anything. Then the four hand-picked tests catch 1 of the 4 seeded bugs -- and the four are not lazy tests, they are the empty input, a single interval, the example from the statement, and two that do not overlap. Random inputs against the brute force caught all four, and the last column is the part worth staring at: the smallest counterexample for each bug is one or two intervals. `[6-9, 9-9]`, `[8-10, 9-9]`, `[8-10, 9-11]`, `[0-2]`. Nothing exotic. They are the cases nobody thinks to write down by hand, which is precisely why hand-written tests miss them.",
          alternates: [
            {
              lang: "javascript",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.

const byStart = (a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

// Keep merging any two that overlap, until no two do. Obviously correct.
function mergeByBruteForce(intervals) {
  const out = intervals.map((iv) => [...iv]);
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < out.length; i += 1) {
      for (let j = i + 1; j < out.length; j += 1) {
        const a = out[i];
        const b = out[j];
        if (a[0] <= b[1] && b[0] <= a[1]) {
          a[0] = Math.min(a[0], b[0]);
          a[1] = Math.max(a[1], b[1]);
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out.sort(byStart);
}

// Sort by start and sweep. \`bug\` selects one of four plausible mistakes.
//
//   1  overlap tested with > instead of >=, so touching intervals stay apart
//   2  the merged end is the new one rather than the larger of the two
//   3  the sort is missing
//   4  the last interval is never appended
function mergeFast(intervals, bug) {
  const order = bug === 3 ? intervals.map((iv) => [...iv]) : intervals.map((iv) => [...iv]).sort(byStart);
  const out = [];
  for (const [start, end] of order) {
    const overlaps = out.length > 0 && (bug === 1 ? start < out[out.length - 1][1] : start <= out[out.length - 1][1]);
    if (overlaps) {
      const last = out[out.length - 1];
      last[1] = bug === 2 ? end : Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }
  if (bug === 4 && out.length > 0) out.pop();
  return out.sort(byStart);
}

// The tests a person actually writes: nothing, one thing, the example from the
// statement, and two that do not touch.
const HAND_PICKED = [
  [],
  [[1, 3]],
  [[1, 3], [2, 6], [8, 10]],
  [[1, 4], [6, 8]],
];

function show(intervals) {
  if (intervals.length === 0) return "[]";
  return "[" + intervals.map(([a, b]) => \`\${a}-\${b}\`).join(", ") + "]";
}

const same = (a, b) =>
  a.length === b.length && a.every((iv, i) => iv[0] === b[i][0] && iv[1] === b[i][1]);

const BUGS = [
  [1, "touching not merged"],
  [2, "end not maxed"],
  [3, "no sort"],
  [4, "last one dropped"],
];

console.log("hand-picked test".padEnd(30) + " " + "which bugs it catches");
for (const testCase of HAND_PICKED) {
  const want = mergeByBruteForce(testCase);
  const caught = BUGS.filter(([bug]) => !same(mergeFast(testCase, bug), want)).map(([, name]) => name);
  console.log(show(testCase).padEnd(30) + " " + (caught.length > 0 ? caught.join(", ") : "none"));
}

// The same linear congruential generator in every language, so the random
// inputs below are the same inputs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 33033n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomCase() {
  const n = rand(5);
  const testCase = [];
  for (let i = 0; i < n; i += 1) {
    const start = rand(10);
    testCase.push([start, start + rand(4)]);
  }
  return testCase;
}

const trials = 3000;
const found = new Map(BUGS.map(([bug]) => [bug, 0]));
const smallest = new Map(BUGS.map(([bug]) => [bug, null]));
let correctClean = 0;
for (let t = 0; t < trials; t += 1) {
  const testCase = randomCase();
  const want = mergeByBruteForce(testCase);
  if (same(mergeFast(testCase, 0), want)) correctClean += 1;
  for (const [bug] of BUGS) {
    if (!same(mergeFast(testCase, bug), want)) {
      found.set(bug, found.get(bug) + 1);
      const best = smallest.get(bug);
      if (best === null || testCase.length < best.length) smallest.set(bug, testCase);
    }
  }
}

const handCaught = new Set();
for (const testCase of HAND_PICKED) {
  const want = mergeByBruteForce(testCase);
  for (const [bug] of BUGS) {
    if (!same(mergeFast(testCase, bug), want)) handCaught.add(bug);
  }
}

console.log();
console.log(\`over \${trials} random inputs of at most 4 intervals:\`);
console.log("  " + "the correct sweep agreed".padEnd(30) + " " + String(correctClean).padStart(6));
console.log();
console.log(
  "seeded bug".padEnd(22) + " " + "hand-picked".padStart(10) + " " +
  "random".padStart(10) + " " + "smallest case found",
);
for (const [bug, name] of BUGS) {
  const best = smallest.get(bug);
  console.log(
    name.padEnd(22) + " " + (handCaught.has(bug) ? "caught" : "missed").padStart(10) + " " +
    String(found.get(bug)).padStart(10) + " " +
    (best ? show([...best].sort(byStart)) : "-"),
  );
}

console.log();
console.log(\`The correct sweep agreed with the brute force on all \${correctClean} inputs, which\`);
console.log("is what makes the rest of the table trustworthy: the oracle and the");
console.log("fast version really do answer the same question.");
console.log();
console.log("The four hand-picked tests are the ones people write -- nothing, one");
console.log("thing, the example from the statement, and two that do not touch. They");
console.log(\`caught \${handCaught.size} of the \${BUGS.length} seeded bugs.\`);
console.log();
console.log("Random inputs caught all four, and note the last column: every");
console.log("counterexample it found is tiny. These are not exotic inputs. They are");
console.log("the two-interval cases nobody thinks to write down, and they are found");
console.log("in a few hundred milliseconds by a loop that compares two functions.");
console.log();
console.log("That is the argument for the brute force, and it is a stronger one than");
console.log('"get something on the board". Without it you have no oracle, so the');
console.log("only tests you can write are ones where you worked out the answer by");
console.log("hand -- which means the only cases you test are the ones you already");
console.log("thought of, which are exactly the ones you did not get wrong.");
`,
            },
            {
              lang: "typescript",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.

const byStart = (a: number[], b: number[]): number => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

// Keep merging any two that overlap, until no two do. Obviously correct.
function mergeByBruteForce(intervals: number[][]): number[][] {
  const out = intervals.map((iv) => [...iv]);
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < out.length; i += 1) {
      for (let j = i + 1; j < out.length; j += 1) {
        const a = out[i];
        const b = out[j];
        if (a[0] <= b[1] && b[0] <= a[1]) {
          a[0] = Math.min(a[0], b[0]);
          a[1] = Math.max(a[1], b[1]);
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out.sort(byStart);
}

// Sort by start and sweep. \`bug\` selects one of four plausible mistakes.
//
//   1  overlap tested with > instead of >=, so touching intervals stay apart
//   2  the merged end is the new one rather than the larger of the two
//   3  the sort is missing
//   4  the last interval is never appended
function mergeFast(intervals: number[][], bug: number): number[][] {
  const order = bug === 3 ? intervals.map((iv) => [...iv]) : intervals.map((iv) => [...iv]).sort(byStart);
  const out: number[][] = [];
  for (const [start, end] of order) {
    const overlaps = out.length > 0 && (bug === 1 ? start < out[out.length - 1][1] : start <= out[out.length - 1][1]);
    if (overlaps) {
      const last = out[out.length - 1];
      last[1] = bug === 2 ? end : Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }
  if (bug === 4 && out.length > 0) out.pop();
  return out.sort(byStart);
}

// The tests a person actually writes: nothing, one thing, the example from the
// statement, and two that do not touch.
const HAND_PICKED: number[][][] = [
  [],
  [[1, 3]],
  [[1, 3], [2, 6], [8, 10]],
  [[1, 4], [6, 8]],
];

function show(intervals: number[][]): string {
  if (intervals.length === 0) return "[]";
  return "[" + intervals.map(([a, b]) => \`\${a}-\${b}\`).join(", ") + "]";
}

const same = (a: number[][], b: number[][]): boolean =>
  a.length === b.length && a.every((iv, i) => iv[0] === b[i][0] && iv[1] === b[i][1]);

const BUGS: [number, string][] = [
  [1, "touching not merged"],
  [2, "end not maxed"],
  [3, "no sort"],
  [4, "last one dropped"],
];

console.log("hand-picked test".padEnd(30) + " " + "which bugs it catches");
for (const testCase of HAND_PICKED) {
  const want = mergeByBruteForce(testCase);
  const caught = BUGS.filter(([bug]) => !same(mergeFast(testCase, bug), want)).map(([, name]) => name);
  console.log(show(testCase).padEnd(30) + " " + (caught.length > 0 ? caught.join(", ") : "none"));
}

// The same linear congruential generator in every language, so the random
// inputs below are the same inputs whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 33033n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

function randomCase(): number[][] {
  const n = rand(5);
  const testCase: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const start = rand(10);
    testCase.push([start, start + rand(4)]);
  }
  return testCase;
}

const trials = 3000;
const found = new Map<number, number>(BUGS.map(([bug]) => [bug, 0]));
const smallest = new Map<number, number[][] | null>(BUGS.map(([bug]) => [bug, null]));
let correctClean = 0;
for (let t = 0; t < trials; t += 1) {
  const testCase = randomCase();
  const want = mergeByBruteForce(testCase);
  if (same(mergeFast(testCase, 0), want)) correctClean += 1;
  for (const [bug] of BUGS) {
    if (!same(mergeFast(testCase, bug), want)) {
      found.set(bug, (found.get(bug) as number) + 1);
      const best = smallest.get(bug) ?? null;
      if (best === null || testCase.length < best.length) smallest.set(bug, testCase);
    }
  }
}

const handCaught = new Set<number>();
for (const testCase of HAND_PICKED) {
  const want = mergeByBruteForce(testCase);
  for (const [bug] of BUGS) {
    if (!same(mergeFast(testCase, bug), want)) handCaught.add(bug);
  }
}

console.log();
console.log(\`over \${trials} random inputs of at most 4 intervals:\`);
console.log("  " + "the correct sweep agreed".padEnd(30) + " " + String(correctClean).padStart(6));
console.log();
console.log(
  "seeded bug".padEnd(22) + " " + "hand-picked".padStart(10) + " " +
  "random".padStart(10) + " " + "smallest case found",
);
for (const [bug, name] of BUGS) {
  const best = smallest.get(bug) ?? null;
  console.log(
    name.padEnd(22) + " " + (handCaught.has(bug) ? "caught" : "missed").padStart(10) + " " +
    String(found.get(bug)).padStart(10) + " " +
    (best ? show([...best].sort(byStart)) : "-"),
  );
}

console.log();
console.log(\`The correct sweep agreed with the brute force on all \${correctClean} inputs, which\`);
console.log("is what makes the rest of the table trustworthy: the oracle and the");
console.log("fast version really do answer the same question.");
console.log();
console.log("The four hand-picked tests are the ones people write -- nothing, one");
console.log("thing, the example from the statement, and two that do not touch. They");
console.log(\`caught \${handCaught.size} of the \${BUGS.length} seeded bugs.\`);
console.log();
console.log("Random inputs caught all four, and note the last column: every");
console.log("counterexample it found is tiny. These are not exotic inputs. They are");
console.log("the two-interval cases nobody thinks to write down, and they are found");
console.log("in a few hundred milliseconds by a loop that compares two functions.");
console.log();
console.log("That is the argument for the brute force, and it is a stronger one than");
console.log('"get something on the board". Without it you have no oracle, so the');
console.log("only tests you can write are ones where you worked out the answer by");
console.log("hand -- which means the only cases you test are the ones you already");
console.log("thought of, which are exactly the ones you did not get wrong.");
`,
            },
            {
              lang: "java",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
    static final Comparator<int[]> BY_START =
        Comparator.<int[]>comparingInt(iv -> iv[0]).thenComparingInt(iv -> iv[1]);

    /** Keep merging any two that overlap, until no two do. Obviously correct. */
    static List<int[]> mergeByBruteForce(List<int[]> intervals) {
        List<int[]> out = new ArrayList<>();
        for (int[] iv : intervals) out.add(new int[] {iv[0], iv[1]});
        boolean merged = true;
        while (merged) {
            merged = false;
            for (int i = 0; i < out.size() && !merged; i++) {
                for (int j = i + 1; j < out.size(); j++) {
                    int[] a = out.get(i), b = out.get(j);
                    if (a[0] <= b[1] && b[0] <= a[1]) {
                        a[0] = Math.min(a[0], b[0]);
                        a[1] = Math.max(a[1], b[1]);
                        out.remove(j);
                        merged = true;
                        break;
                    }
                }
            }
        }
        out.sort(BY_START);
        return out;
    }

    /**
     * Sort by start and sweep. {@code bug} selects one of four plausible
     * mistakes.
     *
     * <p>1 overlap tested with &gt; instead of &gt;=, so touching intervals
     * stay apart. 2 the merged end is the new one rather than the larger of
     * the two. 3 the sort is missing. 4 the last interval is never appended.
     */
    static List<int[]> mergeFast(List<int[]> intervals, int bug) {
        List<int[]> order = new ArrayList<>();
        for (int[] iv : intervals) order.add(new int[] {iv[0], iv[1]});
        if (bug != 3) order.sort(BY_START);
        List<int[]> out = new ArrayList<>();
        for (int[] iv : order) {
            int start = iv[0], end = iv[1];
            boolean overlaps = !out.isEmpty()
                && (bug == 1 ? start < out.get(out.size() - 1)[1]
                             : start <= out.get(out.size() - 1)[1]);
            if (overlaps) {
                int[] last = out.get(out.size() - 1);
                last[1] = bug == 2 ? end : Math.max(last[1], end);
            } else {
                out.add(new int[] {start, end});
            }
        }
        if (bug == 4 && !out.isEmpty()) out.remove(out.size() - 1);
        out.sort(BY_START);
        return out;
    }

    static boolean same(List<int[]> a, List<int[]> b) {
        if (a.size() != b.size()) return false;
        for (int i = 0; i < a.size(); i++)
            if (a.get(i)[0] != b.get(i)[0] || a.get(i)[1] != b.get(i)[1]) return false;
        return true;
    }

    static String show(List<int[]> intervals) {
        if (intervals.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < intervals.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(intervals.get(i)[0]).append("-").append(intervals.get(i)[1]);
        }
        return sb.append("]").toString();
    }

    static List<int[]> listOf(int[][] pairs) {
        List<int[]> out = new ArrayList<>();
        for (int[] p : pairs) out.add(p);
        return out;
    }

    static final int[] BUG_IDS = {1, 2, 3, 4};
    static final String[] BUG_NAMES = {
        "touching not merged", "end not maxed", "no sort", "last one dropped"};

    // The same linear congruential generator in every language, so the random
    // inputs below are the same inputs whichever translation is run.
    static long seed = 33033L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static List<int[]> randomCase() {
        int n = rand(5);
        List<int[]> out = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            int start = rand(10);
            out.add(new int[] {start, start + rand(4)});
        }
        return out;
    }

    public static void main(String[] args) {
        // The tests a person actually writes: nothing, one thing, the example
        // from the statement, and two that do not touch.
        List<List<int[]>> handPicked = new ArrayList<>();
        handPicked.add(listOf(new int[][] {}));
        handPicked.add(listOf(new int[][] {{1, 3}}));
        handPicked.add(listOf(new int[][] {{1, 3}, {2, 6}, {8, 10}}));
        handPicked.add(listOf(new int[][] {{1, 4}, {6, 8}}));

        System.out.printf("%-30s %s%n", "hand-picked test", "which bugs it catches");
        for (List<int[]> testCase : handPicked) {
            List<int[]> want = mergeByBruteForce(testCase);
            List<String> caught = new ArrayList<>();
            for (int b = 0; b < BUG_IDS.length; b++)
                if (!same(mergeFast(testCase, BUG_IDS[b]), want)) caught.add(BUG_NAMES[b]);
            System.out.printf("%-30s %s%n", show(testCase),
                caught.isEmpty() ? "none" : String.join(", ", caught));
        }

        int trials = 3000;
        Map<Integer, Integer> found = new HashMap<>();
        Map<Integer, List<int[]>> smallest = new HashMap<>();
        for (int bug : BUG_IDS) {
            found.put(bug, 0);
            smallest.put(bug, null);
        }
        int correctClean = 0;
        for (int t = 0; t < trials; t++) {
            List<int[]> testCase = randomCase();
            List<int[]> want = mergeByBruteForce(testCase);
            if (same(mergeFast(testCase, 0), want)) correctClean++;
            for (int bug : BUG_IDS) {
                if (!same(mergeFast(testCase, bug), want)) {
                    found.put(bug, found.get(bug) + 1);
                    List<int[]> best = smallest.get(bug);
                    if (best == null || testCase.size() < best.size())
                        smallest.put(bug, testCase);
                }
            }
        }

        Set<Integer> handCaught = new HashSet<>();
        for (List<int[]> testCase : handPicked) {
            List<int[]> want = mergeByBruteForce(testCase);
            for (int bug : BUG_IDS)
                if (!same(mergeFast(testCase, bug), want)) handCaught.add(bug);
        }

        System.out.println();
        System.out.println("over " + trials + " random inputs of at most 4 intervals:");
        System.out.printf("  %-30s %6d%n", "the correct sweep agreed", correctClean);
        System.out.println();
        System.out.printf("%-22s %10s %10s %s%n",
            "seeded bug", "hand-picked", "random", "smallest case found");
        for (int b = 0; b < BUG_IDS.length; b++) {
            int bug = BUG_IDS[b];
            List<int[]> best = smallest.get(bug);
            String shown = "-";
            if (best != null) {
                List<int[]> copy = new ArrayList<>(best);
                copy.sort(BY_START);
                shown = show(copy);
            }
            System.out.printf("%-22s %10s %10d %s%n", BUG_NAMES[b],
                handCaught.contains(bug) ? "caught" : "missed", found.get(bug), shown);
        }

        System.out.println();
        System.out.println("The correct sweep agreed with the brute force on all " + correctClean
            + " inputs, which");
        System.out.println("is what makes the rest of the table trustworthy: the oracle and the");
        System.out.println("fast version really do answer the same question.");
        System.out.println();
        System.out.println("The four hand-picked tests are the ones people write -- nothing, one");
        System.out.println("thing, the example from the statement, and two that do not touch. They");
        System.out.println("caught " + handCaught.size() + " of the " + BUG_IDS.length
            + " seeded bugs.");
        System.out.println();
        System.out.println("Random inputs caught all four, and note the last column: every");
        System.out.println("counterexample it found is tiny. These are not exotic inputs. They are");
        System.out.println("the two-interval cases nobody thinks to write down, and they are found");
        System.out.println("in a few hundred milliseconds by a loop that compares two functions.");
        System.out.println();
        System.out.println("That is the argument for the brute force, and it is a stronger one than");
        System.out.println("\\"get something on the board\\". Without it you have no oracle, so the");
        System.out.println("only tests you can write are ones where you worked out the answer by");
        System.out.println("hand -- which means the only cases you test are the ones you already");
        System.out.println("thought of, which are exactly the ones you did not get wrong.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.
#include <algorithm>
#include <array>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

using Interval = std::array<int, 2>;
using Intervals = std::vector<Interval>;

bool by_start(const Interval& a, const Interval& b) {
    return a[0] != b[0] ? a[0] < b[0] : a[1] < b[1];
}

// Keep merging any two that overlap, until no two do. Obviously correct.
Intervals merge_by_brute_force(Intervals out) {
    bool merged = true;
    while (merged) {
        merged = false;
        for (size_t i = 0; i < out.size() && !merged; i++) {
            for (size_t j = i + 1; j < out.size(); j++) {
                if (out[i][0] <= out[j][1] && out[j][0] <= out[i][1]) {
                    out[i][0] = std::min(out[i][0], out[j][0]);
                    out[i][1] = std::max(out[i][1], out[j][1]);
                    out.erase(out.begin() + static_cast<long>(j));
                    merged = true;
                    break;
                }
            }
        }
    }
    std::sort(out.begin(), out.end(), by_start);
    return out;
}

// Sort by start and sweep. \`bug\` selects one of four plausible mistakes.
//
//   1  overlap tested with > instead of >=, so touching intervals stay apart
//   2  the merged end is the new one rather than the larger of the two
//   3  the sort is missing
//   4  the last interval is never appended
Intervals merge_fast(Intervals order, int bug) {
    if (bug != 3) std::sort(order.begin(), order.end(), by_start);
    Intervals out;
    for (const Interval& iv : order) {
        int start = iv[0], end = iv[1];
        bool overlaps = !out.empty() &&
                        (bug == 1 ? start < out.back()[1] : start <= out.back()[1]);
        if (overlaps) {
            out.back()[1] = bug == 2 ? end : std::max(out.back()[1], end);
        } else {
            out.push_back({start, end});
        }
    }
    if (bug == 4 && !out.empty()) out.pop_back();
    std::sort(out.begin(), out.end(), by_start);
    return out;
}

std::string show(const Intervals& intervals) {
    if (intervals.empty()) return "[]";
    std::string s = "[";
    for (size_t i = 0; i < intervals.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(intervals[i][0]) + "-" + std::to_string(intervals[i][1]);
    }
    return s + "]";
}

const int BUG_IDS[4] = {1, 2, 3, 4};
const std::string BUG_NAMES[4] = {
    "touching not merged", "end not maxed", "no sort", "last one dropped"};

// The same linear congruential generator in every language, so the random
// inputs below are the same inputs whichever translation is run.
long long seed = 33033;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

Intervals random_case() {
    int n = rand_below(5);
    Intervals out;
    for (int i = 0; i < n; i++) {
        int start = rand_below(10);
        out.push_back({start, start + rand_below(4)});
    }
    return out;
}

int main() {
    // The tests a person actually writes: nothing, one thing, the example from
    // the statement, and two that do not touch.
    std::vector<Intervals> hand_picked = {
        {},
        {{1, 3}},
        {{1, 3}, {2, 6}, {8, 10}},
        {{1, 4}, {6, 8}},
    };

    std::cout << std::left << std::setw(30) << "hand-picked test" << " "
              << "which bugs it catches" << "\\n";
    for (const Intervals& test_case : hand_picked) {
        Intervals want = merge_by_brute_force(test_case);
        std::string caught;
        for (int b = 0; b < 4; b++) {
            if (merge_fast(test_case, BUG_IDS[b]) != want) {
                if (!caught.empty()) caught += ", ";
                caught += BUG_NAMES[b];
            }
        }
        std::cout << std::left << std::setw(30) << show(test_case) << " "
                  << (caught.empty() ? "none" : caught) << "\\n";
    }

    int trials = 3000;
    std::map<int, int> found;
    std::map<int, Intervals> smallest;
    std::set<int> has_smallest;
    for (int bug : BUG_IDS) found[bug] = 0;
    int correct_clean = 0;
    for (int t = 0; t < trials; t++) {
        Intervals test_case = random_case();
        Intervals want = merge_by_brute_force(test_case);
        if (merge_fast(test_case, 0) == want) correct_clean++;
        for (int bug : BUG_IDS) {
            if (merge_fast(test_case, bug) != want) {
                found[bug]++;
                if (!has_smallest.count(bug) || test_case.size() < smallest[bug].size()) {
                    smallest[bug] = test_case;
                    has_smallest.insert(bug);
                }
            }
        }
    }

    std::set<int> hand_caught;
    for (const Intervals& test_case : hand_picked) {
        Intervals want = merge_by_brute_force(test_case);
        for (int bug : BUG_IDS)
            if (merge_fast(test_case, bug) != want) hand_caught.insert(bug);
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random inputs of at most 4 intervals:\\n";
    std::cout << "  " << std::left << std::setw(30) << "the correct sweep agreed" << " "
              << std::right << std::setw(6) << correct_clean << "\\n";
    std::cout << "\\n";
    std::cout << std::left << std::setw(22) << "seeded bug" << " " << std::right
              << std::setw(10) << "hand-picked" << " " << std::setw(10) << "random" << " "
              << "smallest case found" << "\\n";
    for (int b = 0; b < 4; b++) {
        int bug = BUG_IDS[b];
        std::string shown = "-";
        if (has_smallest.count(bug)) {
            Intervals copy = smallest[bug];
            std::sort(copy.begin(), copy.end(), by_start);
            shown = show(copy);
        }
        std::cout << std::left << std::setw(22) << BUG_NAMES[b] << " " << std::right
                  << std::setw(10) << (hand_caught.count(bug) ? "caught" : "missed") << " "
                  << std::setw(10) << found[bug] << " " << shown << "\\n";
    }

    std::cout << "\\n";
    std::cout << "The correct sweep agreed with the brute force on all " << correct_clean
              << " inputs, which\\n";
    std::cout << "is what makes the rest of the table trustworthy: the oracle and the\\n";
    std::cout << "fast version really do answer the same question.\\n";
    std::cout << "\\n";
    std::cout << "The four hand-picked tests are the ones people write -- nothing, one\\n";
    std::cout << "thing, the example from the statement, and two that do not touch. They\\n";
    std::cout << "caught " << hand_caught.size() << " of the 4 seeded bugs.\\n";
    std::cout << "\\n";
    std::cout << "Random inputs caught all four, and note the last column: every\\n";
    std::cout << "counterexample it found is tiny. These are not exotic inputs. They are\\n";
    std::cout << "the two-interval cases nobody thinks to write down, and they are found\\n";
    std::cout << "in a few hundred milliseconds by a loop that compares two functions.\\n";
    std::cout << "\\n";
    std::cout << "That is the argument for the brute force, and it is a stronger one than\\n";
    std::cout << "\\"get something on the board\\". Without it you have no oracle, so the\\n";
    std::cout << "only tests you can write are ones where you worked out the answer by\\n";
    std::cout << "hand -- which means the only cases you test are the ones you already\\n";
    std::cout << "thought of, which are exactly the ones you did not get wrong.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.
use std::collections::{BTreeMap, BTreeSet};

type Interval = (i64, i64);
type Intervals = Vec<Interval>;

/// Keep merging any two that overlap, until no two do. Obviously correct.
fn merge_by_brute_force(intervals: &Intervals) -> Intervals {
    let mut out = intervals.clone();
    let mut merged = true;
    while merged {
        merged = false;
        'outer: for i in 0..out.len() {
            for j in (i + 1)..out.len() {
                if out[i].0 <= out[j].1 && out[j].0 <= out[i].1 {
                    out[i].0 = out[i].0.min(out[j].0);
                    out[i].1 = out[i].1.max(out[j].1);
                    out.remove(j);
                    merged = true;
                    break 'outer;
                }
            }
        }
    }
    out.sort();
    out
}

/// Sort by start and sweep. \`bug\` selects one of four plausible mistakes.
///
///   1  overlap tested with > instead of >=, so touching intervals stay apart
///   2  the merged end is the new one rather than the larger of the two
///   3  the sort is missing
///   4  the last interval is never appended
fn merge_fast(intervals: &Intervals, bug: i32) -> Intervals {
    let mut order = intervals.clone();
    if bug != 3 {
        order.sort();
    }
    let mut out: Intervals = Vec::new();
    for &(start, end) in &order {
        let overlaps = match out.last() {
            None => false,
            Some(&(_, last_end)) => {
                if bug == 1 {
                    start < last_end
                } else {
                    start <= last_end
                }
            }
        };
        if overlaps {
            let last = out.last_mut().unwrap();
            last.1 = if bug == 2 { end } else { last.1.max(end) };
        } else {
            out.push((start, end));
        }
    }
    if bug == 4 && !out.is_empty() {
        out.pop();
    }
    out.sort();
    out
}

fn show(intervals: &Intervals) -> String {
    if intervals.is_empty() {
        return "[]".to_string();
    }
    let cells: Vec<String> = intervals.iter().map(|&(a, b)| format!("{}-{}", a, b)).collect();
    format!("[{}]", cells.join(", "))
}

const BUG_IDS: [i32; 4] = [1, 2, 3, 4];
const BUG_NAMES: [&str; 4] = [
    "touching not merged",
    "end not maxed",
    "no sort",
    "last one dropped",
];

/// The same linear congruential generator in every language, so the random
/// inputs below are the same inputs whichever translation is run.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn random_case(rng: &mut Rng) -> Intervals {
    let n = rng.next(5);
    let mut out: Intervals = Vec::new();
    for _ in 0..n {
        let start = rng.next(10);
        out.push((start, start + rng.next(4)));
    }
    out
}

fn main() {
    // The tests a person actually writes: nothing, one thing, the example from
    // the statement, and two that do not touch.
    let hand_picked: Vec<Intervals> = vec![
        vec![],
        vec![(1, 3)],
        vec![(1, 3), (2, 6), (8, 10)],
        vec![(1, 4), (6, 8)],
    ];

    println!("{:<30} {}", "hand-picked test", "which bugs it catches");
    for test_case in &hand_picked {
        let want = merge_by_brute_force(test_case);
        let caught: Vec<&str> = (0..4)
            .filter(|&b| merge_fast(test_case, BUG_IDS[b]) != want)
            .map(|b| BUG_NAMES[b])
            .collect();
        println!(
            "{:<30} {}",
            show(test_case),
            if caught.is_empty() {
                "none".to_string()
            } else {
                caught.join(", ")
            }
        );
    }

    let mut rng = Rng { seed: 33033 };
    let trials = 3000;
    let mut found: BTreeMap<i32, i64> = BUG_IDS.iter().map(|&b| (b, 0)).collect();
    let mut smallest: BTreeMap<i32, Intervals> = BTreeMap::new();
    let mut correct_clean = 0i64;
    for _ in 0..trials {
        let test_case = random_case(&mut rng);
        let want = merge_by_brute_force(&test_case);
        if merge_fast(&test_case, 0) == want {
            correct_clean += 1;
        }
        for &bug in BUG_IDS.iter() {
            if merge_fast(&test_case, bug) != want {
                *found.get_mut(&bug).unwrap() += 1;
                let replace = match smallest.get(&bug) {
                    None => true,
                    Some(best) => test_case.len() < best.len(),
                };
                if replace {
                    smallest.insert(bug, test_case.clone());
                }
            }
        }
    }

    let mut hand_caught: BTreeSet<i32> = BTreeSet::new();
    for test_case in &hand_picked {
        let want = merge_by_brute_force(test_case);
        for &bug in BUG_IDS.iter() {
            if merge_fast(test_case, bug) != want {
                hand_caught.insert(bug);
            }
        }
    }

    println!();
    println!("over {} random inputs of at most 4 intervals:", trials);
    println!("  {:<30} {:>6}", "the correct sweep agreed", correct_clean);
    println!();
    println!(
        "{:<22} {:>10} {:>10} {}",
        "seeded bug", "hand-picked", "random", "smallest case found"
    );
    for b in 0..4 {
        let bug = BUG_IDS[b];
        let shown = match smallest.get(&bug) {
            None => "-".to_string(),
            Some(best) => {
                let mut copy = best.clone();
                copy.sort();
                show(&copy)
            }
        };
        println!(
            "{:<22} {:>10} {:>10} {}",
            BUG_NAMES[b],
            if hand_caught.contains(&bug) { "caught" } else { "missed" },
            found[&bug],
            shown
        );
    }

    println!();
    println!(
        "The correct sweep agreed with the brute force on all {} inputs, which",
        correct_clean
    );
    println!("is what makes the rest of the table trustworthy: the oracle and the");
    println!("fast version really do answer the same question.");
    println!();
    println!("The four hand-picked tests are the ones people write -- nothing, one");
    println!("thing, the example from the statement, and two that do not touch. They");
    println!("caught {} of the 4 seeded bugs.", hand_caught.len());
    println!();
    println!("Random inputs caught all four, and note the last column: every");
    println!("counterexample it found is tiny. These are not exotic inputs. They are");
    println!("the two-interval cases nobody thinks to write down, and they are found");
    println!("in a few hundred milliseconds by a loop that compares two functions.");
    println!();
    println!("That is the argument for the brute force, and it is a stronger one than");
    println!("\\"get something on the board\\". Without it you have no oracle, so the");
    println!("only tests you can write are ones where you worked out the answer by");
    println!("hand -- which means the only cases you test are the ones you already");
    println!("thought of, which are exactly the ones you did not get wrong.");
}
`,
            },
            {
              lang: "go",
              code: `// The brute force is not a warm-up. It is the oracle.
//
// "Write the brute force first" is usually justified as a way to get something
// on the board. The stronger reason is that it is an obviously-correct
// implementation you can test the fast one against on random inputs -- and
// random inputs find bugs that hand-picked examples do not.
//
// Below: merging overlapping intervals. One brute force that repeatedly merges
// any overlapping pair until none are left, one fast sweep, and four seeded
// bugs of the kind people actually write. Then two ways of testing, scored
// against each other.
package main

import (
	"fmt"
	"sort"
	"strings"
)

// Interval is a closed span.
type Interval struct {
	Start, End int
}

func sortIntervals(xs []Interval) {
	sort.Slice(xs, func(i, j int) bool {
		if xs[i].Start != xs[j].Start {
			return xs[i].Start < xs[j].Start
		}
		return xs[i].End < xs[j].End
	})
}

// mergeByBruteForce keeps merging any two that overlap, until no two do.
// Obviously correct.
func mergeByBruteForce(intervals []Interval) []Interval {
	out := append([]Interval{}, intervals...)
	merged := true
	for merged {
		merged = false
		for i := 0; i < len(out) && !merged; i++ {
			for j := i + 1; j < len(out); j++ {
				if out[i].Start <= out[j].End && out[j].Start <= out[i].End {
					if out[j].Start < out[i].Start {
						out[i].Start = out[j].Start
					}
					if out[j].End > out[i].End {
						out[i].End = out[j].End
					}
					out = append(out[:j], out[j+1:]...)
					merged = true
					break
				}
			}
		}
	}
	sortIntervals(out)
	return out
}

// mergeFast sorts by start and sweeps. bug selects one of four plausible
// mistakes.
//
//	1  overlap tested with > instead of >=, so touching intervals stay apart
//	2  the merged end is the new one rather than the larger of the two
//	3  the sort is missing
//	4  the last interval is never appended
func mergeFast(intervals []Interval, bug int) []Interval {
	order := append([]Interval{}, intervals...)
	if bug != 3 {
		sortIntervals(order)
	}
	var out []Interval
	for _, iv := range order {
		overlaps := false
		if len(out) > 0 {
			last := out[len(out)-1]
			if bug == 1 {
				overlaps = iv.Start < last.End
			} else {
				overlaps = iv.Start <= last.End
			}
		}
		if overlaps {
			last := &out[len(out)-1]
			if bug == 2 {
				last.End = iv.End
			} else if iv.End > last.End {
				last.End = iv.End
			}
		} else {
			out = append(out, iv)
		}
	}
	if bug == 4 && len(out) > 0 {
		out = out[:len(out)-1]
	}
	sortIntervals(out)
	return out
}

func same(a, b []Interval) bool {
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

func show(intervals []Interval) string {
	if len(intervals) == 0 {
		return "[]"
	}
	cells := make([]string, len(intervals))
	for i, iv := range intervals {
		cells[i] = fmt.Sprintf("%d-%d", iv.Start, iv.End)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

var bugIDs = []int{1, 2, 3, 4}
var bugNames = []string{"touching not merged", "end not maxed", "no sort", "last one dropped"}

// The same linear congruential generator in every language, so the random
// inputs below are the same inputs whichever translation is run.
var seed int64 = 33033

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func randomCase() []Interval {
	n := randBelow(5)
	var out []Interval
	for i := 0; i < n; i++ {
		start := randBelow(10)
		out = append(out, Interval{start, start + randBelow(4)})
	}
	return out
}

func main() {
	// The tests a person actually writes: nothing, one thing, the example from
	// the statement, and two that do not touch.
	handPicked := [][]Interval{
		{},
		{{1, 3}},
		{{1, 3}, {2, 6}, {8, 10}},
		{{1, 4}, {6, 8}},
	}

	fmt.Printf("%-30s %s\\n", "hand-picked test", "which bugs it catches")
	for _, testCase := range handPicked {
		want := mergeByBruteForce(testCase)
		var caught []string
		for b, bug := range bugIDs {
			if !same(mergeFast(testCase, bug), want) {
				caught = append(caught, bugNames[b])
			}
		}
		text := "none"
		if len(caught) > 0 {
			text = strings.Join(caught, ", ")
		}
		fmt.Printf("%-30s %s\\n", show(testCase), text)
	}

	trials := 3000
	found := map[int]int{}
	smallest := map[int][]Interval{}
	hasSmallest := map[int]bool{}
	for _, bug := range bugIDs {
		found[bug] = 0
	}
	correctClean := 0
	for t := 0; t < trials; t++ {
		testCase := randomCase()
		want := mergeByBruteForce(testCase)
		if same(mergeFast(testCase, 0), want) {
			correctClean++
		}
		for _, bug := range bugIDs {
			if !same(mergeFast(testCase, bug), want) {
				found[bug]++
				if !hasSmallest[bug] || len(testCase) < len(smallest[bug]) {
					smallest[bug] = testCase
					hasSmallest[bug] = true
				}
			}
		}
	}

	handCaught := map[int]bool{}
	for _, testCase := range handPicked {
		want := mergeByBruteForce(testCase)
		for _, bug := range bugIDs {
			if !same(mergeFast(testCase, bug), want) {
				handCaught[bug] = true
			}
		}
	}

	fmt.Println()
	fmt.Printf("over %d random inputs of at most 4 intervals:\\n", trials)
	fmt.Printf("  %-30s %6d\\n", "the correct sweep agreed", correctClean)
	fmt.Println()
	fmt.Printf("%-22s %10s %10s %s\\n", "seeded bug", "hand-picked", "random", "smallest case found")
	for b, bug := range bugIDs {
		shown := "-"
		if hasSmallest[bug] {
			copied := append([]Interval{}, smallest[bug]...)
			sortIntervals(copied)
			shown = show(copied)
		}
		verdict := "missed"
		if handCaught[bug] {
			verdict = "caught"
		}
		fmt.Printf("%-22s %10s %10d %s\\n", bugNames[b], verdict, found[bug], shown)
	}

	fmt.Println()
	fmt.Printf("The correct sweep agreed with the brute force on all %d inputs, which\\n", correctClean)
	fmt.Println("is what makes the rest of the table trustworthy: the oracle and the")
	fmt.Println("fast version really do answer the same question.")
	fmt.Println()
	fmt.Println("The four hand-picked tests are the ones people write -- nothing, one")
	fmt.Println("thing, the example from the statement, and two that do not touch. They")
	fmt.Printf("caught %d of the %d seeded bugs.\\n", len(handCaught), len(bugIDs))
	fmt.Println()
	fmt.Println("Random inputs caught all four, and note the last column: every")
	fmt.Println("counterexample it found is tiny. These are not exotic inputs. They are")
	fmt.Println("the two-interval cases nobody thinks to write down, and they are found")
	fmt.Println("in a few hundred milliseconds by a loop that compares two functions.")
	fmt.Println()
	fmt.Println("That is the argument for the brute force, and it is a stronger one than")
	fmt.Println("\\"get something on the board\\". Without it you have no oracle, so the")
	fmt.Println("only tests you can write are ones where you worked out the answer by")
	fmt.Println("hand -- which means the only cases you test are the ones you already")
	fmt.Println("thought of, which are exactly the ones you did not get wrong.")
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "why-hand-picked-lose",
      heading: "Why the hand-picked tests lose",
      body: [
        "Not because they are bad tests. The four are exactly the ones a careful person writes: empty, singleton, the worked example, and a clean non-overlapping pair.",
        "They lose because you choose them, and you choose them from the same model of the problem that produced the bug. If you thought touching intervals should be merged, you would have written the `>=`; since you wrote `>`, you also do not write `[6-9, 9-9]` as a test.",
        "**Hand-picked tests can only cover the cases you already thought of, which are exactly the cases you did not get wrong.** That is the structural problem, and no amount of care fixes it, because care is the thing that is already failing.",
        "A brute force breaks the loop, because now the test *answers* come from somewhere other than your head. You do not have to know that `[6-9, 9-9]` is interesting. You just have to generate it.",
      ],
      pitfalls: [
        {
          title: "Treating the brute force as the fallback answer",
          body: "It is not there so you have something if you fail. It is there so you can check the thing you are about to write. Saying that out loud -- \"I want this mostly so I have something to check against\" -- reframes it from giving up to being rigorous.",
        },
        {
          title: "Writing the brute force out in full when you do not need to",
          body: "Usually one sentence and a complexity is enough: \"brute force is check every pair, O(n^2)\". Write it only when you are going to run it, or when the interviewer asks.",
        },
        {
          title: "Skipping it because the fast solution is obvious to you",
          body: "The four seeded bugs above are all in a solution that was obvious to whoever wrote it. Obvious and correct are different properties, and the second one is the one being assessed.",
        },
      ],
    },
    {
      id: "in-the-room",
      heading: "What this looks like in the room",
      body: [
        "You will not usually run three thousand random inputs in an interview. The move is smaller and it survives the time limit.",
        "**Say it in one sentence with a complexity.** \"The brute force is: repeatedly merge any two that overlap until none do. That is `O(n^2)` at least, probably worse, but it is clearly right.\" Fifteen seconds, and you now have a stated baseline that the optimisation is measured against.",
        "**Keep it as the thing you check against.** When you finish the fast version and trace an example, trace it against what the brute force would say, not against what you meant. Those are different, and the difference is where the bug lives.",
        "**And when you do have a machine and time \u2014 use it.** Some interviews are take-homes or pair-programming sessions with a real editor. In those, twenty lines of random testing against a brute force is the highest-value code you can write, and the table above is the reason. It found four bugs whose smallest witnesses were two intervals long, in under a second.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why state a brute force before optimising?",
      answer:
        "The usual reason given is partial credit, and that is the weak one. The real reason is that the brute force is the only oracle I will have -- the version whose correctness is visible by inspection, so I can check the fast one against it on inputs I did not have to reason out by hand. I measured this on merging intervals with four seeded bugs: four hand-picked tests, the ones people actually write, caught one of the four. Random inputs checked against the brute force caught all four, and every counterexample was one or two intervals long. Hand-picked tests only cover the cases I already thought of, which are exactly the ones I did not get wrong.",
    },
    {
      question: "How much time should the brute force take?",
      answer:
        "Usually one sentence: 'brute force is repeatedly merge any overlapping pair, that is at least quadratic but it is clearly right'. Fifteen seconds, and now the optimisation has a stated baseline. I would only write it out if I am going to run it against the fast version, or if the interviewer asks for it. In a take-home or a pairing session where I have a real editor, I would absolutely write it and twenty lines of random comparison, because that is the highest-value code in the file -- it found bugs in under a second that I would not have written a test for.",
    },
  ],
  takeaways: [
    "The brute force is an oracle, not a fallback",
    "Four hand-picked tests caught 1 of 4 seeded bugs; random-vs-brute-force caught 4 of 4",
    "The counterexamples were tiny: `[6-9, 9-9]`, `[8-10, 9-9]`, `[8-10, 9-11]`, `[0-2]`",
    "Hand-picked tests only cover cases you thought of — the ones you did not get wrong",
    "Confirm the oracle agrees with the fast version before trusting the comparison",
    "In the room: one sentence and a complexity, then check the fast version against it",
    "With an editor and time, random comparison testing is the highest-value code you can write",
  ],
};
