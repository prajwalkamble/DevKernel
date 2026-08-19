import type { Lesson } from "@/content/types";

export const iterablesIteratorsLesson: Lesson = {
  id: "arrays-collections-iterables-iterators",
  slug: "iterables-and-iterators",
  moduleSlug: "arrays-collections",
  title: "The Iterable & Iterator Protocols",
  summary:
    "The actual mechanism behind for...of, spread, and destructuring — two small protocols that let you make your own custom objects work with all of JavaScript's built-in iteration syntax.",
  estimatedMinutes: 30,
  objectives: [
    "Explain the iterator protocol and the iterable protocol precisely",
    "Manually drive an iterator with .next()",
    "Make a custom object iterable using Symbol.iterator",
    "Type a custom iterable correctly in TypeScript",
  ],
  sections: [
    {
      id: "why-this-matters",
      heading: "What actually makes for...of work",
      body: [
        "Back in Module 1, `for...of` was introduced as 'the loop for iterating over values'. But *how* does `for...of` know how to get values out of an array, a string, a Map, and a Set — four completely different data structures? The answer is two small, formal protocols every one of those types implements: the **iterator protocol** and the **iterable protocol**. Once you understand them, `for...of`, the spread operator, and array/object destructuring on non-array values all stop being separate pieces of magic and become one single underlying mechanism.",
      ],
    },
    {
      id: "iterator-protocol",
      heading: "The iterator protocol: an object with a .next() method",
      body: [
        "An **iterator** is any object with a `.next()` method that, each time it's called, returns an object of the shape `{ value: any, done: boolean }`. `done: false` means there's a value to use; `done: true` means iteration is finished (and `value` is typically `undefined`). That's the entire protocol — nothing more is required.",
      ],
      examples: [
        {
          id: "manual-iterator-example",
          title: "A hand-written iterator, driven manually",
          js: `function createRangeIterator(start, end) {
  let current = start;
  return {
    next() {
      if (current <= end) {
        return { value: current++, done: false };
      }
      return { value: undefined, done: true };
    },
  };
}

const iterator = createRangeIterator(1, 3);
console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { value: undefined, done: true }`,
          explanation:
            "This `createRangeIterator` object satisfies the iterator protocol completely on its own — but notice it can't be used with `for...of` yet. `for...of` doesn't look for a `.next()` method directly on the thing you're looping over; it looks for something else, covered next.",
        },
      ],
    },
    {
      id: "iterable-protocol",
      heading: "The iterable protocol: a Symbol.iterator method",
      body: [
        "An **iterable** is any object with a method keyed by the special built-in `Symbol.iterator`, which — when called — **returns an iterator** (an object satisfying the protocol above). `for...of`, the spread operator (`...`), `Array.from()`, and destructuring all work by calling `obj[Symbol.iterator]()` to get an iterator, then repeatedly calling `.next()` on it until `done` is `true`.",
        "Arrays, strings, Maps, and Sets all have a built-in `Symbol.iterator` method, which is precisely why they all work with `for...of` — and precisely why a plain object does **not** (it has no `Symbol.iterator` by default), matching what Module 1 said about `for...of` throwing on plain objects.",
      ],
      examples: [
        {
          id: "make-iterable-example",
          title: "Making a custom object work with for...of",
          js: `function createRange(start, end) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current <= end) {
            return { value: current++, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

const range = createRange(1, 4);

for (const n of range) {
  console.log(n); // 1, 2, 3, 4 — for...of just works now!
}

console.log([...range]);         // [1, 2, 3, 4] — spread works too
const [first, second] = range;   // destructuring works too
console.log(first, second);      // 1 2
console.log(Array.from(range));  // [1, 2, 3, 4]`,
          explanation:
            "`createRange` is now a full **iterable**: it has a `[Symbol.iterator]()` method that returns a fresh iterator object each time it's called (important — this is what lets you loop over the same range object multiple times independently). Every JavaScript feature that consumes iterables — `for...of`, spread, destructuring, `Array.from` — now works with it automatically, with zero special-casing.",
        },
      ],
      pitfalls: [
        {
          title: "Confusing 'iterable' and 'iterator' — they're related but distinct roles",
          body: "An iterable is 'a thing you can get an iterator FROM' (has Symbol.iterator). An iterator is 'the thing that actually produces values one at a time' (has .next()). Many iterators are also conveniently iterable themselves (their own Symbol.iterator just returns `this`), which is why you can sometimes use one interchangeably with the other — but conceptually they answer different questions.",
        },
      ],
    },
    {
      id: "ts-iterables",
      heading: "TypeScript: typing a custom iterable correctly",
      body: [
        "TypeScript provides built-in generic interfaces — `Iterable<T>`, `Iterator<T>`, and `IterableIterator<T>` (an object that's both) — for describing exactly this shape. Implementing `Iterable<T>` on a custom class means TypeScript will let it be used anywhere a `for...of` loop, spread, or `Array.from` is expected, with full type checking on the values produced.",
      ],
      examples: [
        {
          id: "ts-iterable-class-example",
          title: "A typed, iterable Range class",
          ts: `class Range implements Iterable<number> {
  constructor(private start: number, private end: number) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;
    return {
      next(): IteratorResult<number> {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 3);

for (const n of range) {
  console.log(n); // 1, 2, 3 — n is correctly typed as 'number'
}

const total: number = [...range].reduce((sum, n) => sum + n, 0);
console.log(total); // 6`,
          explanation:
            "`implements Iterable<number>` is both documentation and a compiler-enforced contract: TypeScript checks that `[Symbol.iterator]()` really does return a valid `Iterator<number>`. In return, every consumer of `range` — the `for...of` loop, the spread inside `[...range]` — correctly infers `n` and the array elements as `number`, with no manual annotation needed at the call sites.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the iterator protocol?",
      answer:
        "Any object that has a .next() method which, when called repeatedly, returns objects of the shape { value, done: boolean } — done: false while there are more values, done: true once iteration is complete. That's the entire protocol; nothing else is required for something to be an iterator.",
    },
    {
      question: "What is the iterable protocol, and how does it differ from the iterator protocol?",
      answer:
        "An iterable is any object with a method keyed by Symbol.iterator that, when called, returns an iterator. The iterable protocol is about being able to produce an iterator on demand; the iterator protocol (a separate, related concept) is about the object that actually steps through values one at a time via .next(). An object can satisfy both roles at once, but they answer different questions.",
    },
    {
      question: "Why does for...of work on arrays, strings, Maps, and Sets, but not on a plain object?",
      answer:
        "for...of works by calling obj[Symbol.iterator]() to get an iterator and then repeatedly calling .next() on it. Arrays, strings, Maps, and Sets all have a built-in Symbol.iterator method. A plain object literal does not have one by default, so it doesn't satisfy the iterable protocol and for...of throws when used on it directly.",
    },
    {
      question: "What does it mean, practically, to make a custom JavaScript object work with for...of, spread, and destructuring all at once?",
      answer:
        "You give it a [Symbol.iterator]() method that returns an object satisfying the iterator protocol (a .next() method returning { value, done }). Once that's implemented, every built-in feature that consumes iterables — for...of, the spread operator, array destructuring, Array.from — works with the custom object automatically, with no additional special-casing needed for each one.",
    },
    {
      question: "What TypeScript interfaces would you use to type a custom iterable class, and what does implementing them get you?",
      answer:
        "Iterable<T> for the class itself (implements Iterable<number>, for example), and the return type of its [Symbol.iterator]() method as Iterator<T> (or IterableIterator<T> if the same object serves both roles). Implementing these lets the compiler verify the iterator shape is correct and lets every consumer (for...of, spread, Array.from) infer the produced element type automatically.",
    },
  ],
  takeaways: [
    "The iterator protocol: an object with .next() returning { value, done }. The iterable protocol: an object with a Symbol.iterator method that returns an iterator.",
    "for...of, spread, destructuring, and Array.from all work by calling Symbol.iterator to get an iterator, then calling .next() until done is true — one mechanism powering all of them.",
    "Plain objects lack Symbol.iterator by default, which is exactly why for...of throws on them while it works fine on arrays, strings, Maps, and Sets.",
    "Implementing [Symbol.iterator]() on a custom object/class makes it work with every iteration-consuming feature in the language at once, with no per-feature special-casing.",
    "TypeScript's Iterable<T>/Iterator<T> interfaces let the compiler verify a custom iterable's shape and propagate the correct element type to every consumer automatically.",
  ],
  status: "available",
};
