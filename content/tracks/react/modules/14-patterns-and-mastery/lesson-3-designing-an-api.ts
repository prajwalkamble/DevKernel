import type { Lesson } from "@/content/types";

export const designingAnApiLesson: Lesson = {
  id: "react-designing-a-component-api",
  slug: "designing-a-component-api",
  moduleSlug: "patterns-and-mastery",
  title: "Designing a Component API Other People Enjoy Using",
  summary:
    "The decisions that make a shared component pleasant or exhausting: controlled against uncontrolled — supporting both, demonstrated — what to name things, which props not to add, and why a boolean is usually a union in disguise.",
  estimatedMinutes: 30,
  objectives: [
    "Support controlled and uncontrolled use from one component",
    "Choose between a boolean and a union",
    "Decide what to expose and what to keep inside",
    "Name props so callers guess right",
    "Change an API without breaking every caller",
  ],
  sections: [
    {
      id: "controlled",
      heading: "Controlled, uncontrolled, or both",
      visual: {
        id: "api-controlled-visual",
        kind: "react-state",
        algorithm: "controlled-input",
        title: "Who owns the value",
      },
      body: [
        "The first real decision, and the one people get wrong by only picking one.",
        "**Uncontrolled** — the component owns the value. `<Toggle defaultOn />`. Pleasant to use, and useless the moment the parent needs to reset it, read it, or drive it from a URL.",
        "**Controlled** — the parent owns the value. `<Toggle on={on} onChange={setOn} />`. Complete, and tedious for the ninety percent of uses that only wanted a toggle.",
        "**Both** — the component looks at whether the prop is `undefined` and behaves accordingly. That is what every native input does and what every good library does, and it is about eight lines.",
      ],
      examples: [
        {
          id: "controllable",
          title: "One component, both modes, proved",
          lang: "jsx",
          code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

/* One component, both modes. The prop being undefined is what decides. */
function useControllable(controlled, fallback) {
  const [internal, setInternal] = useState(fallback);
  const isControlled = controlled !== undefined;
  return [isControlled ? controlled : internal, setInternal, isControlled];
}

function Toggle({ on, defaultOn = false, onChange }) {
  const [value, setInternal] = useControllable(on, defaultOn);
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => { setInternal(!value); onChange?.(!value); }}
    >
      {value ? "on" : "off"}
    </button>
  );
}

async function drive(label, tree) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(tree); });
  const button = () => container.querySelector("button");
  console.log(\`\${label} start "\${button().textContent}"\`);
  await act(async () => { button().click(); });
  console.log(\`\${label} after a click "\${button().textContent}"\`);
}

/* Uncontrolled: the component owns the value. */
await drive("uncontrolled      |", <Toggle defaultOn={false} />);

/* Controlled, and the parent refuses to change it — the toggle must not
   move on its own, which is the whole contract of a controlled input. */
await drive("controlled, pinned|", <Toggle on={false} onChange={() => {}} />);

/* Controlled, and the parent stores the value. */
function Parent() {
  const [on, setOn] = useState(false);
  return <Toggle on={on} onChange={setOn} />;
}
await drive("controlled, wired |", <Parent />);`,
          output: `uncontrolled      | start "off"
uncontrolled      | after a click "on"
controlled, pinned| start "off"
controlled, pinned| after a click "off"
controlled, wired | start "off"
controlled, wired | after a click "on"`,
          explanation:
            "The middle pair is the one that proves the contract. A controlled component whose parent ignores `onChange` **must not move**, because the parent is the source of truth and the parent said no. A component that updates its own state anyway looks like it works and then disagrees with the parent the first time the parent has an opinion.\n\nThe `onChange?.(!value)` call passing the *next* value rather than an event is the other decision worth copying: the caller wants the value, and making them dig it out of `event.target.checked` is a native-input wart there is no reason to reproduce.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useState, act } from "react";
import { createRoot } from "react-dom/client";

/* One component, both modes. The prop being undefined is what decides. */
function useControllable<T>(controlled: T | undefined, fallback: T) {
  const [internal, setInternal] = useState(fallback);
  const isControlled = controlled !== undefined;
  return [isControlled ? controlled : internal, setInternal, isControlled] as const;
}

function Toggle({ on, defaultOn = false, onChange }: {
  on?: boolean;
  defaultOn?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [value, setInternal] = useControllable(on, defaultOn);
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => { setInternal(!value); onChange?.(!value); }}
    >
      {value ? "on" : "off"}
    </button>
  );
}

async function drive(label: string, tree: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(tree); });
  const button = () => container.querySelector("button")!;
  console.log(\`\${label} start "\${button().textContent}"\`);
  await act(async () => { button().click(); });
  console.log(\`\${label} after a click "\${button().textContent}"\`);
}

/* Uncontrolled: the component owns the value. */
await drive("uncontrolled      |", <Toggle defaultOn={false} />);

/* Controlled, and the parent refuses to change it — the toggle must not
   move on its own, which is the whole contract of a controlled input. */
await drive("controlled, pinned|", <Toggle on={false} onChange={() => {}} />);

/* Controlled, and the parent stores the value. */
function Parent() {
  const [on, setOn] = useState(false);
  return <Toggle on={on} onChange={setOn} />;
}
await drive("controlled, wired |", <Parent />);`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Switching modes mid-life is a bug worth warning about",
          body: "A component that starts with `on={undefined}` and later receives a boolean has changed which state is real, and React warns about exactly this for native inputs. A dev-only `useEffect` that compares `isControlled` against its first value and logs turns a confusing behaviour into a sentence.",
        },
      ],
    },
    {
      id: "booleans",
      heading: "A boolean is usually a union in disguise",
      body: [
        "`isPrimary` is fine until there is a secondary. Then `isSecondary`, and now `isPrimary isSecondary` is representable and meaningless — and the component has a branch deciding which of two contradictory props wins.",
        "`variant=\"primary\" | \"secondary\" | \"ghost\"` cannot be contradictory, adds a variant without adding a prop, and reads better at the call site.",
        "The rule: **a boolean is right when the thing is genuinely on or off** — `disabled`, `required`, `open`. It is wrong when it is one choice from a set, and almost everything visual is one choice from a set.",
      ],
      examples: [
        {
          id: "boolean-union",
          title: "The same component, before and after",
          lang: "tsx",
          code: `/* ✗ Four booleans, sixteen combinations, three of them legal. */
<Button isPrimary isLarge isLoading isFullWidth />

/* ✓ Two unions and two booleans that really are booleans. */
<Button variant="primary" size="lg" loading fullWidth />

/* And the type now describes exactly what exists. */
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;      // genuinely a state
  fullWidth?: boolean;    // genuinely on or off
}`,
          explanation:
            "The second version also survives contact with a design system: adding a `danger` variant is one entry in a union, while adding `isDanger` is a fifth boolean and another branch in the class-name logic.",
        },
      ],
    },
    {
      id: "surface",
      heading: "Deciding what to expose",
      body: [
        "Every prop is a promise, and you will keep it for as long as the component exists.",
        "**Start with less.** Adding a prop is easy; removing one means finding every caller. A component with four props that people occasionally wrap is in better shape than one with twenty that nobody can read.",
        "**Take a `className` and spread the rest.** `ComponentProps<\"button\">` from module 13, so a caller can pass `aria-describedby`, `data-testid`, `form`, or anything else, without you having anticipated it. This one decision prevents most future prop requests.",
        "**Expose a `ReactNode`, not a shape.** `icon?: ReactNode` beats `iconName?: string`, because the second means owning an icon registry.",
        "**Do not expose internals.** `inputRef`, `wrapperProps`, `containerClassName` — each is a commitment to a DOM structure you can no longer change.",
        "**Do not add a prop for one caller.** That is what composition is for, and a `children` slot usually already covers it.",
      ],
      pitfalls: [
        {
          title: "The prop that means \"do it differently for me\"",
          body: "`renderCustomHeader`, `overrideStyles`, `legacyMode`. Each one is a branch that lives forever and is exercised by exactly one caller who will have moved on. The right answer is nearly always to let that caller compose the pieces themselves — which is the whole argument for the previous lesson's compound components.",
        },
      ],
    },
    {
      id: "naming",
      heading: "Naming",
      body: [
        "**Match the platform.** `onChange`, `onClick`, `disabled`, `value`, `placeholder`. If a native element has a name for the concept, use that name — a caller already knows it, and inventing `handleChange` or `isDisabled` costs them a lookup.",
        "**`on…` for callbacks, and name the event, not the reaction.** `onSelect` rather than `onSelectHandler`, and `onOpenChange` rather than `onClose` for something that also opens.",
        "**Pass the value, not the event.** `onChange={(value: string) => …}`. The caller wants the value nine times out of ten, and the tenth can be served by a second argument.",
        "**`default…` for the uncontrolled initial value.** `defaultOpen`, `defaultValue` — matching React's own convention for native inputs, and signalling to a reader that it is read once.",
        "**Say what, not how.** `variant=\"danger\"` outlives `color=\"red\"`, which is wrong the moment the brand changes.",
      ],
    },
    {
      id: "changing",
      heading: "Changing an API you have shipped",
      body: [
        "Two moves cover almost everything.",
        "**Add, do not change.** A new optional prop with a default that preserves the old behaviour breaks nobody. Two props that mean nearly the same thing is a smaller cost than a broken build.",
        "**Deprecate loudly, then remove.** Keep the old prop, make it forward to the new one, and warn in development. Remove it a release later, once the warning has been seen.",
      ],
      examples: [
        {
          id: "deprecating",
          title: "A rename nobody has to do at once",
          lang: "jsx",
          code: `function Dialog({ open, isOpen, ...rest }) {
  if (process.env.NODE_ENV !== "production" && isOpen !== undefined) {
    console.warn("<Dialog isOpen> is deprecated; use <Dialog open>. It will be removed in v3.");
  }
  /* The new name wins if both are given, so a half-migrated call site
     behaves the way its author most recently intended. */
  const isDialogOpen = open ?? isOpen ?? false;
  // …
}`,
          explanation:
            "Three things doing the work: the `@deprecated` tag, which makes an editor strike the prop out at every call site; the runtime warning, for people who do not read release notes; and the version in the message, so \"when do I have to do this\" has an answer.",
          alternates: [
            {
              lang: "tsx",
              code: `interface DialogProps {
  open?: boolean;
  /** @deprecated Use \`open\`. Removed in v3. */
  isOpen?: boolean;
}

function Dialog({ open, isOpen, ...rest }: DialogProps) {
  if (process.env.NODE_ENV !== "production" && isOpen !== undefined) {
    console.warn("<Dialog isOpen> is deprecated; use <Dialog open>. It will be removed in v3.");
  }
  /* The new name wins if both are given, so a half-migrated call site
     behaves the way its author most recently intended. */
  const isDialogOpen = open ?? isOpen ?? false;
  // …
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "A component used in one place has no API",
          body: "None of this applies to a component with a single caller. Give it exactly the props that caller needs, and design the API when the second one arrives — which is also the moment you learn what actually varies, rather than guessing.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a controlled and an uncontrolled component, and which should a library offer?",
      answer:
        "Uncontrolled means the component owns the value; controlled means the parent does and passes it back in. A shared component should support both, deciding by whether the value prop is `undefined` — which is what native inputs do and what it takes about eight lines to implement. Uncontrolled alone breaks as soon as a parent needs to reset or read the value; controlled alone is tedious for the ninety percent of uses that just wanted a toggle.",
    },
    {
      question: "What must a controlled component do when the parent ignores its onChange?",
      answer:
        "Nothing. The parent is the source of truth, and it declined to change the value, so the component must not move. A component that updates its own state anyway appears to work and then disagrees with the parent the moment the parent has an opinion — which is exactly the bug that makes people distrust a component library.",
    },
    {
      question: "When should a prop be a boolean and when a union?",
      answer:
        "A boolean when the thing is genuinely on or off — `disabled`, `open`, `loading`. A union when it is one choice from a set, which almost everything visual is. Four booleans describe sixteen combinations of which three are legal, and the component then needs a branch deciding which contradictory prop wins; a union cannot be contradictory and adds a variant without adding a prop.",
    },
    {
      question: "How do you change a shipped component's API?",
      answer:
        "Add rather than change: a new optional prop with a default that preserves the old behaviour breaks nobody, and two overlapping props cost less than a broken build. When a rename is unavoidable, keep the old prop forwarding to the new one, mark it `@deprecated` so editors strike it through, warn in development with the version it will be removed in, and remove it a release later.",
    },
  ],
  takeaways: [
    "Support controlled and uncontrolled from one component, deciding on `undefined`",
    "A controlled component whose parent ignores `onChange` must not change",
    "Pass the value to `onChange`, not the event",
    "A boolean is right for on/off and wrong for one-of-a-set",
    "Take `className` and spread the rest — it prevents most future prop requests",
    "`ReactNode` rather than a shape, so you do not own a registry",
    "Never expose internals like `wrapperProps`; they freeze your DOM structure",
    "Match the platform's names; say what, not how",
    "`default…` for an uncontrolled initial value, matching React's own convention",
    "Add rather than change; deprecate with a tag, a warning and a version",
    "A component with one caller has no API yet — wait for the second",
  ],
  status: "available",
};
