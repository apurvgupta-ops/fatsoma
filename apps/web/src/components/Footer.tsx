"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-void">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <Check className="h-5 w-5 text-gold" />
              <span className="text-xl font-serif font-semibold italic text-gold">
                On The List
              </span>
            </Link>
            <p className="mt-4 text-sm text-cream/70 leading-relaxed">
              Secure student ticket transfers. No scalping, no scams. You always pay the current release price.
            </p>
            <p className="mt-6 text-xs text-cream/50">
              © {new Date().getFullYear()} On The List. All rights reserved.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cream/60 mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li><Link href="/how-it-works" className="text-sm text-cream/80 hover:text-gold transition">How It Works</Link></li>
                <li><Link href="/trust-safety" className="text-sm text-cream/80 hover:text-gold transition">Trust & Safety</Link></li>
                <li><Link href="/pricing" className="text-sm text-cream/80 hover:text-gold transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cream/60 mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                <li><Link href="/help-centre" className="text-sm text-cream/80 hover:text-gold transition">Help Centre</Link></li>
                <li><Link href="/contact" className="text-sm text-cream/80 hover:text-gold transition">Contact</Link></li>
                <li><Link href="/terms" className="text-sm text-cream/80 hover:text-gold transition">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
