import type { Lesson } from "@/content/types";

export const esClassesLesson: Lesson = {
  id: "oop-prototypes-es-classes",
  slug: "es-classes",
  moduleSlug: "oop-prototypes",
  title: "ES Classes: Fields, Methods, Static Members & Inheritance",
  summary:
    "Modern class syntax as cleaner sugar over the prototype chain from the previous lesson — fields, methods, static members, inheritance with extends/super — in JavaScript and TypeScript.",
  estimatedMinutes: 35,
  objectives: [
    "Write a class with fields, methods, and static members",
    "Use extends and super to build an inheritance hierarchy correctly",
    "Explain precisely what class syntax compiles down to",
    "Type class members and constructors in TypeScript",
  ],
  sections: [
    {
      id: "class-basics",
      heading: "Class syntax is sugar over the prototype chain",
      body: [
        "ES2015's `class` keyword doesn't introduce a new object model — it's syntax sugar over exactly the constructor-function-plus-prototype mechanism from the previous lesson, written in a much cleaner, more familiar shape. A `class` declares a `constructor` method (called automatically by `new`), instance fields, and methods that are automatically placed on the class's `.prototype`, just like manually assigning to `Function.prototype` in the previous lesson.",
      ],
      examples: [
        {
          id: "class-basics-example",
          title: "A class, and proof it's still just prototypes underneath",
          js: `class Animal {
  constructor(name) {
    this.name = name; // instance field, unique per instance
  }

  walk() {
    console.log(\`\${this.name} walks\`);
  }
}

const dog = new Animal("Rex");
const cat = new Animal("Whiskers");

dog.walk(); // "Rex walks"

console.log(typeof Animal); // "function" — classes ARE functions under the hood
console.log(dog.walk === cat.walk); // true — still one shared method on the prototype
console.log(Object.getPrototypeOf(dog) === Animal.prototype); // true
console.log(dog.hasOwnProperty("name")); // true — own property
console.log(dog.hasOwnProperty("walk")); // false — inherited, lives on Animal.prototype`,
          explanation:
            "Every one of these checks confirms `class` is the exact same prototype mechanism from the previous lesson, just with far cleaner authoring syntax and a few genuine runtime differences: class bodies always run in strict mode, and — unlike a constructor function — a class **cannot** be called without `new` (`Animal()` without `new` throws a `TypeError`).",
        },
      ],
    },
    {
      id: "fields-and-methods",
      heading: "Instance fields, methods, and private fields",
      body: [
        "Modern class syntax supports declaring fields directly in the class body (outside the constructor), which is initialized for every new instance. Prefixing a field or method name with `#` makes it a genuinely private class member — enforced by the JavaScript engine itself, not just a naming convention — inaccessible and even invisible from outside the class, including to subclasses.",
      ],
      examples: [
        {
          id: "fields-private-example",
          title: "Field declarations and true private fields with #",
          js: `class BankAccount {
  #balance; // private field declaration — only visible inside this class

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
console.log(account.#balance);
// SyntaxError: Private field '#balance' must be declared in an enclosing class`,
          explanation:
            "This is the modern, built-in equivalent of the closure-based private state pattern from Module 2 — but attached to a class instance rather than requiring a factory function. Unlike closures, `#private` fields are visible to every method defined in the same class (including subclass methods only if re-declared — true private fields are not inherited the way protected fields are in other languages).",
        },
      ],
    },
    {
      id: "static-members",
      heading: "Static members: belonging to the class, not the instance",
      body: [
        "A `static` field or method belongs to the **class itself**, not to any individual instance — useful for utility functions related to the class, constants, or factory methods that don't need `this` to refer to a specific instance.",
      ],
      examples: [
        {
          id: "static-members-example",
          title: "Static methods as factories and utilities",
          js: `class Point {
  static origin = new Point(0, 0); // static field

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromArray([x, y]) {
    return new Point(x, y); // static factory method
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

const p1 = Point.fromArray([3, 4]);
console.log(p1.distanceTo(Point.origin)); // 5

console.log(typeof Point.fromArray); // "function" — lives on Point itself
console.log(p1.fromArray); // undefined — NOT available on instances`,
        },
      ],
    },
    {
      id: "inheritance",
      heading: "Inheritance with extends and super",
      body: [
        "`extends` sets up an inheritance relationship between two classes, linking the subclass's prototype to the parent class's prototype (still the same prototype chain mechanism). Inside a subclass constructor, `super(...)` must be called before using `this` — it invokes the parent class's constructor to set up the inherited state. `super.methodName()` calls the parent's version of an overridden method.",
      ],
      examples: [
        {
          id: "inheritance-example",
          title: "A subclass extending a base class",
          js: `class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return \`\${this.name} makes a sound\`;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // must run first — sets up "this.name" via the parent constructor
    this.breed = breed;
  }

  speak() {
    return \`\${super.speak()}, specifically a bark\`; // extends the parent's behavior
  }
}

const rex = new Dog("Rex", "Labrador");
console.log(rex.speak()); // "Rex makes a sound, specifically a bark"
console.log(rex instanceof Dog);    // true
console.log(rex instanceof Animal); // true — the whole point of the chain`,
        },
      ],
      pitfalls: [
        {
          title: "Forgetting super() in a subclass constructor",
          body: "If a subclass defines a `constructor`, it **must** call `super(...)` before accessing `this` — omitting it throws `ReferenceError: Must call super constructor before accessing 'this'`. If the subclass doesn't need to add its own constructor logic at all, it can omit the constructor entirely and JavaScript automatically generates one that just forwards all arguments to `super(...)`.",
        },
      ],
    },
    {
      id: "ts-classes",
      heading: "TypeScript: typed fields, constructors, and inheritance",
      body: [
        "Class fields are typed just like variables. TypeScript checks that a subclass's overridden methods remain compatible with the parent class's method signatures, and that `super()` is called correctly. Full access-modifier syntax (`public`/`private`/`protected`/`readonly`) is covered in depth in the next lesson — here, focus on the structural typing of fields and inheritance itself.",
      ],
      examples: [
        {
          id: "ts-classes-example",
          title: "Typed fields, a typed constructor, and typed inheritance",
          ts: `class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  speak(): string {
    return \`\${this.name} makes a sound\`;
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  speak(): string {
    return \`\${super.speak()}, specifically a bark\`;
  }
}

const rex = new Dog("Rex", "Labrador");
console.log(rex.speak());

function describe(animal: Animal): string {
  return animal.speak();
}
describe(rex); // OK — Dog is structurally (and nominally, via extends) an Animal`,
          explanation:
            "TypeScript would flag it at compile time if `Dog.speak()` returned a type incompatible with `Animal.speak()`'s declared return type, or if `Dog`'s constructor forgot to call `super(name)` with a correctly-typed argument — catching broken inheritance contracts before the code ever runs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is JavaScript's class keyword a genuinely different object model from prototypal inheritance?",
      answer:
        "No. class is syntax sugar over the same constructor-function-and-prototype mechanism covered in the previous lesson. A class is still a function under the hood, its methods are still placed on its .prototype and shared across instances, and instances are still linked via the same prototype chain — class syntax just makes authoring this pattern much cleaner and adds a few real behaviors (like strict mode and requiring new).",
    },
    {
      question: "What is the difference between a private field declared with # and a field just conventionally prefixed with an underscore?",
      answer:
        "A #private field is enforced by the JavaScript engine itself — it's completely inaccessible and not even visible from outside the class (accessing it from outside is a SyntaxError). An underscore-prefixed field like _balance is a plain public property; the underscore is purely a convention signaling 'please don't touch this' with no actual enforcement.",
    },
    {
      question: "What must you do before using this in a subclass constructor, and why?",
      answer:
        "You must call super(...) first. It invokes the parent class's constructor, which is responsible for setting up the inherited instance state. Accessing this before calling super() throws a ReferenceError, because the instance isn't considered properly initialized until the parent constructor has run.",
    },
    {
      question: "What's the difference between a static method and an instance method?",
      answer:
        "A static method belongs to the class itself and is called as ClassName.method() — it has no access to any particular instance's this referring to instance data. An instance method belongs to the class's prototype and is called on individual instances (instance.method()), with this referring to that specific instance.",
    },
    {
      question: "If a subclass doesn't define its own constructor, what happens when you instantiate it with new?",
      answer:
        "JavaScript automatically generates a default constructor for the subclass that simply forwards all received arguments to super(...), calling the parent class's constructor with them unchanged. You only need to write an explicit constructor if the subclass needs additional setup logic beyond what the parent constructor does.",
    },
  ],
  takeaways: [
    "class is syntax sugar over the prototype chain: classes are functions, methods live on .prototype and are shared, instances are linked via the same chain from the previous lesson.",
    "#private fields are true, engine-enforced privacy — unlike an underscore naming convention, which is unenforced.",
    "A subclass constructor must call super(...) before using this; omitting a constructor entirely auto-generates one that forwards arguments to super.",
    "static members belong to the class itself, not to instances — used for factories, utilities, and shared constants.",
    "TypeScript checks that overridden methods stay compatible with the parent class's signatures and that constructors call super correctly, catching broken inheritance at compile time.",
  ],
  status: "available",
};
