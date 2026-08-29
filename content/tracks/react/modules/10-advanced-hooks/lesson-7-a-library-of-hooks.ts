import type { Lesson } from "@/content/types";

export const libraryOfHooksLesson: Lesson = {
  id: "react-hook-library",
  slug: "a-library-of-small-hooks",
  moduleSlug: "advanced-and-custom-hooks",
  title: "A Library of Small Hooks You Will Actually Reuse",
  summary:
    "Eight hooks worth having, written properly rather than as one-liners: what each is for, the detail that makes it correct, and the one you should not write because a browser API already does it.",
  estimatedMinutes: 30,
  objectives: [
    "Write usePrevious, useToggle, useDebounced and a clamped counter correctly",
    "Wrap localStorage without breaking on the server or a full quota",
    "Wrap an event listener so the handler can change without resubscribing",
    "Say which of these to take from a library instead",
    "Recognise the details that make each one correct",
  ],
  sections: [
    {
      id: "three-running",
      heading: "Three, running",
      body: [
        "Start with the ones small enough to read whole. Each is a few lines, and each has one detail that makes it correct rather than nearly correct.",
      ],
      examples: [
        {
          id: "small-hooks",
          title: "usePrevious, useToggle and a clamped counter",
          lang: "jsx",
          code: `import { useState, useRef, useEffect, useCallback, act } from "react";
import { createRoot } from "react-dom/client";

/* The value this component had on its previous render. A ref written in an
   effect, so the render itself still sees the old one. */
function usePrevious(value) {
  const box = useRef(undefined);
  useEffect(() => { box.current = value; }, [value]);
  return box.current;
}

/* A boolean and a way to flip it. \`toggle\` is stable, so it can be passed
   to a memoised child without a useCallback at the call site. */
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle, setOn];
}

/* A counter that clamps, so the rules live in the hook rather than in every
   caller that increments. */
function useClampedCounter(min, max, initial = min) {
  const [n, setN] = useState(initial);
  const by = useCallback(
    (delta) => setN((current) => Math.min(max, Math.max(min, current + delta))),
    [min, max],
  );
  return { n, by, atMin: n === min, atMax: n === max };
}

function Demo() {
  const [open, toggle] = useToggle();
  const { n, by, atMin, atMax } = useClampedCounter(0, 3);
  const previousN = usePrevious(n);
  return (
    <output>
      {\`open=\${open} n=\${n} previous=\${previousN} atMin=\${atMin} atMax=\${atMax}\`}
      <button type="button" id="t" onClick={toggle}>t</button>
      <button type="button" id="up" onClick={() => by(1)}>+</button>
      <button type="button" id="down" onClick={() => by(-1)}>-</button>
    </output>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<Demo />); });
const show = () => container.querySelector("output").textContent.replace(/t\\+-$/, "");
const click = (id) => act(() => { container.querySelector(\`#\${id}\`).click(); });

console.log("mounted:        ", show());
click("t");
console.log("toggled:        ", show());
click("up"); click("up");
console.log("two increments: ", show());
click("up"); click("up");
console.log("clamped at max: ", show());
click("down"); click("down"); click("down"); click("down");
console.log("clamped at min: ", show());`,
          output: `mounted:         open=false n=0 previous=undefined atMin=true atMax=false
toggled:         open=true n=0 previous=0 atMin=true atMax=false
two increments:  open=true n=2 previous=1 atMin=false atMax=false
clamped at max:  open=true n=3 previous=2 atMin=false atMax=true
clamped at min:  open=true n=0 previous=1 atMin=true atMax=false`,
          explanation:
            "Read `previous` on the last two lines. Four `+` clicks left `n` at 3, and `previous` is 2 — the fourth click was clamped, so no render happened and `previous` did not advance. That is the honest behaviour: `usePrevious` reports the previous *render*, not the previous call, and a hook that hid the difference would be lying about what happened.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useRef, useEffect, useCallback, act } from "react";
import { createRoot } from "react-dom/client";

/* The value this component had on its previous render. A ref written in an
   effect, so the render itself still sees the old one. */
function usePrevious<T>(value: T): T | undefined {
  const box = useRef<T | undefined>(undefined);
  useEffect(() => { box.current = value; }, [value]);
  return box.current;
}

/* A boolean and a way to flip it. \`toggle\` is stable, so it can be passed
   to a memoised child without a useCallback at the call site. */
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle, setOn] as const;
}

/* A counter that clamps, so the rules live in the hook rather than in every
   caller that increments. */
function useClampedCounter(min: number, max: number, initial = min) {
  const [n, setN] = useState(initial);
  const by = useCallback(
    (delta: number) => setN((current) => Math.min(max, Math.max(min, current + delta))),
    [min, max],
  );
  return { n, by, atMin: n === min, atMax: n === max };
}

function Demo() {
  const [open, toggle] = useToggle();
  const { n, by, atMin, atMax } = useClampedCounter(0, 3);
  const previousN = usePrevious(n);
  return (
    <output>
      {\`open=\${open} n=\${n} previous=\${previousN} atMin=\${atMin} atMax=\${atMax}\`}
      <button type="button" id="t" onClick={toggle}>t</button>
      <button type="button" id="up" onClick={() => by(1)}>+</button>
      <button type="button" id="down" onClick={() => by(-1)}>-</button>
    </output>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
act(() => { createRoot(container).render(<Demo />); });
const show = () => container.querySelector("output")!.textContent!.replace(/t\\+-$/, "");
const click = (id: string) => act(() => { container.querySelector<HTMLButtonElement>(\`#\${id}\`)!.click(); });

console.log("mounted:        ", show());
click("t");
console.log("toggled:        ", show());
click("up"); click("up");
console.log("two increments: ", show());
click("up"); click("up");
console.log("clamped at max: ", show());
click("down"); click("down"); click("down"); click("down");
console.log("clamped at min: ", show());`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`usePrevious` returns `undefined` on the first render",
          body: "There was no previous render, so there is no honest answer, and the type says `T | undefined` to make the caller handle it. Initialising the ref with the current value instead — so it returns `value` first time — makes the type nicer and produces the wrong answer for the case people use this hook for: detecting that something changed.",
        },
        {
          title: "`useToggle` returns three things on purpose",
          body: "`toggle` covers most uses; `setOn` is there for the cases where you need to close something regardless of its current state — a route change, an Escape key, a click outside. A hook that returns only `toggle` gets a `setOpen(false)` reimplemented at every call site as `if (open) toggle()`, which races.",
        },
      ],
    },
    {
      id: "debounced",
      heading: "Debouncing, both ways",
      body: [
        "Two different hooks that people conflate. **Debouncing a value** waits for it to settle and gives you the settled one; **debouncing a callback** delays the call. The first is what a search box wants, because it composes with everything downstream.",
      ],
      examples: [
        {
          id: "debounce-hooks",
          title: "A settled value, and a delayed call",
          lang: "jsx",
          code: `/* Value: returns the input once it has stopped changing for \`ms\`.
   Composes — anything depending on the result is automatically debounced. */
export function useDebounced(value, ms = 300) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    // Each change cancels the previous timer, which is what makes it wait
    // for a *pause* rather than firing every \`ms\`.
    return () => clearTimeout(id);
  }, [value, ms]);

  return settled;
}

/* Callback: delays the call itself. For side effects with no value —
   autosaving, sending an analytics event. */
export function useDebouncedCallback(
  fn,
  ms = 300,
) {
  // The latest fn, without making the debounced function change identity
  // every render. Written in an effect, so render stays pure.
  const latest = useRef(fn);
  useEffect(() => { latest.current = fn; }, [fn]);

  const timer = useRef(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), ms);
  }, [ms]);
}

// The composing property, in one line:
const results = useSearch(useDebounced(query));`,
          explanation:
            "The `latest` ref in the callback version is the pattern worth learning — it is how you let a callback see the current render's values without making the wrapper change identity. React has a proposed `useEffectEvent` hook for exactly this shape; until it lands, this is the way to write it.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Value: returns the input once it has stopped changing for \`ms\`.
   Composes — anything depending on the result is automatically debounced. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    // Each change cancels the previous timer, which is what makes it wait
    // for a *pause* rather than firing every \`ms\`.
    return () => clearTimeout(id);
  }, [value, ms]);

  return settled;
}

/* Callback: delays the call itself. For side effects with no value —
   autosaving, sending an analytics event. */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 300,
) {
  // The latest fn, without making the debounced function change identity
  // every render. Written in an effect, so render stays pure.
  const latest = useRef(fn);
  useEffect(() => { latest.current = fn; }, [fn]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback((...args: A) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), ms);
  }, [ms]);
}

