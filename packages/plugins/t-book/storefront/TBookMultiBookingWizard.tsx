"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
  createMultiBooking,
  formatHuf,
  getEventDetail,
  quoteMultiBooking,
  type TBookBookingAttendeePayload,
  type TBookMultiQuoteEntry,
  type TBookPriceQuote,
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

type LodgingMode = "combined" | "separate"

type LodgingState = {
  accommodationNeed: "all" | "some" | "none"
  accommodationGuestOverride: number
  selectedHotelId: string | null
  nights: number
  selections: TBookSelections
}

type LoadedEvent = {
  event: TBookPublicEvent
}

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

function emptyLodgingState(recommendedNights = 1): LodgingState {
  return {
    accommodationNeed: "none",
    accommodationGuestOverride: 1,
    selectedHotelId: null,
    nights: recommendedNights,
    selections: {},
  }
}

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

function hotelDisplayCurrency(
  hotel: TBookPublicHotel | null,
  fallbackEvent: TBookPublicEvent | null
): string {
  return hotel?.currency ?? fallbackEvent?.currency ?? "HUF"
}

function resolveAccommodationGuests(
  lodging: LodgingState,
  maxGuests: number
): number {
  if (lodging.accommodationNeed === "none") return 0
  if (lodging.accommodationNeed === "some") {
    return Math.min(Math.max(1, lodging.accommodationGuestOverride), maxGuests)
  }
  return maxGuests
}

