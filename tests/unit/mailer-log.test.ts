import { afterEach, describe, expect, it, vi } from "vitest"
import {
  getMailerSmtpConfigSummary,
  logMailer,
  serializeMailerError,
  warnIfMailerEnvIncomplete,
} from "@wse/core/lib/mailer-log"

describe("mailer-log", () => {
  const envBackup = { ...process.env }

  afterEach(() => {
    process.env = { ...envBackup }
    vi.restoreAllMocks()
  })

  it("flags incomplete SMTP env", () => {
    delete process.env.EMAIL_HOST
    delete process.env.EMAIL_USER
    delete process.env.EMAIL_PASS
    const cfg = getMailerSmtpConfigSummary()
    expect(cfg.usingDefaultHost).toBe(true)
    expect(cfg.usingDefaultPass).toBe(true)
    expect(cfg.hasPassword).toBe(false)
  })

  it("serializes nodemailer-like errors without secrets", () => {
    const err = Object.assign(new Error("Connection timeout"), {
      code: "ETIMEDOUT",
      command: "CONN",
      response: "421 Service unavailable",
      responseCode: 421,
    })
    expect(serializeMailerError(err)).toMatchObject({
      message: "Connection timeout",
      code: "ETIMEDOUT",
      command: "CONN",
      responseCode: 421,
    })
  })

  it("warnIfMailerEnvIncomplete logs when defaults are used", () => {
    delete process.env.EMAIL_HOST
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    warnIfMailerEnvIncomplete()
    expect(warn).toHaveBeenCalled()
    const line = String(warn.mock.calls[0]?.[0])
    expect(line).toContain("[mailer]")
    expect(line).toContain("smtp_env_incomplete")
  })

  it("logMailer writes JSON payload", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    logMailer("info", "test_event", { foo: "bar" })
    expect(log).toHaveBeenCalled()
    const json = log.mock.calls[0]?.[1] as string
    expect(JSON.parse(json)).toMatchObject({ event: "test_event", foo: "bar" })
  })
})
