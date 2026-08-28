import type { Lesson } from "@/content/types";

export const portalsAndAnimationLesson: Lesson = {
  id: "react-portals-and-animation",
  slug: "portals-and-animation",
  moduleSlug: "patterns-and-mastery",
  title: "Portals, Animation & Escaping the Tree",
  summary:
    "Rendering into a different part of the DOM while staying in the same React tree — proved, including the event that bubbles to a parent it is no longer inside — and the exit-animation problem that portals do not solve.",
  estimatedMinutes: 28,
  objectives: [
    "Use createPortal and say what it does and does not move",
    "Predict where an event from inside a portal goes",
    "Say what a portal does not fix about a modal",
    "Animate an element that is being removed",
    "Choose between CSS, the Web Animations API and a library",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "The problem portals exist for",
      body: [
        "A modal rendered where it belongs logically — inside the card that opened it — is inside that card's `overflow: hidden`, inside its stacking context, inside its `transform`. So it is clipped at the card's edge, cannot be raised above a sibling with a higher `z-index`, and is positioned relative to a transformed ancestor rather than the viewport.",
        "None of that is a React problem. It is CSS, and the CSS answer is to be somewhere else in the document.",
        "`createPortal(children, domNode)` renders into that other node while leaving the children exactly where they are in the **React** tree.",
      ],
      visual: {
        id: "portal-visual",
        kind: "react-patterns",
        algorithm: "portal",
        title: "Two trees, one component",
        lockAlgorithm: true,
      },
    },
    {
      id: "what-moves",
      heading: "What moves and what does not",
      body: [
        "The DOM position moves. The React position does not — which means context still flows down to the portalled children, and their **events still bubble to their React ancestors**, not to their DOM ancestors.",
        "That last part surprises everyone the first time, and it is worth seeing rather than being told.",
      ],
      examples: [
        {
          id: "bubbling",
          title: "A click outside the card, handled by the card",
          lang: "tsx",
          code: `import { act } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

const modalHost = document.createElement("div");
modalHost.id = "modal-root";
document.body.appendChild(modalHost);

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(children, modalHost);
}

function Card() {
  return (
    <div className="card" onClick={() => console.log("the card's onClick ran")}>
      <p>card content</p>
      <Modal>
        <button>Inside the portal</button>
      </Modal>
    </div>
  );
}

const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => { createRoot(container).render(<Card />); });

const button = modalHost.querySelector("button")!;
console.log("DOM parent of the button:  ", button.parentElement!.id || button.parentElement!.className);
console.log("is it inside .card?        ", container.contains(button));
await act(async () => { button.click(); });`,
          output: `DOM parent of the button:   modal-root
is it inside .card?         false
the card's onClick ran`,
          explanation:
            "The button is not inside the card — `contains` says so — and clicking it runs the card's `onClick` anyway. React's event system delegates at the root and dispatches along the *React* tree, so a portal changes where an element is painted without changing where its events go.\n\nThat is usually what you want: a form inside a portalled modal still submits to the form logic that rendered it. It is also the reason a click inside a portalled dropdown can close the menu that opened it, if the menu closes on a click anywhere in its parent.",
        },
      ],
      pitfalls: [
        {
          title: "A click-outside handler needs to know about the portal",
          body: "`if (!containerRef.current.contains(event.target)) close()` treats every click in the portal as an outside click, because the portal genuinely is outside. Check both refs, or listen on the portal's own container and stop there.",
        },
      ],
    },
    {
      id: "the-host",
      heading: "The host node",
      body: [
        "Two ways to get one, and the difference matters more in a server-rendered app than a client one.",
        "**A fixed node in `index.html`** — `<div id=\"modal-root\">`. Simple, always there, and the node is shared by every portal.",
        "**A node created on mount** — appended in an effect, removed in the cleanup. Each portal owns its own container, which keeps things tidy when several are open.",
        "In both cases the host must exist before the portal renders, and on a server it does not exist at all. `createPortal` cannot run during a server render, so a portalled component has to render nothing until after hydration — which is module 12's two-pass pattern, in yet another costume.",
      ],
      examples: [
        {
          id: "host",
          title: "A portal that survives server rendering",
          lang: "tsx",
          code: `function Portal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement("div");
    document.body.appendChild(node);
    setHost(node);
    return () => { node.remove(); };
  }, []);

  /* Null on the server and on the first client render, so the server's
     HTML and the client's first render agree. The portal appears on the
     second render, after the effect. */
  return host ? createPortal(children, host) : null;
}`,
          explanation:
            "The `useState` holding the node rather than a `useRef` is deliberate: creating the node must cause a re-render, because the first render legitimately had nowhere to portal to. A ref would create the node and never tell React about it.",
        },
      ],
      pitfalls: [
        {
          title: "A portal is not a modal",
          body: "It solves clipping and stacking, and nothing else. A modal still needs a focus trap, focus returned to the trigger, `aria-modal`, Escape to close, the background made inert, and scroll locked on the body. The native `<dialog>` element with `showModal()` does most of that for you, and a headless library does the rest — which is lesson 1's recommendation arriving from a different direction.",
        },
      ],
    },
    {
      id: "exit-animation",
      heading: "The animation problem React actually has",
      body: [
        "Entering is easy: the element mounts, CSS animates it. Leaving is not, and the reason is structural — **when you set `open` to false, React unmounts the element immediately**, and an element that is not in the DOM cannot animate.",
        "So an exit animation requires keeping the element mounted for the duration of the animation, then removing it. Which means the component needs three states rather than two: open, closing, and closed.",
      ],
      examples: [
        {
          id: "exit",
          title: "Three states, and one line of CSS doing the timing",
          lang: "tsx",
          code: `function useExitAnimation(open: boolean, durationMs: number) {
  /* Mounted covers both "open" and "still animating out". */
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) { setMounted(true); return; }
    const timer = setTimeout(() => setMounted(false), durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs]);

  return mounted;
}

function Toast({ open, children }: { open: boolean; children: ReactNode }) {
  const mounted = useExitAnimation(open, 200);
  if (!mounted) return null;
  /* data-state drives the CSS. The element is still in the DOM while
     open is false, which is the entire point. */
  return <div data-state={open ? "open" : "closed"} className="toast">{children}</div>;
}

/* .toast[data-state="open"]   { animation: slide-in  200ms ease-out; }
   .toast[data-state="closed"] { animation: slide-out 200ms ease-in;  } */`,
          explanation:
            "The duration is in two places, which is the honest weakness of this pattern — a designer changing the CSS to 300ms leaves the element unmounting 100ms early. Listening for `animationend` instead of using a timer removes the duplication and adds its own failure case, since `animationend` never fires if the user has `prefers-reduced-motion` set and your CSS honours it. Pick one and know its edge.",
        },
      ],
      pitfalls: [
        {
          title: "This is what an animation library is actually for",
          body: "Framer Motion's `AnimatePresence`, or `react-transition-group`, exist to own that three-state machine. If you have one exit animation, the hook above is fine; if you have ten, you are rewriting a library badly.",
        },
      ],
    },
    {
      id: "animation-choices",
      heading: "Choosing how to animate",
      body: [
        "**CSS transitions and animations, first.** They run on the compositor, they do not need JavaScript to be running, and they cost nothing during the animation. Anything driven by a state change — a class or a `data-state` attribute — should be CSS.",
        "**The Web Animations API**, `element.animate()`, when you need to control it: pause, reverse, read the current time, or animate to a value you only know at runtime. It is a ref and an effect, and it needs no library.",
        "**A library**, when you need physics, gestures, layout transitions between two positions, or coordinated exit animations across many elements. Framer Motion is the usual answer and it is not a small dependency; that is the trade.",
        "**Never animate in a re-render.** `setState` at 60fps to move something is a render, a reconcile and a commit sixty times a second, for something the browser would have done on the compositor for free. If you find yourself doing it, the value belongs in a CSS custom property or in a ref, updated imperatively.",
      ],
      examples: [
        {
          id: "reduced-motion",
          title: "The one thing that is not optional",
          lang: "tsx",
          code: `/* Some people get motion sickness from parallax and large transitions.
   The OS setting is available in CSS and in JS, and honouring it is a
   two-line change that matters a great deal to a small number of users. */

/* @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   } */

/* And in JavaScript, when the animation is not CSS. Module 10's hook,
   because matchMedia is exactly the external store it was built for. */
const query = window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribe = (onChange: () => void) => {
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => query.matches, () => false);
}`,
          explanation:
            "The CSS version uses `0.01ms` rather than `none` deliberately: an animation that is instant still *ends*, so an `animationend` listener still fires and a component waiting for it does not hang. Setting `animation: none` breaks exactly the exit-animation pattern above.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does createPortal do?",
      answer:
        "Renders children into a different DOM node while leaving them where they are in the React tree. The DOM position changes, so the element escapes an ancestor's `overflow: hidden`, stacking context and transform — which is the CSS problem it exists to solve. The React position does not change, so context still flows down and events still bubble to React ancestors rather than DOM ones.",
    },
    {
      question: "Where does a click inside a portal bubble to?",
      answer:
        "To its React ancestors, not its DOM ancestors. React delegates at the root and dispatches along its own tree, so a button portalled to `document.body` still triggers the `onClick` of the card that rendered it — even though `card.contains(button)` is false. That is usually what you want, and it is why a naive click-outside handler treats every click in a portalled dropdown as an outside click.",
    },
    {
      question: "Does a portal make something a modal?",
      answer:
        "No. It solves clipping and stacking and nothing else. A modal also needs a focus trap, focus returned to the trigger on close, `aria-modal`, Escape to close, the background made inert and body scroll locked. The native `<dialog>` with `showModal()` covers most of that, and a headless library covers the rest.",
    },
    {
      question: "Why are exit animations hard in React?",
      answer:
        "Because setting `open` to false unmounts the element immediately, and an element that is not in the DOM cannot animate. You need three states rather than two — open, closing, closed — keeping the element mounted for the animation's duration and removing it afterwards. A timer duplicates the duration between CSS and JavaScript; `animationend` avoids that but never fires if reduced motion has disabled the animation. Owning that state machine is what `AnimatePresence` is for.",
    },
  ],
  takeaways: [
    "A portal changes the DOM position and not the React position",
    "Context still flows in, and events still bubble to React ancestors",
    "A click-outside check must account for the portal being genuinely outside",
    "`createPortal` cannot run on a server — render null until after hydration",
    "A portal is not a modal: focus trap, Escape, `aria-modal` and inert background are separate",
    "Exit animations need a third state, because unmounting is immediate",
    "A duration in both CSS and JS drifts; `animationend` avoids it but not with reduced motion",
    "CSS first, Web Animations when you need control, a library for physics and coordination",
    "Never drive an animation with `setState` at 60fps",
    "Honour `prefers-reduced-motion`, and use `0.01ms` rather than `none` so events still fire",
  ],
  status: "available",
};
