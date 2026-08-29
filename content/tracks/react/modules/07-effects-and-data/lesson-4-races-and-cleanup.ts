import type { Lesson } from "@/content/types";

export const racesAndCleanupLesson: Lesson = {
  id: "react-races-and-cleanup",
  slug: "race-conditions-and-cleanup",
  moduleSlug: "effects-and-data",
  title: "The Race Condition Nobody Sees in Development",
  summary:
    "Two requests in flight and the slow one lands last. Watch the wrong results appear with no error and nothing in the console, then fix it in four lines — and learn when to cancel instead of ignore.",
  estimatedMinutes: 30,
  objectives: [
    "Explain why response order is not request order",
    "Fix it with an ignore flag, and say why the cleanup's closure makes it work",
    "Cancel a request with AbortController, and know when that is the better tool",
    "Say why the bug never reproduces on localhost",
    "Recognise the symptom in a bug report",
  ],
  sections: [
    {
      id: "the-bug",
      heading: "The bug",
      body: [
        "A search box. Every keystroke changes a piece of state, the effect depends on it, so every keystroke starts a request.",
        "Nothing in that sentence is wrong. The problem is the assumption hiding under it: that responses come back in the order the requests went out. They do not, and nothing makes them.",
        "Step the animation. The first request is the slow one — a longer query prefix that the server has to work harder on, a cold cache, a request that got unlucky — and it lands after the second.",
      ],
      visual: {
        id: "fetch-race-visual",
        kind: "react-rendering",
        algorithm: "fetch-race",
        title: "Two keystrokes, and the response that arrives last",
      },
      examples: [
        {
          id: "the-race",
          title: "The race, and the four-line fix",
          lang: "jsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A fake API where the *first* query is the slow one — which is the whole
   point, and the reason this never reproduces against localhost. */
const LATENCY = { ad: 120, ada: 10 };
function search(query) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(\`results for "\${query}"\`), LATENCY[query]),
  );
}

function Racy({ query }) {
  const [results, setResults] = useState("—");
  useEffect(() => {
    search(query).then(setResults);
  }, [query]);
  return <p>{results}</p>;
}

function Fixed({ query }) {
  const [results, setResults] = useState("—");
  useEffect(() => {
    let ignore = false;
    search(query).then((r) => {
      if (!ignore) setResults(r);
      else console.log(\`  (dropped a stale response for "\${query}")\`);
    });
    return () => { ignore = true; };
  }, [query]);
  return <p>{results}</p>;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function drive(Component, label) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  console.log(label);
  await act(async () => { root.render(<Component query="ad" />); });
  await act(async () => { root.render(<Component query="ada" />); });
  await act(async () => { await sleep(200); });
  console.log("  on screen:", container.textContent);
}

await drive(Racy, 'typed "ad" then "ada", no cleanup:');
await drive(Fixed, 'the same two keystrokes, with a cleanup:');`,
          output: `typed "ad" then "ada", no cleanup:
  on screen: results for "ad"
the same two keystrokes, with a cleanup:
  (dropped a stale response for "ad")
  on screen: results for "ada"`,
          explanation:
            "The user typed `ada` and is looking at results for `ad`. No error, no warning, nothing in the console — the state update was perfectly legitimate, it just came from a request the user had already moved on from. The fixed version drops it, and says so.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

/* A fake API where the *first* query is the slow one — which is the whole
   point, and the reason this never reproduces against localhost. */
const LATENCY: Record<string, number> = { ad: 120, ada: 10 };
function search(query: string): Promise<string> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(\`results for "\${query}"\`), LATENCY[query]),
  );
}

function Racy({ query }: { query: string }) {
  const [results, setResults] = useState("—");
  useEffect(() => {
    search(query).then(setResults);
  }, [query]);
  return <p>{results}</p>;
}

function Fixed({ query }: { query: string }) {
  const [results, setResults] = useState("—");
  useEffect(() => {
    let ignore = false;
    search(query).then((r) => {
      if (!ignore) setResults(r);
      else console.log(\`  (dropped a stale response for "\${query}")\`);
    });
    return () => { ignore = true; };
  }, [query]);
  return <p>{results}</p>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drive(Component: (p: { query: string }) => React.JSX.Element, label: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  console.log(label);
  await act(async () => { root.render(<Component query="ad" />); });
  await act(async () => { root.render(<Component query="ada" />); });
  await act(async () => { await sleep(200); });
  console.log("  on screen:", container.textContent);
}

await drive(Racy, 'typed "ad" then "ada", no cleanup:');
await drive(Fixed, 'the same two keystrokes, with a cleanup:');`,
            },
          ],
        },
      ],
    },
    {
      id: "why-it-works",
      heading: "Why four lines are enough",
      body: [
        "`let ignore = false` is a plain local variable, and that is the entire trick. It is created fresh by each run of the effect, and the cleanup returned by that run is the only code that can see it.",
        "So when the effect re-runs for `ada`, React first calls the previous run's cleanup — the one holding `ad`'s flag — and sets *that* flag to true. `ad`'s `.then` callback closes over the same variable, so when it finally resolves it sees `true` and returns without touching state.",
        "This is the cleanup-before-next-effect ordering from lesson 2 doing real work. The flag belongs to a specific run of the effect, and it is set at exactly the moment that run stops being current.",
      ],
      visual: {
        id: "fetch-race-fixed-visual",
        kind: "react-rendering",
        algorithm: "fetch-race-fixed",
        title: "The same two keystrokes, with the flag",
      },
      pitfalls: [
        {
          title: "A ref does not work here",
          body: "`useRef` is one box shared by every render of the component, so a single `ignore.current = true` would suppress *every* in-flight request including the current one. The point is that each effect run needs its own flag. A local `let` gives you exactly one per run, for free.",
        },
        {
          title: "This also covers unmounting",
          body: "The cleanup runs on unmount too, so the same four lines stop a response arriving after the component is gone. That used to produce a \"can't perform a React state update on an unmounted component\" warning; React removed the warning in 18 because it was firing on correct code as often as not, but the wasted work and the leak-shaped bugs are still real.",
        },
      ],
    },
    {
      id: "abort",
      heading: "Cancelling for real: AbortController",
      body: [
        "The flag ignores the response. `AbortController` stops the request. They solve different halves of the problem and you often want both.",
        "The controller is created inside the effect, its `signal` is handed to `fetch`, and the cleanup calls `abort()`. The browser tears down the connection, and the promise rejects with an `AbortError`.",
      ],
      examples: [
        {
          id: "abort-controller",
          title: "Aborting, with the rejection handled",
          lang: "tsx",
          code: `function Results({ query }: { query: string }) {
  const [state, setState] = useState<Status>({ tag: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ tag: "loading" });

    getJSON<Hit[]>(\`/api/search?q=\${encodeURIComponent(query)}\`, controller.signal)
      .then(
        (hits) => setState({ tag: "ready", hits }),
        (error) => {
          // An abort is not a failure — it is this effect's own cleanup
          // doing its job, and showing the user an error for it is wrong.
          if (error.name === "AbortError") return;
          setState({ tag: "error", message: error.message });
        },
      );

    return () => controller.abort();
  }, [query]);

  // …
}`,
          explanation:
            "The `AbortError` check is not optional. Without it, every keystroke that supersedes a request paints an error message on screen for a request you cancelled on purpose — a bug that looks exactly like a flaky backend and is reported as one.",
        },
      ],
      pitfalls: [
        {
          title: "Which one to use",
          body: "Use the **ignore flag** when the work is already done or nearly free to finish — a cached response, a fast endpoint, or a promise that is not a network request at all. Use **abort** when the request is expensive for the server or the user's connection: a large payload, a slow report, a mobile data plan. Aborting also frees a connection from the browser's per-host limit, which matters when a page fires many requests. When in doubt, abort — it is the same number of lines.",
        },
        {
          title: "Abort does not work on a promise you did not make cancellable",
          body: "`AbortController` is not a general promise-cancellation mechanism. It works because `fetch` accepts a signal and honours it. A third-party client that does not take a signal cannot be aborted, and there the ignore flag is the only tool you have.",
        },
      ],
    },
    {
      id: "why-hidden",
      heading: "Why you will not see this locally",
      body: [
        "Against `localhost`, requests come back in about a millisecond, in order, every time. You would have to type impossibly fast to overlap two of them.",
        "In production: variable latency, a CDN with a warm cache for one query and a cold one for another, a mobile connection, a server that is faster for a longer prefix because it matches fewer rows. Overlapping requests are the normal case, and out-of-order responses follow.",
        "So this is not a bug you find by using the feature. You find it by knowing it exists — or from a bug report that reads like one of these:",
        "\"Sometimes the search results are for what I typed a second ago.\"",
        "\"If I click through the list quickly, the detail pane shows the wrong item.\"",
        "\"Switching tabs fast sometimes loads the previous tab's data.\"",
        "All three are this. Look at the effect before looking anywhere else, and check whether the cleanup exists.",
      ],
      pitfalls: [
        {
          title: "Debouncing reduces it; it does not fix it",
          body: "Waiting 300ms after the last keystroke makes overlaps rarer and is worth doing for the server's sake. It does not make them impossible — two requests 300ms apart still overlap if the first takes 400ms. Debounce for load, and use the cleanup for correctness. They are not alternatives.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the race condition in fetching from an effect?",
      answer:
        "Fast input starts several requests before the first has resolved, and responses do not come back in request order. The last one to arrive wins, so a slow early query overwrites a fast later one and the user sees results for something they have stopped typing. There is no error and nothing in the console, because each state update was individually legitimate.",
    },
    {
      question: "How do you fix it?",
      answer:
        "A local flag in the effect, set by the cleanup. `let ignore = false` at the top, `return () => { ignore = true }` at the bottom, and `if (!ignore)` before the state update. Each run of the effect gets its own flag, and React runs the previous cleanup before the next effect — so a superseded request has its flag set at exactly the moment it stops being current. A ref would not work, because one box shared across renders would suppress the current request too.",
    },
    {
      question: "When would you use AbortController instead?",
      answer:
        "When you want the request stopped rather than its answer ignored — an expensive endpoint, a large payload, a metered connection, or a page that would otherwise hold open connections against the browser's per-host limit. Create the controller in the effect, pass `signal` to `fetch`, and `abort()` in the cleanup. The one thing people miss is that the promise then rejects with an `AbortError`, which must be filtered out or every cancelled request paints an error message.",
    },
    {
      question: "Why does this never show up in development?",
      answer:
        "Localhost answers in about a millisecond and in order, so requests never overlap. Production has variable latency, cold and warm caches, and mobile connections, so overlap is normal. You find this by knowing it exists, or from a bug report that says the results are sometimes for the previous query.",
    },
  ],
  takeaways: [
    "Response order is not request order, and nothing makes it so",
    "The last response to arrive wins, so a slow early request overwrites a fast later one",
    "There is no error — every state update involved was individually legitimate",
    "Fix: a local `let ignore = false`, set true by the cleanup, checked before the update",
    "A local variable works because each effect run gets its own; a ref would suppress the current request too",
    "`AbortController` stops the request rather than ignoring the answer — and rejects with `AbortError`, which must be filtered",
    "The same cleanup covers unmounting mid-request",
    "Debouncing makes it rarer; only the cleanup makes it correct",
  ],
  status: "available",
};
