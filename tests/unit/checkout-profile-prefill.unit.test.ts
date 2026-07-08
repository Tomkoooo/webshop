import { describe, expect, it } from "vitest"
import { checkoutPrefillFromUserProfile } from "@wse/core/lib/checkout-profile-prefill"

describe("checkoutPrefillFromUserProfile", () => {
  it("returns null when profile has no address fields", () => {
    expect(checkoutPrefillFromUserProfile({})).toBeNull()
  })

  it("maps billing and marks shipping same when shipping empty", () => {
    const prefill = checkoutPrefillFromUserProfile(
      {
        billingInfo: {
          type: "company",
          name: "Acme Kft",
          taxNumber: "123",
          country: "Magyarország",
          city: "Budapest",
          zip: "1011",
          street: "Fő utca 1",
        },
      },
      { email: "buyer@example.com", name: "Buyer" }
    )
    expect(prefill?.billing.name).toBe("Acme Kft")
    expect(prefill?.billing.countryCode).toBe("HU")
    expect(prefill?.billing.email).toBe("buyer@example.com")
    expect(prefill?.shipping.isSameAsBilling).toBe(true)
    expect(prefill?.shipping.city).toBe("Budapest")
  })

  it("prefills billing phone and email from profile", () => {
    const prefill = checkoutPrefillFromUserProfile({
      billingInfo: {
        name: "Bill",
        country: "HU",
        city: "Budapest",
        zip: "1011",
        street: "A",
        phone: "+36 30 123 4567",
        email: "bill@example.com",
      },
    })
    expect(prefill?.billing.phone).toBe("+36 30 123 4567")
    expect(prefill?.billing.email).toBe("bill@example.com")
    expect(prefill?.shipping.phone).toBe("+36 30 123 4567")
  })

  it("keeps separate shipping when addresses differ", () => {
    const prefill = checkoutPrefillFromUserProfile({
      billingInfo: {
        name: "Bill",
        country: "HU",
        city: "Budapest",
        zip: "1011",
        street: "A",
      },
      shippingAddress: {
        name: "Ship",
        country: "HU",
        city: "Debrecen",
        zip: "4024",
        street: "B",
        comment: "Ring bell",
      },
    })
    expect(prefill?.shipping.isSameAsBilling).toBe(false)
    expect(prefill?.shipping.name).toBe("Ship")
    expect(prefill?.shipping.city).toBe("Debrecen")
    expect(prefill?.shipping.comment).toBe("Ring bell")
  })
})
