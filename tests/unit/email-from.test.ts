import { afterEach, describe, expect, it } from "vitest"
import {
  formatEmailFromHeader,
  getEmailFromAddress,
  getEmailFromName,
} from "@wse/core/lib/email-from"

describe("email from header", () => {
  const prevFrom = process.env.EMAIL_FROM
  const prevName = process.env.EMAIL_FROM_NAME

  afterEach(() => {
    if (prevFrom === undefined) delete process.env.EMAIL_FROM
    else process.env.EMAIL_FROM = prevFrom
    if (prevName === undefined) delete process.env.EMAIL_FROM_NAME
    else process.env.EMAIL_FROM_NAME = prevName
  })

  it("uses defaults when env is unset", () => {
    delete process.env.EMAIL_FROM
    delete process.env.EMAIL_FROM_NAME
    expect(getEmailFromAddress()).toBe("no-reply@krausz.hu")
    expect(getEmailFromName()).toBe("Krausz Barkácsmester")
    expect(formatEmailFromHeader()).toBe('"Krausz Barkácsmester" <no-reply@krausz.hu>')
  })

  it("reads EMAIL_FROM and EMAIL_FROM_NAME from env", () => {
    process.env.EMAIL_FROM = "hello@shop.test"
    process.env.EMAIL_FROM_NAME = "Demo Store"
    expect(formatEmailFromHeader()).toBe('"Demo Store" <hello@shop.test>')
  })
})
