/**
 * Runs a JavaScript solution against a problem's test cases, off the main thread.
 *
 * A worker rather than an iframe for the same reason the playground uses one: a
 * `while (true)` in a half-finished loop is the single most common thing to
 * write while practising, and on this thread the page can always terminate it.
 */
importScripts("/judge/js-harness.js");

self.onmessage = function (event) {
  var request = event.data;
  var spec = request.spec;

  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    console[level] = function () {
      var parts = Array.prototype.map.call(arguments, function (value) {
        if (typeof value === "string") return value;
        try {
          return JSON.stringify(value);
        } catch {
          // Circular, or a BigInt: the shape is what matters, not the detail.
          return String(value);
        }
      });
      self.postMessage({ type: "stdout", text: parts.join(" ") });
    };
  });

  var fn;
  try {
    // The trailing expression hands back the entry point by name. `typeof`
    // short-circuits when the name was never declared, so a misspelling reports
    // as a missing function rather than as a ReferenceError from nowhere.
    // `Solution` comes back too: pasting the class from the solutions below the
    // console is a reasonable thing to do, and it should just work.
    var factory = new Function(
      self.__dkHarness.PREAMBLE +
        request.code +
        "\n;return {" +
        "  fn: typeof " + spec.entry + " === 'function' ? " + spec.entry + " : null," +
        "  Solution: typeof Solution === 'function' ? Solution : null" +
        "};"
    );
    var found = factory();
    fn = found.fn;
    if (typeof fn !== "function" && found.Solution) {
      var instance = new found.Solution();
      if (typeof instance[spec.entry] === "function") {
        fn = instance[spec.entry].bind(instance);
      }
    }
  } catch (error) {
    self.postMessage({
      type: "failed",
      status: "compile-error",
      message: error instanceof Error ? error.name + ": " + error.message : String(error),
    });
    return;
  }

  if (typeof fn !== "function") {
    self.postMessage({
      type: "failed",
      status: "no-entry",
      message:
        'No function named "' +
        spec.entry +
        '" was found. Declare it at the top level — either as a plain function, or as a ' +
        "method on a class named Solution. One nested inside another function is not found.",
    });
    return;
  }

  var cases = self.__dkHarness.runCases(fn, spec, function (result) {
    self.postMessage({ type: "case", case: result });
  });
  self.postMessage({ type: "cases", cases: cases });
};
