"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { emptyTBookLocation, type TBookLocation } from "../lib/location"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import { tBookAdminApi, formatMoney, type AdminEvent } from "./t-book-api"
import {
  TBookDateInput,
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
import { TBookLocationField } from "./TBookLocationField"
import { TBookSingleMediaField } from "./TBookMediaField"
import { TBookNetPriceField } from "./TBookNetPriceField"
import { CurrencySelect } from "./CurrencySelect"
import { AttendeeFieldsEditor } from "./AttendeeFieldsEditor"
import {
  ELIGIBILITY_OP_LABELS,
  ELIGIBILITY_PRESET_LABELS,
  expandLegacyEligibilityForEdit,
  type TBookEligibilityMatchOp,
  type TBookEligibilityRulesConfig,
} from "../lib/eligibility"
import {
  PRICING_RULE_ACTION_LABELS,
  PRICING_RULE_AMOUNT_MODE_LABELS,
  PRICING_RULE_WHEN_LABELS,
  type TBookPricingRule,
} from "../lib/pricing-rules"
import { TBookGroupSubnav } from "./TBookGroupSubnav"
import { useOrgCurrency } from "./use-org-currency"
import { normalizeTBookCurrency } from "../lib/currency"
import { formatEventSchedule, toTimeInputValue } from "../lib/event-schedule"
import {
  REGISTRATION_FIELDS_MODE_LABELS,
  registrationUnitLabel,
  resolveEventAttendeeFieldSchema,
  ticketFeeModeLabel,
} from "../lib/registration-fields"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

function toDateInputValue(value?: string): string {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "schedule", title: "Időpont & hely" },
  { id: "pricing", title: "Jegyár" },
  { id: "attendees", title: "Résztvevői adatok" },
  { id: "content", title: "Tartalom" },
]

type EventDraft = {
  name: string
  description: string
  status: AdminEvent["status"]
  location: TBookLocation
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  ticketFeeHuf: number
  ticketFeeMode: AdminEvent["ticketFeeMode"]
  registrationUnit: AdminEvent["registrationUnit"]
  playersPerTicket: string
  teamMemberLimit: string
  teamMemberFieldSchema: TBookAttendeeFieldDef[]
  ticketPriceBasis: TBookPriceBasis
  ticketVatPercent: number
  currency: string
  capacity: string
  heroImage: string
  voucherHeaderImage: string
  vouchersEnabled: boolean
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  attendeeFieldSchemaMode: AdminEvent["attendeeFieldSchemaMode"]
  eligibilityPreset: AdminEvent["eligibilityPreset"]
  eligibilityMinAge: string
  eligibilityMaxAge: string
  eligibilityAllowedGenders: string
  eligibilityBirthDateFieldKey: string
  eligibilityGenderFieldKey: string
  eligibilityFormRules: TBookEligibilityRulesConfig
  pricingRules: TBookPricingRule[]
}

