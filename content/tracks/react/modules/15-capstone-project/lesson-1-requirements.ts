import type { Lesson } from "@/content/types";

export const capstoneRequirementsLesson: Lesson = {
  id: "react-capstone-requirements",
  slug: "tracer-requirements-and-architecture",
  moduleSlug: "capstone-project",
  title: "Tracer: Requirements & Architecture",
  summary:
    "You are building Tracer: a bug and task tracker for one small team — the shape of GitHub Issues, Jira or Linear, cut down to what a team of four actually uses. React and TypeScript in the browser, a real HTTP API, a real database. This lesson specifies it the way a project actually gets specified: numbered functional requirements, numbered non-functional ones, a data model, an API surface, and a stack chosen on stated grounds.",
  estimatedMinutes: 34,
  objectives: [
    "Know exactly what you are building: a small issue tracker, feature by feature",
    "Read a specification precise enough to build from without guessing",
    "Tell a functional requirement from a non-functional one, and why the split matters",
    "Derive a data model from requirements rather than from imagination",
    "Design an API surface that the client's screens actually need",
    "Justify every dependency in the stack, and name what each one replaces",
  ],
  sections: [
    {
      id: "the-brief",
      heading: "What you are building",
      body: [
        "**Tracer** — a bug and task tracker for one small team. If you have used GitHub Issues, Jira, Linear or Trello, you already know the product: a project holds issues, an issue has a title, a status, a priority, an assignee and a thread of comments, and the day-to-day is listing them, filtering them, opening one, moving it along and leaving a note.",
        "You will build the core of that. A list screen with three filters and a search box, a create form, a detail screen, a status control and comments — backed by an HTTP API you also write, over a database you also design.",
        "That is deliberately unglamorous, and it is deliberately not a todo list. A todo list has one entity and no relationships, so it never forces a decision. Tracer has four tables, two of them related to a third, a filter that has to run in SQL rather than in JavaScript, one mutation that should be optimistic and one that should not, and a piece of state — the filters — that belongs in the URL rather than in a component. Every one of those is a decision from an earlier module, arriving in a place where getting it wrong has a visible cost.",
        "The whole thing is roughly nine hundred lines across three packages. It is a weekend, not a quarter. The point is not size; it is that every line has a reason you can state.",
        "Two rules for the build, and they are the ones that make it worth doing at all. **Write the requirement number in the commit message**, so you can tell at the end what you built and what you drifted into. And **do not start the UI first** — the schema comes first, then the API, then the screens, because that is the direction the types flow.",
      ],
    },
    {
      id: "functional",
      heading: "Functional requirements",
      body: [
        "A functional requirement says what the system *does*. The test of a good one is that you can look at a running app and say yes or no without arguing. \"The list should be fast\" is not one of these; \"the list can be filtered by status\" is.",
        "**FR-1 — List issues.** Given a project, the app shows its issues, newest first, with the issue key (`WEB-4`), title, status, priority and assignee name.",
        "**FR-2 — Filter by status.** The list can be narrowed to one status. Clearing the filter restores the full list.",
        "**FR-3 — Filter by assignee.** The list can be narrowed to one person, or to anyone.",
        "**FR-4 — Search by title.** A text box narrows the list to issues whose title contains the text. It is debounced: typing twenty characters does not send twenty requests.",
        "**FR-5 — Filters are in the URL.** The filtered view has its own address. Reloading keeps it, sharing the link reproduces it, and the back button steps out of it. Twenty keystrokes in the search box do not become twenty history entries.",
        "**FR-6 — Create an issue.** A form takes a title and a priority. The server assigns the id, the per-project number and both timestamps. An invalid title is rejected with a message attached to the field, not to the page.",
        "**FR-7 — Open an issue.** A detail screen shows the full issue and its comments, at its own URL.",
        "**FR-8 — Change status.** A select on the detail screen changes the status. The change appears immediately and is reverted visibly if the server rejects it.",
        "**FR-9 — Comment.** Comments can be read and added on the detail screen, oldest first.",
        "**FR-10 — Four states everywhere.** Every screen that loads data renders a loading state, an error state with a retry, an empty state with something to do, and the success state. The empty state is the one that gets forgotten, so it is a numbered requirement.",
      ],
      pitfalls: [
        {
          title: "FR-5 is the one people skip, and the one that changes the code",
          body: "Filters in `useState` is four fewer lines and works perfectly until the first time someone wants to send a colleague \"the open bugs assigned to me\". Retrofitting URL state means changing the hook, the component that owns it, every call site that sets it, and the tests — because the filters stop being state and become *where you are*. Doing it on day one costs one custom hook. This is module 4's question (is this really state?) with a concrete answer.",
        },
      ],
    },
    {
      id: "non-functional",
      heading: "Non-functional requirements",
      body: [
        "A non-functional requirement says how the system must *behave* — the properties that no single feature owns and that no feature can restore once lost. They are the ones worth writing down precisely, because unlike a missing feature, a violated one is invisible until it is expensive.",
        "**NFR-1 — Typed end to end, with no `any`.** `strict` is on, and so is `noUncheckedIndexedAccess`. A type that describes a server response is *parsed* at the boundary, never cast.",
        "**NFR-2 — One definition of every shared shape.** The status vocabulary, the issue shape and the create-request shape are defined once, in a package both the server and the browser import. Adding a status is one edit.",
        "**NFR-3 — Validate on the server, always; on the client, as a convenience.** The client's check exists to save a round trip. The server's exists because the client's can be bypassed with one `curl`.",
        "**NFR-4 — One error shape.** Every failure — 400, 404, 500 — returns `{ error, fieldErrors? }`. The client has exactly one thing to render and never parses an HTML stack trace.",
        "**NFR-5 — Filtering happens in the database.** `WHERE status = ?`, not `.filter()` after fetching everything. The difference is invisible at four rows and is the entire behaviour of the app at forty thousand.",
        "**NFR-6 — No request storms.** Superseded requests are aborted, the search box is debounced, and the user list — which changes about never — is fetched once per session.",
        "**NFR-7 — Accessible by keyboard.** Every control is reachable and operable without a mouse. Errors are announced. Nothing interactive is a `<div>` with an `onClick`.",
        "**NFR-8 — No layout thrash on filter changes.** Changing a filter keeps the previous list on screen until the new one arrives, rather than collapsing the page to a spinner.",
        "**NFR-9 — Deterministic tests.** Tests fake the network, not the modules. No test depends on the order of another, and no test sleeps.",
        "**NFR-10 — Runs from a clean clone in three commands.** `npm install`, `npm run db:push && npm run db:seed`, `npm run dev`. A project that needs a paragraph of setup notes is a project nobody else will run.",
      ],
      pitfalls: [
        {
          title: "\"Parse, don't cast\" is NFR-1's real content",
          body: "`const issues = await response.json() as Issue[]` compiles, and it is a lie the compiler will now defend. Every downstream error message will point somewhere other than the wrong assumption. Parsing the response with the shared schema turns a backend change into one clear error at the boundary — the place that can actually explain it — instead of `Cannot read properties of undefined` three components away.",
        },
      ],
    },
    {
      id: "data-model",
      heading: "The data model",
      body: [
        "Four tables, and every column exists because a requirement asked for it.",
        "**`users`** — `id`, `name`, `email`. There is no authentication in this project; the seed creates two people and the app picks one. Adding auth is the obvious extension and it does not change any of the four tables.",
        "**`projects`** — `id`, `name`, `key`. The `key` is the `WEB` in `WEB-4` (FR-1).",
        "**`issues`** — `id`, `projectId`, `number`, `title`, `description`, `status`, `priority`, `assigneeId`, `createdAt`, `updatedAt`.",
        "**`comments`** — `id`, `issueId`, `authorId`, `body`, `createdAt`.",
        "Three decisions in that list are worth stating rather than absorbing.",
        "**`number` is not the primary key.** `WEB-4` is what people say out loud, but it is per-project and therefore not unique in the table, and a renumbering must never be able to break a foreign key. So `id` is the key the database uses and `number` is the one the humans use, and the pair `(projectId, number)` gets a unique index.",
        "**`assigneeId` is nullable; `authorId` is not.** An unassigned issue is a normal state — FR-1's list has one. An anonymous comment is not a state this app has. That distinction belongs in the schema, where it is enforced, rather than in a comment, where it is a hope.",
        "**Timestamps are ISO 8601 strings.** SQLite has no date type. A number would sort correctly and read as noise in every debugging session; an ISO string sorts lexicographically *and* is readable, which is why `ORDER BY created_at DESC` works on it directly.",
      ],
      pitfalls: [
        {
          title: "The index is not premature",
          body: "`issues` gets an index on `(project_id, created_at)` because FR-1 is exactly that query — one project, newest first — and it is the query that runs on every page load. This is the one place where guessing at the access pattern is safe, because the requirement wrote it down. Every other index should wait for a slow query you have actually seen.",
        },
      ],
    },
    {
      id: "api",
      heading: "The API surface",
      body: [
        "Eight endpoints, derived from the requirements rather than from a CRUD template. Each one exists because a screen needs it.",
        "`GET /api/projects` — the project list.",
        "`GET /api/users` — the people, for the assignee filter and for showing names (FR-1, FR-3).",
        "`GET /api/projects/:projectId/issues?status&assigneeId&q` — FR-1 through FR-4. All three filters are optional and all three are applied in SQL (NFR-5).",
        "`POST /api/projects/:projectId/issues` — FR-6. The body carries title, description, priority and assignee; everything else is the server's.",
        "`GET /api/issues/:id` — FR-7.",
        "`PATCH /api/issues/:id` — FR-8. A partial patch, and it must change at least one field.",
        "`GET /api/issues/:id/comments` — FR-9, oldest first.",
        "`POST /api/issues/:id/comments` — FR-9.",
        "Two things about that list are choices rather than conventions. The issue list is nested under its project because an issue list without a project is not a thing this app has, while a single issue is addressed directly — you have its id, and making the client remember which project it belonged to just to fetch it would be inventing work. And the update is `PATCH` rather than `PUT` because FR-8 changes one field: a `PUT` would require the client to send the whole issue back, which turns every edit into a lost-update race with anyone else editing it.",
        "Here is that surface answering for real. The filter is in the query string, the ordering is the index's ordering, and the validation failure comes back in the one error shape from NFR-4.",
      ],
      examples: [
        {
          id: "api-transcript",
          title: "The API, answering",
          lang: "bash",
          code: `# FR-2: one project, filtered to open issues, newest first
curl -s "$API/projects/p_web/issues?status=open" | jq

# FR-6 + NFR-3: a title that is only whitespace, and an invalid priority
curl -s -X POST "$API/projects/p_web/issues" \\
  -H 'content-type: application/json' \\
  -d '{"title":"  ","priority":"urgent"}' | jq`,
          output: `[
  {
    "id": "i_4",
    "projectId": "p_web",
    "number": 4,
    "title": "Keyboard focus is lost after deleting a row",
    "description": "Focus falls back to the body instead of the next row.",
    "status": "open",
    "priority": "medium",
    "assigneeId": null,
    "createdAt": "2026-03-04T09:00:00.000Z",
    "updatedAt": "2026-03-04T09:00:00.000Z"
  },
  {
    "id": "i_1",
    "projectId": "p_web",
    "number": 1,
    "title": "Filter chips lose state on reload",
    "description": "The status filter resets when the page is refreshed.",
    "status": "open",
    "priority": "high",
    "assigneeId": "u_ada",
    "createdAt": "2026-03-01T09:00:00.000Z",
    "updatedAt": "2026-03-01T09:00:00.000Z"
  }
]
{
  "error": "Invalid issue",
  "fieldErrors": {
    "title": "Title is required",
    "priority": "Invalid option: expected one of \\"low\\"|\\"medium\\"|\\"high\\""
  }
}`,
          explanation:
            "Two things to notice in the failure. Both problems are reported at once rather than one per round trip, and each is keyed by the field it belongs to — which is exactly the shape a form needs to put a message under an input. The wording is Zod's, generated from the schema; nobody wrote that sentence.",
          requires: "the capstone server running against a seeded database",
        },
      ],
    },
    {
      id: "stack",
      heading: "The stack, and what each piece replaces",
      body: [
        "Every dependency is a thing you now have to understand, so each one should be replacing more work than it adds. These are the choices and the grounds.",
        "**Vite + React 19 + TypeScript** — the scaffold from module 1. Nothing exotic.",
        "**TanStack Query** for server data. It replaces the `useEffect` fetch, and with it the four things that hand-rolled fetch always gets wrong eventually: caching, deduplication, the loading/error bookkeeping, and cancelling a request whose answer is no longer wanted. Module 7 argued this; here it is load-bearing.",
        "**React Router** for the routes and — the reason it matters here — for `useSearchParams`, which is what makes FR-5 possible without hand-writing history management.",
        "**Zod** for the schemas. It is the only library that appears in all three packages, because it is the one that lets a single declaration produce both a runtime validator and a TypeScript type. That is NFR-2's entire mechanism.",
        "**Hono** for the server. A small router with a `fetch`-shaped handler signature, which means the request and response objects are the web ones you already know.",
        "**Drizzle + SQLite** for storage. Drizzle generates the TypeScript types from the table definitions, so a column rename is a compile error in the queries. SQLite is a file, which is what makes NFR-10 possible — there is no database server to install.",
        "What is deliberately *not* here: no state management library (server data belongs to Query, and the rest is URL state or local state), no component library (NFR-7 is the exercise), no CSS framework, and no authentication. Each of those is a reasonable addition to a real product and each would obscure something this project exists to teach.",
      ],
      visual: {
        id: "capstone-workspaces",
        kind: "react-structure",
        algorithm: "capstone-workspace",
        lockAlgorithm: true,
        title: "Three packages, and why the third one exists",
      },
      pitfalls: [
        {
          title: "The shared package holds no behaviour",
          body: "It is tempting to put helpers in it — a date formatter, an issue-key builder. Don't, at least not at first. The moment it contains code that runs, it acquires the question of *where* that code runs, and a package imported by both a Node process and a browser bundle is the worst place to have to answer it. Schemas and the types inferred from them are safe because they are the same on both sides by construction.",
        },
      ],
    },
    {
      id: "what-to-build-first",
      heading: "The build order",
      body: [
        "Types flow in one direction, so build in that direction and you never write a line against a shape you have not defined.",
        "**1. `shared/src/issue.ts`.** Every schema. Nothing imports anything yet, and at the end of this step `Issue`, `Status` and `CreateIssue` all exist as types.",
        "**2. The database schema, then push and seed.** Now there are rows to look at.",
        "**3. The routes, verified with `curl`.** The API is finished and demonstrable before a single component exists. This is the step people skip, and skipping it means debugging the server through the UI — two unknowns at once.",
        "**4. `lib/api.ts` and `lib/queryKeys.ts`.** The client's two singletons: one place that fetches, one place that names a cache entry.",
        "**5. The list screen** — FR-1, then 2, 3, 4, 5, 10.",
        "**6. The detail screen** — FR-7, 8, 9.",
        "**7. The tests.** Last, and only for the list screen, which is the one with the most branches.",
        "The three lessons that follow are steps 1 to 3, step 4, and steps 5 to 7 — with the actual code.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a functional and a non-functional requirement?",
      answer:
        "A functional requirement is something the system does, checkable by looking at it — \"the list can be filtered by status\". A non-functional one is a property of how it behaves that no single feature owns — typed end to end, one error shape, filtering in SQL, accessible by keyboard. The practical difference is that a missing feature is obvious and a violated property is invisible until it is expensive, which is why the non-functional ones are the ones worth numbering. They are also the ones that cannot be added later: retrofitting URL state or a consistent error shape means touching every screen.",
    },
    {
      question: "Why is the human-readable issue number not the primary key?",
      answer:
        "Because it is per-project, so it is not unique in the table, and because a renumbering must never be able to break a foreign key. The id is what the database and every relationship use; the number is what people say out loud. The pair (project_id, number) gets a unique index so the app-facing identifier is still guaranteed unique where it needs to be. It is the same reasoning as using a surrogate key anywhere else: identifiers people can see are identifiers people will eventually want to change.",
    },
    {
      question: "Why put the filters in the URL rather than in state?",
      answer:
        "Because they are not state, they are where you are. Putting them in the URL makes the view shareable, survivable across a reload, and navigable with the back button — three features that cost one custom hook on day one and cannot be retrofitted cheaply, because the retrofit changes the hook, its owner, every call site and every test. The one subtlety is history: filter changes use replace rather than push, so twenty keystrokes in a search box do not become twenty back-button presses.",
    },
    {
      question: "How do you decide whether a dependency is worth adding?",
      answer:
        "By naming what it replaces and comparing that with what it costs to understand. TanStack Query replaces caching, deduplication, loading and error bookkeeping, and request cancellation — four things that hand-rolled fetch code gets wrong eventually — so it earns its place. A state management library in this project would replace nothing, because server data belongs to the query cache and everything else is URL state or local state. The test is not popularity; it is whether you can say what would be worse without it.",
    },
  ],
  takeaways: [
    "A functional requirement is checkable by looking; a non-functional one is a property no feature owns",
    "Number them, and put the number in the commit message",
    "Four tables, and every column traceable to a requirement",
    "The identifier people read and the identifier the database uses are different columns",
    "Nullable where a null is a real state; not-null where it never is",
    "Filter in SQL, not in JavaScript after fetching everything",
    "One error shape for every failure, keyed by field",
    "Parse responses at the boundary; a cast is a lie the compiler will defend",
    "Every dependency should replace more work than it adds — say what",
    "Build in the direction the types flow: schema, database, API, then screens",
  ],
  status: "available",
};
