import type { Lesson } from "@/content/types";

export const thisLesson: Lesson = {
  id: "functions-scope-this",
  slug: "this-in-depth",
  moduleSlug: "functions-scope",
  title: "this In Depth",
  summary:
    "The four rules that determine what `this` refers to in a regular function, the precedence order between them, why arrow functions are different, and how TypeScript can type-check `this` usage.",
  estimatedMinutes: 30,
  objectives: [
    "State all four binding rules for `this` in a regular function",
    "Determine what `this` refers to in any given function call, using the precedence order",
    "Explain why arrow functions don't follow these rules at all",
    "Use TypeScript's explicit this parameter to catch this-related bugs at compile time",
  ],
  sections: [
    {
      id: "this-is-about-call-site",
      heading: "this is determined by the call-site, not the definition-site",
      body: [
        "The single most important fact about `this` in a regular function: its value is determined **entirely by how the function is called**, not by where or how it was defined. The exact same function can have a completely different `this` on every call, depending on the syntax used to call it. There are four rules that cover every case, and they have a strict precedence order when more than one could apply.",
      ],
    },
    {
      id: "default-binding",
      heading: "Rule 1: Default binding (a bare function call)",
      body: [
        "When a function is called with no context at all — just `foo()` — `this` defaults to `undefined` in strict mode (which ES Modules and all TypeScript-compiled code use automatically), or the global object (`window` in browsers) in old-style non-strict scripts.",
      ],
      examples: [
        {
          id: "default-binding-example",
          title: "A bare call has no meaningful this",
          js: `"use strict";

function whoAmI() {
  console.log(this);
}

whoAmI(); // undefined (strict mode)`,
        },
      ],
    },
    {
      id: "implicit-binding",
      heading: "Rule 2: Implicit binding (called as a method)",
      body: [
        "When a function is called as a property of an object — `obj.method()` — `this` inside that call is the object *immediately to the left of the dot* at the call site. This is the rule behind ordinary object methods and is usually what people mean by 'this refers to the object'.",
      ],
      examples: [
        {
          id: "implicit-binding-example",
          title: "this is whatever is left of the dot, at the moment of the call",
          js: `const user = {
  name: "Ada",
  greet() {
    console.log(\`Hi, I'm \${this.name}\`);
  },
};

user.greet(); // "Hi, I'm Ada" — this === user

const greetFn = user.greet; // detach the function from the object
greetFn(); // "Hi, I'm undefined" (or throws in strict mode reading this.name)
// this is now the default binding (undefined) — there's no "dot" at this call site anymore!`,
          explanation:
            "This is the classic 'losing this' bug: assigning a method to a plain variable (or passing it as a callback, e.g. `setTimeout(user.greet)`) detaches it from the object. The function itself didn't change — only the call-site did, and implicit binding requires a dot at the call site to apply.",
        },
      ],
    },
    {
      id: "explicit-binding",
      heading: "Rule 3: Explicit binding (call, apply, bind)",
      body: [
        "`Function.prototype.call`, `.apply`, and `.bind` let you explicitly specify what `this` should be for a call, overriding what the call-site syntax alone would give you. This rule is covered in full depth in the next lesson — for now, know that it takes precedence over implicit binding.",
      ],
      examples: [
        {
          id: "explicit-binding-example",
          title: "Explicit binding overrides the call-site's own object",
          js: `function greet() {
  console.log(\`Hi, I'm \${this.name}\`);
}

const ada = { name: "Ada" };
const alan = { name: "Alan" };

greet.call(ada);  // "Hi, I'm Ada" — this is explicitly forced to be ada
greet.call(alan); // "Hi, I'm Alan"`,
        },
      ],
    },
    {
      id: "new-binding",
      heading: "Rule 4: new binding (constructor calls)",
      body: [
        "When a function is called with `new`, JavaScript creates a brand-new empty object, sets `this` inside the function to that new object, and (unless the function explicitly returns a different object) returns it automatically. This is how both old-style constructor functions and ES `class` constructors set up instance state.",
      ],
      examples: [
        {
          id: "new-binding-example",
          title: "new creates a fresh object and binds this to it",
          js: `function Person(name) {
  this.name = name; // this === the new object new creates
}

const ada = new Person("Ada");
console.log(ada.name); // "Ada"
console.log(ada instanceof Person); // true`,
        },
      ],
      pitfalls: [
        {
          title: "Precedence order: new > explicit > implicit > default",
          body: "When more than one rule could apply, this is the priority: `new binding` beats `explicit binding` (call/apply/bind) beats `implicit binding` (dot-call) beats `default binding` (bare call). In practice: `new fn.bind(obj)()` still uses the `new` object, not `obj` — `new` always wins.",
        },
      ],
    },
    {
      id: "arrow-this",
      heading: "Arrow functions: no rules apply at all",
      body: [
        "As introduced in Module 1, arrow functions don't participate in any of the four rules above. They have **no `this` binding of their own** — an arrow function simply uses whatever `this` was in the enclosing (lexical) scope at the moment it was *defined*, permanently, regardless of how it's later called. `call`, `apply`, and `bind` cannot override an arrow function's `this` — the first argument to `.call()` on an arrow function is silently ignored.",
      ],
      examples: [
        {
          id: "arrow-this-example",
          title: "Arrow functions ignore call/apply/bind entirely for this",
          js: `const obj = {
  name: "Ada",
  regular: function () {
    console.log(this.name);
  },
  arrow: () => {
    console.log(this?.name); // captures 'this' from module/global scope, not obj
  },
};

obj.regular.call({ name: "Override" }); // "Override" — explicit binding works
obj.arrow.call({ name: "Override" });   // undefined — arrow ignores it completely`,
        },
      ],
    },
    {
      id: "ts-this",
      heading: "TypeScript: typing this explicitly",
      body: [
        "TypeScript follows every rule above unchanged — it adds a compile-time way to *declare* what `this` should be inside a function, catching implicit-binding bugs before you run the code. A special fake first parameter, literally named `this`, lets you annotate the expected type; it's erased at compile time and never counts as a real parameter.",
      ],
      examples: [
        {
          id: "ts-this-parameter",
          title: "Declaring this's type to catch a detached-method bug at compile time",
          ts: `interface User {
  name: string;
}

function greet(this: User) {
  console.log(\`Hi, I'm \${this.name}\`);
}

const ada: User = { name: "Ada" };
greet.call(ada); // OK

const detached = greet;
detached();
// Error: The 'this' context of type 'void' is not assignable
// to method's 'this' of type 'User'.`,
          explanation:
            "Without the `this: User` annotation, TypeScript has no way to know `greet` expects to be called with a `User`-shaped `this` — the detached call would compile fine and only fail at runtime. With it, TypeScript statically flags the exact 'lost this' bug shown earlier in this lesson.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What determines the value of `this` inside a regular JavaScript function?",
      answer:
        "The call-site — specifically, how the function is called, not where it's defined. The same function can have a different this on every call depending on whether it's called bare, as obj.method(), via call/apply/bind, or with new.",
    },
    {
      question: "List the four this-binding rules in order of precedence, highest first.",
      answer:
        "1) new binding (called with new) — highest precedence. 2) Explicit binding (call/apply/bind). 3) Implicit binding (called as obj.method()). 4) Default binding (a bare function call, giving undefined in strict mode or the global object otherwise) — lowest precedence.",
    },
    {
      question: "Why does `const fn = obj.method; fn();` lose the correct this, even though fn is exactly the same function?",
      answer:
        "Implicit binding requires a dot at the actual call site to determine this. Assigning the method to a plain variable and calling it detaches it from obj — there's no dot in the fn() call site, so default binding applies instead, making this undefined (strict mode) rather than obj.",
    },
    {
      question: "How does this behave differently in an arrow function compared to a regular function?",
      answer:
        "A regular function's this is dynamically determined by its call-site, following the four binding rules. An arrow function has no this of its own at all — it lexically inherits this from whatever scope enclosed it at the time it was defined, and that binding never changes regardless of how the arrow function is later called, including via call/apply/bind, which cannot override it.",
    },
    {
      question: "What does adding a `this: SomeType` parameter to a TypeScript function do?",
      answer:
        "It declares the expected type of this for that function at compile time. TypeScript then checks every call site against that expectation and raises a compile-time error if the function would be called with an incompatible or missing this — for example, catching a detached method call before the code ever runs. This fake parameter is erased and doesn't count as a real argument.",
    },
  ],
  takeaways: [
    "this in a regular function is determined by the call-site, not the function's definition — the same function can have different this values on different calls.",
    "Precedence order when multiple rules could apply: new beats explicit (call/apply/bind) beats implicit (obj.method()) beats default (bare call).",
    "Detaching a method from its object (assigning it to a variable, passing it as a callback) loses implicit binding — this is the most common real-world this bug.",
    "Arrow functions opt out of all four rules entirely — they always use this from their enclosing lexical scope, permanently, immune to call/apply/bind.",
    "TypeScript's this parameter lets you declare and statically check the expected this type for a function, catching detached-call bugs at compile time.",
  ],
  status: "available",
};
