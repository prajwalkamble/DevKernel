import type { Lesson } from "@/content/types";

export const capstoneComponentsLesson: Lesson = {
  id: "react-capstone-components",
  slug: "tracer-components-screens-and-tests",
  moduleSlug: "capstone-project",
  title: "Tracer: Components, Screens & Tests",
  summary:
    "The last step — eight components with their props types, the issue list and issue detail screens, and the tests. Props typed so the compiler enforces the cases a component must handle, route files that only wire, and a suite that fakes the network rather than the modules. Ends with five ways to take the project further.",
  estimatedMinutes: 28,
  objectives: [
    "Type props so the compiler enforces the states a component must handle",
    "Resolve lookups in the parent instead of fetching per row",
    "Write route components that wire hooks to components and nothing else",
    "Test through the network rather than through mocked modules",
    "Say what you would build next, and what each extension would break",
  ],
  sections: [
    {
      id: "props",
      heading: "Props that make the compiler do the checking",
      body: [
        "Eight components, and the props types are where most of the design lives. Two patterns are worth naming.",
        "**`Record<Status, string>` instead of a lookup with a fallback.** Add a status to the shared tuple and `StatusBadge` stops compiling until it has a label. A `?? \"Unknown\"` would have compiled and shipped a badge saying Unknown.",
        "**Resolve data in the parent, pass values down.** `IssueRow` receives an `assignee`, not an `assigneeId`. It has no hooks and no data access, so it renders in a test with a literal object and no provider — and forty rows on screen fire zero requests between them.",
      ],
      examples: [
        {
          id: "badge",
          title: "src/components/StatusBadge.tsx",
          lang: "tsx",
          code: `import type { Status } from "@tracer/shared";

const LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

export interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={\`badge badge--\${status}\`}>{LABEL[status]}</span>;
}`,
          explanation:
            "Twelve lines, and the `Record<Status, string>` annotation is the whole point of them. It is the cheapest exhaustiveness check in TypeScript, and it converts \"someone added a status and forgot the UI\" from a bug report into a build failure.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "row",
          title: "src/features/issues/components/IssueRow.tsx",
          lang: "tsx",
          code: `import { Link } from "react-router";
import type { Issue, User } from "@tracer/shared";
import { PriorityBadge } from "../../../components/PriorityBadge";
import { StatusBadge } from "../../../components/StatusBadge";

export interface IssueRowProps {
  issue: Issue;
  /** Resolved by the parent, so one row never fires its own request. */
  assignee: User | undefined;
  projectKey: string;
}

/* Presentational: props in, markup out, no hooks and no data access. That is
   what makes it renderable in a test with a literal object and no provider. */
export function IssueRow({ issue, assignee, projectKey }: IssueRowProps) {
  return (
    <li className="issue-row">
      <Link to={\`/issues/\${issue.id}\`}>
        <span className="issue-row__key">
          {projectKey}-{issue.number}
        </span>
        <span className="issue-row__title">{issue.title}</span>
      </Link>
      <StatusBadge status={issue.status} />
      <PriorityBadge priority={issue.priority} />
      <span className="issue-row__assignee">{assignee?.name ?? "Unassigned"}</span>
    </li>
  );
}`,
          explanation:
            "`assignee: User | undefined` rather than `assignee?: User` is a deliberate choice: the property is required, so every call site has to think about the unassigned case rather than silently omitting it. The `?? \"Unassigned\"` is then a decision the component owns, and it is the one place in the app where a missing assignee turns into words.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "boundary",
          title: "src/components/QueryBoundary.tsx — NFR-10's four states",
          lang: "tsx",
          code: `import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";

export interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  /** Rendered when the request succeeded but returned nothing to show. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({ query, empty, isEmpty, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <p role="status">Loading…</p>;

  if (query.isError) {
    return (
      <div role="alert">
        <p>{query.error.message}</p>
        <button type="button" onClick={() => void query.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (isEmpty?.(query.data) && empty) return <>{empty}</>;

  return <>{children(query.data)}</>;
}`,
          explanation:
            "Every screen has these four states, and writing them out per screen is how the empty one gets forgotten. The generic parameter is what makes it worth having: `children` receives `T`, not `unknown`, so the call site keeps full type information inside the render prop. And after the `isPending` and `isError` guards, `query.data` is narrowed to `T` — the four states are the compiler's, not a convention.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "filters-component",
          title: "src/features/issues/components/IssueFilters.tsx — FR-2, 3, 4",
          lang: "tsx",
          code: `import { useEffect, useState } from "react";
import { STATUSES, type IssueQuery, type Status, type User } from "@tracer/shared";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";

export interface IssueFiltersProps {
  filters: IssueQuery;
  users: User[];
  onChange: (next: Partial<IssueQuery>) => void;
}

export function IssueFilters({ filters, users, onChange }: IssueFiltersProps) {
  /* The text box is controlled locally so typing stays instant, and only the
     debounced value is pushed up into the URL and the query key. The two
     selects are not debounced: a click is already one event. */
  const [text, setText] = useState(filters.q ?? "");
  const debouncedText = useDebouncedValue(text, 300);

  useEffect(() => {
    onChange({ q: debouncedText || undefined });
  }, [debouncedText, onChange]);

  return (
    <div className="filters">
      <label>
        Search
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Filter by title"
        />
      </label>

      <label>
        Status
        <select
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({ status: (event.target.value || undefined) as Status | undefined })
          }
        >
          <option value="">All</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>

      <label>
        Assignee
        <select
          value={filters.assigneeId ?? ""}
          onChange={(event) => onChange({ assigneeId: event.target.value || undefined })}
        >
          <option value="">Anyone</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}`,
          explanation:
            "Two speeds in one component, and that is the design. The text box keeps its own state so typing is never gated on a round trip; the debounced value is the only thing that reaches the URL. The selects are not debounced because a click is already a single deliberate event — debouncing them would just add 300ms of nothing. Every control is wrapped in a `<label>`, which is NFR-7's cheapest half.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "form",
          title: "src/features/issues/components/NewIssueForm.tsx — FR-6, NFR-3",
          lang: "tsx",
          code: `import { useState, type FormEvent } from "react";
import { PRIORITIES, createIssueSchema, type Priority } from "@tracer/shared";
import { ApiRequestError } from "../../../lib/api";
import { useCreateIssue } from "../hooks/useCreateIssue";

export interface NewIssueFormProps {
  projectId: string;
  onCreated?: (issueId: string) => void;
}

export function NewIssueForm({ projectId, onCreated }: NewIssueFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateIssue(projectId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* Validate with the same schema the server uses, so the common mistakes
       never become a round trip. This is a convenience, not a security
       boundary — the server validates again, and its answer wins. */
    const parsed = createIssueSchema.safeParse({ title, priority });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
      return;
    }

    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (issue) => {
        setTitle("");
        setPriority("medium");
        onCreated?.(issue.id);
      },
      onError: (error) => {
        if (error instanceof ApiRequestError) setErrors(error.fieldErrors);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="new-issue">
      <label>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "new-issue-title-error" : undefined}
        />
      </label>
      {errors.title && (
        <p id="new-issue-title-error" role="alert">{errors.title}</p>
      )}

      <label>
        Priority
        <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create issue"}
      </button>
    </form>
  );
}`,
          explanation:
            "`errors` is one state object keyed the same way the server's `fieldErrors` is, so client-side and server-side failures render through identical code — the only difference is where the object came from. `aria-invalid` and `aria-describedby` are NFR-7: they are what connect the message to the input for a screen reader, and they are also, conveniently, what a test queries by.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "The client's validation is a convenience, never a boundary",
          body: "`createIssueSchema` runs in the browser to save a round trip on the obvious mistakes. It is not security: one `curl` skips it entirely. That is why the identical schema runs on the server, and why the server's answer is the one that wins when they disagree. A project that validates only on the client has no validation.",
        },
      ],
    },
    {
      id: "screens",
      heading: "The screens: wiring, and nothing else",
      body: [
        "A route component's job is to call the hooks and hand the results to the components. If a route file contains business logic, it belongs in a hook; if it contains markup beyond layout, it belongs in a component.",
        "The one computation the list page does is derived state, done the way module 4 argued for: a `Map` built during render, never stored.",
      ],
      examples: [
        {
          id: "list-page",
          title: "src/routes/IssueListPage.tsx",
          lang: "tsx",
          code: `import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import type { Issue } from "@tracer/shared";
import { QueryBoundary } from "../components/QueryBoundary";
import { IssueFilters } from "../features/issues/components/IssueFilters";
import { IssueRow } from "../features/issues/components/IssueRow";
import { NewIssueForm } from "../features/issues/components/NewIssueForm";
import { useIssueFilters } from "../features/issues/hooks/useIssueFilters";
import { useIssues } from "../features/issues/hooks/useIssues";
import { useUsers } from "../hooks/useUsers";

export function IssueListPage() {
  const { projectId = "p_web" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [filters, setFilters] = useIssueFilters();
  const issues = useIssues(projectId, filters);
  const users = useUsers();

  /* Derived, never stored. Module 4's rule: a Map built from the user list is
     a render-time computation, and storing it would mean keeping it in sync
     with a list that can refetch at any moment. */
  const usersById = useMemo(
    () => new Map((users.data ?? []).map((user) => [user.id, user])),
    [users.data],
  );

  return (
    <main>
      <h1>Issues</h1>

      <NewIssueForm projectId={projectId} onCreated={(id) => void navigate(\`/issues/\${id}\`)} />

      <IssueFilters filters={filters} users={users.data ?? []} onChange={setFilters} />

      <QueryBoundary<Issue[]>
        query={issues}
        isEmpty={(data) => data.length === 0}
        empty={<p>No issues match these filters.</p>}
      >
        {(data) => (
          <ul className="issue-list">
            {data.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                assignee={issue.assigneeId ? usersById.get(issue.assigneeId) : undefined}
                projectKey="WEB"
              />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </main>
  );
}`,
          explanation:
            "The `Map` is the fix for the N+1 that a naive version has: without it, each row would need to find its own assignee, and the obvious way to do that is a hook in the row — forty rows, forty subscriptions. Building the lookup once in the parent turns it into one pass. `key={issue.id}`, never the index, because this list is filtered and reordered on every FR-2 through FR-4 interaction.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "main",
          title: "src/main.tsx — every provider, in order",
          lang: "tsx",
          code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import "./index.css";

/* Created once, outside the component. Inside it, a re-render would build a
   new client and throw the entire cache away. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);`,
          explanation:
            "This file is the list from this module's reading lesson — the set of things any component may assume exists. The three defaults are opinions worth stating: 30 seconds of staleness means navigating back to a screen does not refetch, one retry covers a flaky connection without turning a real 500 into a four-second wait, and refetch-on-focus is off because in this app it surprises more than it helps.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
    },
    {
      id: "tests",
      heading: "Testing through the network",
      visual: {
        id: "tracer-queries-visual",
        kind: "react-tooling",
        algorithm: "query-priority",
        title: "Which query a test should reach for",
      },
      body: [
        "NFR-9: fake the network, not the modules. MSW intercepts at the request layer, so `useIssues`, `listIssues`, `request` and `fetch` all run for real and only the wire is replaced. A test that mocks `useIssues` instead proves that the component renders whatever a mock returns, which is not a fact about the app.",
        "Two fixtures make every later test cheap, and both are worth writing before the first test rather than after the third.",
      ],
      examples: [
        {
          id: "render-with-providers",
          title: "src/test/renderWithProviders.tsx",
          lang: "tsx",
          code: `import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

export function renderWithProviders(ui: ReactElement, { route = "/" } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Providers }) };
}`,
          explanation:
            "A fresh `QueryClient` per test is the load-bearing detail: a shared one leaks cached data between tests and makes them pass or fail depending on the order they ran in. Retries are off so a deliberately failing request fails once, immediately, rather than after the default backoff. `initialEntries` is what lets a test start at `/?status=done` and exercise FR-5.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "list-test",
          title: "src/routes/IssueListPage.test.tsx",
          lang: "tsx",
          code: `import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { handlers } from "../test/handlers";
import { renderWithProviders } from "../test/renderWithProviders";
import { IssueListPage } from "./IssueListPage";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders the issues returned by the API", async () => {
  renderWithProviders(<IssueListPage />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading…");

  /* Queried by the text a person reads, and awaited rather than timed. */
  expect(await screen.findByText("Filter chips lose state on reload")).toBeInTheDocument();

  /* Scoped to the list, because "Ada Lovelace" is also an <option> in the
     assignee filter — an ambiguity a page-wide getByText would hit. */
  const list = within(screen.getByRole("list"));
  expect(list.getByText("WEB-1")).toBeInTheDocument();
  expect(list.getByText("Ada Lovelace")).toBeInTheDocument();
});

test("shows the empty state when nothing matches", async () => {
  renderWithProviders(<IssueListPage />, { route: "/?status=done" });

  expect(await screen.findByText("No issues match these filters.")).toBeInTheDocument();
});`,
          output: ` ✓ src/routes/IssueListPage.test.tsx (2 tests)

 Test Files  1 passed (1)
      Tests  2 passed (2)`,
          explanation:
            "`onUnhandledRequest: \"error\"` is the setting that makes this suite honest: a request the handlers do not cover fails the test rather than silently returning nothing, so adding an endpoint to a screen and forgetting it in the fixtures is caught here. The second test starts at `/?status=done` and asserts the empty state — which means it exercises FR-5, FR-2 and NFR-10's fourth state in three lines.",
          requires: "vitest with Testing Library and MSW (this is its reporter output)",
        },
      ],
      pitfalls: [
        {
          title: "`within` is not fussiness",
          body: "The first version of this test used a page-wide `getByText(\"Ada Lovelace\")` and failed — because the name is also an `<option>` in the assignee filter. That failure is the test doing its job: the ambiguity is real, and a screen reader user tabbing through hits both. Scoping to the list is the fix; adding `getAllByText(...)[0]` would have been the bug.",
        },
      ],
    },
    {
      id: "next",
      heading: "Where to take it",
      body: [
        "The project as specified is finished and every requirement is checkable. Five extensions, in the order that teaches the most per hour:",
        "**Optimistic comment posting.** The one remaining mutation that *can* be optimistic — you have the body, and a temporary id is acceptable for a list that is append-only. Compare what it takes with `useUpdateIssue`.",
        "**Pagination or infinite scroll.** `useInfiniteQuery`, a cursor on `created_at`, and the discovery that offset pagination is wrong the moment rows are inserted while you page.",
        "**Authentication.** A session, a `currentUser`, and `authorId` stops being a prop the client picks. Notice that none of the four tables change.",
        "**A real-time update.** A WebSocket or polling that writes into the query cache. This is where centralised query keys stop being tidiness and start being the only way the feature is possible.",
        "**Move it to a server-rendered framework.** Module 12's material, applied: which of these components would carry `\"use client\"`, and which of these hooks would stop existing.",
        "Each one is a weekend, each one breaks something you thought was settled, and that is the point.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why fake the network rather than mock the hook?",
      answer:
        "Because mocking useIssues proves the component renders whatever a mock returns, which is not a fact about the application. Intercepting at the request layer with MSW means the hook, the api function, the fetch wrapper and the response parsing all run for real, so a broken query key, a wrong URL or a schema mismatch is caught. It also means the test survives refactoring — moving logic between the hook and the api layer does not touch it, because it was never coupled to either.",
    },
    {
      question: "Where does state live in this app, and why in three places?",
      answer:
        "Server data lives in the query cache, because it is a cached copy of something someone else owns and it needs invalidation, deduplication and cancellation. The filters live in the URL, because they are where you are rather than what you have — that is what makes the view shareable and reload-survivable. Local UI state — the uncommitted text in the search box, the form fields before submission — lives in useState, because nothing outside the component needs it. The mistake is putting all three in one place: server data in useState loses caching, and form keystrokes in the URL create twenty history entries.",
    },
    {
      question: "Why does IssueRow take an assignee rather than an assigneeId?",
      answer:
        "So that a row never fetches. If the row took an id it would have to resolve the name itself, and the natural way to do that is a hook — which is forty subscriptions for forty rows, and forty requests if the hook is not cached. The parent builds one Map from the user list it already has and passes the resolved value down, which is one pass. It also makes the row purely presentational: props in, markup out, no hooks and no providers, so a test can render it with a literal object.",
    },
    {
      question: "What is the QueryBoundary generic parameter for?",
      answer:
        "It keeps the type through the render prop. Without it children would receive unknown and every call site would have to cast the data back to what it already knew it was. With it, the guards for isPending and isError narrow query.data to T, so the four states are enforced by the compiler rather than by convention — and the empty state, which is the one that gets forgotten when each screen writes its own, has a declared place to go.",
    },
  ],
  takeaways: [
    "`Record<Status, string>` over a fallback: the compiler catches the forgotten case",
    "`assignee: User | undefined` rather than `assignee?: User`, so every call site thinks about it",
    "Resolve lookups in the parent; a row that fetches is forty requests",
    "One `QueryBoundary` so the empty state cannot be forgotten",
    "Two speeds in one filter bar: debounce the text, not the selects",
    "Key client-side and server-side validation errors the same way, and one render path handles both",
    "`aria-invalid` and `aria-describedby` connect the message to the input — and are what a test queries by",
    "A route file wires hooks to components; logic belongs in a hook, markup in a component",
    "Derive the lookup Map with `useMemo`, never store it",
    "A fresh `QueryClient` per test, or test order decides the results",
    "`onUnhandledRequest: \"error\"` makes a forgotten fixture fail the test instead of passing quietly",
    "Fake the network, not the modules — everything below the wire should run",
  ],
  status: "available",
};
