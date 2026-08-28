import type { Lesson } from "@/content/types";

export const capstoneFrontendLesson: Lesson = {
  id: "react-capstone-frontend",
  slug: "capstone-the-react-app",
  moduleSlug: "patterns-and-mastery",
  title: "Capstone — Issue Tracker: The React App, Component by Component",
  summary:
    "The rest of Tracer, in TypeScript: the fetch layer, the query-key table, six hooks, eight components with their props types, the issue list and issue detail screens, and the tests — with the reasoning for each, and the one place the app is optimistic and the one place it deliberately is not.",
  estimatedMinutes: 46,
  objectives: [
    "Build a typed fetch layer that parses rather than casts",
    "Design query keys whose nesting makes one invalidation do the right thing",
    "Write a hook per question the UI asks, not a hook per endpoint",
    "Decide which mutations may be optimistic, and defend the answer",
    "Type props so the compiler enforces the states a component must handle",
    "Test through the network rather than through mocked modules",
  ],
  sections: [
    {
      id: "fetch-layer",
      heading: "One place that fetches",
      body: [
        "Everything above this file works with typed values and thrown errors. The only code in the app that knows about status codes, JSON parsing and the base URL is here — which is what makes the whole data layer testable by swapping one network handler rather than by mocking modules.",
        "The `schema` parameter is NFR-1 made mandatory. There is no way to call `request` without saying what shape you expect, so there is no way to accidentally cast.",
      ],
      examples: [
        {
          id: "api-ts",
          title: "src/lib/api.ts",
          lang: "typescript",
          code: `import { apiErrorSchema } from "@tracer/shared";
import type { ZodType } from "zod";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

/** A failed request, carrying the field errors a form needs to render. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions<T> {
  /** Parsed with the *shared* schema, so a server change fails here loudly. */
  schema: ZodType<T>;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { schema, method = "GET", body, signal } = options;

  const response = await fetch(\`\${BASE}\${path}\`, {
    method,
    signal,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    throw new ApiRequestError(
      response.status,
      parsed.success ? parsed.data.error : \`Request failed (\${response.status})\`,
      parsed.success ? (parsed.data.fieldErrors ?? {}) : {},
    );
  }

  /* Parse rather than cast. A cast is a promise the compiler cannot keep; a
     parse is a check that turns a backend change into one clear error here
     instead of \`undefined is not an object\` three components away. */
  return schema.parse(payload);
}`,
          explanation:
            "Three details earn their place. `fetch` does not reject on a 404 or a 500, so the `!response.ok` check is not optional — omitting it is the single most common bug in hand-rolled fetch code. The error body is itself parsed with `apiErrorSchema`, because a 500 from a proxy will not have the shape your server promised. And `signal` is threaded through: it is what lets React Query abort a request whose answer is no longer wanted.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "keys",
          title: "src/lib/queryKeys.ts",
          lang: "typescript",
          code: `import type { IssueQuery } from "@tracer/shared";

/**
 * Every cache key in the app, in one object.
 *
 * Keys are built by functions so they cannot be mistyped at a call site, and
 * they nest — \`issues.list(id, filters)\` starts with \`issues.all\`, so
 * invalidating \`issues.all\` invalidates every list and every detail under it.
 * That prefix relationship is the entire reason to centralise them.
 */
export const queryKeys = {
  projects: ["projects"] as const,
  users: ["users"] as const,

  issues: {
    all: ["issues"] as const,
    list: (projectId: string, query: IssueQuery) =>
      [...queryKeys.issues.all, "list", projectId, query] as const,
    detail: (issueId: string) => [...queryKeys.issues.all, "detail", issueId] as const,
    comments: (issueId: string) => [...queryKeys.issues.all, "detail", issueId, "comments"] as const,
  },
} as const;`,
          explanation:
            "The nesting is the design. React Query matches keys by prefix, so `invalidateQueries({ queryKey: queryKeys.issues.all })` after a mutation refetches every issue list under every filter *and* every open detail — which is what you want, because a status change alters both. Keys written as string literals at eleven call sites cannot have that property, and the bug it causes — a stale list after a successful write — is one people chase for an afternoon.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "The filter object is part of the key, and that is deliberate",
          body: "`list(projectId, query)` puts the whole filter object in the key, so changing a filter is a *different query* rather than a refetch of the same one. That is what makes going back to a filter you already used instant — the answer is still in the cache. It also means the key must be serialisable and stable: React Query hashes it, so `{ status: \"open\" }` and `{ status: \"open\" }` match, but a key containing a function or a fresh object identity per render would never hit.",
        },
      ],
    },
    {
      id: "query-hooks",
      heading: "A hook per question, not per endpoint",
      body: [
        "The feature's `api.ts` has one function per endpoint. The hooks are a different layer, and they exist to answer the questions the *screens* ask — which is why `useIssue` and `useComments` live in one file: they are two questions about the same screen.",
        "`useIssues` is where FR-1 through FR-4 and NFR-6 and NFR-8 all land, in about ten lines.",
      ],
      examples: [
        {
          id: "use-issues",
          title: "src/features/issues/hooks/useIssues.ts",
          lang: "typescript",
          code: `import { useQuery } from "@tanstack/react-query";
import type { Issue, IssueQuery } from "@tracer/shared";
import { queryKeys } from "../../../lib/queryKeys";
import { listIssues } from "../api";

export function useIssues(projectId: string, query: IssueQuery) {
  return useQuery<Issue[]>({
    queryKey: queryKeys.issues.list(projectId, query),
    queryFn: ({ signal }) => listIssues(projectId, query, signal),
    /* Keeps the previous list on screen while the new one loads, so changing
       a filter does not flash a spinner over content that is still valid. */
    placeholderData: (previous) => previous,
  });
}`,
          explanation:
            "`signal` comes from React Query and is forwarded to `fetch`, so a filter changed three times in a second leaves one in-flight request rather than three — NFR-6, and also the cure for module 7's race condition, where the slowest response wins. `placeholderData` is NFR-8: the previous list stays on screen rather than the page collapsing to a spinner.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "use-filters",
          title: "src/features/issues/hooks/useIssueFilters.ts — FR-5",
          lang: "typescript",
          code: `import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { issueQuerySchema, type IssueQuery } from "@tracer/shared";

/**
 * The filters, stored in the URL rather than in \`useState\`.
 *
 * This is module 4's rule applied to a real screen: the filters are not
 * component state, they are *where you are*.
 */
export function useIssueFilters(): [IssueQuery, (next: Partial<IssueQuery>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => issueQuerySchema.parse(Object.fromEntries(searchParams)),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Partial<IssueQuery>) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value);
            else params.delete(key);
          }
          return params;
        },
        /* Twenty keystrokes in a search box should not be twenty back-button
           presses. */
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [filters, setFilters];
}`,
          explanation:
            "The signature is deliberately `[value, setValue]` — the same shape as `useState` — so a component using it reads identically to one using local state, and swapping the implementation would not change a call site. The `useMemo` matters more than it looks: without it, `filters` is a new object every render, and since it goes into the query key, every render would be a cache miss.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "`setFilters` must be stable",
          body: "`IssueFilters` calls `onChange` from inside an effect that watches the debounced text. If `setFilters` were a new function each render, that effect would re-run every render and push the same value back into the URL forever — a render loop that only appears once the two pieces are wired together. The `useCallback` with `[setSearchParams]` is what prevents it, and this is the one place in the app where an unstable identity would be a bug rather than a missed optimisation.",
        },
      ],
    },
    {
      id: "mutations",
      heading: "One optimistic mutation, one deliberately not",
      body: [
        "This is the most interesting pair of files in the project, because they look like they should be symmetrical and are not.",
        "**Changing a status can be optimistic.** The new value is a value you already hold — the user picked it from a list of three. There is nothing to guess.",
        "**Creating an issue cannot.** The server assigns the id, the number and both timestamps. An optimistic row would have to invent four fields it cannot know, and the id is the React key — so the invented row would unmount and remount when the real one arrived, throwing away any focus or scroll position attached to it.",
        "Knowing which mutations may be optimistic is the actual skill here. The rule: **be optimistic when you already know the answer**, not when you would like to.",
      ],
      examples: [
        {
          id: "use-update",
          title: "src/features/issues/hooks/useUpdateIssue.ts — FR-8",
          lang: "typescript",
          code: `import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, UpdateIssue } from "@tracer/shared";
import { queryKeys } from "../../../lib/queryKeys";
import { updateIssue } from "../api";

interface Variables {
  issueId: string;
  patch: UpdateIssue;
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation<Issue, Error, Variables, { previous: Issue | undefined }>({
    mutationFn: ({ issueId, patch }) => updateIssue(issueId, patch),

    onMutate: async ({ issueId, patch }) => {
      const key = queryKeys.issues.detail(issueId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Issue>(key);
      if (previous) queryClient.setQueryData<Issue>(key, { ...previous, ...patch });

      return { previous };
    },

    onError: (_error, { issueId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.issues.detail(issueId), context.previous);
      }
    },

    /* \`issues.all\` is a prefix of both the detail key and every list key, so
       one invalidation covers the list the user came from too. */
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}`,
          explanation:
            "Each callback has exactly one job. `onMutate` cancels in-flight refetches — without that, a request that started before the write can land after it and undo it — then snapshots and writes the guess. `onError` puts the snapshot back. `onSettled` invalidates either way, which is what replaces the guess with the server's answer, including the fields the server changed and the client did not: `updatedAt`.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
        {
          id: "use-create",
          title: "src/features/issues/hooks/useCreateIssue.ts — FR-6",
          lang: "typescript",
          code: `import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateIssue, Issue } from "@tracer/shared";
import { queryKeys } from "../../../lib/queryKeys";
import { createIssue } from "../api";

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Issue, Error, CreateIssue>({
    mutationFn: (input) => createIssue(projectId, input),
    onSuccess: (issue) => {
      /* Seed the detail cache so navigating to the new issue renders with no
         request at all. */
      queryClient.setQueryData(queryKeys.issues.detail(issue.id), issue);
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}`,
          explanation:
            "Half the size, because it does not guess. The one clever thing it does is put the created issue straight into the detail cache — the server just returned the complete row, so navigating to it after creation renders instantly with no request. That is a cache write with the *real* value, which is the opposite of an optimistic one.",
          requires: "the capstone project (this file is type-checked, not run)",
        },
      ],
      pitfalls: [
        {
          title: "`cancelQueries` is not optional",
          body: "Without it: a background refetch starts, you write your optimistic value, the refetch's stale response lands and overwrites it, and the UI reverts for a fraction of a second before the invalidation fixes it. It looks like a flicker, it is intermittent, and it is invisible on a fast local network — which is exactly the kind of bug that ships.",
        },
      ],
    },
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
      question: "Which mutations should be optimistic, and how do you decide?",
      answer:
        "Be optimistic when you already know the answer. A status change is safe because the value came from a list of three the user picked from — there is nothing to guess, and rolling back is restoring one snapshot. A create is not, because the server assigns the id, the sequence number and the timestamps: an optimistic row would invent four fields, and since the id is the React key, the row would unmount and remount when the real one arrived, throwing away focus and scroll. The tell is whether the client can compute the post-state exactly.",
    },
    {
      question: "Why centralise query keys instead of writing them at the call site?",
      answer:
        "Because React Query matches by prefix, and that only works if the keys nest deliberately. In Tracer every issue key starts with [\"issues\"], so one invalidateQueries after a mutation refetches every filtered list and every open detail — which is what a status change actually affects. Keys written as literals at eleven call sites cannot have that property, and the resulting bug is a stale list after a successful write: intermittent, invisible locally, and an afternoon to find.",
    },
    {
      question: "What does parsing a response buy over casting it?",
      answer:
        "An error that points at the actual problem. A cast is a claim the compiler will now defend, so when the backend drops a field you get 'Cannot read properties of undefined' inside a component three layers from the fetch, with a stack trace that describes rendering rather than data. Parsing with the shared schema fails at the boundary with the field name and the expected type. It costs one schema argument per request, and the schema already exists because the server validates with it.",
    },
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
  ],
  takeaways: [
    "One fetch wrapper, and it takes a schema — so there is no way to cast by accident",
    "`fetch` does not reject on 404 or 500; the `!response.ok` check is the common bug",
    "Query keys nest, so one invalidation covers every list and detail under it",
    "The filter object belongs in the key: a new filter is a new query, and going back is instant",
    "Forward `signal`, and the superseded-request race stops existing",
    "`placeholderData: (previous) => previous` is why changing a filter does not flash a spinner",
    "Be optimistic when you already know the answer — not when you would like to",
    "`cancelQueries` first, or a stale refetch overwrites the guess",
    "`Record<Status, string>` over a fallback: the compiler catches the forgotten case",
    "Resolve lookups in the parent; a row that fetches is forty requests",
    "One `QueryBoundary` so the empty state cannot be forgotten",
    "A fresh `QueryClient` per test, or test order decides the results",
    "Fake the network, not the modules — everything below the wire should run",
  ],
  status: "available",
};
