import { reactTrack } from "@/content/tracks/react/index";
import { REACT_ALGOS } from "@/lib/visuals/react";
const used = new Map<string, string[]>();
for (const m of reactTrack.modules)
  for (const l of m.lessons)
    for (const s of l.sections)
      if (s.visual?.kind === "react-rendering" && s.visual.algorithm) {
        const a = s.visual.algorithm;
        if (!used.has(a)) used.set(a, []);
        used.get(a)!.push(`m${m.order}/${l.slug}`);
      }
for (const name of Object.keys(REACT_ALGOS))
  console.log(`${name.padEnd(24)} ${(used.get(name) ?? ["(UNUSED)"]).join(", ")}`);
