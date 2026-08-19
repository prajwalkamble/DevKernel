import type { Lesson } from "@/content/types";

export const typingStateLesson: Lesson = {
  id: "react-ts-state",
  slug: "typing-state-and-reducers",
  moduleSlug: "react",
  title: "Typing State, Effects & Reducers",
  summary:
    "Where useState infers correctly and where it traps you, why an initial value of null needs help, and how a discriminated union of actions turns a reducer into something the compiler checks end to end.",
  estimatedMinutes: 35,
  objectives: [
    "Rely on useState inference where it is correct",
    "Recognise the two cases where the initial value gives the wrong type",
    "Type state that has more than one shape with a union",
    "Type a reducer and its actions as a discriminated union",
    "Know why useEffect needs no types but does need a correct cleanup type",
  ],
  sections: [
    {
      id: "inference",
      heading: "useState infers, until it cannot",
      body: [
        "`useState(0)` gives you `number` and a setter that only accepts numbers. For most state that is the whole story, and annotating it is noise.",
        "Two cases break it, and both are common enough to be worth recognising instantly.",
        "**An initial value narrower than the eventual one.** `useState(null)` infers the type as `null` — permanently. Nothing else can ever be assigned.",
        "**An empty collection.** `useState([])` infers `never[]`, so pushing anything into it is an error.",
      ],
      examples: [
        {
          id: "state-inference",
          title: "Where it works and where it does not",
          lang: "tsx",
          code: `// Inferred correctly — leave these alone.
const [count, setCount] = useState(0);           // number
const [name, setName] = useState("");            // string
const [open, setOpen] = useState(false);         // boolean
const [user, setUser] = useState({ id: 1 });     // { id: number }

setCount("nope");

// The null trap: inferred as \`null\`, and stuck there.
const [profile, setProfile] = useState(null);
setProfile({ id: 1 });`,
          output: `a.tsx(11,10): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SetStateAction<number>'.
a.tsx(14,11): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '(prevState: null) => null'.`,
          explanation:
            "The second error is worth reading closely, because it is confusing on first sight. `SetStateAction<null>` is `null | ((prev: null) => null)`, so TypeScript tries the *updater function* overload and reports against that — which is why an error about a missing `id` mentions a function type. Once you know the shape of the message it is instantly recognisable.",
        },
        {
          id: "state-annotated",
          title: "The annotations that fix it",
          lang: "tsx",
          code: `interface Profile {
  id: number;
  name: string;
}

// Say what it will eventually hold.
const [profile, setProfile] = useState<Profile | null>(null);
const [items, setItems] = useState<string[]>([]);
const [selected, setSelected] = useState<Set<string>>(new Set());
const [byId, setById] = useState<Map<string, Profile>>(new Map());

// Using it forces a null check, which is the point.
if (profile) {
  console.log(profile.name);
}

// A union of literal states, rather than several booleans.
type Status = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<Status>("idle");

// setStatus("loadng") -> Error: not assignable to type 'Status'`,
          explanation:
            "The `Status` union deserves emphasis. Three booleans — `isLoading`, `isError`, `isSuccess` — allow eight combinations, six of which are nonsense, and every render has to guess which is authoritative. One union allows exactly four, all meaningful, and a `switch` over it can be checked for exhaustiveness.",
        },
      ],
      pitfalls: [
        {
          title: "`useState<Profile>()` with no argument gives you `Profile | undefined`",
          body: "Calling `useState` with no argument is legal and the type becomes `T | undefined`, which is usually what you wanted — but the setter then also accepts `undefined`, and the initial render has a value you may not have handled. Being explicit with `useState<Profile | null>(null)` is clearer about intent, and `null` reads as \"deliberately empty\" where `undefined` reads as \"not set yet\".",
        },
      ],
    },
    {
      id: "state-shape",
      heading: "One union beats several fields",
      body: [
        "State that models a request usually starts as four separate pieces — `data`, `loading`, `error`, `hasLoaded` — and immediately allows states that cannot happen: loading *and* an error, data *and* loading, an error *and* data.",
        "Modelling it as one discriminated union removes those, and the component's rendering becomes a `switch` the compiler can check.",
      ],
      examples: [
        {
          id: "state-union",
          title: "Impossible states, made impossible",
          lang: "tsx",
          code: `// Before: 2^3 combinations, most of them meaningless.
const [data, setData] = useState<User | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

// After: exactly four states, each carrying only what it needs.
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function UserPanel({ id }: { id: string }) {
  const [state, setState] = useState<RequestState<User>>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    loadUser(id)
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", error: toError(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  switch (state.status) {
    case "idle":
      return null;
    case "loading":
      return <Spinner />;
    case "success":
      return <Profile user={state.data} />;   // \`data\` exists only here
    case "error":
      return <ErrorBox error={state.error} />;
  }
}`,
          explanation:
            "`state.data` is reachable only in the `success` branch — there is no optional chaining anywhere, and no way to render a spinner over stale data by accident. Adding a fifth status makes the `switch` fail to compile until it is handled, which is the exhaustiveness mechanism from module 10.",
        },
      ],
    },
    {
      id: "effects",
      heading: "Effects need no types, but the return value matters",
      body: [
        "`useEffect` takes a function and a dependency array, and neither needs annotating. The one thing TypeScript does check is the **return value**, and that check catches a real bug.",
        "An effect may return nothing, or a cleanup function. It may not return anything else — and an `async` function returns a promise, which is why `useEffect(async () => {...})` is an error rather than merely bad practice.",
      ],
      examples: [
        {
          id: "effect-async",
          title: "The async effect, and the two ways round it",
          lang: "tsx",
          code: `// Error: an async function returns Promise<void>, which is not a
// valid cleanup function. TypeScript rejects it, which is doing you
// a favour — React would have called the promise as a cleanup.
useEffect(async () => {
  const data = await load();
  setData(data);
}, []);

// 1. Declare the async function inside and call it.
useEffect(() => {
  let cancelled = false;

  async function run() {
    const data = await load();
    if (!cancelled) setData(data);
  }

  run();
  return () => {
    cancelled = true;
  };
}, []);

// 2. Or keep it as a promise chain, which needs no inner function.
useEffect(() => {
  const controller = new AbortController();

  load({ signal: controller.signal })
    .then(setData)
    .catch((error: unknown) => {
      if (error instanceof Error && error.name !== "AbortError") report(error);
    });

  return () => controller.abort();
}, []);`,
          explanation:
            "The `cancelled` flag and the `AbortController` are doing the same job: stopping a response that arrives after the component has moved on. The second is better where the API supports it, because it also stops the request rather than just ignoring the answer.",
        },
      ],
      pitfalls: [
        {
          title: "A concise-body arrow can return something by accident",
          body: "`useEffect(() => setCount(0), [])` returns whatever `setCount` returns, and an arrow with a concise body returns it implicitly. React will treat that as a cleanup function. `setCount` returns `void` so it happens to be harmless, but `useEffect(() => doThing(), [])` where `doThing` returns a value is a real bug. Use a braced body in effects: `useEffect(() => { doThing(); }, [])`.",
        },
      ],
    },
    {
      id: "reducers",
      heading: "Typing a reducer",
      body: [
        "`useReducer` is where typing pays most, because a reducer has two things worth checking: that every action is handled, and that each action carries the right payload.",
        "Both come from one pattern — **actions as a discriminated union on `type`** — and `useReducer` infers the rest from the reducer's signature.",
      ],
      examples: [
        {
          id: "reducer-typing",
          title: "The reducer, and the two errors it prevents",
          lang: "tsx",
          code: `type State = { count: number };

type Action =
  | { type: "inc"; by: number }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { count: state.count + action.by };   // \`by\` exists here
    case "reset":
      return { count: 0 };                          // ...and not here
  }
}

function Counter() {
  // Both \`state\` and \`dispatch\` are inferred from the reducer.
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  dispatch({ type: "reset", by: 2 });
  dispatch({ type: "inc" });

  return <div>{state.count}</div>;
}`,
          output: `c.tsx(33,29): error TS2353: Object literal may only specify known properties, and 'by' does not exist in type '{ type: "reset"; }'.
c.tsx(34,12): error TS2345: Argument of type '{ type: "inc"; }' is not assignable to parameter of type 'Action'.
  Property 'by' is missing in type '{ type: "inc"; }' but required in type '{ type: "inc"; by: number; }'.`,
          explanation:
            "Two different mistakes, both caught: a payload on an action that takes none, and a missing payload on one that requires it. Note that neither `state` nor `dispatch` was annotated — `useReducer` reads both from the reducer's signature, so the union is the only thing you write down.",
        },
        {
          id: "reducer-init",
          title: "Lazy initialisation, and the exhaustiveness guard",
          lang: "tsx",
          code: `// A third argument is an init function; the second becomes its argument.
// Useful when the initial state is expensive to compute.
function init(count: number): State {
  return { count };
}

const [state, dispatch] = useReducer(reducer, 0, init);

// Add \`default\` with a never assignment if you want a runtime guard as
// well as the compile-time one — worth it when actions can arrive from
// outside your own code.
function reducerGuarded(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { count: state.count + action.by };
    case "reset":
      return { count: 0 };
    default: {
      const exhaustive: never = action;
      throw new Error(\`Unhandled action: \${JSON.stringify(exhaustive)}\`);
    }
  }
}`,
          explanation:
            "Without a `default`, an unhandled action makes the function's return type include `undefined`, which fails against the declared `State` — so the compile-time check happens either way. The explicit `never` guard adds a clear runtime failure for actions that arrive from somewhere the compiler never saw, such as a message from another window.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does `useState(null)` cause errors later?",
      answer:
        "TypeScript infers the state type from the initial value, so it becomes `null` and nothing else can be assigned. The fix is an explicit type argument — `useState<Profile | null>(null)`. The same applies to `useState([])`, which infers `never[]`. Both errors surface at the setter rather than the declaration, which is why they look confusing at first.",
    },
    {
      question: "Why prefer a status union over separate loading and error booleans?",
      answer:
        "Three booleans allow eight combinations and only a few are meaningful — loading and error simultaneously, data present while loading, and so on. A discriminated union allows exactly the valid states, carries only the data each one needs, and lets a `switch` be checked for exhaustiveness so adding a state forces every consumer to handle it.",
    },
    {
      question: "Why can't you pass an async function to useEffect?",
      answer:
        "An effect may return nothing or a cleanup function, and an async function returns a promise — so React would call the promise as a cleanup. TypeScript rejects it. Declare an async function inside the effect and call it, or use a promise chain, and return a real cleanup that cancels with a flag or an `AbortController`.",
    },
    {
      question: "How do you type useReducer?",
      answer:
        "Type the state and define actions as a discriminated union on `type`, then annotate the reducer's parameters and return. `useReducer` infers both `state` and `dispatch` from that signature, so nothing else needs annotating. The union gives you narrowing inside each case, payload checking at every dispatch, and exhaustiveness across the switch.",
    },
  ],
  takeaways: [
    "`useState` infers correctly from a representative initial value — annotate only when it is not one",
    "`useState(null)` infers `null` and `useState([])` infers `never[]`; both need an explicit type argument",
    "The `SetStateAction` error message mentions a function type because it reports against the updater overload",
    "One status union beats several booleans: fewer states, all valid, and exhaustively checkable",
    "Model a request as `idle | loading | success | error` so data is only reachable where it exists",
    "`useEffect` needs no annotations, but it does check the return type — which is why an async effect is an error",
    "Use a braced body in effects so a concise arrow cannot return a value React will treat as cleanup",
    "Actions as a discriminated union give you narrowing, payload checking and exhaustiveness from one declaration",
  ],
  status: "available",
};
