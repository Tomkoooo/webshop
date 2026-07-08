import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { auth } from "@wse/core/auth";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl border border-white/10 bg-white/5 p-10 md:p-14 text-center space-y-7">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider">
            Karbantartas alatt
          </h1>
          <p className="text-white/70">
            Az oldal jelenleg karbantartas miatt ideiglenesen nem erheto el.
          </p>
          <p className="text-white/50 text-sm">
            Hamarosan visszaterunk. Koszonjuk a turelmet.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Adminisztratoroknak
          </p>
          <Link
            href="/api/auth/signin?callbackUrl=/admin"
            className="inline-flex h-12 px-6 items-center justify-center bg-primary text-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Admin bejelentkezes
          </Link>
        </div>
      </div>
    </main>
  );
}
