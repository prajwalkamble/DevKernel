import type { CodeExample } from "@/content/types";
import { CodeBlock } from "./CodeBlock";
import { ExampleLanguagePicker } from "./ExampleLanguagePicker";
import { ProseInline } from "./Prose";
import { Terminal } from "lucide-react";
import { EXAMPLE_LANGUAGES, type ExampleLanguage } from "@/lib/exampleLanguage";
import type { ReactNode } from "react";

function isExampleLanguage(value: string): value is ExampleLanguage {
  return (EXAMPLE_LANGUAGES as readonly string[]).includes(value);
}

function OutputPanel({ output }: { output: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
      <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap font-mono">
        {output}
      </code>
    </div>
  );
}

export function ComparisonPanel({ example }: { example: CodeExample }) {
  // Only the JS/TS track shows two languages side by side; every other track
  // has one block per example.
  const hasBoth = Boolean(example.js) && Boolean(example.ts);

  // Every variant is highlighted here, on the server, and handed to the picker
  // as finished markup. Shipping a highlighter to the browser to render code
  // that is fully known at build time would be the wrong trade.
  const primary = example.lang && isExampleLanguage(example.lang) ? example.lang : null;
  const code = example.code;
  const translated = example.alternates ?? [];

  if (primary && code && translated.length > 0) {
    const blocks: Partial<Record<ExampleLanguage, ReactNode>> = {
      [primary]: <CodeBlock code={code} language={primary} />,
    };
    const outputs: Partial<Record<ExampleLanguage, ReactNode>> = {};
    if (example.output) outputs[primary] = <OutputPanel output={example.output} />;
    // Titles travel with the language, because most of them name a file.
    const titles: Partial<Record<ExampleLanguage, string>> = {};
    if (example.title) titles[primary] = example.title;

    for (const variant of translated) {
      if (!isExampleLanguage(variant.lang)) continue;
      blocks[variant.lang] = <CodeBlock code={variant.code} language={variant.lang} />;
      const out = variant.output ?? example.output;
      if (out) outputs[variant.lang] = <OutputPanel output={out} />;
      const title = variant.title ?? example.title;
      if (title) titles[variant.lang] = title;
    }

    return (
      <div className="space-y-3">
        <ExampleLanguagePicker
          primary={primary}
          blocks={blocks}
          outputs={outputs}
          titles={titles}
        />
        {example.explanation && (
          <p className="text-sm leading-relaxed text-foreground/80">
            <ProseInline text={example.explanation} />
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {example.title && <h4 className="text-sm font-medium text-foreground">{example.title}</h4>}
      <div className={hasBoth ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
        {example.js && <CodeBlock code={example.js} language="javascript" />}
        {example.ts && <CodeBlock code={example.ts} language="typescript" />}
        {example.code && <CodeBlock code={example.code} language={example.lang ?? "javascript"} />}
      </div>
      {example.output && <OutputPanel output={example.output} />}
      {example.explanation && (
        <p className="text-sm leading-relaxed text-foreground/80">
          <ProseInline text={example.explanation} />
        </p>
      )}
    </div>
  );
}
