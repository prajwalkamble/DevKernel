import type { Lesson } from "@/content/types";

export const capstoneComponentsLesson: Lesson = {
  id: "react-capstone-components",
  slug: "bug-tracker-components-screens-and-tests",
  moduleSlug: "capstone-project",
  title: "Bug Tracker: Components, Screens & Tests",
  summary:
    "Step five. The four states in one component, the list and its filters, the report form that runs the same schema the server runs, and tests that fake the network rather than the modules — including the one where scoping a query to the list was the difference between a passing test and a passing bug.",
  estimatedMinutes: 30,
  objectives: [
    "Render four states from one component, and know why the empty one takes a prop",
    "Type a component's props so an impossible combination does not compile",
    "Run one schema on both sides of the wire and merge both sets of errors",
    "Write tests that fake the network and would survive replacing the data layer",
    "Scope a query so a passing test is not hiding a wrong one",
  ],
  sections: [
    {
      id: "four-states",
      heading: "The four states, once",
      body: [
        "FR-13 makes the four states a numbered requirement because the empty one is forgotten otherwise. Writing them in each screen means writing them differently in each screen, so they live in one component — with one deliberate exception.",
      ],
      examples: [
        {
          id: "async-boundary",
          title: "web/src/components/AsyncBoundary.jsx",
          lang: "jsx",
          code: `export function AsyncBoundary({
  isPending,
  error,
  isEmpty,
  onRetry,
  empty,
  children,
}) {
  if (isPending) return <p role="status">Loading…</p>;

  if (error) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}`,
          explanation:
            "The exception is `isEmpty`, and it is worth defending. The component could compute emptiness itself by inspecting `children`, and that would be shorter and wrong: \"no bugs match these filters\" and \"no bugs reported yet\" are different sentences, and only the caller knows which one applies because only the caller knows whether a filter is set. Pushing the *decision* out while keeping the *layout* in is the split that makes a shared component worth having. The `role=\"status\"` and `role=\"alert\"` are NFR-7: a screen reader announces both without the user having to go looking.",
          requires: "tsc and a React renderer (this component only declares markup)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/components/AsyncBoundary.tsx",
              requires: "tsc and a React renderer (this component only declares markup)",
              code: `import type { ReactNode } from "react";

/* FR-13. Four states, in one place, because the empty state is the one that
   gets forgotten and a numbered requirement is easier to keep than a habit.
   \`isEmpty\` is passed in rather than inferred: only the caller knows whether
   an empty array means "no bugs yet" or "no bugs match this filter", and those
   need different words. */
export interface AsyncBoundaryProps {
  isPending: boolean;
  error: Error | null;
  isEmpty: boolean;
  onRetry: () => void;
  empty: ReactNode;
  children: ReactNode;
}

export function AsyncBoundary({
  isPending,
  error,
  isEmpty,
  onRetry,
  empty,
  children,
}: AsyncBoundaryProps) {
  if (isPending) return <p role="status">Loading…</p>;

  if (error) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`isPending` is not `isLoading` and neither is `isFetching`",
          body: "In TanStack Query v5, `isPending` means there is no data yet — the honest \"show a spinner\" condition. `isFetching` is true for every request including background refetches, so rendering a spinner on it makes the page flash every time a filter changes, which is exactly what NFR-8 forbids. The bug is invisible on a fast connection and obvious on a slow one, which is the worst combination for catching it in review.",
        },
      ],
    },
    {
      id: "list",
      heading: "The list screen",
      body: [
        "The list is where the URL state, the query, the four states and the two different empty messages all meet. It is deliberately thin: it owns no data of its own, and every value it renders comes from a hook.",
      ],
      examples: [
        {
          id: "bug-list",
          title: "web/src/features/bugs/BugList.jsx",
          lang: "jsx",
          code: `export function BugList({ projectId, projectKey }) {
  const { filters, setFilter } = useBugFilters();
  const bugs = useBugs(projectId, filters);
  const users = useUsers();

  const byId = new Map((users.data ?? []).map((user) => [user.id, user]));
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <section>
      <h1>Bugs</h1>
      <BugFilters filters={filters} users={users.data ?? []} onChange={setFilter} />

      <AsyncBoundary
        isPending={bugs.isPending}
        error={bugs.error}
        isEmpty={(bugs.data ?? []).length === 0}
        onRetry={() => void bugs.refetch()}
        empty={
          hasFilter ? (
            <p>No bugs match these filters.</p>
          ) : (
            <p>No bugs reported yet. That is either very good news or very bad news.</p>
          )
        }
      >
        <ul>
          {(bugs.data ?? []).map((bug) => (
            <BugRow
              key={bug.id}
              bug={bug}
              projectKey={projectKey}
              assignee={bug.assigneeId ? byId.get(bug.assigneeId) : undefined}
            />
          ))}
        </ul>
      </AsyncBoundary>
    </section>
  );
}`,
          explanation:
            "`hasFilter` is the whole reason `isEmpty` is a prop rather than a computation. The user map is rebuilt on every render, which is fine and deliberate: it is three entries, and `useMemo` here would cost more in reading time than it saves in execution. That is a judgement about *this* data, not a general rule — the same code over four thousand users is a different decision, and the way to know is to measure rather than to memoise reflexively.",
          requires: "tsc and a React renderer (imports elided; see the repository)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/features/bugs/BugList.tsx",
              requires: "tsc and a React renderer (imports elided; see the repository)",
              code: `export interface BugListProps {
  projectId: string;
  projectKey: string;
}

export function BugList({ projectId, projectKey }: BugListProps) {
  const { filters, setFilter } = useBugFilters();
  const bugs = useBugs(projectId, filters);
  const users = useUsers();

  const byId = new Map((users.data ?? []).map((user) => [user.id, user]));
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <section>
      <h1>Bugs</h1>
      <BugFilters filters={filters} users={users.data ?? []} onChange={setFilter} />

      <AsyncBoundary
        isPending={bugs.isPending}
        error={bugs.error}
        isEmpty={(bugs.data ?? []).length === 0}
        onRetry={() => void bugs.refetch()}
        empty={
          hasFilter ? (
            <p>No bugs match these filters.</p>
          ) : (
            <p>No bugs reported yet. That is either very good news or very bad news.</p>
          )
        }
      >
        <ul>
          {(bugs.data ?? []).map((bug) => (
            <BugRow
              key={bug.id}
              bug={bug}
              projectKey={projectKey}
              assignee={bug.assigneeId ? byId.get(bug.assigneeId) : undefined}
            />
          ))}
        </ul>
      </AsyncBoundary>
    </section>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "form",
      heading: "The report form",
      body: [
        "NFR-3 says the client validates as a convenience and the server validates because it must. The form is where that stops being a slogan: it runs the *same* schema the server runs, and it merges the server's field errors over its own.",
      ],
      examples: [
        {
          id: "new-bug-form",
          title: "web/src/features/bugs/NewBugForm.jsx — the validation half",
          lang: "jsx",
          code: `export function NewBugForm({ projectId, reporterId, onCreated }) {
  const [form, setForm] = useState(empty);
  const [clientErrors, setClientErrors] = useState({});
  const create = useCreateBug(projectId);

  /* NFR-3. The client's check saves a round trip; the server's exists because
     this one can be bypassed with a single curl. Both run the same schema. */
  const serverErrors = create.error instanceof ApiFailure ? create.error.fieldErrors : undefined;
  const errors = { ...clientErrors, ...serverErrors };
  const field = (name) => errors[name]?.[0];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = CreateBug.safeParse({ ...form, reporterId });
        if (!parsed.success) {
          const next = {};
          for (const issue of parsed.error.issues) {
            (next[issue.path.join(".")] ??= []).push(issue.message);
          }
          setClientErrors(next);
          return;
        }
        setClientErrors({});
        create.mutate(parsed.data, {
          onSuccess: (bug) => {
            setForm(empty);
            onCreated?.(bug.id);
          },
        });
      }}
    >
      {/* one of six fields; the rest follow the same shape */}
      <label>
        Steps to reproduce
        <textarea
          value={form.stepsToReproduce}
          aria-invalid={Boolean(field("stepsToReproduce"))}
          onChange={(event) => setForm({ ...form, stepsToReproduce: event.target.value })}
        />
      </label>
      {field("stepsToReproduce") && <p role="alert">{field("stepsToReproduce")}</p>}
    </form>
  );
}`,
          explanation:
            "The spread order in `{ ...clientErrors, ...serverErrors }` is a decision, not a formatting accident: the server's opinion wins, because the server is the one that refused. The messages the reader sees are the strings written back in the shared schema, so \"Say what you did, in enough detail to repeat it\" appears in the form without the form knowing what the rule was. `noValidate` turns off the browser's own bubbles, which cannot be styled, are not announced consistently, and would fire before this code ever runs.",
          requires: "tsc and a React renderer (imports and four fields elided)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/features/bugs/NewBugForm.tsx — the validation half",
              requires: "tsc and a React renderer (imports and four fields elided)",
              code: `export function NewBugForm({ projectId, reporterId, onCreated }: NewBugFormProps) {
  const [form, setForm] = useState(empty);
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});
  const create = useCreateBug(projectId);

  /* NFR-3. The client's check saves a round trip; the server's exists because
     this one can be bypassed with a single curl. Both run the same schema. */
  const serverErrors = create.error instanceof ApiFailure ? create.error.fieldErrors : undefined;
  const errors = { ...clientErrors, ...serverErrors };
  const field = (name: string) => errors[name]?.[0];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = CreateBug.safeParse({ ...form, reporterId });
        if (!parsed.success) {
          const next: Record<string, string[]> = {};
          for (const issue of parsed.error.issues) {
            (next[issue.path.join(".")] ??= []).push(issue.message);
          }
          setClientErrors(next);
          return;
        }
        setClientErrors({});
        create.mutate(parsed.data, {
          onSuccess: (bug) => {
            setForm(empty);
            onCreated?.(bug.id);
          },
        });
      }}
    >
      {/* one of six fields; the rest follow the same shape */}
      <label>
        Steps to reproduce
        <textarea
          value={form.stepsToReproduce}
          aria-invalid={Boolean(field("stepsToReproduce"))}
          onChange={(event) => setForm({ ...form, stepsToReproduce: event.target.value })}
        />
      </label>
      {field("stepsToReproduce") && <p role="alert">{field("stepsToReproduce")}</p>}
    </form>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`aria-invalid` and a visible message are both needed",
          body: "A red border tells sighted users; `aria-invalid` tells everyone else, and a message with `role=\"alert\"` is what actually says *what is wrong*. Any one of the three alone leaves somebody unable to fix the form. This is NFR-7 in its most ordinary form: not an exotic widget, just a field that failed.",
        },
      ],
    },
    {
      id: "tests",
      heading: "Tests that fake the network",
      body: [
        "NFR-9 says the tests fake the network, not the modules. Nothing in a Bug Tracker test knows the app uses `fetch`, or TanStack Query, or Zod — so replacing any of those does not rewrite the suite. MSW is what makes that possible: it intercepts at the network layer and answers with real HTTP responses.",
      ],
      examples: [
        {
          id: "list-test",
          title: "web/src/features/bugs/BugList.test.jsx",
          lang: "jsx",
          code: `describe("BugList", () => {
  it("lists the bugs with their key, severity and assignee", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);

    const list = await screen.findByRole("list");
    /* Scoped to the list on purpose: "Ada Lovelace" also appears in the
       assignee <select>, and getAllByText(...)[0] would have been the bug. */
    expect(within(list).getByText("WEB-1")).toBeInTheDocument();
    expect(within(list).getByText("blocker")).toBeInTheDocument();
    expect(within(list).getByText("Unassigned")).toBeInTheDocument();
    expect(within(list).getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("sends the status filter to the server rather than filtering locally", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);
    await screen.findByRole("list");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "open");

    const list = await screen.findByRole("list");
    expect(within(list).getByText("WEB-1")).toBeInTheDocument();
    expect(within(list).queryByText("WEB-2")).not.toBeInTheDocument();
  });

  it("distinguishes an empty result from an empty project", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);
    await screen.findByRole("list");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "closed");

    expect(await screen.findByText("No bugs match these filters.")).toBeInTheDocument();
  });

  it("offers a retry when the request fails", async () => {
    server.use(
      http.get(\`\${API}/projects/:projectId/bugs\`, () =>
        HttpResponse.json({ error: "Database is asleep" }, { status: 500 }),
      ),
    );

    renderApp(<BugList projectId="p_web" projectKey="WEB" />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Database is asleep")).toBeInTheDocument();
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});`,
          explanation:
            "The second test is the one that earns its keep. It asserts on what came *back*, which can only be right if the component put `status=open` in the query string — because the MSW handler applies the filter itself rather than ignoring it. A handler that returned the same array whatever the query would let this test pass while the component sent nothing, which is the most common way a network-level fake becomes decorative.",
          requires:
            "vitest with Testing Library and MSW (this is the source; its run appears below)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/features/bugs/BugList.test.tsx",
              code: `/* Identical to BugList.test.jsx apart from the name. Testing Library's
   queries are typed already, and this test declares no values of its own. */

describe("BugList", () => {
  it("lists the bugs with their key, severity and assignee", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);

    const list = await screen.findByRole("list");
    /* Scoped to the list on purpose: "Ada Lovelace" also appears in the
       assignee <select>, and getAllByText(...)[0] would have been the bug. */
    expect(within(list).getByText("WEB-1")).toBeInTheDocument();
    expect(within(list).getByText("blocker")).toBeInTheDocument();
    expect(within(list).getByText("Unassigned")).toBeInTheDocument();
    expect(within(list).getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("sends the status filter to the server rather than filtering locally", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);
    await screen.findByRole("list");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "open");

    const list = await screen.findByRole("list");
    expect(within(list).getByText("WEB-1")).toBeInTheDocument();
    expect(within(list).queryByText("WEB-2")).not.toBeInTheDocument();
  });

  it("distinguishes an empty result from an empty project", async () => {
    renderApp(<BugList projectId="p_web" projectKey="WEB" />);
    await screen.findByRole("list");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "closed");

    expect(await screen.findByText("No bugs match these filters.")).toBeInTheDocument();
  });

  it("offers a retry when the request fails", async () => {
    server.use(
      http.get(\`\${API}/projects/:projectId/bugs\`, () =>
        HttpResponse.json({ error: "Database is asleep" }, { status: 500 }),
      ),
    );

    renderApp(<BugList projectId="p_web" projectKey="WEB" />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Database is asleep")).toBeInTheDocument();
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});`,
            },
          ],
        },
        {
          id: "test-run",
          title: "The suite",
          lang: "bash",
          code: `npm test --workspace web`,
          output: ` RUN  v3.2.7

 ✓ src/features/triage/TriageQueue.test.tsx (3 tests) 454ms
 ✓ src/features/bugs/BugList.test.tsx (4 tests) 609ms

 Test Files  2 passed (2)
      Tests  7 passed (7)`,
          explanation:
            "Seven tests is not many, and that is the intended shape rather than an unfinished job. Each one covers a decision that could plausibly be got wrong — filtering on the server, distinguishing two empty states, showing a failure with a way out, and the three in the triage suite. Tests that assert a component renders the props it was given cost maintenance and catch nothing.",
          requires: "vitest with Testing Library and MSW (npm's own lines trimmed)",
        },
      ],
      pitfalls: [
        {
          title: "`getAllByText(...)[0]` is how a test starts lying",
          body: "The first assertion above failed on the first attempt because \"Ada Lovelace\" matched twice — once as an assignee in a row, once as an `<option>` in the filter. The tempting repair is `getAllByText(\"Ada Lovelace\")[0]`, which passes immediately and now asserts nothing about *where* the name is: reorder the DOM and it still passes, delete the row and it still passes. Scoping with `within(list)` fixes the ambiguity by saying what you meant.",
        },
        {
          title: "A fresh QueryClient per test, with retries off",
          body: "A shared client leaks one test's cache into the next, so tests pass in one order and fail in another — the exact thing NFR-9 forbids. Retries are worse: a test that deliberately returns a 500 waits for the retry schedule before failing, turning a fast assertion into a three-second one and a suite into something nobody runs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does `AsyncBoundary` take `isEmpty` as a prop instead of working it out?",
      answer:
        "Because emptiness has two meanings and the component cannot tell them apart. An empty list with no filters set means the project has no bugs, and the right message invites the user to file one; an empty list with filters set means the filters excluded everything, and the right message invites them to relax the filters. Only the caller knows which. Passing the boolean and the message keeps the decision where the knowledge is, and keeps the layout — loading, error, retry — in one place.",
    },
    {
      question: "What does MSW give you that mocking the fetch module does not?",
      answer:
        "Independence from how the request is made. A `vi.mock` of the fetch wrapper asserts that a particular function was called with particular arguments, so the test breaks when you rename it, and passes when the URL is wrong as long as the call shape is right. MSW intercepts the actual request, so the test exercises the real URL, the real query string, the real status code and the real JSON — and would still pass if you replaced TanStack Query, or fetch, entirely. It also lets a test assert on the query string by *behaviour*, since the handler can apply the filter.",
    },
    {
      question: "Your test found two elements with the same text. Why is `getAllByText(...)[0]` the wrong fix?",
      answer:
        "Because it makes the test pass without making it correct. The ambiguity was real information — the name appears in a row and in a filter option — and indexing throws it away, leaving an assertion that is satisfied by whichever element happens to be first in the DOM. It will keep passing if the row disappears entirely. Scoping the query with `within(list)` states which one you meant, so the test fails when the thing you cared about breaks.",
    },
  ],
  takeaways: [
    "Put the layout of the four states in one component and the choice of empty message in the caller",
    "`isPending` for \"no data yet\"; rendering a spinner on `isFetching` flashes the page on every refetch",
    "Run the shared schema on the client too, and let the server's field errors win the merge",
    "Fake the network, not the modules — and make the fake apply the filters, or it proves nothing",
    "Scope an ambiguous query instead of indexing it; the ambiguity was telling you something",
    "A fresh query client per test, retries off, or the suite becomes order-dependent and slow",
  ],
  status: "available",
};
