"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/Logo";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const user = await login(email, password);
      router.push(user.role === "staff" ? "/scanner" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-cream/90">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-gold-light/20 blur-[140px]" />

        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex items-center gap-3">
                <LogoIcon className="h-10 w-auto text-gold" />
                <span className="text-3xl font-serif italic tracking-[0.1em] text-cream">On The List</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-cream">Admin Panel</h1>
              <p className="mt-2 text-sm text-cream/60">Sign in to manage events</p>
            </div>

            <div className="rounded-3xl border border-border bg-void/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                    <p className="text-sm text-rose-300">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-cream/90">Email</label>
                  <input id="email" name="email" type="email" required autoComplete="email"
                    className="w-full rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream/90 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
                    placeholder="you@example.com" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-cream/90">Password</label>
                  <input id="password" name="password" type="password" required autoComplete="current-password"
                    className="w-full rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream/90 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
                    placeholder="••••••••" />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-linear-to-r from-gold via-gold/80 to-gold-light px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-gold/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

