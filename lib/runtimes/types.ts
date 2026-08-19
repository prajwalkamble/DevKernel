/**
 * The contract every in-browser language runtime implements.
 *
 * These runtimes are interpreters and emulators written for this site, not the
 * real toolchains — a browser tab cannot host rustc, g++ or a JVM. They cover
 * the subset each track teaches and are required to *fail loudly* on anything
 * outside it: a clear "not supported" error is useful, a silently wrong answer
 * on a learning site is not.
 */

export type RuntimeLevel = "log" | "info" | "warn" | "error";

export interface RuntimeLine {
  level: RuntimeLevel;
  text: string;
}

export interface RuntimeResult {
  lines: RuntimeLine[];
  /** Process exit status, where the language has one. */
  exitCode: number | null;
}

/** Thrown for anything the runtime deliberately does not implement. */
export class UnsupportedError extends Error {
  constructor(what: string, line?: number) {
    super(line ? `line ${line}: ${what} is not supported by the browser runtime` : `${what} is not supported by the browser runtime`);
    this.name = "UnsupportedError";
  }
}

/** Thrown for a genuine error in the user's program. */
export class ProgramError extends Error {
  constructor(message: string, line?: number) {
    super(line ? `line ${line}: ${message}` : message);
    this.name = "ProgramError";
  }
}

/**
 * Collects program output, and enforces the two limits that keep a runaway
 * program from taking the page down: a cap on how much it may print, and a
 * budget of interpreter steps. Neither can be defeated by the program.
 */
export class OutputSink {
  readonly lines: RuntimeLine[] = [];
  private pending = "";
  private printed = 0;
  private steps = 0;

  constructor(
    private readonly maxChars = 200_000,
    private readonly maxSteps = 20_000_000
  ) {}

  /** Counts one unit of work. Throws once the budget is spent. */
  step(cost = 1) {
    this.steps += cost;
    if (this.steps > this.maxSteps) {
      throw new ProgramError(
        "execution stopped: step limit reached (this usually means an infinite loop)"
      );
    }
  }

  /** Writes raw text, splitting into lines the way a terminal would. */
  write(text: string) {
    this.printed += text.length;
    if (this.printed > this.maxChars) {
      throw new ProgramError("execution stopped: too much output");
    }
    this.pending += text;
    let index = this.pending.indexOf("\n");
    while (index !== -1) {
      this.lines.push({ level: "log", text: this.pending.slice(0, index) });
      this.pending = this.pending.slice(index + 1);
      index = this.pending.indexOf("\n");
    }
  }

  note(level: RuntimeLevel, text: string) {
    this.flush();
    this.lines.push({ level, text });
  }

  /** Emits any text not yet terminated by a newline. */
  flush() {
    if (this.pending.length > 0) {
      this.lines.push({ level: "log", text: this.pending });
      this.pending = "";
    }
  }
}
