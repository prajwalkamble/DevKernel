/**
 * Turns your Java attempt into a single file that runs the sheet's own test
 * cases on a real JDK.
 *
 * The browser cannot run Java, so instead of grading it here this builds the
 * file you would otherwise have written by hand — the cases inlined, the tree
 * inputs rebuilt, the results printed and counted — and leaves you one command
 * to run. It is graded against the same `expected` values as the other three
 * languages, canonicalised the same way, so "passes in Java" means what it does
 * everywhere else.
 *
 * The comparison travels as text on purpose: Java's primitive arrays make
 * structural equality across `int[]`, `char[][]` and `String` a pile of
 * overloads, whereas rendering both sides to the same JSON is one `show` method
 * per type and no chance of `Arrays.equals` being called where `deepEquals` was
 * meant.
 */

import type { Judge, JudgeType } from "@/content/practice";
import { canonical } from "./compare";
import { formatCaseInputs } from "./format";

function javaString(text: string): string {
  return `"${text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`;
}

function javaChar(value: unknown): string {
  const char = String(value);
  if (char === "'") return "'\\''";
  if (char === "\\") return "'\\\\'";
  return `'${char}'`;
}

function intList(value: unknown): string {
  return (value as number[]).map((n) => String(n)).join(", ");
}

/** A test-case argument as Java source of the declared type. */
function javaLiteral(value: unknown, type: JudgeType): string {
  switch (type) {
    case "int":
      return String(value);
    case "double":
      return `${String(value)}d`;
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return javaString(String(value));
    case "char":
      return javaChar(value);
    case "int[]":
      return `new int[]{${intList(value)}}`;
    case "string[]":
      return `new String[]{${(value as string[]).map(javaString).join(", ")}}`;
    case "char[]":
      return `new char[]{${(value as string[]).map(javaChar).join(", ")}}`;
    case "int[][]":
      return `new int[][]{${(value as number[][])
        .map((row) => `{${intList(row)}}`)
        .join(", ")}}`;
    case "List<int>":
      return `new ArrayList<>(Arrays.asList(${intList(value)}))`;
    case "List<List<int>>":
      return `new ArrayList<>(Arrays.<List<Integer>>asList(${(value as number[][])
        .map((row) => `Arrays.asList(${intList(row)})`)
        .join(", ")}))`;
    case "char[][]":
      return `new char[][]{${(value as string[][])
        .map((row) => `{${row.map(javaChar).join(", ")}}`)
        .join(", ")}}`;
    case "tree":
      // Integer, not int, because a missing child travels as null.
      return `buildTree(new Integer[]{${(value as (number | null)[])
        .map((n) => (n === null ? "null" : String(n)))
        .join(", ")}})`;
  }
}

/**
 * Wraps the returned value so it is canonicalised before it is rendered.
 * `unordered` problems say so in their statement — "in any order" — and the
 * harness has to honour that or it fails correct answers.
 */
function showCall(judge: Judge, expression: string): string {
  const unordered = judge.compare === "unordered";
  const nested = judge.compare === "unordered-nested";

  switch (judge.returns) {
    // `show` is overloaded across the primitive and array types, which Java
    // resolves from the static type of the argument. The two List types cannot
    // join it — generics erase to the same `show(List)` — so they get names.
    case "List<int>":
      return `showIntList(${unordered ? `sortAscList(${expression})` : expression})`;
    case "List<List<int>>":
      return `showIntListList(${nested ? `sortRowsList(${expression})` : expression})`;
    case "int[]":
      return `show(${unordered ? `sortAsc(${expression})` : expression})`;
    case "int[][]":
      return `show(${nested ? `sortRows(${expression})` : expression})`;
    default:
      return `show(${expression})`;
  }
}

