import * as React from "react"

/** Matches http(s) URLs and bare www. hosts in plain text. */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)}\]'"]/gi

function normalizeHref(raw: string): string {
  return raw.startsWith("www.") ? `https://${raw}` : raw
}

/**
 * Splits plain text into React nodes with external links opened in a new tab.
 */
export function linkifyPlainText(text: string): React.ReactNode[] {
  if (!text) return []

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  const matches = [...text.matchAll(URL_PATTERN)]

  for (const match of matches) {
    const url = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }
    nodes.push(
      <a
        key={`${index}-${url}`}
        href={normalizeHref(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-foreground underline underline-offset-4"
      >
        {url}
      </a>
    )
    lastIndex = index + url.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

export function PlainTextWithLinks({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return <span className={className}>{linkifyPlainText(text)}</span>
}
