import type { Lesson } from "@/content/types";

export const capstoneBackendLesson: Lesson = {
  id: "react-capstone-backend",
  slug: "tracer-structure-types-and-backend",
  moduleSlug: "capstone-project",
  title: "Tracer: Folder Structure, Shared Types & the Backend",
  summary:
    "Steps one to three of the build. The complete folder map for all three packages, the Zod schemas that both sides import, the database schema those vocabularies generate, and the ten routes — including the two that carry rules rather than data: the triage queue's ordering, and triage itself.",
  estimatedMinutes: 40,
  objectives: [
    "Lay out a three-package workspace and say what belongs in each",
    "Write schemas that produce a runtime validator and a TypeScript type from one declaration",
    "Model a report as its own schema rather than a partial of the entity",
    "Define a database schema whose vocabulary cannot drift from the app's",
    "Write routes that validate, filter in SQL, and fail in one shape",
    "Express an ordering the database has no natural sort for",
  ],
  sections: [
    {
      id: "layout",
      heading: "The complete folder map",
      body: [
        "Every file in the finished project, with what each one is for. There are fifty-odd of them and about a third are configuration, which is worth seeing plainly — a real project is not all components.",
        "The three packages are linked by npm workspaces, which means `@tracer/shared` is a normal import in both of the others and `npm install` at the root wires it up with no build step and no publishing.",
      ],
      examples: [
        {
          id: "tree",
          title: "The whole project",
          lang: "bash",
          code: `tracer/
├── package.json                     # workspaces: shared, server, web
├── tsconfig.base.json               # strict settings, written once
├── tsconfig.json                    # project references, for \`tsc -b\`
│
├── shared/                          # imported by both of the others
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # re-exports bug.ts
│       └── bug.ts                   # every schema and every type
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── src/
│       ├── index.ts                 # the app, CORS, 404 and 500
│       ├── errors.ts                # the one error shape (NFR-4)
│       ├── db/
│       │   ├── schema.ts            # four tables, three indexes
│       │   ├── index.ts             # the client
│       │   └── seed.ts              # fixed ids, fixed timestamps
│       └── routes/
│           ├── meta.ts              # projects, users
│           └── bugs.ts              # the other eight
│
└── web/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts               # also the Vitest config
    ├── index.html
    └── src/
        ├── main.tsx                 # providers, and nothing else
        ├── App.tsx                  # the routes
        ├── vite-env.d.ts
        ├── lib/
        │   ├── api.ts               # fetch, parse, one failure type
        │   └── queryKeys.ts         # every cache key, in one table
        ├── hooks/
        │   ├── useBugFilters.ts     # the URL is the state (FR-6)
        │   ├── useDebounced.ts
        │   ├── useUsers.ts
        │   ├── useBugs.ts           # the list, and the triage queue
        │   ├── useBug.ts            # one bug, its comments, its edits
        │   ├── useCreateBug.ts
        │   └── useTriage.ts
        ├── components/
        │   └── AsyncBoundary.tsx    # the four states (FR-13)
        ├── features/
        │   ├── bugs/
        │   │   ├── BugList.tsx
        │   │   ├── BugList.test.tsx
        │   │   ├── BugRow.tsx
        │   │   ├── BugFilters.tsx
        │   │   ├── BugDetail.tsx
        │   │   └── NewBugForm.tsx
        │   └── triage/
        │       ├── TriageQueue.tsx
        │       └── TriageQueue.test.tsx
        └── test/
            ├── setup.ts             # MSW lifecycle
            ├── server.ts            # the handlers
            ├── fixtures.ts
            └── render.tsx           # providers, per test`,
          explanation:
            "Three groupings are doing work here. `lib/` is code that would still make sense in a different app — a fetch wrapper, a key table. `hooks/` is this app's data layer: everything that knows about TanStack Query lives here and nowhere else, which is why swapping it out would be a contained change. `features/` is the app itself, grouped by the thing it is about rather than by what kind of file it is, so `bugs/` and `triage/` are the two areas and a `components/BugRow.tsx` folder full of unrelated pieces never forms.",
          requires: "nothing — this is the finished tree, for reference",
        },
      ],
      pitfalls: [
        {
          title: "`shared` has no build step, and that is the point",
          body: "Its `package.json` points `main` and `types` straight at `src/index.ts`. Both consumers are bundled (Vite) or run through a TypeScript-aware runtime (tsx), so neither needs compiled JavaScript, and adding a build step would mean every schema change needs a rebuild before the other packages see it. The one thing it does emit is declarations, for `tsc -b`'s project references.",
        },
      ],
    },
    {
      id: "shared-schemas",
      heading: "The shared package: one declaration, two outputs",
      body: [
        "NFR-2 says every shared shape is defined once. This is that file. Each schema produces a runtime validator *and* a TypeScript type, so there is no way for the check and the type to disagree — they are the same object.",
        "Start with the vocabularies, because everything else refers to them and because they are what the database columns will be built from.",
      ],
      examples: [
        {
          id: "vocab",
          title: "shared/src/bug.ts — the vocabularies",
          lang: "typescript",
          code: `import { z } from "zod";

/* The vocabularies. Every one of these is defined once, here, and imported by
   both the server and the browser — NFR-2. Adding a severity is one edit. */

/** Where a bug is in its life. Triage moves \`open\` to \`confirmed\` or \`wontfix\`. */
export const bugStatuses = [
  "open",
  "confirmed",
  "in_progress",
  "fixed",
  "closed",
  "wontfix",
] as const;
export const BugStatus = z.enum(bugStatuses);
export type BugStatus = z.infer<typeof BugStatus>;

/** How much damage the bug does, which is not the same as how urgent it is. */
export const bugSeverities = ["blocker", "major", "minor", "trivial"] as const;
export const BugSeverity = z.enum(bugSeverities);
export type BugSeverity = z.infer<typeof BugSeverity>;

/** A status a bug can be moved to from \`open\` during triage. */
export const triageOutcomes = ["confirmed", "wontfix"] as const;
export const TriageOutcome = z.enum(triageOutcomes);
export type TriageOutcome = z.infer<typeof TriageOutcome>;`,
          explanation:
            "Each vocabulary is exported three times over and every one has a use. The `as const` array is what the `<select>` maps over and what the database column's `enum` is built from, so neither can list an option the other does not have. The Zod schema is what parses a value arriving from outside. The type is what everything else is annotated with. `TriageOutcome` being its own two-value vocabulary rather than a subset of `BugStatus` is what makes an illegal triage request unrepresentable rather than merely refused.",
          requires: "tsc (this file only declares; it prints nothing)",
        },
        {
          id: "entities",
          title: "The entities",
          lang: "typescript",
          code: `export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});
export type User = z.infer<typeof User>;

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
});
export type Project = z.infer<typeof Project>;

/* A bug report is a claim that the software did the wrong thing. The three
   fields that make it actionable — what you did, what should have happened,
   what did — are separate columns rather than one description, because a
   report missing any one of them cannot be reproduced, and a schema is the
   only place that requirement survives contact with a hurried reporter. */
export const Bug = z.object({
  id: z.string(),
  projectId: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  stepsToReproduce: z.string(),
  expected: z.string(),
  actual: z.string(),
  environment: z.string(),
  severity: BugSeverity,
  status: BugStatus,
  reporterId: z.string(),
  assigneeId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Bug = z.infer<typeof Bug>;

export const Comment = z.object({
  id: z.string(),
  bugId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export type Comment = z.infer<typeof Comment>;`,
          explanation:
            "`assigneeId` is `.nullable()` and `reporterId` is not, and that one-word difference is the data model's opinion showing up in the type system: every screen that renders an assignee is now forced by the compiler to say what an unassigned bug looks like, and no screen is ever forced to handle a bug that nobody reported.",
          requires: "tsc (this file only declares; it prints nothing)",
        },
      ],
    },
    {
      id: "requests",
      heading: "Request schemas are not partial entities",
      body: [
        "The shape a client may *send* is a different shape from the thing it becomes. `Bug.partial()` would be shorter and would be wrong: it would let a client choose its own `id`, set `number` to 9000, backdate `createdAt`, and file a bug that is already `fixed`.",
        "So each request gets its own schema, listing exactly the fields the client owns.",
      ],
      examples: [
        {
          id: "request-schemas",
          title: "What a client may send",
          lang: "typescript",
          code: `export const CreateBug = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(120),
  stepsToReproduce: z.string().trim().min(10, "Say what you did, in enough detail to repeat it"),
  expected: z.string().trim().min(3, "Say what should have happened"),
  actual: z.string().trim().min(3, "Say what happened instead"),
  environment: z.string().trim().min(3, "Name the browser and OS"),
  severity: BugSeverity,
  reporterId: z.string().min(1),
  assigneeId: z.string().nullable().optional(),
});
export type CreateBug = z.infer<typeof CreateBug>;

export const UpdateBug = z
  .object({
    status: BugStatus.optional(),
    severity: BugSeverity.optional(),
    assigneeId: z.string().nullable().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Send at least one field to change",
  });
export type UpdateBug = z.infer<typeof UpdateBug>;

export const CreateComment = z.object({
  authorId: z.string().min(1),
  body: z.string().trim().min(1, "A comment cannot be empty").max(2000),
});
export type CreateComment = z.infer<typeof CreateComment>;

/* The list query. \`.catch()\` rather than \`.optional()\`: a filter arriving from
   a URL someone edited by hand should fall back to "no filter" rather than
   fail the request — FR-6 puts these in the address bar, so they are user
   input in the most literal sense. */
export const BugQuery = z.object({
  status: BugStatus.optional().catch(undefined),
  severity: BugSeverity.optional().catch(undefined),
  assigneeId: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});
export type BugQuery = z.infer<typeof BugQuery>;

/** One error shape for every failure — NFR-4. */
export const ApiError = z.object({
  error: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof ApiError>;`,
          explanation:
            "The `min()` messages are written for the person filing the report, not for the developer: \"Say what you did, in enough detail to repeat it\" tells them what to do, where \"String must contain at least 10 character(s)\" tells them what a validator thinks. Those strings travel all the way to the field in the form, so this file is quietly also a copy deck. `UpdateBug`'s `.refine()` exists because `{}` is a valid object of every optional field, and a PATCH that changes nothing should be a 400 rather than a silent no-op that still bumps `updatedAt`.",
          requires: "tsc (this file only declares; it prints nothing)",
        },
      ],
      pitfalls: [
        {
          title: "`.catch()` on the query schema, `.optional()` everywhere else",
          body: "The difference is who wrote the value. A request body is written by your own client, so a wrong shape is a bug and should be a 400 you can see. A query string is written by whoever last edited the address bar, so `?status=banana` should quietly mean \"no status filter\" rather than break the page. Using `.catch()` in a body schema hides real bugs; using `.optional()` in a query schema turns a typo into an error screen.",
        },
        {
          title: "`z.infer` and `z.input` are different types",
          body: "`z.infer` is what comes *out* of a parse, after defaults and transforms have run. `z.input` is what may go in. They are the same here because nothing has a default, but the moment you add `.default(\"open\")` to a field, the input type makes it optional and the output type does not — and a form typed with the wrong one will insist on a value the user is not being asked for.",
        },
      ],
    },
    {
      id: "db",
      heading: "The database schema",
      body: [
        "Four tables. The interesting part is the two `enum` columns, which are built from the shared arrays rather than from string literals — so a column and a `<select>` cannot list different options, and adding a severity is still one edit.",
      ],
      examples: [
        {
          id: "schema",
          title: "server/src/db/schema.ts",
          lang: "typescript",
          code: `import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { bugSeverities, bugStatuses } from "@tracer/shared";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
});

export const bugs = sqliteTable(
  "bugs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    /* What people say out loud is WEB-4, but that is per-project and so not
       unique here, and a renumbering must never be able to break a foreign
       key. \`id\` is the database's key; \`number\` is the humans'. */
    number: integer("number").notNull(),
    title: text("title").notNull(),
    stepsToReproduce: text("steps_to_reproduce").notNull(),
    expected: text("expected").notNull(),
    actual: text("actual").notNull(),
    environment: text("environment").notNull(),
    /* The vocabulary comes from the shared package, so the column and the
       client cannot drift apart. */
    severity: text("severity", { enum: bugSeverities }).notNull(),
    status: text("status", { enum: bugStatuses }).notNull().default("open"),
    /* A bug nobody reported is not a state this app has; an unassigned bug
       is the normal one. */
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    assigneeId: text("assignee_id").references(() => users.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("bugs_project_number").on(table.projectId, table.number),
    /* FR-1 is exactly this query — one project, newest first — and it runs on
       every page load. */
    index("bugs_project_created").on(table.projectId, table.createdAt),
    /* FR-11's triage queue: one project, still open, worst first. */
    index("bugs_project_status_severity").on(table.projectId, table.status, table.severity),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    bugId: text("bug_id")
      .notNull()
      .references(() => bugs.id),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("comments_bug_created").on(table.bugId, table.createdAt)],
);

export const schema = { users, projects, bugs, comments };
export const now = sql\`(datetime('now'))\`;`,
          explanation:
            "`text(\"severity\", { enum: bugSeverities })` is the line that makes NFR-2 real rather than aspirational. The column's type is now the same union the client uses, so inserting `\"critical\"` does not compile — and when someone adds it to the shared array, both the column and every `<select>` gain it at once. The four report columns are all `notNull()`, which is the requirement \"a report must be reproducible\" written somewhere it cannot be forgotten.",
          requires: "tsc and drizzle-kit (the schema is a declaration; it prints nothing)",
        },
      ],
      pitfalls: [
        {
          title: "Seed with fixed ids and fixed timestamps",
          body: "A seed built on `Date.now()` and random ids makes every screenshot, every test fixture and every `curl` transcript differ from the last one, and \"it looks different for me\" becomes impossible to tell apart from a real bug. Tracer's seed writes `b_1`…`b_6` and dates in March 2026, so the triage order in this guide is the triage order you will see.",
        },
      ],
    },
    {
      id: "routes",
      heading: "The routes",
      body: [
        "Ten of them across two files. The reads first: the list with its four filters, and the triage queue with the ordering that is the whole reason it is a separate endpoint.",
      ],
      examples: [
        {
          id: "routes-read",
          title: "server/src/routes/bugs.ts — reading",
          lang: "typescript",
          code: `const id = () => \`b_\${crypto.randomUUID().slice(0, 8)}\`;
const stamp = () => new Date().toISOString();

/* Severity is a word, so SQL sorts it alphabetically: blocker, major, minor,
   trivial happens to be right by luck, and would stop being right the moment
   anyone adds "critical". Rank it explicitly instead. */
const severityOrder = sql\`CASE \${bugs.severity}
  WHEN 'blocker' THEN 0 WHEN 'major' THEN 1 WHEN 'minor' THEN 2 ELSE 3 END\`;

export const bugRoutes = new Hono();

/* FR-1 to FR-5. Every filter is applied in SQL — NFR-5. */
bugRoutes.get("/projects/:projectId/bugs", async (c) => {
  const query = BugQuery.parse({
    status: c.req.query("status"),
    severity: c.req.query("severity"),
    assigneeId: c.req.query("assigneeId"),
    q: c.req.query("q"),
  });

  const where = [eq(bugs.projectId, c.req.param("projectId"))];
  if (query.status) where.push(eq(bugs.status, query.status));
  if (query.severity) where.push(eq(bugs.severity, query.severity));
  if (query.assigneeId) where.push(eq(bugs.assigneeId, query.assigneeId));
  if (query.q) where.push(like(bugs.title, \`%\${query.q}%\`));

  return c.json(
    await db.select().from(bugs).where(and(...where)).orderBy(desc(bugs.createdAt)),
  );
});

/* FR-11. The triage queue is not a filter on the list: it has its own order —
   worst first, then oldest — because triage is a queue you work down, and the
   oldest unlooked-at report is the one that has been failing someone longest. */
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
            "`severityOrder` is the piece worth stopping on. `ORDER BY severity` would sort the text, and the four words happen to be in the right alphabetical order today — which is exactly the kind of accident that survives review and breaks the day somebody adds `critical`. Ranking the values explicitly costs one `CASE` and means the order is stated rather than lucky. Note also that the filters are built as an array of conditions and spread into a single `and()`: no branching query builders, no string concatenation, and an empty array yields no `WHERE` clause at all.",
          requires: "tsc (imports elided; see the repository for the full file)",
        },
        {
          id: "routes-write",
          title: "server/src/routes/bugs.ts — writing, and the triage rule",
          lang: "typescript",
          code: `/* FR-7. */
bugRoutes.post("/projects/:projectId/bugs", async (c) => {
  const parsed = CreateBug.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return fail(c, 400, "Invalid bug report", flatten(parsed.error));

  const projectId = c.req.param("projectId");
  const [high] = await db
    .select({ number: sql<number>\`COALESCE(MAX(\${bugs.number}), 0)\` })
    .from(bugs)
    .where(eq(bugs.projectId, projectId));

  const at = stamp();
  const row = {
    id: id(),
    projectId,
    number: (high?.number ?? 0) + 1,
    ...parsed.data,
    assigneeId: parsed.data.assigneeId ?? null,
    status: "open" as const,
    createdAt: at,
    updatedAt: at,
  };
  await db.insert(bugs).values(row);
  return c.json(row, 201);
});

/* FR-12. Triage is its own endpoint rather than a PATCH of \`status\`, because
   it is a decision with a rule: only an open bug can be triaged, and the only
   two answers are "confirmed" and "wontfix". A general PATCH would let the
   client move a fixed bug back to open by accident. */
bugRoutes.post("/bugs/:id/triage", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = TriageOutcome.safeParse(
    body && typeof body === "object" ? (body as { outcome?: unknown }).outcome : undefined,
  );
  if (!parsed.success) return fail(c, 400, "Outcome must be 'confirmed' or 'wontfix'");

  const [bug] = await db.select().from(bugs).where(eq(bugs.id, c.req.param("id")));
  if (!bug) return fail(c, 404, "No such bug");
  if (bug.status !== "open") return fail(c, 409, \`Already triaged: this bug is \${bug.status}\`);

  const [updated] = await db
    .update(bugs)
    .set({ status: parsed.data, updatedAt: stamp() })
    .where(eq(bugs.id, bug.id))
    .returning();
  return c.json(updated);
});`,
          explanation:
            "The triage handler is four lines of rule and three of work, which is the right ratio for a decision endpoint. It reads before it writes because it has to answer a question about the *current* state — a blind `UPDATE ... WHERE status = 'open'` would refuse correctly but could not say what the bug had been triaged as, and \"already triaged\" without the outcome sends the reader back to the list to find out. The 409 is deliberate: this is not a malformed request (400) and the bug exists (not 404); the request conflicts with the state of the thing.",
          requires: "tsc (imports elided; see the repository for the full file)",
        },
      ],
      pitfalls: [
        {
          title: "The `MAX(number) + 1` race",
          body: "Two reports filed in the same millisecond can read the same maximum and both claim `WEB-7`. The unique index on `(project_id, number)` turns that into a failed insert rather than two bugs with one name, which is the right failure — but the honest fix is a per-project counter row updated in the same transaction, or a database sequence. This project keeps the simple version and the index that catches it, and says so, because an unmentioned race is worse than a known one.",
        },
        {
          title: "`like` is not full-text search",
          body: "`like(bugs.title, '%text%')` cannot use an index, so it is a table scan on every keystroke. At six rows that is free; at forty thousand it is the slowest thing in the app. It is the right code for FR-5's actual requirement and the wrong code for a search feature, and the difference is worth knowing before somebody asks for the second one. SQLite's answer is FTS5.",
        },
      ],
    },
    {
      id: "running",
      heading: "Three commands to a running system",
      body: [
        "NFR-10 says a clean clone runs in three commands. This is that, and it is worth doing before writing any of the client, because it is the point where the schema, the database and the routes have to agree.",
      ],
      examples: [
        {
          id: "boot",
          title: "Creating the database and filling it",
          lang: "bash",
          code: `npm install
npm run db:push && npm run db:seed`,
          output: `> drizzle-kit push

No config path provided, using default 'drizzle.config.ts'
Reading config file 'server/drizzle.config.ts'
[✓] Pulling schema from database...
[✓] Changes applied

> tsx src/db/seed.ts

seeded 3 users, 2 projects, 6 bugs, 3 comments`,
          explanation:
            "`db:push` runs `drizzle-kit push`, which diffs the TypeScript schema against the actual database and applies the difference — no migration files while the shape is still moving. \"Pulling schema from database\" is it reading what is already there in order to work out the difference, which is why the same command is safe to run again. Once the project has users, that changes: `drizzle-kit generate` writes a migration you can read and review, and `push` becomes the thing you only do locally. The third command, `npm run dev`, starts the API on 8787 and Vite on 5173.",
          requires: "Node 20+, and the repository checked out (npm output trimmed to the two tools' own lines)",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why build the database column's enum from the shared array rather than writing the strings twice?",
      answer:
        "Because the two copies drift, and nothing catches it. Written twice, adding `critical` to the client's `<select>` produces a value the column will happily store — SQLite does not enforce a CHECK you did not write — and now a row exists that the client's own parser rejects on the way back. Built from the shared array, the column's TypeScript type *is* the union, so the mismatch is a compile error at the point of insert, and adding a severity is one edit that both sides pick up.",
    },
    {
      question: "The triage endpoint reads the bug before updating it. Isn't that a wasted round trip?",
      answer:
        "It is an extra query, and it buys the error message. `UPDATE ... WHERE id = ? AND status = 'open'` would refuse the illegal case correctly by returning zero rows, but zero rows cannot tell you *why* — a missing bug and an already-triaged bug look identical, so the handler could not choose between 404 and 409, or say what the bug had been triaged as. Under real contention you would want both: read for the message, and keep the status in the UPDATE's WHERE clause so the check and the write cannot be split by another request.",
    },
    {
      question: "Why does the list build an array of conditions instead of chaining `.where()` calls?",
      answer:
        "Because the number of conditions is not known until runtime, and a query builder that is reassigned in four `if` branches is both harder to read and easy to get wrong — a missed reassignment silently drops a filter. Collecting conditions into an array and spreading them into one `and()` makes the filter set data rather than control flow: the shape of the query is one expression, an empty array produces no WHERE clause, and adding a fifth filter is one push.",
    },
    {
      question: "What is wrong with `Bug.partial()` as the update schema?",
      answer:
        "It makes every field optional, including the ones the server owns — so a client could send `id`, `number`, `createdAt`, or file something already `fixed`. It also drifts in the wrong direction: adding a column to the entity silently adds it to what clients may write. An explicit `UpdateBug` lists the three fields that are actually editable, so a new column is not writable until somebody decides it should be.",
    },
  ],
  takeaways: [
    "One schema per request shape, never a partial of the entity — the server owns id, number, status and timestamps",
    "Build database enums from the shared vocabulary, so a column and a `<select>` cannot disagree",
    "`.catch()` for values from the address bar, `.optional()` for values from your own client",
    "An ordering the data has no natural sort for should be stated with a CASE, not left to alphabetical luck",
    "A decision with a rule gets its own endpoint; 409 is for a request that conflicts with the state, not the shape",
    "Seed with fixed ids and fixed timestamps, or nothing downstream is reproducible",
  ],
  status: "available",
};
