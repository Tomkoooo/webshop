"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { BillingStep } from "@wse/core/components/checkout/BillingStep"
import { ShippingStep } from "@wse/core/components/checkout/ShippingStep"
import { useProfileAccountModel } from "@wse/core/components/profile/use-profile-account-model"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export type ProfilePageVariant = "page" | "embedded"

export function ProfilePageView({ variant = "page" }: { variant?: ProfilePageVariant }) {
  const {
    embedded,
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
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (embedded && status === "unauthenticated") {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="mb-3 font-medium text-foreground">Profil előnézet</p>
        <p className="mb-4">A valós űrlaphoz jelentkezz be ugyanabban a böngészőben.</p>
        <Button asChild variant="outline" className="rounded-none font-black uppercase tracking-widest">
          <Link href="/auth/login">Bejelentkezés</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-12 duration-500 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="mb-8 border-b border-border pb-4 text-xl font-black uppercase tracking-[0.2em] text-foreground">
          Címadatok
        </h2>

        <div className="space-y-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground">Számlázási Adatok</h3>
            <BillingStep
              appearance="light"
              data={formData.billing}
              onChange={(data) => setFormData((p) => ({ ...p, billing: data }))}
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground">Szállítási Adatok</h3>
            <ShippingStep
              appearance="light"
              data={formData.shipping}
              billingData={formData.billing}
              onChange={(data) => setFormData((p) => ({ ...p, shipping: data }))}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-14 w-full rounded-lg border border-primary-foreground/35 bg-primary px-10 font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 md:w-auto"
          >
            {saving ? "Mentés folyamatban..." : "Adatok Mentése"}
          </Button>

          {newsletterEnabled ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-5">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Hírlevél</h4>
              <p className="text-sm text-muted-foreground">Itt tudsz feliratkozni vagy leiratkozni a hírlevelekről.</p>
              <label className="inline-flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.newsletterSubscribed}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newsletterSubscribed: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-foreground">Feliratkozva a hírlevélre</span>
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 border-t border-border pt-12">
        <h2 className="text-xl font-black uppercase tracking-[0.2em] text-red-500">Veszélyes zóna</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="outline"
            className="h-12 rounded-lg border-border px-8 font-black uppercase tracking-widest text-xs text-foreground hover:bg-muted"
          >
            Kijelentkezés
          </Button>
          <Button
            onClick={handleDeleteAccount}
            className="h-12 rounded-lg border border-red-500/30 bg-red-500/10 px-8 font-black uppercase tracking-widest text-xs text-red-600 hover:bg-red-500/20"
          >
            Fiók Törlése
          </Button>
        </div>
      </div>
    </div>
  )
}
