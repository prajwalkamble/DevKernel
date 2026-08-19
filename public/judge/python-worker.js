/**
 * Runs a Python solution against a problem's test cases, off the main thread.
 *
 * This is real CPython — the Pyodide build of it, compiled to WebAssembly —
 * with the whole standard library, so `collections.Counter`, `heapq`, `bisect`
 * and `functools.lru_cache` all behave exactly as they do in an interview.
 *
 * Booting it costs a few seconds and a download, so the worker is created once
 * per page and kept: the first Run pays for it, every later Run does not.
 */
import { loadPyodide } from "/pyodide/pyodide.mjs";

/** Split from runtime.py: everything before this marker runs before your code. */
const DRIVER_MARKER = "# --- DRIVER ---";

let ready = null;

function post(message) {
  self.postMessage(message);
}

async function boot() {
  const [pyodide, runtime] = await Promise.all([
    loadPyodide({
      indexURL: "/pyodide/",
      stdout: (text) => post({ type: "stdout", text }),
      stderr: (text) => post({ type: "stdout", text }),
    }),
    fetch("/judge/runtime.py").then((response) => {
      if (!response.ok) throw new Error(`runtime.py: ${response.status}`);
      return response.text();
    }),
  ]);

  const marker = runtime.indexOf(DRIVER_MARKER);
  if (marker === -1) throw new Error("runtime.py is missing its driver marker");

  return {
    pyodide,
    preamble: runtime.slice(0, marker),
    driver: runtime.slice(marker + DRIVER_MARKER.length),
  };
}

self.onmessage = async (event) => {
  const { code, spec } = event.data;

  let runtime;
  try {
    ready = ready ?? boot();
    runtime = await ready;
  } catch (error) {
    // A failed boot must not be cached: the next Run should try again rather
    // than report a stale network error forever.
    ready = null;
    post({ type: "failed", status: "runtime-error", message: `Python failed to load: ${error}` });
    return;
  }

  // Boot is over: the page can stop showing "starting Python" and start the
  // much shorter watchdog that catches an infinite loop.
  post({ type: "ready" });

  const { pyodide, preamble, driver } = runtime;

  // A fresh namespace per run, so a function you renamed does not linger from
  // the previous attempt and pass a case your current code cannot.
  const namespace = pyodide.runPython("dict()");

  try {
    pyodide.runPython(preamble, { globals: namespace });

    try {
      pyodide.runPython(code, { globals: namespace });
    } catch (error) {
      post({ type: "failed", status: "compile-error", message: String(error) });
      return;
    }

    namespace.set("_dk_config", JSON.stringify(spec));
    namespace.set("_dk_emit", (json) => post({ type: "case", case: JSON.parse(json) }));
    const outcome = JSON.parse(pyodide.runPython(driver, { globals: namespace }));

    if (outcome.status === "no-entry") {
      post({
        type: "failed",
        status: "no-entry",
        message:
          `No function named "${spec.entry}" was found. Define it at the top level — ` +
          `as \`def ${spec.entry}(...)\`, as its snake_case spelling, or as a method ` +
          "on a class named Solution. Any of those is found; one nested inside " +
          "another function is not.",
      });
      return;
    }

    post({ type: "cases", cases: outcome.cases });
  } catch (error) {
    post({ type: "failed", status: "runtime-error", message: String(error) });
  } finally {
    namespace.destroy();
  }
};
