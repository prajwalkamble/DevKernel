import { codeToHtml } from "shiki";
import { CodeBlockActions } from "./CodeBlockActions";
import type { CodeLanguage } from "@/content/types";

const LANG_LABEL: Record<CodeLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  rust: "Rust",
  go: "Go",
  asm: "x86-64 Assembly",
  cpp: "C++",
  java: "Java",
  python: "Python",
  bash: "Terminal",
  xml: "XML",
  html: "HTML",
  yaml: "YAML",
  properties: "Properties",
  sql: "SQL",
  graphql: "GraphQL",
  json: "JSON",
  http: "HTTP",
};

const LANG_BADGE_CLASS: Record<CodeLanguage, string> = {
  javascript: "bg-js-soft text-js",
  typescript: "bg-ts-soft text-ts",
  jsx: "bg-react-soft text-react",
  tsx: "bg-react-soft text-react",
  rust: "bg-rust-soft text-rust",
  go: "bg-go-soft text-go",
  asm: "bg-asm-soft text-asm",
  cpp: "bg-cpp-soft text-cpp",
  java: "bg-java-soft text-java",
  python: "bg-python-soft text-python",
  // Config, schema and wire formats are supporting cast next to the Java on
  // the same page, so they stay neutral rather than competing for a colour.
  bash: "bg-surface-hover text-muted",
  xml: "bg-surface-hover text-muted",
  html: "bg-surface-hover text-muted",
  yaml: "bg-surface-hover text-muted",
  properties: "bg-surface-hover text-muted",
  sql: "bg-surface-hover text-muted",
  graphql: "bg-surface-hover text-muted",
  json: "bg-surface-hover text-muted",
  http: "bg-surface-hover text-muted",
};

export async function CodeBlock({
  code,
  language,
  title,
}: {
  code: string;
  language: CodeLanguage;
  title?: string;
}) {
  const html = await codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-code">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border/60 bg-code-header px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${LANG_BADGE_CLASS[language]}`}
          >
            {LANG_LABEL[language]}
          </span>
          {title && <span className="truncate text-xs text-muted">{title}</span>}
        </div>
        <CodeBlockActions code={code} language={language} />
      </div>
      <div
        className="scrollbar-thin overflow-x-auto text-[13px] leading-relaxed [&_pre]:p-4 [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
