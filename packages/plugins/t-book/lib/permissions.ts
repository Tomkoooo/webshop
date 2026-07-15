/** Fixed permission catalog for org-scoped RBAC. */
export const TBOOK_PERMISSIONS = [
  "org:read",
  "org:update",
  "member:read",
  "member:invite",
  "member:manage",
  "role:read",
  "role:manage",
  "group:read",
  "group:write",
  "group:apiKey",
  "event:read",
  "event:write",
  "hotel:read",
  "hotel:write",
  "booking:read",
  "booking:export",
  "booking:manage",
  "stats:read",
] as const

export type TBookPermission = (typeof TBOOK_PERMISSIONS)[number]

export const TBOOK_PERMISSION_LABELS: Record<TBookPermission, string> = {
  "org:read": "Szervezet megtekintése",
  "org:update": "Szervezet beállítások",
  "member:read": "Tagok megtekintése",
  "member:invite": "Tagok meghívása",
  "member:manage": "Tagok kezelése",
  "role:read": "Szerepkörök megtekintése",
  "role:manage": "Szerepkörök kezelése",
  "group:read": "Eseménycsoportok megtekintése",
  "group:write": "Eseménycsoportok szerkesztése",
  "group:apiKey": "API kulcs kezelése",
  "event:read": "Események megtekintése",
  "event:write": "Események szerkesztése",
  "hotel:read": "Szállások megtekintése",
  "hotel:write": "Szállások szerkesztése",
  "booking:read": "Foglalások megtekintése",
  "booking:export": "Foglalások exportálása",
  "booking:manage": "Foglalások kezelése",
  "stats:read": "Statisztikák megtekintése",
}

export const TBOOK_VIEWER_PERMISSIONS: TBookPermission[] = [
  "org:read",
  "member:read",
  "role:read",
  "group:read",
  "event:read",
  "hotel:read",
  "booking:read",
  "stats:read",
]

export const TBOOK_OWNER_PERMISSIONS: TBookPermission[] = [...TBOOK_PERMISSIONS]

export function isTBookPermission(value: string): value is TBookPermission {
  return (TBOOK_PERMISSIONS as readonly string[]).includes(value)
}

export function permissionGroups(): { label: string; permissions: TBookPermission[] }[] {
  return [
    { label: "Szervezet", permissions: ["org:read", "org:update"] },
    {
      label: "Tagok és szerepkörök",
      permissions: ["member:read", "member:invite", "member:manage", "role:read", "role:manage"],
    },
    {
      label: "Események",
      permissions: ["group:read", "group:write", "group:apiKey", "event:read", "event:write"],
    },
    { label: "Szállások", permissions: ["hotel:read", "hotel:write"] },
    {
      label: "Foglalások",
      permissions: ["booking:read", "booking:export", "booking:manage", "stats:read"],
    },
  ]
}
