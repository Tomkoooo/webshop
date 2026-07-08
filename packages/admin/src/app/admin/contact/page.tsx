import Link from "next/link"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { AlertTriangle, Calendar, Eye, Inbox, Mail, Settings, User } from "lucide-react"
import { getContactMessages } from "@wse/core/actions/admin-contact-messages"
import { Button } from "@wse/core/components/ui/button"
import { ContactEmailsService } from "@wse/core/services/contact-emails"
import { cn } from "@wse/core/lib/utils"

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Kapcsolati <span className="admin-headline-accent">Üzenetek</span>
          </h1>
          <p className="text-white/40 font-medium italic">
            Minden kapcsolatfelvételi űrlap beküldés itt megmarad, akkor is, ha az email küldés hibára fut.
          </p>
        </div>
        <Link href="/admin/cms/settings?section=contact">
          <Button className="h-12 rounded-none border border-white/15 bg-transparent px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5">
            <Settings className="h-4 w-4" />
            Címzettek beállítása
          </Button>
        </Link>
      </div>

      <form className="grid grid-cols-1 items-end gap-3 bg-white/5 border border-white/10 p-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={filters.q || ""}
          placeholder="Keresés: név, email, üzenet..."
          className="h-12 bg-black border border-white/10 px-4 text-sm text-white placeholder:text-neutral-600 rounded-none md:col-span-2"
        />
        <select
          name="status"
          defaultValue={filters.status || "all"}
          className="h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none uppercase"
        >
          <option value="all">Minden státusz</option>
          <option value="unread">Olvasatlan</option>
          <option value="read">Olvasott</option>
          <option value="replied">Megválaszolt</option>
          <option value="archived">Archivált</option>
        </select>
        <select
          name="recipientId"
          defaultValue={filters.recipientId || "all"}
          className="h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none uppercase"
        >
          <option value="all">Minden címzett</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          className="h-12 rounded-none bg-primary font-black uppercase tracking-widest text-[10px] text-white hover:bg-primary/80"
        >
          Szűrés
        </Button>
      </form>

      <div className="bg-white/5 border border-white/10 rounded-none overflow-hidden text-white shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Feladó / Dátum</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Üzenet</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Címzett</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Státusz</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Email értesítés</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-white/20 italic">
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Még nem érkezett kapcsolatfelvételi üzenet.
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message._id} className="group transition-all duration-300 hover:bg-white/5">
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 admin-icon-accent" />
                          <span className="font-bold uppercase tracking-tight text-white italic">{message.name}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                          {message.email}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 text-neutral-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {format(new Date(message.createdAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="line-clamp-2 max-w-md text-sm font-medium leading-relaxed text-neutral-300">
                        {message.message}
                      </p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
                        {message.replies.length} válasz
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">
                          {message.recipientLabel}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                          {message.recipientEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn("inline-block border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]", getStatusStyle(message.status))}>
                        {getStatusLabel(message.status)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn("inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]", getNotificationStyle(message.notificationStatus))}>
                        {message.notificationStatus === "failed" ? <AlertTriangle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        {getNotificationLabel(message.notificationStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Link href={`/admin/contact/${message._id}`}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none border border-transparent text-neutral-500 shadow-lg transition-all hover:border-white/30 hover:bg-white/10 hover:text-white" title="Megtekintés">
                          <Eye className="h-5 w-5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
