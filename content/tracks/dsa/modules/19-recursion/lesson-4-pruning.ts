import type { Lesson } from "@/content/types";

export const pruningLesson: Lesson = {
  id: "dsa-rec-pruning",
  slug: "pruning-and-constraint-problems",
  moduleSlug: "recursion-and-backtracking",
  title: "Pruning & Constraint Problems",
  summary:
    "Backtracking without pruning is brute force with extra steps. N-queens is the demonstration: the same search, pruned, visits nine thousand times fewer nodes at n=8 — and that ratio grows.",
  estimatedMinutes: 35,
  objectives: [
    "Add constraint checks that reject a branch as early as possible",
    "Track constraints in O(1) rather than rescanning the partial solution",
    "Measure the difference pruning makes",
    "Apply the pattern to N-queens, sudoku and word search",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Reject early, not at the leaves",
      body: [
        "The naive way to solve a constraint puzzle is to generate every candidate and check each one at the end. Backtracking's advantage is that it can reject a *partial* candidate — and when it does, it discards the entire subtree beneath it unexamined.",
        "The earlier the rejection, the bigger the subtree discarded. Rejecting at depth 1 in an 8-queens search throws away everything below one of eight branches; rejecting at depth 7 throws away almost nothing.",
        "So the design question is always: **what is the earliest point at which I can know this branch is doomed?**",
      ],
      examples: [
        {
          id: "n-queens",
          title: "N-queens, pruned and unpruned",
          lang: "python",
          code: `def n_queens(n, count_only=True):
    """Pruning turns a factorial search into something that finishes."""
    cols = set()
    diag1 = set()          # r - c
    diag2 = set()          # r + c
    solutions = []
    nodes = [0]

    def place(row, board):
        nodes[0] += 1
        if row == n:
            solutions.append(board[:])
            return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue                                  # prune
            cols.add(col); diag1.add(row - col); diag2.add(row + col)
            board.append(col)
            place(row + 1, board)
            board.pop()
            cols.remove(col); diag1.remove(row - col); diag2.remove(row + col)

    place(0, [])
    return len(solutions), nodes[0], solutions

for n in (4, 5, 6, 8):
    count, nodes, sols = n_queens(n)
    print(f"n={n}: {count:3} solutions, {nodes:6,} nodes visited"
          f"   (n^n would be {n ** n:,})")

count, nodes, sols = n_queens(4)
print("\\nthe two 4-queens boards (column index per row):", sols)
for board in sols:
    print()
    for c in board:
        print("  " + "".join("Q" if i == c else "." for i in range(4)))

# Without pruning: generate every arrangement then filter.
def n_queens_no_prune(n):
    nodes = [0]
    found = [0]

    def place(row, board):
        nodes[0] += 1
        if row == n:
            ok = True
            for r1 in range(n):
                for r2 in range(r1 + 1, n):
                    if board[r1] == board[r2] or abs(board[r1] - board[r2]) == r2 - r1:
                        ok = False
            if ok:
                found[0] += 1
            return
        for col in range(n):
            board.append(col)
            place(row + 1, board)
            board.pop()

    place(0, [])
    return found[0], nodes[0]

print("\\npruned vs unpruned:")
for n in (4, 6, 8):
    _, pruned_nodes, _ = n_queens(n)
    found, raw_nodes = n_queens_no_prune(n)
    print(f"  n={n}: pruned {pruned_nodes:7,} nodes    unpruned {raw_nodes:9,} nodes"
          f"   ratio {raw_nodes / pruned_nodes:6.1f}x")`,
          output: `n=4:   2 solutions,     17 nodes visited   (n^n would be 256)
n=5:  10 solutions,     54 nodes visited   (n^n would be 3,125)
n=6:   4 solutions,    153 nodes visited   (n^n would be 46,656)
n=8:  92 solutions,  2,057 nodes visited   (n^n would be 16,777,216)

the two 4-queens boards (column index per row): [[1, 3, 0, 2], [2, 0, 3, 1]]

  .Q..
  ...Q
  Q...
  ..Q.

  ..Q.
  Q...
  ...Q
  .Q..

pruned vs unpruned:
  n=4: pruned      17 nodes    unpruned       341 nodes   ratio   20.1x
  n=6: pruned     153 nodes    unpruned    55,987 nodes   ratio  365.9x
  n=8: pruned   2,057 nodes    unpruned 19,173,961 nodes   ratio 9321.3x`,
          explanation:
            "**The ratio grows with n**: 20× at n=4, 366× at n=6, 9321× at n=8. Pruning is not a constant-factor optimisation — it changes the effective base of the exponential, and the gap widens without limit.\n\nNote that 2,057 nodes at n=8 is already less than the 16.7 million arrangements the search space nominally contains, and it is *also* far less than the 40,320 permutations that placing one queen per column would give. The constraint checks are doing real work at every level.",
        },
      ],
    },
    {
      id: "o1-checks",
      heading: "Checking constraints in O(1)",
      body: [
        "The pruning above never scans the board. Three sets do the work, and the diagonal encoding is the part worth knowing.",
        "**Columns.** A set of occupied column indices.",
        "**One diagonal.** Every square on a ↘ diagonal has the same `row - col`. So a set of those values marks the occupied ones.",
        "**The other diagonal.** Every square on a ↙ diagonal has the same `row + col`.",
        "That is three O(1) lookups per candidate square instead of an O(n) scan of the placed queens — and it is a general move: **find an invariant that identifies the constraint class, and index by it.** In sudoku the equivalent is `box = (row / 3) * 3 + col / 3`.",
      ],
    },
    {
      id: "the-family",
      heading: "The constraint family",
      body: [
        "**Sudoku Solver.** State: nine row sets, nine column sets, nine box sets. Choose the empty cell with the *fewest* remaining candidates rather than the first one — that single heuristic, called most-constrained-variable, is usually the difference between instant and hopeless.",
        "**Word Search.** The grid is the state. Mark a cell as visited on the way in, unmark on the way out — the un-choose again. Prune by checking the next character before recursing rather than after.",
        "**Combination Sum.** Sort the candidates, then `break` rather than `continue` once the running total exceeds the target: everything after it in a sorted list is worse. That turns a `continue` into a whole-subtree cut.",
        "**Palindrome Partitioning.** Precompute which substrings are palindromes with a DP table, so the check inside the search is O(1) rather than O(n).",
      ],
      pitfalls: [
        {
          title: "Checking validity at the leaves",
          body: "This is what the unpruned version above does, and it is brute force wearing a recursion. If your `if row == n` block contains a validity check, the pruning belongs further up.",
        },
        {
          title: "Rescanning the partial solution on every candidate",
          body: "An O(depth) validity check inside an O(n) loop at every level multiplies straight into the total. Maintain incremental state — sets, counters, bitmasks — and update it in the choose and un-choose steps.",
        },
        {
          title: "`continue` where `break` is correct",
          body: "On sorted input, once a candidate is too large every later one is too. `break` cuts the remaining siblings *and* their subtrees; `continue` visits them all to reject them individually. Same answer, very different cost.",
        },
      ],
    },
  ],
  takeaways: [
    "Reject partial candidates as early as possible — that discards whole subtrees",
    "Pruning changes the base of the exponential, so the gap grows with n",
    "Encode constraints so checks are O(1): `row - col` and `row + col` for diagonals",
    "Maintain incremental state in the choose/un-choose steps, never rescan",
    "On sorted candidates, `break` beats `continue` once the bound is exceeded",
    "Choose the most-constrained variable next when you have the freedom to",
  ],
  status: "available",
};
