import type { RunnableLanguage } from "@/lib/playgroundHandoff";

export interface TranspileResult {
  code: string;
  diagnostics: string[];
  /** True when the source was compiled as JSX, i.e. as .tsx or .jsx. */
  jsx: boolean;
}

/**
 * Conservative test for JSX: a fragment, a closing tag, or a self-closing tag.
 *
 * It has to be conservative because compiling as .tsx is not free — the
 * angle-bracket type assertion (`<string>value`) and the bare generic arrow
 * (`<T>(x: T) => x`) both stop parsing there. A false negative is harmless: the
 * file compiles as .ts exactly as it did before.
 */
const JSX_SYNTAX = /<>|<\/[A-Za-z][\w.:-]*\s*>|<[A-Za-z][\w.:-]*(?:\s[^<>]*?)?\/>/;

export function containsJsx(source: string): boolean {
  return JSX_SYNTAX.test(source);
}

const FILENAMES: Record<RunnableLanguage, { plain: string; jsx: string }> = {
  typescript: { plain: "playground.ts", jsx: "playground.tsx" },
  javascript: { plain: "playground.js", jsx: "playground.jsx" },
};

/**
 * Strips TypeScript types down to plain JavaScript in the browser, compiling
 * JSX along the way when the source contains any.
 * `typescript` is dynamically imported so it never ends up in bundles
 * outside the playground page.
 */
export async function transpileTypeScript(
  source: string,
  language: RunnableLanguage = "typescript"
): Promise<TranspileResult> {
  const ts = await import("typescript");

  const diagnosticsList: string[] = [];
  const jsx = containsJsx(source);
  const names = FILENAMES[language];

  const result = ts.transpileModule(source, {
    // TypeScript decides whether to parse JSX from the file extension alone,
    // so the virtual filename is what actually switches the feature on.
    fileName: jsx ? names.jsx : names.plain,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      // The classic runtime emits React.createElement(...) calls, which resolve
      // against the shim the sandbox defines. The automatic runtime would emit
      // an import of react/jsx-runtime, and ModuleKind.None turns imports into
      // require() calls that a Web Worker cannot satisfy.
      jsx: ts.JsxEmit.React,
      allowJs: true,
      strict: false,
    },
    reportDiagnostics: true,
  });

  for (const diagnostic of result.diagnostics ?? []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      diagnosticsList.push(`Line ${line + 1}: ${message}`);
    } else {
      diagnosticsList.push(message);
    }
  }

  return { code: result.outputText, diagnostics: diagnosticsList, jsx };
}
