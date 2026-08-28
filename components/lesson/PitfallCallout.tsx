import { AlertTriangle } from "lucide-react";
import type { Pitfall } from "@/content/types";
import { ProseInline } from "./Prose";

export function PitfallCallout({ pitfall }: { pitfall: Pitfall }) {
  return (
    <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      {/* `min-w-0` so this flex item may shrink. `break-words` on the code
          inside is not enough on its own: it permits a break but does not
          reduce the element's intrinsic min-content width, so a long
          identifier would still refuse to let the column narrow. */}
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{pitfall.title}</p>
        <p className="text-sm leading-relaxed text-foreground/80">
          <ProseInline text={pitfall.body} />
        </p>
      </div>
    </div>
  );
}
