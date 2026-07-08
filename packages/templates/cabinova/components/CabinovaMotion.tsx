"use client"

import { cn } from "@wse/core/lib/utils"

export function CabinovaHeadline({
  text,
  className,
  as: Tag = "span",
}: {
  text: string
  className?: string
  as?: "span" | "h1" | "h2" | "h3"
}) {
  const words = text.split(" ")
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="cabinova-headline-word" style={{ ["--word-i" as string]: i }}>
          <span>{word}</span>
        </span>
      ))}
    </Tag>
  )
}

export function CabinovaMarquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="flex w-max cabinova-marquee gap-16 whitespace-nowrap">{children}{children}</div>
    </div>
  )
}
