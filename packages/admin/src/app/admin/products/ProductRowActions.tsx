"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Edit2, ExternalLink, RotateCcw, Trash2 } from "lucide-react"
import { deleteProduct, restoreProduct } from "@wse/core/actions/admin-products"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wse/core/components/ui/dialog"

type ProductRowActionsProps = {
  productId: string
  productName: string
  productSlug: string
  isDeleted?: boolean
}

export function ProductRowActions({
  productId,
  productName,
  productSlug,
  isDeleted = false,
}: ProductRowActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isRestoring, startRestoreTransition] = useTransition()
  const deleteConfirmed = confirmation.trim() === productName.trim()

  const resetDeleteDialog = () => {
    setConfirmation("")
    setError(null)
  }

  const handleDelete = () => {
    if (!deleteConfirmed || isDeleting) return
    setError(null)
    startDeleteTransition(async () => {
      try {
        await deleteProduct(productId, confirmation)
        setDeleteOpen(false)
        resetDeleteDialog()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "A törlés sikertelen.")
      }
    })
  }

  const handleRestore = () => {
    if (isRestoring) return
    setError(null)
    startRestoreTransition(async () => {
      try {
        await restoreProduct(productId)
        setRestoreOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "A visszaállítás sikertelen.")
      }
    })
  }

  if (isDeleted) {
    return (
      <div className="flex justify-end gap-3">
        <Dialog
          open={restoreOpen}
          onOpenChange={(open) => {
            setRestoreOpen(open)
            if (!open) setError(null)
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-none border border-transparent text-neutral-500 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
              title="Visszaállítás"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Termék visszaállítása</DialogTitle>
              <DialogDescription>
                A termék visszakerül az admin listába, de inaktív és rejtett marad, amíg újra nem publikálod.
              </DialogDescription>
            </DialogHeader>
            <p className="border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white">
              {productName}
            </p>
            {error ? <p className="text-sm font-bold text-rose-400">{error}</p> : null}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestoreOpen(false)}
                disabled={isRestoring}
                className="rounded-none border-white/10 text-white hover:bg-white/5"
              >
                Mégse
              </Button>
              <Button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="rounded-none bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isRestoring ? "Visszaállítás..." : "Biztonságos visszaállítás"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex justify-end gap-3">
      <Link href={`/products/${productSlug}`} target="_blank">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-none border border-transparent text-neutral-500 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
          title="Megtekintés"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </Link>
      <Link href={`/admin/products/${productId}`}>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-none border border-transparent text-neutral-500 transition-all hover:border-white/10 hover:bg-white/10 hover:text-white"
          title="Szerkesztés"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </Link>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) resetDeleteDialog()
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none border border-transparent text-neutral-500 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
            title="Törlés"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Termék törlése</DialogTitle>
            <DialogDescription>
              Ez elrejti és inaktívvá teszi a terméket. Később a törölt termékek nézetből visszaállítható.
              Biztonsági okból írd be pontosan a termék nevét:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white">
              {productName}
            </p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Terméknév pontosan"
              className="h-11 rounded-none border-white/10 bg-black text-white"
            />
            {error ? <p className="text-sm font-bold text-rose-400">{error}</p> : null}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              className="rounded-none border-white/10 text-white hover:bg-white/5"
            >
              Mégse
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={!deleteConfirmed || isDeleting}
              className="rounded-none bg-rose-600 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Törlés..." : "Termék törlése"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
