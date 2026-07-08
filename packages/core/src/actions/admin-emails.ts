"use server"

import { revalidatePath } from "next/cache"
import { EmailTemplateService } from "@wse/core/services/email-template"
import { buildAllEmailTemplateSeeds } from "@wse/core/lib/email-template-catalog"
import { requireAdmin } from "@wse/core/lib/admin-auth"

export async function updateEmailTemplate(type: string, formData: FormData) {
  await requireAdmin()

  const subject = formData.get("subject") as string
  const body = formData.get("body") as string

  if (!subject || !body) {
    throw new Error("Tárgy és tartalom megadása kötelező")
  }

  await EmailTemplateService.update(type, { subject, body })

  revalidatePath("/admin/emails")
  revalidatePath(`/admin/emails/${type}`)
}

export async function seedEmailTemplates() {
  await requireAdmin()

  const baseTemplates = await buildAllEmailTemplateSeeds()

  for (const template of baseTemplates) {
    await EmailTemplateService.update(template.type, template)
  }

  revalidatePath("/admin/emails")
}

export async function initializeMissingEmailTemplates() {
  await requireAdmin()

  const baseTemplates = await buildAllEmailTemplateSeeds()

  for (const template of baseTemplates) {
    await EmailTemplateService.createMissing(template.type, template)
  }

  revalidatePath("/admin/emails")
}
