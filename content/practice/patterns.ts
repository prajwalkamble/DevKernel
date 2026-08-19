import type { Pattern, PatternId } from "./types";

/**
 * The atlas. Seventeen shapes that between them account for most of what gets
 * asked, each written to be *recognised* rather than recalled.
 *
 * Every entry answers the same four questions in the same order, because that is
 * the order you need them in when you are staring at a problem you have not seen
 * before: what does the statement say that points here (`triggers`), what does
 * the pattern keep true while it runs (`invariant`), what does the code look like
 * (`template`), and where does it quietly not apply (`breaks`).
 *
 * The `invariant` field is the one to take seriously. Anyone can memorise the
 * sliding-window template; being able to say "the window between left and right
 * is always valid, so its width is always a candidate answer" is what separates
 * someone who will adapt it to a new problem from someone who will get stuck the
 * moment the problem is not the one they practised. It is also, word for word,
 * the sentence an interviewer is waiting to hear.
 *
 * The templates use placeholder names — `isFeasible`, `windowIsValid`,
 * `combine`. They are shapes to fill in, not programs to run; the runnable code
 * lives on the problems.
 */
export const PATTERNS: Pattern[] = [
  {
    id: "brute-force-enumeration",
    slug: "brute-force-enumeration",
    name: "Brute-Force Enumeration",
    tagline: "Try everything. The answer you should always be able to write in a minute.",
    triggers: [
      "You have just finished reading the problem and do not yet have an idea.",
      "The constraints are tiny — n ≤ 100, or n ≤ 20 with a subset flavour — and nothing cleverer is being asked for.",
      "You need a reference implementation to test a faster one against.",
    ],
    invariant:
      "Every candidate answer is generated exactly once, so if an answer exists this finds it. Correctness is free; only speed is in question.",
    template: {
      java: `for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {     // j starts at i + 1: pairs, not ordered pairs
        if (isAnswer(array[i], array[j])) {
            return answer(i, j);
        }
    }
}`,
      python: `for i in range(n):
    for j in range(i + 1, n):             # j starts at i + 1: pairs, not ordered pairs
        if is_answer(array[i], array[j]):
            return answer(i, j)`,
    },
    time: "O(n²) for pairs, O(n³) for triples, O(2ⁿ) for subsets",
    space: "O(1) beyond the output",
    breaks: [
      "It does not break — it is too slow. That is a different failure, and a much better one to have in front of you than a blank page.",
      "The one real trap is enumerating ordered pairs when the problem wants unordered ones, which double-counts. Starting the inner loop at `i + 1` is the fix.",
    ],
  },
  {
    id: "hashing-for-lookup",
    slug: "hashing-for-lookup",
    name: "Hashing for Lookup",
    tagline: "Trade memory for time: remember what you have seen so the second loop disappears.",
    triggers: [
      '"Find two things that combine to X" — the inner loop is a lookup in disguise.',
      '"Has this been seen before?", "is there a duplicate?", "does a complement exist?"',
      "You wrote a nested loop where the inner one only ever asks a membership question.",
    ],
    invariant:
      "When the scan reaches index i, the map holds exactly the elements before i. So a hit is always a genuine earlier partner, never the element itself.",
    template: {
      java: `Map<Key, Value> seen = new HashMap<>();
for (Item item : items) {
    Key wanted = complementOf(item);      // what would finish the pair?
    if (seen.containsKey(wanted)) {
        return combine(seen.get(wanted), item);
    }
    seen.put(keyOf(item), valueOf(item)); // only now — never before the check
}`,
      python: `seen: dict[Key, Value] = {}
for item in items:
    wanted = complement_of(item)          # what would finish the pair?
    if wanted in seen:
        return combine(seen[wanted], item)
    seen[key_of(item)] = value_of(item)   # only now - never before the check`,
    },
    time: "O(n) average",
    space: "O(n)",
    breaks: [
      "Inserting before checking. On `[3, 3]` with target 6, an insert-first loop matches element 0 against itself and returns `[0, 0]`.",
      "O(1) is the average, not the worst case. Adversarial keys can degrade a hash map to O(n) per operation — which is why some judges hack Java's `HashMap<Integer,…>` and you occasionally need a randomised key.",
      "The map destroys order. If the answer needs indices in a particular order, or the input is already sorted, two pointers is usually the better tool.",
    ],
  },
  {
    id: "frequency-counting",
    slug: "frequency-counting",
    name: "Frequency Counting",
    tagline: "Reduce a collection to how many of each, and the problem often collapses.",
    triggers: [
      '"Anagram", "permutation of", "same characters", "appears k times", "the majority element".',
      "Order does not matter to the answer — only multiplicity does.",
      "The alphabet is small and fixed, so an `int[26]` beats a hash map outright.",
    ],
    invariant:
      "The count map is a faithful summary of the multiset. Two collections are equal as multisets exactly when their count maps are equal.",
    template: {
      java: `Map<Character, Integer> counts = new HashMap<>();
for (char c : s.toCharArray()) {
    counts.merge(c, 1, Integer::sum);
}
for (char c : t.toCharArray()) {
    counts.merge(c, -1, Integer::sum);
}
// every entry back at zero means the two multisets were equal`,
      python: `counts = Counter(s)
counts.subtract(t)

# every entry back at zero means the two multisets were equal`,
    },
    time: "O(n)",
    space: "O(k), where k is the alphabet size — O(1) when the alphabet is fixed",
    breaks: [
      "Comparing counts without first comparing lengths. `\"a\"` against `\"aa\"` needs the length check, or a one-sided count comparison passes.",
      "Assuming lowercase ASCII. The moment Unicode is in scope, `c - 'a'` is wrong and you need a real map.",
      "`Counter(a) == Counter(b)` in Python treats a zero count and an absent key as different in some operations — `subtract` leaves zeros behind, so test with `all(v == 0 for v in counts.values())` rather than truthiness.",
    ],
  },
  {
    id: "two-pointers-opposite",
    slug: "two-pointers-opposite",
    name: "Two Pointers, Opposite Ends",
    tagline: "Start at both ends and walk inwards, discarding a whole side at each step.",
    triggers: [
      "The array is **sorted**, and you are looking for a pair with some property.",
      '"Palindrome", "reverse in place", "the container with the most water", "trap the rain".',
      "You have an O(n²) pair scan and the input has an ordering you are not yet using.",
    ],
    invariant:
      "Every pair worth considering lies between lo and hi. Moving a pointer inwards is only allowed when you can argue that every pair it discards was already beaten by one you have kept.",
    template: {
      java: `int lo = 0;
int hi = array.length - 1;
while (lo < hi) {
    if (isAnswer(array[lo], array[hi])) {
        return answer(lo, hi);
    }
    if (tooSmall(array[lo], array[hi])) {
        lo++;                             // only raising lo can help
    } else {
        hi--;                             // only lowering hi can help
    }
}`,
      python: `lo, hi = 0, len(array) - 1
while lo < hi:
    if is_answer(array[lo], array[hi]):
        return answer(lo, hi)
    if too_small(array[lo], array[hi]):
        lo += 1                           # only raising lo can help
    else:
        hi -= 1                           # only lowering hi can help`,
    },
    time: "O(n) after sorting, O(n log n) including it",
    space: "O(1)",
    breaks: [
      "Unsorted input. Without order, moving a pointer discards pairs you cannot rule out, and the answer is simply wrong — not slow, wrong.",
      "`lo <= hi` instead of `lo < hi` when the problem forbids pairing an element with itself.",
      "Duplicates. If the problem wants distinct answers, you must skip equal neighbours *after* recording a hit, not before.",
    ],
  },
  {
    id: "two-pointers-same-direction",
    slug: "two-pointers-same-direction",
    name: "Two Pointers, Same Direction",
    tagline: "A read pointer and a write pointer, so an in-place rewrite costs no extra memory.",
    triggers: [
      '"Remove in place", "without allocating another array", "return the new length".',
      "You want to filter or compact a sequence and the problem forbids extra space.",
      "One index needs to lag behind another by a distance the data decides.",
    ],
    invariant:
      "Everything before `write` is finished output. Everything from `read` onwards is untouched input. The two never cross, so nothing is overwritten before it is read.",
    template: {
      java: `int write = 0;                            // where the next kept item goes
for (int read = 0; read < n; read++) {    // where we are looking
    if (keep(array[read])) {
        array[write++] = array[read];
    }
}
return write;                             // the new length`,
      python: `write = 0                                 # where the next kept item goes
for read in range(n):                     # where we are looking
    if keep(array[read]):
        array[write] = array[read]
        write += 1
return write                              # the new length`,
    },
    time: "O(n)",
    space: "O(1)",
    breaks: [
      "Advancing `write` unconditionally. It moves only when something is kept — that is the whole mechanism.",
      "Reading `array[write]` expecting original input. It is output by then.",
      "Problems where a kept element depends on elements *after* it. Then the single forward pass is not enough and you need a second pass or a different shape.",
    ],
  },
  {
    id: "sliding-window-fixed",
    slug: "sliding-window-fixed",
    name: "Sliding Window, Fixed Size",
    tagline: "The window is always k wide, so each step is one element in and one out.",
    triggers: [
      '"Every subarray of size k", "the average of k consecutive", "the maximum sum of k".',
      "k is given in the statement rather than discovered from the data.",
    ],
    invariant:
      "After the setup loop, the accumulator always describes exactly the k elements ending at `right`. Sliding is an update, never a recomputation.",
    template: {
      java: `int sum = 0;
for (int i = 0; i < k; i++) {             // build the first window
    sum += array[i];
}
int best = sum;
for (int right = k; right < n; right++) { // then slide: one in, one out
    sum += array[right] - array[right - k];
    best = Math.max(best, sum);
}`,
      python: `total = sum(array[:k])                    # build the first window
best = total
for right in range(k, n):                 # then slide: one in, one out
    total += array[right] - array[right - k]
    best = max(best, total)`,
    },
    time: "O(n)",
    space: "O(1) for sums, O(k) if the window needs a map or a deque",
    breaks: [
      "n < k. The setup loop runs off the end; guard it.",
      "Non-invertible aggregates. Sums and counts can be undone by subtraction; maximums cannot, which is exactly why the monotonic deque exists.",
    ],
  },
  {
    id: "sliding-window-variable",
    slug: "sliding-window-variable",
    name: "Sliding Window, Variable Size",
    tagline: "Grow on the right while you can, shrink from the left while you must.",
    triggers: [
      '"Longest / shortest **substring** or **subarray** such that …" — contiguity plus a condition.',
      '"At most k distinct", "no repeating characters", "sum at least target".',
      "The condition is monotone: if a window is invalid, every larger window containing it is also invalid.",
    ],
    invariant:
      "After the inner while loop, the window `[left, right]` is valid. That is why its width is a legitimate candidate for the answer at every single step, and why one pass suffices.",
    template: {
      java: `int left = 0;
int best = 0;
for (int right = 0; right < n; right++) {
    include(array[right]);                // window grows on the right
    while (!windowIsValid()) {
        exclude(array[left]);             // and shrinks on the left
        left++;
    }
    best = Math.max(best, right - left + 1);
}`,
      python: `left = 0
best = 0
for right in range(n):
    include(array[right])                 # window grows on the right
    while not window_is_valid():
        exclude(array[left])              # and shrinks on the left
        left += 1
    best = max(best, right - left + 1)`,
    },
    time: "O(n) — each index enters the window once and leaves once",
    space: "O(k) for the window's bookkeeping",
    breaks: [
      "Negative numbers, when the condition is about a sum. `[1, -2, 3]` with 'sum ≥ 2' is not monotone, so shrinking can be wrong — that is a prefix-sum-plus-hash-map problem instead.",
      "Subsequences rather than substrings. A window is contiguous by construction; if the elements need not be adjacent, this is the wrong pattern.",
      "Moving `left` with an `if` instead of a `while`. One removal is often not enough to restore validity.",
    ],
  },
  {
    id: "prefix-sum",
    slug: "prefix-sum",
    name: "Prefix Sums",
    tagline: "Precompute running totals once, and every range query becomes one subtraction.",
    triggers: [
      '"The sum of the range i..j", asked many times.',
      '"Subarrays summing to k" — combine with a hash map of prefix values seen.',
      "The array does not change between queries.",
    ],
    invariant:
      "`prefix[i]` is the sum of the first i elements, always. So the sum of `[left, right]` is `prefix[right + 1] - prefix[left]`, with no special case for `left == 0`.",
    template: {
      java: `long[] prefix = new long[n + 1];           // prefix[i] = sum of the first i items
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + array[i];
}
// every range sum is now one subtraction
long sumOf = prefix[right + 1] - prefix[left];`,
      python: `prefix = [0] * (n + 1)                    # prefix[i] = sum of the first i items
for i, x in enumerate(array):
    prefix[i + 1] = prefix[i] + x

# every range sum is now one subtraction
sum_of = prefix[right + 1] - prefix[left]`,
    },
    time: "O(n) to build, O(1) per query",
    space: "O(n)",
    breaks: [
      "Updates. One changed element invalidates the whole suffix of the table — that is what a Fenwick or segment tree is for.",
      "Overflow. n up to 10⁵ with values up to 10⁹ overflows a 32-bit `int` at the third element. Use `long` in Java; Python's integers are arbitrary precision and will not warn you that C++ would have wrapped.",
      "The size-n+1 array with a leading zero is not decoration. Sizing it n and special-casing `left == 0` is where the off-by-one bugs come from.",
    ],
  },
  {
    id: "sorting-as-preprocessing",
    slug: "sorting-as-preprocessing",
    name: "Sorting as Preprocessing",
    tagline: "Spend O(n log n) once to make the rest of the problem easy.",
    triggers: [
      "The answer does not depend on the input order.",
      '"Group the ones that …", "find duplicates", "merge overlapping intervals".',
      "n log n is comfortably inside the constraints and you have no linear idea.",
    ],
    invariant:
      "After sorting, equal elements are adjacent and every element is ≥ the one before it. Both facts turn global questions into local ones.",
    template: {
      java: `Arrays.sort(array);                       // O(n log n), paid once
for (int i = 0; i < n; i++) {
    if (i > 0 && array[i] == array[i - 1]) {
        continue;                         // duplicates are now adjacent, so skipping is trivial
    }
    solveAssumingOrder(array, i);         // and the rest can assume order
}`,
      python: `array.sort()                              # O(n log n), paid once
for i in range(n):
    if i > 0 and array[i] == array[i - 1]:
        continue                          # duplicates are now adjacent, so skipping is trivial
    solve_assuming_order(array, i)        # and the rest can assume order`,
    },
    time: "O(n log n)",
    space: "O(log n) to O(n), depending on the sort",
    breaks: [
      "Problems that ask for original indices. Sort pairs of (value, index), or do not sort at all.",
      "`Arrays.sort(int[])` in Java is a dual-pivot quicksort with a documented O(n²) worst case that judges have exploited. Boxing to `Integer[]` gets you a stable merge sort — at a real memory cost.",
      "Sorting when a hash map would do it in O(n). Sorting is the fallback, not the reflex.",
    ],
  },
  {
    id: "binary-search-on-index",
    slug: "binary-search-on-index",
    name: "Binary Search on an Index",
    tagline: "Halve a sorted array until the target is cornered.",
    triggers: [
      '"Sorted array" plus "find" — and a constraint like n ≤ 10⁵ with 10⁵ queries.',
      "O(log n) is stated, or implied by the constraints being far too large for a scan.",
      "Rotated, or 2D-row-sorted: still binary-searchable, with one extra decision per step.",
    ],
    invariant:
      "If the target is present, it is inside `[lo, hi]`. Every step preserves that while halving the interval — so the loop cannot both terminate and have missed it.",
    template: {
      java: `int lo = 0;
int hi = array.length - 1;
while (lo <= hi) {                        // <= : the last window is one element wide
    int mid = lo + (hi - lo) / 2;
    if (array[mid] == target) {
        return mid;
    }
    if (array[mid] < target) {
        lo = mid + 1;                     // + 1 and - 1, or this never terminates
    } else {
        hi = mid - 1;
    }
}
return -1;`,
      python: `lo, hi = 0, len(array) - 1
while lo <= hi:                           # <= : the last window is one element wide
    mid = (lo + hi) // 2
    if array[mid] == target:
        return mid
    if array[mid] < target:
        lo = mid + 1                      # + 1 and - 1, or this never terminates
    else:
        hi = mid - 1
return -1`,
    },
    time: "O(log n)",
    space: "O(1)",
    breaks: [
      "`(lo + hi) / 2` overflows in Java and C++ once the indices are large. `lo + (hi - lo) / 2` is the habit worth building even though Python does not need it.",
      "Mixing `lo <= hi` with `hi = mid`. That is an infinite loop; the two conventions — `<=` with `mid ± 1`, or `<` with `hi = mid` — do not interchange.",
      "Unsorted input, or an input sorted by a different key than the one you are comparing on.",
    ],
  },
  {
    id: "binary-search-on-answer",
    slug: "binary-search-on-answer",
    name: "Binary Search on the Answer",
    tagline:
      "When checking an answer is easy but finding it is not, search the answer space instead of the input.",
    triggers: [
      '"The minimum X such that …" or "the maximum X such that …".',
      "Given a candidate answer, verifying it is a simple linear pass.",
      "Feasibility is monotone: if speed 5 works then 6 works; if 5 fails then 4 fails.",
    ],
    invariant:
      "The answer lies in `[lo, hi]`, and `isFeasible` is false everywhere below it and true everywhere from it upwards. The loop hunts that single boundary.",
    template: {
      java: `int lo = smallestPossibleAnswer;
int hi = largestPossibleAnswer;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;         // never (lo + hi) / 2 — that overflows
    if (isFeasible(mid)) {
        hi = mid;                         // mid works, so nothing above it is needed
    } else {
        lo = mid + 1;                     // mid fails, so everything below it fails
    }
}
return lo;                                // lo == hi == the smallest feasible answer`,
      python: `lo, hi = smallest_possible_answer, largest_possible_answer
while lo < hi:
    mid = (lo + hi) // 2
    if is_feasible(mid):
        hi = mid                          # mid works, so nothing above it is needed
    else:
        lo = mid + 1                      # mid fails, so everything below it fails
return lo                                 # lo == hi == the smallest feasible answer`,
    },
    time: "O(n log(range)) — the check runs once per halving",
    space: "O(1)",
    breaks: [
      "Non-monotone feasibility. Sketch the true/false line before writing a character; if it is not one clean flip, this pattern does not apply.",
      "Overflow inside `isFeasible`. Summing ceilings over 10⁴ piles of 10⁹ needs 64 bits.",
      "Bounds that exclude the answer. `hi` must be an answer that definitely works — usually the largest input value or the trivial upper bound, not a guess.",
    ],
  },
  {
    id: "monotonic-stack",
    slug: "monotonic-stack",
    name: "Monotonic Stack",
    tagline: "Answers 'the next element greater than this one' for every index, in one pass.",
    triggers: [
      '"The next greater / smaller element", "how many days until", "the span".',
      '"The largest rectangle", "trapping rain water" — both are next-smaller in disguise.',
      "You wrote an O(n²) scan that, for each i, looks rightwards for the first j beating it.",
    ],
    invariant:
      "The stack holds indices whose answer is still unknown, and their values are monotone. So the moment an element beats the top, it is that index's nearest such element — not just some element, the nearest.",
    template: {
      java: `Deque<Integer> stack = new ArrayDeque<>();   // holds indices, not values
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && array[i] > array[stack.peek()]) {
        int resolved = stack.pop();       // array[i] is its next greater element
        answer[resolved] = i - resolved;
    }
    stack.push(i);
}`,
      python: `stack: list[int] = []                     # holds indices, not values
for i in range(n):
    while stack and array[i] > array[stack[-1]]:
        resolved = stack.pop()            # array[i] is its next greater element
        answer[resolved] = i - resolved
    stack.append(i)`,
    },
    time: "O(n) — each index is pushed once and popped at most once",
    space: "O(n)",
    breaks: [
      "Storing values instead of indices. Almost every question of this family wants a *distance*, and you cannot recover one from a value.",
      "Getting `>` and `>=` the wrong way round. With duplicates, one of them resolves equal neighbours and the other does not; decide which the problem wants.",
      "Whatever is still on the stack at the end never found an answer. Leaving it at the array's default zero is usually right — but say so out loud rather than leaving it to luck.",
    ],
  },
  {
    id: "top-k-heap",
    slug: "top-k-heap",
    name: "Top-K with a Heap",
    tagline: "Keep a heap of size k and you never pay to sort the other n − k.",
    triggers: [
      '"The k largest / smallest / most frequent", "the median of a stream".',
      "k is much smaller than n, and a full sort would be doing far too much work.",
      "The data arrives as a stream and cannot all be held at once.",
    ],
    invariant:
      "The heap holds the best k seen so far, and its root is the *worst* of those k. So the root is exactly the element to evict when a better one arrives.",
    template: {
      java: `PriorityQueue<Item> heap = new PriorityQueue<>(worstFirst);
for (Item item : items) {
    heap.offer(item);
    if (heap.size() > k) {
        heap.poll();                      // evict the worst — the heap stays size k
    }
}`,
      python: `heap: list[tuple[int, Item]] = []         # min-heap keyed on the score
for item in items:
    heapq.heappush(heap, (score(item), item))
    if len(heap) > k:
        heapq.heappop(heap)               # evict the worst - the heap stays size k`,
    },
    time: "O(n log k)",
    space: "O(k)",
    breaks: [
      "Using a max-heap for the k largest. It has to be a **min**-heap, so the cheapest element to discard is the one at the root. This is the single most common slip in the pattern.",
      "Python's `heapq` is min-only. For a max-heap you negate the key — and then remember to negate it back.",
      "When counts are bounded by n, bucket sort beats the heap outright at O(n). 'Top k frequent' is the classic case.",
    ],
  },
  {
    id: "tree-dfs",
    slug: "tree-dfs",
    name: "Tree DFS",
    tagline: "Answer for the children, then combine. The recursion is the algorithm.",
    triggers: [
      '"The depth", "the diameter", "path sums", "validate this tree", "the lowest common ancestor".',
      "The answer for a node is a function of the answers for its subtrees.",
      "An in-order walk of a BST is needed — that walk is sorted, which is often the entire trick.",
    ],
    invariant:
      "Each call returns the correct answer for the subtree rooted at its node, assuming its own recursive calls do. Establish the base case and the combine step, and induction does the rest — you never trace the stack by hand.",
    template: {
      java: `int solve(TreeNode node) {
    if (node == null) {
        return baseCase;                  // the empty tree answers first
    }
    int left = solve(node.left);          // trust the call
    int right = solve(node.right);
    return combine(left, right, node.val);
}`,
      python: `def solve(node: TreeNode | None) -> int:
    if node is None:
        return base_case                  # the empty tree answers first
    left = solve(node.left)               # trust the call
    right = solve(node.right)
    return combine(left, right, node.val)`,
    },
    time: "O(n) — every node visited once",
    space: "O(h) for the call stack, which is O(n) on a degenerate tree",
    breaks: [
      "Validating a BST by comparing a node only to its immediate children. The constraint is a range inherited from every ancestor, not a local comparison.",
      "Deep, skewed trees. 10⁵ nodes in a line overflows the default stack in Java and hits Python's 1000-frame recursion limit; that is when you convert to an explicit stack.",
      "Confusing 'the answer at this node' with 'the answer to return upwards'. Diameter is the classic: you return the height but record the diameter in a field.",
    ],
  },
  {
    id: "tree-bfs",
    slug: "tree-bfs",
    name: "Tree BFS (Level Order)",
    tagline: "A queue, and one snapshot of its size per level.",
    triggers: [
      '"Level by level", "the right-hand view", "the widest level", "zigzag order".',
      '"The minimum depth" — BFS finds it without exploring a deep left branch first.',
      "The answer depends on distance from the root rather than on subtree structure.",
    ],
    invariant:
      "At the top of each outer iteration, the queue holds exactly one complete level. Freezing `queue.size()` before the inner loop is what makes that true — read it inside the loop and it changes underneath you.",
    template: {
      java: `Deque<TreeNode> queue = new ArrayDeque<>();
queue.add(root);
while (!queue.isEmpty()) {
    int width = queue.size();             // freeze it: this is one whole level
    for (int i = 0; i < width; i++) {
        TreeNode node = queue.poll();
        visit(node);
        if (node.left != null)  queue.add(node.left);
        if (node.right != null) queue.add(node.right);
    }
    endOfLevel();
}`,
      python: `queue = deque([root])
while queue:
    for _ in range(len(queue)):           # freeze it: this is one whole level
        node = queue.popleft()
        visit(node)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    end_of_level()`,
    },
    time: "O(n)",
    space: "O(w), the widest level — up to n/2 for a complete tree",
    breaks: [
      "A null root. `queue.add(null)` then dereferencing it is the standard crash; guard before the loop.",
      "Using `ArrayDeque` and pushing nulls — it rejects them outright, which is a good thing and a confusing first stack trace.",
      "Using a `LinkedList`/list as a queue in Python. `list.pop(0)` is O(n), turning the whole traversal quadratic. `collections.deque` is the right structure.",
    ],
  },
  {
    id: "graph-traversal",
    slug: "graph-traversal",
    name: "Graph Traversal (BFS & DFS)",
    tagline: "Visit everything reachable, exactly once — and get shortest paths free if you use BFS.",
    triggers: [
      '"Connected components", "islands", "regions", "can you get from A to B".',
      '"The fewest steps" on an **unweighted** graph — that is BFS, not Dijkstra.',
      "A grid. A grid is a graph where the neighbours are the four cells around you.",
    ],
    invariant:
      "A node is marked visited at most once, and only unvisited nodes are ever enqueued. That bounds the work at O(V + E) and is what stops a cycle looping forever.",
    template: {
      java: `boolean[] visited = new boolean[n];
Deque<Integer> queue = new ArrayDeque<>();
queue.add(start);
visited[start] = true;                    // mark on ENQUEUE, not on dequeue
while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int next : adjacency.get(node)) {
        if (!visited[next]) {
            visited[next] = true;
            queue.add(next);
        }
    }
}`,
      python: `visited = [False] * n
queue = deque([start])
visited[start] = True                     # mark on ENQUEUE, not on dequeue
while queue:
    node = queue.popleft()
    for nxt in adjacency[node]:
        if not visited[nxt]:
            visited[nxt] = True
            queue.append(nxt)`,
    },
    time: "O(V + E)",
    space: "O(V)",
    breaks: [
      "Marking visited on dequeue instead of on enqueue. It still terminates, but a node can sit in the queue many times over and the memory blows up.",
      "Weighted edges. BFS's shortest path is shortest in *number of edges*; the moment weights differ, you need Dijkstra.",
      "Recursive DFS on a 10⁵-node graph. Java overflows the stack, Python hits its recursion limit — use the explicit-stack form or BFS.",
    ],
  },
  {
    id: "dp-one-dimension",
    slug: "dp-one-dimension",
    name: "One-Dimensional DP",
    tagline: "A recursion you already believe, made fast by writing its answers down.",
    triggers: [
      '"The number of ways", "the minimum cost", "the maximum you can take" — and choices at each step.',
      "Your brute-force recursion recomputes the same argument over and over.",
      '"You cannot take two adjacent" and similar local constraints on a linear sequence.',
    ],
    invariant:
      "`dp[i]` is the answer for the prefix of length i, and it depends only on strictly smaller indices. That is what makes the left-to-right fill legitimate.",
    template: {
      java: `int[] dp = new int[n + 1];
dp[0] = baseCase;
for (int i = 1; i <= n; i++) {
    dp[i] = combine(dp[i - 1], dp[i - 2], input[i]);
}
return dp[n];`,
      python: `dp = [0] * (n + 1)
dp[0] = base_case
for i in range(1, n + 1):
    dp[i] = combine(dp[i - 1], dp[i - 2], data[i])
return dp[n]`,
    },
    time: "O(n) states × O(1) per state",
    space: "O(n), and usually O(1) once you notice only the last two entries are read",
    breaks: [
      "Writing the table before you can state, in one English sentence, what `dp[i]` means. If you cannot say it, the recurrence will be guesswork.",
      "Base cases. Almost every wrong DP is a right recurrence with a wrong `dp[0]` or `dp[1]`.",
      "Reaching for tabulation first. Write the plain recursion, add memoisation, *then* invert it — inventing the bottom-up order from scratch is the hard way round.",
    ],
  },
];

const BY_ID = new Map<PatternId, Pattern>(PATTERNS.map((pattern) => [pattern.id, pattern]));

export function getPattern(id: PatternId): Pattern | undefined {
  return BY_ID.get(id);
}

export function patternName(id: PatternId): string {
  return BY_ID.get(id)?.name ?? id;
}
