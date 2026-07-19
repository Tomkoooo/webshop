import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  decryptOrgSecret,
  encryptOrgSecret,
} from "@wse/plugin-t-book/lib/org-secrets"

describe("org-secrets multi-key decrypt", () => {
  const prev = {
    TBOOK_ORG_SECRETS_KEY: process.env.TBOOK_ORG_SECRETS_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }

  beforeEach(() => {
    delete process.env.TBOOK_ORG_SECRETS_KEY
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
  })

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it("decrypts a secret encrypted under AUTH_SECRET after TBOOK_ORG_SECRETS_KEY is introduced", () => {
    process.env.AUTH_SECRET = "legacy-auth-secret-for-tests"
    const cipher = encryptOrgSecret("szamlazz-agent-key-xyz")

    process.env.TBOOK_ORG_SECRETS_KEY = "new-dedicated-org-secrets-key"
    expect(decryptOrgSecret(cipher)).toBe("szamlazz-agent-key-xyz")
  })

  it("returns plaintext when value is not encrypted", () => {
    expect(decryptOrgSecret("plain-agent-key")).toBe("plain-agent-key")
  })
})
