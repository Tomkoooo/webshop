"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@wse/core/components/ui/button";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("A jelszavak nem egyeznek.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Hiba történt a jelszó módosításakor.");
        return;
      }

      toast.success("A jelszó sikeresen frissítve.");
      router.push("/");
    } catch {
      toast.error("Hálózati hiba történt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-white/10 bg-white/5 p-8 space-y-6"
      >
        <h1 className="text-2xl font-black uppercase tracking-widest">Jelszó visszaállítás</h1>
        <p className="text-sm text-neutral-400">
          Add meg az új jelszavadat. A link egyszer használható.
        </p>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-neutral-500">Új jelszó</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full h-12 bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-primary-foreground/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-neutral-500">Új jelszó újra</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full h-12 bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-primary-foreground/50"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-none bg-primary hover:bg-primary/85 text-white uppercase tracking-widest text-xs font-black"
        >
          {isSubmitting ? "Mentés..." : "Jelszó mentése"}
        </Button>
      </form>
    </main>
  );
}
