"use client"

import { pressStart2P } from "../../../fonts"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { CampBookingContent } from "../schemas"

export function CampBookingRender({ content }: { content: CampBookingContent; deps?: unknown }) {
  const c = content
  return (
    <div className={`minecraft-page-mineshow px-4 py-10 ${pressStart2P.variable}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex gap-2 text-[10px] font-minecraft">
          {[c.stepOffers, c.stepDetails, c.stepReview].map((label, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded bg-[#1a3d5c] text-white"
            >
              {label}
            </span>
          ))}
        </div>
        <section className="minecraft-panel p-6 space-y-3">
          <h2 className="font-minecraft text-xs text-[#2d5016]">
            <EditableDocText path="ticketsHeading" value={c.ticketsHeading} />
          </h2>
          <p className="text-xs text-[#5c4a32]">
            <EditableDocText path="ticketTypeLabel" value={c.ticketTypeLabel} /> ·{" "}
            <EditableDocText path="childCountLabel" value={c.childCountLabel} />
          </p>
          <p className="text-xs text-[#5c4a32]">
            <EditableDocText path="addonsHint" value={c.addonsHint} multiline />
          </p>
        </section>
        <section className="minecraft-panel p-6 space-y-3">
          <h2 className="font-minecraft text-xs text-[#2d5016]">
            <EditableDocText path="buyerHeading" value={c.buyerHeading} />
          </h2>
          <h2 className="font-minecraft text-xs text-[#2d5016]">
            <EditableDocText path="childrenHeading" value={c.childrenHeading} />
          </h2>
        </section>
        <section className="minecraft-panel p-6 space-y-2">
          <h2 className="font-minecraft text-xs text-[#2d5016]">
            <EditableDocText path="reviewHeading" value={c.reviewHeading} />
          </h2>
          <p className="text-xs text-[#5c4a32]">
            <EditableDocText path="venueAddress" value={c.venueAddress} multiline />
          </p>
          <div className="flex gap-2 pt-2">
            <span className="minecraft-btn text-xs">
              <EditableDocText path="backLabel" value={c.backLabel} />
            </span>
            <span className="minecraft-btn bg-[#5D9B38] text-xs">
              <EditableDocText path="payCta" value={c.payCta} />
            </span>
            <span className="minecraft-btn-blue text-xs">
              <EditableDocText path="payStripeCta" value={c.payStripeCta} />
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
