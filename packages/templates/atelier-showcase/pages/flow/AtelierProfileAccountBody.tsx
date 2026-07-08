"use client"

import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@wse/core/components/ui/accordion"
import { BillingStep } from "@wse/core/components/checkout/BillingStep"
import { ShippingStep } from "@wse/core/components/checkout/ShippingStep"
import { useProfileAccountModel } from "@wse/core/components/profile/use-profile-account-model"
import type { FlowRouteMainProps } from "@wse/sdk/templates/types"

/** Profile index: same model as `ProfilePageView`, **accordion** sections instead of one long form stack. */
export function AtelierProfileAccountBody({ shopEnabled, variant = "page" }: FlowRouteMainProps) {
  void shopEnabled
  const {
    status,
    loading,
    saving,
    newsletterEnabled,
    formData,
    setFormData,
    handleSave,
    handleDeleteAccount,
    signOut,
  } = useProfileAccountModel({ variant })

  if (loading) {
    return (
      <div className="flex justify-center py-16 font-serif text-muted-foreground">Betöltés…</div>
    )
  }

  if (variant === "embedded" && status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-8 text-center font-serif text-sm">
        <p className="mb-3 font-medium text-foreground">Profil előnézet</p>
        <Button asChild variant="outline" className="rounded-full font-serif">
          <Link href="/auth/login">Bejelentkezés</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-serif">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Számlázás és szállítás</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Címek és adatok</h2>
      </div>

      <Accordion type="multiple" defaultValue={["billing", "shipping"]} className="w-full border-t border-border">
        <AccordionItem value="billing" className="border-b border-border">
          <AccordionTrigger className="py-5 font-serif text-base hover:no-underline">Számlázás</AccordionTrigger>
          <AccordionContent className="pb-6">
            <BillingStep
              appearance="light"
              data={formData.billing}
              onChange={(data) => setFormData((p) => ({ ...p, billing: data }))}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping" className="border-b border-border">
          <AccordionTrigger className="py-5 font-serif text-base hover:no-underline">Szállítás</AccordionTrigger>
          <AccordionContent className="pb-6">
            <ShippingStep
              appearance="light"
              data={formData.shipping}
              billingData={formData.billing}
              onChange={(data) => setFormData((p) => ({ ...p, shipping: data }))}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-full border-0 bg-primary px-10 font-serif text-primary-foreground"
      >
        {saving ? "Mentés…" : "Mentés"}
      </Button>

      {newsletterEnabled ? (
        <label className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm">
          <input
            type="checkbox"
            checked={formData.newsletterSubscribed}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, newsletterSubscribed: e.target.checked }))
            }
            className="h-4 w-4 accent-primary"
          />
          Hírlevél
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Button type="button" variant="outline" className="rounded-full font-serif" onClick={() => signOut({ callbackUrl: "/" })}>
          Kijelentkezés
        </Button>
        <Button type="button" variant="destructive" className="rounded-full font-serif" onClick={handleDeleteAccount}>
          Fiók törlése
        </Button>
      </div>
    </div>
  )
}
