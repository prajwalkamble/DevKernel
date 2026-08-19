import type { Lesson } from "@/content/types";

export const iteratorsLesson: Lesson = {
  id: "cpp-iterators",
  slug: "iterator-categories-and-invalidation",
  moduleSlug: "standard-library",
  title: "Iterator Categories & Invalidation",
  summary:
    "The abstraction that lets one `sort` work on any container, and the rules deciding when an iterator stops being valid. The five categories and what each permits, why `std::advance` exists, and the erase-while-iterating bug written correctly three ways.",
  estimatedMinutes: 35,
  objectives: [
    "Name the iterator categories and the operations each adds",
    "Predict which category a container provides",
    "Explain why `std::advance` and `std::distance` exist",
    "State the invalidation rules for each container",
    "Erase while iterating without undefined behaviour",
  ],
  sections: [
    {
      id: "categories",
      heading: "The five categories",
      body: [
        "An iterator generalises a pointer. **The categories describe how much of a pointer's behaviour a particular iterator supports**, and algorithms are written against the weakest category that can do the job.",
        "**Input** — read once, move forward. A single pass only; once you advance, the previous position may be worthless. `std::istream_iterator` is the canonical example, since you cannot un-read a stream.",
        "**Forward** — read repeatedly, move forward, and multiple passes are allowed. `forward_list` provides this.",
        "**Bidirectional** — adds `--`. `list`, `set` and `map` provide this.",
        "**Random access** — adds `+= n`, `-= n`, `it + n`, `it2 - it1` and `<`, all in O(1). `deque` provides this.",
        "**Contiguous** (C++20, previously implicit) — random access *and* the elements are physically adjacent, so `&*it + n == &*(it + n)` and the iterator can be turned into a real pointer. `vector`, `array` and `string` provide this.",
        "Each category includes the ones before it. **The category is why `std::sort` refuses a `std::list`** — it needs random access — and why `list` has its own `sort` member function instead.",
      ],
      examples: [
        {
          id: "categories-demo",
          title: "Which container gives which, and what that permits",
          lang: "cpp",
          code: `#include <deque>
#include <forward_list>
#include <iostream>
#include <iterator>
#include <list>
#include <set>
#include <vector>

template <typename C>
void categoryOf(const char* name) {
    using It = typename C::iterator;
    std::cout << "  " << name << ": ";
    if      constexpr (std::contiguous_iterator<It>)    std::cout << "contiguous";
    else if constexpr (std::random_access_iterator<It>) std::cout << "random access";
    else if constexpr (std::bidirectional_iterator<It>) std::cout << "bidirectional";
    else if constexpr (std::forward_iterator<It>)       std::cout << "forward";
    else                                                std::cout << "input";
    std::cout << '\\n';
}

int main() {
    std::cout << "iterator category by container:\\n";
    categoryOf<std::vector<int>>("vector      ");
    categoryOf<std::deque<int>>("deque       ");
    categoryOf<std::list<int>>("list        ");
    categoryOf<std::set<int>>("set         ");
    categoryOf<std::forward_list<int>>("forward_list");

    std::vector<int> v{1, 2, 3, 4, 5};
    std::list<int>   l{1, 2, 3, 4, 5};

    auto vi = v.begin();
    vi += 3;                        // random access only
    std::cout << "\\nvector: it += 3 -> " << *vi << '\\n';
    std::cout << "vector: end - begin = " << (v.end() - v.begin()) << '\\n';

    auto li = l.begin();
    // li += 3;                     // ERROR: no operator+= on a list iterator
    std::advance(li, 3);            // works for any category, O(n) here
    std::cout << "list:   advance(it,3) -> " << *li << '\\n';
    std::cout << "list:   distance(begin,end) = "
              << std::distance(l.begin(), l.end()) << "  (this is O(n))\\n";

    --li;                           // bidirectional
    std::cout << "list:   --it -> " << *li << '\\n';

    // Contiguous means &*it is a real pointer into an array.
    std::cout << "\\nvector is contiguous: &v[0] + 2 == &v[2] ? "
              << ((&v[0] + 2) == &v[2]) << '\\n';
}`,
          output: `iterator category by container:
  vector      : contiguous
  deque       : random access
  list        : bidirectional
  set         : bidirectional
  forward_list: forward

vector: it += 3 -> 4
vector: end - begin = 5
list:   advance(it,3) -> 4
list:   distance(begin,end) = 5  (this is O(n))
list:   --it -> 3

vector is contiguous: &v[0] + 2 == &v[2] ? 1`,
          explanation:
            "**`vi += 3` compiles and `li += 3` does not**, and that single difference is the whole category system doing its job. `std::advance` and `std::distance` exist to bridge it: they work for any category, dispatching to a single addition where random access is available and a loop otherwise. **That makes their cost depend on the container** — `std::distance` on a `vector` is O(1) and on a `list` is O(n), which is a real trap in a loop condition. Note `deque` is random access but *not* contiguous, exactly as its block layout implies.",
        },
      ],
      pitfalls: [
        {
          title: "`std::distance` in a loop condition turns O(n) into O(n²)",
          body: "`for (auto it = l.begin(); std::distance(it, l.end()) > 2; ++it)` walks the whole remaining list on every iteration. The same applies to calling `size()` on a `forward_list` substitute or any O(n) query inside a condition. Hoist it out, or use a comparison that does not measure — `it != l.end()` is always O(1). This is the most common way an accidentally quadratic loop gets written with the standard library.",
        },
      ],
    },
    {
      id: "invalidation",
      heading: "Invalidation, container by container",
      body: [
        "An iterator becomes **invalid** when the element it refers to is destroyed or moved. Using one afterwards — even comparing it — is undefined behaviour.",
        "The rules follow directly from each container's layout, which is why they are worth deriving rather than memorising.",
        "**`vector`** — insertion invalidates *everything* if it reallocates, and everything from the insertion point onwards if it does not. Erasure invalidates from the erased position onwards. The elements move, so pointers and references die with the iterators.",
        "**`deque`** — insertion at either end invalidates all *iterators* but leaves pointers and references valid, since elements never move. Insertion in the middle invalidates everything. Erasure at an end invalidates only the erased element; erasure in the middle invalidates everything.",
        "**`list` and `forward_list`** — nothing is invalidated except iterators to the erased element. Nodes never move.",
        "**`map`, `set` and their multi- variants** — same as `list`: only the erased element. They are node-based too.",
        "**`unordered_*`** — erasure invalidates only the erased element, but **insertion invalidates all iterators if it triggers a rehash**, while pointers and references always survive. A rehash happens when the load factor is exceeded, so `reserve` prevents it exactly as with `vector`.",
      ],
      examples: [
        {
          id: "invalidation-table",
          title: "The rules, derived from the layout",
          lang: "cpp",
          code: `// Container         Insert                     Erase
// ------------------------------------------------------------------------
// vector            ALL if reallocating,       from erased position on
//                   else from insert point on
//
// deque (at ends)   all ITERATORS;             only the erased element
//                   ptrs/refs survive
// deque (middle)    everything                 everything
//
// list              nothing                    only the erased element
// forward_list      nothing                    only the erased element
//
// map/set           nothing                    only the erased element
// multimap/multiset nothing                    only the erased element
//
// unordered_*       all ITERATORS if it        only the erased element
//                   rehashes; ptrs/refs        (ptrs/refs to others survive)
//                   always survive
//
// Why: contiguous containers move elements, so everything dies.
//      Node-based containers never move a node, so nothing dies.
//      deque moves neither elements nor nodes, but its iterators hold
//        block-index state that a structural change breaks.
//      unordered_* rehashing relinks nodes into new buckets -- the nodes
//        themselves stay put, which is why ptrs and refs are safe.`,
          output: `# One rule covers most of it:
#   if the container can MOVE elements, assume everything is invalidated.`,
          explanation:
            "**Notice the pattern rather than the table.** Contiguous storage means growth relocates elements, so `vector` invalidates broadly. Node-based storage means each element has a permanent home, so `list`, `map` and `set` invalidate almost nothing. `deque` and `unordered_*` are the interesting middle: their *elements* stay put — so pointers and references survive — while their *iterators* carry extra structural state that a reorganisation breaks. That asymmetry between iterators and references is the part most people get wrong.",
        },
      ],
    },
    {
      id: "erase-while-iterating",
      heading: "Erasing while iterating",
      body: [
        "The commonest invalidation bug is a loop that erases as it goes:",
        "**`for (auto it = v.begin(); it != v.end(); ++it) if (pred(*it)) v.erase(it);`** — `erase` invalidates `it`, and then `++it` advances an invalid iterator. Undefined behaviour, and it usually appears to work for a while.",
        "**The fix is that `erase` returns the next valid iterator.** Assign it back and only advance when you did not erase. That is the idiom to recognise, and it works for every standard container.",
        "**C++20 added `std::erase` and `std::erase_if` as free functions**, which do the whole thing correctly in one line and are the right answer in new code. They are overloaded for every standard container and — for `vector` — perform the erase-remove idiom internally rather than erasing one element at a time.",
        "For `vector` specifically, the classic pre-C++20 form is the **erase-remove idiom**: `v.erase(std::remove_if(v.begin(), v.end(), pred), v.end())`. `std::remove_if` cannot actually remove anything — algorithms only see iterators, not the container — so it shuffles the survivors forward and returns the new logical end, and `erase` then truncates. Lesson 5 comes back to why that separation exists.",
      ],
      examples: [
        {
          id: "erase-idioms",
          title: "Three correct ways, one of them a single line",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <vector>

int main() {
    // THE BUG (not shown running): erase() invalidates it, and ++it on an
    // invalidated iterator is undefined behaviour.
    //   for (auto it = v.begin(); it != v.end(); ++it)
    //       if (*it % 2 == 0) v.erase(it);

    // FIX 1: erase() RETURNS the next valid iterator.
    std::vector<int> v{1, 2, 3, 4, 5, 6};
    for (auto it = v.begin(); it != v.end(); ) {
        if (*it % 2 == 0) it = v.erase(it);   // reassign, do not ++
        else              ++it;
    }
    std::cout << "vector after erasing evens:";
    for (int x : v) std::cout << ' ' << x;
    std::cout << '\\n';

    // The same shape works for node-based containers.
    std::map<int, char> m{{1,'a'},{2,'b'},{3,'c'},{4,'d'}};
    for (auto it = m.begin(); it != m.end(); ) {
        if (it->first % 2 == 0) it = m.erase(it);
        else                    ++it;
    }
    std::cout << "map after erasing even keys:";
    for (const auto& [k, ch] : m) std::cout << ' ' << k << ch;
    std::cout << '\\n';

    // FIX 2 (C++20): one line, correct for every container.
    std::vector<int> w{1, 2, 3, 4, 5, 6};
    std::erase_if(w, [](int x) { return x % 2 == 0; });
    std::cout << "std::erase_if:";
    for (int x : w) std::cout << ' ' << x;
    std::cout << '\\n';

    std::vector<int> z{1, 2, 2, 3, 2};
    std::erase(z, 2);
    std::cout << "std::erase(z, 2):";
    for (int x : z) std::cout << ' ' << x;
    std::cout << '\\n';
}`,
          output: `vector after erasing evens: 1 3 5
map after erasing even keys: 1a 3c
std::erase_if: 1 3 5
std::erase(z, 2): 1 3`,
          explanation:
            "**`it = v.erase(it)` with no `++` in the loop header is the shape to recognise** — the increment moves into the `else` branch, because erasing already advanced you. It reads oddly the first time and is correct for every container in the library. `std::erase_if` does the same job in one line and should be the default in new code; note it also avoids the O(n²) behaviour of erasing from a `vector` one element at a time, since it uses the erase-remove idiom internally.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Name the iterator categories and what each adds.",
      answer:
        "Input: read once, move forward, single pass only — `istream_iterator` is the example, since a stream cannot be re-read. Forward: multi-pass, read repeatedly, move forward — `forward_list`. Bidirectional: adds `--` — `list`, `set`, `map`. Random access: adds `+= n`, `it + n`, `it2 - it1` and ordering comparisons, all O(1) — `deque`. Contiguous, formalised in C++20: random access plus physically adjacent elements, so the iterator converts to a real pointer — `vector`, `array`, `string`. Each includes the previous. Algorithms are written against the weakest category that suffices, which is why `std::sort` rejects a `list` and `list` provides its own `sort`.",
    },
    {
      question: "Why do `std::advance` and `std::distance` exist, and what is the trap?",
      answer:
        "Because `it += n` and `it2 - it1` only exist on random access iterators. `std::advance` and `std::distance` work for any category, dispatching to a single arithmetic operation where possible and a loop otherwise. The trap is that their cost therefore depends on the container: `std::distance` is O(1) on a `vector` and O(n) on a `list`. Calling it in a loop condition turns an O(n) loop into O(n²), which is the most common way accidentally quadratic code gets written with the standard library. Prefer `it != end()`, which is always O(1).",
    },
    {
      question: "What invalidates iterators in a `vector`, and how does that differ from a `list`?",
      answer:
        "In a `vector`, insertion invalidates everything if it reallocates and everything from the insertion point onwards if it does not; erasure invalidates from the erased position onwards. Because elements physically move, pointers and references die alongside the iterators. In a `list`, nothing is invalidated except iterators to the erased element — nodes never move, so every other iterator, pointer and reference survives any amount of insertion and erasure. The general rule is that if a container can move its elements, assume everything is invalidated; node-based containers invalidate almost nothing.",
    },
    {
      question: "How do `deque` and `unordered_map` differ from both of those?",
      answer:
        "Both invalidate iterators more aggressively than references. `deque` insertion at either end invalidates all iterators but leaves pointers and references valid, because the elements themselves never move — only the block index array is rebuilt. `unordered_map` insertion invalidates all iterators if it triggers a rehash, while pointers and references always survive, because rehashing relinks existing nodes into new buckets rather than moving them. That asymmetry between iterators and references is the detail most people miss, and it makes `deque` a better `vector` substitute than it first appears when you need stable element addresses.",
    },
    {
      question: "How do you erase elements while iterating?",
      answer:
        "Use the value `erase` returns, which is the next valid iterator: `for (auto it = c.begin(); it != c.end(); ) { if (pred(*it)) it = c.erase(it); else ++it; }` — note the empty increment in the header, since erasing already advances. That works for every standard container. The naive version, calling `erase(it)` and then `++it`, advances an invalidated iterator and is undefined behaviour that often appears to work. In C++20 prefer the free functions `std::erase` and `std::erase_if`, which do it correctly in one line and, for `vector`, use the erase-remove idiom internally rather than erasing one element at a time.",
    },
    {
      question: "Why can't `std::remove_if` actually remove elements?",
      answer:
        "Because algorithms operate on iterators, not containers — `remove_if` has no access to the container and so cannot change its size. What it does is shuffle the elements that should survive towards the front and return an iterator to the new logical end; the elements past that point are unspecified but valid. Calling `erase(newEnd, container.end())` then truncates, which is why the pair is known as the erase-remove idiom. `std::erase_if` in C++20 packages both steps into one call.",
    },
  ],
  takeaways: [
    "Categories: input, forward, bidirectional, random access, contiguous — each includes the previous",
    "`vector`/`array`/`string` are contiguous; `deque` is random access but not contiguous",
    "`list`, `set` and `map` are bidirectional; `forward_list` is forward only",
    "Algorithms are written against the weakest sufficient category — hence no `std::sort` on a `list`",
    "`std::advance`/`std::distance` work for any category, but cost O(n) on non-random-access ones",
    "`std::distance` in a loop condition is the classic accidental O(n²)",
    "If a container can move its elements, assume everything is invalidated",
    "Node-based containers invalidate only the erased element",
    "`deque` and `unordered_*` invalidate iterators but not pointers or references",
    "`erase` returns the next valid iterator — `it = c.erase(it)` with no `++` in the header",
    "Prefer C++20's `std::erase` / `std::erase_if`, which are one line and correct everywhere",
    "`std::remove_if` cannot resize a container; it shuffles survivors forward and returns the new end",
  ],
  status: "available",
};
