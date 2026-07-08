"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { CampDiningOption } from "../lib/schemas"
import { buildAddonSelections } from "../lib/checkout-addons"
import {
  calculateCampOrderTotal,
  isLaptopTicketTypeName,
  LAPTOP_ADDON_CHECKOUT_LABEL,
} from "../lib/pricing"
import type { CampTicketPriceInput } from "../lib/pricing-types"
import { mediaImageSrc } from "@wse/core/lib/images"
import { campBookingDefaultContent } from "@wse/template-minecraft-camp/pages/camp/defaultContent"
import type { CampBookingContent } from "@wse/template-minecraft-camp/pages/camp/schemas"

type TicketType = CampTicketPriceInput & {
  id: string
  effectivePriceHuf: number
  earlyBirdActive: boolean
  earlyBirdEndsAt?: string | null
}

type CampPricingSettings = {
  multiChildDiscountPercent: number
  multiChildMinCount: number
  siblingDiscountPercent: number
  siblingMatchByLastName: boolean
}

type SessionDetail = {
  camp: {
    id: string
    title: string
    slug: string
    heroImage?: string
    pricingSettings?: CampPricingSettings
  }
  session: {
    id: string
    label: string
    sessionLabel: string
    spotsLeft: number
    capacity: number
  }
  pricingSettings: CampPricingSettings
  ticketTypes: TicketType[]
  addonTickets: TicketType[]
  laptopTicket?: TicketType | null
}

type ChildForm = {
  name: string
  lastName: string
  birthDate: string
  diningOption: CampDiningOption
  dietaryRequest: string
  allergies: string
  laptopRental: boolean
  addonTicketIds: string[]
}

const DINING_OPTIONS: CampDiningOption[] = [
  "Normál",
  "Vegetáriánus",
  "Gluténmentes",
  "Laktózmentes",
  "Sertéshúsmentes",
]

function emptyChild(): ChildForm {
  return {
    name: "",
    lastName: "",
    birthDate: "",
    diningOption: "Normál",
    dietaryRequest: "",
    allergies: "",
    laptopRental: false,
    addonTicketIds: [],
  }
}

function ticketToPriceInput(t: TicketType): CampTicketPriceInput {
  return {
    name: t.name,
    priceHuf: t.priceHuf,
    pricingMode: t.pricingMode,
    kind: t.kind,
    earlyBirdEndsAt: t.earlyBirdEndsAt,
    earlyBirdPriceHuf: t.earlyBirdPriceHuf,
    earlyBirdDiscountPercent: t.earlyBirdDiscountPercent,
  }
}

function childAddonIds(child: ChildForm, laptopId?: string | null): string[] {
  const ids = new Set(child.addonTicketIds)
  if (child.laptopRental && laptopId) ids.add(laptopId)
  return [...ids]
}

function formatHuf(n: number) {
  return n.toLocaleString("hu-HU")
}

function PriceBreakdownSummary({
  order,
  total,
  className = "",
}: {
  order: ReturnType<typeof calculateCampOrderTotal> | null
  total: number
  className?: string
}) {
  return (
    <div className={`space-y-1 font-minecraft-body text-sm ${className}`}>
      {order?.lines.map((line, i) => (
        <p key={i} className={line.amountHuf < 0 ? "text-[#2d5016]" : ""}>
          {line.label}:{" "}
          <strong>
            {line.amountHuf < 0 ? "−" : ""}
            {formatHuf(Math.abs(line.amountHuf))} Ft
          </strong>
        </p>
      ))}
      <p className="font-minecraft text-xs md:text-sm pt-2">Összesen: {formatHuf(total)} Ft</p>
    </div>
  )
}

