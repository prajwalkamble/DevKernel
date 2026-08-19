/**
 * The eight languages the practice console offers, and the code it writes for
 * you in each of them.
 *
 * All eight run here, in the browser. JavaScript and TypeScript execute on a
 * Web Worker, Python on a CPython build compiled to WebAssembly, and C, C++,
 * Go, Java and Rust on the interpreters in `lib/runtimes`.
 *
 * Those five are interpreters written for this site rather than real
 * toolchains, so they will occasionally meet a corner of a standard library
 * they do not implement. When that happens the run reports `unsupported` and
 * names what was missing — never a failed case. A practice tool that tells you
 * a correct solution is wrong is worse than one that admits a gap.
 */
import type { Judge, JudgeType } from "@/content/practice";
import type { PracticeLanguage } from "./types";

export interface LanguageProfile {
  id: PracticeLanguage;
  label: string;
  /** Monaco's language id. */
  monaco: string;
  /** Shown on the editor tab, and used as the filename when you copy the code out. */
  filename: string;
  /** True when Run executes here; false when it hands you a file to run elsewhere. */
  runnable: boolean;
  tabSize: number;
  /** One line under the dropdown explaining what Run will do. */
  runtimeNote: string;
}

/**
 * Python leads because it is the language that runs fastest to a first answer
 * and the one whose code most resembles the pseudocode you would write on a
 * whiteboard. Java sits last because it is the one you have to leave the page
 * for.
 */
export const PRACTICE_LANGUAGE_ORDER: PracticeLanguage[] = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "c",
  "go",
  "rust",
];

export const LANGUAGE_PROFILES: Record<PracticeLanguage, LanguageProfile> = {
  python: {
    id: "python",
    label: "Python",
    monaco: "python",
    filename: "solution.py",
    runnable: true,
    tabSize: 4,
    runtimeNote: "Real CPython 3.14 compiled to WebAssembly. The whole standard library is here.",
  },
  javascript: {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    filename: "solution.js",
    runnable: true,
    tabSize: 2,
    runtimeNote: "Runs in a Web Worker on this page. Starts instantly.",
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    filename: "solution.ts",
    runnable: true,
    tabSize: 2,
    runtimeNote: "Types are stripped in the browser, then run as JavaScript in a Web Worker.",
  },
  java: {
    id: "java",
    label: "Java",
    monaco: "java",
    filename: "Main.java",
    runnable: true,
    tabSize: 4,
    runtimeNote:
      "Runs on this site's own Java interpreter: collections, generics, lambdas and comparators, checked against a real JDK.",
  },
  cpp: {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    filename: "solution.cpp",
    runnable: true,
    tabSize: 4,
    runtimeNote:
      "Runs on this site's own C++ interpreter. `vector`, `string`, `map` and the algorithms these problems need.",
  },
  c: {
    id: "c",
    label: "C",
    monaco: "c",
    filename: "solution.c",
    runnable: true,
    tabSize: 4,
    runtimeNote:
      "Runs on this site's own C interpreter, with the array-and-length calling convention C solutions use everywhere.",
  },
  go: {
    id: "go",
    label: "Go",
    monaco: "go",
    filename: "solution.go",
    runnable: true,
    tabSize: 4,
    runtimeNote: "Runs on this site's own Go interpreter: slices, maps, and the `sort` and `strings` packages.",
  },
  rust: {
    id: "rust",
    label: "Rust",
    monaco: "rust",
    filename: "solution.rs",
    runnable: true,
    tabSize: 4,
    runtimeNote:
      "Runs on this site's own Rust interpreter. Integer overflow panics here exactly as it does in a debug build.",
  },
};

/* ------------------------------------------------------------------ types -- */

const PYTHON_TYPES: Record<JudgeType, string> = {
  int: "int",
  double: "float",
  boolean: "bool",
  string: "str",
  char: "str",
  "int[]": "List[int]",
  "string[]": "List[str]",
  "char[]": "List[str]",
  "int[][]": "List[List[int]]",
  "char[][]": "List[List[str]]",
  "List<int>": "List[int]",
  "List<List<int>>": "List[List[int]]",
  tree: "Optional[TreeNode]",
};

const TS_TYPES: Record<JudgeType, string> = {
  int: "number",
  double: "number",
  boolean: "boolean",
  string: "string",
  char: "string",
  "int[]": "number[]",
  "string[]": "string[]",
  "char[]": "string[]",
  "int[][]": "number[][]",
  "char[][]": "string[][]",
  "List<int>": "number[]",
  "List<List<int>>": "number[][]",
  tree: "TreeNode | null",
};

