/**
 * A DOM for React examples that render on the client.
 *
 * Loaded with node's `--import`, so it runs before the example module is
 * evaluated — which matters, because `react-dom/client` wants a document and
 * because doing it with a prepended import statement would shift every line
 * number in the example by one.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

/*
 * `FormData` matters more than it looks. Node has its own global from undici,
 * and it throws `Argument 1 could not be converted` when handed a jsdom form —
 * so the form lessons need jsdom's, and it has to overwrite rather than fill a
 * gap. The same reasoning covers any other name Node happens to define.
 */
for (const name of ["window", "document", "Node", "Element", "HTMLElement", "Event",
  "MouseEvent", "KeyboardEvent", "CustomEvent", "getComputedStyle", "requestAnimationFrame",
  "cancelAnimationFrame", "DocumentFragment", "HTMLInputElement", "HTMLFormElement",
  "HTMLSelectElement", "HTMLTextAreaElement", "HTMLButtonElement", "HTMLOptionElement",
  "FormData", "SubmitEvent", "InputEvent", "FocusEvent", "File", "Blob", "DataTransfer",
  /* Observers, so a lesson can *count* what React writes to the DOM rather
     than asserting that a re-render is not a DOM write. */
  "MutationObserver", "IntersectionObserver", "ResizeObserver"]) {
  if (dom.window[name] !== undefined) {
    Object.defineProperty(globalThis, name, {
      value: dom.window[name], writable: true, configurable: true,
    });
  }
}
// Node 21+ makes navigator a getter on globalThis, so it needs defineProperty too.
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator, writable: true, configurable: true,
});

// Tells React that `act` is legitimate here, which silences its warning and
// makes updates flush synchronously when an example asks them to.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
