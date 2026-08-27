import type { Lesson } from "@/content/types";

export const propDrillingLesson: Lesson = {
  id: "react-prop-drilling",
  slug: "prop-drilling",
  moduleSlug: "context-and-state-architecture",
  title: "Prop Drilling, and When It Is Fine",
  summary:
    "The problem everybody names and few people measure. What drilling actually costs, the three signals that say it has gone too far, and why the first fix is not context.",
  estimatedMinutes: 22,
  objectives: [
    "State precisely what prop drilling costs, and what it does not",
    "Name the three signals that a chain has become a problem",
    "Say why two or three levels is not worth fixing",
    "List the four fixes in the order you should try them",
    "Recognise the drilling that is a symptom of state living in the wrong place",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "What it is, and what it costs",
      body: [
        "Prop drilling is passing a value through components that do not use it, only so that something further down can have it. `Page` has the user, `Header` does not need it, `Menu` does not need it, `Avatar` does — so `user` appears in all four.",
        "It is worth being precise about the cost, because the received wisdom overstates one part of it and misses another.",
        "**It does not cost performance.** Passing a prop is assigning a property on an object. A chain ten deep is ten assignments. If a deep tree re-renders when the value changes, that is React's default cascade — module 9 — and context has exactly the same behaviour. Nobody has ever made an app slow by passing props.",
        "**It costs interface surface.** `Header` now has a `user` prop that means \"something below me wants this\". That is a lie in the type signature: the prop is documented as `Header`'s and it belongs to `Avatar`. Every intermediate component acquires props it does not use, and a component's props are the main thing a reader trusts.",
        "**It costs edits.** Adding one field to `Avatar` means touching four files, none of which is `Avatar`. That is the friction people actually feel, and it is the honest argument.",
      ],
      pitfalls: [
        {
          title: "Two levels is not prop drilling",
          body: "It is passing props, which is the mechanism React is built on. A parent giving a child a value, and that child giving it to its own child, is a chain of two and completely fine. Reaching for context there costs more than it saves: an extra indirection, a provider to set up, and a value whose origin is no longer visible from the call site.",
        },
      ],
    },
    {
      id: "signals",
      heading: "The three signals",
      body: [
        "Not a line count. Three specific things, and one of them is enough.",
        "**Depth past four or five, with nothing in between using it.** The number matters less than the second half: a chain where every layer genuinely uses the value is not drilling at all.",
        "**Breadth.** One value needed by a dozen components in unrelated parts of the tree — the current theme, the signed-in user, the locale. Drilling that means touching most of the tree, and no single chain is the problem; the fan-out is.",
        "**Churn.** The chain changes shape often. Every new field means the same four-file edit, every layout change means re-threading. The drilling is stable, but you are not.",
        "If none of the three applies, leave it. \"It looks like a lot of props\" is not a signal; it is a description.",
      ],
    },
    {
      id: "the-order",
      heading: "The four fixes, in order",
      body: [
        "Try them in this order. Most codebases skip to the third, and the first two would have been better.",
        "**1. Move the state down.** If the value is only used by one branch, it does not belong at the top. State drilled from the root to one leaf is usually state that should have lived at that leaf. This removes the chain entirely and is the fix nobody considers, because the reflex is that state moves *up*.",
        "**2. Compose instead of drill.** Pass the finished element as `children` rather than passing the data through. The owner builds the thing that needs the value, so the intermediate components never see it — and this is the next lesson, because it removes far more drilling than people expect.",
        "**3. Context**, when the value is read widely and changed rarely. That is the shape it suits: theme, locale, the signed-in user, a form's registry. Lesson 3 measures what it costs on update, which is the part that decides whether it fits.",
        "**4. A store**, when the value is read widely *and* changed often. A store lets a component subscribe to a slice, which is the one thing context cannot do — lesson 8.",
      ],
      pitfalls: [
        {
          title: "Drilling is often a symptom, not the disease",
          body: "A long chain frequently means the state is in the wrong place: lifted higher than any two consumers actually needed, usually because it was lifted once and never moved back. Before adding a provider, ask where the nearest common ancestor of the real consumers is. If it is three levels below where the state lives, the fix is fix 1 and there is nothing left to solve.",
        },
        {
          title: "Context does not stop the re-render",
          body: "The most common reason given for reaching for context is that drilling re-renders the tree. It does — and so does context, for everything under the provider. Swapping one for the other changes the ergonomics and not the render count. If re-renders are the actual problem, that is module 9, and the tool is memo or a store with selectors.",
        },
      ],
    },
    {
      id: "when-fine",
      heading: "When to leave it alone",
      body: [
        "**When the chain is short.** Two or three levels, whatever the value.",
        "**When the intermediates genuinely use it.** `Table` passing `sortOrder` to `TableHeader` which passes it to `SortIcon` is three components that all care.",
        "**When it is used once.** A value read by exactly one component at the bottom is a prop, not a context. Context is for many readers; with one reader you have built a global variable with extra steps.",
        "**When the explicitness is the point.** A prop is a visible dependency: the call site shows what a component needs. Context hides that, which is a real cost when you are reading unfamiliar code and trying to work out why a component behaves differently in two places.",
        "The honest summary: prop drilling is a code-organisation smell with a low ceiling on its harm, and the fixes for it have real costs of their own. Fix it when one of the three signals fires, and not because a chain of four props looks untidy.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is prop drilling and what does it actually cost?",
      answer:
        "Passing a value through components that do not use it so something deeper can have it. It costs interface surface — every intermediate component acquires a prop that is documented as its own and is not — and it costs edits, because adding a field means touching every file in the chain. It does not cost performance: passing props is property assignment, and the re-render cascade people blame it for is React's default behaviour, which context shares.",
    },
    {
      question: "When is prop drilling a problem?",
      answer:
        "Three signals, any one of which is enough: depth past four or five levels where the intermediates do not use the value; breadth, where one value is needed across unrelated parts of the tree; and churn, where the chain keeps changing shape so the same multi-file edit keeps recurring. Absent all three it is just passing props, and fixing it costs more than leaving it.",
    },
    {
      question: "What would you try before reaching for context?",
      answer:
        "Moving the state down — a long chain usually means the state was lifted higher than any consumer needed, and the fix removes the chain rather than routing around it. Then composition: pass the finished element as children so the intermediates never see the data. Context comes third, for values read widely and changed rarely, and a store fourth, when the value is also changed often and components need to subscribe to a slice.",
    },
  ],
  takeaways: [
    "Drilling costs interface surface and edits, not performance",
    "Three signals: depth with uninvolved intermediates, breadth across the tree, churn",
    "Two or three levels is passing props, not drilling",
    "Try moving the state down first — a long chain often means it was lifted too far",
    "Then composition, then context for read-widely/change-rarely, then a store",
    "Context does not reduce re-renders; it changes the ergonomics",
    "One reader means a prop, not a context",
  ],
  status: "available",
};
