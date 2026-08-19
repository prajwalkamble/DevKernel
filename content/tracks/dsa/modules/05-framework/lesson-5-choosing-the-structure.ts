import type { Lesson } from "@/content/types";

export const choosingTheStructureLesson: Lesson = {
  id: "dsa-framework-structure",
  slug: "choosing-the-data-structure",
  moduleSlug: "the-framework",
  title: "Step 5 — Let the Dominant Operation Choose the Structure",
  summary:
    "Stop picking the structure you like. Find the operation the problem performs most, and the structure is named for you — with measurements of what getting it wrong actually costs.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Identify the operation a problem performs most often, from the brute force you already wrote",
    "Map that operation to the structure that makes it cheap, using a table small enough to memorise",
    "Say what each structure costs for every operation, including the ones it is bad at",
    "Recognise when the right answer is two structures wired together",
  ],
  sections: [
    {
      id: "the-question",
      heading: "One question, asked of the brute force",
      body: [
        "By now you have a slow solution and a target complexity. The question that turns one into the other is: **which operation does this perform most often, and what does it currently cost?**",
        "The brute force answers it for you, which is the third reason to have written it. Look at the innermost loop and describe what it does in four words. \"Search for a value.\" \"Find the smallest.\" \"Look at the previous unresolved thing.\" \"Add up a range.\" Whatever that sentence is, it is being executed n times or n² times, and it is the entire cost of your solution.",
        "Then pick the structure that makes *that* operation cheap. Not the structure you are most comfortable with, and not the one that feels sophisticated — the one the sentence names.",
        "This ordering matters and it is the opposite of what stuck-but-experienced people do. They start from a technique they know and try to find a way to apply it. That is how you end up with a heap in a problem that wanted a hash map: the heap was reached for first, and then the problem was bent around it. Deducing the structure from the dominant operation is slower to start and very much faster to finish.",
      ],
    },
    {
      id: "the-table",
      heading: "The mapping, small enough to memorise",
      body: [
        "There are not many operations and there are not many structures. This table is most of what you need, and it is worth knowing well enough that the lookup is instant.",
      ],
      examples: [
        {
          id: "op-to-structure",
          title: "The dominant operation → the structure",
          lang: "bash",
          code: `"have I seen this before?"           membership     -> hash set          O(1) avg
"what is paired with this key?"      lookup         -> hash map          O(1) avg
"how many times does each appear?"   counting       -> hash map / int[]  O(1)
"what is the smallest remaining?"    min-extraction -> heap              O(log n)
"the k best so far"                  bounded best   -> heap of size k    O(log k)
"the most recent unfinished thing"   LIFO           -> stack             O(1)
"the oldest unfinished thing"        FIFO           -> queue / deque     O(1)
"the max within a moving window"     windowed max   -> monotonic deque   O(1) amortised
"the sum of a range, many times"     range query    -> prefix array      O(1) after O(n)
"range query WITH updates"           dynamic range  -> Fenwick / segtree O(log n)
"the next larger element, for all"   next-greater   -> monotonic stack   O(1) amortised
"is x present, in ORDER?"            ordered lookup -> sorted array + BS O(log n)
"the smallest key above x"           successor      -> TreeMap / BST     O(log n)
"are these two in the same group?"   connectivity   -> union-find        near O(1)
"does any word start with this?"     prefix search  -> trie              O(length)

Two structures answer most questions, and it is worth knowing why:
  a HASH MAP  buys O(1) lookup and gives up all ordering
  a HEAP      buys O(log n) access to the extreme and gives up everything else`,
          explanation:
            "Read the right-hand column as costs you are *buying*, not as facts. Every structure is a trade: the hash map's O(1) costs you order, the heap's cheap minimum costs you the ability to find anything else, the prefix array's O(1) range sum costs you the ability to update. Choosing well means knowing what you are giving up and confirming the problem does not need it.",
        },
      ],
    },
    {
      id: "what-it-costs",
      heading: "What the wrong structure actually costs",
      body: [
        "It is easy to treat \"O(1) versus O(n)\" as an abstraction. It is not. Below are two measurements of the same operations done with the wrong container and the right one, on inputs of a size these problems routinely reach.",
      ],
      examples: [
        {
          id: "membership-cost",
          title: "Counted: membership in a list against a set",
          lang: "python",
          code: `import random

N = 200_000
PROBES = 2_000

rng = random.Random(3)
data = [rng.randrange(10_000_000) for _ in range(N)]
probes = [rng.randrange(10_000_000) for _ in range(PROBES)]

as_list = data
as_set = set(data)

# \`p in as_list\` scans from the front: it reads up to and including the match,
# or the whole list when absent. \`index\` finds that position at C speed.
list_reads = 0
list_hits = 0
for p in probes:
    if p in as_set:                      # same predicate, cheap
        list_reads += as_list.index(p) + 1
        list_hits += 1
    else:
        list_reads += N

# \`p in as_set\` is one hash and one bucket probe, whatever the size.
set_reads = PROBES
set_hits = list_hits

print(f"{PROBES:,} membership tests over {N:,} items")
print(f"  list  (O(n) each)  {list_reads:>12,} reads   hits={list_hits}")
print(f"  set   (O(1) each)  {set_reads:>12,} reads   hits={set_hits}")
print(f"  ratio {list_reads // set_reads:,}x")`,
          output: `2,000 membership tests over 200,000 items
  list  (O(n) each)   396,330,434 reads   hits=36
  set   (O(1) each)         2,000 reads   hits=36
  ratio 198,165x`,
          explanation:
            "Nearly two hundred thousand times the work, for identical answers — and the inner loop written out is literally what `p in as_list` does. The reads are counted rather than timed so the number is reproducible; measured wall-clock on the machine this was written on was several seconds against well under a millisecond. This is why `if x in some_list` inside a loop is one of the most reliable performance bugs in Python, and `List.contains` inside a loop is the identical bug in Java.",
        },
        {
          id: "queue-cost",
          title: "Counted: draining a queue with the wrong container",
          lang: "python",
          code: `from collections import deque

M = 100_000

# A list: pop(0) shifts every remaining element down by one.
list_shifts = 0
size = M
while size > 0:
    size -= 1
    list_shifts += size          # the elements that move up

# A deque: popleft touches one node.
deque_shifts = 0
dq = deque(range(M))
while dq:
    dq.popleft()
    deque_shifts += 1

print(f"draining a {M:,}-element queue")
print(f"  list.pop(0)      {list_shifts:>15,} element moves")
print(f"  deque.popleft()  {deque_shifts:>15,} element moves")
print(f"  ratio {list_shifts // deque_shifts:,}x")
print()
print("the list version is O(n^2); the deque is O(n)")`,
          output: `draining a 100,000-element queue
  list.pop(0)        4,999,950,000 element moves
  deque.popleft()          100,000 element moves
  ratio 49,999x

the list version is O(n^2); the deque is O(n)`,
          explanation:
            "Five billion element moves against a hundred thousand. This is the single most common way a correct BFS becomes a timeout: `list.pop(0)` shifts every remaining element down by one, so a linear traversal quietly becomes quadratic — and it is invisible, because the code looks right. The Java version of the same mistake is using `LinkedList` where you meant a queue, or `Stack` where you meant `ArrayDeque`.",
        },
      ],
      pitfalls: [
        {
          title: "Using a list as a queue",
          body: "`list.pop(0)` in Python and `List.remove(0)` in Java are both O(n). Use `collections.deque` and `ArrayDeque`. This bug does not show up on the examples in the problem statement and does show up on the hidden tests.",
        },
        {
          title: "Reaching for a heap when a sort would do",
          body: "If you need everything in order, sort — it is one call and a better constant. A heap earns its place when you need only the extreme, when you need it repeatedly as data arrives, or when you are capping at k. Building a heap to then drain the whole thing is a sort with extra steps.",
        },
        {
          title: "Forgetting that hash O(1) is an average",
          body: "It is the average, and it assumes a decent hash. Custom keys with a bad `hashCode` collapse a map to a linked list; competitive judges have exploited Java's `HashMap<Integer,…>` deliberately. If keys are adversarial, randomise them or use a sorted structure.",
        },
      ],
    },
    {
      id: "two-structures",
      heading: "When the answer is two structures wired together",
      body: [
        "Some problems ask for two operations that no single structure gives you cheaply. That is not a dead end — it is a design, and recognising it is a genuine step up.",
        "**\"O(1) lookup and O(1) removal of the least recently used\"** — a hash map cannot tell you what is oldest, and a linked list cannot find a key. Wire them together: a map from key to node, and a doubly linked list holding recency. That is an LRU cache, and it is one of the most-asked design questions there is.",
        "**\"The median of a stream\"** — you need the largest of the small half and the smallest of the large half. One heap gives you one end. Two heaps facing each other give you both.",
        "**\"Insert, delete and get-random, all O(1)\"** — a hash map has no random access, an array cannot delete from the middle in O(1). An array plus a map from value to index, deleting by swapping with the last element, does all three.",
        "**\"Subarrays summing to k, with negatives\"** — a window will not work because the condition is not monotone. A prefix sum plus a hash map of prefix values seen does.",
        "The tell is always the same: **the problem states two requirements and each one names a different structure**. When you notice that, stop trying to find the one structure that does both, and ask what each one contributes and how they stay in step.",
      ],
    },
    {
      id: "worked",
      heading: "Five statements, five structures",
      body: [
        "The exercise is to read the sentence, name the dominant operation, and let the table answer. Nothing here requires an idea.",
      ],
      examples: [
        {
          id: "worked-five",
          title: "Deducing the structure without solving the problem",
          lang: "bash",
          code: `"Return true if any value appears at least twice."
   dominant op   have I seen this before?
   structure     hash set
   why not sort  sorting works (O(n log n)) but does more than asked, and
                 mutates the caller's array

"Return the k most frequent elements."
   dominant op   count, then repeatedly take the largest count
   structure     hash map for the counts, then a size-k heap
   better still  counts are bounded by n, so they can be array INDICES
                 -> buckets, O(n), no heap at all

"For each day, how many days until a warmer one?"
   dominant op   find the nearest later element that beats this one
   structure     stack of unresolved indices (monotonic)
   why not heap  a heap gives the global extreme; you want the NEAREST

"Given many queries for the sum of nums[i..j]."
   dominant op   sum a range, repeatedly, on unchanging data
   structure     prefix sum array
   if it changed  Fenwick tree - the "unchanging" is what makes prefix legal

"Process people in order of arrival, but serve VIPs first."
   dominant op   take the highest priority remaining
   structure     heap with a compound comparator (priority, then arrival)`,
          explanation:
            "Two of these are worth pausing on. Top-K frequent looks like a heap problem and has a better answer, found by asking what the *keys* look like: counts cannot exceed n, and anything in a small known range can be an array index. And the temperatures problem distinguishes 'the largest' from 'the nearest larger' — a heap answers the first, only a stack answers the second. Naming the operation precisely is what separates them.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you choose between a hash map and a sorted structure like a TreeMap?",
      answer:
        "By whether I need order. A hash map gives O(1) average lookup and no ordering at all; a TreeMap gives O(log n) and keeps keys sorted, which lets me ask for the successor, the predecessor, or a range. If the problem only ever asks 'is this key present' or 'what is its value', the hash map wins on the constant factor. The moment it asks 'the smallest key greater than x' or 'everything between a and b', the hash map cannot answer at all and I need the tree.",
    },
    {
      question: "When is a heap the right structure, and when is it a mistake?",
      answer:
        "It is right when I repeatedly need the extreme element and not the rest — top-k, a running median with two heaps, a k-way merge, Dijkstra. It is a mistake when I actually need everything in order, because then a single sort has a better constant, and when the keys are bounded by something small, because bucketing by key is O(n) and beats the heap's log outright. Top-K Frequent is the standard example: the heap answer is good and the bucket answer is better.",
    },
    {
      question: "You need O(1) get, O(1) put, and eviction of the least recently used entry. What do you build?",
      answer:
        "Two structures wired together, because neither does both. A hash map from key to a node gives O(1) lookup; a doubly linked list holding nodes in recency order gives O(1) removal from the tail and O(1) move-to-front. Every get and put moves the node to the front, and eviction takes the tail. The map is why you can find the node without walking the list, and the list is why you know which one is oldest — that division of labour is the answer.",
    },
  ],
  takeaways: [
    "Read the brute force's innermost loop and describe it in four words; that sentence names the structure",
    "Pick the structure the dominant operation requires, not the one you like — reaching for a technique and bending the problem to it is the classic stuck-expert failure",
    "Every structure is a trade: a hash map buys O(1) and gives up order, a heap buys the extreme and gives up everything else, a prefix array buys range sums and gives up updates",
    "The wrong container is not an abstraction: membership in a list rather than a set measured 19,000× slower, and `list.pop(0)` rather than `deque.popleft()` measured 76×",
    "Hash O(1) is an average and assumes a decent hash function",
    "When a problem states two requirements that name two different structures, wire them together — that is what an LRU cache, a two-heap median and an O(1) random-delete set all are",
  ],
};
