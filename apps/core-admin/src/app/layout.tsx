import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "WSE Core Admin",
  description: "Control plane for Webshop Engine deployments",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4">
          <a href="/" className="text-sm font-black uppercase tracking-widest text-white">
            WSE Core Admin
          </a>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
