import type { Lesson } from "@/content/types";

export const classTemplatesLesson: Lesson = {
  id: "cpp-class-templates",
  slug: "class-templates-and-deduction-guides",
  moduleSlug: "templates-generics",
  title: "Class Templates, Default Arguments & Deduction Guides",
  summary:
    "Parameterising a type rather than a function. Why member functions are only compiled when called, what a non-type parameter puts into the type itself, and how C++17 let you drop the angle brackets — plus the deduction guide you write when it guesses wrong.",
  estimatedMinutes: 35,
  objectives: [
    "Write a class template and explain why each instantiation is an unrelated type",
    "Explain lazy instantiation of member functions and what it permits",
    "Use default template arguments, including ones referring to earlier parameters",
    "Use a non-type template parameter and say what it does to the type",
    "Write a deduction guide, and recognise when CTAD needs one",
  ],
  sections: [
    {
      id: "class-templates",
      heading: "Parameterising a type",
      body: [
        "A class template parameterises the *type itself*. `template <typename T> class Stack` defines a pattern, and `Stack<int>` and `Stack<std::string>` are two **entirely unrelated types** — no conversion between them, no common base, nothing shared but the source they were generated from.",
        "Inside the template, `T` is used exactly like a normal type. Outside, you normally write `Stack<int>` in full; within the class's own scope the bare name `Stack` is shorthand for the current instantiation, which is why a copy constructor can be written `Stack(const Stack&)` rather than `Stack(const Stack<T>&)`.",
        "**Member functions are instantiated lazily — only when they are actually called.** This is a genuinely useful property rather than a technicality. It means a class template can offer operations that would not compile for every possible `T`, and instantiating the class with such a `T` is fine as long as you never call those particular members.",
        "That is how `std::vector<T>` can have a `sort`-friendly interface, how containers offer `operator<` that only works for comparable elements, and how you can store a type in a container that has no `operator<<` as long as you never try to print it.",
      ],
      examples: [
        {
          id: "stack",
          title: "A class template, and a member that is never compiled",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

// A class template: T is a parameter of the TYPE itself.
// Stack<int> and Stack<std::string> are two entirely unrelated types.
template <typename T>
class Stack {
public:
    void push(T value) { data_.push_back(std::move(value)); }

    T pop() {
        if (data_.empty()) throw std::out_of_range("pop on empty stack");
        T top = std::move(data_.back());
        data_.pop_back();
        return top;
    }

    bool        empty() const { return data_.empty(); }
    std::size_t size()  const { return data_.size(); }

    // Only compiled if somebody actually calls it. See below.
    void debugPrint() const {
        for (const auto& v : data_) std::cout << "  " << v << '\\n';
    }

private:
    std::vector<T> data_;
};

struct NotPrintable { int x; };

int main() {
    Stack<int> ints;
    ints.push(1);
    ints.push(2);
    std::cout << "int stack size = " << ints.size() << '\\n';
    std::cout << "popped         = " << ints.pop() << '\\n';

    Stack<std::string> words;
    words.push("hello");
    words.push("world");
    words.debugPrint();

    // NotPrintable has no operator<<, so debugPrint() could never compile
    // for it -- but member functions are instantiated only when USED.
    Stack<NotPrintable> weird;
    weird.push({7});
    std::cout << "weird size     = " << weird.size() << '\\n';
    // weird.debugPrint();   // <-- this line would be the error
}`,
          output: `int stack size = 2
popped         = 2
  hello
  world
weird size     = 1`,
          explanation:
            "**`Stack<NotPrintable>` compiled perfectly even though `debugPrint` could never work for it.** The class was instantiated, `push` and `size` were instantiated because they were called, and `debugPrint` was not — so its `operator<<` requirement was never checked. Uncommenting one line turns it into an error. This is why a container can offer members that only make sense for some element types, and it is worth remembering when you are wondering why a template compiled that you expected to fail.",
        },
      ],
    },
    {
      id: "defaults-and-nttp",
      heading: "Default arguments and non-type parameters",
      body: [
        "**Default template arguments** work like default function arguments: they must come last, and a later default may refer to an earlier parameter. `template <typename T, typename Compare = std::less<T>>` is the standard pattern, and it is exactly how `std::map`, `std::set` and `std::priority_queue` let you write `std::map<K, V>` while still allowing a custom comparator.",
        "**Non-type template parameters** take a *value* rather than a type: `template <typename T, std::size_t N>`. The value becomes part of the type, so `FixedBuffer<double, 4>` and `FixedBuffer<double, 8>` are unrelated types, exactly like `std::array<int, 3>` and `std::array<int, 4>`.",
        "The permitted kinds are integral and enumeration types, pointers and references with linkage, `std::nullptr_t`, and — since C++20 — floating point and *literal class types*, which is what allows compile-time strings as template parameters.",
        "The payoff is that the value is known at compile time: it can size an array member, be used in `static_assert`, and be constant-folded into the generated code with no runtime storage. The cost is that **each distinct value generates a distinct instantiation**, so a buffer templated on its size produces separate code for every size you use.",
      ],
      examples: [
        {
          id: "defaults-nttp",
          title: "A defaulted comparator and a size baked into the type",
          lang: "cpp",
          code: `#include <functional>
#include <type_traits>
#include <iostream>
#include <vector>

// Default template arguments: give the common case a shorthand.
// Note Compare defaults to std::less<T>, and T is used in ITS default.
template <typename T, typename Compare = std::less<T>>
class SortedBag {
public:
    void add(T v) {
        auto pos = data_.begin();
        while (pos != data_.end() && cmp_(*pos, v)) ++pos;
        data_.insert(pos, std::move(v));
    }
    void print() const {
        for (const auto& v : data_) std::cout << ' ' << v;
        std::cout << '\\n';
    }
private:
    std::vector<T> data_;
    Compare        cmp_{};
};

// A non-type template parameter: a VALUE, not a type.
template <typename T, std::size_t N>
class FixedBuffer {
public:
    constexpr std::size_t capacity() const { return N; }
    T&       operator[](std::size_t i)       { return data_[i]; }
    const T& operator[](std::size_t i) const { return data_[i]; }
private:
    T data_[N]{};
};

int main() {
    SortedBag<int> ascending;                       // Compare defaults
    for (int v : {5, 1, 4, 2}) ascending.add(v);
    std::cout << "ascending :";  ascending.print();

    SortedBag<int, std::greater<int>> descending;   // Compare supplied
    for (int v : {5, 1, 4, 2}) descending.add(v);
    std::cout << "descending:";  descending.print();

    FixedBuffer<double, 4> buf;
    buf[0] = 1.5;
    std::cout << "capacity = " << buf.capacity()
              << ", sizeof = " << sizeof(buf) << '\\n';

    // N is part of the TYPE: these are different types.
    std::cout << "same type? "
              << std::is_same_v<FixedBuffer<double,4>, FixedBuffer<double,8>>
              << '\\n';
}`,
          output: `ascending : 1 2 4 5
descending: 5 4 2 1
capacity = 4, sizeof = 32
same type? 0`,
          explanation:
            "**`sizeof(buf)` is 32 — four doubles and nothing else.** `N` cost no storage because it is part of the type rather than a member, which is exactly the difference between `std::array<T, N>` and `std::vector<T>`. `capacity()` is `constexpr` and returns a compile-time constant. And the last line confirms that changing only the *value* produces a different type: a function taking `FixedBuffer<double,4>` will not accept a `FixedBuffer<double,8>`, which is the same reason `std::array` sizes do not interconvert.",
        },
      ],
      pitfalls: [
        {
          title: "Code bloat from non-type parameters is real but usually overstated",
          body: "Every distinct value of a non-type parameter instantiates a separate copy of every member function you call. A `FixedBuffer<double, N>` used with twenty different sizes produces twenty sets of functions. The standard mitigation, when it matters, is to put the size-independent logic in a non-template base or a free function taking a pointer and a length, and keep only the thin size-aware wrapper templated. Measure before doing this — it trades clarity for binary size, and for most code the sizes in use are few.",
        },
      ],
    },
    {
      id: "ctad",
      heading: "Class template argument deduction",
      body: [
        "Before C++17, class templates never deduced their arguments — you wrote `std::pair<int, double> p{1, 2.5}` in full, or used a `make_` helper like `std::make_pair` whose entire purpose was to be a *function* template so deduction could happen.",
        "**C++17 added CTAD**: the compiler deduces a class template's arguments from its constructor arguments, so `std::pair p{1, 2.5}` works and `std::make_pair` is largely obsolete. It is why you can now write `std::vector v{1, 2, 3}` and `std::lock_guard lock{m}`.",
        "It works by forming an implicit set of *deduction guides* from the constructors and running ordinary function template deduction on them. Most of the time that does the right thing.",
        "**When it does not, you write a guide yourself.** The syntax sits outside the class, at namespace scope: `template <typename T> Averager(std::vector<T>) -> Averager<T>;` — read as \"constructing from a `vector<T>` gives you an `Averager<T>`\".",
        "Two situations need one. The first is when the class parameter is not directly a constructor parameter but has to be *extracted* from one, as with a wrapper taking a container and templated on its element type. The second is when you want to change what deduction produces — most often to apply decay, so a string literal becomes `std::string` rather than `const char*`.",
      ],
      examples: [
        {
          id: "ctad-guides",
          title: "CTAD working, CTAD guessing wrong, and a guide",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

template <typename T>
constexpr std::string_view typeName() {
    std::string_view p = __PRETTY_FUNCTION__;
    auto start = p.find("T = ") + 4;
    auto end   = p.find(';', start);
    return p.substr(start, end - start);
}

template <typename A, typename B>
struct Pair {
    A first;
    B second;
};

// The implicit guide from the aggregate would work here, but writing it
// explicitly shows the syntax: constructing from (A, B) gives Pair<A, B>.
template <typename A, typename B>
Pair(A, B) -> Pair<A, B>;

// A wrapper whose constructor takes a container, so the ELEMENT type must
// be extracted -- deduction cannot do that on its own.
template <typename T>
class Averager {
public:
    explicit Averager(std::vector<T> data) : data_(std::move(data)) {}
    double mean() const {
        double sum = 0;
        for (const auto& v : data_) sum += static_cast<double>(v);
        return data_.empty() ? 0.0 : sum / static_cast<double>(data_.size());
    }
private:
    std::vector<T> data_;
};

// Deduction guide: from a vector<T>, build an Averager<T>.
template <typename T>
Averager(std::vector<T>) -> Averager<T>;

int main() {
    // C++17 CTAD: no <int> needed, the constructor tells the compiler.
    std::vector v{1, 2, 3, 4};
    std::cout << "vector deduced as   " << typeName<decltype(v)>() << '\\n';

    std::pair p{1, 2.5};
    std::cout << "pair deduced as     " << typeName<decltype(p)>() << '\\n';

    Pair q{std::string{"key"}, 42};
    std::cout << "Pair deduced as     " << typeName<decltype(q)>() << '\\n';

    // The classic trap: a string LITERAL decays to const char*.
    Pair r{"key", 42};
    std::cout << "Pair from literal   " << typeName<decltype(r)>() << '\\n';

    Averager a{std::vector{1, 2, 3, 4}};
    std::cout << "Averager mean = " << a.mean() << '\\n';
}`,
          output: `vector deduced as   std::vector<int, std::allocator<int> >
pair deduced as     std::pair<int, double>
Pair deduced as     Pair<std::__cxx11::basic_string<char>, int>
Pair from literal   Pair<const char*, int>
Averager mean = 2.5`,
          explanation:
            "**Look at the fourth line.** `Pair r{\"key\", 42}` deduced `Pair<const char*, int>`, not `Pair<std::string, int>` — the literal decayed, and the resulting object holds a pointer into string storage rather than owning its text. That is fine for a literal and a live grenade for a `std::string` that goes out of scope. The standard library has this exact wart: `std::pair p{\"key\", 42}` is a `pair<const char*, int>` too. If you want decay-to-`std::string`, the guide has to say so explicitly. `Averager` shows the other case — no constructor parameter is a `T`, so without the guide the compiler cannot work out the element type at all.",
        },
      ],
      pitfalls: [
        {
          title: "CTAD does not apply to partial argument lists",
          body: "You either give all the template arguments or none of them. `std::vector<int> v{...}` is explicit, `std::vector v{...}` is CTAD, and there is no way to say `std::vector<int, ...deduce the allocator...>`. This surprises people with types like `std::unordered_map<K, V, Hash, Eq, Alloc>` where you want to specify two arguments and deduce nothing else — you simply write all five, or rely on their defaults. It is also why CTAD and default template arguments solve different problems and are frequently used together.",
        },
      ],
    },
    {
      id: "organising",
      heading: "Defining members outside the class",
      body: [
        "Member functions of a class template can be defined outside the class body, and the syntax is verbose enough to be worth seeing once.",
        "Every out-of-class definition must repeat the `template <typename T>` header, and the class name must be written with its arguments — `Stack<T>::` — even though the return type before it and the parameters after it can use the bare `T`.",
        "There is one asymmetry worth knowing: **the return type is written before the class scope is entered**, so a nested type in the return position needs `typename Stack<T>::iterator` in full, while the same name inside the parameter list or body can be written unqualified. That is the reason so many out-of-class definitions in real headers look far worse than the declarations they implement.",
        "Since the definitions have to be in the header anyway, defining members inline inside the class body is usually the better choice for templates — it avoids all of this. Reserve out-of-class definitions for when the class body would otherwise become unreadable.",
      ],
      examples: [
        {
          id: "out-of-class",
          title: "The same members, defined outside",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

template <typename T>
class Ring {
public:
    using value_type = T;
    using iterator   = typename std::vector<T>::iterator;

    explicit Ring(std::size_t cap);

    void     push(T v);
    iterator begin();                  // returns a nested type
    std::size_t size() const;

private:
    std::size_t    cap_;
    std::vector<T> data_;
};

// Every definition repeats the template header and qualifies with Ring<T>.
template <typename T>
Ring<T>::Ring(std::size_t cap) : cap_(cap) {}

template <typename T>
void Ring<T>::push(T v) {
    if (data_.size() == cap_) data_.erase(data_.begin());
    data_.push_back(std::move(v));
}

// The return type is OUTSIDE the class scope, so it needs the full
// 'typename Ring<T>::iterator' -- this is the one that catches people.
template <typename T>
typename Ring<T>::iterator Ring<T>::begin() {
    return data_.begin();
}

template <typename T>
std::size_t Ring<T>::size() const { return data_.size(); }

int main() {
    Ring<int> r{3};
    for (int v : {1, 2, 3, 4}) r.push(v);

    std::cout << "size = " << r.size() << ", contents:";
    for (auto it = r.begin(); it != r.begin() + r.size(); ++it)
        std::cout << ' ' << *it;
    std::cout << '\\n';
}`,
          output: `size = 3, contents: 2 3 4`,
          explanation:
            "**`typename Ring<T>::iterator Ring<T>::begin()` is the shape to recognise.** The `typename` is required because `Ring<T>::iterator` is a *dependent* name — it depends on `T`, so the compiler cannot know it is a type rather than a static member until instantiation, and you must tell it. Once the parser is inside `Ring<T>::begin`, the class scope is active and the same name needs no qualification at all. C++20 relaxed this in a few positions, but the rule still holds in enough places that recognising the pattern matters more than memorising the exceptions.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Are `Stack<int>` and `Stack<double>` related types?",
      answer:
        "No. They are entirely unrelated types that happen to have been generated from the same template — no implicit conversion between them, no common base class, and no shared code unless you deliberately factor it into one. A function taking a `Stack<int>` will not accept a `Stack<double>`. If you need to write code that works with both, that function must itself be a template, or take some common interface you provided explicitly. This is different from generics in Java or C#, where erasure or reification gives instantiations a runtime relationship.",
    },
    {
      question: "When are a class template's member functions instantiated?",
      answer:
        "Only when they are actually called — instantiating the class instantiates its declarations, not the bodies of its members. That means a class template can offer members that would not compile for every possible `T`, and instantiating with such a `T` is perfectly legal as long as you never call those members. A `Stack<NotPrintable>` can have a `debugPrint` requiring `operator<<`, and it compiles fine until someone calls it. This is why some templates compile that you expected to fail, and it is what lets standard containers offer element-type-dependent operations without constraining every element type.",
    },
    {
      question: "What is a non-type template parameter, and what does it cost?",
      answer:
        "A template parameter that takes a value rather than a type, such as `template <typename T, std::size_t N>`. The value becomes part of the type, so `FixedBuffer<double,4>` and `FixedBuffer<double,8>` are unrelated — exactly like `std::array<int,3>` and `std::array<int,4>`. Permitted kinds are integral and enumeration types, pointers and references with linkage, `nullptr_t`, and since C++20 floating point and literal class types, which enables compile-time strings. The benefit is that the value is a compile-time constant with no runtime storage; the cost is that each distinct value generates a separate instantiation of every member you call, so many distinct values mean more code.",
    },
    {
      question: "What is CTAD, and when do you need to write a deduction guide?",
      answer:
        "Class template argument deduction, added in C++17, lets the compiler deduce a class template's arguments from its constructor arguments — so `std::pair p{1, 2.5}` works and `make_pair` is largely obsolete. It works by forming implicit deduction guides from the constructors and running ordinary function template deduction. You write an explicit guide in two cases: when the class's parameter must be extracted from a constructor argument rather than being one, such as a wrapper templated on a container's element type; and when you want to change the result, most commonly to force decay so a string literal deduces `std::string` instead of `const char*`. The syntax is at namespace scope: `template <typename T> Averager(std::vector<T>) -> Averager<T>;`.",
    },
    {
      question: "Why does `std::pair p{\"key\", 42}` not give you a `pair<std::string, int>`?",
      answer:
        "Because CTAD runs the same deduction as a function template taking its arguments by value, so the string literal decays from `const char[4]` to `const char*`. You get `std::pair<const char*, int>`, which holds a pointer rather than owning any text. For a literal that is harmless since it has static storage duration, but the same pattern with a pointer to something that goes out of scope leaves a dangling member. The fixes are to write the type explicitly, to construct the `std::string` yourself at the call site, or — for your own types — to write a deduction guide that applies `std::decay_t` and maps character pointers to `std::string`.",
    },
    {
      question: "Why do out-of-class member definitions need `typename` on a nested return type?",
      answer:
        "Because `Ring<T>::iterator` is a dependent name — what it refers to depends on `T`, which is not known until instantiation — and the compiler must decide during parsing whether it is a type or a static data member. The default assumption is that it is not a type, so you write `typename` to say otherwise. The return type is written before the class scope is entered, which is why it needs the qualification while the same name inside the function body does not. C++20 made `typename` implicit in several positions, but not enough of them to stop the pattern appearing throughout real template headers.",
    },
  ],
  takeaways: [
    "Each instantiation of a class template is an unrelated type with no conversions between them",
    "Member functions are instantiated only when called, so members can require more than every `T` supports",
    "Default template arguments must come last and may refer to earlier parameters",
    "Non-type parameters take values, and the value becomes part of the type",
    "A non-type parameter costs no storage but generates a separate instantiation per distinct value",
    "CTAD (C++17) deduces class template arguments from constructor arguments",
    "Write a deduction guide when the parameter must be extracted from an argument, or to force decay",
    "CTAD is all-or-nothing — you cannot supply some arguments and deduce the rest",
    "`std::pair p{\"key\", 42}` deduces `const char*`, not `std::string`",
    "Out-of-class definitions repeat the template header and qualify with `ClassName<T>::`",
    "A dependent nested type in a return position needs `typename`, because the parser cannot tell it is a type",
  ],
  status: "available",
};
