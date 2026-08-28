import type { Lesson } from "@/content/types";

export const capstoneBackendLesson: Lesson = {
  id: "react-capstone-backend",
  slug: "capstone-structure-types-and-backend",
  moduleSlug: "patterns-and-mastery",
  title: "The Capstone: Folder Structure, Shared Types & the Backend",
  summary:
    "Steps one to three of the build. The complete folder map for all three packages, the Zod schemas that both sides import, the database schema those schemas generate, and the eight routes — each one written out and each one verified against a running server.",
  estimatedMinutes: 42,
  objectives: [
    "Lay out a three-package workspace and say what belongs in each",
    "Write schemas that produce a runtime validator and a TypeScript type from one declaration",
    "Model a create request as its own schema rather than a partial of the entity",
    "Define a database schema whose vocabulary cannot drift from the app's",
    "Write routes that validate, filter in SQL, and fail in one shape",
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
├── package.json                       # workspaces: shared, server, web
├── tsconfig.base.json                 # strict settings, written once
│
├── shared/                            # imported by both of the others
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                   # re-exports issue.ts
│       └── issue.ts                   # every schema and every type
│
├── server/
│   ├── package.json                   # hono, drizzle-orm, @libsql/client
│   ├── tsconfig.json
│   ├── drizzle.config.ts              # where drizzle-kit finds the schema
│   ├── .env.example
│   └── src/
│       ├── index.ts                   # the app: CORS, routes, error handler
│       ├── db/
│       │   ├── schema.ts              # four tables, three indexes
│       │   ├── index.ts               # one client, one exported db
│       │   └── seed.ts                # fixed ids, fixed timestamps
│       └── routes/
│           ├── issues.ts              # six endpoints
│           └── projects.ts            # two endpoints
│
└── web/
    ├── package.json                   # react, @tanstack/react-query, react-router
    ├── index.html
    ├── vite.config.ts
    ├── vitest.config.ts               # jsdom + one setup file
    ├── tsconfig.json                  # references the two below
    ├── tsconfig.app.json              # settings for src/ — strict lives here
    ├── tsconfig.node.json             # settings for vite.config.ts
    ├── .env.example
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.tsx                   # every provider, in order
        ├── App.tsx                    # the routes, and nothing else
        ├── index.css
        │
        ├── lib/                       # app-wide, no React in it
        │   ├── api.ts                 # the only fetch in the app
        │   └── queryKeys.ts           # every cache key, in one object
        │
        ├── components/                # shared, presentational
        │   ├── StatusBadge.tsx
        │   ├── PriorityBadge.tsx
        │   └── QueryBoundary.tsx      # loading / error / empty / success
        │
        ├── hooks/                      # shared, with a second caller
        │   ├── useDebouncedValue.ts
        │   └── useUsers.ts
        │
        ├── features/
        │   └── issues/                 # everything about an issue
        │       ├── api.ts              # one function per endpoint
        │       ├── hooks/
        │       │   ├── useIssues.ts
        │       │   ├── useIssue.ts
        │       │   ├── useCreateIssue.ts
        │       │   ├── useUpdateIssue.ts
        │       │   └── useIssueFilters.ts
        │       └── components/
        │           ├── IssueRow.tsx
        │           ├── IssueFilters.tsx
        │           ├── NewIssueForm.tsx
        │           ├── StatusSelect.tsx
        │           └── CommentList.tsx
        │
        ├── routes/                     # one file per screen
        │   ├── IssueListPage.tsx
        │   ├── IssueListPage.test.tsx  # beside the thing it tests
        │   └── IssueDetailPage.tsx
        │
        └── test/
            ├── setup.ts                # jest-dom matchers
            ├── renderWithProviders.tsx # a fresh QueryClient per test
            └── handlers.ts             # MSW: fakes the network, not modules`,
          explanation:
            "The rule that produced `web/src` is module 3's: things that change together live together. Everything about an issue is in `features/issues/`, so the answer to \"where is the issue code\" is one folder. `components/` and `hooks/` at the top level hold only what has a caller in more than one place — nothing arrives there in anticipation of a second caller, it arrives when the second caller does.",
          requires: "the capstone project checked out (this is `tree` over it)",
        },
      ],
      visual: {
        id: "capstone-src",
        kind: "react-structure",
        algorithm: "capstone-web",
        lockAlgorithm: true,
        title: "web/src, built in dependency order",
      },
      pitfalls: [
        {
          title: "`lib/` versus `hooks/` versus `features/`",
          body: "Three shared folders is two more than most projects need, so the boundary has to be stated or it becomes a coin flip. `lib/` is app-wide code with no React in it — if it imports a hook it is in the wrong folder. `hooks/` is React code with callers in more than one feature. `features/` is everything else, and it is where a file should start. The failure mode is a `utils/` folder, which has no rule at all and therefore collects everything nobody wanted to think about.",
        },
      ],
    },
    {
      id: "shared-schemas",
      heading: "The shared package: one declaration, two outputs",
      body: [
        "This is NFR-2's mechanism, and it is worth being precise about why it works. A Zod schema is a runtime value — an object that can check data — and `z.infer` extracts the TypeScript type that value describes. So one declaration produces both the validator the server runs and the type the compiler enforces, and they cannot disagree, because one is derived from the other.",
        "Start with the vocabularies, because everything else refers to them.",
      ],
      examples: [
        {
          id: "vocab",
          title: "shared/src/issue.ts — the vocabularies",
          lang: "typescript",
          code: `import { z } from "zod";

/* The two closed vocabularies the whole app agrees on. They are \`const\`
   tuples so the TypeScript union and the Zod enum come from one source: add
   "blocked" here and both the compiler and the request validator learn it. */
export const STATUSES = ["open", "in_progress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export const statusSchema = z.enum(STATUSES);
export const prioritySchema = z.enum(PRIORITIES);

export type Status = z.infer<typeof statusSchema>;
export type Priority = z.infer<typeof prioritySchema>;`,
          explanation:
            "The `as const` is what makes this work. Without it `STATUSES` is `string[]` and `Status` is `string`, and every downstream exhaustiveness check quietly stops checking anything. With it, `Status` is `\"open\" | \"in_progress\" | \"done\"` — and the same tuple is passed to the database schema later, so the CHECK constraint the database enforces has the same three values by construction.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "entities",
          title: "The entities",
          lang: "typescript",
          code: `export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
});

export const issueSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  status: statusSchema,
  priority: prioritySchema,
  assigneeId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const commentSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type Comment = z.infer<typeof commentSchema>;`,
          explanation:
            "`assigneeId` is `.nullable()` and `authorId` is not, which is the data model's decision showing up in the type: a component that renders an assignee is forced by the compiler to handle the unassigned case, and one that renders a comment author is not.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
    },
    {
      id: "requests",
      heading: "Request schemas are not partial entities",
      body: [
        "The tempting move is `issueSchema.partial()` for the update and `issueSchema.omit({ id: true })` for the create. Both are wrong, and the reason is the same in each case: **the client and the server own different fields.**",
        "The server owns `id`, `number`, `createdAt` and `updatedAt`. A create request that carries them should be *rejected*, not quietly ignored — because a body containing `\"number\": 1` is a client that believes something false, and the sooner it finds out the better. Deriving the schema from the entity makes that impossible to express.",
        "The create schema also does work the entity schema must not do: it trims, it enforces a maximum length, and it supplies defaults. Those are rules about a *request*, not facts about an issue.",
      ],
      examples: [
        {
          id: "request-schemas",
          title: "What a client may send",
          lang: "typescript",
          code: `/* What a client may send. Deliberately *not* \`issueSchema.partial()\`: the
   server owns id, number and both timestamps, and a body that tries to set
   them should be rejected rather than quietly ignored. */
export const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(5000).default(""),
  priority: prioritySchema.default("medium"),
  assigneeId: z.string().nullable().default(null),
});

export const updateIssueSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().trim().max(5000),
    status: statusSchema,
    priority: prioritySchema,
    assigneeId: z.string().nullable(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Patch must change at least one field",
  });

/* Query strings arrive as strings, so this schema is where "?status=open" is
   turned into a typed filter. \`catch\` rather than \`optional\` means a junk
   value degrades to "no filter" instead of 400-ing a page load. */
export const issueQuerySchema = z.object({
  status: statusSchema.optional().catch(undefined),
  assigneeId: z.string().optional().catch(undefined),
  q: z.string().trim().optional().catch(undefined),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(5000),
  authorId: z.string(),
});

/* One error shape for every failure, so the client has one thing to render.
   \`fieldErrors\` is keyed by form field name, which is what a form needs. */
export const apiErrorSchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

export type CreateIssue = z.infer<typeof createIssueSchema>;
export type UpdateIssue = z.infer<typeof updateIssueSchema>;
export type IssueQuery = z.infer<typeof issueQuerySchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;`,
          explanation:
            "`updateIssueSchema` is `.partial()` of its *own* object, not of the entity — which is why `id` cannot appear in a patch at all. The `.refine` is the rule that an empty patch is a mistake rather than a no-op: `PATCH` with `{}` almost always means a client bug, and 400-ing it surfaces that instead of returning 200 for a write that did nothing.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "`.catch()` on the query schema, `.optional()` everywhere else",
          body: "A query string is user-editable — it is in the address bar. `?status=banana` is a thing that will happen, from a stale bookmark or a typo, and the right response is to ignore the filter and render the page, not to throw during render. Everywhere else, invalid data means a bug worth surfacing, so `.optional()` and a hard failure are correct. The difference is who wrote the value: a person editing a URL, or your own code.",
        },
        {
          title: "`z.infer` and `z.input` are different types",
          body: "Because of the `.default()` calls, `createIssueSchema`'s input allows `description` and `priority` to be missing while its output guarantees them present. `z.infer` gives you the output type. A function that accepts a *caller's* object — like the client's `createIssue` — should take `z.input<typeof createIssueSchema>` and parse it, or the defaults become required arguments at every call site.",
        },
      ],
    },
    {
      id: "db",
      heading: "The database schema",
      body: [
        "Drizzle's table definitions are TypeScript, which is the property that matters: the query builder's types are derived from them, so renaming a column is a compile error in every query that used it rather than a runtime error in one you forgot.",
        "The important line in this file is the `import` at the top. The status and priority vocabularies come from the shared package, so the values SQLite will enforce and the union the compiler will enforce are the same tuple.",
      ],
      examples: [
        {
          id: "schema",
          title: "server/src/db/schema.ts",
          lang: "typescript",
          code: `import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { PRIORITIES, STATUSES } from "@tracer/shared";

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

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /* Per-project, human-facing: WEB-1, WEB-2. Not the primary key — the id
       is, so a renumbering can never break a foreign key. */
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: STATUSES }).notNull().default("open"),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("medium"),
    assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("issues_project_number_idx").on(table.projectId, table.number),
    /* The list screen's only query: one project, newest first. */
    index("issues_project_created_idx").on(table.projectId, table.createdAt),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("comments_issue_created_idx").on(table.issueId, table.createdAt)],
);`,
          explanation:
            "The two `onDelete` behaviours are the data model's nullability decision again, one layer down. Deleting an issue **cascades** to its comments, because a comment on nothing is not a state. Deleting a user **sets null** on their issues, because an unassigned issue *is* a state — the same reason `assigneeId` was nullable in the Zod schema.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "db-client",
          title: "server/src/db/index.ts",
          lang: "typescript",
          code: `import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:tracer.db" });

/* Passing the schema in is what makes \`db.query.issues.findMany(...)\` exist
   and be typed. Without it you still get the query builder, but none of the
   relational helpers. */
export const db = drizzle(client, { schema });

export { schema };`,
          explanation:
            "One client, created once at module scope, exported. A module body runs once per process, so this is the idiomatic singleton in Node — and it is the same reasoning as creating the `QueryClient` outside the component in `main.tsx`.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "Seed with fixed ids and fixed timestamps",
          body: "A seed script with `Date.now()` in it produces a different ordering on every run, which makes any test that asserts on the first row flaky for reasons that have nothing to do with the code. Tracer's seed uses `2026-03-01`, `2026-03-02` and so on, and ids like `i_1`. Determinism in the fixtures is what lets a failing test mean something.",
        },
      ],
    },
    {
      id: "routes",
      heading: "The routes",
      body: [
        "Six endpoints for issues and two for projects. Every handler has the same three-step shape — validate, query, respond — and the validation always comes from the shared schema, never from a hand-written check.",
        "One helper first, because both write endpoints need it: turning Zod's issue list into the field-keyed object NFR-4 promised.",
      ],
      examples: [
        {
          id: "routes-read",
          title: "server/src/routes/issues.ts — reading",
          lang: "typescript",
          code: `import { and, asc, desc, eq, like, max } from "drizzle-orm";
import { Hono } from "hono";
import {
  createCommentSchema,
  createIssueSchema,
  issueQuerySchema,
  updateIssueSchema,
} from "@tracer/shared";
import type { ZodError } from "zod";
import { db } from "../db";
import { comments, issues } from "../db/schema";

/* Zod's issue list keyed by field name, which is the shape a form wants:
   \`fieldErrors.title\` goes under the title input and nowhere else. */
function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => \`\${prefix}_\${crypto.randomUUID().slice(0, 8)}\`;

export const issueRoutes = new Hono();

/* Filtering happens in SQL, not in JavaScript after the fact. The difference
   does not show at four rows and is the whole game at forty thousand. */
issueRoutes.get("/projects/:projectId/issues", async (c) => {
  const projectId = c.req.param("projectId");
  const query = issueQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));

  const filters = [eq(issues.projectId, projectId)];
  if (query.status) filters.push(eq(issues.status, query.status));
  if (query.assigneeId) filters.push(eq(issues.assigneeId, query.assigneeId));
  if (query.q) filters.push(like(issues.title, \`%\${query.q}%\`));

  const rows = await db
    .select()
    .from(issues)
    .where(and(...filters))
    .orderBy(desc(issues.createdAt));

  return c.json(rows);
});

issueRoutes.get("/issues/:id", async (c) => {
  const [row] = await db.select().from(issues).where(eq(issues.id, c.req.param("id")));
  if (!row) return c.json({ error: "Issue not found" }, 404);
  return c.json(row);
});

issueRoutes.get("/issues/:id/comments", async (c) => {
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.issueId, c.req.param("id")))
    .orderBy(asc(comments.createdAt));
  return c.json(rows);
});`,
          explanation:
            "The filter array is the pattern worth keeping. Each optional filter appends a condition, then `and(...filters)` combines whatever accumulated — so three optional filters are three `if`s rather than eight branches, and adding a fourth is one line. `.parse` rather than `.safeParse` is safe here precisely because the query schema uses `.catch()`: it cannot throw.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "routes-write",
          title: "server/src/routes/issues.ts — writing",
          lang: "typescript",
          code: `issueRoutes.post("/projects/:projectId/issues", async (c) => {
  const projectId = c.req.param("projectId");
  const parsed = createIssueSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid issue", fieldErrors: fieldErrors(parsed.error) }, 400);
  }

  /* The per-project number is derived, never sent by the client. */
  const [highest] = await db
    .select({ value: max(issues.number) })
    .from(issues)
    .where(eq(issues.projectId, projectId));

  const timestamp = now();
  const row = {
    id: id("i"),
    projectId,
    number: (highest?.value ?? 0) + 1,
    ...parsed.data,
    status: "open" as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(issues).values(row);
  return c.json(row, 201);
});

issueRoutes.patch("/issues/:id", async (c) => {
  const parsed = updateIssueSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid patch", fieldErrors: fieldErrors(parsed.error) }, 400);
  }

  const [row] = await db
    .update(issues)
    .set({ ...parsed.data, updatedAt: now() })
    .where(eq(issues.id, c.req.param("id")))
    .returning();

  if (!row) return c.json({ error: "Issue not found" }, 404);
  return c.json(row);
});

issueRoutes.post("/issues/:id/comments", async (c) => {
  const issueId = c.req.param("id");
  const parsed = createCommentSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid comment", fieldErrors: fieldErrors(parsed.error) }, 400);
  }

  const [issue] = await db.select({ id: issues.id }).from(issues).where(eq(issues.id, issueId));
  if (!issue) return c.json({ error: "Issue not found" }, 404);

  const row = { id: id("c"), issueId, ...parsed.data, createdAt: now() };
  return c.json(row, 201);
});`,
          explanation:
            "Note the order in the create handler: `...parsed.data` is spread first and `status` written after, so a client that sends a status cannot set it. Spreading a request body into a database row is only safe when the schema that produced it lists exactly the fields the client may set — which is the second reason the create schema is not derived from the entity.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "app",
          title: "server/src/index.ts",
          lang: "typescript",
          code: `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { issueRoutes } from "./routes/issues";
import { projectRoutes } from "./routes/projects";

const app = new Hono();

/* The dev server is on 5173 and the API is on 8787, so they are different
   origins and the browser will preflight. In production they are behind one
   origin and this middleware does nothing. */
app.use("/api/*", cors({ origin: ["http://localhost:5173"] }));

app.route("/api", projectRoutes);
app.route("/api", issueRoutes);

/* One place where an unhandled throw becomes the same JSON error shape every
   other failure uses, so the client never has to parse an HTML stack trace. */
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(\`API listening on http://localhost:\${info.port}\`);
});`,
          output: `API listening on http://localhost:8787`,
          explanation:
            "Thirty lines, and `app.onError` is the one doing the most work. Without it an unexpected throw produces a framework's HTML error page, which the client's `response.json()` cannot parse — so a server bug arrives in the browser as a JSON syntax error pointing at the wrong file. With it, every failure in the system has the shape NFR-4 promised.",
          requires: "the capstone project, with the database pushed and seeded",
        },
      ],
      pitfalls: [
        {
          title: "The `max(number) + 1` race",
          body: "Two simultaneous creates can read the same highest number and both write it. The unique index on `(project_id, number)` means the second insert fails rather than silently duplicating — which is the important half — but a real product would wrap the read and the write in a transaction, or keep a counter on the project row. It is worth knowing that this is a known, bounded shortcut rather than something the design overlooked.",
        },
        {
          title: "`like` is not full-text search",
          body: "`LIKE '%text%'` cannot use an index, so FR-4's search is a table scan. At a few thousand issues that is imperceptible and the honest answer; at a million it is SQLite's FTS5 extension, and the migration is contained to this one line. Knowing which one you have is the difference between a shortcut and a bug.",
        },
      ],
    },
    {
      id: "running",
      heading: "Three commands to a running system",
      body: [
        "NFR-10, checked. From a clean clone, this is everything.",
      ],
      examples: [
        {
          id: "setup",
          title: "Clean clone to seeded database",
          lang: "bash",
          code: `npm install                                  # links the three workspaces

npm run db:push --workspace server           # creates the tables from schema.ts
npm run db:seed --workspace server           # 2 users, 1 project, 4 issues

npm run dev                                  # server on 8787, web on 5173`,
          output: `[✓] Changes applied
Seeded 2 users, 1 project, 4 issues, 1 comment.
API listening on http://localhost:8787`,
          explanation:
            "`db:push` reads `schema.ts` and applies the difference directly to the database — no migration files, which is the right trade for a project at this stage. A production system would use `drizzle-kit generate` instead and commit the SQL, because \"apply the difference\" is not something you want deciding on its own what to do with a column that has data in it.",
          requires: "the capstone project and a local SQLite file",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why not derive the create schema from the entity schema with .omit()?",
      answer:
        "Because the client and the server own different fields, and an omit expresses the wrong thing. The server owns id, number, createdAt and updatedAt, so a create body containing them should be rejected rather than ignored — a client sending \"number\": 1 believes something false and should find out. The create schema also carries rules that are about the request rather than about the entity: trimming, maximum lengths, and defaults. An entity schema that trimmed its title would be asserting that stored titles are trimmed, which is a different claim.",
    },
    {
      question: "How does one Zod schema end up enforcing the same rule in three places?",
      answer:
        "A schema is a runtime value that can validate, and z.infer extracts the TypeScript type it describes — so one declaration gives you a validator and a type that cannot disagree. In Tracer the STATUSES tuple is passed to z.enum for the request validator, to Drizzle's text() for the database CHECK constraint, and inferred into the Status union the components are written against. Adding \"blocked\" to that one tuple updates all three, and any switch that is no longer exhaustive stops compiling.",
    },
    {
      question: "Why .catch() on the query schema but .optional() elsewhere?",
      answer:
        "Because of who wrote the value. A query string is in the address bar, so ?status=banana will happen — from a stale bookmark or a typo — and the right response is to ignore the filter and render the page rather than throw during render. Everywhere else the data came from your own code or your own server, so invalid data means a bug, and failing loudly at the boundary is what surfaces it. The distinction is user-editable input versus internal data, not strictness for its own sake.",
    },
    {
      question: "What does app.onError actually buy you?",
      answer:
        "It makes every failure in the system the same shape. Without it, an unhandled throw produces the framework's HTML error page — which the client's response.json() cannot parse — so a server bug reaches the browser as a JSON syntax error pointing at the wrong file, and the actual stack trace is on the other side of the network. With it, a 500 is `{ error }` like every other failure, the client's one error path renders it, and the real error is logged where it happened.",
    },
  ],
  takeaways: [
    "Three packages: the third exists so the other two cannot disagree",
    "`lib/` is React-free app-wide code; `hooks/` needs a second caller; everything else starts in the feature",
    "`as const` on the vocabulary tuples, or every exhaustiveness check silently stops checking",
    "Request schemas are written, not derived — the client and server own different fields",
    "`.partial()` the request object, never the entity",
    "`.catch()` for user-editable input, `.optional()` for everything else",
    "`z.input` for what a caller may pass; `z.infer` for what comes out",
    "Cascade where the child cannot exist alone; set-null where the absence is a real state",
    "Build the filter array, then `and(...filters)` — three optionals, three ifs",
    "Spread the parsed body, then write the server-owned fields after it",
    "One `onError`, so every failure in the system has one shape",
  ],
  status: "available",
};
