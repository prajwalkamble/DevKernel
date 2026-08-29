import type { Lesson } from "@/content/types";

export const suspenseLesson: Lesson = {
  id: "react-suspense",
  slug: "suspense",
  moduleSlug: "concurrent-react",
  title: "Suspense: A Boundary, Not a Flag",
  summary:
    "Declaring where a loading state is allowed to appear rather than writing one in every component. What suspending really is, why boundary placement is a design decision, and the React 19 behaviour that keeps the old screen on the page instead of replacing it with a spinner.",
  estimatedMinutes: 34,
  objectives: [
    "Say what it means for a component to suspend",
    "Place boundaries by asking what may disappear at once",
    "Show the difference one boundary against two makes",
    "Keep the previous screen visible during a navigation",
    "Name what Suspense does not do",
  ],
  sections: [
    {
      id: "the-flag",
      heading: "The thing it replaces",
      body: [
        "Every React codebase has written the component below. State for the data, state for whether it is loading, state for the error, three branches at the top of the render — and the same fifteen lines again in the next component along. The loading state lives inside the component that needs the data, so every component that needs data has its own copy of it.",
        "That is not just repetitive, it is **structurally wrong for the screen**. Three components with three `isLoading` flags produce three independent spinners that pop in and out at three different moments, and there is no place in the code where anybody decided that should happen. The layout of the loading experience is an emergent property of where the fetches happen to live.",
        "Suspense inverts it. The component says only *what it needs*; a **boundary** somewhere above it says *what to show while anything below is not ready*. Loading state becomes a property of a region of the screen, which is what it was all along.",
      ],
      examples: [
        {
          id: "the-flag-version",
          title: "The version this replaces",
          lang: "jsx",
          code: `function Profile({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUser(id)
      .then((u) => { if (!cancelled) setUser(u); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <h1>{user.name}</h1>;
}`,
          explanation:
            "Nothing here is wrong. It is the correct version of module 7's four states, and it is also thirteen lines of ceremony around one line of interest — plus a non-null assertion, because the types cannot express that `user` is set exactly when `loading` is false.",
          alternates: [
            {
              lang: "tsx",
              code: `function Profile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUser(id)
      .then((u) => { if (!cancelled) setUser(u); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <h1>{user!.name}</h1>;
}`,
            },
          ],
        },
      ],
    },
    {
      id: "suspending",
      heading: "What suspending is",
      body: [
        "A component suspends by **throwing a promise**. That is the mechanism, literally: the render of that subtree is unwound by a throw, the way an exception unwinds a call stack, and React catches it at the nearest Suspense boundary above.",
        "You almost never write the throw. `use(promise)` does it, and so does every data library that supports Suspense. But knowing that it *is* a throw explains three things at once: why the boundary has to be an ancestor, why the component's local state does not survive it, and why an error boundary and a Suspense boundary are the same shape of thing.",
        "React then shows that boundary's `fallback`, keeps everything outside the boundary untouched, and retries the children when the promise settles.",
      ],
      visual: {
        id: "suspense-boundary-visual",
        kind: "react-concurrent",
        algorithm: "suspense-boundary",
        title: "Which boundary catches",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "suspense-basic",
          title: "A boundary, a promise, and two renders",
          lang: "jsx",
          code: `import { Suspense, use, act } from "react";
import { createRoot } from "react-dom/client";

let resolveIt;
const promise = new Promise((resolve) => { resolveIt = resolve; });

function Name() {
  /* No loading state, no error state, no effect. It reads the value. */
  const name = use(promise);
  return <p>{name}</p>;
}

function App() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Name />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
console.log("after mount:  ", container.innerHTML);

await act(async () => { resolveIt("Ada"); });
console.log("after resolve:", container.innerHTML);`,
          output: `after mount:   <p>Loading…</p>
after resolve: <p>Ada</p>`,
          explanation:
            "`Name` has no idea it is inside a boundary and no idea a loading state exists. It reads a value; if the value is not there yet the render is unwound and retried later. The whole of the loading behaviour is the one line of JSX in `App`.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Suspense, use, act } from "react";
import { createRoot } from "react-dom/client";

let resolveIt: (value: string) => void;
const promise = new Promise<string>((resolve) => { resolveIt = resolve; });

function Name() {
  /* No loading state, no error state, no effect. It reads the value. */
  const name = use(promise);
  return <p>{name}</p>;
}

function App() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Name />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
console.log("after mount:  ", container.innerHTML);

await act(async () => { resolveIt("Ada"); });
console.log("after resolve:", container.innerHTML);`,
            },
          ],
        },
      ],
    },
    {
      id: "granularity",
      heading: "Boundaries are a design decision",
      body: [
        "Once loading is a property of a region, **where you draw the region** becomes the interesting question — and it is a question about the interface, not about the code.",
        "One boundary around the whole page means the page appears all at once. Nothing pops in, and nothing appears until the slowest query is finished. A boundary per section means each section appears when it is ready, which is faster to something readable and busier to look at.",
        "Neither is correct in general. What is *not* a design decision is the version where three unrelated spinners appear because three components happen to fetch — and that is what you get by default without boundaries.",
      ],
      examples: [
        {
          id: "one-against-two",
          title: "The same two components, one boundary and then two",
          lang: "jsx",
          code: `import { Suspense, use, act } from "react";
import { createRoot } from "react-dom/client";

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

function Text({ from }) {
  return <b>{use(from)}</b>;
}

/** Both layouts get their own promises, so neither is helped by the other. */
async function run(
  label,
  layout
) {
  const post = deferred();
  const comments = deferred();
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(layout(post.promise, comments.promise)); });
  console.log(\`\${label} nothing yet:  \${container.innerHTML}\`);
  await act(async () => { post.resolve("A post"); });
  console.log(\`\${label} post arrived: \${container.innerHTML}\`);
  await act(async () => { comments.resolve("2 comments"); });
  console.log(\`\${label} both arrived: \${container.innerHTML}\`);
}

await run("one boundary  |", (post, comments) => (
  <Suspense fallback={<i>loading…</i>}>
    <Text from={post} />
    <Text from={comments} />
  </Suspense>
));

await run("two boundaries|", (post, comments) => (
  <>
    <Suspense fallback={<i>loading post…</i>}><Text from={post} /></Suspense>
    <Suspense fallback={<i>loading comments…</i>}><Text from={comments} /></Suspense>
  </>
));`,
          output: `one boundary  | nothing yet:  <i>loading…</i>
one boundary  | post arrived: <i>loading…</i>
one boundary  | both arrived: <b>A post</b><b>2 comments</b>
two boundaries| nothing yet:  <i>loading post…</i><i>loading comments…</i>
two boundaries| post arrived: <b>A post</b><i>loading comments…</i>
two boundaries| both arrived: <b>A post</b><b>2 comments</b>`,
          explanation:
            "Look at the middle line of each pair. With one boundary the arrival of the post changes nothing on screen — it is held back until its neighbour is ready. With two, it appears the moment it lands. Identical components, identical data, identical timing; the only difference is where the boundary was drawn.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Suspense, use, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

function deferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((r) => { resolve = r; });
  return { promise, resolve };
}

function Text({ from }: { from: Promise<string> }) {
  return <b>{use(from)}</b>;
}

/** Both layouts get their own promises, so neither is helped by the other. */
async function run(
  label: string,
  layout: (post: Promise<string>, comments: Promise<string>) => ReactNode
) {
  const post = deferred();
  const comments = deferred();
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(layout(post.promise, comments.promise)); });
  console.log(\`\${label} nothing yet:  \${container.innerHTML}\`);
  await act(async () => { post.resolve("A post"); });
  console.log(\`\${label} post arrived: \${container.innerHTML}\`);
  await act(async () => { comments.resolve("2 comments"); });
  console.log(\`\${label} both arrived: \${container.innerHTML}\`);
}

await run("one boundary  |", (post, comments) => (
  <Suspense fallback={<i>loading…</i>}>
    <Text from={post} />
    <Text from={comments} />
  </Suspense>
));

await run("two boundaries|", (post, comments) => (
  <>
    <Suspense fallback={<i>loading post…</i>}><Text from={post} /></Suspense>
    <Suspense fallback={<i>loading comments…</i>}><Text from={comments} /></Suspense>
  </>
));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A boundary that shows a fallback loses the state below it",
          body: "The children are unmounted while the fallback is on screen, so anything they held — a scroll position, a half-typed input, an open menu — is gone when they come back. This makes an over-eager boundary genuinely destructive on an update, and it is the reason for the behaviour in the next section.",
        },
      ],
    },
    {
      id: "transitions-and-fallbacks",
      heading: "Not showing the fallback at all",
      body: [
        "There is a difference between the *first* time a boundary's content loads and every time after. On first load there is nothing to show, so a skeleton is right. On a navigation there is something to show — the page the user is currently looking at — and replacing it with a skeleton is strictly worse than leaving it there for a moment.",
        "Wrapping the update in `startTransition` tells React exactly that: this update is not urgent, so do not tear down what is on screen for it. React renders the new content in the background and keeps the old content visible until it is ready.",
        "This is the single most valuable Suspense behaviour and the one most people never turn on.",
      ],
      examples: [
        {
          id: "fallback-vs-transition",
          title: "The same navigation, twice",
          lang: "jsx",
          code: `import { Suspense, use, useState, startTransition, act } from "react";
import { createRoot } from "react-dom/client";

const cache = new Map();
function load(id) {
  if (!cache.has(id)) {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    cache.set(id, { promise, resolve });
  }
  return cache.get(id);
}

function Page({ id }) {
  return <b>{use(load(id).promise)}</b>;
}

let go;

function App() {
  const [id, setId] = useState("a");
  go = (next, transition) =>
    transition ? startTransition(() => setId(next)) : setId(next);
  return (
    <Suspense fallback={<i>loading…</i>}>
      <Page id={id} />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
await act(async () => { load("a").resolve("page A"); });
console.log("mounted:                    ", container.innerHTML);

await act(async () => { go("b", false); });
console.log("plain setState to b:        ", container.innerHTML);
await act(async () => { load("b").resolve("page B"); });
console.log("  once b arrives:           ", container.innerHTML);

await act(async () => { go("c", true); });
console.log("startTransition to c:       ", container.innerHTML);
await act(async () => { load("c").resolve("page C"); });
console.log("  once c arrives:           ", container.innerHTML);`,
          output: `mounted:                     <b>page A</b>
plain setState to b:         <b style="display: none;">page A</b><i>loading…</i>
  once b arrives:            <b style="">page B</b>
startTransition to c:        <b style="">page B</b>
  once c arrives:            <b style="">page C</b>`,
          explanation:
            "The plain `setState` hides the old page — you can see React's own `display: none` on it — and puts the fallback on screen. The `startTransition` version leaves page B up, renders page C in the background, and swaps only when it is ready. Same components, same promise, one word of difference.",
          alternates: [
            {
              lang: "tsx",
              code: `import { Suspense, use, useState, startTransition, act } from "react";
import { createRoot } from "react-dom/client";

const cache = new Map<string, { promise: Promise<string>; resolve: (v: string) => void }>();
function load(id: string) {
  if (!cache.has(id)) {
    let resolve!: (v: string) => void;
    const promise = new Promise<string>((r) => { resolve = r; });
    cache.set(id, { promise, resolve });
  }
  return cache.get(id)!;
}

function Page({ id }: { id: string }) {
  return <b>{use(load(id).promise)}</b>;
}

let go: (id: string, transition: boolean) => void;

function App() {
  const [id, setId] = useState("a");
  go = (next, transition) =>
    transition ? startTransition(() => setId(next)) : setId(next);
  return (
    <Suspense fallback={<i>loading…</i>}>
      <Page id={id} />
    </Suspense>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
await act(async () => { load("a").resolve("page A"); });
console.log("mounted:                    ", container.innerHTML);

await act(async () => { go("b", false); });
console.log("plain setState to b:        ", container.innerHTML);
await act(async () => { load("b").resolve("page B"); });
console.log("  once b arrives:           ", container.innerHTML);

await act(async () => { go("c", true); });
console.log("startTransition to c:       ", container.innerHTML);
await act(async () => { load("c").resolve("page C"); });
console.log("  once c arrives:           ", container.innerHTML);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Without a pending indicator, a transition can look broken",
          body: "Keeping the old screen means that for a moment the click appears to have done nothing. Pair it with `isPending` from `useTransition` — a dimmed panel or a thin progress bar — which is the subject of the next lesson.",
        },
      ],
    },
    {
      id: "limits",
      heading: "What Suspense is not",
      body: [
        "**It is not a data-fetching library.** It has no cache, no deduplication, no revalidation and no request. Something else has to produce the promise and hold onto it — a framework's loader, TanStack Query, or your own cache. `use(fetch(url))` inside a component is a bug, and lesson 7 shows what React does about it.",
        "**It does not catch errors.** A rejected promise is an error, and it goes to the nearest *error* boundary. In practice a Suspense boundary and an error boundary are placed as a pair.",
        "**It is not for code splitting only.** `React.lazy` was Suspense's first supported use and, for years, its only one — which is why a lot of people still think that is what it is for.",
        "**It does not work with an effect-based fetch.** A component that fetches in `useEffect` never suspends; it renders, commits, and updates later. Suspense sees nothing to wait for. This is the single most common disappointment, and the answer is that the fetch has to happen where the render can read its promise.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does it mean for a component to suspend?",
      answer:
        "It throws a promise during render. The throw unwinds that subtree's render the way an exception unwinds a call stack, and React catches it at the nearest Suspense boundary above, shows that boundary's fallback, and retries the children when the promise settles. You rarely write the throw yourself — `use` does it, as does any Suspense-aware data library — but knowing it is a throw explains why the boundary must be an ancestor and why the suspended subtree's state does not survive.",
    },
    {
      question: "How do you decide where to put a Suspense boundary?",
      answer:
        "By asking what part of the screen is allowed to be replaced by a placeholder at once. One boundary high up means the page arrives all together and waits for the slowest query; a boundary per region means each region appears when it is ready. It is an interface decision rather than a code one — and the thing to avoid is the default, where several independent components each pop their own spinner because that is where the fetches happened to be written.",
    },
    {
      question: "Why does a navigation sometimes show the fallback and sometimes not?",
      answer:
        "Because of whether the update was marked as a transition. A plain `setState` that causes a suspend hides the current content and shows the fallback. The same update inside `startTransition` keeps the existing screen on the page, renders the new content in the background, and swaps when it is ready — which is almost always what you want on a navigation, since the fallback is a downgrade from real content the user is already reading.",
    },
    {
      question: "Can you use Suspense with a fetch in useEffect?",
      answer:
        "No. An effect runs after the commit, so the component has already rendered successfully and there is nothing for a boundary to catch — Suspense never sees it. Suspense requires that the render itself reads something that is not ready, which means the promise has to exist before or during render and be stable across renders. That is what a framework loader or a caching data library provides.",
    },
  ],
  takeaways: [
    "Suspending is a thrown promise; a Suspense boundary is the catch",
    "The component declares what it needs, and a boundary above declares what to show while waiting",
    "Where the boundary goes decides what part of the screen may disappear at once",
    "One boundary waits for the slowest child; separate boundaries reveal each as it arrives",
    "A displayed fallback unmounts the children and loses their state",
    "`startTransition` keeps the current screen up instead of showing the fallback on an update",
    "Suspense has no cache and issues no requests — something else must own the promise",
    "A rejected promise goes to an error boundary, so the two are placed together",
    "A `useEffect` fetch cannot suspend, because the render already succeeded",
  ],
  status: "available",
};
