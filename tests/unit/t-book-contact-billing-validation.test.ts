import { describe, expect, it } from "vitest"
import {
  emptyBillingForm,
  isBillingFormValid,
  validateBillingForm,
} from "../../packages/plugins/t-book/storefront/BookingBillingForm"
import {
  emptyCustomerForm,
  isCustomerFormValid,
  validateCustomerForm,
} from "../../packages/plugins/t-book/storefront/BookingCustomerForm"

describe("t-book contact/billing zod validation", () => {
  it("reports required customer fields", () => {
    const errors = validateCustomerForm(emptyCustomerForm())
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.phone).toBeTruthy()
    expect(isCustomerFormValid(emptyCustomerForm())).toBe(false)
  })

  it("accepts a valid customer and rejects bad email", () => {
    expect(
      isCustomerFormValid({
        name: "Alex",
        email: "alex@example.com",
        phone: "+361234567",
        note: "",
      })
    ).toBe(true)
    expect(
      validateCustomerForm({
        name: "Alex",
        email: "not-an-email",
        phone: "+361234567",
        note: "",
      }).email
    ).toMatch(/email/i)
  })

  it("requires tax number for company billing only", () => {
    const base = {
      ...emptyBillingForm("Club"),
      zip: "1051",
      city: "Budapest",
      street: "Main 1",
    }
    expect(isBillingFormValid({ ...base, billingType: "personal" })).toBe(true)
    expect(isBillingFormValid({ ...base, billingType: "sport", taxNumber: "" })).toBe(true)
    expect(isBillingFormValid({ ...base, billingType: "company", taxNumber: "" })).toBe(false)
    expect(
      validateBillingForm({ ...base, billingType: "company", taxNumber: "" }).taxNumber
    ).toMatch(/tax/i)
  })
})
