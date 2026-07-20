"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import type { TBookAccommodationMode, TBookHotelPricing } from "../lib/pricing-types"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import {
  ACCOMMODATION_MODE_LABELS,
  assignPricingKeys,
  normalizeHotelPricing,
  resolveAccommodationMode,
  validateHotelPricingConfig,
} from "../lib/hotel-pricing"
import {
  tBookAdminApi,
  formatMoney,
  type AdminEvent,
  type AdminHotel,
} from "./t-book-api"
import {
  TBookField,
  tBookFormShellClass,
  tBookGhostButtonClass,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  tBookPanelClass,
  TBookSelect,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookGalleryField } from "./TBookMediaField"
import { TBookVatSettingsField } from "./TBookVatSettingsField"
import { RoomTypesEditor } from "./RoomTypesEditor"
import { PackageDealsEditor } from "./PackageDealsEditor"
import { ExtrasSectionEditor } from "./ExtrasSectionEditor"
import { CurrencySelect } from "./CurrencySelect"
import { AttendeeFieldsEditor } from "./AttendeeFieldsEditor"
import { useOrgCurrency } from "./use-org-currency"
import { normalizeTBookCurrency } from "../lib/currency"
import { HotelComplexitySummary } from "./HotelComplexitySummary"
import { PricingPreview } from "./PricingPreview"
import { TBookGroupSubnav } from "./TBookGroupSubnav"

import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

const HOTEL_STEPS = [
  { id: "info", title: "Szállás adatai" },
  { id: "rooms", title: "Szobatípusok" },
  { id: "addons", title: "Extrák és felárak" },
  { id: "registration", title: "Foglalási adatok" },
  { id: "review", title: "Összegzés" },
]

type HotelDraft = {
  name: string
  description: string
  address: string
  distanceFromVenueKm: string
  contactEmail: string
  contactPhone: string
  gallery: string[]
  currency: string
  bookingCapacity: string
  roomInventory: string
  status: "draft" | "active" | "archived"
  pricing: TBookHotelPricing
  registrationFieldSchema: TBookAttendeeFieldDef[]
}

const emptyPricing = (): TBookHotelPricing => ({
  priceBasis: "net",
  vatPercent: TBOOK_DEFAULT_VAT_PERCENT,
  roomTypes: [{ key: "standard", label: "Standard szoba", baseRateHuf: 0, sortOrder: 0 }],
  packages: [],
  extrasSection: null,
})

function hotelToDraft(hotel: AdminHotel | null): HotelDraft {
  if (!hotel) {
    return {
      name: "",
      description: "",
      address: "",
      distanceFromVenueKm: "",
      contactEmail: "",
      contactPhone: "",
      gallery: [],
      currency: "HUF",
      bookingCapacity: "",
      roomInventory: "",
      status: "draft",
      pricing: emptyPricing(),
      registrationFieldSchema: [],
    }
  }
  return {
    name: hotel.name,
    description: hotel.description,
    address: hotel.address,
    distanceFromVenueKm:
      hotel.distanceFromVenueKm != null ? String(hotel.distanceFromVenueKm) : "",
    contactEmail: hotel.contactEmail,
    contactPhone: hotel.contactPhone,
    gallery: hotel.gallery,
    currency: normalizeTBookCurrency(hotel.currency),
    bookingCapacity: hotel.bookingCapacity != null ? String(hotel.bookingCapacity) : "",
    roomInventory: hotel.roomInventory != null ? String(hotel.roomInventory) : "",
    status: hotel.status,
    pricing: normalizeHotelPricing(hotel.pricing),
    registrationFieldSchema: hotel.registrationFieldSchema ?? [],
  }
}

