import type { Lesson } from "@/content/types";

export const typingTestsLesson: Lesson = {
  id: "testing-typing",
  slug: "typing-tests-and-mocks",
  moduleSlug: "testing-debugging",
  title: "Typing Tests, Mocks & Fixtures",
  summary:
    "Keeping tests type-safe: mocks that carry the signature of what they replace, fixtures built from factories rather than duplicated literals, and why a mock typed as `any` is worse than no test at all.",
  estimatedMinutes: 35,
  objectives: [
    "Type a mock function so wrong arguments fail to compile",
    "Use vi.mocked to reach mock methods on a typed value",
    "Build typed fixtures with factories and partial overrides",
    "Type a partial mock of a large interface honestly",
    "Explain why untyped mocks let tests drift from reality",
  ],
  sections: [
    {
      id: "why",
      heading: "Why typed mocks matter more than typed tests",
      body: [
        "A test asserts that code behaves correctly **given certain inputs**. If the mock supplying those inputs has drifted from the real thing, the test proves nothing — and worse, it passes, so nobody looks at it.",
        "This is the specific failure: a function's signature changes, every real call site is updated by the compiler, and the mocks are not, because they were typed as `any`. The suite stays green while testing an interface that no longer exists.",
        "Typed mocks close that gap. When the interface changes, the mocks fail to compile alongside everything else.",
      ],
    },
    {
      id: "typed-mocks",
      heading: "Typing vi.fn",
      body: [
        "`vi.fn()` with no type parameter accepts anything and returns `any`. Passing the function type makes both the calls and the return value checked.",
      ],
      examples: [
        {
          id: "vi-fn-typed",
          title: "The signature, enforced",
          ts: `import { vi } from "vitest";

interface Mailer {
  send(to: string, body: string): Promise<boolean>;
}

// The mock now has Mailer["send"]'s signature.
const send = vi.fn<Mailer["send"]>();

send(42, "hi");
send.mockResolvedValue("yes");`,
          output: `src/typed.test.ts(4,6): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
src/typed.test.ts(5,24): error TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'.`,
          explanation:
            "Two different mistakes caught: calling the mock wrongly in the test, and configuring it to return something the real function never could. The second is the more valuable — a mock that resolves to the wrong shape is exactly how a test comes to assert something impossible.",
        },
        {
          id: "mock-object",
          title: "Mocking a whole dependency",
          ts: `import { vi, describe, it, expect } from "vitest";

// Annotating the object is enough: every method is checked against Mailer,
// so a renamed or removed method breaks the test file too.
const mailer: Mailer = {
  send: vi.fn().mockResolvedValue(true),
};

describe("typed mocks", () => {
  it("satisfies an interface", async () => {
    await mailer.send("a@b.c", "hi");

    // \`mailer.send\` is typed as Mailer["send"], which has no \`mock\`
    // property — vi.mocked re-adds the mock API without a cast.
    expect(vi.mocked(mailer.send)).toHaveBeenCalledWith("a@b.c", "hi");
  });
});`,
          explanation:
            "`vi.mocked` is the piece people reach for `as any` instead of. Once a mock is stored in a variable typed as the real interface, its mock-specific properties are no longer visible — `vi.mocked(fn)` is a typed identity function that brings them back, and it is `jest.mocked` in Jest.",
        },
        {
          id: "spies",
          title: "Spies, and restoring them",
          ts: `import { vi, describe, it, expect } from "vitest";

describe("spies", () => {
  it("spies restore", () => {
    const obj = { greet: (n: string) => \`hi \${n}\` };

    // spyOn keeps the original and can hand it back.
    const spy = vi.spyOn(obj, "greet").mockReturnValue("mocked");
    expect(obj.greet("x")).toBe("mocked");

    spy.mockRestore();
    expect(obj.greet("x")).toBe("hi x");
  });
});

// The three reset methods, which are not interchangeable:
//   mockClear()    — forget recorded calls, keep the implementation
//   mockReset()    — also drop the implementation
//   mockRestore()  — put the original back (spyOn only)
//
// Set \`restoreMocks: true\` in the Vitest config and it happens
// automatically after every test, which is what you want.`,
          explanation:
            "`spyOn` is preferable to replacing a method by hand precisely because it can be restored. A hand-replaced method stays replaced for every subsequent test in the file, which is the leaked-state problem from lesson 1 in its most common form.",
        },
      ],
      pitfalls: [
        {
          title: "Mocking what you own, rather than the boundary",
          body: "Mocking your own modules to make a test pass couples the test to the current structure — extract a function and the test breaks even though nothing observable changed. Mock at real boundaries: the network, the clock, the filesystem, third-party SDKs. If a test needs five mocks, that is usually telling you the code has five dependencies it should not have, which is lesson 3.",
        },
      ],
    },
    {
      id: "partial-mocks",
      heading: "Partial mocks, honestly",
      body: [
        "Real interfaces are often large and a test needs three methods of them. Writing the other twenty is waste; casting the object to the interface is a lie that will not fail when the interface changes.",
        "There are two honest ways to say \"this is a partial stand-in\", and each is right in different circumstances.",
      ],
      examples: [
        {
          id: "partial-mock",
          title: "Partial, and Pick",
          ts: `interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
  put<T>(url: string, body: unknown): Promise<T>;
  delete(url: string): Promise<void>;
  // ...and a dozen more
}

// 1. Partial<T> — honest about being incomplete, and still checked.
//    The cast at the call site is where you take responsibility.
const client: Partial<ApiClient> = {
  get: vi.fn().mockResolvedValue({ id: 1 }),
};
const service = createUserService(client as ApiClient);

// 2. Better: narrow what the code under test actually requires, so no
//    cast is needed and the dependency is documented in the signature.
type UserApi = Pick<ApiClient, "get" | "post">;

function createUserService(api: UserApi) {
  return {
    find: (id: string) => api.get<User>(\`/users/\${id}\`),
  };
}

const api: UserApi = {
  get: vi.fn().mockResolvedValue({ id: 1 }),
  post: vi.fn(),
};
const service2 = createUserService(api);   // no cast anywhere`,
          explanation:
            "The second is worth the small refactor. Narrowing the parameter to `Pick<ApiClient, \"get\" | \"post\">` makes the real dependency visible in the signature, removes the cast, and means the mock is complete rather than partial. A function that says it needs the whole client when it uses two methods is over-declaring, and the test is what makes that obvious.",
        },
      ],
    },
    {
      id: "fixtures",
      heading: "Fixtures: factories, not literals",
      body: [
        "Copying an object literal into thirty tests means that adding a required field breaks thirty tests, and each one has to be edited by hand. It also buries the thing each test actually cares about in a wall of irrelevant properties.",
        "A **factory with overrides** fixes both: one place to update, and each test states only what matters to it.",
      ],
      examples: [
        {
          id: "factory",
          title: "One factory, readable tests",
          ts: `interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  createdAt: Date;
}

// Sensible defaults, overridable per test.
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "member",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

// Each test now says exactly what it is about, and nothing else.
it("denies access to members", () => {
  expect(canDelete(makeUser({ role: "member" }))).toBe(false);
});

it("allows admins", () => {
  expect(canDelete(makeUser({ role: "admin" }))).toBe(true);
});

// Nested objects need their own factories, or the override replaces
// the whole branch rather than merging into it.
export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    customer: makeUser(),
    items: [makeItem()],
    ...overrides,
  };
}`,
          explanation:
            "The nested note is the one that catches people: `makeOrder({ customer: { name: \"X\" } })` does not type-check against `Partial<Order>` unless `customer` is itself partial, and if you loosen it to allow that, the spread replaces the whole customer rather than merging. Composing factories — `makeOrder({ customer: makeUser({ name: \"X\" }) })` — keeps both the types and the semantics right.",
        },
      ],
      pitfalls: [
        {
          title: "A shared fixture object that tests mutate",
          body: "`const user = makeUser()` at module scope, mutated by one test, is the leaked state from lesson 1. A factory sidesteps it entirely because every call returns a fresh object — which is the main reason to prefer a function over a shared constant even when the value never changes.",
        },
      ],
    },
    {
      id: "type-testing",
      heading: "Testing the types themselves",
      body: [
        "For a library, the types are part of the public API and can regress like anything else. Vitest can assert on them, and the assertions run at type-check time rather than at runtime.",
        "This is worth it for a published package or a heavily-used internal utility. For application code it is usually not — the application's own compilation already exercises the types.",
      ],
      examples: [
        {
          id: "type-tests",
          title: "expectTypeOf",
          ts: `import { expectTypeOf, describe, it } from "vitest";

describe("Result", () => {
  it("narrows on the discriminant", () => {
    const result = parseAge("42");

    expectTypeOf(result).toEqualTypeOf<Result<number, ParseError>>();

    if (result.ok) {
      expectTypeOf(result.value).toEqualTypeOf<number>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<ParseError>();
    }
  });

  it("rejects the wrong argument type", () => {
    // @ts-expect-error — the test is that this does not compile
    parseAge(42);
  });
});

// Run with:  vitest --typecheck`,
          explanation:
            "The `@ts-expect-error` trick from module 10 is doing real work here: the assertion is that the line *fails* to compile, and if a change ever makes it legal, `@ts-expect-error` itself becomes an error. That is a genuine test of a negative, which is otherwise hard to express.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does it matter that mocks are typed?",
      answer:
        "Because an untyped mock cannot drift out of sync with the thing it replaces — it just keeps passing. Change a function's signature and the compiler updates every real call site while `any`-typed mocks stay as they were, so the suite stays green while testing an interface that no longer exists. Typed mocks fail to compile alongside everything else.",
    },
    {
      question: "What is vi.mocked for?",
      answer:
        "Once a mock is stored in a variable typed as the real interface, its mock-specific properties like `.mock.calls` and `.mockReturnValue` are no longer visible to TypeScript. `vi.mocked(fn)` is a typed identity function that re-exposes them without a cast — it is what you use instead of `as any`, and `jest.mocked` is the equivalent.",
    },
    {
      question: "What is the difference between mockClear, mockReset and mockRestore?",
      answer:
        "`mockClear` forgets recorded calls but keeps the implementation. `mockReset` also removes the implementation. `mockRestore` puts the original method back and only works for spies created with `spyOn`. Enabling `restoreMocks` in the config applies restoration automatically after each test, which prevents the most common form of leaked state.",
    },
    {
      question: "How would you mock a large interface when a test needs two methods?",
      answer:
        "Preferably by narrowing what the code under test asks for — `Pick<ApiClient, \"get\" | \"post\">` — so the mock is complete, no cast is needed, and the real dependency is documented in the signature. Failing that, `Partial<ApiClient>` with a cast at the call site is honest about being incomplete, whereas casting a bare object literal to the full interface is a lie that will not fail when the interface changes.",
    },
    {
      question: "Why use factories for fixtures rather than shared objects?",
      answer:
        "A factory returns a fresh object per call, so no test can pollute another by mutating it, and overrides let each test state only the field it cares about. Adding a required field means editing one function instead of thirty literals. For nested data, compose factories rather than passing partial nested overrides, because a spread replaces a branch rather than merging into it.",
    },
  ],
  takeaways: [
    "An untyped mock cannot fail when the real interface changes — that is the whole argument for typing them",
    "`vi.fn<Signature>()` checks both the calls and the configured return value",
    "`vi.mocked(fn)` re-exposes the mock API on a value typed as the real interface, replacing `as any`",
    "`spyOn` can restore the original; hand-replacing a method leaks into every later test",
    "`mockClear` / `mockReset` / `mockRestore` are three different things — and `restoreMocks: true` automates the last",
    "Narrow the dependency with `Pick` rather than casting a partial object to a large interface",
    "Fixtures should be factories with overrides, composed for nested data",
    "`expectTypeOf` and `@ts-expect-error` test the types themselves — worth it for libraries, rarely for applications",
  ],
  status: "available",
};
