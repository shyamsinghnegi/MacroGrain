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
    "bg-text text-bg hover:opacity-90 active:opacity-80 active:translate-y-px disabled:bg-card-alt disabled:text-text-faint disabled:shadow-none",
  accent:
    "bg-accent text-bg font-bold shadow-accent-glow hover:brightness-110 active:brightness-95 active:translate-y-px disabled:bg-card-alt disabled:text-text-faint disabled:shadow-none",
  secondary:
    "border-[1.5px] border-hairline text-text hover:border-text-faint active:translate-y-px disabled:border-hairline disabled:text-text-faint",
}

// Exported so <Link> (which can't be a <button>) can share the exact same
// pill styling — e.g. <Link className={buttonClass("primary")}>.
export function buttonClass(variant: keyof typeof variants = "primary") {
  return `${base} ${variants[variant]}`
}

export function Button({
  variant = "primary",
  className = "",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  isLoading?: boolean
}) {
  const isDisabled = disabled || isLoading
  return (
    <button
      className={`${buttonClass(variant)} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {children}
    </button>
  )
}
