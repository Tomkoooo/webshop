import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import { TBookServiceLanding } from "@wse/plugin-t-book/storefront/TBookServiceLanding"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--tl-font-sans-family",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--tl-font-display-family",
  display: "swap",
})

export const metadata: Metadata = {
  title: "tBook — esemény- és jegyfoglalási infrastruktúra",
  description:
    "Headless foglalási motor szervezeteknek: jegyek, szállás, Stripe fizetés és API integráció a saját oldaladon.",
  openGraph: {
    title: "tBook — foglalási infrastruktúra",
    description:
      "Értékesíts jegyeket és szolgáltatásokat a saját weboldaladon — API-val vagy hostolt foglalási felülettel.",
    type: "website",
  },
}

export default function TBookPublicHomePage() {
  return (
    <div className={`${inter.variable} ${instrumentSerif.variable}`}>
      <TBookServiceLanding />
    </div>
  )
}
