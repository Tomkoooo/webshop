import { redirect } from "next/navigation"

/** Parcel locker flags live under Beállítások (/admin/info). */
export default function AdminShopParcelFlagsRedirect() {
  redirect("/admin/info")
}
