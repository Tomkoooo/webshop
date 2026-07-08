"use client";

import { cn } from "@wse/core/lib/utils";

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function ProductDescriptionBlock({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const content = String(html || "").trim();
  if (!content) return null;

  if (looksLikeHtml(content)) {
    return (
      <div
        className={cn(
          "prose prose-neutral max-w-none text-muted-foreground dark:prose-invert",
          "prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary",
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className={cn("text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap", className)}>
      {content}
    </p>
  );
}
