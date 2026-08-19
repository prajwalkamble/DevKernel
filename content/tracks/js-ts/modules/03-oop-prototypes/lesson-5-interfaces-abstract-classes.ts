import type { Lesson } from "@/content/types";

export const interfacesAbstractClassesLesson: Lesson = {
  id: "oop-prototypes-interfaces-abstract-classes",
  slug: "interfaces-vs-abstract-classes-vs-type-aliases",
  moduleSlug: "oop-prototypes",
  title: "Interfaces vs Abstract Classes vs Type Aliases",
  summary:
    "Three different TypeScript tools for describing shapes and contracts — when each one is the right choice, and the structural typing philosophy that ties them all together.",
  estimatedMinutes: 30,
  objectives: [
    "Explain TypeScript's structural typing model and how it differs from nominal typing",
    "Choose correctly between an interface, a type alias, and an abstract class",
    "Write and extend an abstract class with both implemented and abstract members",
    "Know the practical differences between interface and type alias",
  ],
  sections: [
    {
      id: "structural-typing",
      heading: "TypeScript's foundation: structural typing",
      body: [
        "TypeScript uses **structural typing** (sometimes called 'duck typing' at compile time): a value is considered compatible with a type if its *shape* matches — the right properties with the right types — regardless of how it was created or what it was explicitly declared to be. This is fundamentally different from **nominal typing** (used by languages like Java or C#), where a value is only compatible with a type if it was explicitly declared to implement or extend it by name.",
      ],
      examples: [
        {
          id: "structural-typing-example",
          title: "Shape matching is all that matters",
          ts: `interface Point {
  x: number;
  y: number;
}

function printPoint(p: Point) {
  console.log(\`(\${p.x}, \${p.y})\`);
}

const literalObject = { x: 1, y: 2 };
printPoint(literalObject); // OK — never declared as "Point", but the shape matches

const extraProps = { x: 1, y: 2, z: 3, label: "3D point" };
printPoint(extraProps); // OK — has at least the required shape, extra props are fine here

class Vector {
  constructor(public x: number, public y: number) {}
}
printPoint(new Vector(5, 5)); // OK — a Vector instance also structurally satisfies Point`,
          explanation:
            "None of these three values were ever declared as `implements Point` — TypeScript doesn't need that. It only checks whether the object's actual shape is compatible with what `printPoint` requires. This structural philosophy is *why* interfaces, type aliases, and abstract classes can often be used somewhat interchangeably for describing a shape — the real differences are about what extra behavior or constraints each one adds.",
        },
      ],
    },
    {
      id: "interface-vs-type-alias",
      heading: "interface vs type alias: describing pure shapes",
      body: [
        "Both `interface` and `type` can describe an object's shape, and for plain object shapes they're nearly interchangeable. The practical differences: an `interface` can be **re-opened and extended later** with **declaration merging** (multiple `interface Foo {}` declarations with the same name automatically combine), while a `type` alias cannot be redeclared. Conversely, only `type` can name things that aren't object shapes at all — unions, intersections, tuples, primitives, mapped types (covered fully in the Type System Deep Dive module).",
        "Common guidance: prefer `interface` for object shapes that represent a fairly stable public contract (especially ones others might need to extend), and `type` for unions, tuples, function types, or any shape composed from other types.",
      ],
      examples: [
        {
          id: "interface-vs-type-example",
          title: "Where each one has an edge",
          ts: `// Declaration merging — only interfaces can do this
interface Config {
  apiUrl: string;
}
interface Config {
  timeout: number; // merges into the same Config — now has BOTH properties
}
const config: Config = { apiUrl: "https://api.example.com", timeout: 5000 }; // required

// type aliases can name things interfaces cannot
type Status = "idle" | "loading" | "success" | "error"; // a union — not possible with interface
type Coordinates = [number, number]; // a tuple
type ClickHandler = (event: MouseEvent) => void; // a function type

// Both are equally fine for plain object shapes:
interface UserA { name: string; }
type UserB = { name: string; };`,
        },
      ],
      pitfalls: [
        {
          title: "Declaration merging is a feature, but also a footgun",
          body: "Because interfaces with the same name automatically merge, accidentally declaring an interface with a name that already exists elsewhere in your codebase silently combines them, rather than causing a helpful 'duplicate declaration' error the way a type alias redeclaration would. This is one reason some teams default to type aliases for most shapes and reserve interface specifically for cases that benefit from merging (like extending third-party library types).",
        },
      ],
    },
    {
      id: "abstract-classes",
      heading: "Abstract classes: a shape plus shared implementation",
      body: [
        "An **abstract class** is a class that cannot be instantiated directly (`new AbstractThing()` is a compile error) — it exists only to be extended. It can mix **abstract members** (methods/properties with no implementation, which subclasses *must* provide — like an interface's contract) together with **regular, fully-implemented members** that subclasses inherit and share, exactly like a normal base class.",
        "This is the key difference from an interface: an interface is a pure contract with **zero** implementation. An abstract class can provide real, shared code alongside the parts it forces subclasses to fill in.",
      ],
      examples: [
        {
          id: "abstract-class-example",
          title: "An abstract class combining shared logic with a required contract",
          ts: `abstract class Shape {
  abstract area(): number; // no implementation — every subclass MUST provide one

  // Fully implemented — shared by every subclass automatically
  describe(): string {
    return \`This shape has an area of \${this.area().toFixed(2)}\`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Square extends Shape {
  constructor(private side: number) {
    super();
  }
  area(): number {
    return this.side ** 2;
  }
}

const shapes: Shape[] = [new Circle(3), new Square(4)];
shapes.forEach((s) => console.log(s.describe()));
// "This shape has an area of 28.27"
// "This shape has an area of 16.00"

new Shape();
// Error: Cannot create an instance of an abstract class.`,
          explanation:
            "`describe()` is written exactly once, on `Shape`, and both `Circle` and `Square` get it for free — that's real, shared, inherited implementation, something a plain interface can never provide. Meanwhile `area()` is enforced as a required contract, just like an interface method would be.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "**Use an interface (or type alias)** when you only need to describe a shape — a pure contract with no shared implementation — and you want any structurally-matching object to satisfy it, without a formal `extends`/`implements` relationship. This is the most common case for describing function parameters, API response shapes, and props.",
        "**Use an abstract class** when subclasses genuinely need to *share real implemented behavior*, not just agree on a shape — and when you're comfortable with the more rigid, single-inheritance relationship a class hierarchy implies (unlike interfaces, a class can only `extends` one other class, though it can `implements` multiple interfaces).",
        "**Use a plain type alias** for anything that isn't an object shape at all: unions, tuples, function types, or a type built by combining other types together.",
      ],
      examples: [
        {
          id: "implements-example",
          title: "A class can implement multiple interfaces, but extend only one class",
          ts: `interface Flyable {
  fly(): void;
}
interface Swimmable {
  swim(): void;
}

class Duck implements Flyable, Swimmable {
  fly() {
    console.log("Duck flies");
  }
  swim() {
    console.log("Duck swims");
  }
}

// class Duck extends Bird, Animal {} would be a syntax error —
// a class can only extend ONE base class, but implement many interfaces`,
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is structural typing, and how does it differ from nominal typing?",
      answer:
        "Structural typing (used by TypeScript) considers a value compatible with a type if its shape matches — the right properties and types — regardless of how the value was declared. Nominal typing (used by languages like Java) requires a value to explicitly declare that it implements or extends a type by name to be considered compatible, even if the shapes match.",
    },
    {
      question: "What is the main practical difference between interface and type alias for object shapes?",
      answer:
        "interface supports declaration merging (multiple declarations with the same name automatically combine into one), while type cannot be redeclared. type alias can additionally name things interface cannot express, like unions, tuples, and function types. For plain object shapes, they're otherwise largely interchangeable.",
    },
    {
      question: "What's the fundamental difference between an interface and an abstract class?",
      answer:
        "An interface is a pure contract with zero implementation — it only describes a shape. An abstract class can combine abstract members (a required contract, like an interface) with fully-implemented members that provide real, shared behavior inherited by every subclass — something an interface can never do.",
    },
    {
      question: "Can a TypeScript class extend more than one class, or implement more than one interface?",
      answer:
        "A class can only extend exactly one base class (single inheritance), but it can implement as many interfaces as needed. This is a key practical reason to prefer interfaces for describing multiple independent contracts a class should satisfy.",
    },
    {
      question: "When would you choose an abstract class over an interface?",
      answer:
        "When subclasses need to share real, implemented behavior (not just agree on a method signature), and a single-inheritance class hierarchy is an acceptable design — for example, a base Shape class providing a shared describe() method built on top of an abstract area() method each subclass must implement.",
    },
  ],
  takeaways: [
    "TypeScript is structurally typed: a value satisfies a type if its shape matches, regardless of how or whether it was explicitly declared to be that type.",
    "interface and type alias are nearly interchangeable for object shapes; interface adds declaration merging, type alias adds the ability to name unions/tuples/function types.",
    "An abstract class is the only one of the three that can provide real, shared implementation alongside a required contract — interfaces are pure contracts with no implementation.",
    "A class can extend only one base class but implement many interfaces — a key practical driver for choosing interfaces over abstract classes for multiple independent contracts.",
  ],
  status: "available",
};
