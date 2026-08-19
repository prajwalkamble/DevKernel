import type { Lesson } from "@/content/types";

export const tsGenericsCollectionsLesson: Lesson = {
  id: "arrays-collections-ts-generics-collections",
  slug: "ts-generics-for-custom-collections",
  moduleSlug: "arrays-collections",
  title: "TypeScript Generics for Custom Collection Types",
  summary:
    "Bringing together everything in this module — generics, iterables, and generators — to build your own fully-typed, iterable collection class from scratch, the same way Array<T> and Map<K, V> are built.",
  estimatedMinutes: 35,
  objectives: [
    "Write a generic class with its own type parameter",
    "Make a custom generic class iterable using a generator method",
    "Use multiple type parameters and constraints on a custom collection",
    "Use a default type parameter for a more convenient generic API",
  ],
  sections: [
    {
      id: "generic-class-basics",
      heading: "A generic class: a type parameter on the class itself",
      body: [
        "Module 2 introduced generic *functions*. The exact same idea applies to **classes**: a type parameter declared on the class (`class Stack<T>`) is available throughout every method, letting the whole class work correctly, with full type safety, for whatever specific type `T` ends up being at each usage site — without ever writing `any`.",
      ],
      examples: [
        {
          id: "generic-stack-example",
          title: "A generic Stack<T>",
          ts: `class Stack<T> {
  #items: T[] = [];

  push(item: T): void {
    this.#items.push(item);
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  peek(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  get size(): number {
    return this.#items.length;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push("3");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.
console.log(numberStack.pop()); // 2, inferred as number | undefined

const stringStack = new Stack<string>(); // the SAME class, now specialized for strings
stringStack.push("hello");
console.log(stringStack.pop()?.toUpperCase()); // OK — TypeScript knows this is a string`,
          explanation:
            "One class definition, `Stack<T>`, correctly produces both a `Stack<number>` and a `Stack<string>` (or a stack of anything else) — each fully type-checked as if you'd hand-written a separate class for every type, without actually duplicating any code. This mirrors exactly how `#private` fields from Module 3 combine with generics here for real encapsulation plus real type safety.",
        },
      ],
    },
    {
      id: "generic-iterable-collection",
      heading: "Making a custom generic collection iterable",
      body: [
        "Combining this lesson with the Iterables and Generators lessons earlier in this module: implementing `[Symbol.iterator]` as a **generator method** is the easiest way to make a custom generic collection work with `for...of` and spread — you get the full iterable protocol with just a few lines, and TypeScript infers the correct yielded type automatically.",
      ],
      examples: [
        {
          id: "generic-linked-list-example",
          title: "A generic, iterable LinkedList<T>",
          ts: `class ListNode<T> {
  next: ListNode<T> | null = null;
  constructor(public value: T) {}
}

class LinkedList<T> {
  #head: ListNode<T> | null = null;
  #tail: ListNode<T> | null = null;

  add(value: T): void {
    const node = new ListNode(value);
    if (!this.#tail) {
      this.#head = this.#tail = node;
    } else {
      this.#tail.next = node;
      this.#tail = node;
    }
  }

  *[Symbol.iterator](): Generator<T> {
    let current = this.#head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

const list = new LinkedList<string>();
list.add("a");
list.add("b");
list.add("c");

for (const value of list) {
  console.log(value.toUpperCase()); // "A", "B", "C" — value correctly typed as string
}

console.log([...list]); // ["a", "b", "c"]`,
          explanation:
            "`*[Symbol.iterator]()` is a **generator method** — the `*` marks it as a generator, placed on the special `Symbol.iterator` key. This single method gives `LinkedList<T>` full `for...of`/spread support for free, exactly like the built-in `Array<T>`, `Map<K, V>`, and `Set<T>` do internally — you're now building the same kind of collection the language ships with, with the same ergonomics.",
        },
      ],
    },
    {
      id: "multiple-type-parameters-constraints",
      heading: "Multiple type parameters and constraints",
      body: [
        "A generic type can declare more than one type parameter — exactly how the built-in `Map<K, V>` works — and each parameter can carry its own constraint (from Module 2's generics introduction), restricting what's allowed for that specific parameter independently.",
      ],
      examples: [
        {
          id: "generic-cache-example",
          title: "A generic cache with two type parameters and a constraint",
          ts: `class Cache<K extends string | number, V> {
  #store = new Map<K, V>();

  set(key: K, value: V): void {
    this.#store.set(key, value);
  }

  get(key: K): V | undefined {
    return this.#store.get(key);
  }

  getOrCompute(key: K, compute: () => V): V {
    if (this.#store.has(key)) {
      return this.#store.get(key)!; // '!' asserts non-null — safe, since .has() confirmed it
    }
    const value = compute();
    this.#store.set(key, value);
    return value;
  }
}

const userCache = new Cache<number, { name: string }>();
userCache.set(1, { name: "Ada" });

const expensiveResult = userCache.getOrCompute(2, () => {
  console.log("Computing...");
  return { name: "Alan" };
});
console.log(userCache.getOrCompute(2, () => {
  console.log("This won't log — already cached");
  return { name: "Alan" };
}));`,
          explanation:
            "`K extends string | number` restricts the key type to something sensible for a cache key, while `V` is left completely open — the two parameters are independent. Internally, `Cache<K, V>` is just composing a private `Map<K, V>` (composition over reimplementation, echoing Module 3's composition lesson) rather than reinventing key-value storage from scratch.",
        },
      ],
    },
    {
      id: "default-type-parameters",
      heading: "Default type parameters, and tying it back to the built-ins",
      body: [
        "Like function parameters, generic type parameters can have a **default**, used whenever the caller doesn't explicitly supply one. This is what makes writing `Array<any>` unnecessary in older code, or lets a generic class offer a sensible fallback type when a more specific one isn't provided.",
      ],
      examples: [
        {
          id: "default-type-parameter-example",
          title: "A default type parameter",
          ts: `class Box<T = unknown> {
  constructor(public value: T) {}
}

const anyBox = new Box("hello"); // T inferred as string, default unused
const explicitBox: Box = new Box("world"); // Box with no <T> uses the default: Box<unknown>

// Everything you've used throughout this module is built exactly this way:
const numbers: Array<number> = [1, 2, 3];   // Array<T>
const scores: Map<string, number> = new Map(); // Map<K, V>
const tags: Set<string> = new Set();         // Set<T>
// Stack<T>, LinkedList<T>, and Cache<K, V> from this lesson are the SAME kind
// of type — you've just been building your own versions of what TypeScript's
// own standard library provides.`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does a generic class differ from a generic function, conceptually?",
      answer:
        "The mechanism is the same generic type parameter concept from Module 2, just declared on the class itself (class Stack<T>) instead of on a single function. The type parameter is then available throughout every method and property of the class, letting one class definition work correctly and type-safely for whatever specific type is chosen per instance (Stack<number>, Stack<string>, etc.).",
    },
    {
      question: "What does implementing `*[Symbol.iterator]()` as a generator method on a class give you?",
      answer:
        "It makes the class fully compatible with for...of, the spread operator, and destructuring, by satisfying the iterable protocol using a generator instead of manually implementing a .next()-returning object — the generator's yield statements automatically produce correctly-typed { value, done } results, combining the Iterables and Generators lessons from earlier in this module.",
    },
    {
      question: "Can a generic type have more than one type parameter, and can each have its own constraint?",
      answer:
        "Yes — Map<K, V> is the built-in example. A custom generic type can declare multiple independent type parameters, each with its own constraint, e.g. class Cache<K extends string | number, V> restricts only the key type while leaving the value type V completely open.",
    },
    {
      question: "What does a default type parameter do, e.g. `class Box<T = unknown>`?",
      answer:
        "It supplies a fallback type used whenever the type parameter isn't explicitly specified and can't be inferred from context — for example, declaring a variable as just `Box` (with no <T>) would use Box<unknown> as the default, rather than requiring the type argument to always be written out.",
    },
    {
      question: "Why is building a custom generic, iterable collection class a useful exercise, given TypeScript already ships Array, Map, and Set?",
      answer:
        "It demonstrates that Array<T>, Map<K, V>, and Set<T> aren't special compiler magic — they're built from the exact same tools available to any developer: generic type parameters, private state, and the iterable protocol (often implemented via a generator method). Understanding this makes it straightforward to build your own domain-specific typed, iterable collections (like a LinkedList<T> or a Cache<K, V>) when the built-ins don't fit a specific need.",
    },
  ],
  takeaways: [
    "A generic class (class Stack<T>) makes its type parameter available throughout all its methods, letting one class definition work type-safely for any specific T.",
    "Implementing *[Symbol.iterator]() as a generator method is the easiest way to make a custom generic class fully compatible with for...of and spread.",
    "Generic types can have multiple independent type parameters, each with its own constraint, exactly like the built-in Map<K, V>.",
    "Default type parameters (T = SomeType) supply a fallback when a generic type argument isn't explicitly given or inferred.",
    "Array<T>, Map<K, V>, and Set<T> are built from the same generics + iterable-protocol tools covered in this module — not special compiler magic — so you can build your own typed collections the same way.",
  ],
  status: "available",
};
