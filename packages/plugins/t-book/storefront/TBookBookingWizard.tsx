"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { ROOM_TYPE_SELECTION_KEY, PACKAGE_DEAL_SELECTION_KEY, matchingPackageDeals } from "../lib/hotel-pricing"
import {
  AttendeeFieldInput,
  BookingOptionField,
  BookingStepIndicator,
  optionVisible,
} from "./booking-fields"
import {
  createBooking,
  formatHuf,
  getEventDetail,
  quoteBooking,
  type TBookBookingAttendeePayload,
  type TBookPriceQuote,
  type TBookPublicAttendeeFieldDef,
  type TBookPublicEvent,
  type TBookPublicHotel,
  type TBookSelections,
} from "./tbook-public-api"
import { formatEventSchedule } from "../lib/event-schedule"
import { mergeRegistrationFieldSchemas, registrationUnitLabel } from "../lib/registration-fields"

type Copy = {
  stepTicket: string
  stepDetails: string
  stepReview: string
  guestsLabel: string
  hotelLabel: string
  hotelNone: string
  nightsLabel: string
  roomTypeLabel: string
  customerHeading: string
  customerHint: string
  attendeesHeading: string
  attendeesHint: string
  quoteCta: string
  payCta: string
  payLoading: string
  backLabel: string
  nextLabel: string
  reviewHeading: string
  totalLabel: string
  loadingEvent: string
  eventError: string
}

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

function emptyAttendeeRows(count: number): TBookBookingAttendeePayload[] {
  return Array.from({ length: count }, () => ({ fields: {} }))
}

function defaultSelectionsForHotel(hotel: TBookPublicHotel | null): TBookSelections {
  if (!hotel) return {}
  const selections: TBookSelections = {}
  const firstRoom = hotel.pricing.roomTypes[0]
  if (firstRoom) selections[ROOM_TYPE_SELECTION_KEY] = firstRoom.key
  const options =
    hotel.pricing.extrasSection?.options ??
    hotel.pricing.addonGroups?.flatMap((group) => group.options) ??
    []
  for (const option of options) {
    if (option.defaultValue != null) selections[option.key] = option.defaultValue
    else if (option.type === "checkbox") selections[option.key] = false
    else if (option.type === "number") selections[option.key] = option.min ?? 0
    else if (option.type === "select" && option.choices?.[0])
      selections[option.key] = option.choices[0].value
    else if (option.type === "multiselect") selections[option.key] = []
  }
  return selections
}

function hotelDisplayCurrency(hotel: TBookPublicHotel | null, event: TBookPublicEvent | null): string {
  return hotel?.currency ?? event?.currency ?? "HUF"
}

