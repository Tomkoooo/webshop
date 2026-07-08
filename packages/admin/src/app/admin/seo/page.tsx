import { redirect } from "next/navigation"

export default function AdminSeoRedirect() {
  redirect("/admin/cms/settings?section=seo")
}
