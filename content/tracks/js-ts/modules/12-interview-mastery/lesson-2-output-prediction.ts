import type { Lesson } from "@/content/types";

export const outputPredictionLesson: Lesson = {
  id: "interview-output-prediction",
  slug: "output-prediction",
  moduleSlug: "interview-mastery",
  title: "Output Prediction: Guess the console.log",
  summary:
    "Seven puzzles of the kind interviewers use to probe whether you know the mechanism or the folklore — every output below is real, produced by running the code.",
  estimatedMinutes: 35,
  objectives: [
    "Predict output involving hoisting, the TDZ and `this`",
    "Reason about coercion rather than memorising a table",
    "Explain default sort, array holes and NaN equality",
    "Explain property order and spread precedence",
    "Work out an answer from the mechanism when memory fails",
  ],
  sections: [
    {
      id: "how-to-use",
      heading: "How to use this lesson",
      body: [
        "**Cover the output, predict, then look.** These are only worth anything if you commit to an answer first — reading them confirms what you already knew and teaches nothing.",
        "When you get one wrong, the useful question is not \"what is the answer\" but \"which rule did I not know\". Every one of these follows from a rule covered earlier in this track, and the explanation names it.",
        "In an interview, **say your reasoning as you go**. Getting the answer wrong while reasoning correctly out loud scores better than a silent correct guess, because the interviewer is assessing how you think about the language, not whether you have seen this exact snippet.",
      ],
    },
    {
      id: "hoisting",
      heading: "1. Hoisting and the temporal dead zone",
      examples: [
        {
          id: "puzzle-hoisting",
          title: "Three uses of typeof",
          js: `console.log(typeof x);
var x = 1;

console.log(typeof notDeclaredAnywhere);

try {
  console.log(typeof y);
  let y = 2;
} catch (error) {
  console.log(error.constructor.name + ":", error.message);
}`,
          output: `undefined
undefined
ReferenceError: Cannot access 'y' before initialization`,
          explanation:
            "The third line is the one that catches people. **`typeof` protects you from *undeclared* variables, but not from the temporal dead zone.** A `let` is hoisted — the engine knows the name exists in this scope — but it is uninitialised until the declaration runs, and *any* access including `typeof` throws. That is precisely why the TDZ exists: to make use-before-declaration an error rather than silently `undefined`.",
        },
      ],
    },
    {
      id: "this",
      heading: "2. Losing the receiver",
      examples: [
        {
          id: "puzzle-this",
          title: "The same function, two ways of calling it",
          js: `const obj = {
  name: "obj",
  regular() {
    return this?.name;
  },
};

const { regular } = obj;

console.log(obj.regular(), regular());`,
          output: `obj undefined`,
          explanation:
            "`this` is determined by the **call**, not the definition. `obj.regular()` has a receiver, so `this` is `obj`. Destructuring extracts the function and calls it bare, so in strict mode — which every module is — `this` is `undefined`, and the optional chaining turns what would be a crash into `undefined`. This is exactly why `element.addEventListener(\"click\", obj.handleClick)` loses its object, and why the fix is `.bind(obj)` or an arrow wrapper.",
        },
      ],
    },
    {
      id: "coercion",
      heading: "3. Coercion",
      examples: [
        {
          id: "puzzle-coercion",
          title: "Five lines of type conversion",
          js: `console.log(JSON.stringify([] + []), JSON.stringify([] + {}));
console.log(1 + "2" - 1, "5" - -"2");
console.log(0.1 + 0.2 === 0.3, typeof NaN, NaN === NaN);
console.log([] == false, null == undefined, null === undefined, null >= 0, null > 0);`,
          output: `"" "[object Object]"
11 7
false number false
true true false true false`,
          explanation:
            "Work through it by rule rather than memory. `+` with a non-primitive converts both sides to primitives: `[]` becomes `\"\"` and `{}` becomes `\"[object Object]\"`, so line 1 is string concatenation. On line 2, `1 + \"2\"` is `\"12\"` and then `- 1` converts back to a number giving 11; `-\"2\"` is `-2` and `5 - (-2)` is 7. Line 3 is IEEE 754 and the definition of NaN, which is not equal to itself. **Line 4 is the interesting one:** `null >= 0` is true while `null > 0` is false, because relational operators convert `null` to 0 while `==` does not convert `null` to anything except `undefined`. The rules are genuinely inconsistent — which is the real answer, and worth saying.",
        },
      ],
    },
    {
      id: "sort",
      heading: "4. Default sort",
      examples: [
        {
          id: "puzzle-sort",
          title: "Sorting numbers",
          js: `console.log([10, 9, 1, 100].sort());
console.log([10, 9, 1, 100].sort((a, b) => a - b));`,
          output: `[ 1, 10, 100, 9 ]
[ 1, 9, 10, 100 ]`,
          explanation:
            "**`sort` with no comparator converts every element to a string and sorts lexicographically.** `\"9\"` comes after `\"100\"` because `\"9\" > \"1\"` at the first character. Two further points worth having ready: `sort` mutates the array in place and returns the same reference, so `const sorted = arr.sort()` leaves `arr` sorted too — `toSorted()` returns a new array instead. And since ES2019 sort is guaranteed stable, so equal elements keep their relative order.",
        },
      ],
    },
    {
      id: "keys-spread",
      heading: "5. Property order and spread precedence",
      examples: [
        {
          id: "puzzle-keys",
          title: "Two things about object literals",
          js: `console.log(Object.keys({ b: 1, 2: 2, a: 3, 1: 4 }));

const base = { a: 1, b: 2 };
console.log({ ...base, a: 9 }, { a: 9, ...base });`,
          output: `[ '1', '2', 'b', 'a' ]
{ a: 9, b: 2 } { a: 1, b: 2 }`,
          explanation:
            "**Integer-like keys come first, in ascending numeric order, before string keys in insertion order.** That is specified behaviour, not an implementation detail, and it is why an object keyed by numeric ids does not preserve the order you inserted them — use a `Map` when order matters. The second line is simpler but catches people under time pressure: **later properties win**, so putting the spread last overwrites everything you wrote before it.",
        },
      ],
    },
    {
      id: "holes",
      heading: "6. Array holes and NaN",
      examples: [
        {
          id: "puzzle-holes",
          title: "Two arrays that look identical",
          js: `console.log(new Array(3).map(() => 1));
console.log(Array.from({ length: 3 }, () => 1));

console.log([1, 2, 3].includes(NaN), [NaN].includes(NaN), [NaN].indexOf(NaN));`,
          output: `[ <3 empty items> ]
[ 1, 1, 1 ]
false true -1`,
          explanation:
            "`new Array(3)` produces a **sparse** array — length 3 with no elements — and `map`, `filter` and `forEach` all skip holes, so the callback never runs. `Array.from({ length: 3 }, fn)` calls the function for each index and produces a real array. The second line: `includes` uses SameValueZero, which treats `NaN` as equal to itself, while `indexOf` uses strict equality, which does not. That is the only observable difference between the two methods, and it is a favourite follow-up.",
        },
      ],
    },
    {
      id: "defaults",
      heading: "7. Parameter defaults",
      examples: [
        {
          id: "puzzle-defaults",
          title: "A default that refers to another parameter",
          js: `function f(a, b = a * 2) {
  return [a, b];
}

console.log(f(3), f(3, 1));`,
          output: `[ 3, 6 ] [ 3, 1 ]`,
          explanation:
            "Defaults are evaluated **at call time, left to right**, and each one can see the parameters to its left — which is why `b = a * 2` works and `f(a = b, b)` would throw. Two consequences worth knowing: a default only applies to `undefined`, not to `null` or any other falsy value; and because they are evaluated per call, `function push(item, list = [])` gets a fresh array every time, unlike the equivalent in Python.",
        },
      ],
    },
    {
      id: "meta",
      heading: "What these questions are really testing",
      body: [
        "None of this is knowledge you need daily. `[] == false` should not appear in your code, and if it does the fix is `===`, not a deeper understanding of coercion.",
        "So why ask? Because **the reasoning transfers even when the trivia does not**. Someone who can derive `[] + {}` from the rules understands the primitive-conversion path that also explains why a `Date` behaves differently from an object in a template string. Someone who has memorised the answer knows one fact.",
        "The practical consequence for preparation: **learn the mechanism, not the outputs.** There are more puzzles than you can memorise, and an interviewer can always invent another. There are only about six rules underneath all of them — hoisting and the TDZ, how `this` is bound, primitive conversion, the event loop's two queues, prototype lookup, and reference-versus-value semantics.",
        "And if you meet one you genuinely cannot work out, say so and reason aloud anyway. \"I'd have to run it — but I'd expect X, because the `+` operator converts both operands to primitives first\" is a good answer even when X turns out to be wrong.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Does `typeof` protect you from a ReferenceError?",
      answer:
        "Only for undeclared variables — `typeof neverDeclared` safely returns `\"undefined\"`. It does not protect against the temporal dead zone: `typeof x` where `x` is a `let` or `const` declared later in the same scope throws `ReferenceError: Cannot access 'x' before initialization`. The name is hoisted and known to exist, but the binding is uninitialised, and every form of access including `typeof` is an error.",
    },
    {
      question: "Why does `[10, 9, 1, 100].sort()` give `[1, 10, 100, 9]`?",
      answer:
        "Without a comparator, `sort` converts every element to a string and compares lexicographically, so `\"9\"` sorts after `\"100\"` on the first character. Pass `(a, b) => a - b` for numbers. Two related points: `sort` mutates in place and returns the same array, so use `toSorted()` for a copy; and it has been guaranteed stable since ES2019.",
    },
    {
      question: "What is the difference between `includes` and `indexOf`?",
      answer:
        "`includes` uses SameValueZero and `indexOf` uses strict equality, and the only observable difference is `NaN` — `[NaN].includes(NaN)` is true while `[NaN].indexOf(NaN)` is -1. `includes` also returns a boolean rather than an index, which reads better when you do not need the position.",
    },
    {
      question: "In what order does `Object.keys` return properties?",
      answer:
        "Integer-like keys first in ascending numeric order, then string keys in insertion order, then symbols. It is specified rather than implementation-defined. The consequence is that an object keyed by numeric ids will not preserve insertion order — use a `Map`, which preserves insertion order for all key types and allows non-string keys.",
    },
    {
      question: "When are default parameter values evaluated?",
      answer:
        "At call time, left to right, and each default can reference parameters to its left — so `function f(a, b = a * 2)` works while referencing a later parameter throws. They apply only when the argument is `undefined`, not for `null` or other falsy values. Because evaluation happens per call, a default of `[]` or `{}` produces a fresh object each time rather than a shared one.",
    },
  ],
  takeaways: [
    "`typeof` protects against undeclared variables but not against the temporal dead zone",
    "`this` is decided by the call site, so destructuring a method loses its receiver",
    "`null >= 0` is true while `null > 0` is false — relational operators convert, `==` does not",
    "Default `sort` compares stringified elements; it mutates, and `toSorted` does not",
    "Integer-like object keys come first in numeric order, and a later spread overwrites earlier properties",
    "`new Array(3)` is sparse and `map` skips holes; `Array.from({length: 3}, fn)` does not",
    "`includes` treats NaN as equal to itself; `indexOf` does not",
    "Learn the six underlying mechanisms rather than memorising outputs — there are more puzzles than you can remember",
  ],
  status: "available",
};
