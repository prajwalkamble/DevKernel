import type { Lesson } from "@/content/types";

export const useLayoutEffectLesson: Lesson = {
  id: "react-uselayouteffect",
  slug: "uselayouteffect",
  moduleSlug: "effects-and-data",
  title: "useLayoutEffect, and the One Case It Is For",
  summary:
    "The effect that blocks the paint. What that buys — no visible flash when you measure and adjust — what it costs, and the four questions that tell you which of the two you need.",
  estimatedMinutes: 25,
  objectives: [
    "Place useLayoutEffect between commit and paint",
    "Name the one problem it solves that useEffect cannot",
    "Write a measure-then-adjust effect",
    "Say what it costs and why it is not the default",
    "Handle its absence during server rendering",
  ],
  sections: [
    {
      id: "the-difference",
      heading: "One difference, and everything follows from it",
      body: [
        "`useLayoutEffect` has the same signature, the same dependency array and the same cleanup rules as `useEffect`. There is exactly one difference: **it runs before the browser paints, and the browser waits for it.**",
        "`useEffect`:  render → commit → *paint* → effect.",
        "`useLayoutEffect`:  render → commit → effect → *paint*.",
        "That gap is where the flash lives. If an effect changes something visible, `useEffect` gives the user one painted frame of the unadjusted version first. `useLayoutEffect` does not, because nothing has been painted yet.",
      ],
      examples: [
        {
          id: "layout-order",
          title: "The order, printed",
          lang: "jsx",
          code: `import { useEffect, useLayoutEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Both({ label }) {
  console.log(\`  render (\${label})\`);
  useLayoutEffect(() => {
    console.log(\`  useLayoutEffect (\${label})  <- before the browser paints\`);
    return () => console.log(\`  cleanup layout (\${label})\`);
  }, [label]);
  useEffect(() => {
    console.log(\`  useEffect (\${label})        <- after the browser paints\`);
    return () => console.log(\`  cleanup effect (\${label})\`);
  }, [label]);
  return <p>{label}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount:");
act(() => { root.render(<Both label="first" />); });

console.log("\\nchange the label prop:");
act(() => { root.render(<Both label="second" />); });

console.log("\\nunmount:");
act(() => { root.unmount(); });`,
          output: `mount:
  render (first)
  useLayoutEffect (first)  <- before the browser paints
  useEffect (first)        <- after the browser paints

change the label prop:
  render (second)
  cleanup layout (first)
  useLayoutEffect (second)  <- before the browser paints
  cleanup effect (first)
  useEffect (second)        <- after the browser paints

unmount:
  cleanup layout (second)
  cleanup effect (second)`,
          explanation:
            "The two queues are processed separately rather than component by component: on the update, the layout cleanup **and** the layout effect both run before the passive effect's cleanup. So a layout effect can never observe a state left behind by a passive cleanup that has not run yet.",
          alternates: [
            {
              lang: "tsx",
              code: `import { useEffect, useLayoutEffect, act } from "react";
import { createRoot } from "react-dom/client";

function Both({ label }: { label: string }) {
  console.log(\`  render (\${label})\`);
  useLayoutEffect(() => {
    console.log(\`  useLayoutEffect (\${label})  <- before the browser paints\`);
    return () => console.log(\`  cleanup layout (\${label})\`);
  }, [label]);
  useEffect(() => {
    console.log(\`  useEffect (\${label})        <- after the browser paints\`);
    return () => console.log(\`  cleanup effect (\${label})\`);
  }, [label]);
  return <p>{label}</p>;
}

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

console.log("mount:");
act(() => { root.render(<Both label="first" />); });

console.log("\\nchange the label prop:");
act(() => { root.render(<Both label="second" />); });

console.log("\\nunmount:");
act(() => { root.unmount(); });`,
            },
          ],
        },
      ],
    },
    {
      id: "the-case",
      heading: "The case it is for: measure, then adjust",
      body: [
        "There is one situation where you genuinely cannot use `useEffect`, and it has a shape: **you need the real, laid-out size or position of a DOM node in order to decide how to render.**",
        "You cannot know that during render, because nothing is in the document yet. So you render something, measure it, and adjust — and the adjustment must happen before the user sees the unadjusted version.",
        "A tooltip is the canonical example. You render it below the trigger, measure whether it now overflows the viewport, and flip it above if it does. With `useEffect`, the user sees one frame of a tooltip hanging off the bottom of the screen before it jumps.",
      ],
      examples: [
        {
          id: "tooltip-flip",
          title: "A tooltip that flips before anyone sees it",
          lang: "jsx",
          code: `function Tooltip({ anchor, children }) {
  const ref = useRef(null);
  const [above, setAbove] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // getBoundingClientRect forces layout, which is only possible because
    // the node is in the document — that is what "after commit" buys us.
    const height = node.getBoundingClientRect().height;
    const overflows = anchor.bottom + height > window.innerHeight;

    // Setting state here triggers a second render *before* the paint.
    // React runs it synchronously, so only the corrected version is drawn.
    setAbove(overflows);
  }, [anchor]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: anchor.left,
        top: above ? undefined : anchor.bottom,
        bottom: above ? window.innerHeight - anchor.top : undefined,
      }}
    >
      {children}
    </div>
  );
}`,
          explanation:
            "Setting state inside `useLayoutEffect` is not a mistake here — it is the mechanism. React notices the update during the layout phase and re-renders synchronously, before yielding to the browser. The user never sees the first position. Doing exactly this in a `useEffect` is what produces the visible jump.",
          alternates: [
            {
              lang: "tsx",
              code: `function Tooltip({ anchor, children }: { anchor: DOMRect; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // getBoundingClientRect forces layout, which is only possible because
    // the node is in the document — that is what "after commit" buys us.
    const height = node.getBoundingClientRect().height;
    const overflows = anchor.bottom + height > window.innerHeight;

    // Setting state here triggers a second render *before* the paint.
    // React runs it synchronously, so only the corrected version is drawn.
    setAbove(overflows);
  }, [anchor]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: anchor.left,
        top: above ? undefined : anchor.bottom,
        bottom: above ? window.innerHeight - anchor.top : undefined,
      }}
    >
      {children}
    </div>
  );
}`,
            },
          ],
        },
      ],
      pitfalls: [
        {
          title: "Other members of the same family",
          body: "Anything that needs post-layout geometry: scrolling a newly added message into view before the frame is drawn, restoring a scroll position on navigation, positioning a dropdown or popover, measuring text to decide whether to show a \"read more\", and synchronising two scroll containers. All the same shape — the DOM must exist, and the correction must precede the paint.",
        },
      ],
    },
    {
      id: "the-cost",
      heading: "What it costs",
      body: [
        "`useLayoutEffect` runs **synchronously and blocks the paint**. Whatever it does is added to the time before the user sees anything.",
        "That is bad in three ways that compound. Your code delays the frame directly. If it sets state, React runs a whole extra render and commit before yielding, doubling the work. And `getBoundingClientRect` forces the browser to compute layout right there, which is the expensive part of rendering a page.",
        "This is why `useEffect` is the default and this is the exception. The right question is not \"which is safer?\" — it is \"does the user see something wrong if this happens after the paint?\" If not, use `useEffect`.",
        "Four questions, in order. **Does this read layout from the DOM?** If no, `useEffect`. **Does it change something visible?** If no, `useEffect`. **Would the intermediate frame be visible?** If no, `useEffect`. Only three yeses earn `useLayoutEffect`.",
      ],
      pitfalls: [
        {
          title: "It does not run on the server, and React will tell you",
          body: "Server rendering produces HTML with no layout, so React skips layout effects and warns that `useLayoutEffect` does nothing on the server. That warning is real: any component whose *correctness* depends on one has no correct server-rendered output. The usual fix is to render a sensible default that does not need measuring, and let the layout effect adjust it on the client — which is a design constraint, not a workaround.",
        },
        {
          title: "\"It fixed my flicker\" is a reason to look, not a reason to keep it",
          body: "Swapping `useEffect` for `useLayoutEffect` makes a class of flicker disappear, which makes it tempting as a general fix. Usually the flicker is derived state being set in an effect — lesson 1 — and the real fix is to compute the value during render, which is faster than either effect and has no intermediate frame at all.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between useEffect and useLayoutEffect?",
      answer:
        "Timing, and nothing else. Both run after the commit; `useLayoutEffect` runs before the browser paints and blocks it, `useEffect` runs after. That means a layout effect can measure the real DOM and set state, and React will re-render synchronously before yielding — so the user never sees the unadjusted version. A passive effect cannot, because the frame has already been painted.",
    },
    {
      question: "When do you actually need useLayoutEffect?",
      answer:
        "When you have to read the laid-out geometry of a DOM node and change something visible based on it, and the intermediate frame would be visible. Positioning a tooltip that might overflow the viewport, scrolling a new message into view, restoring a scroll position. Three yeses — reads layout, changes something visible, and the intermediate frame is visible — otherwise `useEffect`.",
    },
    {
      question: "Why is useEffect the default rather than useLayoutEffect?",
      answer:
        "Because a layout effect blocks the paint, so everything it does is added to the time before the user sees anything — and if it sets state, React runs a whole extra render and commit before yielding. Reading layout with `getBoundingClientRect` forces the browser to compute layout on the spot as well. It also does not run during server rendering, so a component that depends on one has no correct server-rendered output.",
    },
  ],
  takeaways: [
    "One difference: `useLayoutEffect` runs before the paint and blocks it",
    "That gap is where a visible flash lives — the frame showing the unadjusted version",
    "Its case is measure-then-adjust: read real geometry, correct before the paint",
    "Setting state in a layout effect is the mechanism, not a mistake — React re-renders synchronously",
    "It costs a blocked paint, a possible extra render+commit, and a forced layout",
    "Three yeses earn it: reads layout, changes something visible, intermediate frame is visible",
    "It does not run on the server, so a component that needs one has no correct server output",
    "If it \"fixed a flicker\", check whether the real problem is derived state in an effect",
  ],
  status: "available",
};
