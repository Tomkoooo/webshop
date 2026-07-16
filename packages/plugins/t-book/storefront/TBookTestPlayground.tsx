"use client"

import { useCallback, useEffect, useState } from "react"
import { ROOM_TYPE_SELECTION_KEY } from "../lib/hotel-pricing"
import type {
  TBookPublicAttendeeFieldDef,
  TBookPublicHotel,
  TBookPublicOptionDef,
  TBookSelections,
  TBookBookingAttendeePayload,
} from "./tbook-public-api"
import {
  createBooking,
  formatHuf,
  getEventDetail,
  listEvents,
  quoteBooking,
  type TBookPriceQuote,
  type TBookPublicEvent,
} from "./tbook-public-api"
import { selectionOptionValue } from "./booking-fields"

const STORAGE_KEY = "tbook_test_api_key"

function optionVisible(option: TBookPublicOptionDef, selections: TBookSelections): boolean {
  if (!option.dependsOn) return true
  const current = selections[option.dependsOn.key]
  if (current == null) return false
  const values = Array.isArray(current) ? current.map(String) : [String(current)]
  return option.dependsOn.values.some((v) => values.includes(v))
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

function OptionField({
  option,
  value,
  onChange,
  visible,
}: {
  option: TBookPublicOptionDef
  value: string | number | boolean | string[] | undefined
  onChange: (v: string | number | boolean | string[]) => void
  visible: boolean
}) {
  if (!visible) return null

  const id = `opt-${option.key}`

  if (option.type === "select") {
    return (
      <label className="block space-y-1" htmlFor={id}>
        <span className="text-xs font-medium text-neutral-300">
          {option.label}
          {option.required ? " *" : ""}
        </span>
        <select
          id={id}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {!option.required ? <option value="">—</option> : null}
          {option.choices?.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
              {c.priceHuf ? ` (+${formatHuf(c.priceHuf)})` : ""}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (option.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          id={id}
          type="checkbox"
          className="rounded border-white/20"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {option.label}
        {option.unitPriceHuf ? ` (+${formatHuf(option.unitPriceHuf)})` : ""}
      </label>
    )
  }

  if (option.type === "number") {
    return (
      <label className="block space-y-1" htmlFor={id}>
        <span className="text-xs font-medium text-neutral-300">{option.label}</span>
        <input
          id={id}
          type="number"
          min={option.min}
          max={option.max}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          value={typeof value === "number" ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    )
  }

  return null
}

function emptyAttendeeRows(count: number): TBookBookingAttendeePayload[] {
  return Array.from({ length: count }, () => ({ fields: {} }))
}

function AttendeeFieldInput({
  field,
  value,
  onChange,
}: {
  field: TBookPublicAttendeeFieldDef
  value: string | number | undefined
  onChange: (value: string | number) => void
}) {
  const id = `attendee-${field.key}`
  const label = (
    <span className="text-xs font-medium text-neutral-300">
      {field.label}
      {field.required ? " *" : ""}
    </span>
  )

  if (field.type === "select") {
    return (
      <label className="block space-y-1" htmlFor={id}>
        {label}
        <select
          id={id}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {!field.required ? <option value="">—</option> : null}
          {field.choices?.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === "number") {
    return (
      <label className="block space-y-1" htmlFor={id}>
        {label}
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </label>
    )
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text"

  return (
    <label className="block space-y-1" htmlFor={id}>
      {label}
      <input
        id={id}
        type={inputType}
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function TBookTestPlayground({
  defaultApiKey = "",
  apiBase,
}: {
  defaultApiKey?: string
  /** Runtime API root from server env (split tester vs admin deploy). */
  apiBase?: string
}) {
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const [events, setEvents] = useState<TBookPublicEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hotels, setHotels] = useState<TBookPublicHotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [guests, setGuests] = useState(2)
  const [nights, setNights] = useState(1)
  const [attendeeFieldSchema, setAttendeeFieldSchema] = useState<TBookPublicAttendeeFieldDef[]>([])
  const [attendees, setAttendees] = useState<TBookBookingAttendeePayload[]>(() => emptyAttendeeRows(2))
  const [selections, setSelections] = useState<TBookSelections>({})
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [lastResponse, setLastResponse] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState({
    name: "Teszt Kapcsolattartó",
    email: "teszt@example.com",
    phone: "+36301234567",
    note: "API playground teszt foglalás",
  })

  useEffect(() => {
    setAttendees((prev) => {
      if (prev.length === guests) return prev
      if (prev.length < guests) {
        return [...prev, ...emptyAttendeeRows(guests - prev.length)]
      }
      return prev.slice(0, guests)
    })
  }, [guests])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setApiKey(stored)
    else if (defaultApiKey) setApiKey(defaultApiKey)
  }, [defaultApiKey])

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null
  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) ?? null

  const loadEvents = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("API kulcs szükséges")
      return
    }
    setLoading(true)
    setError(null)
    try {
      localStorage.setItem(STORAGE_KEY, apiKey.trim())
      const res = await listEvents(apiKey.trim(), apiBase)
      setEvents(res.events)
      setLastResponse(res)
      if (res.events.length === 1) setSelectedEventId(res.events[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }, [apiKey, apiBase])

  const loadEventDetail = useCallback(
    async (eventId: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await getEventDetail(apiKey.trim(), eventId, apiBase)
        setHotels(res.hotels)
        setNights(res.event.nights)
        setAttendeeFieldSchema(res.event.attendeeFieldSchema ?? [])
        setAttendees(emptyAttendeeRows(guests))
        setLastResponse(res)
        const firstHotel = res.hotels[0] ?? null
        setSelectedHotelId(firstHotel?.id ?? null)
        setSelections(defaultSelectionsForHotel(firstHotel))
        setQuote(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hiba")
      } finally {
        setLoading(false)
      }
    },
    [apiKey, apiBase]
  )

  useEffect(() => {
    if (selectedEventId) void loadEventDetail(selectedEventId)
  }, [selectedEventId, loadEventDetail])

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
    if (!selectedEventId) return
    setLoading(true)
    setError(null)
    try {
      const body = {
        eventId: selectedEventId,
        guests,
        hotelId: selectedHotelId,
        nights: selectedHotelId ? nights : null,
        selections: selectedHotelId ? selections : null,
      }
      const res = await quoteBooking(apiKey.trim(), body, apiBase)
      setQuote(res.quote)
      setLastResponse(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  const runBooking = async () => {
    if (!selectedEventId) return
    setLoading(true)
    setError(null)
    try {
      const res = await createBooking(apiKey.trim(), {
        eventId: selectedEventId,
        guests,
        customer,
        billing: {
          billingType: "personal",
          name: customer.name || "Teszt Vásárló",
          zip: "1011",
          city: "Budapest",
          street: "Teszt utca 1",
          countryCode: "HU",
          taxNumber: "",
        },
        returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        attendees: attendeeFieldSchema.length > 0 ? attendees : undefined,
        hotelId: selectedHotelId,
        nights: selectedHotelId ? nights : null,
        selections: selectedHotelId ? selections : null,
      }, apiBase)
      setLastResponse(res)
      window.location.href = res.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-white">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">tBook API playground</p>
        <h1 className="text-2xl font-bold">Foglalási folyamat teszt</h1>
        <p className="text-sm text-neutral-400 max-w-2xl">
          Publikus API végpontok kipróbálása: események listázása, részletek, árajánlat, Stripe
          checkout. A kulcs a csoporthoz tartozik — csak aktív események jelennek meg.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest">1. API kulcs</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-mono"
            placeholder="tbk_…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadEvents()}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            Események betöltése
          </button>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </section>

      {events.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest">2. Esemény</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  selectedEventId === event.id
                    ? "border-amber-400/60 bg-amber-500/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <p className="font-semibold">{event.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {new Date(event.startDate).toLocaleDateString("hu-HU")} –{" "}
                  {new Date(event.endDate).toLocaleDateString("hu-HU")} · {event.nights} éj
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Jegy: {formatHuf(event.ticketFeeHuf)}
                  {event.ticketFeeMode === "per_person" ? " / fő" : " / foglalás"}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedEvent ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest">3. Foglalás</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-400">Vendégek</span>
              <input
                type="number"
                min={1}
                max={50}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                value={guests}
                onChange={(e) => {
                  setGuests(Number(e.target.value))
                  setQuote(null)
                }}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-400">Szállás (opcionális)</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                value={selectedHotelId ?? ""}
                onChange={(e) => setSelectedHotelId(e.target.value || null)}
              >
                <option value="">Csak jegy (szállás nélkül)</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                    {h.distanceFromVenueKm != null ? ` (${h.distanceFromVenueKm} km)` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedHotel ? (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-400">Éjszakák</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    value={nights}
                    onChange={(e) => {
                      setNights(Number(e.target.value))
                      setQuote(null)
                    }}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-400">Szobatípus</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    value={String(selections[ROOM_TYPE_SELECTION_KEY] ?? "")}
                    onChange={(e) => patchSelection(ROOM_TYPE_SELECTION_KEY, e.target.value)}
                  >
                    {selectedHotel.pricing.roomTypes.map((room) => (
                      <option key={room.key} value={room.key}>
                        {room.label} — {formatHuf(room.baseRateHuf)} / fő / éj
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedHotel.pricing.extrasSection ? (
                <div className="space-y-3 rounded-xl border border-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {selectedHotel.pricing.extrasSection.label}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedHotel.pricing.extrasSection.options.map((option) => (
                      <OptionField
                        key={option.key}
                        option={option}
                        value={selectionOptionValue(selections, option.key)}
                        visible={optionVisible(option, selections)}
                        onChange={(v) => patchSelection(option.key, v)}
                      />
                    ))}
                  </div>
                </div>
              ) : selectedHotel.pricing.addonGroups?.map((group) => (
                <div key={group.key} className="space-y-3 rounded-xl border border-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {group.label}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.options.map((option) => (
                      <OptionField
                        key={option.key}
                        option={option}
                        value={selectionOptionValue(selections, option.key)}
                        visible={optionVisible(option, selections)}
                        onChange={(v) => patchSelection(option.key, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Kapcsolattartó (fizető / szervező)
            </p>
            <p className="text-xs text-neutral-500">
              Ezzel a személlyel tartják a kapcsolatot — különösen szállásfoglalásnál, ha másoknak
              foglal.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                placeholder="Név"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
                placeholder="Email"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              />
              <input
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Telefon"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
            </div>
          </div>

          {attendeeFieldSchema.length > 0 ? (
            <div className="border-t border-white/10 pt-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Résztvevők ({guests} fő)
              </p>
              <p className="text-xs text-neutral-500">
                Minden jegyhez külön adat — pl. név, életkor, állampolgárság az eligibilitáshoz.
              </p>
              {attendees.map((attendee, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 p-4 space-y-3"
                >
                  <p className="text-sm font-semibold text-white">{index + 1}. résztvevő</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attendeeFieldSchema.map((field) => (
                      <AttendeeFieldInput
                        key={field.key}
                        field={field}
                        value={attendee.fields[field.key]}
                        onChange={(value) =>
                          setAttendees((rows) =>
                            rows.map((row, i) =>
                              i === index
                                ? { fields: { ...row.fields, [field.key]: value } }
                                : row
                            )
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void runQuote()}
              className="rounded-lg border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/5 disabled:opacity-50"
            >
              Árajánlat (POST /quote)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runBooking()}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50"
            >
              Foglalás + Stripe (POST /bookings)
            </button>
          </div>

          {quote ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <p className="text-sm font-bold text-emerald-300">
                Összesen: {formatHuf(quote.totalHuf)}
              </p>
              <ul className="text-xs text-neutral-400 space-y-1">
                {quote.lines.map((line) => (
                  <li key={line.key}>
                    {line.label}: {formatHuf(line.amountHuf)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {lastResponse ? (
        <section className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Utolsó API válasz (debug)
          </h2>
          <pre className="text-xs text-neutral-400 overflow-auto max-h-64">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  )
}
