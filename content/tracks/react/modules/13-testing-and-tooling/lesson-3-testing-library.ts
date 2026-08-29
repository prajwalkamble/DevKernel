import type { Lesson } from "@/content/types";

export const testingLibraryLesson: Lesson = {
  id: "react-testing-library",
  slug: "testing-library",
  moduleSlug: "testing-typescript-tooling",
  title: "Testing Library: Querying the Way a User Would",
  summary:
    "The library's one opinion and everything that follows from it: the query priority ladder, the three prefixes and what each does when it fails, why getByTestId is last, and the error message that makes a failing test readable.",
  estimatedMinutes: 30,
  objectives: [
    "Set up Vitest, jsdom and Testing Library",
    "Choose a query from the priority ladder",
    "Distinguish getBy, queryBy and findBy",
    "Read a failing query's output",
    "Say what a test that queries by test id is not testing",
  ],
  sections: [
    {
      id: "the-opinion",
      heading: "The one opinion",
      body: [
        "*The more your tests resemble the way your software is used, the more confidence they can give you.*",
        "That is the library's stated principle, and every design decision in it follows. There is no way to read a component's state, no way to call a method on it, no shallow rendering, and no wrapper object with an API. You get a DOM, and you find things in it the way a person would.",
        "The practical consequence is worth being explicit about: **a test written this way survives a refactor.** Rename the state, split the component into three, swap `useState` for a reducer, move to a store — the test does not mention any of that. It types into a field labelled *Email address* and expects a message. If that still works, the refactor was correct, which is exactly what you wanted a test to tell you.",
      ],
    },
    {
      id: "setup",
      heading: "Setting it up",
      body: [
        "Vitest, jsdom, Testing Library, and `jest-dom` for the matchers. Four packages and one config file.",
      ],
      examples: [
        {
          id: "config",
          title: "The whole setup",
          lang: "javascript",
          code: `// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    /* A DOM implementation in Node. Not a browser: no layout, no real
       paint, and getBoundingClientRect returns zeros — which matters for
       anything that measures. */
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

// vitest.setup.ts — adds toBeInTheDocument, toHaveTextContent and the rest.
import "@testing-library/jest-dom/vitest";`,
          explanation:
            "The `environment: \"jsdom\"` line is the one worth understanding. jsdom implements the DOM API in Node without a rendering engine, so everything about structure and events works and everything about geometry does not. A component that reads `offsetWidth` will see `0` and must be tested elsewhere.",
        },
      ],
      pitfalls: [
        {
          title: "jsdom is not a browser",
          body: "No layout, so all measurements are zero. No `IntersectionObserver` or `matchMedia` unless you stub them. No CSS cascade, so a test cannot tell you an element was visually hidden by a stylesheet. Those gaps are the honest boundary between component tests and the browser-based tests in lesson 6.",
        },
      ],
    },
    {
      id: "the-ladder",
      heading: "The priority ladder",
      body: [
        "Testing Library gives you many queries and an order to prefer them in, and the order is not a style preference: each rung down is one step further from what a user can actually perceive.",
        "Watch the ladder run against a small page — the query it picks for each element is computed from what that element offers, so the one that has to fall all the way to a test id is the one no user could have perceived either.",
      ],
      visual: {
        id: "query-ladder-visual",
        kind: "react-tooling",
        algorithm: "query-priority",
        title: "Six elements down the ladder",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "the-queries",
          title: "The rungs, in order",
          lang: "jsx",
          code: `/* 1. Role and accessible name. The default for nearly everything. */
screen.getByRole("button", { name: "Sign in" });
screen.getByRole("textbox", { name: "Email address" });
screen.getByRole("heading", { level: 1 });
screen.getByRole("alert");

/* 2. Label text. For form fields, and it fails when there is no label —
      which is a bug the test is entitled to notice. */
screen.getByLabelText("Email address");

/* 3. Placeholder. A fallback for a field with no label. Accepting it
      concedes that the field has no label, since a placeholder vanishes
      as soon as the user types. */
screen.getByPlaceholderText("you@example.com");

/* 4. Text. For content: paragraphs, messages, headings you are asserting
      the words of rather than the structure. */
screen.getByText("3 results");
screen.getByText(/\\d+ results/);

/* 5. Display value, alt text, title. Narrow cases the rungs above miss. */
screen.getByDisplayValue("ada@example.com");
screen.getByAltText("Ada Lovelace");

/* 6. Test id. The last rung, and invisible to every user. */
screen.getByTestId("toast-container");`,
          explanation:
            "`getByRole` covers most of a real page because most of a real page is buttons, links, headings, fields and landmarks — all of which have roles, and all of which have accessible names if the markup is any good. When it does not work, the usual reason is that the markup has no name to find, and the fix is to the markup.",
        },
      ],
      pitfalls: [
        {
          title: "Why `getByTestId` is last",
          body: "It is an attribute you added for the test. It has no role, no name, and no meaning to a screen reader, a keyboard user or a crawler — so a suite that leans on it can be entirely green over an interface nobody can operate. It is legitimate for something genuinely imperceptible: a toast container, a canvas, a wrapper you need to scope a query to. It is a smell on a button.",
        },
      ],
    },
    {
      id: "prefixes",
      heading: "getBy, queryBy, findBy",
      body: [
        "Three prefixes, and choosing wrong is the most common cause of a flaky React test.",
        "**`getBy…`** — must be there now. Throws if it is not, and the throw is a good error. This is the default.",
        "**`queryBy…`** — might not be there. Returns `null` instead of throwing. Its **only** correct use is asserting absence: `expect(screen.queryByRole(\"alert\")).not.toBeInTheDocument()`.",
        "**`findBy…`** — will be there soon. Returns a promise, retries for a timeout, and resolves when the element appears. Always awaited. This is what you use after anything asynchronous.",
        "And `…AllBy…` on each of the three, for when you expect several.",
      ],
      examples: [
        {
          id: "prefix-choice",
          title: "The same assertion, three ways, two of them wrong",
          lang: "jsx",
          code: `await user.click(screen.getByRole("button", { name: "Save" }));

/* ✗ Fails, and looks like a bug in the component. The save is async, so
   the message is not in the DOM in the same tick as the click. */
expect(screen.getByRole("status")).toHaveTextContent("Saved");

/* ✗ Worse: passes today, and passes tomorrow when the component is broken.
   queryBy returns null, and null is not in the document, so the negative
   assertion is trivially true and the test asserts nothing. */
expect(screen.queryByRole("status")).not.toBeInTheDocument();

/* ✓ Waits for it to appear, with a real timeout and a real failure. */
expect(await screen.findByRole("status")).toHaveTextContent("Saved");

/* ✓ And the one thing queryBy is for. */
expect(screen.queryByRole("alert")).not.toBeInTheDocument();`,
          explanation:
            "The second case is the dangerous one, because it is green. A `queryBy` used for a positive assertion, or a negative assertion made before the thing has had a chance to appear, is a test that will keep passing after the feature is deleted.",
        },
      ],
      pitfalls: [
        {
          title: "Asserting that something never appears needs a wait",
          body: "`expect(queryByRole(\"alert\")).not.toBeInTheDocument()` immediately after an action proves only that it has not appeared *yet*. If you mean it never appears, wait for something that does happen first, and then assert the absence.",
        },
      ],
    },
    {
      id: "the-error",
      heading: "What a failing query tells you",
      body: [
        "This is the quiet reason the library is pleasant to use: when a query fails, it prints the roles it *did* find and the DOM it was looking at.",
      ],
      examples: [
        {
          id: "failure",
          title: "A real failure, from a real run",
          lang: "bash",
          code: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Save"

Here are the accessible roles:

  button:

  Name "Save draft":
  <button />

  Name "Close":
  <button
    aria-label="Close"
  />

  --------------------------------------------------`,
          explanation:
            "The test asked for a button named `Save`; the page has one named `Save draft`. The error says so, lists every button it found with its accessible name, and prints the DOM below. Nine failures out of ten are diagnosed without opening the component — and the tenth teaches you something about accessible names, because the reason a button has no name is always that the markup gives it none.",
          requires: "vitest with Testing Library (this is its reporter output, not a program's)",
        },
      ],
    },
    {
      id: "hygiene",
      heading: "The small habits",
      body: [
        "**`screen`, not the return value of `render`.** `render` returns queries scoped to its container, and destructuring them was the old style. `screen` queries the whole document, which is where portals and dialogs actually go.",
        "**No cleanup call.** Testing Library's Vitest integration unmounts between tests automatically. Manual `cleanup()` is legacy.",
        "**One user flow per test.** Not one assertion — a flow may need three — but not two unrelated flows either, or a failure tells you less than it should.",
        "**Do not snapshot a component.** A snapshot of rendered markup fails on every innocuous change and passes on every meaningful one, so it gets updated without being read. Assert the things you actually care about.",
        "**Do not test implementation.** No reaching for state, no counting renders, no asserting that a mocked child was called. If a test breaks when the component is reorganised and the behaviour is unchanged, it was testing the wrong thing.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is Testing Library's guiding principle?",
      answer:
        "That the more your tests resemble how the software is used, the more confidence they give. Everything follows from it: no access to state, no method calls, no shallow rendering — just a DOM you query the way a person would. The payoff is that a test survives a refactor, because it never mentioned the state or the component structure that changed.",
    },
    {
      question: "What is the query priority order and why does it exist?",
      answer:
        "Role with an accessible name first, then label text, then placeholder, then text content, then narrow cases like display value and alt text, and test id last. Each rung down is one step further from what a user can perceive, so the position of a query measures how far the test has drifted from the user's experience. A test id is invisible to everyone, which is why a suite that leans on it can be green over an interface nobody can operate.",
    },
    {
      question: "When do you use getBy, queryBy and findBy?",
      answer:
        "`getBy` when it must be there now — it throws with a useful error, and it is the default. `queryBy` only for asserting absence, since it returns null rather than throwing. `findBy` after anything asynchronous: it returns a promise and retries until the element appears. Using `queryBy` for a positive assertion is the classic silently-passing test, because null is not in the document either.",
    },
    {
      question: "Why not snapshot components?",
      answer:
        "Because the failure and the fix are the same keystroke. A markup snapshot breaks on every whitespace or class change and passes through most behavioural ones, so people update it without reading it and the test stops carrying information. Assert the specific things you care about instead — the text, the role, the disabled state.",
    },
  ],
  takeaways: [
    "Query the DOM the way a user would; never reach for state or internals",
    "A test written that way survives a refactor, which is what you wanted from it",
    "`getByRole` with an accessible name first — it covers most of a real page",
    "`getByTestId` last, because no user can perceive it",
    "`getBy` must be there now, `queryBy` only for absence, `findBy` after anything async",
    "`queryBy` in a positive assertion is a test that passes over a deleted feature",
    "A failing query prints every role it found and the DOM it searched",
    "`screen`, not `render`'s return value — portals go outside the container",
    "No snapshots of components: the failure and the fix are the same keystroke",
  ],
  status: "available",
};
