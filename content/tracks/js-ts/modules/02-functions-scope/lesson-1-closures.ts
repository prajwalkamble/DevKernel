import type { Lesson } from "@/content/types";

export const closuresLesson: Lesson = {
  id: "functions-scope-closures",
  slug: "closures",
  moduleSlug: "functions-scope",
  title: "Closures & the Module Pattern",
  summary:
    "What a closure actually is under the hood, why it's the single most important concept for writing correct JavaScript, and how to use it deliberately for private state and the module pattern.",
  estimatedMinutes: 30,
  objectives: [
    "Define a closure precisely, not just 'a function that remembers stuff'",
    "Predict the output of loop-and-closure code correctly",
    "Use closures to create private state",
    "Recognize and use the module pattern",
  ],
  sections: [
    {
      id: "what-is-a-closure",
      heading: "What a closure actually is",
      body: [
        "A **closure** is the combination of a function together with references to its surrounding lexical scope. In practice: every function in JavaScript remembers the variables that were in scope where it was *defined*, not where it's *called* — and it keeps a live reference to them for as long as the function itself exists, even after the outer function that created them has already returned.",
        "This isn't an opt-in feature — every single function in JavaScript is a closure over its defining scope. Most of the time this is invisible because the outer scope's variables aren't needed after the outer function returns. Closures become *visible and useful* the moment an inner function outlives its outer function and is still using the outer function's variables.",
      ],
      examples: [
        {
          id: "basic-closure",
          title: "A function that remembers, even after its outer function returns",
          js: `function makeCounter() {
  let count = 0; // "count" lives in makeCounter's scope

  return function increment() {
    count++; // this inner function closes over "count"
    return count;
  };
}

const counter = makeCounter(); // makeCounter() has already returned!
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3 — count is still alive, remembered by the closure

const anotherCounter = makeCounter(); // a brand new, independent "count"
console.log(anotherCounter()); // 1 — not affected by the first counter`,
          explanation:
            "By the time `counter()` is called, `makeCounter()`'s call has long since finished executing and been popped off the call stack. Normally you'd expect `count` to be gone — but the `increment` function closes over it, so the JavaScript engine keeps `count` alive in memory for as long as `increment` might still use it. Each call to `makeCounter()` creates a completely separate `count`.",
        },
      ],
    },
    {
      id: "loop-closure-revisited",
      heading: "The loop-and-closure interview classic, explained fully",
      body: [
        "This was flagged as a `var` pitfall in Module 1 — now let's understand exactly *why* it happens, in closure terms. `var` is function-scoped, so a `for (var i ...)` loop has exactly **one** `i` binding, shared by every iteration. Any closures created inside the loop (like a callback passed to `setTimeout`) all close over that *same* single variable — not a snapshot of its value at that point in time.",
        "`let` fixes this because the language spec gives a `for (let i ...)` loop a **fresh binding of `i` for every iteration** — so each closure created inside the loop body closes over its own independent `i`, frozen at the value that iteration had.",
      ],
      examples: [
        {
          id: "loop-closure-fix",
          title: "One shared binding vs a fresh binding per iteration",
          js: `// var: one binding shared across all iterations
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 10);
}
// logs "var: 3" three times — all three closures share the same i,
// which has already reached 3 by the time any callback runs

// let: a fresh binding per iteration
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 10);
}
// logs "let: 0", "let: 1", "let: 2" — each closure captured its own j

// The old pre-ES6 fix, using an IIFE to manually create a new scope per iteration:
for (var k = 0; k < 3; k++) {
  (function (capturedK) {
    setTimeout(() => console.log("IIFE:", capturedK), 10);
  })(k);
}
// logs "IIFE: 0", "IIFE: 1", "IIFE: 2" — the IIFE parameter creates a new binding`,
          explanation:
            "The IIFE (Immediately Invoked Function Expression) trick was the standard workaround before `let` existed in 2015 — it manually creates a new function scope per iteration, giving each closure its own copy of the value via the parameter. `let` makes this unnecessary by building per-iteration bindings into the loop itself.",
        },
      ],
    },
    {
      id: "private-state",
      heading: "Using closures for private state",
      body: [
        "Before JavaScript had the `#private` class field syntax, closures were (and still often are) the standard way to create genuinely private state — variables that literally cannot be accessed from outside, not just by naming convention (like a leading underscore, which is just a hint, not enforcement).",
      ],
      examples: [
        {
          id: "private-state-example",
          title: "A bank account with genuinely private balance",
          js: `function createAccount(initialBalance) {
  let balance = initialBalance; // not accessible from outside, at all

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createAccount(100);
console.log(account.getBalance()); // 100
account.deposit(50);
console.log(account.getBalance()); // 150
console.log(account.balance);      // undefined — there is no "balance" property at all`,
          explanation:
            "The only way to read or change `balance` is through the methods `createAccount` chose to expose. There's no `account.balance` property to find via `console.log(account)` or `Object.keys(account)` — it simply doesn't exist on the object; it only exists as a variable inside the closure.",
        },
      ],
      pitfalls: [
        {
          title: "Closures keep their captured variables alive — a memory consideration",
          body: "Because a closure holds a live reference to its outer variables, those variables can't be garbage-collected as long as the closure itself is reachable. This is rarely a real problem, but holding onto a large object (like a big array) inside a long-lived closure (an event listener that's never removed) can leak memory in long-running applications.",
        },
      ],
    },
    {
      id: "module-pattern",
      heading: "The module pattern",
      body: [
        "The **module pattern** uses an IIFE that returns an object, combining closures for private state with a small public API — the direct precursor to how ES Modules (`import`/`export`, covered in Module 7) work conceptually. Every ES Module file is, in effect, a closure: variables declared at the top level of a module are private to that module unless explicitly exported.",
      ],
      examples: [
        {
          id: "module-pattern-example",
          title: "Classic module pattern with an IIFE",
          js: `const Counter = (function () {
  let count = 0; // private, not accessible outside this IIFE

  function increment() {
    count += 1;
    return count;
  }

  function reset() {
    count = 0;
  }

  return { increment, reset }; // only these are exposed publicly
})();

console.log(Counter.increment()); // 1
console.log(Counter.increment()); // 2
Counter.reset();
console.log(Counter.increment()); // 1
console.log(Counter.count);       // undefined — count was never exposed`,
          explanation:
            "This pattern predates ES Modules and was the standard way to avoid polluting the global scope with private helper variables in plain script files. Today, prefer real ES Modules for this — but understanding this pattern makes it obvious *why* module-scoped variables in an ES Module file are private by default: it's the exact same closure mechanism.",
        },
      ],
    },
    {
      id: "ts-closures",
      heading: "TypeScript: closures typed the same way, with inference intact",
      body: [
        "Closures behave identically in TypeScript — there's no special syntax. What TypeScript adds is that the captured variables' types are enforced inside the closure too, and the return type of a factory function like `createAccount` can be explicitly described with an interface, documenting the public API clearly.",
      ],
      examples: [
        {
          id: "ts-closure-example",
          title: "A typed closure factory",
          ts: `interface Account {
  deposit(amount: number): number;
  withdraw(amount: number): number;
  getBalance(): number;
}

function createAccount(initialBalance: number): Account {
  let balance = initialBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createAccount(100);
account.deposit("50");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.`,
          explanation:
            "The `Account` interface documents exactly what's public — anyone reading this function's signature immediately knows its API without reading the implementation. Note that TypeScript infers the parameter types of the methods inside the returned object literal from the `Account` interface's method signatures, so you don't need to re-annotate `amount: number` inside each method.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a closure, precisely?",
      answer:
        "A closure is a function bundled together with references to the variables from its surrounding lexical scope at the time it was defined. The function retains access to those variables for as long as it exists, even after the outer function that created them has finished executing.",
    },
    {
      question: "Why does `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i)) }` print 3 three times, and how does switching to let fix it?",
      answer:
        "var creates a single function-scoped binding of i shared by every iteration and every closure created in the loop. By the time any setTimeout callback runs, the loop has finished and i is 3. let creates a brand-new binding of i for every iteration, so each closure captures its own independent value.",
    },
    {
      question: "How can closures be used to create private variables in JavaScript?",
      answer:
        "A function can declare local variables and return an object of methods (or another function) that reference those variables. Since the variables only exist inside the enclosing function's scope, there is no way to access them from outside except through the exposed methods — unlike a naming convention (e.g. _balance), this is real, unbypassable privacy.",
    },
    {
      question: "What is the module pattern and how does it relate to closures?",
      answer:
        "The module pattern wraps code in an IIFE that returns an object exposing only a chosen public API, keeping everything else private via closure. It was the standard way to avoid global namespace pollution before ES Modules existed, and it's conceptually the same mechanism that makes top-level variables in a real ES Module file private by default.",
    },
    {
      question: "Can closures cause memory leaks? How?",
      answer:
        "Yes, indirectly. A closure keeps its captured outer variables alive in memory for as long as the closure itself is reachable, since the garbage collector can't reclaim something still referenced. If a closure that references a large object is attached somewhere long-lived (e.g. an event listener that's never removed), that object can't be freed for the lifetime of the listener.",
    },
  ],
  takeaways: [
    "A closure is a function plus a live reference to the variables in scope where it was defined — not a copy, a live reference.",
    "Every function in JavaScript is a closure over its defining scope; it's just usually invisible until an inner function outlives its outer function.",
    "let's per-iteration binding in for loops is what fixes the classic var-in-a-loop closure bug — understand it as 'a fresh binding per iteration', not magic.",
    "Closures are the mechanism behind private state via factory functions and the module pattern, predating and foreshadowing ES Modules.",
    "TypeScript adds no new closure syntax — it types the captured variables and lets you document a closure's public API with an interface.",
  ],
  status: "available",
};
