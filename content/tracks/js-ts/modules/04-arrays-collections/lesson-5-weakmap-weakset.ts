import type { Lesson } from "@/content/types";

export const weakMapWeakSetLesson: Lesson = {
  id: "arrays-collections-weakmap-weakset",
  slug: "weakmap-and-weakset",
  moduleSlug: "arrays-collections",
  title: "WeakMap & WeakSet",
  summary:
    "The memory-safe siblings of Map and Set — collections that don't prevent their contents from being garbage collected, solving a real memory-leak risk that ordinary Map and Set have.",
  estimatedMinutes: 20,
  objectives: [
    "Explain why a regular Map can cause a memory leak that WeakMap cannot",
    "Use WeakMap to associate private data with an object without leaking",
    "Use WeakSet to track object membership without preventing garbage collection",
    "Understand why WeakMap/WeakSet can't be iterated, and why that's intentional",
  ],
  sections: [
    {
      id: "the-gc-problem",
      heading: "The problem: regular Map and Set keep everything alive",
      body: [
        "Module 2's closures lesson mentioned that closures can leak memory by keeping variables alive as long as the closure itself is reachable. Regular `Map` and `Set` have a similar, easy-to-miss risk: they hold a **strong reference** to every key/value they contain. If you use a DOM element or some other object as a `Map` key, that object **cannot be garbage collected** — even after it's removed from the page and nothing else in your program references it — for as long as it remains a key in that `Map`. In a long-running application (a single-page app that never fully reloads), this steadily accumulates memory that's never freed.",
      ],
      examples: [
        {
          id: "map-leak-example",
          title: "A regular Map silently keeping objects alive",
          js: `const elementData = new Map(); // regular Map — holds strong references

function attachData(element, data) {
  elementData.set(element, data);
}

let button = document.createElement("button");
attachData(button, { clicks: 0 });

button = null; // we're done with our reference to the button...
// ...but elementData still holds a strong reference to the original button object,
// so it CANNOT be garbage collected, and its associated data leaks forever
console.log(elementData.size); // 1 — still there, invisibly, with no way to know it's "gone"`,
        },
      ],
    },
    {
      id: "weakmap",
      heading: "WeakMap: the same idea, but memory-safe",
      body: [
        "`WeakMap` behaves like `Map` for `.set()`, `.get()`, `.has()`, and `.delete()` — but its keys **must be objects** (never primitives), and it holds those keys **weakly**: a `WeakMap` entry does **not** prevent its key from being garbage collected. Once nothing *else* in the program references that key object, the JavaScript engine is free to reclaim it — and its entry in the `WeakMap` is automatically removed along with it, with no leak and no manual cleanup required.",
      ],
      examples: [
        {
          id: "weakmap-example",
          title: "The same pattern, now leak-free",
          js: `const elementData = new WeakMap(); // WeakMap — holds keys weakly

let button = document.createElement("button");
elementData.set(button, { clicks: 0 });

console.log(elementData.get(button)); // { clicks: 0 }

button = null;
// Now the button object has no other references anywhere in the program,
// so the garbage collector is free to reclaim it — and its WeakMap entry
// disappears automatically along with it. No leak, no manual cleanup needed.`,
          explanation:
            "This is exactly why `WeakMap` is the standard tool for associating extra metadata with an object (like DOM elements, or instances of a class you don't control) without worrying about memory: the association's lifetime is automatically tied to the key's own lifetime.",
        },
      ],
      pitfalls: [
        {
          title: "WeakMap and WeakSet are deliberately NOT iterable and have no .size",
          body: "You cannot loop over a WeakMap/WeakSet, call .keys()/.values()/.entries(), or check its .size. This isn't a missing feature — it's intentional: because entries can disappear at any moment (whenever garbage collection runs, which is non-deterministic and invisible to your code), any snapshot of 'all current entries' could become stale immediately. The API only allows checking one specific key/value at a time, which stays meaningful regardless of GC timing.",
        },
      ],
    },
    {
      id: "weakset",
      heading: "WeakSet: tracking object membership without leaking",
      body: [
        "`WeakSet` is to `Set` what `WeakMap` is to `Map`: a collection of unique **objects** (never primitives), held weakly. A common use case is marking objects as 'already processed' or 'already visited' — for example, during a recursive traversal that needs to detect cycles — without preventing those objects from being freed once nothing else needs them.",
      ],
      examples: [
        {
          id: "weakset-example",
          title: "Tracking processed objects without a memory leak",
          js: `const processedObjects = new WeakSet();

function process(obj) {
  if (processedObjects.has(obj)) {
    console.log("Already processed, skipping");
    return;
  }
  processedObjects.add(obj);
  console.log("Processing...", obj);
}

let item = { id: 1 };
process(item); // "Processing... { id: 1 }"
process(item); // "Already processed, skipping"

item = null; // once nothing else references the original object, it can be
// garbage collected, and its entry in processedObjects disappears with it —
// no manual cleanup, no leak, even if this ran millions of times over the
// life of a long-running application`,
        },
      ],
    },
    {
      id: "ts-weak-collections",
      heading: "TypeScript: the object-only constraint is enforced at compile time",
      body: [
        "TypeScript's built-in types for `WeakMap<K, V>` and `WeakSet<T>` constrain their key/element type parameters to `object` (technically `WeakKey` in modern lib versions, which includes objects and, in recent JS, certain symbols) — passing a primitive like a string or number as a key is a compile-time error, not just a runtime one.",
      ],
      examples: [
        {
          id: "ts-weakmap-example",
          title: "TypeScript enforcing the object-only key constraint",
          ts: `interface ElementState {
  clicks: number;
}

const elementData = new WeakMap<HTMLElement, ElementState>();

const button = document.createElement("button");
elementData.set(button, { clicks: 0 }); // OK — HTMLElement is an object

elementData.set("not-an-element", { clicks: 0 });
// Error: Argument of type 'string' is not assignable to parameter of type 'HTMLElement'.

const state = elementData.get(button); // inferred as: ElementState | undefined`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can a regular Map cause a memory leak that a WeakMap cannot?",
      answer:
        "A regular Map holds a strong reference to every key it contains, which prevents that key from ever being garbage collected for as long as it remains in the Map — even if nothing else in the program references it anymore. A WeakMap holds its keys weakly, so once nothing else references a key object, it can be garbage collected and its WeakMap entry is automatically removed along with it.",
    },
    {
      question: "What's the key restriction on WeakMap and WeakSet compared to Map and Set?",
      answer:
        "WeakMap keys and WeakSet elements must be objects — primitives like strings or numbers are not allowed, because primitives aren't subject to garbage collection the same way and the weak-reference semantics require an object to hold a weak reference to.",
    },
    {
      question: "Why are WeakMap and WeakSet not iterable, and have no .size property?",
      answer:
        "Because entries can be silently removed at any moment whenever garbage collection runs, which is non-deterministic and invisible to your code. Any snapshot of 'current entries' or a total count could become stale the instant it's produced, so the API intentionally only supports checking one specific key/value at a time, which remains meaningful regardless of GC timing.",
    },
    {
      question: "Give a practical use case for WeakMap.",
      answer:
        "Associating extra metadata with objects you don't fully control the lifetime of — such as attaching state to DOM elements, or caching computed results keyed by object instances — without manually cleaning up that metadata when the object is removed. Since the WeakMap holds the key weakly, the metadata's lifetime is automatically tied to the object's own lifetime.",
    },
    {
      question: "How does TypeScript enforce the object-only key constraint on WeakMap/WeakSet?",
      answer:
        "The built-in WeakMap<K, V> and WeakSet<T> generic types constrain K and T to object (or WeakKey in modern lib versions). Passing a primitive value like a string or number as a key/element is a compile-time type error, catching the mistake before the code even runs, rather than only failing at runtime.",
    },
  ],
  takeaways: [
    "Regular Map/Set hold strong references to their contents, which can prevent garbage collection and leak memory in long-running applications.",
    "WeakMap/WeakSet hold their object keys/elements weakly — entries are automatically removed once nothing else references the key, with no manual cleanup.",
    "WeakMap/WeakSet keys and elements must be objects, never primitives — enforced at compile time in TypeScript and at runtime in JavaScript.",
    "WeakMap/WeakSet are intentionally not iterable and have no .size, because their contents can change at any moment due to garbage collection timing.",
    "The standard use cases are attaching metadata to objects you don't own the lifetime of, and tracking 'already seen' objects without leaking memory.",
  ],
  status: "available",
};
