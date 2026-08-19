import type { Lesson } from "@/content/types";

export const algorithmsLesson: Lesson = {
  id: "cpp-algorithms",
  slug: "algorithms-predicates-and-erase-remove",
  moduleSlug: "standard-library",
  title: "Algorithms, Predicates & the Erase-Remove Idiom",
  summary:
    "The hundred-odd functions in `<algorithm>` that mean you rarely need to write a raw loop. Choosing the cheapest algorithm that answers your question, the predicate rules that are easy to violate, and why `std::remove_if` famously removes nothing.",
  estimatedMinutes: 35,
  objectives: [
    "Replace common raw loops with the algorithm that names the intent",
    "Choose between `sort`, `partial_sort` and `nth_element` on cost",
    "State the requirements a comparator and a predicate must satisfy",
    "Explain why `remove_if` cannot remove, and apply the erase-remove idiom",
    "Avoid the `accumulate` initial-value trap",
  ],
  sections: [
    {
      id: "vocabulary",
      heading: "Say what you mean",
      body: [
        "The case for algorithms is not usually speed — it is that **the name states the intent**, so a reader does not have to decode a loop to discover you were searching rather than transforming.",
        "The ones worth knowing by heart divide into a few groups. **Searching**: `find`, `find_if`, `count`, `count_if`, `all_of`, `any_of`, `none_of`, `search`, `min_element`, `max_element`, `minmax_element`. **Transforming**: `transform`, `copy`, `copy_if`, `fill`, `generate`, `replace`, `reverse`, `rotate`. **Removing**: `remove`, `remove_if`, `unique`. **Ordering**: `sort`, `stable_sort`, `partial_sort`, `nth_element`, `partition`, `stable_partition`. **On sorted ranges**: `binary_search`, `lower_bound`, `upper_bound`, `equal_range`, `merge`, `set_union`, `set_intersection`, `set_difference`, `includes`. **Numeric**, from `<numeric>`: `accumulate`, `reduce`, `inner_product`, `partial_sum`, `iota`.",
        "**The ordering group rewards knowing the cost differences.** A full `sort` is O(n log n). If you only need the smallest k, **`partial_sort`** is O(n log k). If you only need the kth element in its right place with everything smaller before it — a median, a percentile — **`nth_element`** is O(n) on average, and sorting to get that is wasteful.",
        "**The sorted-range group has a precondition the compiler cannot check.** `binary_search`, `lower_bound` and friends on an unsorted range are undefined behaviour, not merely wrong answers.",
      ],
      examples: [
        {
          id: "algorithm-tour",
          title: "The ones worth knowing, on one vector",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> v{5, 3, 9, 1, 7, 3, 8, 2};

    // Searching
    std::cout << "count of 3      : "
              << std::count(v.begin(), v.end(), 3) << '\\n';
    auto it = std::find_if(v.begin(), v.end(), [](int x) { return x > 6; });
    std::cout << "first > 6       : " << *it << " at index "
              << std::distance(v.begin(), it) << '\\n';
    std::cout << "all positive    : "
              << std::all_of(v.begin(), v.end(), [](int x) { return x > 0; })
              << '\\n';
    std::cout << "any > 8         : "
              << std::any_of(v.begin(), v.end(), [](int x) { return x > 8; })
              << '\\n';

    // min and max in one pass
    auto [lo, hi] = std::minmax_element(v.begin(), v.end());
    std::cout << "min/max         : " << *lo << " / " << *hi << '\\n';

    // Accumulate -- note the init value determines the TYPE
    std::cout << "sum             : "
              << std::accumulate(v.begin(), v.end(), 0) << '\\n';

    // Ordering, cheapest sufficient option
    std::vector<int> s = v;
    std::sort(s.begin(), s.end());
    std::cout << "sorted          :";
    for (int x : s) std::cout << ' ' << x;
    std::cout << '\\n';

    // partial_sort: only the first 3 need to be right. O(n log k).
    std::vector<int> p = v;
    std::partial_sort(p.begin(), p.begin() + 3, p.end());
    std::cout << "3 smallest first:";
    for (int x : p) std::cout << ' ' << x;
    std::cout << '\\n';

    // nth_element: the nth element in place, partitioned around it. O(n).
    std::vector<int> n = v;
    std::nth_element(n.begin(), n.begin() + 4, n.end());
    std::cout << "median-ish (n=4): " << n[4] << '\\n';

    // Binary search needs a SORTED range -- undefined behaviour otherwise.
    std::cout << "binary_search 7 : "
              << std::binary_search(s.begin(), s.end(), 7) << '\\n';
    auto lb = std::lower_bound(s.begin(), s.end(), 3);
    auto ub = std::upper_bound(s.begin(), s.end(), 3);
    std::cout << "equal_range of 3: " << std::distance(lb, ub) << " elements\\n";
}`,
          output: `count of 3      : 2
first > 6       : 9 at index 2
all positive    : 1
any > 8         : 1
min/max         : 1 / 9
sum             : 38
sorted          : 1 2 3 3 5 7 8 9
3 smallest first: 1 2 3 9 7 5 8 3
median-ish (n=4): 5
binary_search 7 : 1
equal_range of 3: 2 elements`,
          explanation:
            "**Look at the `partial_sort` line: `1 2 3` then `9 7 5 8 3`.** Only the first three are sorted; the rest are in unspecified order, which is exactly the work it saved. `nth_element` went further — it guaranteed only that index 4 holds the value that would be there in a sorted range, with smaller values before and larger after, in O(n). Reaching for a full `sort` when you want a top-10 or a median is one of the most common avoidable costs in real code.",
        },
      ],
      pitfalls: [
        {
          title: "`accumulate`'s initial value decides the arithmetic type",
          body: "`std::accumulate(v.begin(), v.end(), 0)` over a `vector<double>` of `{1.5, 2.5, 3.5}` returns **6**, not 7.5 — the accumulator is an `int` because the literal `0` is, so every addition truncates. Writing `0.0` gives 7.5. The same bug appears with `0` over a `vector<long long>` of large values, where it silently overflows. Always spell the initial value in the type you want the arithmetic done in: `0.0`, `0LL`, `std::string{}`. C++17's `std::reduce` has the same rule, plus it may reorder operations, so it is unsuitable for floating point where you need reproducibility.",
        },
      ],
    },
    {
      id: "predicates",
      heading: "Predicates and comparators",
      body: [
        "Algorithms take callables, and the standard imposes requirements on them that the compiler cannot check. Violating one is undefined behaviour, and the usual symptom is a crash inside `std::sort`.",
        "**A comparator must be a strict weak ordering.** In practice: `comp(a, a)` must be `false` — irreflexive — and if `comp(a, b)` is true then `comp(b, a)` must be false. **The classic bug is writing `>=` instead of `>`**, which makes `comp(a, a)` true, and `std::sort` then runs off the end of the range because its partition loop relies on an element eventually comparing false. That is a genuine out-of-bounds write, not merely a wrong order.",
        "**A predicate must be pure** — same answer for the same element, no side effects that matter. Algorithms may copy the predicate, call it an unspecified number of times, and on the parallel overloads call it concurrently. A predicate holding mutable state, such as a counter used to \"remove every other element\", will not behave as expected.",
        "**A predicate must not modify the elements it inspects.** `remove_if` and friends take the range by iterator and are entitled to assume the predicate is a question, not an operation.",
        "For a comparator with several keys, **use `std::tie` or a `std::tuple` comparison** rather than hand-writing the chain — it is shorter and cannot get the ordering wrong. Since C++20, `operator<=>` on the members usually removes the need entirely.",
      ],
      examples: [
        {
          id: "comparators",
          title: "A safe multi-key comparator, and the one that crashes",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>

struct Employee {
    std::string department;
    int         age;
    std::string name;
};

int main() {
    std::vector<Employee> staff{
        {"eng",   35, "ada"},   {"sales", 28, "bob"},
        {"eng",   28, "cleo"},  {"eng",   35, "dan"},
        {"sales", 41, "eve"},
    };

    // Multi-key ordering: department, then age, then name.
    // std::tie makes this one expression that cannot get the chaining wrong.
    std::sort(staff.begin(), staff.end(), [](const auto& a, const auto& b) {
        return std::tie(a.department, a.age, a.name)
             < std::tie(b.department, b.age, b.name);
    });

    for (const auto& e : staff)
        std::cout << "  " << e.department << ' ' << e.age << ' ' << e.name << '\\n';

    // stable_sort preserves the relative order of equal elements.
    // Sorting only by department keeps the name order within each one.
    std::vector<Employee> byName = staff;
    std::stable_sort(byName.begin(), byName.end(),
        [](const auto& a, const auto& b) { return a.department < b.department; });
    std::cout << "stable_sort by department only:\\n";
    for (const auto& e : byName) std::cout << "  " << e.department << ' ' << e.name << '\\n';

    // THE CRASH: this comparator is NOT a strict weak ordering.
    //   [](int a, int b) { return a >= b; }
    // comp(a, a) is true, so sort's partition loop runs past the end of the
    // range and writes out of bounds. Use > , never >= .
    std::cout << "\\ncomparator rule: comp(a, a) must be false. Use <, not <=.\\n";
}`,
          output: `  eng 28 cleo
  eng 35 ada
  eng 35 dan
  sales 28 bob
  sales 41 eve
stable_sort by department only:
  eng cleo
  eng ada
  eng dan
  sales bob
  sales eve

comparator rule: comp(a, a) must be false. Use <, not <=.`,
          explanation:
            "**`std::tie` builds a tuple of references and compares them lexicographically**, which is the whole multi-key ordering in one expression — and it cannot get the fallback wrong the way a hand-written chain of `if`s can. Note `ada` before `dan` among the 35-year-olds, which is the third key working. The `stable_sort` below keeps that name order intact within each department, which is what \"stable\" buys and what plain `sort` explicitly does not promise.",
        },
      ],
    },
    {
      id: "erase-remove",
      heading: "Why `remove_if` removes nothing",
      body: [
        "**Algorithms only ever see iterators. They have no access to the container**, so they cannot change its size — that is the fundamental separation the STL is built on, and it is what lets one `sort` work for `vector`, `deque` and a raw array alike.",
        "So `std::remove_if` does the only thing it can: **it shuffles the elements you want to keep towards the front and returns an iterator to the new logical end.** The size is unchanged, and the elements past the returned iterator are in a valid but unspecified state — they have been moved from.",
        "**`container.erase(newEnd, container.end())` is what actually removes them.** The pair is the *erase-remove idiom*, and forgetting the `erase` half is a classic bug: the code appears to work because the survivors really are at the front, and then `size()` reports the wrong number.",
        "**`std::unique` behaves the same way** and adds a precondition: it only collapses *adjacent* duplicates, so the range must be sorted first if you want true deduplication.",
        "**In C++20 use `std::erase_if(container, pred)` instead.** One call, correct, and it does the right thing for node-based containers too — where the erase-remove idiom would be wrong, since `remove_if` moves values between nodes rather than unlinking them.",
      ],
      examples: [
        {
          id: "erase-remove-demo",
          title: "The tail that `remove_if` leaves behind",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6};

    // remove_if does NOT remove. It cannot -- it only has iterators.
    auto newEnd = std::remove_if(v.begin(), v.end(),
                                 [](int x) { return x % 2 == 0; });

    std::cout << "after remove_if, size is STILL " << v.size() << '\\n';
    std::cout << "the whole vector:";
    for (int x : v) std::cout << ' ' << x;
    std::cout << "   <-- tail is unspecified but valid\\n";

    std::cout << "the valid part:  ";
    for (auto it = v.begin(); it != newEnd; ++it) std::cout << ' ' << *it;
    std::cout << '\\n';

    // erase() is what actually shrinks it.
    v.erase(newEnd, v.end());
    std::cout << "after erase, size is " << v.size() << ":";
    for (int x : v) std::cout << ' ' << x;
    std::cout << '\\n';

    // unique also needs the erase, and needs the range SORTED first.
    std::vector<int> d{3, 1, 1, 3, 2, 2, 2};
    std::sort(d.begin(), d.end());
    d.erase(std::unique(d.begin(), d.end()), d.end());
    std::cout << "deduplicated:";
    for (int x : d) std::cout << ' ' << x;
    std::cout << '\\n';

    // Without sorting first, unique only collapses ADJACENT duplicates.
    std::vector<int> u{3, 1, 1, 3, 2, 2, 2};
    u.erase(std::unique(u.begin(), u.end()), u.end());
    std::cout << "unique without sorting:";
    for (int x : u) std::cout << ' ' << x;
    std::cout << "   <-- 3 appears twice\\n";
}`,
          output: `after remove_if, size is STILL 6
the whole vector: 1 3 5 4 5 6   <-- tail is unspecified but valid
the valid part:   1 3 5
after erase, size is 3: 1 3 5
deduplicated: 1 2 3
unique without sorting: 3 1 3 2   <-- 3 appears twice`,
          explanation:
            "**`1 3 5 4 5 6`** is the whole story. The odd numbers were moved to the front, the size never changed, and the trailing `4 5 6` is leftover debris — valid objects you must not read but which will happily print. Anyone who forgets the `erase` gets a container that reports size 6 and contains three real elements. The last two lines show `unique`'s precondition biting: without the sort it collapsed only the adjacent pairs and left two separate `3`s.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why should you prefer algorithms to hand-written loops?",
      answer:
        "Mainly because the name states the intent — a reader sees `find_if` or `all_of` and knows immediately what the code is doing, where a raw loop has to be decoded. Secondarily they are already correct for edge cases, they are constrained so misuse is caught, and some have optimised implementations or parallel overloads. Speed is rarely the argument, since a simple loop optimises just as well. The genuine wins in performance terms come from choosing the *right* algorithm — `nth_element` instead of a full sort for a median, for example.",
    },
    {
      question: "When would you use `partial_sort` or `nth_element` instead of `sort`?",
      answer:
        "`sort` is O(n log n) and orders everything. `partial_sort` is O(n log k) and guarantees only that the first k elements are the k smallest, in order — the right choice for a top-10. `nth_element` is O(n) on average and guarantees only that the element at position n is the one that would be there in a sorted range, with everything smaller before it and everything larger after — the right choice for a median or a percentile. Both do strictly less work than a full sort, and reaching for `sort` when you need a top-k or a median is a common avoidable cost.",
    },
    {
      question: "What must a comparator satisfy, and what happens if it does not?",
      answer:
        "It must be a strict weak ordering: irreflexive, so `comp(a, a)` is false, and asymmetric, so `comp(a, b)` implies `!comp(b, a)`. The classic violation is writing `>=` or `<=` instead of `>` or `<`, which makes `comp(a, a)` true. `std::sort`'s partition loop relies on some element eventually comparing false to stop, so a reflexive comparator makes it run past the end of the range and write out of bounds — a genuine memory-corruption bug and undefined behaviour, not just a wrong order. Predicates must additionally be pure, since algorithms may copy them and call them an unspecified number of times.",
    },
    {
      question: "Why can't `std::remove_if` actually remove elements, and what is the erase-remove idiom?",
      answer:
        "Because algorithms are given only iterators, never the container, so they have no way to change its size — that separation is what lets one algorithm work on a vector, a deque and a raw array. `remove_if` therefore shuffles the elements to keep towards the front and returns an iterator to the new logical end; the size is unchanged and the elements beyond it are valid but unspecified, having been moved from. `container.erase(newEnd, container.end())` then truncates, and the pair is the erase-remove idiom. Forgetting the erase leaves a container reporting the old size with debris at the end. In C++20, `std::erase_if(container, pred)` does both correctly in one call.",
    },
    {
      question: "What is the trap with `std::accumulate`'s initial value?",
      answer:
        "It determines the accumulator's type. `std::accumulate(v.begin(), v.end(), 0)` over a `vector<double>` of 1.5, 2.5 and 3.5 returns 6, not 7.5, because the accumulator is an `int` and every addition truncates. The same literal over a `vector<long long>` of large values silently overflows. Always write the initial value in the type you want the arithmetic performed in — `0.0`, `0LL`, `std::string{}`. C++17's `std::reduce` has the same rule and additionally may reorder the operations, so it is unsuitable for floating-point sums that must be reproducible.",
    },
    {
      question: "What does `std::unique` do, and what is its precondition?",
      answer:
        "It collapses *consecutive* equal elements, leaving one of each run, and — like `remove_if` — it cannot resize, so it shuffles survivors forward and returns the new logical end for `erase` to truncate at. The precondition is that equal elements must be adjacent, which in practice means sorting first. Calling it on an unsorted range is not undefined behaviour, it just does not deduplicate: on `{3,1,1,3,2,2,2}` it yields `3 1 3 2`, with two separate 3s. The full deduplication idiom is therefore `sort`, then `erase(unique(...), end())`.",
    },
  ],
  takeaways: [
    "Prefer the algorithm that names your intent — the readability is the main argument",
    "`sort` is O(n log n); `partial_sort` is O(n log k); `nth_element` is O(n) for a single position",
    "`binary_search`, `lower_bound` and friends on an unsorted range are undefined behaviour",
    "A comparator must be a strict weak ordering — `comp(a, a)` must be false",
    "Writing `>=` instead of `>` makes `std::sort` write out of bounds, not merely misorder",
    "Predicates must be pure; algorithms may copy them and call them any number of times",
    "`std::tie` gives a correct multi-key comparator in one expression",
    "`stable_sort` preserves the relative order of equal elements; `sort` does not promise to",
    "Algorithms see only iterators, so they can never change a container's size",
    "`remove_if` shuffles survivors forward and returns the new end — `erase` does the removing",
    "`unique` collapses only adjacent duplicates, so sort first",
    "In C++20, `std::erase_if` replaces the whole idiom and is correct for node-based containers too",
    "`accumulate`'s initial value sets the accumulator type — `0` over doubles truncates",
  ],
  status: "available",
};
