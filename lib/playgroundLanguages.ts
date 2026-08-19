import type { CodeLanguage } from "@/content/types";
import type { PlaygroundLanguage } from "./playgroundHandoff";

/**
 * Every language the playground runs, and how it runs it.
 *
 * JavaScript and TypeScript execute as real JavaScript in a Web Worker. The
 * other four are executed by the interpreters and emulator in lib/runtimes,
 * which run in the page itself. Those cover the subset these tracks teach and
 * stop with a clear message rather than guess when a program goes outside it —
 * see `runtimeNote`, which is shown next to the language picker.
 */
export interface LanguageProfile {
  id: PlaygroundLanguage;
  label: string;
  /** Monaco's language id. */
  monaco: string;
  /** Shiki's language id, for the read-only blocks in lessons. */
  shiki: CodeLanguage;
  /** Conventional filename, used for the editor model path. */
  filename: string;
  starter: string;
  /** Short label for what executes this language, shown in the toolbar. */
  runtime: string;
  /** The longer version, shown as a tooltip. */
  runtimeNote: string;
}

const SUBSET_NOTE =
  "Runs in your browser on an interpreter written for this site. It covers the subset these lessons teach and stops with a clear message rather than guess when it meets anything else.";

const JS_STARTER = `// Welcome to the JavaScript playground!
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((n) => n * 2);
console.log(doubled);
`;

const TS_STARTER = `// Welcome to the TypeScript playground!
// Types are checked and stripped in your browser before running.
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));

interface User {
  name: string;
  age: number;
}

const user: User = { name: "Ada", age: 36 };
console.log(user);
`;

const RUST_STARTER = `// Rust: bindings are immutable until you say otherwise.
fn main() {
    let name = "world";      // immutable: \`name\` can never be reassigned
    let mut count = 0;       // \`mut\` opts in to reassignment

    for _ in 0..3 {
        count += 1;
    }

    println!("Hello, {name}! Counted to {count}.");

    // Integer overflow panics here, exactly as it does in a debug build.
    let scores = vec![88, 42, 97, 65, 73];
    let passing: Vec<i32> = scores.iter().copied().filter(|s| *s >= 60).collect();
    println!("{} passed: {passing:?}", passing.len());
}
`;

const ASM_STARTER = `; x86-64 Linux, Intel syntax, NASM.
; There is no runtime here: you ask the kernel to do the work directly.

section .data
    msg:    db  "Hello from assembly!", 10   ; 10 is the newline byte
    msglen: equ $ - msg                      ; $ means "here", so this is the length

section .text
    global _start

_start:
    mov rax, 1              ; syscall 1 = write
    mov rdi, 1              ; fd 1 = stdout
    mov rsi, msg            ; buffer address
    mov rdx, msglen         ; how many bytes
    syscall

    mov rax, 60             ; syscall 60 = exit
    xor edi, edi            ; status 0
    syscall
`;

const CPP_STARTER = `#include <iostream>
#include <string>
#include <vector>

int main() {
    const std::string name = "world";
    std::vector<int> numbers{1, 2, 3, 4, 5};

    int sum = 0;
    for (int n : numbers) sum += n;

    std::cout << "Hello, " << name << "! Sum = " << sum << '\\n';
}
`;

const JAVA_STARTER = `import java.util.List;

public class Main {
    public static void main(String[] args) {
        var name = "world";
        var numbers = List.of(1, 2, 3, 4, 5);

        int sum = 0;
        for (int n : numbers) sum += n;

        System.out.println("Hello, " + name + "! Sum = " + sum);
    }
}
`;

const PYTHON_STARTER = `# Welcome to the Python playground!
# This is real CPython, compiled to WebAssembly — the whole standard library
# is here, so collections, heapq, bisect and itertools all work.
from collections import Counter


def greet(name: str) -> str:
    return f"Hello, {name}!"


print(greet("world"))

numbers = [1, 2, 3, 4, 5]
print([n * 2 for n in numbers])
print(Counter("mississippi").most_common(2))
`;

const C_STARTER = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* C hands you the machine and very little else: no bounds checks, no strings,
   and memory you have to release yourself. */
int compare(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}

