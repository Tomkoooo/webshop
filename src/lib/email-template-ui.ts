/** Admin UI: tag colors and template relationships (not stored in DB). */

export type EmailTagStyle = {
  className: string
  label?: string
}

const TAG_STYLES: Record<string, EmailTagStyle> = {
  core: {
    className: "bg-slate-500/20 border-slate-400/50 text-slate-100",
    label: "Motor",
  },
  shop: {
    className: "bg-sky-500/20 border-sky-400/50 text-sky-100",
    label: "Webshop",
  },
  order: {
    className: "bg-indigo-500/20 border-indigo-400/50 text-indigo-100",
    label: "Rendelés",
  },
  contact: {
    className: "bg-emerald-500/20 border-emerald-400/50 text-emerald-100",
    label: "Kapcsolat",
  },
  invoicing: {
    className: "bg-violet-500/20 border-violet-400/50 text-violet-100",
    label: "Számlázás",
  },
  szamlazz: {
    className: "bg-amber-500/20 border-amber-400/50 text-amber-100",
    label: "Számlázz.hu",
  },
  "szamlazz-failure": {
    className: "bg-rose-500/20 border-rose-400/50 text-rose-100",
    label: "Számlázás sikertelen",
  },
  "camp-booking": {
    className: "bg-lime-500/20 border-lime-400/50 text-lime-100",
    label: "Tábor plugin",
  },
  transactional: {
    className: "bg-cyan-500/20 border-cyan-400/50 text-cyan-100",
    label: "Tranzakció",
  },
  registration: {
    className: "bg-teal-500/20 border-teal-400/50 text-teal-100",
    label: "Regisztráció",
  },
}

const FALLBACK_TAG_STYLE: EmailTagStyle = {
  className: "bg-white/10 border-white/20 text-neutral-300",
}

export function getEmailTagStyle(tag: string): EmailTagStyle {
  return TAG_STYLES[tag] ?? FALLBACK_TAG_STYLE
}

export function getEmailTagBadgeClassName(tag: string): string {
  const base =
    "inline-flex items-center px-2.5 py-1 border text-[9px] font-black uppercase tracking-widest rounded-sm"
  return `${base} ${getEmailTagStyle(tag).className}`
}

/** Card left-border accent from primary functional tag. */
export function getEmailTemplateCardAccent(tags: string[] | undefined, type: string): string {
  if (type === "invoice_sent" || type === "invoice_issue") {
    return "border-l-4 border-l-amber-500/80"
  }
  if (tags?.includes("camp-booking")) return "border-l-4 border-l-lime-500/80"
  if (tags?.includes("contact")) return "border-l-4 border-l-emerald-500/80"
  if (tags?.includes("shop") || tags?.includes("order")) return "border-l-4 border-l-sky-500/80"
  return "border-l-4 border-l-slate-500/40"
}

export type EmailTemplateRelation = {
  relatedTypes: string[]
  /** Short note on admin card */
  note: string
}

export const EMAIL_TEMPLATE_RELATIONS: Record<string, EmailTemplateRelation> = {
  order_status_change: {
    relatedTypes: ["order_cancelled"],
    note: "Általános állapotváltozás. Admin törlésnél a vásárló ezt és a „Rendelés törlése” sablont is megkapja.",
  },
  order_cancelled: {
    relatedTypes: ["order_status_change"],
    note: "Admin rendelés törlés — opcionális indoklással, sztornó számla PDF csatolmánnyal (ha van). Az állapotváltozás email a párja.",
  },
  invoice_sent: {
    relatedTypes: ["invoice_issue"],
    note: "Sikeres Számlázz.hu számla — PDF csatolmánnyal. Ha a kiállítás/küldés elbukik, a vásárló a „Számlázási probléma” sablont kapja (pár sablon).",
  },
  invoice_issue: {
    relatedTypes: ["invoice_sent"],
    note: "Számlázási hiba vagy manuális beavatkozás — értesíti a vásárlót, ha a számla nem mehet ki automatikusan. Siker esetén a „Számla elküldve” sablon a párja.",
  },
}

export function getEmailTemplateRelation(type: string): EmailTemplateRelation | null {
  return EMAIL_TEMPLATE_RELATIONS[type] ?? null
}
