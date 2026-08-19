/**
 * A very small React-compatible runtime, injected into the sandbox worker so
 * that JSX has something to compile against.
 *
 * `createElement` and `Fragment` behave exactly as React's do — JSX compiled
 * with the classic runtime calls them and gets back the same plain element
 * objects. `renderToString` is the playground's own six-line renderer, not
 * react-dom: there is no reconciler, no state and no effects, which is why the
 * hooks are defined only to fail with an explanation rather than a TypeError.
 */
const REACT_RUNTIME = `
var __ELEMENT = Symbol.for("react.element");
var __FRAGMENT = Symbol.for("react.fragment");
var __hasOwn = function (object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
};

function __isElement(value) {
  return Boolean(value) && typeof value === "object" && value.$$typeof === __ELEMENT;
}

function __createElement(type, config) {
  var props = {};
  var key = null;
  if (config) {
    for (var name in config) {
      if (!__hasOwn(config, name)) continue;
      if (name === "key") { key = String(config[name]); continue; }
      if (name === "ref") continue;
      props[name] = config[name];
    }
  }
  var childCount = arguments.length - 2;
  if (childCount === 1) {
    props.children = arguments[2];
  } else if (childCount > 1) {
    var children = new Array(childCount);
    for (var i = 0; i < childCount; i++) children[i] = arguments[i + 2];
    props.children = children;
  }
  return { $$typeof: __ELEMENT, type: type, key: key, ref: null, props: props };
}

var __VOID_ELEMENTS = {
  area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1,
  link: 1, meta: 1, source: 1, track: 1, wbr: 1
};
var __ATTRIBUTE_NAMES = { className: "class", htmlFor: "for" };
var __UNITLESS = {
  opacity: 1, zIndex: 1, fontWeight: 1, lineHeight: 1, flex: 1,
  flexGrow: 1, flexShrink: 1, order: 1, zoom: 1
};

function __escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function __escapeAttribute(value) {
  return __escapeText(value).replace(/"/g, "&quot;");
}

function __styleToCss(style) {
  var parts = [];
  for (var key in style) {
    if (!__hasOwn(style, key)) continue;
    var value = style[key];
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "number" && value !== 0 && !__UNITLESS[key]) value = value + "px";
    parts.push(key.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }) + ": " + value);
  }
  return parts.join("; ");
}

function __attributesToHtml(props) {
  var out = "";
  for (var key in props) {
    if (!__hasOwn(props, key)) continue;
    if (key === "children" || key === "key" || key === "ref") continue;
    var value = props[key];
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "function") continue;
    if (key === "style" && typeof value === "object") {
      out += " style=\\"" + __escapeAttribute(__styleToCss(value)) + "\\"";
      continue;
    }
    var name = __ATTRIBUTE_NAMES[key] || key;
    out += " " + name + "=\\"" + (value === true ? "" : __escapeAttribute(value)) + "\\"";
  }
  return out;
}

function renderToString(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return __escapeText(node);
  if (Array.isArray(node)) {
    return node.map(function (child) { return renderToString(child); }).join("");
  }
  if (!__isElement(node)) return __escapeText(String(node));
  if (typeof node.type === "function") return renderToString(node.type(node.props));
  if (node.type === __FRAGMENT) return renderToString(node.props.children);
  var tag = String(node.type);
  var open = "<" + tag + __attributesToHtml(node.props);
  if (__VOID_ELEMENTS[tag]) return open + " />";
  return open + ">" + renderToString(node.props.children) + "</" + tag + ">";
}

var __HOOK_HELP =
  " is not available here: the playground renders JSX to a string with no " +
  "reconciler, so there is nowhere for state or effects to live. Call your " +
  "component as a function, or use renderToString(element).";

var React = {
  createElement: __createElement,
  Fragment: __FRAGMENT,
  isValidElement: __isElement,
  version: "playground-shim"
};

[
  "useState", "useEffect", "useLayoutEffect", "useRef", "useMemo",
  "useCallback", "useContext", "useReducer", "useId", "useTransition"
].forEach(function (hook) {
  React[hook] = function () { throw new Error(hook + "()" + __HOOK_HELP); };
  self[hook] = React[hook];
});

// There is no module loader in a worker, but \`import ... from "react"\` is how
// every real TSX file starts, so resolve that one specifier and fail the rest
// with something more useful than "require is not defined".
var __REACT_MODULE = Object.assign({ __esModule: true, default: React }, React);

// Any file containing an import or export is a module as far as TypeScript is
// concerned, and its emit references \`exports\` even when every import was
// type-only and erased. Give that somewhere to land.
var exports = {};
var module = { exports: exports };

function require(specifier) {
  if (specifier === "react" || specifier.indexOf("react/jsx") === 0) return __REACT_MODULE;
  throw new Error(
    'Cannot load "' + specifier + '": the playground runs a single file with no ' +
    "module loader, so imports and require() cannot resolve. Paste the code you " +
    "need into this file instead."
  );
}

// Console formatting: an element is data, so show its shape rather than the
// {"props":{}} that JSON.stringify would produce once it drops the functions.
function __shortValue(value) {
  if (typeof value === "function") return value.name ? "function " + value.name : "function";
  try {
    var json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch (e) {
    return String(value);
  }
}

function __describeProps(props) {
  var out = "";
  for (var key in props) {
    if (!__hasOwn(props, key) || key === "children") continue;
    var value = props[key];
    out += " " + key + (typeof value === "string"
      ? "=\\"" + value + "\\""
      : "={" + __shortValue(value) + "}");
  }
  return out;
}

function __describeNode(node, indent) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (Array.isArray(node)) {
    var lines = [];
    for (var i = 0; i < node.length; i++) {
      var line = __describeNode(node[i], indent);
      if (line !== "") lines.push(line);
    }
    return lines.join("\\n");
  }
  if (!__isElement(node)) {
    return indent + (typeof node === "object" ? __shortValue(node) : JSON.stringify(String(node)));
  }
  var children = node.props ? node.props.children : undefined;
  var inner = __describeNode(children, indent + "  ");
  if (node.type === __FRAGMENT) {
    return inner === "" ? indent + "<></>" : indent + "<>\\n" + inner + "\\n" + indent + "</>";
  }
  var name = typeof node.type === "function"
    ? (node.type.name || "Component")
    : String(node.type);
  var open = "<" + name + (node.key === null ? "" : " key=\\"" + node.key + "\\"") + __describeProps(node.props);
  if (inner === "") return indent + open + " />";
  return indent + open + ">\\n" + inner + "\\n" + indent + "</" + name + ">";
}
`;

