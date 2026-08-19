import type { CodeLanguage } from "@/content/types";

/** Languages that execute as JavaScript in the Web Worker sandbox. */
export type RunnableLanguage = "javascript" | "typescript";

/**
 * Everything the playground runs. All of it executes in the browser; the split
 * is only about *which* engine does it — the JavaScript worker for JS and TS,
 * a real CPython compiled to WebAssembly for Python, and the interpreters in
 * lib/runtimes for the compiled languages.
 */
export type PlaygroundLanguage =
  | RunnableLanguage
  | "python"
  | "c"
  | "cpp"
  | "go"
  | "java"
  | "rust"
  | "assembly";

const HANDOFF_KEY = "devkernel:playground-handoff";

export function usesWorker(language: PlaygroundLanguage): language is RunnableLanguage {
  return language === "javascript" || language === "typescript";
}

/** Python runs on Pyodide, which is a worker of its own rather than the JS one. */
export function usesPython(language: PlaygroundLanguage): language is "python" {
  return language === "python";
}

/**
 * Which playground tab a lesson's code block hands off to. The `null` entries
 * are the languages with nowhere to go: `bash` blocks are commands to paste
 * into a terminal, and the config, schema and wire formats below are files and
 * payloads that belong to a project on disk. None of them is a program the
 * browser can run, so their blocks show no "open in playground" affordance.
 */
const HANDOFF_TARGET: Record<CodeLanguage, PlaygroundLanguage | null> = {
  javascript: "javascript",
  typescript: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  rust: "rust",
  go: "go",
  asm: "assembly",
  cpp: "cpp",
  java: "java",
  python: "python",
  bash: null,
  xml: null,
  yaml: null,
  properties: null,
  sql: null,
  graphql: null,
  json: null,
  http: null,
};

export function playgroundTargetFor(language: CodeLanguage): PlaygroundLanguage | null {
  return HANDOFF_TARGET[language];
}

export interface PlaygroundHandoff {
  code: string;
  language: PlaygroundLanguage;
}

export function sendCodeToPlayground(payload: PlaygroundHandoff) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
}

export function consumePlaygroundHandoff(): PlaygroundHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(HANDOFF_KEY);
  try {
    return JSON.parse(raw) as PlaygroundHandoff;
  } catch {
    return null;
  }
}