// The composing property, in one line:
const results = useSearch(useDebounced(query));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The unmount cleanup is not optional",
          body: "Without `useEffect(() => () => clearTimeout(timer.current), [])`, a component unmounted during the delay leaves a timer that fires into a function closing over a dead component. It is the module 7 leak, in the hook people copy most often from a blog post — and blog-post versions almost always omit it.",
        },
      ],
    },
    {
      id: "browser",
      heading: "Wrapping browser APIs",
      body: [
        "Two more, both of which have a detail that most versions get wrong.",
      ],
      examples: [
        {
          id: "browser-hooks",
          title: "A listener, and localStorage",
          lang: "jsx",
          code: `/* An event listener whose handler may change without resubscribing.
   The naive version puts \`handler\` in the dependency array and removes and
   re-adds the listener on every render of the caller. */
export function useEventListener(
  type,
  handler,
  target = window,
) {
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; }, [handler]);

  useEffect(() => {
    // Stable across the whole subscription; reads the current handler when
    // it fires.
    const listener = (event) => latest.current(event);
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
  }, [type, target]);
}

/* localStorage, with every failure mode handled. All three try/catch blocks
   are load-bearing: private browsing throws on access, the quota can be
   full, and the stored value may not be JSON if another version wrote it. */
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    // Lazy initialiser: reads storage once, not on every render. And it is
    // never reached on the server, where there is no window.
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw));
    } catch {
      return fallback;
    }
  });

  const set = useCallback((next) => {
    setValue((previous) => {
      const resolved = next instanceof Function ? next(previous) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* quota exceeded, or storage disabled */ }
      return resolved;
    });
  }, [key]);

  // Another tab changed it. The \`storage\` event does not fire in the tab
  // that made the change, so this cannot loop.
  useEventListener("storage", (event) => {
    if (event.key === key && event.newValue !== null) {
      try { setValue(JSON.parse(event.newValue)); } catch { /* ignore */ }
    }
  });

  return [value, set];
}`,
          explanation:
            "`useLocalStorage` composing `useEventListener` is the composition point from the last lesson doing real work — the cross-tab sync is three lines because the subscription problem was already solved. And note that a server-rendered `useLocalStorage` returns the fallback on the first render by construction, which is what keeps hydration consistent.",
          alternates: [
            {
              lang: "tsx",
              code: `/* An event listener whose handler may change without resubscribing.
   The naive version puts \`handler\` in the dependency array and removes and
   re-adds the listener on every render of the caller. */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  target: Window | Document | HTMLElement = window,
) {
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; }, [handler]);

  useEffect(() => {
    // Stable across the whole subscription; reads the current handler when
    // it fires.
    const listener = (event: Event) => latest.current(event as WindowEventMap[K]);
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
  }, [type, target]);
}

/* localStorage, with every failure mode handled. All three try/catch blocks
   are load-bearing: private browsing throws on access, the quota can be
   full, and the stored value may not be JSON if another version wrote it. */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    // Lazy initialiser: reads storage once, not on every render. And it is
    // never reached on the server, where there is no window.
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });

  const set = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const resolved = next instanceof Function ? next(previous) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* quota exceeded, or storage disabled */ }
      return resolved;
    });
  }, [key]);

  // Another tab changed it. The \`storage\` event does not fire in the tab
  // that made the change, so this cannot loop.
  useEventListener("storage", (event) => {
    if (event.key === key && event.newValue !== null) {
      try { setValue(JSON.parse(event.newValue) as T); } catch { /* ignore */ }
    }
  });

  return [value, set] as const;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The one not to write: `useFetch`",
          body: "Every hook collection has one, and it is always the version from module 7 lesson 3 — correct, and with no cache, no deduplication, no invalidation and no retry. Those need a store outside the tree, which a hook cannot have. Use a query library.",
        },
        {
          title: "The others not to write",
          body: "`useMediaQuery`, `useOnScreen`, `useLocalStorage` and `useEventListener` are all fine to own — they are short and they rarely change. `useVirtualList`, `useDrag`, `useForm` and anything focus-trapping are not: each has an accessibility or edge-case surface that takes months to get right, and a maintained library has already spent those months.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you write usePrevious?",
      answer:
        "A ref written in an effect, returned before the write happens — so the render sees the value from the previous render. It returns `T | undefined`, because on the first render there is no previous value and any other answer is a lie. It also reports the previous *render*, not the previous call: if a state update was skipped because the value did not change, the previous value does not advance either.",
    },
    {
      question: "What is the difference between debouncing a value and debouncing a callback?",
      answer:
        "`useDebounced(value)` returns the value once it has stopped changing, so everything downstream of it is automatically debounced — that is what a search box wants, because the result composes. `useDebouncedCallback(fn)` delays the call itself, which is right for side effects with no value, like autosaving. Both need a cleanup that clears the timer on unmount, and blog-post versions almost always omit it.",
    },
    {
      question: "How do you let a long-lived callback see the current render's values?",
      answer:
        "Keep the latest function in a ref, written in an effect, and have the subscription call `ref.current(...)`. That way the subscribed listener has a stable identity — so it does not resubscribe on every render — while still reading current values when it fires. It is the shape React's proposed `useEffectEvent` is designed to replace, and until that lands it is how to write it.",
    },
    {
      question: "Which hooks should you not write yourself?",
      answer:
        "`useFetch`, because caching, deduplication and invalidation need a store outside the component tree, which a hook cannot have — that is a query library. And anything with a large accessibility surface: virtual lists, drag and drop, focus traps, full form libraries. Small wrappers around a browser API are worth owning, because they are short and rarely change.",
    },
  ],
  takeaways: [
    "`usePrevious` returns `undefined` first — anything else lies about the case you use it for",
    "It tracks the previous *render*, so a skipped update does not advance it",
    "`useToggle` returns the setter as well, or every caller reimplements \"close it\" as a race",
    "Debounce a value to make everything downstream debounced; debounce a callback for side effects",
    "Always clear the timer on unmount — the omission most copied versions share",
    "A ref holding the latest function lets a stable subscription read current values",
    "`useLocalStorage` needs a lazy initialiser, three try/catch blocks, and the cross-tab `storage` event",
    "Do not write `useFetch` — a cache cannot live in a hook",
    "Own small browser wrappers; take virtual lists, drag and drop and focus traps from a library",
  ],
  status: "available",
};
