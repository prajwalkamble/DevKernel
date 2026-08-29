import type { Lesson } from "@/content/types";

export const compoundComponentsLesson: Lesson = {
  id: "react-compound-components",
  slug: "compound-components",
  moduleSlug: "patterns-and-mastery",
  title: "Compound Components, Slots & Headless Design",
  summary:
    "The pattern behind every component library you like: several components sharing state through context so the caller owns the arrangement. Why a config-object API always grows a twelfth prop, and where headless libraries take the idea.",
  estimatedMinutes: 30,
  objectives: [
    "Build a compound component with context",
    "Say why an arrangement the library does not control is the point",
    "Give a good error when a piece is used outside its parent",
    "Recognise slots and when they are simpler",
    "Say what a headless library gives you and what it costs",
  ],
  sections: [
    {
      id: "the-alternative",
      heading: "The API this replaces",
      body: [
        "Every widget starts as one component with a props object, and the first version is genuinely nice:",
        "`<Tabs items={[{ id, label, content }]} />`",
        "Then someone needs an icon in a tab. Then a badge. Then one tab disabled, one tab as a link, a tooltip on another, a divider between two of them, and the whole panel replaced with something custom on a Tuesday.",
        "Each of those is a prop — `renderLabel`, `tabClassName`, `disabledIds`, `iconPosition` — and every one of them is you reimplementing JSX inside a configuration object. Six months in, the component has twenty-two props, an eight-branch render, and a comment saying *do not add to this*.",
        "The compound version has no such pressure, because it never took responsibility for the arrangement in the first place.",
      ],
    },
    {
      id: "the-pattern",
      heading: "Several components, one piece of state",
      body: [
        "The parent owns the state and provides it. The children consume it. The caller writes ordinary JSX in between.",
        "The mechanism is module 8's context, doing precisely what it is for: the pieces do not know how deep they are, because the lookup goes up the tree rather than along a list.",
      ],
      visual: {
        id: "compound-visual",
        kind: "react-patterns",
        algorithm: "compound",
        title: "A piece finding its parent's state",
        lockAlgorithm: true,
      },
      examples: [
        {
          id: "tabs",
          title: "Tabs, including a piece buried under a wrapper the library never heard of",
          lang: "jsx",
          code: `import { createContext, useContext, useState, act } from "react";
import { createRoot } from "react-dom/client";
const TabsContext = createContext(null);

function useTabs() {
  const value = useContext(TabsContext);
  if (value === null) throw new Error("<Tab> must be used inside <Tabs>");
  return value;
}

function Tabs({ initial, children }) {
  const [active, select] = useState(initial);
  return <TabsContext.Provider value={{ active, select }}>{children}</TabsContext.Provider>;
}

function Tab({ id, children }) {
  const { active, select } = useTabs();
  return (
    <button role="tab" aria-selected={active === id} onClick={() => select(id)}>{children}</button>
  );
}

function Panel({ id, children }) {
  const { active } = useTabs();
  return active === id ? <section>{children}</section> : null;
}

/* A wrapper the library has never heard of, four levels deep. */
function Fancy({ children }) {
  return <div className="fancy"><div className="inner">{children}</div></div>;
}

function App() {
  return (
    <Tabs initial="home">
      <div role="tablist">
        <Tab id="home">Home</Tab>
        <Fancy><Tab id="posts">Posts</Tab></Fancy>
      </div>
      <Panel id="home">the home panel</Panel>
      <Panel id="posts">the posts panel</Panel>
    </Tabs>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
console.log("on mount: ", container.querySelector("section").textContent);

const buried = container.querySelectorAll("button")[1];
await act(async () => { buried.click(); });
console.log("after clicking the buried Tab:", container.querySelector("section").textContent);

/* And the same Tab, used outside any Tabs. */
try {
  const stray = document.createElement("div");
  document.body.appendChild(stray);
  await act(async () => {
    createRoot(stray, { onUncaughtError() {}, onCaughtError() {} }).render(<Tab id="x">stray</Tab>);
  });
} catch (error) {
  console.log("outside <Tabs>:", (error).message);
}`,
          output: `on mount:  the home panel
after clicking the buried Tab: the posts panel
outside <Tabs>: <Tab> must be used inside <Tabs>`,
          explanation:
            "The second line is the whole argument. That `Tab` is inside a `Fancy`, inside a `div`, inside another `div` — a component the tabs library has never seen and could not have anticipated — and it works, because the state lookup walks up the tree. A `Children.map` over `props.children` would not have found it, which is why the old version of this pattern (cloning children to inject props) was fragile and is not how it is written any more.",
          alternates: [
            {
              lang: "tsx",
              code: `import { createContext, useContext, useState, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

interface TabsValue { active: string; select: (id: string) => void }
const TabsContext = createContext<TabsValue | null>(null);

function useTabs(): TabsValue {
  const value = useContext(TabsContext);
  if (value === null) throw new Error("<Tab> must be used inside <Tabs>");
  return value;
}

function Tabs({ initial, children }: { initial: string; children: ReactNode }) {
  const [active, select] = useState(initial);
  return <TabsContext.Provider value={{ active, select }}>{children}</TabsContext.Provider>;
}

function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { active, select } = useTabs();
  return (
    <button role="tab" aria-selected={active === id} onClick={() => select(id)}>{children}</button>
  );
}

function Panel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <section>{children}</section> : null;
}

/* A wrapper the library has never heard of, four levels deep. */
function Fancy({ children }: { children: ReactNode }) {
  return <div className="fancy"><div className="inner">{children}</div></div>;
}

function App() {
  return (
    <Tabs initial="home">
      <div role="tablist">
        <Tab id="home">Home</Tab>
        <Fancy><Tab id="posts">Posts</Tab></Fancy>
      </div>
      <Panel id="home">the home panel</Panel>
      <Panel id="posts">the posts panel</Panel>
    </Tabs>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<App />); });
console.log("on mount: ", container.querySelector("section")!.textContent);

const buried = container.querySelectorAll("button")[1];
await act(async () => { buried.click(); });
console.log("after clicking the buried Tab:", container.querySelector("section")!.textContent);

/* And the same Tab, used outside any Tabs. */
try {
  const stray = document.createElement("div");
  document.body.appendChild(stray);
  await act(async () => {
    createRoot(stray, { onUncaughtError() {}, onCaughtError() {} }).render(<Tab id="x">stray</Tab>);
  });
} catch (error) {
  console.log("outside <Tabs>:", (error as Error).message);
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "The error message is part of the API",
          body: "`Cannot read properties of null (reading 'active')` tells the caller nothing. A hook that throws with both component names and what to do about it turns the pattern's one weakness — a runtime failure where a props API would have had a compile error — into a two-second fix.",
        },
        {
          title: "Attach the pieces as properties, for discoverability",
          body: "`Tabs.Tab = Tab; Tabs.Panel = Panel` lets a caller write `<Tabs.Tab>` and, more usefully, lets their editor list the pieces after typing `Tabs.`. It is purely ergonomic — the pieces are the same components — and it costs the pieces their own displayName unless you set one.",
        },
      ],
    },
    {
      id: "slots",
      heading: "Slots, when the arrangement is fixed",
      body: [
        "Sometimes the layout genuinely is the library's job — a dialog's header, body and footer are always in that order — and the caller only decides what goes *in* each region.",
        "That is a slot: a named `ReactNode` prop. It is simpler than a compound component, needs no context, and is type-checked, because a missing `footer` is a missing prop rather than a missing child.",
        "The rule of thumb: **compound when the caller arranges the pieces, slots when the library does.**",
      ],
      examples: [
        {
          id: "slots-code",
          title: "A slot API",
          lang: "jsx",
          code: `function Dialog({ title, children, footer }) {
  return (
    <div role="dialog" aria-modal="true">
      <header><h2>{title}</h2></header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

<Dialog
  title={<><WarningIcon /> Delete this project?</>}
  footer={<><Button variant="ghost">Cancel</Button><Button variant="danger">Delete</Button></>}
>
  This cannot be undone.
</Dialog>`,
          explanation:
            "`title` is a `ReactNode` rather than a `string`, which is the small decision that stops this API from growing a `titleIcon` prop next month. Anything a caller might want to decorate should be a node.",
          alternates: [
            {
              lang: "tsx",
              code: `interface DialogProps {
  title: ReactNode;
  children: ReactNode;
  /* Optional, and the component decides where it goes and what happens
     when it is absent. That decision is the reason this is a slot. */
  footer?: ReactNode;
}

function Dialog({ title, children, footer }: DialogProps) {
  return (
    <div role="dialog" aria-modal="true">
      <header><h2>{title}</h2></header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

<Dialog
  title={<><WarningIcon /> Delete this project?</>}
  footer={<><Button variant="ghost">Cancel</Button><Button variant="danger">Delete</Button></>}
>
  This cannot be undone.
</Dialog>`,
            },
          ],
        },
      ],
    },
    {
      id: "headless",
      heading: "Headless",
      body: [
        "Take the compound idea one step further: keep the state, the keyboard handling, the ARIA attributes and the focus management, and ship **no markup and no styles at all**. That is a headless library — Radix, Headless UI, Ark, React Aria, TanStack Table.",
        "The trade is stark and worth stating both ways.",
        "**What you get** is the part that is genuinely hard and that nobody gets right by hand: roving tabindex in a menu, focus trapping in a dialog, `aria-activedescendant` on a combobox, typeahead in a listbox, returning focus to the trigger on close, and the fifteen keyboard interactions the WAI-ARIA authoring practices specify for each. That is weeks of work and a great deal of testing with a screen reader.",
        "**What you give up** is a component that looks like anything. You are styling from scratch, and the library's structure — which wrapper elements exist, in what order — is now yours to work within.",
        "The honest recommendation: use one for the interactive primitives with real accessibility requirements — dialog, menu, combobox, tabs, tooltip, popover — and write your own cards, layouts and buttons. A `<button>` with a class does not need a library.",
      ],
    },
    {
      id: "when-not",
      heading: "When not to reach for this",
      body: [
        "A compound component costs a context, several exports, a runtime error case, and a caller who has to write five lines instead of one. That is worth paying when the arrangement varies, and not otherwise.",
        "**A list is a list.** `<UserList users={users} />` should stay that way until somebody actually needs to reorder something.",
        "**Two pieces are not a compound component.** If the parent and one child would do, a `children` prop is the whole answer.",
        "**A component used in one place has no API.** Design an API when there is a second caller, not before — the second caller is the first evidence about what varies.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a compound component and what problem does it solve?",
      answer:
        "Several components that share state through context, where the caller arranges them in ordinary JSX. It solves the growth of a configuration API: a `<Tabs items={[…]} />` prop object accumulates `renderLabel`, `tabClassName`, `iconPosition` and a dozen more, each of them reimplementing JSX inside a config object. The compound version never took responsibility for the arrangement, so it never acquires those props.",
    },
    {
      question: "Why context rather than cloning the children?",
      answer:
        "Because `Children.map` plus `cloneElement` only reaches direct children. The moment a caller wraps one piece in a layout div or a component of their own, the injection stops working. A context lookup walks up the tree, so a piece nested four levels inside components the library has never seen still finds the state — which is exactly what a caller-owned arrangement means.",
    },
    {
      question: "When would you use slots instead?",
      answer:
        "When the library owns the layout and the caller only fills regions — a dialog's header, body and footer are always in that order. A slot is a named `ReactNode` prop: simpler, no context, and type-checked, because a missing footer is a missing prop rather than a missing child. Compound when the caller arranges the pieces, slots when the library does.",
    },
    {
      question: "What does a headless component library give you?",
      answer:
        "The behaviour without the markup: state, keyboard handling, ARIA attributes and focus management, with no styles at all. It is worth it for the interactive primitives whose accessibility is genuinely hard — dialog focus trapping, roving tabindex in a menu, combobox typeahead, returning focus to the trigger — and not worth it for a card or a button. You pay by styling everything from scratch inside a DOM structure the library chose.",
    },
  ],
  takeaways: [
    "A config-object API grows a prop for every arrangement the caller wants",
    "A compound component shares state by context, so the caller owns the JSX",
    "The lookup walks up the tree, so a piece can be nested arbitrarily deep",
    "Cloning children only reaches direct children and breaks on the first wrapper",
    "The hook's error message is part of the API — name both components",
    "`Tabs.Tab = Tab` is for discoverability in an editor, nothing more",
    "Slots when the library owns the layout; compound when the caller does",
    "Any prop a caller might decorate should be a `ReactNode`, not a `string`",
    "Headless libraries are worth it for the primitives with hard accessibility, not for cards",
    "Design an API when there is a second caller, not before",
  ],
  status: "available",
};
