import type { Lesson } from "@/content/types";

export const walkthroughLesson: Lesson = {
  id: "react-component-walkthrough",
  slug: "a-component-design-walkthrough",
  moduleSlug: "patterns-and-mastery",
  title: "A Component-Design Walkthrough, End to End",
  summary:
    "Designing a combobox out loud: the questions before any code, the state shape and why it is a reducer, the accessibility contract, a complete working implementation driven by keyboard in a real DOM, and what to do next.",
  estimatedMinutes: 36,
  objectives: [
    "Ask the questions that come before the code",
    "Choose a state shape that cannot represent an illegal screen",
    "Meet an accessibility contract deliberately rather than by accident",
    "Read a complete implementation and see every module in it",
    "Say what you would do next and what you would not build",
  ],
  sections: [
    {
      id: "the-brief",
      heading: "The brief, and the questions before the code",
      body: [
        "*\"Design an autocomplete.\"* This is the most common component-design interview question and the most common real task, and the mistake in both settings is the same: starting to type.",
        "Six questions, and every one of them changes the design.",
        "**Where do the options come from?** A fixed list of two hundred, or a search endpoint? A local list means filtering during render and no loading state at all. A remote one means debouncing, cancellation, a loading state, an error state and an empty state — four times the component.",
        "**One selection or several?** Multiple changes the value type, the keyboard model (Backspace removes the last chip), and the layout.",
        "**Must the value be one of the options?** A combobox that accepts arbitrary text is a different component from one that does not, and the ARIA pattern differs too.",
        "**Controlled, uncontrolled, or both?** Lesson 3. Both, if anyone else will use it.",
        "**What is it inside?** A dialog, a table cell, a page with `overflow: hidden` somewhere above? That decides whether the popup needs a portal.",
        "**Who has to use it?** If the answer includes keyboard and screen-reader users — and it does — the WAI-ARIA combobox pattern is a requirement rather than a nice-to-have, and that is most of the work.",
        "For this walkthrough: **a local list, single selection, must be one of the options, both controlled and uncontrolled, no portal for now.**",
      ],
    },
    {
      id: "the-state",
      heading: "The state, and why it is a reducer",
      body: [
        "First instinct: `query`, `open`, `activeIndex`, `selected`. Four `useState` calls.",
        "Now ask module 4's question — which of these can be derived, and which combinations are illegal?",
        "**The filtered list is derived.** It is `options` filtered by `query`, so it is a `useMemo` and never state. Storing it means keeping it in sync, which is where the bug always is.",
        "**Some combinations are impossible.** `open: false` with a non-zero `activeIndex` is a state nothing should be in. `activeIndex` pointing past the end of the filtered list is a crash waiting for a keystroke.",
        "**And the transitions are coupled.** Typing changes `query` *and* opens the list *and* resets `activeIndex` — three `setState` calls in one handler, in the right order, at every call site that types.",
        "Three coupled fields with rules about which combinations are legal is module 8's definition of a reducer. Putting the rules in one function means no component can produce an illegal screen, and the transitions get names you can read.",
      ],
      examples: [
        {
          id: "reducer",
          title: "The rules, in one place",
          lang: "tsx",
          code: `interface State { query: string; open: boolean; activeIndex: number }

type Action =
  | { type: "query"; value: string }
  | { type: "move"; by: number; count: number }
  | { type: "close" }
  | { type: "choose" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "query":
      /* Typing always opens the list and always goes back to the first
         match. Three fields, one transition, impossible to get wrong at a
         call site because no call site does it. */
      return { query: action.value, open: true, activeIndex: 0 };
    case "move": {
      if (action.count === 0) return state;
      /* Modulo, so the ends wrap — which is the behaviour the ARIA
         pattern specifies and the one people expect from a menu. */
      const next = (state.activeIndex + action.by + action.count) % action.count;
      return { ...state, open: true, activeIndex: next };
    }
    case "close":
      return { ...state, open: false, activeIndex: 0 };
    case "choose":
      return { ...state, open: false };
  }
}`,
          explanation:
            "`count` on the `move` action rather than the filtered list in state is the interesting decision. The reducer needs to know how far it may travel; it does not need to know what the options are. Passing the number keeps the derived list out of the state entirely, and keeps the reducer a pure function of things it was handed.",
        },
      ],
    },
    {
      id: "the-contract",
      heading: "The accessibility contract",
      body: [
        "This is the part that separates a component people can use from a `<div>` that filters an array, and it is worth writing down **before** implementing, because it is a specification rather than a preference.",
        "**Roles.** The input is `role=\"combobox\"`; the popup is `role=\"listbox\"`; each option is `role=\"option\"`.",
        "**Wiring.** `aria-expanded` on the input says whether the popup is open. `aria-controls` points at the listbox. `aria-activedescendant` points at the id of the currently highlighted option — and this is the crucial one: **focus stays in the input**. The highlight moves without focus moving, which is why arrow keys navigate the list and typing still goes to the field.",
        "**Ids.** Every option needs one, unique per instance of the component, which is what `useId` from module 10 is for.",
        "**Keyboard.** Down and Up move the highlight and wrap. Enter chooses the highlighted option. Escape closes without choosing. Tab closes and moves on.",
        "**Announcement.** `aria-selected` on the active option, so a screen reader reads the highlighted item as the user arrows through.",
        "Six bullets, and they are most of the remaining work. Notice how much of it is naming things rather than logic — which is why it is so often skipped, and why skipping it is so cheap to fix once you know the list.",
      ],
    },
    {
      id: "implementation",
      heading: "The whole thing, running",
      body: [
        "Here it is complete, driven by a real keyboard sequence in a real DOM. Every state transition below is the reducer's output and every attribute is read back off the rendered element.",
      ],
      examples: [
        {
          id: "combobox",
          title: "Typed, arrowed and chosen",
          lang: "tsx",
          code: `import { useId, useMemo, useReducer, act } from "react";
import { createRoot } from "react-dom/client";

interface Option { id: string; label: string }

interface State { query: string; open: boolean; activeIndex: number }
type Action =
  | { type: "query"; value: string }
  | { type: "move"; by: number; count: number }
  | { type: "close" }
  | { type: "choose" };

/* Every rule about what is legal lives here, so no component can produce an
   impossible combination — an activeIndex pointing past the end, say. */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "query":
      return { query: action.value, open: true, activeIndex: 0 };
    case "move": {
      if (action.count === 0) return state;
      const next = (state.activeIndex + action.by + action.count) % action.count;
      return { ...state, open: true, activeIndex: next };
    }
    case "close":
      return { ...state, open: false, activeIndex: 0 };
    case "choose":
      return { ...state, open: false };
  }
}

function Combobox({ options, onChoose }: { options: Option[]; onChoose: (o: Option) => void }) {
  const id = useId();
  const [state, dispatch] = useReducer(reducer, { query: "", open: false, activeIndex: 0 });

  const matches = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(state.query.toLowerCase())),
    [options, state.query]
  );
  const active = matches[state.activeIndex];

  return (
    <div>
      <input
        role="combobox"
        aria-expanded={state.open}
        aria-controls={\`\${id}-list\`}
        aria-activedescendant={state.open && active ? \`\${id}-\${active.id}\` : undefined}
        value={state.query}
        onChange={(e) => dispatch({ type: "query", value: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") dispatch({ type: "move", by: 1, count: matches.length });
          if (e.key === "ArrowUp") dispatch({ type: "move", by: -1, count: matches.length });
          if (e.key === "Escape") dispatch({ type: "close" });
          if (e.key === "Enter" && active) { onChoose(active); dispatch({ type: "choose" }); }
        }}
      />
      {state.open && (
        <ul role="listbox" id={\`\${id}-list\`}>
          {matches.length === 0 && <li>No matches</li>}
          {matches.map((o, i) => (
            <li key={o.id} id={\`\${id}-\${o.id}\`} role="option" aria-selected={i === state.activeIndex}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const OPTIONS: Option[] = [
  { id: "au", label: "Australia" },
  { id: "at", label: "Austria" },
  { id: "br", label: "Brazil" },
];

const container = document.createElement("div");
document.body.appendChild(container);
const chosen: string[] = [];
await act(async () => {
  createRoot(container).render(<Combobox options={OPTIONS} onChoose={(o) => chosen.push(o.label)} />);
});

const input = container.querySelector("input")!;
const state = () => {
  const listbox = container.querySelector('[role="listbox"]');
  const active = container.querySelector('[aria-selected="true"]');
  return \`expanded=\${input.getAttribute("aria-expanded")} options=\${listbox ? listbox.children.length : 0} active=\${active?.textContent ?? "—"}\`;
};

console.log("on mount:      ", state());

const type = async (value: string) => {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const press = async (key: string) => {
  await act(async () => { input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); });
};

await type("aus");
console.log('after typing "aus":', state());
await press("ArrowDown");
console.log("after ArrowDown:", state());
await press("ArrowDown");
console.log("after ArrowDown:", state());
await press("Enter");
console.log("after Enter:   ", state(), "| chosen:", JSON.stringify(chosen));
await type("z");
console.log('after typing "z": ', state());`,
          output: `on mount:       expanded=false options=0 active=—
after typing "aus": expanded=true options=2 active=Australia
after ArrowDown: expanded=true options=2 active=Austria
after ArrowDown: expanded=true options=2 active=Australia
after Enter:    expanded=false options=0 active=— | chosen: ["Australia"]
after typing "z":  expanded=true options=1 active=Brazil`,
          explanation:
            "The third and fourth lines are the wrap-around: two options, two Downs, back to the first. That behaviour is one modulo in the reducer, and it is specified by the ARIA pattern rather than invented.\n\nThe last line is a small illustration of why the filtered list must be derived: `\"z\"` matches *Brazil*, not nothing, and the highlight resets to the first match automatically because `query` and `activeIndex` change in one transition. Nothing had to remember to reset it.\n\nAnd the test driving it never touches the component's state. It types, presses keys, and reads the ARIA attributes — which is lesson 6's argument and module 13's, arriving at the same place: the attributes a screen reader reads are also the ones a test should assert on.",
        },
      ],
      pitfalls: [
        {
          title: "That `Object.getOwnPropertyDescriptor` line is a testing artefact, not a pattern",
          body: "React attaches its own value tracker to a controlled input, so setting `input.value` directly is not seen as a change. Calling the native setter and then dispatching `input` is what `userEvent.type` does internally, and it is here only because this example has no Testing Library. In a real test it is one line: `await user.type(input, \"aus\")`.",
        },
      ],
    },
    {
      id: "whats-left",
      heading: "What is deliberately missing",
      body: [
        "That component works and is honest about what it is. Being able to say what it does *not* do is as much a part of the design answer as the code.",
        "**Mouse.** No click or hover handlers on the options. Two lines each, and it is worth noticing that keyboard came first for once.",
        "**Blur.** Clicking away does not close it, which needs a click-outside handler — and, if the popup is ever portalled, the portal-aware version from lesson 5.",
        "**Controlled mode.** Lesson 3's `useControllable`, so a parent can drive the selection.",
        "**Scrolling the active option into view.** A ref, and `scrollIntoView({ block: \"nearest\" })` in an effect on `activeIndex`. A legitimate effect: it synchronises the DOM's scroll position with React state.",
        "**A portal**, once anything above it clips.",
        "**A remote source**, which is the change that doubles the component: a debounce or `useDeferredValue`, cancellation of the in-flight request, and the four states from module 7 — including the empty one, which this version does render.",
        "**Virtualisation**, if the list can be thousands of rows. Not before.",
      ],
    },
    {
      id: "the-last-question",
      heading: "The question to end on",
      body: [
        "*Should you build this at all?*",
        "Everything above is a straightforward version. The complete WAI-ARIA combobox pattern also specifies typeahead, `aria-autocomplete` behaviour, screen-reader announcements of the result count, touch and mobile handling, right-to-left arrow semantics, and a set of interactions that differ between multi-select and single. That is weeks, and testing it properly means testing it with an actual screen reader on more than one platform.",
        "For a product, the right answer is nearly always a headless library — Radix, React Aria, Downshift — with your own markup and styles on top. You keep the design; you do not maintain the specification.",
        "That is the answer worth reaching last rather than first, though. \"Use a library\" as an opening move skips the design work entirely, and skipping it is how a team ends up unable to tell whether the library they chose is doing the right thing — or how to fix it on the day it does not. Build it once, understand what the specification is asking for, and then adopt the library knowing exactly what you are delegating.",
        "That is the shape of every senior decision in this module. Know the mechanism, build it when you need to, and be able to say when not to. The next three lessons are that judgement applied end to end: a complete project, specified before it is built.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you approach 'design an autocomplete'?",
      answer:
        "With questions, not code. Where do the options come from — a local list needs no loading state, a remote one needs debouncing, cancellation and four screen states. One selection or many, since that changes the value type and the keyboard model. Must the value be one of the options. Controlled, uncontrolled, or both. What is it rendered inside, which decides whether the popup needs a portal. And who has to use it, because the WAI-ARIA combobox pattern is most of the work.",
    },
    {
      question: "Why is a reducer the right state shape here?",
      answer:
        "Because `query`, `open` and `activeIndex` are coupled and some of their combinations are illegal — closed with a non-zero active index, or an index past the end of the filtered list. Typing has to change all three together, in order. A reducer puts those rules in one function so no call site can produce an illegal screen, and the transitions get readable names. The filtered list stays derived with `useMemo`, because storing it means keeping it in sync.",
    },
    {
      question: "What is aria-activedescendant for?",
      answer:
        "Moving the highlight without moving focus. Focus stays in the input — so typing keeps working — while `aria-activedescendant` points at the id of the highlighted option, and a screen reader announces it. That is why every option needs a unique id, which is what `useId` provides, and it is the mechanism that makes arrow-key navigation of a listbox possible from a text field.",
    },
    {
      question: "Would you actually build a combobox from scratch?",
      answer:
        "For a product, no — a headless library gives you the full ARIA pattern, typeahead, announcements, touch handling and the interactions that differ between single and multi-select, all tested against real screen readers, and you keep your own markup and styles. But build one once anyway, because the team that adopted a library without ever doing the design work cannot tell whether it is behaving correctly, and cannot fix it on the day it is not. The judgement is knowing what you are delegating.",
    },
  ],
  takeaways: [
    "Six questions before any code, and each one changes the design",
    "A local list has no loading state; a remote one doubles the component",
    "Derive the filtered list; never store it",
    "Coupled fields with illegal combinations are a reducer, not four `useState` calls",
    "Passing `count` into the action keeps the derived list out of the state",
    "Write the accessibility contract down before implementing — most of it is naming",
    "`aria-activedescendant` moves the highlight while focus stays in the input",
    "`useId` for the option ids, because the component may appear twice on a page",
    "Test through the ARIA attributes: the same handles a screen reader uses",
    "Be able to say what you left out — mouse, blur, scroll-into-view, portal, remote data",
    "Build one to understand the specification; ship a headless library, and know what you delegated",
  ],
  status: "available",
};
