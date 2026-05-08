import type { LucideIcon } from "lucide-react";
import {
  Search,
  ShoppingCart,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Lock,
} from "lucide-react";

export const howItWorksPageSubtitle =
  "Buy early, if plans change, get your money back. Every transfer is secure, every price is fair, and scalping is impossible by design.";

export const homeHowItWorksIntro =
  "Buy early, if plans change, get your money back. Every transfer is secure, every price is fair, and scalping is impossible by design.";

export const browseBuySectionSubtitle = "Your journey from discovery to doorstep";

export const browseBuySteps: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    number: "01",
    icon: Search,
    title: "Find Your Event",
    description:
      "Browse upcoming student events. Every listing shows the current tier price — the earlier you buy, the cheaper your ticket. Prices only ever go up as the event fills.",
  },
  {
    number: "02",
    icon: ShoppingCart,
    title: "Select & Checkout",
    description:
      "Go to your ticket and tap Resell. It lists immediately at today's tier price — set by the platform, not you. You get back exactly what you paid. Resale is open from the moment you buy and closes one hour before the event.",
  },
  {
    number: "03",
    icon: QrCode,
    title: "Get Your QR Code",
    description:
      "A unique, tamper-proof QR code is issued to your account. If you ever resell your ticket, this QR is instantly cancelled and a new one is generated for the buyer. Show it at the door — that's your ticket in.",
  },
];

export const builtForFairnessFeatures: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Secure Resale",
    description:
      "Need to sell your ticket? List it in one tap. The platform automatically sets the resale price at today's tier — you get back exactly what you originally paid. Your old QR is instantly cancelled and a new one goes to the buyer. No screenshots. No scams. No WhatsApp anxiety.",
  },
  {
    icon: RefreshCw,
    title: "Atomic Transfers",
    description:
      "Every resale is an atomic operation — the old ticket is voided and the new one is created in a single step. There is never a moment where two valid tickets exist for the same event. Payment goes through, ownership changes, old QR dies, new QR lives — one pipeline, no gaps.",
  },
  {
    icon: Lock,
    title: "Your Money Is Safe",
    description:
      "Buy early without the fear of being stuck. If your plans change, you list your ticket and get back exactly what you paid — guaranteed. Prices only go up, never down, so your original spend is always covered. No risk, no loss.",
  },
];

export const resaleModelSummary =
  "You bought an early bird ticket for £10. The event sells out and the tier price rises to £30. You list it for resale — the platform sets the price at £30 automatically. A new buyer pays £30. You get your £10 back. The organiser gets the £20 difference. The scalper gets nothing, because the resale price is never yours to pocket.";
