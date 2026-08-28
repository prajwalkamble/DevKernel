import type { Lesson } from "@/content/types";

export const theUseHookLesson: Lesson = {
  id: "react-the-use-hook",
  slug: "the-use-hook",
  moduleSlug: "concurrent-react",
  title: "The use Hook",
  summary:
    "Reading a promise or a context during render, with none of the rules of hooks. Why it can be called conditionally, what it does with a rejection, and the caching problem that makes `use(fetch(url))` a bug React will warn you about.",
  estimatedMinutes: 28,
  objectives: [
    "Read a promise with use and pair it with a boundary",
    "Say why use is exempt from the rules of hooks",
    "Explain who must own the promise, and why",
    "Handle a rejected promise",
    "Choose between use(Context) and useContext",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "One function, two jobs",
      visual: {
        id: "use-suspense-visual",
        kind: "react-concurrent",
        algorithm: "suspense-boundary",
        title: "What throwing a promise reaches",
      },
      body: [
        "`use(promise)` reads a promise's value. If it is not settled, the component suspends — that is where the throw in lesson 2 comes from. If it rejected, the error is thrown to the nearest error boundary.",
        "`use(Context)` reads a context, the same value `useContext` would give you.",
        "The two look unrelated and are not: both are *reading a resource during render*, and the design bet is that other resource types will follow. What makes it worth a lesson is the second half of the API — the rules it does not have.",
      ],
    },
    {
      id: "not-a-hook",
      heading: "It is not a hook, whatever it is called",
      body: [
        "Every other hook must be called unconditionally, in the same order, at the top level of a component. `use` may be called **inside an `if`, inside a loop, and after an early return.**",
        "The reason is module 5's: hooks are stored in a per-component array and matched up by call order, so a skipped call shifts every later one. `use` stores nothing — it reads a value that lives somewhere else — so there is no slot to keep aligned.",
        "It still may not be called from an event handler, a `setTimeout`, or anywhere outside rendering, because suspending only means something during a render.",
      ],
      examples: [
        {
          id: "conditional-use",
          title: "A call no other hook could make",
          lang: "tsx",
          code: `import { createContext, use, Suspense, act } from "react";
import { createRoot } from "react-dom/client";

const Theme = createContext("light");

/* A hook could not be called here: it is after a return, and inside an if. */
function Label({ loud, from }: { loud: boolean; from?: Promise<string> }) {
  if (!loud) return <span>quiet</span>;
  const theme = use(Theme);
  const text = from ? use(from) : "no data";
  return <span>{theme}: {text}</span>;
}

const ready = Promise.resolve("hello");

function App() {
  return (
    <Theme.Provider value="dark">
      <Suspense fallback={<i>…</i>}>
        <Label loud={false} />
        <Label loud={true} />
        <Label loud={true} from={ready} />
      </Suspense>
    </Theme.Provider>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
console.log(container.innerHTML);`,
          output: `<span>quiet</span><span>dark: no data</span><span>dark: hello</span>`,
          explanation:
            "Three instances of one component, calling `use` a different number of times each. With `useContext` this would be a violation of the rules of hooks and, in the third instance, a genuine bug. Here it is just control flow.",
        },
      ],
      pitfalls: [
        {
          title: "This is what makes `use(Context)` worth reaching for",
          body: "A component that only needs a context in one branch can read it in that branch, rather than reading it unconditionally at the top and ignoring it. Small, but it removes a whole category of \"why is this subscribed to a context it does not use\" re-render. Otherwise `useContext` and `use(Context)` are the same thing, and existing code has no reason to change.",
        },
      ],
    },
    {
      id: "who-owns-the-promise",
      heading: "Who owns the promise",
      body: [
        "This is the part that catches everyone, and it follows from something already established: a suspended component is **re-rendered from scratch** when it retries. Its local state is gone, its `useMemo`s are gone, and every line of its body runs again.",
        "So a promise created *in* the component is a different promise on every attempt. React suspends on the first one, retries, gets a second one that is also unsettled, suspends again — and the component is stuck in a loop that only ends because each promise does eventually resolve.",
        "React 19 detects this and warns. It does not throw, because it cannot know that you did not mean it, but the warning is unambiguous.",
      ],
      examples: [
        {
          id: "uncached",
          title: "A new promise every render",
          lang: "tsx",
          code: `import { Suspense, use, act } from "react";
import { createRoot } from "react-dom/client";

const handedToUse = new Set<Promise<string>>();

/* A new promise on every render — the mistake everyone makes once. */
function Bad() {
  const promise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 1));
  handedToUse.add(promise);
  return <b>{use(promise)}</b>;
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => {
  createRoot(container).render(<Suspense fallback={<i>…</i>}><Bad /></Suspense>);
});
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
console.log(\`use() was handed \${handedToUse.size > 1 ? "a different promise each render" : "one promise"}\`);
console.log(\`the screen says: \${container.innerHTML}\`);`,
          output: `use() was handed a different promise each render
the screen says: <b>done</b>
A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework.`,
          explanation:
            "React's warning goes to standard error, so where it lands relative to the other two lines depends on how your terminal interleaves the two streams. Note that the component *worked* — the screen says `done`. That is what makes this bug survive review: with a real `fetch` it works too, having issued several requests, and it shows up only as an unexplained load on the network tab. The warning is the one signal you get.",
        },
      ],
      pitfalls: [
        {
          title: "So the promise must come from outside the render",
          body: "A framework loader, a cache keyed by the request (TanStack Query, SWR, RSC's own `cache`), or a Server Component that creates the promise and passes it down as a prop. The rule is that the same input has to give back the *same promise object*, which is exactly what a cache is.",
        },
        {
          title: "`useMemo` is not a cache",
          body: "`useMemo(() => fetch(url), [url])` looks like it fixes this and does not. React is free to discard a memo, and the suspended component is re-rendered from scratch anyway, so the memo is not there on the retry. Caches for this have to live outside the component tree.",
        },
      ],
    },
    {
      id: "rejection",
      heading: "When it rejects",
      body: [
        "A rejected promise makes `use` **throw the rejection reason**, which goes to the nearest error boundary — not to the Suspense boundary. This is lesson 5's pairing, and it is why the error boundary has to be the outer one.",
        "There is a second, quieter requirement: the promise must have a rejection handler attached before React reads it, or the runtime reports an unhandled rejection independently of React. A cache built for this attaches one when it stores the promise. This is another thing you get from a library and would have to remember to do by hand.",
      ],
      examples: [
        {
          id: "server-component",
          title: "Where use actually earns its place",
          lang: "tsx",
          code: `/* ---- app/post/[id]/page.tsx — a Server Component ------------------- */
/* It can simply await. No use, no Suspense gymnastics. */
async function Post({ id }: { id: string }) {
  const post = await db.posts.find(id);
  /* The promise is started here and never awaited, so the query runs while
     this component renders instead of after it. */
  const comments = db.comments.forPost(id);

  return (
    <article>
      <h1>{post.title}</h1>
      <Suspense fallback={<CommentsSkeleton />}>
        {/* A promise crossing into a Client Component, read with use. */}
        <Comments from={comments} />
      </Suspense>
    </article>
  );
}

/* ---- app/post/[id]/comments.tsx ------------------------------------- */
"use client";

function Comments({ from }: { from: Promise<Comment[]> }) {
  const comments = use(from);
  return <ul>{comments.map((c) => <li key={c.id}>{c.body}</li>)}</ul>;
}`,
          explanation:
            "This is the shape `use` was designed for. The server starts both queries at once, awaits the one it needs to render, and hands the slow one over the boundary as a promise. Nothing is waterfalled, the client component has no fetching code in it at all, and the promise is owned by something outside the render — the server.",
        },
      ],
    },
    {
      id: "in-practice",
      heading: "What this means for a client-only app",
      body: [
        "Honestly: **not much yet.** In a client-only React app, `use` needs a promise cache to be correct, and once you have installed a data library you are using its hook and not `use` directly.",
        "Where it does show up is in the code that library is made of, and in framework code — a route loader handing a promise to a component, a Server Component passing one across the boundary.",
        "So the useful things to take away are the mechanism and the boundary. `use` is how a render reads a value that is not there yet; the cache is somebody else's job; and if you find yourself constructing a promise inside a component to feed it, you are building the library rather than using one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the use hook do?",
      answer:
        "It reads a resource during render. Given a promise, it returns the resolved value, suspends if the promise is pending, and throws the rejection reason to the nearest error boundary if it rejected. Given a context, it returns the context value. Both cases are the same idea — reading something that lives outside the component — which is why one function covers them.",
    },
    {
      question: "Why can use be called conditionally when no other hook can?",
      answer:
        "Because it stores nothing. The rules of hooks exist because hook state is kept in a per-component list matched up by call order, so skipping a call shifts every later one onto the wrong slot. `use` allocates no slot — it reads a value that lives elsewhere — so there is no ordering to preserve. It still has to be called during rendering, since suspending is only meaningful there.",
    },
    {
      question: "Why is use(fetch(url)) wrong?",
      answer:
        "Because a suspended component re-renders from scratch when it retries, so that line creates a new promise on every attempt: React suspends on one promise, retries, gets a different unsettled one, and issues another request. React 19 warns about an uncached promise. The promise has to come from somewhere stable outside the render — a framework loader, a cache keyed by the request, or a Server Component passing it down — and `useMemo` does not count, because a memo does not survive the retry either.",
    },
    {
      question: "Should you replace useContext with use(Context)?",
      answer:
        "There is no need. They return the same value, and `use` only adds the ability to read a context conditionally — genuinely useful for a component that needs it in one branch, and irrelevant otherwise. Existing `useContext` calls have no reason to change.",
    },
  ],
  takeaways: [
    "`use(promise)` returns the value, suspends while pending, and throws a rejection to the error boundary",
    "`use(Context)` is `useContext` without the rules of hooks",
    "It may be called conditionally because it stores nothing in the hook list",
    "It must still be called during a render, never in a handler or a timeout",
    "A suspended component re-renders from scratch, so a promise made in the render is a new one each retry",
    "React 19 warns about an uncached promise — and the screen still works, which is what hides the bug",
    "`useMemo` cannot fix it; the cache has to live outside the tree",
    "The natural shape is a Server Component starting the promise and a Client Component reading it",
  ],
  status: "available",
};