function eventNightsOf(event: AdminEvent): number {
  const ms = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

export function HotelFormPage({
  groupId,
  hotelId,
}: {
  groupId: string
  hotelId?: string
}) {
  const router = useRouter()
  const { currency: orgCurrency } = useOrgCurrency()
  const isEdit = Boolean(hotelId)
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState("")
  const [previewEvent, setPreviewEvent] = useState<AdminEvent | null>(null)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<HotelDraft>(() => hotelToDraft(null))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loads: Promise<void>[] = [
      tBookAdminApi<{ group: { name: string } }>(`groups/${groupId}`).then((g) => {
        setGroupName(g.group.name)
      }),
      tBookAdminApi<{ events: AdminEvent[] }>(`events?groupId=${groupId}`).then((e) => {
        setPreviewEvent(e.events[0] ?? null)
      }),
    ]
    if (hotelId) {
      loads.push(
        tBookAdminApi<{ hotel: AdminHotel }>(`hotels/${hotelId}`).then((res) => {
          setDraft(hotelToDraft(res.hotel))
        })
      )
    }
    Promise.all(loads)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId, hotelId])

  useEffect(() => {
    if (!isEdit) {
      setDraft((d) => ({ ...d, currency: orgCurrency }))
    }
  }, [orgCurrency, isEdit])

  const patch = (partial: Partial<HotelDraft>) => setDraft((d) => ({ ...d, ...partial }))
  const patchPricing = (partial: Partial<TBookHotelPricing>) =>
    setDraft((d) => ({
      ...d,
      pricing: assignPricingKeys({ ...d.pricing, ...partial }),
    }))

  const previewPricing = useMemo(() => assignPricingKeys(draft.pricing), [draft.pricing])
  const accommodationMode = resolveAccommodationMode(previewPricing)
  const roomTypes = previewPricing.roomTypes
  const priceBasisLabel = draft.pricing.priceBasis === "net" ? "nettó" : "bruttó"

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("A szállás neve kötelező.")
      setStep(0)
      return
    }
    const configError = validateHotelPricingConfig(draft.pricing)
    if (configError) {
      toast.error(configError)
      setStep(1)
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description,
        address: draft.address,
        distanceFromVenueKm: draft.distanceFromVenueKm
          ? Number(draft.distanceFromVenueKm)
          : null,
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        gallery: draft.gallery,
        currency: draft.currency,
        bookingCapacity: draft.bookingCapacity.trim()
          ? Math.max(0, Number(draft.bookingCapacity) || 0)
          : null,
        roomInventory: draft.roomInventory.trim()
          ? Math.max(0, Number(draft.roomInventory) || 0)
          : null,
        status: draft.status,
        pricing: draft.pricing,
        registrationFieldSchema: draft.registrationFieldSchema,
      }
      if (isEdit && hotelId) {
        await tBookAdminApi(`hotels/${hotelId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás mentve")
      } else {
        await tBookAdminApi(`groups/${groupId}/hotels`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Szállás létrehozva")
      }
      router.push(`/admin/plugins/t-book/groups/${groupId}/hotels`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TBookLoading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookGroupSubnav groupId={groupId} groupName={groupName} />
      <TBookPageHeader
        title={isEdit ? `Szállás: ${draft.name || "…"}` : "Új szállás"}
        description="Szállás → szobatípusok és csomagajánlatok → extrák (egy szakasz)"
        actions={
          <Link
            href={`/admin/plugins/t-book/groups/${groupId}/hotels`}
            className={tBookGhostButtonClass}
          >
            ← Vissza a szállásokhoz
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className={tBookFormShellClass}>
            <TBookWizard
              steps={HOTEL_STEPS}
              currentStep={step}
              onStepChange={setStep}
              onSubmit={() => void save()}
              submitting={saving}
              submitLabel={isEdit ? "Szállás mentése" : "Szállás létrehozása"}
            >
              {step === 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Szállás neve">
                      <TBookInput
                        value={draft.name}
                        onChange={(e) => patch({ name: e.target.value })}
                        placeholder="Hotel Panoráma"
                        autoFocus
                      />
                    </TBookField>
                    <TBookField label="Státusz">
                      <TBookSelect
                        value={draft.status}
                        onChange={(e) =>
                          patch({ status: e.target.value as HotelDraft["status"] })
                        }
                      >
                        <option value="draft">Vázlat</option>
                        <option value="active">Aktív</option>
                        <option value="archived">Archivált</option>
                      </TBookSelect>
                    </TBookField>
                  </div>
                  <TBookField label="Cím">
                    <TBookInput
                      value={draft.address}
                      onChange={(e) => patch({ address: e.target.value })}
                      placeholder="8600 Siófok, Petőfi sétány 1."
                    />
                  </TBookField>
                  <TBookField label="Távolság a helyszíntől (km)">
                    <TBookInput
                      type="number"
                      min={0}
                      step="0.1"
                      value={draft.distanceFromVenueKm}
                      onChange={(e) => patch({ distanceFromVenueKm: e.target.value })}
                      placeholder="pl. 2.5"
                    />
                  </TBookField>
                  <TBookField label="Max. foglalható férőhely (hotel)">
                    <TBookInput
                      type="number"
                      min={0}
                      step={1}
                      value={draft.bookingCapacity}
                      onChange={(e) => patch({ bookingCapacity: e.target.value })}
                      placeholder="pl. 40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Összes szálláshely-foglaló vendég felső határa ehhez a szálláshoz (nem
                      szobatípusonként / csomagonként). Üres = korlátlan.
                    </p>
                  </TBookField>
                  <TBookField label="Max. szobaszám (közös készlet)">
                    <TBookInput
                      type="number"
                      min={0}
                      step={1}
                      value={draft.roomInventory}
                      onChange={(e) => patch({ roomInventory: e.target.value })}
                      placeholder="pl. 20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Közös szobaallokáció minden csomagra (pl. 20 szoba single + double
                      együtt). Üres = korlátlan. Csomagonkénti készlet továbbra is
                      szűkíthet.
                    </p>
                  </TBookField>
                  <TBookRichTextField
                    label="Leírás"
                    value={draft.description}
                    onChange={(description) => patch({ description })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Kapcsolat e-mail">
                      <TBookInput
                        value={draft.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                      />
                    </TBookField>
                    <TBookField label="Kapcsolat telefon">
                      <TBookInput
                        value={draft.contactPhone}
                        onChange={(e) => patch({ contactPhone: e.target.value })}
                      />
                    </TBookField>
                  </div>
                  <TBookGalleryField
                    label="Galéria"
                    value={draft.gallery}
                    onChange={(gallery) => patch({ gallery })}
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <TBookField label="Szállás pénzneme">
                    <CurrencySelect
                      value={draft.currency}
                      onValueChange={(currency) => patch({ currency })}
                    />
                  </TBookField>
                  <TBookField label="Szállás árazása">
                    <TBookSelect
                      value={draft.pricing.accommodationMode ?? accommodationMode}
                      onChange={(e) =>
                        patchPricing({
                          accommodationMode: e.target.value as TBookAccommodationMode,
                        })
                      }
                    >
                      {(
                        Object.entries(ACCOMMODATION_MODE_LABELS) as Array<
                          [TBookAccommodationMode, string]
                        >
                      ).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </TBookSelect>
                  </TBookField>
                  <TBookVatSettingsField
                    label={
                      accommodationMode === "packages"
                        ? "ÁFA beállítások (csomagajánlatok)"
                        : "ÁFA beállítások (minden szobatípusra)"
                    }
                    priceBasis={(draft.pricing.priceBasis ?? "net") as TBookPriceBasis}
                    vatPercent={draft.pricing.vatPercent ?? TBOOK_DEFAULT_VAT_PERCENT}
                    onPriceBasisChange={(priceBasis) => patchPricing({ priceBasis })}
                    onVatPercentChange={(vatPercent) => patchPricing({ vatPercent })}
                  />
                  {accommodationMode === "room_nights" || accommodationMode === "both" ? (
                    <RoomTypesEditor
                      roomTypes={draft.pricing.roomTypes}
                      onChange={(roomTypes) => patchPricing({ roomTypes })}
                      priceBasisLabel={priceBasisLabel}
                      currency={draft.currency}
                    />
                  ) : null}
                  {accommodationMode === "packages" || accommodationMode === "both" ? (
                    <PackageDealsEditor
                      packages={draft.pricing.packages ?? []}
                      onChange={(packages) => patchPricing({ packages })}
                      roomTypes={roomTypes}
                      currency={draft.currency}
                      priceBasisLabel={priceBasisLabel}
                      packagesOnly={accommodationMode === "packages"}
                      required={accommodationMode === "packages"}
                    />
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <ExtrasSectionEditor
                  section={draft.pricing.extrasSection ?? null}
                  onChange={(extrasSection) => patchPricing({ extrasSection })}
                  roomTypes={roomTypes}
                />
              ) : null}

              {step === 3 ? (
                <AttendeeFieldsEditor
                  fields={draft.registrationFieldSchema}
                  onChange={(registrationFieldSchema) => patch({ registrationFieldSchema })}
                  scope="hotel"
                />
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <HotelComplexitySummary pricing={draft.pricing} />
                  <div className={`${tBookPanelClass} text-sm space-y-2`}>
                    <p>
                      <strong className="text-foreground">{draft.name || "—"}</strong>
                      {draft.distanceFromVenueKm
                        ? ` · ${draft.distanceFromVenueKm} km a helyszíntől`
                        : ""}
                    </p>
                    <p className="text-neutral-400 text-xs">{draft.address || "Nincs cím"}</p>
                    <p className="text-neutral-300 text-xs">
                      {ACCOMMODATION_MODE_LABELS[accommodationMode]}
                      {draft.pricing.roomTypes.length > 0
                        ? ` · ${draft.pricing.roomTypes.length} szobatípus`
                        : ""}
                      {(draft.pricing.packages ?? []).length > 0
                        ? ` · ${(draft.pricing.packages ?? []).length} csomagajánlat`
                        : ""}
                      {draft.pricing.extrasSection ? " · extrák szakasz" : ""}
                      {draft.registrationFieldSchema.length > 0
                        ? ` · ${draft.registrationFieldSchema.length} foglalási mező`
                        : ""}
                    </p>
                    {draft.pricing.roomTypes.length > 0 ? (
                      <ul className="text-xs text-neutral-500 space-y-1">
                        {draft.pricing.roomTypes.map((room) => (
                          <li key={room.key}>
                            {room.label}: {formatMoney(room.baseRateHuf, draft.currency)} / fő / éj (
                            {priceBasisLabel})
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {(draft.pricing.packages ?? []).length > 0 ? (
                      <ul className="text-xs text-neutral-500 space-y-1">
                        {(draft.pricing.packages ?? []).map((pkg) => (
                          <li key={pkg.key}>
                            {pkg.label}: {formatMoney(pkg.priceHuf, draft.currency)} ({pkg.nights}{" "}
                            éj, {priceBasisLabel})
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </TBookWizard>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 h-fit space-y-4">
          <HotelComplexitySummary pricing={previewPricing} />
          {previewEvent ? (
            <PricingPreview
              ticketFeeHuf={previewEvent.ticketFeeHuf}
              ticketFeeMode={previewEvent.ticketFeeMode}
              ticketPriceBasis={previewEvent.ticketPriceBasis}
              ticketVatPercent={previewEvent.ticketVatPercent}
              ticketCurrency={previewEvent.currency}
              defaultNights={eventNightsOf(previewEvent)}
              pricing={previewPricing}
              hotelCurrency={draft.currency}
            />
          ) : (
            <p className="text-xs text-neutral-500 rounded-xl bg-muted/20 p-4 ring-1 ring-inset ring-border/15">
              Ár-előnézethez hozz létre legalább egy eseményt a csoportban.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
