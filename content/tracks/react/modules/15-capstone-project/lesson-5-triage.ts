import type { Lesson } from "@/content/types";

export const capstoneTriageLesson: Lesson = {
  id: "react-capstone-triage",
  slug: "bug-tracker-the-triage-queue",
  moduleSlug: "capstone-project",
  title: "Bug Tracker: The Triage Queue",
  summary:
    "Step six, and the screen that makes the app a bug tracker rather than a list. Every report nobody has judged yet, worst first and oldest within that, with enough of each report on screen to decide without opening it — plus the two-outcome decision, its optimistic removal, its rollback, and the test that proves the rollback actually happens.",
  estimatedMinutes: 26,
  objectives: [
    "Recognise when a filtered view is really a different screen",
    "Express an ordering the data has no natural sort for",
    "Build a work queue that shows enough to decide without a round trip",
    "Optimistically remove a row and put it back when the server refuses",
    "Test a rollback, which means testing a failure on purpose",
  ],
  sections: [
    {
      id: "why-a-queue",
      heading: "Why this is a screen and not a filter",
      body: [
        "Every bug arrives as `open`, which in Bug Tracker means *nobody has decided whether this is real*. That is a backlog, and a backlog that nobody works down stops being read: the useful signal — a blocker filed this morning — is buried under three months of duplicates and misunderstandings.",
        "So FR-11 asks for a queue. The temptation is to make it a link to the list with `?status=open`, and it is worth being precise about why that does not work, because the reasoning generalises.",
        "**The order is different.** The list is newest-first, because a list is something you scan for what changed. A queue is worst-first, because a queue is something you work down — and within a severity, oldest-first, because the oldest unjudged report has been failing someone the longest.",
        "**The content is different.** A list row is one line: key, title, severity, status, assignee. To *judge* a report you need the thing itself — the steps, the expected and actual behaviour, the environment — because the decision is \"can I believe this happened\". A queue that makes you open each bug to judge it is a queue nobody uses.",
        "**The controls are different.** A list row navigates. A queue row decides.",
        "Three differences on the same table is the signal that these are two screens. What they share is the data model, and that is all they should share.",
      ],
      pitfalls: [
        {
          title: "\"It's just the list with a filter\" is how the list grows a mode",
          body: "Building the queue as a preset filter means the list needs a sort parameter it otherwise would not have, a way to expand rows that nothing else uses, and a conditional set of buttons. Every one of those is dead weight on the list's own code, and the sort parameter in particular is the kind of thing that ends up in a URL a user shares — producing a screen no requirement describes. Two components reading one table cost less than one component with a mode.",
        },
      ],
    },
    {
      id: "ordering",
      heading: "An order the database cannot guess",
      body: [
        "`ORDER BY severity` sorts the text. Bug Tracker's four severities are `blocker`, `major`, `minor`, `trivial`, and those happen to be in the right alphabetical order — which is the most dangerous kind of correct, because it is an accident that survives review and breaks the day somebody adds `critical`.",
        "So the rank is stated, not inferred.",
      ],
      examples: [
        {
          id: "severity-order",
          title: "server/src/routes/bugs.js — the ranking",
          lang: "javascript",
          code: `/* Severity is a word, so SQL sorts it alphabetically: blocker, major, minor,
   trivial happens to be right by luck, and would stop being right the moment
   anyone adds "critical". Rank it explicitly instead. */
const severityOrder = sql\`CASE \${bugs.severity}
  WHEN 'blocker' THEN 0 WHEN 'major' THEN 1 WHEN 'minor' THEN 2 ELSE 3 END\`;

bugRoutes.get("/projects/:projectId/triage", async (c) => {
  return c.json(
    await db
      .select()
      .from(bugs)
      .where(and(eq(bugs.projectId, c.req.param("projectId")), eq(bugs.status, "open")))
      .orderBy(severityOrder, asc(bugs.createdAt)),
  );
});`,
          explanation:
            "The `ELSE 3` rather than a fourth `WHEN` is a small deliberate choice: an unranked severity sorts last rather than crashing the query, so adding a value to the shared vocabulary and forgetting this `CASE` degrades the ordering instead of breaking the screen. The better version of this — and the right one once there are more than four — is a rank column on a severities table, so the order is data rather than code.",
          requires: "tsc (imports elided; see the repository for the full file)",
          alternates: [
            {
              lang: "typescript",
              title: "server/src/routes/bugs.ts — the ranking",
              requires: "tsc (imports elided; see the repository for the full file)",
              code: `/* Severity is a word, so SQL sorts it alphabetically: blocker, major, minor,
   trivial happens to be right by luck, and would stop being right the moment
   anyone adds "critical". Rank it explicitly instead. */
const severityOrder = sql\`CASE \${bugs.severity}
  WHEN 'blocker' THEN 0 WHEN 'major' THEN 1 WHEN 'minor' THEN 2 ELSE 3 END\`;

bugRoutes.get("/projects/:projectId/triage", async (c) => {
  return c.json(
    await db
      .select()
      .from(bugs)
      .where(and(eq(bugs.projectId, c.req.param("projectId")), eq(bugs.status, "open")))
      .orderBy(severityOrder, asc(bugs.createdAt)),
  );
});`,
            },
          ],
        },
        {
          id: "queue-transcript",
          title: "The queue, ordered",
          lang: "bash",
          code: `curl -s "$API/projects/p_web/triage" \\
  | jq -c '.[] | {number, severity, createdAt: .createdAt[:10]}'`,
          output: `{"number":1,"severity":"blocker","createdAt":"2026-03-01"}
{"number":5,"severity":"minor","createdAt":"2026-03-05"}
{"number":3,"severity":"trivial","createdAt":"2026-03-03"}`,
          explanation:
            "Read the dates rather than the severities. They go 1st, 5th, 3rd — which is not sorted, and that is the proof the ordering is severity-major. If the dates came out sorted you would have learned nothing, because a date-ordered result is also what you would get from an ordering that ignored severity entirely. Choosing seed data where the two orders disagree is what makes this transcript evidence instead of decoration.",
          requires: "the server running, with $API set to http://localhost:8787/api",
        },
      ],
    },
    {
      id: "the-screen",
      heading: "The screen",
      body: [
        "The component is mostly the report, laid out to be read. The two buttons are the entire interaction, and they are disabled while a decision is in flight — not to prevent a double submit, which the server refuses anyway with a 409, but so the user is not left wondering whether the first click registered.",
      ],
      examples: [
        {
          id: "triage-queue",
          title: "web/src/features/triage/TriageQueue.jsx",
          lang: "jsx",
          code: `/* FR-11 and FR-12. The queue is the screen a maintainer opens first: every
   report nobody has looked at, worst first, then oldest. Two buttons, because
   triage has exactly two answers — this is real, or it is not. */
export function TriageQueue({ projectId, projectKey }) {
  const queue = useTriageQueue(projectId);
  const triage = useTriage(projectId);

  return (
    <section>
      <h1>Triage</h1>
      <p>{(queue.data ?? []).length} waiting</p>

      <AsyncBoundary
        isPending={queue.isPending}
        error={queue.error}
        isEmpty={(queue.data ?? []).length === 0}
        onRetry={() => void queue.refetch()}
        empty={<p>Nothing to triage. Every report has been looked at.</p>}
      >
        <ol>
          {(queue.data ?? []).map((bug) => (
            <li key={bug.id}>
              <h2>{\`\${projectKey}-\${bug.number} \${bug.title}\`}</h2>
              <p>{bug.severity}</p>
              <dl>
                <dt>Steps</dt>
                <dd>{bug.stepsToReproduce}</dd>
                <dt>Expected</dt>
                <dd>{bug.expected}</dd>
                <dt>Actual</dt>
                <dd>{bug.actual}</dd>
                <dt>Environment</dt>
                <dd>{bug.environment}</dd>
              </dl>
              <button
                type="button"
                disabled={triage.isPending}
                onClick={() => triage.mutate({ bugId: bug.id, outcome: "confirmed" })}
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={triage.isPending}
                onClick={() => triage.mutate({ bugId: bug.id, outcome: "wontfix" })}
              >
                Won't fix
              </button>
            </li>
          ))}
        </ol>
      </AsyncBoundary>

      {triage.error && <p role="alert">{triage.error.message}</p>}
    </section>
  );
}`,
          explanation:
            "Three details are load-bearing. It is an `<ol>` rather than a `<ul>`, because the order is the meaning — this is a ranked queue, and a screen reader should say so. The empty state is the good one, so it says so rather than apologising. And the error is rendered *outside* the boundary: a failed triage decision must not blank the queue, because the user still needs to see the row that came back.",
          requires: "tsc and a React renderer (imports elided; see the repository)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/features/triage/TriageQueue.tsx",
              requires: "tsc and a React renderer (imports elided; see the repository)",
              code: `export interface TriageQueueProps {
  projectId: string;
  projectKey: string;
}

/* FR-11 and FR-12. The queue is the screen a maintainer opens first: every
   report nobody has looked at, worst first, then oldest. Two buttons, because
   triage has exactly two answers — this is real, or it is not. */
export function TriageQueue({ projectId, projectKey }: TriageQueueProps) {
  const queue = useTriageQueue(projectId);
  const triage = useTriage(projectId);

  return (
    <section>
      <h1>Triage</h1>
      <p>{(queue.data ?? []).length} waiting</p>

      <AsyncBoundary
        isPending={queue.isPending}
        error={queue.error}
        isEmpty={(queue.data ?? []).length === 0}
        onRetry={() => void queue.refetch()}
        empty={<p>Nothing to triage. Every report has been looked at.</p>}
      >
        <ol>
          {(queue.data ?? []).map((bug) => (
            <li key={bug.id}>
              <h2>{\`\${projectKey}-\${bug.number} \${bug.title}\`}</h2>
              <p>{bug.severity}</p>
              <dl>
                <dt>Steps</dt>
                <dd>{bug.stepsToReproduce}</dd>
                <dt>Expected</dt>
                <dd>{bug.expected}</dd>
                <dt>Actual</dt>
                <dd>{bug.actual}</dd>
                <dt>Environment</dt>
                <dd>{bug.environment}</dd>
              </dl>
              <button
                type="button"
                disabled={triage.isPending}
                onClick={() => triage.mutate({ bugId: bug.id, outcome: "confirmed" })}
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={triage.isPending}
                onClick={() => triage.mutate({ bugId: bug.id, outcome: "wontfix" })}
              >
                Won't fix
              </button>
            </li>
          ))}
        </ol>
      </AsyncBoundary>

      {triage.error && <p role="alert">{triage.error.message}</p>}
    </section>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`disabled={triage.isPending}` disables every button, not the clicked one",
          body: "One mutation object serves the whole list, so while any decision is in flight all of them are disabled. For a queue you work down one at a time that is the honest behaviour and arguably the desirable one. If you wanted per-row pending state you would need the mutation per row — which means a component per row, since hooks cannot be called in a loop. That is a real refactor, and worth doing only when the requirement asks for parallel decisions.",
        },
      ],
    },
    {
      id: "rollback",
      heading: "Removing a row, and putting it back",
      body: [
        "Triage is optimistic because the queue should empty as fast as the user can judge, and waiting for a round trip between decisions makes the screen feel like paperwork. But this optimistic update removes a row, and the rollback has to restore it — including its position, which is why the snapshot is the whole array rather than the item.",
        "It also fails for real. FR-12's rule means a second decision on the same bug is a 409, and two people triaging the same queue will hit it. That is not an edge case to skip; it is a path users see.",
      ],
      examples: [
        {
          id: "rollback-test",
          title: "web/src/features/triage/TriageQueue.test.jsx",
          lang: "jsx",
          code: `it("removes a bug from the queue as soon as it is confirmed", async () => {
  /* The fake keeps state, because the real server does. Without this the
     refetch that follows the mutation hands the bug straight back and the
     test would be asserting against a server that forgot what it was told. */
  let triaged = false;
  server.use(
    http.get(\`\${API}/projects/:projectId/triage\`, () =>
      HttpResponse.json(triaged ? [] : bugs.filter((bug) => bug.status === "open")),
    ),
    http.post(\`\${API}/bugs/:id/triage\`, () => {
      triaged = true;
      return HttpResponse.json({ ...bugs[0], status: "confirmed" });
    }),
  );

  renderApp(<TriageQueue projectId="p_web" projectKey="WEB" />);
  await screen.findByRole("list");
  expect(screen.getByText("1 waiting")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  expect(await screen.findByText("0 waiting")).toBeInTheDocument();
});

it("puts the bug back when the server rejects the decision", async () => {
  server.use(
    http.post(\`\${API}/bugs/:id/triage\`, () =>
      HttpResponse.json({ error: "Already triaged: this bug is wontfix" }, { status: 409 }),
    ),
  );

  renderApp(<TriageQueue projectId="p_web" projectKey="WEB" />);
  await screen.findByRole("list");

  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  /* The optimistic removal must be undone, visibly, and the reason shown.
     An optimistic update without a rollback is a lie that survives until
     the next refetch. */
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Already triaged: this bug is wontfix",
  );
  expect(await screen.findByText("1 waiting")).toBeInTheDocument();
});`,
          explanation:
            "The first test failed on the first attempt, and the failure was worth more than the fix. The handler was stateless, so the invalidation in `onSettled` refetched the queue and got the bug back — the screen went to zero and then to one again. That is not a test bug; it is the test correctly reporting that a server which forgets is indistinguishable from a rollback. Making the fake stateful is what lets the second test mean something, because now \"the row came back\" can only be the rollback.",
          requires:
            "vitest with Testing Library and MSW (this is the source; the run is in the previous lesson)",
          alternates: [
            {
              lang: "tsx",
              title: "web/src/features/triage/TriageQueue.test.tsx",
              code: `it("removes a bug from the queue as soon as it is confirmed", async () => {
  /* The fake keeps state, because the real server does. Without this the
     refetch that follows the mutation hands the bug straight back and the
     test would be asserting against a server that forgot what it was told. */
  let triaged = false;
  server.use(
    http.get(\`\${API}/projects/:projectId/triage\`, () =>
      HttpResponse.json(triaged ? [] : bugs.filter((bug) => bug.status === "open")),
    ),
    http.post(\`\${API}/bugs/:id/triage\`, () => {
      triaged = true;
      return HttpResponse.json({ ...bugs[0], status: "confirmed" });
    }),
  );

  renderApp(<TriageQueue projectId="p_web" projectKey="WEB" />);
  await screen.findByRole("list");
  expect(screen.getByText("1 waiting")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  expect(await screen.findByText("0 waiting")).toBeInTheDocument();
});

it("puts the bug back when the server rejects the decision", async () => {
  server.use(
    http.post(\`\${API}/bugs/:id/triage\`, () =>
      HttpResponse.json({ error: "Already triaged: this bug is wontfix" }, { status: 409 }),
    ),
  );

  renderApp(<TriageQueue projectId="p_web" projectKey="WEB" />);
  await screen.findByRole("list");

  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  /* The optimistic removal must be undone, visibly, and the reason shown.
     An optimistic update without a rollback is a lie that survives until
     the next refetch. */
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Already triaged: this bug is wontfix",
  );
  expect(await screen.findByText("1 waiting")).toBeInTheDocument();
});`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A stateless fake makes a rollback test vacuous",
          body: "If the GET handler always returns the same array, then after any mutation the row reappears — whether the rollback ran or not. Both tests would pass with `onError` deleted entirely. The fake has to model the one thing the real server does that matters here: it remembers what it was told.",
        },
      ],
    },
    {
      id: "extending",
      heading: "Where to take it",
      body: [
        "The project is finished at this point, and finished is the right place to stop. These are the extensions that teach something rather than just adding screens.",
        "**Duplicate detection.** Two reports of the same bug is the most common thing in a real tracker. Add a `duplicateOf` column and a third triage outcome, and the interesting part is not the column — it is that the queue now needs to show candidate duplicates while you judge, which is a second query per row and therefore a real performance decision.",
        "**Authentication.** The seed picks a user; make people sign in. It changes no table, which is the point — `reporterId` and `authorId` were always there. What it does change is every mutation, because the client stops choosing who it is.",
        "**Optimistic locking.** Add a `version` column, send it with each PATCH, and refuse a stale one with a 409. Then watch what it does to the optimistic update in `useUpdateBug`, which currently has no idea it might be operating on an out-of-date bug.",
        "**Server-side pagination.** At six seeded bugs the list is one request. Add a cursor and it becomes a different data layer — and `keepPreviousData`, which was a nicety for filters, becomes the thing holding the page together.",
        "One rule if you do any of them: write the requirement first, numbered, in the same style as FR-1 to FR-13. The habit is the transferable part of this module, more than any line of the code.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When is a filtered view really a separate screen?",
      answer:
        "When more than the filter differs. Bug Tracker's triage queue has a different sort order, shows a different amount of each record, and offers different controls — three differences on the same table. Building it as a preset filter would push a sort parameter, an expanded row mode and a conditional button set into the list, all of which are dead weight there and all of which can end up in a shared URL producing a screen no requirement describes. The shared thing is the table; that is all it needs to be.",
    },
    {
      question: "Why rank the severities in SQL instead of sorting in JavaScript after fetching?",
      answer:
        "Because the ordering is part of the query, not part of the presentation. Sorting client-side means fetching every open bug in order to show the worst ten, which is fine at six rows and is the app's whole behaviour at forty thousand — and it makes pagination impossible, since you cannot ask for the first page of an order the server does not know. NFR-5 exists to prevent exactly this, and the queue is where the temptation is strongest because the sort looks like a display concern.",
    },
    {
      question: "This optimistic update removes a row. What is different about rolling that back?",
      answer:
        "A field change can be rolled back by writing the old value; a removal has to restore both the item and its position. Reversing the operation — re-inserting the bug — is only correct if nothing else changed meanwhile, and things can: a background refetch may have replaced the list, or the user may have triaged another bug before this one failed. Snapshotting the entire array in `onMutate` and writing it back in `onError` is correct under every interleaving and costs one reference.",
    },
    {
      question: "Your rollback test passed even with the rollback deleted. What was wrong?",
      answer:
        "The MSW handler was stateless, so the refetch after the mutation always returned the bug — the row reappeared whether the rollback ran or not, and the assertion could not tell those apart. The fix was to make the fake remember that it had been triaged, which is the one behaviour of the real server the test depends on. It is a general lesson about fakes: a fake that is simpler than the thing it stands in for is fine until the test's meaning depends on the part you simplified away.",
    },
  ],
  takeaways: [
    "Three differences on one table — order, content, controls — mean two screens, not one screen with a mode",
    "State an ordering the data has no natural sort for; alphabetical luck is not a design",
    "Pick seed data where two candidate orderings disagree, or the transcript proves nothing",
    "A work queue must show enough to decide without a round trip",
    "Rolling back a removal means restoring the snapshot, not reversing the operation",
    "A fake that forgets what it was told makes a rollback test vacuous",
  ],
  status: "available",
};
