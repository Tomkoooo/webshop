import { EmailTemplateService } from "@wse/core/services/email-template"
import { EmailTemplateEditor } from "@wse/core/components/admin/EmailTemplateEditor"
import { notFound } from "next/navigation"
import { ThemeService } from "@wse/core/services/theme"

export default async function AdminEmailEdit({ params }: { params: { type: string } }) {
  const { type } = await params
  const [template, theme] = await Promise.all([
    EmailTemplateService.getByType(type),
    ThemeService.get(),
  ])

  if (!template) {
    notFound()
  }

  return <EmailTemplateEditor template={JSON.parse(JSON.stringify(template))} themeColors={theme} />
}
