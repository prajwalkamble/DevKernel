import type { Lesson } from "@/content/types";

export const reactCompilerLesson: Lesson = {
  id: "react-compiler",
  slug: "the-react-compiler",
  moduleSlug: "rendering-and-performance",
  title: "The React Compiler",
  summary:
    "What it emits, read from its actual output: a per-component cache, a slot per value, and a comparison in front of each. Plus the part that decides whether it helps you — it skips any component whose rules it cannot verify, silently.",
  estimatedMinutes: 28,
  objectives: [
    "Read compiled output and say what it memoised",
    "Explain how it decides what to cache",
    "Say what it does with a component that breaks the rules",
    "Decide whether to adopt it, and what to delete when you do",
    "Say what it does not fix",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "The idea",
      body: [
        "Everything in the last three lessons was manual bookkeeping. You worked out which values needed a stable identity, wrapped them, and maintained the dependency arrays by hand — and one missed prop wasted every other memo at that boundary.",
        "The React Compiler is a build-time step that does it for you. It reads your components, works out which values depend on which, and emits code that caches each one and recomputes it only when its inputs change.",
        "It is not a runtime. Your source stays as you wrote it; the compiler rewrites it on the way through the build.",
      ],
    },
    {
      id: "what-it-emits",
      heading: "What it actually emits",
      visual: {
        id: "compiler-cache-visual",
        kind: "react-perf",
        algorithm: "compiler-cache",
        title: "The seven-slot cache, render by render",
      },
      body: [
        "This is the compiler's real output for a four-line component. Reading it once removes most of the mystery.",
      ],
      examples: [
        {
          id: "compiled-output",
          title: "In, and out",
          lang: "jsx",
          requires: "babel-plugin-react-compiler (the output is its emit, not the program's)",
          code: `// The source — no memo, no useMemo, no useCallback.
function ProductList({ products, query }) {
  const filtered = products.filter((p) => p.name.includes(query));
  const onPick = (id) => console.log(id);
  return <Grid rows={filtered} onPick={onPick} />;
}`,
          output: `import { c as _c } from "react/compiler-runtime";
function ProductList(t0) {
  const $ = _c(7);
  const {
    products,
    query
  } = t0;
  let t1;
  if ($[0] !== products || $[1] !== query) {
    let t2;
    if ($[3] !== query) {
      t2 = p => p.name.includes(query);
      $[3] = query;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    t1 = products.filter(t2);
    $[0] = products;
    $[1] = query;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const filtered = t1;
  const onPick = _temp;
  let t2;
  if ($[5] !== filtered) {
    t2 = <Grid rows={filtered} onPick={onPick} />;
    $[5] = filtered;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
function _temp(id) {
  return console.log(id);
}`,
          explanation:
            "`_c(7)` asks React for a seven-slot cache belonging to this component instance. Each slot holds either an input it compared or a value it produced, and each guarded block is a hand-written `useMemo` you did not write. Three things worth noticing: the **predicate** passed to `filter` was memoised on `query`, which nobody does by hand; the **returned element** was memoised, which is what lets the parent skip `Grid`; and `onPick` was hoisted out of the component entirely as `_temp`, because it closes over nothing — the strongest possible stabilisation, and free.",
        },
      ],
      pitfalls: [
        {
          title: "The comparisons are still `Object.is`",
          body: "`$[0] !== products` is the same identity check from the last lesson. The compiler does not make React compare deeply; it works out *where* the comparisons should go and writes them for you. Everything you learned about referential equality still applies — you are just no longer the one placing it.",
        },
      ],
    },
    {
      id: "rules",
      heading: "It skips what it cannot verify",
      body: [
        "The compiler can only cache a value if it can prove that recomputing it would give the same answer. That proof needs the rules of React — components pure during render, hooks called unconditionally, no mutation of props or of state.",
        "When it cannot prove that, it **leaves the component completely alone**. No error at build time, no warning at runtime; the component simply does not get compiled.",
      ],
      examples: [
        {
          id: "compiler-bailout",
          title: "Two bail-outs and one success, in one file",
          lang: "jsx",
          requires: "babel-plugin-react-compiler (the output is its emit, not the program's)",
          code: `function Conditional({ enabled }) {
  if (enabled) {
    const [n] = useState(0);
    return <b>{n}</b>;
  }
  return null;
}

function ReadsRefDuringRender() {
  const ref = useRef(0);
  ref.current += 1;
  return <b>{ref.current}</b>;
}

function Fine({ items }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  return <b>{total}</b>;
}`,
          output: `import { c as _c } from "react/compiler-runtime";
function Conditional({
  enabled
}) {
  if (enabled) {
    const [n] = useState(0);
    return <b>{n}</b>;
  }
  return null;
}
function ReadsRefDuringRender() {
  const ref = useRef(0);
  ref.current += 1;
  return <b>{ref.current}</b>;
}
function Fine(t0) {
  const $ = _c(4);
  const {
    items
  } = t0;
  let t1;
  if ($[0] !== items) {
    t1 = items.reduce(_temp, 0);
    $[0] = items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const total = t1;
  let t2;
  if ($[2] !== total) {
    t2 = <b>{total}</b>;
    $[2] = total;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}`,
          explanation:
            "The first two came out **byte-for-byte unchanged** — a conditional hook and a ref written during render are both rules violations, so the compiler declined. The third got the full treatment. Nothing in the output says the first two were skipped, which is why the lint rules matter: they are how you find out.",
        },
      ],
      pitfalls: [
        {
          title: "The lint plugin is how you see the bail-outs",
          body: "Current `eslint-plugin-react-hooks` ships the compiler's own diagnostics as lint rules, so a component the compiler will skip shows up as a lint error in your editor. Turn them on before adopting the compiler, or you get a build that silently optimises some unknown fraction of your components.",
        },
        {
          title: "Adopting it is a codebase-quality signal",
          body: "The proportion of components it can compile is a direct measurement of how well the codebase follows the rules of React. A codebase where it bails out constantly has real bugs in it — the compiler is not being fussy; it is refusing to cache something whose value can change without its inputs changing.",
        },
      ],
    },
    {
      id: "adopting",
      heading: "Adopting it",
      body: [
        "It is a Babel plugin, `babel-plugin-react-compiler`, and every major toolchain has a route to it: `@vitejs/plugin-react` takes Babel plugins, Next.js has a config flag, and the Metro and Webpack setups are documented.",
        "Reached 1.0 in 2025. It runs on React 19 directly; 17 and 18 need the `react-compiler-runtime` package for the `_c` helper.",
        "The adoption order that works: **turn the lint rules on first**, fix what they find, then enable the compiler on a directory rather than the whole codebase, and measure.",
        "What to do with your existing memos: **leave them for now.** They are correct and the compiler's caching sits alongside them. Delete them when you have measured that the compiler covers that path — and expect to delete a lot, because most `useCallback`s exist purely to hold a `memo` boundary together and the compiler holds it from the other side.",
      ],
      examples: [
        {
          id: "compiler-setup",
          title: "Turning it on with Vite",
          lang: "javascript",
          code: `// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Start with one directory rather than the whole tree, and
          // measure before widening it.
          ["babel-plugin-react-compiler", { sources: (f) => f.includes("/features/cart/") }],
        ],
      },
    }),
  ],
});`,
          explanation:
            "The `sources` predicate is the incremental-adoption lever. Widen it as you fix the lint errors the compiler's rules surface — which is the real work of adopting it, and the part that improves the codebase whether or not you ever ship the compiler.",
          alternates: [
            {
              lang: "typescript",
              code: `// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Start with one directory rather than the whole tree, and
          // measure before widening it.
          ["babel-plugin-react-compiler", { sources: (f: string) => f.includes("/features/cart/") }],
        ],
      },
    }),
  ],
});`,
            },
          ],
        },
      ],
    },
    {
      id: "not-fixed",
      heading: "What it does not fix",
      body: [
        "**It does not reduce the number of components React walks.** It caches values and elements; a ten-thousand-row list is still ten thousand rows. Virtualisation is still virtualisation.",
        "**It does not fix an expensive algorithm.** A quadratic loop in a component body is memoised and remains quadratic the first time and after every input change.",
        "**It does not fix state in the wrong place.** State at the root that should be in a leaf still cascades; the compiler makes the cascade cheaper without making it unnecessary.",
        "**It does not fix a slow bundle**, a network waterfall, or an oversized image — none of which are render problems.",
        "**It does not remove the need to understand identity.** It writes the comparisons; you still read them when something does not update, and you still need the model from the last lesson to interpret a profile.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does the React Compiler do?",
      answer:
        "It is a build-time step that works out which values in a component depend on which inputs, and emits a per-component cache with a comparison in front of each value — including the returned element, so a parent can skip the child. It is the manual `memo`/`useMemo`/`useCallback` bookkeeping done automatically, and more thoroughly than people do by hand: it memoises things like the predicate passed to `filter`, and hoists closures that capture nothing out of the component entirely.",
    },
    {
      question: "What happens to a component that breaks the rules of React?",
      answer:
        "It is left completely uncompiled — byte for byte unchanged — with no build error and no runtime warning. The compiler can only cache a value if it can prove recomputing it would give the same answer, and a conditional hook or a ref written during render defeats that proof. This is why the lint rules matter: they are the only way to see which components were skipped.",
    },
    {
      question: "Should you delete your useMemo and useCallback after adopting it?",
      answer:
        "Eventually, and not immediately. They are still correct and the compiler's caching coexists with them. Remove them once you have measured that the compiler covers that path — and expect to remove a lot, because most `useCallback`s exist only to hold a `memo` boundary together, and the compiler holds that boundary from both sides.",
    },
    {
      question: "What does the compiler not fix?",
      answer:
        "It caches values; it does not reduce how many components exist, so a ten-thousand-row list still needs virtualisation. It does not make an expensive algorithm cheap, only less often run. It does not fix state that is in the wrong place — the cascade is cheaper, not unnecessary. And nothing about bundles, waterfalls or images, which were never render problems.",
    },
  ],
  takeaways: [
    "A build-time step that emits a per-component cache: a slot per value, a comparison in front",
    "It memoises the returned element too, which is what lets a parent skip a child",
    "The comparisons are still `Object.is` — it places them, it does not change the rule",
    "It memoises things nobody does by hand, and hoists closures that capture nothing right out",
    "A component it cannot verify comes out completely unchanged, with no warning",
    "Turn the hooks lint rules on first — they are the only way to see the bail-outs",
    "How much it can compile is a direct measurement of how well the codebase follows the rules",
    "Adopt per directory, keep existing memos until measured, then expect to delete many",
    "It does not fix component count, algorithms, misplaced state, or bundles",
  ],
  status: "available",
};
