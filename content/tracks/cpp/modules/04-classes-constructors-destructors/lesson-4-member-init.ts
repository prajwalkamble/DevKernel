import type { Lesson } from "@/content/types";

export const memberInitLesson: Lesson = {
  id: "cpp-member-init",
  slug: "member-initialiser-lists",
  moduleSlug: "classes-constructors-destructors",
  title: "Member Initialiser Lists & Initialisation Order",
  summary:
    "Why initialising in the constructor body is not initialisation at all but assignment, when it is a compile error rather than a waste, and why members are initialised in declaration order no matter what order you write them in.",
  estimatedMinutes: 30,
  objectives: [
    "Use a member initialiser list and explain what it does differently from the body",
    "Name the three cases where the initialiser list is mandatory",
    "State the initialisation order rule and the bug it causes",
    "Recognise the `-Wreorder` warning and take it seriously",
    "Choose between default member initialisers and constructor initialiser lists",
  ],
  sections: [
    {
      id: "list-vs-body",
      heading: "The initialiser list is not the same as the body",
      body: [
        "A constructor can set its members in two places, and they are genuinely different operations.",
        "**The member initialiser list** — after the colon, before the opening brace — *constructs* each member with the value you give.",
        "**The constructor body** runs after every member has already been constructed. Anything you write there is an *assignment* to an already-built object.",
        "So `Widget(const Thing& t) : member_(t) {}` constructs `member_` once, as a copy of `t`. `Widget(const Thing& t) { member_ = t; }` default-constructs `member_` first, then assigns over it — two operations where one would do.",
        "For an `int` this is invisible; the optimiser removes the redundant store. For a `std::string`, a `std::vector` or any type with a non-trivial constructor, it is a real, measurable waste — and for the three cases below it does not compile at all.",
      ],
      examples: [
        {
          id: "list-vs-body-demo",
          title: "The difference, made visible",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::cout << "  ctor " << name << '\\n'; }
    Tracer(const Tracer& o) : name(o.name) { std::cout << "  copy " << name << '\\n'; }
    Tracer& operator=(const Tracer& o) {
        name = o.name; std::cout << "  assign " << name << '\\n'; return *this;
    }
    ~Tracer() { std::cout << "  dtor " << name << '\\n'; }
};

class InitList {
public:
    explicit InitList(const Tracer& t) : member_(t) { std::cout << "  body of InitList\\n"; }
private:
    Tracer member_;
};

class AssignInBody {
public:
    explicit AssignInBody(const Tracer& t) : member_("default") {
        member_ = t;
        std::cout << "  body of AssignInBody\\n";
    }
private:
    Tracer member_;
};

int main() {
    Tracer source{"source"};
    std::cout << "-- init list --\\n";      { InitList a{source}; }
    std::cout << "-- assign in body --\\n"; { AssignInBody b{source}; }
    std::cout << "-- done --\\n";
}`,
          output: `  ctor source
-- init list --
  copy source
  body of InitList
  dtor source
-- assign in body --
  ctor default
  assign source
  body of AssignInBody
  dtor source
-- done --
  dtor source`,
          explanation:
            "**The initialiser list version performed one operation — a copy. The body version performed two — a construction followed by an assignment.** For a `std::string` that is an allocation you did not need. Note also that the assigning version briefly held the value `\"default\"`, which is a meaningless state the object was never supposed to be in. **Always initialise in the list.**",
        },
      ],
    },
    {
      id: "mandatory",
      heading: "Three cases where the list is mandatory",
      body: [
        "For these, assignment in the body is not merely wasteful — there is no assignment available, so the code does not compile.",
        "**`const` members.** A `const` member can be initialised and never assigned. Its only opportunity is the initialiser list.",
        "**Reference members.** A reference must be bound when it comes into existence and can never be rebound. Same reasoning.",
        "**Members with no default constructor.** If the type cannot be default-constructed, there is nothing to construct before the body runs, so the member must be constructed directly in the list. The same applies to base classes with no default constructor, which are initialised in the same list.",
      ],
      examples: [
        {
          id: "mandatory-demo",
          title: "The three that must be in the list",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

class NoDefault {
public:
    explicit NoDefault(int v) : value_(v) {}
    int value() const { return value_; }
private:
    int value_;
};

class Widget {
public:
    Widget(std::string name, int& counter)
        : name_(std::move(name)),   // ordinary member: efficient
          id_(next_id()),           // const: mandatory
          counter_(counter),        // reference: mandatory
          part_(42)                 // no default constructor: mandatory
    {
        ++counter_;                 // the body can still do work
    }

    void show() const {
        std::cout << name_ << " id=" << id_ << " part=" << part_.value() << '\\n';
    }

private:
    static int next_id() { static int n = 0; return ++n; }

    std::string     name_;
    const int       id_;
    int&            counter_;
    NoDefault       part_;
};

int main() {
    int created = 0;
    Widget a{"alpha", created};
    Widget b{"beta", created};
    a.show();
    b.show();
    std::cout << "created " << created << '\\n';
}`,
          output: `alpha id=1 part=42
beta id=2 part=42
created 2`,
          explanation:
            "Move any of the last three into the body and the compiler rejects it. The verified messages are `error: uninitialized const member in 'const int'`, `error: uninitialized reference member in 'int&'`, and `error: no matching function for call to 'NoDefault::NoDefault()'` — plus, for the const, a second error on the assignment itself: `assignment of read-only member`. **The reference member is worth a caution**: `counter_` refers to a caller's variable, so a `Widget` must not outlive it. A reference member also makes the class non-assignable, since references cannot be rebound.",
        },
      ],
    },
    {
      id: "order",
      heading: "Members initialise in declaration order",
      body: [
        "This rule catches everyone once, and it is the source of a genuinely nasty class of bug.",
        "**Members are initialised in the order they are declared in the class, not the order they appear in the initialiser list.**",
        "The reason is that the destructor must destroy members in a fixed, well-defined order — reverse of construction — and the class has only one destructor while it may have many constructors. If different constructors could initialise in different orders, the destructor would not know which to reverse.",
        "So if you write the list in a different order from the declarations, the compiler quietly reorders it to match the declarations. If one member's initialiser reads another that has not been initialised yet, you read an indeterminate value.",
        "**`-Wreorder` catches this and is part of `-Wall`.** Take it seriously — it is one of the highest-signal warnings GCC and Clang produce.",
        "The habit that removes the problem entirely: **write the initialiser list in the same order as the declarations**, always.",
      ],
      examples: [
        {
          id: "reorder-bug",
          title: "The bug the ordering rule causes",
          lang: "cpp",
          code: `#include <iostream>

class Wrong {
public:
    Wrong(int n) : size_(n), data_(size_ * 2) {}   // declaration order is data_, size_!
    void show() const { std::cout << "size_=" << size_ << " data_=" << data_ << '\\n'; }
private:
    int data_;      // declared FIRST -> initialised FIRST
    int size_;      // declared second
};

int main() { Wrong w{5}; w.show(); }`,
          output: `warning: 'Wrong::size_' will be initialized after [-Wreorder]
    8 |     int size_;      // declared second
      |         ^~~~~
warning:   'int Wrong::data_' [-Wreorder]
    7 |     int data_;      // declared FIRST -> initialised FIRST
      |         ^~~~~
warning:   when initialized here [-Wreorder]

size_=5 data_=1559294150`,
          explanation:
            "**`data_` is garbage.** The list reads as though `size_` is set first, but `data_` is declared first so it is initialised first — reading `size_` before it has a value. The number will differ on every run and every machine, which is exactly what makes this kind of bug so hard to reproduce. The fix is either to reorder the declarations or, better, to not have one member's initialiser depend on another: `data_(n * 2), size_(n)`.",
        },
      ],
      pitfalls: [
        {
          title: "Base classes are initialised before any member",
          body: "In a derived class the base class subobject is constructed first, before every member, regardless of where it appears in the initialiser list — and it is destroyed last. This means a base class constructor cannot see any of the derived class's members, because none of them exist yet. It is also why calling a virtual function from a base constructor does not dispatch to the derived override: during base construction, the object *is* a base. Module 6 covers that properly.",
        },
      ],
    },
    {
      id: "default-members",
      heading: "Default member initialisers, and when to use which",
      body: [
        "Since C++11 you can give a member a value in the class definition itself: `int count_ = 0;` or `std::string name_{\"unknown\"};`. That value is used by any constructor that does not initialise the member in its list.",
        "The two mechanisms compose well, and the division of labour is clear.",
        "**Use a default member initialiser** when a member has a sensible default that most constructors want. It is written once, applies to every constructor including future ones, and means a newly added member cannot silently become garbage in the constructors that already exist.",
        "**Use the initialiser list** when the value comes from a constructor parameter or differs between constructors.",
        "The combination is the modern default: defaults in the class for everything that has one, and the list for what the caller supplies. It makes constructors shorter and removes a whole category of \"someone added a member and forgot one constructor\".",
      ],
      examples: [
        {
          id: "combined",
          title: "Defaults in the class, parameters in the list",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

class Server {
public:
    Server() = default;                                        // all defaults
    explicit Server(std::string host) : host_(std::move(host)) {}
    Server(std::string host, int port)
        : host_(std::move(host)), port_(port) {}

    void show() const {
        std::cout << host_ << ':' << port_
                  << " timeout=" << timeout_ms_
                  << " tls=" << std::boolalpha << tls_
                  << " tags=" << tags_.size() << '\\n';
    }

private:
    std::string              host_       = "localhost";
    int                      port_       = 8080;
    int                      timeout_ms_ = 30'000;
    bool                     tls_        = true;
    std::vector<std::string> tags_{};
};

int main() {
    Server a;
    Server b{"example.com"};
    Server c{"example.com", 443};
    a.show(); b.show(); c.show();
}`,
          output: `localhost:8080 timeout=30000 tls=true tags=0
example.com:8080 timeout=30000 tls=true tags=0
example.com:443 timeout=30000 tls=true tags=0`,
          explanation:
            "**Three constructors, and not one of them mentions `timeout_ms_`, `tls_` or `tags_`.** Adding a fourth constructor cannot forget them, and adding a fifth member with a default cannot break the existing three. Compare with the pre-C++11 alternative, where every one of those five members had to appear in every constructor's initialiser list — which is precisely how members end up uninitialised in the constructor nobody updated.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between initialising a member in the initialiser list and in the constructor body?",
      answer:
        "The list *constructs* the member with the value given. The body runs after every member is already constructed, so anything there is an *assignment* over an existing object — two operations instead of one. For an `int` the optimiser removes the difference; for a `std::string` or `std::vector` it is a real wasted construction and often a wasted allocation. It also means the object briefly holds a meaningless default value it was never supposed to have.",
    },
    {
      question: "Which members *must* be initialised in the initialiser list?",
      answer:
        "`const` members, because they can be initialised but never assigned. Reference members, because a reference is bound at creation and can never be rebound. And members of a type with no default constructor, because there is nothing to construct before the body runs. Base classes with no default constructor are the same case, and are initialised in the same list. In all of these, assignment in the body is not merely inefficient — it does not compile.",
    },
    {
      question: "In what order are members initialised?",
      answer:
        "In the order they are *declared* in the class, not the order written in the initialiser list — and base classes before any member. The reason is that the destructor must destroy in a fixed order, the reverse of construction, and a class has one destructor but may have many constructors, so the order cannot vary between them. If the list order differs, the compiler silently reorders to match the declarations, so an initialiser that reads another member may read an indeterminate value. `-Wreorder`, part of `-Wall`, catches it.",
    },
    {
      question: "When would you use a default member initialiser rather than the constructor's list?",
      answer:
        "When the member has a sensible default that most constructors want. It is written once in the class definition, applies to every constructor including ones added later, and means a newly added member cannot be silently left uninitialised by an existing constructor that nobody updated. Use the initialiser list for values that come from constructor parameters or genuinely differ between constructors. The two compose: defaults in the class, parameters in the list.",
    },
    {
      question: "Why can't a base class constructor call a derived class's virtual override?",
      answer:
        "Because base subobjects are constructed before any derived members exist. During base construction the object's dynamic type *is* the base, so a virtual call dispatches to the base's own version rather than the override — and if the function is pure virtual, the program calls `__cxa_pure_virtual` and terminates. The rule exists for safety: an override would otherwise run against derived members that have not been initialised yet. The same applies in reverse during destruction.",
    },
  ],
  takeaways: [
    "The initialiser list constructs; the constructor body assigns to something already constructed",
    "`const` members, reference members, and members with no default constructor *must* be in the list",
    "Members initialise in declaration order, not list order — because one destructor must reverse them all",
    "A member initialiser that reads a later-declared member reads garbage; `-Wreorder` catches it",
    "Always write the initialiser list in declaration order, so the question never arises",
    "Base classes are constructed before every member and destroyed after every member",
    "Default member initialisers apply to every constructor, including ones written later",
    "The modern combination: defaults in the class for what has one, the list for what the caller supplies",
  ],
  status: "available",
};
