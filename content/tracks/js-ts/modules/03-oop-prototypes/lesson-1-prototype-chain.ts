import type { Lesson } from "@/content/types";

export const prototypeChainLesson: Lesson = {
  id: "oop-prototypes-prototype-chain",
  slug: "prototype-chain",
  moduleSlug: "oop-prototypes",
  title: "The Prototype Chain & Object.create",
  summary:
    "How JavaScript actually implements inheritance under the hood — every object's hidden link to another object — and why understanding this makes class syntax (next lesson) make sense instead of feeling magic.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what the prototype chain is and how property lookup traverses it",
    "Use Object.create and Object.getPrototypeOf directly",
    "Distinguish an object's own properties from inherited ones",
    "Understand why classes are often described as 'syntax sugar' over this mechanism",
  ],
  sections: [
    {
      id: "what-is-a-prototype",
      heading: "Every object has a hidden link to another object",
      body: [
        "JavaScript's object system is fundamentally different from the classical (class-based) inheritance you might know from other languages. Instead, it uses **prototypal inheritance**: every object has an internal, hidden link to another object called its **prototype**. When you try to read a property that doesn't exist directly on an object, JavaScript doesn't just fail — it follows that link and looks on the prototype, then the prototype's prototype, and so on, until it either finds the property or reaches the end of the chain (`null`).",
        "This sequence of linked objects is the **prototype chain**. It's the actual mechanism behind everything that looks like 'inheritance' in JavaScript — including every array method (`.map`, `.filter`) you've used, which live on `Array.prototype`, not on each individual array.",
      ],
      examples: [
        {
          id: "prototype-lookup",
          title: "Property lookup walking the prototype chain",
          js: `const animal = {
  eats: true,
  walk() {
    console.log("Animal walks");
  },
};

const rabbit = Object.create(animal); // rabbit's prototype is set to animal
rabbit.jumps = true;

console.log(rabbit.jumps); // true — own property, found directly on rabbit
console.log(rabbit.eats);  // true — not on rabbit itself, found on its prototype (animal)
rabbit.walk();              // "Animal walks" — method found via the prototype chain

console.log(Object.getPrototypeOf(rabbit) === animal); // true
console.log(rabbit.hasOwnProperty("eats"));  // false — inherited, not own
console.log(rabbit.hasOwnProperty("jumps")); // true — own property`,
          explanation:
            "`Object.create(animal)` creates a brand-new object whose prototype is explicitly `animal`. Reading `rabbit.eats` doesn't find it directly on `rabbit`, so the engine automatically checks `rabbit`'s prototype (`animal`) next, finds it there, and returns it — completely transparently to the code reading `rabbit.eats`.",
        },
      ],
    },
    {
      id: "chain-length-and-arrays",
      heading: "The chain can be many links long — arrays and objects included",
      body: [
        "The prototype chain isn't limited to one link. Every plain object you create with `{}` automatically has its prototype set to `Object.prototype`, which is where general-purpose methods like `.toString()` and `.hasOwnProperty()` live. Arrays go one step further: an array's prototype is `Array.prototype` (giving you `.map`, `.filter`, `.push`, etc.), and `Array.prototype`'s own prototype is `Object.prototype`. The chain always terminates at `Object.prototype`, whose own prototype is `null` — the end of the line.",
      ],
      examples: [
        {
          id: "chain-for-arrays",
          title: "An array's full prototype chain",
          js: `const numbers = [1, 2, 3];

console.log(Object.getPrototypeOf(numbers) === Array.prototype);        // true
console.log(Object.getPrototypeOf(Array.prototype) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype)); // null — end of the chain

// This is why every array can call both array methods AND generic object methods:
console.log(numbers.map((n) => n * 2)); // from Array.prototype
console.log(numbers.toString());        // from Object.prototype (overridden by Array.prototype, actually)
console.log(numbers.hasOwnProperty(0)); // from Object.prototype`,
        },
      ],
      pitfalls: [
        {
          title: "for...in walks the whole chain — that's why Module 1 warned against it for arrays",
          body: "Back in the Control Flow lesson, `for...in` was flagged as risky on arrays because it iterates enumerable properties from the *entire* prototype chain, not just an object's own properties. Now you know exactly why: if anything (a library, or you) adds an enumerable property to `Array.prototype`, every `for...in` loop over every array in your program will suddenly see it too.",
        },
      ],
    },
    {
      id: "shadowing",
      heading: "Shadowing: own properties hide prototype properties",
      body: [
        "If you assign a property directly onto an object that shares its name with something on the prototype chain, the own property **shadows** (hides) the inherited one for reads — but the prototype's version is completely untouched and still shared by any other object using that same prototype.",
      ],
      examples: [
        {
          id: "shadowing-example",
          title: "Assigning a property creates an own property that shadows the inherited one",
          js: `const animal = { eats: true };
const rabbit = Object.create(animal);

console.log(rabbit.eats); // true — inherited from animal

rabbit.eats = false; // this does NOT change animal.eats — it creates a new own property on rabbit
console.log(rabbit.eats); // false — own property now shadows the inherited one
console.log(animal.eats); // true — completely unaffected

const anotherRabbit = Object.create(animal);
console.log(anotherRabbit.eats); // true — still sees the original, unmodified animal.eats`,
          explanation:
            "This is a crucial and often-missed distinction: *reading* a property walks up the chain, but *writing* a property (with plain assignment) always creates or updates an own property on the object you assigned to — it never reaches up and mutates something on the prototype.",
        },
      ],
    },
    {
      id: "constructor-functions-preview",
      heading: "How prototypes power constructor functions (the pre-class mechanism)",
      body: [
        "Before ES2015 classes existed, this exact prototype mechanism was how you built reusable 'types': every function in JavaScript automatically gets a `.prototype` object, and calling that function with `new` (from Module 2's `this` lesson) creates a new object whose prototype is set to the function's `.prototype`. Methods placed on `Function.prototype` are shared by every instance, rather than being recreated on each individual object — which is both faster and more memory-efficient than attaching a fresh copy of every method to every instance.",
      ],
      examples: [
        {
          id: "constructor-function-example",
          title: "Shared methods via a constructor function's prototype",
          js: `function Animal(name) {
  this.name = name; // own property, unique per instance
}

Animal.prototype.walk = function () {
  console.log(\`\${this.name} walks\`);
}; // shared by every instance, stored once

const dog = new Animal("Rex");
const cat = new Animal("Whiskers");

dog.walk(); // "Rex walks"
cat.walk(); // "Whiskers walks"

console.log(dog.walk === cat.walk); // true — the exact same function, shared via the prototype
console.log(dog.hasOwnProperty("walk")); // false — it's inherited, not own`,
          explanation:
            "This is precisely what the `class` syntax in the next lesson compiles down to — a class's methods are placed on the prototype automatically, giving you the same sharing behavior with much cleaner syntax. Seeing the manual version first is what makes class syntax click instead of feeling like magic.",
        },
      ],
    },
    {
      id: "ts-prototype-chain",
      heading: "TypeScript: the same runtime mechanism, checked structurally",
      body: [
        "The prototype chain is pure JavaScript runtime behavior — TypeScript doesn't change how it works at all. What TypeScript adds is **static structural checking**: as long as an object's *shape* matches a type (has the right properties with the right types), TypeScript accepts it — it doesn't care whether that shape came from an own property or one inherited via the prototype chain, and it doesn't track prototype chains explicitly the way it tracks class hierarchies (covered in the OOP lessons ahead).",
      ],
      examples: [
        {
          id: "ts-object-create",
          title: "Typing Object.create explicitly",
          ts: `interface Animal {
  eats: boolean;
  walk(): void;
}

const animalProto: Animal = {
  eats: true,
  walk() {
    console.log("Animal walks");
  },
};

// Object.create's return type is 'any' by default in TypeScript's lib types,
// so an explicit annotation keeps it type-safe:
const rabbit: Animal & { jumps: boolean } = Object.assign(
  Object.create(animalProto),
  { jumps: true }
);

rabbit.walk();              // OK
console.log(rabbit.jumps);  // OK, typed as boolean`,
          explanation:
            "In practice, modern TypeScript code almost always uses `class` (next lesson) instead of manually calling `Object.create`, precisely because TypeScript's type system integrates far more smoothly with class hierarchies than with raw prototype manipulation — `Object.create`'s return type is untyped (`any`) by default, requiring manual annotation like this to stay safe.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the prototype chain?",
      answer:
        "A sequence of linked objects: every object has an internal link to another object (its prototype). When a property lookup doesn't find the property directly on an object, JavaScript automatically checks that object's prototype, then its prototype's prototype, and so on, until the property is found or the chain ends at null (Object.prototype's own prototype).",
    },
    {
      question: "What's the difference between an object's own property and an inherited property?",
      answer:
        "An own property exists directly on that specific object (checkable with hasOwnProperty). An inherited property is found further up the prototype chain, on one of the object's prototypes, not on the object itself — reading it still works transparently, but hasOwnProperty returns false for it.",
    },
    {
      question: "If you write `rabbit.eats = false` where eats was previously inherited from rabbit's prototype, what happens to the prototype?",
      answer:
        "Nothing — the prototype is untouched. Plain assignment always creates or updates an own property on the object being assigned to; it never writes through to the prototype chain. The new own property on rabbit simply shadows (hides) the inherited one for future reads on rabbit specifically.",
    },
    {
      question: "Why do all arrays share the same .map, .filter, and .push methods instead of each array having its own copy?",
      answer:
        "Those methods live once on Array.prototype, and every array's internal prototype link points to that same shared object. Property lookup for array.map finds it via the prototype chain rather than on the array itself, so there's exactly one copy of each method shared by every array in memory, not a duplicate per array.",
    },
    {
      question: "Before ES2015 classes existed, how did JavaScript developers create reusable 'types' with shared methods?",
      answer:
        "Using constructor functions together with their automatic .prototype object: instance-specific data was assigned with 'this.property = value' inside the constructor function, while shared methods were attached once to Function.prototype. Calling the function with new created a new object whose internal prototype was set to that Function.prototype, giving every instance access to the shared methods via the prototype chain.",
    },
  ],
  takeaways: [
    "Every object has a hidden prototype link; property lookup walks up this chain until it finds the property or hits the end (null).",
    "hasOwnProperty distinguishes an object's own properties from ones it only has access to via inheritance through the prototype chain.",
    "Writing a property always creates/updates an own property — it shadows an inherited one without ever mutating the prototype itself.",
    "Constructor functions plus Function.prototype are the pre-ES2015 mechanism for shared methods — and exactly what class syntax compiles down to.",
    "TypeScript checks object shapes structurally regardless of whether properties are own or inherited; it doesn't change the underlying runtime prototype mechanism at all.",
  ],
  status: "available",
};
