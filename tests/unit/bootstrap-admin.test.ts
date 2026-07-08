import { afterEach, describe, expect, it } from "vitest"
import {
  BOOTSTRAP_ADMIN_ENV,
  getBootstrapAdminEmails,
  parseBootstrapAdminEmails,
} from "@wse/core/lib/bootstrap-admin"

describe("parseBootstrapAdminEmails", () => {
  it("returns empty list for blank input", () => {
    expect(parseBootstrapAdminEmails(undefined)).toEqual([])
    expect(parseBootstrapAdminEmails("")).toEqual([])
    expect(parseBootstrapAdminEmails("   ")).toEqual([])
  })

  it("parses a single email", () => {
    expect(parseBootstrapAdminEmails("Admin@Example.com")).toEqual(["admin@example.com"])
  })

  it("parses comma-separated emails with optional spaces", () => {
    expect(
      parseBootstrapAdminEmails("one@example.com, two@example.com ,three@example.com")
    ).toEqual(["one@example.com", "two@example.com", "three@example.com"])
  })

  it("parses semicolon- and newline-separated lists", () => {
    expect(parseBootstrapAdminEmails("a@test.com;b@test.com\nc@test.com")).toEqual([
      "a@test.com",
      "b@test.com",
      "c@test.com",
    ])
  })

  it("deduplicates repeated emails", () => {
    expect(parseBootstrapAdminEmails("dup@test.com, dup@test.com,DUP@test.com")).toEqual([
      "dup@test.com",
    ])
  })
})

describe("getBootstrapAdminEmails", () => {
  const previous = process.env[BOOTSTRAP_ADMIN_ENV]

  afterEach(() => {
    if (previous === undefined) delete process.env[BOOTSTRAP_ADMIN_ENV]
    else process.env[BOOTSTRAP_ADMIN_ENV] = previous
  })

  it("reads comma-separated emails from env", () => {
    process.env[BOOTSTRAP_ADMIN_ENV] = "first@test.com, second@test.com"
    expect(getBootstrapAdminEmails()).toEqual(["first@test.com", "second@test.com"])
  })
})
