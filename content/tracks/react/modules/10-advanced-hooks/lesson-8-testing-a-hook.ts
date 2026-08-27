import type { Lesson } from "@/content/types";

export const testingAHookLesson: Lesson = {
  id: "react-testing-a-hook",
  slug: "testing-a-custom-hook",
  moduleSlug: "advanced-and-custom-hooks",
  title: "Testing a Custom Hook in Isolation",
  summary:
    "A hook only exists during a render, so testing one means rendering it. The four-line harness that is all `renderHook` really is, what `act` is for, and the case where the right test is not of the hook at all.",
  estimatedMinutes: 26,
  objectives: [
    "Render a hook in a test and read its result",
    "Say what act does and why a test needs it",
    "Test a hook that takes changing arguments",
    "Test an effect's cleanup",
    "Decide when to test the hook and when to test a component",
  ],
  sections: [
    {
      id: "why-render",
      heading: "A hook only exists during a render",
      body: [
        "You cannot call `useUndoable(\"first\")` in a test file. `useState` inside it needs a component instance to own its slots, and outside a render there is none — React throws.",
        "So a hook test renders something. The harness is a component that calls the hook and stores what it returned somewhere the test can read.",
        "That is all `renderHook` is, in Testing Library or anywhere else. Writing it once makes the rest of this lesson obvious.",
      ],
      examples: [
        {
          id: "render-hook",
          title: "The harness, and a hook tested with it",
          lang: "tsx",
          code: `import { useState, useCallback, act } from "react";
import { createRoot } from "react-dom/client";

/* The hook under test. */
function useUndoable<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState(initial);

  const set = useCallback((next: T) => {
    setPast((p) => [...p, present]);
    setPresent(next);
  }, [present]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      setPresent(p[p.length - 1]);
      return p.slice(0, -1);
    });
  }, []);

  return { value: present, set, undo, canUndo: past.length > 0 };
}

/* Testing a hook means rendering it, because a hook only exists during a
   render. A four-line harness is all a test framework's renderHook is. */
function renderHook<T>(useHook: () => T) {
  const result = { current: null as unknown as T };
  function Probe() {
    result.current = useHook();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(<Probe />); });
  return result;
}

const hook = renderHook(() => useUndoable("first"));
console.log("initial:            ", hook.current.value, "canUndo =", hook.current.canUndo);

act(() => { hook.current.set("second"); });
console.log("after set(second):  ", hook.current.value, "canUndo =", hook.current.canUndo);

act(() => { hook.current.set("third"); });
console.log("after set(third):   ", hook.current.value, "canUndo =", hook.current.canUndo);

act(() => { hook.current.undo(); });
console.log("after undo():       ", hook.current.value, "canUndo =", hook.current.canUndo);

act(() => { hook.current.undo(); });
console.log("after undo() again: ", hook.current.value, "canUndo =", hook.current.canUndo);

act(() => { hook.current.undo(); });
console.log("undo with no past:  ", hook.current.value, "canUndo =", hook.current.canUndo);`,
          output: `initial:             first canUndo = false
after set(second):   second canUndo = true
after set(third):    third canUndo = true
after undo():        second canUndo = true
after undo() again:  first canUndo = false
undo with no past:   first canUndo = false`,
          explanation:
            "`result.current` is reassigned on every render, so it always holds the latest return value — which is why the assertions after each `act` see the new state. The last line is the case worth writing a test for: undoing past the beginning does nothing rather than throwing, and nothing about the hook's source makes that obvious.",
        },
      ],
      pitfalls: [
        {
          title: "The `Probe` returns `null` deliberately",
          body: "There is nothing to render — the hook is the subject, and any markup would be markup you then have to keep in step with the test. If a test wants to assert on rendered output, that is a component test, not a hook test.",
        },
      ],
    },
    {
      id: "act",
      heading: "What `act` is for",
      body: [
        "`act` tells React \"I am doing something that will cause updates; process all of them before returning\".",
        "Without it, a state update queued by your test may not have been rendered by the time the next line runs, so the assertion reads the value from before. Worse, it usually *works* for simple synchronous updates and stops working the moment an effect gets involved — a test that passes for the wrong reason and fails later for no visible one.",
        "React warns when an update happens outside `act` in a test environment, which is the warning most people meet first. The rule is simple: **anything that causes a React update goes inside `act`**, and anything asynchronous goes inside `await act(async () => …)`.",
        "Testing Library's `renderHook` and its `fireEvent`/`userEvent` helpers wrap `act` for you, which is most of what they buy over the four lines above.",
      ],
      examples: [
        {
          id: "changing-args",
          title: "A hook whose arguments change",
          lang: "tsx",
          code: `/* A harness that can re-render with new arguments — the second half of
   what renderHook provides, and what you need for any hook taking props. */
function renderHook<P, T>(useHook: (props: P) => T, initial: P) {
  const result = { current: null as unknown as T };
  let root: ReturnType<typeof createRoot>;

  function Probe({ props }: { props: P }) {
    result.current = useHook(props);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<Probe props={initial} />);
  });

  return {
    result,
    rerender: (next: P) => act(() => { root.render(<Probe props={next} />); }),
    unmount: () => act(() => { root.unmount(); }),
  };
}

// Testing that a debounced value settles, and that changing the input
// restarts the wait rather than firing at a fixed interval:
const { result, rerender } = renderHook((v: string) => useDebounced(v, 300), "a");

expect(result.current).toBe("a");
rerender("ab");
expect(result.current).toBe("a");        // not settled yet
await act(async () => { vi.advanceTimersByTime(300); });
expect(result.current).toBe("ab");`,
          explanation:
            "`rerender` is what makes dependency-array behaviour testable at all: it is how you say \"the prop changed\" without a component. And fake timers rather than real waits — a test that sleeps 300ms is a test suite that takes minutes, and one that sleeps 290ms is a test that fails on a slow machine.",
        },
      ],
    },
    {
      id: "cleanup",
      heading: "Testing the cleanup",
      body: [
        "The cleanup is the part most likely to be missing and least likely to be tested, because nothing visible happens when it does not run.",
        "Test it by unmounting and asserting that the external thing was released — the listener removed, the connection closed, the timer cleared. Which means the external thing has to be observable, and that is usually a spy or a fake.",
      ],
      examples: [
        {
          id: "cleanup-test",
          title: "Asserting the teardown",
          lang: "tsx",
          code: `test("useChatRoom disconnects on unmount", () => {
  const connection = { connect: vi.fn(), disconnect: vi.fn() };
  vi.mocked(createConnection).mockReturnValue(connection);

  const { unmount, rerender } = renderHook(
    (room: string) => useChatRoom(room),
    "general",
  );
  expect(connection.connect).toHaveBeenCalledTimes(1);

  // Changing the dependency must disconnect *before* connecting again —
  // the ordering from module 7, and the reason the hook is correct.
  rerender("travel");
  expect(connection.disconnect).toHaveBeenCalledTimes(1);
  expect(connection.connect).toHaveBeenCalledTimes(2);

  unmount();
  expect(connection.disconnect).toHaveBeenCalledTimes(2);
});

test("a resubscribe does not leak a listener", () => {
  const { rerender, unmount } = renderHook((t: string) => useEventListener(t, () => {}), "resize");
  rerender("scroll");
  unmount();
  // The strongest assertion available: nothing is still attached.
  expect(listenerCount(window)).toBe(0);
});`,
          explanation:
            "The middle assertion is the interesting one. Testing that a dependency change disconnects *before* reconnecting is testing the property that makes the hook correct, and it is the one that breaks when somebody \"optimises\" the effect later. A test that only checks the unmount would pass.",
        },
      ],
      pitfalls: [
        {
          title: "Run the tests in Strict Mode",
          body: "Wrapping the harness's `Probe` in `<StrictMode>` makes every test exercise the double mount, which is where a missing cleanup shows up. It is one line in the harness and it turns a whole class of bug into a failing test rather than a production incident.",
        },
      ],
    },
    {
      id: "or-not",
      heading: "When not to test the hook",
      body: [
        "A hook is an implementation detail of the components that use it. Testing it directly is testing an internal API, and internal APIs are the ones you want to be free to change.",
        "**Test the hook directly** when it has non-trivial logic of its own worth stating as a specification — an undo stack, a state machine, a debounce, a paginator. Those tests are about behaviour that would be tedious to reach through a component.",
        "**Test through a component** when the hook is mostly wiring. `useUserProfile` that fetches and returns three fields is better tested by rendering the profile and asserting on what a user would see, because that test survives the hook being renamed, split, or replaced by a query library.",
        "**Extract a plain function** when the interesting part is not React at all. A reducer is a pure function — module 8 — and testing it needs no renderer, no `act` and no harness. The same for a formatter or a validator: if the logic can live outside the hook, put it there and test it there, and the hook's test shrinks to \"it wires this up\".",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you test a custom hook?",
      answer:
        "By rendering it, because a hook only exists during a render — calling it in a test file throws. A four-line harness does it: a component that calls the hook and assigns the return value to a box the test can read, rendered into a container. That is all `renderHook` is; the library version adds `rerender` for changing arguments and `unmount`, and wraps `act` for you.",
    },
    {
      question: "What does act do in a test?",
      answer:
        "It tells React to process all pending work — renders and effects — before returning, so an assertion after it sees the settled state. Without it an update may not have rendered by the next line, and the failure mode is worse than a plain failure: it usually works for simple synchronous updates and stops working once an effect is involved, so the test passed for the wrong reason. Anything causing an update goes inside `act`; anything asynchronous inside `await act(async () => …)`.",
    },
    {
      question: "How do you test that an effect cleans up?",
      answer:
        "Unmount and assert that the external thing was released — a spy's `disconnect` was called, the listener count is zero. The more valuable test is the dependency change: assert that changing the dependency disconnected before reconnecting, since that ordering is what makes the hook correct and it is what breaks when somebody rewrites the effect later. Running the harness inside `StrictMode` also turns a missing cleanup into a failing test.",
    },
    {
      question: "When would you not test a hook directly?",
      answer:
        "When it is mostly wiring — a hook that fetches and returns three fields is better covered by rendering the component and asserting on what a user sees, and that test survives the hook being renamed or replaced. Test the hook directly when it has real logic of its own: an undo stack, a state machine, a paginator. And if the interesting part is not React at all, pull it out into a plain function and test that, with no renderer and no `act`.",
    },
  ],
  takeaways: [
    "A hook only exists during a render, so a test renders it — that is all `renderHook` is",
    "`result.current` is reassigned every render, so assertions always see the latest value",
    "`act` processes pending renders and effects; without it an assertion reads stale state",
    "It usually works without `act` until an effect is involved — a test passing for the wrong reason",
    "`rerender` is how you test dependency-array behaviour without a component",
    "Fake timers, never real waits",
    "Test the cleanup by unmounting, and test that a dependency change cleans up before re-running",
    "Run the harness in `StrictMode` to catch missing cleanups",
    "Test through a component when the hook is wiring; extract a plain function when the logic is not React",
  ],
  status: "available",
};
