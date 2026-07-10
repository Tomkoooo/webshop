import type { Metadata } from "next"
import { TBookServiceLanding } from "@wse/plugin-t-book/storefront/TBookServiceLanding"

export const metadata: Metadata = {
  title: "tBook — esemény & szállás foglalási motor",
  description:
    "Jegyek, szállás, Stripe fizetés és API integráció egy rendszerben. A Webshop Engine foglalási szolgáltatása.",
}

export default function TBookPublicHomePage() {
  return <TBookServiceLanding />
}
