import type { Lesson } from "@/content/types";

export const callApplyBindLesson: Lesson = {
  id: "functions-scope-call-apply-bind",
  slug: "call-apply-bind",
  moduleSlug: "functions-scope",
  title: "call, apply & bind",
  summary:
    "The three built-in methods every function has for explicitly controlling `this`, the one syntactic difference between call and apply, and how bind enables partial application — plus how TypeScript types all three safely.",
  estimatedMinutes: 25,
  objectives: [
    "Use call and apply to invoke a function with an explicit this",
    "Know exactly how call and apply differ (and only that)",
    "Use bind to permanently lock a function's this and pre-fill arguments (partial application)",
    "Understand how TypeScript keeps call/apply/bind type-safe",
  ],
  sections: [
    {
      id: "call-apply",
      heading: "call and apply: invoke now, with an explicit this",
      body: [
        "`fn.call(thisArg, arg1, arg2, ...)` and `fn.apply(thisArg, [arg1, arg2, ...])` both immediately invoke `fn` with `this` set to `thisArg`. They are **functionally identical** except for one thing: how they accept the function's arguments — `call` takes them as a comma-separated list, `apply` takes them as a single array. A useful mnemonic: '**A**pply takes an **A**rray'.",
      ],
      examples: [
        {
          id: "call-vs-apply",
          title: "Same result, different argument syntax",
          js: `function introduce(greeting, punctuation) {
  return \`\${greeting}, I'm \${this.name}\${punctuation}\`;
}

const user = { name: "Ada" };

console.log(introduce.call(user, "Hello", "!"));      // call: args listed individually
console.log(introduce.apply(user, ["Hello", "!"]));   // apply: args as one array

// A classic pre-spread use of apply: passing an array as individual arguments
const numbers = [4, 1, 7, 3];
console.log(Math.max.apply(null, numbers)); // 7
// Modern equivalent using spread (preferred today):
console.log(Math.max(...numbers)); // 7`,
          explanation:
            "That last example is `apply`'s historic killer use case — before the spread operator (`...`) existed, `apply` was the only way to pass an array's contents as individual arguments to a function like `Math.max`, which doesn't accept an array directly. Modern code almost always prefers spread for this specific purpose, but you'll still see `apply` in older codebases and in cases needing a dynamic `this`.",
        },
      ],
    },
    {
      id: "method-borrowing",
      heading: "A real use case: borrowing methods",
      body: [
        "`call`/`apply` let you borrow a method from one type and use it on an object that doesn't have that method itself, as long as the internal logic doesn't depend on anything specific to the original type. The classic historic example: borrowing `Array.prototype` methods to work on array-like objects (like the old `arguments` object) that aren't real arrays.",
      ],
      examples: [
        {
          id: "method-borrowing-example",
          title: "Borrowing Array.prototype.slice on an array-like object",
          js: `function oldStyleFn() {
  // "arguments" is array-like (has indices and length) but is NOT a real array
  const args = Array.prototype.slice.call(arguments);
  console.log(Array.isArray(args)); // true — now it's a real array
  return args;
}

console.log(oldStyleFn(1, 2, 3)); // [1, 2, 3]

// Modern equivalent — no borrowing needed:
function modernFn(...args) {
  return args; // already a real array, via rest parameters
}`,
          explanation:
            "This exact pattern is rarely needed today — rest parameters (`...args`, from Module 1) and `Array.from()` solve the same problem far more clearly. It's still worth recognizing in older code, and the underlying idea (borrowing a prototype method via call/apply) remains a useful technique in general.",
        },
      ],
    },
    {
      id: "bind",
      heading: "bind: don't call now, create a permanently-bound copy",
      body: [
        "`fn.bind(thisArg, arg1, arg2, ...)` is different from `call`/`apply` in one crucial way: it does **not** invoke the function immediately. Instead, it returns a **new function** with `this` permanently locked to `thisArg` — and critically, that binding cannot be overridden later, even by another `call`/`apply`/`bind` on the returned function.",
        "`bind` also supports **partial application**: any extra arguments passed to `bind` are pre-filled as the first arguments of every future call to the bound function.",
      ],
      examples: [
        {
          id: "bind-example",
          title: "Locking this permanently — the standard fix for detached methods",
          js: `const user = {
  name: "Ada",
  greet() {
    console.log(\`Hi, I'm \${this.name}\`);
  },
};

const detached = user.greet;
detached(); // "Hi, I'm undefined" — this is lost (from the previous lesson)

const boundGreet = user.greet.bind(user);
const alsoDetached = boundGreet;
alsoDetached(); // "Hi, I'm Ada" — this stays locked to user, permanently

setTimeout(user.greet.bind(user), 10); // the classic real-world use case`,
        },
        {
          id: "bind-partial-application",
          title: "bind for partial application (pre-filling arguments)",
          js: `function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2); // pre-fill the first argument as 2
console.log(double(5));  // 10 — called as multiply(2, 5)
console.log(double(10)); // 20 — called as multiply(2, 10)

const triple = multiply.bind(null, 3);
console.log(triple(5)); // 15`,
          explanation:
            "`this` is `null` here because `multiply` doesn't use `this` at all — only the argument pre-filling matters in this example. This pattern (fixing some arguments of a function to produce a more specific function) is called partial application, and it's a foundational technique in functional-style JavaScript, expanded on in the Higher-Order Functions lesson.",
        },
      ],
      pitfalls: [
        {
          title: "Arrow functions can't be re-bound",
          body: "Calling `.bind()`, `.call()`, or `.apply()` on an arrow function has no effect on its `this` — as covered in the previous lesson, arrow functions never have a `this` of their own to override. `.bind()` on an arrow function still works for pre-filling arguments (partial application), but the `thisArg` you pass is silently ignored.",
        },
      ],
    },
    {
      id: "ts-call-apply-bind",
      heading: "TypeScript: call/apply/bind stay fully type-checked",
      body: [
        "TypeScript ships built-in typings for `call`, `apply`, and `bind` that check the arguments you pass against the function's actual signature — including the type of `this` if the function declared one (using the `this` parameter from the previous lesson). This closes a real gap: in plain JavaScript, passing the wrong argument types to `.call()` fails silently or produces `NaN`/garbage; TypeScript catches it immediately.",
      ],
      examples: [
        {
          id: "ts-call-typed",
          title: "Type-checked call and bind",
          ts: `function introduce(this: { name: string }, greeting: string, times: number): string {
  return \`\${greeting}, I'm \${this.name}\`.repeat(times);
}

introduce.call({ name: "Ada" }, "Hi", 2); // OK
introduce.call({ name: "Ada" }, "Hi", "2");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.

const boundIntro = introduce.bind({ name: "Ada" }, "Hi");
// TypeScript correctly infers boundIntro's remaining signature: (times: number) => string
boundIntro(3); // OK
boundIntro("3");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.`,
          explanation:
            "Notice TypeScript even tracks *partial application* correctly: after binding the first two arguments (`this` and `\"Hi\"`), the returned `boundIntro` function's inferred type only expects the remaining `times: number` parameter — get this wrong and TypeScript still catches it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What's the difference between call and apply?",
      answer:
        "They're functionally identical — both immediately invoke a function with an explicitly specified this — except for how they accept the invoked function's arguments: call takes them as a comma-separated list, apply takes them as a single array.",
    },
    {
      question: "How is bind fundamentally different from call and apply?",
      answer:
        "call and apply invoke the function immediately. bind does not invoke anything — it returns a brand new function with this (and optionally some leading arguments) permanently locked in, to be called later. That binding can't be overridden by a later call/apply/bind on the returned function.",
    },
    {
      question: "What is partial application, and how does bind enable it?",
      answer:
        "Partial application means fixing some of a function's arguments in advance to produce a new, more specific function that only needs the remaining arguments. bind supports this directly: any arguments passed to bind after thisArg are pre-filled as the first arguments on every call to the returned function.",
    },
    {
      question: "Does calling .call() on an arrow function change its this?",
      answer:
        "No. Arrow functions never have their own this — they always use this from their enclosing lexical scope, and this cannot be overridden by call, apply, or bind. Any thisArg passed to one of these methods on an arrow function is silently ignored (though bind's argument pre-filling still works).",
    },
    {
      question: "In modern JavaScript, what has largely replaced Function.prototype.apply for passing an array as individual arguments?",
      answer:
        "The spread operator. Math.max.apply(null, numbers) is now more commonly written as Math.max(...numbers), which is clearer and doesn't require passing a throwaway thisArg. apply is still used when you genuinely need to set this dynamically together with array-based arguments.",
    },
  ],
  takeaways: [
    "call and apply both invoke immediately with an explicit this; they differ only in argument syntax — list vs array.",
    "bind returns a new function with this permanently locked, without invoking anything — the standard fix for detached-method callbacks.",
    "bind also supports partial application: extra arguments passed to bind pre-fill the returned function's leading parameters.",
    "Arrow functions ignore any this argument passed to call/apply/bind, since they never have their own this to override.",
    "TypeScript type-checks call/apply/bind arguments against the real function signature, including correctly narrowing bind's returned function type after partial application.",
  ],
  status: "available",
};
