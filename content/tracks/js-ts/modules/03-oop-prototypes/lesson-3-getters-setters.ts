import type { Lesson } from "@/content/types";

export const gettersSettersLesson: Lesson = {
  id: "oop-prototypes-getters-setters",
  slug: "getters-setters-computed-properties",
  moduleSlug: "oop-prototypes",
  title: "Getters, Setters & Computed Properties",
  summary:
    "Making property access run custom logic behind the scenes with get/set, building dynamic property names with computed property syntax, and a look at the property descriptors powering all of it.",
  estimatedMinutes: 25,
  objectives: [
    "Define and use getters and setters in objects and classes",
    "Use computed property names to build dynamic keys",
    "Explain what a property descriptor is at a basic level",
    "Type getters and setters correctly in TypeScript",
  ],
  sections: [
    {
      id: "getters-setters-basics",
      heading: "Getters and setters: properties that run code",
      body: [
        "A **getter** (`get`) lets you define a property that, when *read*, actually runs a function and returns its result — from the outside it looks exactly like a normal property access, not a method call (no parentheses). A **setter** (`set`) does the same for *writing* to a property, letting you run validation or side effects on assignment. Both work in object literals and in classes.",
      ],
      examples: [
        {
          id: "getter-setter-object",
          title: "Getters and setters on a plain object",
          js: `const rectangle = {
  width: 10,
  height: 5,

  get area() {
    return this.width * this.height; // computed on every read, not stored
  },

  set area(value) {
    // pick a strategy: here, scale width to hit the target area
    this.width = value / this.height;
  },
};

console.log(rectangle.area); // 50 — read like a property, no parentheses
rectangle.width = 20;
console.log(rectangle.area); // 100 — recomputed automatically, always in sync

rectangle.area = 25; // calls the setter
console.log(rectangle.width); // 5 — width was recalculated`,
          explanation:
            "Notice `rectangle.area` is read and written exactly like a plain data property — the caller has no idea (and shouldn't need to know) that it's actually running a function. This is the core benefit: it lets you start with a simple stored property and later swap in computed logic without changing any calling code.",
        },
        {
          id: "getter-setter-class",
          title: "Getters and setters in a class, with validation",
          js: `class Temperature {
  #celsius;

  constructor(celsius) {
    this.#celsius = celsius;
  }

  get fahrenheit() {
    return this.#celsius * 9 / 5 + 32;
  }

  set fahrenheit(value) {
    this.#celsius = (value - 32) * 5 / 9;
  }

  get celsius() {
    return this.#celsius;
  }

  set celsius(value) {
    if (value < -273.15) {
      throw new Error("Temperature below absolute zero is not physically possible");
    }
    this.#celsius = value;
  }
}

const temp = new Temperature(25);
console.log(temp.fahrenheit); // 77
temp.fahrenheit = 32;
console.log(temp.celsius);    // 0

temp.celsius = -300; // throws — setter validation runs on every assignment`,
          explanation:
            "Combining a setter with a `#private` field (from the previous lesson) is one of the most common real uses of getters/setters: it lets you enforce invariants (like 'never allow an impossible temperature') on every single assignment, something a plain public field could never guarantee.",
        },
      ],
      pitfalls: [
        {
          title: "A getter without a matching setter makes a property read-only — silently",
          body: "If you define only a `get area()` with no `set area()`, attempting `rectangle.area = 100` does nothing in non-strict mode (the assignment is silently ignored) or throws a `TypeError` in strict mode (which class bodies and ES modules always use). This is a deliberate, useful pattern for exposing a computed, read-only value.",
        },
      ],
    },
    {
      id: "computed-properties",
      heading: "Computed property names",
      body: [
        "Normally, an object literal's keys are written as fixed identifiers or string literals. **Computed property names** (`[expression]: value`) let you use the result of any expression as a property key, evaluated at the time the object is created — essential for building objects with dynamic keys, like grouping data by a variable field name.",
      ],
      examples: [
        {
          id: "computed-properties-example",
          title: "Building dynamic keys with computed property syntax",
          js: `const key = "score";
const dynamicValue = 42;

const obj = {
  [key]: dynamicValue,          // key becomes "score"
  [\`\${key}_doubled\`]: dynamicValue * 2, // any expression works, including template literals
};

console.log(obj); // { score: 42, score_doubled: 84 }

// A practical use: grouping an array of records by a dynamic field
function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const groupKey = keyFn(item);
    groups[groupKey] ??= []; // Module 1's ?? operator, initializing if missing
    groups[groupKey].push(item);
  }
  return groups;
}

const users = [
  { name: "Ada", role: "admin" },
  { name: "Alan", role: "member" },
  { name: "Grace", role: "admin" },
];

console.log(groupBy(users, (u) => u.role));
// { admin: [Ada, Grace], member: [Alan] } — keys built dynamically from data`,
        },
      ],
    },
    {
      id: "property-descriptors",
      heading: "A glimpse under the hood: property descriptors",
      body: [
        "Every property on an object is actually backed by a **property descriptor** — metadata controlling whether it's writable, enumerable (shows up in `for...in`/`Object.keys`), and configurable (can be deleted/redefined), in addition to `get`/`set` or a plain `value`. Getters/setters and computed properties are ordinary JavaScript features built directly on top of this same descriptor system, which you can also manipulate manually with `Object.defineProperty` for advanced cases (rarely needed day-to-day, but worth recognizing).",
      ],
      examples: [
        {
          id: "property-descriptor-example",
          title: "Inspecting and manually defining a descriptor",
          js: `const obj = { x: 1 };
console.log(Object.getOwnPropertyDescriptor(obj, "x"));
// { value: 1, writable: true, enumerable: true, configurable: true }

Object.defineProperty(obj, "y", {
  value: 2,
  writable: false,   // read-only
  enumerable: false, // hidden from for...in and Object.keys
});

obj.y = 100; // silently fails (or throws in strict mode) — writable: false
console.log(obj.y);              // 2 — unchanged
console.log(Object.keys(obj));   // ["x"] — "y" is hidden, enumerable: false`,
          explanation:
            "This is exactly the mechanism `Object.freeze()` (mentioned in Module 1) uses internally — it sets `writable: false` and `configurable: false` on every property. You rarely need `Object.defineProperty` directly, but recognizing it clarifies that getters/setters aren't a separate special case — they're just one more thing a descriptor can specify instead of a plain `value`.",
        },
      ],
    },
    {
      id: "ts-getters-setters",
      heading: "TypeScript: typed getters and setters",
      body: [
        "TypeScript types the getter's return type and the setter's parameter type independently — and as of modern TypeScript versions, they're even allowed to differ (e.g. a setter that accepts a looser input type than the getter returns), which is useful for permissive-input, strict-output APIs.",
      ],
      examples: [
        {
          id: "ts-getter-setter-example",
          title: "Typed getter/setter pair",
          ts: `class Temperature {
  #celsius: number;

  constructor(celsius: number) {
    this.#celsius = celsius;
  }

  get fahrenheit(): number {
    return (this.#celsius * 9) / 5 + 32;
  }

  set fahrenheit(value: number) {
    this.#celsius = ((value - 32) * 5) / 9;
  }
}

const temp = new Temperature(25);
const f: number = temp.fahrenheit; // OK — getter's declared return type is number
temp.fahrenheit = "98.6";
// Error: Type 'string' is not assignable to type 'number'.`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What's the difference between a getter and a regular method?",
      answer:
        "A getter is accessed like a plain property — no parentheses — even though it runs a function behind the scenes to compute its value on every read. A regular method must always be explicitly called with parentheses. Getters are meant for values that conceptually are a property of the object, just computed rather than stored.",
    },
    {
      question: "What happens if you try to assign to a property that only has a getter defined, no setter?",
      answer:
        "The assignment is silently ignored in non-strict mode, or throws a TypeError in strict mode (which applies inside classes and ES modules by default). Defining a getter with no matching setter is a deliberate, common pattern for exposing a computed, read-only value.",
    },
    {
      question: "What is a computed property name, and give an example of when it's necessary?",
      answer:
        "Syntax for using the result of an expression, evaluated at object-creation time, as an object literal's key: { [expression]: value }. It's necessary whenever a property key isn't known until runtime — for example, grouping an array of records into an object keyed by a field whose name is stored in a variable.",
    },
    {
      question: "What is a property descriptor?",
      answer:
        "The underlying metadata JavaScript stores for every object property, controlling whether it's writable, enumerable (visible to for...in/Object.keys), and configurable (deletable/redefinable), plus either a value or a get/set pair. Getters, setters, and functions like Object.freeze are all built on top of this same descriptor system.",
    },
    {
      question: "Can a TypeScript getter and its corresponding setter have different types?",
      answer:
        "Yes, in modern TypeScript versions a setter's parameter type is allowed to differ from the getter's return type — useful for a permissive-input, strict-output API, such as a setter that accepts a string or number but a getter that always returns a normalized number.",
    },
  ],
  takeaways: [
    "Getters/setters make property access run custom logic while still looking like plain property access from the outside — no parentheses.",
    "A getter with no setter creates a read-only computed property; assignment is silently ignored or throws in strict mode.",
    "Computed property names ([expr]: value) let object keys be built from any expression at creation time — essential for dynamic keys.",
    "Every property is backed by a descriptor (value/get/set, writable, enumerable, configurable) — getters/setters and Object.freeze are both built on this same system.",
    "TypeScript types a getter's return and a setter's parameter independently, and modern TypeScript even allows them to differ.",
  ],
  status: "available",
};
