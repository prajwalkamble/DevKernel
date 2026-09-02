import type { Lesson } from "@/content/types";

export const greedyVersusDpLesson: Lesson = {
  id: "dsa-greedy-versus-dp",
  slug: "greedy-against-dynamic-programming",
  moduleSlug: "greedy-algorithms",
  title: "Greedy Against Dynamic Programming",
  summary:
    "The two are not rivals but the same recurrence, one of them with every branch but one deleted. Which makes the real question sharp: is the branch you kept always a minimising one, and what do you do when it is not?",
  estimatedMinutes: 35,
  objectives: [
    "Say why weighting interval scheduling destroys the greedy result without changing the structure",
    "Write the weighted interval scheduling DP, and read it as the greedy that kept both branches",
    "State the greedy-DP relationship precisely enough to check it amount by amount",
    "Use greedy on a relaxation as a bound when greedy on the problem is wrong",
  ],
  sections: [
    {
      id: "one-word-changes-it",
      heading: "One word changes the problem",
      body: [
        "Interval scheduling is the module's cleanest greedy result: sort by finishing time, take anything compatible, and you have provably booked as many meetings as anyone could. Lesson 4 proved it with a stays-ahead argument that never mentioned the meetings themselves, only the order.",
        "Now attach a value to each meeting and ask for the most valuable compatible set instead of the largest. The intervals are the same intervals. The compatibility rule is the same rule. And earliest-finishing-time is no longer optimal — not slightly off, but wrong on a seven-job instance you can check by hand.",
        "The reason is exactly the property lesson 1 named. Greedy needs the first choice to be safe: there must be an optimal solution that agrees with it. Unweighted, that holds, because the meeting that finishes first leaves the most room and room is the only currency. Weighted, room is no longer the only currency — a job that finishes late may be worth more than everything it blocks — so the first choice is a gamble and there is nothing to trade it against.",
        "What replaces it is not cleverness but bookkeeping. Sort by finishing time anyway, and for each job ask the two questions greedy refused to ask both of: what is the best schedule that uses this job, and what is the best that does not? Keep both answers, take the larger, and move on. That is the whole of the dynamic program, and the cost of not being able to prove the greedy choice is one array.",
      ],
      visual: {
        id: "greedy-intervals",
        kind: "greedy",
        algorithm: "intervals",
        title: "The unweighted rule this lesson is about to break",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "weighted-intervals",
          title: "The same seven meetings, now with values",
          lang: "python",
          code: `# Interval scheduling by earliest finishing time is optimal - lesson 4 proved
# it. Give each job a value and ask for the most valuable compatible set, and
# the same rule is wrong. Nothing else about the problem changed.

JOBS = [
    ("A", 1, 4, 3),
    ("B", 3, 5, 2),
    ("C", 0, 6, 10),
    ("D", 5, 7, 4),
    ("E", 3, 9, 1),
    ("F", 6, 10, 6),
    ("G", 8, 11, 5),
]

# Integer keys, and a stable sort, so every language here breaks ties the same
# way and the tables below are the same tables.
RULES = [
    ("earliest finish first", lambda j: j[2]),
    ("largest value first", lambda j: -j[3]),
    ("best value per hour", lambda j: -(j[3] * 1000 // (j[2] - j[1]))),
]


def compatible(a, b):
    return a[2] <= b[1] or b[2] <= a[1]


def run_greedy(jobs, key):
    """Take jobs in the order \`key\` gives, skipping any that overlap one taken."""
    taken = []
    for job in sorted(jobs, key=key):
        if all(compatible(job, other) for other in taken):
            taken.append(job)
    return sorted(taken, key=lambda j: j[1])


def schedule_dp(jobs):
    """Sort by finish; each job is either taken with the best run before it, or not."""
    order = sorted(jobs, key=lambda j: j[2])
    n = len(order)
    # before[j] counts the jobs that are entirely done when job j starts.
    before = []
    for j in range(n):
        count = 0
        for i in range(j):
            if order[i][2] <= order[j][1]:
                count = i + 1
        before.append(count)
    best = [0] * (n + 1)
    for j in range(1, n + 1):
        best[j] = max(best[j - 1], order[j - 1][3] + best[before[j - 1]])
    # Walk the table back to recover which jobs the maximum used.
    taken = []
    j = n
    while j > 0:
        if order[j - 1][3] + best[before[j - 1]] > best[j - 1]:
            taken.append(order[j - 1])
            j = before[j - 1]
        else:
            j -= 1
    return sorted(taken, key=lambda j: j[1]), best[n]


def brute_force(jobs):
    best = 0
    for mask in range(1 << len(jobs)):
        chosen = [jobs[i] for i in range(len(jobs)) if mask >> i & 1]
        ok = True
        for x in range(len(chosen)):
            for y in range(x + 1, len(chosen)):
                if not compatible(chosen[x], chosen[y]):
                    ok = False
        if ok:
            best = max(best, sum(j[3] for j in chosen))
    return best


print("job  start  finish  value")
for name, start, finish, value in JOBS:
    print(f"{name:<5}{start:>5}{finish:>8}{value:>7}")
print()

print(f"{'rule':<24}{'books':<10}{'value':>6}")
for label, key in RULES:
    taken = run_greedy(JOBS, key)
    names = " ".join(j[0] for j in taken)
    print(f"{label:<24}{names:<10}{sum(j[3] for j in taken):>6}")

taken, value = schedule_dp(JOBS)
print(f"{'dynamic programming':<24}{' '.join(j[0] for j in taken):<10}{value:>6}")
print(f"all {1 << len(JOBS)} subsets agree the best is {brute_force(JOBS)}")
print()

# One instance is an anecdote. Score every rule against the truth on a few
# thousand random instances instead.
seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 20000
wins = [0] * len(RULES)
dp_wins = 0
for _ in range(TRIALS):
    jobs = []
    for i in range(6):
        start = rand(10)
        jobs.append((chr(65 + i), start, start + 1 + rand(5), 1 + rand(9)))
    truth = brute_force(jobs)
    if schedule_dp(jobs)[1] == truth:
        dp_wins += 1
    for k, (_, key) in enumerate(RULES):
        if sum(j[3] for j in run_greedy(jobs, key)) == truth:
            wins[k] += 1

print(f"optimal on how many of {TRIALS} random six-job instances:")
for k, (label, _) in enumerate(RULES):
    print(f"  {label:<24}{wins[k]:>7}")
print(f"  {'dynamic programming':<24}{dp_wins:>7}")
`,
          output: `job  start  finish  value
A        1       4      3
B        3       5      2
C        0       6     10
D        5       7      4
E        3       9      1
F        6      10      6
G        8      11      5

rule                    books      value
earliest finish first   A D G         12
largest value first     C F           16
best value per hour     A D G         12
dynamic programming     C F           16
all 128 subsets agree the best is 16

optimal on how many of 20000 random six-job instances:
  earliest finish first      7772
  largest value first       16971
  best value per hour       13552
  dynamic programming       20000`,
          explanation: "The instance is lesson 4's, with a value attached to each meeting. Earliest finishing time books A, D and G for 12, which is three meetings out of a possible three — and 4 short of the 16 that C and F are worth between them. The sweep underneath is the honest part: no rule wins everywhere, and the one that wins most often on random instances is not the one that is provably right on the unweighted problem.",
          alternates: [
            {
              lang: "javascript",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.

const JOBS = [
  ["A", 1, 4, 3],
  ["B", 3, 5, 2],
  ["C", 0, 6, 10],
  ["D", 5, 7, 4],
  ["E", 3, 9, 1],
  ["F", 6, 10, 6],
  ["G", 8, 11, 5],
];

// Integer keys, and a stable sort, so every language here breaks ties the same
// way and the tables below are the same tables.
const RULES = [
  ["earliest finish first", (j) => j[2]],
  ["largest value first", (j) => -j[3]],
  ["best value per hour", (j) => -Math.floor((j[3] * 1000) / (j[2] - j[1]))],
];

const compatible = (a, b) => a[2] <= b[1] || b[2] <= a[1];

function sortedBy(items, key) {
  return items.map((it) => it).sort((a, b) => key(a) - key(b));
}

/** Take jobs in the order \`key\` gives, skipping any that overlap one taken. */
function runGreedy(jobs, key) {
  const taken = [];
  for (const job of sortedBy(jobs, key)) {
    if (taken.every((other) => compatible(job, other))) taken.push(job);
  }
  return sortedBy(taken, (j) => j[1]);
}

/** Sort by finish; each job is either taken with the best run before it, or not. */
function scheduleDp(jobs) {
  const order = sortedBy(jobs, (j) => j[2]);
  const n = order.length;
  // before[j] counts the jobs that are entirely done when job j starts.
  const before = [];
  for (let j = 0; j < n; j++) {
    let count = 0;
    for (let i = 0; i < j; i++) if (order[i][2] <= order[j][1]) count = i + 1;
    before.push(count);
  }
  const best = new Array(n + 1).fill(0);
  for (let j = 1; j <= n; j++) {
    best[j] = Math.max(best[j - 1], order[j - 1][3] + best[before[j - 1]]);
  }
  // Walk the table back to recover which jobs the maximum used.
  const taken = [];
  let j = n;
  while (j > 0) {
    if (order[j - 1][3] + best[before[j - 1]] > best[j - 1]) {
      taken.push(order[j - 1]);
      j = before[j - 1];
    } else {
      j--;
    }
  }
  return { taken: sortedBy(taken, (x) => x[1]), value: best[n] };
}

function bruteForce(jobs) {
  let best = 0;
  for (let mask = 0; mask < 1 << jobs.length; mask++) {
    const chosen = jobs.filter((_, i) => (mask >> i) & 1);
    let ok = true;
    for (let x = 0; x < chosen.length; x++) {
      for (let y = x + 1; y < chosen.length; y++) {
        if (!compatible(chosen[x], chosen[y])) ok = false;
      }
    }
    if (ok) best = Math.max(best, chosen.reduce((sum, j) => sum + j[3], 0));
  }
  return best;
}

const pad = (s, w) => String(s).padStart(w);

console.log("job  start  finish  value");
for (const [name, start, finish, value] of JOBS) {
  console.log(name.padEnd(5) + pad(start, 5) + pad(finish, 8) + pad(value, 7));
}
console.log();

console.log("rule".padEnd(24) + "books".padEnd(10) + "value".padStart(6));
for (const [label, key] of RULES) {
  const taken = runGreedy(JOBS, key);
  const names = taken.map((j) => j[0]).join(" ");
  const value = taken.reduce((sum, j) => sum + j[3], 0);
  console.log(label.padEnd(24) + names.padEnd(10) + pad(value, 6));
}

const dp = scheduleDp(JOBS);
console.log(
  "dynamic programming".padEnd(24) + dp.taken.map((j) => j[0]).join(" ").padEnd(10) + pad(dp.value, 6)
);
console.log(\`all \${1 << JOBS.length} subsets agree the best is \${bruteForce(JOBS)}\`);
console.log();

// One instance is an anecdote. Score every rule against the truth on a few
// thousand random instances instead. BigInt because seed * 1103515245 runs past
// what a double can hold exactly.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 20000;
const wins = new Array(RULES.length).fill(0);
let dpWins = 0;
for (let t = 0; t < TRIALS; t++) {
  const jobs = [];
  for (let i = 0; i < 6; i++) {
    const start = rand(10);
    jobs.push([String.fromCharCode(65 + i), start, start + 1 + rand(5), 1 + rand(9)]);
  }
  const truth = bruteForce(jobs);
  if (scheduleDp(jobs).value === truth) dpWins++;
  for (let k = 0; k < RULES.length; k++) {
    const value = runGreedy(jobs, RULES[k][1]).reduce((sum, j) => sum + j[3], 0);
    if (value === truth) wins[k]++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random six-job instances:\`);
for (let k = 0; k < RULES.length; k++) {
  console.log("  " + RULES[k][0].padEnd(24) + pad(wins[k], 7));
}
console.log("  " + "dynamic programming".padEnd(24) + pad(dpWins, 7));
`,
            },
            {
              lang: "typescript",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.

type Job = [name: string, start: number, finish: number, value: number];

const JOBS: Job[] = [
  ["A", 1, 4, 3],
  ["B", 3, 5, 2],
  ["C", 0, 6, 10],
  ["D", 5, 7, 4],
  ["E", 3, 9, 1],
  ["F", 6, 10, 6],
  ["G", 8, 11, 5],
];

// Integer keys, and a stable sort, so every language here breaks ties the same
// way and the tables below are the same tables.
const RULES: Array<[string, (j: Job) => number]> = [
  ["earliest finish first", (j) => j[2]],
  ["largest value first", (j) => -j[3]],
  ["best value per hour", (j) => -Math.floor((j[3] * 1000) / (j[2] - j[1]))],
];

const compatible = (a: Job, b: Job): boolean => a[2] <= b[1] || b[2] <= a[1];

function sortedBy(items: Job[], key: (j: Job) => number): Job[] {
  return items.map((it) => it).sort((a, b) => key(a) - key(b));
}

/** Take jobs in the order \`key\` gives, skipping any that overlap one taken. */
function runGreedy(jobs: Job[], key: (j: Job) => number): Job[] {
  const taken: Job[] = [];
  for (const job of sortedBy(jobs, key)) {
    if (taken.every((other) => compatible(job, other))) taken.push(job);
  }
  return sortedBy(taken, (j) => j[1]);
}

interface Schedule {
  taken: Job[];
  value: number;
}

/** Sort by finish; each job is either taken with the best run before it, or not. */
function scheduleDp(jobs: Job[]): Schedule {
  const order = sortedBy(jobs, (j) => j[2]);
  const n = order.length;
  // before[j] counts the jobs that are entirely done when job j starts.
  const before: number[] = [];
  for (let j = 0; j < n; j++) {
    let count = 0;
    for (let i = 0; i < j; i++) if (order[i][2] <= order[j][1]) count = i + 1;
    before.push(count);
  }
  const best: number[] = new Array<number>(n + 1).fill(0);
  for (let j = 1; j <= n; j++) {
    best[j] = Math.max(best[j - 1], order[j - 1][3] + best[before[j - 1]]);
  }
  // Walk the table back to recover which jobs the maximum used.
  const taken: Job[] = [];
  let j = n;
  while (j > 0) {
    if (order[j - 1][3] + best[before[j - 1]] > best[j - 1]) {
      taken.push(order[j - 1]);
      j = before[j - 1];
    } else {
      j--;
    }
  }
  return { taken: sortedBy(taken, (x) => x[1]), value: best[n] };
}

function bruteForce(jobs: Job[]): number {
  let best = 0;
  for (let mask = 0; mask < 1 << jobs.length; mask++) {
    const chosen = jobs.filter((_, i) => (mask >> i) & 1);
    let ok = true;
    for (let x = 0; x < chosen.length; x++) {
      for (let y = x + 1; y < chosen.length; y++) {
        if (!compatible(chosen[x], chosen[y])) ok = false;
      }
    }
    if (ok) best = Math.max(best, chosen.reduce((sum, j) => sum + j[3], 0));
  }
  return best;
}

const pad = (s: string | number, w: number): string => String(s).padStart(w);

console.log("job  start  finish  value");
for (const [name, start, finish, value] of JOBS) {
  console.log(name.padEnd(5) + pad(start, 5) + pad(finish, 8) + pad(value, 7));
}
console.log();

console.log("rule".padEnd(24) + "books".padEnd(10) + "value".padStart(6));
for (const [label, key] of RULES) {
  const taken = runGreedy(JOBS, key);
  const names = taken.map((j) => j[0]).join(" ");
  const value = taken.reduce((sum, j) => sum + j[3], 0);
  console.log(label.padEnd(24) + names.padEnd(10) + pad(value, 6));
}

const dp = scheduleDp(JOBS);
console.log(
  "dynamic programming".padEnd(24) + dp.taken.map((j) => j[0]).join(" ").padEnd(10) + pad(dp.value, 6)
);
console.log(\`all \${1 << JOBS.length} subsets agree the best is \${bruteForce(JOBS)}\`);
console.log();

// One instance is an anecdote. Score every rule against the truth on a few
// thousand random instances instead. BigInt because seed * 1103515245 runs past
// what a double can hold exactly.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 20000;
const wins: number[] = new Array<number>(RULES.length).fill(0);
let dpWins = 0;
for (let t = 0; t < TRIALS; t++) {
  const jobs: Job[] = [];
  for (let i = 0; i < 6; i++) {
    const start = rand(10);
    jobs.push([String.fromCharCode(65 + i), start, start + 1 + rand(5), 1 + rand(9)]);
  }
  const truth = bruteForce(jobs);
  if (scheduleDp(jobs).value === truth) dpWins++;
  for (let k = 0; k < RULES.length; k++) {
    const value = runGreedy(jobs, RULES[k][1]).reduce((sum, j) => sum + j[3], 0);
    if (value === truth) wins[k]++;
  }
}

console.log(\`optimal on how many of \${TRIALS} random six-job instances:\`);
for (let k = 0; k < RULES.length; k++) {
  console.log("  " + RULES[k][0].padEnd(24) + pad(wins[k], 7));
}
console.log("  " + "dynamic programming".padEnd(24) + pad(dpWins, 7));
`,
            },
            {
              lang: "java",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.ToIntFunction;

public class Main {
    record Job(String name, int start, int finish, int value) {}

    static final List<Job> JOBS = List.of(
        new Job("A", 1, 4, 3),
        new Job("B", 3, 5, 2),
        new Job("C", 0, 6, 10),
        new Job("D", 5, 7, 4),
        new Job("E", 3, 9, 1),
        new Job("F", 6, 10, 6),
        new Job("G", 8, 11, 5));

    record Rule(String label, ToIntFunction<Job> key) {}

    // Integer keys, and a stable sort, so every language here breaks ties the
    // same way and the tables below are the same tables.
    static final List<Rule> RULES = List.of(
        new Rule("earliest finish first", Job::finish),
        new Rule("largest value first", j -> -j.value()),
        new Rule("best value per hour", j -> -(j.value() * 1000 / (j.finish() - j.start()))));

    static boolean compatible(Job a, Job b) {
        return a.finish() <= b.start() || b.finish() <= a.start();
    }

    static List<Job> sortedBy(List<Job> items, ToIntFunction<Job> key) {
        List<Job> copy = new ArrayList<>(items);
        copy.sort(Comparator.comparingInt(key));
        return copy;
    }

    /** Take jobs in the order \`key\` gives, skipping any that overlap one taken. */
    static List<Job> runGreedy(List<Job> jobs, ToIntFunction<Job> key) {
        List<Job> taken = new ArrayList<>();
        for (Job job : sortedBy(jobs, key)) {
            boolean fits = true;
            for (Job other : taken) {
                if (!compatible(job, other)) fits = false;
            }
            if (fits) taken.add(job);
        }
        return sortedBy(taken, Job::start);
    }

    record Schedule(List<Job> taken, int value) {}

    /** Sort by finish; each job is either taken with the best run before it, or not. */
    static Schedule scheduleDp(List<Job> jobs) {
        List<Job> order = sortedBy(jobs, Job::finish);
        int n = order.size();
        // before[j] counts the jobs that are entirely done when job j starts.
        int[] before = new int[n];
        for (int j = 0; j < n; j++) {
            int count = 0;
            for (int i = 0; i < j; i++) {
                if (order.get(i).finish() <= order.get(j).start()) count = i + 1;
            }
            before[j] = count;
        }
        int[] best = new int[n + 1];
        for (int j = 1; j <= n; j++) {
            best[j] = Math.max(best[j - 1], order.get(j - 1).value() + best[before[j - 1]]);
        }
        // Walk the table back to recover which jobs the maximum used.
        List<Job> taken = new ArrayList<>();
        int j = n;
        while (j > 0) {
            if (order.get(j - 1).value() + best[before[j - 1]] > best[j - 1]) {
                taken.add(order.get(j - 1));
                j = before[j - 1];
            } else {
                j--;
            }
        }
        return new Schedule(sortedBy(taken, Job::start), best[n]);
    }

    static int bruteForce(List<Job> jobs) {
        int best = 0;
        for (int mask = 0; mask < 1 << jobs.size(); mask++) {
            List<Job> chosen = new ArrayList<>();
            for (int i = 0; i < jobs.size(); i++) {
                if ((mask >> i & 1) == 1) chosen.add(jobs.get(i));
            }
            boolean ok = true;
            for (int x = 0; x < chosen.size(); x++) {
                for (int y = x + 1; y < chosen.size(); y++) {
                    if (!compatible(chosen.get(x), chosen.get(y))) ok = false;
                }
            }
            if (ok) {
                int total = 0;
                for (Job job : chosen) total += job.value();
                best = Math.max(best, total);
            }
        }
        return best;
    }

    static String names(List<Job> jobs) {
        StringBuilder sb = new StringBuilder();
        for (Job job : jobs) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(job.name());
        }
        return sb.toString();
    }

    static int total(List<Job> jobs) {
        int sum = 0;
        for (Job job : jobs) sum += job.value();
        return sum;
    }

    // A deterministic generator, so the sweep is reproducible and the counts it
    // reports are the same ones for every reader.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        System.out.println("job  start  finish  value");
        for (Job job : JOBS) {
            System.out.printf("%-5s%5d%8d%7d%n", job.name(), job.start(), job.finish(), job.value());
        }
        System.out.println();

        System.out.printf("%-24s%-10s%6s%n", "rule", "books", "value");
        for (Rule rule : RULES) {
            List<Job> taken = runGreedy(JOBS, rule.key());
            System.out.printf("%-24s%-10s%6d%n", rule.label(), names(taken), total(taken));
        }

        Schedule dp = scheduleDp(JOBS);
        System.out.printf("%-24s%-10s%6d%n", "dynamic programming", names(dp.taken()), dp.value());
        System.out.printf("all %d subsets agree the best is %d%n",
            1 << JOBS.size(), bruteForce(JOBS));
        System.out.println();

        // One instance is an anecdote. Score every rule against the truth on a
        // few thousand random instances instead.
        final int trials = 20000;
        int[] wins = new int[RULES.size()];
        int dpWins = 0;
        for (int t = 0; t < trials; t++) {
            List<Job> jobs = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                int start = rand(10);
                jobs.add(new Job(String.valueOf((char) ('A' + i)),
                    start, start + 1 + rand(5), 1 + rand(9)));
            }
            int truth = bruteForce(jobs);
            if (scheduleDp(jobs).value() == truth) dpWins++;
            for (int k = 0; k < RULES.size(); k++) {
                if (total(runGreedy(jobs, RULES.get(k).key())) == truth) wins[k]++;
            }
        }

        System.out.printf("optimal on how many of %d random six-job instances:%n", trials);
        for (int k = 0; k < RULES.size(); k++) {
            System.out.printf("  %-24s%7d%n", RULES.get(k).label(), wins[k]);
        }
        System.out.printf("  %-24s%7d%n", "dynamic programming", dpWins);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.
#include <algorithm>
#include <cstdint>
#include <functional>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

struct Job {
    std::string name;
    int start;
    int finish;
    int value;
};

const std::vector<Job> JOBS = {
    {"A", 1, 4, 3},
    {"B", 3, 5, 2},
    {"C", 0, 6, 10},
    {"D", 5, 7, 4},
    {"E", 3, 9, 1},
    {"F", 6, 10, 6},
    {"G", 8, 11, 5},
};

// Integer keys, and a stable sort, so every language here breaks ties the same
// way and the tables below are the same tables.
using Key = std::function<int(const Job&)>;

const std::vector<std::pair<std::string, Key>> RULES = {
    {"earliest finish first", [](const Job& j) { return j.finish; }},
    {"largest value first", [](const Job& j) { return -j.value; }},
    {"best value per hour", [](const Job& j) { return -(j.value * 1000 / (j.finish - j.start)); }},
};

bool compatible(const Job& a, const Job& b) {
    return a.finish <= b.start || b.finish <= a.start;
}

std::vector<Job> sorted_by(const std::vector<Job>& items, const Key& key) {
    std::vector<Job> copy = items;
    std::stable_sort(copy.begin(), copy.end(),
                     [&](const Job& a, const Job& b) { return key(a) < key(b); });
    return copy;
}

/** Take jobs in the order \`key\` gives, skipping any that overlap one taken. */
std::vector<Job> run_greedy(const std::vector<Job>& jobs, const Key& key) {
    std::vector<Job> taken;
    for (const Job& job : sorted_by(jobs, key)) {
        bool fits = true;
        for (const Job& other : taken) {
            if (!compatible(job, other)) fits = false;
        }
        if (fits) taken.push_back(job);
    }
    return sorted_by(taken, [](const Job& j) { return j.start; });
}

struct Schedule {
    std::vector<Job> taken;
    int value;
};

/** Sort by finish; each job is either taken with the best run before it, or not. */
Schedule schedule_dp(const std::vector<Job>& jobs) {
    std::vector<Job> order = sorted_by(jobs, [](const Job& j) { return j.finish; });
    int n = static_cast<int>(order.size());
    // before[j] counts the jobs that are entirely done when job j starts.
    std::vector<int> before(n, 0);
    for (int j = 0; j < n; ++j) {
        int count = 0;
        for (int i = 0; i < j; ++i) {
            if (order[i].finish <= order[j].start) count = i + 1;
        }
        before[j] = count;
    }
    std::vector<int> best(n + 1, 0);
    for (int j = 1; j <= n; ++j) {
        best[j] = std::max(best[j - 1], order[j - 1].value + best[before[j - 1]]);
    }
    // Walk the table back to recover which jobs the maximum used.
    std::vector<Job> taken;
    int j = n;
    while (j > 0) {
        if (order[j - 1].value + best[before[j - 1]] > best[j - 1]) {
            taken.push_back(order[j - 1]);
            j = before[j - 1];
        } else {
            --j;
        }
    }
    return {sorted_by(taken, [](const Job& x) { return x.start; }), best[n]};
}

int brute_force(const std::vector<Job>& jobs) {
    int best = 0;
    for (int mask = 0; mask < (1 << static_cast<int>(jobs.size())); ++mask) {
        std::vector<Job> chosen;
        for (size_t i = 0; i < jobs.size(); ++i) {
            if (mask >> i & 1) chosen.push_back(jobs[i]);
        }
        bool ok = true;
        for (size_t x = 0; x < chosen.size(); ++x) {
            for (size_t y = x + 1; y < chosen.size(); ++y) {
                if (!compatible(chosen[x], chosen[y])) ok = false;
            }
        }
        if (ok) {
            int total = 0;
            for (const Job& job : chosen) total += job.value;
            best = std::max(best, total);
        }
    }
    return best;
}

std::string names(const std::vector<Job>& jobs) {
    std::string out;
    for (const Job& job : jobs) {
        if (!out.empty()) out += ' ';
        out += job.name;
    }
    return out;
}

int total(const std::vector<Job>& jobs) {
    int sum = 0;
    for (const Job& job : jobs) sum += job.value;
    return sum;
}

// A deterministic generator, so the sweep is reproducible and the counts it
// reports are the same ones for every reader.
std::int64_t seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::cout << "job  start  finish  value\\n";
    for (const Job& job : JOBS) {
        std::cout << std::left << std::setw(5) << job.name << std::right << std::setw(5)
                  << job.start << std::setw(8) << job.finish << std::setw(7) << job.value << "\\n";
    }
    std::cout << "\\n";

    std::cout << std::left << std::setw(24) << "rule" << std::setw(10) << "books"
              << std::right << std::setw(6) << "value" << "\\n";
    for (const auto& rule : RULES) {
        std::vector<Job> taken = run_greedy(JOBS, rule.second);
        std::cout << std::left << std::setw(24) << rule.first << std::setw(10) << names(taken)
                  << std::right << std::setw(6) << total(taken) << "\\n";
    }

    Schedule dp = schedule_dp(JOBS);
    std::cout << std::left << std::setw(24) << "dynamic programming" << std::setw(10)
              << names(dp.taken) << std::right << std::setw(6) << dp.value << "\\n";
    std::cout << "all " << (1 << JOBS.size()) << " subsets agree the best is "
              << brute_force(JOBS) << "\\n\\n";

    // One instance is an anecdote. Score every rule against the truth on a few
    // thousand random instances instead.
    const int trials = 20000;
    std::vector<int> wins(RULES.size(), 0);
    int dp_wins = 0;
    for (int t = 0; t < trials; ++t) {
        std::vector<Job> jobs;
        for (int i = 0; i < 6; ++i) {
            int start = rand_below(10);
            jobs.push_back({std::string(1, static_cast<char>('A' + i)),
                            start, start + 1 + rand_below(5), 1 + rand_below(9)});
        }
        int truth = brute_force(jobs);
        if (schedule_dp(jobs).value == truth) dp_wins++;
        for (size_t k = 0; k < RULES.size(); ++k) {
            if (total(run_greedy(jobs, RULES[k].second)) == truth) wins[k]++;
        }
    }

    std::cout << "optimal on how many of " << trials << " random six-job instances:\\n";
    for (size_t k = 0; k < RULES.size(); ++k) {
        std::cout << "  " << std::left << std::setw(24) << RULES[k].first
                  << std::right << std::setw(7) << wins[k] << "\\n";
    }
    std::cout << "  " << std::left << std::setw(24) << "dynamic programming"
              << std::right << std::setw(7) << dp_wins << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.

#[derive(Clone)]
struct Job {
    name: String,
    start: i32,
    finish: i32,
    value: i32,
}

fn jobs_table() -> Vec<Job> {
    [("A", 1, 4, 3), ("B", 3, 5, 2), ("C", 0, 6, 10), ("D", 5, 7, 4),
     ("E", 3, 9, 1), ("F", 6, 10, 6), ("G", 8, 11, 5)]
        .iter()
        .map(|&(name, start, finish, value)| Job {
            name: name.to_string(), start, finish, value,
        })
        .collect()
}

// Integer keys, and a stable sort, so every language here breaks ties the same
// way and the tables below are the same tables.
fn rules() -> Vec<(&'static str, fn(&Job) -> i32)> {
    vec![
        ("earliest finish first", |j: &Job| j.finish),
        ("largest value first", |j: &Job| -j.value),
        ("best value per hour", |j: &Job| -(j.value * 1000 / (j.finish - j.start))),
    ]
}

fn compatible(a: &Job, b: &Job) -> bool {
    a.finish <= b.start || b.finish <= a.start
}

fn sorted_by(items: &[Job], key: fn(&Job) -> i32) -> Vec<Job> {
    let mut copy = items.to_vec();
    copy.sort_by_key(key);
    copy
}

/// Take jobs in the order \`key\` gives, skipping any that overlap one taken.
fn run_greedy(jobs: &[Job], key: fn(&Job) -> i32) -> Vec<Job> {
    let mut taken: Vec<Job> = Vec::new();
    for job in sorted_by(jobs, key) {
        let mut fits = true;
        for other in &taken {
            if !compatible(&job, other) {
                fits = false;
            }
        }
        if fits {
            taken.push(job);
        }
    }
    sorted_by(&taken, |j| j.start)
}

/// Sort by finish; each job is either taken with the best run before it, or not.
fn schedule_dp(jobs: &[Job]) -> (Vec<Job>, i32) {
    let order = sorted_by(jobs, |j| j.finish);
    let n = order.len();
    // before[j] counts the jobs that are entirely done when job j starts.
    let mut before = vec![0usize; n];
    for j in 0..n {
        let mut count = 0;
        for i in 0..j {
            if order[i].finish <= order[j].start {
                count = i + 1;
            }
        }
        before[j] = count;
    }
    let mut best = vec![0i32; n + 1];
    for j in 1..=n {
        best[j] = best[j - 1].max(order[j - 1].value + best[before[j - 1]]);
    }
    // Walk the table back to recover which jobs the maximum used.
    let mut taken: Vec<Job> = Vec::new();
    let mut j = n;
    while j > 0 {
        if order[j - 1].value + best[before[j - 1]] > best[j - 1] {
            taken.push(order[j - 1].clone());
            j = before[j - 1];
        } else {
            j -= 1;
        }
    }
    (sorted_by(&taken, |x| x.start), best[n])
}

fn brute_force(jobs: &[Job]) -> i32 {
    let mut best = 0;
    for mask in 0..(1u32 << jobs.len()) {
        let chosen: Vec<&Job> = jobs.iter().enumerate()
            .filter(|(i, _)| mask >> i & 1 == 1)
            .map(|(_, j)| j)
            .collect();
        let mut ok = true;
        for x in 0..chosen.len() {
            for y in (x + 1)..chosen.len() {
                if !compatible(chosen[x], chosen[y]) {
                    ok = false;
                }
            }
        }
        if ok {
            best = best.max(chosen.iter().map(|j| j.value).sum::<i32>());
        }
    }
    best
}

fn names(jobs: &[Job]) -> String {
    jobs.iter().map(|j| j.name.clone()).collect::<Vec<_>>().join(" ")
}

fn total(jobs: &[Job]) -> i32 {
    jobs.iter().map(|j| j.value).sum()
}

// A deterministic generator, so the sweep is reproducible and the counts it
// reports are the same ones for every reader.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i32 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        (self.seed / 65536 % n) as i32
    }
}

fn main() {
    let table = jobs_table();

    println!("job  start  finish  value");
    for job in &table {
        println!("{:<5}{:>5}{:>8}{:>7}", job.name, job.start, job.finish, job.value);
    }
    println!();

    println!("{:<24}{:<10}{:>6}", "rule", "books", "value");
    for (label, key) in rules() {
        let taken = run_greedy(&table, key);
        println!("{:<24}{:<10}{:>6}", label, names(&taken), total(&taken));
    }

    let (taken, value) = schedule_dp(&table);
    println!("{:<24}{:<10}{:>6}", "dynamic programming", names(&taken), value);
    println!("all {} subsets agree the best is {}", 1 << table.len(), brute_force(&table));
    println!();

    // One instance is an anecdote. Score every rule against the truth on a few
    // thousand random instances instead.
    let trials = 20000;
    let all_rules = rules();
    let mut wins = vec![0; all_rules.len()];
    let mut dp_wins = 0;
    let mut rng = Rng { seed: 1 };
    for _ in 0..trials {
        let mut jobs: Vec<Job> = Vec::new();
        for i in 0..6u8 {
            let start = rng.next(10);
            jobs.push(Job {
                name: ((b'A' + i) as char).to_string(),
                start,
                finish: start + 1 + rng.next(5),
                value: 1 + rng.next(9),
            });
        }
        let truth = brute_force(&jobs);
        if schedule_dp(&jobs).1 == truth {
            dp_wins += 1;
        }
        for (k, (_, key)) in all_rules.iter().enumerate() {
            if total(&run_greedy(&jobs, *key)) == truth {
                wins[k] += 1;
            }
        }
    }

    println!("optimal on how many of {} random six-job instances:", trials);
    for (k, (label, _)) in all_rules.iter().enumerate() {
        println!("  {:<24}{:>7}", label, wins[k]);
    }
    println!("  {:<24}{:>7}", "dynamic programming", dp_wins);
}
`,
            },
            {
              lang: "go",
              code: `// Interval scheduling by earliest finishing time is optimal - lesson 4 proved
// it. Give each job a value and ask for the most valuable compatible set, and
// the same rule is wrong. Nothing else about the problem changed.
package main

import (
	"fmt"
	"sort"
	"strings"
)

type job struct {
	name   string
	start  int
	finish int
	value  int
}

var jobsTable = []job{
	{"A", 1, 4, 3},
	{"B", 3, 5, 2},
	{"C", 0, 6, 10},
	{"D", 5, 7, 4},
	{"E", 3, 9, 1},
	{"F", 6, 10, 6},
	{"G", 8, 11, 5},
}

type rule struct {
	label string
	key   func(job) int
}

// Integer keys, and a stable sort, so every language here breaks ties the same
// way and the tables below are the same tables.
var rules = []rule{
	{"earliest finish first", func(j job) int { return j.finish }},
	{"largest value first", func(j job) int { return -j.value }},
	{"best value per hour", func(j job) int { return -(j.value * 1000 / (j.finish - j.start)) }},
}

func compatible(a, b job) bool {
	return a.finish <= b.start || b.finish <= a.start
}

func sortedBy(items []job, key func(job) int) []job {
	copied := make([]job, len(items))
	copy(copied, items)
	sort.SliceStable(copied, func(i, k int) bool { return key(copied[i]) < key(copied[k]) })
	return copied
}

// Take jobs in the order key gives, skipping any that overlap one taken.
func runGreedy(jobs []job, key func(job) int) []job {
	var taken []job
	for _, j := range sortedBy(jobs, key) {
		fits := true
		for _, other := range taken {
			if !compatible(j, other) {
				fits = false
			}
		}
		if fits {
			taken = append(taken, j)
		}
	}
	return sortedBy(taken, func(j job) int { return j.start })
}

// Sort by finish; each job is either taken with the best run before it, or not.
func scheduleDp(jobs []job) ([]job, int) {
	order := sortedBy(jobs, func(j job) int { return j.finish })
	n := len(order)
	// before[j] counts the jobs that are entirely done when job j starts.
	before := make([]int, n)
	for j := 0; j < n; j++ {
		count := 0
		for i := 0; i < j; i++ {
			if order[i].finish <= order[j].start {
				count = i + 1
			}
		}
		before[j] = count
	}
	best := make([]int, n+1)
	for j := 1; j <= n; j++ {
		best[j] = best[j-1]
		if take := order[j-1].value + best[before[j-1]]; take > best[j] {
			best[j] = take
		}
	}
	// Walk the table back to recover which jobs the maximum used.
	var taken []job
	j := n
	for j > 0 {
		if order[j-1].value+best[before[j-1]] > best[j-1] {
			taken = append(taken, order[j-1])
			j = before[j-1]
		} else {
			j--
		}
	}
	return sortedBy(taken, func(x job) int { return x.start }), best[n]
}

func bruteForce(jobs []job) int {
	best := 0
	for mask := 0; mask < 1<<len(jobs); mask++ {
		var chosen []job
		for i := range jobs {
			if mask>>i&1 == 1 {
				chosen = append(chosen, jobs[i])
			}
		}
		ok := true
		for x := 0; x < len(chosen); x++ {
			for y := x + 1; y < len(chosen); y++ {
				if !compatible(chosen[x], chosen[y]) {
					ok = false
				}
			}
		}
		if ok {
			total := 0
			for _, j := range chosen {
				total += j.value
			}
			if total > best {
				best = total
			}
		}
	}
	return best
}

func names(jobs []job) string {
	parts := make([]string, len(jobs))
	for i, j := range jobs {
		parts[i] = j.name
	}
	return strings.Join(parts, " ")
}

func total(jobs []job) int {
	sum := 0
	for _, j := range jobs {
		sum += j.value
	}
	return sum
}

// A deterministic generator, so the sweep is reproducible and the counts it
// reports are the same ones for every reader.
var seed int64 = 1

func rand(n int64) int {
	seed = (seed*1103515245 + 12345) % 2147483648
	return int(seed / 65536 % n)
}

func main() {
	fmt.Println("job  start  finish  value")
	for _, j := range jobsTable {
		fmt.Printf("%-5s%5d%8d%7d\\n", j.name, j.start, j.finish, j.value)
	}
	fmt.Println()

	fmt.Printf("%-24s%-10s%6s\\n", "rule", "books", "value")
	for _, r := range rules {
		taken := runGreedy(jobsTable, r.key)
		fmt.Printf("%-24s%-10s%6d\\n", r.label, names(taken), total(taken))
	}

	taken, value := scheduleDp(jobsTable)
	fmt.Printf("%-24s%-10s%6d\\n", "dynamic programming", names(taken), value)
	fmt.Printf("all %d subsets agree the best is %d\\n", 1<<len(jobsTable), bruteForce(jobsTable))
	fmt.Println()

	// One instance is an anecdote. Score every rule against the truth on a few
	// thousand random instances instead.
	const trials = 20000
	wins := make([]int, len(rules))
	dpWins := 0
	for t := 0; t < trials; t++ {
		var jobs []job
		for i := 0; i < 6; i++ {
			start := rand(10)
			jobs = append(jobs, job{
				name:   string(rune('A' + i)),
				start:  start,
				finish: start + 1 + rand(5),
				value:  1 + rand(9),
			})
		}
		truth := bruteForce(jobs)
		if _, v := scheduleDp(jobs); v == truth {
			dpWins++
		}
		for k, r := range rules {
			if total(runGreedy(jobs, r.key)) == truth {
				wins[k]++
			}
		}
	}

	fmt.Printf("optimal on how many of %d random six-job instances:\\n", trials)
	for k, r := range rules {
		fmt.Printf("  %-24s%7d\\n", r.label, wins[k])
	}
	fmt.Printf("  %-24s%7d\\n", "dynamic programming", dpWins)
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "same-recurrence",
      heading: "The table is the greedy that kept both branches",
      body: [
        "The relationship between the two is closer than \"use greedy when you can prove it, otherwise use a table\" makes it sound. They are the same recurrence.",
        "Greedy coin change says the fewest coins for an amount is one coin — the largest that fits — plus the fewest coins for what is left. The table says the fewest coins is one coin, minimised over *every* coin that fits, plus the fewest for what is left. Greedy is the table with all but one branch deleted.",
        "So \"this system is canonical\" is not a vague quality of the system. It is the statement that the branch greedy keeps is always among the minimising ones. That is checkable amount by amount, and it is worth looking at what the check reports, because the numbers are not what you would guess.",
        "For the system 4, 3, 1, exactly one amount in a thousand is one where the largest coin is not on any shortest path — and a quarter of all amounts get the wrong answer. A bad branch is not one bad answer. Greedy walks into the amount it just got wrong, and every amount that reduces to that one inherits the mistake, which is why a single flaw in a greedy rule is never a single flaw in its output.",
      ],
      examples: [
        {
          id: "branch-against-answer",
          title: "Bad branches against wrong answers",
          lang: "python",
          code: `# Greedy and the table are the same recurrence with one difference.
#
#   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
#   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
#
# Greedy commits to one branch. The table keeps all of them. So "greedy is
# optimal for this system" says exactly one thing: the branch greedy commits to
# is always one of the minimising ones. That is checkable amount by amount, and
# it is what the columns below count.

LIMIT = 1000

SYSTEMS = [
    ("US coins", [25, 10, 5, 1]),
    ("US without the nickel", [25, 10, 1]),
    ("the textbook villain", [4, 3, 1]),
    ("all divisors of 30", [30, 24, 12, 6, 3, 1]),
    ("nine six five one", [9, 6, 5, 1]),
]


def table(system, limit):
    best = [0] + [limit + 1] * limit
    for amount in range(1, limit + 1):
        for coin in system:
            if coin <= amount and best[amount - coin] + 1 < best[amount]:
                best[amount] = best[amount - coin] + 1
    return best


def largest_fitting(system, amount):
    """The coin greedy commits to. The system always ends in 1, so this always finds one."""
    for coin in system:
        if coin <= amount:
            return coin
    return 1


def greedy_coins(system, amount):
    used = 0
    for coin in system:
        used += amount // coin
        amount %= coin
    return used


header = f"{'system':<24}{'bad branches':>13}{'wrong answers':>15}{'first bad':>11}{'worst excess':>14}"
print(header)
for name, system in SYSTEMS:
    best = table(system, LIMIT)
    bad_branches = 0
    wrong_answers = 0
    first_bad = 0
    worst = 0
    for amount in range(1, LIMIT + 1):
        largest = largest_fitting(system, amount)
        if best[amount - largest] + 1 != best[amount]:
            bad_branches += 1
            if first_bad == 0:
                first_bad = amount
        excess = greedy_coins(system, amount) - best[amount]
        if excess > 0:
            wrong_answers += 1
        worst = max(worst, excess)
    first = "none" if first_bad == 0 else str(first_bad)
    print(f"{name:<24}{bad_branches:>13}{wrong_answers:>15}{first:>11}{worst:>14}")

print()
print(f"out of {LIMIT} amounts. Read the first two columns against each other:")
print("4 3 1 takes the wrong branch at one amount in a thousand and gets the")
print("wrong answer at a quarter of them. A bad branch is not one bad answer -")
print("greedy walks straight into the amount it just got wrong, and every")
print("amount that reduces to that one inherits the mistake.")
print()
print("the 'first bad' column is the smallest counterexample from the previous")
print("lesson, arrived at from the other direction: the first amount where the")
print("largest coin is not on any shortest path is the first amount where")
print("committing to it costs something.")
`,
          output: `system                   bad branches  wrong answers  first bad  worst excess
US coins                            0              0       none             0
US without the nickel              10            390         30             3
the textbook villain                1            249          6             1
all divisors of 30                  6            192         48             1
nine six five one                   4            440         11             2

out of 1000 amounts. Read the first two columns against each other:
4 3 1 takes the wrong branch at one amount in a thousand and gets the
wrong answer at a quarter of them. A bad branch is not one bad answer -
greedy walks straight into the amount it just got wrong, and every
amount that reduces to that one inherits the mistake.

the 'first bad' column is the smallest counterexample from the previous
lesson, arrived at from the other direction: the first amount where the
largest coin is not on any shortest path is the first amount where
committing to it costs something.`,
          explanation: "The first column counts the amounts where the largest coin is not on any shortest path; the second counts the amounts where greedy's total is too high. They are wildly different numbers, and the gap is the whole reason a greedy rule cannot be repaired by patching the cases you noticed. The 'first bad' column is the previous lesson's smallest counterexample, reached from the other direction.",
          alternates: [
            {
              lang: "javascript",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.

const LIMIT = 1000;

const SYSTEMS = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

function table(system, limit) {
  const best = new Array(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

/** The coin greedy commits to. The system always ends in 1, so this always finds one. */
function largestFitting(system, amount) {
  for (const coin of system) {
    if (coin <= amount) return coin;
  }
  return 1;
}

function greedyCoins(system, amount) {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

const pad = (s, w) => String(s).padStart(w);

console.log(
  "system".padEnd(24) + "bad branches".padStart(13) + "wrong answers".padStart(15) +
    "first bad".padStart(11) + "worst excess".padStart(14)
);
for (const [name, system] of SYSTEMS) {
  const best = table(system, LIMIT);
  let badBranches = 0;
  let wrongAnswers = 0;
  let firstBad = 0;
  let worst = 0;
  for (let amount = 1; amount <= LIMIT; amount++) {
    const largest = largestFitting(system, amount);
    if (best[amount - largest] + 1 !== best[amount]) {
      badBranches++;
      if (firstBad === 0) firstBad = amount;
    }
    const excess = greedyCoins(system, amount) - best[amount];
    if (excess > 0) wrongAnswers++;
    if (excess > worst) worst = excess;
  }
  const first = firstBad === 0 ? "none" : String(firstBad);
  console.log(
    name.padEnd(24) + pad(badBranches, 13) + pad(wrongAnswers, 15) + pad(first, 11) + pad(worst, 14)
  );
}

console.log();
console.log(\`out of \${LIMIT} amounts. Read the first two columns against each other:\`);
console.log("4 3 1 takes the wrong branch at one amount in a thousand and gets the");
console.log("wrong answer at a quarter of them. A bad branch is not one bad answer -");
console.log("greedy walks straight into the amount it just got wrong, and every");
console.log("amount that reduces to that one inherits the mistake.");
console.log();
console.log("the 'first bad' column is the smallest counterexample from the previous");
console.log("lesson, arrived at from the other direction: the first amount where the");
console.log("largest coin is not on any shortest path is the first amount where");
console.log("committing to it costs something.");
`,
            },
            {
              lang: "typescript",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.

const LIMIT = 1000;

const SYSTEMS: Array<[string, number[]]> = [
  ["US coins", [25, 10, 5, 1]],
  ["US without the nickel", [25, 10, 1]],
  ["the textbook villain", [4, 3, 1]],
  ["all divisors of 30", [30, 24, 12, 6, 3, 1]],
  ["nine six five one", [9, 6, 5, 1]],
];

function table(system: number[], limit: number): number[] {
  const best: number[] = new Array<number>(limit + 1).fill(limit + 1);
  best[0] = 0;
  for (let amount = 1; amount <= limit; amount++) {
    for (const coin of system) {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1;
      }
    }
  }
  return best;
}

/** The coin greedy commits to. The system always ends in 1, so this always finds one. */
function largestFitting(system: number[], amount: number): number {
  for (const coin of system) {
    if (coin <= amount) return coin;
  }
  return 1;
}

function greedyCoins(system: number[], amount: number): number {
  let used = 0;
  for (const coin of system) {
    used += Math.floor(amount / coin);
    amount %= coin;
  }
  return used;
}

const pad = (s: string | number, w: number): string => String(s).padStart(w);

console.log(
  "system".padEnd(24) + "bad branches".padStart(13) + "wrong answers".padStart(15) +
    "first bad".padStart(11) + "worst excess".padStart(14)
);
for (const [name, system] of SYSTEMS) {
  const best = table(system, LIMIT);
  let badBranches = 0;
  let wrongAnswers = 0;
  let firstBad = 0;
  let worst = 0;
  for (let amount = 1; amount <= LIMIT; amount++) {
    const largest = largestFitting(system, amount);
    if (best[amount - largest] + 1 !== best[amount]) {
      badBranches++;
      if (firstBad === 0) firstBad = amount;
    }
    const excess = greedyCoins(system, amount) - best[amount];
    if (excess > 0) wrongAnswers++;
    if (excess > worst) worst = excess;
  }
  const first = firstBad === 0 ? "none" : String(firstBad);
  console.log(
    name.padEnd(24) + pad(badBranches, 13) + pad(wrongAnswers, 15) + pad(first, 11) + pad(worst, 14)
  );
}

console.log();
console.log(\`out of \${LIMIT} amounts. Read the first two columns against each other:\`);
console.log("4 3 1 takes the wrong branch at one amount in a thousand and gets the");
console.log("wrong answer at a quarter of them. A bad branch is not one bad answer -");
console.log("greedy walks straight into the amount it just got wrong, and every");
console.log("amount that reduces to that one inherits the mistake.");
console.log();
console.log("the 'first bad' column is the smallest counterexample from the previous");
console.log("lesson, arrived at from the other direction: the first amount where the");
console.log("largest coin is not on any shortest path is the first amount where");
console.log("committing to it costs something.");
`,
            },
            {
              lang: "java",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.
import java.util.Arrays;

public class Main {
    static final int LIMIT = 1000;

    static final String[] NAMES = {
        "US coins", "US without the nickel", "the textbook villain",
        "all divisors of 30", "nine six five one",
    };

    static final int[][] SYSTEMS = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    static int[] table(int[] system, int limit) {
        int[] best = new int[limit + 1];
        Arrays.fill(best, limit + 1);
        best[0] = 0;
        for (int amount = 1; amount <= limit; amount++) {
            for (int coin : system) {
                if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                    best[amount] = best[amount - coin] + 1;
                }
            }
        }
        return best;
    }

    /** The coin greedy commits to. The system always ends in 1, so this always finds one. */
    static int largestFitting(int[] system, int amount) {
        for (int coin : system) {
            if (coin <= amount) return coin;
        }
        return 1;
    }

    static int greedyCoins(int[] system, int amount) {
        int used = 0;
        for (int coin : system) {
            used += amount / coin;
            amount %= coin;
        }
        return used;
    }

    public static void main(String[] args) {
        System.out.printf("%-24s%13s%15s%11s%14s%n",
            "system", "bad branches", "wrong answers", "first bad", "worst excess");
        for (int s = 0; s < SYSTEMS.length; s++) {
            int[] system = SYSTEMS[s];
            int[] best = table(system, LIMIT);
            int badBranches = 0;
            int wrongAnswers = 0;
            int firstBad = 0;
            int worst = 0;
            for (int amount = 1; amount <= LIMIT; amount++) {
                int largest = largestFitting(system, amount);
                if (best[amount - largest] + 1 != best[amount]) {
                    badBranches++;
                    if (firstBad == 0) firstBad = amount;
                }
                int excess = greedyCoins(system, amount) - best[amount];
                if (excess > 0) wrongAnswers++;
                if (excess > worst) worst = excess;
            }
            String first = firstBad == 0 ? "none" : Integer.toString(firstBad);
            System.out.printf("%-24s%13d%15d%11s%14d%n",
                NAMES[s], badBranches, wrongAnswers, first, worst);
        }

        System.out.println();
        System.out.printf("out of %d amounts. Read the first two columns against each other:%n", LIMIT);
        System.out.println("4 3 1 takes the wrong branch at one amount in a thousand and gets the");
        System.out.println("wrong answer at a quarter of them. A bad branch is not one bad answer -");
        System.out.println("greedy walks straight into the amount it just got wrong, and every");
        System.out.println("amount that reduces to that one inherits the mistake.");
        System.out.println();
        System.out.println("the 'first bad' column is the smallest counterexample from the previous");
        System.out.println("lesson, arrived at from the other direction: the first amount where the");
        System.out.println("largest coin is not on any shortest path is the first amount where");
        System.out.println("committing to it costs something.");
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

const int LIMIT = 1000;

std::vector<int> table(const std::vector<int>& system, int limit) {
    std::vector<int> best(limit + 1, limit + 1);
    best[0] = 0;
    for (int amount = 1; amount <= limit; ++amount) {
        for (int coin : system) {
            if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
                best[amount] = best[amount - coin] + 1;
            }
        }
    }
    return best;
}

/** The coin greedy commits to. The system always ends in 1, so this always finds one. */
int largest_fitting(const std::vector<int>& system, int amount) {
    for (int coin : system) {
        if (coin <= amount) return coin;
    }
    return 1;
}

int greedy_coins(const std::vector<int>& system, int amount) {
    int used = 0;
    for (int coin : system) {
        used += amount / coin;
        amount %= coin;
    }
    return used;
}

int main() {
    const std::vector<std::string> names = {
        "US coins", "US without the nickel", "the textbook villain",
        "all divisors of 30", "nine six five one",
    };
    const std::vector<std::vector<int>> systems = {
        {25, 10, 5, 1},
        {25, 10, 1},
        {4, 3, 1},
        {30, 24, 12, 6, 3, 1},
        {9, 6, 5, 1},
    };

    std::cout << std::left << std::setw(24) << "system" << std::right << std::setw(13)
              << "bad branches" << std::setw(15) << "wrong answers" << std::setw(11)
              << "first bad" << std::setw(14) << "worst excess" << "\\n";
    for (size_t s = 0; s < systems.size(); ++s) {
        const std::vector<int>& system = systems[s];
        std::vector<int> best = table(system, LIMIT);
        int bad_branches = 0;
        int wrong_answers = 0;
        int first_bad = 0;
        int worst = 0;
        for (int amount = 1; amount <= LIMIT; ++amount) {
            int largest = largest_fitting(system, amount);
            if (best[amount - largest] + 1 != best[amount]) {
                bad_branches++;
                if (first_bad == 0) first_bad = amount;
            }
            int excess = greedy_coins(system, amount) - best[amount];
            if (excess > 0) wrong_answers++;
            if (excess > worst) worst = excess;
        }
        std::string first = first_bad == 0 ? "none" : std::to_string(first_bad);
        std::cout << std::left << std::setw(24) << names[s] << std::right << std::setw(13)
                  << bad_branches << std::setw(15) << wrong_answers << std::setw(11)
                  << first << std::setw(14) << worst << "\\n";
    }

    std::cout << "\\n";
    std::cout << "out of " << LIMIT << " amounts. Read the first two columns against each other:\\n";
    std::cout << "4 3 1 takes the wrong branch at one amount in a thousand and gets the\\n";
    std::cout << "wrong answer at a quarter of them. A bad branch is not one bad answer -\\n";
    std::cout << "greedy walks straight into the amount it just got wrong, and every\\n";
    std::cout << "amount that reduces to that one inherits the mistake.\\n";
    std::cout << "\\n";
    std::cout << "the 'first bad' column is the smallest counterexample from the previous\\n";
    std::cout << "lesson, arrived at from the other direction: the first amount where the\\n";
    std::cout << "largest coin is not on any shortest path is the first amount where\\n";
    std::cout << "committing to it costs something.\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.

const LIMIT: i32 = 1000;

fn table(system: &[i32], limit: i32) -> Vec<i32> {
    let mut best = vec![limit + 1; (limit + 1) as usize];
    best[0] = 0;
    for amount in 1..=limit {
        for &coin in system {
            if coin <= amount && best[(amount - coin) as usize] + 1 < best[amount as usize] {
                best[amount as usize] = best[(amount - coin) as usize] + 1;
            }
        }
    }
    best
}

/// The coin greedy commits to. The system always ends in 1, so this always finds one.
fn largest_fitting(system: &[i32], amount: i32) -> i32 {
    for &coin in system {
        if coin <= amount {
            return coin;
        }
    }
    1
}

fn greedy_coins(system: &[i32], mut amount: i32) -> i32 {
    let mut used = 0;
    for &coin in system {
        used += amount / coin;
        amount %= coin;
    }
    used
}

fn main() {
    let systems: Vec<(&str, Vec<i32>)> = vec![
        ("US coins", vec![25, 10, 5, 1]),
        ("US without the nickel", vec![25, 10, 1]),
        ("the textbook villain", vec![4, 3, 1]),
        ("all divisors of 30", vec![30, 24, 12, 6, 3, 1]),
        ("nine six five one", vec![9, 6, 5, 1]),
    ];

    println!("{:<24}{:>13}{:>15}{:>11}{:>14}",
             "system", "bad branches", "wrong answers", "first bad", "worst excess");
    for (name, system) in &systems {
        let best = table(system, LIMIT);
        let mut bad_branches = 0;
        let mut wrong_answers = 0;
        let mut first_bad = 0;
        let mut worst = 0;
        for amount in 1..=LIMIT {
            let largest = largest_fitting(system, amount);
            if best[(amount - largest) as usize] + 1 != best[amount as usize] {
                bad_branches += 1;
                if first_bad == 0 {
                    first_bad = amount;
                }
            }
            let excess = greedy_coins(system, amount) - best[amount as usize];
            if excess > 0 {
                wrong_answers += 1;
            }
            if excess > worst {
                worst = excess;
            }
        }
        let first = if first_bad == 0 { "none".to_string() } else { first_bad.to_string() };
        println!("{:<24}{:>13}{:>15}{:>11}{:>14}",
                 name, bad_branches, wrong_answers, first, worst);
    }

    println!();
    println!("out of {} amounts. Read the first two columns against each other:", LIMIT);
    println!("4 3 1 takes the wrong branch at one amount in a thousand and gets the");
    println!("wrong answer at a quarter of them. A bad branch is not one bad answer -");
    println!("greedy walks straight into the amount it just got wrong, and every");
    println!("amount that reduces to that one inherits the mistake.");
    println!();
    println!("the 'first bad' column is the smallest counterexample from the previous");
    println!("lesson, arrived at from the other direction: the first amount where the");
    println!("largest coin is not on any shortest path is the first amount where");
    println!("committing to it costs something.");
}
`,
            },
            {
              lang: "go",
              code: `// Greedy and the table are the same recurrence with one difference.
//
//   greedy:  coins(a) = 1 + coins(a - the largest coin that fits)
//   table:   coins(a) = 1 + min over every coin c <= a of coins(a - c)
//
// Greedy commits to one branch. The table keeps all of them. So "greedy is
// optimal for this system" says exactly one thing: the branch greedy commits to
// is always one of the minimising ones. That is checkable amount by amount, and
// it is what the columns below count.
package main

import (
	"fmt"
	"strconv"
)

const limitAmount = 1000

func table(system []int, limit int) []int {
	best := make([]int, limit+1)
	for i := range best {
		best[i] = limit + 1
	}
	best[0] = 0
	for amount := 1; amount <= limit; amount++ {
		for _, coin := range system {
			if coin <= amount && best[amount-coin]+1 < best[amount] {
				best[amount] = best[amount-coin] + 1
			}
		}
	}
	return best
}

// The coin greedy commits to. The system always ends in 1, so this always finds one.
func largestFitting(system []int, amount int) int {
	for _, coin := range system {
		if coin <= amount {
			return coin
		}
	}
	return 1
}

func greedyCoins(system []int, amount int) int {
	used := 0
	for _, coin := range system {
		used += amount / coin
		amount %= coin
	}
	return used
}

func main() {
	names := []string{
		"US coins", "US without the nickel", "the textbook villain",
		"all divisors of 30", "nine six five one",
	}
	systems := [][]int{
		{25, 10, 5, 1},
		{25, 10, 1},
		{4, 3, 1},
		{30, 24, 12, 6, 3, 1},
		{9, 6, 5, 1},
	}

	fmt.Printf("%-24s%13s%15s%11s%14s\\n",
		"system", "bad branches", "wrong answers", "first bad", "worst excess")
	for s, system := range systems {
		best := table(system, limitAmount)
		badBranches := 0
		wrongAnswers := 0
		firstBad := 0
		worst := 0
		for amount := 1; amount <= limitAmount; amount++ {
			largest := largestFitting(system, amount)
			if best[amount-largest]+1 != best[amount] {
				badBranches++
				if firstBad == 0 {
					firstBad = amount
				}
			}
			excess := greedyCoins(system, amount) - best[amount]
			if excess > 0 {
				wrongAnswers++
			}
			if excess > worst {
				worst = excess
			}
		}
		first := "none"
		if firstBad != 0 {
			first = strconv.Itoa(firstBad)
		}
		fmt.Printf("%-24s%13d%15d%11s%14d\\n", names[s], badBranches, wrongAnswers, first, worst)
	}

	fmt.Println()
	fmt.Printf("out of %d amounts. Read the first two columns against each other:\\n", limitAmount)
	fmt.Println("4 3 1 takes the wrong branch at one amount in a thousand and gets the")
	fmt.Println("wrong answer at a quarter of them. A bad branch is not one bad answer -")
	fmt.Println("greedy walks straight into the amount it just got wrong, and every")
	fmt.Println("amount that reduces to that one inherits the mistake.")
	fmt.Println()
	fmt.Println("the 'first bad' column is the smallest counterexample from the previous")
	fmt.Println("lesson, arrived at from the other direction: the first amount where the")
	fmt.Println("largest coin is not on any shortest path is the first amount where")
	fmt.Println("committing to it costs something.")
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "greedy-as-a-bound",
      heading: "When greedy is wrong, it is often the bound",
      body: [
        "There is a third use for greedy, and it survives the rule being wrong.",
        "The 0/1 knapsack from lesson 1 has a relaxed twin: the fractional version, where items can be cut. Greedy by density solves the relaxed one exactly — that was lesson 1's whole point — and because every 0/1 packing is also a legal fractional packing, the relaxed answer can only be larger. So one sort gives you an upper bound on an optimum you have not computed.",
        "The same sort gives a lower bound. Greedy's own 0/1 answer is a real packing, so it is achievable; take the better of it and the single most valuable item that fits and the result is guaranteed to be at least half the optimum. Two numbers, one sort, and the optimum is somewhere between them.",
        "That is what a branch-and-bound search runs on. It is also why an approximate answer with a bound attached is a different kind of object from an approximate answer without one: it comes with the size of its own error.",
        "The bounds are worth measuring rather than trusting. Over twenty thousand random instances the half guarantee is never violated — the worst case seen is 0.5652 — and the fractional bound lands within ten percent of the optimum about two thirds of the time. It can also be terrible: when one heavy item dominates and nothing else fits, the relaxation is over six times the achievable value. A bound is only useful if you know when it is loose.",
      ],
      examples: [
        {
          id: "relaxation-as-bound",
          title: "Boxing in an optimum you have not computed",
          lang: "python",
          code: `# There is a third thing greedy is good for, once you know it is not optimal.
#
# The fractional relaxation - the version of the problem where items can be cut
# - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
# because every 0/1 packing is also a fractional one. So greedy hands you an
# upper bound on an optimum you have not computed, out of one sort.
#
# It hands you a lower bound too. Take the better of greedy-by-density and the
# single most valuable item that fits, and you are guaranteed at least half the
# optimum - a fact worth checking rather than repeating.

ITEMS = [
    ("copper", 60, 10),
    ("silver", 100, 20),
    ("gold", 120, 30),
]
CAPACITY = 50


def by_density(items):
    """Densest first, compared with integers so every language agrees on ties."""
    order = list(items)
    for i in range(1, len(order)):
        j = i
        while j > 0 and order[j][1] * order[j - 1][2] > order[j - 1][1] * order[j][2]:
            order[j - 1], order[j] = order[j], order[j - 1]
            j -= 1
    return order


def greedy_01(items, capacity):
    """Densest first, whole items only."""
    taken = []
    left = capacity
    for item in by_density(items):
        if item[2] <= left:
            taken.append(item)
            left -= item[2]
    return taken


def best_single(items, capacity):
    best = None
    for item in items:
        if item[2] <= capacity and (best is None or item[1] > best[1]):
            best = item
    return best


def fractional_bound(items, capacity):
    """The exact fractional optimum, as a fraction, so no rounding creeps in."""
    total = 0
    left = capacity
    for _, value, weight in by_density(items):
        if weight <= left:
            total += value
            left -= weight
        else:
            return total * weight + left * value, weight
    return total, 1


def optimum_01(items, capacity):
    best = [0] * (capacity + 1)
    for _, value, weight in items:
        for room in range(capacity, weight - 1, -1):
            if best[room - weight] + value > best[room]:
                best[room] = best[room - weight] + value
    return best[capacity]


greedy = greedy_01(ITEMS, CAPACITY)
greedy_value = sum(item[1] for item in greedy)
single = best_single(ITEMS, CAPACITY)
num, den = fractional_bound(ITEMS, CAPACITY)
optimum = optimum_01(ITEMS, CAPACITY)
lower = greedy_value if greedy_value > single[1] else single[1]

print(f"capacity {CAPACITY}, items " + ", ".join(f"{n} {v}/{w}" for n, v, w in ITEMS))
print()
print(f"{'greedy by density (0/1)':<28}{greedy_value:>6}   {' '.join(i[0] for i in greedy)}")
print(f"{'best single item':<28}{single[1]:>6}   {single[0]}")
print(f"{'true 0/1 optimum':<28}{optimum:>6}   from a table over 50 capacities")
print(f"{'fractional bound':<28}{num // den:>6}   greedy on the relaxed problem")
print()
print(f"the optimum is boxed in: {lower} <= {optimum} <= {num // den},")
print("and both ends came out of sorting once.")

# The half guarantee, and how loose the upper bound gets, on random instances.
seed = 1


def rand(n):
    global seed
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed // 65536 % n


TRIALS = 20000
worst_greedy = (1, 1)
worst_lower = (1, 1)
worst_upper = (1, 1)
close_enough = 0
for _ in range(TRIALS):
    items = [("", 1 + rand(60), 1 + rand(30)) for _ in range(8)]
    capacity = 20 + rand(40)
    optimum = optimum_01(items, capacity)
    greedy_value = sum(item[1] for item in greedy_01(items, capacity))
    single = best_single(items, capacity)
    single_value = 0 if single is None else single[1]
    lower = greedy_value if greedy_value > single_value else single_value
    num, den = fractional_bound(items, capacity)
    # Fractions compared by cross-multiplying, so nothing here depends on floats.
    if greedy_value * worst_greedy[1] < worst_greedy[0] * optimum:
        worst_greedy = (greedy_value, optimum)
    if lower * worst_lower[1] < worst_lower[0] * optimum:
        worst_lower = (lower, optimum)
    if num * worst_upper[1] > worst_upper[0] * (optimum * den):
        worst_upper = (num, optimum * den)
    if 10 * num <= 11 * optimum * den:
        close_enough += 1

print()
print(f"over {TRIALS} random eight-item instances:")
print(f"  greedy by density alone, worst      {worst_greedy[0] / worst_greedy[1]:>8.4f} of the optimum")
print(f"  with the best single item, worst    {worst_lower[0] / worst_lower[1]:>8.4f} of the optimum")
print(f"  the fractional bound, worst         {worst_upper[0] / worst_upper[1]:>8.4f} times the optimum")
print(f"  the bound within 10% of the optimum {close_enough:>8} times")
`,
          output: `capacity 50, items copper 60/10, silver 100/20, gold 120/30

greedy by density (0/1)        160   copper silver
best single item               120   gold
true 0/1 optimum               220   from a table over 50 capacities
fractional bound               240   greedy on the relaxed problem

the optimum is boxed in: 160 <= 220 <= 240,
and both ends came out of sorting once.

over 20000 random eight-item instances:
  greedy by density alone, worst        0.3333 of the optimum
  with the best single item, worst      0.5652 of the optimum
  the fractional bound, worst           6.4872 times the optimum
  the bound within 10% of the optimum    12847 times`,
          explanation: "The four lines at the top are the same knapsack lesson 1 opened with, read differently: 160 is achievable, 240 is unreachable, and the answer is between them before any table is built. The sweep then checks the guarantee rather than repeating it — 0.5652 is the worst ratio seen against a promised 0.5 — and records where the upper bound stops being useful, which is when one item is heavy enough to dominate the relaxation and nothing else fits beside it.",
          alternates: [
            {
              lang: "javascript",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.

const ITEMS = [
  ["copper", 60, 10],
  ["silver", 100, 20],
  ["gold", 120, 30],
];
const CAPACITY = 50;

/** Densest first, compared with integers so every language agrees on ties. */
function byDensity(items) {
  const order = items.map((it) => it);
  for (let i = 1; i < order.length; i++) {
    let j = i;
    while (j > 0 && order[j][1] * order[j - 1][2] > order[j - 1][1] * order[j][2]) {
      const swap = order[j - 1];
      order[j - 1] = order[j];
      order[j] = swap;
      j--;
    }
  }
  return order;
}

/** Densest first, whole items only. */
function greedy01(items, capacity) {
  const taken = [];
  let left = capacity;
  for (const item of byDensity(items)) {
    if (item[2] <= left) {
      taken.push(item);
      left -= item[2];
    }
  }
  return taken;
}

function bestSingle(items, capacity) {
  let best = null;
  for (const item of items) {
    if (item[2] <= capacity && (best === null || item[1] > best[1])) best = item;
  }
  return best;
}

/** The exact fractional optimum, as a fraction, so no rounding creeps in. */
function fractionalBound(items, capacity) {
  let total = 0;
  let left = capacity;
  for (const [, value, weight] of byDensity(items)) {
    if (weight <= left) {
      total += value;
      left -= weight;
    } else {
      return [total * weight + left * value, weight];
    }
  }
  return [total, 1];
}

function optimum01(items, capacity) {
  const best = new Array(capacity + 1).fill(0);
  for (const [, value, weight] of items) {
    for (let room = capacity; room >= weight; room--) {
      if (best[room - weight] + value > best[room]) best[room] = best[room - weight] + value;
    }
  }
  return best[capacity];
}

const pad = (s, w) => String(s).padStart(w);
const sum = (items) => items.reduce((n, it) => n + it[1], 0);

{
  const greedy = greedy01(ITEMS, CAPACITY);
  const greedyValue = sum(greedy);
  const single = bestSingle(ITEMS, CAPACITY);
  if (single === null) throw new Error("nothing fits");
  const [num, den] = fractionalBound(ITEMS, CAPACITY);
  const optimum = optimum01(ITEMS, CAPACITY);
  const lower = greedyValue > single[1] ? greedyValue : single[1];

  console.log(
    \`capacity \${CAPACITY}, items \` + ITEMS.map(([n, v, w]) => \`\${n} \${v}/\${w}\`).join(", ")
  );
  console.log();
  console.log("greedy by density (0/1)".padEnd(28) + pad(greedyValue, 6) + "   " +
    greedy.map((i) => i[0]).join(" "));
  console.log("best single item".padEnd(28) + pad(single[1], 6) + "   " + single[0]);
  console.log("true 0/1 optimum".padEnd(28) + pad(optimum, 6) + "   from a table over 50 capacities");
  console.log("fractional bound".padEnd(28) + pad(Math.floor(num / den), 6) +
    "   greedy on the relaxed problem");
  console.log();
  console.log(\`the optimum is boxed in: \${lower} <= \${optimum} <= \${Math.floor(num / den)},\`);
  console.log("and both ends came out of sorting once.");
}

// The half guarantee, and how loose the upper bound gets, on random instances.
// BigInt because seed * 1103515245 runs past what a double can hold exactly.
let seed = 1n;

function rand(n) {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 20000;
let worstGreedy = [1, 1];
let worstLower = [1, 1];
let worstUpper = [1, 1];
let closeEnough = 0;
for (let t = 0; t < TRIALS; t++) {
  const items = [];
  for (let i = 0; i < 8; i++) items.push(["", 1 + rand(60), 1 + rand(30)]);
  const capacity = 20 + rand(40);
  const optimum = optimum01(items, capacity);
  const greedyValue = sum(greedy01(items, capacity));
  const single = bestSingle(items, capacity);
  const singleValue = single === null ? 0 : single[1];
  const lower = greedyValue > singleValue ? greedyValue : singleValue;
  const [num, den] = fractionalBound(items, capacity);
  // Fractions compared by cross-multiplying, so nothing here depends on floats.
  if (greedyValue * worstGreedy[1] < worstGreedy[0] * optimum) worstGreedy = [greedyValue, optimum];
  if (lower * worstLower[1] < worstLower[0] * optimum) worstLower = [lower, optimum];
  if (num * worstUpper[1] > worstUpper[0] * (optimum * den)) worstUpper = [num, optimum * den];
  if (10 * num <= 11 * optimum * den) closeEnough++;
}

const ratio = ([a, b]) => (a / b).toFixed(4).padStart(8);

console.log();
console.log(\`over \${TRIALS} random eight-item instances:\`);
console.log(\`  greedy by density alone, worst      \${ratio(worstGreedy)} of the optimum\`);
console.log(\`  with the best single item, worst    \${ratio(worstLower)} of the optimum\`);
console.log(\`  the fractional bound, worst         \${ratio(worstUpper)} times the optimum\`);
console.log(\`  the bound within 10% of the optimum \${pad(closeEnough, 8)} times\`);
`,
            },
            {
              lang: "typescript",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.

type Item = [name: string, value: number, weight: number];

const ITEMS: Item[] = [
  ["copper", 60, 10],
  ["silver", 100, 20],
  ["gold", 120, 30],
];
const CAPACITY = 50;

/** Densest first, compared with integers so every language agrees on ties. */
function byDensity(items: Item[]): Item[] {
  const order = items.map((it) => it);
  for (let i = 1; i < order.length; i++) {
    let j = i;
    while (j > 0 && order[j][1] * order[j - 1][2] > order[j - 1][1] * order[j][2]) {
      const swap = order[j - 1];
      order[j - 1] = order[j];
      order[j] = swap;
      j--;
    }
  }
  return order;
}

/** Densest first, whole items only. */
function greedy01(items: Item[], capacity: number): Item[] {
  const taken: Item[] = [];
  let left = capacity;
  for (const item of byDensity(items)) {
    if (item[2] <= left) {
      taken.push(item);
      left -= item[2];
    }
  }
  return taken;
}

function bestSingle(items: Item[], capacity: number): Item | null {
  let best: Item | null = null;
  for (const item of items) {
    if (item[2] <= capacity && (best === null || item[1] > best[1])) best = item;
  }
  return best;
}

/** The exact fractional optimum, as a fraction, so no rounding creeps in. */
function fractionalBound(items: Item[], capacity: number): [number, number] {
  let total = 0;
  let left = capacity;
  for (const [, value, weight] of byDensity(items)) {
    if (weight <= left) {
      total += value;
      left -= weight;
    } else {
      return [total * weight + left * value, weight];
    }
  }
  return [total, 1];
}

function optimum01(items: Item[], capacity: number): number {
  const best: number[] = new Array<number>(capacity + 1).fill(0);
  for (const [, value, weight] of items) {
    for (let room = capacity; room >= weight; room--) {
      if (best[room - weight] + value > best[room]) best[room] = best[room - weight] + value;
    }
  }
  return best[capacity];
}

const pad = (s: string | number, w: number): string => String(s).padStart(w);
const sum = (items: Item[]): number => items.reduce((n, it) => n + it[1], 0);

{
  const greedy = greedy01(ITEMS, CAPACITY);
  const greedyValue = sum(greedy);
  const single = bestSingle(ITEMS, CAPACITY);
  if (single === null) throw new Error("nothing fits");
  const [num, den] = fractionalBound(ITEMS, CAPACITY);
  const optimum = optimum01(ITEMS, CAPACITY);
  const lower = greedyValue > single[1] ? greedyValue : single[1];

  console.log(
    \`capacity \${CAPACITY}, items \` + ITEMS.map(([n, v, w]) => \`\${n} \${v}/\${w}\`).join(", ")
  );
  console.log();
  console.log("greedy by density (0/1)".padEnd(28) + pad(greedyValue, 6) + "   " +
    greedy.map((i) => i[0]).join(" "));
  console.log("best single item".padEnd(28) + pad(single[1], 6) + "   " + single[0]);
  console.log("true 0/1 optimum".padEnd(28) + pad(optimum, 6) + "   from a table over 50 capacities");
  console.log("fractional bound".padEnd(28) + pad(Math.floor(num / den), 6) +
    "   greedy on the relaxed problem");
  console.log();
  console.log(\`the optimum is boxed in: \${lower} <= \${optimum} <= \${Math.floor(num / den)},\`);
  console.log("and both ends came out of sorting once.");
}

// The half guarantee, and how loose the upper bound gets, on random instances.
// BigInt because seed * 1103515245 runs past what a double can hold exactly.
let seed = 1n;

function rand(n: number): number {
  seed = (seed * 1103515245n + 12345n) % 2147483648n;
  return Number((seed / 65536n) % BigInt(n));
}

const TRIALS = 20000;
let worstGreedy: [number, number] = [1, 1];
let worstLower: [number, number] = [1, 1];
let worstUpper: [number, number] = [1, 1];
let closeEnough = 0;
for (let t = 0; t < TRIALS; t++) {
  const items: Item[] = [];
  for (let i = 0; i < 8; i++) items.push(["", 1 + rand(60), 1 + rand(30)]);
  const capacity = 20 + rand(40);
  const optimum = optimum01(items, capacity);
  const greedyValue = sum(greedy01(items, capacity));
  const single = bestSingle(items, capacity);
  const singleValue = single === null ? 0 : single[1];
  const lower = greedyValue > singleValue ? greedyValue : singleValue;
  const [num, den] = fractionalBound(items, capacity);
  // Fractions compared by cross-multiplying, so nothing here depends on floats.
  if (greedyValue * worstGreedy[1] < worstGreedy[0] * optimum) worstGreedy = [greedyValue, optimum];
  if (lower * worstLower[1] < worstLower[0] * optimum) worstLower = [lower, optimum];
  if (num * worstUpper[1] > worstUpper[0] * (optimum * den)) worstUpper = [num, optimum * den];
  if (10 * num <= 11 * optimum * den) closeEnough++;
}

const ratio = ([a, b]: [number, number]): string => (a / b).toFixed(4).padStart(8);

console.log();
console.log(\`over \${TRIALS} random eight-item instances:\`);
console.log(\`  greedy by density alone, worst      \${ratio(worstGreedy)} of the optimum\`);
console.log(\`  with the best single item, worst    \${ratio(worstLower)} of the optimum\`);
console.log(\`  the fractional bound, worst         \${ratio(worstUpper)} times the optimum\`);
console.log(\`  the bound within 10% of the optimum \${pad(closeEnough, 8)} times\`);
`,
            },
            {
              lang: "java",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.
import java.util.ArrayList;
import java.util.List;

public class Main {
    record Item(String name, int value, int weight) {}

    static final List<Item> ITEMS = List.of(
        new Item("copper", 60, 10),
        new Item("silver", 100, 20),
        new Item("gold", 120, 30));
    static final int CAPACITY = 50;

    /** Densest first, compared with integers so every language agrees on ties. */
    static List<Item> byDensity(List<Item> items) {
        List<Item> order = new ArrayList<>(items);
        for (int i = 1; i < order.size(); i++) {
            int j = i;
            while (j > 0 && order.get(j).value() * order.get(j - 1).weight()
                          > order.get(j - 1).value() * order.get(j).weight()) {
                Item swap = order.get(j - 1);
                order.set(j - 1, order.get(j));
                order.set(j, swap);
                j--;
            }
        }
        return order;
    }

    /** Densest first, whole items only. */
    static List<Item> greedy01(List<Item> items, int capacity) {
        List<Item> taken = new ArrayList<>();
        int left = capacity;
        for (Item item : byDensity(items)) {
            if (item.weight() <= left) {
                taken.add(item);
                left -= item.weight();
            }
        }
        return taken;
    }

    static Item bestSingle(List<Item> items, int capacity) {
        Item best = null;
        for (Item item : items) {
            if (item.weight() <= capacity && (best == null || item.value() > best.value())) {
                best = item;
            }
        }
        return best;
    }

    /** The exact fractional optimum, as a fraction, so no rounding creeps in. */
    static long[] fractionalBound(List<Item> items, int capacity) {
        long total = 0;
        int left = capacity;
        for (Item item : byDensity(items)) {
            if (item.weight() <= left) {
                total += item.value();
                left -= item.weight();
            } else {
                return new long[] {total * item.weight() + (long) left * item.value(),
                                   item.weight()};
            }
        }
        return new long[] {total, 1};
    }

    static int optimum01(List<Item> items, int capacity) {
        int[] best = new int[capacity + 1];
        for (Item item : items) {
            for (int room = capacity; room >= item.weight(); room--) {
                if (best[room - item.weight()] + item.value() > best[room]) {
                    best[room] = best[room - item.weight()] + item.value();
                }
            }
        }
        return best[capacity];
    }

    static int sum(List<Item> items) {
        int total = 0;
        for (Item item : items) total += item.value();
        return total;
    }

    static String names(List<Item> items) {
        StringBuilder sb = new StringBuilder();
        for (Item item : items) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(item.name());
        }
        return sb.toString();
    }

    // A deterministic generator, so the sweep is reproducible and the numbers it
    // reports are the same ones for every reader.
    static long seed = 1;

    static int rand(int n) {
        seed = (seed * 1103515245L + 12345L) % 2147483648L;
        return (int) (seed / 65536 % n);
    }

    public static void main(String[] args) {
        List<Item> greedy = greedy01(ITEMS, CAPACITY);
        int greedyValue = sum(greedy);
        Item single = bestSingle(ITEMS, CAPACITY);
        if (single == null) throw new IllegalStateException("nothing fits");
        long[] bound = fractionalBound(ITEMS, CAPACITY);
        int optimum = optimum01(ITEMS, CAPACITY);
        int lower = Math.max(greedyValue, single.value());

        StringBuilder line = new StringBuilder("capacity " + CAPACITY + ", items ");
        for (int i = 0; i < ITEMS.size(); i++) {
            if (i > 0) line.append(", ");
            line.append(ITEMS.get(i).name()).append(' ')
                .append(ITEMS.get(i).value()).append('/').append(ITEMS.get(i).weight());
        }
        System.out.println(line);
        System.out.println();
        System.out.printf("%-28s%6d   %s%n", "greedy by density (0/1)", greedyValue, names(greedy));
        System.out.printf("%-28s%6d   %s%n", "best single item", single.value(), single.name());
        System.out.printf("%-28s%6d   from a table over 50 capacities%n", "true 0/1 optimum", optimum);
        System.out.printf("%-28s%6d   greedy on the relaxed problem%n",
            "fractional bound", bound[0] / bound[1]);
        System.out.println();
        System.out.printf("the optimum is boxed in: %d <= %d <= %d,%n",
            lower, optimum, bound[0] / bound[1]);
        System.out.println("and both ends came out of sorting once.");

        // The half guarantee, and how loose the upper bound gets, on random
        // instances.
        final int trials = 20000;
        long[] worstGreedy = {1, 1};
        long[] worstLower = {1, 1};
        long[] worstUpper = {1, 1};
        int closeEnough = 0;
        for (int t = 0; t < trials; t++) {
            List<Item> items = new ArrayList<>();
            for (int i = 0; i < 8; i++) items.add(new Item("", 1 + rand(60), 1 + rand(30)));
            int capacity = 20 + rand(40);
            long trialOptimum = optimum01(items, capacity);
            long value = sum(greedy01(items, capacity));
            Item one = bestSingle(items, capacity);
            long oneValue = one == null ? 0 : one.value();
            long trialLower = Math.max(value, oneValue);
            long[] frac = fractionalBound(items, capacity);
            // Fractions compared by cross-multiplying, so nothing here depends
            // on floats.
            if (value * worstGreedy[1] < worstGreedy[0] * trialOptimum) {
                worstGreedy = new long[] {value, trialOptimum};
            }
            if (trialLower * worstLower[1] < worstLower[0] * trialOptimum) {
                worstLower = new long[] {trialLower, trialOptimum};
            }
            if (frac[0] * worstUpper[1] > worstUpper[0] * (trialOptimum * frac[1])) {
                worstUpper = new long[] {frac[0], trialOptimum * frac[1]};
            }
            if (10 * frac[0] <= 11 * trialOptimum * frac[1]) closeEnough++;
        }

        System.out.println();
        System.out.printf("over %d random eight-item instances:%n", trials);
        System.out.printf("  greedy by density alone, worst      %8.4f of the optimum%n",
            (double) worstGreedy[0] / worstGreedy[1]);
        System.out.printf("  with the best single item, worst    %8.4f of the optimum%n",
            (double) worstLower[0] / worstLower[1]);
        System.out.printf("  the fractional bound, worst         %8.4f times the optimum%n",
            (double) worstUpper[0] / worstUpper[1]);
        System.out.printf("  the bound within 10%% of the optimum %8d times%n", closeEnough);
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.
#include <cstdint>
#include <cstdio>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int value;
    int weight;
};

const std::vector<Item> ITEMS = {
    {"copper", 60, 10},
    {"silver", 100, 20},
    {"gold", 120, 30},
};
const int CAPACITY = 50;

/** Densest first, compared with integers so every language agrees on ties. */
std::vector<Item> by_density(const std::vector<Item>& items) {
    std::vector<Item> order = items;
    for (size_t i = 1; i < order.size(); ++i) {
        size_t j = i;
        while (j > 0 && order[j].value * order[j - 1].weight
                      > order[j - 1].value * order[j].weight) {
            std::swap(order[j - 1], order[j]);
            --j;
        }
    }
    return order;
}

/** Densest first, whole items only. */
std::vector<Item> greedy_01(const std::vector<Item>& items, int capacity) {
    std::vector<Item> taken;
    int left = capacity;
    for (const Item& item : by_density(items)) {
        if (item.weight <= left) {
            taken.push_back(item);
            left -= item.weight;
        }
    }
    return taken;
}

/** Index of the most valuable item that fits, or -1. */
int best_single(const std::vector<Item>& items, int capacity) {
    int best = -1;
    for (size_t i = 0; i < items.size(); ++i) {
        if (items[i].weight <= capacity && (best < 0 || items[i].value > items[best].value)) {
            best = static_cast<int>(i);
        }
    }
    return best;
}

/** The exact fractional optimum, as a fraction, so no rounding creeps in. */
std::pair<std::int64_t, std::int64_t> fractional_bound(const std::vector<Item>& items,
                                                       int capacity) {
    std::int64_t total = 0;
    int left = capacity;
    for (const Item& item : by_density(items)) {
        if (item.weight <= left) {
            total += item.value;
            left -= item.weight;
        } else {
            return {total * item.weight + static_cast<std::int64_t>(left) * item.value,
                    item.weight};
        }
    }
    return {total, 1};
}

int optimum_01(const std::vector<Item>& items, int capacity) {
    std::vector<int> best(capacity + 1, 0);
    for (const Item& item : items) {
        for (int room = capacity; room >= item.weight; --room) {
            if (best[room - item.weight] + item.value > best[room]) {
                best[room] = best[room - item.weight] + item.value;
            }
        }
    }
    return best[capacity];
}

int sum(const std::vector<Item>& items) {
    int total = 0;
    for (const Item& item : items) total += item.value;
    return total;
}

std::string names(const std::vector<Item>& items) {
    std::string out;
    for (const Item& item : items) {
        if (!out.empty()) out += ' ';
        out += item.name;
    }
    return out;
}

// A deterministic generator, so the sweep is reproducible and the numbers it
// reports are the same ones for every reader.
std::int64_t seed = 1;

int rand_below(int n) {
    seed = (seed * 1103515245LL + 12345LL) % 2147483648LL;
    return static_cast<int>(seed / 65536 % n);
}

int main() {
    std::vector<Item> greedy = greedy_01(ITEMS, CAPACITY);
    int greedy_value = sum(greedy);
    int single = best_single(ITEMS, CAPACITY);
    if (single < 0) throw std::runtime_error("nothing fits");
    auto bound = fractional_bound(ITEMS, CAPACITY);
    int optimum = optimum_01(ITEMS, CAPACITY);
    int lower = greedy_value > ITEMS[single].value ? greedy_value : ITEMS[single].value;

    std::cout << "capacity " << CAPACITY << ", items ";
    for (size_t i = 0; i < ITEMS.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << ITEMS[i].name << ' ' << ITEMS[i].value << '/' << ITEMS[i].weight;
    }
    std::cout << "\\n\\n";
    std::cout << std::left << std::setw(28) << "greedy by density (0/1)" << std::right
              << std::setw(6) << greedy_value << "   " << names(greedy) << "\\n";
    std::cout << std::left << std::setw(28) << "best single item" << std::right << std::setw(6)
              << ITEMS[single].value << "   " << ITEMS[single].name << "\\n";
    std::cout << std::left << std::setw(28) << "true 0/1 optimum" << std::right << std::setw(6)
              << optimum << "   from a table over 50 capacities\\n";
    std::cout << std::left << std::setw(28) << "fractional bound" << std::right << std::setw(6)
              << bound.first / bound.second << "   greedy on the relaxed problem\\n";
    std::cout << "\\n";
    std::cout << "the optimum is boxed in: " << lower << " <= " << optimum << " <= "
              << bound.first / bound.second << ",\\n";
    std::cout << "and both ends came out of sorting once.\\n";

    // The half guarantee, and how loose the upper bound gets, on random
    // instances.
    const int trials = 20000;
    std::pair<std::int64_t, std::int64_t> worst_greedy{1, 1};
    std::pair<std::int64_t, std::int64_t> worst_lower{1, 1};
    std::pair<std::int64_t, std::int64_t> worst_upper{1, 1};
    int close_enough = 0;
    for (int t = 0; t < trials; ++t) {
        std::vector<Item> items;
        for (int i = 0; i < 8; ++i) items.push_back({"", 1 + rand_below(60), 1 + rand_below(30)});
        int capacity = 20 + rand_below(40);
        std::int64_t trial_optimum = optimum_01(items, capacity);
        std::int64_t value = sum(greedy_01(items, capacity));
        int one = best_single(items, capacity);
        std::int64_t one_value = one < 0 ? 0 : items[one].value;
        std::int64_t trial_lower = value > one_value ? value : one_value;
        auto frac = fractional_bound(items, capacity);
        // Fractions compared by cross-multiplying, so nothing here depends on
        // floats.
        if (value * worst_greedy.second < worst_greedy.first * trial_optimum) {
            worst_greedy = {value, trial_optimum};
        }
        if (trial_lower * worst_lower.second < worst_lower.first * trial_optimum) {
            worst_lower = {trial_lower, trial_optimum};
        }
        if (frac.first * worst_upper.second > worst_upper.first * (trial_optimum * frac.second)) {
            worst_upper = {frac.first, trial_optimum * frac.second};
        }
        if (10 * frac.first <= 11 * trial_optimum * frac.second) close_enough++;
    }

    std::cout << "\\n";
    std::printf("over %d random eight-item instances:\\n", trials);
    std::printf("  greedy by density alone, worst      %8.4f of the optimum\\n",
                static_cast<double>(worst_greedy.first) / worst_greedy.second);
    std::printf("  with the best single item, worst    %8.4f of the optimum\\n",
                static_cast<double>(worst_lower.first) / worst_lower.second);
    std::printf("  the fractional bound, worst         %8.4f times the optimum\\n",
                static_cast<double>(worst_upper.first) / worst_upper.second);
    std::printf("  the bound within 10%% of the optimum %8d times\\n", close_enough);
}
`,
            },
            {
              lang: "rust",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.

#[derive(Clone)]
struct Item {
    name: String,
    value: i64,
    weight: i64,
}

fn items_table() -> Vec<Item> {
    [("copper", 60, 10), ("silver", 100, 20), ("gold", 120, 30)]
        .iter()
        .map(|&(name, value, weight)| Item { name: name.to_string(), value, weight })
        .collect()
}

const CAPACITY: i64 = 50;

/// Densest first, compared with integers so every language agrees on ties.
fn by_density(items: &[Item]) -> Vec<Item> {
    let mut order = items.to_vec();
    for i in 1..order.len() {
        let mut j = i;
        while j > 0 && order[j].value * order[j - 1].weight
                     > order[j - 1].value * order[j].weight {
            order.swap(j - 1, j);
            j -= 1;
        }
    }
    order
}

/// Densest first, whole items only.
fn greedy_01(items: &[Item], capacity: i64) -> Vec<Item> {
    let mut taken = Vec::new();
    let mut left = capacity;
    for item in by_density(items) {
        if item.weight <= left {
            left -= item.weight;
            taken.push(item);
        }
    }
    taken
}

fn best_single(items: &[Item], capacity: i64) -> Option<usize> {
    let mut best: Option<usize> = None;
    for (i, item) in items.iter().enumerate() {
        if item.weight <= capacity && best.is_none_or(|b| item.value > items[b].value) {
            best = Some(i);
        }
    }
    best
}

/// The exact fractional optimum, as a fraction, so no rounding creeps in.
fn fractional_bound(items: &[Item], capacity: i64) -> (i64, i64) {
    let mut total = 0;
    let mut left = capacity;
    for item in by_density(items) {
        if item.weight <= left {
            total += item.value;
            left -= item.weight;
        } else {
            return (total * item.weight + left * item.value, item.weight);
        }
    }
    (total, 1)
}

fn optimum_01(items: &[Item], capacity: i64) -> i64 {
    let mut best = vec![0i64; (capacity + 1) as usize];
    for item in items {
        let mut room = capacity;
        while room >= item.weight {
            let take = best[(room - item.weight) as usize] + item.value;
            if take > best[room as usize] {
                best[room as usize] = take;
            }
            room -= 1;
        }
    }
    best[capacity as usize]
}

fn sum(items: &[Item]) -> i64 {
    items.iter().map(|i| i.value).sum()
}

fn names(items: &[Item]) -> String {
    items.iter().map(|i| i.name.clone()).collect::<Vec<_>>().join(" ")
}

// A deterministic generator, so the sweep is reproducible and the numbers it
// reports are the same ones for every reader.
struct Rng {
    seed: i64,
}

impl Rng {
    fn next(&mut self, n: i64) -> i64 {
        self.seed = (self.seed * 1103515245 + 12345) % 2147483648;
        self.seed / 65536 % n
    }
}

fn main() {
    let table = items_table();
    let greedy = greedy_01(&table, CAPACITY);
    let greedy_value = sum(&greedy);
    let single = best_single(&table, CAPACITY).expect("nothing fits");
    let (num, den) = fractional_bound(&table, CAPACITY);
    let optimum = optimum_01(&table, CAPACITY);
    let lower = greedy_value.max(table[single].value);

    let listed: Vec<String> = table.iter()
        .map(|i| format!("{} {}/{}", i.name, i.value, i.weight))
        .collect();
    println!("capacity {}, items {}", CAPACITY, listed.join(", "));
    println!();
    println!("{:<28}{:>6}   {}", "greedy by density (0/1)", greedy_value, names(&greedy));
    println!("{:<28}{:>6}   {}", "best single item", table[single].value, table[single].name);
    println!("{:<28}{:>6}   from a table over 50 capacities", "true 0/1 optimum", optimum);
    println!("{:<28}{:>6}   greedy on the relaxed problem", "fractional bound", num / den);
    println!();
    println!("the optimum is boxed in: {} <= {} <= {},", lower, optimum, num / den);
    println!("and both ends came out of sorting once.");

    // The half guarantee, and how loose the upper bound gets, on random
    // instances.
    let trials = 20000;
    let mut worst_greedy = (1i64, 1i64);
    let mut worst_lower = (1i64, 1i64);
    let mut worst_upper = (1i64, 1i64);
    let mut close_enough = 0;
    let mut rng = Rng { seed: 1 };
    for _ in 0..trials {
        let mut items = Vec::new();
        for _ in 0..8 {
            items.push(Item {
                name: String::new(),
                value: 1 + rng.next(60),
                weight: 1 + rng.next(30),
            });
        }
        let capacity = 20 + rng.next(40);
        let trial_optimum = optimum_01(&items, capacity);
        let value = sum(&greedy_01(&items, capacity));
        let one_value = match best_single(&items, capacity) {
            None => 0,
            Some(i) => items[i].value,
        };
        let trial_lower = value.max(one_value);
        let (frac_num, frac_den) = fractional_bound(&items, capacity);
        // Fractions compared by cross-multiplying, so nothing here depends on
        // floats.
        if value * worst_greedy.1 < worst_greedy.0 * trial_optimum {
            worst_greedy = (value, trial_optimum);
        }
        if trial_lower * worst_lower.1 < worst_lower.0 * trial_optimum {
            worst_lower = (trial_lower, trial_optimum);
        }
        if frac_num * worst_upper.1 > worst_upper.0 * (trial_optimum * frac_den) {
            worst_upper = (frac_num, trial_optimum * frac_den);
        }
        if 10 * frac_num <= 11 * trial_optimum * frac_den {
            close_enough += 1;
        }
    }

    let ratio = |(a, b): (i64, i64)| a as f64 / b as f64;
    println!();
    println!("over {} random eight-item instances:", trials);
    println!("  greedy by density alone, worst      {:>8.4} of the optimum", ratio(worst_greedy));
    println!("  with the best single item, worst    {:>8.4} of the optimum", ratio(worst_lower));
    println!("  the fractional bound, worst         {:>8.4} times the optimum", ratio(worst_upper));
    println!("  the bound within 10% of the optimum {:>8} times", close_enough);
}
`,
            },
            {
              lang: "go",
              code: `// There is a third thing greedy is good for, once you know it is not optimal.
//
// The fractional relaxation - the version of the problem where items can be cut
// - is solved exactly by greedy, and its answer can only beat the 0/1 answer,
// because every 0/1 packing is also a fractional one. So greedy hands you an
// upper bound on an optimum you have not computed, out of one sort.
//
// It hands you a lower bound too. Take the better of greedy-by-density and the
// single most valuable item that fits, and you are guaranteed at least half the
// optimum - a fact worth checking rather than repeating.
package main

import (
	"fmt"
	"strings"
)

type item struct {
	name   string
	value  int64
	weight int64
}

var itemsTable = []item{
	{"copper", 60, 10},
	{"silver", 100, 20},
	{"gold", 120, 30},
}

const capacityLimit int64 = 50

// Densest first, compared with integers so every language agrees on ties.
func byDensity(items []item) []item {
	order := make([]item, len(items))
	copy(order, items)
	for i := 1; i < len(order); i++ {
		j := i
		for j > 0 && order[j].value*order[j-1].weight > order[j-1].value*order[j].weight {
			order[j-1], order[j] = order[j], order[j-1]
			j--
		}
	}
	return order
}

// Densest first, whole items only.
func greedy01(items []item, capacity int64) []item {
	var taken []item
	left := capacity
	for _, it := range byDensity(items) {
		if it.weight <= left {
			taken = append(taken, it)
			left -= it.weight
		}
	}
	return taken
}

// Index of the most valuable item that fits, or -1.
func bestSingle(items []item, capacity int64) int {
	best := -1
	for i, it := range items {
		if it.weight <= capacity && (best < 0 || it.value > items[best].value) {
			best = i
		}
	}
	return best
}

// The exact fractional optimum, as a fraction, so no rounding creeps in.
func fractionalBound(items []item, capacity int64) (int64, int64) {
	var total int64
	left := capacity
	for _, it := range byDensity(items) {
		if it.weight <= left {
			total += it.value
			left -= it.weight
		} else {
			return total*it.weight + left*it.value, it.weight
		}
	}
	return total, 1
}

func optimum01(items []item, capacity int64) int64 {
	best := make([]int64, capacity+1)
	for _, it := range items {
		for room := capacity; room >= it.weight; room-- {
			if take := best[room-it.weight] + it.value; take > best[room] {
				best[room] = take
			}
		}
	}
	return best[capacity]
}

func sum(items []item) int64 {
	var total int64
	for _, it := range items {
		total += it.value
	}
	return total
}

func names(items []item) string {
	parts := make([]string, len(items))
	for i, it := range items {
		parts[i] = it.name
	}
	return strings.Join(parts, " ")
}

// A deterministic generator, so the sweep is reproducible and the numbers it
// reports are the same ones for every reader.
var seed int64 = 1

func rand(n int64) int64 {
	seed = (seed*1103515245 + 12345) % 2147483648
	return seed / 65536 % n
}

func main() {
	greedy := greedy01(itemsTable, capacityLimit)
	greedyValue := sum(greedy)
	single := bestSingle(itemsTable, capacityLimit)
	if single < 0 {
		panic("nothing fits")
	}
	num, den := fractionalBound(itemsTable, capacityLimit)
	optimum := optimum01(itemsTable, capacityLimit)
	lower := greedyValue
	if itemsTable[single].value > lower {
		lower = itemsTable[single].value
	}

	listed := make([]string, len(itemsTable))
	for i, it := range itemsTable {
		listed[i] = fmt.Sprintf("%s %d/%d", it.name, it.value, it.weight)
	}
	fmt.Printf("capacity %d, items %s\\n", capacityLimit, strings.Join(listed, ", "))
	fmt.Println()
	fmt.Printf("%-28s%6d   %s\\n", "greedy by density (0/1)", greedyValue, names(greedy))
	fmt.Printf("%-28s%6d   %s\\n", "best single item", itemsTable[single].value,
		itemsTable[single].name)
	fmt.Printf("%-28s%6d   from a table over 50 capacities\\n", "true 0/1 optimum", optimum)
	fmt.Printf("%-28s%6d   greedy on the relaxed problem\\n", "fractional bound", num/den)
	fmt.Println()
	fmt.Printf("the optimum is boxed in: %d <= %d <= %d,\\n", lower, optimum, num/den)
	fmt.Println("and both ends came out of sorting once.")

	// The half guarantee, and how loose the upper bound gets, on random
	// instances.
	const trials = 20000
	worstGreedy := [2]int64{1, 1}
	worstLower := [2]int64{1, 1}
	worstUpper := [2]int64{1, 1}
	closeEnough := 0
	for t := 0; t < trials; t++ {
		var items []item
		for i := 0; i < 8; i++ {
			items = append(items, item{"", 1 + rand(60), 1 + rand(30)})
		}
		capacity := 20 + rand(40)
		trialOptimum := optimum01(items, capacity)
		value := sum(greedy01(items, capacity))
		var oneValue int64
		if one := bestSingle(items, capacity); one >= 0 {
			oneValue = items[one].value
		}
		trialLower := value
		if oneValue > trialLower {
			trialLower = oneValue
		}
		fracNum, fracDen := fractionalBound(items, capacity)
		// Fractions compared by cross-multiplying, so nothing here depends on
		// floats.
		if value*worstGreedy[1] < worstGreedy[0]*trialOptimum {
			worstGreedy = [2]int64{value, trialOptimum}
		}
		if trialLower*worstLower[1] < worstLower[0]*trialOptimum {
			worstLower = [2]int64{trialLower, trialOptimum}
		}
		if fracNum*worstUpper[1] > worstUpper[0]*(trialOptimum*fracDen) {
			worstUpper = [2]int64{fracNum, trialOptimum * fracDen}
		}
		if 10*fracNum <= 11*trialOptimum*fracDen {
			closeEnough++
		}
	}

	ratio := func(pair [2]int64) float64 { return float64(pair[0]) / float64(pair[1]) }
	fmt.Println()
	fmt.Printf("over %d random eight-item instances:\\n", trials)
	fmt.Printf("  greedy by density alone, worst      %8.4f of the optimum\\n", ratio(worstGreedy))
	fmt.Printf("  with the best single item, worst    %8.4f of the optimum\\n", ratio(worstLower))
	fmt.Printf("  the fractional bound, worst         %8.4f times the optimum\\n", ratio(worstUpper))
	fmt.Printf("  the bound within 10%% of the optimum %8d times\\n", closeEnough)
}
`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Interval scheduling is greedy but weighted interval scheduling is not. What changed?",
      answer: "The currency. Unweighted, the only thing a choice costs you is room, and the meeting that finishes first leaves the most of it — so the greedy choice is always safe and the exchange argument goes through. Weighted, a job that finishes late may be worth more than everything it blocks, so leaving the most room is no longer the same as being best, and there is nothing to exchange against. The fix is the standard DP: sort by finishing time, precompute for each job the last one that ends before it starts, and take `max(best without this job, value + best up to the last compatible one)`. O(n log n) for the sort, O(n) for the pass, and no proof of a greedy choice required — which is the point.",
    },
    {
      question: "What is the relationship between the greedy algorithm and the dynamic program?",
      answer: "Greedy is the DP with all but one branch deleted. Coin change makes it exact: the table takes the minimum over every coin that fits, greedy takes only the largest. A system is canonical precisely when the branch greedy keeps is always one of the minimising ones — so proving a greedy algorithm correct *is* proving that pruning safe. That also explains the failure mode: on 4, 3, 1 the branch is wrong at one amount in a thousand and the answer is wrong at a quarter of them, because greedy recurses into the amount it just got wrong and everything reducing to it inherits the error.",
    },
    {
      question: "Greedy is wrong for this problem. Is it useless?",
      answer: "No — it is often the bound. For 0/1 knapsack, greedy on the fractional relaxation is exact, and every 0/1 packing is a legal fractional one, so the relaxed answer is an upper bound on the true optimum. Greedy's own 0/1 answer is a real packing, so it is a lower bound, and the better of it and the best single item is guaranteed to be at least half the optimum. One sort gives both ends. That is what branch-and-bound prunes with, and it is the difference between an approximation and an approximation you can size.",
    },
  ],
  takeaways: [
    "Adding an objective can destroy a greedy result without changing the structure at all: interval scheduling is greedy, weighted interval scheduling is not.",
    "Greedy needs the first choice to be safe. When room is the only currency it is; when value competes with room it is not.",
    "Greedy is the dynamic program with every branch but one deleted, so proving greedy correct is proving that pruning safe.",
    "One bad branch is not one bad answer — every amount that reduces to it inherits the mistake.",
    "The weighted interval DP is one array: for each job, the best schedule that uses it against the best that does not.",
    "A relaxation greedy solves exactly is an upper bound on the problem it cannot; greedy's own answer is a lower bound.",
    "The better of greedy-by-density and the best single item is never below half the 0/1 optimum.",
    "An approximation with a bound is a different object from an approximation without one: it comes with the size of its own error.",
  ],
  status: "available",
};
