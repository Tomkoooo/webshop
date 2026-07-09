"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  applyAdminThemeToDocument,
  DEFAULT_ADMIN_THEME,
  readStoredAdminTheme,
  writeStoredAdminTheme,
  type AdminTheme,
} from "@wse/core/lib/admin-theme"

type AdminThemeContextValue = {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
  ready: boolean
}

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: DEFAULT_ADMIN_THEME,
  setTheme: () => undefined,
  toggleTheme: () => undefined,
  ready: false,
})

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(DEFAULT_ADMIN_THEME)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const stored = readStoredAdminTheme()
    setThemeState(stored)
    applyAdminThemeToDocument(stored)
    setReady(true)
  }, [])

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next)
    writeStoredAdminTheme(next)
    applyAdminThemeToDocument(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark"
      writeStoredAdminTheme(next)
      applyAdminThemeToDocument(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ready }),
    [ready, setTheme, theme, toggleTheme]
  )

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
}

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}