int main(void) {
    int scores[] = {88, 42, 97, 65, 73};
    int n = sizeof(scores) / sizeof(scores[0]);

    qsort(scores, n, sizeof(int), compare);

    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", scores[i]);
    printf("\\n");

    char name[32];
    strcpy(name, "world");
    printf("Hello, %s! %d scores, top is %d.\\n", name, n, scores[n - 1]);
    return 0;
}
`;

const GO_STARTER = `package main

import (
	"fmt"
	"sort"
	"strings"
)

func main() {
	name := "world"
	scores := []int{88, 42, 97, 65, 73}

	sort.Ints(scores)

	sum := 0
	for _, s := range scores {
		sum += s
	}

	fmt.Printf("Hello, %s! Sum = %d, median = %d\\n", name, sum, scores[len(scores)/2])
	fmt.Println(strings.ToUpper("go is small on purpose"))

	counts := map[string]int{}
	for _, word := range strings.Fields("the quick brown fox the fox") {
		counts[word]++
	}
	fmt.Println("the appears", counts["the"], "times")
}
`;

export const LANGUAGES: Record<PlaygroundLanguage, LanguageProfile> = {
  javascript: {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    shiki: "javascript",
    filename: "playground.js",
    starter: JS_STARTER,
    runtime: "Web Worker",
    runtimeNote: "Runs as real JavaScript in a sandboxed Web Worker.",
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    shiki: "typescript",
    filename: "playground.ts",
    starter: TS_STARTER,
    runtime: "Web Worker",
    runtimeNote: "Types are stripped in your browser, then it runs as real JavaScript in a sandboxed Web Worker.",
  },
  python: {
    id: "python",
    label: "Python",
    monaco: "python",
    shiki: "python",
    filename: "main.py",
    starter: PYTHON_STARTER,
    runtime: "CPython (WebAssembly)",
    runtimeNote:
      "Real CPython compiled to WebAssembly, with the whole standard library. The first run downloads it; every run after that is instant.",
  },
  c: {
    id: "c",
    label: "C",
    monaco: "c",
    shiki: "cpp",
    filename: "main.c",
    starter: C_STARTER,
    runtime: "browser interpreter",
    runtimeNote:
      SUBSET_NOTE +
      " Pointers are modelled as arrays, so indexing and buffers behave, and `sizeof` reports real byte sizes.",
  },
  go: {
    id: "go",
    label: "Go",
    monaco: "go",
    shiki: "cpp",
    filename: "main.go",
    starter: GO_STARTER,
    runtime: "browser interpreter",
    runtimeNote: SUBSET_NOTE,
  },
  rust: {
    id: "rust",
    label: "Rust",
    monaco: "rust",
    shiki: "rust",
    filename: "main.rs",
    starter: RUST_STARTER,
    runtime: "browser interpreter",
    runtimeNote: SUBSET_NOTE + " Integer overflow panics, matching a debug build.",
  },
  assembly: {
    id: "assembly",
    label: "Assembly (x86-64)",
    monaco: "x86asm",
    shiki: "asm",
    filename: "hello.asm",
    starter: ASM_STARTER,
    runtime: "browser x86-64 emulator",
    runtimeNote:
      "Assembled and executed in your browser by an x86-64 emulator written for this site: real registers, flags, memory, stack and the Linux write/exit syscalls.",
  },
  cpp: {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    shiki: "cpp",
    filename: "main.cpp",
    starter: CPP_STARTER,
    runtime: "browser interpreter",
    runtimeNote: SUBSET_NOTE,
  },
  java: {
    id: "java",
    label: "Java",
    monaco: "java",
    shiki: "java",
    filename: "Main.java",
    starter: JAVA_STARTER,
    runtime: "browser interpreter",
    runtimeNote: SUBSET_NOTE,
  },
};

/**
 * Dropdown order: alphabetical across the languages people come here to write,
 * with Assembly last because it is the one that is not a general-purpose
 * choice — you open it to see what the machine does, not to solve a problem.
 */
export const LANGUAGE_ORDER: PlaygroundLanguage[] = [
  "c",
  "cpp",
  "go",
  "java",
  "javascript",
  "python",
  "rust",
  "typescript",
  "assembly",
];
