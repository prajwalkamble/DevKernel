/**
 * Runs a Python script for the playground, off the main thread.
 *
 * The judge's Python worker next door answers a different question — "call this
 * one function once per test case" — so it cannot serve here, where the whole
 * point is to run a file top to bottom and show whatever it prints.
 *
 * This is real CPython, the Pyodide build compiled to WebAssembly, so the
 * standard library behaves exactly as it does on a machine. Booting costs a
 * download the first time and nothing afterwards, which is why the worker is
 * created once per page and kept.
 */
import { loadPyodide } from "/pyodide/pyodide.mjs";

let ready = null;

function post(message) {
  self.postMessage(message);
}

function boot() {
  return loadPyodide({
    indexURL: "/pyodide/",
    stdout: (text) => post({ type: "stdout", text }),
    stderr: (text) => post({ type: "stderr", text }),
  });
}

self.onmessage = async (event) => {
  const { type, source, id } = event.data ?? {};
  if (type !== "run") return;

  try {
    ready = ready ?? boot();
    const pyodide = await ready;

    // Each run gets a fresh module namespace, so a name left behind by the
    // previous run cannot make a broken script look like it works.
    const namespace = pyodide.toPy({ __name__: "__main__" });
    try {
      await pyodide.runPythonAsync(source, { globals: namespace });
      post({ type: "done", id });
    } finally {
      namespace.destroy();
    }
  } catch (error) {
    // A Python traceback arrives as the error message and is the most useful
    // thing to show, so it is passed through rather than summarised.
    post({ type: "error", id, message: String(error?.message ?? error) });
  }
};
