import Link from "next/link"
import type { ComponentType } from "react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
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
import { cn } from "@wse/core/lib/utils"
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/admin/contact" className="group mb-4 flex items-center gap-2 text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vissza az üzenetekhez</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Kapcsolat <span className="admin-headline-accent">Részletei</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/40 italic">
            <span className="text-lg font-bold uppercase tracking-tight admin-text-accent">{message.name}</span>
            <div className="hidden h-4 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(new Date(message.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
              </span>
            </div>
          </div>
        </div>

        <span className={cn("inline-block border px-5 py-3 text-xs font-black uppercase tracking-[0.25em]", getStatusStyle(message.status))}>
          {getStatusLabel(message.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="relative overflow-hidden rounded-none border border-white/10 bg-white/5 p-8">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 -rotate-45 bg-white/5 pointer-events-none" />
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase tracking-wider italic">
              <div className="h-6 w-1.5 rounded-full admin-section-marker" />
              Eredeti üzenet
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoTile icon={User} label="Feladó" value={message.name} helper={message.email} />
                <InfoTile icon={Mail} label="Címzett" value={message.recipientLabel} helper={message.recipientEmail} />
              </div>
              <div className="rounded-none border border-white/10 bg-black/40 p-6">
                <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-neutral-200">
                  {message.message}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-none border border-white/10 bg-white/5 p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase tracking-wider italic">
              <div className="h-6 w-1.5 rounded-full admin-section-marker" />
              Válasz írása
            </h2>
            <ContactReplyComposer
              messageId={message._id}
              defaultSubject={`Re: Kapcsolatfelvétel - ${message.name}`}
              themeColors={theme}
            />
          </section>

          <section className="rounded-none border border-white/10 bg-white/5 p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase tracking-wider italic">
              <div className="h-6 w-1.5 rounded-full admin-section-marker" />
              Válasz előzmények
            </h2>
            {replies.length === 0 ? (
              <p className="text-sm italic text-neutral-500">Ehhez az üzenethez még nincs mentett válasz.</p>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <article key={reply._id} className="rounded-none border border-white/10 bg-black/40 p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-heading text-lg font-black uppercase italic tracking-tight text-white">
                          {reply.subject}
                        </h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                          {format(new Date(reply.createdAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
                          {reply.adminName ? ` - ${reply.adminName}` : ""}
                        </p>
                      </div>
                      <span className={cn("inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]", getReplyStatusStyle(reply.status))}>
                        {reply.status === "failed" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {getReplyStatusLabel(reply.status)}
                      </span>
                    </div>
                    <div
                      className="prose prose-invert max-w-none text-sm prose-p:text-neutral-200 prose-a:text-primary"
                      // Admin-authored HTML from the local rich text editor.
                      dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                    />
                    {reply.error ? (
                      <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-none border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
                        {reply.error}
                      </pre>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-none border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 font-heading font-black uppercase tracking-wider italic text-white">
              <div className="h-5 w-1 admin-section-marker" />
              Kezelés
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <StatusButton id={message._id} status="unread" icon={Mail} label="Olvasatlannak jelölés" />
              <StatusButton id={message._id} status="read" icon={MailOpen} label="Olvasottnak jelölés" />
              <StatusButton id={message._id} status="archived" icon={Archive} label="Archiválás" />
            </div>
          </section>

          <section className="rounded-none border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 font-heading font-black uppercase tracking-wider italic text-white">
              <div className="h-5 w-1 admin-section-marker" />
              Email értesítés
            </h2>
            <span className={cn("inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]", getNotificationStyle(message.notificationStatus))}>
              {message.notificationStatus === "failed" ? <AlertTriangle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
              {getNotificationLabel(message.notificationStatus)}
            </span>
            {message.notificationSentAt ? (
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                {format(new Date(message.notificationSentAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
              </p>
            ) : null}
            {message.notificationError ? (
              <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-none border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
                {message.notificationError}
              </pre>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
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
    <div className="rounded-none border border-white/10 bg-black/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="font-bold uppercase tracking-tight text-white italic">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-neutral-600">{helper}</p>
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
      <Button className="h-11 w-full justify-start rounded-none border border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-300 hover:bg-white/5 hover:text-white">
        <Icon className="h-4 w-4" />
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

function getStatusStyle(status: string) {
  switch (status) {
    case "unread":
      return "border-amber-500 text-amber-400 bg-amber-500/10"
    case "replied":
      return "border-emerald-500 text-emerald-400 bg-emerald-500/10"
    case "archived":
      return "border-neutral-600 text-neutral-500 bg-white/5"
    default:
      return "border-blue-500/40 text-blue-300 bg-blue-500/10"
  }
}

function getNotificationLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Függőben",
    sent: "Elküldve",
    failed: "Hiba",
  }
  return labels[status] || status
}

function getNotificationStyle(status: string) {
  switch (status) {
    case "sent":
      return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
    case "failed":
      return "border-rose-500/40 text-rose-400 bg-rose-500/10"
    default:
      return "border-amber-500/40 text-amber-300 bg-amber-500/10"
  }
}

function getReplyStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Függőben",
    sent: "Elküldve",
    failed: "Hiba",
  }
  return labels[status] || status
}

function getReplyStatusStyle(status: string) {
  switch (status) {
    case "sent":
      return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
    case "failed":
      return "border-rose-500/40 text-rose-400 bg-rose-500/10"
    default:
      return "border-amber-500/40 text-amber-300 bg-amber-500/10"
  }
}
