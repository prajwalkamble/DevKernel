import type { Lesson } from "@/content/types";

export const mswLesson: Lesson = {
  id: "react-msw",
  slug: "mocking-the-network",
  moduleSlug: "testing-typescript-tooling",
  title: "Mocking the Network with MSW",
  summary:
    "Intercepting requests instead of replacing fetch. Why stubbing the client couples every test to how you happen to fetch, what a handler looks like, overriding one per test, and the one option that turns a silent gap into a failure.",
  estimatedMinutes: 27,
  objectives: [
    "Say what is wrong with mocking fetch or the API module",
    "Write handlers and start a server in tests",
    "Override a handler for one test's error case",
    "Use onUnhandledRequest to catch requests you forgot",
    "Share handlers between tests and the browser",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "What is wrong with stubbing the client",
      body: [
        "The instinct is `vi.spyOn(global, \"fetch\")`, or `vi.mock(\"./api\")`. Both work, and both couple the test to the wrong thing.",
        "**A stubbed `fetch` returns whatever you say, in whatever shape you remember.** No status code, no headers, no JSON parsing, no network error. So the test passes against a response the server would never send, and the component's `if (!response.ok)` branch is never exercised because your stub has no `ok`.",
        "**A mocked API module means the test does not run the code you are worried about.** The URL, the query string, the headers, the error mapping — all replaced. If the endpoint changes, the mock still returns the old shape and the test stays green.",
        "**And both break when the fetching changes.** Swap `fetch` for `axios`, or move to TanStack Query, and every test that stubbed the client breaks — despite the component's behaviour being identical. That is the same failure mode as testing implementation details, one layer out.",
        "MSW intercepts at the network layer instead. Your component makes a real request through whatever client it likes; MSW answers it with a real `Response`.",
      ],
    },
    {
      id: "handlers",
      heading: "Handlers and a server",
      body: [
        "A handler is a method, a path, and a function returning a response. `setupServer` collects them and installs the interception for the test run.",
      ],
      examples: [
        {
          id: "the-setup",
          title: "The component, the handlers, and two tests",
          lang: "jsx",
          code: `/* ---- UserList.tsx: ordinary fetch, no test-shaped seams ------------- */
export function UserList() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/users")
      .then((response) => {
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return response.json();
      })
      .then((data) => { if (!ignore) setUsers(data); })
      .catch((e) => { if (!ignore) setError(String(e.message)); });
    return () => { ignore = true; };
  }, []);

  if (error) return <p role="alert">Could not load users: {error}</p>;
  if (users === null) return <p role="status">Loading…</p>;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

/* ---- UserList.test.tsx ---------------------------------------------- */
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("/api/users", () =>
    HttpResponse.json([{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }])
  )
);

/* error, not warn: a request with no handler should fail the test rather
   than silently reach the real network. */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
/* Undo any per-test override, so tests cannot leak into each other. */
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders the users the API returns", async () => {
  render(<UserList />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  expect(await screen.findByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("Grace")).toBeInTheDocument();
});

test("reports a failure without touching the component", async () => {
  /* One handler, one test. resetHandlers puts the default back. */
  server.use(http.get("/api/users", () => new HttpResponse(null, { status: 500 })));
  render(<UserList />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load users: HTTP 500");
});`,
          output: ` Test Files  1 passed (1)
      Tests  2 passed (2)`,
          explanation:
            "Look at what the second test did **not** have to do. It did not mock anything, did not reach into the component, and did not know that it uses `fetch`. It said \"this endpoint returns a 500\" and asserted what the user sees. The `if (!response.ok)` branch ran for real, and so did the `HTTP 500` message built from a real status code.",
          requires: "vitest with Testing Library and MSW (this is the run's summary, not a program's output)",
          alternates: [
            {
              lang: "tsx",
              requires: "vitest with Testing Library and MSW (this is the run's summary, not a program's output)",
              code: `/* ---- UserList.tsx: ordinary fetch, no test-shaped seams ------------- */
export function UserList() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/users")
      .then((response) => {
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return response.json();
      })
      .then((data) => { if (!ignore) setUsers(data); })
      .catch((e) => { if (!ignore) setError(String(e.message)); });
    return () => { ignore = true; };
  }, []);

  if (error) return <p role="alert">Could not load users: {error}</p>;
  if (users === null) return <p role="status">Loading…</p>;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

/* ---- UserList.test.tsx ---------------------------------------------- */
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("/api/users", () =>
    HttpResponse.json([{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }])
  )
);

/* error, not warn: a request with no handler should fail the test rather
   than silently reach the real network. */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
/* Undo any per-test override, so tests cannot leak into each other. */
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders the users the API returns", async () => {
  render(<UserList />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  expect(await screen.findByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("Grace")).toBeInTheDocument();
});

test("reports a failure without touching the component", async () => {
  /* One handler, one test. resetHandlers puts the default back. */
  server.use(http.get("/api/users", () => new HttpResponse(null, { status: 500 })));
  render(<UserList />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load users: HTTP 500");
});`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`onUnhandledRequest: \"error\"` is the setting that earns its keep",
          body: "The default warns. Warning means a component that started fetching a second endpoint you did not know about goes to the real network in your test suite, and either fails confusingly or — worse — succeeds. Setting it to `error` turns \"I forgot a handler\" into a named failure at the moment it starts happening.",
        },
      ],
    },
    {
      id: "handler-shapes",
      heading: "The handler shapes worth knowing",
      body: [
        "A handler receives the request, so it can behave like a server rather than a fixture.",
      ],
      examples: [
        {
          id: "shapes",
          title: "Params, query, body, delay and failure",
          lang: "javascript",
          code: `import { http, HttpResponse, delay } from "msw";

export const handlers = [
  /* Path parameters. */
  http.get("/api/users/:id", ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Ada" })
  ),

  /* Query string — useful for asserting that the component built the URL
     the way you think it does. */
  http.get("/api/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json(q === "ada" ? [{ id: 1, name: "Ada" }] : []);
  }),

  /* Request body, so a test can assert on what was actually sent. */
  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    if (!body.email) return HttpResponse.json({ error: "email required" }, { status: 422 });
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  /* A slow response, for testing that the loading state appears at all. */
  http.get("/api/report", async () => {
    await delay(100);
    return HttpResponse.json({ rows: [] });
  }),

  /* A network failure — not a 500. This is the case where fetch rejects
     rather than resolving, and almost no suite tests it. */
  http.get("/api/flaky", () => HttpResponse.error()),
];`,
          explanation:
            "The last two are the ones a hand-rolled stub never covers. `delay` lets you assert the loading state without controlling a promise by hand, and `HttpResponse.error()` produces the case where `fetch` *rejects* — a dropped connection, a CORS failure — which is a different code path from a 500 and is usually the one that throws an unhandled rejection in production.",
          alternates: [
            {
              lang: "typescript",
              code: `import { http, HttpResponse, delay } from "msw";

export const handlers = [
  /* Path parameters. \`params.id\` is \`string | readonly string[]\`, because a
     path can capture repeats — so it is narrowed rather than trusted. */
  http.get("/api/users/:id", ({ params }) =>
    HttpResponse.json({ id: String(params.id), name: "Ada" })
  ),

  /* Query string — useful for asserting that the component built the URL
     the way you think it does. */
  http.get("/api/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json(q === "ada" ? [{ id: 1, name: "Ada" }] : []);
  }),

  /* Request body, so a test can assert on what was actually sent. This is
     the line TypeScript changes: \`request.json()\` resolves to \`unknown\`,
     so the shape has to be stated before a field can be read off it. */
  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return HttpResponse.json({ error: "email required" }, { status: 422 });
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  /* A slow response, for testing that the loading state appears at all. */
  http.get("/api/report", async () => {
    await delay(100);
    return HttpResponse.json({ rows: [] });
  }),

  /* A network failure — not a 500. This is the case where fetch rejects
     rather than resolving, and almost no suite tests it. */
  http.get("/api/flaky", () => HttpResponse.error()),
];`,
            },
          ],
        },
      ],
    },
    {
      id: "one-set",
      heading: "One set of handlers, three places",
      body: [
        "The handlers are ordinary values, so the same array can be used by more than the test suite.",
        "**In tests**, through `setupServer` from `msw/node`.",
        "**In the browser during development**, through `setupWorker` from `msw/browser`, which installs a service worker. The app runs against the same fake API with no backend at all — which is how you build a feature against an endpoint that does not exist yet, and how a designer runs the app with no environment.",
        "**In Storybook or a preview deployment**, the same way.",
        "That shared definition is the real argument for MSW over a stub. The contract is written once, and the thing that runs in your test is the thing that ran while you were building the feature.",
      ],
      examples: [
        {
          id: "browser",
          title: "The same handlers in the browser",
          lang: "jsx",
          code: `// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// src/main.tsx — development only, and awaited, so the app does not make
// its first request before the worker is listening.
if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

createRoot(document.getElementById("root")).render(<App />);`,
          explanation:
            "`bypass` rather than `error` here: in a browser you want unhandled requests — fonts, images, analytics — to go through untouched. It is the opposite choice from the test setup, and for the opposite reason.",
          alternates: [
            {
              lang: "tsx",
              code: `// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// src/main.tsx — development only, and awaited, so the app does not make
// its first request before the worker is listening.
if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

createRoot(document.getElementById("root")!).render(<App />);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The service worker file has to be served",
          body: "`npx msw init public/` copies `mockServiceWorker.js` into your static directory, and it must be committed. A worker that 404s fails with a message about registration rather than about mocking, which is a confusing ten minutes the first time.",
        },
      ],
    },
    {
      id: "limits",
      heading: "Where it stops",
      body: [
        "**It is not a contract test.** Your handler returns whatever you wrote. If the real API changes shape, every test still passes. Generating handlers from an OpenAPI schema, or checking them against one, is the fix — otherwise MSW moves the lie from the stub to the handler, it does not remove it.",
        "**It does not test the server.** Obviously, and worth saying, because a suite that is entirely green over MSW has tested none of the integration.",
        "**Handler order matters.** The first match wins, so `server.use` prepends and a broad `*` handler placed early will swallow everything after it.",
        "**Not everything is HTTP.** WebSockets have their own API in MSW 2; anything else — a third-party SDK that does its own transport — still needs a module mock.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why intercept requests rather than mock fetch?",
      answer:
        "Because a stubbed `fetch` returns a shape you remembered rather than a real `Response` — no status, no headers, no JSON parsing — so the component's `if (!response.ok)` branch never runs. And both a fetch stub and a mocked API module couple the test to how you happen to fetch: swap to axios or TanStack Query and every test breaks despite identical behaviour. MSW answers a real request with a real response, so the component's own networking code runs.",
    },
    {
      question: "How do you test an error response with MSW?",
      answer:
        "`server.use()` with a handler for that endpoint returning the status you want, inside the one test that needs it, with `resetHandlers()` in `afterEach` so it does not leak. The component is untouched — you are describing what the endpoint does, not reaching into anything — and its real error path runs, including any message built from the real status code.",
    },
    {
      question: "What does onUnhandledRequest do and what should it be?",
      answer:
        "It decides what happens when a request has no handler. In tests, `error` — otherwise a component that starts calling an endpoint you did not know about reaches the real network, and either fails confusingly or passes for the wrong reason. In the browser, `bypass`, because fonts, images and analytics should go through untouched.",
    },
    {
      question: "What does MSW not give you?",
      answer:
        "Confidence that the real API matches. Your handler returns whatever you wrote, so if the backend changes shape every test still passes — the lie moves from the stub to the handler unless the handlers are generated from or checked against a schema. It also tests nothing about the server, and it only covers HTTP and WebSockets; an SDK with its own transport still needs a module mock.",
    },
  ],
  takeaways: [
    "A stubbed `fetch` has no status, no headers and no error path — so those branches never run",
    "Mocking the API module replaces the URL and error mapping you wanted to test",
    "Both break when you change HTTP client, despite identical behaviour",
    "MSW answers real requests with real `Response` objects",
    "`server.use` for one test, `resetHandlers` in `afterEach` so it cannot leak",
    "`onUnhandledRequest: \"error\"` in tests, `bypass` in the browser",
    "`delay` tests the loading state; `HttpResponse.error()` tests the case where fetch rejects",
    "The same handlers run the app in development with no backend",
    "It is not a contract test — generate or check handlers against a schema",
  ],
  status: "available",
};
