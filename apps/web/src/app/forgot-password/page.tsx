"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/api";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const client = createPublicClient();
      await client.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-gold-light/10 blur-[160px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <LogoIcon className="h-10 w-auto text-gold" />
            <span className="text-3xl font-serif italic tracking-[0.1em] text-cream">On The List</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-void/80 p-8 backdrop-blur-sm">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
              <h1 className="text-xl font-bold text-cream">Check your email</h1>
              <p className="mt-2 text-sm text-cream/60">
                If an account exists for <span className="font-medium text-cream/80">{email}</span>, we&apos;ve sent a password reset link.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gold hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-cream">Forgot password?</h1>
                <p className="mt-1.5 text-sm text-cream/60">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cream/60">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-surface/60 py-3 pl-10 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-gold to-gold-light py-3 text-sm font-semibold text-cream transition hover:from-gold hover:to-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-white" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-cream/60">
                <Link href="/login" className="font-medium text-gold hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
