"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

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
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[140px]" />

        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">Admin Panel</h1>
              <p className="mt-2 text-sm text-zinc-400">Sign in to manage events</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                    <p className="text-sm text-rose-300">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-100">Email</label>
                  <input id="email" name="email" type="email" required autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                    placeholder="you@example.com" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-zinc-100">Password</label>
                  <input id="password" name="password" type="password" required autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                    placeholder="••••••••" />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
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
