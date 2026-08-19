import type { Lesson } from "@/content/types";

export const rangesLesson: Lesson = {
  id: "cpp-ranges",
  slug: "ranges-views-and-pipelines",
  moduleSlug: "standard-library",
  title: "Ranges, Views & Composing Pipelines",
  summary:
    "The C++20 rewrite of the algorithm library. Algorithms that take a container instead of two iterators, projections that remove most comparators, and lazy views that compose into a pipeline without materialising a single intermediate container.",
  estimatedMinutes: 40,
  objectives: [
    "Use `std::ranges` algorithms and say what they improve on",
    "Use a projection instead of writing a comparator",
    "Compose views with `|` and explain what laziness means here",
    "Say why a view is cheap to copy and dangerous to outlive its source",
    "Recognise which views are cheap and which are not",
  ],
  sections: [
    {
      id: "ranges-algorithms",
      heading: "Algorithms that take a range",
      body: [
        "Every algorithm in `<algorithm>` has a `std::ranges::` counterpart, and they fix three long-standing annoyances.",
        "**They take the container directly.** `std::ranges::sort(v)` instead of `std::sort(v.begin(), v.end())`. Beyond brevity, this removes an entire bug class — passing `a.begin()` and `b.end()` compiles fine with the old form and is undefined behaviour.",
        "**They are constrained by concepts**, so lesson 6 of module 7's error-message improvement applies to the whole algorithm library: `std::ranges::sort` on a `std::list` tells you the range is not random access, rather than reporting a missing `operator-` inside a header.",
        "**They take projections.** A projection is a callable applied to each element before the algorithm looks at it, so sorting by a member becomes `std::ranges::sort(people, {}, &P::age)` — where `{}` is the default `std::ranges::less` and `&P::age` is the projection. That removes the majority of hand-written comparators, and with them the risk of getting a strict weak ordering wrong.",
        "They also return more useful things. `std::ranges::copy` returns both the input and output positions in a struct with named fields, rather than just the output iterator.",
      ],
      examples: [
        {
          id: "ranges-basics",
          title: "Ranges algorithms, projections, and a lazy pipeline",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <ranges>
#include <string>
#include <vector>

int main() {
    std::vector<int> v{5, 3, 9, 1, 7, 3, 8, 2};

    // 1. Ranges algorithms take the container directly -- no begin/end pairs.
    std::vector<int> s = v;
    std::ranges::sort(s);
    std::cout << "ranges::sort   :";
    for (int x : s) std::cout << ' ' << x;
    std::cout << '\\n';

    std::cout << "ranges::find 7 : "
              << (std::ranges::find(v, 7) != v.end() ? "found" : "missing") << '\\n';
    std::cout << "ranges::count 3: " << std::ranges::count(v, 3) << '\\n';

    // 2. Projections: sort by a member without writing a comparator.
    struct P { std::string name; int age; };
    std::vector<P> people{{"ada", 36}, {"bob", 25}, {"cleo", 31}};
    std::ranges::sort(people, {}, &P::age);   // {} = default less, project age
    std::cout << "sorted by age  :";
    for (const auto& p : people)
        std::cout << ' ' << p.name << '(' << p.age << ')';
    std::cout << '\\n';

    // 3. Views: lazy, composable, no intermediate containers.
    auto pipeline = v
        | std::views::filter([](int x) { return x % 2 == 1; })
        | std::views::transform([](int x) { return x * 10; })
        | std::views::take(3);

    std::cout << "odd*10, first 3:";
    for (int x : pipeline) std::cout << ' ' << x;
    std::cout << '\\n';

    // 4. Views are LAZY -- nothing runs until iterated.
    int calls = 0;
    auto lazy = v | std::views::transform([&calls](int x) { ++calls; return x * 2; });
    std::cout << "after building the view, calls = " << calls << '\\n';
    auto first = *lazy.begin();
    std::cout << "after reading one element, calls = " << calls
              << " (first = " << first << ")\\n";

    // 5. Views refer to the source -- they do not copy it.
    //    (Modify VALUES, not the container's size: growing a vector can
    //     reallocate and invalidate any view over it.)
    auto doubled = v | std::views::transform([](int x) { return x * 2; });
    std::cout << "doubled now    :";
    for (int x : doubled) std::cout << ' ' << x;
    v[0] = 100;
    std::cout << "\\nafter v[0] = 100, the SAME view:";
    for (int x : doubled) std::cout << ' ' << x;
    std::cout << '\\n';
}`,
          output: `ranges::sort   : 1 2 3 3 5 7 8 9
ranges::find 7 : found
ranges::count 3: 2
sorted by age  : bob(25) cleo(31) ada(36)
odd*10, first 3: 50 30 90
after building the view, calls = 0
after reading one element, calls = 1 (first = 10)
doubled now    : 10 6 18 2 14 6 16 4
after v[0] = 100, the SAME view: 200 6 18 2 14 6 16 4`,
          explanation:
            "**`calls = 0` after building the view is the whole idea of laziness** — constructing a pipeline does no work at all, and reading one element ran the transform exactly once. The `take(3)` above it means only three odd numbers were ever multiplied, however long `v` is. And the last pair shows a view is a *reference* to its source, not a snapshot: changing `v[0]` changed what the already-constructed view produces.",
        },
      ],
      pitfalls: [
        {
          title: "A view over a temporary dangles, exactly like a `string_view`",
          body: "`auto bad = makeVector() | std::views::filter(pred);` leaves `bad` referring to a vector destroyed at the end of that statement. The library defends against the worst cases — `std::ranges::borrowed_range` and the `dangling` return type mean `std::ranges::find(makeVector(), 7)` gives you a `std::ranges::dangling` object that will not compile if you dereference it — but pipelines built from an rvalue container are still your responsibility. Keep the container in a named variable that outlives the pipeline.",
        },
      ],
    },
    {
      id: "views",
      heading: "What a view is",
      body: [
        "**A view is a range that is cheap to copy, move and destroy — O(1), regardless of how many elements it presents.** It does not own its elements; it refers to them and computes as you iterate.",
        "That is what allows `|` composition to be free. `v | filter | transform | take` builds a small object holding the source reference and the three callables, and no work happens until something iterates it.",
        "**Laziness changes the cost model.** The classic loop `for (x : v) if (odd(x)) out.push_back(x * 10);` materialises a container. A pipeline with `take(3)` stops after three, so a filter over a million elements that takes three does roughly three transforms, not a million.",
        "The views worth knowing: **`filter`**, **`transform`**, **`take`** and **`take_while`**, **`drop`** and **`drop_while`**, **`reverse`**, **`join`** (flatten a range of ranges), **`split`** (C++20) and **`elements`/`keys`/`values`** for tuple-like elements. C++23 adds **`zip`**, **`enumerate`**, **`chunk`** and **`slide`**, which are the ones people most often reach for and find missing in C++20.",
        "**To materialise a pipeline, C++23 has `std::ranges::to<std::vector>()`.** In C++20 you write the loop, or `std::ranges::copy(pipeline, std::back_inserter(out))`.",
      ],
      examples: [
        {
          id: "pipeline",
          title: "A pipeline against the loop it replaces",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <ranges>
#include <string>
#include <vector>

struct Order { std::string customer; double total; bool paid; };

int main() {
    std::vector<Order> orders{
        {"ada",  120.0, true},  {"bob",   40.0, false},
        {"cleo", 300.0, true},  {"dan",   75.0, true},
        {"eve",  210.0, false}, {"finn",  95.0, true},
    };

    // The loop this replaces:
    //   std::vector<std::string> names;
    //   for (const auto& o : orders)
    //       if (o.paid && o.total > 50.0) names.push_back(o.customer);
    //   -- three concerns tangled into one body, plus an output container.

    auto bigPaid = orders
        | std::views::filter([](const Order& o) { return o.paid; })
        | std::views::filter([](const Order& o) { return o.total > 50.0; })
        | std::views::transform([](const Order& o) { return o.customer; });

    std::cout << "paid orders over 50:";
    for (const auto& name : bigPaid) std::cout << ' ' << name;
    std::cout << '\\n';

    // Materialise it (C++20 form; C++23 has std::ranges::to<std::vector>()).
    std::vector<std::string> names;
    for (const auto& n : bigPaid) names.push_back(n);
    std::cout << "materialised " << names.size() << " names\\n";

    // keys and values on a map, without writing .first / .second
    std::map<std::string, int> stock{{"apple", 3}, {"pear", 0}, {"plum", 7}};

    std::cout << "keys        :";
    for (const auto& k : stock | std::views::keys) std::cout << ' ' << k;
    std::cout << "\\nin stock    :";
    for (const auto& [name, n] : stock | std::views::filter(
             [](const auto& kv) { return kv.second > 0; }))
        std::cout << ' ' << name << '=' << n;
    std::cout << '\\n';

    // Infinite ranges are fine, because nothing is computed until taken.
    std::cout << "first 5 squares:";
    for (int x : std::views::iota(1)
               | std::views::transform([](int n) { return n * n; })
               | std::views::take(5))
        std::cout << ' ' << x;
    std::cout << '\\n';
}`,
          output: `paid orders over 50: ada cleo dan finn
materialised 4 names
keys        : apple pear plum
in stock    : apple=3 plum=7
first 5 squares: 1 4 9 16 25`,
          explanation:
            "**`std::views::iota(1)` is an infinite range and the program terminates**, which only works because nothing is computed until `take(5)` stops asking. That is laziness paying off rather than just being tidy. The `Order` pipeline separates the two filters and the projection into named steps you can read top to bottom, and note that stacking two `filter`s is free — they fuse into one pass, not two.",
        },
      ],
    },
    {
      id: "caveats",
      heading: "What ranges cost",
      body: [
        "Ranges are a genuine improvement and they are not free. Four things worth knowing before converting a codebase.",
        "**Compile times and error messages.** Views are deeply templated, and while concepts made the errors far better than the equivalent metaprogramming would have been, a mistake inside a pipeline can still produce a long diagnostic. Build times increase measurably in translation units that use them heavily.",
        "**Not every view is cheap to begin.** `filter_view::begin()` must find the first matching element, so it is O(n) and — importantly — **it caches the result**. That makes `begin()` amortised, but it also means modifying the underlying range after first iterating a `filter_view` gives you a stale cached position. Treat a view as valid only while its source is unmodified.",
        "**Debug performance can be poor.** An unoptimised build materialises every layer of the pipeline's machinery, so a view chain that vanishes at `-O2` can be several times slower than a raw loop at `-O0`. If your test suite runs unoptimised, this shows up.",
        "**C++20's set is incomplete.** No `zip`, no `enumerate`, no `chunk`, and `split_view` in C++20 has awkward behaviour that C++23 fixed. If those matter, either target C++23 or use range-v3, the library ranges were standardised from.",
        "**Where they clearly win**: pipelines that would otherwise need intermediate containers, early termination over large or infinite sequences, and any code where naming the steps makes the intent clearer than a fused loop body.",
      ],
      examples: [
        {
          id: "caveats-demo",
          title: "The filter caching rule, made concrete",
          lang: "cpp",
          code: `#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> v{1, 3, 5, 4, 7};   // first even is 4, at index 3

    auto evens = v | std::views::filter([](int x) { return x % 2 == 0; });

    // begin() scans to find the first match -- O(n) -- and caches it.
    std::cout << "first even: " << *evens.begin() << '\\n';

    // Now make an EARLIER element match. The cached begin() is stale.
    v[0] = 2;

    std::cout << "after v[0] = 2, the view's cached begin() may still\\n"
                 "point at index 3. Re-create the view after modifying\\n"
                 "the source:\\n";

    auto fresh = v | std::views::filter([](int x) { return x % 2 == 0; });
    std::cout << "fresh view's first even: " << *fresh.begin() << '\\n';

    std::cout << "\\nrule: a view is valid only while its source is unmodified.\\n";
}`,
          output: `first even: 4
after v[0] = 2, the view's cached begin() may still
point at index 3. Re-create the view after modifying
the source:
fresh view's first even: 2

rule: a view is valid only while its source is unmodified.`,
          explanation:
            "**`filter_view` caches `begin()` so that iterating it twice does not rescan**, which is required for it to model `forward_range` cheaply. The consequence is that a view is a live reference to its source *and* holds derived state about it, so modifying the source after iterating leaves that state stale. The safe discipline is the same one as for iterators in lesson 4: do not hold a view across a modification of the thing it views.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What do `std::ranges` algorithms improve on the classic ones?",
      answer:
        "They take a range directly rather than an iterator pair, which is shorter and removes the bug class of accidentally mixing iterators from two containers — `std::sort(a.begin(), b.end())` compiles and is undefined behaviour. They are constrained by concepts, so misuse produces an error naming the unsatisfied requirement instead of a failure deep inside the implementation. They accept projections, a callable applied to each element before the algorithm sees it, so `std::ranges::sort(people, {}, &P::age)` replaces a hand-written comparator. And they return richer results, such as both input and output positions from `copy` in a struct with named fields.",
    },
    {
      question: "What is a view, and what makes it different from a container?",
      answer:
        "A range that is cheap — O(1) — to copy, move and destroy regardless of how many elements it presents, because it does not own them. It refers to a source range and computes elements as you iterate. That is what makes `|` composition free: `v | filter | transform` builds a small object holding a reference and two callables, and no work happens until iteration. A container owns its elements and copying it is O(n). The practical consequence is that a view must not outlive its source, exactly like a `string_view`.",
    },
    {
      question: "What does laziness buy you in a range pipeline?",
      answer:
        "No intermediate containers, and early termination. A chain of `filter`, `transform` and `take(3)` over a million elements does roughly three transforms rather than a million, because nothing is computed until something asks for an element and `take` stops asking after three. It also makes infinite ranges usable — `std::views::iota(1) | transform | take(5)` terminates. The equivalent hand-written loop either materialises a vector per stage or fuses everything into one body that is harder to read.",
    },
    {
      question: "Why is `filter_view::begin()` special?",
      answer:
        "It has to scan forward to find the first element satisfying the predicate, so it is O(n) rather than O(1), and it caches the result so that iterating the view more than once does not rescan — which is required for it to model `forward_range` cheaply. The consequence is that a `filter_view` holds derived state about its source, so modifying the source after you have iterated leaves that cached position stale and the view can produce wrong results. The rule is the same as for iterators: do not hold a view across a modification of the range it views.",
    },
    {
      question: "What are the downsides of ranges?",
      answer:
        "Compile times rise measurably in translation units using them heavily, since views are deeply templated. Unoptimised builds can be several times slower than a raw loop, because every layer of the pipeline is a real function call until the optimiser fuses them — which matters if your tests run at `-O0`. Error messages are better than the equivalent metaprogramming but still long. And C++20's set is incomplete: no `zip`, no `enumerate`, no `chunk`, no `std::ranges::to`, and a `split_view` that C++23 had to fix. Targeting C++23 or using range-v3 solves the last one.",
    },
  ],
  takeaways: [
    "Every `<algorithm>` function has a `std::ranges::` counterpart taking a range directly",
    "That removes the mixed-iterator bug class and gives concept-checked error messages",
    "Projections replace most comparators: `std::ranges::sort(people, {}, &P::age)`",
    "A view is O(1) to copy and does not own its elements",
    "`|` composition builds a pipeline object; no work happens until iteration",
    "Laziness means `take(3)` over a million elements does about three transforms",
    "Infinite ranges like `std::views::iota(1)` are usable because of laziness",
    "A view is a live reference to its source — it must not outlive it, and must not be held across modifications",
    "`filter_view::begin()` is O(n) and caches, so a modified source leaves it stale",
    "Views cost compile time, and can be much slower than a raw loop in unoptimised builds",
    "C++20 lacks `zip`, `enumerate`, `chunk` and `ranges::to` — C++23 adds them",
  ],
  status: "available",
};
