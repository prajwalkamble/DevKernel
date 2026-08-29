import type { Lesson } from "@/content/types";

export const compositionInsteadOfContextLesson: Lesson = {
  id: "react-composition-instead",
  slug: "composition-instead-of-context",
  moduleSlug: "context-and-state-architecture",
  title: "Composition Instead of Context",
  summary:
    "The fix people skip. Passing the finished element instead of the data removes most prop drilling with no provider, no indirection and no extra concept — and it is why a well-composed tree needs far less context than a badly composed one.",
  estimatedMinutes: 26,
  objectives: [
    "Remove a drilling chain by passing children instead of data",
    "Use named slots when a component has more than one hole",
    "Say why this changes what re-renders, and why",
    "Recognise where composition cannot help",
    "Choose between a slot and a render prop",
  ],
  sections: [
    {
      id: "the-move",
      heading: "The move",
      body: [
        "A layout component does not need to know what goes inside it. It needs to know *where* things go. That is the whole idea, and it dissolves most drilling chains.",
        "The value never travels down, because the element that uses it is built where the value already is.",
      ],
      examples: [
        {
          id: "drill-vs-compose",
          title: "The same markup, two ways",
          lang: "jsx",
          code: `/* Drilling: every layer between the owner and the user mentions the prop. */
function DrilledAvatar({ user }) { return <img alt={user} />; }
function DrilledMenu({ user }) { return <nav><DrilledAvatar user={user} /></nav>; }
function DrilledHeader({ user }) { return <header><DrilledMenu user={user} /></header>; }
function DrilledPage({ user }) { return <div><DrilledHeader user={user} /></div>; }

/* Composition: the owner builds the element, so nothing in between sees it. */
function Menu({ children }) { return <nav>{children}</nav>; }
function Header({ children }) { return <header>{children}</header>; }
function ComposedPage({ user }) {
  return (
    <div>
      <Header>
        <Menu>
          <img alt={user} />
        </Menu>
      </Header>
    </div>
  );
}

import { renderToStaticMarkup } from "react-dom/server";
const a = renderToStaticMarkup(<DrilledPage user="Ada" />);
const b = renderToStaticMarkup(<ComposedPage user="Ada" />);
console.log("drilled  ->", a);
console.log("composed ->", b);
console.log("identical markup:", a === b);
console.log("components that name \`user\` but do not use it — drilled:", 3, " composed:", 0);`,
          output: `drilled  -> <div><header><nav><img alt="Ada"/></nav></header></div>
composed -> <div><header><nav><img alt="Ada"/></nav></header></div>
identical markup: true
components that name \`user\` but do not use it — drilled: 3  composed: 0`,
          explanation:
            "Byte-for-byte the same output. `Header` and `Menu` in the second version have no idea a user exists — they take `children` and put it somewhere, which is a genuinely reusable interface, whereas `DrilledHeader` can only ever be used on a page that has a user.",
          alternates: [
            {
              lang: "tsx",
              code: `import type { ReactNode } from "react";

/* Drilling: every layer between the owner and the user mentions the prop. */
function DrilledAvatar({ user }: { user: string }) { return <img alt={user} />; }
function DrilledMenu({ user }: { user: string }) { return <nav><DrilledAvatar user={user} /></nav>; }
function DrilledHeader({ user }: { user: string }) { return <header><DrilledMenu user={user} /></header>; }
function DrilledPage({ user }: { user: string }) { return <div><DrilledHeader user={user} /></div>; }

/* Composition: the owner builds the element, so nothing in between sees it. */
function Menu({ children }: { children: ReactNode }) { return <nav>{children}</nav>; }
function Header({ children }: { children: ReactNode }) { return <header>{children}</header>; }
function ComposedPage({ user }: { user: string }) {
  return (
    <div>
      <Header>
        <Menu>
          <img alt={user} />
        </Menu>
      </Header>
    </div>
  );
}

import { renderToStaticMarkup } from "react-dom/server";
const a = renderToStaticMarkup(<DrilledPage user="Ada" />);
const b = renderToStaticMarkup(<ComposedPage user="Ada" />);
console.log("drilled  ->", a);
console.log("composed ->", b);
console.log("identical markup:", a === b);
console.log("components that name \`user\` but do not use it — drilled:", 3, " composed:", 0);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Why this is easy to miss",
          body: "Composition needs you to *invert* the instinct. The reflex on seeing a chain is to find a faster way to send the data down. The move is to stop sending it and send the finished element instead — which feels like it must be more code, and is usually less.",
        },
      ],
    },
    {
      id: "slots",
      heading: "More than one hole: named slots",
      visual: {
        id: "composition-slots-visual",
        kind: "react-patterns",
        algorithm: "compound",
        title: "Passing elements instead of data",
      },
      body: [
        "`children` handles one hole. A layout usually has several, and the answer is that **props can hold elements**, not only data. There is nothing special about `children` beyond the JSX syntax that fills it.",
      ],
      examples: [
        {
          id: "named-slots",
          title: "A layout with four slots",
          lang: "jsx",
          code: `/* Knows about arrangement. Knows nothing about content. */
function SplitView({ sidebar, toolbar, children, footer }) {
  return (
    <div className="split">
      <aside>{sidebar}</aside>
      <div className="main">
        <div className="toolbar">{toolbar}</div>
        {children}
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

function InboxPage() {
  const [selected, setSelected] = useState(null);
  const { data: folders } = useFolders();

  // Everything that needs \`selected\` is built here, where it lives.
  return (
    <SplitView
      sidebar={<FolderList folders={folders} onPick={setSelected} />}
      toolbar={<MessageActions messageId={selected} />}
      footer={<StatusBar count={folders?.length ?? 0} />}
    >
      {selected ? <Message id={selected} /> : <NothingSelected />}
    </SplitView>
  );
}`,
          explanation:
            "`SplitView` takes no data at all. It cannot be broken by a change to what a folder is, it can be used on a page with no folders, and its props are an honest description of what it does: four regions and an arrangement. The state stays exactly where it was, in `InboxPage`, and nothing is drilled anywhere.",
          alternates: [
            {
              lang: "tsx",
              code: `type SplitViewProps = {
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;      // the main region
  footer?: ReactNode;
};

/* Knows about arrangement. Knows nothing about content. */
function SplitView({ sidebar, toolbar, children, footer }: SplitViewProps) {
  return (
    <div className="split">
      <aside>{sidebar}</aside>
      <div className="main">
        <div className="toolbar">{toolbar}</div>
        {children}
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

function InboxPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: folders } = useFolders();

  // Everything that needs \`selected\` is built here, where it lives.
  return (
    <SplitView
      sidebar={<FolderList folders={folders} onPick={setSelected} />}
      toolbar={<MessageActions messageId={selected} />}
      footer={<StatusBar count={folders?.length ?? 0} />}
    >
      {selected ? <Message id={selected} /> : <NothingSelected />}
    </SplitView>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A slot prop and `children` are the same mechanism",
          body: "`<Card>{x}</Card>` and `<Card children={x} />` are identical — JSX just puts the nested content into the `children` prop. So a slot named `header` is not a lesser thing than `children`; it is the same thing with a better name. Use `children` for the one obviously-main region and named props for the rest.",
        },
        {
          title: "Slots break down past about four",
          body: "A component taking six element props is describing a layout so specific that it will be used once. At that point write the arrangement directly in the page and skip the abstraction — the component was not earning its name.",
        },
      ],
    },
    {
      id: "re-renders",
      heading: "What this does to re-renders",
      body: [
        "There is a second effect, and it is the reason composition shows up in performance advice as well as in architecture advice.",
        "An element passed as a prop is **created by the parent that owns the state**. When that parent re-renders it creates a new element for the slot, so the slot's content re-renders. But a component *between* the owner and the content — `SplitView` here — is only re-rendered if its own props changed.",
        "The practical version: `<Layout>{expensiveThing}</Layout>` where `Layout` holds some state of its own means `Layout` can re-render without re-rendering `expensiveThing`, because `children` is the same element object it was given. That is a real, free optimisation, and it is one of the few that costs nothing to apply.",
        "Module 9 measures this properly. The point here is that it is a consequence of composition rather than a separate technique.",
      ],
      pitfalls: [
        {
          title: "It only helps when the state is *below* the element",
          body: "If the state that changes lives above where the element is created, the element is rebuilt and nothing is skipped. The trick works when a component in the middle owns state that the passed content does not care about — a sidebar that opens and closes, a tab strip, a hover state.",
        },
      ],
    },
    {
      id: "limits",
      heading: "Where composition cannot help",
      body: [
        "It is not a universal replacement for context, and knowing the boundary is what stops you contorting a tree.",
        "**When the consumer's position is not fixed.** Composition works because the owner knows where the value is used. A theme read by any component anywhere, including ones written later, cannot be composed — that is what context is for.",
        "**When the consumer is inside a list the owner does not build.** `<Table rows={rows} />` renders its own rows; you cannot hand it a finished row per item without turning `Table` into something else.",
        "**When the value must be read by a deeply nested component you do not control.** A third-party component's internals are not yours to compose.",
        "**When it would push everything to the top.** Composition moves element construction upward. Taken too far, the top-level page builds every element in the app and is thousands of lines — which is a worse problem than the drilling. If the composed version is harder to read than the drilled one, stop.",
      ],
    },
    {
      id: "render-props",
      heading: "When a slot is not enough: render props",
      body: [
        "A slot is an element, fixed at the moment the owner builds it. Sometimes the content needs something only the *inner* component knows — the row it is being rendered for, whether it is selected, the current drag state.",
        "Then pass a function instead of an element, and let the inner component call it with what it knows.",
      ],
      examples: [
        {
          id: "render-prop",
          title: "A function as the slot",
          lang: "jsx",
          code: `/* \`Table\` owns iteration and selection. It cannot be given finished rows,
   because it is the only thing that knows which row is which. */
function Table({
  rows,
  renderRow,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  return (
    <table><tbody>
      {rows.map((row, i) => (
        <tr key={i} onClick={() => setSelectedIndex(i)}>
          {renderRow(row, { selected: i === selectedIndex })}
        </tr>
      ))}
    </tbody></table>
  );
}

<Table
  rows={invoices}
  renderRow={(invoice, { selected }) => (
    <>
      <td>{invoice.number}</td>
      <td>{selected ? <Actions id={invoice.id} /> : formatMoney(invoice.total)}</td>
    </>
  )}
/>;`,
          explanation:
            "The caller still decides what a row looks like, and `Table` still owns iteration and selection. Neither had to know about the other's concern. A custom hook is the other way to split this — module 10 — and the difference is that a hook returns state while a render prop also owns the loop.",
          alternates: [
            {
              lang: "tsx",
              code: `/* \`Table\` owns iteration and selection. It cannot be given finished rows,
   because it is the only thing that knows which row is which. */
function Table<T>({
  rows,
  renderRow,
}: {
  rows: T[];
  renderRow: (row: T, state: { selected: boolean }) => ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return (
    <table><tbody>
      {rows.map((row, i) => (
        <tr key={i} onClick={() => setSelectedIndex(i)}>
          {renderRow(row, { selected: i === selectedIndex })}
        </tr>
      ))}
    </tbody></table>
  );
}

<Table
  rows={invoices}
  renderRow={(invoice, { selected }) => (
    <>
      <td>{invoice.number}</td>
      <td>{selected ? <Actions id={invoice.id} /> : formatMoney(invoice.total)}</td>
    </>
  )}
/>;`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Do not reach for a render prop when a slot works",
          body: "A function prop is harder to read, harder to type, and re-created on every render, which puts it in the way of memoisation. Use one only when the content genuinely depends on something the inner component knows. If the owner has all the information, a slot is strictly better.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How does composition remove prop drilling?",
      answer:
        "By passing the finished element instead of the data. The component that owns the value builds the element that uses it and hands it down as `children` or a slot prop, so the components in between only place it — they never see the data and never acquire a prop that is not theirs. The rendered output is identical; what changes is that the intermediate components become genuinely reusable, because they no longer depend on the shape of data they do not use.",
    },
    {
      question: "How does passing children affect re-renders?",
      answer:
        "An element passed as a prop is created by the parent that owns the state, so a component in the middle can re-render without re-rendering the content it was given — `children` is the same element object it already had. That makes `<Layout>{expensive}</Layout>` a free optimisation when `Layout` holds state the content does not care about. It only helps when the changing state is below where the element was created.",
    },
    {
      question: "When can't composition replace context?",
      answer:
        "When the owner cannot know where the value is consumed: a theme read by anything anywhere, including components written later. When the consumer is inside a list the owner does not build. When it is inside a third-party component. And when applying it would push element construction so far up that the top-level page builds the whole app — at which point the cure is worse than the drilling.",
    },
    {
      question: "Slot or render prop?",
      answer:
        "A slot when the owner has all the information — it is simpler, easier to type, and does not create a new function every render. A render prop when the content depends on something only the inner component knows, such as which row it is or whether it is selected. The inner component then calls the function with that information, so neither side has to know the other's concern.",
    },
  ],
  takeaways: [
    "Pass the finished element, not the data — the intermediates never see it",
    "The rendered output is identical; the interfaces get honest",
    "`children` is a prop like any other, so a layout can have several named slots",
    "A slot component that takes no data cannot be broken by a change to that data",
    "An element passed as a prop is not re-created when the component holding it re-renders",
    "Composition cannot reach consumers whose position the owner does not know — that is context",
    "Stop when the composed version reads worse than the drilled one",
    "Render props only when the content needs something the inner component knows",
  ],
  status: "available",
};
