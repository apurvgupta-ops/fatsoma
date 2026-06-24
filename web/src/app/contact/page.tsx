"use client";

import { useState } from "react";
import {
  ContentPageLayout,
  PageHero,
  FadeInBlock,
} from "@/components/content/ContentPage";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <ContentPageLayout>
      <PageHero
        eyebrow="Get In Touch"
        title="Contact us."
        subtitle="For event organisers, partnership enquiries, or anything else — reach us below."
        titleClassName="font-display text-[clamp(40px,6vw,64px)] font-light italic leading-[1.05] text-cream"
      />

      <div className="page-content !pt-0">
        <FadeInBlock style={{ maxWidth: "560px" }}>
          <ContactField label="Name">
            <input
              type="text"
              placeholder="Your name"
              className="otl-contact-field"
            />
          </ContactField>

          <ContactField label="Email">
            <input
              type="email"
              placeholder="your@email.com"
              className="otl-contact-field"
            />
          </ContactField>

          <ContactField label="Subject">
            <div className="relative">
              <select defaultValue="" className="otl-contact-field cursor-pointer appearance-none pr-7">
                <option value="" disabled>
                  Select a subject
                </option>
                <option value="organiser">Organiser enquiry</option>
                <option value="partnership">Partnership</option>
                <option value="support">Support</option>
                <option value="other">Something else</option>
              </select>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9A84C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-0 bottom-4 opacity-70"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </ContactField>

          <ContactField label="Message">
            <textarea
              placeholder="Your message"
              rows={5}
              className="otl-contact-field resize-none leading-[1.7]"
            />
          </ContactField>

          <button
            type="button"
            onClick={() => setSent(true)}
            disabled={sent}
            className="hero-btn-primary min-w-[148px] disabled:cursor-default disabled:opacity-50"
          >
            {sent ? "Sent" : "Send message"}
          </button>

          <div className="my-14 h-px bg-[rgba(201,168,76,0.1)]" />
          <p className="m-0 mb-2 font-sans text-[13px] font-light text-[rgba(245,240,232,0.35)]">
            On The List, London, 2026
          </p>
          <a
            href="mailto:hello@onthelyst.com"
            className="font-sans text-[13px] font-light text-[rgba(245,240,232,0.65)] no-underline transition-colors hover:text-gold"
          >
            hello@onthelyst.com
          </a>
        </FadeInBlock>
      </div>
    </ContentPageLayout>
  );
}

function ContactField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-9">
      <label className="mb-2 block font-sans text-[11px] font-light tracking-[0.15em] text-[rgba(245,240,232,0.4)] uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
