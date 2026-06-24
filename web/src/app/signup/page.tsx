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
  AuthCloseButton,
  TermsCheckbox,
  AuthError,
  IconUser,
  IconMail,
  IconLock,
} from "@/components/auth/AuthUi";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { user, loading: authLoading, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

    if (!agreed) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loginHref =
    redirectTo !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login";

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthPageLayout cardClassName="relative">
      <AuthCloseButton />
      <TicketBadge />

      <AuthHeading
        title="Create"
        highlight="your account."
        subtitle="Sign up to buy and sell tickets."
      />

      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <AuthField label="Full name" icon={<IconUser />}>
          <AuthInput
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </AuthField>

        <AuthField label="Email address" icon={<IconMail />}>
          <AuthInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </AuthField>

        <div className="flex flex-col gap-3 min-[480px]:flex-row">
          <div className="min-w-0 flex-1">
            <AuthField label="Password" icon={<IconLock />}>
              <AuthInput
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </AuthField>
          </div>
          <div className="min-w-0 flex-1">
            <AuthField label="Confirm password" icon={<IconLock />}>
              <AuthInput
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              <PasswordToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
              />
            </AuthField>
          </div>
        </div>

        <TermsCheckbox agreed={agreed} onChange={setAgreed} />

        <AuthSubmitButton loading={loading} disabled={!agreed}>
          Sign up
        </AuthSubmitButton>
      </form>

      <AuthDivider />
      <SocialAuthButtons />

      <p className="m-0 text-center text-xs text-[#9A9488]">
        Already have an account?{" "}
        <Link href={loginHref} className="text-gold hover:opacity-80">
          Sign in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
