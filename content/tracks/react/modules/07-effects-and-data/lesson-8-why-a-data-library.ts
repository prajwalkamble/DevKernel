import type { Lesson } from "@/content/types";

export const whyADataLibraryLesson: Lesson = {
  id: "react-why-a-data-library",
  slug: "why-a-data-library-exists",
  moduleSlug: "effects-and-data",
  title: "Why a Data-Fetching Library Exists",
  summary:
    "Count the requests your correct hand-written hook makes for one user, then look at what it still cannot do. The gap is the whole product category — and the reason to understand the manual version first.",
  estimatedMinutes: 28,
  objectives: [
    "Demonstrate the duplicate requests a correct hook still makes",
    "List the six problems a cache solves that an effect cannot",
    "Explain deduplication, staleness and invalidation in one sentence each",
    "Choose between TanStack Query, SWR, a router loader and a framework",
    "Say when not to add one",
  ],
  sections: [
    {
      id: "count-them",
      heading: "Count the requests",
      body: [
        "Here is the hook from earlier in this module, written correctly — cleanup, ignore flag, keyed dependency. Two components on one page want the same user.",
      ],
      examples: [
        {
          id: "duplicate-requests",
          title: "One user, four requests",
          lang: "tsx",
          code: `import { useState, useEffect, act } from "react";
import { createRoot } from "react-dom/client";

let requests = 0;
function loadUser(id: string) {
  requests++;
  console.log(\`  GET /users/\${id}   (request #\${requests})\`);
  return Promise.resolve({ name: "Ada" });
}

/* The hand-rolled hook: everything module 7 has covered so far, and nothing
   more. It is correct. It is also the whole of what most codebases have. */
function useUser(id: string) {
  const [data, setData] = useState<{ name: string } | null>(null);
  useEffect(() => {
    let ignore = false;
    loadUser(id).then((user) => { if (!ignore) setData(user); });
    return () => { ignore = true; };
  }, [id]);
  return data;
}

function Avatar({ id }: { id: string }) {
  const user = useUser(id);
  return <img alt={user?.name ?? "…"} />;
}
function Greeting({ id }: { id: string }) {
  const user = useUser(id);
  return <h1>Hello, {user?.name ?? "…"}</h1>;
}
function Page() {
  return <><Avatar id="ada" /><Greeting id="ada" /></>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("two components on one page, both wanting the same user:");
await act(async () => { root.render(<Page />); });
await act(async () => { await sleep(20); });
console.log(\`  \${requests} requests for one user\`);

console.log("\\nthe page re-mounts (a route change and back):");
await act(async () => { root.unmount(); });
const second = createRoot(container);
await act(async () => { second.render(<Page />); });
await act(async () => { await sleep(20); });
console.log(\`  \${requests} requests in total, and nothing was reused\`);`,
          output: `two components on one page, both wanting the same user:
  GET /users/ada   (request #1)
  GET /users/ada   (request #2)
  2 requests for one user

the page re-mounts (a route change and back):
  GET /users/ada   (request #3)
  GET /users/ada   (request #4)
  4 requests in total, and nothing was reused`,
          explanation:
            "Nothing here is a bug. Each hook is independently correct, and that is the point: **the hook has nowhere to keep anything.** Its state is inside a component, so it is born when the component mounts and dies when it unmounts, and two components have two of them. The information that this user was fetched four seconds ago does not exist anywhere.",
        },
      ],
      pitfalls: [
        {
          title: "The usual first fix makes it worse",
          body: "The instinct is to lift the fetch to a common parent and pass the data down. That deduplicates these two, and it means the parent now re-renders on every response, prop-drills the result, and has to fetch everything any descendant might need — so a screen with five panels has one component fetching five things and re-rendering for all of them. You have traded duplicate requests for a component that knows about everything.",
        },
      ],
    },
    {
      id: "the-six",
      heading: "The six problems a cache solves",
      visual: {
        id: "query-cache-lifecycle-visual",
        kind: "react-data",
        algorithm: "cache-lifecycle",
        title: "One cache entry, from first fetch to garbage collection",
      },
      body: [
        "A data library is, underneath, **one cache outside the component tree, keyed by request**. Every feature below is a consequence of that one structural change.",
        "**Deduplication.** Two components asking for the same key at the same time make one request. The second gets the in-flight promise.",
        "**Caching across mounts.** Navigate away and back and the data is there, so the screen renders instantly with what it had — then refetches quietly if it is stale. That is the *stale* state from lesson 5, and it is most of what makes an app feel fast.",
        "**Invalidation.** After a successful mutation, you say \"anything keyed under `users` is now wrong\" and every component showing a user refetches. Without a shared cache there is no way to express that at all; the alternative is a chain of callbacks from the form to every screen that might be affected.",
        "**Retries and backoff.** A failed request retries a few times with increasing delays before it becomes an error the user sees. Written by hand this is a loop, a counter, a timer and a cleanup, per hook.",
        "**Request lifecycle around the window.** Refetch when the tab regains focus, when the network reconnects, on an interval. Each is a listener with a cleanup you would otherwise write per hook.",
        "**One place to look.** DevTools showing every key, its status, its age and its observers. Debugging a hand-rolled hook means adding logs to the hook.",
        "None of these are exotic. Every one is something an application eventually needs, and every one is impossible to do well from inside a component, because the component is the wrong lifetime.",
      ],
    },
    {
      id: "shape",
      heading: "What it looks like",
      body: [
        "The API is small, and it is the same shape you already wrote — you supply a key and a function, and get back the state.",
      ],
      examples: [
        {
          id: "library-shape",
          title: "The same screen, with a cache behind it",
          lang: "tsx",
          code: `// The key is what makes deduplication, caching and invalidation possible:
// it names the data rather than the component asking for it.
function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: ({ signal }) => getJSON<User>(\`/api/users/\${id}\`, signal),
  });
}

function Avatar({ id }: { id: string }) {
  const { data, isPending, error } = useUser(id);
  if (isPending) return <AvatarSkeleton />;
  if (error) return <BrokenAvatar />;
  return <img alt={data.name} src={data.avatarUrl} />;
}

// Called by two components on one page: one request.
// Rendered again after a route change: instant, from cache, then revalidated.

function useRenameUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (next: { id: string; name: string }) =>
      postJSON(\`/api/users/\${next.id}\`, next),
    // "Everything under users is now wrong." Every mounted component
    // showing one refetches; nothing had to be told about anything.
    onSuccess: () => client.invalidateQueries({ queryKey: ["users"] }),
  });
}`,
          explanation:
            "Note the `signal` in `queryFn`: the library hands you an `AbortSignal` and cancels superseded requests for you — the lesson-4 fix, built in. And note what is *absent*: no `useEffect`, no `useState`, no ignore flag, no dependency array. The effect did not go away; it went into the library, once, instead of into every hook you write.",
        },
      ],
    },
    {
      id: "which",
      heading: "Which one",
      body: [
        "**TanStack Query** is the default answer for a client-rendered app. Largest feature set, excellent devtools, framework-agnostic, and the mutation and invalidation story is the most complete. It is also the biggest, and its API has genuine surface area to learn.",
        "**SWR** is smaller and simpler, from the Next.js team. If you want caching, deduplication and revalidation and you do not need the mutation machinery, it is less to learn and less to ship.",
        "**Your router's loaders** — React Router, TanStack Router — fetch *before* rendering the route rather than after mounting a component. This kills the waterfall from lesson 3 outright, because the request starts when navigation starts rather than when a component renders. If you already have a router that does this, use it, and add a query library alongside for the data that is not route-shaped.",
        "**A framework: Next.js, React Router in framework mode.** Fetch on the server, in a Server Component or a loader, and the question changes shape entirely: no client-side loading state, no waterfall, no cache to keep warm, because the data arrives with the HTML. Module 12 covers what that costs and what it does not remove.",
        "There is no fifth answer where you write the cache yourself. If you find yourself building one, you are building one of the above with fewer tests.",
      ],
      pitfalls: [
        {
          title: "When not to add one",
          body: "Three cases. A small app with two or three requests that are never repeated and never invalidated — the library is more code than the problem. An app whose data is *live* rather than fetched, over a socket or a local-first sync engine, where the cache is somewhere else and a query library fights it. And a framework app where fetching already happens on the server: adding a client cache there gives you two sources of truth for the same data.",
        },
        {
          title: "It is not a state manager",
          body: "A query library caches **server state** — data owned elsewhere, that can go stale, that you re-read. Which tab is open, what is typed in a form, whether a modal is showing: that is client state, it can never be stale, and it belongs in `useState`, a reducer or a store. Module 8 is about that half. Putting client state in a query cache is the mirror image of the mistake in module 8's warning about context.",
        },
      ],
    },
    {
      id: "why-manual-first",
      heading: "Why you learned the manual version",
      body: [
        "Three reasons, and they are not sentimental.",
        "**You will read it.** Every codebase older than the library has hand-rolled fetch hooks in it, and \"replace this with `useQuery`\" is only a safe change if you can see what the original was doing.",
        "**The library's concepts are the manual version's problems, named.** `staleTime` is \"how long before I refetch\". Deduplication is \"two components asked at once\". Invalidation is \"a mutation made this wrong\". Someone who has hit each of those recognises the API instead of memorising it.",
        "**When it misbehaves, it is your effect underneath.** A query that refetches in a loop is an unstable query key — the same identity bug as an unstable dependency array. A stale result is the same closure question. The abstraction is thin, and it is thin over exactly what this module covered.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why use a data-fetching library instead of useEffect?",
      answer:
        "Because a hook's state lives inside a component, and a component is the wrong lifetime for cached data. Two components wanting the same thing make two requests; navigating away and back makes two more; nothing survives an unmount. A library moves the cache outside the tree and keys it by request, and deduplication, cross-mount caching, invalidation after a mutation, retries with backoff and refetch-on-focus all fall out of that one change. None of them are possible from inside a component.",
    },
    {
      question: "What is query invalidation and why can't you do it by hand?",
      answer:
        "Telling the cache that everything under a key is now wrong, so every mounted component observing it refetches. By hand there is no shared thing to tell — the state is inside each component — so the alternative is threading callbacks from the form that saved the change to every screen that might display it, which is unmaintainable and always misses one. Invalidation replaces that with a key.",
    },
    {
      question: "Is a query library a replacement for Redux or Zustand?",
      answer:
        "No — they hold different kinds of state. A query library caches server state: data owned elsewhere, which can go stale and gets re-read. A store holds client state: which tab is open, what is in a form, whether a modal is showing — none of which can ever be stale. In practice adding a query library removes most of what was in the store, because most of it turned out to be cached server data, and what is left is small enough that `useState` and context often cover it.",
    },
    {
      question: "When would you not add one?",
      answer:
        "When there are two or three requests that are never repeated or invalidated, so the library is more code than the problem. When the data is live over a socket or a sync engine, where a fetch cache fights the real source. And in a framework app that fetches on the server, where adding a client cache gives you two sources of truth for the same data.",
    },
  ],
  takeaways: [
    "A correct hand-written hook still makes one request per component per mount — its state has the wrong lifetime",
    "A data library is one cache outside the tree, keyed by request; every feature follows from that",
    "Deduplication, cross-mount caching, invalidation, retries, refetch-on-focus and devtools",
    "Invalidation is the one with no hand-written equivalent at all",
    "TanStack Query for most client apps; SWR when you need less; router loaders to kill the waterfall; a framework to move it to the server",
    "Query libraries cache server state — client state still belongs in state, a reducer or a store",
    "Learn the manual version first: the library's concepts are its problems, named",
  ],
  status: "available",
};
