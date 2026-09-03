"use client"

import { Beer, Calendar, Check } from "lucide-react"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookListContent } from "../schemas"

const PREVIEW_TICKETS = [
  {
    title: "Napijegy earlybird — Péntek",
    date: "2026. okt. 2.",
    price: "5 990 Ft",
    includes: ["Belépés", "3 db kóstolójegy"],
  },
  {
    title: "VIP Napijegy earlybird — Szombat",
    date: "2026. okt. 3.",
    price: "9 990 Ft",
    includes: ["Belépés", "7 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
  },
  {
    title: "Asztal 6 fő — Vasárnap",
    date: "2026. okt. 4.",
    price: "35 990 Ft",
    includes: ["Belépés 6 fő részére", "20 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
  },
]

export function TBookListRender({ content }: { content: TBookListContent }) {
  const c = content
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 max-w-2xl space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          <EditableDocText path="pageTitle" value={c.pageTitle} />
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          <EditableDocText path="pageIntro" value={c.pageIntro} multiline />
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PREVIEW_TICKETS.map((ticket) => (
          <article
            key={ticket.title}
            className="sorfeszt-event-card flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Beer className="size-5" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{ticket.title}</h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0 text-secondary" aria-hidden />
              {ticket.date}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {ticket.includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <p className="font-heading text-lg font-bold text-primary">{ticket.price}</p>
              <span className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                <EditableDocText path="bookCta" value={c.bookCta} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Előnézet — az éles oldalon a tBook események töltődnek be. A leírás mezőbe írd a jegy
        tartalmát (soronként).
      </p>
    </div>
  )
}
