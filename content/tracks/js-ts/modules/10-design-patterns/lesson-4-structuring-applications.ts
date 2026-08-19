import type { Lesson } from "@/content/types";

export const structuringApplicationsLesson: Lesson = {
  id: "patterns-structure",
  slug: "structuring-applications",
  moduleSlug: "design-patterns",
  title: "Structuring Larger Applications",
  summary:
    "How to lay out a codebase that several people work on: organising by feature rather than by kind, keeping dependencies pointing one way, and the barrel-file and circular-import problems that appear at scale.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why organising by feature scales better than organising by file type",
    "Define layers and keep the dependency arrows pointing one way",
    "Inject dependencies without a framework",
    "Diagnose and break a circular import",
    "Know what barrel files cost, and when to use one",
    "Enforce boundaries with tooling rather than good intentions",
  ],
  sections: [
    {
      id: "by-feature",
      heading: "Organise by feature, not by kind",
      body: [
        "The default layout most tutorials teach groups files by what they *are*: every component in `components/`, every hook in `hooks/`, every helper in `utils/`. It looks tidy at twenty files and stops working at two hundred.",
        "The reason is that **work is organised by feature, not by kind**. Changing the checkout flow means touching a component, a hook, a type, an API call and a test — five directories, none of which tell you the others exist. Nothing in the tree says which files belong together, so nothing stops an unrelated feature quietly importing your internals.",
        "Grouping by feature puts everything one change touches in one place. Deleting a feature becomes deleting a directory, which is the clearest possible test of whether the boundary was real.",
      ],
      examples: [
        {
          id: "layout-comparison",
          title: "The same application, two layouts",
          lang: "bash",
          code: `# By kind — every change is spread across five directories.
src/
├── components/     Button, CheckoutForm, ProductCard, UserAvatar, …
├── hooks/          useCart, useAuth, useProducts, …
├── utils/          format, validate, api, …    <- becomes a junk drawer
├── types/          cart.ts, user.ts, product.ts
└── services/       cartService, authService, …

# By feature — a change lives in one directory, and deleting is easy.
src/
├── features/
│   ├── cart/
│   │   ├── components/     CartItem.tsx, CartSummary.tsx
│   │   ├── use-cart.ts
│   │   ├── cart-api.ts
│   │   ├── cart-types.ts
│   │   ├── cart.test.ts
│   │   └── index.ts        <- the ONLY file other features may import
│   ├── checkout/
│   └── catalogue/
├── shared/                 genuinely cross-cutting: Button, formatMoney
│   ├── ui/
│   └── lib/
└── app/                    routing, providers, entry point`,
          explanation:
            "The important line is `index.ts`. Each feature exposes a deliberate public surface and everything else is private by convention — and, with the lint rule at the end of this lesson, private by enforcement. `shared/` holds only what genuinely serves several features; the discipline is to move things there when a *second* feature needs them, not in anticipation.",
        },
      ],
      pitfalls: [
        {
          title: "`utils/` is where architecture goes to die",
          body: "A folder named for what its contents are not is a magnet. Every file that does not obviously belong elsewhere lands there, until it is four thousand lines of unrelated helpers that everything imports and nothing can be deleted from. Name modules for what they do — `format-money.ts`, `date-range.ts` — and put them next to the feature that uses them until a second one needs them.",
        },
      ],
    },
    {
      id: "layers",
      heading: "Layers, and pointing the arrows one way",
      body: [
        "Within a feature, and across the app, it helps to think in layers — and the rule that makes layers worth anything is that **dependencies point in one direction only**.",
        "A workable set for most front-end applications: **UI** (components, rendering) depends on **application** (use cases, orchestration, state) depends on **domain** (types, pure business rules), with **infrastructure** (HTTP, storage, third-party SDKs) sitting at the edge behind an interface the application defines.",
        "The payoff is concrete. Domain logic with no imports from React or `fetch` can be tested in milliseconds with no setup. And swapping infrastructure — REST to GraphQL, `localStorage` to IndexedDB — touches one layer instead of every component.",
        "The rule that makes it real: **the inner layer must not know about the outer one.** A domain type importing a React component has broken the arrow, and the cost arrives later as a domain you cannot test without a DOM.",
      ],
      examples: [
        {
          id: "layers-di",
          title: "Inverting a dependency, with no framework",
          ts: `// ---- domain: pure, no imports from anywhere outward ----
export interface Cart {
  items: CartItem[];
}

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ---- application: defines what it needs, not who provides it ----
export interface CartRepository {
  load(userId: string): Promise<Cart>;
  save(userId: string, cart: Cart): Promise<void>;
}

export function createCartService(repo: CartRepository) {
  return {
    async addItem(userId: string, item: CartItem): Promise<Cart> {
      const cart = await repo.load(userId);
      const next = { items: [...cart.items, item] };
      await repo.save(userId, next);
      return next;
    },
  };
}

// ---- infrastructure: implements the interface the application declared ----
export function createHttpCartRepository(client: HttpClient): CartRepository {
  return {
    load: (userId) => client.get(\`/carts/\${userId}\`),
    save: (userId, cart) => client.put(\`/carts/\${userId}\`, cart),
  };
}

// ---- composition root: the one place that knows about everything ----
const cartService = createCartService(createHttpCartRepository(httpClient));

// ---- and the test needs no mocking framework at all ----
const inMemory: CartRepository = {
  load: async () => ({ items: [] }),
  save: async () => {},
};
const service = createCartService(inMemory);`,
          explanation:
            "This is dependency inversion, and in TypeScript it needs no container, no decorators and no library — just an interface and a parameter. Note the direction: `CartRepository` is declared by the **application** layer, so infrastructure depends inward. That is what makes the domain testable and the HTTP client replaceable.",
        },
      ],
    },
    {
      id: "composition-root",
      heading: "The composition root",
      body: [
        "If every module creates its own dependencies, everything is coupled to everything and nothing can be tested in isolation. If dependencies are passed in, something has to do the wiring — and that something should be exactly one place, near the entry point, called the **composition root**.",
        "It is the only file allowed to know the concrete implementations. Everything else receives what it needs and could not name the real class if it tried.",
        "The signal that you have gone wrong is a module importing a singleton it uses directly — a `db` object, an `apiClient`, an `analytics` instance. Each one is an invisible dependency: it does not appear in any signature, and it makes the module untestable without mocking the module system itself.",
      ],
    },
    {
      id: "circular",
      heading: "Circular imports",
      body: [
        "Two modules that import each other are legal in ES modules and mostly work — until they do not, and the failure is bewildering: `undefined is not a function` at import time, or a class that is `undefined` only when the entry point happens to load in a particular order.",
        "The mechanism, from module 7: an ES module in a cycle is fully **hoisted** but only partially **evaluated** when the other side reads from it. Function declarations are hoisted and work; `const`, `let` and `class` are in the temporal dead zone and throw.",
        "The practical rule: **a cycle that only uses functions usually works and is still a design problem.** Bundlers may also refuse to tree-shake across it, so it costs bundle size as well.",
      ],
      examples: [
        {
          id: "circular-fix",
          title: "Three ways to break a cycle",
          ts: `// The cycle: user.ts imports order.ts, order.ts imports user.ts.

// 1. Extract the shared piece into a third module that both depend on.
//    types.ts  <- user.ts and order.ts both import this; it imports neither.
export interface UserId { readonly value: string }

// 2. Import only the type. \`import type\` is erased entirely at compile time,
//    so it cannot create a runtime cycle at all.
import type { Order } from "./order";

export interface User {
  id: string;
  orders: Order[];      // no runtime import is emitted
}

// 3. Invert the dependency: the lower-level module should not know about
//    the higher-level one. Pass what it needs in, rather than importing it.
export function summarise(user: User, formatOrder: (order: Order) => string) {
  return user.orders.map(formatOrder).join(", ");
}`,
          explanation:
            "Option 2 deserves emphasis: **`import type` cannot cause a circular dependency**, because with `verbatimModuleSyntax` (module 7) it produces no JavaScript at all. A great many apparent cycles in TypeScript codebases are type-only and disappear the moment the import is marked. `madge --circular src` will list the real ones.",
        },
      ],
    },
    {
      id: "barrels",
      heading: "Barrel files: useful at the boundary, costly everywhere else",
      body: [
        "A barrel is an `index.ts` that re-exports a directory's contents so callers can write one import instead of five.",
        "At a **feature boundary** that is exactly right: it defines the public surface, and the rest of the directory is private.",
        "Used **everywhere**, barrels cause real problems. They are the most common cause of circular imports, because importing one member pulls in the whole barrel and everything it re-exports. They slow type-checking and tests, since touching one file invalidates the barrel and everything through it. And they defeat tree-shaking in some bundler configurations, so an import of one helper drags in a directory.",
        "The workable rule: **one barrel per feature, at its boundary, and never import your own feature's barrel from inside that feature.** Inside a feature, import the file directly.",
      ],
    },
    {
      id: "enforcing",
      heading: "Enforcing boundaries with tooling",
      body: [
        "Conventions that are not enforced decay, usually within a quarter. Two mechanisms make the structure above real rather than aspirational.",
        "**TypeScript project references** split the codebase into projects that build independently and can only depend on ones they declare. Strong, and worth it in a monorepo.",
        "**A lint rule** is lighter and covers most of the value: forbid deep imports into another feature, so the barrel is the only way in.",
      ],
      examples: [
        {
          id: "boundary-lint",
          title: "Making the boundary a build error",
          lang: "javascript",
          code: `// eslint.config.js
export default [
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            // Reaching past a feature's index.ts is an error.
            group: ["@/features/*/*"],
            message: "Import from the feature's index.ts, not its internals.",
          },
          {
            // The domain must not import infrastructure.
            group: ["@/infrastructure/*"],
            message: "Domain and application layers must not depend on infrastructure.",
          },
        ],
      }],
    },
  },
];

// Find real cycles:
//   npx madge --circular --extensions ts,tsx src`,
          explanation:
            "The second rule is the load-bearing one. It is the difference between \"we agreed the domain would stay pure\" and the domain actually staying pure eighteen months later, when the person who agreed has left and someone needs a value from the API client at four in the afternoon.",
        },
      ],
      pitfalls: [
        {
          title: "Do not build the structure before you have the problem",
          body: "Four layers, a composition root and enforced boundaries are the right answer for an application several people maintain for years. For a three-page site they are pure overhead — indirection with nothing on the other side of it. Start with feature folders, which cost nothing, and add layering when a second consumer or a second implementation actually appears.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why organise a codebase by feature rather than by file type?",
      answer:
        "Because changes happen per feature, not per type. Grouping by kind spreads every change across several directories, gives no signal about which files belong together, and produces junk-drawer folders like `utils/`. Feature folders keep everything a change touches in one place, make deletion trivial, and give each feature a boundary you can enforce.",
    },
    {
      question: "What is dependency inversion, and how do you do it in TypeScript without a framework?",
      answer:
        "The inner layer declares the interface it needs and the outer layer implements it, so dependencies point inward. In TypeScript that is an interface plus a parameter — a factory function taking a `CartRepository` is dependency injection. The wiring happens once in a composition root near the entry point, and tests supply a plain object instead.",
    },
    {
      question: "Why do circular imports sometimes work and sometimes fail?",
      answer:
        "ES modules in a cycle are hoisted before they are evaluated. Function declarations are hoisted, so a cycle that only calls functions usually works; `const`, `let` and `class` bindings are in the temporal dead zone when the other module reads them, so those throw. It depends on evaluation order, which is why the same cycle can work in one entry point and fail in another.",
    },
    {
      question: "What is the downside of barrel files?",
      answer:
        "Importing one member pulls in the whole barrel and everything it re-exports, which is the most common cause of circular imports, slows type-checking and test runs, and can defeat tree-shaking. They are worth having at a feature boundary to define a public surface, but not inside a feature — there, import the file directly.",
    },
  ],
  takeaways: [
    "Organise by feature; a folder named for what its contents are not becomes a junk drawer",
    "Each feature exposes one `index.ts` and everything else is private",
    "Keep dependency arrows pointing one way: UI → application → domain, with infrastructure behind an interface",
    "Dependency injection in TypeScript is an interface and a parameter — no container required",
    "One composition root does all the wiring; a module importing a singleton has an invisible dependency",
    "`import type` cannot create a runtime cycle, so many apparent cycles vanish when marked",
    "One barrel per feature at its boundary, and never import your own barrel from inside the feature",
    "Enforce boundaries with `no-restricted-imports` or project references — unenforced conventions decay",
  ],
  status: "available",
};
