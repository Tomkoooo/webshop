"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LogIn } from "lucide-react"
import "./tbook-landing.css"

const ADMIN_LOGIN = "/auth/admin-login?callbackUrl=%2Fadmin"
const ADMIN_GROUPS =
  "/auth/admin-login?callbackUrl=%2Fadmin%2Fplugins%2Ft-book%2Fgroups"
const OPENAPI = "/api/plugins/t-book/openapi"
const DIRECTORY = "/api/plugins/t-book/directory"
const SALES_EMAIL = "mailto:info@sironic.hu?subject=tBook%20aj%C3%A1nlatk%C3%A9r%C3%A9s"

const FEATURES = [
  {
    title: "Szervezetek, nem silók",
    body: "Multi-tenant admin: minden ügyfél saját szervezetben, csapattal, szerepkörökkel és jogosultságokkal — egy közös motoron.",
  },
  {
    title: "Jegyek valódi szabályokkal",
    body: "Kapacitás, időszak, per fő vagy foglalásonkénti díj, résztvevői mezők eseményenként — versenyektől fesztiválig.",
  },
  {
    title: "Szolgáltatások a jegy mellé",
    body: "Szállás, extrák és foglalási szakaszok dinamikus árazással — külön sorokkal az árajánlatban.",
  },
  {
    title: "Headless alapból",
    body: "Minden művelet API-n keresztül: eseménylista, árajánlat, foglalás és Stripe checkout — a saját oldaladon.",
  },
  {
    title: "API kulcsos integráció",
    body: "Eseménycsoportonként egy tbk_ kulcs. A titok a szervereden marad; a böngésző csak a publikus végpontokat hívja.",
  },
  {
    title: "Hostolt foglalási felület",
    body: "Kész /jegyek és foglalási varázsló is elérhető — vagy teljesen egyedi UI a REST API-val.",
  },
] as const

const LOGO_LABELS = ["Fesztivál", "Konferencia", "Workshop", "Verseny", "Turné", "Klub"] as const

const FLEX_ROWS: [string, string][] = [
  ["Jegyárak", "Per fő vagy foglalásonként"],
  ["Extrák & szállás", "Külön árazott foglalási szakaszok"],
  ["Kapacitás", "Eseményenként, korlátlan is lehet"],
  ["Szervezetek", "RBAC, meghívók, több org / fiók"],
  ["Fizetés", "Stripe Checkout, szerver oldali quote"],
  ["Számlázás", "szamlazz.hu integráció"],
]

const FAQS = [
  {
    q: "El kell hagyniuk a látogatóknak a weboldalunkat?",
    a: "Nem. Az API-val vagy a beépített /jegyek felülettel a foglalás a ti domaineteken marad. A hostolt változat is a saját aldomaineteken futtatható.",
  },
  {
    q: "Lehet csak jegyet, csak szállást, vagy mindkettőt értékesíteni?",
    a: "Igen. Az eseményhez opcionálisan hotelek és extrák kapcsolhatók; az árajánlat szerver oldalon, egyetlen quote logikával készül.",
  },
  {
    q: "Hogyan működik a több szervezet?",
    a: "A rendszer admin létrehozza a szervezetet; az org admin csapata RBAC szerepkörökkel kezeli az eseményeket. Egy Google-fiók több szervezethez is tartozhat.",
  },
  {
    q: "Van ingyenes kipróbálás?",
    a: "Az alap motor a WSE előfizetés része. Egyedi landing fejlesztéshez és enterprise igényekhez személyre szabott ajánlatot adunk.",
  },
] as const

const SNIPPETS = {
  api: `curl https://admin.tbook.example.com/api/plugins/t-book/events \\
  -H "X-TBook-Api-Key: tbk_..." \\
  -H "Accept: application/json"

# → { "ok": true, "events": [{ "id": "...", "name": "..." }] }`,
  embed: `// Szerver oldali fetch — a kulcs soha nem kerül a kliens bundle-be
const res = await fetch(\`\${TBOOK_API}/events\`, {
  headers: { "X-TBook-Api-Key": process.env.TBOOK_API_KEY! },
});
const { events } = await res.json();`,
  hosted: `# Példa: book.marka.hu → tBook API
# A /jegyek és /foglalas/* oldalak
# a csoport API kulcsával dolgoznak.`,
} as const

