"use client"

import { useMemo, useState } from "react"
import {
  calculateBookingQuote,
  isOptionApplicable,
  validateHotelSelections,
} from "../lib/pricing"
import type { TBookHotelPricing, TBookSelections, TBookSelectionValue } from "../lib/pricing-types"
import {
  ROOM_TYPE_SELECTION_KEY,
  flattenAddonOptions,
  normalizeHotelPricing,
} from "../lib/hotel-pricing"
import { formatHuf } from "./t-book-api"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"

export function PricingPreview({
  ticketFeeHuf,
  ticketFeeMode,
  ticketPriceBasis = "gross",
  ticketVatPercent = 27,
  defaultNights,
  pricing,
}: {
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking"
  ticketPriceBasis?: "net" | "gross"
  ticketVatPercent?: number
  defaultNights: number
  pricing: TBookHotelPricing
}) {
  const normalized = useMemo(() => normalizeHotelPricing(pricing), [pricing])
  const [guests, setGuests] = useState(2)
  const [nights, setNights] = useState(defaultNights)
  const [withAccommodation, setWithAccommodation] = useState(true)
  const [selections, setSelections] = useState<TBookSelections>({})

  const setSelection = (key: string, value: TBookSelectionValue | null) => {
    setSelections((prev) => {
      const next = { ...prev }
      if (value == null || value === "") delete next[key]
      else next[key] = value
      return next
    })
  }

  const addonOptions = flattenAddonOptions(normalized)

  const { quote, errors } = useMemo(() => {
    const accommodation = withAccommodation ? pricing : null
    const errors = accommodation ? validateHotelSelections(pricing, selections) : []
    const quote = calculateBookingQuote({
      ticketFeeHuf,
      ticketFeeMode,
      ticketPriceBasis,
      ticketVatPercent,
      guests,
      nights,
      accommodation,
      selections,
    })
    return { quote, errors }
  }, [
    ticketFeeHuf,
    ticketFeeMode,
    ticketPriceBasis,
    ticketVatPercent,
    guests,
    nights,
    withAccommodation,
    pricing,
    selections,
  ])

  return (
    <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Élő ár-előnézet</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <TBookField label="Fő">
          <TBookInput
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          />
        </TBookField>
        <TBookField label="Éjszaka">
          <TBookInput
            type="number"
            min={1}
            value={nights}
            onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
          />
        </TBookField>
        <label className="flex items-center gap-2 text-sm text-neutral-300 pt-6">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={withAccommodation}
            onChange={(e) => setWithAccommodation(e.target.checked)}
          />
          Szállással
        </label>
      </div>

      {withAccommodation && normalized.roomTypes.length > 0 ? (
        <TBookField label="Szobatípus">
          <TBookSelect
            value={typeof selections[ROOM_TYPE_SELECTION_KEY] === "string" ? selections[ROOM_TYPE_SELECTION_KEY] : ""}
            onChange={(e) => setSelection(ROOM_TYPE_SELECTION_KEY, e.target.value || null)}
          >
            <option value="">— válassz —</option>
            {normalized.roomTypes.map((room) => (
              <option key={room.key} value={room.key}>
                {room.label} ({formatHuf(room.baseRateHuf)} / fő / éj)
              </option>
            ))}
          </TBookSelect>
        </TBookField>
      ) : null}

      {withAccommodation && addonOptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addonOptions.map((option) => {
            if (!option.key) return null
            if (!isOptionApplicable(option, selections)) return null
            const value = selections[option.key]
            switch (option.type) {
              case "select":
                return (
                  <TBookField key={option.key} label={option.label || option.key}>
                    <TBookSelect
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setSelection(option.key, e.target.value || null)}
                    >
                      <option value="">— nincs —</option>
                      {(option.choices ?? []).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                          {c.priceHuf ? ` (+${formatHuf(c.priceHuf)})` : ""}
                        </option>
                      ))}
                    </TBookSelect>
                  </TBookField>
                )
              case "multiselect":
                return (
                  <TBookField key={option.key} label={option.label || option.key}>
                    <div className="space-y-1.5 pt-1">
                      {(option.choices ?? []).map((c) => {
                        const current = Array.isArray(value) ? value : []
                        const checked = current.includes(c.value)
                        return (
                          <label
                            key={c.value}
                            className="flex items-center gap-2 text-sm text-neutral-300"
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...current, c.value]
                                  : current.filter((v) => v !== c.value)
                                setSelection(option.key, next.length ? next : null)
                              }}
                            />
                            {c.label}
                          </label>
                        )
                      })}
                    </div>
                  </TBookField>
                )
              case "number":
                return (
                  <TBookField key={option.key} label={option.label || option.key}>
                    <TBookInput
                      type="number"
                      min={option.min}
                      max={option.max}
                      value={typeof value === "number" ? value : ""}
                      onChange={(e) =>
                        setSelection(
                          option.key,
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </TBookField>
                )
              case "checkbox":
                return (
                  <label
                    key={option.key}
                    className="flex items-center gap-2 text-sm text-neutral-300 pt-6"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={value === true}
                      onChange={(e) => setSelection(option.key, e.target.checked ? true : null)}
                    />
                    {option.label || option.key}
                  </label>
                )
              default:
                return null
            }
          })}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <ul className="text-xs text-amber-300 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-white/10 pt-3 space-y-1">
        {quote.lines.map((line) => (
          <div key={line.key} className="flex justify-between text-sm">
            <span className="text-neutral-400">{line.label}</span>
            <span className="text-neutral-200">{formatHuf(line.amountHuf)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 text-base font-bold">
          <span className="text-white">Összesen</span>
          <span className="text-white">{formatHuf(quote.totalHuf)}</span>
        </div>
      </div>
    </div>
  )
}
