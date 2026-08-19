import type { Lesson } from "@/content/types";

export const sequenceContainersLesson: Lesson = {
  id: "cpp-sequence-containers",
  slug: "deque-list-and-forward-list",
  moduleSlug: "standard-library",
  title: "deque, list & forward_list — and When Each Actually Wins",
  summary:
    "The three sequence containers people reach for instead of `vector`, usually for the wrong reason. What each is actually made of, the operations only they can do, and measurements showing a linked list losing a traversal by ten times while winning a front-insert by four hundred.",
  estimatedMinutes: 35,
  objectives: [
    "Describe the memory layout of `deque`, `list` and `forward_list`",
    "Say which operations each makes cheap that `vector` does not",
    "Explain why a linked list loses badly at traversal",
    "Use `splice` and explain why it is O(1)",
    "Choose a container from the access pattern rather than from habit",
  ],
  sections: [
    {
      id: "what-they-are",
      heading: "What each one is made of",
      body: [
        "**`std::deque`** is a *double-ended queue*: an array of pointers to fixed-size blocks of elements. Indexing costs two indirections rather than one, but the front and the back can both grow in O(1), and **growing never moves the existing elements** — because only the block index is reallocated, not the data.",
        "**`std::list`** is a doubly linked list. Each element is a separately allocated node holding two pointers and the value. Insertion and erasure anywhere are O(1) *given an iterator*, and no other element is disturbed.",
        "**`std::forward_list`** is a singly linked list — one pointer per node instead of two. It exists to be the minimum-overhead linked list and pays for it by having no `size()` (it would cost O(n) or an extra member), no `push_back`, and only forward iteration.",
        "The trade is always the same. **`vector` buys cache locality with expensive middle-insertion; the node-based containers buy cheap insertion with terrible locality.** Each `list` node is a separate allocation that may be anywhere in memory, so traversing one is a chain of dependent loads the prefetcher cannot help with.",
      ],
      examples: [
        {
          id: "measurements",
          title: "Front insertion and traversal, measured",
          lang: "cpp",
          code: `#include <chrono>
#include <deque>
#include <forward_list>
#include <iostream>
#include <list>
#include <vector>

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

int main() {
    constexpr int N = 200000;

    std::cout << "sizeof the container object itself:\\n";
    std::cout << "  vector       " << sizeof(std::vector<int>) << " bytes\\n";
    std::cout << "  deque        " << sizeof(std::deque<int>) << " bytes\\n";
    std::cout << "  list         " << sizeof(std::list<int>) << " bytes\\n";
    std::cout << "  forward_list " << sizeof(std::forward_list<int>) << " bytes\\n";

    std::cout << "\\ninsert " << N << " elements at the FRONT:\\n";
    std::cout << "  deque        " << timeMs([&]{
        std::deque<int> d;
        for (int i = 0; i < N; ++i) d.push_front(i);
    }) << " ms\\n";
    std::cout << "  list         " << timeMs([&]{
        std::list<int> l;
        for (int i = 0; i < N; ++i) l.push_front(i);
    }) << " ms\\n";
    std::cout << "  vector       " << timeMs([&]{
        std::vector<int> v;
        for (int i = 0; i < N; ++i) v.insert(v.begin(), i);
    }) << " ms\\n";

    std::cout << "\\nsum all elements, 50 passes:\\n";
    std::vector<int> v(N, 1);
    std::deque<int>  d(N, 1);
    std::list<int>   l(N, 1);

    volatile long long sink = 0;
    std::cout << "  vector       " << timeMs([&]{
        for (int p = 0; p < 50; ++p) { long long s = 0; for (int x : v) s += x; sink = s; }
    }) << " ms\\n";
    std::cout << "  deque        " << timeMs([&]{
        for (int p = 0; p < 50; ++p) { long long s = 0; for (int x : d) s += x; sink = s; }
    }) << " ms\\n";
    std::cout << "  list         " << timeMs([&]{
        for (int p = 0; p < 50; ++p) { long long s = 0; for (int x : l) s += x; sink = s; }
    }) << " ms\\n";
    (void)sink;
}`,
          output: `sizeof the container object itself:
  vector       24 bytes
  deque        80 bytes
  list         24 bytes
  forward_list 8 bytes

insert 200000 elements at the FRONT:
  deque        0 ms
  list         15 ms
  vector       6465 ms

sum all elements, 50 passes:
  vector       5 ms
  deque        16 ms
  list         47 ms`,
          explanation:
            "**Both halves of the trade, in one program.** Inserting at the front, `vector` took 6.5 seconds against a `deque`'s sub-millisecond — because each `insert(begin())` shifts every existing element, making the loop O(n²). Traversing, the order reverses: `vector` summed in 5ms where `list` took 47ms, nearly ten times slower for identical work, purely because the nodes are scattered and every step is a cache miss. `deque` sits between the two on both counts, which is the honest summary of what it is. (Timings are from one machine at `-O2`; the ratios are the point, not the absolute numbers.)",
        },
      ],
      pitfalls: [
        {
          title: "\"I insert in the middle, so I need a list\" is usually wrong",
          body: "The O(1) insertion assumes you already hold an iterator to the position. If you have to *find* the position first, that search is O(n) and — on a list — is the slow scattered traversal above. For anything under a few thousand elements of a small type, `vector` usually wins even for middle insertion, because memmove of contiguous memory is enormously faster per element than chasing pointers. Measure before switching. The real reasons to choose `list` are stable references, O(1) splice, and elements that are expensive or impossible to move.",
        },
      ],
    },
    {
      id: "what-only-they-do",
      heading: "The operations only they offer",
      body: [
        "Performance is the wrong reason to pick these containers most of the time. **Their guarantees are the right reason.**",
        "**`deque` never invalidates references when growing at either end.** `push_front` and `push_back` invalidate *iterators* but leave pointers and references to existing elements valid, because the elements themselves never move. `vector` cannot promise that. If you need a growable sequence and stable element addresses, `deque` is the answer.",
        "**`list` invalidates nothing except the erased element.** Insert, erase, splice or reorder as much as you like; every other iterator, pointer and reference stays valid. That is unmatched by any other standard container.",
        "**`list::splice` moves elements between lists in O(1)** by relinking nodes. No elements are copied, moved or even touched, and iterators into the spliced range remain valid and now refer into the destination list. There is no equivalent anywhere else in the library.",
        "**`list` also has `sort`, `merge`, `remove`, `remove_if`, `unique` and `reverse` as member functions**, which exist because the generic algorithms need random access or would copy elements. `list::sort` relinks nodes rather than moving values, so it works for types that cannot be moved at all.",
      ],
      examples: [
        {
          id: "splice",
          title: "`splice`, and iterators that survive everything",
          lang: "cpp",
          code: `#include <iostream>
#include <iterator>
#include <list>
#include <vector>

int main() {
    // splice: list moves nodes between lists in O(1), no elements touched.
    std::list<int> a{1, 2, 3};
    std::list<int> b{10, 20, 30};

    auto it = a.begin();
    ++it;                            // points at 2
    int* addressOf2 = &*it;

    a.splice(a.end(), b);            // ALL of b moves into a. O(1).

    std::cout << "a after splice:";
    for (int x : a) std::cout << ' ' << x;
    std::cout << "\\nb is now empty, size = " << b.size() << '\\n';

    // The iterator into a is STILL VALID -- nodes did not move in memory.
    std::cout << "iterator still valid, *it = " << *it
              << ", same address = " << (&*it == addressOf2) << '\\n';

    // list::erase invalidates only the erased element's iterator.
    std::list<int> c{1, 2, 3, 4};
    auto keep = c.begin();            // -> 1
    auto kill = std::next(c.begin()); // -> 2
    c.erase(kill);
    std::cout << "after erasing 2, iterator to 1 is still valid: "
              << *keep << '\\n';

    // Contrast: vector::erase shifts everything after it.
    std::vector<int> v{1, 2, 3, 4};
    std::cout << "vector erase shifts elements; iterators from the erased\\n"
              << "position onwards are invalidated.\\n";
    v.erase(v.begin() + 1);
    std::cout << "v:";
    for (int x : v) std::cout << ' ' << x;
    std::cout << '\\n';
}`,
          output: `a after splice: 1 2 3 10 20 30
b is now empty, size = 0
iterator still valid, *it = 2, same address = 1
after erasing 2, iterator to 1 is still valid: 1
vector erase shifts elements; iterators from the erased
position onwards are invalidated.
v: 1 3 4`,
          explanation:
            "**Thirty elements could have moved and none did** — `splice` relinked three pointers and `b` was empty. The address check confirms it: `&*it` is unchanged after the splice, so the node never moved. That is the property to reach for `list` for. Compare the `vector` at the bottom, where erasing element 1 shifted 3 and 4 down by one, moving real data and invalidating every iterator from that point on.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing",
      body: [
        "**Default to `vector`.** It is right far more often than intuition suggests, and the burden of proof is on the alternative. The Core Guidelines say this outright.",
        "**Choose `deque`** when you need efficient insertion and removal at *both* ends, or when you need a growable sequence whose element addresses stay stable. It is the default underlying container for `std::stack` and `std::queue` for exactly this reason.",
        "**Choose `list`** when you need iterators and references that survive arbitrary insertion and erasure, when you need O(1) splice, or when elements cannot be moved or copied.",
        "**Choose `forward_list`** essentially never, unless memory is so tight that one pointer per node matters — an intrusive structure in an embedded system. Its missing `size()` and `push_back` make it awkward for general use.",
        "And consider that **the answer may not be a sequence container at all**: a sorted `vector` with `std::lower_bound` beats a `map` for lookup-heavy workloads that rarely change, and a `vector` of indices often beats a list of pointers.",
      ],
      examples: [
        {
          id: "decision",
          title: "The properties side by side",
          lang: "cpp",
          code: `// Complexity and invalidation, at a glance.
//
//                     vector        deque         list       forward_list
// ---------------------------------------------------------------------------
// index []            O(1)          O(1)*         --          --
// push_back           O(1) amort.   O(1)          O(1)        --
// push_front          O(n)          O(1)          O(1)        O(1)
// insert (middle)     O(n)          O(n)          O(1)**      O(1)**
// erase (middle)      O(n)          O(n)          O(1)        O(1)
// find a value        O(n)          O(n)          O(n)        O(n)
// memory per element  minimal       small         2 ptrs      1 ptr
// contiguous          yes           no            no          no
//
//   * two indirections rather than one
//  ** given an iterator to the position -- finding it is still O(n)
//
// INVALIDATION on insertion:
//   vector        everything, if it reallocates; else from the point on
//   deque         all ITERATORS; references and pointers stay valid
//   list          nothing
//   forward_list  nothing
//
// INVALIDATION on erasure:
//   vector        from the erased position onwards
//   deque         all iterators; refs/ptrs to other elements survive
//                 (erasing at an end invalidates only the erased one)
//   list          only the erased element
//   forward_list  only the erased element`,
          output: `# The one line worth memorising:
#   default to vector; justify anything else with the ACCESS PATTERN,
#   not with an intuition about insertion cost.`,
          explanation:
            "**Note that the `find` row is O(n) for all four.** Whenever the operation you actually perform is \"locate an element by value\", none of these containers helps and the answer is an associative container or a sorted `vector` — that is the next lesson. The invalidation rows are the ones worth returning to: `deque`'s asymmetry, where insertion invalidates iterators but *not* references, is the detail most people do not know and the reason it is a better `vector` substitute than it looks.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How is `std::deque` implemented, and what does that buy you?",
      answer:
        "As an array of pointers to fixed-size blocks of elements. Indexing costs two indirections instead of one, and the elements are not contiguous overall, but both ends can grow in O(1) and — crucially — growing never moves existing elements, because only the block index array is reallocated. So `push_front` and `push_back` invalidate all iterators while leaving pointers and references to existing elements valid, which `vector` cannot promise. That combination is why `deque` is the default underlying container for `std::stack` and `std::queue`.",
    },
    {
      question: "Why is traversing a `std::list` so much slower than traversing a `std::vector`?",
      answer:
        "Because each list node is a separate allocation and may sit anywhere in memory, so traversal is a chain of dependent pointer loads that the hardware prefetcher cannot predict — nearly every step is a cache miss. A vector's elements are contiguous, so one cache line fetch brings in several elements and the prefetcher can run ahead. Measured over 200,000 ints and 50 passes, the vector summed in 5ms and the list in 47ms, about ten times slower for identical work. The list also pays two pointers of memory overhead per element.",
    },
    {
      question: "When is `std::list` genuinely the right choice?",
      answer:
        "When you need iterators, pointers and references that survive arbitrary insertion and erasure — nothing is invalidated except the erased element, which no other standard container offers. When you need O(1) `splice` to move elements between lists by relinking nodes, without touching the elements at all. And when the elements cannot be moved or copied, since `list::sort` and friends relink nodes rather than moving values. Performance for middle insertion is usually *not* a good reason, because finding the position is still O(n) and the scan is slow.",
    },
    {
      question: "Why does `std::forward_list` have no `size()`?",
      answer:
        "Because it would cost something. Providing O(1) `size()` requires storing a count and updating it on every insertion and erasure, which is a member and extra work; computing it on demand would be O(n) and a surprising cost hidden behind an innocuous call. `forward_list` exists specifically to be the minimum-overhead linked list — one pointer per node, matching a hand-written C list — so it declines to pay for anything optional. It also has no `push_back` for the same reason, since that needs a tail pointer. Use `std::distance(begin(), end())` if you really need the count.",
    },
    {
      question: "How would you choose between these containers?",
      answer:
        "Default to `vector` and make the alternative justify itself — the Core Guidelines say this explicitly. Choose `deque` for efficient insertion at both ends, or when you need a growable sequence with stable element addresses. Choose `list` for iterator and reference stability, O(1) splice, or immovable elements. Choose `forward_list` essentially never, unless one pointer per node genuinely matters. And consider that the answer may not be a sequence container at all: if the real operation is lookup by value, every one of these is O(n) and you want an associative container or a sorted vector with `lower_bound`.",
    },
  ],
  takeaways: [
    "`deque` is an array of pointers to fixed-size blocks — O(1) at both ends, two indirections to index",
    "`deque` growth invalidates iterators but not pointers or references, because elements never move",
    "`list` is a doubly linked list: O(1) insert and erase given an iterator, nothing else invalidated",
    "`forward_list` has one pointer per node and therefore no `size()` and no `push_back`",
    "A linked list traversal is a chain of dependent loads — about 10× slower than a vector here",
    "`vector::insert(begin())` is O(n), making a front-insertion loop O(n²) — 6.5s against a deque's sub-millisecond",
    "`splice` relinks nodes in O(1) and leaves iterators valid, pointing into the destination list",
    "`list` has member `sort`, `merge`, `remove`, `unique` and `reverse` that relink rather than move",
    "O(1) middle insertion assumes you already hold the iterator — finding it is still O(n)",
    "Default to `vector`; justify anything else from the access pattern, not from intuition",
  ],
  status: "available",
};
