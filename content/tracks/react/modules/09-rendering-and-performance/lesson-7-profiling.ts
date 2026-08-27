import type { Lesson } from "@/content/types";

export const profilingLesson: Lesson = {
  id: "react-profiling",
  slug: "profiling",
  moduleSlug: "rendering-and-performance",
  title: "Profiling: Finding Out Instead of Guessing",
  summary:
    "Where the time actually goes. Reading a flame graph, the setting that tells you why each component rendered, and the two profilers you need because they measure different things.",
  estimatedMinutes: 26,
  objectives: [
    "Record and read a React Profiler flame graph",
    "Turn on \"why did this render?\" and act on the answer",
    "Say what the browser's performance profiler shows that React's does not",
    "Profile a production build and know why that matters",
    "Follow a measure-fix-measure loop rather than optimising on suspicion",
  ],
  sections: [
    {
      id: "two-profilers",
      heading: "Two profilers, two questions",
      body: [
        "**React DevTools' Profiler** answers *\"which components rendered, why, and for how long?\"* It knows about your component tree and nothing about the browser.",
        "**The browser's Performance panel** answers *\"where did the time in this frame go?\"* It sees everything — script, style, layout, paint, network, garbage collection — and knows nothing about React components.",
        "You need both because the answer is often in the other one. A component that the React Profiler says took 40ms may have spent 38 of them in a layout the browser was forced to recompute, which React cannot see. And a browser profile full of scripting time tells you nothing about which component to open.",
        "The order that works: browser profile first, to find out whether the problem is even rendering. Then React's, to find out which component.",
      ],
    },
    {
      id: "flame-graph",
      heading: "Reading the flame graph",
      body: [
        "Install the React Developer Tools extension, open the **Profiler** tab, press record, do the slow thing, stop.",
        "You get one bar per **commit** — one for each time React applied changes to the DOM. Click a commit and you get its flame graph.",
        "**Width is time.** A wide bar took long; a narrow one did not. Width is what you are looking for, and nothing else.",
        "**Grey means it did not render.** A component that was skipped — memoised, or in a subtree React never reached — is grey. Grey is good.",
        "**Nesting is the tree**, not a call stack. A child's bar sits under its parent's, and the parent's width includes the children's.",
        "The one thing to look for: **a wide bar you did not expect**. Not many bars — many narrow bars are fine, as lesson 2 established. One wide bar is where the time is.",
      ],
      pitfalls: [
        {
          title: "Profile a production build",
          body: "Development React does far more work: Strict Mode renders everything twice, warnings are checked, and the code is unminified. Numbers from a development build are wrong by a factor that varies per component, so they will point you at the wrong one. Profiling a production build needs a build with profiling enabled — `react-dom/profiling`, which every framework has a documented route to — because the ordinary production build strips the timing hooks entirely.",
        },
        {
          title: "Record the interaction, not the page",
          body: "Start recording immediately before the slow interaction and stop immediately after. A thirty-second recording containing one slow click is thirty seconds of commits to scroll through, and the commit you want is not marked.",
        },
      ],
    },
    {
      id: "why-did-this-render",
      heading: "\"Why did this render?\"",
      body: [
        "The single most useful setting in the profiler, and it is off by default. Profiler tab → the gear icon → General → **Record why each component rendered while profiling**.",
        "Select any component in a commit and it now tells you which of lesson 1's three causes fired — and when it is props, *which prop* changed.",
        "That last part is what turns a vague \"it re-renders too much\" into a specific fix. \"Props changed: `style`\" means an inline object. \"Props changed: `onSelect`\" means an unstabilised callback. \"Hook 3 changed\" means state or a context, and you can count the hooks to find which.",
        "It costs recording overhead, which is why it is off. Turn it on when you are investigating and off when you are measuring durations.",
      ],
      pitfalls: [
        {
          title: "The ranked chart is the shortcut",
          body: "Next to the flame graph is a ranked view: every component in the commit, sorted by time spent. When you do not already have a suspect, start there — it puts the answer at the top instead of asking you to spot a wide bar in a tree.",
        },
      ],
    },
    {
      id: "browser-profiler",
      heading: "The browser's profiler",
      body: [
        "Chrome DevTools → Performance → record. What to look at, in order:",
        "**Long tasks.** Anything over 50ms is flagged with a red corner. A long task blocks everything, including input.",
        "**The breakdown.** Scripting, rendering, painting. Mostly scripting points at React or at your own code; mostly rendering points at layout, which usually means CSS or a measurement loop.",
        "**Forced reflow warnings.** The panel names them explicitly. This is the layout thrash from lesson 2 — a read of a layout property after a write — and it is usually one line in one effect.",
        "**Interaction to Next Paint.** How long after a click something was drawn. This is the metric users experience, and the one to hold yourself to: under 200ms is good.",
        "There is also the **React Profiler API** — a `<Profiler>` component with an `onRender` callback — for measuring in production and sending the numbers somewhere. Useful for catching a regression that only appears on real data; not the tool for an investigation.",
      ],
      examples: [
        {
          id: "profiler-api",
          title: "Measuring in production",
          lang: "tsx",
          code: `import { Profiler } from "react";

/* Fires on every commit inside the boundary. Keep the callback cheap and
   sample rather than reporting everything, or the measurement becomes the
   performance problem. */
function onRender(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,   // this commit, for this subtree
  baseDuration: number,     // what it would cost with no memoisation at all
) {
  if (actualDuration > 50) {
    analytics.timing("react.commit", actualDuration, { id, phase });
  }
  void baseDuration;
}

<Profiler id="Checkout" onRender={onRender}>
  <CheckoutPage />
</Profiler>;`,
          explanation:
            "`baseDuration` against `actualDuration` is the one number that says whether your memoisation is doing anything: it is what the subtree would have cost with nothing memoised. If the two are equal on every commit, every memo in that subtree is missing.",
        },
      ],
    },
    {
      id: "the-loop",
      heading: "Measure, fix, measure",
      body: [
        "**1. Reproduce, with realistic data.** A list of ten behaves nothing like a list of ten thousand, and most performance bugs only exist at the second size.",
        "**2. Measure, and write the number down.** \"Clicking the filter takes 340ms\" is a fact you can test against. \"It feels slow\" is not.",
        "**3. Find the biggest single cost.** The widest bar, the longest task. Not the most frequent — the largest.",
        "**4. Change one thing.**",
        "**5. Measure again.** If the number did not move, **revert the change.** This is the step people skip, and it is why codebases accumulate memoisation that never helped: nobody checked, and nobody can now tell which wrappers are load-bearing.",
        "**6. Repeat until the number is acceptable, then stop.** There is always more to optimise and a point past which nobody can tell.",
      ],
      pitfalls: [
        {
          title: "The fix is often not a React fix",
          body: "Profiles regularly point at something that has nothing to do with rendering: an image that is 4MB, a request waterfall, a date library parsing a thousand strings, a CSS selector forcing a full-page relayout. Measuring first is what stops you spending a day on `memo` for a problem that was a 4MB image.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you find out why a React app is slow?",
      answer:
        "Two profilers, in order. The browser's Performance panel first, to find the long tasks and see whether the time is even in scripting — often it is layout, network or an image. Then React DevTools' Profiler to find which component, using the ranked chart to put the expensive one at the top. Width is time; grey means skipped; and \"record why each component rendered\" turns a vague complaint into a named prop.",
    },
    {
      question: "What does the \"why did this render\" setting tell you?",
      answer:
        "For each component in a commit, which of the three causes fired — and for a prop change, which prop. That is the difference between \"this re-renders too much\" and \"the `style` prop is an inline object\". It is off by default because it adds recording overhead, so turn it on for investigation and off when measuring durations.",
    },
    {
      question: "Why must you profile a production build?",
      answer:
        "Development React renders everything twice under Strict Mode, checks warnings and runs unminified, and the inflation differs per component — so development numbers point at the wrong component, not just at wrong values. It needs a profiling-enabled production build, because the ordinary one strips the timing hooks entirely.",
    },
    {
      question: "What do you do if an optimisation does not change the number?",
      answer:
        "Revert it. An optimisation that did not measurably help is code, indirection and a dependency array to keep correct, for nothing — and once several of them accumulate nobody can tell which memo is load-bearing. Measure, change one thing, measure again, and keep only the changes that moved the number.",
    },
  ],
  takeaways: [
    "Two profilers: React's says which component and why, the browser's says where the frame went",
    "Browser first — the problem is often not rendering at all",
    "In the flame graph, width is time and grey means skipped; look for one wide bar, not many bars",
    "Turn on \"record why each component rendered\" — it names the prop that changed",
    "The ranked chart puts the expensive component at the top when you have no suspect",
    "Profile a production build; development numbers mislead per component, not just in scale",
    "`<Profiler>`'s `baseDuration` against `actualDuration` says whether memoisation is doing anything",
    "Measure, change one thing, measure — and revert anything that did not move the number",
  ],
  status: "available",
};
