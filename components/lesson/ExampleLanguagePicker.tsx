"use client";

import { useId, type ReactNode } from "react";
import {
  EXAMPLE_LANGUAGES, EXAMPLE_LANGUAGE_LABEL, type ExampleLanguage,
} from "@/lib/exampleLanguage";
import { track } from "@/lib/analytics";
import { useExampleLanguage } from "@/lib/useExampleLanguage";

/**
 * Chooses between code blocks that were already rendered on the server.
 *
 * Every variant is highlighted by Shiki during the build and passed in here as
 * finished markup, so switching language is a re-parent and costs no network
 * and no highlighter in the browser. That is the same arrangement the practice
 * pages use for their Java/Python panes.
 *
 * The dropdown lists only the languages this example actually carries. The
 * chosen one is stored globally, so picking Rust here makes every other
 * example on the page that has Rust follow — and the ones that do not stay on
 * their own primary language rather than showing nothing.
 */
/**
 * Languages that are the same choice wearing two hats.
 *
 * A React lesson labels a component `jsx` and a plain module `javascript`, and
 * their typed counterparts `tsx` and `typescript`. To a reader those are one
 * decision — "show me this project in JavaScript" — so choosing either member
 * has to satisfy the other, or picking TSX on a component would leave every
 * non-component file in the same project showing JavaScript.
 */
const SAME_CHOICE: Partial<Record<ExampleLanguage, ExampleLanguage>> = {
  jsx: "javascript",
  javascript: "jsx",
  tsx: "typescript",
  typescript: "tsx",
};

export function ExampleLanguagePicker({
  primary,
  blocks,
  outputs,
  titles,
}: {
  /** The language the surrounding prose is written against. */
  primary: ExampleLanguage;
  /** Rendered code blocks, keyed by language. */
  blocks: Partial<Record<ExampleLanguage, ReactNode>>;
  /** Rendered output panels, keyed by language. */
  outputs?: Partial<Record<ExampleLanguage, ReactNode>>;
  /** Headings, keyed by language: most of them name a file. */
  titles?: Partial<Record<ExampleLanguage, string>>;
}) {
  const { language, setLanguage } = useExampleLanguage();
  const selectId = useId();

  // Filtered from EXAMPLE_LANGUAGES, not read off `blocks`: the keys of an
  // object come back in insertion order, which here is the order the
  // translations happen to sit in the content file.
  const available = EXAMPLE_LANGUAGES.filter((l) => blocks[l]);
  // Fall back to the primary when the global choice is a language this example
  // does not have. A reader who picked Rust should not be shown a blank panel
  // by an example that only exists in Python.
  const sibling = language ? SAME_CHOICE[language] : undefined;
  const active =
    language && available.includes(language) ? language
    : sibling && available.includes(sibling) ? sibling
    : primary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {titles?.[active] ? (
          <h4 className="min-w-0 text-sm font-medium break-words text-foreground">
            {titles[active]}
          </h4>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-2">
        <label htmlFor={selectId} className="text-xs font-medium text-muted">
          Language
        </label>
        <select
          id={selectId}
          value={active}
          onChange={(e) => {
            const next = e.target.value as ExampleLanguage;
            setLanguage(next);
            track("example language changed", { from: active, to: next });
          }}
          className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus:ring-2 focus:ring-accent focus:outline-none"
        >
          {available.map((option) => (
            <option key={option} value={option}>
              {EXAMPLE_LANGUAGE_LABEL[option]}
            </option>
          ))}
        </select>
        </div>
      </div>
      {blocks[active]}
      {outputs?.[active]}
    </div>
  );
}
