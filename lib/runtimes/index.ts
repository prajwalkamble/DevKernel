import type { PlaygroundLanguage } from "@/lib/playgroundHandoff";
import type { RuntimeResult } from "./types";

export type { RuntimeResult, RuntimeLine } from "./types";

/** The languages this module executes: everything except JS, TS and Python. */
export type InterpretedLanguage = Exclude<
  PlaygroundLanguage,
  "javascript" | "typescript" | "python"
>;

/**
 * Runs a compiled-language program in the browser.
 *
 * JavaScript and TypeScript do not come through here — they run as real
 * JavaScript in the existing Web Worker sandbox — and neither does Python,
 * which runs on a CPython build compiled to WebAssembly. Everything else is
 * executed by the interpreters and emulator in this directory, which are
 * loaded on demand so the playground's initial bundle stays small.
 */
export async function runInBrowser(
  language: InterpretedLanguage,
  source: string
): Promise<RuntimeResult> {
  if (language === "assembly") {
    const { runAssembly } = await import("./asm");
    return runAssembly(source);
  }
  const { runRust, runCpp, runJava, runC, runGo } = await import("./dialects");
  switch (language) {
    case "rust": return runRust(source);
    case "cpp": return runCpp(source);
    case "c": return runC(source);
    case "go": return runGo(source);
    case "java": return runJava(source);
  }
}
