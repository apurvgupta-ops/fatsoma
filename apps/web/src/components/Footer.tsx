"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <Link href="/" className="group flex items-center gap-2">
              <Check className="h-4 w-4 text-gold transition-colors" />
              <span className="font-serif text-lg font-semibold tracking-tight text-cream transition-colors group-hover:text-gold">
                On The List
              </span>
            </Link>
            <p className="text-muted mt-3 max-w-xs text-sm leading-relaxed">
              Secure student ticket transfers. No scalping, no scams. You always
              pay the current release price.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-cream/40">
                Platform
              </span>
              <Link
                href="/how-it-works"
                className="text-muted transition-colors hover:text-cream"
              >
                How It Works
              </Link>
              <Link
                href="/trust-safety"
                className="text-muted transition-colors hover:text-cream"
              >
                Trust & Safety
              </Link>
              <Link
                href="/pricing"
                className="text-muted transition-colors hover:text-cream"
              >
                Pricing
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-cream/40">
                Support
              </span>
              <Link
                href="/help-centre"
                className="text-muted transition-colors hover:text-cream"
              >
                Help Centre
              </Link>
              <Link
                href="/contact"
                className="text-muted transition-colors hover:text-cream"
              >
                Contact
              </Link>
              <Link
                href="/terms"
                className="text-muted transition-colors hover:text-cream"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-cream/40">
          © {new Date().getFullYear()} On The List. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