const SHOW_HELPERS = `
    private static String quote(String v) {
        StringBuilder out = new StringBuilder("\\"");
        for (int i = 0; i < v.length(); i++) {
            char c = v.charAt(i);
            if (c == '"' || c == '\\\\') out.append('\\\\').append(c);
            else if (c == '\\n') out.append("\\\\n");
            else if (c == '\\t') out.append("\\\\t");
            else out.append(c);
        }
        return out.append('"').toString();
    }

    private static String show(int v) { return String.valueOf(v); }
    private static String show(boolean v) { return String.valueOf(v); }
    private static String show(char v) { return quote(String.valueOf(v)); }
    private static String show(String v) { return v == null ? "null" : quote(v); }

    // Whole doubles print as 2, not 2.0, to match the JSON the sheet stores.
    private static String show(double v) {
        if (v == Math.rint(v) && !Double.isInfinite(v)) return String.valueOf((long) v);
        return String.valueOf(v);
    }

    private static String show(int[] v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) out.append(','); out.append(v[i]); }
        return out.append(']').toString();
    }

    private static String show(char[] v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) out.append(','); out.append(show(v[i])); }
        return out.append(']').toString();
    }

    private static String show(String[] v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) out.append(','); out.append(show(v[i])); }
        return out.append(']').toString();
    }

    private static String show(int[][] v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) out.append(','); out.append(show(v[i])); }
        return out.append(']').toString();
    }

    private static String show(char[][] v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) out.append(','); out.append(show(v[i])); }
        return out.append(']').toString();
    }

    private static String showIntList(List<Integer> v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.size(); i++) { if (i > 0) out.append(','); out.append(v.get(i)); }
        return out.append(']').toString();
    }

    private static String showIntListList(List<List<Integer>> v) {
        if (v == null) return "null";
        StringBuilder out = new StringBuilder("[");
        for (int i = 0; i < v.size(); i++) { if (i > 0) out.append(','); out.append(showIntList(v.get(i))); }
        return out.append(']').toString();
    }

    private static int[] sortAsc(int[] v) {
        int[] copy = v.clone();
        Arrays.sort(copy);
        return copy;
    }

    // Sorts the values inside each row, then the rows against each other, by the
    // same lexicographic-then-shorter-first rule the browser judge uses.
    private static int[][] sortRows(int[][] v) {
        int[][] copy = new int[v.length][];
        for (int i = 0; i < v.length; i++) copy[i] = sortAsc(v[i]);
        Arrays.sort(copy, (a, b) -> {
            for (int i = 0; i < Math.min(a.length, b.length); i++) {
                if (a[i] != b[i]) return Integer.compare(a[i], b[i]);
            }
            return a.length - b.length;
        });
        return copy;
    }

    private static List<Integer> sortAscList(List<Integer> v) {
        List<Integer> copy = new ArrayList<>(v);
        Collections.sort(copy);
        return copy;
    }

    private static List<List<Integer>> sortRowsList(List<List<Integer>> v) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> row : v) copy.add(sortAscList(row));
        copy.sort((a, b) -> {
            for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                int order = Integer.compare(a.get(i), b.get(i));
                if (order != 0) return order;
            }
            return a.size() - b.size();
        });
        return copy;
    }
`;

/**
 * Top-level rather than nested, so it is equally visible to a `Solution` class
 * written beside Main and to a bare static method written inside it.
 */
const TREE_CLASS = `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}
`;

const TREE_HELPERS = `
    /** Rebuilds a tree from LeetCode's level-order array, where null is a missing child. */
    private static TreeNode buildTree(Integer[] level) {
        if (level.length == 0 || level[0] == null) return null;
        TreeNode root = new TreeNode(level[0]);
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < level.length) {
            TreeNode node = queue.poll();
            if (i < level.length) {
                Integer v = level[i++];
                if (v != null) { node.left = new TreeNode(v); queue.add(node.left); }
            }
            if (i < level.length) {
                Integer v = level[i++];
                if (v != null) { node.right = new TreeNode(v); queue.add(node.right); }
            }
        }
        return root;
    }
`;

const REPORT_HELPERS = `
    private static int passed = 0;
    private static int failed = 0;

    private static void check(int index, String actual, String expected, String inputs) {
        if (actual.equals(expected)) {
            passed++;
            System.out.println("  pass  case " + index);
        } else {
            failed++;
            System.out.println("  FAIL  case " + index);
            System.out.println("        input     " + inputs);
            System.out.println("        expected  " + expected);
            System.out.println("        got       " + actual);
        }
    }

    private static void crashed(int index, Throwable error, String inputs) {
        failed++;
        System.out.println("  FAIL  case " + index + " threw " + error);
        System.out.println("        input     " + inputs);
    }
`;

