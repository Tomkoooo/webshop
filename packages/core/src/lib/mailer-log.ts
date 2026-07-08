import { formatEmailFromHeader } from "@wse/core/lib/email-from"

export const MAILER_LOG_PREFIX = "[mailer]"

export type MailerLogLevel = "info" | "warn" | "error"

export type MailerSmtpConfigSummary = {
  host: string
  port: number
  user: string
  from: string
  hasPassword: boolean
  usingDefaultHost: boolean
  usingDefaultUser: boolean
  usingDefaultPass: boolean
  vercelEnv: string | null
  nodeEnv: string | null
}

export function getMailerSmtpConfigSummary(): MailerSmtpConfigSummary {
  return {
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER || "test@example.com",
    from: formatEmailFromHeader(),
    hasPassword: Boolean(String(process.env.EMAIL_PASS || "").trim()),
    usingDefaultHost: !process.env.EMAIL_HOST,
    usingDefaultUser: !process.env.EMAIL_USER,
    usingDefaultPass: !process.env.EMAIL_PASS,
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
  }
}

export function warnIfMailerEnvIncomplete() {
  const cfg = getMailerSmtpConfigSummary()
  if (!cfg.usingDefaultHost && !cfg.usingDefaultUser && cfg.hasPassword) return
  logMailer("warn", "smtp_env_incomplete", {
    reason:
      "EMAIL_HOST, EMAIL_USER, and/or EMAIL_PASS missing — using built-in placeholders; mail will not deliver.",
    smtp: cfg,
  })
}

/** Safe error shape for Vercel / server logs (no credentials). */
export function serializeMailerError(error: unknown): Record<string, unknown> {
  if (error == null) return { message: "unknown error" }
  if (typeof error !== "object") return { message: String(error) }

  const e = error as {
    message?: string
    name?: string
    code?: string
    command?: string
    response?: string
    responseCode?: number
    errno?: number
    syscall?: string
    hostname?: string
    stack?: string
  }

  return {
    name: e.name,
    message: e.message || String(error),
    code: e.code,
    command: e.command,
    response: typeof e.response === "string" ? e.response.slice(0, 500) : e.response,
    responseCode: e.responseCode,
    errno: e.errno,
    syscall: e.syscall,
    hostname: e.hostname,
    stack:
      process.env.NODE_ENV === "development" || process.env.MAILER_LOG_STACK === "1"
        ? e.stack
        : undefined,
  }
}

export function logMailer(
  level: MailerLogLevel,
  event: string,
  details?: Record<string, unknown>
) {
  const payload = {
    event,
    at: new Date().toISOString(),
    ...details,
  }
  const line = `${MAILER_LOG_PREFIX} ${event}`
  if (level === "error") console.error(line, JSON.stringify(payload))
  else if (level === "warn") console.warn(line, JSON.stringify(payload))
  else console.log(line, JSON.stringify(payload))
}
