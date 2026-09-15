import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Doto, IBM_Plex_Mono, IBM_Plex_Sans, Orbitron, Rajdhani, Playfair_Display, Lora, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ToastFromParam } from "@/components/toast";
import { TimezoneSync } from "@/components/timezone-sync";
import { DayRolloverRefresh } from "@/components/day-rollover-refresh";
import { PageTransition } from "@/components/page-transition";
import { auth } from "@/auth";
import { getThemeSettings } from "@/lib/theme";
import { hasCompletedOnboarding } from "@/lib/onboarding";

const doto = Doto({
  variable: "--font-doto-loaded",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans-loaded",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// "Cyberpunk" font-style option: Orbitron for hero numerals (angular
// sci-fi/HUD face, replacing Doto), Rajdhani for data/body text (condensed
// techy face, replacing both mono and sans). Only loaded once - next/font
// self-hosts and subsets each family at build time, so picking this style
// costs one extra font download the first time a user selects it (or the
// first time it's server-rendered for a user who already has it saved),
// cached by the browser after.
const orbitron = Orbitron({
  variable: "--font-orbitron-loaded",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  preload: false,
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: false,
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-loaded",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Macrograin",
  description: "Macro and calorie tracker",
  applicationName: "Macrograin",
  // iOS Safari doesn't read manifest.ts's icons/name for "Add to Home
  // Screen" the way Chrome reads manifest.webmanifest - it needs these
  // specific meta tags/link relations instead.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Macrograin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  // Cookie-only read (see lib/theme.ts) - no DB query on every navigation.
  // A brand new session with no cookie yet gets the "dark"/"lime"/"default"
  // defaults, which match profiles' own column defaults, so there's no
  // flash-of-wrong-theme even before TimezoneSync-style cookie sync (theme
  // has no client-detection step to wait for - it's saved directly by the
  // settings action, so the cookie exists from the moment it's first changed).
  const { theme, accentColor, fontStyle, themePreset } = await getThemeSettings();
  // Every named palette (see globals.css's [data-palette] blocks) is a dark
  // palette - forcing data-theme to "dark" whenever one is active prevents
  // the light-mode-specific shadow overrides (globals.css's
  // `:root[data-theme="light"] .shadow-card` etc.) from applying on top of
  // a palette's own dark card colors, which would otherwise happen if the
  // user had picked "Light" before switching to a palette.
  const effectiveTheme = themePreset === "none" ? theme : (themePreset.includes("light") ? "light" : "dark");

  const onboarded = await hasCompletedOnboarding();

  return (
    <html
      lang="en"
      data-theme={effectiveTheme}
      data-accent={themePreset === "none" ? accentColor : "palette"}
      data-palette={themePreset}
      className={`${doto.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} ${orbitron.variable} ${rajdhani.variable} ${playfairDisplay.variable} ${lora.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body data-font={fontStyle} className="min-h-full flex flex-col">
        <PageTransition>
          <main className="flex flex-1 flex-col">{children}</main>
        </PageTransition>
        {session?.user && onboarded && <BottomNav />}
        {session?.user && <TimezoneSync />}
        {session?.user && <DayRolloverRefresh />}
        <Suspense fallback={null}>
          <ToastFromParam />
        </Suspense>
      </body>
    </html>
  );
}
