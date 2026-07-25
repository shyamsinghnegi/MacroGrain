import "server-only"
import { cookies } from "next/headers"
import type { themeMode, accentColor, fontStyle, themePreset } from "@/db/schema"

const THEME_COOKIE = "mg_theme"
const ACCENT_COOKIE = "mg_accent"
const FONT_COOKIE = "mg_font"
const PALETTE_COOKIE = "mg_palette"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

// Same rationale as lib/timezone.ts's getTimezone(): read appearance
// settings from cookies (zero DB queries on every layout render) rather
// than fetching the profile row fresh on every navigation. The cookies are
// set directly by the settings Server Action the moment it saves, so
// there's no lag waiting for a client effect to run (unlike timezone
// detection, which genuinely needs the browser to tell us something the
// server can't know).
export async function getThemeSettings(fallback?: {
  theme?: (typeof themeMode)[number]
  accentColor?: (typeof accentColor)[number]
  fontStyle?: (typeof fontStyle)[number]
  themePreset?: (typeof themePreset)[number]
}) {
  const cookieStore = await cookies()
  return {
    theme: (cookieStore.get(THEME_COOKIE)?.value as (typeof themeMode)[number] | undefined) ??
      fallback?.theme ??
      "dark",
    accentColor:
      (cookieStore.get(ACCENT_COOKIE)?.value as (typeof accentColor)[number] | undefined) ??
      fallback?.accentColor ??
      "lime",
    fontStyle:
      (cookieStore.get(FONT_COOKIE)?.value as (typeof fontStyle)[number] | undefined) ??
      fallback?.fontStyle ??
      "default",
    themePreset:
      (cookieStore.get(PALETTE_COOKIE)?.value as (typeof themePreset)[number] | undefined) ??
      fallback?.themePreset ??
      "none",
  }
}

export async function setThemeCookies(settings: {
  theme: (typeof themeMode)[number]
  accentColor: (typeof accentColor)[number]
  fontStyle: (typeof fontStyle)[number]
  themePreset: (typeof themePreset)[number]
}) {
  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE, settings.theme, { maxAge: COOKIE_MAX_AGE, path: "/" })
  cookieStore.set(ACCENT_COOKIE, settings.accentColor, { maxAge: COOKIE_MAX_AGE, path: "/" })
  cookieStore.set(FONT_COOKIE, settings.fontStyle, { maxAge: COOKIE_MAX_AGE, path: "/" })
  cookieStore.set(PALETTE_COOKIE, settings.themePreset, { maxAge: COOKIE_MAX_AGE, path: "/" })
}
