import type { ComponentType } from "react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Mail,
  MailOpen,
  User,
} from "lucide-react"
import {
  getContactMessage,
  updateContactMessageStatus,
} from "@wse/core/actions/admin-contact-messages"
import { ContactReplyComposer } from "@wse/core/components/admin/ContactReplyComposer"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"
import { ThemeService } from "@wse/core/services/theme"

export default async function AdminContactMessageDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [message, theme] = await Promise.all([
    getContactMessage(id),
    ThemeService.get(),
  ])

  if (!message) {
    notFound()
  }

  const replies = [...message.replies].reverse()

  return (
    <AdminPageScaffold
      backHref="/admin/contact"
      backLabel="Vissza az üzenetekhez"
      title="Kapcsolat részletei"
      description={
        <span className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground">{message.name}</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="inline-flex items-center gap-2">
            <Calendar className="size-4" />
            {format(new Date(message.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
          </span>
        </span>
      }
      actions={
        <AdminStatusBadge status={message.status} label={getStatusLabel(message.status)} />
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <AdminSection title="Eredeti üzenet">
            <Card className="shadow-sm">
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoTile icon={User} label="Feladó" value={message.name} helper={message.email} />
                  <InfoTile icon={Mail} label="Címzett" value={message.recipientLabel} helper={message.recipientEmail} />
                </div>
                <div className="rounded-lg bg-muted/40 p-6">
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.message}</p>
                </div>
              </CardContent>
            </Card>
          </AdminSection>

          <AdminSection title="Válasz írása">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <ContactReplyComposer
                  messageId={message._id}
                  defaultSubject={`Re: Kapcsolatfelvétel - ${message.name}`}
                  themeColors={theme}
                />
              </CardContent>
            </Card>
          </AdminSection>

          <AdminSection title="Válasz előzmények">
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ehhez az üzenethez még nincs mentett válasz.</p>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <Card key={reply._id} className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{reply.subject}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(reply.createdAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
                            {reply.adminName ? ` - ${reply.adminName}` : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2">
                          {reply.status === "failed" ? (
                            <AlertTriangle className="size-3" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          <AdminStatusBadge
                            status={reply.status}
                            label={getReplyStatusLabel(reply.status)}
                          />
                        </span>
                      </div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                      />
                      {reply.error ? (
                        <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-rose-500/10 p-3 text-xs text-rose-800">
                          {reply.error}
                        </pre>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AdminSection>
        </div>

        <aside className="space-y-6">
          <AdminSection title="Kezelés">
            <Card className="shadow-sm">
              <CardContent className="grid grid-cols-1 gap-3 pt-6">
                <StatusButton id={message._id} status="unread" icon={Mail} label="Olvasatlannak jelölés" />
                <StatusButton id={message._id} status="read" icon={MailOpen} label="Olvasottnak jelölés" />
                <StatusButton id={message._id} status="archived" icon={Archive} label="Archiválás" />
              </CardContent>
            </Card>
          </AdminSection>

          <AdminSection title="Email értesítés">
            <Card className="shadow-sm">
              <CardContent className="space-y-3 pt-6">
                <span className="inline-flex items-center gap-2">
                  {message.notificationStatus === "failed" ? (
                    <AlertTriangle className="size-3" />
                  ) : (
                    <Mail className="size-3" />
                  )}
                  <AdminStatusBadge
                    status={message.notificationStatus}
                    label={getNotificationLabel(message.notificationStatus)}
                  />
                </span>
                {message.notificationSentAt ? (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(message.notificationSentAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
                  </p>
                ) : null}
                {message.notificationError ? (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-rose-500/10 p-3 text-xs text-rose-800">
                    {message.notificationError}
                  </pre>
                ) : null}
              </CardContent>
            </Card>
          </AdminSection>
        </aside>
      </div>
    </AdminPageScaffold>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function StatusButton({
  id,
  status,
  icon: Icon,
  label,
}: {
  id: string
  status: "unread" | "read" | "archived"
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <form action={updateContactMessageStatus.bind(null, id, status)}>
      <Button variant="outline" className="w-full justify-start">
        <Icon className="size-4" />
        {label}
      </Button>
    </form>
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    unread: "Olvasatlan",
    read: "Olvasott",
    replied: "Megválaszolt",
    archived: "Archivált",
  }
  return labels[status] || status
}

function getNotificationLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Függőben",
    sent: "Elküldve",
    failed: "Hiba",
  }
  return labels[status] || status
}

function getReplyStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Függőben",
    sent: "Elküldve",
    failed: "Hiba",
  }
  return labels[status] || status
}
