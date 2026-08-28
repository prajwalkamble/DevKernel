import type { Lesson } from "@/content/types";

export const loadingAndErrorStatesLesson: Lesson = {
  id: "react-loading-error-states",
  slug: "loading-error-and-empty-states",
  moduleSlug: "effects-and-data",
  title: "Loading, Error and Empty States",
  summary:
    "Three booleans give you eight combinations and a design for three of them. Replace them with one field that cannot hold a contradiction, then handle the four states a screen actually has — including the empty one everybody forgets.",
  estimatedMinutes: 28,
  objectives: [
    "Count the states three booleans permit, and see which ones have no design",
    "Model the same information as a tagged union",
    "Distinguish empty from loading from failed, and design each",
    "Avoid the layout shift a spinner causes",
    "Make an error state that a user can act on",
  ],
  sections: [
    {
      id: "booleans",
      heading: "The three booleans, counted",
      body: [
        "`isLoading`, `isError`, `data`. It is what everyone writes first, including the first version in this module, and it looks like three independent facts.",
        "They are not independent, and the type does not know that.",
      ],
      examples: [
        {
          id: "impossible-states",
          title: "Every combination, enumerated",
          lang: "tsx",
          code: `/* The three-boolean shape almost every fetch hook starts with. */
type Flags = { isLoading: boolean; isError: boolean; data: string | null };

/* Every combination the type permits, enumerated rather than guessed at. */
const all: Flags[] = [];
for (const isLoading of [true, false]) {
  for (const isError of [true, false]) {
    for (const data of ["Ada", null] as const) all.push({ isLoading, isError, data });
  }
}

const meaning = (f: Flags): string => {
  if (f.isLoading && f.isError) return "contradiction — loading and failed at once";
  if (f.isLoading) return f.data ? "refetching, stale data on screen" : "first load";
  if (f.isError) return f.data ? "failed, but stale data on screen" : "failed";
  return f.data ? "ready" : "idle — or a load that silently returned nothing";
};

console.log(\`\${all.length} combinations of three booleans:\\n\`);
for (const f of all) {
  const tag = \`\${f.isLoading ? "loading" : "-"} \${f.isError ? "error" : "-"} \${f.data ?? "null"}\`;
  console.log(\`  \${tag.padEnd(22)} \${meaning(f)}\`);
}

/* The same information, as one field that cannot hold two things at once. */
type Status =
  | { tag: "idle" }
  | { tag: "loading"; previous: string | null }
  | { tag: "ready"; data: string }
  | { tag: "error"; error: string; previous: string | null };

const designed: Status[] = [
  { tag: "idle" },
  { tag: "loading", previous: null },
  { tag: "ready", data: "Ada" },
  { tag: "error", error: "404", previous: null },
];
console.log(\`\\n\${designed.length} states, each one deliberate, and no combination to check.\`);`,
          output: `8 combinations of three booleans:

  loading error Ada      contradiction — loading and failed at once
  loading error null     contradiction — loading and failed at once
  loading - Ada          refetching, stale data on screen
  loading - null         first load
  - error Ada            failed, but stale data on screen
  - error null           failed
  - - Ada                ready
  - - null               idle — or a load that silently returned nothing

4 states, each one deliberate, and no combination to check.`,
          explanation:
            "Two of the eight are outright contradictions the type happily allows. Three more are states a real UI does want — refetching with stale data on screen, a failed refresh that keeps showing the last good data, an initial idle — but with booleans you cannot tell \"I meant that\" from \"that is a bug\", because nothing in the shape records the intent. The union has four states because somebody chose four.",
        },
      ],
      pitfalls: [
        {
          title: "The bug the booleans produce",
          body: "`if (isLoading) return <Spinner />` before checking `isError`, plus a refetch that sets `isLoading` without clearing `isError`, gives you a spinner that never resolves — the error is set, but the loading branch returns first. The union makes it a compile error: there is no state that is both.",
        },
      ],
    },
    {
      id: "the-union",
      heading: "One field, four states",
      visual: {
        id: "boolean-states-visual",
        kind: "react-forms",
        algorithm: "boolean-states",
        title: "Eight combinations, four of them real",
      },
      body: [
        "The rewrite is mechanical: one `useState` holding a tagged object, and the render becomes a switch.",
        "The payoff is not elegance. It is that **TypeScript narrows on the tag**, so inside the `ready` branch `data` is not `null` and you stop writing `data!`. Every one of those non-null assertions was a place where the type system was telling you the shape was wrong and you told it to be quiet.",
      ],
      examples: [
        {
          id: "status-union",
          title: "The same component, as a union",
          lang: "tsx",
          code: `type Status<T> =
  | { tag: "loading" }
  | { tag: "ready"; data: T }
  | { tag: "error"; message: string };

function Profile({ id }: { id: string }) {
  const [status, setStatus] = useState<Status<User>>({ tag: "loading" });

  useEffect(() => {
    let ignore = false;
    setStatus({ tag: "loading" });
    getJSON<User>(\`/api/users/\${id}\`).then(
      (data) => { if (!ignore) setStatus({ tag: "ready", data }); },
      (error) => { if (!ignore) setStatus({ tag: "error", message: error.message }); },
    );
    return () => { ignore = true; };
  }, [id]);

  switch (status.tag) {
    case "loading":
      return <ProfileSkeleton />;
    case "error":
      // \`message\` exists here and \`data\` does not. No assertions needed.
      return <LoadFailed message={status.message} onRetry={() => setStatus({ tag: "loading" })} />;
    case "ready":
      return status.data.orders.length === 0
        ? <NoOrdersYet name={status.data.name} />
        : <Orders orders={status.data.orders} />;
  }
}`,
          explanation:
            "Note where the empty check lives: **inside** `ready`. Empty is not a fourth loading state — it is a successful load whose answer happens to be nothing, and conflating the two is what produces a screen that says \"Loading…\" forever when the real answer is \"you have no orders\".",
        },
      ],
    },
    {
      id: "four-states",
      heading: "The four states a screen has",
      body: [
        "Every screen that fetches has four, and design tends to cover one.",
        "**Loading.** Something is happening. The design question is what shape it holds — see the next section.",
        "**Error.** It failed. The design question is what the user can do about it.",
        "**Empty.** It worked and there is nothing. This is a *content* state, not an error state, and it is the one that gets skipped — leaving a blank rectangle where a real product would explain and offer the first action.",
        "**Ready.** The state everybody designs.",
        "There is a fifth worth naming in a mature app: **stale**, where you show the last good data while quietly refetching. It is what makes a fast app feel fast, and it is the main thing a data library gives you that a hand-rolled hook does not.",
      ],
      pitfalls: [
        {
          title: "Empty is the one that reaches production broken",
          body: "It cannot happen in development, because your seed data always has rows. It happens to every new user on their first day, which is the worst possible audience for a blank screen. Test it by deliberately loading an id with no children — and put an action in it, because \"no orders yet\" with a button is onboarding and \"no orders yet\" alone is a dead end.",
        },
      ],
    },
    {
      id: "loading-ui",
      heading: "The loading state, done properly",
      body: [
        "**A skeleton beats a spinner** when you know the shape of what is coming. A spinner says \"wait\"; a skeleton says \"wait, and it will look like this\" — and, more usefully, it occupies the same space, so nothing jumps when the data lands. A layout that shifts under a user's cursor as they are about to click is a real usability failure, not a polish issue.",
        "**Do not show a loading state for fast responses.** A spinner that appears and vanishes in 80ms reads as a flicker, and flicker is worse than a brief pause. Delay it by ~200ms: if the data arrives first, the user never saw a loading state at all.",
        "**Once shown, keep it shown for a minimum.** Having decided to show a spinner, showing it for 30ms is the same flicker from the other direction. A ~300ms floor is invisible when it is not needed and removes the flash when it is.",
        "**Never lose the layout.** Replacing a filled page with a centred spinner throws away the scroll position, the focus, and the user's sense of place. Keep the frame and swap the contents.",
      ],
      examples: [
        {
          id: "delayed-spinner",
          title: "A spinner that only appears when it is needed",
          lang: "tsx",
          code: `/** True once \`active\` has been true for \`delay\` ms — and then true for at
 *  least \`minimum\` ms, so it cannot flash. */
function useDelayedFlag(active: boolean, delay = 200, minimum = 300) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) return;
    // Started: wait \`delay\` before admitting anything is happening.
    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [active, delay]);

  useEffect(() => {
    if (active || !shown) return;
    // Finished, but the spinner is up: hold it for \`minimum\`.
    const id = setTimeout(() => setShown(false), minimum);
    return () => clearTimeout(id);
  }, [active, shown, minimum]);

  return shown;
}`,
          explanation:
            "Two effects rather than one, because they are two different synchronisations with two different dependency sets — the lesson-2 rule applied. Both clean their timer up, so a component that unmounts mid-delay leaves nothing behind.",
        },
      ],
    },
    {
      id: "error-ui",
      heading: "The error state, done properly",
      body: [
        "An error state has one job: tell the user what they can do next. \"Something went wrong\" fails that test.",
        "**Say what failed, in the user's terms.** \"Could not load your orders\" — not the status code, not the stack.",
        "**Offer the action.** Almost always Retry. Wire it to the state, not to `location.reload()`, which throws away everything else on the page.",
        "**Keep the error near the thing that failed.** If one panel of five could not load, that panel shows the error. Replacing the whole page because one request failed turns a small failure into a total one.",
        "**Distinguish recoverable from not.** A network blip deserves Retry. A 403 deserves \"you do not have access to this\", because retrying will never help.",
        "**Log the real error.** The user gets a sentence; your monitoring gets the status, the URL and the stack. Both, not either.",
        "One boundary this lesson does not cover: an error *thrown during render* is not caught by any of this. That is an error boundary, and it is in module 11 alongside Suspense.",
      ],
      pitfalls: [
        {
          title: "`role=\"alert\"` on the error, and nothing on the spinner",
          body: "An error that replaces content silently is invisible to a screen reader user, who is left with a page that stopped responding. `role=\"alert\"` announces it. A loading region wants `aria-busy=\"true\"` instead — announcing every spinner is noise, and `alert` interrupts whatever the user was reading.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is wrong with isLoading, isError and data as three pieces of state?",
      answer:
        "Three booleans permit eight combinations and you have designs for about three. Two are outright contradictions — loading and failed at once — and three more are states a real UI might want, such as refetching with stale data on screen, but nothing in the shape records whether you meant them. In practice it produces bugs like a spinner that never resolves, because the loading branch returns before the error is checked. A tagged union has exactly the states you defined, and TypeScript narrows on the tag so the non-null assertions disappear.",
    },
    {
      question: "What states does a screen that fetches actually have?",
      answer:
        "Loading, error, empty and ready — plus stale in a mature app, where the last good data stays on screen while a refetch runs. Empty is the one that gets skipped, because seed data always has rows; it is a successful load with nothing in it, so it belongs inside the ready branch rather than beside loading, and it should offer the first action rather than being a blank rectangle.",
    },
    {
      question: "How do you avoid a loading spinner that flashes?",
      answer:
        "Delay showing it by around 200ms, so a fast response never produces one, and once shown keep it for a minimum of around 300ms so it cannot vanish instantly. Prefer a skeleton to a spinner when you know the shape of the content, because it holds the same space and nothing jumps when the data lands — a layout that shifts under the cursor is a real usability failure, not polish.",
    },
  ],
  takeaways: [
    "Three booleans permit eight states; a tagged union permits the ones you defined",
    "TypeScript narrows on the tag, which is what removes every `data!` assertion",
    "Empty is a successful load with nothing in it — it belongs inside `ready`, not beside `loading`",
    "The empty state is the one that ships broken, because seed data always has rows",
    "Skeletons beat spinners: they hold the layout, so nothing jumps when data arrives",
    "Delay the spinner ~200ms and floor it at ~300ms to remove both kinds of flicker",
    "An error state's job is the next action — scope it to the panel that failed, not the page",
    "`role=\"alert\"` on errors, `aria-busy` on loading regions",
  ],
  status: "available",
};
