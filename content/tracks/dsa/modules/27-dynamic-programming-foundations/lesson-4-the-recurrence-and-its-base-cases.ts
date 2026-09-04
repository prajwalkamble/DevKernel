import type { Lesson } from "@/content/types";

export const theRecurrenceLesson: Lesson = {
  id: "dsa-dp-the-recurrence",
  slug: "the-recurrence-and-its-base-cases",
  moduleSlug: "dynamic-programming-foundations",
  title: "The Recurrence and Its Base Cases",
  summary:
    "A recurrence is two decisions wearing one line of code, and separating them turns writing one from guesswork into bookkeeping. Then the two base cases most problems have, the one people leave out, and the requirement nobody states out loud.",
  estimatedMinutes: 40,
  objectives: [
    "Enumerate a choice set by naming the last decision, and keep it separate from the combine",
    "Give the trivial and impossible states different base values, matched to the operator",
    "Recognise a sentinel that arithmetic can rescue, and an infinity that overflow can invert",
    "Test a recurrence for cycles by permuting the branch order, and say what to reach for instead",
  ],
  sections: [
    {
      id: "two-decisions",
      heading: "A recurrence is two decisions in one line",
      body: [
        "A recurrence looks like one line of code and is two separate decisions, which is most of why writing one feels like guesswork. Separate them and it stops.",
        "The first decision is structural: **which choices are available at this state?** The reliable way to enumerate them is to ask what the *last* decision was \u2014 the last word taken, the last coin spent, the last square stepped onto. Working backwards makes the list finite and makes it obviously complete, because every solution ends with exactly one last decision.",
        "The second decision has nothing to do with the structure: **how do the sub-answers combine?** Sum for counting, minimum for cheapest, maximum for best, logical or for reachability. This part comes from the question you were asked, not from the problem's shape.",
        "The proof that they are independent is that you can hold one fixed and vary the other. Below, one state and one choice set are read three ways \u2014 how many ways to split the string, the fewest words any split uses, and the most \u2014 and the only thing that changes between them is the operator.",
        "The `moves onto i` column is the choice set, printed rather than described. Position 6 can be reached from position 3 by taking `def`, from 4 by taking `ef`, or from 5 by taking `f`, and nothing else lands there \u2014 so `ways[6]` is `ways[3] + ways[4] + ways[5]`, which is `3 + 6 + 6`, which is 15. The brute force at the bottom prints all fifteen splits, so the arithmetic is checkable by eye.",
        "Notice how little the three columns differ. `ways` sums, `fewest` takes a minimum and adds one, `most` takes a maximum and adds one; the loop over `choices(i)` is identical in all three. Once the choice set is right, changing the question is a change of operator, and that is the sense in which the hard part of a recurrence is not the recurrence.",
        "The base cases are already doing something interesting here and the next section is about it. `ways[0]` is **1**, not 0 \u2014 there is exactly one way to split nothing, namely take nothing \u2014 while `fewest[0]` is 0, because that empty split uses no words. Same state, two different base values, because they answer to two different operators.",
      ],
      examples: [
        {
          id: "choices-and-combine",
          title: "One state, one choice set, three questions",
          lang: "python",
          code: `# A recurrence is two separate decisions wearing one line of code. The first is
# structural -- which choices are available at this state -- and belongs to the
# problem. The second is the combining operator, and belongs to the question you
# were asked. Getting them mixed up is why recurrences feel like guesswork.
#
# Below, one state and one choice set, read three different ways.

TEXT = "abcdef"
WORDS = ["a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd"]

N = len(TEXT)


def is_word(piece):
    for word in WORDS:
        if word == piece:
            return True
    return False


def quoted(text):
    return "'" + text + "'"


def choices(i):
    """Every j such that text[j:i] is a word: the moves that can land on i."""
    return [j for j in range(i) if is_word(TEXT[j:i])]


# The three readings. Same state, same choices, different combine.
#   count : how many ways are there to split the whole string
#   fewest: the smallest number of words any split uses
#   most  : the largest
ways = [0] * (N + 1)
fewest = [0] * (N + 1)
most = [0] * (N + 1)

ways[0] = 1          # one way to split nothing: take nothing
fewest[0] = 0        # and it uses no words
most[0] = 0
for i in range(1, N + 1):
    fewest[i] = -1
    most[i] = -1
    for j in choices(i):
        ways[i] += ways[j]
        if ways[j] > 0:
            if fewest[i] < 0 or fewest[j] + 1 < fewest[i]:
                fewest[i] = fewest[j] + 1
            if most[j] + 1 > most[i]:
                most[i] = most[j] + 1

print(f"text {quoted(TEXT)}, words [" + ", ".join(quoted(w) for w in WORDS) + "]")
print()
print(f"{'i':>3}{'prefix':>10}{'moves onto i':>26}{'ways':>7}{'fewest':>8}{'most':>6}")
for i in range(N + 1):
    moves = ",".join(f"{j}+{quoted(TEXT[j:i])}" for j in choices(i)) if i else "-"
    print(f"{i:>3}{quoted(TEXT[:i]):>10}{moves:>26}{ways[i]:>7}{fewest[i]:>8}{most[i]:>6}")
print()


def every_split(i):
    """Brute force: every list of words spelling text[0:i]."""
    if i == 0:
        return [[]]
    out = []
    for j in choices(i):
        for head in every_split(j):
            out.append(head + [TEXT[j:i]])
    return out


splits = every_split(N)
print(f"every split of {quoted(TEXT)}, enumerated: {len(splits)}")
print(f"  shortest {min(len(s) for s in splits)} words, longest {max(len(s) for s in splits)} words")
print(f"  the table says {ways[N]}, {fewest[N]} and {most[N]}")
print()
for split in splits:
    print("  " + " | ".join(split))
`,
          output: `text 'abcdef', words ['a', 'b', 'c', 'd', 'e', 'f', 'ab', 'cd', 'ef', 'abc', 'def', 'abcd']

  i    prefix              moves onto i   ways  fewest  most
  0        ''                         -      1       0     0
  1       'a'                     0+'a'      1       1     1
  2      'ab'              0+'ab',1+'b'      2       1     2
  3     'abc'             0+'abc',2+'c'      3       1     3
  4    'abcd'     0+'abcd',2+'cd',3+'d'      6       1     4
  5   'abcde'                     4+'e'      6       2     5
  6  'abcdef'      3+'def',4+'ef',5+'f'     15       2     6

every split of 'abcdef', enumerated: 15
  shortest 2 words, longest 6 words
  the table says 15, 2 and 6

  abc | def
  ab | c | def
  a | b | c | def
  abcd | ef
  ab | cd | ef
  a | b | cd | ef
  abc | d | ef
  ab | c | d | ef
  a | b | c | d | ef
  abcd | e | f
  ab | cd | e | f
  a | b | cd | e | f
  abc | d | e | f
  ab | c | d | e | f
  a | b | c | d | e | f`,
          explanation:
            "`choices(i)` is the structural half and is written once. The three tables that follow differ only in what they do with the sub-answers: add them, take the smallest and add one, take the largest and add one. The brute force prints every split, so both the count and the two extremes can be checked against the list.",
          alternates: [
            {
              lang: "javascript",
              code: `// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.

const TEXT = "abcdef";
const WORDS = ["a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd"];
const N = TEXT.length;

function isWord(piece) {
  for (const word of WORDS) {
    if (word === piece) return true;
  }
  return false;
}

const quoted = (text) => \`'\${text}'\`;
const pad = (v, w) => String(v).padStart(w);

/** Every j such that text[j:i] is a word: the moves that can land on i. */
function choices(i) {
  const out = [];
  for (let j = 0; j < i; j++) if (isWord(TEXT.slice(j, i))) out.push(j);
  return out;
}

/** Brute force: every list of words spelling text[0:i]. */
function everySplit(i) {
  if (i === 0) return [[]];
  const out = [];
  for (const j of choices(i)) {
    for (const head of everySplit(j)) out.push([...head, TEXT.slice(j, i)]);
  }
  return out;
}

// The three readings. Same state, same choices, different combine.
//   count : how many ways are there to split the whole string
//   fewest: the smallest number of words any split uses
//   most  : the largest
const ways = new Array(N + 1).fill(0);
const fewest = new Array(N + 1).fill(0);
const most = new Array(N + 1).fill(0);

ways[0] = 1;      // one way to split nothing: take nothing
for (let i = 1; i <= N; i++) {
  fewest[i] = -1;
  most[i] = -1;
  for (const j of choices(i)) {
    ways[i] += ways[j];
    if (ways[j] > 0) {
      if (fewest[i] < 0 || fewest[j] + 1 < fewest[i]) fewest[i] = fewest[j] + 1;
      if (most[j] + 1 > most[i]) most[i] = most[j] + 1;
    }
  }
}

console.log(\`text \${quoted(TEXT)}, words [\${WORDS.map(quoted).join(", ")}]\`);
console.log();
console.log(pad("i", 3) + pad("prefix", 10) + pad("moves onto i", 26) + pad("ways", 7) + pad("fewest", 8) + pad("most", 6));
for (let i = 0; i <= N; i++) {
  const moves = i === 0 ? "-" : choices(i).map((j) => \`\${j}+\${quoted(TEXT.slice(j, i))}\`).join(",");
  console.log(
    pad(i, 3) + pad(quoted(TEXT.slice(0, i)), 10) + pad(moves, 26) + pad(ways[i], 7) +
      pad(fewest[i], 8) + pad(most[i], 6)
  );
}
console.log();

const splits = everySplit(N);
const shortest = Math.min(...splits.map((s) => s.length));
const longest = Math.max(...splits.map((s) => s.length));
console.log(\`every split of \${quoted(TEXT)}, enumerated: \${splits.length}\`);
console.log(\`  shortest \${shortest} words, longest \${longest} words\`);
console.log(\`  the table says \${ways[N]}, \${fewest[N]} and \${most[N]}\`);
console.log();
for (const split of splits) console.log("  " + split.join(" | "));
`,
            },
            {
              lang: "typescript",
              code: `// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.

const TEXT = "abcdef";
const WORDS = ["a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd"];
const N = TEXT.length;

function isWord(piece: string): boolean {
  for (const word of WORDS) {
    if (word === piece) return true;
  }
  return false;
}

const quoted = (text: string): string => \`'\${text}'\`;
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** Every j such that text[j:i] is a word: the moves that can land on i. */
function choices(i: number): number[] {
  const out: number[] = [];
  for (let j = 0; j < i; j++) if (isWord(TEXT.slice(j, i))) out.push(j);
  return out;
}

/** Brute force: every list of words spelling text[0:i]. */
function everySplit(i: number): string[][] {
  if (i === 0) return [[]];
  const out: string[][] = [];
  for (const j of choices(i)) {
    for (const head of everySplit(j)) out.push([...head, TEXT.slice(j, i)]);
  }
  return out;
}

// The three readings. Same state, same choices, different combine.
//   count : how many ways are there to split the whole string
//   fewest: the smallest number of words any split uses
//   most  : the largest
const ways = new Array(N + 1).fill(0);
const fewest = new Array(N + 1).fill(0);
const most = new Array(N + 1).fill(0);

ways[0] = 1;      // one way to split nothing: take nothing
for (let i = 1; i <= N; i++) {
  fewest[i] = -1;
  most[i] = -1;
  for (const j of choices(i)) {
    ways[i] += ways[j];
    if (ways[j] > 0) {
      if (fewest[i] < 0 || fewest[j] + 1 < fewest[i]) fewest[i] = fewest[j] + 1;
      if (most[j] + 1 > most[i]) most[i] = most[j] + 1;
    }
  }
}

console.log(\`text \${quoted(TEXT)}, words [\${WORDS.map(quoted).join(", ")}]\`);
console.log();
console.log(pad("i", 3) + pad("prefix", 10) + pad("moves onto i", 26) + pad("ways", 7) + pad("fewest", 8) + pad("most", 6));
for (let i = 0; i <= N; i++) {
  const moves = i === 0 ? "-" : choices(i).map((j) => \`\${j}+\${quoted(TEXT.slice(j, i))}\`).join(",");
  console.log(
    pad(i, 3) + pad(quoted(TEXT.slice(0, i)), 10) + pad(moves, 26) + pad(ways[i], 7) +
      pad(fewest[i], 8) + pad(most[i], 6)
  );
}
console.log();

const splits = everySplit(N);
const shortest = Math.min(...splits.map((s) => s.length));
const longest = Math.max(...splits.map((s) => s.length));
console.log(\`every split of \${quoted(TEXT)}, enumerated: \${splits.length}\`);
console.log(\`  shortest \${shortest} words, longest \${longest} words\`);
console.log(\`  the table says \${ways[N]}, \${fewest[N]} and \${most[N]}\`);
console.log();
for (const split of splits) console.log("  " + split.join(" | "));
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.List;

// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.
public class Main {
    static final String TEXT = "abcdef";
    static final String[] WORDS = { "a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd" };
    static final int N = TEXT.length();

    static boolean isWord(String piece) {
        for (String word : WORDS) {
            if (word.equals(piece)) return true;
        }
        return false;
    }

    static String quoted(String text) {
        return "'" + text + "'";
    }

    /** Every j such that text[j:i] is a word: the moves that can land on i. */
    static List<Integer> choices(int i) {
        List<Integer> out = new ArrayList<>();
        for (int j = 0; j < i; j++) {
            if (isWord(TEXT.substring(j, i))) out.add(j);
        }
        return out;
    }

    /** Brute force: every list of words spelling text[0:i]. */
    static List<List<String>> everySplit(int i) {
        List<List<String>> out = new ArrayList<>();
        if (i == 0) {
            out.add(new ArrayList<>());
            return out;
        }
        for (int j : choices(i)) {
            for (List<String> head : everySplit(j)) {
                List<String> whole = new ArrayList<>(head);
                whole.add(TEXT.substring(j, i));
                out.add(whole);
            }
        }
        return out;
    }

    public static void main(String[] args) {
        // The three readings. Same state, same choices, different combine.
        //   count : how many ways are there to split the whole string
        //   fewest: the smallest number of words any split uses
        //   most  : the largest
        long[] ways = new long[N + 1];
        int[] fewest = new int[N + 1];
        int[] most = new int[N + 1];

        ways[0] = 1;          // one way to split nothing: take nothing
        fewest[0] = 0;        // and it uses no words
        most[0] = 0;
        for (int i = 1; i <= N; i++) {
            fewest[i] = -1;
            most[i] = -1;
            for (int j : choices(i)) {
                ways[i] += ways[j];
                if (ways[j] > 0) {
                    if (fewest[i] < 0 || fewest[j] + 1 < fewest[i]) fewest[i] = fewest[j] + 1;
                    if (most[j] + 1 > most[i]) most[i] = most[j] + 1;
                }
            }
        }

        StringBuilder words = new StringBuilder();
        for (int i = 0; i < WORDS.length; i++) {
            if (i > 0) words.append(", ");
            words.append(quoted(WORDS[i]));
        }
        System.out.printf("text %s, words [%s]%n", quoted(TEXT), words);
        System.out.println();
        System.out.printf("%3s%10s%26s%7s%8s%6s%n", "i", "prefix", "moves onto i", "ways", "fewest", "most");
        for (int i = 0; i <= N; i++) {
            StringBuilder moves = new StringBuilder();
            if (i == 0) {
                moves.append("-");
            } else {
                List<Integer> js = choices(i);
                for (int k = 0; k < js.size(); k++) {
                    if (k > 0) moves.append(",");
                    moves.append(js.get(k)).append("+").append(quoted(TEXT.substring(js.get(k), i)));
                }
            }
            System.out.printf("%3d%10s%26s%7d%8d%6d%n", i, quoted(TEXT.substring(0, i)), moves,
                ways[i], fewest[i], most[i]);
        }
        System.out.println();

        List<List<String>> splits = everySplit(N);
        int shortest = Integer.MAX_VALUE;
        int longest = 0;
        for (List<String> split : splits) {
            if (split.size() < shortest) shortest = split.size();
            if (split.size() > longest) longest = split.size();
        }
        System.out.printf("every split of %s, enumerated: %d%n", quoted(TEXT), splits.size());
        System.out.printf("  shortest %d words, longest %d words%n", shortest, longest);
        System.out.printf("  the table says %d, %d and %d%n", ways[N], fewest[N], most[N]);
        System.out.println();
        for (List<String> split : splits) {
            System.out.println("  " + String.join(" | ", split));
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

static const std::string TEXT = "abcdef";
static const std::vector<std::string> WORDS = {"a", "b", "c", "d", "e", "f",
                                               "ab", "cd", "ef", "abc", "def", "abcd"};
static const int N = 6;

bool isWord(const std::string &piece) {
    for (const std::string &word : WORDS) {
        if (word == piece) return true;
    }
    return false;
}

std::string quoted(const std::string &text) {
    return "'" + text + "'";
}

// Every j such that text[j:i] is a word: the moves that can land on i.
std::vector<int> choices(int i) {
    std::vector<int> out;
    for (int j = 0; j < i; j++) {
        if (isWord(TEXT.substr(j, i - j))) out.push_back(j);
    }
    return out;
}

// Brute force: every list of words spelling text[0:i].
std::vector<std::vector<std::string>> everySplit(int i) {
    std::vector<std::vector<std::string>> out;
    if (i == 0) {
        out.push_back({});
        return out;
    }
    for (int j : choices(i)) {
        for (const auto &head : everySplit(j)) {
            std::vector<std::string> whole = head;
            whole.push_back(TEXT.substr(j, i - j));
            out.push_back(whole);
        }
    }
    return out;
}

int main() {
    // The three readings. Same state, same choices, different combine.
    //   count : how many ways are there to split the whole string
    //   fewest: the smallest number of words any split uses
    //   most  : the largest
    std::vector<std::int64_t> ways(N + 1, 0);
    std::vector<int> fewest(N + 1, 0), most(N + 1, 0);

    ways[0] = 1;   // one way to split nothing: take nothing
    for (int i = 1; i <= N; i++) {
        fewest[i] = -1;
        most[i] = -1;
        for (int j : choices(i)) {
            ways[i] += ways[j];
            if (ways[j] > 0) {
                if (fewest[i] < 0 || fewest[j] + 1 < fewest[i]) fewest[i] = fewest[j] + 1;
                if (most[j] + 1 > most[i]) most[i] = most[j] + 1;
            }
        }
    }

    std::cout << "text " << quoted(TEXT) << ", words [";
    for (size_t i = 0; i < WORDS.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << quoted(WORDS[i]);
    }
    std::cout << "]\\n\\n";
    std::cout << std::right << std::setw(3) << "i" << std::setw(10) << "prefix"
              << std::setw(26) << "moves onto i" << std::setw(7) << "ways"
              << std::setw(8) << "fewest" << std::setw(6) << "most" << "\\n";
    for (int i = 0; i <= N; i++) {
        std::string moves = "-";
        if (i > 0) {
            moves.clear();
            std::vector<int> js = choices(i);
            for (size_t k = 0; k < js.size(); k++) {
                if (k > 0) moves += ",";
                moves += std::to_string(js[k]) + "+" + quoted(TEXT.substr(js[k], i - js[k]));
            }
        }
        std::cout << std::right << std::setw(3) << i << std::setw(10) << quoted(TEXT.substr(0, i))
                  << std::setw(26) << moves << std::setw(7) << ways[i] << std::setw(8) << fewest[i]
                  << std::setw(6) << most[i] << "\\n";
    }
    std::cout << "\\n";

    auto splits = everySplit(N);
    size_t shortest = splits[0].size(), longest = 0;
    for (const auto &split : splits) {
        if (split.size() < shortest) shortest = split.size();
        if (split.size() > longest) longest = split.size();
    }
    std::cout << "every split of " << quoted(TEXT) << ", enumerated: " << splits.size() << "\\n";
    std::cout << "  shortest " << shortest << " words, longest " << longest << " words\\n";
    std::cout << "  the table says " << ways[N] << ", " << fewest[N] << " and " << most[N] << "\\n\\n";
    for (const auto &split : splits) {
        std::cout << "  ";
        for (size_t k = 0; k < split.size(); k++) {
            if (k > 0) std::cout << " | ";
            std::cout << split[k];
        }
        std::cout << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.

const TEXT: &str = "abcdef";
const WORDS: [&str; 12] = ["a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd"];
const N: usize = 6;

fn is_word(piece: &str) -> bool {
    WORDS.iter().any(|w| *w == piece)
}

fn quoted(text: &str) -> String {
    format!("'{}'", text)
}

/// Every j such that text[j:i] is a word: the moves that can land on i.
fn choices(i: usize) -> Vec<usize> {
    (0..i).filter(|&j| is_word(&TEXT[j..i])).collect()
}

/// Brute force: every list of words spelling text[0:i].
fn every_split(i: usize) -> Vec<Vec<String>> {
    if i == 0 {
        return vec![Vec::new()];
    }
    let mut out = Vec::new();
    for j in choices(i) {
        for head in every_split(j) {
            let mut whole = head.clone();
            whole.push(TEXT[j..i].to_string());
            out.push(whole);
        }
    }
    out
}

fn main() {
    // The three readings. Same state, same choices, different combine.
    //   count : how many ways are there to split the whole string
    //   fewest: the smallest number of words any split uses
    //   most  : the largest
    let mut ways = vec![0i64; N + 1];
    let mut fewest = vec![0i32; N + 1];
    let mut most = vec![0i32; N + 1];

    ways[0] = 1; // one way to split nothing: take nothing
    for i in 1..=N {
        fewest[i] = -1;
        most[i] = -1;
        for j in choices(i) {
            ways[i] += ways[j];
            if ways[j] > 0 {
                if fewest[i] < 0 || fewest[j] + 1 < fewest[i] {
                    fewest[i] = fewest[j] + 1;
                }
                if most[j] + 1 > most[i] {
                    most[i] = most[j] + 1;
                }
            }
        }
    }

    let quoted_words: Vec<String> = WORDS.iter().map(|w| quoted(w)).collect();
    println!("text {}, words [{}]", quoted(TEXT), quoted_words.join(", "));
    println!();
    println!("{:>3}{:>10}{:>26}{:>7}{:>8}{:>6}", "i", "prefix", "moves onto i", "ways", "fewest", "most");
    for i in 0..=N {
        let moves = if i == 0 {
            String::from("-")
        } else {
            choices(i)
                .iter()
                .map(|&j| format!("{}+{}", j, quoted(&TEXT[j..i])))
                .collect::<Vec<_>>()
                .join(",")
        };
        println!(
            "{:>3}{:>10}{:>26}{:>7}{:>8}{:>6}",
            i, quoted(&TEXT[0..i]), moves, ways[i], fewest[i], most[i]
        );
    }
    println!();

    let splits = every_split(N);
    let shortest = splits.iter().map(|s| s.len()).min().unwrap();
    let longest = splits.iter().map(|s| s.len()).max().unwrap();
    println!("every split of {}, enumerated: {}", quoted(TEXT), splits.len());
    println!("  shortest {} words, longest {} words", shortest, longest);
    println!("  the table says {}, {} and {}", ways[N], fewest[N], most[N]);
    println!();
    for split in &splits {
        println!("  {}", split.join(" | "));
    }
}
`,
            },
            {
              lang: "go",
              code: `// A recurrence is two separate decisions wearing one line of code. The first is
// structural -- which choices are available at this state -- and belongs to the
// problem. The second is the combining operator, and belongs to the question you
// were asked. Getting them mixed up is why recurrences feel like guesswork.
//
// Below, one state and one choice set, read three different ways.
package main

import (
	"fmt"
	"strings"
)

const TEXT = "abcdef"

var WORDS = []string{"a", "b", "c", "d", "e", "f", "ab", "cd", "ef", "abc", "def", "abcd"}

const N = len(TEXT)

func isWord(piece string) bool {
	for _, word := range WORDS {
		if word == piece {
			return true
		}
	}
	return false
}

func quoted(text string) string {
	return "'" + text + "'"
}

// Every j such that text[j:i] is a word: the moves that can land on i.
func choices(i int) []int {
	var out []int
	for j := 0; j < i; j++ {
		if isWord(TEXT[j:i]) {
			out = append(out, j)
		}
	}
	return out
}

// Brute force: every list of words spelling text[0:i].
func everySplit(i int) [][]string {
	if i == 0 {
		return [][]string{{}}
	}
	var out [][]string
	for _, j := range choices(i) {
		for _, head := range everySplit(j) {
			whole := append(append([]string{}, head...), TEXT[j:i])
			out = append(out, whole)
		}
	}
	return out
}

func main() {
	// The three readings. Same state, same choices, different combine.
	//   count : how many ways are there to split the whole string
	//   fewest: the smallest number of words any split uses
	//   most  : the largest
	ways := make([]int64, N+1)
	fewest := make([]int, N+1)
	most := make([]int, N+1)

	ways[0] = 1 // one way to split nothing: take nothing
	fewest[0] = 0
	most[0] = 0
	for i := 1; i <= N; i++ {
		fewest[i] = -1
		most[i] = -1
		for _, j := range choices(i) {
			ways[i] += ways[j]
			if ways[j] > 0 {
				if fewest[i] < 0 || fewest[j]+1 < fewest[i] {
					fewest[i] = fewest[j] + 1
				}
				if most[j]+1 > most[i] {
					most[i] = most[j] + 1
				}
			}
		}
	}

	quotedWords := make([]string, len(WORDS))
	for i, w := range WORDS {
		quotedWords[i] = quoted(w)
	}
	fmt.Printf("text %s, words [%s]\\n", quoted(TEXT), strings.Join(quotedWords, ", "))
	fmt.Println()
	fmt.Printf("%3s%10s%26s%7s%8s%6s\\n", "i", "prefix", "moves onto i", "ways", "fewest", "most")
	for i := 0; i <= N; i++ {
		moves := "-"
		if i > 0 {
			parts := []string{}
			for _, j := range choices(i) {
				parts = append(parts, fmt.Sprintf("%d+%s", j, quoted(TEXT[j:i])))
			}
			moves = strings.Join(parts, ",")
		}
		fmt.Printf("%3d%10s%26s%7d%8d%6d\\n", i, quoted(TEXT[:i]), moves, ways[i], fewest[i], most[i])
	}
	fmt.Println()

	splits := everySplit(N)
	shortest, longest := len(splits[0]), 0
	for _, split := range splits {
		if len(split) < shortest {
			shortest = len(split)
		}
		if len(split) > longest {
			longest = len(split)
		}
	}
	fmt.Printf("every split of %s, enumerated: %d\\n", quoted(TEXT), len(splits))
	fmt.Printf("  shortest %d words, longest %d words\\n", shortest, longest)
	fmt.Printf("  the table says %d, %d and %d\\n", ways[N], fewest[N], most[N])
	fmt.Println()
	for _, split := range splits {
		fmt.Println("  " + strings.Join(split, " | "))
	}
}
`,
            },
          ],
        },
      ],
    },
    {
      id: "two-base-cases",
      heading: "Two base cases, and why zero is the wrong one",
      body: [
        "Most dynamic programs have two base cases and most people write one. There is the **trivial state**, where there is nothing left to do, and the **impossible state**, where no solution exists at all. Folding the second into the first is the commonest arithmetic bug in the whole subject, because zero looks like such a natural answer for \"nothing to see here\".",
        "The choice of base value is not free either: it has to be the identity for the operator you are combining with. Zero is the identity for addition, which is why `fewest[0] = 0` was right in the last section and `ways[0] = 1` was right too \u2014 one is the identity for the sum-of-products counting. Zero is emphatically not a neutral value for a minimum, and the coins below are the demonstration.",
        "The two functions differ by a single condition. One refuses to build on an impossible sub-answer; the other adds one to it and gets a plausible-looking small number.",
        "Five correct out of four hundred. The mechanism is visible in the first wrong row: 5 cannot be made from 4, 6 and 9 at all, but the recursion reaches it, gets -1 back from the empty amount below it, costs that at `-1 + 1 = 0`, and reports that five pounds can be paid with no coins. Everything above 5 then inherits that, which is why the folded row goes flat at 0 for eight consecutive amounts.",
        "There are two honest ways to write the impossible case and the mistake is mixing them. Either keep a sentinel like -1 and **guard every read** of it, as the working version does, or use a value so large that adding a cost can never make it competitive \u2014 but then make it comfortably smaller than the maximum your integer type holds, because `Integer.MAX_VALUE + 1` is not a large number, it is a negative one. Half the maximum is the usual choice and it exists precisely to survive that addition.",
        "The general rule is worth carrying: **the base value must be the identity for the combine, and \"impossible\" must be a value the combine cannot rescue.** For a minimum that is an infinity; for a maximum, a negative infinity; for a count, zero \u2014 and zero for a count is a real answer meaning \"no ways\", not a sentinel, which is why counting problems are the ones where this bug does not appear.",
      ],
      examples: [
        {
          id: "impossible-is-not-zero",
          title: "The same recurrence with and without the guard on -1",
          lang: "python",
          code: `# Base cases are where a recurrence touches the ground, and there are two of
# them in most problems rather than one: the state that is trivially solved, and
# the state that has no solution at all. Collapsing the second into the first is
# the commonest arithmetic bug in dynamic programming, because zero is such a
# natural-looking answer for "nothing to do here".

COINS = [4, 6, 9]


def with_sentinel(amount, memo):
    """-1 means 'cannot be made', and it is contagious: it never becomes 0."""
    if amount in memo:
        return memo[amount]
    if amount == 0:
        answer = 0                      # the trivial state: nothing left to pay
    else:
        answer = -1                     # the impossible state, until proven otherwise
        for coin in COINS:
            if coin <= amount:
                sub = with_sentinel(amount - coin, memo)
                if sub >= 0 and (answer < 0 or sub + 1 < answer):
                    answer = sub + 1
    memo[amount] = answer
    return answer


def folded(amount, memo):
    """The same recurrence, missing the one guard that keeps -1 from spreading.

    Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1
    and costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
    """
    if amount in memo:
        return memo[amount]
    if amount == 0:
        answer = 0
    else:
        answer = -1
        for coin in COINS:
            if coin <= amount:
                sub = folded(amount - coin, memo)
                if answer < 0 or sub + 1 < answer:
                    answer = sub + 1
    memo[amount] = answer
    return answer


def brute_force(amount):
    """Every multiset of these three coins, enumerated."""
    best = -1
    a = 0
    while a * COINS[0] <= amount:
        b = 0
        while a * COINS[0] + b * COINS[1] <= amount:
            rest = amount - a * COINS[0] - b * COINS[1]
            if rest % COINS[2] == 0:
                total = a + b + rest // COINS[2]
                if best < 0 or total < best:
                    best = total
            b += 1
        a += 1
    return best


print("coins [" + ", ".join(str(c) for c in COINS) + "]. '-' means the amount cannot be made at all.")
print()
header = f"{'amount':<18}"
row_truth = f"{'brute force':<18}"
row_sentinel = f"{'impossible kept':<18}"
row_zero = f"{'impossible folded':<18}"
for amount in range(0, 20):
    truth = brute_force(amount)
    a = with_sentinel(amount, {})
    b = folded(amount, {})
    header += f"{amount:>4}"
    row_truth += f"{truth if truth >= 0 else '-':>4}"
    row_sentinel += f"{a if a >= 0 else '-':>4}"
    row_zero += f"{b if b >= 0 else '-':>4}"
print(header)
print(row_truth)
print(row_sentinel)
print(row_zero)
print()

agree_a = 0
agree_b = 0
wrong = []
for amount in range(0, 400):
    truth = brute_force(amount)
    if with_sentinel(amount, {}) == truth:
        agree_a += 1
    b = folded(amount, {})
    if b == truth:
        agree_b += 1
    elif len(wrong) < 6:
        wrong.append((amount, truth, b))

print("scored against every multiset of coins, for amounts 0 to 399:")
print(f"  impossible kept as its own value    {agree_a:>4} of 400")
print(f"  impossible allowed to become 0      {agree_b:>4} of 400")
print()
print("the first few it gets wrong:")
for amount, truth, b in wrong:
    shown = truth if truth >= 0 else "cannot be made"
    print(f"  {amount:>3}: really {shown}, the folded version says {b}")
`,
          output: `coins [4, 6, 9]. '-' means the amount cannot be made at all.

amount               0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
brute force          0   -   -   -   1   -   1   -   2   1   2   -   2   2   3   2   3   3   2   3
impossible kept      0   -   -   -   1   -   1   -   2   1   2   -   2   2   3   2   3   3   2   3
impossible folded    0   -   -   -   1   0   0   0   0   0   0   0   0   1   1   1   1   1   1   1

scored against every multiset of coins, for amounts 0 to 399:
  impossible kept as its own value     400 of 400
  impossible allowed to become 0         5 of 400

the first few it gets wrong:
    5: really cannot be made, the folded version says 0
    6: really 1, the folded version says 0
    7: really cannot be made, the folded version says 0
    8: really 2, the folded version says 0
    9: really 1, the folded version says 0
   10: really 2, the folded version says 0`,
          explanation:
            "The two functions differ by the condition `sub >= 0`. The brute force enumerates every multiset of the three coins, so the '-' entries are established rather than assumed. Nineteen amounts are printed in full and four hundred are scored.",
          alternates: [
            {
              lang: "javascript",
              code: `// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".

const COINS = [4, 6, 9];

/** -1 means 'cannot be made', and it is contagious: it never becomes 0. */
function withSentinel(amount, memo) {
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer;
  if (amount === 0) {
    answer = 0;                     // the trivial state: nothing left to pay
  } else {
    answer = -1;                    // the impossible state, until proven otherwise
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = withSentinel(amount - coin, memo);
        if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/**
 * The same recurrence, missing the one guard that keeps -1 from spreading.
 *
 * Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1 and
 * costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
 */
function folded(amount, memo) {
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = -1;
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = folded(amount - coin, memo);
        if (answer < 0 || sub + 1 < answer) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/** Every multiset of these three coins, enumerated. */
function bruteForce(amount) {
  let best = -1;
  for (let a = 0; a * COINS[0] <= amount; a++) {
    for (let b = 0; a * COINS[0] + b * COINS[1] <= amount; b++) {
      const rest = amount - a * COINS[0] - b * COINS[1];
      if (rest % COINS[2] === 0) {
        const total = a + b + rest / COINS[2];
        if (best < 0 || total < best) best = total;
      }
    }
  }
  return best;
}

const cell = (value) => (value >= 0 ? String(value) : "-");
const pad = (v, w) => String(v).padStart(w);
const padEnd = (v, w) => String(v).padEnd(w);

console.log(\`coins [\${COINS.join(", ")}]. '-' means the amount cannot be made at all.\`);
console.log();

let header = padEnd("amount", 18);
let rowTruth = padEnd("brute force", 18);
let rowSentinel = padEnd("impossible kept", 18);
let rowZero = padEnd("impossible folded", 18);
for (let amount = 0; amount < 20; amount++) {
  header += pad(amount, 4);
  rowTruth += pad(cell(bruteForce(amount)), 4);
  rowSentinel += pad(cell(withSentinel(amount, new Map())), 4);
  rowZero += pad(cell(folded(amount, new Map())), 4);
}
console.log(header);
console.log(rowTruth);
console.log(rowSentinel);
console.log(rowZero);
console.log();

let agreeA = 0;
let agreeB = 0;
const wrong = [];
for (let amount = 0; amount < 400; amount++) {
  const truth = bruteForce(amount);
  if (withSentinel(amount, new Map()) === truth) agreeA++;
  const b = folded(amount, new Map());
  if (b === truth) {
    agreeB++;
  } else if (wrong.length < 6) {
    wrong.push([amount, truth, b]);
  }
}

console.log("scored against every multiset of coins, for amounts 0 to 399:");
console.log(\`  impossible kept as its own value    \${pad(agreeA, 4)} of 400\`);
console.log(\`  impossible allowed to become 0      \${pad(agreeB, 4)} of 400\`);
console.log();
console.log("the first few it gets wrong:");
for (const [amount, truth, b] of wrong) {
  const shown = truth >= 0 ? String(truth) : "cannot be made";
  console.log(\`  \${pad(amount, 3)}: really \${shown}, the folded version says \${b}\`);
}
`,
            },
            {
              lang: "typescript",
              code: `// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".

const COINS = [4, 6, 9];

/** -1 means 'cannot be made', and it is contagious: it never becomes 0. */
function withSentinel(amount: number, memo: Map<number, number>): number {
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer: number;
  if (amount === 0) {
    answer = 0;                     // the trivial state: nothing left to pay
  } else {
    answer = -1;                    // the impossible state, until proven otherwise
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = withSentinel(amount - coin, memo);
        if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/**
 * The same recurrence, missing the one guard that keeps -1 from spreading.
 *
 * Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1 and
 * costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
 */
function folded(amount: number, memo: Map<number, number>): number {
  const seen = memo.get(amount);
  if (seen !== undefined) return seen;
  let answer: number;
  if (amount === 0) {
    answer = 0;
  } else {
    answer = -1;
    for (const coin of COINS) {
      if (coin <= amount) {
        const sub = folded(amount - coin, memo);
        if (answer < 0 || sub + 1 < answer) answer = sub + 1;
      }
    }
  }
  memo.set(amount, answer);
  return answer;
}

/** Every multiset of these three coins, enumerated. */
function bruteForce(amount: number): number {
  let best = -1;
  for (let a = 0; a * COINS[0] <= amount; a++) {
    for (let b = 0; a * COINS[0] + b * COINS[1] <= amount; b++) {
      const rest = amount - a * COINS[0] - b * COINS[1];
      if (rest % COINS[2] === 0) {
        const total = a + b + rest / COINS[2];
        if (best < 0 || total < best) best = total;
      }
    }
  }
  return best;
}

const cell = (value: number): string => (value >= 0 ? String(value) : "-");
const pad = (v: string | number, w: number): string => String(v).padStart(w);
const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);

console.log(\`coins [\${COINS.join(", ")}]. '-' means the amount cannot be made at all.\`);
console.log();

let header = padEnd("amount", 18);
let rowTruth = padEnd("brute force", 18);
let rowSentinel = padEnd("impossible kept", 18);
let rowZero = padEnd("impossible folded", 18);
for (let amount = 0; amount < 20; amount++) {
  header += pad(amount, 4);
  rowTruth += pad(cell(bruteForce(amount)), 4);
  rowSentinel += pad(cell(withSentinel(amount, new Map())), 4);
  rowZero += pad(cell(folded(amount, new Map())), 4);
}
console.log(header);
console.log(rowTruth);
console.log(rowSentinel);
console.log(rowZero);
console.log();

let agreeA = 0;
let agreeB = 0;
const wrong: [number, number, number][] = [];
for (let amount = 0; amount < 400; amount++) {
  const truth = bruteForce(amount);
  if (withSentinel(amount, new Map()) === truth) agreeA++;
  const b = folded(amount, new Map());
  if (b === truth) {
    agreeB++;
  } else if (wrong.length < 6) {
    wrong.push([amount, truth, b]);
  }
}

console.log("scored against every multiset of coins, for amounts 0 to 399:");
console.log(\`  impossible kept as its own value    \${pad(agreeA, 4)} of 400\`);
console.log(\`  impossible allowed to become 0      \${pad(agreeB, 4)} of 400\`);
console.log();
console.log("the first few it gets wrong:");
for (const [amount, truth, b] of wrong) {
  const shown = truth >= 0 ? String(truth) : "cannot be made";
  console.log(\`  \${pad(amount, 3)}: really \${shown}, the folded version says \${b}\`);
}
`,
            },
            {
              lang: "java",
              code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".
public class Main {
    static final int[] COINS = { 4, 6, 9 };

    /** -1 means 'cannot be made', and it is contagious: it never becomes 0. */
    static int withSentinel(int amount, Map<Integer, Integer> memo) {
        if (memo.containsKey(amount)) return memo.get(amount);
        int answer;
        if (amount == 0) {
            answer = 0;                     // the trivial state: nothing left to pay
        } else {
            answer = -1;                    // the impossible state, until proven otherwise
            for (int coin : COINS) {
                if (coin <= amount) {
                    int sub = withSentinel(amount - coin, memo);
                    if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
                }
            }
        }
        memo.put(amount, answer);
        return answer;
    }

    /**
     * The same recurrence, missing the one guard that keeps -1 from spreading.
     *
     * Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1
     * and costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
     */
    static int folded(int amount, Map<Integer, Integer> memo) {
        if (memo.containsKey(amount)) return memo.get(amount);
        int answer;
        if (amount == 0) {
            answer = 0;
        } else {
            answer = -1;
            for (int coin : COINS) {
                if (coin <= amount) {
                    int sub = folded(amount - coin, memo);
                    if (answer < 0 || sub + 1 < answer) answer = sub + 1;
                }
            }
        }
        memo.put(amount, answer);
        return answer;
    }

    /** Every multiset of these three coins, enumerated. */
    static int bruteForce(int amount) {
        int best = -1;
        int a = 0;
        while (a * COINS[0] <= amount) {
            int b = 0;
            while (a * COINS[0] + b * COINS[1] <= amount) {
                int rest = amount - a * COINS[0] - b * COINS[1];
                if (rest % COINS[2] == 0) {
                    int total = a + b + rest / COINS[2];
                    if (best < 0 || total < best) best = total;
                }
                b++;
            }
            a++;
        }
        return best;
    }

    static String cell(int value) {
        return value >= 0 ? String.valueOf(value) : "-";
    }

    public static void main(String[] args) {
        StringBuilder coins = new StringBuilder();
        for (int i = 0; i < COINS.length; i++) {
            if (i > 0) coins.append(", ");
            coins.append(COINS[i]);
        }
        System.out.printf("coins [%s]. '-' means the amount cannot be made at all.%n", coins);
        System.out.println();

        StringBuilder header = new StringBuilder(String.format("%-18s", "amount"));
        StringBuilder rowTruth = new StringBuilder(String.format("%-18s", "brute force"));
        StringBuilder rowSentinel = new StringBuilder(String.format("%-18s", "impossible kept"));
        StringBuilder rowZero = new StringBuilder(String.format("%-18s", "impossible folded"));
        for (int amount = 0; amount < 20; amount++) {
            header.append(String.format("%4d", amount));
            rowTruth.append(String.format("%4s", cell(bruteForce(amount))));
            rowSentinel.append(String.format("%4s", cell(withSentinel(amount, new HashMap<>()))));
            rowZero.append(String.format("%4s", cell(folded(amount, new HashMap<>()))));
        }
        System.out.println(header);
        System.out.println(rowTruth);
        System.out.println(rowSentinel);
        System.out.println(rowZero);
        System.out.println();

        int agreeA = 0;
        int agreeB = 0;
        List<int[]> wrong = new ArrayList<>();
        for (int amount = 0; amount < 400; amount++) {
            int truth = bruteForce(amount);
            if (withSentinel(amount, new HashMap<>()) == truth) agreeA++;
            int b = folded(amount, new HashMap<>());
            if (b == truth) {
                agreeB++;
            } else if (wrong.size() < 6) {
                wrong.add(new int[] { amount, truth, b });
            }
        }

        System.out.println("scored against every multiset of coins, for amounts 0 to 399:");
        System.out.printf("  impossible kept as its own value    %4d of 400%n", agreeA);
        System.out.printf("  impossible allowed to become 0      %4d of 400%n", agreeB);
        System.out.println();
        System.out.println("the first few it gets wrong:");
        for (int[] row : wrong) {
            String shown = row[1] >= 0 ? String.valueOf(row[1]) : "cannot be made";
            System.out.printf("  %3d: really %s, the folded version says %d%n", row[0], shown, row[2]);
        }
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".
#include <array>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>

static const std::array<int, 3> COINS = {4, 6, 9};

// -1 means 'cannot be made', and it is contagious: it never becomes 0.
int withSentinel(int amount, std::map<int, int> &memo) {
    auto it = memo.find(amount);
    if (it != memo.end()) return it->second;
    int answer;
    if (amount == 0) {
        answer = 0;                 // the trivial state: nothing left to pay
    } else {
        answer = -1;                // the impossible state, until proven otherwise
        for (int coin : COINS) {
            if (coin <= amount) {
                int sub = withSentinel(amount - coin, memo);
                if (sub >= 0 && (answer < 0 || sub + 1 < answer)) answer = sub + 1;
            }
        }
    }
    memo[amount] = answer;
    return answer;
}

// The same recurrence, missing the one guard that keeps -1 from spreading.
//
// Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1 and
// costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
int folded(int amount, std::map<int, int> &memo) {
    auto it = memo.find(amount);
    if (it != memo.end()) return it->second;
    int answer;
    if (amount == 0) {
        answer = 0;
    } else {
        answer = -1;
        for (int coin : COINS) {
            if (coin <= amount) {
                int sub = folded(amount - coin, memo);
                if (answer < 0 || sub + 1 < answer) answer = sub + 1;
            }
        }
    }
    memo[amount] = answer;
    return answer;
}

// Every multiset of these three coins, enumerated.
int bruteForce(int amount) {
    int best = -1;
    for (int a = 0; a * COINS[0] <= amount; a++) {
        for (int b = 0; a * COINS[0] + b * COINS[1] <= amount; b++) {
            int rest = amount - a * COINS[0] - b * COINS[1];
            if (rest % COINS[2] == 0) {
                int total = a + b + rest / COINS[2];
                if (best < 0 || total < best) best = total;
            }
        }
    }
    return best;
}

std::string cell(int value) {
    return value >= 0 ? std::to_string(value) : "-";
}

std::string padLeft(const std::string &text, int width) {
    return std::string(width - static_cast<int>(text.size()), ' ') + text;
}

int main() {
    std::cout << "coins [";
    for (size_t i = 0; i < COINS.size(); i++) {
        if (i > 0) std::cout << ", ";
        std::cout << COINS[i];
    }
    std::cout << "]. '-' means the amount cannot be made at all.\\n\\n";

    std::string header = "amount", rowTruth = "brute force";
    std::string rowSentinel = "impossible kept", rowZero = "impossible folded";
    header.resize(18, ' ');
    rowTruth.resize(18, ' ');
    rowSentinel.resize(18, ' ');
    rowZero.resize(18, ' ');
    for (int amount = 0; amount < 20; amount++) {
        std::map<int, int> a, b;
        header += padLeft(std::to_string(amount), 4);
        rowTruth += padLeft(cell(bruteForce(amount)), 4);
        rowSentinel += padLeft(cell(withSentinel(amount, a)), 4);
        rowZero += padLeft(cell(folded(amount, b)), 4);
    }
    std::cout << header << "\\n" << rowTruth << "\\n" << rowSentinel << "\\n" << rowZero << "\\n\\n";

    int agreeA = 0, agreeB = 0;
    std::vector<std::array<int, 3>> wrong;
    for (int amount = 0; amount < 400; amount++) {
        int truth = bruteForce(amount);
        std::map<int, int> a, b;
        if (withSentinel(amount, a) == truth) agreeA++;
        int folded_answer = folded(amount, b);
        if (folded_answer == truth) {
            agreeB++;
        } else if (wrong.size() < 6) {
            wrong.push_back({amount, truth, folded_answer});
        }
    }

    std::cout << "scored against every multiset of coins, for amounts 0 to 399:\\n";
    std::cout << "  impossible kept as its own value    " << std::setw(4) << agreeA << " of 400\\n";
    std::cout << "  impossible allowed to become 0      " << std::setw(4) << agreeB << " of 400\\n\\n";
    std::cout << "the first few it gets wrong:\\n";
    for (const auto &row : wrong) {
        std::string shown = row[1] >= 0 ? std::to_string(row[1]) : "cannot be made";
        std::cout << "  " << std::setw(3) << row[0] << ": really " << shown
                  << ", the folded version says " << row[2] << "\\n";
    }
}
`,
            },
            {
              lang: "rust",
              code: `// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".
use std::collections::HashMap;

const COINS: [i32; 3] = [4, 6, 9];

/// -1 means 'cannot be made', and it is contagious: it never becomes 0.
fn with_sentinel(amount: i32, memo: &mut HashMap<i32, i32>) -> i32 {
    if let Some(&v) = memo.get(&amount) {
        return v;
    }
    let answer = if amount == 0 {
        0 // the trivial state: nothing left to pay
    } else {
        let mut best = -1; // the impossible state, until proven otherwise
        for &coin in COINS.iter() {
            if coin <= amount {
                let sub = with_sentinel(amount - coin, memo);
                if sub >= 0 && (best < 0 || sub + 1 < best) {
                    best = sub + 1;
                }
            }
        }
        best
    };
    memo.insert(amount, answer);
    answer
}

/// The same recurrence, missing the one guard that keeps -1 from spreading.
///
/// Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1
/// and costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
fn folded(amount: i32, memo: &mut HashMap<i32, i32>) -> i32 {
    if let Some(&v) = memo.get(&amount) {
        return v;
    }
    let answer = if amount == 0 {
        0
    } else {
        let mut best = -1;
        for &coin in COINS.iter() {
            if coin <= amount {
                let sub = folded(amount - coin, memo);
                if best < 0 || sub + 1 < best {
                    best = sub + 1;
                }
            }
        }
        best
    };
    memo.insert(amount, answer);
    answer
}

/// Every multiset of these three coins, enumerated.
fn brute_force(amount: i32) -> i32 {
    let mut best = -1;
    let mut a = 0;
    while a * COINS[0] <= amount {
        let mut b = 0;
        while a * COINS[0] + b * COINS[1] <= amount {
            let rest = amount - a * COINS[0] - b * COINS[1];
            if rest % COINS[2] == 0 {
                let total = a + b + rest / COINS[2];
                if best < 0 || total < best {
                    best = total;
                }
            }
            b += 1;
        }
        a += 1;
    }
    best
}

fn cell(value: i32) -> String {
    if value >= 0 { value.to_string() } else { String::from("-") }
}

fn main() {
    let coins: Vec<String> = COINS.iter().map(|c| c.to_string()).collect();
    println!("coins [{}]. '-' means the amount cannot be made at all.", coins.join(", "));
    println!();

    let mut header = format!("{:<18}", "amount");
    let mut row_truth = format!("{:<18}", "brute force");
    let mut row_sentinel = format!("{:<18}", "impossible kept");
    let mut row_zero = format!("{:<18}", "impossible folded");
    for amount in 0..20 {
        header.push_str(&format!("{:>4}", amount));
        row_truth.push_str(&format!("{:>4}", cell(brute_force(amount))));
        row_sentinel.push_str(&format!("{:>4}", cell(with_sentinel(amount, &mut HashMap::new()))));
        row_zero.push_str(&format!("{:>4}", cell(folded(amount, &mut HashMap::new()))));
    }
    println!("{}", header);
    println!("{}", row_truth);
    println!("{}", row_sentinel);
    println!("{}", row_zero);
    println!();

    let mut agree_a = 0;
    let mut agree_b = 0;
    let mut wrong: Vec<(i32, i32, i32)> = Vec::new();
    for amount in 0..400 {
        let truth = brute_force(amount);
        if with_sentinel(amount, &mut HashMap::new()) == truth {
            agree_a += 1;
        }
        let b = folded(amount, &mut HashMap::new());
        if b == truth {
            agree_b += 1;
        } else if wrong.len() < 6 {
            wrong.push((amount, truth, b));
        }
    }

    println!("scored against every multiset of coins, for amounts 0 to 399:");
    println!("  impossible kept as its own value    {:>4} of 400", agree_a);
    println!("  impossible allowed to become 0      {:>4} of 400", agree_b);
    println!();
    println!("the first few it gets wrong:");
    for (amount, truth, b) in wrong {
        let shown = if truth >= 0 { truth.to_string() } else { String::from("cannot be made") };
        println!("  {:>3}: really {}, the folded version says {}", amount, shown, b);
    }
}
`,
            },
            {
              lang: "go",
              code: `// Base cases are where a recurrence touches the ground, and there are two of
// them in most problems rather than one: the state that is trivially solved, and
// the state that has no solution at all. Collapsing the second into the first is
// the commonest arithmetic bug in dynamic programming, because zero is such a
// natural-looking answer for "nothing to do here".
package main

import (
	"fmt"
	"strconv"
	"strings"
)

var COINS = []int{4, 6, 9}

// -1 means 'cannot be made', and it is contagious: it never becomes 0.
func withSentinel(amount int, memo map[int]int) int {
	if v, ok := memo[amount]; ok {
		return v
	}
	var answer int
	if amount == 0 {
		answer = 0 // the trivial state: nothing left to pay
	} else {
		answer = -1 // the impossible state, until proven otherwise
		for _, coin := range COINS {
			if coin <= amount {
				sub := withSentinel(amount-coin, memo)
				if sub >= 0 && (answer < 0 || sub+1 < answer) {
					answer = sub + 1
				}
			}
		}
	}
	memo[amount] = answer
	return answer
}

// The same recurrence, missing the one guard that keeps -1 from spreading.
//
// Without \`sub >= 0\`, an impossible subproblem is treated as an answer of -1 and
// costed at -1 + 1 = 0, so "cannot be made" quietly becomes "free".
func folded(amount int, memo map[int]int) int {
	if v, ok := memo[amount]; ok {
		return v
	}
	var answer int
	if amount == 0 {
		answer = 0
	} else {
		answer = -1
		for _, coin := range COINS {
			if coin <= amount {
				sub := folded(amount-coin, memo)
				if answer < 0 || sub+1 < answer {
					answer = sub + 1
				}
			}
		}
	}
	memo[amount] = answer
	return answer
}

// Every multiset of these three coins, enumerated.
func bruteForce(amount int) int {
	best := -1
	for a := 0; a*COINS[0] <= amount; a++ {
		for b := 0; a*COINS[0]+b*COINS[1] <= amount; b++ {
			rest := amount - a*COINS[0] - b*COINS[1]
			if rest%COINS[2] == 0 {
				total := a + b + rest/COINS[2]
				if best < 0 || total < best {
					best = total
				}
			}
		}
	}
	return best
}

func cell(value int) string {
	if value >= 0 {
		return strconv.Itoa(value)
	}
	return "-"
}

func main() {
	parts := make([]string, len(COINS))
	for i, c := range COINS {
		parts[i] = strconv.Itoa(c)
	}
	fmt.Printf("coins [%s]. '-' means the amount cannot be made at all.\\n", strings.Join(parts, ", "))
	fmt.Println()

	header := fmt.Sprintf("%-18s", "amount")
	rowTruth := fmt.Sprintf("%-18s", "brute force")
	rowSentinel := fmt.Sprintf("%-18s", "impossible kept")
	rowZero := fmt.Sprintf("%-18s", "impossible folded")
	for amount := 0; amount < 20; amount++ {
		header += fmt.Sprintf("%4d", amount)
		rowTruth += fmt.Sprintf("%4s", cell(bruteForce(amount)))
		rowSentinel += fmt.Sprintf("%4s", cell(withSentinel(amount, map[int]int{})))
		rowZero += fmt.Sprintf("%4s", cell(folded(amount, map[int]int{})))
	}
	fmt.Println(header)
	fmt.Println(rowTruth)
	fmt.Println(rowSentinel)
	fmt.Println(rowZero)
	fmt.Println()

	agreeA, agreeB := 0, 0
	var wrong [][3]int
	for amount := 0; amount < 400; amount++ {
		truth := bruteForce(amount)
		if withSentinel(amount, map[int]int{}) == truth {
			agreeA++
		}
		b := folded(amount, map[int]int{})
		if b == truth {
			agreeB++
		} else if len(wrong) < 6 {
			wrong = append(wrong, [3]int{amount, truth, b})
		}
	}

	fmt.Println("scored against every multiset of coins, for amounts 0 to 399:")
	fmt.Printf("  impossible kept as its own value    %4d of 400\\n", agreeA)
	fmt.Printf("  impossible allowed to become 0      %4d of 400\\n", agreeB)
	fmt.Println()
	fmt.Println("the first few it gets wrong:")
	for _, row := range wrong {
		shown := "cannot be made"
		if row[1] >= 0 {
			shown = strconv.Itoa(row[1])
		}
		fmt.Printf("  %3d: really %s, the folded version says %d\\n", row[0], shown, row[2])
	}
}
`,
            },
          ],
        },
      ],
      visual: {
        id: "dp-coin-change-table",
        kind: "dp",
        algorithm: "coins",
        title: "The row of amounts, filled from the bottom up",
        lockAlgorithm: true,
      },
      pitfalls: [
        {
          title: "Zero is the identity for a sum, not for a minimum",
          body: "It is the right base value for a count of coins already spent and the wrong one for \"this cannot be done\", and the two look identical on the page. The check that separates them is to ask what the operator would leave unchanged: adding zero changes no sum, but taking a minimum against zero destroys every positive answer it meets.",
        },
        {
          title: "An infinity has to survive being added to",
          body: "Using the largest representable integer as an infinity and then writing `best + cost` overflows to a large negative number, which then wins every minimum it is compared against \u2014 a wrong answer that looks like a spectacular bargain. Half the maximum is the conventional value and that is exactly why.",
        },
        {
          title: "For counting, the choices must partition and not merely cover",
          body: "A minimum does not care if two branches reach the same solution, and a sum cares enormously. Any recurrence that can produce the same object along two different paths will over-count, and the symptom is a number that is too large by an amount with no obvious pattern. The fix is usually to fix an order \u2014 count splits by their last word, subsets by their largest element \u2014 so that each object has exactly one derivation.",
        },
      ],
    },
    {
      id: "it-has-to-be-acyclic",
      heading: "And it has to be acyclic",
      body: [
        "The last requirement is the one that is rarely stated and quietly assumed everywhere: **the recurrence has to be acyclic.** Every state must depend only on states that are strictly closer to a base case, because a memo holds one value per state, and a cyclic recurrence does not have one value per state. It has a system of equations, and a system of equations needs a different kind of algorithm.",
        "Cheapest path through a grid makes the point without any new machinery. Restricted to steps down and right, every move increases `r + c`, so there is an order in which the states can be computed and the memo is sound. Allow all four directions and the same recurrence \u2014 same state, same combine, one longer list of moves \u2014 is no longer a recurrence at all: `(2,2)` depends on `(2,3)`, which depends on `(2,2)`.",
        "What people do about this in practice is patch the recursion so it terminates, usually by treating a state already on the stack as unreachable. That patch is worth looking at closely, because it does not fix anything \u2014 it just stops the crash.",
        "Four move orders, four different answers from the same recurrence: 49, 33, 25 and 9. A recurrence whose value depends on the order you happen to try the branches in does not have a value, and this is that statement as an experiment rather than an assertion.",
        "The last of the four is 9, which is the true answer, and that is the sting. Test one ordering and you may well conclude the code works. It is also worth noticing that on this grid the restricted down-and-right version already gives 9 \u2014 the extra directions buy nothing here \u2014 so the four disagreeing numbers are not the recurrence struggling with a hard instance. It is failing on an instance where the answer is easy, because it does not have an answer to give.",
        "The repair is not a cleverer memo. When the dependency graph has cycles and the costs are non-negative, the algorithm that settles those equations is Dijkstra, which computes states cheapest-first so that a state is only finalised once nothing can improve it; with equal costs it is breadth-first search, and with negative costs Bellman-Ford. That is lesson 1's optimal-substructure discussion arriving from the other side, and it is why the greedy module's \"Dijkstra breaks on a negative edge\" and this lesson's \"the recurrence must be acyclic\" are the same observation.",
        "The practical version of the check is short: **name a quantity that strictly decreases on every transition.** Prefix length, remaining capacity, index, amount \u2014 every dynamic program in this module has one. If you cannot name it, you may not have a recurrence yet.",
      ],
      examples: [
        {
          id: "cyclic-recurrence",
          title: "The same recurrence with two moves and with four",
          lang: "python",
          code: `# The last thing a recurrence has to be is acyclic. Every state must depend only
# on states that are strictly closer to a base case, because a memo stores one
# value per state and a cyclic recurrence does not have one value per state --
# it has an equation, and equations need a different kind of algorithm.
#
# The same grid, the same question, two rules about which way you may step.

COSTS = [
    [1, 1, 9, 1, 1],
    [9, 1, 1, 9, 1],
    [9, 1, 1, 1, 9],
    [9, 1, 1, 1, 9],
    [9, 1, 9, 1, 1],
]
ROWS = len(COSTS)
COLS = len(COSTS[0])
BIG = 10 ** 6

MOVES = [(1, 0), (0, 1), (-1, 0), (0, -1)]      # down, right, up, left


def downhill(r, c, memo):
    """Down and right only. Every move increases r + c, so the states are ordered."""
    if r == ROWS - 1 and c == COLS - 1:
        return COSTS[r][c]
    key = r * 100 + c
    if key in memo:
        return memo[key]
    best = BIG
    for dr, dc in MOVES[:2]:
        nr, nc = r + dr, c + dc
        if nr < ROWS and nc < COLS:
            step = downhill(nr, nc, memo)
            if step < best:
                best = step
    memo[key] = COSTS[r][c] + best
    return memo[key]


def cyclic(r, c, order, memo, onstack):
    """All four directions, memoised anyway. \`order\` is the order moves are tried.

    A state can now reach itself, so the memo is being asked for a value that
    depends on the value it is currently computing. The usual patch is to treat a
    state already on the stack as unreachable, which makes the recursion
    terminate without making the recurrence well-defined.
    """
    if r == ROWS - 1 and c == COLS - 1:
        return COSTS[r][c]
    key = r * 100 + c
    if key in memo:
        return memo[key]
    if key in onstack:
        return BIG
    onstack.add(key)
    best = BIG
    for index in order:
        dr, dc = MOVES[index]
        nr, nc = r + dr, c + dc
        if 0 <= nr < ROWS and 0 <= nc < COLS:
            step = cyclic(nr, nc, order, memo, onstack)
            if step < best:
                best = step
    onstack.remove(key)
    memo[key] = COSTS[r][c] + best
    return memo[key]


def dijkstra():
    """The right algorithm for a cyclic dependency: settle states cheapest-first."""
    dist = [BIG] * (ROWS * COLS)
    done = [False] * (ROWS * COLS)
    dist[0] = COSTS[0][0]
    for _ in range(ROWS * COLS):
        at = -1
        for i in range(ROWS * COLS):
            if not done[i] and (at < 0 or dist[i] < dist[at]):
                at = i
        if at < 0 or dist[at] >= BIG:
            break
        done[at] = True
        r, c = at // COLS, at % COLS
        for dr, dc in MOVES:
            nr, nc = r + dr, c + dc
            if 0 <= nr < ROWS and 0 <= nc < COLS:
                step = dist[at] + COSTS[nr][nc]
                if step < dist[nr * COLS + nc]:
                    dist[nr * COLS + nc] = step
    return dist[ROWS * COLS - 1]


print("cost of entering each square:")
for row in COSTS:
    print("  " + " ".join(str(v) for v in row))
print()

print(f"down and right only, memoised on (r, c):      {downhill(0, 0, {})}")
print()

# Four different orders for trying the same four moves. If the recurrence had a
# value, the order could not change it.
ORDERS = [
    ([0, 1, 2, 3], "down, right, up, left"),
    ([1, 0, 3, 2], "right, down, left, up"),
    ([2, 3, 0, 1], "up, left, down, right"),
    ([3, 2, 1, 0], "left, up, right, down"),
]
print("all four directions, memoised on (r, c) anyway:")
for order, label in ORDERS:
    print(f"  trying moves in the order {label:<24}{cyclic(0, 0, order, {}, set()):>6}")
print()
print(f"the true cheapest four-directional route, by Dijkstra:  {dijkstra()}")
`,
          output: `cost of entering each square:
  1 1 9 1 1
  9 1 1 9 1
  9 1 1 1 9
  9 1 1 1 9
  9 1 9 1 1

down and right only, memoised on (r, c):      9

all four directions, memoised on (r, c) anyway:
  trying moves in the order down, right, up, left       49
  trying moves in the order right, down, left, up       33
  trying moves in the order up, left, down, right       25
  trying moves in the order left, up, right, down        9

the true cheapest four-directional route, by Dijkstra:  9`,
          explanation:
            "The only difference between the two functions is the list of moves and the guard needed to stop the recursion running forever. The four orders are four permutations of the same move list, so any disagreement between them is a property of the recurrence rather than of the grid. Dijkstra at the end is the algorithm that does settle the equations.",
          alternates: [
            {
              lang: "javascript",
              code: `// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.

const COSTS = [
  [1, 1, 9, 1, 1],
  [9, 1, 1, 9, 1],
  [9, 1, 1, 1, 9],
  [9, 1, 1, 1, 9],
  [9, 1, 9, 1, 1],
];
const ROWS = COSTS.length;
const COLS = COSTS[0].length;
const BIG = 1000000;

const MOVES = [[1, 0], [0, 1], [-1, 0], [0, -1]];      // down, right, up, left

const padEnd = (v, w) => String(v).padEnd(w);
const pad = (v, w) => String(v).padStart(w);

/** Down and right only. Every move increases r + c, so the states are ordered. */
function downhill(r, c, memo) {
  if (r === ROWS - 1 && c === COLS - 1) return COSTS[r][c];
  const key = r * 100 + c;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let best = BIG;
  for (let m = 0; m < 2; m++) {
    const nr = r + MOVES[m][0];
    const nc = c + MOVES[m][1];
    if (nr < ROWS && nc < COLS) {
      const step = downhill(nr, nc, memo);
      if (step < best) best = step;
    }
  }
  memo.set(key, COSTS[r][c] + best);
  return COSTS[r][c] + best;
}

/**
 * All four directions, memoised anyway. \`order\` is the order moves are tried.
 *
 * A state can now reach itself, so the memo is being asked for a value that
 * depends on the value it is currently computing. The usual patch is to treat a
 * state already on the stack as unreachable, which makes the recursion terminate
 * without making the recurrence well-defined.
 */
function cyclic(r, c, order, memo, onstack) {
  if (r === ROWS - 1 && c === COLS - 1) return COSTS[r][c];
  const key = r * 100 + c;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  if (onstack.has(key)) return BIG;
  onstack.add(key);
  let best = BIG;
  for (const index of order) {
    const nr = r + MOVES[index][0];
    const nc = c + MOVES[index][1];
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const step = cyclic(nr, nc, order, memo, onstack);
      if (step < best) best = step;
    }
  }
  onstack.delete(key);
  memo.set(key, COSTS[r][c] + best);
  return COSTS[r][c] + best;
}

/** The right algorithm for a cyclic dependency: settle states cheapest-first. */
function dijkstra() {
  const dist = new Array(ROWS * COLS).fill(BIG);
  const done = new Array(ROWS * COLS).fill(false);
  dist[0] = COSTS[0][0];
  for (let step = 0; step < ROWS * COLS; step++) {
    let at = -1;
    for (let i = 0; i < ROWS * COLS; i++) {
      if (!done[i] && (at < 0 || dist[i] < dist[at])) at = i;
    }
    if (at < 0 || dist[at] >= BIG) break;
    done[at] = true;
    const r = Math.floor(at / COLS);
    const c = at % COLS;
    for (const [dr, dc] of MOVES) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const cost = dist[at] + COSTS[nr][nc];
        if (cost < dist[nr * COLS + nc]) dist[nr * COLS + nc] = cost;
      }
    }
  }
  return dist[ROWS * COLS - 1];
}

console.log("cost of entering each square:");
for (const row of COSTS) console.log("  " + row.join(" "));
console.log();

console.log(\`down and right only, memoised on (r, c):      \${downhill(0, 0, new Map())}\`);
console.log();

// Four different orders for trying the same four moves. If the recurrence had a
// value, the order could not change it.
const ORDERS = [
  [[0, 1, 2, 3], "down, right, up, left"],
  [[1, 0, 3, 2], "right, down, left, up"],
  [[2, 3, 0, 1], "up, left, down, right"],
  [[3, 2, 1, 0], "left, up, right, down"],
];
console.log("all four directions, memoised on (r, c) anyway:");
for (const [order, label] of ORDERS) {
  console.log(
    \`  trying moves in the order \${padEnd(label, 24)}\${pad(cyclic(0, 0, order, new Map(), new Set()), 6)}\`
  );
}
console.log();
console.log(\`the true cheapest four-directional route, by Dijkstra:  \${dijkstra()}\`);
`,
            },
            {
              lang: "typescript",
              code: `// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.

const COSTS = [
  [1, 1, 9, 1, 1],
  [9, 1, 1, 9, 1],
  [9, 1, 1, 1, 9],
  [9, 1, 1, 1, 9],
  [9, 1, 9, 1, 1],
];
const ROWS = COSTS.length;
const COLS = COSTS[0].length;
const BIG = 1000000;

const MOVES = [[1, 0], [0, 1], [-1, 0], [0, -1]];      // down, right, up, left

const padEnd = (v: string | number, w: number): string => String(v).padEnd(w);
const pad = (v: string | number, w: number): string => String(v).padStart(w);

/** Down and right only. Every move increases r + c, so the states are ordered. */
function downhill(r: number, c: number, memo: Map<number, number>): number {
  if (r === ROWS - 1 && c === COLS - 1) return COSTS[r][c];
  const key = r * 100 + c;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  let best = BIG;
  for (let m = 0; m < 2; m++) {
    const nr = r + MOVES[m][0];
    const nc = c + MOVES[m][1];
    if (nr < ROWS && nc < COLS) {
      const step = downhill(nr, nc, memo);
      if (step < best) best = step;
    }
  }
  memo.set(key, COSTS[r][c] + best);
  return COSTS[r][c] + best;
}

/**
 * All four directions, memoised anyway. \`order\` is the order moves are tried.
 *
 * A state can now reach itself, so the memo is being asked for a value that
 * depends on the value it is currently computing. The usual patch is to treat a
 * state already on the stack as unreachable, which makes the recursion terminate
 * without making the recurrence well-defined.
 */
function cyclic(r: number, c: number, order: number[], memo: Map<number, number>, onstack: Set<number>): number {
  if (r === ROWS - 1 && c === COLS - 1) return COSTS[r][c];
  const key = r * 100 + c;
  const seen = memo.get(key);
  if (seen !== undefined) return seen;
  if (onstack.has(key)) return BIG;
  onstack.add(key);
  let best = BIG;
  for (const index of order) {
    const nr = r + MOVES[index][0];
    const nc = c + MOVES[index][1];
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const step = cyclic(nr, nc, order, memo, onstack);
      if (step < best) best = step;
    }
  }
  onstack.delete(key);
  memo.set(key, COSTS[r][c] + best);
  return COSTS[r][c] + best;
}

/** The right algorithm for a cyclic dependency: settle states cheapest-first. */
function dijkstra(): number {
  const dist = new Array(ROWS * COLS).fill(BIG);
  const done = new Array(ROWS * COLS).fill(false);
  dist[0] = COSTS[0][0];
  for (let step = 0; step < ROWS * COLS; step++) {
    let at = -1;
    for (let i = 0; i < ROWS * COLS; i++) {
      if (!done[i] && (at < 0 || dist[i] < dist[at])) at = i;
    }
    if (at < 0 || dist[at] >= BIG) break;
    done[at] = true;
    const r = Math.floor(at / COLS);
    const c = at % COLS;
    for (const [dr, dc] of MOVES) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const cost = dist[at] + COSTS[nr][nc];
        if (cost < dist[nr * COLS + nc]) dist[nr * COLS + nc] = cost;
      }
    }
  }
  return dist[ROWS * COLS - 1];
}

console.log("cost of entering each square:");
for (const row of COSTS) console.log("  " + row.join(" "));
console.log();

console.log(\`down and right only, memoised on (r, c):      \${downhill(0, 0, new Map())}\`);
console.log();

// Four different orders for trying the same four moves. If the recurrence had a
// value, the order could not change it.
const ORDERS: [number[], string][] = [
  [[0, 1, 2, 3], "down, right, up, left"],
  [[1, 0, 3, 2], "right, down, left, up"],
  [[2, 3, 0, 1], "up, left, down, right"],
  [[3, 2, 1, 0], "left, up, right, down"],
];
console.log("all four directions, memoised on (r, c) anyway:");
for (const [order, label] of ORDERS) {
  console.log(
    \`  trying moves in the order \${padEnd(label, 24)}\${pad(cyclic(0, 0, order, new Map(), new Set()), 6)}\`
  );
}
console.log();
console.log(\`the true cheapest four-directional route, by Dijkstra:  \${dijkstra()}\`);
`,
            },
            {
              lang: "java",
              code: `import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.
public class Main {
    static final int[][] COSTS = {
        { 1, 1, 9, 1, 1 },
        { 9, 1, 1, 9, 1 },
        { 9, 1, 1, 1, 9 },
        { 9, 1, 1, 1, 9 },
        { 9, 1, 9, 1, 1 },
    };
    static final int ROWS = COSTS.length;
    static final int COLS = COSTS[0].length;
    static final int BIG = 1000000;

    static final int[][] MOVES = { { 1, 0 }, { 0, 1 }, { -1, 0 }, { 0, -1 } };  // down, right, up, left

    /** Down and right only. Every move increases r + c, so the states are ordered. */
    static int downhill(int r, int c, Map<Integer, Integer> memo) {
        if (r == ROWS - 1 && c == COLS - 1) return COSTS[r][c];
        int key = r * 100 + c;
        if (memo.containsKey(key)) return memo.get(key);
        int best = BIG;
        for (int m = 0; m < 2; m++) {
            int nr = r + MOVES[m][0];
            int nc = c + MOVES[m][1];
            if (nr < ROWS && nc < COLS) {
                int step = downhill(nr, nc, memo);
                if (step < best) best = step;
            }
        }
        memo.put(key, COSTS[r][c] + best);
        return memo.get(key);
    }

    /**
     * All four directions, memoised anyway. \`order\` is the order moves are tried.
     *
     * A state can now reach itself, so the memo is being asked for a value that
     * depends on the value it is currently computing. The usual patch is to treat
     * a state already on the stack as unreachable, which makes the recursion
     * terminate without making the recurrence well-defined.
     */
    static int cyclic(int r, int c, int[] order, Map<Integer, Integer> memo, Set<Integer> onstack) {
        if (r == ROWS - 1 && c == COLS - 1) return COSTS[r][c];
        int key = r * 100 + c;
        if (memo.containsKey(key)) return memo.get(key);
        if (onstack.contains(key)) return BIG;
        onstack.add(key);
        int best = BIG;
        for (int index : order) {
            int nr = r + MOVES[index][0];
            int nc = c + MOVES[index][1];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                int step = cyclic(nr, nc, order, memo, onstack);
                if (step < best) best = step;
            }
        }
        onstack.remove(key);
        memo.put(key, COSTS[r][c] + best);
        return memo.get(key);
    }

    /** The right algorithm for a cyclic dependency: settle states cheapest-first. */
    static int dijkstra() {
        int[] dist = new int[ROWS * COLS];
        boolean[] done = new boolean[ROWS * COLS];
        for (int i = 0; i < dist.length; i++) dist[i] = BIG;
        dist[0] = COSTS[0][0];
        for (int step = 0; step < ROWS * COLS; step++) {
            int at = -1;
            for (int i = 0; i < ROWS * COLS; i++) {
                if (!done[i] && (at < 0 || dist[i] < dist[at])) at = i;
            }
            if (at < 0 || dist[at] >= BIG) break;
            done[at] = true;
            int r = at / COLS;
            int c = at % COLS;
            for (int[] move : MOVES) {
                int nr = r + move[0];
                int nc = c + move[1];
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    int cost = dist[at] + COSTS[nr][nc];
                    if (cost < dist[nr * COLS + nc]) dist[nr * COLS + nc] = cost;
                }
            }
        }
        return dist[ROWS * COLS - 1];
    }

    public static void main(String[] args) {
        System.out.println("cost of entering each square:");
        for (int[] row : COSTS) {
            StringBuilder line = new StringBuilder("  ");
            for (int i = 0; i < row.length; i++) {
                if (i > 0) line.append(" ");
                line.append(row[i]);
            }
            System.out.println(line);
        }
        System.out.println();

        System.out.printf("down and right only, memoised on (r, c):      %d%n", downhill(0, 0, new HashMap<>()));
        System.out.println();

        // Four different orders for trying the same four moves. If the
        // recurrence had a value, the order could not change it.
        int[][] orders = { { 0, 1, 2, 3 }, { 1, 0, 3, 2 }, { 2, 3, 0, 1 }, { 3, 2, 1, 0 } };
        String[] labels = {
            "down, right, up, left", "right, down, left, up",
            "up, left, down, right", "left, up, right, down",
        };
        System.out.println("all four directions, memoised on (r, c) anyway:");
        for (int i = 0; i < orders.length; i++) {
            System.out.printf("  trying moves in the order %-24s%6d%n", labels[i],
                cyclic(0, 0, orders[i], new HashMap<>(), new HashSet<>()));
        }
        System.out.println();
        System.out.printf("the true cheapest four-directional route, by Dijkstra:  %d%n", dijkstra());
    }
}
`,
            },
            {
              lang: "cpp",
              code: `// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.
#include <array>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

static const std::vector<std::vector<int>> COSTS = {
    {1, 1, 9, 1, 1},
    {9, 1, 1, 9, 1},
    {9, 1, 1, 1, 9},
    {9, 1, 1, 1, 9},
    {9, 1, 9, 1, 1},
};
static const int ROWS = 5;
static const int COLS = 5;
static const int BIG = 1000000;

// down, right, up, left
static const std::array<std::array<int, 2>, 4> MOVES = {{{1, 0}, {0, 1}, {-1, 0}, {0, -1}}};

// Down and right only. Every move increases r + c, so the states are ordered.
int downhill(int r, int c, std::map<int, int> &memo) {
    if (r == ROWS - 1 && c == COLS - 1) return COSTS[r][c];
    int key = r * 100 + c;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    int best = BIG;
    for (int m = 0; m < 2; m++) {
        int nr = r + MOVES[m][0], nc = c + MOVES[m][1];
        if (nr < ROWS && nc < COLS) {
            int step = downhill(nr, nc, memo);
            if (step < best) best = step;
        }
    }
    memo[key] = COSTS[r][c] + best;
    return memo[key];
}

// All four directions, memoised anyway. \`order\` is the order moves are tried.
//
// A state can now reach itself, so the memo is being asked for a value that
// depends on the value it is currently computing. The usual patch is to treat a
// state already on the stack as unreachable, which makes the recursion terminate
// without making the recurrence well-defined.
int cyclic(int r, int c, const std::array<int, 4> &order, std::map<int, int> &memo,
           std::set<int> &onstack) {
    if (r == ROWS - 1 && c == COLS - 1) return COSTS[r][c];
    int key = r * 100 + c;
    auto it = memo.find(key);
    if (it != memo.end()) return it->second;
    if (onstack.count(key)) return BIG;
    onstack.insert(key);
    int best = BIG;
    for (int index : order) {
        int nr = r + MOVES[index][0], nc = c + MOVES[index][1];
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            int step = cyclic(nr, nc, order, memo, onstack);
            if (step < best) best = step;
        }
    }
    onstack.erase(key);
    memo[key] = COSTS[r][c] + best;
    return memo[key];
}

// The right algorithm for a cyclic dependency: settle states cheapest-first.
int dijkstra() {
    std::vector<int> dist(ROWS * COLS, BIG);
    std::vector<bool> done(ROWS * COLS, false);
    dist[0] = COSTS[0][0];
    for (int step = 0; step < ROWS * COLS; step++) {
        int at = -1;
        for (int i = 0; i < ROWS * COLS; i++) {
            if (!done[i] && (at < 0 || dist[i] < dist[at])) at = i;
        }
        if (at < 0 || dist[at] >= BIG) break;
        done[at] = true;
        int r = at / COLS, c = at % COLS;
        for (const auto &move : MOVES) {
            int nr = r + move[0], nc = c + move[1];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                int cost = dist[at] + COSTS[nr][nc];
                if (cost < dist[nr * COLS + nc]) dist[nr * COLS + nc] = cost;
            }
        }
    }
    return dist[ROWS * COLS - 1];
}

int main() {
    std::cout << "cost of entering each square:\\n";
    for (const auto &row : COSTS) {
        std::cout << "  ";
        for (size_t i = 0; i < row.size(); i++) {
            if (i > 0) std::cout << " ";
            std::cout << row[i];
        }
        std::cout << "\\n";
    }
    std::cout << "\\n";

    std::map<int, int> memo;
    std::cout << "down and right only, memoised on (r, c):      " << downhill(0, 0, memo) << "\\n\\n";

    // Four different orders for trying the same four moves. If the recurrence
    // had a value, the order could not change it.
    std::array<std::array<int, 4>, 4> orders = {{{0, 1, 2, 3}, {1, 0, 3, 2}, {2, 3, 0, 1}, {3, 2, 1, 0}}};
    std::array<std::string, 4> labels = {
        "down, right, up, left", "right, down, left, up",
        "up, left, down, right", "left, up, right, down",
    };
    std::cout << "all four directions, memoised on (r, c) anyway:\\n";
    for (int i = 0; i < 4; i++) {
        std::map<int, int> m;
        std::set<int> onstack;
        std::cout << "  trying moves in the order " << std::left << std::setw(24) << labels[i]
                  << std::right << std::setw(6) << cyclic(0, 0, orders[i], m, onstack) << "\\n";
    }
    std::cout << "\\n";
    std::cout << "the true cheapest four-directional route, by Dijkstra:  " << dijkstra() << "\\n";
}
`,
            },
            {
              lang: "rust",
              code: `// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.
use std::collections::{HashMap, HashSet};

const COSTS: [[i32; 5]; 5] = [
    [1, 1, 9, 1, 1],
    [9, 1, 1, 9, 1],
    [9, 1, 1, 1, 9],
    [9, 1, 1, 1, 9],
    [9, 1, 9, 1, 1],
];
const ROWS: i32 = 5;
const COLS: i32 = 5;
const BIG: i32 = 1000000;

const MOVES: [(i32, i32); 4] = [(1, 0), (0, 1), (-1, 0), (0, -1)]; // down, right, up, left

/// Down and right only. Every move increases r + c, so the states are ordered.
fn downhill(r: i32, c: i32, memo: &mut HashMap<i32, i32>) -> i32 {
    if r == ROWS - 1 && c == COLS - 1 {
        return COSTS[r as usize][c as usize];
    }
    let key = r * 100 + c;
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let mut best = BIG;
    for m in 0..2 {
        let (nr, nc) = (r + MOVES[m].0, c + MOVES[m].1);
        if nr < ROWS && nc < COLS {
            let step = downhill(nr, nc, memo);
            if step < best {
                best = step;
            }
        }
    }
    let value = COSTS[r as usize][c as usize] + best;
    memo.insert(key, value);
    value
}

/// All four directions, memoised anyway. \`order\` is the order moves are tried.
///
/// A state can now reach itself, so the memo is being asked for a value that
/// depends on the value it is currently computing. The usual patch is to treat a
/// state already on the stack as unreachable, which makes the recursion
/// terminate without making the recurrence well-defined.
fn cyclic(
    r: i32, c: i32, order: &[usize; 4], memo: &mut HashMap<i32, i32>, onstack: &mut HashSet<i32>,
) -> i32 {
    if r == ROWS - 1 && c == COLS - 1 {
        return COSTS[r as usize][c as usize];
    }
    let key = r * 100 + c;
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    if onstack.contains(&key) {
        return BIG;
    }
    onstack.insert(key);
    let mut best = BIG;
    for &index in order.iter() {
        let (nr, nc) = (r + MOVES[index].0, c + MOVES[index].1);
        if nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS {
            let step = cyclic(nr, nc, order, memo, onstack);
            if step < best {
                best = step;
            }
        }
    }
    onstack.remove(&key);
    let value = COSTS[r as usize][c as usize] + best;
    memo.insert(key, value);
    value
}

/// The right algorithm for a cyclic dependency: settle states cheapest-first.
fn dijkstra() -> i32 {
    let n = (ROWS * COLS) as usize;
    let mut dist = vec![BIG; n];
    let mut done = vec![false; n];
    dist[0] = COSTS[0][0];
    for _ in 0..n {
        let mut at: i32 = -1;
        for i in 0..n {
            if !done[i] && (at < 0 || dist[i] < dist[at as usize]) {
                at = i as i32;
            }
        }
        if at < 0 || dist[at as usize] >= BIG {
            break;
        }
        done[at as usize] = true;
        let (r, c) = (at / COLS, at % COLS);
        for &(dr, dc) in MOVES.iter() {
            let (nr, nc) = (r + dr, c + dc);
            if nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS {
                let cost = dist[at as usize] + COSTS[nr as usize][nc as usize];
                let index = (nr * COLS + nc) as usize;
                if cost < dist[index] {
                    dist[index] = cost;
                }
            }
        }
    }
    dist[n - 1]
}

fn main() {
    println!("cost of entering each square:");
    for row in COSTS.iter() {
        println!("  {}", row.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(" "));
    }
    println!();

    println!("down and right only, memoised on (r, c):      {}", downhill(0, 0, &mut HashMap::new()));
    println!();

    // Four different orders for trying the same four moves. If the recurrence
    // had a value, the order could not change it.
    let orders: [[usize; 4]; 4] = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]];
    let labels = [
        "down, right, up, left", "right, down, left, up",
        "up, left, down, right", "left, up, right, down",
    ];
    println!("all four directions, memoised on (r, c) anyway:");
    for i in 0..4 {
        let answer = cyclic(0, 0, &orders[i], &mut HashMap::new(), &mut HashSet::new());
        println!("  trying moves in the order {:<24}{:>6}", labels[i], answer);
    }
    println!();
    println!("the true cheapest four-directional route, by Dijkstra:  {}", dijkstra());
}
`,
            },
            {
              lang: "go",
              code: `// The last thing a recurrence has to be is acyclic. Every state must depend only
// on states that are strictly closer to a base case, because a memo stores one
// value per state and a cyclic recurrence does not have one value per state --
// it has an equation, and equations need a different kind of algorithm.
//
// The same grid, the same question, two rules about which way you may step.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

var COSTS = [][]int{
	{1, 1, 9, 1, 1},
	{9, 1, 1, 9, 1},
	{9, 1, 1, 1, 9},
	{9, 1, 1, 1, 9},
	{9, 1, 9, 1, 1},
}

var ROWS = len(COSTS)
var COLS = len(COSTS[0])

const BIG = 1000000

var MOVES = [4][2]int{{1, 0}, {0, 1}, {-1, 0}, {0, -1}} // down, right, up, left

// Down and right only. Every move increases r + c, so the states are ordered.
func downhill(r, c int, memo map[int]int) int {
	if r == ROWS-1 && c == COLS-1 {
		return COSTS[r][c]
	}
	key := r*100 + c
	if v, ok := memo[key]; ok {
		return v
	}
	best := BIG
	for m := 0; m < 2; m++ {
		nr, nc := r+MOVES[m][0], c+MOVES[m][1]
		if nr < ROWS && nc < COLS {
			if step := downhill(nr, nc, memo); step < best {
				best = step
			}
		}
	}
	memo[key] = COSTS[r][c] + best
	return memo[key]
}

// All four directions, memoised anyway. \`order\` is the order moves are tried.
//
// A state can now reach itself, so the memo is being asked for a value that
// depends on the value it is currently computing. The usual patch is to treat a
// state already on the stack as unreachable, which makes the recursion terminate
// without making the recurrence well-defined.
func cyclic(r, c int, order [4]int, memo map[int]int, onstack map[int]bool) int {
	if r == ROWS-1 && c == COLS-1 {
		return COSTS[r][c]
	}
	key := r*100 + c
	if v, ok := memo[key]; ok {
		return v
	}
	if onstack[key] {
		return BIG
	}
	onstack[key] = true
	best := BIG
	for _, index := range order {
		nr, nc := r+MOVES[index][0], c+MOVES[index][1]
		if nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS {
			if step := cyclic(nr, nc, order, memo, onstack); step < best {
				best = step
			}
		}
	}
	delete(onstack, key)
	memo[key] = COSTS[r][c] + best
	return memo[key]
}

// The right algorithm for a cyclic dependency: settle states cheapest-first.
func dijkstra() int {
	dist := make([]int, ROWS*COLS)
	done := make([]bool, ROWS*COLS)
	for i := range dist {
		dist[i] = BIG
	}
	dist[0] = COSTS[0][0]
	for step := 0; step < ROWS*COLS; step++ {
		at := -1
		for i := 0; i < ROWS*COLS; i++ {
			if !done[i] && (at < 0 || dist[i] < dist[at]) {
				at = i
			}
		}
		if at < 0 || dist[at] >= BIG {
			break
		}
		done[at] = true
		r, c := at/COLS, at%COLS
		for _, move := range MOVES {
			nr, nc := r+move[0], c+move[1]
			if nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS {
				if cost := dist[at] + COSTS[nr][nc]; cost < dist[nr*COLS+nc] {
					dist[nr*COLS+nc] = cost
				}
			}
		}
	}
	return dist[ROWS*COLS-1]
}

func main() {
	fmt.Println("cost of entering each square:")
	for _, row := range COSTS {
		parts := make([]string, len(row))
		for i, v := range row {
			parts[i] = strconv.Itoa(v)
		}
		fmt.Println("  " + strings.Join(parts, " "))
	}
	fmt.Println()

	fmt.Printf("down and right only, memoised on (r, c):      %d\\n", downhill(0, 0, map[int]int{}))
	fmt.Println()

	// Four different orders for trying the same four moves. If the recurrence
	// had a value, the order could not change it.
	orders := [4][4]int{{0, 1, 2, 3}, {1, 0, 3, 2}, {2, 3, 0, 1}, {3, 2, 1, 0}}
	labels := [4]string{
		"down, right, up, left", "right, down, left, up",
		"up, left, down, right", "left, up, right, down",
	}
	fmt.Println("all four directions, memoised on (r, c) anyway:")
	for i, order := range orders {
		fmt.Printf("  trying moves in the order %-24s%6d\\n", labels[i],
			cyclic(0, 0, order, map[int]int{}, map[int]bool{}))
	}
	fmt.Println()
	fmt.Printf("the true cheapest four-directional route, by Dijkstra:  %d\\n", dijkstra())
}
`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A patch that stops the crash is not a fix",
          body: "Treating an on-stack state as unreachable makes the recursion terminate and produces a number, which is the worst of both worlds: it is quiet. The tell is that the number depends on the traversal order, and that is worth checking directly \u2014 permute the branch order and rerun. If the answer moves, the recurrence has no value.",
        },
        {
          title: "If nothing decreases, it is a graph problem",
          body: "Every dynamic program in this module has a quantity that strictly decreases on every transition. When you cannot name one, the honest reading is that the dependency structure is a general graph, and the right tools are the graph ones \u2014 breadth-first search for unit costs, Dijkstra for non-negative ones, Bellman-Ford when costs can be negative.",
        },
      ],
    },
    {
      id: "checking-a-recurrence",
      heading: "Four checks before the first run",
      body: [
        "Which gives four things to check on paper, before the first run.",
        "**Name the last decision, and enumerate it.** The choice set is the set of possible last moves into this state. Working backwards is what makes the list complete rather than merely long.",
        "**For a counting problem, check the choices partition rather than merely cover.** Every solution has to be produced by exactly one (state, choice) pair. Splits of a string are safe because a split determines its own last word, but a recurrence that can reach the same object two ways will double-count it, and unlike a minimum, a sum has no way to notice.",
        "**Match the base values to the operator.** Zero for a sum, one for a count of ways to do nothing, and an impossible value that the combine cannot turn back into a legal answer \u2014 guarded sentinel or a half-maximum infinity, one or the other and not both.",
        "**Name what strictly decreases.** If nothing does, the dependency graph has a cycle and no memo will save it.",
        "Then run it against a brute force on inputs small enough to enumerate. Every example in this module does that, and it is not diligence for its own sake \u2014 three of the failures in these four lessons print confident, plausible, wrong numbers, and a comparison against exhaustive search on a six-element input catches all of them in under a second.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you write the recurrence once you have the state?",
      answer:
        "I split it into the two decisions it is hiding. First the choice set, which I get by asking what the last decision was \u2014 the last word taken, the last coin spent, the last square stepped onto \u2014 because working backwards makes the list finite and obviously complete. Then the combine, which comes from the question rather than the problem: sum to count, minimum for cheapest, maximum for best, or for reachability. They are genuinely independent, which is easy to demonstrate: word break with one choice set gives the number of splits, the fewest words and the most, and the only thing that changes between the three is the operator.",
    },
    {
      question: "Your minimum-cost dynamic program returns small plausible numbers for inputs that have no solution at all. What happened?",
      answer:
        "The impossible case was folded into the trivial one. There are two base cases in most of these problems \u2014 nothing left to do, which costs zero, and no solution exists \u2014 and if the second is a sentinel like -1 that is not guarded on read, the first `+ 1` turns it into 0 and \"cannot be done\" becomes \"free\". It spreads, because everything above inherits it: on coins of 4, 6 and 9 the unguarded version is right on 5 of the first 400 amounts. Either guard every read of the sentinel, or use an infinity \u2014 and if it is an infinity, make it half the integer maximum rather than the maximum, so that adding a cost does not overflow into a large negative number that then wins every comparison.",
    },
    {
      question: "What has to be true about the dependencies between states?",
      answer:
        "They have to be acyclic \u2014 every state must depend only on states strictly closer to a base case \u2014 and the practical form of that check is to name a quantity that strictly decreases on every transition. Prefix length, remaining capacity, index, amount. Cheapest grid path is the clean illustration: restricted to down and right, `r + c` increases on every move, so the memo is sound. Allow all four directions and a square depends on a neighbour that depends back on it, and memoising anyway gives four different answers for four different orderings of the same four moves. When there is no such quantity the structure is a general graph and the right algorithm is a graph one \u2014 BFS, Dijkstra or Bellman-Ford depending on the costs.",
    },
  ],
  takeaways: [
    "A recurrence is two decisions: which choices exist at this state, and how their answers combine.",
    "Enumerate the choices by asking what the last decision was \u2014 that makes the list finite and complete.",
    "The combine comes from the question, not the problem: one choice set read three ways gives count, fewest and most.",
    "Most problems have two base cases \u2014 trivially solved and no solution at all \u2014 and folding them together is the classic bug.",
    "The base value must be the identity for the operator: 0 for a sum, 1 for a count of ways to do nothing.",
    "\"Impossible\" must survive the arithmetic. An unguarded -1 becomes 0 after one addition and is right on 5 amounts in 400.",
    "A recurrence must be acyclic; if the answer changes when you permute the branch order, it has no value to compute.",
    "When nothing strictly decreases along a transition, it is a graph problem \u2014 BFS, Dijkstra or Bellman-Ford, not a memo.",
  ],
  status: "available",
};
