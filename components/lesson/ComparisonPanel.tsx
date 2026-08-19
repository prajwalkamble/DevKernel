import type { CodeExample } from "@/content/types";
import { CodeBlock } from "./CodeBlock";
import { ProseInline } from "./Prose";
import { Terminal } from "lucide-react";

export function ComparisonPanel({ example }: { example: CodeExample }) {
  // Only the JS/TS track shows two languages side by side; every other track
  // has one block per example.
  const hasBoth = Boolean(example.js) && Boolean(example.ts);

  return (
    <div className="space-y-3">
      {example.title && <h4 className="text-sm font-medium text-foreground">{example.title}</h4>}
      <div className={hasBoth ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
        {example.js && <CodeBlock code={example.js} language="javascript" />}
        {example.ts && <CodeBlock code={example.ts} language="typescript" />}
        {example.code && <CodeBlock code={example.code} language={example.lang ?? "javascript"} />}
      </div>
      {example.output && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
          <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap font-mono">
            {example.output}
          </code>
        </div>
      )}
      {example.explanation && (
        <p className="text-sm leading-relaxed text-foreground/80">
          <ProseInline text={example.explanation} />
        </p>
      )}
    </div>
  );
}
