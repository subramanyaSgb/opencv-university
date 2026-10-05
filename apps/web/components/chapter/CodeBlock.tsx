"use client";

import { isValidElement, useState, type ReactNode } from "react";
import { textOf } from "@/lib/slug";

/**
 * Replaces MDX `pre`. ```text blocks render as flow diagrams (no copy button);
 * code blocks get a language label and a Copy button.
 */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const className =
    isValidElement<{ className?: string }>(children) ? children.props.className ?? "" : "";
  const lang = /language-(\w+)/.exec(className)?.[1] ?? "";
  const code = textOf(children).replace(/\n$/, "");

  if (lang === "text") {
    return <pre className="diagram">{code}</pre>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code">
      <div className="code-bar">
        <span>{lang || "code"}</span>
        <button type="button" onClick={copy} aria-label="Copy code to clipboard">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}
