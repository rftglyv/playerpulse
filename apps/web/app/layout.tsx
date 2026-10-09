import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Agentation } from "agentation";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: "%s · PlayerPulse" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "game QA", "player feedback analysis", "game telemetry", "bug triage", "Steam reviews analysis",
    "Discord feedback", "live ops", "playtest analytics", "AI QA for games", "multilingual sentiment",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: "/",
    title: SITE.tagline,
    description: SITE.description,
    images: [{ url: "/og/og-home.png", width: 1200, height: 630, alt: "PlayerPulse: player complaints in, real bugs out" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.tagline,
    description: SITE.description,
    images: ["/og/og-home.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#2563eb" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
