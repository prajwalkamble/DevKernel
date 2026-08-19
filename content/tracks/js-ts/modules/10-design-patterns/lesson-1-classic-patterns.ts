import type { Lesson } from "@/content/types";

export const classicPatternsLesson: Lesson = {
  id: "patterns-classic",
  slug: "classic-patterns",
  moduleSlug: "design-patterns",
  title: "Module, Singleton, Factory & Observer",
  summary:
    "The four patterns you will actually meet in JavaScript codebases — and how closures, ES modules and private class fields changed what each of them needs to look like.",
  estimatedMinutes: 35,
  objectives: [
    "Implement encapsulation with closures and with private class fields",
    "Explain why an ES module is already a singleton, and when that is a problem",
    "Use a factory function, and know when a class is the better answer",
    "Build an observer with EventTarget rather than by hand",
    "Recognise when a pattern is carrying weight and when it is ceremony",
  ],
  sections: [
    {
      id: "why-different",
      heading: "Why the classic patterns look different here",
      body: [
        "Most design patterns were catalogued for languages where a class is the only unit of structure and every function must belong to one. JavaScript has first-class functions, closures, object literals and modules, so several patterns collapse into a language feature.",
        "The Gang of Four **Singleton** is a module. **Strategy** is passing a function. **Command** is a function. **Iterator** is built into the language. Reproducing the class-heavy version of these is a recognisable smell — it is Java written with JavaScript syntax.",
        "What follows is the four that still earn their keep, in the form they actually take.",
      ],
    },
    {
      id: "module-pattern",
      heading: "The module pattern: privacy",
      body: [
        "The problem: an object with internal state that callers must not reach. JavaScript has two real answers and one that is only a convention.",
        "**A closure.** Variables declared inside a factory function are unreachable from outside, full stop. Nothing can read them, no debugger trick, no `Object.keys`.",
        "**Private class fields** (`#count`). Genuinely private, enforced by the language — accessing one from outside is a **syntax error**, not a runtime one, so it fails before the code even runs.",
        "**An underscore prefix** (`_count`). Not privacy. A note to colleagues, visible to everything.",
      ],
      examples: [
        {
          id: "closure-vs-private",
          title: "Both kinds of real privacy",
          js: `// Closure: \`count\` exists only inside the function's scope.
function createCounter(start = 0) {
  let count = start;

  return {
    increment: () => ++count,
    get value() {
      return count;
    },
  };
}

const counter = createCounter(10);
counter.increment();
counter.increment();
console.log("counter:", counter.value, "| count leaked?", counter.count);

// Private class fields: enforced by the language.
class Counter {
  #count = 0;
  increment() {
    return ++this.#count;
  }
  get value() {
    return this.#count;
  }
}

const c = new Counter();
c.increment();
console.log("class:", c.value, "| keys:", JSON.stringify(Object.keys(c)));

// This does not throw at runtime — it fails to parse.
try {
  eval("c.#count");
} catch (error) {
  console.log("private access ->", error.constructor.name);
}`,
          ts: `// TypeScript's \`private\` is a compile-time-only check: it disappears at
// runtime and \`(obj as any).count\` reaches straight past it.
class SoftPrivate {
  private count = 0;
}

// \`#\` is real. TypeScript understands it and so does the runtime.
class HardPrivate {
  #count = 0;
  increment(): number {
    return ++this.#count;
  }
  get value(): number {
    return this.#count;
  }
}

const soft = new SoftPrivate();
// soft.count            -> Error: Property 'count' is private
(soft as any).count = 99;   // ...but this compiles and works

const hard = new HardPrivate();
// (hard as any).#count  -> not even parseable`,
          output: `counter: 12 | count leaked? undefined
class: 1 | keys: []
private access -> SyntaxError`,
          explanation:
            "Note `Object.keys(c)` is empty — private fields do not appear in enumeration, `JSON.stringify`, or the debugger's own property list. And the `SyntaxError` is the point: `#count` is not a name that can be looked up dynamically, so there is no escape hatch. **Prefer `#` over TypeScript's `private`** when the boundary actually matters, because `private` is erased at compile time.",
        },
      ],
      pitfalls: [
        {
          title: "Closures cost memory per instance",
          body: "Every object returned by a factory carries its own copies of the methods, because each one closes over a different scope. A class puts methods on the prototype, so a thousand instances share one function. For a handful of objects this is irrelevant; for a hundred thousand it is not. Measure before assuming either way.",
        },
      ],
    },
    {
      id: "singleton",
      heading: "Singleton: you already have one",
      body: [
        "**An ES module is a singleton.** It is evaluated once, the first time anything imports it, and every later import gets the same instance. Ten files importing the same module share exactly one object.",
        "So the class-with-a-static-getInstance dance is unnecessary. Export the instance.",
        "The important question is not how to build one but **whether you want one at all**. A singleton is global mutable state wearing a nicer name, and it brings the usual problems: tests that leak into each other, no way to have two configurations at once, and a dependency that is invisible in every function signature.",
      ],
      examples: [
        {
          id: "singleton-module",
          title: "The module version, and the version you should usually prefer",
          js: `// config.js — evaluated once, shared by every importer.
const settings = loadSettings();
export default settings;

// Or, when you need lazy initialisation:
let client;
export function getClient() {
  client ??= new ApiClient(settings.baseUrl);
  return client;
}

// ---------------------------------------------------------------
// The version that stays testable: create it once at the top level
// and pass it in. Same single instance; no hidden global.
// ---------------------------------------------------------------
export function createUserService(apiClient) {
  return {
    async find(id) {
      return apiClient.get(\`/users/\${id}\`);
    },
  };
}

// main.js
const userService = createUserService(getClient());

// user-service.test.js — no mocking framework required.
const service = createUserService({ get: async () => ({ id: 1, name: "Ada" }) });`,
          explanation:
            "The second half is *dependency injection*, and in JavaScript it needs no framework — it is a parameter. The service still has one instance in production; it simply does not reach out and grab it. That single change is usually the difference between a module you can test and one you have to mock at the import level.",
        },
      ],
      pitfalls: [
        {
          title: "Module-level side effects run on import, in an order you do not control",
          body: "Top-level code in a module runs the first time it is imported — which may be during another module's evaluation, before your app has configured anything. A module that opens a database connection or reads `process.env` at the top level is a startup-order bug waiting to happen. Export a function that does the work and call it deliberately.",
        },
      ],
    },
    {
      id: "factory",
      heading: "Factory: choosing what to build",
      body: [
        "A factory is a function that returns an object, hiding which concrete thing you got. In JavaScript that is just... a function, which is why the pattern barely needs a name.",
        "It earns its place when **construction involves a decision** — pick an implementation by configuration, by environment, by feature flag — or when the created object needs setup a constructor should not be doing.",
        "The related point worth internalising: `new` is not required to create objects, and a factory returning an object literal is often simpler than a class. Reach for a class when you need `instanceof`, inheritance, or many instances where prototype sharing matters.",
      ],
      examples: [
        {
          id: "factory-example",
          title: "A factory that chooses an implementation",
          js: `function createStorage(kind = "local") {
  switch (kind) {
    case "memory": {
      const map = new Map();
      return {
        get: (k) => map.get(k) ?? null,
        set: (k, v) => map.set(k, v),
      };
    }
    case "session":
      return wrap(sessionStorage);
    case "local":
      return wrap(localStorage);
    default:
      throw new Error(\`Unknown storage kind: \${kind}\`);
  }
}

function wrap(storage) {
  return {
    get: (k) => JSON.parse(storage.getItem(k) ?? "null"),
    set: (k, v) => storage.setItem(k, JSON.stringify(v)),
  };
}

// Callers never learn which one they got — which is the whole point.
const storage = createStorage(isTest ? "memory" : "local");`,
          ts: `interface Storage {
  get<T>(key: string): T | null;
  set(key: string, value: unknown): void;
}

type StorageKind = "memory" | "session" | "local";

// The union of kinds means an unknown string cannot even be passed,
// and the switch is checked for exhaustiveness.
export function createStorage(kind: StorageKind = "local"): Storage {
  switch (kind) {
    case "memory":
      return createMemoryStorage();
    case "session":
      return wrap(sessionStorage);
    case "local":
      return wrap(localStorage);
  }
}`,
          explanation:
            "The TypeScript version shows the real benefit of typing a factory: because `StorageKind` is a union, the `default` branch is unnecessary — the compiler already knows every case is handled, and adding a fourth kind makes the function fail to compile until you handle it. Lesson 3 uses the same mechanism for errors.",
        },
      ],
    },
    {
      id: "observer",
      heading: "Observer: don't write it by hand",
      body: [
        "One thing changes; several unrelated things need to know. The naive implementation is an array of callbacks, and almost every codebase has written one.",
        "You rarely need to. **`EventTarget` is built into browsers and Node**, gives you `addEventListener`, `removeEventListener` and `dispatchEvent`, supports `once` and `AbortSignal` for free, and is a class you can extend.",
        "The pattern's real hazard is not the implementation — it is **subscriptions that are never removed**. A listener holds a reference to whatever it closes over, so a forgotten unsubscribe keeps a whole component alive. That is the most common memory leak in front-end code.",
      ],
      examples: [
        {
          id: "observer-eventtarget",
          title: "A tiny store, built on EventTarget",
          js: `class Store extends EventTarget {
  #state = { count: 0 };

  get state() {
    return this.#state;
  }

  update(patch) {
    this.#state = { ...this.#state, ...patch };
    this.dispatchEvent(new CustomEvent("change", { detail: this.#state }));
  }
}

const store = new Store();

store.addEventListener("change", (event) => {
  console.log("observer heard:", JSON.stringify(event.detail));
});

store.update({ count: 5 });

// Cleanup comes free — one abort removes every subscription.
const controller = new AbortController();
store.addEventListener("change", render, { signal: controller.signal });
store.addEventListener("change", persist, { signal: controller.signal });
// controller.abort();`,
          ts: `interface StoreEventMap {
  change: CustomEvent<AppState>;
}

// Overriding addEventListener's signature gives callers a typed \`detail\`
// without every listener needing an annotation.
class Store extends EventTarget {
  #state: AppState = { count: 0 };

  get state(): Readonly<AppState> {
    return this.#state;
  }

  update(patch: Partial<AppState>): void {
    this.#state = { ...this.#state, ...patch };
    this.dispatchEvent(new CustomEvent("change", { detail: this.#state }));
  }

  addEventListener<K extends keyof StoreEventMap>(
    type: K,
    listener: (event: StoreEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }
}`,
          output: `observer heard: {"count":5}`,
          explanation:
            "`Readonly<AppState>` on the getter is a small but real improvement: callers can read the state and cannot mutate it without going through `update`, so the change event can never be missed. Note that `dispatchEvent` is synchronous — every listener runs before `update` returns.",
        },
      ],
      pitfalls: [
        {
          title: "An unsubscribed listener keeps its whole closure alive",
          body: "A listener added when a view mounts and never removed holds a reference to that view, its DOM nodes and everything it captured — for the lifetime of the store, which is usually the lifetime of the page. Navigate between two screens fifty times and there are fifty copies. Use `{ signal }` and abort on teardown, so removal cannot be forgotten one listener at a time.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When a pattern is ceremony",
      body: [
        "A pattern is a solution to a problem. Applied where the problem does not exist, it is pure cost: more files, more indirection, more to read before the actual behaviour appears.",
        "Some honest tests. **Is there a second implementation?** A factory or a strategy interface with exactly one implementation is a guess about the future, and the guess is usually wrong. **Is the indirection load-bearing?** An `AbstractUserRepositoryFactory` that always returns the same class is a name, not a design. **Would deleting it break anything?** If not, delete it.",
        "The counterweight: the patterns above genuinely pay when they are pulling weight. `EventTarget` for a real pub/sub, dependency injection at real test boundaries, a factory where the choice is real. The skill is telling the two situations apart, and it is mostly a matter of waiting until the second case arrives before generalising.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you get real privacy in JavaScript?",
      answer:
        "A closure, or a `#private` class field. Both are enforced — closure variables are unreachable by name from outside, and accessing a `#` field externally is a syntax error rather than a runtime one. An underscore prefix is a convention only, and TypeScript's `private` is compile-time only, so `(obj as any).x` reaches straight past it.",
    },
    {
      question: "Why don't you need a Singleton class in JavaScript?",
      answer:
        "An ES module is already one: it is evaluated once on first import and every importer receives the same bindings. Exporting an instance gives you the pattern for free. The more useful question is whether you want a singleton at all — it is global mutable state, so prefer creating the instance once at the top level and passing it in, which keeps the code testable.",
    },
    {
      question: "What is the most common bug with the observer pattern?",
      answer:
        "Listeners that are never removed. Each one holds a reference to everything it closes over, so a subscription created per mount and never cleaned up keeps that whole object graph alive for the life of the subject — the classic front-end memory leak. Registering with an `AbortSignal` and aborting on teardown removes them all at once and cannot drift out of sync.",
    },
    {
      question: "When is a class better than a factory function?",
      answer:
        "When you need `instanceof` checks, prototype inheritance, or many instances where sharing methods on the prototype matters — a factory gives every object its own copy of each method. A factory is better when construction involves a decision or asynchronous setup, when you want real privacy through closure, or when you simply do not need `new`.",
    },
  ],
  takeaways: [
    "Several classic patterns collapse into language features here: Singleton is a module, Strategy is a function, Iterator is built in",
    "Real privacy comes from a closure or a `#` field; `_name` is a convention and TypeScript's `private` is erased at runtime",
    "An ES module is evaluated once, so exporting an instance is the whole Singleton pattern",
    "Prefer passing dependencies in over reaching for a global — same single instance, but testable",
    "Module-level side effects run at import time, in an order you do not control",
    "A factory earns its place when construction involves a real choice; otherwise it is a function with a grand name",
    "Extend `EventTarget` instead of hand-rolling observers, and register with `{ signal }` so cleanup cannot be forgotten",
    "A pattern with one implementation and no second caller is usually a guess about the future",
  ],
  status: "available",
};
