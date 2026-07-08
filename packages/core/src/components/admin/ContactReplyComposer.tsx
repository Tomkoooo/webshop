"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import {
  sendContactReply,
  type ContactReplyFormState,
} from "@wse/core/actions/admin-contact-messages"
import { cn } from "@wse/core/lib/utils"
import type { ThemeTokens } from "@wse/core/services/theme"

type Props = {
  messageId: string
  defaultSubject: string
  themeColors?: Partial<ThemeTokens>
}

const initialState: ContactReplyFormState = { ok: false, message: "" }

export function ContactReplyComposer({ messageId, defaultSubject, themeColors }: Props) {
  const [bodyHtml, setBodyHtml] = React.useState("<p></p>")
  const formRef = React.useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = React.useActionState(
    sendContactReply.bind(null, messageId),
    initialState
  )

  React.useEffect(() => {
    if (!state.ok) return
    formRef.current?.reset()
    setBodyHtml("<p></p>")
  }, [state.ok])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          Válasz tárgya
        </label>
        <input
          name="subject"
          defaultValue={defaultSubject}
          className="h-12 w-full rounded-none border border-white/10 bg-black px-4 text-sm font-bold text-white outline-none focus:border-primary"
          placeholder="Re: Kapcsolatfelvétel"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          Válasz tartalma
        </label>
        <RichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          placeholder="Írja meg a választ..."
          themeColors={themeColors}
          variant="mail"
        />
        <input type="hidden" name="bodyHtml" value={bodyHtml} />
      </div>

      {state.message ? (
        <p
          className={cn(
            "text-xs font-black uppercase tracking-[0.15em]",
            state.ok ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-none bg-primary px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary/80 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {isPending ? "Küldés..." : "Válasz küldése"}
      </Button>
    </form>
  )
}
