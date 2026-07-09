"use client"

import { useState, useTransition } from "react"
import { Save, CheckCircle2 } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { updateShopContent } from "@wse/core/actions/admin-cms"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"

interface CMSFormProps {
  children: React.ReactNode
  action: (formData: FormData) => Promise<any>
}

export function CMSForm({ children, action: submitAction }: CMSFormProps) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  async function action(formData: FormData) {
    startTransition(async () => {
      try {
        await submitAction(formData)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (error) {
        console.error("Save failed:", error)
        alert("A mentés sikertelen volt. Kérjük próbálja újra.")
      }
    })
  }

  return (
    <form action={action} className="space-y-12 relative">
      {children}
      
      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-6 z-50 flex justify-center lg:justify-end animate-in slide-in-from-bottom duration-500">
        <div className="container mx-auto flex items-center justify-between lg:justify-end gap-6 max-w-7xl">
          {showSuccess && (
            <div className="flex items-center gap-3 text-emerald-800 text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-left duration-300">
              <CheckCircle2 className="w-5 h-5" />
              SIKERES MENTÉS!
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="default" 
            disabled={isPending}
            className={cn(
              "h-16 px-10 min-w-[240px] text-base tracking-[0.2em] relative overflow-hidden group",
              isPending && "opacity-80"
            )}
          >
            {isPending ? (
              <>
                <LoadingSpinner size="sm" />
                MENTÉS FOLYAMATBAN...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                MÓDOSÍTÁSOK MENTÉSE
              </>
            )}
            
            {/* Progress Bar (Simulated) */}
            {isPending && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 animate-progress-loading w-full" />
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
