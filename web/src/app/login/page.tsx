"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AuthPageLayout,
  TicketBadge,
  AuthHeading,
  AuthField,
  AuthInput,
  PasswordToggle,
  AuthSubmitButton,
  AuthDivider,
  SocialAuthButtons,
  AuthError,
  IconMail,
  IconLock,
} from "@/components/auth/AuthUi";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const signupHref =
    redirectTo !== "/"
      ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
      : "/signup";

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthPageLayout>
      <TicketBadge />

      <AuthHeading
        title="Welcome"
        highlight="back."
        subtitle="Sign in to access your tickets."
      />

      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <AuthField label="Email address" icon={<IconMail />}>
          <AuthInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </AuthField>

        <div className="flex flex-col gap-1.5">
          <AuthField label="Password" icon={<IconLock />}>
            <AuthInput
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </AuthField>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-gold transition-opacity hover:opacity-80"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthSubmitButton loading={loading}>Sign in</AuthSubmitButton>
      </form>

      <AuthDivider />
      <SocialAuthButtons />

      <p className="m-0 text-center text-xs text-[#9A9488]">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="text-gold hover:opacity-80">
          Sign up
        </Link>
      </p>
    </AuthPageLayout>
  );
}
