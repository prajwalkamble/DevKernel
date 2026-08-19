"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSandboxWorker } from "@/lib/sandboxRunner";

export interface ConsoleEntry {
  id: number;
  level: "log" | "warn" | "error" | "info";
  args: string[];
}

/** A line printed above the program's own output, before it runs. */
export interface SandboxNotice {
  level: ConsoleEntry["level"];
  text: string;
}

const WATCHDOG_MS = 6000;

export function useSandbox() {
  const workerRef = useRef<Worker | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryIdRef = useRef(0);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [running, setRunning] = useState(false);

  const teardownWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  useEffect(() => teardownWorker, [teardownWorker]);

  const appendEntry = useCallback((level: ConsoleEntry["level"], args: string[]) => {
    setEntries((prev) => [...prev, { id: entryIdRef.current++, level, args }]);
  }, []);

  const run = useCallback(
    (code: string, options?: { notices?: SandboxNotice[] }) => {
      teardownWorker();
      entryIdRef.current = 0;
      const initialEntries: ConsoleEntry[] = (options?.notices ?? []).map((notice) => ({
        id: entryIdRef.current++,
        level: notice.level,
        args: [notice.text],
      }));
      setEntries(initialEntries);
      setRunning(true);

      const worker = createSandboxWorker();
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const data = event.data as { type: string; level?: ConsoleEntry["level"]; args?: string[] };
        if (data?.type === "console" && data.level && data.args) {
          appendEntry(data.level, data.args);
        } else if (data?.type === "done") {
          setRunning(false);
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }
        }
      };

      worker.onerror = (event) => {
        appendEntry("error", [event.message || "Unknown worker error"]);
        setRunning(false);
      };

      worker.postMessage({ code });

      watchdogRef.current = setTimeout(() => {
        appendEntry("warn", [
          "Execution timed out after 6s (possible infinite loop) — stopped automatically.",
        ]);
        teardownWorker();
        setRunning(false);
      }, WATCHDOG_MS);
    },
    [appendEntry, teardownWorker]
  );

  /**
   * Replaces the console with lines produced elsewhere. The compiled languages
   * are interpreted in this tab rather than in the worker, so their output
   * arrives already complete.
   */
  const show = useCallback((notices: SandboxNotice[]) => {
    teardownWorker();
    entryIdRef.current = 0;
    setRunning(false);
    setEntries(
      notices.map((notice) => ({
        id: entryIdRef.current++,
        level: notice.level,
        args: [notice.text],
      }))
    );
  }, [teardownWorker]);

  const stop = useCallback(() => {
    if (!workerRef.current) return;
    teardownWorker();
    setRunning(false);
    appendEntry("warn", ["Stopped by user."]);
  }, [appendEntry, teardownWorker]);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, running, run, show, stop, clear };
}
