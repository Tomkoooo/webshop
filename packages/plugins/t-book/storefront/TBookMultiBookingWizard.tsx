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
  suggestStayClusters,
  type StayCluster,
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

type LodgingMode = "clusters" | "combined" | "separate"
type ApiLodgingMode = "combined" | "separate"

type LodgingState = {
  accommodationNeed: "all" | "some" | "none"
  accommodationGuestOverride: number
  selectedHotelId: string | null
  nights: number
  extraNightAfter: boolean
  selections: TBookSelections
  /** null = user has not chosen tickets vs hotel yet */
  wantsHotel: boolean | null
}

type LoadedEvent = {
  event: TBookPublicEvent
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

function emptyLodgingState(recommendedNights = 1): LodgingState {
  return {
    accommodationNeed: "none",
    accommodationGuestOverride: 1,
    selectedHotelId: null,
    nights: recommendedNights,
    extraNightAfter: false,
    selections: {},
    wantsHotel: null,
  }
}

function patchLodging(prev: LodgingState, patch: Partial<LodgingState>): LodgingState {
  let changed = false
  for (const key of Object.keys(patch) as (keyof LodgingState)[]) {
    const nextVal = patch[key]
    if (nextVal === undefined) continue
    if (key === "selections") {
      if (JSON.stringify(nextVal) !== JSON.stringify(prev.selections)) changed = true
    } else if (prev[key] !== nextVal) {
      changed = true
    }
  }
  return changed ? { ...prev, ...patch } : prev
}

function stayForEvents(
  clusterEvents: TBookPublicEvent[],
  extraNightAfter: boolean
) {
  return recommendStayForEvents(clusterEvents, { extraNightAfter })
}

function lodgingWithExtraNight(
  lodging: LodgingState,
  clusterEvents: TBookPublicEvent[],
  extraNightAfter: boolean
): LodgingState {
  const stay = stayForEvents(clusterEvents, extraNightAfter)
  if (lodging.extraNightAfter === extraNightAfter && lodging.nights === stay.nights) return lodging
  return patchLodging(lodging, { extraNightAfter, nights: stay.nights })
}

function clusterMaxAccommodationGuests(
  cluster: StayCluster<TBookPublicEvent>,
  guestsByEvent: Record<string, number>
): number {
  return cluster.events.reduce(
    (sum, event) => sum + accommodationGuestCount(guestsByEvent[event.id] ?? 1, event),
    0
  )
}

function findClusterForEvent(
  clusters: StayCluster<TBookPublicEvent>[],
  eventId: string
): StayCluster<TBookPublicEvent> | undefined {
  return clusters.find((c) => c.events.some((e) => e.id === eventId))
}

function isClusterPrimaryEvent(
  cluster: StayCluster<TBookPublicEvent>,
  eventId: string
): boolean {
  return cluster.events[0]?.id === eventId
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
  stayEvents: TBookPublicEvent[]
  stayHeading?: string
  stayEventNames?: string[]
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
  stayEvents,
  stayHeading,
  stayEventNames,
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
    onLodgingChange(
      patchLodging(lodging, { selections: { ...lodging.selections, [key]: value } })
    )
    onQuoteReset()
  }

  const applyPackagePlan = (units: Record<string, number>) => {
    const next: TBookSelections = { ...lodging.selections }
    delete next[PACKAGE_DEAL_SELECTION_KEY]
    next[PACKAGE_UNITS_SELECTION_KEY] = units
    const firstKey = Object.keys(units)[0]
    const pkg =
      firstKey && selectedHotel ? findPackageDeal(selectedHotel.pricing, firstKey) : null
    onLodgingChange(
      patchLodging(lodging, {
        selections: next,
        nights: pkg?.nights ?? lodging.nights,
      })
    )
    onQuoteReset()
  }

  const selectPackageForGuests = (key: string, pkgNights: number) => {
    if (!selectedHotel) return
    const pkg = findPackageDeal(selectedHotel.pricing, key)
    const units = pkg ? packageUnitsForGuests(pkg, accommodationGuests) : 1
    const next: TBookSelections = { ...lodging.selections }
    delete next[PACKAGE_DEAL_SELECTION_KEY]
    next[PACKAGE_UNITS_SELECTION_KEY] = { [key]: units }
    onLodgingChange(
      patchLodging(lodging, {
        selections: next,
        nights: packagesRequired ? pkgNights : lodging.nights,
      })
    )
    onQuoteReset()
  }

  return (
    <>
      {stayHeading ? (
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{stayHeading}</h3>
          {stayEventNames && stayEventNames.length > 0 ? (
            <p className="text-sm text-muted-foreground">{stayEventNames.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={CHOICE_CARD(lodging.wantsHotel === false)}
          aria-pressed={lodging.wantsHotel === false}
          onClick={() => {
            onLodgingChange(
              patchLodging(lodging, {
                wantsHotel: false,
                accommodationNeed: "none",
                selectedHotelId: null,
                selections: {},
              })
            )
            onQuoteReset()
          }}
        >
          <span className="block text-sm font-semibold">No hotel — tickets only</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Entry fees only for this stay.
          </span>
        </button>
        <button
          type="button"
          className={CHOICE_CARD(lodging.wantsHotel === true)}
          aria-pressed={lodging.wantsHotel === true}
          onClick={() => {
            onLodgingChange(
              patchLodging(lodging, {
                wantsHotel: true,
                accommodationNeed: lodging.accommodationNeed === "some" ? "some" : "all",
              })
            )
            onQuoteReset()
          }}
        >
          <span className="block text-sm font-semibold">Yes, I need a hotel</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Pick a hotel and room package below.
          </span>
        </button>
      </div>

      {lodging.wantsHotel === true ? (
        <>
          {recommendedStayLabel ? (
            <p className="text-sm text-muted-foreground">
              Suggested stay: {recommendedStayLabel} ({recommendedNights} night
              {recommendedNights === 1 ? "" : "s"})
            </p>
          ) : null}

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border"
              checked={lodging.extraNightAfter}
              onChange={(e) => {
                onLodgingChange(lodgingWithExtraNight(lodging, stayEvents, e.target.checked))
                onQuoteReset()
              }}
            />
            <span className="text-sm">Stay one extra night after the event</span>
          </label>

          {hotels.length > 0 ? (
            <AccommodationOptionCards
              hotels={hotels}
              selectedHotelId={lodging.selectedHotelId}
              ticketOnlySelected={false}
              hideEntryOnlyOption
              onSelectTicketOnly={() => {
                onLodgingChange(
                  patchLodging(lodging, {
                    wantsHotel: false,
                    accommodationNeed: "none",
                    selectedHotelId: null,
                    selections: {},
                  })
                )
                onQuoteReset()
              }}
              onSelectHotel={(hotelId) => {
                const hotel = hotels.find((h) => h.id === hotelId) ?? null
                const nextSelections = defaultSelectionsForHotel(hotel, recommendedNights)
                const dealKey = String(nextSelections[PACKAGE_DEAL_SELECTION_KEY] ?? "")
                const pkg = dealKey && hotel ? findPackageDeal(hotel.pricing, dealKey) : null
                onLodgingChange(
                  patchLodging(lodging, {
                    wantsHotel: true,
                    accommodationNeed: lodging.accommodationNeed === "some" ? "some" : "all",
                    selectedHotelId: hotelId,
                    selections: nextSelections,
                    nights: pkg?.nights ?? recommendedNights,
                  })
                )
                onQuoteReset()
              }}
            />
          ) : null}
        </>
      ) : null}

      {lodging.wantsHotel === true && effectiveHotelId && selectedHotel ? (
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
            <p className="text-sm font-medium">Who needs a room?</p>
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
                  onLodgingChange(patchLodging(lodging, { accommodationNeed: "all" }))
                  onQuoteReset()
                }}
              >
                Everyone ({maxAccommodationGuests})
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
                  onLodgingChange(
                    patchLodging(lodging, {
                      accommodationNeed: "some",
                      accommodationGuestOverride: Math.min(
                        maxAccommodationGuests,
                        Math.max(1, lodging.accommodationGuestOverride)
                      ),
                    })
                  )
                  onQuoteReset()
                }}
              >
                Some people only
              </button>
            </div>
            {lodging.accommodationNeed === "some" ? (
              <label className="block max-w-xs space-y-1.5">
                <span className="text-sm font-medium">
                  How many need a room? (max {maxAccommodationGuests})
                </span>
                <input
                  type="number"
                  min={1}
                  max={maxAccommodationGuests}
                  className={INPUT}
                  value={lodging.accommodationGuestOverride}
                  onChange={(e) => {
                    const next = Number(e.target.value) || 1
                    onLodgingChange(patchLodging(lodging, { accommodationGuestOverride: next }))
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
                    onLodgingChange(
                      patchLodging(lodging, { nights: Number(e.target.value) })
                    )
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
                    onLodgingChange(patchLodging(lodging, { selections: next }))
                    onQuoteReset()
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
                const next: TBookSelections = { ...lodging.selections }
                delete next[PACKAGE_DEAL_SELECTION_KEY]
                delete next[PACKAGE_UNITS_SELECTION_KEY]
                onLodgingChange(
                  patchLodging(lodging, { selections: next, nights: recommendedNights })
                )
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
  const steps = [...WIZARD_STEPS]
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loadedEvents, setLoadedEvents] = useState<LoadedEvent[]>([])
  const [hotels, setHotels] = useState<TBookPublicHotel[]>([])
  const [guestsByEvent, setGuestsByEvent] = useState<Record<string, number>>({})
  const [attendeesByEvent, setAttendeesByEvent] = useState<
    Record<string, TBookBookingAttendeePayload[]>
  >({})
  const [lodgingMode, setLodgingMode] = useState<LodgingMode>("clusters")
  const [combinedLodging, setCombinedLodging] = useState<LodgingState>(() => emptyLodgingState())
  const [separateLodging, setSeparateLodging] = useState<Record<string, LodgingState>>({})
  const [clusterLodging, setClusterLodging] = useState<Record<string, LodgingState>>({})
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", note: "" })
  const [billing, setBilling] = useState<BillingFormState>(() => emptyBillingForm())
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [entryQuotes, setEntryQuotes] = useState<
    Array<{ eventId: string; eventName: string; quote: TBookPriceQuote }>
  >([])

  const events = loadedEvents.map((row) => row.event)
  const baseStayClusters = useMemo(
    () => (events.length > 0 ? suggestStayClusters(events) : []),
    [events]
  )

  const combinedStayRecommendation = useMemo(
    () =>
      loadedEvents.length > 0
        ? stayForEvents(
            loadedEvents.map((row) => row.event),
            combinedLodging.extraNightAfter
          )
        : null,
    [loadedEvents, combinedLodging.extraNightAfter]
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

  const lodgingForEvent = (eventId: string): {
    lodging: LodgingState
    selectedHotel: TBookPublicHotel | null
    effectiveAccommodationNeed: "all" | "some" | "none"
    isSharedStay: boolean
  } => {
    if (lodgingMode === "combined") {
      const selectedHotel =
        combinedLodging.accommodationNeed === "none" || !combinedLodging.selectedHotelId
          ? null
          : hotels.find((h) => h.id === combinedLodging.selectedHotelId) ?? null
      return {
        lodging: combinedLodging,
        selectedHotel,
        effectiveAccommodationNeed: combinedLodging.accommodationNeed,
        isSharedStay: eventId !== events[0]?.id,
      }
    }
    if (lodgingMode === "separate") {
      const lodging = separateLodging[eventId] ?? emptyLodgingState()
      const selectedHotel =
        lodging.accommodationNeed === "none" || !lodging.selectedHotelId
          ? null
          : hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
      return {
        lodging,
        selectedHotel,
        effectiveAccommodationNeed: lodging.accommodationNeed,
        isSharedStay: false,
      }
    }
    const cluster = findClusterForEvent(baseStayClusters, eventId)
    const lodging = cluster
      ? clusterLodging[cluster.id] ?? emptyLodgingState()
      : emptyLodgingState()
    const isPrimary = cluster ? isClusterPrimaryEvent(cluster, eventId) : false
    const selectedHotel =
      isPrimary && lodging.accommodationNeed !== "none" && lodging.selectedHotelId
        ? hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
        : null
    return {
      lodging,
      selectedHotel,
      effectiveAccommodationNeed: isPrimary ? lodging.accommodationNeed : "none",
      isSharedStay: cluster ? !isPrimary : false,
    }
  }

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
        const nextClusterLodging: Record<string, LodgingState> = {}

        for (const res of results) {
          if (!res.event) continue
          nextEvents.push({ event: res.event })
          nextGuests[res.event.id] = 1
          const rosterSize = resolvePlayersPerTicket(res.event)
          const withMembers = needsPlayerMemberForms(res.event)
          nextAttendees[res.event.id] = emptyAttendeeRows(1, rosterSize, withMembers)
          const stay = stayForEvents([res.event], false)
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

        const loadedEventList = nextEvents.map((row) => row.event)
        const clusters = suggestStayClusters(loadedEventList)
        for (const cluster of clusters) {
          nextClusterLodging[cluster.id] = emptyLodgingState(cluster.stay.nights)
        }

        const combinedStay = stayForEvents(loadedEventList, false)

        setLoadedEvents(nextEvents)
        setHotels(nextHotels)
        setGuestsByEvent(nextGuests)
        setAttendeesByEvent(nextAttendees)
        setSeparateLodging(nextSeparateLodging)
        setClusterLodging(nextClusterLodging)
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
    const max = Math.max(1, totalMaxAccommodationGuests)
    const clamped = Math.min(Math.max(1, combinedLodging.accommodationGuestOverride), max)
    if (clamped !== combinedLodging.accommodationGuestOverride) {
      setCombinedLodging((prev) =>
        patchLodging(prev, { accommodationGuestOverride: clamped })
      )
    }
  }, [combinedLodging.accommodationNeed, combinedLodging.accommodationGuestOverride, totalMaxAccommodationGuests])

  useEffect(() => {
    if (billing.billingType === "personal" && customer.name.trim() && !billing.name.trim()) {
      setBilling((b) => ({ ...b, name: customer.name }))
    }
  }, [customer.name, billing.billingType, billing.name])

  function buildQuotePayload(): {
    lodgingMode: ApiLodgingMode
    entries: TBookMultiQuoteEntry[]
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
    accommodationGuests?: number | null
  } {
    if (lodgingMode === "combined") {
      const entries: TBookMultiQuoteEntry[] = events.map((event, index) => {
        const guestCount = guestsByEvent[event.id] ?? 1
        return {
          eventId: event.id,
          guests: guestCount,
          accommodationGuests: index === 0 ? combinedAccommodationGuests : 0,
        }
      })
      return {
        lodgingMode: "combined",
        entries,
        hotelId: combinedEffectiveHotelId,
        nights: combinedEffectiveHotelId ? combinedLodging.nights : null,
        selections: combinedEffectiveHotelId ? combinedLodging.selections : null,
        accommodationGuests: combinedAccommodationGuests,
      }
    }

    const entries: TBookMultiQuoteEntry[] = events.map((event) => {
      const guestCount = guestsByEvent[event.id] ?? 1
      if (lodgingMode === "separate") {
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
      }

      const cluster = findClusterForEvent(baseStayClusters, event.id)
      if (!cluster || !isClusterPrimaryEvent(cluster, event.id)) {
        return {
          eventId: event.id,
          guests: guestCount,
          accommodationGuests: 0,
        }
      }
      const lodging = clusterLodging[cluster.id] ?? emptyLodgingState()
      const maxAcc = clusterMaxAccommodationGuests(cluster, guestsByEvent)
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

    return { lodgingMode: "separate", entries }
  }

  function lodgingStateValid(lodging: LodgingState, maxAcc: number): boolean {
    if (hotels.length === 0) return true
    if (lodging.wantsHotel === null) return false
    if (lodging.wantsHotel === false) return true
    if (!lodging.selectedHotelId) return false
    if (lodging.accommodationNeed === "some") {
      return resolveAccommodationGuests(lodging, maxAcc) >= 1
    }
    return true
  }

  const resetQuote = () => {
    setQuote(null)
    setEntryQuotes([])
  }

  const step1Valid = events.every((event) => (guestsByEvent[event.id] ?? 1) >= 1)

  const step2Valid =
    hotels.length === 0 ||
    (lodgingMode === "separate"
      ? events.every((event) => {
          const lodging = separateLodging[event.id] ?? emptyLodgingState()
          const maxAcc = accommodationGuestCount(guestsByEvent[event.id] ?? 1, event)
          return lodgingStateValid(lodging, maxAcc)
        })
      : lodgingMode === "clusters"
        ? baseStayClusters.every((cluster) => {
            const lodging = clusterLodging[cluster.id] ?? emptyLodgingState()
            const maxAcc = clusterMaxAccommodationGuests(cluster, guestsByEvent)
            return lodgingStateValid(lodging, maxAcc)
          })
        : lodgingStateValid(combinedLodging, totalMaxAccommodationGuests))

  const step3Valid = events.every((event) => {
    const { lodging, selectedHotel, effectiveAccommodationNeed } = lodgingForEvent(event.id)
    const rows = attendeesByEvent[event.id] ?? []
    const needsForms =
      mergeRegistrationFieldSchemas(
        event.attendeeFieldSchema,
        effectiveAccommodationNeed === "none"
          ? undefined
          : selectedHotel?.registrationFieldSchema
      ).length > 0 || needsPlayerMemberForms(event)
    if (!needsForms) return true
    return attendeesValidForEvent(event, rows, selectedHotel, effectiveAccommodationNeed)
  })

  const step4Valid =
    customer.name.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    isBillingFormValid(billing)

  const canProceedCurrentStep =
    step === 1
      ? step1Valid
      : step === 2
        ? step2Valid
        : step === 3
          ? step3Valid
          : step === 4
            ? step4Valid
            : Boolean(quote)

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
          const { lodging, selectedHotel, effectiveAccommodationNeed } = lodgingForEvent(
            event.id
          )
          const rows = attendeesByEvent[event.id] ?? []
          const needsForms =
            mergeRegistrationFieldSchemas(
              event.attendeeFieldSchema,
              effectiveAccommodationNeed === "none"
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
    if (step === 1) {
      if (!step1Valid) {
        setError("Please enter at least one entry for every event.")
        return
      }
      setError(null)
      setStep(2)
      return
    }
    if (step === 2) {
      if (!step2Valid) {
        setError("Please complete your hotel choices, or choose tickets only for each stay.")
        return
      }
      setError(null)
      setStep(3)
      return
    }
    if (step === 3) {
      if (!step3Valid) {
        setError("Please complete participant details for every event.")
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
      setEntryQuotes([])
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
          <h1 className="text-2xl font-bold sm:text-3xl">Book multiple events</h1>
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
          <div>
            <h2 className="text-lg font-semibold">How many entries?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set how many tickets you need for each event. You can add hotels on the next step.
            </p>
          </div>

          {events.map((event) => {
            const guestCount = guestsByEvent[event.id] ?? 1
            const playersPerTicket = resolvePlayersPerTicket(event)
            const registrationUnit = event.registrationUnit ?? "person"
            const maxAcc = accommodationGuestCount(guestCount, event)

            return (
              <div key={event.id} className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h3 className="text-base font-semibold">{event.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatEventSchedule(
                      event.startDate,
                      event.endDate,
                      event.startTime,
                      event.endTime
                    )}
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
                    value={guestCount}
                    onChange={(e) => {
                      const next = Number(e.target.value) || 1
                      setGuestsByEvent((prev) => ({ ...prev, [event.id]: next }))
                      resetQuote()
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {playersPerTicket > 1
                      ? `${guestCount} ${guestCount === 1 ? "entry" : "entries"} × ${playersPerTicket} players = ${maxAcc} people total.`
                      : `${guestCount} ${guestCount === 1 ? "person" : "people"} total.`}
                  </p>
                </label>
              </div>
            )
          })}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          {hotels.length > 0 ? (
            <>
              <div>
                <h2 className="text-lg font-semibold">Do you need hotel rooms?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We grouped nearby events into shared hotel stays.
                </p>
              </div>

              {lodgingMode === "clusters" ? (
                <div className="space-y-6">
                  {baseStayClusters.map((cluster, index) => {
                    const lodging = clusterLodging[cluster.id] ?? emptyLodgingState()
                    const stay = stayForEvents(cluster.events, lodging.extraNightAfter)
                    const stayLabel = formatStayDateRange(stay.startDate, stay.endDate)
                    const maxAcc = clusterMaxAccommodationGuests(cluster, guestsByEvent)
                    return (
                      <div
                        key={cluster.id}
                        className="space-y-4 rounded-xl border border-border p-4"
                      >
                        <HotelLodgingPanel
                          hotels={hotels}
                          lodging={lodging}
                          onLodgingChange={(next) => {
                            setClusterLodging((prev) => {
                              if (prev[cluster.id] === next) return prev
                              return { ...prev, [cluster.id]: next }
                            })
                          }}
                          maxAccommodationGuests={maxAcc}
                          recommendedNights={stay.nights}
                          recommendedStayLabel={stayLabel}
                          fallbackEvent={cluster.events[0]}
                          copy={copy}
                          onQuoteReset={resetQuote}
                          stayEvents={cluster.events}
                          stayHeading={`Stay ${index + 1}`}
                          stayEventNames={cluster.events.map((e) => e.name)}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {lodgingMode === "combined" ? (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <HotelLodgingPanel
                    hotels={hotels}
                    lodging={combinedLodging}
                    onLodgingChange={(next) => setCombinedLodging((prev) => (prev === next ? prev : next))}
                    maxAccommodationGuests={totalMaxAccommodationGuests}
                    recommendedNights={combinedRecommendedNights}
                    recommendedStayLabel={combinedRecommendedStayLabel}
                    fallbackEvent={events[0]}
                    copy={copy}
                    onQuoteReset={resetQuote}
                    stayEvents={events}
                    stayHeading="One stay for all events"
                    stayEventNames={events.map((e) => e.name)}
                  />
                </div>
              ) : null}

              {lodgingMode === "separate" ? (
                <div className="space-y-6">
                  {events.map((event) => {
                    const lodging = separateLodging[event.id] ?? emptyLodgingState()
                    const stay = stayForEvents([event], lodging.extraNightAfter)
                    const stayLabel = formatStayDateRange(stay.startDate, stay.endDate)
                    const maxAcc = accommodationGuestCount(guestsByEvent[event.id] ?? 1, event)
                    return (
                      <div
                        key={event.id}
                        className="space-y-4 rounded-xl border border-border p-4"
                      >
                        <HotelLodgingPanel
                          hotels={hotels}
                          lodging={lodging}
                          onLodgingChange={(next) => {
                            setSeparateLodging((prev) => {
                              if (prev[event.id] === next) return prev
                              return { ...prev, [event.id]: next }
                            })
                          }}
                          maxAccommodationGuests={maxAcc}
                          recommendedNights={stay.nights}
                          recommendedStayLabel={stayLabel}
                          fallbackEvent={event}
                          copy={copy}
                          onQuoteReset={resetQuote}
                          stayEvents={[event]}
                          stayHeading={event.name}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : null}

              <details className="rounded-xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-medium">More stay options</summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      lodgingMode === "combined"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-pressed={lodgingMode === "combined"}
                    onClick={() => {
                      setLodgingMode("combined")
                      resetQuote()
                    }}
                  >
                    <p className="text-sm font-semibold">One hotel for all events</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A single check-in covers every event.
                    </p>
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      lodgingMode === "separate"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-pressed={lodgingMode === "separate"}
                    onClick={() => {
                      setLodgingMode("separate")
                      resetQuote()
                    }}
                  >
                    <p className="text-sm font-semibold">Separate hotel per event</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pick a hotel for each event on its own.
                    </p>
                  </button>
                  {lodgingMode !== "clusters" ? (
                    <button
                      type="button"
                      className="rounded-xl border border-border p-4 text-left text-sm text-primary hover:border-primary/40 sm:col-span-2"
                      onClick={() => {
                        setLodgingMode("clusters")
                        resetQuote()
                      }}
                    >
                      Back to smart stays (recommended)
                    </button>
                  ) : null}
                </div>
              </details>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hotel options are available. Continue to enter player details.
            </p>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter player details for each event.
            </p>
          </div>

          {events.map((event) => {
            const guestCount = guestsByEvent[event.id] ?? 1
            const registrationUnit = event.registrationUnit ?? "person"
            const playersPerTicket = resolvePlayersPerTicket(event)
            const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount)
            const { selectedHotel, effectiveAccommodationNeed } = lodgingForEvent(event.id)
            const registrationFieldSchema = mergeRegistrationFieldSchemas(
              event.attendeeFieldSchema,
              effectiveAccommodationNeed === "none"
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
              <div key={event.id} className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
                <div>
                  <h3 className="text-base font-semibold">{event.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {playersPerTicket > 1
                      ? `${playersPerTicket} player forms per entry (${guestCount} ${
                          guestCount === 1 ? "entry" : "entries"
                        } = ${maxAcc} players). `
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
                    No player details are required for this event.
                  </p>
                )}
              </div>
            )
          })}
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
              <dl className="space-y-3 text-sm">
                {events.map((event) => {
                  const guestCount = guestsByEvent[event.id] ?? 1
                  const registrationUnit = event.registrationUnit ?? "person"
                  const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount)
                  const entryQuote = entryQuotes.find((row) => row.eventId === event.id)
                  const { lodging, selectedHotel, isSharedStay } = lodgingForEvent(event.id)
                  const maxAcc = accommodationGuestCount(guestCount, event)
                  let accGuests = 0
                  if (lodgingMode === "combined") {
                    accGuests =
                      event.id === events[0]?.id ? combinedAccommodationGuests : 0
                  } else if (lodgingMode === "separate") {
                    accGuests = resolveAccommodationGuests(lodging, maxAcc)
                  } else {
                    const cluster = findClusterForEvent(baseStayClusters, event.id)
                    if (cluster && isClusterPrimaryEvent(cluster, event.id)) {
                      accGuests = resolveAccommodationGuests(
                        lodging,
                        clusterMaxAccommodationGuests(cluster, guestsByEvent)
                      )
                    }
                  }

                  let hotelLabel = "Tickets only"
                  if (isSharedStay) {
                    hotelLabel =
                      lodgingMode === "clusters"
                        ? "Shared hotel stay"
                        : "Shared hotel stay"
                  } else if (selectedHotel && accGuests > 0) {
                    hotelLabel = `${selectedHotel.name} · ${accGuests} guest${
                      accGuests === 1 ? "" : "s"
                    }`
                  }

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
                        <span>Hotel</span>
                        <span className="text-right">{hotelLabel}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between gap-4 border-t border-border pt-3">
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
              if (step === 5) {
                setQuote(null)
                setEntryQuotes([])
              }
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
