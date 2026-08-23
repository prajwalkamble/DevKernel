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
export function ExampleLanguagePicker({
  primary,
  blocks,
  outputs,
}: {
  /** The language the surrounding prose is written against. */
  primary: ExampleLanguage;
  /** Rendered code blocks, keyed by language. */
  blocks: Partial<Record<ExampleLanguage, ReactNode>>;
  /** Rendered output panels, keyed by language. */
  outputs?: Partial<Record<ExampleLanguage, ReactNode>>;
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
  const active = language && available.includes(language) ? language : primary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
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
      {blocks[active]}
      {outputs?.[active]}
    </div>
  );
}
