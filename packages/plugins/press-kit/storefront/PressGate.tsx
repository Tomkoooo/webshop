"use client"

import { useState } from "react"
import { pressPortalApi } from "./press-api-client"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@wse/core/components/ui/card"
import { trackPressEvent } from "@wse/core/lib/analytics/track"
import { getPluginStorefrontSurface } from "@wse/core/lib/plugin-storefront-ui"

type Props = {
  accessMode: string
  tokenFromUrl?: string
  portalTitle: string
  templateId: string
  onSuccess: () => void
}

export function PressGate({
  accessMode,
  tokenFromUrl,
  portalTitle,
  templateId,
  onSuccess,
}: Props) {
  const surface = getPluginStorefrontSurface(templateId)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, string> = {}
      if (accessMode === "unique_link" && tokenFromUrl) {
        body.token = tokenFromUrl
        if (password.trim()) body.password = password
      } else {
        body.email = email.trim()
        body.password = password
      }
      const res = await pressPortalApi.auth(body)
      trackPressEvent("press_portal_login", {
        press_contact_id: res.contact.id,
        press_outlet: res.contact.outlet,
        press_name: res.contact.name,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Belépés sikertelen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className={surface.gateTitle}>{portalTitle}</CardTitle>
        <CardDescription>
          Ez az oldal sajtóknak szóló anyagokat tartalmaz. Kérjük, add meg a belépési adataidat.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {accessMode !== "unique_link" ? (
            <div className="space-y-2 text-left">
              <Label htmlFor="press-email">E-mail cím</Label>
              <Input
                id="press-email"
                type="email"
                placeholder="sajto@media.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          ) : null}
          {(accessMode === "shared_password" ||
            accessMode === "password_per_contact" ||
            accessMode === "unique_link") && (
            <div className="space-y-2 text-left">
              <Label htmlFor="press-password">
                {accessMode === "unique_link" ? "Jelszó (ha kaptál)" : "Jelszó"}
              </Label>
              <Input
                id="press-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={accessMode !== "unique_link"}
                autoComplete="current-password"
              />
            </div>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            variant={templateId === "default-modern" ? "krausz" : "default"}
            className={surface.gateButton}
            disabled={loading}
          >
            {loading ? "Belépés…" : "Belépés"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            A portál használatát mérjük a sajtószolgálat javítása érdekében.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
