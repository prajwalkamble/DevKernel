/**
 * The JavaScript side of the practice judge — the exact counterpart of
 * runtime.py, and held to the same rule: it reports what your function returned
 * or what it threw, and never decides whether that was right.
 *
 * It is a plain script rather than a module so the worker can pull it in with
 * importScripts, and so a Node test can evaluate this same file and call the
 * helpers directly. The code that grades you is the code that was tested.
 */
(function (scope) {
  "use strict";

  /**
   * Prepended to your code, not to this file: `TreeNode` has to exist in the
   * scope your solution is compiled into, or `new TreeNode(1)` is a ReferenceError.
   */
  var PREAMBLE = [
    "function TreeNode(val, left, right) {",
    "  this.val = val === undefined ? 0 : val;",
    "  this.left = left === undefined ? null : left;",
    "  this.right = right === undefined ? null : right;",
    "}",
    "",
  ].join("\n");

  /** Rebuilds a tree from a level-order array where null is a missing child. */
  function buildTree(level) {
    if (!level || level.length === 0 || level[0] === null) return null;
    var root = new TreeNode(level[0]);
    var queue = [root];
    var head = 0;
    var index = 1;
    while (head < queue.length && index < level.length) {
      var node = queue[head++];
      if (index < level.length) {
        var leftValue = level[index++];
        if (leftValue !== null) {
          node.left = new TreeNode(leftValue);
          queue.push(node.left);
        }
      }
      if (index < level.length) {
        var rightValue = level[index++];
        if (rightValue !== null) {
          node.right = new TreeNode(rightValue);
          queue.push(node.right);
        }
      }
    }
    return root;
  }

  function TreeNode(val, left, right) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }

  /** The inverse: level-order array, trailing nulls trimmed. */
  function encodeTree(node) {
    if (!node) return [];
    var out = [];
    var queue = [node];
    var head = 0;
    while (head < queue.length) {
      var current = queue[head++];
      if (!current) {
        out.push(null);
        continue;
      }
      out.push(current.val);
      queue.push(current.left || null);
      queue.push(current.right || null);
    }
    while (out.length > 0 && out[out.length - 1] === null) out.pop();
    return out;
  }

  /**
   * Narrows a returned value to the shapes the comparison understands. A Map or
   * a Set reaching this point is a real mistake worth naming — silently
   * stringifying it would fail the case with an unreadable diff instead.
   */
  function encode(value) {
    if (
      value === null ||
      value === undefined ||
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      return value;
    }
    if (Array.isArray(value)) return value.map(encode);
    if (ArrayBuffer.isView(value) && typeof value.length === "number") {
      return Array.prototype.slice.call(value).map(encode);
    }
    var name = value && value.constructor ? value.constructor.name : typeof value;
    throw new TypeError(
      "the judge compares numbers, strings, booleans and arrays of those, but " +
        "your function returned a " + name
    );
  }

  function describeError(error) {
    if (error instanceof Error) {
      return error.stack ? String(error.stack).split("\n")[0] : error.name + ": " + error.message;
    }
    return "Threw a non-Error value: " + String(error);
  }

  /**
   * Calls `fn` once per case. Each case is caught on its own so one bad input
   * reports as one failure rather than ending the run.
   */
  function runCases(fn, spec, onCase) {
    var results = [];
    for (var i = 0; i < spec.cases.length; i++) {
      var args = spec.cases[i];
      var result;
      try {
        var call = [];
        for (var j = 0; j < args.length; j++) {
          call.push(spec.params[j] === "tree" ? buildTree(args[j]) : args[j]);
        }
        var value = fn.apply(null, call);
        result = {
          index: i,
          value: spec.returns === "tree" ? encodeTree(value) : encode(value),
        };
      } catch (error) {
        result = { index: i, error: describeError(error) };
      }
      results.push(result);
      // Reported as it happens, so a case that never returns still leaves the
      // ones before it on screen instead of a bare "timed out".
      if (onCase) onCase(result);
    }
    return results;
  }

  scope.__dkHarness = {
    PREAMBLE: PREAMBLE,
    TreeNode: TreeNode,
    buildTree: buildTree,
    encodeTree: encodeTree,
    encode: encode,
    runCases: runCases,
  };
})(typeof self !== "undefined" ? self : globalThis);
