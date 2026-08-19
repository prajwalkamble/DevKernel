import type { Lesson } from "@/content/types";

export const questionBankLesson: Lesson = {
  id: "interview-question-bank",
  slug: "cross-topic-question-bank",
  moduleSlug: "interview-mastery",
  title: "The Cross-Topic Question Bank",
  summary:
    "The questions that come up across the whole language, answered at the depth an interviewer is actually listening for — and the follow-up each one is really setting up.",
  estimatedMinutes: 40,
  objectives: [
    "Answer the standard questions at the right depth, without rambling",
    "Recognise which follow-up each question is setting up",
    "Structure an answer: claim, mechanism, consequence",
    "Say \"I don't know\" in a way that helps you",
  ],
  sections: [
    {
      id: "how-to-answer",
      heading: "How to answer, before what to answer",
      body: [
        "Most people lose marks on structure rather than knowledge. A good technical answer has three parts and takes about forty seconds.",
        "**The claim.** One sentence that answers the question directly. Not a preamble, not \"so, there are several things going on here\".",
        "**The mechanism.** Why it is true — what the engine, the compiler or the specification actually does. This is the part that separates \"I read this\" from \"I understand this\".",
        "**The consequence.** What it means for code you write. This is where an interviewer decides whether you have used the knowledge or only memorised it.",
        "Then stop. A question you have answered fully in forty seconds invites a follow-up, and the follow-up is where the interesting conversation lives. Talking for four minutes prevents that and reads as uncertainty.",
        "**On not knowing:** \"I don't know, but I'd guess X because Y — is that right?\" is a genuinely strong answer. It shows reasoning, it is honest, and interviewers remember it far more favourably than a confident wrong answer, which is the worst possible outcome because it makes everything else you said suspect.",
      ],
      examples: [
        {
          id: "answer-shape",
          title: "The same question, two answers",
          lang: "bash",
          code: `Q: "What's the difference between let and var?"

# Weak — a list of facts with no mechanism and no consequence.
"var is function scoped and let is block scoped, and let has the
temporal dead zone, and var gets hoisted, and you can't redeclare
let, and var attaches to window..."

# Strong — claim, mechanism, consequence, then stop.
"var is function-scoped, let is block-scoped.

 The mechanism is that a var declaration is hoisted to the top of
 its function and initialised to undefined, whereas a let is hoisted
 but left uninitialised — reading it before the declaration throws,
 which is the temporal dead zone.

 In practice that's why a setTimeout inside a var loop sees the final
 value for every iteration: all the callbacks share one binding, and
 let creates a fresh one per iteration."`,
          explanation:
            "The second answer is shorter and demonstrates more. It also hands the interviewer three natural follow-ups — hoisting, the TDZ, closures in loops — which is exactly what you want, because you have already shown you can handle all three.",
        },
      ],
    },
    {
      id: "the-bank",
      heading: "What the bank below covers",
      body: [
        "The fifteen questions at the end of this lesson span the whole track: scope and closures, `this`, coercion, the event loop, prototypes, the TypeScript type system, arrays and promises, and the two practical questions — memory leaks and rate limiting — that come up in almost every front-end interview.",
        "Each answer is written in the claim-mechanism-consequence shape, so read them as models of the *form* as well as the content. Where an answer names a specific trap, that trap is usually the follow-up.",
      ],
    },
    {
      id: "study-method",
      heading: "Using this bank properly",
      body: [
        "Reading answers is close to useless. What works is **answering out loud before reading**, then comparing — the gap between what you said and what is written is the thing to study, and it is invisible if you only read.",
        "Two more that measurably help. **Explain to someone who does not know it**, or to an empty room; the places you stall are the places you do not actually understand. And **write the code**: an explanation of closures that you have never demonstrated in ten lines is fragile under a follow-up.",
        "The other half of preparation is not question-shaped at all. Have two or three **stories** ready — a bug you found, a design you argued for, something you got wrong — because most interviews are half technical questions and half \"tell me about a time\". Module 12's last lesson covers those.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Explain closures, and give a real use for one.",
      answer:
        "A closure is a function together with the scope it was created in, so it keeps access to those variables after the outer function has returned. The mechanism is that the inner function holds a reference to the outer scope's environment, which therefore is not collected. Real uses: private state in a factory function, a `once` wrapper that remembers whether it has run, memoisation caches, and any callback that needs data from where it was defined. The classic bug is a `var` loop, where every callback closes over the same binding and sees the final value.",
    },
    {
      question: "What does `this` refer to?",
      answer:
        "For a normal function it is decided by *how the function is called*, not where it is defined: called as a method it is the object before the dot, called standalone it is `undefined` in strict mode, called with `new` it is the new instance, and `call`/`apply`/`bind` set it explicitly. Arrow functions are the exception — they have no `this` of their own and close over the enclosing scope's, which is why they are right for callbacks and wrong for object methods. The common bug is passing `obj.method` as a callback: it loses the receiver, so `this` becomes undefined.",
    },
    {
      question: "What is the difference between `==` and `===`?",
      answer:
        "`===` compares type and value with no conversion. `==` applies the abstract equality algorithm, which converts operands of different types — so `\"1\" == 1` and `[] == false` are both true. Use `===` always, with one idiomatic exception: `x == null` is a concise check for null-or-undefined and is widely accepted. The genuinely surprising cases are `null == undefined` being true while `null === undefined` is false, and `null >= 0` being true while `null > 0` is false, because relational comparison converts and equality does not.",
    },
    {
      question: "Explain the event loop.",
      answer:
        "JavaScript runs on one thread with a queue of work. All synchronous code runs to completion, then the entire microtask queue drains — promise callbacks, `queueMicrotask`, `await` continuations, including microtasks queued during that drain — then one macrotask runs, such as a timer or an I/O callback, after which microtasks drain again. The consequence is that a promise callback always runs before a `setTimeout(…, 0)` queued at the same moment, and that an unbroken chain of microtasks starves timers entirely.",
    },
    {
      question: "How does prototypal inheritance work?",
      answer:
        "Every object has an internal link to another object, its prototype. A property lookup that misses walks that chain until it finds the property or reaches null. `class` syntax is sugar over this: methods go on `Constructor.prototype`, and `extends` sets the chain. The practical consequences are that methods are shared rather than copied per instance, that adding to a prototype affects every existing instance, and that a long chain costs lookup time — which is why `Object.create(null)` is used for dictionaries where you want no inherited keys at all.",
    },
    {
      question: "What is the difference between an interface and a type alias in TypeScript?",
      answer:
        "Both describe object shapes and are interchangeable for most purposes. Interfaces support declaration merging — declaring the same interface twice combines them, which is how library augmentation works — and produce slightly better error messages for object types. Type aliases can express things interfaces cannot: unions, intersections, tuples, mapped and conditional types, and primitives. The common convention is interfaces for object shapes that others may extend, and type aliases for everything else.",
    },
    {
      question: "What does `unknown` give you that `any` does not?",
      answer:
        "`any` disables checking for the value and everything derived from it, so one `any` can silently untype a whole feature with no warning. `unknown` accepts any value but permits no operation until you narrow it, so the check happens once at the boundary and everything downstream is properly typed. Use `unknown` for anything arriving from outside — JSON, storage, `postMessage`, third-party callbacks — ideally with a schema library that produces the validation and the type together.",
    },
    {
      question: "What are generics for, and when would you not use one?",
      answer:
        "To relate types to each other: a function that returns whatever type it was given, a container that remembers what it holds, a component whose callback receives the item type the caller supplied. Without them the choice is `any` or a cast at every call site. You would not use one where only one type is ever involved — a generic with a single instantiation is indirection with nothing behind it. A sign the generic is failing is callers writing the type argument explicitly, which means inference is not working.",
    },
    {
      question: "What is a discriminated union and why is it useful?",
      answer:
        "A union of object types sharing a literal property that identifies which member you have — `{ status: \"success\", data: T } | { status: \"error\", error: E }`. Checking the discriminant narrows the type, so member-specific fields are only reachable where they exist. It removes impossible states, replaces optional-everything shapes, and enables exhaustiveness checking: assigning the value to `never` in a default branch makes a forgotten case a compile error.",
    },
    {
      question: "How does TypeScript's structural typing differ from nominal typing?",
      answer:
        "Compatibility is decided by shape, not by declared name — a value satisfies a type if it has the required members, regardless of whether it claims to implement it. That makes it easy to type existing JavaScript and to substitute test doubles. The downside is that two types with the same shape but different meaning are interchangeable, so a `UserId` and an `OrderId` that are both strings can be swapped by mistake. The fix is a branded or newtype pattern that adds a phantom property.",
    },
    {
      question: "What is the difference between `map`, `forEach` and `reduce`?",
      answer:
        "`map` transforms each element and returns a new array of the same length. `forEach` runs a side effect per element and returns undefined, so it cannot be chained. `reduce` folds the collection into a single value of any type. Reach for `map` and `filter` when the shape fits, `reduce` when genuinely building one value from many — and avoid the common `reduce` that spreads its accumulator each iteration, which turns a linear loop into a quadratic one.",
    },
    {
      question: "What is the difference between `Promise.all` and `Promise.allSettled`?",
      answer:
        "`Promise.all` resolves with an array of results, or rejects as soon as any one rejects — the other promises keep running but their results are lost. `allSettled` waits for every promise and resolves with a status-and-value object for each, so partial failure is visible and survivable. Use `all` when you need all of them and any failure invalidates the whole operation; `allSettled` for independent work, such as several widgets on a dashboard. `race` and `any` cover first-settled and first-fulfilled.",
    },
    {
      question: "Why does `fetch` not reject on a 404?",
      answer:
        "Because the request completed and a response came back — as far as `fetch` is concerned, that succeeded. It only rejects when the request could not be made: network failure, DNS failure, CORS refusal, or an abort. So `try/catch` alone is not enough; you check `response.ok`, which is true for statuses 200-299. Every real codebase wraps `fetch` once so this check is not repeated everywhere.",
    },
    {
      question: "How would you find and fix a memory leak in a front-end application?",
      answer:
        "Reproduce a repeated action — navigate between two screens fifty times — then take heap snapshots in DevTools before and after and compare retained size. The usual causes are event listeners never removed, timers never cleared, subscriptions to a long-lived store, and detached DOM nodes still referenced by a closure. The fix is almost always tying teardown to the thing's lifetime: register listeners with an `AbortSignal` and abort on cleanup, which cannot drift out of sync the way matched add/remove calls do.",
    },
    {
      question: "What is the difference between debouncing and throttling?",
      answer:
        "Debouncing waits until activity stops — the function runs once, after a quiet period — which suits search-as-you-type and autosave. Throttling runs at most once per interval regardless of how much activity there is, which suits scroll and resize handlers where you want steady updates. The confusion is that both limit call rate, but debounce delays until silence while throttle samples at a fixed rate.",
    },
  ],
  takeaways: [
    "Answer in three parts — claim, mechanism, consequence — then stop and invite the follow-up",
    "A confident wrong answer is worse than \"I don't know, but I'd guess X because Y\"",
    "Answering out loud before reading is what makes a question bank useful; reading alone is not",
    "Be able to demonstrate closures, `this` and the event loop in code, not just describe them",
    "Most questions are testing whether you have *used* the knowledge, which is what the consequence sentence shows",
    "Prepare two or three stories as well — half the interview is usually not question-shaped",
  ],
  status: "available",
};
