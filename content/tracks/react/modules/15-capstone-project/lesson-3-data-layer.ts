import type { Lesson } from "@/content/types";

export const capstoneDataLayerLesson: Lesson = {
  id: "react-capstone-data-layer",
  slug: "tracer-the-data-layer",
  moduleSlug: "capstone-project",
  title: "Tracer: The Data Layer",
  summary:
    "Step four of the build — everything between the API and the components. One typed fetch wrapper that parses instead of casting, a table of query keys whose nesting makes a single invalidation do the right thing, and six hooks: three that ask questions, two that write, and one that keeps the filters in the URL.",
  estimatedMinutes: 30,
  objectives: [
    "Build a typed fetch layer that parses rather than casts",
    "Design query keys whose nesting makes one invalidation do the right thing",
    "Write a hook per question the UI asks, not a hook per endpoint",
    "Keep the filters in the URL without a render loop",
    "Decide which mutations may be optimistic, and defend the answer",
  ],
  sections: [
    {
      id: "fetch-layer",
      heading: "One place that fetches",
      visual: {
        id: "query-key-matching-visual",
        kind: "react-data",
        algorithm: "key-matching",
        title: "One invalidateQueries, and every entry it reaches",
      },
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
      question: "Why does the filters hook have to return a stable setter?",
      answer:
        "Because the filter bar calls it from inside an effect that watches the debounced search text. If the setter were a new function on every render, that effect's dependency list would differ every render, so it would re-run every render and push the same value straight back into the URL — a render loop that only appears once the two pieces are wired together. The useCallback around it is the one place in this app where an unstable identity is a bug rather than a missed optimisation.",
    },
  ],
  takeaways: [
    "One fetch wrapper, and it takes a schema — so there is no way to cast by accident",
    "`fetch` does not reject on 404 or 500; the `!response.ok` check is the common bug",
    "Parse the error body too: a 500 from a proxy will not have your error shape",
    "Query keys nest, so one invalidation covers every list and detail under it",
    "The filter object belongs in the key: a new filter is a new query, and going back is instant",
    "Forward `signal`, and the superseded-request race stops existing",
    "`placeholderData: (previous) => previous` is why changing a filter does not flash a spinner",
    "Give the filters hook a `[value, setValue]` shape, so swapping the implementation changes no call site",
    "Be optimistic when you already know the answer — not when you would like to",
    "`cancelQueries` first, or a stale refetch overwrites the guess",
    "Seed the detail cache from a create response: the real value, not an optimistic one",
  ],
  status: "available",
};
