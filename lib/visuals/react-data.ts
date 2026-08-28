/**
 * The query cache: how a key is matched, and how an entry lives and dies.
 *
 * `keyMatching()` implements the comparison React Query actually performs —
 * `partialDeepEqual`, where every key present in the filter must equal the
 * corresponding key in the entry, and anything the filter does not mention is
 * ignored. On arrays that rule *is* prefix matching, which is why the shape of
 * a key table decides what one invalidation reaches. The keys below are the
 * capstone's real `queryKeys` object, and every match in every frame is the
 * matcher's own verdict, so a key table that did not nest would visibly fail
 * to be invalidated rather than being described as working.
 *
 * `cacheLifecycle()` runs a real clock against real `staleTime` and `gcTime`
 * values, with a real observer count. The frame that says "served from cache,
 * no request" says it because the entry was fresh when the check ran.
 */
import { Recorder, type Role, type SequenceFrame, type Visualisation } from "./types";

/* ------------------------------------------------- 1. matching a key -- */

/**
 * React Query's `partialDeepEqual`, written out.
 *
 * Every key present in `filter` must match the same key in `entry`; anything
 * `entry` has that `filter` does not mention is irrelevant. Applied to two
 * arrays, that is exactly "is `filter` a prefix of `entry`" — which is the
 * whole mechanism, and the reason it is written as one function rather than
 * as a `startsWith` on a serialised string.
 */
function partialMatch(filter: unknown, entry: unknown): boolean {
  if (filter === entry) return true;
  if (typeof filter !== typeof entry) return false;
  if (filter && entry && typeof filter === "object" && typeof entry === "object") {
    return Object.keys(filter).every((key) =>
      partialMatch(
        (filter as Record<string, unknown>)[key],
        (entry as Record<string, unknown>)[key],
      ),
    );
  }
  return false;
}

/** The capstone's key table, verbatim. */
const queryKeys = {
  users: ["users"] as const,
  projects: ["projects"] as const,
  issues: {
    all: ["issues"] as const,
    list: (projectId: string, query: object) =>
      [...queryKeys.issues.all, "list", projectId, query] as const,
    detail: (issueId: string) => [...queryKeys.issues.all, "detail", issueId] as const,
    comments: (issueId: string) =>
      [...queryKeys.issues.all, "detail", issueId, "comments"] as const,
  },
} as const;

const show = (key: readonly unknown[]): string =>
  `[${key.map((part) => (typeof part === "object" && part !== null ? JSON.stringify(part) : JSON.stringify(part))).join(", ")}]`;

