import type { Lesson } from "@/content/types";

export const structsLesson: Lesson = {
  id: "cpp-structs",
  slug: "structs",
  moduleSlug: "classes-constructors-destructors",
  title: "Structs: Grouping Data",
  summary:
    "Your first user-defined type. Aggregate initialisation, designated initialisers, default member values — and why a struct that is 12 bytes of members can occupy 12 bytes or 8 depending purely on the order you declared them in.",
  estimatedMinutes: 30,
  objectives: [
    "Define a struct and initialise it in each of the available ways",
    "Use default member initialisers and designated initialisers",
    "Destructure a struct with structured bindings",
    "Explain padding and alignment, and reorder members to shrink a type",
    "Know when a plain struct is the right answer and when it is not",
  ],
  sections: [
    {
      id: "defining",
      heading: "Defining and initialising a struct",
      body: [
        "A `struct` groups related values into a single type. `struct Point { double x; double y; };` creates a type whose objects hold two doubles, and from that moment `Point` is as real a type as `int` — you can declare variables of it, pass it to functions, return it, and put it in a container.",
        "**Note the semicolon after the closing brace.** A class or struct definition is a statement and requires one. Forgetting it produces an error on the *next* line, which is the module 1 trap in a new setting.",
        "An **aggregate** — a struct with no private members, no user-provided constructors, no virtual functions and no base classes — can be initialised with braces, member by member in declaration order. This is *aggregate initialisation*, and it is why simple structs need no constructor at all.",
        "**Default member initialisers** — `double x{};` in the definition — give a member a value used whenever the initialiser does not supply one. This is the single best defence against the uninitialised-member bug, and it costs nothing when you always initialise explicitly.",
        "**Designated initialisers** (C++20) let you name the members: `Point{.x = 1.0, .y = 2.0}`. They must appear in declaration order, and they make a long initialisation readable at the call site instead of positional and guessable.",
      ],
      examples: [
        {
          id: "struct-forms",
          title: "Every way to build one",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

struct Point { double x{}; double y{}; };

struct Employee {
    std::string name;
    int         id{};
    double      salary{};
    bool        active{true};
};

int main() {
    Point origin{};                 // all members value-initialised
    Point p{3.0, 4.0};              // aggregate initialisation, in order
    Point q{.x = 1.0, .y = 2.0};    // designated initialisers (C++20)

    Employee e{"Ada", 1, 95000.0};  // trailing members use their defaults

    std::cout << origin.x << ',' << origin.y << ' '
              << p.x << ',' << p.y << ' '
              << q.x << ',' << q.y << '\\n';
    std::cout << e.name << ' ' << e.id << ' ' << e.salary << ' '
              << std::boolalpha << e.active << '\\n';

    std::vector<Point> path{{0,0}, {1,1}, {2,4}};
    for (const auto& [x, y] : path) std::cout << '(' << x << ',' << y << ") ";
    std::cout << '\\n';

    std::cout << "sizeof(Point) = " << sizeof(Point) << '\\n';
}`,
          output: `0,0 3,4 1,2
Ada 1 95000 true
(0,0) (1,1) (2,4)
sizeof(Point) = 16`,
          explanation:
            "`Employee e{\"Ada\", 1, 95000.0}` supplied three of four members and **`active` took its default of `true`** — that is what default member initialisers buy you. The `std::vector<Point>` line shows nested braces: the outer pair is the vector, each inner pair is a `Point`. And `for (const auto& [x, y] : path)` destructures each element, which works on any aggregate, not just pairs.",
        },
      ],
      pitfalls: [
        {
          title: "Aggregate initialisation is positional, so reordering members silently changes meaning",
          body: "`Employee{\"Ada\", 1, 95000.0}` binds by position. If someone later swaps `id` and `salary` in the definition, every existing brace-initialisation still compiles — and now assigns a salary of 1 and an id of 95000. Nothing warns, because both are arithmetic types. This is precisely what designated initialisers fix: `Employee{.name = \"Ada\", .id = 1, .salary = 95000.0}` breaks loudly if the order changes, because the names must match declaration order.",
        },
      ],
    },
    {
      id: "padding",
      heading: "Padding, alignment and member order",
      body: [
        "A struct is not simply the sum of its members. The compiler inserts **padding** so that each member sits at an address the hardware can access efficiently.",
        "The rule is **alignment**: a type of size `N` generally must live at an address that is a multiple of its alignment, which for the built-in types equals their size. An `int` wants a 4-byte boundary, a `double` an 8-byte one. `alignof(T)` reports it.",
        "The struct as a whole is then padded to a multiple of its largest member's alignment, so that an array of them keeps every element aligned.",
        "The consequence is practical and slightly startling: **the order you declare members in changes the size of the type.** Declaring `char, int, char` costs 12 bytes; `int, char, char` costs 8. Same data, 33% less memory.",
        "Whether this matters depends on scale. For one object, never. **For a million of them in a vector, it is the difference between fitting in cache and not** — which is usually a far bigger effect than any algorithmic tweak. Module 13 covers data layout properly.",
        "The habit that costs nothing: **declare members in decreasing order of size.** Largest first, smallest last.",
      ],
      examples: [
        {
          id: "padding-demo",
          title: "The same members, two sizes",
          lang: "cpp",
          code: `#include <iostream>

struct Padded { char a; int b; char c; };
struct Packed { int b; char a; char c; };

int main() {
    std::cout << "Padded: " << sizeof(Padded) << " bytes\\n";
    std::cout << "Packed: " << sizeof(Packed) << " bytes\\n";
    std::cout << "alignof(int) = " << alignof(int) << '\\n';
}`,
          output: `Padded: 12 bytes
Packed: 8 bytes
alignof(int) = 4`,
          explanation:
            "**`Padded` lays out as: `a` (1 byte), 3 bytes of padding so `b` reaches a 4-byte boundary, `b` (4 bytes), `c` (1 byte), then 3 more bytes so the whole struct is a multiple of 4.** Total 12. **`Packed` puts `b` first at offset 0, then `a` and `c` fill two of the following bytes, and 2 bytes of tail padding round it to 8.** The members are identical; only the declaration order differs.",
        },
      ],
    },
    {
      id: "struct-vs-class",
      heading: "struct against class",
      body: [
        "In C++ these two keywords differ in exactly one way: **`struct` members are `public` by default and `class` members are `private` by default.** Everything else — constructors, destructors, inheritance, virtual functions, templates — is available to both.",
        "So the choice is a convention, and the convention is meaningful. **Use `struct` when the type is a bundle of data with no invariant to protect** — a point, a colour, a configuration, a function's return value. All members public, no methods beyond perhaps a comparison.",
        "**Use `class` when the object maintains an invariant** — something that must always be true of its state, which the type is responsible for enforcing. That is the subject of the next lesson.",
        "A useful test: **can any combination of member values be valid?** If yes, `struct`. If some combinations would be nonsense — a negative length, a null pointer that must never be null, a `size` that must match the actual buffer — then you need a `class`, because you need to control how those members are set.",
      ],
      examples: [
        {
          id: "struct-uses",
          title: "Three good uses of a plain struct",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// 1. A return value with named parts.
struct ParseResult {
    bool        ok{};
    int         value{};
    std::string error{};   // the {} silences -Wmissing-field-initializers
};

ParseResult parse(const std::string& text) {
    try   { return {.ok = true, .value = std::stoi(text)}; }
    catch (const std::exception& e) { return {.ok = false, .error = e.what()}; }
}

// 2. Grouped parameters, so the call site is readable.
struct RenderOptions {
    int  width{800};
    int  height{600};
    bool vsync{true};
    bool fullscreen{false};
};

void render(const RenderOptions& opts) {
    std::cout << "  " << opts.width << 'x' << opts.height
              << " vsync=" << std::boolalpha << opts.vsync << '\\n';
}

int main() {
    for (const char* s : {"42", "oops"}) {          // see the note below
        auto r = parse(s);
        if (r.ok) std::cout << "parsed " << r.value << '\\n';
        else      std::cout << "failed: " << r.error << '\\n';
    }

    render({});                                     // all defaults
    render({.width = 1920, .height = 1080});        // two overridden
    render({.width = 640, .height = 480, .vsync = false});
}`,
          output: `parsed 42
failed: stoi
  800x600 vsync=true
  1920x1080 vsync=true
  640x480 vsync=false`,
          explanation:
            "**The `RenderOptions` pattern is worth stealing.** Compare `render({.width = 1920, .height = 1080})` with `render(1920, 1080, true, false)` — the second needs you to remember what the two booleans mean and cannot be extended without touching every call site. Named defaults in a struct give you optional arguments, in any order, readable at the call site. It is how most modern C++ APIs handle configuration. Two `-Wextra` details this example was written to avoid: `error` needs its `{}` or the partial designated initialisation warns, and the loop is over `const char*` rather than `const std::string&`, because binding a reference to a temporary string built from each literal triggers `-Wrange-loop-construct`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `struct` and `class` in C++?",
      answer:
        "Exactly one thing: default access. `struct` members are public by default, `class` members private. Both support constructors, destructors, inheritance, virtual functions and templates identically. The difference that matters is conventional: use `struct` for a bundle of data with no invariant, where any combination of member values is valid, and `class` when the object must enforce something about its state. A good test is whether some combinations of members would be nonsense — if so, you need private members and a constructor, which means a class.",
    },
    {
      question: "What is aggregate initialisation, and what are designated initialisers?",
      answer:
        "An aggregate — a struct with no private members, user-provided constructors, virtual functions or base classes — can be brace-initialised member by member in declaration order, so no constructor is needed. The weakness is that it is positional: reordering two members of the same type silently changes what every existing initialisation means, with no warning. Designated initialisers, added in C++20, name the members — `Point{.x = 1, .y = 2}` — and must appear in declaration order, so a reordering breaks the build instead of the behaviour.",
    },
    {
      question: "Why does the order of members change the size of a struct?",
      answer:
        "Because of alignment padding. Each member must sit at an address that is a multiple of its alignment — 4 bytes for `int`, 8 for `double` — so the compiler inserts padding between members, and pads the struct itself to a multiple of its largest member's alignment so arrays stay aligned. `struct { char; int; char; }` is 12 bytes while `struct { int; char; char; }` holding the same data is 8. Declaring members in decreasing size order minimises it, which is free and matters once you have arrays large enough for cache behaviour to dominate.",
    },
    {
      question: "What are default member initialisers and why use them?",
      answer:
        "A value written in the class definition — `int id{};` or `bool active{true};` — used whenever a constructor or aggregate initialisation does not supply one. They are the cheapest defence against uninitialised members, which are undefined behaviour when read and often appear to work in testing. They cost nothing when you always initialise explicitly, because the compiler elides the redundant store, and they mean a newly added member cannot silently become garbage in every existing constructor.",
    },
    {
      question: "How would you design a function with several optional parameters?",
      answer:
        "Group them into an options struct with default member initialisers and take it by const reference. The call site then reads `render({.width = 1920, .height = 1080})` — named, in any order, and only the ones you care about. Compare with a positional parameter list, where booleans are unreadable at the call site and adding a parameter means touching every caller. It is the standard modern C++ approach to configuration and it composes better than default arguments, which must be trailing.",
    },
  ],
  takeaways: [
    "A struct definition needs a semicolon after the closing brace; forgetting it errors on the next line",
    "An aggregate can be brace-initialised member by member with no constructor at all",
    "Default member initialisers (`int id{};`) are the cheapest defence against uninitialised members",
    "Designated initialisers name the members, so reordering the definition breaks the build rather than the behaviour",
    "Member order changes the size of the type — `char,int,char` is 12 bytes and `int,char,char` is 8",
    "Declare members largest-first; it is free and matters once arrays get big enough for cache to dominate",
    "`struct` and `class` differ only in default access — choose by whether there is an invariant to protect",
    "An options struct with defaults is the readable way to give a function many optional parameters",
  ],
  status: "available",
};
