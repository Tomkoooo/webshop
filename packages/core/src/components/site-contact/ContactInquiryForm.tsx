"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Send } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wse/core/components/ui/form"
import { Input } from "@wse/core/components/ui/input"
import { cn } from "@wse/core/lib/utils"
import type { SiteContactEntry } from "@wse/core/lib/site-contact"
import { submitContactForm } from "@wse/core/actions/contact-form"
import { CmsEditableButton } from "@wse/core/features/template-cms/primitives/CmsEditableButton"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
  recipientId: z.string().optional(),
})

export type ContactInquiryFormLabels = {
  nameLabel?: React.ReactNode
  emailLabel?: React.ReactNode
  messageLabel?: React.ReactNode
  sendButtonLabel?: string
  recipientLabel?: React.ReactNode
}

type Props = ContactInquiryFormLabels & {
  contactEmails: SiteContactEntry[]
  className?: string
  disabled?: boolean
  /** Visual CMS: editable send button label + theme hints */
  cmsSendButton?: {
    enabled: boolean
    onLabelCommit: (value: string) => void
  }
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-none border border-border bg-surface px-3 py-4 text-sm text-foreground outline-none focus:border-primary-foreground/50 placeholder:text-muted-foreground transition-colors",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export function ContactInquiryForm({
  contactEmails,
  disabled = false,
  className,
  nameLabel = "Full Name",
  emailLabel = "Email Address",
  messageLabel = "Message",
  sendButtonLabel = "SEND MESSAGE",
  recipientLabel = "Címzett",
  cmsSendButton,
}: Props) {
  const showRecipientPicker = contactEmails.length > 1

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      recipientId: contactEmails[0]?.id ?? "",
    },
  })

  React.useEffect(() => {
    if (contactEmails[0]?.id) {
      form.setValue("recipientId", contactEmails[0].id)
    }
  }, [contactEmails, form])

  const [submitState, setSubmitState] = React.useState<{ ok: boolean; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (disabled) return
    setIsSubmitting(true)
    setSubmitState(null)
    const formData = new FormData()
    formData.set("name", values.name)
    formData.set("email", values.email)
    formData.set("message", values.message)
    if (values.recipientId) formData.set("recipientId", values.recipientId)
    const result = await submitContactForm(undefined, formData)
    setSubmitState(result)
    setIsSubmitting(false)
    if (result.ok) form.reset({ recipientId: contactEmails[0]?.id ?? "" })
  }

  if (contactEmails.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        A kapcsolatfelvétel jelenleg nem elérhető.
      </p>
    )
  }

  const sendButtonClassName =
    "w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground h-16 px-12 text-xl border-none disabled:opacity-60 transition-colors duration-500"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-8", className)}>
        {showRecipientPicker ? (
          <FormField
            control={form.control}
            name="recipientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground uppercase tracking-[0.2em] text-xs font-black">
                  {recipientLabel}
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="h-14 w-full bg-surface border border-border px-3 text-sm text-foreground outline-none focus:border-primary-foreground/50"
                  >
                    {contactEmails.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label} ({entry.email})
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage className="text-primary-foreground text-xs" />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground uppercase tracking-[0.2em] text-xs font-black">
                {nameLabel}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Lorem Ipsum"
                  {...field}
                  className="h-14 bg-surface border-border rounded-none focus-visible:ring-primary-foreground/40 text-foreground placeholder:text-muted-foreground"
                />
              </FormControl>
              <FormMessage className="text-primary-foreground text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground uppercase tracking-[0.2em] text-xs font-black">
                {emailLabel}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  {...field}
                  className="h-14 bg-surface border-border rounded-none focus-visible:ring-primary-foreground/40 text-foreground placeholder:text-muted-foreground"
                />
              </FormControl>
              <FormMessage className="text-primary-foreground text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground uppercase tracking-[0.2em] text-xs font-black">
                {messageLabel}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Lorem ipsum dolor sit amet..."
                  {...field}
                  className="min-h-[160px] bg-surface border-border rounded-none focus-visible:ring-primary-foreground/40"
                />
              </FormControl>
              <FormMessage className="text-primary-foreground text-xs" />
            </FormItem>
          )}
        />
        {submitState ? (
          <p
            className={cn(
              "text-sm font-medium",
              submitState.ok ? "text-emerald-400" : "text-primary-foreground"
            )}
          >
            {submitState.message}
          </p>
        ) : null}
        <CmsEditableButton
          enabled={Boolean(cmsSendButton?.enabled)}
          label={isSubmitting ? "Küldés…" : sendButtonLabel}
          onLabelCommit={(value) => cmsSendButton?.onLabelCommit(value)}
          type="submit"
          disabled={disabled || isSubmitting}
          className={cn(sendButtonClassName, "inline-flex items-center justify-center font-semibold uppercase tracking-widest")}
          icon={<Send className="w-5 h-5 mr-3" />}
        />
      </form>
    </Form>
  )
}
