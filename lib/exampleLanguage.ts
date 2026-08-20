/**
 * Which language a lesson's code examples are shown in.
 *
 * Deliberately the same shape as `lib/practiceProgress.ts` — a localStorage
 * key, a custom event so every panel on the page reacts to a change at once,
 * and a plain getter/setter pair — so there is one way this codebase shares a
 * client-side preference rather than two.
 *
 * The preference is global rather than per-example: choosing Rust once should
 * hold for the rest of the lesson and the next one. Examples that do not carry
 * the chosen language fall back to their own primary, which is why this is a
 * preference and not a guarantee.
 */
import type { CodeLanguage } from "@/content/types";

const KEY = "devkernel:example-language";
export const EXAMPLE_LANGUAGE_EVENT = "devkernel:example-language-change";

/** The languages a lesson example may be offered in, in dropdown order. */
export const EXAMPLE_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "rust",
  "go",
  "asm",
] as const satisfies readonly CodeLanguage[];

export type ExampleLanguage = (typeof EXAMPLE_LANGUAGES)[number];

export const EXAMPLE_LANGUAGE_LABEL: Record<ExampleLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  rust: "Rust",
  go: "Go",
  asm: "Assembly",
};

function isExampleLanguage(value: string): value is ExampleLanguage {
  return (EXAMPLE_LANGUAGES as readonly string[]).includes(value);
}

export function getExampleLanguage(): ExampleLanguage | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw && isExampleLanguage(raw) ? raw : null;
}

export function setExampleLanguage(language: ExampleLanguage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, language);
  window.dispatchEvent(new CustomEvent(EXAMPLE_LANGUAGE_EVENT));
}
