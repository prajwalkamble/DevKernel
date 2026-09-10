import type { Lesson } from "@/content/types";

export const windowOrPrefixMapLesson: Lesson = {
  id: "dsa-pattern-atlas-window-or-prefix-map",
  slug: "window-or-prefix-map",
  moduleSlug: "pattern-atlas-drills",
  title: "Window or Prefix Map: Telling Near-Identical Statements Apart",
  summary:
    "Two statements that differ by two words and want different machinery. The property that separates them is not in the question — it is in the constraints, and the measurement shows what picking wrong costs.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "State the precondition a sliding window silently assumes",
    "Say why a prefix-sum map does not need that precondition",
    "Find the line in the constraints that decides between them",
    "Recognise the same distinction in its other disguises",
  ],
  sections: [
    {
      id: "the-two-statements",
      heading: "The two statements",
      body: [
        "\"Count the subarrays whose sum is exactly `k`.\" \"Find the longest subarray whose sum is at most `k`.\" Both say subarray, both say sum, both are one line long, and they want different techniques.",
        "A **sliding window** grows the right end and shrinks the left when the window is too big. It is one pass and no extra memory, and it is the cheaper answer whenever it applies.",
        "A **prefix-sum map** uses the fact that every subarray sum is a difference of two prefix sums, so it counts how many earlier prefixes are exactly `k` less than the current one. One pass and a hash map, and it needs nothing from the values.",
        "The property that decides between them is not stated in the question at all. It is in the constraints: **can the values be negative?**",
      ],
    },
    {
      id: "what-the-window-assumes",
      heading: "What the window silently assumes",
      body: [
        "The window's rule is \"shrink from the left while the sum is too big\". For that rule to be correct, moving the left end must only ever *lower* the sum and moving the right end must only ever *raise* it. That is monotonicity, and non-negative values are what guarantee it.",
        "Allow one negative value and the guarantee is gone. A window that is currently too big might become small enough by getting *bigger* \u2014 and the shrink rule will never look there, because it only ever shrinks. Nothing crashes. The answer is just wrong.",
        "The measurement in the example puts numbers on it. With values from 0 to 3 both methods are exact on all 3,000 random arrays. With values from -3 to 3 the window is wrong on 1,193 of them and the prefix map is still right on all 3,000. The window's errors go in both directions \u2014 703 too high and 490 too low \u2014 which is worth noting, because a one-sided error is at least detectable by a sanity check and this one is not.",
        "The second question behaves the same way. \"Longest subarray with sum at most `k`\" is a genuine window problem on non-negative values, right on all 3,000, and stops being one the moment negatives are allowed: right on 2,559.",
      ],
      examples: [
        {
          id: "window-or-prefix-map",
          title: "The same two questions, with and without negative values",
          lang: "python",
          code: `# Two patterns that look identical in the statement, and the word that splits
# them.
#
# "Count the subarrays whose sum is exactly k" and "find the longest subarray
# whose sum is at most k" are the same sentence with two words changed, and
# they want different machinery:
#
#   sliding window        -- grow the right end, shrink the left when the
#                            window is too big. Needs the sum to move
#                            monotonically, which means non-negative values.
#   prefix sums in a map  -- every subarray sum is a difference of two prefix
#                            sums, so count how many earlier prefixes are
#                            exactly k less than this one. No monotonicity
#                            needed at all.
#
# The tell is not the word "subarray", which both share. It is whether the
# values can be negative -- and the measurement below is what happens when you
# get that wrong.


def at_most(values, limit):
    """How many subarrays sum to at most \`limit\`, by sliding a window.

    Every time the right end moves, every window ending there that starts at
    or after \`left\` is small enough, and that is right - left + 1 of them.
    The rule only works because shrinking from the left can only lower the
    sum, which is where the non-negative requirement lives.
    """
    if limit < 0:
        return 0
    total = 0
    found = 0
    left = 0
    for right in range(len(values)):
        total += values[right]
        while left <= right and total > limit:
            total -= values[left]
            left += 1
        found += right - left + 1
    return found


def count_by_window(values, k):
    """Exactly k, as the difference of two at-most counts. One pass each."""
    return at_most(values, k) - at_most(values, k - 1)


def count_by_prefix(values, k):
    """Every subarray sum is a difference of prefixes, so count the differences."""
    seen = {0: 1}
    running = 0
    found = 0
    for x in values:
        running += x
        found += seen.get(running - k, 0)
        seen[running] = seen.get(running, 0) + 1
    return found


def count_by_trying(values, k):
    """Every subarray, added up. The definition."""
    found = 0
    for i in range(len(values)):
        total = 0
        for j in range(i, len(values)):
            total += values[j]
            if total == k:
                found += 1
    return found


def longest_by_window(values, k):
    """The other question: the longest subarray whose sum stays at or under k."""
    total = 0
    best = 0
    left = 0
    for right in range(len(values)):
        total += values[right]
        while left <= right and total > k:
            total -= values[left]
            left += 1
        if right - left + 1 > best:
            best = right - left + 1
    return best


def longest_by_trying(values, k):
    best = 0
    for i in range(len(values)):
        total = 0
        for j in range(i, len(values)):
            total += values[j]
            if total <= k and j - i + 1 > best:
                best = j - i + 1
    return best


def show(values):
    return "[" + ", ".join(str(x) for x in values) + "]"


CASES = [
    ([1, 2, 3, 1, 1], 3),
    ([1, -1, 1, -1, 1], 1),
    ([2, 0, 2, 0], 2),
]

print("%-26s %-4s %-8s %-8s %s" % ("values", "k", "window", "prefix", "truth"))
for values, k in CASES:
    print("%-26s %-4d %-8d %-8d %d" % (
        show(values), k, count_by_window(values, k), count_by_prefix(values, k),
        count_by_trying(values, k)))

# The same linear congruential generator in every language, so the random
# arrays below are the same arrays whichever translation is run.
seed = 20260910


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


trials = 3000
pos_window = pos_prefix = 0
neg_window = neg_prefix = 0
window_high = window_low = 0
long_pos = long_neg = 0
for _ in range(trials):
    n = 1 + rand(8)
    k = rand(7)
    non_negative = [rand(4) for _ in range(n)]
    mixed = [rand(7) - 3 for _ in range(n)]

    want = count_by_trying(non_negative, k)
    pos_window += count_by_window(non_negative, k) == want
    pos_prefix += count_by_prefix(non_negative, k) == want

    want = count_by_trying(mixed, k)
    got = count_by_window(mixed, k)
    neg_window += got == want
    neg_prefix += count_by_prefix(mixed, k) == want
    if got > want:
        window_high += 1
    if got < want:
        window_low += 1

    long_pos += longest_by_window(non_negative, k) == longest_by_trying(non_negative, k)
    long_neg += longest_by_window(mixed, k) == longest_by_trying(mixed, k)

print()
print("over %d random arrays of at most 8 values:" % trials)
print("  %-44s %6d" % ("counting, values 0..3: window matched", pos_window))
print("  %-44s %6d" % ("counting, values 0..3: prefix map matched", pos_prefix))
print("  %-44s %6d" % ("counting, values -3..3: window matched", neg_window))
print("  %-44s %6d" % ("counting, values -3..3: prefix map matched", neg_prefix))
print("  %-44s %6d" % ("times the window counted too many", window_high))
print("  %-44s %6d" % ("times it counted too few", window_low))
print()
print("  %-44s %6d" % ("longest at most k, values 0..3: window", long_pos))
print("  %-44s %6d" % ("longest at most k, values -3..3: window", long_neg))

print()
print("With non-negative values both methods are exact and the window is the")
print("cheaper one -- one pass, no map. Allow a negative and the window loses")
print("%d of %d arrays while the prefix map keeps all %d." % (
    trials - neg_window, trials, neg_prefix))
print()
print("The reason is one sentence. A window only works when extending the")
print("right end can only increase the sum and moving the left end can only")
print("decrease it, because that is what makes \\"shrink while too big\\" a")
print("correct rule. A negative value breaks the monotonicity, and then a")
print("window that is too big might have become small enough by getting")
print("bigger -- which the shrink rule will never discover.")
print()
print("The last two counters make the same point about the other question.")
print("\\"Longest subarray with sum at most k\\" is a window problem on")
print("non-negative values, right on all %d, and not one on mixed values," % long_pos)
print("right on %d." % long_neg)
print()
print("So the recognition rule is not \\"subarray means window\\". It is: a window")
print("needs a quantity that moves one way as the window grows. Check for that")
print("in the constraints -- the line that says whether values can be negative")
print("is the line that picks the pattern.")
`,
          output: `values                     k    window   prefix   truth
[1, 2, 3, 1, 1]            3    2        2        2
[1, -1, 1, -1, 1]          1    5        6        6
[2, 0, 2, 0]               2    6        6        6

over 3000 random arrays of at most 8 values:
  counting, values 0..3: window matched          3000
  counting, values 0..3: prefix map matched      3000
  counting, values -3..3: window matched         1807
  counting, values -3..3: prefix map matched     3000
  times the window counted too many               703
  times it counted too few                        490

  longest at most k, values 0..3: window         3000
  longest at most k, values -3..3: window        2559

With non-negative values both methods are exact and the window is the
cheaper one -- one pass, no map. Allow a negative and the window loses
1193 of 3000 arrays while the prefix map keeps all 3000.

The reason is one sentence. A window only works when extending the
right end can only increase the sum and moving the left end can only
decrease it, because that is what makes "shrink while too big" a
correct rule. A negative value breaks the monotonicity, and then a
window that is too big might have become small enough by getting
bigger -- which the shrink rule will never discover.

The last two counters make the same point about the other question.
"Longest subarray with sum at most k" is a window problem on
non-negative values, right on all 3000, and not one on mixed values,
right on 2559.

So the recognition rule is not "subarray means window". It is: a window
needs a quantity that moves one way as the window grows. Check for that
in the constraints -- the line that says whether values can be negative
is the line that picks the pattern.`,
          explanation:
            "Both techniques scored against an exhaustive check over every subarray, first on non-negative values and then on mixed ones. The demo's second row is the smallest disagreement.",
          alternates: [
            {
              lang: "javascript",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//   sliding window        -- grow the right end, shrink the left when the
//                            window is too big. Needs the sum to move
//                            monotonically, which means non-negative values.
//   prefix sums in a map  -- every subarray sum is a difference of two prefix
//                            sums, so count how many earlier prefixes are
//                            exactly k less than this one. No monotonicity
//                            needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.

// How many subarrays sum to at most \`limit\`, by sliding a window.
//
// Every time the right end moves, every window ending there that starts at
// or after \`left\` is small enough, and that is right - left + 1 of them.
// The rule only works because shrinking from the left can only lower the
// sum, which is where the non-negative requirement lives.
function atMost(values, limit) {
  if (limit < 0) return 0;
  let total = 0;
  let found = 0;
  let left = 0;
  for (let right = 0; right < values.length; right += 1) {
    total += values[right];
    while (left <= right && total > limit) {
      total -= values[left];
      left += 1;
    }
    found += right - left + 1;
  }
  return found;
}

// Exactly k, as the difference of two at-most counts. One pass each.
function countByWindow(values, k) {
  return atMost(values, k) - atMost(values, k - 1);
}

// Every subarray sum is a difference of prefixes, so count the differences.
function countByPrefix(values, k) {
  const seen = new Map([[0, 1]]);
  let running = 0;
  let found = 0;
  for (const x of values) {
    running += x;
    found += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return found;
}

// Every subarray, added up. The definition.
function countByTrying(values, k) {
  let found = 0;
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    for (let j = i; j < values.length; j += 1) {
      total += values[j];
      if (total === k) found += 1;
    }
  }
  return found;
}

// The other question: the longest subarray whose sum stays at or under k.
function longestByWindow(values, k) {
  let total = 0;
  let best = 0;
  let left = 0;
  for (let right = 0; right < values.length; right += 1) {
    total += values[right];
    while (left <= right && total > k) {
      total -= values[left];
      left += 1;
    }
    if (right - left + 1 > best) best = right - left + 1;
  }
  return best;
}

function longestByTrying(values, k) {
  let best = 0;
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    for (let j = i; j < values.length; j += 1) {
      total += values[j];
      if (total <= k && j - i + 1 > best) best = j - i + 1;
    }
  }
  return best;
}

function show(values) {
  return "[" + values.join(", ") + "]";
}

const CASES = [
  [[1, 2, 3, 1, 1], 3],
  [[1, -1, 1, -1, 1], 1],
  [[2, 0, 2, 0], 2],
];

console.log(
  "values".padEnd(26) + " " + "k".padEnd(4) + " " + "window".padEnd(8) + " " +
  "prefix".padEnd(8) + " " + "truth",
);
for (const [values, k] of CASES) {
  console.log(
    show(values).padEnd(26) + " " + String(k).padEnd(4) + " " +
    String(countByWindow(values, k)).padEnd(8) + " " +
    String(countByPrefix(values, k)).padEnd(8) + " " + countByTrying(values, k),
  );
}

// The same linear congruential generator in every language, so the random
// arrays below are the same arrays whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 20260910n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let posWindow = 0;
let posPrefix = 0;
let negWindow = 0;
let negPrefix = 0;
let windowHigh = 0;
let windowLow = 0;
let longPos = 0;
let longNeg = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 1 + rand(8);
  const k = rand(7);
  const nonNegative = [];
  for (let i = 0; i < n; i += 1) nonNegative.push(rand(4));
  const mixed = [];
  for (let i = 0; i < n; i += 1) mixed.push(rand(7) - 3);

  let want = countByTrying(nonNegative, k);
  if (countByWindow(nonNegative, k) === want) posWindow += 1;
  if (countByPrefix(nonNegative, k) === want) posPrefix += 1;

  want = countByTrying(mixed, k);
  const got = countByWindow(mixed, k);
  if (got === want) negWindow += 1;
  if (countByPrefix(mixed, k) === want) negPrefix += 1;
  if (got > want) windowHigh += 1;
  if (got < want) windowLow += 1;

  if (longestByWindow(nonNegative, k) === longestByTrying(nonNegative, k)) longPos += 1;
  if (longestByWindow(mixed, k) === longestByTrying(mixed, k)) longNeg += 1;
}

const row = (text, value) => "  " + text.padEnd(44) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random arrays of at most 8 values:\`);
console.log(row("counting, values 0..3: window matched", posWindow));
console.log(row("counting, values 0..3: prefix map matched", posPrefix));
console.log(row("counting, values -3..3: window matched", negWindow));
console.log(row("counting, values -3..3: prefix map matched", negPrefix));
console.log(row("times the window counted too many", windowHigh));
console.log(row("times it counted too few", windowLow));
console.log();
console.log(row("longest at most k, values 0..3: window", longPos));
console.log(row("longest at most k, values -3..3: window", longNeg));

console.log();
console.log("With non-negative values both methods are exact and the window is the");
console.log("cheaper one -- one pass, no map. Allow a negative and the window loses");
console.log(\`\${trials - negWindow} of \${trials} arrays while the prefix map keeps all \${negPrefix}.\`);
console.log();
console.log("The reason is one sentence. A window only works when extending the");
console.log("right end can only increase the sum and moving the left end can only");
console.log('decrease it, because that is what makes "shrink while too big" a');
console.log("correct rule. A negative value breaks the monotonicity, and then a");
console.log("window that is too big might have become small enough by getting");
console.log("bigger -- which the shrink rule will never discover.");
console.log();
console.log("The last two counters make the same point about the other question.");
console.log('"Longest subarray with sum at most k" is a window problem on');
console.log(\`non-negative values, right on all \${longPos}, and not one on mixed values,\`);
console.log(\`right on \${longNeg}.\`);
console.log();
console.log('So the recognition rule is not "subarray means window". It is: a window');
console.log("needs a quantity that moves one way as the window grows. Check for that");
console.log("in the constraints -- the line that says whether values can be negative");
console.log("is the line that picks the pattern.");
`,
            },
            {
              lang: "typescript",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//   sliding window        -- grow the right end, shrink the left when the
//                            window is too big. Needs the sum to move
//                            monotonically, which means non-negative values.
//   prefix sums in a map  -- every subarray sum is a difference of two prefix
//                            sums, so count how many earlier prefixes are
//                            exactly k less than this one. No monotonicity
//                            needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.

// How many subarrays sum to at most \`limit\`, by sliding a window.
//
// Every time the right end moves, every window ending there that starts at
// or after \`left\` is small enough, and that is right - left + 1 of them.
// The rule only works because shrinking from the left can only lower the
// sum, which is where the non-negative requirement lives.
function atMost(values: number[], limit: number): number {
  if (limit < 0) return 0;
  let total = 0;
  let found = 0;
  let left = 0;
  for (let right = 0; right < values.length; right += 1) {
    total += values[right];
    while (left <= right && total > limit) {
      total -= values[left];
      left += 1;
    }
    found += right - left + 1;
  }
  return found;
}

// Exactly k, as the difference of two at-most counts. One pass each.
function countByWindow(values: number[], k: number): number {
  return atMost(values, k) - atMost(values, k - 1);
}

// Every subarray sum is a difference of prefixes, so count the differences.
function countByPrefix(values: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let running = 0;
  let found = 0;
  for (const x of values) {
    running += x;
    found += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return found;
}

// Every subarray, added up. The definition.
function countByTrying(values: number[], k: number): number {
  let found = 0;
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    for (let j = i; j < values.length; j += 1) {
      total += values[j];
      if (total === k) found += 1;
    }
  }
  return found;
}

// The other question: the longest subarray whose sum stays at or under k.
function longestByWindow(values: number[], k: number): number {
  let total = 0;
  let best = 0;
  let left = 0;
  for (let right = 0; right < values.length; right += 1) {
    total += values[right];
    while (left <= right && total > k) {
      total -= values[left];
      left += 1;
    }
    if (right - left + 1 > best) best = right - left + 1;
  }
  return best;
}

function longestByTrying(values: number[], k: number): number {
  let best = 0;
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    for (let j = i; j < values.length; j += 1) {
      total += values[j];
      if (total <= k && j - i + 1 > best) best = j - i + 1;
    }
  }
  return best;
}

function show(values: number[]): string {
  return "[" + values.join(", ") + "]";
}

const CASES: [number[], number][] = [
  [[1, 2, 3, 1, 1], 3],
  [[1, -1, 1, -1, 1], 1],
  [[2, 0, 2, 0], 2],
];

console.log(
  "values".padEnd(26) + " " + "k".padEnd(4) + " " + "window".padEnd(8) + " " +
  "prefix".padEnd(8) + " " + "truth",
);
for (const [values, k] of CASES) {
  console.log(
    show(values).padEnd(26) + " " + String(k).padEnd(4) + " " +
    String(countByWindow(values, k)).padEnd(8) + " " +
    String(countByPrefix(values, k)).padEnd(8) + " " + countByTrying(values, k),
  );
}

// The same linear congruential generator in every language, so the random
// arrays below are the same arrays whichever translation is run. JavaScript
// needs BigInt here because the multiply runs past 2^53.
let seed = 20260910n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const trials = 3000;
let posWindow = 0;
let posPrefix = 0;
let negWindow = 0;
let negPrefix = 0;
let windowHigh = 0;
let windowLow = 0;
let longPos = 0;
let longNeg = 0;
for (let t = 0; t < trials; t += 1) {
  const n = 1 + rand(8);
  const k = rand(7);
  const nonNegative: number[] = [];
  for (let i = 0; i < n; i += 1) nonNegative.push(rand(4));
  const mixed: number[] = [];
  for (let i = 0; i < n; i += 1) mixed.push(rand(7) - 3);

  let want = countByTrying(nonNegative, k);
  if (countByWindow(nonNegative, k) === want) posWindow += 1;
  if (countByPrefix(nonNegative, k) === want) posPrefix += 1;

  want = countByTrying(mixed, k);
  const got = countByWindow(mixed, k);
  if (got === want) negWindow += 1;
  if (countByPrefix(mixed, k) === want) negPrefix += 1;
  if (got > want) windowHigh += 1;
  if (got < want) windowLow += 1;

  if (longestByWindow(nonNegative, k) === longestByTrying(nonNegative, k)) longPos += 1;
  if (longestByWindow(mixed, k) === longestByTrying(mixed, k)) longNeg += 1;
}

const row = (text: string, value: number): string => "  " + text.padEnd(44) + " " + String(value).padStart(6);

console.log();
console.log(\`over \${trials} random arrays of at most 8 values:\`);
console.log(row("counting, values 0..3: window matched", posWindow));
console.log(row("counting, values 0..3: prefix map matched", posPrefix));
console.log(row("counting, values -3..3: window matched", negWindow));
console.log(row("counting, values -3..3: prefix map matched", negPrefix));
console.log(row("times the window counted too many", windowHigh));
console.log(row("times it counted too few", windowLow));
console.log();
console.log(row("longest at most k, values 0..3: window", longPos));
console.log(row("longest at most k, values -3..3: window", longNeg));

console.log();
console.log("With non-negative values both methods are exact and the window is the");
console.log("cheaper one -- one pass, no map. Allow a negative and the window loses");
console.log(\`\${trials - negWindow} of \${trials} arrays while the prefix map keeps all \${negPrefix}.\`);
console.log();
console.log("The reason is one sentence. A window only works when extending the");
console.log("right end can only increase the sum and moving the left end can only");
console.log('decrease it, because that is what makes "shrink while too big" a');
console.log("correct rule. A negative value breaks the monotonicity, and then a");
console.log("window that is too big might have become small enough by getting");
console.log("bigger -- which the shrink rule will never discover.");
console.log();
console.log("The last two counters make the same point about the other question.");
console.log('"Longest subarray with sum at most k" is a window problem on');
console.log(\`non-negative values, right on all \${longPos}, and not one on mixed values,\`);
console.log(\`right on \${longNeg}.\`);
console.log();
console.log('So the recognition rule is not "subarray means window". It is: a window');
console.log("needs a quantity that moves one way as the window grows. Check for that");
console.log("in the constraints -- the line that says whether values can be negative");
console.log("is the line that picks the pattern.");
`,
            },
            {
              lang: "java",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//   sliding window        -- grow the right end, shrink the left when the
//                            window is too big. Needs the sum to move
//                            monotonically, which means non-negative values.
//   prefix sums in a map  -- every subarray sum is a difference of two prefix
//                            sums, so count how many earlier prefixes are
//                            exactly k less than this one. No monotonicity
//                            needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.
import java.util.HashMap;
import java.util.Map;

public class Main {
    /**
     * How many subarrays sum to at most {@code limit}, by sliding a window.
     *
     * <p>Every time the right end moves, every window ending there that starts
     * at or after {@code left} is small enough, and that is right - left + 1 of
     * them. The rule only works because shrinking from the left can only lower
     * the sum, which is where the non-negative requirement lives.
     */
    static int atMost(int[] values, int limit) {
        if (limit < 0) return 0;
        int total = 0, found = 0, left = 0;
        for (int right = 0; right < values.length; right++) {
            total += values[right];
            while (left <= right && total > limit) {
                total -= values[left];
                left++;
            }
            found += right - left + 1;
        }
        return found;
    }

    /** Exactly k, as the difference of two at-most counts. One pass each. */
    static int countByWindow(int[] values, int k) {
        return atMost(values, k) - atMost(values, k - 1);
    }

    /** Every subarray sum is a difference of prefixes, so count the differences. */
    static int countByPrefix(int[] values, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int running = 0, found = 0;
        for (int x : values) {
            running += x;
            found += seen.getOrDefault(running - k, 0);
            seen.put(running, seen.getOrDefault(running, 0) + 1);
        }
        return found;
    }

    /** Every subarray, added up. The definition. */
    static int countByTrying(int[] values, int k) {
        int found = 0;
        for (int i = 0; i < values.length; i++) {
            int total = 0;
            for (int j = i; j < values.length; j++) {
                total += values[j];
                if (total == k) found++;
            }
        }
        return found;
    }

    /** The other question: the longest subarray whose sum stays at or under k. */
    static int longestByWindow(int[] values, int k) {
        int total = 0, best = 0, left = 0;
        for (int right = 0; right < values.length; right++) {
            total += values[right];
            while (left <= right && total > k) {
                total -= values[left];
                left++;
            }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }

    static int longestByTrying(int[] values, int k) {
        int best = 0;
        for (int i = 0; i < values.length; i++) {
            int total = 0;
            for (int j = i; j < values.length; j++) {
                total += values[j];
                if (total <= k && j - i + 1 > best) best = j - i + 1;
            }
        }
        return best;
    }

    static String show(int[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(values[i]);
        }
        return sb.append("]").toString();
    }

    // The same linear congruential generator in every language, so the random
    // arrays below are the same arrays whichever translation is run.
    static long seed = 20260910L;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536L % n);
    }

    static String row(String text, int value) {
        return String.format("  %-44s %6d", text, value);
    }

    public static void main(String[] args) {
        int[][] caseValues = {{1, 2, 3, 1, 1}, {1, -1, 1, -1, 1}, {2, 0, 2, 0}};
        int[] caseK = {3, 1, 2};

        System.out.printf("%-26s %-4s %-8s %-8s %s%n",
            "values", "k", "window", "prefix", "truth");
        for (int c = 0; c < caseK.length; c++) {
            System.out.printf("%-26s %-4d %-8d %-8d %d%n", show(caseValues[c]), caseK[c],
                countByWindow(caseValues[c], caseK[c]), countByPrefix(caseValues[c], caseK[c]),
                countByTrying(caseValues[c], caseK[c]));
        }

        int trials = 3000;
        int posWindow = 0, posPrefix = 0, negWindow = 0, negPrefix = 0;
        int windowHigh = 0, windowLow = 0, longPos = 0, longNeg = 0;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rand(8);
            int k = rand(7);
            int[] nonNegative = new int[n];
            for (int i = 0; i < n; i++) nonNegative[i] = rand(4);
            int[] mixed = new int[n];
            for (int i = 0; i < n; i++) mixed[i] = rand(7) - 3;

            int want = countByTrying(nonNegative, k);
            if (countByWindow(nonNegative, k) == want) posWindow++;
            if (countByPrefix(nonNegative, k) == want) posPrefix++;

            want = countByTrying(mixed, k);
            int got = countByWindow(mixed, k);
            if (got == want) negWindow++;
            if (countByPrefix(mixed, k) == want) negPrefix++;
            if (got > want) windowHigh++;
            if (got < want) windowLow++;

            if (longestByWindow(nonNegative, k) == longestByTrying(nonNegative, k)) longPos++;
            if (longestByWindow(mixed, k) == longestByTrying(mixed, k)) longNeg++;
        }

        System.out.println();
        System.out.println("over " + trials + " random arrays of at most 8 values:");
        System.out.println(row("counting, values 0..3: window matched", posWindow));
        System.out.println(row("counting, values 0..3: prefix map matched", posPrefix));
        System.out.println(row("counting, values -3..3: window matched", negWindow));
        System.out.println(row("counting, values -3..3: prefix map matched", negPrefix));
        System.out.println(row("times the window counted too many", windowHigh));
        System.out.println(row("times it counted too few", windowLow));
        System.out.println();
        System.out.println(row("longest at most k, values 0..3: window", longPos));
        System.out.println(row("longest at most k, values -3..3: window", longNeg));

        System.out.println();
        System.out.println("With non-negative values both methods are exact and the window is the");
        System.out.println("cheaper one -- one pass, no map. Allow a negative and the window loses");
        System.out.println((trials - negWindow) + " of " + trials
            + " arrays while the prefix map keeps all " + negPrefix + ".");
        System.out.println();
        System.out.println("The reason is one sentence. A window only works when extending the");
        System.out.println("right end can only increase the sum and moving the left end can only");
        System.out.println("decrease it, because that is what makes \\"shrink while too big\\" a");
        System.out.println("correct rule. A negative value breaks the monotonicity, and then a");
        System.out.println("window that is too big might have become small enough by getting");
        System.out.println("bigger -- which the shrink rule will never discover.");
        System.out.println();
        System.out.println("The last two counters make the same point about the other question.");
        System.out.println("\\"Longest subarray with sum at most k\\" is a window problem on");
        System.out.println("non-negative values, right on all " + longPos
            + ", and not one on mixed values,");
        System.out.println("right on " + longNeg + ".");
        System.out.println();
        System.out.println("So the recognition rule is not \\"subarray means window\\". It is: a window");
        System.out.println("needs a quantity that moves one way as the window grows. Check for that");
        System.out.println("in the constraints -- the line that says whether values can be negative");
        System.out.println("is the line that picks the pattern.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//   sliding window        -- grow the right end, shrink the left when the
//                            window is too big. Needs the sum to move
//                            monotonically, which means non-negative values.
//   prefix sums in a map  -- every subarray sum is a difference of two prefix
//                            sums, so count how many earlier prefixes are
//                            exactly k less than this one. No monotonicity
//                            needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.
#include <iomanip>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

// How many subarrays sum to at most \`limit\`, by sliding a window.
//
// Every time the right end moves, every window ending there that starts at
// or after \`left\` is small enough, and that is right - left + 1 of them.
// The rule only works because shrinking from the left can only lower the
// sum, which is where the non-negative requirement lives.
int at_most(const std::vector<int>& values, int limit) {
    if (limit < 0) return 0;
    int total = 0, found = 0, left = 0;
    for (int right = 0; right < static_cast<int>(values.size()); right++) {
        total += values[right];
        while (left <= right && total > limit) {
            total -= values[left];
            left++;
        }
        found += right - left + 1;
    }
    return found;
}

// Exactly k, as the difference of two at-most counts. One pass each.
int count_by_window(const std::vector<int>& values, int k) {
    return at_most(values, k) - at_most(values, k - 1);
}

// Every subarray sum is a difference of prefixes, so count the differences.
int count_by_prefix(const std::vector<int>& values, int k) {
    std::unordered_map<int, int> seen;
    seen[0] = 1;
    int running = 0, found = 0;
    for (int x : values) {
        running += x;
        auto it = seen.find(running - k);
        if (it != seen.end()) found += it->second;
        seen[running]++;
    }
    return found;
}

// Every subarray, added up. The definition.
int count_by_trying(const std::vector<int>& values, int k) {
    int found = 0;
    for (size_t i = 0; i < values.size(); i++) {
        int total = 0;
        for (size_t j = i; j < values.size(); j++) {
            total += values[j];
            if (total == k) found++;
        }
    }
    return found;
}

// The other question: the longest subarray whose sum stays at or under k.
int longest_by_window(const std::vector<int>& values, int k) {
    int total = 0, best = 0, left = 0;
    for (int right = 0; right < static_cast<int>(values.size()); right++) {
        total += values[right];
        while (left <= right && total > k) {
            total -= values[left];
            left++;
        }
        if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
}

int longest_by_trying(const std::vector<int>& values, int k) {
    int best = 0;
    for (size_t i = 0; i < values.size(); i++) {
        int total = 0;
        for (size_t j = i; j < values.size(); j++) {
            total += values[j];
            if (total <= k && static_cast<int>(j - i + 1) > best)
                best = static_cast<int>(j - i + 1);
        }
    }
    return best;
}

std::string show(const std::vector<int>& values) {
    std::string s = "[";
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) s += ", ";
        s += std::to_string(values[i]);
    }
    return s + "]";
}

// The same linear congruential generator in every language, so the random
// arrays below are the same arrays whichever translation is run.
long long seed = 20260910;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536LL % n);
}

void row(const std::string& text, int value) {
    std::cout << "  " << std::left << std::setw(44) << text << " " << std::right
              << std::setw(6) << value << "\\n";
}

int main() {
    std::vector<std::vector<int>> case_values = {
        {1, 2, 3, 1, 1}, {1, -1, 1, -1, 1}, {2, 0, 2, 0}};
    std::vector<int> case_k = {3, 1, 2};

    std::cout << std::left << std::setw(26) << "values" << " " << std::setw(4) << "k" << " "
              << std::setw(8) << "window" << " " << std::setw(8) << "prefix" << " "
              << "truth" << "\\n";
    for (size_t c = 0; c < case_k.size(); c++) {
        std::cout << std::left << std::setw(26) << show(case_values[c]) << " " << std::setw(4)
                  << case_k[c] << " " << std::setw(8) << count_by_window(case_values[c], case_k[c])
                  << " " << std::setw(8) << count_by_prefix(case_values[c], case_k[c]) << " "
                  << count_by_trying(case_values[c], case_k[c]) << "\\n";
    }

    int trials = 3000;
    int pos_window = 0, pos_prefix = 0, neg_window = 0, neg_prefix = 0;
    int window_high = 0, window_low = 0, long_pos = 0, long_neg = 0;
    for (int t = 0; t < trials; t++) {
        int n = 1 + rand_below(8);
        int k = rand_below(7);
        std::vector<int> non_negative(n), mixed(n);
        for (int i = 0; i < n; i++) non_negative[i] = rand_below(4);
        for (int i = 0; i < n; i++) mixed[i] = rand_below(7) - 3;

        int want = count_by_trying(non_negative, k);
        if (count_by_window(non_negative, k) == want) pos_window++;
        if (count_by_prefix(non_negative, k) == want) pos_prefix++;

        want = count_by_trying(mixed, k);
        int got = count_by_window(mixed, k);
        if (got == want) neg_window++;
        if (count_by_prefix(mixed, k) == want) neg_prefix++;
        if (got > want) window_high++;
        if (got < want) window_low++;

        if (longest_by_window(non_negative, k) == longest_by_trying(non_negative, k)) long_pos++;
        if (longest_by_window(mixed, k) == longest_by_trying(mixed, k)) long_neg++;
    }

    std::cout << "\\n";
    std::cout << "over " << trials << " random arrays of at most 8 values:\\n";
    row("counting, values 0..3: window matched", pos_window);
    row("counting, values 0..3: prefix map matched", pos_prefix);
    row("counting, values -3..3: window matched", neg_window);
    row("counting, values -3..3: prefix map matched", neg_prefix);
    row("times the window counted too many", window_high);
    row("times it counted too few", window_low);
    std::cout << "\\n";
    row("longest at most k, values 0..3: window", long_pos);
    row("longest at most k, values -3..3: window", long_neg);

    std::cout << "\\n";
    std::cout << "With non-negative values both methods are exact and the window is the\\n";
    std::cout << "cheaper one -- one pass, no map. Allow a negative and the window loses\\n";
    std::cout << (trials - neg_window) << " of " << trials
              << " arrays while the prefix map keeps all " << neg_prefix << ".\\n";
    std::cout << "\\n";
    std::cout << "The reason is one sentence. A window only works when extending the\\n";
    std::cout << "right end can only increase the sum and moving the left end can only\\n";
    std::cout << "decrease it, because that is what makes \\"shrink while too big\\" a\\n";
    std::cout << "correct rule. A negative value breaks the monotonicity, and then a\\n";
    std::cout << "window that is too big might have become small enough by getting\\n";
    std::cout << "bigger -- which the shrink rule will never discover.\\n";
    std::cout << "\\n";
    std::cout << "The last two counters make the same point about the other question.\\n";
    std::cout << "\\"Longest subarray with sum at most k\\" is a window problem on\\n";
    std::cout << "non-negative values, right on all " << long_pos
              << ", and not one on mixed values,\\n";
    std::cout << "right on " << long_neg << ".\\n";
    std::cout << "\\n";
    std::cout << "So the recognition rule is not \\"subarray means window\\". It is: a window\\n";
    std::cout << "needs a quantity that moves one way as the window grows. Check for that\\n";
    std::cout << "in the constraints -- the line that says whether values can be negative\\n";
    std::cout << "is the line that picks the pattern.\\n";
    return 0;
}
`,
            },
            {
              lang: "rust",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//   sliding window        -- grow the right end, shrink the left when the
//                            window is too big. Needs the sum to move
//                            monotonically, which means non-negative values.
//   prefix sums in a map  -- every subarray sum is a difference of two prefix
//                            sums, so count how many earlier prefixes are
//                            exactly k less than this one. No monotonicity
//                            needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.
use std::collections::HashMap;

/// How many subarrays sum to at most \`limit\`, by sliding a window.
///
/// Every time the right end moves, every window ending there that starts at
/// or after \`left\` is small enough, and that is right - left + 1 of them.
/// The rule only works because shrinking from the left can only lower the
/// sum, which is where the non-negative requirement lives.
fn at_most(values: &[i64], limit: i64) -> i64 {
    if limit < 0 {
        return 0;
    }
    let (mut total, mut found, mut left) = (0i64, 0i64, 0usize);
    for right in 0..values.len() {
        total += values[right];
        while left <= right && total > limit {
            total -= values[left];
            left += 1;
        }
        found += (right + 1 - left) as i64;
    }
    found
}

/// Exactly k, as the difference of two at-most counts. One pass each.
fn count_by_window(values: &[i64], k: i64) -> i64 {
    at_most(values, k) - at_most(values, k - 1)
}

/// Every subarray sum is a difference of prefixes, so count the differences.
fn count_by_prefix(values: &[i64], k: i64) -> i64 {
    let mut seen: HashMap<i64, i64> = HashMap::new();
    seen.insert(0, 1);
    let (mut running, mut found) = (0i64, 0i64);
    for &x in values {
        running += x;
        found += *seen.get(&(running - k)).unwrap_or(&0);
        *seen.entry(running).or_insert(0) += 1;
    }
    found
}

/// Every subarray, added up. The definition.
fn count_by_trying(values: &[i64], k: i64) -> i64 {
    let mut found = 0i64;
    for i in 0..values.len() {
        let mut total = 0i64;
        for j in i..values.len() {
            total += values[j];
            if total == k {
                found += 1;
            }
        }
    }
    found
}

/// The other question: the longest subarray whose sum stays at or under k.
fn longest_by_window(values: &[i64], k: i64) -> usize {
    let (mut total, mut best, mut left) = (0i64, 0usize, 0usize);
    for right in 0..values.len() {
        total += values[right];
        while left <= right && total > k {
            total -= values[left];
            left += 1;
        }
        if right + 1 - left > best {
            best = right + 1 - left;
        }
    }
    best
}

fn longest_by_trying(values: &[i64], k: i64) -> usize {
    let mut best = 0usize;
    for i in 0..values.len() {
        let mut total = 0i64;
        for j in i..values.len() {
            total += values[j];
            if total <= k && j - i + 1 > best {
                best = j - i + 1;
            }
        }
    }
    best
}

fn show(values: &[i64]) -> String {
    let cells: Vec<String> = values.iter().map(|x| x.to_string()).collect();
    format!("[{}]", cells.join(", "))
}

/// The same linear congruential generator in every language, so the random
/// arrays below are the same arrays whichever translation is run.
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
    let case_values: Vec<Vec<i64>> = vec![
        vec![1, 2, 3, 1, 1],
        vec![1, -1, 1, -1, 1],
        vec![2, 0, 2, 0],
    ];
    let case_k: [i64; 3] = [3, 1, 2];

    println!("{:<26} {:<4} {:<8} {:<8} {}", "values", "k", "window", "prefix", "truth");
    for c in 0..case_k.len() {
        println!(
            "{:<26} {:<4} {:<8} {:<8} {}",
            show(&case_values[c]),
            case_k[c],
            count_by_window(&case_values[c], case_k[c]),
            count_by_prefix(&case_values[c], case_k[c]),
            count_by_trying(&case_values[c], case_k[c])
        );
    }

    let mut rng = Rng { seed: 20260910 };
    let trials = 3000;
    let (mut pos_window, mut pos_prefix) = (0i64, 0i64);
    let (mut neg_window, mut neg_prefix) = (0i64, 0i64);
    let (mut window_high, mut window_low) = (0i64, 0i64);
    let (mut long_pos, mut long_neg) = (0i64, 0i64);
    for _ in 0..trials {
        let n = 1 + rng.next(8) as usize;
        let k = rng.next(7);
        let non_negative: Vec<i64> = (0..n).map(|_| rng.next(4)).collect();
        let mixed: Vec<i64> = (0..n).map(|_| rng.next(7) - 3).collect();

        let want = count_by_trying(&non_negative, k);
        if count_by_window(&non_negative, k) == want {
            pos_window += 1;
        }
        if count_by_prefix(&non_negative, k) == want {
            pos_prefix += 1;
        }

        let want = count_by_trying(&mixed, k);
        let got = count_by_window(&mixed, k);
        if got == want {
            neg_window += 1;
        }
        if count_by_prefix(&mixed, k) == want {
            neg_prefix += 1;
        }
        if got > want {
            window_high += 1;
        }
        if got < want {
            window_low += 1;
        }

        if longest_by_window(&non_negative, k) == longest_by_trying(&non_negative, k) {
            long_pos += 1;
        }
        if longest_by_window(&mixed, k) == longest_by_trying(&mixed, k) {
            long_neg += 1;
        }
    }

    println!();
    println!("over {} random arrays of at most 8 values:", trials);
    row("counting, values 0..3: window matched", pos_window);
    row("counting, values 0..3: prefix map matched", pos_prefix);
    row("counting, values -3..3: window matched", neg_window);
    row("counting, values -3..3: prefix map matched", neg_prefix);
    row("times the window counted too many", window_high);
    row("times it counted too few", window_low);
    println!();
    row("longest at most k, values 0..3: window", long_pos);
    row("longest at most k, values -3..3: window", long_neg);

    println!();
    println!("With non-negative values both methods are exact and the window is the");
    println!("cheaper one -- one pass, no map. Allow a negative and the window loses");
    println!(
        "{} of {} arrays while the prefix map keeps all {}.",
        trials - neg_window,
        trials,
        neg_prefix
    );
    println!();
    println!("The reason is one sentence. A window only works when extending the");
    println!("right end can only increase the sum and moving the left end can only");
    println!("decrease it, because that is what makes \\"shrink while too big\\" a");
    println!("correct rule. A negative value breaks the monotonicity, and then a");
    println!("window that is too big might have become small enough by getting");
    println!("bigger -- which the shrink rule will never discover.");
    println!();
    println!("The last two counters make the same point about the other question.");
    println!("\\"Longest subarray with sum at most k\\" is a window problem on");
    println!(
        "non-negative values, right on all {}, and not one on mixed values,",
        long_pos
    );
    println!("right on {}.", long_neg);
    println!();
    println!("So the recognition rule is not \\"subarray means window\\". It is: a window");
    println!("needs a quantity that moves one way as the window grows. Check for that");
    println!("in the constraints -- the line that says whether values can be negative");
    println!("is the line that picks the pattern.");
}
`,
            },
            {
              lang: "go",
              code: `// Two patterns that look identical in the statement, and the word that splits
// them.
//
// "Count the subarrays whose sum is exactly k" and "find the longest subarray
// whose sum is at most k" are the same sentence with two words changed, and
// they want different machinery:
//
//	sliding window        -- grow the right end, shrink the left when the
//	                         window is too big. Needs the sum to move
//	                         monotonically, which means non-negative values.
//	prefix sums in a map  -- every subarray sum is a difference of two prefix
//	                         sums, so count how many earlier prefixes are
//	                         exactly k less than this one. No monotonicity
//	                         needed at all.
//
// The tell is not the word "subarray", which both share. It is whether the
// values can be negative -- and the measurement below is what happens when you
// get that wrong.
package main

import (
	"fmt"
	"strings"
)

// atMost counts the subarrays summing to at most limit, by sliding a window.
//
// Every time the right end moves, every window ending there that starts at
// or after left is small enough, and that is right - left + 1 of them. The
// rule only works because shrinking from the left can only lower the sum,
// which is where the non-negative requirement lives.
func atMost(values []int, limit int) int {
	if limit < 0 {
		return 0
	}
	total, found, left := 0, 0, 0
	for right := 0; right < len(values); right++ {
		total += values[right]
		for left <= right && total > limit {
			total -= values[left]
			left++
		}
		found += right - left + 1
	}
	return found
}

// countByWindow gives exactly k, as the difference of two at-most counts.
func countByWindow(values []int, k int) int {
	return atMost(values, k) - atMost(values, k-1)
}

// countByPrefix uses that every subarray sum is a difference of prefixes.
func countByPrefix(values []int, k int) int {
	seen := map[int]int{0: 1}
	running, found := 0, 0
	for _, x := range values {
		running += x
		found += seen[running-k]
		seen[running]++
	}
	return found
}

// countByTrying adds up every subarray. The definition.
func countByTrying(values []int, k int) int {
	found := 0
	for i := range values {
		total := 0
		for j := i; j < len(values); j++ {
			total += values[j]
			if total == k {
				found++
			}
		}
	}
	return found
}

// longestByWindow answers the other question: the longest subarray whose sum
// stays at or under k.
func longestByWindow(values []int, k int) int {
	total, best, left := 0, 0, 0
	for right := 0; right < len(values); right++ {
		total += values[right]
		for left <= right && total > k {
			total -= values[left]
			left++
		}
		if right-left+1 > best {
			best = right - left + 1
		}
	}
	return best
}

func longestByTrying(values []int, k int) int {
	best := 0
	for i := range values {
		total := 0
		for j := i; j < len(values); j++ {
			total += values[j]
			if total <= k && j-i+1 > best {
				best = j - i + 1
			}
		}
	}
	return best
}

func show(values []int) string {
	cells := make([]string, len(values))
	for i, x := range values {
		cells[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(cells, ", ") + "]"
}

// The same linear congruential generator in every language, so the random
// arrays below are the same arrays whichever translation is run.
var seed int64 = 20260910

func randBelow(n int) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % int64(n))
}

func row(text string, value int) {
	fmt.Printf("  %-44s %6d\\n", text, value)
}

func main() {
	caseValues := [][]int{{1, 2, 3, 1, 1}, {1, -1, 1, -1, 1}, {2, 0, 2, 0}}
	caseK := []int{3, 1, 2}

	fmt.Printf("%-26s %-4s %-8s %-8s %s\\n", "values", "k", "window", "prefix", "truth")
	for c := range caseK {
		fmt.Printf("%-26s %-4d %-8d %-8d %d\\n", show(caseValues[c]), caseK[c],
			countByWindow(caseValues[c], caseK[c]), countByPrefix(caseValues[c], caseK[c]),
			countByTrying(caseValues[c], caseK[c]))
	}

	trials := 3000
	posWindow, posPrefix, negWindow, negPrefix := 0, 0, 0, 0
	windowHigh, windowLow, longPos, longNeg := 0, 0, 0, 0
	for t := 0; t < trials; t++ {
		n := 1 + randBelow(8)
		k := randBelow(7)
		nonNegative := make([]int, n)
		for i := range nonNegative {
			nonNegative[i] = randBelow(4)
		}
		mixed := make([]int, n)
		for i := range mixed {
			mixed[i] = randBelow(7) - 3
		}

		want := countByTrying(nonNegative, k)
		if countByWindow(nonNegative, k) == want {
			posWindow++
		}
		if countByPrefix(nonNegative, k) == want {
			posPrefix++
		}

		want = countByTrying(mixed, k)
		got := countByWindow(mixed, k)
		if got == want {
			negWindow++
		}
		if countByPrefix(mixed, k) == want {
			negPrefix++
		}
		if got > want {
			windowHigh++
		}
		if got < want {
			windowLow++
		}

		if longestByWindow(nonNegative, k) == longestByTrying(nonNegative, k) {
			longPos++
		}
		if longestByWindow(mixed, k) == longestByTrying(mixed, k) {
			longNeg++
		}
	}

	fmt.Println()
	fmt.Printf("over %d random arrays of at most 8 values:\\n", trials)
	row("counting, values 0..3: window matched", posWindow)
	row("counting, values 0..3: prefix map matched", posPrefix)
	row("counting, values -3..3: window matched", negWindow)
	row("counting, values -3..3: prefix map matched", negPrefix)
	row("times the window counted too many", windowHigh)
	row("times it counted too few", windowLow)
	fmt.Println()
	row("longest at most k, values 0..3: window", longPos)
	row("longest at most k, values -3..3: window", longNeg)

	fmt.Println()
	fmt.Println("With non-negative values both methods are exact and the window is the")
	fmt.Println("cheaper one -- one pass, no map. Allow a negative and the window loses")
	fmt.Printf("%d of %d arrays while the prefix map keeps all %d.\\n", trials-negWindow, trials, negPrefix)
	fmt.Println()
	fmt.Println("The reason is one sentence. A window only works when extending the")
	fmt.Println("right end can only increase the sum and moving the left end can only")
	fmt.Println("decrease it, because that is what makes \\"shrink while too big\\" a")
	fmt.Println("correct rule. A negative value breaks the monotonicity, and then a")
	fmt.Println("window that is too big might have become small enough by getting")
	fmt.Println("bigger -- which the shrink rule will never discover.")
	fmt.Println()
	fmt.Println("The last two counters make the same point about the other question.")
	fmt.Println("\\"Longest subarray with sum at most k\\" is a window problem on")
	fmt.Printf("non-negative values, right on all %d, and not one on mixed values,\\n", longPos)
	fmt.Printf("right on %d.\\n", longNeg)
	fmt.Println()
	fmt.Println("So the recognition rule is not \\"subarray means window\\". It is: a window")
	fmt.Println("needs a quantity that moves one way as the window grows. Check for that")
	fmt.Println("in the constraints -- the line that says whether values can be negative")
	fmt.Println("is the line that picks the pattern.")
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Reading \"subarray\" as \"sliding window\"",
          body: "It narrows you to two candidates and no further. The window is the cheaper of the two and it is wrong on 1,193 of 3,000 mixed-value arrays, silently, in both directions. The word that decides is in the constraints, not the question.",
        },
        {
          title: "Using a window for an exact-sum count on non-negative values without the two-call trick",
          body: "Counting subarrays with sum exactly k is not a single window sweep even when the values are non-negative -- a window naturally answers \"at most\". The exact count is atMost(k) minus atMost(k-1), which is two sweeps. Trying to count exact hits inside one sweep is a common and subtly wrong implementation.",
        },
        {
          title: "Assuming the prefix map is always the safe default",
          body: "It is more general and it costs a hash map and O(n) memory, which the window does not. On a hot path over non-negative data that difference is real. General is not the same as better; the point is to know which precondition you are relying on.",
        },
      ],
    },
    {
      id: "the-same-split-elsewhere",
      heading: "The same split, elsewhere",
      body: [
        "Once you have seen the shape, it recurs. The question is always: does this technique need a quantity that moves one way as the structure grows?",
        "**Two pointers from opposite ends** needs the same thing sortedness gives it. On an unsorted array, moving the left pointer right does not reliably increase anything, and the sweep is unjustified.",
        "**Monotonic stack** needs the invariant that once an element is popped it can never be relevant again. That holds for \"next greater\" and fails the moment the question asks about something that can be un-resolved later.",
        "**Greedy in general** is this property at the level of decisions rather than indices: the rule is safe when taking the locally best option cannot close off a better global one. That is the next lesson.",
        "**Binary search on the answer** needs feasibility to be monotone in the answer. If some `C` works and a larger `C` does not, bisecting is meaningless \u2014 and this is exactly the failure people hit when they binary search a quantity that is not actually monotone.",
        "So the drill question generalises past this one pair. Whenever a technique is on your shortlist, ask what it would need to be true, and then look for the line in the constraints that says whether it is.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When can you use a sliding window on a subarray problem?",
      answer:
        "When the quantity you are tracking moves one way as the window grows. For sums that means non-negative values, because the shrink-while-too-big rule is only correct if moving the left end can only lower the sum and moving the right end can only raise it. With a negative in the array that breaks: a window that is too big might have become small enough by getting bigger, and the shrink rule will never look there. I measured it -- on arrays with values from -3 to 3 the window got 1,193 of 3,000 wrong, in both directions, silently. The general answer for subarray sums with arbitrary values is prefix sums in a hash map, because every subarray sum is a difference of two prefixes and that needs no monotonicity at all.",
    },
    {
      question: "How do you count subarrays with sum exactly k?",
      answer:
        "With prefix sums in a hash map. Keep a running total and, at each position, ask how many earlier prefixes equal running minus k -- each one is a subarray ending here with the right sum. One pass, and it works with negatives. If the values happen to be non-negative you can also do it with two window sweeps, as atMost(k) minus atMost(k-1), because a window naturally answers 'at most' rather than 'exactly'. What does not work is trying to count exact hits inside a single window pass; that is a common implementation that is quietly wrong.",
    },
    {
      question: "What would make you choose the window over the prefix map when both are correct?",
      answer:
        "Cost. The window is one pass with O(1) extra space; the prefix map is one pass with a hash map and O(n) space, plus hashing on every element. On non-negative data in a hot path that is a real difference. The point of knowing both is not that one is better -- it is knowing which precondition each one leans on, so I can say why the cheaper one is safe here rather than hoping.",
    },
  ],
  takeaways: [
    "\"Subarray\" narrows to two patterns; the constraints pick between them",
    "A sliding window needs monotonicity — for sums, that means non-negative values",
    "With mixed values the window was wrong on 1,193 of 3,000 arrays, in both directions",
    "A prefix-sum map needs nothing from the values and was right on all 3,000",
    "Exactly-k by window is two sweeps, `atMost(k) - atMost(k-1)`, not one",
    "\"Longest with sum at most k\" is a window problem only while values stay non-negative",
    "The general question: what would this technique need to be true, and does the statement say it is?",
    "The same question separates two pointers, monotonic stacks, greedy rules and binary search on the answer",
  ],
};