function keyMatching(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  /* What is in the cache after someone has browsed for a minute: two lists
     under different filters, one issue open, its comments, and the two
     reference lists that never change. */
  const cache: { key: readonly unknown[]; note: string }[] = [
    { key: queryKeys.users, note: "the people" },
    { key: queryKeys.projects, note: "the projects" },
    { key: queryKeys.issues.list("p_web", {}), note: "the unfiltered list" },
    { key: queryKeys.issues.list("p_web", { status: "open" }), note: "filtered to open" },
    { key: queryKeys.issues.detail("i_1"), note: "one issue" },
    { key: queryKeys.issues.comments("i_1"), note: "its comments" },
    /* And one entry keyed by hand at a call site, the way it gets written
       when there is no table. It describes the same data as the third row. */
    { key: ["issueList", "p_web"], note: "written by hand at a call site" },
  ];

  const emit = (
    filter: readonly unknown[] | null,
    roles: (i: number) => Role | undefined,
    note: string,
  ) =>
    rec.push({
      kind: "sequence",
      items: cache.map((entry, i) => ({
        id: `k${i}`,
        label: show(entry.key),
        role: roles(i),
      })),
      pins: filter ? { 0: `invalidating ${show(filter)}` } : {},
      note,
    });

  emit(null, () => undefined, "Seven entries in the cache. Six were built by the key table; the last one was written as a literal at a call site, which is what happens when there is no table.");

  /* --- invalidate one issue --- */
  const detailFilter = queryKeys.issues.detail("i_1");
  const detailHits = cache.map((entry) => partialMatch(detailFilter, entry.key));
  rec.bump("matched", detailHits.filter(Boolean).length);
  emit(
    detailFilter,
    (i) => (detailHits[i] ? "found" : "discarded"),
    `A comment is posted, so the app invalidates ${show(detailFilter)}. The matcher checks every entry: an entry matches when every element of the filter equals the element at the same position. ${detailHits.filter(Boolean).length} of 7 match — the issue *and* its comments, because the comments key is that key plus one element.`,
  );

  emit(
    detailFilter,
    (i) => (detailHits[i] ? "found" : undefined),
    "That second match is the whole reason to nest. Nobody wrote \"also invalidate the comments\"; it falls out of the comments key being built from the detail key.",
  );

  /* --- invalidate every issue --- */
  const allFilter = queryKeys.issues.all;
  const allHits = cache.map((entry) => partialMatch(allFilter, entry.key));
  rec.bump("matched", allHits.filter(Boolean).length);
  emit(
    allFilter,
    (i) => (allHits[i] ? "found" : "discarded"),
    `Now a status change, which affects the lists as well as the issue. One call with ${show(allFilter)} matches ${allHits.filter(Boolean).length} entries: both lists under both filters, the issue and its comments — and leaves users and projects alone, because they do not start with "issues".`,
  );

  /* --- the hand-written key, which no filter reaches --- */
  const missed = cache
    .map((entry, i) => ({ entry, i }))
    .filter(({ i }) => !allHits[i] && !detailHits[i])
    .filter(({ entry }) => entry.note.includes("hand"));

  emit(
    allFilter,
    (i) => (allHits[i] ? "found" : missed.some((m) => m.i === i) ? "stale" : "discarded"),
    `And there is the bug. ${show(cache[6].key)} holds the same issue list as row three, but it does not begin with "issues", so no invalidation of "issues" will ever reach it. It goes on serving the list as it was before the write — a stale screen after a successful mutation, intermittent because it depends on which component happens to be mounted.`,
  );

  emit(
    null,
    (i) => (i === 6 ? "stale" : "unchanged"),
    "Which is the argument for the table. It is not tidiness: the prefix relationship between the keys is a functional property, and it only holds if every key is built from the same place.",
  );

  return {
    frames: rec.frames,
    summary:
      "React Query matches an entry against a filter by comparing every element the filter mentions and ignoring the rest — on arrays, exactly \"is this key a prefix of that one\". So the shape of the key table decides what one `invalidateQueries` reaches: because the comments key is built from the detail key and both are built from `[\"issues\"]`, invalidating an issue also invalidates its comments, and invalidating `[\"issues\"]` catches every list under every filter without naming any of them. A key written as a literal at a call site sits outside that relationship and no invalidation will ever match it, which shows up as a stale screen after a write that succeeded.",
  };
}

/* --------------------------------------------- 2. the life of an entry -- */

/**
 * What `staleTime` and `gcTime` actually do, on a clock.
 *
 * The clock is a number this function advances, and every "fetch or serve
 * from cache" decision is taken by comparing it against the entry's real
 * `dataUpdatedAt`. The second mount serves instantly because the entry was
 * genuinely still fresh when it asked, not because the frame says so.
 */
