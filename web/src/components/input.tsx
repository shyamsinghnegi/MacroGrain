import { InputHTMLAttributes, SelectHTMLAttributes, useId } from "react"

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

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return <p id={id} className="text-sm text-warning">{message}</p>
}

export function InputGroup({
  label,
  error,
  children,
  className = "",
}: {
  label: string
  error?: string
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode
  className?: string
}) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      {children({ 
        id, 
        "aria-describedby": errorId,
        "aria-invalid": !!error
      })}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
