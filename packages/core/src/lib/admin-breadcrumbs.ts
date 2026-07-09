const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  orders: "Rendelések",
  products: "Termékek",
  categories: "Kategóriák",
  cms: "CMS",
  settings: "Beállítások",
  templates: "Sablonok",
  users: "Felhasználók",
  contact: "Kapcsolat",
  stats: "Statisztikák",
  reviews: "Vélemények",
  info: "Beállítások",
  emails: "Emailek",
  newsletters: "Hírlevelek",
  payment: "Fizetés",
  coupons: "Kuponok",
  shipping: "Szállítás",
  plugins: "Pluginok",
  sugo: "Súgó",
  shop: "Webshop",
  new: "Új",
}

export function translateAdminBreadcrumbSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (/^\[.+\]$/.test(segment)) return "Részletek"
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}
