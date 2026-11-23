import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { headers } from "next/headers";
import type React from "react";
import { Suspense } from "react";
import { ColorThemeProvider, colorThemeScript } from "@/components/color-theme-provider";
import { CompactModeProvider, compactModeScript } from "@/components/compact-mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Квант-знаний — трекер заданий",
  description: "Больше никаких пропущенных дедлайнов. Отслеживайте задания и успевайте всё вовремя.",
  applicationName: "Квант-знаний",
  openGraph: {
    type: "website",
    siteName: "Квант-знаний",
    title: "Квант-знаний — трекер заданий",
    description: "Больше никаких пропущенных дедлайнов. Отслеживайте задания и успевайте всё вовремя.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Квант-знаний — трекер заданий",
    description: "Больше никаких пропущенных дедлайнов. Отслеживайте задания и успевайте всё вовремя.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ru" suppressHydrationWarning className={`${manrope.variable} ${geistMono.variable}`}>
      <head>
        {/* These run before paint to stop a flash of the wrong theme. Both strings are
            built in this repo from a fixed set of theme ids - no user input reaches them. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, locally-authored FOUC script */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: compactModeScript }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, locally-authored FOUC script */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
          <CompactModeProvider>
            <ColorThemeProvider>
              {children}
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
            </ColorThemeProvider>
          </CompactModeProvider>
        </ThemeProvider>
        {process.env.VERCEL === "1" ? (
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        ) : null}
      </body>
    </html>
  );
}
