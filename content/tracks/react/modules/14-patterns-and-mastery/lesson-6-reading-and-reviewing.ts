import type { Lesson } from "@/content/types";

export const readingAndReviewingLesson: Lesson = {
  id: "react-reading-and-reviewing",
  slug: "reading-and-reviewing-react",
  moduleSlug: "patterns-and-mastery",
  title: "Reading Unfamiliar React & Reviewing It Well",
  summary:
    "How to get oriented in a codebase you have never seen, the order to read a component in, the small number of things actually worth flagging in review, and the much longer list that is not worth an argument.",
  estimatedMinutes: 27,
  objectives: [
    "Orient yourself in an unfamiliar React codebase quickly",
    "Read a component in an order that answers questions early",
    "Review for the bugs that are specific to React",
    "Say what is not worth a review comment",
    "Give feedback that gets acted on",
  ],
  sections: [
    {
      id: "orienting",
      heading: "The first twenty minutes in a new codebase",
      body: [
        "Read four things, in this order, before opening a single component.",
        "**`package.json`.** It tells you the whole architecture in thirty seconds. `next` means a server and a router you did not choose. `react-router` means client-side and probably a Vite build. `@tanstack/react-query` or `swr` means data has an owner and you must not add a `useEffect` fetch. `zustand`, `@reduxjs/toolkit` or `jotai` means global state has a home. `tailwindcss` against `styled-components` tells you where to put a style. The absence of a testing library tells you something too.",
        "**The entry point.** `main.tsx` or `app/layout.tsx`. Every provider the app has is in it, in order, and that list is the set of things any component may assume exists.",
        "**The routes.** A route file or a router config is the app's table of contents. It tells you what screens exist, which is what a feature request is really about.",
        "**One complete feature, end to end.** Pick a small screen and follow it: route → page → components → hooks → data. One vertical slice teaches you more than twenty files read horizontally, because it shows you the conventions rather than the code.",
      ],
      pitfalls: [
        {
          title: "The folder structure tells you what to expect",
          body: "Module 3's two layouts, read backwards. `components/`, `hooks/`, `utils/` at the top level means grouping by kind, so a feature's pieces are scattered and you will be opening four folders to change one thing. `features/cart/` means grouping by feature, so everything for a change is in one place. Neither is wrong; knowing which one you are in decides where you look first.",
        },
      ],
    },
    {
      id: "reading-a-component",
      heading: "Reading one component",
      body: [
        "Not top to bottom. In this order, because it answers the useful questions soonest.",
        "**1. The props interface.** What does it need, and what does it promise? This is the contract, and it is usually the fastest description of the component that exists.",
        "**2. The returned JSX.** What does it produce? Read the shape, not the class names.",
        "**3. The state.** How many pieces, and is any of it derivable from the rest? Module 4's question, and the most common structural problem you will find.",
        "**4. The effects.** What outside thing is each one synchronising with? An effect with no external system is module 7's smell, and the most common bug you will find.",
        "**5. Everything else.** Handlers, memos, helpers. By now you know what the component is, so these read as details rather than as mysteries.",
        "This order matters most for a large component. If you start at line 1 you spend the first hundred lines not knowing what you are looking at.",
      ],
    },
    {
      id: "review",
      heading: "What is worth flagging",
      body: [
        "The list is short, and everything on it is a bug rather than a preference.",
        "**A missing effect cleanup.** A subscription, a timer, a listener, a fetch with no `ignore` flag. This is the leak that shows up as a memory graph three months later.",
        "**A suppressed `exhaustive-deps`.** Not always wrong, always worth a question. \"What is this closing over that it does not want to react to?\" is the question, and there is usually a real answer that changes the effect.",
        "**A `key={index}` on a reorderable or filterable list.** Module 6. If the list can only grow at the end it is fine; if it can be sorted, filtered or spliced, the state is going to attach to the wrong row.",
        "**State that is derived.** Two pieces of state where one is computed from the other, kept in sync by an effect. This one is worth flagging every time, because it is always a bug — just not yet.",
        "**A `<div>` with an `onClick`.** Unreachable by keyboard, invisible to a screen reader.",
        "**A fetch with no cleanup or cancellation.** Module 7's race condition.",
        "**Something that must happen once, in an effect.** An analytics event, a POST, a toast. It belongs in the handler that caused it.",
        "**A value crossing a boundary it should not.** A secret in a `VITE_` variable. A database import in a file under `\"use client\"`. A function passed from a Server Component.",
      ],
    },
    {
      id: "not-worth-it",
      heading: "What is not worth a comment",
      body: [
        "This half of the lesson matters as much as the other, because a review full of preferences is a review whose real findings get lost.",
        "**Formatting.** Prettier's job. If it is a recurring argument, the fix is a config change, once.",
        "**`function` against `const`.** Two conventions, both fine. Worth a project decision, never worth a thread.",
        "**A missing `memo`.** Module 9: it is not free, and adding one without a measurement is guessing. \"Did you measure?\" is a reasonable question; \"add memo here\" is not a reasonable instruction.",
        "**A component being long.** A hundred lines that do one thing is fine. Splitting for length produces six files used once each, which is harder to read, not easier.",
        "**An architecture you would have done differently.** If the code works, is tested and is comprehensible, a different valid approach is not a review comment. Bring it to a design conversation instead, where it can be decided rather than negotiated one pull request at a time.",
        "**Anything you would not fix yourself.** Good filter. If it is not worth your ten minutes, it is not worth theirs.",
      ],
    },
    {
      id: "how-to-say-it",
      heading: "How to say it",
      body: [
        "**Say what breaks.** \"This effect subscribes and never unsubscribes, so navigating away leaves the socket open\" is actionable. \"Missing cleanup\" is a hint you are making them decode.",
        "**Separate the blocking from the optional.** A convention like *nit:* for the non-blocking ones costs nothing and stops a five-comment review reading as five objections.",
        "**Ask when you do not know.** \"What happens if this promise rejects?\" is better than an assertion that turns out to be wrong. It is also how you find out that they already handled it two files away.",
        "**Say what is good.** Specifically. A reviewer who only ever comments on problems trains people to dread review, and the useful signal — *this is the pattern we want more of* — never gets sent.",
        "**Approve with comments more often than you think.** Blocking a pull request over something that can be a follow-up is expensive for everyone, and the thing you were worried about is usually fixed faster after it ships than before.",
      ],
    },
    {
      id: "the-questions",
      heading: "The five questions",
      body: [
        "A checklist that fits in your head, for any React change.",
        "**Does every effect clean up after itself, and does it have an external system to synchronise with at all?**",
        "**Is any state derivable from other state?**",
        "**Do the lists have stable keys, and can they be reordered?**",
        "**Can a keyboard reach every interactive thing, and is every input labelled?**",
        "**What happens when the network is slow, and when it fails?**",
        "Those five find most of what is actually wrong with most React changes. Everything else in this track is either an answer to one of them or a way of not needing to ask.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you get oriented in an unfamiliar React codebase?",
      answer:
        "`package.json` first — it tells you the architecture in thirty seconds: which router, whether there is a server, whether data has an owner, where global state lives, how styling works. Then the entry point, because every provider the app has is listed there in order. Then the routes, which are the table of contents. Then one complete feature end to end, because a vertical slice teaches you the conventions where twenty files read horizontally teach you none.",
    },
    {
      question: "In what order do you read a component?",
      answer:
        "Props first — that is the contract, and the fastest description of the component that exists. Then the returned JSX, to see what it produces. Then the state, asking whether any of it is derivable. Then the effects, asking what external system each synchronises with. Everything else last. Starting at line one means spending the first hundred lines not knowing what you are looking at.",
    },
    {
      question: "What do you look for in a React code review?",
      answer:
        "Bugs specific to React: an effect with no cleanup, a suppressed `exhaustive-deps`, `key={index}` on a list that can be reordered, state derived from other state and kept in sync by an effect, a `div` with an `onClick`, a fetch with no cancellation, something that should be in a handler sitting in an effect, and a value crossing a boundary it should not. Everything on that list is a defect rather than a preference.",
    },
    {
      question: "What do you deliberately not comment on?",
      answer:
        "Formatting, which is the formatter's job. `function` against `const`, which is a project decision and not a thread. A missing `memo`, because adding one without a measurement is guessing. A component being long, when it does one thing. And an architecture you would have done differently, if the code works and is comprehensible — that belongs in a design conversation, not negotiated one pull request at a time. A review full of preferences buries its real findings.",
    },
  ],
  takeaways: [
    "`package.json`, the entry point, the routes, then one feature end to end",
    "The folder layout tells you whether a change is in one folder or four",
    "Read a component props-first, then JSX, then state, then effects",
    "Flag: missing cleanup, suppressed deps, index keys, derived state, div-onClick, uncancelled fetch",
    "Something that must happen once per action belongs in the handler",
    "Do not flag formatting, `function` against `const`, a missing memo, or length alone",
    "Do not relitigate architecture in a pull request",
    "Say what breaks, mark the nits, ask when unsure, and name what is good",
    "Five questions: cleanup, derived state, keys, keyboard and labels, failure",
  ],
  status: "available",
};
