"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"

const defaultForm = () => ({
  billing: {
    type: "personal" as "personal" | "company",
    name: "",
    taxNumber: "",
    country: "",
    countryCode: "HU",
    zip: "",
    city: "",
    street: "",
    email: "",
    phone: "",
  },
  shipping: {
    isSameAsBilling: true,
    name: "",
    country: "",
    countryCode: "HU",
    zip: "",
    city: "",
    street: "",
    comment: "",
    email: "",
    phone: "",
  },
  newsletterSubscribed: false,
})

export type ProfileAccountFormState = ReturnType<typeof defaultForm>

/**
 * Profile index page: load/save `/api/user/profile`, newsletter flag, sign-out / delete account.
 * Templates use this from a custom `RouteMain` for full UI control.
 */
export function useProfileAccountModel(options: { variant?: "page" | "embedded" } = {}) {
  const { variant = "page" } = options
  const embedded = variant === "embedded"
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [newsletterEnabled, setNewsletterEnabled] = React.useState(false)
  const [formData, setFormData] = React.useState(defaultForm)

  React.useEffect(() => {
    const loadNewsletterFeature = async () => {
      try {
        const response = await fetch("/api/feature-flags/newsletter")
        if (!response.ok) return
        const data = await response.json()
        setNewsletterEnabled(Boolean(data.enabled))
      } catch {
        setNewsletterEnabled(false)
      }
    }
    void loadNewsletterFeature()
  }, [])

  React.useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        billing: {
          ...prev.billing,
          name: session.user.name || prev.billing.name,
        },
        shipping: {
          ...prev.shipping,
          name: session.user.name || prev.shipping.name,
        },
      }))
    }
  }, [session])

  React.useEffect(() => {
    if (status === "unauthenticated") {
      if (embedded) {
        setLoading(false)
        return
      }
      router.push(
        `/auth/login?${new URLSearchParams({ callbackUrl: "/profile" }).toString()}`
      )
      return
    }

    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setFormData({
              billing: data.billingInfo || {
                type: "personal",
                name: "",
                taxNumber: "",
                zip: "",
                city: "",
                street: "",
              },
              shipping: data.shippingAddress || {
                isSameAsBilling: true,
                name: "",
                zip: "",
                city: "",
                street: "",
                comment: "",
              },
              newsletterSubscribed: Boolean(data.newsletterSubscribed),
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [status, router, embedded])

  const handleSave = React.useCallback(async () => {
    setSaving(true)
    try {
      const payload: {
        billingInfo: typeof formData.billing
        shippingAddress: typeof formData.shipping
        newsletterSubscribed?: boolean
      } = {
        billingInfo: formData.billing,
        shippingAddress: formData.shipping,
      }
      if (newsletterEnabled) {
        payload.newsletterSubscribed = formData.newsletterSubscribed
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Adatok sikeresen mentve!")
      } else {
        toast.error("Hiba történt a mentés során")
      }
    } catch {
      toast.error("Hálózati hiba történt")
    } finally {
      setSaving(false)
    }
  }, [formData, newsletterEnabled])

  const handleDeleteAccount = React.useCallback(async () => {
    if (!confirm("Biztosan törölni szeretnéd a fiókod? Ez a művelet visszavonhatatlan!")) return

    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Hiba történt a törlés során")
      } else {
        toast.success("Fiók sikeresen törölve!")
        signOut({ callbackUrl: "/" })
      }
    } catch {
      toast.error("Hálózati hiba történt")
    }
  }, [])

  return {
    embedded,
    status,
    session,
    loading,
    saving,
    newsletterEnabled,
    formData,
    setFormData,
    handleSave,
    handleDeleteAccount,
    signOut,
  }
}
