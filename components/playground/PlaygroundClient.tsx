"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Loader2, Play, RotateCcw, Square, Trash2 } from "lucide-react";
import clsx from "clsx";
import { track } from "@/lib/analytics";
import { useSandbox, type SandboxNotice } from "@/lib/useSandbox";
import { containsJsx, transpileTypeScript } from "@/lib/transpile";
import {
  consumePlaygroundHandoff,
  usesPython,
  usesWorker,
  type PlaygroundLanguage,
} from "@/lib/playgroundHandoff";
import { LANGUAGES, LANGUAGE_ORDER } from "@/lib/playgroundLanguages";
import { ConsolePanel } from "./ConsolePanel";

const JSX_NOTICE =
  "JSX compiled to React.createElement calls. The sandbox ships a minimal React " +
  "shim — log an element to see its shape, or renderToString(element) for HTML.";

const PlaygroundEditor = dynamic(
  () => import("./PlaygroundEditor").then((mod) => mod.PlaygroundEditor),
  {
    ssr: false,
    // Monaco is a large dependency, so this placeholder is on screen long
    // enough to be worth shaping like the code it is about to be replaced by.
    loading: () => (
      <div role="status" aria-busy="true" className="h-full space-y-2.5 p-4">
        <span className="sr-only">Loading editor</span>
        {["w-2/5", "w-4/5", "w-3/5", "w-1/3", "w-5/6", "w-1/2", "w-2/3", "w-2/5"].map(
          (width, i) => (
            <div key={i} className={`skeleton h-3.5 rounded-md ${width}`} aria-hidden />
          )
        )}
      </div>
    ),
  }
);

type CodeByLanguage = Record<PlaygroundLanguage, string>;

function starterCode(): CodeByLanguage {
  return Object.fromEntries(
    LANGUAGE_ORDER.map((id) => [id, LANGUAGES[id].starter])
  ) as CodeByLanguage;
}

export function PlaygroundClient() {
  const [language, setLanguage] = useState<PlaygroundLanguage>("javascript");
  const [code, setCode] = useState<CodeByLanguage>(starterCode);
  const [busy, setBusy] = useState(false);
  // Below `md` the two panes share the viewport, so only one is on screen at a
  // time and this picks which.
  const [pane, setPane] = useState<"editor" | "output">("editor");
  const [jsxMode, setJsxMode] = useState<Partial<Record<PlaygroundLanguage, boolean>>>({});
  const { entries, running, run, show, stop, clear } = useSandbox();

  useEffect(() => {
    // One-time read of a sessionStorage handoff (an external system) left by
    // a lesson's "Try it" button — sanctioned effect-sync pattern.
    const handoff = consumePlaygroundHandoff();
    if (!handoff) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(handoff.language);
    setCode((previous) => ({ ...previous, [handoff.language]: handoff.code }));
    if (containsJsx(handoff.code)) {
      setJsxMode((previous) => ({ ...previous, [handoff.language]: true }));
    }
  }, []);

  const profile = LANGUAGES[language];
  const currentCode = code[language];

  // The editor's model extension decides whether Monaco parses JSX, and swapping
  // it discards undo history — so latch it on rather than tracking every
  // keystroke, and only clear it when the document is replaced wholesale.
  const handleCodeChange = useCallback(
    (next: string) => {
      setCode((previous) => ({ ...previous, [language]: next }));
      if (!jsxMode[language] && containsJsx(next)) {
        setJsxMode((previous) => ({ ...previous, [language]: true }));
      }
    },
    [language, jsxMode]
  );

  const handleRun = useCallback(async () => {
    setPane("output");
    const source = code[language];
    track("playground run", { language });

    // Everything that is not JavaScript or TypeScript delivers its output
    // complete rather than streaming: Python from a CPython worker, and the
    // compiled languages from the interpreters in lib/runtimes. Both are
    // imported on demand so they stay out of the initial bundle.
    if (!usesWorker(language)) {
      setBusy(true);
      try {
        const result = usesPython(language)
          ? await (await import("@/lib/pythonPlayground")).runPython(source)
          : await (await import("@/lib/runtimes")).runInBrowser(language, source);
        const lines: SandboxNotice[] = result.lines.map((line) => ({
          level: line.level,
          text: line.text,
        }));
        if (lines.length === 0) {
          lines.push({ level: "info", text: "Program produced no output." });
        }
        show(lines);
      } catch (error) {
        show([{ level: "error", text: error instanceof Error ? error.message : String(error) }]);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Plain JavaScript runs as written; the compiler only gets involved for
    // TypeScript, or for JavaScript that turns out to contain JSX.
    if (language === "javascript" && !containsJsx(source)) {
      run(source);
      return;
    }
    setBusy(true);
    const { code: js, diagnostics, jsx } = await transpileTypeScript(source, language);
    setBusy(false);
    run(js, {
      notices: [
        ...(jsx ? [{ level: "info" as const, text: JSX_NOTICE }] : []),
        ...diagnostics.map((d) => ({ level: "warn" as const, text: `TypeScript: ${d}` })),
      ],
    });
  }, [language, code, run, show]);

  const handleReset = useCallback(() => {
    setCode((previous) => ({ ...previous, [language]: LANGUAGES[language].starter }));
    setJsxMode((previous) => ({ ...previous, [language]: false }));
    clear();
  }, [language, clear]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <label className="relative flex items-center">
            <span className="sr-only">Language</span>
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value as PlaygroundLanguage);
                setPane("editor");
              }}
              className="appearance-none rounded-lg border border-border bg-surface py-1.5 pr-8 pl-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover cursor-pointer"
            >
              {LANGUAGE_ORDER.map((id) => (
                <option key={id} value={id}>
                  {LANGUAGES[id].label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted" />
          </label>
          <span
            title={profile.runtimeNote}
            className="hidden truncate text-xs text-muted lg:inline"
          >
            {profile.runtime}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:px-4 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:px-4 cursor-pointer"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run
            </button>
          )}
        </div>
      </div>

      {/* One pane at a time on phones; both side by side from `md` up. */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 md:hidden">
        <PaneTab active={pane === "editor"} onClick={() => setPane("editor")}>
          Code
        </PaneTab>
        <PaneTab active={pane === "output"} onClick={() => setPane("output")}>
          Output
        </PaneTab>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <div
          className={clsx(
            "min-h-0 md:block md:border-r md:border-border",
            pane === "editor" ? "block" : "hidden"
          )}
        >
          <PlaygroundEditor
            language={language}
            jsx={Boolean(jsxMode[language])}
            value={currentCode}
            onChange={handleCodeChange}
          />
        </div>
        <div className={clsx("min-h-0 md:block", pane === "output" ? "block" : "hidden")}>
          <ConsolePanel entries={entries} running={running || busy} />
        </div>
      </div>
    </div>
  );
}

function PaneTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
        active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
