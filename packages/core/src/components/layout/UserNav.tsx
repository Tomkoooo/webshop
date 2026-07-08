"use client"

import Link from "next/link"
import { useSession, signOut, signIn } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wse/core/components/ui/dropdown-menu"
import { Button } from "@wse/core/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@wse/core/components/ui/avatar"
import { LayoutDashboard, LogOut, User, Package, LogIn } from "lucide-react"

export function UserNav() {
  const { data: session, status } = useSession()

  // Avoid an empty navbar slot while NextAuth resolves (common on iOS Safari cold start).
  if (status === "loading" || !session) {
    return (
      <Button
        onClick={() => signIn("google")}
        variant="ghost"
        disabled={status === "loading"}
        aria-label="Bejelentkezés"
        className="px-0 text-xs font-black uppercase tracking-[0.2em] text-foreground hover:bg-transparent hover:text-primary-foreground disabled:opacity-70"
      >
        <LogIn className="h-5 w-5 shrink-0 2xl:mr-2" aria-hidden />
        <span className="hidden 2xl:inline">Bejelentkezés</span>
      </Button>
    )
  }

  const user = session!.user
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border hover:border-primary-foreground/50 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback className="bg-muted/40 text-foreground text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background-dark border-border text-foreground" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-black leading-none uppercase tracking-wider">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer flex items-center gap-2 hover:bg-muted/40 focus:bg-muted/40">
            <User className="mr-2 h-4 w-4 text-primary-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest">Profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/orders" className="cursor-pointer flex items-center gap-2 hover:bg-muted/40 focus:bg-muted/40">
            <Package className="mr-2 h-4 w-4 text-primary-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest">Rendelések</span>
          </Link>
        </DropdownMenuItem>
        
        {user?.role === "ADMIN" && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer flex items-center gap-2 hover:bg-muted/40 focus:bg-muted/40">
                <LayoutDashboard className="mr-2 h-4 w-4 text-primary-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="cursor-pointer flex items-center gap-2 text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Kijelentkezés</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
