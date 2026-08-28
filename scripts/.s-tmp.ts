import { reactTrack } from "@/content/tracks/react/index";
const want = new Set([
  "state-is-a-snapshot","batching","objects-and-arrays-in-state","choosing-state-shape","what-usestate-stores",
  "useeffect","the-dependency-array","cleanup-and-strict-mode","useref","usecontext","state-ref-or-variable",
  "rendering-lists","controlled-and-uncontrolled","resetting-with-a-key",
  "refs-and-imperative-handles","composing-hooks-and-return-shapes",
]);
for (const m of reactTrack.modules)
  for (const l of m.lessons) {
    if (!want.has(l.slug)) continue;
    console.log(`\nm${m.order} ${l.slug} — ${l.title}`);
    for (const s of l.sections) console.log(`    ${s.id.padEnd(30)} ${s.heading}${s.visual ? "   [HAS VISUAL]" : ""}`);
  }
