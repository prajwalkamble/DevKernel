import type { Lesson } from "@/content/types";

export const choosingThePatternLesson: Lesson = {
  id: "dsa-framework-pattern",
  slug: "choosing-the-pattern",
  moduleSlug: "the-framework",
  title: "Step 6 — Match the Shape, Name the Pattern",
  summary:
    "Four questions that narrow every problem to one or two candidate techniques, and the near-identical pairs that trip people up when they answer them carelessly.",
  estimatedMinutes: 35,
  status: "available",
  objectives: [
    "Narrow any problem to a small candidate set using four questions about its shape",
    "Read the standard trigger phrases and say which pattern each one names",
    "Distinguish the pairs that look alike — window against prefix-plus-map, greedy against DP, heap against monotonic stack",
    "Decide between two candidates that both apply, rather than guessing",
  ],
  sections: [
    {
      id: "four-questions",
      heading: "Four questions that do most of the work",
      body: [
        "By this point you have a restatement, a brute force, a target complexity and a structure. What remains is to name the shape, and four questions get you there.",
        "**1 · Is the answer contiguous?** A subarray, a substring, a window in a stream — contiguity licenses the sliding window and the prefix sum. If the answer can skip elements, both are unavailable and you are usually looking at DP or at sorting-plus-greedy.",
        "**2 · Is the input, or can it be, ordered?** Sorted input licenses binary search and two pointers. If it is not sorted, ask whether sorting is *legal* — it is legal exactly when the answer does not depend on the original positions.",
        "**3 · What kind of answer is wanted?** The *best* one (an optimum) points at greedy or DP. *How many* (a count) points at DP or combinatorics. *All of them* (an enumeration) points at backtracking. *Whether one exists* (a decision) often points at a traversal or a union-find.",
        "**4 · Does the answer depend on the whole input, or on a local neighbourhood?** Local dependence — the next greater element, the previous smaller, the nearest anything — points at a monotonic structure. Global dependence points at a scan, a sort or a DP.",
        "Four answers, and the candidate set is usually down to two. That is the state you want to be in before writing code: choosing between two named techniques, with a reason.",
      ],
    },
    {
      id: "triggers",
      heading: "The phrases, and what each one names",
      body: [
        "Problem statements are written in a small dialect, and the same phrases recur. This is not about matching keywords blindly — it is that the phrases describe *shapes*, and the shapes have standard answers.",
      ],
      examples: [
        {
          id: "trigger-map",
          title: "Trigger → pattern",
          lang: "bash",
          code: `"longest / shortest CONTIGUOUS ... such that"    sliding window, variable
"every subarray of size k"                       sliding window, fixed
"the sum of the range i..j, many times"          prefix sums
"subarrays summing to k" (with negatives)        prefix sums + hash map
"two numbers that sum to X", input SORTED        two pointers, opposite ends
"two numbers that sum to X", input UNSORTED      hash map
"remove / rearrange IN PLACE"                    two pointers, same direction
"the minimum X such that ... is possible"        binary search on the answer
"sorted, and find"                               binary search on an index
"the NEXT greater / smaller element"             monotonic stack
"the maximum in each window of size k"           monotonic deque
"the k largest / most frequent / closest"        heap of size k (or buckets)
"the median of a stream"                         two heaps
"all permutations / subsets / combinations"      backtracking
"the number of ways to"                          DP
"the minimum cost / maximum value, with choices" DP
"can I finish, given prerequisites"              topological sort
"connected / groups / islands / provinces"       BFS, DFS or union-find
"the shortest path, unweighted"                  BFS
"the shortest path, weighted, no negatives"      Dijkstra
"detect a cycle in a linked list"                fast and slow pointers
"the array holds 1..n, find the missing one"     cyclic sort, or XOR
"prefix / autocomplete / starts with"            trie
"merge / insert / overlapping INTERVALS"         sort by start, then sweep`,
          explanation:
            "Two entries deserve attention because they are one word apart and completely different. \"Two numbers that sum to X\" is a hash map on unsorted input and two pointers on sorted input — and the second uses O(1) space where the first uses O(n). The statement will tell you which; the only question is whether you read it.",
        },
      ],
      pitfalls: [
        {
          title: "Matching on keywords instead of shape",
          body: "\"Longest substring\" does not mechanically mean sliding window. It means sliding window *when the validity condition is monotone* — when a window that is invalid cannot be fixed by growing it. Check the condition before committing. The phrase is a prompt to check, not a conclusion.",
        },
      ],
    },
    {
      id: "confusable",
      heading: "The pairs that look alike",
      body: [
        "Most wrong pattern choices are not wild guesses — they are one of about five confusions, each between two techniques that genuinely resemble each other. Knowing the distinguishing question for each is worth more than any amount of extra pattern knowledge.",
        "**Sliding window against prefix-sum-plus-hash-map.** Both find subarrays with a property. The window requires the property to be *monotone*: adding an element can only ever push the window further out of validity. With all-positive numbers, 'sum ≥ k' is monotone and a window works. Add a single negative number and it is not — extending can now *help* — so the window is wrong and you need prefix sums keyed in a hash map. **The question: can a negative, or a zero, make a bad window good again?**",
        "**Greedy against DP.** Both handle sequences of choices. Greedy commits to the locally best option and never reconsiders; DP keeps every reachable state. Greedy is right only when you can prove an exchange argument — that any optimal solution can be rewritten to start with your greedy choice without getting worse. **The question: can I construct a case where the locally best first move loses?** If you can, it is DP. Coin change is the standard demonstration: greedy on {1, 3, 4} for 6 gives 4+1+1 = three coins, and 3+3 = two is better.",
        "**Heap against monotonic stack or deque.** Both are about extremes. A heap gives you the extreme of *everything currently held*; a monotonic structure gives you the *nearest* element in a particular direction. **The question: do I want the biggest, or the nearest bigger?** They are not the same and only one of them is a heap.",
        "**BFS against Dijkstra.** Both find shortest paths. BFS's shortest is shortest in *number of edges*; the moment edges have differing weights it is simply wrong. **The question: are all the edges the same weight?** If the weights are only 0 and 1, neither is quite right and 0-1 BFS with a deque is.",
        "**Backtracking against DP.** Both explore choices. If the problem wants *all* the solutions listed, you must generate them and it is backtracking. If it wants a count or an optimum, you can collapse equivalent states and it is DP. **The question: does the answer need the objects themselves, or just a number about them?**",
      ],
      examples: [
        {
          id: "window-vs-prefix",
          title: "One negative number decides the pattern",
          lang: "bash",
          code: `A: "shortest subarray with sum >= 7"        nums = [2, 3, 1, 2, 4, 3]
   All values positive. Growing the window can only INCREASE the sum, and
   shrinking can only decrease it. Monotone. -> sliding window, O(n), O(1) space.

B: "how many subarrays sum to exactly 7"    nums = [2, -1, 3, 5, -2, 4]
   A negative is present. The window [2,-1,3] has sum 4; extending it to
   include 5 makes it 9; extending again to -2 brings it back to 7.
   A window that "overshot" became valid again by growing.
   NOT monotone. -> prefix sums in a hash map, O(n), O(n) space.

Same first six words. Different pattern, different space complexity.
The distinguishing question is not "does it say subarray" - it is
"can adding an element ever move me back toward validity".`,
          explanation:
            "This is the highest-value distinction in the array section of any sheet, and the one people most often get wrong — usually by trying the window, finding it fails on some test, and patching it rather than recognising the precondition was never met. Ask the monotonicity question *before* you commit, not after.",
        },
      ],
    },
    {
      id: "both-apply",
      heading: "When two patterns both work",
      body: [
        "Sometimes both candidates are correct. That is not a problem — it is a choice, and having a reason for it is what an interviewer is listening for.",
        "**Prefer the one that meets the constraints with room to spare.** If n is 10⁵ and one option is O(n log n) and the other O(n), they will both pass; take either and say why.",
        "**Prefer the one you can implement correctly under pressure.** A working O(n log n) beats a broken O(n) every time. Say this out loud — \"there is a linear solution using a monotonic deque; I'll write the heap version first since it's harder to get wrong, and describe the other\" is a strong answer, not a concession.",
        "**Prefer the one whose correctness you can argue.** If you cannot say why the greedy choice is safe, write the DP. An unjustified greedy that happens to pass is worth less than a DP you can explain, and it will not survive the follow-up.",
        "**Prefer the one that generalises to the follow-up you can see coming.** If the array is going to start changing, prefix sums are a dead end and a Fenwick tree is not.",
      ],
    },
    {
      id: "drill",
      heading: "Drilling recognition on its own",
      body: [
        "This step is a skill in its own right and it can be practised separately from solving — which is the fastest way to improve it, because you get ten repetitions in the time one full solve would take.",
        "The drill: take problems you have not solved, read only the statement and constraints, and write down three things — the target complexity, the structure, and the pattern. Then check against an editorial. Do not write any code. Twenty problems in half an hour, and you find out very quickly which patterns you cannot recognise, which is a far more useful thing to know than which ones you cannot implement.",
        "Two habits make the drill work. Give yourself sixty seconds per problem, because the skill being built is fast recognition and unlimited time trains something else. And write your answer down before checking — a guess you kept in your head will always feel like it was right.",
      ],
      examples: [
        {
          id: "drill-example",
          title: "Six drills, answered without writing code",
          lang: "bash",
          code: `"Given a string, return the length of the longest palindromic SUBSTRING."
   contiguous, best-one, n <= 1000
   -> expand around each centre, O(n^2). (Manacher is O(n) and rarely needed.)

"Given prices and a fee, maximise profit with unlimited transactions."
   sequence of choices, an optimum, n <= 5e4
   -> DP with two states (holding / not holding). Greedy fails: the fee means
      a local upward move is not always worth taking.

"Given a grid of 0s and 1s, find the shortest path from corner to corner."
   shortest, unweighted, grid
   -> BFS. Not DFS: DFS finds A path, not the shortest.

"Given n courses and prerequisite pairs, can all courses be finished?"
   a decision, dependencies, directed
   -> topological sort, or equivalently cycle detection on a directed graph.

"Return the maximum value in every window of size k."      n <= 1e5
   contiguous, an extreme within a moving range
   -> monotonic deque. A heap gives O(n log n) and also works; the deque is
      O(n). Say both.

"Given an array, return all subsets whose elements sum to a target."
   ALL of them, enumerated
   -> backtracking. The word "all" rules DP out: you need the objects,
      not a count.`,
          explanation:
            "None of these required an idea, and none of them required writing code. Every one was answered by the four questions plus the trigger table. That is the state this step is meant to leave you in — and thirty minutes of this drill moves recognition further than an afternoon of solving, because recognition is what you are actually short of.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you decide whether a problem is a sliding window?",
      answer:
        "Two conditions, both required. The answer has to be contiguous — a substring or subarray, not a subsequence — and the validity condition has to be monotone, meaning that if a window is invalid, extending it cannot make it valid again. The second is the one people skip. With all-positive numbers, 'sum at least k' is monotone and a window works; introduce a negative and extending can bring you back into validity, so the window is simply wrong and the answer is prefix sums in a hash map.",
    },
    {
      question: "How do you tell a greedy problem from a DP problem?",
      answer:
        "I try to break the greedy. I make the locally best choice on a small case and check whether an optimal solution has to start that way — that is the exchange argument. If I can construct a counterexample where the locally best first move loses, it is DP. Coin change is the standard one: with denominations 1, 3 and 4 and a target of 6, greedy takes the 4 and needs three coins, while 3+3 needs two. If I cannot break it and cannot prove it either, I write the DP, because a greedy I cannot justify will not survive the follow-up.",
    },
    {
      question: "You need the maximum of every sliding window of size k. Heap or deque?",
      answer:
        "Both work. A heap is O(n log n) and needs lazy deletion, since you cannot remove an arbitrary element cheaply — you leave stale entries and discard them when they surface at the root. A monotonic deque is O(n): it holds indices in decreasing value order, drops from the back anything the new element beats, and drops from the front anything that has left the window. I would name both, say the deque is optimal, and pick it if I am confident, because the heap's lazy deletion is where bugs live.",
    },
  ],
  takeaways: [
    "Four questions narrow almost any problem to two candidates: is it contiguous, is it ordered, what kind of answer is wanted, is the dependence local or global",
    "Trigger phrases name shapes, not solutions — treat a match as a prompt to check the precondition, never as a conclusion",
    "Window against prefix-plus-map turns on monotonicity: can adding an element move you back toward validity?",
    "Greedy against DP turns on whether you can break the greedy with a counterexample; if you cannot justify it, write the DP",
    "Heap against monotonic structure turns on whether you want the biggest or the nearest bigger",
    "When both patterns apply, choose on constraints, on what you can implement correctly, and on what you can justify — and say which you chose and why",
    "Recognition can be drilled on its own, sixty seconds a problem with no code, and that is the fastest way to improve it",
  ],
};
