import type { Lesson } from "@/content/types";

export const capstoneRequirementsLesson: Lesson = {
  id: "react-capstone-requirements",
  slug: "bug-tracker-requirements-and-architecture",
  moduleSlug: "capstone-project",
  title: "Bug Tracker: Requirements & Architecture",
  summary:
    "You are building Bug Tracker: an issue tracker for one small team — the shape of Bugzilla, Jira or GitHub Issues, cut down to what a team of four actually uses to decide which bugs are real and which one to fix next. React and TypeScript in the browser, a real HTTP API, a real database. This lesson specifies it the way a project actually gets specified: numbered functional requirements, numbered non-functional ones, a data model, an API surface, and a stack chosen on stated grounds.",
  estimatedMinutes: 32,
  objectives: [
    "Know exactly what you are building: a small bug tracker, feature by feature",
    "Read a specification precise enough to build from without guessing",
    "Tell a functional requirement from a non-functional one, and why the split matters",
    "Model a bug report as the thing that makes it reproducible, not as a title and a note",
    "Derive a data model from requirements rather than from imagination",
    "Design an API surface that the client's screens actually need",
  ],
  sections: [
    {
      id: "the-brief",
      heading: "What you are building",
      body: [
        "**Bug Tracker** — an issue tracker for one small team. Not a task tracker, not a kanban board, not a todo list with statuses: a place where people report that the software did the wrong thing, and where somebody decides whether each report is real and how bad it is.",
        "If you have used Bugzilla, Jira or GitHub Issues, you know the product. Somebody hits a problem and files a report. The report says what they did, what should have happened, what happened instead, and where — because a bug you cannot reproduce is not a bug you can fix. Somebody else reads the new reports, decides which are genuine, and the team works down the confirmed ones worst-first.",
        "You will build that. A list screen with filters and a search box, a report form, a detail screen with a status control and comments, and a **triage queue** — the screen a maintainer opens first, holding every report nobody has looked at yet, worst first and oldest first within that.",
        "That is deliberately unglamorous, and it is deliberately not a todo list. A todo list has one entity and no relationships, so it never forces a decision. Bug Tracker has four tables, two of them related to a third, filters that have to run in SQL rather than in JavaScript, a queue with a sort order the database has to express, two mutations that should be optimistic in different ways and one that should not be optimistic at all, and a piece of state — the filters — that belongs in the URL rather than in a component. Every one of those is a decision from an earlier module, arriving somewhere getting it wrong has a visible cost.",
        "The whole thing is roughly a thousand lines across three packages. It is a weekend, not a quarter. The point is not size; it is that every line has a reason you can state.",
        "Two rules for the build, and they are the ones that make it worth doing at all. **Write the requirement number in the commit message**, so you can tell at the end what you built and what you drifted into. And **do not start the UI first** — the schema comes first, then the API, then the screens, because that is the direction the types flow.",
      ],
      pitfalls: [
        {
          title: "A bug tracker is not an issue tracker with the word changed",
          body: "An issue is anything somebody wants done, so its only required field is a title. A bug report is a *claim that the software is wrong*, and a claim nobody can reproduce is worthless — so steps, expected, actual and environment are not nice-to-haves, they are the report. Modelling them as one free-text `description` is the single decision that makes a bug tracker degrade into a list of complaints, because the fields nobody is forced to fill in are the fields nobody fills in.",
        },
      ],
    },
    {
      id: "functional",
      heading: "Functional requirements",
      body: [
        "A functional requirement says what the system *does*. The test of a good one is that you can look at a running app and say yes or no without arguing. \"Triage should be easy\" is not one of these; \"the triage queue shows open bugs worst first\" is.",
        "**FR-1 — List bugs.** Given a project, the app shows its bugs, newest first, with the bug key (`WEB-4`), title, severity, status and assignee name.",
        "**FR-2 — Filter by status.** The list can be narrowed to one status. Clearing the filter restores the full list.",
        "**FR-3 — Filter by severity.** The list can be narrowed to one severity.",
        "**FR-4 — Filter by assignee.** The list can be narrowed to one person, or to anyone.",
        "**FR-5 — Search by title.** A text box narrows the list to bugs whose title contains the text. It is debounced: typing twenty characters does not send twenty requests.",
        "**FR-6 — Filters are in the URL.** The filtered view has its own address. Reloading keeps it, sharing the link reproduces it, and the back button steps out of it. Twenty keystrokes in the search box do not become twenty history entries.",
        "**FR-7 — Report a bug.** A form takes a title, steps to reproduce, expected behaviour, actual behaviour, environment and severity. The server assigns the id, the per-project number, the starting status and both timestamps. An invalid field is rejected with a message attached to that field, not to the page.",
        "**FR-8 — Open a bug.** A detail screen shows the full report and its comments, at its own URL.",
        "**FR-9 — Change status.** A select on the detail screen moves the bug along its life. The change appears immediately and is reverted visibly if the server rejects it.",
        "**FR-10 — Comment.** Comments can be read and added on the detail screen, oldest first.",
        "**FR-11 — The triage queue.** A screen lists every bug still `open` for a project — the ones nobody has judged yet — ordered by severity worst-first, and within a severity oldest-first. It shows enough of each report to judge it without opening it: the steps, the expected and actual behaviour, and the environment.",
        "**FR-12 — Triage a bug.** From the queue, a bug can be **confirmed** (it is real; it joins the work) or marked **won't fix** (it is not, or not now). Both remove it from the queue. Triaging a bug that has already been triaged is refused, and the refusal is shown.",
        "**FR-13 — Four states everywhere.** Every screen that loads data renders a loading state, an error state with a retry, an empty state with something to do, and the success state. The empty state is the one that gets forgotten, so it is a numbered requirement.",
      ],
      pitfalls: [
        {
          title: "FR-6 is the one people skip, and the one that changes the code",
          body: "Filters in `useState` is four fewer lines and works perfectly until the first time someone wants to send a colleague \"the open blockers assigned to me\". Retrofitting URL state means changing the hook, the component that owns it, every call site that sets it, and the tests — because the filters stop being state and become *where you are*. Doing it on day one costs one custom hook. This is module 4's question (is this really state?) with a concrete answer.",
        },
        {
          title: "FR-11 is not FR-2 with `status=open`",
          body: "It is tempting to make the triage queue a link to the list with a filter preset. It is a different screen: a different sort order (severity, then age — the list is newest-first), a different amount of each bug on show (the whole report, because you are judging it), and different controls. Building it as a filtered list means either the list grows a sort mode nothing else uses, or triage gets the wrong order. Two screens, two queries, one table.",
        },
      ],
    },
    {
      id: "non-functional",
      heading: "Non-functional requirements",
      body: [
        "A non-functional requirement says how the system must *behave* — the properties that no single feature owns and that no feature can restore once lost. They are the ones worth writing down precisely, because unlike a missing feature, a violated one is invisible until it is expensive.",
        "**NFR-1 — Typed end to end, with no `any`.** `strict` is on, and so is `noUncheckedIndexedAccess`. A type that describes a server response is *parsed* at the boundary, never cast.",
        "**NFR-2 — One definition of every shared shape.** The status vocabulary, the severity vocabulary, the bug shape and the report shape are defined once, in a package both the server and the browser import. Adding a severity is one edit.",
        "**NFR-3 — Validate on the server, always; on the client, as a convenience.** The client's check exists to save a round trip. The server's exists because the client's can be bypassed with one `curl`.",
        "**NFR-4 — One error shape.** Every failure — 400, 404, 409, 500 — returns `{ error, fieldErrors? }`. The client has exactly one thing to render and never parses an HTML stack trace.",
        "**NFR-5 — Filtering and ordering happen in the database.** `WHERE status = ?` and `ORDER BY`, not `.filter()` and `.sort()` after fetching everything. The difference is invisible at six rows and is the entire behaviour of the app at forty thousand.",
        "**NFR-6 — No request storms.** Superseded requests are aborted, the search box is debounced, and the user list — which changes about never — is fetched once per session.",
        "**NFR-7 — Accessible by keyboard.** Every control is reachable and operable without a mouse. Errors are announced. Nothing interactive is a `<div>` with an `onClick`.",
        "**NFR-8 — No layout thrash on filter changes.** Changing a filter keeps the previous list on screen until the new one arrives, rather than collapsing the page to a spinner.",
        "**NFR-9 — Deterministic tests.** Tests fake the network, not the modules. No test depends on the order of another, and no test sleeps.",
        "**NFR-10 — Runs from a clean clone in three commands.** `npm install`, `npm run db:push && npm run db:seed`, `npm run dev`. A project that needs a paragraph of setup notes is a project nobody else will run.",
      ],
      pitfalls: [
        {
          title: "\"Parse, don't cast\" is NFR-1's real content",
          body: "`const bugs = await response.json() as Bug[]` compiles, and it is a lie the compiler will now defend. Every downstream error message will point somewhere other than the wrong assumption. Parsing the response with the shared schema turns a backend change into one clear error at the boundary — the place that can actually explain it — instead of `Cannot read properties of undefined` three components away.",
        },
      ],
    },
    {
      id: "data-model",
      heading: "The data model",
      body: [
        "Four tables, and every column exists because a requirement asked for it.",
        "**`users`** — `id`, `name`, `email`. There is no authentication in this project; the seed creates three people and the app picks one. Adding auth is the obvious extension and it does not change any of the four tables.",
        "**`projects`** — `id`, `name`, `key`. The `key` is the `WEB` in `WEB-4` (FR-1).",
        "**`bugs`** — `id`, `projectId`, `number`, `title`, `stepsToReproduce`, `expected`, `actual`, `environment`, `severity`, `status`, `reporterId`, `assigneeId`, `createdAt`, `updatedAt`.",
        "**`comments`** — `id`, `bugId`, `authorId`, `body`, `createdAt`.",
        "Five decisions in that list are worth stating rather than absorbing.",
        "**The report is four columns, not one.** `stepsToReproduce`, `expected`, `actual` and `environment` are separate and all four are `NOT NULL`. A schema is the only place the requirement \"a report must be reproducible\" survives contact with a hurried reporter — put them in one `description` box and half your reports will say \"it's broken\".",
        "**Severity and status are different axes.** `severity` is how much damage the bug does — `blocker`, `major`, `minor`, `trivial` — and it barely changes after triage. `status` is where the bug is in its life: `open`, `confirmed`, `in_progress`, `fixed`, `closed`, `wontfix`. Collapsing them into one \"priority\" field is the most common modelling mistake in this domain, and it makes FR-11 impossible to express, because the queue needs *both*: still `open`, worst `severity` first.",
        "**`number` is not the primary key.** `WEB-4` is what people say out loud, but it is per-project and therefore not unique in the table, and a renumbering must never be able to break a foreign key. So `id` is the key the database uses and `number` is the one the humans use, and the pair `(projectId, number)` gets a unique index.",
        "**`assigneeId` is nullable; `reporterId` is not.** An unassigned bug is a normal state — everything in the triage queue is one. A bug nobody reported is not a state this app has. That distinction belongs in the schema, where it is enforced, rather than in a comment, where it is a hope.",
        "**Timestamps are ISO 8601 strings.** SQLite has no date type. A number would sort correctly and read as noise in every debugging session; an ISO string sorts lexicographically *and* is readable, which is why `ORDER BY created_at` works on it directly.",
      ],
      pitfalls: [
        {
          title: "The indexes are not premature",
          body: "`bugs` gets an index on `(project_id, created_at)` because FR-1 is exactly that query, and a second on `(project_id, status, severity)` because FR-11 is exactly that one. Both run on every page load of their screen. This is the one place where guessing at the access pattern is safe, because the requirement wrote it down. Every other index should wait for a slow query you have actually seen.",
        },
      ],
    },
    {
      id: "api",
      heading: "The API surface",
      body: [
        "Ten endpoints, derived from the requirements rather than from a CRUD template. Each one exists because a screen needs it.",
        "`GET /api/projects` — the project list.",
        "`GET /api/users` — the people, for the assignee filter and for showing names (FR-1, FR-4).",
        "`GET /api/projects/:projectId/bugs?status&severity&assigneeId&q` — FR-1 through FR-5. All four filters are optional and all four are applied in SQL (NFR-5).",
        "`GET /api/projects/:projectId/triage` — FR-11. Its own endpoint, with its own order.",
        "`POST /api/projects/:projectId/bugs` — FR-7.",
        "`GET /api/bugs/:id` — FR-8.",
        "`PATCH /api/bugs/:id` — FR-9. A partial patch, and it must change at least one field.",
        "`POST /api/bugs/:id/triage` — FR-12.",
        "`GET /api/bugs/:id/comments` — FR-10, oldest first.",
        "`POST /api/bugs/:id/comments` — FR-10.",
        "Three things about that list are choices rather than conventions. The bug list is nested under its project because a bug list without a project is not a thing this app has, while a single bug is addressed directly — you have its id, and making the client remember which project it belonged to just to fetch it would be inventing work. The update is `PATCH` rather than `PUT` because FR-9 changes one field: a `PUT` would require the client to send the whole bug back, which turns every edit into a lost-update race with anyone else editing it.",
        "And **triage is its own endpoint rather than a `PATCH` of `status`**, which is the one worth arguing about. Triage is not an edit, it is a decision with a rule attached: only an `open` bug can be triaged, and the only two answers are `confirmed` and `wontfix`. Expressed as a general `PATCH`, that rule has nowhere to live — the client could move a `fixed` bug back to `open` by sending the wrong field, and the server would have to reconstruct which transition was intended in order to refuse it. As its own endpoint it is one branch: is this bug still open?",
        "Here is that surface answering for real. The triage order, a rejected report, and the refusal when the same bug is triaged twice.",
      ],
      examples: [
        {
          id: "api-transcript",
          title: "The API, answering",
          lang: "bash",
          code: `# FR-11: the triage queue — still open, worst first, then oldest
curl -s "$API/projects/p_web/triage" | jq '[.[] | {number, severity, title}]'

# FR-7 + NFR-3: a report that says "it broke" and nothing else
curl -s -X POST "$API/projects/p_web/bugs" \\
  -H 'content-type: application/json' \\
  -d '{"title":"crash","stepsToReproduce":"it broke","expected":"",
       "actual":"","environment":"","severity":"urgent","reporterId":"u_ada"}' | jq

# FR-12: triaging a bug that was already triaged
curl -s -X POST "$API/bugs/b_3/triage" \\
  -H 'content-type: application/json' -d '{"outcome":"confirmed"}' | jq`,
          output: `[
  {
    "number": 1,
    "severity": "blocker",
    "title": "Checkout total ignores the discount code"
  },
  {
    "number": 5,
    "severity": "minor",
    "title": "Tooltip text overflows its box in German"
  },
  {
    "number": 3,
    "severity": "trivial",
    "title": "Avatar is stretched on the profile card"
  }
]
{
  "error": "Invalid bug report",
  "fieldErrors": {
    "stepsToReproduce": [
      "Say what you did, in enough detail to repeat it"
    ],
    "expected": [
      "Say what should have happened"
    ],
    "actual": [
      "Say what happened instead"
    ],
    "environment": [
      "Name the browser and OS"
    ],
    "severity": [
      "Invalid option: expected one of \\"blocker\\"|\\"major\\"|\\"minor\\"|\\"trivial\\""
    ]
  }
}
{
  "error": "Already triaged: this bug is wontfix"
}`,
          explanation:
            "Read the first block against FR-11 rather than against the data. `WEB-1` is a blocker from the 1st, `WEB-5` is a minor from the 5th, `WEB-3` is trivial from the 3rd — so the order is severity first and date second, which is the requirement and *not* what `ORDER BY severity, created_at` would give you, because `blocker` and `trivial` do not sort alphabetically into the order you want. The second block is the point of separate columns: the reporter wrote something in the title and gave up, and five fields say so by name. The third is FR-12's rule, refused with a 409 — the state is in the message because \"already triaged\" without saying *what* it was triaged as sends the reader back to the list to find out.",
          requires: "the server running, with $API set to http://localhost:8787/api",
        },
      ],
      pitfalls: [
        {
          title: "`fieldErrors` maps a field to a *list*",
          body: "One field can fail two rules at once — too short and containing a control character — and a shape of `Record<string, string>` forces the server to throw one of them away, always the second. `Record<string, string[]>` costs nothing now and is a schema migration later, because every form in the client will have unpacked it as a string.",
        },
      ],
    },
    {
      id: "stack",
      heading: "The stack, and what each piece replaces",
      body: [
        "Every dependency is a thing you no longer control, so each one should be answerable. These are the answers.",
        "**Zod** — because NFR-1 and NFR-3 both want the same shape twice, once as a TypeScript type and once as a runtime check, and writing them separately means they drift. One schema produces both.",
        "**Hono** — a small HTTP router. It replaces about eighty lines of `node:http` request matching, and its `Context` is typed, so a handler that returns the wrong shape does not compile.",
        "**Drizzle + libSQL** — the schema is TypeScript, so the column vocabulary is the *same* `as const` array the client imports (NFR-2) rather than a string that happens to match. libSQL rather than `better-sqlite3` because the latter needs Node 22 and a native build; libSQL is the same SQLite over a client that installs everywhere.",
        "**TanStack Query** — because NFR-6, NFR-8 and FR-9 are all cache questions, and hand-rolling request cancellation, deduplication, previous-data retention and optimistic rollback is how you find out what a cache library is for.",
        "**React Router** — FR-6 makes the URL part of the app's state, which means a router is not decoration here; it is where the filters live.",
        "**Vitest, Testing Library and MSW** — NFR-9 says the tests fake the network, not the modules. MSW is what makes that possible: nothing in a test knows the app uses `fetch`.",
        "Nothing here is a framework decision you are stuck with. Swap Hono for Express and the client does not change; swap TanStack Query for something else and the components do, which is itself worth noticing — it tells you where the coupling actually is.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why separate severity from status, when a single \"priority\" field is simpler?",
      answer:
        "They answer different questions and change at different times. Severity is a property of the bug — how much damage it does — and is set at report time by someone who saw it. Status is a property of the *work*, and moves as the team works. Merging them means a bug that is being fixed can no longer say how bad it was, so the triage queue (FR-11) cannot be expressed at all: it needs \"still unjudged\" and \"worst first\" at the same time. It also makes reporting impossible — you can no longer ask how many blockers shipped last quarter, because the field was overwritten the moment work started.",
    },
    {
      question: "Why is triage a POST to its own endpoint rather than a PATCH of the status field?",
      answer:
        "Because triage carries a rule, and a general PATCH has nowhere to put it. Only an `open` bug may be triaged and the only outcomes are `confirmed` and `wontfix`; as a PATCH the server would have to infer, from a status field it accepts in general, which transitions were meant to be triage decisions and which were ordinary edits, and refuse only the first kind. As its own endpoint the rule is one branch — `if (bug.status !== \"open\") return 409` — and the request cannot express an illegal outcome, because the body only has two legal values.",
    },
    {
      question: "The triage queue and the bug list read the same table. Why are they different endpoints?",
      answer:
        "Because they are different questions. The list is newest-first and paginated by recency; the queue is worst-severity-first then oldest, because it is a work queue and the oldest unjudged report has been failing someone longest. Two orders means either two endpoints or one endpoint with a sort parameter, and the sort parameter is worse: it puts a mode switch in the client, gives the list a sort order nothing uses, and makes the cache key of the two screens differ by a value rather than by name. Separate endpoints also let the queue's index be exactly the queue's query.",
    },
    {
      question: "Why do the filters go in the URL rather than in component state?",
      answer:
        "Because they are not state, they are location. Three things follow from that and none of them are available from `useState`: the filtered view can be linked to and shared, a reload preserves it, and the back button steps out of it. The cost is one hook that reads and writes `useSearchParams`. The cost of adding it later is every component that reads or sets a filter, plus their tests, because the ownership of the value changes.",
    },
    {
      question: "What does \"parse, don't cast\" cost, and what does it buy?",
      answer:
        "It costs one schema parse per response and it buys the error message. A cast tells the compiler to stop checking, so when the server changes a field the failure surfaces later and elsewhere — usually as `undefined` inside a component that had nothing to do with it. Parsing fails at the boundary, names the field and the expected type, and does it in the one place that can explain what happened. In a project where the schema is already written for validation (NFR-3), the parse is free anyway: you own the schema.",
    },
  ],
  takeaways: [
    "A bug report is steps, expected, actual and environment — modelling it as a description is what turns a bug tracker into a complaints box",
    "Severity is how bad it is; status is where it is. Merging them makes the triage queue inexpressible",
    "Functional requirements are checkable by looking; non-functional ones are invisible until they are expensive",
    "A decision with a rule attached — like triage — deserves its own endpoint, so the rule has somewhere to live",
    "Filters belong in the URL, because they describe where you are rather than what a component remembers",
    "Every dependency should be answerable with the thing it replaces",
  ],
  status: "available",
};