function cacheLifecycle(): Visualisation {
  const rec = new Recorder<SequenceFrame>();

  const STALE_TIME = 30_000;
  const GC_TIME = 300_000;

  let now = 0;
  let requests = 0;

  interface Entry {
    dataUpdatedAt: number;
    observers: number;
    /** Set when the last observer leaves; the entry is dropped at this time. */
    gcAt: number | null;
  }
  let entry: Entry | null = null;

  const isFresh = () => entry !== null && now - entry.dataUpdatedAt < STALE_TIME;

  const emit = (stage: string, roles: Record<number, Role>, note: string) => {
    const age = entry === null ? null : now - entry.dataUpdatedAt;
    rec.push({
      kind: "sequence",
      items: [
        { id: "clock", label: `t = ${(now / 1000).toFixed(0)}s`, role: roles[0] },
        {
          id: "entry",
          label:
            entry === null
              ? "cache: empty"
              : `cache: ${isFresh() ? "fresh" : "stale"} (age ${(age! / 1000).toFixed(0)}s)`,
          role: roles[1],
        },
        { id: "obs", label: `observers: ${entry?.observers ?? 0}`, role: roles[2] },
        { id: "req", label: `requests: ${requests}`, role: roles[3] },
      ],
      pins: { 0: stage },
      note,
    });
  };

  /** A component subscribing to this key. Fetches only if it has to. */
  const mount = (): boolean => {
    if (entry === null) {
      requests++;
      entry = { dataUpdatedAt: now, observers: 1, gcAt: null };
      return true;
    }
    entry.observers++;
    entry.gcAt = null;
    if (isFresh()) return false;
    requests++;
    entry.dataUpdatedAt = now;
    return true;
  };

  const unmount = () => {
    if (!entry) return;
    entry.observers--;
    if (entry.observers === 0) entry.gcAt = now + GC_TIME;
  };

  const tick = (ms: number) => {
    now += ms;
    if (entry && entry.gcAt !== null && now >= entry.gcAt) entry = null;
  };

  emit("start", { 0: "unchanged" }, "Nothing cached, nothing mounted. `staleTime` is 30 seconds and `gcTime` is five minutes — the two numbers this whole lifecycle turns on.");

  const first = mount();
  emit("IssueList mounts", { 1: "mounted", 3: first ? "updated" : "discarded" }, `The list screen subscribes to the key. Nothing is cached, so React Query fetches: ${requests} request.`);

  tick(5_000);
  const second = mount();
  emit("IssueCount mounts (same key)", { 2: "updated", 3: second ? "updated" : "found" }, `Five seconds later a second component subscribes to the *same* key. It is served from the cache with no request — still ${requests}. That is deduplication, and it is why two components can each "fetch" the same data without you coordinating them.`);

  unmount();
  tick(10_000);
  emit("IssueCount unmounts", { 2: "updated" }, "One observer leaves. The entry stays — it still has a subscriber, and it would stay for `gcTime` even if it did not.");

  tick(20_000);
  emit("35s in", { 1: "stale" }, `The entry is now ${((now - entry!.dataUpdatedAt) / 1000).toFixed(0)} seconds old, past the 30-second \`staleTime\`. "Stale" does not mean deleted or hidden: it is still on screen and still served instantly. It means the next thing that asks will trigger a background refetch.`);

  const third = mount();
  emit("navigate back to the list", { 1: "updated", 3: third ? "updated" : "found" }, `Navigating back subscribes again. The entry was stale, so React Query serves the cached data immediately *and* refetches — ${requests} requests now. The screen never shows a spinner; it shows the old data and quietly replaces it.`);

  unmount();
  unmount();
  emit("everything unmounts", { 2: "discarded" }, `No observers left. The entry is not dropped now — a \`gcTime\` timer starts, so coming back within five minutes finds it still there.`);

  tick(60_000);
  emit("a minute later", { 1: "stale", 2: "discarded" }, "Still cached with nobody watching. This is the case that makes back-navigation instant, and it is the reason the cache is worth having at all.");

  tick(GC_TIME);
  emit("past gcTime", { 1: "discarded" }, `Five minutes with no observer, and the entry is dropped. The next mount is a cold fetch again — the cache is a cache, not a store.`);

  const fourth = mount();
  emit("mount again", { 1: "mounted", 3: fourth ? "updated" : "found" }, `Which is exactly what happens: ${requests} requests. Four mounts, four decisions, and only three of them cost a request.`);

  return {
    frames: rec.frames,
    summary:
      "`staleTime` is how long data is trusted; `gcTime` is how long it is kept. Inside `staleTime` a new subscriber is served from the cache and no request is made, which is what turns two components asking for the same thing into one fetch. After it, the data is still served instantly — stale means \"refetch in the background\", never \"hide\" — so navigating back shows the old list and replaces it without a spinner. When the last subscriber leaves, `gcTime` decides how long the entry survives unwatched, which is the whole of what makes back-navigation feel instant. Both defaults exist to be tuned per query: a user list that changes monthly wants a large `staleTime`; a dashboard counter wants none.",
  };
}

/* ------------------------------------------------------------- table -- */

export const REACT_DATA_ALGOS = {
  "key-matching": {
    label: "One invalidation, and what it reaches",
    run: keyMatching,
  },
  "cache-lifecycle": {
    label: "staleTime, gcTime and one entry's life",
    run: cacheLifecycle,
  },
} as const;

export type ReactDataName = keyof typeof REACT_DATA_ALGOS;
