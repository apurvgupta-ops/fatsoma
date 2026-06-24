import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Cormorant_Garamond,
  Inter,
  Playfair_Display,
  Jost,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "On The List — Student Ticket Marketplace",
  description:
    "The student ticket platform that moves with your plans. Buy early, un-buy later.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${jost.variable} ${plexMono.variable} ${cormorant.variable} ${inter.variable} ${playfair.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

