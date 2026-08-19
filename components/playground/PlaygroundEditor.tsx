"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { useTheme } from "next-themes";
// Side-effect import: repoints the editor at the locally hosted Monaco.
import "@/lib/monacoLoader";
import type { PlaygroundLanguage } from "@/lib/playgroundHandoff";
import { LANGUAGES } from "@/lib/playgroundLanguages";

/**
 * The sandbox's runtime, described for the editor. No React types are loaded,
 * so the classic-runtime global `JSX` namespace is declared here instead — an
 * open `IntrinsicElements` index signature keeps every tag legal, which is the
 * right trade-off for a scratchpad that never renders to a real DOM.
 */
const SANDBOX_TYPES = `
declare namespace JSX {
  interface Element {
    type: unknown;
    props: Record<string, unknown>;
    key: string | null;
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes {
    key?: string | number;
  }
  interface IntrinsicElements {
    [tag: string]: Record<string, unknown> & { children?: unknown };
  }
}

declare const React: {
  createElement(type: unknown, props?: Record<string, unknown> | null, ...children: unknown[]): JSX.Element;
  Fragment: unknown;
  isValidElement(value: unknown): boolean;
};

/** Renders an element to an HTML string. The playground's own renderer, not react-dom. */
declare function renderToString(node: unknown): string;
`;

const JSX_PATHS: Partial<Record<PlaygroundLanguage, string>> = {
  typescript: "playground.tsx",
  javascript: "playground.jsx",
};

const ASM_REGISTERS = [
  "rax", "rbx", "rcx", "rdx", "rsi", "rdi", "rbp", "rsp",
  "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15",
  "eax", "ebx", "ecx", "edx", "esi", "edi", "ebp", "esp",
  "r8d", "r9d", "r10d", "r11d", "r12d", "r13d", "r14d", "r15d",
  "ax", "bx", "cx", "dx", "si", "di", "bp", "sp",
  "al", "bl", "cl", "dl", "ah", "bh", "ch", "dh", "sil", "dil", "bpl", "spl",
  "rip", "rflags", "eflags", "cs", "ds", "es", "fs", "gs", "ss",
  "xmm0", "xmm1", "xmm2", "xmm3", "xmm4", "xmm5", "xmm6", "xmm7",
  "ymm0", "ymm1", "ymm2", "ymm3",
];

const ASM_DIRECTIVES = [
  "section", "segment", "global", "extern", "bits", "default", "org",
  "db", "dw", "dd", "dq", "dt", "resb", "resw", "resd", "resq",
  "equ", "times", "incbin", "align", "byte", "word", "dword", "qword", "ptr",
];

const ASM_INSTRUCTIONS = [
  "mov", "movzx", "movsx", "movsxd", "lea", "xchg", "push", "pop", "pushfq", "popfq",
  "add", "sub", "inc", "dec", "neg", "adc", "sbb",
  "mul", "imul", "div", "idiv", "cqo", "cdq", "cwd", "cbw", "cdqe",
  "and", "or", "xor", "not", "shl", "shr", "sal", "sar", "rol", "ror", "bt", "bts",
  "cmp", "test", "jmp", "call", "ret", "leave", "enter", "syscall", "int", "nop", "hlt", "ud2",
  "je", "jne", "jz", "jnz", "jg", "jge", "jl", "jle", "ja", "jae", "jb", "jbe",
  "js", "jns", "jo", "jno", "jc", "jnc", "jecxz", "jrcxz", "loop",
  "sete", "setne", "setg", "setge", "setl", "setle", "seta", "setb", "setz", "setnz",
  "cmove", "cmovne", "cmovg", "cmovge", "cmovl", "cmovle", "cmova", "cmovb",
  "rep", "repe", "repne", "movsb", "movsq", "stosb", "stosq", "lodsb", "scasb",
  "addss", "addsd", "subss", "subsd", "mulss", "mulsd", "divss", "divsd",
  "movss", "movsd", "movaps", "movups", "movdqa", "movdqu", "addps", "mulps",
  "cvtsi2sd", "cvtsd2si", "ucomisd", "pxor", "shufps", "cpuid", "rdtsc", "endbr64",
];

/**
 * Monaco ships tokenizers for Rust, C++ and Java but not for x86 assembly, so
 * NASM gets a small Monarch grammar here. It only has to colour the subset the
 * Assembly track writes, not assemble anything.
 */
function registerX86Asm(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === "x86asm")) {
    return;
  }

  monaco.languages.register({ id: "x86asm", extensions: [".asm", ".s"], aliases: ["NASM"] });

  monaco.languages.setLanguageConfiguration("x86asm", {
    comments: { lineComment: ";" },
    brackets: [["[", "]"]],
    autoClosingPairs: [
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  monaco.languages.setMonarchTokensProvider("x86asm", {
    ignoreCase: true,
    defaultToken: "",
    registers: ASM_REGISTERS,
    directives: ASM_DIRECTIVES,
    instructions: ASM_INSTRUCTIONS,
    tokenizer: {
      root: [
        [/;.*$/, "comment"],
        // A label is an identifier that owns the start of its line.
        [/^\s*[A-Za-z_.$][\w.$]*(?=:)/, "type.identifier"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],
        [/\b0x[0-9a-f]+\b/, "number.hex"],
        [/\b\d+[hH]\b/, "number.hex"],
        [/\b[01]+b\b/, "number.binary"],
        [/\b\d+\b/, "number"],
        [
          /[A-Za-z_.$][\w.$]*/,
          {
            cases: {
              "@registers": "variable.predefined",
              "@directives": "keyword.directive",
              "@instructions": "keyword",
              "@default": "identifier",
            },
          },
        ],
        [/[[\]]/, "@brackets"],
        [/[,:+\-*]/, "delimiter"],
      ],
    },
  });
}

function configureMonaco(monaco: Monaco) {
  registerX86Asm(monaco);

  const { typescriptDefaults, javascriptDefaults, JsxEmit, ScriptTarget } =
    monaco.languages.typescript;

  for (const defaults of [typescriptDefaults, javascriptDefaults]) {
    defaults.setCompilerOptions({
      ...defaults.getCompilerOptions(),
      target: ScriptTarget.ES2020,
      // Matches lib/transpile.ts: the classic runtime, so JSX resolves against
      // the `React` global the sandbox provides rather than an import.
      jsx: JsxEmit.React,
      allowJs: true,
      allowNonTsExtensions: true,
      noEmit: true,
    });
    defaults.addExtraLib(SANDBOX_TYPES, "file:///playground-sandbox.d.ts");
  }
}

interface PlaygroundEditorProps {
  language: PlaygroundLanguage;
  /** Selects a .tsx/.jsx model so Monaco parses JSX rather than flagging it. */
  jsx: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function PlaygroundEditor({ language, jsx, value, onChange }: PlaygroundEditorProps) {
  const { resolvedTheme } = useTheme();
  const profile = LANGUAGES[language];
  const path = (jsx && JSX_PATHS[language]) || profile.filename;

  return (
    <Editor
      height="100%"
      language={profile.monaco}
      path={path}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      beforeMount={configureMonaco}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: language === "rust" || language === "cpp" || language === "java" ? 4 : 2,
        padding: { top: 12 },
        // Touch screens have no hover, and a 13px editor on a phone needs every
        // pixel of width it can get.
        lineNumbersMinChars: 3,
        folding: false,
        wordWrap: "on",
      }}
    />
  );
}
