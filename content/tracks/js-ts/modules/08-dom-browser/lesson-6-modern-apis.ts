import type { Lesson } from "@/content/types";

export const modernApisLesson: Lesson = {
  id: "dom-modern-apis",
  slug: "modern-browser-apis",
  moduleSlug: "dom-browser",
  title: "Browser APIs Worth Knowing",
  summary:
    "The platform APIs that replace code people still write by hand: the three observers instead of scroll and resize handlers, structuredClone instead of a JSON round-trip, and the formatting, timing and worker APIs you should reach for before a dependency.",
  estimatedMinutes: 30,
  objectives: [
    "Replace scroll-position maths with IntersectionObserver",
    "React to element size changes with ResizeObserver",
    "Watch for DOM changes with MutationObserver, and know when not to",
    "Deep-copy structured data with structuredClone, and know its limits",
    "Format numbers, dates and lists correctly with Intl",
    "Move expensive work off the main thread with a Web Worker",
  ],
  sections: [
    {
      id: "intersection",
      heading: "IntersectionObserver: is this element visible?",
      body: [
        "The old way to answer that was a `scroll` listener calling `getBoundingClientRect()` — which fires constantly, forces synchronous layout every time, and is a reliable source of jank.",
        "`IntersectionObserver` asks the browser to tell you when an element enters or leaves the viewport. The work happens off the main thread and the callback runs only when something actually changed.",
        "It is the right answer for lazy loading, infinite scroll, scroll-triggered animation, and \"was this ad actually seen\" analytics.",
      ],
      examples: [
        {
          id: "intersection-observer",
          title: "Lazy loading and infinite scroll",
          js: `// Reveal elements as they come into view, then stop watching them.
const revealer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      revealer.unobserve(entry.target);   // one-shot: stop watching
    }
  },
  {
    // Start 200px before it enters, so images load ahead of the scroll.
    rootMargin: "200px",
    // Fire when 10% of the element is showing.
    threshold: 0.1,
  }
);

document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

// Infinite scroll: watch a sentinel element after the last item.
const sentinel = document.querySelector("#load-more");
new IntersectionObserver(async ([entry]) => {
  if (entry.isIntersecting) await loadNextPage();
}).observe(sentinel);`,
          ts: `const revealer = new IntersectionObserver(
  (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  },
  { rootMargin: "200px", threshold: 0.1 }
);`,
          explanation:
            "Two options do the real work. `rootMargin` grows or shrinks the trigger area — a positive margin fires *early*, which is what makes lazy-loaded images appear to have been there all along. `threshold` is how much of the element must be showing, from 0 to 1; pass an array to be called at several points. And note `unobserve`: without it a reveal animation re-triggers every time the user scrolls back.",
        },
      ],
      pitfalls: [
        {
          title: "The callback fires once immediately for every observed element",
          body: "On `observe()`, the observer reports the element's current state — so elements already on screen fire with `isIntersecting: true` right away, and elements below the fold fire with `false`. Code that assumes the first call means \"just became visible\" will run its enter logic at page load for everything below the fold. Branch on `entry.isIntersecting` rather than treating any call as an entry.",
        },
      ],
    },
    {
      id: "resize-mutation",
      heading: "ResizeObserver and MutationObserver",
      body: [
        "**`ResizeObserver`** reports when an *element* changes size. The `resize` event on `window` only tells you the viewport changed, which misses everything caused by content, flex, a sidebar opening, or a container query. This is the API behind every \"chart that redraws when its container changes\" and it removed a great deal of polling.",
        "**`MutationObserver`** reports changes to the DOM itself: children added or removed, attributes changed, text edited. It is the right tool when you genuinely do not control the code making the change — a third-party widget, a CMS, a browser extension. If you *do* control it, react at the point of the change instead; watching your own mutations is an architecture smell.",
      ],
      examples: [
        {
          id: "resize-observer",
          title: "Reacting to an element's own size",
          js: `const chart = document.querySelector("#chart");

const sizer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // contentRect is the content box; contentBoxSize is the newer, richer form.
    const { width, height } = entry.contentRect;
    redraw(entry.target, width, height);
  }
});

sizer.observe(chart);

// Later, when the component goes away:
//   sizer.disconnect();`,
          explanation:
            "\"ResizeObserver loop completed with undelivered notifications\" is the error you get when a resize callback changes something that causes another resize — an infinite loop the browser breaks for you. The fix is to avoid writing layout-affecting styles from inside the callback, or to defer them with `requestAnimationFrame`.",
        },
        {
          id: "mutation-observer",
          title: "Watching DOM you do not control",
          js: `const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(enhance);
    }
    if (mutation.type === "attributes") {
      console.log(mutation.attributeName, "changed on", mutation.target);
    }
  }
});

observer.observe(document.querySelector("#third-party-widget"), {
  childList: true,      // children added or removed
  subtree: true,        // ...at any depth
  attributes: true,     // attribute changes
  attributeFilter: ["class", "data-state"],   // only these, for performance
  characterData: false, // text node contents
});

// Always disconnect — an observer keeps its target alive.
//   observer.disconnect();`,
          explanation:
            "`subtree: true` with no `attributeFilter` on a large container is genuinely expensive: the callback runs for every change anywhere beneath it. Narrow the target and filter the attributes. Note that mutations are delivered **in batches as a microtask**, so several changes in one tick arrive as one callback with several records.",
        },
      ],
    },
    {
      id: "structured-clone",
      heading: "structuredClone: a real deep copy",
      body: [
        "`JSON.parse(JSON.stringify(x))` has been the deep-copy idiom for years, and it is lossy in ways people forget. It turns `Date` into a string, drops `undefined`, `Map`, `Set` and functions entirely, and throws outright on a circular reference.",
        "`structuredClone` is built in, handles all of those, and preserves cycles.",
      ],
      examples: [
        {
          id: "structured-clone-example",
          title: "What each one keeps",
          js: `const original = {
  when: new Date("2026-01-01"),
  set: new Set([1, 2]),
  map: new Map([["a", 1]]),
  nested: { n: 1 },
  un: undefined,
};
original.self = original;              // a cycle

const cloned = structuredClone(original);

console.log(cloned.when instanceof Date, cloned.set instanceof Set, cloned.map instanceof Map);
console.log("cycle preserved:", cloned.self === cloned);
console.log("deep copy:", cloned.nested !== original.nested);

// The JSON idiom, for comparison:
console.log(JSON.stringify(
  JSON.parse(JSON.stringify({ when: new Date("2026-01-01"), set: new Set([1, 2]), un: undefined }))
));

// It cannot clone anything with behaviour.
try {
  structuredClone({ fn: () => {} });
} catch (error) {
  console.log("functions ->", error.name);
}`,
          output: `true true true
cycle preserved: true
deep copy: true
{"when":"2026-01-01T00:00:00.000Z","set":{}}
functions -> DataCloneError`,
          explanation:
            "Look at the JSON line: the `Date` became a string, the `Set` became `{}`, and `undefined` vanished entirely. `structuredClone` kept all three as real objects and preserved the cycle. What it cannot clone is anything with behaviour — functions, DOM nodes, class instances (you get a plain object with the fields but no prototype), and Error objects in older engines.",
        },
      ],
    },
    {
      id: "intl",
      heading: "Intl: stop formatting by hand",
      body: [
        "`Intl` is the most under-used thing in the browser. Currency, dates, relative times, plurals, lists and locale-aware sorting are all built in, correct for every locale, and require no dependency.",
        "Hand-written formatting is wrong somewhere: `toFixed(2)` with a `£` in front gets the separator wrong for most of Europe, `\"a, b and c\"` gets the Oxford comma wrong for American English, and `\"2 days ago\"` needs a table per language.",
      ],
      examples: [
        {
          id: "intl-example",
          title: "Four formatters worth knowing",
          js: `// Currency: correct symbol, separators and placement per locale.
console.log(new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
}).format(1234.5));

// Relative time, with words rather than numbers where a language has them.
console.log(new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-1, "day"));

// Lists, with the right conjunction and comma rules.
console.log(new Intl.ListFormat("en", { type: "conjunction" }).format(["a", "b", "c"]));

// Also worth knowing:
//   new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" })
//   new Intl.PluralRules("en")                       -> "one" | "other"
//   new Intl.Collator("de").compare                  -> locale-correct sorting
//   new Intl.NumberFormat("en", { notation: "compact" }).format(12500)  -> "13K"`,
          output: `£1,234.50
yesterday
a, b, and c`,
          explanation:
            "`numeric: \"auto\"` is why the second line says \"yesterday\" rather than \"1 day ago\" — it uses the idiomatic word where the language has one. And note the list came out with the Oxford comma, which is correct for `en` and would not be for `en-GB` conventions in some styles. Constructing a formatter is not free, so hoist it out of a render loop rather than building one per row.",
        },
      ],
    },
    {
      id: "timing-workers",
      heading: "Timing and the main thread",
      body: [
        "**`requestAnimationFrame`** schedules work for just before the next paint, which is the only correct time to write animation. A `setInterval` animation runs at the wrong rate on a 120 Hz display and keeps running in a background tab; `requestAnimationFrame` matches the display and pauses when the tab is hidden.",
        "**`requestIdleCallback`** runs work when the browser has nothing better to do — good for analytics, prefetching and cache warming.",
        "**Web Workers** run JavaScript on a separate thread. Anything that takes more than a frame — parsing a large file, image processing, crypto, a heavy search — belongs there, because the main thread is also the thread that responds to clicks.",
      ],
      examples: [
        {
          id: "worker-example",
          title: "Moving work off the main thread",
          js: `// worker.js
self.addEventListener("message", (event) => {
  const result = expensiveWork(event.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

worker.postMessage({ rows: 1_000_000 });
worker.addEventListener("message", (event) => render(event.data));

// When finished:
//   worker.terminate();`,
          explanation:
            "`new URL(\"./worker.js\", import.meta.url)` is the form every modern bundler understands — a bare string path works in the browser but breaks under bundling. Messages are copied with the **structured clone** algorithm, so the same rules as `structuredClone` apply: no functions, no DOM nodes. A worker has no DOM at all, which is why the playground in this site can run JavaScript safely inside one.",
        },
      ],
      pitfalls: [
        {
          title: "Not everything belongs in a worker",
          body: "Starting a worker costs a few milliseconds and every message is a structured clone, so shipping a large array back and forth can cost more than the work saved. Workers pay off for sustained or genuinely heavy computation, not for something that takes two milliseconds. Measure before and after — `performance.now()` around the work is enough to tell.",
        },
      ],
    },
    {
      id: "small-things",
      heading: "Small things that remove dependencies",
      body: [
        "**`crypto.randomUUID()`** — a proper v4 UUID, 36 characters. Requires a secure context (HTTPS or localhost).",
        "**`URL` and `URLSearchParams`** — parsing and building URLs correctly, covered in the fetch lesson.",
        "**`AbortController`** — cancels fetches *and* removes event listeners, covered in both earlier lessons. One object, two uses.",
        "**`navigator.clipboard.writeText`** — copy to clipboard, promise-based, requires a user gesture.",
        "**`matchMedia`** — read and subscribe to a media query from JavaScript, which is how you detect dark mode or reduced-motion preferences.",
        "**`Element.animate`** — the Web Animations API: keyframes from JavaScript, running off the main thread like CSS animation, with a promise for completion.",
        "**`navigator.sendBeacon`** — fire-and-forget analytics that survives the page unloading, unlike a `fetch` the browser will cancel.",
      ],
      examples: [
        {
          id: "small-apis",
          title: "A few lines each",
          js: `// Ids, without a dependency.
const id = crypto.randomUUID();          // "3f2b1c4e-…", 36 chars

// Respecting the user's motion preference.
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
if (!reduced.matches) element.animate(
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 200, easing: "ease-out" }
);
reduced.addEventListener("change", (e) => console.log("preference now:", e.matches));

// Copying, from a click handler (a gesture is required).
copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(code.textContent);
  copyButton.textContent = "Copied";
});

// Analytics that survives the page going away.
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    navigator.sendBeacon("/analytics", JSON.stringify({ event: "leave" }));
  }
});`,
          explanation:
            "The `visibilitychange` pattern is worth adopting: `beforeunload` and `unload` are unreliable on mobile, where a tab is often discarded without firing them. `visibilitychange` to `hidden` is the last event you are guaranteed to get, and `sendBeacon` is the only request that reliably completes after it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why use IntersectionObserver instead of a scroll listener?",
      answer:
        "A scroll listener fires continuously and typically calls `getBoundingClientRect()`, which forces synchronous layout on every call and causes jank. `IntersectionObserver` lets the browser do the work off the main thread and calls you only when the intersection actually changes, with options — `rootMargin` and `threshold` — that express \"nearly visible\" and \"partly visible\" declaratively.",
    },
    {
      question: "What does structuredClone do that JSON.parse(JSON.stringify(x)) does not?",
      answer:
        "It preserves `Date`, `Map`, `Set`, `RegExp`, typed arrays and `undefined`, and it handles circular references, which the JSON round-trip throws on. It cannot clone anything with behaviour — functions and DOM nodes raise `DataCloneError`, and class instances come back as plain objects without their prototype.",
    },
    {
      question: "When is a Web Worker worth it?",
      answer:
        "When work is heavy enough to block the main thread — parsing large files, image or audio processing, crypto, large searches. It is not worth it for short tasks, because starting a worker costs a few milliseconds and every message is structured-cloned, so transferring a large result can cost more than the computation saved. Workers have no DOM access.",
    },
    {
      question: "Why prefer requestAnimationFrame over setInterval for animation?",
      answer:
        "It runs immediately before the next paint, so it matches the display's refresh rate rather than an arbitrary interval, and it pauses automatically when the tab is hidden instead of burning battery. `setInterval` at 16ms is wrong on a 120 Hz display and keeps firing in a background tab.",
    },
  ],
  takeaways: [
    "`IntersectionObserver` replaces scroll maths for lazy loading, infinite scroll and reveal animations — and fires once immediately for every element you observe",
    "`ResizeObserver` watches an element's own size, which the window `resize` event cannot see",
    "`MutationObserver` is for DOM you do not control; watching your own mutations is a design smell",
    "`structuredClone` keeps Date, Map, Set and cycles; the JSON round-trip loses all of them and throws on cycles",
    "`Intl` formats currency, dates, relative times, lists and plurals correctly per locale — hoist formatters out of loops",
    "`requestAnimationFrame` for animation, `requestIdleCallback` for background work, Web Workers for anything that would block a frame",
    "`crypto.randomUUID`, `matchMedia`, `Element.animate`, `navigator.clipboard` and `sendBeacon` all replace dependencies people still install",
    "Use `visibilitychange` plus `sendBeacon` rather than `beforeunload`, which mobile browsers frequently skip",
  ],
  status: "available",
};
