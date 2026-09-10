"use client"

// Dithered pixel-grain texture — see design_handoff_macrograin/README.md
// "Background texture": used sparingly behind heroes/headers, faded with a
// mask. "accent" (the default, and now used on every screen that has this
// texture - dashboard, search, onboarding) follows --color-accent so it
// re-tints with whichever accent/palette the user has picked, rather than
// a plain white/black overlay that ignores the chosen theme. "neutral" is
// kept for any spot that should deliberately NOT pick up the accent color.
//
// Canvas-rendered (not a CSS radial-gradient background-image, as this used
// to be) so individual dots can be animated: each one drifts through a
// slow ambient pulse on its own, and a tap/click sends a brightening ripple
// out from that point. A flat CSS gradient has no per-dot handles to
// animate - real draw calls per dot are what make that possible, and a
// canvas is far cheaper for redrawing hundreds of small circles every
// frame than the same count of real DOM/SVG nodes would be.

import { useEffect, useRef } from "react"
import gsap from "gsap"

const GRID = 14 // px between dot centers - sparser than the old 4px CSS tile,
// which was fine as a static paint but would be several thousand draw calls
// per frame at this component's typical size if animated at that density.
const DOT_RADIUS = 1.1

type Dot = {
  x: number
  y: number
  baseAlpha: number
  phase: number
  ripple: number // 0..1 extra brightness from an active tap ripple, decays over time
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "")
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function DitherBg({
  height = 430,
  fadeAt = 30,
  tint = "accent",
}: {
  height?: number
  fadeAt?: number
  tint?: "neutral" | "accent" | "lime"
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const containerEl = containerRef.current
    if (!canvasEl || !containerEl) return
    const canvas: HTMLCanvasElement = canvasEl
    const container: HTMLDivElement = containerEl

    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return
    const ctx: CanvasRenderingContext2D = ctx2d

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let dots: Dot[] = []
    let width = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let rgb: [number, number, number] = [255, 255, 255]
    let baseAlphaMax = 0.06

    function readColor() {
      const styles = getComputedStyle(document.documentElement)
      if (tint === "neutral") {
        const raw = styles.getPropertyValue("--mg-dither-dot").trim()
        const match = raw.match(/rgba?\(([^)]+)\)/)
        if (match) {
          const parts = match[1].split(",").map((n) => parseFloat(n.trim()))
          rgb = [parts[0] ?? 255, parts[1] ?? 255, parts[2] ?? 255]
          baseAlphaMax = parts[3] ?? 0.06
        }
      } else {
        const accentHex = styles.getPropertyValue("--color-accent").trim() || "#c6f24d"
        rgb = hexToRgb(accentHex)
        baseAlphaMax = 0.18
      }
    }

    function buildGrid() {
      const rect = container.getBoundingClientRect()
      width = rect.width
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      dots = []
      for (let y = GRID / 2; y < height; y += GRID) {
        for (let x = GRID / 2; x < width; x += GRID) {
          dots.push({
            x,
            y,
            baseAlpha: 0.55 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            ripple: 0,
          })
        }
      }
    }

    readColor()
    buildGrid()

    const fadeStart = (fadeAt / 100) * height

    function alphaForY(y: number) {
      if (y <= fadeStart) return 1
      const fadeLen = height - fadeStart
      if (fadeLen <= 0) return 0
      return Math.max(0, 1 - (y - fadeStart) / fadeLen)
    }

    let raf = 0
    const start = performance.now()

    function draw(now: number) {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, width, height)

      for (const dot of dots) {
        const fade = alphaForY(dot.y)
        if (fade <= 0) continue

        // Ambient pulse: slow per-dot sine wave, phase-offset so the whole
        // grid doesn't blink in unison - reads as a gentle organic shimmer.
        const pulse = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(t * 1.1 + dot.phase)
        const alpha = dot.baseAlpha * baseAlphaMax * fade * pulse + dot.ripple * fade

        if (alpha <= 0.001) continue
        ctx.beginPath()
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.min(alpha, 1)})`
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    function triggerRipple(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect()
      const originX = clientX - rect.left
      const originY = clientY - rect.top
      if (originX < 0 || originX > width || originY < 0 || originY > height) return

      for (const dot of dots) {
        const dist = Math.hypot(dot.x - originX, dot.y - originY)
        if (dist < 90) {
          // Nearer dots brighten more, and GSAP owns the entire ripple
          // lifecycle for that dot (fast attack, slower decay back to 0) -
          // the draw loop only ever reads `dot.ripple`, it never writes it,
          // so there's no fight between a manual decay and this tween.
          //
          // `overwrite: true` must NOT be set here (as a timeline default
          // or per-tween): GSAP's overwrite kills *any other* tween of the
          // same properties on the same target, including this timeline's
          // own later children as they start - the previous version of this
          // code set that default and it silently collapsed the whole
          // attack+decay sequence to its last frame on every ripple, so the
          // brightening was never actually visible. `killTweensOf` below
          // already covers the one case overwrite protection is actually
          // needed for (a second tap re-triggering this same dot's ripple
          // before the first has finished).
          const peak = (1 - dist / 90) * 0.5
          gsap.killTweensOf(dot)
          dot.ripple = 0
          gsap
            .timeline()
            .to(dot, { ripple: peak, duration: 0.12, ease: "power1.out" })
            .to(dot, { ripple: 0, duration: 0.5, ease: "power2.out" })
        }
      }
    }

    function onPointerDown(e: PointerEvent) {
      triggerRipple(e.clientX, e.clientY)
    }

    // The canvas stays pointer-events:none (it's a background layer - real
    // page content like buttons and links sits visually on top of it
    // everywhere it's used, and must keep receiving clicks normally).
    // Listening on `document` instead still catches every tap anywhere on
    // the page, since pointer events bubble up regardless of what z-index
    // or element actually handled them; `triggerRipple` itself discards
    // anything outside this instance's own screen region.
    document.addEventListener("pointerdown", onPointerDown, { passive: true })

    const resizeObserver = new ResizeObserver(() => buildGrid())
    resizeObserver.observe(container)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    function onSchemeChange() {
      readColor()
    }
    mediaQuery.addEventListener("change", onSchemeChange)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("pointerdown", onPointerDown)
      resizeObserver.disconnect()
      mediaQuery.removeEventListener("change", onSchemeChange)
      // killTweensOf targets individual tween targets, not the array itself
      // - each dot object was tweened separately by triggerRipple.
      dots.forEach((dot) => gsap.killTweensOf(dot))
    }
  }, [height, fadeAt, tint])

  return (
    <div ref={containerRef} className="absolute top-0 right-0 left-0 overflow-hidden" style={{ height }}>
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  )
}
