import type { HomeContent } from "./schema"
import { ASSET, ES_ADDRESS, ES_EMAIL, ES_PHONE } from "../../lib/constants"

export const homeDefaultContent: HomeContent = {
  meta: {
    seoTitle: "Event Structure Agency | Experiential environments",
    seoDescription:
      "We design and deliver brand activations, immersive environments and interactive installations that make impact.",
  },
  blocks: [
    {
      id: "hero-es",
      type: "hero",
      enabled: true,
      data: {
        title: "EVENT STRUCTURE AGENCY.",
        description: "Creating impactful brand experiences\nand memorable environments.",
        primaryCtaLabel: "Let's Talk",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "Our Work",
        secondaryCtaHref: "/work",
        heroImage: ASSET.hero,
        heroImages: [],
        imageDurationSeconds: 5,
        heroDurationSeconds: 6,
        heroSlides: [],
        badges: ["Event Structure Hungary"],
      },
    },
    {
      id: "sectors-es",
      type: "features",
      enabled: true,
      data: {
        title: "Sectors",
        subtitle: "Sports & Major Games | Festivals & Concerts | Exhibitions & Corporate | Film & TV | Art & Theatre",
        cards: [
          { title: "Sports & Major Games", description: "Grandstands, stages and race-day infrastructure.", icon: ASSET.sports },
          { title: "Festivals & Concerts", description: "VIP platforms, covers and live production.", icon: ASSET.festivals },
          { title: "Exhibitions & Corporate", description: "Brand environments people walk into.", icon: ASSET.exhibitions },
          { title: "Film & TV", description: "Temporary worlds built for camera.", icon: ASSET.film },
          { title: "Art & Theatre", description: "Installations that hold an audience.", icon: ASSET.art },
        ],
      },
    },
    {
      id: "about-es",
      type: "about",
      enabled: true,
      data: {
        title: "Transforming spaces into experiences with temporary structures that go beyond utility.",
        paragraph:
          "We're an experiential event marketing agency that designs and delivers brand activations, immersive environments and interactive installations that make impact.",
        image: ASSET.portrait,
        boxHeading: "Csomor Tamás, COO, Partner",
        ctaLabel: "Let's make impact together.",
        ctaHref: "#contact",
        bannerText: "focus on what really matters",
        bannerHref: "#reasons",
        accordions: [
          {
            title: "We start with why, not what.",
            content:
              "Before we touch a build or brief a designer, we get under the skin of your brand, your audience and what you actually need the experience to do. Strategy isn't just a phase. It's the whole point.",
          },
          {
            title: "We make people want to participate.",
            content:
              "We use whatever it takes to turn passive observers into active participants. Not because it's technically impressive (although it usually is). But because it's proven to work.",
          },
          {
            title: "We create works, that works",
            content:
              "There's a difference between a branded space and an immersive environment that drops people inside your brand story. Because people forget what they saw. But they never forget what they did and how it made them feel.",
          },
          {
            title: "We're there on the day. And the day after.",
            content:
              "Strategy, creative, fabrication, build, installation, rigging (and de-rigging). We've found our clients enjoy working with one team all the way through — because great ideas get lost in handoffs. And we love doing it all anyway.",
          },
        ],
        cards: [
          {
            title: "Experiential activations people feel, not just see.",
            description: "Four reasons we're the difference between an activation and an experience people remember.",
          },
        ],
      },
    },
    {
      id: "work-es",
      type: "gallery",
      enabled: true,
      data: {
        title: "Work",
        items: [
          { image: ASSET.exhibitions, caption: "Bolt activation" },
          { image: ASSET.festivals, caption: "MOL VIP · Strand" },
          { image: ASSET.sports, caption: "IRONMAN 70.3 Budapest" },
          { image: ASSET.film, caption: "Live stage" },
          { image: ASSET.booth, caption: "Exhibition system" },
          { image: ASSET.stage, caption: "Festival architecture" },
          { image: ASSET.work[0], caption: "Custom structure" },
          { image: ASSET.work[2], caption: "Grandstand" },
          { image: ASSET.work[4], caption: "Covered stage" },
          { image: ASSET.work[7], caption: "Night production" },
        ],
      },
    },
    {
      id: "services-es",
      type: "features",
      enabled: true,
      data: {
        title: "What We Actually Have/Do?",
        subtitle:
          "Our comprehensive services encompass expertly crafted stages tailored to any event, engineered structures offering durability and flexibility, and bespoke designs meeting exact client specifications, ensuring unforgettable experiences and seamless executions from concept to completion. We build it. We install it. We even run it on the day for you. No handoffs, no excuses.",
        cards: [
          { title: "Stages | Covers", description: "Expertly crafted stages tailored to any event.", icon: ASSET.stage },
          { title: "Grandstands", description: "Engineered viewing platforms with durability and flexibility.", icon: ASSET.work[0] },
          { title: "Structures", description: "Temporary architecture that goes beyond utility.", icon: ASSET.work[1] },
          { title: "Mobile Showroom", description: "Mobile trailer | Showtrailer — brand on the road.", icon: ASSET.work[2] },
          { title: "Customized Containers", description: "Container bar and branded box builds.", icon: ASSET.work[3] },
          { title: "Emeléstechnika", description: "Rigging, lifts and technical height.", icon: ASSET.work[4] },
          { title: "Mobil falrendszerek | SYMA", description: "Modular walls and exhibition systems.", icon: ASSET.syma },
          { title: "Rendezvénybútor és kiegészítők", description: "Furniture and event dressing.", icon: ASSET.work[5] },
          { title: "Kerítés | Kordon", description: "Crowd control done invisibly well.", icon: ASSET.work[6] },
          { title: "Áram/Víz hálózati rendszerek", description: "Power and water for live sites.", icon: ASSET.work[7] },
          { title: "Production, Fabrication & Technical Delivery", description: "From concept to completion.", icon: ASSET.stage },
          { title: "Projectmanagement", description: "One point of contact. Regular progress. Clear milestones.", icon: ASSET.radios },
        ],
      },
    },
    {
      id: "why-es",
      type: "features",
      enabled: true,
      data: {
        title: "Why We?",
        subtitle: "No project is too small. From a 10 m² stage to full event delivery, every project gets the same focus.",
        cards: [
          {
            title: "Tailored",
            description:
              "We manage every aspect of live events from initial planning to final delivery and beyond. We can also provide specific skills, services or production requirements as required.",
            icon: "",
          },
          {
            title: "Accountable",
            description:
              "Acting as an extension of your team, we assign a single point of contact to execute your requirements. Our account manager will also provide regular progress reports throughout the work.",
            icon: "",
          },
          {
            title: "Transparent",
            description:
              "We will define a clear project plan with milestone deliverables such as designs and samples. This ensures you are continually happy with the proposed execution of your event.",
            icon: "",
          },
          {
            title: "Supportive",
            description:
              "We are here to help with live events in any way we can. We will be attentive to your requests, and our team will be onsite throughout the event to ensure a smooth delivery.",
            icon: "",
          },
          {
            title: "Flexible",
            description:
              "We have an excellent reputation for speed and flexibility, and will accommodate your changing needs as much as possible. We will make you aware of any impacts on cost or timescale.",
            icon: "",
          },
        ],
      },
    },
    {
      id: "contact-es",
      type: "contact",
      enabled: true,
      data: {
        title: "Let's Talk",
        description:
          "We are event strategists, experience architects, structure builders, custom designers, doers and fixers. Whatever your experience needs. Let's make impact together.",
        companyName: "EVENTSTRUCTURE HUNGARY",
        address: ES_ADDRESS,
        phone: ES_PHONE,
        email: ES_EMAIL,
        sendButtonLabel: "Send",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Message",
        warehouseTitle: "Studio",
        warehouseBody: ES_ADDRESS,
        officeTaxId: "Instagram | LinkedIn",
        officeManagerLine: "Csomor Tamás, COO, Partner",
        venueShort: "BOK Rendezvényközpont",
        mapEmbedUrl: "",
      },
    },
  ],
}
