import type { Lesson } from "@/content/types";

export const associativeContainersLesson: Lesson = {
  id: "cpp-associative-containers",
  slug: "map-and-set-against-unordered",
  moduleSlug: "standard-library",
  title: "map & set Against Their Unordered Counterparts",
  summary:
    "Two ways to look things up by key, with genuinely different properties. A balanced tree giving ordered iteration and range queries against a hash table giving average O(1) — plus the `operator[]` that silently inserts, and the heterogeneous lookup that stops a `std::string` being built on every search.",
  estimatedMinutes: 35,
  objectives: [
    "State the complexity and ordering guarantees of both families",
    "Choose between ordered and unordered from the operations you need",
    "Avoid the accidental insertion `operator[]` performs",
    "Use `find`, `contains`, `at` and `try_emplace` appropriately",
    "Explain heterogeneous lookup and why it matters for string keys",
  ],
  sections: [
    {
      id: "two-families",
      heading: "A tree and a hash table",
      body: [
        "**`std::map` and `std::set` are balanced binary search trees** — red-black trees in every mainstream implementation. Every operation is **O(log n) worst case**, elements are kept in sorted order, and each element is a separately allocated node.",
        "**`std::unordered_map` and `std::unordered_set` are hash tables** with separate chaining: an array of buckets, each holding a linked list of elements whose keys hashed to it. Operations are **O(1) on average and O(n) in the worst case**, and the iteration order is unspecified.",
        "The complexity headline oversells the difference. A hash lookup computes a hash over the whole key and then follows a pointer; a tree lookup does about log₂(n) comparisons, which for a million elements is twenty — and those comparisons are on short prefixes of strings that differ early. **In practice the hash table wins lookups by roughly 2× for string keys, not by orders of magnitude**, and can lose outright for small maps or expensive hashes.",
        "**The ordering is the real decision.** Only the ordered containers iterate in sorted order, and only they have `lower_bound`, `upper_bound` and `equal_range` — so only they can answer \"every key between X and Y\", \"the smallest key at least X\", or \"iterate in order\". The unordered containers do not merely have a different order; those operations do not exist on them.",
      ],
      examples: [
        {
          id: "comparison",
          title: "Timings, and the operations only one family has",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

template <typename F>
long long timeMs(F f) {
    auto t0 = std::chrono::steady_clock::now();
    f();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
}

int main() {
    constexpr int N = 100000;

    std::vector<std::string> keys;
    keys.reserve(N);
    for (int i = 0; i < N; ++i)
        keys.push_back("key_" + std::to_string(i * 7919));

    std::map<std::string, int>           om;
    std::unordered_map<std::string, int> um;

    std::cout << "insert " << N << " string keys:\\n";
    std::cout << "  map           " << timeMs([&]{
        for (int i = 0; i < N; ++i) om[keys[static_cast<std::size_t>(i)]] = i;
    }) << " ms\\n";
    std::cout << "  unordered_map " << timeMs([&]{
        for (int i = 0; i < N; ++i) um[keys[static_cast<std::size_t>(i)]] = i;
    }) << " ms\\n";

    volatile long long sink = 0;
    std::cout << "look up all " << N << " keys:\\n";
    std::cout << "  map           " << timeMs([&]{
        long long s = 0;
        for (const auto& k : keys) s += om.find(k)->second;
        sink = s;
    }) << " ms\\n";
    std::cout << "  unordered_map " << timeMs([&]{
        long long s = 0;
        for (const auto& k : keys) s += um.find(k)->second;
        sink = s;
    }) << " ms\\n";
    (void)sink;

    // The thing only the ordered container can do.
    std::set<int> s{10, 20, 30, 40, 50};
    std::cout << "\\nordered set iterates in sorted order:";
    for (int x : s) std::cout << ' ' << x;
    std::cout << '\\n';

    auto lo = s.lower_bound(20);
    auto hi = s.upper_bound(40);
    std::cout << "range [20, 40]:";
    for (auto it = lo; it != hi; ++it) std::cout << ' ' << *it;
    std::cout << '\\n';

    std::unordered_set<int> us{10, 20, 30, 40, 50};
    std::cout << "unordered_set order is unspecified:";
    for (int x : us) std::cout << ' ' << x;
    std::cout << "\\n(no lower_bound / upper_bound exist for it at all)\\n";
}`,
          output: `insert 100000 string keys:
  map           53 ms
  unordered_map 49 ms
look up all 100000 keys:
  map           29 ms
  unordered_map 14 ms

ordered set iterates in sorted order: 10 20 30 40 50
range [20, 40]: 20 30 40
unordered_set order is unspecified: 50 40 30 20 10
(no lower_bound / upper_bound exist for it at all)`,
          explanation:
            "**Twice as fast on lookup, and nearly identical on insertion** — a real advantage, and not the thousand-fold gap the O(log n) against O(1) notation suggests. Insertion is close because both allocate a node per element and that allocation dominates. The bottom half is the part that should actually decide your choice: the `set` iterated in sorted order and answered a range query, and the `unordered_set` did neither — note it happened to print in reverse insertion order here, which is an implementation artefact you must never rely on.",
        },
      ],
      pitfalls: [
        {
          title: "Hash tables have a worst case, and it can be triggered deliberately",
          body: "O(1) is the *average*. If many keys hash to the same bucket, lookups degrade towards O(n) as they walk a chain. With the standard `std::hash` for strings — which is not randomly seeded per process on libstdc++ — an attacker who controls your keys can generate collisions on purpose and turn a request handler into a quadratic loop. That is a real denial-of-service class, and the mitigations are a keyed or randomly seeded hash, or an ordered container whose O(log n) is a genuine worst case. It is one of the few places where `map`'s guarantee is a security property.",
        },
      ],
    },
    {
      id: "operator-bracket",
      heading: "`operator[]` inserts, and `at` does not",
      body: [
        "**`map::operator[]` default-constructs and inserts the element if the key is absent**, then returns a reference to it. That is by design — it is what makes `counts[word]++` work — and it is a bug factory everywhere else.",
        "Two consequences catch people. **A lookup through `operator[]` on a missing key silently grows the map**, so a read-only-looking loop can double its size. And **`operator[]` cannot be used on a `const map` at all**, because it might modify it — which is why a `const` reference to a map suddenly stops compiling.",
        "The alternatives are all better for reading. **`at(key)`** throws `std::out_of_range` if absent and works on a `const` map. **`find(key)`** returns an iterator, or `end()`, and is the general tool. **`contains(key)`** (C++20) returns a `bool` and says exactly what it means; before C++20 the idiom was `count(key) > 0`.",
        "For insertion there is a similar spread. **`insert`** does nothing if the key exists. **`insert_or_assign`** overwrites and tells you which happened. **`try_emplace`** (C++17) is the one to prefer for maps with expensive values: unlike `emplace`, it **does not construct the value at all** when the key already exists, where `emplace` may build the value and then throw it away.",
      ],
      examples: [
        {
          id: "insertion-traps",
          title: "The silent insert, and the five ways to avoid it",
          lang: "cpp",
          code: `#include <iostream>
#include <map>
#include <string>

struct Expensive {
    std::string tag;
    Expensive() : tag("default") { std::cout << "    built default\\n"; }
    explicit Expensive(std::string t) : tag(std::move(t)) {
        std::cout << "    built " << tag << '\\n';
    }
};

int main() {
    std::map<std::string, int> counts;

    // The intended use: operator[] inserting a zero is exactly what we want.
    for (const char* w : {"a", "b", "a", "c", "a"}) ++counts[w];
    std::cout << "word counts: ";
    for (const auto& [k, v] : counts) std::cout << k << '=' << v << ' ';
    std::cout << "\\nsize = " << counts.size() << '\\n';

    // The trap: a READ through operator[] inserts.
    std::cout << "\\nreading a missing key with []: " << counts["zzz"] << '\\n';
    std::cout << "size is now " << counts.size() << "  <-- it grew!\\n";

    // Reading without inserting:
    std::cout << "contains(\\"qqq\\") = " << counts.contains("qqq") << '\\n';
    if (auto it = counts.find("qqq"); it != counts.end())
        std::cout << "found\\n";
    else
        std::cout << "find() -> end(), nothing inserted\\n";
    try {
        counts.at("qqq");
    } catch (const std::out_of_range&) {
        std::cout << "at() threw, nothing inserted\\n";
    }
    std::cout << "size still " << counts.size() << '\\n';

    // try_emplace does not build the value when the key is present.
    std::map<std::string, Expensive> m;
    std::cout << "\\nfirst try_emplace (key absent):\\n";
    m.try_emplace("k", "first");
    std::cout << "second try_emplace (key present):\\n";
    m.try_emplace("k", "second");        // value NOT constructed
    std::cout << "value is still: " << m.at("k").tag << '\\n';
}`,
          output: `word counts: a=3 b=1 c=1
size = 3

reading a missing key with []: 0
size is now 4  <-- it grew!
contains("qqq") = 0
find() -> end(), nothing inserted
at() threw, nothing inserted
size still 4

first try_emplace (key absent):
    built first
second try_emplace (key present):
value is still: first`,
          explanation:
            "**Printing `counts[\"zzz\"]` added an entry.** The map grew from 3 to 4 because of a line that reads like a query. `contains`, `find` and `at` all left it alone. The bottom half shows `try_emplace` earning its name: the second call built nothing at all, where `emplace` would have constructed an `Expensive{\"second\"}`, discovered the key existed, and destroyed it again. For a map keyed on strings with heavyweight values, that difference is worth having.",
        },
      ],
    },
    {
      id: "heterogeneous",
      heading: "Heterogeneous lookup",
      body: [
        "A `std::map<std::string, V>` looked up with a `const char*` or a `std::string_view` has a hidden cost: **the argument is converted to a `std::string` first**, which usually allocates — on every single lookup, just to throw it away.",
        "**Heterogeneous lookup removes that.** Give the map a comparator with a member type `is_transparent` and `find`, `count`, `contains`, `lower_bound`, `upper_bound` and `equal_range` become templates that compare the argument directly, with no conversion.",
        "The standard provides the comparator: **`std::less<>`** — with empty angle brackets — is transparent, where `std::less<std::string>` is not. So the change is one word in the type: `std::map<std::string, V, std::less<>>`.",
        "**For unordered containers the requirement is stricter**, since a hash must also be computed on the unconverted type. You need both a transparent hash and a transparent equality, and `is_transparent` on both. C++20 added the wording that makes this work; before that it was not possible at all.",
        "This is worth knowing because `std::map<std::string, T>` with `string_view` lookups is an extremely common shape, and the allocation is completely invisible in the source.",
      ],
      examples: [
        {
          id: "transparent",
          title: "Counting the allocations a lookup causes",
          lang: "cpp",
          code: `#include <cstdlib>
#include <iostream>
#include <map>
#include <string>
#include <string_view>

// Count every heap allocation the program makes.
static int allocations = 0;
void* operator new(std::size_t n) {
    ++allocations;
    return std::malloc(n);
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

int main() {
    // Long keys, so std::string cannot use its small-string buffer.
    const std::string k1 = "a_reasonably_long_key_number_one";
    const std::string k2 = "a_reasonably_long_key_number_two";

    std::map<std::string, int>                 plain{{k1, 1}, {k2, 2}};
    std::map<std::string, int, std::less<>>    transparent{{k1, 1}, {k2, 2}};

    std::string_view probe{"a_reasonably_long_key_number_one"};

    allocations = 0;
    for (int i = 0; i < 100; ++i) (void)plain.find(std::string{probe});
    std::cout << "plain map, 100 lookups:       "
              << allocations << " allocations\\n";

    allocations = 0;
    for (int i = 0; i < 100; ++i) (void)transparent.find(probe);
    std::cout << "transparent map, 100 lookups: "
              << allocations << " allocations\\n";

    std::cout << "\\nboth found the same element: "
              << (plain.find(k1)->second == transparent.find(probe)->second)
              << '\\n';
}`,
          output: `plain map, 100 lookups:       100 allocations
transparent map, 100 lookups: 0 allocations

both found the same element: 1`,
          explanation:
            "**A hundred allocations against zero, for the same hundred lookups.** The plain map had to materialise a `std::string` from the `string_view` before it could compare, and each one allocated because the key is too long for the small-string optimisation. Adding `std::less<>` to the map's type made `find` a template that compares the `string_view` directly against the stored keys. The counting `operator new` is a useful trick in its own right for questions of this shape.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the differences between `std::map` and `std::unordered_map`?",
      answer:
        "`map` is a balanced binary search tree — red-black in practice — with O(log n) worst-case operations, sorted iteration, and `lower_bound`/`upper_bound`/`equal_range` for range queries. `unordered_map` is a hash table with separate chaining, O(1) average and O(n) worst-case operations, unspecified iteration order, and no range-query operations at all. `map` requires the key to be ordered with `<`; `unordered_map` requires it to be hashable and equality-comparable. Measured on 100,000 string keys, the hash table was about twice as fast at lookup and similar at insertion — a real difference but far smaller than the notation implies, because tree comparisons on strings usually differ in the first few characters.",
    },
    {
      question: "When would you choose the ordered container despite it being slower?",
      answer:
        "Whenever you need order or range queries — sorted iteration, `lower_bound`, `upper_bound`, `equal_range`, or finding the nearest key — because those operations do not exist on the unordered containers. Also when the worst case matters: hash tables degrade towards O(n) on collisions, and with a non-randomised `std::hash` an attacker who controls the keys can force collisions deliberately and turn a lookup loop quadratic, which is a genuine denial-of-service vector. `map`'s O(log n) is a guarantee rather than an average. Finally, `map` needs only `<` on the key, where `unordered_map` needs a good hash you may not have.",
    },
    {
      question: "What is wrong with using `operator[]` to read from a map?",
      answer:
        "It inserts. If the key is absent, `operator[]` default-constructs a value, inserts it, and returns a reference — so a line that reads like a query silently grows the map, and a loop that appears read-only can double its size. It also cannot be called on a `const map` at all, since it may modify, which is why passing a map by const reference makes such code stop compiling. Use `at` to throw on a missing key, `find` to get an iterator or `end()`, or `contains` in C++20 to get a bool. `operator[]` is right when insert-if-absent is what you actually want, as in `++counts[word]`.",
    },
    {
      question: "What does `try_emplace` do that `emplace` does not?",
      answer:
        "`try_emplace` does not construct the mapped value at all when the key is already present. `emplace` may construct the value, discover the key exists, and immediately destroy it — wasted work, and observable if the constructor has side effects or allocates. `try_emplace` also takes the key and the value's constructor arguments separately, so it never has to build a `pair`. For a map with expensive values it is strictly better, and it is the right default for insert-if-absent. `insert_or_assign` is the counterpart when you do want to overwrite, and it reports which happened.",
    },
    {
      question: "What is heterogeneous lookup and why does it matter?",
      answer:
        "By default, looking up a `std::map<std::string, V>` with a `const char*` or `string_view` converts the argument to a `std::string` first, which allocates on every lookup for keys too long for the small-string optimisation. Heterogeneous lookup makes `find`, `contains`, `lower_bound` and friends templates that compare the argument directly, with no conversion. You enable it by giving the container a comparator with a nested `is_transparent` type — `std::less<>` with empty angle brackets is transparent while `std::less<std::string>` is not, so the change is `std::map<std::string, V, std::less<>>`. Measured over 100 lookups that is 100 allocations against zero. For unordered containers you need transparent hash *and* equality, which C++20 made possible.",
    },
  ],
  takeaways: [
    "`map`/`set` are balanced trees: O(log n) worst case, sorted, node-per-element",
    "`unordered_map`/`unordered_set` are hash tables: O(1) average, O(n) worst case, order unspecified",
    "The measured lookup gap for string keys is about 2×, not orders of magnitude",
    "Only the ordered containers have `lower_bound`, `upper_bound` and `equal_range` — they do not exist otherwise",
    "Hash collisions can be forced deliberately, making `map`'s worst-case guarantee a security property",
    "`operator[]` inserts a default-constructed value on a missing key, and cannot be used on a `const` map",
    "Use `at` to throw, `find` for an iterator, `contains` for a bool",
    "`try_emplace` does not construct the value when the key exists; `emplace` may build and discard it",
    "`insert` ignores existing keys; `insert_or_assign` overwrites and reports which happened",
    "`std::less<>` is transparent and enables heterogeneous lookup — `std::less<std::string>` is not",
    "Heterogeneous lookup turned 100 allocations into 0 for the same 100 `string_view` searches",
  ],
  status: "available",
};
