import * as React from "react"

export function TestimonialSourceLink({
  name,
  sourceUrl,
  className,
}: {
  name: string
  sourceUrl?: string
  className?: string
}) {
  if (!sourceUrl?.trim()) {
    return <>{name}</>
  }

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "hover:text-primary-foreground hover:underline underline-offset-4"}
    >
      {name}
    </a>
  )
}
