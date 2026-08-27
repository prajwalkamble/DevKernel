import type { Lesson } from "@/content/types";

export const eslintLesson: Lesson = {
  id: "react-eslint",
  slug: "eslint-and-the-hooks-plugin",
  moduleSlug: "testing-typescript-tooling",
  title: "ESLint, the Hooks Plugin & the Rules Worth Enforcing",
  summary:
    "The one plugin that is not negotiable, what its current version checks that the old one did not — seventeen rules, most of them compiler-backed — reading its real output, and why arguing with exhaustive-deps means the effect is wrong.",
  estimatedMinutes: 26,
  objectives: [
    "Configure eslint-plugin-react-hooks in flat config",
    "Read what rules-of-hooks and exhaustive-deps actually report",
    "Name what the current plugin version added",
    "Respond to exhaustive-deps correctly rather than by suppressing it",
    "Choose the small set of other rules worth having",
  ],
  sections: [
    {
      id: "why",
      heading: "Why this one plugin is different",
      body: [
        "Most lint rules are opinions with a formatter's authority. `eslint-plugin-react-hooks` is not: it enforces rules React's runtime genuinely depends on, and breaking them produces bugs that are unreproducible rather than merely untidy.",
        "Module 5 established why. Hook state is kept in a per-component list and matched by call order, so a hook inside a condition shifts every hook after it onto the wrong slot — and the symptom is a value from a different hook, appearing intermittently.",
        "You cannot catch that in review reliably. A linter catches it every time.",
      ],
      examples: [
        {
          id: "flat-config",
          title: "The configuration",
          lang: "javascript",
          code: `// eslint.config.mjs
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
]);`,
          explanation:
            "In flat config `plugins` is an object mapping a name to the imported plugin, not an array of strings — passing the old shape produces a long, specific ESLint error telling you so. If you are on `eslint-config-next`, all of this is already configured and you can skip to the next section.",
        },
      ],
    },
    {
      id: "the-two",
      heading: "The two rules everyone knows",
      body: [
        "**`rules-of-hooks`** — an error, always, no exceptions worth taking. Hooks at the top level of a component or another hook, unconditionally, in the same order every render.",
        "**`exhaustive-deps`** — a warning, and the most argued-with rule in the ecosystem.",
        "Here is what they actually say, from a real run against a file with three deliberate mistakes.",
      ],
      examples: [
        {
          id: "real-output",
          title: "Three violations, three messages",
          lang: "tsx",
          code: `import { useState, useEffect } from "react";

export function Bad({ id, enabled }: { id: string; enabled: boolean }) {
  const [user, setUser] = useState(null);

  /* 1. A hook inside a condition. */
  if (enabled) {
    const [extra] = useState(0);
    console.log(extra);
  }

  /* 2. A dependency that is read but not declared. */
  useEffect(() => {
    fetchUser(id).then(setUser);
  }, []);

  /* 3. A hook called from a plain function. */
  function helper() {
    const [x] = useState(1);
    return x;
  }

  return <p onClick={helper}>{user}</p>;
}`,
          output: `   8:21  error    React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render                                                                                                                   react-hooks/rules-of-hooks
  15:6   warning  React Hook useEffect has a missing dependency: 'id'. Either include it or remove the dependency array                                                                                                                                         react-hooks/exhaustive-deps
  19:17  error    React Hook "useState" is called in function "helper" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use"  react-hooks/rules-of-hooks

✖ 3 problems (2 errors, 1 warning)`,
          explanation:
            "The third message is worth reading in full, because it explains the naming convention people treat as decoration: the plugin identifies components and hooks **by their names**. A capital letter means component, a `use` prefix means hook, and a function that is neither cannot contain hooks. That is why a helper called `getInitialState` cannot call `useState` and one called `useInitialState` can.",
          requires: "eslint (the output is its report, not a program's)",
        },
      ],
    },
    {
      id: "seventeen",
      heading: "What the current plugin added",
      body: [
        "The plugin used to have two rules. Its current recommended config has seventeen, and most of the new ones come from the React Compiler's own analysis — the same engine from module 9, run as a linter instead of as a build step.",
        "That is a real change in what a linter can tell you. The old rules were syntactic: *is this call inside an `if`?* The new ones are semantic: *does this component mutate something it does not own?*",
      ],
      examples: [
        {
          id: "rule-list",
          title: "The recommended set",
          lang: "bash",
          code: `react-hooks/rules-of-hooks              error
react-hooks/exhaustive-deps             warn
react-hooks/static-components           error
react-hooks/use-memo                    error
react-hooks/void-use-memo               error
react-hooks/preserve-manual-memoization error
react-hooks/incompatible-library        warn
react-hooks/immutability                error
react-hooks/globals                     error
react-hooks/refs                        error
react-hooks/set-state-in-effect         error
react-hooks/error-boundaries            error
react-hooks/purity                      error
react-hooks/set-state-in-render         error
react-hooks/unsupported-syntax          warn
react-hooks/config                      error
react-hooks/gating                      error`,
          explanation:
            "Read that list against the rest of this track and it is a summary of it. `purity` and `immutability` are module 11's Strict Mode argument, checked statically. `refs` is \"do not read `ref.current` during render\". `set-state-in-effect` is module 7's \"you probably do not need an effect\". `preserve-manual-memoization` protects a `useMemo` you wrote deliberately from being discarded. Turning this config on is the closest thing to having the last six modules reviewed automatically.",
          requires: "eslint-plugin-react-hooks (this is its recommended config, read from the package)",
        },
        {
          id: "refs-error",
          title: "One of the new ones, reporting",
          lang: "bash",
          code: `error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be
accessed outside of render, such as in event handlers or effects. Accessing a
ref value (the \`current\` property) during render can cause your component not
to update as expected.

  12 |   /* Reading a ref during render. */
> 13 |   const width = ref.current?.offsetWidth ?? 0;
     |                 ^^^^^^^^^^^ Cannot access ref value during render
                                                          react-hooks/refs`,
          explanation:
            "Note the shape of the message: a rule name, an explanation of *why* rather than only *what*, and the offending expression underlined. These are compiler diagnostics wearing a linter's clothes, which is why they are longer and more useful than a typical lint error.",
          requires: "eslint (the output is its report, not a program's)",
        },
      ],
    },
    {
      id: "exhaustive-deps",
      heading: "Arguing with exhaustive-deps",
      body: [
        "The rule is right about the code far more often than the developer is. It is a warning rather than an error only because there is a small set of legitimate exceptions — and \"I did not want this to run again\" is not one of them.",
        "When it asks for a dependency you do not want, the honest question is not *how do I silence this* but *why does my effect close over a value it does not want to react to?* There are four real answers.",
        "**The value should be a dependency.** By far the most common. The effect really does need to re-run, and omitting it is a stale-closure bug waiting for the day the value changes.",
        "**The function should move inside the effect.** A function defined in the component body is a new identity every render, so listing it re-runs the effect constantly. If it is only used there, define it there.",
        "**The function should be wrapped in `useCallback`**, or moved to module scope, if it genuinely is shared.",
        "**It should not be an effect.** Something that must happen once, in response to an action, belongs in the handler that caused it — module 7's argument, and the case where people most often suppress the warning.",
        "If, after all four, you still need to suppress: suppress the single line, and write a comment saying why. A bare disable is a note to the next person that this effect was not understood.",
      ],
      examples: [
        {
          id: "the-four",
          title: "The same warning, four different fixes",
          lang: "tsx",
          code: `/* The warning: missing dependency 'roomId'. */
useEffect(() => {
  connect(roomId);
}, []);

/* 1. It really is a dependency. Reconnect when the room changes. */
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.close();
}, [roomId]);

/* 2. The function was the problem: define it inside. */
useEffect(() => {
  const format = (n: number) => n.toFixed(precision);
  setLabel(format(value));
}, [value, precision]);

/* 3. Genuinely shared, so stabilise it once. */
const format = useCallback((n: number) => n.toFixed(precision), [precision]);
useEffect(() => { setLabel(format(value)); }, [value, format]);

/* 4. Not an effect at all. This runs once per checkout, not once per mount. */
function handleCheckout() {
  analytics.track("checkout_started", { cart });
  startCheckout(cart);
}`,
          explanation:
            "Every one of these is a change to the effect rather than to the lint configuration. That is the pattern: the rule is a design review, and the fix is usually smaller than the argument about whether to suppress it.",
        },
      ],
    },
    {
      id: "the-rest",
      heading: "The rest of the setup, kept short",
      body: [
        "**`typescript-eslint`.** The parser is required for TypeScript. Of its rules, `no-floating-promises` is the one that earns its keep in React, because an un-awaited promise in a handler is a silent failure — and it needs type information, so it needs the type-aware config.",
        "**`eslint-plugin-jsx-a11y`.** Catches a genuine class of bug at zero cost: an image with no alt, a click handler on a div, a label pointing at nothing. Module 14's subject, enforced.",
        "**Prettier, and nothing about formatting in ESLint.** Two tools, two jobs. Formatting rules in a linter are slow and produce conflicts; `eslint-config-prettier` turns them all off in one line.",
        "**What to skip.** `eslint-plugin-react`'s stylistic half — `jsx-sort-props`, `no-multi-comp`, ordering rules. They generate noise, teams tune them for a week, and none of them has ever prevented a bug.",
        "And run it in CI. A lint rule that only fires in an editor is a rule half the team has configured differently.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is eslint-plugin-react-hooks not optional?",
      answer:
        "Because it enforces something the runtime depends on rather than a style preference. Hook state is stored in a per-component list matched by call order, so a hook inside a condition shifts every later hook onto the wrong slot — and the symptom is an intermittent wrong value rather than a crash. That is not reliably catchable in review and is caught by a linter every time.",
    },
    {
      question: "Why must components and hooks be named a particular way?",
      answer:
        "Because the linter identifies them by name — there is no other signal available statically. A capital letter means component, a `use` prefix means hook, and a function that is neither may not contain hooks. So `getInitialState` cannot call `useState` and `useInitialState` can, and the plugin's error says exactly this when you get it wrong.",
    },
    {
      question: "What did the recent versions of the plugin add?",
      answer:
        "Fifteen more rules, most of them backed by the React Compiler's analysis — so the checks moved from syntactic to semantic. `purity` and `immutability` check that a render does not mutate what it does not own, `refs` catches reading `ref.current` during render, `set-state-in-effect` catches the derived-state-in-an-effect pattern, and `preserve-manual-memoization` stops a deliberate `useMemo` being discarded. Turning the recommended config on gets you most of a React code review automatically.",
    },
    {
      question: "What do you do when exhaustive-deps asks for a dependency you do not want?",
      answer:
        "Ask why the effect closes over a value it does not want to react to, because that is nearly always the real bug. Four fixes cover it: add the dependency, because it usually should re-run; move the function inside the effect if it is only used there; stabilise it with `useCallback` or module scope if it is genuinely shared; or realise it should not be an effect at all and move it into the handler. Suppressing is a last resort, on one line, with a comment saying why.",
    },
  ],
  takeaways: [
    "The hooks plugin enforces runtime requirements, not preferences",
    "Flat config takes `plugins` as an object; the array form is the old shape",
    "The linter identifies components and hooks by name — capitalisation and `use` are load-bearing",
    "The current recommended config is seventeen rules, most from the React Compiler's analysis",
    "`purity`, `immutability`, `refs` and `set-state-in-effect` check semantics, not syntax",
    "`exhaustive-deps` is usually right; suppress one line with a reason or not at all",
    "Four real fixes: add the dep, inline the function, stabilise it, or stop using an effect",
    "Add `no-floating-promises` and `jsx-a11y`; leave formatting to Prettier",
    "Run it in CI, or it is a rule everyone has configured differently",
  ],
  status: "available",
};