function indent(code: string, spaces: string): string {
  return code
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : spaces + line))
    .join("\n");
}

/** A `class Solution { ... }` anywhere in the code, which is how LeetCode frames it. */
const SOLUTION_CLASS = /(^|\n)\s*(public\s+)?(final\s+)?class\s+Solution\b/;

/**
 * Splits `import` lines out of your code.
 *
 * They have to move: an import is only legal at the top of a file, and the two
 * places your code can land — inside Main, or beside it — are both too late.
 * Keeping them rather than dropping them matters for the same reason, since
 * `import java.util.Set;` at the top of a pasted solution is common.
 */
function hoistImports(code: string): { imports: string[]; body: string } {
  const imports: string[] = [];
  const body = code
    .split("\n")
    .filter((line) => {
      if (/^\s*import\s+[\w.*]+\s*;/.test(line)) {
        imports.push(line.trim());
        return false;
      }
      return true;
    })
    .join("\n");
  return { imports, body };
}

/**
 * The whole file, ready to save as Main.java and run with `java Main.java`.
 *
 * Every case is wrapped individually so one exception reports as one failure
 * rather than ending the run — the same thing the browser runtimes do, for the
 * same reason: the second failing case usually tells you more than the first.
 */
export function buildJavaHarness(judge: Judge, title: string, userCode: string): string {
  const needsTree = judge.returns === "tree" || judge.params.some((p) => p.type === "tree");
  const { imports, body } = hoistImports(userCode.trimEnd());

  // Two shapes are accepted. A bare static method drops into Main; a Solution
  // class sits beside it, un-`public`-ed because a file holds only one of those.
  const solutionStyle = SOLUTION_CLASS.test(body);
  const call = solutionStyle ? `new Solution().${judge.entry}` : judge.entry;
  const declaredBeside = solutionStyle
    ? `${body.replace(/\bpublic\s+(final\s+)?class\s+Solution\b/, "class Solution")}\n`
    : "";

  const caseBlocks = judge.cases.map((testCase, i) => {
    const args = judge.params
      .map((param, j) => javaLiteral(testCase.args[j], param.type))
      .join(", ");
    const expected = javaString(
      JSON.stringify(canonical(testCase.expected, judge.compare ?? "exact"))
    );
    const inputs = javaString(formatCaseInputs(judge, testCase.args));
    return `        try {
            check(${i + 1}, ${showCall(judge, `${call}(${args})`)}, ${expected}, ${inputs});
        } catch (Throwable error) {
            crashed(${i + 1}, error, ${inputs});
        }`;
  });

  const extraImports = imports.filter((line) => line !== "import java.util.*;");

  return `// ${title}
//
// Generated by DevKernel from the same ${judge.cases.length} test cases the
// in-browser console grades Python, JavaScript and TypeScript against.
//
// Save this as Main.java and run it with:
//
//     java Main.java
//
// (JDK 11 and newer run a single source file directly — no javac step.)

import java.util.*;
${extraImports.length > 0 ? `${extraImports.join("\n")}\n` : ""}
${needsTree ? `\n${TREE_CLASS}` : ""}${declaredBeside}
public class Main {
${
  solutionStyle
    ? ""
    : `
    /* ----------------------------- your solution ----------------------------- */

${indent(body, "    ")}
`
}
    /* --------------------------- generated harness --------------------------- */
${needsTree ? TREE_HELPERS : ""}${SHOW_HELPERS}${REPORT_HELPERS}
    public static void main(String[] args) {
        System.out.println("${judge.entry} — ${judge.cases.length} cases");

${caseBlocks.join("\n\n")}

        System.out.println();
        System.out.println(failed == 0
            ? "All " + passed + " cases passed."
            : passed + " passed, " + failed + " failed.");
    }
}
`;
}
