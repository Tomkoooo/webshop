"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:rounded-none",
          description: "group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-none group-[.toast]:font-black uppercase tracking-widest",
          cancelButton:
            "group-[.toast]:bg-white/5 group-[.toast]:text-neutral-400 group-[.toast]:rounded-none",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:text-red-500 group-[.toaster]:bg-red-500/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
