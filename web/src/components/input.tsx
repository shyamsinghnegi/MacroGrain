import { InputHTMLAttributes, SelectHTMLAttributes } from "react"

// Inset/pressed inputs — see design_handoff_macrograin/README.md "Elevation"
const inputClass =
  "w-full rounded-input bg-card px-3 py-2 text-text shadow-inset-input outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClass} ${className}`} {...props} />
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-xs tracking-wide text-text-muted uppercase"
    >
      {children}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-warning">{message}</p>
}
