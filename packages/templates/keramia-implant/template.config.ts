import { createKeramiaLandingTemplate } from "@wse/template-keramia-shared/createKeramiaLandingTemplate"
import { implantDefault } from "@wse/template-keramia-shared/static-pages/shared/defaults/implant"

export const keramiaImplant = createKeramiaLandingTemplate({
  id: "keramia-implant",
  name: "Kerámia Dental — Implantáció",
  description:
    "Nyári fogpótlás és implantáció landing oldal kapcsolatfelvételi űrlappal (aldomain).",
  screenshot: "/template-previews/keramia-implant.svg",
  defaultContent: implantDefault,
})
