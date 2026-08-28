import type { Lesson } from "@/content/types";

export const containerPresentationalLesson: Lesson = {
  id: "react-container-presentational",
  slug: "container-and-presentational",
  moduleSlug: "patterns-and-mastery",
  title: "Container/Presentational, and What Replaced It",
  summary:
    "The pattern that organised React for five years, why hooks made its mechanism obsolete but not its idea, and the render-prop and higher-order-component patterns you still have to be able to read.",
  estimatedMinutes: 26,
  objectives: [
    "Say what container/presentational was and why it existed",
    "Explain what hooks changed about it",
    "Keep the separation without the wrapper component",
    "Read a render prop and a higher-order component",
    "Recognise where each pattern still survives",
  ],
  sections: [
    {
      id: "the-original",
      heading: "What it was",
      body: [
        "Around 2015 the advice was to split every feature in two. A **container** knew where data came from — it subscribed to the store, fetched, held state — and rendered a **presentational** component that took only props and returned only markup.",
        "The reasoning was sound and is still sound: the presentational half is trivial to test, trivial to reuse, and trivial to look at in isolation, because it is a function from props to JSX.",
        "The reason it took the form of *two components* is the part that expired. Before hooks, the only way to have state or lifecycle was to be a class component, and the only way to share that logic was to wrap. So separating concerns meant separating components, because there was no other unit to put logic in.",
      ],
      examples: [
        {
          id: "the-old-shape",
          title: "The shape, as it was written",
          lang: "tsx",
          code: `/* The container: knows about fetching, knows nothing about markup. */
class UserListContainer extends React.Component {
  state = { users: [], loading: true };

  componentDidMount() {
    fetchUsers().then((users) => this.setState({ users, loading: false }));
  }

  render() {
    return <UserList users={this.state.users} loading={this.state.loading} />;
  }
}

/* The presentational component: knows about markup, knows nothing else. */
function UserList({ users, loading }) {
  if (loading) return <Spinner />;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
          explanation:
            "Notice what the container is: a class whose entire `render` is one element. It exists solely because the data logic had nowhere else to live. That is the piece hooks deleted.",
        },
      ],
    },
    {
      id: "what-changed",
      heading: "What hooks changed",
      body: [
        "A custom hook is a unit of logic that is not a component. So the separation can happen **inside** one component instead of between two.",
        "The hook is the container. It is testable on its own, reusable in three places, and swappable for another implementation — every property the container had, without the wrapper.",
        "What did not change: the *idea* that data logic and rendering are different concerns and should be separable. That was always right. Only the mechanism was a workaround.",
      ],
      examples: [
        {
          id: "the-new-shape",
          title: "The same separation, one component",
          lang: "tsx",
          code: `/* The logic, extractable and testable, in no particular component. */
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchUsers().then((data) => {
      if (ignore) return;
      setUsers(data);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  return { users, loading };
}

/* The markup. One component instead of two, and the separation is still
   there — it is just a line inside the file rather than a file boundary. */
function UserList() {
  const { users, loading } = useUsers();
  if (loading) return <Spinner />;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
          explanation:
            "Half the code and the same properties. `useUsers` can be tested with a hook-testing helper, used by three screens, or replaced with a TanStack Query call without `UserList` changing a line.",
        },
      ],
      pitfalls: [
        {
          title: "The version worth keeping",
          body: "A presentational component that takes only props is still the most reusable thing you can write, and it is still worth having one for anything that appears in more than one place — a `UserCard` that takes a user is usable in a list, a search result and a mention popover. What you no longer need is a *container component* whose only job is to call it.",
        },
      ],
    },
    {
      id: "render-props",
      heading: "Render props",
      body: [
        "The other pre-hooks answer to sharing logic: a component that holds state and calls a **function child** with it.",
        "Hooks replaced this for logic sharing, and it survives for a different job — a component that owns something the caller must render *around*, particularly when a type parameter is involved. Module 13's generic `List` is a render prop, and it has to be, because there is no other way to hand the caller a value the caller did not create.",
      ],
      examples: [
        {
          id: "render-prop",
          title: "Then and now",
          lang: "tsx",
          code: `/* 2017: sharing mouse position. */
<MouseTracker>
  {({ x, y }) => <p>{x}, {y}</p>}
</MouseTracker>

/* Today: the same thing, and it composes with other hooks. */
const { x, y } = useMousePosition();

/* Still a render prop, and rightly so: the value is produced per item by
   a component the caller does not control. A hook cannot express this,
   because the caller is not the one iterating. */
<List items={users} getKey={(u) => u.id}>
  {(user) => <UserCard user={user} />}
</List>`,
          explanation:
            "The distinction: a hook gives the caller a value **once**, in their own component body. A render prop gives them a value **per invocation**, from inside a loop or a boundary they do not control. When the second is what you need, a render prop is not a legacy pattern — it is the only pattern.",
        },
      ],
    },
    {
      id: "hocs",
      heading: "Higher-order components",
      body: [
        "The third pre-hooks pattern: a function taking a component and returning a wrapped one. `connect(mapState)(Component)`, `withRouter(Component)`, `withTheme(Component)`.",
        "You will not write one, and you must be able to read one, because they are still in every codebase over four years old and in a few current libraries.",
        "The reasons they lost are worth knowing, because they are the same reasons that make any wrapper-based composition unpleasant: props arrive from nowhere visible, so the source of `props.router` is unguessable; the types are painful, since the HOC has to remove what it injects and pass the rest through; two of them nest into `withA(withB(withC(X)))`; and every one adds a component to the tree, which is why a React DevTools tree in a 2018 app was forty levels deep.",
      ],
      examples: [
        {
          id: "hoc",
          title: "Reading one",
          lang: "tsx",
          code: `/* The shape. It takes a component, returns a component, and injects
   props the wrapped component's own signature never mentions. */
function withTheme<P extends { theme: Theme }>(Component: React.ComponentType<P>) {
  return function WithTheme(props: Omit<P, "theme">) {
    const theme = useContext(ThemeContext);
    return <Component {...(props as P)} theme={theme} />;
  };
}

const ThemedButton = withTheme(Button);

/* The same thing today, and the difference is that you can see where the
   value comes from by reading the component. */
function Button(props: ButtonProps) {
  const theme = useTheme();
  // …
}

/* The one place HOCs are still the right tool: adding behaviour around a
   component you do not own and cannot edit. React.memo is one. So is a
   wrapper that adds an error boundary or an analytics identity. */
const MemoisedRow = memo(Row);`,
          explanation:
            "`memo` is a higher-order component, which is a useful thing to notice — the pattern is not dead, it just narrowed to the case it is actually good at: wrapping a component from the outside to add something orthogonal, rather than injecting data into it.",
        },
      ],
      pitfalls: [
        {
          title: "Copy the displayName, or the DevTools tree fills with wrappers",
          body: "A returned function's name is whatever you called it, so twelve wrapped components all appear as `WithTheme`. `WithTheme.displayName = \\`withTheme(${Component.displayName ?? Component.name})\\`` is the convention, and module 9's minification lesson is the reason to use an explicit `displayName` rather than trusting `.name` in a production build.",
        },
      ],
    },
    {
      id: "today",
      heading: "How to organise a component today",
      body: [
        "There is no pattern to adopt. There are four questions, and the answers are usually obvious once asked.",
        "**Is this logic used in more than one place?** Extract a hook. Once, not preemptively.",
        "**Is this markup used in more than one place?** Extract a component that takes props.",
        "**Is this component doing two unrelated things?** Split it — and split it at the seam the *feature* has, not at an arbitrary data/markup line.",
        "**Is it fine?** Then leave it. A hundred-line component that does one thing is not a problem, and splitting it into six files that are each used once makes the feature harder to read, not easier.",
        "The last one is the least-followed advice in React. The patterns in this module are answers to pressure; applying them before the pressure exists produces the abstraction without the benefit.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What was the container/presentational pattern?",
      answer:
        "Splitting a feature into a container that knew where data came from — state, fetching, store subscriptions — and a presentational component that took only props and returned only markup. The separation of concerns was right, and the reason it took the form of two components was a workaround: before hooks, only a class could hold state and only wrapping could share it, so there was no unit to put logic in other than a component.",
    },
    {
      question: "What replaced it?",
      answer:
        "Custom hooks. A hook is a unit of logic that is not a component, so the separation happens inside one component instead of between two — and the hook keeps every property the container had: testable alone, reusable, replaceable. What survives is the presentational component itself, which is still the most reusable thing you can write. What went is the wrapper whose only job was to call it.",
    },
    {
      question: "Are render props obsolete?",
      answer:
        "For sharing logic, yes — a hook does that better and composes. They survive for a different job: handing the caller a value produced per invocation from inside a loop or boundary the caller does not control, such as a generic list rendering each row. A hook gives you a value once, in your own component body; a render prop gives you one per item, and no hook can express that.",
    },
    {
      question: "Why did higher-order components fall out of favour?",
      answer:
        "Props arrive from nowhere visible, so you cannot tell where `props.router` came from by reading the component. The types are awkward, since the HOC must remove what it injects and pass the rest through. They nest badly. And each one adds a node to the tree, which is why DevTools in that era was forty levels deep. They survive for what they are actually good at — wrapping a component from outside to add something orthogonal, which is exactly what `memo` is.",
    },
  ],
  takeaways: [
    "The separation of data logic from rendering was always right; two components was the workaround",
    "A custom hook is the container, without the wrapper",
    "A presentational component taking only props is still the most reusable thing you can write",
    "Render props survive where a value is produced per item, inside a loop the caller does not own",
    "A hook hands you a value once; a render prop hands you one per invocation",
    "HOCs lost because injected props are invisible, the types are awkward, and they nest",
    "`memo` is a HOC, and shows the case the pattern is still right for",
    "Set an explicit `displayName` on any wrapper, or the DevTools tree becomes unreadable",
    "Extract on the second use, not the first — and a long component that does one thing is fine",
  ],
  status: "available",
};
