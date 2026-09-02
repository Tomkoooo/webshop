"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"

export type Chapter = { id: string; label: string }

export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(chapters[0]?.id ?? "")

  useEffect(() => {
    if (chapters.length === 0) return
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActive(visible.target.id)
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0.1, 0.4, 0.7] }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [chapters])

  if (chapters.length < 2) return null

  return (
    <nav className="esv2-chapter-rail" aria-label="Section navigation">
      {chapters.map((c) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          data-active={active === c.id}
          title={c.label}
          aria-label={c.label}
          className={cn("esv2-focus rounded-full")}
        />
      ))}
    </nav>
  )
}
