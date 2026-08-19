"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Play } from "lucide-react";
import type { CodeLanguage } from "@/content/types";
import { playgroundTargetFor, sendCodeToPlayground } from "@/lib/playgroundHandoff";

export function CodeBlockActions({
  code,
  language,
}: {
  code: string;
  language: CodeLanguage;
}) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  // `bash` blocks are commands to paste into a terminal, so there is nothing
  // for the playground to open.
  const target = playgroundTargetFor(language);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleTryIt() {
    if (!target) return;
    sendCodeToPlayground({ code, language: target });
    router.push("/playground");
  }

  return (
    <div className="flex items-center gap-1">
      {target && (
        <button
          type="button"
          onClick={handleTryIt}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
          aria-label="Open this code in the playground"
        >
          <Play className="h-3.5 w-3.5" />
          Try it
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
