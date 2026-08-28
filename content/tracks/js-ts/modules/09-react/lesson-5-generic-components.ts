import type { Lesson } from "@/content/types";

export const genericComponentsLesson: Lesson = {
  id: "react-ts-generics",
  slug: "generic-components",
  moduleSlug: "react",
  title: "Generic Components",
  summary:
    "Components that work over any data type without losing what that type is — generic props, constraints, and the polymorphic `as` prop that lets one component render as any element while still checking its attributes.",
  estimatedMinutes: 35,
  objectives: [
    "Write a component with a type parameter and let it infer at the call site",
    "Constrain a type parameter to what the implementation needs",
    "Build a generic list component with a typed render prop",
    "Implement a polymorphic component with an `as` prop",
    "Know the syntax traps: `<T,>` in .tsx and generics with `ref`",
  ],
  sections: [
    {
      id: "why",
      heading: "Why a component needs a type parameter",
      body: [
        "A `<Select>` that accepts options and calls back with the chosen one has a problem: the option type is whatever the caller supplies. Typing it as `unknown` forces every caller to cast; typing it as `any` gives up entirely; typing it as a specific interface makes the component useless for anything else.",
        "A type parameter says \"whatever you pass in, that is what comes back out\" — and TypeScript infers it from the props at each call site, so callers write nothing extra.",
      ],
      examples: [
        {
          id: "generic-list",
          title: "A generic list, and the typo it catches",
          lang: "tsx",
          code: `interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
}

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={getKey(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

interface User {
  id: string;
  name: string;
  age: number;
}

// T is inferred as User from \`items\`. Both callbacks are typed accordingly.
const good = <List items={users} getKey={(u) => u.id} renderItem={(u) => u.name} />;

// And a typo inside a callback is a compile error, not a blank cell.
const bad = <List items={users} getKey={(u) => u.id} renderItem={(u) => u.nmae} />;`,
          requires: "tsc over the whole lesson's examples in one file, which is how these diagnostics got their line numbers",
          output: `e.tsx(18,75): error TS2339: Property 'nmae' does not exist on type 'User'.`,
          explanation:
            "Nothing at the call site mentions `User` — inference flows from `items` into both callbacks. `readonly T[]` on the prop is a small kindness: it accepts both a mutable array and a `readonly` one, and it documents that the component will not modify what it is given.",
        },
      ],
    },
    {
      id: "constraints",
      heading: "Constrain to what you actually use",
      body: [
        "An unconstrained `T` means the component may do nothing with the value except pass it around. The moment the implementation reads a property, the parameter needs a constraint saying so — otherwise the component does not compile.",
        "The constraint should describe **exactly what the implementation relies on** and no more. Constraining to a full `User` interface when you only read `id` makes the component needlessly specific.",
      ],
      examples: [
        {
          id: "constrained-generic",
          title: "Requiring only what is used",
          lang: "tsx",
          code: `// The component reads \`id\`, so it must say so.
interface KeyedProps<T extends { id: string }> {
  items: T[];
}

function Keyed<T extends { id: string }>({ items }: KeyedProps<T>) {
  return <>{items.map((item) => <span key={item.id} />)}</>;
}

// Anything with a string id works, whatever else it carries.
// <Keyed items={users} />     fine
// <Keyed items={products} />  fine

const bad = <Keyed items={[{ name: "x" }]} />;`,
          requires: "tsc over the whole lesson's examples in one file, which is how these diagnostics got their line numbers",
          output: `e.tsx(25,31): error TS2353: Object literal may only specify known properties, and 'name' does not exist in type '{ id: string; }'.`,
          explanation:
            "Useful constraints, in rough order of how often they appear: `T extends { id: string }` for anything keyed, `T extends string` for a union of literal values, `K extends keyof T` for a prop naming a field of another prop, and `T extends ElementType` for the polymorphic case below.",
        },
        {
          id: "keyof-constraint",
          title: "`keyof` — a prop that names a field of another prop",
          lang: "tsx",
          code: `interface TableProps<T, K extends keyof T> {
  rows: T[];
  columns: readonly K[];
  // The renderer receives exactly the value at that column.
  renderCell?: (value: T[K], row: T) => ReactNode;
}

function Table<T, K extends keyof T>({ rows, columns, renderCell }: TableProps<T, K>) {
  return (
    <table>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((column) => (
              <td key={String(column)}>
                {renderCell ? renderCell(row[column], row) : String(row[column])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// columns is checked against the keys of User:
// <Table rows={users} columns={["name", "age"]} />
// <Table rows={users} columns={["nmae"]} />   -> Error: not assignable to keyof User`,
          explanation:
            "This is where generics start paying properly. The column names are checked against the row type, the cell renderer receives the correctly-typed value for whichever column it is rendering, and a renamed field on `User` becomes a compile error at every table that used it.",
        },
      ],
    },
    {
      id: "syntax-traps",
      heading: "Two syntax traps",
      body: [
        "**The generic arrow in `.tsx`**, from lesson 1: `const List = <T>(props: ListProps<T>) => …` parses as JSX. Write `<T,>`, add a constraint, or — best — declare the component with `function`, which never had the problem. Function declarations are the reason most generic components in real codebases are written that way.",
        "**Generics and `ref`.** Before React 19, a generic component that also forwarded a ref needed either a cast or a declaration-merging trick, because `forwardRef` erases the type parameter. In React 19 `ref` is an ordinary prop, so a generic component takes one like any other and the workarounds are no longer needed.",
      ],
      examples: [
        {
          id: "generic-ref",
          title: "Generic and ref-accepting, in React 19",
          lang: "tsx",
          code: `interface SelectProps<T> {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  ref?: React.Ref<HTMLSelectElement>;
}

// A function declaration: no <T,> needed, and \`ref\` is just a prop.
export function Select<T>({ options, value, onChange, getLabel, ref }: SelectProps<T>) {
  return (
    <select
      ref={ref}
      value={value ? getLabel(value) : ""}
      onChange={(event) => {
        const found = options.find((option) => getLabel(option) === event.target.value);
        if (found) onChange(found);
      }}
    >
      {options.map((option) => (
        <option key={getLabel(option)}>{getLabel(option)}</option>
      ))}
    </select>
  );
}

// T infers from \`options\`; onChange receives a User.
// <Select options={users} value={selected} onChange={setSelected} getLabel={(u) => u.name} ref={selectRef} />`,
          explanation:
            "Compare this with the pre-19 version, which needed `forwardRef` plus either `as` on the result or a `declare module` augmentation to keep `T`. Deleting that is one of the more immediately satisfying parts of a React 19 upgrade.",
        },
      ],
    },
    {
      id: "polymorphic",
      heading: "The polymorphic `as` prop",
      body: [
        "A design-system component often needs to render as different elements — a `Button` that is sometimes an `<a>`, a `Text` that is sometimes an `<h1>`. The `as` prop expresses that, and typing it properly means **the accepted attributes change with the element**.",
        "The type is dense, and it is worth reading once rather than deriving it each time.",
      ],
      examples: [
        {
          id: "polymorphic-box",
          title: "The pattern, and the attribute it rejects",
          lang: "tsx",
          code: `import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type BoxProps<E extends ElementType> = {
  as?: E;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;

function Box<E extends ElementType = "div">({ as, children, ...rest }: BoxProps<E>) {
  const Component = as ?? "div";
  return <Component {...rest}>{children}</Component>;
}

// as="a" accepts href, because an anchor does.
const b1 = <Box as="a" href="/x">link</Box>;

// as="button" does not.
const b2 = <Box as="button" href="/x">nope</Box>;`,
          requires: "tsc over the whole lesson's examples in one file, which is how these diagnostics got their line numbers",
          output: `e.tsx(35,29): error TS2322: Type '{ children: string; as: "button"; href: string; }' is not assignable to type 'IntrinsicAttributes & { as?: "button" | undefined; children?: ReactNode; } & Omit<Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref">, "as" | "children">'.
  Property 'href' does not exist on type 'IntrinsicAttributes & { as?: "button" | undefined; children?: ReactNode; } & Omit<Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref">, "as" | "children">'.`,
          explanation:
            "The three pieces: `E extends ElementType` accepts a tag name or a component; `ComponentPropsWithoutRef<E>` pulls that element's own props; and `Omit<…, \"as\" | \"children\">` stops the element's own definitions colliding with yours. The default `= \"div\"` is what lets `<Box>` be used with no `as` at all.",
        },
      ],
      pitfalls: [
        {
          title: "Polymorphic error messages are genuinely awful",
          body: "The message above is one error rendered across four lines of nested `Omit` and `DetailedHTMLProps`. The useful part is always the last line — `Property 'href' does not exist` — so read from the bottom. This unreadability is the main argument against the pattern: it is right for a design system used by many people, and overkill for an application component used twice.",
        },
      ],
    },
    {
      id: "when-generic",
      heading: "When not to reach for a generic",
      body: [
        "A generic component costs something: a harder signature to read, worse error messages, and inference that can fail in ways plain props never do.",
        "**Worth it** when the component genuinely relays a caller's type through to a callback — lists, tables, selects, autocompletes, form fields. That is the case where the alternative is `any` or a cast at every call site.",
        "**Not worth it** when there is only one type in practice. A `<UserList>` that will only ever render users should take `users: User[]`. Generalising it in anticipation of a second type is the same guess the last lesson of module 10 warns about, and it is usually wrong.",
        "The signal that a generic is failing: callers writing the type argument explicitly. `<List<User> items={users} …>` means inference is not working, and the fix is normally a prop that lets the type flow — not more type parameters.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When does a component need a type parameter?",
      answer:
        "When it relays a caller's type through to something the caller supplies — a list whose render callback receives an item, a select whose `onChange` returns the chosen option. Without one, the component must use `unknown` and force casts, or `any` and give up checking. With one, TypeScript infers the type from the props at each call site and callers write nothing extra.",
    },
    {
      question: "How do you write a generic component in a .tsx file?",
      answer:
        "Use a function declaration — `function List<T>(props: ListProps<T>)` — which never hits the parsing problem. A generic arrow needs `<T,>` with a trailing comma or a constraint like `<T extends unknown>`, because a bare `<T>` is parsed as the start of a JSX element and produces an error about a missing closing tag.",
    },
    {
      question: "What does a polymorphic `as` prop look like in types?",
      answer:
        "A type parameter `E extends ElementType` with a default, props intersected with `Omit<ComponentPropsWithoutRef<E>, \"as\" | \"children\">`. That makes the accepted attributes follow the element, so `as=\"a\"` allows `href` and `as=\"button\"` rejects it. The cost is very poor error messages, so it is right for a design system and usually overkill for an application component.",
    },
    {
      question: "How do you write a component that is both generic and accepts a ref?",
      answer:
        "In React 19, declare `ref` as an ordinary prop typed `React.Ref<T>` — nothing special is needed. Before 19 this required `forwardRef`, which erases the type parameter, so codebases used a cast on the result or a module augmentation. That workaround can be removed on upgrade.",
    },
  ],
  takeaways: [
    "A type parameter lets a component relay the caller's type to its callbacks, inferred at each call site",
    "Constrain the parameter to exactly what the implementation reads, and no more",
    "`K extends keyof T` types a prop that names a field of another prop — the basis of typed tables",
    "Write generic components with `function`, not an arrow, to avoid the `.tsx` parsing trap",
    "React 19 removed the generic-plus-forwardRef workaround: `ref` is now an ordinary prop",
    "The polymorphic `as` pattern is `E extends ElementType` plus `Omit<ComponentPropsWithoutRef<E>, …>`",
    "Read polymorphic error messages from the bottom — the last line names the actual problem",
    "Callers writing the type argument explicitly means inference has failed; add a prop, not another parameter",
  ],
  status: "available",
};
