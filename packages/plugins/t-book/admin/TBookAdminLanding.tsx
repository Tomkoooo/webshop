"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  Code2,
  CreditCard,
  Globe2,
  Hotel,
  KeyRound,
  Layers,
  Mail,
  Sparkles,
  Ticket,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { TBookPrimaryButton } from "./t-book-admin-ui"

const STAGGER = ["delay-0", "delay-75", "delay-150", "delay-200", "delay-300", "delay-500"] as const

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Események & jegyek",
    description:
      "Kapacitás, időszak, helyszín és résztvevői adatok — versenyekhez, konferenciákhoz, fesztiválokhoz.",
    accent: "from-violet-500/15 to-primary/5",
  },
  {
    icon: Hotel,
    title: "Szállás & extrák",
    description:
      "Szobatípusok, foglalási szakaszok és dinamikus felárak egyetlen árajánlatban.",
    accent: "from-sky-500/15 to-primary/5",
  },
  {
    icon: CreditCard,
    title: "Stripe & számlázás",
    description:
      "Biztonságos checkout a szerveren, automatikus visszaigazolás és szamlazz.hu integráció.",
    accent: "from-emerald-500/15 to-primary/5",
  },
  {
    icon: KeyRound,
    title: "API kulcsos integráció",
    description:
      "Külső landing oldalak a publikus REST API-n keresztül — titkok soha nem kerülnek a böngészőbe.",
    accent: "from-amber-500/15 to-primary/5",
  },
] as const

const USAGE_MODES = [
  {
    icon: Code2,
    title: "Saját landing + API",
    badge: "Ajánlott",
    description:
      "Építs egyedi foglalási élményt a weboldaladon. Az API kulcs csak a szervereden él; a kliens quote-ot és checkout URL-t kap.",
    bullets: ["OpenAPI dokumentáció", "Rate limit védelem", "Stripe redirect flow"],
    href: "/api/plugins/t-book/openapi",
    cta: "API dokumentáció",
    external: true,
  },
  {
    icon: Globe2,
    title: "tBook könyvtár",
    badge: "Felfedezés",
    description:
      "Listázd az eseménycsoportod a tBook directory-ban, hogy új közönség találjon rád organikusan.",
    bullets: ["listOnTBookSite kapcsoló", "Egyedi listing URL & kép", "Közelgő események szűrése"],
    href: "/admin/plugins/t-book/groups",
    cta: "Csoport beállítása",
    external: false,
  },
  {
    icon: Layers,
    title: "Admin-first üzem",
    badge: "Gyors indulás",
    description:
      "Kezeld eseményeket, hoteleket és foglalásokat az admin felületen — API integráció később is beköthető.",
    bullets: ["Varázsló az első csoporthoz", "Export XLSX / CSV", "Résztvevői mezők sablonnal"],
    href: "/admin/plugins/t-book/groups",
    cta: "Első csoport létrehozása",
    external: false,
  },
] as const

const PLANS = [
  {
    name: "Alap",
    tagline: "Egy eseménycsoport, teljes motor",
    price: "WSE előfizetésben",
    highlight: false,
    features: [
      "Korlátlan esemény & hotel",
      "Stripe fizetés & email",
      "Admin dashboard & export",
      "1× API kulcs / csoport",
    ],
    cta: "Beállítás indítása",
    href: "/admin/plugins/t-book/groups",
  },
  {
    name: "Integrált",
    tagline: "Egyedi foglalási oldal az API-val",
    price: "Egyedi ajánlat",
    highlight: true,
    features: [
      "Minden az Alap csomagból",
      "Landing UI tervezés & fejlesztés",
      "Webhook & analytics bekötés",
      "Prioritásos támogatás",
    ],
    cta: "Ajánlatkérés",
    href: "/admin/contact",
  },
  {
    name: "Enterprise",
    tagline: "Több márka, SLA, testreszabás",
    price: "Egyedi ajánlat",
    highlight: false,
    features: [
      "Több eseménycsoport & tenant",
      "Egyedi árazási szabályok",
      "Dedikált onboarding",
      "Számlázási workflow egyeztetés",
    ],
    cta: "Kapcsolatfelvétel",
    href: "/admin/contact",
  },
] as const

const STEPS = [
  { step: "01", title: "Csoport & API kulcs", body: "Hozz létre egy eseménycsoportot — a kulcs egyszer jelenik meg." },
  { step: "02", title: "Esemény & szállás", body: "Állítsd be a jegyárakat, hoteleket és résztvevői mezőket." },
  { step: "03", title: "Foglalás & fizetés", body: "A vendég quote-ot kap, Stripe-on fizet, te pedig exportálhatsz." },
] as const

function HeroGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl animate-pulse [animation-duration:4s]" />
      <div className="absolute top-32 -right-16 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl animate-pulse [animation-duration:6s]" />
      <div className="absolute bottom-0 -left-12 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl animate-pulse [animation-duration:5s]" />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{children}</p>
  )
}

