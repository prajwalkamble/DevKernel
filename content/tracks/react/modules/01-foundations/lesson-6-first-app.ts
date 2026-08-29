import type { Lesson } from "@/content/types";

export const firstAppLesson: Lesson = {
  id: "react-first-app",
  slug: "building-your-first-app",
  moduleSlug: "foundations",
  title: "Putting It Together: Your First Real App",
  summary:
    "One complete application built from the pieces of this module — components, props, state, events, lists, keys and a form — with the two decisions that shape every React app: where state lives, and what a key is for.",
  estimatedMinutes: 35,
  objectives: [
    "Render a list from an array, and choose a key that is actually stable",
    "Explain what goes wrong when the index is used as a key",
    "Build a controlled form and handle submission",
    "Decide where a piece of state should live, using one rule",
    "Lift state up so that siblings can share it",
    "Read a complete small application and see each concept in place",
  ],
  sections: [
    {
      id: "lists",
      heading: "Rendering a list, and what a key is for",
      body: [
        "There is no loop syntax in JSX because there does not need to be one: braces take an expression, an array of elements renders as its elements, and `map` turns data into elements. That is the whole pattern.",
        "React then asks for a **key** on each item, and the request is not cosmetic. Between two renders React has to match up the old list with the new one to decide what to keep, move, add or remove. Without keys it can only compare by position. The key tells it which item is *which*, so it can move a DOM node rather than rebuild it — and, crucially, so that the state inside a list item follows the right item.",
        "A key must be **stable** (the same across renders for the same item), **unique among siblings**, and — importantly — it does not need to be globally unique or to mean anything. A database id is ideal.",
      ],
      examples: [
        {
          id: "list-keys",
          title: "The index-as-key bug, made concrete",
          lang: "jsx",
          code: `const todos = [
  { id: "a1", text: "Learn JSX" },
  { id: "b2", text: "Learn props" },
  { id: "c3", text: "Learn state" },
];

// Fine: a stable id that belongs to the item.
const keyedById = (
  <ul>
    {todos.map((todo) => (
      <li key={todo.id}>{todo.text}</li>
    ))}
  </ul>
);

// Risky: the key is the position, not the item.
const keyedByIndex = (
  <ul>
    {todos.map((todo, index) => (
      <li key={index}>
        {todo.text}
        <input defaultValue="" />
      </li>
    ))}
  </ul>
);

// Delete the FIRST item and React reasons:
//   key 0 used to be "Learn JSX", now it is "Learn props"  -> same key, just update the text
//   key 1 used to be "Learn props", now it is "Learn state" -> same key, just update the text
//   key 2 is gone                                           -> remove the last row
//
// The text is right. But the <input> in row 0 was never re-created, so whatever
// you typed against "Learn JSX" is now sitting next to "Learn props".`,
          explanation:
            "The rule people repeat is \"never use the index as a key\", which is slightly too strong. The index is fine when the list is **never reordered, filtered, or added to except at the end**, and the items hold no state. The moment any of those stops being true, it is a bug — and since lists tend to gain sorting later, a stable id is the safer habit.",
          alternates: [
            {
              lang: "tsx",
              code: `type Todo = { id: string; text: string };

const todos: Todo[] = [
  { id: "a1", text: "Learn JSX" },
  { id: "b2", text: "Learn props" },
  { id: "c3", text: "Learn state" },
];

// Fine: a stable id that belongs to the item.
const keyedById = (
  <ul>
    {todos.map((todo) => (
      <li key={todo.id}>{todo.text}</li>
    ))}
  </ul>
);

// Risky: the key is the position, not the item.
const keyedByIndex = (
  <ul>
    {todos.map((todo, index) => (
      <li key={index}>
        {todo.text}
        <input defaultValue="" />
      </li>
    ))}
  </ul>
);

// Delete the FIRST item and React reasons:
//   key 0 used to be "Learn JSX", now it is "Learn props"  -> same key, just update the text
//   key 1 used to be "Learn props", now it is "Learn state" -> same key, just update the text
//   key 2 is gone                                           -> remove the last row
//
// The text is right. But the <input> in row 0 was never re-created, so whatever
// you typed against "Learn JSX" is now sitting next to "Learn props".
//
// Nothing in the type system distinguishes the two: both keys are valid. This
// one is caught by reasoning about identity, not by the compiler.`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`key` is for React, not for your component",
          body: "A component cannot read its own key — `props.key` is `undefined`. React strips it out before the props reach you, because it is instruction to the reconciler rather than data. If the item also needs its id, pass it a second time as an ordinary prop: `<Row key={todo.id} id={todo.id} />`.",
        },
      ],
    },
    {
      id: "forms",
      heading: "Controlled inputs",
      body: [
        "An HTML input keeps its own value in the DOM. React usually wants the value in state instead, so that everything else on the page can react to it. An input whose `value` comes from state and whose `onChange` writes back to that state is called **controlled**, and it is the default approach.",
        "The loop is: state renders the input, typing fires `onChange`, the handler sets state, the re-render puts the new value back into the input. It sounds circular, and it is — that is what keeps the state and the screen identical.",
      ],
      examples: [
        {
          id: "controlled-form",
          title: "A form with validation and submission",
          lang: "jsx",
          code: `function AddTodoForm({ onAdd }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    // Without this the browser navigates and the page reloads.
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed === "") {
      setError("Please write something first.");
      return;
    }

    onAdd(trimmed);     // report upward; the parent owns the list
    setText("");        // clearing state clears the input
    setError("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="todo">New task</label>
      <input
        id="todo"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-invalid={error !== ""}
      />
      <button type="submit">Add</button>
      {error !== "" && <p role="alert">{error}</p>}
    </form>
  );
}`,
          explanation:
            "Three things worth noticing. `onSubmit` on the form rather than `onClick` on the button, so the Enter key works. `event.preventDefault()`, without which the browser does a full page navigation. And `setText(\"\")` clearing the field — because the input has no value of its own, resetting the state resets the input.",
          alternates: [
            {
              lang: "tsx",
              code: `function AddTodoForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // \`FormEvent\` is the type worth knowing: it is what gives \`preventDefault\`
  // to the handler, and what stops \`event\` being an implicit \`any\`.
  function handleSubmit(event: React.FormEvent) {
    // Without this the browser navigates and the page reloads.
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed === "") {
      setError("Please write something first.");
      return;
    }

    onAdd(trimmed);     // report upward; the parent owns the list
    setText("");        // clearing state clears the input
    setError("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="todo">New task</label>
      <input
        id="todo"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-invalid={error !== ""}
      />
      <button type="submit">Add</button>
      {error !== "" && <p role="alert">{error}</p>}
    </form>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`value={undefined}` silently makes the input uncontrolled",
          body: "React warns that a component is \"changing an uncontrolled input to be controlled\" when `value` starts as `undefined` and later becomes a string. It happens when state is initialised from data that has not loaded yet. Initialise text state to `\"\"`, never `undefined` or `null`.",
        },
      ],
    },
    {
      id: "where-state-lives",
      heading: "Where should state live?",
      visual: {
        id: "first-app-lifting",
        kind: "react-rendering",
        algorithm: "lifting-state",
        title: "Where the shared state has to live",
      },
      body: [
        "This is the design decision React asks you to make constantly, and there is one rule that answers it: **state belongs in the closest common ancestor of every component that needs it.**",
        "Put it lower and a sibling cannot see it. Put it higher and every render of that ancestor re-renders a larger subtree than necessary, and the component becomes a junk drawer.",
        "When two siblings need the same value, you **lift state up**: move it to their parent and pass it down as props, along with callbacks for changing it. The children become simpler — they render what they are given — and the parent becomes the single place that value can change.",
      ],
      examples: [
        {
          id: "lifting-state",
          title: "Before and after lifting",
          lang: "jsx",
          code: `// BEFORE: each panel owns its own filter. The counter cannot see it,
// so the two disagree the moment anyone types.
function SearchPanel() {
  const [query, setQuery] = useState("");
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

function ResultCount() {
  // ...no way to reach \`query\` from here.
}

// AFTER: the state moves to the nearest common parent.
function TodoApp() {
  const [query, setQuery] = useState("");
  const [todos, setTodos] = useState([]);

  const visible = todos.filter((t) =>
    t.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <SearchPanel query={query} onQueryChange={setQuery} />
      <ResultCount shown={visible.length} total={todos.length} />
      <TodoList todos={visible} />
    </>
  );
}`,
          explanation:
            "Note that `visible` is **not state**. It is derived from `todos` and `query` during render, so it cannot fall out of sync. Holding a filtered copy in state and keeping it updated with an effect is the single most common piece of unnecessary React code there is.",
          alternates: [
            {
              lang: "tsx",
              code: `type Todo = { id: string; text: string };

// BEFORE: each panel owns its own filter. The counter cannot see it,
// so the two disagree the moment anyone types.
function SearchPanel() {
  const [query, setQuery] = useState("");
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

function ResultCount() {
  // ...no way to reach \`query\` from here.
}

// AFTER: the state moves to the nearest common parent.
function TodoApp() {
  const [query, setQuery] = useState("");
  // \`useState([])\` on its own infers \`never[]\`, and every later push is an
  // error. The type argument is not optional in practice.
  const [todos, setTodos] = useState<Todo[]>([]);

  const visible = todos.filter((t) =>
    t.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <SearchPanel query={query} onQueryChange={setQuery} />
      <ResultCount shown={visible.length} total={todos.length} />
      <TodoList todos={visible} />
    </>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      id: "the-app",
      heading: "The whole thing",
      body: [
        "Every idea in this module, in one file. Read it top to bottom: `App` owns the data and passes slices of it down; the children render what they are given and report events back up; nothing below `App` knows where the todos are stored.",
      ],
      examples: [
        {
          id: "complete-app",
          title: "src/App.tsx — a working todo application",
          lang: "jsx",
          code: `import { useState } from "react";

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
          {todo.text}
        </span>
      </label>
      <button type="button" onClick={() => onDelete(todo.id)} aria-label={\`Delete \${todo.text}\`}>
        ×
      </button>
    </li>
  );
}

function AddTodoForm({ onAdd }) {
  const [text, setText] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (text.trim() === "") return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="new-todo">New task</label>
      <input id="new-todo" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}

export default function App() {
  const [todos, setTodos] = useState([
    { id: "1", text: "Learn JSX", done: true },
    { id: "2", text: "Learn props", done: false },
  ]);
  const [showDone, setShowDone] = useState(true);

  // Derived during render — never stored, so it can never be stale.
  const visible = showDone ? todos : todos.filter((t) => !t.done);
  const remaining = todos.filter((t) => !t.done).length;

  function addTodo(text) {
    setTodos((current) => [
      ...current,
      { id: crypto.randomUUID(), text, done: false },
    ]);
  }

  function toggleTodo(id) {
    setTodos((current) =>
      current.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((t) => t.id !== id));
  }

  return (
    <main>
      <h1>Todo</h1>
      <p>{remaining} of {todos.length} remaining</p>

      <AddTodoForm onAdd={addTodo} />

      <label>
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => setShowDone(e.target.checked)}
        />
        Show completed
      </label>

      {visible.length === 0 ? (
        <p>Nothing to show.</p>
      ) : (
        <ul>
          {visible.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </main>
  );
}`,
          explanation:
            "Every update uses the functional form (`setTodos(current => …)`) because each one derives the new list from the old one. Every update replaces rather than mutates. `visible` and `remaining` are computed, not stored. And `TodoItem` holds no state at all — it is a pure function of its props, which makes it trivial to test and impossible to desynchronise.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState } from "react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

function TodoItem({ todo, onToggle, onDelete }: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
          {todo.text}
        </span>
      </label>
      <button type="button" onClick={() => onDelete(todo.id)} aria-label={\`Delete \${todo.text}\`}>
        ×
      </button>
    </li>
  );
}

function AddTodoForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim() === "") return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="new-todo">New task</label>
      <input id="new-todo" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Learn JSX", done: true },
    { id: "2", text: "Learn props", done: false },
  ]);
  const [showDone, setShowDone] = useState(true);

  // Derived during render — never stored, so it can never be stale.
  const visible = showDone ? todos : todos.filter((t) => !t.done);
  const remaining = todos.filter((t) => !t.done).length;

  function addTodo(text: string) {
    setTodos((current) => [
      ...current,
      { id: crypto.randomUUID(), text, done: false },
    ]);
  }

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((current) => current.filter((t) => t.id !== id));
  }

  return (
    <main>
      <h1>Todo</h1>
      <p>{remaining} of {todos.length} remaining</p>

      <AddTodoForm onAdd={addTodo} />

      <label>
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => setShowDone(e.target.checked)}
        />
        Show completed
      </label>

      {visible.length === 0 ? (
        <p>Nothing to show.</p>
      ) : (
        <ul>
          {visible.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </main>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "`crypto.randomUUID()` needs a secure context",
          body: "It is available in all modern browsers, but only over HTTPS or on `localhost`. On a plain-HTTP staging server it is `undefined` and you get a confusing \"not a function\" error. If that applies to you, generate ids on the server, or keep an incrementing counter — never `Math.random()` alone, which collides more often than people expect.",
        },
      ],
    },
    {
      id: "what-next",
      heading: "What you now know, and what comes next",
      body: [
        "With this module you can build a genuine interactive interface: components composed into a tree, props flowing down, callbacks flowing up, state in the right place, lists keyed correctly, and forms under control. That is most of what day-to-day React is.",
        "What is missing is everything about the *outside world*. This application has no server, so nothing here explains how to fetch data, when that fetch should happen, or what to show while it is in flight. That is **module 7, Effects and Data Fetching**, and it is where most remaining React bugs live.",
        "Before that, modules 2 to 6 go back over JSX, components, props, state and the core hooks properly — this module moved fast so that you had something working. The depth comes next.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a key, and why is using the array index risky?",
      answer:
        "A key identifies a list item across renders so React can match old elements to new ones and move DOM nodes rather than rebuilding them. The index describes a position rather than an item, so when the list is reordered, filtered or has an item removed from anywhere but the end, React matches the wrong items together — the text updates correctly but any state inside those items, such as an input's value or focus, stays with the position instead of following the item.",
    },
    {
      question: "What is a controlled component?",
      answer:
        "A form element whose value comes from React state and whose changes are written back to that state, so React is the single source of truth rather than the DOM. It costs a re-render per keystroke but means anything else on the page can depend on the current value, and resetting the field is just resetting the state.",
    },
    {
      question: "How do you decide where a piece of state should live?",
      answer:
        "Put it in the closest common ancestor of every component that reads or writes it. If only one component needs it, keep it there; if siblings share it, lift it to their parent and pass it down with callbacks. And if the value can be derived from existing state or props, do not store it at all — compute it during render.",
    },
  ],
  takeaways: [
    "`map` over an array to render a list; there is no loop syntax because braces take any expression",
    "A key must be stable and unique among siblings — the index is only safe for lists that are never reordered and hold no state",
    "A component cannot read its own key; pass the id again as a prop if it needs it",
    "Controlled inputs put the value in state, so clearing the state clears the field",
    "`onSubmit` on the form plus `event.preventDefault()`, not `onClick` on the button",
    "State belongs in the closest common ancestor of everything that needs it — lift it up when siblings must share",
    "Anything derivable from state or props should be computed during render, never stored",
  ],
  status: "available",
};
