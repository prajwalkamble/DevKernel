import type { Lesson } from "@/content/types";

export const templateLiteralsDecoratorsLesson: Lesson = {
  id: "type-system-template-literals-decorators",
  slug: "template-literal-types-and-decorators",
  moduleSlug: "type-system",
  title: "Template Literal Types & Decorators",
  summary:
    "String types the compiler can build and take apart — cross-products, key remapping, and parsing route parameters — followed by the standard decorators that finally landed in TypeScript 5.0, and why the old ones are different.",
  estimatedMinutes: 35,
  objectives: [
    "Build string literal types by interpolation, including unions that expand to a cross-product",
    "Rename and derive keys with template literals in a mapped type's as clause",
    "Take strings apart at the type level with infer inside a template pattern",
    "Write standard method, field and class decorators, and distinguish them from the legacy design",
  ],
  sections: [
    {
      id: "template-literal-types",
      heading: "Template literal types",
      body: [
        "TypeScript 4.1 gave the type system template literals, written with backticks and `${...}` interpolation exactly like their runtime counterparts. Interpolate `string` itself and you get a *pattern*: a type accepting any string that begins with a fixed prefix. That's a genuinely new capability, since no earlier construct could describe part of a string.",
        "The feature that makes them powerful is **cross-product expansion**: interpolating a union produces every combination. A template that interpolates `\"small\" | \"large\"`, a hyphen, then `\"red\" | \"blue\"` is a four-member union of literal types, written once. Design systems, CSS custom properties, event names, feature flags and i18n keys are all sets that were previously either hand-enumerated or left as `string`; now they can be generated and checked.",
        "Four **intrinsic** string types come along with them — `Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>` and `Uncapitalize<S>`. They're implemented in the compiler rather than in TypeScript source (you'll see `intrinsic` if you look them up in `lib.es5.d.ts`), and they're what makes the naming conventions in the next section possible.",
      ],
      examples: [
        {
          id: "template-literal-example",
          title: "Interpolation, cross-products and case transforms",
          ts: `// A pattern, not a fixed set
type Greeting = \`hello \${string}\`;
const ok: Greeting = "hello world";
const bad: Greeting = "goodbye world";
// Error: Type '"goodbye world"' is not assignable to type '\`hello \${string}\`'.

// Interpolating unions expands to every combination
type Size = "small" | "large";
type Colour = "red" | "blue";
type Variant = \`\${Size}-\${Colour}\`;
// "small-red" | "small-blue" | "large-red" | "large-blue"

const variants: Variant[] = ["small-red", "large-blue"];
console.log(variants.join(" "));

// The intrinsic case transforms
type Shout = Uppercase<"hello">;      // "HELLO"
type Quiet = Lowercase<"HELLO">;      // "hello"
type Title = Capitalize<"name">;      // "Name"
type Lower = Uncapitalize<"Name">;    // "name"

// A very common real use: constrained string shapes
type CssVariable = \`--\${string}\`;
type EventName<T extends string> = \`\${T}:start\` | \`\${T}:end\`;

function setVar(name: CssVariable, value: string) {
  return name + ": " + value;
}
console.log(setVar("--brand-colour", "#3b82f6"));
setVar("brand-colour", "#3b82f6");
// Error: Argument of type '"brand-colour"' is not assignable to parameter of
//        type '\`--\${string}\`'.

function on(event: EventName<"upload">, handler: () => void) {
  console.log("listening for " + event);
  handler();
}
on("upload:start", () => console.log("started"));`,
          output: `small-red large-blue
--brand-colour: #3b82f6
listening for upload:start
started`,
          explanation:
            "Note that `Variant` has four members from six tokens of source. That ratio is the whole appeal — and also the warning: interpolating two large unions multiplies them, and TypeScript caps a union at 100,000 members before it refuses. Cross-products of three or four generous unions hit that limit faster than you'd guess.",
        },
      ],
    },
    {
      id: "key-remapping",
      heading: "Remapping keys with template literals",
      body: [
        "The previous lesson introduced key remapping — `{ [K in keyof T as NewKey]: T[K] }` — and noted it becomes genuinely powerful with template literals. This is that combination, and it's the single most common place you'll meet template literal types in real code.",
        "The pattern is always the same: map over `keyof T`, compute the new key by interpolating `K` into a template (usually with `Capitalize`), and give the property whatever type the transformation implies. `getId`/`getName` accessors, `onNameChange` handler props, `SET_USER` action types, `userId`-prefixed database columns — all of it is one mapped type that stays correct as the source interface changes.",
        "Two mechanical details. `K` from `keyof T` is `string | number | symbol`, but a template literal only accepts `string | number | bigint | boolean | null | undefined`, so you'll see `string & K` (or `Extract<K, string>`) to filter out symbols. And the reverse direction works too: a template with `infer` in the `as` clause can strip a prefix, turning a `getX`/`getY` interface back into `{ x, y }`.",
      ],
      examples: [
        {
          id: "key-remapping-example",
          title: "Getters, change handlers, and stripping a prefix",
          ts: `interface User {
  id: number;
  name: string;
  active: boolean;
}

// Add a prefix and capitalise: id -> getId
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

const accessors: Getters<User> = {
  getId: () => 1,
  getName: () => "Ada",
  getActive: () => true,
};
console.log(accessors.getName().toUpperCase(), accessors.getId());

// The React-props shape: optional onXChange callbacks, each correctly typed
type ChangeHandlers<T> = {
  [K in keyof T as \`on\${Capitalize<string & K>}Change\`]?: (value: T[K]) => void;
};

const handlers: ChangeHandlers<User> = {
  onNameChange: (value) => console.log("name is now " + value.trim()),
  onActiveChange: (value) => console.log("active: " + value),
};
handlers.onNameChange?.("  Lin  ");
handlers.onActiveChange?.(false);

const wrongHandler: ChangeHandlers<User> = {
  onIdChange: (value) => console.log(value.toUpperCase()),
  // Error: Property 'toUpperCase' does not exist on type 'number'.
};

// Redux-style action types from a union of names
type ActionType<T extends string> = \`\${Uppercase<T>}_REQUEST\` | \`\${Uppercase<T>}_SUCCESS\`;
const actions: ActionType<"load_user">[] = ["LOAD_USER_REQUEST", "LOAD_USER_SUCCESS"];
console.log(actions.join(" "));

// Going the other way: strip the prefix back off
type Unprefixed<T> = {
  [K in keyof T as K extends \`get\${infer Rest}\` ? Uncapitalize<Rest> : never]: T[K];
};
type Back = Unprefixed<Getters<User>>;
// { id: () => number; name: () => string; active: () => boolean }
const back: Back = { id: () => 1, name: () => "Ada", active: () => true };
console.log(back.id());`,
          output: `ADA 1
name is now Lin
active: false
LOAD_USER_REQUEST LOAD_USER_SUCCESS
1`,
          explanation:
            "The error inside `wrongHandler` is the part worth appreciating: the mapped type derived the key `onIdChange` from `id` and, independently, derived the parameter type `number` from `User[\"id\"]`. Nothing in that object literal was written by hand, and it's still fully checked.",
        },
      ],
    },
    {
      id: "parsing-strings",
      heading: "Taking strings apart with infer",
      body: [
        "`infer` (Lesson 5) works inside a template literal pattern, which means the type system can *parse*. A pattern of the form `${infer Head}.${infer Tail}` splits a dotted string at its first dot and names both halves. Recurse on the tail and you have a type-level `String.prototype.split`.",
        "The realistic payoff is deriving types from strings your program already contains. A route pattern like `\"/users/:userId/posts/:postId\"` implies a params object with exactly those two keys; a query builder's `\"SELECT id, name\"` implies a result shape. Libraries use this to give you full type safety over string APIs — it's how modern routers know that `params.userId` exists and `params.slug` doesn't.",
        "This is also the point to be honest about limits. Type-level parsing is fun, and each recursion step costs compile time; TypeScript stops at about 1,000 instantiation levels for tail-recursive conditional types and much sooner for non-tail-recursive ones. It's the right tool when the string is the API — a route, an event name, a CSS property — and the wrong tool when you could simply pass an object instead.",
      ],
      examples: [
        {
          id: "parsing-strings-example",
          title: "Route parameters and a type-level split",
          ts: `// Pull every :param out of a route pattern
type RouteParams<T extends string> =
  T extends \`\${string}:\${infer Param}/\${infer Rest}\`
    ? Param | RouteParams<\`/\${Rest}\`>
    : T extends \`\${string}:\${infer Param}\`
      ? Param
      : never;

type Params = RouteParams<"/users/:userId/posts/:postId">; // "userId" | "postId"
type NoParams = RouteParams<"/users">;                    // never

// A router signature that knows what its own path string means
function route<T extends string>(
  path: T,
  handler: (params: Record<RouteParams<T>, string>) => void
) {
  console.log("registered " + path);
  handler({ userId: "1", postId: "2" } as Record<RouteParams<T>, string>);
}

route("/users/:userId/posts/:postId", (params) => {
  console.log(params.userId, params.postId);
  params.slug;
  // Error: Property 'slug' does not exist on type 'Record<"userId" | "postId", string>'.
});

// String.split, at the type level
type Split<S extends string, D extends string> = S extends \`\${infer Head}\${D}\${infer Tail}\`
  ? [Head, ...Split<Tail, D>]
  : [S];

type Segments = Split<"a.b.c", ".">; // ["a", "b", "c"]
const segments: Segments = ["a", "b", "c"];
console.log(segments.length);

// Typed access to a nested property by dotted path
type PathValue<T, P extends string> = P extends \`\${infer Key}.\${infer Rest}\`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

interface Config {
  server: { host: string; port: number };
}
type Host = PathValue<Config, "server.host">; // string
type Missing = PathValue<Config, "server.hst">; // never
const host: Host = "localhost";
console.log(host);`,
          output: `registered /users/:userId/posts/:postId
1 2
3
localhost`,
          explanation:
            "`RouteParams` is about ten tokens of real work and it eliminates an entire class of bug — a typo'd `params.usrId` becomes a compile error instead of an `undefined` in a URL. That's the case where type-level string parsing genuinely earns its keep, as opposed to being a party trick.",
        },
      ],
      pitfalls: [
        {
          title: "A recursive string type over a long input will hit the instantiation limit",
          body: "`Split<S, D>` recurses once per delimiter, and the compiler gives up with 'Type instantiation is excessively deep and possibly infinite' well before you'd expect — sooner still if the recursion isn't in tail position. It's fine for route patterns and dotted paths of realistic length, and unsuitable for parsing arbitrary user input at the type level. If you find yourself fighting the limit, the answer is nearly always to change the runtime API to take structured data rather than a string.",
        },
      ],
    },
    {
      id: "decorators",
      heading: "Decorators: the standard ones",
      body: [
        "A **decorator** is a function that wraps or observes a class, method, field or accessor at definition time, applied with `@name` syntax. TypeScript 5.0 implements the **Stage 3 ECMAScript decorators proposal**, which is on track to become real JavaScript — so unlike the previous decade of TypeScript decorators, what you write here is standards-track.",
        "A method decorator receives two arguments: the original method, and a **context object** describing what's being decorated — `context.name`, `context.kind`, `context.static`, `context.private`, plus `addInitializer` for running code when each instance is constructed. Return a replacement function and it takes the method's place; return nothing and the original is kept. That's the whole model, and it's the same shape for every decorator kind.",
        "The typing is verbose but mechanical: `<This, Args extends unknown[], Return>` captures the receiver, the parameter tuple and the return type — the same technique as the `withLogging` wrapper in Lesson 4 — so the decorator works on any method without loosening its signature. The `ClassMethodDecoratorContext` type ties it together, and TypeScript will check that your decorator is compatible with what you attached it to.",
      ],
      examples: [
        {
          id: "decorators-example",
          title: "Method, field and class decorators, running for real",
          ts: `// A method decorator: wrap the original and return the replacement
function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log("-> " + name + "(" + args.join(", ") + ")");
    const result = target.call(this, ...args);
    console.log("<- " + name + " = " + result);
    return result;
  };
}

// A method decorator that returns nothing, and instead uses addInitializer
// to bind the method per instance — the "auto-bind" decorator.
function bound<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  context.addInitializer(function (this: This) {
    (this as Record<string, unknown>)[String(context.name)] = target.bind(this);
  });
}

// A field decorator receives undefined and returns an initializer transform
function defaulted<This, Value>(fallback: Value) {
  return function (target: undefined, context: ClassFieldDecoratorContext<This, Value>) {
    return function (this: This, initial: Value): Value {
      return initial ?? fallback;
    };
  };
}

// A class decorator sees the constructor itself
const registry = new Map<string, unknown>();
function registered<T extends new (...args: never[]) => unknown>(
  target: T,
  context: ClassDecoratorContext<T>
) {
  registry.set(String(context.name), target);
}

@registered
class Counter {
  @defaulted(10)
  limit!: number;

  count = 0;

  @logged
  increment(by: number) {
    this.count += by;
    return this.count;
  }

  @bound
  report() {
    return "count=" + this.count;
  }
}

const counter = new Counter();
console.log("limit:", counter.limit);
counter.increment(3);

// @bound means the method survives being pulled off the instance
const detached = counter.report;
console.log(detached());
console.log("registered:", [...registry.keys()].join(", "));`,
          output: `limit: 10
-> increment(3)
<- increment = 3
count=3
registered: Counter`,
          explanation:
            "`@bound` is worth studying against Module 2's `this` lesson: it solves the detached-method problem by assigning a bound copy as an own property of each instance, which is exactly what `this.report = this.report.bind(this)` in a constructor does — just declared once, next to the method it affects.",
        },
      ],
    },
    {
      id: "decorator-caveats",
      heading: "Legacy decorators, ordering, and when not to bother",
      body: [
        "There are **two incompatible decorator designs**, and knowing which one you're looking at matters. The legacy design, enabled by the `experimentalDecorators` compiler flag, dates from 2015 and has a completely different signature — a method decorator receives `(target, propertyKey, descriptor)` and mutates the property descriptor. Angular, older NestJS and TypeORM are all built on it. Turning `experimentalDecorators` on disables the standard implementation, so a project must choose one.",
        "The most-cited practical gap: **the standard proposal has no parameter decorators**. Legacy decorators do, and that's what dependency-injection frameworks use for constructor injection, along with `emitDecoratorMetadata` — a TypeScript-specific feature with no standards equivalent. Frameworks relying on those cannot move to standard decorators yet, which is why both designs will coexist for some time.",
        "On ordering, two rules: decorator *expressions* are evaluated top to bottom, but the decorators are *applied* bottom to top — so `@a @b method` calls `a(b(method))`. And across a class, all field and method decorators run before the class decorator, which sees the finished constructor.",
        "Finally, the judgement call. Decorators move behaviour away from where it's called to where the method is declared, which is exactly what makes them appealing for logging, caching, validation and access control — and exactly what makes them hard to follow when overused. A plain higher-order function does the same job with no syntax, no configuration flag, and no ambiguity about which of the two designs is in play. Reach for decorators when the framework you're using expects them, or when the cross-cutting concern really does belong at the declaration.",
      ],
      examples: [
        {
          id: "decorator-caveats-example",
          title: "Application order, and the same thing without decorators",
          ts: `function trace(label: string) {
  console.log("evaluating " + label);
  return function <This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    console.log("applying " + label + " to " + String(context.name));
    return function (this: This, ...args: Args): Return {
      console.log("enter " + label);
      const result = target.call(this, ...args);
      console.log("exit " + label);
      return result;
    };
  };
}

class Service {
  @trace("outer")
  @trace("inner")
  run() {
    console.log("running");
    return "done";
  }
}

console.log(new Service().run());

// The decorator-free equivalent: an ordinary higher-order function
function traced<Args extends unknown[], Return>(
  label: string,
  fn: (...args: Args) => Return
) {
  return (...args: Args): Return => {
    console.log("enter " + label);
    const result = fn(...args);
    console.log("exit " + label);
    return result;
  };
}

const run = traced("outer", traced("inner", () => {
  console.log("running");
  return "done";
}));
console.log(run());`,
          output: `evaluating outer
evaluating inner
applying inner to run
applying outer to run
enter outer
enter inner
running
exit inner
exit outer
done
enter outer
enter inner
running
exit inner
exit outer
done`,
          explanation:
            "The output makes both rules concrete: `outer` and `inner` are evaluated top-down, then applied bottom-up, so the outermost decorator ends up outermost at call time. The second half produces byte-identical output with no decorator syntax at all — which is the honest comparison to make before adding them to a codebase.",
        },
      ],
      pitfalls: [
        {
          title: "experimentalDecorators changes the meaning of the same syntax",
          body: "The `@name` syntax is identical between the two designs, but the functions behind it are not interchangeable — a standard decorator used in a project with `experimentalDecorators: true` will be called with `(target, propertyKey, descriptor)` and fail in confusing ways, and vice versa. Before writing a decorator, check `tsconfig.json`. If you're on a framework that requires the legacy flag, write legacy decorators; if you're starting fresh on TypeScript 5.0+, leave the flag off and use the standard design.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are template literal types useful for beyond neat syntax?",
      answer:
        "They let a type describe part of a string, which nothing before them could. The big win is cross-product expansion: interpolating unions generates every combination, so `${Size}-${Colour}` produces four checked literal types from two small unions. That turns previously stringly-typed sets — CSS custom properties, event names, design-system variants, action types — into things the compiler checks and the editor autocompletes. They also come with the intrinsic Uppercase, Lowercase, Capitalize and Uncapitalize transforms, which is what makes naming conventions expressible.",
    },
    {
      question: "How do template literals combine with mapped types?",
      answer:
        "In a mapped type's `as` clause you can compute the new key by interpolating K, so { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] } turns an interface into a getters interface. That's the pattern behind onXChange handler props, action-type unions and column maps, and it stays correct automatically when the source interface changes. The `string & K` is needed because keyof yields string | number | symbol and templates don't accept symbols. With infer in the clause you can go the other way and strip a prefix.",
    },
    {
      question: "How can a type extract the parameters from a route string?",
      answer:
        "By pattern-matching with infer inside a template literal and recursing. RouteParams<T> checks whether T matches `${string}:${infer Param}/${infer Rest}`, yields Param, and recurses on Rest, with a final case for a trailing parameter. Applied to '/users/:userId/posts/:postId' it produces 'userId' | 'postId', which a router can turn into Record<RouteParams<T>, string> so params.userId typechecks and params.slug doesn't. The caveat is cost: recursion is bounded by the instantiation limit, so this suits routes and dotted paths, not arbitrary parsing.",
    },
    {
      question: "How does a standard decorator work, and how does it differ from the legacy one?",
      answer:
        "A standard decorator (TypeScript 5.0, Stage 3 ECMAScript) receives the thing being decorated plus a context object with name, kind, static, private and addInitializer; returning a replacement swaps it out, returning nothing keeps the original. The legacy design behind the experimentalDecorators flag is entirely different — a method decorator gets (target, propertyKey, descriptor) and mutates the descriptor — and the two cannot be mixed, since enabling the flag disables the standard implementation. The standard proposal also has no parameter decorators and no emitDecoratorMetadata, which is why DI-heavy frameworks like Angular and NestJS still require the legacy flag.",
    },
    {
      question: "In what order do stacked decorators run?",
      answer:
        "Decorator expressions are evaluated top to bottom, then applied bottom to top — so @a @b method results in a(b(method)) and, at call time, a's wrapper is outermost. Within a class, field and method decorators run before the class decorator, which therefore sees the finished constructor. Worth remembering that a decorator is just a higher-order function with syntax: the same behaviour composes identically as traced('outer', traced('inner', fn)), which is often the clearer choice outside a framework that expects decorators.",
    },
  ],
  takeaways: [
    "Template literal types describe string shapes, and interpolating unions expands to a checked cross-product — plus the intrinsic Uppercase/Lowercase/Capitalize/Uncapitalize transforms.",
    "In a mapped type's `as` clause, template literals rename keys, generating getters, onXChange props and action types that track their source interface automatically.",
    "infer inside a template literal pattern lets types parse strings — route parameters, dotted paths — bounded by the compiler's instantiation limit.",
    "Standard decorators (TS 5.0, Stage 3) take the target plus a context object with name, kind and addInitializer; returning a replacement swaps it, returning nothing keeps the original.",
    "Legacy experimentalDecorators are a different, incompatible design with parameter decorators and emitDecoratorMetadata — check tsconfig before writing one, and remember a higher-order function often does the job with less machinery.",
  ],
  status: "available",
};
