"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
// Side-effect import: repoints the editor at the locally hosted Monaco.
import "@/lib/monacoLoader";
import { LANGUAGE_PROFILES } from "@/lib/judge/languages";
import type { PracticeLanguage } from "@/lib/judge/types";

/**
 * The editor half of the solve console.
 *
 * Separate from the playground's editor rather than shared with it: that one
 * carries a JSX model-path dance and a React type shim for a scratchpad that
 * renders components, none of which means anything here, and it does not know
 * about Python. What the two have in common is Monaco's options, which are
 * small enough to state twice.
 */
export function SolveEditor({
  language,
  value,
  onChange,
}: {
  language: PracticeLanguage;
  value: string;
  onChange: (value: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const profile = LANGUAGE_PROFILES[language];

  return (
    <Editor
      height="100%"
      language={profile.monaco}
      // A path per language keeps a separate model — and so a separate undo
      // history — for each, which is what makes switching the dropdown and
      // switching back feel like returning rather than starting over.
      path={`solution/${profile.filename}`}
      value={value}
      onChange={(next) => onChange(next ?? "")}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: profile.tabSize,
        insertSpaces: true,
        padding: { top: 12 },
        lineNumbersMinChars: 3,
        folding: false,
        wordWrap: "on",
      }}
    />
  );
}
