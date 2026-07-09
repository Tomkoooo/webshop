"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { useAdminTheme } from "@wse/core/components/admin/AdminThemeProvider"

export function AdminThemeToggle() {
  const { theme, toggleTheme, ready } = useAdminTheme()
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={toggleTheme}
      disabled={!ready}
      aria-label={isDark ? "Világos mód" : "Sötét mód"}
      title={isDark ? "Világos mód" : "Sötét mód"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
