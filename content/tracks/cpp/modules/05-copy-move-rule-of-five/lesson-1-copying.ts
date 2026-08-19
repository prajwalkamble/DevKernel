import type { Lesson } from "@/content/types";

export const copyingLesson: Lesson = {
  id: "cpp-copying",
  slug: "copy-constructor-and-assignment",
  moduleSlug: "copy-move-rule-of-five",
  title: "The Copy Constructor & Copy Assignment",
  summary:
    "What happens when you write `b = a`. The compiler-generated copy, why it is exactly right for a class of `std::string` members and catastrophically wrong for one holding a raw pointer, and how to write a deep copy that survives self-assignment.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish the copy constructor from copy assignment and know which runs when",
    "Explain what the compiler-generated copy does",
    "Recognise a shallow copy and the double free it causes",
    "Write a correct deep copy, including the self-assignment guard",
    "Explain why the allocation must precede the deallocation",
  ],
  sections: [
    {
      id: "two-operations",
      heading: "Two operations, not one",
      body: [
        "C++ has two distinct copying operations, and confusing them is the source of a lot of subtle code.",
        "**The copy constructor** — `T(const T& other)` — builds a *new* object from an existing one. It runs when you write `T b = a;`, `T b{a};`, pass by value, or return by value without elision.",
        "**Copy assignment** — `T& operator=(const T& other)` — replaces the contents of an object that **already exists**. It runs when you write `b = a;` where `b` was constructed earlier.",
        "The distinction matters because they have genuinely different jobs. A copy constructor starts with raw memory: nothing to clean up, everything to build. Copy assignment starts with a live object holding resources, so it must release the old ones before or while taking on the new — and it must survive being handed itself.",
        "**The syntax is misleading.** `T b = a;` contains an `=` and calls the *constructor*, not the assignment operator, because `b` is being created at that point. This trips everyone up once.",
      ],
      examples: [
        {
          id: "generated-copy",
          title: "The compiler-generated copy, which is usually right",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

struct Person {
    std::string name;
    int age{};
    std::vector<std::string> tags;
};

int main() {
    Person a{"Ada", 36, {"maths", "computing"}};

    Person b = a;              // copy constructor
    Person c;
    c = a;                     // copy assignment

    b.name = "Grace";
    b.tags.push_back("navy");

    std::cout << a.name << ' ' << a.tags.size() << '\\n';
    std::cout << b.name << ' ' << b.tags.size() << '\\n';
    std::cout << c.name << ' ' << c.tags.size() << '\\n';
}`,
          output: `Ada 2
Grace 3
Ada 2`,
          explanation:
            "**`Person` declares none of the copying operations and behaves perfectly.** The compiler generates both, and each copies every member using that member's own copy operation — so `std::string` deep-copies its text and `std::vector` deep-copies its elements. Modifying `b` left `a` untouched. **This is the rule of zero**, and it is the situation you should aim for: when every member manages itself, you write nothing.",
        },
      ],
    },
    {
      id: "shallow",
      heading: "Where the generated copy goes wrong",
      body: [
        "The generated copy copies each member. For a `std::string` member that means a deep copy, because that is what `std::string`'s own copy constructor does.",
        "**For a raw pointer member, copying the member means copying the address.** Both objects now point at the same buffer, and neither knows about the other.",
        "The consequences arrive in order: writing through one is visible through the other, the first destructor frees the buffer leaving the second dangling, and the second destructor frees it again. **Use-after-free followed by double free**, both from module 3.",
        "This is called a **shallow copy**, and it is the single most common reason a class needs to declare its own copy operations.",
      ],
      examples: [
        {
          id: "shallow-copy-disaster",
          title: "A shallow copy, run",
          lang: "cpp",
          code: `#include <cstring>
#include <iostream>

// BROKEN: the generated copy duplicates the pointer, not the buffer.
class BadString {
public:
    explicit BadString(const char* text)
        : size_(std::strlen(text)), data_(new char[size_ + 1]) {
        std::memcpy(data_, text, size_ + 1);
    }
    ~BadString() { delete[] data_; }
    const char* c_str() const { return data_; }
private:
    std::size_t size_;
    char* data_;
};

int main() {
    BadString a{"hello"};
    {
        BadString b = a;             // shallow copy: both point at the same buffer
        std::cout << b.c_str() << '\\n';
    }                                // b's destructor frees the buffer
    std::cout << a.c_str() << '\\n';  // a now points at freed memory
}                                    // a's destructor frees it AGAIN`,
          output: `$ ./bad
free(): double free detected in tcache 2
Aborted (core dumped)          # exit status 134

$ ./bad > out.txt              # and out.txt is EMPTY

$ g++ -fsanitize=address ...   # what actually went wrong first
ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
READ of size 2 at 0x502000000010 thread T0
    #0 in strlen
    #1 in std::operator<<(std::ostream&, char const*)`,
          explanation:
            "**Note that `out.txt` is completely empty** despite two `std::cout` statements. Standard output is buffered, the process aborted before anything flushed, and every line was lost — which is exactly why module 1 said to put diagnostics on the unbuffered `std::cerr`. And notice the sanitizer caught the **use-after-free**, one statement *earlier* than the double free the runtime noticed. The first symptom you see is rarely the first thing that went wrong.",
        },
      ],
    },
    {
      id: "deep-copy",
      heading: "Writing a deep copy",
      body: [
        "The fix is to give each object its own buffer. Two functions, and the second is harder than it looks.",
        "**The copy constructor** allocates a new buffer and copies the contents into it. There is no old state to release, so this one is straightforward.",
        "**Copy assignment** has three obligations, and skipping any of them is a bug.",
        "**Guard against self-assignment.** `c = c` looks absurd but arises through references and aliased pointers — `*p = *q` where both point at the same object. Without a guard, a naive implementation frees its own buffer and then copies from the memory it just released.",
        "**Allocate before you deallocate.** If `new` throws after you have already freed the old buffer, the object is left holding a dangling pointer and its destructor will free it again. Allocating first means a failure leaves the object completely unchanged — the *strong exception guarantee* from module 10.",
        "**Return `*this` by reference**, so chained assignment `a = b = c` works, matching the built-in types.",
      ],
      examples: [
        {
          id: "deep-copy-correct",
          title: "Both operations, done properly",
          lang: "cpp",
          code: `#include <cstring>
#include <iostream>

class String {
public:
    explicit String(const char* text)
        : size_(std::strlen(text)), data_(new char[size_ + 1]) {
        std::memcpy(data_, text, size_ + 1);
        std::cout << "  ctor  " << data_ << '\\n';
    }

    // Copy constructor: allocate our own buffer and copy the contents.
    String(const String& other)
        : size_(other.size_), data_(new char[other.size_ + 1]) {
        std::memcpy(data_, other.data_, size_ + 1);
        std::cout << "  copy  " << data_ << '\\n';
    }

    // Copy assignment: handle self-assignment, then replace.
    String& operator=(const String& other) {
        std::cout << "  assign " << other.data_ << '\\n';
        if (this == &other) return *this;            // self-assignment guard
        char* fresh = new char[other.size_ + 1];     // allocate BEFORE freeing
        std::memcpy(fresh, other.data_, other.size_ + 1);
        delete[] data_;
        data_ = fresh;
        size_ = other.size_;
        return *this;
    }

    ~String() { std::cout << "  dtor  " << data_ << '\\n'; delete[] data_; }

    const char* c_str() const { return data_; }

private:
    std::size_t size_;
    char*       data_;
};

int main() {
    String a{"hello"};
    { String b = a; std::cout << "b = " << b.c_str() << '\\n'; }
    std::cout << "a still = " << a.c_str() << '\\n';

    String c{"x"};
    c = a;
    std::cout << "c = " << c.c_str() << '\\n';

    c = c;                            // self-assignment
    std::cout << "c after self-assign = " << c.c_str() << '\\n';
}`,
          output: `  ctor  hello
  copy  hello
b = hello
  dtor  hello
a still = hello
  ctor  x
  assign hello
c = hello
  assign hello
c after self-assign = hello
  dtor  hello
  dtor  hello`,
          explanation:
            "**Clean under AddressSanitizer with no errors and no leaks.** `b`'s destructor freed only `b`'s buffer, so `a` survived. The self-assignment returned early and left `c` intact. Note the ordering inside `operator=`: `fresh` is allocated and filled *before* `delete[] data_` runs, so a throwing `new` would leave the object exactly as it was.",
        },
      ],
      pitfalls: [
        {
          title: "The self-assignment guard is not optional, and the copy-and-swap idiom removes the need for it",
          body: "Without `if (this == &other)`, a naive `delete[] data_; data_ = new char[other.size_]; memcpy(data_, other.data_, ...)` frees `other.data_` — because it *is* `data_` — and then copies from freed memory. Lesson 7 shows the copy-and-swap idiom, which takes its parameter by value and swaps, making self-assignment harmless without an explicit check and giving the strong exception guarantee for free. It is the better default once you have seen why.",
        },
      ],
    },
    {
      id: "controlling",
      heading: "Suppressing or restoring the copy",
      body: [
        "You do not always want a copy to exist. Three ways to control it.",
        "**`= delete`** removes the operation. Calling it is a compile error at the call site. This is right for types where copying is meaningless — a mutex, a file handle, a thread, a network connection, and anything owning a unique resource. `std::unique_ptr` and `std::mutex` both do this.",
        "**`= default`** asks for the compiler's version explicitly. Useful when you have declared a move operation, which suppresses the implicit copy, and you want the copy back.",
        "**Writing your own** is necessary only when member-wise copying is wrong — essentially, when the class holds a raw owning pointer or another resource handle.",
        "There is a fourth option that is usually the best one: **do not hold the raw resource at all.** Replace the `char*` with a `std::string`, the `T*` with a `std::unique_ptr<T>` or `std::vector<T>`, and the correct copy operations come back for free. That is the rule of zero, and lesson 5 makes the case for it properly.",
      ],
      examples: [
        {
          id: "delete-copy",
          title: "Three classes, three different copy policies",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

// 1. Rule of zero: members handle it. Copyable and movable, nothing declared.
struct Config {
    std::string              path;
    std::vector<std::string> flags;
};

// 2. Non-copyable: a unique resource. Copying would mean two owners.
class Connection {
public:
    explicit Connection(std::string host) : host_(std::move(host)) {}
    Connection(const Connection&)            = delete;
    Connection& operator=(const Connection&) = delete;
    const std::string& host() const { return host_; }
private:
    std::string host_;
};

// 3. Copyable, but the copy means something specific: a fresh, independent id.
class Document {
public:
    explicit Document(std::string title) : title_(std::move(title)), id_(++next_id_) {}
    Document(const Document& other) : title_(other.title_ + " (copy)"), id_(++next_id_) {}
    Document& operator=(const Document&) = default;

    void show() const { std::cout << "  #" << id_ << ' ' << title_ << '\\n'; }
private:
    std::string title_;
    int         id_;
    static inline int next_id_ = 0;
};

int main() {
    Config a{"/etc/app.conf", {"-v"}};
    Config b = a;                       // fine
    std::cout << b.path << ' ' << b.flags.size() << '\\n';

    Connection c{"db.internal"};
    // Connection d = c;                // ERROR: use of deleted function
    std::cout << c.host() << '\\n';

    Document doc{"report"};
    Document dup = doc;                 // custom copy: new id, marked title
    doc.show();
    dup.show();
}`,
          output: `/etc/app.conf 1
db.internal
  #1 report
  #2 report (copy)`,
          explanation:
            "**Three valid answers to \"what does copying mean here?\"** `Config` copies member-wise. `Connection` says copying is meaningless and makes it a compile error. `Document` says a copy is a *new document*, so it gets a fresh id and a marked title — which is a reminder that the copy constructor is yours to define, and it does not have to mean bitwise duplication.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between the copy constructor and copy assignment?",
      answer:
        "The copy constructor builds a new object from an existing one, so it starts with raw memory — nothing to release, everything to construct. Copy assignment replaces the contents of an object that already exists, so it must release its current resources and take on new ones, and it must survive being handed itself. `T b = a;` calls the *constructor* despite the `=`, because `b` is being created at that point; `b = a;` on an already-constructed `b` calls assignment.",
    },
    {
      question: "What does the compiler-generated copy constructor do, and when is it wrong?",
      answer:
        "It copies each member using that member's own copy constructor, which is exactly right when every member manages itself — `std::string` deep-copies its text, `std::vector` its elements. It is wrong when a member is a raw owning pointer, because copying the member copies the *address*: both objects then point at the same buffer, so writes are shared, the first destructor leaves the second dangling, and the second frees it again. That is a shallow copy, and it produces a use-after-free followed by a double free.",
    },
    {
      question: "Why does copy assignment need a self-assignment check?",
      answer:
        "Because `a = a` arises in practice through references and aliased pointers — `*p = *q` where both point at the same object. A naive implementation that frees its buffer and then copies from `other` is copying from the memory it just released. `if (this == &other) return *this;` fixes it. The copy-and-swap idiom removes the need for the check entirely, by taking the parameter by value and swapping, which also gives the strong exception guarantee.",
    },
    {
      question: "Why should copy assignment allocate before it deallocates?",
      answer:
        "So a failed allocation leaves the object unchanged. If you free the old buffer first and the subsequent `new` throws, the object is left holding a dangling pointer that its destructor will free again — a corrupted object produced by an exception. Allocating into a temporary first, then swapping in and releasing the old, means any failure happens before the object is modified at all. That is the strong exception guarantee, and it is the reason for the ordering in every correct implementation.",
    },
    {
      question: "How do you make a type non-copyable, and when should you?",
      answer:
        "Declare both copy operations `= delete`, which makes any attempt a compile error at the call site. Do it when copying is meaningless or dangerous — a mutex, a file handle, a thread, a socket, anything owning a unique resource — which is why `std::unique_ptr`, `std::mutex` and `std::thread` all do exactly this. The alternative worth considering first is not holding the raw resource at all: replace the pointer with a `std::unique_ptr` or a container and the correct operations come back automatically.",
    },
  ],
  takeaways: [
    "`T b = a;` calls the copy *constructor*; `b = a;` on an existing `b` calls copy *assignment*",
    "The generated copy copies member-wise, which is right whenever every member manages itself",
    "Copying a raw pointer member copies the address — shallow copy, then use-after-free, then double free",
    "A crashed program loses all buffered `std::cout` output, which is why diagnostics belong on `std::cerr`",
    "Copy assignment must guard self-assignment, allocate before deallocating, and return `*this` by reference",
    "The sanitizer reports the use-after-free one statement before the runtime notices the double free",
    "`= delete` the copy operations for unique resources; `= default` restores them when a move declaration suppressed them",
    "Better than any of this: hold a `std::string`, `std::vector` or `unique_ptr` and write none of it",
  ],
  status: "available",
};
