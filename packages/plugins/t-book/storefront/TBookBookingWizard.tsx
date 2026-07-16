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
  formatStayDateRange,
  preferPackageMatchingNights,
  recommendStayForEvents,
} from "../lib/stay-recommendation"
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

const WIZARD_STEPS = ["Entries", "Hotel", "Players", "Your details", "Review"] as const
const TOTAL_STEPS = WIZARD_STEPS.length

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

const CHOICE_CARD = (selected: boolean) =>
  `rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
    selected
      ? "border-primary bg-primary/10 shadow-sm"
      : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
  }`

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

function defaultSelectionsForHotel(
  hotel: TBookPublicHotel | null,
  recommendedNights?: number
): TBookSelections {
  if (!hotel) return {}
  const selections: TBookSelections = {}
  const mode = resolveAccommodationMode(hotel.pricing)
  if (mode === "packages") {
    const packages = hotel.pricing.packages ?? []
    const preferred =
      recommendedNights != null
        ? preferPackageMatchingNights(packages, recommendedNights)
        : packages[0]
    if (preferred) selections[PACKAGE_DEAL_SELECTION_KEY] = preferred.key
  } else {
    const firstRoom = hotel.pricing.roomTypes[0]
    if (firstRoom) selections[ROOM_TYPE_SELECTION_KEY] = firstRoom.key
    if (mode === "both" && recommendedNights != null) {
      const packages = hotel.pricing.packages ?? []
      const preferred = preferPackageMatchingNights(packages, recommendedNights)
      if (preferred) selections[PACKAGE_DEAL_SELECTION_KEY] = preferred.key
    }
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
  // Default: entry only — guest opts into a hotel via cards
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
  const steps = [...WIZARD_STEPS]
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
  const [wantsHotel, setWantsHotel] = useState<boolean | null>(null)
  const [extraNightAfter, setExtraNightAfter] = useState(false)

  const stayRecommendation = useMemo(
    () => (event ? recommendStayForEvents([event], { extraNightAfter }) : null),
    [event, extraNightAfter]
  )
  const recommendedNights = stayRecommendation?.nights ?? event?.nights ?? 1
  const recommendedStayLabel = stayRecommendation
    ? formatStayDateRange(stayRecommendation.startDate, stayRecommendation.endDate)
    : null

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
    // Only sync nights when the guest explicitly picked a package (key present).
    // Do not override the event-recommended nights with an unrelated first package.
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
    if (!selectedHotelId) {
      setSelections({})
      return
    }
    if (!selectedHotel) return
    const next = defaultSelectionsForHotel(selectedHotel, recommendedNights)
    setSelections(next)
    const dealKey = String(next[PACKAGE_DEAL_SELECTION_KEY] ?? "")
    if (dealKey) {
      const pkg = findPackageDeal(selectedHotel.pricing, dealKey)
      if (pkg) setNights(pkg.nights)
      else setNights(recommendedNights)
    } else {
      setNights(recommendedNights)
    }
    setQuote(null)
  }, [selectedHotelId, selectedHotel])

  useEffect(() => {
    if (!event) return
    setNights(recommendedNights)
    setQuote(null)
  }, [extraNightAfter, recommendedNights, event])

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

  const attendeesValid =
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

  const step1Valid = guests >= 1

  const step2Valid =
    hotels.length === 0 ||
    wantsHotel === false ||
    (wantsHotel === true &&
      Boolean(selectedHotelId) &&
      (accommodationNeed !== "some" || accommodationGuests >= 1))

  const step3Valid = attendeesValid

  const step4Valid =
    customer.name.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    isBillingFormValid(billing)

  const canProceedCurrentStep =
    step === 1
      ? step1Valid
      : step === 2
        ? step2Valid && (hotels.length === 0 || wantsHotel !== null)
        : step === 3
          ? step3Valid
          : step === 4
            ? step4Valid
            : Boolean(quote)

  const goNext = async () => {
    if (step === 1) {
      if (!step1Valid) {
        setError("Please enter at least one entry.")
        return
      }
      setError(null)
      setStep(2)
      return
    }
    if (step === 2) {
      if (hotels.length > 0 && wantsHotel === null) {
        setError("Please choose whether you need a hotel room.")
        return
      }
      if (!step2Valid) {
        setError("Please complete your hotel selection, or choose tickets only.")
        return
      }
      setError(null)
      setStep(3)
      return
    }
    if (step === 3) {
      if (!step3Valid) {
        setError("Please complete participant details for every entry.")
        return
      }
      setError(null)
      setStep(4)
      return
    }
    if (step === 4) {
      if (!step4Valid) {
        setError("Please complete contact and billing details.")
        return
      }
      setError(null)
      setQuote(null)
      setStep(5)
      const ok = await runQuote()
      if (!ok) setStep(4)
      return
    }
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
          <div>
            <h2 className="text-lg font-semibold">How many entries?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us how many tickets you need. You can add a hotel on the next step.
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              {registrationUnit === "team"
                ? "Number of teams"
                : playersPerTicket > 1
                  ? `${copy.guestsLabel} (${playersPerTicket} players / entry)`
                  : copy.guestsLabel}
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
                ? `${guests} ${guests === 1 ? "entry" : "entries"} × ${playersPerTicket} players = ${maxAccommodationGuests} people total.`
                : `${guests} ${guests === 1 ? "person" : "people"} total.`}
            </p>
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          {hotels.length > 0 ? (
            <>
              <div>
                <h2 className="text-lg font-semibold">Do you need a hotel room?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can book tickets only, or add a hotel stay for your group.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={CHOICE_CARD(wantsHotel === false)}
                  aria-pressed={wantsHotel === false}
                  onClick={() => {
                    setWantsHotel(false)
                    setAccommodationNeed("none")
                    setSelectedHotelId(null)
                    setSelections({})
                    setQuote(null)
                  }}
                >
                  <span className="block text-sm font-semibold">No hotel — tickets only</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Entry fees only. No room booking.
                  </span>
                </button>
                <button
                  type="button"
                  className={CHOICE_CARD(wantsHotel === true)}
                  aria-pressed={wantsHotel === true}
                  onClick={() => {
                    setWantsHotel(true)
                    setAccommodationNeed((prev) => (prev === "some" ? "some" : "all"))
                  }}
                >
                  <span className="block text-sm font-semibold">Yes, I need a hotel</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Pick a hotel and room package below.
                  </span>
                </button>
              </div>

              {wantsHotel ? (
                <>
                  <AccommodationOptionCards
                    hotels={hotels}
                    selectedHotelId={selectedHotelId}
                    ticketOnlySelected={false}
                    hideEntryOnlyOption
                    onSelectTicketOnly={() => {
                      setWantsHotel(false)
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
                        <p className="text-sm font-medium">Who needs a room?</p>
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
                            Everyone ({maxAccommodationGuests})
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
                            Some people only
                          </button>
                        </div>
                        {accommodationNeed === "some" ? (
                          <label className="block max-w-xs space-y-1.5">
                            <span className="text-sm font-medium">
                              How many need a room? (max {maxAccommodationGuests})
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

                      {recommendedStayLabel ? (
                        <p className="text-sm text-muted-foreground">
                          Suggested stay: {recommendedNights} night
                          {recommendedNights === 1 ? "" : "s"} ({recommendedStayLabel})
                        </p>
                      ) : null}

                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2.5">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-border"
                          checked={extraNightAfter}
                          onChange={(e) => {
                            setExtraNightAfter(e.target.checked)
                            setQuote(null)
                          }}
                        />
                        <span className="text-sm">Stay one extra night after the event</span>
                      </label>

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
                                  {room.label} — {formatHuf(room.baseRateHuf, displayCurrency)} / person / night
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
                          recommendedNights={recommendedNights}
                          recommendedLabel={recommendedStayLabel}
                          onSelectPackage={selectPackageForGuests}
                          onApplyPlan={applyPackagePlan}
                          onClearPackage={() => {
                            setSelections((s) => {
                              const next: TBookSelections = { ...s }
                              delete next[PACKAGE_DEAL_SELECTION_KEY]
                              delete next[PACKAGE_UNITS_SELECTION_KEY]
                              return next
                            })
                            setNights(recommendedNights)
                            setQuote(null)
                          }}
                        />
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
                </>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hotel options are available for this event. Continue to enter player details.
            </p>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {playersPerTicket > 1
                ? `${playersPerTicket} player forms per entry (${guests} ${
                    guests === 1 ? "entry" : "entries"
                  } = ${maxAccommodationGuests} players). `
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
              No player details are required for this event.
            </p>
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
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
              <textarea
                className={`${INPUT} sm:col-span-2`}
                placeholder="Note (optional)"
                rows={2}
                value={customer.note}
                onChange={(e) => setCustomer((c) => ({ ...c, note: e.target.value }))}
              />
            </div>
          </div>
          <BookingBillingForm billing={billing} onChange={setBilling} inputClassName={INPUT} />
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{copy.reviewHeading}</h2>
          {submitting || !quote ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" aria-hidden />
              <p className="text-sm">Calculating your total…</p>
            </div>
          ) : (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Event</dt>
                  <dd className="font-medium text-right">{event.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {registrationUnit === "team" ? "Teams" : "Entries"}
                  </dt>
                  <dd className="font-medium">
                    {guests} {guestUnitLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Hotel</dt>
                  <dd className="font-medium text-right">
                    {effectiveHotelId && selectedHotel
                      ? `${selectedHotel.name} · ${accommodationGuests} guest${
                          accommodationGuests === 1 ? "" : "s"
                        }`
                      : "Tickets only"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Players</dt>
                  <dd className="font-medium">{maxAccommodationGuests}</dd>
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
            </>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            onClick={() => {
              setError(null)
              if (step === 5) setQuote(null)
              setStep((s) => s - 1)
            }}
            disabled={submitting}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {copy.backLabel}
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || !canProceedCurrentStep}
            onClick={() => void goNext()}
          >
            {step === 4 ? copy.quoteCta : copy.nextLabel}
            {step === 4 && submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
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