export function EventFormPage({
  groupId,
  eventId,
}: {
  groupId: string
  eventId?: string
}) {
  const router = useRouter()
  const { currency: orgCurrency } = useOrgCurrency()
  const isEdit = Boolean(eventId)
  const [loading, setLoading] = useState(isEdit)
  const [groupName, setGroupName] = useState("")
  const [groupVoucherHeaderImage, setGroupVoucherHeaderImage] = useState("")
  const [groupDefaultHeroImage, setGroupDefaultHeroImage] = useState("")
  const [groupDefaultAttendeeFieldSchema, setGroupDefaultAttendeeFieldSchema] = useState<
    TBookAttendeeFieldDef[]
  >([])
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<EventDraft>({
    name: "",
    description: "",
    status: "draft",
    location: emptyTBookLocation(),
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    ticketFeeHuf: 0,
    ticketFeeMode: "per_person",
    registrationUnit: "person",
    playersPerTicket: "1",
    teamMemberLimit: "",
    teamMemberFieldSchema: [],
    ticketPriceBasis: "net",
    ticketVatPercent: TBOOK_DEFAULT_VAT_PERCENT,
    currency: orgCurrency,
    capacity: "",
    heroImage: "",
    voucherHeaderImage: "",
    vouchersEnabled: true,
    attendeeFieldSchema: [],
    attendeeFieldSchemaMode: "extend",
    eligibilityPreset: "none",
    eligibilityMinAge: "",
    eligibilityMaxAge: "",
    eligibilityAllowedGenders: "",
    eligibilityBirthDateFieldKey: "",
    eligibilityGenderFieldKey: "",
    eligibilityFormRules: { logic: "and", rules: [] },
    pricingRules: [],
  })

  useEffect(() => {
    const loads: Promise<void>[] = [
      tBookAdminApi<{
        group: {
          name: string
          voucherHeaderImage?: string
          defaultHeroImage?: string
          defaultAttendeeFieldSchema?: TBookAttendeeFieldDef[]
        }
      }>(`groups/${groupId}`).then((g) => {
        setGroupName(g.group.name)
        setGroupVoucherHeaderImage(g.group.voucherHeaderImage ?? "")
        setGroupDefaultHeroImage(g.group.defaultHeroImage ?? "")
        setGroupDefaultAttendeeFieldSchema(g.group.defaultAttendeeFieldSchema ?? [])
      }),
    ]
    if (eventId) {
      loads.push(
        tBookAdminApi<{ event: AdminEvent }>(`events/${eventId}`).then((res) => {
          const e = res.event
          setDraft({
            name: e.name,
            description: e.description,
            status: e.status,
            location: e.location ?? emptyTBookLocation(),
            startDate: toDateInputValue(e.startDate),
            endDate: toDateInputValue(e.endDate),
            startTime: toTimeInputValue(e.startTime),
            endTime: toTimeInputValue(e.endTime),
            ticketFeeHuf: e.ticketFeeHuf,
            ticketFeeMode: e.ticketFeeMode,
            registrationUnit: e.registrationUnit ?? "person",
            playersPerTicket: String(e.playersPerTicket ?? 1),
            teamMemberLimit: e.teamMemberLimit != null ? String(e.teamMemberLimit) : "",
            teamMemberFieldSchema: e.teamMemberFieldSchema ?? [],
            ticketPriceBasis: e.ticketPriceBasis ?? "net",
            ticketVatPercent: e.ticketVatPercent ?? TBOOK_DEFAULT_VAT_PERCENT,
            currency: normalizeTBookCurrency(e.currency),
            capacity: e.capacity != null ? String(e.capacity) : "",
            heroImage: e.heroImage,
            voucherHeaderImage: e.voucherHeaderImage ?? "",
            vouchersEnabled: e.vouchersEnabled !== false,
            attendeeFieldSchema: e.attendeeFieldSchema ?? [],
            attendeeFieldSchemaMode: e.attendeeFieldSchemaMode ?? "extend",
            ...(() => {
              const expanded = expandLegacyEligibilityForEdit(e)
              return {
                eligibilityPreset: expanded.eligibilityPreset,
                eligibilityMinAge:
                  expanded.eligibilityMinAge != null ? String(expanded.eligibilityMinAge) : "",
                eligibilityMaxAge:
                  expanded.eligibilityMaxAge != null ? String(expanded.eligibilityMaxAge) : "",
                eligibilityAllowedGenders: (expanded.eligibilityAllowedGenders ?? []).join(", "),
              }
            })(),
            eligibilityBirthDateFieldKey: e.eligibilityBirthDateFieldKey ?? "",
            eligibilityGenderFieldKey: e.eligibilityGenderFieldKey ?? "",
            eligibilityFormRules: e.eligibilityFormRules
              ? {
                  logic: e.eligibilityFormRules.logic,
                  rules: e.eligibilityFormRules.rules.map((r) => ({
                    id: r.id,
                    fieldKey: r.fieldKey,
                    op: r.op as TBookEligibilityMatchOp,
                    value: r.value,
                    message: r.message,
                  })),
                }
              : { logic: "and", rules: [] },
            pricingRules: e.pricingRules ?? [],
          })
        })
      )
    }
    Promise.all(loads)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId, eventId])

  useEffect(() => {
    if (!isEdit) {
      setDraft((d) => ({ ...d, currency: orgCurrency }))
    }
  }, [orgCurrency, isEdit])

  const patch = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }))

  const effectiveAttendeeFieldSchema = useMemo(
    () =>
      resolveEventAttendeeFieldSchema(
        groupDefaultAttendeeFieldSchema,
        draft.attendeeFieldSchema,
        draft.attendeeFieldSchemaMode
      ),
    [groupDefaultAttendeeFieldSchema, draft.attendeeFieldSchema, draft.attendeeFieldSchemaMode]
  )

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Az esemény neve kötelező.")
      setStep(0)
      return
    }
    setSaving(true)
    const payload = {
      groupId,
      name: draft.name.trim(),
      description: draft.description,
      location: draft.location,
      startDate: draft.startDate,
      endDate: draft.endDate,
      startTime: draft.startTime.trim() || null,
      endTime: draft.endTime.trim() || null,
      ticketFeeHuf: draft.ticketFeeHuf,
      ticketFeeMode: draft.ticketFeeMode,
      registrationUnit: draft.registrationUnit,
      playersPerTicket: draft.playersPerTicket ? Number(draft.playersPerTicket) : 1,
      teamMemberLimit: draft.teamMemberLimit ? Number(draft.teamMemberLimit) : null,
      teamMemberFieldSchema: draft.teamMemberFieldSchema,
      ticketPriceBasis: draft.ticketPriceBasis,
      ticketVatPercent: draft.ticketVatPercent,
      currency: draft.currency,
      capacity: draft.capacity ? Number(draft.capacity) : null,
      heroImage: draft.heroImage,
      voucherHeaderImage: draft.voucherHeaderImage,
      vouchersEnabled: draft.vouchersEnabled,
      attendeeFieldSchema: draft.attendeeFieldSchema,
      attendeeFieldSchemaMode: draft.attendeeFieldSchemaMode,
      eligibilityPreset: draft.eligibilityPreset,
      eligibilityMinAge: draft.eligibilityMinAge ? Number(draft.eligibilityMinAge) : null,
      eligibilityMaxAge: draft.eligibilityMaxAge ? Number(draft.eligibilityMaxAge) : null,
      eligibilityAllowedGenders: draft.eligibilityAllowedGenders
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      eligibilityBirthDateFieldKey: draft.eligibilityBirthDateFieldKey.trim() || null,
      eligibilityGenderFieldKey: draft.eligibilityGenderFieldKey.trim() || null,
      eligibilityFormRules:
        draft.eligibilityFormRules.rules.length > 0 ? draft.eligibilityFormRules : null,
      pricingRules: draft.pricingRules,
      status: draft.status,
    }
    try {
      if (isEdit && eventId) {
        await tBookAdminApi(`events/${eventId}`, { method: "PUT", body: JSON.stringify(payload) })
        toast.success("Esemény mentve")
      } else {
        await tBookAdminApi("events", { method: "POST", body: JSON.stringify(payload) })
        toast.success("Esemény létrehozva")
      }
      router.push(`/admin/plugins/t-book/groups/${groupId}/events`)
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
        title={isEdit ? `Esemény: ${draft.name || "…"}` : "Új esemény"}
        description="Alapadatok → időpont → jegyár → foglalási mezők → tartalom"
        actions={
          <Link
            href={`/admin/plugins/t-book/groups/${groupId}/events`}
            className={tBookGhostButtonClass}
          >
            ← Vissza az eseményekhez
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className={tBookFormShellClass}>
            <TBookWizard
              steps={STEPS}
              currentStep={step}
              onStepChange={setStep}
              onSubmit={() => void save()}
              submitting={saving}
              submitLabel={isEdit ? "Esemény mentése" : "Esemény létrehozása"}
            >
          {step === 0 ? (
            <div className="space-y-4">
              <TBookField label="Esemény neve">
                <TBookInput
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Sakkfesztivál 2026"
                />
              </TBookField>
              <TBookField label="Státusz">
                <TBookSelect
                  value={draft.status}
                  onChange={(e) => patch({ status: e.target.value as EventDraft["status"] })}
                >
                  <option value="draft">Vázlat</option>
                  <option value="active">Aktív</option>
                  <option value="archived">Archivált</option>
                </TBookSelect>
              </TBookField>
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Kezdő dátum">
                  <TBookDateInput
                    required
                    value={draft.startDate}
                    onChange={(e) => patch({ startDate: e.target.value })}
                  />
                </TBookField>
                <TBookField label="Záró dátum">
                  <TBookDateInput
                    required
                    value={draft.endDate}
                    onChange={(e) => patch({ endDate: e.target.value })}
                  />
                </TBookField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Kezdő időpont (opcionális)">
                  <TBookInput
                    type="time"
                    value={draft.startTime}
                    onChange={(e) => patch({ startTime: e.target.value })}
                  />
                </TBookField>
                <TBookField label="Záró időpont (opcionális)">
                  <TBookInput
                    type="time"
                    value={draft.endTime}
                    onChange={(e) => patch({ endTime: e.target.value })}
                  />
                </TBookField>
              </div>
              <p className="text-xs text-muted-foreground">
                Az időpontok a kezdő és záró napon értendők (pl. első nap 09:00, utolsó nap 18:00).
              </p>
              <TBookLocationField
                value={draft.location}
                onChange={(location) => patch({ location })}
              />
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <TBookField label="Jegy pénzneme">
                <CurrencySelect
                  value={draft.currency}
                  onValueChange={(currency) => patch({ currency })}
                />
              </TBookField>
              <TBookNetPriceField
                label={`Jegyár (${draft.currency})`}
                amount={draft.ticketFeeHuf}
                priceBasis={draft.ticketPriceBasis}
                vatPercent={draft.ticketVatPercent}
                currency={draft.currency}
                onAmountChange={(ticketFeeHuf) => patch({ ticketFeeHuf })}
                onPriceBasisChange={(ticketPriceBasis) => patch({ ticketPriceBasis })}
                onVatPercentChange={(ticketVatPercent) => patch({ ticketVatPercent })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Regisztráció egysége">
                  <TBookSelect
                    value={draft.registrationUnit}
                    onChange={(e) =>
                      patch({ registrationUnit: e.target.value as EventDraft["registrationUnit"] })
                    }
                  >
                    <option value="person">Személyenként (fő)</option>
                    <option value="team">Csapatonként</option>
                  </TBookSelect>
                  <p className="text-xs text-muted-foreground mt-1">
                    Egy vásárló több {registrationUnitLabel(draft.registrationUnit, 2)}t is
                    regisztrálhat — mindegyikhez külön adatok kérhetők.
                  </p>
                </TBookField>
                <TBookField label="Jegyár módja">
                  <TBookSelect
                    value={draft.ticketFeeMode}
                    onChange={(e) =>
                      patch({ ticketFeeMode: e.target.value as EventDraft["ticketFeeMode"] })
                    }
                  >
                    <option value="per_person">
                      {draft.registrationUnit === "team" ? "Csapatonként" : "Fő / jegy"}
                    </option>
                    <option value="per_team">Csapatonként (fix csapatdíj)</option>
                    <option value="per_booking">Foglalásonként (fix összeg)</option>
                  </TBookSelect>
                </TBookField>
              </div>
              <TBookField label={`Kapacitás (üres = korlátlan, ${draft.registrationUnit === "team" ? "csapat" : "jegy"})`}>
                <TBookInput
                  type="number"
                  min={0}
                  value={draft.capacity}
                  onChange={(e) => patch({ capacity: e.target.value })}
                />
              </TBookField>
              <TBookField
                label={
                  draft.registrationUnit === "team"
                    ? "Játékosok / csapat (fix létszám)"
                    : "Játékosok / jegy (pl. pár = 2)"
                }
              >
                <TBookInput
                  type="number"
                  min={1}
                  max={100}
                  value={draft.playersPerTicket}
                  onChange={(e) => patch({ playersPerTicket: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ennyi játékos adatot kell megadni jegyenként. A szállás és csomagajánlatok
                  számítása: jegyek × játékosok (pl. 1 párjegy × 2 = 2 fő szálláshoz).
                </p>
              </TBookField>
              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Ár szabályok (esemény)</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pl. ingyenes belépő + szálláscsomag kedvezmény, vagy felár ha nem szervezői
                      szállást választanak. A szabályok a foglalási árajánlatban jelennek meg.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={tBookGhostButtonClass}
                    onClick={() =>
                      patch({
                        pricingRules: [
                          ...draft.pricingRules,
                          {
                            id: `pr-${Date.now()}`,
                            enabled: true,
                            label: "Új szabály",
                            when: "without_hotel",
                            action: "adjust_total",
                            amount: 100,
                            amountMode: "per_person",
                          },
                        ],
                      })
                    }
                  >
                    Szabály hozzáadása
                  </button>
                </div>
                {draft.pricingRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nincs szabály — a jegyár és szállásár önmagában érvényes.
                  </p>
                ) : null}
                {draft.pricingRules.map((rule, index) => (
                  <div key={rule.id} className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={rule.enabled !== false}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index ? { ...r, enabled: e.target.checked } : r
                          )
                          patch({ pricingRules })
                        }}
                      />
                      Aktív
                    </label>
                    <TBookField label="Megjelenő név (árajánlat sor)">
                      <TBookInput
                        value={rule.label}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index ? { ...r, label: e.target.value } : r
                          )
                          patch({ pricingRules })
                        }}
                      />
                    </TBookField>
                    <TBookField label="Mikor">
                      <TBookSelect
                        value={rule.when}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index
                              ? { ...r, when: e.target.value as TBookPricingRule["when"] }
                              : r
                          )
                          patch({ pricingRules })
                        }}
                      >
                        {Object.entries(PRICING_RULE_WHEN_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </TBookSelect>
                    </TBookField>
                    <TBookField label="Művelet">
                      <TBookSelect
                        value={rule.action}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index
                              ? { ...r, action: e.target.value as TBookPricingRule["action"] }
                              : r
                          )
                          patch({ pricingRules })
                        }}
                      >
                        {Object.entries(PRICING_RULE_ACTION_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </TBookSelect>
                    </TBookField>
                    <TBookField label="Összeg módja">
                      <TBookSelect
                        value={rule.amountMode}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  amountMode: e.target.value as TBookPricingRule["amountMode"],
                                }
                              : r
                          )
                          patch({ pricingRules })
                        }}
                      >
                        {Object.entries(PRICING_RULE_AMOUNT_MODE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </TBookSelect>
                    </TBookField>
                    <TBookField
                      label={
                        rule.action === "set_ticket_fee"
                          ? `Belépődíj (${draft.currency})`
                          : `Összeg (+/− ${draft.currency})`
                      }
                    >
                      <TBookInput
                        type="number"
                        step="any"
                        value={rule.amount}
                        onChange={(e) => {
                          const pricingRules = draft.pricingRules.map((r, i) =>
                            i === index ? { ...r, amount: Number(e.target.value) || 0 } : r
                          )
                          patch({ pricingRules })
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Kedvezményhez adj meg negatív számot (pl. −100). Felárhoz pozitívat.
                      </p>
                    </TBookField>
                    <button
                      type="button"
                      className={`${tBookGhostButtonClass} sm:col-span-2`}
                      onClick={() =>
                        patch({
                          pricingRules: draft.pricingRules.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Szabály törlése
                    </button>
                  </div>
                ))}
                <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Példa a tipikus esetre:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Belépődíj felülírása → 0 (Mindig) — ingyenes belépő</li>
                    <li>
                      Szállás módosítás → −100 / résztvevőnként (Ha szervezői szállást választ)
                    </li>
                    <li>
                      Összeg módosítás → +100 / résztvevőnként (Ha nem választ szervezői szállást)
                    </li>
                  </ol>
                </div>
              </div>
              {draft.registrationUnit === "team" ? (
                <TBookField label="Max. csapattag / csapat (üres = korlátlan, fix létszám felett)">
                  <TBookInput
                    type="number"
                    min={1}
                    max={100}
                    value={draft.teamMemberLimit}
                    onChange={(e) => patch({ teamMemberLimit: e.target.value })}
                    placeholder="pl. 5"
                    disabled={Number(draft.playersPerTicket) > 1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number(draft.playersPerTicket) > 1
                      ? "Fix játékosszám esetén a fenti mező határozza meg a csapattagok számát."
                      : "Korlátozza, hány tag adható meg csapatonként a foglalási űrlapon."}
                  </p>
                </TBookField>
              ) : null}
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-8">
              <TBookField label="Csoport mezők kezelése">
                <TBookSelect
                  value={draft.attendeeFieldSchemaMode}
                  onChange={(e) =>
                    patch({
                      attendeeFieldSchemaMode: e.target.value as EventDraft["attendeeFieldSchemaMode"],
                    })
                  }
                >
                  <option value="extend">{REGISTRATION_FIELDS_MODE_LABELS.extend}</option>
                  <option value="replace">{REGISTRATION_FIELDS_MODE_LABELS.replace}</option>
                </TBookSelect>
                <p className="text-xs text-muted-foreground mt-1">
                  {draft.attendeeFieldSchemaMode === "replace"
                    ? "Csak az alábbi esemény-specifikus mezők lesznek a foglalási űrlapon."
                    : groupDefaultAttendeeFieldSchema.length > 0
                      ? `${groupDefaultAttendeeFieldSchema.length} csoport mező öröklődik; az azonos kulcsú eseménymező felülírja.`
                      : "A csoportnál még nincs alap mező — csak az esemény mezői lesznek érvényben."}
                </p>
              </TBookField>
              <AttendeeFieldsEditor
                fields={draft.attendeeFieldSchema}
                onChange={(attendeeFieldSchema) => patch({ attendeeFieldSchema })}
                registrationUnit={draft.registrationUnit}
              />
              {draft.registrationUnit === "team" || Number(draft.playersPerTicket) > 1 ? (
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {Number(draft.playersPerTicket) > 1 && draft.registrationUnit === "person"
                      ? "Játékos adatok (jegyenként)"
                      : "Csapattagok adatai"}
                  </h3>
                  <AttendeeFieldsEditor
                    fields={draft.teamMemberFieldSchema}
                    onChange={(teamMemberFieldSchema) => patch({ teamMemberFieldSchema })}
                    registrationUnit="team"
                    scope="teamMember"
                  />
                </div>
              ) : null}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Belépési feltételek</h3>
                <TBookField label="Szabály típusa">
                  <TBookSelect
                    value={draft.eligibilityPreset}
                    onChange={(e) =>
                      patch({
                        eligibilityPreset: e.target.value as EventDraft["eligibilityPreset"],
                      })
                    }
                  >
                    {Object.entries(ELIGIBILITY_PRESET_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </TBookSelect>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nincs sportág-specifikus előbeállítás — állítsd be a korhatárt, mezőértékeket,
                    vagy tetszőleges űrlap-szabályokat az esemény mezőire.
                  </p>
                </TBookField>
                {draft.eligibilityPreset === "custom" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Minimum életkor">
                      <TBookInput
                        type="number"
                        min={0}
                        max={120}
                        value={draft.eligibilityMinAge}
                        onChange={(e) => patch({ eligibilityMinAge: e.target.value })}
                      />
                    </TBookField>
                    <TBookField label="Maximum életkor">
                      <TBookInput
                        type="number"
                        min={0}
                        max={120}
                        value={draft.eligibilityMaxAge}
                        onChange={(e) => patch({ eligibilityMaxAge: e.target.value })}
                      />
                    </TBookField>
                    <TBookField label="Engedélyezett mező értékek (vesszővel)">
                      <TBookInput
                        value={draft.eligibilityAllowedGenders}
                        onChange={(e) => patch({ eligibilityAllowedGenders: e.target.value })}
                        placeholder="pl. a select choice value-k"
                      />
                    </TBookField>
                  </div>
                ) : null}
                {draft.eligibilityPreset === "custom" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TBookField label="Születési dátum mező kulcs (opcionális)">
                      <TBookInput
                        value={draft.eligibilityBirthDateFieldKey}
                        onChange={(e) => patch({ eligibilityBirthDateFieldKey: e.target.value })}
                        placeholder="birth_date"
                      />
                    </TBookField>
                    <TBookField label="Érték-ellenőrzés mező kulcs (opcionális)">
                      <TBookInput
                        value={draft.eligibilityGenderFieldKey}
                        onChange={(e) => patch({ eligibilityGenderFieldKey: e.target.value })}
                        placeholder="gender / category / …"
                      />
                    </TBookField>
                  </div>
                ) : null}
                {(draft.eligibilityPreset === "form_rules" ||
                  draft.eligibilityPreset === "custom") && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <TBookField label="Szabályok kapcsolata">
                        <TBookSelect
                          value={draft.eligibilityFormRules.logic}
                          onChange={(e) =>
                            patch({
                              eligibilityFormRules: {
                                ...draft.eligibilityFormRules,
                                logic: e.target.value as "and" | "or",
                              },
                            })
                          }
                        >
                          <option value="and">És (mind igaz)</option>
                          <option value="or">Vagy (legalább egy igaz)</option>
                        </TBookSelect>
                      </TBookField>
                      <button
                        type="button"
                        className={tBookGhostButtonClass}
                        onClick={() =>
                          patch({
                            eligibilityFormRules: {
                              ...draft.eligibilityFormRules,
                              rules: [
                                ...draft.eligibilityFormRules.rules,
                                {
                                  id: `rule-${Date.now()}`,
                                  fieldKey: effectiveAttendeeFieldSchema[0]?.key || "",
                                  op: "equals",
                                  value: "",
                                  message: "",
                                },
                              ],
                            },
                          })
                        }
                      >
                        Szabály hozzáadása
                      </button>
                    </div>
                    {draft.eligibilityFormRules.rules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2"
                      >
                        <TBookField label="Mező">
                          <TBookSelect
                            value={rule.fieldKey}
                            onChange={(e) => {
                              const rules = draft.eligibilityFormRules.rules.map((r, i) =>
                                i === index ? { ...r, fieldKey: e.target.value } : r
                              )
                              patch({
                                eligibilityFormRules: { ...draft.eligibilityFormRules, rules },
                              })
                            }}
                          >
                            <option value="">— válassz —</option>
                            {effectiveAttendeeFieldSchema.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key}) · {f.type}
                              </option>
                            ))}
                          </TBookSelect>
                        </TBookField>
                        <TBookField label="Feltétel">
                          <TBookSelect
                            value={rule.op}
                            onChange={(e) => {
                              const rules = draft.eligibilityFormRules.rules.map((r, i) =>
                                i === index
                                  ? { ...r, op: e.target.value as TBookEligibilityMatchOp }
                                  : r
                              )
                              patch({
                                eligibilityFormRules: { ...draft.eligibilityFormRules, rules },
                              })
                            }}
                          >
                            {Object.entries(ELIGIBILITY_OP_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </TBookSelect>
                        </TBookField>
                        <TBookField label="Érték / regex">
                          <TBookInput
                            value={rule.value}
                            onChange={(e) => {
                              const rules = draft.eligibilityFormRules.rules.map((r, i) =>
                                i === index ? { ...r, value: e.target.value } : r
                              )
                              patch({
                                eligibilityFormRules: { ...draft.eligibilityFormRules, rules },
                              })
                            }}
                          />
                        </TBookField>
                        <TBookField label="Hibaüzenet (opcionális)">
                          <TBookInput
                            value={rule.message || ""}
                            onChange={(e) => {
                              const rules = draft.eligibilityFormRules.rules.map((r, i) =>
                                i === index ? { ...r, message: e.target.value } : r
                              )
                              patch({
                                eligibilityFormRules: { ...draft.eligibilityFormRules, rules },
                              })
                            }}
                          />
                        </TBookField>
                        <button
                          type="button"
                          className={`${tBookGhostButtonClass} sm:col-span-2`}
                          onClick={() => {
                            const rules = draft.eligibilityFormRules.rules.filter((_, i) => i !== index)
                            patch({
                              eligibilityFormRules: { ...draft.eligibilityFormRules, rules },
                            })
                          }}
                        >
                          Szabály törlése
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {step === 4 ? (
            <div className="space-y-4">
              <TBookRichTextField
                label="Leírás"
                value={draft.description}
                onChange={(description) => patch({ description })}
              />
              <TBookSingleMediaField
                label="Borítókép (esemény felülírás)"
                value={draft.heroImage}
                onChange={(heroImage) => patch({ heroImage })}
                aspect={16 / 9}
              />
              <p className="text-xs text-muted-foreground -mt-2">
                {draft.heroImage.trim()
                  ? "Az esemény saját borítóképe érvényes."
                  : groupDefaultHeroImage.trim()
                    ? "Ha üres, a csoport alapértelmezett esemény borítóképe jelenik meg."
                    : "Ha üres és a csoportnál sincs beállítva, nem jelenik meg borítókép."}
              </p>
              <div className="rounded-lg bg-muted/30 p-4 space-y-4">
                <p className="text-sm font-medium text-foreground">Belépőjegy (QR PDF)</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.vouchersEnabled}
                    onChange={(e) => patch({ vouchersEnabled: e.target.checked })}
                    className="rounded border-border"
                  />
                  Jegyek kiállítása fizetés után
                </label>
                <TBookSingleMediaField
                  label="Jegy PDF fejléc kép (esemény felülírás)"
                  value={draft.voucherHeaderImage}
                  onChange={(voucherHeaderImage) => patch({ voucherHeaderImage })}
                  aspect={3 / 1}
                />
                <p className="text-xs text-muted-foreground">
                  {draft.voucherHeaderImage.trim()
                    ? "Az esemény saját fejléc képe érvényes — felülírja a csoport alapértelmezését."
                    : groupVoucherHeaderImage.trim()
                      ? "Ha üres, a csoport alapértelmezett jegy fejléc képe kerül a PDF tetejére."
                      : "Ha üres és a csoportnál sincs beállítva, a borítókép kerül a PDF tetejére."}
                </p>
              </div>
            </div>
          ) : null}
            </TBookWizard>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className={`${tBookPanelClass} text-sm space-y-2`}>
            <p className="font-semibold text-foreground">{draft.name || "Új esemény"}</p>
            {draft.startDate ? (
              <p className="text-xs text-muted-foreground">
                {formatEventSchedule(
                  draft.startDate,
                  draft.endDate || draft.startDate,
                  draft.startTime || null,
                  draft.endTime || null
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Időpont még nincs megadva</p>
            )}
            <p className="text-xs text-neutral-400">
              Jegy:{" "}
              {draft.ticketFeeHuf > 0
                ? `${formatMoney(draft.ticketFeeHuf, draft.currency)} ${draft.ticketPriceBasis === "net" ? "nettó" : "bruttó"} · ${ticketFeeModeLabel(draft.ticketFeeMode, draft.registrationUnit)}`
                : "—"}
            </p>
            <p className="text-xs text-neutral-400">
              {effectiveAttendeeFieldSchema.length} foglalási mező ·{" "}
              {draft.registrationUnit === "team" ? "csapat" : "személy"} regisztráció
              {draft.capacity ? ` · max ${draft.capacity}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
