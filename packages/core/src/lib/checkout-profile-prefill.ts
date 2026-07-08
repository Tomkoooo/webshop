import { getCountryDisplayName, resolveCountryInput } from "@wse/core/lib/country-codes"

type ProfileBilling = {
  type?: "personal" | "company"
  name?: string
  taxNumber?: string
  country?: string
  city?: string
  zip?: string
  street?: string
  email?: string
  phone?: string
}

type ProfileShipping = {
  name?: string
  country?: string
  city?: string
  zip?: string
  street?: string
  comment?: string
  email?: string
  phone?: string
}

function resolveCountryFields(countryRaw?: string) {
  const resolved = resolveCountryInput(countryRaw ?? "")
  const code = resolved.code ?? "HU"
  return {
    countryCode: code,
    country: getCountryDisplayName(code, "hu-HU"),
  }
}

function shippingMatchesBilling(billing: ProfileBilling, shipping: ProfileShipping): boolean {
  const pairs: [string | undefined, string | undefined][] = [
    [billing.name, shipping.name],
    [billing.zip, shipping.zip],
    [billing.city, shipping.city],
    [billing.street, shipping.street],
    [billing.country, shipping.country],
  ]
  const hasShipping = pairs.some(([, s]) => Boolean(String(s ?? "").trim()))
  if (!hasShipping) return true
  return pairs.every(([b, s]) => String(b ?? "").trim() === String(s ?? "").trim())
}

export type CheckoutProfilePrefill = {
  billing: {
    type: "personal" | "company"
    name: string
    taxNumber: string
    countryCode: string
    country: string
    city: string
    zip: string
    street: string
    email: string
    phone: string
  }
  shipping: {
    isSameAsBilling: boolean
    name: string
    countryCode: string
    country: string
    city: string
    zip: string
    street: string
    comment: string
    email: string
    phone: string
  }
}

/** Map saved user profile billing/shipping into checkout wizard form fields. */
export function checkoutPrefillFromUserProfile(
  user: { billingInfo?: ProfileBilling; shippingAddress?: ProfileShipping },
  session?: { email?: string | null; name?: string | null }
): CheckoutProfilePrefill | null {
  const bi = user.billingInfo
  const ship = user.shippingAddress
  const hasBilling =
    Boolean(bi?.name?.trim()) ||
    Boolean(bi?.zip?.trim()) ||
    Boolean(bi?.city?.trim()) ||
    Boolean(bi?.street?.trim()) ||
    Boolean(bi?.phone?.trim()) ||
    Boolean(bi?.email?.trim())
  const hasShipping =
    Boolean(ship?.name?.trim()) ||
    Boolean(ship?.zip?.trim()) ||
    Boolean(ship?.city?.trim()) ||
    Boolean(ship?.street?.trim()) ||
    Boolean(ship?.phone?.trim()) ||
    Boolean(ship?.email?.trim())
  if (!hasBilling && !hasShipping) return null

  const billingCountry = resolveCountryFields(bi?.country)
  const shippingCountry = resolveCountryFields(ship?.country || bi?.country)
  const isSameAsBilling =
    !hasShipping || Boolean(bi && ship && shippingMatchesBilling(bi, ship))

  const billingName = bi?.name?.trim() || session?.name?.trim() || ""
  const shippingName = isSameAsBilling ? billingName : ship?.name?.trim() || session?.name?.trim() || ""
  const billingEmail = bi?.email?.trim() || session?.email?.trim() || ""
  const billingPhone = bi?.phone?.trim() || ""
  const shippingEmail = isSameAsBilling
    ? billingEmail
    : ship?.email?.trim() || session?.email?.trim() || ""
  const shippingPhone = isSameAsBilling ? billingPhone : ship?.phone?.trim() || ""

  return {
    billing: {
      type: bi?.type === "company" ? "company" : "personal",
      name: billingName,
      taxNumber: bi?.taxNumber?.trim() || "",
      ...billingCountry,
      city: bi?.city?.trim() || "",
      zip: bi?.zip?.trim() || "",
      street: bi?.street?.trim() || "",
      email: billingEmail,
      phone: billingPhone,
    },
    shipping: {
      isSameAsBilling,
      name: shippingName,
      ...(isSameAsBilling ? billingCountry : shippingCountry),
      city: (isSameAsBilling ? bi?.city : ship?.city)?.trim() || "",
      zip: (isSameAsBilling ? bi?.zip : ship?.zip)?.trim() || "",
      street: (isSameAsBilling ? bi?.street : ship?.street)?.trim() || "",
      comment: isSameAsBilling ? "" : ship?.comment?.trim() || "",
      email: shippingEmail,
      phone: shippingPhone,
    },
  }
}
