import type { Lesson } from "@/content/types";

export const mixinsCompositionLesson: Lesson = {
  id: "oop-prototypes-mixins-composition",
  slug: "mixins-and-composition",
  moduleSlug: "oop-prototypes",
  title: "Mixins & Composition Over Inheritance",
  summary:
    "Why deep inheritance hierarchies become fragile, the 'favor composition over inheritance' principle in practice, and mixins — the pattern JavaScript uses to share behavior across classes without single-inheritance limits.",
  estimatedMinutes: 25,
  objectives: [
    "Explain the fragile base class problem",
    "Distinguish 'is-a' inheritance relationships from 'has-a'/'can-do' composition relationships",
    "Write and apply mixins to combine behavior from multiple sources",
    "Type a mixin function correctly in TypeScript",
  ],
  sections: [
    {
      id: "fragile-base-class",
      heading: "Why deep inheritance hierarchies get fragile",
      body: [
        "Inheritance (`extends`, from earlier in this module) models an **'is-a'** relationship: a `Dog` *is an* `Animal`. This works well for one or two levels, but as hierarchies grow deeper (`Manager extends Employee extends Person`) or need to combine unrelated capabilities (a `FlyingCar` that's both a `Car` and can `fly()` like a `Bird`), inheritance runs into two structural problems: a class can only extend **one** parent (from the previous lesson), and changes to a base class can unexpectedly ripple through every descendant — the well-known **fragile base class problem**.",
        "This is the concrete reasoning behind the famous object-oriented design principle: **'favor composition over inheritance.'** Instead of building a rigid, deep 'is-a' tree, you build small, focused, independent pieces of behavior and combine ('compose') them into the objects that need them — a **'has-a'** or **'can-do'** relationship instead.",
      ],
      examples: [
        {
          id: "fragile-base-class-example",
          title: "Where a single inheritance chain breaks down",
          js: `// The "is-a" chain works fine at first...
class Animal {
  constructor(name) { this.name = name; }
}
class Bird extends Animal {
  fly() { console.log(\`\${this.name} flies\`); }
}

// ...until you need a Penguin: a Bird that CANNOT fly.
class Penguin extends Bird {
  fly() {
    throw new Error("Penguins can't fly!"); // forced to override and break the contract
  }
}
// Any code written generically against "Bird" and trusting .fly() now has to
// specifically know to check for Penguin — the hierarchy itself lied.`,
          explanation:
            "The problem isn't a coding mistake — it's structural. Modeling 'flying' as something every `Bird` inherits assumes all birds fly, which is false. This is exactly the kind of design trap deep or overly-general inheritance hierarchies fall into, and it's why composing smaller, more accurate capabilities (a `CanFly` behavior only birds that actually fly have) tends to age better than one rigid tree.",
        },
      ],
    },
    {
      id: "composition-example",
      heading: "Composition: building objects out of smaller, focused pieces",
      body: [
        "Composition means an object **has** (or delegates to) other objects/behaviors, rather than inheriting them from a single parent. In JavaScript, this often looks like combining plain objects with `Object.assign` or spread, or a class holding references to smaller collaborator objects instead of extending a shared base.",
      ],
      examples: [
        {
          id: "composition-basic-example",
          title: "Composing behavior instead of inheriting it",
          js: `const canFly = {
  fly() {
    console.log(\`\${this.name} flies\`);
  },
};

const canSwim = {
  swim() {
    console.log(\`\${this.name} swims\`);
  },
};

function createDuck(name) {
  return Object.assign({ name }, canFly, canSwim); // composes exactly the behaviors a duck has
}

function createPenguin(name) {
  return Object.assign({ name }, canSwim); // no canFly — correctly excluded, no override needed
}

const duck = createDuck("Duck");
duck.fly();  // "Duck flies"
duck.swim(); // "Duck swims"

const penguin = createPenguin("Pingu");
penguin.swim();          // "Pingu swims"
console.log(penguin.fly); // undefined — never had this capability to begin with, no broken override`,
          explanation:
            "Notice there's no hierarchy to fight here — `createPenguin` simply never composes in `canFly`, so there's no inherited-but-wrong method to override or throw from. Each capability (`canFly`, `canSwim`) is independent and reusable across any object that needs it.",
        },
      ],
    },
    {
      id: "mixins",
      heading: "Mixins: bringing composition to classes",
      body: [
        "Since a JavaScript/TypeScript class can only `extends` one base class, **mixins** are the standard pattern for sharing behavior across multiple, unrelated classes. A mixin is a function that takes a class as input and returns a **new class that extends it**, adding extra methods along the way. Because mixins are just functions, you can apply several of them in sequence to compose multiple independent behaviors onto one class.",
      ],
      examples: [
        {
          id: "mixins-example",
          title: "Composing multiple mixins onto a base class",
          js: `const CanFly = (Base) =>
  class extends Base {
    fly() {
      console.log(\`\${this.name} flies\`);
    }
  };

const CanSwim = (Base) =>
  class extends Base {
    swim() {
      console.log(\`\${this.name} swims\`);
    }
  };

class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Duck extends CanSwim(CanFly(Animal)) {}
// Duck's chain: Duck -> (CanSwim's class) -> (CanFly's class) -> Animal

const duck = new Duck("Duck");
duck.fly();  // "Duck flies"  — from the CanFly mixin
duck.swim(); // "Duck swims" — from the CanSwim mixin

class Penguin extends CanSwim(Animal) {} // only mixes in what's actually true
const penguin = new Penguin("Pingu");
penguin.swim();
console.log(penguin.fly); // undefined — no fly mixin applied, and no broken override needed`,
          explanation:
            "`CanFly(Animal)` returns a brand-new anonymous class extending `Animal` with a `fly()` method added; wrapping that in `CanSwim(...)` does the same again, one layer further up the chain. This solves the exact `Penguin` problem from the fragile-base-class example — you compose in only the mixins that are actually true for each class, instead of inheriting something incorrect and having to override it away.",
        },
      ],
      pitfalls: [
        {
          title: "Mixins can still create their own tangled dependencies",
          body: "Mixins solve the single-inheritance limitation, but stacking many of them (especially ones that depend on methods or state from each other) can become just as hard to trace as a deep inheritance chain. Keep individual mixins small, focused, and — ideally — independent of one another, exactly like the composition example above.",
        },
      ],
    },
    {
      id: "ts-mixins",
      heading: "TypeScript: typing mixins with a constructor type constraint",
      body: [
        "Typing a mixin function requires describing 'any class constructor' as a type, so the mixin can accept and extend an arbitrary base class while TypeScript still tracks the resulting combined type correctly.",
      ],
      examples: [
        {
          id: "ts-mixin-example",
          title: "A generically typed mixin",
          ts: `type Constructor<T = {}> = new (...args: any[]) => T;

function CanFly<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    fly() {
      console.log("Flying!");
    }
  };
}

class Animal {
  constructor(public name: string) {}
}

class Bird extends CanFly(Animal) {}

const bird = new Bird("Robin");
bird.fly();               // OK — TypeScript knows this method exists, from the mixin
console.log(bird.name);   // OK — inherited from Animal through the mixin chain`,
          explanation:
            "`Constructor<T>` is a reusable type describing 'a class constructor that produces a `T`'. `<TBase extends Constructor>` constrains the mixin to only accept actual class constructors, while still letting TypeScript infer and preserve whatever specific class was passed in — so the final `Bird` class correctly has both `Animal`'s members and the mixin's `fly()` method, fully type-checked.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the fragile base class problem?",
      answer:
        "It's the issue where changes to a base class in an inheritance hierarchy can unexpectedly break or affect descendant classes in ways that aren't obvious from looking at the descendants alone — and where forcing all descendants to share a base class's behavior (like assuming every Bird can fly) leads to incorrect modeling that requires overriding methods to 'undo' inherited behavior.",
    },
    {
      question: "What does 'favor composition over inheritance' mean in practice?",
      answer:
        "Instead of building a deep 'is-a' class hierarchy where every descendant inherits everything from its ancestors, you build small, focused, independent behaviors and combine ('compose') only the ones a given object actually needs — a 'has-a' or 'can-do' relationship — avoiding forced, incorrect inheritance and the fragility that comes with deep hierarchies.",
    },
    {
      question: "What is a mixin in JavaScript/TypeScript, and what problem does it solve?",
      answer:
        "A mixin is a function that takes a class as an argument and returns a new class extending it with additional behavior. It solves the limitation that a class can only extend one base class — by applying multiple mixins in sequence, you can compose several independent pieces of behavior onto one class without needing multiple inheritance.",
    },
    {
      question: "In the mixin example `class Duck extends CanSwim(CanFly(Animal)) {}`, what is Duck's actual inheritance chain?",
      answer:
        "Duck extends the anonymous class returned by CanSwim, which extends the anonymous class returned by CanFly, which extends Animal. So the chain (from Duck up) is: Duck -> CanSwim's generated class -> CanFly's generated class -> Animal — each mixin inserts one more link in the prototype chain.",
    },
    {
      question: "Why does typing a mixin function in TypeScript require a 'Constructor' type like `new (...args: any[]) => T`?",
      answer:
        "Because a mixin needs to accept 'any class constructor' as its input parameter, not one specific class — the Constructor type describes exactly that shape (something callable with new that produces an instance of T). Constraining the mixin's generic type parameter to extend Constructor ensures only actual class constructors can be passed in, while preserving the specific base class's type information through to the result.",
    },
  ],
  takeaways: [
    "Inheritance models 'is-a' and works well shallowly, but deep or overly-general hierarchies become fragile — changes ripple, and forced-but-wrong inherited behavior needs awkward overriding.",
    "Composition models 'has-a'/'can-do': small, independent, reusable behaviors combined only where they're actually true, avoiding the fragile base class problem entirely.",
    "Mixins are the standard JavaScript/TypeScript pattern for composition with classes: functions that take a base class and return an extended class, stackable to combine multiple behaviors.",
    "TypeScript types mixins with a Constructor<T> type describing 'any class constructor', constraining the mixin's generic parameter while preserving the base class's specific type.",
  ],
  status: "available",
};