const PREVIEW_EVENTS = [
  {
    type: "Workshop",
    title: "Analóg fotózás",
    meta: "márc. 14., szombat · 10:00",
    price: "4 500 Ft-tól",
  },
  {
    type: "Koncert",
    title: "Éjszakai session",
    meta: "márc. 20., péntek · 21:00",
    price: "8 900 Ft-tól",
  },
  {
    type: "Túra",
    title: "Belvárosi séta",
    meta: "márc. 22., vasárnap · 8:30",
    price: "3 200 Ft-tól",
  },
] as const

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <span className="tl-ink-dot" />
          <span className="tracking-tight">tBook</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Funkciók
          </a>
          <a href="#integrate" className="transition-colors hover:text-foreground">
            Integráció
          </a>
          <a href="#flexibility" className="transition-colors hover:text-foreground">
            Rugalmasság
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            GYIK
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={ADMIN_LOGIN}
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Bejelentkezés
          </Link>
          <Link
            href={ADMIN_GROUPS}
            className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Kezdés
          </Link>
        </div>
      </div>
    </header>
  )
}

function TicketPreview() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="tl-hairline tl-surface tl-shadow-card overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tl-bg-border-strong h-2 w-2 rounded-full" />
          <span className="tl-bg-border-strong h-2 w-2 rounded-full" />
          <span className="tl-bg-border-strong h-2 w-2 rounded-full" />
          <span className="ml-2 font-mono">szervezet.tbook.hu/esemenyek</span>
        </div>
        <span className="text-xs text-muted-foreground">Éles</span>
      </div>
      <div className="grid gap-0 md:grid-cols-3">
        {PREVIEW_EVENTS.map((event) => (
          <div
            key={event.title}
            className="border-b border-border p-6 md:border-b-0 md:border-r md:last:border-r-0"
          >
            {!loaded ? (
              <div className="space-y-3">
                <div className="tl-skeleton h-3 w-20" />
                <div className="tl-skeleton h-5 w-40" />
                <div className="tl-skeleton h-3 w-32" />
                <div className="tl-skeleton mt-6 h-9 w-full" />
              </div>
            ) : (
              <div className="tl-fade-in">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {event.type}
                </div>
                <div className="tl-font-display mt-2 text-xl tracking-tight">{event.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{event.meta}</div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-foreground">{event.price}</span>
                  <span className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    Foglalás
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="tl-fade-up max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tl-ink-dot" />
          Foglalási infrastruktúra · esemény & szállás
        </div>
        <h1 className="tl-font-display text-5xl leading-[1.05] tracking-tight text-foreground md:text-7xl">
          Értékesíts jegyeket a saját oldaladon.
          <span className="text-muted-foreground"> Anélkül, hogy elhagynák.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          A tBook a Webshop Engine headless foglalási motorja: szervezetek, események,
          dinamikus árazás és Stripe fizetés — beágyazva az API-n, SDK-szerű mintával vagy
          kész foglalási felülettel.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={ADMIN_GROUPS}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ingyenes indulás
          </Link>
          <Link
            href={OPENAPI}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            API dokumentáció
          </Link>
        </div>
      </div>
      <div className="tl-fade-up mt-20" style={{ animationDelay: "120ms" }}>
        <TicketPreview />
      </div>
    </section>
  )
}

function LogoStrip() {
  return (
    <section className="border-y border-border tl-surface-muted/50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Olyan szervezeteknek, akiknek számít a részlet
        </p>
        <div className="mt-6 grid grid-cols-2 gap-y-4 text-center sm:grid-cols-3 md:grid-cols-6">
          {LOGO_LABELS.map((label) => (
            <span key={label} className="tl-font-display text-sm text-muted-foreground/80">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Mit ad a tBook?</p>
        <h2 className="tl-font-display mt-3 text-3xl tracking-tight md:text-5xl">
          Minden, ami egy élmény értékesítéséhez kell.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Nyugodt, átgondolt építőkockák — felesleges dashboard-zűrzavar és vendor lock-in nélkül.
        </p>
      </div>
      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group tl-surface p-8 transition-colors hover:bg-[var(--tl-surface-muted)]"
          >
            <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors group-hover:text-foreground">
              <span className="tl-ink-dot" />
            </div>
            <h3 className="text-base font-medium text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function IntegrationPreview() {
  const [tab, setTab] = useState<"api" | "embed" | "hosted">("api")
  const labels = { api: "REST API", embed: "Beágyazás", hosted: "Hostolt UI" } as const

  return (
    <section id="integrate" className="border-y border-border tl-surface-muted/40">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Három integrációs út
          </p>
          <h2 className="tl-font-display mt-3 text-3xl tracking-tight md:text-5xl">
            Találd meg a látogatóidat, ahol már vannak.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Listázd az eseményeket a saját oldaladon API-val, építs egyedi UI-t szerver oldali
            fetch-csel, vagy használd a kész foglalási felületet — ugyanaz a készlet, ugyanazok a
            szabályok.
          </p>
          <div className="mt-8 flex gap-1 rounded-md border border-border p-1">
            {(["api", "embed", "hosted"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors " +
                  (tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {labels[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="tl-hairline tl-surface overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="tl-ink-dot" />
            {tab === "api" ? "terminál" : tab === "embed" ? "lib/tbook-events.ts" : "book.marka.hu"}
          </div>
          <pre
            key={tab}
            className="tl-fade-in overflow-x-auto p-5 text-[13px] leading-relaxed text-foreground"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            <code>{SNIPPETS[tab]}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

function Flexibility() {
  return (
    <section id="flexibility" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="grid gap-16 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Rugalmasság</p>
          <h2 className="tl-font-display mt-3 text-3xl tracking-tight md:text-5xl">
            A szabályok az eseményedhez igazodnak.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A jegyértékesítés sosem egyforma. A tBook primitíveket ad — egy helytől a teljes
            szállásos csomagig, multi-tenant szervezeti felépítéssel.
          </p>
        </div>
        <div className="tl-surface overflow-hidden rounded-xl border border-border">
          {FLEX_ROWS.map(([k, v], i) => (
            <div
              key={k}
              className={
                "flex items-center justify-between px-6 py-4 text-sm " +
                (i !== FLEX_ROWS.length - 1 ? "border-b border-border" : "")
              }
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="border-t border-border tl-surface-muted/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[1fr_1.4fr] md:py-32">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">GYIK</p>
          <h2 className="tl-font-display mt-3 text-3xl tracking-tight md:text-4xl">
            Apróbetűs, hangosan.
          </h2>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <button
                key={f.q}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="block w-full py-5 text-left"
              >
                <div className="flex items-center justify-between gap-6">
                  <span className="text-base text-foreground">{f.q}</span>
                  <span
                    className="text-muted-foreground transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
                    aria-hidden
                  >
                    +
                  </span>
                </div>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") ?? "").trim()
    const subject = encodeURIComponent("tBook hozzáférés kérés")
    const body = encodeURIComponent(
      email ? `Szia,\n\nSzeretnék hozzáférést a tBook-hoz.\n\nE-mail: ${email}\n` : ""
    )
    window.location.href = `mailto:info@sironic.hu?subject=${subject}&body=${body}`
  }

  return (
    <section id="cta" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="tl-hairline tl-surface rounded-2xl p-10 md:p-16">
        <div className="max-w-2xl">
          <h2 className="tl-font-display text-3xl tracking-tight md:text-5xl">
            Indítsd el az első eseményt még ma.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hozz létre szervezetet, modellezd az első eseménycsoportot, és menj élesbe a saját
            oldaladon — API-val vagy operátori adminnal.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              name="email"
              required
              placeholder="te@szervezet.hu"
              className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--tl-border-strong)]"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Hozzáférés kérése
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Operátorként azonnal beléphetsz, ha már van hozzáférésed.{" "}
            <Link href={ADMIN_LOGIN} className="underline hover:text-foreground">
              Admin bejelentkezés
            </Link>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ADMIN_GROUPS}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
            >
              <LogIn className="size-4" aria-hidden />
              Operátor belépés
            </Link>
            <Link
              href={DIRECTORY}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
            >
              Eseménykönyvtár
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-sm">
          <span className="tl-ink-dot" />
          <span className="tracking-tight">tBook</span>
          <span className="ml-3 text-muted-foreground">© {new Date().getFullYear()} Sironic</span>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href={OPENAPI} className="transition-colors hover:text-foreground">
            API
          </Link>
          <Link href={DIRECTORY} className="transition-colors hover:text-foreground">
            Könyvtár
          </Link>
          <Link href={ADMIN_LOGIN} className="transition-colors hover:text-foreground">
            Admin
          </Link>
          <a href={SALES_EMAIL} className="transition-colors hover:text-foreground">
            Kapcsolat
          </a>
        </div>
      </div>
    </footer>
  )
}

export function TBookServiceLanding() {
  return (
    <div className="tbook-landing min-h-screen">
      <Nav />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <IntegrationPreview />
        <Flexibility />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