export function TBookBookingWizard({
  apiKey,
  apiBase,
  eventId,
  copy,
}: {
  apiKey: string
  apiBase?: string
  eventId: string
  copy: Copy
}) {
  const steps = [copy.stepTicket, copy.stepDetails, copy.stepReview]
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [event, setEvent] = useState<TBookPublicEvent | null>(null)
  const [hotels, setHotels] = useState<TBookPublicHotel[]>([])

  const [guests, setGuests] = useState(1)
  const [nights, setNights] = useState(1)
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selections, setSelections] = useState<TBookSelections>({})
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", note: "" })
  const [attendees, setAttendees] = useState<TBookBookingAttendeePayload[]>([])
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === selectedHotelId) ?? null,
    [hotels, selectedHotelId]
  )
  const registrationFieldSchema = useMemo(
    () =>
      mergeRegistrationFieldSchemas(
        event?.attendeeFieldSchema,
        selectedHotel?.registrationFieldSchema
      ),
    [event?.attendeeFieldSchema, selectedHotel?.registrationFieldSchema]
  )
  const registrationUnit = event?.registrationUnit ?? "person"
  const guestUnitLabel = registrationUnitLabel(registrationUnit, guests)
  const displayCurrency = hotelDisplayCurrency(selectedHotel, event)
  const roomTypeKey = String(selections[ROOM_TYPE_SELECTION_KEY] ?? "")
  const availablePackages = useMemo(() => {
    if (!selectedHotel || !roomTypeKey) return []
    return matchingPackageDeals(
      {
        ...selectedHotel.pricing,
        roomTypes: selectedHotel.pricing.roomTypes,
        packages: selectedHotel.pricing.packages ?? [],
      },
      nights,
      roomTypeKey
    )
  }, [selectedHotel, nights, roomTypeKey])
  const extrasSection = selectedHotel?.pricing.extrasSection ?? null

  const loadEvent = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("A tBook API kulcs nincs beállítva.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getEventDetail(apiKey.trim(), eventId, apiBase)
      setEvent(res.event)
      setHotels(res.hotels)
      setNights(res.event.nights)
      setAttendees(emptyAttendeeRows(1))
      const firstHotel = res.hotels[0] ?? null
      setSelectedHotelId(firstHotel?.id ?? null)
      setSelections(defaultSelectionsForHotel(firstHotel))
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.eventError)
    } finally {
      setLoading(false)
    }
  }, [apiKey, apiBase, eventId, copy.eventError])

  useEffect(() => {
    void loadEvent()
  }, [loadEvent])

  useEffect(() => {
    setAttendees(emptyAttendeeRows(guests))
    setQuote(null)
  }, [guests, registrationFieldSchema.length])

  useEffect(() => {
    if (!selectedHotel) {
      setSelections({})
      return
    }
    setSelections(defaultSelectionsForHotel(selectedHotel))
    setQuote(null)
  }, [selectedHotelId, selectedHotel])

  const patchSelection = (key: string, value: string | number | boolean | string[]) => {
    setSelections((s) => ({ ...s, [key]: value }))
    setQuote(null)
  }

  const runQuote = async () => {
    if (!event) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await quoteBooking(
        apiKey.trim(),
        {
          eventId: event.id,
          guests,
          hotelId: selectedHotelId,
          nights: selectedHotelId ? nights : null,
          selections: selectedHotelId ? selections : null,
        },
        apiBase
      )
      setQuote(res.quote)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Árajánlat sikertelen")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const runBooking = async () => {
    if (!event) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await createBooking(
        apiKey.trim(),
        {
          eventId: event.id,
          guests,
          customer,
          attendees: registrationFieldSchema.length > 0 ? attendees : undefined,
          hotelId: selectedHotelId,
          nights: selectedHotelId ? nights : null,
          selections: selectedHotelId ? selections : null,
        },
        apiBase
      )
      window.location.href = res.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foglalás sikertelen")
      setSubmitting(false)
    }
  }

  const canProceedStep1 = guests >= 1
  const canProceedStep2 =
    customer.name.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    (registrationFieldSchema.length === 0 ||
      attendees.every((row) =>
        registrationFieldSchema.every((field) => {
          if (!field.required) return true
          const val = row.fields[field.key]
          return val != null && String(val).trim() !== ""
        })
      ))

  const goNext = async () => {
    if (step === 2) {
      const ok = await runQuote()
      if (ok) setStep(3)
      return
    }
    setStep((s) => Math.min(3, s + 1))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p>{copy.loadingEvent}</p>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-medium text-destructive">{error}</p>
        <Link href="/jegyek" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
          ← Vissza az eseményekhez
        </Link>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <Link
          href="/jegyek"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Vissza az eseményekhez
        </Link>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatEventSchedule(
              event.startDate,
              event.endDate,
              event.startTime,
              event.endTime
            )}
          </p>
        </div>
        <BookingStepIndicator steps={steps} current={step} />
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              {registrationUnit === "team" ? "Csapatok száma" : copy.guestsLabel}
            </span>
            <input
              type="number"
              min={1}
              max={50}
              className={INPUT}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{copy.hotelLabel}</span>
            <select
              className={INPUT}
              value={selectedHotelId ?? ""}
              onChange={(e) => setSelectedHotelId(e.target.value || null)}
            >
              <option value="">{copy.hotelNone}</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.distanceFromVenueKm != null ? ` (${h.distanceFromVenueKm} km)` : ""}
                </option>
              ))}
            </select>
          </label>

          {selectedHotel ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">{copy.nightsLabel}</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className={INPUT}
                    value={nights}
                    onChange={(e) => {
                      setNights(Number(e.target.value))
                      setQuote(null)
                    }}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">{copy.roomTypeLabel}</span>
                  <select
                    className={INPUT}
                    value={roomTypeKey}
                    onChange={(e) => {
                      patchSelection(ROOM_TYPE_SELECTION_KEY, e.target.value)
                      patchSelection(PACKAGE_DEAL_SELECTION_KEY, "")
                    }}
                  >
                    {selectedHotel.pricing.roomTypes.map((room) => (
                      <option key={room.key} value={room.key}>
                        {room.label} — {formatHuf(room.baseRateHuf, displayCurrency)} / fő / éj
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {availablePackages.length > 0 ? (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Csomagajánlat</span>
                  <select
                    className={INPUT}
                    value={String(selections[PACKAGE_DEAL_SELECTION_KEY] ?? "")}
                    onChange={(e) => patchSelection(PACKAGE_DEAL_SELECTION_KEY, e.target.value)}
                  >
                    <option value="">Per-éjszaka ár</option>
                    {availablePackages.map((pkg) => (
                      <option key={pkg.key} value={pkg.key}>
                        {pkg.label} — {formatHuf(pkg.priceHuf, displayCurrency)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {extrasSection ? (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold">{extrasSection.label}</p>
                    {extrasSection.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{extrasSection.description}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {extrasSection.options.map((option) => (
                      <BookingOptionField
                        key={option.key}
                        option={option}
                        value={selections[option.key]}
                        visible={optionVisible(option, selections)}
                        onChange={(v) => patchSelection(option.key, v)}
                        inputClassName={INPUT}
                      />
                    ))}
                  </div>
                </div>
              ) : selectedHotel.pricing.addonGroups?.map((group) => (
                <div key={group.key} className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">{group.label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.options.map((option) => (
                      <BookingOptionField
                        key={option.key}
                        option={option}
                        value={selections[option.key]}
                        visible={optionVisible(option, selections)}
                        onChange={(v) => patchSelection(option.key, v)}
                        inputClassName={INPUT}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{copy.customerHeading}</h2>
            <p className="text-sm text-muted-foreground">{copy.customerHint}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={INPUT}
                placeholder="Név *"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                required
              />
              <input
                className={INPUT}
                type="email"
                placeholder="Email *"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                required
              />
              <input
                className={`${INPUT} sm:col-span-2`}
                type="tel"
                placeholder="Telefon *"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          {registrationFieldSchema.length > 0 ? (
            <div className="space-y-4 border-t border-border pt-4">
              <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedHotel && (selectedHotel.registrationFieldSchema?.length ?? 0) > 0
                  ? `Az esemény és a választott szállás (${selectedHotel.name}) által kért adatok. `
                  : ""}
                {copy.attendeesHint}
              </p>
              {attendees.map((attendee, index) => (
                <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">
                    {index + 1}. {guestUnitLabel}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {registrationFieldSchema.map((field) => (
                      <AttendeeFieldInput
                        key={field.key}
                        field={field}
                        value={attendee.fields[field.key]}
                        onChange={(value) =>
                          setAttendees((rows) =>
                            rows.map((row, i) =>
                              i === index ? { fields: { ...row.fields, [field.key]: value } } : row
                            )
                          )
                        }
                        inputClassName={INPUT}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 3 && quote ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{copy.reviewHeading}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Esemény</dt>
              <dd className="font-medium text-right">{event.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {registrationUnit === "team" ? "Csapatok" : copy.guestsLabel}
              </dt>
              <dd className="font-medium">
                {guests} {guestUnitLabel}
              </dd>
            </div>
            {selectedHotel ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Szállás</dt>
                <dd className="font-medium text-right">{selectedHotel.name}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Kapcsolattartó</dt>
              <dd className="font-medium text-right">{customer.name}</dd>
            </div>
          </dl>
          <ul className="space-y-1 border-t border-border pt-4 text-sm">
            {quote.lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-4 text-muted-foreground">
                <span>{line.label}</span>
                <span>{formatHuf(line.amountHuf, displayCurrency)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold text-primary">
            {copy.totalLabel}: {formatHuf(quote.totalHuf, displayCurrency)}
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            onClick={() => setStep((s) => s - 1)}
            disabled={submitting}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {copy.backLabel}
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
            onClick={() => void goNext()}
          >
            {step === 2 ? copy.quoteCta : copy.nextLabel}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || !quote}
            onClick={() => void runBooking()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {copy.payLoading}
              </>
            ) : (
              copy.payCta
            )}
          </button>
        )}
      </div>
    </div>
  )
}
