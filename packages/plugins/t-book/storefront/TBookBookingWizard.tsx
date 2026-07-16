"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import {
  ROOM_TYPE_SELECTION_KEY,
  PACKAGE_DEAL_SELECTION_KEY,
  PACKAGE_UNITS_SELECTION_KEY,
  findPackageDeal,
  guestPackageDeals,
  hotelRequiresPackageSelection,
  hotelShowsPackageSelection,
  hotelShowsRoomSelection,
  packageUnitsForGuests,
  resolveAccommodationMode,
} from "../lib/hotel-pricing"
import { suggestPackageCombinations } from "../lib/package-optimization"
import {
  accommodationGuestCount,
  needsPlayerMemberForms,
  playerFieldSchema,
  playerRosterSize,
  resolvePlayersPerTicket,
} from "../lib/registration-headcount"
import { AccommodationOptionCards } from "./AccommodationOptionCards"
import { PackageSelectionCards } from "./PackageSelectionCards"
import {
  BookingBillingForm,
  emptyBillingForm,
  isBillingFormValid,
  type BillingFormState,
} from "./BookingBillingForm"
import {
  AttendeeFieldInput,
  BookingOptionField,
  BookingStepIndicator,
  optionVisible,
  selectionOptionValue,
} from "./booking-fields"
import {
  createBooking,
  formatHuf,
  getEventDetail,
  quoteBooking,
  type TBookBookingAttendeePayload,
  type TBookPriceQuote,
  type TBookPublicEvent,
  type TBookPublicHotel,
  type TBookSelections,
} from "./tbook-public-api"
import { formatEventSchedule } from "../lib/event-schedule"
import { mergeRegistrationFieldSchemas, registrationUnitLabel } from "../lib/registration-fields"
import type { TBookPublicEventDetailResult } from "../lib/fetch-public-storefront"

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

function emptyAttendeeRows(
  count: number,
  memberCount: number,
  withMembers: boolean
): TBookBookingAttendeePayload[] {
  return Array.from({ length: count }, () =>
    withMembers
      ? {
          fields: {},
          members: Array.from({ length: memberCount }, () => ({ fields: {} })),
        }
      : { fields: {} }
  )
}

