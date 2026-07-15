"use client"

import { useMemo, useState } from "react"
import {
  calculateBookingQuote,
  isOptionApplicable,
  validateHotelSelections,
} from "../lib/pricing"
import type { TBookHotelPricing, TBookOptionDef, TBookSelections, TBookSelectionValue } from "../lib/pricing-types"
import {
  ROOM_TYPE_SELECTION_KEY,
  PACKAGE_DEAL_SELECTION_KEY,
  getExtrasSection,
  matchingPackageDeals,
  normalizeHotelPricing,
} from "../lib/hotel-pricing"
import { formatMoney } from "./t-book-api"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"

function renderOptionControl(
  option: TBookOptionDef,
  selections: TBookSelections,
  setSelection: (key: string, value: TBookSelectionValue | null) => void,
  currency: string
) {
  if (!option.key) return null
  if (!isOptionApplicable(option, selections)) return null
  const value = selections[option.key]

  switch (option.type) {
    case "select":
      return (
        <TBookField key={option.key} label={option.label || "Választó"}>
          <TBookSelect
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setSelection(option.key, e.target.value || null)}
          >
            <option value="">— válassz —</option>
            {(option.choices ?? []).map((c, index) => (
              <option key={c.value || `choice-${index}`} value={c.value}>
                {c.label}
                {c.priceHuf ? ` (+${formatMoney(c.priceHuf, currency)})` : ""}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
      )
    case "multiselect":
      return (
        <TBookField key={option.key} label={option.label || "Választó"}>
          <div className="space-y-1.5 pt-1">
            {(option.choices ?? []).map((c, index) => {
              const current = Array.isArray(value) ? value : []
              const choiceValue = c.value || `choice-${index}`
              const checked = current.includes(choiceValue)
              return (
                <label key={choiceValue} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...current, choiceValue]
                        : current.filter((v) => v !== choiceValue)
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
        <TBookField key={option.key} label={option.label || "Szám"}>
          <TBookInput
            type="number"
            min={option.min}
            max={option.max}
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              setSelection(option.key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </TBookField>
      )
    case "checkbox":
      return (
        <label key={option.key} className="flex items-center gap-2 text-sm text-foreground pt-6">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={value === true}
            onChange={(e) => setSelection(option.key, e.target.checked ? true : null)}
          />
          {option.label || "Jelölőnégyzet"}
        </label>
      )
    default:
      return null
  }
}

export function PricingPreview({
  ticketFeeHuf,
  ticketFeeMode,
  ticketPriceBasis = "gross",
  ticketVatPercent = 27,
  ticketCurrency = "HUF",
  hotelCurrency = "HUF",
  defaultNights,
  pricing,
}: {
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking" | "per_team"
  ticketPriceBasis?: "net" | "gross"
  ticketVatPercent?: number
  ticketCurrency?: string
  hotelCurrency?: string
  defaultNights: number
  pricing: TBookHotelPricing
}) {
  const displayCurrency = hotelCurrency || ticketCurrency
  const normalized = useMemo(() => normalizeHotelPricing(pricing), [pricing])
  const extrasSection = useMemo(() => getExtrasSection(normalized), [normalized])
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

  const roomTypeKey =
    typeof selections[ROOM_TYPE_SELECTION_KEY] === "string"
      ? selections[ROOM_TYPE_SELECTION_KEY]
      : ""
  const availablePackages = useMemo(
    () =>
      roomTypeKey
        ? matchingPackageDeals(normalized, nights, roomTypeKey)
        : [],
    [normalized, nights, roomTypeKey]
  )

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
    <div className="rounded-xl p-4 bg-primary/5 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Élő ár-előnézet</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Így látja a vendég a mezőket — a szakasz cím és leírás is megjelenik.
        </p>
      </div>
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
        <label className="flex items-center gap-2 text-sm text-foreground pt-6">
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
            value={roomTypeKey}
            onChange={(e) => {
              setSelection(ROOM_TYPE_SELECTION_KEY, e.target.value || null)
              setSelection(PACKAGE_DEAL_SELECTION_KEY, null)
            }}
          >
            <option value="">— válassz —</option>
            {normalized.roomTypes.map((room, index) => (
              <option key={room.key || `room-${index}`} value={room.key}>
                {room.label} ({formatMoney(room.baseRateHuf, displayCurrency)} / fő / éj)
              </option>
            ))}
          </TBookSelect>
        </TBookField>
      ) : null}

      {withAccommodation && availablePackages.length > 0 ? (
        <TBookField label="Csomagajánlat (opcionális)">
          <TBookSelect
            value={
              typeof selections[PACKAGE_DEAL_SELECTION_KEY] === "string"
                ? selections[PACKAGE_DEAL_SELECTION_KEY]
                : ""
            }
            onChange={(e) => setSelection(PACKAGE_DEAL_SELECTION_KEY, e.target.value || null)}
          >
            <option value="">Per-éjszaka ár</option>
            {availablePackages.map((pkg) => (
              <option key={pkg.key} value={pkg.key}>
                {pkg.label} — {formatMoney(pkg.priceHuf, displayCurrency)}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
      ) : null}

      {withAccommodation && extrasSection ? (
        <section className="rounded-lg bg-background/80 p-3 space-y-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {extrasSection.label || "Extrák"}
            </p>
            {extrasSection.description ? (
              <p className="text-xs text-muted-foreground mt-0.5">{extrasSection.description}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...extrasSection.options]
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((option) => renderOptionControl(option, selections, setSelection, displayCurrency))}
          </div>
        </section>
      ) : null}

      {errors.length > 0 ? (
        <ul className="text-xs text-amber-900 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-border pt-3 space-y-1">
        {quote.lines.map((line) => (
          <div key={line.key} className="flex justify-between text-sm gap-4">
            <span className="text-muted-foreground">{line.label}</span>
            <span className="text-foreground font-medium">
              {formatMoney(line.amountHuf, displayCurrency)}
            </span>
          </div>
        ))}
        <div className="flex justify-between pt-2 text-base font-bold">
          <span className="text-foreground font-semibold">Összesen</span>
          <span className="text-foreground font-semibold">
            {formatMoney(quote.totalHuf, displayCurrency)}
          </span>
        </div>
      </div>
    </div>
  )
}