export function TBookAdminLanding() {
  return (
    <div className="tbook-admin-landing -mx-1 flex flex-col gap-16 pb-4 animate-in fade-in duration-700 sm:-mx-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.08] via-card to-violet-500/[0.06] px-6 py-12 shadow-sm sm:px-10 sm:py-16">
        <HeroGlow />
        <div className="relative mx-auto max-w-3xl text-center">
          <div
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary",
              "animate-in fade-in slide-in-from-bottom-3 duration-700"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Esemény & szállás foglalási motor
          </div>

          <h1
            className={cn(
              "text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl",
              "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75 fill-mode-both"
            )}
          >
            <span className="bg-gradient-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
              tBook
            </span>
            <span className="mt-2 block text-2xl font-semibold text-foreground sm:text-3xl">
              Jegyek, szállás, fizetés — egy rendszerben
            </span>
          </h1>

          <p
            className={cn(
              "mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
              "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both"
            )}
          >
            A tBook a Webshop Engine foglalási pluginja: kezeld eseményeidet és szállásaidat az adminban,
            vagy kösd be saját landing oldaladat a biztonságos API-n keresztül. Stripe, számlázás és
            résztvevői adatok — készen a valós üzemre.
          </p>

          <div
            className={cn(
              "mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row",
              "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both"
            )}
          >
            <TBookPrimaryButton asChild className="h-11 px-6 text-base shadow-md shadow-primary/20">
              <Link href="/admin/plugins/t-book/groups">
                Első eseménycsoport
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </TBookPrimaryButton>
            <Button asChild variant="outline" className="h-11 px-6 text-base font-medium">
              <Link href="/admin/plugins/t-book/stats">
                <BarChart3 className="mr-2 size-4" />
                Statisztikák
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is tBook */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <SectionLabel>Mi az a tBook?</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Foglalási infrastruktúra, nem csak egy űrlap
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Eseménycsoportok API kulccsal, dinamikus árazás (jegy + szállás + extrák), résztvevői
            adatok eseményenként, és teljes foglalás-életciklus admin nézetben — fizetéstől exportig.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-card p-6 shadow-sm transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-md",
                "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both",
                STAGGER[i + 1]
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  feature.accent
                )}
              />
              <div className="relative flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl bg-muted/40 px-6 py-10 sm:px-10">
        <div className="mb-10 max-w-2xl space-y-2">
          <SectionLabel>Hogyan működik</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Három lépés az első foglalásig
          </h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((item, i) => (
            <li
              key={item.step}
              className={cn(
                "relative space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both",
                STAGGER[i + 2]
              )}
            >
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-6 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] bg-border md:block"
                />
              ) : null}
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Usage options */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <SectionLabel>Használati módok</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Válaszd ki, hogyan éred el a közönséged
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ugyanaz a motor három felületen: teljes API integráció, könyvtári megjelenés, vagy
            tisztán admin-alapú üzemeltetés.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {USAGE_MODES.map((mode, i) => (
            <article
              key={mode.title}
              className={cn(
                "flex flex-col rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md",
                "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
                STAGGER[i + 1]
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <mode.icon className="size-5" aria-hidden />
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {mode.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{mode.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{mode.description}</p>
              <ul className="mt-5 space-y-2">
                {mode.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {bullet}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full font-medium">
                <Link
                  href={mode.href}
                  {...(mode.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {mode.cta}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      {/* Social proof / capabilities strip */}
      <section
        aria-label="Fő képességek"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { icon: Ticket, label: "Dinamikus jegyár", value: "Per fő / foglalás" },
          { icon: Users, label: "Résztvevői mezők", value: "Eseményenként" },
          { icon: Building2, label: "Szállás modul", value: "Több hotel / csoport" },
          { icon: Zap, label: "Publikus API", value: "OpenAPI 3.1" },
        ].map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl bg-card p-4 text-center shadow-sm",
              "animate-in fade-in zoom-in-95 duration-500 fill-mode-both",
              STAGGER[i]
            )}
          >
            <item.icon className="mx-auto mb-2 size-5 text-primary" aria-hidden />
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Sales / pricing */}
      <section className="space-y-8">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <SectionLabel>Csomagok & együttműködés</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Indítsd el ma — skálázz, amikor kész vagy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Az alap motor az előfizetésed része. Egyedi landing oldalhoz és enterprise igényekhez
            személyre szabott ajánlatot készítünk.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                plan.highlight
                  ? "bg-gradient-to-b from-primary/10 via-card to-card shadow-md ring-1 ring-primary/20"
                  : "bg-card shadow-sm hover:shadow-md",
                "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
                STAGGER[i + 1]
              )}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                  Népszerű
                </span>
              ) : null}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{plan.price}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <TBookPrimaryButton
                asChild
                variant={plan.highlight ? "default" : "outline"}
                className={cn("mt-8 w-full", !plan.highlight && "bg-card")}
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </TBookPrimaryButton>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 px-6 py-12 text-center shadow-lg sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Készen állsz az első eseményre?
          </h2>
          <p className="text-primary-foreground/90 leading-relaxed">
            Hozd létre az eseménycsoportot, állítsd be a jegyeket — vagy kérj segítséget az
            integrációhoz. A csapatunk egy munkanapon belül válaszol.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 bg-primary-foreground px-6 font-semibold text-primary hover:bg-primary-foreground/90"
            >
              <Link href="/admin/plugins/t-book/groups">
                Beállítás most
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-primary-foreground/40 bg-transparent px-6 font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/admin/contact">
                <Mail className="mr-2 size-4" />
                Üzenet küldése
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