const JAVA_TYPES: Record<JudgeType, string> = {
  int: "int",
  double: "double",
  boolean: "boolean",
  string: "String",
  char: "char",
  "int[]": "int[]",
  "string[]": "String[]",
  "char[]": "char[]",
  "int[][]": "int[][]",
  "char[][]": "char[][]",
  "List<int>": "List<Integer>",
  "List<List<int>>": "List<List<Integer>>",
  tree: "TreeNode",
};

function usesTree(judge: Judge): boolean {
  return judge.returns === "tree" || judge.params.some((p) => p.type === "tree");
}

/* ------------------------------------------------------------------ stubs -- */

const PYTHON_TREE_NOTE = `# A TreeNode with .val, .left and .right is already defined for you.`;

const JS_TREE_NOTE = `// A TreeNode with .val, .left and .right is already defined for you.`;

/**
 * `twoSum` -> `two_sum`. The judge's `entry` is LeetCode's name, which is
 * camelCase in every language including Python; this track's own Python is
 * snake_case, and every runtime accepts either, so the stub offers the one that
 * matches the solutions printed further down the page.
 */
export function pythonEntry(entry: string): string {
  return entry.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function pythonStub(judge: Judge): string {
  const params = judge.params.map((p) => `${p.name}: ${PYTHON_TYPES[p.type]}`).join(", ");
  const header = usesTree(judge) ? `${PYTHON_TREE_NOTE}\n\n` : "";
  return `from typing import List, Optional

${header}def ${pythonEntry(judge.entry)}(${params}) -> ${PYTHON_TYPES[judge.returns]}:
    # Your solution here.
    pass
`;
}

function javascriptStub(judge: Judge): string {
  const jsdoc = [
    "/**",
    ...judge.params.map((p) => ` * @param {${TS_TYPES[p.type]}} ${p.name}`),
    ` * @returns {${TS_TYPES[judge.returns]}}`,
    " */",
  ].join("\n");
  const params = judge.params.map((p) => p.name).join(", ");
  const header = usesTree(judge) ? `${JS_TREE_NOTE}\n\n` : "";
  return `${header}${jsdoc}
function ${judge.entry}(${params}) {
  // Your solution here.
}
`;
}

function typescriptStub(judge: Judge): string {
  const params = judge.params.map((p) => `${p.name}: ${TS_TYPES[p.type]}`).join(", ");
  const header = usesTree(judge)
    ? `interface TreeNode {\n  val: number;\n  left: TreeNode | null;\n  right: TreeNode | null;\n}\n\n`
    : "";
  return `${header}function ${judge.entry}(${params}): ${TS_TYPES[judge.returns]} {
  // Your solution here.
}
`;
}

function javaStub(judge: Judge): string {
  const params = judge.params.map((p) => `${JAVA_TYPES[p.type]} ${p.name}`).join(", ");
  const header = usesTree(judge)
    ? `// A static TreeNode class with val, left and right is already defined for you.\n\n`
    : "";
  // `static` is not decoration: the generated harness calls this straight from
  // main(), with no Solution instance to hang it off.
  return `${header}static ${JAVA_TYPES[judge.returns]} ${judge.entry}(${params}) {
    // Your solution here.
}
`;
}

/* ------------------------------------------------ the compiled languages -- */

const CPP_TYPES: Record<JudgeType, string> = {
  int: "int",
  double: "double",
  boolean: "bool",
  string: "string",
  char: "char",
  "int[]": "vector<int>",
  "string[]": "vector<string>",
  "char[]": "vector<char>",
  "int[][]": "vector<vector<int>>",
  "char[][]": "vector<vector<char>>",
  "List<int>": "vector<int>",
  "List<List<int>>": "vector<vector<int>>",
  tree: "TreeNode*",
};

const GO_TYPES: Record<JudgeType, string> = {
  int: "int",
  double: "float64",
  boolean: "bool",
  string: "string",
  char: "byte",
  "int[]": "[]int",
  "string[]": "[]string",
  "char[]": "[]byte",
  "int[][]": "[][]int",
  "char[][]": "[][]byte",
  "List<int>": "[]int",
  "List<List<int>>": "[][]int",
  tree: "*TreeNode",
};

const RUST_TYPES: Record<JudgeType, string> = {
  int: "i32",
  double: "f64",
  boolean: "bool",
  string: "String",
  char: "char",
  "int[]": "Vec<i32>",
  "string[]": "Vec<String>",
  "char[]": "Vec<char>",
  "int[][]": "Vec<Vec<i32>>",
  "char[][]": "Vec<Vec<char>>",
  "List<int>": "Vec<i32>",
  "List<List<int>>": "Vec<Vec<i32>>",
  tree: "Option<Rc<RefCell<TreeNode>>>",
};

/** The C element type behind a pointer, for the array-plus-length convention. */
const C_ELEMENT: Partial<Record<JudgeType, string>> = {
  "int[]": "int",
  "List<int>": "int",
  "string[]": "char*",
  "char[]": "char",
  "int[][]": "int*",
  "List<List<int>>": "int*",
  "char[][]": "char*",
};

const C_SCALAR: Partial<Record<JudgeType, string>> = {
  int: "int",
  double: "double",
  boolean: "bool",
  string: "char*",
  char: "char",
};

function isSeq(type: JudgeType): boolean {
  return type.endsWith("[]") || type.startsWith("List<");
}

function isMatrix(type: JudgeType): boolean {
  return type === "int[][]" || type === "char[][]" || type === "List<List<int>>";
}

function cppStub(judge: Judge): string {
  // `const&` is idiomatic and free here, but the stub takes plain references so
  // that a solution which sorts its input in place — which several of these
  // problems want — compiles without the reader first having to fight the type.
  const params = judge.params
    .map((p) => `${CPP_TYPES[p.type]}${isSeq(p.type) ? "&" : ""} ${p.name}`)
    .join(", ");
  return `#include <bits/stdc++.h>
using namespace std;

${CPP_TYPES[judge.returns]} ${judge.entry}(${params}) {
    // Your solution here.
}
`;
}

function goStub(judge: Judge): string {
  const params = judge.params.map((p) => `${p.name} ${GO_TYPES[p.type]}`).join(", ");
  return `package main

func ${judge.entry}(${params}) ${GO_TYPES[judge.returns]} {
	// Your solution here.
}
`;
}

function rustStub(judge: Judge): string {
  const params = judge.params.map((p) => `${p.name}: ${RUST_TYPES[p.type]}`).join(", ");
  return `fn ${pythonEntry(judge.entry)}(${params}) -> ${RUST_TYPES[judge.returns]} {
    // Your solution here.
}
`;
}

/**
 * C's signature, with the convention every C solution to these problems uses:
 * an array arrives as a pointer followed by its length, a matrix adds a
 * per-row length array, and a returned array is sized through a trailing
 * `int* returnSize`.
 *
 * It is more ceremony than the other languages need, and it is the ceremony C
 * actually has — inventing a friendlier one would teach a calling convention
 * that exists nowhere else.
 */
function cStub(judge: Judge): string {
  const params: string[] = [];
  for (const p of judge.params) {
    if (isSeq(p.type)) {
      params.push(`${C_ELEMENT[p.type] ?? "int"}* ${p.name}`);
      params.push(`int ${p.name}Size`);
      if (isMatrix(p.type)) params.push(`int* ${p.name}ColSize`);
    } else {
      params.push(`${C_SCALAR[p.type] ?? "int"} ${p.name}`);
    }
  }

  const returnsArray = isSeq(judge.returns);
  if (returnsArray) params.push("int* returnSize");

  const returnType = returnsArray
    ? `${C_ELEMENT[judge.returns] ?? "int"}*`
    : (C_SCALAR[judge.returns] ?? "int");

  const note = returnsArray
    ? `\n * Write the length of your answer to *returnSize before returning it.`
    : "";

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * Arrays arrive as a pointer and a length.${note}
 */
${returnType} ${judge.entry}(${params.join(", ")}) {
    // Your solution here.
}
`;
}

/** The code the editor opens with: the signature, and nothing you have to guess at. */
export function buildStub(judge: Judge, language: PracticeLanguage): string {
  switch (language) {
    case "python":
      return pythonStub(judge);
    case "javascript":
      return javascriptStub(judge);
    case "typescript":
      return typescriptStub(judge);
    case "java":
      return javaStub(judge);
    case "cpp":
      return cppStub(judge);
    case "c":
      return cStub(judge);
    case "go":
      return goStub(judge);
    case "rust":
      return rustStub(judge);
  }
}
