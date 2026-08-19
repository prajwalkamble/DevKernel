import clsx from "clsx";
import type { ConsoleEntry } from "@/lib/useSandbox";

const LEVEL_STYLES: Record<ConsoleEntry["level"], string> = {
  log: "text-[var(--console-fg)]",
  info: "text-[var(--console-info)]",
  warn: "text-[var(--console-warn)]",
  error: "text-[var(--console-error)]",
};

const LEVEL_PREFIX: Record<ConsoleEntry["level"], string> = {
  log: ">",
  info: "i",
  warn: "!",
  error: "✕",
};

/**
 * Joins the arguments of one console call. Values that already span several
 * lines — pretty-printed objects, element trees, stack traces — get a line of
 * their own instead of being run together with a space, while short values
 * stay side by side the way a real console prints them.
 */
function formatArgs(args: string[]): string {
  return args.reduce((out, arg, index) => {
    if (index === 0) return arg;
    const previous = args[index - 1];
    const separator = previous.includes("\n") || arg.includes("\n") ? "\n" : " ";
    return out + separator + arg;
  }, "");
}

export function ConsolePanel({
  entries,
  running,
}: {
  entries: ConsoleEntry[];
  running: boolean;
}) {
  return (
    <div className="scrollbar-thin h-full overflow-y-auto bg-console p-3 font-mono text-[13px]">
      {entries.length === 0 && !running && (
        <p className="text-[var(--console-dim)]">
          Console output will appear here. Click Run to execute your code.
        </p>
      )}
      {running && entries.length === 0 && <p className="text-[var(--console-dim)]">Running…</p>}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={clsx(
            "flex gap-2 border-b border-[var(--console-rule)] py-1.5 first:pt-0",
            LEVEL_STYLES[entry.level]
          )}
        >
          <span className="select-none opacity-50">{LEVEL_PREFIX[entry.level]}</span>
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
            {formatArgs(entry.args)}
          </span>
        </div>
      ))}
    </div>
  );
}