/**
 * The sandbox runs user code inside a Web Worker (not an iframe) specifically
 * so that a synchronous infinite loop cannot freeze the main UI thread — the
 * worker runs on its own thread and can always be force-terminated.
 */
function buildWorkerScript(): string {
  return (
    REACT_RUNTIME +
    `
self.onmessage = function (event) {
  function serialize(value) {
    if (value instanceof Error) {
      return value.stack || (value.name + ": " + value.message);
    }
    if (__isElement(value)) {
      return __describeNode(value, "");
    }
    if (typeof value === "function") {
      return value.toString();
    }
    if (typeof value === "undefined") {
      return "undefined";
    }
    if (typeof value === "bigint") {
      return value.toString() + "n";
    }
    if (typeof value === "symbol") {
      return value.toString();
    }
    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  }

  function post(type, payload) {
    self.postMessage(Object.assign({ type: type }, payload));
  }

  ["log", "warn", "error", "info"].forEach(function (level) {
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments).map(serialize);
      post("console", { level: level, args: args });
    };
  });

  self.addEventListener("error", function (errorEvent) {
    post("console", { level: "error", args: [errorEvent.message] });
  });

  self.addEventListener("unhandledrejection", function (rejectionEvent) {
    post("console", { level: "error", args: ["Unhandled promise rejection: " + serialize(rejectionEvent.reason)] });
  });

  try {
    (new Function(event.data.code))();
  } catch (err) {
    post("console", { level: "error", args: [serialize(err)] });
  }

  post("done", {});
};
`
  );
}

export function createSandboxWorker(): Worker {
  const blob = new Blob([buildWorkerScript()], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  worker.addEventListener(
    "message",
    () => {
      /* keep url alive until first message, then release it */
      URL.revokeObjectURL(url);
    },
    { once: true }
  );
  return worker;
}