function defaultSelectionsForHotel(hotel: TBookPublicHotel | null): TBookSelections {
  if (!hotel) return {}
  const selections: TBookSelections = {}
  const mode = resolveAccommodationMode(hotel.pricing)
  if (mode === "packages") {
    const firstPkg = hotel.pricing.packages?.[0]
    if (firstPkg) selections[PACKAGE_DEAL_SELECTION_KEY] = firstPkg.key
  } else {
    const firstRoom = hotel.pricing.roomTypes[0]
    if (firstRoom) selections[ROOM_TYPE_SELECTION_KEY] = firstRoom.key
  }
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

function applyEventDetailToWizardState(
  detail: Pick<TBookPublicEventDetailResult, "event" | "hotels" | "error">,
  setters: {
    setEvent: (event: TBookPublicEvent | null) => void
    setHotels: (hotels: TBookPublicHotel[]) => void
    setNights: (nights: number) => void
    setAttendees: (rows: TBookBookingAttendeePayload[]) => void
    setSelectedHotelId: (id: string | null) => void
    setSelections: (selections: TBookSelections) => void
    setError: (error: string | null) => void
  },
  fallbackError: string
) {
  if (detail.error || !detail.event) {
    setters.setEvent(null)
    setters.setHotels([])
    setters.setError(detail.error ?? fallbackError)
    return
  }
  const eventDetail = detail.event
  const rosterSize = eventDetail ? resolvePlayersPerTicket(eventDetail) : 1
  const withMembers = eventDetail ? needsPlayerMemberForms(eventDetail) : false
  setters.setEvent(eventDetail)
  setters.setHotels(detail.hotels)
  setters.setNights(eventDetail?.nights ?? 1)
  setters.setAttendees(emptyAttendeeRows(1, rosterSize, withMembers))
  // Default: ticket only — guest opts into a hotel via cards
  setters.setSelectedHotelId(null)
  setters.setSelections({})
  setters.setError(null)
}

export function TBookBookingWizard({
  apiKey,
  eventId,
  copy,
  initialEventDetail,
}: {
  apiKey: string
  eventId: string
  copy: Copy
  /** When set, event detail was loaded on the server — same path as /jegyek. */
  initialEventDetail?: TBookPublicEventDetailResult
}) {
  const serverProvided = initialEventDetail !== undefined
  const steps = [copy.stepTicket, copy.stepDetails, copy.stepReview]
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(!serverProvided)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialEventDetail?.error ?? null)

  const [event, setEvent] = useState<TBookPublicEvent | null>(initialEventDetail?.event ?? null)
  const [hotels, setHotels] = useState<TBookPublicHotel[]>(initialEventDetail?.hotels ?? [])

  const [guests, setGuests] = useState(1)
  /** How many entries need rooms when a hotel is selected: all or a subset. */
  const [accommodationNeed, setAccommodationNeed] = useState<"all" | "some" | "none">("none")
  const [accommodationGuestOverride, setAccommodationGuestOverride] = useState(1)
  const [nights, setNights] = useState(initialEventDetail?.event?.nights ?? 1)
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selections, setSelections] = useState<TBookSelections>({})
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", note: "" })
  const [billing, setBilling] = useState<BillingFormState>(() => emptyBillingForm())
  const [attendees, setAttendees] = useState<TBookBookingAttendeePayload[]>([])
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [detailsTab, setDetailsTab] = useState<"guests" | "billing">("guests")
  const [liveQuoteLoading, setLiveQuoteLoading] = useState(false)

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === selectedHotelId) ?? null,
    [hotels, selectedHotelId]
  )
  const registrationFieldSchema = useMemo(
    () =>
      mergeRegistrationFieldSchemas(
        event?.attendeeFieldSchema,
        accommodationNeed === "none" ? undefined : selectedHotel?.registrationFieldSchema
      ),
    [
      event?.attendeeFieldSchema,
      accommodationNeed,
      selectedHotel?.registrationFieldSchema,
    ]
  )
  const registrationUnit = event?.registrationUnit ?? "person"
  const playersPerTicket = event ? resolvePlayersPerTicket(event) : 1
  const teamMemberFieldSchema = event?.teamMemberFieldSchema ?? []
  const teamMemberLimit = event?.teamMemberLimit ?? null
  const fixedRosterSize = event ? playerRosterSize(event) : null
  const guestUnitLabel = registrationUnitLabel(registrationUnit, guests)
  const needsPlayerMembers = event ? needsPlayerMemberForms(event) : false
  const maxAccommodationGuests = event ? accommodationGuestCount(guests, event) : guests
  const accommodationGuests =
    accommodationNeed === "none"
      ? 0
      : accommodationNeed === "some"
        ? Math.min(Math.max(1, accommodationGuestOverride), maxAccommodationGuests)
        : maxAccommodationGuests
  const effectiveHotelId = accommodationNeed === "none" ? null : selectedHotelId
  const playerFields = event ? playerFieldSchema(event) : teamMemberFieldSchema
  const displayCurrency = hotelDisplayCurrency(
    accommodationNeed === "none" ? null : selectedHotel,
    event
  )
  const accommodationMode = selectedHotel
    ? resolveAccommodationMode(selectedHotel.pricing)
    : "room_nights"
  const showRooms = selectedHotel ? hotelShowsRoomSelection(selectedHotel.pricing) : false
  const showPackages = selectedHotel ? hotelShowsPackageSelection(selectedHotel.pricing) : false
  const packagesRequired = selectedHotel ? hotelRequiresPackageSelection(selectedHotel.pricing) : false
  const roomTypeKey = String(selections[ROOM_TYPE_SELECTION_KEY] ?? "")
  const packageDealKey = String(selections[PACKAGE_DEAL_SELECTION_KEY] ?? "")
  const availablePackages = useMemo(() => {
    if (!selectedHotel || !showPackages) return []
    return guestPackageDeals(
      selectedHotel.pricing,
      packagesRequired ? undefined : nights,
      showRooms ? roomTypeKey : undefined
    )
  }, [selectedHotel, showPackages, packagesRequired, nights, showRooms, roomTypeKey])
  const packageSuggestions = useMemo(() => {
    if (!effectiveHotelId || !selectedHotel || !showPackages || accommodationGuests < 1) return []
    if (availablePackages.length === 0) return []
    return suggestPackageCombinations(accommodationGuests, availablePackages)
  }, [effectiveHotelId, selectedHotel, showPackages, accommodationGuests, availablePackages])
  const activePackageUnits = useMemo(() => {
    const raw = selections[PACKAGE_UNITS_SELECTION_KEY]
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, number>
    }
    return null
  }, [selections])
  const extrasSection = selectedHotel?.pricing.extrasSection ?? null

  useEffect(() => {
    if (!selectedHotel || accommodationMode !== "packages") return
    if (!packageDealKey) return
    const pkg = findPackageDeal(selectedHotel.pricing, packageDealKey)
    if (pkg && pkg.nights !== nights) setNights(pkg.nights)
  }, [selectedHotel, accommodationMode, packageDealKey, nights])

  useEffect(() => {
    if (accommodationNeed !== "some") return
    setAccommodationGuestOverride((prev) =>
      Math.min(Math.max(1, prev), Math.max(1, maxAccommodationGuests))
    )
  }, [accommodationNeed, maxAccommodationGuests])

  /** Keep selected package unit counts in sync with hotel headcount. */
  useEffect(() => {
    if (!effectiveHotelId || !selectedHotel || accommodationGuests < 1) return
    setSelections((s) => {
      const unitsRaw = s[PACKAGE_UNITS_SELECTION_KEY]
      if (unitsRaw && typeof unitsRaw === "object" && !Array.isArray(unitsRaw)) {
        const keys = Object.keys(unitsRaw as Record<string, number>)
        if (keys.length === 1) {
          const key = keys[0]
          const pkg = findPackageDeal(selectedHotel.pricing, key)
          if (!pkg) return s
          const needed = packageUnitsForGuests(pkg, accommodationGuests)
          if ((unitsRaw as Record<string, number>)[key] === needed) return s
          return { ...s, [PACKAGE_UNITS_SELECTION_KEY]: { [key]: needed } }
        }
        return s
      }
      const dealKey = String(s[PACKAGE_DEAL_SELECTION_KEY] ?? "")
      if (!dealKey) return s
      const pkg = findPackageDeal(selectedHotel.pricing, dealKey)
      if (!pkg) return s
      const needed = packageUnitsForGuests(pkg, accommodationGuests)
      const next: TBookSelections = { ...s }
      delete next[PACKAGE_DEAL_SELECTION_KEY]
      next[PACKAGE_UNITS_SELECTION_KEY] = { [dealKey]: needed }
      return next
    })
  }, [accommodationGuests, effectiveHotelId, selectedHotel])

  const loadEvent = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("tBook API key is not configured.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getEventDetail(apiKey.trim(), eventId)
      applyEventDetailToWizardState(
        { event: res.event, hotels: res.hotels, error: null },
        { setEvent, setHotels, setNights, setAttendees, setSelectedHotelId, setSelections, setError },
        copy.eventError
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.eventError)
    } finally {
      setLoading(false)
    }
  }, [apiKey, eventId, copy.eventError])

  useEffect(() => {
    if (serverProvided) return
    void loadEvent()
  }, [loadEvent, serverProvided])

  useEffect(() => {
    if (!event) return
    setAttendees(
      emptyAttendeeRows(guests, resolvePlayersPerTicket(event), needsPlayerMemberForms(event))
    )
    setQuote(null)
  }, [guests, event, registrationFieldSchema.length])

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

  useEffect(() => {
    if (billing.billingType === "personal" && customer.name.trim() && !billing.name.trim()) {
      setBilling((b) => ({ ...b, name: customer.name }))
    }
  }, [customer.name, billing.billingType, billing.name])

  const applyPackagePlan = (units: Record<string, number>) => {
    setSelections((s) => {
      const next: TBookSelections = { ...s }
      delete next[PACKAGE_DEAL_SELECTION_KEY]
      next[PACKAGE_UNITS_SELECTION_KEY] = units
      const firstKey = Object.keys(units)[0]
      const pkg = firstKey && selectedHotel ? findPackageDeal(selectedHotel.pricing, firstKey) : null
      if (pkg) setNights(pkg.nights)
      return next
    })
    setQuote(null)
  }

  const selectPackageForGuests = (key: string, pkgNights: number) => {
    if (!selectedHotel) return
    const pkg = findPackageDeal(selectedHotel.pricing, key)
    const units = pkg ? packageUnitsForGuests(pkg, accommodationGuests) : 1
    setSelections((s) => {
      const next: TBookSelections = { ...s }
      delete next[PACKAGE_DEAL_SELECTION_KEY]
      next[PACKAGE_UNITS_SELECTION_KEY] = { [key]: units }
      return next
    })
    if (packagesRequired) setNights(pkgNights)
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
          accommodationGuests,
          hotelId: effectiveHotelId,
          nights: effectiveHotelId ? nights : null,
          selections: effectiveHotelId ? selections : null,
        }
      )
      setQuote(res.quote)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate price")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!event || !apiKey.trim() || step !== 1) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLiveQuoteLoading(true)
      quoteBooking(apiKey.trim(), {
        eventId: event.id,
        guests,
        accommodationGuests,
        hotelId: effectiveHotelId,
        nights: effectiveHotelId ? nights : null,
        selections: effectiveHotelId ? selections : null,
      })
        .then((res) => {
          if (!cancelled) setQuote(res.quote)
        })
        .catch(() => {
          if (!cancelled) setQuote(null)
        })
        .finally(() => {
          if (!cancelled) setLiveQuoteLoading(false)
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [apiKey, event, guests, accommodationGuests, effectiveHotelId, nights, selections, step])

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
          accommodationGuests,
          customer,
          billing,
          returnBaseUrl:
            typeof window !== "undefined" ? window.location.origin : undefined,
          attendees:
            registrationFieldSchema.length > 0 || needsPlayerMembers ? attendees : undefined,
          hotelId: effectiveHotelId,
          nights: effectiveHotelId ? nights : null,
          selections: effectiveHotelId ? selections : null,
        }
      )
      window.location.href = res.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed")
      setSubmitting(false)
    }
  }

  const canProceedStep1 =
    guests >= 1 &&
    (hotels.length === 0 ||
      accommodationNeed === "none" ||
      Boolean(selectedHotelId)) &&
    (accommodationNeed !== "some" || accommodationGuests >= 1)
  const canProceedStep2 =
    customer.name.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    isBillingFormValid(billing) &&
    (registrationFieldSchema.length === 0 && !needsPlayerMembers
      ? true
      : attendees.every((row) => {
          const teamFieldsOk =
            registrationFieldSchema.length === 0 ||
            registrationFieldSchema.every((field) => {
              if (!field.required) return true
              const val = row.fields[field.key]
              return val != null && String(val).trim() !== ""
            })
          if (!teamFieldsOk) return false
          if (!needsPlayerMembers) return true
          const members = row.members ?? []
          const requiredMembers = fixedRosterSize ?? 1
          if (members.length !== requiredMembers) return false
          return members.every((member) =>
            playerFields.every((field) => {
              if (!field.required) return true
              const val = member.fields[field.key]
              return val != null && String(val).trim() !== ""
            })
          )
        }))

  const guestsDetailsValid =
    registrationFieldSchema.length === 0 && !needsPlayerMembers
      ? true
      : attendees.every((row) => {
          const teamFieldsOk =
            registrationFieldSchema.length === 0 ||
            registrationFieldSchema.every((field) => {
              if (!field.required) return true
              const val = row.fields[field.key]
              return val != null && String(val).trim() !== ""
            })
          if (!teamFieldsOk) return false
          if (!needsPlayerMembers) return true
          const members = row.members ?? []
          const requiredMembers = fixedRosterSize ?? 1
          if (members.length !== requiredMembers) return false
          return members.every((member) =>
            playerFields.every((field) => {
              if (!field.required) return true
              const val = member.fields[field.key]
              return val != null && String(val).trim() !== ""
            })
          )
        })

  const goNext = async () => {
    if (step === 2) {
      if (!guestsDetailsValid) {
        setDetailsTab("guests")
        setError("Please complete participant details for every guest.")
        return
      }
      if (
        !customer.name.trim() ||
        !customer.email.trim() ||
        !customer.phone.trim() ||
        !isBillingFormValid(billing)
      ) {
        setDetailsTab("billing")
        setError("Please complete contact and billing details.")
        return
      }
      setError(null)
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
          ← Back to events
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
          Back to events
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
              {registrationUnit === "team"
                ? "Number of teams"
                : playersPerTicket > 1
                  ? `Number of tickets / entries (${playersPerTicket} players / ticket)`
                  : "Number of tickets / entries"}
            </span>
            <input
              type="number"
              min={1}
              max={50}
              className={INPUT}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {playersPerTicket > 1
                ? `${guests} ticket${guests === 1 ? "" : "s"} × ${playersPerTicket} players = ${maxAccommodationGuests} entries.`
                : "Entry fees are charged per ticket / entry."}
            </p>
          </label>

          {hotels.length > 0 ? (
            <AccommodationOptionCards
              hotels={hotels}
              selectedHotelId={selectedHotelId}
              ticketOnlySelected={accommodationNeed === "none" || !selectedHotelId}
              onSelectTicketOnly={() => {
                setAccommodationNeed("none")
                setSelectedHotelId(null)
                setSelections({})
                setQuote(null)
              }}
              onSelectHotel={(hotelId) => {
                setAccommodationNeed((prev) => (prev === "some" ? "some" : "all"))
                setSelectedHotelId(hotelId)
                setQuote(null)
              }}
            />
          ) : null}

          {effectiveHotelId && selectedHotel ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hotel packages are priced for{" "}
                  <strong className="text-foreground">{accommodationGuests}</strong> guest
                  {accommodationGuests === 1 ? "" : "s"}
                  {accommodationNeed === "some" && accommodationGuests < maxAccommodationGuests
                    ? ` (${maxAccommodationGuests - accommodationGuests} entries without room)`
                    : ""}
                  .
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      accommodationNeed === "all"
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-pressed={accommodationNeed === "all"}
                    onClick={() => {
                      setAccommodationNeed("all")
                      setQuote(null)
                    }}
                  >
                    Rooms for all entries ({maxAccommodationGuests})
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      accommodationNeed === "some"
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-pressed={accommodationNeed === "some"}
                    onClick={() => {
                      setAccommodationNeed("some")
                      setAccommodationGuestOverride(
                        Math.min(maxAccommodationGuests, Math.max(1, accommodationGuestOverride))
                      )
                      setQuote(null)
                    }}
                  >
                    Rooms for some entries
                  </button>
                </div>
                {accommodationNeed === "some" ? (
                  <label className="block max-w-xs space-y-1.5">
                    <span className="text-sm font-medium">
                      Guests needing accommodation (max {maxAccommodationGuests})
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={maxAccommodationGuests}
                      className={INPUT}
                      value={accommodationGuestOverride}
                      onChange={(e) => {
                        setAccommodationGuestOverride(Number(e.target.value) || 1)
                        setQuote(null)
                      }}
                    />
                  </label>
                ) : null}
              </div>

              {showRooms ? (
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
              ) : null}

              {showPackages && availablePackages.length > 0 ? (
                <PackageSelectionCards
                  packages={availablePackages}
                  packagesRequired={packagesRequired}
                  packageDealKey={packageDealKey}
                  activePackageUnits={activePackageUnits}
                  accommodationGuests={accommodationGuests}
                  displayCurrency={displayCurrency}
                  suggestions={packageSuggestions}
                  onSelectPackage={selectPackageForGuests}
                  onApplyPlan={applyPackagePlan}
                  onClearPackage={() => {
                    setSelections((s) => {
                      const next: TBookSelections = { ...s }
                      delete next[PACKAGE_DEAL_SELECTION_KEY]
                      delete next[PACKAGE_UNITS_SELECTION_KEY]
                      return next
                    })
                    setQuote(null)
                  }}
                />
              ) : null}

              {quote || liveQuoteLoading ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{copy.totalLabel}</p>
                    {liveQuoteLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                    ) : quote ? (
                      <p className="text-lg font-semibold tabular-nums">
                        {formatHuf(quote.totalHuf, displayCurrency)}
                      </p>
                    ) : null}
                  </div>
                  {quote ? (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {quote.lines.map((line) => (
                        <li key={line.key} className="flex justify-between gap-2">
                          <span>{line.label}</span>
                          <span className="tabular-nums">
                            {formatHuf(line.amountHuf, displayCurrency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
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
                        value={selectionOptionValue(selections, option.key)}
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
                        value={selectionOptionValue(selections, option.key)}
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
          <div
            className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1"
            role="tablist"
            aria-label="Details"
          >
            <button
              type="button"
              role="tab"
              aria-selected={detailsTab === "guests"}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                detailsTab === "guests"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDetailsTab("guests")}
            >
              {copy.attendeesHeading}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailsTab === "billing"}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                detailsTab === "billing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDetailsTab("billing")}
            >
              Billing
            </button>
          </div>

          {detailsTab === "guests" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {playersPerTicket > 1
                    ? `${playersPerTicket} player forms required per ticket (${guests} ticket${
                        guests === 1 ? "" : "s"
                      } → ${accommodationGuests} guests). `
                    : registrationUnit === "team"
                      ? `Enter details for each team member (max ${playersPerTicket} per team). `
                      : ""}
                  {copy.attendeesHint}
                </p>
              </div>

              {registrationFieldSchema.length > 0 || needsPlayerMembers ? (
                attendees.map((attendee, index) => (
                  <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold">
                      {index + 1}. {guestUnitLabel}
                    </p>
                    {registrationFieldSchema.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {registrationFieldSchema.map((field) => (
                          <AttendeeFieldInput
                            key={field.key}
                            field={field}
                            value={attendee.fields[field.key]}
                            onChange={(value) =>
                              setAttendees((rows) =>
                                rows.map((row, i) =>
                                  i === index
                                    ? { ...row, fields: { ...row.fields, [field.key]: value } }
                                    : row
                                )
                              )
                            }
                            inputClassName={INPUT}
                          />
                        ))}
                      </div>
                    ) : null}
                    {needsPlayerMembers ? (
                      <div className="space-y-3 border-t border-border pt-3">
                        <p className="text-sm font-medium">
                          {registrationUnit === "team" ? "Team members" : "Players"}
                        </p>
                        {(attendee.members ?? []).map((member, memberIndex) => (
                          <div key={memberIndex} className="space-y-2 rounded-lg bg-muted/30 p-3">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Player {memberIndex + 1}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {playerFields.map((field) => (
                                <AttendeeFieldInput
                                  key={field.key}
                                  field={field}
                                  value={member.fields[field.key]}
                                  onChange={(value) =>
                                    setAttendees((rows) =>
                                      rows.map((row, i) =>
                                        i === index
                                          ? {
                                              ...row,
                                              members: (row.members ?? []).map((m, mi) =>
                                                mi === memberIndex
                                                  ? { fields: { ...m.fields, [field.key]: value } }
                                                  : m
                                              ),
                                            }
                                          : row
                                      )
                                    )
                                  }
                                  inputClassName={INPUT}
                                />
                              ))}
                            </div>
                            {fixedRosterSize == null && (attendee.members ?? []).length > 1 ? (
                              <button
                                type="button"
                                className="text-xs text-destructive hover:underline"
                                onClick={() =>
                                  setAttendees((rows) =>
                                    rows.map((row, i) =>
                                      i === index
                                        ? {
                                            ...row,
                                            members: (row.members ?? []).filter(
                                              (_, mi) => mi !== memberIndex
                                            ),
                                          }
                                        : row
                                    )
                                  )
                                }
                              >
                                Remove player
                              </button>
                            ) : null}
                          </div>
                        ))}
                        {fixedRosterSize == null &&
                        (teamMemberLimit == null ||
                          (attendee.members ?? []).length < teamMemberLimit) ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() =>
                              setAttendees((rows) =>
                                rows.map((row, i) =>
                                  i === index
                                    ? {
                                        ...row,
                                        members: [...(row.members ?? []), { fields: {} }],
                                      }
                                    : row
                                )
                              )
                            }
                          >
                            + Add player
                            {teamMemberLimit != null ? ` (max ${teamMemberLimit})` : ""}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No participant fields are required for this event. Continue to billing.
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
                  onClick={() => setDetailsTab("billing")}
                >
                  Continue to billing
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{copy.customerHeading}</h2>
                <p className="text-sm text-muted-foreground">{copy.customerHint}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={INPUT}
                    placeholder="Name *"
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
                    placeholder="Phone *"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <BookingBillingForm billing={billing} onChange={setBilling} inputClassName={INPUT} />
            </div>
          )}
        </section>
      ) : null}

      {step === 3 && quote ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{copy.reviewHeading}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Event</dt>
              <dd className="font-medium text-right">{event.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {registrationUnit === "team" ? "Teams" : "Tickets / entries"}
              </dt>
              <dd className="font-medium">
                {guests} {guestUnitLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Accommodation</dt>
              <dd className="font-medium text-right">
                {effectiveHotelId && selectedHotel
                  ? `${selectedHotel.name} · ${accommodationGuests} guest${
                      accommodationGuests === 1 ? "" : "s"
                    }`
                  : "None"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Contact</dt>
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
