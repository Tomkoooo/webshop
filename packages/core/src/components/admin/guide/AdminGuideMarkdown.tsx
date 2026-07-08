"use client"

import Link from "next/link"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const markdownComponents: Components = {
  a: ({ href, children }) => {
    if (href?.startsWith("/admin") || href?.startsWith("/")) {
      return (
        <Link href={href} className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
      >
        {children}
      </a>
    )
  },
}

export function AdminGuideMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {markdown}
    </ReactMarkdown>
  )
}
