import { redirect } from "next/navigation"

export default function AdminFooterRedirect() {
  redirect("/admin/cms/settings?section=footer")
}
