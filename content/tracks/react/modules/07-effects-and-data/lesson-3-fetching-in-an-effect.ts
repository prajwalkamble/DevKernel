import type { Lesson } from "@/content/types";

export const fetchingInAnEffectLesson: Lesson = {
  id: "react-fetching-in-an-effect",
  slug: "fetching-in-an-effect",
  moduleSlug: "effects-and-data",
  title: "Fetching Data in an Effect",
  summary:
    "The whole shape, written out and run: three pieces of state, the two branches most people forget, and why the version that looks finished is not.",
  estimatedMinutes: 30,
  objectives: [
    "Write a fetch effect with loading, error and success handled",
    "Say why the request goes in an effect rather than in the component body",
    "Handle a failed response, which fetch does not treat as an error",
    "Refetch correctly when the argument changes",
    "List what this version still gets wrong",
  ],
  sections: [
    {
      id: "why-an-effect",
      heading: "Why this is an effect at all",
      body: [
        "A network request is an external system by the test from the last lesson: it outlives the render that started it. So it goes in an effect, and the component body stays pure.",
        "It matters that the body stays pure, because the body runs at times you do not control. React may render a component and throw the result away. Strict Mode renders twice. A fetch in the body would fire on every one of those.",
        "There is one more reason, and it is the honest one: **React has no data-fetching API for client components.** `useEffect` is the primitive you are left with, and everything in this module is about the gap between that primitive and what an application actually needs. Lesson 8 is about who fills it.",
      ],
    },
    {
      id: "the-shape",
      heading: "The shape, run end to end",
      body: [
        "Three pieces of state — status, data and error — one effect, and both branches of the promise handled.",
      ],
      examples: [
        {
          id: "fetch-shape",
          title: "Loading, then either data or an error",
          lang: "tsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

type Status = "loading" | "ready" | "error";

function loadUser(id: string): Promise<{ name: string }> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (id === "missing" ? reject(new Error("404")) : resolve({ name: "Ada" })), 10),
  );
}

function Profile({ id }: { id: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    loadUser(id).then(
      (data) => { if (!ignore) { setUser(data); setStatus("ready"); } },
      (err) => { if (!ignore) { setError(err); setStatus("error"); } },
    );
    return () => { ignore = true; };
  }, [id]);

  console.log("  render status =", status);
  if (status === "loading") return <p>Loading…</p>;
  if (status === "error") return <p role="alert">Could not load: {error!.message}</p>;
  return <h1>{user!.name}</h1>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drive(id: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  console.log(\`id=\${JSON.stringify(id)}:\`);
  await act(async () => { root.render(<Profile id={id} />); });
  await act(async () => { await sleep(50); });
  console.log("  DOM:", container.innerHTML);
}

await drive("ada");
await drive("missing");`,
          output: `id="ada":
  render status = loading
  render status = ready
  DOM: <h1>Ada</h1>
id="missing":
  render status = loading
  render status = error
  DOM: <p role="alert">Could not load: 404</p>`,
          explanation:
            "Two renders per load, and that is the minimum: one to show the loading state, one to show the result. Both paths end in a rendered state the user can act on — note the `role=\"alert\"`, which is what makes the failure reach a screen reader rather than only the sighted user.",
        },
      ],
      pitfalls: [
        {
          title: "`setStatus(\"loading\")` inside the effect, not just in the initial state",
          body: "The initial `useState(\"loading\")` covers the first load only. When `id` changes, the component is already `ready` with the previous user's data — without that line you show Ada's profile under Grace's id until the new request lands. It is the same stale-frame problem as lesson 1, and one line fixes it.",
        },
        {
          title: "`.then(onOk, onErr)` rather than `.then(...).catch(...)`",
          body: "With `.catch()` on the end, an exception thrown *inside* your success handler — a typo in `setUser`, a render error — is swallowed by the catch and reported to the user as a failed request. The two-argument form only handles a rejected promise, which is the thing you meant.",
        },
      ],
    },
    {
      id: "fetch-quirks",
      heading: "Two things about fetch that catch everyone",
      body: [
        "**A 404 is not a rejection.** `fetch` resolves for any response the server sends, including 404 and 500. It rejects only when the request could not be made at all — network down, DNS failure, CORS. So the error branch above never runs for a server error unless you check the status yourself.",
        "**`response.json()` can reject on its own.** An error page that returns HTML with a 500 gives you a resolved response and a rejected `json()`, with a parse error that has nothing to do with the real failure.",
        "Both are handled by the same three lines, and every codebase ends up writing them once in a wrapper.",
      ],
      examples: [
        {
          id: "fetch-ok",
          title: "The wrapper worth writing once",
          lang: "typescript",
          code: `export async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });

  // fetch resolves for 404 and 500. Only a failure to *make* the request
  // rejects, so the status check has to be explicit.
  if (!response.ok) {
    throw new Error(\`\${response.status} \${response.statusText}\`);
  }

  // A 204, or an error page that forgot its content type, has no JSON body.
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}`,
          explanation:
            "Notice the `signal` parameter threaded through — that is what makes the request cancellable from the effect's cleanup, which the next lesson uses. Passing `undefined` is fine and means \"not cancellable\", so callers that do not care are unaffected.",
        },
      ],
    },
    {
      id: "refetch",
      heading: "Refetching when the argument changes",
      body: [
        "The dependency array does this for you, and it is the reason this shape is worth learning even though you will eventually use a library.",
        "`[id]` means: this synchronisation is valid for this `id`. Change the `id`, and React tears down the old synchronisation — running your cleanup — and starts a new one. You never write \"if the id changed, refetch\"; you state what the effect depends on, and refetching is what that means.",
        "The two rules that keep this working are the ones from module 5, and they bite harder here.",
        "**Every value the effect reads goes in the array.** Including the ones you are sure never change. \"Sure\" is how a component ends up fetching for the wrong user after a prop you forgot about updates.",
        "**Nothing unstable goes in the array.** An object or array built during render is a new value every render, so an effect depending on it refetches on every render — which is an infinite loop as soon as the effect sets state. The next lesson's race condition and this loop are the two failure modes of fetching in an effect, and they have different fixes.",
      ],
      examples: [
        {
          id: "unstable-dep",
          title: "The infinite loop, and the two fixes",
          lang: "tsx",
          code: `// Broken: \`params\` is a new object on every render, so the effect runs on
// every render, so it sets state, so the component renders again.
function Broken({ userId }: { userId: string }) {
  const params = { userId, include: "orders" };
  useEffect(() => {
    getJSON(\`/api/user?\${new URLSearchParams(params)}\`).then(setData);
  }, [params]);          // <- new object every time
}

// Fix 1, and the one to reach for first: depend on the primitives.
// Two strings are the same two strings every render.
function Fixed({ userId }: { userId: string }) {
  useEffect(() => {
    const params = { userId, include: "orders" };   // built inside the effect
    getJSON(\`/api/user?\${new URLSearchParams(params)}\`).then(setData);
  }, [userId]);
}

// Fix 2, when the object genuinely has to exist outside the effect:
// give it a stable identity.
function AlsoFixed({ userId }: { userId: string }) {
  const params = useMemo(() => ({ userId, include: "orders" }), [userId]);
  useEffect(() => {
    getJSON(\`/api/user?\${new URLSearchParams(params)}\`).then(setData);
  }, [params]);
}`,
          explanation:
            "Fix 1 is better whenever it is available, because it removes the problem rather than managing it: the effect owns the object, so nothing outside can change its identity. Reach for `useMemo` only when the object is also used by something else in the component.",
        },
      ],
      pitfalls: [
        {
          title: "Removing a dependency to stop the loop is not a fix",
          body: "Deleting `params` from the array stops the loop and introduces a stale one: the effect keeps whichever `params` the first render had, forever. The loop is loud and the staleness is silent, so you have traded a bug you can see for one you cannot. Fix the identity instead.",
        },
      ],
    },
    {
      id: "still-wrong",
      heading: "What this still gets wrong",
      body: [
        "The version above handles loading, errors, both fetch quirks and refetching, and it is the version most codebases ship. It is still wrong in five ways, and the rest of this module is those five.",
        "**It races.** Two requests in flight, and the response order is not the request order. The next lesson.",
        "**It never cancels.** A component that unmounts mid-request leaves the request running and the response ignored — at best wasted bandwidth, at worst a state update on a component that is gone.",
        "**It refetches everything, always.** Two components wanting the same user make two requests. Navigating away and back makes two more. Nothing is cached, because nothing is holding the result.",
        "**It cannot be retried, revalidated or invalidated.** There is no handle on the request after it has been made.",
        "**It waterfalls.** A child that fetches based on its parent's data cannot start until the parent's request has finished and rendered, so two 200ms requests take 400ms.",
        "Every one of those is solvable in your own code, and every one of them is why the libraries exist.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through fetching data in a React component.",
      answer:
        "State for status, data and error; an effect keyed on the request's inputs; both branches of the promise handled, with an `ignore` flag in the cleanup so a superseded response cannot write. `setStatus(\"loading\")` goes inside the effect rather than only in the initial state, or a changed id shows the previous record's data until the new request lands. And the status check is explicit, because `fetch` resolves for 404 and 500 — it only rejects when the request could not be made at all.",
    },
    {
      question: "Why does fetching go in an effect rather than in the component body?",
      answer:
        "Because the body must be pure. React may render a component and discard the result, render it twice in Strict Mode, or restart a render that was interrupted — a request in the body fires on every one of those. A request outlives the render that started it, which is the definition of an external system, and external systems belong in effects with a cleanup.",
    },
    {
      question: "An effect that fetches is running on every render. What happened?",
      answer:
        "A dependency with a new identity each render — almost always an object, array or function literal built in the component body. The effect runs, sets state, renders, rebuilds the dependency, runs again. The fix is to depend on primitives and build the object inside the effect, or `useMemo` the object if something else needs it too. Deleting the dependency stops the loop by freezing the effect on the first render's value, which trades a visible bug for a silent one.",
    },
  ],
  takeaways: [
    "A request outlives its render, so it is an external system and belongs in an effect",
    "Three states — status, data, error — and both branches of the promise handled",
    "`setStatus(\"loading\")` inside the effect, or a changed id shows the previous record's data",
    "`fetch` resolves for 404 and 500; only a failure to make the request rejects",
    "The dependency array is the refetch mechanism — you never write \"if it changed, refetch\"",
    "An unstable dependency is an infinite loop; depend on primitives and build the object inside the effect",
    "This shape still races, never cancels, never caches, cannot be retried, and waterfalls",
  ],
  status: "available",
};
