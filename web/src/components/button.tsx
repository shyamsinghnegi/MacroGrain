import { ButtonHTMLAttributes } from "react"

// Pill buttons — see design_handoff_macrograin/Macrograin.dc.html
// Primary: high-contrast light pill (most buttons — Scan, Search, list adds).
// Accent: lime-filled + glow, reserved for the single "commit this flow
// forward" CTA per screen (Continue, Add to log, Verify & add, Accept new
// target) — confirmed by checking every <button> in the design board, not
// just the general README "Interactive states" table.
// Secondary: outlined, low-contrast.

const base =
  "inline-flex items-center justify-center rounded-pill px-5 py-2 text-sm font-medium transition-all duration-150 outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] disabled:cursor-not-allowed"

const variants = {
  primary:
    "bg-text text-bg hover:bg-white hover:shadow-[0_0_22px_rgba(255,255,255,.18)] active:bg-[#c9c9c9] active:translate-y-px disabled:bg-[#1c1c1c] disabled:text-[#4a4a4a] disabled:shadow-none",
  accent:
    "bg-accent text-bg font-bold shadow-accent-glow hover:brightness-110 active:brightness-95 active:translate-y-px disabled:bg-[#1c1c1c] disabled:text-[#4a4a4a] disabled:shadow-none",
  secondary:
    "border-[1.5px] border-white/20 text-text hover:border-white/40 active:translate-y-px disabled:border-white/10 disabled:text-[#4a4a4a]",
}

// Exported so <Link> (which can't be a <button>) can share the exact same
// pill styling — e.g. <Link className={buttonClass("primary")}>.
export function buttonClass(variant: keyof typeof variants = "primary") {
  return `${base} ${variants[variant]}`
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}) {
  return <button className={`${buttonClass(variant)} ${className}`} {...props} />
}