function attendeesValidForEvent(
  event: TBookPublicEvent,
  rows: TBookBookingAttendeePayload[],
  selectedHotel: TBookPublicHotel | null,
  accommodationNeed: "all" | "some" | "none"
): boolean {
  const registrationFieldSchema = mergeRegistrationFieldSchemas(
    event.attendeeFieldSchema,
    accommodationNeed === "none" ? undefined : selectedHotel?.registrationFieldSchema
  )
  const needsPlayerMembers = needsPlayerMemberForms(event)
  const playerFields = playerFieldSchema(event)
  const fixedRosterSize = playerRosterSize(event)

  if (registrationFieldSchema.length === 0 && !needsPlayerMembers) return true

  return rows.every((row) => {
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
}

type HotelLodgingPanelProps = {
  hotels: TBookPublicHotel[]
  lodging: LodgingState
  onLodgingChange: (next: LodgingState) => void
  maxAccommodationGuests: number
  recommendedNights: number
  recommendedStayLabel: string | null
  fallbackEvent: TBookPublicEvent
  copy: Copy
  onQuoteReset: () => void
}

function HotelLodgingPanel({
  hotels,
  lodging,
  onLodgingChange,
  maxAccommodationGuests,
  recommendedNights,
  recommendedStayLabel,
  fallbackEvent,
  copy,
  onQuoteReset,
}: HotelLodgingPanelProps) {
  const accommodationGuests = resolveAccommodationGuests(lodging, maxAccommodationGuests)
  const effectiveHotelId =
    lodging.accommodationNeed === "none" ? null : lodging.selectedHotelId
  const selectedHotel = hotels.find((h) => h.id === effectiveHotelId) ?? null
  const displayCurrency = hotelDisplayCurrency(selectedHotel, fallbackEvent)
  const showRooms = selectedHotel ? hotelShowsRoomSelection(selectedHotel.pricing) : false
  const showPackages = selectedHotel ? hotelShowsPackageSelection(selectedHotel.pricing) : false
  const packagesRequired = selectedHotel
    ? hotelRequiresPackageSelection(selectedHotel.pricing)
    : false
  const roomTypeKey = String(lodging.selections[ROOM_TYPE_SELECTION_KEY] ?? "")
  const packageDealKey = String(lodging.selections[PACKAGE_DEAL_SELECTION_KEY] ?? "")
  const availablePackages =
    selectedHotel && showPackages
      ? guestPackageDeals(
          selectedHotel.pricing,
          packagesRequired ? undefined : lodging.nights,
          showRooms ? roomTypeKey : undefined
        )
      : []
  const packageSuggestions =
    effectiveHotelId && selectedHotel && showPackages && accommodationGuests >= 1 && availablePackages.length > 0
      ? suggestPackageCombinations(accommodationGuests, availablePackages)
      : []
  const activePackageUnitsRaw = lodging.selections[PACKAGE_UNITS_SELECTION_KEY]
  const activePackageUnits =
    activePackageUnitsRaw && typeof activePackageUnitsRaw === "object" && !Array.isArray(activePackageUnitsRaw)
      ? (activePackageUnitsRaw as Record<string, number>)
      : null
  const extrasSection = selectedHotel?.pricing.extrasSection ?? null

  const patchSelection = (key: string, value: string | number | boolean | string[]) => {
    onLodgingChange({
      ...lodging,
      selections: { ...lodging.selections, [key]: value },
    })
    onQuoteReset()
  }

  const applyPackagePlan = (units: Record<string, number>) => {
    const next: TBookSelections = { ...lodging.selections }
    delete next[PACKAGE_DEAL_SELECTION_KEY]
    next[PACKAGE_UNITS_SELECTION_KEY] = units
    const firstKey = Object.keys(units)[0]
    const pkg =
      firstKey && selectedHotel ? findPackageDeal(selectedHotel.pricing, firstKey) : null
    onLodgingChange({
      ...lodging,
      selections: next,
      nights: pkg?.nights ?? lodging.nights,
    })
    onQuoteReset()
  }

  const selectPackageForGuests = (key: string, pkgNights: number) => {
    if (!selectedHotel) return
    const pkg = findPackageDeal(selectedHotel.pricing, key)
    const units = pkg ? packageUnitsForGuests(pkg, accommodationGuests) : 1
    const next: TBookSelections = { ...lodging.selections }
    delete next[PACKAGE_DEAL_SELECTION_KEY]
    next[PACKAGE_UNITS_SELECTION_KEY] = { [key]: units }
    onLodgingChange({
      ...lodging,
      selections: next,
      nights: packagesRequired ? pkgNights : lodging.nights,
    })
    onQuoteReset()
  }

  return (
    <>
      {hotels.length > 0 ? (
        <AccommodationOptionCards
          hotels={hotels}
          selectedHotelId={lodging.selectedHotelId}
          ticketOnlySelected={lodging.accommodationNeed === "none" || !lodging.selectedHotelId}
          onSelectTicketOnly={() => {
            onLodgingChange({
              ...lodging,
              accommodationNeed: "none",
              selectedHotelId: null,
              selections: {},
            })
            onQuoteReset()
          }}
          onSelectHotel={(hotelId) => {
            const hotel = hotels.find((h) => h.id === hotelId) ?? null
            const nextSelections = defaultSelectionsForHotel(hotel, recommendedNights)
            const dealKey = String(nextSelections[PACKAGE_DEAL_SELECTION_KEY] ?? "")
            const pkg = dealKey && hotel ? findPackageDeal(hotel.pricing, dealKey) : null
            onLodgingChange({
              ...lodging,
              accommodationNeed: lodging.accommodationNeed === "some" ? "some" : "all",
              selectedHotelId: hotelId,
              selections: nextSelections,
              nights: pkg?.nights ?? recommendedNights,
            })
            onQuoteReset()
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
              {lodging.accommodationNeed === "some" && accommodationGuests < maxAccommodationGuests
                ? ` (${maxAccommodationGuests - accommodationGuests} entries without room)`
                : ""}
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  lodging.accommodationNeed === "all"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/40"
                }`}
                aria-pressed={lodging.accommodationNeed === "all"}
                onClick={() => {
                  onLodgingChange({ ...lodging, accommodationNeed: "all" })
                  onQuoteReset()
                }}
              >
                Rooms for all entries ({maxAccommodationGuests})
              </button>
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  lodging.accommodationNeed === "some"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/40"
                }`}
                aria-pressed={lodging.accommodationNeed === "some"}
                onClick={() => {
                  onLodgingChange({
                    ...lodging,
                    accommodationNeed: "some",
                    accommodationGuestOverride: Math.min(
                      maxAccommodationGuests,
                      Math.max(1, lodging.accommodationGuestOverride)
                    ),
                  })
                  onQuoteReset()
                }}
              >
                Rooms for some entries
              </button>
            </div>
            {lodging.accommodationNeed === "some" ? (
              <label className="block max-w-xs space-y-1.5">
                <span className="text-sm font-medium">
                  Guests needing accommodation (max {maxAccommodationGuests})
                </span>
                <input
                  type="number"
                  min={1}
                  max={maxAccommodationGuests}
                  className={INPUT}
                  value={lodging.accommodationGuestOverride}
                  onChange={(e) => {
                    onLodgingChange({
                      ...lodging,
                      accommodationGuestOverride: Number(e.target.value) || 1,
                    })
                    onQuoteReset()
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
                  value={lodging.nights}
                  onChange={(e) => {
                    onLodgingChange({ ...lodging, nights: Number(e.target.value) })
                    onQuoteReset()
                  }}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{copy.roomTypeLabel}</span>
                <select
                  className={INPUT}
                  value={roomTypeKey}
                  onChange={(e) => {
                    const next: TBookSelections = {
                      ...lodging.selections,
                      [ROOM_TYPE_SELECTION_KEY]: e.target.value,
                    }
                    delete next[PACKAGE_DEAL_SELECTION_KEY]
                    onLodgingChange({ ...lodging, selections: next })
                    onQuoteReset()
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
              recommendedNights={recommendedNights}
              recommendedLabel={recommendedStayLabel}
              onSelectPackage={selectPackageForGuests}
              onApplyPlan={applyPackagePlan}
              onClearPackage={() => {
                const next: TBookSelections = { ...lodging.selections }
                delete next[PACKAGE_DEAL_SELECTION_KEY]
                delete next[PACKAGE_UNITS_SELECTION_KEY]
                onLodgingChange({ ...lodging, selections: next, nights: recommendedNights })
                onQuoteReset()
              }}
            />
          ) : null}

          {extrasSection ? (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold">{extrasSection.label}</p>
                {extrasSection.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{extrasSection.description}</p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {extrasSection.options.map((option) => (
                  <BookingOptionField
                    key={option.key}
                    option={option}
                    value={selectionOptionValue(lodging.selections, option.key)}
                    visible={optionVisible(option, lodging.selections)}
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
                    value={selectionOptionValue(lodging.selections, option.key)}
                    visible={optionVisible(option, lodging.selections)}
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
  )
}

export function TBookMultiBookingWizard({
  apiKey,
  eventIds,
  copy,
}: {
  apiKey: string
  eventIds: string[]
  copy: Copy
}) {
  const steps = [copy.stepTicket, copy.stepDetails, copy.stepReview]
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveQuoteLoading, setLiveQuoteLoading] = useState(false)

  const [loadedEvents, setLoadedEvents] = useState<LoadedEvent[]>([])
  const [hotels, setHotels] = useState<TBookPublicHotel[]>([])
  const [guestsByEvent, setGuestsByEvent] = useState<Record<string, number>>({})
  const [attendeesByEvent, setAttendeesByEvent] = useState<
    Record<string, TBookBookingAttendeePayload[]>
  >({})
  const [lodgingMode, setLodgingMode] = useState<LodgingMode>("combined")
  const [combinedLodging, setCombinedLodging] = useState<LodgingState>(() => emptyLodgingState())
  const [separateLodging, setSeparateLodging] = useState<Record<string, LodgingState>>({})
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", note: "" })
  const [billing, setBilling] = useState<BillingFormState>(() => emptyBillingForm())
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [entryQuotes, setEntryQuotes] = useState<
    Array<{ eventId: string; eventName: string; quote: TBookPriceQuote }>
  >([])
  const [detailsTab, setDetailsTab] = useState<"guests" | "billing">("guests")

  const events = loadedEvents.map((row) => row.event)
  const eventIdKey = events.map((e) => e.id).join(",")
  const combinedStayRecommendation = useMemo(
    () =>
      loadedEvents.length > 0
        ? recommendStayForEvents(loadedEvents.map((row) => row.event))
        : null,
    [loadedEvents]
  )
  const combinedRecommendedNights =
    combinedStayRecommendation?.nights ?? events[0]?.nights ?? 1
  const combinedRecommendedStayLabel = combinedStayRecommendation
    ? formatStayDateRange(
        combinedStayRecommendation.startDate,
        combinedStayRecommendation.endDate
      )
    : null

  const totalMaxAccommodationGuests = events.reduce(
    (sum, event) => sum + accommodationGuestCount(guestsByEvent[event.id] ?? 1, event),
    0
  )
  const combinedAccommodationGuests = resolveAccommodationGuests(
    combinedLodging,
    totalMaxAccommodationGuests
  )
  const combinedEffectiveHotelId =
    combinedLodging.accommodationNeed === "none" ? null : combinedLodging.selectedHotelId
  const combinedSelectedHotel =
    hotels.find((h) => h.id === combinedEffectiveHotelId) ?? null
  const displayCurrency = hotelDisplayCurrency(
    lodgingMode === "combined" ? combinedSelectedHotel : null,
    events[0] ?? null
  )

  useEffect(() => {
    if (!apiKey.trim() || eventIds.length < 2) {
      setError(eventIds.length < 2 ? "Select at least two events." : "tBook API key is not configured.")
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(
          eventIds.map((id) => getEventDetail(apiKey.trim(), id))
        )
        if (cancelled) return
        const nextEvents: LoadedEvent[] = []
        let nextHotels: TBookPublicHotel[] = []
        const nextGuests: Record<string, number> = {}
        const nextAttendees: Record<string, TBookBookingAttendeePayload[]> = {}
        const nextSeparateLodging: Record<string, LodgingState> = {}

        for (const res of results) {
          if (!res.event) continue
          nextEvents.push({ event: res.event })
          nextGuests[res.event.id] = 1
          const rosterSize = resolvePlayersPerTicket(res.event)
          const withMembers = needsPlayerMemberForms(res.event)
          nextAttendees[res.event.id] = emptyAttendeeRows(1, rosterSize, withMembers)
          const stay = recommendStayForEvents([res.event])
          nextSeparateLodging[res.event.id] = emptyLodgingState(stay.nights)
          if (nextHotels.length === 0 && res.hotels.length > 0) {
            nextHotels = res.hotels
          }
        }

        if (nextEvents.length !== eventIds.length) {
          setError(copy.eventError)
          setLoadedEvents([])
          return
        }

        const combinedStay = recommendStayForEvents(nextEvents.map((row) => row.event))

        setLoadedEvents(nextEvents)
        setHotels(nextHotels)
        setGuestsByEvent(nextGuests)
        setAttendeesByEvent(nextAttendees)
        setSeparateLodging(nextSeparateLodging)
        setCombinedLodging(emptyLodgingState(combinedStay.nights))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.eventError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiKey, eventIds, copy.eventError])

  useEffect(() => {
    for (const row of loadedEvents) {
      const event = row.event
      const guestCount = guestsByEvent[event.id] ?? 1
      setAttendeesByEvent((prev) => {
        const current = prev[event.id] ?? []
        if (current.length === guestCount) return prev
        return {
          ...prev,
          [event.id]: emptyAttendeeRows(
            guestCount,
            resolvePlayersPerTicket(event),
            needsPlayerMemberForms(event)
          ),
        }
      })
    }
    setQuote(null)
    setEntryQuotes([])
  }, [guestsByEvent, loadedEvents])

  useEffect(() => {
    if (combinedLodging.accommodationNeed !== "some") return
    setCombinedLodging((prev) => ({
      ...prev,
      accommodationGuestOverride: Math.min(
        Math.max(1, prev.accommodationGuestOverride),
        Math.max(1, totalMaxAccommodationGuests)
      ),
    }))
  }, [combinedLodging.accommodationNeed, totalMaxAccommodationGuests])

  useEffect(() => {
    if (billing.billingType === "personal" && customer.name.trim() && !billing.name.trim()) {
      setBilling((b) => ({ ...b, name: customer.name }))
    }
  }, [customer.name, billing.billingType, billing.name])

  function buildQuotePayload(): {
    lodgingMode: LodgingMode
    entries: TBookMultiQuoteEntry[]
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
    accommodationGuests?: number | null
  } {
    const entries: TBookMultiQuoteEntry[] = events.map((event, index) => {
      const guestCount = guestsByEvent[event.id] ?? 1
      if (lodgingMode === "combined") {
        return {
          eventId: event.id,
          guests: guestCount,
          accommodationGuests: index === 0 ? combinedAccommodationGuests : 0,
        }
      }
      const lodging = separateLodging[event.id] ?? emptyLodgingState()
      const maxAcc = accommodationGuestCount(guestCount, event)
      const accGuests = resolveAccommodationGuests(lodging, maxAcc)
      const hotelId = accGuests > 0 ? lodging.selectedHotelId : null
      return {
        eventId: event.id,
        guests: guestCount,
        accommodationGuests: accGuests,
        hotelId,
        nights: hotelId ? lodging.nights : null,
        selections: hotelId ? lodging.selections : null,
      }
    })

    if (lodgingMode === "combined") {
      return {
        lodgingMode: "combined",
        entries,
        hotelId: combinedEffectiveHotelId,
        nights: combinedEffectiveHotelId ? combinedLodging.nights : null,
        selections: combinedEffectiveHotelId ? combinedLodging.selections : null,
        accommodationGuests: combinedAccommodationGuests,
      }
    }
    return { lodgingMode: "separate", entries }
  }

  useEffect(() => {
    if (events.length < 2 || !apiKey.trim() || step !== 1) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLiveQuoteLoading(true)
      quoteMultiBooking(apiKey.trim(), buildQuotePayload())
        .then((res) => {
          if (!cancelled) {
            setQuote(res.quote)
            setEntryQuotes(res.entries)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setQuote(null)
            setEntryQuotes([])
          }
        })
        .finally(() => {
          if (!cancelled) setLiveQuoteLoading(false)
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    apiKey,
    eventIdKey,
    step,
    lodgingMode,
    guestsByEvent,
    combinedLodging,
    separateLodging,
    combinedAccommodationGuests,
    combinedEffectiveHotelId,
    loadedEvents.length,
  ])

  const resetQuote = () => {
    setQuote(null)
    setEntryQuotes([])
  }

  const lodgingStepValid =
    events.every((event) => (guestsByEvent[event.id] ?? 1) >= 1) &&
    (hotels.length === 0 ||
      lodgingMode === "separate"
        ? events.every((event) => {
            const lodging = separateLodging[event.id] ?? emptyLodgingState()
            if (lodging.accommodationNeed === "none") return true
            if (!lodging.selectedHotelId) return false
            if (lodging.accommodationNeed === "some") {
              const maxAcc = accommodationGuestCount(guestsByEvent[event.id] ?? 1, event)
              return resolveAccommodationGuests(lodging, maxAcc) >= 1
            }
            return true
          })
        : combinedLodging.accommodationNeed === "none" ||
          Boolean(combinedEffectiveHotelId)) &&
    (lodgingMode !== "combined" ||
      combinedLodging.accommodationNeed !== "some" ||
      combinedAccommodationGuests >= 1)

  const detailsStepValid =
    customer.name.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    isBillingFormValid(billing) &&
    events.every((event) => {
      const lodging =
        lodgingMode === "combined"
          ? combinedLodging
          : separateLodging[event.id] ?? emptyLodgingState()
      const selectedHotel =
        lodging.accommodationNeed === "none" || !lodging.selectedHotelId
          ? null
          : hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
      const rows = attendeesByEvent[event.id] ?? []
      const needsForms =
        mergeRegistrationFieldSchemas(
          event.attendeeFieldSchema,
          lodging.accommodationNeed === "none"
            ? undefined
            : selectedHotel?.registrationFieldSchema
        ).length > 0 || needsPlayerMemberForms(event)
      if (!needsForms) return true
      return attendeesValidForEvent(event, rows, selectedHotel, lodging.accommodationNeed)
    })

  const runQuote = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await quoteMultiBooking(apiKey.trim(), buildQuotePayload())
      setQuote(res.quote)
      setEntryQuotes(res.entries)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate price")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const runBooking = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const base = buildQuotePayload()
      const res = await createMultiBooking(apiKey.trim(), {
        ...base,
        customer,
        billing,
        returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        entries: base.entries.map((entry) => {
          const event = events.find((e) => e.id === entry.eventId)
          if (!event) return entry
          const lodging =
            lodgingMode === "combined"
              ? combinedLodging
              : separateLodging[event.id] ?? emptyLodgingState()
          const selectedHotel =
            lodging.accommodationNeed === "none" || !lodging.selectedHotelId
              ? null
              : hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
          const rows = attendeesByEvent[event.id] ?? []
          const needsForms =
            mergeRegistrationFieldSchemas(
              event.attendeeFieldSchema,
              lodging.accommodationNeed === "none"
                ? undefined
                : selectedHotel?.registrationFieldSchema
            ).length > 0 || needsPlayerMemberForms(event)
          return {
            ...entry,
            attendees: needsForms ? rows : undefined,
          }
        }),
      })
      window.location.href = res.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed")
      setSubmitting(false)
    }
  }

  const goNext = async () => {
    if (step === 2) {
      if (!detailsStepValid) {
        setDetailsTab("guests")
        setError("Please complete participant details for every event.")
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

  if (error && events.length === 0) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-medium text-destructive">{error}</p>
        <Link href="/jegyek" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
          ← Back to events
        </Link>
      </div>
    )
  }

  if (events.length < 2) return null

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
          <h1 className="text-2xl font-bold sm:text-3xl">Több esemény foglalása</h1>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {events.map((event) => (
              <li key={event.id}>
                {event.name} ·{" "}
                {formatEventSchedule(
                  event.startDate,
                  event.endDate,
                  event.startTime,
                  event.endTime
                )}
              </li>
            ))}
          </ul>
        </div>
        <BookingStepIndicator steps={steps} current={step} />
      </header>

      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          {hotels.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Szállás</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    lodgingMode === "combined"
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/40"
                  }`}
                  aria-pressed={lodgingMode === "combined"}
                  onClick={() => {
                    setLodgingMode("combined")
                    resetQuote()
                  }}
                >
                  Együtt (egy szállás)
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    lodgingMode === "separate"
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/40"
                  }`}
                  aria-pressed={lodgingMode === "separate"}
                  onClick={() => {
                    setLodgingMode("separate")
                    resetQuote()
                  }}
                >
                  Eseményenként
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            {events.map((event) => {
              const guestCount = guestsByEvent[event.id] ?? 1
              const playersPerTicket = resolvePlayersPerTicket(event)
              const registrationUnit = event.registrationUnit ?? "person"
              const maxAcc = accommodationGuestCount(guestCount, event)
              const eventStay = recommendStayForEvents([event])
              const eventStayLabel = formatStayDateRange(
                eventStay.startDate,
                eventStay.endDate
              )

              return (
                <div key={event.id} className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="text-lg font-semibold">{event.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatEventSchedule(
                        event.startDate,
                        event.endDate,
                        event.startTime,
                        event.endTime
                      )}
                    </p>
                    {lodgingMode === "separate" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ajánlott szállás: {eventStayLabel} ({eventStay.nights} éj)
                      </p>
                    ) : null}
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
                      value={guestCount}
                      onChange={(e) => {
                        const next = Number(e.target.value) || 1
                        setGuestsByEvent((prev) => ({ ...prev, [event.id]: next }))
                        resetQuote()
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {playersPerTicket > 1
                        ? `${guestCount} ${guestCount === 1 ? "entry" : "entries"} × ${playersPerTicket} players = ${maxAcc} players.`
                        : "Entry fees are charged per entry."}
                    </p>
                  </label>

                  {lodgingMode === "separate" && hotels.length > 0 ? (
                    <HotelLodgingPanel
                      hotels={hotels}
                      lodging={separateLodging[event.id] ?? emptyLodgingState(eventStay.nights)}
                      onLodgingChange={(next) => {
                        setSeparateLodging((prev) => ({ ...prev, [event.id]: next }))
                      }}
                      maxAccommodationGuests={maxAcc}
                      recommendedNights={eventStay.nights}
                      recommendedStayLabel={eventStayLabel}
                      fallbackEvent={event}
                      copy={copy}
                      onQuoteReset={resetQuote}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>

          {lodgingMode === "combined" && hotels.length > 0 ? (
            <div className="space-y-4 border-t border-border pt-4">
              {combinedRecommendedStayLabel ? (
                <p className="text-sm text-muted-foreground">
                  Ajánlott szállás: {combinedRecommendedStayLabel} ({combinedRecommendedNights}{" "}
                  éj)
                </p>
              ) : null}
              <HotelLodgingPanel
                hotels={hotels}
                lodging={combinedLodging}
                onLodgingChange={setCombinedLodging}
                maxAccommodationGuests={totalMaxAccommodationGuests}
                recommendedNights={combinedRecommendedNights}
                recommendedStayLabel={combinedRecommendedStayLabel}
                fallbackEvent={events[0]}
                copy={copy}
                onQuoteReset={resetQuote}
              />
            </div>
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
            <div className="space-y-8">
              {events.map((event) => {
                const guestCount = guestsByEvent[event.id] ?? 1
                const registrationUnit = event.registrationUnit ?? "person"
                const playersPerTicket = resolvePlayersPerTicket(event)
                const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount)
                const lodging =
                  lodgingMode === "combined"
                    ? combinedLodging
                    : separateLodging[event.id] ?? emptyLodgingState()
                const selectedHotel =
                  lodging.accommodationNeed === "none" || !lodging.selectedHotelId
                    ? null
                    : hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
                const registrationFieldSchema = mergeRegistrationFieldSchemas(
                  event.attendeeFieldSchema,
                  lodging.accommodationNeed === "none"
                    ? undefined
                    : selectedHotel?.registrationFieldSchema
                )
                const needsPlayerMembers = needsPlayerMemberForms(event)
                const playerFields = playerFieldSchema(event)
                const fixedRosterSize = playerRosterSize(event)
                const teamMemberLimit = event.teamMemberLimit ?? null
                const rows = attendeesByEvent[event.id] ?? []
                const maxAcc = accommodationGuestCount(guestCount, event)

                return (
                  <div key={event.id} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">{event.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {playersPerTicket > 1
                          ? `${playersPerTicket} player forms required per entry (${guestCount} ${
                              guestCount === 1 ? "entry" : "entries"
                            } → ${maxAcc} guests). `
                          : registrationUnit === "team"
                            ? `Enter details for each team member (max ${playersPerTicket} per team). `
                            : ""}
                        {copy.attendeesHint}
                      </p>
                    </div>

                    {registrationFieldSchema.length > 0 || needsPlayerMembers ? (
                      rows.map((attendee, index) => (
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
                                    setAttendeesByEvent((prev) => ({
                                      ...prev,
                                      [event.id]: (prev[event.id] ?? []).map((row, i) =>
                                        i === index
                                          ? {
                                              ...row,
                                              fields: { ...row.fields, [field.key]: value },
                                            }
                                          : row
                                      ),
                                    }))
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
                                          setAttendeesByEvent((prev) => ({
                                            ...prev,
                                            [event.id]: (prev[event.id] ?? []).map((row, i) =>
                                              i === index
                                                ? {
                                                    ...row,
                                                    members: (row.members ?? []).map((m, mi) =>
                                                      mi === memberIndex
                                                        ? {
                                                            fields: {
                                                              ...m.fields,
                                                              [field.key]: value,
                                                            },
                                                          }
                                                        : m
                                                    ),
                                                  }
                                                : row
                                            ),
                                          }))
                                        }
                                        inputClassName={INPUT}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {fixedRosterSize == null &&
                              (teamMemberLimit == null ||
                                (attendee.members ?? []).length < teamMemberLimit) ? (
                                <button
                                  type="button"
                                  className="text-sm font-medium text-primary hover:underline"
                                  onClick={() =>
                                    setAttendeesByEvent((prev) => ({
                                      ...prev,
                                      [event.id]: (prev[event.id] ?? []).map((row, i) =>
                                        i === index
                                          ? {
                                              ...row,
                                              members: [...(row.members ?? []), { fields: {} }],
                                            }
                                          : row
                                      ),
                                    }))
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
                        No participant fields are required for this event.
                      </p>
                    )}
                  </div>
                )
              })}

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
          <dl className="space-y-3 text-sm">
            {events.map((event, eventIndex) => {
              const guestCount = guestsByEvent[event.id] ?? 1
              const registrationUnit = event.registrationUnit ?? "person"
              const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount)
              const entryQuote = entryQuotes.find((row) => row.eventId === event.id)
              const lodging =
                lodgingMode === "combined"
                  ? combinedLodging
                  : separateLodging[event.id] ?? emptyLodgingState()
              const selectedHotel =
                lodgingMode === "combined"
                  ? combinedSelectedHotel
                  : lodging.accommodationNeed === "none" || !lodging.selectedHotelId
                    ? null
                    : hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
              const maxAcc = accommodationGuestCount(guestCount, event)
              const accGuests =
                lodgingMode === "combined"
                  ? eventIndex === 0
                    ? combinedAccommodationGuests
                    : 0
                  : resolveAccommodationGuests(lodging, maxAcc)

              return (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium">{event.name}</dt>
                    {entryQuote ? (
                      <dd className="font-medium tabular-nums">
                        {formatHuf(entryQuote.quote.totalHuf, displayCurrency)}
                      </dd>
                    ) : null}
                  </div>
                  <div className="mt-2 flex justify-between gap-4 text-muted-foreground">
                    <span>{registrationUnit === "team" ? "Teams" : "Entries"}</span>
                    <span>
                      {guestCount} {guestUnitLabel}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>Accommodation</span>
                    <span className="text-right">
                      {lodgingMode === "combined" && event.id !== events[0]?.id
                        ? "Shared stay (combined)"
                        : selectedHotel && accGuests > 0
                          ? `${selectedHotel.name} · ${accGuests} guest${
                              accGuests === 1 ? "" : "s"
                            }`
                          : "None"}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium text-right">{customer.name}</dd>
            </div>
            {lodgingMode === "combined" && combinedSelectedHotel && combinedAccommodationGuests > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Shared accommodation</dt>
                <dd className="font-medium text-right">
                  {combinedSelectedHotel.name} · {combinedAccommodationGuests} guest
                  {combinedAccommodationGuests === 1 ? "" : "s"}
                </dd>
              </div>
            ) : null}
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
            disabled={
              submitting || (step === 1 && !lodgingStepValid) || (step === 2 && !detailsStepValid)
            }
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
