import type { Topic, TopicId } from "./types";

/**
 * The filing cabinet. A topic is *where a problem lives*; a pattern is *how you
 * solve it*. They are deliberately different axes — "Two Sum" is filed under
 * arrays and hashing, but the thing worth learning from it is the
 * hashing-for-lookup pattern, which also solves problems filed under strings and
 * under trees. Filter by topic when you are working through a syllabus; filter
 * by pattern when you are drilling a weakness.
 */
export const TOPICS: Topic[] = [
  { id: "arrays", name: "Arrays", blurb: "Contiguous memory, indices, and the scans over them." },
  { id: "strings", name: "Strings", blurb: "Arrays of characters, with immutability attached." },
  { id: "hashing", name: "Hashing", blurb: "Constant-time lookup, at the cost of order." },
  { id: "sorting", name: "Sorting", blurb: "Order as a preprocessing step, not a goal." },
  {
    id: "binary-search",
    name: "Binary Search",
    blurb: "Halving a space that has a yes/no boundary in it.",
  },
  { id: "linked-lists", name: "Linked Lists", blurb: "Pointer surgery, and the edge cases in it." },
  {
    id: "stacks-queues",
    name: "Stacks & Queues",
    blurb: "Two structures with one rule each, and what that rule buys.",
  },
  {
    id: "recursion",
    name: "Recursion & Backtracking",
    blurb: "Trusting the call, and pruning the tree it draws.",
  },
  { id: "trees", name: "Trees", blurb: "Where recursion stops being a trick and becomes the tool." },
  { id: "heaps", name: "Heaps", blurb: "The smallest thing so far, in logarithmic time." },
  { id: "graphs", name: "Graphs", blurb: "The general case. Most real problems are one in disguise." },
  { id: "greedy", name: "Greedy", blurb: "Locally best, and the proof that it is globally best." },
  {
    id: "dynamic-programming",
    name: "Dynamic Programming",
    blurb: "A recursion you believe, made fast by remembering.",
  },
  {
    id: "bit-manipulation",
    name: "Bit Manipulation",
    blurb: "Integers as sets, and the tricks that follow.",
  },
  { id: "math", name: "Math & Number Theory", blurb: "Counting, modular arithmetic, and primes." },
  { id: "design", name: "Design", blurb: "Composing structures to hit a stated complexity." },
];

const BY_ID = new Map<TopicId, Topic>(TOPICS.map((topic) => [topic.id, topic]));

export function getTopic(id: TopicId): Topic | undefined {
  return BY_ID.get(id);
}

export function topicName(id: TopicId): string {
  return BY_ID.get(id)?.name ?? id;
}