function StepIndicator({
  step,
  steps,
}: {
  step: number
  steps: ReadonlyArray<{ id: number; label: string }>
}) {
  return (
    <ol className="space-y-3 font-minecraft text-[10px] md:text-xs">
      {steps.map((s, i) => {
        const active = step === s.id
        const done = step > s.id
        return (
          <li
            key={s.id}
            className={`flex items-center gap-2 ${
              active ? "text-[#2d5016]" : done ? "text-[#5D9B38]" : "text-[#8b7355]"
            }`}
          >
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#3d2817] ${
                active ? "bg-[#78B7FF] text-[#1a3d5c]" : done ? "bg-[#5D9B38] text-white" : "bg-[#e8f5d6]"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={active ? "font-bold" : ""}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function CampBookingWizard({
  sessionId,
  copy = campBookingDefaultContent,
}: {
  sessionId: string
  copy?: CampBookingContent
}) {
  const steps = useMemo(
    () => [
      { id: 0, label: copy.stepOffers },
      { id: 1, label: copy.stepDetails },
      { id: 2, label: copy.stepReview },
    ],
    [copy.stepOffers, copy.stepDetails, copy.stepReview]
  )
  const searchParams = useSearchParams()
  const cancelled = searchParams.get("cancelled")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [step, setStep] = useState(0)
  const [ticketTypeId, setTicketTypeId] = useState("")
  const [childCount, setChildCount] = useState(1)
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [children, setChildren] = useState<ChildForm[]>([emptyChild()])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/plugins/camp-booking/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error || "Betöltési hiba")
        setDetail(data)
        if (data.ticketTypes?.[0]) setTicketTypeId(data.ticketTypes[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    setChildren((prev) => {
      const next: ChildForm[] = []
      for (let i = 0; i < childCount; i++) {
        next.push(prev[i] ?? emptyChild())
      }
      return next
    })
  }, [childCount])

  const selectedTicket = detail?.ticketTypes.find((t) => t.id === ticketTypeId)
  const pricingSettings = detail?.pricingSettings ?? detail?.camp.pricingSettings

  const order = useMemo(() => {
    if (!detail || !selectedTicket) return null
    const sessionTickets = [...detail.ticketTypes, ...detail.addonTickets].map((t) => ({
      _id: t.id,
      kind: t.kind ?? "base",
      name: t.name,
      priceHuf: t.priceHuf,
      pricingMode: t.pricingMode,
      earlyBirdEndsAt: t.earlyBirdEndsAt ? new Date(t.earlyBirdEndsAt) : undefined,
      earlyBirdPriceHuf: t.earlyBirdPriceHuf,
      earlyBirdDiscountPercent: t.earlyBirdDiscountPercent,
    }))
    const addonCounts = buildAddonSelections(
      children.map((c) => ({
        name: c.name,
        lastName: c.lastName,
        addonTicketIds: childAddonIds(c, detail.laptopTicket?.id),
        laptopRental: c.laptopRental,
      })),
      sessionTickets as never,
      detail.laptopTicket?.id
    )
    const addons = [...addonCounts.entries()]
      .map(([id, quantity]) => {
        const t = [...detail.ticketTypes, ...detail.addonTickets].find((x) => x.id === id)
        return t ? { ticket: ticketToPriceInput(t), quantity } : null
      })
      .filter((x): x is { ticket: CampTicketPriceInput; quantity: number } => x != null)

    return calculateCampOrderTotal({
      ticket: ticketToPriceInput(selectedTicket),
      childCount,
      children: children.map((c) => ({
        name: c.name,
        lastName: c.lastName,
        addonTicketIds: childAddonIds(c, detail.laptopTicket?.id),
        laptopRental: c.laptopRental,
      })),
      campSettings: pricingSettings,
      addons,
    })
  }, [detail, selectedTicket, childCount, children, pricingSettings])

  const total = order?.totalHuf ?? 0

  const maxKids = useMemo(
    () => Math.min(20, Math.max(1, detail?.session.spotsLeft ?? 1)),
    [detail]
  )

  const submit = useCallback(async () => {
    if (!detail || !selectedTicket) return
    setSubmitting(true)
    setError(null)
    try {
      const holdRes = await fetch("/api/plugins/camp-booking/checkout/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ticketTypeId,
          childCount,
          buyerName,
          buyerEmail,
          buyerPhone,
          children: children.map((c) => ({
            name: c.name,
            lastName: c.lastName || undefined,
            birthDate: c.birthDate,
            diningOption: c.diningOption,
            dietaryRequest: c.dietaryRequest,
            allergies: c.allergies,
            laptopRental: c.laptopRental,
            addonTicketIds: childAddonIds(c, detail.laptopTicket?.id),
          })),
        }),
      })
      const holdData = await holdRes.json()
      if (!holdRes.ok || !holdData.ok) {
        throw new Error(holdData.error || "Foglalás sikertelen")
      }

      const stripeRes = await fetch("/api/plugins/camp-booking/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdId: holdData.holdId }),
      })
      const stripeData = await stripeRes.json()
      if (!stripeRes.ok || !stripeData.ok || !stripeData.url) {
        throw new Error(stripeData.error || "Stripe indítás sikertelen")
      }
      window.location.href = stripeData.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hiba")
      setSubmitting(false)
    }
  }, [
    detail,
    selectedTicket,
    sessionId,
    ticketTypeId,
    childCount,
    buyerName,
    buyerEmail,
    buyerPhone,
    children,
  ])

  if (loading) {
    return (
      <p className="font-minecraft-body text-center py-16 text-[#3d2817]">Betöltés…</p>
    )
  }
  if (error && !detail) {
    return (
      <div className="minecraft-panel p-8 text-center max-w-lg mx-auto">
        <p className="text-red-700 font-minecraft-body">{error}</p>
        <Link href="/" className="minecraft-btn inline-block mt-6">
          Vissza
        </Link>
      </div>
    )
  }
  if (!detail) return null

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(240px,300px)_1fr]">
        {/* Left: summary + steps */}
        <aside className="space-y-4">
          <div className="minecraft-panel p-5 space-y-4">
            <div className="aspect-square max-w-[200px] mx-auto border-4 border-[#3d2817] overflow-hidden bg-[#5D9B38]/30 flex items-center justify-center">
              {detail.camp.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaImageSrc(detail.camp.heroImage)}
                  alt={detail.camp.title}
                  className="h-full w-full object-cover pixelated"
                />
              ) : (
                <span className="font-minecraft text-[10px] text-center text-[#2d5016] px-2">
                  {detail.camp.title}
                </span>
              )}
            </div>
            <p className="font-minecraft text-[10px] text-[#1a3d5c]">{detail.camp.title}</p>
            <h1 className="font-minecraft text-sm text-[#2d5016] leading-relaxed">
              {detail.session.sessionLabel}
            </h1>
            <p className="font-minecraft-body text-xs text-[#3d2817]">{copy.venueAddress}</p>
            <p className="font-minecraft-body text-sm">
              Szabad hely:{" "}
              <strong className="text-[#2d5016]">{detail.session.spotsLeft}</strong>
            </p>
            {cancelled ? (
              <p className="text-amber-800 font-minecraft-body text-xs bg-amber-100 border-2 border-amber-400 p-2">
                A fizetés megszakadt — folytathatod lent.
              </p>
            ) : null}
          </div>
          <div className="minecraft-panel p-5">
            <StepIndicator step={step} steps={steps} />
          </div>
        </aside>

        {/* Right: step content */}
        <div className="space-y-4">
          {error ? (
            <p className="text-red-700 font-minecraft-body text-sm bg-red-100 border-2 border-red-400 p-3">
              {error}
            </p>
          ) : null}

          {step === 0 && (
            <div className="minecraft-panel p-6 md:p-8 space-y-5">
              <h2 className="font-minecraft text-sm text-[#2d5016]">
                {copy.ticketsHeading}
              </h2>
              <label className="block font-minecraft-body text-sm">
                {copy.ticketTypeLabel}
                <select
                  className="minecraft-input w-full mt-1"
                  value={ticketTypeId}
                  onChange={(e) => setTicketTypeId(e.target.value)}
                >
                  {detail.ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatHuf(t.effectivePriceHuf ?? t.priceHuf)} Ft
                      {t.earlyBirdActive ? " (early bird)" : ""}
                      {t.pricingMode === "per_child" ? " / gyerek" : " / foglalás"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-minecraft-body text-sm">
                {copy.childCountLabel}
                <input
                  type="number"
                  min={1}
                  max={maxKids}
                  className="minecraft-input w-full mt-1"
                  value={childCount}
                  onChange={(e) => setChildCount(Number(e.target.value))}
                />
              </label>
              {detail.addonTickets.length > 0 ? (
                <p className="font-minecraft-body text-xs text-[#5c4a32]">
                  {copy.addonsHint}
                </p>
              ) : null}
              {(pricingSettings?.multiChildDiscountPercent ?? 0) > 0 ||
              (pricingSettings?.siblingDiscountPercent ?? 0) > 0 ? (
                <p className="font-minecraft-body text-xs text-[#2d5016] bg-[#e8f5d6] border border-[#5D9B38] p-2">
                  Többgyermekes / testvérkedvezmény automatikusan levonásra kerül, ha
                  jogosult vagy rá (azonos vezetéknév a testvér kedvezményhez).
                </p>
              ) : null}
              <PriceBreakdownSummary order={order} total={total} />
              <button
                type="button"
                className="minecraft-btn w-full bg-[#5D9B38]"
                onClick={() => setStep(1)}
                disabled={!ticketTypeId || detail.session.spotsLeft < 1}
              >
                {copy.nextLabel}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="minecraft-panel p-6 md:p-8 space-y-6">
              <h2 className="font-minecraft text-sm text-[#2d5016]">
                {copy.buyerHeading}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="minecraft-input w-full sm:col-span-2"
                  placeholder="Vásárló neve *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                <input
                  className="minecraft-input w-full"
                  type="email"
                  placeholder="Email *"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
                <input
                  className="minecraft-input w-full"
                  placeholder="Telefon *"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
              </div>

              <h2 className="font-minecraft text-sm text-[#2d5016] pt-2">
                {copy.childrenHeading}
              </h2>
              <div className="space-y-4">
                {children.map((child, i) => (
                  <div key={i} className="minecraft-panel-wood p-4 md:p-5 space-y-3">
                    <p className="font-minecraft text-[10px] text-white">Gyerek {i + 1}</p>
                    <input
                      className="minecraft-input w-full"
                      placeholder="Gyerek teljes neve *"
                      value={child.name}
                      onChange={(e) => {
                        const next = [...children]
                        next[i] = { ...next[i], name: e.target.value }
                        setChildren(next)
                      }}
                    />
                    <input
                      className="minecraft-input w-full"
                      type="date"
                      value={child.birthDate}
                      onChange={(e) => {
                        const next = [...children]
                        next[i] = { ...next[i], birthDate: e.target.value }
                        setChildren(next)
                      }}
                    />
                    <label className="block font-minecraft-body text-sm text-white/95">
                      Étkezés
                      <select
                        className="minecraft-input w-full mt-1"
                        value={child.diningOption}
                        onChange={(e) => {
                          const next = [...children]
                          next[i] = {
                            ...next[i],
                            diningOption: e.target.value as CampDiningOption,
                          }
                          setChildren(next)
                        }}
                      >
                        {DINING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      className="minecraft-input w-full"
                      placeholder="Allergia, étel- vagy gyógyszer érzékenység, bármi fontos infó."
                      value={child.allergies}
                      onChange={(e) => {
                        const next = [...children]
                        next[i] = { ...next[i], allergies: e.target.value }
                        setChildren(next)
                      }}
                    />
                    {detail.addonTickets.map((addon) => {
                      const checked = childAddonIds(child, detail.laptopTicket?.id).includes(
                        addon.id
                      )
                      const isLaptop =
                        detail.laptopTicket?.id === addon.id
                      return (
                        <label
                          key={addon.id}
                          className="flex items-start gap-2 font-minecraft-body text-sm text-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={isLaptop ? child.laptopRental : checked}
                            onChange={(e) => {
                              const next = [...children]
                              const ids = new Set(next[i].addonTicketIds)
                              if (isLaptop) {
                                next[i] = { ...next[i], laptopRental: e.target.checked }
                              } else if (e.target.checked) {
                                ids.add(addon.id)
                                next[i] = { ...next[i], addonTicketIds: [...ids] }
                              } else {
                                ids.delete(addon.id)
                                next[i] = { ...next[i], addonTicketIds: [...ids] }
                              }
                              setChildren(next)
                            }}
                          />
                          <span>
                            {isLaptop ||
                            isLaptopTicketTypeName(addon.name)
                              ? LAPTOP_ADDON_CHECKOUT_LABEL
                              : `${addon.description || addon.name} (+${formatHuf(addon.effectivePriceHuf ?? addon.priceHuf)} Ft${addon.pricingMode === "per_child" ? " / gyerek" : ""})`}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" className="minecraft-btn flex-1" onClick={() => setStep(0)}>
                  {copy.backLabel}
                </button>
                <button
                  type="button"
                  className="minecraft-btn flex-1 bg-[#78B7FF] text-[#1a3d5c] border-[#1a3d5c]"
                  onClick={() => setStep(2)}
                  disabled={!buyerName || !buyerEmail || !buyerPhone}
                >
                  {copy.nextLabel}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="minecraft-panel p-6 md:p-8 space-y-5">
              <h2 className="font-minecraft text-sm text-[#2d5016]">{copy.reviewHeading}</h2>
              <div className="minecraft-panel-inner p-4 space-y-2 font-minecraft-body text-sm">
                <p>
                  <strong>{selectedTicket?.name}</strong> × {childCount} gyerek
                </p>
                <p>{buyerName}</p>
                <p>{buyerEmail}</p>
                <p>{buyerPhone}</p>
              </div>
              <ul className="space-y-3">
                {children.map((child, i) => (
                  <li key={i} className="minecraft-panel-wood p-4 text-white font-minecraft-body text-sm">
                    <p className="font-minecraft text-[10px] mb-2">Gyerek {i + 1}</p>
                    <p>
                      <strong>{child.name || "—"}</strong> · {child.birthDate || "—"}
                    </p>
                    <p>Étkezés: {child.diningOption}</p>
                    {child.dietaryRequest ? <p>Megjegyzés: {child.dietaryRequest}</p> : null}
                    {child.allergies ? <p>Allergia: {child.allergies}</p> : null}
                    {child.laptopRental ? (
                      <p className="text-[#c6e89c]">+ Laptop bérlés</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <PriceBreakdownSummary order={order} total={total} className="border-t-2 border-[#3d2817]/20 pt-4" />
              <div className="flex gap-3">
                <button type="button" className="minecraft-btn flex-1" onClick={() => setStep(1)}>
                  {copy.backLabel}
                </button>
                <button
                  type="button"
                  className="minecraft-btn flex-1 bg-[#5D9B38]"
                  disabled={submitting || detail.session.spotsLeft < 1}
                  onClick={() => void submit()}
                >
                  {submitting ? copy.payStripeLoading : copy.payStripeCta}
                </button>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="block text-center font-minecraft-body text-sm text-[#1a3d5c] underline"
          >
            ← Vissza a táborokhoz
          </Link>
        </div>
      </div>
    </div>
  )
}
