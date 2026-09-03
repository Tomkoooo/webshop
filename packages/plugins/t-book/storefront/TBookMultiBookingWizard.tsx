"use client"

import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, BedDouble, Loader2 } from "lucide-react"
import { StorefrontRichHtml } from "@wse/core/components/common/StorefrontRichHtml"
import { mediaImageSrc, PLACEHOLDER_IMAGE } from "@wse/core/lib/images"
import {
  validateAttendees,
  type AttendeeValidationIssue,
} from "../lib/attendee-fields"
import {
  buildMultiWizardSteps,
  isMultiHotelStepValid,
  isMultiRoomsStepValid,
  matchMultiWizardStepIndex,
  type MultiLodgingMode,
  type MultiWizardStepDef,
} from "../lib/booking-wizard-flow"
import { validateEligibility, type EligibilityIssue } from "../lib/eligibility"
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
  countRosterPlayers,
  needsPlayerMemberForms,
  playerFieldSchema,
  playerRosterSize,
  initialPlayerMemberCount,
  resolvePlayersPerTicket,
  resolveStayGuestCount,
} from "../lib/registration-headcount"
import { AccommodationOptionCards } from "./AccommodationOptionCards"
import { BookingLegalConsent } from "./BookingLegalConsent"
import { BookingWizardNav } from "./BookingWizardNav"
import { PackageSelectionCards } from "./PackageSelectionCards"
import {
  BookingBillingForm,
  emptyBillingForm,
  isBillingFormValid,
  validateBillingForm,
  type BillingFormState,
} from "./BookingBillingForm"
import {
  BookingCustomerForm,
  emptyCustomerForm,
  isCustomerFormValid,
  validateCustomerForm,
} from "./BookingCustomerForm"
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
import { tbookT, type TBookCopyTone } from "../lib/i18n"

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

type ApiLodgingMode = "combined" | "separate"

type LodgingState = {
  accommodationNeed: "all" | "some" | "none"
  accommodationGuestOverride: number
  selectedHotelId: string | null
  nights: number
  selections: TBookSelections
  /** null = user has not chosen tickets vs hotel yet */
  wantsHotel: boolean | null
}

type LoadedEvent = {
  event: TBookPublicEvent
}

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

function stayForEvents(events: TBookPublicEvent[]) {
  return recommendStayForEvents(events)
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
  maxGuests: number,
  rosterGuests: number
): number {
  return resolveStayGuestCount({
    accommodationNeed: lodging.accommodationNeed,
    override: lodging.accommodationGuestOverride,
    rosterPlayers: rosterGuests,
    maxGuests,
  })
}

function lodgingHasPackageSelection(selections: TBookSelections): boolean {
  if (String(selections[PACKAGE_DEAL_SELECTION_KEY] ?? "").trim()) return true
  const raw = selections[PACKAGE_UNITS_SELECTION_KEY]
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.keys(raw as Record<string, number>).length > 0
  }
  return false
}

function attendeeFieldError(
  issues: AttendeeValidationIssue[],
  index: number,
  fieldKey: string,
  memberIndex?: number
): string | null {
  const match = issues.find((issue) => {
    if (issue.index !== index || issue.fieldKey !== fieldKey) return false
    return memberIndex == null ? issue.memberIndex == null : issue.memberIndex === memberIndex
  })
  return match?.message ?? null
}

function eligibilityIssuesForEntry(
  issues: EligibilityIssue[],
  ticketIndex: number
): EligibilityIssue[] {
  return issues.filter((issue) => issue.ticketIndex === ticketIndex)
}

type HotelLodgingPanelProps = {
  phase: "hotel" | "rooms"
  hotels: TBookPublicHotel[]
  lodging: LodgingState
  onLodgingChange: (next: LodgingState) => void
  maxAccommodationGuests: number
  rosterGuests: number
  recommendedNights: number
  recommendedStayLabel: string | null
  fallbackEvent: TBookPublicEvent
  copy: Copy
  onQuoteReset: () => void
  stayEvents: TBookPublicEvent[]
  stayHeading?: string
  stayEventNames?: string[]
  locale?: string
}

