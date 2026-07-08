"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { CampSuccessContent } from "@wse/template-minecraft-camp/pages/camp/schemas"
import { campSuccessDefaultContent } from "@wse/template-minecraft-camp/pages/camp/defaultContent"

export function CampSuccessPageClient({
  copy = campSuccessDefaultContent,
}: {
  copy?: CampSuccessContent
}) {
  const searchParams = useSearchParams()
  const holdId = searchParams.get("holdId")
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [registrationId, setRegistrationId] = useState<string | null>(null)

  useEffect(() => {
    if (!holdId) {
      setStatus("error")
      return
    }
    const poll = async () => {
      const q = new URLSearchParams({ holdId })
      if (sessionId) q.set("session_id", sessionId)
      const res = await fetch(`/api/plugins/camp-booking/checkout/status?${q}`)
      const data = await res.json()
      if (data.status === "finalized" && data.registrationId) {
        setRegistrationId(data.registrationId)
        setStatus("ok")
        return true
      }
      if (data.lastError) {
        setStatus("error")
        return true
      }
      return false
    }
    let attempts = 0
    const id = setInterval(async () => {
      attempts++
      const done = await poll()
      if (done || attempts > 30) {
        clearInterval(id)
        if (!done && attempts > 30) setStatus("error")
      }
    }, 1500)
    void poll()
    return () => clearInterval(id)
  }, [holdId, sessionId])

  const successBody = copy.successBody.replace(
    "{registrationId}",
    registrationId ?? "—"
  )

  return (
    <div className="minecraft-panel max-w-lg mx-auto p-8 text-center">
      {status === "loading" && (
        <p className="font-minecraft-body">{copy.loadingText}</p>
      )}
      {status === "ok" && (
        <>
          <h1 className="font-minecraft text-lg text-[#2d5016] mb-4">{copy.successTitle}</h1>
          <p className="font-minecraft-body text-sm mb-6">{successBody}</p>
          <Link href="/" className="minecraft-btn inline-block">
            {copy.successCta}
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="font-minecraft-body text-red-800 mb-4">{copy.errorBody}</p>
          <Link href="/" className="minecraft-btn inline-block">
            {copy.errorCta}
          </Link>
        </>
      )}
    </div>
  )
}
