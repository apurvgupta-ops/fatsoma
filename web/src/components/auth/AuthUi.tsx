"use client";

import Link from "next/link";
import { useState } from "react";
import Header, { SITE_HEADER_OFFSET } from "@/components/Header";
import Footer from "@/components/Footer";

const M = "#9A9488";

export function AuthPageLayout({
  children,
  cardClassName = "",
}: {
  children: React.ReactNode;
  cardClassName?: string;
}) {
  return (
    <div className={`min-h-screen bg-void ${SITE_HEADER_OFFSET}`}>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(rgba(10,10,10,0.78), rgba(10,10,10,0.78)), url(/hero-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0A0A0A",
        }}
      >
        <Header />
        <div className="relative z-[2] flex min-h-[calc(100dvh-9rem)] items-center justify-center px-6 py-12 pb-16 mb-32 sm:mb-40">
          <div
            className={`flex w-full max-w-[440px] flex-col gap-3 rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[rgba(20,20,20,0.55)] p-6 px-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-[20px] animate-[fadeInUp_450ms_cubic-bezier(0.16,1,0.3,1)_both] ${cardClassName}`}
          >
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export function TicketBadge() {
  return (
    <div className="flex justify-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] bg-[radial-gradient(circle,rgba(201,168,76,0.10),transparent_70%)] shadow-[0_0_30px_rgba(201,168,76,0.12)]">
        <IconTicketBadge />
        <span className="absolute -top-1 right-[3px] h-[3px] w-[3px] rounded-full bg-[rgba(201,168,76,0.6)]" />
        <span className="absolute bottom-0 -left-1.5 h-0.5 w-0.5 rounded-full bg-[rgba(201,168,76,0.4)]" />
        <span className="absolute top-1.5 -left-[7px] h-0.5 w-0.5 rounded-full bg-[rgba(201,168,76,0.5)]" />
      </div>
    </div>
  );
}

export function AuthHeading({
  title,
  highlight,
  subtitle,
}: {
  title: string;
  highlight: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <h1 className="font-cormorant m-0 text-[26px] font-semibold text-cream">
        {title} <span className="text-gold">{highlight}</span>
      </h1>
      <p className="m-0 text-xs text-[#9A9488]">{subtitle}</p>
    </div>
  );
}

export function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-cream">{label}</label>
      <div className="flex items-center gap-2.5 rounded-[10px] border border-[#2A2A2A] bg-void px-3.5 py-2.5">
        {icon}
        {children}
      </div>
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`otl-input min-w-0 flex-1 border-none bg-transparent text-[13px] text-cream outline-none ${props.className ?? ""}`}
    />
  );
}

export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex shrink-0 cursor-pointer border-none bg-transparent p-0"
      aria-label="Toggle password visibility"
    >
      <IconEye open={visible} />
    </button>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const enabled = !disabled && !loading;

  return (
    <button
      type="submit"
      disabled={!enabled}
      onMouseEnter={() => enabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full cursor-pointer rounded-[10px] border-none py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed"
      style={{
        background: enabled ? (hovered ? "#E3B76C" : "#C9A84C") : "#2A2A2A",
        color: enabled ? "#0A0A0A" : "#6B665C",
      }}
    >
      {loading ? (
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A]" />
      ) : (
        children
      )}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2A2A2A]" />
      <span className="font-jost text-[11px] tracking-[0.15em] text-[#6B665C] uppercase">
        Or
      </span>
      <div className="h-px flex-1 bg-[#2A2A2A]" />
    </div>
  );
}

export function SocialAuthButtons() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      {(["apple", "google"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          onMouseEnter={() => setHovered(provider)}
          onMouseLeave={() => setHovered(null)}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border bg-transparent py-[11px] text-xs font-medium text-cream transition-colors"
          style={{
            borderColor: hovered === provider ? "#C9A84C" : "#2A2A2A",
          }}
        >
          {provider === "apple" ? <IconApple /> : <IconGoogle />}
          Continue with {provider === "apple" ? "Apple" : "Google"}
        </button>
      ))}
    </div>
  );
}

export function AuthCloseButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border bg-[rgba(20,20,20,0.6)] transition-colors"
      style={{ borderColor: hovered ? "#C9A84C" : "#2A2A2A" }}
      aria-label="Close"
    >
      <IconClose color={hovered ? "#C9A84C" : "#F5F0E8"} />
    </Link>
  );
}

export function TermsCheckbox({
  agreed,
  onChange,
}: {
  agreed: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => onChange(!agreed)}
        className="mt-0.5 flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors"
        style={{
          borderColor: agreed ? "#C9A84C" : "rgba(201,168,76,0.4)",
          background: agreed ? "#C9A84C" : "transparent",
        }}
        aria-pressed={agreed}
      >
        {agreed && <IconCheck />}
      </button>
      <p className="m-0 text-xs leading-relaxed text-[#9A9488]">
        I agree to the{" "}
        <Link href="/terms" className="text-gold hover:opacity-80">
          Terms of Service
        </Link>{" "}
        and{" "}
        <span className="text-gold">Privacy Policy</span>.
      </p>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
      {message}
    </div>
  );
}

function IconTicketBadge() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C9A84C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Z" />
      <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconMail() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={M}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function IconLock() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={M}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={M}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={M}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

function IconClose({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5L9.5 17L19 6.5" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5F0E8">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-3.014 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.06.28.06.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.86-1.01.5 0 2.27.05 3.66 1.31-.087.06-2.184 1.27-2.184 3.91 0 3.07 2.68 4.16 2.74 4.18z" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.69C4.672 4.564 6.656 2.98 9 2.98z"
      />
    </svg>
  );
}
