import type { Lesson } from "@/content/types";

export const valueCategoriesLesson: Lesson = {
  id: "cpp-value-categories",
  slug: "value-categories",
  moduleSlug: "copy-move-rule-of-five",
  title: "Value Categories: lvalue, prvalue & xvalue",
  summary:
    "The vocabulary the rest of the module needs. Every expression in C++ has a value category, it decides which overload is selected, and the whole thing reduces to two questions you can answer by eye.",
  estimatedMinutes: 30,
  objectives: [
    "Classify any expression as an lvalue, prvalue or xvalue",
    "Answer the two questions that determine a category",
    "Predict which of `T&`, `const T&` and `T&&` an argument binds to",
    "Explain why a named `T&&` parameter is itself an lvalue",
    "Use `decltype` to check a category when you are unsure",
  ],
  sections: [
    {
      id: "why",
      heading: "Why this matters",
      body: [
        "The point of the next lesson is that a value nobody will use again can be **stolen from** rather than copied. That requires the compiler to know which values those are — and value categories are how it knows.",
        "Every expression in C++ has both a **type** and a **value category**. The type is `std::string`; the category is whether the expression names a durable object or a temporary about to disappear.",
        "The formal taxonomy has five names and reads like tax law. **You only need three**, and they follow from two questions.",
        "**Does it have an identity?** Can you take its address or refer to it again? A named variable does. The result of `a + b` does not.",
        "**Can it be moved from?** Is it safe to steal its contents, because nothing will use it afterwards?",
      ],
      examples: [
        {
          id: "three-categories",
          title: "The three categories as a table",
          lang: "bash",
          code: `                     identity?   movable?    what it is

  lvalue                yes         no        a named object you will use again
  prvalue               no          yes       a temporary; nothing else refers to it
  xvalue                yes         yes       a named object you PROMISED not to reuse

  Examples:

  lvalue    x                  a named variable
            *ptr               dereference: names the pointed-to object
            arr[0]             subscript
            obj.member         member of an lvalue
            "literal"          string literals are arrays -- and arrays are lvalues!
            f()  where f returns T&

  prvalue   42                 a literal (except string literals)
            a + b              result of arithmetic
            make()             a function returning by value
            std::string{"x"}   a temporary you constructed

  xvalue    std::move(x)       an lvalue you cast to say "take it"
            make().member      member of a temporary
            f()  where f returns T&&`,
          explanation:
            "**The two umbrella terms exist for the two questions.** *glvalue* = has identity (lvalue or xvalue). *rvalue* = movable (prvalue or xvalue) — and that is the one that matters, because `T&&` binds to rvalues, meaning \"either a temporary, or something you explicitly said you were finished with\". The historical names come from assignment: **l**eft-hand side and **r**ight-hand side. That mnemonic is no longer accurate — `const int x` is an lvalue you cannot assign to — but it explains the letters.",
        },
      ],
    },
    {
      id: "binding",
      heading: "What binds to what",
      body: [
        "The practical payoff is a table of three reference types and what each accepts.",
        "**`T&`** — a non-const lvalue reference. Binds only to **modifiable lvalues**. Will not bind to a temporary, deliberately: modifying something about to be destroyed is nearly always a mistake, so the language rejects it.",
        "**`const T&`** — binds to **everything**: lvalues, const lvalues, prvalues, xvalues. This is why it is the default for read-only parameters. Binding to a temporary also extends that temporary's lifetime to match the reference.",
        "**`T&&`** — an rvalue reference. Binds only to **rvalues** — prvalues and xvalues. This is the signal \"nobody else needs this, you may take its contents\".",
        "When both `const T&` and `T&&` overloads exist, an rvalue argument prefers `T&&` — which is exactly the mechanism that makes move constructors get selected automatically.",
      ],
      examples: [
        {
          id: "binding-demo",
          title: "Each reference type, and what reaches it",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>

void takes_lvalue_ref(std::string&)      { std::cout << "  T&        (modifiable lvalue)\\n"; }
void takes_const_ref(const std::string&) { std::cout << "  const T&  (anything)\\n"; }
void takes_rvalue_ref(std::string&&)     { std::cout << "  T&&       (rvalue: safe to steal)\\n"; }

std::string make() { return "temporary"; }

int main() {
    std::string named = "named";
    const std::string frozen = "frozen";

    std::cout << "named:\\n";            takes_lvalue_ref(named);
    std::cout << "frozen:\\n";           takes_const_ref(frozen);
    std::cout << "make():\\n";           takes_rvalue_ref(make());
    std::cout << "literal:\\n";          takes_rvalue_ref(std::string{"lit"});
    std::cout << "std::move(named):\\n"; takes_rvalue_ref(std::move(named));

    // takes_lvalue_ref(make());        // ERROR: T& will not bind to a temporary
    // takes_rvalue_ref(named);         // ERROR: T&& will not bind to an lvalue
}`,
          output: `named:
  T&        (modifiable lvalue)
frozen:
  const T&  (anything)
make():
  T&&       (rvalue: safe to steal)
literal:
  T&&       (rvalue: safe to steal)
std::move(named):
  T&&       (rvalue: safe to steal)`,
          explanation:
            "The two commented lines are the boundaries. **`T&` refuses a temporary**, which is what stops you writing a function that appears to modify its argument but modifies something about to vanish. **`T&&` refuses a named lvalue**, which is what stops you accidentally stealing from a variable the caller still intends to use — you have to say `std::move` and take responsibility.",
        },
      ],
      pitfalls: [
        {
          title: "A named `T&&` parameter is an lvalue inside the function",
          body: "This is the single most confusing rule in the area, and it is deliberate. In `void sink(std::string&& s)`, the *parameter* `s` has a name, so any use of `s` in the body is an **lvalue** expression — even though its type is an rvalue reference. If you pass `s` on to something else it will be copied, not moved. To keep the moveability you must write `std::move(s)` again. The rule exists to protect you: without it, the first use of `s` would silently gut it and the second would see an empty object.",
        },
      ],
    },
    {
      id: "checking",
      heading: "Checking a category when you are unsure",
      body: [
        "`decltype` has a quirk that turns it into a category detector. Given an *expression* wrapped in an extra set of parentheses, `decltype((expr))` yields `T&` for an lvalue, `T&&` for an xvalue, and plain `T` for a prvalue.",
        "That is enough to write a small diagnostic you can drop into any file when a category question comes up.",
      ],
      examples: [
        {
          id: "category-detector",
          title: "A detector, and nine expressions through it",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

// decltype((expr)) reports the value category:
//   T -> prvalue,  T& -> lvalue,  T&& -> xvalue
#define CATEGORY(expr)                                          \\
    (std::is_lvalue_reference_v<decltype((expr))> ? "lvalue"    \\
     : std::is_rvalue_reference_v<decltype((expr))> ? "xvalue"  \\
     : "prvalue")

std::string make() { return "temp"; }
struct S { int m; };

int main() {
    std::string s = "hi";
    S obj{1};
    int arr[3]{};

    std::cout << "s              : " << CATEGORY(s) << '\\n';
    std::cout << "make()         : " << CATEGORY(make()) << '\\n';
    std::cout << "std::move(s)   : " << CATEGORY(std::move(s)) << '\\n';
    std::cout << "42             : " << CATEGORY(42) << '\\n';
    std::cout << "s + \\"!\\"        : " << CATEGORY(s + "!") << '\\n';
    std::cout << "obj.m          : " << CATEGORY(obj.m) << '\\n';
    std::cout << "make().size()  : " << CATEGORY(make().size()) << '\\n';
    std::cout << "arr[0]         : " << CATEGORY(arr[0]) << '\\n';
    std::cout << "\\"literal\\"      : " << CATEGORY("literal") << '\\n';
}`,
          output: `s              : lvalue
make()         : prvalue
std::move(s)   : xvalue
42             : prvalue
s + "!"        : prvalue
obj.m          : lvalue
make().size()  : prvalue
arr[0]         : lvalue
"literal"      : lvalue`,
          explanation:
            "**The last line is the surprise: a string literal is an lvalue.** `\"literal\"` has type `const char[8]` — it is an array object with static storage duration that exists for the whole program, so it has identity and an address. Every other literal (`42`, `3.14`, `true`) is a prvalue. Also note `make().size()` is a prvalue while `make().member` would be an **xvalue**: a member of a temporary inherits the temporary's moveability, but a function returning by value does not.",
        },
      ],
    },
    {
      id: "practical",
      heading: "What this buys you in practice",
      body: [
        "Three concrete things follow from all of this, and they are what you actually use it for.",
        "**Move constructors get selected automatically.** When both `T(const T&)` and `T(T&&)` exist, an rvalue argument prefers the second. So returning a local by value, or constructing from a temporary, moves rather than copies without you writing anything at the call site.",
        "**`const T&` is the right default parameter type** precisely because it binds to every category, so one overload serves all callers.",
        "**Overloading on category is a real tuning technique.** A setter can take `const std::string&` and copy, or `std::string&&` and move — providing both lets a caller pass a temporary without a copy. Where that gets tedious, the sink-parameter idiom in lesson 4 collapses the two into one.",
      ],
      examples: [
        {
          id: "overload-on-category",
          title: "One function, two overloads, no wasted copy",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <utility>
#include <vector>

class Message {
public:
    // Called with an lvalue: we must copy, because the caller keeps theirs.
    void set_body(const std::string& body) {
        body_ = body;
        std::cout << "  copied\\n";
    }
    // Called with an rvalue: nobody else needs it, so steal it.
    void set_body(std::string&& body) {
        body_ = std::move(body);
        std::cout << "  moved\\n";
    }
    const std::string& body() const { return body_; }
private:
    std::string body_;
};

std::string build() { return std::string(100, 'x'); }

int main() {
    Message m;
    std::string keep = "I still need this";

    std::cout << "lvalue argument:\\n";  m.set_body(keep);
    std::cout << "temporary:\\n";        m.set_body(build());
    std::cout << "explicit move:\\n";    m.set_body(std::move(keep));

    std::cout << "keep is now: '" << keep << "'\\n";
    std::cout << "body size: " << m.body().size() << '\\n';
}`,
          output: `lvalue argument:
  copied
temporary:
  moved
explicit move:
  moved
keep is now: ''
body size: 17`,
          explanation:
            "**The compiler chose correctly three times with no annotation at the call site**, except where the caller explicitly opted in with `std::move`. Note the final state: `keep` is empty because the third call stole from it, and the body is the 17-character string it took — the moved-from `std::string` is valid and empty. That last point is the subject of lesson 4.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the value categories in C++ and how do you tell them apart?",
      answer:
        "Two questions decide it: does the expression have identity — can you take its address or refer to it again — and can it be moved from. An lvalue has identity and is not movable: a named variable, `*ptr`, `arr[0]`. A prvalue has no identity and is movable: a literal, the result of arithmetic, a function returning by value. An xvalue has both: `std::move(x)`, or a member of a temporary. The umbrella term *rvalue* covers prvalue and xvalue — the movable ones — and that is what `T&&` binds to.",
    },
    {
      question: "Which reference types bind to which categories?",
      answer:
        "`T&` binds only to modifiable lvalues; it deliberately refuses temporaries, since modifying something about to be destroyed is almost always a mistake. `const T&` binds to everything, which is why it is the default for read-only parameters, and binding it to a temporary extends that temporary's lifetime. `T&&` binds only to rvalues — prvalues and xvalues — signalling that the contents may be stolen. When both `const T&` and `T&&` overloads exist, an rvalue prefers `T&&`, which is how move constructors get selected automatically.",
    },
    {
      question: "Why is a named `T&&` parameter an lvalue inside the function?",
      answer:
        "Because it has a name, and anything you can name and refer to again has identity. So in `void sink(std::string&& s)`, using `s` in the body is an lvalue expression despite its declared type, and passing it on will copy rather than move — you must write `std::move(s)` again to preserve moveability. The rule is protective: if `s` were an rvalue throughout, the first use would silently gut it and every later use would see an empty object.",
    },
    {
      question: "Is a string literal an lvalue or an rvalue?",
      answer:
        "An lvalue. `\"literal\"` has type `const char[8]` — it is an array object with static storage duration that exists for the entire program, so it has an address and identity. This surprises people because every other literal, `42` or `3.14` or `true`, is a prvalue. It is also why `const char*` and `std::string` overloads interact the way they do, and part of why array-to-pointer decay applies to it.",
    },
    {
      question: "Why would you overload a function on value category?",
      answer:
        "To avoid a copy the caller does not need. A setter taking `const std::string&` must copy, because the caller keeps their object; one taking `std::string&&` can move, because the argument is a temporary or explicitly relinquished. Providing both means a caller passing a temporary pays nothing extra. The cost is two near-identical overloads, which multiplies with parameter count — the sink-parameter idiom, taking the argument by value and moving from it, collapses them into one at the price of one extra move.",
    },
  ],
  takeaways: [
    "Two questions decide everything: does it have identity, and can it be moved from",
    "lvalue = identity, not movable; prvalue = no identity, movable; xvalue = both",
    "*rvalue* means movable — prvalue or xvalue — and that is what `T&&` binds to",
    "`T&` refuses temporaries; `const T&` accepts everything; `T&&` accepts only rvalues",
    "A named `T&&` parameter is an **lvalue** in the body — you must `std::move` it again to pass it on",
    "String literals are lvalues, because they are arrays with static storage duration",
    "`decltype((expr))` yields `T&` for lvalue, `T&&` for xvalue, `T` for prvalue — a usable detector",
    "Overloading on `const T&` and `T&&` avoids a copy for callers passing temporaries",
  ],
  status: "available",
};
