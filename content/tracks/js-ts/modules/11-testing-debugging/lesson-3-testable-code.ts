import type { Lesson } from "@/content/types";

export const testableCodeLesson: Lesson = {
  id: "testing-testable-code",
  slug: "writing-testable-code",
  moduleSlug: "testing-debugging",
  title: "Writing Testable Code",
  summary:
    "Most untestable code is not badly written — it is badly connected. The four dependencies that make a function hard to test, and the one change that fixes all of them.",
  estimatedMinutes: 30,
  objectives: [
    "Identify the four hidden dependencies that make code hard to test",
    "Inject time, randomness and I/O rather than reaching for them",
    "Separate a pure core from an impure shell",
    "Name the kinds of test double and use each correctly",
    "Recognise when a difficult test is telling you about a design problem",
  ],
  sections: [
    {
      id: "four-dependencies",
      heading: "The four things that make code hard to test",
      body: [
        "When a function is painful to test, it is almost always because it reaches out for something instead of being given it. There are four usual culprits.",
        "**Time.** `Date.now()`, `new Date()`, `setTimeout`. A function that reads the clock produces a different result every run.",
        "**Randomness.** `Math.random()`, `crypto.randomUUID()`. Same problem, less predictable.",
        "**I/O.** `fetch`, the filesystem, a database. Slow, flaky, and requires the world to be in a particular state.",
        "**Global state.** A module-level singleton, `localStorage`, `process.env`, a store imported directly. Invisible in the signature and shared between tests.",
        "The pattern is the same in all four: the dependency is *hidden*. It does not appear in the function's parameters, so a caller — including a test — cannot control it.",
      ],
      examples: [
        {
          id: "hard-to-test",
          title: "The same function, before and after",
          ts: `// Hard: four hidden dependencies in nine lines.
export async function createOrder(items: Item[]) {
  const id = crypto.randomUUID();                 // randomness
  const createdAt = new Date();                   // time
  const discount = config.currentPromotion;       // global state

  const order = { id, items, createdAt, discount };
  await db.orders.insert(order);                  // I/O
  return order;
}

// To test this you need: a database, a way to freeze the clock, a way to
// stub crypto, and a way to set a module-level config. Four mocks for one
// function, and none of them is about the logic you care about.`,
        },
        {
          id: "easy-to-test",
          title: "Everything it needs, passed in",
          ts: `interface Deps {
  now: () => Date;
  newId: () => string;
  save: (order: Order) => Promise<void>;
}

export async function createOrder(
  items: Item[],
  promotion: Promotion | null,
  deps: Deps
): Promise<Order> {
  const order: Order = {
    id: deps.newId(),
    items,
    createdAt: deps.now(),
    discount: promotion,
  };
  await deps.save(order);
  return order;
}

// The composition root wires the real ones, once (module 10):
const makeOrder = (items: Item[], promotion: Promotion | null) =>
  createOrder(items, promotion, {
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
    save: (order) => db.orders.insert(order),
  });

// And the test needs no framework at all:
it("stamps the order with the current time", async () => {
  const saved: Order[] = [];

  const order = await createOrder([item], null, {
    now: () => new Date("2026-01-01"),
    newId: () => "order-1",
    save: async (o) => { saved.push(o); },
  });

  expect(order.id).toBe("order-1");
  expect(order.createdAt).toEqual(new Date("2026-01-01"));
  expect(saved).toEqual([order]);
});`,
          explanation:
            "No `vi.mock`, no fake timers, no database. The test reads as a description of the behaviour because the dependencies are visible — and the signature now documents that this function touches the clock, generates an id and persists something, which the original hid completely.",
        },
      ],
      pitfalls: [
        {
          title: "Do not inject everything",
          body: "Passing a `Deps` object into every function down the call stack produces its own kind of unreadable code. Inject at the *boundary* — the functions that genuinely touch time, randomness or I/O — and let everything they call be pure. Most functions in a well-structured codebase need no injection at all, because they take data and return data.",
        },
      ],
    },
    {
      id: "pure-core",
      heading: "A pure core with an impure shell",
      body: [
        "The structural version of the same idea, from module 10's functional lesson: put the decisions in pure functions and the effects in a thin layer around them.",
        "The decisions are where the bugs are, and they become trivially testable. The shell — which reads, calls, and writes — has almost no logic and needs only a couple of integration tests.",
      ],
      examples: [
        {
          id: "core-shell",
          title: "Splitting a decision from its effects",
          ts: `// ---- core: pure, and where every rule lives ----
export interface RetryDecision {
  action: "retry" | "give-up";
  delayMs: number;
  attempt: number;
}

export function decideRetry(
  attempt: number,
  status: number,
  maxAttempts: number
): RetryDecision {
  const retryable = status === 429 || status >= 500;

  if (!retryable || attempt >= maxAttempts) {
    return { action: "give-up", delayMs: 0, attempt };
  }
  // Exponential backoff, capped.
  return {
    action: "retry",
    delayMs: Math.min(1000 * 2 ** (attempt - 1), 30_000),
    attempt: attempt + 1,
  };
}

// ---- shell: does what the core decided, and decides nothing ----
export async function requestWithRetry(url: string, maxAttempts = 4) {
  let attempt = 1;

  for (;;) {
    const response = await fetch(url);
    if (response.ok) return response;

    const decision = decideRetry(attempt, response.status, maxAttempts);
    if (decision.action === "give-up") {
      throw new HttpError(response.status, response.statusText, "");
    }

    await sleep(decision.delayMs);
    attempt = decision.attempt;
  }
}

// The interesting cases are now table-driven, instant, and need nothing:
it.each([
  [1, 500, "retry", 1000],
  [2, 500, "retry", 2000],
  [3, 429, "retry", 4000],
  [4, 500, "give-up", 0],
  [1, 404, "give-up", 0],
])("attempt %i with status %i -> %s", (attempt, status, action, delay) => {
  expect(decideRetry(attempt, status, 4)).toMatchObject({ action, delayMs: delay });
});`,
          explanation:
            "Every rule about retrying — which statuses, how many attempts, what backoff, what cap — is tested in a table that runs in under a millisecond, with no network and no waiting. The shell has one branch and one loop, and one integration test covers it. `it.each` is the tool for exactly this shape.",
        },
      ],
    },
    {
      id: "doubles",
      heading: "The kinds of test double",
      body: [
        "\"Mock\" is used for all of these, which loses a distinction worth keeping — mostly because it clarifies when you are testing behaviour and when you are testing implementation.",
        "**A stub** returns canned answers. It has no expectations; it exists so the code under test can proceed.",
        "**A fake** is a real, working implementation that is unsuitable for production — an in-memory repository, a map standing in for a cache. Fakes make the best doubles: they behave correctly, so tests using them exercise real logic.",
        "**A spy** records what happened and lets you assert on it afterwards.",
        "**A mock** has expectations built in, and fails if the interaction does not match.",
        "The distinction that matters in practice: **stubs and fakes support testing behaviour; mocks and spies test interactions.** Asserting that a function was called with certain arguments couples the test to *how* the code works, so it breaks under refactoring. Prefer asserting on the result or on observable state.",
      ],
      examples: [
        {
          id: "fake-repository",
          title: "A fake, and why it beats a mock here",
          ts: `// A fake: a real implementation of the interface, held in memory.
export function createFakeOrderRepo(): OrderRepository {
  const orders = new Map<string, Order>();

  return {
    async save(order) {
      orders.set(order.id, structuredClone(order));
    },
    async findById(id) {
      return orders.get(id) ?? null;
    },
    async findByCustomer(customerId) {
      return [...orders.values()].filter((o) => o.customer.id === customerId);
    },
  };
}

// Testing behaviour: the assertion is about what is true afterwards.
it("stores an order that can be read back", async () => {
  const repo = createFakeOrderRepo();
  const service = createOrderService(repo);

  const created = await service.place(makeOrder());
  expect(await repo.findById(created.id)).toEqual(created);
});

// Testing interaction: brittle, and says nothing about correctness.
// The test passes even if \`save\` writes the wrong thing.
it("calls save", async () => {
  const save = vi.fn();
  await createOrderService({ save } as OrderRepository).place(makeOrder());
  expect(save).toHaveBeenCalledOnce();
});`,
          explanation:
            "The second test breaks if you rename `save`, add a second call, or batch two saves into one — none of which change what the system does. The first keeps passing through all of those and fails if the order is actually stored wrongly. `structuredClone` in the fake is deliberate: it makes the fake behave like a real store, where a caller mutating its object afterwards does not silently change what was saved.",
        },
      ],
    },
    {
      id: "listening",
      heading: "When a hard test is telling you something",
      body: [
        "A test that is disproportionately hard to write is usually a design signal rather than a testing problem. Four of them are worth recognising.",
        "**\"I need six mocks.\"** The unit has six dependencies. It is probably doing several jobs, and splitting it will reduce both the mocks and the reasons it changes.",
        "**\"I have to test a private method.\"** Either it is genuinely internal and should be covered through the public surface, or it is a separate concept that wants extracting into its own module — where it becomes public and testable on its own terms.",
        "**\"The test needs the DOM / a database / the network.\"** The logic is entangled with the delivery mechanism. Pull the decision out into a pure function, as in the retry example above.",
        "**\"I keep changing the test when I refactor.\"** The test is asserting on structure rather than behaviour — usually too many `toHaveBeenCalledWith` assertions. Assert on outputs and observable state instead.",
        "The general form: **test-driven or not, tests exert pressure towards smaller units with fewer dependencies.** That pressure is most of the value, and it arrives whether or not you write the test first.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What makes code hard to unit test?",
      answer:
        "Hidden dependencies — time, randomness, I/O and global state that the function reaches for rather than receiving. Because they are not in the signature, a caller cannot control them, so the test has to intercept them with mocks or fake timers. Passing them in makes the function deterministic and makes its real dependencies visible in the signature.",
    },
    {
      question: "What is the difference between a stub, a fake, a spy and a mock?",
      answer:
        "A stub returns canned values so the code can proceed. A fake is a real working implementation unsuitable for production, like an in-memory repository. A spy records calls for later assertion. A mock has expectations built in and fails if the interaction differs. Stubs and fakes support testing behaviour; spies and mocks test interactions, which couples the test to implementation.",
    },
    {
      question: "Why prefer asserting on state rather than on calls?",
      answer:
        "Asserting that a collaborator was called with particular arguments encodes *how* the code works, so renaming a method, batching two calls or reordering them breaks the test without any change in behaviour. Asserting on the returned value or on observable state — what a fake repository now contains — survives refactoring and actually fails when the behaviour is wrong.",
    },
    {
      question: "What does it mean when a test needs six mocks?",
      answer:
        "That the unit has six dependencies, which usually means it is doing several jobs. The test is reporting a design problem rather than a testing one. Splitting the unit reduces both the number of mocks and the number of reasons the code has to change — which is the pressure towards smaller units that testing exerts whether or not you write tests first.",
    },
  ],
  takeaways: [
    "Time, randomness, I/O and global state are the four hidden dependencies that make code hard to test",
    "Pass them in rather than reaching for them — the signature then documents what the function really touches",
    "Inject at the boundary only; most functions should take data and return data",
    "Put decisions in pure functions and effects in a thin shell, then table-test the decisions",
    "Fakes make the best doubles because they behave correctly and let tests exercise real logic",
    "Assert on results and observable state, not on which collaborator was called",
    "A test needing many mocks, or breaking on every refactor, is reporting a design problem",
  ],
  status: "available",
};
