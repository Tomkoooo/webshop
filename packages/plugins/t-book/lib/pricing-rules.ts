/**
 * Event-level pricing rules — flexible adjustments without hardcoding special cases.
 *
 * Examples:
 * - Free entry: set_ticket_fee → 0 (always)
 * - Hotel package discount: adjust_accommodation −100 (with_hotel / with_package)
 * - Off-site surcharge: adjust_total +100 (without_hotel)
 */

export type TBookPricingRuleWhen =
  | "always"
  | "with_hotel"
  | "without_hotel"
  | "with_package"

export type TBookPricingRuleAction =
  | "set_ticket_fee"
  | "adjust_ticket"
  | "adjust_accommodation"
  | "adjust_total"

export type TBookPricingRuleAmountMode =
  | "fixed"
  | "per_person"
  | "per_team"
  | "per_team_member"
  | "per_accommodation_guest"
  | "percent_accommodation"
  | "percent_ticket"

export type TBookPricingRule = {
  id: string
  enabled: boolean
  label: string
  when: TBookPricingRuleWhen
  action: TBookPricingRuleAction
  /** Positive = charge, negative = discount (except set_ticket_fee which is absolute). */
  amount: number
  amountMode: TBookPricingRuleAmountMode
}

export const PRICING_RULE_WHEN_LABELS: Record<TBookPricingRuleWhen, string> = {
  always: "Mindig",
  with_hotel: "Ha szervezői szállást választ",
  without_hotel: "Ha nem választ szervezői szállást",
  with_package: "Ha szálláscsomagot választ",
}

export const PRICING_RULE_ACTION_LABELS: Record<TBookPricingRuleAction, string> = {
  set_ticket_fee: "Belépődíj felülírása",
  adjust_ticket: "Belépő módosítás (+/−)",
  adjust_accommodation: "Szállás módosítás (+/−)",
  adjust_total: "Összeg módosítás (+/−)",
}

export const PRICING_RULE_AMOUNT_MODE_LABELS: Record<TBookPricingRuleAmountMode, string> = {
  fixed: "Fix összeg",
  per_person: "Jegyenként (csapat = 1 jegy)",
  per_team: "Csapatonként",
  per_team_member: "Csapattagonként (játékos / fő)",
  per_accommodation_guest: "Szállás vendégenként",
  percent_accommodation: "% a szállás részösszegéből",
  percent_ticket: "% a belépő részösszegéből",
}

function isRule(value: unknown): value is TBookPricingRule {
  if (!value || typeof value !== "object") return false
  const r = value as Partial<TBookPricingRule>
  return Boolean(r.id && r.when && r.action && r.amountMode)
}

export function normalizePricingRules(raw: unknown): TBookPricingRule[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isRule).map((r, i) => ({
    id: String(r.id || `rule-${i}`),
    enabled: r.enabled !== false,
    label: String(r.label || "Ármódosítás").trim() || "Ármódosítás",
    when: r.when as TBookPricingRuleWhen,
    action: r.action as TBookPricingRuleAction,
    amount: Number.isFinite(Number(r.amount)) ? Number(r.amount) : 0,
    amountMode: r.amountMode as TBookPricingRuleAmountMode,
  }))
}

export type PricingRuleContext = {
  hasHotel: boolean
  hasPackage: boolean
  guests: number
  accommodationGuests: number
  /** Players per ticket/team — used for per_team_member rules. */
  playersPerTicket: number
  ticketSubtotalHuf: number
  accommodationSubtotalHuf: number
}

export function ruleMatches(rule: TBookPricingRule, ctx: PricingRuleContext): boolean {
  if (!rule.enabled) return false
  switch (rule.when) {
    case "always":
      return true
    case "with_hotel":
      return ctx.hasHotel
    case "without_hotel":
      return !ctx.hasHotel
    case "with_package":
      return ctx.hasHotel && ctx.hasPackage
    default:
      return false
  }
}

/** Resolve absolute ticket fee override from matching set_ticket_fee rules (last wins). */
export function resolveTicketFeeOverride(
  rules: TBookPricingRule[] | null | undefined,
  ctx: Pick<
    PricingRuleContext,
    "hasHotel" | "hasPackage" | "guests" | "accommodationGuests" | "playersPerTicket"
  >
): number | null {
  const list = normalizePricingRules(rules)
  let override: number | null = null
  const baseCtx: PricingRuleContext = {
    ...ctx,
    playersPerTicket: ctx.playersPerTicket ?? 1,
    ticketSubtotalHuf: 0,
    accommodationSubtotalHuf: 0,
  }
  for (const rule of list) {
    if (rule.action !== "set_ticket_fee") continue
    if (!ruleMatches(rule, baseCtx)) continue
    override = Math.max(0, rule.amount)
  }
  return override
}

function computeRuleAmount(rule: TBookPricingRule, ctx: PricingRuleContext): number {
  const amount = rule.amount
  const players = Math.max(1, ctx.playersPerTicket ?? 1)
  switch (rule.amountMode) {
    case "fixed":
      return amount
    case "per_person":
      return amount * Math.max(1, ctx.guests)
    case "per_team":
      return amount * Math.max(1, ctx.guests)
    case "per_team_member":
      return amount * Math.max(1, ctx.guests) * players
    case "per_accommodation_guest":
      return amount * Math.max(1, ctx.accommodationGuests || ctx.guests)
    case "percent_accommodation":
      return (ctx.accommodationSubtotalHuf * amount) / 100
    case "percent_ticket":
      return (ctx.ticketSubtotalHuf * amount) / 100
    default:
      return amount
  }
}

export type AppliedPricingRuleLine = {
  key: string
  label: string
  amountHuf: number
  ruleId: string
  action: TBookPricingRuleAction
}

/** Apply adjust_* rules after base quote subtotals are known. */
export function applyPricingRuleAdjustments(
  rules: TBookPricingRule[] | null | undefined,
  ctx: PricingRuleContext
): AppliedPricingRuleLine[] {
  const lines: AppliedPricingRuleLine[] = []
  for (const rule of normalizePricingRules(rules)) {
    if (rule.action === "set_ticket_fee") continue
    if (!ruleMatches(rule, ctx)) continue
    const amountHuf = Math.round(computeRuleAmount(rule, ctx))
    if (amountHuf === 0) continue
    lines.push({
      key: `pricing_rule:${rule.id}`,
      label: rule.label,
      amountHuf,
      ruleId: rule.id,
      action: rule.action,
    })
  }
  return lines
}
