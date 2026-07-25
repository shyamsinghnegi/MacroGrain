"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { saveAppearance } from "../appearance-actions"
import { Button } from "@/components/button"
import type { themeMode, accentColor, fontStyle, themePreset } from "@/db/schema"

type Theme = (typeof themeMode)[number]
type Accent = (typeof accentColor)[number]
type Font = (typeof fontStyle)[number]
type Palette = (typeof themePreset)[number]

const themes: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
]

const accents: { value: Accent; label: string; swatch: string }[] = [
  { value: "lime", label: "Lime", swatch: "#c6f24d" },
  { value: "blue", label: "Blue", swatch: "#4d9dff" },
  { value: "pink", label: "Pink", swatch: "#ff6fb0" },
  { value: "orange", label: "Orange", swatch: "#ff9a4d" },
]

// Named full palettes - each overrides background/card/text/accent
// together (see globals.css's [data-palette] blocks for the actual hex
// values), lifted from specific reference palettes rather than being a
// tinted variant of the plain dark/light base. Picking one of these makes
// the Theme/Accent pickers below inert (their stored values are kept as a
// fallback, not cleared, in case the palette is ever removed) - "None"
// returns control to those two pickers.
const palettes: { value: Palette; label: string; bg: string; card: string; accent: string }[] = [
  { value: "none", label: "None", bg: "", card: "", accent: "" },
  { value: "old_money", label: "Old Money", bg: "#100e0d", card: "#161413", accent: "#de5c5c" },
  { value: "blue_fantastic", label: "Blue Fantastic", bg: "#10151f", card: "#161d29", accent: "#ff9a4d" },
  { value: "kombu", label: "Kombu", bg: "#0e130a", card: "#141b10", accent: "#a3ad78" },
]

const fonts: { value: Font; label: string; description: string }[] = [
  { value: "default", label: "Default", description: "Doto numerals, mono data, sans body" },
  { value: "mono", label: "Mono", description: "Monospace throughout, Doto numerals only" },
  { value: "classic", label: "Classic", description: "Sans-serif everywhere, no dot-matrix numerals" },
  { value: "cyberpunk", label: "Cyberpunk", description: "Orbitron numerals, Rajdhani data & body" },
]

// Applies the pick directly to the live document so the picker previews
// instantly, the same way it'll actually render once saved (layout.tsx
// stamps these same attributes server-side from the saved cookie/profile).
// This is a preview only - nothing is persisted until "Save" submits the
// form, so navigating away without saving leaves the real setting
// unchanged (a page refresh reverts the live preview to what's actually saved).
function applyPreview(theme: Theme, accentColor: Accent, fontStyle: Font, palette: Palette) {
  // Palettes are all dark - force data-theme so the light-mode shadow
  // overrides in globals.css don't fight a palette's own dark colors,
  // matching the same rule layout.tsx applies server-side.
  document.documentElement.setAttribute("data-theme", palette === "none" ? theme : "dark")
  document.documentElement.setAttribute("data-accent", accentColor)
  document.documentElement.setAttribute("data-palette", palette)
  document.body.setAttribute("data-font", fontStyle)
}

export function AppearanceForm({
  initialTheme,
  initialAccentColor,
  initialFontStyle,
  initialThemePreset,
}: {
  initialTheme: Theme
  initialAccentColor: Accent
  initialFontStyle: Font
  initialThemePreset: Palette
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [accent, setAccent] = useState<Accent>(initialAccentColor)
  const [font, setFont] = useState<Font>(initialFontStyle)
  const [palette, setPalette] = useState<Palette>(initialThemePreset)

  useEffect(() => {
    applyPreview(theme, accent, font, palette)
  }, [theme, accent, font, palette])

  const usingPalette = palette !== "none"

  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 flex items-center gap-3.5">
        <Link href="/settings" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-lg font-semibold text-text">Appearance</p>
      </div>

      <form action={saveAppearance} className="flex flex-col gap-6">
        <input type="hidden" name="theme" value={theme} />
        <input type="hidden" name="accentColor" value={accent} />
        <input type="hidden" name="fontStyle" value={font} />
        <input type="hidden" name="themePreset" value={palette} />

        <div className="flex flex-col gap-2">
          <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Palette
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {palettes.map((p) => {
              const active = palette === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPalette(p.value)}
                  className={`flex items-center gap-2.5 rounded-card border px-3.5 py-3 ${
                    active ? "border-accent" : "border-hairline"
                  }`}
                >
                  {p.value === "none" ? (
                    <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-hairline">
                      <Check size={14} className={active ? "text-accent" : "text-transparent"} />
                    </span>
                  ) : (
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-hairline"
                      style={{ background: p.card }}
                    >
                      <span className="size-3.5 rounded-full" style={{ background: p.accent }} />
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-text">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`flex flex-col gap-2 ${usingPalette ? "opacity-40" : ""}`}>
          <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Theme{usingPalette ? " (set by palette)" : ""}
          </p>
          <div className="flex gap-1.5 rounded-hero border border-hairline bg-card p-1.5">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={usingPalette}
                onClick={() => setTheme(t.value)}
                className={`flex-1 rounded-input py-3.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed ${
                  theme === t.value && !usingPalette ? "bg-accent text-bg" : "text-text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-2 ${usingPalette ? "opacity-40" : ""}`}>
          <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Accent color{usingPalette ? " (set by palette)" : ""}
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {accents.map((a) => (
              <button
                key={a.value}
                type="button"
                disabled={usingPalette}
                onClick={() => setAccent(a.value)}
                aria-label={a.label}
                className="flex flex-col items-center gap-1.5 rounded-card border border-hairline bg-card py-3.5 disabled:cursor-not-allowed"
              >
                <span
                  className="flex size-8 items-center justify-center rounded-full"
                  style={{ background: a.swatch }}
                >
                  {accent === a.value && !usingPalette && (
                    <Check size={16} className="text-bg" strokeWidth={3} />
                  )}
                </span>
                <span className="font-mono text-[10px] text-text-muted">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Font
          </p>
          <div className="flex flex-col gap-2">
            {fonts.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFont(f.value)}
                className={`flex items-center justify-between rounded-card border px-4 py-3.5 text-left transition-colors ${
                  font === f.value
                    ? "border-accent bg-card"
                    : "border-hairline bg-card"
                }`}
              >
                <div>
                  <p className="text-sm text-text">{f.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                    {f.description}
                  </p>
                </div>
                {font === f.value && <Check size={16} className="text-accent" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-hero bg-surface p-5 shadow-hero">
          <p className="label-mono font-doto text-[10px] tracking-[0.2em] text-text-muted uppercase">
            Preview
          </p>
          <p className="mt-2 font-doto text-4xl font-black text-accent">1850</p>
          <p className="mt-1 font-mono text-sm text-text-muted">kcal remaining today</p>
          <p className="mt-2 text-sm text-text">
            This card updates live as you change palette, theme, accent, and font.
          </p>
        </div>

        <Button type="submit" variant="accent">
          Save appearance
        </Button>
      </form>
    </div>
  )
}
