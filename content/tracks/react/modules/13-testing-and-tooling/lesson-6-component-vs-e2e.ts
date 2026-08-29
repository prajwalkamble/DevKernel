import type { Lesson } from "@/content/types";

export const componentVsE2ELesson: Lesson = {
  id: "react-component-vs-e2e",
  slug: "component-tests-and-end-to-end",
  moduleSlug: "testing-typescript-tooling",
  title: "Component Tests Against End-to-End",
  summary:
    "What jsdom cannot tell you, what a real browser can, and how to divide a suite between them without ending up with a thousand slow tests. Playwright's shape, and where the test files go.",
  estimatedMinutes: 27,
  objectives: [
    "List what jsdom cannot answer",
    "Write a Playwright test and see what it shares with Testing Library",
    "Divide coverage between the two kinds",
    "Say why an e2e suite has to be small",
    "Place test files so nobody has to search for them",
  ],
  sections: [
    {
      id: "the-gap",
      heading: "What jsdom cannot answer",
      body: [
        "jsdom implements the DOM API. It does not implement a browser, and the gap is specific enough to list.",
        "**No layout.** `getBoundingClientRect` returns zeros, `offsetWidth` is `0`, and nothing has a position. Anything that measures — a virtualised list, a tooltip that flips at the viewport edge, a drag — cannot be tested there.",
        "**No CSS.** Stylesheets are not applied, so a test cannot tell you an element was hidden by `display: none` from a class, or that a button was covered by an overlay, or that the contrast is unreadable.",
        "**No real navigation.** No history that goes anywhere, no page load, no back button that reloads.",
        "**One page, one origin.** No second tab, no iframe worth speaking of, no download, no cookies moving between domains.",
        "**Not the engine your users run.** It is a third implementation, so it differs from both Chromium and WebKit in ways you find out about in production.",
        "Everything on that list is a real bug that a green component suite will not catch — which is the entire argument for the second kind of test.",
      ],
    },
    {
      id: "playwright",
      heading: "What a browser test looks like",
      body: [
        "The pleasant surprise is how little there is to learn. Playwright's locators are Testing Library's queries with different names, in the same priority order, for the same reason.",
      ],
      examples: [
        {
          id: "side-by-side",
          title: "The same intent, both tools",
          lang: "jsx",
          code: `/* Testing Library — jsdom, one component, milliseconds. */
render(<LoginForm onSubmit={fakeSubmit} />);
await user.type(screen.getByLabelText("Email address"), "ada@example.com");
await user.click(screen.getByRole("button", { name: "Sign in" }));
expect(await screen.findByRole("status")).toHaveTextContent("Signed in");

/* Playwright — a real browser, the whole app, seconds. */
await page.goto("/login");
await page.getByLabel("Email address").fill("ada@example.com");
await page.getByRole("button", { name: "Sign in" }).click();
await expect(page.getByRole("status")).toHaveText("Signed in");`,
          explanation:
            "`getByRole` and `getByLabel` are the same idea in both, because Playwright adopted Testing Library's philosophy wholesale. What differs is what is underneath: the first renders one component into jsdom with a fake submit handler; the second navigates a real browser to a real route with a real server behind it. The learning cost of the second tool is close to zero; the running cost is not.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Nothing here to annotate either. Both tools infer everything: the
   locators return typed handles and the assertions take them. */

/* Testing Library — jsdom, one component, milliseconds. */
render(<LoginForm onSubmit={fakeSubmit} />);
await user.type(screen.getByLabelText("Email address"), "ada@example.com");
await user.click(screen.getByRole("button", { name: "Sign in" }));
expect(await screen.findByRole("status")).toHaveTextContent("Signed in");

/* Playwright — a real browser, the whole app, seconds. */
await page.goto("/login");
await page.getByLabel("Email address").fill("ada@example.com");
await page.getByRole("button", { name: "Sign in" }).click();
await expect(page.getByRole("status")).toHaveText("Signed in");`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Playwright's assertions retry, so no waitFor",
          body: "`await expect(locator).toHaveText(…)` polls until it passes or times out — the waiting is built into the assertion rather than a separate step. Locators are lazy too: `page.getByRole(…)` describes an element rather than finding one, so it is resolved fresh at each retry and cannot go stale.",
        },
      ],
    },
    {
      id: "dividing",
      heading: "Dividing the work",
      body: [
        "The useful split is not by size but by **what the test is allowed to be wrong about.**",
        "**Component tests** answer: given these props and this API response, does the component do the right thing? States, branches, edge cases, errors, empty results, validation. There are many of these because there are many cases, and they cost milliseconds each.",
        "**End-to-end tests** answer: does the whole thing actually work? Routing, the real server, auth, the build output, the browser. There are few of these because they cost seconds each and because each one can fail for a hundred unrelated reasons.",
        "A concrete division for a checkout flow: every validation rule, every error response, every disabled-button condition as component tests; **one** end-to-end test that adds an item, checks out, and sees a confirmation. If that one passes, the pieces are wired together; the component tests already proved the pieces are right.",
        "The failure mode to avoid is a hundred end-to-end tests covering variations. They will take twenty minutes, fail intermittently for reasons that are not bugs, and be muted within two months.",
      ],
    },
    {
      id: "in-browser",
      heading: "The third option",
      body: [
        "There is a middle: run **component** tests in a real browser. Vitest's browser mode and Playwright's component testing both do this — one component, no server, no routing, but real layout and real CSS.",
        "It is the right answer for the specific things jsdom cannot see: a component that measures itself, a popover that flips, a virtualised list, anything with a CSS-driven visibility rule. It costs perhaps ten times a jsdom test and a fraction of an end-to-end one.",
        "It is not the right answer for everything, because a suite of two thousand browser-rendered component tests is slow enough that people stop running it locally, and a test suite nobody runs locally is a CI notification rather than a tool.",
      ],
    },
    {
      id: "where",
      heading: "Where the files go",
      body: [
        "The same colocation argument as module 3, and the same reason: everything that changes together should live together.",
        "**Component tests beside their component.** `Button.tsx` and `Button.test.tsx` are adjacent in the listing, so an untested file is a visible gap rather than an absence elsewhere in the tree, and moving or deleting the component takes its test with it.",
        "**End-to-end tests in their own top-level directory.** They are not about a component — they are about a journey across many — so there is nowhere to colocate them. `e2e/checkout.spec.ts` is about the checkout flow, not about any file.",
      ],
      examples: [
        {
          id: "layout",
          title: "The whole arrangement",
          lang: "bash",
          code: `my-app/
├── e2e/
│   ├── checkout.spec.ts          # a journey, so it belongs to no component
│   └── auth.spec.ts
├── src/
│   └── features/
│       └── cart/
│           ├── Cart.tsx
│           ├── Cart.test.tsx     # beside its subject
│           ├── useCart.ts
│           ├── useCart.test.ts
│           └── total.ts
├── playwright.config.ts
└── vitest.config.ts`,
          explanation:
            "Two config files because they are two different runners against two different environments, and keeping them separate is what stops `npm test` from starting a browser. The naming convention matters as much as the location: `*.test.tsx` for the component runner and `*.spec.ts` for Playwright, so neither tool ever picks up the other's files.",
        },
      ],
      pitfalls: [
        {
          title: "Exclude the e2e directory from the unit runner",
          body: "Vitest's default include picks up anything matching its pattern, so an `e2e/` file with a compatible name gets run by the wrong tool and fails with an error about `page` being undefined. One `exclude` line, and it is worth writing before it happens rather than after.",
        },
      ],
    },
    {
      id: "what-not-to-test",
      heading: "What not to test at all",
      body: [
        "**Third-party components.** The library's maintainers test their dropdown. Test that *your* code passes it the right props and reacts to its callbacks.",
        "**Types.** If TypeScript proves it, a test asserting it is duplicated work that goes stale.",
        "**Trivial components.** A component that renders its props into a `<span>` has one behaviour, and it is the one you can see.",
        "**Implementation.** Already said, and worth saying once more: no counting renders, no asserting on internal state, no snapshotting markup. The measure of a good test is that it fails when the behaviour is wrong and survives when only the code changes.",
        "Coverage percentage is a poor target for exactly this reason — it is easy to reach eighty percent by testing the trivial things, and the number says nothing about whether the checkout works.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What can jsdom not test?",
      answer:
        "Anything involving layout, CSS, real navigation, or more than one page. `getBoundingClientRect` returns zeros, stylesheets are not applied, there is no history that goes anywhere and no second tab. So a virtualised list, a tooltip that flips at the viewport edge, an element hidden by a class, or a button covered by an overlay are all invisible to a jsdom test — and it is a third DOM implementation, so it differs from the engines your users run.",
    },
    {
      question: "How do you divide tests between component tests and end-to-end?",
      answer:
        "By what each is allowed to be wrong about. Component tests cover cases — every branch, error, empty state and validation rule — because they cost milliseconds. End-to-end tests cover wiring: routing, the real server, auth, the build. There should be few of them, because each is slow and can fail for a hundred unrelated reasons. For a checkout: every rule as a component test, one e2e that buys something.",
    },
    {
      question: "Why not write many end-to-end tests?",
      answer:
        "They are slow and each one has a hundred ways to fail that are not bugs. A suite of a hundred takes twenty minutes, goes intermittently red, and gets muted within a couple of months — at which point it is worse than not having it, because everyone believes it is covering something. Keep the number small enough that a failure is always investigated.",
    },
    {
      question: "Where do test files go?",
      answer:
        "Component tests beside their component, so an untested file is a visible gap and moving or deleting the component takes its test with it. End-to-end tests in a top-level `e2e/` directory, because a journey belongs to no single component. Different extensions for each — `*.test.tsx` and `*.spec.ts` — so neither runner picks up the other's files.",
    },
  ],
  takeaways: [
    "jsdom has no layout, no CSS, no real navigation and no second page",
    "Playwright's locators are Testing Library's queries under different names",
    "Playwright's assertions retry, so there is no separate waitFor",
    "Component tests cover cases; end-to-end tests cover wiring",
    "One e2e test per critical journey, not one per variation",
    "Browser-based component tests are the middle answer for anything that measures itself",
    "Colocate component tests; put e2e tests in their own directory",
    "Different file extensions so the two runners never collide",
    "Do not test third-party components, types, trivial components, or implementation",
  ],
  status: "available",
};
