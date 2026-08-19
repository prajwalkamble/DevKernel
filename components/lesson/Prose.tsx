import { Fragment, type ReactNode } from "react";

/**
 * Renders a markdown-lite string: supports **bold**, *italic* and `inline code`.
 * Deliberately not full markdown — content is authored as plain data, this
 * just avoids raw HTML injection while allowing minimal emphasis.
 *
 * Bold and italic nest (and may contain code); code never nests, so asterisks
 * and backticks inside a code span always render literally. An emphasis
 * delimiter must hug non-whitespace, so a lone operator like `2 * 3` or a
 * trailing `yield*` in prose is left alone rather than being paired up.
 */
const INLINE = /(\*\*(?=\S)[\s\S]*?[^\s*]\*\*|\*(?=\S)[^*]*[^\s*]\*|`[^`]+`)/g;

function renderInline(text: string, keyPrefix = ""): ReactNode[] {
  const tokens = text.split(INLINE).filter(Boolean);

  return tokens.map((token, i) => {
    const key = `${keyPrefix}${i}`;

    // Checked before italic: a bold token also starts and ends with "*".
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {renderInline(token.slice(2, -2), `${key}-`)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[0.85em] text-accent"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1), `${key}-`)}
        </em>
      );
    }
    return <Fragment key={key}>{token}</Fragment>;
  });
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-3 leading-relaxed text-foreground/90">
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  );
}

export function ProseInline({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}
