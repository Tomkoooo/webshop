"use client"

import { Calendar, MapPin, Ticket } from "lucide-react"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookListContent } from "../schemas"

const PREVIEW_EVENTS = [
  {
    title: "WDF World Masters — Férfi",
    date: "2025. okt. 29.",
    venue: "Gerevich Aladár Nemzeti Sportcsarnok",
    price: "€40 / fő",
  },
  {
    title: "Hungarian Open — Női",
    date: "2025. okt. 25.",
    venue: "Budapest",
    price: "€35 / fő",
  },
]

export function TBookListRender({ content }: { content: TBookListContent }) {
  const c = content
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 max-w-2xl space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          <EditableDocText path="pageTitle" value={c.pageTitle} />
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          <EditableDocText path="pageIntro" value={c.pageIntro} multiline />
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PREVIEW_EVENTS.map((event) => (
          <article
            key={event.title}
            className="flex flex-col rounded-2xl border border-border/60 bg-surface p-5 shadow-sm"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15">
              <Ticket className="size-5 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{event.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
                {event.date}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                {event.venue}
              </li>
            </ul>
            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <p className="text-sm font-medium text-foreground">{event.price}</p>
              <span className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
                <EditableDocText path="bookCta" value={c.bookCta} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Előnézet — az éles oldalon a tBook API tölti be az eseményeket.
      </p>
    </div>
  )
}
