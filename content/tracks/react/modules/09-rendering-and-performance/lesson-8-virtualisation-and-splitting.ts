import type { Lesson } from "@/content/types";

export const virtualisationAndSplittingLesson: Lesson = {
  id: "react-virtualisation-splitting",
  slug: "virtualising-and-code-splitting",
  moduleSlug: "rendering-and-performance",
  title: "Rendering Less, and Shipping Less",
  summary:
    "The two optimisations that beat every memo in this module, because they remove work rather than caching it. 10,000 rows down to 21, and a bundle split at the boundaries users actually cross.",
  estimatedMinutes: 28,
  objectives: [
    "Explain windowing and measure what it removes",
    "Say what virtualisation costs in accessibility and behaviour",
    "Split a bundle with lazy and Suspense",
    "Choose split points that match how people use the app",
    "Say why these two come before memoisation",
  ],
  sections: [
    {
      id: "why-first",
      heading: "Why these come first",
      body: [
        "Everything else in this module makes existing work cheaper or less frequent. These two **delete the work**.",
        "Memoising a list of ten thousand rows still creates ten thousand elements, ten thousand DOM nodes and ten thousand comparisons. Rendering twenty rows instead creates twenty of each. No amount of caching approaches a three-orders-of-magnitude reduction.",
        "The same for code: no runtime optimisation recovers the 200ms a user spent downloading and parsing a module they will never open.",
      ],
    },
    {
      id: "windowing",
      heading: "Windowing",
      visual: {
        id: "virtual-window-visual",
        kind: "react-perf",
        algorithm: "virtual-window",
        title: "Ten thousand rows, twenty-six elements",
      },
      body: [
        "The observation is that a screen shows about twenty rows, so rendering ten thousand puts 9,980 of them where nobody can see them.",
        "Windowing renders only the visible slice, plus a small overscan, and uses one tall spacer element so the scrollbar still reflects the full list.",
      ],
      examples: [
        {
          id: "windowed-list",
          title: "10,000 rows, counted",
          lang: "tsx",
          code: `import { act } from "react";
import { createRoot } from "react-dom/client";

const ITEMS = Array.from({ length: 10_000 }, (_, i) => \`row \${i}\`);
const ROW_HEIGHT = 24;
const VIEWPORT = 480;

function Plain() {
  return <ul>{ITEMS.map((item) => <li key={item}>{item}</li>)}</ul>;
}

/* Windowing: render only the rows the viewport can show, and use a spacer
   to keep the scrollbar honest. */
function Windowed({ scrollTop }: { scrollTop: number }) {
  const first = Math.floor(scrollTop / ROW_HEIGHT);
  const visible = Math.ceil(VIEWPORT / ROW_HEIGHT) + 1;
  const slice = ITEMS.slice(first, first + visible);
  return (
    <div style={{ height: VIEWPORT, overflow: "auto" }}>
      <div style={{ height: ITEMS.length * ROW_HEIGHT, position: "relative" }}>
        <ul style={{ position: "absolute", top: first * ROW_HEIGHT }}>
          {slice.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function measure(node: () => React.JSX.Element, label: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { createRoot(container).render(node()); });
  const elements = container.querySelectorAll("*").length;
  const rows = container.querySelectorAll("li").length;
  console.log(\`\${label.padEnd(14)} \${rows} rows rendered, \${elements} DOM elements total\`);
}

console.log(\`a list of \${ITEMS.length.toLocaleString("en-GB")} items in a \${VIEWPORT}px viewport:\`);
measure(() => <Plain />, "  every row:");
measure(() => <Windowed scrollTop={0} />, "  windowed:");
measure(() => <Windowed scrollTop={5000} />, "  scrolled:");`,
          output: `a list of 10,000 items in a 480px viewport:
  every row:   10000 rows rendered, 10001 DOM elements total
  windowed:    21 rows rendered, 24 DOM elements total
  scrolled:    21 rows rendered, 24 DOM elements total`,
          explanation:
            "10,000 down to 21, and — the number that matters more — **the same 21 whether you are at the top or five thousand pixels down**. Windowing makes cost independent of list length, which is a different kind of improvement from making each row cheaper.",
        },
      ],
      pitfalls: [
        {
          title: "Use a library",
          body: "The example above is the idea, not the implementation. A real one handles variable row heights, resize, scroll restoration, sticky headers, keyboard navigation and horizontal windowing. `@tanstack/react-virtual` is headless and gives you the positions to render yourself; `react-window` gives you components. Both are small and both have solved problems you will otherwise meet one at a time.",
        },
        {
          title: "What windowing costs",
          body: "Ctrl-F stops finding text that is not rendered. Screen readers announce a list of twenty items where there are ten thousand unless you set `aria-setsize` and `aria-posinset` yourself. Printing gives you one screenful. And anchor links to items further down do not resolve. None of these are dealbreakers; all of them are work you did not have before.",
        },
        {
          title: "The threshold, and the cheaper alternatives",
          body: "Below a few hundred rows, do not bother — the complexity is not repaid. Before reaching for it, ask whether pagination or a better filter would serve the user better: a person scrolling ten thousand rows is usually a person who could not find what they wanted.",
        },
      ],
    },
    {
      id: "code-splitting",
      heading: "Code splitting",
      body: [
        "The same idea for the bundle. `React.lazy` takes a function returning a dynamic `import()`, and the bundler makes that module a separate chunk fetched on first render.",
        "`Suspense` supplies what is shown while the chunk is in flight. Module 11 covers Suspense properly; here it is the boundary that makes `lazy` usable.",
      ],
      examples: [
        {
          id: "lazy-routes",
          title: "Splitting at the route",
          lang: "jsx",
          code: `import { lazy, Suspense } from "react";

/* Each of these becomes its own chunk, fetched the first time its route
   renders. The import must be a real dynamic import() the bundler can see —
   a variable path defeats the static analysis and produces no chunk. */
const Dashboard = lazy(() => import("./features/dashboard"));
const Reports = lazy(() => import("./features/reports"));
const Settings = lazy(() => import("./features/settings"));

function App() {
  return (
    <Layout>
      {/* One boundary per region that can load independently. A single
          boundary at the root would blank the whole page on every
          navigation, which is worse than not splitting. */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

/* Prefetch on intent: by the time the click lands the chunk is usually
   already there, so the fallback never appears. */
<Link to="/reports" onMouseEnter={() => import("./features/reports")}>
  Reports
</Link>;`,
          explanation:
            "The prefetch line is what makes splitting invisible. A user's pointer reaches a link a few hundred milliseconds before the click does, and a chunk fetched in that window has arrived by the time it is needed — so you get the smaller initial bundle without the loading state.",
        },
      ],
      pitfalls: [
        {
          title: "Where to split",
          body: "**Routes**, always — a user on the dashboard should not download the settings screen. **Heavy dependencies behind an interaction**: a chart library, a rich text editor, a PDF viewer, a date picker used on one screen. **Anything below the fold that needs a big library.** Do not split individual components: each chunk is a request and its own overhead, and fifty tiny chunks is slower than one medium one.",
        },
        {
          title: "Declaring `lazy` inside a component remounts it every render",
          body: "`const Panel = lazy(() => import(\"./Panel\"))` written in a component body creates a new component type on every render, so React unmounts and remounts the whole subtree — losing its state, and re-suspending. `lazy` calls belong at module scope, always.",
        },
        {
          title: "Handle the failed chunk",
          body: "A dynamic import can fail — the network dropped, or a deploy replaced the file the user's page is asking for, which is the common one. Without an error boundary around the Suspense boundary, that is a blank screen. With one, it is a retry button. Deploys make this routine rather than rare.",
        },
      ],
    },
    {
      id: "measuring-bundle",
      heading: "Knowing what to split",
      body: [
        "Guessing at bundle contents is worse than guessing at render costs, because the answer is so often one dependency you had forgotten about.",
        "**Look at the build output first.** `vite build` prints every chunk with its size, gzipped. That is free and it is usually enough.",
        "**Then a visualiser** — `rollup-plugin-visualizer` for Vite, `webpack-bundle-analyzer` otherwise. A treemap of the bundle makes the answer obvious in seconds, and it is almost always a moment-style date library, an icon set imported in full, a locale bundle, or a charting library on a page with no chart.",
        "**Check the imports before splitting.** `import { format } from \"date-fns\"` is tree-shaken to one function; `import _ from \"lodash\"` is not, while `import debounce from \"lodash/debounce\"` is. Half of what looks like a splitting problem is an import-style problem, and fixing that is one line.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you render a list of ten thousand items?",
      answer:
        "Windowing: render only the rows the viewport can show plus a small overscan, inside a container whose height is the full list so the scrollbar stays honest. Ten thousand rows becomes about twenty, and — the more important property — the cost stops depending on list length. Use `@tanstack/react-virtual` or `react-window` rather than writing it, because variable heights, resize, scroll restoration and keyboard navigation are all real. It costs Ctrl-F, printing, and correct screen-reader counts unless you set `aria-setsize` yourself.",
    },
    {
      question: "How does code splitting work in React?",
      answer:
        "`lazy(() => import(\"./Thing\"))` makes that module a separate chunk the bundler emits, fetched the first time the component renders, with a `Suspense` boundary providing the fallback while it is in flight. Split at routes and at heavy dependencies behind an interaction — not at individual components, since each chunk is a request with its own overhead. Prefetching on hover usually means the fallback never appears.",
    },
    {
      question: "Why do virtualisation and code splitting come before memoisation?",
      answer:
        "Because they remove work rather than caching it. Memoising ten thousand rows still creates ten thousand elements, DOM nodes and comparisons; rendering twenty creates twenty of each. And no runtime optimisation recovers the time a user spent downloading a module they never open. Memoisation makes existing work cheaper; these make it not exist.",
    },
    {
      question: "What can go wrong with React.lazy?",
      answer:
        "Declaring it inside a component body creates a new component type every render, so React remounts the subtree and loses its state — `lazy` calls belong at module scope. A dynamic import can also fail, most often because a deploy replaced the chunk the user's open page is asking for, and without an error boundary that is a blank screen instead of a retry. And a single Suspense boundary at the root blanks the whole page on every navigation, which is worse than not splitting.",
    },
  ],
  takeaways: [
    "These two delete work; everything else in this module caches it",
    "Windowing renders the visible slice and a spacer — 10,000 rows becomes about 21",
    "Its real property is that cost stops depending on list length",
    "Use a virtualisation library: variable heights, resize, scroll restoration and keyboard are all real",
    "It costs Ctrl-F, printing, anchor links, and correct screen-reader counts unless you set them",
    "Below a few hundred rows it is not worth it — and pagination may serve the user better",
    "Split at routes and heavy dependencies, never per component",
    "`lazy` at module scope only; inside a component it remounts the subtree every render",
    "Put an error boundary around it — a deploy can delete the chunk an open page will ask for",
    "Read the build output before splitting: half of it is an import-style problem",
  ],
  status: "available",
};
