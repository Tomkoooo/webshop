"use client"

import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, BedDouble, Loader2 } from "lucide-react"
import { StorefrontRichHtml } from "@wse/core/components/common/StorefrontRichHtml"
import { mediaImageSrc, PLACEHOLDER_IMAGE } from "@wse/core/lib/images"
import { validateAttendees, type AttendeeValidationIssue } from "../lib/attendee-fields"
import {
  SINGLE_WIZARD_REVIEW_STEP,
  SINGLE_WIZARD_TOTAL_STEPS,
  canProceedBookingStep,
  nextWizardStep,
  prevWizardStep,
  singleWizardStepLabels,
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
  needsPlayerMemberForms,
  playerFieldSchema,
  playerRosterSize,
  initialPlayerMemberCount,
  resolvePlayersPerTicket,
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
import { tbookT } from "../lib/i18n"

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
  const rosterSize = eventDetail ? initialPlayerMemberCount(eventDetail) : 1
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

export function TBookBookingWizard({
  apiKey,
  eventId,
  copy,
  initialEventDetail,
  locale,
}: {
  apiKey: string
  eventId: string
  copy: Copy
  /** When set, event detail was loaded on the server — same path as /jegyek. */
  initialEventDetail?: TBookPublicEventDetailResult
  locale?: string
}) {
  const serverProvided = initialEventDetail !== undefined
  const steps = singleWizardStepLabels(locale)
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
  const [customer, setCustomer] = useState(() => emptyCustomerForm())
  const [billing, setBilling] = useState<BillingFormState>(() => emptyBillingForm())
  const [showDetailsErrors, setShowDetailsErrors] = useState(false)
  const [attendees, setAttendees] = useState<TBookBookingAttendeePayload[]>([])
  const [quote, setQuote] = useState<TBookPriceQuote | null>(null)
  const [wantsHotel, setWantsHotel] = useState<boolean | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)

  const stayRecommendation = useMemo(
    () => (event ? recommendStayForEvents([event]) : null),
    [event]
  )
  const recommendedNights = stayRecommendation?.nights ?? event?.nights ?? 1
  const recommendedStayLabel = stayRecommendation
    ? formatStayDateRange(stayRecommendation.startDate, stayRecommendation.endDate, locale)
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
  const guestUnitLabel = registrationUnitLabel(registrationUnit, guests, locale)
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
  const hasPackageSelection =
    Boolean(packageDealKey) ||
    Boolean(activePackageUnits && Object.keys(activePackageUnits).length > 0)
  const hasRoomSelection = Boolean(roomTypeKey)

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
      setError(tbookT(locale, "apiKeyMissing"))
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
  }, [apiKey, eventId, copy.eventError, locale])

  useEffect(() => {
    if (serverProvided) return
    void loadEvent()
  }, [loadEvent, serverProvided])

  useEffect(() => {
    if (!event) return
    setAttendees(
      emptyAttendeeRows(guests, initialPlayerMemberCount(event), needsPlayerMemberForms(event))
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
      setError(err instanceof Error ? err.message : tbookT(locale, "priceCalcError"))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const runBooking = async () => {
    if (!event) return
    if (!acceptedLegal) {
      setError(tbookT(locale, "acceptTerms"))
      return
    }
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
      setError(err instanceof Error ? err.message : tbookT(locale, "bookingFailed"))
      setSubmitting(false)
    }
  }

  const eligibilityFixedRoster = playersPerTicket > 1 ? playersPerTicket : null

  const attendeeFieldIssues = useMemo(
    () =>
      validateAttendees(
        registrationFieldSchema,
        guests,
        attendees,
        registrationUnit,
        {
          teamMemberFieldSchema: playerFields,
          teamMemberLimit,
          playersPerTicket: eligibilityFixedRoster,
        },
        locale
      ),
    [
      registrationFieldSchema,
      guests,
      attendees,
      registrationUnit,
      playerFields,
      teamMemberLimit,
      eligibilityFixedRoster,
      locale,
    ]
  )

  const eligibilityIssues = useMemo(
    () =>
      event
        ? validateEligibility(
            event,
            attendees,
            registrationFieldSchema,
            playerFields,
            eligibilityFixedRoster,
            locale
          )
        : [],
    [event, attendees, registrationFieldSchema, playerFields, eligibilityFixedRoster, locale]
  )

  const attendeesValid = attendeeFieldIssues.length === 0 && eligibilityIssues.length === 0

  const customerFieldErrors = useMemo(
    () => (showDetailsErrors ? validateCustomerForm(customer) : {}),
    [showDetailsErrors, customer]
  )
  const billingFieldErrors = useMemo(
    () => (showDetailsErrors ? validateBillingForm(billing) : {}),
    [showDetailsErrors, billing]
  )

  const detailsSchemaValid = isCustomerFormValid(customer) && isBillingFormValid(billing)

  const customerValid = detailsSchemaValid

  const canProceedCurrentStep = canProceedBookingStep({
    step,
    guests,
    hotelCount: hotels.length,
    wantsHotel,
    selectedHotelId,
    accommodationNeed,
    accommodationGuests,
    attendeesValid,
    // Keep Continue enabled on contact/billing so Zod field errors can surface on click.
    customerValid: step === 5 ? true : customerValid,
    hasQuote: Boolean(quote),
    packagesRequired,
    hasPackageSelection,
    roomsRequired: showRooms,
    hasRoomSelection,
  })

  const patchAttendeeFields = (
    index: number,
    updater: (row: TBookBookingAttendeePayload) => TBookBookingAttendeePayload
  ) => {
    setAttendees((rows) => rows.map((row, i) => (i === index ? updater(row) : row)))
    setError(null)
  }

  const goNext = async () => {
    if (step === 1) {
      if (guests < 1) {
        setError(tbookT(locale, "atLeastOneEntry"))
        return
      }
      setError(null)
      setStep(nextWizardStep(1, wantsHotel, hotels.length))
      return
    }
    if (step === 2) {
      if (hotels.length > 0 && wantsHotel === null) {
        setError(tbookT(locale, "chooseHotelNeed"))
        return
      }
      if (wantsHotel === true && !selectedHotelId) {
        setError(tbookT(locale, "completeHotelSelection"))
        return
      }
      setError(null)
      setStep(nextWizardStep(2, wantsHotel, hotels.length))
      return
    }
    if (step === 3) {
      if (accommodationNeed === "none" || !selectedHotelId) {
        setError(tbookT(locale, "chooseWhoNeedsRoom"))
        return
      }
      if (accommodationNeed === "some" && accommodationGuests < 1) {
        setError(tbookT(locale, "chooseHowManyNeedRoom"))
        return
      }
      if (packagesRequired && !hasPackageSelection) {
        setError(tbookT(locale, "selectPackage"))
        return
      }
      if (showRooms && !hasRoomSelection) {
        setError(tbookT(locale, "selectRoomType"))
        return
      }
      setError(null)
      setStep(nextWizardStep(3, wantsHotel, hotels.length))
      return
    }
    if (step === 4) {
      if (attendeeFieldIssues.length > 0) {
        setError(tbookT(locale, "completeParticipantDetails"))
        return
      }
      if (eligibilityIssues.length > 0) {
        setError(eligibilityIssues.map((issue) => issue.message).join(" "))
        return
      }
      setError(null)
      setStep(nextWizardStep(4, wantsHotel, hotels.length))
      return
    }
    if (step === 5) {
      setShowDetailsErrors(true)
      if (!customerValid) {
        setError(tbookT(locale, "completeContactBilling"))
        return
      }
      setError(null)
      setQuote(null)
      setStep(6)
      const ok = await runQuote()
      if (!ok) setStep(5)
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
        <LocaleLink href="/jegyek" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
          ← {tbookT(locale, "backToEvents")}
        </LocaleLink>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <LocaleLink
          href="/jegyek"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {tbookT(locale, "backToEvents")}
        </LocaleLink>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
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
        <BookingStepIndicator steps={steps} current={step} locale={locale} />
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{tbookT(locale, "numberOfEntries")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tbookT(locale, "howManyEntriesHint")}
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
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {playersPerTicket > 1
                ? tbookT(locale, "entriesTimesPlayersTotal", {
                    guests,
                    entryWord: tbookT(locale, guests === 1 ? "unitEntrySingular" : "unitEntryPlural"),
                    playersPerTicket,
                    total: maxAccommodationGuests,
                  })
                : tbookT(locale, "peopleTotalSimple", {
                    guests,
                    personWord: tbookT(locale, guests === 1 ? "unitPersonSingular" : "unitPersonPlural"),
                  })}
            </p>
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          {hotels.length > 0 ? (
            <>
              <div>
                <h2 className="text-lg font-semibold">{tbookT(locale, "accommodation")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tbookT(locale, "accommodationHint")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold">{tbookT(locale, "needHotel")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tbookT(locale, "needHotelHint")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    <span className="block text-sm font-semibold">{tbookT(locale, "noHotelEntryOnly")}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {tbookT(locale, "entryFeesOnlyHint")}
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
                    <span className="block text-sm font-semibold">{tbookT(locale, "yesNeedHotel")}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {tbookT(locale, "hotelNextHint")}
                    </span>
                  </button>
                </div>
              </div>

              {wantsHotel === true && !selectedHotel ? (
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
                  locale={locale}
                />
              ) : null}

              {wantsHotel === true && selectedHotel ? (
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
                        setSelectedHotelId(null)
                        setSelections({})
                        setQuote(null)
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
          ) : (
            <p className="text-sm text-muted-foreground">
              {tbookT(locale, "noHotelOptions")}
            </p>
          )}
        </section>
      ) : null}

      {step === 3 && selectedHotel ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{tbookT(locale, "chooseYourRoom")}</h2>
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
                  accommodationNeed === "some" && accommodationGuests < maxAccommodationGuests
                    ? tbookT(locale, "entriesWithoutRoomSuffix", {
                        count: maxAccommodationGuests - accommodationGuests,
                      })
                    : "",
              })}
            </p>
            <p className="text-sm font-medium">{tbookT(locale, "whoNeedsRoom")}</p>
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
                {tbookT(locale, "everyoneCount", { count: maxAccommodationGuests })}
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
                {tbookT(locale, "somePeopleOnly")}
              </button>
            </div>
            {accommodationNeed === "some" ? (
              <label className="block max-w-xs space-y-1.5">
                <span className="text-sm font-medium">
                  {tbookT(locale, "howManyNeedRoom", { max: maxAccommodationGuests })}
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
                  value={nights}
                  onChange={(e) => {
                    setNights(Number(e.target.value))
                    setQuote(null)
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
                          patchSelection(ROOM_TYPE_SELECTION_KEY, room.key)
                          patchSelection(PACKAGE_DEAL_SELECTION_KEY, "")
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
                setSelections((s) => {
                  const next: TBookSelections = { ...s }
                  delete next[PACKAGE_DEAL_SELECTION_KEY]
                  delete next[PACKAGE_UNITS_SELECTION_KEY]
                  return next
                })
                setNights(recommendedNights)
                setQuote(null)
              }}
              locale={locale}
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
                      value={selectionOptionValue(selections, option.key)}
                      visible={optionVisible(option, selections)}
                      onChange={(v) => patchSelection(option.key, v)}
                      inputClassName={INPUT}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">{copy.attendeesHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {playersPerTicket > 1
                ? tbookT(locale, "attendeesPlayerFormsHint", {
                    playersPerTicket,
                    guests,
                    entryWord: tbookT(locale, guests === 1 ? "unitEntrySingular" : "unitEntryPlural"),
                    total: maxAccommodationGuests,
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
            attendees.map((attendee, index) => {
              const entryEligibility = eligibilityIssuesForEntry(eligibilityIssues, index)
              return (
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
                          error={attendeeFieldError(attendeeFieldIssues, index, field.key)}
                          onChange={(value) =>
                            patchAttendeeFields(index, (row) => ({
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
                        <div key={memberIndex} className="space-y-2 rounded-lg bg-muted/30 p-3">
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
                                  attendeeFieldIssues,
                                  index,
                                  field.key,
                                  memberIndex
                                )}
                                onChange={(value) =>
                                  patchAttendeeFields(index, (row) => ({
                                    ...row,
                                    members: (row.members ?? []).map((m, mi) =>
                                      mi === memberIndex
                                        ? { fields: { ...m.fields, [field.key]: value } }
                                        : m
                                    ),
                                  }))
                                }
                                inputClassName={INPUT}
                                locale={locale}
                              />
                            ))}
                          </div>
                          {fixedRosterSize == null && (attendee.members ?? []).length > 1 ? (
                            <button
                              type="button"
                              className="text-xs text-destructive hover:underline"
                              onClick={() => {
                                patchAttendeeFields(index, (row) => ({
                                  ...row,
                                  members: (row.members ?? []).filter(
                                    (_, mi) => mi !== memberIndex
                                  ),
                                }))
                              }}
                            >
                              {tbookT(locale, "removePlayer")}
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
                          onClick={() => {
                            patchAttendeeFields(index, (row) => ({
                              ...row,
                              members: [...(row.members ?? []), { fields: {} }],
                            }))
                          }}
                        >
                          {tbookT(locale, "addPlayer")}
                          {teamMemberLimit != null ? tbookT(locale, "addPlayerMax", { max: teamMemberLimit }) : ""}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {entryEligibility.length > 0 ? (
                    <div
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                      role="alert"
                    >
                      {entryEligibility.map((issue) => (
                        <p key={`${issue.ticketIndex}-${issue.playerIndex}-${issue.message}`}>
                          {issue.message}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {tbookT(locale, "noPlayerDetailsRequired")}
            </p>
          )}
        </section>
      ) : null}

      {step === 5 ? (
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

      {step === 6 ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{copy.reviewHeading}</h2>
          {submitting || !quote ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" aria-hidden />
              <p className="text-sm">{tbookT(locale, "calculatingTotal")}</p>
            </div>
          ) : (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tbookT(locale, "eventLabel")}</dt>
                  <dd className="font-medium text-right">{event.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {registrationUnit === "team" ? tbookT(locale, "teams") : tbookT(locale, "entries")}
                  </dt>
                  <dd className="font-medium">
                    {guests} {guestUnitLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tbookT(locale, "hotelLabel")}</dt>
                  <dd className="font-medium text-right">
                    {effectiveHotelId && selectedHotel
                      ? tbookT(locale, "hotelSummary", {
                          hotelName: selectedHotel.name,
                          guests: accommodationGuests,
                          guestWord: tbookT(locale, accommodationGuests === 1 ? "guestSingular" : "guestPlural"),
                        })
                      : tbookT(locale, "entryOnly")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tbookT(locale, "players")}</dt>
                  <dd className="font-medium">{maxAccommodationGuests}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tbookT(locale, "contactLabel")}</dt>
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
              <BookingLegalConsent
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
        totalSteps={SINGLE_WIZARD_TOTAL_STEPS}
        canProceed={
          step === SINGLE_WIZARD_TOTAL_STEPS
            ? Boolean(quote) && acceptedLegal
            : canProceedCurrentStep
        }
        submitting={submitting}
        backLabel={copy.backLabel}
        nextLabel={copy.nextLabel}
        quoteCta={copy.quoteCta}
        payCta={copy.payCta}
        payLoading={copy.payLoading}
        reviewStep={SINGLE_WIZARD_REVIEW_STEP}
        onBack={() => {
          setError(null)
          if (step === SINGLE_WIZARD_TOTAL_STEPS) setQuote(null)
          setStep(prevWizardStep(step, wantsHotel, hotels.length))
        }}
        onNext={() => void goNext()}
        onPay={() => void runBooking()}
      />
    </div>
  )
}
