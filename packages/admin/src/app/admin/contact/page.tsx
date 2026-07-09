import Link from "next/link"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { AlertTriangle, Calendar, Eye, Mail, Settings, User } from "lucide-react"
import { getContactMessages } from "@wse/core/actions/admin-contact-messages"
import { Button } from "@wse/core/components/ui/button"
import { ContactEmailsService } from "@wse/core/services/contact-emails"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminFilterBar, AdminFilterInput, AdminFilterSelect } from "@wse/core/components/admin/AdminFilterBar"
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"

type AdminContactSearchParams = Promise<{
  q?: string
  status?: string
  recipientId?: string
}>

export default async function AdminContactInbox({
  searchParams,
}: {
  searchParams: AdminContactSearchParams
}) {
  const filters = await searchParams
  const [messages, recipients] = await Promise.all([
    getContactMessages(filters),
    ContactEmailsService.list(),
  ])

  return (
    <AdminPageScaffold
      title="Kapcsolati üzenetek"
      description="Minden kapcsolatfelvételi űrlap beküldés itt megmarad, akkor is, ha az email küldés hibára fut."
      actions={
        <Button variant="outline" asChild>
          <Link href="/admin/cms/settings?section=contact">
            <Settings className="size-4" />
            Címzettek beállítása
          </Link>
        </Button>
      }
    >
      <AdminFilterBar className="lg:grid-cols-5">
        <AdminFilterInput
          name="q"
          defaultValue={filters.q || ""}
          placeholder="Keresés: név, email, üzenet..."
          className="md:col-span-2"
        />
        <AdminFilterSelect name="status" defaultValue={filters.status || "all"}>
          <option value="all">Minden státusz</option>
          <option value="unread">Olvasatlan</option>
          <option value="read">Olvasott</option>
          <option value="replied">Megválaszolt</option>
          <option value="archived">Archivált</option>
        </AdminFilterSelect>
        <AdminFilterSelect name="recipientId" defaultValue={filters.recipientId || "all"}>
          <option value="all">Minden címzett</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.label}
            </option>
          ))}
        </AdminFilterSelect>
        <Button type="submit">Szűrés</Button>
      </AdminFilterBar>

      <AdminDataTable
        rows={messages}
        getRowKey={(message) => message._id}
        emptyMessage="Még nem érkezett kapcsolatfelvételi üzenet."
        className="min-w-[900px]"
        columns={[
          {
            id: "sender",
            header: "Feladó / Dátum",
            cell: (message) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-primary" />
                  <span className="font-medium text-foreground">{message.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{message.email}</span>
                <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3" />
                  <span className="text-xs">
                    {format(new Date(message.createdAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
                  </span>
                </div>
              </div>
            ),
          },
          {
            id: "message",
            header: "Üzenet",
            cell: (message) => (
              <>
                <p className="line-clamp-2 max-w-md text-sm leading-relaxed">{message.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{message.replies.length} válasz</p>
              </>
            ),
          },
          {
            id: "recipient",
            header: "Címzett",
            cell: (message) => (
              <div className="flex flex-col">
                <span className="text-xs text-foreground">{message.recipientLabel}</span>
                <span className="text-xs text-muted-foreground">{message.recipientEmail}</span>
              </div>
            ),
          },
          {
            id: "status",
            header: "Státusz",
            cell: (message) => (
              <AdminStatusBadge status={message.status} label={getStatusLabel(message.status)} />
            ),
          },
          {
            id: "notification",
            header: "Email értesítés",
            cell: (message) => (
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
            ),
          },
          {
            id: "actions",
            header: "Műveletek",
            headerClassName: "text-right",
            className: "text-right",
            cell: (message) => (
              <Link href={`/admin/contact/${message._id}`}>
                <Button variant="ghost" size="icon" title="Megtekintés">
                  <Eye className="size-5" />
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </AdminPageScaffold>
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
