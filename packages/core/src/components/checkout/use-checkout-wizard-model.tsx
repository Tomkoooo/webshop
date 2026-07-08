"use client"
/* eslint-disable @typescript-eslint/no-explicit-any -- mirrors legacy CheckoutPageView */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { BillingStep } from "@wse/core/components/checkout/BillingStep"
import { ShippingStep } from "@wse/core/components/checkout/ShippingStep"
import { MethodsStep } from "@wse/core/components/checkout/MethodsStep"
import { SummaryStep } from "@wse/core/components/checkout/SummaryStep"
import type { CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"
import {
  formatHuf,
  priceBreakdownFromGross,
  totalsFromMixedVatLines,
  clampVatPercent,
  DEFAULT_VAT_PERCENT,
  highestCartVatPercent,
} from "@wse/core/lib/pricing"
import { getCountryDisplayName, formatAllowedCountriesList, normalizeIso2 } from "@wse/core/lib/country-codes"
import { checkoutPrefillFromUserProfile } from "@wse/core/lib/checkout-profile-prefill"
import type { TradingLimits } from "@wse/core/components/checkout/CheckoutCountryPicker"
import {
  isFoxpostParcelShippingMethod,
  isGlsParcelShippingMethod,
  isParcelShippingMethod,
  offersOnlyParcelLockerShipping,
} from "@wse/core/lib/shipping-providers"
import { useCartStore, type CartItem } from "@wse/core/store/useCartStore"
import { saveCheckoutSnapshotFromCart } from "@wse/core/lib/analytics/track"

export const CHECKOUT_WIZARD_STEPS = [
  { id: "billing", title: "Számlázás" },
  { id: "shipping", title: "Szállítás" },
  { id: "methods", title: "Fizetés" },
  { id: "summary", title: "Összegzés" },
] as const

export type CheckoutWizardStepId = (typeof CHECKOUT_WIZARD_STEPS)[number]["id"]

const initialForm = () => ({
  billing: {
    type: "personal" as "personal" | "company",
    name: "",
    taxNumber: "",
    countryCode: "HU",
    country: getCountryDisplayName("HU", "hu-HU"),
    city: "",
    zip: "",
    street: "",
    email: "",
    phone: "",
  },
  shipping: {
    isSameAsBilling: true,
    name: "",
    countryCode: "HU",
    country: getCountryDisplayName("HU", "hu-HU"),
    city: "",
    zip: "",
    street: "",
    comment: "",
    email: "",
    phone: "",
  },
  methods: {
    shippingMethod: "",
    paymentMethod: "",
    glsParcelPoint: null as any,
    foxpostParcelPoint: null as any,
  },
  coupon: null as any,
  /** Logged-in users only; sent to API, default on */
  saveAddressToProfile: true,
})

export type CheckoutWizardFormState = ReturnType<typeof initialForm>

export type StripeRedirectHold = {
  checkoutUrl: string
  reservationExpiresAt: string
  serverTime: string | null
}

type BillingRequiredField = "name" | "taxNumber" | "zip" | "city" | "street" | "email" | "phone"
type ShippingRequiredField = "name" | "zip" | "city" | "street" | "email" | "phone"
type CheckoutFieldErrors = {
  billing: Partial<Record<BillingRequiredField, boolean>>
  shipping: Partial<Record<ShippingRequiredField, boolean>>
}

function createEmptyFieldErrors(): CheckoutFieldErrors {
  return { billing: {}, shipping: {} }
}

function isMissing(value: unknown) {
  return typeof value !== "string" || value.trim() === ""
}

function hasFieldErrors<T extends string>(errors: Partial<Record<T, boolean>>) {
  return Object.values(errors).some(Boolean)
}

function reconcileFieldErrors<T extends string>(
  current: Partial<Record<T, boolean>>,
  missing: Partial<Record<T, boolean>>
) {
  return (Object.keys(current) as T[]).reduce<Partial<Record<T, boolean>>>((next, field) => {
    if (missing[field]) next[field] = true
    return next
  }, {})
}

function getBillingRequiredErrors(
  billing: CheckoutWizardFormState["billing"]
): Partial<Record<BillingRequiredField, boolean>> {
  const errors: Partial<Record<BillingRequiredField, boolean>> = {}
  for (const field of ["name", "zip", "city", "street", "email", "phone"] as const) {
    if (isMissing(billing[field])) errors[field] = true
  }
  if (billing.type === "company" && isMissing(billing.taxNumber)) {
    errors.taxNumber = true
  }
  return errors
}

function getShippingRequiredErrors(
  shipping: CheckoutWizardFormState["shipping"]
): Partial<Record<ShippingRequiredField, boolean>> {
  if (shipping.isSameAsBilling) return {}
  const errors: Partial<Record<ShippingRequiredField, boolean>> = {}
  for (const field of ["name", "zip", "city", "street", "email", "phone"] as const) {
    if (isMissing(shipping[field])) errors[field] = true
  }
  return errors
}

/**
 * Shared checkout wizard state + validation + submit (Stripe vs COD).
 * Use from the engine `CheckoutPageView` or from a template `RouteMain` for full UI freedom.
 */
export function useCheckoutWizardModel(
  options: { variant?: "page" | "embedded"; stepAppearance?: CheckoutStepAppearance } = {}
) {
  void options.variant
  const stepAppearance: CheckoutStepAppearance = options.stepAppearance ?? "dark"
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState(initialForm)
  const [availableMethods, setAvailableMethods] = React.useState<any>(null)
  const items = useCartStore((s) => s.items)
  const cartTotalPrice = useCartStore((s) => s.totalPrice)
  const clearCart = useCartStore((s) => s.clearCart)
  const { data: session, status: sessionStatus } = useSession()
  const sessionUserEmail = session?.user?.email
  const sessionUserName = session?.user?.name
  const [shopEnabled, setShopEnabled] = React.useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [stripeRedirectHold, setStripeRedirectHold] = React.useState<StripeRedirectHold | null>(null)
  const [tradingLimits, setTradingLimits] = React.useState<TradingLimits | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<CheckoutFieldErrors>(createEmptyFieldErrors)
  const router = useRouter()

  const parcelOnlyShipping = React.useMemo(
    () => offersOnlyParcelLockerShipping(availableMethods?.shippingMethods),
    [availableMethods?.shippingMethods]
  )

  const activeSteps = React.useMemo(
    () =>
      parcelOnlyShipping
        ? CHECKOUT_WIZARD_STEPS.filter((s) => s.id !== "shipping")
        : [...CHECKOUT_WIZARD_STEPS],
    [parcelOnlyShipping]
  )

  React.useEffect(() => {
    if (!parcelOnlyShipping) return
    setFormData((prev) =>
      prev.shipping.isSameAsBilling
        ? prev
        : {
            ...prev,
            shipping: {
              ...prev.shipping,
              isSameAsBilling: true,
            },
          }
    )
  }, [parcelOnlyShipping])

  React.useEffect(() => {
    if (currentStep < activeSteps.length) return
    setCurrentStep(Math.max(0, activeSteps.length - 1))
  }, [activeSteps.length, currentStep])

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/shop/trading-limits")
        if (!res.ok) return
        setTradingLimits(await res.json())
      } catch {
        setTradingLimits(null)
      }
    }
    void load()
  }, [])

  React.useEffect(() => {
    if (!stripeRedirectHold?.checkoutUrl) return
    const delayMs = 6000
    const id = window.setTimeout(() => {
      window.location.href = stripeRedirectHold.checkoutUrl
    }, delayMs)
    return () => window.clearTimeout(id)
  }, [stripeRedirectHold])

  React.useEffect(() => {
    setFormData((prev) => {
      if (!prev.shipping.isSameAsBilling) return prev
      if (
        prev.shipping.countryCode === prev.billing.countryCode &&
        prev.shipping.country === prev.billing.country
      ) {
        return prev
      }
      return {
        ...prev,
        shipping: {
          ...prev.shipping,
          countryCode: prev.billing.countryCode,
          country: prev.billing.country,
        },
      }
    })
  }, [formData.billing.countryCode, formData.billing.country, formData.shipping.isSameAsBilling])

  React.useEffect(() => {
    const fetchMethods = async () => {
      const res = await fetch("/api/checkout/methods")
      if (res.ok) {
        setAvailableMethods(await res.json())
      } else {
        const err = await res.json().catch(() => ({}))
        if (err?.error) toast.error(err.error)
      }
    }
    void fetchMethods()
  }, [])

  React.useEffect(() => {
    const loadAvailability = async () => {
      try {
        const res = await fetch("/api/shop/availability")
        if (!res.ok) {
          setShopEnabled(false)
          return
        }
        const data = await res.json()
        setShopEnabled(Boolean(data.enabled))
      } catch {
        setShopEnabled(false)
      }
    }
    void loadAvailability()
  }, [])

  React.useEffect(() => {
    if (sessionStatus !== "authenticated") return

    let cancelled = false
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile")
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled || data?.error) return

        const prefill = checkoutPrefillFromUserProfile(data, {
          email: sessionUserEmail,
          name: sessionUserName,
        })

        setFormData((prev) => {
          let billing = { ...prev.billing }
          let shipping = { ...prev.shipping }
          if (prefill) {
            billing = { ...billing, ...prefill.billing }
            shipping = { ...shipping, ...prefill.shipping }
          } else {
            if (sessionUserName) {
              billing.name = billing.name || sessionUserName
              shipping.name = shipping.name || sessionUserName
            }
            if (sessionUserEmail) {
              billing.email = billing.email || sessionUserEmail
              shipping.email = shipping.email || sessionUserEmail
            }
          }

          const savedBilling = data.billingInfo as { phone?: string; email?: string } | undefined
          const savedShipping = data.shippingAddress as { phone?: string; email?: string } | undefined
          if (savedBilling?.phone?.trim()) {
            billing.phone = billing.phone || savedBilling.phone.trim()
          }
          if (savedBilling?.email?.trim()) {
            billing.email = billing.email || savedBilling.email.trim()
          }
          if (savedShipping?.phone?.trim()) {
            shipping.phone = shipping.phone || savedShipping.phone.trim()
          }
          if (savedShipping?.email?.trim()) {
            shipping.email = shipping.email || savedShipping.email.trim()
          }
          return { ...prev, billing, shipping }
        })
      } catch {
        /* profile prefill is best-effort */
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [sessionStatus, sessionUserEmail, sessionUserName])

  const selectedShipping = availableMethods?.shippingMethods?.find(
    (m: any) => m._id === formData.methods.shippingMethod
  )

  const parcelLockerSummary = React.useMemo(() => {
    if (!selectedShipping) return null

    const isParcel = isParcelShippingMethod(formData.methods.shippingMethod, selectedShipping)
    if (isParcel) {
      return {
        methodName: selectedShipping.name as string,
        descriptionHtml: selectedShipping.descriptionHtml as string | undefined,
        glsParcelPoint: formData.methods.glsParcelPoint,
        foxpostParcelPoint: formData.methods.foxpostParcelPoint,
      }
    }

    return {
      methodName: selectedShipping.name as string,
      descriptionHtml: selectedShipping.descriptionHtml as string | undefined,
      isStandardShipping: true,
    }
  }, [selectedShipping, formData.methods])
  const selectedPayment = availableMethods?.paymentMethods?.find(
    (m: any) => m._id === formData.methods.paymentMethod
  )

  const calculateTotal = React.useCallback(() => {
    const subtotal = cartTotalPrice
    const paymentFee = selectedPayment?.grossPrice || 0
    let shippingFee = selectedShipping?.grossPrice || 0
    let discount = 0
    let effectiveSubtotal = subtotal
    if (formData.coupon) {
      if (formData.coupon.type === "percentage") {
        discount = subtotal * (formData.coupon.value / 100)
      } else if (formData.coupon.type === "fixed") {
        discount = formData.coupon.value
      } else if (formData.coupon.type === "product_price") {
        const adjusted =
          formData.coupon.adjustedSubtotal ??
          subtotal - Number(formData.coupon.discount || 0)
        discount = Math.max(0, subtotal - adjusted)
        effectiveSubtotal = adjusted
      } else if (formData.coupon.type === "free_shipping") {
        shippingFee = 0
      }
    }
    const base = effectiveSubtotal + shippingFee + paymentFee
    const total =
      formData.coupon?.type === "product_price"
        ? base
        : Math.max(0, subtotal + shippingFee + paymentFee - discount)
    return {
      subtotal: formData.coupon?.type === "product_price" ? effectiveSubtotal : subtotal,
      shippingFee,
      paymentFee,
      discount,
      total,
    }
  }, [cartTotalPrice, formData.coupon, selectedPayment?.grossPrice, selectedShipping?.grossPrice])

  const totals = calculateTotal()
  const totalBreakdown = React.useMemo(() => {
    const { subtotal: st, shippingFee, paymentFee, total } = totals
    const goodsAfterDiscount = Math.max(0, total - shippingFee - paymentFee)
    const scale = st > 0 ? goodsAfterDiscount / st : 1
    const mixed = totalsFromMixedVatLines(
      items.map((i: CartItem) => ({
        grossUnit: Number(i.price) * scale,
        quantity: Number(i.quantity),
        vatPercent: clampVatPercent(i.vatPercent ?? DEFAULT_VAT_PERCENT),
      }))
    )
    const feeVat = highestCartVatPercent(
      items.map((i: CartItem) => ({ vatPercent: i.vatPercent }))
    )
    let net = mixed.net
    let vat = mixed.vat
    if (shippingFee > 0) {
      const s = priceBreakdownFromGross(shippingFee, 1, feeVat)
      net += s.lineNet
      vat += s.lineVat
    }
    if (paymentFee > 0) {
      const p = priceBreakdownFromGross(paymentFee, 1, feeVat)
      net += p.lineNet
      vat += p.lineVat
    }
    return { net, vat, gross: total }
  }, [totals, items])

  const nextStep = React.useCallback(() => {
    const stepId = activeSteps[currentStep]?.id
    if (stepId === "billing") {
      const b = formData.billing
      const billingErrors = getBillingRequiredErrors(b)
      if (hasFieldErrors(billingErrors)) {
        setFieldErrors((prev) => ({ ...prev, billing: billingErrors }))
        toast.error("Kérjük, töltsön ki minden kötelező adatot a számlázásnál!")
        return
      }
      setFieldErrors((prev) => ({ ...prev, billing: {} }))
      const bc = normalizeIso2(b.countryCode)
      if (!bc) {
        toast.error("Kérjük, válasszon érvényes számlázási országot.")
        return
      }
      if (
        tradingLimits?.invoicingRestricted &&
        tradingLimits.invoicingAllowedCountryCodes.length > 0 &&
        !tradingLimits.invoicingAllowedCountryCodes.includes(bc)
      ) {
        toast.error(
          `A számlázási ország nem engedélyezett. Csak számlázunk: ${formatAllowedCountriesList(
            tradingLimits.invoicingAllowedCountryCodes
          )} (${tradingLimits.invoicingAllowedCountryCodes.join(", ")}).`
        )
        return
      }
    } else if (stepId === "shipping") {
      const shipCode = formData.shipping.isSameAsBilling
        ? normalizeIso2(formData.billing.countryCode)
        : normalizeIso2(formData.shipping.countryCode)
      if (!shipCode) {
        toast.error("Kérjük, állítson be érvényes szállítási országot.")
        return
      }
      if (
        tradingLimits?.shippingRestricted &&
        tradingLimits.shippingAllowedCountryCodes.length > 0 &&
        !tradingLimits.shippingAllowedCountryCodes.includes(shipCode)
      ) {
        toast.error(
          `Ez a bolt csak a következő országokba szállít: ${formatAllowedCountriesList(
            tradingLimits.shippingAllowedCountryCodes
          )} (${tradingLimits.shippingAllowedCountryCodes.join(", ")}).`
        )
        return
      }
      if (!formData.shipping.isSameAsBilling) {
        const s = formData.shipping
        const shippingErrors = getShippingRequiredErrors(s)
        if (hasFieldErrors(shippingErrors)) {
          setFieldErrors((prev) => ({ ...prev, shipping: shippingErrors }))
          toast.error("Kérjük, töltse ki a szállítási adatokat is!")
          return
        }
      }
      setFieldErrors((prev) => ({ ...prev, shipping: {} }))
    } else if (stepId === "methods") {
      if (!formData.methods.shippingMethod || !formData.methods.paymentMethod) {
        toast.error("Kérjük, válasszon szállítási és fizetési módot!")
        return
      }
      if (
        isGlsParcelShippingMethod(formData.methods.shippingMethod, selectedShipping) &&
        !formData.methods.glsParcelPoint?.id
      ) {
        toast.error("Kérjük, válasszon GLS csomagpontot!")
        return
      }
      if (
        isFoxpostParcelShippingMethod(formData.methods.shippingMethod, selectedShipping) &&
        !formData.methods.foxpostParcelPoint?.id
      ) {
        toast.error("Kérjük, válasszon Foxpost csomagautomatát!")
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length - 1))
  }, [activeSteps, currentStep, formData, selectedShipping, tradingLimits])

  const prevStep = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const buildOrderPayload = React.useCallback(() => {
    const t = calculateTotal()
    return {
      items: items.map((i: any) => ({
        product: i.productId || i.id,
        variantId: i.variantId || undefined,
        variantLabel: i.variantLabel || undefined,
        selectedAttributes: i.selectedAttributes || undefined,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      billingInfo: {
        ...formData.billing,
        country: formData.billing.country,
        countryCode: formData.billing.countryCode,
      },
      shippingAddress: formData.shipping.isSameAsBilling
        ? {
            name: formData.billing.name,
            zip: formData.billing.zip,
            city: formData.billing.city,
            street: formData.billing.street,
            country: formData.billing.country,
            countryCode: formData.billing.countryCode,
            comment: formData.shipping.comment,
            email: formData.billing.email,
            phone: formData.billing.phone,
          }
        : {
            name: formData.shipping.name,
            zip: formData.shipping.zip,
            city: formData.shipping.city,
            street: formData.shipping.street,
            country: formData.shipping.country,
            countryCode: formData.shipping.countryCode,
            comment: formData.shipping.comment,
            email: formData.shipping.email,
            phone: formData.shipping.phone,
          },
      shippingMethod: formData.methods.shippingMethod,
      paymentMethod: formData.methods.paymentMethod,
      glsParcelPoint: formData.methods.glsParcelPoint || undefined,
      foxpostParcelPoint: formData.methods.foxpostParcelPoint || undefined,
      couponCodes: formData.coupon ? [formData.coupon.code] : [],
      subtotal: t.subtotal,
      shippingFee: t.shippingFee,
      paymentFee: t.paymentFee,
      discount: t.discount,
      total: t.total,
      saveAddressToProfile: formData.saveAddressToProfile,
    }
  }, [calculateTotal, formData, items])

  const handleSubmitOrder = React.useCallback(async () => {
    if (!shopEnabled) {
      toast.error("Jelenleg a rendelés leadás szünetel")
      return
    }
    setIsSubmitting(true)
    try {
      const orderData = buildOrderPayload()
      const isStripe = formData.methods.paymentMethod === "stripe_fixed"
      const endpoint = isStripe ? "/api/checkout/stripe/session" : "/api/checkout/order"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      if (res.ok) {
        const payload = await res.json()
        const totals = calculateTotal()
        if (isStripe) {
          if (payload?.checkoutUrl) {
            if (payload.tempOrderId) {
              saveCheckoutSnapshotFromCart(String(payload.tempOrderId), items, {
                total: totals.total,
                shipping: totals.shippingFee,
                coupon: formData.coupon?.code,
              })
              try {
                sessionStorage.setItem("stripeTempOrderId", String(payload.tempOrderId))
              } catch {
                /* ignore */
              }
            }
            if (payload.reservationExpiresAt) {
              setStripeRedirectHold({
                checkoutUrl: payload.checkoutUrl,
                reservationExpiresAt: String(payload.reservationExpiresAt),
                serverTime: payload.serverTime != null ? String(payload.serverTime) : null,
              })
              return
            }
            window.location.href = payload.checkoutUrl
            return
          }
          toast.error("Nem sikerült átirányítani a Stripe fizetéshez.")
        } else {
          if (payload?.orderId) {
            saveCheckoutSnapshotFromCart(String(payload.orderId), items, {
              total: totals.total,
              shipping: totals.shippingFee,
              coupon: formData.coupon?.code,
            })
          }
          clearCart()
          const successParams = new URLSearchParams()
          if (payload?.orderId) successParams.set("orderId", String(payload.orderId))
          if (payload?.guestAccessToken) successParams.set("guestToken", String(payload.guestAccessToken))
          const qs = successParams.toString()
          router.push(qs ? `/checkout/success?${qs}` : "/checkout/success")
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Hiba történt a rendelés leadása során")
      }
    } catch {
      toast.error("Hálózati hiba történt")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    buildOrderPayload,
    calculateTotal,
    clearCart,
    formData.coupon?.code,
    formData.methods.paymentMethod,
    items,
    router,
    shopEnabled,
  ])

  const goToStripeNow = React.useCallback(() => {
    if (stripeRedirectHold?.checkoutUrl) {
      try {
        const tempId = sessionStorage.getItem("stripeTempOrderId")
        if (tempId) {
          const totals = calculateTotal()
          saveCheckoutSnapshotFromCart(tempId, items, {
            total: totals.total,
            shipping: totals.shippingFee,
            coupon: formData.coupon?.code,
          })
        }
      } catch {
        /* ignore */
      }
      window.location.href = stripeRedirectHold.checkoutUrl
    }
  }, [stripeRedirectHold, calculateTotal, items, formData.coupon?.code])

  const renderStep = React.useCallback(() => {
    const stepId = activeSteps[currentStep]?.id
    switch (stepId) {
      case "billing":
        return (
          <BillingStep
            appearance={stepAppearance}
            data={formData.billing}
            errors={fieldErrors.billing}
            tradingLimits={tradingLimits}
            onChange={(val: any) => {
              setFormData((prev) => ({ ...prev, billing: val }))
              setFieldErrors((prev) => ({
                ...prev,
                billing: reconcileFieldErrors(prev.billing, getBillingRequiredErrors(val)),
              }))
            }}
          />
        )
      case "shipping":
        return (
          <ShippingStep
            appearance={stepAppearance}
            data={formData.shipping}
            billingData={formData.billing}
            errors={fieldErrors.shipping}
            tradingLimits={tradingLimits}
            onChange={(val: any) => {
              setFormData((prev) => ({ ...prev, shipping: val }))
              setFieldErrors((prev) => ({
                ...prev,
                shipping: reconcileFieldErrors(prev.shipping, getShippingRequiredErrors(val)),
              }))
            }}
          />
        )
      case "methods":
        return (
          <MethodsStep
            appearance={stepAppearance}
            data={formData.methods}
            methods={availableMethods}
            onChange={(val: any) => setFormData((prev) => ({ ...prev, methods: val }))}
          />
        )
      case "summary":
        return (
          <SummaryStep
            appearance={stepAppearance}
            data={formData}
            onChange={(val: any) => setFormData(val)}
            cartItems={items}
            totalPrice={totals.subtotal}
            isAuthenticated={Boolean(session?.user)}
            parcelLocker={parcelLockerSummary}
          />
        )
      default:
        return null
    }
  }, [
    activeSteps,
    availableMethods,
    currentStep,
    fieldErrors,
    formData,
    items,
    session?.user,
    stepAppearance,
    totals.subtotal,
    tradingLimits,
    parcelLockerSummary,
  ])

  return {
    currentStep,
    setCurrentStep,
    steps: activeSteps,
    parcelOnlyShipping,
    formData,
    setFormData,
    availableMethods,
    shopEnabled,
    items,
    cartTotalPrice,
    nextStep,
    prevStep,
    totals,
    totalBreakdown,
    selectedShipping,
    selectedPayment,
    priceBreakdownFromGross,
    formatHuf,
    renderStep,
    handleSubmitOrder,
    isSubmitting,
    stripeRedirectHold,
    goToStripeNow,
  }
}
