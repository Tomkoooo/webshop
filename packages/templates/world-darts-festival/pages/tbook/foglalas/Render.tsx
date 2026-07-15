"use client"

import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookBookingContent } from "../schemas"

const STEPS = ["stepTicket", "stepDetails", "stepReview"] as const

export function TBookBookingRender({ content }: { content: TBookBookingContent }) {
  const c = content
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {STEPS.map((stepKey, index) => (
          <div key={stepKey} className="flex items-center gap-2">
            <span
              className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold ${
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </span>
            <span className={index === 0 ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>
              <EditableDocText path={stepKey} value={c[stepKey]} />
            </span>
            {index < STEPS.length - 1 ? (
              <span className="mx-1 hidden text-muted-foreground sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Foglalás előnézet</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <EditableDocText path="guestsLabel" value={c.guestsLabel} />
            </p>
            <p className="text-sm text-foreground">2 fő</p>
          </div>
          <div className="space-y-1.5 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <EditableDocText path="hotelLabel" value={c.hotelLabel} />
            </p>
            <p className="text-sm text-foreground">
              <EditableDocText path="hotelNone" value={c.hotelNone} />
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Űrlap előnézet — az éles oldalon a tBook API vezérli a foglalási folyamatot.
        </div>
        <div className="flex justify-between gap-3 pt-2">
          <span className="inline-flex min-h-10 items-center rounded-lg border border-border/60 px-4 text-sm text-muted-foreground">
            <EditableDocText path="backLabel" value={c.backLabel} />
          </span>
          <span className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <EditableDocText path="nextLabel" value={c.nextLabel} />
          </span>
        </div>
      </div>
    </div>
  )
}
