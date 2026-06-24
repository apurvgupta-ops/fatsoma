"use client";

import Header, { SITE_HEADER_OFFSET } from "@/components/Header";
import Footer from "@/components/Footer";
import useFadeIn from "@/hooks/useFadeIn";

export function ContentPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-void ${SITE_HEADER_OFFSET}`}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  meta,
  subtitle,
  titleClassName = "font-display text-[clamp(36px,5vw,64px)] font-bold leading-[1.05] text-cream",
}: {
  eyebrow: string;
  title: React.ReactNode;
  meta?: string;
  subtitle?: string;
  titleClassName?: string;
}) {
  return (
    <section className="page-hero">
      <div className="page-content !pb-0 !pt-0" style={{ padding: "0 24px" }}>
        <p className="font-sans m-0 mb-5 text-[11px] font-medium tracking-[0.2em] text-gold uppercase">
          {eyebrow}
        </p>
        <h1 className={`m-0 mb-8 ${titleClassName}`}>{title}</h1>
        {subtitle && (
          <p className="m-0 max-w-[480px] font-sans text-base font-light leading-[1.7] text-[rgba(245,240,232,0.55)]">
            {subtitle}
          </p>
        )}
        {meta && (
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px w-8 bg-gold opacity-50" />
            <span className="font-sans text-[13px] font-light text-[rgba(245,240,232,0.65)]">
              {meta}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function FadeInBlock({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useFadeIn();

  return (
    <section
      ref={ref}
      className={`fade-in-section ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export function FadeInSection({
  children,
  className = "",
  style,
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  narrow?: boolean;
}) {
  const ref = useFadeIn();

  return (
    <section
      ref={ref}
      className={`fade-in-section page-content ${className}`}
      style={{
        ...(narrow ? { maxWidth: "700px" } : {}),
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function ContentDivider() {
  return <div className="mb-12 h-px bg-[rgba(201,168,76,0.08)]" />;
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 font-sans text-[15px] font-light leading-[1.9] text-[rgba(245,240,232,0.65)]">
      {children}
    </p>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display m-0 mb-5 text-[28px] font-bold leading-[1.2] text-cream">
      {children}
    </h2>
  );
}
