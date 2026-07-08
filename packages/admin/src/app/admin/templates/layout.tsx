import { AdminTemplateSessionBarSection } from "@wse/core/components/admin/AdminTemplateSessionBarSection"

export default async function AdminTemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminTemplateSessionBarSection />
      {children}
    </>
  )
}
