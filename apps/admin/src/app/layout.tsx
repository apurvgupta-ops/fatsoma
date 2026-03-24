import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "OnTheList Admin",
  description: "Organizer admin panel for managing events and users.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} ${cormorant.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
