import type { Lesson } from "@/content/types";

export const testingInteractionLesson: Lesson = {
  id: "react-testing-interaction",
  slug: "testing-interaction-and-async",
  moduleSlug: "testing-typescript-tooling",
  title: "Testing Interaction & Async UI",
  summary:
    "userEvent against fireEvent — thirteen events against one, counted from a real run — waiting for a screen that has not settled yet, testing a form end to end, and the act warning that means you forgot an await.",
  estimatedMinutes: 30,
  objectives: [
    "Use userEvent and say what it does that fireEvent does not",
    "Test a form the way a person fills one in",
    "Wait for asynchronous UI without arbitrary timeouts",
    "Diagnose an act() warning",
    "Test the loading and error states, not just the happy one",
  ],
  sections: [
    {
      id: "user-event",
      heading: "One click, thirteen events",
      body: [
        "`fireEvent.click(button)` dispatches a click event. That is all it does, and it is not what a click is.",
        "A real click is a sequence: the pointer arrives, the mouse enters, they both move, the button goes down, focus moves, the button comes up, and only then does `click` fire. Components listen to all of these — a menu that opens on hover, a drag that starts on `pointerdown`, a validation that runs on `blur`.",
        "`userEvent.click(button)` dispatches the whole sequence. The list below was captured by attaching a listener for every pointer, mouse and focus event to a real button and calling each API once.",
      ],
      examples: [
        {
          id: "counted",
          title: "What each one dispatched",
          lang: "bash",
          code: `fireEvent.click:  ["click"]

userEvent.click:  ["pointerover","pointerenter","mouseover","mouseenter",
                   "pointermove","mousemove","pointerdown","mousedown",
                   "focus","focusin","pointerup","mouseup","click"]`,
          explanation:
            "Thirteen against one. That gap is the whole argument: `fireEvent` tests that your handler works, `userEvent` tests that a user can reach it. It is also why `userEvent` catches disabled buttons, elements covered by an overlay, and anything that depends on having been focused — none of which `fireEvent` can see.",
          requires: "vitest with Testing Library (this is a recorded event log, not a program's output)",
        },
        {
          id: "setup-call",
          title: "The two lines it needs",
          lang: "jsx",
          code: `import userEvent from "@testing-library/user-event";

test("submits", async () => {
  /* setup() once per test. It installs the pointer and keyboard state that
     makes a sequence coherent — where the pointer is, what is focused. */
  const user = userEvent.setup();
  render(<Form />);

  /* Every method is async and must be awaited. Forgetting is the number
     one cause of an act() warning. */
  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
});`,
          explanation:
            "`setup()` returns an instance carrying pointer and keyboard state, which is what lets a later `user.keyboard(\"{Shift>}\")` mean something. Calling `userEvent.click` directly still works and is the legacy API.",
          alternates: [
            {
              lang: "tsx",
              code: `import userEvent from "@testing-library/user-event";

test("submits", async () => {
  /* setup() once per test. It installs the pointer and keyboard state that
     makes a sequence coherent — where the pointer is, what is focused.
     Its return type is \`UserEvent\`, so \`user\` needs no annotation. */
  const user = userEvent.setup();
  render(<Form />);

  /* Every method is async and must be awaited. Forgetting is the number
     one cause of an act() warning — and it is not a type error, because
     an ignored promise is perfectly legal. */
  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
});`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "When fireEvent is still right",
          body: "For events a user cannot produce directly — `fireEvent.scroll`, a synthetic `error` on an image, a `message` from a worker. Also occasionally for speed in a very large suite, since `userEvent` dispatching thirteen events costs thirteen times as much. Default to `userEvent` and drop down deliberately.",
        },
      ],
    },
    {
      id: "a-real-test",
      heading: "A form, end to end",
      body: [
        "Here is a complete, passing test of a login form: fill the field, submit, and wait for the result. Nothing in it mentions state, and the component underneath could be rewritten around a reducer without touching a line.",
      ],
      examples: [
        {
          id: "form-test",
          title: "The component and its test",
          lang: "jsx",
          code: `/* ---- LoginForm.tsx ---------------------------------------------------- */
export function LoginForm({ onSubmit }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const email = new FormData(event.currentTarget).get("email");
        setStatus(await onSubmit(email));
        setBusy(false);
      }}
    >
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" placeholder="you@example.com" />
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}

/* ---- LoginForm.test.tsx ----------------------------------------------- */
test("signs in and reports the result", async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={async (email) => \`Signed in as \${email}\`} />);

  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("status")).toHaveTextContent("Signed in as ada@example.com");
});`,
          output: ` Test Files  1 passed (1)
      Tests  1 passed (1)`,
          explanation:
            "Read the test as a sentence and it is one: type an email into the field labelled *Email address*, press the button called *Sign in*, and expect a status message naming that email. Every identifier in it is something a user can see. That is why it will still be correct after the component is rewritten.",
          requires: "vitest with Testing Library (this is its summary, not a program's output)",
          alternates: [
            {
              lang: "tsx",
              requires: "vitest with Testing Library (this is its summary, not a program's output)",
              code: `/* ---- LoginForm.tsx ---------------------------------------------------- */
export function LoginForm({ onSubmit }: { onSubmit: (email: string) => Promise<string> }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const email = new FormData(event.currentTarget).get("email") as string;
        setStatus(await onSubmit(email));
        setBusy(false);
      }}
    >
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" placeholder="you@example.com" />
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}

/* ---- LoginForm.test.tsx ----------------------------------------------- */
test("signs in and reports the result", async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={async (email) => \`Signed in as \${email}\`} />);

  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("status")).toHaveTextContent("Signed in as ada@example.com");
});`,
            },
          ],
        },
      ],
    },
    {
      id: "waiting",
      heading: "Waiting properly",
      body: [
        "There are exactly three tools, and none of them is a timeout.",
        "**`findBy…`** — wait for an element to appear. The default and the one you want.",
        "**`waitFor(callback)`** — retry a callback until it stops throwing. For asserting something that is not an element appearing: a mock being called, a value changing.",
        "**`waitForElementToBeRemoved`** — wait for something to go, which `findBy` cannot express and which a bare assertion would pass trivially.",
        "All three poll with a timeout (1000ms by default) and fail with the last error rather than a bare timeout message.",
      ],
      examples: [
        {
          id: "waiting-code",
          title: "The three, and the thing that is not one of them",
          lang: "jsx",
          code: `/* Appearing. */
expect(await screen.findByRole("status")).toHaveTextContent("Saved");

/* Something that is not an element. Keep the callback to one assertion:
   waitFor retries the whole thing, so a slow first assertion is retried
   along with the one you are actually waiting on. */
await waitFor(() => expect(onSave).toHaveBeenCalledWith({ email: "ada@example.com" }));

/* Disappearing. */
await waitForElementToBeRemoved(() => screen.queryByRole("status", { name: "Loading" }));

/* ✗ Never this. It is slow when the machine is fast, and flaky when the
   machine is loaded — the two failure modes of a fixed delay. */
await new Promise((resolve) => setTimeout(resolve, 500));`,
          explanation:
            "A fixed delay is wrong in both directions at once: it always waits its full time, and it still fails on a slow CI runner. Every one of these three returns as soon as the condition holds and fails with the reason it did not.",
          alternates: [
            {
              lang: "tsx",
              code: `/* Appearing. */
expect(await screen.findByRole("status")).toHaveTextContent("Saved");

/* Something that is not an element. Keep the callback to one assertion:
   waitFor retries the whole thing, so a slow first assertion is retried
   along with the one you are actually waiting on. */
await waitFor(() => expect(onSave).toHaveBeenCalledWith({ email: "ada@example.com" }));

/* Disappearing. */
await waitForElementToBeRemoved(() => screen.queryByRole("status", { name: "Loading" }));

/* ✗ Never this. It is slow when the machine is fast, and flaky when the
   machine is loaded — the two failure modes of a fixed delay. And it type
   checks perfectly, like every other bad idea on this page. */
await new Promise<void>((resolve) => setTimeout(resolve, 500));`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Do not put a side effect inside `waitFor`",
          body: "The callback is retried, so a `user.click` inside it clicks several times. Do the action outside and wait for its consequence inside.",
        },
      ],
    },
    {
      id: "act",
      heading: "The act() warning",
      body: [
        "*An update to X inside a test was not wrapped in act(...)*. It is the most-searched React testing message and it almost always means one thing: **something updated state after your test stopped looking.**",
        "You do not usually fix it by adding `act`. Testing Library's `render`, and every `userEvent` method, are already wrapped in it. The warning means an update happened outside all of them, and there are three usual causes.",
        "**A missing `await`.** You forgot to await a `user.click`, so the assertion ran before the update. This is the common one.",
        "**A promise resolving after the test ended.** A fetch that was still in flight lands during the next test. `findBy` or `waitFor` for the visible consequence fixes it; if the update is genuinely invisible, the component is doing something in an effect that should have been cancelled.",
        "**A timer.** Something on an interval keeps ticking. Use fake timers, and advance them inside `act`.",
        "The warning is not noise: an update that arrives after the test finished is an update your assertions did not see, so a green test that also prints this may be green for the wrong reason.",
      ],
      examples: [
        {
          id: "fake-timers",
          title: "The timer case",
          lang: "jsx",
          code: `test("counts down", async () => {
  vi.useFakeTimers();
  /* userEvent schedules its own work on timers, so it must be told to use
     vitest's advance function rather than the real clock. */
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(<Countdown from={3} />);
  expect(screen.getByRole("timer")).toHaveTextContent("3");

  /* act, because advancing the clock is what causes the state update —
     and nothing else in the test is holding it. */
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(screen.getByRole("timer")).toHaveTextContent("1");

  vi.useRealTimers();
});`,
          explanation:
            "Two easily-missed pieces: `advanceTimers` on the setup, without which `userEvent` hangs forever waiting on a clock that never moves, and restoring real timers afterwards so the next test is not affected.",
          alternates: [
            {
              lang: "tsx",
              code: `test("counts down", async () => {
  vi.useFakeTimers();
  /* userEvent schedules its own work on timers, so it must be told to use
     vitest's advance function rather than the real clock. */
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(<Countdown from={3} />);
  expect(screen.getByRole("timer")).toHaveTextContent("3");

  /* act, because advancing the clock is what causes the state update —
     and nothing else in the test is holding it. */
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(screen.getByRole("timer")).toHaveTextContent("1");

  vi.useRealTimers();
});`,
            },
          ],
        },
      ],
    },
    {
      id: "the-other-states",
      heading: "Testing the states that are not the happy one",
      body: [
        "Module 7 established that a screen has four states — idle, loading, error and success — and most suites test one of them.",
        "The loading state is testable because you control when the promise resolves: hand the component a promise you hold the resolver for, assert the loading state, then resolve it. No mocking of time, no arbitrary delay.",
        "The error state is testable the same way, by rejecting. And the empty state — the one nobody remembers — is testable by returning an empty array, which is where you find out that *no results* renders a blank panel instead of a sentence.",
      ],
      examples: [
        {
          id: "controlled-promise",
          title: "Holding the promise open",
          lang: "jsx",
          code: `test("shows a loading state while the save is in flight", async () => {
  const user = userEvent.setup();

  /* A promise this test controls. Nothing resolves until it says so. */
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });

  render(<LoginForm onSubmit={() => pending} />);
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  /* Now, with the request deliberately still open. */
  expect(screen.getByRole("button")).toBeDisabled();
  expect(screen.getByRole("button")).toHaveTextContent("Signing in…");

  await act(async () => { finish("Signed in"); });
  expect(await screen.findByRole("status")).toHaveTextContent("Signed in");
});`,
          explanation:
            "This pattern is worth internalising, because it is the only reliable way to test a transient state. A `setTimeout` would be a race; a resolver you hold is not — the loading assertions run at a moment you chose.",
          alternates: [
            {
              lang: "tsx",
              code: `test("shows a loading state while the save is in flight", async () => {
  const user = userEvent.setup();

  /* A promise this test controls. Nothing resolves until it says so. */
  let finish!: (value: string) => void;
  const pending = new Promise<string>((resolve) => { finish = resolve; });

  render(<LoginForm onSubmit={() => pending} />);
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  /* Now, with the request deliberately still open. */
  expect(screen.getByRole("button")).toBeDisabled();
  expect(screen.getByRole("button")).toHaveTextContent("Signing in…");

  await act(async () => { finish("Signed in"); });
  expect(await screen.findByRole("status")).toHaveTextContent("Signed in");
});`,
            },
          ],
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between fireEvent and userEvent?",
      answer:
        "`fireEvent` dispatches exactly the event you name. `userEvent` dispatches the sequence a browser really produces — for one click that is thirteen events: pointer, mouse, focus and finally click. That is why `userEvent` catches bugs where the handler is fine but the element is unreachable: disabled, covered, never focused, or listening on `pointerdown`. Every `userEvent` method is async and must be awaited.",
    },
    {
      question: "How do you test asynchronous UI without a timeout?",
      answer:
        "`findBy…` to wait for an element to appear, `waitFor` to retry an assertion about something that is not an element, and `waitForElementToBeRemoved` for something disappearing. All three poll and fail with the real reason. A fixed `setTimeout` is wrong in both directions at once — always slow on a fast machine, still flaky on a loaded CI runner.",
    },
    {
      question: "What does the act() warning mean?",
      answer:
        "That state updated after your test stopped looking. Testing Library's `render` and every `userEvent` method already wrap in `act`, so the warning means an update escaped all of them — usually a missing `await`, sometimes a promise landing after the test ended, sometimes a timer still running. It matters because an update your assertions did not see means a passing test may be passing for the wrong reason.",
    },
    {
      question: "How do you test a loading state?",
      answer:
        "Hand the component a promise you hold the resolver for. Trigger the action, assert the loading state while the promise is deliberately still open, then resolve it and assert the result. It is deterministic in a way a `setTimeout` never is — the loading assertions run at a moment you chose rather than one you hoped for.",
    },
  ],
  takeaways: [
    "`userEvent.click` dispatches thirteen events; `fireEvent.click` dispatches one",
    "`userEvent.setup()` once per test, and await every method",
    "`fireEvent` is still right for events a user cannot produce — scroll, error, message",
    "A good test names only things a user can see, so it survives a rewrite",
    "`findBy` to appear, `waitFor` to assert, `waitForElementToBeRemoved` to disappear",
    "Never a fixed delay: slow when it passes, flaky when it does not",
    "No side effects inside `waitFor` — the callback is retried",
    "An `act` warning means an update landed after the test stopped watching",
    "Fake timers need `advanceTimers` on `userEvent.setup` or it hangs",
    "Test loading and error by controlling the promise, not by controlling time",
  ],
  status: "available",
};
