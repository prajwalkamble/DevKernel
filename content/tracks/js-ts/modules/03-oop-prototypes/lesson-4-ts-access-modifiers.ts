import type { Lesson } from "@/content/types";

export const tsAccessModifiersLesson: Lesson = {
  id: "oop-prototypes-ts-access-modifiers",
  slug: "ts-access-modifiers",
  moduleSlug: "oop-prototypes",
  title: "TypeScript Access Modifiers: public, private, protected, readonly",
  summary:
    "TypeScript's compile-time visibility modifiers for class members, the crucial difference from JavaScript's runtime-enforced #private fields, the parameter properties shorthand, and readonly.",
  estimatedMinutes: 30,
  objectives: [
    "Use public, private, and protected correctly on class members",
    "Explain precisely how TypeScript's private differs from JavaScript's # private fields",
    "Use the constructor parameter properties shorthand",
    "Use readonly to prevent reassignment after construction",
  ],
  sections: [
    {
      id: "public-private-protected",
      heading: "The three visibility modifiers",
      body: [
        "TypeScript adds three access modifiers you can put in front of any class field or method: `public` (the default — accessible from anywhere), `private` (accessible only inside the declaring class itself), and `protected` (accessible inside the declaring class **and** any subclasses, but not from outside the hierarchy).",
      ],
      examples: [
        {
          id: "modifiers-example",
          title: "public, private, and protected in action",
          ts: `class Account {
  public accountHolder: string; // explicit public — same as omitting a modifier
  private balance: number;
  protected accountNumber: string;

  constructor(accountHolder: string, balance: number, accountNumber: string) {
    this.accountHolder = accountHolder;
    this.balance = balance;
    this.accountNumber = accountNumber;
  }

  private logTransaction(message: string) {
    console.log(\`[\${this.accountNumber}] \${message}\`);
  }

  deposit(amount: number) {
    this.balance += amount;
    this.logTransaction(\`Deposited \${amount}\`); // OK — called from inside the class
  }
}

class SavingsAccount extends Account {
  addInterest(rate: number) {
    console.log(this.accountNumber); // OK — protected is visible to subclasses
    // console.log(this.balance);    // Error — private is NOT visible to subclasses
  }
}

const acc = new Account("Ada", 100, "ACC-001");
acc.deposit(50);          // OK — public method
console.log(acc.accountHolder); // OK — public field
console.log(acc.balance);
// Error: Property 'balance' is private and only accessible within class 'Account'.
console.log(acc.accountNumber);
// Error: Property 'accountNumber' is protected and only accessible within class 'Account' and its subclasses.`,
        },
      ],
    },
    {
      id: "ts-private-vs-js-private",
      heading: "TypeScript private vs JavaScript's # private — a critical difference",
      body: [
        "This distinction trips up almost everyone at first: TypeScript's `private` keyword is a **compile-time-only** restriction. It's checked by the TypeScript compiler and disappears completely from the emitted JavaScript — at runtime, a TypeScript-`private` field is a perfectly ordinary, fully accessible JavaScript property. JavaScript's native `#field` syntax (from the previous lesson) is enforced by the **JavaScript engine itself, at runtime**, and remains genuinely inaccessible even after compilation, even from plain JavaScript code, even via bracket-notation tricks.",
        "In short: TypeScript `private` stops *your teammates* (and your own future self) from accidentally misusing a field, caught while coding. It does **not** stop determined or malicious runtime code from reading it. `#private` fields stop everyone, always, at runtime.",
      ],
      examples: [
        {
          id: "private-vs-hash-example",
          title: "Compile-time restriction vs true runtime enforcement",
          ts: `class WithTsPrivate {
  private secret = "ts-private";
}

class WithHashPrivate {
  #secret = "hash-private";
}

const a = new WithTsPrivate();
console.log(a.secret);
// Compile-time error: Property 'secret' is private...
// BUT if you bypass the type checker (e.g. (a as any).secret, or plain JS calling this
// compiled output), the value IS readable — it's just a normal property at runtime.
console.log((a as any).secret); // "ts-private" — works! Not actually protected at runtime.

const b = new WithHashPrivate();
console.log((b as any).secret);
// Still a compile/runtime error either way — #secret genuinely does not exist
// as an accessible property under any name; the engine itself enforces this.`,
          explanation:
            "This is exactly why modern TypeScript style guides increasingly recommend using JavaScript's native `#private` fields instead of the `private` keyword when you need *real* encapsulation — reserve TypeScript's `private`/`protected`/`public` for expressing your intended API surface to other developers, not for security or true data hiding.",
        },
      ],
      pitfalls: [
        {
          title: "\"private\" in TypeScript is a documentation and tooling aid, not a security boundary",
          body: "Never rely on TypeScript's private/protected to keep sensitive data (tokens, secrets) truly inaccessible in code whose compiled JavaScript output might run in an untrusted context. It only prevents accidental misuse during development, fully enforced only by the compiler — not the runtime.",
        },
      ],
    },
    {
      id: "parameter-properties",
      heading: "Parameter properties: a constructor shorthand",
      body: [
        "Writing `constructor(name: string) { this.name = name; }` for every field is repetitive. TypeScript offers a shorthand: adding an access modifier directly to a constructor parameter automatically declares a matching class field **and** assigns it, eliminating the boilerplate.",
      ],
      examples: [
        {
          id: "parameter-properties-example",
          title: "Before and after the parameter properties shorthand",
          ts: `// Without the shorthand
class PersonVerbose {
  private name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// With the shorthand — identical behavior, far less code
class Person {
  constructor(
    private name: string,
    public age: number,
    readonly id: string
  ) {}
  // name, age, and id are automatically declared as fields AND assigned
}

const p = new Person("Ada", 36, "P-001");
console.log(p.age); // OK — public
console.log(p.id);  // OK — readonly, still readable
p.id = "P-002";
// Error: Cannot assign to 'id' because it is a read-only property.`,
          explanation:
            "Any constructor parameter prefixed with `public`, `private`, `protected`, or `readonly` becomes a parameter property. This shorthand is extremely common in real-world TypeScript codebases — it's worth being able to read fluently even if you don't always use it yourself.",
        },
      ],
    },
    {
      id: "readonly",
      heading: "readonly: preventing reassignment after construction",
      body: [
        "`readonly` (usable independently of the public/private/protected modifiers, and also usable on plain object type properties, not just classes) means a field can be assigned once — typically in the constructor — and never reassigned afterward. Like TypeScript's `private`, this is a **compile-time-only** check; it does not freeze the value at runtime the way `Object.freeze()` does, and it only prevents *reassigning* the field, not mutating an object or array the field holds (the same distinction `const` has, from Module 1).",
      ],
      examples: [
        {
          id: "readonly-example",
          title: "readonly on a class field and a plain object type",
          ts: `class Config {
  readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl; // OK — first assignment, inside the constructor
  }

  updateUrl(newUrl: string) {
    this.apiUrl = newUrl;
    // Error: Cannot assign to 'apiUrl' because it is a read-only property.
  }
}

interface Point {
  readonly x: number;
  readonly y: number;
}

const origin: Point = { x: 0, y: 0 };
origin.x = 5;
// Error: Cannot assign to 'x' because it is a read-only property.`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the three TypeScript access modifiers, and what does each one restrict?",
      answer:
        "public (the default) is accessible from anywhere. private is accessible only inside the declaring class itself, not subclasses or outside code. protected is accessible inside the declaring class and any of its subclasses, but not from code outside the class hierarchy.",
    },
    {
      question: "What is the critical difference between TypeScript's private keyword and JavaScript's native #field syntax?",
      answer:
        "TypeScript's private is a compile-time-only check performed by the type checker — it's completely erased from the emitted JavaScript, so at runtime the field is a perfectly ordinary, accessible property (bypassable via 'as any' or plain JS). JavaScript's #field syntax is enforced by the JavaScript engine itself at runtime, making the field genuinely, permanently inaccessible from outside the class under any circumstances.",
    },
    {
      question: "What does the parameter properties shorthand do?",
      answer:
        "Adding an access modifier (public, private, protected, or readonly) directly to a constructor parameter automatically declares a class field with that name and modifier, and assigns the parameter's value to it — eliminating the need to separately declare the field and write 'this.field = field' in the constructor body.",
    },
    {
      question: "Does TypeScript's readonly modifier prevent mutating an object held by that field?",
      answer:
        "No. readonly only prevents reassigning the field itself to a new value after its initial assignment (usually in the constructor). If the field holds an object or array, readonly does not stop you from mutating that object's own properties or the array's contents — the same distinction as const for variables.",
    },
    {
      question: "Should you rely on TypeScript's private modifier to protect genuinely sensitive data at runtime?",
      answer:
        "No. Because private is erased at compile time and unenforced at runtime, sensitive data typed as private is still a normal, readable JavaScript property once compiled — accessible via a type assertion or from plain JavaScript code calling into it. For real runtime-enforced privacy, use JavaScript's native #private fields instead.",
    },
  ],
  takeaways: [
    "public (default), private, and protected control compile-time visibility: everywhere, the declaring class only, or the class plus subclasses.",
    "TypeScript's private is erased at compile time and unenforced at runtime — it's a development-time aid, not real encapsulation. Use #private for genuine runtime privacy.",
    "The parameter properties shorthand (a modifier directly on a constructor parameter) auto-declares and assigns a field, cutting constructor boilerplate.",
    "readonly allows one assignment (typically in the constructor) and blocks reassignment afterward — but like const, it doesn't prevent mutating the value itself.",
  ],
  status: "available",
};
