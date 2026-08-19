import type { Section } from "@/content/types";
import { Prose } from "./Prose";
import { ComparisonPanel } from "./ComparisonPanel";
import { PitfallCallout } from "./PitfallCallout";

export function SectionBlock({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {section.heading}
      </h2>
      {section.body && <Prose paragraphs={section.body} />}
      {section.examples?.map((example) => (
        <ComparisonPanel key={example.id} example={example} />
      ))}
      {section.pitfalls?.map((pitfall, i) => (
        <PitfallCallout key={i} pitfall={pitfall} />
      ))}
    </section>
  );
}
