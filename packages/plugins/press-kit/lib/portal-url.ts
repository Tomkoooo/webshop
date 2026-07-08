import type { PressKitAccessMode } from "../models/PressKitSettings"

export function buildPressPortalUrl(params: {
  origin: string
  routePrefix?: string
  accessMode: PressKitAccessMode
  accessToken?: string
}): string {
  const prefix = (params.routePrefix || "sajto").replace(/^\/+|\/+$/g, "")
  const base = `${params.origin.replace(/\/$/, "")}/${prefix}`
  if (params.accessMode === "unique_link" && params.accessToken) {
    return `${base}/${params.accessToken}`
  }
  return base
}

export function buildAccessInstructions(accessMode: PressKitAccessMode): string {
  switch (accessMode) {
    case "unique_link":
      return "A fenti személyes linken éred el a sajtóanyagokat. Ha külön jelszót kaptál, az első belépéskor kérjük."
    case "password_per_contact":
      return "A fenti linken add meg az e-mail címedet és a személyes jelszavadat."
    case "shared_password":
      return "A fenti linken add meg az e-mail címedet és a közös sajtó jelszót."
    default:
      return ""
  }
}