function HotelLodgingPanel({
  phase,
  hotels,
  lodging,
  onLodgingChange,
  maxAccommodationGuests,
  rosterGuests,
  recommendedNights,
  recommendedStayLabel,
  fallbackEvent,
  copy,
  onQuoteReset,
  stayEvents,
  stayHeading,
  stayEventNames,
  locale,
}: HotelLodgingPanelProps) {
  const accommodationGuests = resolveAccommodationGuests(
    lodging,
    maxAccommodationGuests,
    rosterGuests
  )
  const lodgingRef = useRef(lodging)
  lodgingRef.current = lodging
  const onLodgingChangeRef = useRef(onLodgingChange)
  onLodgingChangeRef.current = onLodgingChange
  const onQuoteResetRef = useRef(onQuoteReset)
  onQuoteResetRef.current = onQuoteReset
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
    effectiveHotelId &&
    selectedHotel &&
    showPackages &&
    accommodationGuests >= 1 &&
    availablePackages.length > 0
      ? suggestPackageCombinations(accommodationGuests, availablePackages)
      : []
  const activePackageUnitsRaw = lodging.selections[PACKAGE_UNITS_SELECTION_KEY]
  const activePackageUnits =
    activePackageUnitsRaw &&
    typeof activePackageUnitsRaw === "object" &&
    !Array.isArray(activePackageUnitsRaw)
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

  useEffect(() => {
    if (!effectiveHotelId || !selectedHotel || accommodationGuests < 1) return
    const current = lodgingRef.current
    const unitsRaw = current.selections[PACKAGE_UNITS_SELECTION_KEY]
    if (unitsRaw && typeof unitsRaw === "object" && !Array.isArray(unitsRaw)) {
      const keys = Object.keys(unitsRaw as Record<string, number>)
      if (keys.length === 1) {
        const key = keys[0]
        const pkg = findPackageDeal(selectedHotel.pricing, key)
        if (!pkg) return
        const needed = packageUnitsForGuests(pkg, accommodationGuests)
        if ((unitsRaw as Record<string, number>)[key] === needed) return
        const next: TBookSelections = {
          ...current.selections,
          [PACKAGE_UNITS_SELECTION_KEY]: { [key]: needed },
        }
        onLodgingChangeRef.current(patchLodging(current, { selections: next }))
        onQuoteResetRef.current()
      }
      return
    }
    const dealKey = String(current.selections[PACKAGE_DEAL_SELECTION_KEY] ?? "")
    if (!dealKey) return
    const pkg = findPackageDeal(selectedHotel.pricing, dealKey)
    if (!pkg) return
    const needed = packageUnitsForGuests(pkg, accommodationGuests)
    const next: TBookSelections = { ...current.selections }
    delete next[PACKAGE_DEAL_SELECTION_KEY]
    next[PACKAGE_UNITS_SELECTION_KEY] = { [dealKey]: needed }
    onLodgingChangeRef.current(patchLodging(current, { selections: next }))
    onQuoteResetRef.current()
  }, [accommodationGuests, effectiveHotelId, selectedHotel])

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

      {phase === "hotel" ? (
        <>
          <div>
            <h3 className="text-sm font-semibold">{tbookT(locale, "needHotel")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tbookT(locale, "needHotelHint")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                <span className="block text-sm font-semibold">{tbookT(locale, "noHotelEntryOnly")}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {tbookT(locale, "entryFeesOnlyHint")}
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
                      accommodationNeed:
                        lodging.accommodationNeed === "some" ? "some" : "all",
                    })
                  )
                  onQuoteReset()
                }}
              >
                <span className="block text-sm font-semibold">{tbookT(locale, "yesNeedHotel")}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {tbookT(locale, "hotelNextHint")}
                </span>
              </button>
            </div>
          </div>

          {lodging.wantsHotel === true && !selectedHotel ? (
            hotels.length > 0 ? (
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
                      accommodationNeed:
                        lodging.accommodationNeed === "some" ? "some" : "all",
                      selectedHotelId: hotelId,
                      selections: nextSelections,
                      nights: pkg?.nights ?? recommendedNights,
                    })
                  )
                  onQuoteReset()
                }}
                locale={locale}
              />
            ) : null
          ) : null}

          {lodging.wantsHotel === true && selectedHotel ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {tbookT(locale, "selectedHotelLabel")}
                  </p>
                  <p className="mt-1 text-base font-semibold">{selectedHotel.name}</p>
                  {selectedHotel.address?.trim() ? (
                    <p className="mt-1 text-xs text-muted-foreground">{selectedHotel.address}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => {
                    onLodgingChange(
                      patchLodging(lodging, {
                        selectedHotelId: null,
                        selections: {},
                      })
                    )
                    onQuoteReset()
                  }}
                >
                  {tbookT(locale, "changeHotel")}
                </button>
              </div>
              {selectedHotel.gallery?.[0] ? (
                <div className="mt-3 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaImageSrc(selectedHotel.gallery[0]) || PLACEHOLDER_IMAGE}
                    alt=""
                    className="aspect-[21/9] w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE
                    }}
                  />
                </div>
              ) : (
                <div className="mt-3 flex aspect-[21/9] items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <BedDouble className="size-8" aria-hidden />
                </div>
              )}
              {selectedHotel.description?.trim() ? (
                <div className="mt-3 text-sm text-muted-foreground">
                  <StorefrontRichHtml html={selectedHotel.description} className="text-sm" />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {phase === "rooms" && lodging.wantsHotel === true && selectedHotel ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">{tbookT(locale, "chooseYourRoom")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tbookT(locale, "chooseRoomHint", { hotel: selectedHotel.name })}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {tbookT(locale, "packagesPricedFor", {
                guests: accommodationGuests,
                guestWord: tbookT(locale, accommodationGuests === 1 ? "guestSingular" : "guestPlural"),
                extra:
                  lodging.accommodationNeed === "some" && accommodationGuests < rosterGuests
                    ? tbookT(locale, "entriesWithoutRoomSuffix", {
                        count: rosterGuests - accommodationGuests,
                      })
                    : "",
              })}
            </p>
            <p className="text-sm font-medium">{tbookT(locale, "whoNeedsRoom")}</p>
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
                {tbookT(locale, "everyoneCount", { count: rosterGuests })}
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
                {tbookT(locale, "somePeopleOnly")}
              </button>
            </div>
            {lodging.accommodationNeed === "some" ? (
              <label className="block max-w-xs space-y-1.5">
                <span className="text-sm font-medium">
                  {tbookT(locale, "howManyNeedRoom", { max: maxAccommodationGuests })}
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

          {recommendedStayLabel ? (
            <p className="text-sm text-muted-foreground">
              {tbookT(locale, "suggestedStay", {
                nights: recommendedNights,
                plural: recommendedNights === 1 ? "" : "s",
                label: recommendedStayLabel,
              })}
            </p>
          ) : null}

          {showRooms ? (
            <div className="space-y-3">
              <label className="block max-w-xs space-y-1.5">
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
              <div>
                <p className="text-sm font-medium">{copy.roomTypeLabel}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {selectedHotel.pricing.roomTypes.map((room) => {
                    const selected = roomTypeKey === room.key
                    return (
                      <button
                        key={room.key}
                        type="button"
                        className={CHOICE_CARD(selected)}
                        aria-pressed={selected}
                        onClick={() => {
                          const next: TBookSelections = {
                            ...lodging.selections,
                            [ROOM_TYPE_SELECTION_KEY]: room.key,
                          }
                          delete next[PACKAGE_DEAL_SELECTION_KEY]
                          onLodgingChange(patchLodging(lodging, { selections: next }))
                          onQuoteReset()
                        }}
                      >
                        <span className="block text-sm font-semibold">{room.label}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatHuf(room.baseRateHuf, displayCurrency)} {tbookT(locale, "perPersonPerNight")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
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
              locale={locale}
            />
          ) : null}

          {extrasSection ? (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold">{extrasSection.label}</p>
                {extrasSection.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {extrasSection.description}
                  </p>
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
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          ) : (
            selectedHotel.pricing.addonGroups?.map((group) => (
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
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </>
  )
}

function StayModeCards({
  lodgingMode,
  onChange,
  locale,
}: {
  lodgingMode: MultiLodgingMode
  onChange: (mode: MultiLodgingMode) => void
  locale?: string
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{tbookT(locale, "howToBookLodging")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {tbookT(locale, "hotelPerEventHint")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={CHOICE_CARD(lodgingMode === "separate")}
          aria-pressed={lodgingMode === "separate"}
          onClick={() => onChange("separate")}
        >
          <span className="block text-sm font-semibold">{tbookT(locale, "hotelPerEvent")}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {tbookT(locale, "hotelPerEventDesc")}
          </span>
        </button>
        <button
          type="button"
          className={CHOICE_CARD(lodgingMode === "combined")}
          aria-pressed={lodgingMode === "combined"}
          onClick={() => onChange("combined")}
        >
          <span className="block text-sm font-semibold">{tbookT(locale, "oneHotelForAllEvents")}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {tbookT(locale, "oneHotelDesc")}
          </span>
        </button>
      </div>
    </div>
  )
}

export function TBookMultiBookingWizard({
  apiKey,
  eventIds,
  copy,
  locale,
  copyTone = "entries",
}: {
  apiKey: string
  eventIds: string[]
  copy: Copy
  locale?: string
  copyTone?: TBookCopyTone
}) {
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
  const [lodgingMode, setLodgingMode] = useState<MultiLodgingMode>("separate")
  const [combinedLodging, setCombinedLodging] = useState<LodgingState>(() => emptyLodgingState())
  const [separateLodging, setSeparateLodging] = useState<Record<string, LodgingState>>({})
  const [customer, setCustomer] = useState(() => emptyCustomerForm())
  const [billing, setBilling] = useState<BillingFormState>(() => emptyBillingForm())
  const [showDetailsErrors, setShowDetailsErrors] = useState(false)
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [entryQuotes, setEntryQuotes] = useState<
    Array<{ eventId: string; eventName: string; quote: TBookPriceQuote }>
  >([])

  const events = useMemo(() => loadedEvents.map((row) => row.event), [loadedEvents])

  const wantsHotelByEventId = useMemo(() => {
    const map: Record<string, boolean | null> = {}
    for (const event of events) {
      map[event.id] = separateLodging[event.id]?.wantsHotel ?? null
    }
    return map
  }, [events, separateLodging])

  const wizardSteps = useMemo(
    () =>
      buildMultiWizardSteps({
        lodgingMode,
        events: events.map((e) => ({ id: e.id, name: e.name })),
        wantsHotelByEventId,
        wantsHotelCombined: combinedLodging.wantsHotel,
        hotelCount: hotels.length,
        locale,
        tone: copyTone,
      }),
    [lodgingMode, events, wantsHotelByEventId, combinedLodging.wantsHotel, hotels.length, locale, copyTone]
  )

  const stepRef = useRef(step)
  stepRef.current = step
  const prevWizardStepsRef = useRef(wizardSteps)
  useEffect(() => {
    const prevSteps = prevWizardStepsRef.current
    const prevDef = prevSteps[stepRef.current - 1]
    prevWizardStepsRef.current = wizardSteps
    const nextIndex = matchMultiWizardStepIndex(wizardSteps, prevDef, stepRef.current)
    if (nextIndex !== stepRef.current) setStep(nextIndex)
  }, [wizardSteps])

  const currentStepDef: MultiWizardStepDef | undefined = wizardSteps[step - 1]
  const stepLabels = wizardSteps.map((s) => s.label)
  const totalSteps = wizardSteps.length
  const detailsStepIndex = wizardSteps.findIndex((s) => s.kind === "details") + 1
  const reviewStepIndex = wizardSteps.findIndex((s) => s.kind === "review") + 1

  const combinedStayRecommendation = useMemo(
    () =>
      loadedEvents.length > 0
        ? stayForEvents(loadedEvents.map((row) => row.event))
        : null,
    [loadedEvents]
  )
  const combinedRecommendedNights =
    combinedStayRecommendation?.nights ?? events[0]?.nights ?? 1
  const combinedRecommendedStayLabel = combinedStayRecommendation
    ? formatStayDateRange(
        combinedStayRecommendation.startDate,
        combinedStayRecommendation.endDate,
        locale
      )
    : null

  const totalMaxAccommodationGuests = events.reduce(
    (sum, event) => sum + accommodationGuestCount(guestsByEvent[event.id] ?? 1, event),
    0
  )
  const totalRosterGuests = events.reduce(
    (sum, event) =>
      sum + countRosterPlayers(attendeesByEvent[event.id], event, guestsByEvent[event.id] ?? 1),
    0
  )
  const combinedAccommodationGuests = resolveAccommodationGuests(
    combinedLodging,
    totalMaxAccommodationGuests,
    totalRosterGuests
  )
  const combinedEffectiveHotelId =
    combinedLodging.accommodationNeed === "none" ? null : combinedLodging.selectedHotelId
  const combinedSelectedHotel =
    hotels.find((h) => h.id === combinedEffectiveHotelId) ?? null

  const lodgingForEvent = (
    eventId: string
  ): {
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

  const anySelectedHotel =
    lodgingMode === "combined"
      ? combinedSelectedHotel
      : events.map((e) => lodgingForEvent(e.id).selectedHotel).find(Boolean) ?? null
  const displayCurrency = hotelDisplayCurrency(anySelectedHotel, events[0] ?? null)

  useEffect(() => {
    if (!apiKey.trim() || eventIds.length < 2) {
      setError(
        eventIds.length < 2
          ? tbookT(locale, "selectAtLeastTwoEvents")
          : tbookT(locale, "apiKeyMissing")
      )
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
          const rosterSize = initialPlayerMemberCount(res.event)
          const withMembers = needsPlayerMemberForms(res.event)
          nextAttendees[res.event.id] = emptyAttendeeRows(1, rosterSize, withMembers)
          const stay = stayForEvents([res.event])
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
        const combinedStay = stayForEvents(loadedEventList)

        setLoadedEvents(nextEvents)
        setHotels(nextHotels)
        setGuestsByEvent(nextGuests)
        setAttendeesByEvent(nextAttendees)
        setSeparateLodging(nextSeparateLodging)
        setCombinedLodging(emptyLodgingState(combinedStay.nights))
        setLodgingMode("separate")
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
  }, [apiKey, eventIds, copy.eventError, locale])

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
            initialPlayerMemberCount(event),
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
  }, [
    combinedLodging.accommodationNeed,
    combinedLodging.accommodationGuestOverride,
    totalMaxAccommodationGuests,
  ])

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
        const teamMemberCount = countRosterPlayers(attendeesByEvent[event.id], event, guestCount)
        return {
          eventId: event.id,
          guests: guestCount,
          accommodationGuests: index === 0 ? combinedAccommodationGuests : 0,
          teamMemberCount,
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
      const lodging = separateLodging[event.id] ?? emptyLodgingState()
      const maxAcc = accommodationGuestCount(guestCount, event)
      const rosterGuests = countRosterPlayers(attendeesByEvent[event.id], event, guestCount)
      const accGuests = resolveAccommodationGuests(lodging, maxAcc, rosterGuests)
      const hotelId = accGuests > 0 ? lodging.selectedHotelId : null
      return {
        eventId: event.id,
        guests: guestCount,
        accommodationGuests: accGuests,
        teamMemberCount: rosterGuests,
        hotelId,
        nights: hotelId ? lodging.nights : null,
        selections: hotelId ? lodging.selections : null,
      }
    })

    return { lodgingMode: "separate", entries }
  }

  const resetQuote = () => {
    setQuote(null)
    setEntryQuotes([])
  }

  const changeLodgingMode = (mode: MultiLodgingMode) => {
    if (mode === lodgingMode) return
    setLodgingMode(mode)
    resetQuote()
  }

  function lodgingRoomsValid(lodging: LodgingState, maxAcc: number, rosterGuests: number): boolean {
    const selectedHotel =
      lodging.selectedHotelId != null
        ? hotels.find((h) => h.id === lodging.selectedHotelId) ?? null
        : null
    const showRooms = selectedHotel ? hotelShowsRoomSelection(selectedHotel.pricing) : false
    const packagesRequired = selectedHotel
      ? hotelRequiresPackageSelection(selectedHotel.pricing)
      : false
    const accGuests = resolveAccommodationGuests(lodging, maxAcc, rosterGuests)
    return isMultiRoomsStepValid({
      hotelCount: hotels.length,
      wantsHotel: lodging.wantsHotel,
      selectedHotelId: lodging.selectedHotelId,
      accommodationNeed: lodging.accommodationNeed,
      accommodationGuests: accGuests,
      packagesRequired,
      hasPackageSelection: lodgingHasPackageSelection(lodging.selections),
      roomsRequired: showRooms,
      hasRoomSelection: Boolean(String(lodging.selections[ROOM_TYPE_SELECTION_KEY] ?? "")),
    })
  }

  const step1Valid = events.every((event) => (guestsByEvent[event.id] ?? 1) >= 1)

  const currentHotelLodging =
    currentStepDef?.kind === "hotel" || currentStepDef?.kind === "rooms"
      ? currentStepDef.eventId == null
        ? combinedLodging
        : separateLodging[currentStepDef.eventId] ?? emptyLodgingState()
      : null

  const currentHotelMaxAcc = (() => {
    if (currentStepDef?.kind !== "hotel" && currentStepDef?.kind !== "rooms") return 0
    if (currentStepDef.eventId == null) return totalMaxAccommodationGuests
    const event = events.find((e) => e.id === currentStepDef.eventId)
    if (!event) return 1
    return accommodationGuestCount(guestsByEvent[event.id] ?? 1, event)
  })()

  const currentHotelRosterGuests = (() => {
    if (currentStepDef?.kind !== "hotel" && currentStepDef?.kind !== "rooms") return 0
    if (currentStepDef.eventId == null) return totalRosterGuests
    const event = events.find((e) => e.id === currentStepDef.eventId)
    if (!event) return 1
    return countRosterPlayers(
      attendeesByEvent[event.id],
      event,
      guestsByEvent[event.id] ?? 1
    )
  })()

  const hotelStepValid =
    currentHotelLodging != null &&
    isMultiHotelStepValid({
      hotelCount: hotels.length,
      wantsHotel: currentHotelLodging.wantsHotel,
      selectedHotelId: currentHotelLodging.selectedHotelId,
    })

  const roomsHotelFieldGroups = (() => {
    if (currentStepDef?.kind !== "rooms") return [] as Array<{
      eventId: string
      eventName: string
      schema: NonNullable<TBookPublicEvent["attendeeFieldSchema"]>
    }>
    const targets =
      lodgingMode === "combined"
        ? events[0]
          ? [events[0]]
          : []
        : events.filter((event) => event.id === currentStepDef.eventId)
    return targets.flatMap((event) => {
      const { selectedHotel, effectiveAccommodationNeed } = lodgingForEvent(event.id)
      if (effectiveAccommodationNeed === "none" || !selectedHotel) return []
      const schema = selectedHotel.registrationFieldSchema ?? []
      if (schema.length === 0) return []
      return [{ eventId: event.id, eventName: event.name, schema }]
    })
  })()

  const roomsHotelFieldsValid = roomsHotelFieldGroups.every((group) => {
    const event = events.find((e) => e.id === group.eventId)
    if (!event) return true
    return (
      validateAttendees(
        group.schema,
        guestsByEvent[event.id] ?? 1,
        attendeesByEvent[event.id] ?? [],
        event.registrationUnit ?? "person",
        undefined,
        locale
      ).length === 0
    )
  })

  const roomsStepValid =
    currentHotelLodging != null &&
    lodgingRoomsValid(currentHotelLodging, currentHotelMaxAcc, currentHotelRosterGuests) &&
    roomsHotelFieldsValid

  const perEventAttendeeIssues = useMemo(() => {
    const result: Record<
      string,
      { fieldIssues: AttendeeValidationIssue[]; eligibilityIssues: EligibilityIssue[] }
    > = {}
    for (const event of events) {
      const guestCount = guestsByEvent[event.id] ?? 1
      const registrationUnit = event.registrationUnit ?? "person"
      const registrationFieldSchema = event.attendeeFieldSchema ?? []
      const playerFields = playerFieldSchema(event)
      const playersPerTicket = resolvePlayersPerTicket(event)
      const eligibilityFixedRoster = playersPerTicket > 1 ? playersPerTicket : null
      const rows = attendeesByEvent[event.id] ?? []
      const fieldIssues = validateAttendees(
        registrationFieldSchema,
        guestCount,
        rows,
        registrationUnit,
        {
          teamMemberFieldSchema: playerFields,
          teamMemberLimit: event.teamMemberLimit ?? null,
          playersPerTicket: eligibilityFixedRoster,
        },
        locale
      )
      const eligibilityIssues = validateEligibility(
        event,
        rows,
        registrationFieldSchema,
        playerFields,
        eligibilityFixedRoster,
        locale
      )
      result[event.id] = { fieldIssues, eligibilityIssues }
    }
    return result
  }, [events, guestsByEvent, attendeesByEvent, locale])

  const playersValid = events.every((event) => {
    const issues = perEventAttendeeIssues[event.id]
    if (!issues) return true
    return issues.fieldIssues.length === 0 && issues.eligibilityIssues.length === 0
  })

  const customerFieldErrors = useMemo(
    () => (showDetailsErrors ? validateCustomerForm(customer) : {}),
    [showDetailsErrors, customer]
  )
  const billingFieldErrors = useMemo(
    () => (showDetailsErrors ? validateBillingForm(billing) : {}),
    [showDetailsErrors, billing]
  )

  const detailsValid = isCustomerFormValid(customer) && isBillingFormValid(billing)

  const canProceedCurrentStep = (() => {
    if (!currentStepDef) return false
    switch (currentStepDef.kind) {
      case "entries":
        return step1Valid
      case "hotel":
        return hotelStepValid
      case "rooms":
        return roomsStepValid
      case "players":
        return playersValid
      case "details":
        // Keep Continue enabled so Zod field errors can surface on click.
        return true
      case "review":
        return Boolean(quote)
      default:
        return false
    }
  })()

  const runQuote = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await quoteMultiBooking(apiKey.trim(), buildQuotePayload())
      setQuote(res.quote)
      setEntryQuotes(res.entries)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : tbookT(locale, "priceCalcError"))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const runBooking = async () => {
    if (!acceptedLegal) {
      setError(tbookT(locale, "acceptTerms"))
      return
    }
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
          const { selectedHotel, effectiveAccommodationNeed } = lodgingForEvent(event.id)
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
      setError(err instanceof Error ? err.message : tbookT(locale, "bookingFailed"))
      setSubmitting(false)
    }
  }

  const patchAttendeeFields = (
    eventId: string,
    index: number,
    updater: (row: TBookBookingAttendeePayload) => TBookBookingAttendeePayload
  ) => {
    setAttendeesByEvent((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).map((row, i) => (i === index ? updater(row) : row)),
    }))
    setError(null)
    resetQuote()
  }

  const goNext = async () => {
    if (!currentStepDef) return

    if (currentStepDef.kind === "entries") {
      if (!step1Valid) {
        setError(tbookT(locale, "atLeastOneEntryPerEvent", undefined, copyTone))
        return
      }
      setError(null)
      setStep((s) => Math.min(s + 1, totalSteps))
      return
    }

    if (currentStepDef.kind === "hotel") {
      if (!hotelStepValid) {
        setError(tbookT(locale, "chooseHotelNeed"))
        return
      }
      if (currentHotelLodging?.wantsHotel === true && !currentHotelLodging.selectedHotelId) {
        setError(tbookT(locale, "completeHotelSelection"))
        return
      }
      setError(null)
      setStep((s) => Math.min(s + 1, totalSteps))
      return
    }

    if (currentStepDef.kind === "rooms") {
      if (!roomsStepValid) {
        if (currentHotelLodging?.accommodationNeed === "none") {
          setError(tbookT(locale, "chooseWhoNeedsRoom"))
          return
        }
        const selectedHotel =
          currentHotelLodging?.selectedHotelId != null
            ? hotels.find((h) => h.id === currentHotelLodging.selectedHotelId) ?? null
            : null
        if (
          selectedHotel &&
          hotelRequiresPackageSelection(selectedHotel.pricing) &&
          !lodgingHasPackageSelection(currentHotelLodging?.selections ?? {})
        ) {
          setError(tbookT(locale, "selectPackage"))
          return
        }
        if (
          selectedHotel &&
          hotelShowsRoomSelection(selectedHotel.pricing) &&
          !String(currentHotelLodging?.selections[ROOM_TYPE_SELECTION_KEY] ?? "")
        ) {
          setError(tbookT(locale, "selectRoomType"))
          return
        }
        setError(tbookT(locale, "completeRoomSelection"))
        return
      }
      setError(null)
      setStep((s) => Math.min(s + 1, totalSteps))
      return
    }

    if (currentStepDef.kind === "players") {
      if (!playersValid) {
        const firstEligibility = events
          .flatMap((e) => perEventAttendeeIssues[e.id]?.eligibilityIssues ?? [])
          .map((i) => i.message)
        if (firstEligibility.length > 0) {
          setError(firstEligibility.join(" "))
        } else {
          setError(tbookT(locale, "completeParticipantDetailsPerEvent", undefined, copyTone))
        }
        return
      }
      setError(null)
      setStep((s) => Math.min(s + 1, totalSteps))
      return
    }

    if (currentStepDef.kind === "details") {
      setShowDetailsErrors(true)
      if (!detailsValid) {
        setError(tbookT(locale, "completeContactBilling"))
        return
      }
      setError(null)
      setQuote(null)
      setEntryQuotes([])
      setStep(reviewStepIndex)
      const ok = await runQuote()
      if (!ok) setStep(detailsStepIndex)
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
        <LocaleLink href="/jegyek" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
          ← Back to events
        </LocaleLink>
      </div>
    )
  }

  if (events.length < 2) return null

  const renderLodgingPanel = (
    phase: "hotel" | "rooms",
    lodging: LodgingState,
    onLodgingChange: (next: LodgingState) => void,
    stayEvents: TBookPublicEvent[],
    maxAcc: number,
    rosterGuests: number,
    recommendedNights: number,
    recommendedStayLabel: string | null,
    fallbackEvent: TBookPublicEvent,
    stayHeading?: string,
    stayEventNames?: string[]
  ) => (
    <HotelLodgingPanel
      phase={phase}
      hotels={hotels}
      lodging={lodging}
      onLodgingChange={onLodgingChange}
      maxAccommodationGuests={maxAcc}
      rosterGuests={rosterGuests}
      recommendedNights={recommendedNights}
      recommendedStayLabel={recommendedStayLabel}
      fallbackEvent={fallbackEvent}
      copy={copy}
      onQuoteReset={resetQuote}
      stayEvents={stayEvents}
      stayHeading={stayHeading}
      stayEventNames={stayEventNames}
      locale={locale}
    />
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <LocaleLink
          href="/jegyek"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {tbookT(locale, "backToEvents", undefined, copyTone)}
        </LocaleLink>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tbookT(locale, "bookMultipleEvents")}</h1>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {events.map((event) => (
              <li key={event.id}>
                {event.name} ·{" "}
                {formatEventSchedule(
                  event.startDate,
                  event.endDate,
                  event.startTime,
                  event.endTime,
                  locale
                )}
              </li>
            ))}
          </ul>
        </div>
        <BookingStepIndicator steps={stepLabels} current={step} locale={locale} />
      </header>

      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {currentStepDef?.kind === "entries" ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{tbookT(locale, "numberOfEntries", undefined, copyTone)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tbookT(locale, "setHowManyEntriesHint", undefined, copyTone)}
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
                      event.endTime,
                      locale
                    )}
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    {registrationUnit === "team"
                      ? tbookT(locale, "numberOfTeams")
                      : playersPerTicket > 1
                        ? tbookT(locale, "guestsLabelWithPlayers", { label: copy.guestsLabel, count: playersPerTicket })
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
                      ? tbookT(locale, "entriesTimesPlayersTotal", {
                          guests: guestCount,
                          entryWord: tbookT(
                            locale,
                            guestCount === 1 ? "unitEntrySingular" : "unitEntryPlural",
                            undefined,
                            copyTone
                          ),
                          playersPerTicket,
                          total: maxAcc,
                        })
                      : tbookT(locale, "peopleTotalSimple", {
                          guests: guestCount,
                          personWord: tbookT(
                            locale,
                            guestCount === 1 ? "unitPersonSingular" : "unitPersonPlural",
                            undefined,
                            copyTone
                          ),
                        })}
                  </p>
                </label>
              </div>
            )
          })}
        </section>
      ) : null}

      {currentStepDef?.kind === "hotel" || currentStepDef?.kind === "rooms" ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          {hotels.length > 0 ? (
            <>
              {currentStepDef.kind === "hotel" ? (
                <StayModeCards lodgingMode={lodgingMode} onChange={changeLodgingMode} locale={locale} />
              ) : null}

              {lodgingMode === "combined" ? (
                renderLodgingPanel(
                  currentStepDef.kind,
                  combinedLodging,
                  (next) => setCombinedLodging((prev) => (prev === next ? prev : next)),
                  events,
                  totalMaxAccommodationGuests,
                  totalRosterGuests,
                  combinedRecommendedNights,
                  combinedRecommendedStayLabel,
                  events[0],
                  currentStepDef.kind === "hotel" ? tbookT(locale, "oneStayForAllEvents") : undefined,
                  currentStepDef.kind === "hotel" ? events.map((e) => e.name) : undefined
                )
              ) : currentStepDef.eventId ? (
                (() => {
                  const event = events.find((e) => e.id === currentStepDef.eventId)
                  if (!event) return null
                  const lodging = separateLodging[event.id] ?? emptyLodgingState()
                  const stay = stayForEvents([event])
                  const stayLabel = formatStayDateRange(stay.startDate, stay.endDate, locale)
                  const maxAcc = accommodationGuestCount(guestsByEvent[event.id] ?? 1, event)
                  const rosterGuests = countRosterPlayers(
                    attendeesByEvent[event.id],
                    event,
                    guestsByEvent[event.id] ?? 1
                  )
                  return renderLodgingPanel(
                    currentStepDef.kind,
                    lodging,
                    (next) => {
                      setSeparateLodging((prev) => {
                        if (prev[event.id] === next) return prev
                        return { ...prev, [event.id]: next }
                      })
                    },
                    [event],
                    maxAcc,
                    rosterGuests,
                    stay.nights,
                    stayLabel,
                    event,
                    currentStepDef.kind === "hotel" ? event.name : undefined
                  )
                })()
              ) : null}

              {currentStepDef.kind === "rooms" && roomsHotelFieldGroups.length > 0
                ? roomsHotelFieldGroups.map((group) => {
                    const event = events.find((e) => e.id === group.eventId)
                    if (!event) return null
                    const guestCount = guestsByEvent[event.id] ?? 1
                    const guestUnitLabel = registrationUnitLabel(
                      event.registrationUnit ?? "person",
                      guestCount,
                      locale
                    )
                    const rows = attendeesByEvent[event.id] ?? []
                    const hotelIssues = validateAttendees(
                      group.schema,
                      guestCount,
                      rows,
                      event.registrationUnit ?? "person",
                      undefined,
                      locale
                    )
                    return (
                      <div key={group.eventId} className="space-y-4 border-t border-border pt-4">
                        <div>
                          <h3 className="text-sm font-semibold">{copy.attendeesHeading}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {group.eventName} · {copy.attendeesHint}
                          </p>
                        </div>
                        {rows.map((attendee, index) => (
                          <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                            <p className="text-sm font-semibold">
                              {index + 1}. {guestUnitLabel}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {group.schema.map((field) => (
                                <AttendeeFieldInput
                                  key={field.key}
                                  field={field}
                                  value={attendee.fields[field.key]}
                                  error={attendeeFieldError(hotelIssues, index, field.key)}
                                  onChange={(value) =>
                                    patchAttendeeFields(event.id, index, (row) => ({
                                      ...row,
                                      fields: { ...row.fields, [field.key]: value },
                                    }))
                                  }
                                  inputClassName={INPUT}
                                  locale={locale}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })
                : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tbookT(locale, "noHotelOptions", undefined, copyTone)}
            </p>
          )}
        </section>
      ) : null}

      {currentStepDef?.kind === "players" ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tbookT(locale, "enterPlayerDetailsPerEvent", undefined, copyTone)}
            </p>
          </div>

          {events.map((event) => {
            const guestCount = guestsByEvent[event.id] ?? 1
            const registrationUnit = event.registrationUnit ?? "person"
            const playersPerTicket = resolvePlayersPerTicket(event)
            const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount, locale)
            const registrationFieldSchema = event.attendeeFieldSchema ?? []
            const needsPlayerMembers = needsPlayerMemberForms(event)
            const playerFields = playerFieldSchema(event)
            const fixedRosterSize = playerRosterSize(event)
            const teamMemberLimit = event.teamMemberLimit ?? null
            const rows = attendeesByEvent[event.id] ?? []
            const rosterCount = countRosterPlayers(rows, event, guestCount)
            const fieldIssues = perEventAttendeeIssues[event.id]?.fieldIssues ?? []
            const eligibilityIssues = perEventAttendeeIssues[event.id]?.eligibilityIssues ?? []

            return (
              <div
                key={event.id}
                className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0"
              >
                <div>
                  <h3 className="text-base font-semibold">{event.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {playersPerTicket > 1
                      ? tbookT(locale, "attendeesPlayerFormsHint", {
                          playersPerTicket,
                          guests: guestCount,
                          entryWord: tbookT(
                            locale,
                            guestCount === 1 ? "unitEntrySingular" : "unitEntryPlural",
                            undefined,
                            copyTone
                          ),
                          total: rosterCount,
                        })
                      : registrationUnit === "team"
                        ? tbookT(locale, "attendeesTeamMemberHint", {
                            limitSuffix:
                              teamMemberLimit != null
                                ? tbookT(locale, "teamMemberLimitSuffix", { limit: teamMemberLimit })
                                : "",
                          })
                        : ""}
                  {copy.attendeesHint}
                  </p>
                </div>

                {registrationFieldSchema.length > 0 || needsPlayerMembers ? (
                  rows.map((attendee, index) => {
                    const entryEligibility = eligibilityIssuesForEntry(eligibilityIssues, index)
                    return (
                      <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                        <p className="text-sm font-semibold">
                          {index + 1}. {guestUnitLabel}
                        </p>
                        {entryEligibility.length > 0 ? (
                          <ul className="space-y-1 text-sm text-destructive" role="alert">
                            {entryEligibility.map((issue, i) => (
                              <li key={`${issue.message}-${i}`}>{issue.message}</li>
                            ))}
                          </ul>
                        ) : null}
                        {registrationFieldSchema.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {registrationFieldSchema.map((field) => (
                              <AttendeeFieldInput
                                key={field.key}
                                field={field}
                                value={attendee.fields[field.key]}
                                error={attendeeFieldError(fieldIssues, index, field.key)}
                                onChange={(value) =>
                                  patchAttendeeFields(event.id, index, (row) => ({
                                    ...row,
                                    fields: { ...row.fields, [field.key]: value },
                                  }))
                                }
                                inputClassName={INPUT}
                                locale={locale}
                              />
                            ))}
                          </div>
                        ) : null}
                        {needsPlayerMembers ? (
                          <div className="space-y-3 border-t border-border pt-3">
                            <p className="text-sm font-medium">
                              {registrationUnit === "team" ? tbookT(locale, "teamMembers") : tbookT(locale, "players")}
                            </p>
                            {(attendee.members ?? []).map((member, memberIndex) => (
                              <div
                                key={memberIndex}
                                className="space-y-2 rounded-lg bg-muted/30 p-3"
                              >
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {tbookT(locale, "playerOrdinal", { n: memberIndex + 1 })}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {playerFields.map((field) => (
                                    <AttendeeFieldInput
                                      key={field.key}
                                      field={field}
                                      value={member.fields[field.key]}
                                      error={attendeeFieldError(
                                        fieldIssues,
                                        index,
                                        field.key,
                                        memberIndex
                                      )}
                                      onChange={(value) =>
                                        patchAttendeeFields(event.id, index, (row) => ({
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
                                        }))
                                      }
                                      inputClassName={INPUT}
                                      locale={locale}
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
                                  patchAttendeeFields(event.id, index, (row) => ({
                                    ...row,
                                    members: [...(row.members ?? []), { fields: {} }],
                                  }))
                                }
                              >
                                {tbookT(locale, "addPlayer")}
                                {teamMemberLimit != null ? tbookT(locale, "addPlayerMax", { max: teamMemberLimit }) : ""}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {tbookT(locale, "noPlayerDetailsRequired", undefined, copyTone)}
                  </p>
                )}
              </div>
            )
          })}
        </section>
      ) : null}

      {currentStepDef?.kind === "details" ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <BookingCustomerForm
            customer={customer}
            onChange={(c) => {
              setCustomer(c)
              setError(null)
            }}
            inputClassName={INPUT}
            errors={customerFieldErrors}
            heading={copy.customerHeading}
            hint={copy.customerHint}
            locale={locale}
          />
          <BookingBillingForm
            billing={billing}
            onChange={(b) => {
              setBilling(b)
              setError(null)
            }}
            inputClassName={INPUT}
            errors={billingFieldErrors}
            locale={locale}
          />
        </section>
      ) : null}

      {currentStepDef?.kind === "review" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{copy.reviewHeading}</h2>
          {submitting || !quote ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" aria-hidden />
              <p className="text-sm">{tbookT(locale, "calculatingTotal")}</p>
            </div>
          ) : (
            <>
              <dl className="space-y-3 text-sm">
                {events.map((event) => {
                  const guestCount = guestsByEvent[event.id] ?? 1
                  const registrationUnit = event.registrationUnit ?? "person"
                  const guestUnitLabel = registrationUnitLabel(registrationUnit, guestCount, locale)
                  const entryQuote = entryQuotes.find((row) => row.eventId === event.id)
                  const { lodging, selectedHotel, isSharedStay } = lodgingForEvent(event.id)
                  const maxAcc = accommodationGuestCount(guestCount, event)
                  const rosterGuests = countRosterPlayers(
                    attendeesByEvent[event.id],
                    event,
                    guestCount
                  )
                  let accGuests = 0
                  if (lodgingMode === "combined") {
                    accGuests =
                      event.id === events[0]?.id ? combinedAccommodationGuests : 0
                  } else {
                    accGuests = resolveAccommodationGuests(lodging, maxAcc, rosterGuests)
                  }

                  let hotelLabel = tbookT(locale, "entryOnly")
                  if (isSharedStay) {
                    hotelLabel = tbookT(locale, "sharedHotelStay")
                  } else if (selectedHotel && accGuests > 0) {
                    hotelLabel = tbookT(locale, "hotelSummary", {
                      hotelName: selectedHotel.name,
                      guests: accGuests,
                      guestWord: tbookT(locale, accGuests === 1 ? "guestSingular" : "guestPlural"),
                    })
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
                        <span>{registrationUnit === "team" ? tbookT(locale, "teams") : tbookT(locale, "entries", undefined, copyTone)}</span>
                        <span>
                          {guestCount} {guestUnitLabel}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>{tbookT(locale, "hotelLabel")}</span>
                        <span className="text-right">{hotelLabel}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between gap-4 border-t border-border pt-3">
                  <dt className="text-muted-foreground">{tbookT(locale, "contactLabel")}</dt>
                  <dd className="text-right font-medium">{customer.name}</dd>
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
              <BookingLegalConsent
                id="multi-booking-legal-consent"
                accepted={acceptedLegal}
                onAcceptedChange={(next) => {
                  setAcceptedLegal(next)
                  setError(null)
                }}
                locale={locale}
              />
            </>
          )}
        </section>
      ) : null}

      <BookingWizardNav
        step={step}
        totalSteps={totalSteps}
        canProceed={
          currentStepDef?.kind === "review"
            ? Boolean(quote) && acceptedLegal
            : canProceedCurrentStep
        }
        submitting={submitting}
        backLabel={copy.backLabel}
        nextLabel={copy.nextLabel}
        quoteCta={copy.quoteCta}
        payCta={copy.payCta}
        payLoading={copy.payLoading}
        reviewStep={detailsStepIndex > 0 ? detailsStepIndex : Math.max(1, totalSteps - 1)}
        onBack={() => {
          setError(null)
          if (currentStepDef?.kind === "review") {
            setQuote(null)
            setEntryQuotes([])
          }
          setStep((s) => Math.max(s - 1, 1))
        }}
        onNext={() => void goNext()}
        onPay={() => void runBooking()}
      />
    </div>
  )
}
