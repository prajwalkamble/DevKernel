import type { Lesson } from "@/content/types";

export const capstoneDataLayerLesson: Lesson = {
  id: "react-capstone-data-layer",
  slug: "bug-tracker-the-data-layer",
  moduleSlug: "capstone-project",
  title: "Bug Tracker: The Data Layer",
  summary:
    "Step four. One fetch wrapper that parses instead of casting, one table of cache keys, and seven hooks — including the three mutations that behave differently on purpose: a status change that is optimistic, a triage decision that optimistically removes a row, and a comment that is deliberately not optimistic at all.",
  estimatedMinutes: 32,
  objectives: [
    "Write a fetch wrapper that parses responses and produces one failure type",
    "Design cache keys so a partial key invalidates everything beneath it",
    "Keep the filters in the URL, and know why that is a hook rather than state",
    "Choose which mutations should be optimistic, and justify the ones that should not",
    "Roll back an optimistic update that removed a row, not just changed a field",
  ],
  sections: [
    {
      id: "fetching",
      heading: "One way in and out",
      body: [
        "Every request in the app goes through one function. It does three things nothing else has to repeat: it sets the JSON header when there is a body, it turns a failed response into a typed error carrying the shape from NFR-4, and it *parses* the success case rather than casting it.",
      ],
      examples: [
        {
          id: "api-module",
          title: "web/src/lib/api.ts",
          lang: "typescript",
          code: `import { z } from "zod";
import { ApiError } from "@bug-tracker/shared";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

/** A failure the server described, carrying the one error shape from NFR-4. */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly fieldErrors?: ApiError["fieldErrors"],
    message?: string,
  ) {
    super(message ?? "Request failed");
    this.name = "ApiFailure";
  }
}

/* Parse, do not cast — NFR-1. \`as Bug[]\` compiles and is a lie the compiler
   will then defend: every downstream error points somewhere other than the
   wrong assumption. Parsing turns a backend change into one clear error here,
   at the boundary that can actually explain it. */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(\`\${BASE}\${path}\`, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers,
  });

  if (!response.ok) {
    const problem = ApiError.safeParse(await response.json().catch(() => null));
    throw new ApiFailure(
      response.status,
      problem.success ? problem.data.fieldErrors : undefined,
      problem.success ? problem.data.error : \`HTTP \${response.status}\`,
    );
  }

  return schema.parse(await response.json());
}`,
          explanation:
            "The generic is `z.ZodType<T>` rather than a concrete schema type, so callers pass `Bug`, `z.array(Bug)` or anything else and get the parsed type back with no annotation. Note the two `.catch(() => null)` calls around `response.json()`: a 500 from a proxy is very often HTML, and `await response.json()` on HTML throws a `SyntaxError` that would replace the real failure with a parsing one. Falling back to `null` lets `ApiError.safeParse` fail cleanly and the status code become the message.",
          requires: "tsc (this module only declares; it prints nothing)",
        },
      ],
      pitfalls: [
        {
          title: "`response.ok` is not `response.status === 200`",
          body: "`ok` is true for the whole 2xx range, which is what you want — the create endpoint returns 201. Checking for 200 specifically would turn every successful report into an error, and it is the kind of bug that passes review because the happy path in the test fixture happens to return 200.",
        },
      ],
    },
    {
      id: "keys",
      heading: "Every cache key in one table",
      body: [
        "A cache key written inline is a cache key that will be written slightly differently somewhere else, and two spellings of the same key are two caches. So they live in one object, and they are built so that a shorter key is a prefix of every longer one.",
      ],
      examples: [
        {
          id: "keys-table",
          title: "web/src/lib/queryKeys.ts",
          lang: "typescript",
          code: `import type { BugQuery } from "@bug-tracker/shared";

/* One table of keys, so no component ever writes a key by hand. Every key
   starts with the same prefix as its parents, which is what makes a partial
   key invalidate everything beneath it: invalidating ["bugs"] reaches every
   filtered list, and ["bugs", "list", projectId] reaches only that project's. */
export const queryKeys = {
  users: () => ["users"] as const,
  projects: () => ["projects"] as const,
  bugs: () => ["bugs"] as const,
  bugList: (projectId: string, filters: BugQuery) =>
    [...queryKeys.bugs(), "list", projectId, filters] as const,
  triage: (projectId: string) => [...queryKeys.bugs(), "triage", projectId] as const,
  bug: (bugId: string) => [...queryKeys.bugs(), "detail", bugId] as const,
  comments: (bugId: string) => [...queryKeys.bug(bugId), "comments"] as const,
};`,
          explanation:
            "The prefix relationship is the whole design. TanStack Query matches keys *partially*, so `invalidateQueries({ queryKey: [\"bugs\"] })` reaches every list, every filtered list, the triage queue, every open bug and every comment thread — which is exactly what a mutation that changed a bug's status should do, because it may have changed which lists that bug belongs to. Building `comments` on top of `bug` rather than as a sibling means invalidating one bug also refreshes its comments, and nothing else's.",
          requires: "tsc (this module only declares; it prints nothing)",
        },
      ],
      visual: {
        id: "capstone-keys",
        kind: "react-data",
        algorithm: "key-matching",
        lockAlgorithm: true,
        title: "Which entries a partial key reaches",
      },
      pitfalls: [
        {
          title: "The filters object is part of the key, and object identity is not",
          body: "`bugList(projectId, filters)` puts the whole filter object into the key. That is correct — two different filter sets are two different results and must not share a cache entry — and it works because TanStack Query hashes keys structurally rather than by reference. It also means the key changes on every keystroke in the search box, which is exactly why FR-5's debounce is a requirement rather than a nicety.",
        },
      ],
    },
    {
      id: "url-state",
      heading: "The filters are not state",
      body: [
        "FR-6 says the filtered view has its own address. That single requirement decides where the filters live: not in `useState`, but in the URL, read and written through one hook.",
      ],
      examples: [
        {
          id: "filters-hook",
          title: "web/src/hooks/useBugFilters.ts",
          lang: "typescript",
          code: `import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { BugQuery } from "@bug-tracker/shared";

/* FR-6. The filters are not state: they are where you are. Keeping them in the
   URL is what makes the filtered view shareable, reloadable and reachable with
   the back button, and it is one hook rather than the four-file change it
   becomes if you start with useState. */
export function useBugFilters() {
  const [params, setParams] = useSearchParams();

  const filters = BugQuery.parse({
    status: params.get("status") ?? undefined,
    severity: params.get("severity") ?? undefined,
    assigneeId: params.get("assigneeId") ?? undefined,
    q: params.get("q") ?? undefined,
  });

  const setFilter = useCallback(
    (key: keyof BugQuery, value: string | undefined) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      /* Replace rather than push: twenty keystrokes in the search box must not
         become twenty entries the back button has to walk out of. */
      setParams(next, { replace: key === "q" });
    },
    [params, setParams],
  );

  return { filters, setFilter };
}`,
          explanation:
            "`BugQuery.parse` is doing real work here, and it is where the `.catch()` from the shared schemas pays off: `?status=banana` yields `undefined` rather than throwing, so an address somebody edited by hand degrades to \"no filter\" instead of an error screen. The `replace: key === \"q\"` line is the difference between a back button that works and one that does not — a dropdown change is a navigation the user meant, and a keystroke is not.",
          requires: "tsc (this module only declares; it prints nothing)",
        },
      ],
    },
    {
      id: "queries",
      heading: "The queries",
      body: [
        "Two of the reads are worth showing together, because they are the same table asked two different questions — and having them as separate hooks with separate keys is what keeps the two orders from fighting.",
      ],
      examples: [
        {
          id: "bugs-hooks",
          title: "web/src/hooks/useBugs.ts",
          lang: "typescript",
          code: `const BugList = z.array(Bug);

function toSearch(filters: BugQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? \`?\${search}\` : "";
}

export function useBugs(projectId: string, filters: BugQuery) {
  return useQuery({
    queryKey: queryKeys.bugList(projectId, filters),
    queryFn: ({ signal }) =>
      request(\`/projects/\${projectId}/bugs\${toSearch(filters)}\`, BugList, { signal }),
    /* NFR-8. Without this, every filter change collapses the page to a spinner
       and the reader loses their place; with it the previous list stays put
       until the new one arrives. */
    placeholderData: keepPreviousData,
  });
}

/* FR-11. Its own key, because it is a different question with a different
   order — not the list with a filter on it. */
export function useTriageQueue(projectId: string) {
  return useQuery({
    queryKey: queryKeys.triage(projectId),
    queryFn: ({ signal }) => request(\`/projects/\${projectId}/triage\`, BugList, { signal }),
  });
}`,
          explanation:
            "The `signal` is NFR-6's other half. TanStack Query hands each query function an `AbortSignal` and aborts it when the query is superseded — so typing quickly in the search box does not leave five in-flight requests racing to be the one that resolves last. Passing it through to `fetch` is the entire implementation; forgetting to pass it is a bug you cannot see, because the results still arrive and usually in order.",
          requires: "tsc (imports elided; see the repository for the full file)",
        },
      ],
      pitfalls: [
        {
          title: "`keepPreviousData` is not `initialData`",
          body: "`initialData` seeds a key that has never been fetched, and it is the same value every time. `keepPreviousData` shows the result of the *previous key* while the new one loads — which is what NFR-8 asks for, because the previous key is the previous filter. It also means `isPending` stays false during that window, so a component that renders a spinner on `isPending` correctly does not, and one that renders it on `isFetching` incorrectly does.",
        },
      ],
    },
    {
      id: "mutations",
      heading: "Three mutations, three different answers",
      body: [
        "The interesting decisions in this app are all in the mutations, and they do not agree with each other — which is the point. \"Always be optimistic\" is not a rule; it is a question you answer per mutation, and the answer follows from what the user loses if it fails.",
        "**Changing a status is optimistic.** It is a decision the user already made, the server almost never refuses it, and the cost of being wrong is that a dropdown flicks back — annoying, and recoverable, because the value is still on screen.",
        "**Adding a comment is not optimistic.** It is content the user wrote. Showing it and then removing it loses their words, and no amount of rollback gives them back.",
        "**Triage is optimistic, and removes a row.** That is the hard one: the rollback has to put a row back rather than restore a field.",
      ],
      examples: [
        {
          id: "status-and-comment",
          title: "web/src/hooks/useBug.ts — the contrast",
          lang: "typescript",
          code: `/* FR-9, optimistic. Changing a status is a decision the user already made and
   the server almost never refuses, so showing it immediately is honest. The
   rollback is not optional: an optimistic update without one is a lie that
   survives until the next refetch. */
export function useUpdateBug(bugId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateBug) =>
      request(\`/bugs/\${bugId}\`, Bug, { method: "PATCH", body: JSON.stringify(patch) }),

    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: queryKeys.bug(bugId) });
      const previous = client.getQueryData<Bug>(queryKeys.bug(bugId));
      if (previous) client.setQueryData<Bug>(queryKeys.bug(bugId), { ...previous, ...patch });
      return { previous };
    },

    onError: (_error, _patch, context) => {
      if (context?.previous) client.setQueryData(queryKeys.bug(bugId), context.previous);
    },

    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.bugs() });
    },
  });
}

/* FR-10, deliberately *not* optimistic. A comment is content the user wrote; if
   it fails, showing it and then removing it loses their words. The pending
   state is the honest one here, and the contrast with the status control is
   the point. */
export function useAddComment(bugId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (comment: CreateComment) =>
      request(\`/bugs/\${bugId}/comments\`, Comment, {
        method: "POST",
        body: JSON.stringify(comment),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.comments(bugId) });
    },
  });
}`,
          explanation:
            "`cancelQueries` in `onMutate` is the line people leave out, and leaving it out produces a bug that looks like a race because it is one: a refetch already in flight resolves *after* the optimistic write and overwrites it with the old value, so the dropdown snaps back for no visible reason. Note also that `onSettled` invalidates the whole `[\"bugs\"]` prefix rather than the one bug: a status change can move a bug into or out of the triage queue and every filtered list, and the key table is built so that is one call.",
          requires: "tsc (imports elided; see the repository for the full file)",
        },
        {
          id: "triage-mutation",
          title: "web/src/hooks/useTriage.ts — rolling back a removal",
          lang: "typescript",
          code: `import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bug, type TriageOutcome } from "@bug-tracker/shared";
import { request } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

/* FR-12. Triage removes a bug from the queue it is displayed in, so an
   optimistic update here is not "change a field" but "drop a row" — and the
   rollback has to put it back in the right place. Filtering the cached list is
   enough because the server's order is severity then age, and removing an item
   cannot reorder the rest. */
export function useTriage(projectId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ bugId, outcome }: { bugId: string; outcome: TriageOutcome }) =>
      request(\`/bugs/\${bugId}/triage\`, Bug, {
        method: "POST",
        body: JSON.stringify({ outcome }),
      }),

    onMutate: async ({ bugId }) => {
      await client.cancelQueries({ queryKey: queryKeys.triage(projectId) });
      const previous = client.getQueryData<Bug[]>(queryKeys.triage(projectId));
      if (previous) {
        client.setQueryData<Bug[]>(
          queryKeys.triage(projectId),
          previous.filter((bug) => bug.id !== bugId),
        );
      }
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(queryKeys.triage(projectId), context.previous);
    },

    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.bugs() });
    },
  });
}`,
          explanation:
            "The rollback stores the *whole previous array* rather than the removed item and its index, and that is deliberate. Restoring one item by index is correct only if nothing else changed in the meantime, and something else can: a concurrent refetch, or a second triage decision the user made before the first one failed. Keeping the array is a few more bytes and is right under every interleaving. The comment above the hook is doing real work too — it records *why* filtering is enough here, so the next person does not have to re-derive that a removal cannot reorder a sorted list.",
          requires: "tsc (this is the complete file)",
        },
      ],
      pitfalls: [
        {
          title: "An optimistic update with no rollback is worse than none",
          body: "Without `onError`, a failed mutation leaves the cache holding a value the server rejected, and it stays there until something happens to refetch — which may be never, if the user does not change filters. The screen is then confidently wrong, and the user's next action is based on it. If you are not going to write the rollback, do not write the optimistic update: a spinner that is honest beats an instant result that is fiction.",
        },
        {
          title: "`onSettled`, not `onSuccess`, for the invalidation",
          body: "`onSettled` runs after both outcomes. Invalidating only on success means a *failed* mutation leaves the rolled-back cache unverified against the server — and the rollback restored what the client last believed, which may itself be stale. Refetching either way costs one request and makes the recovery path converge on the truth rather than on an older guess.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide whether a mutation should be optimistic?",
      answer:
        "Ask what the user loses if the optimistic version is wrong. For a status dropdown they lose nothing — the value is still on screen, it flicks back, and they can try again. For a comment they lose text they typed, which no rollback can return, so it stays pessimistic and shows a pending state instead. The second question is how often the server refuses: an operation with a real rule attached, like triage, will sometimes 409, so if you make it optimistic the rollback is not an edge case you can skip — it is a path users will actually see.",
    },
    {
      question: "Why does `onMutate` call `cancelQueries` first?",
      answer:
        "Because a refetch that is already in flight will resolve after the optimistic write and overwrite it with the pre-mutation value. The symptom is a control that snaps back a moment after the user changed it, with no error and nothing in the network tab that looks wrong — the request succeeded, it was just started before the change. Cancelling in-flight queries for that key closes the window.",
    },
    {
      question: "The triage rollback keeps the whole previous array. Why not just re-insert the removed bug?",
      answer:
        "Because re-inserting is only correct if nothing else changed while the request was in flight, and things can: a background refetch may have replaced the list, or the user may have triaged a second bug before the first failed. Restoring the snapshot you took in `onMutate` is right under every interleaving and costs an array reference. Re-inserting by index is the version that works in testing and produces a duplicated or misplaced row in production.",
    },
    {
      question: "Why is the whole `[\"bugs\"]` prefix invalidated after a status change, rather than the single bug?",
      answer:
        "Because a status change can move the bug between result sets. It may leave the triage queue, enter or leave any filtered list, and change what the unfiltered list shows — none of which the detail-key invalidation would touch. The key table is built as a prefix tree precisely so that this is one call instead of an enumeration of every filter combination currently in the cache, which the client cannot know anyway.",
    },
  ],
  takeaways: [
    "One request function: sets headers, parses the success case, and turns failures into one typed error",
    "Cache keys in one table, built as prefixes, so invalidating a parent reaches every child",
    "Filters live in the URL; replace history for keystrokes and push it for deliberate choices",
    "Whether a mutation is optimistic depends on what the user loses when it fails",
    "Cancel in-flight queries before writing optimistically, or a slower refetch will undo you",
    "Roll back with the snapshot you took, not by reversing the operation",
  ],
  status: "available",
};
