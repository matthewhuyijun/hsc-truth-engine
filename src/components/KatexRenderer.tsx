"use client";

import katex from "katex";
import { useMemo } from "react";

interface KatexBlockProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function KatexBlock({ latex, displayMode = true, className = "" }: KatexBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return latex;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
