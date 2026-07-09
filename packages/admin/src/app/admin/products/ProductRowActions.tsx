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
      <div className="flex justify-end gap-1">
        <Dialog
          open={restoreOpen}
          onOpenChange={(open) => {
            setRestoreOpen(open)
            if (!open) setError(null)
          }}
        >
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" title="Visszaállítás">
              <RotateCcw className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Termék visszaállítása</DialogTitle>
              <DialogDescription>
                A termék visszakerül az admin listába, de inaktív és rejtett marad, amíg újra nem publikálod.
              </DialogDescription>
            </DialogHeader>
            <p className="bg-muted rounded-md border px-3 py-2 font-mono text-sm">{productName}</p>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRestoreOpen(false)} disabled={isRestoring}>
                Mégse
              </Button>
              <Button type="button" onClick={handleRestore} disabled={isRestoring}>
                {isRestoring ? "Visszaállítás..." : "Biztonságos visszaállítás"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" asChild title="Megtekintés">
        <Link href={`/products/${productSlug}`} target="_blank">
          <ExternalLink className="size-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild title="Szerkesztés">
        <Link href={`/admin/products/${productId}`}>
          <Edit2 className="size-4" />
        </Link>
      </Button>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) resetDeleteDialog()
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="text-destructive" title="Törlés">
            <Trash2 className="size-4" />
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
            <p className="bg-muted rounded-md border px-3 py-2 font-mono text-sm">{productName}</p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Terméknév pontosan"
            />
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Mégse
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!deleteConfirmed || isDeleting}
            >
              {isDeleting ? "Törlés..." : "Termék törlése"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
