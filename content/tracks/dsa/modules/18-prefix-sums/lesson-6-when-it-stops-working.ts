import type { Lesson } from "@/content/types";

export const whenItStopsWorkingLesson: Lesson = {
  id: "dsa-ps-mutable",
  slug: "when-the-array-changes",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "When the Array Changes",
  summary:
    "Prefix sums assume the input is frozen. One update invalidates every prefix after it, and the whole technique collapses — which is exactly the follow-up interviewers use to move you on to segment trees.",
  estimatedMinutes: 25,
  objectives: [
    "Explain why a single update costs O(n) to repair",
    "Compare the three structures by their update and query costs",
    "Choose between them from the ratio of updates to queries",
    "Recognise the interview follow-up when it arrives",
  ],
  sections: [
    {
      id: "the-collapse",
      heading: "One update, O(n) of repair",
      body: [
        "Change `a[3]` and every `prefix[i]` for `i > 3` is now wrong. Repairing them is a linear pass, so a workload of many interleaved updates and queries costs O(n) per update — worse than having no prefix array at all, since the naive approach at least has O(1) updates.",
        "This is not a fixable detail. The prefix array is a *precomputation*, and precomputation is only worthwhile when the thing computed does not change.",
      ],
    },
    {
      id: "the-three",
      heading: "The three structures, by cost",
      body: [
        "**Prefix array** — build O(n), query O(1), update O(n). For a static array with many queries.",
        "**Fenwick tree (binary indexed tree)** — build O(n), query O(log n), update O(log n). Small, fast constants, easy to write in about ten lines. Needs an invertible operation, so it does sums and not minima.",
        "**Segment tree** — build O(n), query O(log n), update O(log n), and it handles *any* associative operation including min, max and GCD. Larger constant factor, more code, and it extends to lazy propagation for range updates.",
        "The decision is mechanical. **Static?** Prefix array. **Updates, and the operation is a sum?** Fenwick. **Updates, and the operation is not invertible?** Segment tree.",
      ],
      visual: {
        id: "segtree-visual",
        kind: "segment-tree",
        title: "A segment tree answering a range query",
      },
    },
    {
      id: "the-follow-up",
      heading: "The interview shape",
      body: [
        "There is a standard three-step escalation, and recognising it means you can see the next question coming.",
        "**\"Range sum query on a fixed array.\"** Prefix sums. This is LeetCode 303.",
        "**\"Now the array can be updated.\"** Fenwick or segment tree. LeetCode 307, explicitly named *Range Sum Query — Mutable*.",
        "**\"Now updates apply to a whole range too.\"** Segment tree with lazy propagation, or a difference array on top of a Fenwick tree.",
        "The useful move is to say out loud, at step one, that the prefix array assumes a static input — and to name what you would reach for if it were not. That answers step two before it is asked, and it is a cheap way to show you know the boundary of the technique rather than only the technique.",
      ],
      visual: {
        id: "fenwick-visual",
        kind: "fenwick-tree",
        title: "The Fenwick tree that answers step two",
      },
      pitfalls: [
        {
          title: "Rebuilding the prefix array inside a query loop",
          body: "The accidental version of this bug: a solution that rebuilds prefixes each time an update arrives, which is O(n) per update and turns an intended O(n log n) solution into O(n²). It passes the samples because the samples have few updates.",
        },
        {
          title: "Reaching for a segment tree when the array is static",
          body: "The overcorrection. If nothing changes, a prefix array is simpler, faster, and less to get wrong. Complexity that is not needed is still complexity.",
        },
      ],
    },
  ],
  takeaways: [
    "One element changing invalidates every prefix after it — O(n) to repair",
    "Prefix arrays are for static inputs, full stop",
    "Fenwick tree: O(log n) both ways, sums only, about ten lines",
    "Segment tree: O(log n) both ways, any associative operation, more code",
    "Static → prefix; mutable sums → Fenwick; mutable min/max → segment tree",
    "Name the static assumption out loud before the follow-up arrives",
    "Do not reach for a segment tree when nothing changes",
  ],
  status: "available",
};
