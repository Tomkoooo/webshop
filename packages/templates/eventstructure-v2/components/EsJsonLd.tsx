import {
  ES_BRAND,
  ES_EMAIL,
  ES_INSTAGRAM,
  ES_LINKEDIN,
  ES_PHONE,
  ES_TAGLINE,
} from "../lib/constants"

/** Organization + local business graph for crawlers. */
export function EsJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": "https://eventstructure.hu/#organization",
        name: ES_BRAND,
        alternateName: "EVENTSTRUCTURE",
        description: ES_TAGLINE,
        url: "https://eventstructure.hu",
        email: ES_EMAIL,
        telephone: ES_PHONE,
        image: "https://eventstructure.hu/templates/eventstructure-v2/logo.png",
        logo: "https://eventstructure.hu/templates/eventstructure-v2/logo.png",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Dózsa Gy. u. 1. BOK Rendezvényközpont",
          addressLocality: "Budapest",
          postalCode: "1025",
          addressCountry: "HU",
        },
        sameAs: [ES_INSTAGRAM, ES_LINKEDIN],
        areaServed: "HU",
      },
      {
        "@type": "WebSite",
        "@id": "https://eventstructure.hu/#website",
        url: "https://eventstructure.hu",
        name: ES_BRAND,
        inLanguage: "en",
        publisher: { "@id": "https://eventstructure.hu/#organization" },
      },
      {
        "@type": "WebPage",
        "@id": "https://eventstructure.hu/#webpage",
        url: "https://eventstructure.hu",
        name: "Event Structure Agency | Experiential environments",
        isPartOf: { "@id": "https://eventstructure.hu/#website" },
        about: { "@id": "https://eventstructure.hu/#organization" },
        inLanguage: "en",
      },
    ],
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
